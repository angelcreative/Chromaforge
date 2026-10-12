
import React from 'react';
import { Inbox, Library, Loader2, Trash2, X } from 'lucide-react';
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
                    <Library className="size-5" strokeWidth={1.5} />
                </span>
                Saved palettes
            </h2>
            <div className="flex items-center gap-2 mt-1">
                <p className="text-xs text-muted-foreground">Saved in this browser.</p>
            </div>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition p-2 bg-secondary rounded-full">
            <X className="size-5" strokeWidth={1.5} />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-6 custom-scrollbar">
            {isLoading ? (
                <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-4">
                    <Loader2 className="size-8 animate-spin text-foreground" strokeWidth={1.5} />
                    <p>Loading your palettes...</p>
                </div>
            ) : palettes.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-4 border-2 border-dashed border-border rounded-xl">
                    <div className="w-16 h-16 bg-card rounded-full flex items-center justify-center">
                        <Inbox className="size-8 opacity-50" strokeWidth={1.5} />
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
                                    className="text-muted-foreground hover:text-red-400 p-1"
                                    aria-label="Delete palette"
                                >
                                    <Trash2 className="size-4" strokeWidth={1.5} />
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
