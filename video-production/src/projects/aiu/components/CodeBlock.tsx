/**
 * CodeBlock — Syntax-highlighted code display with line-by-line reveal.
 *
 * Renders a dark code card with an optional file name tab, line numbers,
 * and sequential line reveal animation. Highlighted lines receive a
 * subtle pillar accent background stripe. No actual syntax coloring --
 * all code text is white for simplicity.
 */

import React from 'react';
import { useCurrentFrame, useVideoConfig, spring, interpolate } from 'remotion';
import { COLORS, SIZING, type PillarNumber } from '../constants';
import { getPillarColor, withOpacity } from '../utils/colors';
import { SPRING_CONFIGS } from '../utils/animations';
import { FONT_FAMILY } from '../utils/fonts';

interface CodeBlockProps {
  /** The code string to display (newlines separate lines) */
  code: string;
  /** Language label shown in the file tab (e.g. "typescript") */
  language: string;
  /** Optional file name shown in the tab (e.g. "index.ts") */
  fileName?: string;
  /** 1-based line numbers to highlight with accent stripe */
  highlightLines?: number[];
  /** Which content pillar determines the highlight accent color */
  pillar?: PillarNumber;
  /** Frame delay before the line reveal animation starts */
  delay?: number;
}

/** Frames between each line appearing */
const LINE_STAGGER = 3;

export const CodeBlock: React.FC<CodeBlockProps> = ({
  code,
  language,
  fileName,
  highlightLines = [],
  pillar = 2,
  delay = 0,
}) => {
  const accent = getPillarColor(pillar);
  const lines = code.split('\n');
  const tabLabel = fileName ?? language;

  return (
    <div
      style={{
        backgroundColor: COLORS.bg.code,
        borderRadius: SIZING.borderRadius,
        border: `1px solid ${COLORS.border}`,
        overflow: 'hidden',
        boxShadow: `0 8px 32px ${withOpacity('#000000', 0.4)}`,
      }}
    >
      {/* File name tab */}
      <div
        style={{
          backgroundColor: COLORS.bg.card,
          borderBottom: `1px solid ${COLORS.border}`,
          padding: '8px 16px',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}
      >
        {/* Decorative dots */}
        <div style={{ display: 'flex', gap: 5 }}>
          <div
            style={{
              width: 10,
              height: 10,
              borderRadius: 5,
              backgroundColor: '#EF4444',
              opacity: 0.7,
            }}
          />
          <div
            style={{
              width: 10,
              height: 10,
              borderRadius: 5,
              backgroundColor: '#F59E0B',
              opacity: 0.7,
            }}
          />
          <div
            style={{
              width: 10,
              height: 10,
              borderRadius: 5,
              backgroundColor: '#10B981',
              opacity: 0.7,
            }}
          />
        </div>

        <span
          style={{
            fontFamily: FONT_FAMILY.code,
            fontWeight: 400,
            fontSize: 12,
            color: COLORS.text.muted,
            marginLeft: 4,
          }}
        >
          {tabLabel}
        </span>
      </div>

      {/* Code area */}
      <div style={{ padding: 20 }}>
        {lines.map((line, index) => (
          <CodeLine
            key={index}
            text={line}
            lineNumber={index + 1}
            isHighlighted={highlightLines.includes(index + 1)}
            accent={accent}
            delay={delay + index * LINE_STAGGER}
          />
        ))}
      </div>
    </div>
  );
};

// ── Code Line ───────────────────────────────────────────────

interface CodeLineProps {
  text: string;
  lineNumber: number;
  isHighlighted: boolean;
  accent: string;
  delay: number;
}

const CodeLine: React.FC<CodeLineProps> = ({
  text,
  lineNumber,
  isHighlighted,
  accent,
  delay,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const progress = spring({
    frame: frame - delay,
    fps,
    config: SPRING_CONFIGS.fast,
  });

  const opacity = interpolate(progress, [0, 0.4], [0, 1], {
    extrapolateRight: 'clamp',
  });

  const translateY = interpolate(progress, [0, 1], [6, 0]);

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'baseline',
        opacity,
        transform: `translateY(${translateY}px)`,
        backgroundColor: isHighlighted
          ? withOpacity(accent, 0.1)
          : 'transparent',
        marginLeft: -20,
        marginRight: -20,
        paddingLeft: 20,
        paddingRight: 20,
        borderLeft: isHighlighted ? `3px solid ${accent}` : '3px solid transparent',
        minHeight: 24,
      }}
    >
      {/* Line number */}
      <span
        style={{
          fontFamily: FONT_FAMILY.code,
          fontWeight: 400,
          fontSize: 13,
          color: COLORS.text.muted,
          width: 36,
          textAlign: 'right',
          marginRight: 16,
          flexShrink: 0,
          userSelect: 'none',
          opacity: 0.6,
        }}
      >
        {lineNumber}
      </span>

      {/* Code text */}
      <span
        style={{
          fontFamily: FONT_FAMILY.code,
          fontWeight: 400,
          fontSize: 14,
          color: COLORS.text.primary,
          whiteSpace: 'pre',
          lineHeight: 1.7,
        }}
      >
        {text}
      </span>
    </div>
  );
};
