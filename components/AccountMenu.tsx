import { AnimatePresence, motion } from 'motion/react';
import React, { useEffect, useId, useRef, useState } from 'react';
import type { CreditAllowance } from '../services/creditClient';
import {
  AVATAR_GROUPS,
  avatarAccountKey,
  avatarById,
  displayedAvatarId,
  readAccountAvatar,
  writeAccountAvatar,
} from '../utils/accountAvatar';
import {
  creditStatusCopy,
  fetchDisplayedBalance,
  showsUnlimited,
} from '../utils/accountMenu';
import { resetPassword } from '../services/authService';
import { MotionButton, presencePop, useReduced } from './uiMotion';
import { Hint } from './Hint';

export interface AccountMenuProps {
  email: string | null;
  name: string | null;
  accountId?: string | null;
  signedIn: boolean;
  ownerSession: boolean;
  balance: number | null;
  allowance: CreditAllowance;
  onLogout: () => void | Promise<void>;
  onBuyMore: () => void;
  onSignIn: (email: string, password: string) => void | Promise<void>;
  onSignUp: (email: string, password: string) => void | Promise<void>;
  onGoogle: () => void | Promise<void>;
  openSignal?: number;
  openMode?: 'signin' | 'signup';
}

type AuthMode = 'signin' | 'signup' | 'forgot';

const authError = (error: unknown, mode: AuthMode): string => {
  const code = (error as { code?: string })?.code;
  if (code === 'auth/email-already-in-use') return 'That email already has an account. Sign in.';
  if (code === 'auth/user-not-found') return 'No account for that email yet. Create one.';
  if (code === 'auth/wrong-password' || code === 'auth/invalid-credential' || code === 'auth/invalid-login-credentials') {
    return 'That email or password does not match. Create an account if you are new here.';
  }
  if (code === 'auth/invalid-email') return 'Enter a valid email.';
  if (code === 'auth/weak-password') return 'Use at least 6 characters.';
  if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') return 'Google sign-in was cancelled. Try again.';
  if (code === 'auth/popup-blocked') return 'Allow popups to continue with Google, then try again.';
  if (code === 'auth/unauthorized-domain') return 'Google sign-in is not enabled for this domain yet. Use email instead.';
  if (code === 'auth/operation-not-allowed') return 'Google sign-in is disabled in Firebase. Enable the Google provider, then try again.';
  if (code === 'auth/account-exists-with-different-credential') return 'That email already uses another sign-in method. Sign in with email instead.';
  if (code === 'auth/network-request-failed') return 'Network error. Check your connection and try again.';
  if (mode === 'forgot') return 'Could not send the reset link. Check the email and try again.';
  return mode === 'signup' ? 'Could not create the account.' : 'Could not sign in.';
};

