/**
 * CountUp — Animated number counter
 */

import React from 'react';
import { interpolate } from 'remotion';
import { useSpring } from '../animations/springs';
import type { BrandTokens } from '../utils/brand-tokens';

interface CountUpProps {
  target: number;
  tokens: BrandTokens;
  delay?: number;
  /** Prefix (e.g., "$", "#") */
  prefix?: string;
  /** Suffix (e.g., "%", "+", "K") */
  suffix?: string;
  /** Decimal places (default: 0) */
  decimals?: number;
  fontSize?: number;
}

export const CountUp: React.FC<CountUpProps> = ({
  target,
  tokens,
  delay = 0,
  prefix = '',
  suffix = '',
  decimals = 0,
  fontSize,
}) => {
  const progress = useSpring({ delay, config: 'smooth' });
  const value = interpolate(progress, [0, 1], [0, target]);
  const display = decimals > 0 ? value.toFixed(decimals) : Math.round(value).toString();

  return (
    <span
      style={{
        fontFamily: tokens.fonts.mono,
        fontSize: fontSize ?? tokens.fontSizes.display,
        fontWeight: 700,
        color: tokens.accent.primary,
        fontVariantNumeric: 'tabular-nums',
      }}
    >
      {prefix}{display}{suffix}
    </span>
  );
};
