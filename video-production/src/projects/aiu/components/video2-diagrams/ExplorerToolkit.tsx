/**
 * ExplorerToolkit — Cave-based 8-bit pixel art animation for 5 AI impact areas.
 *
 * The G03 explorer enters a dark cave and discovers 5 magical AI tools.
 * Each tool's power is demonstrated as glowing etchings on the cave wall.
 * Dark theme matching G03 palette. Continuous animations fill each scene.
 *
 * Duration: 131s (3930 frames at 30fps)
 */

import React from 'react';
import {
  AbsoluteFill,
  Audio,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
  Easing,
} from 'remotion';
import {
  loadFont as loadPressStart,
  fontFamily as pressStartFamily,
} from '@remotion/google-fonts/PressStart2P';
import { PILLARS } from '../../constants';
import { withOpacity } from '../../utils/colors';

loadPressStart('normal', { weights: ['400'], subsets: ['latin'] });

// ── Palette (G03 dark theme) ─────────────────────────────────

const P = {
  bg: '#0C0800',
  bgMid: '#120E04',
  caveDark: '#0A0600',
  caveWall: '#1A1408',
  caveWallLight: '#2A2010',
  stone: '#3A2A10',
  stoneLight: '#4A3A18',
  ground: '#2A1A08',
  groundTop: '#3A2A10',
  accent: PILLARS[1].accent,       // #F59E0B
  accentDark: '#A65D2E',
  accentLight: '#FCD34D',
  accentGlow: '#F5C882',
  skin: '#F5C89A',
  jacket: PILLARS[1].accent,
  jacketDark: '#D4790E',
  pants: '#5C3A18',
  boots: '#3A2210',
  hat: '#4A3218',
  hatBand: PILLARS[1].accent,
  textWhite: '#F0F2F5',
  textMuted: '#A0A3B1',
  etchGlow: '#F59E0B',
  etchDim: '#5A4A20',
} as const;

const PX = 5;

// ── Area timing ──────────────────────────────────────────────

const AREAS = [
  { name: 'SYNTHESIZE', tool: 'MAGIC QUILL', start: 30 },
  { name: 'TRANSFORM', tool: 'CRYSTAL', start: 483 },
  { name: 'REASONING', tool: 'CROWN', start: 981 },
  { name: 'RETRIEVAL', tool: 'LANTERN', start: 1995 },
  { name: 'ACT', tool: 'BATON', start: 3105 },
];
const TOTAL = 3930;

// ── Cave geometry ────────────────────────────────────────────

// Stalactites from top
const STALACTITES = [
  { x: 30, w: 8, h: 20 }, { x: 80, w: 6, h: 14 }, { x: 140, w: 10, h: 25 },
  { x: 210, w: 7, h: 16 }, { x: 260, w: 12, h: 30 }, { x: 330, w: 6, h: 12 },
  { x: 50, w: 5, h: 10 }, { x: 170, w: 8, h: 18 }, { x: 300, w: 9, h: 22 },
  { x: 360, w: 7, h: 15 }, { x: 110, w: 11, h: 28 }, { x: 240, w: 6, h: 11 },
];

// Cave wall demo area (where etchings appear)
const CAVE_WALL = { x: 140, y: 30, w: 220, h: 120 }; // game pixels

// Explorer position
const EXPLORER_X = 40; // game pixels from left
const EXPLORER_Y = 162; // game pixels from top (feet on ground)
const GROUND_Y = 175;

// ── Main Component ───────────────────────────────────────────

