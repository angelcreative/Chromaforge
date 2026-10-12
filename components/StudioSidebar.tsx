import React, { useEffect, useState } from 'react';
import {
  BookOpen,
  Copy,
  Download,
  FileDown,
  Heart,
  LayoutGrid,
  Menu,
  Palette,
  PanelLeft,
  PanelLeftClose,
  Pencil,
  Pipette,
  SlidersHorizontal,
} from 'lucide-react';
import { GlobalCurveConfig, PaletteTab } from '../types';
import ThemeToggle from './ThemeToggle';

type ToolProps = {
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  label: string;
  onClick: () => void;
  disabled?: boolean;
  pressed?: boolean;
};

const ToolButton: React.FC<ToolProps> = ({ icon: Icon, label, onClick, disabled, pressed }) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    aria-pressed={pressed}
    className={`flex h-9 w-full items-center rounded-lg outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-40 ${
      pressed ? 'bg-accent text-foreground' : 'text-muted-foreground hover:bg-accent hover:text-foreground'
    }`}
  >
    <span className="grid size-9 shrink-0 place-items-center">
      <Icon className="size-4" strokeWidth={1.5} aria-hidden />
    </span>
    <span className="pr-2 text-left text-[13px]">{label}</span>
  </button>
);

export interface StudioSidebarProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  paletteName: string;
  onPaletteName: (name: string) => void;
  activeTab: PaletteTab;
  onTab: (tab: PaletteTab) => void;
  onLibrary: () => void;
  onSave: () => void;
  saved: boolean;
  saving: boolean;
  onRefine: () => void;
  onEditColors: () => void;
  onFix: () => void;
  onExport: () => void;
  onCopySkill: () => void;
  onDownloadSkill: () => void;
  onPlayground: () => void;
  playgroundActive: boolean;
  gradients: boolean;
  onToggleGradients: () => void;
  isPrint: boolean;
  onTogglePrint: () => void;
  isCompact: boolean;
  onToggleCompact: () => void;
  canRefine: boolean;
  curveOpen: boolean;
  onToggleCurve: () => void;
  curve: GlobalCurveConfig;
  onCurve: (next: GlobalCurveConfig) => void;
}

const TABS: { id: PaletteTab; label: string }[] = [
  { id: 'brand', label: 'Brand' },
  { id: 'neutrals', label: 'Neutrals' },
  { id: 'system', label: 'Semantic' },
];

