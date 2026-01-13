import React, { useState } from 'react';
import { BaseCard, ThemeColors } from '../BaseComponents';
import { Switch, Button } from '../Molecules';
import { Plus } from 'lucide-react';

export default function AlarmCard({ theme }: { theme: ThemeColors }) {
  // Helper function to get shade color
  const getShade = (level: number): string => {
    if (theme.shades?.primary) {
      const shade = theme.shades.primary.find(s => s.level === level);
      if (shade) return shade.hex;
    }
    // Fallback to primary color with opacity if shades not available
    const opacityMap: { [key: number]: string } = { 300: '40', 400: '35', 500: '30', 600: '25' };
    return `${theme.action.primary}${opacityMap[level] || '30'}`;
  };

  const [alarms, setAlarms] = useState([
    { id: 1, time: '8:00', label: 'DAILY', name: 'Good morning! Go workout!', checked: true, shadeLevel: 300 },
    { id: 2, time: '10:00', label: 'EVERY THURSDAY', name: 'Prime time movie!', checked: false, shadeLevel: 400 },
    { id: 3, time: '20:00', label: 'EVERY WEDNESDAY', name: 'Tae Kwon Do session', checked: false, shadeLevel: 500 },
    { id: 4, time: '14:30', label: 'EVERY TUESDAY', name: 'Lunch with Mom', checked: false, shadeLevel: 600 },
  ]);

  return (
    <BaseCard theme={theme} className="overflow-hidden" style={{ width: '380px', maxWidth: '380px' }}>
      {/* Header with Gradient */}
      <div 
        className="p-6 flex items-center justify-between"
        style={{
          background: `linear-gradient(90deg, ${theme.action.primary} 0%, ${theme.action.secondaryText || theme.action.primaryHover} 100%)`,
        }}
      >
        <h3 className="text-xl font-bold text-white">Alarms & Reminders</h3>
        <Button
          theme={theme}
          variant="tertiary"
          className="w-10 h-10 rounded-full p-0"
          style={{ backgroundColor: 'rgba(255, 255, 255, 0.2)', color: 'white' }}
        >
          <Plus size={20} />
        </Button>
      </div>

      {/* Alarms List */}
      <div className="px-6 py-3 space-y-3">
        {alarms.map((alarm) => (
          <div
            key={alarm.id}
            className="p-4 rounded-lg flex items-center justify-between"
            style={{ backgroundColor: getShade(alarm.shadeLevel) }}
          >
            <div className="flex items-center gap-4 flex-1">
              <div className="text-2xl font-bold text-white">{alarm.time}</div>
              <div className="flex-1">
                <div className="text-xs font-bold uppercase tracking-wider mb-1 text-white/70">
                  {alarm.label}
                </div>
                <h4 className="font-semibold text-white">{alarm.name}</h4>
              </div>
            </div>
            <Switch
              checked={alarm.checked}
              onCheckedChange={(checked) => {
                setAlarms(alarms.map(a => a.id === alarm.id ? { ...a, checked } : a));
              }}
              theme={theme}
              className="flex-shrink-0"
            />
          </div>
        ))}
      </div>
    </BaseCard>
  );
}
