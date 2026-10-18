/**
 * Pigmento "create a card" pipeline (server side).
 *
 * The model writes plain HTML against the playground's component layer
 * (.card, .btn, .field, .tag, .tgl …) and the token variables
 * (var(--accent), var(--text-2) …). No framework, no hex, no scripts, no
 * network. The client renders the result inside a sandboxed iframe with the
 * same stylesheet and tokens the built-in cards use, so a generated card is
 * indistinguishable from a hand-written one and re-themes instantly.
 */
export const CARD_COMPONENT_REFERENCE = `
Available classes (from playground.css):
- Layout: .card (root, required), .row, .row.between, .col, .mt, .mt-s, .divider
- Text: h3 (card title), p, .muted (secondary), .faint (tertiary), .sm, .xs, .stat (big number), .mono, .kbd
- Buttons: .btn (primary), .btn.soft, .btn.line, .btn.ink (strong neutral), .btn.plain (no background), .btn.ghost (neutral fill), .btn.icon, .btn.round, .btn.full, disabled attribute
- Panel: <div class="panel">…</div> (dominant-tinted block for key facts, totals or a summary band)
- Inputs: .lbl (label), .field (input/select/textarea), .pin > input (code digits), .drop (dropzone)
- Toggle: <button class="tgl" role="switch" aria-checked="true" data-state="checked"> (use data-state="unchecked" when off)
- Tags / pills: .tag, .tag.success, .tag.warning, .tag.danger, .tag.info
- Status callout: <div class="note info"><svg class="ico s">…</svg><span><b>Heads up.</b> Text</span></div> (variants: success, warning, danger, info; plain .note uses the accent)
- Field hint under an input: <p class="hint danger">Incorrect password</p> (variants: success, warning, danger, info; plain .hint is neutral). Mark the input itself with aria-invalid="true" when it has an error.
- Status dot: <span class="dot success"></span> (success, warning, danger, info) · Trend: <span class="up">+12%</span> / <span class="down">-4%</span>
- Avatar: <span class="av">AB</span>, .av.lg
- Progress: <div class="bar-t"><i style="width:60%"></i></div>
- Segmented: <div class="seg-t"><button aria-pressed="true">A</button><button>B</button></div>
- Photo: <div class="photo" data-photo="salmon poke bowl" role="img" aria-label="Salmon poke bowl" style="aspect-ratio:16/9"></div>
  The server swaps it for a real stock photo matching data-photo (2-5 plain English words describing the subject). Use it whenever the card shows food, a product, a place, a person, travel, music or any real-world subject. For small thumbnails set a size, e.g. style="width:48px;height:48px;border-radius:var(--r-sm)". Max 3 photos. Never write <img> or URLs yourself.
- Abstract image stand-in (no subject): <div class="hero" style="aspect-ratio:16/9"></div>
- Chat: .bubble.in / .bubble.out · Calendar: .cal · Chart bars: .bars > i (.hi for highlight) · Ticket: .ticket, .iata, .perf
- Inline SVG icons are allowed (stroke="currentColor", 24x24 viewBox, class="ico" or "ico s").

Available CSS variables (use ONLY these for colour):
--bg --surface --surface-2 --input --border --border-strong
--text --text-2 --text-3
--accent --on-accent --accent-hover --accent-soft --on-accent-soft --accent-text --focus
--dominant-soft --on-dominant-soft --dominant-tint (the 60% content colour: panels, bubbles, fills)
--secondary-soft --on-secondary-soft --secondary-text (the supporting 30% colour: chips, avatars, secondary fills; .tag and .av already use it)
--success --success-soft --on-success-soft --success-text  --warning --warning-soft --on-warning-soft --warning-text
--danger --danger-soft --on-danger-soft --danger-text  --info --info-soft --on-info-soft --info-text
(--x-text is the readable status colour for text on --surface; --x is for fills, dots and icons)
--disabled-bg --disabled-text --switch-off
--p-50 … --p-950 (accent ramp)  --s-50 … --s-950 (secondary ramp)  --d-50 … --d-950 (dominant ramp: large fills and image areas)  --n-50 … --n-950 (neutral ramp)
--r-sm --r-md --r-lg (radius)
`;
const EXAMPLE_CARD = `<article class="card" aria-label="Boarding pass">
  <div class="row between sm"><b style="color:var(--accent-text)">Chroma Air</b><span class="muted">Flight CA 2041</span></div>
  <div class="ticket mt">
    <div><p class="iata">MAD</p><p class="xs muted">Madrid · 07:40</p></div>
    <svg class="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" style="color:var(--accent-text)"><path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z"/></svg>
    <div><p class="iata">LIS</p><p class="xs muted">Lisbon · 07:55</p></div>
  </div>
  <div class="perf"></div>
  <div class="row between sm">
    <div><p class="xs muted">Gate</p><b>K42</b></div><div><p class="xs muted">Seat</p><b>14A</b></div><div><p class="xs muted">Boarding</p><b>07:10</b></div>
  </div>
</article>`;
export const PIGMENTO_CARD_SYSTEM = `You are Pigmento, the UI assistant inside Chromaforge. You build small, polished UI cards that showcase the user's color palette.
You output ONLY a JSON object: {"title": string, "html": string}. The html is ONE <article class="card"> element.
Hard rules:
- Use ONLY the classes and CSS variables listed. Colour comes exclusively from var(--…). Never write hex, rgb(), hsl(), named colours, or Tailwind classes.
- No <script>, <style>, <img>, <video>, <iframe>, <form>, external URLs, or inline event handlers. Links use href="#".
- Realistic, specific copy (names, places, amounts). Sentence case. No lorem ipsum. No emoji.
- Keep it compact: one card, roughly 8–25 lines of HTML, like the example.
- The card has no border (the .card class is borderless by design). Don't add a border to the card unless the user explicitly asks for one.
- Every interactive control needs an accessible name (text or aria-label).
- Colour roles follow 60-30-10, as a guide rather than a quota. Neutrals are the canvas and take no role: the card surface, text, borders and low-emphasis controls stay neutral. Not every element needs colour or a background; leave things neutral when colour adds nothing.
  · 10% accent: the ONE main action per card as .btn, plus links, checked switches, progress fills and the active item. Never large areas or decoration.
  · 30% secondary: supporting pieces: .tag chips, .av avatars, .btn.soft secondary actions, chart bars, icon tiles (span.av with an svg).
  · 60% dominant: large content areas, never controls: .hero or .photo slots, .panel blocks (a tinted band for key facts, totals, summaries), chat bubbles (.bubble.in) and drop zones.
  · Buttons by emphasis: main action .btn; secondary .btn.soft or .btn.line; strong neutral .btn.ink (black on light, white on dark) for steppers or a high-contrast secondary; icon-only and low-emphasis actions are .btn.plain.icon with no background. Only the main CTA gets a coloured fill. Never paint colours on buttons yourself.
- Use the semantic colours wherever the content has a state: success for done/paid/online/positive change, warning for pending/expiring/low stock, danger for errors/overdue/destructive actions, info for neutral notices/new. Reach for .tag, .note, .hint, .dot, .up/.down. The accent is for the main action and brand, not for status.
${CARD_COMPONENT_REFERENCE}
Example of a good card:
${EXAMPLE_CARD}`;
const BLOCKED_BLOCKS = /<\s*(script|style|iframe|object|template)\b[\s\S]*?<\s*\/\s*\1\s*>/gi;
const BLOCKED_TAGS = /<\s*\/?\s*(script|style|img|video|audio|iframe|object|embed|form|link|meta|base)\b[^>]*>/gi;
const ON_ATTR = /\s+on[a-z]+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi;
const JS_URL = /\s+(href|src|xlink:href)\s*=\s*("|')\s*javascript:[^"']*\2/gi;
const EXTERNAL_URL = /(https?:)?\/\/[^\s"')]+/i;
const HEX = /#(?:[0-9a-f]{3}|[0-9a-f]{4}|[0-9a-f]{6}|[0-9a-f]{8})\b/i;
const RAW_COLOR = /\b(rgba?|hsla?|oklch|oklab|color)\s*\(/i;
/** Strip anything dangerous, then validate against the token-only contract. */
export function validateCardHtml(raw) {
    const errors = [];
    let html = String(raw || '').trim();
    // Unwrap accidental fences
    html = html.replace(/^```(?:html)?\s*/i, '').replace(/\s*```$/, '').trim();
    // Sanitise
    html = html.replace(BLOCKED_BLOCKS, '').replace(BLOCKED_TAGS, '').replace(ON_ATTR, '').replace(JS_URL, ' $1="#"');
    if (!/^<article\b[^>]*class=["'][^"']*\bcard\b/i.test(html))
        errors.push('Root element must be <article class="card">.');
    if (!/<\/article>\s*$/i.test(html))
        errors.push('HTML must end with </article>.');
    if (html.length > 7000)
        errors.push('Card is too long (max 7000 characters).');
    if (EXTERNAL_URL.test(html))
        errors.push('External URLs are not allowed.');
    const hexMatch = html.match(HEX);
    if (hexMatch)
        errors.push(`Hard-coded colour "${hexMatch[0]}" found. Use var(--…) tokens only.`);
    const rawMatch = html.match(RAW_COLOR);
    if (rawMatch)
        errors.push(`Raw colour function "${rawMatch[0].trim()}" found. Use var(--…) tokens only.`);
    if (/\bclass=["'][^"']*\b(bg-|text-|p-\d|rounded|flex-|grid-)/.test(html))
        errors.push('Tailwind utility classes are not allowed.');
    return { ok: errors.length === 0, html, errors };
}
export const cardRetryPrompt = (errors) => `Your previous answer was rejected:\n- ${errors.join('\n- ')}\nFix these and answer again with the same JSON shape.`;
