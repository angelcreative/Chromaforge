import { createHash } from 'crypto';
import { mkdir, readFile, rename, writeFile } from 'fs/promises';
import { dirname } from 'path';
import { FREE_CREDITS, isWalletId } from './credits.js';

interface Account {
  balance: number;
  /** False when this wallet was refused the free allowance. Missing means a legacy wallet that already received it. */
  freeGranted?: boolean;
}

interface LedgerFile {
  accounts: Record<string, Account>;
  grants: Record<string, string>;
  /** Hash of a client network, mapped to the wallet that received the free allowance. */
  networks: Record<string, string>;
  /** Firebase uid mapped to the wallet that holds that account's credits. */
  identities: Record<string, string>;
}

export interface WalletSnapshot {
  balance: number;
  freeGranted: boolean;
  walletId: string;
}

const NETWORK_SALT = 'chromaforge-free-network-v1';
const UID_PATTERN = /^[A-Za-z0-9]{8,128}$/;

const emptyLedger = (): LedgerFile => ({ accounts: {}, grants: {}, networks: {}, identities: {} });

const stringRecord = (value: unknown): Record<string, string> => {
  if (!value || typeof value !== 'object') return {};
  const out: Record<string, string> = {};
  for (const [key, item] of Object.entries(value as Record<string, unknown>)) {
    if (typeof item === 'string') out[key] = item;
  }
  return out;
};

/** One-way key for a client address. The ledger stores this, not the address. */
export const networkKeyForIp = (ip: string): string => {
  const normalized = ip.trim().toLowerCase().replace(/^::ffff:/, '');
  return createHash('sha256').update(`${NETWORK_SALT}:${normalized}`).digest('hex');
};

/** Server-side credit balances. The browser cannot write this file. */
export class CreditLedger {
  private chain: Promise<unknown> = Promise.resolve();
  private cache: LedgerFile | null = null;
  private cachePath: string | null = null;

  constructor(private readonly filePath: string) {}

  private location(): string {
    return process.env.CREDIT_LEDGER_PATH || this.filePath;
  }

  private async read(): Promise<LedgerFile> {
    const filePath = this.location();
    if (this.cache && this.cachePath === filePath) return this.cache;
    try {
      const raw = await readFile(filePath, 'utf8');
      const parsed = JSON.parse(raw) as Partial<LedgerFile>;
      this.cache = {
        accounts: parsed.accounts && typeof parsed.accounts === 'object' ? parsed.accounts : {},
        grants: parsed.grants && typeof parsed.grants === 'object' ? parsed.grants : {},
        networks: stringRecord(parsed.networks),
        identities: stringRecord(parsed.identities),
      };
    } catch {
      this.cache = emptyLedger();
    }
    this.cachePath = filePath;
    return this.cache;
  }

  private async write(data: LedgerFile): Promise<void> {
    const filePath = this.location();
    await mkdir(dirname(filePath), { recursive: true });
    const tmp = `${filePath}.${process.pid}.tmp`;
    await writeFile(tmp, JSON.stringify(data));
    await rename(tmp, filePath);
    this.cache = data;
    this.cachePath = filePath;
  }

  private lock<T>(fn: () => Promise<T>): Promise<T> {
    const run = this.chain.then(fn, fn);
    this.chain = run.then(() => undefined, () => undefined);
    return run;
  }

  private ensureFree(data: LedgerFile, walletId: string, networkKey: string): { account: Account; created: boolean } {
    const existing = data.accounts[walletId];
    if (existing) return { account: existing, created: false };
    const key = networkKey.trim();
    const freeGranted = key.length > 0 && !data.networks[key];
    const account: Account = {
      balance: freeGranted ? FREE_CREDITS : 0,
      freeGranted,
    };
    data.accounts[walletId] = account;
    if (freeGranted) data.networks[key] = walletId;
    return { account, created: true };
  }

  /**
   * Opens a wallet. A network receives the free allowance once.
   * A verified Firebase uid keeps the same wallet across browsers.
   */
  async open(requestedWalletId: string, networkKey = '', uid: string | null = null): Promise<WalletSnapshot> {
    return this.lock(async () => {
      const data = await this.read();
      let walletId = isWalletId(requestedWalletId) ? requestedWalletId : '';
      let changed = false;
      if (uid && UID_PATTERN.test(uid)) {
        const bound = data.identities[uid];
        if (typeof bound === 'string' && isWalletId(bound)) {
          walletId = bound;
        } else if (walletId) {
          data.identities[uid] = walletId;
          changed = true;
        }
      }
      if (!walletId) return { balance: 0, freeGranted: false, walletId: '' };
      const { account, created } = this.ensureFree(data, walletId, networkKey);
      if (created || changed) await this.write(data);
      return {
        balance: account.balance,
        freeGranted: account.freeGranted !== false,
        walletId,
      };
    });
  }

  async balance(walletId: string, networkKey = ''): Promise<number> {
    return (await this.open(walletId, networkKey)).balance;
  }

  async debit(walletId: string, amount: number): Promise<{ spent: number; remaining: number }> {
    return this.lock(async () => {
      const data = await this.read();
      if (!data.accounts[walletId]) {
        data.accounts[walletId] = { balance: 0, freeGranted: false };
      }
      const account = data.accounts[walletId];
      const spent = Math.max(0, Math.min(account.balance, Math.floor(amount)));
      account.balance -= spent;
      await this.write(data);
      return { spent, remaining: account.balance };
    });
  }

  async grant(walletId: string, grantId: string, credits: number): Promise<{ added: number; balance: number }> {
    return this.lock(async () => {
      const data = await this.read();
      if (!data.accounts[walletId]) {
        data.accounts[walletId] = { balance: 0, freeGranted: false };
      }
      const account = data.accounts[walletId];
      if (data.grants[grantId]) return { added: 0, balance: account.balance };
      const added = Math.max(0, Math.floor(credits));
      account.balance += added;
      data.grants[grantId] = walletId;
      await this.write(data);
      return { added, balance: account.balance };
    });
  }
}
