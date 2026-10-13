import express from 'express';
import { GoogleGenAI, Type } from '@google/genai';
import { fileURLToPath } from 'url';
import { dirname, join, resolve } from 'path';
import { readFileSync, existsSync } from 'fs';
import dotenv from 'dotenv';
import { compileComponent, cleanupOldBundles } from './services/componentCompiler.js';
import { CreditLedger, networkKeyForIp } from './services/creditLedger.js';
import { isOwnerAccount } from './services/ownerGate.js';
import { grantFromStripeEvent, verifyStripeSignature } from './services/stripeFulfillment.js';
import {
  buildPalettePrompt,
  callModelIfAllowed,
  creditsForTokens,
  DESIGN_RESERVED_OUTPUT_TOKENS,
  FREE_CREDITS,
  isWalletId,
  prepareTurn,
  tokensFromUsage,
  type TurnDecision,
} from './services/credits.js';

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
// Production sits behind one proxy. Trusting that hop uses the visitor address.
// A client-supplied forwarding header is ignored when the process is reached directly.
if (process.env.NODE_ENV === 'production' || process.env.TRUST_PROXY === '1') {
  app.set('trust proxy', 1);
}
const PORT = Number(process.env.PORT) || 8080;

const FIREBASE_WEB_API_KEY = process.env.FIREBASE_WEB_API_KEY || 'AIzaSyBY0XUym3soacWnPG8kmEW52aPBv_vrIIk';

const bearerToken = (req: express.Request): string | null => {
  const header = req.get('authorization') || '';
  const match = header.match(/^Bearer\s+(.+)$/i);
  return match ? match[1].trim() : null;
};

/** Identity Toolkit is the only proof of who is signed in. */
const firebaseAccountFromIdToken = async (idToken: string): Promise<{ email: string; uid: string | null } | null> => {
  if (!idToken || idToken.length > 8192) return null;
  const res = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${encodeURIComponent(FIREBASE_WEB_API_KEY)}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idToken }),
      redirect: 'error',
    }
  );
  if (!res.ok) return null;
  const data = await res.json().catch(() => null) as { users?: { email?: string; localId?: string }[] } | null;
  const email = data?.users?.[0]?.email;
  if (typeof email !== 'string') return null;
  const localId = data?.users?.[0]?.localId;
  return { email, uid: typeof localId === 'string' ? localId : null };
};

const clientIp = (req: express.Request): string => {
  const raw = req.ip || req.socket.remoteAddress || 'unknown';
  return raw.replace(/^::ffff:/, '');
};

const accountFromRequest = async (req: express.Request): Promise<{ email: string; uid: string | null } | null> => {
  const token = bearerToken(req);
  if (!token) return null;
  try {
    return await firebaseAccountFromIdToken(token);
  } catch {
    return null;
  }
};

const ledger = new CreditLedger(
  process.env.CREDIT_LEDGER_PATH || join(baseDir, 'data', 'credit-ledger.json'),
);

/** Unlimited use follows the verified owner account, never a client flag. */
const isOwnerRequest = async (req: express.Request): Promise<boolean> =>
  isOwnerAccount(await accountFromRequest(req));

/** The owner account skips the meter. Everyone else needs credits before Gemini. */
const decideTurn = async (
  req: express.Request,
  prompt: string,
  kind: 'palette' | 'design',
  reservedOutputTokens?: number,
): Promise<TurnDecision> => {
  const account = await accountFromRequest(req);
  const owner = isOwnerAccount(account);
  const requested = isWalletId(req.body?.walletId) ? req.body.walletId : '';
  if (owner) {
    return prepareTurn({ owner: true, walletId: requested, prompt, balance: 0, kind, reservedOutputTokens });
  }
  if (!requested && !account?.uid) {
    return prepareTurn({ owner: false, walletId: req.body?.walletId, prompt, balance: 0, kind, reservedOutputTokens });
  }
  const opened = await ledger.open(requested, networkKeyForIp(clientIp(req)), account?.uid ?? null);
  return prepareTurn({
    owner: false,
    walletId: opened.walletId,
    prompt,
    balance: opened.balance,
    kind,
    reservedOutputTokens,
  });
};

const creditView = async (req: express.Request) => {
  const account = await accountFromRequest(req);
  if (isOwnerAccount(account)) {
    return { status: 200, body: { owner: true, balance: null, freeCredits: FREE_CREDITS, allowance: 'owner', walletId: null } };
  }
  const requested = isWalletId(req.body?.walletId) ? req.body.walletId : '';
  if (!requested) {
    return { status: 400, body: { owner: false, balance: 0, freeCredits: FREE_CREDITS, allowance: 'blocked', walletId: null } };
  }
  const opened = await ledger.open(requested, networkKeyForIp(clientIp(req)), account?.uid ?? null);
  return {
    status: 200,
    body: {
      owner: false,
      balance: opened.balance,
      freeCredits: FREE_CREDITS,
      allowance: opened.freeGranted ? 'granted' : 'blocked',
      walletId: opened.walletId,
    },
  };
};

const chargeTurn = async (
  decision: Exclude<TurnDecision, { kind: 'refuse' }>,
  prompt: string,
  output: string,
  usage: { promptTokenCount?: number; candidatesTokenCount?: number; thoughtsTokenCount?: number } | null | undefined,
): Promise<{ creditsSpent?: number; creditsRemaining?: number }> => {
  if (decision.kind === 'owner') return {};
  const tokens = tokensFromUsage(usage, { prompt, output });
  const settled = await ledger.debit(decision.walletId, creditsForTokens(tokens.inputTokens, tokens.outputTokens));
  return { creditsSpent: settled.spent, creditsRemaining: settled.remaining };
};

const webhookSecret = () => (process.env.STRIPE_WEBHOOK_SECRET || '').trim();

