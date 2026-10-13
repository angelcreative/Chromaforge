import { AnimatePresence, motion } from 'motion/react';
import React, { useEffect, useRef, useState } from 'react';
import { Download, Library, PanelLeft, PanelLeftClose, Pipette, Plus, Settings } from 'lucide-react';
import { THEME_OPTIONS, useThemePreference } from './ThemeToggle';
import { MotionButton, presenceFade, presencePop, presenceSlide, useReduced } from './uiMotion';

export interface StudioSidebarProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSavedPalettes: () => void;
  onNewPalette: () => void;
  paletteOpen: boolean;
  refineOpen: boolean;
  onRefine: () => void;
  onExportMarkdown: () => void;
}

const actionRow =
  'flex h-9 w-full items-center rounded-lg text-[13px] text-foreground transition-colors hover:bg-accent disabled:opacity-40';

const menuItem =
  'flex h-9 w-full items-center gap-2 rounded-lg px-2 text-left text-[13px] text-foreground hover:bg-accent';

function GroupLabel({ children }: { children: string }) {
  return (
    <h2 className="px-2.5 pb-1 pt-1 text-[12px] font-medium text-muted-foreground">{children}</h2>
  );
}

function GroupDivider() {
  return <div className="mx-2 my-1 h-px bg-border" role="separator" />;
}

const StudioSidebar: React.FC<StudioSidebarProps> = ({
  open,
  onOpenChange,
  onSavedPalettes,
  onNewPalette,
  paletteOpen,
  refineOpen,
  onRefine,
  onExportMarkdown,
}) => {
  const reduce = useReduced();
  const slide = presenceSlide(reduce, { y: '100%' });
  const fade = presenceFade(reduce);
  const menu = presencePop(reduce, 'left center');
  const { pref, choose } = useThemePreference();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const settingsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) setSettingsOpen(false);
  }, [open]);

  useEffect(() => {
    if (!settingsOpen) return;
    const onPointer = (event: MouseEvent) => {
      if (!settingsRef.current?.contains(event.target as Node)) setSettingsOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setSettingsOpen(false);
    };
    document.addEventListener('mousedown', onPointer);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onPointer);
      document.removeEventListener('keydown', onKey);
    };
  }, [settingsOpen]);

  return (
    <>
      <AnimatePresence>
        {open && (
          <motion.button
            key="scrim"
            type="button"
            aria-label="Hide"
            className="fixed inset-0 z-30 bg-black/30 md:hidden"
            onClick={() => onOpenChange(false)}
            {...fade}
          />
        )}
      </AnimatePresence>

      <div className="absolute bottom-5 left-4 z-40">
      <AnimatePresence>
        {open ? (
          <motion.aside
            key="panel"
            className="absolute bottom-0 left-0 w-[min(260px,calc(100vw-4.5rem))] origin-bottom-left rounded-2xl bg-card shadow-panel ring-1 ring-border"
            aria-label="Tools"
            {...slide}
          >
            <div className="p-1.5">
              <MotionButton type="button" onClick={onNewPalette} className={actionRow}>
                <span className="grid size-9 shrink-0 place-items-center">
                  <Plus className="size-4" strokeWidth={1.5} aria-hidden />
                </span>
                <span className="pr-2 text-left">New palette</span>
              </MotionButton>

              <GroupDivider />

              {paletteOpen && (
                <>
                  <GroupLabel>Palette</GroupLabel>
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
                  <MotionButton type="button" onClick={onExportMarkdown} className={actionRow}>
                    <span className="grid size-9 shrink-0 place-items-center">
                      <Download className="size-4" strokeWidth={1.5} aria-hidden />
                    </span>
                    <span className="pr-2 text-left">Export md</span>
                  </MotionButton>
                  <GroupDivider />
                </>
              )}

              <MotionButton type="button" onClick={onSavedPalettes} className={actionRow}>
                <span className="grid size-9 shrink-0 place-items-center">
                  <Library className="size-4" strokeWidth={1.5} aria-hidden />
                </span>
                <span className="pr-2 text-left">Library</span>
              </MotionButton>

              <GroupDivider />

              <div className="relative" ref={settingsRef}>
                <MotionButton
                  type="button"
                  onClick={() => setSettingsOpen((value) => !value)}
                  aria-expanded={settingsOpen}
                  aria-haspopup="menu"
                  className={`${actionRow} ${settingsOpen ? 'bg-accent' : ''}`}
                >
                  <span className="grid size-9 shrink-0 place-items-center">
                    <Settings className="size-4" strokeWidth={1.5} aria-hidden />
                  </span>
                  <span className="pr-2 text-left">Settings</span>
                </MotionButton>
                <div className="absolute top-0 left-[calc(100%+0.875rem)] z-50 flex h-9 w-max max-w-[calc(100vw-100%-2.75rem)] items-center max-sm:items-end">
                  <AnimatePresence>
                    {settingsOpen && (
                      <motion.div
                        role="menu"
                        aria-label="Color theme"
                        className="w-max max-w-full rounded-xl bg-card p-1 shadow-panel ring-1 ring-border"
                        {...menu}
                      >
                        {THEME_OPTIONS.map((option) => {
                          const active = pref === option.id;
                          const Icon = option.icon;
                          return (
                            <button
                              key={option.id}
                              type="button"
                              role="menuitemradio"
                              aria-checked={active}
                              className={`${menuItem} whitespace-nowrap ${active ? 'bg-accent' : ''}`}
                              onClick={() => {
                                choose(option.id);
                                setSettingsOpen(false);
                              }}
                            >
                              <Icon className="size-4" strokeWidth={1.5} aria-hidden />
                              {option.label}
                            </button>
                          );
                        })}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              <GroupDivider />

              <MotionButton type="button" onClick={() => onOpenChange(false)} className={actionRow}>
                <span className="grid size-9 shrink-0 place-items-center">
                  <PanelLeftClose className="size-4" strokeWidth={1.5} aria-hidden />
                </span>
                <span className="pr-2 text-left">Hide</span>
              </MotionButton>
            </div>
          </motion.aside>
        ) : (
          <motion.button
            key="launcher"
            type="button"
            aria-label="Show tools"
            onClick={() => onOpenChange(true)}
            className="absolute bottom-0 left-0 grid size-10 place-items-center rounded-full bg-card text-foreground shadow-panel ring-1 ring-border"
            {...fade}
          >
            <PanelLeft className="size-4" strokeWidth={1.5} />
          </motion.button>
        )}
      </AnimatePresence>
      </div>
    </>
  );
};

export default StudioSidebar;
