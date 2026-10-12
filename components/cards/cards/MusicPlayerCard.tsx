import React, { useState } from 'react';
import { BaseCard, ThemeColors } from '../BaseComponents';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Shuffle,
  Repeat,
  Volume2,
} from 'lucide-react';
import * as Avatar from '@radix-ui/react-avatar';
import * as Progress from '@radix-ui/react-progress';
import * as Slider from '@radix-ui/react-slider';

export default function MusicPlayerCard({ theme }: { theme: ThemeColors }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(65);
  const [volume, setVolume] = useState([10]);

  return (
    <BaseCard theme={theme} className="p-6 relative overflow-hidden" style={{ maxWidth: '380px' }}>
      {/* Video Background */}
      <div className="absolute inset-0 z-0">
        <video
          autoPlay
          loop
          muted
          playsInline
          className="w-full h-full object-cover"
        >
          <source src="https://videos.pexels.com/video-files/5648482/5648482-uhd_2732_1440_25fps.mp4" type="video/mp4" />
        </video>
      </div>

      {/* Gradient Overlay - de abajo arriba, color primario puro a transparente */}
      <div 
        className="absolute inset-0 z-[1]"
        style={{
          background: `linear-gradient(to top, ${theme.action.primary} 0%, ${theme.action.primary}CC 30%, ${theme.action.primary}80 60%, transparent 100%)`
        }}
      />

      {/* Content */}
      <div className="relative z-10">
        <div className="flex items-center gap-4 mb-6">
          <Avatar.Root className="w-16 h-16 rounded-lg overflow-hidden shrink-0">
            <Avatar.Image
              src="https://i.postimg.cc/rFrzD5mq/image.png"
              alt="Album cover"
              className="w-full h-full object-cover"
            />
            <Avatar.Fallback
              className="flex items-center justify-center text-white font-semibold w-full h-full"
              style={{ backgroundColor: theme.action.primary }}
            >
              MU
            </Avatar.Fallback>
          </Avatar.Root>
          <div className="flex-1 min-w-0">
            <h3
              className="text-lg font-semibold mb-1 truncate text-white"
            >
              My uncle's gun
            </h3>
            <p
              className="text-sm truncate text-white/70"
            >
              Dagger
            </p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-6">
          <div className="flex justify-between text-xs mb-2 text-white">
            <span>0:00</span>
            <span>3:45</span>
          </div>
          <Progress.Root
            className="relative overflow-hidden rounded-full"
            style={{
              height: '4px',
              backgroundColor: 'rgba(255, 255, 255, 0.3)',
            }}
            value={progress}
          >
            <Progress.Indicator
              className="h-full transition-all duration-300"
              style={{
                width: `${progress}%`,
                backgroundColor: theme.action.primary,
              }}
            />
          </Progress.Root>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-center gap-3 mb-6">
          <button
            className="p-2 rounded-lg transition-all text-white hover:bg-white/20"
          >
            <Shuffle size={20} strokeWidth={1.5}/>
          </button>
          <button
            className="p-2 rounded-lg transition-all text-white hover:bg-white/20"
          >
            <SkipBack size={24} strokeWidth={1.5}/>
          </button>
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className="p-3 rounded-full transition-all bg-white text-black hover:bg-white/90"
          >
            {isPlaying ? <Pause size={24} strokeWidth={1.5}/> : <Play size={24} strokeWidth={1.5}/>}
          </button>
          <button
            className="p-2 rounded-lg transition-all text-white hover:bg-white/20"
          >
            <SkipForward size={24} strokeWidth={1.5}/>
          </button>
          <button
            className="p-2 rounded-lg transition-all text-white hover:bg-white/20"
          >
            <Repeat size={20} strokeWidth={1.5}/>
          </button>
        </div>

        {/* Volume - Slider funcional */}
        <div className="flex items-center gap-3">
          <Volume2 size={16} className="text-white" strokeWidth={1.5}/>
          <Slider.Root
            className="relative flex items-center select-none touch-none flex-1"
            value={volume}
            onValueChange={setVolume}
            max={100}
            step={1}
            style={{ height: '4px' }}
          >
            <Slider.Track
              className="relative flex-1 rounded-full"
              style={{
                height: '4px',
                backgroundColor: 'rgba(255, 255, 255, 0.3)',
              }}
            >
              <Slider.Range
                className="absolute rounded-full h-full"
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.5)',
                }}
              />
            </Slider.Track>
            <Slider.Thumb
              className="block w-3 h-3 bg-white rounded-full shadow-md focus:outline-none focus:ring-2 focus:ring-white/50"
            />
          </Slider.Root>
        </div>
      </div>
    </BaseCard>
  );
}
