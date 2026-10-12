import React from 'react';
import { BaseCard, ThemeColors } from '../BaseComponents';
import { Input, IconButton } from '../Molecules';
import { MoreHorizontal, Send, CheckCheck } from 'lucide-react';
import * as Avatar from '@radix-ui/react-avatar';

export default function ChatCard({ theme }: { theme: ThemeColors }) {
  return (
    <BaseCard theme={theme} className="p-6 flex flex-col" style={{ height: '600px' }}>
      <div className="flex items-center justify-between mb-4 pb-4 border-b" style={{ borderColor: theme.border.subtle }}>
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: theme.semantic.success.main }} />
          <Avatar.Root className="w-10 h-10 rounded-full overflow-hidden">
            <Avatar.Image src="https://i.postimg.cc/JhRxhrR5/image.png" />
            <Avatar.Fallback style={{ backgroundColor: theme.action.primary }} />
          </Avatar.Root>
          <span className="font-semibold" style={{ color: theme.text.main }}>Marine Yuen</span>
        </div>
        <IconButton theme={theme}>
          <MoreHorizontal size={20} strokeWidth={1.5}/>
        </IconButton>
      </div>

      <div className="flex-1 overflow-y-auto space-y-4 mb-4">
        <div className="text-xs text-center" style={{ color: theme.text.tertiary }}>10 mins ago</div>
        <div className="flex justify-end">
          <div className="max-w-[70%] p-3 rounded-lg" style={{ backgroundColor: theme.action.primary, color: theme.text.onPrimary }}>
            <p className="text-sm mb-1">Hi Noel, the team need access to the latest project</p>
            <CheckCheck size={14} className="inline ml-1" strokeWidth={1.5}/>
          </div>
        </div>
        <div className="text-xs text-center" style={{ color: theme.text.tertiary }}>5 mins ago</div>
        <div className="flex justify-start">
          <div className="max-w-[70%] p-3 rounded-lg" style={{ backgroundColor: theme.bg.input, color: theme.text.main }}>
            <p className="text-sm">Just sent an email</p>
          </div>
        </div>
        <div className="text-xs text-center" style={{ color: theme.text.tertiary }}>A moment ago</div>
        <div className="flex justify-end">
          <div className="max-w-[70%] p-3 rounded-lg" style={{ backgroundColor: theme.action.primary, color: theme.text.onPrimary }}>
            <p className="text-sm mb-1">Thanks!</p>
            <CheckCheck size={14} className="inline ml-1" strokeWidth={1.5}/>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 pt-4 border-t" style={{ borderColor: theme.border.subtle }}>
        <Input theme={theme} placeholder="Write your message here" className="flex-1" style={{ minWidth: '300px' }} />
        <IconButton theme={theme}>
          <Send size={20} strokeWidth={1.5}/>
        </IconButton>
      </div>
    </BaseCard>
  );
}