export const ExplorerToolkit: React.FC<{
  withMusic?: boolean;
  musicVolume?: number;
}> = ({ withMusic = true, musicVolume = 0.15 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  let activeArea = -1;
  for (let i = AREAS.length - 1; i >= 0; i--) {
    if (frame >= AREAS[i].start) { activeArea = i; break; }
  }

  const fadeOut = interpolate(frame, [TOTAL - 45, TOTAL], [1, 0], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
  });

  const musicVol = React.useCallback(
    (f: number) => interpolate(f, [0, 30, TOTAL - 60, TOTAL], [0, musicVolume, musicVolume, 0], {
      extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
    }),
    [musicVolume],
  );

  // Tool glow radius pulses
  const glowPulse = interpolate(Math.sin(frame / 15), [-1, 1], [0.6, 1]);

  return (
    <AbsoluteFill style={{ backgroundColor: P.bg, opacity: fadeOut, overflow: 'hidden' }}>
      {/* Sky gradient (visible through cave opening at top-center) */}
      <div style={{
        position: 'absolute', top: 0, left: '30%', width: '40%', height: CAVE_WALL.y * PX,
        background: `radial-gradient(ellipse at 50% 0%, ${P.bgMid} 0%, ${P.bg} 100%)`,
        opacity: 0.5,
      }} />

      {/* Stars (through cave opening) */}
      {Array.from({ length: 25 }).map((_, i) => {
        const sx = 400 + (i * 47) % 800;
        const sy = (i * 23 + 5) % (CAVE_WALL.y * PX - 10);
        const twinkle = interpolate((frame + i * 17) % 70, [0, 35, 70], [0.15, 0.7, 0.15]);
        return (
          <div key={`s${i}`} style={{
            position: 'absolute', left: sx, top: sy,
            width: PX, height: PX, backgroundColor: P.accentLight,
            opacity: twinkle * 0.6,
          }} />
        );
      })}

      {/* Cave walls — left */}
      <div style={{
        position: 'absolute', top: 0, left: 0,
        width: CAVE_WALL.x * PX - 20,
        height: '100%',
        background: `linear-gradient(90deg, ${P.caveDark} 0%, ${P.caveWall} 70%, transparent 100%)`,
      }} />

      {/* Cave walls — right */}
      <div style={{
        position: 'absolute', top: 0, right: 0,
        width: (384 - CAVE_WALL.x - CAVE_WALL.w) * PX - 20,
        height: '100%',
        background: `linear-gradient(270deg, ${P.caveDark} 0%, ${P.caveWall} 70%, transparent 100%)`,
      }} />

      {/* Stalactites */}
      {STALACTITES.map((st, i) => (
        <div key={`st${i}`} style={{
          position: 'absolute', left: st.x * PX, top: 0,
          width: 0, height: 0,
          borderLeft: `${(st.w / 2) * PX}px solid transparent`,
          borderRight: `${(st.w / 2) * PX}px solid transparent`,
          borderTop: `${st.h * PX}px solid ${i % 2 === 0 ? P.caveWall : P.caveWallLight}`,
        }} />
      ))}

      {/* Ground (rocky cave floor) */}
      <div style={{
        position: 'absolute', left: 0, right: 0, top: GROUND_Y * PX, bottom: 0,
        backgroundColor: P.ground,
      }}>
        <div style={{ height: PX * 2, backgroundColor: P.groundTop }} />
        {/* Scattered rocks */}
        {[80, 220, 500, 780, 1100, 1400].map((rx, i) => (
          <div key={`r${i}`} style={{
            position: 'absolute', left: rx, top: PX * 4 + (i % 3) * PX * 2,
            width: PX * (2 + i % 3), height: PX * (1 + i % 2),
            backgroundColor: P.stone, borderRadius: PX / 2,
          }} />
        ))}
      </div>

      {/* Tool light source — radial glow from explorer */}
      {activeArea >= 0 && (
        <div style={{
          position: 'absolute',
          left: (EXPLORER_X + 10) * PX,
          top: (EXPLORER_Y - 10) * PX,
          width: 600 * glowPulse,
          height: 500 * glowPulse,
          transform: 'translate(-50%, -50%)',
          background: `radial-gradient(ellipse, ${withOpacity(P.accent, 0.08 * glowPulse)} 0%, transparent 70%)`,
          pointerEvents: 'none',
        }} />
      )}

      {/* Dust particles */}
      {Array.from({ length: 12 }).map((_, i) => {
        const dx = 200 + (i * 130) % 1400;
        const dustY = interpolate((frame + i * 50) % 200, [0, 200], [50, GROUND_Y * PX - 20]);
        const dustDrift = Math.sin((frame + i * 30) / 40) * 15;
        return (
          <div key={`d${i}`} style={{
            position: 'absolute', left: dx + dustDrift, top: dustY,
            width: PX, height: PX,
            backgroundColor: P.stoneLight,
            opacity: interpolate(dustY, [50, GROUND_Y * PX - 50], [0.4, 0]),
            borderRadius: PX / 2,
          }} />
        );
      })}

      {/* Cave wall demo area — bordered etch surface */}
      <div style={{
        position: 'absolute',
        left: CAVE_WALL.x * PX,
        top: CAVE_WALL.y * PX,
        width: CAVE_WALL.w * PX,
        height: CAVE_WALL.h * PX,
        backgroundColor: withOpacity(P.caveWall, 0.6),
        border: `${PX}px solid ${activeArea >= 0 ? withOpacity(P.accent, 0.3 * glowPulse) : P.stone}`,
        boxShadow: activeArea >= 0
          ? `inset 0 0 ${40 * glowPulse}px ${withOpacity(P.accent, 0.05)}, 0 0 ${30 * glowPulse}px ${withOpacity(P.accent, 0.1)}`
          : 'none',
        overflow: 'hidden',
      }}>
        {/* Scene-specific cave wall etchings */}
        {activeArea === 0 && <SynthesizeEtch f={frame - AREAS[0].start} fps={fps} />}
        {activeArea === 1 && <TransformEtch f={frame - AREAS[1].start} fps={fps} />}
        {activeArea === 2 && <ReasoningEtch f={frame - AREAS[2].start} fps={fps} />}
        {activeArea === 3 && <RetrievalEtch f={frame - AREAS[3].start} fps={fps} />}
        {activeArea === 4 && <ActEtch f={frame - AREAS[4].start} fps={fps} />}
      </div>

      {/* Explorer character */}
      <ExplorerCharacter activeArea={activeArea} frame={frame} />

      {/* Area title (top center) */}
      <div style={{
        position: 'absolute', top: 12, left: 0, right: 0,
        display: 'flex', justifyContent: 'center',
        opacity: interpolate(frame, [0, 20], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }),
      }}>
        <div style={{
          backgroundColor: withOpacity(P.accent, 0.15),
          border: `2px solid ${P.accent}`,
          padding: '6px 20px',
        }}>
          <span style={{
            fontFamily: pressStartFamily, fontSize: 11, color: P.accent, letterSpacing: 1,
          }}>
            5 AI IMPACT AREAS
          </span>
        </div>
      </div>

      {/* Rotating tool symbol — left of demo rectangle */}
      {activeArea >= 0 && (
        <ToolSymbol
          areaIndex={activeArea}
          frame={frame}
          areaStart={AREAS[activeArea].start}
          fps={fps}
        />
      )}

      {/* Area name label (large) */}
      {activeArea >= 0 && (
        <div style={{
          position: 'absolute',
          bottom: (216 - GROUND_Y) * PX + 40,
          left: CAVE_WALL.x * PX,
          right: (384 - CAVE_WALL.x - CAVE_WALL.w) * PX,
          display: 'flex', justifyContent: 'center',
          opacity: spring({ frame: Math.max(0, frame - AREAS[activeArea].start - 5), fps,
            config: { damping: 160, stiffness: 200, mass: 0.9 } }),
        }}>
          <span style={{
            fontFamily: pressStartFamily, fontSize: 16, color: P.textWhite, letterSpacing: 3,
            textShadow: `0 0 12px ${P.accent}, 0 0 24px ${withOpacity(P.accent, 0.3)}`,
          }}>
            {AREAS[activeArea].name}
          </span>
        </div>
      )}

      {/* Progress dots */}
      <div style={{
        position: 'absolute', bottom: 14, left: 0, right: 0,
        display: 'flex', justifyContent: 'center', gap: 10,
      }}>
        {AREAS.map((a, i) => (
          <div key={i} style={{
            display: 'flex', alignItems: 'center', gap: 5,
            opacity: activeArea >= i ? 0.9 : 0.25,
          }}>
            <div style={{
              width: 6, height: 6,
              backgroundColor: activeArea >= i ? P.accent : P.stone,
              boxShadow: activeArea === i ? `0 0 6px ${P.accent}` : 'none',
            }} />
            <span style={{
              fontFamily: pressStartFamily, fontSize: 6, color: activeArea >= i ? P.accentLight : P.textMuted,
            }}>
              {a.name}
            </span>
          </div>
        ))}
      </div>

      {/* Music */}
      {withMusic && (
        <Audio src={staticFile('music/8bit-roadmap.wav')} volume={musicVol} loop />
      )}
    </AbsoluteFill>
  );
};

