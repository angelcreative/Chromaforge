import express from 'express';
import crypto from 'crypto';
import { GoogleGenAI, Type } from '@google/genai';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync, existsSync } from 'fs';
import dotenv from 'dotenv';
import { compileComponent, cleanupOldBundles } from './services/componentCompiler.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Resolver la ruta base: si estamos en dist-server, subir un nivel
const baseDir = __dirname.includes('dist-server') 
  ? join(__dirname, '..') 
  : __dirname;

// Cargar variables de entorno desde .env.local o .env
const envLocalPath = join(baseDir, '.env.local');
const envPath = join(baseDir, '.env');

if (existsSync(envLocalPath)) {
  dotenv.config({ path: envLocalPath });
  console.log('[Server] ✅ Loaded .env.local');
} else if (existsSync(envPath)) {
  dotenv.config({ path: envPath });
  console.log('[Server] ✅ Loaded .env');
} else {
  console.log('[Server] ⚠️  No .env file found, using environment variables');
  if (!process.env.API_KEY) {
    console.log('[Server] ⚠️  WARNING: API_KEY not set. Create .env.local with: API_KEY=your_key');
  }
}

const app = express();
const PORT = Number(process.env.PORT) || 8080;

const FIREBASE_WEB_API_KEY = process.env.FIREBASE_WEB_API_KEY || 'AIzaSyBY0XUym3soacWnPG8kmEW52aPBv_vrIIk';
const FIREBASE_PROJECT_ID = process.env.FIREBASE_PROJECT_ID || 'chroma-forge';

const ownerSecret = () => (process.env.OWNER_ACCESS_CODE || process.env.CREATOR_BYPASS_SECRET || '').trim();

const isValidOwnerCode = (provided: unknown): boolean => {
  const secret = ownerSecret();
  if (!secret || typeof provided !== 'string' || !provided) return false;
  const a = Buffer.from(provided);
  const b = Buffer.from(secret);
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
};

const bearerToken = (req: express.Request): string | null => {
  const header = req.get('authorization') || '';
  const match = header.match(/^Bearer\s+(.+)$/i);
  return match ? match[1].trim() : null;
};

const firebaseUidFromIdToken = async (idToken: string): Promise<string | null> => {
  const res = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${encodeURIComponent(FIREBASE_WEB_API_KEY)}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idToken }),
    }
  );
  if (!res.ok) return null;
  const data = await res.json().catch(() => null) as { users?: { localId?: string }[] } | null;
  return data?.users?.[0]?.localId || null;
};

const userHasPaidAi = async (idToken: string, uid: string): Promise<boolean> => {
  const headers = { Authorization: `Bearer ${idToken}` };
  const userUrl = `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/databases/(default)/documents/users/${uid}`;
  const userRes = await fetch(userUrl, { headers });
  if (userRes.ok) {
    const doc = await userRes.json().catch(() => null) as { fields?: { isPro?: { booleanValue?: boolean } } } | null;
    if (doc?.fields?.isPro?.booleanValue === true) return true;
  }

  const subUrl = `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/databases/(default)/documents/customers/${encodeURIComponent(uid)}/subscriptions`;
  const subRes = await fetch(subUrl, { headers });
  if (!subRes.ok) return false;
  const data = await subRes.json().catch(() => null) as { documents?: { fields?: { status?: { stringValue?: string } } }[] } | null;
  const docs = Array.isArray(data?.documents) ? data.documents : [];
  return docs.some((doc: { fields?: { status?: { stringValue?: string } } }) => {
    const status = doc?.fields?.status?.stringValue;
    return status === 'active' || status === 'trialing';
  });
};

const paymentRequired = (res: express.Response) =>
  res.status(402).json({
    name: 'Payment required',
    colors: [],
    code: '',
    description: 'Subscribe to use the assistant. This request was not generated.',
    paymentRequired: true,
  });

