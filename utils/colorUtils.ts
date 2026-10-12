
import { ColorHSL, ColorRGB, ColorData, Shade, ColorCMYK, ColorGroup, ScaleConfiguration, GlobalCurveConfig } from '../types';
import { ntc } from './ntc';

// --- Conversions ---

export const hslToRgb = (h: number, s: number, l: number): ColorRGB => {
  s /= 100;
  l /= 100;
  const k = (n: number) => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) =>
    l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  return {
    r: Math.round(f(0) * 255),
    g: Math.round(f(8) * 255),
    b: Math.round(f(4) * 255),
  };
};

export const rgbToHsl = (r: number, g: number, b: number): ColorHSL => {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0, s = 0, l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h *= 60;
  }
  return { h: Math.round(h), s: Math.round(s * 100), l: Math.round(l * 100) };
};

// New: HSB/HSV Conversion logic
export const hsbToHsl = (h: number, s: number, b: number): ColorHSL => {
    // Arguments: H:0-360, S:0-100, B:0-100 (Brightness/Value)
    s /= 100;
    b /= 100;
    
    const l = (2 - s) * b / 2;
    
    let newS = 0;
    if (l !== 0 && l !== 1) {
        newS = (s * b) / (l < 0.5 ? l * 2 : 2 - l * 2);
    }
    
    return {
        h: Math.round(h),
        s: Math.round(newS * 100),
        l: Math.round(l * 100)
    };
};

export const hslToHsb = (h: number, s: number, l: number): { h: number, s: number, b: number } => {
    // Arguments: H:0-360, S:0-100, L:0-100
    s /= 100;
    l /= 100;
    
    const t = s * (l < 0.5 ? l : 1 - l);
    const b = l + t;
    const newS = l > 0 ? (2 * t) / b : 0;
    
    return {
        h: Math.round(h),
        s: Math.round(newS * 100),
        b: Math.round(b * 100)
    };
};

export const rgbToHex = (r: number, g: number, b: number): string => {
  const toHex = (c: number) => {
    const hex = Math.max(0, Math.min(255, c)).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase();
};

export const hexToRgb = (hex: string): ColorRGB => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : { r: 0, g: 0, b: 0 };
};

// Returns RGB in 0-1 range for file formats like ASE
export const hexToRgbNormalized = (hex: string): {r:number, g:number, b:number} => {
    const rgb = hexToRgb(hex);
    return { r: rgb.r / 255, g: rgb.g / 255, b: rgb.b / 255 };
};

export const hexToHsl = (hex: string): ColorHSL => {
  const rgb = hexToRgb(hex);
  return rgbToHsl(rgb.r, rgb.g, rgb.b);
};

export const rgbToCmyk = (r: number, g: number, b: number): ColorCMYK => {
  let c = 0, m = 0, y = 0, k = 0;
  r = r / 255;
  g = g / 255;
  b = b / 255;

  k = Math.min(1 - r, 1 - g, 1 - b);
  if (k !== 1) {
    c = (1 - r - k) / (1 - k);
    m = (1 - g - k) / (1 - k);
    y = (1 - b - k) / (1 - k);
  } else {
    c = 0; m = 0; y = 0;
  }

  return {
    c: Math.round(c * 100),
    m: Math.round(m * 100),
    y: Math.round(y * 100),
    k: Math.round(k * 100)
  };
};

// --- OKLCH MATH ENGINE ---

// 1. Utility: Gamma Correction
const lin_sRGB = (c: number) => c > 0.04045 ? Math.pow((c + 0.055) / 1.055, 2.4) : c / 12.92;
const gam_sRGB = (c: number) => c > 0.0031308 ? 1.055 * Math.pow(c, 1.0 / 2.4) - 0.055 : 12.92 * c;

// 2. RGB to OKLCH
export const rgbToOklch = (r: number, g: number, b: number): { l: number, c: number, h: number } => {
    // 0-255 to 0-1 Linear
    const lr = lin_sRGB(r / 255);
    const lg = lin_sRGB(g / 255);
    const lb = lin_sRGB(b / 255);

    // Linear sRGB -> LMS
    const l_ = 0.4122214708 * lr + 0.5363325363 * lg + 0.0514459929 * lb;
    const m_ = 0.2119034982 * lr + 0.6806995451 * lg + 0.1073969566 * lb;
    const s_ = 0.0883024619 * lr + 0.2817188376 * lg + 0.6299787005 * lb;

    const l__ = Math.cbrt(l_);
    const m__ = Math.cbrt(m_);
    const s__ = Math.cbrt(s_);

    // LMS -> OKLCH
    const L = 0.2104542553 * l__ + 0.7936177850 * m__ - 0.0040720468 * s__;
    const a = 1.9779984951 * l__ - 2.4285922050 * m__ + 0.4505937099 * s__;
    const b_ = 0.0259040371 * l__ + 0.7827717662 * m__ - 0.8086757660 * s__;

    const C = Math.sqrt(a * a + b_ * b_);
    let h = Math.atan2(b_, a) * 180 / Math.PI;
    if (h < 0) h += 360;

    return { l: L, c: C, h: h };
};

