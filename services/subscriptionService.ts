
import { db, isDemoMode } from "../firebaseConfig";
import { collection, addDoc, onSnapshot, query, where, getDocs, doc, getDoc } from "firebase/firestore";

// --- CONFIGURATION ---
// PRODUCTION MODE (LIVE)
const STRIPE_PRICE_ID = "price_1SkCflABAexLjmUyVPnaKjtq"; 

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

export const createCheckoutSession = async (userId: string) => {
    if (isDemoMode) {
        alert("In Demo Mode: This would redirect to Stripe Checkout.");
        return;
    }
    
    if (STRIPE_PRICE_ID.includes("REPLACE_ME")) {
        alert("CRITICAL ERROR: Stripe Price ID not configured.");
        return;
    }

    if (!db) return;

    try {
        const checkoutRef = await addDoc(collection(db, "customers", userId, "checkout_sessions"), {
            price: STRIPE_PRICE_ID,
            success_url: window.location.origin,
            cancel_url: window.location.origin,
        });

        let isRedirecting = false;
        
        const unsubscribe = onSnapshot(checkoutRef, (snap) => {
            const data = snap.data();
            if (!data) return;

            const { error, url } = data;
            
            if (error) {
                isRedirecting = true;
                unsubscribe();
                console.error("Stripe Extension Error:", error);
                
                let friendlyError = error.message;
                if (friendlyError.includes("No such price")) {
                    friendlyError = "Stripe Price ID not found. You created the Price in Stripe LIVE mode, but Firebase is likely in TEST mode. Check Firebase Extension config.";
                }
                if (friendlyError.includes("No such customer")) {
                    friendlyError = "STALE DATA ERROR: Your database has a 'Test Mode' Customer ID, but you are now in 'Live Mode'. \n\nFIX: Go to Firebase Console -> Firestore -> 'customers' collection -> Delete the 'stripeId' field for this user.";
                }

                alert(`Payment Error: ${friendlyError}`);
                window.location.reload(); 
            }
            
            if (url) {
                isRedirecting = true;
                unsubscribe();
                window.location.assign(url);
            }
        });

        setTimeout(() => {
            if (!isRedirecting) {
                unsubscribe();
                alert("Payment system timeout. Please check if the 'Run Payments with Stripe' extension is enabled in Firebase Console and listening on the 'customers' collection.");
                window.location.reload();
            }
        }, 15000);

    } catch (e: any) {
        if (e.code === 'permission-denied') {
            alert("Permission Denied: Your database is blocking the payment request. Check the console logs for the required Firestore Rule.");
            return;
        }
        console.error("Failed to initialize checkout:", e);
        alert(`Failed to connect to payment provider: ${e.message}`);
    }
};

export const getPortalUrl = async () => {
     console.log("Portal link requested");
};
