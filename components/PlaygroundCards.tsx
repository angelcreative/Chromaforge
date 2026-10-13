import { motion } from 'motion/react';
import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { MotionButton, enterMotion, popMotion, useReduced } from './uiMotion';
import { ColorData, GlobalCurveConfig, PlaygroundConfig } from '../types';
import { PLAYGROUND_CARDS } from './cards/CardsSidebar';
import { PlaygroundCardPreview } from './cards/CardsViewer';
import { buildPlaygroundTheme } from './cards/playgroundTheme';

interface PlaygroundCardsProps {
  brandPalette: ColorData[];
  neutralPalette: ColorData[];
  semanticPalette: ColorData[];
  config: PlaygroundConfig;
  globalConfig?: GlobalCurveConfig;
  onPrimaryIndex: (index: number) => void;
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
  swatches: ColorData[];
  selectedIndex: number;
  onChange: (index: number) => void;
}

const PaletteColorControl: React.FC<PaletteColorControlProps> = ({
  cardName,
  swatches,
  selectedIndex,
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
  }, [open, swatches.length]);

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
      <div className="flex max-h-72 w-[min(16rem,calc(100vw-2rem))] flex-col gap-0.5 overflow-y-auto" role="listbox" aria-label="Palette colors">
        {swatches.map((color, index) => {
          const selected = index === selectedIndex;
          return (
            <MotionButton
              key={`${color.name}-${color.hex}-${index}`}
              type="button"
              role="option"
              aria-selected={selected}
              aria-label={`${color.name}, ${color.hex}`}
              onClick={() => {
                onChange(index);
                requestClose();
              }}
              className={`flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left outline-none focus-visible:ring-2 focus-visible:ring-foreground ${selected ? 'bg-accent' : 'hover:bg-accent'}`}
            >
              <span className="size-6 shrink-0 rounded-md ring-1 ring-border" style={{ backgroundColor: color.hex }} />
              <span className="min-w-0 flex-1 text-[13px] leading-snug text-foreground">{color.name}</span>
              <span className="shrink-0 font-mono text-[12px] text-muted-foreground">{color.hex}</span>
            </MotionButton>
          );
        })}
      </div>
    </motion.div>,
    document.body,
  ) : null;

  const selected = swatches[selectedIndex] || swatches[0];
  const primaryHex = selected?.hex ?? '#000000';
  const swatch = /^#[0-9a-f]{6}$/i.test(primaryHex) ? primaryHex.toLowerCase() : '#000000';

  return (
    <div className="flex items-center gap-2 text-[13px] text-muted-foreground">
      <span className="whitespace-nowrap">Palette color</span>
      <button
        ref={triggerRef}
        type="button"
        data-palette-color-trigger
        aria-label={`Palette color on ${cardName}`}
        aria-haspopup="dialog"
        aria-expanded={open && !closing}
        onClick={toggle}
        className="size-8 shrink-0 cursor-pointer rounded-md border border-border"
        style={{ backgroundColor: swatch }}
      />
      <span className="whitespace-nowrap font-mono text-[12px] text-foreground" data-palette-color={primaryHex}>
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
  onPrimaryIndex,
}) => {
  const reduce = useReduced();
  const selectedIndex = brandPalette.length === 0
    ? 0
    : Math.min(Math.max(config.primaryIndex, 0), brandPalette.length - 1);
  const primary = brandPalette[selectedIndex] || brandPalette[0];
  const theme = useMemo(
    () => buildPlaygroundTheme(
      brandPalette,
      neutralPalette,
      semanticPalette,
      { ...config, primaryIndex: selectedIndex },
      globalConfig,
    ),
    [brandPalette, neutralPalette, semanticPalette, config, selectedIndex, globalConfig],
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
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-[13px] text-foreground">{card.name}</h2>
            <PaletteColorControl
              cardName={card.name}
              swatches={brandPalette}
              selectedIndex={selectedIndex}
              onChange={onPrimaryIndex}
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
