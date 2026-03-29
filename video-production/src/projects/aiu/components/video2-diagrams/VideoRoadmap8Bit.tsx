/**
 * VideoRoadmap8Bit — Mario-style side-scrolling pixel art roadmap.
 *
 * An 8-bit explorer walks left-to-right along a path, stopping at
 * 4 milestone signposts that reveal the video's structure. Camera
 * pans to follow the character. Signpost boards enter and exit frame.
 *
 * Built for Video 2 Section 1 (G03). Pillar 1 amber accent palette
 * on a dark warm background.
 */

import React from 'react';
import {
  AbsoluteFill,
  Audio,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  staticFile,
  Easing,
} from 'remotion';
import {
  loadFont as loadPressStart,
  fontFamily as pressStartFamily,
} from '@remotion/google-fonts/PressStart2P';
import { PILLARS } from '../../constants';
import { withOpacity } from '../../utils/colors';

// Load the 8-bit font
loadPressStart('normal', { weights: ['400'], subsets: ['latin'] });

// ── Design Tokens ──────────────────────────────────────────────

const PX = 6; // Each game pixel = 6 screen pixels

const PALETTE = {
  bg: '#0C0800',
  bgGradient: '#120E04',
  ground: '#2A1A08',
  groundTop: '#3A2A10',
  grass: '#1A3A08',
  grassLight: '#2A4A12',
  accent: PILLARS[1].accent, // #F59E0B
  accentDark: '#A65D2E',
  accentLight: '#FCD34D',
  skin: '#F5C89A',
  hair: '#2A1800',
  jacket: PILLARS[1].accent,
  jacketDark: '#D4790E',
  pants: '#5C3A18',
  boots: '#3A2210',
  wood: '#6B3A1A',
  woodDark: '#4A2810',
  woodLight: '#8B5A2A',
  boardBg: '#1A1408',
  boardBorder: '#F59E0B',
  textWhite: '#F0F2F5',
  textMuted: '#A0A3B1',
  star: '#F59E0B',
  treeDark: '#0A2A04',
  treeLight: '#1A3A08',
  trunk: '#3A2210',
} as const;

// ── World Constants ────────────────────────────────────────────

const SCREEN_W = 1920;
const SCREEN_H = 1080;
const GAME_H = Math.floor(SCREEN_H / PX); // 180 game pixels tall
const GROUND_Y = 148; // Ground level from top (in game pixels)
const CHAR_Y = GROUND_Y - 18; // Character bottom at ground, 18px tall

// ── Milestone Type ─────────────────────────────────────────────

export interface Milestone {
  title: string;
  subtitle: string;
  /** Optional staggered items that reveal one-by-one below the subtitle */
  items?: string[];
}

// ── Default Milestones ─────────────────────────────────────────

const DEFAULT_MILESTONES: Milestone[] = [
  {
    title: 'General Approach',
    subtitle: 'Applied to 4 personas',
    items: ['Business Professionals', 'Teachers & Students', 'Entrepreneurs', 'Engineers'],
  },
  { title: '5-Layer Tool Map', subtitle: '5 layers from basic to advanced' },
  { title: 'Top 5 AI Skills', subtitle: 'Stay steady and relevant for the AI wave' },
];

const CHAR_START_X = 60;

// ── Timing ─────────────────────────────────────────────────────

const WALK_SPEED = 3.2; // game pixels per frame during walking

interface Phase {
  type: 'walk' | 'stop';
  startFrame: number;
  endFrame: number;
  boardIndex?: number;
  startX: number;
  endX: number;
}

/** Compute signpost positions and world end from milestone count */
function computeWorld(milestoneCount: number) {
  const spacing = 550;
  const positions = Array.from({ length: milestoneCount }, (_, i) => 400 + i * spacing);
  const worldEnd = positions[positions.length - 1] + 500;
  return { positions, worldEnd };
}

