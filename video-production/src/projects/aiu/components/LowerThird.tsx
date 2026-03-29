/**
 * LowerThird — Name & Title Overlay
 *
 * Left-aligned dark card with pillar accent bar, name + title text,
 * spring slide-in from left, hold for configurable duration, slide-out.
 * Positioned bottom-left with safe area margins.
 */

import React from 'react';
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  spring,
  interpolate,
} from 'remotion';
import {
  COLORS,
  CARD_STYLE,
  SIZING,
  FONT_SIZE,
  TIMING,
  type PillarNumber,
} from '../constants';
import { FONT_FAMILY } from '../utils/fonts';
import { getPillarColor, withOpacity } from '../utils/colors';
import { SPRING_CONFIGS } from '../utils/animations';

interface LowerThirdProps {
  name: string;
  title: string;
  pillar: PillarNumber;
  /** Frame offset at which the lower third enters (default: 0) */
  enterFrame?: number;
  /** Number of frames the lower third stays visible (default: 120) */
  holdDuration?: number;
}

export const LowerThird: React.FC<LowerThirdProps> = ({
  name,
  title,
  pillar,
  enterFrame = 0,
  holdDuration = TIMING.lowerThirdHoldFrames,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const accent = getPillarColor(pillar);

  // Total visible window: enter + hold + exit
  const exitStartFrame =
    enterFrame + TIMING.lowerThirdEnterFrames + holdDuration;

  // ── Enter animation (spring slide from left) ───────────────
  const enterProgress = spring({
    frame: frame - enterFrame,
    fps,
    config: SPRING_CONFIGS.smooth,
  });
  const enterX = interpolate(enterProgress, [0, 1], [-SIZING.lowerThirdMaxWidth - 60, 0]);
  const enterOpacity = interpolate(enterProgress, [0, 0.3], [0, 1], {
    extrapolateRight: 'clamp',
  });

  // ── Exit animation (spring slide to left) ──────────────────
  const exitProgress = spring({
    frame: frame - exitStartFrame,
    fps,
    config: SPRING_CONFIGS.fast,
  });
  const exitX = interpolate(exitProgress, [0, 1], [0, -SIZING.lowerThirdMaxWidth - 60]);
  const exitOpacity = interpolate(exitProgress, [0, 0.8], [1, 0], {
    extrapolateRight: 'clamp',
  });

  // Combined transform
  const translateX = enterX + exitX;
  const opacity = frame < exitStartFrame ? enterOpacity : exitOpacity;

  // Don't render before enter or well after exit
  if (frame < enterFrame - 5 || exitProgress > 0.99) {
    return null;
  }

  return (
    <AbsoluteFill>
      <div
        style={{
          position: 'absolute',
          bottom: SIZING.safeAreaBottom,
          left: SIZING.safeAreaSide,
          maxWidth: SIZING.lowerThirdMaxWidth,
          transform: `translateX(${translateX}px)`,
          opacity,
          display: 'flex',
          flexDirection: 'row',
          ...CARD_STYLE.default,
          padding: 0,
          overflow: 'hidden',
        }}
      >
        {/* Pillar accent bar (left edge) */}
        <div
          style={{
            width: SIZING.accentBarWidth,
            flexShrink: 0,
            backgroundColor: accent,
            boxShadow: `0 0 8px ${withOpacity(accent, 0.4)}`,
          }}
        />

        {/* Text content */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 4,
            padding: '12px 20px',
          }}
        >
          <span
            style={{
              fontFamily: FONT_FAMILY.display,
              fontWeight: 600,
              fontSize: FONT_SIZE.heading3,
              color: COLORS.text.primary,
              lineHeight: 1.2,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {name}
          </span>
          <span
            style={{
              fontFamily: FONT_FAMILY.body,
              fontWeight: 400,
              fontSize: FONT_SIZE.caption,
              color: COLORS.text.secondary,
              lineHeight: 1.3,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {title}
          </span>
        </div>
      </div>
    </AbsoluteFill>
  );
};
