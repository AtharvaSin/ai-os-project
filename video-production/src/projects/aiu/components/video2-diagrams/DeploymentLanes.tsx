/**
 * DeploymentLanes — 8-bit pixel art highway showing 3 AI deployment lanes.
 *
 * Three horizontal road lanes (Personal, Workspace, Hybrid) activate sequentially
 * with pixel vehicles, scrolling dashes, icon badges, sign posts, and exhaust particles.
 * Dark space background with twinkling pixel stars.
 *
 * Video 2 Section 6 (G06). Pillar 1 warm palette. 1920x1080 @ 30fps, ~64s (1920 frames).
 */
import React from 'react';
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { loadFont as loadPressStart, fontFamily as pressStartFamily } from '@remotion/google-fonts/PressStart2P';
import { COLORS, PILLARS } from '../../constants';
import { withOpacity } from '../../utils/colors';
import { FONT_FAMILY } from '../../utils/fonts';

loadPressStart('normal', { weights: ['400'], subsets: ['latin'] });

// ── Tokens & Config ────────────────────────────────────────────
const PX = 6;
const BG = '#0A0C14';
const ROAD = '#1A1408';
const AMBER = PILLARS[1].accent;
const SPRING_CFG = { damping: 160, stiffness: 240, mass: 0.9 } as const;
const VEHICLE_SPRING = { damping: 120, stiffness: 160, mass: 1.2 } as const;

interface LaneConfig {
  label: string; accent: string; vehicle: 'car' | 'bus' | 'convoy';
  icons: { emoji: string; label: string }[]; description: string; start: number;
}

const LANES: LaneConfig[] = [
  { label: 'PERSONAL', accent: '#F59E0B', vehicle: 'car', start: 90,       // 3s — "One is your personal area..."
    icons: [{ emoji: '\u{1F4C5}', label: 'Calendar' }, { emoji: '\u{1F4D3}', label: 'Journal' }, { emoji: '\u2699\uFE0F', label: 'Automate' }],
    description: 'Daily Life & Routines' },
  { label: 'WORKSPACE', accent: '#EF4444', vehicle: 'bus', start: 300,    // 10s — "The second deployment lane is your workspace..."
    icons: [{ emoji: '\u{1F4CA}', label: 'Dashboard' }, { emoji: '\u{1F4AC}', label: 'Comms' }, { emoji: '\u{1F4C4}', label: 'Docs' }],
    description: 'Organization & Productivity' },
  { label: 'HYBRID', accent: '#FB923C', vehicle: 'convoy', start: 810,    // 27s — "So the third type of deployment lane..."
    icons: [{ emoji: '\u{1F517}', label: 'Shared' }, { emoji: '\u{1F4E1}', label: 'Channels' }, { emoji: '\u{1F9E9}', label: 'Co-Build' }],
    description: 'Cross-Team Collaboration' },
];

/** Shorthand for absolutely-positioned pixel rectangles */
const px = (x: number, y: number, w: number, h: number, bg: string, extra?: React.CSSProperties): React.CSSProperties => ({
  position: 'absolute', left: x * PX, top: y * PX, width: w * PX, height: h * PX, backgroundColor: bg, ...extra,
});

// ── Stars ──────────────────────────────────────────────────────
const STARS = Array.from({ length: 50 }, (_, i) => ({
  x: ((i * 173 + 41) % 1880) + 20, y: ((i * 97 + 29) % 140) + 10,
  phase: (i * 31) % 70, size: i % 4 === 0 ? 3 : 2,
}));

const StarField: React.FC<{ frame: number }> = ({ frame }) => (
  <>
    {STARS.map((s, i) => (
      <div key={i} style={{
        position: 'absolute', left: s.x, top: s.y, width: s.size, height: s.size,
        backgroundColor: '#FFF',
        opacity: interpolate((frame + s.phase) % 70, [0, 35, 70], [0.15, 0.7, 0.15]),
      }} />
    ))}
  </>
);

