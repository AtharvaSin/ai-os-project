/**
 * VillageBuilder — 8-bit pixel art village that grows as AI impact areas are revealed.
 *
 * A single continuous story: an empty landscape transforms into a thriving village
 * with 5 buildings, each representing an AI impact area:
 *   1. Artist's Studio (Synthesize)
 *   2. Blacksmith's Forge (Transform)
 *   3. Observatory Tower (Reasoning)
 *   4. Grand Library (Retrieval/Grounding)
 *   5. Clocktower Command Center (Act)
 *
 * Pillar 1 (Warmth) color palette. 8-bit background music.
 * Duration: 131s (3930 frames at 30fps).
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
import { FONT_FAMILY } from '../../utils/fonts';

// ── Pixel scale ──────────────────────────────────────────────

const PX = 5; // 1 game pixel = 5 screen pixels → 384x216 game res

// ── Pillar 1 Warmth palette (8-bit adapted) ──────────────────

const P = {
  sky1: '#FFF8F0',        // top sky — Warm Ivory
  sky2: '#FDF0E4',        // mid sky — Peach Cream
  sky3: '#E8A87C',        // horizon — Soft Coral
  ground1: '#A65D2E',     // dark earth — Burnt Sienna
  ground2: '#C4793A',     // medium earth
  grass: '#8B9A5B',       // muted warm green (not brand green)
  path: '#E8A87C',        // path — Soft Coral
  wall: '#FDF0E4',        // building walls — Peach Cream
  roof: '#DC8D52',        // roofs — Amber Orange
  roofDark: '#A65D2E',    // roof shadow — Burnt Sienna
  door: '#6B4226',        // door wood
  window: '#FFF8F0',      // window glass
  windowFrame: '#A65D2E', // window frame
  accent: '#DC8D52',      // amber accent
  accentGlow: '#F5C882',  // light amber glow
  ink: '#2D1B0E',         // dark brown (8-bit ink)
  white: '#FFF8F0',
  textBg: 'rgba(45, 27, 14, 0.85)',
  textCard: 'rgba(253, 240, 228, 0.95)',
} as const;

// ── Impact area data ─────────────────────────────────────────

interface ImpactArea {
  name: string;
  subtitle: string;
  buildingX: number;  // game pixels from left
  buildingW: number;
  buildingH: number;
  roofH: number;
}

const AREAS: ImpactArea[] = [
  { name: 'Synthesize',  subtitle: 'Create from scratch',        buildingX: 30,  buildingW: 22, buildingH: 18, roofH: 6 },
  { name: 'Transform',   subtitle: 'Reshape & refine',           buildingX: 75,  buildingW: 24, buildingH: 16, roofH: 5 },
  { name: 'Reasoning',   subtitle: 'Think & solve',              buildingX: 125, buildingW: 16, buildingH: 28, roofH: 8 },
  { name: 'Retrieval',   subtitle: 'Find in knowledge',          buildingX: 170, buildingW: 26, buildingH: 20, roofH: 6 },
  { name: 'Act',         subtitle: 'Automate & orchestrate',     buildingX: 230, buildingW: 18, buildingH: 32, roofH: 10 },
];

// ── Timing (frames) — mapped to SRT narration ────────────────

const AREA_FRAMES = [
  { start: 30, label: 'Synthesize' },    // 1s — "First one is synthesize"
  { start: 483, label: 'Transform' },    // 16.1s — "The next category is about transform"
  { start: 981, label: 'Reasoning' },    // 32.7s — "The third impact area is reasoning"
  { start: 1995, label: 'Retrieval' },   // 66.5s — "retrieval or grounding"
  { start: 3105, label: 'Act' },         // 103.5s — "the most cutting edge...act"
];

const TOTAL = 3930; // 131s
const GROUND_Y = 175; // game pixels — ground level

// ── Main Component ───────────────────────────────────────────

export const VillageBuilder: React.FC<{ withMusic?: boolean; musicVolume?: number }> = ({
  withMusic = true,
  musicVolume = 0.15,
}) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  // Active area index
  let activeArea = -1;
  for (let i = AREA_FRAMES.length - 1; i >= 0; i--) {
    if (frame >= AREA_FRAMES[i].start) { activeArea = i; break; }
  }

  // Camera scroll — follow active building
  const targetCameraX = activeArea >= 0
    ? AREAS[activeArea].buildingX * PX - 400
    : 0;
  const cameraX = spring({
    frame: Math.max(0, frame - (AREA_FRAMES[Math.max(0, activeArea)]?.start || 0)),
    fps,
    config: { damping: 200, stiffness: 60, mass: 2 },
  });
  const smoothCameraX = interpolate(cameraX, [0, 1], [activeArea > 0
    ? AREAS[Math.max(0, activeArea - 1)].buildingX * PX - 400
    : 0, targetCameraX]);

  // Fade out
  const fadeOut = interpolate(frame, [TOTAL - 45, TOTAL], [1, 0], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
  });

  // Music volume curve
  const musicVol = React.useCallback(
    (f: number) => interpolate(f, [0, 30, TOTAL - 60, TOTAL], [0, musicVolume, musicVolume, 0], {
      extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
    }),
    [musicVolume],
  );

  return (
    <AbsoluteFill style={{ overflow: 'hidden', opacity: fadeOut }}>
      {/* Sky gradient */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0,
        height: GROUND_Y * PX,
        background: `linear-gradient(180deg, ${P.sky1} 0%, ${P.sky2} 50%, ${P.sky3} 100%)`,
      }} />

      {/* Stars (subtle twinkling) */}
      {Array.from({ length: 20 }).map((_, i) => {
        const sx = (i * 97 + 13) % 384;
        const sy = (i * 43 + 7) % 120;
        const twinkle = interpolate((frame + i * 20) % 60, [0, 30, 60], [0.2, 0.7, 0.2]);
        return (
          <div key={`star-${i}`} style={{
            position: 'absolute',
            left: sx * PX - smoothCameraX * 0.3,
            top: sy * PX,
            width: PX, height: PX,
            backgroundColor: P.accentGlow,
            opacity: twinkle * 0.5,
            borderRadius: PX / 2,
          }} />
        );
      })}

      {/* Ground */}
      <div style={{
        position: 'absolute', top: GROUND_Y * PX, left: 0, right: 0, bottom: 0,
        backgroundColor: P.ground1,
      }}>
        {/* Grass strip */}
        <div style={{
          height: PX * 2,
          backgroundColor: P.grass,
        }} />
        {/* Path */}
        <div style={{
          position: 'absolute', top: PX * 6, left: 0, right: 0,
          height: PX * 3,
          backgroundColor: P.path,
          opacity: 0.6,
        }} />
      </div>

      {/* World container (scrolls with camera) */}
      <div style={{
        position: 'absolute',
        top: 0, left: -smoothCameraX, width: 300 * PX, height: '100%',
      }}>
        {/* Buildings */}
        {AREAS.map((area, i) => {
          const areaFrame = AREA_FRAMES[i];
          const isRevealed = frame >= areaFrame.start;
          const isActive = activeArea === i;
          const isComplete = activeArea > i;

          if (!isRevealed) return null;

          const buildProgress = spring({
            frame: Math.max(0, frame - areaFrame.start),
            fps,
            config: { damping: 140, stiffness: 160, mass: 1 },
          });

          const bx = area.buildingX * PX;
          const bw = area.buildingW * PX;
          const bh = area.buildingH * PX;
          const rh = area.roofH * PX;
          const by = GROUND_Y * PX - bh - rh;

          const buildScale = interpolate(buildProgress, [0, 1], [0, 1]);
          const buildOpacity = interpolate(buildProgress, [0, 0.3], [0, 1], {
            extrapolateRight: 'clamp',
          });

          // Glow for active building
          const glowOpacity = isActive
            ? interpolate(Math.sin(frame / 15), [-1, 1], [0.15, 0.35])
            : 0;

          return (
            <React.Fragment key={i}>
              {/* Building group */}
              <div style={{
                position: 'absolute',
                left: bx,
                top: by,
                width: bw,
                height: bh + rh,
                opacity: buildOpacity * (isComplete ? 0.7 : 1),
                transform: `scaleY(${buildScale})`,
                transformOrigin: 'bottom center',
              }}>
                {/* Roof (triangle via borders) */}
                <div style={{
                  position: 'absolute',
                  top: 0,
                  left: -PX * 2,
                  width: 0,
                  height: 0,
                  borderLeft: `${bw / 2 + PX * 2}px solid transparent`,
                  borderRight: `${bw / 2 + PX * 2}px solid transparent`,
                  borderBottom: `${rh}px solid ${P.roof}`,
                }} />

                {/* Roof shadow line */}
                <div style={{
                  position: 'absolute',
                  top: rh - PX,
                  left: -PX,
                  width: bw + PX * 2,
                  height: PX,
                  backgroundColor: P.roofDark,
                }} />

                {/* Walls */}
                <div style={{
                  position: 'absolute',
                  top: rh,
                  width: bw,
                  height: bh,
                  backgroundColor: P.wall,
                  borderBottom: `${PX}px solid ${P.roofDark}`,
                }}>
                  {/* Door */}
                  <div style={{
                    position: 'absolute',
                    bottom: 0,
                    left: bw / 2 - PX * 2,
                    width: PX * 4,
                    height: PX * 6,
                    backgroundColor: P.door,
                    borderTop: `${PX}px solid ${P.windowFrame}`,
                  }} />

                  {/* Windows */}
                  {[0.2, 0.7].map((xFrac, wi) => (
                    <div key={wi} style={{
                      position: 'absolute',
                      top: PX * 2,
                      left: bw * xFrac - PX * 1.5,
                      width: PX * 3,
                      height: PX * 3,
                      backgroundColor: isActive ? P.accentGlow : P.window,
                      border: `${PX * 0.5}px solid ${P.windowFrame}`,
                    }} />
                  ))}
                </div>

                {/* Active glow */}
                {glowOpacity > 0 && (
                  <div style={{
                    position: 'absolute',
                    top: rh - PX * 2,
                    left: -PX * 4,
                    width: bw + PX * 8,
                    height: bh + PX * 4,
                    borderRadius: PX * 2,
                    boxShadow: `0 0 ${PX * 8}px ${P.accent}`,
                    opacity: glowOpacity,
                  }} />
                )}

                {/* Building-specific feature */}
                <BuildingFeature index={i} frame={frame} areaStart={areaFrame.start} isActive={isActive}
                  bw={bw} bh={bh} rh={rh} fps={fps} />
              </div>

              {/* Impact area label card */}
              {isActive && (
                <ImpactLabel
                  name={area.name}
                  subtitle={area.subtitle}
                  bx={bx}
                  by={by}
                  bw={bw}
                  frame={frame}
                  areaStart={areaFrame.start}
                  fps={fps}
                />
              )}

              {/* Connecting path to next building (amber line on ground) */}
              {isComplete && i < AREAS.length - 1 && (
                <div style={{
                  position: 'absolute',
                  top: GROUND_Y * PX + PX * 7,
                  left: bx + bw,
                  width: (AREAS[i + 1].buildingX - area.buildingX - area.buildingW) * PX,
                  height: PX,
                  backgroundColor: P.accent,
                  opacity: 0.6,
                }} />
              )}
            </React.Fragment>
          );
        })}

        {/* Floating activity items per area */}
        {AREAS.map((area, i) => {
          if (frame < AREA_FRAMES[i].start + 30) return null;
          if (activeArea !== i) return null;
          return (
            <FloatingItems
              key={`float-${i}`}
              areaIndex={i}
              frame={frame}
              areaStart={AREA_FRAMES[i].start}
              bx={area.buildingX * PX}
              fps={fps}
            />
          );
        })}
      </div>

      {/* Title card (top) */}
      <div style={{
        position: 'absolute',
        top: 28,
        left: 0,
        right: 0,
        display: 'flex',
        justifyContent: 'center',
        opacity: interpolate(frame, [0, 20], [0, 1], {
          extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
        }),
      }}>
        <div style={{
          backgroundColor: P.textBg,
          padding: '10px 28px',
          borderRadius: 8,
          borderLeft: `4px solid ${P.accent}`,
        }}>
          <span style={{
            fontFamily: FONT_FAMILY.display,
            fontWeight: 700,
            fontSize: 22,
            color: P.white,
            letterSpacing: -0.3,
          }}>
            5 AI Impact Areas
          </span>
        </div>
      </div>

      {/* Progress dots (bottom) */}
      <div style={{
        position: 'absolute',
        bottom: 30,
        left: 0,
        right: 0,
        display: 'flex',
        justifyContent: 'center',
        gap: 12,
      }}>
        {AREAS.map((a, i) => (
          <div key={i} style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            opacity: frame >= AREA_FRAMES[i].start ? 1 : 0.3,
          }}>
            <div style={{
              width: 10,
              height: 10,
              borderRadius: 5,
              backgroundColor: activeArea >= i ? P.accent : P.path,
              boxShadow: activeArea === i ? `0 0 8px ${P.accent}` : 'none',
            }} />
            <span style={{
              fontFamily: FONT_FAMILY.code,
              fontSize: 11,
              color: activeArea >= i ? P.white : P.sky3,
              fontWeight: activeArea === i ? 700 : 400,
            }}>
              {a.name}
            </span>
          </div>
        ))}
      </div>

      {/* 8-bit music */}
      {withMusic && (
        <Audio
          src={staticFile('music/8bit-roadmap.wav')}
          volume={musicVol}
          loop
        />
      )}
    </AbsoluteFill>
  );
};

