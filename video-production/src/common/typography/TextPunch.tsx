/**
 * TextPunch — Full-screen impact text with slam-in animation
 * Fireship-style: scale from 1.8x to 1x with heavy damping.
 */

import React from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate } from 'remotion';
import { useSlamIn } from '../animations/interpolations';
import type { BrandTokens } from '../utils/brand-tokens';
import { withOpacity } from '../utils/colors';

interface TextPunchProps {
  text: string;
  tokens: BrandTokens;
  delay?: number;
  /** Auto-shrink font for long text (default: true) */
  autoSize?: boolean;
}

export const TextPunch: React.FC<TextPunchProps> = ({
  text,
  tokens,
  delay = 0,
  autoSize = true,
}) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const { scale, opacity: enterOpacity } = useSlamIn(delay);

  // Fade out in last 10 frames
  const exitOpacity = interpolate(
    frame,
    [durationInFrames - 10, durationInFrames],
    [1, 0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' },
  );

  // Auto-size based on text length
  const baseFontSize = tokens.fontSizes.display;
  const fontSize = autoSize
    ? text.length > 30 ? baseFontSize * 0.6
      : text.length > 20 ? baseFontSize * 0.75
      : baseFontSize
    : baseFontSize;

  return (
    <AbsoluteFill
      style={{
        justifyContent: 'center',
        alignItems: 'center',
        opacity: enterOpacity * exitOpacity,
      }}
    >
      <div
        style={{
          transform: `scale(${scale})`,
          fontFamily: tokens.fonts.display,
          fontSize,
          fontWeight: 800,
          color: tokens.text.primary,
          textAlign: 'center',
          lineHeight: 1.1,
          padding: '0 60px',
          textShadow: `0 4px 24px ${withOpacity(tokens.accent.primary, 0.4)}, 0 2px 8px ${withOpacity('#000000', 0.6)}`,
        }}
      >
        {text}
      </div>
    </AbsoluteFill>
  );
};