// ── Tool Symbol (rotating 3D icon, left of demo panel) ───────

const TOOL_SVGS: Record<number, { paths: string[]; viewBox: string }> = {
  0: { // Quill
    viewBox: '0 0 24 24',
    paths: ['M20.24 12.24a6 6 0 00-8.49-8.49L5 10.5V19h8.5z', 'M16 8L2 22', 'M17.5 15H9'],
  },
  1: { // Crystal (diamond)
    viewBox: '0 0 24 24',
    paths: ['M6 3h12l4 6-10 13L2 9z', 'M2 9h20', 'M12 22L6 9', 'M12 22l6-13'],
  },
  2: { // Crown (reasoning)
    viewBox: '0 0 24 24',
    paths: ['M2 20h20', 'M4 20V10l4 4 4-8 4 8 4-4v10'],
  },
  3: { // Lantern
    viewBox: '0 0 24 24',
    paths: ['M9 18h6', 'M10 22h4', 'M12 2v2', 'M12 6a4 4 0 014 4c0 2-1.5 3-2 4h-4c-.5-1-2-2-2-4a4 4 0 014-4z'],
  },
  4: { // Baton (wand/conductor)
    viewBox: '0 0 24 24',
    paths: ['M15 4V2', 'M15 16v-2', 'M8 9h2', 'M20 9h2', 'M17.8 11.8L19 13', 'M15 9h.01', 'M3 21l9-9'],
  },
};

const ToolSymbol: React.FC<{
  areaIndex: number; frame: number; areaStart: number; fps: number;
}> = ({ areaIndex, frame, areaStart, fps }) => {
  const f = frame - areaStart;
  const enterProg = spring({
    frame: Math.max(0, f),
    fps,
    config: { damping: 140, stiffness: 180, mass: 1 },
  });

  // Y-axis rotation (continuous)
  const rotateY = f * 2.5;

  // Position: left of the demo panel, vertically centered
  const symbolX = (CAVE_WALL.x - 18) * PX;
  const symbolY = (CAVE_WALL.y + CAVE_WALL.h / 2 - 8) * PX;

  const tool = TOOL_SVGS[areaIndex];
  const scale = interpolate(enterProg, [0, 1], [0.3, 1]);
  const opacity = interpolate(enterProg, [0, 0.3], [0, 1], { extrapolateRight: 'clamp' });

  // Glow pulse
  const glow = interpolate(Math.sin(f / 12), [-1, 1], [8, 20]);

  return (
    <div style={{
      position: 'absolute',
      left: symbolX,
      top: symbolY,
      width: 16 * PX,
      height: 16 * PX,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      transform: `scale(${scale}) perspective(200px) rotateY(${rotateY}deg)`,
      opacity,
      filter: `drop-shadow(0 0 ${glow}px ${P.accent})`,
    }}>
      <svg
        width={12 * PX}
        height={12 * PX}
        viewBox={tool.viewBox}
        fill="none"
        stroke={P.accentLight}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {tool.paths.map((d, i) => (
          <path key={i} d={d} />
        ))}
      </svg>
    </div>
  );
};

// ── Explorer Character ───────────────────────────────────────

