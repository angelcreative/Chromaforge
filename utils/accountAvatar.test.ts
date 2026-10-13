import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, statSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  AVATAR_GROUPS,
  DEFAULT_AVATAR_ID,
  avatarAccountKey,
  avatarById,
  displayedAvatarId,
  readAccountAvatar,
  writeAccountAvatar,
  type AvatarStore,
} from './accountAvatar.ts';

const memoryStore = (): AvatarStore & { raw: { value: string } } => {
  const raw = { value: '' };
  return {
    raw,
    getItem: () => (raw.value ? raw.value : null),
    setItem: (_key, value) => {
      raw.value = value;
    },
  };
};

test('change avatar offers male then female, five faces each, in file order', () => {
  assert.deepEqual(AVATAR_GROUPS.map((group) => group.label), ['Male', 'Female']);
  assert.deepEqual(
    AVATAR_GROUPS[0].faces.map((item) => item.id),
    ['male/curly', 'male/sunglasses', 'male/beard', 'male/side-part', 'male/spiky'],
  );
  assert.deepEqual(
    AVATAR_GROUPS[1].faces.map((item) => item.id),
    ['female/bob', 'female/braids', 'female/glasses', 'female/long-hair', 'female/beanie'],
  );
  assert.equal(AVATAR_GROUPS[0].faces.length, 5);
  assert.equal(AVATAR_GROUPS[1].faces.length, 5);
});

test('each face is one of the copied transparent pngs', () => {
  const root = join(dirname(fileURLToPath(import.meta.url)), '..');
  for (const group of AVATAR_GROUPS) {
    for (const item of group.faces) {
      assert.equal(item.src, `/avatars/${item.id}.png`);
      const file = join(root, 'public', item.src.replace(/^\//, ''));
      assert.equal(existsSync(file), true, file);
      assert.ok(statSync(file).size > 1000, file);
      assert.equal(avatarById(item.id)?.src, item.src);
    }
  }
  assert.equal(avatarById('male/nope'), null);
  assert.equal(DEFAULT_AVATAR_ID, 'male/curly');
});

test('a chosen face is remembered for that signed-in account only', () => {
  const store = memoryStore();
  const ada = avatarAccountKey('Ada@Example.com', 'shared-demo');
  const grace = avatarAccountKey('grace@example.com', 'shared-demo');
  assert.equal(ada, 'email:ada@example.com');
  assert.equal(readAccountAvatar(ada, store), null);
  assert.equal(displayedAvatarId(null), 'male/curly');
  assert.equal(writeAccountAvatar(ada, 'female/beanie', store), true);
  assert.equal(readAccountAvatar(ada, store), 'female/beanie');
  assert.equal(readAccountAvatar(grace, store), null);
  assert.equal(displayedAvatarId(readAccountAvatar(ada, store)), 'female/beanie');
  assert.equal(writeAccountAvatar(ada, '../secret.png', store), false);
  assert.equal(readAccountAvatar(ada, store), 'female/beanie');
  assert.equal(writeAccountAvatar('', 'male/beard', store), false);
});

test('an account without an email is remembered by its id', () => {
  const store = memoryStore();
  const key = avatarAccountKey('  ', 'uid-9');
  assert.equal(key, 'uid:uid-9');
  assert.equal(writeAccountAvatar(key, 'male/spiky', store), true);
  assert.equal(readAccountAvatar(key, store), 'male/spiky');
  assert.equal(avatarAccountKey(null, null), '');
});

test('a damaged saved value is ignored', () => {
  const store = memoryStore();
  store.setItem('chromaforge_account_avatars', '{"email:a@b.c":"not-a-face","email:ok@b.c":"female/bob"}');
  assert.equal(readAccountAvatar('email:a@b.c', store), null);
  assert.equal(readAccountAvatar('email:ok@b.c', store), 'female/bob');
  store.setItem('chromaforge_account_avatars', 'nope');
  assert.equal(readAccountAvatar('email:ok@b.c', store), null);
});
