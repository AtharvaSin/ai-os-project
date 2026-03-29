/**
 * FullScreenTextScene — Full-frame text cards with 4 style variants.
 *
 * Renders bold, branded text sequences on a dark background.
 * Used for statements, rhetorical questions, numbered rules,
 * and myth-busting layouts. Each variant uses spring-based
 * entrance animations tuned to its visual weight.
 *
 * Variants:
 *   'statement'  — Large centered impact text with pillar accent underline sweep
 *   'question'   — Reflective text with emphasized "?" in pillar accent
 *   'rule'       — Numbered rule card with pillar accent prefix
 *   'myth_bust'  — Two-row MYTH (crossed out) vs REALITY (affirmed) layout
 */

import React from 'react';
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
} from 'remotion';
import { COLORS, FPS, type PillarNumber } from '../constants';
import type { FullTextStyle } from '../types';
import { getPillarColor, withOpacity } from '../utils/colors';
import { FONT_FAMILY } from '../utils/fonts';
import { useSlamIn, useSlideIn, useSpring, EASING } from '../utils/animations';

// ── Props ───────────────────────────────────────────────────

interface FullScreenTextSceneProps {
  /** Primary text to display */
  headline: string;
  /** Optional secondary text displayed below headline */
  subtext?: string;
  /** Visual variant: statement, question, rule, or myth_bust */
  style: FullTextStyle;
  /** Content pillar for accent colors */
  pillar: PillarNumber;
  /** Scene duration in frames (default: 3s at 30fps) */
  duration?: number;
}

// ── Main Component ──────────────────────────────────────────

export const FullScreenTextScene: React.FC<FullScreenTextSceneProps> = ({
  headline,
  subtext,
  style,
  pillar,
  duration = FPS * 3,
}) => {
  const accent = getPillarColor(pillar);

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
      {style === 'statement' && (
        <StatementVariant
          headline={headline}
          subtext={subtext}
          accent={accent}
          duration={duration}
        />
      )}
      {style === 'question' && (
        <QuestionVariant
          headline={headline}
          subtext={subtext}
          accent={accent}
        />
      )}
      {style === 'rule' && (
        <RuleVariant
          headline={headline}
          subtext={subtext}
          accent={accent}
        />
      )}
      {style === 'myth_bust' && (
        <MythBustVariant
          headline={headline}
          subtext={subtext}
        />
      )}
    </AbsoluteFill>
  );
};

// ── Statement Variant ───────────────────────────────────────

interface VariantProps {
  headline: string;
  subtext?: string;
  accent: string;
  duration?: number;
}

const StatementVariant: React.FC<VariantProps> = ({
  headline,
  subtext,
  accent,
  duration = FPS * 3,
}) => {
  const frame = useCurrentFrame();
  const { scale, opacity } = useSlamIn(0);

  // Accent underline sweep animation: starts at frame 8, completes by frame 30
  const sweepProgress = interpolate(frame, [8, 30], [0, 100], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: EASING.enter,
  });

  // Subtext fade-in slightly after headline
  const subtextSpring = useSpring({ delay: 12, config: 'smooth' });
  const subtextOpacity = interpolate(subtextSpring, [0, 0.4], [0, 1], {
    extrapolateRight: 'clamp',
  });

  // Fade-out in last 8 frames
  const fadeOut = interpolate(frame, [duration - 8, duration], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 24,
        maxWidth: 1200,
        opacity: Math.min(opacity, fadeOut),
      }}
    >
      {/* Headline */}
      <div
        style={{
          fontFamily: FONT_FAMILY.display,
          fontWeight: 700,
          fontSize: 48,
          color: COLORS.text.primary,
          textAlign: 'center',
          lineHeight: 1.2,
          letterSpacing: -0.5,
          transform: `scale(${scale})`,
        }}
      >
        {headline}
      </div>

      {/* Animated pillar accent underline */}
      <div
        style={{
          width: `${sweepProgress}%`,
          maxWidth: 400,
          height: 4,
          backgroundColor: accent,
          borderRadius: 2,
          boxShadow: `0 0 12px ${withOpacity(accent, 0.5)}`,
        }}
      />

      {/* Subtext */}
      {subtext ? (
        <div
          style={{
            fontFamily: FONT_FAMILY.body,
            fontWeight: 400,
            fontSize: 22,
            color: COLORS.text.secondary,
            textAlign: 'center',
            lineHeight: 1.5,
            opacity: subtextOpacity,
            maxWidth: 900,
          }}
        >
          {subtext}
        </div>
      ) : null}
    </div>
  );
};