// ── BuildingFeature — unique animated element per building ────

const BuildingFeature: React.FC<{
  index: number;
  frame: number;
  areaStart: number;
  isActive: boolean;
  bw: number;
  bh: number;
  rh: number;
  fps: number;
}> = ({ index, frame, areaStart, isActive, bw, bh, rh, fps }) => {
  if (!isActive) return null;
  const f = frame - areaStart;

  switch (index) {
    case 0: // Synthesize — smoke puffs from chimney (creation)
      return (
        <>
          {[0, 20, 40].map((delay, i) => {
            const puffY = interpolate((f + delay) % 60, [0, 60], [0, -PX * 12]);
            const puffOpacity = interpolate((f + delay) % 60, [0, 30, 60], [0.8, 0.5, 0]);
            return (
              <div key={i} style={{
                position: 'absolute',
                top: -PX * 2 + puffY,
                left: bw - PX * 4 + i * PX * 2,
                width: PX * 3,
                height: PX * 3,
                borderRadius: PX * 2,
                backgroundColor: [P.accentGlow, '#FFE4C4', P.sky2][i],
                opacity: puffOpacity,
              }} />
            );
          })}
        </>
      );

    case 1: // Transform — sparks from forge
      return (
        <>
          {[0, 15, 30, 45].map((delay, i) => {
            const sparkPhase = (f + delay) % 40;
            const sparkX = interpolate(sparkPhase, [0, 40], [-PX * 2, PX * 8]);
            const sparkY = interpolate(sparkPhase, [0, 20, 40], [0, -PX * 4, PX * 2]);
            const sparkO = interpolate(sparkPhase, [0, 10, 40], [0, 1, 0]);
            return (
              <div key={i} style={{
                position: 'absolute',
                top: rh + PX * 3 + sparkY,
                left: bw * 0.3 + sparkX,
                width: PX,
                height: PX,
                backgroundColor: P.accentGlow,
                opacity: sparkO,
              }} />
            );
          })}
        </>
      );

    case 2: // Reasoning — spinning gear above dome
      return (
        <div style={{
          position: 'absolute',
          top: -PX * 4,
          left: bw / 2 - PX * 3,
          width: PX * 6,
          height: PX * 6,
          border: `${PX}px solid ${P.accent}`,
          borderRadius: PX * 3,
          transform: `rotate(${f * 3}deg)`,
          opacity: 0.8,
        }}>
          <div style={{
            position: 'absolute',
            top: '50%', left: '50%',
            transform: 'translate(-50%,-50%)',
            width: PX * 2, height: PX * 2,
            backgroundColor: P.accentGlow,
            borderRadius: PX,
          }} />
        </div>
      );

    case 3: // Retrieval — search beam sweeping
      return (
        <div style={{
          position: 'absolute',
          top: rh + PX,
          left: bw / 2 - PX,
          width: PX * 2,
          height: bh - PX * 2,
          background: `linear-gradient(180deg, ${P.accentGlow} 0%, transparent 100%)`,
          opacity: interpolate(Math.sin(f / 10), [-1, 1], [0.2, 0.6]),
          transform: `translateX(${Math.sin(f / 20) * PX * 6}px)`,
        }} />
      );

    case 4: // Act — pulsing connection beams
      return (
        <>
          {[0, 1, 2, 3].map((i) => {
            const beamPhase = (f + i * 15) % 60;
            const beamOpacity = interpolate(beamPhase, [0, 30, 60], [0.2, 0.8, 0.2]);
            return (
              <div key={i} style={{
                position: 'absolute',
                top: rh + bh / 2 - PX,
                left: -PX * (20 + i * 40),
                width: PX * 15,
                height: PX,
                backgroundColor: P.accent,
                opacity: beamOpacity,
              }} />
            );
          })}
        </>
      );

    default:
      return null;
  }
};

