import React from 'react';
import LogoMark, { type LogoMotion } from './LogoMark';
import { MotionButton } from './uiMotion';

export interface StudioTopBarProps {
  onHome: () => void;
  markMotion?: LogoMotion;
}

const StudioTopBar: React.FC<StudioTopBarProps> = ({
  onHome,
  markMotion = 'enter',
}) => (
  <header className="pointer-events-none absolute top-0 left-0 z-50 bg-transparent">
    <MotionButton
      type="button"
      onClick={onHome}
      className="pointer-events-auto ml-3 mt-2 grid size-10 place-items-center bg-transparent text-foreground"
      aria-label="Chromaforge"
    >
      <LogoMark className="size-6" motion={markMotion} />
    </MotionButton>
  </header>
);

export default StudioTopBar;
