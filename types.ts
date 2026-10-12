
export interface ColorHSL {
  h: number; // 0-360
  s: number; // 0-100
  l: number; // 0-100
}

export interface ColorRGB {
  r: number;
  g: number;
  b: number;
}

export interface ColorCMYK {
  c: number;
  m: number;
  y: number;
  k: number;
}

export interface GlobalCurveConfig {
  vibrancy: number; // -100 to 100 (Saturation modifier)
  contrast: number; // -100 to 100 (Lightness curve modifier)
  hueTorsion: number; // -50 to 50 (Hue shift modifier)
  steps: number; // Global step count (default 11)
}

export interface ScaleConfiguration {
  hueShift: number; // Degrees to rotate hue from dark to light (-180 to 180)
  saturationBoost: number; // Multiplier for saturation at center vs ends
  lightnessEase: 'linear' | 'ease-in' | 'ease-out' | 'ease-in-out';
  useOkLCH: boolean; // Future proofing for perceptual color space
  lockInputColor?: boolean; // If true, the 500 shade will exactly match the input Hex
  
  // New: Linear Blend Mode
  mode?: 'curves' | 'linear';
  linearConfig?: {
      start: { l: number; c: number; h: number }; // L (0-1), C (0-0.4), H (0-360)
      end: { l: number; c: number; h: number };
      steps: number;
  };
}

export interface ColorData {
  hex: string;
  rgb: ColorRGB;
  hsl: ColorHSL;
  name: string;
  exactMatch: boolean;
  scaleConfig?: ScaleConfiguration; // New field for Polaris-like editing
}

export interface ColorGroup {
  name: string;
  colors: ColorData[];
}

export type HarmonyType = 'monochromatic' | 'analogous' | 'complementary' | 'split-complementary' | 'triadic' | 'square' | 'custom';
export type InputMode = 'wheel' | 'curves' | '3d';
export type PaletteTab = 'brand' | 'neutrals' | 'system';

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
  palettePreview?: ColorData[]; // Visual swatch strip for AI responses
}

export interface Shade {
  level: number;
  hex: string;
  contrastWhite: number;
  contrastBlack: number;
  isInput?: boolean; // Indicates if this shade is the locked anchor (original input)
}

export type ExportFormat = 'skill' | 'css' | 'scss' | 'tailwind' | 'json' | 'ase' | 'procreate' | 'figma';

// New Config for UI Playground
export interface PlaygroundConfig {
    primaryIndex: number; // Index in the brand palette to use as Main Primary
    surfaceMode: 'neutral' | 'brand'; // Use Neutral-50 or Brand-50 for bg
    textMode: 'base' | 'tinted'; // Use Base Neutral or Tinted Neutral for text
    disabledMode: 'base' | 'tinted'; // Use Base Neutral or Tinted Neutral for disabled elements
    isDarkMode: boolean;
}

