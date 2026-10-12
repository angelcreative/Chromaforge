import { AnimatePresence, motion, useReducedMotion, type HTMLMotionProps, type Transition } from 'motion/react';
import React, { useRef, useState } from 'react';

export const MOTION_EASE = [0.2, 0, 0, 1] as const;
export const MOTION_S = 0.19;

export function useReduced() {
  const fromMotion = useReducedMotion();
  const [media] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  );
  return Boolean(fromMotion ?? media);
}

export function uiTransition(reduce: boolean, seconds = MOTION_S): Transition {
  if (reduce) return { duration: 0 };
  return { duration: seconds, ease: [...MOTION_EASE] };
}

const shown = { opacity: 1, scale: 1, x: 0, y: 0 };

export function popMotion(reduce: boolean, leaving = false) {
  if (reduce) {
    return { initial: false as const, animate: { opacity: 1, scale: 1 }, transition: uiTransition(true) };
  }
  return {
    initial: { opacity: 0, scale: 0.96 },
    animate: leaving ? { opacity: 0, scale: 0.98 } : { opacity: 1, scale: 1 },
    transition: uiTransition(false, leaving ? 0.16 : MOTION_S),
  };
}

export function presencePop(reduce: boolean, origin = 'center') {
  if (reduce) {
    return {
      initial: false as const,
      animate: { opacity: 1, scale: 1 },
      exit: { opacity: 1, scale: 1 },
      transition: uiTransition(true),
      style: { transformOrigin: origin },
    };
  }
  return {
    initial: { opacity: 0, scale: 0.96 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.98 },
    transition: uiTransition(false),
    style: { transformOrigin: origin },
  };
}

export function presenceFade(reduce: boolean) {
  if (reduce) {
    return {
      initial: false as const,
      animate: { opacity: 1 },
      exit: { opacity: 1 },
      transition: uiTransition(true),
    };
  }
  return {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
    transition: uiTransition(false, 0.16),
  };
}

export function slideMotion(reduce: boolean, leaving: boolean, from: { x?: number | string; y?: number | string }) {
  if (reduce) {
    return { initial: false as const, animate: { x: 0, y: 0 }, transition: uiTransition(true) };
  }
  const hidden = { x: 0, y: 0, ...from };
  return {
    initial: hidden,
    animate: leaving ? hidden : { x: 0, y: 0 },
    transition: uiTransition(false, leaving ? 0.16 : 0.2),
  };
}

export function presenceSlide(reduce: boolean, from: { x?: number | string; y?: number | string }) {
  if (reduce) {
    return {
      initial: false as const,
      animate: shown,
      exit: shown,
      transition: uiTransition(true),
    };
  }
  const hidden = { x: 0, y: 0, ...from };
  return {
    initial: hidden,
    animate: { x: 0, y: 0 },
    exit: hidden,
    transition: uiTransition(false, 0.2),
  };
}

export function fadeEnter(reduce: boolean) {
  if (reduce) {
    return { initial: false as const, animate: { opacity: 1 }, transition: uiTransition(true) };
  }
  return {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    transition: uiTransition(false),
  };
}

export function enterMotion(reduce: boolean, index = 0) {
  if (reduce) {
    return { initial: false as const, animate: { opacity: 1, y: 0 }, transition: uiTransition(true) };
  }
  const delay = Math.min(index, 8) * 0.02;
  const travel = uiTransition(false);
  return {
    initial: { opacity: 0, y: 4 },
    animate: { opacity: 1, y: 0 },
    transition: {
      opacity: { ...travel, delay },
      y: { ...travel, delay },
      scale: uiTransition(false, 0.16),
    },
  };
}

export function useExit(onDone: () => void) {
  const reduce = useReduced();
  const [open, setOpen] = useState(true);
  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;
  const actionRef = useRef<(() => void) | null>(null);
  const request = (action?: () => void) => {
    actionRef.current = action ?? (() => onDoneRef.current());
    if (reduce) {
      actionRef.current();
      return;
    }
    setOpen(false);
  };
  return {
    open,
    reduce,
    request,
    onExitComplete: () => (actionRef.current ?? onDoneRef.current)(),
  };
}

export function ModalFrame({
  open,
  onExitComplete,
  backdropClassName,
  panelClassName,
  children,
  labelledBy,
}: {
  open: boolean;
  onExitComplete: () => void;
  backdropClassName: string;
  panelClassName: string;
  children: React.ReactNode;
  labelledBy?: string;
}) {
  const reduce = useReduced();
  const ease = [...MOTION_EASE];
  return (
    <AnimatePresence onExitComplete={onExitComplete}>
      {open && (
        <motion.div
          key="backdrop"
          className={backdropClassName}
          initial={reduce ? false : 'hidden'}
          animate="show"
          exit="exit"
          variants={
            reduce
              ? { show: { opacity: 1 }, exit: { opacity: 1 } }
              : {
                  hidden: { opacity: 0 },
                  show: { opacity: 1, transition: { duration: 0.16, ease } },
                  exit: { opacity: 0, transition: { duration: 0.14, ease } },
                }
          }
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby={labelledBy}
            className={panelClassName}
            style={{ transformOrigin: 'center' }}
            initial={reduce ? false : 'hidden'}
            variants={
              reduce
                ? { show: { scale: 1 }, exit: { scale: 1 } }
                : {
                    hidden: { scale: 0.96 },
                    show: { scale: 1, transition: { duration: MOTION_S, ease } },
                    exit: { scale: 0.98, transition: { duration: 0.14, ease } },
                  }
            }
          >
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export const MotionButton = React.forwardRef<HTMLButtonElement, HTMLMotionProps<'button'>>(function MotionButton(
  { transition, whileTap, disabled, ...props },
  ref,
) {
  const reduce = useReduced();
  const off = Boolean(disabled) || reduce;
  return (
    <motion.button
      ref={ref}
      disabled={disabled}
      whileTap={whileTap ?? (off ? undefined : { scale: 0.97 })}
      transition={transition ?? uiTransition(reduce, 0.16)}
      {...props}
    />
  );
});

export function SelectionMark({
  active,
  layoutId,
  className = 'absolute inset-0 rounded-md bg-primary',
}: {
  active: boolean;
  layoutId: string;
  className?: string;
}) {
  const reduce = useReduced();
  if (!active) return null;
  if (reduce) return <span aria-hidden className={className} />;
  return (
    <motion.span
      aria-hidden
      layoutId={layoutId}
      className={className}
      transition={{ type: 'tween', duration: 0.18, ease: [...MOTION_EASE] }}
    />
  );
}

export function SwitchThumb({
  on,
  onX,
  offX = 0,
  className = 'pointer-events-none absolute top-0.5 left-0.5 size-3 rounded-full bg-white shadow-sm ring-1 ring-black/10',
}: {
  on: boolean;
  onX: number;
  offX?: number;
  className?: string;
}) {
  const reduce = useReduced();
  return (
    <motion.span
      aria-hidden
      className={className}
      initial={false}
      animate={{ x: on ? onX : offX }}
      transition={uiTransition(reduce, 0.16)}
    />
  );
}
