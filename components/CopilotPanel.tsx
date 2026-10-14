import { AnimatePresence, motion } from 'motion/react';
import React, { useEffect, useState } from 'react';
import { ArrowUp } from 'lucide-react';
import { CloseButton } from './FloatingDrawer';
import { ChatMessage } from '../types';
import { formatCompact } from '../services/credits';
import LogoMark from './LogoMark';
import PigmentoButton from './pigmento/PigmentoButton';
import { MotionButton, enterMotion, presencePop, useReduced } from './uiMotion';

const PIGMENTO_GREETING = "Hi, I'm Pigmento. Tell me how this palette should feel, or start with one of these.";
const PIGMENTO_STARTERS = [
  'Make it more accessible',
  'Warmer and softer',
  'Add a bold accent',
  'Darker and moodier',
  'Fewer, calmer colors',
] as const;
const PIGMENTO_STATUSES = ['Thinking', 'Working', 'Painting'] as const;
const STATUS_STEP_MS = 1400;

export interface CopilotPanelProps {
  open: boolean;
  onToggle: () => void;
  onClose: () => void;
  messages: ChatMessage[];
  input: string;
  onInput: (value: string) => void;
  onSubmit: (text?: string) => void;
  loading: boolean;
  balanceLabel: string;
  balanceTitle: string;
  balanceDetail?: string;
  onCredits?: () => void;
  attention?: number;
}

const CopilotPanel: React.FC<CopilotPanelProps> = ({
  open,
  onToggle,
  onClose,
  messages,
  input,
  onInput,
  onSubmit,
  loading,
  balanceLabel,
  balanceTitle,
  balanceDetail,
  onCredits,
  attention = 0,
}) => {
  const reduce = useReduced();
  const pop = presencePop(reduce, 'bottom right');
  const [statusIndex, setStatusIndex] = useState(0);

  useEffect(() => {
    if (!loading) {
      setStatusIndex(0);
      return;
    }
    setStatusIndex(0);
    const timer = window.setInterval(() => {
      setStatusIndex((current) => (current + 1) % PIGMENTO_STATUSES.length);
    }, STATUS_STEP_MS);
    return () => window.clearInterval(timer);
  }, [loading]);

  return (
  <>
    <AnimatePresence>
    {open && (
      <motion.form
        key="assistant"
        className="fixed bottom-[calc(64px+2.25rem)] right-4 z-50 flex max-h-[min(28rem,calc(100dvh-9rem))] w-[min(24rem,calc(100vw-2rem))] flex-col rounded-2xl bg-card p-3 text-foreground shadow-panel ring-1 ring-border"
        onSubmit={(event) => {
          event.preventDefault();
          onSubmit();
        }}
        {...pop}
      >
        <div className="mb-2 flex items-center justify-between">
          <span className="text-[13px]">Pigmento</span>
          <CloseButton onClick={onClose} />
        </div>
        <div className="mb-2 flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto">
          <div className="flex justify-start">
            <div className="max-w-[90%] rounded-2xl bg-background px-3 py-2 text-[13px] leading-relaxed text-foreground ring-1 ring-border">
              {PIGMENTO_GREETING}
            </div>
          </div>
          {messages.length === 0 && !loading && (
            <div className="flex flex-wrap gap-1.5" role="group" aria-label="Suggestions">
              {PIGMENTO_STARTERS.map((starter) => (
                <MotionButton
                  key={starter}
                  type="button"
                  onClick={() => onSubmit(starter)}
                  className="rounded-full border border-border bg-background px-3 py-1.5 text-[12px] text-foreground hover:bg-accent"
                >
                  {starter}
                </MotionButton>
              ))}
            </div>
          )}
          {messages.map((message, index) => (
            <motion.div key={index} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`} {...enterMotion(reduce, index)}>
              <div className={`max-w-[90%] rounded-2xl px-3 py-2 text-[13px] leading-relaxed ${message.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-background text-foreground ring-1 ring-border'}`}>
                {message.text}
                {message.role === 'model' && typeof message.creditsSpent === 'number' && (
                  <p className="mt-1 text-[12px] text-muted-foreground" title={`This reply used ${message.creditsSpent} credits.`}>Used {formatCompact(message.creditsSpent)} credits</p>
                )}
              </div>
            </motion.div>
          ))}
          {loading && (
            <div className="flex justify-start" role="status" aria-live="polite">
              <div className="flex items-center gap-2 rounded-2xl bg-background px-3 py-2 text-[13px] text-muted-foreground ring-1 ring-border">
                <LogoMark motion="loading" className="size-5 shrink-0 text-foreground" />
                <span>
                  {PIGMENTO_STATUSES[statusIndex]}
                  <span className="pigmento-dots" aria-hidden><span>.</span><span>.</span><span>.</span></span>
                </span>
              </div>
            </div>
          )}
        </div>
        {balanceLabel ? (
          <div className="mb-2">
            {onCredits ? (
              <button type="button" onClick={onCredits} className="text-[13px] text-muted-foreground hover:text-foreground" title={balanceTitle} aria-label={balanceTitle}>
                {balanceLabel}
              </button>
            ) : (
              <span className="text-[13px] text-muted-foreground" title={balanceTitle}>{balanceLabel}</span>
            )}
            {balanceDetail ? (
              <p className="mt-1 text-[12px] leading-relaxed text-muted-foreground">{balanceDetail}</p>
            ) : null}
          </div>
        ) : null}
        <div className="flex items-end gap-2">
          <textarea
            rows={2}
            value={input}
            onChange={(event) => onInput(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' && !event.shiftKey) {
                event.preventDefault();
                onSubmit();
              }
            }}
            placeholder="Edit this palette"
            aria-label="Edit this palette"
            className="max-h-28 min-h-[3rem] flex-1 resize-none rounded-xl border border-border bg-background px-3 py-2 text-[13px] text-foreground placeholder:text-muted-foreground focus:outline-none"
          />
          <MotionButton
            type="submit"
            disabled={loading || !input.trim()}
            className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-40"
            aria-label="Send"
          >
            <ArrowUp className="size-4" strokeWidth={1.5} />
          </MotionButton>
        </div>
      </motion.form>
    )}
    </AnimatePresence>
    <PigmentoButton open={open} onActivate={onToggle} attention={attention} busy={loading} />
  </>
  );
};

export default CopilotPanel;
