/**
 * PillarBadge — Small colored chip showing the pillar name.
 *
 * Renders a pill-shaped badge with the pillar accent color as background
 * and white text. Three sizes: sm, md, lg.
 */

import React from 'react';
import { PILLARS, type PillarNumber } from '../constants';
import { FONT_FAMILY } from '../utils/fonts';

interface PillarBadgeProps {
  /** Which content pillar (1 = Warmth, 2 = Momentum, 3 = Precision) */
  pillar: PillarNumber;
  /** Badge size variant */
  size?: 'sm' | 'md' | 'lg';
}

const SIZE_MAP = {
  sm: { fontSize: 10, paddingTop: 4, paddingBottom: 4, paddingLeft: 8, paddingRight: 8 },
  md: { fontSize: 12, paddingTop: 6, paddingBottom: 6, paddingLeft: 12, paddingRight: 12 },
  lg: { fontSize: 14, paddingTop: 8, paddingBottom: 8, paddingLeft: 16, paddingRight: 16 },
} as const;

export const PillarBadge: React.FC<PillarBadgeProps> = ({ pillar, size = 'md' }) => {
  const config = PILLARS[pillar];
  const sizeTokens = SIZE_MAP[size];

  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: config.accent,
        color: '#FFFFFF',
        fontFamily: FONT_FAMILY.code,
        fontWeight: 600,
        fontSize: sizeTokens.fontSize,
        paddingTop: sizeTokens.paddingTop,
        paddingBottom: sizeTokens.paddingBottom,
        paddingLeft: sizeTokens.paddingLeft,
        paddingRight: sizeTokens.paddingRight,
        borderRadius: 999,
        lineHeight: 1.2,
        letterSpacing: 0.3,
        whiteSpace: 'nowrap',
      }}
    >
      {config.label}
    </div>
  );
};
