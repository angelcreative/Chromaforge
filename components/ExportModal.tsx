
import { Check, Copy, Download, X } from 'lucide-react';
import React, { useState, useMemo } from 'react';
import { ColorData, ExportFormat, ColorGroup, GlobalCurveConfig } from '../types';
import { 
    exportToCSS, exportToSCSS, exportToTailwind, exportToJSON, exportToFigma, exportToProcreate, createASE,
    exportGroupsToCSS, exportGroupsToSCSS, exportGroupsToTailwind, exportGroupsToJSON, exportGroupsToFigma, createGroupsASE
} from '../utils/exporters';
import { buildGroupsColorSkill, buildStudioColorSkill } from '../utils/colorSkill';

interface ExportModalProps {
  paletteName?: string;
  groups?: ColorGroup[]; // For Tuner
  brandPalette?: ColorData[]; // For App
  neutralPalette?: ColorData[]; // For App
  semanticPalette?: ColorData[]; // For App
  onClose: () => void;
  globalConfig?: GlobalCurveConfig;
}

const FORMAT_LABELS: Partial<Record<ExportFormat, string>> = {
  skill: 'color.md',
};

const ExportModal: React.FC<ExportModalProps> = ({ paletteName, groups, brandPalette, neutralPalette, semanticPalette, onClose, globalConfig }) => {
  const [format, setFormat] = useState<ExportFormat>('skill');
  const [copied, setCopied] = useState(false);

  const isBinaryFormat = format === 'ase';
  
  const isSystemExport = !!(brandPalette && neutralPalette && semanticPalette);
  const allSystemColors = useMemo(() => {
      return isSystemExport ? [...brandPalette!, ...neutralPalette!, ...semanticPalette!] : [];
  }, [brandPalette, neutralPalette, semanticPalette, isSystemExport]);


  const getCode = (): string => {
    if (format === 'skill') {
      if (isSystemExport) {
        return buildStudioColorSkill({
          paletteName: paletteName || 'Design Tokens',
          brand: brandPalette!,
          neutrals: neutralPalette,
          semantic: semanticPalette,
          globalConfig,
        });
      }
      if (groups && groups.length > 0) {
        return buildGroupsColorSkill(paletteName || 'Tuned Scales', groups, globalConfig);
      }
      return '';
    }
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
        else if (format === 'skill') ext = 'md';
    }

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const sanitizedName = displayName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    a.download = format === 'skill' ? 'color.md' : `${sanitizedName}.${ext}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-card border border-border rounded-2xl w-full max-w-3xl shadow-2xl flex flex-col max-h-[90vh]">
        
        <div className="p-6 border-b border-border flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                Export palette
            </h2>
            <p className="text-xs text-muted-foreground font-mono mt-1">{displayName}</p>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition">
            <X className="w-6 h-6" strokeWidth={1.5}/>
          </button>
        </div>

        <div className="p-6 flex-1 overflow-hidden flex flex-col">
          {/* Tabs */}
          <div className="flex flex-wrap gap-2 mb-4 bg-muted p-1 rounded-lg w-full border border-border">
            {(['skill', 'css', 'scss', 'tailwind', 'json', 'figma', 'ase', 'procreate'] as ExportFormat[]).map(f => {
                if (groups && f === 'procreate') return null;
                
                return (
                  <button
                    key={f}
                    onClick={() => setFormat(f)}
                    className={`px-3 py-1.5 rounded-md text-xs md:text-sm font-medium transition-all ${f === 'skill' ? 'normal-case' : 'uppercase'} ${
                      format === f 
                      ? 'bg-primary text-primary-foreground shadow-md' 
                      : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
                    }`}
                  >
                    {FORMAT_LABELS[f] || f}
                  </button>
                );
            })}
          </div>

          {/* Content Area */}
          <div className="relative flex-1 bg-background rounded-lg border border-border overflow-hidden group flex flex-col min-h-[300px]">
            
            {isBinaryFormat ? (
                 <div className="flex-1 flex flex-col items-center justify-center p-6 text-center animate-in fade-in zoom-in-95 duration-300">
                     <div className="w-20 h-20 bg-muted rounded-3xl flex items-center justify-center mb-6 border border-border shadow-2xl ring-1 ring-white/5 group-hover:scale-110 transition-transform duration-500">
                        <Download className="w-10 h-10 text-foreground drop-shadow-[0_0_15px_rgba(99,102,241,0.5)]" strokeWidth={1.5}/>
                     </div>
                     <h3 className="text-foreground font-bold text-xl mb-2 tracking-tight">Adobe Swatch Exchange (.ASE)</h3>
                     <p className="text-muted-foreground text-sm mb-8 max-w-[280px] leading-relaxed">
                        Binary format compatible with Adobe Photoshop, Illustrator, and InDesign.
                     </p>
                     <button 
                        onClick={handleDownload}
                        className="bg-primary hover:opacity-90 text-primary-foreground px-8 py-3.5 rounded-xl font-bold text-sm shadow-xl shadow-none transition-all flex items-center gap-3 transform hover:-translate-y-0.5 active:translate-y-0 active:scale-95 "
                     >
                        <Download className="w-5 h-5" strokeWidth={1.5}/>
                        Download .ASE File
                     </button>
                 </div>
            ) : (
                <>
                    <pre className="p-4 text-xs md:text-sm font-mono text-muted-foreground overflow-auto h-full scrollbar-thin scrollbar-thumb-slate-700 custom-scrollbar">
                    {code}
                    </pre>

                    <div className="absolute top-3 right-3 flex gap-2">
                        <button 
                        onClick={handleDownload}
                        className="bg-secondary backdrop-blur-sm hover:bg-accent text-foreground px-3 py-1.5 rounded-lg text-xs font-medium border border-border shadow-lg transition-all flex items-center gap-2"
                        title="Download File"
                        >
                        <Download className="w-4 h-4" strokeWidth={1.5}/>
                        Download
                        </button>
                        <button 
                        onClick={handleCopy}
                        className="bg-secondary backdrop-blur-sm hover:bg-accent text-foreground px-3 py-1.5 rounded-lg text-xs font-medium border border-border shadow-lg transition-all flex items-center gap-2"
                        >
                        {copied ? (
                            <>
                            <Check className="w-4 h-4 text-green-400" strokeWidth={1.5}/>
                            Copied!
                            </>
                        ) : (
                            <>
                            <Copy className="w-4 h-4" strokeWidth={1.5}/>
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
