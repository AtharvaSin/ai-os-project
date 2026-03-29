/**
 * CalloutHighlight — SVG-based annotations for screen recordings.
 *
 * Draws animated callout shapes (circle, arrow, box, underline) with a
 * stroke-dashoffset draw-on effect. Optionally displays a text label
 * near the annotation. Used to highlight UI elements in screen recordings.
 */

import React from 'react';
import { useCurrentFrame, interpolate } from 'remotion';
import { TIMING, COLORS } from '../constants';
import { FONT_FAMILY } from '../utils/fonts';
import { EASING } from '../utils/animations';

type CalloutType = 'circle' | 'arrow' | 'box' | 'underline';

interface CalloutHighlightProps {
  /** Shape type for the annotation */
  type: CalloutType;
  /** X position (px from left) */
  x: number;
  /** Y position (px from top) */
  y: number;
  /** Width of the shape (diameter for circle, span for box/underline/arrow) */
  width?: number;
  /** Height of the shape (box only) */
  height?: number;
  /** Optional text label displayed near the annotation */
  label?: string;
  /** Stroke color (default: pillar amber #F59E0B) */
  color?: string;
  /** Delay in frames before the draw-on animation begins */
  delay?: number;
}

/** Calculate the perimeter of an SVG shape for stroke-dasharray animation. */
function getPathLength(type: CalloutType, width: number, height: number): number {
  switch (type) {
    case 'circle':
      return Math.PI * width; // circumference = PI * diameter
    case 'box':
      return 2 * (width + height);
    case 'underline':
      return width;
    case 'arrow':
      // Arrow: diagonal line + two arrowhead segments
      return Math.sqrt(width * width + width * width) + 30;
  }
}

/** Label offset positions relative to the annotation. */
function getLabelPosition(
  type: CalloutType,
  x: number,
  y: number,
  width: number,
  height: number,
): { labelX: number; labelY: number } {
  switch (type) {
    case 'circle':
      return { labelX: x + width / 2 + 12, labelY: y - width / 2 - 8 };
    case 'box':
      return { labelX: x + width + 8, labelY: y - 8 };
    case 'underline':
      return { labelX: x, labelY: y + 20 };
    case 'arrow':
      return { labelX: x + width + 8, labelY: y + width + 8 };
  }
}

export const CalloutHighlight: React.FC<CalloutHighlightProps> = ({
  type,
  x,
  y,
  width = 80,
  height = 60,
  label,
  color = '#F59E0B',
  delay = 0,
}) => {
  const frame = useCurrentFrame();
  const drawDuration = TIMING.calloutDrawFrames; // 15 frames

  // Draw-on progress: 0 → 1 over drawDuration frames, starting after delay
  const drawProgress = interpolate(frame - delay, [0, drawDuration], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: EASING.enter,
  });

  // Label fade-in after draw completes
  const labelOpacity = interpolate(frame - delay, [drawDuration, drawDuration + 8], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const pathLength = getPathLength(type, width, height);
  const dashOffset = pathLength * (1 - drawProgress);

  const strokeProps: React.SVGProps<SVGElement> = {
    stroke: color,
    strokeWidth: 3,
    fill: 'none',
    strokeDasharray: pathLength,
    strokeDashoffset: dashOffset,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
  };

  const { labelX, labelY } = getLabelPosition(type, x, y, width, height);

  /** Render the appropriate SVG shape. */
  function renderShape(): React.ReactNode {
    switch (type) {
      case 'circle': {
        const radius = width / 2;
        return (
          <circle
            cx={x}
            cy={y}
            r={radius}
            {...(strokeProps as React.SVGProps<SVGCircleElement>)}
          />
        );
      }
      case 'box':
        return (
          <rect
            x={x}
            y={y}
            width={width}
            height={height}
            rx={4}
            ry={4}
            {...(strokeProps as React.SVGProps<SVGRectElement>)}
          />
        );
      case 'underline':
        return (
          <line
            x1={x}
            y1={y}
            x2={x + width}
            y2={y}
            {...(strokeProps as React.SVGProps<SVGLineElement>)}
          />
        );
      case 'arrow': {
        // Diagonal arrow pointing down-right, with arrowhead
        const endX = x + width;
        const endY = y + width;
        const headLen = 12;
        const angle = Math.PI / 4; // 45 degrees
        const head1X = endX - headLen * Math.cos(angle - Math.PI / 6);
        const head1Y = endY - headLen * Math.sin(angle - Math.PI / 6);
        const head2X = endX - headLen * Math.cos(angle + Math.PI / 6);
        const head2Y = endY - headLen * Math.sin(angle + Math.PI / 6);
        return (
          <g>
            <line
              x1={x}
              y1={y}
              x2={endX}
              y2={endY}
              {...(strokeProps as React.SVGProps<SVGLineElement>)}
            />
            <line
              x1={endX}
              y1={endY}
              x2={head1X}
              y2={head1Y}
              {...(strokeProps as React.SVGProps<SVGLineElement>)}
              strokeDasharray="none"
              strokeDashoffset={0}
              opacity={drawProgress > 0.8 ? 1 : 0}
            />
            <line
              x1={endX}
              y1={endY}
              x2={head2X}
              y2={head2Y}
              {...(strokeProps as React.SVGProps<SVGLineElement>)}
              strokeDasharray="none"
              strokeDashoffset={0}
              opacity={drawProgress > 0.8 ? 1 : 0}
            />
          </g>
        );
      }
    }
  }

  // Don't render anything before the delay
  if (frame < delay) {
    return null;
  }

  return (
    <svg
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
      }}
    >
      {renderShape()}

      {/* Optional label */}
      {label && (
        <text
          x={labelX}
          y={labelY}
          fill={COLORS.text.primary}
          fontFamily={FONT_FAMILY.body}
          fontSize={14}
          fontWeight={600}
          opacity={labelOpacity}
        >
          {label}
        </text>
      )}
    </svg>
  );
};
