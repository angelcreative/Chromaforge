import { motion } from 'motion/react';
import React, { useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';
import { slideMotion, useReduced } from './uiMotion';
import { ColorData, GlobalCurveConfig } from '../types';
import { generateShades, maxOklchChroma, oklchToRgb, rgbToHex, rgbToOklch } from '../utils/colorUtils';

const WHEEL = 232;

interface RefineDrawerProps {
  open: boolean;
  color: ColorData;
  globalConfig?: GlobalCurveConfig;
  siblings?: ColorData[];
  colorIndex?: number;
  onSelectColor?: (index: number) => void;
  onClose: () => void;
  onChange: (hex: string) => void;
}

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const colorHex = (l: number, c: number, h: number) => {
  const rgb = oklchToRgb(l, Math.min(c, maxOklchChroma(l, h)), h);
  return rgbToHex(rgb.r, rgb.g, rgb.b);
};

const hexFromOklch = (l: number, c: number, h: number) => {
  const hue = ((h % 360) + 360) % 360;
  const lightness = clamp(l, 0, 1);
  const chroma = clamp(c, 0, maxOklchChroma(lightness, hue));
  const rgb = oklchToRgb(lightness, chroma, hue);
  return rgbToHex(rgb.r, rgb.g, rgb.b);
};

const thumbStyle = (hex: string): React.CSSProperties => ({
  backgroundColor: hex,
  boxShadow: '0 0 0 1px rgba(0,0,0,0.7)',
});

const selectedRing = 'ring-1 ring-inset ring-foreground';
const selectedRingFocus = 'focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-foreground';

const RefineDrawer: React.FC<RefineDrawerProps> = ({
  open,
  color,
  globalConfig,
  siblings,
  colorIndex = 0,
  onSelectColor,
  onClose,
  onChange,
}) => {
  const reduce = useReduced();
  const [present, setPresent] = useState(open);
  const [shown, setShown] = useState(open);
  const [hexDraft, setHexDraft] = useState(color.hex.toUpperCase());
  const hexFocused = useRef(false);
  const onChangeRef = useRef(onChange);
  const onCloseRef = useRef(onClose);
  onChangeRef.current = onChange;
  onCloseRef.current = onClose;

  useEffect(() => {
    if (open) {
      setPresent(true);
      setShown(true);
      return;
    }
    setShown(false);
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const timer = window.setTimeout(() => setPresent(false), reduce ? 0 : 180);
    return () => window.clearTimeout(timer);
  }, [open]);

  useEffect(() => {
    if (!hexFocused.current) setHexDraft(color.hex.toUpperCase());
  }, [color.hex]);

  useEffect(() => {
    if (!present) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onCloseRef.current();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [present]);

  const oklch = rgbToOklch(color.rgb.r, color.rgb.g, color.rgb.b);
  const shades = generateShades(color, globalConfig);
  const showSiblings = (siblings?.length ?? 0) > 1;

  const commitHex = (raw: string) => {
    const next = raw.trim().toUpperCase();
    setHexDraft(next);
    const withHash = next.startsWith('#') ? next : `#${next}`;
    if (/^#[0-9A-F]{6}$/.test(withHash)) onChangeRef.current(withHash);
  };

  if (!present) return null;

  return (
    <motion.aside
      role="dialog"
      aria-labelledby="refine-color-title"
      className="fixed top-14 right-0 bottom-0 z-30 flex w-[min(380px,calc(100vw-3rem))] flex-col border-l border-border bg-card text-foreground shadow-panel"
      {...slideMotion(reduce, !shown, { x: '100%' })}
    >
      <div className="flex shrink-0 items-center gap-2 border-b border-border px-4 py-3">
        <h2 id="refine-color-title" className="text-[15px] font-medium text-foreground">Refine color</h2>
        {showSiblings && (
          <div className="flex min-w-0 flex-1 gap-1 overflow-x-auto" role="group" aria-label="Color to refine">
            {siblings!.map((swatch, index) => (
              <button
                key={`${swatch.hex}-${index}`}
                type="button"
                aria-label={`Color ${index + 1}`}
                aria-pressed={index === colorIndex}
                onClick={() => onSelectColor?.(index)}
                className={`size-5 shrink-0 rounded-md outline-none ${selectedRingFocus} ${index === colorIndex ? selectedRing : ''}`}
                style={{ backgroundColor: swatch.hex }}
              />
            ))}
          </div>
        )}
        <button
          type="button"
          onClick={onClose}
          className="ml-auto grid size-8 shrink-0 place-items-center rounded-lg text-foreground hover:bg-accent"
          aria-label="Close"
        >
          <X className="size-4" strokeWidth={1.5} aria-hidden />
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 pb-24">
        <div className="flex h-12 overflow-hidden rounded-lg ring-1 ring-border" role="group" aria-label="Ramp steps">
          {shades.map((shade) => {
            const ink = shade.contrastWhite < 4.5 ? '#171717' : '#fafafa';
            return (
              <button
                key={shade.level}
                type="button"
                aria-pressed={!!shade.isInput}
                aria-label={`Step ${shade.level}`}
                onClick={() => onChangeRef.current(shade.hex)}
                className={`relative min-w-0 flex-1 outline-none ${selectedRingFocus} ${shade.isInput ? selectedRing : ''}`}
                style={{ backgroundColor: shade.hex }}
              >
                <span className="block truncate px-0.5 font-mono text-[9px] leading-none" style={{ color: ink }}>
                  {shade.level}
                </span>
              </button>
            );
          })}
        </div>

        <div className="mt-5 flex justify-center">
          <OklchWheel
            lightness={oklch.l}
            chroma={oklch.c}
            hue={oklch.h}
            onChange={(l, c, h) => onChangeRef.current(hexFromOklch(l, c, h))}
          />
        </div>

        <LightnessStrip
          lightness={oklch.l}
          chroma={oklch.c}
          hue={oklch.h}
          onChange={(l) => onChangeRef.current(hexFromOklch(l, oklch.c, oklch.h))}
        />

        <div className="mt-4 flex items-center gap-2 rounded-lg border border-border bg-background px-2 py-1.5">
          <span className="size-7 shrink-0 rounded-md ring-1 ring-border" style={{ backgroundColor: color.hex }} />
          <input
            type="text"
            value={hexDraft}
            spellCheck={false}
            aria-label="Hex"
            onFocus={() => { hexFocused.current = true; }}
            onBlur={() => { hexFocused.current = false; setHexDraft(color.hex.toUpperCase()); }}
            onChange={(event) => commitHex(event.target.value)}
            className="min-w-0 flex-1 bg-transparent font-mono text-[13px] uppercase text-foreground focus:outline-none"
          />
        </div>

        <div className="mt-2">
          <ChannelRow
            label="Lightness"
            value={oklch.l}
            min={0}
            max={1}
            step={0.01}
            digits={2}
            onCommit={(value) => onChangeRef.current(hexFromOklch(value, oklch.c, oklch.h))}
          />
          <ChannelRow
            label="Chroma"
            value={oklch.c}
            min={0}
            max={0.4}
            step={0.001}
            digits={3}
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
            onCommit={(value) => onChangeRef.current(hexFromOklch(oklch.l, oklch.c, value))}
          />
        </div>
      </div>
    </motion.aside>
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
  onCommit: (value: number) => void;
}> = ({ label, value, min, max, step, digits, suffix, onCommit }) => {
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
    <label className="flex h-8 items-center justify-between gap-3 border-b border-border">
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
  );
};

const OklchWheel: React.FC<{
  lightness: number;
  chroma: number;
  hue: number;
  onChange: (l: number, c: number, h: number) => void;
}> = ({ lightness, chroma, hue, onChange }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  const radius = WHEEL / 2;
  const maxC = Math.max(maxOklchChroma(lightness, hue), 0);
  const reach = maxC > 0.0001 ? clamp(chroma / maxC, 0, 1) : 0;
  const rad = ((hue - 90) * Math.PI) / 180;
  const thumbX = radius + Math.cos(rad) * reach * radius;
  const thumbY = radius + Math.sin(rad) * reach * radius;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = WHEEL * dpr;
    canvas.height = WHEEL * dpr;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, WHEEL, WHEEL);
    ctx.beginPath();
    ctx.arc(radius, radius, radius - 0.5, 0, Math.PI * 2);
    ctx.clip();
    const neutral = oklchToRgb(lightness, 0, 0);
    ctx.fillStyle = rgbToHex(neutral.r, neutral.g, neutral.b);
    ctx.fillRect(0, 0, WHEEL, WHEEL);
    const limits = new Float64Array(360);
    for (let h = 0; h < 360; h++) limits[h] = maxOklchChroma(lightness, h);
    for (let h = 0; h < 360; h++) {
      const start = ((h - 90.6) * Math.PI) / 180;
      const end = ((h - 89.4) * Math.PI) / 180;
      ctx.beginPath();
      ctx.moveTo(radius, radius);
      ctx.arc(radius, radius, radius, start, end);
      ctx.closePath();
      const grad = ctx.createRadialGradient(radius, radius, 0, radius, radius, radius);
      const limit = limits[h];
      for (let stop = 0; stop <= 6; stop++) {
        const t = stop / 6;
        const rgb = oklchToRgb(lightness, limit * t, h);
        grad.addColorStop(t, rgbToHex(rgb.r, rgb.g, rgb.b));
      }
      ctx.fillStyle = grad;
      ctx.fill();
    }
  }, [lightness, radius]);

  const pick = (clientX: number, clientY: number, target: HTMLElement) => {
    const rect = target.getBoundingClientRect();
    const cx = rect.width / 2;
    const cy = rect.height / 2;
    let dx = clientX - rect.left - cx;
    let dy = clientY - rect.top - cy;
    const dist = Math.hypot(dx, dy);
    const limit = Math.min(cx, cy);
    if (dist > limit && dist > 0) {
      dx *= limit / dist;
      dy *= limit / dist;
    }
    let nextHue = (Math.atan2(dy, dx) * 180) / Math.PI + 90;
    if (nextHue < 0) nextHue += 360;
    if (nextHue >= 360) nextHue -= 360;
    const t = Math.min(1, Math.hypot(dx, dy) / limit);
    const nextC = t * maxOklchChroma(lightness, nextHue);
    onChangeRef.current(lightness, nextC, nextHue);
  };

  return (
    <div
      className="relative cursor-crosshair rounded-full"
      style={{ width: WHEEL, height: WHEEL, touchAction: 'none' }}
      onPointerDown={(event) => {
        event.currentTarget.setPointerCapture(event.pointerId);
        pick(event.clientX, event.clientY, event.currentTarget);
      }}
      onPointerMove={(event) => {
        if (!event.currentTarget.hasPointerCapture(event.pointerId)) return;
        pick(event.clientX, event.clientY, event.currentTarget);
      }}
      aria-label="Hue and chroma"
      role="slider"
      aria-valuemin={0}
      aria-valuemax={360}
      aria-valuenow={Math.round(hue)}
      aria-valuetext={`Hue ${hue.toFixed(1)} degrees, chroma ${chroma.toFixed(3)}`}
    >
      <canvas ref={canvasRef} className="h-full w-full rounded-full" />
      <span
        className="pointer-events-none absolute size-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white"
        style={{ left: thumbX, top: thumbY, ...thumbStyle(`oklch(${lightness} ${chroma} ${hue})`) }}
      />
    </div>
  );
};

