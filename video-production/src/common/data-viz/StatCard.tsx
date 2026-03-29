/**
 * StatCard — Single metric display with animated count-up
 */

import React from 'react';
import { interpolate } from 'remotion';
import { useSpring } from '../animations/springs';
import { CountUp } from '../typography/CountUp';
import { AccentBar } from '../layout/AccentBar';
import type { BrandTokens } from '../utils/brand-tokens';

interface StatCardProps {
  value: number;
  label: string;
  tokens: BrandTokens;
  delay?: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
}

export const StatCard: React.FC<StatCardProps> = ({
  value,
  label,
  tokens,
  delay = 0,
  prefix,
  suffix,
  decimals,
}) => {
  const { scale, opacity } = (() => {
    const progress = useSpring({ delay, config: 'bouncy' });
    return {
      scale: interpolate(progress, [0, 1], [0.8, 1]),
      opacity: interpolate(progress, [0, 0.3], [0, 1], { extrapolateRight: 'clamp' }),
    };
  })();

  return (
    <div
      style={{
        opacity,
        transform: `scale(${scale})`,
        backgroundColor: tokens.bg.surface,
        border: `1px solid ${tokens.border}`,
        borderRadius: tokens.borderRadius,
        padding: '24px 32px',
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
      }}
    >
      <AccentBar color={tokens.accent.primary} delay={delay + 5} />
      <CountUp
        target={value}
        tokens={tokens}
        delay={delay + 8}
        prefix={prefix}
        suffix={suffix}
        decimals={decimals}
        fontSize={tokens.fontSizes.h1}
      />
      <span
        style={{
          fontFamily: tokens.fonts.body,
          fontSize: tokens.fontSizes.caption,
          color: tokens.text.secondary,
          textTransform: 'uppercase',
          letterSpacing: '0.1em',
        }}
      >
        {label}
      </span>
    </div>
  );
};
