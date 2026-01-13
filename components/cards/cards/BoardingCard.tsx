import React from 'react';
import { BaseCard, ThemeColors } from '../BaseComponents';
import { Plane, MapPin, User, Briefcase } from 'lucide-react';
import * as Avatar from '@radix-ui/react-avatar';

export default function BoardingCard({ theme }: { theme: ThemeColors }) {
  return (
    <BaseCard theme={theme} className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="text-sm font-semibold mb-1" style={{ color: theme.text.main }}>United Airlines</div>
          <div className="text-xs" style={{ color: theme.text.secondary }}>UA 1234</div>
        </div>
        <Plane size={32} style={{ color: theme.action.primary }} />
      </div>

      <div className="flex items-center justify-between mb-6">
        <div className="text-center">
          <div className="text-2xl font-bold mb-1" style={{ color: theme.text.main }}>SFO</div>
          <div className="flex items-center gap-1 text-xs mb-1" style={{ color: theme.text.secondary }}>
            <MapPin size={12} />
            <span>San Francisco</span>
          </div>
          <div className="text-sm font-semibold" style={{ color: theme.text.main }}>10:30 AM</div>
        </div>
        <div className="flex-1 px-4">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Plane size={16} style={{ color: theme.text.tertiary }} />
            <div className="flex-1 h-0.5" style={{ backgroundColor: theme.border.subtle }} />
            <Plane size={16} style={{ color: theme.text.tertiary }} />
          </div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold mb-1" style={{ color: theme.text.main }}>NYC</div>
          <div className="flex items-center gap-1 text-xs mb-1" style={{ color: theme.text.secondary }}>
            <MapPin size={12} />
            <span>New York</span>
          </div>
          <div className="text-sm font-semibold" style={{ color: theme.text.main }}>6:30 PM</div>
        </div>
      </div>

      <div className="flex items-center justify-between p-4 rounded-lg" style={{ backgroundColor: theme.bg.input }}>
        <div className="flex items-center gap-4">
          <Avatar.Root className="w-12 h-12 rounded-full overflow-hidden">
            <Avatar.Image src="https://i.postimg.cc/Hs4x3myF/image.png" />
            <Avatar.Fallback style={{ backgroundColor: theme.action.primary }} />
          </Avatar.Root>
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm">
              <User size={14} style={{ color: theme.text.secondary }} />
              <span style={{ color: theme.text.main }}>Man Bo Park</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Briefcase size={14} style={{ color: theme.text.secondary }} />
              <span style={{ color: theme.text.main }}>Seat 12A</span>
            </div>
          </div>
        </div>
        <div className="text-center">
          <img
            src="https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=UA1234-SFO-NYC"
            alt="QR Code"
            className="w-20 h-20 mb-1"
          />
          <div className="text-xs font-semibold" style={{ color: theme.text.secondary }}>Boarding 9:45 AM</div>
        </div>
      </div>
    </BaseCard>
  );
}
