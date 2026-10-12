import React from 'react';
import { BaseCard, ThemeColors } from '../BaseComponents';
import { Button, IconButton } from '../Molecules';
import { X } from 'lucide-react';

export default function OnboardingCard({ theme }: { theme: ThemeColors }) {
  return (
    <BaseCard theme={theme} className="p-6 text-center relative">
      <IconButton
        theme={theme}
        className="absolute top-4 right-4"
      >
        <X size={16} strokeWidth={1.5}/>
      </IconButton>
      
      <img 
        src="https://i.postimg.cc/Kv8g4Z9Z/image.png" 
        alt="Fashion model"
        className="w-full rounded-xl mb-6"
      />
      
      <div className="flex justify-center gap-2 mb-6">
        <div
          className="w-2 h-2 rounded-full"
          style={{ backgroundColor: theme.action.primary }}
        />
        <div
          className="w-2 h-2 rounded-full"
          style={{ backgroundColor: theme.border.subtle }}
        />
        <div
          className="w-2 h-2 rounded-full"
          style={{ backgroundColor: theme.border.subtle }}
        />
      </div>

      <h1
        className="text-2xl font-bold mb-3 leading-tight"
        style={{ color: theme.text.main }}
      >
        Unleash your style,<br />Redefine Fashion!
      </h1>
      <p
        className="text-sm mb-6"
        style={{ color: theme.text.secondary }}
      >
        Discover the latest trends, timeless classics and bold pieces that define you.
      </p>
      
      <Button theme={theme} className="w-full">
        Sign up
      </Button>
    </BaseCard>
  );
}