// ── FloatingItems — symbolic items that appear around active building ──

const FloatingItems: React.FC<{
  areaIndex: number;
  frame: number;
  areaStart: number;
  bx: number;
  fps: number;
}> = ({ areaIndex, frame, areaStart, bx, fps }) => {
  const f = frame - areaStart;

  // Items per area: symbolic text/icons that float up
  const ITEMS: Record<number, { label: string; delay: number; x: number }[]> = {
    0: [ // Synthesize
      { label: '📄', delay: 40, x: -30 },
      { label: '🖼️', delay: 80, x: 50 },
      { label: '🎬', delay: 120, x: 10 },
    ],
    1: [ // Transform
      { label: '✏️→✨', delay: 40, x: -20 },
      { label: '📝→📄', delay: 90, x: 40 },
    ],
    2: [ // Reasoning
      { label: '🧩', delay: 50, x: -20 },
      { label: '💡', delay: 100, x: 30 },
      { label: '🔗', delay: 150, x: -10 },
    ],
    3: [ // Retrieval
      { label: '📚→🔍', delay: 50, x: -30 },
      { label: '📖→💎', delay: 110, x: 40 },
    ],
    4: [ // Act
      { label: '📧', delay: 40, x: -40 },
      { label: '📊', delay: 80, x: 30 },
      { label: '⚙️', delay: 120, x: -10 },
      { label: '🔄', delay: 160, x: 50 },
    ],
  };

  const items = ITEMS[areaIndex] || [];

  return (
    <>
      {items.map((item, i) => {
        if (f < item.delay) return null;
        const itemF = f - item.delay;
        const floatY = interpolate(itemF % 90, [0, 45, 90], [0, -PX * 8, 0]);
        const itemOpacity = interpolate(itemF, [0, 15], [0, 0.9], {
          extrapolateRight: 'clamp',
        });

        return (
          <div key={i} style={{
            position: 'absolute',
            left: bx + item.x,
            top: (GROUND_Y - 30) * PX + floatY,
            fontSize: 24,
            opacity: itemOpacity,
            filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))',
          }}>
            {item.label}
          </div>
        );
      })}
    </>
  );
};

