/**
 * ProgressBar — Thin horizontal bar showing progress with pillar accent fill.
 *
 * Renders a dark track with a pillar-colored fill bar. Progress animates
 * smoothly via spring interpolation. A subtle glow appears at the fill end.
 */

import React from 'react';
import { interpolate } from 'remotion';
import { COLORS, SIZING, type PillarNumber } from '../constants';
import { getPillarColor, withOpacity } from '../utils/colors';
import { useSpring } from '../utils/animations';

interface ProgressBarProps {
  /** Progress value from 0 to 1 */
  progress: number;
  /** Which content pillar determines the fill color */
  pillar: PillarNumber;
  /** Track height in pixels (default: SIZING.progressBarHeight = 4) */
  height?: number;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  progress,
  pillar,
  height = SIZING.progressBarHeight,
}) => {
  const accentColor = getPillarColor(pillar);

  // Animate the fill width with a smooth spring
  const springValue = useSpring({ config: 'smooth' });
  const animatedProgress = interpolate(springValue, [0, 1], [0, progress]);
  const widthPercent = `${Math.min(Math.max(animatedProgress, 0), 1) * 100}%`;

  return (
    <div
      style={{
        width: '100%',
        height,
        backgroundColor: COLORS.border,
        borderRadius: height / 2,
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      {/* Fill bar */}
      <div
        style={{
          height: '100%',
          width: widthPercent,
          backgroundColor: accentColor,
          borderRadius: height / 2,
          position: 'relative',
        }}
      >
        {/* Glow at the fill end */}
        <div
          style={{
            position: 'absolute',
            right: 0,
            top: '50%',
            transform: 'translateY(-50%)',
            width: 12,
            height: height * 3,
            borderRadius: 6,
            background: `radial-gradient(ellipse at center, ${withOpacity(accentColor, 0.6)} 0%, transparent 70%)`,
            pointerEvents: 'none',
          }}
        />
      </div>
    </div>
  );
};
