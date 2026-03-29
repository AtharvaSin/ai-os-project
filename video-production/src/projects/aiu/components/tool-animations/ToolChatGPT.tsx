/**
 * ToolChatGPT — "The Enterprise Vault"
 *
 * 120-frame (4s) looping animation showing the ChatGPT logo at center
 * surrounded by a hexagonal security shield. The shield assembles,
 * data flows through it, security badges cycle, and a final green
 * pulse confirms enterprise-grade protection.
 *
 * 1920x1080, transparent background.
 */

import React from 'react';
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import { COLORS } from '../../constants';
import { FONT_FAMILY } from '../../utils/fonts';
import { withOpacity } from '../../utils/colors';
import { ChatGPTLogo } from './ToolLogos';

const TOTAL_FRAMES = 120;
const CENTER_X = 960;
const CENTER_Y = 480;
const HEX_RADIUS = 200;

// ── Shield panel definitions ─────────────────────────────────

interface ShieldPanel {
  label: string;
  icon: string;
  angleDeg: number;
  flyInX: number;
  flyInY: number;
}

const PANELS: ShieldPanel[] = [
  { label: 'Lock', icon: '\uD83D\uDD12', angleDeg: 0, flyInX: 400, flyInY: 0 },
  { label: 'Shield', icon: '\uD83D\uDEE1\uFE0F', angleDeg: 60, flyInX: 300, flyInY: -300 },
  { label: 'Building', icon: '\uD83C\uDFE2', angleDeg: 120, flyInX: -300, flyInY: -300 },
  { label: 'No Train', icon: '\u2718', angleDeg: 180, flyInX: -400, flyInY: 0 },
  { label: 'SOC2', icon: 'SOC2', angleDeg: 240, flyInX: -300, flyInY: 300 },
  { label: 'Key', icon: '\uD83D\uDD10', angleDeg: 300, flyInX: 300, flyInY: 300 },
];

// ── Security badge labels ────────────────────────────────────

const BADGE_LABELS = [
  'Encrypted \u2713',
  'Private \u2713',
  'Compliant \u2713',
];

// ── Hex panel vertex computation ─────────────────────────────

function getHexVertex(
  angleDeg: number,
  radius: number,
): { x: number; y: number } {
  const rad = (angleDeg * Math.PI) / 180;
  return {
    x: CENTER_X + radius * Math.cos(rad),
    y: CENTER_Y + radius * Math.sin(rad),
  };
}

// ── Data dot component ───────────────────────────────────────

interface DataDotProps {
  progress: number;
  color: string;
  pathFn: (t: number) => { x: number; y: number };
}

const DataDot: React.FC<DataDotProps> = ({ progress, color, pathFn }) => {
  if (progress < 0 || progress > 1) return null;
  const pos = pathFn(progress);
  return (
    <div
      style={{
        position: 'absolute',
        left: pos.x - 4,
        top: pos.y - 4,
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: color,
        boxShadow: `0 0 8px ${color}`,
      }}
    />
  );
};

// ── Main component ───────────────────────────────────────────