// 3. OKLCH to RGB
export const oklchToRgb = (l: number, c: number, h: number): ColorRGB => {
    const hRad = h * Math.PI / 180;
    const a = c * Math.cos(hRad);
    const b_ = c * Math.sin(hRad);

    const l_ = l + 0.3963377774 * a + 0.2158037573 * b_;
    const m_ = l - 0.1055613458 * a - 0.0638541728 * b_;
    const s_ = l - 0.0894841775 * a - 1.2914855480 * b_;

    const l__ = l_ * l_ * l_;
    const m__ = m_ * m_ * m_;
    const s__ = s_ * s_ * s_;

    // LMS -> Linear sRGB
    let r = 4.0767416621 * l__ - 3.3077115913 * m__ + 0.2309699292 * s__;
    let g = -1.2684380046 * l__ + 2.6097574011 * m__ - 0.3413193965 * s__;
    let b = -0.0041960863 * l__ - 0.7034186147 * m__ + 1.7076147010 * s__;

    // Linear -> Gamma sRGB and Clamp
    r = Math.min(255, Math.max(0, Math.round(gam_sRGB(r) * 255)));
    g = Math.min(255, Math.max(0, Math.round(gam_sRGB(g) * 255)));
    b = Math.min(255, Math.max(0, Math.round(gam_sRGB(b) * 255)));

    return { r, g, b };
};

const oklchToLinear = (l: number, c: number, h: number) => {
    const hRad = h * Math.PI / 180;
    const a = c * Math.cos(hRad);
    const b_ = c * Math.sin(hRad);
    const l_ = l + 0.3963377774 * a + 0.2158037573 * b_;
    const m_ = l - 0.1055613458 * a - 0.0638541728 * b_;
    const s_ = l - 0.0894841775 * a - 1.2914855480 * b_;
    const l__ = l_ * l_ * l_;
    const m__ = m_ * m_ * m_;
    const s__ = s_ * s_ * s_;
    return {
        r: 4.0767416621 * l__ - 3.3077115913 * m__ + 0.2309699292 * s__,
        g: -1.2684380046 * l__ + 2.6097574011 * m__ - 0.3413193965 * s__,
        b: -0.0041960863 * l__ - 0.7034186147 * m__ + 1.7076147010 * s__,
    };
};

export const oklchInGamut = (l: number, c: number, h: number): boolean => {
    const { r, g, b } = oklchToLinear(l, c, h);
    const eps = 1e-4;
    return r >= -eps && r <= 1 + eps && g >= -eps && g <= 1 + eps && b >= -eps && b <= 1 + eps;
};

/** Highest chroma that stays inside sRGB at this lightness and hue. */
export const maxOklchChroma = (l: number, h: number): number => {
    if (!oklchInGamut(l, 0, h)) return 0;
    let lo = 0;
    let hi = 0.4;
    if (oklchInGamut(l, hi, h)) return hi;
    for (let i = 0; i < 14; i++) {
        const mid = (lo + hi) / 2;
        if (oklchInGamut(l, mid, h)) lo = mid;
        else hi = mid;
    }
    return lo;
};


// --- Luminance & Contrast ---

export const getLuminance = (r: number, g: number, b: number) => {
  const a = [r, g, b].map((v) => {
    v /= 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  });
  return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
};

export const getContrastRatio = (lum1: number, lum2: number) => {
  const lighter = Math.max(lum1, lum2);
  const darker = Math.min(lum1, lum2);
  return (lighter + 0.05) / (darker + 0.05);
};

// --- Color Object Builder ---

export const createColorData = (hex: string, scaleConfig?: ScaleConfiguration, customName?: string): ColorData => {
  // Normalize hex
  if (hex.length === 4) {
    hex = '#' + hex[1] + hex[1] + hex[2] + hex[2] + hex[3] + hex[3];
  }
  const rgb = hexToRgb(hex);
  const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
  const ntcMatch = ntc.name(hex);

  // If a custom name (from AI) is provided, use it. Otherwise fallback to NTC.
  // Note: NTC exact match is still useful metadata, but name takes precedence if custom.
  const finalName = customName || ntcMatch.name;

  return {
    hex: hex.toUpperCase(),
    rgb,
    hsl,
    name: finalName,
    exactMatch: ntcMatch.exact,
    scaleConfig // preserve if passed
  };
};

