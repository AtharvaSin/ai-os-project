/**
 * EndScreen — CTA + Subscribe + Next Video
 *
 * Card-based two-column layout with a "Next Video" preview on the left
 * and a subscribe CTA on the right. Pillar accent strip at top,
 * logo watermark at center, spring entrance animations.
 * Designed for TIMING.endScreenFrames (270 frames = 9 seconds).
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
import {
  COLORS,
  CARD_STYLE,
  SIZING,
  FONT_SIZE,
  type PillarNumber,
} from '../constants';
import { FONT_FAMILY } from '../utils/fonts';
import {
  getPillarColor,
  getPillarGradient,
  withOpacity,
} from '../utils/colors';
import { SPRING_CONFIGS } from '../utils/animations';

interface EndScreenProps {
  nextVideoTitle: string;
  nextVideoThumbnail?: string;
  pillar: PillarNumber;
  channelHandle?: string;
}

export const EndScreen: React.FC<EndScreenProps> = ({
  nextVideoTitle,
  nextVideoThumbnail,
  pillar,
  channelHandle = '@AIandU',
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const accent = getPillarColor(pillar);
  const gradient = getPillarGradient(pillar);

  // ── Container fade-in ──────────────────────────────────────
  const containerProgress = spring({
    frame,
    fps,
    config: SPRING_CONFIGS.smooth,
  });
  const containerOpacity = interpolate(containerProgress, [0, 1], [0, 1]);

  // ── Left card (Next Video) entrance ────────────────────────
  const leftProgress = spring({
    frame: frame - 10,
    fps,
    config: SPRING_CONFIGS.smooth,
  });
  const leftX = interpolate(leftProgress, [0, 1], [-50, 0]);
  const leftOpacity = interpolate(leftProgress, [0, 0.3], [0, 1], {
    extrapolateRight: 'clamp',
  });

  // ── Right card (Subscribe) entrance ────────────────────────
  const rightProgress = spring({
    frame: frame - 18,
    fps,
    config: SPRING_CONFIGS.smooth,
  });
  const rightX = interpolate(rightProgress, [0, 1], [50, 0]);
  const rightOpacity = interpolate(rightProgress, [0, 0.3], [0, 1], {
    extrapolateRight: 'clamp',
  });

  // ── Subscribe text pulse ───────────────────────────────────
  const subscribePulse = Math.sin(frame * 0.08) * 0.04 + 1;

  return (
    <AbsoluteFill
      style={{
        backgroundColor: COLORS.bg.primary,
        opacity: containerOpacity,
      }}
    >
      {/* Pillar accent strip at top */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: SIZING.progressBarHeight,
          background: gradient,
        }}
      />

      {/* Center logo watermark */}
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          opacity: 0.1,
        }}
      >
        <Img
          src={staticFile('brand/aiu-logo.png')}
          style={{
            width: 240,
            height: 'auto',
          }}
        />
      </div>

      {/* Two-column layout */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 48,
          padding: `0 ${SIZING.safeAreaSide * 2}px`,
        }}
      >
        {/* Left: Next Video card */}
        <div
          style={{
            flex: 1,
            maxWidth: 560,
            transform: `translateX(${leftX}px)`,
            opacity: leftOpacity,
            ...CARD_STYLE.elevated,
            padding: 0,
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {/* Thumbnail area */}
          <div
            style={{
              width: '100%',
              height: 280,
              backgroundColor: COLORS.bg.code,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
              position: 'relative',
            }}
          >
            {nextVideoThumbnail ? (
              <Img
                src={staticFile(nextVideoThumbnail)}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                }}
              />
            ) : (
              /* Placeholder with play icon */
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 16,
                }}
              >
                <div
                  style={{
                    width: 64,
                    height: 64,
                    borderRadius: '50%',
                    backgroundColor: withOpacity(accent, 0.15),
                    border: `2px solid ${withOpacity(accent, 0.4)}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {/* Play triangle */}
                  <div
                    style={{
                      width: 0,
                      height: 0,
                      borderLeft: `22px solid ${accent}`,
                      borderTop: '14px solid transparent',
                      borderBottom: '14px solid transparent',
                      marginLeft: 6,
                    }}
                  />
                </div>
              </div>
            )}

            {/* "UP NEXT" badge */}
            <div
              style={{
                position: 'absolute',
                top: 16,
                left: 16,
                padding: '4px 12px',
                borderRadius: SIZING.borderRadiusSm,
                backgroundColor: withOpacity(accent, 0.9),
                display: 'flex',
                alignItems: 'center',
              }}
            >
              <span
                style={{
                  fontFamily: FONT_FAMILY.code,
                  fontWeight: 600,
                  fontSize: FONT_SIZE.label,
                  color: COLORS.bg.primary,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase' as const,
                }}
              >
                Up Next
              </span>
            </div>
          </div>

          {/* Video title */}
          <div
            style={{
              padding: SIZING.cardPadding,
            }}
          >
            <span
              style={{
                fontFamily: FONT_FAMILY.display,
                fontWeight: 600,
                fontSize: FONT_SIZE.heading3,
                color: COLORS.text.primary,
                lineHeight: 1.3,
              }}
            >
              {nextVideoTitle}
            </span>
          </div>
        </div>

        {/* Right: Subscribe area */}
        <div
          style={{
            flex: 1,
            maxWidth: 400,
            transform: `translateX(${rightX}px)`,
            opacity: rightOpacity,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 32,
          }}
        >
          {/* Subscribe button */}
          <div
            style={{
              transform: `scale(${subscribePulse})`,
              padding: '16px 48px',
              borderRadius: SIZING.borderRadius,
              backgroundColor: accent,
              boxShadow: `0 0 24px ${withOpacity(accent, 0.3)}, 0 4px 12px rgba(0,0,0,0.4)`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <span
              style={{
                fontFamily: FONT_FAMILY.display,
                fontWeight: 700,
                fontSize: FONT_SIZE.heading2,
                color: COLORS.bg.primary,
                letterSpacing: '0.1em',
                textTransform: 'uppercase' as const,
              }}
            >
              Subscribe
            </span>
          </div>

          {/* Channel handle */}
          <span
            style={{
              fontFamily: FONT_FAMILY.code,
              fontWeight: 500,
              fontSize: FONT_SIZE.body,
              color: COLORS.text.muted,
              letterSpacing: '0.04em',
            }}
          >
            {channelHandle}
          </span>

          {/* Divider */}
          <div
            style={{
              width: 60,
              height: 1,
              backgroundColor: COLORS.border,
            }}
          />

          {/* Social handles */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 8,
            }}
          >
            {['YouTube', 'Instagram', 'LinkedIn'].map((platform) => (
              <span
                key={platform}
                style={{
                  fontFamily: FONT_FAMILY.code,
                  fontSize: FONT_SIZE.caption,
                  color: COLORS.text.muted,
                  letterSpacing: '0.03em',
                }}
              >
                {platform}
              </span>
            ))}
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
