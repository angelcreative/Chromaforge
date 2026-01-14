import React, { useState } from 'react';
import { BaseCard, ThemeColors } from '../BaseComponents';
import { Input, Button, IconButton, Tag } from '../Molecules';
import { Search, Mic, Camera, History, Palette, Code, BarChart, Brush } from 'lucide-react';

export default function SearchCard({ theme }: { theme: ThemeColors }) {
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <BaseCard theme={theme} className="p-6">
      <div className="mb-6">
        <div className="relative">
          <Input
            type="text"
            placeholder="Search anything..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            theme={theme}
            iconLeft={<Search size={20} />}
            className="pr-24"
          />
          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1">
            <IconButton theme={theme} className="p-1">
              <Mic size={16} />
            </IconButton>
            <IconButton theme={theme} className="p-1">
              <Camera size={16} />
            </IconButton>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold" style={{ color: theme.text.main }}>Recent Searches</h3>
            <Button theme={theme} variant="tertiary">
              Clear all
            </Button>
          </div>
          <div className="space-y-2">
            {['Design system', 'Color palette generator'].map((search, idx) => (
              <div key={idx} className="flex items-center gap-3 p-2 rounded-lg cursor-pointer" style={{ backgroundColor: theme.bg.input }}>
                <History size={16} style={{ color: theme.text.tertiary }} />
                <span className="text-sm" style={{ color: theme.text.main }}>{search}</span>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h3 className="text-sm font-semibold mb-3" style={{ color: theme.text.main }}>Trending Now</h3>
          <div className="flex flex-wrap gap-2">
            {['UI Components', 'Glassmorphism', 'Design tokens', 'Color theory'].map((tag, idx) => (
              <Tag key={idx} theme={theme} variant="primary">{tag}</Tag>
            ))}
          </div>
        </div>

        <div>
          <h3 className="text-sm font-semibold mb-3" style={{ color: theme.text.main }}>Categories</h3>
          <div className="grid grid-cols-2 gap-3">
            {[
              { icon: Palette, label: 'Design' },
              { icon: Code, label: 'Development' },
              { icon: BarChart, label: 'Analytics' },
              { icon: Brush, label: 'Resources' },
            ].map(({ icon: Icon, label }, idx) => (
              <div key={idx} className="flex items-center gap-3 p-3 rounded-lg cursor-pointer" style={{ backgroundColor: theme.bg.input }}>
                <Icon size={20} style={{ color: theme.action.primary }} />
                <span className="text-sm" style={{ color: theme.text.main }}>{label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </BaseCard>
  );
}
