import { AnimatePresence, motion } from 'motion/react';
import React, { useEffect, useId, useRef, useState } from 'react';
import {
  accountInitial,
  creditsMenuCopy,
  fetchDisplayedBalance,
  isUnlimitedAccount,
} from '../utils/accountMenu';
import { MotionButton, presencePop, useReduced } from './uiMotion';

export interface AccountMenuProps {
  email: string | null;
  name: string | null;
  signedIn: boolean;
  ownerSession: boolean;
  balance: number | null;
  onLogout: () => void | Promise<void>;
  onBuyMore: () => void;
}

const AccountMenu: React.FC<AccountMenuProps> = ({
  email,
  name,
  signedIn,
  ownerSession,
  balance,
  onLogout,
  onBuyMore,
}) => {
  const [open, setOpen] = useState(false);
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
  const initial = signedIn ? accountInitial(name, email) : '';

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

  const signOut = () => {
    setOpen(false);
    void onLogout();
  };

  const buyMore = () => {
    setOpen(false);
    onBuyMore();
  };

  return (
    <div ref={rootRef} className="pointer-events-none absolute top-0 right-0 z-50 bg-transparent">
      <div className="pointer-events-auto relative mr-3 mt-2">
        <MotionButton
          type="button"
          className={
            initial
              ? 'grid size-10 place-items-center rounded-full text-[15px] font-medium leading-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ring)]'
              : 'grid size-10 place-items-center rounded-full bg-transparent text-foreground ring-1 ring-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ring)]'
          }
          style={initial ? { backgroundColor: 'var(--foreground)', color: 'var(--background)' } : undefined}
          aria-label={signedIn ? (name || email || 'Account') : 'Signed out'}
          aria-haspopup="menu"
          aria-expanded={open}
          aria-controls={open ? menuId : undefined}
          onClick={() => setOpen((value) => !value)}
        >
          {initial}
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
              {!signedIn && (
                <p className="px-2.5 py-2 text-[13px] text-foreground">Signed out</p>
              )}
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
              {signedIn && (
                <button
                  type="button"
                  role="menuitem"
                  className="flex h-9 w-full items-center rounded-lg px-2.5 text-left text-[13px] text-foreground hover:bg-accent"
                  onClick={signOut}
                >
                  Log out
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
