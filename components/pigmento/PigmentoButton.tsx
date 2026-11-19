import React, { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import LogoMark from '../LogoMark';
import PigmentoOrb from './PigmentoOrb';
import { presenceFade, useReduced } from '../uiMotion';

interface PigmentoButtonProps {
  open: boolean;
  onActivate: () => void;
  attention?: number;
  /** A reply is pending; the label stays hidden while Pigmento is in use. */
  busy?: boolean;
  /** Palette colours for the orb. */
  colors?: string[];
}

const PigmentoButton: React.FC<PigmentoButtonProps> = ({ open, onActivate, attention = 0, busy = false, colors }) => {
  const reduce = useReduced();
  const activateRef = useRef(onActivate);
  activateRef.current = onActivate;
  const [bouncing, setBouncing] = useState(false);
  const bounceTimer = useRef<number | null>(null);

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
      <button
        type="button"
        onClick={() => activateRef.current()}
        aria-label="Pigmento"
        aria-expanded={open}
        className={`fixed bottom-4 right-4 z-50 size-16 rounded-[30%] transition-transform hover:scale-[1.04] active:scale-95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--ring)]${bouncing ? ' pigmento-dock-bounce' : ''}`}
      >
        {/* With the panel open Pigmento looks up at it */}
        <PigmentoOrb className="size-16" colors={colors} busy={busy} track={!open} gaze={open && !busy ? { x: -0.35, y: -0.8 } : null} />
      </button>
    </>
  );
};

export default PigmentoButton;
