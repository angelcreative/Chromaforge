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

export const PALETTE_SYSTEM =
  'You are a color engine. You act as a JSON API. You strictly modify existing arrays when requested.';

export type CreditPackId = 'pack_600' | 'pack_2400';

export interface CreditPack {
  id: CreditPackId;
  credits: number;
  unitAmount: number;
  currency: 'usd';
  mode: 'payment' | 'subscription';
  /** Compact name for the button. */
  name: string;
  /** Exact count for aria-label and title. */
  exactCredits: number;
  priceLabel: string;
}

export const CREDIT_PACKS: readonly CreditPack[] = [
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

export const getPack = (id: string): CreditPack | undefined =>
  CREDIT_PACKS.find((pack) => pack.id === id);

export const creditsForPack = (packId: string): number => getPack(packId)?.credits ?? 0;

const WALLET_PATTERN = /^[A-Za-z0-9_-]{16,80}$/;

export const isWalletId = (value: unknown): value is string =>
  typeof value === 'string' && WALLET_PATTERN.test(value);

/** Compact display. Exact values belong in a tooltip or aria-label. */
export const formatCompact = (value: number): string => {
  if (!Number.isFinite(value)) return '0';
  const negative = value < 0;
  const text = formatUnsigned(Math.abs(value));
  return negative ? `-${text}` : text;
};

const formatUnsigned = (abs: number): string => {
  if (abs < 1000) return String(Math.round(abs));
  const steps = [
    { unit: 1_000, suffix: 'K', next: 1_000_000 },
    { unit: 1_000_000, suffix: 'M', next: 1_000_000_000 },
    { unit: 1_000_000_000, suffix: 'B', next: 1_000_000_000_000 },
    { unit: 1_000_000_000_000, suffix: 'T', next: Number.POSITIVE_INFINITY },
  ];
  for (let index = 0; index < steps.length; index += 1) {
    const step = steps[index];
    if (abs >= step.next) continue;
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

export const estimateTokens = (text: string): number =>
  Math.max(1, Math.ceil(text.length / 4));

export const creditsForTokens = (inputTokens: number, outputTokens: number): number => {
  const input = Math.max(0, Math.floor(inputTokens));
  const output = Math.max(0, Math.floor(outputTokens));
  const weighted = input + output * OUTPUT_WEIGHT;
  if (weighted <= 0) return 1;
  return Math.max(1, Math.ceil(weighted / TOKENS_PER_CREDIT));
};

export const estimateRequestCredits = (
  prompt: string,
  reservedOutputTokens = PALETTE_RESERVED_OUTPUT_TOKENS,
): number => creditsForTokens(estimateTokens(prompt), reservedOutputTokens);

/** Reserved cost of one generated palette, using the same short prompt the meter tests. */
export const generatedPaletteCredits = (): number =>
  estimateRequestCredits(buildPalettePrompt(
    [{ role: 'user', text: 'A calm coastal studio' }],
    [],
  ));

/** How many of those palettes a credit amount covers. */
export const palettesCovered = (credits: number): number => {
  const cost = generatedPaletteCredits();
  if (cost <= 0) return 0;
  return Math.floor(Math.max(0, credits) / cost);
};

export interface PromptTurn {
  role: string;
  text: string;
}

export interface PromptColor {
  name: string;
  hex: string;
}

/** Same text the palette route sends to Gemini, including the system instruction. */
export const buildPalettePrompt = (history: PromptTurn[], currentPalette: PromptColor[]): string => {
  const historyText = history.map((message) =>
    `${message.role === 'user' ? 'User' : 'Model'}: ${message.text}`
  ).join('\n');
  const currentPaletteContext = currentPalette.map((color) =>
    `- Name: "${color.name}", Hex: ${color.hex}`
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
  return `${context}\n${PALETTE_SYSTEM}`;
};

export interface CheckoutInput {
  origin: string;
  path?: string;
  walletId: string;
  priceId?: string;
}

/** Firestore checkout_sessions document for the installed Stripe extension. */
export const buildCheckoutSession = (packId: CreditPackId, input: CheckoutInput): Record<string, unknown> => {
  const pack = getPack(packId);
  if (!pack) throw new Error('Unknown credit pack');
  const path = input.path && input.path.startsWith('/') ? input.path : '/';
  const origin = input.origin.replace(/\/$/, '');
  const session: Record<string, unknown> = {
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
  } else {
    session.payment_intent_data = { metadata: purchaseMetadata };
  }
  if (input.priceId) {
    session.price = input.priceId;
    session.quantity = 1;
  } else {
    const priceData: Record<string, unknown> = {
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

export type TurnDecision =
  | { kind: 'owner' }
  | { kind: 'metered'; walletId: string; estimate: number; balance: number }
  | { kind: 'refuse'; status: number; body: Record<string, unknown> };

export interface PrepareInput {
  owner: boolean;
  walletId: unknown;
  prompt: string;
  balance: number;
  reservedOutputTokens?: number;
  kind?: 'palette' | 'design';
}

const refusalBody = (
  kind: 'palette' | 'design',
  description: string,
  extra: Record<string, unknown> = {},
): Record<string, unknown> => {
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

export const prepareTurn = (input: PrepareInput): TurnDecision => {
  const kind = input.kind ?? 'palette';
  if (input.owner) return { kind: 'owner' };
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

export interface MeteredSuccess<T> {
  kind: 'called';
  value: T;
  decision: Exclude<TurnDecision, { kind: 'refuse' }>;
}

export interface MeteredRefusal {
  kind: 'refused';
  status: number;
  body: Record<string, unknown>;
}

/** Runs generate only when the turn fits the balance. Gemini stays inside generate. */
export const callModelIfAllowed = async <T>(
  decision: TurnDecision,
  generate: () => Promise<T>,
): Promise<MeteredSuccess<T> | MeteredRefusal> => {
  if (decision.kind === 'refuse') {
    return { kind: 'refused', status: decision.status, body: decision.body };
  }
  const value = await generate();
  return { kind: 'called', value, decision };
};

export const tokensFromUsage = (
  usage: {
    promptTokenCount?: number;
    candidatesTokenCount?: number;
    thoughtsTokenCount?: number;
  } | null | undefined,
  fallback: { prompt: string; output: string },
): { inputTokens: number; outputTokens: number } => {
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
