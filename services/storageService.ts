
import { db, isDemoMode } from "../firebaseConfig";
import { collection, addDoc, query, where, getDocs, deleteDoc, doc, serverTimestamp, setDoc, getDoc, increment, updateDoc } from "firebase/firestore";
import { ColorData } from "../types";

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

// Helper to remove 'undefined' values which Firestore rejects.
const sanitizeForFirestore = (data: any) => {
    return JSON.parse(JSON.stringify(data));
};

export const savePaletteToFirestore = async (userId: string, paletteName: string, colors: ColorData[]) => {
    if (isDemoMode || !db) {
        // Fallback to LocalStorage for Demo Mode
        const localData = localStorage.getItem('demo_palettes');
        const palettes = localData ? JSON.parse(localData) : [];
        const newPalette = {
            id: 'local-' + Date.now(),
            userId,
            name: paletteName,
            colors,
            createdAt: new Date().toISOString()
        };
        palettes.push(newPalette);
        localStorage.setItem('demo_palettes', JSON.stringify(palettes));
        
        // Increment lifetime count via shared helper logic mock
        incrementUserStat(userId, 'paletteCount');
        
        return newPalette.id;
    }

    // Real Firestore Save
    try {
        // 1. Save the Palette
        const docRef = await addDoc(collection(db, "palettes"), {
            userId,
            name: paletteName,
            colors: sanitizeForFirestore(colors), 
            createdAt: serverTimestamp()
        });

        // 2. Increment Lifetime Counter
        await incrementUserStat(userId, 'paletteCount');

        return docRef.id;
    } catch (e: any) {
        console.error("Error saving palette: ", e);
        throw e;
    }
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
    if (isDemoMode || !db) {
        const localData = localStorage.getItem('demo_palettes');
        return localData ? JSON.parse(localData) : [];
    }

    try {
        const q = query(
            collection(db, "palettes"), 
            where("userId", "==", userId)
        );
        
        const querySnapshot = await getDocs(q);
        const palettes: SavedPalette[] = [];
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            palettes.push({
                id: doc.id,
                userId: data.userId,
                name: data.name,
                colors: data.colors,
                createdAt: data.createdAt
            });
        });

        // Client-side sort (Newest first)
        palettes.sort((a, b) => {
            const getTime = (dateObj: any) => {
                if (!dateObj) return 0;
                if (typeof dateObj.toMillis === 'function') return dateObj.toMillis();
                if (dateObj.seconds) return dateObj.seconds * 1000;
                if (typeof dateObj === 'string') return new Date(dateObj).getTime();
                return 0;
            };
            
            return getTime(b.createdAt) - getTime(a.createdAt);
        });

        return palettes;
    } catch (e) {
        console.error("Error fetching palettes: ", e);
        return [];
    }
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
    if (isDemoMode || !db) {
        const localData = localStorage.getItem('demo_palettes');
        if (localData) {
            const palettes = JSON.parse(localData).filter((p: any) => p.id !== paletteId);
            localStorage.setItem('demo_palettes', JSON.stringify(palettes));
        }
        return;
    }

    try {
        await deleteDoc(doc(db, "palettes", paletteId));
    } catch (e: any) {
        console.error("Error deleting palette:", e);
        throw e; // Throw so App.tsx can handle UI revert
    }
};
