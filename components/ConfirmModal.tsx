
import React from 'react';
import { ModalFrame, MotionButton, useExit } from './uiMotion';

interface ConfirmModalProps {
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmText?: string;
  isDestructive?: boolean;
}

const ConfirmModal: React.FC<ConfirmModalProps> = ({ 
    title, 
    message, 
    onConfirm, 
    onCancel, 
    confirmText = "Confirm", 
    isDestructive = false 
}) => {
  const { open, request, onExitComplete } = useExit(onCancel);
  return (
    <ModalFrame
      open={open}
      onExitComplete={onExitComplete}
      backdropClassName="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
      panelClassName="bg-card border border-border rounded-2xl w-full max-w-sm shadow-2xl p-6 relative overflow-hidden"
    >
        {/* Glow effect */}
        {isDestructive && <div className="absolute top-0 left-0 w-full h-1 bg-red-500"></div>}
        
        <h3 className="text-xl font-bold text-foreground mb-2">{title}</h3>
        <p className="text-sm text-muted-foreground mb-8 leading-relaxed">{message}</p>
        
        <div className="flex gap-3 justify-end">
          <MotionButton
            type="button"
            onClick={() => request()}
            className="px-4 py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground bg-secondary hover:bg-accent rounded-lg border border-transparent hover:border-border"
          >
            Cancel
          </MotionButton>
          <MotionButton
            type="button"
            onClick={() => request(onConfirm)}
            className={`px-6 py-2.5 text-sm font-medium rounded-lg transition-all flex items-center gap-2 ${
                isDestructive 
                ? 'bg-destructive text-white hover:opacity-90' 
                : 'bg-primary text-primary-foreground hover:opacity-90'
            }`}
          >
            {confirmText}
          </MotionButton>
        </div>
    </ModalFrame>
  );
};

export default ConfirmModal;
