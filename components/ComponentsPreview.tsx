import React, { useMemo } from 'react';
import { ColorData, GlobalCurveConfig, PlaygroundConfig } from '../types';
import { MotionButton, SelectionMark } from './uiMotion';
import { buildPlaygroundTheme, PlaygroundTheme } from './cards/playgroundTheme';

interface ComponentsPreviewProps {
  brandPalette: ColorData[];
  neutralPalette: ColorData[];
  semanticPalette: ColorData[];
  config: PlaygroundConfig;
  onConfigChange: (next: PlaygroundConfig) => void;
  globalConfig?: GlobalCurveConfig;
}

type ButtonVariant = 'primary' | 'secondary' | 'tertiary' | 'link';
type ButtonState = 'default' | 'disabled' | 'active';

function Segmented<T extends string>({
  label,
  value,
  options,
  onChange,
  layoutId,
}: {
  label: string;
  value: T;
  options: { id: T; label: string }[];
  onChange: (id: T) => void;
  layoutId: string;
}) {
  return (
    <div className="inline-flex rounded-lg border border-border bg-card p-0.5" role="group" aria-label={label}>
      {options.map((option) => {
        const active = value === option.id;
        return (
          <MotionButton
            key={option.id}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(option.id)}
            className={`relative h-8 whitespace-nowrap rounded-md px-3 text-[13px] ${active ? 'text-primary-foreground' : 'text-foreground hover:bg-accent'}`}
          >
            <SelectionMark active={active} layoutId={layoutId} />
            <span className="relative z-10">{option.label}</span>
          </MotionButton>
        );
      })}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:gap-6">
      <div className="shrink-0 pt-1.5 text-[13px] text-muted-foreground sm:w-32">{label}</div>
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}

function buttonStyle(theme: PlaygroundTheme, variant: ButtonVariant, state: ButtonState): React.CSSProperties {
  if (state === 'disabled') {
    return {
      backgroundColor: variant === 'link' || variant === 'tertiary' ? 'transparent' : theme.disabled.bg,
      color: theme.disabled.text,
      textDecoration: variant === 'link' ? 'underline' : undefined,
      textUnderlineOffset: variant === 'link' ? '3px' : undefined,
      cursor: 'not-allowed',
    };
  }

  if (variant === 'primary') {
    return {
      backgroundColor: state === 'active' ? theme.action.primaryHover : theme.action.primary,
      color: theme.text.onPrimary,
      boxShadow: state === 'active' ? 'inset 0 1px 2px rgba(0, 0, 0, 0.22)' : undefined,
    };
  }

  if (variant === 'secondary') {
    return {
      backgroundColor: state === 'active' ? theme.action.secondaryHover : theme.action.secondaryBg,
      color: theme.action.secondaryText,
      boxShadow: state === 'active' ? 'inset 0 1px 2px rgba(0, 0, 0, 0.12)' : undefined,
    };
  }

  if (variant === 'tertiary') {
    return {
      backgroundColor: state === 'active' ? theme.action.secondaryBg : 'transparent',
      color: theme.action.primary,
    };
  }

  return {
    backgroundColor: 'transparent',
    color: state === 'active' ? theme.action.primaryHover : theme.action.primary,
    textDecoration: 'underline',
    textUnderlineOffset: '3px',
  };
}

function PreviewButton({
  label,
  variant,
  state,
  theme,
}: {
  label: string;
  variant: ButtonVariant;
  state: ButtonState;
  theme: PlaygroundTheme;
}) {
  return (
    <button
      type="button"
      disabled={state === 'disabled'}
      aria-pressed={state === 'active' ? true : undefined}
      className="inline-flex items-center justify-center rounded-lg px-3.5 py-2 text-[13px]"
      style={buttonStyle(theme, variant, state)}
    >
      {label}
    </button>
  );
}

const BUTTON_ROWS: { variant: ButtonVariant; label: string; sample: string }[] = [
  { variant: 'primary', label: 'Primary', sample: 'Primary' },
  { variant: 'secondary', label: 'Secondary', sample: 'Secondary' },
  { variant: 'tertiary', label: 'Tertiary', sample: 'Tertiary' },
  { variant: 'link', label: 'Link', sample: 'Link' },
];

