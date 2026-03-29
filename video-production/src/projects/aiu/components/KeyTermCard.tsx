/**
 * KeyTermCard — Notification-style keyword explainer overlay.
 *
 * Appears in the top-right or top-left corner of longform videos
 * to briefly explain a key term used in the narration. Dark theme
 * (Context D) with pillar accent, positioned to avoid the speaker's
 * face (center frame).
 *
 * Design principle: Every ~5 minutes, surface a term the viewer
 * might not know, with a 1-2 sentence contextual note.
 *
 * Scope: AI&U longform videos ONLY.
 */

import React from 'react';
import {
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
  Easing,
} from 'remotion';
import { COLORS, SIZING, PILLARS, type PillarNumber } from '../constants';
import { withOpacity } from '../utils/colors';
import { FONT_FAMILY } from '../utils/fonts';

// ── Props ──────────────────────────────────────────────────────

export interface KeyTermCardProps {
  /** The keyword or phrase being explained */
  term: string;
  /** Brief contextual note (1-2 sentences) */
  note: string;
  /** Content pillar — determines accent color */
  pillar: PillarNumber;
  /** Which corner to appear in */
  position?: 'top-right' | 'top-left';
  /** Optional category tag (e.g. "AI Concept", "Tool", "Framework") */
  category?: string;
  /** Total hold duration in frames (card visible including enter/exit) */
  holdFrames?: number;
}

// ── Timing ─────────────────────────────────────────────────────

/** Frames for the slide-in entrance */
const ENTER_FRAMES = 18;
/** Frames for the slide-out exit */
const EXIT_FRAMES = 14;

// ── Component ──────────────────────────────────────────────────

export const KeyTermCard: React.FC<KeyTermCardProps> = ({
  term,
  note,
  pillar,
  position = 'top-right',
  category,
  holdFrames = 180, // 6s default at 30fps
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const accent = PILLARS[pillar].accent;

  // ── Enter animation (spring slide from edge) ───────────────
  const enterProgress = spring({
    frame,
    fps,
    config: { damping: 160, stiffness: 260, mass: 0.9 },
  });

  // ── Exit animation (ease-out slide back to edge) ───────────
  const exitStartFrame = holdFrames - EXIT_FRAMES;
  const exitProgress =
    frame >= exitStartFrame
      ? interpolate(frame - exitStartFrame, [0, EXIT_FRAMES], [0, 1], {
          extrapolateLeft: 'clamp',
          extrapolateRight: 'clamp',
          easing: Easing.in(Easing.cubic),
        })
      : 0;

  // ── Combined translate ─────────────────────────────────────
  const slideDistance = 462; // px offscreen (1.1x card width)
  const isRight = position === 'top-right';

  const enterOffset = interpolate(enterProgress, [0, 1], [slideDistance, 0]);
  const exitOffset = interpolate(exitProgress, [0, 1], [0, slideDistance]);
  const translateX = (isRight ? 1 : -1) * (enterOffset + exitOffset);

  const opacity = interpolate(enterProgress, [0, 0.3], [0, 1], {
    extrapolateRight: 'clamp',
  }) * interpolate(exitProgress, [0, 0.8], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // ── Accent bar glow pulse (subtle) ─────────────────────────
  const glowPulse = interpolate(
    frame % 90,
    [0, 45, 90],
    [0.15, 0.3, 0.15],
  );

  return (
    <div
      style={{
        position: 'absolute',
        top: 48,
        ...(isRight ? { right: 48 } : { left: 48 }),
        transform: `translateX(${translateX}px)`,
        opacity,
        width: 418,
        display: 'flex',
        flexDirection: 'column',
        gap: 0,
        zIndex: 100,
      }}
    >
      {/* Main card body */}
      <div
        style={{
          backgroundColor: withOpacity(COLORS.bg.card, 0.92),
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          borderRadius: SIZING.borderRadius,
          border: `1px solid ${COLORS.border}`,
          borderLeft: isRight ? `1px solid ${COLORS.border}` : `3px solid ${accent}`,
          borderRight: isRight ? `3px solid ${accent}` : `1px solid ${COLORS.border}`,
          padding: 22,
          boxShadow: `0 8px 32px ${withOpacity('#000000', 0.5)}, 0 0 20px ${withOpacity(accent, glowPulse)}`,
          display: 'flex',
          flexDirection: 'column',
          gap: 11,
        }}
      >
        {/* Header row: category chip + term */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 11,
          }}
        >
          {/* Category chip */}
          {category && (
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                backgroundColor: withOpacity(accent, 0.15),
                color: accent,
                fontFamily: FONT_FAMILY.code,
                fontWeight: 600,
                fontSize: 11,
                paddingTop: 3,
                paddingBottom: 3,
                paddingLeft: 9,
                paddingRight: 9,
                borderRadius: 999,
                letterSpacing: 0.8,
                textTransform: 'uppercase' as const,
                whiteSpace: 'nowrap' as const,
                lineHeight: 1.3,
              }}
            >
              {category}
            </div>
          )}

          {/* Key icon indicator */}
          <div
            style={{
              width: 7,
              height: 7,
              borderRadius: 4,
              backgroundColor: accent,
              flexShrink: 0,
            }}
          />
        </div>

        {/* Term */}
        <div
          style={{
            fontFamily: FONT_FAMILY.display,
            fontWeight: 700,
            fontSize: 24,
            lineHeight: 1.2,
            color: COLORS.text.primary,
            letterSpacing: -0.3,
          }}
        >
          {term}
        </div>

        {/* Divider */}
        <div
          style={{
            height: 1,
            backgroundColor: withOpacity(accent, 0.2),
            marginTop: 2,
            marginBottom: 2,
          }}
        />

        {/* Note text */}
        <div
          style={{
            fontFamily: FONT_FAMILY.body,
            fontWeight: 400,
            fontSize: 15,
            lineHeight: 1.5,
            color: COLORS.text.secondary,
          }}
        >
          {note}
        </div>
      </div>
    </div>
  );
};
