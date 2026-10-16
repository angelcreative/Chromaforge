import React, { forwardRef, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react';
import { Moon, Sun, X } from 'lucide-react';
import PigmentoMark from '../pigmento/PigmentoMark';
import LogoMark from '../LogoMark';
import { MotionButton } from '../uiMotion';
import './playground.css';
import { ColorData, GlobalCurveConfig, PlaygroundConfig } from '../../types';
import { buildPlaygroundTokens, tokensToCss } from '../../utils/playgroundTokens';
import { CARD_CATEGORIES, CardCategory, PLAYGROUND_CARDS } from './cards';
import { GeneratedCardView } from './GeneratedCard';
import { showToast } from '../Toast';
import {
  GeneratedCard, MAX_GENERATED_CARDS, generateCard, listGeneratedCards, removeGeneratedCard, saveGeneratedCard,
} from '../../services/pigmentoCardsService';

export interface PlaygroundProps {
  brandPalette: ColorData[];
  neutralPalette: ColorData[];
  semanticPalette: ColorData[];
  config: PlaygroundConfig;
  onConfigChange: (next: PlaygroundConfig) => void;
  globalConfig?: GlobalCurveConfig;
  userId: string;
  onCreditsChange?: (remaining: number) => void;
  /** Opens the Pigmento chat in card mode. */
  onCreateWithPigmento: () => void;
}

export interface CardOutcome {
  ok: boolean;
  message: string;
  creditsSpent?: number;
  paymentRequired?: boolean;
}

export interface PlaygroundHandle {
  createCard: (text: string) => Promise<CardOutcome>;
}

type Filter = 'All' | CardCategory | 'Pigmento';
const GENERATED = 'Created with Pigmento';

// Cards dissolve over the first 40px of the scroller rather than hitting a hard edge.
const SCROLL_FADE: React.CSSProperties = {
  maskImage: 'linear-gradient(to bottom, transparent 0, #000 40px)',
  WebkitMaskImage: 'linear-gradient(to bottom, transparent 0, #000 40px)',
};

const chip = 'rounded-full border px-3 py-1 text-[13px] transition-colors';
const seg = 'inline-flex rounded-lg bg-accent p-0.5';
const segBtn = (on: boolean) => `rounded-md px-2.5 py-1 text-[13px] ${on ? 'bg-card text-foreground shadow-panel' : 'text-muted-foreground hover:text-foreground'}`;

const Playground = forwardRef<PlaygroundHandle, PlaygroundProps>(({
  brandPalette, neutralPalette, semanticPalette, config, onConfigChange, globalConfig, userId, onCreditsChange,
  onCreateWithPigmento,
}, ref) => {
  const [radius, setRadius] = useState(12);
  const [filter, setFilter] = useState<Filter>('All');
  const [auditOpen, setAuditOpen] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null); // 'new' or a card id
  const [pendingPrompt, setPendingPrompt] = useState('');
  const [generated, setGenerated] = useState<GeneratedCard[]>([]);
  const stageRef = useRef<HTMLElement>(null);
  const busyRef = useRef(false);

  const selectedIndex = brandPalette.length ? Math.min(Math.max(config.primaryIndex, 0), brandPalette.length - 1) : 0;
  const tokens = useMemo(
    () => buildPlaygroundTokens(brandPalette, neutralPalette, semanticPalette, { ...config, primaryIndex: selectedIndex }, globalConfig, radius),
    [brandPalette, neutralPalette, semanticPalette, config, selectedIndex, globalConfig, radius],
  );
  const tokensCss = useMemo(() => (tokens ? tokensToCss(tokens, '.pg') : ''), [tokens]);
  const exportCss = useMemo(() => (tokens ? tokensToCss(tokens, ':root') : ''), [tokens]);

  useEffect(() => {
    let alive = true;
    listGeneratedCards(userId).then(cards => { if (alive) setGenerated(cards); }).catch(() => {});
    return () => { alive = false; };
  }, [userId]);

  const create = async (text: string, replace?: GeneratedCard): Promise<CardOutcome> => {
    const clean = text.trim();
    if (!clean) return { ok: false, message: 'Describe the card you want in a few words.' };
    if (busyRef.current) return { ok: false, message: 'I am still building the previous card. Give me a moment.' };
    if (!replace && generated.length >= MAX_GENERATED_CARDS) {
      return { ok: false, message: `You can keep up to ${MAX_GENERATED_CARDS} Pigmento cards. Delete one in the Playground first.` };
    }
    busyRef.current = true;
    setBusyId(replace ? replace.id : 'new');
    if (!replace) {
      setPendingPrompt(clean);
      setFilter(f => (f === 'All' || f === 'Pigmento' ? f : 'Pigmento'));
      requestAnimationFrame(() => stageRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
    }
    try {
      const result = await generateCard(clean);
      if (typeof result.creditsRemaining === 'number') onCreditsChange?.(result.creditsRemaining);
      if (!result.html) {
        return { ok: false, message: result.description, creditsSpent: result.creditsSpent, paymentRequired: result.paymentRequired };
      }
      if (replace) await removeGeneratedCard(userId, replace.id).catch(() => {});
      const saved = await saveGeneratedCard(userId, { title: result.title || 'Pigmento card', prompt: clean, html: result.html });
      setGenerated(prev => [saved, ...prev.filter(c => c.id !== replace?.id)]);
      return { ok: true, message: `Done. “${saved.title}” is in the Playground, themed with your palette.`, creditsSpent: result.creditsSpent };
    } catch (error: any) {
      return { ok: false, message: error?.message || 'Could not save the card.' };
    } finally {
      busyRef.current = false;
      setBusyId(null);
      setPendingPrompt('');
    }
  };

  useImperativeHandle(ref, () => ({ createCard: (text: string) => create(text) }));

  if (!tokens) {
    return <p className="text-[13px] text-muted-foreground">Generate a palette first to activate the playground.</p>;
  }

  const remove = async (card: GeneratedCard) => {
    setGenerated(prev => prev.filter(c => c.id !== card.id));
    try { await removeGeneratedCard(userId, card.id); } catch { showToast('Could not delete the card.'); }
  };

  // Your own Pigmento cards lead once there are any.
  const hasOwn = generated.length > 0 || busyId === 'new';
  const categories: Filter[] = filter === 'All' ? (hasOwn ? ['Pigmento', ...CARD_CATEGORIES] : [...CARD_CATEGORIES, 'Pigmento']) : [filter];
  const count = (c: Filter) => (c === 'All' ? PLAYGROUND_CARDS.length + generated.length : c === 'Pigmento' ? generated.length : PLAYGROUND_CARDS.filter(k => k.category === c).length);

  const regenerate = async (card: GeneratedCard) => {
    const outcome = await create(card.prompt, card);
    if (!outcome.ok) showToast(outcome.message);
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {/* Same centred column as the palette view; the sidebar and Pigmento float over it.
          The controls sit outside the scroller with no background, so the dot grid runs
          through them, and the cards fade out at the scroller's top edge instead of
          sliding underneath. */}
      <div className="mx-auto w-full max-w-5xl shrink-0 px-4 pb-1 pt-5">
        <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
          <div className="mr-auto">
            <h2 className="text-2xl font-medium tracking-tight">Playground</h2>
            <p className="mt-1 text-[13px] text-muted-foreground">Your palette applied to {PLAYGROUND_CARDS.length} interfaces at once.</p>
          </div>

          <div className="flex items-center gap-1.5" role="radiogroup" aria-label="Primary color">
            {brandPalette.map((c, i) => (
              <button key={`${c.hex}-${i}`} type="button" role="radio" aria-checked={i === selectedIndex} aria-label={`${c.name} as primary`}
                onClick={() => onConfigChange({ ...config, primaryIndex: i })}
                className={`size-6 rounded-full ring-2 ring-offset-2 ring-offset-background transition ${i === selectedIndex ? 'ring-foreground' : 'ring-transparent hover:ring-border'}`}
                style={{ background: c.hex }} />
            ))}
          </div>

          <div className={seg} role="group" aria-label="Appearance">
            <button type="button" className={segBtn(!config.isDarkMode)} aria-pressed={!config.isDarkMode} onClick={() => onConfigChange({ ...config, isDarkMode: false })}><Sun className="inline size-3.5" strokeWidth={1.5} aria-hidden /> Light</button>
            <button type="button" className={segBtn(config.isDarkMode)} aria-pressed={config.isDarkMode} onClick={() => onConfigChange({ ...config, isDarkMode: true })}><Moon className="inline size-3.5" strokeWidth={1.5} aria-hidden /> Dark</button>
          </div>

          <div className={seg} role="group" aria-label="Neutrals">
            <button type="button" className={segBtn(config.textMode === 'tinted')} aria-pressed={config.textMode === 'tinted'} onClick={() => onConfigChange({ ...config, textMode: 'tinted' })}>Tinted neutrals</button>
            <button type="button" className={segBtn(config.textMode === 'base')} aria-pressed={config.textMode === 'base'} onClick={() => onConfigChange({ ...config, textMode: 'base' })}>Pure</button>
          </div>

          {/* Same slider as the Scale panel in the sidebar. */}
          <label className="flex items-center gap-3 text-[13px] text-muted-foreground">Radius
            <input type="range" min={0} max={20} step={1} value={radius} onChange={e => setRadius(Number(e.target.value))} aria-label="Corner radius"
              className="scale-slider w-28" style={{ '--range-fill': `${(radius / 20) * 100}%` } as React.CSSProperties} />
            <span className="w-9 text-right font-mono text-foreground">{radius}px</span>
          </label>

          <button type="button" onClick={() => setAuditOpen(v => !v)} aria-expanded={auditOpen}
            className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-1.5 text-[13px] hover:bg-accent">
            <span className="size-2 rounded-full" style={{ background: tokens.failures ? tokens.vars['--danger'] : tokens.vars['--success'] }} aria-hidden />
            {tokens.failures ? <><b>{tokens.failures}</b>&nbsp;contrast {tokens.failures === 1 ? 'issue' : 'issues'}</> : <><b>{tokens.audit.length}/{tokens.audit.length}</b>&nbsp;contrast checks pass</>}
          </button>

          <MotionButton type="button" onClick={onCreateWithPigmento}
            className="inline-flex h-9 items-center gap-2 rounded-lg border border-border bg-card px-3 text-[13px] text-foreground hover:bg-accent">
            <PigmentoMark className="size-6 -my-1" />
            Create with Pigmento
          </MotionButton>
        </div>

        {/* Ramp strip */}
        <div className="mt-4 grid h-2 grid-cols-11 overflow-hidden rounded-full" aria-hidden>
          {Object.values(tokens.primary).map((hex, i) => <span key={i} style={{ background: hex }} />)}
        </div>

        {/* Filters */}
        <div className="mt-3 flex flex-wrap gap-1.5" role="group" aria-label="Filter by category">
          {(['All', ...CARD_CATEGORIES, 'Pigmento'] as Filter[]).map(c => (
            <button key={c} type="button" aria-pressed={filter === c} onClick={() => setFilter(c)}
              className={`${chip} ${filter === c ? 'border-foreground bg-foreground text-background' : 'border-border text-muted-foreground hover:text-foreground'}`}>
              {c === 'Pigmento' ? GENERATED : c}<span className="ml-1 opacity-60">{count(c)}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto" style={SCROLL_FADE}>
      <div className="mx-auto w-full max-w-5xl px-4 pb-28 pt-5">
        {/* Audit */}
        {auditOpen && (
          <section className="mt-2 rounded-2xl border border-border bg-card p-4" aria-label="Contrast audit">
            <div className="flex items-start justify-between gap-3">
              <div><h3 className="text-[15px] font-medium">Contrast audit</h3><p className="text-[13px] text-muted-foreground">Every token pair the cards use, measured with WCAG 2.1. Text needs 4.5:1; borders and icons 3:1.</p></div>
              <button type="button" className="rounded-md p-1 hover:bg-accent" onClick={() => setAuditOpen(false)} aria-label="Close audit"><X className="size-4" strokeWidth={1.5} /></button>
            </div>
            <table className="mt-3 w-full text-[13px]">
              <tbody>
                {tokens.audit.map(a => (
                  <tr key={a.label} className="border-t border-border">
                    <td className="py-1.5 pr-2"><span className="grid h-7 w-11 place-items-center rounded-md border border-border text-[12px] font-semibold" style={{ background: tokens.vars[`--${a.bg}`], color: tokens.vars[`--${a.fg}`] }}>Aa</span></td>
                    <td className="py-1.5">{a.label}<span className="block text-[12px] text-muted-foreground">--{a.fg} on --{a.bg} · min {a.min}:1</span></td>
                    <td className="py-1.5 text-right font-mono">{a.ratio.toFixed(2)}</td>
                    <td className={`py-1.5 pl-3 text-right text-[12px] font-semibold ${a.pass ? 'text-emerald-600' : 'text-red-600'}`}>{a.pass ? 'Pass' : 'Fail'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        )}

        {/* Stage */}
        <section ref={stageRef} className="pg mt-2 scroll-mt-6 rounded-[20px] p-4 transition-colors sm:p-5" style={{ ...(tokens.vars as React.CSSProperties), background: 'var(--bg)' }} data-view="playground">
          <div className="masonry">
            {categories.map(cat => (
              <React.Fragment key={cat}>
                <div className="cat-h">{cat === 'Pigmento' ? GENERATED : cat}</div>
                {cat === 'Pigmento' && busyId === 'new' && (
                  <div className="card" role="status" aria-live="polite">
                    <div className="row"><span aria-hidden style={{ display: 'grid', width: 28, height: 28, flex: 'none', color: 'var(--text)' }}><LogoMark motion="loading" className="size-7" /></span><div><h3 style={{ fontSize: 14 }}>Pigmento is building your card</h3><p className="xs muted">{pendingPrompt}</p></div></div>
                    <div className="col mt" aria-hidden><div className="skel" style={{ height: 90 }} /><div className="skel" style={{ width: '70%' }} /><div className="skel" style={{ width: '45%' }} /></div>
                  </div>
                )}
                {cat === 'Pigmento'
                  ? (generated.length === 0 && busyId !== 'new'
                    ? <div className="card" style={{ border: '1px dashed var(--border-strong)', background: 'transparent' }}><h3>No cards yet</h3><p className="sm muted mt-s">Use “Create with Pigmento” to build one from a sentence. It appears here, themed like the rest.</p><button type="button" className="btn soft mt" onClick={onCreateWithPigmento}>Create with Pigmento</button></div>
                    : generated.map(card => (
                      <GeneratedCardView key={card.id} card={card} tokensCss={tokensCss} busy={busyId === card.id} onRegenerate={regenerate} onDelete={remove} />
                    )))
                  : PLAYGROUND_CARDS.filter(k => k.category === cat).map(({ id, component: C }) => (
                    <C key={id} {...(id === 'code-snippet' ? { css: exportCss } : {})} />
                  ))}
              </React.Fragment>
            ))}
          </div>
        </section>
      </div>
      </div>
    </div>
  );
});

Playground.displayName = 'Playground';

export default Playground;
