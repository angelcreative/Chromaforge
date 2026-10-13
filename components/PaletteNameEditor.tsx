import { Pencil } from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';
import { commitPaletteName } from '../utils/paletteName';
import { MotionButton } from './uiMotion';

interface PaletteNameEditorProps {
  name: string;
  onSave: (name: string) => void;
  as?: 'h1' | 'h3';
  className: string;
}

const PaletteNameEditor: React.FC<PaletteNameEditorProps> = ({
  name,
  onSave,
  as: Tag = 'h1',
  className,
}) => {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(name);
  const inputRef = useRef<HTMLInputElement>(null);
  const cancelRef = useRef(false);
  const committedRef = useRef(false);

  useEffect(() => {
    if (!editing) setDraft(name);
  }, [name, editing]);

  useEffect(() => {
    if (!editing) {
      committedRef.current = false;
      return;
    }
    inputRef.current?.focus();
    inputRef.current?.select();
  }, [editing]);

  const finish = (nextDraft: string) => {
    if (cancelRef.current) {
      cancelRef.current = false;
      return;
    }
    if (committedRef.current) return;
    committedRef.current = true;
    setEditing(false);
    const next = commitPaletteName(name, nextDraft);
    if (!next) {
      setDraft(name);
      return;
    }
    setDraft(next);
    onSave(next);
  };

  const cancel = () => {
    cancelRef.current = true;
    committedRef.current = true;
    setDraft(name);
    setEditing(false);
  };

  if (editing) {
    return (
      <input
        ref={inputRef}
        value={draft}
        aria-label="Palette name"
        maxLength={80}
        onChange={(event) => setDraft(event.target.value)}
        onBlur={() => finish(draft)}
        onKeyDown={(event) => {
          if (event.key === 'Enter') {
            event.preventDefault();
            finish(draft);
          } else if (event.key === 'Escape') {
            event.preventDefault();
            cancel();
          }
        }}
        style={{ width: `${Math.min(Math.max(draft.length + 1, 8), 40)}ch` }}
        className={`${className} max-w-full rounded-md border border-border bg-card px-1.5 py-0.5 focus:outline-none focus:ring-2 focus:ring-ring`}
      />
    );
  }

  return (
    <div className="group/name relative w-fit max-w-full min-w-0" data-palette-name={name}>
      <Tag className={`${className} truncate group-hover/name:pr-8 group-focus-within/name:pr-8`}>
        {name}
      </Tag>
      <MotionButton
        type="button"
        aria-label={`Rename ${name}`}
        title="Rename"
        data-rename-palette=""
        onClick={() => {
          cancelRef.current = false;
          committedRef.current = false;
          setDraft(name);
          setEditing(true);
        }}
        className="pointer-events-none absolute top-1/2 right-0 z-10 grid size-7 -translate-y-1/2 place-items-center rounded-md border border-border bg-card text-foreground opacity-0 shadow-panel transition-opacity duration-100 ease-out hover:bg-accent focus-visible:pointer-events-auto focus-visible:opacity-100 group-hover/name:pointer-events-auto group-hover/name:opacity-100 group-focus-within/name:pointer-events-auto group-focus-within/name:opacity-100 motion-reduce:transition-none"
      >
        <Pencil className="size-3.5" strokeWidth={1.5} aria-hidden />
      </MotionButton>
    </div>
  );
};

export default PaletteNameEditor;
