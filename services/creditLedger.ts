import { mkdir, readFile, rename, writeFile } from 'fs/promises';
import { dirname } from 'path';
import { FREE_CREDITS } from './credits.js';

interface Account {
  balance: number;
}

interface LedgerFile {
  accounts: Record<string, Account>;
  grants: Record<string, string>;
}

const emptyLedger = (): LedgerFile => ({ accounts: {}, grants: {} });

/** Server-side credit balances. The browser cannot write this file. */
export class CreditLedger {
  private chain: Promise<unknown> = Promise.resolve();
  private cache: LedgerFile | null = null;

  constructor(private readonly filePath: string) {}

  private async read(): Promise<LedgerFile> {
    if (this.cache) return this.cache;
    try {
      const raw = await readFile(this.filePath, 'utf8');
      const parsed = JSON.parse(raw) as Partial<LedgerFile>;
      this.cache = {
        accounts: parsed.accounts && typeof parsed.accounts === 'object' ? parsed.accounts : {},
        grants: parsed.grants && typeof parsed.grants === 'object' ? parsed.grants : {},
      };
    } catch {
      this.cache = emptyLedger();
    }
    return this.cache;
  }

  private async write(data: LedgerFile): Promise<void> {
    await mkdir(dirname(this.filePath), { recursive: true });
    const tmp = `${this.filePath}.${process.pid}.tmp`;
    await writeFile(tmp, JSON.stringify(data));
    await rename(tmp, this.filePath);
    this.cache = data;
  }

  private lock<T>(fn: () => Promise<T>): Promise<T> {
    const run = this.chain.then(fn, fn);
    this.chain = run.then(() => undefined, () => undefined);
    return run;
  }

  async balance(walletId: string): Promise<number> {
    return this.lock(async () => {
      const data = await this.read();
      const existing = data.accounts[walletId];
      if (existing) return existing.balance;
      data.accounts[walletId] = { balance: FREE_CREDITS };
      await this.write(data);
      return FREE_CREDITS;
    });
  }

  async debit(walletId: string, amount: number): Promise<{ spent: number; remaining: number }> {
    return this.lock(async () => {
      const data = await this.read();
      if (!data.accounts[walletId]) data.accounts[walletId] = { balance: FREE_CREDITS };
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
      if (!data.accounts[walletId]) data.accounts[walletId] = { balance: FREE_CREDITS };
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