/** Owner code or an active Stripe subscription. Checked before any model call. */
const assertAiAccess = async (req: express.Request, res: express.Response): Promise<boolean> => {
  if (isValidOwnerCode(req.body?.ownerAccess)) return true;
  const token = bearerToken(req);
  if (!token) {
    paymentRequired(res);
    return false;
  }
  try {
    const uid = await firebaseUidFromIdToken(token);
    if (uid && (await userHasPaidAi(token, uid))) return true;
  } catch (error) {
    console.warn('[Backend] Could not verify assistant subscription');
  }
  paymentRequired(res);
  return false;
};

// Middleware
app.use(express.json());

// Serve static files from dist (but NOT index.html - we handle that in catch-all)
app.use(express.static(join(baseDir, 'dist'), {
  index: false // Don't serve index.html automatically
}));

app.post('/api/owner-unlock', (req, res) => {
  if (isValidOwnerCode(req.body?.access)) {
    return res.json({ ok: true });
  }
  return res.status(403).json({ ok: false });
});

// API endpoint for palette generation
app.post('/api/palette', async (req, res) => {
  try {
    if (!(await assertAiAccess(req, res))) return;

    const { history, currentPalette } = req.body;

    if (!history || !Array.isArray(history)) {
      return res.status(400).json({ 
        error: 'Invalid request: history must be an array' 
      });
    }

    if (!currentPalette || !Array.isArray(currentPalette)) {
      return res.status(400).json({ 
        error: 'Invalid request: currentPalette must be an array' 
      });
    }

    // Get API key from environment
    const apiKey = process.env.API_KEY;
    
    if (!apiKey) {
      console.error('[Backend] API_KEY environment variable is not set');
      return res.status(500).json({ 
        name: 'Configuration Error',
        colors: [],
        description: 'CRITICAL: No API Key found. Please configure API_KEY in Google Cloud Run settings.' 
      });
    }

    // Sanitize API key
    let sanitizedKey = apiKey.trim();
    if ((sanitizedKey.startsWith('"') && sanitizedKey.endsWith('"')) || 
        (sanitizedKey.startsWith("'") && sanitizedKey.endsWith("'"))) {
      sanitizedKey = sanitizedKey.slice(1, -1);
    }

    if (!sanitizedKey || sanitizedKey.length < 20) {
      console.error('[Backend] API_KEY is invalid or too short');
      return res.status(500).json({ 
        name: 'Configuration Error',
        colors: [],
        description: 'CRITICAL: Invalid API Key. Please check Google Cloud Run settings.' 
      });
    }

    // Initialize Gemini
    const ai = new GoogleGenAI({ apiKey: sanitizedKey });

    // Build context
    const historyText = history.map((m: { role: string; text: string }) => 
      `${m.role === 'user' ? 'User' : 'Model'}: ${m.text}`
    ).join('\n');
    
    const currentPaletteContext = currentPalette.map((c: { name: string; hex: string }) => 
      `- Name: "${c.name}", Hex: ${c.hex}`
    ).join('\n');

    const context = `
    You are a professional color expert and Design System Architect.
    
    === CURRENT PALETTE ON SCREEN ===
    ${currentPaletteContext || 'The palette is currently empty.'}
    =================================
    
    CONVERSATION HISTORY:
    ${historyText}
    
    TASK:
    Generate a JSON object representing the updated color palette based on the User's latest request.
    
    RULES:
    1. **Context Awareness**: If the user refers to a specific color by name identify it in the list.
    2. **Surgical Edits**: Change only what is requested. Keep others exactly as they are.
    3. **New Palettes**: If a new theme is requested, generate a fresh set.
    4. **Naming**: Always provide creative names.
    5. **Strict JSON**: Output ONLY valid JSON.
    
    Return STRICTLY a JSON object with this schema:
    {
      "paletteName": "string",
      "colors": [{ "hex": "#RRGGBB", "name": "Creative Name" }],
      "description": "string" 
    }
    `;

    // Call Gemini API
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: context,
      config: {
        systemInstruction: "You are a color engine. You act as a JSON API. You strictly modify existing arrays when requested.",
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            paletteName: {
              type: Type.STRING,
              description: "The name of the palette."
            },
            description: {
              type: Type.STRING,
              description: "A short, natural language response telling the user exactly what was changed."
            },
            colors: {
              type: Type.ARRAY,
              items: { 
                type: Type.OBJECT,
                properties: {
                  hex: { type: Type.STRING },
                  name: { type: Type.STRING }
                },
                required: ["hex", "name"]
              }
            }
          },
          required: ["paletteName", "colors", "description"]
        }
      }
    });

    let jsonStr = response.text;
    if (!jsonStr) {
      throw new Error("Empty response from AI");
    }

    // Clean up potential markdown formatting
    jsonStr = jsonStr.replace(/^```(json)?\s*/, '').replace(/\s*```$/, '');

    const data = JSON.parse(jsonStr);
    
    if (data.colors && Array.isArray(data.colors)) {
      return res.json({
        name: data.paletteName || "AI Generated Palette",
        description: data.description || `I've updated the palette with ${data.colors.length} colors.`,
        colors: data.colors.map((c: { hex: string; name: string }) => ({
          hex: c.hex,
          name: c.name
        }))
      });
    }
    
    throw new Error("Invalid response structure: missing colors array");
  } catch (error: any) {
    console.error("[Backend] Gemini API Error:", error);
    
    let userMessage = "I encountered an error generating the palette.";
    
    if (error.message) {
      if (error.message.includes('API key not valid') || error.message.includes('400')) {
        userMessage = "Configuration Error (400): The API Key is invalid. Check Google Cloud Console.";
      } else if (error.message.includes('403') || error.message.includes('permission denied')) {
        userMessage = "Access Denied (403). Please enable 'Generative Language API' in Google Cloud Console for this API Key.";
      } else if (error.message.includes('429') || error.message.includes('quota')) {
        userMessage = "API Quota Exceeded. Please try again later.";
      } else if (error.message.includes('fetch') || error.message.includes('network')) {
        userMessage = "Network Error. Please check your connection.";
      } else {
        userMessage = `System Error: ${error.message.slice(0, 100)}`;
      }
    }
    
    return res.status(500).json({ 
      name: "Error", 
      colors: [], 
      description: userMessage 
    });
  }
});

