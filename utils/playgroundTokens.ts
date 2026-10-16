import { ColorData, GlobalCurveConfig, PlaygroundConfig } from '../types';
import { createColorData, generateShades, getContrastRatio, getLuminance, hexToRgb } from './colorUtils';

/**
 * Playground token engine.
 *
 * Takes the palettes the user already built (brand, neutrals, semantic) and
 * turns them into one flat set of semantic CSS variables. Every text/background
 * pair the cards use is picked by measured contrast, never by a fixed step, so
 * the result passes WCAG for any palette the generator or the user produces.
 *
 * The shades come from `generateShades`, so manual ramp edits (Refine, Tools)
 * are respected exactly as they are elsewhere in the app.
 */

export type ShadeMap = Record<number, string>;

export interface AuditPair {
  label: string;
  fg: string; // token name
  bg: string; // token name
  min: number; // 4.5 for text, 3 for UI
  ratio: number;
  pass: boolean;
}

export interface PlaygroundTokens {
  vars: Record<string, string>; // --token -> hex
  primary: ShadeMap;
  neutral: ShadeMap;
  audit: AuditPair[];
  failures: number;
  isDark: boolean;
}

const LEVELS = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950];

const lum = (hex: string) => {
  const { r, g, b } = hexToRgb(hex);
  return getLuminance(r, g, b);
};
export const contrast = (a: string, b: string) => getContrastRatio(lum(a), lum(b));

const toMap = (color: ColorData, globalConfig?: GlobalCurveConfig): ShadeMap => {
  const shades = generateShades(color, globalConfig);
  const map: ShadeMap = {};
  if (shades.length === 11) {
    shades.forEach((s, i) => { map[LEVELS[i]] = s.hex; });
  } else {
    // Non-11-step ramps: resample onto the 11 canonical levels by position.
    LEVELS.forEach((level, i) => {
      const idx = Math.round((i / (LEVELS.length - 1)) * (shades.length - 1));
      map[level] = shades[idx]?.hex ?? shades[shades.length - 1].hex;
    });
  }
  return map;
};

/** First level (in the given order) whose contrast against `against` reaches `min`; last one otherwise. */
const pick = (map: ShadeMap, order: number[], against: string, min: number): string => {
  for (const level of order) {
    if (map[level] && contrast(map[level], against) >= min) return map[level];
  }
  return map[order[order.length - 1]];
};

const SEMANTIC_FALLBACK: Record<string, string> = {
  success: '#1f9d55',
  warning: '#d9900b',
  danger: '#d64545',
  info: '#2f7de1',
};
const SEMANTIC_ALIASES: Record<string, string[]> = {
  success: ['success', 'positive', 'ok', 'green'],
  warning: ['warning', 'caution', 'amber', 'yellow'],
  danger: ['danger', 'error', 'destructive', 'negative', 'red'],
  info: ['info', 'informative', 'blue'],
};

const findSemantic = (palette: ColorData[], key: string): ColorData | undefined => {
  const names = SEMANTIC_ALIASES[key];
  return palette.find(c => names.some(n => c.name.toLowerCase().includes(n)));
};

