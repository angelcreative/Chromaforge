import React, { useEffect, useRef } from 'react';
import { ColorData } from '../types';
import { hexToRgb, maxOklchChroma, rgbToOklch } from '../utils/colorUtils';
import { clamp, hexFromOklch, paintOklchWheel } from './OklchControls';

const SIZE = 192;
const HIT = 16;

interface Node {
  x: number;
  y: number;
  l: number;
  hex: string;
}

/** Position on the wheel: hue is the angle (0° up), chroma relative to the gamut is the radius. */
const nodeFor = (color: ColorData, radius: number): Node => {
  const rgb = hexToRgb(color.hex);
  const { l, c, h } = rgbToOklch(rgb.r, rgb.g, rgb.b);
  const maxC = maxOklchChroma(l, h);
  const reach = maxC > 0.0001 ? clamp(c / maxC, 0, 1) : 0;
  const rad = ((h - 90) * Math.PI) / 180;
  return { x: radius + Math.cos(rad) * reach * radius, y: radius + Math.sin(rad) * reach * radius, l, hex: color.hex };
};

interface HarmonyWheelProps {
  colors: ColorData[];
  selected: number;
  /** Draw the harmony shape between the nodes. */
  linked: boolean;
  onSelect: (index: number) => void;
  onMove: (index: number, hex: string) => void;
}

/**
 * Every palette color as a node on one OKLCH hue/chroma disc, painted at the
 * selected color's lightness. Drag a node to change its hue and chroma.
 */
const HarmonyWheel: React.FC<HarmonyWheelProps> = ({ colors, selected, linked, onSelect, onMove }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const dragging = useRef<number | null>(null);
  const radius = SIZE / 2;
  const nodes = colors.map((color) => nodeFor(color, radius));
  const lightness = nodes[selected]?.l ?? nodes[0]?.l ?? 0.6;
  const paintL = Math.round(lightness * 50) / 50;
  const selectedRgb = hexToRgb(nodes[selected]?.hex ?? '#808080');
  const selectedHue = Math.round(rgbToOklch(selectedRgb.r, selectedRgb.g, selectedRgb.b).h);

  useEffect(() => {
    if (canvasRef.current) paintOklchWheel(canvasRef.current, SIZE, paintL);
  }, [paintL]);

  const pointAt = (event: React.PointerEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    return { x: event.clientX - rect.left, y: event.clientY - rect.top };
  };

  const move = (index: number, x: number, y: number) => {
    const node = nodes[index];
    if (!node) return;
    let dx = x - radius;
    let dy = y - radius;
    const dist = Math.hypot(dx, dy);
    if (dist > radius) {
      dx *= radius / dist;
      dy *= radius / dist;
    }
    let hue = (Math.atan2(dy, dx) * 180) / Math.PI + 90;
    if (hue < 0) hue += 360;
    const reach = Math.min(1, Math.hypot(dx, dy) / radius);
    onMove(index, hexFromOklch(node.l, reach * maxOklchChroma(node.l, hue), hue));
  };

  const onKeyDown = (event: React.KeyboardEvent) => {
    const node = nodes[selected];
    if (!node) return;
    const rgb = hexToRgb(node.hex);
    const { l, c, h } = rgbToOklch(rgb.r, rgb.g, rgb.b);
    const step = event.shiftKey ? 10 : 1;
    const maxC = maxOklchChroma(l, h);
    const next = {
      ArrowLeft: [l, c, h - step],
      ArrowRight: [l, c, h + step],
      ArrowUp: [l, Math.min(maxC, c + maxC * 0.02 * step), h],
      ArrowDown: [l, Math.max(0, c - maxC * 0.02 * step), h],
    }[event.key];
    if (!next) return;
    event.preventDefault();
    onMove(selected, hexFromOklch(next[0], next[1], next[2]));
  };

  const shape = linked && nodes.length > 2 ? nodes.map((node) => `${node.x},${node.y}`).join(' ') : '';

  return (
    <div
      className="relative mx-auto cursor-crosshair rounded-full outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--card)]"
      style={{ width: SIZE, height: SIZE, touchAction: 'none' }}
      tabIndex={0}
      role="slider"
      aria-label="Harmony wheel. Arrows change the selected color's hue and chroma."
      aria-valuemin={0}
      aria-valuemax={360}
      aria-valuenow={selectedHue}
      onKeyDown={onKeyDown}
      onPointerDown={(event) => {
        const { x, y } = pointAt(event);
        let hit = -1;
        let best = HIT;
        nodes.forEach((node, index) => {
          const d = Math.hypot(node.x - x, node.y - y);
          if (d <= best) { best = d; hit = index; }
        });
        const index = hit >= 0 ? hit : selected;
        if (index !== selected) onSelect(index);
        dragging.current = index;
        event.currentTarget.setPointerCapture(event.pointerId);
        if (hit < 0) move(index, x, y);
      }}
      onPointerMove={(event) => {
        if (dragging.current === null || !event.currentTarget.hasPointerCapture(event.pointerId)) return;
        const { x, y } = pointAt(event);
        move(dragging.current, x, y);
      }}
      onPointerUp={() => { dragging.current = null; }}
      onPointerCancel={() => { dragging.current = null; }}
    >
      <canvas ref={canvasRef} className="h-full w-full rounded-full" />
      <svg className="pointer-events-none absolute inset-0" width={SIZE} height={SIZE} aria-hidden>
        {nodes.map((node, index) => (
          <line
            key={`spoke-${index}`}
            x1={radius}
            y1={radius}
            x2={node.x}
            y2={node.y}
            stroke="white"
            strokeOpacity={index === 0 && linked ? 0.9 : 0.5}
            strokeWidth={1}
          />
        ))}
        {shape && <polygon points={shape} fill="none" stroke="white" strokeOpacity={0.5} strokeWidth={1} strokeDasharray="3 3" />}
        <circle cx={radius} cy={radius} r={2} fill="white" fillOpacity={0.7} />
      </svg>
      {nodes.map((node, index) => {
        const seed = index === 0 && linked;
        const active = index === selected;
        const size = seed ? 22 : 16;
        return (
          <span
            key={`node-${index}`}
            className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 rounded-full border-2"
            style={{
              left: node.x,
              top: node.y,
              width: size,
              height: size,
              backgroundColor: node.hex,
              borderColor: active ? 'white' : 'rgba(255,255,255,0.6)',
              boxShadow: active ? '0 0 0 1px rgba(0,0,0,0.8), 0 0 0 4px rgba(255,255,255,0.25)' : '0 0 0 1px rgba(0,0,0,0.6)',
            }}
          />
        );
      })}
    </div>
  );
};

export default HarmonyWheel;
