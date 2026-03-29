/**
 * ScanLines — Horizontal scan line overlay for CRT/surveillance effect
 */

import React from 'react';
import { AbsoluteFill, useCurrentFrame, interpolate } from 'remotion';

interface ScanLinesProps {
  opacity?: number;
  lineSpacing?: number;
  animated?: boolean;
  scrollSpeed?: number; // frames per full cycle
  zIndex?: number;
}

export const ScanLines: React.FC<ScanLinesProps> = ({
  opacity = 0.02,
  lineSpacing = 4,
  animated = true,
  scrollSpeed = 60,
  zIndex = 95,
}) => {
  const frame = useCurrentFrame();

  const offset = animated
    ? interpolate(frame % scrollSpeed, [0, scrollSpeed], [0, lineSpacing * 2])
    : 0;

  return (
    <AbsoluteFill
      style={{
        pointerEvents: 'none',
        zIndex,
        opacity,
        backgroundImage: `repeating-linear-gradient(
          0deg,
          transparent,
          transparent ${lineSpacing - 1}px,
          rgba(255, 255, 255, 0.5) ${lineSpacing - 1}px,
          rgba(255, 255, 255, 0.5) ${lineSpacing}px
        )`,
        backgroundPositionY: offset,
        backgroundSize: `100% ${lineSpacing}px`,
      }}
    />
  );
};
