
import { db, isDemoMode } from "../firebaseConfig";
import { collection, addDoc, onSnapshot, query, where, getDocs, doc, getDoc } from "firebase/firestore";
import type { DocumentReference } from "firebase/firestore";
import { buildCheckoutSession, type CreditPackId } from "./credits";

type PaymentConfig = { prices?: Partial<Record<CreditPackId, string | null>> };

let paymentConfigPromise: Promise<PaymentConfig> | null = null;

const priceIdForPack = async (packId: CreditPackId): Promise<string> => {
    paymentConfigPromise ??= fetch('/api/payment-config', { headers: { Accept: 'application/json' } })
        .then(async (response) => {
            if (!response.ok) throw new Error('Payment configuration is unavailable.');
            return response.json() as Promise<PaymentConfig>;
        })
        .catch((error) => {
            paymentConfigPromise = null;
            throw error;
        });
    const config = await paymentConfigPromise;
    const price = config.prices?.[packId]?.trim();
    if (!price?.startsWith('price_')) {
        throw new Error(`The ${packId === 'pack_600' ? '600-credit' : '2.4K-credit'} Stripe price is not configured.`);
    }
    return price;
};

export const checkSubscriptionStatus = async (userId: string): Promise<boolean> => {
    if (isDemoMode || !db) return false;

    try {
        // 1. Check for manual override in 'users' collection (Admin override)
        const userDocRef = doc(db, "users", userId);
        const userDocSnap = await getDoc(userDocRef);
        
        if (userDocSnap.exists()) {
            const userData = userDocSnap.data();
            if (userData.isPro === true) {
                return true; // Manual Override active
            }
        }

        // 2. Check Stripe Subscription (Standard)
        const q = query(
            collection(db, "customers", userId, "subscriptions"), 
            where("status", "in", ["active", "trialing"])
        );
        const snapshot = await getDocs(q);
        
        return !snapshot.empty;

    } catch (e: any) {
        if (e.code === 'permission-denied') {
            console.warn("⚠️ Firestore Permission Error: Could not check subscription. Please check Firestore Rules.");
            return false;
        }
        console.error("Error checking subscription:", e);
        return false;
    }
};

/** Friendly text for a Stripe extension error written on the session doc. */
const checkoutDocErrorMessage = (message: string): string => {
    if (message.includes("No such price")) {
        return "Stripe Price ID not found. You created the Price in Stripe LIVE mode, but Firebase is likely in TEST mode. Check Firebase Extension config.";
    }
    if (message.includes("No such customer")) {
        return "STALE DATA ERROR: Your database has a 'Test Mode' Customer ID, but you are now in 'Live Mode'. \n\nFIX: Go to Firebase Console -> Firestore -> 'customers' collection -> Delete the 'stripeId' field for this user.";
    }
    return `Payment Error: ${message}`;
};

interface CheckoutDocData {
    error?: { message?: string };
    url?: string;
}

/**
 * Waits for the Stripe extension to answer the checkout session doc.
 * Prefers the realtime listener, but polls with one-shot reads as fallback:
 * on some networks the Firestore Listen stream fails while unary reads work.
 */
const waitForCheckoutUrl = (
    ref: DocumentReference,
    timeoutMs = 15000,
): Promise<string> =>
    new Promise((resolve, reject) => {
        let done = false;
        const unsubscribe = onSnapshot(
            ref,
            (snap) => {
                settle(readSession(snap.data() as CheckoutDocData | undefined));
            },
            () => {
                // Realtime stream failed; keep waiting on the polling fallback.
            },
        );
        const poll = window.setInterval(async () => {
            try {
                const snap = await getDoc(ref);
                settle(readSession(snap.data() as CheckoutDocData | undefined));
            } catch (e: any) {
                if (e?.code === 'permission-denied') {
                    settle({
                        kind: 'error',
                        error: new Error(
                            'Payment request blocked: database rules deny reading the checkout status. Allow reads of your own checkout_sessions docs.',
                        ),
                    });
                }
            }
        }, 2000);
        const timer = window.setTimeout(() => {
            settle({
                kind: 'error',
                error: new Error(
                    "Payment system timeout. The 'Run Payments with Stripe' extension did not answer. Check Functions logs for 'createCheckoutSession' errors.",
                ),
            });
        }, timeoutMs);
        const cleanup = () => {
            unsubscribe();
            window.clearInterval(poll);
            window.clearTimeout(timer);
        };
        const settle = (result: { kind: 'url'; url: string } | { kind: 'error'; error: Error } | null) => {
            if (done || !result) return;
            done = true;
            cleanup();
            if (result.kind === 'url') resolve(result.url);
            else reject(result.error);
        };
    });

const readSession = (
    data: CheckoutDocData | undefined,
): { kind: 'url'; url: string } | { kind: 'error'; error: Error } | null => {
    if (!data) return null;
    if (data.url) return { kind: 'url', url: data.url };
    if (data.error) return { kind: 'error', error: new Error(checkoutDocErrorMessage(data.error.message || 'unknown error')) };
    return null;
};

export const createCheckoutSession = async (userId: string, packId: CreditPackId, walletId: string) => {
    if (isDemoMode) {
        alert("In Demo Mode: This would redirect to Stripe Checkout.");
        return;
    }

    if (!db) {
        throw new Error('Payments are not connected right now. Try again in a moment.');
    }

    const session = buildCheckoutSession(packId, {
        origin: window.location.origin,
        path: window.location.pathname,
        walletId,
        priceId: await priceIdForPack(packId),
    });

    let checkoutRef;
    try {
        checkoutRef = await addDoc(collection(db, "customers", userId, "checkout_sessions"), session);
    } catch (e: any) {
        if (e.code === 'permission-denied') {
            throw new Error("Payment request blocked: database rules deny writing checkout_sessions. Check Firestore Rules.");
        }
        throw new Error(`Failed to connect to payment provider: ${e.message || 'unknown error'}`);
    }

    const url = await waitForCheckoutUrl(checkoutRef);
    window.location.assign(url);
};

export const getPortalUrl = async () => {
     console.log("Portal link requested");
};
