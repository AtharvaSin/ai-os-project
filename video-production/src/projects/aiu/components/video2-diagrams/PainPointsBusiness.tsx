/**
 * PainPointsBusiness — "The Corporate Gauntlet"
 *
 * A dark command-center style 2x2 grid of pixel-art stations, each depicting
 * a business pain point with animated 16-bit characters and supporting visuals.
 * Stations activate sequentially following narration timing.
 *
 * Video 2 Section. Pillar 1 warm palette. 1920x1080 @ 30fps, 40s (1200 frames).
 */
import React, { useMemo } from 'react';
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import {
  loadFont as loadPressStart,
  fontFamily as pressStartFamily,
} from '@remotion/google-fonts/PressStart2P';
import { COLORS, PILLARS } from '../../constants';
import { withOpacity } from '../../utils/colors';
import { FONT_FAMILY } from '../../utils/fonts';

loadPressStart('normal', { weights: ['400'], subsets: ['latin'] });

// ── Tokens & Config ────────────────────────────────────────────
const BG = '#0A0C14';
const AMBER = PILLARS[1].accent;
const PX = 6;
const SPRING_CFG = { damping: 160, stiffness: 240, mass: 0.9 } as const;

/** Station activation frames */
const S1_START = 30;
const S2_START = 330;
const S3_START = 630;
const S4_START = 930;
const ALL_BRIGHT = 1110;
const DISSOLVE_START = 1170;
const TOTAL_FRAMES = 1200;

/** Cell layout: 2x2 grid offsets */
const GRID = {
  gutter: 16,
  headerH: 90,
  cellW: 940,
  cellH: 460,
} as const;

/** Pixel rectangle shorthand (PX=6 variant) */
const px = (
  x: number,
  y: number,
  w: number,
  h: number,
  bg: string,
  extra?: React.CSSProperties,
): React.CSSProperties => ({
  position: 'absolute' as const,
  left: x * PX,
  top: y * PX,
  width: w * PX,
  height: h * PX,
  backgroundColor: bg,
  ...extra,
});

// ── Station opacity logic ──────────────────────────────────────
type StationIndex = 0 | 1 | 2 | 3;
const STATION_STARTS = [S1_START, S2_START, S3_START, S4_START] as const;

function getStationOpacity(
  stationIdx: StationIndex,
  frame: number,
  fps: number,
): number {
  const myStart = STATION_STARTS[stationIdx];

  // Final sequence: all bright
  if (frame >= ALL_BRIGHT) {
    return 1;
  }

  // Not yet activated
  if (frame < myStart) {
    return 0.1;
  }

  // Find the latest activated station
  let latestActive = stationIdx;
  for (let i = 3; i >= 0; i--) {
    if (frame >= STATION_STARTS[i]) {
      latestActive = i as StationIndex;
      break;
    }
  }

  const localFrame = frame - myStart;
  const enterP = spring({ frame: Math.min(localFrame, 15), fps, config: { damping: 80, stiffness: 200, mass: 0.8 } });

  if (latestActive === stationIdx) {
    // Currently the active station
    return interpolate(enterP, [0, 1], [0.1, 1]);
  }

  // A later station is active: dim to 60%
  return interpolate(enterP, [0, 1], [0.1, 0.6]);
}

// ── Scanline Overlay ───────────────────────────────────────────
const ScanlineOverlay: React.FC<{ frame: number }> = ({ frame }) => {
  const yOff = (frame * 0.5) % 4;
  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        backgroundImage: `repeating-linear-gradient(
          0deg,
          transparent,
          transparent 3px,
          ${withOpacity('#FFFFFF', 0.02)} 3px,
          ${withOpacity('#FFFFFF', 0.02)} 4px
        )`,
        backgroundPosition: `0 ${yOff}px`,
        pointerEvents: 'none',
        zIndex: 100,
      }}
    />
  );
};

