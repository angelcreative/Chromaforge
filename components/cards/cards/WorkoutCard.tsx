import React from 'react';
import { BaseCard, ThemeColors } from '../BaseComponents';
import { Button } from '../Molecules';
import { MapPin, Activity } from 'lucide-react';

export default function WorkoutCard({ theme }: { theme: ThemeColors }) {
  return (
    <BaseCard theme={theme} className="p-6 relative overflow-hidden">
      <div className="absolute inset-0 opacity-10">
        <video
          autoPlay
          loop
          muted
          className="w-full h-full object-cover"
          style={{ filter: 'blur(20px)' }}
        >
          <source src="https://videos.pexels.com/video-files/8694172/8694172-sd_506_960_24fps.mp4" type="video/mp4" />
        </video>
      </div>
      <div className="relative z-10">
        <div className="mb-6">
          <h3 className="text-xl font-bold mb-1" style={{ color: theme.text.main }}>Morning Run</h3>
          <span className="text-sm" style={{ color: theme.text.secondary }}>3 January, 2025</span>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-6">
          {[
            { value: '5.2', label: 'km', progress: 75 },
            { value: '32', label: 'min', progress: 85 },
            { value: '320', label: 'kcal', progress: 65 },
          ].map((metric, idx) => (
            <div key={idx} className="text-center">
              <div className="relative w-20 h-20 mx-auto mb-2">
                <svg viewBox="0 0 36 36" className="w-full h-full transform -rotate-90">
                  <circle
                    cx="18"
                    cy="18"
                    r="15.9155"
                    fill="none"
                    stroke={theme.bg.input}
                    strokeWidth="2"
                  />
                  <circle
                    cx="18"
                    cy="18"
                    r="15.9155"
                    fill="none"
                    stroke={theme.action.primary}
                    strokeWidth="2"
                    strokeDasharray={`${metric.progress}, 100`}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <div className="text-lg font-bold" style={{ color: theme.text.main }}>{metric.value}</div>
                  <div className="text-xs" style={{ color: theme.text.secondary }}>{metric.label}</div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="space-y-2 mb-6">
          <div className="flex items-center gap-2 text-sm">
            <MapPin size={16} style={{ color: theme.text.secondary }} />
            <span style={{ color: theme.text.main }}>Central Park Route</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Activity size={16} style={{ color: theme.text.secondary }} />
            <span style={{ color: theme.text.main }}>Pace: 6'15"/km</span>
          </div>
        </div>

        <Button theme={theme} style={{ width: '100%' }}>View Complete Route</Button>
      </div>
    </BaseCard>
  );
}
