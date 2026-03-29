/**
 * PersonaGateway --- RPG-inspired "Character Select" intro screen for Part B.
 *
 * 420 frames (14s) at 30fps. Full 1920x1080 opaque.
 * Dark background with pixel grid, 4 glowing podiums, characters as silhouettes
 * that reveal one by one, then camera pushes toward Podium 1 (Business Pro).
 *
 * Animation sequence:
 *   0-30   : "PART B" types in, amber underline draws
 *   30-75  : Title + tagline spring in
 *   75-135 : Grid appears, podiums rise, characters as silhouettes
 *   135-270: Hold with breathing animation + ember particles
 *   270-315: Podium 1 reveals full color
 *   315-390: Camera pushes toward Podium 1, others fade
 *   390-420: Fade to black
 */
import React from 'react';
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
import {
  BusinessProCharacter,
  TeacherStudentCharacter,
  EntrepreneurCharacter,
  EngineerCharacter,
  PERSONA_COLORS,
} from './PixelCharacters';

loadPressStart('normal', { weights: ['400'], subsets: ['latin'] });

// ── Tokens ──────────────────────────────────────────────────
const BG = '#0A0C14';
const AMBER = PILLARS[1].accent;
const SPRING_CFG = { damping: 160, stiffness: 240, mass: 0.9 } as const;

// ── Podium data ─────────────────────────────────────────────
interface PodiumConfig {
  id: number;
  label: string;
  accent: string;
  Character: React.FC<{ scale?: number; silhouette?: boolean }>;
  charScale: number;
  /** Horizontal center X for the podium (in 1920-wide viewport). */
  cx: number;
}

const PODIUMS: PodiumConfig[] = [
  {
    id: 1,
    label: '01 BUSINESS PRO',
    accent: PERSONA_COLORS.businessPro,
    Character: BusinessProCharacter,
    charScale: 1.4,
    cx: 270,
  },
  {
    id: 2,
    label: '02 TEACHERS & STUDENTS',
    accent: PERSONA_COLORS.teacherStudent,
    Character: TeacherStudentCharacter,
    charScale: 1.2,
    cx: 640,
  },
  {
    id: 3,
    label: '03 ENTREPRENEURS',
    accent: PERSONA_COLORS.entrepreneur,
    Character: EntrepreneurCharacter,
    charScale: 1.4,
    cx: 1010,
  },
  {
    id: 4,
    label: '04 ENGINEERS',
    accent: PERSONA_COLORS.engineer,
    Character: EngineerCharacter,
    charScale: 1.4,
    cx: 1380,
  },
];

// ── Star field (mirrors DeploymentLanes exactly) ────────────
const STARS = Array.from({ length: 50 }, (_, i) => ({
  x: ((i * 173 + 41) % 1880) + 20,
  y: ((i * 97 + 29) % 1040) + 20,
  phase: (i * 31) % 70,
  size: i % 4 === 0 ? 3 : 2,
}));

const StarField: React.FC<{ frame: number }> = ({ frame }) => (
  <>
    {STARS.map((s, i) => (
      <div
        key={i}
        style={{
          position: 'absolute',
          left: s.x,
          top: s.y,
          width: s.size,
          height: s.size,
          backgroundColor: '#FFF',
          opacity: interpolate(
            (frame + s.phase) % 70,
            [0, 35, 70],
            [0.15, 0.7, 0.15],
          ),
        }}
      />
    ))}
  </>
);

// ── Ember particles ─────────────────────────────────────────
interface Ember {
  x: number;
  startY: number;
  speed: number;
  phase: number;
}

const EMBERS: Ember[] = Array.from({ length: 10 }, (_, i) => ({
  x: 160 + ((i * 197 + 53) % 1600),
  startY: 900 + ((i * 73) % 120),
  speed: 0.6 + (i % 4) * 0.2,
  phase: (i * 43) % 200,
}));

const EmberParticles: React.FC<{ frame: number }> = ({ frame }) => (
  <>
    {EMBERS.map((e, i) => {
      const travel = ((frame + e.phase) * e.speed) % 500;
      const y = e.startY - travel;
      const opacity = interpolate(travel, [0, 80, 400, 500], [0, 0.6, 0.2, 0], {
        extrapolateLeft: 'clamp',
        extrapolateRight: 'clamp',
      });
      return (
        <div
          key={i}
          style={{
            position: 'absolute',
            left: e.x + Math.sin(travel * 0.02) * 8,
            top: y,
            width: 3,
            height: 3,
            backgroundColor: AMBER,
            opacity,
            boxShadow: `0 0 4px ${withOpacity(AMBER, opacity * 0.6)}`,
          }}
        />
      );
    })}
  </>
);

// ── Typewriter helper ───────────────────────────────────────
const typewrite = (text: string, frame: number, charsPerFrame: number): string => {
  const count = Math.floor(frame * charsPerFrame);
  return text.slice(0, Math.min(count, text.length));
};

