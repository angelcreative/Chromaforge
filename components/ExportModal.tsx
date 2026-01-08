
import React, { useState, useMemo } from 'react';
import { ColorData, ExportFormat, ColorGroup } from '../types';
import { 
    exportToCSS, exportToSCSS, exportToTailwind, exportToJSON, exportToFigma, exportToProcreate, createASE,
    exportGroupsToCSS, exportGroupsToSCSS, exportGroupsToTailwind, exportGroupsToJSON, exportGroupsToFigma, createGroupsASE
} from '../utils/exporters';
import { HiX, HiDownload, HiClipboardCopy, HiCheck } from 'react-icons/hi';

interface ExportModalProps {
  paletteName?: string;
  groups?: ColorGroup[]; // For Tuner
  brandPalette?: ColorData[]; // For App
  neutralPalette?: ColorData[]; // For App
  semanticPalette?: ColorData[]; // For App
  onClose: () => void;
  usageCount?: number;
  limit?: number;
  isPremium?: boolean;
}

const ExportModal: React.FC<ExportModalProps> = ({ paletteName, groups, brandPalette, neutralPalette, semanticPalette, onClose, usageCount, limit, isPremium }) => {
  const [format, setFormat] = useState<ExportFormat>('css');
  const [copied, setCopied] = useState(false);

  const isBinaryFormat = format === 'ase';
  
  const isSystemExport = !!(brandPalette && neutralPalette && semanticPalette);
  const allSystemColors = useMemo(() => {
      return isSystemExport ? [...brandPalette!, ...neutralPalette!, ...semanticPalette!] : [];
  }, [brandPalette, neutralPalette, semanticPalette, isSystemExport]);


  const getCode = (): string => {
    // Mode A: Full Design System Export
    if (isSystemExport) {
        switch (format) {
            case 'css': return exportToCSS(allSystemColors);
            case 'scss': return exportToSCSS(allSystemColors);
            case 'tailwind': return exportToTailwind(allSystemColors);
            case 'json': return exportToJSON(allSystemColors);
            case 'figma': return exportToFigma(paletteName || "Design Tokens", brandPalette!, neutralPalette!, semanticPalette!);
            case 'procreate': return exportToProcreate(allSystemColors, paletteName || 'Palette');
            default: return '';
        }
    }
    // Mode B: Tuned Groups (Scale Export)
    else if (groups && groups.length > 0) {
        switch (format) {
            case 'css': return exportGroupsToCSS(groups);
            case 'scss': return exportGroupsToSCSS(groups);
            case 'tailwind': return exportGroupsToTailwind(groups);
            case 'json': return exportGroupsToJSON(groups);
            case 'figma': return exportGroupsToFigma(groups);
            default: return '';
        }
    }
    return '';
  };

  const code = isBinaryFormat ? "Binary file (Adobe Swatch Exchange). Click Download." : getCode();
  const displayName = paletteName || (groups ? "Tuned Scales" : "Design Tokens");

  const handleCopy = () => {
    if (isBinaryFormat) return; // Cannot copy binary
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    let blob: Blob;
    let ext = format as string;

    if (format === 'ase') {
        let buffer: Uint8Array;
        if (isSystemExport) {
            buffer = createASE(allSystemColors, paletteName || "Palette");
        } else if (groups && groups.length > 0) {
            buffer = createGroupsASE(groups);
        } else {
            return;
        }
        blob = new Blob([buffer], { type: 'application/octet-stream' });
    } else {
        blob = new Blob([code], { type: 'text/plain' });
        if (format === 'json' || format === 'figma') ext = 'json';
        else if (format === 'tailwind') ext = 'js';
        else if (format === 'procreate') ext = 'swatches';
    }

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const sanitizedName = displayName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    a.download = `${sanitizedName}.${ext}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-3xl shadow-2xl flex flex-col max-h-[90vh]">
        
        <div className="p-6 border-b border-white/5 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
                Export Palette
                {!isPremium && usageCount !== undefined && limit !== undefined && (
                    <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded border ${usageCount >= limit ? 'border-red-500/30 text-red-400 bg-red-500/10' : 'border-slate-700 text-slate-500'}`}>
                        {usageCount}/{limit}
                    </span>
                )}
            </h2>
            <p className="text-xs text-slate-500 font-mono mt-1">{displayName}</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition">
            <HiX className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 flex-1 overflow-hidden flex flex-col">
          {/* Tabs */}
          <div className="flex flex-wrap gap-2 mb-4 bg-slate-950/50 p-1 rounded-lg w-full border border-white/5">
            {(['css', 'scss', 'tailwind', 'json', 'figma', 'ase', 'procreate'] as ExportFormat[]).map(f => {
                if (groups && f === 'procreate') return null;
                
                return (
                  <button
                    key={f}
                    onClick={() => setFormat(f)}
                    className={`px-3 py-1.5 rounded-md text-xs md:text-sm font-medium transition-all uppercase ${
                      format === f 
                      ? 'bg-indigo-600 text-white shadow-md' 
                      : 'text-slate-400 hover:text-white hover:bg-slate-800'
                    }`}
                  >
                    {f}
                  </button>
                );
            })}
          </div>

          {/* Content Area */}
          <div className="relative flex-1 bg-slate-950 rounded-lg border border-slate-800 overflow-hidden group flex flex-col min-h-[300px]">
            
            {isBinaryFormat ? (
                 <div className="flex-1 flex flex-col items-center justify-center p-6 text-center animate-in fade-in zoom-in-95 duration-300">
                     <div className="w-20 h-20 bg-slate-900/50 rounded-3xl flex items-center justify-center mb-6 border border-slate-800 shadow-2xl ring-1 ring-white/5 group-hover:scale-110 transition-transform duration-500">
                        <HiDownload className="w-10 h-10 text-indigo-400 drop-shadow-[0_0_15px_rgba(99,102,241,0.5)]" />
                     </div>
                     <h3 className="text-white font-bold text-xl mb-2 tracking-tight">Adobe Swatch Exchange (.ASE)</h3>
                     <p className="text-slate-500 text-sm mb-8 max-w-[280px] leading-relaxed">
                        Binary format compatible with Adobe Photoshop, Illustrator, and InDesign.
                     </p>
                     <button 
                        onClick={handleDownload}
                        className="bg-indigo-600 hover:bg-indigo-500 text-white px-8 py-3.5 rounded-xl font-bold text-sm shadow-xl shadow-indigo-500/20 transition-all flex items-center gap-3 transform hover:-translate-y-0.5 active:translate-y-0 active:scale-95 border border-indigo-400/20"
                     >
                        <HiDownload className="w-5 h-5" />
                        Download .ASE File
                     </button>
                 </div>
            ) : (
                <>
                    <pre className="p-4 text-xs md:text-sm font-mono text-slate-300 overflow-auto h-full scrollbar-thin scrollbar-thumb-slate-700 custom-scrollbar">
                    {code}
                    </pre>

                    <div className="absolute top-3 right-3 flex gap-2">
                        <button 
                        onClick={handleDownload}
                        className="bg-slate-800/90 backdrop-blur-sm hover:bg-slate-700 text-white px-3 py-1.5 rounded-lg text-xs font-medium border border-slate-700 shadow-lg transition-all flex items-center gap-2"
                        title="Download File"
                        >
                        <HiDownload className="w-4 h-4" />
                        Download
                        </button>
                        <button 
                        onClick={handleCopy}
                        className="bg-slate-800/90 backdrop-blur-sm hover:bg-slate-700 text-white px-3 py-1.5 rounded-lg text-xs font-medium border border-slate-700 shadow-lg transition-all flex items-center gap-2"
                        >
                        {copied ? (
                            <>
                            <HiCheck className="w-4 h-4 text-green-400" />
                            Copied!
                            </>
                        ) : (
                            <>
                            <HiClipboardCopy className="w-4 h-4" />
                            Copy
                            </>
                        )}
                        </button>
                    </div>
                </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExportModal;
