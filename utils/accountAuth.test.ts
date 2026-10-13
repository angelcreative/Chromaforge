import test from 'node:test';
import assert from 'node:assert/strict';
import { shouldCreateAccount } from './accountAuth.ts';

test('an unknown email is created', () => {
  assert.equal(shouldCreateAccount('auth/user-not-found'), true);
  assert.equal(shouldCreateAccount('auth/invalid-credential'), true);
  assert.equal(shouldCreateAccount('auth/invalid-login-credentials'), true);
});

test('a wrong password does not create another account', () => {
  assert.equal(shouldCreateAccount('auth/wrong-password'), false);
  assert.equal(shouldCreateAccount('auth/invalid-email'), false);
  assert.equal(shouldCreateAccount(undefined), false);
});
