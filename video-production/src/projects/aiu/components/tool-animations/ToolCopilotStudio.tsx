/**
 * ToolCopilotStudio — "The Custom Workshop"
 *
 * 120-frame (4s) looping animation showing the Copilot Studio logo
 * at center with an assembly ring of knowledge docs, connectors,
 * and output icons. Animated absorption, connection, ripple, and
 * chat-bubble phases demonstrate custom AI agent building.
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
import { CopilotStudioLogo } from './ToolLogos';

const TOTAL_FRAMES = 120;
const CENTER_X = 960;
const CENTER_Y = 480;
const RING_RADIUS = 340;

// ── Helpers ──────────────────────────────────────────────────

function polarToCartesian(
  angleDeg: number,
  radius: number,
): { x: number; y: number } {
  const rad = (angleDeg * Math.PI) / 180;
  return {
    x: CENTER_X + radius * Math.cos(rad),
    y: CENTER_Y + radius * Math.sin(rad),
  };
}

// ── Document icon sub-component ──────────────────────────────

interface DocIconProps {
  x: number;
  y: number;
  barColor: string;
  opacity: number;
  scale: number;
}

const DocIcon: React.FC<DocIconProps> = ({
  x,
  y,
  barColor,
  opacity,
  scale,
}) => (
  <div
    style={{
      position: 'absolute',
      left: x - 14,
      top: y - 18,
      width: 28,
      height: 36,
      backgroundColor: '#E8E8E8',
      borderRadius: 4,
      opacity,
      transform: `scale(${scale})`,
      overflow: 'hidden',
    }}
  >
    <div
      style={{
        width: '100%',
        height: 6,
        backgroundColor: barColor,
      }}
    />
    <div
      style={{
        margin: '6px 4px',
        display: 'flex',
        flexDirection: 'column',
        gap: 3,
      }}
    >
      <div
        style={{
          width: '80%',
          height: 2,
          backgroundColor: '#C0C0C0',
          borderRadius: 1,
        }}
      />
      <div
        style={{
          width: '60%',
          height: 2,
          backgroundColor: '#C0C0C0',
          borderRadius: 1,
        }}
      />
      <div
        style={{
          width: '70%',
          height: 2,
          backgroundColor: '#C0C0C0',
          borderRadius: 1,
        }}
      />
    </div>
  </div>
);

// ── Connector icon sub-component ─────────────────────────────

interface ConnectorIconProps {
  x: number;
  y: number;
  color: string;
  opacity: number;
}

const ConnectorIcon: React.FC<ConnectorIconProps> = ({
  x,
  y,
  color,
  opacity,
}) => (
  <div
    style={{
      position: 'absolute',
      left: x - 16,
      top: y - 16,
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: withOpacity(color, 0.2),
      border: `2px solid ${color}`,
      opacity,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }}
  >
    {/* Small bolt / plug shape */}
    <svg width={16} height={16} viewBox="0 0 16 16" fill="none">
      <path
        d="M4 3 L8 3 L7 7 L10 7 L5 14 L7 9 L4 9 Z"
        fill={color}
      />
    </svg>
  </div>
);

// ── Output icon sub-components ───────────────────────────────

interface OutputIconProps {
  x: number;
  y: number;
  opacity: number;
}

const ChatBubbleIcon: React.FC<OutputIconProps> = ({ x, y, opacity }) => (
  <div
    style={{
      position: 'absolute',
      left: x - 16,
      top: y - 14,
      opacity,
    }}
  >
    <svg width={32} height={28} viewBox="0 0 32 28" fill="none">
      <path
        d="M4 2 h24 a2 2 0 0 1 2 2 v14 a2 2 0 0 1-2 2 h-14 l-6 6 v-6 h-4 a2 2 0 0 1-2-2 v-14 a2 2 0 0 1 2-2z"
        fill={withOpacity('#60A5FA', 0.3)}
        stroke="#60A5FA"
        strokeWidth={1.5}
      />
    </svg>
  </div>
);

const BellIcon: React.FC<OutputIconProps> = ({ x, y, opacity }) => (
  <div
    style={{
      position: 'absolute',
      left: x - 14,
      top: y - 14,
      opacity,
    }}
  >
    <svg width={28} height={28} viewBox="0 0 28 28" fill="none">
      <path
        d="M14 3 C9 3, 5 7, 5 12 L5 18 L3 20 L25 20 L23 18 L23 12 C23 7, 19 3, 14 3Z"
        fill={withOpacity('#FBBF24', 0.3)}
        stroke="#FBBF24"
        strokeWidth={1.5}
      />
      <circle cx={14} cy={24} r={3} fill="#FBBF24" />
    </svg>
  </div>
);

// ── Main component ───────────────────────────────────────────

