import React, { useEffect, useRef, useState } from 'react';
import { ChromaCompanion } from './ChromaCompanion.js';
import { Hint } from '../Hint';

type MarkVariant = 'positive' | 'negative';

const markVariant = (): MarkVariant =>
  document.documentElement.dataset.theme === 'dark' ? 'negative' : 'positive';

interface PigmentoButtonProps {
  open: boolean;
  onActivate: () => void;
  attention?: number;
}

const PigmentoButton: React.FC<PigmentoButtonProps> = ({ open, onActivate, attention = 0 }) => {
  const hostRef = useRef<HTMLDivElement>(null);
  const companionRef = useRef<ChromaCompanion | null>(null);
  const activateRef = useRef(onActivate);
  activateRef.current = onActivate;
  const [bouncing, setBouncing] = useState(false);
  const bounceTimer = useRef<number | null>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    const companion = new (ChromaCompanion as any)(host, {
      variant: markVariant(),
      name: 'Pigmento',
      onActivate: () => activateRef.current(),
    });
    companionRef.current = companion;
    const root = document.documentElement;
    const sync = () => companion.setVariant(markVariant());
    const observer = new MutationObserver(sync);
    observer.observe(root, { attributes: true, attributeFilter: ['data-theme'] });
    return () => {
      observer.disconnect();
      companion.dispose();
      companionRef.current = null;
    };
  }, []);

  useEffect(() => {
    companionRef.current?.canvas.setAttribute('aria-expanded', open ? 'true' : 'false');
  }, [open]);

  useEffect(() => {
    if (!attention) return;
    if (open) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    setBouncing(false);
    const start = window.requestAnimationFrame(() => setBouncing(true));
    if (bounceTimer.current !== null) window.clearTimeout(bounceTimer.current);
    bounceTimer.current = window.setTimeout(() => setBouncing(false), 1400);
    return () => {
      window.cancelAnimationFrame(start);
      if (bounceTimer.current !== null) window.clearTimeout(bounceTimer.current);
    };
  }, [attention, open]);

  return (
    <Hint label={open ? 'Close Pigmento' : 'Ask Pigmento'} side="left">
      <div
        ref={hostRef}
        className={`fixed bottom-4 right-4 z-50 size-[46px] overflow-hidden rounded-full bg-card shadow-panel focus-within:outline focus-within:outline-2 focus-within:outline-offset-[3px] focus-within:outline-[var(--ring)]${bouncing ? ' pigmento-dock-bounce' : ''}`}
      />
    </Hint>
  );
};

export default PigmentoButton;
