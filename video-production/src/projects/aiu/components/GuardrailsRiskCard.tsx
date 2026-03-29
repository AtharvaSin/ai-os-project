/**
 * GuardrailsRiskCard — Semi-transparent warning overlay card.
 *
 * Shows 4 AI risks that occur when guardrails are missing.
 * Used in Video 2 Section 6 (Step 4 — Guardrails) overlaid on facecam B-roll.
 * Amber header with red risk items, staggered spring animations, pulsing dots.
 */
import React from 'react';
import {
  interpolate, spring, useCurrentFrame, useVideoConfig, Easing,
} from 'remotion';
import { COLORS } from '../constants';
import { withOpacity } from '../utils/colors';
import { FONT_FAMILY } from '../utils/fonts';

export interface GuardrailsRiskCardProps {
  /** Total frames the card is visible (including enter/exit) */
  holdFrames?: number;
}

const EXIT_FRAMES = 14;
const AMBER = COLORS.status.highlight;
const RED = COLORS.status.error;

const RISKS = [
  { icon: '\uD83C\uDFAD', title: 'Hallucination', desc: 'Generates confident but entirely false information' },
  { icon: '\uD83D\uDD00', title: 'Context Drift', desc: 'Loses focus and deviates from the original task' },
  { icon: '\u26A0\uFE0F', title: 'Harmful Output', desc: 'Produces biased, toxic, or inappropriate content' },
  { icon: '\uD83E\uDD16', title: 'Rogue Autonomy', desc: 'Takes unauthorized actions without human approval' },
];

export const GuardrailsRiskCard: React.FC<GuardrailsRiskCardProps> = ({
  holdFrames = 1020,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // ── Card entrance (spring fade-in-up) ─────────────────────
  const enterProgress = spring({
    frame, fps, config: { damping: 160, stiffness: 220, mass: 1 },
  });
  const cardTranslateY = interpolate(enterProgress, [0, 1], [30, 0]);
  const cardOpacity = interpolate(enterProgress, [0, 0.3], [0, 1], {
    extrapolateRight: 'clamp',
  });

  // ── Card exit (fade + slide down) ─────────────────────────
  const exitStart = holdFrames - EXIT_FRAMES;
  const exitProgress = frame >= exitStart
    ? interpolate(frame - exitStart, [0, EXIT_FRAMES], [0, 1], {
        extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
      })
    : 0;
  const exitOpacity = interpolate(exitProgress, [0, 1], [1, 0]);
  const exitY = interpolate(exitProgress, [0, 1], [0, 20]);

  const opacity = cardOpacity * exitOpacity;
  const translateY = cardTranslateY + exitY;

  // ── Header entrance (delayed 6 frames) ────────────────────
  const headerOpacity = interpolate(frame - 6, [0, 12], [0, 1], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
    easing: Easing.out(Easing.cubic),
  });

  return (
    <div style={{
      position: 'absolute', top: '50%', left: '50%',
      transform: `translate(-50%, -50%) translateY(${translateY}px)`,
      opacity, zIndex: 50, width: 750,
    }}>
      <div style={{
        backgroundColor: 'rgba(15, 17, 23, 0.75)',
        backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
        borderRadius: 16, borderLeft: `5px solid ${RED}`,
        padding: '36px 44px',
        boxShadow: `0 12px 48px rgba(0,0,0,0.5), 0 0 30px ${withOpacity(RED, 0.12)}`,
        display: 'flex', flexDirection: 'column' as const, gap: 20,
      }}>
        {/* Step chip */}
        <div style={{
          display: 'inline-flex', alignItems: 'center', alignSelf: 'flex-start',
          backgroundColor: withOpacity(AMBER, 0.2), color: AMBER,
          fontFamily: FONT_FAMILY.code, fontWeight: 700, fontSize: 14,
          padding: '5px 14px', borderRadius: 999,
          letterSpacing: 1.5, textTransform: 'uppercase' as const,
        }}>
          Step 4
        </div>

        {/* Header */}
        <div style={{
          fontFamily: FONT_FAMILY.display, fontWeight: 700, fontSize: 30,
          color: AMBER, letterSpacing: -0.5, lineHeight: 1.2,
          opacity: headerOpacity,
        }}>
          AI Risks Without Guardrails
        </div>

        {/* Divider */}
        <div style={{ height: 2, backgroundColor: withOpacity(RED, 0.2) }} />

        {/* Risk items */}
        {RISKS.map((risk, i) => {
          const riskDelay = 18 + i * 10;
          const riskProgress = spring({
            frame: frame - riskDelay, fps,
            config: { damping: 180, stiffness: 240, mass: 0.8 },
          });
          const riskTranslateX = interpolate(riskProgress, [0, 1], [20, 0]);
          const riskOpacity = interpolate(riskProgress, [0, 0.3], [0, 1], {
            extrapolateRight: 'clamp',
          });
          const dotPulse = interpolate(
            (frame - riskDelay) % 60, [0, 30, 60], [0.4, 1, 0.4],
          );

          return (
            <div key={risk.title} style={{
              display: 'flex', alignItems: 'flex-start', gap: 14,
              opacity: riskOpacity, transform: `translateX(${riskTranslateX}px)`,
            }}>
              {/* Pulsing red dot */}
              <div style={{
                width: 8, height: 8, borderRadius: 4,
                backgroundColor: RED, opacity: dotPulse,
                marginTop: 8, flexShrink: 0,
                boxShadow: `0 0 8px ${withOpacity(RED, dotPulse * 0.5)}`,
              }} />
              {/* Icon */}
              <div style={{
                fontSize: 22, marginTop: 2, flexShrink: 0,
                width: 32, textAlign: 'center' as const,
              }}>
                {risk.icon}
              </div>
              {/* Text */}
              <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 4 }}>
                <div style={{
                  fontFamily: FONT_FAMILY.body, fontWeight: 600, fontSize: 20,
                  color: COLORS.text.primary, lineHeight: 1.3,
                }}>
                  {risk.title}
                </div>
                <div style={{
                  fontFamily: FONT_FAMILY.body, fontWeight: 400, fontSize: 16,
                  color: COLORS.text.secondary, lineHeight: 1.4,
                }}>
                  {risk.desc}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
