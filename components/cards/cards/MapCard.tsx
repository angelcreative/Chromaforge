import React from 'react';
import { BaseCard, ThemeColors } from '../BaseComponents';
import { Button, IconButton } from '../Molecules';
import { Star, X, Navigation, Phone, Bookmark, Share } from 'lucide-react';

export default function MapCard({ theme }: { theme: ThemeColors }) {
  return (
    <BaseCard theme={theme} className="overflow-hidden" style={{ maxWidth: '900px', width: '100%' }}>
      <div className="h-64 bg-slate-800 relative">
        <iframe
          src="https://maps.google.com/maps?width=500&height=500&hl=en&q=2880+Broadway,+New+York&t=&z=18&ie=UTF8&iwloc=B&output=embed"
          className="w-full h-full border-0"
          style={{ filter: 'grayscale(0.3)' }}
        />
      </div>

      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h2 className="text-xl font-bold mb-2" style={{ color: theme.text.main }}>Green Cup Café</h2>
            <div className="flex items-center gap-1 mb-2">
              <Star size={16} fill={theme.action.primary} style={{ color: theme.action.primary }} />
              <span className="text-sm font-semibold" style={{ color: theme.text.main }}>4.5</span>
            </div>
            <p className="text-sm" style={{ color: theme.text.secondary }}>Churchill square</p>
          </div>
          <IconButton theme={theme}>
            <X size={20} />
          </IconButton>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <Button theme={theme} variant="secondary" icon={<Navigation size={16} />}>
            4 mins
          </Button>
          <Button theme={theme} variant="secondary" icon={<Phone size={16} />}>
            Call
          </Button>
          <Button theme={theme} variant="secondary" icon={<Bookmark size={16} />}>
            Save
          </Button>
          <Button theme={theme} variant="secondary" icon={<Share size={16} />}>
            Share
          </Button>
        </div>
      </div>
    </BaseCard>
  );
}
