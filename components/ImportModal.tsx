
import React, { useState, useRef, useEffect } from 'react';
import { ColorData } from '../types';
import { extractColorsFromImage, parseInputToGroups } from '../utils/colorUtils';

interface ImportModalProps {
  onClose: () => void;
  onImport: (colors: ColorData[]) => void;
  limit?: number;
  isPremium?: boolean;
}

type Tab = 'image' | 'code';

interface SelectableColor {
    data: ColorData;
    selected: boolean;
}

const ImportModal: React.FC<ImportModalProps> = ({ onClose, onImport, limit = 5, isPremium = false }) => {
  const [activeTab, setActiveTab] = useState<Tab>('image');
  const [inputText, setInputText] = useState('');
  
  // New state: List of colors with selection status
  const [colorSelection, setColorSelection] = useState<SelectableColor[]>([]);
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [limitWarning, setLimitWarning] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Helper to init selection respecting limits
  const initializeSelection = (colors: ColorData[]) => {
      const newSelection = colors.map((c, i) => ({
          data: c,
          // Select first N items up to limit
          selected: i < limit
      }));
      setColorSelection(newSelection);
  };

  // --- Image Handling ---
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      
      setIsProcessing(true);
      const reader = new FileReader();
      reader.onload = async (ev) => {
          if (typeof ev.target?.result === 'string') {
              try {
                  // Extract slightly more than needed to give user choice
                  const colors = await extractColorsFromImage(ev.target.result, 12);
                  initializeSelection(colors);
              } catch (err) {
                  console.error("Failed to extract colors", err);
              }
          }
          setIsProcessing(false);
      };
      reader.readAsDataURL(file);
  };

  const handleToggleSelection = (index: number) => {
      setLimitWarning(null);
      const currentSelectedCount = colorSelection.filter(c => c.selected).length;
      const target = colorSelection[index];

      // Case: Selecting a new item
      if (!target.selected) {
          if (currentSelectedCount >= limit) {
              // Limit reached visual feedback
              setLimitWarning(`Limit reached (${limit}). Deselect a color first.`);
              return;
          }
      }

      const updated = [...colorSelection];
      updated[index] = { ...target, selected: !target.selected };
      setColorSelection(updated);
  };

  const handleImportAction = () => {
      const selectedColors = colorSelection.filter(c => c.selected).map(c => c.data);
      if (selectedColors.length > 0) {
          onImport(selectedColors);
      }
  };

  // --- Code Handling ---
  const handleProcessCode = () => {
      const groups = parseInputToGroups(inputText);
      let allColors: ColorData[] = [];
      groups.forEach(g => {
          allColors = [...allColors, ...g.colors];
      });
      
      // Fallback
      if (allColors.length === 0) {
          const rawGroups = parseInputToGroups(`{ "colors": ${inputText} }`); 
          if(rawGroups.length > 0 && rawGroups[0].colors.length > 0) {
               allColors = rawGroups[0].colors;
          }
      }

      if (allColors.length > 0) {
          initializeSelection(allColors.slice(0, 30)); // Cap total processed for performance
      }
  };

  const selectedCount = colorSelection.filter(c => c.selected).length;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        
        <div className="p-6 border-b border-white/5 flex justify-between items-center shrink-0">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
              Import Colors
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition p-2 bg-slate-800 rounded-full">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <div className="p-1 mx-6 mt-6 bg-slate-950 rounded-lg flex border border-white/5 shrink-0">
            <button 
                onClick={() => { setActiveTab('image'); setColorSelection([]); setInputText(''); }} 
                className={`flex-1 py-2 text-xs font-bold uppercase tracking-wider rounded-md transition-all ${activeTab === 'image' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:text-white'}`}
            >
                From Image
            </button>
            <button 
                onClick={() => { setActiveTab('code'); setColorSelection([]); setInputText(''); }} 
                className={`flex-1 py-2 text-xs font-bold uppercase tracking-wider rounded-md transition-all ${activeTab === 'code' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:text-white'}`}
            >
                From Code
            </button>
        </div>

        <div className="p-6 flex-1 overflow-y-auto custom-scrollbar flex flex-col">
            
            {/* INITIAL UPLOAD STATES */}
            {colorSelection.length === 0 && (
                <div className="flex flex-col gap-4 h-full">
                    {activeTab === 'image' ? (
                        <div 
                            className="flex-1 border-2 border-dashed border-slate-700 rounded-xl flex flex-col items-center justify-center text-slate-500 hover:border-indigo-500/50 hover:bg-indigo-500/5 transition-all cursor-pointer min-h-[200px]"
                            onClick={() => fileInputRef.current?.click()}
                        >
                            <input 
                                type="file" 
                                ref={fileInputRef} 
                                className="hidden" 
                                accept="image/*" 
                                onChange={handleFileChange} 
                            />
                            {isProcessing ? (
                                <div className="animate-spin w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full mb-2"></div>
                            ) : (
                                <svg className="w-10 h-10 mb-3 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                            )}
                            <p className="text-sm font-medium">Click to upload screenshot</p>
                            <p className="text-[10px] mt-1 opacity-60">We'll extract the dominant colors</p>
                        </div>
                    ) : (
                        <div className="flex flex-col gap-4 h-full">
                            <p className="text-xs text-slate-400">
                                Paste <b>Figma Variables JSON</b>, CSS, or Hex codes.
                            </p>
                            <textarea 
                                className="flex-1 bg-slate-950 border border-slate-700 rounded-xl p-3 text-xs font-mono text-slate-300 focus:outline-none focus:border-indigo-500 resize-none min-h-[200px]"
                                placeholder={`Example:\n{\n  "primary": "#3b82f6",\n  "surface": "#ffffff"\n}`}
                                value={inputText}
                                onChange={(e) => setInputText(e.target.value)}
                            />
                            <button 
                                onClick={handleProcessCode} 
                                disabled={!inputText.trim()} 
                                className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-indigo-500/20"
                            >
                                Extract Colors
                            </button>
                        </div>
                    )}
                </div>
            )}

            {/* SELECTION STATE */}
            {colorSelection.length > 0 && (
                <div className="flex flex-col gap-4 h-full animate-in fade-in duration-300">
                    <div className="flex justify-between items-end">
                        <span className="text-sm font-bold text-white">Select Colors</span>
                        <div className="flex items-center gap-2">
                            <span className={`text-xs font-bold ${limitWarning ? 'text-red-400 animate-pulse' : 'text-slate-400'}`}>
                                {limitWarning || `${selectedCount}/${limit}`}
                            </span>
                            {!isPremium && <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-500 border border-slate-700">Limit</span>}
                        </div>
                    </div>

                    <div className="grid grid-cols-4 sm:grid-cols-5 gap-3 overflow-y-auto pr-1 pb-2">
                        {colorSelection.map((item, i) => (
                            <div 
                                key={i} 
                                onClick={() => handleToggleSelection(i)}
                                className={`aspect-square rounded-xl shadow-sm cursor-pointer relative group transition-all duration-200 border-2 ${item.selected ? 'border-indigo-500 scale-100 opacity-100 ring-2 ring-indigo-500/30' : 'border-transparent scale-95 opacity-50 grayscale hover:grayscale-0 hover:opacity-80 hover:border-slate-600'}`}
                                style={{ backgroundColor: item.data.hex }}
                            >
                                {item.selected && (
                                    <div className="absolute -top-2 -right-2 bg-indigo-600 text-white rounded-full p-0.5 shadow-md">
                                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M5 13l4 4L19 7" /></svg>
                                    </div>
                                )}
                                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                    <span className="text-[9px] font-mono text-white font-bold bg-black/40 px-1 rounded backdrop-blur-sm">{item.data.hex}</span>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="mt-auto pt-4 border-t border-white/5 flex flex-col gap-3">
                        <button 
                            onClick={handleImportAction} 
                            disabled={selectedCount === 0}
                            className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-indigo-500/20"
                        >
                            Import {selectedCount} Selected
                        </button>
                        <button 
                            onClick={() => { setColorSelection([]); fileInputRef.current!.value = ''; setInputText(''); }}
                            className="text-xs text-slate-500 hover:text-white transition-colors self-center"
                        >
                            Cancel and start over
                        </button>
                    </div>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default ImportModal;
