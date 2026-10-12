
import React, { useState, useMemo } from 'react';
import { ColorData } from '../types';
import { generateShades } from '../utils/colorUtils';

interface GradientListProps {
  colors: ColorData[];
  onCopy: (text: string) => void;
}

const GradientList: React.FC<GradientListProps> = ({ colors, onCopy }) => {
  if (colors.length < 2) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh] text-muted-foreground gap-4 opacity-50 animate-in fade-in">
        <div className="w-20 h-20 rounded-full border-4 border-border border-t-slate-600 border-r-slate-600 animate-spin-slow"></div>
        <p>Add at least 2 colors to generate gradients.</p>
      </div>
    );
  }

  // Generate default sequential pairs
  const pairs = [];
  for (let i = 0; i < colors.length - 1; i++) {
    pairs.push({
      start: colors[i],
      end: colors[i + 1]
    });
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mt-4 pb-20">
      {pairs.map((pair, idx) => (
        <GradientCard 
            key={`${pair.start.hex}-${pair.end.hex}-${idx}`} 
            initialC1={pair.start} 
            initialC2={pair.end} 
            index={idx}
            onCopy={onCopy}
            allColors={colors}
        />
      ))}
    </div>
  );
};

const GradientCard: React.FC<{ 
    initialC1: ColorData, 
    initialC2: ColorData, 
    index: number, 
    onCopy: (t: string) => void,
    allColors: ColorData[]
}> = ({ initialC1, initialC2, index, onCopy, allColors }) => {
    // Config State
    const [angle, setAngle] = useState(90);
    
    // Stop 1 State
    const [color1Base, setColor1Base] = useState(initialC1);
    const [shade1Level, setShade1Level] = useState(500);
    const [stop1, setStop1] = useState(0);

    // Stop 2 State
    const [color2Base, setColor2Base] = useState(initialC2);
    const [shade2Level, setShade2Level] = useState(500);
    const [stop2, setStop2] = useState(100);

    // Helper to get exact hex for current selection
    const getHex = (base: ColorData, level: number) => {
        const shades = generateShades(base);
        return shades.find(s => s.level === level)?.hex || base.hex;
    };

    const hex1 = getHex(color1Base, shade1Level);
    const hex2 = getHex(color2Base, shade2Level);

    const gradientCSS = `linear-gradient(${angle}deg, ${hex1} ${stop1}%, ${hex2} ${stop2}%)`;
    
    const directions = [
        { deg: 0, label: '↑' },
        { deg: 180, label: '↓' },
        { deg: 270, label: '←' },
        { deg: 90, label: '→' },
    ];

    const shadeOptions = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950];

    const handleColorChange = (isStart: boolean, hex: string) => {
        const selected = allColors.find(c => c.hex === hex) || (isStart ? initialC1 : initialC2);
        if (isStart) setColor1Base(selected);
        else setColor2Base(selected);
    };

    return (
        <div className="bg-card rounded-2xl ring-1 ring-border overflow-hidden shadow-panel flex flex-col">
            
            {/* Gradient Preview Area */}
            <div 
                className="h-40 w-full relative cursor-pointer group/preview"
                style={{ background: gradientCSS }}
                onClick={() => onCopy(gradientCSS)}
            >
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover/preview:opacity-100 transition-opacity bg-black/20 backdrop-blur-[1px]">
                    <span className="bg-white/90 text-[#171717] px-3 py-1.5 rounded-lg text-xs font-medium shadow-lg transform scale-95 group-hover/preview:scale-100 transition-transform flex items-center gap-2">
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                        Copy CSS
                    </span>
                </div>
                {/* Visual Direction Indicator overlay */}
                <div className="absolute bottom-2 right-2 text-[10px] font-bold text-white/50 bg-black/20 px-2 py-1 rounded backdrop-blur-sm pointer-events-none">
                    {angle}°
                </div>
            </div>

            {/* Config Area */}
            <div className="p-5 flex-1 flex flex-col gap-4">
                
                {/* Header with Direction Controls */}
                <div className="flex justify-between items-start">
                    <div>
                        <h3 className="text-foreground font-bold text-base">Gradient {index + 1}</h3>
                        <p className="text-muted-foreground text-xs mt-0.5">Custom Blend</p>
                    </div>
                    <div className="flex bg-background p-0.5 rounded-lg border border-border items-center">
                        {directions.map(d => (
                            <button
                                key={d.deg}
                                onClick={() => setAngle(d.deg)}
                                className={`w-6 h-6 flex items-center justify-center rounded text-[10px] font-bold transition-all ${angle === d.deg ? 'bg-accent text-foreground shadow' : 'text-muted-foreground hover:text-foreground hover:bg-secondary'}`}
                                title={`${d.deg}deg`}
                            >
                                {d.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Stops Visualization (Fully Configurable) */}
                <div className="space-y-3">
                    <div className="flex justify-between items-center text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                        <span>Stops Configuration</span>
                        <span>%</span>
                    </div>
                    
                    {/* Stop 1 Config Row */}
                    <div className="flex items-center gap-2 p-2 rounded-lg bg-muted border border-border/50 hover:bg-background transition-colors group/stop">
                        {/* Position Input */}
                        <div className="relative w-10 shrink-0">
                            <input 
                                type="number" 
                                min="0" 
                                max="100" 
                                value={stop1}
                                onChange={(e) => setStop1(Number(e.target.value))}
                                className="w-full px-1 py-1 bg-secondary rounded text-[10px] font-mono text-muted-foreground text-center focus:outline-none focus:ring-1 focus:ring-primary border border-transparent focus:border-primary appearance-none"
                            />
                        </div>
                        
                        {/* Swatch Preview */}
                        <div className="w-6 h-6 rounded border border-border shadow-sm shrink-0" style={{ backgroundColor: hex1 }} />
                        
                        {/* Color Select */}
                        <select 
                            value={color1Base.hex} 
                            onChange={(e) => handleColorChange(true, e.target.value)}
                            className="flex-1 bg-transparent text-[10px] font-bold text-muted-foreground focus:outline-none cursor-pointer hover:text-foreground truncate"
                        >
                            {allColors.map(c => (
                                <option key={c.hex} value={c.hex} className="bg-card">{c.name}</option>
                            ))}
                        </select>

                        {/* Shade Select */}
                        <select 
                            value={shade1Level}
                            onChange={(e) => setShade1Level(Number(e.target.value))}
                            className="w-14 bg-secondary text-[10px] font-mono text-muted-foreground px-1 py-1 rounded focus:outline-none cursor-pointer hover:bg-accent text-right"
                        >
                            {shadeOptions.map(s => (
                                <option key={s} value={s} className="bg-card">{s}</option>
                            ))}
                        </select>
                    </div>

                    {/* Connector Line */}
                    <div className="pl-5 -my-2">
                        <div className="w-0.5 h-3 bg-secondary mx-auto"></div>
                    </div>

                    {/* Stop 2 Config Row */}
                    <div className="flex items-center gap-2 p-2 rounded-lg bg-muted border border-border/50 hover:bg-background transition-colors group/stop">
                        {/* Position Input */}
                        <div className="relative w-10 shrink-0">
                            <input 
                                type="number" 
                                min="0" 
                                max="100" 
                                value={stop2}
                                onChange={(e) => setStop2(Number(e.target.value))}
                                className="w-full px-1 py-1 bg-secondary rounded text-[10px] font-mono text-muted-foreground text-center focus:outline-none focus:ring-1 focus:ring-primary border border-transparent focus:border-primary appearance-none"
                            />
                        </div>
                        
                        {/* Swatch Preview */}
                        <div className="w-6 h-6 rounded border border-border shadow-sm shrink-0" style={{ backgroundColor: hex2 }} />
                        
                        {/* Color Select */}
                        <select 
                            value={color2Base.hex} 
                            onChange={(e) => handleColorChange(false, e.target.value)}
                            className="flex-1 bg-transparent text-[10px] font-bold text-muted-foreground focus:outline-none cursor-pointer hover:text-foreground truncate"
                        >
                            {allColors.map(c => (
                                <option key={c.hex} value={c.hex} className="bg-card">{c.name}</option>
                            ))}
                        </select>

                        {/* Shade Select */}
                        <select 
                            value={shade2Level}
                            onChange={(e) => setShade2Level(Number(e.target.value))}
                            className="w-14 bg-secondary text-[10px] font-mono text-muted-foreground px-1 py-1 rounded focus:outline-none cursor-pointer hover:bg-accent text-right"
                        >
                            {shadeOptions.map(s => (
                                <option key={s} value={s} className="bg-card">{s}</option>
                            ))}
                        </select>
                    </div>
                </div>

            </div>
        </div>
    );
}

export default GradientList;
