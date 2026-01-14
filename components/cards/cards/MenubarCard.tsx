import React, { useState } from 'react';
import { BaseCard, ThemeColors } from '../BaseComponents';
import { Home, Video, Plus, Users, User, Radio, BookOpen, Edit } from 'lucide-react';

export default function MenubarCard({ theme }: { theme: ThemeColors }) {
  const [activeItem, setActiveItem] = useState('home');

  const navItems = [
    { id: 'home', icon: Home, label: 'Home' },
    { id: 'video', icon: Video, label: 'Video' },
    { id: 'post', icon: Plus, label: 'Post' },
    { id: 'group', icon: Users, label: 'Group' },
    { id: 'profile', icon: User, label: 'Profile' },
  ];

  return (
    <BaseCard theme={theme} className="pb-6 pt-8 px-6 relative" style={{ width: '380px', maxWidth: '380px' }}>
      {/* Navigation Items */}
      <div className="flex items-center justify-around relative z-0">
        {navItems.map(({ id, icon: Icon, label }) => (
          <button
            key={id}
            onClick={() => setActiveItem(id)}
            className="flex flex-col items-center gap-1 transition-colors relative z-0"
            style={{
              color: activeItem === id ? theme.action.primary : theme.text.secondary,
            }}
          >
            <Icon size={24} />
            <span className="text-xs">{label}</span>
          </button>
        ))}
      </div>

      {/* Floating Action Button - Centered and overlapping */}
      <button
        className="absolute left-1/2 transform -translate-x-1/2 top-0.5 w-14 h-14 rounded-full flex items-center justify-center transition-all z-10 shadow-lg"
        style={{
          backgroundColor: theme.action.primary,
          color: 'white',
          boxShadow: `0 4px 12px ${theme.action.primary}50`,
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'translate(-50%, -6px) scale(1.05)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translate(-50%, -6px) scale(1)';
        }}
      >
        <Plus size={24} />
      </button>
    </BaseCard>
  );
}
