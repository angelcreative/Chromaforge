
import { Check, Pencil, RotateCcw, Trash2, X } from 'lucide-react';
import React, { useState, useEffect } from 'react';
import { ColorData, ColorHSL } from '../types';
import { hexToHsl, hslToRgb, rgbToHex, createColorDataFromHSL, hslToHsb, hsbToHsl } from '../utils/colorUtils';

interface ColorRowInputProps {
  color: ColorData;
  onChange: (newColor: ColorData) => void;
  onDelete: () => void;
  canDelete: boolean;
  index: number;
}

type ColorFormat = 'HEX' | 'RGB' | 'HSL' | 'HSB';

const ColorRowInput: React.FC<ColorRowInputProps> = ({ color, onChange, onDelete, canDelete, index }) => {
  const [format, setFormat] = useState<ColorFormat>('HEX');
  const [inputValue, setInputValue] = useState(color.hex);
  const [localLuminance, setLocalLuminance] = useState(color.hsl.l);
  
  // Track the initial luminance of the "Base Color"
  // If the user drags the slider, they can reset to this value.
  // This value only updates when the user types a *new* color code, not when they slide.
  const [baseLuminance, setBaseLuminance] = useState(color.hsl.l);

  // Delete Confirmation State
  const [isDeleting, setIsDeleting] = useState(false);

  // Sync internal state when prop changes externally
  useEffect(() => {
    updateInputValue(color, format);
    setLocalLuminance(color.hsl.l);
  }, [color.hex, color.hsl.l, format]);

  // Handle outside click to cancel delete
  useEffect(() => {
      if (isDeleting) {
          const timer = setTimeout(() => setIsDeleting(false), 3000); // Auto cancel after 3s
          return () => clearTimeout(timer);
      }
  }, [isDeleting]);

  const updateInputValue = (c: ColorData, fmt: ColorFormat) => {
      if (fmt === 'HEX') setInputValue(c.hex);
      if (fmt === 'RGB') setInputValue(`${c.rgb.r}, ${c.rgb.g}, ${c.rgb.b}`);
      if (fmt === 'HSL') setInputValue(`${c.hsl.h}, ${c.hsl.s}%, ${c.hsl.l}%`);
      if (fmt === 'HSB') {
          const hsb = hslToHsb(c.hsl.h, c.hsl.s, c.hsl.l);
          setInputValue(`${hsb.h}, ${hsb.s}%, ${hsb.b}%`);
      }
  };

  const handleFormatChange = (newFormat: ColorFormat) => {
      setFormat(newFormat);
      updateInputValue(color, newFormat);
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value;
      setInputValue(val);
      
      let newHsl: ColorHSL | null = null;

      try {
          if (format === 'HEX') {
              if (/^#?[0-9A-F]{6}$/i.test(val)) {
                  newHsl = hexToHsl(val.startsWith('#') ? val : '#' + val);
              }
          } else if (format === 'RGB') {
              const parts = val.split(',').map(n => parseInt(n.trim()));
              if (parts.length === 3 && parts.every(n => !isNaN(n) && n >= 0 && n <= 255)) {
                  const hex = rgbToHex(parts[0], parts[1], parts[2]);
                  newHsl = hexToHsl(hex);
              }
          } else if (format === 'HSL') {
              const parts = val.replace(/%/g, '').split(',').map(n => parseInt(n.trim()));
              if (parts.length === 3 && !isNaN(parts[0])) {
                  newHsl = { h: parts[0] % 360, s: Math.max(0, Math.min(100, parts[1])), l: Math.max(0, Math.min(100, parts[2])) };
              }
          } else if (format === 'HSB') {
              const parts = val.replace(/%/g, '').split(',').map(n => parseInt(n.trim()));
              if (parts.length === 3 && !isNaN(parts[0])) {
                  newHsl = hsbToHsl(parts[0] % 360, Math.max(0, Math.min(100, parts[1])), Math.max(0, Math.min(100, parts[2])));
              }
          }
      } catch (e) {
          // invalid input, ignore
      }

      if (newHsl) {
          // When typing a new color, we update the Base Luminance reference
          setBaseLuminance(newHsl.l);
          // Preserve custom name if user has set one, otherwise let util fallback (or use current)
          const newData = createColorDataFromHSL(newHsl.h, newHsl.s, newHsl.l, color.name);
          onChange(newData);
      }
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      onChange({ ...color, name: e.target.value });
  };

  const handleLuminanceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newL = parseInt(e.target.value);
      setLocalLuminance(newL);
      // NOTE: We do NOT update baseLuminance here, allowing the user to reset back to it.
      const newData = createColorDataFromHSL(color.hsl.h, color.hsl.s, newL, color.name);
      onChange(newData);
  };

  const handleResetLuminance = () => {
      setLocalLuminance(baseLuminance);
      const newData = createColorDataFromHSL(color.hsl.h, color.hsl.s, baseLuminance, color.name);
      onChange(newData);
  };

  const hasLuminanceChanged = Math.abs(localLuminance - baseLuminance) > 1;

  return (
    <div className="bg-background rounded-xl border border-border p-4 flex flex-col gap-4 shadow-inner group transition-colors hover:border-border">
        {/* Top Row: Swatch + Input + Format Toggle + Delete */}
        <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg shadow-inner ring-1 ring-border shrink-0 transition-colors duration-300 relative" style={{ backgroundColor: color.hex }}>
                <div className="absolute inset-0 flex items-center justify-center text-[9px] font-bold text-black/50 opacity-0 group-hover:opacity-100 transition-opacity">
                    {index + 1}
                </div>
            </div>
            
            <div className="flex-1 min-w-0">
                <div className="flex justify-between items-center mb-1 gap-2">
                     <div className="flex-1 relative group/name">
                        <input 
                            type="text" 
                            className="bg-transparent border-none p-0 focus:ring-0 text-[9px] font-bold text-muted-foreground uppercase leading-none w-full focus:text-foreground transition-colors placeholder:text-muted-foreground focus:bg-muted rounded-sm"
                            value={color.name}
                            onChange={handleNameChange}
                            placeholder={`Color ${index + 1}`}
                        />
                        <Pencil className="pointer-events-none absolute right-0 top-1/2 size-2.5 -translate-y-1/2 text-muted-foreground" strokeWidth={1.5} aria-hidden />
                     </div>
                     <div className="flex bg-card rounded border border-border overflow-hidden shrink-0">
                        {(['HEX', 'RGB', 'HSL', 'HSB'] as ColorFormat[]).map(fmt => (
                            <button 
                                key={fmt}
                                onClick={() => handleFormatChange(fmt)}
                                className={`px-1.5 py-0.5 text-[8px] font-bold ${format === fmt ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                            >
                                {fmt}
                            </button>
                        ))}
                     </div>
                </div>
                
                <div className="flex items-center gap-2 bg-card p-2 rounded-lg border border-border focus-within:border-primary transition-colors">
                    <input 
                        type="text" 
                        className="w-full bg-transparent border-none p-0 focus:ring-0 text-sm font-mono text-foreground placeholder:text-muted-foreground" 
                        value={inputValue} 
                        onChange={handleTextChange}
                        aria-label="Color value"
                    />
                </div>
            </div>

            {canDelete && (
                <div className="flex items-center h-10">
                    {!isDeleting ? (
                        <button 
                            onClick={() => setIsDeleting(true)}
                            className="w-8 h-8 flex items-center justify-center rounded-lg text-muted-foreground hover:text-red-400 hover:bg-red-500/10 transition-colors"
                            title="Remove Color"
                        >
                            <Trash2 className="size-4" strokeWidth={1.5} />
                        </button>
                    ) : (
                        <div className="flex gap-1 animate-in slide-in-from-right-2 duration-200">
                            <button 
                                onClick={onDelete}
                                className="w-8 h-8 flex items-center justify-center rounded-lg text-white bg-red-600 hover:bg-red-500 shadow-lg"
                                title="Confirm Delete"
                            >
                                <Check className="size-4" strokeWidth={1.5} />
                            </button>
                            <button 
                                onClick={() => setIsDeleting(false)}
                                className="w-8 h-8 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground bg-secondary hover:bg-accent"
                                title="Cancel"
                            >
                                <X className="size-4" strokeWidth={1.5} />
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>

        {/* Bottom Row: Luminance Slider */}
        <div className="group/slider relative">
             <div className="flex justify-between items-end mb-2">
                 <div className="flex items-center gap-2">
                    <label className="text-[13px] text-muted-foreground">Luminance</label>
                    {hasLuminanceChanged && (
                        <button 
                            onClick={handleResetLuminance}
                            className="text-[9px] text-foreground hover:text-foreground font-mono bg-accent px-1.5 py-0.5 rounded border border-primary/20 hover:border-primary transition-colors flex items-center gap-1 animate-in fade-in duration-200"
                            title={`Reset to original luminance (${baseLuminance}%)`}
                        >
                            <RotateCcw className="size-2.5" strokeWidth={1.5} />
                            Reset
                        </button>
                    )}
                 </div>
                 <span className="text-[10px] font-mono text-muted-foreground">{localLuminance}%</span>
             </div>
             <div className="h-2 bg-secondary rounded-full relative w-full overflow-hidden group-hover/slider:bg-accent transition-colors">
                <div className="absolute inset-0 bg-gradient-to-r from-black to-white opacity-20"></div>
                <input 
                    type="range" 
                    min="0" 
                    max="100" 
                    value={localLuminance} 
                    onChange={handleLuminanceChange} 
                    className="w-full h-full opacity-0 cursor-pointer absolute inset-0 z-10"
                />
                
                {/* Reset Marker (Ghost Dot) */}
                {hasLuminanceChanged && (
                    <div 
                        className="absolute top-1/2 -translate-y-1/2 h-2 w-2 bg-slate-500/50 rounded-full pointer-events-none transition-all duration-75 border border-slate-950 z-0" 
                        style={{ left: `${baseLuminance}%`, transform: 'translate(-50%, -50%)' }} 
                        title="Original Luminance"
                    />
                )}
                <div className="absolute top-1/2 -translate-y-1/2 h-3 w-3 bg-white rounded-full shadow-sm pointer-events-none transition-all duration-75 z-10" style={{ left: `${localLuminance}%`, transform: 'translate(-50%, -50%)' }} />
            </div>
        </div>
    </div>
  );
};

export default ColorRowInput;
