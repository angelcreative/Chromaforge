import React, { useEffect } from 'react';
import * as Popover from '@radix-ui/react-popover';
import { LayoutGroup, motion } from 'motion/react';
import { Check } from 'lucide-react';
import { ColorData, PlaygroundConfig } from '../../types';
import { hexToRgb, rgbToOklch } from '../../utils/colorUtils';
import { Hint } from '../Hint';
import { useReduced } from '../uiMotion';

/**
 * Palette swatches for the Playground with an optional 60-30-10 mode.
 *
 * Off: a swatch picks the primary (accent) colour, as before.
 * On: every swatch can hold one of three roles. 60 is the dominant colour
 * (backgrounds and surfaces), 30 the secondary (supporting elements) and 10
 * the accent (actions). The role badges slide between swatches when they move.
 */

type Role = 60 | 30 | 10;

const ROLES: { role: Role; name: string; use: string }[] = [
  { role: 60, name: 'Dominant', use: 'Page background' },
  { role: 30, name: 'Secondary', use: 'Chips, avatars, charts and images' },
  { role: 10, name: 'Accent', use: 'Buttons, links and active states' },
];

const chroma = (hex: string) => {
  const { r, g, b } = hexToRgb(hex);
  return rgbToOklch(r, g, b).c;
};

type Roles = Record<Role, number>;

const rolesOf = (config: PlaygroundConfig): Roles => ({
  60: config.dominantIndex ?? -1,
  30: config.secondaryIndex ?? -1,
  10: config.primaryIndex,
});

const validRoles = (roles: Roles, count: number) => {
  const values = [roles[60], roles[30], roles[10]];
  return values.every(v => v >= 0 && v < count) && new Set(values).size === 3;
};

/** Calmest colour dominates, the current primary (or the most vivid) accents, the next most vivid supports. */
export const autoRoles = (palette: ColorData[], primaryIndex: number): Roles => {
  const ranked = palette.map((c, i) => ({ i, c: chroma(c.hex) }));
  const dominant = [...ranked].sort((a, b) => a.c - b.c)[0].i;
  const accent = primaryIndex !== dominant && primaryIndex < palette.length
    ? primaryIndex
    : [...ranked].filter(r => r.i !== dominant).sort((a, b) => b.c - a.c)[0].i;
  const secondary = [...ranked].filter(r => r.i !== dominant && r.i !== accent).sort((a, b) => b.c - a.c)[0].i;
  return { 60: dominant, 30: secondary, 10: accent };
};

const withRoles = (config: PlaygroundConfig, roles: Roles): PlaygroundConfig => ({
  ...config, dominantIndex: roles[60], secondaryIndex: roles[30], primaryIndex: roles[10],
});

interface Props {
  palette: ColorData[];
  config: PlaygroundConfig;
  onConfigChange: (next: PlaygroundConfig) => void;
}

