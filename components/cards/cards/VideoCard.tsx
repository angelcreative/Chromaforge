import React from 'react';
import { BaseCard, ThemeColors } from '../BaseComponents';
import { Button, IconButton } from '../Molecules';
import { Play, MoreVertical } from 'lucide-react';
import * as Avatar from '@radix-ui/react-avatar';

export default function VideoCard({ theme }: { theme: ThemeColors }) {
  return (
    <BaseCard theme={theme} className="overflow-hidden">
      <div className="relative group">
        <img
          src="https://i.postimg.cc/QxqDFGVb/image.png"
          alt="Video thumbnail"
          className="w-full aspect-video object-cover"
        />
        <div className="absolute bottom-2 right-2 px-2 py-1 rounded text-xs font-semibold" style={{ backgroundColor: 'rgba(0,0,0,0.8)', color: 'white' }}>
          14:35
        </div>
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          <Button theme={theme} style={{ borderRadius: '50%', width: '56px', height: '56px', padding: 0 }}>
            <Play size={24} strokeWidth={1.5}/>
          </Button>
        </div>
      </div>

      <div className="p-4">
        <div className="flex items-start gap-3">
          <Avatar.Root className="w-10 h-10 rounded-full overflow-hidden relative">
            <Avatar.Image src="https://i.postimg.cc/cJgPMV1P/image.png" />
            <Avatar.Fallback style={{ backgroundColor: theme.action.primary }} />
            <div className="absolute bottom-0 right-0 w-3 h-3 rounded-full border-2" style={{ backgroundColor: theme.semantic.success.main, borderColor: theme.bg.card }} />
          </Avatar.Root>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold mb-1 line-clamp-2" style={{ color: theme.text.main }}>The path of the warrior</h3>
            <div className="text-sm mb-1" style={{ color: theme.text.secondary }}>Warfare</div>
            <div className="text-xs flex items-center gap-2" style={{ color: theme.text.tertiary }}>
              <span>245K views</span>
              <span>•</span>
              <span>3 days ago</span>
            </div>
          </div>
          <IconButton theme={theme}>
            <MoreVertical size={20} strokeWidth={1.5}/>
          </IconButton>
        </div>
      </div>
    </BaseCard>
  );
}
