/**
 * LetterboxBars — Cinematic black bars for 2.35:1 or custom aspect ratios
 */

import React from 'react';
import { AbsoluteFill, useVideoConfig, interpolate } from 'remotion';
import { useSpring } from '../animations/springs';

interface LetterboxBarsProps {
  /** Target aspect ratio (default: 2.35 for cinematic) */
  aspectRatio?: number;
  /** Animate bars sliding in (default: false) */
  animated?: boolean;
  delay?: number;
  color?: string;
}

export const LetterboxBars: React.FC<LetterboxBarsProps> = ({
  aspectRatio = 2.35,
  animated = false,
  delay = 0,
  color = '#000000',
}) => {
  const { width, height } = useVideoConfig();
  const targetHeight = width / aspectRatio;
  const barHeight = Math.max(0, (height - targetHeight) / 2);

  const progress = animated ? useSpring({ delay, config: 'cinematic' }) : 1;
  const currentBarHeight = interpolate(progress, [0, 1], [0, barHeight]);

  return (
    <AbsoluteFill style={{ pointerEvents: 'none', zIndex: 80 }}>
      {/* Top bar */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: currentBarHeight,
          backgroundColor: color,
        }}
      />
      {/* Bottom bar */}
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: currentBarHeight,
          backgroundColor: color,
        }}
      />
    </AbsoluteFill>
  );
};
