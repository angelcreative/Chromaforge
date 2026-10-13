import { adoptCreditWalletId, getCreditWalletId } from './creditWallet';

export type CreditAllowance = 'granted' | 'blocked' | 'unknown';

export interface CreditSnapshot {
  balance: number | null;
  owner: boolean;
  added?: number;
  allowance: CreditAllowance;
  walletId: string | null;
}

const allowanceOf = (value: unknown): CreditAllowance =>
  value === 'granted' || value === 'blocked' ? value : 'unknown';

const postCredits = async (path: string, idToken?: string | null): Promise<CreditSnapshot | null> => {
  try {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (idToken) headers.Authorization = `Bearer ${idToken}`;
    const response = await fetch(path, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        walletId: getCreditWalletId(),
      }),
    });
    if (!response.ok) return null;
    const data = await response.json();
    if (typeof data.walletId === 'string') adoptCreditWalletId(data.walletId);
    return {
      balance: typeof data.balance === 'number' ? data.balance : null,
      owner: data.owner === true,
      added: typeof data.added === 'number' ? data.added : 0,
      allowance: allowanceOf(data.allowance),
      walletId: typeof data.walletId === 'string' ? data.walletId : null,
    };
  } catch {
    return null;
  }
};

export const fetchCreditBalance = (idToken?: string | null): Promise<CreditSnapshot | null> =>
  postCredits('/api/credits', idToken);

export const claimCreditPacks = (idToken?: string | null): Promise<CreditSnapshot | null> =>
  postCredits('/api/credits/claim', idToken);