const ExplorerCharacter: React.FC<{ activeArea: number; frame: number }> = ({ activeArea, frame }) => {
  const x = EXPLORER_X * PX;
  const y = EXPLORER_Y * PX;
  // Idle bobble
  const bob = Math.sin(frame / 20) * 2;
  // Arm raise when new area starts
  const armUp = activeArea >= 0 && (frame - AREAS[activeArea].start) < 40;

  return (
    <div style={{
      position: 'absolute', left: x, top: y + bob,
      width: 14 * PX, height: 22 * PX,
      imageRendering: 'pixelated',
    }}>
      {/* Hat */}
      <div style={{ position: 'absolute', top: 0, left: PX, width: 12 * PX, height: 3 * PX, backgroundColor: P.hat }} />
      <div style={{ position: 'absolute', top: 3 * PX, left: 3 * PX, width: 8 * PX, height: PX, backgroundColor: P.hatBand }} />

      {/* Head */}
      <div style={{ position: 'absolute', top: 4 * PX, left: 3 * PX, width: 8 * PX, height: 6 * PX, backgroundColor: P.skin }} />
      {/* Glasses */}
      <div style={{ position: 'absolute', top: 6 * PX, left: 4 * PX, width: 3 * PX, height: 2 * PX, border: `${PX * 0.5}px solid #1A1A1A` }} />
      <div style={{ position: 'absolute', top: 6 * PX, left: 8 * PX, width: 3 * PX, height: 2 * PX, border: `${PX * 0.5}px solid #1A1A1A` }} />

      {/* Body (jacket) */}
      <div style={{ position: 'absolute', top: 10 * PX, left: 2 * PX, width: 10 * PX, height: 6 * PX, backgroundColor: P.jacket }} />
      <div style={{ position: 'absolute', top: 10 * PX, left: 5 * PX, width: 4 * PX, height: 2 * PX, backgroundColor: '#FEFEFE' }} /> {/* White tee collar */}

      {/* Arm (pointing at cave wall when area active) */}
      <div style={{
        position: 'absolute',
        top: armUp ? 8 * PX : 12 * PX,
        left: 12 * PX,
        width: 6 * PX,
        height: 2 * PX,
        backgroundColor: P.jacket,
        transform: armUp ? 'rotate(-30deg)' : 'rotate(0deg)',
        transformOrigin: 'left center',
      }} />
      {/* Hand */}
      <div style={{
        position: 'absolute',
        top: armUp ? 6 * PX : 12 * PX,
        left: armUp ? 17 * PX : 18 * PX,
        width: 2 * PX, height: 2 * PX,
        backgroundColor: P.skin,
      }} />

      {/* Tool in hand */}
      {activeArea >= 0 && (
        <div style={{
          position: 'absolute',
          top: armUp ? 4 * PX : 10 * PX,
          left: armUp ? 18 * PX : 19 * PX,
          width: 3 * PX, height: 3 * PX,
          backgroundColor: P.accent,
          boxShadow: `0 0 ${8 + Math.sin(frame / 10) * 4}px ${P.accentGlow}`,
          borderRadius: activeArea === 2 ? '50%' : 0, // Crown = round
        }} />
      )}

      {/* Legs */}
      <div style={{ position: 'absolute', top: 16 * PX, left: 3 * PX, width: 3 * PX, height: 4 * PX, backgroundColor: P.pants }} />
      <div style={{ position: 'absolute', top: 16 * PX, left: 8 * PX, width: 3 * PX, height: 4 * PX, backgroundColor: P.pants }} />

      {/* Boots */}
      <div style={{ position: 'absolute', top: 20 * PX, left: 2 * PX, width: 4 * PX, height: 2 * PX, backgroundColor: P.boots }} />
      <div style={{ position: 'absolute', top: 20 * PX, left: 8 * PX, width: 4 * PX, height: 2 * PX, backgroundColor: P.boots }} />
    </div>
  );
};

// ── Shared: Etch Line (glowing text on cave wall) ────────────

const EtchText: React.FC<{
  text: string; x: number; y: number; delay: number;
  f: number; size?: number; bright?: boolean;
}> = ({ text, x, y, delay, f, size = 8, bright = false }) => {
  if (f < delay) return null;
  const o = interpolate(f - delay, [0, 15], [0, 1], { extrapolateRight: 'clamp' });
  return (
    <div style={{
      position: 'absolute', left: x, top: y, opacity: o,
      fontFamily: pressStartFamily, fontSize: size,
      color: bright ? P.accentLight : P.etchGlow,
      textShadow: bright ? `0 0 8px ${P.accent}` : `0 0 4px ${withOpacity(P.accent, 0.4)}`,
      whiteSpace: 'nowrap',
    }}>
      {/* Typewriter: reveal characters progressively */}
      {text.substring(0, Math.floor(interpolate(f - delay, [0, text.length * 2], [0, text.length], {
        extrapolateRight: 'clamp',
      })))}
    </div>
  );
};

// ── Etch Box (glowing card on cave wall) ─────────────────────

const EtchBox: React.FC<{
  x: number; y: number; w: number; h: number;
  delay: number; f: number; glow?: boolean;
}> = ({ x, y, w, h, delay, f, glow = false }) => {
  if (f < delay) return null;
  const o = interpolate(f - delay, [0, 20], [0, 1], { extrapolateRight: 'clamp' });
  return (
    <div style={{
      position: 'absolute', left: x, top: y, width: w, height: h,
      border: `2px solid ${glow ? P.accentLight : P.etchDim}`,
      backgroundColor: withOpacity(P.accent, glow ? 0.08 : 0.03),
      opacity: o,
      boxShadow: glow ? `0 0 10px ${withOpacity(P.accent, 0.2)}` : 'none',
    }} />
  );
};

