/**
 * AIUShort — YouTube Shorts Composition (1080x1920 vertical)
 *
 * Takes a segment from the long-form video (facecam), reframes it
 * for vertical viewing, and adds hook text, pillar badge, subtitles,
 * watermark, and an end CTA card.
 *
 * Driven by getInputProps() conforming to AIUShortInput.
 */

import React from 'react';
import {
  AbsoluteFill,
  OffthreadVideo,
  Sequence,
  useCurrentFrame,
  useVideoConfig,
  spring,
  interpolate,
  getInputProps,
  Img,
  staticFile,
} from 'remotion';
import { PillarBadge } from '../components/PillarBadge';
import { SubtitleOverlay } from '../components/SubtitleOverlay';
import { Watermark } from '../components/Watermark';
import type { SubtitleSegment } from '../types';
import { COLORS, FPS, FONT_SIZE, SIZING, DIMENSIONS, type PillarNumber } from '../constants';
import { FONT_FAMILY } from '../utils/fonts';
import { getPillarColor, withOpacity } from '../utils/colors';
import { SPRING_CONFIGS } from '../utils/animations';

// ── Input Shape ─────────────────────────────────────────────

interface AIUShortInput {
  facecamSrc: string;
  screenRecSrc: string;
  pillar: 1 | 2 | 3;
  startTime: number;
  endTime: number;
  hookText: string;
  hookPosition: 'top' | 'bottom';
  subtitles: SubtitleSegment[];
  channelHandle?: string;
}

// ── Constants ───────────────────────────────────────────────

const SHORT_W = DIMENSIONS.short.width;
const SHORT_H = DIMENSIONS.short.height;
const CTA_DURATION_FRAMES = 60;
const SAFE_MARGIN = 40;
const HOOK_STRIP_HEIGHT = 100;

// ── Component ───────────────────────────────────────────────

export const AIUShort: React.FC = () => {
  const props = getInputProps() as unknown as AIUShortInput;
  const {
    facecamSrc,
    pillar,
    startTime,
    endTime,
    hookText,
    hookPosition,
    subtitles,
    channelHandle = '@aiwithu',
  } = props;

  const { fps } = useVideoConfig();
  const frame = useCurrentFrame();
  const totalDurationFrames = Math.round((endTime - startTime) * fps);

  const accent = getPillarColor(pillar as PillarNumber);

  // Filter subtitles to the time window and offset them to start at 0
  const windowedSubtitles: SubtitleSegment[] = subtitles
    .filter((s) => s.end > startTime && s.start < endTime)
    .map((s) => ({
      ...s,
      start: Math.max(s.start - startTime, 0),
      end: Math.min(s.end - startTime, endTime - startTime),
    }));

  // Whether we are in the CTA zone (last 60 frames)
  const ctaStartFrame = totalDurationFrames - CTA_DURATION_FRAMES;
  const isCtaZone = frame >= ctaStartFrame;

  return (
    <AbsoluteFill
      style={{
        backgroundColor: COLORS.bg.primary,
        width: SHORT_W,
        height: SHORT_H,
      }}
    >
      {/* ── Layer 1: Facecam Video (center-cropped for vertical) ── */}
      <AbsoluteFill>
        <OffthreadVideo
          src={facecamSrc}
          startFrom={Math.round(startTime * fps)}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            objectPosition: 'center center',
          }}
        />
      </AbsoluteFill>

      {/* ── Layer 2: Top/Bottom darkening gradients ────────────── */}
      <AbsoluteFill style={{ pointerEvents: 'none' }}>
        {/* Top gradient */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: 300,
            background: `linear-gradient(180deg, ${withOpacity(COLORS.bg.primary, 0.7)} 0%, transparent 100%)`,
          }}
        />
        {/* Bottom gradient */}
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: 400,
            background: `linear-gradient(0deg, ${withOpacity(COLORS.bg.primary, 0.8)} 0%, transparent 100%)`,
          }}
        />
      </AbsoluteFill>

      {/* ── Layer 3: Hook Text ─────────────────────────────────── */}
      <HookTextOverlay
        text={hookText}
        position={hookPosition}
        accent={accent}
        pillar={pillar as PillarNumber}
      />

      {/* ── Layer 4: Pillar Badge (top-right) ─────────────────── */}
      <div
        style={{
          position: 'absolute',
          top: SAFE_MARGIN,
          right: SAFE_MARGIN,
        }}
      >
        <PillarBadge pillar={pillar as PillarNumber} size="sm" />
      </div>

      {/* ── Layer 5: Subtitle Overlay ─────────────────────────── */}
      {windowedSubtitles.length > 0 && (
        <SubtitleOverlay
          segments={windowedSubtitles}
          pillar={pillar as PillarNumber}
        />
      )}

      {/* ── Layer 6: Watermark (bottom-right, subtle) ─────────── */}
      <Watermark opacity={SIZING.watermarkOpacity} />

      {/* ── Layer 7: End CTA Card (last 60 frames) ────────────── */}
      {isCtaZone && (
        <Sequence from={ctaStartFrame} durationInFrames={CTA_DURATION_FRAMES}>
          <CTACard accent={accent} channelHandle={channelHandle} />
        </Sequence>
      )}
    </AbsoluteFill>
  );
};

