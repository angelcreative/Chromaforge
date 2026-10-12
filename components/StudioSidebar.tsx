import { AnimatePresence, motion } from 'motion/react';
import React, { useEffect, useRef, useState } from 'react';
import { Copy, Download, FileDown, Heart, Library, PanelLeft, PanelLeftClose, Pipette, Plus } from 'lucide-react';
import { SavedPalette } from '../services/storageService';
import ThemeToggle from './ThemeToggle';
import { MotionButton, SwitchThumb, presenceFade, presencePop, presenceSlide, useReduced } from './uiMotion';

export interface StudioSidebarProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSavedPalettes: () => void;
  palettes: SavedPalette[];
  onLoadPalette: (palette: SavedPalette) => void;
  activePaletteId?: string | null;
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

const SWATCH_LIMIT = 5;

const actionRow =
  'flex h-9 w-full items-center rounded-lg text-[13px] text-foreground transition-colors hover:bg-accent disabled:opacity-40';

const menuItem =
  'flex h-8 w-full items-center gap-2 rounded-lg px-2 text-left text-[13px] text-foreground hover:bg-accent';

function GroupLabel({ children }: { children: string }) {
  return (
    <h2 className="px-2.5 pb-1 pt-3 text-[12px] font-medium text-muted-foreground">{children}</h2>
  );
}

