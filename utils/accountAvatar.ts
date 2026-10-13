/** Black line drawings served from public/avatars. Ids match those files. */

export interface AvatarFace {
  id: string;
  label: string;
  src: string;
}

export interface AvatarGroup {
  id: 'male' | 'female';
  label: 'Male' | 'Female';
  faces: readonly AvatarFace[];
}

const face = (group: 'male' | 'female', file: string, label: string): AvatarFace => ({
  id: `${group}/${file}`,
  label,
  src: `/avatars/${group}/${file}.png`,
});

export const AVATAR_GROUPS: readonly AvatarGroup[] = [
  {
    id: 'male',
    label: 'Male',
    faces: [
      face('male', 'curly', 'Curly'),
      face('male', 'sunglasses', 'Sunglasses'),
      face('male', 'beard', 'Beard'),
      face('male', 'side-part', 'Side part'),
      face('male', 'spiky', 'Spiky'),
    ],
  },
  {
    id: 'female',
    label: 'Female',
    faces: [
      face('female', 'bob', 'Bob'),
      face('female', 'braids', 'Braids'),
      face('female', 'glasses', 'Glasses'),
      face('female', 'long-hair', 'Long hair'),
      face('female', 'beanie', 'Beanie'),
    ],
  },
];

const AVATAR_BY_ID = new Map(
  AVATAR_GROUPS.flatMap((group) => group.faces.map((item) => [item.id, item] as const)),
);

/** Shown until the signed-in account picks a face. */
export const DEFAULT_AVATAR_ID = AVATAR_GROUPS[0].faces[0].id;

const STORAGE_KEY = 'chromaforge_account_avatars';

export interface AvatarStore {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

export const avatarAccountKey = (
  email: string | null | undefined,
  accountId: string | null | undefined,
): string => {
  const mail = (email || '').trim().toLowerCase();
  if (mail) return `email:${mail}`;
  const id = (accountId || '').trim();
  return id ? `uid:${id}` : '';
};

export const avatarById = (id: string | null | undefined): AvatarFace | null =>
  (id && AVATAR_BY_ID.get(id)) || null;

export const displayedAvatarId = (stored: string | null | undefined): string =>
  avatarById(stored)?.id ?? DEFAULT_AVATAR_ID;

const browserStore = (): AvatarStore | null => {
  try {
    if (typeof localStorage === 'undefined') return null;
    return localStorage;
  } catch {
    return null;
  }
};

const readMap = (store: AvatarStore): Record<string, string> => {
  try {
    const raw = store.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {};
    const map: Record<string, string> = {};
    for (const [key, value] of Object.entries(parsed)) {
      if (typeof value === 'string' && avatarById(value)) map[key] = value;
    }
    return map;
  } catch {
    return {};
  }
};

/** Face id saved for this account, or null when they have not chosen one. */
export const readAccountAvatar = (
  accountKey: string,
  store: AvatarStore | null = browserStore(),
): string | null => {
  if (!accountKey || !store) return null;
  return readMap(store)[accountKey] ?? null;
};

/** Remember a catalog face for this account. Unknown ids are ignored. */
export const writeAccountAvatar = (
  accountKey: string,
  avatarId: string,
  store: AvatarStore | null = browserStore(),
): boolean => {
  if (!accountKey || !store || !avatarById(avatarId)) return false;
  try {
    const map = readMap(store);
    map[accountKey] = avatarId;
    store.setItem(STORAGE_KEY, JSON.stringify(map));
    return true;
  } catch {
    return false;
  }
};