export const ToolCopilotStudio: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const loopFrame = frame % TOTAL_FRAMES;

  // ── Phase detection ─────────────────────────────────────
  const phase = Math.floor(loopFrame / 30);
  const phaseProgress = (loopFrame % 30) / 30;

  // ── Knowledge doc positions (left arc: 150, 180, 210 degrees) ──
  const docAngles = [150, 180, 210];
  const docColors = ['#4285F4', '#34A853', '#EA4335'];

  // ── Connector positions (right arc: 330, 0, 30 degrees) ──
  const connAngles = [330, 0, 30];
  const connColors = ['#00A1E4', '#374151', '#F59E0B'];

  // ── Output positions (top arc: 60, 120 degrees) ──
  const outputAngles = [60, 120];

  // ── Phase 0 (0-30): Knowledge doc absorption ───────────
  const absorbingDocIndex = 1; // middle doc
  const absorbPos = polarToCartesian(docAngles[absorbingDocIndex], RING_RADIUS);
  let absorbDocX = absorbPos.x;
  let absorbDocY = absorbPos.y;
  let absorbDocScale = 1;
  let absorbDocOpacity = 1;
  let logoGlow = 0;

  if (phase === 0) {
    absorbDocX = interpolate(phaseProgress, [0, 0.8], [absorbPos.x, CENTER_X], {
      extrapolateRight: 'clamp',
    });
    absorbDocY = interpolate(phaseProgress, [0, 0.8], [absorbPos.y, CENTER_Y], {
      extrapolateRight: 'clamp',
    });
    absorbDocScale = interpolate(phaseProgress, [0, 0.8, 1], [1, 0.2, 0], {
      extrapolateRight: 'clamp',
    });
    absorbDocOpacity = interpolate(phaseProgress, [0, 0.7, 0.9], [1, 0.8, 0], {
      extrapolateRight: 'clamp',
    });
    logoGlow = interpolate(phaseProgress, [0.6, 0.8, 1], [0, 0.5, 0], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    });
  }

  // ── Phase 1 (30-60): Connector cable extends ───────────
  const activeConnectorIndex = 0;
  const connPos = polarToCartesian(
    connAngles[activeConnectorIndex],
    RING_RADIUS,
  );
  const cableProgress =
    phase === 1
      ? interpolate(phaseProgress, [0, 0.6], [0, 1], {
          extrapolateRight: 'clamp',
        })
      : 0;
  const sparkVisible =
    phase === 1 && phaseProgress > 0.55 && phaseProgress < 0.75;

  // ── Phase 2 (60-90): Ripple wave ───────────────────────
  const rippleRadius =
    phase === 2
      ? interpolate(phaseProgress, [0, 0.7], [0, RING_RADIUS], {
          extrapolateRight: 'clamp',
        })
      : 0;
  const rippleOpacity =
    phase === 2
      ? interpolate(phaseProgress, [0, 0.3, 0.7], [0.6, 0.4, 0], {
          extrapolateRight: 'clamp',
        })
      : 0;

  // ── Helix animation in phase 2 ─────────────────────────
  const helixProgress =
    phase === 2
      ? interpolate(phaseProgress, [0.2, 1], [0, 1], {
          extrapolateLeft: 'clamp',
          extrapolateRight: 'clamp',
        })
      : 0;

  // ── Phase 3 (90-120): Chat bubble pop-up ───────────────
  const bubbleScale =
    phase === 3
      ? spring({
          frame: loopFrame - 90,
          fps,
          config: { damping: 12, stiffness: 180, mass: 0.8 },
        })
      : 0;
  const bubbleTextProgress =
    phase === 3
      ? interpolate(phaseProgress, [0.3, 0.5, 0.7, 0.9], [0, 1, 1, 0], {
          extrapolateLeft: 'clamp',
          extrapolateRight: 'clamp',
        })
      : 0;
  const bubbleOpacity =
    phase === 3
      ? interpolate(phaseProgress, [0, 0.1, 0.8, 1], [0, 1, 1, 0], {
          extrapolateRight: 'clamp',
        })
      : 0;

  return (
    <AbsoluteFill style={{ backgroundColor: 'transparent' }}>
      {/* Knowledge docs (left arc) */}
      {docAngles.map((angle, i) => {
        const pos = polarToCartesian(angle, RING_RADIUS);
        const isAbsorbing = phase === 0 && i === absorbingDocIndex;

        return (
          <DocIcon
            key={`doc-${i}`}
            x={isAbsorbing ? absorbDocX : pos.x}
            y={isAbsorbing ? absorbDocY : pos.y}
            barColor={docColors[i]}
            opacity={isAbsorbing ? absorbDocOpacity : 1}
            scale={isAbsorbing ? absorbDocScale : 1}
          />
        );
      })}

      {/* Connector icons (right arc) */}
      {connAngles.map((angle, i) => {
        const pos = polarToCartesian(angle, RING_RADIUS);
        return (
          <ConnectorIcon
            key={`conn-${i}`}
            x={pos.x}
            y={pos.y}
            color={connColors[i]}
            opacity={1}
          />
        );
      })}

      {/* Cable line from connector to center (phase 1) */}
      {cableProgress > 0 && (
        <svg
          width={1920}
          height={1080}
          style={{ position: 'absolute', top: 0, left: 0 }}
        >
          <line
            x1={connPos.x}
            y1={connPos.y}
            x2={interpolate(cableProgress, [0, 1], [connPos.x, CENTER_X])}
            y2={interpolate(cableProgress, [0, 1], [connPos.y, CENTER_Y])}
            stroke={withOpacity('#F59E0B', 0.7)}
            strokeWidth={2}
            strokeDasharray="6 4"
          />
        </svg>
      )}

      {/* Spark effect at connection point (phase 1) */}
      {sparkVisible &&
        [0, 1, 2].map((i) => (
          <div
            key={`spark-${i}`}
            style={{
              position: 'absolute',
              left: CENTER_X - 2 + (i - 1) * 6,
              top: CENTER_Y - 2 + Math.sin(i * 2.1) * 4,
              width: 4,
              height: 4,
              backgroundColor: '#FBBF24',
              borderRadius: 2,
              boxShadow: '0 0 6px #FBBF24',
            }}
          />
        ))}

      {/* Ripple wave (phase 2) */}
      {rippleRadius > 0 && (
        <div
          style={{
            position: 'absolute',
            left: CENTER_X - rippleRadius,
            top: CENTER_Y - rippleRadius,
            width: rippleRadius * 2,
            height: rippleRadius * 2,
            borderRadius: '50%',
            border: `2px solid ${withOpacity('#F59E0B', rippleOpacity)}`,
            pointerEvents: 'none',
          }}
        />
      )}

      {/* DNA helix motif (phase 2) */}
      {helixProgress > 0 && (
        <svg
          width={1920}
          height={1080}
          style={{ position: 'absolute', top: 0, left: 0, pointerEvents: 'none' }}
        >
          {Array.from({ length: 24 }, (_, i) => {
            const t = (i / 24) * Math.PI * 2 * helixProgress;
            const helixR = 100;
            const px = CENTER_X + helixR * Math.cos(t + helixProgress * Math.PI * 4);
            const py = CENTER_Y + helixR * Math.sin(t + helixProgress * Math.PI * 4);
            const px2 = CENTER_X + helixR * Math.cos(t + Math.PI + helixProgress * Math.PI * 4);
            const py2 = CENTER_Y + helixR * Math.sin(t + Math.PI + helixProgress * Math.PI * 4);
            const dotOpacity = interpolate(helixProgress, [0, 0.3, 0.8, 1], [0, 0.6, 0.6, 0]);
            return (
              <React.Fragment key={`helix-${i}`}>
                <circle cx={px} cy={py} r={2} fill="#F59E0B" opacity={dotOpacity} />
                <circle cx={px2} cy={py2} r={2} fill="#38BDF8" opacity={dotOpacity} />
              </React.Fragment>
            );
          })}
        </svg>
      )}

      {/* Output icons (top arc) */}
      {outputAngles.map((angle, i) => {
        const pos = polarToCartesian(angle, RING_RADIUS);
        return i === 0 ? (
          <ChatBubbleIcon key="chat" x={pos.x} y={pos.y} opacity={1} />
        ) : (
          <BellIcon key="bell" x={pos.x} y={pos.y} opacity={1} />
        );
      })}

      {/* Center logo with optional glow */}
      <div
        style={{
          position: 'absolute',
          left: CENTER_X - 80,
          top: CENTER_Y - 80,
          width: 160,
          height: 160,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          filter: logoGlow > 0 ? `brightness(${1 + logoGlow})` : undefined,
        }}
      >
        <CopilotStudioLogo size={160} />
      </div>

      {/* Chat bubble pop-up (phase 3) */}
      {bubbleScale > 0 && (
        <div
          style={{
            position: 'absolute',
            left: CENTER_X - 40,
            top: CENTER_Y - 140,
            opacity: bubbleOpacity,
            transform: `scale(${bubbleScale})`,
            transformOrigin: 'center bottom',
          }}
        >
          <div
            style={{
              width: 80,
              height: 48,
              backgroundColor: withOpacity('#60A5FA', 0.2),
              border: `1.5px solid #60A5FA`,
              borderRadius: 12,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <span
              style={{
                fontFamily: FONT_FAMILY.display,
                fontWeight: 700,
                fontSize: 24,
                color: '#60A5FA',
              }}
            >
              {bubbleTextProgress < 0.5 ? '?' : '\u2713'}
            </span>
          </div>
          {/* Bubble tail */}
          <div
            style={{
              width: 0,
              height: 0,
              borderLeft: '8px solid transparent',
              borderRight: '8px solid transparent',
              borderTop: `8px solid ${withOpacity('#60A5FA', 0.2)}`,
              margin: '0 auto',
            }}
          />
        </div>
      )}

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
          Copilot Studio
        </span>
        <span
          style={{
            fontFamily: FONT_FAMILY.body,
            fontSize: 16,
            color: COLORS.text.secondary,
          }}
        >
          Custom AI Agents Grounded in Your Domain
        </span>
      </div>
    </AbsoluteFill>
  );
};
