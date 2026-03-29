/**
 * BigPromise — Thumbnail Template A
 *
 * Left side: face image or pillar-colored circle placeholder.
 * Right side: 2-4 word claim text with pillar accent underline.
 * Dark background with subtle pillar gradient glow.
 * Dimensions: 1280x720 (YouTube thumbnail standard).
 */

import React from 'react';
import { AbsoluteFill, Img } from 'remotion';
import { PillarBadge } from '../components/PillarBadge';
import { COLORS, DIMENSIONS, SIZING, type PillarNumber } from '../constants';
import { FONT_FAMILY } from '../utils/fonts';
import { getPillarColor, getPillarGlow, withOpacity } from '../utils/colors';

// ── Props ───────────────────────────────────────────────────

export interface BigPromiseProps {
  /** 2-4 word claim text */
  text: string;
  /** Optional face image path (staticFile or URL) */
  faceImage?: string;
  /** Content pillar (1-3) */
  pillar: 1 | 2 | 3;
}

// ── Constants ───────────────────────────────────────────────

const THUMB_W = DIMENSIONS.thumbnail.width;
const THUMB_H = DIMENSIONS.thumbnail.height;
const FACE_SIZE = 320;
const TEXT_FONT_SIZE = 56;
const UNDERLINE_HEIGHT = 6;

// ── Component ───────────────────────────────────────────────

export const BigPromise: React.FC<BigPromiseProps> = ({
  text,
  faceImage,
  pillar,
}) => {
  const accent = getPillarColor(pillar as PillarNumber);
  const glow = getPillarGlow(pillar as PillarNumber, 0.2);

  return (
    <AbsoluteFill
      style={{
        width: THUMB_W,
        height: THUMB_H,
        backgroundColor: COLORS.bg.primary,
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        overflow: 'hidden',
      }}
    >
      {/* ── Background gradient glow ─────────────────────────── */}
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '30%',
          transform: 'translate(-50%, -50%)',
          width: 600,
          height: 600,
          borderRadius: '50%',
          background: `radial-gradient(circle, ${withOpacity(accent, 0.15)} 0%, transparent 70%)`,
          filter: 'blur(80px)',
          pointerEvents: 'none',
        }}
      />

      {/* ── Left Side: Face Image / Placeholder ──────────────── */}
      <div
        style={{
          flex: '0 0 auto',
          width: '45%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {faceImage ? (
          <Img
            src={faceImage}
            style={{
              width: FACE_SIZE,
              height: FACE_SIZE,
              borderRadius: '50%',
              objectFit: 'cover',
              border: `4px solid ${accent}`,
              boxShadow: glow,
            }}
          />
        ) : (
          <div
            style={{
              width: FACE_SIZE,
              height: FACE_SIZE,
              borderRadius: '50%',
              background: `linear-gradient(135deg, ${withOpacity(accent, 0.4)} 0%, ${withOpacity(accent, 0.15)} 100%)`,
              border: `4px solid ${accent}`,
              boxShadow: glow,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontFamily: FONT_FAMILY.display,
              fontWeight: 700,
              fontSize: 80,
              color: accent,
            }}
          >
            AI
          </div>
        )}
      </div>

      {/* ── Right Side: Claim Text ───────────────────────────── */}
      <div
        style={{
          flex: '1 1 auto',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          paddingRight: 60,
          gap: 16,
        }}
      >
        <div
          style={{
            fontFamily: FONT_FAMILY.display,
            fontWeight: 700,
            fontSize: TEXT_FONT_SIZE,
            color: COLORS.text.primary,
            lineHeight: 1.15,
            letterSpacing: '-0.02em',
            textTransform: 'uppercase',
          }}
        >
          {text}
        </div>

        {/* Pillar accent underline */}
        <div
          style={{
            width: 120,
            height: UNDERLINE_HEIGHT,
            borderRadius: UNDERLINE_HEIGHT / 2,
            backgroundColor: accent,
            boxShadow: `0 0 16px ${withOpacity(accent, 0.5)}`,
          }}
        />
      </div>

      {/* ── Pillar Badge (top-right) ─────────────────────────── */}
      <div
        style={{
          position: 'absolute',
          top: 24,
          right: 24,
        }}
      >
        <PillarBadge pillar={pillar as PillarNumber} size="lg" />
      </div>

      {/* ── Subtle border frame ──────────────────────────────── */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          border: `1px solid ${withOpacity(accent, 0.15)}`,
          borderRadius: 4,
          pointerEvents: 'none',
        }}
      />
    </AbsoluteFill>
  );
};
