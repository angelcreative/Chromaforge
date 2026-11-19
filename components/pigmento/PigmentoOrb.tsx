import React, { useEffect, useRef, useState } from 'react';
import './pigmentoOrb.css';

/** Apple-like spectrum used until there is a palette to take colours from. */
const SPECTRUM = ['#ff4d8d', '#ffb340', '#3d8bff', '#9b5cff'];

export interface PigmentoOrbProps {
  className?: string;
  /** Palette colours for the orb; falls back to a spectrum with fewer than two. */
  colors?: string[];
  /** Thinking: colours speed up, eyes look up. */
  busy?: boolean;
  /** Follow the pointer with the eyes (the launcher does; small marks don't). */
  track?: boolean;
  /** Fixed gaze in -1..1 (e.g. towards an open panel); overrides wandering. */
  gaze?: { x: number; y: number } | null;
}

const clamp = (v: number) => Math.max(-1, Math.min(1, v));
const rand = (min: number, max: number) => min + Math.random() * (max - min);

/**
 * Pigmento: a glowing blob of colour in a glass squircle, with two eyes that
 * wander, blink and follow the pointer. Decorative: the control around it
 * carries the label.
 */
const PigmentoOrb: React.FC<PigmentoOrbProps> = ({ className = 'size-16', colors, busy = false, track = false, gaze = null }) => {
  const ref = useRef<HTMLSpanElement>(null);
  const [look, setLook] = useState({ x: 0, y: 0 });
  const [blink, setBlink] = useState(false);
  const pointerAt = useRef(0);
  const reduce = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

  const source = (colors || []).filter(Boolean);
  const palette = source.length >= 2 ? source.slice(0, 4) : SPECTRUM;
  const [core, c1, c2, c3] = Array.from({ length: 4 }, (_, i) => palette[i % palette.length]);
  // Lifted towards white a little so dark palette colours still glow on the glass.
  const lit = (color: string) => `color-mix(in oklab, ${color} 82%, white)`;
  const blob = (color: string) => ({ background: `radial-gradient(circle, ${lit(color)} 0%, ${lit(color)} 38%, transparent 72%)` });

  // Busy ramps the animations' playbackRate over 700ms (Titan's AiOrb technique),
  // so the orb speeds up and settles smoothly instead of jumping between speeds.
  const rate = useRef(1);
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof el.getAnimations !== 'function') return;
    const target = busy ? 5 : 1;
    const from = rate.current;
    const start = performance.now();
    let frame = 0;
    const step = (now: number) => {
      const progress = Math.min(1, (now - start) / 700);
      rate.current = from + (target - from) * (1 - (1 - progress) ** 3);
      el.querySelectorAll('.po-orb, .po-spin, .po-blob').forEach(node => {
        (node as HTMLElement).getAnimations().forEach(animation => { animation.playbackRate = rate.current; });
      });
      if (progress < 1) frame = requestAnimationFrame(step);
    };
    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [busy]);

  // Blink every few seconds, sometimes twice.
  useEffect(() => {
    if (reduce) return;
    let timer = 0;
    const schedule = () => {
      timer = window.setTimeout(() => {
        setBlink(true);
        window.setTimeout(() => {
          setBlink(false);
          if (Math.random() < 0.2) window.setTimeout(() => { setBlink(true); window.setTimeout(() => setBlink(false), 110); }, 160);
        }, 120);
        schedule();
      }, rand(2600, 6000));
    };
    schedule();
    return () => window.clearTimeout(timer);
  }, [reduce]);

  // Wander: glance somewhere, sometimes back to the middle. Busy looks up and around.
  useEffect(() => {
    if (reduce || gaze) return;
    let timer = 0;
    const tick = () => {
      if (busy) {
        setLook(prev => ({ x: prev.x > 0 ? -0.55 : 0.55, y: -0.75 }));
        timer = window.setTimeout(tick, 650);
        return;
      }
      if (Date.now() - pointerAt.current > 2500) {
        setLook(Math.random() < 0.35 ? { x: 0, y: 0 } : { x: rand(-0.9, 0.9), y: rand(-0.6, 0.6) });
      }
      timer = window.setTimeout(tick, rand(1400, 3800));
    };
    tick();
    return () => window.clearTimeout(timer);
  }, [busy, gaze, reduce]);

  // Follow the pointer while it moves.
  useEffect(() => {
    if (!track || reduce || gaze) return;
    let frame = 0;
    const onMove = (event: PointerEvent) => {
      if (busy || frame) return;
      frame = window.requestAnimationFrame(() => {
        frame = 0;
        const rect = ref.current?.getBoundingClientRect();
        if (!rect) return;
        const dx = event.clientX - (rect.left + rect.width / 2);
        const dy = event.clientY - (rect.top + rect.height / 2);
        pointerAt.current = Date.now();
        setLook({ x: clamp(dx / 320), y: clamp(dy / 320) });
      });
    };
    window.addEventListener('pointermove', onMove, { passive: true });
    return () => { window.removeEventListener('pointermove', onMove); window.cancelAnimationFrame(frame); };
  }, [track, busy, gaze, reduce]);

  const eye = gaze ?? look;
  return (
    <span ref={ref} className={`po ${className}`} data-busy={busy} data-blink={blink} aria-hidden>
      <span className="po-glass">
        <span className="po-orb">
          <span className="po-spin">
            <span className="po-blob core" style={{ background: `radial-gradient(circle, ${lit(core)} 0%, color-mix(in srgb, ${lit(core)} 75%, transparent) 52%, transparent 78%)` }} />
            <span className="po-blob b1" style={blob(c1)} />
            <span className="po-blob b2" style={blob(c2)} />
            <span className="po-blob b3" style={blob(c3)} />
          </span>
          <span className="po-glow" />
        </span>
        <span className="po-shine" />
        <span className="po-face">
          <span className="po-eyes" style={{ transform: `translate(${eye.x * 10}cqw, ${eye.y * 8}cqw)` }}><i /><i /></span>
        </span>
      </span>
    </span>
  );
};

export default PigmentoOrb;
