/**
 * ToolGemini — "The Gemini Weave"
 *
 * 120-frame (4s) looping animation showing the Gemini logo at center
 * (slowly rotating) with 6 Google product icons in a circle.
 * A luminous Google-colored thread weaves through each product,
 * followed by a synchronized pulse and starburst.
 *
 * 1920x1080, transparent background.
 */

import React from 'react';
import {
  AbsoluteFill,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import { COLORS } from '../../constants';
import { FONT_FAMILY } from '../../utils/fonts';
import { withOpacity } from '../../utils/colors';
import { GeminiLogo } from './ToolLogos';

const TOTAL_FRAMES = 120;
const CENTER_X = 960;
const CENTER_Y = 480;
const ICON_RADIUS = 400;
const ICON_SIZE = 80;

// ── Google product icon definitions ──────────────────────────

interface ProductIcon {
  label: string;
  color: string;
  angleDeg: number;
}

const PRODUCTS: ProductIcon[] = [
  { label: 'Gmail', color: '#EA4335', angleDeg: 270 },
  { label: 'Sheets', color: '#34A853', angleDeg: 330 },
  { label: 'Slides', color: '#FBBC04', angleDeg: 30 },
  { label: 'Docs', color: '#4285F4', angleDeg: 90 },
  { label: 'GCP', color: '#4285F4', angleDeg: 150 },
  { label: 'Drive', color: '#34A853', angleDeg: 210 },
];

function getProductPos(
  angleDeg: number,
): { x: number; y: number } {
  const rad = (angleDeg * Math.PI) / 180;
  return {
    x: CENTER_X + ICON_RADIUS * Math.cos(rad),
    y: CENTER_Y + ICON_RADIUS * Math.sin(rad),
  };
}

// ── Product icon SVG shapes ──────────────────────────────────

interface IconShapeProps {
  label: string;
  color: string;
  size: number;
}

const IconShape: React.FC<IconShapeProps> = ({ label, color, size }) => {
  const s = size;
  switch (label) {
    case 'Gmail':
      return (
        <svg width={s} height={s} viewBox="0 0 48 48" fill="none">
          <rect x={4} y={10} width={40} height={28} rx={3} fill={withOpacity(color, 0.55)} stroke={color} strokeWidth={2.5} />
          <path d="M4 12 L24 26 L44 12" stroke="#FFFFFF" strokeWidth={2.5} fill="none" />
        </svg>
      );
    case 'Sheets':
      return (
        <svg width={s} height={s} viewBox="0 0 48 48" fill="none">
          <rect x={8} y={4} width={32} height={40} rx={3} fill={withOpacity(color, 0.55)} stroke={color} strokeWidth={2.5} />
          <line x1={8} y1={18} x2={40} y2={18} stroke="#FFFFFF" strokeWidth={2} />
          <line x1={8} y1={28} x2={40} y2={28} stroke="#FFFFFF" strokeWidth={2} />
          <line x1={24} y1={4} x2={24} y2={44} stroke="#FFFFFF" strokeWidth={2} />
        </svg>
      );
    case 'Slides':
      return (
        <svg width={s} height={s} viewBox="0 0 48 48" fill="none">
          <rect x={6} y={8} width={36} height={32} rx={3} fill={withOpacity(color, 0.55)} stroke={color} strokeWidth={2.5} />
          <rect x={14} y={16} width={20} height={16} rx={2} fill={withOpacity('#FFFFFF', 0.3)} stroke="#FFFFFF" strokeWidth={2} />
        </svg>
      );
    case 'Docs':
      return (
        <svg width={s} height={s} viewBox="0 0 48 48" fill="none">
          <rect x={10} y={4} width={28} height={40} rx={3} fill={withOpacity(color, 0.55)} stroke={color} strokeWidth={2.5} />
          <line x1={16} y1={16} x2={32} y2={16} stroke="#FFFFFF" strokeWidth={2} />
          <line x1={16} y1={22} x2={32} y2={22} stroke="#FFFFFF" strokeWidth={2} />
          <line x1={16} y1={28} x2={26} y2={28} stroke="#FFFFFF" strokeWidth={2} />
        </svg>
      );
    case 'GCP':
      return (
        <svg width={s} height={s} viewBox="0 0 48 48" fill="none">
          <polygon
            points="24,4 44,16 44,32 24,44 4,32 4,16"
            fill={withOpacity(color, 0.55)}
            stroke={color}
            strokeWidth={2.5}
          />
          <circle cx={24} cy={24} r={6} fill={withOpacity('#FFFFFF', 0.4)} stroke="#FFFFFF" strokeWidth={2} />
        </svg>
      );
    case 'Drive':
      return (
        <svg width={s} height={s} viewBox="0 0 48 48" fill="none">
          <polygon points="24,6 42,36 6,36" fill={withOpacity('#FBBC04', 0.6)} stroke="#FBBC04" strokeWidth={2.5} />
          <polygon points="6,36 15,21 33,21" fill={withOpacity('#4285F4', 0.5)} />
          <polygon points="42,36 33,21 24,36" fill={withOpacity('#34A853', 0.5)} />
        </svg>
      );
    default:
      return null;
  }
};

// ── Google gradient color cycle ──────────────────────────────

const GOOGLE_COLORS = ['#4285F4', '#34A853', '#FBBC04', '#EA4335'];

function getThreadColor(progress: number): string {
  const index = Math.floor(progress * GOOGLE_COLORS.length) % GOOGLE_COLORS.length;
  return GOOGLE_COLORS[index];
}

// ── Main component ───────────────────────────────────────────

export const ToolGemini: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const loopFrame = frame % TOTAL_FRAMES;

  // ── Logo rotation (0.5 deg/frame = 60 degrees over 120 frames) ──
  const logoRotation = loopFrame * 0.5;

  // ── Phase detection ─────────────────────────────────────
  const phase = Math.floor(loopFrame / 30);
  const phaseProgress = (loopFrame % 30) / 30;

  // ── Thread weaving progress (phases 0-2, maps to products 0-5) ──
  // Phase 0 (0-30): thread goes to product 0 (Gmail)
  // Phase 1 (30-60): thread continues through products 1, 2, 3
  // Phase 2 (60-90): thread completes through products 4, 5 and back
  const overallThreadProgress =
    loopFrame <= 90
      ? interpolate(loopFrame, [0, 90], [0, 1], {
          extrapolateRight: 'clamp',
        })
      : 1;

  // How many products have been fully reached
  const productsReached = Math.floor(overallThreadProgress * 6);

  // ── Product brightness states ───────────────────────────
  const getProductBrightness = (index: number): number => {
    if (phase === 3) {
      // Pulse phase: staggered scale pulse
      const pulseStart = index * 2;
      const pulseFrame = loopFrame - 90 - pulseStart;
      if (pulseFrame >= 0 && pulseFrame <= 15) {
        return interpolate(pulseFrame, [0, 7, 15], [1.0, 1.3, 1.0]);
      }
      return 1.0;
    }
    // During weave: brighten when reached
    if (index < productsReached) return 1.2;
    if (index === productsReached && overallThreadProgress < 1) {
      const subProgress = (overallThreadProgress * 6) % 1;
      return interpolate(subProgress, [0.5, 1], [1.0, 1.2], {
        extrapolateLeft: 'clamp',
        extrapolateRight: 'clamp',
      });
    }
    return 1.0;
  };

  // ── Product scale pulse (phase 3) ──────────────────────
  const getProductScale = (index: number): number => {
    if (phase !== 3) return 1.0;
    const pulseStart = index * 2;
    const pulseFrame = loopFrame - 90 - pulseStart;
    if (pulseFrame >= 0 && pulseFrame <= 15) {
      return interpolate(pulseFrame, [0, 7, 15], [1.0, 1.08, 1.0]);
    }
    return 1.0;
  };

  // ── Trail opacity ──────────────────────────────────────
  const trailOpacity =
    phase === 3
      ? interpolate(phaseProgress, [0, 0.3, 0.7, 1], [0.08, 0.15, 0.15, 0.08])
      : overallThreadProgress > 0
        ? 0.08
        : 0;

  // ── Starburst (phase 3, frames 95-105) ─────────────────
  const starburstFrame = loopFrame - 95;
  const showStarburst =
    phase === 3 && starburstFrame >= 0 && starburstFrame <= 10;
  const starburstOpacity = showStarburst
    ? interpolate(starburstFrame, [0, 3, 10], [0, 0.7, 0])
    : 0;
  const starburstLength = showStarburst
    ? interpolate(starburstFrame, [0, 5, 10], [20, 120, 80])
    : 0;

  return (
    <AbsoluteFill style={{ backgroundColor: 'transparent' }}>
      {/* Thread trail (persistent faint connection lines) */}
      <svg
        width={1920}
        height={1080}
        style={{ position: 'absolute', top: 0, left: 0 }}
      >
        {productsReached > 0 &&
          PRODUCTS.slice(0, productsReached).map((product, i) => {
            const pos = getProductPos(product.angleDeg);
            const nextProduct = PRODUCTS[(i + 1) % PRODUCTS.length];
            const nextPos = getProductPos(nextProduct.angleDeg);
            const isLast = i === productsReached - 1;
            return (
              <line
                key={`trail-${i}`}
                x1={i === 0 ? CENTER_X : getProductPos(PRODUCTS[i].angleDeg).x}
                y1={i === 0 ? CENTER_Y : getProductPos(PRODUCTS[i].angleDeg).y}
                x2={pos.x}
                y2={pos.y}
                stroke={withOpacity(product.color, trailOpacity)}
                strokeWidth={1}
              />
            );
          })}

        {/* Active thread line */}
        {overallThreadProgress > 0 && overallThreadProgress < 1 && (() => {
          const currentIdx = Math.min(productsReached, PRODUCTS.length - 1);
          const prevPos =
            currentIdx === 0
              ? { x: CENTER_X, y: CENTER_Y }
              : getProductPos(PRODUCTS[currentIdx - 1].angleDeg);
          const targetPos = getProductPos(PRODUCTS[currentIdx].angleDeg);
          const subProgress = (overallThreadProgress * 6) % 1;

          const lineEndX = interpolate(subProgress, [0, 1], [prevPos.x, targetPos.x]);
          const lineEndY = interpolate(subProgress, [0, 1], [prevPos.y, targetPos.y]);

          return (
            <line
              x1={prevPos.x}
              y1={prevPos.y}
              x2={lineEndX}
              y2={lineEndY}
              stroke={getThreadColor(overallThreadProgress)}
              strokeWidth={2}
              opacity={0.8}
              filter="url(#glow)"
            />
          );
        })()}

        {/* Glow filter for active thread */}
        <defs>
          <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="3" />
          </filter>
        </defs>

        {/* Starburst rays */}
        {showStarburst &&
          Array.from({ length: 8 }, (_, i) => {
            const angle = (i / 8) * Math.PI * 2;
            return (
              <line
                key={`star-${i}`}
                x1={CENTER_X}
                y1={CENTER_Y}
                x2={CENTER_X + starburstLength * Math.cos(angle)}
                y2={CENTER_Y + starburstLength * Math.sin(angle)}
                stroke={withOpacity('#FFFFFF', starburstOpacity)}
                strokeWidth={1.5}
              />
            );
          })}
      </svg>

      {/* Product icons */}
      {PRODUCTS.map((product, i) => {
        const pos = getProductPos(product.angleDeg);
        const brightness = getProductBrightness(i);
        const scale = getProductScale(i);

        return (
          <div
            key={product.label}
            style={{
              position: 'absolute',
              left: pos.x - ICON_SIZE / 2,
              top: pos.y - ICON_SIZE / 2,
              width: ICON_SIZE,
              height: ICON_SIZE,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              filter: `brightness(${brightness})`,
              transform: `scale(${scale})`,
            }}
          >
            <IconShape
              label={product.label}
              color={product.color}
              size={ICON_SIZE}
            />
          </div>
        );
      })}

      {/* Center Gemini logo (slowly rotating) */}
      <div
        style={{
          position: 'absolute',
          left: CENTER_X - 90,
          top: CENTER_Y - 90,
          width: 180,
          height: 180,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transform: `rotate(${logoRotation}deg)`,
        }}
      >
        <GeminiLogo size={180} />
      </div>

      {/* Bottom text */}
      <div
        style={{
          position: 'absolute',
          bottom: 80,
          left: 0,
          right: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 8,
        }}
      >
        <span
          style={{
            fontFamily: FONT_FAMILY.display,
            fontWeight: 700,
            fontSize: 28,
            color: COLORS.text.primary,
          }}
        >
          Gemini for Google Workspace
        </span>
        <span
          style={{
            fontFamily: FONT_FAMILY.body,
            fontSize: 16,
            color: COLORS.text.secondary,
          }}
        >
          AI Woven Into Every Google Tool
        </span>
      </div>
    </AbsoluteFill>
  );
};
