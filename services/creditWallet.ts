const WALLET_KEY = 'chromaforge_credit_wallet';
const WALLET_PATTERN = /^[A-Za-z0-9_-]{16,80}$/;

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

/** Keeps purchased credits when a signed-in account already has a wallet. */
export const adoptCreditWalletId = (id: string): void => {
  if (WALLET_PATTERN.test(id)) safeSet(WALLET_KEY, id);
};

/** Stable anonymous id for this browser's free credits and purchased packs. */
export const getCreditWalletId = (): string => {
  const existing = safeGet(WALLET_KEY);
  if (existing && WALLET_PATTERN.test(existing)) return existing;
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  const id = Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
  safeSet(WALLET_KEY, id);
  return id;
};
