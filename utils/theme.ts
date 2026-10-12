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

const FAVICON_VERSION = '6';

const syncFavicon = (resolved: 'light' | 'dark') => {
  const href = `${resolved === 'dark' ? '/favicon-dark.svg' : '/favicon-light.svg'}?v=${FAVICON_VERSION}`;
  const icon = document.querySelector<HTMLLinkElement>('link#favicon');
  const apple = document.querySelector<HTMLLinkElement>('link#apple-touch-icon');
  if (icon) icon.href = href;
  if (apple) apple.href = href;
};

export const applyThemePreference = (pref: ThemePreference) => {
  if (typeof document === 'undefined') return;
  const resolved = resolveTheme(pref);
  const root = document.documentElement;
  root.dataset.theme = resolved;
  root.style.colorScheme = resolved;
  root.classList.toggle('dark', resolved === 'dark');
  syncFavicon(resolved);
};

export const writeThemePreference = (pref: ThemePreference) => {
  try {
    localStorage.setItem(THEME_KEY, pref);
  } catch {
    /* ignore */
  }
  applyThemePreference(pref);
};