const StudioSidebar: React.FC<StudioSidebarProps> = ({
  open,
  onOpenChange,
  paletteName,
  onPaletteName,
  activeTab,
  onTab,
  onLibrary,
  onSave,
  saved,
  saving,
  onRefine,
  onEditColors,
  onFix,
  onExport,
  onCopySkill,
  onDownloadSkill,
  onPlayground,
  playgroundActive,
  gradients,
  onToggleGradients,
  isPrint,
  onTogglePrint,
  isCompact,
  onToggleCompact,
  canRefine,
  curveOpen,
  onToggleCurve,
  curve,
  onCurve,
}) => {
  const [present, setPresent] = useState(open);
  const [shown, setShown] = useState(open);

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

  return (
  <>
    {present && (
      <button
        type="button"
        aria-label="Hide tools"
        className={`fixed inset-0 z-30 bg-black/30 md:hidden ${shown ? 'studio-fade' : 'opacity-0'}`}
        onClick={() => onOpenChange(false)}
      />
    )}

    {!present && (
      <button
        type="button"
        aria-label="Show tools"
        onClick={() => onOpenChange(true)}
        className="studio-in absolute bottom-5 left-4 z-30 grid size-10 place-items-center rounded-full bg-card text-foreground shadow-panel ring-1 ring-border"
      >
        <PanelLeft className="size-4" strokeWidth={1.5} />
      </button>
    )}

    {present && (
      <aside
        className={`${shown ? 'shell-in' : 'shell-out'} absolute top-16 bottom-4 left-3 z-40 flex w-[min(260px,calc(100vw-4.5rem))] flex-col overflow-hidden rounded-2xl bg-card shadow-panel ring-1 ring-border`}
        aria-label="Tools"
      >
        <div className="border-b border-border p-3">
          <ThemeToggle showLabels />
          <label className="mt-3 block text-[13px] text-muted-foreground">
            Palette name
            <input
              type="text"
              value={paletteName}
              onChange={(event) => onPaletteName(event.target.value)}
              className="mt-1 h-9 w-full rounded-lg border border-border bg-background px-2 text-[13px] text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </label>
          <div className="mt-3 grid grid-cols-3 gap-1 rounded-lg border border-border bg-background p-0.5" role="group" aria-label="Palette group">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                aria-pressed={activeTab === tab.id}
                onClick={() => onTab(tab.id)}
                className={`h-8 rounded-md text-[13px] ${activeTab === tab.id ? 'bg-primary text-primary-foreground' : 'text-foreground hover:bg-accent'}`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto p-1.5" aria-label="Studio tools">
          <ToolButton icon={BookOpen} label="Library" onClick={onLibrary} />
          <ToolButton icon={Heart} label={saved ? 'Saved' : 'Save palette'} onClick={onSave} disabled={saving} pressed={saved} />
          <ToolButton icon={Pipette} label="Refine color" onClick={onRefine} disabled={!canRefine} />
          <ToolButton icon={Pencil} label="Edit colors" onClick={onEditColors} />
          <ToolButton icon={SlidersHorizontal} label="Fix palette" onClick={onFix} />
          <ToolButton icon={Download} label="Export" onClick={onExport} />
          <ToolButton icon={Copy} label="Copy color.md" onClick={onCopySkill} />
          <ToolButton icon={FileDown} label="Download color.md" onClick={onDownloadSkill} />
          <ToolButton icon={Palette} label={gradients ? 'Show ramp' : 'Gradients'} onClick={onToggleGradients} pressed={gradients} />
          <ToolButton icon={LayoutGrid} label="Playground" onClick={onPlayground} pressed={playgroundActive} />
          <ToolButton icon={Menu} label={isCompact ? 'Cards' : 'List'} onClick={onToggleCompact} pressed={isCompact} />
          <button
            type="button"
            onClick={onTogglePrint}
            aria-pressed={isPrint}
            className="flex h-9 w-full items-center rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground"
          >
            <span className="grid size-9 shrink-0 place-items-center">
              <span className={`relative h-4 w-7 rounded-full ${isPrint ? 'bg-primary' : 'bg-[var(--switch)]'}`}>
                <span className={`absolute top-0.5 left-0.5 size-3 rounded-full bg-white shadow-sm ring-1 ring-black/10 transition-transform ${isPrint ? 'translate-x-3' : ''}`} />
              </span>
            </span>
            <span className="text-left text-[13px]">Print (CMYK)</span>
          </button>
        </nav>

        <div className="border-t border-border p-1.5">
          <button
            type="button"
            onClick={onToggleCurve}
            aria-expanded={curveOpen}
            className="flex h-9 w-full items-center rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground"
          >
            <span className="grid size-9 shrink-0 place-items-center">
              <SlidersHorizontal className="size-4" strokeWidth={1.5} aria-hidden />
            </span>
            <span className="text-left text-[13px]">Ramp</span>
          </button>
          {curveOpen && (
            <div className="space-y-3 px-3 pb-3">
              <label className="block text-[13px] text-muted-foreground">
                Scale steps
                <span className="float-right font-mono text-foreground">{curve.steps}</span>
                <input type="range" min={3} max={21} step={1} value={curve.steps} onChange={(event) => onCurve({ ...curve, steps: Number(event.target.value) })} className="mt-1 w-full" />
              </label>
              <label className="block text-[13px] text-muted-foreground">
                Vibrancy
                <span className="float-right font-mono text-foreground">{curve.vibrancy}%</span>
                <input type="range" min={-100} max={100} step={5} value={curve.vibrancy} onChange={(event) => onCurve({ ...curve, vibrancy: Number(event.target.value) })} className="mt-1 w-full" />
              </label>
              <label className="block text-[13px] text-muted-foreground">
                Contrast
                <span className="float-right font-mono text-foreground">{curve.contrast}%</span>
                <input type="range" min={-100} max={100} step={5} value={curve.contrast} onChange={(event) => onCurve({ ...curve, contrast: Number(event.target.value) })} className="mt-1 w-full" />
              </label>
              <label className="block text-[13px] text-muted-foreground">
                Hue blend
                <span className="float-right font-mono text-foreground">{curve.hueTorsion}°</span>
                <input type="range" min={-60} max={60} step={5} value={curve.hueTorsion} onChange={(event) => onCurve({ ...curve, hueTorsion: Number(event.target.value) })} className="mt-1 w-full" />
              </label>
            </div>
          )}
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="flex h-9 w-full items-center rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground"
          >
            <span className="grid size-9 shrink-0 place-items-center">
              <PanelLeftClose className="size-4" strokeWidth={1.5} aria-hidden />
            </span>
            <span className="text-left text-[13px]">Hide tools</span>
          </button>
        </div>
      </aside>
    )}
  </>
  );
};

export default StudioSidebar;
