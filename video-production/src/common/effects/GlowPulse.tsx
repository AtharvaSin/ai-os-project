/**
 * GlowPulse — Animated radial glow behind elements
 */

import React from 'react';
import { AbsoluteFill, useCurrentFrame, interpolate } from 'remotion';
import { withOpacity } from '../utils/colors';

interface GlowPulseProps {
  color: string;
  intensity?: number;
  pulseDuration?: number; // frames
  size?: number; // percentage of container
  zIndex?: number;
}

export const GlowPulse: React.FC<GlowPulseProps> = ({
  color,
  intensity = 0.3,
  pulseDuration = 45,
  size = 60,
  zIndex = 5,
}) => {
  const frame = useCurrentFrame();
  const pulseProgress = (frame % pulseDuration) / pulseDuration;
  const currentIntensity = interpolate(
    Math.sin(pulseProgress * Math.PI * 2),
    [-1, 1],
    [intensity * 0.5, intensity],
  );

  return (
    <AbsoluteFill
      style={{
        pointerEvents: 'none',
        zIndex,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <div
        style={{
          width: `${size}%`,
          height: `${size}%`,
          borderRadius: '50%',
          background: `radial-gradient(circle, ${withOpacity(color, currentIntensity)} 0%, transparent 70%)`,
        }}
      />
    </AbsoluteFill>
  );
};
