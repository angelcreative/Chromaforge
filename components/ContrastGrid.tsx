import React, { useState } from 'react';
import { X } from 'lucide-react';
import { generateShades, getContrastRatio, getLuminance } from '../utils/colorUtils';
import { ColorData } from '../types';

interface ContrastGridProps {
  color: ColorData;
  onClose: () => void;
}

const ContrastGrid: React.FC<ContrastGridProps> = ({ color, onClose }) => {
  const [hoveredCell, setHoveredCell] = useState<{
    x: number;
    y: number;
    ratio: string;
    bgHex: string;
    txtHex: string;
  } | null>(null);

  const shades = generateShades(color);
  
  // Add Black and White to scales
  const scale = [
    { level: 0, hex: '#FFFFFF', lum: 1 }, 
    ...shades.map(s => {
        const rgb = parseInt(s.hex.slice(1), 16);
        const r = (rgb >> 16) & 255;
        const g = (rgb >> 8) & 255;
        const b = rgb & 255;
        return { level: s.level, hex: s.hex, lum: getLuminance(r, g, b) };
    }),
    { level: 1000, hex: '#000000', lum: 0 }
  ];

  const handleMouseEnter = (e: React.MouseEvent, ratio: string, bgHex: string, txtHex: string) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setHoveredCell({
      x: rect.left + rect.width / 2,
      y: rect.top,
      ratio,
      bgHex,
      txtHex
    });
  };

  const handleMouseLeave = () => {
    setHoveredCell(null);
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden px-4 pb-4 pt-4">
      <div className="mb-3 flex shrink-0 items-center justify-between gap-3">
        <div className="flex min-w-0 items-baseline gap-2">
          <h2 className="shrink-0 text-[13px] text-foreground">Contrast grid</h2>
          <span className="truncate text-[13px] text-muted-foreground">{color.name}</span>
        </div>
        <button onClick={onClose} className="inline-flex h-10 items-center gap-1.5 rounded-lg border border-border bg-card px-3 text-[13px] text-foreground hover:bg-accent">
          <X className="size-4" strokeWidth={1.5} />
          Close
        </button>
      </div>

      <div className="bg-card p-4 md:p-6 rounded-2xl shadow-xl overflow-auto flex-1 border border-border relative">
        <div className="min-w-[800px] w-full h-full flex flex-col">
            {/* Header Row */}
            <div className="flex w-full">
                <div className="w-16 shrink-0 h-10"></div> {/* Corner */}
                {scale.map((col) => (
                    <div key={`head-${col.level}`} className="flex-1 min-w-[3rem] h-10 flex items-center justify-center font-bold text-muted-foreground text-xs md:text-sm">
                        {col.level === 0 ? 'W' : col.level === 1000 ? 'B' : col.level}
                    </div>
                ))}
            </div>

            {/* Grid Rows */}
            {scale.map((row) => (
                <div key={`row-${row.level}`} className="flex w-full flex-1 min-h-[3rem]">
                    {/* Row Label */}
                    <div className="w-16 shrink-0 flex items-center justify-center font-bold text-muted-foreground text-xs md:text-sm">
                         {row.level === 0 ? 'W' : row.level === 1000 ? 'B' : row.level}
                    </div>

                    {/* Cells */}
                    {scale.map((col) => {
                        const ratio = getContrastRatio(row.lum, col.lum);
                        const ratioStr = ratio.toFixed(1);
                        const isPassAAA = ratio >= 7;
                        const isPassAA = ratio >= 4.5;
                        
                        return (
                            <div 
                                key={`${row.level}-${col.level}`}
                                className="flex-1 min-w-[3rem] flex items-center justify-center text-xs md:text-sm font-medium transition-transform hover:scale-105 hover:z-10 hover:shadow-xl rounded-sm relative cursor-default border border-transparent hover:border-border"
                                style={{ backgroundColor: row.hex, color: col.hex }}
                                onMouseEnter={(e) => handleMouseEnter(e, ratioStr, row.hex, col.hex)}
                                onMouseLeave={handleMouseLeave}
                            >
                                {ratioStr}
                                {isPassAAA && <span className="absolute bottom-1 right-1 w-1.5 h-1.5 bg-green-500 rounded-full shadow-sm ring-1 ring-black/20"/>}
                                {!isPassAAA && isPassAA && <span className="absolute bottom-1 right-1 w-1.5 h-1.5 bg-yellow-500 rounded-full shadow-sm ring-1 ring-black/20"/>}
                            </div>
                        );
                    })}
                </div>
            ))}
        </div>
      </div>
      
      {/* Fixed Tooltip Overlay */}
      {hoveredCell && (
        <div 
            className="fixed z-[60] pointer-events-none transform -translate-x-1/2 -translate-y-[110%] bg-background rounded-lg shadow-2xl border border-border p-3 min-w-[140px] animate-in fade-in zoom-in-95 duration-150"
            style={{ left: hoveredCell.x, top: hoveredCell.y }}
        >
            <div className="text-foreground font-bold text-lg mb-1 leading-tight">
                Ratio: {hoveredCell.ratio}
            </div>
            <div className="grid grid-cols-[30px_1fr] gap-x-2 text-xs font-mono">
                <span className="text-muted-foreground font-bold">BG:</span> 
                <span className="text-foreground text-right">{hoveredCell.bgHex}</span>
                <span className="text-muted-foreground font-bold">TXT:</span> 
                <span className="text-foreground text-right">{hoveredCell.txtHex}</span>
            </div>
        </div>
      )}
    </div>
  );
};

export default ContrastGrid;