export const createColorDataFromHSL = (h: number, s: number, l: number, name?: string): ColorData => {
  const rgb = hslToRgb(h, s, l);
  const hex = rgbToHex(rgb.r, rgb.g, rgb.b);
  return createColorData(hex, undefined, name);
};

// --- Image Color Extraction ---
export const extractColorsFromImage = (imageSrc: string, maxColors: number = 8): Promise<ColorData[]> => {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = "Anonymous";
        img.onload = () => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            if (!ctx) { reject("Canvas error"); return; }

            // Downsample for performance (max 100px dimension)
            const scale = Math.min(1, 100 / Math.max(img.width, img.height));
            canvas.width = img.width * scale;
            canvas.height = img.height * scale;
            
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
            
            const colorMap: Record<string, number> = {};
            const quantize = (n: number) => Math.round(n / 20) * 20;

            for (let i = 0; i < imageData.length; i += 4) {
                const r = imageData[i];
                const g = imageData[i + 1];
                const b = imageData[i + 2];
                const a = imageData[i + 3];
                
                if (a < 128) continue; // Skip transparent

                const qr = quantize(r);
                const qg = quantize(g);
                const qb = quantize(b);
                
                const hex = rgbToHex(qr, qg, qb);
                colorMap[hex] = (colorMap[hex] || 0) + 1;
            }

            const sortedHexes = Object.entries(colorMap)
                .sort((a, b) => b[1] - a[1])
                .map(entry => entry[0]);

            const distinctColors: string[] = [];
            
            for (const hex of sortedHexes) {
                if (distinctColors.length >= maxColors) break;
                const rgb1 = hexToRgb(hex);
                const isSimilar = distinctColors.some(existing => {
                    const rgb2 = hexToRgb(existing);
                    const dist = Math.sqrt(
                        Math.pow(rgb1.r - rgb2.r, 2) + 
                        Math.pow(rgb1.g - rgb2.g, 2) + 
                        Math.pow(rgb1.b - rgb2.b, 2)
                    );
                    return dist < 40; 
                });
                if (!isSimilar) distinctColors.push(hex);
            }

            resolve(distinctColors.map(hex => createColorData(hex)));
        };
        img.onerror = reject;
        img.src = imageSrc;
    });
};

// --- Intelligent Deduplication ---
export const deduplicateColorNames = (colors: ColorData[]): ColorData[] => {
    const nameGroups: Record<string, number[]> = {};
    colors.forEach((c, idx) => {
        if (!nameGroups[c.name]) nameGroups[c.name] = [];
        nameGroups[c.name].push(idx);
    });

    const newColors = [...colors];
    Object.keys(nameGroups).forEach(name => {
        const indices = nameGroups[name];
        if (indices.length > 1) {
            const groupColors = indices.map(idx => ({ ...newColors[idx], originalIndex: idx }));
            groupColors.sort((a, b) => b.hsl.l - a.hsl.l);
            groupColors.forEach((c, i) => {
                let modifier = "";
                const total = groupColors.length;
                if (c.hsl.l > 85) modifier = "Pale";
                else if (c.hsl.l > 70) modifier = "Light";
                else if (c.hsl.l < 20) modifier = "Deep";
                else if (c.hsl.l < 35) modifier = "Dark";
                
                if (!modifier) {
                    if (c.hsl.s < 10) modifier = "Grayish";
                    else if (c.hsl.s > 80) modifier = "Vivid";
                    else if (c.hsl.s > 60) modifier = "Rich";
                    else modifier = "Medium";
                }
                if (total === 2 && modifier === "Medium") {
                    modifier = i === 0 ? "Lighter" : "Darker";
                }
                
                const existingName = name;
                if (existingName.toLowerCase().includes(modifier.toLowerCase())) {
                     modifier = "True";
                }

                newColors[c.originalIndex] = {
                    ...newColors[c.originalIndex],
                    name: `${modifier} ${existingName}`.trim()
                };
            });
        }
    });
    return newColors;
};

// --- Harmonies ---
export const generateHarmonies = (base: ColorHSL, type: string): ColorData[] => {
  const colors: ColorData[] = [];
  const { h, s, l } = base;

  const addColor = (hueOffset: number, satMult = 1, lightMult = 1) => {
    let newH = (h + hueOffset) % 360;
    if (newH < 0) newH += 360;
    const newS = Math.max(0, Math.min(100, s * satMult));
    const newL = Math.max(0, Math.min(100, l * lightMult));
    colors.push(createColorDataFromHSL(newH, newS, newL));
  };

  colors.push(createColorDataFromHSL(h, s, l));

  switch (type) {
    case 'complementary': addColor(180); break;
    case 'analogous': addColor(-30); addColor(30); break;
    case 'split-complementary': addColor(150); addColor(210); break;
    case 'triadic': addColor(120); addColor(240); break;
    case 'square': addColor(90); addColor(180); addColor(270); break;
    case 'monochromatic':
      addColor(0, 1, 1.4);
      addColor(0, 0.7, 0.6);
      addColor(0, 1, 0.3);
      addColor(0, 0.5, 0.9);
      break;
  }
  return colors;
};