// ── Scene 1: Synthesize — typewriter creation ────────────────

const SynthesizeEtch: React.FC<{ f: number; fps: number }> = ({ f }) => {
  // Cycle through creation rounds
  const cycleLen = 200; // ~6.7s per cycle
  const cycle = Math.floor(f / cycleLen);
  const cf = f % cycleLen;
  const cw = CAVE_WALL.w * PX;
  const ch = CAVE_WALL.h * PX;

  return (
    <>
      {/* "CREATING..." header */}
      <EtchText text="CREATING..." x={cw / 2 - 50} y={10} delay={10} f={f} size={9} bright />

      {/* Text document being typed */}
      <EtchBox x={20} y={50} w={cw / 3 - 30} h={ch - 90} delay={20} f={cf} glow={cf < 80} />
      <EtchText text="Blog Post" x={30} y={58} delay={25} f={cf} size={7} bright={cf < 80} />
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} style={{
          position: 'absolute', left: 30, top: 80 + i * 14,
          width: interpolate(Math.max(0, cf - 30 - i * 10), [0, 30], [0, cw / 3 - 60], { extrapolateRight: 'clamp' }),
          height: 4,
          backgroundColor: withOpacity(P.etchGlow, cf - 30 - i * 10 > 0 ? 0.4 : 0),
        }} />
      ))}

      {/* Image materializing */}
      <EtchBox x={cw / 3 + 10} y={50} w={cw / 3 - 30} h={ch - 90} delay={70} f={cf} glow={cf > 70 && cf < 140} />
      <EtchText text="Image" x={cw / 3 + 20} y={58} delay={75} f={cf} size={7} bright={cf > 70 && cf < 140} />
      {cf > 80 && (
        <div style={{
          position: 'absolute', left: cw / 3 + 30, top: 85,
          width: cw / 3 - 70, height: ch - 150,
          background: `linear-gradient(135deg, ${withOpacity(P.accent, 0.15)} 0%, ${withOpacity(P.accentDark, 0.1)} 100%)`,
          border: `1px solid ${P.etchDim}`,
          opacity: interpolate(cf - 80, [0, 20], [0, 1], { extrapolateRight: 'clamp' }),
        }} />
      )}

      {/* Video icon */}
      <EtchBox x={2 * cw / 3} y={50} w={cw / 3 - 30} h={ch - 90} delay={120} f={cf} glow={cf > 120} />
      <EtchText text="Video" x={2 * cw / 3 + 10} y={58} delay={125} f={cf} size={7} bright={cf > 120} />
      {cf > 130 && (
        <div style={{
          position: 'absolute',
          left: 2 * cw / 3 + cw / 6 - 25,
          top: ch / 2 - 10,
          width: 0, height: 0,
          borderTop: '20px solid transparent',
          borderBottom: '20px solid transparent',
          borderLeft: `30px solid ${P.accentLight}`,
          opacity: interpolate(cf - 130, [0, 15], [0, 0.7], { extrapolateRight: 'clamp' }),
          filter: `drop-shadow(0 0 6px ${P.accent})`,
        }} />
      )}

      {/* Cycle indicator */}
      <EtchText text={`ROUND ${cycle + 1}`} x={cw - 80} y={ch - 20} delay={0} f={f} size={6} />

      {/* Flow arrow */}
      <div style={{
        position: 'absolute', top: ch / 2, left: 10, width: cw - 20, height: 2,
        background: `linear-gradient(90deg, transparent 0%, ${withOpacity(P.accent, 0.2)} 20%, ${withOpacity(P.accent, 0.2)} 80%, transparent 100%)`,
        opacity: f > 20 ? 0.5 : 0,
      }} />
    </>
  );
};

// ── Scene 2: Transform — conveyor belt ───────────────────────

