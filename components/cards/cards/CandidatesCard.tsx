import React, { useState } from 'react';
import { BaseCard, ThemeColors } from '../BaseComponents';
import { Tag, IconButton, Switch } from '../Molecules';
import { Plus } from 'lucide-react';
import * as Avatar from '@radix-ui/react-avatar';

export default function CandidatesCard({ theme }: { theme: ThemeColors }) {
  const [switches, setSwitches] = useState({ 1: false, 2: true, 3: false });

  const candidates = [
    { id: 1, name: 'Lee Cooper', role: 'Ux-researcher', tag: 'Senior', tagVariant: 'primary' as const, avatar: 'https://i.postimg.cc/Hs4x3myF/image.png' },
    { id: 2, name: 'Esther Howard', role: 'GO developer', tag: 'Junior', tagVariant: 'secondary' as const, avatar: 'https://i.postimg.cc/JhRxhrR5/image.png' },
    { id: 3, name: 'Savannah Nguyen', role: 'Project manager', tag: 'Lead', tagVariant: 'tertiary' as const, avatar: 'https://i.postimg.cc/G3BK19Qw/image.png' },
  ];

  return (
    <BaseCard theme={theme} className="p-6" style={{ width: '500px', maxWidth: '500px' }}>
      <h2 className="text-xl font-bold mb-6" style={{ color: theme.text.main }}>Candidates review</h2>
      
      <div className="space-y-4">
        {candidates.map((candidate) => (
          <div key={candidate.id} className="flex items-center justify-between p-4 rounded-lg" style={{ backgroundColor: theme.bg.input }}>
            <div className="flex items-center gap-3 flex-1">
              <Avatar.Root className="w-12 h-12 rounded-full overflow-hidden">
                <Avatar.Image src={candidate.avatar} />
                <Avatar.Fallback style={{ backgroundColor: theme.action.primary, color: theme.text.onPrimary }}>
                  {candidate.name.split(' ').map(n => n[0]).join('')}
                </Avatar.Fallback>
              </Avatar.Root>
              <div className="flex-1">
                <h3 className="font-semibold mb-1" style={{ color: theme.text.main }}>{candidate.name}</h3>
                <p className="text-sm" style={{ color: theme.text.secondary }}>{candidate.role}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Tag theme={theme} variant={candidate.tagVariant === 'primary' ? 'primary' : candidate.tagVariant === 'secondary' ? 'secondary' : 'outline'}>{candidate.tag}</Tag>
              <div className="flex items-center gap-2">
                <label className="text-xs" style={{ color: theme.text.secondary }}>
                  {switches[candidate.id as keyof typeof switches] ? 'Mon, 2pm' : 'Book'}
                </label>
                <Switch
                  checked={switches[candidate.id as keyof typeof switches]}
                  onCheckedChange={(checked) => setSwitches({ ...switches, [candidate.id]: checked })}
                  theme={theme}
                />
              </div>
            </div>
          </div>
        ))}
        
        <button
          className="w-full p-4 rounded-lg border-2 border-dashed flex items-center justify-center gap-2 transition-colors"
          style={{
            borderColor: theme.border.subtle,
            color: theme.text.secondary,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = theme.action.primary;
            e.currentTarget.style.color = theme.action.primary;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = theme.border.subtle;
            e.currentTarget.style.color = theme.text.secondary;
          }}
        >
          <Plus size={20} strokeWidth={1.5}/>
          <span>Add new candidate</span>
        </button>
      </div>
    </BaseCard>
  );
}
