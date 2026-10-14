import React, { useEffect, useRef } from 'react';
import { ChromaCompanion } from './ChromaCompanion.js';

const markVariant = () =>
  document.documentElement.dataset.theme === 'dark' ? 'negative' : 'positive';

/**
 * The animated Pigmento robot as a decorative icon inside another control.
 * Unlike the launcher it takes no focus or clicks and is hidden from
 * assistive tech; the surrounding button carries the label.
 */
const PigmentoMark: React.FC<{ className?: string }> = ({ className = 'size-5' }) => {
  const hostRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    const companion = new (ChromaCompanion as any)(host, { variant: markVariant() });
    const canvas: HTMLCanvasElement = companion.canvas;
    canvas.removeAttribute('role');
    canvas.removeAttribute('aria-label');
    canvas.setAttribute('aria-hidden', 'true');
    canvas.tabIndex = -1;
    canvas.style.pointerEvents = 'none';
    canvas.style.cursor = 'inherit';
    const observer = new MutationObserver(() => companion.setVariant(markVariant()));
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    return () => {
      observer.disconnect();
      companion.dispose();
    };
  }, []);

  return <span ref={hostRef} aria-hidden className={`inline-block shrink-0 ${className}`} />;
};

export default PigmentoMark;
