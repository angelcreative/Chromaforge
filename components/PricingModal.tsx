import React from 'react';
import { CREDIT_PACKS, formatCompact, FREE_CREDITS, generatedPaletteCredits, palettesCovered, type CreditPackId } from '../services/credits';
import { CloseButton } from './FloatingDrawer';
import { ModalFrame, MotionButton, useExit } from './uiMotion';

export type LimitType = 'save' | 'ai' | 'export' | 'tuner' | 'edit' | 'general';

interface PricingModalProps {
  onClose: () => void;
  onCheckout: (packId: CreditPackId) => void;
  isLoading: boolean;
  loadingPack?: CreditPackId | null;
  limitType?: LimitType;
  currentUsage?: number;
}

const PricingModal: React.FC<PricingModalProps> = ({ onClose, onCheckout, isLoading, loadingPack }) => {
  const { open, request, onExitComplete } = useExit(onClose);
  const paletteCost = generatedPaletteCredits();
  const coverage = CREDIT_PACKS.map((pack) => (
    `${formatCompact(pack.credits)} credits cover about ${palettesCovered(pack.credits)} palettes`
  )).join('. ');
  return (
    <ModalFrame
      open={open}
      onExitComplete={onExitComplete}
      backdropClassName="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4"
      panelClassName="relative flex max-h-[90vh] min-h-0 w-full max-w-md flex-col overflow-hidden rounded-2xl bg-card text-foreground shadow-panel ring-1 ring-border"
    >
        <CloseButton onClick={() => request()} className="absolute top-3 right-3 z-20" />
        <div className="min-h-0 flex-auto overflow-y-auto p-6">
          <h2 className="text-xl font-medium">Credits</h2>
          <p className="mt-1 text-[13px] leading-relaxed text-muted-foreground">
            A new visitor gets {FREE_CREDITS} free credits on a network, about {palettesCovered(FREE_CREDITS)} palettes. After that, an account can buy a pack. A generated palette costs about {paletteCost} credits. {coverage}. Manual edits do not use credits.
          </p>
          <div className="mt-4 flex flex-col gap-2">
            {CREDIT_PACKS.map((pack) => (
              <MotionButton
                key={pack.id}
                type="button"
                onClick={() => onCheckout(pack.id)}
                disabled={isLoading}
                aria-label={`${pack.exactCredits} credits, ${pack.priceLabel}`}
                className="flex h-12 items-center justify-between rounded-xl bg-primary px-4 text-[15px] text-primary-foreground hover:opacity-90 disabled:opacity-40"
              >
                <span>{formatCompact(pack.credits)} credits</span>
                <span>{isLoading && loadingPack === pack.id ? '…' : pack.priceLabel}</span>
              </MotionButton>
            ))}
          </div>
          {isLoading && (
            <p className="mt-3 text-[13px] text-muted-foreground" role="status">
              Connecting to secure checkout… Do not close this window.
            </p>
          )}
        </div>
    </ModalFrame>
  );
};

export default PricingModal;