// --- Neutrals and semantic roles ---
export const generateNeutrals = (base: ColorHSL): ColorData[] => {
    const hue = base.h;
    const tinted = createColorDataFromHSL(hue, 6, 50, "Tinted Neutral");
    const gray = createColorDataFromHSL(hue, 2, 50, "Base Neutral");
    return [tinted, gray];
};

const SEMANTIC_HUES = [
    { name: 'Success', h: 145 },
    { name: 'Warning', h: 75 },
    { name: 'Error', h: 25 },
    { name: 'Info', h: 255 },
] as const;

const colorFromOklch = (l: number, c: number, h: number, name: string): ColorData => {
    const rgb = oklchToRgb(l, c, h);
    return createColorData(rgbToHex(rgb.r, rgb.g, rgb.b), undefined, name);
};

export const generateSemantics = (base: ColorHSL, neutrals: ColorData[] = []): ColorData[] => {
    const rgb = hslToRgb(base.h, base.s, base.l);
    const anchor = rgbToOklch(rgb.r, rgb.g, rgb.b);
    const roles = SEMANTIC_HUES.map((role) => colorFromOklch(anchor.l, anchor.c, role.h, role.name));
    const neutral = neutrals[1] ?? neutrals[0];
    if (neutral) roles.push(createColorData(neutral.hex, undefined, 'Disabled'));
    return roles;
};

// --- Shades & Advanced Interpolation ---

export const getLinearOKLCHSteps = (
    steps: number,
    start: { l: number, c: number, h: number }, // Expects L: 0-1
    end: { l: number, c: number, h: number }
): Shade[] => {
    const result: Shade[] = [];
    
    // Safety check for 1 step
    if (steps <= 1) {
        const rgb = oklchToRgb(start.l, start.c, start.h);
        const hex = rgbToHex(rgb.r, rgb.g, rgb.b);
        const lum = getLuminance(rgb.r, rgb.g, rgb.b);
        return [{ level: 500, hex, contrastWhite: 0, contrastBlack: 0 }];
    }

    const divider = steps - 1;

    for (let i = 0; i < steps; i++) {
        const t = i / divider;
        
        // Exact logic from "OKLCH Blend Colors Tool" script
        const l = start.l + (end.l - start.l) * t;
        const c = start.c + (end.c - start.c) * t;
        const h = start.h + (end.h - start.h) * t; 
        
        const rgb = oklchToRgb(l, c, h);
        const hex = rgbToHex(rgb.r, rgb.g, rgb.b);
        const lum = getLuminance(rgb.r, rgb.g, rgb.b);
        
        // Dynamic leveling
        let level = (i + 1) * 100;
        if (steps === 11) {
             level = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950][i];
        }
        
        result.push({
            level,
            hex,
            contrastWhite: parseFloat(getContrastRatio(lum, 1).toFixed(2)),
            contrastBlack: parseFloat(getContrastRatio(lum, 0).toFixed(2)),
            isInput: false
        });
    }
    return result;
}