function buildTimeline(
  totalFrames: number,
  milestones: Milestone[],
  signpostPositions: number[],
  worldEndX: number,
): Phase[] {
  const phases: Phase[] = [];
  const n = milestones.length;
  const boardHoldFrames = Math.round(totalFrames * 0.6 / n); // 60% of time on boards

  // Distances between stops
  const distances: number[] = [];
  distances.push(signpostPositions[0] - CHAR_START_X);
  for (let i = 1; i < n; i++) {
    distances.push(signpostPositions[i] - signpostPositions[i - 1]);
  }
  distances.push(worldEndX - signpostPositions[n - 1]);

  const walkFrames = distances.map((d) => Math.ceil(d / WALK_SPEED));
  const totalWalkFrames = walkFrames.reduce((a, b) => a + b, 0);
  const totalStopFrames = n * boardHoldFrames;
  const availableWalkFrames = totalFrames - totalStopFrames;

  const scale = availableWalkFrames / totalWalkFrames;
  const scaledWalks = walkFrames.map((f) => Math.max(1, Math.round(f * scale)));

  let cursor = 0;
  let x = CHAR_START_X;

  for (let i = 0; i <= n; i++) {
    const walkEnd = x + distances[i];

    phases.push({
      type: 'walk',
      startFrame: cursor,
      endFrame: cursor + scaledWalks[i],
      startX: x,
      endX: walkEnd,
    });
    cursor += scaledWalks[i];
    x = walkEnd;

    if (i < n) {
      phases.push({
        type: 'stop',
        startFrame: cursor,
        endFrame: cursor + boardHoldFrames,
        boardIndex: i,
        startX: signpostPositions[i],
        endX: signpostPositions[i],
      });
      cursor += boardHoldFrames;
    }
  }

  return phases;
}

// ── Character State ────────────────────────────────────────────

function getCharacterState(
  frame: number,
  phases: Phase[],
): { x: number; isWalking: boolean; walkFrame: number; currentBoard: number; boardProgress: number } {
  let currentBoard = -1;
  let boardProgress = 0;

  for (const phase of phases) {
    if (frame >= phase.startFrame && frame < phase.endFrame) {
      const localFrame = frame - phase.startFrame;
      const duration = phase.endFrame - phase.startFrame;

      if (phase.type === 'walk') {
        const progress = localFrame / duration;
        const easedProgress = Easing.inOut(Easing.quad)(progress);
        const x = phase.startX + (phase.endX - phase.startX) * easedProgress;
        return { x, isWalking: true, walkFrame: frame, currentBoard, boardProgress: 0 };
      } else {
        currentBoard = phase.boardIndex ?? -1;
        boardProgress = Math.min(1, localFrame / 30); // reveal over 30 frames
        return {
          x: phase.startX,
          isWalking: false,
          walkFrame: 0,
          currentBoard,
          boardProgress,
        };
      }
    }
  }

  // Past all phases — at end position
  const lastPhase = phases[phases.length - 1];
  return { x: lastPhase.endX, isWalking: false, walkFrame: 0, currentBoard: 3, boardProgress: 1 };
}

// ── Pixel Block Renderer ───────────────────────────────────────

interface PixelBlock {
  x: number;
  y: number;
  w: number;
  h: number;
  color: string;
}

const Block: React.FC<{ block: PixelBlock }> = ({ block }) => (
  <div
    style={{
      position: 'absolute',
      left: block.x * PX,
      top: block.y * PX,
      width: block.w * PX,
      height: block.h * PX,
      backgroundColor: block.color,
      imageRendering: 'pixelated',
    }}
  />
);

// ── Character Sprite ───────────────────────────────────────────

