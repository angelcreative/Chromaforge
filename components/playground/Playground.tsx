import React, { useEffect, useMemo, useState } from 'react';
import { Moon, Sparkles, Sun, X } from 'lucide-react';
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
}

type Filter = 'All' | CardCategory | 'Pigmento';
const GENERATED = 'Created with Pigmento';
const SUGGESTIONS = ['Boarding pass with gate and seat', 'Smart thermostat control', 'Podcast episode with play button', 'Invoice summary with status', 'Habit tracker for a week'];

const chip = 'rounded-full border px-3 py-1 text-[13px] transition-colors';
const seg = 'inline-flex rounded-lg bg-accent p-0.5';
const segBtn = (on: boolean) => `rounded-md px-2.5 py-1 text-[13px] ${on ? 'bg-card text-foreground shadow-panel' : 'text-muted-foreground hover:text-foreground'}`;

const Playground: React.FC<PlaygroundProps> = ({ brandPalette, neutralPalette, semanticPalette, config, onConfigChange, globalConfig, userId, onCreditsChange }) => {
  const [radius, setRadius] = useState(12);
  const [filter, setFilter] = useState<Filter>('All');
  const [auditOpen, setAuditOpen] = useState(false);
  const [composerOpen, setComposerOpen] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null); // 'new' or a card id
  const [generated, setGenerated] = useState<GeneratedCard[]>([]);

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

  if (!tokens) {
    return <p className="text-[13px] text-muted-foreground">Generate a palette first to activate the playground.</p>;
  }

  const create = async (text: string, replace?: GeneratedCard) => {
    const clean = text.trim();
    if (!clean || busyId) return;
    if (!replace && generated.length >= MAX_GENERATED_CARDS) {
      showToast(`You can keep up to ${MAX_GENERATED_CARDS} Pigmento cards. Delete one first.`);
      return;
    }
    setBusyId(replace ? replace.id : 'new');
    const result = await generateCard(clean);
    if (typeof result.creditsRemaining === 'number') onCreditsChange?.(result.creditsRemaining);
    if (!result.html) {
      showToast(result.description);
      setBusyId(null);
      return;
    }
    try {
      if (replace) await removeGeneratedCard(userId, replace.id).catch(() => {});
      const saved = await saveGeneratedCard(userId, { title: result.title || 'Pigmento card', prompt: clean, html: result.html });
      setGenerated(prev => [saved, ...prev.filter(c => c.id !== replace?.id)]);
      setFilter(f => (f === 'All' || f === 'Pigmento' ? f : 'Pigmento'));
      if (!replace) setPrompt('');
    } catch (error: any) {
      showToast(error?.message || 'Could not save the card.');
    }
    setBusyId(null);
  };

  const remove = async (card: GeneratedCard) => {
    setGenerated(prev => prev.filter(c => c.id !== card.id));
    try { await removeGeneratedCard(userId, card.id); } catch { showToast('Could not delete the card.'); }
  };

  const categories: Filter[] = filter === 'All' ? [...CARD_CATEGORIES, 'Pigmento'] : [filter];
  const count = (c: Filter) => (c === 'All' ? PLAYGROUND_CARDS.length + generated.length : c === 'Pigmento' ? generated.length : PLAYGROUND_CARDS.filter(k => k.category === c).length);

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
      <div className="mx-auto w-full max-w-[1480px] px-4 pb-24 pt-6">
        {/* Controls */}
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

          <label className="flex items-center gap-2 text-[13px] text-muted-foreground">Radius
            <input type="range" min={0} max={20} value={radius} onChange={e => setRadius(Number(e.target.value))} aria-label="Corner radius" className="w-20 accent-foreground" />
          </label>

          <button type="button" onClick={() => setAuditOpen(v => !v)} aria-expanded={auditOpen}
            className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-1.5 text-[13px] hover:bg-accent">
            <span className="size-2 rounded-full" style={{ background: tokens.failures ? '#d64545' : '#1f9d55' }} aria-hidden />
            {tokens.failures ? <><b>{tokens.failures}</b>&nbsp;contrast issues</> : <><b>{tokens.audit.length}/{tokens.audit.length}</b>&nbsp;contrast checks pass</>}
          </button>

          <button type="button" onClick={() => setComposerOpen(v => !v)} aria-expanded={composerOpen}
            className="flex items-center gap-2 rounded-lg bg-foreground px-3 py-1.5 text-[13px] font-medium text-background hover:opacity-90">
            <Sparkles className="size-4" strokeWidth={1.5} aria-hidden /> Create with Pigmento
          </button>
        </div>

        {/* Ramp strip */}
        <div className="mt-4 grid h-2 grid-cols-11 overflow-hidden rounded-full" aria-hidden>
          {Object.values(tokens.primary).map((hex, i) => <span key={i} style={{ background: hex }} />)}
        </div>

        {/* Audit */}
        {auditOpen && (
          <section className="mt-4 rounded-2xl border border-border bg-card p-4" aria-label="Contrast audit">
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

        {/* Composer */}
        {composerOpen && (
          <section className="mt-4 rounded-2xl border border-border bg-card p-4" aria-label="Create a card with Pigmento">
            <div className="flex items-start justify-between gap-3">
              <div><h3 className="text-[15px] font-medium">Create a card with Pigmento</h3><p className="text-[13px] text-muted-foreground">Describe one card. It uses your tokens, so it re-themes with everything else.</p></div>
              <button type="button" className="rounded-md p-1 hover:bg-accent" onClick={() => setComposerOpen(false)} aria-label="Close"><X className="size-4" strokeWidth={1.5} /></button>
            </div>
            <form className="mt-3 flex flex-col gap-3" onSubmit={e => { e.preventDefault(); create(prompt); }}>
              <textarea rows={3} value={prompt} onChange={e => setPrompt(e.target.value)} placeholder="A parking ticket with the time left and a button to extend it" aria-label="Card description"
                className="w-full resize-none rounded-lg border border-border bg-background px-3 py-2 text-[14px] outline-none focus:ring-2 focus:ring-foreground" />
              <div className="flex flex-wrap items-center gap-2">
                {SUGGESTIONS.map(s => <button key={s} type="button" onClick={() => setPrompt(s)} className={`${chip} border-border text-muted-foreground hover:text-foreground`}>{s}</button>)}
                <button type="submit" disabled={!prompt.trim() || !!busyId} className="ml-auto rounded-lg bg-foreground px-4 py-2 text-[13px] font-medium text-background disabled:opacity-50">
                  {busyId === 'new' ? 'Building…' : 'Build card'}
                </button>
              </div>
            </form>
          </section>
        )}

        {/* Filters */}
        <div className="mt-5 flex flex-wrap gap-1.5" role="group" aria-label="Filter by category">
          {(['All', ...CARD_CATEGORIES, 'Pigmento'] as Filter[]).map(c => (
            <button key={c} type="button" aria-pressed={filter === c} onClick={() => setFilter(c)}
              className={`${chip} ${filter === c ? 'border-foreground bg-foreground text-background' : 'border-border text-muted-foreground hover:text-foreground'}`}>
              {c === 'Pigmento' ? GENERATED : c}<span className="ml-1 opacity-60">{count(c)}</span>
            </button>
          ))}
        </div>

        {/* Stage */}
        <section className="pg mt-4 rounded-[20px] p-4 transition-colors sm:p-5" style={{ ...(tokens.vars as React.CSSProperties), background: 'var(--bg)' }} data-view="playground">
          <div className="masonry">
            {categories.map(cat => (
              <React.Fragment key={cat}>
                <div className="cat-h">{cat === 'Pigmento' ? GENERATED : cat}</div>
                {cat === 'Pigmento'
                  ? (generated.length === 0
                    ? <div className="card" style={{ borderStyle: 'dashed', background: 'transparent' }}><h3>No cards yet</h3><p className="sm muted mt-s">Use “Create with Pigmento” to build one from a sentence. It appears here, themed like the rest.</p></div>
                    : generated.map(card => (
                      <GeneratedCardView key={card.id} card={card} tokensCss={tokensCss} busy={busyId === card.id} onRegenerate={c => create(c.prompt, c)} onDelete={remove} />
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
  );
};

export default Playground;
