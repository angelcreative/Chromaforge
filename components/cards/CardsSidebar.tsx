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

  return (
    <div
      className="relative bg-card border-l border-border flex flex-col shrink-0 z-10 shadow-2xl w-full md:w-[280px] overflow-hidden">
      <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col">
          {/* Header */}
          <div className="p-6 border-b border-border">
            <p className="text-xs text-muted-foreground">
              Browse cards with your color tokens.
            </p>
          </div>

          {/* Search */}
          {filteredCategories.length > 0 && (
            <div className="px-4 pt-4 pb-4 border-b border-border">
              <div className="relative">
                <Search
                  size={16}
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground"
                />
                <input
                  type="text"
                  placeholder="Search cards..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 rounded-lg text-sm bg-secondary border border-border text-muted-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                />
              </div>
            </div>
          )}

          {/* Cards List */}
          <div className="p-4 space-y-1">
            {filteredCategories.map((category, categoryIdx) => (
              <div key={categoryIdx} className="mb-4">
                <h3 className="text-[10px] font-bold uppercase tracking-widest mb-2 px-2 text-muted-foreground">
                  {category.name}
                </h3>
                <div className="space-y-1">
                  {category.cards.map((card) => (
                    <button
                      key={card.id}
                      onClick={() => onSelectCard(card.id)}
                      className={`w-full px-4 py-3 rounded-lg text-sm font-medium transition-all text-left ${
                        selectedCardId === card.id
                          ? 'text-foreground shadow-md'
                          : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
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
    </div>
  );
};
