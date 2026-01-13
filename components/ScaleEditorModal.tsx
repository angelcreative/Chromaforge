
import React, { useState, useMemo, useEffect } from 'react';
import { ColorData, ScaleConfiguration } from '../types';
import { generateShades, createColorData, hexToHsl, rgbToOklch } from '../utils/colorUtils';

interface ScaleEditorModalProps {
  color: ColorData;
  onClose: () => void;
  onSave: (colorHex: string, newConfig: ScaleConfiguration) => void;
  usageCount?: number;
  limit?: number;
  isPremium?: boolean;
}

const ScaleEditorModal: React.FC<ScaleEditorModalProps> = ({ color, onClose, onSave, usageCount, limit, isPremium }) => {
  const [config, setConfig] = useState<ScaleConfiguration>(color.scaleConfig || {
    hueShift: 0,
    saturationBoost: 0,
    lightnessEase: 'linear',
    useOkLCH: true,
    mode: 'curves' // Default to curves
  });

  const [isZoomed, setIsZoomed] = useState(true);
  const [activeShade, setActiveShade] = useState<number | null>(null);

  // Initialize Linear Config if missing when switching modes
  useEffect(() => {
      if (config.mode === 'linear' && !config.linearConfig) {
          const oklch = rgbToOklch(color.rgb.r, color.rgb.g, color.rgb.b);
          setConfig(prev => ({
              ...prev,
              linearConfig: {
                  start: { l: 0.98, c: 0.02, h: oklch.h }, // Near White
                  end: { l: 0.05, c: oklch.c, h: oklch.h }, // Near Black (keeping base hue/chroma)
                  steps: 11
              }
          }));
      }
  }, [config.mode, color.rgb]);

  // Generate live preview
  const previewColor = useMemo(() => createColorData(color.hex, config), [color.hex, config]);
  const shades = useMemo(() => generateShades(previewColor), [previewColor]);

  // Find active shade data
  const activeShadeData = useMemo(() => 
    shades.find(s => s.level === activeShade), 
  [shades, activeShade]);

  const handleSave = () => {
    onSave(color.hex, config);
    onClose();
  };

  // --- Visualization Helpers ---
  const size = 320;
  const center = size / 2;
  const radius = 120; // Radius for the plotting area

  // Convert HSL to Polar Coordinates (Standard Color Wheel)
  const getPolarCoords = (h: number, s: number) => {
      const angle = (h - 90) * (Math.PI / 180); 
      const r = (s / 100) * radius;
      return {
          x: center + r * Math.cos(angle),
          y: center + r * Math.sin(angle)
      };
  };

  // Calculate Points & Zoom ViewBox
  const { points, viewBox } = useMemo(() => {
      let minX = size, maxX = 0, minY = size, maxY = 0;
      
      const pts = shades.map(shade => {
          const hsl = hexToHsl(shade.hex);
          const p = getPolarCoords(hsl.h, hsl.s);
          
          if (p.x < minX) minX = p.x;
          if (p.x > maxX) maxX = p.x;
          if (p.y < minY) minY = p.y;
          if (p.y > maxY) maxY = p.y;
          
          return { ...p, hex: shade.hex, level: shade.level, hsl };
      });

      if (!isZoomed) {
          return { points: pts, viewBox: `0 0 ${size} ${size}` };
      }

      const padding = 40; 
      const width = Math.max(maxX - minX, 20); 
      const height = Math.max(maxY - minY, 20);
      const zoomSize = Math.max(width, height) + (padding * 2);
      const finalSize = Math.min(zoomSize, size);
      
      const midX = (minX + maxX) / 2;
      const midY = (minY + maxY) / 2;
      
      const vbX = midX - (finalSize / 2);
      const vbY = midY - (finalSize / 2);

      return { 
          points: pts, 
          viewBox: `${vbX} ${vbY} ${finalSize} ${finalSize}` 
      };
  }, [shades, isZoomed]);

  const pathData = useMemo(() => {
      if (points.length === 0) return '';
      return points.map((p, i) => 
        (i === 0 ? 'M' : 'L') + ` ${p.x.toFixed(1)},${p.y.toFixed(1)}`
      ).join(' ');
  }, [points]);

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-in fade-in zoom-in-95 duration-200">
      <div className="bg-slate-950 border border-slate-800 rounded-2xl w-full max-w-5xl shadow-2xl flex flex-col md:flex-row max-h-[90vh] overflow-hidden">
        
        {/* Left: Visualization (The "Wheel") */}
        <div className="w-full md:w-1/2 bg-slate-900/50 p-6 md:p-8 flex flex-col border-b md:border-b-0 md:border-r border-slate-800 min-h-[500px]">
             
             {/* Header Section */}
             <div className="flex justify-between items-start shrink-0 mb-4">
                <div>
                    <h2 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
                        {color.name}
                        {!isPremium && usageCount !== undefined && limit !== undefined && (
                            <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded border ${usageCount >= limit ? 'border-red-500/30 text-red-400 bg-red-500/10' : 'border-slate-700 text-slate-500'}`}>
                                {usageCount}/{limit}
                            </span>
                        )}
                    </h2>
                    <p className="text-sm text-slate-500 font-mono mt-1">Hue & Saturation Path</p>
                </div>
                
                <button 
                    onClick={() => setIsZoomed(!isZoomed)}
                    className={`text-[10px] px-3 py-1.5 rounded-lg border font-bold tracking-wider transition-all flex items-center gap-2 ${
                        isZoomed 
                        ? 'bg-indigo-500/10 text-indigo-300 border-indigo-500/30 hover:bg-indigo-500/20' 
                        : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white hover:border-slate-600'
                    }`}
                >
                    {isZoomed ? (
                        <>
                           <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse"></span>
                           AUTO ZOOM
                        </>
                    ) : (
                        "FULL VIEW"
                    )}
                </button>
             </div>

             {/* The Wheel Visualizer */}
             <div className="flex-1 flex items-center justify-center py-4 select-none group relative w-full overflow-hidden">
                 <div className="relative w-[320px] h-[320px]">
                    <svg 
                        width={size} 
                        height={size} 
                        viewBox={viewBox} 
                        className="overflow-hidden bg-slate-950/50 rounded-full shadow-inner ring-1 ring-white/5 transition-[viewBox] duration-500 ease-in-out cursor-pointer"
                        onClick={() => setActiveShade(null)} 
                    >
                        <defs>
                            <radialGradient id="wheelGrad" cx="50%" cy="50%" r="50%" fx="50%" fy="50%">
                                <stop offset="0%" stopColor={color.hex} stopOpacity="0.15" />
                                <stop offset="100%" stopColor="transparent" stopOpacity="0" />
                            </radialGradient>
                        </defs>
                        
                        <circle cx={center} cy={center} r={radius * 1.3} fill="url(#wheelGrad)" />
                        
                        <g className="opacity-30 pointer-events-none">
                            <circle cx={center} cy={center} r={radius} fill="none" stroke="#64748b" strokeWidth="1" strokeDasharray="4 4" vectorEffect="non-scaling-stroke" />
                            <circle cx={center} cy={center} r={radius * 0.5} fill="none" stroke="#64748b" strokeWidth="1" strokeDasharray="4 4" vectorEffect="non-scaling-stroke" />
                            <line x1={center} y1={center - radius} x2={center} y2={center + radius} stroke="#64748b" strokeWidth="1" vectorEffect="non-scaling-stroke" />
                            <line x1={center - radius} y1={center} x2={center + radius} y2={center} stroke="#64748b" strokeWidth="1" vectorEffect="non-scaling-stroke" />
                        </g>

                        <path 
                            d={pathData} 
                            fill="none" 
                            stroke="white" 
                            strokeWidth="2" 
                            strokeOpacity="0.5"
                            strokeLinecap="round" 
                            strokeLinejoin="round"
                            vectorEffect="non-scaling-stroke"
                            className="pointer-events-none"
                        />

                        {points.map((s) => {
                            const isMain = s.level === 500;
                            const isActive = activeShade === s.level;
                            const r = isMain ? 4 : 2.5; 
                            
                            return (
                                <g 
                                    key={s.level} 
                                    className="group/point cursor-pointer"
                                    onClick={(e) => { e.stopPropagation(); setActiveShade(s.level); }}
                                >
                                    <circle cx={s.x} cy={s.y} r={r * 4} fill="transparent" vectorEffect="non-scaling-stroke" />
                                    <circle 
                                        cx={s.x} 
                                        cy={s.y} 
                                        r={isActive ? r + 2 : r} 
                                        fill={s.hex} 
                                        stroke={isMain || isActive ? "white" : "rgba(255,255,255,0.4)"} 
                                        strokeWidth={isActive ? 2 : (isMain ? 1.5 : 1)}
                                        vectorEffect="non-scaling-stroke"
                                        className={`transition-all duration-200 ${isActive ? 'shadow-[0_0_15px_rgba(255,255,255,0.5)]' : 'shadow-lg'}`}
                                    />
                                    {isActive && (
                                        <circle 
                                            cx={s.x} 
                                            cy={s.y} 
                                            r={r * 2.5} 
                                            fill="none" 
                                            stroke="white" 
                                            strokeWidth="1" 
                                            strokeOpacity="0.5"
                                            strokeDasharray="2 2"
                                            vectorEffect="non-scaling-stroke"
                                            className="animate-spin-slow"
                                        />
                                    )}
                                </g>
                            );
                        })}
                    </svg>
                    
                    <div className="absolute -bottom-6 w-full text-center pointer-events-none h-6">
                        {activeShadeData ? (
                            <div className="flex flex-col items-center animate-in fade-in slide-in-from-bottom-1 duration-200">
                                <span className="text-[11px] font-bold text-white tracking-widest uppercase">
                                    SHADE {activeShadeData.level}
                                </span>
                                <span className="text-[9px] font-mono text-slate-400">
                                    {activeShadeData.hex}
                                </span>
                            </div>
                        ) : (
                            <span className="text-[9px] text-slate-500 font-mono tracking-widest uppercase opacity-50">
                                {isZoomed ? "Focused View (H/S)" : "Full Polar Projection"}
                            </span>
                        )}
                    </div>
                 </div>
             </div>
             
             {/* Strip Preview Footer */}
             <div className="shrink-0 w-full pt-8">
                <div className="flex justify-between text-[10px] text-slate-500 uppercase font-bold mb-2 px-1">
                    <span>Dark (950)</span>
                    <span>Base (500)</span>
                    <span>Light (50)</span>
                </div>
                <div className="h-4 w-full flex rounded-full overflow-hidden ring-1 ring-white/10 bg-slate-900">
                    {[...shades].reverse().map(s => {
                        const isActive = activeShade === s.level;
                        return (
                            <div 
                                key={s.level} 
                                onClick={() => setActiveShade(s.level)}
                                className={`flex-1 h-full cursor-pointer transition-all duration-200 ${isActive ? 'ring-2 ring-white z-10 scale-y-125 rounded-sm shadow-lg' : 'hover:opacity-90'}`} 
                                style={{ backgroundColor: s.hex }} 
                                title={`${s.level}: ${s.hex}`} 
                            />
                        );
                    })}
                </div>
             </div>
        </div>

        {/* Right: Controls */}
        <div className="w-full md:w-1/2 p-6 md:p-10 flex flex-col h-full bg-slate-950 overflow-y-auto custom-scrollbar">
            <div className="flex justify-between items-center mb-8 shrink-0">
                
                {/* Engine Toggle Switch */}
                <div className="flex bg-slate-900 p-1 rounded-lg border border-slate-800">
                    <button 
                        onClick={() => setConfig({ ...config, mode: 'curves' })}
                        className={`px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded-md transition-all ${!config.mode || config.mode === 'curves' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:text-white'}`}
                    >
                        Curve Engine
                    </button>
                    <button 
                        onClick={() => setConfig({ ...config, mode: 'linear' })}
                        className={`px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded-md transition-all ${config.mode === 'linear' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:text-white'}`}
                    >
                        Linear Blend
                    </button>
                </div>

                <button 
                    onClick={onClose} 
                    className="group flex items-center gap-2 text-xs font-medium text-slate-500 hover:text-white transition-colors"
                >
                    Close
                    <div className="p-1 rounded-full bg-slate-900 group-hover:bg-slate-800 border border-slate-800 group-hover:border-slate-700 transition-colors">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </div>
                </button>
            </div>

            <div className="space-y-8 flex-1">
                 
                 {/* MODE: LINEAR BLEND */}
                 {config.mode === 'linear' && config.linearConfig && (
                     <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                         <div className="p-4 rounded-xl bg-slate-900 border border-indigo-500/20 shadow-inner">
                             <p className="text-xs text-slate-400 leading-relaxed mb-4">
                                 <b>Linear Mode:</b> Generates a perfectly straight mathematical path between two points in perceptual color space. Ideal for fixing sparse palettes (e.g. 100-900 ranges) or creating strict 2-point ramps.
                             </p>
                             
                             <div className="grid grid-cols-2 gap-4">
                                 {/* Start Color Inputs */}
                                 <div className="space-y-2">
                                     <label className="text-[10px] font-bold text-slate-500 uppercase">Start Color (Light)</label>
                                     <div className="space-y-1">
                                         <div className="flex items-center gap-2 bg-slate-950 p-2 rounded border border-white/5">
                                             <span className="text-[10px] font-mono text-slate-500 w-4">L</span>
                                             <input 
                                                type="number" step="1" min="0" max="100"
                                                value={Math.round(config.linearConfig.start.l * 100)}
                                                onChange={(e) => setConfig({
                                                    ...config, 
                                                    linearConfig: { ...config.linearConfig!, start: { ...config.linearConfig!.start, l: Number(e.target.value) / 100 } }
                                                })}
                                                className="bg-transparent w-full text-xs font-mono text-white focus:outline-none"
                                             />
                                         </div>
                                         <div className="flex items-center gap-2 bg-slate-950 p-2 rounded border border-white/5">
                                             <span className="text-[10px] font-mono text-slate-500 w-4">C</span>
                                             <input 
                                                type="number" step="0.01" min="0" max="0.4"
                                                value={config.linearConfig.start.c}
                                                onChange={(e) => setConfig({
                                                    ...config, 
                                                    linearConfig: { ...config.linearConfig!, start: { ...config.linearConfig!.start, c: Number(e.target.value) } }
                                                })}
                                                className="bg-transparent w-full text-xs font-mono text-white focus:outline-none"
                                             />
                                         </div>
                                         <div className="flex items-center gap-2 bg-slate-950 p-2 rounded border border-white/5">
                                             <span className="text-[10px] font-mono text-slate-500 w-4">H</span>
                                             <input 
                                                type="number" step="1" min="0" max="360"
                                                value={Math.round(config.linearConfig.start.h)}
                                                onChange={(e) => setConfig({
                                                    ...config, 
                                                    linearConfig: { ...config.linearConfig!, start: { ...config.linearConfig!.start, h: Number(e.target.value) } }
                                                })}
                                                className="bg-transparent w-full text-xs font-mono text-white focus:outline-none"
                                             />
                                         </div>
                                     </div>
                                 </div>

                                 {/* End Color Inputs */}
                                 <div className="space-y-2">
                                     <label className="text-[10px] font-bold text-slate-500 uppercase">End Color (Dark)</label>
                                     <div className="space-y-1">
                                         <div className="flex items-center gap-2 bg-slate-950 p-2 rounded border border-white/5">
                                             <span className="text-[10px] font-mono text-slate-500 w-4">L</span>
                                             <input 
                                                type="number" step="1" min="0" max="100"
                                                value={Math.round(config.linearConfig.end.l * 100)}
                                                onChange={(e) => setConfig({
                                                    ...config, 
                                                    linearConfig: { ...config.linearConfig!, end: { ...config.linearConfig!.end, l: Number(e.target.value) / 100 } }
                                                })}
                                                className="bg-transparent w-full text-xs font-mono text-white focus:outline-none"
                                             />
                                         </div>
                                         <div className="flex items-center gap-2 bg-slate-950 p-2 rounded border border-white/5">
                                             <span className="text-[10px] font-mono text-slate-500 w-4">C</span>
                                             <input 
                                                type="number" step="0.01" min="0" max="0.4"
                                                value={config.linearConfig.end.c}
                                                onChange={(e) => setConfig({
                                                    ...config, 
                                                    linearConfig: { ...config.linearConfig!, end: { ...config.linearConfig!.end, c: Number(e.target.value) } }
                                                })}
                                                className="bg-transparent w-full text-xs font-mono text-white focus:outline-none"
                                             />
                                         </div>
                                         <div className="flex items-center gap-2 bg-slate-950 p-2 rounded border border-white/5">
                                             <span className="text-[10px] font-mono text-slate-500 w-4">H</span>
                                             <input 
                                                type="number" step="1" min="0" max="360"
                                                value={Math.round(config.linearConfig.end.h)}
                                                onChange={(e) => setConfig({
                                                    ...config, 
                                                    linearConfig: { ...config.linearConfig!, end: { ...config.linearConfig!.end, h: Number(e.target.value) } }
                                                })}
                                                className="bg-transparent w-full text-xs font-mono text-white focus:outline-none"
                                             />
                                         </div>
                                     </div>
                                 </div>
                             </div>
                         </div>
                     </div>
                 )}

                 {/* MODE: CURVE ENGINE (Standard) */}
                 {(!config.mode || config.mode === 'curves') && (
                    <div className="space-y-10 animate-in slide-in-from-left-4 duration-300">
                        {/* OKLCH Toggle */}
                        <div className="flex items-center justify-between p-3 bg-slate-900 rounded-xl border border-white/5 hover:border-indigo-500/30 transition-all">
                            <div>
                                <div className="flex items-center gap-2">
                                    <span className="text-xs font-bold text-white uppercase">Use OKLCH Engine</span>
                                </div>
                                <p className="text-[10px] text-slate-500 mt-1">Perceptually uniform brightness distribution. Highly recommended.</p>
                            </div>
                            <button 
                                onClick={() => setConfig({ ...config, useOkLCH: !config.useOkLCH })}
                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${config.useOkLCH ? 'bg-indigo-600' : 'bg-slate-700'}`}
                            >
                                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition duration-200 ease-in-out ${config.useOkLCH ? 'translate-x-6' : 'translate-x-1'}`} />
                            </button>
                        </div>

                        {/* Hue Shift Control */}
                        <div className="relative">
                            <div className="flex justify-between mb-4 items-end">
                                <label className="text-base font-medium text-white">Hue Rotation</label>
                                <span className={`text-sm font-mono px-2 py-1 rounded bg-slate-900 border border-slate-800 ${config.hueShift !== 0 ? 'text-indigo-400 border-indigo-500/30' : 'text-slate-500'}`}>
                                    {config.hueShift > 0 ? '+' : ''}{config.hueShift}°
                                </span>
                            </div>
                            
                            <div className="relative h-12 flex items-center">
                                <div className="absolute w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                                    <div className="absolute w-full h-full bg-gradient-to-r from-cyan-500 via-slate-700 to-orange-500 opacity-20"></div>
                                </div>
                                <input 
                                    type="range" 
                                    min="-60" 
                                    max="60" 
                                    step="1"
                                    value={config.hueShift}
                                    onChange={(e) => setConfig({ ...config, hueShift: Number(e.target.value) })}
                                    className="w-full absolute z-10 h-12 opacity-0 cursor-pointer"
                                />
                                <div 
                                    className="absolute h-5 w-5 bg-white rounded-full shadow-[0_0_10px_rgba(255,255,255,0.5)] pointer-events-none transition-all duration-75"
                                    style={{ left: `calc(${((config.hueShift + 60) / 120) * 100}% - 10px)` }}
                                >
                                    <div className="absolute inset-0 rounded-full bg-indigo-500 opacity-20 animate-ping"></div>
                                </div>
                            </div>
                            <div className="flex justify-between text-[11px] text-slate-500 font-medium uppercase tracking-wider mt-1">
                                <span>Cooler</span>
                                <span>Warmer</span>
                            </div>
                            <p className="text-xs text-slate-500 mt-3 leading-relaxed">
                                Shifts the hue as the color gets darker/lighter to create natural, vibrant gradients.
                            </p>
                        </div>

                        {/* Saturation Boost Control */}
                        <div>
                            <div className="flex justify-between mb-4 items-end">
                                <label className="text-base font-medium text-white">Saturation Curve</label>
                                <span className={`text-sm font-mono px-2 py-1 rounded bg-slate-900 border border-slate-800 ${config.saturationBoost !== 0 ? 'text-pink-400 border-pink-500/30' : 'text-slate-500'}`}>
                                    {config.saturationBoost > 0 ? '+' : ''}{config.saturationBoost}%
                                </span>
                            </div>
                            
                            <div className="relative h-12 flex items-center">
                                <div className="absolute w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                                    <div className="absolute left-1/2 top-0 bottom-0 w-1/2 bg-gradient-to-r from-transparent to-pink-500 opacity-20"></div>
                                    <div className="absolute right-1/2 top-0 bottom-0 w-1/2 bg-gradient-to-l from-transparent to-slate-500 opacity-20"></div>
                                </div>
                                <input 
                                    type="range" 
                                    min="-100" 
                                    max="100" 
                                    step="1"
                                    value={config.saturationBoost}
                                    onChange={(e) => setConfig({ ...config, saturationBoost: Number(e.target.value) })}
                                    className="w-full absolute z-10 h-12 opacity-0 cursor-pointer"
                                />
                                <div 
                                    className="absolute h-5 w-5 bg-white rounded-full shadow-[0_0_10px_rgba(255,255,255,0.5)] pointer-events-none transition-all duration-75"
                                    style={{ left: `calc(${((config.saturationBoost + 100) / 200) * 100}% - 10px)` }}
                                />
                            </div>
                            <div className="flex justify-between text-[11px] text-slate-500 font-medium uppercase tracking-wider mt-1">
                                <span>Flatten</span>
                                <span>Boost Mids</span>
                            </div>
                            <p className="text-xs text-slate-500 mt-3 leading-relaxed">
                                Adjusts saturation/chroma in the mid-tones. Boosting prevents colors from looking "washed out".
                            </p>
                        </div>

                        {/* Lightness Easing */}
                        <div className={`transition-opacity duration-300 ${config.useOkLCH ? 'opacity-30 pointer-events-none' : 'opacity-100'}`}>
                            <div className="flex justify-between items-center mb-4">
                                <label className="text-base font-medium text-white block">Lightness Distribution</label>
                                {config.useOkLCH && <span className="text-[10px] text-indigo-400">Handled by OKLCH</span>}
                            </div>
                            <div className="grid grid-cols-4 gap-3">
                                {(['linear', 'ease-in', 'ease-out', 'ease-in-out'] as const).map((mode) => (
                                    <button
                                        key={mode}
                                        onClick={() => setConfig({ ...config, lightnessEase: mode })}
                                        className={`py-3 rounded-xl text-[10px] md:text-xs font-bold uppercase tracking-wide transition-all border ${
                                            config.lightnessEase === mode 
                                            ? 'bg-slate-100 text-slate-900 border-white shadow-lg shadow-white/10 scale-105' 
                                            : 'bg-slate-900 text-slate-400 border-slate-800 hover:border-slate-600 hover:text-slate-200'
                                        }`}
                                    >
                                        {mode.replace('-', ' ')}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                 )}
            </div>

            {/* Actions */}
            <div className="pt-8 mt-auto border-t border-slate-800 flex gap-4 shrink-0">
                <button 
                    onClick={onClose}
                    className="flex-1 py-4 text-sm font-medium text-slate-400 hover:text-white transition rounded-xl hover:bg-slate-900 border border-transparent hover:border-slate-800"
                >
                    Discard
                </button>
                <button 
                    onClick={handleSave}
                    className="flex-[2] py-4 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold rounded-xl shadow-lg shadow-indigo-500/20 transition-all flex items-center justify-center gap-2 transform active:scale-[0.98]"
                >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                    Apply Changes
                </button>
            </div>
        </div>
      </div>
    </div>
  );
};

export default ScaleEditorModal;
