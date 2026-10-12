
import React, { useRef, useEffect, useState } from 'react';
import { Eye, Info, Lock, SlidersHorizontal } from 'lucide-react';
import { ColorData, ColorRGB, GlobalCurveConfig } from '../types';
import { generateShades, hexToRgb, rgbToCmyk } from '../utils/colorUtils';
import ColorInfo, { stepRef } from './ColorInfo';

interface OpenInfo {
  id: string;
  hex: string;
  rgb: ColorRGB;
  level?: number;
  anchor: HTMLElement;
  closing: boolean;
}

interface PaletteCardProps {
  color: ColorData;
  onOpenGrid: (color: ColorData) => void;
  onEditScale: (color: ColorData) => void; 
  onCopy: (text: string) => void;
  onColorUpdate?: (updatedColor: ColorData) => void;
  isPrintMode?: boolean;
  isCompact?: boolean;
  globalConfig?: GlobalCurveConfig;
}

const PaletteCard: React.FC<PaletteCardProps> = ({ color, onOpenGrid, onEditScale, onCopy, onColorUpdate, isPrintMode, isCompact = false, globalConfig }) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState(color.name);
  const [info, setInfo] = useState<OpenInfo | null>(null);
  
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

  const openInfo = (anchor: HTMLElement, next: Omit<OpenInfo, 'anchor' | 'closing'>) => {
    setInfo((current) => {
      if (current && current.anchor === anchor && !current.closing) {
        return { ...current, closing: true };
      }
      return { ...next, anchor, closing: false };
    });
  };

  const hasCustomScale = color.scaleConfig && (color.scaleConfig.hueShift !== 0 || color.scaleConfig.saturationBoost !== 0 || color.scaleConfig.lockInputColor || color.scaleConfig.useOkLCH);

  return (
    <div 
        ref={cardRef}
        className={`relative rounded-2xl bg-card text-card-foreground ring-1 ring-border shadow-panel overflow-hidden flex flex-col ${isCompact ? 'h-auto' : 'h-full'}`}
    >
        <div className="flex flex-col h-full flex-1">
            {hasCustomScale && !isCompact && (
                 <div className="absolute top-3 right-3 z-20 pointer-events-none">
                     <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[12px] border border-border bg-accent text-foreground">
                        Tuned
                     </span>
                 </div>
            )}

            {/* Main Color Header - Hidden in Compact Mode */}
            {!isCompact && (
                <div 
                    className="h-32 w-full relative group cursor-pointer overflow-hidden rounded-t-[calc(1rem-1px)]"
                    style={{ backgroundColor: color.hex }}
                    data-color-info-trigger
                    onClick={(event) => openInfo(event.currentTarget, { id: 'base', hex: color.hex, rgb: color.rgb })}
                >
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
                                    className="text-[15px] font-medium text-foreground bg-background border border-border rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-ring"
                                    autoFocus
                                />
                            ) : (
                                <h3 
                                    className="text-[15px] font-medium text-foreground cursor-text hover:bg-accent rounded-lg px-2 py-1 -mx-2 -my-1"
                                    onClick={() => setIsEditingName(true)}
                                    title="Click to edit name"
                                >
                                    {color.name}
                                </h3>
                            )}
                        </div>
                        <div className="flex items-center gap-3 mt-1 text-[12px] font-mono text-muted-foreground">
                            <button 
                                className="uppercase hover:text-foreground transition-colors relative"
                                onClick={(e) => { e.stopPropagation(); handleCopy(color.hex); }}
                            >
                                {color.hex}
                            </button>
                            <span className="w-px h-3 bg-border"></span>
                            
                            {isPrintMode ? (
                                <span className="text-foreground font-medium">
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
                            className={`p-2 rounded-lg transition-colors ${color.scaleConfig && (color.scaleConfig.hueShift !== 0 || color.scaleConfig.saturationBoost !== 0 || color.scaleConfig.useOkLCH) ? 'text-foreground bg-accent' : 'text-muted-foreground hover:text-foreground hover:bg-accent'}`}
                            aria-label="Edit scale"
                        >
                             <SlidersHorizontal className="size-5" strokeWidth={1.5} />
                        </button>
                        <button 
                            onClick={() => onOpenGrid(color)}
                            className="p-2 text-muted-foreground hover:text-foreground hover:bg-accent rounded-lg transition-colors"
                            aria-label="Contrast"
                        >
                            <Eye className="size-5" strokeWidth={1.5} />
                        </button>
                        <button 
                            type="button"
                            data-color-info-trigger
                            onClick={(event) => openInfo(event.currentTarget, { id: 'base', hex: color.hex, rgb: color.rgb })}
                            className="p-2 text-muted-foreground hover:text-foreground hover:bg-accent rounded-lg transition-colors"
                            aria-label="Color details"
                        >
                            <Info className="size-5" strokeWidth={1.5} />
                        </button>
                    </div>
                </div>

                {/* Shades Grid - Dynamic based on Steps */}
                <div className="mt-auto">
                    <div className="flex justify-between items-center mb-2">
                        <div className="text-[13px] text-muted-foreground">Shades ({shades.length})</div>
                        {hasCustomScale && !isCompact && <div className="text-[12px] text-muted-foreground font-mono">Modified</div>}
                    </div>
                    
                    <div 
                        className="grid gap-1 md:flex md:gap-0 md:rounded-lg md:overflow-hidden md:h-12 md:w-full md:ring-1 md:ring-border"
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
                                    className="aspect-square rounded md:rounded-none md:aspect-auto md:flex-1 md:min-w-0 cursor-pointer relative flex flex-col justify-center items-center shadow-sm md:shadow-none"
                                    style={{ backgroundColor: shade.hex }}
                                    onClick={() => handleCopy(shade.hex)}
                                    aria-label={`Step ${shade.level}, ${shade.hex}`}
                                >
                                    <button
                                        type="button"
                                        data-color-info-trigger
                                        aria-label={`Color details, step ${shade.level}`}
                                        className={`absolute top-0.5 left-0.5 grid size-4 place-items-center rounded ${isLight ? 'text-black/80 hover:bg-black/10' : 'text-white/90 hover:bg-white/15'}`}
                                        onClick={(event) => {
                                            event.stopPropagation();
                                            openInfo(event.currentTarget, {
                                                id: `step-${shade.level}`,
                                                hex: shade.hex,
                                                rgb: hexToRgb(shade.hex),
                                                level: shade.level,
                                            });
                                        }}
                                    >
                                        <Info className="size-3" strokeWidth={1.5} />
                                    </button>
                                    {shade.isInput && (
                                        <div className={`absolute top-1 right-1 ${isLight ? 'text-black' : 'text-white'}`}>
                                            <Lock className="size-2.5" strokeWidth={1.5} aria-hidden />
                                        </div>
                                    )}
                                    <div className={`flex flex-col items-center justify-center ${textColor}`}>
                                        <span className="font-mono text-[10px] leading-none">{shade.level}</span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
        {info && (
            <ColorInfo
                key={info.id}
                hex={info.hex}
                rgb={info.rgb}
                step={info.level != null ? stepRef(color.name, info.level) : undefined}
                printOn={!!isPrintMode}
                anchor={info.anchor}
                closing={info.closing}
                onCopy={onCopy}
                onRequestClose={() => setInfo((current) => current && !current.closing ? { ...current, closing: true } : current)}
                onClosed={() => setInfo(null)}
            />
        )}
    </div>
  );
};

export default PaletteCard;
