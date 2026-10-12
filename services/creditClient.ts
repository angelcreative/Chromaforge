import { getOwnerAccessCode } from './ownerAccess';
import { getCreditWalletId } from './creditWallet';

export interface CreditSnapshot {
  balance: number | null;
  owner: boolean;
  added?: number;
}

const postCredits = async (path: string, idToken?: string | null): Promise<CreditSnapshot | null> => {
  try {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (idToken) headers.Authorization = `Bearer ${idToken}`;
    const response = await fetch(path, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        walletId: getCreditWalletId(),
        ownerAccess: getOwnerAccessCode() || undefined,
      }),
    });
    if (!response.ok) return null;
    const data = await response.json();
    return {
      balance: typeof data.balance === 'number' ? data.balance : null,
      owner: data.owner === true,
      added: typeof data.added === 'number' ? data.added : 0,
    };
  } catch {
    return null;
  }
};

export const fetchCreditBalance = (): Promise<CreditSnapshot | null> => postCredits('/api/credits');

export const claimCreditPacks = (idToken?: string | null): Promise<CreditSnapshot | null> =>
  postCredits('/api/credits/claim', idToken);
