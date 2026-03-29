/**
 * Watermark — Corner logo/text watermark
 */

import React from 'react';
import { AbsoluteFill } from 'remotion';

interface WatermarkProps {
  text?: string;
  imageSrc?: string;
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  opacity?: number;
  size?: number;
  fontFamily?: string;
  color?: string;
}

export const Watermark: React.FC<WatermarkProps> = ({
  text,
  imageSrc,
  position = 'bottom-right',
  opacity = 0.3,
  size = 14,
  fontFamily,
  color = '#ffffff',
}) => {
  const positionStyle: React.CSSProperties = {
    position: 'absolute',
    [position.includes('top') ? 'top' : 'bottom']: 24,
    [position.includes('left') ? 'left' : 'right']: 24,
  };

  return (
    <AbsoluteFill style={{ pointerEvents: 'none', zIndex: 85 }}>
      <div style={{ ...positionStyle, opacity }}>
        {imageSrc ? (
          <img
            src={imageSrc}
            style={{ width: size * 3, height: size * 3, objectFit: 'contain' }}
          />
        ) : (
          <span style={{ fontFamily, fontSize: size, color }}>
            {text}
          </span>
        )}
      </div>
    </AbsoluteFill>
  );
};