// ── Header ─────────────────────────────────────────────────────
const Header: React.FC<{ frame: number }> = ({ frame }) => {
  const lineP = interpolate(frame, [0, 20], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const lineW = 300 * lineP;

  return (
    <>
      <div
        style={{
          position: 'absolute',
          top: 36,
          left: 0,
          right: 0,
          textAlign: 'center',
          fontFamily: pressStartFamily,
          fontSize: 24,
          color: AMBER,
          letterSpacing: 4,
          textShadow: `0 0 20px ${withOpacity(AMBER, 0.5)}, 0 0 40px ${withOpacity(AMBER, 0.25)}`,
          zIndex: 10,
        }}
      >
        KEY PAIN POINTS
      </div>
      {/* Amber underline drawing from center */}
      <div
        style={{
          position: 'absolute',
          top: 72,
          left: '50%',
          width: lineW,
          height: 2,
          backgroundColor: AMBER,
          transform: 'translateX(-50%)',
          boxShadow: `0 0 8px ${withOpacity(AMBER, 0.4)}`,
          zIndex: 10,
        }}
      />
    </>
  );
};

// ── Cross Dividers ─────────────────────────────────────────────
const CrossDividers: React.FC = () => (
  <>
    {/* Vertical center line */}
    <div
      style={{
        position: 'absolute',
        top: GRID.headerH,
        left: '50%',
        width: 1,
        height: GRID.cellH * 2 + GRID.gutter,
        backgroundColor: withOpacity(AMBER, 0.15),
        zIndex: 5,
      }}
    />
    {/* Horizontal center line */}
    <div
      style={{
        position: 'absolute',
        top: GRID.headerH + GRID.cellH + GRID.gutter / 2,
        left: (1920 - GRID.cellW * 2 - GRID.gutter) / 2,
        width: GRID.cellW * 2 + GRID.gutter,
        height: 1,
        backgroundColor: withOpacity(AMBER, 0.15),
        zIndex: 5,
      }}
    />
  </>
);

// ── Text Card (glass card with accent bar) ─────────────────────
interface TextCardProps {
  title: string;
  subtitle: string;
  accent: string;
  progress: number;
}

const TextCard: React.FC<TextCardProps> = ({ title, subtitle, accent, progress }) => (
  <div
    style={{
      position: 'absolute',
      bottom: 20,
      left: '50%',
      transform: `translateX(-50%) translateY(${interpolate(progress, [0, 1], [20, 0])}px)`,
      opacity: interpolate(progress, [0, 0.3], [0, 1], { extrapolateRight: 'clamp' }),
      width: 380,
      padding: '12px 16px',
      backgroundColor: 'rgba(15,17,23,0.85)',
      backdropFilter: 'blur(12px)',
      border: `1px solid ${COLORS.border}`,
      borderRadius: 8,
      display: 'flex',
      flexDirection: 'column',
      gap: 4,
    }}
  >
    {/* Left accent bar */}
    <div
      style={{
        position: 'absolute',
        left: 0,
        top: 0,
        bottom: 0,
        width: 3,
        backgroundColor: accent,
        borderRadius: '8px 0 0 8px',
      }}
    />
    <div
      style={{
        fontFamily: FONT_FAMILY.display,
        fontSize: 15,
        fontWeight: 700,
        color: COLORS.text.primary,
        letterSpacing: 0.5,
      }}
    >
      {title}
    </div>
    <div
      style={{
        fontFamily: FONT_FAMILY.body,
        fontSize: 11,
        color: COLORS.text.secondary,
      }}
    >
      {subtitle}
    </div>
  </div>
);

// ════════════════════════════════════════════════════════════════
// STATION 1 — COMMUNICATION OVERLOAD
// ════════════════════════════════════════════════════════════════

interface NotifDef {
  spawnFrame: number;
  startX: number;
  startY: number;
  type: 'email' | 'slack' | 'chat' | 'mention';
}

const Station1: React.FC<{ frame: number; fps: number }> = ({ frame, fps }) => {
  const active = frame >= S1_START;
  const lf = Math.max(0, frame - S1_START);

  // Deterministic notification spawns
  const notifications: NotifDef[] = useMemo(() => {
    const notifs: NotifDef[] = [];
    const types: NotifDef['type'][] = ['email', 'slack', 'chat', 'mention'];
    for (let i = 0; i < 20; i++) {
      const angle = ((i * 137 + 41) % 360) * (Math.PI / 180);
      const radius = 280;
      notifs.push({
        spawnFrame: S1_START + i * 10,
        startX: Math.cos(angle) * radius + 250,
        startY: Math.sin(angle) * radius + 180,
        type: types[i % 4],
      });
    }
    return notifs;
  }, []);

  // Text card spring
  const cardP = frame >= S1_START + 30
    ? spring({ frame: frame - S1_START - 30, fps, config: SPRING_CFG })
    : 0;

  // Unread counter
  const unreadBase = 847;
  const unreadCount = active ? unreadBase + Math.floor(lf / 4) : unreadBase;

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden' }}>
      {/* Desk worker character */}
      <div style={{ position: 'absolute', left: 100, top: 60, width: 24 * PX, height: 40 * PX }}>
        {/* Desk */}
        <div style={px(0, 32, 24, 2, '#374151')} />
        {/* Monitor body */}
        <div style={px(2, 22, 12, 10, '#242530')} />
        {/* Monitor screen glow */}
        <div style={px(3, 23, 10, 8, '#4A90D9', { boxShadow: `0 0 12px ${withOpacity('#4A90D9', 0.4)}` })} />
        {/* Monitor stand */}
        <div style={px(6, 31, 4, 1, '#374151')} />
        {/* Character body - suit shoulders */}
        <div style={px(5, 18, 14, 8, '#2D3748')} />
        {/* Tie */}
        <div style={px(11, 18, 2, 6, AMBER)} />
        {/* Head */}
        <div style={px(8, 8, 8, 8, '#DDB68C')} />
        {/* Hair */}
        <div style={px(8, 7, 8, 2, '#2A1A0A')} />
        {/* Stressed eyebrows */}
        <div style={px(9, 10, 2, 1, '#2A1A0A')} />
        <div style={px(13, 10, 2, 1, '#2A1A0A')} />
        {/* Eyes */}
        <div style={px(10, 11, 1, 1, '#1A1A1A')} />
        <div style={px(13, 11, 1, 1, '#1A1A1A')} />
        {/* Sweat drop */}
        {active && lf % 40 < 25 && (
          <div style={px(17, 9, 1, 2, '#60A5FA', { borderRadius: PX })} />
        )}
      </div>

      {/* Notification spawner */}
      {active && notifications.slice(0, 15).map((notif, i) => {
        if (frame < notif.spawnFrame) return null;
        const nf = frame - notif.spawnFrame;
        const progress = interpolate(nf, [0, 60], [0, 1], {
          extrapolateRight: 'clamp',
        });
        // Converge toward character center
        const targetX = 200;
        const targetY = 160;
        const currentX = interpolate(progress, [0, 1], [notif.startX, targetX]);
        const currentY = interpolate(progress, [0, 1], [notif.startY, targetY]);

        return (
          <div key={i} style={{ position: 'absolute', left: currentX, top: currentY }}>
            {notif.type === 'email' && (
              <div style={{ position: 'relative', width: 6 * PX, height: 4 * PX }}>
                <div style={px(0, 0, 6, 4, '#FFFFFF')} />
                <div style={px(0, 0, 3, 2, withOpacity('#E5E7EB', 0.8))} />
                <div style={px(3, 0, 3, 2, withOpacity('#E5E7EB', 0.8))} />
              </div>
            )}
            {notif.type === 'slack' && (
              <span style={{ fontFamily: pressStartFamily, fontSize: 8, color: '#7C3AED' }}>#</span>
            )}
            {notif.type === 'chat' && (
              <span style={{ fontFamily: pressStartFamily, fontSize: 8, color: '#3B82F6' }}>...</span>
            )}
            {notif.type === 'mention' && (
              <span style={{ fontFamily: pressStartFamily, fontSize: 8, color: '#EF4444' }}>@</span>
            )}
          </div>
        );
      })}

      {/* Unread counter — pinned to top-right of Station 1 cell */}
      <div style={{
        position: 'absolute', top: 10, right: 20,
        display: 'flex', alignItems: 'baseline', gap: 6,
        zIndex: 10,
        padding: '4px 8px',
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        borderRadius: 4,
        border: '1px solid rgba(239, 68, 68, 0.25)',
      }}>
        <span style={{ fontFamily: pressStartFamily, fontSize: 9, color: '#EF4444' }}>UNREAD:</span>
        <span style={{ fontFamily: FONT_FAMILY.code, fontSize: 16, color: '#EF4444', fontWeight: 700 }}>
          {unreadCount}
        </span>
      </div>

      {/* Text card */}
      <TextCard
        title={'\u25A0 COMMUNICATION OVERLOAD'}
        subtitle="Emails · Reports · Slack · Teams"
        accent="#EF4444"
        progress={cardP}
      />
    </div>
  );
};

