/**
 * ToolCopilot — "The Copilot Constellation"
 *
 * 120-frame (4s) looping animation showing the Microsoft Copilot logo
 * at center with 6 Microsoft app icons orbiting in a 3D ellipse.
 * A sparkle trail connects the logo to orbiting apps in sequence,
 * then faint connection lines pulse before looping.
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
import { CopilotLogo } from './ToolLogos';

// ── App icon definitions ─────────────────────────────────────

interface AppIcon {
  letter: string;
  color: string;
  label: string;
}

const APP_ICONS: AppIcon[] = [
  { letter: 'W', color: '#2B579A', label: 'Word' },
  { letter: 'X', color: '#217346', label: 'Excel' },
  { letter: 'P', color: '#D24726', label: 'PowerPoint' },
  { letter: 'T', color: '#6264A7', label: 'Teams' },
  { letter: 'O', color: '#0078D4', label: 'Outlook' },
  { letter: 'A', color: '#0089D6', label: 'Azure' },
];

const TOTAL_FRAMES = 120;
const ORBIT_RX = 480;
const ORBIT_RY = 180;
const CENTER_X = 960;
const CENTER_Y = 480;
const ICON_SIZE = 52;

// ── Sparkle effect helper ────────────────────────────────────

interface SparkleProps {
  x: number;
  y: number;
  frame: number;
  startFrame: number;
}

const Sparkle: React.FC<SparkleProps> = ({ x, y, frame, startFrame }) => {
  const localFrame = frame - startFrame;
  if (localFrame < 0 || localFrame > 6) return null;

  const opacity = interpolate(localFrame, [0, 3, 6], [0, 1, 0]);
  const scale = interpolate(localFrame, [0, 3, 6], [0.5, 1.2, 0.5]);

  return (
    <div
      style={{
        position: 'absolute',
        left: x - 4,
        top: y - 4,
        width: 8,
        height: 8,
        backgroundColor: '#FFFFFF',
        borderRadius: 1,
        opacity,
        transform: `scale(${scale}) rotate(45deg)`,
        boxShadow: '0 0 8px rgba(255, 255, 255, 0.8)',
      }}
    />
  );
};

// ── Main component ───────────────────────────────────────────

export const ToolCopilot: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const loopFrame = frame % TOTAL_FRAMES;

  // ── Logo pulse (sin wave, period = 120 frames) ──────────
  const pulseScale =
    1.0 + 0.06 * Math.sin((loopFrame / TOTAL_FRAMES) * Math.PI * 2);

  // ── Orbit positions ─────────────────────────────────────
  const getOrbitPosition = (
    index: number,
  ): { x: number; y: number } => {
    const angle =
      (loopFrame / TOTAL_FRAMES) * Math.PI * 2 +
      (index / APP_ICONS.length) * Math.PI * 2;
    return {
      x: CENTER_X + ORBIT_RX * Math.cos(angle),
      y: CENTER_Y + ORBIT_RY * Math.sin(angle),
    };
  };

  // ── Determine which app is being "touched" by sparkle trail ──
  // Phase 0-30: app 0, Phase 30-60: app 1, Phase 60-90: app 2
  const activePhase = Math.floor(loopFrame / 30);
  const phaseProgress = (loopFrame % 30) / 30;
  const activeAppIndex = activePhase < 3 ? activePhase : -1;

  // ── Connection lines phase (90-120) ─────────────────────
  const showConnections = activePhase === 3;
  const connectionPulse = showConnections
    ? interpolate(
        (loopFrame - 90) / 30,
        [0, 0.3, 0.7, 1],
        [0.1, 0.25, 0.25, 0.1],
      )
    : 0;

  // ── Track which apps have been enhanced ─────────────────
  const enhancedApps = new Set<number>();
  if (loopFrame >= 0) enhancedApps.add(0);
  if (loopFrame >= 30) enhancedApps.add(1);
  if (loopFrame >= 60) enhancedApps.add(2);

  return (
    <AbsoluteFill style={{ backgroundColor: 'transparent' }}>
      {/* Connection lines (phase 90-120) */}
      {showConnections && (
        <svg
          width={1920}
          height={1080}
          style={{ position: 'absolute', top: 0, left: 0 }}
        >
          {[0, 1, 2].map((idx) => {
            const pos = getOrbitPosition(idx);
            return (
              <line
                key={`conn-${idx}`}
                x1={CENTER_X}
                y1={CENTER_Y}
                x2={pos.x}
                y2={pos.y}
                stroke={withOpacity('#FFFFFF', connectionPulse)}
                strokeWidth={1}
              />
            );
          })}
        </svg>
      )}

      {/* Sparkle trail line (phases 0-2) */}
      {activeAppIndex >= 0 && (
        <svg
          width={1920}
          height={1080}
          style={{ position: 'absolute', top: 0, left: 0 }}
        >
          <defs>
            <linearGradient
              id="trail-grad"
              x1="0%"
              y1="0%"
              x2="100%"
              y2="100%"
            >
              <stop offset="0%" stopColor="#FFFFFF" stopOpacity={0.8} />
              <stop
                offset="100%"
                stopColor="#FFFFFF"
                stopOpacity={0}
              />
            </linearGradient>
          </defs>
          {(() => {
            const targetPos = getOrbitPosition(activeAppIndex);
            const trailEndX = interpolate(
              phaseProgress,
              [0, 0.7, 1],
              [CENTER_X, targetPos.x, targetPos.x],
            );
            const trailEndY = interpolate(
              phaseProgress,
              [0, 0.7, 1],
              [CENTER_Y, targetPos.y, targetPos.y],
            );
            const trailOpacity = interpolate(
              phaseProgress,
              [0, 0.1, 0.7, 1],
              [0, 0.8, 0.8, 0],
            );
            return (
              <line
                x1={CENTER_X}
                y1={CENTER_Y}
                x2={trailEndX}
                y2={trailEndY}
                stroke="white"
                strokeWidth={2}
                opacity={trailOpacity}
              />
            );
          })()}
        </svg>
      )}

      {/* Orbiting app icons */}
      {APP_ICONS.map((app, i) => {
        const pos = getOrbitPosition(i);
        const isActive = activeAppIndex === i && phaseProgress > 0.5;
        const wasEnhanced = enhancedApps.has(i) && showConnections;
        const brightness =
          isActive || wasEnhanced ? 1.3 : 1.0;

        return (
          <React.Fragment key={app.label}>
            <div
              style={{
                position: 'absolute',
                left: pos.x - ICON_SIZE / 2,
                top: pos.y - ICON_SIZE / 2,
                width: ICON_SIZE,
                height: ICON_SIZE,
                borderRadius: 10,
                backgroundColor: app.color,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                filter: `brightness(${brightness})`,
                boxShadow: isActive
                  ? `0 0 16px ${withOpacity(app.color, 0.6)}`
                  : 'none',
                transition: 'filter 0.1s',
              }}
            >
              <span
                style={{
                  fontFamily: FONT_FAMILY.display,
                  fontWeight: 700,
                  fontSize: 20,
                  color: '#FFFFFF',
                }}
              >
                {app.letter}
              </span>
            </div>

            {/* Sparkle on the touched app */}
            {activeAppIndex === i && (
              <Sparkle
                x={pos.x + ICON_SIZE / 2 - 4}
                y={pos.y - ICON_SIZE / 2 + 4}
                frame={loopFrame}
                startFrame={activePhase * 30 + 18}
              />
            )}
          </React.Fragment>
        );
      })}

      {/* Center Copilot logo */}
      <div
        style={{
          position: 'absolute',
          left: CENTER_X - 100,
          top: CENTER_Y - 100,
          width: 200,
          height: 200,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transform: `scale(${pulseScale})`,
        }}
      >
        <CopilotLogo size={200} />
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
          Microsoft Copilot
        </span>
        <span
          style={{
            fontFamily: FONT_FAMILY.body,
            fontSize: 16,
            color: COLORS.text.secondary,
          }}
        >
          AI Across the Entire Microsoft Ecosystem
        </span>
      </div>
    </AbsoluteFill>
  );
};