// ── Hook Text Overlay ───────────────────────────────────────

interface HookTextOverlayProps {
  text: string;
  position: 'top' | 'bottom';
  accent: string;
  pillar: PillarNumber;
}

const HookTextOverlay: React.FC<HookTextOverlayProps> = ({
  text,
  position,
  accent,
  pillar,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Spring entrance animation
  const enterProgress = spring({
    frame,
    fps,
    config: SPRING_CONFIGS.smooth,
  });

  const translateY = interpolate(
    enterProgress,
    [0, 1],
    [position === 'top' ? -60 : 60, 0],
  );
  const opacity = interpolate(enterProgress, [0, 0.4], [0, 1], {
    extrapolateRight: 'clamp',
  });

  const isTop = position === 'top';

  // Split the text to highlight the last word in accent
  const words = text.trim().split(/\s+/);
  const mainWords = words.slice(0, -1).join(' ');
  const accentWord = words[words.length - 1];

  return (
    <div
      style={{
        position: 'absolute',
        ...(isTop ? { top: SAFE_MARGIN + 60 } : { bottom: 200 }),
        left: 0,
        right: 0,
        display: 'flex',
        justifyContent: 'center',
        transform: `translateY(${translateY}px)`,
        opacity,
        pointerEvents: 'none',
      }}
    >
      {/* Dark gradient strip behind text */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '14px 32px',
          borderRadius: SIZING.borderRadius,
          background: `linear-gradient(90deg, ${withOpacity(COLORS.bg.primary, 0.85)} 0%, ${withOpacity(COLORS.bg.primary, 0.7)} 100%)`,
          backdropFilter: 'blur(8px)',
          borderLeft: `4px solid ${accent}`,
        }}
      >
        <span
          style={{
            fontFamily: FONT_FAMILY.display,
            fontWeight: 700,
            fontSize: FONT_SIZE.heading2,
            color: COLORS.text.primary,
            letterSpacing: '-0.01em',
            lineHeight: 1.2,
            textTransform: 'uppercase',
          }}
        >
          {mainWords}{' '}
          <span style={{ color: accent }}>{accentWord}</span>
        </span>
      </div>
    </div>
  );
};

// ── CTA Card ────────────────────────────────────────────────

interface CTACardProps {
  accent: string;
  channelHandle: string;
}

const CTACard: React.FC<CTACardProps> = ({ accent, channelHandle }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Scale-in entrance
  const enterProgress = spring({
    frame,
    fps,
    config: SPRING_CONFIGS.bouncy,
  });

  const scale = interpolate(enterProgress, [0, 1], [0.6, 1]);
  const opacity = interpolate(enterProgress, [0, 0.3], [0, 1], {
    extrapolateRight: 'clamp',
  });

  return (
    <AbsoluteFill
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {/* Semi-transparent backdrop */}
      <AbsoluteFill
        style={{
          backgroundColor: withOpacity(COLORS.bg.primary, 0.6),
          backdropFilter: 'blur(6px)',
          opacity,
        }}
      />

      {/* Card */}
      <div
        style={{
          transform: `scale(${scale})`,
          opacity,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 20,
          padding: '40px 56px',
          borderRadius: SIZING.borderRadius,
          backgroundColor: withOpacity(COLORS.bg.card, 0.95),
          border: `1px solid ${COLORS.border}`,
          boxShadow: `0 0 60px ${withOpacity(accent, 0.15)}`,
        }}
      >
        {/* Logo */}
        <Img
          src={staticFile('brand/aiu-logo.png')}
          style={{ width: 64, height: 64 }}
        />

        {/* CTA text */}
        <div
          style={{
            fontFamily: FONT_FAMILY.display,
            fontWeight: 700,
            fontSize: FONT_SIZE.heading3,
            color: COLORS.text.primary,
            textAlign: 'center',
            lineHeight: 1.4,
          }}
        >
          Full video{' '}
          <span style={{ color: accent }}>{'>'}</span>{' '}
          link in description
        </div>

        {/* Channel handle */}
        <div
          style={{
            fontFamily: FONT_FAMILY.code,
            fontSize: FONT_SIZE.caption,
            color: COLORS.text.muted,
            letterSpacing: '0.03em',
          }}
        >
          {channelHandle}
        </div>
      </div>
    </AbsoluteFill>
  );
};