// ── Pixel Vehicles ─────────────────────────────────────────────
const WIN = '#2A4060';
const WHL = '#1A1A1A';

const PixelCar: React.FC<{ accent: string }> = ({ accent }) => (
  <div style={{ position: 'relative', width: 22 * PX, height: 14 * PX }}>
    <div style={px(5, 0, 12, 5, withOpacity(accent, 0.8))} />
    <div style={px(7, 1, 4, 3, WIN)} /><div style={px(12, 1, 4, 3, WIN)} />
    <div style={px(0, 4, 22, 6, accent)} />
    <div style={px(3, 10, 4, 4, WHL, { borderRadius: PX })} />
    <div style={px(15, 10, 4, 4, WHL, { borderRadius: PX })} />
    <div style={px(20, 5, 2, 2, '#FFFDE0')} />
  </div>
);

const PixelBus: React.FC<{ accent: string }> = ({ accent }) => (
  <div style={{ position: 'relative', width: 32 * PX, height: 16 * PX }}>
    <div style={px(0, 0, 32, 12, accent)} />
    {[0, 1, 2, 3, 4].map((i) => <div key={i} style={px(2 + i * 6, 2, 4, 4, WIN)} />)}
    <div style={px(27, 3, 4, 9, withOpacity(accent, 0.6))} />
    {[4, 15, 25].map((x, i) => <div key={i} style={px(x, 12, 5, 4, WHL, { borderRadius: PX })} />)}
  </div>
);

/** Mini car used twice inside the convoy */
const MiniCar: React.FC<{ accent: string; offsetX: number }> = ({ accent, offsetX }) => (
  <div style={{ position: 'absolute', left: offsetX * PX, top: 0, width: 16 * PX, height: 14 * PX }}>
    <div style={px(3, 0, 10, 4, withOpacity(accent, 0.8))} />
    <div style={px(5, 1, 3, 2, WIN)} /><div style={px(9, 1, 3, 2, WIN)} />
    <div style={px(0, 4, 16, 6, accent)} />
    <div style={px(2, 10, 4, 4, WHL, { borderRadius: PX })} />
    <div style={px(10, 10, 4, 4, WHL, { borderRadius: PX })} />
  </div>
);

const PixelConvoy: React.FC<{ accent: string; frame: number }> = ({ accent, frame }) => {
  const beam = interpolate(frame % 30, [0, 15, 30], [0.3, 1, 0.3]);
  return (
    <div style={{ position: 'relative', width: 42 * PX, height: 14 * PX }}>
      <MiniCar accent={accent} offsetX={0} />
      <div style={{ ...px(16, 6, 10, 2, withOpacity(accent, beam)),
        boxShadow: `0 0 ${PX * 4}px ${withOpacity(accent, beam * 0.6)}` }} />
      <MiniCar accent={accent} offsetX={26} />
    </div>
  );
};

// ── Road Dashes ────────────────────────────────────────────────
const RoadDashes: React.FC<{ active: boolean; accent: string; frame: number }> = ({ active, accent, frame }) => {
  const speed = active ? 2 : 0.5;
  const color = active ? withOpacity(accent, 0.6) : withOpacity('#6B6E7B', 0.2);
  const off = (frame * speed) % 60;
  return (
    <div style={{ position: 'absolute', top: 55, left: 0, width: '100%', height: 4, overflow: 'hidden' }}>
      {Array.from({ length: 35 }, (_, i) => (
        <div key={i} style={{ position: 'absolute', left: i * 60 - off, top: 0, width: 30, height: 4, backgroundColor: color }} />
      ))}
    </div>
  );
};