// ── Question Variant ────────────────────────────────────────

const QuestionVariant: React.FC<VariantProps> = ({
  headline,
  subtext,
  accent,
}) => {
  const { translateX, translateY, opacity } = useSlideIn({
    direction: 'bottom',
    distance: 30,
    delay: 0,
  });

  // Split to isolate the "?" for emphasis
  const hasQuestion = headline.includes('?');
  const textWithoutQuestion = hasQuestion ? headline.replace(/\?/g, '') : headline;

  // Subtext slide-in
  const subtextSlide = useSlideIn({ direction: 'bottom', distance: 20, delay: 10 });

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 20,
        maxWidth: 1100,
        transform: `translate(${translateX}px, ${translateY}px)`,
        opacity,
      }}
    >
      {/* Question text */}
      <div
        style={{
          fontFamily: FONT_FAMILY.body,
          fontWeight: 500,
          fontSize: 28,
          color: COLORS.text.primary,
          textAlign: 'center',
          lineHeight: 1.4,
        }}
      >
        {textWithoutQuestion}
        {hasQuestion && (
          <span
            style={{
              fontFamily: FONT_FAMILY.display,
              fontWeight: 700,
              fontSize: 48,
              color: accent,
              marginLeft: 4,
              textShadow: `0 0 16px ${withOpacity(accent, 0.4)}`,
            }}
          >
            ?
          </span>
        )}
      </div>

      {/* Subtext */}
      {subtext ? (
        <div
          style={{
            fontFamily: FONT_FAMILY.body,
            fontWeight: 400,
            fontSize: 20,
            color: COLORS.text.secondary,
            textAlign: 'center',
            lineHeight: 1.5,
            opacity: subtextSlide.opacity,
            transform: `translateY(${subtextSlide.translateY}px)`,
            maxWidth: 800,
          }}
        >
          {subtext}
        </div>
      ) : null}
    </div>
  );
};

// ── Rule Variant ────────────────────────────────────────────

const RuleVariant: React.FC<VariantProps> = ({
  headline,
  subtext,
  accent,
}) => {
  const { translateX, translateY, opacity } = useSlideIn({
    direction: 'left',
    distance: 40,
    delay: 0,
  });

  const subtextSlide = useSlideIn({ direction: 'left', distance: 30, delay: 8 });

  // Extract rule number if headline starts with a number pattern like "1:" or "Rule 1:"
  const ruleMatch = headline.match(/^(Rule\s+\d+[:.]\s*|\d+[:.]\s*)/i);
  const rulePrefix = ruleMatch ? ruleMatch[1] : '';
  const ruleBody = rulePrefix ? headline.slice(rulePrefix.length) : headline;

  return (
    <div
      style={{
        transform: `translate(${translateX}px, ${translateY}px)`,
        opacity,
        backgroundColor: COLORS.bg.card,
        borderRadius: 12,
        border: `1px solid ${COLORS.border}`,
        borderLeft: `4px solid ${accent}`,
        padding: 40,
        maxWidth: 900,
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
        boxShadow: `0 8px 32px ${withOpacity('#000000', 0.4)}`,
      }}
    >
      {/* Rule headline */}
      <div style={{ lineHeight: 1.3 }}>
        {rulePrefix ? (
          <span
            style={{
              fontFamily: FONT_FAMILY.display,
              fontWeight: 700,
              fontSize: 28,
              color: accent,
            }}
          >
            {rulePrefix}
          </span>
        ) : null}
        <span
          style={{
            fontFamily: FONT_FAMILY.display,
            fontWeight: 600,
            fontSize: 28,
            color: COLORS.text.primary,
          }}
        >
          {ruleBody}
        </span>
      </div>

      {/* Details / subtext */}
      {subtext ? (
        <div
          style={{
            fontFamily: FONT_FAMILY.body,
            fontWeight: 400,
            fontSize: 18,
            color: COLORS.text.secondary,
            lineHeight: 1.5,
            opacity: subtextSlide.opacity,
            transform: `translateX(${subtextSlide.translateX}px)`,
          }}
        >
          {subtext}
        </div>
      ) : null}
    </div>
  );
};

