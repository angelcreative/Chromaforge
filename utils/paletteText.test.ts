import test from 'node:test';
import assert from 'node:assert/strict';
import { collectPaletteColors, colorsFromPaletteText } from './colorUtils.ts';

const hexes = (colors: { hex: string }[]) => colors.map((color) => color.hex.toUpperCase());

test('pasted JSON becomes a palette', () => {
  const colors = colorsFromPaletteText(`{
    "harbor": "#0E3A46",
    "tide": "#1F7A8C",
    "foam": "#BFDBF7"
  }`);
  assert.deepEqual(hexes(colors).sort(), ['#0E3A46', '#1F7A8C', '#BFDBF7']);
});

test('a fenced JSON palette is accepted', () => {
  const colors = colorsFromPaletteText('```json\n{ "harbor": "#0E3A46", "foam": "#BFDBF7" }\n```');
  assert.equal(colors.length, 2);
});

test('pasted CSS custom properties are accepted', () => {
  const colors = colorsFromPaletteText(`:root {
    --color-harbor: #0E3A46;
    --color-tide: #1F7A8C;
  }`);
  assert.equal(colors.length, 2);
});

test('pasted Tailwind config is accepted', () => {
  const colors = colorsFromPaletteText(`module.exports = {
    theme: {
      extend: {
        colors: {
          harbor: '#0E3A46',
          tide: '#1F7A8C',
        },
      },
    },
  };`);
  assert.equal(colors.length, 2);
});

test('a written description stays text', () => {
  assert.deepEqual(colorsFromPaletteText('A calm brand for a coastal studio'), []);
  assert.deepEqual(colorsFromPaletteText('Use #0E3A46 for the harbor'), []);
});

test('a color file can be CSS or JSON without a new parser', () => {
  const fromCss = collectPaletteColors('--ink: #14213D; --paper: #E0E1DD;');
  const fromJson = collectPaletteColors('{ "signal": "#FCA311" }');
  assert.equal(fromCss.length, 2);
  assert.equal(fromJson.length, 1);
  assert.equal(fromJson[0].hex.toUpperCase(), '#FCA311');
});
