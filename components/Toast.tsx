import React, { useEffect, useRef, useState } from 'react';
import { Check } from 'lucide-react';
import { CloseButton } from './FloatingDrawer';
import './Toast.css';

const LIFE_MS = 2500;
const LEAVE_MS = 160;

type ToastItem = {
  id: number;
  message: string;
  leaving: boolean;
};

const listeners = new Set<(message: string) => void>();
const pending: string[] = [];
let nextId = 1;

export function showToast(message: string) {
  if (listeners.size === 0) {
    pending.push(message);
    return;
  }
  listeners.forEach((listener) => listener(message));
}

export const ToastHost: React.FC = () => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  useEffect(() => {
    const listener = (message: string) => {
      const id = nextId++;
      setToasts((current) => [...current, { id, message, leaving: false }]);
    };
    listeners.add(listener);
    const queued = pending.splice(0);
    queued.forEach(listener);
    return () => {
      listeners.delete(listener);
    };
  }, []);

  const dismiss = (id: number) => {
    setToasts((current) =>
      current.map((toast) => (toast.id === id && !toast.leaving ? { ...toast, leaving: true } : toast)),
    );
  };

  const remove = (id: number) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  };

  return (
    <div className="toast-stack pointer-events-none fixed top-16 left-1/2 z-[170] flex w-max -translate-x-1/2 flex-col items-center gap-2" aria-live="polite" aria-relevant="additions">
      {toasts.map((toast) => (
        <ToastCard
          key={toast.id}
          message={toast.message}
          leaving={toast.leaving}
          onDismiss={() => dismiss(toast.id)}
          onExited={() => remove(toast.id)}
        />
      ))}
    </div>
  );
};

const ToastCard: React.FC<{
  message: string;
  leaving: boolean;
  onDismiss: () => void;
  onExited: () => void;
}> = ({ message, leaving, onDismiss, onExited }) => {
  const dismissRef = useRef(onDismiss);
  const exitRef = useRef(onExited);
  dismissRef.current = onDismiss;
  exitRef.current = onExited;

  useEffect(() => {
    if (!leaving) return;
    const timer = window.setTimeout(() => exitRef.current(), LEAVE_MS);
    return () => window.clearTimeout(timer);
  }, [leaving]);

  useEffect(() => {
    if (leaving) return;
    const timer = window.setTimeout(() => dismissRef.current(), LIFE_MS + 80);
    return () => window.clearTimeout(timer);
  }, [leaving]);

  return (
    <div className={`toast pointer-events-auto relative flex max-w-full items-center gap-3 overflow-hidden rounded-2xl border border-border bg-card py-3 pl-3.5 pr-2 text-card-foreground shadow-panel${leaving ? ' is-leaving' : ''}`} role="status">
      <span className="grid shrink-0 place-items-center rounded-full bg-accent p-1.5 text-foreground" aria-hidden="true">
        <Check className="size-4" strokeWidth={1.5} />
      </span>
      <span className="min-w-0 py-0.5 text-[13px] font-medium leading-snug">{message}</span>
      <CloseButton onClick={() => dismissRef.current()} />
      <span
        className="toast-bar"
        aria-hidden="true"
        onAnimationEnd={(event) => {
          if (event.animationName === 'toast-drain') dismissRef.current();
        }}
      />
    </div>
  );
};
