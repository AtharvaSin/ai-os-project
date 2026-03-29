/**
 * KaraokeSubtitle — Word-by-word highlighted subtitle overlay
 */

import React from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from 'remotion';
import type { BrandTokens } from '../utils/brand-tokens';
import type { SubtitleGroup } from '../utils/subtitles';
import { getActiveGroup, getActiveWordIndex } from '../utils/subtitles';
import { withOpacity } from '../utils/colors';

interface KaraokeSubtitleProps {
  groups: SubtitleGroup[];
  tokens: BrandTokens;
  fontSize?: number;
  /** Position from bottom in px */
  bottomOffset?: number;
}

export const KaraokeSubtitle: React.FC<KaraokeSubtitleProps> = ({
  groups,
  tokens,
  fontSize,
  bottomOffset = 120,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const timeSec = frame / fps;

  const activeGroup = getActiveGroup(groups, timeSec);
  if (!activeGroup) return null;

  const activeWordIdx = getActiveWordIndex(activeGroup, timeSec);

  return (
    <AbsoluteFill
      style={{
        justifyContent: 'flex-end',
        alignItems: 'center',
        paddingBottom: bottomOffset,
        pointerEvents: 'none',
        zIndex: 50,
      }}
    >
      <div
        style={{
          display: 'flex',
          gap: 10,
          flexWrap: 'wrap',
          justifyContent: 'center',
          padding: '12px 32px',
          borderRadius: 8,
          backgroundColor: withOpacity(tokens.bg.primary, 0.7),
        }}
      >
        {activeGroup.words.map((word, i) => (
          <span
            key={`${word.word}-${i}`}
            style={{
              fontFamily: tokens.fonts.body,
              fontSize: fontSize ?? tokens.fontSizes.h2,
              fontWeight: i <= activeWordIdx ? 700 : 400,
              color: i <= activeWordIdx
                ? tokens.accent.primary
                : withOpacity(tokens.text.primary, 0.5),
              transition: 'color 0.1s, font-weight 0.1s',
            }}
          >
            {word.word}
          </span>
        ))}
      </div>
    </AbsoluteFill>
  );
};
