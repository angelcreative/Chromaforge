import React from 'react';
import { ColorData } from '../types';
import { getLuminance, rgbToLab, rgbToCmyk, rgbToOklch } from '../utils/colorUtils';

interface ColorInfoProps {
  color: ColorData;
  onClose: () => void;
}

const ColorInfo: React.FC<ColorInfoProps> = ({ color, onClose }) => {
  const lum = getLuminance(color.rgb.r, color.rgb.g, color.rgb.b) * 100;
  const cmyk = rgbToCmyk(color.rgb.r, color.rgb.g, color.rgb.b);
  const oklch = rgbToOklch(color.rgb.r, color.rgb.g, color.rgb.b);
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-card border border-border rounded-xl w-full max-w-lg shadow-2xl overflow-hidden relative animate-in fade-in zoom-in duration-200">
        
        <div className="h-48 w-full relative" style={{ backgroundColor: color.hex }}>
            <button onClick={onClose} className="absolute top-4 right-4 p-1 bg-black/20 hover:bg-black/40 text-foreground rounded-full transition">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
            <div className="absolute bottom-4 right-4 text-white/50 text-xs font-mono">
                {color.hex}
            </div>
        </div>

        <div className="p-6">
            <h2 className="text-3xl font-bold text-foreground mb-1">{color.name}</h2>
            <div className="text-muted-foreground text-sm mb-6 flex gap-2">
                <span>{color.exactMatch ? 'Exact Match' : 'Approximate Name'}</span>
            </div>

            <div className="grid grid-cols-1 gap-y-4 font-mono text-sm text-muted-foreground">
                <div className="flex justify-between border-b border-border pb-2">
                    <span className="text-muted-foreground">RGB [hex]</span>
                    <span>{color.hex.replace('#', '')}</span>
                </div>
                <div className="flex justify-between border-b border-border pb-2">
                    <span className="text-muted-foreground">RGB [0-255]</span>
                    <span>{color.rgb.r}, {color.rgb.g}, {color.rgb.b}</span>
                </div>
                 <div className="flex justify-between border-b border-border pb-2">
                    <span className="text-muted-foreground">RGB [0-100%]</span>
                    <span>{(color.rgb.r/2.55).toFixed(1)}, {(color.rgb.g/2.55).toFixed(1)}, {(color.rgb.b/2.55).toFixed(1)}</span>
                </div>
                <div className="flex justify-between border-b border-border pb-2">
                    <span className="text-muted-foreground">HSL</span>
                    <span>{color.hsl.h}°, {color.hsl.s}%, {color.hsl.l}%</span>
                </div>
                <div className="flex justify-between border-b border-border pb-2">
                    <span className="text-muted-foreground">CMYK (Print)</span>
                    <span>{cmyk.c}%, {cmyk.m}%, {cmyk.y}%, {cmyk.k}%</span>
                </div>
                <div className="flex justify-between border-b border-border pb-2">
                    <span className="text-muted-foreground">Luminosity</span>
                    <span>{lum.toFixed(2)}%</span>
                </div>
                <div className="flex justify-between border-b border-border pb-2">
                    <span className="text-muted-foreground">LAB (Approx)</span>
                    <span>{rgbToLab(color.rgb.r, color.rgb.g, color.rgb.b)}</span>
                </div>
                <div className="flex justify-between border-b border-border pb-2">
                    <span className="text-muted-foreground">OKLCH</span>
                    <span>{oklch.l.toFixed(2)}, {oklch.c.toFixed(2)}, {oklch.h.toFixed(2)}</span>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default ColorInfo;