const CharacterSprite: React.FC<{ isWalking: boolean; walkFrame: number }> = ({
  isWalking,
  walkFrame,
}) => {
  // 5-frame walk cycle (0-4), frame 0 = idle
  const cycleFrame = isWalking ? Math.floor((walkFrame / 4) % 5) : 0;

  // Leg offsets for walk animation
  const legOffsets = [
    { leftX: 0, rightX: 0, leftH: 4, rightH: 4 },   // idle
    { leftX: -1, rightX: 1, leftH: 3, rightH: 5 },   // step right
    { leftX: 0, rightX: 0, leftH: 4, rightH: 4 },    // pass
    { leftX: 1, rightX: -1, leftH: 5, rightH: 3 },   // step left
    { leftX: 0, rightX: 0, leftH: 4, rightH: 4 },    // pass
  ];

  const leg = legOffsets[cycleFrame];
  const armSwing = isWalking ? Math.sin((walkFrame / 4) * Math.PI * 0.8) * 1.5 : 0;

  const parts: PixelBlock[] = [
    // Hat crown
    { x: 3, y: 0, w: 6, h: 2, color: PALETTE.accentDark },
    // Hat brim
    { x: 2, y: 2, w: 8, h: 1, color: PALETTE.accentDark },
    // Hat band
    { x: 3, y: 1, w: 6, h: 1, color: PALETTE.accent },
    // Head
    { x: 3, y: 3, w: 6, h: 4, color: PALETTE.skin },
    // Eyes
    { x: 4, y: 4, w: 1, h: 1, color: '#FFFFFF' },
    { x: 7, y: 4, w: 1, h: 1, color: '#FFFFFF' },
    // Eye pupils
    { x: 5, y: 4, w: 1, h: 1, color: PALETTE.hair },
    { x: 8, y: 4, w: 1, h: 1, color: PALETTE.hair },
    // Mouth
    { x: 5, y: 6, w: 2, h: 1, color: PALETTE.accentDark },
    // Body (jacket)
    { x: 2, y: 7, w: 8, h: 4, color: PALETTE.jacket },
    // Jacket detail (buttons)
    { x: 5, y: 8, w: 2, h: 2, color: PALETTE.jacketDark },
    // Backpack
    { x: 10, y: 7, w: 2, h: 4, color: PALETTE.accentDark },
    { x: 10, y: 8, w: 2, h: 1, color: PALETTE.accent },
    // Belt
    { x: 2, y: 11, w: 8, h: 1, color: PALETTE.pants },
    // Left arm
    {
      x: Math.round(0 + armSwing),
      y: 8,
      w: 2,
      h: 3,
      color: PALETTE.jacket,
    },
    // Right arm
    {
      x: Math.round(10 - armSwing),
      y: 8,
      w: 2,
      h: 3,
      color: PALETTE.jacket,
    },
    // Left leg
    {
      x: 3 + leg.leftX,
      y: 12,
      w: 3,
      h: leg.leftH,
      color: PALETTE.pants,
    },
    // Right leg
    {
      x: 6 + leg.rightX,
      y: 12,
      w: 3,
      h: leg.rightH,
      color: PALETTE.pants,
    },
    // Left boot
    {
      x: 3 + leg.leftX,
      y: 12 + leg.leftH - 2,
      w: 3,
      h: 2,
      color: PALETTE.boots,
    },
    // Right boot
    {
      x: 6 + leg.rightX,
      y: 12 + leg.rightH - 2,
      w: 3,
      h: 2,
      color: PALETTE.boots,
    },
  ];

  return (
    <div style={{ position: 'absolute', width: 12 * PX, height: 18 * PX }}>
      {parts.map((block, i) => (
        <Block key={i} block={block} />
      ))}
    </div>
  );
};

// ── Signpost ───────────────────────────────────────────────────

interface SignpostProps {
  milestone: Milestone;
  index: number;
  revealProgress: number;
  isActive: boolean;
  /** Current frame within the stop phase (for staggered item timing) */
  localFrame: number;
}

