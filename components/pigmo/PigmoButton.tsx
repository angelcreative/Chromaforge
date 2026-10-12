import React, { useEffect, useRef } from 'react';
import { ChromaCompanion } from './ChromaCompanion.js';

type MarkVariant = 'positive' | 'negative';

const markVariant = (): MarkVariant =>
  document.documentElement.dataset.theme === 'dark' ? 'negative' : 'positive';

interface PigmoButtonProps {
  open: boolean;
  onActivate: () => void;
}

const PigmoButton: React.FC<PigmoButtonProps> = ({ open, onActivate }) => {
  const hostRef = useRef<HTMLDivElement>(null);
  const companionRef = useRef<ChromaCompanion | null>(null);
  const activateRef = useRef(onActivate);
  activateRef.current = onActivate;

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    const companion = new ChromaCompanion(host, {
      variant: markVariant(),
      name: 'Pigmo',
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

  return (
    <div
      ref={hostRef}
      className="fixed bottom-4 right-4 z-50 size-[4.5rem] max-h-[128px] max-w-[128px] overflow-hidden rounded-full focus-within:outline focus-within:outline-2 focus-within:outline-offset-[3px] focus-within:outline-[var(--ring)]"
    />
  );
};

export default PigmoButton;
