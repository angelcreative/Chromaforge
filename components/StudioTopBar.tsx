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
  <header className="z-40 flex h-14 shrink-0 items-center border-b border-border bg-card px-3">
    <MotionButton
      type="button"
      onClick={onHome}
      className="grid size-10 place-items-center text-foreground"
      aria-label="Chromaforge"
    >
      <LogoMark className="size-6" motion={markMotion} />
    </MotionButton>
  </header>
);

export default StudioTopBar;