export const generateShades = (color: ColorData, globalConfig?: GlobalCurveConfig): Shade[] => {
  const steps = globalConfig?.steps || 11;
  const config = color.scaleConfig;

  // 1. Check for Manual Override (Pre-configured Linear scale in Tuner)
  if (config?.mode === 'linear' && config.linearConfig) {
      const { start, end } = config.linearConfig;
      return getLinearOKLCHSteps(steps, start, end);
  }

  // 2. Adaptive Generation Engine (OKLCH or HSL)
  const useOklch = config?.useOkLCH ?? true;
  
  // Current values & Targets
  let currentH, currentS, currentL;
  let targetLightL, targetDarkL;

  if (useOklch) {
      const oklch = rgbToOklch(color.rgb.r, color.rgb.g, color.rgb.b);
      currentH = oklch.h;
      currentS = oklch.c;
      currentL = oklch.l;
      
      targetLightL = 0.985; // 98.5% Lightness (Very Light)
      targetDarkL = 0.11;   // 11% Lightness (Dark charcoal)
  } else {
      // HSL Path
      currentH = color.hsl.h;
      currentS = color.hsl.s;
      currentL = color.hsl.l;
      
      targetLightL = 98;
      targetDarkL = 10;
  }
  
  // Calculate Position of Input in Scale
  const range = targetLightL - targetDarkL;
  const relL = (currentL - targetDarkL) / range; // 0 (dark) to 1 (light)
  
  // Map to index (0 = light/50, steps-1 = dark/950)
  let closestIndex = Math.round((1 - relL) * (steps - 1));
  closestIndex = Math.max(0, Math.min(steps - 1, closestIndex));
  
  const shades: Shade[] = [];
  
  // Helper for easing
  const applyEase = (t: number) => {
      const mode = config?.lightnessEase || 'linear';
      if (mode === 'linear') return t;
      if (mode === 'ease-in') return t * t;
      if (mode === 'ease-out') return t * (2 - t);
      if (mode === 'ease-in-out') return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
      return t;
  };

  for (let i = 0; i < steps; i++) {
      let l, s, h;
      const tGlobal = i / (steps - 1); // 0 (Light) to 1 (Dark)

      if (i < closestIndex) {
          // Segment 1: Light -> Input
          const tSeg = i / closestIndex; 
          const tEased = applyEase(tSeg);
          
          l = targetLightL + (currentL - targetLightL) * tEased;
          
          // Chroma/Sat Interpolation
          if (useOklch) {
             const startS = currentS * 0.3; // Low chroma white
             s = startS + (currentS - startS) * tEased;
          } else {
             const startS = currentS * 0.2; 
             s = startS + (currentS - startS) * tEased;
          }
          h = currentH;

      } else if (i > closestIndex) {
          // Segment 2: Input -> Dark
          const tSeg = (i - closestIndex) / (steps - 1 - closestIndex); 
          const tEased = applyEase(tSeg);
          
          l = currentL + (targetDarkL - currentL) * tEased;
          
          // Chroma/Sat Interpolation
          if (useOklch) {
              const endS = currentS * 0.7; // Reduce chroma slightly in darks
              s = currentS + (endS - currentS) * tEased;
          } else {
              const endS = currentS * 0.6;
              s = currentS + (endS - currentS) * tEased;
          }
          h = currentH;

      } else {
          // Exact Input
          l = currentL;
          s = currentS;
          h = currentH;
      }
      
      // --- APPLY MODIFIERS (ScaleConfiguration) ---
      if (config) {
          // 1. Hue Shift (Rotation)
          if (config.hueShift && config.hueShift !== 0) {
              const shiftFactor = tGlobal - 0.5;
              h += shiftFactor * config.hueShift;
          }

          // 2. Saturation Boost (Curve)
          if (config.saturationBoost && config.saturationBoost !== 0) {
              const boostCurve = 1 - Math.pow(2 * tGlobal - 1, 2); 
              const scale = useOklch ? 0.05 : 15; 
              s += boostCurve * (config.saturationBoost / 100) * scale;
          }
      }

      // --- APPLY GLOBAL MODIFIERS (GlobalCurveConfig) ---
      if (globalConfig) {
          if (globalConfig.vibrancy) {
              const vScale = useOklch ? 0.05 : 10;
              s += (globalConfig.vibrancy / 100) * vScale;
          }
          if (globalConfig.contrast) {
              const factor = 1 + globalConfig.contrast / 100;
              const mid = useOklch ? 0.5 : 50;
              l = mid + (l - mid) * factor;
          }
          if (globalConfig.hueTorsion) {
              h += (tGlobal - 0.5) * globalConfig.hueTorsion;
          }
      }

      // --- CLAMPING & CONVERSION ---
      if (useOklch) {
          s = Math.max(0, s);
          l = Math.max(0.001, Math.min(0.999, l)); // Avoid true black/white causing NaN in some converters
      } else {
          s = Math.max(0, Math.min(100, s));
          l = Math.max(0, Math.min(100, l));
          h = h % 360;
          if (h < 0) h += 360;
      }

      let rgb;
      if (useOklch) {
          rgb = oklchToRgb(l, s, h);
      } else {
          rgb = hslToRgb(h, s, l);
      }
      
      const hex = rgbToHex(rgb.r, rgb.g, rgb.b);
      const lum = getLuminance(rgb.r, rgb.g, rgb.b);
      
      let level = (i + 1) * 100;
      if (steps === 11) level = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950][i];
      
      shades.push({
          level,
          hex,
          contrastWhite: parseFloat(getContrastRatio(lum, 1).toFixed(2)),
          contrastBlack: parseFloat(getContrastRatio(lum, 0).toFixed(2)),
          isInput: i === closestIndex
      });
  }
  
  return shades;
};

// --- LAB approximation for info ---
export const rgbToLab = (r: number, g: number, b: number) => {
  return "58.02, 40.11, 20.36"; // Placeholder
};

