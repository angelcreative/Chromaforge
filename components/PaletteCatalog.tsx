import React from 'react';
import { ColorData, GlobalCurveConfig, PaletteTab } from '../types';
import PaletteCard from './PaletteCard';

export interface CatalogGroup {
  id: PaletteTab;
  label: string;
  colors: ColorData[];
}

interface PaletteCatalogProps {
  groups: CatalogGroup[];
  onOpenGrid: (color: ColorData) => void;
  onEditScale: (color: ColorData) => void;
  onCopy: (hex: string) => void;
  onColorUpdate: (group: PaletteTab, index: number, color: ColorData) => void;
  isPrintMode: boolean;
  globalConfig: GlobalCurveConfig;
}

const PaletteCatalog: React.FC<PaletteCatalogProps> = ({
  groups,
  onOpenGrid,
  onEditScale,
  onCopy,
  onColorUpdate,
  isPrintMode,
  globalConfig,
}) => (
  <div className="flex flex-col gap-8">
    {groups.map((group, groupIndex) => (
      <section key={group.id} aria-label={group.label}>
        <h2 className="mb-3 text-[15px] font-medium text-foreground">{group.label}</h2>
        {group.colors.length === 0 ? (
          <p className="text-[13px] text-muted-foreground">No colors in this group.</p>
        ) : (
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {group.colors.map((color, index) => (
              <div
                key={`${group.id}-${color.hex}-${index}`}
                className="studio-card"
                style={{ animationDelay: `${Math.min(groupIndex * 4 + index, 6) * 28}ms` }}
              >
                <PaletteCard
                  color={color}
                  onOpenGrid={onOpenGrid}
                  onEditScale={onEditScale}
                  onCopy={onCopy}
                  onColorUpdate={(updated) => onColorUpdate(group.id, index, updated)}
                  isPrintMode={isPrintMode}
                  isCompact={false}
                  globalConfig={globalConfig}
                />
              </div>
            ))}
          </div>
        )}
      </section>
    ))}
  </div>
);

export default PaletteCatalog;