const LightnessStrip: React.FC<{
  lightness: number;
  chroma: number;
  hue: number;
  onChange: (lightness: number) => void;
}> = ({ lightness, chroma, hue, onChange }) => {
  const ref = useRef<HTMLDivElement>(null);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  const stops = Array.from({ length: 17 }, (_, index) => {
    const l = index / 16;
    const rgb = oklchToRgb(l, Math.min(chroma, maxOklchChroma(l, hue)), hue);
    return rgbToHex(rgb.r, rgb.g, rgb.b);
  });

  const pick = (clientX: number) => {
    const rect = ref.current?.getBoundingClientRect();
    if (!rect || rect.width === 0) return;
    const t = clamp((clientX - rect.left) / rect.width, 0, 1);
    onChangeRef.current(t);
  };

  return (
    <div
      ref={ref}
      className="relative mt-4 h-8 cursor-pointer rounded-lg ring-1 ring-border"
      style={{ background: `linear-gradient(to right, ${stops.join(', ')})`, touchAction: 'none' }}
      onPointerDown={(event) => {
        event.currentTarget.setPointerCapture(event.pointerId);
        pick(event.clientX);
      }}
      onPointerMove={(event) => {
        if (!event.currentTarget.hasPointerCapture(event.pointerId)) return;
        pick(event.clientX);
      }}
      role="slider"
      aria-label="Lightness"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(lightness * 100)}
      aria-valuetext={`Lightness ${lightness.toFixed(2)}`}
    >
      <span
        className="pointer-events-none absolute top-1/2 size-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white"
        style={{ left: `${lightness * 100}%`, ...thumbStyle(stops[Math.round(lightness * 16)] ?? colorHex(lightness, chroma, hue)) }}
      />
    </div>
  );
};

export default RefineDrawer;
