/**
 * TypewriterText — Character-by-character text reveal with blinking cursor
 */

import React from 'react';
import { useCurrentFrame, useVideoConfig } from 'remotion';
import type { BrandTokens } from '../utils/brand-tokens';

interface TypewriterTextProps {
  text: string;
  tokens: BrandTokens;
  /** Milliseconds per character (default: 50) */
  speed?: number;
  /** Show blinking cursor (default: true) */
  showCursor?: boolean;
  /** Font size override */
  fontSize?: number;
  /** Use display font instead of mono */
  useDisplayFont?: boolean;
}

export const TypewriterText: React.FC<TypewriterTextProps> = ({
  text,
  tokens,
  speed = 50,
  showCursor = true,
  fontSize,
  useDisplayFont = false,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const msElapsed = (frame / fps) * 1000;
  const charsToShow = Math.min(Math.floor(msElapsed / speed), text.length);
  const visibleText = text.substring(0, charsToShow);
  const cursorVisible = showCursor && frame % 20 < 12;

  return (
    <span
      style={{
        fontFamily: useDisplayFont ? tokens.fonts.display : tokens.fonts.mono,
        fontSize: fontSize ?? tokens.fontSizes.h2,
        color: tokens.text.primary,
        letterSpacing: useDisplayFont ? '0.05em' : undefined,
      }}
    >
      {visibleText}
      {cursorVisible && (
        <span style={{ color: tokens.accent.primary }}>|</span>
      )}
    </span>
  );
};
