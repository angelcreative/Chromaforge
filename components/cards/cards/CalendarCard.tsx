import React, { useState } from 'react';
import { BaseCard, ThemeColors, IconButton } from '../BaseComponents';
import { ChevronLeft, ChevronRight, Music, Utensils } from 'lucide-react';

export default function CalendarCard({ theme }: { theme: ThemeColors }) {
  const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const days = [2, 3, 4, 5, 6, 7, 8];
  const selectedDay = 3;

  return (
    <BaseCard theme={theme} className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold" style={{ color: theme.text.main }}>September 2024</h2>
        <div className="flex gap-2">
          <IconButton theme={theme}>
            <ChevronLeft size={20} />
          </IconButton>
          <IconButton theme={theme}>
            <ChevronRight size={20} />
          </IconButton>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-2 mb-6">
        {weekdays.map((day) => (
          <div key={day} className="text-center text-xs font-semibold py-2" style={{ color: theme.text.tertiary }}>
            {day}
          </div>
        ))}
        {days.map((day) => (
          <button
            key={day}
            className={`p-2 rounded-lg text-sm font-medium transition-all ${
              selectedDay === day ? 'shadow-md' : ''
            }`}
            style={{
              backgroundColor: selectedDay === day ? theme.action.primary : 'transparent',
              color: selectedDay === day ? theme.text.onPrimary : theme.text.main,
            }}
          >
            {day}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        <div className="p-4 rounded-lg flex items-center justify-between" style={{ backgroundColor: `${theme.action.primary}20` }}>
          <div className="flex items-center gap-3">
            <Music size={20} style={{ color: theme.action.primary }} />
            <div>
              <div className="font-semibold" style={{ color: theme.text.main }}>Music</div>
              <div className="text-xs" style={{ color: theme.text.secondary }}>5 hours per day</div>
            </div>
          </div>
          <div className="text-lg font-bold" style={{ color: theme.action.primary }}>80%</div>
        </div>
        <div className="p-4 rounded-lg flex items-center justify-between" style={{ backgroundColor: `${theme.semantic.success.main}20` }}>
          <div className="flex items-center gap-3">
            <Utensils size={20} style={{ color: theme.semantic.success.main }} />
            <div>
              <div className="font-semibold" style={{ color: theme.text.main }}>Food</div>
              <div className="text-xs" style={{ color: theme.text.secondary }}>5 hours per day</div>
            </div>
          </div>
          <div className="text-lg font-bold" style={{ color: theme.semantic.success.main }}>65%</div>
        </div>
      </div>
    </BaseCard>
  );
}
