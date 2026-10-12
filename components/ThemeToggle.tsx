import React, { useEffect, useState } from 'react';
import { ThemePreference, applyThemePreference, readThemePreference, writeThemePreference } from '../utils/theme';

const OPTIONS: { id: ThemePreference; label: string }[] = [
  { id: 'system', label: 'System' },
  { id: 'light', label: 'Light' },
  { id: 'dark', label: 'Dark' },
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

  return (
    <div
      className="flex items-center rounded-lg border border-slate-700 bg-slate-800 p-0.5"
      role="group"
      aria-label="Color theme"
    >
      {OPTIONS.map((option) => {
        const active = pref === option.id;
        return (
          <button
            key={option.id}
            type="button"
            onClick={() => choose(option.id)}
            aria-pressed={active}
            className={`px-2 py-1 text-[11px] font-medium rounded-md transition-colors ${
              active
                ? 'bg-indigo-600 text-white'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
};

export default ThemeToggle;
