import { formatCompact, FREE_CREDITS } from '../services/credits.ts';
import { getCreditWalletId } from '../services/creditWallet.ts';
import type { CreditAllowance } from '../services/creditClient.ts';

/** Signed-in account that sees unlimited credits on the owner free URL. */
export const UNLIMITED_ACCOUNT_EMAIL = 'ajsc50@gmail.com';

export const isUnlimitedAccount = (email: string | null | undefined): boolean =>
  (email || '').trim().toLowerCase() === UNLIMITED_ACCOUNT_EMAIL;

/** The owner account reads unlimited as soon as that email is signed in. */
export const showsUnlimited = (input: {
  signedIn: boolean;
  email: string | null | undefined;
  ownerSession: boolean;
}): boolean => input.signedIn && (input.ownerSession || isUnlimitedAccount(input.email));

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
  photo: string | null;
}

/** Name, email, and photo from the signed-in account, including provider profiles. */
export const identityFromAccount = (account: {
  displayName?: string | null;
  email?: string | null;
  photoURL?: string | null;
  providerData?: ReadonlyArray<{ displayName?: string | null; email?: string | null; photoURL?: string | null } | null> | null;
} | null | undefined): AccountIdentity => {
  const providers = account?.providerData ?? [];
  const name = [account?.displayName, ...providers.map((item) => item?.displayName)]
    .find((value) => (value || '').trim())?.trim() || null;
  const email = [account?.email, ...providers.map((item) => item?.email)]
    .find((value) => (value || '').trim())?.trim() || null;
  const photo = [account?.photoURL, ...providers.map((item) => item?.photoURL)]
    .find((value) => (value || '').trim())?.trim() || null;
  return { name, email, photo };
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

export interface CreditStatusInput {
  balance: number | null;
  allowance: CreditAllowance;
  signedIn: boolean;
  unlimited: boolean;
}

export interface CreditStatusCopy {
  meter: string;
  detail: string;
}

/** What a visitor sees about free credits, and what an account is for. */
export const creditStatusCopy = (input: CreditStatusInput): CreditStatusCopy => {
  if (input.unlimited) {
    return {
      meter: 'Unlimited',
      detail: 'This account has unlimited credits.',
    };
  }
  const free = FREE_CREDITS;
  if (!input.signedIn && input.allowance === 'blocked') {
    return {
      meter: '0 free',
      detail: `This network already used its ${free} free credits. A new browser here does not get more. Create an account to buy credits and keep generating.`,
    };
  }
  if (typeof input.balance === 'number' && Number.isFinite(input.balance)) {
    if (!input.signedIn) {
      return {
        meter: `${formatCompact(input.balance)} free`,
        detail: input.balance > 0
          ? `${input.balance} of ${free} free credits are left on this network. The number under a reply is what that reply used. Create an account to buy more. A new browser on this network does not get another ${free}.`
          : `The ${free} free credits on this network are used. Create an account to buy more.`,
      };
    }
    return {
      meter: `${formatCompact(input.balance)} credits`,
      detail: input.balance > 0
        ? `${input.balance} credits left. The number under a reply is what that reply used. Buy a pack to keep generating.`
        : 'No credits left. Buy a pack to keep generating.',
    };
  }
  return {
    meter: 'Credits',
    detail: `A new visitor gets ${free} free credits on this network. Create an account when you want to buy more.`,
  };
};

export interface DisplayedCredits {
  balance: number | null;
  allowance: CreditAllowance;
}

/** Wallet balance for accounts that are not the unlimited owner session. */
export const fetchDisplayedBalance = async (): Promise<DisplayedCredits> => {
  try {
    const response = await fetch('/api/credits', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ walletId: getCreditWalletId() }),
    });
    if (!response.ok) return { balance: null, allowance: 'unknown' };
    const data = await response.json();
    const allowance: CreditAllowance = data.allowance === 'granted' || data.allowance === 'blocked'
      ? data.allowance
      : 'unknown';
    return {
      balance: typeof data.balance === 'number' ? data.balance : null,
      allowance,
    };
  } catch {
    return { balance: null, allowance: 'unknown' };
  }
};