// ── Exhaust Particles ──────────────────────────────────────────
const ExhaustParticles: React.FC<{ accent: string; frame: number; vx: number }> = ({ accent, frame, vx }) => (
  <>
    {Array.from({ length: 7 }, (_, i) => {
      const lf = (frame + i * 7) % 40;
      return (
        <div key={i} style={{
          position: 'absolute', left: vx - lf * 1.8, top: 50 + ((i * 13 + 5) % 20) - 10,
          width: PX, height: PX,
          backgroundColor: withOpacity(accent, interpolate(lf, [0, 12, 40], [0.5, 0.3, 0], { extrapolateRight: 'clamp' })),
        }} />
      );
    })}
  </>
);

// ── Sign Post ──────────────────────────────────────────────────
const SignPost: React.FC<{ label: string; accent: string; p: number }> = ({ label, accent, p }) => (
  <div style={{
    position: 'absolute', left: 60, top: -30, transformOrigin: 'bottom center',
    transform: `scaleY(${p})`, opacity: interpolate(p, [0, 0.3], [0, 1], { extrapolateRight: 'clamp' }),
  }}>
    <div style={{ width: PX * 2, height: 50, backgroundColor: '#6B3A1A', margin: '0 auto' }} />
    <div style={{
      position: 'absolute', top: 0, left: -40, width: 100, padding: '6px 8px',
      backgroundColor: ROAD, border: `2px solid ${accent}`, borderRadius: PX,
      textAlign: 'center', boxShadow: `0 0 ${PX * 3}px ${withOpacity(accent, 0.4)}`,
    }}>
      <span style={{ fontFamily: pressStartFamily, fontSize: 9, color: accent, letterSpacing: 1 }}>{label}</span>
    </div>
  </div>
);

// ── Icon Badge ─────────────────────────────────────────────────
const IconBadge: React.FC<{ emoji: string; label: string; accent: string; p: number }> = ({ emoji, label, accent, p }) => (
  <div style={{
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
    transform: `translateY(${interpolate(p, [0, 1], [20, 0])}px)`,
    opacity: interpolate(p, [0, 0.3], [0, 1], { extrapolateRight: 'clamp' }),
  }}>
    <div style={{
      width: 40, height: 40, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center',
      backgroundColor: withOpacity(accent, 0.15), border: `2px solid ${withOpacity(accent, 0.4)}`, fontSize: 18,
    }}>{emoji}</div>
    <span style={{ fontFamily: pressStartFamily, fontSize: 7, color: withOpacity(accent, 0.8), letterSpacing: 0.5 }}>{label}</span>
  </div>
);

