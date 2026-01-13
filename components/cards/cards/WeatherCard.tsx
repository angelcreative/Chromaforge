import React from 'react';
import { BaseCard, ThemeColors } from '../BaseComponents';
import { Cloud, CloudRain, CloudSnow } from 'lucide-react';

export default function WeatherCard({ theme }: { theme: ThemeColors }) {
  const forecast = [
    { day: 'THU', icon: Cloud, temp: '22°C', min: '11°C' },
    { day: 'FRI', icon: CloudRain, temp: '13°C', min: '4°C' },
    { day: 'SAT', icon: CloudSnow, temp: '11°C', min: '4°C' },
    { day: 'SUN', icon: Cloud, temp: '13°C', min: '7°C' },
    { day: 'MON', icon: Cloud, temp: '14°C', min: '7°C' },
    { day: 'TUE', icon: Cloud, temp: '12°C', min: '6°C' },
    { day: 'WED', icon: Cloud, temp: '12°C', min: '6°C' },
  ];

  return (
    <BaseCard theme={theme} className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="text-4xl font-bold mb-1" style={{ color: theme.text.main }}>22°C</div>
          <div className="text-xs mb-2" style={{ color: theme.text.secondary }}>
            <span>MAX: 25</span>
            <span className="mx-2">•</span>
            <span>MIN: 15</span>
          </div>
        </div>
        <Cloud size={48} style={{ color: theme.action.primary }} />
      </div>

      <div className="mb-6">
        <div className="text-xs font-bold uppercase tracking-wider mb-1" style={{ color: theme.text.tertiary }}>THURSDAY</div>
        <div className="text-sm font-semibold" style={{ color: theme.text.main }}>BRUSSELS</div>
      </div>

      <div className="grid grid-cols-7 gap-2">
        {forecast.map(({ day, icon: Icon, temp, min }, idx) => (
          <div key={idx} className="text-center">
            <div className="text-xs mb-2" style={{ color: theme.text.tertiary }}>{day}</div>
            <Icon size={24} className="mx-auto mb-2" style={{ color: theme.text.secondary }} />
            <div className="text-sm font-semibold mb-1" style={{ color: theme.text.main }}>{temp}</div>
            <div className="text-xs" style={{ color: theme.text.tertiary }}>{min}</div>
          </div>
        ))}
      </div>
    </BaseCard>
  );
}
