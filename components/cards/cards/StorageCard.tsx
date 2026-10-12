import React from 'react';
import { BaseCard, ThemeColors } from '../BaseComponents';
import { Button, ProgressBar } from '../Molecules';
import { Cloud } from 'lucide-react';

export default function StorageCard({ theme }: { theme: ThemeColors }) {
  return (
    <BaseCard theme={theme} className="p-6">
      <div className="flex items-center gap-3 mb-6">
        <Cloud size={24} style={{ color: theme.action.primary }} strokeWidth={1.5}/>
        <h2 className="text-xl font-bold" style={{ color: theme.text.main }}>Storage</h2>
      </div>

      <div className="mb-6">
        <ProgressBar
          value={40}
          theme={theme}
          className="mb-2"
          height="8px"
        />
        <p className="text-sm" style={{ color: theme.text.secondary }}>12 GB of 30 GB used</p>
      </div>

      <Button theme={theme} className="w-full">Buy storage</Button>
    </BaseCard>
  );
}
