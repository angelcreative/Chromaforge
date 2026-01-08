
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, Auth } from "firebase/auth";
import { getFirestore, Firestore } from "firebase/firestore";
import { getAnalytics, setAnalyticsCollectionEnabled, Analytics, isSupported } from "firebase/analytics";

// Tu configuración real de Firebase
const firebaseConfig = {
  apiKey: "AIzaSyBY0XUym3soacWnPG8kmEW52aPBv_vrIIk",
  authDomain: "chroma-forge.firebaseapp.com",
  projectId: "chroma-forge",
  storageBucket: "chroma-forge.firebasestorage.app",
  messagingSenderId: "656523750864",
  appId: "1:656523750864:web:6b44fc0054d1bb20e09dd5",
  measurementId: "G-GKPSW2L9DC" // Add your measurement ID if you have one
};

let app;
let auth: Auth | null = null;
let db: Firestore | null = null;
let provider: GoogleAuthProvider | null = null;
let analytics: Analytics | null = null;
let isDemoMode = false;

try {
    // Inicialización directa - Servicios Críticos
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
    provider = new GoogleAuthProvider();
    
} catch (e) {
    console.error("Error inicializando Firebase (Critical):", e);
    // Solo si falla la conexión real activamos el modo demo
    isDemoMode = true;
}

// Inicialización de Analytics (No crítica)
// Se hace fuera del bloque try/catch principal para que un fallo en analytics
// (común con adblockers o entornos restringidos) no active el modo Demo globalmente.
if (typeof window !== 'undefined' && !isDemoMode && app) {
    isSupported().then((supported) => {
        if (supported) {
            try {
                analytics = getAnalytics(app);
                // Default to disabled until explicitly enabled by CookieConsent
                setAnalyticsCollectionEnabled(analytics, false); 
            } catch (e) {
                console.warn("Firebase Analytics initialization failed:", e);
            }
        }
    }).catch((e) => {
        console.warn("Firebase Analytics support check failed:", e);
    });
}

// Helper to toggle analytics based on user consent
export const setAnalyticsConsent = (granted: boolean) => {
  if (analytics && !isDemoMode) {
    setAnalyticsCollectionEnabled(analytics, granted);
    console.log(`Firebase Analytics: ${granted ? 'Enabled' : 'Disabled'}`);
  }
};

export { auth, db, provider, isDemoMode };
