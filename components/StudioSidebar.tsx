import React, { useEffect, useState } from 'react';
import { Library, PanelLeft, PanelLeftClose } from 'lucide-react';

export interface StudioSidebarProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSavedPalettes: () => void;
}

const StudioSidebar: React.FC<StudioSidebarProps> = ({ open, onOpenChange, onSavedPalettes }) => {
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
          aria-label="Studio"
        >
          <nav className="flex-1 p-1.5" aria-label="Studio">
            <button
              type="button"
              onClick={onSavedPalettes}
              className="flex h-9 w-full items-center rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground"
            >
              <span className="grid size-9 shrink-0 place-items-center">
                <Library className="size-4" strokeWidth={1.5} aria-hidden />
              </span>
              <span className="pr-2 text-left text-[13px]">Saved palettes</span>
            </button>
          </nav>
          <div className="border-t border-border p-1.5">
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="flex h-9 w-full items-center rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground"
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
