import React, { useEffect, useRef, useState } from 'react';
import { Copy, Download, FileDown, Heart, Pipette, Plus } from 'lucide-react';
import LogoMark from './LogoMark';
import ThemeToggle from './ThemeToggle';

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
}) => {
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
      <button
        type="button"
        onClick={onHome}
        className="grid size-10 place-items-center text-foreground"
        aria-label="Chromaforge"
      >
        <LogoMark className="size-6" />
      </button>
      <button type="button" onClick={onNewPalette} className={barButton}>
        <Plus className="size-4" strokeWidth={1.5} aria-hidden />
        New palette
      </button>
      <div className="ml-auto flex items-center gap-1">
        {paletteOpen && (
          <>
            <button type="button" onClick={onSave} disabled={saving} aria-pressed={saved} className={barButton}>
              <Heart className="size-4" strokeWidth={1.5} aria-hidden />
              {saved ? 'Saved' : 'Save'}
            </button>
            <button type="button" onClick={onRefine} aria-pressed={refineOpen} className={`${barButton} ${refineOpen ? 'bg-accent' : ''}`}>
              <Pipette className="size-4" strokeWidth={1.5} aria-hidden />
              Refine
            </button>
            <div className="relative" ref={exportRef}>
              <button
                type="button"
                onClick={() => setExportOpen((value) => !value)}
                aria-expanded={exportOpen}
                aria-haspopup="menu"
                className={`${barButton} ${exportOpen ? 'bg-accent' : ''}`}
              >
                <Download className="size-4" strokeWidth={1.5} aria-hidden />
                Export
              </button>
              {exportOpen && (
                <div role="menu" className="absolute right-0 top-full z-50 mt-1 w-56 rounded-xl bg-card p-1 shadow-panel ring-1 ring-border">
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
                      <span className={`absolute top-0.5 left-0.5 size-3 rounded-full bg-white shadow-sm ring-1 ring-black/10 transition-transform ${printOn ? 'translate-x-3' : ''}`} />
                    </span>
                    Print
                  </button>
                </div>
              )}
            </div>
          </>
        )}
        <ThemeToggle />
      </div>
    </header>
  );
};

export default StudioTopBar;
