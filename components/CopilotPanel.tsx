import { AnimatePresence, motion } from 'motion/react';
import React, { useEffect, useRef, useState } from 'react';
import { ArrowUp, ImagePlus, X } from 'lucide-react';
import type { CardReference, ReferenceMode } from '../utils/referenceImage';
import { CloseButton } from './FloatingDrawer';
import { ChatMessage } from '../types';
import { CARD_CREDITS_ESTIMATE, formatCompact } from '../services/credits';
import { MAX_GENERATED_CARDS } from '../services/pigmentoCardsService';
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
const CARD_GREETING = `Describe a card and I'll build it with your palette, status colors and real photos. Each card uses about ${CARD_CREDITS_ESTIMATE} credits from your balance, and you can keep up to ${MAX_GENERATED_CARDS}.`;
const CARD_STARTERS = [
  'Food delivery order with dish photos',
  'Boarding pass with a gate change',
  'Invoice summary with paid and overdue states',
  'Smart thermostat control',
  'Hotel booking with room photo',
] as const;
const PIGMENTO_STATUSES = ['Thinking', 'Working', 'Painting'] as const;
const CARD_STATUSES = ['Sketching', 'Building', 'Theming'] as const;
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
  /** 'card' builds Playground cards instead of editing the palette. */
  mode?: 'palette' | 'card';
  /** When set, the header shows a switch between both modes. */
  onModeChange?: (mode: 'palette' | 'card') => void;
  /** Card mode: an attached reference image, and how to use it. */
  attachment?: CardReference | null;
  onAttach?: (file: File) => void;
  onAttachmentMode?: (mode: ReferenceMode) => void;
  onClearAttachment?: () => void;
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
  mode = 'palette',
  onModeChange,
  attachment,
  onAttach,
  onAttachmentMode,
  onClearAttachment,
}) => {
  const fileRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const canSend = !loading && (!!input.trim() || !!attachment);
  const takeImage = (files: FileList | File[] | null | undefined) => {
    const file = Array.from(files ?? []).find(f => f.type.startsWith('image/'));
    if (file && onAttach) { onAttach(file); return true; }
    return false;
  };
  const card = mode === 'card';
  const greeting = card ? CARD_GREETING : PIGMENTO_GREETING;
  const starters = card ? CARD_STARTERS : PIGMENTO_STARTERS;
  const statuses = card ? CARD_STATUSES : PIGMENTO_STATUSES;
  const placeholder = card ? (attachment ? 'Add details (optional)' : 'Describe a card') : 'Edit this palette';
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
      setStatusIndex((current) => (current + 1) % statuses.length);
    }, STATUS_STEP_MS);
    return () => window.clearInterval(timer);
  }, [loading, statuses.length]);

  return (
  <>
    <AnimatePresence>
    {open && (
      <motion.form
        key="assistant"
        className="fixed bottom-[calc(64px+2.25rem)] right-4 z-50 flex max-h-[min(28rem,calc(100dvh-9rem))] w-[min(24rem,calc(100vw-2rem))] flex-col rounded-2xl bg-card p-3 text-foreground shadow-panel ring-1 ring-border"
        onSubmit={(event) => {
          event.preventDefault();
          if (canSend) onSubmit();
        }}
        onDragOver={onAttach ? (event) => { if (event.dataTransfer.types.includes('Files')) { event.preventDefault(); setDragging(true); } } : undefined}
        onDragLeave={onAttach ? (event) => { if (!event.currentTarget.contains(event.relatedTarget as Node)) setDragging(false); } : undefined}
        onDrop={onAttach ? (event) => { event.preventDefault(); setDragging(false); takeImage(event.dataTransfer.files); } : undefined}
        {...pop}
      >
        {dragging && (
          <div className="pointer-events-none absolute inset-1.5 z-10 grid place-items-center rounded-xl border-2 border-dashed border-foreground/40 bg-card/90 text-[13px]">
            Drop a reference image
          </div>
        )}
        <div className="mb-2 flex items-center justify-between">
          <span className="text-[13px]">Pigmento</span>
          <div className="flex items-center gap-2">
            {onModeChange && (
              <div className="inline-flex rounded-lg bg-accent p-0.5" role="group" aria-label="What Pigmento does">
                {(['palette', 'card'] as const).map((m) => (
                  <button key={m} type="button" aria-pressed={mode === m} onClick={() => onModeChange(m)}
                    className={`rounded-md px-2 py-0.5 text-[12px] ${mode === m ? 'bg-card text-foreground shadow-panel' : 'text-muted-foreground hover:text-foreground'}`}>
                    {m === 'palette' ? 'Edit palette' : 'Create card'}
                  </button>
                ))}
              </div>
            )}
            <CloseButton onClick={onClose} />
          </div>
        </div>
        <div className="mb-2 flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto">
          <div className="flex justify-start">
            <div className="max-w-[90%] rounded-2xl bg-background px-3 py-2 text-[13px] leading-relaxed text-foreground ring-1 ring-border">
              {greeting}
            </div>
          </div>
          {messages.length === 0 && !loading && (
            <div className="flex flex-wrap gap-1.5" role="group" aria-label="Suggestions">
              {card && onAttach && (
                <MotionButton type="button" onClick={() => fileRef.current?.click()}
                  className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-3 py-1.5 text-[12px] text-foreground hover:bg-accent">
                  <ImagePlus className="size-3.5" strokeWidth={1.5} aria-hidden /> From a reference image
                </MotionButton>
              )}
              {starters.map((starter) => (
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
                {message.imageUrl && <img src={message.imageUrl} alt="Reference" className="mb-1.5 max-h-40 w-auto rounded-lg" />}
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
                  {statuses[statusIndex % statuses.length]}
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
        {attachment && (
          <div className="mb-2 flex items-center gap-2.5 rounded-xl bg-background p-1.5 ring-1 ring-border">
            <div className="relative shrink-0">
              <img src={attachment.previewUrl} alt="Reference image" className="size-12 rounded-lg object-cover" />
              <button type="button" onClick={onClearAttachment} aria-label="Remove reference image"
                className="absolute -right-1.5 -top-1.5 grid size-5 place-items-center rounded-full bg-foreground text-background">
                <X className="size-3" strokeWidth={2} />
              </button>
            </div>
            <div className="min-w-0 flex-1">
              <div className="inline-flex rounded-lg bg-accent p-0.5" role="group" aria-label="How to use the reference">
                {(['recreate', 'inspire'] as const).map((m) => (
                  <button key={m} type="button" aria-pressed={attachment.mode === m} onClick={() => onAttachmentMode?.(m)}
                    className={`rounded-md px-2 py-0.5 text-[12px] ${attachment.mode === m ? 'bg-card text-foreground shadow-panel' : 'text-muted-foreground hover:text-foreground'}`}>
                    {m === 'recreate' ? 'Recreate' : 'Inspire'}
                  </button>
                ))}
              </div>
              <p className="mt-1 text-[11px] leading-snug text-muted-foreground">
                {attachment.mode === 'recreate' ? 'Same layout, components and copy, in your colors.' : 'Its mood and layout ideas, in an original card.'}
              </p>
            </div>
          </div>
        )}
        <div className="flex items-end gap-2">
          {onAttach && (
            <>
              <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp,image/gif" className="hidden"
                onChange={(event) => { takeImage(event.target.files); event.target.value = ''; }} />
              <MotionButton type="button" onClick={() => fileRef.current?.click()} aria-label="Attach a reference image"
                className="grid size-10 shrink-0 place-items-center rounded-xl text-foreground hover:bg-accent">
                <ImagePlus className="size-4" strokeWidth={1.5} aria-hidden />
              </MotionButton>
            </>
          )}
          <textarea
            rows={2}
            value={input}
            onChange={(event) => onInput(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' && !event.shiftKey) {
                event.preventDefault();
                if (canSend) onSubmit();
              }
            }}
            onPaste={onAttach ? (event) => { if (takeImage(event.clipboardData?.files)) event.preventDefault(); } : undefined}
            placeholder={placeholder}
            aria-label={placeholder}
            className="max-h-28 min-h-[3rem] flex-1 resize-none rounded-xl border border-border bg-background px-3 py-2 text-[13px] text-foreground placeholder:text-muted-foreground focus:outline-none"
          />
          <MotionButton
            type="submit"
            disabled={!canSend}
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
