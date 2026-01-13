import React from 'react';
import { BaseCard, ThemeColors } from '../BaseComponents';
import { Button, IconButton } from '../Molecules';
import { UserPlus, Mail, MessageCircle, Video, Calendar, ArrowRight } from 'lucide-react';
import * as Avatar from '@radix-ui/react-avatar';

export default function ContactProfileCard({ theme }: { theme: ThemeColors }) {
  return (
    <BaseCard theme={theme} className="p-6">
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center gap-4 flex-1">
          <Avatar.Root className="w-16 h-16 rounded-full overflow-hidden">
            <Avatar.Image src="https://i.postimg.cc/JhRxhrR5/image.png" />
            <Avatar.Fallback style={{ backgroundColor: theme.action.primary }} />
          </Avatar.Root>
          <div className="flex-1">
            <h2 className="text-xl font-bold mb-1" style={{ color: theme.text.main }}>Sarah Williams</h2>
            <p className="text-sm" style={{ color: theme.text.secondary }}>sarah.williams@company.com</p>
          </div>
        </div>
        <IconButton theme={theme}>
          <UserPlus size={20} />
        </IconButton>
      </div>

      <Button theme={theme} style={{ width: '100%', marginBottom: '12px' }} icon={<Mail size={16} />}>
        Send email
      </Button>

      <div className="flex gap-2 mb-6">
        <IconButton theme={theme} style={{ flex: 1 }}>
          <MessageCircle size={20} />
        </IconButton>
        <IconButton theme={theme} style={{ flex: 1 }}>
          <Video size={20} />
        </IconButton>
        <IconButton theme={theme} style={{ flex: 1 }}>
          <Calendar size={20} />
        </IconButton>
      </div>

      <a
        href="#"
        className="flex items-center justify-between text-sm font-semibold"
        style={{ color: theme.action.primary }}
      >
        View detailed profile
        <ArrowRight size={16} />
      </a>
    </BaseCard>
  );
}