// ── Single Lane ────────────────────────────────────────────────
const LaneRow: React.FC<{ lane: LaneConfig; frame: number; fps: number; roadScale: number }> = ({ lane, frame, fps, roadScale }) => {
  const active = frame >= lane.start;
  const lf = Math.max(0, frame - lane.start);
  const signP = active ? spring({ frame: lf, fps, config: SPRING_CFG }) : 0;
  const driveP = active ? spring({ frame: lf, fps, config: VEHICLE_SPRING }) : 0;
  const vx = interpolate(driveP, [0, 1], [-300, 500]) + (active ? Math.min(lf * 0.3, 200) : 0);
  const glow = active ? interpolate((frame + 10) % 60, [0, 30, 60], [0.15, 0.3, 0.15]) : 0;
  const badges = lane.icons.map((_, i) => {
    const d = lane.start + 15 + i * 12;
    return frame < d ? 0 : spring({ frame: frame - d, fps, config: SPRING_CFG });
  });
  const descO = active ? interpolate(lf, [20, 40], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }) : 0;
  const edgeC = active ? withOpacity(lane.accent, 0.25) : withOpacity('#6B6E7B', 0.08);

  return (
    <div style={{ position: 'relative', height: 180, width: '100%' }}>
      <SignPost label={lane.label} accent={lane.accent} p={signP} />
      {/* Road surface */}
      <div style={{
        position: 'absolute', top: 30, left: 40, right: 40, height: 120,
        backgroundColor: ROAD, borderRadius: PX * 2, transform: `scaleX(${roadScale})`,
        transformOrigin: 'left center', overflow: 'hidden',
        border: active ? `2px solid ${withOpacity(lane.accent, 0.3)}` : `1px solid ${withOpacity('#6B6E7B', 0.15)}`,
        boxShadow: active ? `0 0 ${PX * 5}px ${withOpacity(lane.accent, glow)}, inset 0 0 ${PX * 8}px ${withOpacity(lane.accent, 0.08)}` : 'none',
      }}>
        {active && <div style={{ position: 'absolute', inset: 0, backgroundColor: withOpacity(lane.accent, 0.08) }} />}
        <RoadDashes active={active} accent={lane.accent} frame={frame} />
        <div style={{ position: 'absolute', top: 8, left: 0, right: 0, height: 2, backgroundColor: edgeC }} />
        <div style={{ position: 'absolute', bottom: 8, left: 0, right: 0, height: 2, backgroundColor: edgeC }} />
      </div>
      {/* Vehicle + exhaust */}
      {active && (
        <div style={{ position: 'absolute', top: lane.vehicle === 'bus' ? 58 : 62, left: vx }}>
          {lane.vehicle === 'car' && <PixelCar accent={lane.accent} />}
          {lane.vehicle === 'bus' && <PixelBus accent={lane.accent} />}
          {lane.vehicle === 'convoy' && <PixelConvoy accent={lane.accent} frame={frame} />}
        </div>
      )}
      {active && vx > -100 && <ExhaustParticles accent={lane.accent} frame={frame} vx={vx - 10} />}
      {/* Icon badges */}
      <div style={{ position: 'absolute', right: 80, top: 30, height: 120, display: 'flex', alignItems: 'center', gap: 20 }}>
        {lane.icons.map((ic, i) => <IconBadge key={i} emoji={ic.emoji} label={ic.label} accent={lane.accent} p={badges[i]} />)}
      </div>
      {/* Description */}
      <div style={{ position: 'absolute', left: 200, bottom: -5, fontFamily: FONT_FAMILY.body, fontSize: 14, color: COLORS.text.muted, opacity: descO, letterSpacing: 0.5 }}>
        {lane.description}
      </div>
    </div>
  );
};

// ── Main Composition ───────────────────────────────────────────
export const DeploymentLanes: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const titleP = frame >= 15 ? spring({ frame: frame - 15, fps, config: SPRING_CFG }) : 0;
  const roadP = frame <= 60 ? spring({ frame, fps, config: SPRING_CFG }) : 1;

  return (
    <AbsoluteFill style={{ backgroundColor: BG, overflow: 'hidden', imageRendering: 'pixelated' }}>
      <StarField frame={frame} />
      {/* Title */}
      <div style={{
        position: 'absolute', top: 50, left: 0, right: 0, textAlign: 'center',
        transform: `translateY(${interpolate(titleP, [0, 1], [20, 0])}px)`,
        opacity: interpolate(titleP, [0, 0.3], [0, 1], { extrapolateRight: 'clamp' }),
      }}>
        <span style={{
          fontFamily: pressStartFamily, fontSize: 22, color: AMBER, letterSpacing: 4,
          textShadow: `0 0 20px ${withOpacity(AMBER, 0.4)}`,
        }}>DEPLOYMENT LANES</span>
      </div>
      {/* Lanes */}
      <div style={{
        position: 'absolute', top: 180, left: 0, right: 0, bottom: 80,
        display: 'flex', flexDirection: 'column', justifyContent: 'space-evenly', padding: '0 20px',
      }}>
        {LANES.map((l, i) => <LaneRow key={i} lane={l} frame={frame} fps={fps} roadScale={roadP} />)}
      </div>
      {/* Bottom amber stripe */}
      <div style={{ position: 'absolute', bottom: 40, left: 80, right: 80, height: 3, backgroundColor: withOpacity(AMBER, 0.25), borderRadius: 2 }} />
    </AbsoluteFill>
  );
};
