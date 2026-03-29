/**
 * WordReveal — Words appear one by one with spring fade-up
 */

import React from 'react';
import { interpolate } from 'remotion';
import { useSpring } from '../animations/springs';
import { staggerDelay } from '../animations/sequencing';
import type { BrandTokens } from '../utils/brand-tokens';

interface WordRevealProps {
  text: string;
  tokens: BrandTokens;
  /** Delay before first word (frames) */
  startDelay?: number;
  /** Delay between words (frames) */
  wordDelay?: number;
  fontSize?: number;
}

export const WordReveal: React.FC<WordRevealProps> = ({
  text,
  tokens,
  startDelay = 0,
  wordDelay = 4,
  fontSize,
}) => {
  const words = text.split(' ');

  return (
    <div
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: '0 12px',
        justifyContent: 'center',
      }}
    >
      {words.map((word, i) => (
        <WordItem
          key={`${word}-${i}`}
          word={word}
          tokens={tokens}
          delay={startDelay + staggerDelay(i, wordDelay)}
          fontSize={fontSize}
        />
      ))}
    </div>
  );
};

const WordItem: React.FC<{
  word: string;
  tokens: BrandTokens;
  delay: number;
  fontSize?: number;
}> = ({ word, tokens, delay, fontSize }) => {
  const progress = useSpring({ delay, config: 'smooth' });
  const translateY = interpolate(progress, [0, 1], [20, 0]);
  const opacity = interpolate(progress, [0, 0.4], [0, 1], {
    extrapolateRight: 'clamp',
  });

  return (
    <span
      style={{
        fontFamily: tokens.fonts.display,
        fontSize: fontSize ?? tokens.fontSizes.h1,
        fontWeight: 700,
        color: tokens.text.primary,
        opacity,
        transform: `translateY(${translateY}px)`,
        display: 'inline-block',
      }}
    >
      {word}
    </span>
  );
};
