
import { db, isDemoMode } from "../firebaseConfig";
import {
    collection,
    doc,
    getDoc,
    getDocs,
    increment,
    limit,
    query,
    runTransaction,
    serverTimestamp,
    setDoc,
    where,
} from "firebase/firestore";
import { ColorData } from "../types";
import { renameSavedPaletteList } from "../utils/paletteName";

export interface SavedPalette {
    id: string;
    userId: string;
    name: string;
    colors: ColorData[];
    createdAt: any;
}

export interface UserUsageStats {
    paletteCount: number; // Lifetime saves
    aiCount: number;
    exportCount: number;
    tunerCount: number;
    editCount: number;
}

const LOCAL_PALETTES_KEY = 'chromaforge_palettes';
export const MAX_SAVED_PALETTES = 10;

export class PaletteLimitError extends Error {
    readonly code = 'palette-limit-reached';

    constructor() {
        super(`You can save up to ${MAX_SAVED_PALETTES} palettes. Delete one before saving another.`);
        this.name = 'PaletteLimitError';
    }
}

const readLocalPalettes = (): SavedPalette[] => {
    try {
        const raw = localStorage.getItem(LOCAL_PALETTES_KEY) || localStorage.getItem('demo_palettes');
        const parsed = raw ? JSON.parse(raw) : [];
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return [];
    }
};

const writeLocalPalettes = (palettes: SavedPalette[]) => {
    localStorage.setItem(LOCAL_PALETTES_KEY, JSON.stringify(palettes));
};

const localPaletteId = (): string => {
    const id = globalThis.crypto?.randomUUID?.();
    return id ? `local-${id}` : `local-${Date.now()}-${Math.random().toString(36).slice(2)}`;
};

export const savePaletteToFirestore = async (userId: string, paletteName: string, colors: ColorData[]) => {
    if (userId === 'local' || isDemoMode || !db) {
        const palettes = readLocalPalettes();
        if (palettes.length >= MAX_SAVED_PALETTES) throw new PaletteLimitError();
        const newPalette: SavedPalette = {
            id: localPaletteId(),
            userId: 'local',
            name: paletteName,
            colors,
            createdAt: new Date().toISOString()
        };
        writeLocalPalettes([newPalette, ...palettes]);
        return newPalette.id;
    }

    const existing = await getDocs(query(
        collection(db, 'palettes'),
        where('userId', '==', userId),
        limit(MAX_SAVED_PALETTES),
    ));
    const paletteRef = doc(collection(db, 'palettes'));
    const userRef = doc(db, 'users', userId);
    await runTransaction(db, async (transaction) => {
        const userSnapshot = await transaction.get(userRef);
        const recordedCount = Number(userSnapshot.data()?.savedPaletteCount);
        const currentCount = Math.max(
            existing.size,
            Number.isFinite(recordedCount) ? recordedCount : 0,
        );
        if (currentCount >= MAX_SAVED_PALETTES) throw new PaletteLimitError();
        transaction.set(paletteRef, {
            userId,
            name: paletteName.trim() || 'Untitled palette',
            colors: JSON.parse(JSON.stringify(colors)),
            createdAt: serverTimestamp(),
        });
        transaction.set(userRef, {
            savedPaletteCount: currentCount + 1,
            paletteCount: increment(1),
        }, { merge: true });
    });
    return paletteRef.id;
};

export const incrementUserStat = async (userId: string, field: keyof UserUsageStats) => {
    if (isDemoMode || !db) {
        const key = `demo_stat_${field}`;
        const current = parseInt(localStorage.getItem(key) || '0');
        localStorage.setItem(key, (current + 1).toString());
        return;
    }

    try {
        const userRef = doc(db, "users", userId);
        // Use setDoc with merge to ensure document exists
        await setDoc(userRef, {
            [field]: increment(1)
        }, { merge: true });
    } catch (e) {
        console.warn(`Could not increment ${field}:`, e);
    }
};

