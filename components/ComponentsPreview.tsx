import React, { useMemo, useState } from 'react';
import { ColorData, GlobalCurveConfig, PlaygroundConfig } from '../types';
import { MotionButton, SelectionMark } from './uiMotion';
import { buildPlaygroundTheme, PlaygroundTheme } from './cards/playgroundTheme';
import {
  Badge,
  Button,
  Checkbox,
  Input,
  Label,
  Pill,
  ProgressBar,
  Radio,
  Select,
  Slider,
  Switch,
  Tag,
  Textarea,
} from './cards/Molecules';

interface ComponentsPreviewProps {
  brandPalette: ColorData[];
  neutralPalette: ColorData[];
  semanticPalette: ColorData[];
  config: PlaygroundConfig;
  onConfigChange: (next: PlaygroundConfig) => void;
  globalConfig?: GlobalCurveConfig;
}

type ComponentId =
  | 'badge'
  | 'button'
  | 'checkbox'
  | 'input'
  | 'label'
  | 'pill'
  | 'progress'
  | 'radio'
  | 'select'
  | 'slider'
  | 'switch'
  | 'tag'
  | 'textarea';

type RadiusId = '0' | '4' | '8' | '16' | '999';

const RADIUS_OPTIONS: { id: RadiusId; label: string }[] = [
  { id: '0', label: 'Square' },
  { id: '4', label: 'Small' },
  { id: '8', label: 'Medium' },
  { id: '16', label: 'Large' },
  { id: '999', label: 'Full' },
];

function radiusValue(id: RadiusId) {
  return id === '999' ? '999px' : `${id}px`;
}

const COMPONENT_RADIUS_CSS = `
[data-component-preview] :is(button, input, textarea, [role="progressbar"]) {
  border-radius: var(--component-radius) !important;
}
[data-component-preview] span:is(.rounded, .rounded-full):not(.w-4) {
  border-radius: var(--component-radius) !important;
}
[data-component-preview] div.w-5.rounded-full {
  border-radius: var(--component-radius) !important;
}
`;

const COMPONENTS: { id: ComponentId; label: string }[] = [
  { id: 'badge', label: 'Badge' },
  { id: 'button', label: 'Button' },
  { id: 'checkbox', label: 'Checkbox' },
  { id: 'input', label: 'Input' },
  { id: 'label', label: 'Label' },
  { id: 'pill', label: 'Pill' },
  { id: 'progress', label: 'Progress' },
  { id: 'radio', label: 'Radio' },
  { id: 'select', label: 'Select' },
  { id: 'slider', label: 'Slider' },
  { id: 'switch', label: 'Switch' },
  { id: 'tag', label: 'Tag' },
  { id: 'textarea', label: 'Textarea' },
];

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