// ════════════════════════════════════════════════════════════════
// STATION 2 — DECISION COMPRESSION
// ════════════════════════════════════════════════════════════════

const ORB_COLORS = ['#3B82F6', '#8B5CF6', '#10B981', '#F59E0B', '#EF4444', '#06B6D4'];

const Station2: React.FC<{ frame: number; fps: number }> = ({ frame, fps }) => {
  const active = frame >= S2_START;
  const lf = Math.max(0, frame - S2_START);

  const cardP = frame >= S2_START + 30
    ? spring({ frame: frame - S2_START - 30, fps, config: SPRING_CFG })
    : 0;

  // Document emergence at activation +90 frames
  const docP = frame >= S2_START + 90
    ? spring({ frame: frame - S2_START - 90, fps, config: SPRING_CFG })
    : 0;

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden' }}>
      {/* Whiteboard (decision tree) */}
      <div style={{ position: 'absolute', left: 40, top: 30, width: 360, height: 200, backgroundColor: '#242530', borderRadius: 4, border: `1px solid ${COLORS.border}` }}>
        {/* Decision tree nodes + branches */}
        {active && (() => {
          const lineP1 = interpolate(lf, [0, 30], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
          const lineP2 = interpolate(lf, [30, 60], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
          const lineP3 = interpolate(lf, [60, 90], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

          return (
            <>
              {/* Root node */}
              <div style={{ position: 'absolute', left: 160, top: 20, width: 40, height: 20, backgroundColor: withOpacity('#8B5CF6', 0.3), border: `1px solid #8B5CF6`, borderRadius: 4, opacity: lineP1 }} />
              {/* Branch lines to 3 children */}
              <div style={{ position: 'absolute', left: 100, top: 40, width: 80 * lineP2, height: 2, backgroundColor: withOpacity('#8B5CF6', 0.5), transformOrigin: 'right center' }} />
              <div style={{ position: 'absolute', left: 180, top: 40, width: 2, height: 40 * lineP2, backgroundColor: withOpacity('#8B5CF6', 0.5) }} />
              <div style={{ position: 'absolute', left: 180, top: 40, width: 80 * lineP2, height: 2, backgroundColor: withOpacity('#8B5CF6', 0.5) }} />
              {/* Child nodes */}
              <div style={{ position: 'absolute', left: 70, top: 55, width: 30, height: 16, backgroundColor: withOpacity('#8B5CF6', 0.2), border: `1px solid ${withOpacity('#8B5CF6', 0.5)}`, borderRadius: 3, opacity: lineP2 }} />
              <div style={{ position: 'absolute', left: 165, top: 80, width: 30, height: 16, backgroundColor: withOpacity('#8B5CF6', 0.2), border: `1px solid ${withOpacity('#8B5CF6', 0.5)}`, borderRadius: 3, opacity: lineP2 }} />
              <div style={{ position: 'absolute', left: 260, top: 55, width: 30, height: 16, backgroundColor: withOpacity('#8B5CF6', 0.2), border: `1px solid ${withOpacity('#8B5CF6', 0.5)}`, borderRadius: 3, opacity: lineP2 }} />
              {/* Sub-branches */}
              <div style={{ position: 'absolute', left: 55, top: 71, width: 30 * lineP3, height: 2, backgroundColor: withOpacity('#8B5CF6', 0.3) }} />
              <div style={{ position: 'absolute', left: 100, top: 71, width: 2, height: 25 * lineP3, backgroundColor: withOpacity('#8B5CF6', 0.3) }} />
              {/* Sub-nodes */}
              <div style={{ position: 'absolute', left: 40, top: 90, width: 24, height: 12, backgroundColor: withOpacity('#8B5CF6', 0.15), border: `1px solid ${withOpacity('#8B5CF6', 0.3)}`, borderRadius: 2, opacity: lineP3 }} />
              <div style={{ position: 'absolute', left: 88, top: 96, width: 24, height: 12, backgroundColor: withOpacity('#8B5CF6', 0.15), border: `1px solid ${withOpacity('#8B5CF6', 0.3)}`, borderRadius: 2, opacity: lineP3 }} />
            </>
          );
        })()}
      </div>

      {/* Female analyst character */}
      <div style={{ position: 'absolute', left: 420, top: 40, width: 24 * PX, height: 40 * PX }}>
        {/* Hair - ponytail bun */}
        <div style={px(8, 0, 8, 2, '#6B4423')} />
        <div style={px(7, 1, 10, 2, '#6B4423')} />
        <div style={px(16, 2, 4, 5, '#6B4423')} /> {/* bun on right */}
        {/* Head */}
        <div style={px(8, 3, 8, 8, '#C4956A')} />
        {/* Glasses */}
        <div style={px(9, 6, 3, 2, '#60A5FA')} />
        <div style={px(13, 6, 3, 2, '#60A5FA')} />
        <div style={px(12, 6, 1, 1, '#60A5FA')} /> {/* bridge */}
        {/* Eyes */}
        <div style={px(10, 7, 1, 1, '#1A1A1A')} />
        <div style={px(14, 7, 1, 1, '#1A1A1A')} />
        {/* Blazer */}
        <div style={px(6, 12, 14, 10, '#4B5563')} />
        {/* Blazer collar */}
        <div style={px(10, 12, 4, 2, '#C4956A')} />
        {/* Skirt */}
        <div style={px(7, 22, 12, 8, '#374151')} />
        {/* Legs */}
        <div style={px(9, 30, 3, 8, '#C4956A')} />
        <div style={px(14, 30, 3, 8, '#C4956A')} />
        {/* Shoes */}
        <div style={px(8, 37, 5, 3, '#1A1A1A')} />
        <div style={px(13, 37, 5, 3, '#1A1A1A')} />
      </div>

      {/* Data orbs floating toward funnel */}
      {active && ORB_COLORS.map((color, i) => {
        const orbSpawn = S2_START + i * 15;
        if (frame < orbSpawn) return null;
        const orbF = frame - orbSpawn;
        const orbP = interpolate(orbF, [0, 80], [0, 1], { extrapolateRight: 'clamp' });

        // Start positions spread around
        const angle = ((i * 60) + 30) * (Math.PI / 180);
        const startX = Math.cos(angle) * 200 + 260;
        const startY = Math.sin(angle) * 120 + 100;
        const funnelX = 240;
        const funnelY = 300;

        const cx = interpolate(orbP, [0, 1], [startX, funnelX]);
        const cy = interpolate(orbP, [0, 1], [startY, funnelY]);
        const scale = interpolate(orbP, [0.7, 1], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: cx,
              top: cy,
              width: 8 * PX,
              height: 8 * PX,
              borderRadius: '50%',
              backgroundColor: withOpacity(color, 0.7),
              boxShadow: `0 0 8px ${withOpacity(color, 0.4)}`,
              transform: `scale(${scale})`,
            }}
          />
        );
      })}

      {/* Pixel funnel */}
      <div style={{ position: 'absolute', left: 220, top: 296 }}>
        <div style={px(0, 0, 16, 2, '#6B6E7B')} />
        <div style={px(2, 2, 12, 2, '#6B6E7B')} />
        <div style={px(4, 4, 8, 2, '#6B6E7B')} />
        <div style={px(6, 6, 4, 4, '#6B6E7B')} />
      </div>

      {/* Golden document emerging from funnel */}
      {docP > 0 && (
        <div style={{
          position: 'absolute',
          left: 228,
          top: interpolate(docP, [0, 1], [340, 350]),
          opacity: docP,
          transform: `scale(${docP})`,
        }}>
          <div style={px(0, 0, 10, 14, '#FFFFFF', { border: `2px solid ${AMBER}`, borderRadius: 2 })} />
          {/* Sparkle pixels */}
          {[0, 1, 2, 3].map((si) => {
            const sparklePhase = ((frame * 4 + si * 7) % 20) / 20;
            const sparkleOpacity = sparklePhase < 0.5 ? sparklePhase * 2 : (1 - sparklePhase) * 2;
            const sPositions = [
              { x: -3, y: -3 }, { x: 12, y: -3 }, { x: -3, y: 16 }, { x: 12, y: 16 },
            ];
            return (
              <div
                key={si}
                style={{
                  position: 'absolute',
                  left: sPositions[si].x * PX,
                  top: sPositions[si].y * PX,
                  width: 2 * PX,
                  height: 2 * PX,
                  backgroundColor: '#FFFFFF',
                  opacity: sparkleOpacity * docP,
                }}
              />
            );
          })}
        </div>
      )}

      {/* Text card */}
      <TextCard
        title={'\u25A0 DECISION COMPRESSION'}
        subtitle="Collect · Analyze · Recommend"
        accent="#8B5CF6"
        progress={cardP}
      />
    </div>
  );
};

