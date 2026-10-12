import { X } from 'lucide-react';
import React from 'react';
import { CREDIT_PACKS, formatCompact, type CreditPackId } from '../services/credits';

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
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4">
      <div className="relative flex max-h-[90vh] min-h-0 w-full max-w-md flex-col overflow-hidden rounded-2xl bg-card text-foreground shadow-panel ring-1 ring-border">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-3 right-3 z-20 grid size-8 place-items-center rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground"
          aria-label="Close"
        >
          <X className="size-4" strokeWidth={1.5} />
        </button>
        <div className="min-h-0 flex-auto overflow-y-auto p-6">
          <h2 className="text-xl font-medium">Credits</h2>
          <p className="mt-1 text-[13px] text-muted-foreground">The editor stays free.</p>
          <div className="mt-4 flex flex-col gap-2">
            {CREDIT_PACKS.map((pack) => (
              <button
                key={pack.id}
                type="button"
                onClick={() => onCheckout(pack.id)}
                disabled={isLoading}
                aria-label={`${pack.exactCredits} credits, ${pack.priceLabel}`}
                className="flex h-12 items-center justify-between rounded-xl bg-primary px-4 text-[15px] text-primary-foreground hover:opacity-90 disabled:opacity-40"
              >
                <span>{formatCompact(pack.credits)} credits</span>
                <span>{isLoading && loadingPack === pack.id ? '…' : pack.priceLabel}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PricingModal;
