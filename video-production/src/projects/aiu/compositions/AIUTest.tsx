/**
 * AIUTest — Hello World Composition
 *
 * Verifies brand tokens, fonts, logo, pillar colors, and basic animations.
 * Registered as "aiu-test" (1920x1080, 30fps, 90 frames = 3 seconds).
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
import { COLORS, PILLARS, FPS, FONT_SIZE, SIZING } from '../constants';
import { FONT_FAMILY } from '../utils/fonts';
import { getPillarColor, withOpacity } from '../utils/colors';
import { SPRING_CONFIGS } from '../utils/animations';

export const AIUTest: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Logo spring animation (enters from frame 5)
  const logoProgress = spring({
    frame: frame - 5,
    fps,
    config: SPRING_CONFIGS.bouncy,
  });
  const logoScale = interpolate(logoProgress, [0, 1], [0.3, 1]);
  const logoOpacity = interpolate(logoProgress, [0, 0.3], [0, 1], {
    extrapolateRight: 'clamp',
  });

  // Title fade-in (enters from frame 20)
  const titleProgress = spring({
    frame: frame - 20,
    fps,
    config: SPRING_CONFIGS.smooth,
  });
  const titleOpacity = interpolate(titleProgress, [0, 1], [0, 1]);
  const titleY = interpolate(titleProgress, [0, 1], [20, 0]);

  // Pillar circles stagger (enter from frame 35)
  const pillarCircles = ([1, 2, 3] as const).map((pillar, index) => {
    const p = spring({
      frame: frame - 35 - index * 5,
      fps,
      config: SPRING_CONFIGS.bouncy,
    });
    return {
      pillar,
      scale: interpolate(p, [0, 1], [0, 1]),
      opacity: interpolate(p, [0, 0.3], [0, 1], {
        extrapolateRight: 'clamp',
      }),
    };
  });

  // Subtitle test line (enters from frame 55)
  const subtitleProgress = spring({
    frame: frame - 55,
    fps,
    config: SPRING_CONFIGS.smooth,
  });
  const subtitleOpacity = interpolate(subtitleProgress, [0, 1], [0, 1]);

  // Glow pulse behind logo
  const glowPulse = Math.sin(frame * 0.1) * 0.15 + 0.25;

  return (
    <AbsoluteFill
      style={{
        backgroundColor: COLORS.bg.primary,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 32,
      }}
    >
      {/* Glow behind logo */}
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -65%)',
          width: 300,
          height: 300,
          borderRadius: '50%',
          background: `radial-gradient(circle, ${withOpacity('#F59E0B', glowPulse)} 0%, transparent 70%)`,
          filter: 'blur(40px)',
          opacity: logoOpacity,
        }}
      />

      {/* AI&U Logo */}
      <div
        style={{
          transform: `scale(${logoScale})`,
          opacity: logoOpacity,
          marginTop: -40,
        }}
      >
        <Img
          src={staticFile('brand/aiu-logo.png')}
          style={{
            width: 180,
            height: 'auto',
          }}
        />
      </div>

      {/* Title */}
      <div
        style={{
          opacity: titleOpacity,
          transform: `translateY(${titleY}px)`,
          fontFamily: FONT_FAMILY.display,
          fontWeight: 700,
          fontSize: FONT_SIZE.heading1,
          color: COLORS.text.primary,
          letterSpacing: '-0.02em',
        }}
      >
        AI&U Video Pipeline
      </div>

      {/* Pillar accent circles */}
      <div
        style={{
          display: 'flex',
          gap: 40,
          alignItems: 'center',
        }}
      >
        {pillarCircles.map(({ pillar, scale, opacity }) => (
          <div
            key={pillar}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 12,
              opacity,
              transform: `scale(${scale})`,
            }}
          >
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: '50%',
                backgroundColor: getPillarColor(pillar),
                boxShadow: `0 0 20px ${withOpacity(getPillarColor(pillar), 0.4)}`,
              }}
            />
            <span
              style={{
                fontFamily: FONT_FAMILY.code,
                fontSize: FONT_SIZE.label,
                color: COLORS.text.muted,
                letterSpacing: '0.05em',
              }}
            >
              P{pillar} {PILLARS[pillar].shortLabel}
            </span>
          </div>
        ))}
      </div>

      {/* Subtitle test line */}
      <div
        style={{
          position: 'absolute',
          bottom: 120,
          opacity: subtitleOpacity,
          display: 'flex',
          gap: 8,
        }}
      >
        {['Practical', 'GenAI', 'for', 'real', 'people'].map((word, i) => (
          <span
            key={word}
            style={{
              fontFamily: FONT_FAMILY.body,
              fontWeight: 600,
              fontSize: FONT_SIZE.subtitle,
              color:
                i === 1
                  ? getPillarColor(1) // Highlight "GenAI" in pillar 1 accent
                  : COLORS.text.primary,
              textShadow: '0 2px 4px rgba(0,0,0,0.8)',
            }}
          >
            {word}
          </span>
        ))}
      </div>

      {/* Bottom accent line sweep */}
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          height: 3,
          width: `${interpolate(frame, [10, 60], [0, 100], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
          })}%`,
          background: PILLARS[1].gradient,
        }}
      />

      {/* Version label */}
      <div
        style={{
          position: 'absolute',
          bottom: 24,
          right: 32,
          fontFamily: FONT_FAMILY.code,
          fontSize: FONT_SIZE.micro,
          color: COLORS.text.muted,
          opacity: subtitleOpacity * 0.6,
        }}
      >
        v1.0 — Context D Dark Mode
      </div>
    </AbsoluteFill>
  );
};
