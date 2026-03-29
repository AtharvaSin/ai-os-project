/**
 * FilmGrain — Parameterized SVG-based film grain overlay
 *
 * Uses feTurbulence for deterministic, frame-varying grain.
 * Accepts baseFrequency and opacity as props for brand customization.
 */

import React from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from 'remotion';

interface FilmGrainProps {
  /** Base frequency for feTurbulence (default: 0.65) */
  baseFrequency?: number;
  /** Overlay opacity (default: 0.06) */
  opacity?: number;
  /** Number of noise octaves (default: 3) */
  numOctaves?: number;
  /** Z-index (default: 100) */
  zIndex?: number;
}

export const FilmGrain: React.FC<FilmGrainProps> = ({
  baseFrequency = 0.65,
  opacity = 0.06,
  numOctaves = 3,
  zIndex = 100,
}) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const seed = (frame % 1000) / 1000;

  return (
    <AbsoluteFill
      style={{
        pointerEvents: 'none',
        zIndex,
        opacity,
      }}
    >
      <svg
        width={width}
        height={height}
        style={{ position: 'absolute', top: 0, left: 0 }}
      >
        <defs>
          <filter id={`film-grain-${frame}`}>
            <feTurbulence
              type="fractalNoise"
              baseFrequency={baseFrequency}
              numOctaves={numOctaves}
              result="noise"
              seed={seed * 100}
            />
            <feColorMatrix in="noise" type="saturate" values="0" />
          </filter>
        </defs>
        <rect
          width={width}
          height={height}
          fill="rgba(200, 200, 200, 0.5)"
          filter={`url(#film-grain-${frame})`}
        />
      </svg>
    </AbsoluteFill>
  );
};
