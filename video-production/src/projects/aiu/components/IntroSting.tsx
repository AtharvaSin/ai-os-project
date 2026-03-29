/**
 * IntroSting — 2-3 Second Branded Opening
 *
 * Dark background with AI&U logo spring animation, pillar-colored
 * glow pulse, accent line sweep, and PillarBadge fade-in.
 * Designed to play at the start of every video (TIMING.introFrames = 75).
 */

import React from 'react';
import {
  AbsoluteFill,
  Img,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
  spring,
  interpolate,
} from 'remotion';
import { COLORS, PILLARS, SIZING, FONT_SIZE, type PillarNumber } from '../constants';
import { FONT_FAMILY } from '../utils/fonts';
import { getPillarColor, withOpacity } from '../utils/colors';
import { SPRING_CONFIGS } from '../utils/animations';

interface IntroStingProps {
  pillar: PillarNumber;
}

export const IntroSting: React.FC<IntroStingProps> = ({ pillar }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const accent = getPillarColor(pillar);
  const config = PILLARS[pillar];

  // ── Logo entrance (bouncy spring from center) ───────────────
  const logoProgress = spring({
    frame: frame - 5,
    fps,
    config: SPRING_CONFIGS.bouncy,
  });
  const logoScale = interpolate(logoProgress, [0, 1], [0.2, 1]);
  const logoOpacity = interpolate(logoProgress, [0, 0.25], [0, 1], {
    extrapolateRight: 'clamp',
  });

  // ── Glow pulse behind logo (radial gradient) ───────────────
  const glowPulse = Math.sin(frame * 0.12) * 0.15 + 0.35;
  const glowScale = interpolate(logoProgress, [0, 1], [0.4, 1]);

  // ── Pillar badge fade-in below logo ────────────────────────
  const badgeProgress = spring({
    frame: frame - 25,
    fps,
    config: SPRING_CONFIGS.smooth,
  });
  const badgeOpacity = interpolate(badgeProgress, [0, 1], [0, 1]);
  const badgeY = interpolate(badgeProgress, [0, 1], [12, 0]);

  // ── Accent line sweep (left to right at bottom) ────────────
  const sweepPercent = interpolate(frame, [15, 65], [0, 100], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: COLORS.bg.primary,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {/* Radial glow behind logo */}
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: `translate(-50%, -55%) scale(${glowScale})`,
          width: 400,
          height: 400,
          borderRadius: '50%',
          background: `radial-gradient(circle, ${withOpacity(accent, glowPulse)} 0%, ${withOpacity(accent, glowPulse * 0.3)} 40%, transparent 70%)`,
          filter: 'blur(50px)',
          opacity: logoOpacity,
        }}
      />

      {/* AI&U Logo */}
      <div
        style={{
          transform: `scale(${logoScale})`,
          opacity: logoOpacity,
        }}
      >
        <Img
          src={staticFile('brand/aiu-logo.png')}
          style={{
            width: 200,
            height: 'auto',
          }}
        />
      </div>

      {/* Pillar badge below logo */}
      <div
        style={{
          marginTop: 24,
          opacity: badgeOpacity,
          transform: `translateY(${badgeY}px)`,
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: '6px 16px',
          borderRadius: SIZING.borderRadiusSm,
          backgroundColor: withOpacity(accent, 0.12),
          border: `1px solid ${withOpacity(accent, 0.25)}`,
        }}
      >
        <div
          style={{
            width: 8,
            height: 8,
            borderRadius: '50%',
            backgroundColor: accent,
            boxShadow: `0 0 8px ${withOpacity(accent, 0.6)}`,
          }}
        />
        <span
          style={{
            fontFamily: FONT_FAMILY.body,
            fontWeight: 500,
            fontSize: FONT_SIZE.caption,
            color: accent,
            letterSpacing: '0.04em',
          }}
        >
          {config.label}
        </span>
      </div>

      {/* Bottom accent line sweep */}
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          height: SIZING.accentBarWidth,
          width: `${sweepPercent}%`,
          background: config.gradient,
          boxShadow: `0 0 12px ${withOpacity(accent, 0.5)}`,
        }}
      />
    </AbsoluteFill>
  );
};
