
import React, { useState, useEffect } from 'react';
import { ColorData, ColorHSL } from '../types';
import { hexToHsl, hslToRgb, rgbToHex, createColorDataFromHSL, hslToHsb, hsbToHsl } from '../utils/colorUtils';
import { FaEyeDropper } from 'react-icons/fa';

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

  const handleEyeDropper = async () => {
      if (!window.EyeDropper) return;
      try {
          const eyeDropper = new window.EyeDropper();
          const result = await eyeDropper.open();
          
          const newHsl = hexToHsl(result.sRGBHex);
          setBaseLuminance(newHsl.l);
          const newData = createColorDataFromHSL(newHsl.h, newHsl.s, newHsl.l, color.name);
          onChange(newData);
      } catch (e) {
          console.log("EyeDropper cancelled");
      }
  };

  const hasLuminanceChanged = Math.abs(localLuminance - baseLuminance) > 1;

  return (
    <div className="bg-slate-950 rounded-xl border border-white/5 p-4 flex flex-col gap-4 shadow-inner group transition-colors hover:border-white/10">
        {/* Top Row: Swatch + Input + Format Toggle + Delete */}
        <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg shadow-inner ring-1 ring-white/10 shrink-0 transition-colors duration-300 relative" style={{ backgroundColor: color.hex }}>
                <div className="absolute inset-0 flex items-center justify-center text-[9px] font-bold text-black/50 opacity-0 group-hover:opacity-100 transition-opacity">
                    {index + 1}
                </div>
            </div>
            
            <div className="flex-1 min-w-0">
                <div className="flex justify-between items-center mb-1 gap-2">
                     <div className="flex-1 relative group/name">
                        <input 
                            type="text" 
                            className="bg-transparent border-none p-0 focus:ring-0 text-[9px] font-bold text-slate-500 uppercase leading-none w-full focus:text-white transition-colors placeholder-slate-700 focus:bg-slate-900/50 rounded-sm"
                            value={color.name}
                            onChange={handleNameChange}
                            placeholder={`Color ${index + 1}`}
                        />
                        <svg className="w-2.5 h-2.5 text-slate-600 absolute right-0 top-1/2 -translate-y-1/2 opacity-0 group-hover/name:opacity-100 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                     </div>
                     <div className="flex bg-slate-900 rounded border border-white/5 overflow-hidden shrink-0">
                        {(['HEX', 'RGB', 'HSL', 'HSB'] as ColorFormat[]).map(fmt => (
                            <button 
                                key={fmt}
                                onClick={() => handleFormatChange(fmt)}
                                className={`px-1.5 py-0.5 text-[8px] font-bold ${format === fmt ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:text-white'}`}
                            >
                                {fmt}
                            </button>
                        ))}
                     </div>
                </div>
                
                <div className="flex items-center gap-2 bg-slate-900 p-2 rounded-lg border border-slate-800 focus-within:border-indigo-500/50 transition-colors">
                    <input 
                        type="text" 
                        className="w-full bg-transparent border-none p-0 focus:ring-0 text-sm font-mono text-white placeholder-slate-700" 
                        value={inputValue} 
                        onChange={handleTextChange} 
                    />
                    <button onClick={handleEyeDropper} className="p-1.5 text-slate-400 hover:text-white bg-slate-950 rounded-md border border-slate-800 hover:bg-slate-800 transition-colors" title="Pick Color from Screen">
                        <FaEyeDropper className="w-3.5 h-3.5" />
                    </button>
                </div>
            </div>

            {canDelete && (
                <div className="flex items-center h-10">
                    {!isDeleting ? (
                        <button 
                            onClick={() => setIsDeleting(true)}
                            className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-600 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                            title="Remove Color"
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        </button>
                    ) : (
                        <div className="flex gap-1 animate-in slide-in-from-right-2 duration-200">
                            <button 
                                onClick={onDelete}
                                className="w-8 h-8 flex items-center justify-center rounded-lg text-white bg-red-600 hover:bg-red-500 shadow-lg"
                                title="Confirm Delete"
                            >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                            </button>
                            <button 
                                onClick={() => setIsDeleting(false)}
                                className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700"
                                title="Cancel"
                            >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
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
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Luminance</label>
                    {hasLuminanceChanged && (
                        <button 
                            onClick={handleResetLuminance}
                            className="text-[9px] text-indigo-400 hover:text-indigo-300 font-mono bg-indigo-500/10 px-1.5 py-0.5 rounded border border-indigo-500/20 hover:border-indigo-500/50 transition-colors flex items-center gap-1 animate-in fade-in duration-200"
                            title={`Reset to original luminance (${baseLuminance}%)`}
                        >
                            <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                            Reset
                        </button>
                    )}
                 </div>
                 <span className="text-[10px] font-mono text-slate-300">{localLuminance}%</span>
             </div>
             <div className="h-2 bg-slate-800 rounded-full relative w-full overflow-hidden group-hover/slider:bg-slate-700 transition-colors">
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
