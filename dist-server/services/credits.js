/** Credit packs and token math for the palette assistant. Safe to import from the browser. */
export const FREE_CREDITS = 30;
/** Output tokens cost this many times an input token. */
export const OUTPUT_WEIGHT = 4;
/**
 * Weighted tokens per credit.
 * A short palette prompt plus a reserved reply lands near 10 credits,
 * so the free 30 covers about three short palettes.
 */
export const TOKENS_PER_CREDIT = 150;
/** Output tokens reserved before Gemini is called. */
export const PALETTE_RESERVED_OUTPUT_TOKENS = 220;
export const DESIGN_RESERVED_OUTPUT_TOKENS = 800;
export const PALETTE_SYSTEM = 'You are a color engine. You act as a JSON API. You strictly modify existing arrays when requested.';
export const CREDIT_PACKS = [
    {
        id: 'pack_600',
        credits: 600,
        exactCredits: 600,
        unitAmount: 999,
        currency: 'usd',
        mode: 'payment',
        name: '600 credits',
        priceLabel: '$9.99',
    },
    {
        id: 'pack_2400',
        credits: 2400,
        exactCredits: 2400,
        unitAmount: 3900,
        currency: 'usd',
        mode: 'subscription',
        name: '2.4K credits',
        priceLabel: '$39 a year',
    },
];
export const getPack = (id) => CREDIT_PACKS.find((pack) => pack.id === id);
export const creditsForPack = (packId) => getPack(packId)?.credits ?? 0;
const WALLET_PATTERN = /^[A-Za-z0-9_-]{16,80}$/;
export const isWalletId = (value) => typeof value === 'string' && WALLET_PATTERN.test(value);
/** Compact display. Exact values belong in a tooltip or aria-label. */
export const formatCompact = (value) => {
    if (!Number.isFinite(value))
        return '0';
    const negative = value < 0;
    const text = formatUnsigned(Math.abs(value));
    return negative ? `-${text}` : text;
};
const formatUnsigned = (abs) => {
    if (abs < 1000)
        return String(Math.round(abs));
    const steps = [
        { unit: 1_000, suffix: 'K', next: 1_000_000 },
        { unit: 1_000_000, suffix: 'M', next: 1_000_000_000 },
        { unit: 1_000_000_000, suffix: 'B', next: 1_000_000_000_000 },
        { unit: 1_000_000_000_000, suffix: 'T', next: Number.POSITIVE_INFINITY },
    ];
    for (let index = 0; index < steps.length; index += 1) {
        const step = steps[index];
        if (abs >= step.next)
            continue;
        const rounded = Math.round((abs / step.unit) * 10) / 10;
        if (rounded >= 1000 && index < steps.length - 1) {
            const promoted = steps[index + 1];
            const promotedValue = Math.round((abs / promoted.unit) * 10) / 10;
            return `${promotedValue.toFixed(1)}${promoted.suffix}`;
        }
        return `${rounded.toFixed(1)}${step.suffix}`;
    }
    return `${Math.round(abs)}`;
};
export const estimateTokens = (text) => Math.max(1, Math.ceil(text.length / 4));
export const creditsForTokens = (inputTokens, outputTokens) => {
    const input = Math.max(0, Math.floor(inputTokens));
    const output = Math.max(0, Math.floor(outputTokens));
    const weighted = input + output * OUTPUT_WEIGHT;
    if (weighted <= 0)
        return 1;
    return Math.max(1, Math.ceil(weighted / TOKENS_PER_CREDIT));
};
export const estimateRequestCredits = (prompt, reservedOutputTokens = PALETTE_RESERVED_OUTPUT_TOKENS) => creditsForTokens(estimateTokens(prompt), reservedOutputTokens);
/** Same text the palette route sends to Gemini, including the system instruction. */
export const buildPalettePrompt = (history, currentPalette) => {
    const historyText = history.map((message) => `${message.role === 'user' ? 'User' : 'Model'}: ${message.text}`).join('\n');
    const currentPaletteContext = currentPalette.map((color) => `- Name: "${color.name}", Hex: ${color.hex}`).join('\n');
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
    return `${context}\n${PALETTE_SYSTEM}`;
};
/** Firestore checkout_sessions document for the installed Stripe extension. */
export const buildCheckoutSession = (packId, input) => {
    const pack = getPack(packId);
    if (!pack)
        throw new Error('Unknown credit pack');
    const path = input.path && input.path.startsWith('/') ? input.path : '/';
    const origin = input.origin.replace(/\/$/, '');
    const session = {
        client: 'web',
        mode: pack.mode,
        success_url: `${origin}${path}?checkout=success&pack=${pack.id}`,
        cancel_url: `${origin}${path}?checkout=cancel`,
        metadata: {
            pack: pack.id,
            credits: String(pack.credits),
            walletId: input.walletId,
        },
        client_reference_id: input.walletId,
        allow_promotion_codes: false,
    };
    const purchaseMetadata = {
        pack: pack.id,
        walletId: input.walletId,
    };
    if (pack.mode === 'subscription') {
        session.subscription_data = { metadata: purchaseMetadata };
    }
    else {
        session.payment_intent_data = { metadata: purchaseMetadata };
    }
    if (input.priceId) {
        session.price = input.priceId;
        session.quantity = 1;
    }
    else {
        const priceData = {
            currency: pack.currency,
            unit_amount: pack.unitAmount,
            product_data: { name: `${pack.exactCredits} Chromaforge credits` },
        };
        if (pack.mode === 'subscription') {
            priceData.recurring = { interval: 'year' };
        }
        session.line_items = [{ quantity: 1, price_data: priceData }];
    }
    return session;
};
const refusalBody = (kind, description, extra = {}) => {
    if (kind === 'design') {
        return { code: '', description, paymentRequired: true, ...extra };
    }
    return {
        name: 'Not enough credits',
        colors: [],
        description,
        paymentRequired: true,
        ...extra,
    };
};
export const prepareTurn = (input) => {
    const kind = input.kind ?? 'palette';
    if (input.owner)
        return { kind: 'owner' };
    if (!isWalletId(input.walletId)) {
        return {
            kind: 'refuse',
            status: 400,
            body: refusalBody(kind, 'Missing credit wallet.'),
        };
    }
    const estimate = estimateRequestCredits(input.prompt, input.reservedOutputTokens);
    if (input.balance < estimate) {
        return {
            kind: 'refuse',
            status: 402,
            body: refusalBody(kind, 'Not enough credits.', {
                creditsNeeded: estimate,
                creditsRemaining: input.balance,
            }),
        };
    }
    return {
        kind: 'metered',
        walletId: input.walletId,
        estimate,
        balance: input.balance,
    };
};
/** Runs generate only when the turn fits the balance. Gemini stays inside generate. */
export const callModelIfAllowed = async (decision, generate) => {
    if (decision.kind === 'refuse') {
        return { kind: 'refused', status: decision.status, body: decision.body };
    }
    const value = await generate();
    return { kind: 'called', value, decision };
};
export const tokensFromUsage = (usage, fallback) => {
    const input = usage?.promptTokenCount;
    const output = (usage?.candidatesTokenCount ?? 0) + (usage?.thoughtsTokenCount ?? 0);
    if (typeof input === 'number' && input > 0 && output > 0) {
        return { inputTokens: input, outputTokens: output };
    }
    return {
        inputTokens: estimateTokens(fallback.prompt),
        outputTokens: Math.max(1, estimateTokens(fallback.output)),
    };
};
