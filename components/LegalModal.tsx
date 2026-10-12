
import { AnimatePresence, motion } from 'motion/react';
import React from 'react';
import { X } from 'lucide-react';
import { legalContent } from '../utils/legalData';
import { MotionButton, presenceFade, uiTransition, useReduced } from './uiMotion';

export type LegalPageType = 'terms' | 'privacy' | 'cookies' | 'refunds';

interface LegalModalProps {
  type: LegalPageType | null;
  onClose: () => void;
}

const LegalModal: React.FC<LegalModalProps> = ({ type, onClose }) => {
  const reduce = useReduced();
  const data = type ? legalContent[type] : null;

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
    <AnimatePresence>
    {type && data && (
    <motion.div key={type} className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-md p-4" {...presenceFade(reduce)}>
      <motion.div
        className="relative flex min-h-0 max-h-[85vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-2xl"
        initial={reduce ? false : { scale: 0.96 }}
        animate={{ scale: 1 }}
        exit={reduce ? { scale: 1 } : { scale: 0.98 }}
        transition={uiTransition(reduce)}
      >
        
        <div className="p-6 border-b border-border flex justify-between items-start shrink-0 bg-card z-10">
          <div>
            <h2 className="text-2xl font-bold text-foreground">{data.title}</h2>
            <p className="text-xs text-muted-foreground font-mono mt-1">{data.date}</p>
          </div>
          <MotionButton type="button" onClick={onClose} className="text-muted-foreground hover:text-foreground p-2 bg-secondary rounded-full hover:bg-accent">
            <X className="size-5" strokeWidth={1.5} />
          </MotionButton>
        </div>

        <div className="min-h-0 flex-auto overflow-y-auto bg-muted p-6 custom-scrollbar">
           {renderContent(data.content)}
        </div>
        
        <div className="p-4 border-t border-border bg-card shrink-0 text-center">
            <MotionButton 
                type="button"
                onClick={onClose}
                className="px-6 py-2 bg-primary text-primary-foreground font-bold rounded-lg hover:opacity-90"
            >
                Close
            </MotionButton>
        </div>
      </motion.div>
    </motion.div>
    )}
    </AnimatePresence>
  );
};

export default LegalModal;
