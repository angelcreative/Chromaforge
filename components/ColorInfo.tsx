import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ColorRGB } from '../types';
import { getContrastRatio, getLuminance, rgbToCmyk, rgbToOklch } from '../utils/colorUtils';

export interface ColorStepRef {
  token: string;
  variable: string;
}

interface ColorInfoProps {
  hex: string;
  rgb: ColorRGB;
  step?: ColorStepRef;
  printOn: boolean;
  anchor: HTMLElement;
  closing: boolean;
  onCopy: (text: string) => void;
  onRequestClose: () => void;
  onClosed: () => void;
}

const AA_RATIO = 4.5;

export const stepRef = (name: string, level: number): ColorStepRef => {
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'color';
  return { token: `${slug}-${level}`, variable: `--color-${slug}-${level}` };
};

const formatRatio = (ratio: number) => `${ratio.toFixed(2)}:1`;

const grade = (ratio: number) => (ratio >= AA_RATIO ? 'AA' : 'fail');

const place = (anchor: DOMRect, width: number, height: number) => {
  const gap = 8;
  const margin = 8;
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  let left = anchor.left + anchor.width / 2 - width / 2;
  let top = anchor.bottom + gap;
  let originY: 'top' | 'bottom' = 'top';
  if (top + height > viewportHeight - margin && anchor.top - gap - height >= margin) {
    top = anchor.top - gap - height;
    originY = 'bottom';
  }
  left = Math.min(Math.max(left, margin), Math.max(margin, viewportWidth - margin - width));
  top = Math.min(Math.max(top, margin), Math.max(margin, viewportHeight - margin - height));
  const mid = anchor.left + anchor.width / 2;
  const originX = Math.min(Math.max(mid - left, 8), Math.max(8, width - 8));
  return { top, left, transformOrigin: `${originX}px ${originY}` };
};

const Fact: React.FC<{ label: string; value: string; note?: string }> = ({ label, value, note }) => (
  <div className="flex items-baseline justify-between gap-3 py-1">
    <span className="text-[13px] text-muted-foreground">{label}</span>
    <span className="text-right font-mono text-[13px] text-foreground">
      {value}
      {note ? <span className="ml-2 font-sans text-[13px] text-muted-foreground">{note}</span> : null}
    </span>
  </div>
);

const ColorInfo: React.FC<ColorInfoProps> = ({ hex, rgb, step, printOn, anchor, closing, onCopy, onRequestClose, onClosed }) => {
  const panelRef = useRef<HTMLDivElement>(null);
  const onClosedRef = useRef(onClosed);
  onClosedRef.current = onClosed;
  const onRequestCloseRef = useRef(onRequestClose);
  onRequestCloseRef.current = onRequestClose;
  const finished = useRef(false);
  const [box, setBox] = useState<{ top: number; left: number; transformOrigin: string } | null>(null);

  const oklch = rgbToOklch(rgb.r, rgb.g, rgb.b);
  const luminance = getLuminance(rgb.r, rgb.g, rgb.b);
  const onWhite = getContrastRatio(luminance, 1);
  const onBlack = getContrastRatio(luminance, 0);
  const cmyk = printOn ? rgbToCmyk(rgb.r, rgb.g, rgb.b) : null;
  const rgbText = `${rgb.r}, ${rgb.g}, ${rgb.b}`;

  const finish = () => {
    if (finished.current) return;
    finished.current = true;
    onClosedRef.current();
  };

  useLayoutEffect(() => {
    const panel = panelRef.current;
    if (!panel) return;
    const measure = () => {
      const rect = anchor.getBoundingClientRect();
      const width = panel.offsetWidth || 280;
      const height = panel.offsetHeight || panel.scrollHeight;
      setBox(place(rect, width, height));
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(panel);
    window.addEventListener('resize', measure);
    window.addEventListener('scroll', measure, true);
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', measure);
      window.removeEventListener('scroll', measure, true);
    };
  }, [anchor, printOn, step?.variable, hex]);

  useEffect(() => {
    const onPointer = (event: PointerEvent) => {
      const target = event.target as Node | null;
      if (!target) return;
      if (panelRef.current?.contains(target)) return;
      if (target instanceof Element && target.closest('[data-color-info-trigger]')) return;
      onRequestCloseRef.current();
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onRequestCloseRef.current();
    };
    document.addEventListener('pointerdown', onPointer);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onPointer);
      document.removeEventListener('keydown', onKey);
    };
  }, []);

  useEffect(() => {
    if (!closing) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      finish();
      return;
    }
    const timer = window.setTimeout(finish, 160);
    return () => window.clearTimeout(timer);
  }, [closing]);

  return createPortal(
    <div
      ref={panelRef}
      role="dialog"
      aria-label="Color"
      className={`color-info-pop fixed z-[70] rounded-xl bg-popover p-3 text-popover-foreground shadow-panel ring-1 ring-border ${closing ? 'is-leaving' : ''}`}
      style={box ? { top: box.top, left: box.left, transformOrigin: box.transformOrigin } : { top: -9999, left: 0 }}
      onAnimationEnd={(event) => {
        if (event.target === event.currentTarget && closing) finish();
      }}
    >
      <div className="h-12 w-full rounded-lg ring-1 ring-border" style={{ backgroundColor: hex }} />

      <button
        type="button"
        onClick={() => onCopy(hex)}
        className="mt-2 w-full rounded-md px-1 py-0.5 text-left font-mono text-[15px] text-foreground hover:bg-accent"
      >
        {hex}
      </button>

      {step ? (
        <button
          type="button"
          onClick={() => onCopy(step.variable)}
          className="mt-1 w-full rounded-md px-1 py-1 text-left hover:bg-accent"
        >
          <span className="block font-mono text-[13px] text-foreground">{step.token}</span>
          <span className="mt-0.5 block break-all font-mono text-[12px] text-muted-foreground">{step.variable}</span>
        </button>
      ) : null}

      <div className="mt-2">
        <Fact label="Lightness" value={oklch.l.toFixed(2)} />
        <Fact label="Chroma" value={oklch.c.toFixed(2)} />
        <Fact label="Hue" value={`${Math.round(oklch.h)}°`} />
      </div>

      <div className="mt-1 border-t border-border pt-1">
        <Fact label="Contrast on white" value={formatRatio(onWhite)} note={grade(onWhite)} />
        <Fact label="Contrast on black" value={formatRatio(onBlack)} note={grade(onBlack)} />
      </div>

      <button
        type="button"
        onClick={() => onCopy(rgbText)}
        className="mt-1 flex w-full items-baseline justify-between gap-3 rounded-md px-1 py-1 text-left hover:bg-accent"
      >
        <span className="text-[12px] text-muted-foreground">RGB</span>
        <span className="font-mono text-[12px] text-muted-foreground">{rgbText}</span>
      </button>

      {cmyk ? (
        <div className="flex items-baseline justify-between gap-3 px-1 py-1">
          <span className="text-[12px] text-muted-foreground">CMYK</span>
          <span className="font-mono text-[12px] text-muted-foreground">{cmyk.c}%, {cmyk.m}%, {cmyk.y}%, {cmyk.k}%</span>
        </div>
      ) : null}
    </div>,
    document.body,
  );
};

export default ColorInfo;
