import React from 'react';
import { GlobalCurveConfig } from '../types';

interface RampScaleControlsProps {
  curve: GlobalCurveConfig;
  onCurve: (next: GlobalCurveConfig) => void;
}

const rangeFill = (value: number, min: number, max: number): React.CSSProperties => ({
  '--range-fill': `${((value - min) / (max - min)) * 100}%`,
} as React.CSSProperties);

const RampScaleControls: React.FC<RampScaleControlsProps> = ({ curve, onCurve }) => (
  <div
    className="grid gap-x-4 gap-y-3 rounded-xl border border-border bg-card p-3 sm:grid-cols-2 xl:grid-cols-4"
    data-scale-controls
    aria-label="Scale"
  >
    <label className="block text-[13px] text-muted-foreground">
      Shades
      <span className="float-right font-mono text-foreground">{curve.steps}</span>
      <input
        type="range"
        min={3}
        max={21}
        step={1}
        value={curve.steps}
        onChange={(event) => onCurve({ ...curve, steps: Number(event.target.value) })}
        className="scale-slider mt-1 w-full"
        style={rangeFill(curve.steps, 3, 21)}
      />
    </label>
    <label className="block text-[13px] text-muted-foreground">
      Vibrancy
      <span className="float-right font-mono text-foreground">{curve.vibrancy}%</span>
      <input
        type="range"
        min={-100}
        max={100}
        step={5}
        value={curve.vibrancy}
        onChange={(event) => onCurve({ ...curve, vibrancy: Number(event.target.value) })}
        className="scale-slider mt-1 w-full"
        style={rangeFill(curve.vibrancy, -100, 100)}
      />
    </label>
    <label className="block text-[13px] text-muted-foreground">
      Contrast
      <span className="float-right font-mono text-foreground">{curve.contrast}%</span>
      <input
        type="range"
        min={-100}
        max={100}
        step={5}
        value={curve.contrast}
        onChange={(event) => onCurve({ ...curve, contrast: Number(event.target.value) })}
        className="scale-slider mt-1 w-full"
        style={rangeFill(curve.contrast, -100, 100)}
      />
    </label>
    <label className="block text-[13px] text-muted-foreground">
      Hue blend
      <span className="float-right font-mono text-foreground">{curve.hueTorsion}°</span>
      <input
        type="range"
        min={-60}
        max={60}
        step={5}
        value={curve.hueTorsion}
        onChange={(event) => onCurve({ ...curve, hueTorsion: Number(event.target.value) })}
        className="scale-slider mt-1 w-full"
        style={rangeFill(curve.hueTorsion, -60, 60)}
      />
    </label>
  </div>
);

export default RampScaleControls;
