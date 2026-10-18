import express from 'express';
import { GoogleGenAI, Type } from '@google/genai';
import { fileURLToPath } from 'url';
import { dirname, join, resolve } from 'path';
import { readFileSync, existsSync } from 'fs';
import dotenv from 'dotenv';
import { PIGMENTO_CARD_SYSTEM, cardRetryPrompt, validateCardHtml } from './services/pigmentoCards.js';
import { fillPhotoSlots, findStockPhoto, lastPhotoIssue, stockPhotosEnabled } from './services/stockPhotos.js';
import { CreditLedger, networkKeyForIp } from './services/creditLedger.js';
import { isOwnerAccount } from './services/ownerGate.js';
import { grantFromStripeEvent, verifyStripeSignature } from './services/stripeFulfillment.js';
import { buildPalettePrompt, callModelIfAllowed, creditsForTokens, DESIGN_RESERVED_OUTPUT_TOKENS, FREE_CREDITS, isWalletId, prepareTurn, tokensFromUsage, } from './services/credits.js';
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
}
else if (existsSync(envPath)) {
    dotenv.config({ path: envPath });
    console.log('[Server] ✅ Loaded .env');
}
else {
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
const bearerToken = (req) => {
    const header = req.get('authorization') || '';
    const match = header.match(/^Bearer\s+(.+)$/i);
    return match ? match[1].trim() : null;
};
/** Identity Toolkit is the only proof of who is signed in. */
const firebaseAccountFromIdToken = async (idToken) => {
    if (!idToken || idToken.length > 8192)
        return null;
    const res = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${encodeURIComponent(FIREBASE_WEB_API_KEY)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken }),
        redirect: 'error',
    });
    if (!res.ok)
        return null;
    const data = await res.json().catch(() => null);
    const email = data?.users?.[0]?.email;
    if (typeof email !== 'string')
        return null;
    const localId = data?.users?.[0]?.localId;
    return { email, uid: typeof localId === 'string' ? localId : null };
};
const clientIp = (req) => {
    const raw = req.ip || req.socket.remoteAddress || 'unknown';
    return raw.replace(/^::ffff:/, '');
};
const accountFromRequest = async (req) => {
    const token = bearerToken(req);
    if (!token)
        return null;
    try {
        return await firebaseAccountFromIdToken(token);
    }
    catch {
        return null;
    }
};
const ledger = new CreditLedger(process.env.CREDIT_LEDGER_PATH || join(baseDir, 'data', 'credit-ledger.json'));
/** Unlimited use follows the verified owner account, never a client flag. */
const isOwnerRequest = async (req) => isOwnerAccount(await accountFromRequest(req));
/** The owner account skips the meter. Everyone else needs credits before Gemini. */
const decideTurn = async (req, prompt, kind, reservedOutputTokens) => {
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
const creditView = async (req) => {
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
const chargeTurn = async (decision, prompt, output, usage) => {
    if (decision.kind === 'owner')
        return {};
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
    let event;
    try {
        event = JSON.parse(payload.toString('utf8'));
    }
    catch {
        return res.status(400).json({ received: false });
    }
    const grant = grantFromStripeEvent(event);
    if (!grant)
        return res.json({ received: true, granted: 0 });
    try {
        const result = await ledger.grant(grant.walletId, grant.id, grant.credits);
        return res.json({ received: true, granted: result.added });
    }
    catch {
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
    if (await isOwnerRequest(req))
        return res.json({ ok: true });
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
        if (decision.kind === 'refuse')
            return res.status(decision.status).json(decision.body);
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
        if (metered.kind === 'refused')
            return res.status(metered.status).json(metered.body);
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
                colors: data.colors.map((c) => ({
                    hex: c.hex,
                    name: c.name
                })),
                ...charge,
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
            else if (error.message.toLowerCase().includes('leaked')) {
                userMessage = "Access Denied (403). Google blocked this Gemini API key because it was published. Set a new API_KEY on the server.";
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
// API endpoint for UI component generation
// Stock photo lookup for playground cards. The Pexels key stays on the server;
// results are cached in stockPhotos.ts and each IP gets a modest budget.
const photoBudget = new Map();
const PHOTO_WINDOW_MS = 10 * 60 * 1000;
const PHOTO_LIMIT = 120;
app.get('/api/photo', async (req, res) => {
    const q = typeof req.query.q === 'string' ? req.query.q : '';
    const o = req.query.orientation;
    const orientation = o === 'portrait' || o === 'square' ? o : 'landscape';
    if (q.trim().length < 2)
        return res.status(400).json({ photo: null });
    const ip = clientIp(req);
    const now = Date.now();
    const budget = photoBudget.get(ip);
    if (!budget || budget.reset < now) {
        if (photoBudget.size > 5000)
            photoBudget.clear();
        photoBudget.set(ip, { reset: now + PHOTO_WINDOW_MS, count: 1 });
    }
    else if (++budget.count > PHOTO_LIMIT) {
        return res.status(429).json({ photo: null });
    }
    const photo = await findStockPhoto(q, orientation);
    res.set('Cache-Control', photo ? 'public, max-age=86400' : 'no-store');
    if (photo)
        return res.json({ photo });
    // Say why there is no photo (missing key, rejected key…) without exposing the key.
    return res.json({ photo: null, reason: stockPhotosEnabled() ? (lastPhotoIssue || 'no_results') : 'no_key' });
});
app.post('/api/ui-design', async (req, res) => {
    try {
        const { prompt, feedback, reference: rawReference } = req.body ?? {};
        // Optional reference image: Pigmento recreates it or takes inspiration from it.
        const reference = (() => {
            const r = rawReference;
            if (!r || typeof r !== 'object')
                return null;
            if (!['image/jpeg', 'image/png', 'image/webp'].includes(r.mimeType))
                return null;
            if (typeof r.data !== 'string' || r.data.length > 1_400_000 || !/^[A-Za-z0-9+/=]+$/.test(r.data))
                return null;
            return { mimeType: r.mimeType, data: r.data, mode: r.mode === 'recreate' ? 'recreate' : 'inspire' };
        })();
        if (rawReference && !reference) {
            return res.status(400).json({ html: '', description: 'The reference image could not be read. Use a JPG, PNG or WebP under 1 MB.' });
        }
        if (!prompt || typeof prompt !== 'string' || prompt.trim().length < 3) {
            return res.status(400).json({ html: '', description: 'Describe the card you want in a few words.' });
        }
        const apiKey = process.env.API_KEY;
        if (!apiKey) {
            console.error('[Backend] API_KEY environment variable is not set');
            return res.status(500).json({ html: '', description: 'CRITICAL: No API Key found. Please configure API_KEY in Google Cloud Run settings.' });
        }
        let sanitizedKey = apiKey.trim();
        if ((sanitizedKey.startsWith('"') && sanitizedKey.endsWith('"')) || (sanitizedKey.startsWith("'") && sanitizedKey.endsWith("'"))) {
            sanitizedKey = sanitizedKey.slice(1, -1);
        }
        if (!sanitizedKey || sanitizedKey.length < 20) {
            return res.status(500).json({ html: '', description: 'CRITICAL: Invalid API Key. Please check Google Cloud Run settings.' });
        }
        const ai = new GoogleGenAI({ apiKey: sanitizedKey });
        const referenceNote = !reference ? '' : reference.mode === 'recreate'
            ? '\nA reference image is attached. Recreate that card as faithfully as the allowed classes and tokens permit: same layout, hierarchy, components, content and copy (keep its language). Replace its colours with the tokens; never copy hex values. If the request text asks for changes, apply them.'
            : '\nA reference image is attached. Use it only as inspiration (layout ideas, density, mood) and build an original card for the request with the allowed classes and tokens. If the request text asks to copy it more closely, do so.';
        const context = `Build this card: ${prompt.trim().slice(0, 600)}` + referenceNote +
            (typeof feedback === 'string' && feedback.trim() ? `\nThe user wants this changed from the previous version: ${feedback.trim().slice(0, 400)}` : '');
        const decision = await decideTurn(req, context, 'design', DESIGN_RESERVED_OUTPUT_TOKENS);
        if (decision.kind === 'refuse')
            return res.status(decision.status).json(decision.body);
        const schema = {
            type: Type.OBJECT,
            properties: {
                title: { type: Type.STRING, description: 'Short card name, 2-4 words.' },
                html: { type: Type.STRING, description: 'One <article class="card"> element using only the allowed classes and CSS variables.' },
            },
            required: ['title', 'html'],
        };
        const generate = (text) => ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: reference
                ? [{ role: 'user', parts: [{ inlineData: { mimeType: reference.mimeType, data: reference.data } }, { text }] }]
                : text,
            config: { systemInstruction: PIGMENTO_CARD_SYSTEM, responseMimeType: 'application/json', responseSchema: schema },
        });
        const metered = await callModelIfAllowed(decision, () => generate(context));
        if (metered.kind === 'refused')
            return res.status(metered.status).json(metered.body);
        const parse = (text) => {
            try {
                return JSON.parse((text || '').replace(/^```json\s*/i, '').replace(/```$/, ''));
            }
            catch {
                return null;
            }
        };
        let response = metered.value;
        let data = parse(response.text);
        let check = validateCardHtml(data?.html ?? '');
        let usageText = response.text || '';
        // One cheap retry with the validator's findings; the second call is metered on the same turn.
        if (!check.ok) {
            console.warn('[Pigmento] card rejected, retrying:', check.errors);
            const retryContents = `${context}\n\nPrevious attempt:\n${data?.html ?? response.text ?? ''}\n\n${cardRetryPrompt(check.errors)}`;
            const second = await generate(retryContents);
            response = second;
            data = parse(second.text);
            check = validateCardHtml(data?.html ?? '');
            usageText += second.text || '';
        }
        const charge = await chargeTurn(metered.decision, context, usageText, response.usageMetadata);
        if (!check.ok) {
            return res.status(422).json({ html: '', description: `Pigmento could not build a valid card: ${check.errors[0]}`, ...charge });
        }
        // Photo slots become real Pexels images after validation, so the model
        // itself never writes a URL.
        const html = await fillPhotoSlots(check.html).catch(() => check.html);
        return res.json({
            title: typeof data?.title === 'string' && data.title.trim() ? data.title.trim().slice(0, 60) : 'Pigmento card',
            html,
            description: 'Card ready.',
            ...charge,
        });
    }
    catch (error) {
        console.error('[Backend] Pigmento card error:', error);
        let userMessage = 'I encountered an error generating the card.';
        if (error?.message) {
            if (error.message.includes('API key not valid') || error.message.includes('400'))
                userMessage = 'Configuration Error (400): The API Key is invalid. Check Google Cloud Console.';
            else if (error.message.toLowerCase().includes('leaked'))
                userMessage = 'Access Denied (403). Google blocked this Gemini API key because it was published. Set a new API_KEY on the server.';
            else if (error.message.includes('403') || error.message.includes('permission denied'))
                userMessage = "Access Denied (403). Please enable 'Generative Language API' in Google Cloud Console for this API Key.";
            else if (error.message.includes('429') || error.message.includes('quota'))
                userMessage = 'API Quota Exceeded. Please try again later.';
            else if (error.message.includes('fetch') || error.message.includes('network'))
                userMessage = 'Network Error. Please check your connection.';
            else
                userMessage = `System Error: ${error.message.slice(0, 100)}`;
        }
        return res.status(500).json({ html: '', description: userMessage });
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
    }
    catch (error) {
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
        }
        else {
            console.log(`[Server] ❌ API_KEY is NOT configured. Create .env.local with: API_KEY=your_gemini_api_key`);
        }
        console.log(`[Server] Stripe webhook ${webhookSecret() ? 'configured' : 'not configured'}`);
    });
}
export { app };