const AccountMenu: React.FC<AccountMenuProps> = ({
  email,
  name,
  accountId = null,
  signedIn,
  ownerSession,
  balance,
  allowance,
  onLogout,
  onBuyMore,
  onSignIn,
  onSignUp,
  onGoogle,
  openSignal = 0,
  openMode = 'signin',
}) => {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<AuthMode>('signin');
  const [choosingAvatar, setChoosingAvatar] = useState(false);
  const [avatarMemory, setAvatarMemory] = useState<{ key: string; id: string | null }>({ key: '', id: null });
  const [emailInput, setEmailInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [authErrorText, setAuthErrorText] = useState('');
  const [authNotice, setAuthNotice] = useState('');
  const [resetting, setResetting] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [shownBalance, setShownBalance] = useState<number | null>(balance);
  const [shownAllowance, setShownAllowance] = useState<CreditAllowance>(allowance);
  const rootRef = useRef<HTMLDivElement>(null);
  const seenSignal = useRef(0);
  const reduce = useReduced();
  const menu = presencePop(reduce, 'top right');
  const menuId = useId();
  const unlimited = showsUnlimited({ signedIn, email, ownerSession });
  const copy = creditStatusCopy({
    balance: unlimited ? null : shownBalance,
    allowance: shownAllowance,
    signedIn,
    unlimited,
  });
  const accountKey = signedIn ? avatarAccountKey(email, accountId) : '';
  if (avatarMemory.key !== accountKey) {
    setAvatarMemory({
      key: accountKey,
      id: accountKey ? readAccountAvatar(accountKey) : null,
    });
  }
  const avatarId = avatarMemory.key === accountKey ? avatarMemory.id : null;
  const face = signedIn ? avatarById(displayedAvatarId(avatarId)) : null;
  const showMeter = !unlimited && typeof shownBalance === 'number';

  useEffect(() => {
    setShownBalance(balance);
  }, [balance]);

  useEffect(() => {
    setShownAllowance(allowance);
  }, [allowance]);

  useEffect(() => {
    if (unlimited || typeof balance === 'number') return;
    let cancelled = false;
    fetchDisplayedBalance().then((value) => {
      if (cancelled) return;
      if (typeof value.balance === 'number') setShownBalance(value.balance);
      if (value.allowance !== 'unknown') setShownAllowance(value.allowance);
    });
    return () => {
      cancelled = true;
    };
  }, [unlimited, balance, email]);

  useEffect(() => {
    if (!openSignal || openSignal === seenSignal.current) return;
    seenSignal.current = openSignal;
    setOpen(true);
    if (!signedIn) setMode(openMode);
  }, [openSignal, openMode, signedIn]);

  useEffect(() => {
    if (!open) return;
    const onPointer = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onPointer);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onPointer);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  useEffect(() => {
    if (!signedIn) {
      setChoosingAvatar(false);
      return;
    }
    setOpen(false);
    setAuthErrorText('');
    setAuthNotice('');
    setPasswordInput('');
    setShowPassword(false);
  }, [signedIn]);

  useEffect(() => {
    if (open) return;
    setAuthErrorText('');
    setAuthNotice('');
    setChoosingAvatar(false);
  }, [open]);

  const signOut = () => {
    setOpen(false);
    void onLogout();
  };

  const submitAuth = async (event: React.FormEvent) => {
    event.preventDefault();
    if (mode === 'forgot') {
      await sendResetLink();
      return;
    }
    if (submitting) return;
    setSubmitting(true);
    setAuthErrorText('');
    try {
      if (mode === 'signup') await onSignUp(emailInput.trim(), passwordInput);
      else await onSignIn(emailInput.trim(), passwordInput);
      setPasswordInput('');
    } catch (error: unknown) {
      setAuthErrorText(authError(error, mode));
    } finally {
      setSubmitting(false);
    }
  };

  const continueWithGoogle = async () => {
    if (submitting) return;
    setSubmitting(true);
    setAuthErrorText('');
    try {
      await onGoogle();
    } catch (error: unknown) {
      setAuthErrorText(authError(error, mode));
    } finally {
      setSubmitting(false);
    }
  };

  const buyMore = () => {
    setOpen(false);
    onBuyMore();
  };

  const switchMode = (next: AuthMode) => {
    setMode(next);
    setAuthErrorText('');
    setAuthNotice('');
  };

  const sendResetLink = async () => {
    const address = emailInput.trim();
    if (resetting || submitting) return;
    if (!address) {
      setAuthErrorText('Enter your email to receive the reset link.');
      return;
    }
    setResetting(true);
    setAuthErrorText('');
    setAuthNotice('');
    try {
      await resetPassword(address);
      setAuthNotice('Reset link sent. Check your email, including spam.');
    } catch (error: unknown) {
      setAuthErrorText(authError(error, 'forgot'));
    } finally {
      setResetting(false);
    }
  };

  const chooseAvatar = (id: string) => {
    if (!accountKey || !writeAccountAvatar(accountKey, id)) return;
    setAvatarMemory({ key: accountKey, id });
  };

  return (
    <div ref={rootRef} className="pointer-events-none absolute top-0 right-0 z-50 bg-transparent">
      <div className="pointer-events-auto relative mr-3 mt-2">
        {signedIn ? (
          <Hint label="Account" side="left" disabled={open}>
            <MotionButton
              type="button"
              className="account-avatar-disk grid size-10 place-items-center overflow-hidden rounded-full focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ring)]"
              aria-label={email || name || 'Account'}
              aria-haspopup="menu"
              aria-expanded={open}
              aria-controls={open ? menuId : undefined}
              onClick={() => setOpen((value) => !value)}
            >
              {face && (
                <img src={face.src} alt="" draggable={false} className="h-[82%] w-[82%] object-contain" />
              )}
            </MotionButton>
          </Hint>
        ) : (
          <MotionButton
            type="button"
            className="flex h-9 items-center gap-2 rounded-full bg-card px-3 text-[13px] text-foreground ring-1 ring-border focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ring)]"
            aria-label={showMeter ? `${copy.meter}. Sign in` : 'Sign in'}
            aria-haspopup="menu"
            aria-expanded={open}
            aria-controls={open ? menuId : undefined}
            onClick={() => setOpen((value) => !value)}
          >
            {showMeter && <span className="text-muted-foreground">{copy.meter}</span>}
            <span>Sign in</span>
          </MotionButton>
        )}
        <AnimatePresence>
          {open && (
            <motion.div
              id={menuId}
              role="menu"
              aria-label="Account"
              className="absolute right-0 top-full z-50 mt-1 w-[min(20rem,calc(100vw-1.5rem))] rounded-xl bg-card p-1 shadow-panel ring-1 ring-border"
              {...menu}
            >
              {signedIn ? (
                <>
                  <div className="px-2.5 py-2">
                    {email && <p className="truncate text-[13px] text-foreground" title={email}>{email}</p>}
                    <p className="mt-1 text-[13px] text-foreground" title={copy.detail}>{copy.meter}</p>
                    <p className="mt-1 text-[13px] leading-relaxed text-muted-foreground">{copy.detail}</p>
                    {!unlimited && (
                      <button
                        type="button"
                        className="mt-2 text-[13px] text-foreground hover:underline"
                        onClick={buyMore}
                      >
                        Buy more
                      </button>
                    )}
                  </div>
                  <button
                    type="button"
                    role="menuitem"
                    aria-expanded={choosingAvatar}
                    className="flex h-9 w-full items-center rounded-lg px-2.5 text-left text-[13px] text-foreground hover:bg-accent"
                    onClick={() => setChoosingAvatar((value) => !value)}
                  >
                    Change avatar
                  </button>
                  {choosingAvatar && (
                    <div className="px-1.5 pb-1">
                      {AVATAR_GROUPS.map((group) => (
                        <div key={group.id} className="py-1" role="group" aria-label={group.label}>
                          <p className="px-1 pb-1.5 text-[12px] text-muted-foreground">{group.label}</p>
                          <div className="grid grid-cols-5 gap-1.5">
                            {group.faces.map((item) => {
                              const selected = item.id === face?.id;
                              return (
                                <button
                                  key={item.id}
                                  type="button"
                                  role="menuitemradio"
                                  aria-checked={selected}
                                  aria-label={item.label}
                                  className="account-avatar-disk grid size-10 place-items-center overflow-hidden rounded-full focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ring)]"
                                  onClick={() => chooseAvatar(item.id)}
                                >
                                  <img src={item.src} alt="" draggable={false} className="h-[78%] w-[78%] object-contain" />
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  <button
                    type="button"
                    role="menuitem"
                    className="flex h-9 w-full items-center rounded-lg px-2.5 text-left text-[13px] text-destructive hover:bg-accent"
                    onClick={signOut}
                  >
                    Log out
                  </button>
                </>
              ) : mode === 'forgot' ? (
                <div className="p-2.5">
                  <p className="text-[13px] font-medium text-foreground">Reset your password</p>
                  <p className="mt-1 text-[13px] leading-relaxed text-muted-foreground">
                    Enter the email of your account. We will send you a link to choose a new password.
                  </p>
                  <form onSubmit={(event) => { void submitAuth(event); }}>
                    <label className="mt-3 block text-[13px] text-muted-foreground">
                      Email
                      <input
                        type="email"
                        autoComplete="email"
                        required
                        value={emailInput}
                        onChange={(event) => setEmailInput(event.target.value)}
                        className="mt-1 h-9 w-full rounded-lg border border-border bg-background px-2 text-[13px] text-foreground focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
                      />
                    </label>
                    {authErrorText && (
                      <p className="mt-2 text-[13px] text-destructive" role="alert">{authErrorText}</p>
                    )}
                    {authNotice && (
                      <p className="mt-2 text-[13px] text-foreground" role="status">{authNotice}</p>
                    )}
                    <button
                      type="submit"
                      disabled={resetting}
                      className="mt-2 flex h-9 w-full items-center justify-center rounded-lg bg-foreground text-[13px] text-background disabled:opacity-40"
                    >
                      {resetting ? 'Sending…' : 'Send reset link'}
                    </button>
                  </form>
                  <button
                    type="button"
                    className="mt-2 text-[13px] text-foreground hover:underline"
                    onClick={() => switchMode('signin')}
                  >
                    Back to sign in
                  </button>
                </div>
              ) : (
                <div className="p-2.5">
                  <p className="text-[13px] leading-relaxed text-muted-foreground">{copy.detail}</p>
                  <button
                    type="button"
                    disabled={submitting}
                    className="mt-3 flex h-9 w-full items-center justify-center rounded-lg bg-foreground text-[13px] text-background disabled:opacity-40"
                    onClick={() => { void continueWithGoogle(); }}
                  >
                    {submitting ? 'Please wait' : 'Continue with Google'}
                  </button>
                  <p className="my-3 text-center text-[12px] text-muted-foreground">or use email</p>
                  <form onSubmit={(event) => { void submitAuth(event); }}>
                    <label className="block text-[13px] text-muted-foreground">
                      Email
                      <input
                        type="email"
                        autoComplete="email"
                        required
                        value={emailInput}
                        onChange={(event) => setEmailInput(event.target.value)}
                        className="mt-1 h-9 w-full rounded-lg border border-border bg-background px-2 text-[13px] text-foreground focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
                      />
                    </label>
                    <div className="mt-2">
                      <div className="flex items-center justify-between text-[13px] text-muted-foreground">
                        <label htmlFor={`${menuId}-password`}>Password</label>
                        {mode === 'signin' && (
                          <button
                            type="button"
                            className="text-foreground hover:underline"
                            onClick={() => switchMode('forgot')}
                          >
                            Forgot password?
                          </button>
                        )}
                      </div>
                      <div className="relative mt-1">
                        <input
                          id={`${menuId}-password`}
                          type={showPassword ? 'text' : 'password'}
                          autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                          minLength={6}
                          required
                          value={passwordInput}
                          onChange={(event) => setPasswordInput(event.target.value)}
                          className="h-9 w-full rounded-lg border border-border bg-background px-2 pr-16 text-[13px] text-foreground focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
                        />
                        <button
                          type="button"
                          aria-pressed={showPassword}
                          aria-label={showPassword ? 'Hide password' : 'Show password'}
                          className="absolute right-1 top-1/2 -translate-y-1/2 rounded-md px-2 py-1 text-[12px] text-muted-foreground hover:text-foreground"
                          onClick={() => setShowPassword((value) => !value)}
                        >
                          {showPassword ? 'Hide' : 'Show'}
                        </button>
                      </div>
                    </div>
                    {authErrorText && (
                      <p className="mt-2 text-[13px] text-destructive" role="alert">{authErrorText}</p>
                    )}
                    {authNotice && (
                      <p className="mt-2 text-[13px] text-foreground" role="status">{authNotice}</p>
                    )}
                    <button
                      type="submit"
                      disabled={submitting}
                      className="mt-2 flex h-9 w-full items-center justify-center rounded-lg bg-foreground text-[13px] text-background disabled:opacity-40"
                    >
                      {submitting ? 'Please wait' : mode === 'signup' ? 'Create account' : 'Sign in'}
                    </button>
                  </form>
                  {mode === 'signin' ? (
                    <button
                      type="button"
                      className="mt-2 text-[13px] text-foreground hover:underline"
                      onClick={() => switchMode('signup')}
                    >
                      New here? Create account
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="mt-2 text-[13px] text-foreground hover:underline"
                      onClick={() => switchMode('signin')}
                    >
                      Already have an account? Sign in
                    </button>
                  )}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default AccountMenu;
