/**
 * Color utilities — common library re-exports + AI&U pillar-specific functions.
 * This shim maintains backward compatibility with existing AI&U imports.
 */

import type { CSSProperties } from 'react';

// Re-export common utilities
export {
  withOpacity,
  glowShadow,
  accentBarStyle,
  blendColors,
} from '../../../common/utils/colors';

// AI&U-specific pillar color functions
import { withOpacity } from '../../../common/utils/colors';
import { PILLARS, type PillarNumber } from '../constants';

/** Get the accent color for a given pillar number */
export function getPillarColor(pillar: PillarNumber): string {
  return PILLARS[pillar].accent;
}

/** Get the CSS gradient string for a given pillar number */
export function getPillarGradient(pillar: PillarNumber): string {
  return PILLARS[pillar].gradient;
}

/** Get the full label for a given pillar number */
export function getPillarLabel(pillar: PillarNumber): string {
  return PILLARS[pillar].label;
}

/** Get the short label for a given pillar number */
export function getPillarShortLabel(pillar: PillarNumber): string {
  return PILLARS[pillar].shortLabel;
}

/** Get a glow box-shadow for a pillar's accent color */
export function getPillarGlow(
  pillar: PillarNumber,
  intensity = 0.3,
): string {
  const color = getPillarColor(pillar);
  return `0 0 40px ${withOpacity(color, intensity)}, 0 0 80px ${withOpacity(color, intensity * 0.5)}`;
}

/** Get a left accent bar style for a pillar */
export function getPillarAccentBar(
  pillar: PillarNumber,
): CSSProperties {
  return { borderLeft: `4px solid ${getPillarColor(pillar)}` };
}

/** Get a gradient background style for a pillar */
export function getPillarGradientStyle(
  pillar: PillarNumber,
): CSSProperties {
  return { background: getPillarGradient(pillar) };
}
