import React from 'react';
import * as RSwitch from '@radix-ui/react-switch';
import * as RProgress from '@radix-ui/react-progress';
import * as RTabs from '@radix-ui/react-tabs';
import * as RAvatar from '@radix-ui/react-avatar';

/**
 * Token-driven primitives shared by every playground card.
 * Styling lives in playground.css and reads only CSS variables, so a card
 * never touches a hex value or a theme object. Radix supplies behaviour and
 * accessibility for the interactive pieces; the rest is plain HTML.
 */

type Div = React.HTMLAttributes<HTMLDivElement>;
type Btn = React.ButtonHTMLAttributes<HTMLButtonElement>;

const cx = (...parts: (string | false | undefined | null)[]) => parts.filter(Boolean).join(' ');

export const Card: React.FC<Div & { title: string }> = ({ title, className, children, ...rest }) => (
  <article className={cx('card', className)} aria-label={title} {...rest}>{children}</article>
);

export const Button: React.FC<Btn & { variant?: 'primary' | 'ghost' | 'line' | 'soft'; icon?: boolean; full?: boolean }> = ({
  variant = 'primary', icon, full, className, ...rest
}) => (
  <button
    type="button"
    className={cx('btn', variant !== 'primary' && variant, icon && 'icon', full && 'full', className)}
    {...rest}
  />
);

export const Field: React.FC<React.InputHTMLAttributes<HTMLInputElement> & { label?: string }> = ({ label, id, className, ...rest }) => (
  <div>
    {label && <label className="lbl" htmlFor={id}>{label}</label>}
    <input id={id} className={cx('field', className)} {...rest} />
  </div>
);

export const Switch: React.FC<{ checked?: boolean; defaultChecked?: boolean; disabled?: boolean; onCheckedChange?: (v: boolean) => void; 'aria-label'?: string }> = (props) => (
  <RSwitch.Root className="tgl" {...props} />
);

export const Tag: React.FC<Div & { tone?: 'accent' | 'success' | 'warning' | 'danger' | 'info' }> = ({ tone = 'accent', className, ...rest }) => (
  <span className={cx('tag', tone !== 'accent' && tone, className)} {...rest} />
);

export const Avatar: React.FC<{ initials: string; size?: 'md' | 'lg'; className?: string; style?: React.CSSProperties }> = ({ initials, size = 'md', className, style }) => (
  <RAvatar.Root className={cx('av', size === 'lg' && 'lg', className)} style={style}>
    <RAvatar.Fallback delayMs={0}>{initials}</RAvatar.Fallback>
  </RAvatar.Root>
);

export const Progress: React.FC<{ value: number; className?: string; style?: React.CSSProperties }> = ({ value, className, style }) => (
  <RProgress.Root className={cx('bar-t', className)} value={value} style={style}>
    <RProgress.Indicator asChild><i style={{ width: `${value}%` }} /></RProgress.Indicator>
  </RProgress.Root>
);

/** Segmented control built on Radix Tabs (keyboard + roving focus for free). */
export const Segmented: React.FC<{ options: string[]; defaultValue?: string; className?: string; style?: React.CSSProperties }> = ({ options, defaultValue, className, style }) => (
  <RTabs.Root defaultValue={defaultValue ?? options[0]} className={className} style={style}>
    <RTabs.List className="seg-t" aria-label="Options">
      {options.map(o => <RTabs.Trigger key={o} value={o} className="seg-t-item">{o}</RTabs.Trigger>)}
    </RTabs.List>
  </RTabs.Root>
);

/** Palette-driven image stand-in. Swap for the asset catalogue in phase 5. */
export const Hero: React.FC<Div & { ratio?: string | number }> = ({ ratio = '16/9', className, style, ...rest }) => (
  <div className={cx('hero', className)} style={{ aspectRatio: ratio as any, ...style }} aria-hidden {...rest} />
);

export const Divider = () => <div className="divider" role="separator" />;
export const Stat: React.FC<Div> = ({ className, ...rest }) => <p className={cx('stat', className)} {...rest} />;
