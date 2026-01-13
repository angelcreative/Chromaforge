import React from 'react';
import { BaseCard, ThemeColors } from '../BaseComponents';
import { MapPin, Briefcase } from 'lucide-react';
import * as Avatar from '@radix-ui/react-avatar';

export default function ProfileCard({ theme }: { theme: ThemeColors }) {
  return (
    <BaseCard theme={theme} className="overflow-hidden">
      <div className="relative h-32">
        <img
          src="https://i.postimg.cc/HxQhhZW6/image.png"
          alt="Cover"
          className="w-full h-full object-cover"
        />
      </div>
      <div className="px-6 pb-6">
        <div className="relative -mt-8 mb-4 flex justify-center">
          <Avatar.Root className="w-16 h-16 rounded-full overflow-hidden border-4" style={{ borderColor: theme.bg.card }}>
            <Avatar.Image 
              src="https://i.postimg.cc/JhRxhrR5/image.png" 
              alt="Angel J. Sánchez"
              className="w-full h-full object-cover"
            />
            <Avatar.Fallback 
              className="flex items-center justify-center text-xl font-semibold w-full h-full"
              style={{ backgroundColor: theme.action.primary, color: theme.text.onPrimary }}
            >
              AJS
            </Avatar.Fallback>
          </Avatar.Root>
        </div>
        <h2 className="text-2xl font-bold mb-1" style={{ color: theme.text.main }}>Angel J. Sánchez</h2>
        <h3 className="text-lg mb-4" style={{ color: theme.text.secondary }}>Product Designer</h3>
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm">
            <MapPin size={16} style={{ color: theme.text.tertiary }} />
            <span style={{ color: theme.text.secondary }}>Spain</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Briefcase size={16} style={{ color: theme.text.tertiary }} />
            <span style={{ color: theme.text.secondary }}>Designer</span>
          </div>
        </div>
      </div>
    </BaseCard>
  );
}