const TransformEtch: React.FC<{ f: number; fps: number }> = ({ f }) => {
  const cw = CAVE_WALL.w * PX;
  const ch = CAVE_WALL.h * PX;
  const beltY = ch / 2 + 10;

  // Conveyor dots moving right
  const beltOffset = (f * 2) % 20;

  // Items cycle
  const ITEMS = ['ROUGH TEXT', 'RAW DATA', 'DRAFT EMAIL'];
  const RESULTS = ['CLEAN ARTICLE', 'FORMATTED REPORT', 'POLISHED EMAIL'];
  const itemCycle = Math.floor(f / 160) % ITEMS.length;
  const itemPhase = f % 160;

  // Item position (left to right through machine)
  const itemX = interpolate(itemPhase, [0, 60, 80, 140], [20, cw / 2 - 60, cw / 2 + 60, cw - 120], {
    extrapolateRight: 'clamp',
  });
  const inMachine = itemPhase > 55 && itemPhase < 85;

  return (
    <>
      {/* BEFORE / AFTER labels */}
      <EtchText text="INPUT" x={30} y={12} delay={5} f={f} size={8} />
      <EtchText text="OUTPUT" x={cw - 100} y={12} delay={5} f={f} size={8} bright />

      {/* Machine in center */}
      <EtchBox x={cw / 2 - 50} y={30} w={100} h={ch - 60} delay={10} f={f} glow />
      <EtchText text="AI" x={cw / 2 - 12} y={ch / 2 - 20} delay={15} f={f} size={12} bright />

      {/* Spinning gears inside machine */}
      <div style={{
        position: 'absolute', left: cw / 2 - 8, top: 45,
        width: 16, height: 16, border: `2px solid ${P.accent}`,
        borderRadius: 8, transform: `rotate(${f * 4}deg)`,
        opacity: 0.6,
      }} />
      <div style={{
        position: 'absolute', left: cw / 2 + 10, top: ch - 55,
        width: 12, height: 12, border: `2px solid ${P.accentDark}`,
        borderRadius: 6, transform: `rotate(${-f * 5}deg)`,
        opacity: 0.5,
      }} />

      {/* Conveyor belt */}
      <div style={{
        position: 'absolute', left: 10, top: beltY, width: cw - 20, height: 4,
        backgroundColor: P.etchDim,
      }} />
      {Array.from({ length: Math.ceil(cw / 20) }).map((_, i) => (
        <div key={i} style={{
          position: 'absolute', left: 10 + i * 20 + beltOffset, top: beltY + 6,
          width: 4, height: 4, backgroundColor: P.etchGlow, opacity: 0.3,
        }} />
      ))}

      {/* Moving item */}
      <div style={{
        position: 'absolute', left: itemX, top: beltY - 35,
        padding: '6px 10px',
        backgroundColor: withOpacity(P.accent, inMachine ? 0.2 : 0.06),
        border: `2px solid ${inMachine ? P.accentLight : P.etchDim}`,
        boxShadow: inMachine ? `0 0 12px ${P.accent}` : 'none',
      }}>
        <span style={{
          fontFamily: pressStartFamily, fontSize: 6,
          color: itemPhase > 80 ? P.accentLight : P.textMuted,
        }}>
          {itemPhase > 80 ? RESULTS[itemCycle] : ITEMS[itemCycle]}
        </span>
      </div>

      {/* Sparks during transform */}
      {inMachine && [0, 1, 2, 3].map(i => {
        const sparkX = cw / 2 + Math.sin((f + i * 20) / 5) * 30;
        const sparkY = ch / 2 + Math.cos((f + i * 15) / 4) * 20;
        return (
          <div key={i} style={{
            position: 'absolute', left: sparkX, top: sparkY,
            width: 4, height: 4, backgroundColor: P.accentLight,
            opacity: interpolate((f + i * 10) % 15, [0, 7, 15], [0, 1, 0]),
          }} />
        );
      })}

      {/* Arrow */}
      <div style={{
        position: 'absolute', left: cw / 2 - 30, top: beltY + 16,
        width: 60, height: 2, backgroundColor: P.accent, opacity: 0.4,
      }} />
    </>
  );
};

// ── Scene 3: Reasoning — maze solver ─────────────────────────

const ReasoningEtch: React.FC<{ f: number; fps: number }> = ({ f }) => {
  const cw = CAVE_WALL.w * PX;
  const ch = CAVE_WALL.h * PX;

  // Maze grid
  const COLS = 16;
  const ROWS = 8;
  const cellW = (cw - 40) / COLS;
  const cellH = (ch - 80) / ROWS;

  // Solver position — snakes through the grid
  const solverSpeed = 0.06; // cells per frame
  const cycleLen = Math.ceil((COLS * ROWS * 0.5) / solverSpeed);
  const cf = f % (cycleLen + 60); // +60 frames for "solved" hold
  const solverCell = Math.min(Math.floor(cf * solverSpeed), COLS * ROWS / 2);

  // Convert cell index to grid position (snake pattern)
  const solverPath: { col: number; row: number }[] = [];
  for (let i = 0; i <= Math.min(solverCell, COLS * ROWS / 2); i++) {
    const row = Math.floor(i / COLS);
    const col = row % 2 === 0 ? i % COLS : COLS - 1 - (i % COLS);
    solverPath.push({ col, row });
  }

  const solved = cf > cycleLen;
  const solveFlash = solved ? interpolate(cf - cycleLen, [0, 15, 30], [0, 1, 0.6]) : 0;

  return (
    <>
      <EtchText text={solved ? 'SOLVED!' : 'ANALYZING...'} x={cw / 2 - 45} y={8} delay={0} f={f} size={8} bright={solved} />

      {/* Maze grid */}
      {Array.from({ length: ROWS }).map((_, row) =>
        Array.from({ length: COLS }).map((_, col) => {
          // Is this cell on the solver path?
          const onPath = solverPath.some(p => p.col === col && p.row === row);
          // Is this a "wall" cell? (checkerboard pattern with gaps)
          const isWall = (row + col) % 3 === 0 && !onPath;

          return (
            <div key={`${row}-${col}`} style={{
              position: 'absolute',
              left: 20 + col * cellW,
              top: 35 + row * cellH,
              width: cellW - 2,
              height: cellH - 2,
              backgroundColor: isWall
                ? withOpacity(P.stone, 0.5)
                : onPath
                  ? withOpacity(P.accent, solved ? 0.4 : 0.15)
                  : withOpacity(P.caveWall, 0.3),
              border: onPath ? `1px solid ${withOpacity(P.accent, 0.4)}` : 'none',
              boxShadow: onPath && !solved ? `0 0 4px ${withOpacity(P.accent, 0.2)}` : 'none',
            }} />
          );
        })
      )}

      {/* Solver head (current position) */}
      {!solved && solverPath.length > 0 && (() => {
        const head = solverPath[solverPath.length - 1];
        return (
          <div style={{
            position: 'absolute',
            left: 20 + head.col * cellW + cellW / 2 - 5,
            top: 35 + head.row * cellH + cellH / 2 - 5,
            width: 10, height: 10,
            backgroundColor: P.accentLight,
            borderRadius: 5,
            boxShadow: `0 0 8px ${P.accent}, 0 0 16px ${withOpacity(P.accent, 0.4)}`,
          }} />
        );
      })()}

      {/* Lightbulb on solve */}
      {solved && (
        <div style={{
          position: 'absolute', left: cw / 2 - 15, top: ch / 2 - 15,
          fontSize: 28, opacity: solveFlash,
          filter: `drop-shadow(0 0 12px ${P.accentLight})`,
        }}>
          💡
        </div>
      )}

      {/* Label */}
      <EtchText text="COMPLEX -> CLEAR" x={cw / 2 - 65} y={ch - 22} delay={30} f={f} size={7} />
    </>
  );
};