// ── ImpactLabel — text card near active building ─────────────

const ImpactLabel: React.FC<{
  name: string;
  subtitle: string;
  bx: number;
  by: number;
  bw: number;
  frame: number;
  areaStart: number;
  fps: number;
}> = ({ name, subtitle, bx, by, bw, frame, areaStart, fps }) => {
  const enterProgress = spring({
    frame: Math.max(0, frame - areaStart - 10),
    fps,
    config: { damping: 160, stiffness: 220, mass: 0.9 },
  });
  const cardY = interpolate(enterProgress, [0, 1], [PX * 4, 0]);
  const cardOpacity = interpolate(enterProgress, [0, 0.3], [0, 1], {
    extrapolateRight: 'clamp',
  });

  return (
    <div style={{
      position: 'absolute',
      left: bx + bw / 2,
      top: by - PX * 16,
      transform: `translateX(-50%) translateY(${cardY}px)`,
      opacity: cardOpacity,
      zIndex: 40,
    }}>
      <div style={{
        backgroundColor: P.textCard,
        padding: '12px 24px',
        borderRadius: 10,
        borderLeft: `4px solid ${P.accent}`,
        boxShadow: `0 4px 16px rgba(0,0,0,0.15), 0 0 20px ${P.accent}30`,
        textAlign: 'center' as const,
        whiteSpace: 'nowrap' as const,
      }}>
        <div style={{
          fontFamily: FONT_FAMILY.display,
          fontWeight: 700,
          fontSize: 24,
          color: P.ink,
          letterSpacing: -0.3,
          lineHeight: 1.3,
        }}>
          {name}
        </div>
        <div style={{
          fontFamily: FONT_FAMILY.body,
          fontWeight: 500,
          fontSize: 14,
          color: P.ground1,
          marginTop: 4,
        }}>
          {subtitle}
        </div>
      </div>
    </div>
  );
};
