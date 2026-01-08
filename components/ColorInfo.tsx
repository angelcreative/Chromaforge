import React from 'react';
import { ColorData } from '../types';
import { getLuminance, rgbToLab, rgbToCmyk } from '../utils/colorUtils';

interface ColorInfoProps {
  color: ColorData;
  onClose: () => void;
}

const ColorInfo: React.FC<ColorInfoProps> = ({ color, onClose }) => {
  const lum = getLuminance(color.rgb.r, color.rgb.g, color.rgb.b) * 100;
  const cmyk = rgbToCmyk(color.rgb.r, color.rgb.g, color.rgb.b);
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-xl w-full max-w-lg shadow-2xl overflow-hidden relative animate-in fade-in zoom-in duration-200">
        
        <div className="h-48 w-full relative" style={{ backgroundColor: color.hex }}>
            <button onClick={onClose} className="absolute top-4 right-4 p-1 bg-black/20 hover:bg-black/40 text-white rounded-full transition">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
            <div className="absolute bottom-4 right-4 text-white/50 text-xs font-mono">
                {color.hex}
            </div>
        </div>

        <div className="p-6">
            <h2 className="text-3xl font-bold text-white mb-1">{color.name}</h2>
            <div className="text-slate-400 text-sm mb-6 flex gap-2">
                <span>{color.exactMatch ? 'Exact Match' : 'Approximate Name'}</span>
            </div>

            <div className="grid grid-cols-1 gap-y-4 font-mono text-sm text-slate-300">
                <div className="flex justify-between border-b border-slate-800 pb-2">
                    <span className="text-slate-500">RGB [hex]</span>
                    <span>{color.hex.replace('#', '')}</span>
                </div>
                <div className="flex justify-between border-b border-slate-800 pb-2">
                    <span className="text-slate-500">RGB [0-255]</span>
                    <span>{color.rgb.r}, {color.rgb.g}, {color.rgb.b}</span>
                </div>
                 <div className="flex justify-between border-b border-slate-800 pb-2">
                    <span className="text-slate-500">RGB [0-100%]</span>
                    <span>{(color.rgb.r/2.55).toFixed(1)}, {(color.rgb.g/2.55).toFixed(1)}, {(color.rgb.b/2.55).toFixed(1)}</span>
                </div>
                <div className="flex justify-between border-b border-slate-800 pb-2">
                    <span className="text-slate-500">HSL</span>
                    <span>{color.hsl.h}°, {color.hsl.s}%, {color.hsl.l}%</span>
                </div>
                <div className="flex justify-between border-b border-slate-800 pb-2">
                    <span className="text-slate-500">CMYK (Print)</span>
                    <span>{cmyk.c}%, {cmyk.m}%, {cmyk.y}%, {cmyk.k}%</span>
                </div>
                <div className="flex justify-between border-b border-slate-800 pb-2">
                    <span className="text-slate-500">Luminosity</span>
                    <span>{lum.toFixed(2)}%</span>
                </div>
                <div className="flex justify-between border-b border-slate-800 pb-2">
                    <span className="text-slate-500">LAB (Approx)</span>
                    <span>{rgbToLab(color.rgb.r, color.rgb.g, color.rgb.b)}</span>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default ColorInfo;