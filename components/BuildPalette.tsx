import * as Popover from '@radix-ui/react-popover';
import { ArrowLeft, Plus, Sparkles, X } from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';
import { ColorData, GlobalCurveConfig } from '../types';
import { createColorData, deduplicateColorNames, generateHarmonies, generateShades, hexToRgb, rgbToOklch } from '../utils/colorUtils';
import { Hint } from './Hint';
import { OklchEditor, hexFromOklch } from './OklchControls';
import { MotionButton } from './uiMotion';

export type BuildHarmony =
  | 'custom'
  | 'monochromatic'
  | 'duotone'
  | 'analogous'
  | 'complementary'
  | 'split-complementary'
  | 'triadic'
  | 'square';

const HARMONIES: readonly (readonly [BuildHarmony, string])[] = [
  ['custom', 'Custom'],
  ['monochromatic', 'Mono'],
  ['duotone', 'Duotone'],
  ['analogous', 'Analogous'],
  ['complementary', 'Complementary'],
  ['split-complementary', 'Split'],
  ['triadic', 'Triadic'],
  ['square', 'Square'],
];

const MAX_COLORS = 12;

/** Colors for a harmony, keeping the seed exactly as the person set it. */
export const harmonyFromSeed = (seed: ColorData, harmony: BuildHarmony): ColorData[] => {
  if (harmony === 'custom') return [seed];
  const [, ...rest] = generateHarmonies(seed.hsl, harmony);
  return deduplicateColorNames([seed, ...rest]);
};

/** A new color near the selected one: same hue, lightness moved away from it. */
const nextColor = (from: ColorData): ColorData => {
  const rgb = hexToRgb(from.hex);
  const { l, c, h } = rgbToOklch(rgb.r, rgb.g, rgb.b);
  const lightness = l > 0.6 ? l - 0.3 : l + 0.3;
  return createColorData(hexFromOklch(lightness, c * 0.6, h));
};

interface BuildPaletteProps {
  colors: ColorData[];
  onColorsChange: (colors: ColorData[]) => void;
  globalConfig?: GlobalCurveConfig;
  suggestedName: string;
  saving: boolean;
  saved: boolean;
  onSave: (name: string) => Promise<boolean>;
  onOpenStudio: () => void;
  onBack: () => void;
  onAskPigmento: () => void;
  pigmentoBusy: boolean;
}

