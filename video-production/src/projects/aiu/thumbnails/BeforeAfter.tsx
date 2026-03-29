/**
 * BeforeAfter — Thumbnail Template B
 *
 * Split layout: left "BEFORE" (desaturated) / right "AFTER" (pillar glow).
 * Arrow transformation indicator in the center divider.
 * Title text at the top.
 * Dimensions: 1280x720 (YouTube thumbnail standard).
 */

import React from 'react';
import { AbsoluteFill, Img } from 'remotion';
import { COLORS, DIMENSIONS, SIZING, type PillarNumber } from '../constants';
import { FONT_FAMILY } from '../utils/fonts';
import { getPillarColor, withOpacity } from '../utils/colors';

// ── Props ───────────────────────────────────────────────────

export interface BeforeAfterProps {
  /** Title / claim text at the top */
  text: string;
  /** Optional "before" state image path */
  beforeImage?: string;
  /** Optional "after" state image path */
  afterImage?: string;
  /** Content pillar (1-3) */
  pillar: 1 | 2 | 3;
}

// ── Constants ───────────────────────────────────────────────

const THUMB_W = DIMENSIONS.thumbnail.width;
const THUMB_H = DIMENSIONS.thumbnail.height;
const HALF_W = THUMB_W / 2;
const DIVIDER_WIDTH = 6;
const ARROW_SIZE = 52;
const LABEL_FONT_SIZE = 20;
const TITLE_FONT_SIZE = 40;
const PLACEHOLDER_SIZE = 180;

// ── Component ───────────────────────────────────────────────

export const BeforeAfter: React.FC<BeforeAfterProps> = ({
  text,
  beforeImage,
  afterImage,
  pillar,
}) => {
  const accent = getPillarColor(pillar as PillarNumber);

  return (
    <AbsoluteFill
      style={{
        width: THUMB_W,
        height: THUMB_H,
        backgroundColor: COLORS.bg.primary,
        overflow: 'hidden',
      }}
    >
      {/* ── Left Panel: BEFORE ───────────────────────────────── */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: HALF_W - DIVIDER_WIDTH / 2,
          height: THUMB_H,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: COLORS.bg.card,
          filter: 'saturate(0.3)',
          overflow: 'hidden',
        }}
      >
        {beforeImage ? (
          <Img
            src={beforeImage}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              filter: 'saturate(0.3) brightness(0.8)',
            }}
          />
        ) : (
          <BeforePlaceholder />
        )}

        {/* BEFORE label */}
        <div
          style={{
            position: 'absolute',
            bottom: 24,
            left: 24,
            fontFamily: FONT_FAMILY.code,
            fontWeight: 600,
            fontSize: LABEL_FONT_SIZE,
            color: COLORS.text.muted,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            backgroundColor: withOpacity(COLORS.bg.primary, 0.8),
            padding: '6px 14px',
            borderRadius: SIZING.borderRadiusSm,
          }}
        >
          BEFORE
        </div>
      </div>

      {/* ── Right Panel: AFTER ───────────────────────────────── */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          right: 0,
          width: HALF_W - DIVIDER_WIDTH / 2,
          height: THUMB_H,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
        }}
      >
        {/* Pillar accent glow on the after side */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: `radial-gradient(ellipse at 60% 50%, ${withOpacity(accent, 0.12)} 0%, transparent 70%)`,
            pointerEvents: 'none',
          }}
        />

        {afterImage ? (
          <Img
            src={afterImage}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
            }}
          />
        ) : (
          <AfterPlaceholder accent={accent} />
        )}

        {/* AFTER label */}
        <div
          style={{
            position: 'absolute',
            bottom: 24,
            right: 24,
            fontFamily: FONT_FAMILY.code,
            fontWeight: 600,
            fontSize: LABEL_FONT_SIZE,
            color: accent,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            backgroundColor: withOpacity(COLORS.bg.primary, 0.8),
            padding: '6px 14px',
            borderRadius: SIZING.borderRadiusSm,
            border: `1px solid ${withOpacity(accent, 0.3)}`,
          }}
        >
          AFTER
        </div>
      </div>

      {/* ── Center Divider + Arrow ───────────────────────────── */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: HALF_W - DIVIDER_WIDTH / 2,
          width: DIVIDER_WIDTH,
          height: THUMB_H,
          backgroundColor: accent,
          boxShadow: `0 0 24px ${withOpacity(accent, 0.5)}, 0 0 48px ${withOpacity(accent, 0.2)}`,
          zIndex: 10,
        }}
      />

      {/* Arrow circle in the center */}
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: ARROW_SIZE,
          height: ARROW_SIZE,
          borderRadius: '50%',
          backgroundColor: accent,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: `0 0 20px ${withOpacity(accent, 0.6)}`,
          zIndex: 11,
        }}
      >
        {/* Right-pointing arrow via CSS triangle */}
        <div
          style={{
            width: 0,
            height: 0,
            borderTop: '10px solid transparent',
            borderBottom: '10px solid transparent',
            borderLeft: `16px solid ${COLORS.bg.primary}`,
            marginLeft: 4,
          }}
        />
      </div>

      {/* ── Title Text (top center) ──────────────────────────── */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          display: 'flex',
          justifyContent: 'center',
          paddingTop: 28,
          zIndex: 12,
        }}
      >
        <div
          style={{
            fontFamily: FONT_FAMILY.display,
            fontWeight: 700,
            fontSize: TITLE_FONT_SIZE,
            color: COLORS.text.primary,
            textAlign: 'center',
            lineHeight: 1.2,
            letterSpacing: '-0.02em',
            padding: '10px 36px',
            borderRadius: SIZING.borderRadius,
            backgroundColor: withOpacity(COLORS.bg.primary, 0.85),
            backdropFilter: 'blur(8px)',
            textTransform: 'uppercase',
          }}
        >
          {text}
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ── Placeholder Components ──────────────────────────────────

const BeforePlaceholder: React.FC = () => (
  <div
    style={{
      width: PLACEHOLDER_SIZE,
      height: PLACEHOLDER_SIZE,
      borderRadius: SIZING.borderRadius,
      backgroundColor: COLORS.bg.elevated,
      border: `1px solid ${COLORS.border}`,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: FONT_FAMILY.code,
      fontSize: 48,
      color: COLORS.text.muted,
    }}
  >
    ?
  </div>
);

interface AfterPlaceholderProps {
  accent: string;
}

const AfterPlaceholder: React.FC<AfterPlaceholderProps> = ({ accent }) => (
  <div
    style={{
      width: PLACEHOLDER_SIZE,
      height: PLACEHOLDER_SIZE,
      borderRadius: SIZING.borderRadius,
      backgroundColor: COLORS.bg.elevated,
      border: `2px solid ${accent}`,
      boxShadow: `0 0 30px ${withOpacity(accent, 0.3)}`,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: FONT_FAMILY.code,
      fontSize: 48,
      color: accent,
    }}
  >
    ✓
  </div>
);
