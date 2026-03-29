/**
 * KenBurnsImage — Slow zoom/pan on static image
 */

import React from 'react';
import { AbsoluteFill, Img, useCurrentFrame, useVideoConfig, interpolate } from 'remotion';

interface KenBurnsImageProps {
  src: string;
  /** Zoom direction: 'in' zooms from 1 to 1.2, 'out' from 1.2 to 1 */
  direction?: 'in' | 'out';
  /** Maximum zoom scale (default: 1.2) */
  maxScale?: number;
  /** Pan direction for subtle movement */
  pan?: 'up' | 'down' | 'left' | 'right' | 'none';
  /** Pan distance in pixels (default: 15) */
  panDistance?: number;
}

export const KenBurnsImage: React.FC<KenBurnsImageProps> = ({
  src,
  direction = 'in',
  maxScale = 1.2,
  pan = 'up',
  panDistance = 15,
}) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();

  const progress = frame / durationInFrames;

  const scale = direction === 'in'
    ? interpolate(progress, [0, 1], [1, maxScale])
    : interpolate(progress, [0, 1], [maxScale, 1]);

  const panX = pan === 'left' ? -panDistance * progress
    : pan === 'right' ? panDistance * progress
    : 0;

  const panY = pan === 'up' ? -panDistance * progress
    : pan === 'down' ? panDistance * progress
    : 0;

  return (
    <AbsoluteFill>
      <Img
        src={src}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          transform: `scale(${scale}) translate(${panX}px, ${panY}px)`,
        }}
      />
    </AbsoluteFill>
  );
};
