import { auth, db, isDemoMode } from '../firebaseConfig';
import { addDoc, collection, deleteDoc, doc, getDocs, limit, query, serverTimestamp, where } from 'firebase/firestore';
import { getCreditWalletId } from './creditWallet';

/**
 * Client side of the Pigmento "create a card" feature:
 * - generateCard(): calls /api/ui-design (metered like any Pigmento turn)
 * - list/save/remove: per-user persistence (Firestore, or localStorage for local/demo users)
 */

export interface GeneratedCard {
  id: string;
  userId: string;
  title: string;
  prompt: string;
  html: string;
  createdAt: string;
}

export interface GenerateCardResult {
  title?: string;
  html: string;
  description: string;
  creditsSpent?: number;
  creditsRemaining?: number;
  paymentRequired?: boolean;
}

const LOCAL_KEY = 'chromaforge_generated_cards';
export const MAX_GENERATED_CARDS = 20;
export { CARD_CREDITS_ESTIMATE } from './credits';

const readLocal = (): GeneratedCard[] => {
  try { const v = JSON.parse(localStorage.getItem(LOCAL_KEY) || '[]'); return Array.isArray(v) ? v : []; } catch { return []; }
};
const writeLocal = (cards: GeneratedCard[]) => localStorage.setItem(LOCAL_KEY, JSON.stringify(cards));
const isLocal = (userId: string) => userId === 'local' || isDemoMode || !db;

export const generateCard = async (prompt: string, feedback?: string): Promise<GenerateCardResult> => {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (!isDemoMode && auth?.currentUser) {
    try {
      const idToken = await auth.currentUser.getIdToken();
      if (idToken) headers.Authorization = `Bearer ${idToken}`;
    } catch { /* the server treats a missing token as a normal credit balance */ }
  }
  try {
    const response = await fetch('/api/ui-design', {
      method: 'POST',
      headers,
      body: JSON.stringify({ prompt, feedback, walletId: getCreditWalletId() }),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok || typeof data.html !== 'string' || !data.html) {
      return {
        html: '',
        description: data.description || `HTTP ${response.status}: ${response.statusText}`,
        creditsSpent: data.creditsSpent,
        creditsRemaining: data.creditsRemaining,
        paymentRequired: response.status === 402 || data.paymentRequired === true,
      };
    }
    return {
      title: data.title,
      html: data.html,
      description: data.description || 'Card ready.',
      creditsSpent: typeof data.creditsSpent === 'number' ? data.creditsSpent : undefined,
      creditsRemaining: typeof data.creditsRemaining === 'number' ? data.creditsRemaining : undefined,
    };
  } catch (error: any) {
    const msg = error?.message || '';
    return { html: '', description: msg.includes('fetch') || msg.includes('network') ? 'Network error. Check your connection.' : `System error: ${msg.slice(0, 100)}` };
  }
};

export const listGeneratedCards = async (userId: string): Promise<GeneratedCard[]> => {
  if (isLocal(userId)) return readLocal();
  // Single-field filter only, so no composite index is needed; sorted client-side.
  const snap = await getDocs(query(collection(db!, 'playgroundCards'), where('userId', '==', userId), limit(MAX_GENERATED_CARDS)));
  return snap.docs.map(d => {
    const v = d.data();
    return { id: d.id, userId, title: v.title, prompt: v.prompt, html: v.html, createdAt: v.createdAt?.toDate?.()?.toISOString?.() || new Date().toISOString() };
  }).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
};

export const saveGeneratedCard = async (userId: string, card: Omit<GeneratedCard, 'id' | 'userId' | 'createdAt'>): Promise<GeneratedCard> => {
  const createdAt = new Date().toISOString();
  if (isLocal(userId)) {
    const id = globalThis.crypto?.randomUUID?.() || `local-${Date.now()}`;
    const saved = { id, userId: 'local', createdAt, ...card };
    writeLocal([saved, ...readLocal()].slice(0, MAX_GENERATED_CARDS));
    return saved;
  }
  const ref = await addDoc(collection(db!, 'playgroundCards'), { userId, ...card, createdAt: serverTimestamp() });
  return { id: ref.id, userId, createdAt, ...card };
};

export const removeGeneratedCard = async (userId: string, id: string) => {
  if (isLocal(userId)) { writeLocal(readLocal().filter(c => c.id !== id)); return; }
  await deleteDoc(doc(db!, 'playgroundCards', id));
};
