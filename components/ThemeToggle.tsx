import { motion } from 'motion/react';
import React, { useEffect, useState } from 'react';
import { Monitor, Moon, Sun } from 'lucide-react';
import { ThemePreference, applyThemePreference, readThemePreference, writeThemePreference } from '../utils/theme';
import { MotionButton, uiTransition, useReduced } from './uiMotion';

const OPTIONS: { id: ThemePreference; label: string; icon: typeof Sun }[] = [
  { id: 'system', label: 'System', icon: Monitor },
  { id: 'light', label: 'Light', icon: Sun },
  { id: 'dark', label: 'Dark', icon: Moon },
];

const ThemeToggle: React.FC<{ showLabels?: boolean; compact?: boolean }> = ({ showLabels = false, compact = false }) => {
  const [pref, setPref] = useState<ThemePreference>(() => readThemePreference());

  useEffect(() => {
    applyThemePreference(pref);
    if (pref !== 'system') return;
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = () => applyThemePreference('system');
    media.addEventListener('change', onChange);
    return () => media.removeEventListener('change', onChange);
  }, [pref]);

  const choose = (next: ThemePreference) => {
    setPref(next);
    writeThemePreference(next);
  };

  const reduce = useReduced();
  const index = Math.max(0, OPTIONS.findIndex((option) => option.id === pref));

  return (
    <div
      className={`relative grid grid-cols-3 rounded-lg border border-border bg-background p-0.5 ${compact ? 'w-full' : ''}`}
      role="group"
      aria-label="Color theme"
    >
      <motion.span
        aria-hidden
        className="absolute top-0.5 bottom-0.5 left-0.5 w-[calc(33.333%-2px)] rounded-md bg-primary"
        initial={false}
        animate={{ x: `${index * 100}%` }}
        transition={uiTransition(reduce, 0.18)}
      />
      {OPTIONS.map((option) => {
        const active = pref === option.id;
        const Icon = option.icon;
        return (
          <MotionButton
            key={option.id}
            type="button"
            onClick={() => choose(option.id)}
            aria-label={option.label}
            aria-pressed={active}
            className={`relative z-10 flex items-center justify-center rounded-md outline-none focus-visible:ring-2 focus-visible:ring-ring ${
              compact ? 'h-7 gap-1 px-1 text-[12px]' : 'h-8 gap-1.5 px-2 text-[13px] sm:px-2.5'
            } ${active ? 'text-primary-foreground' : 'text-foreground'}`}
          >
            <Icon className="size-3.5 shrink-0" strokeWidth={1.5} aria-hidden />
            <span className={`whitespace-nowrap ${compact || showLabels ? 'inline' : 'hidden sm:inline'}`}>{option.label}</span>
          </MotionButton>
        );
      })}
    </div>
  );
};

export default ThemeToggle;
