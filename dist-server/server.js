import express from 'express';
import { GoogleGenAI, Type } from '@google/genai';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync } from 'fs';
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
// Resolver la ruta base: si estamos en dist-server, subir un nivel
const baseDir = __dirname.includes('dist-server')
    ? join(__dirname, '..')
    : __dirname;
const app = express();
const PORT = process.env.PORT || 8080;
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
        const historyText = history.map((m) => `${m.role === 'user' ? 'User' : 'Model'}: ${m.text}`).join('\n');
        const currentPaletteContext = currentPalette.map((c) => `- Name: "${c.name}", Hex: ${c.hex}`).join('\n');
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
                colors: data.colors.map((c) => ({
                    hex: c.hex,
                    name: c.name
                }))
            });
        }
        throw new Error("Invalid response structure: missing colors array");
    }
    catch (error) {
        console.error("[Backend] Gemini API Error:", error);
        let userMessage = "I encountered an error generating the palette.";
        if (error.message) {
            if (error.message.includes('API key not valid') || error.message.includes('400')) {
                userMessage = "Configuration Error (400): The API Key is invalid. Check Google Cloud Console.";
            }
            else if (error.message.includes('403') || error.message.includes('permission denied')) {
                userMessage = "Access Denied (403). Please enable 'Generative Language API' in Google Cloud Console for this API Key.";
            }
            else if (error.message.includes('429') || error.message.includes('quota')) {
                userMessage = "API Quota Exceeded. Please try again later.";
            }
            else if (error.message.includes('fetch') || error.message.includes('network')) {
                userMessage = "Network Error. Please check your connection.";
            }
            else {
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
        // Verify it's the correct file (has /assets/, not index.tsx)
        if (indexHtml.includes('index.tsx') || indexHtml.includes('importmap')) {
            console.error('[Server] ERROR: Serving wrong index.html (has index.tsx or importmap)');
            return res.status(500).send('Configuration error: wrong index.html');
        }
        res.setHeader('Content-Type', 'text/html');
        res.send(indexHtml);
    }
    catch (error) {
        console.error('[Server] Error serving index.html:', error);
        res.status(500).send(`Error: ${error.message}`);
    }
});
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
