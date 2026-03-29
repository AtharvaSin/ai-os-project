/**
 * ProgressBar — Video progress indicator
 */

import React from 'react';
import { useCurrentFrame, useVideoConfig } from 'remotion';
import { withOpacity } from '../utils/colors';

interface ProgressBarProps {
  color: string;
  height?: number;
  position?: 'top' | 'bottom';
  zIndex?: number;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  color,
  height = 3,
  position = 'bottom',
  zIndex = 90,
}) => {
  const frame = useCurrentFrame();
  const { durationInFrames, width } = useVideoConfig();
  const progress = frame / durationInFrames;

  return (
    <div
      style={{
        position: 'absolute',
        [position]: 0,
        left: 0,
        width,
        height,
        zIndex,
        backgroundColor: withOpacity(color, 0.2),
      }}
    >
      <div
        style={{
          width: `${progress * 100}%`,
          height: '100%',
          backgroundColor: color,
        }}
      />
    </div>
  );
};
