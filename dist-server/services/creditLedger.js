import { mkdir, readFile, rename, writeFile } from 'fs/promises';
import { dirname } from 'path';
import { FREE_CREDITS } from './credits.js';
const emptyLedger = () => ({ accounts: {}, grants: {} });
/** Server-side credit balances. The browser cannot write this file. */
export class CreditLedger {
    filePath;
    chain = Promise.resolve();
    cache = null;
    cachePath = null;
    constructor(filePath) {
        this.filePath = filePath;
    }
    location() {
        return process.env.CREDIT_LEDGER_PATH || this.filePath;
    }
    async read() {
        const filePath = this.location();
        if (this.cache && this.cachePath === filePath)
            return this.cache;
        try {
            const raw = await readFile(filePath, 'utf8');
            const parsed = JSON.parse(raw);
            this.cache = {
                accounts: parsed.accounts && typeof parsed.accounts === 'object' ? parsed.accounts : {},
                grants: parsed.grants && typeof parsed.grants === 'object' ? parsed.grants : {},
            };
        }
        catch {
            this.cache = emptyLedger();
        }
        this.cachePath = filePath;
        return this.cache;
    }
    async write(data) {
        const filePath = this.location();
        await mkdir(dirname(filePath), { recursive: true });
        const tmp = `${filePath}.${process.pid}.tmp`;
        await writeFile(tmp, JSON.stringify(data));
        await rename(tmp, filePath);
        this.cache = data;
        this.cachePath = filePath;
    }
    lock(fn) {
        const run = this.chain.then(fn, fn);
        this.chain = run.then(() => undefined, () => undefined);
        return run;
    }
    async balance(walletId) {
        return this.lock(async () => {
            const data = await this.read();
            const existing = data.accounts[walletId];
            if (existing)
                return existing.balance;
            data.accounts[walletId] = { balance: FREE_CREDITS };
            await this.write(data);
            return FREE_CREDITS;
        });
    }
    async debit(walletId, amount) {
        return this.lock(async () => {
            const data = await this.read();
            if (!data.accounts[walletId])
                data.accounts[walletId] = { balance: FREE_CREDITS };
            const account = data.accounts[walletId];
            const spent = Math.max(0, Math.min(account.balance, Math.floor(amount)));
            account.balance -= spent;
            await this.write(data);
            return { spent, remaining: account.balance };
        });
    }
    async grant(walletId, grantId, credits) {
        return this.lock(async () => {
            const data = await this.read();
            if (!data.accounts[walletId])
                data.accounts[walletId] = { balance: FREE_CREDITS };
            const account = data.accounts[walletId];
            if (data.grants[grantId])
                return { added: 0, balance: account.balance };
            const added = Math.max(0, Math.floor(credits));
            account.balance += added;
            data.grants[grantId] = walletId;
            await this.write(data);
            return { added, balance: account.balance };
        });
    }
}
