import test from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
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
  prepareTurn,
  tokensFromUsage,
} from '../dist-server/services/credits.js';
import { CreditLedger } from '../dist-server/services/creditLedger.js';
import { OWNER_ACCOUNT_EMAIL, isOwnerAccount } from '../dist-server/services/ownerGate.js';
import { grantFromStripeEvent, verifyStripeSignature } from '../dist-server/services/stripeFulfillment.js';

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
  assert.equal(small.payment_intent_data.metadata.walletId, 'wallet000000000004');
  assert.match(small.success_url, /checkout=success&pack=pack_600/);

  const yearly = buildCheckoutSession('pack_2400', {
    origin: 'https://chromaforge.app/',
    path: '/',
    walletId: 'wallet000000000004',
  });
  assert.equal(yearly.mode, 'subscription');
  assert.equal(yearly.line_items[0].price_data.unit_amount, 3900);
  assert.equal(yearly.line_items[0].price_data.recurring.interval, 'year');
  assert.equal(yearly.subscription_data.metadata.walletId, 'wallet000000000004');
  assert.equal(yearly.payment_intent_data, undefined);

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
    const first = await ledger.grant(walletId, 'stripe:pi:pi_once', 600);
    const replay = await ledger.grant(walletId, 'stripe:pi:pi_once', 600);
    const yearlyGrant = await ledger.grant(walletId, 'stripe:in:in_once', 2400);
    assert.equal(first.added, 600);
    assert.equal(replay.added, 0);
    assert.equal(yearlyGrant.added, 2400);
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

const wallet = 'wallet000000000099';

const paidSession = (overrides = {}) => ({
  id: 'evt_paid',
  type: 'checkout.session.completed',
  data: {
    object: {
      id: 'cs_paid',
      payment_status: 'paid',
      currency: 'usd',
      amount_total: 999,
      mode: 'payment',
      payment_intent: 'pi_paid',
      client_reference_id: wallet,
      metadata: { pack: 'pack_2400', credits: '999999', walletId: wallet },
      ...overrides,
    },
  },
});

test('only a confirmed pack price becomes credits', () => {
  assert.equal(isOwnerAccount({ email: OWNER_ACCOUNT_EMAIL }), true);
  assert.equal(isOwnerAccount({ email: ` ${OWNER_ACCOUNT_EMAIL.toUpperCase()} ` }), true);
  assert.equal(isOwnerAccount({ email: `nope-${OWNER_ACCOUNT_EMAIL}` }), false);
  assert.equal(isOwnerAccount(null), false);

  const secret = 'whsec_test_only';
  const payload = JSON.stringify({ id: 'evt_test' });
  const timestamp = 1_700_000_000;
  const hex = crypto.createHmac('sha256', secret).update(`${timestamp}.${payload}`).digest('hex');
  const header = `t=${timestamp},v1=${hex}`;
  assert.equal(verifyStripeSignature(payload, header, secret, timestamp * 1000), true);
  assert.equal(verifyStripeSignature(payload, header, 'whsec_other', timestamp * 1000), false);
  assert.equal(verifyStripeSignature(`${payload} `, header, secret, timestamp * 1000), false);
  assert.equal(verifyStripeSignature(payload, header, secret, (timestamp + 301) * 1000), false);
  assert.equal(verifyStripeSignature(payload, undefined, secret, timestamp * 1000), false);

  assert.deepEqual(grantFromStripeEvent(paidSession()), {
    id: 'stripe:pi:pi_paid',
    walletId: wallet,
    credits: 600,
  });
  assert.equal(grantFromStripeEvent(paidSession({ amount_total: 100 })), null);
  assert.equal(grantFromStripeEvent(paidSession({ currency: 'eur' })), null);
  assert.equal(grantFromStripeEvent(paidSession({ payment_status: 'unpaid' })), null);
  assert.equal(grantFromStripeEvent(paidSession({
    client_reference_id: 'wallet000000000098',
  })), null);
  assert.equal(grantFromStripeEvent({
    type: 'customer.subscription.updated',
    data: { object: { status: 'trialing', metadata: { pack: 'pack_2400', credits: '2400', walletId: wallet } } },
  }), null);
  assert.equal(grantFromStripeEvent({
    type: 'payment_intent.succeeded',
    data: { object: { amount_received: 999, currency: 'usd', status: 'succeeded', metadata: { walletId: wallet } } },
  }), null);

  const yearly = grantFromStripeEvent(paidSession({
    id: 'cs_year',
    mode: 'subscription',
    amount_total: 3900,
    payment_intent: null,
    invoice: 'in_year',
  }));
  assert.deepEqual(yearly, { id: 'stripe:in:in_year', walletId: wallet, credits: 2400 });
  assert.deepEqual(grantFromStripeEvent({
    type: 'invoice.paid',
    data: {
      object: {
        id: 'in_year',
        status: 'paid',
        currency: 'usd',
        amount_paid: 3900,
        subscription: 'sub_year',
        billing_reason: 'subscription_create',
        metadata: { credits: '1', pack: 'pack_600' },
        parent: { subscription_details: { metadata: { walletId: wallet } } },
      },
    },
  }), yearly);
});

