/**
 * AccentBar — Universal accent bar element (visual signature)
 */

import React from 'react';
import { interpolate } from 'remotion';
import { useSpring } from '../animations/springs';

interface AccentBarProps {
  color: string;
  width?: number;
  height?: number;
  delay?: number;
  animated?: boolean;
}

export const AccentBar: React.FC<AccentBarProps> = ({
  color,
  width = 80,
  height = 4,
  delay = 0,
  animated = true,
}) => {
  const progress = useSpring({ delay, config: 'smooth' });
  const currentWidth = animated ? interpolate(progress, [0, 1], [0, width]) : width;

  return (
    <div
      style={{
        width: currentWidth,
        height,
        backgroundColor: color,
        borderRadius: height / 2,
      }}
    />
  );
};
