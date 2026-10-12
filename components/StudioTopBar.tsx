import { AnimatePresence, motion } from 'motion/react';
import React, { useEffect, useRef, useState } from 'react';
import { Copy, Download, FileDown, Heart, Pipette, Plus } from 'lucide-react';
import LogoMark, { type LogoMotion } from './LogoMark';
import ThemeToggle from './ThemeToggle';
import { MotionButton, SwitchThumb, presencePop, useReduced } from './uiMotion';

export interface StudioTopBarProps {
  onHome: () => void;
  onNewPalette: () => void;
  paletteOpen: boolean;
  onSave: () => void;
  saved: boolean;
  saving: boolean;
  refineOpen: boolean;
  onRefine: () => void;
  onCopySkill: () => void;
  onDownloadSkill: () => void;
  printOn: boolean;
  onTogglePrint: () => void;
  markMotion?: LogoMotion;
}

const barButton =
  'inline-flex h-9 items-center gap-1.5 rounded-lg px-2.5 text-[13px] text-foreground hover:bg-accent disabled:opacity-40';

const StudioTopBar: React.FC<StudioTopBarProps> = ({
  onHome,
  onNewPalette,
  paletteOpen,
  onSave,
  saved,
  saving,
  refineOpen,
  onRefine,
  onCopySkill,
  onDownloadSkill,
  printOn,
  onTogglePrint,
  markMotion = 'enter',
}) => {
  const reduce = useReduced();
  const menu = presencePop(reduce, 'top right');
  const [exportOpen, setExportOpen] = useState(false);
  const exportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!exportOpen) return;
    const onPointer = (event: MouseEvent) => {
      if (!exportRef.current?.contains(event.target as Node)) setExportOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setExportOpen(false);
    };
    document.addEventListener('mousedown', onPointer);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onPointer);
      document.removeEventListener('keydown', onKey);
    };
  }, [exportOpen]);

  useEffect(() => {
    if (!paletteOpen) setExportOpen(false);
  }, [paletteOpen]);

  return (
    <header className="z-40 flex h-14 shrink-0 items-center gap-1 border-b border-border bg-card px-3">
      <MotionButton
        type="button"
        onClick={onHome}
        className="grid size-10 place-items-center text-foreground"
        aria-label="Chromaforge"
      >
        <LogoMark className="size-6" motion={markMotion} />
      </MotionButton>
      <MotionButton type="button" onClick={onNewPalette} className={barButton}>
        <Plus className="size-4" strokeWidth={1.5} aria-hidden />
        New palette
      </MotionButton>
      <div className="ml-auto flex items-center gap-1">
        {paletteOpen && (
          <>
            <MotionButton type="button" onClick={onSave} disabled={saving} aria-pressed={saved} className={barButton}>
              <Heart className="size-4" strokeWidth={1.5} aria-hidden />
              {saved ? 'Saved' : 'Save'}
            </MotionButton>
            <MotionButton type="button" onClick={onRefine} aria-pressed={refineOpen} className={`${barButton} ${refineOpen ? 'bg-accent' : ''}`}>
              <Pipette className="size-4" strokeWidth={1.5} aria-hidden />
              Refine
            </MotionButton>
            <div className="relative" ref={exportRef}>
              <MotionButton
                type="button"
                onClick={() => setExportOpen((value) => !value)}
                aria-expanded={exportOpen}
                aria-haspopup="menu"
                className={`${barButton} ${exportOpen ? 'bg-accent' : ''}`}
              >
                <Download className="size-4" strokeWidth={1.5} aria-hidden />
                Export
              </MotionButton>
              <AnimatePresence>
              {exportOpen && (
                <motion.div role="menu" className="absolute right-0 top-full z-50 mt-1 w-56 rounded-xl bg-card p-1 shadow-panel ring-1 ring-border" {...menu}>
                  <button
                    type="button"
                    role="menuitem"
                    className="flex h-9 w-full items-center gap-2 rounded-lg px-2 text-left text-[13px] text-foreground hover:bg-accent"
                    onClick={() => { onCopySkill(); setExportOpen(false); }}
                  >
                    <Copy className="size-4" strokeWidth={1.5} aria-hidden />
                    Copy color.md
                  </button>
                  <button
                    type="button"
                    role="menuitem"
                    className="flex h-9 w-full items-center gap-2 rounded-lg px-2 text-left text-[13px] text-foreground hover:bg-accent"
                    onClick={() => { onDownloadSkill(); setExportOpen(false); }}
                  >
                    <FileDown className="size-4" strokeWidth={1.5} aria-hidden />
                    Download color.md
                  </button>
                  <button
                    type="button"
                    role="menuitemcheckbox"
                    aria-checked={printOn}
                    className="flex h-9 w-full items-center gap-2 rounded-lg px-2 text-left text-[13px] text-foreground hover:bg-accent"
                    onClick={onTogglePrint}
                  >
                    <span className={`relative h-4 w-7 shrink-0 rounded-full ${printOn ? 'bg-primary' : 'bg-[var(--switch)]'}`}>
                      <SwitchThumb on={printOn} onX={12} />
                    </span>
                    Print
                  </button>
                </motion.div>
              )}
              </AnimatePresence>
            </div>
          </>
        )}
        <ThemeToggle />
      </div>
    </header>
  );
};

export default StudioTopBar;
