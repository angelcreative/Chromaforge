import React from 'react';
import { X } from 'lucide-react';
import { ColorData } from '../types';
import { rgbToCmyk, rgbToOklch } from '../utils/colorUtils';

interface ColorInfoProps {
  color: ColorData;
  onClose: () => void;
}

const Row: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div className="flex items-baseline justify-between gap-4 border-b border-border py-3">
    <span className="text-[13px] text-muted-foreground">{label}</span>
    <span className="text-right font-mono text-[13px] text-foreground">{value}</span>
  </div>
);

const ColorInfo: React.FC<ColorInfoProps> = ({ color, onClose }) => {
  const cmyk = rgbToCmyk(color.rgb.r, color.rgb.g, color.rgb.b);
  const oklch = rgbToOklch(color.rgb.r, color.rgb.g, color.rgb.b);
  const nameNote = color.exactMatch ? 'Exact name' : 'Approximate name';

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-0 sm:items-center sm:p-4" onClick={onClose}>
      <div
        className="flex max-h-[100dvh] min-h-0 w-full max-w-md flex-col overflow-hidden bg-card shadow-2xl sm:max-h-[90vh] sm:rounded-2xl sm:border sm:border-border"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="color-detail-title"
      >
        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-border px-4 py-3">
          <h2 id="color-detail-title" className="text-[15px] font-medium text-foreground">Color</h2>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-10 items-center gap-1.5 rounded-lg border border-border bg-background px-3 text-[13px] text-foreground hover:bg-accent"
          >
            <X className="size-4" strokeWidth={1.5} aria-hidden />
            Close
          </button>
        </div>

        <div className="min-h-0 flex-auto overflow-y-auto px-4 py-4">
          <div className="h-28 w-full rounded-xl ring-1 ring-border" style={{ backgroundColor: color.hex }} />

          <p className="mt-4 font-mono text-2xl text-foreground">{color.hex}</p>
          <p className="mt-1 text-[13px] text-muted-foreground">
            {nameNote}: {color.name}
          </p>

          <div className="mt-4">
            <Row label="RGB" value={`${color.rgb.r}, ${color.rgb.g}, ${color.rgb.b}`} />
            <Row label="HSL" value={`${color.hsl.h}°, ${color.hsl.s}%, ${color.hsl.l}%`} />
            <Row label="OKLCH" value={`${oklch.l.toFixed(2)}, ${oklch.c.toFixed(2)}, ${oklch.h.toFixed(2)}`} />
            <Row label="CMYK" value={`${cmyk.c}%, ${cmyk.m}%, ${cmyk.y}%, ${cmyk.k}%`} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ColorInfo;
