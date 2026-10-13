import test from 'node:test';
import assert from 'node:assert/strict';
import { CREDIT_PACKS, generatedPaletteCredits, palettesCovered } from './credits.ts';

test('a generated palette has a reserved credit cost', () => {
  assert.equal(generatedPaletteCredits(), 8);
});

test('each pack says how many palettes it covers', () => {
  assert.equal(palettesCovered(CREDIT_PACKS[0].credits), 75);
  assert.equal(palettesCovered(CREDIT_PACKS[1].credits), 300);
});