const RoleSwatches: React.FC<Props> = ({ palette, config, onConfigChange }) => {
  const reduce = useReduced();
  const canUseRule = palette.length >= 3;
  const ruleOn = !!config.ruleActive && canUseRule;
  const roles = rolesOf(config);
  const selectedIndex = palette.length ? Math.min(Math.max(config.primaryIndex, 0), palette.length - 1) : 0;

  // Keep roles valid when the palette changes underneath (colours added or removed).
  useEffect(() => {
    if (ruleOn && !validRoles(roles, palette.length)) onConfigChange(withRoles(config, autoRoles(palette, config.primaryIndex)));
  });

  const toggle = () => {
    if (ruleOn) { onConfigChange({ ...config, ruleActive: false }); return; }
    const next = validRoles(roles, palette.length) ? roles : autoRoles(palette, config.primaryIndex);
    onConfigChange({ ...withRoles(config, next), ruleActive: true });
  };

  const assign = (index: number, role: Role) => {
    const next = { ...roles };
    const holder = next[role];
    const previous = ROLES.map(r => r.role).find(r => next[r] === index);
    next[role] = index;
    if (previous !== undefined && holder !== index) next[previous] = holder; // swap
    onConfigChange(withRoles(config, next));
  };

  const roleAt = (index: number): Role | undefined => ROLES.find(r => roles[r.role] === index)?.role;
  const spring = reduce ? { duration: 0 } : { type: 'spring' as const, stiffness: 520, damping: 34 };

  return (
    <div className="flex items-center gap-3">
      <LayoutGroup id="pg-roles">
        <div className="flex items-center gap-1.5" role={ruleOn ? 'group' : 'radiogroup'} aria-label={ruleOn ? 'Colour roles' : 'Primary color'}>
          {palette.map((c, i) => {
            const role = roleAt(i);
            const swatch = (
              <span className="relative block size-6 rounded-full" style={{ background: c.hex }}>
                {ruleOn && role && (
                  <motion.span layoutId={`role-${role}`} transition={spring}
                    className="absolute -bottom-2 left-1/2 -translate-x-1/2 rounded-full bg-foreground px-1 text-[9px] font-semibold leading-[14px] text-background shadow-panel">
                    {role}
                  </motion.span>
                )}
              </span>
            );
            if (!ruleOn) {
              return (
                <button key={`${c.hex}-${i}`} type="button" role="radio" aria-checked={i === selectedIndex} aria-label={`${c.name} as primary`}
                  onClick={() => onConfigChange({ ...config, primaryIndex: i })}
                  className={`rounded-full ring-2 ring-offset-2 ring-offset-background transition ${i === selectedIndex ? 'ring-foreground' : 'ring-transparent hover:ring-border'}`}>
                  {swatch}
                </button>
              );
            }
            return (
              <Popover.Root key={`${c.hex}-${i}`}>
                <Popover.Trigger asChild>
                  <motion.button type="button" whileHover={reduce ? undefined : { y: -2 }} whileTap={reduce ? undefined : { scale: 0.92 }}
                    aria-label={`${c.name}: ${role ? `${ROLES.find(r => r.role === role)!.name.toLowerCase()} ${role}%` : 'no role'}. Change role`}
                    className={`rounded-full ring-2 ring-offset-2 ring-offset-background transition-[opacity,box-shadow] ${role ? 'ring-foreground' : 'opacity-40 ring-transparent hover:opacity-100'}`}>
                    {swatch}
                  </motion.button>
                </Popover.Trigger>
                <Popover.Portal>
                  <Popover.Content side="bottom" align="center" sideOffset={14}
                    className="z-50 w-64 rounded-xl bg-card p-1.5 text-foreground shadow-panel ring-1 ring-border">
                    <div className="flex items-center gap-2 px-2 pb-1.5 pt-1 text-[12px] text-muted-foreground">
                      <span className="size-3 rounded-full ring-1 ring-border" style={{ background: c.hex }} />Use {c.name} as
                    </div>
                    {ROLES.map(r => (
                      <Popover.Close asChild key={r.role}>
                        <button type="button" onClick={() => assign(i, r.role)} aria-pressed={role === r.role}
                          className={`flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left hover:bg-accent ${role === r.role ? 'bg-accent' : ''}`}>
                          <span className="grid h-6 w-8 shrink-0 place-items-center rounded-md bg-foreground text-[11px] font-semibold text-background">{r.role}</span>
                          <span className="min-w-0 flex-1">
                            <span className="block text-[13px]">{r.name}</span>
                            <span className="block text-[12px] text-muted-foreground">{r.use}</span>
                          </span>
                          {role === r.role && <Check className="size-4 shrink-0" strokeWidth={1.5} aria-hidden />}
                        </button>
                      </Popover.Close>
                    ))}
                  </Popover.Content>
                </Popover.Portal>
              </Popover.Root>
            );
          })}
        </div>
      </LayoutGroup>

      <Hint label={canUseRule ? (ruleOn ? 'Turn off the 60-30-10 rule' : 'Apply the 60-30-10 rule: pick a dominant, secondary and accent color') : 'Needs at least 3 colors'}>
        <span>
          <button type="button" onClick={toggle} disabled={!canUseRule} aria-pressed={ruleOn}
            className={`relative inline-flex h-8 items-center gap-2 overflow-hidden rounded-lg px-2.5 text-[12px] transition-colors disabled:opacity-40 ${ruleOn ? 'bg-foreground text-background' : 'bg-accent text-muted-foreground hover:text-foreground'}`}>
            <span className="flex h-3 w-6 overflow-hidden rounded-sm" aria-hidden>
              <motion.i className="block h-full" animate={{ width: ruleOn ? '60%' : '34%' }} transition={spring} style={{ background: ruleOn ? palette[roles[60]]?.hex : 'currentColor', opacity: ruleOn ? 1 : 0.5 }} />
              <motion.i className="block h-full" animate={{ width: ruleOn ? '30%' : '33%' }} transition={spring} style={{ background: ruleOn ? palette[roles[30]]?.hex : 'currentColor', opacity: ruleOn ? 1 : 0.3 }} />
              <motion.i className="block h-full" animate={{ width: ruleOn ? '10%' : '33%' }} transition={spring} style={{ background: ruleOn ? palette[roles[10]]?.hex : 'currentColor', opacity: ruleOn ? 1 : 0.15 }} />
            </span>
            60·30·10
          </button>
        </span>
      </Hint>
    </div>
  );
};

/** The 60/30/10 proportion strip that replaces the ramp strip while the rule is on. */
export const RoleBar: React.FC<{ palette: ColorData[]; config: PlaygroundConfig }> = ({ palette, config }) => {
  const reduce = useReduced();
  const roles = rolesOf(config);
  const parts: [Role, string][] = [[60, palette[roles[60]]?.hex], [30, palette[roles[30]]?.hex], [10, palette[roles[10]]?.hex]];
  return (
    <div className="mt-4 flex h-2 gap-0.5 overflow-hidden rounded-full" aria-hidden>
      {parts.map(([role, hex]) => (
        <motion.span key={role} initial={reduce ? false : { width: '33%' }} animate={{ width: `${role}%` }}
          transition={reduce ? { duration: 0 } : { type: 'spring', stiffness: 260, damping: 30 }}
          className="block h-full transition-colors duration-300" style={{ background: hex }} />
      ))}
    </div>
  );
};

export default RoleSwatches;
