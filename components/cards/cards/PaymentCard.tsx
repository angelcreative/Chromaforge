import React, { useState } from 'react';
import { BaseCard, ThemeColors } from '../BaseComponents';
import { Button, Input } from '../Molecules';
import { Plus } from 'lucide-react';
import * as RadioGroup from '@radix-ui/react-radio-group';

export default function PaymentCard({ theme }: { theme: ThemeColors }) {
  const [paymentMethod, setPaymentMethod] = useState('creditcard');
  const [selectedCard, setSelectedCard] = useState(0);

  return (
    <BaseCard theme={theme} className="p-6" style={{ width: '380px', maxWidth: '380px' }}>
      <h2 className="text-xl font-bold mb-6" style={{ color: theme.text.main }}>Payment Plan</h2>

      {/* Payment Method Tabs */}
      <div className="flex gap-2 mb-6">
        {[
          { id: 'creditcard', label: 'Credit Card' },
          { id: 'paypal', label: 'Paypal' },
        ].map((method) => (
          <button
            key={method.id}
            onClick={() => setPaymentMethod(method.id)}
            className="flex-1 px-4 py-2 rounded-lg text-sm font-semibold transition-all"
            style={{
              backgroundColor: paymentMethod === method.id ? `${theme.action.primary}20` : theme.bg.input,
              color: paymentMethod === method.id ? theme.action.primary : theme.text.secondary,
            }}
          >
            {method.label}
          </button>
        ))}
      </div>

      {/* Credit Cards */}
      <RadioGroup.Root value={selectedCard.toString()} onValueChange={(val) => setSelectedCard(parseInt(val))} className="space-y-3 mb-6">
        {[
          { dots: '•••• 4470', type: 'Visa Card', brand: 'https://upload.wikimedia.org/wikipedia/commons/5/5e/Visa_Inc._logo.svg' },
          { dots: '•••• 0900', type: 'Mastercard', brand: 'https://upload.wikimedia.org/wikipedia/commons/2/2a/Mastercard-logo.svg' },
        ].map((card, idx) => (
          <label
            key={idx}
            className="flex items-center gap-3 p-4 rounded-lg cursor-pointer transition-colors"
            style={{
              backgroundColor: selectedCard === idx ? `${theme.action.primary}15` : theme.bg.input,
              border: `2px solid ${selectedCard === idx ? theme.action.primary : theme.border.subtle}`,
            }}
            onMouseEnter={(e) => {
              if (selectedCard !== idx) {
                e.currentTarget.style.backgroundColor = theme.action.secondaryBg;
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = selectedCard === idx ? `${theme.action.primary}15` : theme.bg.input;
            }}
          >
            <RadioGroup.Item
              value={idx.toString()}
              className="w-5 h-5 rounded-full border-2 flex items-center justify-center"
              style={{ borderColor: selectedCard === idx ? theme.action.primary : theme.border.default }}
            >
              <RadioGroup.Indicator
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: theme.action.primary }}
              />
            </RadioGroup.Item>
            <div className="flex-1">
              <div className="font-semibold mb-1" style={{ color: theme.text.main }}>{card.dots}</div>
              <div className="text-xs flex items-center gap-2" style={{ color: theme.text.secondary }}>
                {card.type}
                <a href="#" className="text-xs" style={{ color: theme.action.primary }}>Edit</a>
              </div>
            </div>
            <img src={card.brand} alt={card.type} className="h-8" />
          </label>
        ))}
      </RadioGroup.Root>

      {/* Add New Card */}
      <button
        className="w-full p-4 rounded-lg border-2 border-dashed flex items-center justify-center gap-2 mb-6"
        style={{
          borderColor: theme.border.subtle,
          color: theme.text.secondary,
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = theme.action.primary;
          e.currentTarget.style.color = theme.action.primary;
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = theme.border.subtle;
          e.currentTarget.style.color = theme.text.secondary;
        }}
      >
        <Plus size={20} />
        <span>Add New Card</span>
      </button>

      {/* Discount Code */}
      <div className="mb-6">
        <h3 className="text-sm font-semibold mb-3" style={{ color: theme.text.main }}>Discount Code</h3>
        <div className="flex gap-2 mb-2">
          <div className="flex-1" style={{ backgroundColor: `${theme.action.primary}15`, borderRadius: '8px', padding: '8px 12px' }}>
            <span style={{ color: theme.text.main }}>30KCELEB</span>
          </div>
          <Button theme={theme} variant="secondary">Apply</Button>
        </div>
        <span className="text-xs" style={{ color: theme.semantic.success.main }}>30% Discount code applied</span>
      </div>

      {/* Payment Summary */}
      <div className="space-y-3 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="font-semibold" style={{ color: theme.text.main }}>Team Plan</div>
            <div className="text-xs" style={{ color: theme.text.secondary }}>5 Users Quaterly</div>
          </div>
          <div className="text-lg font-bold" style={{ color: theme.text.main }}>$189.00</div>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span style={{ color: theme.text.secondary }}>Discount (30%)</span>
          <span className="font-semibold" style={{ color: theme.semantic.success.main }}>- $63.85</span>
        </div>
        <div className="flex items-center justify-between pt-3 border-t" style={{ borderColor: theme.border.subtle }}>
          <div>
            <div className="text-lg font-bold" style={{ color: theme.text.main }}>Total</div>
            <div className="text-xs" style={{ color: theme.text.tertiary }}>Next payment will charge 10th of January, 2023</div>
          </div>
          <div className="text-2xl font-bold" style={{ color: theme.text.main }}>$126.15</div>
        </div>
      </div>

      <Button theme={theme} className="w-full">Pay Now</Button>
    </BaseCard>
  );
}
