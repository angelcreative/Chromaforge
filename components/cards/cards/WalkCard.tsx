import React from 'react';
import { BaseCard, ThemeColors } from '../BaseComponents';
import { Button } from '../Molecules';
import { Clock } from 'lucide-react';

export default function WalkCard({ theme }: { theme: ThemeColors }) {
  return (
    <BaseCard theme={theme} className="p-6">
      <div className="mb-6">
        <img
          src="https://illustrations.popsy.co/white/woman-running.svg"
          alt="Health"
          className="w-full h-48 object-contain mb-6"
        />
      </div>
      <h2 className="text-2xl font-bold mb-3" style={{ color: theme.text.main }}>Insist on Exercise</h2>
      <p className="text-sm mb-6 leading-relaxed" style={{ color: theme.text.secondary }}>
        Life lies in exercise, exercise in exercise! Eight abs are not born, the perfect
        physique is exercised, if you want to have a fit figure, you have to work hard.
      </p>
      <div className="flex gap-3 mb-6">
        <Button theme={theme} variant="secondary" className="flex-1">Learn More</Button>
        <Button theme={theme} className="flex-1">Start Now</Button>
      </div>
      <div className="flex items-center gap-2 text-sm" style={{ color: theme.text.tertiary }}>
        <Clock size={16} />
        <span>Health assistant</span>
      </div>
    </BaseCard>
  );
}
