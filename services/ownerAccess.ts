const OWNER_CODE_KEY = 'chromaforge_owner_access';
const OWNER_FLAG_KEY = 'chromaforge_owner_unlocked';
const MIN_LENGTH = 16;

const safeGet = (key: string): string | null => {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
};

const safeSet = (key: string, value: string) => {
  try {
    localStorage.setItem(key, value);
  } catch {
    /* ignore quota / private mode */
  }
};

const safeRemove = (key: string) => {
  try {
    localStorage.removeItem(key);
  } catch {
    /* ignore */
  }
};

/** Read `?access=` once, store it, and drop it from the address bar. */
export const captureOwnerAccessFromUrl = (): string | null => {
  if (typeof window === 'undefined') return null;
  try {
    const params = new URLSearchParams(window.location.search);
    const fromUrl = params.get('access');
    if (fromUrl && fromUrl.length >= MIN_LENGTH) {
      safeSet(OWNER_CODE_KEY, fromUrl);
      params.delete('access');
      const qs = params.toString();
      const next = `${window.location.pathname}${qs ? `?${qs}` : ''}${window.location.hash}`;
      window.history.replaceState({}, document.title, next);
      return fromUrl;
    }
  } catch {
    /* ignore malformed URLs */
  }
  return safeGet(OWNER_CODE_KEY);
};

export const getOwnerAccessCode = (): string | null => safeGet(OWNER_CODE_KEY);

export const hasOwnerFlag = (): boolean => safeGet(OWNER_FLAG_KEY) === '1';

export const markOwnerUnlocked = () => safeSet(OWNER_FLAG_KEY, '1');

export const clearOwnerAccess = () => {
  safeRemove(OWNER_CODE_KEY);
  safeRemove(OWNER_FLAG_KEY);
};

export type OwnerCheck = 'yes' | 'no' | 'unknown';

/** Ask the server whether the stored code matches OWNER_ACCESS_CODE. */
export const confirmOwnerAccess = async (code: string): Promise<OwnerCheck> => {
  try {
    const res = await fetch('/api/owner-unlock', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ access: code }),
    });
    if (res.ok) return 'yes';
    if (res.status === 401 || res.status === 403) return 'no';
    return 'unknown';
  } catch {
    return 'unknown';
  }
};
