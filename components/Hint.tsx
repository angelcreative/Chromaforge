import * as Tooltip from '@radix-ui/react-tooltip';
import React from 'react';

interface HintProps {
  label: string;
  side?: 'top' | 'right' | 'bottom' | 'left';
  /** Hide the hint, e.g. while the control's own menu or panel is open. */
  disabled?: boolean;
  children: React.ReactElement;
}

/** Short label shown on hover and keyboard focus for icon-only controls. */
export const Hint: React.FC<HintProps> = ({ label, side = 'top', disabled = false, children }) => (
  <Tooltip.Provider delayDuration={300} skipDelayDuration={200}>
    <Tooltip.Root open={disabled ? false : undefined}>
      <Tooltip.Trigger asChild>{children}</Tooltip.Trigger>
      <Tooltip.Portal>
        <Tooltip.Content
          side={side}
          sideOffset={6}
          collisionPadding={8}
          className="z-[100] select-none rounded-md bg-primary px-2 py-1 text-[12px] text-primary-foreground shadow-panel"
        >
          {label}
        </Tooltip.Content>
      </Tooltip.Portal>
    </Tooltip.Root>
  </Tooltip.Provider>
);
