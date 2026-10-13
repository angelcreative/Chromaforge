import { createHash } from 'crypto';
import { mkdir, readFile, rename, writeFile } from 'fs/promises';
import { dirname } from 'path';
import { FREE_CREDITS, isWalletId } from './credits.js';
const NETWORK_SALT = 'chromaforge-free-network-v1';
const UID_PATTERN = /^[A-Za-z0-9]{8,128}$/;
const emptyLedger = () => ({ accounts: {}, grants: {}, networks: {}, identities: {} });
const stringRecord = (value) => {
    if (!value || typeof value !== 'object')
        return {};
    const out = {};
    for (const [key, item] of Object.entries(value)) {
        if (typeof item === 'string')
            out[key] = item;
    }
    return out;
};
/** One-way key for a client address. The ledger stores this, not the address. */
export const networkKeyForIp = (ip) => {
    const normalized = ip.trim().toLowerCase().replace(/^::ffff:/, '');
    return createHash('sha256').update(`${NETWORK_SALT}:${normalized}`).digest('hex');
};
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
                networks: stringRecord(parsed.networks),
                identities: stringRecord(parsed.identities),
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
    ensureFree(data, walletId, networkKey) {
        const existing = data.accounts[walletId];
        if (existing)
            return { account: existing, created: false };
        const key = networkKey.trim();
        const freeGranted = key.length > 0 && !data.networks[key];
        const account = {
            balance: freeGranted ? FREE_CREDITS : 0,
            freeGranted,
        };
        data.accounts[walletId] = account;
        if (freeGranted)
            data.networks[key] = walletId;
        return { account, created: true };
    }
    /**
     * Opens a wallet. A network receives the free allowance once.
     * A verified Firebase uid keeps the same wallet across browsers.
     */
    async open(requestedWalletId, networkKey = '', uid = null) {
        return this.lock(async () => {
            const data = await this.read();
            let walletId = isWalletId(requestedWalletId) ? requestedWalletId : '';
            let changed = false;
            if (uid && UID_PATTERN.test(uid)) {
                const bound = data.identities[uid];
                if (typeof bound === 'string' && isWalletId(bound)) {
                    walletId = bound;
                }
                else if (walletId) {
                    data.identities[uid] = walletId;
                    changed = true;
                }
            }
            if (!walletId)
                return { balance: 0, freeGranted: false, walletId: '' };
            const { account, created } = this.ensureFree(data, walletId, networkKey);
            if (created || changed)
                await this.write(data);
            return {
                balance: account.balance,
                freeGranted: account.freeGranted !== false,
                walletId,
            };
        });
    }
    async balance(walletId, networkKey = '') {
        return (await this.open(walletId, networkKey)).balance;
    }
    async debit(walletId, amount) {
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
    async grant(walletId, grantId, credits) {
        return this.lock(async () => {
            const data = await this.read();
            if (!data.accounts[walletId]) {
                data.accounts[walletId] = { balance: 0, freeGranted: false };
            }
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