// ── Single Podium ───────────────────────────────────────────
const Podium: React.FC<{
  config: PodiumConfig;
  frame: number;
  fps: number;
  riseProgress: number;
  isRevealed: boolean;
  revealProgress: number;
  glowIntensity: number;
  globalOpacity: number;
}> = ({
  config,
  frame,
  riseProgress,
  isRevealed,
  revealProgress,
  glowIntensity,
  globalOpacity,
}) => {
  const { label, accent, Character, charScale, cx } = config;
  const platformWidth = 180;
  const platformHeight = 12;

  const translateY = interpolate(riseProgress, [0, 1], [100, 0]);
  const breathe = Math.sin(frame * 0.07) * 2;

  const labelBrightness = isRevealed
    ? interpolate(revealProgress, [0, 1], [0.4, 1])
    : 0.4;

  return (
    <div
      style={{
        position: 'absolute',
        left: cx - platformWidth / 2,
        bottom: 140,
        width: platformWidth,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        transform: `translateY(${translateY}px)`,
        opacity: interpolate(riseProgress, [0, 0.2], [0, 1], {
          extrapolateRight: 'clamp',
        }) * globalOpacity,
      }}
    >
      {/* ── Character ── */}
      <div
        style={{
          position: 'relative',
          transform: `translateY(${breathe}px)`,
          marginBottom: 4,
        }}
      >
        {/* Silhouette layer (always rendered, fades out on reveal) */}
        <div
          style={{
            opacity: isRevealed
              ? interpolate(revealProgress, [0, 1], [1, 0])
              : 1,
            position: isRevealed ? 'absolute' : 'relative',
            top: 0,
            left: 0,
          }}
        >
          <Character scale={charScale} silhouette />
        </div>

        {/* Full-color layer (fades in on reveal) */}
        {isRevealed && (
          <div
            style={{
              opacity: interpolate(revealProgress, [0, 1], [0, 1]),
            }}
          >
            <Character scale={charScale} />
          </div>
        )}
      </div>

      {/* ── Platform ── */}
      <div
        style={{
          width: platformWidth,
          height: platformHeight,
          backgroundColor: '#2A1A08',
          borderTop: `2px solid ${accent}`,
          boxShadow: `0 0 ${12 + glowIntensity * 20}px ${withOpacity(
            accent,
            0.3 + glowIntensity * 0.3,
          )}, 0 ${2 + glowIntensity * 4}px ${8 + glowIntensity * 12}px ${withOpacity(
            accent,
            0.15 + glowIntensity * 0.2,
          )}`,
          imageRendering: 'pixelated' as const,
        }}
      />

      {/* ── Label ── */}
      <div
        style={{
          marginTop: 12,
          fontFamily: pressStartFamily,
          fontSize: 11,
          color: accent,
          letterSpacing: 1,
          textAlign: 'center',
          whiteSpace: 'nowrap',
          opacity: labelBrightness,
          textShadow:
            isRevealed && revealProgress > 0.5
              ? `0 0 8px ${withOpacity(accent, 0.5)}`
              : 'none',
        }}
      >
        {label}
      </div>
    </div>
  );
};