// ── Myth Bust Variant ───────────────────────────────────────

interface MythBustProps {
  headline: string;
  subtext?: string;
}

const MythBustVariant: React.FC<MythBustProps> = ({ headline, subtext }) => {
  // Headline is the myth text, subtext is the reality text
  const mythSlide = useSlideIn({ direction: 'left', distance: 50, delay: 0 });
  const realitySlide = useSlideIn({ direction: 'right', distance: 50, delay: 12 });

  // Strikethrough reveal (animated after myth slides in)
  const frame = useCurrentFrame();
  const strikeWidth = interpolate(frame, [10, 22], [0, 100], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: EASING.snap,
  });

  const ERROR_RED = '#EF4444';
  const SUCCESS_GREEN = '#10B981';

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 48,
        maxWidth: 1000,
        width: '100%',
      }}
    >
      {/* MYTH row */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 24,
          transform: `translateX(${mythSlide.translateX}px)`,
          opacity: mythSlide.opacity,
        }}
      >
        {/* X icon */}
        <div
          style={{
            width: 48,
            height: 48,
            borderRadius: 24,
            backgroundColor: withOpacity(ERROR_RED, 0.15),
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path
              d="M18 6L6 18M6 6l12 12"
              stroke={ERROR_RED}
              strokeWidth="3"
              strokeLinecap="round"
            />
          </svg>
        </div>

        {/* Myth label + text */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div
            style={{
              fontFamily: FONT_FAMILY.display,
              fontWeight: 700,
              fontSize: 16,
              color: ERROR_RED,
              letterSpacing: '0.1em',
              textTransform: 'uppercase' as const,
            }}
          >
            MYTH
          </div>
          <div style={{ position: 'relative' }}>
            <div
              style={{
                fontFamily: FONT_FAMILY.body,
                fontWeight: 500,
                fontSize: 24,
                color: COLORS.text.muted,
                lineHeight: 1.4,
              }}
            >
              {headline}
            </div>
            {/* Animated strikethrough line */}
            <div
              style={{
                position: 'absolute',
                top: '50%',
                left: 0,
                width: `${strikeWidth}%`,
                height: 3,
                backgroundColor: ERROR_RED,
                borderRadius: 1.5,
                transform: 'translateY(-50%)',
              }}
            />
          </div>
        </div>
      </div>

      {/* REALITY row */}
      {subtext ? (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 24,
            transform: `translateX(${realitySlide.translateX}px)`,
            opacity: realitySlide.opacity,
          }}
        >
          {/* Check icon */}
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: 24,
              backgroundColor: withOpacity(SUCCESS_GREEN, 0.15),
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path
                d="M20 6L9 17l-5-5"
                stroke={SUCCESS_GREEN}
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>

          {/* Reality label + text */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div
              style={{
                fontFamily: FONT_FAMILY.display,
                fontWeight: 700,
                fontSize: 16,
                color: SUCCESS_GREEN,
                letterSpacing: '0.1em',
                textTransform: 'uppercase' as const,
              }}
            >
              REALITY
            </div>
            <div
              style={{
                fontFamily: FONT_FAMILY.body,
                fontWeight: 500,
                fontSize: 24,
                color: COLORS.text.primary,
                lineHeight: 1.4,
              }}
            >
              {subtext}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};
