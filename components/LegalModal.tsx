
import React from 'react';
import { legalContent } from '../utils/legalData';

export type LegalPageType = 'terms' | 'privacy' | 'cookies' | 'refunds';

interface LegalModalProps {
  type: LegalPageType | null;
  onClose: () => void;
}

const LegalModal: React.FC<LegalModalProps> = ({ type, onClose }) => {
  if (!type) return null;

  const data = legalContent[type];

  // Helper to render markdown-like bold text
  const renderContent = (text: string) => {
    return text.split('\n').map((line, i) => {
      if (line.trim() === '') return <div key={i} className="h-4"></div>;
      
      // Bold headers (**Text**)
      if (line.startsWith('**') && line.endsWith('**')) {
        return <h3 key={i} className="text-lg font-bold text-white mt-4 mb-2">{line.replace(/\*\*/g, '')}</h3>;
      }
      
      return <p key={i} className="text-slate-300 text-sm leading-relaxed mb-1">{line}</p>;
    });
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-2xl shadow-2xl flex flex-col max-h-[85vh] relative overflow-hidden">
        
        <div className="p-6 border-b border-white/5 flex justify-between items-start shrink-0 bg-slate-900 z-10">
          <div>
            <h2 className="text-2xl font-bold text-white">{data.title}</h2>
            <p className="text-xs text-slate-500 font-mono mt-1">{data.date}</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition p-2 bg-slate-800 rounded-full hover:bg-slate-700">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar bg-slate-950/50">
           {renderContent(data.content)}
        </div>
        
        <div className="p-4 border-t border-white/5 bg-slate-900 shrink-0 text-center">
            <button 
                onClick={onClose}
                className="px-6 py-2 bg-white text-slate-900 font-bold rounded-lg hover:bg-slate-200 transition-colors"
            >
                Close
            </button>
        </div>
      </div>
    </div>
  );
};

export default LegalModal;
