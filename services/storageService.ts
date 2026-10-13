
import { db, isDemoMode } from "../firebaseConfig";
import { doc, setDoc, getDoc, increment } from "firebase/firestore";
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

export const savePaletteToFirestore = async (userId: string, paletteName: string, colors: ColorData[]) => {
    const palettes = readLocalPalettes();
    const newPalette: SavedPalette = {
        id: 'local-' + Date.now(),
        userId,
        name: paletteName,
        colors,
        createdAt: new Date().toISOString()
    };
    writeLocalPalettes([newPalette, ...palettes]);
    return newPalette.id;
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

export const getUserPalettes = async (_userId: string): Promise<SavedPalette[]> => {
    return readLocalPalettes();
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

export const deletePaletteFromFirestore = async (paletteId: string) => {
    const palettes = readLocalPalettes().filter((palette) => palette.id !== paletteId);
    writeLocalPalettes(palettes);
};

export const renamePaletteInFirestore = async (paletteId: string, name: string) => {
    const palettes = readLocalPalettes();
    const next = renameSavedPaletteList(palettes, paletteId, name);
    if (next !== palettes) writeLocalPalettes(next);
};