test('a paid action is refused unless stripe or the owner account confirms it', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'chroma-gate-'));
  const ledgerPath = join(dir, 'ledger.json');
  const previous = {
    ledger: process.env.CREDIT_LEDGER_PATH,
    key: process.env.API_KEY,
    webhook: process.env.STRIPE_WEBHOOK_SECRET,
    owner: process.env.OWNER_ACCESS_CODE,
    creator: process.env.CREATOR_BYPASS_SECRET,
    fetch: globalThis.fetch,
  };
  process.env.CREDIT_LEDGER_PATH = ledgerPath;
  process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test_only';
  process.env.OWNER_ACCESS_CODE = 'query-secret-not-a-grant';
  process.env.CREATOR_BYPASS_SECRET = 'header-secret-not-a-grant';
  delete process.env.API_KEY;
  const emptyWallet = 'wallet000000000098';
  await writeFile(ledgerPath, JSON.stringify({
    accounts: {
      [emptyWallet]: { balance: 0 },
      [wallet]: { balance: 0 },
    },
    grants: {},
  }));
  const { app } = await import('../dist-server/server.js');
  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const { port } = server.address();
  const realFetch = previous.fetch.bind(globalThis);
  globalThis.fetch = async (input, init) => {
    const url = String(input);
    if (url.includes('identitytoolkit.googleapis.com')) {
      const sent = JSON.parse(init.body);
      if (sent.idToken === 'owner-session') {
        return Response.json({ users: [{ email: OWNER_ACCOUNT_EMAIL, emailVerified: true }] });
      }
      if (sent.idToken === 'other-session') {
        return Response.json({ users: [{ email: 'guest@example.com', emailVerified: true }] });
      }
      return new Response(JSON.stringify({ error: { message: 'INVALID_ID_TOKEN' } }), { status: 400 });
    }
    return realFetch(input, init);
  };

  const sign = (payload, timestamp = Math.floor(Date.now() / 1000)) => {
    const body = JSON.stringify(payload);
    const hex = crypto.createHmac('sha256', process.env.STRIPE_WEBHOOK_SECRET).update(`${timestamp}.${body}`).digest('hex');
    return { body, header: `t=${timestamp},v1=${hex}` };
  };
  const postWebhook = async (body, header) => {
    const response = await fetch(`http://127.0.0.1:${port}/api/stripe/webhook`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(header ? { 'Stripe-Signature': header } : {}),
      },
      body,
    });
    return { status: response.status, body: await response.json() };
  };
  const balanceOf = async (id) => {
    const response = await fetch(`http://127.0.0.1:${port}/api/credits`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ walletId: id }),
    });
    return response.json();
  };
  const askPalette = async (extra = {}, headers = {}, search = '') => {
    const response = await fetch(`http://127.0.0.1:${port}/api/palette${search}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...headers },
      body: JSON.stringify({
        history: [{ role: 'user', text: 'A calm coastal studio' }],
        currentPalette: [],
        walletId: emptyWallet,
        ...extra,
      }),
    });
    return { status: response.status, body: await response.json() };
  };

  try {
    const forged = await fetch(`http://127.0.0.1:${port}/api/credits/claim`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Owner-Access': process.env.OWNER_ACCESS_CODE,
      },
      body: JSON.stringify({
        walletId: emptyWallet,
        credits: 2400,
        pack: 'pack_2400',
        amount: 3900,
        status: 'succeeded',
        owner: true,
        email: OWNER_ACCOUNT_EMAIL,
        ownerAccess: process.env.CREATOR_BYPASS_SECRET,
      }),
    });
    const forgedBody = await forged.json();
    assert.equal(forgedBody.added, 0);
    assert.equal(forgedBody.balance, 0);
    assert.equal(forgedBody.owner, false);

    const unlock = await fetch(`http://127.0.0.1:${port}/api/owner-unlock`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ access: process.env.OWNER_ACCESS_CODE, email: OWNER_ACCOUNT_EMAIL }),
    });
    assert.equal(unlock.status, 403);

    const blocked = await askPalette(
      { ownerAccess: process.env.OWNER_ACCESS_CODE, email: OWNER_ACCOUNT_EMAIL, owner: true, isPro: true },
      { 'X-Owner-Access': process.env.CREATOR_BYPASS_SECRET, Authorization: `Bearer ${OWNER_ACCOUNT_EMAIL}` },
      `?access=${process.env.OWNER_ACCESS_CODE}`,
    );
    assert.equal(blocked.status, 402);
    assert.equal(blocked.body.paymentRequired, true);

    const stranger = await askPalette({}, { Authorization: 'Bearer other-session' });
    assert.equal(stranger.status, 402);

    const owner = await askPalette({}, { Authorization: 'Bearer owner-session' });
    assert.notEqual(owner.status, 402);
    assert.equal(owner.body.paymentRequired, undefined);
    const ownerBalance = await fetch(`http://127.0.0.1:${port}/api/credits`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer owner-session' },
      body: JSON.stringify({ walletId: emptyWallet, ownerAccess: process.env.OWNER_ACCESS_CODE }),
    });
    const ownerSnapshot = await ownerBalance.json();
    assert.equal(ownerSnapshot.owner, true);
    assert.equal(ownerSnapshot.balance, null);

    const event = paidSession();
    const raw = JSON.stringify(event);
    const unsigned = await postWebhook(raw);
    assert.equal(unsigned.status, 400);
    assert.deepEqual(await balanceOf(wallet), { owner: false, balance: 0 });

    const stale = sign(event, Math.floor(Date.now() / 1000) - 600);
    const staleResponse = await postWebhook(stale.body, stale.header);
    assert.equal(staleResponse.status, 400);

    const signed = sign(event);
    const first = await postWebhook(signed.body, signed.header);
    assert.equal(first.status, 200);
    assert.equal(first.body.granted, 600);
    const replay = await postWebhook(signed.body, sign(event).header);
    assert.equal(replay.body.granted, 0);
    const renamed = sign({ ...event, id: 'evt_replay' });
    const samePayment = await postWebhook(renamed.body, renamed.header);
    assert.equal(samePayment.body.granted, 0);
    assert.deepEqual(await balanceOf(wallet), { owner: false, balance: 600 });

    const cheap = sign(paidSession({ amount_total: 50, payment_intent: 'pi_cheap' }));
    const cheapResponse = await postWebhook(cheap.body, cheap.header);
    assert.equal(cheapResponse.body.granted, 0);

    const yearly = sign(paidSession({
      id: 'cs_year',
      mode: 'subscription',
      amount_total: 3900,
      payment_intent: null,
      invoice: 'in_year',
    }));
    const yearlyResponse = await postWebhook(yearly.body, yearly.header);
    assert.equal(yearlyResponse.body.granted, 2400);
    const renewalInvoice = sign({
      type: 'invoice.paid',
      data: {
        object: {
          id: 'in_year',
          status: 'paid',
          currency: 'usd',
          amount_paid: 3900,
          billing_reason: 'subscription_create',
          subscription: 'sub_year',
          metadata: { credits: '999999' },
          parent: { subscription_details: { metadata: { walletId: wallet } } },
        },
      },
    });
    const renewal = await postWebhook(renewalInvoice.body, renewalInvoice.header);
    assert.equal(renewal.body.granted, 0);
    assert.deepEqual(await balanceOf(wallet), { owner: false, balance: 3000 });

    delete process.env.STRIPE_WEBHOOK_SECRET;
    const unconfigured = await postWebhook(signed.body, signed.header);
    assert.equal(unconfigured.status, 503);
    assert.deepEqual(await balanceOf(wallet), { owner: false, balance: 3000 });
  } finally {
    globalThis.fetch = previous.fetch;
    if (previous.ledger === undefined) delete process.env.CREDIT_LEDGER_PATH;
    else process.env.CREDIT_LEDGER_PATH = previous.ledger;
    if (previous.key === undefined) delete process.env.API_KEY;
    else process.env.API_KEY = previous.key;
    if (previous.webhook === undefined) delete process.env.STRIPE_WEBHOOK_SECRET;
    else process.env.STRIPE_WEBHOOK_SECRET = previous.webhook;
    if (previous.owner === undefined) delete process.env.OWNER_ACCESS_CODE;
    else process.env.OWNER_ACCESS_CODE = previous.owner;
    if (previous.creator === undefined) delete process.env.CREATOR_BYPASS_SECRET;
    else process.env.CREATOR_BYPASS_SECRET = previous.creator;
    await new Promise((resolve) => server.close(resolve));
    await rm(dir, { recursive: true, force: true });
  }
});