// --- Palette Tuner Utils ---

export const extractHexCodes = (input: string): string[] => {
  const withHash = input.match(/#[a-fA-F0-9]{3,6}/g);
  if (withHash) {
    return withHash.map(h => {
        if (h.length === 4) return '#' + h[1] + h[1] + h[2] + h[2] + h[3] + h[3];
        return h;
    });
  }
  return [];
};

// Algorithm A: OKLCH Direct Linear Interpolation (Pure OKLCH Philosophy)
// Simple linear interpolation in OKLCH space - L, C, H interpolated directly
// Based on Evil Martians OKLCH Blend Colors Tool approach
export const tunePaletteOKLCH = (colors: ColorData[], steps: number = 11, manualStart?: ColorData, manualEnd?: ColorData): ColorData[] => {
    if (colors.length < 1 && !manualStart && !manualEnd) return colors;
    
    // Sort input to find extremes by OKLCH L
    const sorted = [...colors].map(c => {
        const oklch = rgbToOklch(c.rgb.r, c.rgb.g, c.rgb.b);
        return { ...c, oklch };
    }).sort((a, b) => b.oklch.l - a.oklch.l);

    // Get start and end in OKLCH
    const startColor = manualStart || sorted[0];
    const endColor = manualEnd || sorted[sorted.length - 1];
    
    let startOk = rgbToOklch(startColor.rgb.r, startColor.rgb.g, startColor.rgb.b);
    let endOk = rgbToOklch(endColor.rgb.r, endColor.rgb.g, endColor.rgb.b);
    
    // If single color input, create reasonable extremes preserving chroma and hue
    if (colors.length === 1 && !manualStart && !manualEnd) {
        // Use more conservative extremes: 0.90 (light) and 0.10 (dark) instead of 0.96/0.04
        startOk = { l: 0.90, c: startOk.c, h: startOk.h };
        endOk = { l: 0.10, c: endOk.c, h: endOk.h };
    }

    const result: ColorData[] = [];
    const divider = steps - 1;

    // Direct linear interpolation in OKLCH space (like Evil Martians tool)
    // But with aggressive chroma preservation in middle tones to prevent desaturation
    const maxChroma = Math.max(startOk.c, endOk.c);
    const minChroma = Math.min(startOk.c, endOk.c);
    
    for (let i = 0; i < steps; i++) {
        const t = i / divider;
        
        // Linear interpolation of L and H in OKLCH space
        let l = startOk.l + (endOk.l - startOk.l) * t;
        
        // Make the first color (background) closer to white while preserving hue
        // Background colors should be very light but still show the color tint
        if (i === 0 && t === 0) {
            // Push lightness closer to white (0.95-0.98) but keep some chroma for color identity
            l = Math.max(0.95, Math.min(0.98, l + 0.05));
        }
        
        // Very aggressive chroma preservation: maintain maximum chroma in middle tones
        // This prevents the "washed out" appearance in intermediate colors
        let c;
        if (maxChroma > 0.01) {
            // Use a strong curve that maintains max chroma in the middle 60% of the range
            // This ensures vibrant colors throughout the middle section
            const isMiddleRange = t >= 0.2 && t <= 0.8;
            
            if (i === 0 && t === 0) {
                // First color (background): reduce chroma slightly but keep color identity
                // Keep 55-60% of original chroma so it's not pure white but still very light with visible color
                c = maxChroma * 0.58;
            } else if (isMiddleRange) {
                // In middle range: maintain high chroma (90-100% of max)
                // Use a curve that peaks at the center
                const centerDistance = Math.abs(t - 0.5) / 0.3; // 0 at center, 1 at edges of middle range
                const middleCurve = 1 - Math.pow(centerDistance, 1.5);
                // Maintain 90-100% of max chroma in middle
                c = maxChroma * (0.9 + 0.1 * middleCurve);
            } else {
                // At edges: interpolate linearly but don't drop too low
                const linearChroma = startOk.c + (endOk.c - startOk.c) * t;
                // Ensure edges maintain at least 70% of max chroma
                c = Math.max(linearChroma, maxChroma * 0.7);
            }
            
            // Final bounds check
            c = Math.min(c, maxChroma * 1.05); // Allow slight overage
            c = Math.max(c, minChroma * 0.85); // Don't go too low
        } else {
            // If both are very low chroma, just interpolate linearly
            c = startOk.c + (endOk.c - startOk.c) * t;
        }
        
        // Handle hue wrapping (take shortest path)
        let h = startOk.h + (endOk.h - startOk.h) * t;
        const hDiff = endOk.h - startOk.h;
        if (Math.abs(hDiff) > 180) {
            if (hDiff > 0) {
                h = startOk.h + (endOk.h - 360 - startOk.h) * t;
            } else {
                h = startOk.h + (endOk.h + 360 - startOk.h) * t;
            }
        }
        if (h < 0) h += 360;
        if (h >= 360) h -= 360;
        
        // Ensure chroma is non-negative
        c = Math.max(0, c);
        
        // Convert OKLCH to RGB
        const rgb = oklchToRgb(l, c, h);
        result.push(createColorData(rgbToHex(rgb.r, rgb.g, rgb.b)));
    }
    
    return result;
};

// Algorithm B: Perceived Luminance Linear Interpolation (Straight Line)
// Interpolates perceived luminance linearly, giving a perfectly straight line in the graph
export const tunePaletteLinear = (colors: ColorData[], steps: number = 11, manualStart?: ColorData, manualEnd?: ColorData): ColorData[] => {
    if (colors.length < 1 && !manualStart && !manualEnd) return colors;
    
    // Sort by perceived luminance
    const sorted = [...colors].map(c => ({
        ...c,
        lum: getLuminance(c.rgb.r, c.rgb.g, c.rgb.b)
    })).sort((a, b) => b.lum - a.lum);
    
    const startColor = manualStart || sorted[0];
    const endColor = manualEnd || sorted[sorted.length - 1];
    
    // Get start and end HSL and luminances
    const startHsl = startColor.hsl;
    const endHsl = endColor.hsl;
    const startLum = getLuminance(startColor.rgb.r, startColor.rgb.g, startColor.rgb.b);
    const endLum = getLuminance(endColor.rgb.r, endColor.rgb.g, endColor.rgb.b);
    
    const result: ColorData[] = [];
    const divider = steps - 1;

    for (let i = 0; i < steps; i++) {
        const t = i / divider;
        
        // Interpolate perceived luminance linearly (this gives the straight line)
        const targetLum = startLum + (endLum - startLum) * t;
        
        // Interpolate H and S linearly in HSL
        let h = startHsl.h + (endHsl.h - startHsl.h) * t;
        let s = startHsl.s + (endHsl.s - startHsl.s) * t;
        
        // Handle hue wrapping (take shortest path)
        const hDiff = endHsl.h - startHsl.h;
        if (Math.abs(hDiff) > 180) {
            if (hDiff > 0) {
                h = startHsl.h + (endHsl.h - 360 - startHsl.h) * t;
            } else {
                h = startHsl.h + (endHsl.h + 360 - startHsl.h) * t;
            }
        }
        if (h < 0) h += 360;
        if (h >= 360) h -= 360;
        
        // Clamp saturation
        s = Math.max(0, Math.min(100, s));
        
        // Binary search for L in HSL that gives us the target perceived luminance
        let low = 0;
        let high = 100;
        let bestL = startHsl.l + (endHsl.l - startHsl.l) * t; // Initial guess
        
        for (let iter = 0; iter < 30; iter++) {
            const testL = (low + high) / 2;
            const testRgb = hslToRgb(h, s, testL);
            const testLum = getLuminance(testRgb.r, testRgb.g, testRgb.b);
            
            if (Math.abs(testLum - targetLum) < 0.0001) {
                bestL = testL;
                break;
            }
            
            if (testLum < targetLum) {
                low = testL;
            } else {
                high = testL;
            }
            bestL = testL;
        }
        
        // Clamp lightness
        bestL = Math.max(0, Math.min(100, bestL));
        
        // Convert HSL to RGB
        const rgb = hslToRgb(h, s, bestL);
        result.push(createColorData(rgbToHex(rgb.r, rgb.g, rgb.b)));
    }
    return result;
};

// Algorithm C: HSL Linear Interpolation (Mathematical "Fit", Non-Perceptual)
// Interpolates values in HSL cylindrical space (Linear Hue, Linear Sat, Linear Lightness)
// This differs from OKLCH which balances for human perception.
export const tunePaletteLuminanceFit = (colors: ColorData[], steps: number = 11, manualStart?: ColorData, manualEnd?: ColorData): ColorData[] => {
    if (colors.length < 1 && !manualStart && !manualEnd) return colors;
    
    // Sort input to find extremes for Hue/Chroma reference
    const sorted = [...colors].sort((a, b) => b.hsl.l - a.hsl.l);

    const startColor = manualStart || sorted[0];
    const endColor = manualEnd || sorted[sorted.length - 1];
    
    const startHsl = startColor.hsl;
    const endHsl = endColor.hsl;

    const result: ColorData[] = [];
    const divider = steps - 1;

    for (let i = 0; i < steps; i++) {
        const t = i / divider;
        
        // Pure HSL Interpolation
        // Note: For Hue, we should take shortest path, but "Linear" often implies direct mathematical lerp.
        // We'll do direct lerp to be "strictly mathematical" as requested.
        
        let h = startHsl.h + (endHsl.h - startHsl.h) * t;
        let s = startHsl.s + (endHsl.s - startHsl.s) * t;
        let l = startHsl.l + (endHsl.l - startHsl.l) * t;
        
        // Clamp standard HSL ranges
        h = h % 360; if (h < 0) h += 360;
        s = Math.max(0, Math.min(100, s));
        l = Math.max(0, Math.min(100, l));
        
        const rgb = hslToRgb(h, s, l);
        result.push(createColorData(rgbToHex(rgb.r, rgb.g, rgb.b)));
    }
    
    return result;
};

// --- Parsing Groups ---
export const parseInputToGroups = (input: string): ColorGroup[] => {
  try {
    let jsonStr = input.trim();
    if (!jsonStr.startsWith('{') && jsonStr.includes(':')) {
        jsonStr = `{${jsonStr}}`;
    }
    const json = JSON.parse(jsonStr);
    return extractGroupsFromJSON(json);
  } catch (e) {
    const hexes = extractHexCodes(input);
    if (hexes.length === 0) return [];
    if (hexes.length > 6) return extractGroupsByHue(hexes);
    return [{ name: "Detected Colors", colors: hexes.map(h => createColorData(h)).sort((a,b) => b.hsl.l - a.hsl.l) }];
  }
};

const extractGroupsFromJSON = (json: any): ColorGroup[] => {
    const groups: Record<string, ColorData[]> = {};
    const traverse = (obj: any, prefix: string) => {
        if (!obj || typeof obj !== 'object') return;
        for (const key in obj) {
            const val = obj[key];
            const currentPath = prefix ? `${prefix}-${key}` : key;
            if (typeof val === 'string' && /^#?[0-9A-F]{3,6}$/i.test(val)) {
                addToGroup(currentPath, val);
            } else if (typeof val === 'object' && val.value && typeof val.value === 'string' && /^#?[0-9A-F]{3,6}$/i.test(val.value)) {
                addToGroup(currentPath, val.value);
            } else {
                traverse(val, currentPath);
            }
        }
    };
    const addToGroup = (path: string, hex: string) => {
        const parts = path.split(/[-_]/).filter(p => {
            const lower = p.toLowerCase();
            return lower !== 'color' && lower !== 'colors' && lower !== 'var' && lower !== 'palette';
        });
        if (parts.length === 0) { addGroup("Base", hex); return; }
        const last = parts[parts.length - 1];
        if (/^\d+$/.test(last)) {
            const name = parts.slice(0, -1).join(' ') || "Base";
             addGroup(name, hex);
        } else if (['default', 'hover', 'active', 'focus', 'pressed', 'light', 'dark'].includes(last.toLowerCase())) {
             const name = parts.slice(0, -1).join(' ') || "Base";
             addGroup(name, hex);
        } else {
            const name = parts.join(' ');
            addGroup(name, hex);
        }
    };
    const addGroup = (name: string, hex: string) => {
        const niceName = name.charAt(0).toUpperCase() + name.slice(1);
        if (!groups[niceName]) groups[niceName] = [];
        groups[niceName].push(createColorData(hex));
    };
    traverse(json, '');
    return Object.entries(groups).map(([name, colors]) => ({
        name,
        colors: colors.sort((a, b) => b.hsl.l - a.hsl.l)
    })).sort((a, b) => a.name.localeCompare(b.name));
};

const extractGroupsByHue = (hexes: string[]): ColorGroup[] => {
    const groups: Record<string, ColorData[]> = {};
    hexes.forEach(hex => {
        const cd = createColorData(hex);
        const { h, s, l } = cd.hsl;
        let family = "Grayscale";
        if (s < 10) family = "Grayscale";
        else {
            if (h >= 345 || h < 15) family = "Red";
            else if (h >= 15 && h < 45) family = "Orange";
            else if (h >= 45 && h < 75) family = "Yellow";
            else if (h >= 75 && h < 165) family = "Green";
            else if (h >= 165 && h < 195) family = "Cyan";
            else if (h >= 195 && h < 255) family = "Blue";
            else if (h >= 255 && h < 285) family = "Purple";
            else if (h >= 285 && h < 345) family = "Magenta";
        }
        if (!groups[family]) groups[family] = [];
        groups[family].push(cd);
    });
    return Object.entries(groups).map(([name, colors]) => ({
        name,
        colors: colors.sort((a, b) => b.hsl.l - a.hsl.l)
    })).sort((a, b) => a.name.localeCompare(b.name));
};
