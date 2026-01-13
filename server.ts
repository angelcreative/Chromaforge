import express from 'express';
import { GoogleGenAI, Type } from '@google/genai';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync, existsSync } from 'fs';
import dotenv from 'dotenv';

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

// Middleware
app.use(express.json());

// Serve static files from dist (but NOT index.html - we handle that in catch-all)
app.use(express.static(join(baseDir, 'dist'), {
  index: false // Don't serve index.html automatically
}));

// API endpoint for palette generation
app.post('/api/palette', async (req, res) => {
  try {
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
       - Use Material-UI's ThemeProvider - the theme is already created and available as 'chromaForgePaletteTheme'
       - DO NOT create a new theme - use the existing chromaForgePaletteTheme
       - Use sx prop or styled components for styling
       - Example:
         import { ThemeProvider } from '@mui/material/styles';
         import { Button, Card, CardContent, Typography } from '@mui/material';
         // Note: Material Icons are loaded via CDN, use them directly (e.g., <ShoppingCart />)
         
         const GeneratedComponent = () => {
           return (
             <ThemeProvider theme={chromaForgePaletteTheme}>
               <Card>
                 <CardContent>
                   <Typography variant="h5" color="text.primary">
                     Title
                   </Typography>
                   <Button variant="contained" color="primary">
                     Action
                   </Button>
                 </CardContent>
               </Card>
             </ThemeProvider>
           );
         };
       - IMPORTANT: Use 'chromaForgePaletteTheme' (already created) instead of creating a new theme
       - IMPORTANT: Do NOT import from @mui/icons-material - icons are available globally
    
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

    return res.json({
      code: code,
      description: `Generated ${componentName} based on your request.`,
      componentName: componentName
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
});

