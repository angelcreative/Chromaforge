import React from 'react';
import { BaseCard, ThemeColors } from '../BaseComponents';
import { TrendingUp } from 'lucide-react';

export default function StatsCard({ theme }: { theme: ThemeColors }) {
  return (
    <BaseCard theme={theme} className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold" style={{ color: theme.text.main }}>Gross volume</h3>
        <span className="px-3 py-1 rounded-full text-sm font-semibold" style={{ backgroundColor: `${theme.semantic.success.main}20`, color: theme.semantic.success.main }}>
          +1,188.5%
        </span>
      </div>

      <div className="mb-6">
        <div className="text-3xl font-bold mb-1" style={{ color: theme.text.main }}>US$83,750.00</div>
        <div className="text-sm" style={{ color: theme.text.secondary }}>US$6,500.00 previous year</div>
      </div>

      <div className="mb-6">
        <svg viewBox="0 0 300 100" className="w-full h-24">
          <defs>
            <linearGradient id="areaGradient" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor={theme.action.primary} stopOpacity="0.3" />
              <stop offset="100%" stopColor={theme.action.primary} stopOpacity="0.1" />
            </linearGradient>
          </defs>
          <path
            d="M0 90 C50 80, 100 50, 150 60 S250 20, 300 30 L300 100 L0 100 Z"
            fill="url(#areaGradient)"
          />
          <path
            d="M0 90 C50 80, 100 50, 150 60 S250 20, 300 30"
            fill="none"
            stroke={theme.action.primary}
            strokeWidth="2"
          />
          <circle cx="8" cy="89" r="4" fill={theme.action.primary} />
          <circle cx="150" cy="60" r="4" fill={theme.action.primary} />
          <circle cx="292" cy="30" r="4" fill={theme.action.primary} />
        </svg>
        <div className="flex justify-between text-xs mt-2" style={{ color: theme.text.tertiary }}>
          <span>1 Dec</span>
          <span>Today</span>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <a href="#" className="text-sm font-semibold" style={{ color: theme.action.primary }}>View more</a>
        <span className="text-xs" style={{ color: theme.text.tertiary }}>Updated 17:02</span>
      </div>
    </BaseCard>
  );
}
