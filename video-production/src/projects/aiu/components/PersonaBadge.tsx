/**
 * PersonaBadge — Compact persona context overlay badge.
 *
 * Shows the current persona with a pixel portrait, title, and descriptor.
 * Transparent background for compositing over facecam/screen footage.
 *
 * Animation: 90 frames (3s). Starts centered at 2x scale, pulses border,
 * then smoothly eases to the top-right corner at 1x scale. After frame 90
 * it holds at final position (rendered as a loop clip in DaVinci).
 */

import React from 'react';
import {
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
  Easing,
} from 'remotion';
import { PILLARS } from '../constants';
import { withOpacity } from '../utils/colors';
import { FONT_FAMILY } from '../utils/fonts';

// ── Props ──────────────────────────────────────────────────────

export interface PersonaBadgeProps {
  personaNumber: 1 | 2 | 3 | 4;
  title: string;
  descriptor: string;
  /** Persona tint color */
  accentColor: string;
  /** If true, skip entrance animation and render settled at top-right */
  startSettled?: boolean;
}

// ── Persona Circle ────────────────────────────────────────────

const PersonaCircle: React.FC<{ persona: 1 | 2 | 3 | 4; accentColor: string }> = ({ persona, accentColor }) => {
  const numberLabel = String(persona).padStart(2, '0');

  return (
    <div
      style={{
        width: 60,
        height: 60,
        borderRadius: '50%',
        backgroundColor: accentColor,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <span
        style={{
          fontFamily: FONT_FAMILY.display,
          fontWeight: 700,
          fontSize: 22,
          color: '#FFFFFF',
          lineHeight: 1,
          letterSpacing: 1,
        }}
      >
        {numberLabel}
      </span>
    </div>
  );
};

// ── Component ──────────────────────────────────────────────────

export const PersonaBadge: React.FC<PersonaBadgeProps> = ({
  personaNumber,
  title,
  descriptor,
  accentColor,
  startSettled = false,
}) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const pillarAmber = PILLARS[1].accent;

  const badgeWidth = 300;
  const badgeHeight = 80;
  const finalX = width - 48 - badgeWidth / 2;
  const finalY = 48 + badgeHeight / 2;

  // ── Compute animation values ────────────────────────────────
  let posX: number;
  let posY: number;
  let scale: number;
  let opacity: number;
  let borderOpacity: number;

  if (startSettled) {
    // Idle mode: already at final position, just breathing glow
    posX = finalX;
    posY = finalY;
    scale = 1.0;
    opacity = 1;
    borderOpacity = 0.5 + 0.3 * Math.sin(frame * 0.07);
  } else {
    // Entrance animation
    const springIn = spring({
      frame: Math.max(0, frame - 6),
      fps,
      config: { damping: 140, stiffness: 240, mass: 0.9 },
    });
    const moveProgress = interpolate(frame, [48, 84], [0, 1], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
      easing: Easing.inOut(Easing.cubic),
    });
    const fadeIn = interpolate(frame, [0, 6], [0, 1], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    });
    opacity = frame < 6 ? fadeIn : 1;

    const springScale = interpolate(springIn, [0, 1], [2.0, 1.6]);
    const moveScale = interpolate(moveProgress, [0, 1], [1.6, 1.0]);
    scale = frame < 6 ? 2.0 : frame < 48 ? springScale : moveScale;

    const centerX = width / 2;
    const centerY = height / 2;
    posX = interpolate(moveProgress, [0, 1], [centerX, finalX]);
    posY = interpolate(moveProgress, [0, 1], [centerY, finalY]);

    const glowPulse = frame >= 6 && frame <= 24
      ? interpolate(frame, [6, 15, 24], [0.5, 1.0, 0.5])
      : 0.5;
    const breathingGlow = frame >= 24 && frame < 48
      ? 0.5 + 0.2 * Math.sin((frame - 24) * 0.15)
      : 0;
    const settledGlow = frame >= 84
      ? 0.5 + 0.3 * Math.sin(frame * 0.07)
      : 0;

    if (frame < 6) {
      borderOpacity = 0.5;
    } else if (frame < 24) {
      borderOpacity = glowPulse;
    } else if (frame < 48) {
      borderOpacity = breathingGlow > 0 ? breathingGlow : 0.5;
    } else if (frame < 84) {
      borderOpacity = 0.5 + 0.2 * Math.sin(frame * 0.1);
    } else {
      borderOpacity = settledGlow;
    }
  }

  const numberLabel = String(personaNumber).padStart(2, '0');

  return (
    <div
      style={{
        position: 'absolute',
        left: posX,
        top: posY,
        transform: `translate(-50%, -50%) scale(${scale})`,
        opacity,
        zIndex: 100,
        width: badgeWidth,
        height: badgeHeight,
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(15, 17, 23, 0.85)',
        backdropFilter: 'blur(14px)',
        WebkitBackdropFilter: 'blur(14px)',
        border: `1.5px solid ${withOpacity(accentColor, borderOpacity)}`,
        borderLeft: `3px solid ${pillarAmber}`,
        borderRadius: 10,
        overflow: 'hidden',
        boxShadow: `0 4px 20px rgba(0, 0, 0, 0.4), 0 0 12px ${withOpacity(accentColor, borderOpacity * 0.3)}`,
      }}
    >
      {/* Left zone: persona circle */}
      <div
        style={{
          width: 60,
          height: 60,
          marginLeft: 10,
          borderRadius: 6,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <PersonaCircle persona={personaNumber} accentColor={accentColor} />
      </div>

      {/* Right zone: text content */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          paddingLeft: 10,
          paddingRight: 12,
          gap: 1,
          position: 'relative',
        }}
      >
        {/* Top-right: persona number */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            right: 0,
            fontFamily: FONT_FAMILY.code,
            fontWeight: 400,
            fontSize: 10,
            color: '#6B6E7B',
            lineHeight: 1,
          }}
        >
          {numberLabel}
        </div>

        {/* Title */}
        <div
          style={{
            fontFamily: FONT_FAMILY.display,
            fontWeight: 600,
            fontSize: 15,
            color: '#F0F2F5',
            lineHeight: 1.2,
            paddingRight: 24,
          }}
        >
          {title}
        </div>

        {/* Descriptor */}
        <div
          style={{
            fontFamily: FONT_FAMILY.body,
            fontWeight: 400,
            fontSize: 11,
            color: '#A0A3B1',
            lineHeight: 1.3,
          }}
        >
          {descriptor}
        </div>
      </div>
    </div>
  );
};
