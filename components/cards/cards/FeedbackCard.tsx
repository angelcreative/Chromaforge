import React, { useState } from 'react';
import { BaseCard, ThemeColors } from '../BaseComponents';
import { Button, Checkbox, Textarea } from '../Molecules';
import { Frown, Meh, Smile } from 'lucide-react';

export default function FeedbackCard({ theme }: { theme: ThemeColors }) {
  const [selectedRating, setSelectedRating] = useState<'bad' | 'okay' | 'good'>('good');
  const [checkboxes, setCheckboxes] = useState({ 1: true, 2: false });

  return (
    <BaseCard theme={theme} className="p-6">
      <h2 className="text-xl font-bold mb-6" style={{ color: theme.text.main }}>Give feedback</h2>

      <div className="mb-6">
        <p className="mb-4" style={{ color: theme.text.main }}>What do you think about this feature?</p>
        <div className="flex gap-3">
          {[
            { id: 'bad', icon: Frown, label: 'Bad' },
            { id: 'okay', icon: Meh, label: 'Okay' },
            { id: 'good', icon: Smile, label: 'Good' },
          ].map(({ id, icon: Icon, label }) => (
            <button
              key={id}
              onClick={() => setSelectedRating(id as typeof selectedRating)}
              className={`flex-1 flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all ${
                selectedRating === id ? 'border-opacity-100' : 'border-opacity-30'
              }`}
              style={{
                borderColor: selectedRating === id ? theme.action.primary : theme.border.subtle,
                backgroundColor: selectedRating === id ? `${theme.action.primary}10` : 'transparent',
              }}
            >
              <Icon size={32} style={{ color: selectedRating === id ? theme.action.primary : theme.text.secondary }} />
              <span style={{ color: selectedRating === id ? theme.text.main : theme.text.secondary }}>{label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="mb-6">
        <label className="block text-sm font-medium mb-2" style={{ color: theme.text.main }}>What are the main reasons for your rating?</label>
        <Textarea
          theme={theme}
          rows={4}
          placeholder="Tell us more..."
        />
      </div>

      <div className="space-y-3 mb-6">
        {[
          { id: 1, text: "I may be contacted about this feedback.", link: "Privacy Policy" },
          { id: 2, text: "I'd like to help improve by joining the", link: "Research Group" },
        ].map(({ id, text, link }) => (
          <Checkbox
            key={id}
            checked={checkboxes[id as keyof typeof checkboxes]}
            onCheckedChange={(checked) => setCheckboxes({ ...checkboxes, [id]: checked as boolean })}
            theme={theme}
            label={
              <span className="text-sm" style={{ color: theme.text.secondary }}>
                {text} <a href="#" style={{ color: theme.action.primary }}>{link}</a>.
              </span>
            }
          />
        ))}
      </div>

      <div className="flex gap-3">
        <Button theme={theme} variant="secondary" style={{ flex: 1 }}>Cancel</Button>
        <Button theme={theme} style={{ flex: 1 }}>Submit</Button>
      </div>
    </BaseCard>
  );
}
