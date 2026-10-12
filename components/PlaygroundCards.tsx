import React, { useMemo } from 'react';
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
  onPrimaryColorChange: (hex: string) => void;
}

const PlaygroundCards: React.FC<PlaygroundCardsProps> = ({
  brandPalette,
  neutralPalette,
  semanticPalette,
  config,
  globalConfig,
  onPrimaryColorChange,
}) => {
  const theme = useMemo(
    () => buildPlaygroundTheme(brandPalette, neutralPalette, semanticPalette, config, globalConfig),
    [brandPalette, neutralPalette, semanticPalette, config, globalConfig],
  );
  const primary = brandPalette[config.primaryIndex] || brandPalette[0];
  const primaryHex = primary?.hex ?? '#000000';
  const swatch = /^#[0-9a-f]{6}$/i.test(primaryHex) ? primaryHex.toLowerCase() : '#000000';

  if (!theme || !primary) {
    return <p className="text-[13px] text-muted-foreground">Generate a palette first to activate the playground.</p>;
  }

  return (
    <section aria-label="Playground cards" data-view="playground-cards" className="grid grid-cols-1 gap-6 xl:grid-cols-2">
      {PLAYGROUND_CARDS.map((card, index) => (
        <article
          key={card.id}
          className="studio-card flex flex-col gap-3 rounded-2xl bg-card p-3 shadow-panel ring-1 ring-border"
          style={{ animationDelay: `${Math.min(index, 8) * 28}ms` }}
        >
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-[13px] text-foreground">{card.name}</h2>
            <label className="flex items-center gap-2 text-[13px] text-muted-foreground">
              Palette color
              <input
                type="color"
                value={swatch}
                aria-label={`Palette color on ${card.name}`}
                onChange={(event) => onPrimaryColorChange(event.target.value)}
                className="size-8 cursor-pointer rounded-md border border-border bg-transparent p-0"
              />
              <span className="font-mono text-[12px] text-foreground" data-palette-color={primaryHex}>
                {primaryHex}
              </span>
            </label>
          </div>
          <div className="flex justify-center overflow-hidden rounded-xl p-4" style={{ backgroundColor: theme.bg.page }}>
            <PlaygroundCardPreview cardId={card.id} theme={theme} />
          </div>
        </article>
      ))}
    </section>
  );
};

export default PlaygroundCards;
