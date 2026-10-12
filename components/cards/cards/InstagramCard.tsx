import React from 'react';
import { BaseCard, ThemeColors } from '../BaseComponents';
import { IconButton } from '../Molecules';
import { Heart, MessageCircle, Send, Bookmark, MoreHorizontal } from 'lucide-react';
import * as Avatar from '@radix-ui/react-avatar';

export default function InstagramCard({ theme }: { theme: ThemeColors }) {
  return (
    <BaseCard theme={theme} className="overflow-hidden">
      <div className="p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Avatar.Root className="w-10 h-10 rounded-full overflow-hidden">
            <Avatar.Image src="https://i.postimg.cc/G3BK19Qw/image.png" />
            <Avatar.Fallback style={{ backgroundColor: theme.action.primary }} />
          </Avatar.Root>
          <span className="font-semibold" style={{ color: theme.text.main }}>username</span>
        </div>
        <IconButton theme={theme}>
          <MoreHorizontal size={20} strokeWidth={1.5}/>
        </IconButton>
      </div>

      <img
        src="https://i.postimg.cc/fbwSWgQS/image.png"
        alt="Post"
        className="w-full aspect-square object-cover"
      />

      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <IconButton theme={theme}>
              <Heart size={24} strokeWidth={1.5}/>
            </IconButton>
            <IconButton theme={theme}>
              <MessageCircle size={24} strokeWidth={1.5}/>
            </IconButton>
            <IconButton theme={theme}>
              <Send size={24} strokeWidth={1.5}/>
            </IconButton>
          </div>
          <IconButton theme={theme}>
            <Bookmark size={24} strokeWidth={1.5}/>
          </IconButton>
        </div>
        <div className="text-sm font-semibold mb-1" style={{ color: theme.text.main }}>1,234 likes</div>
        <div className="text-sm" style={{ color: theme.text.main }}>
          <span className="font-semibold">username</span>{' '}
          <span style={{ color: theme.text.secondary }}>Beautiful sunset today! 🌅</span>
        </div>
      </div>
    </BaseCard>
  );
}