export function buildPlaygroundTokens(
  brandPalette: ColorData[],
  neutralPalette: ColorData[],
  semanticPalette: ColorData[],
  config: PlaygroundConfig,
  globalConfig?: GlobalCurveConfig,
  radius = 12,
): PlaygroundTokens | null {
  const primarySource = brandPalette[config.primaryIndex] || brandPalette[0];
  if (!primarySource) return null;

  const neutralSource = (config.textMode === 'tinted' ? neutralPalette[0] : (neutralPalette[1] || neutralPalette[0]))
    || createColorData('#6b7280', undefined, 'Neutral');
  const surfaceSource = config.surfaceMode === 'brand' ? primarySource : neutralSource;

  // 60-30-10: the dominant colour replaces the surface ramp and the secondary
  // gets its own family. With the rule off, secondary mirrors the accent.
  const rule = !!config.ruleActive && brandPalette.length >= 3;
  const dominantSource = rule ? brandPalette[config.dominantIndex ?? -1] : undefined;
  const secondarySource = rule ? brandPalette[config.secondaryIndex ?? -1] : undefined;

  const p = toMap(primarySource, globalConfig);
  const n = toMap(neutralSource, globalConfig);
  const s = toMap(dominantSource || surfaceSource, globalConfig);
  const sec = secondarySource ? toMap(secondarySource, globalConfig) : p;
  const dark = config.isDarkMode;
  const brand = primarySource.hex;

  const t: Record<string, string> = {};

  // Surfaces
  if (dominantSource) {
    t.bg = dark ? s[950] : s[100];
    t.surface = dark ? s[900] : s[50];
    t['surface-2'] = dark ? s[800] : s[100];
    t.input = dark ? s[950] : '#FFFFFF';
    t.border = dark ? s[800] : s[200];
  } else {
    t.bg = dark ? n[950] : s[100];
    t.surface = dark ? n[900] : '#FFFFFF';
    t['surface-2'] = dark ? n[800] : s[50];
    t.input = dark ? n[950] : '#FFFFFF';
    t.border = dark ? n[800] : n[200];
  }
  // Control borders must reach 3:1 (WCAG 1.4.11), not just look subtle.
  t['border-strong'] = dark ? pick(n, [500, 400, 300], t.surface, 3) : pick(n, [400, 500, 600], t.surface, 3);

  // Text
  t.text = dark ? n[50] : n[900];
  t['text-2'] = dark ? pick(n, [300, 200, 100], t.surface, 4.5) : pick(n, [600, 700, 800], t.surface, 4.5);
  t['text-3'] = dark ? pick(n, [400, 300], t.surface, 3) : pick(n, [500, 600], t.surface, 3);

  // Accent: keep the brand's exact hex whenever it already passes; flip the
  // text colour instead of darkening the brand.
  const ink = p[950] || n[950];
  if (!dark) {
    if (contrast(brand, '#FFFFFF') >= 4.5) {
      t.accent = brand; t['on-accent'] = '#FFFFFF'; t['accent-hover'] = p[700];
    } else if (contrast(brand, ink) >= 4.5) {
      t.accent = brand; t['on-accent'] = ink; t['accent-hover'] = p[400];
    } else {
      t.accent = pick(p, [600, 700, 800], '#FFFFFF', 4.5); t['on-accent'] = '#FFFFFF'; t['accent-hover'] = p[800];
    }
    t['accent-soft'] = p[100];
    t['on-accent-soft'] = pick(p, [700, 800, 900], p[100], 4.5);
    t['accent-text'] = pick(p, [600, 700, 800], t.surface, 4.5);
  } else {
    if (contrast(brand, ink) >= 4.5 && contrast(brand, t.surface) >= 3) {
      t.accent = brand; t['on-accent'] = ink;
    } else {
      t.accent = pick(p, [400, 300, 200], ink, 4.5); t['on-accent'] = ink;
    }
    t['accent-hover'] = p[300];
    t['accent-soft'] = p[900];
    t['on-accent-soft'] = pick(p, [200, 100, 50], p[900], 4.5);
    t['accent-text'] = pick(p, [300, 200, 100], t.surface, 4.5);
  }
  t.focus = t.accent;

  // Secondary (the 30%): supporting fills, chips, avatars, charts, image fills.
  if (secondarySource) {
    t['secondary-soft'] = dark ? sec[800] : sec[100];
    t['on-secondary-soft'] = dark ? pick(sec, [100, 50, 200], sec[800], 4.5) : pick(sec, [800, 900, 950], sec[100], 4.5);
    t['secondary-text'] = dark ? pick(sec, [300, 200, 100], t.surface, 4.5) : pick(sec, [700, 800, 900], t.surface, 4.5);
  } else {
    t['secondary-soft'] = t['accent-soft'];
    t['on-secondary-soft'] = t['on-accent-soft'];
    t['secondary-text'] = t['accent-text'];
  }
  t['switch-off'] = dark ? pick(n, [500, 400], t.surface, 3) : pick(n, [400, 500], t.surface, 3);
  t['disabled-bg'] = dark ? n[800] : n[100];
  t['disabled-text'] = dark ? n[500] : n[400];

  // Semantic: use the user's own families when present, generated fallbacks otherwise.
  for (const key of Object.keys(SEMANTIC_FALLBACK)) {
    const source = findSemantic(semanticPalette, key) || createColorData(SEMANTIC_FALLBACK[key], undefined, key);
    const r = toMap(source, globalConfig);
    t[key] = dark ? pick(r, [400, 300], t.surface, 3) : pick(r, [600, 500, 700], t.surface, 3);
    t[`${key}-soft`] = dark ? r[900] : r[100];
    t[`on-${key}-soft`] = dark ? pick(r, [200, 100, 50], r[900], 4.5) : pick(r, [800, 900], r[100], 4.5);
    // Status text (hints, inline errors, deltas) straight on the card surface.
    t[`${key}-text`] = dark ? pick(r, [300, 200, 100], t.surface, 4.5) : pick(r, [700, 800, 900], t.surface, 4.5);
  }

  // Radius scale
  t['r-sm'] = `${Math.max(2, radius * 0.5)}px`;
  t['r-md'] = `${radius * 0.75}px`;
  t['r-lg'] = `${radius * 1.25}px`;

  LEVELS.forEach(l => { t[`p-${l}`] = p[l]; t[`n-${l}`] = n[l]; t[`s-${l}`] = sec[l]; });

  const pairs: [string, string, string, number][] = [
    ['Body text', 'text', 'surface', 4.5],
    ['Secondary text', 'text-2', 'surface', 4.5],
    ['Tertiary text', 'text-3', 'surface', 3],
    ['Primary button', 'on-accent', 'accent', 4.5],
    ['Link', 'accent-text', 'surface', 4.5],
    ['Tag', 'on-accent-soft', 'accent-soft', 4.5],
    ['Success tag', 'on-success-soft', 'success-soft', 4.5],
    ['Warning tag', 'on-warning-soft', 'warning-soft', 4.5],
    ['Danger tag', 'on-danger-soft', 'danger-soft', 4.5],
    ['Info tag', 'on-info-soft', 'info-soft', 4.5],
    ['Secondary chip', 'on-secondary-soft', 'secondary-soft', 4.5],
    ['Error text', 'danger-text', 'surface', 4.5],
    ['Field border', 'border-strong', 'surface', 3],
    ['Switch off', 'switch-off', 'surface', 3],
    ['Accent on surface', 'accent', 'surface', 3],
  ];
  const audit: AuditPair[] = pairs.map(([label, fg, bg, min]) => {
    const ratio = contrast(t[fg], t[bg]);
    return { label, fg, bg, min, ratio, pass: ratio >= min };
  });

  const vars: Record<string, string> = {};
  Object.entries(t).forEach(([k, v]) => { vars[`--${k}`] = v; });

  return { vars, primary: p, neutral: n, audit, failures: audit.filter(a => !a.pass).length, isDark: dark };
}

/** Serialise tokens as a :root block (used by exports and by the Pigmento sandbox). */
export const tokensToCss = (tokens: PlaygroundTokens, selector = ':root'): string =>
  `${selector} {\n${Object.entries(tokens.vars).map(([k, v]) => `  ${k}: ${v};`).join('\n')}\n}`;
