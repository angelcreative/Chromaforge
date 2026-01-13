import React from 'react';
import { BaseCard, ThemeColors } from '../BaseComponents';
import { Button } from '../Molecules';
import { CreditCard as CreditCardIcon } from 'lucide-react';

export default function CreditCard({ theme }: { theme: ThemeColors }) {
  // Crear gradiente de púrpura a teal usando el color primario y un color complementario
  const primaryColor = theme.action.primary;
  const secondaryColor = theme.action.secondaryText || theme.action.primaryHover;
  
  return (
    <BaseCard
      theme={theme}
      className="p-6 relative overflow-hidden"
      style={{
        background: `linear-gradient(180deg, ${primaryColor} 0%, ${secondaryColor} 100%)`,
        color: 'white',
        width: '380px',
        maxWidth: '380px',
      }}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="text-xl font-bold mb-1 text-white">Sarah Williams</div>
          <div className="text-sm text-white/70">Premium Card</div>
        </div>
        <CreditCardIcon size={32} className="text-white" />
      </div>

      {/* Separator Line */}
      <div className="h-px bg-white/30 mb-6" />

      {/* Current Balance */}
      <div className="mb-6">
        <div className="text-sm text-white/80 mb-2">Current Balance</div>
        <div className="text-3xl font-bold text-white">$12,450.90</div>
      </div>

      {/* Transaction Section */}
      <div className="p-4 rounded-lg mb-4" style={{ backgroundColor: 'rgba(255, 255, 255, 0.15)' }}>
        <div className="flex items-center justify-between">
          <div>
            <div className="font-semibold text-white mb-1">Apple Store</div>
            <div className="text-xs text-white/70">Today, 4:13 PM</div>
          </div>
          <div className="text-right">
            <div className="font-bold text-white">-$999.00</div>
            <div className="text-xs text-white/70">Pending</div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3">
        <button
          className="flex-1 px-4 py-3 rounded-lg text-sm font-semibold transition-all"
          style={{
            backgroundColor: 'rgba(255, 255, 255, 0.2)',
            color: 'white',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.3)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.2)';
          }}
        >
          Back
        </button>
        <button
          className="flex-1 px-4 py-3 rounded-lg text-sm font-semibold transition-all"
          style={{
            backgroundColor: primaryColor,
            color: 'white',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = primaryColor;
            e.currentTarget.style.opacity = '0.9';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = primaryColor;
            e.currentTarget.style.opacity = '1';
          }}
        >
          Pay Now
        </button>
      </div>
    </BaseCard>
  );
}
