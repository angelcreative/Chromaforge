import { motion } from 'motion/react';
import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { MotionButton, enterMotion, popMotion, useReduced } from './uiMotion';
import { ColorData, GlobalCurveConfig, PlaygroundConfig, Shade } from '../types';
import { generateShades } from '../utils/colorUtils';
import { PLAYGROUND_CARDS } from './cards/CardsSidebar';
import { PlaygroundCardPreview } from './cards/CardsViewer';
import { buildPlaygroundTheme } from './cards/playgroundTheme';

interface PlaygroundCardsProps {
  brandPalette: ColorData[];
  neutralPalette: ColorData[];
  semanticPalette: ColorData[];
  config: PlaygroundConfig;
  globalConfig?: GlobalCurveConfig;
  onPrimaryColorChange: (hex: string) => void;
}

const place = (anchor: DOMRect, width: number, height: number) => {
  const gap = 8;
  const margin = 8;
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  let left = anchor.left + anchor.width / 2 - width / 2;
  let top = anchor.bottom + gap;
  let originY: 'top' | 'bottom' = 'top';
  if (top + height > viewportHeight - margin && anchor.top - gap - height >= margin) {
    top = anchor.top - gap - height;
    originY = 'bottom';
  }
  left = Math.min(Math.max(left, margin), Math.max(margin, viewportWidth - margin - width));
  top = Math.min(Math.max(top, margin), Math.max(margin, viewportHeight - margin - height));
  const mid = anchor.left + anchor.width / 2;
  const originX = Math.min(Math.max(mid - left, 8), Math.max(8, width - 8));
  return { top, left, transformOrigin: `${originX}px ${originY}` };
};

interface PaletteColorControlProps {
  cardName: string;
  swatch: string;
  primaryHex: string;
  shades: Shade[];
  onChange: (hex: string) => void;
}

const PaletteColorControl: React.FC<PaletteColorControlProps> = ({
  cardName,
  swatch,
  primaryHex,
  shades,
  onChange,
}) => {
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const onClosed = useRef<() => void>(() => {});
  const finished = useRef(false);
  const focused = useRef(false);
  const reduce = useReduced();
  const [open, setOpen] = useState(false);
  const [closing, setClosing] = useState(false);
  const pop = popMotion(reduce, closing);
  const [box, setBox] = useState<{ top: number; left: number; transformOrigin: string } | null>(null);

  const finish = () => {
    if (finished.current) return;
    finished.current = true;
    setOpen(false);
    setClosing(false);
    setBox(null);
    onClosed.current();
  };
  onClosed.current = () => {
    const trigger = triggerRef.current;
    if (trigger && panelRef.current?.contains(document.activeElement)) trigger.focus();
  };

  const requestClose = () => {
    setClosing((current) => {
      if (!open || current) return current;
      return true;
    });
  };

  const toggle = () => {
    if (open && !closing) {
      requestClose();
      return;
    }
    if (open) return;
    finished.current = false;
    setBox(null);
    setClosing(false);
    setOpen(true);
  };

  useLayoutEffect(() => {
    if (!open) return;
    const panel = panelRef.current;
    const anchor = triggerRef.current;
    if (!panel || !anchor) return;
    const measure = () => {
      const rect = anchor.getBoundingClientRect();
      const width = panel.offsetWidth || 220;
      const height = panel.offsetHeight || panel.scrollHeight;
      setBox(place(rect, width, height));
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(panel);
    window.addEventListener('resize', measure);
    window.addEventListener('scroll', measure, true);
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', measure);
      window.removeEventListener('scroll', measure, true);
    };
  }, [open, shades.length]);

  useEffect(() => {
    if (!open) return;
    const onPointer = (event: PointerEvent) => {
      const target = event.target as Node | null;
      if (!target) return;
      if (panelRef.current?.contains(target)) return;
      if (triggerRef.current?.contains(target)) return;
      requestClose();
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') requestClose();
    };
    document.addEventListener('pointerdown', onPointer);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onPointer);
      document.removeEventListener('keydown', onKey);
    };
  }, [open, closing]);

  useEffect(() => {
    if (!open) {
      focused.current = false;
      return;
    }
    if (closing || !box || focused.current) return;
    focused.current = true;
    const selected = panelRef.current?.querySelector<HTMLElement>('[aria-selected="true"]');
    (selected ?? panelRef.current?.querySelector<HTMLElement>('button'))?.focus();
  }, [open, closing, box]);

  useEffect(() => {
    if (!closing) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      finish();
      return;
    }
    const timer = window.setTimeout(finish, 160);
    return () => window.clearTimeout(timer);
  }, [closing]);

  const panel = open ? createPortal(
    <motion.div
      ref={panelRef}
      role="dialog"
      aria-label="Palette color"
      data-palette-color-popover
      className="palette-color-pop fixed z-[60] rounded-xl bg-popover p-2 text-popover-foreground shadow-panel ring-1 ring-border"
      style={box ? { top: box.top, left: box.left, transformOrigin: box.transformOrigin } : { top: -9999, left: 0 }}
      initial={pop.initial}
      animate={pop.animate}
      transition={pop.transition}
    >
      <div className="grid grid-cols-6 gap-1.5" role="listbox" aria-label="Palette steps">
        {shades.map((shade) => {
          const selected = shade.hex.toLowerCase() === swatch;
          return (
            <MotionButton
              key={shade.level}
              type="button"
              role="option"
              aria-selected={selected}
              aria-label={`Step ${shade.level}, ${shade.hex}`}
              onClick={() => {
                onChange(shade.hex);
                requestClose();
              }}
              className={`size-8 rounded-md outline-none focus-visible:ring-2 focus-visible:ring-foreground focus-visible:ring-offset-2 focus-visible:ring-offset-popover ${selected ? 'ring-2 ring-foreground ring-offset-2 ring-offset-popover' : 'ring-1 ring-border'}`}
              style={{ backgroundColor: shade.hex }}
            />
          );
        })}
      </div>
    </motion.div>,
    document.body,
  ) : null;

  return (
    <div className="flex items-center gap-2 text-[13px] text-muted-foreground">
      <span>Palette color</span>
      <button
        ref={triggerRef}
        type="button"
        data-palette-color-trigger
        aria-label={`Palette color on ${cardName}`}
        aria-haspopup="dialog"
        aria-expanded={open && !closing}
        onClick={toggle}
        className="size-8 cursor-pointer rounded-md border border-border"
        style={{ backgroundColor: swatch }}
      />
      <span className="font-mono text-[12px] text-foreground" data-palette-color={primaryHex}>
        {primaryHex}
      </span>
      {panel}
    </div>
  );
};