// ── Main Composition ────────────────────────────────────────
export const PersonaGateway: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // ── Phase 1: "PART B" typewriter (frames 0-30) ───────────
  const partBText = 'PART B';
  const typedPartB = typewrite(partBText, frame, 1 / 3); // 1 char every 3 frames
  const underlineWidth = interpolate(frame, [0, 28], [0, 200], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const partBOpacity = interpolate(frame, [0, 3], [0, 1], {
    extrapolateRight: 'clamp',
  });

  // ── Phase 2: Title + tagline spring (frames 30-75) ───────
  const titleSpring =
    frame >= 30
      ? spring({ frame: frame - 30, fps, config: SPRING_CFG })
      : 0;
  const titleScale = interpolate(titleSpring, [0, 1], [0.85, 1]);
  const titleOpacity = interpolate(titleSpring, [0, 0.3], [0, 1], {
    extrapolateRight: 'clamp',
  });

  const taglineSpring =
    frame >= 42
      ? spring({ frame: frame - 42, fps, config: SPRING_CFG })
      : 0;
  const taglineOpacity = interpolate(taglineSpring, [0, 0.3], [0, 1], {
    extrapolateRight: 'clamp',
  });

  // ── Phase 3: Grid + podiums rise (frames 75-135) ─────────
  const gridOpacity = interpolate(frame, [75, 105], [0, 0.03], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const podiumRiseProgress = PODIUMS.map((_, i) => {
    const podiumStart = 85 + i * 8;
    return frame >= podiumStart
      ? spring({ frame: frame - podiumStart, fps, config: SPRING_CFG })
      : 0;
  });

  // ── Phase 5: Reveal podium 1 (frames 270-315) ────────────
  const revealProgress =
    frame >= 270
      ? spring({
          frame: frame - 270,
          fps,
          config: { damping: 120, stiffness: 180, mass: 1.0 },
        })
      : 0;

  const podium1GlowBoost = interpolate(frame, [270, 300], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // ── Phase 6: Camera push toward podium 1 (frames 315-390) ─
  const zoomProgress =
    frame >= 315
      ? spring({
          frame: frame - 315,
          fps,
          config: { damping: 200, stiffness: 120, mass: 1.2 },
        })
      : 0;
  const sceneScale = interpolate(zoomProgress, [0, 1], [1.0, 1.35]);

  // Podium 1 center: cx=270, bottom area ~700px from top
  const sceneTX = interpolate(zoomProgress, [0, 1], [0, -270 + 960]); // push origin toward podium 1 x
  const sceneTY = interpolate(zoomProgress, [0, 1], [0, -120]); // push down a bit

  // Fade out other podiums during zoom
  const otherPodiumOpacity = interpolate(frame, [315, 370], [1, 0.15], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // ── Phase 7: Fade to black (frames 390-420) ──────────────
  const fadeToBlack = interpolate(frame, [390, 420], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: BG,
        overflow: 'hidden',
        imageRendering: 'pixelated',
      }}
    >
      {/* ── Pixel grid overlay ── */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          opacity: gridOpacity,
          backgroundImage:
            'radial-gradient(circle, rgba(255,255,255,0.5) 1px, transparent 1px)',
          backgroundSize: '24px 24px',
        }}
      />

      {/* ── Star field ── */}
      <StarField frame={frame} />

      {/* ── Scene container (handles zoom transform) ── */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          transform: `scale(${sceneScale}) translate(${sceneTX * (sceneScale - 1) / sceneScale}px, ${sceneTY * (sceneScale - 1) / sceneScale}px)`,
          transformOrigin: `${PODIUMS[0].cx}px 700px`,
        }}
      >
        {/* ── Ember particles ── */}
        {frame >= 100 && <EmberParticles frame={frame} />}

        {/* ── Podiums ── */}
        {PODIUMS.map((p, i) => (
          <Podium
            key={p.id}
            config={p}
            frame={frame}
            fps={fps}
            riseProgress={podiumRiseProgress[i]}
            isRevealed={i === 0 && frame >= 270}
            revealProgress={i === 0 ? revealProgress : 0}
            glowIntensity={i === 0 ? podium1GlowBoost : 0}
            globalOpacity={i === 0 ? 1 : otherPodiumOpacity}
          />
        ))}
      </div>

      {/* ── Text overlay (not affected by scene zoom) ── */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          pointerEvents: 'none',
        }}
      >
        {/* "PART B" */}
        <div
          style={{
            position: 'relative',
            marginTop: 120,
            opacity: partBOpacity,
          }}
        >
          <span
            style={{
              fontFamily: pressStartFamily,
              fontSize: 28,
              color: AMBER,
              letterSpacing: 4,
              textShadow: `0 0 16px ${withOpacity(AMBER, 0.5)}`,
            }}
          >
            {typedPartB}
          </span>
          {/* Blinking cursor */}
          {typedPartB.length < partBText.length && (
            <span
              style={{
                display: 'inline-block',
                width: 3,
                height: 28,
                backgroundColor: AMBER,
                marginLeft: 4,
                verticalAlign: 'bottom',
                opacity: frame % 16 < 8 ? 1 : 0,
              }}
            />
          )}
          {/* Amber underline */}
          <div
            style={{
              position: 'absolute',
              bottom: -8,
              left: '50%',
              transform: 'translateX(-50%)',
              width: underlineWidth,
              height: 3,
              backgroundColor: AMBER,
              boxShadow: `0 0 10px ${withOpacity(AMBER, 0.6)}`,
            }}
          />
        </div>

        {/* Title */}
        <div
          style={{
            marginTop: 32,
            transform: `scale(${titleScale})`,
            opacity: titleOpacity,
          }}
        >
          <span
            style={{
              fontFamily: FONT_FAMILY.display,
              fontWeight: 700,
              fontSize: 44,
              color: COLORS.text.primary,
              letterSpacing: 2,
              textShadow: `0 2px 20px ${withOpacity('#000', 0.5)}`,
            }}
          >
            THE FRAMEWORK IN ACTION
          </span>
        </div>

        {/* Tagline */}
        <div
          style={{
            marginTop: 18,
            opacity: taglineOpacity,
          }}
        >
          <span
            style={{
              fontFamily: FONT_FAMILY.body,
              fontSize: 18,
              color: COLORS.text.secondary,
              letterSpacing: 1,
            }}
          >
            4 Personas &middot; 4 Workflows &middot; 1 Framework
          </span>
        </div>
      </div>

      {/* ── Fade to black overlay ── */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundColor: '#000',
          opacity: fadeToBlack,
          pointerEvents: 'none',
        }}
      />
    </AbsoluteFill>
  );
};