// Raw body, before JSON parsing, so the Stripe signature matches the bytes Stripe sent.
app.post('/api/stripe/webhook', express.raw({ type: 'application/json', limit: '1mb' }), async (req, res) => {
  const secret = webhookSecret();
  if (!secret) {
    console.warn('[Backend] Stripe webhook secret is not configured');
    return res.status(503).json({ received: false });
  }
  const payload = Buffer.isBuffer(req.body) ? req.body : Buffer.alloc(0);
  if (!verifyStripeSignature(payload, req.get('stripe-signature'), secret)) {
    return res.status(400).json({ received: false });
  }
  let event: unknown;
  try {
    event = JSON.parse(payload.toString('utf8'));
  } catch {
    return res.status(400).json({ received: false });
  }
  const grant = grantFromStripeEvent(event);
  if (!grant) return res.json({ received: true, granted: 0 });
  try {
    const result = await ledger.grant(grant.walletId, grant.id, grant.credits);
    return res.json({ received: true, granted: result.added });
  } catch {
    console.error('[Backend] Credit grant failed');
    return res.status(500).json({ received: false });
  }
});

// Middleware
app.use(express.json({ limit: '1mb' }));

// Serve static files from dist (but NOT index.html - we handle that in catch-all)
app.use(express.static(join(baseDir, 'dist'), {
  index: false // Don't serve index.html automatically
}));

// Stripe Price IDs are public identifiers, but are supplied at runtime so Docker
// builds do not need to bake deployment-specific configuration into the bundle.
app.get('/api/payment-config', (_req, res) => {
  const price600 = (process.env.VITE_STRIPE_PRICE_CREDITS_600 || '').trim();
  const price2400 = (process.env.VITE_STRIPE_PRICE_CREDITS_2400 || '').trim();
  return res.json({
    prices: {
      pack_600: price600.startsWith('price_') ? price600 : null,
      pack_2400: price2400.startsWith('price_') ? price2400 : null,
    },
  });
});

app.post('/api/owner-unlock', async (req, res) => {
  if (await isOwnerRequest(req)) return res.json({ ok: true });
  return res.status(403).json({ ok: false });
});

app.post('/api/credits', async (req, res) => {
  const view = await creditView(req);
  return res.status(view.status).json(view.body);
});

app.post('/api/credits/claim', async (req, res) => {
  const view = await creditView(req);
  return res.status(view.status).json({ ...view.body, added: 0 });
});

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

    const context = buildPalettePrompt(history, currentPalette);
    const decision = await decideTurn(req, context, 'palette');
    if (decision.kind === 'refuse') return res.status(decision.status).json(decision.body);

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

    // Initialize Gemini only after the balance covers this request.
    const ai = new GoogleGenAI({ apiKey: sanitizedKey });

    const metered = await callModelIfAllowed(decision, () => ai.models.generateContent({
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
    }));
    if (metered.kind === 'refused') return res.status(metered.status).json(metered.body);
    const response = metered.value;

    let jsonStr = response.text;
    if (!jsonStr) {
      throw new Error("Empty response from AI");
    }

    // Clean up potential markdown formatting
    jsonStr = jsonStr.replace(/^```(json)?\s*/, '').replace(/\s*```$/, '');

    const data = JSON.parse(jsonStr);
    
    if (data.colors && Array.isArray(data.colors)) {
      const description = data.description || `I've updated the palette with ${data.colors.length} colors.`;
      const charge = await chargeTurn(metered.decision, context, jsonStr, response.usageMetadata);
      return res.json({
        name: data.paletteName || "AI Generated Palette",
        description,
        colors: data.colors.map((c: { hex: string; name: string }) => ({
          hex: c.hex,
          name: c.name
        })),
        ...charge,
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

    const decision = await decideTurn(req, context, 'design', DESIGN_RESERVED_OUTPUT_TOKENS);
    if (decision.kind === 'refuse') return res.status(decision.status).json(decision.body);

    const metered = await callModelIfAllowed(decision, () => ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: context,
      config: {
        systemInstruction: "You are a React/JSX code generator specializing in Material Design. You output only valid, executable React component code using Material-UI. Always use colors from the ChromaForge palette provided. No explanations, no markdown, just code.",
      }
    }));
    if (metered.kind === 'refused') return res.status(metered.status).json(metered.body);
    const response = metered.value;

    let code = response.text;
    if (!code) {
      throw new Error("Empty response from AI");
    }

    // Clean up potential markdown formatting
    code = code.replace(/^```(jsx|tsx|javascript|typescript)?\s*/i, '').replace(/\s*```$/i, '').trim();
    const charge = await chargeTurn(metered.decision, context, code, response.usageMetadata);

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
        ...charge,
      });
    }

    // Limpiar bundles antiguos (en background)
    cleanupOldBundles();

    return res.json({
      code: code, // Mantener código original para mostrar en el editor
      description: `Generated ${componentName} based on your request.`,
      componentName: componentName,
      bundleId: compileResult.bundleId, // ID del bundle compilado
      ...charge,
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

const invokedDirectly = process.argv[1]
  ? fileURLToPath(import.meta.url) === resolve(process.argv[1])
  : false;

if (invokedDirectly) {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Server] 🚀 Server running on port ${PORT}`);
    if (process.env.API_KEY) {
      const keyPreview = process.env.API_KEY.substring(0, 10) + '...';
      console.log(`[Server] ✅ API_KEY is configured (${keyPreview})`);
    } else {
      console.log(`[Server] ❌ API_KEY is NOT configured. Create .env.local with: API_KEY=your_gemini_api_key`);
    }
    console.log(`[Server] Stripe webhook ${webhookSecret() ? 'configured' : 'not configured'}`);
  });
}

export { app };

