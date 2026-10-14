import React, { useEffect, useRef, useState } from 'react';
import { FloatingDrawer } from './FloatingDrawer';
import { slideMotion, useReduced } from './uiMotion';
import { ColorData, GlobalCurveConfig } from '../types';
import { generateShades, maxOklchChroma, oklchToRgb, rgbToHex, rgbToOklch } from '../utils/colorUtils';
import { OklchEditor, clamp, hexFromOklch, paintOklchWheel, thumbStyle } from './OklchControls';

const WHEEL = 232;
// The hue/chroma wheel is hidden for now; the channel sliders cover refining.
const SHOW_WHEEL = false;

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

  if (!present) return null;

  return (
    <FloatingDrawer
      title="Refine color"
      titleId="refine-color-title"
      onClose={onClose}
      header={showSiblings ? (
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
      ) : null}
      {...slideMotion(reduce, !shown, { x: '100%' })}
    >
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

        {SHOW_WHEEL && (
          <div className="mt-5 flex justify-center">
            <OklchWheel
              lightness={oklch.l}
              chroma={oklch.c}
              hue={oklch.h}
              onChange={(l, c, h) => onChangeRef.current(hexFromOklch(l, c, h))}
            />
          </div>
        )}

        <OklchEditor className="mt-4" hex={color.hex} onChange={(hex) => onChangeRef.current(hex)} />
      </div>
    </FloatingDrawer>
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
    if (canvasRef.current) paintOklchWheel(canvasRef.current, WHEEL, lightness);
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

export default RefineDrawer;
