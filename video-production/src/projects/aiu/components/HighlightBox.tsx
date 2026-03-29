/**
 * HighlightBox — Bordered card with title and staggered bullet points.
 *
 * A full-screen or overlay-sized highlight card with a pillar-colored
 * border, semi-transparent dark fill, and bullets that stagger in.
 * Used for disclaimers, warnings, guardrails, and key callouts.
 *
 * Reusable across videos:
 *   - G04 (V2 S1): Disclaimer Card (amber)
 *   - G18 (V2 S4): Over-Dependence Warning (warning variant)
 *   - G27 (V2 S5): Entrepreneur AI Guardrails (amber)
 */

import React from 'react';
import {
  AbsoluteFill,
  useCurrentFrame,
  interpolate,
  spring,
  useVideoConfig,
  Easing,
} from 'remotion';
import { COLORS, SIZING, type PillarNumber } from '../constants';
import { getPillarColor, withOpacity } from '../utils/colors';
import { FONT_FAMILY } from '../utils/fonts';

// ── Props ──────────────────────────────────────────────────────

export interface HighlightBoxProps {
  /** Card title displayed above the bullets */
  title: string;
  /** Bullet point strings */
  bullets: string[];
  /** Content pillar — determines accent color */
  pillar: PillarNumber;
  /** Visual variant: 'info' uses pillar accent, 'warning' uses status warning red */
  variant?: 'info' | 'warning';
  /** Optional icon character displayed next to title (e.g. "⚠", "🛡") */
  icon?: string;
  /** Frame delay before the card entrance starts */
  delay?: number;
  /** Stagger delay between bullets in frames (default: 8 ~ 267ms) */
  bulletStagger?: number;
  /** When true, outer background is transparent (for overlay on video) */
  transparent?: boolean;
}

// ── Component ──────────────────────────────────────────────────

export const HighlightBox: React.FC<HighlightBoxProps> = ({
  title,
  bullets,
  pillar,
  variant = 'info',
  icon,
  delay = 0,
  bulletStagger = 8,
  transparent = false,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const accent = variant === 'warning' ? COLORS.status.error : getPillarColor(pillar);
  const fillBg = withOpacity(accent, 0.08);

  // Card entrance — fade-in-up
  const enterProgress = spring({
    frame: frame - delay,
    fps,
    config: { damping: 160, stiffness: 220, mass: 1 },
  });

  const cardTranslateY = interpolate(enterProgress, [0, 1], [30, 0]);
  const cardOpacity = interpolate(enterProgress, [0, 0.3], [0, 1], {
    extrapolateRight: 'clamp',
  });

  // Title entrance (slightly after card)
  const titleDelay = delay + 6;
  const titleOpacity = interpolate(frame - titleDelay, [0, 12], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.cubic),
  });

  return (
    <AbsoluteFill
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: transparent ? 'transparent' : COLORS.bg.primary,
      }}
    >
      <div
        style={{
          transform: `translateY(${cardTranslateY}px)`,
          opacity: cardOpacity,
          maxWidth: 820,
          width: '100%',
          backgroundColor: fillBg,
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          borderRadius: SIZING.borderRadius,
          border: `2px solid ${withOpacity(accent, 0.5)}`,
          borderLeft: `4px solid ${accent}`,
          padding: 48,
          boxShadow: `0 8px 40px ${withOpacity('#000000', 0.4)}, 0 0 30px ${withOpacity(accent, 0.1)}`,
          display: 'flex',
          flexDirection: 'column',
          gap: 28,
        }}
      >
        {/* Title row */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 14,
            opacity: titleOpacity,
          }}
        >
          {icon && (
            <span style={{ fontSize: 28 }}>{icon}</span>
          )}
          <div
            style={{
              fontFamily: FONT_FAMILY.display,
              fontWeight: 700,
              fontSize: 30,
              lineHeight: 1.2,
              color: COLORS.text.primary,
              letterSpacing: -0.5,
            }}
          >
            {title}
          </div>
        </div>

        {/* Accent divider */}
        <div
          style={{
            height: 2,
            backgroundColor: withOpacity(accent, 0.25),
            opacity: titleOpacity,
          }}
        />

        {/* Bullets with staggered entrance */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {bullets.map((bullet, i) => {
            const bulletDelay = delay + 14 + i * bulletStagger;
            const bulletProgress = spring({
              frame: frame - bulletDelay,
              fps,
              config: { damping: 180, stiffness: 240, mass: 0.8 },
            });
            const bulletTranslateX = interpolate(bulletProgress, [0, 1], [20, 0]);
            const bulletOpacity = interpolate(bulletProgress, [0, 0.3], [0, 1], {
              extrapolateRight: 'clamp',
            });

            return (
              <div
                key={i}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 14,
                  transform: `translateX(${bulletTranslateX}px)`,
                  opacity: bulletOpacity,
                }}
              >
                {/* Bullet dot */}
                <div
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: 4,
                    backgroundColor: accent,
                    marginTop: 8,
                    flexShrink: 0,
                  }}
                />
                {/* Bullet text */}
                <div
                  style={{
                    fontFamily: FONT_FAMILY.body,
                    fontWeight: 500,
                    fontSize: 20,
                    lineHeight: 1.5,
                    color: COLORS.text.secondary,
                  }}
                >
                  {bullet}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </AbsoluteFill>
  );
};
