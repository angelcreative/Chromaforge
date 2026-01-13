import React from 'react';
import { BaseCard, ThemeColors } from '../BaseComponents';

export default function LoadingCard({ theme }: { theme: ThemeColors }) {
  return (
    <BaseCard theme={theme} className="p-12">
      <div className="flex flex-col items-center justify-center">
        <div
          className="w-16 h-16 border-4 rounded-full animate-spin mb-4"
          style={{
            borderColor: `${theme.action.primary}30`,
            borderTopColor: theme.action.primary,
          }}
        />
        <p className="text-lg font-semibold" style={{ color: theme.text.main }}>
          Loading
          <span className="inline-block ml-1">
            <span className="animate-pulse">.</span>
            <span className="animate-pulse delay-75">.</span>
            <span className="animate-pulse delay-150">.</span>
          </span>
        </p>
      </div>
    </BaseCard>
  );
}
