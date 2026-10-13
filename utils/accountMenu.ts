import { formatCompact } from '../services/credits.ts';
import { getCreditWalletId } from '../services/creditWallet.ts';

/** Signed-in account that sees unlimited credits on the owner free URL. */
export const UNLIMITED_ACCOUNT_EMAIL = 'ajsc50@gmail.com';

export const isUnlimitedAccount = (email: string | null | undefined): boolean =>
  (email || '').trim().toLowerCase() === UNLIMITED_ACCOUNT_EMAIL;

export const accountInitial = (
  name: string | null | undefined,
  email: string | null | undefined,
): string => {
  const source = (name || '').trim() || (email || '').trim();
  const match = source.match(/[A-Za-z0-9]/);
  return match ? match[0].toUpperCase() : '';
};

export interface CreditsMenuCopy {
  text: string;
  title: string;
  unlimited: boolean;
}

/** Menu label only. Who may use the owner URL is decided elsewhere. */
export const creditsMenuCopy = (input: {
  email: string | null | undefined;
  ownerSession: boolean;
  balance: number | null;
}): CreditsMenuCopy => {
  if (input.ownerSession && isUnlimitedAccount(input.email)) {
    return { text: 'Unlimited', title: 'Unlimited credits', unlimited: true };
  }
  if (typeof input.balance === 'number' && Number.isFinite(input.balance)) {
    return {
      text: `${formatCompact(input.balance)} credits`,
      title: `${input.balance} credits`,
      unlimited: false,
    };
  }
  return { text: 'Credits', title: 'Credits', unlimited: false };
};

/** Wallet balance for accounts that are not the unlimited owner session. */
export const fetchDisplayedBalance = async (): Promise<number | null> => {
  try {
    const response = await fetch('/api/credits', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ walletId: getCreditWalletId() }),
    });
    if (!response.ok) return null;
    const data = await response.json();
    return typeof data.balance === 'number' ? data.balance : null;
  } catch {
    return null;
  }
};