export const ToolChatGPT: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const loopFrame = frame % TOTAL_FRAMES;

  const phase = Math.floor(loopFrame / 30);
  const phaseProgress = (loopFrame % 30) / 30;

  // ── Phase 0 (0-30): Shield assembly ─────────────────────
  const getPanelTransform = (
    index: number,
  ): { x: number; y: number; opacity: number } => {
    if (phase > 0) return { x: 0, y: 0, opacity: 1 };

    const panelDelay = index * 3;
    const panelFrame = loopFrame - panelDelay;
    if (panelFrame < 0) return { x: PANELS[index].flyInX, y: PANELS[index].flyInY, opacity: 0 };

    const progress = spring({
      frame: panelFrame,
      fps,
      config: { damping: 14, stiffness: 120, mass: 0.8 },
    });

    return {
      x: interpolate(progress, [0, 1], [PANELS[index].flyInX, 0]),
      y: interpolate(progress, [0, 1], [PANELS[index].flyInY, 0]),
      opacity: interpolate(progress, [0, 0.3], [0, 1], {
        extrapolateRight: 'clamp',
      }),
    };
  };

  // Assembly flash (when all panels arrive ~frame 18-24)
  const assemblyFlash =
    phase === 0 && loopFrame >= 18 && loopFrame <= 24
      ? interpolate(loopFrame, [18, 21, 24], [0, 1, 0])
      : 0;

  // ── Phase 1 (30-60): Data flow ──────────────────────────
  const makeInputPath = (
    offset: number,
  ): ((t: number) => { x: number; y: number }) => {
    return (t: number) => {
      const startX = CENTER_X - 400;
      const startY = CENTER_Y - 60 + offset * 30;
      const endX = CENTER_X;
      const endY = CENTER_Y;
      const midY = startY + (endY - startY) * 0.5 + Math.sin(t * Math.PI) * 40;
      return {
        x: interpolate(t, [0, 1], [startX, endX]),
        y: interpolate(t, [0, 0.5, 1], [startY, midY, endY]),
      };
    };
  };

  const makeOutputPath = (
    offset: number,
  ): ((t: number) => { x: number; y: number }) => {
    return (t: number) => {
      const startX = CENTER_X;
      const startY = CENTER_Y;
      const endX = CENTER_X + 400;
      const endY = CENTER_Y - 40 + offset * 30;
      const midY = startY + (endY - startY) * 0.5 - Math.sin(t * Math.PI) * 30;
      return {
        x: interpolate(t, [0, 1], [startX, endX]),
        y: interpolate(t, [0, 0.5, 1], [startY, midY, endY]),
      };
    };
  };

  // ── Phase 2 (60-90): Security badges ───────────────────
  const activeBadgeIndex =
    phase === 2 ? Math.floor(phaseProgress * BADGE_LABELS.length) : -1;
  const badgeFade =
    phase === 2
      ? interpolate(
          (phaseProgress * BADGE_LABELS.length) % 1,
          [0, 0.15, 0.85, 1],
          [0, 1, 1, 0],
        )
      : 0;

  // Badge positions around the hex
  const badgePositions = [
    { x: CENTER_X, y: CENTER_Y - HEX_RADIUS - 50 },
    { x: CENTER_X + HEX_RADIUS + 60, y: CENTER_Y },
    { x: CENTER_X, y: CENTER_Y + HEX_RADIUS + 50 },
  ];

  // ── Phase 3 (90-120): Green pulse + logo rotation ──────
  const greenPulse =
    phase === 3 && loopFrame >= 90 && loopFrame <= 98
      ? interpolate(loopFrame, [90, 94, 98], [0, 1, 0])
      : 0;
  const logoRotation =
    phase === 3
      ? interpolate(phaseProgress, [0, 1], [0, 360])
      : 0;

  return (
    <AbsoluteFill style={{ backgroundColor: 'transparent' }}>
      {/* Hexagonal shield border */}
      <svg
        width={1920}
        height={1080}
        style={{ position: 'absolute', top: 0, left: 0 }}
      >
        <polygon
          points={PANELS.map((p) => {
            const v = getHexVertex(p.angleDeg, HEX_RADIUS);
            return `${v.x},${v.y}`;
          }).join(' ')}
          fill="none"
          stroke={
            greenPulse > 0
              ? withOpacity('#10B981', 0.4 + greenPulse * 0.6)
              : withOpacity(COLORS.border, 0.4)
          }
          strokeWidth={greenPulse > 0 ? 3 : 2}
        />
      </svg>

      {/* Shield panels */}
      {PANELS.map((panel, i) => {
        const pos = getHexVertex(panel.angleDeg, HEX_RADIUS);
        const transform = getPanelTransform(i);

        return (
          <div
            key={panel.label}
            style={{
              position: 'absolute',
              left: pos.x - 28 + transform.x,
              top: pos.y - 28 + transform.y,
              width: 56,
              height: 56,
              borderRadius: 12,
              backgroundColor: withOpacity(COLORS.bg.elevated, 0.9),
              border: `1.5px solid ${
                greenPulse > 0
                  ? withOpacity('#10B981', 0.5 + greenPulse * 0.5)
                  : withOpacity(COLORS.border, 0.6 + assemblyFlash * 0.4)
              }`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              opacity: transform.opacity,
              boxShadow:
                assemblyFlash > 0
                  ? `0 0 20px ${withOpacity('#10B981', assemblyFlash * 0.6)}`
                  : greenPulse > 0
                    ? `0 0 16px ${withOpacity('#10B981', greenPulse * 0.5)}`
                    : 'none',
            }}
          >
            <span
              style={{
                fontSize: panel.icon === 'SOC2' || panel.icon === '\u2718' ? 14 : 22,
                fontFamily:
                  panel.icon === 'SOC2' || panel.icon === '\u2718'
                    ? FONT_FAMILY.display
                    : undefined,
                fontWeight: 700,
                color:
                  panel.icon === 'SOC2'
                    ? '#10B981'
                    : panel.icon === '\u2718'
                      ? '#EF4444'
                      : undefined,
              }}
            >
              {panel.icon}
            </span>
          </div>
        );
      })}

      {/* Data flow dots (phase 1) */}
      {phase === 1 && (
        <>
          {[0, 1, 2].map((i) => {
            const dotProgress = interpolate(
              phaseProgress,
              [i * 0.15, i * 0.15 + 0.5],
              [0, 1],
              { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' },
            );
            return (
              <DataDot
                key={`in-${i}`}
                progress={dotProgress}
                color="#3B82F6"
                pathFn={makeInputPath(i)}
              />
            );
          })}
          {[0, 1].map((i) => {
            const dotProgress = interpolate(
              phaseProgress,
              [0.35 + i * 0.15, 0.35 + i * 0.15 + 0.5],
              [0, 1],
              { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' },
            );
            return (
              <DataDot
                key={`out-${i}`}
                progress={dotProgress}
                color="#10B981"
                pathFn={makeOutputPath(i)}
              />
            );
          })}
        </>
      )}

      {/* Security badge labels (phase 2) */}
      {phase === 2 && activeBadgeIndex >= 0 && activeBadgeIndex < BADGE_LABELS.length && (
        <div
          style={{
            position: 'absolute',
            left: badgePositions[activeBadgeIndex].x - 80,
            top: badgePositions[activeBadgeIndex].y - 16,
            width: 160,
            display: 'flex',
            justifyContent: 'center',
            opacity: badgeFade,
          }}
        >
          <div
            style={{
              padding: '6px 16px',
              borderRadius: 20,
              backgroundColor: withOpacity('#10B981', 0.15),
              border: `1px solid ${withOpacity('#10B981', 0.4)}`,
            }}
          >
            <span
              style={{
                fontFamily: FONT_FAMILY.body,
                fontWeight: 600,
                fontSize: 14,
                color: '#10B981',
                whiteSpace: 'nowrap',
              }}
            >
              {BADGE_LABELS[activeBadgeIndex]}
            </span>
          </div>
        </div>
      )}

      {/* Center ChatGPT logo */}
      <div
        style={{
          position: 'absolute',
          left: CENTER_X - 70,
          top: CENTER_Y - 70,
          width: 140,
          height: 140,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transform: `rotate(${logoRotation}deg)`,
        }}
      >
        <ChatGPTLogo size={140} />
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
          ChatGPT Enterprise
        </span>
        <span
          style={{
            fontFamily: FONT_FAMILY.body,
            fontSize: 16,
            color: COLORS.text.secondary,
          }}
        >
          Enterprise-Grade AI with Privacy & Security
        </span>
      </div>
    </AbsoluteFill>
  );
};
