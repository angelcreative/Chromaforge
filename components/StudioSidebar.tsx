import React, { useEffect, useState } from 'react';
import { Library, PanelLeft, PanelLeftClose } from 'lucide-react';
import { SavedPalette } from '../services/storageService';

export interface StudioSidebarProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSavedPalettes: () => void;
  palettes: SavedPalette[];
  onLoadPalette: (palette: SavedPalette) => void;
  activePaletteId?: string | null;
}

const SWATCH_LIMIT = 5;

const StudioSidebar: React.FC<StudioSidebarProps> = ({
  open,
  onOpenChange,
  onSavedPalettes,
  palettes,
  onLoadPalette,
  activePaletteId,
}) => {
  const [present, setPresent] = useState(open);
  const [shown, setShown] = useState(open);

  useEffect(() => {
    if (open) {
      setPresent(true);
      setShown(true);
      return;
    }
    setShown(false);
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const timer = window.setTimeout(() => setPresent(false), reduce ? 0 : 180);
    return () => window.clearTimeout(timer);
  }, [open]);

  return (
    <>
      {present && (
        <button
          type="button"
          aria-label="Hide tools"
          className={`fixed inset-0 z-30 bg-black/30 md:hidden ${shown ? 'studio-fade' : 'opacity-0'}`}
          onClick={() => onOpenChange(false)}
        />
      )}

      {!present && (
        <button
          type="button"
          aria-label="Show tools"
          onClick={() => onOpenChange(true)}
          className="studio-in absolute bottom-5 left-4 z-30 grid size-10 place-items-center rounded-full bg-card text-foreground shadow-panel ring-1 ring-border"
        >
          <PanelLeft className="size-4" strokeWidth={1.5} />
        </button>
      )}

      {present && (
        <aside
          className={`${shown ? 'shell-in' : 'shell-out'} absolute top-14 bottom-4 left-3 z-40 flex w-[min(260px,calc(100vw-4.5rem))] flex-col overflow-hidden rounded-2xl bg-card shadow-panel ring-1 ring-border`}
          aria-label="Saved palettes"
        >
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
        </aside>
      )}
    </>
  );
};

export default StudioSidebar;
