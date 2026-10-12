import React, { useEffect, useState } from 'react';
import { Monitor, Moon, Sun } from 'lucide-react';
import { ThemePreference, applyThemePreference, readThemePreference, writeThemePreference } from '../utils/theme';

const OPTIONS: { id: ThemePreference; label: string; icon: typeof Sun }[] = [
  { id: 'system', label: 'System', icon: Monitor },
  { id: 'light', label: 'Light', icon: Sun },
  { id: 'dark', label: 'Dark', icon: Moon },
];

const ThemeToggle: React.FC = () => {
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

  const index = Math.max(0, OPTIONS.findIndex((option) => option.id === pref));

  return (
    <div
      className="relative grid grid-cols-3 rounded-lg border border-border bg-background p-0.5"
      role="group"
      aria-label="Color theme"
    >
      <span
        aria-hidden
        className="absolute top-0.5 bottom-0.5 left-0.5 w-[calc(33.333%-2px)] rounded-md bg-primary transition-transform duration-200 ease-out"
        style={{ transform: `translateX(${index * 100}%)` }}
      />
      {OPTIONS.map((option) => {
        const active = pref === option.id;
        const Icon = option.icon;
        return (
          <button
            key={option.id}
            type="button"
            onClick={() => choose(option.id)}
            aria-label={option.label}
            aria-pressed={active}
            className={`relative z-10 flex h-8 items-center justify-center gap-1.5 rounded-md px-2 text-[13px] transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring sm:px-2.5 ${
              active ? 'text-primary-foreground' : 'text-foreground'
            }`}
          >
            <Icon className="size-3.5 shrink-0" aria-hidden />
            <span className="hidden sm:inline">{option.label}</span>
          </button>
        );
      })}
    </div>
  );
};

export default ThemeToggle;
