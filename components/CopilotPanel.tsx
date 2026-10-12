import React from 'react';
import { MessageSquare, Send, X } from 'lucide-react';
import { ChatMessage } from '../types';
import { formatCompact } from '../services/credits';

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
  onCredits?: () => void;
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
  onCredits,
}) => (
  <>
    {open && (
      <form
        className="fixed bottom-20 right-4 z-50 flex max-h-[min(28rem,calc(100dvh-8rem))] w-[min(24rem,calc(100vw-2rem))] flex-col rounded-2xl bg-card p-3 text-foreground shadow-panel ring-1 ring-border"
        onSubmit={(event) => {
          event.preventDefault();
          onSubmit();
        }}
      >
        <div className="mb-2 flex items-center justify-between">
          <span className="text-[13px]">Copilot</span>
          <button type="button" onClick={onClose} className="grid size-8 place-items-center rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground" aria-label="Close">
            <X className="size-4" strokeWidth={1.5} />
          </button>
        </div>
        <div className="mb-2 flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto">
          {messages.map((message, index) => (
            <div key={index} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[90%] rounded-2xl px-3 py-2 text-[13px] leading-relaxed ${message.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-background text-foreground ring-1 ring-border'}`}>
                {message.text}
                {message.role === 'model' && typeof message.creditsSpent === 'number' && (
                  <p className="mt-1 text-[12px] text-muted-foreground" title={`${message.creditsSpent} credits`}>{formatCompact(message.creditsSpent)} credits</p>
                )}
              </div>
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={() => onSubmit('Fix a palette')}
          disabled={loading}
          className="mb-2 h-8 self-start rounded-full border border-border bg-background px-3 text-[13px] text-foreground hover:bg-accent disabled:opacity-40"
        >
          Fix a palette
        </button>
        <div className="mb-2">
          {onCredits ? (
            <button type="button" onClick={onCredits} className="text-[13px] text-muted-foreground hover:text-foreground" title={balanceTitle} aria-label={balanceTitle}>
              {balanceLabel}
            </button>
          ) : (
            <span className="text-[13px] text-muted-foreground" title={balanceTitle}>{balanceLabel}</span>
          )}
        </div>
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
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-40"
            aria-label="Send"
          >
            <Send className="size-4" strokeWidth={1.5} />
          </button>
        </div>
      </form>
    )}
    <button
      type="button"
      onClick={onToggle}
      aria-expanded={open}
      className="fixed bottom-4 right-4 z-50 inline-flex h-11 items-center gap-2 rounded-full bg-card px-4 text-[13px] text-foreground shadow-panel ring-1 ring-border hover:bg-accent"
    >
      <MessageSquare className="size-4" strokeWidth={1.5} aria-hidden />
      Copilot
    </button>
  </>
);

export default CopilotPanel;
