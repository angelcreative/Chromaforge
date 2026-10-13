import { AnimatePresence, motion } from 'motion/react';
import React, { useEffect, useId, useRef, useState } from 'react';
import {
  AVATAR_GROUPS,
  avatarAccountKey,
  avatarById,
  displayedAvatarId,
  readAccountAvatar,
  writeAccountAvatar,
} from '../utils/accountAvatar';
import {
  creditsMenuCopy,
  fetchDisplayedBalance,
  isUnlimitedAccount,
} from '../utils/accountMenu';
import { MotionButton, presencePop, useReduced } from './uiMotion';

export interface AccountMenuProps {
  email: string | null;
  name: string | null;
  accountId?: string | null;
  signedIn: boolean;
  ownerSession: boolean;
  balance: number | null;
  onLogout: () => void | Promise<void>;
  onBuyMore: () => void;
  onSignIn: (email: string, password: string) => void | Promise<void>;
}

const AccountMenu: React.FC<AccountMenuProps> = ({
  email,
  name,
  accountId = null,
  signedIn,
  ownerSession,
  balance,
  onLogout,
  onBuyMore,
  onSignIn,
}) => {
  const [open, setOpen] = useState(false);
  const [signingIn, setSigningIn] = useState(false);
  const [choosingAvatar, setChoosingAvatar] = useState(false);
  const [avatarMemory, setAvatarMemory] = useState<{ key: string; id: string | null }>({ key: '', id: null });
  const [emailInput, setEmailInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [signInError, setSignInError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [shownBalance, setShownBalance] = useState<number | null>(balance);
  const rootRef = useRef<HTMLDivElement>(null);
  const reduce = useReduced();
  const menu = presencePop(reduce, 'top right');
  const menuId = useId();
  const unlimited = signedIn && ownerSession && isUnlimitedAccount(email);
  const copy = creditsMenuCopy({
    email,
    ownerSession: unlimited,
    balance: unlimited ? null : shownBalance,
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

  useEffect(() => {
    setShownBalance(balance);
  }, [balance]);

  useEffect(() => {
    if (unlimited || typeof balance === 'number') return;
    let cancelled = false;
    fetchDisplayedBalance().then((value) => {
      if (!cancelled && typeof value === 'number') setShownBalance(value);
    });
    return () => {
      cancelled = true;
    };
  }, [unlimited, balance, email]);

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
    if (signedIn) {
      setSigningIn(false);
      setSignInError('');
      setPasswordInput('');
      return;
    }
    setChoosingAvatar(false);
  }, [signedIn]);

  useEffect(() => {
    if (open) return;
    setSigningIn(false);
    setSignInError('');
    setChoosingAvatar(false);
  }, [open]);

  const signOut = () => {
    setOpen(false);
    void onLogout();
  };

  const submitSignIn = async (event: React.FormEvent) => {
    event.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    setSignInError('');
    try {
      await onSignIn(emailInput, passwordInput);
      setPasswordInput('');
      setSigningIn(false);
    } catch (error: unknown) {
      const code = (error as { code?: string })?.code;
      if (code === 'auth/wrong-password' || code === 'auth/invalid-credential') {
        setSignInError('That password does not match this account.');
      } else if (code === 'auth/invalid-email') {
        setSignInError('Enter a valid email.');
      } else if (code === 'auth/weak-password') {
        setSignInError('Use at least 6 characters.');
      } else {
        setSignInError('Could not sign in.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const buyMore = () => {
    setOpen(false);
    onBuyMore();
  };

  const chooseAvatar = (id: string) => {
    if (!accountKey || !writeAccountAvatar(accountKey, id)) return;
    setAvatarMemory({ key: accountKey, id });
  };

  return (
    <div ref={rootRef} className="pointer-events-none absolute top-0 right-0 z-50 bg-transparent">
      <div className="pointer-events-auto relative mr-3 mt-2">
        <MotionButton
          type="button"
          className={
            face
              ? 'account-avatar-disk grid size-10 place-items-center overflow-hidden rounded-full focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ring)]'
              : 'grid size-10 place-items-center rounded-full bg-transparent text-foreground ring-1 ring-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ring)]'
          }
          aria-label={signedIn ? (name || email || 'Account') : 'Account'}
          aria-haspopup="menu"
          aria-expanded={open}
          aria-controls={open ? menuId : undefined}
          onClick={() => setOpen((value) => !value)}
        >
          {face && (
            <img src={face.src} alt="" draggable={false} className="h-[82%] w-[82%] object-contain" />
          )}
        </MotionButton>
        <AnimatePresence>
          {open && (
            <motion.div
              id={menuId}
              role="menu"
              aria-label="Account"
              className="absolute right-0 top-full z-50 mt-1 w-max min-w-44 rounded-xl bg-card p-1 shadow-panel ring-1 ring-border"
              {...menu}
            >
              {signedIn ? (
                <>
                  <div className="flex items-center gap-3 px-2.5 py-2">
                    <p className="text-[13px] text-foreground" title={copy.title} aria-label={copy.title}>
                      {copy.text}
                    </p>
                    <button
                      type="button"
                      className="text-[13px] text-foreground hover:underline"
                      onClick={buyMore}
                    >
                      Buy more
                    </button>
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
                    className="flex h-9 w-full items-center rounded-lg px-2.5 text-left text-[13px] text-foreground hover:bg-accent"
                    onClick={signOut}
                  >
                    Log out
                  </button>
                </>
              ) : signingIn ? (
                <form className="w-56 p-1.5" onSubmit={(event) => { void submitSignIn(event); }}>
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
                  <label className="mt-2 block text-[13px] text-muted-foreground">
                    Password
                    <input
                      type="password"
                      autoComplete="current-password"
                      required
                      value={passwordInput}
                      onChange={(event) => setPasswordInput(event.target.value)}
                      className="mt-1 h-9 w-full rounded-lg border border-border bg-background px-2 text-[13px] text-foreground focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
                    />
                  </label>
                  {signInError && (
                    <p className="mt-2 px-0.5 text-[13px] text-destructive" role="alert">{signInError}</p>
                  )}
                  <button
                    type="submit"
                    disabled={submitting}
                    className="mt-2 flex h-9 w-full items-center justify-center rounded-lg bg-foreground text-[13px] text-background disabled:opacity-40"
                  >
                    {submitting ? 'Signing in' : 'Sign in'}
                  </button>
                </form>
              ) : (
                <button
                  type="button"
                  role="menuitem"
                  className="flex h-9 w-full items-center rounded-lg px-2.5 text-left text-[13px] text-foreground hover:bg-accent"
                  onClick={() => setSigningIn(true)}
                >
                  Sign in
                </button>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default AccountMenu;
