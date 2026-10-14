import React, { useEffect, useRef, useState } from 'react';
import { maxOklchChroma, oklchToRgb, rgbToHex, rgbToOklch, hexToRgb } from '../utils/colorUtils';

export const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

export const colorHex = (l: number, c: number, h: number) => {
  const rgb = oklchToRgb(l, Math.min(c, maxOklchChroma(l, h)), h);
  return rgbToHex(rgb.r, rgb.g, rgb.b);
};

export const hexFromOklch = (l: number, c: number, h: number) => {
  const hue = ((h % 360) + 360) % 360;
  const lightness = clamp(l, 0, 1);
  const chroma = clamp(c, 0, maxOklchChroma(lightness, hue));
  const rgb = oklchToRgb(lightness, chroma, hue);
  return rgbToHex(rgb.r, rgb.g, rgb.b);
};

export const thumbStyle = (hex: string): React.CSSProperties => ({
  backgroundColor: hex,
  boxShadow: '0 0 0 1px rgba(0,0,0,0.7)',
});

/** Hex field plus Lightness, Chroma and Hue rows, each with a gradient slider. */
export const OklchEditor: React.FC<{
  hex: string;
  onChange: (hex: string) => void;
  className?: string;
}> = ({ hex, onChange, className = '' }) => {
  const [hexDraft, setHexDraft] = useState(hex.toUpperCase());
  const hexFocused = useRef(false);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  const rgb = hexToRgb(hex);
  const oklch = rgbToOklch(rgb.r, rgb.g, rgb.b);

  useEffect(() => {
    if (!hexFocused.current) setHexDraft(hex.toUpperCase());
  }, [hex]);

  const commitHex = (raw: string) => {
    const next = raw.trim().toUpperCase();
    setHexDraft(next);
    const withHash = next.startsWith('#') ? next : `#${next}`;
    if (/^#[0-9A-F]{6}$/.test(withHash)) onChangeRef.current(withHash);
  };

  return (
    <div className={className}>
      <div className="flex items-center gap-2 rounded-lg border border-border bg-background px-2 py-1.5">
        <span className="size-7 shrink-0 rounded-md ring-1 ring-border" style={{ backgroundColor: hex }} />
        <input
          type="text"
          value={hexDraft}
          spellCheck={false}
          aria-label="Hex"
          onFocus={() => { hexFocused.current = true; }}
          onBlur={() => { hexFocused.current = false; setHexDraft(hex.toUpperCase()); }}
          onChange={(event) => commitHex(event.target.value)}
          className="min-w-0 flex-1 bg-transparent font-mono text-[13px] uppercase text-foreground focus:outline-none"
        />
      </div>

      <div className="mt-3">
        <ChannelRow
          label="Lightness"
          value={oklch.l}
          min={0}
          max={1}
          step={0.01}
          digits={2}
          track={(t) => colorHex(t, oklch.c, oklch.h)}
          onCommit={(value) => onChangeRef.current(hexFromOklch(value, oklch.c, oklch.h))}
        />
        <ChannelRow
          label="Chroma"
          value={oklch.c}
          min={0}
          max={0.4}
          step={0.001}
          digits={3}
          track={(t) => colorHex(oklch.l, t, oklch.h)}
          onCommit={(value) => onChangeRef.current(hexFromOklch(oklch.l, value, oklch.h))}
        />
        <ChannelRow
          label="Hue"
          value={oklch.h}
          min={0}
          max={360}
          step={1}
          digits={1}
          suffix="°"
          track={(t) => colorHex(oklch.l, Math.max(oklch.c, 0.04), t)}
          onCommit={(value) => onChangeRef.current(hexFromOklch(oklch.l, oklch.c, value))}
        />
      </div>
    </div>
  );
};

const ChannelRow: React.FC<{
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  digits: number;
  suffix?: string;
  /** Color at a channel value, used to paint the slider track. */
  track: (value: number) => string;
  onCommit: (value: number) => void;
}> = ({ label, value, min, max, step, digits, suffix, track, onCommit }) => {
  const [text, setText] = useState(value.toFixed(digits));
  const [focused, setFocused] = useState(false);

  useEffect(() => {
    if (!focused) setText(value.toFixed(digits));
  }, [value, focused, digits]);

  const commit = (raw: string) => {
    const next = Number(raw);
    if (!Number.isFinite(next)) return;
    onCommit(clamp(next, min, max));
  };

  return (
    <div className="border-b border-border pb-3">
      <label className="flex h-8 items-center justify-between gap-3">
        <span className="text-[13px] text-muted-foreground">{label}</span>
        <span className="flex items-center">
          <input
            type="number"
            inputMode="decimal"
            min={min}
            max={max}
            step={step}
            value={focused ? text : value.toFixed(digits)}
            aria-label={label}
            onFocus={() => { setFocused(true); setText(value.toFixed(digits)); }}
            onBlur={() => { setFocused(false); commit(text); }}
            onChange={(event) => {
              setText(event.target.value);
              if (event.target.value !== '' && !event.target.value.endsWith('.')) commit(event.target.value);
            }}
            className="w-16 bg-transparent text-right font-mono text-[13px] text-foreground focus:outline-none"
          />
          {suffix && <span className="font-mono text-[13px] text-foreground">{suffix}</span>}
        </span>
      </label>
      <ChannelSlider
        label={label}
        value={value}
        min={min}
        max={max}
        step={step}
        digits={digits}
        track={track}
        onChange={(next) => onCommit(clamp(next, min, max))}
      />
    </div>
  );
};

const ChannelSlider: React.FC<{
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  digits: number;
  track: (value: number) => string;
  onChange: (value: number) => void;
}> = ({ label, value, min, max, step, digits, track, onChange }) => {
  const ref = useRef<HTMLDivElement>(null);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  const span = max - min;
  const stops = Array.from({ length: 17 }, (_, index) => track(min + (span * index) / 16));
  const t = clamp((value - min) / span, 0, 1);

  const pick = (clientX: number) => {
    const rect = ref.current?.getBoundingClientRect();
    if (!rect || rect.width === 0) return;
    onChangeRef.current(min + clamp((clientX - rect.left) / rect.width, 0, 1) * span);
  };

  const onKeyDown = (event: React.KeyboardEvent) => {
    const big = step * 10;
    const next = {
      ArrowRight: value + step,
      ArrowUp: value + step,
      ArrowLeft: value - step,
      ArrowDown: value - step,
      PageUp: value + big,
      PageDown: value - big,
      Home: min,
      End: max,
    }[event.key];
    if (next === undefined) return;
    event.preventDefault();
    onChangeRef.current(clamp(next, min, max));
  };

  return (
    <div
      ref={ref}
      className="relative h-6 cursor-pointer rounded-md ring-1 ring-border outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
      style={{ background: `linear-gradient(to right, ${stops.join(', ')})`, touchAction: 'none' }}
      tabIndex={0}
      onKeyDown={onKeyDown}
      onPointerDown={(event) => {
        event.currentTarget.setPointerCapture(event.pointerId);
        pick(event.clientX);
      }}
      onPointerMove={(event) => {
        if (!event.currentTarget.hasPointerCapture(event.pointerId)) return;
        pick(event.clientX);
      }}
      role="slider"
      aria-label={`${label} slider`}
      aria-valuemin={min}
      aria-valuemax={max}
      aria-valuenow={Number(value.toFixed(digits))}
      aria-valuetext={`${label} ${value.toFixed(digits)}`}
    >
      <span
        className="pointer-events-none absolute top-1/2 size-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white"
        style={{ left: `${t * 100}%`, ...thumbStyle(stops[Math.round(t * 16)]) }}
      />
    </div>
  );
};