// API endpoint for UI component generation
app.post('/api/ui-design', async (req, res) => {
  try {
    if (!(await assertAiAccess(req, res))) return;

    const { prompt, palette, availableComponents, config } = req.body;

    if (!prompt || typeof prompt !== 'string') {
      return res.status(400).json({ 
        code: '',
        description: 'Invalid request: prompt must be a string' 
      });
    }

    if (!palette || !availableComponents || !config) {
      return res.status(400).json({ 
        code: '',
        description: 'Invalid request: missing required fields' 
      });
    }

    // Get API key from environment
    const apiKey = process.env.API_KEY;
    
    if (!apiKey) {
      console.error('[Backend] API_KEY environment variable is not set');
      return res.status(500).json({ 
        code: '',
        description: 'CRITICAL: No API Key found. Please configure API_KEY in Google Cloud Run settings.' 
      });
    }

    // Sanitize API key
    let sanitizedKey = apiKey.trim();
    if ((sanitizedKey.startsWith('"') && sanitizedKey.endsWith('"')) || 
        (sanitizedKey.startsWith("'") && sanitizedKey.endsWith("'"))) {
      sanitizedKey = sanitizedKey.slice(1, -1);
    }

    if (!sanitizedKey || sanitizedKey.length < 20) {
      console.error('[Backend] API_KEY is invalid or too short');
      return res.status(500).json({ 
        code: '',
        description: 'CRITICAL: Invalid API Key. Please check Google Cloud Run settings.' 
      });
    }

    // Initialize Gemini
    const ai = new GoogleGenAI({ apiKey: sanitizedKey });

    // Build palette context with shades
    const brandPaletteContext = palette.brand.map((c: any) => {
      const shades = c.shades?.map((s: any) => `${s.level}: ${s.hex}`).join(', ') || 'no shades';
      return `- ${c.name}: ${c.hex} (shades: ${shades})`;
    }).join('\n    ');

    const neutralPaletteContext = palette.neutral.map((c: any) => {
      const shades = c.shades?.map((s: any) => `${s.level}: ${s.hex}`).join(', ') || 'no shades';
      return `- ${c.name}: ${c.hex} (shades: ${shades})`;
    }).join('\n    ');

    const semanticPaletteContext = palette.semantic.map((c: any) => {
      const shades = c.shades?.map((s: any) => `${s.level}: ${s.hex}`).join(', ') || 'no shades';
      return `- ${c.name}: ${c.hex} (shades: ${shades})`;
    }).join('\n    ');

    // Get primary color from palette
    const primaryColor = palette.brand[config.primaryIndex]?.hex || palette.brand[0]?.hex || '#1976d2';
    const primaryShade300 = palette.brand[config.primaryIndex]?.shades?.find((s: any) => s.level === 300)?.hex || primaryColor;
    const primaryShade700 = palette.brand[config.primaryIndex]?.shades?.find((s: any) => s.level === 700)?.hex || primaryColor;
    const secondaryColor = palette.brand[1]?.hex || palette.brand[0]?.hex || '#dc004e';
    const secondaryShade300 = palette.brand[1]?.shades?.find((s: any) => s.level === 300)?.hex || secondaryColor;
    const secondaryShade700 = palette.brand[1]?.shades?.find((s: any) => s.level === 700)?.hex || secondaryColor;
    const bgDefault = palette.neutral[0]?.hex || '#ffffff';
    const bgPaper = palette.neutral[1]?.hex || palette.neutral[0]?.hex || '#f5f5f5';
    const textPrimary = palette.neutral[palette.neutral.length - 1]?.hex || '#000000';
    const textSecondary = palette.neutral[Math.floor(palette.neutral.length / 2)]?.hex || '#666666';
    const errorColor = palette.semantic.find((c: any) => c.name.toLowerCase().includes('error') || c.name.toLowerCase().includes('danger'))?.hex || '#d32f2f';
    const warningColor = palette.semantic.find((c: any) => c.name.toLowerCase().includes('warning'))?.hex || '#ed6c02';
    const infoColor = palette.semantic.find((c: any) => c.name.toLowerCase().includes('info'))?.hex || '#0288d1';
    const successColor = palette.semantic.find((c: any) => c.name.toLowerCase().includes('success'))?.hex || '#2e7d32';
    const primaryShade600 = palette.brand[config.primaryIndex]?.shades?.find((s: any) => s.level === 600)?.hex || primaryColor;

    const context = `
    You are a professional UI Designer and React Developer specializing in Google Material Design.
    
    === CRITICAL: ALWAYS USE CHROMAFORGE PALETTE COLORS ===
    You MUST use colors from the provided ChromaForge palette. NEVER use hardcoded colors like "#FF5733", "blue", "red", "#1976d2", etc.
    
    === CURRENT COLOR PALETTE FROM CHROMAFORGE ===
    Brand Colors:
    ${brandPaletteContext || 'No brand colors'}
    
    Neutral Colors:
    ${neutralPaletteContext || 'No neutral colors'}
    
    Semantic Colors:
    ${semanticPaletteContext || 'No semantic colors'}
    
    === THEME CONFIGURATION ===
    - Dark Mode: ${config.isDarkMode}
    - Primary Color Index: ${config.primaryIndex}
    - Surface Mode: ${config.surfaceMode}
    - Text Mode: ${config.textMode}
    - Disabled Mode: ${config.disabledMode}
    
    === USER REQUEST ===
    "${prompt}"
    
    === TASK ===
    Generate a React/JSX component using Material-UI (MUI) that matches the user's request.
    
    === CRITICAL RULES ===
    1. **ALWAYS USE COLORS FROM CHROMAFORGE PALETTE**: 
       - NEVER use hardcoded colors like "#FF5733", "blue", "red", "#1976d2", etc.
       - ALWAYS reference colors from the provided ChromaForge palette above
       - Create a theme object that maps ChromaForge colors to Material Design:
         const theme = createTheme({
           palette: {
             primary: { 
               main: '${primaryColor}',
               light: '${primaryShade300}',
               dark: '${primaryShade700}'
             },
             secondary: { 
               main: '${secondaryColor}',
               light: '${secondaryShade300}',
               dark: '${secondaryShade700}'
             },
             background: { 
               default: '${bgDefault}',
               paper: '${bgPaper}'
             },
             text: {
               primary: '${textPrimary}',
               secondary: '${textSecondary}',
               disabled: '${palette.neutral[Math.floor(palette.neutral.length / 2)]?.hex || '#999999'}'
             },
             error: { main: '${errorColor}' },
             warning: { main: '${warningColor}' },
             info: { main: '${infoColor}' },
             success: { main: '${successColor}' },
             action: {
               disabled: '${palette.neutral[Math.floor(palette.neutral.length / 2)]?.hex || '#999999'}',
               disabledBackground: '${palette.neutral[Math.floor(palette.neutral.length / 2) - 1]?.hex || palette.neutral[0]?.hex || '#cccccc'}'
             }
           }
         });
       - When user says "primary-600", use: '${primaryShade600}'
       - When user says "use color X", find that color in the ChromaForge palette above
       - **DISABLED COLORS**: ALWAYS use neutral colors from the palette for disabled states. NEVER use hardcoded gray colors.
       - **SEMANTIC COLORS**: Use the semantic colors from the ChromaForge palette (error, warning, info, success) shown above.
    
    2. **Material-UI Components**: 
       - Import from @mui/material (e.g., import { Button, Card, TextField, ThemeProvider, createTheme } from '@mui/material')
       - Use Material Design patterns and spacing (8px grid)
       - Follow Material Design elevation system
       - Wrap component in ThemeProvider with the theme created from ChromaForge colors
    
    3. **Google Fonts**: 
       - Use Google Fonts (Roboto is default)
       - Material-UI uses Roboto by default, no need to import
    
    4. **Material Icons**: 
       - Material Icons are available as helper functions (ShoppingCart, Home, Search, Menu, Favorite, Add, Delete, Edit, etc.)
       - DO NOT import from @mui/icons-material - icons are provided as React components
       - Examples: <ShoppingCart />, <Home />, <Search />, <Menu />, <Favorite />, <Add />, <Delete />, <Edit />
       - These icon components are already available in the environment
       - DO NOT use lucide-react icons
    
    5. **Component Structure**: 
       - Create complete, functional React components
       - You can create your own theme using createTheme() OR use the existing 'chromaForgePaletteTheme'
       - If you create a theme, use the ChromaForge palette colors provided above
       - Use sx prop or styled components for styling
       - Example:
         import { ThemeProvider, createTheme } from '@mui/material/styles';
         import { Button, Card, CardContent, Typography } from '@mui/material';
         // Icons are available as components (Favorite, Star, ShoppingCart, etc.)
         
         const theme = createTheme({
           palette: {
             primary: { main: '${primaryColor}' },
             // ... use ChromaForge colors
           }
         });
         
         const GeneratedComponent = () => {
           return (
             <ThemeProvider theme={theme}>
               <Card>
                 <CardContent>
                   <Typography variant="h5" color="text.primary">
                     Title
                   </Typography>
                   <Button variant="contained" color="primary" startIcon={<ShoppingCart />}>
                     Action
                   </Button>
                 </CardContent>
               </Card>
             </ThemeProvider>
           );
         };
       - IMPORTANT: If creating a theme, ALWAYS use colors from ChromaForge palette above
       - IMPORTANT: Icons are available as React components (Favorite, Star, ShoppingCart, etc.) - do NOT import them
    
    6. **Images**: 
       - Use Picsum Photos: https://picsum.photos/[width]/[height]?random=[seed]
       - Use descriptive seeds: portrait, nature, product, kitchen, etc.
    
    7. **Code Quality**: 
       - Clean, readable, production-ready code
       - Proper Material Design spacing and typography
       - Accessible components with ARIA attributes
       - NO hardcoded colors - ALWAYS use theme colors from ChromaForge palette
    
    === OUTPUT FORMAT ===
    Return ONLY valid JSX/TSX code. No markdown code blocks, no explanations.
    The code must:
    - Import Material-UI components from @mui/material
    - Import Material Icons from @mui/icons-material
    - Create a theme using ChromaForge palette colors (NEVER hardcoded)
    - Use ThemeProvider to wrap the component
    - Reference colors from the theme, NEVER hardcoded colors
    - Export the component as default or named export
    `;

    // Call Gemini API
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: context,
      config: {
        systemInstruction: "You are a React/JSX code generator specializing in Material Design. You output only valid, executable React component code using Material-UI. Always use colors from the ChromaForge palette provided. No explanations, no markdown, just code.",
      }
    });

    let code = response.text;
    if (!code) {
      throw new Error("Empty response from AI");
    }

    // Clean up potential markdown formatting
    code = code.replace(/^```(jsx|tsx|javascript|typescript)?\s*/i, '').replace(/\s*```$/i, '').trim();

    // Extract component name if possible
    const componentNameMatch = code.match(/(?:const|function|export\s+(?:const|function))\s+(\w+)/);
    const componentName = componentNameMatch ? componentNameMatch[1] : 'GeneratedComponent';

    // Construir tema para inyección
    const theme = {
      action: {
        primary: primaryColor,
        primaryHover: primaryShade700,
        secondary: secondaryColor,
        secondaryBg: secondaryShade300,
      },
      bg: {
        page: bgDefault,
        card: bgPaper,
      },
      text: {
        main: textPrimary,
        secondary: textSecondary,
      },
      disabled: {
        bg: palette.neutral[Math.floor(palette.neutral.length / 2) - 1]?.hex || palette.neutral[0]?.hex || '#cccccc',
        text: palette.neutral[Math.floor(palette.neutral.length / 2)]?.hex || '#999999',
        border: palette.neutral[Math.floor(palette.neutral.length / 2)]?.hex || '#999999',
      },
      semantic: {
        error: { main: errorColor },
        warning: { main: warningColor },
        info: { main: infoColor },
        success: { main: successColor },
      },
    };

    // Compilar componente
    const compileResult = await compileComponent({
      code,
      componentName,
      theme,
    });

    if (compileResult.error) {
      console.error('[Backend] Compilation error:', compileResult.error);
      // Devolver código sin compilar como fallback
      return res.json({
        code: code,
        description: `Generated ${componentName} based on your request. (Compilation failed: ${compileResult.error})`,
        componentName: componentName,
        bundleId: null,
      });
    }

    // Limpiar bundles antiguos (en background)
    cleanupOldBundles();

    return res.json({
      code: code, // Mantener código original para mostrar en el editor
      description: `Generated ${componentName} based on your request.`,
      componentName: componentName,
      bundleId: compileResult.bundleId, // ID del bundle compilado
    });
  } catch (error: any) {
    console.error("[Backend] Gemini API Error:", error);
    
    let userMessage = "I encountered an error generating the UI component.";
    
    if (error.message) {
      if (error.message.includes('API key not valid') || error.message.includes('400')) {
        userMessage = "Configuration Error (400): The API Key is invalid. Check Google Cloud Console.";
      } else if (error.message.includes('403') || error.message.includes('permission denied')) {
        userMessage = "Access Denied (403). Please enable 'Generative Language API' in Google Cloud Console for this API Key.";
      } else if (error.message.includes('429') || error.message.includes('quota')) {
        userMessage = "API Quota Exceeded. Please try again later.";
      } else if (error.message.includes('fetch') || error.message.includes('network')) {
        userMessage = "Network Error. Please check your connection.";
      } else {
        userMessage = `System Error: ${error.message.slice(0, 100)}`;
      }
    }
    
    return res.status(500).json({ 
      code: '',
      description: userMessage 
    });
  }
});

