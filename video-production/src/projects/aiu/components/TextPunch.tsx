/**
 * TextPunch — Bold text statement flash (Fireship style).
 *
 * Full-screen centered impact text that slams in from scale 1.8 and fades
 * out near the end. Uses the pillar accent color with a text shadow for depth.
 */

import React from 'react';
import { AbsoluteFill, useCurrentFrame, interpolate } from 'remotion';
import { COLORS, TIMING, type PillarNumber } from '../constants';
import { getPillarColor, withOpacity } from '../utils/colors';
import { FONT_FAMILY } from '../utils/fonts';
import { useSlamIn, EASING } from '../utils/animations';

interface TextPunchProps {
  /** The bold statement text */
  text: string;
  /** Which content pillar determines the text color */
  pillar: PillarNumber;
  /** Duration in frames (default: TIMING.textPunchFrames = 45) */
  duration?: number;
}

/**
 * Compute a responsive font size based on text length.
 * Short text gets 64px, longer text scales down to 48px.
 */
function getResponsiveFontSize(text: string): number {
  const len = text.length;
  if (len <= 15) return 64;
  if (len <= 30) return 56;
  if (len <= 50) return 48;
  return 42;
}

export const TextPunch: React.FC<TextPunchProps> = ({
  text,
  pillar,
  duration = TIMING.textPunchFrames,
}) => {
  const frame = useCurrentFrame();
  const accentColor = getPillarColor(pillar);
  const fontSize = getResponsiveFontSize(text);

  // Slam-in animation: scale 1.8 → 1.0 with heavy damping
  const { scale, opacity: slamOpacity } = useSlamIn(0);

  // Fade out near end of duration (last 10 frames)
  const fadeOutStart = duration - 10;
  const fadeOutOpacity = interpolate(frame, [fadeOutStart, duration], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: EASING.exit,
  });

  const combinedOpacity = Math.min(slamOpacity, fadeOutOpacity);

  return (
    <AbsoluteFill
      style={{
        backgroundColor: COLORS.bg.primary,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 80,
      }}
    >
      <div
        style={{
          fontFamily: FONT_FAMILY.display,
          fontWeight: 700,
          fontSize,
          color: accentColor,
          textAlign: 'center',
          lineHeight: 1.15,
          letterSpacing: -0.5,
          opacity: combinedOpacity,
          transform: `scale(${scale})`,
          textShadow: `0 4px 24px ${withOpacity(accentColor, 0.4)}, 0 2px 8px ${withOpacity('#000000', 0.6)}`,
          maxWidth: 1200,
        }}
      >
        {text}
      </div>
    </AbsoluteFill>
  );
};
