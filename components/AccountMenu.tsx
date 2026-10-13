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
  ownerSession: boolean;
  balance: number | null;
  onLogout: () => void | Promise<void>;
}

const AccountMenu: React.FC<AccountMenuProps> = ({
  email,
  name,
  ownerSession,
  balance,
  onLogout,
}) => {
  const [open, setOpen] = useState(false);
  const [shownBalance, setShownBalance] = useState<number | null>(balance);
  const rootRef = useRef<HTMLDivElement>(null);
  const reduce = useReduced();
  const menu = presencePop(reduce, 'top right');
  const menuId = useId();
  const unlimited = ownerSession && isUnlimitedAccount(email);
  const copy = creditsMenuCopy({
    email,
    ownerSession,
    balance: unlimited ? null : shownBalance,
  });
  const initial = accountInitial(name, email);

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

  return (
    <div ref={rootRef} className="pointer-events-none absolute top-0 right-0 z-50 bg-transparent">
      <div className="pointer-events-auto relative mr-3 mt-2">
        <MotionButton
          type="button"
          className="grid size-10 place-items-center rounded-full bg-foreground text-[15px] font-medium leading-none text-background focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ring)]"
          aria-label={name || email || 'Account'}
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
              className="absolute right-0 top-full z-50 mt-1 w-44 rounded-xl bg-card p-1 shadow-panel ring-1 ring-border"
              {...menu}
            >
              <p className="px-2.5 py-2 text-[13px] text-foreground" title={copy.title} aria-label={copy.title}>
                {copy.text}
              </p>
              <button
                type="button"
                role="menuitem"
                className="flex h-9 w-full items-center rounded-lg px-2.5 text-left text-[13px] text-foreground hover:bg-accent"
                onClick={signOut}
              >
                Log out
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default AccountMenu;
