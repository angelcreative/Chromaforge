import React from 'react';
import { BaseCard, ThemeColors } from '../BaseComponents';
import { Mic, Video, Monitor, PhoneOff, UserPlus } from 'lucide-react';
import * as Avatar from '@radix-ui/react-avatar';

export default function VideoCallCard({ theme }: { theme: ThemeColors }) {
  return (
    <BaseCard theme={theme} className="p-6">
      <div className="relative mb-4 rounded-lg overflow-hidden" style={{ backgroundColor: theme.bg.input, aspectRatio: '16/9' }}>
        <video
          autoPlay
          loop
          muted
          className="w-full h-full object-cover"
        >
          <source src="https://www.clipfly.ai/fvideo/uploads/799304980533596161/20250102/799305616808910848.mp4" type="video/mp4" />
        </video>
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2">
          <button className="w-10 h-10 rounded-lg flex items-center justify-center transition-all" style={{ backgroundColor: 'rgba(0,0,0,0.5)', color: 'white' }}>
            <Mic size={20} />
          </button>
          <button className="w-10 h-10 rounded-lg flex items-center justify-center transition-all" style={{ backgroundColor: 'rgba(0,0,0,0.5)', color: 'white' }}>
            <Video size={20} />
          </button>
          <button className="w-10 h-10 rounded-lg flex items-center justify-center transition-all" style={{ backgroundColor: 'rgba(0,0,0,0.5)', color: 'white' }}>
            <Monitor size={20} />
          </button>
          <button className="w-10 h-10 rounded-lg flex items-center justify-center transition-all" style={{ backgroundColor: theme.semantic.error.main, color: 'white' }}>
            <PhoneOff size={20} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <div className="relative rounded-lg overflow-hidden aspect-video">
          <video autoPlay loop muted className="w-full h-full object-cover">
            <source src="https://videos.pexels.com/video-files/4587757/4587757-uhd_2560_1440_25fps.mp4" type="video/mp4" />
          </video>
          <div className="absolute bottom-1 left-1 text-xs px-2 py-0.5 rounded" style={{ backgroundColor: 'rgba(0,0,0,0.7)', color: 'white' }}>
            John Lee
          </div>
        </div>
        <div className="relative rounded-lg overflow-hidden aspect-video" style={{ backgroundColor: theme.bg.input }}>
          <img src="https://i.postimg.cc/tTRrNdZn/image.png" className="w-full h-full object-cover opacity-50" />
          <div className="absolute bottom-1 left-1 text-xs px-2 py-0.5 rounded" style={{ backgroundColor: 'rgba(0,0,0,0.7)', color: 'white' }}>
            Anna Q.
          </div>
        </div>
        <div className="relative rounded-lg overflow-hidden aspect-video flex items-center justify-center cursor-pointer border-2 border-dashed" style={{ borderColor: theme.border.subtle }}>
          <div className="text-center">
            <UserPlus size={24} style={{ color: theme.text.tertiary }} className="mx-auto mb-1" />
            <div className="text-xs" style={{ color: theme.text.secondary }}>Add People</div>
          </div>
        </div>
      </div>
    </BaseCard>
  );
}