const PlaygroundCards: React.FC<PlaygroundCardsProps> = ({
  brandPalette,
  neutralPalette,
  semanticPalette,
  config,
  globalConfig,
  onPrimaryColorChange,
}) => {
  const reduce = useReduced();
  const theme = useMemo(
    () => buildPlaygroundTheme(brandPalette, neutralPalette, semanticPalette, config, globalConfig),
    [brandPalette, neutralPalette, semanticPalette, config, globalConfig],
  );
  const primary = brandPalette[config.primaryIndex] || brandPalette[0];
  const primaryHex = primary?.hex ?? '#000000';
  const swatch = /^#[0-9a-f]{6}$/i.test(primaryHex) ? primaryHex.toLowerCase() : '#000000';
  const shades = useMemo(
    () => (primary ? generateShades(primary, globalConfig) : []),
    [primary, globalConfig],
  );

  if (!theme || !primary) {
    return <p className="text-[13px] text-muted-foreground">Generate a palette first to activate the playground.</p>;
  }

  return (
    <section aria-label="Playground cards" data-view="playground-cards" className="grid grid-cols-1 gap-6 xl:grid-cols-2">
      {PLAYGROUND_CARDS.map((card, index) => (
        <motion.article
          key={card.id}
          className="flex flex-col gap-3 rounded-2xl bg-card p-3 shadow-panel ring-1 ring-border"
          {...enterMotion(reduce, index)}
          whileTap={reduce ? undefined : { scale: 0.99 }}
        >
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-[13px] text-foreground">{card.name}</h2>
            <PaletteColorControl
              cardName={card.name}
              swatch={swatch}
              primaryHex={primaryHex}
              shades={shades}
              onChange={onPrimaryColorChange}
            />
          </div>
          <div className="flex justify-center overflow-hidden rounded-xl p-4" style={{ backgroundColor: theme.bg.page }}>
            <PlaygroundCardPreview cardId={card.id} theme={theme} />
          </div>
        </motion.article>
      ))}
    </section>
  );
};

export default PlaygroundCards;