const Signpost: React.FC<SignpostProps> = ({ milestone, index, revealProgress, isActive, localFrame }) => {
  const boardOpacity = interpolate(revealProgress, [0, 1], [0.3, 1]);
  const textOpacity = interpolate(revealProgress, [0, 0.5, 1], [0, 0, 1]);

  const hasItems = milestone.items && milestone.items.length > 0;
  const boardW = 72;
  const boardH = hasItems ? 56 : 40; // taller board if it has staggered items
  const postX = Math.floor(boardW / 2);

  return (
    <div style={{ position: 'absolute', width: boardW * PX, height: (boardH + 30) * PX }}>
      {/* Post */}
      <Block block={{ x: postX, y: boardH, w: 3, h: 30, color: PALETTE.wood }} />
      <Block block={{ x: postX - 1, y: boardH, w: 1, h: 30, color: PALETTE.woodDark }} />
      <Block block={{ x: postX + 3, y: boardH, w: 1, h: 30, color: PALETTE.woodLight }} />

      {/* Board background */}
      <div
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          width: boardW * PX,
          height: boardH * PX,
          backgroundColor: PALETTE.boardBg,
          border: `${PX}px solid ${PALETTE.boardBorder}`,
          borderRadius: PX * 2,
          opacity: boardOpacity,
          boxShadow: isActive
            ? `0 0 ${PX * 6}px ${withOpacity(PALETTE.accent, 0.5)}`
            : 'none',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          padding: PX * 3,
          gap: PX * 1.5,
        }}
      >
        {/* Milestone number */}
        <div
          style={{
            fontFamily: pressStartFamily,
            fontSize: PX * 3,
            color: PALETTE.accent,
            opacity: textOpacity,
            letterSpacing: 2,
          }}
        >
          {`PART ${index + 1}`}
        </div>
        {/* Title */}
        <div
          style={{
            fontFamily: pressStartFamily,
            fontSize: PX * 2.8,
            color: PALETTE.textWhite,
            opacity: textOpacity,
            textAlign: 'center',
            lineHeight: 1.5,
          }}
        >
          {milestone.title}
        </div>
        {/* Subtitle */}
        <div
          style={{
            fontFamily: pressStartFamily,
            fontSize: PX * 1.6,
            color: PALETTE.textMuted,
            opacity: textOpacity,
            textAlign: 'center',
            lineHeight: 1.5,
            maxWidth: (boardW - 8) * PX,
          }}
        >
          {milestone.subtitle}
        </div>

        {/* Staggered items (e.g., 4 persona names appearing one by one) */}
        {hasItems && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: PX, marginTop: PX }}>
            {milestone.items!.map((item, i) => {
              // Each item appears 20 frames after the previous
              const itemDelay = 40 + i * 20; // starts after text reveal
              const itemOpacity = interpolate(
                localFrame - itemDelay,
                [0, 12],
                [0, 1],
                { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' },
              );
              const itemSlide = interpolate(
                localFrame - itemDelay,
                [0, 12],
                [10, 0],
                { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' },
              );
              return (
                <div
                  key={i}
                  style={{
                    fontFamily: pressStartFamily,
                    fontSize: PX * 1.4,
                    color: PALETTE.accent,
                    opacity: itemOpacity,
                    transform: `translateX(${itemSlide}px)`,
                    textAlign: 'center',
                    lineHeight: 1.4,
                    display: 'flex',
                    alignItems: 'center',
                    gap: PX,
                    justifyContent: 'center',
                  }}
                >
                  <span style={{ color: PALETTE.accentLight, fontSize: PX * 1.2 }}>{'>'}</span>
                  {item}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Arrow pointer */}
      <Block block={{ x: postX + 4, y: boardH + 4, w: 4, h: 1, color: PALETTE.accent }} />
      <Block block={{ x: postX + 6, y: boardH + 3, w: 1, h: 1, color: PALETTE.accent }} />
      <Block block={{ x: postX + 6, y: boardH + 5, w: 1, h: 1, color: PALETTE.accent }} />
    </div>
  );
};

// ── Pixel Tree ─────────────────────────────────────────────────

const PixelTree: React.FC<{ x: number; y: number; size?: number }> = ({
  x,
  y,
  size = 1,
}) => {
  const s = size;
  const parts: PixelBlock[] = [
    // Trunk
    { x: x + 2 * s, y: y + 6 * s, w: 2 * s, h: 4 * s, color: PALETTE.trunk },
    // Canopy layers
    { x: x + 0, y: y + 3 * s, w: 6 * s, h: 3 * s, color: PALETTE.treeDark },
    { x: x + 1 * s, y: y + 1 * s, w: 4 * s, h: 3 * s, color: PALETTE.treeLight },
    { x: x + 2 * s, y: y + 0, w: 2 * s, h: 2 * s, color: PALETTE.treeDark },
  ];
  return (
    <>
      {parts.map((b, i) => (
        <Block key={i} block={b} />
      ))}
    </>
  );
};

// ── Stars ──────────────────────────────────────────────────────

const STAR_POSITIONS = Array.from({ length: 40 }, (_, i) => ({
  x: ((i * 137 + 53) % 2700) + 50,
  y: ((i * 89 + 17) % 100) + 5,
  twinkleOffset: i * 23,
  size: i % 3 === 0 ? 2 : 1,
}));

const Stars: React.FC<{ frame: number }> = ({ frame }) => (
  <>
    {STAR_POSITIONS.map((star, i) => {
      const twinkle = interpolate(
        (frame + star.twinkleOffset) % 60,
        [0, 30, 60],
        [0.2, 0.8, 0.2],
      );
      return (
        <div
          key={i}
          style={{
            position: 'absolute',
            left: star.x * PX,
            top: star.y * PX,
            width: star.size * PX,
            height: star.size * PX,
            backgroundColor: PALETTE.star,
            opacity: twinkle,
            borderRadius: star.size > 1 ? 0 : PX / 2,
          }}
        />
      );
    })}
  </>
);

// ── Ground ─────────────────────────────────────────────────────

const Ground: React.FC<{ worldWidth: number }> = ({ worldWidth }) => {
  const groundBlocks: PixelBlock[] = [];
  const worldW = Math.ceil(worldWidth / 8) + 10;

  for (let i = 0; i < worldW; i++) {
    const x = i * 8;
    // Grass top layer
    groundBlocks.push({ x, y: GROUND_Y, w: 8, h: 2, color: PALETTE.grassLight });
    // Grass variation
    if (i % 3 === 0) {
      groundBlocks.push({ x: x + 2, y: GROUND_Y - 1, w: 1, h: 1, color: PALETTE.grass });
    }
    if (i % 5 === 2) {
      groundBlocks.push({ x: x + 5, y: GROUND_Y - 1, w: 1, h: 1, color: PALETTE.grassLight });
    }
    // Dirt
    groundBlocks.push({ x, y: GROUND_Y + 2, w: 8, h: 6, color: PALETTE.groundTop });
    groundBlocks.push({ x, y: GROUND_Y + 8, w: 8, h: 24, color: PALETTE.ground });
  }

  // Path (lighter strip on ground)
  for (let i = 0; i < worldW; i++) {
    const x = i * 8;
    groundBlocks.push({ x, y: GROUND_Y + 2, w: 8, h: 1, color: PALETTE.groundTop });
  }

  return (
    <>
      {groundBlocks.map((b, i) => (
        <Block key={i} block={b} />
      ))}
    </>
  );
};

// ── Background Trees ───────────────────────────────────────────

const TREE_POSITIONS = [
  { x: 80, size: 1.5 },
  { x: 250, size: 1 },
  { x: 420, size: 2 },
  { x: 650, size: 1 },
  { x: 780, size: 1.5 },
  { x: 950, size: 1 },
  { x: 1150, size: 2 },
  { x: 1350, size: 1 },
  { x: 1500, size: 1.5 },
  { x: 1700, size: 1 },
  { x: 1850, size: 2 },
  { x: 2050, size: 1 },
  { x: 2200, size: 1.5 },
  { x: 2400, size: 1 },
  { x: 2550, size: 2 },
];

const BackgroundTrees: React.FC = () => (
  <>
    {TREE_POSITIONS.map((tree, i) => (
      <PixelTree
        key={i}
        x={tree.x}
        y={GROUND_Y - Math.round(10 * tree.size)}
        size={tree.size}
      />
    ))}
  </>
);

// ── Props ──────────────────────────────────────────────────────

export interface VideoRoadmap8BitProps {
  /** Whether to include background music */
  withMusic?: boolean;
  /** Music volume (0-1) */
  musicVolume?: number;
  /** Custom milestones (defaults to 3-board V2 roadmap) */
  milestones?: Milestone[];
}

// ── Main Composition ───────────────────────────────────────────

export const VideoRoadmap8Bit: React.FC<VideoRoadmap8BitProps> = ({
  withMusic = true,
  musicVolume = 0.6,
  milestones = DEFAULT_MILESTONES,
}) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  // Compute world layout from milestone count
  const { positions: signpostPositions, worldEnd: worldEndX } = React.useMemo(
    () => computeWorld(milestones.length),
    [milestones.length],
  );

  // Build timeline for this duration
  const phases = React.useMemo(
    () => buildTimeline(durationInFrames, milestones, signpostPositions, worldEndX),
    [durationInFrames, milestones, signpostPositions, worldEndX],
  );

  // Get character state
  const charState = getCharacterState(frame, phases);

  // Camera follows character (character at 30% from left)
  const cameraX = charState.x * PX - SCREEN_W * 0.3;
  const clampedCameraX = Math.max(0, Math.min(cameraX, worldEndX * PX - SCREEN_W));

  // Determine board reveal states
  const boardStates = milestones.map((_, i) => {
    const stopPhase = phases.find((p) => p.type === 'stop' && p.boardIndex === i);
    if (!stopPhase) return { revealProgress: 0, isActive: false, localFrame: 0 };

    if (frame < stopPhase.startFrame) return { revealProgress: 0, isActive: false, localFrame: 0 };
    if (frame >= stopPhase.endFrame) return { revealProgress: 1, isActive: false, localFrame: 999 };

    const localF = frame - stopPhase.startFrame;
    const reveal = interpolate(localF, [0, 40], [0, 1], {
      extrapolateRight: 'clamp',
      easing: Easing.out(Easing.cubic),
    });
    return { revealProgress: reveal, isActive: true, localFrame: localF };
  });

  // Music volume as a callback (frame => volume) for reliable playback
  const musicVolCallback = React.useCallback(
    (f: number) =>
      interpolate(f, [0, 30, durationInFrames - 60, durationInFrames], [0, musicVolume, musicVolume, 0], {
        extrapolateLeft: 'clamp',
        extrapolateRight: 'clamp',
      }),
    [durationInFrames, musicVolume],
  );

  return (
    <AbsoluteFill
      style={{
        backgroundColor: PALETTE.bg,
        overflow: 'hidden',
        imageRendering: 'pixelated',
      }}
    >
      {/* Background gradient overlay */}
      <AbsoluteFill
        style={{
          background: `linear-gradient(180deg, ${PALETTE.bg} 0%, ${PALETTE.bgGradient} 70%, ${PALETTE.ground} 100%)`,
        }}
      />

      {/* Stars (fixed, no scroll) */}
      <Stars frame={frame} />

      {/* Scrolling world container */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: worldEndX * PX,
          height: SCREEN_H,
          transform: `translateX(${-clampedCameraX}px)`,
          willChange: 'transform',
        }}
      >
        {/* Background trees */}
        <BackgroundTrees />

        {/* Ground */}
        <Ground worldWidth={worldEndX} />

        {/* Signposts */}
        {milestones.map((milestone, i) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: (signpostPositions[i] - 36) * PX,
              top: (GROUND_Y - (milestone.items ? 86 : 70)) * PX,
            }}
          >
            <Signpost
              milestone={milestone}
              index={i}
              revealProgress={boardStates[i].revealProgress}
              isActive={boardStates[i].isActive}
              localFrame={boardStates[i].localFrame}
            />
          </div>
        ))}

        {/* Character */}
        <div
          style={{
            position: 'absolute',
            left: charState.x * PX,
            top: CHAR_Y * PX,
          }}
        >
          <CharacterSprite
            isWalking={charState.isWalking}
            walkFrame={charState.walkFrame}
          />
        </div>
      </div>

      {/* Progress indicator at bottom */}
      <div
        style={{
          position: 'absolute',
          bottom: 24,
          left: SCREEN_W * 0.15,
          right: SCREEN_W * 0.15,
          height: PX,
          backgroundColor: withOpacity(PALETTE.accent, 0.15),
          borderRadius: PX / 2,
        }}
      >
        <div
          style={{
            width: `${((charState.x - CHAR_START_X) / (worldEndX - CHAR_START_X - 200)) * 100}%`,
            maxWidth: '100%',
            height: '100%',
            backgroundColor: PALETTE.accent,
            borderRadius: PX / 2,
            transition: 'width 0.1s',
          }}
        />
        {/* Milestone dots on progress bar */}
        {signpostPositions.map((pos, i) => {
          const pct = ((pos - CHAR_START_X) / (worldEndX - CHAR_START_X - 200)) * 100;
          return (
            <div
              key={i}
              style={{
                position: 'absolute',
                left: `${pct}%`,
                top: -PX * 1.5,
                width: PX * 1.5,
                height: PX * 1.5,
                backgroundColor:
                  boardStates[i].revealProgress > 0 ? PALETTE.accent : withOpacity(PALETTE.accent, 0.3),
                borderRadius: PX,
                transform: 'translateX(-50%)',
              }}
            />
          );
        })}
      </div>

      {/* 8-bit music */}
      {withMusic && (
        <Audio src={staticFile('music/8bit-roadmap.wav')} volume={musicVolCallback} />
      )}
    </AbsoluteFill>
  );
};
