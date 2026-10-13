import { formatCompact } from '../services/credits.ts';
import { getCreditWalletId } from '../services/creditWallet.ts';

/** Signed-in account that sees unlimited credits on the owner free URL. */
export const UNLIMITED_ACCOUNT_EMAIL = 'ajsc50@gmail.com';

export const isUnlimitedAccount = (email: string | null | undefined): boolean =>
  (email || '').trim().toLowerCase() === UNLIMITED_ACCOUNT_EMAIL;

const letterOf = (value: string | null | undefined): string => {
  const match = (value || '').normalize('NFKD').match(/\p{L}|\p{N}/u);
  return match ? match[0].toLocaleUpperCase() : '';
};

/** First letter of the name, then the email. A symbol-only name does not hide the email. */
export const accountInitial = (
  name: string | null | undefined,
  email: string | null | undefined,
): string => letterOf(name) || letterOf(email);

export interface AccountIdentity {
  name: string | null;
  email: string | null;
}

/** Name and email from the signed-in account, including provider profiles. */
export const identityFromAccount = (account: {
  displayName?: string | null;
  email?: string | null;
  providerData?: ReadonlyArray<{ displayName?: string | null; email?: string | null } | null> | null;
} | null | undefined): AccountIdentity => {
  const providers = account?.providerData ?? [];
  const name = [account?.displayName, ...providers.map((item) => item?.displayName)]
    .find((value) => (value || '').trim())?.trim() || null;
  const email = [account?.email, ...providers.map((item) => item?.email)]
    .find((value) => (value || '').trim())?.trim() || null;
  return { name, email };
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
