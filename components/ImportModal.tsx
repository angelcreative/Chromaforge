import React, { useEffect, useRef, useState } from 'react';
import { Image, X } from 'lucide-react';
import { ColorData } from '../types';
import { collectPaletteColors, extractColorsFromImage } from '../utils/colorUtils';
import LogoMark from './LogoMark';

interface ImportModalProps {
  onClose: () => void;
  onImport: (colors: ColorData[]) => void;
  limit?: number;
  isPremium?: boolean;
  imageFile?: File | null;
}

type Tab = 'image' | 'code';

interface SelectableColor {
  data: ColorData;
  selected: boolean;
}

const CLOSE_MS = 160;

const ImportModal: React.FC<ImportModalProps> = ({ onClose, onImport, limit = 5, isPremium = false, imageFile = null }) => {
  const [activeTab, setActiveTab] = useState<Tab>('image');
  const [inputText, setInputText] = useState('');
  const [colorSelection, setColorSelection] = useState<SelectableColor[]>([]);
  const [isProcessing, setIsProcessing] = useState(Boolean(imageFile));
  const [limitWarning, setLimitWarning] = useState<string | null>(null);
  const [readError, setReadError] = useState<string | null>(null);
  const [leaving, setLeaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const requestRef = useRef(0);
  const closingRef = useRef(false);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  const requestClose = () => {
    if (closingRef.current) return;
    closingRef.current = true;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      onCloseRef.current();
      return;
    }
    setLeaving(true);
    window.setTimeout(() => onCloseRef.current(), CLOSE_MS);
  };
  const requestCloseRef = useRef(requestClose);
  requestCloseRef.current = requestClose;

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      event.preventDefault();
      requestCloseRef.current();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const initializeSelection = (colors: ColorData[]) => {
    setColorSelection(colors.map((color, index) => ({
      data: color,
      selected: index < limit,
    })));
  };

  const resetSelection = () => {
    requestRef.current += 1;
    setIsProcessing(false);
    setColorSelection([]);
    setInputText('');
    setReadError(null);
    setLimitWarning(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const switchTab = (tab: Tab) => {
    if (tab === activeTab) return;
    resetSelection();
    setActiveTab(tab);
  };

  const readImageFile = (file: File) => {
    const requestId = ++requestRef.current;
    setActiveTab('image');
    setReadError(null);
    setLimitWarning(null);
    setColorSelection([]);
    setIsProcessing(true);

    const reader = new FileReader();
    reader.onload = async (loadEvent) => {
      if (requestId !== requestRef.current) return;
      if (typeof loadEvent.target?.result !== 'string') {
        setReadError('No colors found in that photo.');
        setIsProcessing(false);
        return;
      }
      try {
        const colors = await extractColorsFromImage(loadEvent.target.result, 12);
        if (requestId !== requestRef.current) return;
        if (colors.length === 0) {
          setReadError('No colors found in that photo.');
        } else {
          initializeSelection(colors);
        }
      } catch (error) {
        console.error('Failed to extract colors', error);
        if (requestId === requestRef.current) setReadError('No colors found in that photo.');
      }
      if (requestId === requestRef.current) setIsProcessing(false);
    };
    reader.onerror = () => {
      if (requestId !== requestRef.current) return;
      setReadError('No colors found in that photo.');
      setIsProcessing(false);
    };
    reader.readAsDataURL(file);
  };

  useEffect(() => {
    if (!imageFile) return;
    readImageFile(imageFile);
    return () => {
      requestRef.current += 1;
    };
  }, [imageFile]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    readImageFile(file);
  };

  const handleToggleSelection = (index: number) => {
    setLimitWarning(null);
    const currentSelectedCount = colorSelection.filter((color) => color.selected).length;
    const target = colorSelection[index];
    if (!target.selected && currentSelectedCount >= limit) {
      setLimitWarning(`Limit reached (${limit}). Deselect a color first.`);
      return;
    }
    const updated = [...colorSelection];
    updated[index] = { ...target, selected: !target.selected };
    setColorSelection(updated);
  };

  const handleImportAction = () => {
    const selectedColors = colorSelection.filter((color) => color.selected).map((color) => color.data);
    if (selectedColors.length > 0) onImport(selectedColors);
  };

  const handleProcessCode = () => {
    const allColors = collectPaletteColors(inputText);
    if (allColors.length > 0) {
      setReadError(null);
      initializeSelection(allColors);
      return;
    }
    setReadError('No colors found in that text.');
  };

  const selectedCount = colorSelection.filter((color) => color.selected).length;
  const showSelection = colorSelection.length > 0 && !isProcessing;

  return (
    <div className={`fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4 backdrop-blur-md ${leaving ? 'dialog-fade-out' : 'dialog-fade-in'}`}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="import-colors-title"
        className={`flex max-h-[min(40rem,90vh)] min-h-0 w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-2xl ${leaving ? 'dialog-out' : 'dialog-in'}`}
      >
        <div className="flex shrink-0 items-center justify-between border-b border-border px-6 py-4">
          <h2 id="import-colors-title" className="text-xl font-medium text-foreground">Import colors</h2>
          <button
            type="button"
            onClick={requestClose}
            aria-label="Close"
            className="rounded-full bg-secondary p-2 text-muted-foreground transition hover:text-foreground"
          >
            <X className="size-5" strokeWidth={1.5} />
          </button>
        </div>

        <div className="mx-6 mt-4 flex shrink-0 rounded-lg border border-border bg-background p-1" role="tablist" aria-label="Import source">
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'image'}
            onClick={() => switchTab('image')}
            className={`flex-1 rounded-md py-2 text-[13px] transition-colors ${activeTab === 'image' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}
          >
            From image
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'code'}
            onClick={() => switchTab('code')}
            className={`flex-1 rounded-md py-2 text-[13px] transition-colors ${activeTab === 'code' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}
          >
            From code
          </button>
        </div>

        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          accept="image/*"
          onChange={handleFileChange}
        />

        {isProcessing ? (
          <div className="flex min-h-64 flex-1 flex-col items-center justify-center gap-3 px-6 py-12" role="status" aria-live="polite" aria-busy="true">
            <LogoMark motion="loading" className="size-16 text-foreground" />
            <p className="text-[15px] text-muted-foreground">Reading colors</p>
          </div>
        ) : showSelection ? (
          <>
            <div className="flex shrink-0 items-end justify-between gap-3 px-6 pt-4">
              <span className="text-[13px] text-foreground">Select colors</span>
              <div className="flex items-center gap-2">
                <span className={`text-[13px] ${limitWarning ? 'text-destructive' : 'text-muted-foreground'}`}>
                  {limitWarning || `${selectedCount}/${limit}`}
                </span>
                {!isPremium && <span className="rounded border border-border bg-secondary px-1.5 py-0.5 text-[11px] text-muted-foreground">Limit</span>}
              </div>
            </div>

            <div className="min-h-0 flex-auto overflow-y-auto px-6 py-3 custom-scrollbar">
              <div className="grid grid-cols-4 gap-3 p-2 sm:grid-cols-5">
                {colorSelection.map((item, index) => (
                  <button
                    key={`${item.data.hex}-${index}`}
                    type="button"
                    aria-pressed={item.selected}
                    aria-label={item.selected ? `${item.data.hex}, selected` : item.data.hex}
                    onClick={() => handleToggleSelection(index)}
                    className={`swatch-in group relative aspect-square w-full rounded-xl border-0 p-0 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground ${item.selected ? 'ring-2 ring-foreground ring-offset-2 ring-offset-card' : 'ring-1 ring-border hover:ring-foreground/30'}`}
                    style={{ backgroundColor: item.data.hex, animationDelay: `${index * 32}ms` }}
                  >
                    <span className="pointer-events-none absolute inset-x-1 bottom-1 truncate rounded bg-black/45 px-1 text-center font-mono text-[9px] text-white opacity-0 backdrop-blur-sm group-hover:opacity-100 group-focus-visible:opacity-100">
                      {item.data.hex}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex shrink-0 flex-col gap-2 border-t border-border px-6 py-4">
              <button
                type="button"
                onClick={handleImportAction}
                disabled={selectedCount === 0}
                className="w-full rounded-xl bg-primary py-3 font-medium text-primary-foreground hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Import {selectedCount} selected
              </button>
              <button
                type="button"
                onClick={resetSelection}
                className="self-center py-1 text-[13px] font-normal text-muted-foreground hover:text-foreground"
              >
                Start over
              </button>
            </div>
          </>
        ) : (
          <div className="min-h-0 flex-auto overflow-y-auto px-6 py-4 custom-scrollbar">
            {activeTab === 'image' ? (
              <div className="flex min-h-52 flex-col gap-3">
                <button
                  type="button"
                  className="flex min-h-52 flex-1 flex-col items-center justify-center rounded-xl border-2 border-dashed border-border text-muted-foreground transition-colors hover:border-foreground/30"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Image className="mb-3 size-10 opacity-50" strokeWidth={1.5} />
                  <p className="text-sm text-foreground">Click to upload a photo</p>
                  <p className="mt-1 text-[13px] text-muted-foreground">We'll extract the dominant colors</p>
                </button>
                {readError && <p className="text-center text-[13px] text-muted-foreground">{readError}</p>}
              </div>
            ) : (
              <div className="flex min-h-52 flex-col gap-3">
                <p className="text-[13px] text-muted-foreground">
                  Paste Figma variables JSON, CSS, or hex codes.
                </p>
                <textarea
                  className="min-h-40 flex-1 resize-none rounded-xl border border-border bg-background p-3 font-mono text-xs text-foreground focus:border-foreground/30 focus:outline-none"
                  placeholder={'Example:\n{\n  "primary": "#3b82f6",\n  "surface": "#ffffff"\n}'}
                  value={inputText}
                  onChange={(event) => setInputText(event.target.value)}
                />
                <button
                  type="button"
                  onClick={handleProcessCode}
                  disabled={!inputText.trim()}
                  className="w-full rounded-xl bg-primary py-3 font-medium text-primary-foreground hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Extract colors
                </button>
                {readError && <p className="text-center text-[13px] text-muted-foreground">{readError}</p>}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ImportModal;