function ControlPreview({ id, theme, radius }: { id: ComponentId; theme: PlaygroundTheme; radius: string }): React.ReactElement {
  const [checked, setChecked] = useState(true);
  const [text, setText] = useState('Harbor');
  const [note, setNote] = useState('A note about this palette.');
  const [choice, setChoice] = useState('tide');
  const [selected, setSelected] = useState('tide');
  const [level, setLevel] = useState([62]);
  const [on, setOn] = useState(true);

  let body: React.ReactNode;
  if (id === 'badge') {
    body = (
      <div className="flex flex-wrap items-center gap-2">
        <Badge theme={theme}>Primary</Badge>
        <Badge theme={theme} variant="secondary">Secondary</Badge>
        <Badge theme={theme} variant="success">Success</Badge>
        <Badge theme={theme} variant="error">Error</Badge>
        <Badge theme={theme} variant="warning">Warning</Badge>
        <Badge theme={theme} variant="info">Info</Badge>
      </div>
    );
  } else if (id === 'button') {
    body = (
      <div className="flex flex-wrap items-center gap-3">
        <Button theme={theme}>Primary</Button>
        <Button theme={theme} variant="secondary">Secondary</Button>
        <Button theme={theme} variant="tertiary">Tertiary</Button>
        <Button theme={theme} variant="link">Link</Button>
        <Button theme={theme} disabled>Disabled</Button>
      </div>
    );
  } else if (id === 'checkbox') {
    body = (
      <div className="flex flex-wrap items-center gap-6">
        <Checkbox theme={theme} checked={checked} onCheckedChange={setChecked} label="Remember" />
        <Checkbox theme={theme} checked={false} onCheckedChange={() => {}} label="Optional" />
        <Checkbox theme={theme} checked disabled onCheckedChange={() => {}} label="Locked" />
      </div>
    );
  } else if (id === 'input') {
    body = (
      <div className="max-w-sm">
        <Input theme={theme} value={text} onChange={(event) => setText(event.target.value)} placeholder="Palette name" />
      </div>
    );
  } else if (id === 'label') {
    body = (
      <div className="flex flex-wrap items-baseline gap-x-6 gap-y-2">
        <Label theme={theme}>Palette name</Label>
        <Label theme={theme} variant="secondary">Secondary</Label>
        <Label theme={theme} variant="small">Step</Label>
      </div>
    );
  } else if (id === 'pill') {
    body = (
      <div className="flex flex-wrap items-center gap-2">
        <Pill theme={theme}>Harbor</Pill>
        <Pill theme={theme}>Tide</Pill>
        <Pill theme={theme}>Foam</Pill>
      </div>
    );
  } else if (id === 'progress') {
    body = (
      <div className="max-w-sm">
        <ProgressBar theme={theme} value={level[0] ?? 62} />
      </div>
    );
  } else if (id === 'radio') {
    body = (
      <div className="flex flex-wrap items-center gap-6">
        <Radio theme={theme} value="tide" checked={choice === 'tide'} onCheckedChange={setChoice} label="Tide" />
        <Radio theme={theme} value="foam" checked={choice === 'foam'} onCheckedChange={setChoice} label="Foam" />
        <Radio theme={theme} value="buoy" checked={choice === 'buoy'} onCheckedChange={setChoice} label="Buoy" />
      </div>
    );
  } else if (id === 'select') {
    body = (
      <div className="max-w-xs">
        <Select
          theme={theme}
          value={selected}
          onValueChange={setSelected}
          placeholder="Choose a color"
          radius={radius}
          options={[
            { value: 'tide', label: 'Tide' },
            { value: 'foam', label: 'Foam' },
            { value: 'buoy', label: 'Buoy' },
          ]}
        />
      </div>
    );
  } else if (id === 'slider') {
    body = (
      <div className="max-w-sm pt-1">
        <Slider theme={theme} value={level} onValueChange={setLevel} />
      </div>
    );
  } else if (id === 'switch') {
    body = (
      <div className="flex max-w-sm flex-col gap-3">
        <Switch theme={theme} checked={on} onCheckedChange={setOn} label="Use brand surface" />
        <Switch theme={theme} checked={false} onCheckedChange={() => {}} label="Locked" disabled />
      </div>
    );
  } else if (id === 'tag') {
    body = (
      <div className="flex flex-wrap items-center gap-2">
        <Tag theme={theme}>Primary</Tag>
        <Tag theme={theme} variant="secondary">Secondary</Tag>
        <Tag theme={theme} variant="outline">Outline</Tag>
        <Tag theme={theme} variant="success">Success</Tag>
      </div>
    );
  } else {
    body = (
      <div className="max-w-md">
        <Textarea theme={theme} rows={3} value={note} onChange={(event) => setNote(event.target.value)} placeholder="Write a note" />
      </div>
    );
  }

  return (
    <div data-component-preview style={{ '--component-radius': radius } as React.CSSProperties}>
      <style>{COMPONENT_RADIUS_CSS}</style>
      {body}
    </div>
  );
}

const ComponentsPreview: React.FC<ComponentsPreviewProps> = ({
  brandPalette,
  neutralPalette,
  semanticPalette,
  config,
  onConfigChange,
  globalConfig,
}) => {
  const [componentId, setComponentId] = useState<ComponentId>('button');
  const [radius, setRadius] = useState<RadiusId>('8');
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
        <Field label="Radius">
          <Segmented
            label="Radius"
            layoutId="components-radius"
            value={radius}
            options={RADIUS_OPTIONS}
            onChange={setRadius}
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
        data-component={componentId}
        style={{ backgroundColor: theme.bg.page, color: theme.text.main }}
      >
        <h2 className="text-[15px]" style={{ color: theme.text.main }}>Components</h2>
        <div
          className="mt-4 flex w-full max-w-[36rem] flex-wrap gap-1"
          role="group"
          aria-label="Component"
          data-component-group
        >
          {COMPONENTS.map((item) => {
            const active = componentId === item.id;
            return (
              <button
                key={item.id}
                type="button"
                aria-pressed={active}
                onClick={() => setComponentId(item.id)}
                className="h-8 shrink-0 rounded-md px-2.5 text-[13px]"
                style={{
                  backgroundColor: active ? theme.action.primary : theme.bg.card,
                  color: active ? theme.text.onPrimary : theme.text.main,
                  boxShadow: active ? undefined : `inset 0 0 0 1px ${theme.border.default}`,
                }}
              >
                {item.label}
              </button>
            );
          })}
        </div>
        <div className="mt-6">
          <React.Fragment key={componentId}>
            <ControlPreview id={componentId} theme={theme} radius={radiusValue(radius)} />
          </React.Fragment>
        </div>
      </div>
    </section>
  );
};

export default ComponentsPreview;
