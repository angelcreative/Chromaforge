import React, { useState } from 'react';
import { BaseCard, ThemeColors } from '../BaseComponents';
import { Button, Input } from '../Molecules';
import { Eye, EyeOff } from 'lucide-react';

export default function PinCard({ theme }: { theme: ThemeColors }) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <BaseCard theme={theme} className="p-6">
      <h2 className="text-xl font-bold mb-2" style={{ color: theme.text.main }}>Verify Phone Number</h2>
      <p className="text-sm mb-6" style={{ color: theme.text.secondary }}>
        Please enter the 4 digit OTP code sent to your phone number +234808****700 below to create new PIN.
      </p>

      <div className="flex gap-3 mb-6">
        {['4', '5', '8', '0'].map((digit, idx) => (
          <Input
            key={idx}
            theme={theme}
            value={digit}
            style={{ textAlign: 'center', fontSize: '24px', fontWeight: 'bold', maxWidth: '60px' }}
          />
        ))}
      </div>

      <div className="flex items-center justify-between mb-6 text-sm">
        <span style={{ color: theme.text.secondary }}>Expires in: <strong style={{ color: theme.text.main }}>8 mins</strong></span>
        <a href="#" style={{ color: theme.action.primary }}>Didn't get code? Resend</a>
      </div>

      <Button theme={theme} style={{ width: '100%' }}>Verify number</Button>
    </BaseCard>
  );
}
