import React, { useState } from 'react';
import { BaseCard, ThemeColors } from '../BaseComponents';
import { Button, IconButton, RadioGroup } from '../Molecules';
import { X } from 'lucide-react';

export default function FormCard({ theme }: { theme: ThemeColors }) {
  const [selectedValue, setSelectedValue] = useState('diy');

  return (
    <BaseCard theme={theme} className="p-6">
      <div className="flex items-center justify-between mb-6">
        <span className="text-xs font-bold uppercase tracking-wider" style={{ color: theme.text.tertiary }}>QUESTION 01</span>
        <IconButton theme={theme}>
          <X size={20} strokeWidth={1.5}/>
        </IconButton>
      </div>

      <div className="mb-6">
        <h2 className="text-xl font-bold mb-2" style={{ color: theme.text.main }}>How would you like to make change happen?</h2>
        <p className="text-xs uppercase tracking-wider" style={{ color: theme.text.secondary }}>SELECT ONLY ONE</p>
      </div>

      <RadioGroup
        value={selectedValue}
        onValueChange={setSelectedValue}
        theme={theme}
        options={[
          { value: 'diy', label: 'D.I.Y.' },
          { value: 'contractor', label: 'Contractor' },
          { value: 'propertymanager', label: 'Property Manager' },
        ]}
        className="space-y-3 mb-6"
      />

      <div className="flex gap-3">
        <Button theme={theme} variant="secondary" className="flex-1">Back</Button>
        <Button theme={theme} className="flex-1">Next</Button>
      </div>
    </BaseCard>
  );
}
