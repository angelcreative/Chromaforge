import React, { useEffect, useRef } from 'react';

const GAP = 24;
const REST_RADIUS = 1.15;
const PEAK_RADIUS = 1.7;
const REACH = 156;
const SHIFT = 9;
const BASE_ALPHA = 0.22;
const PEAK_ALPHA = 0.72;
const SETTLE_MS = 90;

type Dot = {
  x: number;
  y: number;
  ox: number;
  oy: number;
  radius: number;
  alpha: number;
};

const smooth = (t: number) => t * t * (3 - 2 * t);

const DotGrid: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext('2d');
    if (!context) return;

    const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    let reduced = motion.matches;
    let dots: Dot[] = [];
    let width = 0;
    let height = 0;
    let dpr = 1;
    let color = '#171717';
    let pointer: { x: number; y: number } | null = null;
    let frame = 0;
    let running = false;
    let last = 0;

    const readColor = () => {
      const next = getComputedStyle(document.documentElement).getPropertyValue('--foreground').trim();
      color = next || '#171717';
    };

    const build = () => {
      const rect = canvas.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      if (width < 1 || height < 1) return;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      const cols = Math.ceil(width / GAP) + 1;
      const rows = Math.ceil(height / GAP) + 1;
      const originX = (width - (cols - 1) * GAP) / 2;
      const originY = (height - (rows - 1) * GAP) / 2;
      const next: Dot[] = [];
      for (let row = 0; row < rows; row += 1) {
        for (let col = 0; col < cols; col += 1) {
          next.push({
            x: originX + col * GAP,
            y: originY + row * GAP,
            ox: 0,
            oy: 0,
            radius: REST_RADIUS,
            alpha: BASE_ALPHA,
          });
        }
      }
      dots = next;
    };

    const targetFor = (dot: Dot) => {
      if (reduced || !pointer) {
        return { x: 0, y: 0, radius: REST_RADIUS, alpha: BASE_ALPHA };
      }
      const dx = dot.x - pointer.x;
      const dy = dot.y - pointer.y;
      const dist = Math.hypot(dx, dy);
      if (dist >= REACH) {
        return { x: 0, y: 0, radius: REST_RADIUS, alpha: BASE_ALPHA };
      }
      const ease = smooth(1 - dist / REACH);
      const push = dist < 1 ? 0 : (SHIFT * ease) / dist;
      return {
        x: dx * push,
        y: dy * push,
        radius: REST_RADIUS + (PEAK_RADIUS - REST_RADIUS) * ease,
        alpha: BASE_ALPHA + (PEAK_ALPHA - BASE_ALPHA) * ease,
      };
    };

    const draw = () => {
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
      context.clearRect(0, 0, width, height);
      context.fillStyle = color;
      for (const dot of dots) {
        context.globalAlpha = dot.alpha;
        context.beginPath();
        context.arc(dot.x + dot.ox, dot.y + dot.oy, dot.radius, 0, Math.PI * 2);
        context.fill();
      }
      context.globalAlpha = 1;
    };

    const rest = () => {
      for (const dot of dots) {
        dot.ox = 0;
        dot.oy = 0;
        dot.radius = REST_RADIUS;
        dot.alpha = BASE_ALPHA;
      }
      draw();
    };

    const step = (now: number) => {
      const delta = last ? Math.min(34, now - last) : 16;
      last = now;
      const blend = reduced ? 1 : 1 - Math.exp(-delta / SETTLE_MS);
      let moving = false;
      for (const dot of dots) {
        const target = targetFor(dot);
        dot.ox += (target.x - dot.ox) * blend;
        dot.oy += (target.y - dot.oy) * blend;
        dot.radius += (target.radius - dot.radius) * blend;
        dot.alpha += (target.alpha - dot.alpha) * blend;
        if (Math.abs(target.x - dot.ox) < 0.05) dot.ox = target.x;
        if (Math.abs(target.y - dot.oy) < 0.05) dot.oy = target.y;
        if (Math.abs(target.radius - dot.radius) < 0.02) dot.radius = target.radius;
        if (Math.abs(target.alpha - dot.alpha) < 0.008) dot.alpha = target.alpha;
        if (
          dot.ox !== target.x
          || dot.oy !== target.y
          || dot.radius !== target.radius
          || dot.alpha !== target.alpha
        ) {
          moving = true;
        }
      }
      draw();
      if (moving && !reduced) {
        frame = window.requestAnimationFrame(step);
      } else {
        running = false;
      }
    };

    const start = () => {
      if (reduced || running) return;
      running = true;
      last = 0;
      frame = window.requestAnimationFrame(step);
    };

    const placePointer = (event: PointerEvent) => {
      if (reduced) return;
      const rect = canvas.getBoundingClientRect();
      pointer = { x: event.clientX - rect.left, y: event.clientY - rect.top };
      start();
    };

    const clearPointer = () => {
      if (!pointer) return;
      pointer = null;
      start();
    };

    const onLeave = (event: PointerEvent) => {
      if (event.relatedTarget) return;
      clearPointer();
    };

    const onMotion = () => {
      reduced = motion.matches;
      cancelAnimationFrame(frame);
      running = false;
      pointer = null;
      rest();
    };

    const onResize = () => {
      build();
      if (reduced) rest();
      else {
        draw();
        if (pointer) start();
      }
    };

    readColor();
    build();
    rest();

    const resizeObserver = new ResizeObserver(onResize);
    resizeObserver.observe(canvas);
    const themeObserver = new MutationObserver(() => {
      readColor();
      draw();
    });
    themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme', 'class', 'style'],
    });
    motion.addEventListener('change', onMotion);
    window.addEventListener('pointermove', placePointer, { passive: true });
    window.addEventListener('blur', clearPointer);
    document.documentElement.addEventListener('pointerleave', onLeave);

    return () => {
      cancelAnimationFrame(frame);
      resizeObserver.disconnect();
      themeObserver.disconnect();
      motion.removeEventListener('change', onMotion);
      window.removeEventListener('pointermove', placePointer);
      window.removeEventListener('blur', clearPointer);
      document.documentElement.removeEventListener('pointerleave', onLeave);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 -z-10 h-full w-full"
    />
  );
};

export default DotGrid;
