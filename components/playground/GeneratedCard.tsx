import React, { useMemo, useRef, useState } from 'react';
import { Check, Copy, RefreshCw, Trash2 } from 'lucide-react';
import playgroundCss from './playground.css?raw';
import type { GeneratedCard as GeneratedCardData } from '../../services/pigmentoCardsService';

interface Props {
  card: GeneratedCardData;
  tokensCss: string; // ".pg { --accent: … }"
  busy?: boolean;
  onRegenerate: (card: GeneratedCardData) => void;
  onDelete: (card: GeneratedCardData) => void;
}

const FONT_FACES = `
@font-face{font-family:Geist;src:url('/fonts/Geist-Variable.woff2') format('woff2');font-weight:100 900;font-display:swap}
@font-face{font-family:'Geist Mono';src:url('/fonts/GeistMono-Variable.woff2') format('woff2');font-weight:100 900;font-display:swap}
html,body{margin:0;background:transparent}
body{padding:0}
.pg .card{margin:0}
`;

/**
 * A Pigmento card is plain HTML already validated on the server. It renders in
 * an iframe with no script permission, using the same stylesheet and token
 * variables as the built-in cards, so it re-themes together with them.
 */
export const GeneratedCardView: React.FC<Props> = ({ card, tokensCss, busy, onRegenerate, onDelete }) => {
  const frame = useRef<HTMLIFrameElement>(null);
  const [height, setHeight] = useState(220);
  const [copied, setCopied] = useState(false);

  const srcDoc = useMemo(
    () => `<!doctype html><html><head><meta charset="utf-8"><style>${FONT_FACES}${playgroundCss}${tokensCss}</style></head><body><div class="pg">${card.html}</div></body></html>`,
    [card.html, tokensCss],
  );

  const measure = () => {
    const doc = frame.current?.contentDocument;
    const h = doc?.body?.scrollHeight;
    if (h && Math.abs(h - height) > 2) setHeight(h);
  };

  const copy = () => {
    navigator.clipboard?.writeText(card.html).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  };

  return (
    <div className="card gen" style={{ padding: 0, border: 0, background: 'transparent', overflow: 'visible' }}>
      <iframe
        ref={frame}
        title={card.title}
        sandbox="allow-same-origin"
        srcDoc={srcDoc}
        onLoad={measure}
        style={{ height, opacity: busy ? 0.5 : 1, transition: 'opacity .2s' }}
        loading="lazy"
      />
      <div className="gen-tools" role="group" aria-label={`${card.title} actions`}>
        <button type="button" className="btn ghost" style={{ height: 30, fontSize: 12 }} onClick={() => onRegenerate(card)} disabled={busy} aria-label="Regenerate">
          <RefreshCw className="ico s" strokeWidth={1.8} /> Regenerate
        </button>
        <button type="button" className="btn ghost icon" style={{ height: 30, width: 30 }} onClick={copy} aria-label={copied ? 'Copied' : 'Copy HTML'}>
          {copied ? <Check className="ico s" strokeWidth={1.8} /> : <Copy className="ico s" strokeWidth={1.8} />}
        </button>
        <button type="button" className="btn ghost icon" style={{ height: 30, width: 30, color: 'var(--danger)' }} onClick={() => onDelete(card)} aria-label="Delete card">
          <Trash2 className="ico s" strokeWidth={1.8} />
        </button>
      </div>
    </div>
  );
};