// ════════════════════════════════════════════════════════════════
// STATION 3 — KNOWLEDGE ARTIFACTS
// ════════════════════════════════════════════════════════════════

const DOC_LABELS = ['SOP', 'POLICY', 'SPEC', 'DOC'] as const;

const Station3: React.FC<{ frame: number; fps: number }> = ({ frame, fps }) => {
  const active = frame >= S3_START;
  const lf = Math.max(0, frame - S3_START);

  const cardP = frame >= S3_START + 30
    ? spring({ frame: frame - S3_START - 30, fps, config: SPRING_CFG })
    : 0;

  // Filing cabinet drawer
  const drawerP = frame >= S3_START + 60
    ? spring({ frame: frame - S3_START - 60, fps, config: SPRING_CFG })
    : 0;

  // Typing particles
  const typingParticles = useMemo(() => {
    return Array.from({ length: 12 }, (_, i) => ({
      color: ['#F0F2F5', '#A0A3B1', '#F59E0B', '#6B6E7B'][i % 4],
      xOff: ((i * 17 + 3) % 30) - 15,
      speed: 0.5 + (i % 5) * 0.2,
      phase: i * 12,
    }));
  }, []);

  // Version counter cycles
  const versions = ['v1.0', 'v1.1', 'v2.0'];
  const versionIdx = active ? Math.floor(lf / 90) % 3 : 0;

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden' }}>
      {/* Male writer character at desk */}
      <div style={{ position: 'absolute', left: 60, top: 40, width: 24 * PX, height: 40 * PX }}>
        {/* Desk */}
        <div style={px(0, 30, 24, 2, '#374151')} />
        {/* Papers on desk */}
        <div style={px(14, 27, 8, 3, '#E5E7EB')} />
        <div style={px(15, 28, 8, 3, '#F0F2F5')} />
        {/* Head */}
        <div style={px(8, 6, 8, 8, '#E8C4A0')} />
        {/* Hair */}
        <div style={px(8, 5, 8, 2, '#3A2A10')} />
        {/* Eyes */}
        <div style={px(10, 9, 1, 1, '#1A1A1A')} />
        <div style={px(13, 9, 1, 1, '#1A1A1A')} />
        {/* Vest */}
        <div style={px(6, 15, 12, 10, '#92400E')} />
        {/* Shirt underneath */}
        <div style={px(9, 15, 6, 2, '#E5E7EB')} />
        {/* Arms */}
        <div style={px(4, 16, 3, 8, '#E8C4A0')} />
        <div style={px(17, 16, 3, 8, '#E8C4A0')} />
        {/* Pen in hand */}
        <div style={px(18, 18, 1, 6, '#374151')} />
        <div style={px(18, 17, 1, 1, '#F59E0B')} /> {/* pen tip */}
      </div>

      {/* Typing animation: letters flying up */}
      {active && typingParticles.map((p, i) => {
        const cycle = (lf + p.phase) % 50;
        const y = interpolate(cycle, [0, 50], [0, -80]);
        const x = p.xOff + interpolate(cycle, [0, 25, 50], [0, p.xOff * 0.5, p.xOff]);
        const o = interpolate(cycle, [0, 10, 40, 50], [0, 0.8, 0.6, 0], { extrapolateRight: 'clamp' });
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: 160 + x,
              top: 220 + y,
              width: 2 * PX,
              height: 2 * PX,
              backgroundColor: p.color,
              opacity: o,
            }}
          />
        );
      })}

      {/* Document stacks */}
      <div style={{ position: 'absolute', left: 340, top: 60, display: 'flex', gap: 16, alignItems: 'flex-end' }}>
        {DOC_LABELS.map((label, i) => {
          const stackStart = S3_START + 20 + i * 25;
          const stackP = frame >= stackStart
            ? spring({ frame: frame - stackStart, fps, config: SPRING_CFG })
            : 0;
          const stackH = interpolate(stackP, [0, 1], [0, 60 + i * 15]);

          return (
            <div key={label} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
              <div style={{
                width: 50,
                height: stackH,
                backgroundColor: withOpacity(COLORS.status.success, 0.2),
                border: `1px solid ${withOpacity(COLORS.status.success, 0.4)}`,
                borderRadius: 2,
                position: 'relative',
              }}>
                {/* Version counter on first doc */}
                {i === 0 && stackP > 0.5 && (
                  <span style={{
                    position: 'absolute', top: -14, left: 0, right: 0, textAlign: 'center',
                    fontFamily: pressStartFamily, fontSize: 6, color: COLORS.text.muted,
                  }}>
                    {versions[versionIdx]}
                  </span>
                )}
              </div>
              {stackP > 0.3 && (
                <span style={{
                  fontFamily: pressStartFamily, fontSize: 7,
                  color: withOpacity(COLORS.status.success, 0.8),
                  opacity: stackP,
                }}>
                  {label}
                </span>
              )}
            </div>
          );
        })}
      </div>

      {/* Filing cabinet */}
      <div style={{ position: 'absolute', right: 40, top: 40 }}>
        <div style={px(0, 0, 16, 30, '#374151', { borderRadius: 2 })} />
        {/* Drawer lines */}
        <div style={px(1, 9, 14, 1, '#2D2E3A')} />
        <div style={px(1, 19, 14, 1, '#2D2E3A')} />
        {/* Drawer handles */}
        <div style={px(6, 4, 4, 1, '#6B6E7B')} />
        <div style={px(6, 14, 4, 1, '#6B6E7B')} />
        <div style={px(6, 24, 4, 1, '#6B6E7B')} />
        {/* Top drawer slides open */}
        <div style={{
          ...px(0, 0, 16, 9, '#4B5563', { borderRadius: 2 }),
          transform: `translateX(${interpolate(drawerP, [0, 1], [0, 24])}px)`,
        }} />
      </div>

      {/* Text card */}
      <TextCard
        title={'\u25A0 KNOWLEDGE ARTIFACTS'}
        subtitle="SOPs · Product Docs · Policies"
        accent="#10B981"
        progress={cardP}
      />
    </div>
  );
};

