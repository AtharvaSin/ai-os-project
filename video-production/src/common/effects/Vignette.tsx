/**
 * Vignette — Radial edge darkening overlay
 */

import React from 'react';
import { AbsoluteFill } from 'remotion';

interface VignetteProps {
  /** Vignette opacity (default: 0.4) */
  opacity?: number;
  /** Color of the vignette edge (default: rgba(10, 13, 18, 1)) */
  color?: string;
  /** Z-index (default: 12) */
  zIndex?: number;
}

export const Vignette: React.FC<VignetteProps> = ({
  opacity = 0.4,
  color = 'rgba(10, 13, 18, 1)',
  zIndex = 12,
}) => {
  return (
    <AbsoluteFill
      style={{
        pointerEvents: 'none',
        zIndex,
        background: `radial-gradient(ellipse at center, transparent 0%, ${color.replace('1)', `${opacity})`)} 100%)`,
      }}
    />
  );
};