export const getUserPalettes = async (userId: string): Promise<SavedPalette[]> => {
    if (userId === 'local' || isDemoMode || !db) return readLocalPalettes();

    const snapshot = await getDocs(query(
        collection(db, 'palettes'),
        where('userId', '==', userId),
        limit(MAX_SAVED_PALETTES),
    ));
    const palettes = snapshot.docs.map((paletteDoc) => {
        const data = paletteDoc.data();
        return {
            id: paletteDoc.id,
            userId,
            name: typeof data.name === 'string' ? data.name : 'Untitled palette',
            colors: Array.isArray(data.colors) ? data.colors as ColorData[] : [],
            createdAt: data.createdAt ?? null,
        };
    });
    return palettes.sort((a, b) => {
        const millis = (value: any): number => {
            if (typeof value?.toMillis === 'function') return value.toMillis();
            if (typeof value?.seconds === 'number') return value.seconds * 1000;
            if (typeof value === 'string') return Date.parse(value) || 0;
            return 0;
        };
        return millis(b.createdAt) - millis(a.createdAt);
    });
};

export const getUserUsageStats = async (userId: string): Promise<UserUsageStats> => {
    if (isDemoMode || !db) {
        return {
            paletteCount: parseInt(localStorage.getItem('demo_stat_paletteCount') || '0'),
            aiCount: parseInt(localStorage.getItem('demo_stat_aiCount') || '0'),
            exportCount: parseInt(localStorage.getItem('demo_stat_exportCount') || '0'),
            tunerCount: parseInt(localStorage.getItem('demo_stat_tunerCount') || '0'),
            editCount: parseInt(localStorage.getItem('demo_stat_editCount') || '0'),
        };
    }

    try {
        const userRef = doc(db, "users", userId);
        const userSnap = await getDoc(userRef);
        
        if (userSnap.exists()) {
            const data = userSnap.data();
            return {
                paletteCount: data.paletteCount || 0,
                aiCount: data.aiCount || 0,
                exportCount: data.exportCount || 0,
                tunerCount: data.tunerCount || 0,
                editCount: data.editCount || 0,
            };
        }
        return { paletteCount: 0, aiCount: 0, exportCount: 0, tunerCount: 0, editCount: 0 };
    } catch (e: any) {
        console.warn("Error fetching user stats:", e);
        return { paletteCount: 0, aiCount: 0, exportCount: 0, tunerCount: 0, editCount: 0 };
    }
};

export const deletePaletteFromFirestore = async (userId: string, paletteId: string) => {
    if (userId === 'local' || isDemoMode || !db) {
        const palettes = readLocalPalettes().filter((palette) => palette.id !== paletteId);
        writeLocalPalettes(palettes);
        return;
    }

    const existing = await getDocs(query(
        collection(db, 'palettes'),
        where('userId', '==', userId),
        limit(MAX_SAVED_PALETTES),
    ));
    const paletteRef = doc(db, 'palettes', paletteId);
    const userRef = doc(db, 'users', userId);
    await runTransaction(db, async (transaction) => {
        const [palette, user] = await Promise.all([
            transaction.get(paletteRef),
            transaction.get(userRef),
        ]);
        if (!palette.exists() || palette.data().userId !== userId) {
            throw new Error('Palette not found for this account.');
        }
        const recordedCount = Number(user.data()?.savedPaletteCount);
        const currentCount = Math.max(
            existing.size,
            Number.isFinite(recordedCount) ? recordedCount : 0,
        );
        transaction.delete(paletteRef);
        transaction.set(userRef, {
            savedPaletteCount: Math.max(0, currentCount - 1),
        }, { merge: true });
    });
};

export const renamePaletteInFirestore = async (userId: string, paletteId: string, name: string) => {
    if (userId === 'local' || isDemoMode || !db) {
        const palettes = readLocalPalettes();
        const next = renameSavedPaletteList(palettes, paletteId, name);
        if (next !== palettes) writeLocalPalettes(next);
        return;
    }

    const paletteRef = doc(db, 'palettes', paletteId);
    await runTransaction(db, async (transaction) => {
        const palette = await transaction.get(paletteRef);
        if (!palette.exists() || palette.data().userId !== userId) {
            throw new Error('Palette not found for this account.');
        }
        transaction.update(paletteRef, {
            name: name.trim() || 'Untitled palette',
        });
    });
};
