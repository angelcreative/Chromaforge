/** Firebase hides unknown emails behind these codes. A wrong password uses a different code. */
export const shouldCreateAccount = (code: string | undefined): boolean =>
  code === 'auth/user-not-found'
  || code === 'auth/invalid-credential'
  || code === 'auth/invalid-login-credentials';
