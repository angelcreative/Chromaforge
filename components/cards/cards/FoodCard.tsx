import React, { useState } from 'react';
import { BaseCard, ThemeColors } from '../BaseComponents';
import { IconButton, Tag } from '../Molecules';
import { Heart, Star, ThumbsUp, Bookmark } from 'lucide-react';

export default function FoodCard({ theme }: { theme: ThemeColors }) {
  const [activeDot, setActiveDot] = useState(0);

  return (
    <BaseCard theme={theme} className="overflow-hidden relative">
      <div className="relative">
        <img
          src="https://images.unsplash.com/photo-1634487359989-3e90c9432133?q=80&w=1000&auto=format&fit=crop"
          alt="Wheat tortilla"
          className="w-full aspect-square object-cover"
        />
        <div className="absolute top-4 right-4">
          <IconButton theme={theme}>
            <Heart size={20} strokeWidth={1.5}/>
          </IconButton>
        </div>
      </div>

      <div className="p-6">
        <h2 className="text-xl font-bold mb-3" style={{ color: theme.text.main }}>Wheat tortilla</h2>
        <div className="flex flex-wrap gap-2 mb-4">
          {['Flatbread', 'Mexican', 'Wheat'].map((tag, idx) => (
            <Tag key={idx} theme={theme} variant="secondary">{tag}</Tag>
          ))}
        </div>
        <div className="flex items-center gap-6 mb-6">
          <div className="flex items-center gap-1">
            <Star size={16} style={{ color: theme.action.primary }} strokeWidth={1.5}/>
            <span className="text-sm font-semibold" style={{ color: theme.text.main }}>4.7 (900)</span>
          </div>
          <div className="flex items-center gap-1">
            <ThumbsUp size={16} style={{ color: theme.text.secondary }} strokeWidth={1.5}/>
            <span className="text-sm" style={{ color: theme.text.secondary }}>280</span>
          </div>
          <div className="flex items-center gap-1">
            <Bookmark size={16} style={{ color: theme.text.secondary }} strokeWidth={1.5}/>
            <span className="text-sm" style={{ color: theme.text.secondary }}>470</span>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-center gap-2 pb-4">
        {[0, 1, 2].map((idx) => (
          <div
            key={idx}
            className="w-2 h-2 rounded-full transition-all"
            style={{
              backgroundColor: activeDot === idx ? theme.action.primary : theme.border.subtle,
              width: activeDot === idx ? '24px' : '8px',
            }}
          />
        ))}
      </div>
    </BaseCard>
  );
}
