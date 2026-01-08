
import React, { useRef, useEffect, useState } from 'react';
import { ColorData, GlobalCurveConfig } from '../types';
import { generateShades, rgbToCmyk } from '../utils/colorUtils';

interface PaletteCardProps {
  color: ColorData;
  onOpenInfo: (color: ColorData) => void;
  onOpenGrid: (color: ColorData) => void;
  onEditScale: (color: ColorData) => void; 
  onCopy: (text: string) => void;
  onColorUpdate?: (updatedColor: ColorData) => void;
  isPrintMode?: boolean;
  isCompact?: boolean;
  globalConfig?: GlobalCurveConfig;
}

const PaletteCard: React.FC<PaletteCardProps> = ({ color, onOpenInfo, onOpenGrid, onEditScale, onCopy, onColorUpdate, isPrintMode, isCompact = false, globalConfig }) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState(color.name);
  
  // Pass globalConfig here to ensure sliders affect the card immediately
  const shades = generateShades(color, globalConfig);
  const cmyk = rgbToCmyk(color.rgb.r, color.rgb.g, color.rgb.b);
  
  // Sync editedName when color.name changes externally
  useEffect(() => {
    setEditedName(color.name);
  }, [color.name]);
  
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEditedName(e.target.value);
  };
  
  const handleNameBlur = () => {
    setIsEditingName(false);
    if (editedName !== color.name && onColorUpdate) {
      onColorUpdate({ ...color, name: editedName.trim() || color.name });
    }
  };
  
  const handleNameKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.currentTarget.blur();
    } else if (e.key === 'Escape') {
      setEditedName(color.name);
      setIsEditingName(false);
    }
  };

  useEffect(() => {
    if (cardRef.current) {
      // 88 hex is ~53% opacity. Higher than before for punchier border glow.
      cardRef.current.style.setProperty("--glow-color", `${color.hex}88`); 
    }
  }, [color.hex]);

  const handleCopy = (hex: string) => {
    onCopy(hex);
  };

  const hasCustomScale = color.scaleConfig && (color.scaleConfig.hueShift !== 0 || color.scaleConfig.saturationBoost !== 0 || color.scaleConfig.lockInputColor || color.scaleConfig.useOkLCH);

  return (
    <div 
        ref={cardRef}
        className={`glow-card rounded-2xl overflow-hidden shadow-2xl transition-all duration-300 flex flex-col ${isCompact ? 'h-auto' : 'h-full'}`}
    >
        <div className="glow-content flex flex-col h-full flex-1">
            {/* Custom Scale Indicator */}
            {hasCustomScale && !isCompact && (
                 <div className="absolute top-3 right-3 z-20 pointer-events-none">
                     <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold border backdrop-blur-sm bg-indigo-500/20 text-indigo-300 border-indigo-500/30">
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                        Tuned
                     </span>
                 </div>
            )}

            {/* Main Color Header - Hidden in Compact Mode */}
            {!isCompact && (
                <div 
                    className="h-32 w-full relative group cursor-pointer overflow-hidden rounded-t-[calc(1rem-1px)]"
                    style={{ backgroundColor: color.hex }}
                    onClick={() => onOpenInfo(color)}
                >
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/20 backdrop-blur-[2px]">
                        <span className="bg-white/90 text-black px-3 py-1 rounded-full text-xs font-bold shadow-lg transform scale-95 group-hover:scale-100 transition-transform">
                            View Details
                        </span>
                    </div>
                </div>
            )}

            {/* Controls & Info */}
            <div className={`p-5 flex-1 flex flex-col relative z-10 ${isCompact ? 'py-4' : ''}`}>
                <div className="flex justify-between items-start mb-4">
                    <div>
                        <div className="flex items-center gap-2">
                            {isCompact && (
                                <div className="w-4 h-4 rounded-full shadow-sm ring-1 ring-white/10" style={{ backgroundColor: color.hex }}></div>
                            )}
                            {isEditingName ? (
                                <input
                                    type="text"
                                    value={editedName}
                                    onChange={handleNameChange}
                                    onBlur={handleNameBlur}
                                    onKeyDown={handleNameKeyDown}
                                    className="text-lg font-bold text-white bg-slate-800/50 border border-indigo-500/50 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                    autoFocus
                                />
                            ) : (
                                <h3 
                                    className="text-lg font-bold text-white group-hover:text-indigo-400 transition-colors cursor-text hover:bg-slate-800/30 rounded px-2 py-1 -mx-2 -my-1"
                                    onClick={() => setIsEditingName(true)}
                                    title="Click to edit name"
                                >
                                    {color.name}
                                </h3>
                            )}
                        </div>
                        <div className="flex items-center gap-3 mt-1 text-xs font-mono text-slate-400">
                            <button 
                                className="uppercase hover:text-white transition-colors relative"
                                onClick={(e) => { e.stopPropagation(); handleCopy(color.hex); }}
                            >
                                {color.hex}
                            </button>
                            <span className="w-px h-3 bg-slate-700"></span>
                            
                            {isPrintMode ? (
                                <span className="text-indigo-300 font-bold">
                                    C:{cmyk.c} M:{cmyk.m} Y:{cmyk.y} K:{cmyk.k}
                                </span>
                            ) : (
                                <span>{color.hsl.h}°, {color.hsl.s}%, {color.hsl.l}%</span>
                            )}
                        </div>
                    </div>
                    <div className="flex gap-1">
                        <button 
                            onClick={() => onEditScale(color)}
                            className={`p-2 rounded-lg transition-colors ${color.scaleConfig && (color.scaleConfig.hueShift !== 0 || color.scaleConfig.saturationBoost !== 0 || color.scaleConfig.useOkLCH) ? 'text-indigo-400 bg-indigo-500/10 hover:bg-indigo-500/20' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
                            title="Edit Scale (Curves)"
                        >
                             <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" /></svg>
                        </button>
                        <button 
                            onClick={() => onOpenGrid(color)}
                            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                            title="Contrast Grid"
                        >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                        </button>
                        {isCompact && (
                            <button 
                                onClick={() => onOpenInfo(color)}
                                className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                                title="Info"
                            >
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                            </button>
                        )}
                    </div>
                </div>

                {/* Shades Grid - Dynamic based on Steps */}
                <div className="mt-auto">
                    <div className="flex justify-between items-center mb-2">
                        <div className="text-[10px] text-slate-500 font-bold uppercase">Shades ({shades.length})</div>
                        {hasCustomScale && !isCompact && <div className="text-[9px] text-indigo-400 font-mono">* Modified</div>}
                    </div>
                    
                    <div 
                        className="grid gap-1 md:flex md:gap-0 md:rounded-lg md:overflow-hidden md:h-12 md:w-full md:ring-1 md:ring-white/10 md:shadow-inner md:bg-slate-950"
                        style={{ 
                            // Mobile: Dynamic Grid columns (min 5, max 10)
                            gridTemplateColumns: `repeat(${Math.min(shades.length, 10)}, 1fr)` 
                        }}
                    >
                        {shades.map((shade) => {
                            const isLight = shade.contrastWhite < 4.5;
                            const textColor = isLight ? 'text-black' : 'text-white';
                            
                            return (
                                <div 
                                    key={shade.level} 
                                    className="aspect-square rounded md:rounded-none md:aspect-auto md:flex-1 md:min-w-0 md:hover:flex-[3] transition-all duration-300 ease-out cursor-pointer relative group/shade flex flex-col justify-center items-center shadow-sm md:shadow-none"
                                    style={{ backgroundColor: shade.hex }}
                                    onClick={() => handleCopy(shade.hex)}
                                >
                                    {shade.isInput && (
                                        <div className={`absolute top-1 right-1 opacity-60 ${isLight ? 'text-black' : 'text-white'}`}>
                                            <svg className="w-2 h-2" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" /></svg>
                                        </div>
                                    )}
                                    <div className={`opacity-0 group-hover/shade:opacity-100 flex flex-col items-center justify-center transition-opacity duration-200 ${textColor} delay-75`}>
                                        <span className="font-bold text-[8px] md:text-[10px] leading-none mb-0.5">{shade.level}</span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    </div>
  );
};

export default PaletteCard;