// ── Scene 4: Retrieval — library search ──────────────────────

const RetrievalEtch: React.FC<{ f: number; fps: number }> = ({ f }) => {
  const cw = CAVE_WALL.w * PX;
  const ch = CAVE_WALL.h * PX;

  // Book shelves
  const ROWS = 4;
  const BOOKS_PER_ROW = 12;
  const shelfH = (ch - 80) / ROWS;

  // Search beam sweep
  const beamCol = Math.floor(interpolate(f % 120, [0, 120], [0, BOOKS_PER_ROW], {
    extrapolateRight: 'clamp',
  }));

  // Relevant books (fixed positions)
  const RELEVANT = [
    { row: 0, col: 4 }, { row: 1, col: 9 }, { row: 2, col: 2 }, { row: 3, col: 7 },
  ];

  // Found books accumulate over time
  const foundCount = Math.min(
    RELEVANT.length,
    Math.floor(interpolate(f, [60, 400], [0, RELEVANT.length], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }))
  );

  return (
    <>
      <EtchText text="SEARCHING KNOWLEDGE..." x={20} y={8} delay={5} f={f} size={7} />

      {/* Book shelves */}
      {Array.from({ length: ROWS }).map((_, row) => (
        <React.Fragment key={row}>
          {/* Shelf line */}
          <div style={{
            position: 'absolute', left: 15, top: 35 + (row + 1) * shelfH,
            width: cw * 0.6 - 20, height: 2, backgroundColor: P.stone,
          }} />

          {/* Books */}
          {Array.from({ length: BOOKS_PER_ROW }).map((_, col) => {
            const bookW = ((cw * 0.6 - 40) / BOOKS_PER_ROW) - 2;
            const isRelevant = RELEVANT.some(r => r.row === row && r.col === col);
            const isFound = isRelevant && RELEVANT.findIndex(r => r.row === row && r.col === col) < foundCount;
            const isBeamHit = col === beamCol;

            return (
              <div key={col} style={{
                position: 'absolute',
                left: 20 + col * (bookW + 2),
                top: 35 + row * shelfH + shelfH - 4 - (10 + (col * 3) % 8),
                width: bookW,
                height: 10 + (col * 3) % 8,
                backgroundColor: isFound
                  ? P.accentLight
                  : isBeamHit && isRelevant
                    ? P.accent
                    : withOpacity(P.stone, 0.4 + (col % 3) * 0.1),
                border: isFound ? `1px solid ${P.accent}` : 'none',
                boxShadow: isFound ? `0 0 6px ${P.accent}` : 'none',
                opacity: isFound ? 1 : (isBeamHit ? 0.8 : 0.35),
              }} />
            );
          })}
        </React.Fragment>
      ))}

      {/* Search beam */}
      <div style={{
        position: 'absolute',
        left: 20 + beamCol * ((cw * 0.6 - 40) / BOOKS_PER_ROW + 2),
        top: 30, width: 4, height: ch - 60,
        background: `linear-gradient(180deg, ${P.accentLight} 0%, transparent 100%)`,
        opacity: 0.3, filter: 'blur(2px)',
      }} />

      {/* Results panel (right side) */}
      <div style={{
        position: 'absolute', right: 15, top: 35, width: cw * 0.35, height: ch - 70,
        border: `2px solid ${P.etchDim}`,
        backgroundColor: withOpacity(P.accent, 0.03),
      }}>
        <EtchText text="FINDINGS" x={10} y={8} delay={50} f={f} size={7} bright />

        {RELEVANT.slice(0, foundCount).map((_, i) => (
          <div key={i} style={{
            position: 'absolute', left: 8, top: 30 + i * 28,
            width: cw * 0.35 - 24, height: 22,
            backgroundColor: withOpacity(P.accent, 0.12),
            border: `1px solid ${P.accent}`,
            display: 'flex', alignItems: 'center', padding: '0 6px',
            opacity: interpolate(f - 60 - i * 80, [0, 15], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }),
          }}>
            <span style={{ fontFamily: pressStartFamily, fontSize: 5, color: P.accentLight }}>
              {['API DOCS', 'COMPLIANCE', 'ROADMAP', 'POLICY'][i]}
            </span>
          </div>
        ))}

        {foundCount >= RELEVANT.length && (
          <EtchText text={`${RELEVANT.length} FOUND`} x={10} y={ch - 95} delay={350} f={f} size={6} bright />
        )}
      </div>
    </>
  );
};

// ── Scene 5: Act — automation command center ─────────────────

