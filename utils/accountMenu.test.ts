import test from 'node:test';
import assert from 'node:assert/strict';
import { accountInitial, creditsMenuCopy, identityFromAccount, UNLIMITED_ACCOUNT_EMAIL } from './accountMenu.ts';

test('the owner account on the free URL reads unlimited', () => {
  const copy = creditsMenuCopy({
    email: UNLIMITED_ACCOUNT_EMAIL,
    ownerSession: true,
    balance: 30,
  });
  assert.equal(copy.unlimited, true);
  assert.equal(copy.text, 'Unlimited');
  assert.equal(copy.title, 'Unlimited credits');
});

test('the owner email without the free URL shows remaining credits', () => {
  const copy = creditsMenuCopy({
    email: 'AJSC50@gmail.com',
    ownerSession: false,
    balance: 30,
  });
  assert.equal(copy.unlimited, false);
  assert.equal(copy.text, '30 credits');
  assert.equal(copy.title, '30 credits');
});

test('any other account shows its real remaining credits', () => {
  const copy = creditsMenuCopy({
    email: 'studio@example.com',
    ownerSession: true,
    balance: 1500,
  });
  assert.equal(copy.unlimited, false);
  assert.equal(copy.text, '1.5K credits');
  assert.equal(copy.title, '1500 credits');
});

test('a missing balance stays unlabeled until it arrives', () => {
  const copy = creditsMenuCopy({
    email: 'studio@example.com',
    ownerSession: false,
    balance: null,
  });
  assert.equal(copy.text, 'Credits');
  assert.equal(copy.title, 'Credits');
});

test('the avatar uses the first letter of the name, then the email', () => {
  assert.equal(accountInitial('Ada Lovelace', 'studio@example.com'), 'A');
  assert.equal(accountInitial(null, UNLIMITED_ACCOUNT_EMAIL), 'A');
  assert.equal(accountInitial('  ', ''), '');
  assert.equal(accountInitial('🎨', 'studio@example.com'), 'S');
  assert.equal(accountInitial('Ángel', 'studio@example.com'), 'A');
  assert.equal(accountInitial('王', 'studio@example.com'), '王');
});

test('provider profile supplies the initial when the account email is empty', () => {
  const identity = identityFromAccount({
    displayName: null,
    email: null,
    providerData: [{ displayName: null, email: UNLIMITED_ACCOUNT_EMAIL }],
  });
  assert.equal(identity.email, UNLIMITED_ACCOUNT_EMAIL);
  assert.equal(accountInitial(identity.name, identity.email), 'A');
});
