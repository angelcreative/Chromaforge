export type ThemePreference = 'system' | 'light' | 'dark';

const THEME_KEY = 'chromaforge_theme';

export const readThemePreference = (): ThemePreference => {
  try {
    const raw = localStorage.getItem(THEME_KEY);
    if (raw === 'light' || raw === 'dark' || raw === 'system') return raw;
  } catch {
    /* ignore */
  }
  return 'system';
};

export const resolveTheme = (pref: ThemePreference): 'light' | 'dark' => {
  if (pref === 'light' || pref === 'dark') return pref;
  if (typeof window === 'undefined') return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
};

export const applyThemePreference = (pref: ThemePreference) => {
  if (typeof document === 'undefined') return;
  const resolved = resolveTheme(pref);
  const root = document.documentElement;
  root.dataset.theme = resolved;
  root.style.colorScheme = resolved;
  root.classList.toggle('dark', resolved === 'dark');
};

export const writeThemePreference = (pref: ThemePreference) => {
  try {
    localStorage.setItem(THEME_KEY, pref);
  } catch {
    /* ignore */
  }
  applyThemePreference(pref);
};
