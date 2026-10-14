import { motion, type HTMLMotionProps } from 'motion/react';
import React from 'react';
import { X } from 'lucide-react';

// Drawers end above the Pigmento launcher (bottom-4 + 64px) with a 12px gap,
// so the launcher and its chat never cover them.
export const FLOATING_DRAWER_CLASS =
  'absolute top-14 right-3 bottom-[calc(1rem+64px+0.75rem)] z-40 flex w-[min(380px,calc(100vw-1.5rem))] flex-col overflow-hidden rounded-2xl bg-card text-foreground shadow-panel ring-1 ring-border';

export function CloseButton({
  onClick,
  className = '',
}: {
  onClick: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`grid size-8 shrink-0 place-items-center rounded-lg text-foreground hover:bg-accent ${className}`.trim()}
      aria-label="Close"
    >
      <X className="size-4" strokeWidth={1.5} aria-hidden />
    </button>
  );
}

export function DrawerHeader({
  title,
  titleId,
  onClose,
  children,
}: {
  title: string;
  titleId: string;
  onClose: () => void;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex shrink-0 items-center gap-2 border-b border-border px-4 py-3">
      <h2 id={titleId} className="shrink-0 text-[15px] font-medium text-foreground">{title}</h2>
      {children}
      <CloseButton onClick={onClose} className="ml-auto" />
    </div>
  );
}

type FloatingDrawerProps = {
  title: string;
  titleId: string;
  onClose: () => void;
  header?: React.ReactNode;
  footer?: React.ReactNode;
  children: React.ReactNode;
} & Omit<HTMLMotionProps<'aside'>, 'title' | 'children'>;

export function FloatingDrawer({
  title,
  titleId,
  onClose,
  header,
  footer,
  children,
  className,
  ...motionProps
}: FloatingDrawerProps) {
  return (
    <motion.aside
      role="dialog"
      aria-labelledby={titleId}
      className={className ? `${FLOATING_DRAWER_CLASS} ${className}` : FLOATING_DRAWER_CLASS}
      {...motionProps}
    >
      <DrawerHeader title={title} titleId={titleId} onClose={onClose}>
        {header}
      </DrawerHeader>
      {children}
      {footer}
    </motion.aside>
  );
}
