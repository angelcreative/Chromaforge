import React, { useEffect, useRef, useState } from 'react';
import { ChromaCompanion } from './ChromaCompanion.js';
import { AnimatePresence, motion } from 'motion/react';
import LogoMark from '../LogoMark';
import { presenceFade, useReduced } from '../uiMotion';

type MarkVariant = 'positive' | 'negative';

const markVariant = (): MarkVariant =>
  document.documentElement.dataset.theme === 'dark' ? 'negative' : 'positive';

interface PigmentoButtonProps {
  open: boolean;
  onActivate: () => void;
  attention?: number;
  /** A reply is pending; the label stays hidden while Pigmento is in use. */
  busy?: boolean;
}

const PigmentoButton: React.FC<PigmentoButtonProps> = ({ open, onActivate, attention = 0, busy = false }) => {
  const reduce = useReduced();
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
    <>
      <AnimatePresence>
        {!open && !busy && (
          <motion.button
            key="pigmento-label"
            type="button"
            onClick={() => activateRef.current()}
            className="fixed bottom-[calc(1rem+32px)] right-[calc(1rem+64px+0.5rem)] z-50 flex h-9 translate-y-1/2 items-center gap-2 rounded-xl bg-primary pl-2.5 pr-3 text-[13px] text-primary-foreground shadow-panel"
            {...presenceFade(reduce)}
          >
            <LogoMark motion="loading" className="size-4 shrink-0" />
            Ask Pigmento
          </motion.button>
        )}
      </AnimatePresence>
      <div
        ref={hostRef}
        className={`fixed bottom-4 right-4 z-50 size-16 overflow-hidden rounded-full bg-card shadow-panel focus-within:outline focus-within:outline-2 focus-within:outline-offset-[3px] focus-within:outline-[var(--ring)]${bouncing ? ' pigmento-dock-bounce' : ''}`}
      />
    </>
  );
};

export default PigmentoButton;
