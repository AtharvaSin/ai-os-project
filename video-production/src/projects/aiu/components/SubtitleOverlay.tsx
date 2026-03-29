/**
 * SubtitleOverlay — Word-Level Animated Subtitles (Karaoke Style)
 *
 * Bottom-center positioned subtitle renderer that highlights the
 * currently spoken word in the pillar accent color. Groups words
 * using the subtitle utilities and shows a dark gradient backdrop.
 */

import React from 'react';
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
} from 'remotion';
import {
  COLORS,
  SIZING,
  FONT_SIZE,
  TIMING,
  type PillarNumber,
} from '../constants';
import { FONT_FAMILY } from '../utils/fonts';
import { getPillarColor, withOpacity } from '../utils/colors';
import type { SubtitleSegment } from '../types';
import { groupSubtitles, getActiveGroup, getActiveWordIndex } from '../utils/subtitles';

interface SubtitleOverlayProps {
  segments: SubtitleSegment[];
  pillar: PillarNumber;
  /** Maximum words per display line (default uses utility default of 5) */
  maxWordsPerLine?: number;
}

export const SubtitleOverlay: React.FC<SubtitleOverlayProps> = ({
  segments,
  pillar,
  maxWordsPerLine: _maxWordsPerLine,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const accent = getPillarColor(pillar);
  const currentTimeSec = frame / fps;

  // Group all segments into display chunks
  const groups = React.useMemo(() => groupSubtitles(segments), [segments]);

  // Find the active group for the current time
  const activeGroup = getActiveGroup(groups, currentTimeSec);

  if (!activeGroup) {
    return null;
  }

  // Find which word is currently active within the group
  const activeWordIdx = getActiveWordIndex(activeGroup, currentTimeSec);

  // ── Fade transitions ───────────────────────────────────────
  // Fade in at group start, fade out near group end
  const fadeInDuration = TIMING.subtitleFadeFrames / fps;
  const fadeOutDuration = TIMING.subtitleFadeFrames / fps;

  const groupStartSec = activeGroup.start;
  const groupEndSec = activeGroup.end;

  const fadeIn = interpolate(
    currentTimeSec,
    [groupStartSec, groupStartSec + fadeInDuration],
    [0, 1],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' },
  );

  const fadeOut = interpolate(
    currentTimeSec,
    [groupEndSec - fadeOutDuration, groupEndSec],
    [1, 0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' },
  );

  const opacity = Math.min(fadeIn, fadeOut);

  return (
    <AbsoluteFill>
      {/* Container at bottom-center with safe area */}
      <div
        style={{
          position: 'absolute',
          bottom: SIZING.safeAreaBottom,
          left: 0,
          right: 0,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          opacity,
        }}
      >
        {/* Dark gradient backdrop strip */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            padding: '10px 28px',
            borderRadius: SIZING.borderRadiusSm,
            background: `linear-gradient(180deg, transparent 0%, ${withOpacity(COLORS.bg.primary, 0.75)} 30%, ${withOpacity(COLORS.bg.primary, 0.85)} 100%)`,
          }}
        >
          {/* Word spans */}
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              justifyContent: 'center',
              gap: 8,
            }}
          >
            {activeGroup.words.map((word, wordIdx) => {
              const isActive = wordIdx === activeWordIdx;
              const isPast = wordIdx < activeWordIdx;

              return (
                <span
                  key={`${word.start}-${wordIdx}`}
                  style={{
                    fontFamily: FONT_FAMILY.body,
                    fontWeight: 600,
                    fontSize: FONT_SIZE.subtitle,
                    color: isActive
                      ? accent
                      : isPast
                        ? COLORS.text.primary
                        : withOpacity(COLORS.text.primary, 0.7),
                    textShadow: isActive
                      ? `0 0 12px ${withOpacity(accent, 0.5)}, 0 2px 4px rgba(0,0,0,0.9)`
                      : '0 2px 4px rgba(0,0,0,0.8)',
                    transition: 'color 0.08s ease',
                    transform: isActive ? 'scale(1.05)' : 'scale(1)',
                    lineHeight: 1.4,
                  }}
                >
                  {word.word}
                </span>
              );
            })}
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
