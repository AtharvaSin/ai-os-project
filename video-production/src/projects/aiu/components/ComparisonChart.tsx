/**
 * ComparisonChart — Side-by-side comparison in Think School style.
 *
 * Supports two display modes:
 * - 'bars': Horizontal bars with animated fill and staggered entrance.
 * - 'cards': Side-by-side cards with large values and staggered spring entrance.
 *
 * Used for data comparisons, feature scoring, and before/after metrics.
 */

import React from 'react';
import { useCurrentFrame, useVideoConfig, spring, interpolate } from 'remotion';
import { COLORS, SIZING, type PillarNumber } from '../constants';
import { getPillarColor, withOpacity } from '../utils/colors';
import { SPRING_CONFIGS, useSpring } from '../utils/animations';
import { FONT_FAMILY } from '../utils/fonts';

interface ComparisonItem {
  label: string;
  value: number;
  color?: string;
}

interface ComparisonChartProps {
  /** Data items to compare */
  items: ComparisonItem[];
  /** Display mode: horizontal bars or side-by-side cards */
  type: 'bars' | 'cards';
  /** Which content pillar determines the default accent color */
  pillar: PillarNumber;
  /** Frame delay before the entrance animation starts */
  delay?: number;
}

/** Stagger interval in frames between each item's entrance */
const STAGGER_FRAMES = 5;

export const ComparisonChart: React.FC<ComparisonChartProps> = ({
  items,
  type,
  pillar,
  delay = 0,
}) => {
  const accent = getPillarColor(pillar);
  const containerSpring = useSpring({ delay, config: 'smooth' });
  const containerOpacity = interpolate(containerSpring, [0, 0.3], [0, 1], {
    extrapolateRight: 'clamp',
  });

  return (
    <div
      style={{
        opacity: containerOpacity,
        backgroundColor: COLORS.bg.card,
        borderRadius: SIZING.borderRadius,
        border: `1px solid ${COLORS.border}`,
        padding: SIZING.cardPadding,
        boxShadow: `0 8px 32px ${withOpacity('#000000', 0.4)}`,
        display: 'flex',
        flexDirection: type === 'bars' ? 'column' : 'row',
        gap: type === 'bars' ? 16 : 12,
      }}
    >
      {type === 'bars'
        ? items.map((item, index) => (
            <BarRow
              key={item.label}
              item={item}
              index={index}
              accent={accent}
              delay={delay}
              maxValue={Math.max(...items.map((i) => i.value))}
            />
          ))
        : items.map((item, index) => (
            <CardCell
              key={item.label}
              item={item}
              index={index}
              accent={accent}
              delay={delay}
            />
          ))}
    </div>
  );
};

// ── Bar Mode Row ────────────────────────────────────────────

interface BarRowProps {
  item: ComparisonItem;
  index: number;
  accent: string;
  delay: number;
  maxValue: number;
}

const BarRow: React.FC<BarRowProps> = ({ item, index, accent, delay, maxValue }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const itemDelay = delay + index * STAGGER_FRAMES;

  const fillProgress = spring({
    frame: frame - itemDelay,
    fps,
    config: SPRING_CONFIGS.smooth,
  });

  const barColor = item.color ?? accent;
  const fillPercent = maxValue > 0 ? (item.value / maxValue) * 100 : 0;
  const animatedWidth = interpolate(fillProgress, [0, 1], [0, fillPercent]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {/* Label and value row */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'baseline',
        }}
      >
        <span
          style={{
            fontFamily: FONT_FAMILY.body,
            fontWeight: 500,
            fontSize: 14,
            color: COLORS.text.secondary,
          }}
        >
          {item.label}
        </span>
        <span
          style={{
            fontFamily: FONT_FAMILY.display,
            fontWeight: 700,
            fontSize: 16,
            color: COLORS.text.primary,
          }}
        >
          {item.value}
        </span>
      </div>

      {/* Bar track and fill */}
      <div
        style={{
          width: '100%',
          height: 8,
          backgroundColor: COLORS.border,
          borderRadius: 4,
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            height: '100%',
            width: `${animatedWidth}%`,
            backgroundColor: barColor,
            borderRadius: 4,
            transition: 'none',
          }}
        />
      </div>
    </div>
  );
};

// ── Card Mode Cell ──────────────────────────────────────────

interface CardCellProps {
  item: ComparisonItem;
  index: number;
  accent: string;
  delay: number;
}

const CardCell: React.FC<CardCellProps> = ({ item, index, accent, delay }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const itemDelay = delay + index * STAGGER_FRAMES;

  const scaleProgress = spring({
    frame: frame - itemDelay,
    fps,
    config: SPRING_CONFIGS.bouncy,
  });

  const scale = interpolate(scaleProgress, [0, 1], [0.3, 1]);
  const opacity = interpolate(scaleProgress, [0, 0.2], [0, 1], {
    extrapolateRight: 'clamp',
  });

  const cardColor = item.color ?? accent;

  return (
    <div
      style={{
        flex: 1,
        transform: `scale(${scale})`,
        opacity,
        backgroundColor: COLORS.bg.elevated,
        borderRadius: SIZING.borderRadiusSm,
        border: `1px solid ${COLORS.border}`,
        padding: SIZING.cardPaddingSm,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 8,
      }}
    >
      <div
        style={{
          fontFamily: FONT_FAMILY.display,
          fontWeight: 700,
          fontSize: 32,
          color: cardColor,
          lineHeight: 1.1,
        }}
      >
        {item.value}
      </div>
      <div
        style={{
          fontFamily: FONT_FAMILY.body,
          fontWeight: 500,
          fontSize: 13,
          color: COLORS.text.secondary,
          textAlign: 'center',
          lineHeight: 1.3,
        }}
      >
        {item.label}
      </div>
    </div>
  );
};
