import React, { useState, useMemo, useEffect } from 'react';
import { Check, X } from 'lucide-react';
import { ColorData, ScaleConfiguration } from '../types';
import { generateShades, createColorData, hexToHsl, rgbToOklch } from '../utils/colorUtils';

interface ScaleEditorModalProps {
  color: ColorData;
  onClose: () => void;
  onSave: (colorHex: string, newConfig: ScaleConfiguration) => void;
  usageCount?: number;
  limit?: number;
  isPremium?: boolean;
}

const ScaleEditorModal: React.FC<ScaleEditorModalProps> = ({ color, onClose, onSave, usageCount, limit, isPremium }) => {
  const [config, setConfig] = useState<ScaleConfiguration>(color.scaleConfig || {
    hueShift: 0,
    saturationBoost: 0,
    lightnessEase: 'linear',
    useOkLCH: true,
    mode: 'curves'
  });

  const [isZoomed, setIsZoomed] = useState(true);
  const [activeShade, setActiveShade] = useState<number | null>(null);

  useEffect(() => {
      if (config.mode === 'linear' && !config.linearConfig) {
          const oklch = rgbToOklch(color.rgb.r, color.rgb.g, color.rgb.b);
          setConfig(prev => ({
              ...prev,
              linearConfig: {
                  start: { l: 0.98, c: 0.02, h: oklch.h },
                  end: { l: 0.05, c: oklch.c, h: oklch.h },
                  steps: 11
              }
          }));
      }
  }, [config.mode, color.rgb]);

  const previewColor = useMemo(() => createColorData(color.hex, config), [color.hex, config]);
  const shades = useMemo(() => generateShades(previewColor), [previewColor]);

  const activeShadeData = useMemo(() =>
    shades.find(s => s.level === activeShade),
  [shades, activeShade]);

  const activeHsl = useMemo(
    () => (activeShadeData ? hexToHsl(activeShadeData.hex) : null),
    [activeShadeData]
  );

  const handleSave = () => {
    onSave(color.hex, config);
    onClose();
  };

  const size = 320;
  const center = size / 2;
  const radius = 120;

  const getPolarCoords = (h: number, s: number) => {
      const angle = (h - 90) * (Math.PI / 180);
      const r = (s / 100) * radius;
      return {
          x: center + r * Math.cos(angle),
          y: center + r * Math.sin(angle)
      };
  };

  const { points, viewBox } = useMemo(() => {
      let minX = size, maxX = 0, minY = size, maxY = 0;

      const pts = shades.map(shade => {
          const hsl = hexToHsl(shade.hex);
          const p = getPolarCoords(hsl.h, hsl.s);

          if (p.x < minX) minX = p.x;
          if (p.x > maxX) maxX = p.x;
          if (p.y < minY) minY = p.y;
          if (p.y > maxY) maxY = p.y;

          return { ...p, hex: shade.hex, level: shade.level, hsl };
      });

      if (!isZoomed) {
          return { points: pts, viewBox: `0 0 ${size} ${size}` };
      }

      const padding = 40;
      const width = Math.max(maxX - minX, 20);
      const height = Math.max(maxY - minY, 20);
      const zoomSize = Math.max(width, height) + (padding * 2);
      const finalSize = Math.min(zoomSize, size);

      const midX = (minX + maxX) / 2;
      const midY = (minY + maxY) / 2;

      const vbX = midX - (finalSize / 2);
      const vbY = midY - (finalSize / 2);

      return {
          points: pts,
          viewBox: `${vbX} ${vbY} ${finalSize} ${finalSize}`
      };
  }, [shades, isZoomed]);

  const pathData = useMemo(() => {
      if (points.length === 0) return '';
      return points.map((p, i) =>
        (i === 0 ? 'M' : 'L') + ` ${p.x.toFixed(1)},${p.y.toFixed(1)}`
      ).join(' ');
  }, [points]);

  const curveMode = !config.mode || config.mode === 'curves';

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/70 sm:items-center sm:p-4">
      <div className="flex h-[100dvh] w-full max-w-5xl flex-col overflow-hidden bg-background sm:h-auto sm:max-h-[90vh] sm:rounded-2xl sm:border sm:border-border sm:shadow-2xl">
        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-border px-4 py-3">
          <div className="min-w-0">
            <h2 className="text-[15px] font-medium text-foreground">Edit scale</h2>
            <p className="truncate text-[13px] text-muted-foreground">{color.name}</p>
            {!isPremium && usageCount !== undefined && limit !== undefined && (
              <p className="text-[12px] text-muted-foreground">{usageCount} of {limit} edits</p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-10 shrink-0 items-center gap-1.5 rounded-lg border border-border bg-card px-3 text-[13px] text-foreground hover:bg-accent"
          >
            <X className="size-4" strokeWidth={1.5} aria-hidden />
            Close
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-4">
          <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
            <section>
              <h3 className="mb-2 text-[13px] text-muted-foreground">Ramp</h3>
              <div className="flex gap-1.5 overflow-x-auto pb-1">
                {shades.map((shade) => {
                  const selected = activeShade === shade.level;
                  return (
                    <button
                      key={shade.level}
                      type="button"
                      onClick={() => setActiveShade(shade.level)}
                      className="w-12 shrink-0 text-left"
                      aria-pressed={selected}
                    >
                      <span
                        className={`block h-14 rounded-md ring-2 ring-offset-2 ring-offset-background ${selected ? 'ring-foreground' : 'ring-transparent'}`}
                        style={{ backgroundColor: shade.hex }}
                      />
                      <span className="mt-1 block text-center font-mono text-[11px] text-muted-foreground">{shade.level}</span>
                    </button>
                  );
                })}
              </div>
              <div className="mt-3 rounded-xl border border-border bg-card p-3">
                {activeShadeData && activeHsl ? (
                  <div>
                    <p className="text-[13px] text-foreground">Step {activeShadeData.level}</p>
                    <p className="mt-1 font-mono text-sm text-foreground">{activeShadeData.hex}</p>
                    <p className="mt-1 text-[13px] text-muted-foreground">
                      Hue {activeHsl.h}°, saturation {activeHsl.s}%, lightness {activeHsl.l}%
                    </p>
                  </div>
                ) : (
                  <p className="text-[13px] text-muted-foreground">Tap a step to read that color.</p>
                )}
              </div>
            </section>

            <section>
              <div className="mb-2 flex items-center justify-between gap-3">
                <h3 className="text-[13px] text-muted-foreground">Hue and saturation path</h3>
                <button
                  type="button"
                  onClick={() => setIsZoomed(!isZoomed)}
                  className="h-8 rounded-lg border border-border bg-card px-2.5 text-[13px] text-foreground hover:bg-accent"
                >
                  {isZoomed ? 'Focused view' : 'Full view'}
                </button>
              </div>
              <div className="mx-auto w-full max-w-[280px]">
                <svg
                  viewBox={viewBox}
                  className="aspect-square w-full overflow-hidden rounded-full bg-muted text-foreground ring-1 ring-border"
                  onClick={() => setActiveShade(null)}
                >
                  <g className="pointer-events-none opacity-40">
                    <circle cx={center} cy={center} r={radius} fill="none" stroke="currentColor" strokeWidth="1" strokeDasharray="4 4" vectorEffect="non-scaling-stroke" />
                    <circle cx={center} cy={center} r={radius * 0.5} fill="none" stroke="currentColor" strokeWidth="1" strokeDasharray="4 4" vectorEffect="non-scaling-stroke" />
                    <line x1={center} y1={center - radius} x2={center} y2={center + radius} stroke="currentColor" strokeWidth="1" vectorEffect="non-scaling-stroke" />
                    <line x1={center - radius} y1={center} x2={center + radius} y2={center} stroke="currentColor" strokeWidth="1" vectorEffect="non-scaling-stroke" />
                  </g>
                  <path
                    d={pathData}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeOpacity="0.7"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    vectorEffect="non-scaling-stroke"
                    className="pointer-events-none"
                  />
                  {points.map((s) => {
                    const isMain = s.level === 500;
                    const isActive = activeShade === s.level;
                    const r = isMain ? 5 : 3.5;
                    return (
                      <g
                        key={s.level}
                        className="cursor-pointer"
                        onClick={(e) => { e.stopPropagation(); setActiveShade(s.level); }}
                      >
                        <circle cx={s.x} cy={s.y} r={16} fill="transparent" />
                        <circle
                          cx={s.x}
                          cy={s.y}
                          r={isActive ? r + 2 : r}
                          fill={s.hex}
                          stroke="currentColor"
                          strokeWidth={isActive ? 2 : 1.5}
                          vectorEffect="non-scaling-stroke"
                        />
                      </g>
                    );
                  })}
                </svg>
              </div>
            </section>

            <section className="space-y-6">
              <div className="grid grid-cols-2 rounded-lg border border-border bg-card p-0.5" role="group" aria-label="Curve mode">
                <button
                  type="button"
                  onClick={() => setConfig({ ...config, mode: 'curves' })}
                  className={`h-9 rounded-md text-[13px] ${curveMode ? 'bg-primary text-primary-foreground' : 'text-foreground'}`}
                  aria-pressed={curveMode}
                >
                  Curve
                </button>
                <button
                  type="button"
                  onClick={() => setConfig({ ...config, mode: 'linear' })}
                  className={`h-9 rounded-md text-[13px] ${config.mode === 'linear' ? 'bg-primary text-primary-foreground' : 'text-foreground'}`}
                  aria-pressed={config.mode === 'linear'}
                >
                  Linear blend
                </button>
              </div>

              {config.mode === 'linear' && config.linearConfig && (
                <div className="space-y-4 rounded-xl border border-border bg-card p-4">
                  <p className="text-[13px] leading-relaxed text-muted-foreground">
                    Linear blend draws a straight path between a light color and a dark color.
                  </p>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <p className="text-[13px] text-muted-foreground">Light end</p>
                      {(['l', 'c', 'h'] as const).map((key) => (
                        <label key={`start-${key}`} className="flex items-center gap-2 rounded-lg border border-border bg-background px-2 py-2">
                          <span className="w-4 font-mono text-[12px] text-muted-foreground">{key}</span>
                          <input
                            type="number"
                            step={key === 'c' ? 0.01 : 1}
                            min={0}
                            max={key === 'h' ? 360 : key === 'c' ? 0.4 : 100}
                            value={key === 'l' ? Math.round(config.linearConfig!.start.l * 100) : key === 'h' ? Math.round(config.linearConfig!.start.h) : config.linearConfig!.start.c}
                            onChange={(e) => {
                              const raw = Number(e.target.value);
                              const value = key === 'l' ? raw / 100 : raw;
                              setConfig({
                                ...config,
                                linearConfig: { ...config.linearConfig!, start: { ...config.linearConfig!.start, [key]: value } }
                              });
                            }}
                            className="w-full bg-transparent font-mono text-[13px] text-foreground focus:outline-none"
                          />
                        </label>
                      ))}
                    </div>
                    <div className="space-y-2">
                      <p className="text-[13px] text-muted-foreground">Dark end</p>
                      {(['l', 'c', 'h'] as const).map((key) => (
                        <label key={`end-${key}`} className="flex items-center gap-2 rounded-lg border border-border bg-background px-2 py-2">
                          <span className="w-4 font-mono text-[12px] text-muted-foreground">{key}</span>
                          <input
                            type="number"
                            step={key === 'c' ? 0.01 : 1}
                            min={0}
                            max={key === 'h' ? 360 : key === 'c' ? 0.4 : 100}
                            value={key === 'l' ? Math.round(config.linearConfig!.end.l * 100) : key === 'h' ? Math.round(config.linearConfig!.end.h) : config.linearConfig!.end.c}
                            onChange={(e) => {
                              const raw = Number(e.target.value);
                              const value = key === 'l' ? raw / 100 : raw;
                              setConfig({
                                ...config,
                                linearConfig: { ...config.linearConfig!, end: { ...config.linearConfig!.end, [key]: value } }
                              });
                            }}
                            className="w-full bg-transparent font-mono text-[13px] text-foreground focus:outline-none"
                          />
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {curveMode && (
                <div className="space-y-8">
                  <div className="flex items-center justify-between gap-4 rounded-xl border border-border bg-card p-3">
                    <div>
                      <p className="text-[13px] text-foreground">Perceptual brightness</p>
                      <p className="mt-1 text-[13px] text-muted-foreground">Spreads lightness evenly in OKLCH.</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setConfig({ ...config, useOkLCH: !config.useOkLCH })}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full ${config.useOkLCH ? 'bg-primary' : 'bg-[var(--switch)]'}`}
                      aria-pressed={!!config.useOkLCH}
                      aria-label="Perceptual brightness"
                    >
                      <span className={`inline-block size-4 rounded-full bg-white shadow-sm ring-1 ring-black/10 transition ${config.useOkLCH ? 'translate-x-6' : 'translate-x-1'}`} />
                    </button>
                  </div>

                  <div>
                    <div className="mb-2 flex items-end justify-between">
                      <label className="text-[15px] text-foreground" htmlFor="hue-rotation">Hue rotation</label>
                      <span className="font-mono text-[13px] text-foreground">{config.hueShift > 0 ? '+' : ''}{config.hueShift}°</span>
                    </div>
                    <input
                      id="hue-rotation"
                      type="range"
                      min={-60}
                      max={60}
                      step={1}
                      value={config.hueShift}
                      onChange={(e) => setConfig({ ...config, hueShift: Number(e.target.value) })}
                      className="w-full"
                    />
                    <div className="mt-1 flex justify-between text-[12px] text-muted-foreground">
                      <span>Cooler</span>
                      <span>Warmer</span>
                    </div>
                    <p className="mt-2 text-[13px] leading-relaxed text-muted-foreground">
                      Shifts hue as the step gets lighter or darker.
                    </p>
                  </div>

                  <div>
                    <div className="mb-2 flex items-end justify-between">
                      <label className="text-[15px] text-foreground" htmlFor="saturation-curve">Saturation curve</label>
                      <span className="font-mono text-[13px] text-foreground">{config.saturationBoost > 0 ? '+' : ''}{config.saturationBoost}%</span>
                    </div>
                    <input
                      id="saturation-curve"
                      type="range"
                      min={-100}
                      max={100}
                      step={1}
                      value={config.saturationBoost}
                      onChange={(e) => setConfig({ ...config, saturationBoost: Number(e.target.value) })}
                      className="w-full"
                    />
                    <div className="mt-1 flex justify-between text-[12px] text-muted-foreground">
                      <span>Flatten</span>
                      <span>Boost mids</span>
                    </div>
                  </div>

                  <div className={config.useOkLCH ? 'opacity-50' : ''}>
                    <div className="mb-2 flex items-center justify-between">
                      <p className="text-[15px] text-foreground">Lightness</p>
                      {config.useOkLCH && <span className="text-[12px] text-muted-foreground">Handled by OKLCH</span>}
                    </div>
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                      {(['linear', 'ease-in', 'ease-out', 'ease-in-out'] as const).map((mode) => (
                        <button
                          key={mode}
                          type="button"
                          disabled={!!config.useOkLCH}
                          onClick={() => setConfig({ ...config, lightnessEase: mode })}
                          className={`h-10 rounded-lg border text-[13px] ${
                            config.lightnessEase === mode
                              ? 'border-primary bg-primary text-primary-foreground'
                              : 'border-border bg-card text-foreground'
                          }`}
                        >
                          {mode === 'linear' ? 'Linear' : mode === 'ease-in' ? 'Ease in' : mode === 'ease-out' ? 'Ease out' : 'Ease in out'}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </section>
          </div>
        </div>

        <div className="flex shrink-0 gap-2 border-t border-border bg-background px-4 py-3">
          <button
            type="button"
            onClick={onClose}
            className="h-11 flex-1 rounded-lg border border-border text-[13px] text-foreground hover:bg-accent"
          >
            Discard
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="inline-flex h-11 flex-[2] items-center justify-center gap-2 rounded-lg bg-primary text-[13px] text-primary-foreground hover:opacity-90"
          >
            <Check className="size-4" strokeWidth={1.5} aria-hidden />
            Apply changes
          </button>
        </div>
      </div>
    </div>
  );
};

export default ScaleEditorModal;
