import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm, writeFile, mkdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import http from 'node:http';
import {
  FREE_CREDITS,
  buildCheckoutSession,
  buildPalettePrompt,
  callModelIfAllowed,
  creditsForTokens,
  estimateRequestCredits,
  formatCompact,
  grantsFromCustomerDocuments,
  prepareTurn,
  tokensFromUsage,
} from '../dist-server/services/credits.js';
import { CreditLedger } from '../dist-server/services/creditLedger.js';

const shortPrompt = () => buildPalettePrompt(
  [{ role: 'user', text: 'A calm coastal studio' }],
  [],
);

test('compact numbers', () => {
  assert.equal(formatCompact(30), '30');
  assert.equal(formatCompact(600), '600');
  assert.equal(formatCompact(1000), '1.0K');
  assert.equal(formatCompact(1249), '1.2K');
  assert.equal(formatCompact(1250), '1.3K');
  assert.equal(formatCompact(2400), '2.4K');
  assert.equal(formatCompact(999949), '999.9K');
  assert.equal(formatCompact(999950), '1.0M');
});

test('a short palette is about ten credits, so thirty covers about three', () => {
  const estimate = estimateRequestCredits(shortPrompt());
  assert.ok(estimate >= 8 && estimate <= 12, `estimate was ${estimate}`);
  assert.ok(FREE_CREDITS / estimate >= 2.5);
});

test('free balance counts down after a reply', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'chroma-credits-'));
  try {
    const ledger = new CreditLedger(join(dir, 'ledger.json'));
    const walletId = 'wallet000000000001';
    assert.equal(await ledger.balance(walletId), 30);
    const prompt = shortPrompt();
    const decision = prepareTurn({ owner: false, walletId, prompt, balance: 30 });
    assert.equal(decision.kind, 'metered');
    let calls = 0;
    const metered = await callModelIfAllowed(decision, async () => {
      calls += 1;
      return { text: '{"paletteName":"Coast"}' };
    });
    assert.equal(calls, 1);
    assert.equal(metered.kind, 'called');
    const usage = tokensFromUsage(
      { promptTokenCount: 700, candidatesTokenCount: 180 },
      { prompt, output: 'palette' },
    );
    const settled = await ledger.debit(walletId, creditsForTokens(usage.inputTokens, usage.outputTokens));
    assert.ok(settled.spent >= 1);
    assert.ok(settled.remaining < 30);
    assert.equal(await ledger.balance(walletId), settled.remaining);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test('empty balance does not call Gemini', async () => {
  const prompt = shortPrompt();
  const decision = prepareTurn({ owner: false, walletId: 'wallet000000000002', prompt, balance: 0 });
  assert.equal(decision.kind, 'refuse');
  let calls = 0;
  const metered = await callModelIfAllowed(decision, async () => {
    calls += 1;
    return { text: 'should not run' };
  });
  assert.equal(calls, 0);
  assert.equal(metered.kind, 'refused');
  if (metered.kind === 'refused') {
    assert.equal(metered.status, 402);
    assert.equal(metered.body.paymentRequired, true);
  }
});

test('owner bypass does not spend credits', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'chroma-owner-'));
  try {
    const ledger = new CreditLedger(join(dir, 'ledger.json'));
    const walletId = 'wallet000000000003';
    await ledger.balance(walletId);
    const decision = prepareTurn({ owner: true, walletId, prompt: shortPrompt(), balance: 0 });
    assert.equal(decision.kind, 'owner');
    let calls = 0;
    const metered = await callModelIfAllowed(decision, async () => {
      calls += 1;
      return 'ok';
    });
    assert.equal(calls, 1);
    assert.equal(metered.kind, 'called');
    assert.equal(await ledger.balance(walletId), 30);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test('a credit pack can be bought once', async () => {
  const small = buildCheckoutSession('pack_600', {
    origin: 'https://chromaforge.app',
    walletId: 'wallet000000000004',
  });
  assert.equal(small.mode, 'payment');
  assert.equal(small.line_items[0].price_data.unit_amount, 999);
  assert.equal(small.line_items[0].price_data.currency, 'usd');
  assert.equal(small.metadata.credits, '600');
  assert.match(small.success_url, /checkout=success&pack=pack_600/);

  const yearly = buildCheckoutSession('pack_2400', {
    origin: 'https://chromaforge.app/',
    path: '/',
    walletId: 'wallet000000000004',
  });
  assert.equal(yearly.mode, 'subscription');
  assert.equal(yearly.line_items[0].price_data.unit_amount, 3900);
  assert.equal(yearly.line_items[0].price_data.recurring.interval, 'year');

  const priced = buildCheckoutSession('pack_600', {
    origin: 'https://chromaforge.app',
    walletId: 'wallet000000000004',
    priceId: 'price_test_600',
  });
  assert.equal(priced.price, 'price_test_600');
  assert.equal(priced.line_items, undefined);

  const dir = await mkdtemp(join(tmpdir(), 'chroma-pack-'));
  try {
    const ledger = new CreditLedger(join(dir, 'ledger.json'));
    const walletId = 'wallet000000000004';
    const grants = grantsFromCustomerDocuments(
      [{
        name: 'projects/p/databases/(default)/documents/customers/u/payments/pi_1',
        fields: {
          status: { stringValue: 'succeeded' },
          amount: { integerValue: '999' },
          metadata: { mapValue: { fields: { pack: { stringValue: 'pack_600' } } } },
        },
      }],
      [{
        name: 'projects/p/databases/(default)/documents/customers/u/subscriptions/sub_1',
        fields: {
          status: { stringValue: 'active' },
          metadata: { mapValue: { fields: { pack: { stringValue: 'pack_2400' } } } },
        },
      }],
    );
    assert.deepEqual(grants.map((grant) => grant.credits).sort((a, b) => a - b), [600, 2400]);
    let added = 0;
    for (const grant of grants) {
      added += (await ledger.grant(walletId, grant.id, grant.credits)).added;
    }
    added += (await ledger.grant(walletId, grants[0].id, grants[0].credits)).added;
    assert.equal(added, 3000);
    assert.equal(await ledger.balance(walletId), 3030);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test('the palette route refuses an empty balance before Gemini', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'chroma-http-'));
  const ledgerPath = join(dir, 'ledger.json');
  process.env.CREDIT_LEDGER_PATH = ledgerPath;
  await mkdir(dir, { recursive: true });
  const walletId = 'wallet000000000005';
  await writeFile(ledgerPath, JSON.stringify({
    accounts: { [walletId]: { balance: 0 } },
    grants: {},
  }));
  const { app } = await import('../dist-server/server.js');
  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const { port } = server.address();
  try {
    const response = await fetch(`http://127.0.0.1:${port}/api/palette`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        history: [{ role: 'user', text: 'A calm coastal studio' }],
        currentPalette: [],
        walletId,
      }),
    });
    const body = await response.json();
    assert.equal(response.status, 402);
    assert.equal(body.paymentRequired, true);
    assert.equal(body.creditsRemaining, 0);
    assert.equal(body.colors.length, 0);
  } finally {
    await new Promise((resolve) => server.close(resolve));
    await rm(dir, { recursive: true, force: true });
  }
});
