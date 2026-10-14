import { AnimatePresence, motion } from 'motion/react';
import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Download, Library, PanelLeft, PanelLeftClose, Pipette, Plus, Settings, SlidersHorizontal } from 'lucide-react';
import { THEME_OPTIONS, useThemePreference } from './ThemeToggle';
import RampScaleControls from './RampScaleControls';
import type { GlobalCurveConfig } from '../types';
import { MotionButton, presenceFade, presencePop, presenceSlide, useReduced } from './uiMotion';
import { Hint } from './Hint';

export interface StudioSidebarProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSavedPalettes: () => void;
  onNewPalette: () => void;
  paletteOpen: boolean;
  refineOpen: boolean;
  onRefine: () => void;
  onExportMarkdown: () => void;
  curve: GlobalCurveConfig;
  onCurve: (next: GlobalCurveConfig) => void;
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

const VIEWPORT_MARGIN = 12;

/**
 * Keeps a flyout inside the viewport: when its natural spot would run past
 * the bottom edge it moves up, never past the top edge.
 */
const useViewportShift = (open: boolean) => {
  const wrapRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const shiftRef = useRef(0);

  useLayoutEffect(() => {
    const apply = (value: number) => {
      shiftRef.current = value;
      if (wrapRef.current) wrapRef.current.style.transform = value ? `translateY(${value}px)` : '';
    };
    if (!open) {
      apply(0);
      return;
    }
    const measure = () => {
      const wrap = wrapRef.current;
      const panel = panelRef.current;
      if (!wrap || !panel) return;
      // offsetTop ignores the panel's entrance scale; the wrapper is its offset parent.
      const natural = wrap.getBoundingClientRect().top - shiftRef.current + panel.offsetTop;
      const height = Math.min(panel.offsetHeight, window.innerHeight - VIEWPORT_MARGIN * 2);
      let next = Math.min(0, window.innerHeight - VIEWPORT_MARGIN - (natural + height));
      if (natural + next < VIEWPORT_MARGIN) next = VIEWPORT_MARGIN - natural;
      apply(next);
    };
    // The panel mounts with this render but its content settles a frame
    // later, so measure again then and whenever it resizes.
    measure();
    const frame = window.requestAnimationFrame(measure);
    const observer = new ResizeObserver(measure);
    if (panelRef.current) observer.observe(panelRef.current);
    window.addEventListener('resize', measure);
    return () => {
      window.cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener('resize', measure);
    };
  }, [open]);

  return {
    wrapRef,
    panelRef,
    panelStyle: { maxHeight: `calc(100dvh - ${VIEWPORT_MARGIN * 2}px)`, overflowY: 'auto' } as React.CSSProperties,
  };
};

const StudioSidebar: React.FC<StudioSidebarProps> = ({
  open,
  onOpenChange,
  onSavedPalettes,
  onNewPalette,
  paletteOpen,
  refineOpen,
  onRefine,
  onExportMarkdown,
  curve,
  onCurve,
}) => {
  const reduce = useReduced();
  const slide = presenceSlide(reduce, { y: '100%' });
  const fade = presenceFade(reduce);
  const menu = presencePop(reduce, 'left center');
  const { pref, choose } = useThemePreference();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [toolsOpen, setToolsOpen] = useState(false);
  const settingsRef = useRef<HTMLDivElement>(null);
  const toolsRef = useRef<HTMLDivElement>(null);
  const toolsFit = useViewportShift(toolsOpen);
  const settingsFit = useViewportShift(settingsOpen);

  useEffect(() => {
    if (!open) {
      setSettingsOpen(false);
      setToolsOpen(false);
    }
  }, [open]);

  useEffect(() => {
    if (!settingsOpen && !toolsOpen) return;
    const onPointer = (event: MouseEvent) => {
      if (!settingsRef.current?.contains(event.target as Node)) setSettingsOpen(false);
      if (!toolsRef.current?.contains(event.target as Node)) setToolsOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setSettingsOpen(false);
        setToolsOpen(false);
      }
    };
    document.addEventListener('mousedown', onPointer);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onPointer);
      document.removeEventListener('keydown', onKey);
    };
  }, [settingsOpen, toolsOpen]);

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
                  <div className="relative" ref={toolsRef}>
                    <MotionButton
                      type="button"
                      onClick={() => {
                        setToolsOpen((value) => !value);
                        setSettingsOpen(false);
                      }}
                      aria-expanded={toolsOpen}
                      aria-haspopup="dialog"
                      className={`${actionRow} ${toolsOpen ? 'bg-accent' : ''}`}
                    >
                      <span className="grid size-9 shrink-0 place-items-center">
                        <SlidersHorizontal className="size-4" strokeWidth={1.5} aria-hidden />
                      </span>
                      <span className="pr-2 text-left">Tools</span>
                    </MotionButton>
                    <div ref={toolsFit.wrapRef} className="absolute top-0 left-[calc(100%+0.875rem)] z-50 w-max max-w-[calc(100vw-100%-2.75rem)] max-sm:bottom-[calc(100%+0.5rem)] max-sm:left-0 max-sm:top-auto max-sm:w-full max-sm:max-w-none">
                      <AnimatePresence>
                        {toolsOpen && (
                          <motion.div
                            ref={toolsFit.panelRef}
                            style={toolsFit.panelStyle}
                            role="dialog"
                            aria-label="Tuning tools"
                            className="w-60 max-w-full rounded-xl bg-card p-3 shadow-panel ring-1 ring-border max-sm:w-full"
                            {...menu}
                          >
                            <RampScaleControls variant="stack" curve={curve} onCurve={onCurve} />
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
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
                  onClick={() => {
                    setSettingsOpen((value) => !value);
                    setToolsOpen(false);
                  }}
                  aria-expanded={settingsOpen}
                  aria-haspopup="menu"
                  className={`${actionRow} ${settingsOpen ? 'bg-accent' : ''}`}
                >
                  <span className="grid size-9 shrink-0 place-items-center">
                    <Settings className="size-4" strokeWidth={1.5} aria-hidden />
                  </span>
                  <span className="pr-2 text-left">Settings</span>
                </MotionButton>
                <div ref={settingsFit.wrapRef} className="absolute top-0 left-[calc(100%+0.875rem)] z-50 flex h-9 w-max max-w-[calc(100vw-100%-2.75rem)] items-center max-sm:items-end">
                  <AnimatePresence>
                    {settingsOpen && (
                      <motion.div
                        ref={settingsFit.panelRef}
                        style={settingsFit.panelStyle}
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
          <Hint key="launcher" label="Show tools" side="right">
            <motion.button
              type="button"
              aria-label="Show tools"
              onClick={() => onOpenChange(true)}
              className="absolute bottom-0 left-0 grid size-10 place-items-center rounded-full bg-card text-foreground shadow-panel ring-1 ring-border"
              {...fade}
            >
              <PanelLeft className="size-4" strokeWidth={1.5} />
            </motion.button>
          </Hint>
        )}
      </AnimatePresence>
      </div>
    </>
  );
};

export default StudioSidebar;
