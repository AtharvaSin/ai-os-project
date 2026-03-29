/**
 * BRollDrop — Image/meme flash overlay in Fireship style.
 *
 * Flashes an image onto screen with a scale-pop entrance (0.8 -> 1.0)
 * and slight rotation correction (-2deg -> 0). Exits with a quick
 * opacity fade in the last 8 frames. Used for meme drops, screenshot
 * inserts, and visual punch illustrations.
 */

import React from 'react';
import { useCurrentFrame, interpolate, Img, staticFile } from 'remotion';
import { AbsoluteFill } from 'remotion';
import { COLORS, SIZING } from '../constants';
import { withOpacity } from '../utils/colors';
import { FONT_FAMILY } from '../utils/fonts';
import { EASING } from '../utils/animations';

interface BRollDropProps {
  /** Path to the image file (resolved via staticFile) */
  imageSrc: string;
  /** Total display duration in frames (default: 45 = 1.5s at 30fps) */
  duration?: number;
  /** Optional caption text beneath the image */
  caption?: string;
  /** Optional SFX path (metadata only, not played by this component) */
  sfx?: string;
}

/** Number of frames at the end reserved for the exit fade */
const EXIT_FADE_FRAMES = 8;

export const BRollDrop: React.FC<BRollDropProps> = ({
  imageSrc,
  duration = 45,
  caption,
}) => {
  const frame = useCurrentFrame();

  // ── Entrance animation (first ~12 frames) ──────────────────
  const enterScale = interpolate(frame, [0, 10], [0.8, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: EASING.overshoot,
  });

  const enterRotation = interpolate(frame, [0, 10], [-2, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: EASING.enter,
  });

  // ── Exit fade (last EXIT_FADE_FRAMES frames) ──────────────
  const exitStart = Math.max(duration - EXIT_FADE_FRAMES, 0);
  const exitOpacity = interpolate(frame, [exitStart, duration], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // ── Enter opacity (quick fade in first 4 frames) ──────────
  const enterOpacity = interpolate(frame, [0, 4], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const combinedOpacity = Math.min(enterOpacity, exitOpacity);

  return (
    <AbsoluteFill
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        opacity: combinedOpacity,
      }}
    >
      <div
        style={{
          transform: `scale(${enterScale}) rotate(${enterRotation}deg)`,
          backgroundColor: COLORS.bg.card,
          borderRadius: SIZING.borderRadius,
          border: `1px solid ${COLORS.border}`,
          padding: 8,
          boxShadow: `0 12px 48px ${withOpacity('#000000', 0.5)}`,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 10,
          maxWidth: '70%',
        }}
      >
        {/* Image */}
        <Img
          src={staticFile(imageSrc)}
          style={{
            maxWidth: '100%',
            borderRadius: SIZING.borderRadiusSm,
            display: 'block',
          }}
        />

        {/* Optional caption */}
        {caption ? (
          <div
            style={{
              fontFamily: FONT_FAMILY.body,
              fontWeight: 500,
              fontSize: 16,
              color: COLORS.text.secondary,
              textAlign: 'center',
              lineHeight: 1.4,
              paddingBottom: 4,
              paddingLeft: 8,
              paddingRight: 8,
            }}
          >
            {caption}
          </div>
        ) : null}
      </div>
    </AbsoluteFill>
  );
};
