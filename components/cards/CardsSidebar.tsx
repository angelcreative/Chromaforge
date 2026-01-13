import React, { useState } from 'react';
import { Search } from 'lucide-react';
import { ThemeColors } from './BaseComponents';

export interface CardDefinition {
  id: string;
  name: string;
  category: string;
}

const CARD_CATEGORIES = [
  {
    name: 'Media & Entertainment',
    cards: [
      { id: 'music-player', name: 'Music Player' },
      { id: 'video-card', name: 'Video Card' },
      { id: 'instagram-card', name: 'Instagram Card' },
    ],
  },
  {
    name: 'Forms & Inputs',
    cards: [
      { id: 'login-card', name: 'Login Card' },
      { id: 'form-card', name: 'Form Card' },
      { id: 'upload-card', name: 'Upload Card' },
      { id: 'feedback-card', name: 'Feedback Card' },
      { id: 'pin-card', name: 'PIN Card' },
    ],
  },
  {
    name: 'Data & Information',
    cards: [
      { id: 'stats-card', name: 'Stats Card' },
      { id: 'weather-card', name: 'Weather Card' },
      { id: 'calendar-card', name: 'Calendar Card' },
      { id: 'storage-card', name: 'Storage Card' },
    ],
  },
  {
    name: 'Social & Communication',
    cards: [
      { id: 'chat-card', name: 'Chat Card' },
      { id: 'profile-card', name: 'Profile Card' },
      { id: 'contact-profile', name: 'Contact Profile' },
      { id: 'onboarding-card', name: 'Onboarding Card' },
    ],
  },
  {
    name: 'E-commerce',
    cards: [
      { id: 'product-card', name: 'Product Card' },
      { id: 'food-card', name: 'Food Card' },
      { id: 'payment-card', name: 'Payment Card' },
      { id: 'credit-card', name: 'Credit Card' },
    ],
  },
  {
    name: 'Navigation & UI',
    cards: [
      { id: 'search-card', name: 'Search Card' },
      { id: 'menubar-card', name: 'Menubar Card' },
      { id: 'candidates-card', name: 'Candidates Card' },
      { id: 'alarm-card', name: 'Alarm Card' },
    ],
  },
  {
    name: 'Special',
    cards: [
      { id: 'boarding-card', name: 'Boarding Card' },
      { id: 'workout-card', name: 'Workout Card' },
      { id: 'walk-card', name: 'Walk Card' },
      { id: 'drone-monitor', name: 'Drone Monitor' },
      { id: 'video-call', name: 'Video Call' },
      { id: 'code-snippet', name: 'Code Snippet' },
      { id: 'sales-card', name: 'Sales Card' },
      { id: 'loading-card', name: 'Loading Card' },
      { id: 'cookie-consent', name: 'Cookie Consent' },
      { id: 'map-card', name: 'Map Card' },
    ],
  },
];

interface CardsSidebarProps {
  theme: ThemeColors;
  selectedCardId: string | null;
  onSelectCard: (cardId: string) => void;
  isExpanded: boolean;
  onToggle: () => void;
}

export const CardsSidebar: React.FC<CardsSidebarProps> = ({
  theme,
  selectedCardId,
  onSelectCard,
  isExpanded,
  onToggle,
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredCategories = CARD_CATEGORIES.map((category) => ({
    ...category,
    cards: category.cards.filter((card) =>
      card.name.toLowerCase().includes(searchQuery.toLowerCase())
    ),
  })).filter((category) => category.cards.length > 0);

  if (!isExpanded) {
    return (
      <div className="relative bg-slate-900 border-l border-white/5 flex flex-col shrink-0 z-10 shadow-2xl transition-all duration-300 w-0 md:w-[24px] overflow-hidden">
        <button
          onClick={onToggle}
          className={`absolute z-50 w-6 h-6 bg-slate-800 border border-white/10 rounded-full flex items-center justify-center text-white hover:bg-slate-700 transition-all shadow-lg hover:scale-110 ${isExpanded ? '-left-3 top-6' : 'left-1 top-6'}`}
          title="Expand Cards Library"
          style={{ pointerEvents: 'auto' }}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <path d="M6 12L10 8L6 4V12Z" />
          </svg>
        </button>
      </div>
    );
  }

  return (
    <div className="relative bg-slate-900 border-l border-white/5 flex flex-col shrink-0 z-10 shadow-2xl transition-all duration-300 w-full md:w-[280px] overflow-hidden">
      {/* Toggle Button */}
      <button
        onClick={onToggle}
        className="absolute z-50 w-6 h-6 bg-slate-800 border border-white/10 rounded-full flex items-center justify-center text-white hover:bg-slate-700 transition-all shadow-lg hover:scale-110 -left-3 top-6"
        title="Collapse Cards Library"
        style={{ pointerEvents: 'auto' }}
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
          <path d="M10 12L6 8L10 4V12Z" />
        </svg>
      </button>

      {isExpanded && (
        <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col">
          {/* Header */}
          <div className="p-6 border-b border-white/5">
            <p className="text-xs text-slate-500">
              Browse cards with your color tokens.
            </p>
          </div>

          {/* Search */}
          {filteredCategories.length > 0 && (
            <div className="px-4 pt-4 pb-4 border-b border-white/5">
              <div className="relative">
                <Search
                  size={16}
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400"
                />
                <input
                  type="text"
                  placeholder="Search cards..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 rounded-lg text-sm bg-slate-800 border border-white/10 text-slate-300 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                />
              </div>
            </div>
          )}

          {/* Cards List */}
          <div className="p-4 space-y-1">
            {filteredCategories.map((category, categoryIdx) => (
              <div key={categoryIdx} className="mb-4">
                <h3 className="text-[10px] font-bold uppercase tracking-widest mb-2 px-2 text-slate-500">
                  {category.name}
                </h3>
                <div className="space-y-1">
                  {category.cards.map((card) => (
                    <button
                      key={card.id}
                      onClick={() => onSelectCard(card.id)}
                      className={`w-full px-4 py-3 rounded-lg text-sm font-medium transition-all text-left ${
                        selectedCardId === card.id
                          ? 'text-white shadow-md'
                          : 'text-slate-400 hover:text-white hover:bg-slate-800'
                      }`}
                      style={{
                        backgroundColor: selectedCardId === card.id ? theme.action.primary : 'transparent',
                      }}
                    >
                      {card.name}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
