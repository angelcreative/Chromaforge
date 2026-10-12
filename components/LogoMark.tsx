import React, { useEffect, useRef, useState } from 'react';

const PETALS = [
  'M -2.00 -52.00 L 2.00 -52.00 L 16.00 -35.50 L 7.00 -16.00 L -7.00 -16.00 L -16.00 -35.50 Z',
  'M 44.03 -27.73 L 46.03 -24.27 L 38.74 -3.89 L 17.36 -1.94 L 10.36 -14.06 L 22.74 -31.61 Z',
  'M 46.03 24.27 L 44.03 27.73 L 22.74 31.61 L 10.36 14.06 L 17.36 1.94 L 38.74 3.89 Z',
  'M 2.00 52.00 L -2.00 52.00 L -16.00 35.50 L -7.00 16.00 L 7.00 16.00 L 16.00 35.50 Z',
  'M -44.03 27.73 L -46.03 24.27 L -38.74 3.89 L -17.36 1.94 L -10.36 14.06 L -22.74 31.61 Z',
  'M -46.03 -24.27 L -44.03 -27.73 L -22.74 -31.61 L -10.36 -14.06 L -17.36 -1.94 L -38.74 -3.89 Z',
] as const;

export type LogoMotion = 'still' | 'enter' | 'loading';

const LogoMark: React.FC<{ className?: string; motion?: LogoMotion }> = ({
  className = '',
  motion = 'still',
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [introDone, setIntroDone] = useState(false);

  useEffect(() => {
    if (introDone) return;
    if (motion === 'loading') {
      setIntroDone(true);
      return;
    }
    if (motion !== 'enter') return;

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setIntroDone(true);
      return;
    }

    const node = svgRef.current;
    if (!node) return;

    const finish = (event: AnimationEvent) => {
      if (event.target !== node || event.animationName !== 'logo-turn') return;
      setIntroDone(true);
    };
    node.addEventListener('animationend', finish);
    const fallback = window.setTimeout(() => setIntroDone(true), 700);
    return () => {
      node.removeEventListener('animationend', finish);
      window.clearTimeout(fallback);
    };
  }, [motion, introDone]);

  const mode = motion === 'loading' ? 'loading' : motion === 'enter' && !introDone ? 'enter' : 'still';
  const motionClass = mode === 'loading' ? 'logo-mark--loading' : mode === 'enter' ? 'logo-mark--enter' : '';

  return (
    <svg
      ref={svgRef}
      viewBox="-58 -58 116 116"
      className={['logo-mark', motionClass, className].filter(Boolean).join(' ')}
      aria-hidden
    >
      {PETALS.map((d) => (
        <path key={d} className="logo-petal" fill="currentColor" d={d} />
      ))}
    </svg>
  );
};

export default LogoMark;
