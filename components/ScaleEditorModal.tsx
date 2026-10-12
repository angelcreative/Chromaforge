import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Check, X } from 'lucide-react';
import { ColorData, ScaleConfiguration } from '../types';
import { generateShades, createColorData, hexToRgb, rgbToOklch } from '../utils/colorUtils';

interface ScaleEditorModalProps {
  color: ColorData;
  onClose: () => void;
  onSave: (colorHex: string, newConfig: ScaleConfiguration) => void;
  onPreview?: (colorHex: string, config: ScaleConfiguration | undefined) => void;
  usageCount?: number;
  limit?: number;
  isPremium?: boolean;
}

const SIZE = 320;
const CENTER = SIZE / 2;
const RADIUS = 142;
const PLOT_RADIUS = RADIUS * 0.86;

const ScaleEditorModal: React.FC<ScaleEditorModalProps> = ({ color, onClose, onSave, onPreview, usageCount, limit, isPremium }) => {
  const originalConfig = useRef<ScaleConfiguration | undefined>(color.scaleConfig);
  const onPreviewRef = useRef(onPreview);
  onPreviewRef.current = onPreview;
  const initialConfigKey = useRef<string | null>(null);

  const [config, setConfig] = useState<ScaleConfiguration>(color.scaleConfig || {
    hueShift: 0,
    saturationBoost: 0,
    lightnessEase: 'linear',
    useOkLCH: true,
    mode: 'curves',
  });

  const [activeShade, setActiveShade] = useState<number | null>(null);
  const [leaving, setLeaving] = useState(false);

  const finish = (revert: boolean) => {
    if (leaving) return;
    if (revert) onPreviewRef.current?.(color.hex, originalConfig.current);
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) {
      onClose();
      return;
    }
    setLeaving(true);
    window.setTimeout(onClose, 180);
  };

  useEffect(() => {
    if (config.mode === 'linear' && !config.linearConfig) {
      const oklch = rgbToOklch(color.rgb.r, color.rgb.g, color.rgb.b);
      setConfig(prev => ({
        ...prev,
        linearConfig: {
          start: { l: 0.98, c: 0.02, h: oklch.h },
          end: { l: 0.05, c: oklch.c, h: oklch.h },
          steps: 11,
        },
      }));
    }
  }, [config.mode, config.linearConfig, color.rgb]);

  useEffect(() => {
    const key = JSON.stringify(config);
    if (initialConfigKey.current === null) {
      initialConfigKey.current = key;
      return;
    }
    if (key === initialConfigKey.current) return;
    onPreviewRef.current?.(color.hex, config);
  }, [config, color.hex]);

  const previewColor = useMemo(() => createColorData(color.hex, config), [color.hex, config]);
  const shades = useMemo(() => generateShades(previewColor), [previewColor]);

  const handleDiscard = () => finish(true);

  const handleSave = () => {
    onSave(color.hex, config);
    finish(false);
  };

  const points = useMemo(() => {
    const samples = shades.map((shade) => {
      const rgb = hexToRgb(shade.hex);
      return { shade, oklch: rgbToOklch(rgb.r, rgb.g, rgb.b) };
    });
    const maxChroma = samples.reduce((max, sample) => Math.max(max, sample.oklch.c), 0);
    const frame = maxChroma > 1e-4 ? maxChroma : 1;

    return samples.map(({ shade, oklch }) => {
      const angle = ((oklch.h - 90) * Math.PI) / 180;
      const radius = (oklch.c / frame) * PLOT_RADIUS;
      return {
        x: CENTER + radius * Math.cos(angle),
        y: CENTER + radius * Math.sin(angle),
        hex: shade.hex,
        level: shade.level,
      };
    });
  }, [shades]);

  const pathData = useMemo(() => {
    if (points.length === 0) return '';
    return points.map((p, i) =>
      (i === 0 ? 'M' : 'L') + ` ${p.x.toFixed(1)},${p.y.toFixed(1)}`
    ).join(' ');
  }, [points]);

  const curveMode = !config.mode || config.mode === 'curves';

  const setChannel = (end: 'start' | 'end', key: 'l' | 'c' | 'h', raw: number) => {
    if (!config.linearConfig) return;
    const value = key === 'l' ? raw / 100 : raw;
    setConfig({
      ...config,
      linearConfig: {
        ...config.linearConfig,
        [end]: { ...config.linearConfig[end], [key]: value },
      },
    });
  };

  return (
    <div
      role="dialog"
      aria-labelledby="edit-scale-title"
      className={`fixed inset-0 z-[160] flex h-[100dvh] flex-col bg-card text-foreground lg:inset-y-0 lg:left-auto lg:right-0 lg:w-[380px] lg:border-l lg:border-border lg:shadow-panel ${leaving ? 'drawer-out' : 'drawer-in'}`}
    >
      <div className="flex shrink-0 items-center justify-between gap-3 border-b border-border px-4 py-3">
        <div className="min-w-0">
          <h2 id="edit-scale-title" className="text-[15px] font-medium text-foreground">Edit scale</h2>
          <p className="truncate text-[13px] text-muted-foreground">{color.name}</p>
          {!isPremium && usageCount !== undefined && limit !== undefined && (
            <p className="text-[12px] text-muted-foreground">{usageCount} of {limit} edits</p>
          )}
        </div>
        <button
          type="button"
          onClick={handleDiscard}
          className="inline-flex h-10 shrink-0 items-center gap-1.5 rounded-lg border border-border bg-background px-3 text-[13px] text-foreground hover:bg-accent"
        >
          <X className="size-4" strokeWidth={1.5} aria-hidden />
          Close
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
        <section>
          <svg
            viewBox={`0 0 ${SIZE} ${SIZE}`}
            preserveAspectRatio="xMidYMid meet"
            aria-label="OKLCH steps"
            className="aspect-square w-full text-foreground"
            onClick={(event) => {
              const svg = event.currentTarget;
              const matrix = svg.getScreenCTM();
              if (!matrix) return;
              const point = svg.createSVGPoint();
              point.x = event.clientX;
              point.y = event.clientY;
              const local = point.matrixTransform(matrix.inverse());
              let nearestLevel: number | null = null;
              let nearestDistance = 14;
              for (const step of points) {
                const distance = Math.hypot(step.x - local.x, step.y - local.y);
                if (distance <= nearestDistance) {
                  nearestDistance = distance;
                  nearestLevel = step.level;
                }
              }
              setActiveShade(nearestLevel);
            }}
          >
            <g className="pointer-events-none opacity-40">
              <circle cx={CENTER} cy={CENTER} r={RADIUS} fill="none" stroke="currentColor" strokeWidth="1" strokeDasharray="2 3" vectorEffect="non-scaling-stroke" />
              <circle cx={CENTER} cy={CENTER} r={RADIUS * 0.5} fill="none" stroke="currentColor" strokeWidth="1" strokeDasharray="2 3" vectorEffect="non-scaling-stroke" />
              <line x1={CENTER} y1={CENTER - RADIUS} x2={CENTER} y2={CENTER + RADIUS} stroke="currentColor" strokeWidth="1" vectorEffect="non-scaling-stroke" />
              <line x1={CENTER - RADIUS} y1={CENTER} x2={CENTER + RADIUS} y2={CENTER} stroke="currentColor" strokeWidth="1" vectorEffect="non-scaling-stroke" />
            </g>
            <path
              d={pathData}
              fill="none"
              stroke="currentColor"
              strokeWidth="1"
              strokeOpacity="0.45"
              strokeLinecap="round"
              strokeLinejoin="round"
              vectorEffect="non-scaling-stroke"
              className="pointer-events-none"
            />
            {points.map((s) => {
              const isActive = activeShade === s.level;
              return (
                <g
                  key={s.level}
                  role="button"
                  tabIndex={0}
                  aria-pressed={isActive}
                  aria-label={`Step ${s.level}`}
                  className="cursor-pointer outline-none"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      e.stopPropagation();
                      setActiveShade(s.level);
                    }
                  }}
                >
                  <circle cx={s.x} cy={s.y} r={12} fill="transparent" />
                  <circle
                    cx={s.x}
                    cy={s.y}
                    r={9}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1"
                    vectorEffect="non-scaling-stroke"
                    className="oklch-ring"
                    data-selected={isActive ? 'true' : 'false'}
                  />
                  <circle
                    cx={s.x}
                    cy={s.y}
                    r={4.5}
                    fill={s.hex}
                    stroke="currentColor"
                    strokeOpacity="0.28"
                    strokeWidth="1"
                    vectorEffect="non-scaling-stroke"
                    className="oklch-dot"
                    data-selected={isActive ? 'true' : 'false'}
                  />
                </g>
              );
            })}
          </svg>
          <div className="mt-3 flex gap-1 pb-1">
            {shades.map((shade) => {
              const selected = activeShade === shade.level;
              return (
                <button
                  key={shade.level}
                  type="button"
                  onClick={() => setActiveShade(shade.level)}
                  className="min-w-0 flex-1"
                  aria-pressed={selected}
                  aria-label={`Step ${shade.level}`}
                >
                  <span
                    className={`oklch-swatch block h-8 rounded-md ring-2 ring-offset-2 ring-offset-card ${selected ? 'scale-[1.06] ring-foreground' : 'ring-transparent'}`}
                    style={{ backgroundColor: shade.hex }}
                  />
                  <span className="mt-1 block text-center font-mono text-[10px] text-muted-foreground">{shade.level}</span>
                </button>
              );
            })}
          </div>
        </section>

        <section className="mt-4 space-y-4 lg:mt-5">
          <div className="grid grid-cols-2 rounded-lg border border-border bg-background p-0.5" role="group" aria-label="Curve mode">
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
            <div className="space-y-4 rounded-xl border border-border bg-background p-4">
              <p className="text-[13px] leading-relaxed text-muted-foreground">
                Linear blend draws a straight path between a light color and a dark color.
              </p>
              {(['start', 'end'] as const).map((end) => (
                <div key={end} className="space-y-2">
                  <p className="text-[13px] text-foreground">{end === 'start' ? 'Light end' : 'Dark end'}</p>
                  {([
                    ['l', 'Lightness'],
                    ['c', 'Chroma'],
                    ['h', 'Hue'],
                  ] as const).map(([key, label]) => (
                    <label key={`${end}-${key}`} className="flex items-center gap-3 rounded-lg border border-border bg-card px-3 py-2">
                      <span className="w-20 text-[13px] text-muted-foreground">{label}</span>
                      <input
                        type="number"
                        step={key === 'c' ? 0.01 : 1}
                        min={0}
                        max={key === 'h' ? 360 : key === 'c' ? 0.4 : 100}
                        value={key === 'l' ? Math.round(config.linearConfig![end].l * 100) : key === 'h' ? Math.round(config.linearConfig![end].h) : config.linearConfig![end].c}
                        onChange={(e) => setChannel(end, key, Number(e.target.value))}
                        className="w-full bg-transparent font-mono text-[13px] text-foreground focus:outline-none"
                        aria-label={`${end === 'start' ? 'Light' : 'Dark'} ${label}`}
                      />
                    </label>
                  ))}
                </div>
              ))}
            </div>
          )}

          {curveMode && (
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-4 rounded-xl border border-border bg-background p-3">
                <div>
                  <p className="text-[13px] text-foreground">Perceptual brightness</p>
                  <p className="mt-1 text-[13px] leading-relaxed text-muted-foreground">Spreads lightness evenly in OKLCH.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setConfig({ ...config, useOkLCH: !config.useOkLCH })}
                  className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full ${config.useOkLCH ? 'bg-primary' : 'bg-[var(--switch)]'}`}
                  aria-pressed={!!config.useOkLCH}
                  aria-label="Perceptual brightness"
                >
                  <span className={`inline-block size-4 rounded-full bg-white shadow-sm ring-1 ring-black/10 transition ${config.useOkLCH ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
              </div>

              <div>
                <div className="mb-2 flex items-end justify-between gap-3">
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
                <div className="mt-1 flex justify-between text-[13px] text-muted-foreground">
                  <span>Cooler</span>
                  <span>Warmer</span>
                </div>
                <p className="mt-2 text-[13px] leading-relaxed text-muted-foreground">
                  Shifts hue as the step gets lighter or darker.
                </p>
              </div>

              <div>
                <div className="mb-2 flex items-end justify-between gap-3">
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
                <div className="mt-1 flex justify-between text-[13px] text-muted-foreground">
                  <span>Flatten</span>
                  <span>Boost mids</span>
                </div>
              </div>

              <div className={config.useOkLCH ? 'opacity-50' : ''}>
                <div className="mb-2 flex items-center justify-between gap-3">
                  <p className="text-[15px] text-foreground">Lightness easing</p>
                  {config.useOkLCH && <span className="text-[13px] text-muted-foreground">Handled by OKLCH</span>}
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {(['linear', 'ease-in', 'ease-out', 'ease-in-out'] as const).map((mode) => (
                    <button
                      key={mode}
                      type="button"
                      disabled={!!config.useOkLCH}
                      onClick={() => setConfig({ ...config, lightnessEase: mode })}
                      className={`h-10 rounded-lg border text-[13px] ${
                        config.lightnessEase === mode
                          ? 'border-primary bg-primary text-primary-foreground'
                          : 'border-border bg-background text-foreground'
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

      <div className="flex shrink-0 gap-2 border-t border-border bg-card px-4 py-3">
        <button
          type="button"
          onClick={handleDiscard}
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
          Apply
        </button>
      </div>
    </div>
  );
};

export default ScaleEditorModal;
