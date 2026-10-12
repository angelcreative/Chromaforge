import { ColorData, ColorGroup, GlobalCurveConfig } from '../types';
import { generateShades } from './colorUtils';

const sanitize = (name: string) => {
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  return slug || 'color';
};

const uniqueKey = (base: string, used: Set<string>) => {
  let key = base;
  let i = 2;
  while (used.has(key)) {
    key = `${base}-${i}`;
    i += 1;
  }
  used.add(key);
  return key;
};

const rampBlock = (color: ColorData, token: string, globalConfig?: GlobalCurveConfig) => {
  const shades = generateShades(color, globalConfig);
  const twEntries = shades.map((shade) => `    ${shade.level}: '${shade.hex}'`).join(',\n');
  const cssVars = shades.map((shade) => `  --color-${token}-${shade.level}: ${shade.hex};`).join('\n');
  const anchor = shades.find((shade) => shade.isInput);
  const anchorLine = anchor
    ? `Step closest to the base color on screen: ${anchor.level} (${anchor.hex}).`
    : `Base color: ${color.hex}.`;

  return [
    `### ${color.name} (\`${token}\`)`,
    '',
    anchorLine,
    '',
    'Tailwind (`theme.extend.colors`):',
    '',
    '```js',
    `${token}: {`,
    twEntries,
    '}',
    '```',
    '',
    'React (CSS variables):',
    '',
    '```css',
    ':root {',
    `  --color-${token}: ${color.hex};`,
    cssVars,
    '}',
    '```',
    '',
  ].join('\n');
};

export interface ColorSkillSection {
  title: string;
  note: string;
  colors: ColorData[];
}

export const buildColorSkill = (args: {
  paletteName: string;
  sections: ColorSkillSection[];
  globalConfig?: GlobalCurveConfig;
}): string => {
  const steps = args.globalConfig?.steps ?? 11;
  const used = new Set<string>();
  const body: string[] = [];

  for (const section of args.sections) {
    if (!section.colors.length) continue;
    body.push(`## ${section.title}`, '', section.note, '');
    for (const color of section.colors) {
      body.push(rampBlock(color, uniqueKey(sanitize(color.name), used), args.globalConfig));
    }
  }

  if (body.length === 0) {
    body.push('## Palette', '', 'No colors are on screen yet.', '');
  }

  return [
    `# ${args.paletteName || 'Palette'} color skill`,
    '',
    'This file describes the palette currently on screen. Use these tokens. Do not invent a second ramp.',
    '',
    '## Rules',
    '',
    `- Each ramp has ${steps} steps. The hex values come from the same scale settings as the cards on screen.`,
    '- These hex values already include vibrancy, contrast, hue, and any per-color curve. Do not generate another ramp on top of them.',
    '- In Tailwind, extend `theme.colors` with the objects below. Do not swap them for the default Tailwind palette.',
    '- In React, put the CSS variables on `:root` or a theme class and use `var(--color-…)`. Do not hardcode a different hex for the same role.',
    '- Keep brand, neutral, and semantic roles separate. Do not reuse a semantic role as the brand color.',
    '- Choose a text step that stays readable on the surface step you pair it with. Do not assume every step works on white.',
    '- If a role is missing from this file, it is not part of this palette. Do not invent it.',
    '',
    ...body,
  ].join('\n');
};

export const buildStudioColorSkill = (args: {
  paletteName: string;
  brand: ColorData[];
  neutrals?: ColorData[];
  semantic?: ColorData[];
  globalConfig?: GlobalCurveConfig;
}): string =>
  buildColorSkill({
    paletteName: args.paletteName,
    globalConfig: args.globalConfig,
    sections: [
      {
        title: 'Brand',
        note: 'Brand ramps. Use these for the product color, not for status.',
        colors: args.brand,
      },
      {
        title: 'Neutrals',
        note: 'Neutrals for surfaces, borders, and text.',
        colors: args.neutrals || [],
      },
      {
        title: 'Semantic roles',
        note: 'Status roles already on screen. Do not recolor them with the brand hue.',
        colors: args.semantic || [],
      },
    ],
  });

export const buildGroupsColorSkill = (
  paletteName: string,
  groups: ColorGroup[],
  globalConfig?: GlobalCurveConfig
): string =>
  buildColorSkill({
    paletteName,
    globalConfig,
    sections: groups.map((group) => ({
      title: group.name,
      note: `Colors in ${group.name}, with the same ramp as the cards.`,
      colors: group.colors,
    })),
  });