// ════════════════════════════════════════════════════════════════
// STATION 4 — COORDINATION OVERHEAD
// ════════════════════════════════════════════════════════════════

interface MiniWorkerDef {
  x: number;
  y: number;
  initStatus: string;
  initColor: string;
  lateStatus?: string;
  lateColor?: string;
  lateFrame?: number;
}

const MINI_WORKERS: MiniWorkerDef[] = [
  { x: 240, y: 30, initStatus: 'BLOCKED', initColor: '#EF4444' },
  { x: 560, y: 30, initStatus: 'WAITING', initColor: '#F59E0B' },
  { x: 560, y: 200, initStatus: 'OK', initColor: '#10B981', lateStatus: 'NEEDS INPUT', lateColor: '#F59E0B', lateFrame: 60 },
];

const Station4: React.FC<{ frame: number; fps: number }> = ({ frame, fps }) => {
  const active = frame >= S4_START;
  const lf = Math.max(0, frame - S4_START);

  const cardP = frame >= S4_START + 30
    ? spring({ frame: frame - S4_START - 30, fps, config: SPRING_CFG })
    : 0;

  // Walk cycle frame for coordinator
  const walkFrame = active ? Math.floor(lf / 15) % 2 : 0;

  // Coordinator oscillation
  const coordX = active ? Math.sin(lf * 0.05) * 160 + 400 : 400;

  // Envelope flights
  const envelopes = useMemo(() => {
    return Array.from({ length: 8 }, (_, i) => ({
      spawnFrame: S4_START + i * 45,
      targetWorker: i % 3,
    }));
  }, []);

  // SLA badges
  const slaBadges: Array<{ text: string; color: string; showAt: number; flash: boolean }> = [
    { text: 'DUE TODAY', color: '#F59E0B', showAt: S4_START + 30, flash: false },
    { text: 'OVERDUE', color: '#EF4444', showAt: S4_START + 90, flash: true },
    { text: '2h LEFT', color: '#FB923C', showAt: S4_START + 130, flash: false },
  ];

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden' }}>
      {/* Pixel clock */}
      <div style={{ position: 'absolute', left: 20, top: 20, width: 30 * PX, height: 30 * PX }}>
        {/* Clock border (diamond/square of pixels) */}
        <div style={px(0, 0, 30, 30, 'transparent', {
          border: `${PX}px solid ${withOpacity('#6B6E7B', 0.3)}`,
          borderRadius: PX * 4,
        })} />
        {/* Clock center */}
        <div style={px(14, 14, 2, 2, COLORS.text.secondary)} />
        {/* Hour hand — rotates */}
        {active && (() => {
          const handLen = 10 * PX;
          const rotation = (lf * 3) % 360;
          return (
            <div style={{
              position: 'absolute',
              left: 15 * PX,
              top: 15 * PX,
              width: 2,
              height: handLen,
              backgroundColor: COLORS.text.secondary,
              transformOrigin: 'top center',
              transform: `rotate(${rotation}deg)`,
            }} />
          );
        })()}
      </div>

      {/* Mini desk-workers */}
      {MINI_WORKERS.map((worker, wi) => {
        const status = worker.lateFrame && active && lf >= worker.lateFrame
          ? worker.lateStatus!
          : worker.initStatus;
        const dotColor = worker.lateFrame && active && lf >= worker.lateFrame
          ? worker.lateColor!
          : worker.initColor;

        return (
          <div key={wi} style={{ position: 'absolute', left: worker.x, top: worker.y }}>
            {/* Tiny pixel figure */}
            <div style={{ position: 'relative', width: 12 * PX, height: 20 * PX }}>
              {/* Head */}
              <div style={px(3, 0, 6, 6, '#DDB68C')} />
              {/* Body */}
              <div style={px(2, 6, 8, 8, '#4B5563')} />
              {/* Legs */}
              <div style={px(3, 14, 3, 6, '#374151')} />
              <div style={px(6, 14, 3, 6, '#374151')} />
            </div>
            {/* Status dot */}
            <div style={{
              position: 'absolute', top: -12,
              left: 6 * PX - 3,
              width: 6, height: 6, borderRadius: '50%',
              backgroundColor: dotColor,
              boxShadow: `0 0 6px ${dotColor}`,
            }} />
            {/* Status label */}
            <span style={{
              position: 'absolute', top: -22, left: -10, whiteSpace: 'nowrap',
              fontFamily: pressStartFamily, fontSize: 6, color: dotColor,
            }}>
              {status}
            </span>
          </div>
        );
      })}

      {/* Coordinator character (running between workers) */}
      {active && (
        <div style={{
          position: 'absolute',
          left: coordX,
          top: 150,
          width: 12 * PX,
          height: 20 * PX,
        }}>
          {/* Head */}
          <div style={px(3, 0, 6, 6, '#DDB68C')} />
          {/* Hair */}
          <div style={px(3, 0, 6, 2, '#6B4423')} />
          {/* Body */}
          <div style={px(2, 6, 8, 8, '#8B5CF6')} />
          {/* Clipboard */}
          <div style={px(10, 7, 4, 5, '#E5E7EB', { borderRadius: 1 })} />
          {/* Legs — walk cycle */}
          {walkFrame === 0 ? (
            <>
              <div style={px(2, 14, 3, 6, '#374151')} />
              <div style={px(7, 14, 3, 6, '#374151')} />
            </>
          ) : (
            <>
              <div style={px(1, 14, 3, 6, '#374151')} />
              <div style={px(8, 14, 3, 6, '#374151')} />
            </>
          )}
        </div>
      )}

      {/* Envelope flights */}
      {active && envelopes.map((env, i) => {
        if (frame < env.spawnFrame || frame > env.spawnFrame + 15) return null;
        const envF = frame - env.spawnFrame;
        const target = MINI_WORKERS[env.targetWorker];
        const envX = interpolate(envF, [0, 15], [coordX + 20, target.x + 20]);
        const envY = interpolate(envF, [0, 15], [160, target.y + 30]);

        return (
          <div key={i} style={{ position: 'absolute', left: envX, top: envY }}>
            <div style={px(0, 0, 4, 3, '#FFFFFF')} />
          </div>
        );
      })}

      {/* SLA badges */}
      <div style={{ position: 'absolute', bottom: 70, left: 20, display: 'flex', gap: 12 }}>
        {slaBadges.map((badge, i) => {
          if (frame < badge.showAt) return null;
          const badgeP = spring({ frame: frame - badge.showAt, fps, config: SPRING_CFG });
          const flashO = badge.flash
            ? interpolate((frame % 30), [0, 15, 30], [0.5, 1, 0.5])
            : 1;

          return (
            <div
              key={i}
              style={{
                padding: '4px 8px',
                backgroundColor: withOpacity(badge.color, 0.15),
                border: `1px solid ${withOpacity(badge.color, 0.5)}`,
                borderRadius: 4,
                fontFamily: pressStartFamily,
                fontSize: 7,
                color: badge.color,
                opacity: badgeP * flashO,
                transform: `scale(${badgeP})`,
                whiteSpace: 'nowrap',
              }}
            >
              {badge.text}
            </div>
          );
        })}
      </div>

      {/* Text card */}
      <TextCard
        title={'\u25A0 COORDINATION OVERHEAD'}
        subtitle="Follow-ups · SLAs · Status Sync"
        accent="#F59E0B"
        progress={cardP}
      />
    </div>
  );
};

