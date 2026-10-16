import React, { useEffect, useState } from 'react';
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

type PhotoOrientation = 'landscape' | 'portrait' | 'square';
interface StockPhoto { src: string; small: string; alt: string; credit: string; link: string }

// One request per query per page load; the server caches across users.
const photoRequests = new Map<string, Promise<StockPhoto | null>>();
const loadPhoto = (query: string, orientation: PhotoOrientation) => {
  const key = `${orientation}:${query}`;
  let request = photoRequests.get(key);
  if (!request) {
    request = fetch(`/api/photo?q=${encodeURIComponent(query)}&orientation=${orientation}`)
      .then(r => (r.ok ? r.json() : null))
      .then(d => (d?.photo?.src ? d.photo as StockPhoto : null))
      .catch(() => null);
    photoRequests.set(key, request);
  }
  return request;
};

const useStockPhoto = (query?: string, orientation: PhotoOrientation = 'landscape') => {
  const [photo, setPhoto] = useState<StockPhoto | null>(null);
  useEffect(() => {
    if (!query) return;
    let alive = true;
    loadPhoto(query, orientation).then(p => { if (alive) setPhoto(p); });
    return () => { alive = false; };
  }, [query, orientation]);
  return photo;
};

/**
 * Image slot. With `photo` it shows a Pexels stock photo for that query; the
 * palette gradient stays underneath while it loads and as the fallback when
 * the server has no Pexels key.
 */
export const Hero: React.FC<Div & { ratio?: string | number; photo?: string; orientation?: PhotoOrientation; thumb?: boolean }> = ({
  ratio = '16/9', photo: query, orientation, thumb, className, style, children, ...rest
}) => {
  const photo = useStockPhoto(query, orientation ?? (String(ratio) === '1' ? 'square' : 'landscape'));
  const [ready, setReady] = useState(false);
  return (
    <div className={cx('hero', photo && 'has-photo', className)} style={{ aspectRatio: ratio as any, ...style }} aria-hidden {...rest}>
      {photo && (
        <img src={thumb ? photo.small : photo.src} alt="" title={`Photo: ${photo.credit} / Pexels`} loading="lazy" referrerPolicy="no-referrer"
          className={ready ? 'ready' : undefined} onLoad={() => setReady(true)} />
      )}
      {children}
    </div>
  );
};

/** Inline status callout (success, warning, danger, info; default uses the accent). */
export const Note: React.FC<Div & { tone?: 'accent' | 'success' | 'warning' | 'danger' | 'info'; icon?: React.ReactNode }> = ({ tone = 'accent', icon, className, children, ...rest }) => (
  <div className={cx('note', tone !== 'accent' && tone, className)} role={tone === 'danger' ? 'alert' : 'status'} {...rest}>
    {icon}<span>{children}</span>
  </div>
);

/** Helper or validation text under a field. */
export const Hint: React.FC<React.HTMLAttributes<HTMLParagraphElement> & { tone?: 'neutral' | 'success' | 'warning' | 'danger' | 'info' }> = ({ tone = 'neutral', className, ...rest }) => (
  <p className={cx('hint', tone !== 'neutral' && tone, className)} {...rest} />
);

export const Divider = () => <div className="divider" role="separator" />;
export const Stat: React.FC<Div> = ({ className, ...rest }) => <p className={cx('stat', className)} {...rest} />;
