import React, { useEffect, useRef, useState } from 'react';
import { FileCode, Image, Plus } from 'lucide-react';

export interface ComposerAttachProps {
  onPicture: (file: File) => void;
  onColorFile: (text: string) => void;
  onColorFileError: () => void;
}

const menuItem = 'flex h-9 w-full items-center gap-2 rounded-lg px-2 text-left text-[13px] text-foreground hover:bg-accent';

const ComposerAttach: React.FC<ComposerAttachProps> = ({ onPicture, onColorFile, onColorFileError }) => {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const pictureRef = useRef<HTMLInputElement>(null);
  const colorFileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointer = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onPointer);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onPointer);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const readColorFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') onColorFile(reader.result);
      else onColorFileError();
    };
    reader.onerror = () => onColorFileError();
    reader.readAsText(file);
  };

  return (
    <div className="relative" ref={rootRef}>
      <button
        type="button"
        aria-label="Start from a file"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        className={`grid size-10 place-items-center rounded-xl text-foreground hover:bg-accent ${open ? 'bg-accent' : ''}`}
      >
        <Plus className="size-4" strokeWidth={1.5} aria-hidden />
      </button>
      {open && (
        <div role="menu" className="absolute bottom-full left-0 z-30 mb-1 w-64 rounded-xl bg-card p-1 shadow-panel ring-1 ring-border">
          <button
            type="button"
            role="menuitem"
            className={menuItem}
            onClick={() => {
              setOpen(false);
              pictureRef.current?.click();
            }}
          >
            <Image className="size-4" strokeWidth={1.5} aria-hidden />
            Upload a picture
          </button>
          <button
            type="button"
            role="menuitem"
            className={menuItem}
            onClick={() => {
              setOpen(false);
              colorFileRef.current?.click();
            }}
          >
            <FileCode className="size-4" strokeWidth={1.5} aria-hidden />
            Upload JSON, CSS, or Tailwind
          </button>
        </div>
      )}
      <input
        ref={pictureRef}
        type="file"
        accept="image/*"
        className="hidden"
        aria-hidden
        tabIndex={-1}
        onChange={(event) => {
          const file = event.target.files?.[0];
          event.target.value = '';
          if (file) onPicture(file);
        }}
      />
      <input
        ref={colorFileRef}
        type="file"
        accept=".json,.js,.ts,.css,.scss,.txt,application/json,text/css"
        className="hidden"
        aria-hidden
        tabIndex={-1}
        onChange={(event) => {
          const file = event.target.files?.[0];
          event.target.value = '';
          if (file) readColorFile(file);
        }}
      />
    </div>
  );
};

export default ComposerAttach;
