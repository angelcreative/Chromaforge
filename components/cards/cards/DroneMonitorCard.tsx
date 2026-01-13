import React, { useState } from 'react';
import { BaseCard, ThemeColors } from '../BaseComponents';
import { IconButton } from '../Molecules';
import { Radio, Battery, Navigation, Gauge, Timer, Camera, Image, Video, Plus } from 'lucide-react';
import * as Tabs from '@radix-ui/react-tabs';

export default function DroneMonitorCard({ theme }: { theme: ThemeColors }) {
  const [activeTab, setActiveTab] = useState('status');

  return (
    <BaseCard theme={theme} className="p-6">
      <div className="relative mb-6 rounded-lg overflow-hidden" style={{ backgroundColor: theme.bg.input, aspectRatio: '16/9' }}>
        <video
          autoPlay
          loop
          muted
          className="w-full h-full object-cover"
        >
          <source src="https://videos.pexels.com/video-files/15999286/15999286-uhd_2560_1440_30fps.mp4" type="video/mp4" />
        </video>
        <div className="absolute top-4 left-4 right-4 flex justify-between">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded" style={{ backgroundColor: 'rgba(0,0,0,0.7)', color: 'white' }}>
            <Radio size={12} className="text-red-500" />
            <span className="text-xs font-mono">05:13</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded" style={{ backgroundColor: 'rgba(0,0,0,0.7)', color: 'white' }}>
            <span className="text-xs">HD</span>
            <span className="text-xs font-mono">19.54 FPS</span>
          </div>
        </div>
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <Plus size={48} style={{ color: 'white' }} />
        </div>
      </div>

      <Tabs.Root value={activeTab} onValueChange={setActiveTab}>
        <Tabs.List className="flex gap-2 mb-4">
          {[
            { id: 'status', label: 'Status', icon: Battery },
            { id: 'flight', label: 'Flight', icon: Navigation },
            { id: 'camera', label: 'Camera', icon: Camera },
          ].map(({ id, label, icon: Icon }) => (
            <Tabs.Trigger
              key={id}
              value={id}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all"
              style={{
                backgroundColor: activeTab === id ? theme.action.primary : theme.bg.input,
                color: activeTab === id ? theme.text.onPrimary : theme.text.secondary,
              }}
            >
              <Icon size={16} />
              <span>{label}</span>
            </Tabs.Trigger>
          ))}
        </Tabs.List>

        <Tabs.Content value="status" className="space-y-3">
          {[
            { icon: Battery, label: 'Battery', value: '93%' },
            { icon: Navigation, label: 'Altitude', value: '295 m' },
          ].map(({ icon: Icon, label, value }, idx) => (
            <div key={idx} className="flex items-center justify-between p-3 rounded-lg" style={{ backgroundColor: theme.bg.input }}>
              <div className="flex items-center gap-3">
                <Icon size={20} style={{ color: theme.text.tertiary }} />
                <span className="text-sm" style={{ color: theme.text.main }}>{label}</span>
              </div>
              <span className="text-sm font-semibold" style={{ color: theme.text.main }}>{value}</span>
            </div>
          ))}
        </Tabs.Content>

        <Tabs.Content value="flight" className="space-y-3">
          {[
            { icon: Gauge, label: 'Speed', value: '15 km/h' },
            { icon: Navigation, label: 'Distance', value: '1.7 km' },
            { icon: Timer, label: 'Flight Time', value: '05:13' },
          ].map(({ icon: Icon, label, value }, idx) => (
            <div key={idx} className="flex items-center justify-between p-3 rounded-lg" style={{ backgroundColor: theme.bg.input }}>
              <div className="flex items-center gap-3">
                <Icon size={20} style={{ color: theme.text.tertiary }} />
                <span className="text-sm" style={{ color: theme.text.main }}>{label}</span>
              </div>
              <span className="text-sm font-semibold" style={{ color: theme.text.main }}>{value}</span>
            </div>
          ))}
        </Tabs.Content>

        <Tabs.Content value="camera" className="space-y-3">
          {[
            { icon: Image, label: 'ISO', value: '600' },
            { icon: Camera, label: 'Shutter', value: '1/180' },
            { icon: Video, label: 'FPS', value: '24' },
          ].map(({ icon: Icon, label, value }, idx) => (
            <div key={idx} className="flex items-center justify-between p-3 rounded-lg" style={{ backgroundColor: theme.bg.input }}>
              <div className="flex items-center gap-3">
                <Icon size={20} style={{ color: theme.text.tertiary }} />
                <span className="text-sm" style={{ color: theme.text.main }}>{label}</span>
              </div>
              <span className="text-sm font-semibold" style={{ color: theme.text.main }}>{value}</span>
            </div>
          ))}
        </Tabs.Content>
      </Tabs.Root>
    </BaseCard>
  );
}
