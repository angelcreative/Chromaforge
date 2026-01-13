import React from 'react';
import { BaseCard, ThemeColors } from '../BaseComponents';
import { Button } from '../Molecules';

export default function CookieConsentCard({ theme }: { theme: ThemeColors }) {
  return (
    <BaseCard theme={theme} className="p-6 text-center">
      <div className="mb-4">
        <img
          src="https://illustrations.popsy.co/white/chef-serving-food.svg"
          alt="Cookie"
          className="w-24 h-24 mx-auto"
        />
      </div>
      <h2 className="text-xl font-bold mb-3" style={{ color: theme.text.main }}>Cookies Consent</h2>
      <p className="text-sm mb-6" style={{ color: theme.text.secondary }}>
        This website use cookies to ensure you get the best experience on our website.
      </p>
      <div className="flex items-center justify-center gap-4">
        <Button theme={theme}>I understand</Button>
        <a href="#" className="text-sm font-semibold" style={{ color: theme.action.primary }}>
          Learn more
        </a>
      </div>
    </BaseCard>
  );
}
