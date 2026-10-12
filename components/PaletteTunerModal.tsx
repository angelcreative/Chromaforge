
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { ColorData, ColorGroup } from '../types';
import { createColorData, parseInputToGroups, tunePaletteLinear, tunePaletteLuminanceFit, tunePaletteOKLCH, rgbToOklch, oklchToRgb, rgbToHex, getLuminance } from '../utils/colorUtils';
import ExportModal from './ExportModal';

interface PaletteTunerModalProps {
  onClose: () => void;
  usageCount?: number;
  limit?: number;
  isPremium?: boolean;
  initialCode?: string;
}

type TuneMode = 'linear' | 'lumfit' | 'oklch';
type ViewStep = 'input' | 'tuner';

const PaletteTunerModal: React.FC<PaletteTunerModalProps> = ({ onClose, usageCount, limit, isPremium, initialCode }) => {
  const [inputText, setInputText] = useState(initialCode || '');
  const [currentStep, setCurrentStep] = useState<ViewStep>('input'); 
  const [groupModes, setGroupModes] = useState<Record<number, TuneMode>>({}); 
  const [activeGroupIndex, setActiveGroupIndex] = useState<number>(0);
  const [exportGroups, setExportGroups] = useState<ColorGroup[] | null>(null);
  
  // Global Steps
  const [globalSteps, setGlobalSteps] = useState(11);

  // Manual Overrides per Group
  const [manualOverrides, setManualOverrides] = useState<Record<number, { start?: ColorData, end?: ColorData }>>({});

  // NEW: Editor Overlay State
  const [isEditorOpen, setIsEditorOpen] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Parse Groups from Input
  const parsedGroups = useMemo<ColorGroup[]>(() => {
    return parseInputToGroups(inputText);
  }, [inputText]);

  const hasData = parsedGroups.length > 0;

  // Init modes to OKLCH by default when entering tuner
  useEffect(() => {
      if (currentStep === 'tuner' && hasData) {
          setGroupModes(prev => {
              const next = { ...prev };
              let changed = false;
              parsedGroups.forEach((_, idx) => {
                  if (!next[idx]) {
                      next[idx] = 'oklch'; 
                      changed = true;
                  }
              });
              return changed ? next : prev;
          });
      }
  }, [parsedGroups.length, hasData, currentStep]);

  // Current Active Colors
  const activeColors = useMemo(() => {
      if (!hasData) return [];
      const group = parsedGroups[activeGroupIndex];
      return group ? group.colors : [];
  }, [parsedGroups, activeGroupIndex, hasData]);

  // Current Active Mode & Overrides
  const activeMode = groupModes[activeGroupIndex] || 'oklch';
  const activeOverrides = manualOverrides[activeGroupIndex] || {};

  // Tuned Result for Active Group
  const tunedColors = useMemo(() => {
    if (activeColors.length < 1 && !activeOverrides.start) return activeColors;
    
    // Use original color count if available, otherwise use globalSteps (for manual overrides)
    const stepsToUse = activeColors.length > 0 ? activeColors.length : globalSteps;
    
    if (activeMode === 'linear') {
        return tunePaletteLinear(activeColors, stepsToUse, activeOverrides.start, activeOverrides.end);
    }
    if (activeMode === 'lumfit') {
        return tunePaletteLuminanceFit(activeColors, stepsToUse, activeOverrides.start, activeOverrides.end);
    }
    // Default OKLCH
    return tunePaletteOKLCH(activeColors, stepsToUse, activeOverrides.start, activeOverrides.end);
  }, [activeColors, activeMode, globalSteps, activeOverrides]);

  const handleModeChange = (mode: TuneMode) => {
      setGroupModes(prev => ({
          ...prev,
          [activeGroupIndex]: mode
      }));
  };

  const handleOverride = (type: 'start'|'end', hex: string) => {
      const newColor = createColorData(hex);
      setManualOverrides(prev => ({
          ...prev,
          [activeGroupIndex]: {
              ...prev[activeGroupIndex],
              [type]: newColor
          }
      }));
  };

  const handleStartTuning = () => {
      if (hasData) {
          setCurrentStep('tuner');
      }
  };

  const handleExampleLoad = () => {
      const badPalette = `{ "brand-primary": "#3b82f6", "brand-secondary": "#1e40af" }`;
      setInputText(badPalette);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
          const text = ev.target?.result;
          if (typeof text === 'string') setInputText(text);
      };
      reader.readAsText(file);
      e.target.value = '';
  };

  const handleExportAllClick = () => {
      if (!hasData) return;
      const allTunedGroups = parsedGroups.map((group, idx) => {
          const modeForGroup = groupModes[idx] || 'oklch';
          const ovr = manualOverrides[idx] || {};
          // Use original color count, or globalSteps if no colors (manual override case)
          const stepsToUse = group.colors.length > 0 ? group.colors.length : globalSteps;
          let tuned = group.colors;
          
          if (modeForGroup === 'linear') tuned = tunePaletteLinear(group.colors, stepsToUse, ovr.start, ovr.end);
          else if (modeForGroup === 'lumfit') tuned = tunePaletteLuminanceFit(group.colors, stepsToUse, ovr.start, ovr.end);
          else tuned = tunePaletteOKLCH(group.colors, stepsToUse, ovr.start, ovr.end);
          
          return { name: group.name, colors: tuned };
      });
      setExportGroups(allTunedGroups);
  };

  // --- COMPONENT: COMPARISON GRAPH ---
  // Visualizes Input Luminance vs Output Luminance
  const ComparisonGraph = ({ input, output }: { input: ColorData[], output: ColorData[] }) => {
      const width = 600;
      const height = 100;
      const padding = 10;

      // Helper to generate path data
      const generatePath = (colors: ColorData[]) => {
          if (colors.length === 0) return '';
          return colors.map((c, i) => {
              const lum = getLuminance(c.rgb.r, c.rgb.g, c.rgb.b);
              const x = padding + (i / (colors.length - 1)) * (width - padding * 2);
              const y = height - (lum * (height - padding * 2)) - padding;
              return `${i === 0 ? 'M' : 'L'} ${x},${y}`;
          }).join(' ');
      };

      const inputPath = generatePath(input);
      const outputPath = generatePath(output);

      return (
          <div className="w-full h-32 bg-muted rounded-xl border border-border relative overflow-hidden flex items-center justify-center p-4">
              <svg width="100%" height="100%" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" className="overflow-visible">
                  {/* Grid Lines */}
                  <line x1="0" y1={height/2} x2={width} y2={height/2} stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
                  
                  {/* Input Curve (Ghost) */}
                  <path d={inputPath} fill="none" stroke="#ef4444" strokeWidth="2" strokeDasharray="4 4" opacity="0.6" vectorEffect="non-scaling-stroke" />
                  
                  {/* Output Curve (Solid) */}
                  <path d={outputPath} fill="none" stroke="#22c55e" strokeWidth="3" vectorEffect="non-scaling-stroke" />
                  
                  {/* Dots for Output */}
                  {output.map((c, i) => {
                      const lum = getLuminance(c.rgb.r, c.rgb.g, c.rgb.b);
                      const x = padding + (i / (output.length - 1)) * (width - padding * 2);
                      const y = height - (lum * (height - padding * 2)) - padding;
                      return <circle key={i} cx={x} cy={y} r="3" fill="#22c55e" />;
                  })}
              </svg>
              <div className="absolute top-2 right-3 flex flex-col gap-1 items-end">
                  <div className="flex items-center gap-2 text-[9px] font-bold uppercase tracking-wider text-green-400">
                      <span className="w-3 h-0.5 bg-green-400"></span> Tuned
                  </div>
                  <div className="flex items-center gap-2 text-[9px] font-bold uppercase tracking-wider text-red-400/60">
                      <span className="w-3 h-0.5 bg-red-400/60 border-t border-dashed"></span> Original
                  </div>
              </div>
          </div>
      );
  };

  // --- SUB-COMPONENT: LINEAR EDITOR OVERLAY ---
  const LinearEditorOverlay = () => {
      const startColor = activeOverrides.start || (activeColors.length > 0 ? activeColors[activeColors.length - 1].hsl.l > activeColors[0].hsl.l ? activeColors[activeColors.length-1] : activeColors[0] : createColorData('#ffffff'));
      const endColor = activeOverrides.end || (activeColors.length > 0 ? activeColors[activeColors.length - 1].hsl.l < activeColors[0].hsl.l ? activeColors[activeColors.length-1] : activeColors[0] : createColorData('#000000'));

      const startOk = rgbToOklch(startColor.rgb.r, startColor.rgb.g, startColor.rgb.b);
      const endOk = rgbToOklch(endColor.rgb.r, endColor.rgb.g, endColor.rgb.b);

      const updateStart = (l: number, c: number, h: number) => {
          const rgb = oklchToRgb(l, c, h);
          const hex = rgbToHex(rgb.r, rgb.g, rgb.b);
          handleOverride('start', hex);
      };

      const updateEnd = (l: number, c: number, h: number) => {
          const rgb = oklchToRgb(l, c, h);
          const hex = rgbToHex(rgb.r, rgb.g, rgb.b);
          handleOverride('end', hex);
      };

      const LCHInput = ({ val, onChange, label, max }: { val: number, onChange: (v: number) => void, label: string, max: number }) => (
          <div className="flex flex-col items-center bg-card rounded p-1 border border-border w-16">
              <input 
                  type="number" step={label === 'C' ? 0.001 : 0.1}
                  className="w-full bg-transparent text-center text-xs font-mono text-foreground focus:outline-none"
                  value={label === 'C' ? val.toFixed(3) : val.toFixed(2)}
                  onChange={(e) => onChange(Number(e.target.value))}
              />
              <span className="text-[8px] text-muted-foreground font-bold">{label}</span>
          </div>
      );

      const stepsList = tunedColors.map((color, idx) => {
          const ok = rgbToOklch(color.rgb.r, color.rgb.g, color.rgb.b);
          return (
              <div key={idx} className="flex items-center gap-4 py-2 border-b border-border last:border-0 hover:bg-accent px-2 rounded transition-colors">
                  <span className="text-xs font-mono text-muted-foreground w-12 text-right">Step {idx + 1}</span>
                  <div className="w-10 h-10 rounded shadow-inner ring-1 ring-border" style={{ backgroundColor: color.hex }}></div>
                  <div className="flex-1 font-mono text-xs text-muted-foreground bg-muted p-2 rounded border border-border select-all">
                      oklch({(ok.l * 100).toFixed(2)}% {ok.c.toFixed(3)} {ok.h.toFixed(2)})
                  </div>
              </div>
          );
      });

      return (
          <div className="absolute inset-0 bg-background z-50 flex flex-col animate-in fade-in zoom-in-95 duration-200">
              {/* Header */}
              <div className="h-16 border-b border-border flex items-center justify-between px-6 bg-card shrink-0">
                  <div className="flex items-center gap-4">
                      <button onClick={() => setIsEditorOpen(false)} className="text-muted-foreground hover:text-foreground flex items-center gap-2 text-xs font-bold uppercase">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                          Back
                      </button>
                      <div className="h-6 w-px bg-white/10"></div>
                      <h3 className="text-sm font-bold text-foreground">Linear Interpolation Editor</h3>
                  </div>
                  
                  {/* Global Steps Control in Editor */}
                  <div className="flex items-center gap-3 bg-secondary p-1.5 rounded-lg border border-border">
                      <label className="text-[10px] font-bold text-muted-foreground uppercase ml-1">Steps:</label>
                      <input 
                        type="range" min="3" max="30" 
                        value={globalSteps}
                        onChange={(e) => setGlobalSteps(Number(e.target.value))}
                        className="w-32 h-1 bg-slate-600 rounded-lg appearance-none cursor-pointer"
                      />
                      <span className="text-xs font-mono font-bold text-foreground w-6 text-center">{globalSteps}</span>
                  </div>
              </div>

              {/* Main Content */}
              <div className="flex-1 overflow-y-auto custom-scrollbar p-8">
                  <div className="max-w-3xl mx-auto space-y-6">
                      
                      {/* Start Color */}
                      <div className="bg-card rounded-xl p-4 border border-primary shadow-lg flex items-center gap-6">
                          <div className="text-xs font-bold text-foreground uppercase w-20 text-right">Start Color</div>
                          <div className="w-12 h-12 rounded-lg shadow-inner ring-1 ring-border shrink-0" style={{ backgroundColor: startColor.hex }}></div>
                          <div className="flex gap-2">
                              <LCHInput val={startOk.l} label="L" max={1} onChange={(v) => updateStart(v, startOk.c, startOk.h)} />
                              <LCHInput val={startOk.c} label="C" max={0.4} onChange={(v) => updateStart(startOk.l, v, startOk.h)} />
                              <LCHInput val={startOk.h} label="H" max={360} onChange={(v) => updateStart(startOk.l, startOk.c, v)} />
                          </div>
                      </div>

                      {/* Steps List */}
                      <div className="bg-muted rounded-xl border border-border p-2 max-h-[400px] overflow-y-auto custom-scrollbar shadow-inner">
                          {stepsList}
                      </div>

                      {/* End Color */}
                      <div className="bg-card rounded-xl p-4 border border-primary shadow-lg flex items-center gap-6">
                          <div className="text-xs font-bold text-foreground uppercase w-20 text-right">End Color</div>
                          <div className="w-12 h-12 rounded-lg shadow-inner ring-1 ring-border shrink-0" style={{ backgroundColor: endColor.hex }}></div>
                          <div className="flex gap-2">
                              <LCHInput val={endOk.l} label="L" max={1} onChange={(v) => updateEnd(v, endOk.c, endOk.h)} />
                              <LCHInput val={endOk.c} label="C" max={0.4} onChange={(v) => updateEnd(endOk.l, v, endOk.h)} />
                              <LCHInput val={endOk.h} label="H" max={360} onChange={(v) => updateEnd(endOk.l, endOk.c, v)} />
                          </div>
                      </div>

                  </div>
              </div>
          </div>
      );
  };

  const Header = () => (
    <div className="h-16 px-6 border-b border-border flex justify-between items-center shrink-0 bg-card z-10">
      <div>
        <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
            <span className="w-2 h-6 bg-gradient-to-b from-indigo-400 to-pink-500 rounded-sm"></span>
            Palette Tuner
        </h2>
        <p className="text-xs text-muted-foreground mt-0.5">Refine your scales using perceptual interpolation.</p>
      </div>
      <div className="flex gap-4 items-center">
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition p-2 bg-secondary rounded-full hover:bg-accent">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
      </div>
    </div>
  );

  // Helper to determine badge style
  const getBadgeStyle = (mode: TuneMode) => {
      switch(mode) {
          case 'oklch': return 'bg-accent text-foreground border-primary';
          case 'linear': return 'bg-accent text-muted-foreground border-border';
          case 'lumfit': return 'bg-orange-500/20 text-orange-300 border-orange-500/30';
          default: return 'bg-accent text-foreground border-primary';
      }
  };

  const getBadgeLabel = (mode: TuneMode) => {
      switch(mode) {
          case 'oklch': return 'OK';
          case 'linear': return 'LIN';
          case 'lumfit': return 'FIT';
          default: return 'OK';
      }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-background flex flex-col animate-in fade-in duration-200">
        <Header />

        {currentStep === 'input' ? (
            // --- STATE A: INPUT MODE ---
            <div className="flex-1 flex flex-col items-center justify-center p-6 bg-muted">
                <div className="w-full max-w-2xl animate-in slide-in-from-bottom-4 duration-500">
                    <div className="mb-8 text-center">
                        <h3 className="text-3xl font-bold text-foreground mb-3">Fix Your Palette</h3>
                        <p className="text-muted-foreground text-lg">Paste your color codes, JSON tokens, or CSS variables below.</p>
                    </div>

                    <div className="bg-background border border-border rounded-2xl shadow-2xl p-2 relative group focus-within:border-primary transition-colors">
                        <textarea 
                            className="w-full h-64 bg-muted rounded-xl p-6 pb-16 text-sm font-mono text-muted-foreground focus:outline-none resize-none placeholder:text-muted-foreground leading-relaxed custom-scrollbar"
                            placeholder='e.g. { "primary": { "500": "#3b82f6", "600": "#2563eb" } } or #3b82f6 #1e40af'
                            value={inputText}
                            onChange={(e) => setInputText(e.target.value)}
                            autoFocus
                        />
                        <div className="absolute bottom-4 left-4 flex gap-2">
                             <button onClick={handleExampleLoad} className="px-4 py-2 text-xs font-bold text-muted-foreground hover:text-foreground bg-card border border-border rounded-lg transition-colors">Load Example</button>
                             <button onClick={() => fileInputRef.current?.click()} className="px-4 py-2 text-xs font-bold text-muted-foreground hover:text-foreground bg-card border border-border rounded-lg transition-all">Upload File</button>
                        </div>
                        <div className="absolute bottom-4 right-4">
                             <button 
                                onClick={handleStartTuning} 
                                disabled={!hasData}
                                className={`px-6 py-2 text-sm font-bold text-primary-foreground rounded-lg shadow-lg transition-all flex items-center gap-2 ${hasData ? 'bg-primary hover:opacity-90 shadow-none' : 'bg-secondary text-muted-foreground cursor-not-allowed'}`}
                             >
                                Analyze & Tune
                             </button>
                        </div>
                    </div>
                    <input type="file" ref={fileInputRef} className="hidden" accept=".json,.js,.ts,.css,.scss,.txt" onChange={handleFileUpload} />
                </div>
            </div>
        ) : (
            // --- STATE B: TUNER DASHBOARD ---
            <div className="flex flex-col md:flex-row flex-1 min-h-0 relative">
                
                {/* Overlay Editor (When Open) */}
                {isEditorOpen && <LinearEditorOverlay />}

                {/* Left: Sidebar */}
                <div className="w-full md:w-80 lg:w-96 bg-card border-r border-border flex flex-col z-20 shadow-xl">
                    <div className="p-4 border-b border-border flex-1 overflow-y-auto custom-scrollbar">
                        <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block mb-2">Detected Scales ({parsedGroups.length})</label>
                        <div className="space-y-1">
                            {parsedGroups.map((group, idx) => {
                                const mode = groupModes[idx] || 'oklch';
                                return (
                                    <button
                                        key={idx}
                                        onClick={() => setActiveGroupIndex(idx)}
                                        className={`w-full text-left px-4 py-3 rounded-lg flex items-center justify-between group transition-all duration-200 border ${
                                            activeGroupIndex === idx 
                                            ? 'bg-primary border-primary text-primary-foreground shadow-lg' 
                                            : 'hover:bg-secondary border-transparent text-muted-foreground hover:text-foreground'
                                        }`}
                                    >
                                        <div className="flex items-center min-w-0">
                                            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border mr-3 uppercase tracking-wider shrink-0 ${activeGroupIndex === idx ? 'bg-white/20 text-foreground border-white/30' : getBadgeStyle(mode)}`}>
                                                {getBadgeLabel(mode)}
                                            </span>
                                            <span className="text-xs font-bold truncate">{group.name}</span>
                                        </div>
                                        <div className="flex -space-x-1.5 shrink-0 ml-2">
                                            {group.colors.slice(0, 3).map((c, i) => (
                                                <div key={i} className="w-2.5 h-2.5 rounded-full border border-slate-900 ring-1 ring-border" style={{ backgroundColor: c.hex }}></div>
                                            ))}
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* Right: Work Area */}
                <div className="flex-1 flex flex-col bg-muted overflow-y-auto custom-scrollbar p-6 lg:p-12">
                    <div className="max-w-5xl mx-auto w-full space-y-10 pb-20">
                        
                        {/* Control Bar */}
                        <div className="flex flex-col md:flex-row justify-between items-center bg-card backdrop-blur-md p-4 rounded-2xl border border-border shadow-xl gap-4">
                            <div className="flex items-center gap-4">
                                <div>
                                    <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest block mb-1">Active Group</span>
                                    <h3 className="text-xl font-bold text-foreground">{parsedGroups[activeGroupIndex].name}</h3>
                                </div>
                                <div className="h-8 w-px bg-white/10"></div>
                                <div className="flex items-center gap-2">
                                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Correction Algorithm:</span>
                                    <div className="flex bg-background p-1 rounded-lg border border-border">
                                        {(['oklch', 'lumfit', 'linear'] as TuneMode[]).map((m) => (
                                            <button
                                                key={m}
                                                onClick={() => handleModeChange(m)}
                                                className={`px-3 py-1.5 text-[10px] font-bold uppercase rounded-md transition-all ${
                                                    activeMode === m 
                                                    ? 'bg-primary text-primary-foreground shadow-sm' 
                                                    : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
                                                }`}
                                            >
                                                {m === 'oklch' ? 'OKLCH Smooth' : m === 'lumfit' ? 'Luminance Fit' : 'Linear'}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                            
                            <div className="flex gap-2">
                                <button 
                                    onClick={() => setIsEditorOpen(true)}
                                    className={`px-6 py-3 rounded-xl text-sm font-bold transition-all flex items-center gap-2 bg-primary text-primary-foreground shadow-lg shadow-none hover:opacity-90`}
                                >
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                                    Edit Interpolation
                                </button>
                            </div>
                        </div>

                        {/* Result Preview */}
                        <div>
                            {/* Ghost Curve Graph */}
                            <div className="mb-6">
                                <ComparisonGraph input={activeColors} output={tunedColors} />
                            </div>

                            {/* Before / After Strips */}
                            <div className="space-y-4">
                                <div>
                                    <span className="text-[10px] font-bold text-red-400 uppercase tracking-widest block mb-2 opacity-70">Original Input</span>
                                    <div className="flex h-12 rounded-lg overflow-hidden border border-red-500/20 opacity-70 grayscale-[0.3]">
                                        {activeColors.map((c, i) => (
                                            <div key={i} className="flex-1 relative group flex flex-col justify-end pb-2 items-center" style={{ backgroundColor: c.hex }}>
                                                <span className="text-[9px] font-mono text-white mix-blend-difference opacity-0 group-hover:opacity-100 transition-opacity">{Math.round(c.hsl.l)}%</span>
                                            </div>
                                        ))}
                                        {activeColors.length === 0 && <div className="w-full bg-card flex items-center justify-center text-xs text-muted-foreground">No Data</div>}
                                    </div>
                                </div>

                                <div>
                                    <div className="flex justify-between mb-2 px-1">
                                        <span className="text-[10px] font-bold text-green-400 uppercase tracking-widest">Generated Scale ({tunedColors.length} Steps)</span>
                                    </div>
                                    <div className="flex h-24 rounded-xl overflow-hidden shadow-2xl ring-1 ring-border bg-background border border-green-500/20">
                                        {tunedColors.map((c, i) => (
                                            <div key={i} className="flex-1 relative group flex flex-col justify-end pb-4 items-center transition-all hover:flex-[1.5]" style={{ backgroundColor: c.hex }}>
                                                <span className="text-[10px] font-mono font-bold text-white mix-blend-overlay opacity-60 group-hover:opacity-100 transition-opacity translate-y-2 group-hover:translate-y-0">{c.hsl.l}%</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Export Bar */}
                        <div className="fixed bottom-0 right-0 left-0 md:left-80 lg:left-96 bg-card/90 backdrop-blur-md border-t border-border p-6 flex justify-end gap-4 z-40">
                            <button 
                                onClick={handleExportAllClick}
                                className="bg-primary hover:opacity-90 text-primary-foreground px-8 py-3 rounded-xl font-bold shadow-xl shadow-none transition-all"
                            >
                                Export All
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        )}

        {/* Embedded Export Modal */}
        {exportGroups && (
            <ExportModal 
                groups={exportGroups} 
                onClose={() => setExportGroups(null)} 
            />
        )}
    </div>
  );
};

export default PaletteTunerModal;