const ActEtch: React.FC<{ f: number; fps: number }> = ({ f }) => {
  const cw = CAVE_WALL.w * PX;
  const ch = CAVE_WALL.h * PX;

  // Hub at center
  const hubX = cw / 2;
  const hubY = ch / 2;
  const hubPulse = interpolate(Math.sin(f / 10), [-1, 1], [0.5, 1]);
  const allActive = f > 200;

  // 4 lanes radiating from hub to corners
  const LANES = [
    { label: 'EMAIL', endX: cw - 40, endY: 30, delay: 30 },
    { label: 'REPORTS', endX: cw - 40, endY: ch - 40, delay: 70 },
    { label: 'ROUTING', endX: 40, endY: 30, delay: 110 },
    { label: 'SCHEDULE', endX: 40, endY: ch - 40, delay: 150 },
  ];

  return (
    <>
      {/* Grid lines (command center feel) */}
      {Array.from({ length: 6 }).map((_, i) => (
        <React.Fragment key={`grid-${i}`}>
          <div style={{
            position: 'absolute', left: 0, top: (i + 1) * (ch / 7),
            width: cw, height: 1,
            backgroundColor: withOpacity(P.etchDim, 0.15),
          }} />
          <div style={{
            position: 'absolute', left: (i + 1) * (cw / 7), top: 0,
            width: 1, height: ch,
            backgroundColor: withOpacity(P.etchDim, 0.15),
          }} />
        </React.Fragment>
      ))}

      {/* Central hub */}
      <div style={{
        position: 'absolute', left: hubX - 25, top: hubY - 25,
        width: 50, height: 50, backgroundColor: P.accent,
        border: `3px solid ${P.accentDark}`,
        boxShadow: `0 0 ${25 * hubPulse}px ${P.accent}, 0 0 ${50 * hubPulse}px ${withOpacity(P.accent, 0.3)}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 10,
      }}>
        <span style={{ fontFamily: pressStartFamily, fontSize: 7, color: P.textWhite }}>AI</span>
      </div>

      {/* Hub ring */}
      <div style={{
        position: 'absolute', left: hubX - 35, top: hubY - 35,
        width: 70, height: 70,
        border: `2px solid ${withOpacity(P.accent, 0.3 * hubPulse)}`,
        borderRadius: 35,
        zIndex: 5,
      }} />

      {/* Lanes — connection beams + endpoint cards + flowing items */}
      <svg style={{ position: 'absolute', top: 0, left: 0, width: cw, height: ch, pointerEvents: 'none', zIndex: 2 }}>
        {LANES.map((lane, i) => {
          const active = f > lane.delay;
          const beamOpacity = active
            ? interpolate(Math.sin((f - lane.delay) / 8 + i), [-1, 1], [0.2, 0.6])
            : 0.05;

          return (
            <line key={i}
              x1={hubX} y1={hubY}
              x2={lane.endX} y2={lane.endY}
              stroke={P.accent}
              strokeWidth={active ? 2 : 1}
              opacity={beamOpacity}
              strokeDasharray={allActive ? '0' : '6 4'}
            />
          );
        })}
      </svg>

      {/* Endpoint cards */}
      {LANES.map((lane, i) => {
        const active = f > lane.delay;
        if (!active) return null;

        const enterProg = interpolate(f - lane.delay, [0, 20], [0, 1], {
          extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
        });

        // Flowing dot from hub to endpoint
        const dotPhase = (f - lane.delay) % 60;
        const dotT = interpolate(dotPhase, [0, 60], [0, 1]);
        const dotX = interpolate(dotT, [0, 1], [hubX, lane.endX]);
        const dotY = interpolate(dotT, [0, 1], [hubY, lane.endY]);

        return (
          <React.Fragment key={i}>
            {/* Endpoint card */}
            <div style={{
              position: 'absolute',
              left: lane.endX - 50,
              top: lane.endY - 12,
              width: 100, height: 24,
              backgroundColor: withOpacity(P.accent, allActive ? 0.15 : 0.06),
              border: `2px solid ${allActive ? P.accent : P.etchDim}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              opacity: enterProg,
              boxShadow: allActive ? `0 0 8px ${withOpacity(P.accent, 0.3)}` : 'none',
            }}>
              <span style={{
                fontFamily: pressStartFamily, fontSize: 6,
                color: allActive ? P.accentLight : P.textMuted,
              }}>
                {lane.label}
              </span>
            </div>

            {/* Flowing dot */}
            <div style={{
              position: 'absolute', left: dotX - 4, top: dotY - 4,
              width: 8, height: 8,
              backgroundColor: P.accentLight,
              opacity: 0.8,
              boxShadow: `0 0 6px ${P.accent}`,
              zIndex: 8,
            }} />

            {/* Completion check */}
            {allActive && (
              <div style={{
                position: 'absolute',
                left: lane.endX + (lane.endX > cw / 2 ? 55 : -70),
                top: lane.endY - 8,
                fontFamily: pressStartFamily, fontSize: 10, color: P.accentLight,
                opacity: interpolate(f - 200, [0, 20], [0, 1], { extrapolateRight: 'clamp' }),
                textShadow: `0 0 6px ${P.accent}`,
              }}>
                ✓
              </div>
            )}
          </React.Fragment>
        );
      })}

      {/* AUTOMATED label */}
      {allActive && (
        <EtchText text="ALL AUTOMATED" x={hubX - 55} y={ch - 18} delay={200} f={f} size={7} bright />
      )}
    </>
  );
};