// ════════════════════════════════════════════════════════════════
// DISSOLVE OVERLAY (frames 1170–1200)
// ════════════════════════════════════════════════════════════════

const DISSOLVE_BLOCK = 24;
const DISSOLVE_COLS = Math.ceil(1920 / DISSOLVE_BLOCK);
const DISSOLVE_ROWS = Math.ceil(1080 / DISSOLVE_BLOCK);
const DISSOLVE_DURATION = TOTAL_FRAMES - DISSOLVE_START; // 30 frames

/** Pre-computed random dissolve frames for each block (3600 blocks at 24px) */
const DISSOLVE_MAP: number[] = (() => {
  const map: number[] = [];
  const total = DISSOLVE_COLS * DISSOLVE_ROWS;
  for (let i = 0; i < total; i++) {
    // Deterministic "random" using Knuth multiplicative hash
    const hash = ((i * 2654435761) >>> 0) % DISSOLVE_DURATION;
    map.push(DISSOLVE_START + hash);
  }
  return map;
})();

const DissolveOverlay: React.FC<{ frame: number }> = ({ frame }) => {
  if (frame < DISSOLVE_START) return null;

  // Only render blocks that have dissolved by this frame
  const blocks: React.ReactNode[] = [];
  const total = DISSOLVE_COLS * DISSOLVE_ROWS;
  for (let i = 0; i < total; i++) {
    if (frame >= DISSOLVE_MAP[i]) {
      const r = Math.floor(i / DISSOLVE_COLS);
      const c = i % DISSOLVE_COLS;
      blocks.push(
        <div
          key={i}
          style={{
            position: 'absolute',
            left: c * DISSOLVE_BLOCK,
            top: r * DISSOLVE_BLOCK,
            width: DISSOLVE_BLOCK,
            height: DISSOLVE_BLOCK,
            backgroundColor: '#000000',
          }}
        />,
      );
    }
  }

  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 200 }}>
      {blocks}
    </div>
  );
};

