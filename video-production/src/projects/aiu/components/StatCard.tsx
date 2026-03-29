/**
 * StatCard — Data point overlay in Think School style.
 *
 * Displays a single statistic with large value, descriptive label,
 * and optional source attribution. The card scales in with a spring
 * animation and features a pillar accent top border.
 */

import React from 'react';
import { COLORS, SIZING, type PillarNumber } from '../constants';
import { getPillarColor, withOpacity } from '../utils/colors';
import { useScaleIn } from '../utils/animations';
import { FONT_FAMILY } from '../utils/fonts';

interface StatCardProps {
  /** The stat value to display prominently, e.g. "73%" */
  value: string;
  /** Description beneath the value, e.g. "of developers use AI daily" */
  label: string;
  /** Optional source attribution, e.g. "Stack Overflow 2025" */
  source?: string;
  /** Which content pillar determines the accent color */
  pillar: PillarNumber;
  /** Frame delay before the entrance animation starts */
  delay?: number;
}

export const StatCard: React.FC<StatCardProps> = ({
  value,
  label,
  source,
  pillar,
  delay = 0,
}) => {
  const accent = getPillarColor(pillar);
  const { scale, opacity } = useScaleIn(delay);

  return (
    <div
      style={{
        transform: `scale(${scale})`,
        opacity,
        maxWidth: 320,
        backgroundColor: COLORS.bg.card,
        borderRadius: SIZING.borderRadius,
        border: `1px solid ${COLORS.border}`,
        borderTop: `3px solid ${accent}`,
        padding: SIZING.cardPadding,
        boxShadow: `0 8px 32px ${withOpacity('#000000', 0.4)}`,
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
      }}
    >
      {/* Large stat value */}
      <div
        style={{
          fontFamily: FONT_FAMILY.display,
          fontWeight: 700,
          fontSize: 48,
          lineHeight: 1.1,
          color: accent,
          letterSpacing: -0.5,
        }}
      >
        {value}
      </div>

      {/* Descriptive label */}
      <div
        style={{
          fontFamily: FONT_FAMILY.body,
          fontWeight: 400,
          fontSize: 16,
          lineHeight: 1.4,
          color: COLORS.text.secondary,
        }}
      >
        {label}
      </div>

      {/* Optional source attribution */}
      {source ? (
        <div
          style={{
            fontFamily: FONT_FAMILY.code,
            fontWeight: 400,
            fontSize: 11,
            lineHeight: 1.3,
            color: COLORS.text.muted,
            marginTop: 4,
          }}
        >
          {source}
        </div>
      ) : null}
    </div>
  );
};
