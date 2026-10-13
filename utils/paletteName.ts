export function commitPaletteName(current: string, draft: string): string | null {
  const next = draft.trim();
  if (!next || next === current.trim()) return null;
  return next;
}

export function renameSavedPaletteList<T extends { id: string; name: string }>(
  palettes: readonly T[],
  id: string,
  name: string,
): T[] {
  const next = name.trim();
  if (!next) return palettes as T[];
  let changed = false;
  const updated = palettes.map((palette) => {
    if (palette.id !== id || palette.name === next) return palette;
    changed = true;
    return { ...palette, name: next };
  });
  return changed ? updated : (palettes as T[]);
}
