import React from 'react';
import PigmentoOrb from './PigmentoOrb';

/**
 * Pigmento as a small decorative icon inside another control (the orb with
 * eyes). Takes no focus or clicks; the surrounding button carries the label.
 */
const PigmentoMark: React.FC<{ className?: string; colors?: string[] }> = ({ className = 'size-5', colors }) => (
  <PigmentoOrb className={`pointer-events-none ${className}`} colors={colors} />
);

export default PigmentoMark;