const BuildPalette: React.FC<BuildPaletteProps> = ({
  colors,
  onColorsChange,
  globalConfig,
  suggestedName,
  saving,
  saved,
  onSave,
  onOpenStudio,
  onBack,
  onAskPigmento,
  pigmentoBusy,
}) => {
  const [harmony, setHarmony] = useState<BuildHarmony>('custom');
  const [selected, setSelected] = useState(0);
  const [saveOpen, setSaveOpen] = useState(false);
  const [name, setName] = useState(suggestedName);
  const [undo, setUndo] = useState<ColorData[] | null>(null);
  const written = useRef<ColorData[]>(colors);
  const beforePigmento = useRef<ColorData[] | null>(null);

  const write = (next: ColorData[]) => {
    written.current = next;
    onColorsChange(next);
  };

  // Colors that change without passing through write() came from Pigmento:
  // detach the harmony so it does not overwrite them, and offer undo.
  useEffect(() => {
    if (colors === written.current) return;
    written.current = colors;
    setHarmony('custom');
    setSelected((index) => Math.min(index, Math.max(colors.length - 1, 0)));
    if (beforePigmento.current) setUndo(beforePigmento.current);
  }, [colors]);

  useEffect(() => {
    if (pigmentoBusy) {
      beforePigmento.current = colors;
      setUndo(null);
    }
  }, [pigmentoBusy]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (saveOpen) setName(suggestedName);
  }, [saveOpen, suggestedName]);

  const current = colors[selected] ?? colors[0];
  const seeded = harmony !== 'custom';

  const chooseHarmony = (next: BuildHarmony) => {
    setHarmony(next);
    setUndo(null);
    if (next !== 'custom' && colors[0]) {
      write(harmonyFromSeed(colors[0], next));
      setSelected(0);
    }
  };

  const editSelected = (hex: string) => {
    if (!current) return;
    const edited = createColorData(hex, current.scaleConfig, current.name);
    if (seeded && selected === 0) {
      write(harmonyFromSeed(edited, harmony));
      return;
    }
    if (seeded) setHarmony('custom');
    write(colors.map((color, index) => (index === selected ? edited : color)));
  };

  const addColor = () => {
    if (!current || colors.length >= MAX_COLORS) return;
    setHarmony('custom');
    const next = deduplicateColorNames([...colors, nextColor(current)]);
    write(next);
    setSelected(next.length - 1);
  };

  const removeColor = (index: number) => {
    if (colors.length <= 1) return;
    setHarmony('custom');
    write(colors.filter((_, i) => i !== index));
    setSelected((value) => (value > index ? value - 1 : Math.min(value, colors.length - 2)));
  };

  const submitSave = async (event: React.FormEvent) => {
    event.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    if (await onSave(trimmed)) setSaveOpen(false);
  };

  const shades = current ? generateShades(current, globalConfig) : [];

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 pb-28 pt-6">
        <div className="flex flex-wrap items-center gap-3">
          <Hint label="Back">
            <MotionButton
              type="button"
              onClick={onBack}
              aria-label="Back"
              className="grid size-9 place-items-center rounded-lg text-foreground hover:bg-accent"
            >
              <ArrowLeft className="size-4" strokeWidth={1.5} aria-hidden />
            </MotionButton>
          </Hint>
          <div className="min-w-0 flex-1">
            <h1 className="text-xl font-medium tracking-tight text-foreground">Build palette</h1>
            <p className="text-[13px] text-muted-foreground">Pick a seed, choose a harmony, or add colors one by one.</p>
          </div>
          <div className="flex basis-full items-center justify-end gap-2 sm:basis-auto">
            <MotionButton
              type="button"
              onClick={onAskPigmento}
              className="inline-flex h-9 items-center gap-2 rounded-lg border border-border bg-card px-3 text-[13px] text-foreground hover:bg-accent"
            >
              <Sparkles className="size-4" strokeWidth={1.5} aria-hidden />
              Improve with Pigmento
            </MotionButton>
            <Popover.Root open={saveOpen} onOpenChange={setSaveOpen}>
              <Popover.Trigger asChild>
                <MotionButton
                  type="button"
                  disabled={saving}
                  className="inline-flex h-9 items-center rounded-lg bg-primary px-4 text-[13px] text-primary-foreground hover:opacity-90 disabled:opacity-40"
                >
                  {saved ? 'Saved' : 'Save'}
                </MotionButton>
              </Popover.Trigger>
              <Popover.Portal>
                <Popover.Content
                  align="end"
                  sideOffset={8}
                  collisionPadding={12}
                  className="z-50 w-72 rounded-xl bg-card p-3 shadow-panel ring-1 ring-border"
                >
                  <form onSubmit={submitSave}>
                    <label className="text-[13px] text-muted-foreground" htmlFor="build-palette-name">Palette name</label>
                    <input
                      id="build-palette-name"
                      autoFocus
                      value={name}
                      onChange={(event) => setName(event.target.value)}
                      onFocus={(event) => event.currentTarget.select()}
                      maxLength={60}
                      className="mt-1.5 h-9 w-full rounded-lg border border-border bg-background px-2.5 text-[13px] text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
                    />
                    <div className="mt-3 flex justify-end gap-2">
                      <Popover.Close asChild>
                        <button type="button" className="h-8 rounded-lg px-3 text-[13px] text-foreground hover:bg-accent">Cancel</button>
                      </Popover.Close>
                      <button
                        type="submit"
                        disabled={saving || !name.trim()}
                        className="h-8 rounded-lg bg-primary px-3 text-[13px] text-primary-foreground hover:opacity-90 disabled:opacity-40"
                      >
                        {saving ? 'Saving…' : 'Save palette'}
                      </button>
                    </div>
                  </form>
                </Popover.Content>
              </Popover.Portal>
            </Popover.Root>
          </div>
        </div>

        {(saved || undo) && (
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-lg border border-border bg-card px-3 py-2 text-[13px] text-muted-foreground" role="status">
            {undo ? (
              <>
                <span>Pigmento updated your palette.</span>
                <button
                  type="button"
                  className="text-foreground underline underline-offset-2"
                  onClick={() => { write(undo); setUndo(null); }}
                >
                  Undo
                </button>
              </>
            ) : null}
            {saved ? (
              <>
                <span>Palette saved.</span>
                <button type="button" className="text-foreground underline underline-offset-2" onClick={onOpenStudio}>
                  Open in studio
                </button>
              </>
            ) : null}
          </div>
        )}

        <div className="grid gap-6 md:grid-cols-2">
          <section className="rounded-2xl bg-card p-4 ring-1 ring-border" aria-label="Editor">
            <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label="Harmony">
              {HARMONIES.map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  role="radio"
                  aria-checked={harmony === id}
                  onClick={() => chooseHarmony(id)}
                  className={`h-8 rounded-full px-3 text-[12px] ${harmony === id ? 'bg-primary text-primary-foreground' : 'border border-border text-foreground hover:bg-accent'}`}
                >
                  {label}
                </button>
              ))}
            </div>
            <p className="mt-2 text-[12px] text-muted-foreground">
              {seeded
                ? 'The first color is the seed. Changing it updates the rest. Editing another color switches to Custom.'
                : 'Every color is yours to edit. Pick a harmony to build from the first color.'}
            </p>

            {current && (
              <>
                <p className="mt-5 text-[13px] text-foreground">
                  {current.name}
                  {seeded && selected === 0 ? <span className="ml-2 text-[12px] text-muted-foreground">Seed</span> : null}
                </p>
                <div className="mt-2 flex h-10 overflow-hidden rounded-lg ring-1 ring-border" aria-label={`${current.name} ramp`}>
                  {shades.map((shade) => (
                    <span
                      key={shade.level}
                      className={`relative min-w-0 flex-1 ${shade.isInput ? 'ring-1 ring-inset ring-foreground' : ''}`}
                      style={{ backgroundColor: shade.hex }}
                      title={`${shade.level} ${shade.hex}`}
                    />
                  ))}
                </div>
                <OklchEditor className="mt-4" hex={current.hex} onChange={editSelected} />
              </>
            )}
          </section>

          <section className="flex flex-col rounded-2xl bg-card p-2 ring-1 ring-border" aria-label="Palette">
            <ul className="flex flex-col gap-1">
              {colors.map((color, index) => {
                const active = index === selected;
                const ramp = generateShades(color, globalConfig);
                return (
                  <li key={`${index}-${color.name}`} className={`group flex items-center gap-3 rounded-xl p-2 ${active ? 'bg-accent' : 'hover:bg-accent'}`}>
                    <button
                      type="button"
                      aria-pressed={active}
                      onClick={() => setSelected(index)}
                      className="flex min-w-0 flex-1 items-center gap-3 text-left outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] rounded-lg"
                    >
                      <span className="size-10 shrink-0 rounded-lg ring-1 ring-border" style={{ backgroundColor: color.hex }} />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[13px] text-foreground">
                          {color.name}
                          {seeded && index === 0 ? <span className="ml-2 text-[12px] text-muted-foreground">Seed</span> : null}
                        </span>
                        <span className="block font-mono text-[12px] uppercase text-muted-foreground">{color.hex}</span>
                      </span>
                      <span className="hidden h-4 w-32 shrink-0 overflow-hidden rounded sm:flex" aria-hidden>
                        {ramp.map((shade) => (
                          <span key={shade.level} className="h-full flex-1" style={{ backgroundColor: shade.hex }} />
                        ))}
                      </span>
                    </button>
                    {colors.length > 1 && (
                      <Hint label="Remove">
                        <button
                          type="button"
                          aria-label={`Remove ${color.name}`}
                          onClick={() => removeColor(index)}
                          className="grid size-8 shrink-0 place-items-center rounded-lg text-muted-foreground hover:bg-background hover:text-foreground"
                        >
                          <X className="size-4" strokeWidth={1.5} aria-hidden />
                        </button>
                      </Hint>
                    )}
                  </li>
                );
              })}
            </ul>
            <MotionButton
              type="button"
              onClick={addColor}
              disabled={colors.length >= MAX_COLORS}
              className="mt-1 inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-dashed border-border text-[13px] text-foreground hover:bg-accent disabled:opacity-40"
            >
              <Plus className="size-4" strokeWidth={1.5} aria-hidden />
              Add color
            </MotionButton>
          </section>
        </div>
      </div>
    </div>
  );
};

export default BuildPalette;