const ComponentsPreview: React.FC<ComponentsPreviewProps> = ({
  brandPalette,
  neutralPalette,
  semanticPalette,
  config,
  onConfigChange,
  globalConfig,
}) => {
  const primaryIndex = brandPalette.length === 0
    ? 0
    : Math.min(Math.max(config.primaryIndex, 0), brandPalette.length - 1);
  const themeConfig = useMemo(
    () => ({ ...config, primaryIndex }),
    [config, primaryIndex],
  );
  const theme = useMemo(
    () => buildPlaygroundTheme(brandPalette, neutralPalette, semanticPalette, themeConfig, globalConfig),
    [brandPalette, neutralPalette, semanticPalette, themeConfig, globalConfig],
  );

  if (!theme || brandPalette.length === 0) {
    return <p className="text-[13px] text-muted-foreground">Generate a palette first to preview components.</p>;
  }

  return (
    <section aria-label="Components" data-view="components" className="flex flex-col gap-6">
      <div className="flex flex-col gap-5 rounded-2xl bg-card p-4 ring-1 ring-border sm:p-5">
        <Field label="Appearance">
          <Segmented
            label="Appearance"
            layoutId="components-appearance"
            value={config.isDarkMode ? 'dark' : 'light'}
            options={[
              { id: 'light', label: 'Light' },
              { id: 'dark', label: 'Dark' },
            ]}
            onChange={(id) => onConfigChange({ ...config, isDarkMode: id === 'dark' })}
          />
        </Field>
        <Field label="Primary color">
          <div className="flex flex-wrap gap-2" role="listbox" aria-label="Primary color">
            {brandPalette.map((color, index) => {
              const selected = index === primaryIndex;
              return (
                <button
                  key={`${color.name}-${color.hex}-${index}`}
                  type="button"
                  role="option"
                  aria-selected={selected}
                  aria-label={`${color.name}, ${color.hex}`}
                  onClick={() => onConfigChange({ ...config, primaryIndex: index })}
                  className={`flex max-w-full items-center gap-2 rounded-lg border px-2 py-1 text-left text-[13px] text-foreground ${selected ? 'border-foreground' : 'border-border hover:bg-accent'}`}
                >
                  <span className="size-5 shrink-0 rounded-md ring-1 ring-border" style={{ backgroundColor: color.hex }} />
                  <span>{color.name}</span>
                </button>
              );
            })}
          </div>
        </Field>
        <Field label="Background">
          <Segmented
            label="Background"
            layoutId="components-background"
            value={config.surfaceMode}
            options={[
              { id: 'neutral', label: 'Neutral' },
              { id: 'brand', label: 'Brand' },
            ]}
            onChange={(id) => onConfigChange({ ...config, surfaceMode: id })}
          />
        </Field>
        <Field label="Typography">
          <Segmented
            label="Typography"
            layoutId="components-typography"
            value={config.textMode}
            options={[
              { id: 'base', label: 'Gray' },
              { id: 'tinted', label: 'Tinted' },
            ]}
            onChange={(id) => onConfigChange({ ...config, textMode: id })}
          />
        </Field>
        <Field label="Disabled">
          <Segmented
            label="Disabled"
            layoutId="components-disabled"
            value={config.disabledMode}
            options={[
              { id: 'base', label: 'Base' },
              { id: 'tinted', label: 'Tinted' },
            ]}
            onChange={(id) => onConfigChange({ ...config, disabledMode: id })}
          />
        </Field>
      </div>

      <div
        className="rounded-2xl p-5 sm:p-6"
        data-components-stage
        style={{ backgroundColor: theme.bg.page, color: theme.text.main }}
      >
        <h2 className="text-[15px]" style={{ color: theme.text.main }}>Buttons</h2>
        <p className="mt-2 max-w-xl text-[13px] leading-relaxed" style={{ color: theme.text.secondary }}>
          These controls use the open palette. Change a setting above and this preview follows.
        </p>
        <div className="mt-6 flex flex-col gap-6">
          {BUTTON_ROWS.map((row) => (
            <div key={row.variant}>
              <h3 className="mb-3 text-[13px]" style={{ color: theme.text.secondary }}>{row.label}</h3>
              <div className="flex flex-wrap items-center gap-3">
                <PreviewButton label={row.sample} variant={row.variant} state="default" theme={theme} />
                <PreviewButton label="Disabled" variant={row.variant} state="disabled" theme={theme} />
                <PreviewButton label="Active" variant={row.variant} state="active" theme={theme} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ComponentsPreview;
