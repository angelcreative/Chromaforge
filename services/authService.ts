
import { 
    signInWithEmailAndPassword, 
    createUserWithEmailAndPassword, 
    signOut as firebaseSignOut, 
    onAuthStateChanged, 
    updateProfile,
    signInWithPopup,
    sendEmailVerification,
    User,
    AuthError
} from "firebase/auth";
import { auth, provider, isDemoMode } from "../firebaseConfig";
import { shouldCreateAccount } from "../utils/accountAuth";

// --- Mock User Interface ---
// Mimics the Firebase User object structure for the UI
interface MockUser {
    uid: string;
    email: string;
    displayName: string | null;
    photoURL: string | null;
    emailVerified: boolean; // Add this
    providerData: { providerId: string }[]; // Add this
}

// --- Mock State Management ---
let mockCurrentUser: MockUser | null = null;
try {
    const stored = localStorage.getItem('chroma_demo_user');
    if (stored) mockCurrentUser = JSON.parse(stored);
} catch (e) { /* ignore */ }

const mockListeners: ((user: MockUser | null) => void)[] = [];

const notifyListeners = () => {
    mockListeners.forEach(l => l(mockCurrentUser));
};

// --- Service Exports ---

export const subscribeToAuth = (callback: (user: User | null) => void) => {
    if (!isDemoMode && auth) {
        return onAuthStateChanged(auth, callback);
    } else {
        // Mock Subscription
        // Cast MockUser to User to satisfy TS (it matches enough for UI needs)
        mockListeners.push(callback as any);
        // Fire immediately
        callback(mockCurrentUser as any);
        return () => {
            const index = mockListeners.indexOf(callback as any);
            if (index > -1) mockListeners.splice(index, 1);
        };
    }
};

/** Sign in an existing account. An unknown email creates the account instead. */
export const signInOrCreateAccount = async (email: string, pass: string) => {
    const trimmed = email.trim();
    try {
        return await loginUser(trimmed, pass);
    } catch (error: unknown) {
        const code = (error as { code?: string })?.code;
        if (!shouldCreateAccount(code)) throw error;
        try {
            return await registerUser(trimmed, pass, trimmed.split('@')[0]);
        } catch (createError: unknown) {
            const createCode = (createError as { code?: string })?.code;
            if (createCode === 'auth/email-already-in-use') {
                const wrongPassword = new Error('That password does not match this account.') as Error & { code: string };
                wrongPassword.code = 'auth/wrong-password';
                throw wrongPassword;
            }
            throw createError;
        }
    }
};

export const loginUser = async (email: string, pass: string) => {
    if (!isDemoMode && auth) {
        return signInWithEmailAndPassword(auth, email, pass);
    } else {
        // Mock Login
        await new Promise(r => setTimeout(r, 800)); // Fake network delay
        if (email.includes('error')) throw { code: 'auth/invalid-email', message: 'Mock error triggered' };
        
        mockCurrentUser = {
            uid: 'demo-user-123',
            email: email,
            displayName: email.split('@')[0],
            photoURL: null,
            emailVerified: true, // Demo users usually verified
            providerData: [{ providerId: 'password' }]
        };
        localStorage.setItem('chroma_demo_user', JSON.stringify(mockCurrentUser));
        notifyListeners();
        return { user: mockCurrentUser };
    }
};

export const loginWithGoogle = async () => {
    if (isDemoMode || !auth || !provider) {
        // Mock Google Login (Demo Mode only)
        await new Promise(r => setTimeout(r, 800));
        mockCurrentUser = {
            uid: 'demo-google-user-' + Date.now(),
            email: 'demo.google@example.com',
            displayName: 'Demo Google User',
            photoURL: 'https://lh3.googleusercontent.com/a/default-user',
            emailVerified: true,
            providerData: [{ providerId: 'google.com' }]
        };
        localStorage.setItem('chroma_demo_user', JSON.stringify(mockCurrentUser));
        notifyListeners();
        return { user: mockCurrentUser };
    }
    // Real Firebase session: surface popup errors so the menu can explain them.
    // A silent demo fallback here would never reach the real auth listener,
    // which is why the button previously looked like it did nothing.
    return await signInWithPopup(auth, provider);
};

export const registerUser = async (email: string, pass: string, name?: string) => {
    if (!isDemoMode && auth) {
        const cred = await createUserWithEmailAndPassword(auth, email, pass);
        if (name) await updateProfile(cred.user, { displayName: name });
        
        // Send Verification Email immediately
        try {
            await sendEmailVerification(cred.user);
        } catch (e) {
            console.error("Error sending verification email:", e);
        }
        
        return cred;
    } else {
        // Mock Register
        await new Promise(r => setTimeout(r, 800));
        mockCurrentUser = {
            uid: 'demo-user-' + Date.now(),
            email: email,
            displayName: name || email.split('@')[0],
            photoURL: null,
            emailVerified: true, // Auto verify in demo
            providerData: [{ providerId: 'password' }]
        };
        localStorage.setItem('chroma_demo_user', JSON.stringify(mockCurrentUser));
        notifyListeners();
        return { user: mockCurrentUser };
    }
};

export const sendVerification = async (user: User) => {
    if (!isDemoMode && user) {
        return sendEmailVerification(user);
    }
};

/** Anonymous Firebase user so Stripe checkout has a customer id. Not a studio login. */
export const ensureBillingUser = async () => {
    if (isDemoMode || !auth) {
        throw new Error('Billing is unavailable in this session.');
    }
    if (auth.currentUser) return auth.currentUser;
    const { signInAnonymously } = await import('firebase/auth');
    const cred = await signInAnonymously(auth);
    return cred.user;
};

export const logoutUser = async () => {
    mockCurrentUser = null;
    try {
        localStorage.removeItem('chroma_demo_user');
    } catch {
        /* ignore */
    }
    notifyListeners();
    if (auth) await firebaseSignOut(auth);
};

export const resetPassword = async (email: string) => {
    if (!isDemoMode && auth) {
        // We need to dynamically import this to avoid errors if auth is null in imports
        const { sendPasswordResetEmail } = await import("firebase/auth");
        return sendPasswordResetEmail(auth, email);
    } else {
        await new Promise(r => setTimeout(r, 500));
        console.log(`[Demo Mode] Password reset email sent to ${email}`);
        return;
    }
};
