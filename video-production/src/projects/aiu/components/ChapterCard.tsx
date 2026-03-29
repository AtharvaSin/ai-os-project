/**
 * ChapterCard — Full-Screen Section Transition
 *
 * Displays chapter number, mini-promise title, and progress bar.
 * Spring slide-up entrance with pillar gradient strip at top.
 * Used between chapters as a brief section divider.
 */

import React from 'react';
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  spring,
  interpolate,
} from 'remotion';
import {
  COLORS,
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

interface ChapterCardProps {
  chapterNumber: number;
  title: string;
  miniPromise: string;
  pillar: PillarNumber;
  totalChapters: number;
}

export const ChapterCard: React.FC<ChapterCardProps> = ({
  chapterNumber,
  title,
  miniPromise,
  pillar,
  totalChapters,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const accent = getPillarColor(pillar);
  const gradient = getPillarGradient(pillar);

  // ── Card slide-up entrance ─────────────────────────────────
  const enterProgress = spring({
    frame,
    fps,
    config: SPRING_CONFIGS.smooth,
  });
  const cardY = interpolate(enterProgress, [0, 1], [60, 0]);
  const cardOpacity = interpolate(enterProgress, [0, 0.3], [0, 1], {
    extrapolateRight: 'clamp',
  });

  // ── Staggered text entrances ───────────────────────────────
  const numberProgress = spring({
    frame: frame - 8,
    fps,
    config: SPRING_CONFIGS.fast,
  });
  const numberOpacity = interpolate(numberProgress, [0, 1], [0, 1]);

  const titleProgress = spring({
    frame: frame - 14,
    fps,
    config: SPRING_CONFIGS.smooth,
  });
  const titleOpacity = interpolate(titleProgress, [0, 1], [0, 1]);
  const titleY = interpolate(titleProgress, [0, 1], [16, 0]);

  const promiseProgress = spring({
    frame: frame - 20,
    fps,
    config: SPRING_CONFIGS.smooth,
  });
  const promiseOpacity = interpolate(promiseProgress, [0, 1], [0, 1]);
  const promiseY = interpolate(promiseProgress, [0, 1], [12, 0]);

  // ── Progress bar fill ──────────────────────────────────────
  const progressFraction = chapterNumber / totalChapters;
  const progressBarProgress = spring({
    frame: frame - 26,
    fps,
    config: SPRING_CONFIGS.smooth,
  });
  const progressWidth = interpolate(progressBarProgress, [0, 1], [0, progressFraction * 100]);

  return (
    <AbsoluteFill
      style={{
        backgroundColor: COLORS.bg.primary,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        transform: `translateY(${cardY}px)`,
        opacity: cardOpacity,
      }}
    >
      {/* Pillar gradient strip at top */}
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

      {/* Center content */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 20,
          maxWidth: 800,
          padding: `0 ${SIZING.safeAreaSide}px`,
        }}
      >
        {/* Chapter number */}
        <span
          style={{
            fontFamily: FONT_FAMILY.code,
            fontWeight: 500,
            fontSize: FONT_SIZE.display,
            color: COLORS.text.muted,
            opacity: numberOpacity,
            letterSpacing: '-0.02em',
            lineHeight: 1,
          }}
        >
          {String(chapterNumber).padStart(2, '0')}
        </span>

        {/* Chapter title */}
        <span
          style={{
            fontFamily: FONT_FAMILY.body,
            fontWeight: 500,
            fontSize: FONT_SIZE.body,
            color: accent,
            opacity: titleOpacity,
            transform: `translateY(${titleY}px)`,
            letterSpacing: '0.06em',
            textTransform: 'uppercase' as const,
          }}
        >
          {title}
        </span>

        {/* Mini-promise (main headline) */}
        <span
          style={{
            fontFamily: FONT_FAMILY.display,
            fontWeight: 700,
            fontSize: FONT_SIZE.heading1,
            color: COLORS.text.primary,
            opacity: promiseOpacity,
            transform: `translateY(${promiseY}px)`,
            textAlign: 'center' as const,
            lineHeight: 1.25,
            letterSpacing: '-0.01em',
          }}
        >
          {miniPromise}
        </span>
      </div>

      {/* Progress bar at bottom */}
      <div
        style={{
          position: 'absolute',
          bottom: SIZING.safeAreaBottom,
          left: SIZING.safeAreaSide,
          right: SIZING.safeAreaSide,
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
          alignItems: 'center',
        }}
      >
        {/* Chapter count label */}
        <span
          style={{
            fontFamily: FONT_FAMILY.code,
            fontSize: FONT_SIZE.micro,
            color: COLORS.text.muted,
            opacity: promiseOpacity,
            letterSpacing: '0.05em',
          }}
        >
          {chapterNumber} / {totalChapters}
        </span>

        {/* Progress track */}
        <div
          style={{
            width: '100%',
            height: SIZING.progressBarHeight,
            borderRadius: SIZING.progressBarHeight / 2,
            backgroundColor: withOpacity(accent, 0.15),
            overflow: 'hidden',
          }}
        >
          {/* Progress fill */}
          <div
            style={{
              height: '100%',
              width: `${progressWidth}%`,
              borderRadius: SIZING.progressBarHeight / 2,
              background: gradient,
              boxShadow: `0 0 8px ${withOpacity(accent, 0.4)}`,
            }}
          />
        </div>
      </div>
    </AbsoluteFill>
  );
};
