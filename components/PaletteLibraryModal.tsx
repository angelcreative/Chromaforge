
import React from 'react';
import { SavedPalette } from '../services/storageService';
import { ColorData } from '../types';

interface PaletteLibraryModalProps {
  palettes: SavedPalette[];
  isLoading: boolean;
  onClose: () => void;
  onLoadPalette: (palette: SavedPalette) => void;
  onDeletePalette: (id: string) => void;
  lifetimeSaves?: number;
  isPremium?: boolean;
}

const PaletteLibraryModal: React.FC<PaletteLibraryModalProps> = ({ 
    palettes, 
    isLoading, 
    onClose, 
    onLoadPalette, 
    onDeletePalette,
}) => {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="bg-card border border-border rounded-2xl w-full max-w-4xl shadow-2xl flex flex-col h-[80vh] relative overflow-hidden">
        
        <div className="p-6 border-b border-border flex justify-between items-center shrink-0">
          <div>
            <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                <span className="p-1.5 bg-accent rounded-lg text-foreground">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
                </span>
                My Saved Palettes
            </h2>
            <div className="flex items-center gap-2 mt-1">
                <p className="text-xs text-muted-foreground">Saved in this browser.</p>
            </div>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition p-2 bg-secondary rounded-full">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
            {isLoading ? (
                <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-4">
                    <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                    <p>Loading your palettes...</p>
                </div>
            ) : palettes.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-4 border-2 border-dashed border-border rounded-xl">
                    <div className="w-16 h-16 bg-card rounded-full flex items-center justify-center">
                        <svg className="w-8 h-8 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" /></svg>
                    </div>
                    <p className="text-sm">No saved palettes yet.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {palettes.map((palette) => (
                        <div key={palette.id} className="bg-background border border-border rounded-xl p-4 hover:border-primary transition-all group relative">
                            <div className="flex justify-between items-start mb-3">
                                <h3 className="font-bold text-foreground text-sm truncate pr-2">{palette.name}</h3>
                                <button 
                                    onClick={(e) => { e.stopPropagation(); onDeletePalette(palette.id); }}
                                    className="text-muted-foreground hover:text-red-400 p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                    title="Delete"
                                >
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                </button>
                            </div>
                            
                            <div className="flex h-12 rounded-lg overflow-hidden cursor-pointer ring-1 ring-white/5 mb-3" onClick={() => onLoadPalette(palette)}>
                                {palette.colors.slice(0, 5).map((c: ColorData, i: number) => (
                                    <div key={i} className="flex-1 h-full" style={{ backgroundColor: c.hex }}></div>
                                ))}
                            </div>
                            
                            <div className="flex justify-between items-center text-[10px] text-muted-foreground font-mono">
                                <span>{palette.colors.length} colors</span>
                                <button 
                                    onClick={() => onLoadPalette(palette)}
                                    className="text-foreground hover:text-foreground font-bold uppercase tracking-wider"
                                >
                                    Load
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default PaletteLibraryModal;
