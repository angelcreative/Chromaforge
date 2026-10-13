import test from 'node:test';
import assert from 'node:assert/strict';
import { commitPaletteName, renameSavedPaletteList } from './paletteName.ts';

test('a blank rename keeps the current name', () => {
  assert.equal(commitPaletteName('Harbor', '   '), null);
  assert.equal(commitPaletteName('Harbor', 'Harbor'), null);
});

test('a new name is trimmed once', () => {
  assert.equal(commitPaletteName('Harbor', '  Dinosaur Paradise  '), 'Dinosaur Paradise');
});

test('renaming a saved palette updates only that card', () => {
  const palettes = [
    { id: 'a', name: 'Orchard' },
    { id: 'b', name: 'Ink' },
  ];
  const next = renameSavedPaletteList(palettes, 'a', 'Sushi Platter');
  assert.deepEqual(next.map((palette) => palette.name), ['Sushi Platter', 'Ink']);
  assert.equal(palettes[0].name, 'Orchard');
});

test('an unknown palette id leaves the library unchanged', () => {
  const palettes = [{ id: 'a', name: 'Harbor' }];
  assert.equal(renameSavedPaletteList(palettes, 'missing', 'Wallapop Marketplace'), palettes);
});
