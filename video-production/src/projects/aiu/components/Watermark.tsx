/**
 * Watermark — Always-on AI&U logo watermark.
 *
 * Renders the brand logo at low opacity in the bottom-right corner.
 * Positioned absolutely so it overlays on any parent with relative/absolute positioning.
 */

import React from 'react';
import { Img, staticFile } from 'remotion';
import { SIZING } from '../constants';

interface WatermarkProps {
  /** Logo opacity (default: SIZING.watermarkOpacity = 0.08) */
  opacity?: number;
}

export const Watermark: React.FC<WatermarkProps> = ({
  opacity = SIZING.watermarkOpacity,
}) => {
  return (
    <Img
      src={staticFile('brand/aiu-logo.png')}
      style={{
        position: 'absolute',
        bottom: SIZING.watermarkMargin,
        right: SIZING.watermarkMargin,
        width: SIZING.watermarkSize,
        height: SIZING.watermarkSize,
        opacity,
        pointerEvents: 'none',
        userSelect: 'none',
      }}
    />
  );
};