// ════════════════════════════════════════════════════════════════
// MAIN COMPOSITION
// ════════════════════════════════════════════════════════════════

export const PainPointsBusiness: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Final sequence pull-back scale
  const finalScale = frame >= ALL_BRIGHT
    ? interpolate(frame, [ALL_BRIGHT, ALL_BRIGHT + 60], [1.0, 0.97], {
        extrapolateLeft: 'clamp',
        extrapolateRight: 'clamp',
      })
    : 1.0;

  // Station opacities
  const s1O = getStationOpacity(0, frame, fps);
  const s2O = getStationOpacity(1, frame, fps);
  const s3O = getStationOpacity(2, frame, fps);
  const s4O = getStationOpacity(3, frame, fps);

  // Ambient accent glow for active stations
  const activeGlow = (stationStart: number, accent: string): React.CSSProperties => {
    if (frame < stationStart) return {};
    const intensity = interpolate(
      (frame + 10) % 60,
      [0, 30, 60],
      [0.03, 0.06, 0.03],
    );
    return {
      boxShadow: `inset 0 0 60px ${withOpacity(accent, intensity)}`,
    };
  };

  // Grid positioning
  const gridLeft = (1920 - GRID.cellW * 2 - GRID.gutter) / 2;
  const gridTop = GRID.headerH;

  const cellStyle = (col: number, row: number, opacity: number, glow: React.CSSProperties): React.CSSProperties => ({
    position: 'absolute' as const,
    left: gridLeft + col * (GRID.cellW + GRID.gutter),
    top: gridTop + row * (GRID.cellH + GRID.gutter),
    width: GRID.cellW,
    height: GRID.cellH,
    opacity,
    transition: 'opacity 0.1s',
    overflow: 'hidden',
    borderRadius: 4,
    ...glow,
  });

  return (
    <AbsoluteFill style={{ backgroundColor: BG, overflow: 'hidden', imageRendering: 'pixelated' }}>
      {/* Master scale wrapper for final pull-back */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          transform: `scale(${finalScale})`,
          transformOrigin: 'center center',
        }}
      >
        {/* Scanline overlay */}
        <ScanlineOverlay frame={frame} />

        {/* Header */}
        <Header frame={frame} />

        {/* Cross dividers */}
        <CrossDividers />

        {/* Station 1 — Communication Overload (Top-Left) */}
        <div style={cellStyle(0, 0, s1O, activeGlow(S1_START, '#EF4444'))}>
          <Station1 frame={frame} fps={fps} />
        </div>

        {/* Station 2 — Decision Compression (Top-Right) */}
        <div style={cellStyle(1, 0, s2O, activeGlow(S2_START, '#8B5CF6'))}>
          <Station2 frame={frame} fps={fps} />
        </div>

        {/* Station 3 — Knowledge Artifacts (Bottom-Left) */}
        <div style={cellStyle(0, 1, s3O, activeGlow(S3_START, '#10B981'))}>
          <Station3 frame={frame} fps={fps} />
        </div>

        {/* Station 4 — Coordination Overhead (Bottom-Right) */}
        <div style={cellStyle(1, 1, s4O, activeGlow(S4_START, '#F59E0B'))}>
          <Station4 frame={frame} fps={fps} />
        </div>
      </div>

      {/* Dissolve overlay at end */}
      <DissolveOverlay frame={frame} />
    </AbsoluteFill>
  );
};
