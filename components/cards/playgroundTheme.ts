import { ColorData, GlobalCurveConfig, PlaygroundConfig } from '../../types';
import { generateShades, getContrastRatio, getLuminance, hexToRgb } from '../../utils/colorUtils';
import { ThemeColors } from './BaseComponents';

export type PlaygroundTheme = ThemeColors & {
  getSemantic: (type: string) => { bg: string; text: string; border: string };
};

export function buildPlaygroundTheme(
  brandPalette: ColorData[],
  neutralPalette: ColorData[],
  semanticPalette: ColorData[],
  config: PlaygroundConfig,
  globalConfig?: GlobalCurveConfig,
): PlaygroundTheme | null {
  const primarySource = brandPalette[config.primaryIndex] || brandPalette[0];
  const textNeutralSource = config.textMode === 'tinted' ? neutralPalette[0] : (neutralPalette[1] || neutralPalette[0]);
  const surfaceSource = config.surfaceMode === 'brand' ? primarySource : (neutralPalette[0] || primarySource);
  const disabledNeutralSource = config.disabledMode === 'tinted' ? neutralPalette[0] : (neutralPalette[1] || neutralPalette[0]);

  if (!primarySource || !textNeutralSource) return null;

  const pShades = generateShades(primarySource, globalConfig);
  const tShades = generateShades(textNeutralSource, globalConfig);
  const sShades = generateShades(surfaceSource, globalConfig);
  const dShades = generateShades(disabledNeutralSource, globalConfig);
  const semanticShades = semanticPalette.map(c => ({ name: c.name, shades: generateShades(c, globalConfig) }));

  const get = (shadesArr: { level: number; hex: string }[], level: number) => shadesArr.find(s => s.level === level)?.hex || '#000000';
  const isDark = config.isDarkMode;

  const getAccessiblePrimary = () => {
    const whiteHex = get(pShades, 50);
    const whiteLum = getLuminance(hexToRgb(whiteHex).r, hexToRgb(whiteHex).g, hexToRgb(whiteHex).b);
    const candidates = [500, 600, 700, 800];

    for (const level of candidates) {
      const bgHex = get(pShades, level);
      const bgLum = getLuminance(hexToRgb(bgHex).r, hexToRgb(bgHex).g, hexToRgb(bgHex).b);
      const ratio = getContrastRatio(bgLum, whiteLum);

      if (ratio >= 4.5) {
        return { bg: bgHex, text: whiteHex, hover: get(pShades, level === 800 ? 900 : level + 100) };
      }
    }
    return { bg: get(pShades, 500), text: get(pShades, 900), hover: get(pShades, 600) };
  };

  const primaryBtn = getAccessiblePrimary();
  const secondaryBg = isDark ? get(pShades, 900) : get(pShades, 100);
  const secondaryHover = isDark ? get(pShades, 700) : get(pShades, 300);
  const secondaryTextRaw = isDark ? get(pShades, 100) : (get(pShades, 800) || get(pShades, 700) || get(pShades, 600));

  const disabledBg = isDark ? get(dShades, 800) : get(dShades, 100);
  const disabledText = isDark ? get(dShades, 500) : get(dShades, 400);
  const disabledBorder = isDark ? get(dShades, 700) : get(dShades, 200);

  return {
    bg: {
      page: isDark ? get(tShades, 950) : get(sShades, 50),
      card: isDark ? get(tShades, 900) : '#FFFFFF',
      sidebar: isDark ? get(tShades, 950) : get(sShades, 50),
      input: isDark ? get(tShades, 800) : get(tShades, 50),
    },
    text: {
      main: isDark ? get(tShades, 50) : get(tShades, 900),
      secondary: isDark ? get(tShades, 300) : get(tShades, 500),
      tertiary: isDark ? get(tShades, 500) : get(tShades, 400),
      onPrimary: primaryBtn.text,
    },
    border: {
      subtle: isDark ? get(tShades, 800) : get(tShades, 100),
      default: isDark ? get(tShades, 700) : get(tShades, 200),
      focus: get(pShades, 500),
    },
    switch: {
      off: isDark ? get(tShades, 700) : get(tShades, 400),
    },
    action: {
      primary: primaryBtn.bg,
      primaryHover: primaryBtn.hover,
      secondaryBg,
      secondaryHover,
      secondaryText: secondaryTextRaw,
    },
    disabled: {
      bg: disabledBg,
      text: disabledText,
      border: disabledBorder,
    },
    semantic: {
      success: { bg: isDark ? '#052e16' : '#dcfce7', text: isDark ? '#4ade80' : '#166534', main: '#22c55e' },
      warning: { bg: isDark ? '#451a03' : '#ffedd5', text: isDark ? '#fb923c' : '#9a3412', main: '#f97316' },
      error: { bg: isDark ? '#450a0a' : '#fee2e2', text: isDark ? '#f87171' : '#991b1b', main: '#ef4444' },
      info: { bg: isDark ? '#082f49' : '#e0f2fe', text: isDark ? '#38bdf8' : '#075985', main: '#3b82f6' },
    },
    getSemantic: (type: string) => {
      const family = semanticShades.find(s => s.name.toLowerCase().includes(type));
      if (!family) return { bg: '#333', text: '#fff', border: '#333' };

      const bg = isDark ? get(family.shades, 900) : get(family.shades, 100);
      const txt = isDark ? get(family.shades, 200) : get(family.shades, 800);

      return {
        bg,
        text: txt,
        border: isDark ? get(family.shades, 700) : get(family.shades, 200),
      };
    },
    shades: {
      primary: pShades,
    },
  };
}