const StudioSidebar: React.FC<StudioSidebarProps> = ({
  open,
  onOpenChange,
  onSavedPalettes,
  palettes,
  onLoadPalette,
  activePaletteId,
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
  const reduce = useReduced();
  const slide = presenceSlide(reduce, { x: '-100%' });
  const fade = presenceFade(reduce);
  const menu = presencePop(reduce, 'top left');
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
    if (!open || !paletteOpen) setExportOpen(false);
  }, [open, paletteOpen]);

  return (
    <>
      <AnimatePresence>
        {open && (
          <motion.button
            key="scrim"
            type="button"
            aria-label="Hide tools"
            className="fixed inset-0 z-30 bg-black/30 md:hidden"
            onClick={() => onOpenChange(false)}
            {...fade}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {open ? (
          <motion.aside
            key="panel"
            className="absolute top-14 bottom-4 left-3 z-40 flex w-[min(260px,calc(100vw-4.5rem))] flex-col overflow-hidden rounded-2xl bg-card shadow-panel ring-1 ring-border"
            aria-label="Tools"
            {...slide}
          >
            <div className="min-h-0 overflow-y-auto border-b border-border p-1.5">
              <MotionButton type="button" onClick={onNewPalette} className={actionRow}>
                <span className="grid size-9 shrink-0 place-items-center">
                  <Plus className="size-4" strokeWidth={1.5} aria-hidden />
                </span>
                <span className="pr-2 text-left">New palette</span>
              </MotionButton>

              {paletteOpen && (
                <div>
                  <GroupLabel>Palette</GroupLabel>
                  <MotionButton
                    type="button"
                    onClick={onSave}
                    disabled={saving}
                    aria-pressed={saved}
                    className={actionRow}
                  >
                    <span className="grid size-9 shrink-0 place-items-center">
                      <Heart className="size-4" strokeWidth={1.5} aria-hidden />
                    </span>
                    <span className="pr-2 text-left">{saved ? 'Saved' : 'Save'}</span>
                  </MotionButton>
                  <MotionButton
                    type="button"
                    onClick={onRefine}
                    aria-pressed={refineOpen}
                    className={`${actionRow} ${refineOpen ? 'bg-accent' : ''}`}
                  >
                    <span className="grid size-9 shrink-0 place-items-center">
                      <Pipette className="size-4" strokeWidth={1.5} aria-hidden />
                    </span>
                    <span className="pr-2 text-left">Refine</span>
                  </MotionButton>
                  <div ref={exportRef}>
                    <MotionButton
                      type="button"
                      onClick={() => setExportOpen((value) => !value)}
                      aria-expanded={exportOpen}
                      aria-haspopup="menu"
                      className={`${actionRow} ${exportOpen ? 'bg-accent' : ''}`}
                    >
                      <span className="grid size-9 shrink-0 place-items-center">
                        <Download className="size-4" strokeWidth={1.5} aria-hidden />
                      </span>
                      <span className="pr-2 text-left">Export</span>
                    </MotionButton>
                    <AnimatePresence>
                      {exportOpen && (
                        <motion.div role="menu" className="mb-1 ml-9 mr-1 flex flex-col" {...menu}>
                          <button
                            type="button"
                            role="menuitem"
                            className={menuItem}
                            onClick={() => { onCopySkill(); setExportOpen(false); }}
                          >
                            <Copy className="size-4" strokeWidth={1.5} aria-hidden />
                            Copy color.md
                          </button>
                          <button
                            type="button"
                            role="menuitem"
                            className={menuItem}
                            onClick={() => { onDownloadSkill(); setExportOpen(false); }}
                          >
                            <FileDown className="size-4" strokeWidth={1.5} aria-hidden />
                            Download color.md
                          </button>
                          <button
                            type="button"
                            role="menuitemcheckbox"
                            aria-checked={printOn}
                            className={menuItem}
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
                </div>
              )}

              <div>
                <GroupLabel>Appearance</GroupLabel>
                <div className="px-1 pb-1">
                  <ThemeToggle compact />
                </div>
              </div>
            </div>

            <div className="shrink-0 border-b border-border p-1.5">
              <button
                type="button"
                onClick={onSavedPalettes}
                className="flex h-9 w-full items-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              >
                <span className="grid size-9 shrink-0 place-items-center">
                  <Library className="size-4" strokeWidth={1.5} aria-hidden />
                </span>
                <span className="pr-2 text-left text-[13px]">Saved palettes</span>
              </button>
            </div>

            {palettes.length === 0 ? (
              <div className="flex flex-1 items-center justify-center px-4">
                <p className="text-center text-[13px] text-muted-foreground">No saved palettes yet.</p>
              </div>
            ) : (
              <ul className="custom-scrollbar min-h-0 flex-1 overflow-y-auto p-1.5">
                {palettes.map((palette) => {
                  const swatches = palette.colors.slice(0, SWATCH_LIMIT);
                  const active = palette.id === activePaletteId;
                  return (
                    <li key={palette.id}>
                      <button
                        type="button"
                        onClick={() => onLoadPalette(palette)}
                        aria-current={active ? 'true' : undefined}
                        className={`w-full rounded-lg px-2 py-2 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                          active ? 'bg-accent text-foreground' : 'hover:bg-accent'
                        }`}
                      >
                        <span className="block truncate text-[13px] text-foreground">{palette.name}</span>
                        {swatches.length > 0 && (
                          <span className="mt-1.5 flex h-3 overflow-hidden rounded-sm ring-1 ring-border" aria-hidden>
                            {swatches.map((color, index) => (
                              <span
                                key={`${palette.id}-${index}`}
                                className="h-full min-w-0 flex-1"
                                style={{ backgroundColor: color.hex }}
                              />
                            ))}
                          </span>
                        )}
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}

            <div className="shrink-0 border-t border-border p-1.5">
              <button
                type="button"
                onClick={() => onOpenChange(false)}
                className="flex h-9 w-full items-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              >
                <span className="grid size-9 shrink-0 place-items-center">
                  <PanelLeftClose className="size-4" strokeWidth={1.5} aria-hidden />
                </span>
                <span className="text-left text-[13px]">Hide tools</span>
              </button>
            </div>
          </motion.aside>
        ) : (
          <motion.button
            key="launcher"
            type="button"
            aria-label="Show tools"
            onClick={() => onOpenChange(true)}
            className="absolute bottom-5 left-4 z-30 grid size-10 place-items-center rounded-full bg-card text-foreground shadow-panel ring-1 ring-border"
            {...fade}
          >
            <PanelLeft className="size-4" strokeWidth={1.5} />
          </motion.button>
        )}
      </AnimatePresence>
    </>
  );
};

export default StudioSidebar;
