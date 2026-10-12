
import React from 'react';
import { X } from 'lucide-react';
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
        return <h3 key={i} className="text-lg font-bold text-foreground mt-4 mb-2">{line.replace(/\*\*/g, '')}</h3>;
      }
      
      return <p key={i} className="text-muted-foreground text-sm leading-relaxed mb-1">{line}</p>;
    });
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="bg-card border border-border rounded-2xl w-full max-w-2xl shadow-2xl flex flex-col max-h-[85vh] relative overflow-hidden">
        
        <div className="p-6 border-b border-border flex justify-between items-start shrink-0 bg-card z-10">
          <div>
            <h2 className="text-2xl font-bold text-foreground">{data.title}</h2>
            <p className="text-xs text-muted-foreground font-mono mt-1">{data.date}</p>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition p-2 bg-secondary rounded-full hover:bg-accent">
            <X className="size-5" strokeWidth={1.5} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar bg-muted">
           {renderContent(data.content)}
        </div>
        
        <div className="p-4 border-t border-border bg-card shrink-0 text-center">
            <button 
                onClick={onClose}
                className="px-6 py-2 bg-primary text-primary-foreground font-bold rounded-lg hover:opacity-90 transition-colors"
            >
                Close
            </button>
        </div>
      </div>
    </div>
  );
};

export default LegalModal;