// Endpoint para servir bundles compilados
app.get('/api/bundles/:bundleId.js', (req, res) => {
  try {
    const { bundleId } = req.params;
    // Usar el mismo directorio que componentCompiler
    const bundlesDir = process.env.NODE_ENV === 'production' 
      ? '/tmp/chromaforge-bundles'
      : join(process.cwd(), 'dist-server', 'bundles');
    const bundlePath = join(bundlesDir, `${bundleId}.js`);
    
    try {
      const bundle = readFileSync(bundlePath, 'utf-8');
      res.setHeader('Content-Type', 'application/javascript');
      res.setHeader('Cache-Control', 'public, max-age=3600'); // Cache 1 hora
      res.setHeader('Access-Control-Allow-Origin', '*'); // CORS para iframe
      res.setHeader('Cross-Origin-Opener-Policy', 'same-origin-allow-popups'); // Reducir warnings
      res.send(bundle);
    } catch (error) {
      console.error('[Server] Bundle not found:', bundlePath);
      res.status(404).json({ error: 'Bundle not found' });
    }
  } catch (error: any) {
    console.error('[Server] Error serving bundle:', error);
    res.status(500).json({ error: error.message });
  }
});

// Serve SPA - serve index.html for all routes
app.get('*', (req, res) => {
  try {
    // Skip API routes
    if (req.path.startsWith('/api/')) {
      return res.status(404).json({ error: 'Not found' });
    }
    
    // Always serve from dist, never from root
    const indexPath = join(baseDir, 'dist', 'index.html');
    
    // Verify the file exists and is from dist
    if (!indexPath.includes('dist')) {
      console.error('[Server] ERROR: indexPath does not include dist:', indexPath);
      return res.status(500).send('Configuration error');
    }
    
    const indexHtml = readFileSync(indexPath, 'utf-8');
    
    // Verify it's the correct file (has /assets/, not index.tsx or importmap script tag)
    // Check for specific patterns that indicate wrong HTML
    const hasWrongScript = /<script[^>]*src=["']\/index\.tsx["']/.test(indexHtml);
    const hasImportmap = /<script[^>]*type=["']importmap["']/.test(indexHtml);
    const hasAssetsScript = /<script[^>]*src=["']\/assets\/[^"']+\.js["']/.test(indexHtml);
    
    if (hasWrongScript || hasImportmap) {
      console.error('[Server] ERROR: Serving wrong index.html (has index.tsx script or importmap)');
      console.error('[Server] hasWrongScript:', hasWrongScript, 'hasImportmap:', hasImportmap, 'hasAssetsScript:', hasAssetsScript);
      return res.status(500).send('Configuration error: wrong index.html');
    }
    
    if (!hasAssetsScript) {
      console.error('[Server] ERROR: dist/index.html does not have /assets/...js script');
      return res.status(500).send('Configuration error: missing assets script');
    }
    
    res.setHeader('Content-Type', 'text/html');
    res.send(indexHtml);
  } catch (error: any) {
    console.error('[Server] Error serving index.html:', error);
    res.status(500).send(`Error: ${error.message}`);
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`[Server] 🚀 Server running on port ${PORT}`);
  if (process.env.API_KEY) {
    const keyPreview = process.env.API_KEY.substring(0, 10) + '...';
    console.log(`[Server] ✅ API_KEY is configured (${keyPreview})`);
  } else {
    console.log(`[Server] ❌ API_KEY is NOT configured. Create .env.local with: API_KEY=your_gemini_api_key`);
  }
  console.log(`[Server] Owner unlock ${ownerSecret() ? 'configured' : 'disabled (set OWNER_ACCESS_CODE)'}`);
});

