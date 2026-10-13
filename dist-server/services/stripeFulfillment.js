import crypto from 'crypto';
import { isWalletId } from './credits.js';
/** Signed webhook deliveries older than this are rejected. */
export const SIGNATURE_TOLERANCE_SECONDS = 300;
const CREDITS_BY_CENTS = {
    999: 600,
    3900: 2400,
};
const asRecord = (value) => (value !== null && typeof value === 'object' && !Array.isArray(value)
    ? value
    : null);
const stripeId = (value) => {
    if (typeof value === 'string' && /^[A-Za-z0-9_]+$/.test(value) && value.length <= 120)
        return value;
    const record = asRecord(value);
    return record ? stripeId(record.id) : null;
};
const cents = (value) => {
    if (typeof value === 'number' && Number.isInteger(value) && value >= 0 && value <= 100_000_000) {
        return value;
    }
    if (typeof value === 'string' && /^[0-9]+$/.test(value)) {
        const parsed = Number(value);
        if (Number.isSafeInteger(parsed) && parsed <= 100_000_000)
            return parsed;
    }
    return null;
};
const creditsForPayment = (amount, currency) => {
    const paid = cents(amount);
    if (paid === null)
        return 0;
    if (typeof currency !== 'string' || currency.toLowerCase() !== 'usd')
        return 0;
    return CREDITS_BY_CENTS[paid] ?? 0;
};
const metadataWallet = (metadata) => asRecord(metadata)?.walletId;
const lineWallets = (lines) => {
    const data = asRecord(lines)?.data;
    if (!Array.isArray(data))
        return [];
    return data.map((line) => metadataWallet(asRecord(line)?.metadata));
};
/** One wallet, and only when every present id agrees. */
const oneWallet = (candidates) => {
    const ids = [...new Set(candidates.filter((value) => isWalletId(value)))];
    return ids.length === 1 ? ids[0] : null;
};
const isSubscriptionInvoice = (invoice) => {
    if (stripeId(invoice.subscription))
        return true;
    if (asRecord(invoice.subscription_details))
        return true;
    if (asRecord(asRecord(invoice.parent)?.subscription_details))
        return true;
    return invoice.billing_reason === 'subscription_create'
        || invoice.billing_reason === 'subscription_cycle'
        || invoice.billing_reason === 'subscription_update'
        || invoice.billing_reason === 'subscription_threshold';
};
const grantFromCheckoutSession = (session) => {
    if (session.payment_status !== 'paid')
        return null;
    const credits = creditsForPayment(session.amount_total, session.currency);
    if (!credits)
        return null;
    const walletId = oneWallet([
        metadataWallet(session.metadata),
        session.client_reference_id,
    ]);
    if (!walletId)
        return null;
    const invoice = stripeId(session.invoice);
    const paymentIntent = stripeId(session.payment_intent);
    const sessionId = stripeId(session.id);
    let id = null;
    if (session.mode === 'subscription') {
        id = invoice ? `stripe:in:${invoice}` : null;
    }
    else if (paymentIntent) {
        id = `stripe:pi:${paymentIntent}`;
    }
    else if (sessionId) {
        id = `stripe:cs:${sessionId}`;
    }
    return id ? { id, walletId, credits } : null;
};
const grantFromInvoice = (invoice) => {
    if (invoice.status !== 'paid')
        return null;
    const credits = creditsForPayment(invoice.amount_paid, invoice.currency);
    if (!credits)
        return null;
    const parent = asRecord(invoice.parent);
    const walletId = oneWallet([
        metadataWallet(invoice.metadata),
        metadataWallet(asRecord(invoice.subscription_details)?.metadata),
        metadataWallet(asRecord(parent?.subscription_details)?.metadata),
        invoice.client_reference_id,
        ...lineWallets(invoice.lines),
    ]);
    if (!walletId)
        return null;
    const invoiceId = stripeId(invoice.id);
    const paymentIntent = stripeId(invoice.payment_intent);
    const id = isSubscriptionInvoice(invoice)
        ? (invoiceId ? `stripe:in:${invoiceId}` : null)
        : (paymentIntent ? `stripe:pi:${paymentIntent}` : (invoiceId ? `stripe:in:${invoiceId}` : null));
    return id ? { id, walletId, credits } : null;
};
/** Credits for a confirmed payment. Pack names and metadata amounts are ignored. */
export const grantFromStripeEvent = (event) => {
    const record = asRecord(event);
    const type = record?.type;
    const object = asRecord(asRecord(record?.data)?.object);
    if (!object || typeof type !== 'string')
        return null;
    if (type === 'checkout.session.completed' || type === 'checkout.session.async_payment_succeeded') {
        return grantFromCheckoutSession(object);
    }
    if (type === 'invoice.paid' || type === 'invoice.payment_succeeded') {
        return grantFromInvoice(object);
    }
    return null;
};
export const verifyStripeSignature = (payload, header, secret, nowMs = Date.now()) => {
    if (!secret || !header)
        return false;
    const body = Buffer.isBuffer(payload) ? payload : Buffer.from(payload);
    const parts = header.split(',').flatMap((part) => {
        const index = part.indexOf('=');
        if (index <= 0)
            return [];
        return [[part.slice(0, index).trim(), part.slice(index + 1).trim()]];
    });
    const timestamp = parts.find((part) => part[0] === 't')?.[1];
    const signatures = parts.filter((part) => part[0] === 'v1').map((part) => part[1]);
    if (!timestamp || !/^[0-9]+$/.test(timestamp) || signatures.length === 0)
        return false;
    const seconds = Number(timestamp);
    if (!Number.isSafeInteger(seconds))
        return false;
    if (Math.abs(nowMs / 1000 - seconds) > SIGNATURE_TOLERANCE_SECONDS)
        return false;
    const expected = crypto
        .createHmac('sha256', secret)
        .update(Buffer.concat([Buffer.from(`${timestamp}.`), body]))
        .digest();
    return signatures.some((signature) => {
        if (!/^[0-9a-fA-F]+$/.test(signature) || signature.length % 2 !== 0)
            return false;
        const got = Buffer.from(signature, 'hex');
        if (got.length !== expected.length)
            return false;
        return crypto.timingSafeEqual(got, expected);
    });
};
