import React from 'react';
import LogoMark, { type LogoMotion } from './LogoMark';
import { MotionButton } from './uiMotion';

export interface StudioTopBarProps {
  onHome: () => void;
  markMotion?: LogoMotion;
}

const WORDMARK = 'Chroma Forge';

const LogoWordmark: React.FC = () => (
  <span
    aria-hidden
    className="logo-wordmark pointer-events-none absolute top-1/2 left-[calc(50%+20px)] -translate-y-1/2 whitespace-nowrap text-[15px] font-medium leading-none tracking-tight"
  >
    {Array.from(WORDMARK, (char, index) => (
      <span
        key={`${char}-${index}`}
        className="logo-wordmark-letter"
        style={{ '--logo-letter': index } as React.CSSProperties}
      >
        {char === ' ' ? '\u00A0' : char}
      </span>
    ))}
  </span>
);

const StudioTopBar: React.FC<StudioTopBarProps> = ({
  onHome,
  markMotion = 'enter',
}) => (
  <header className="pointer-events-none absolute top-0 left-0 z-50 bg-transparent">
    <MotionButton
      type="button"
      onClick={onHome}
      className="group pointer-events-auto relative ml-3 mt-2 grid size-10 place-items-center bg-transparent text-foreground"
      aria-label="Chroma Forge"
    >
      <LogoMark className="size-6" motion={markMotion} />
      <LogoWordmark />
    </MotionButton>
  </header>
);

export default StudioTopBar;
