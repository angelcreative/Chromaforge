import React, { useState } from 'react';
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
    <div className="fixed inset-0 z-50 bg-slate-950 flex flex-col p-4 md:p-8 overflow-hidden animate-in fade-in duration-200">
      <div className="flex justify-between items-center mb-6 shrink-0">
        <div>
          <h2 className="text-2xl font-bold text-white">Contrast Grid ({color.name})</h2>
          <p className="text-slate-400">APCA / WCAG approx. matrix</p>
        </div>
        <button onClick={onClose} className="p-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700 transition">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
      </div>

      <div className="bg-slate-900 p-4 md:p-6 rounded-2xl shadow-xl overflow-auto flex-1 border border-slate-800 relative">
        <div className="min-w-[800px] w-full h-full flex flex-col">
            {/* Header Row */}
            <div className="flex w-full">
                <div className="w-16 shrink-0 h-10"></div> {/* Corner */}
                {scale.map((col) => (
                    <div key={`head-${col.level}`} className="flex-1 min-w-[3rem] h-10 flex items-center justify-center font-bold text-slate-400 text-xs md:text-sm">
                        {col.level === 0 ? 'W' : col.level === 1000 ? 'B' : col.level}
                    </div>
                ))}
            </div>

            {/* Grid Rows */}
            {scale.map((row) => (
                <div key={`row-${row.level}`} className="flex w-full flex-1 min-h-[3rem]">
                    {/* Row Label */}
                    <div className="w-16 shrink-0 flex items-center justify-center font-bold text-slate-400 text-xs md:text-sm">
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
                                className="flex-1 min-w-[3rem] flex items-center justify-center text-xs md:text-sm font-medium transition-transform hover:scale-105 hover:z-10 hover:shadow-xl rounded-sm relative cursor-default border border-transparent hover:border-white/10"
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
            className="fixed z-[60] pointer-events-none transform -translate-x-1/2 -translate-y-[110%] bg-slate-950 rounded-lg shadow-2xl border border-slate-700 p-3 min-w-[140px] animate-in fade-in zoom-in-95 duration-150"
            style={{ left: hoveredCell.x, top: hoveredCell.y }}
        >
            <div className="text-white font-bold text-lg mb-1 leading-tight">
                Ratio: {hoveredCell.ratio}
            </div>
            <div className="grid grid-cols-[30px_1fr] gap-x-2 text-xs font-mono">
                <span className="text-slate-500 font-bold">BG:</span> 
                <span className="text-white text-right">{hoveredCell.bgHex}</span>
                <span className="text-slate-500 font-bold">TXT:</span> 
                <span className="text-white text-right">{hoveredCell.txtHex}</span>
            </div>
        </div>
      )}
    </div>
  );
};

export default ContrastGrid;