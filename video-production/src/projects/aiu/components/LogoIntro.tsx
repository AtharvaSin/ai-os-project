/**
 * LogoIntro — 5-Second Channel Logo Bumper (v2)
 *
 * Three pillar-colored energy orbs converge at center with comet-like
 * particle trails, flash, and reveal the AI&U wordmark + tagline.
 * Each orb image is rotated so its tail trails behind the direction of travel.
 * Procedural particles add dynamic shimmer along each tail.
 *
 * 150 frames @ 30fps = 5 seconds.
 */

import React from 'react';
import {
  AbsoluteFill,
  Img,
  Audio,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
  spring,
  interpolate,
  Easing,
} from 'remotion';
import { COLORS, PILLARS } from '../constants';
import { FONT_FAMILY } from '../utils/fonts';
import { withOpacity } from '../utils/colors';
import { SPRING_CONFIGS } from '../utils/animations';

// ── Deterministic pseudo-random (stable across frames) ──────
const rand = (i: number, salt = 0): number => {
  const x = Math.sin(i * 127.1 + salt * 311.7) * 43758.5453;
  return x - Math.floor(x);
};

// ── Particle system ─────────────────────────────────────────
const PARTICLES_PER_ORB = 20;
const MAX_TRAIL_DIST = 340;

interface ParticleSeed {
  baseDist: number;
  scatter: number;
  size: number;
  baseOpacity: number;
  pulseRate: number;
  pulsePhase: number;
  jitterAmpX: number;
  jitterAmpY: number;
  jitterRate: number;
  driftOffset: number;
}

function makeParticleSeeds(orbIndex: number): ParticleSeed[] {
  return Array.from({ length: PARTICLES_PER_ORB }, (_, i) => {
    const k = orbIndex * 100 + i;
    return {
      baseDist: 20 + rand(k, 0) * (MAX_TRAIL_DIST - 20),
      scatter: (rand(k, 1) - 0.5) * 80,
      size: 3 + rand(k, 2) * 9,
      baseOpacity: 0.18 + rand(k, 3) * 0.55,
      pulseRate: 0.07 + rand(k, 4) * 0.16,
      pulsePhase: rand(k, 5) * Math.PI * 2,
      jitterAmpX: 2 + rand(k, 6) * 7,
      jitterAmpY: 2 + rand(k, 7) * 7,
      jitterRate: 0.05 + rand(k, 8) * 0.12,
      driftOffset: rand(k, 9) * MAX_TRAIL_DIST,
    };
  });
}

// ── Orb definitions ─────────────────────────────────────────
//
// Rotation math:
//   Each source image has its bokeh tail pointing roughly RIGHT (~0°).
//   The tail must point OPPOSITE to the travel direction (trailing behind).
//   Travel direction = vector from startPos toward (0,0).
//   Tail direction   = vector from (0,0) toward startPos = (startX, startY).
//   CSS rotation     = atan2(startY, startX) converted to degrees.
//
//   Green's source tail points upper-right (~-35°), not right (0°),
//   so its rotation compensates for that offset.

interface OrbDef {
  src: string;
  color: string;
  startX: number;
  startY: number;
  enterStart: number;
  enterEnd: number;
  imageRotation: number;
  tailAngle: number;
  particles: ParticleSeed[];
}

const ORBS: OrbDef[] = [
  {
    // Pillar 1 — Amber — enters from upper-left → tail should point upper-left
    src: 'logo-intro/orb-amber.jpg',
    color: PILLARS[1].accent,
    startX: -600,
    startY: -200,
    enterStart: 8,
    enterEnd: 50,
    imageRotation: 198,
    tailAngle: Math.atan2(-200, -600),
    particles: makeParticleSeeds(0),
  },
  {
    // Pillar 2 — Green — enters from bottom → tail should point straight down
    src: 'logo-intro/orb-green.jpg',
    color: PILLARS[2].accent,
    startX: 0,
    startY: 450,
    enterStart: 13,
    enterEnd: 52,
    imageRotation: 125,
    tailAngle: Math.atan2(450, 0),
    particles: makeParticleSeeds(1),
  },
  {
    // Pillar 3 — Indigo — enters from upper-right → tail should point upper-right
    src: 'logo-intro/orb-indigo.jpg',
    color: PILLARS[3].accent,
    startX: 600,
    startY: -180,
    enterStart: 18,
    enterEnd: 54,
    imageRotation: -17,
    tailAngle: Math.atan2(-180, 600),
    particles: makeParticleSeeds(2),
  },
];

// Viewport center
const CX = 960;
const CY = 540;

// ── Component ───────────────────────────────────────────────

export const LogoIntro: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const easeInOut = Easing.inOut(Easing.cubic);
  const easeOut = Easing.out(Easing.cubic);

  // ── Background energy field ─────────────────────────────
  const bgOpacity = interpolate(
    frame,
    [5, 25, 55, 72],
    [0, 0.45, 0.45, 0.12],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' },
  );

  // ── Convergence flash ───────────────────────────────────
  const flashOpacity = interpolate(
    frame,
    [52, 58, 62, 70],
    [0, 0.55, 0.55, 0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' },
  );

  // ── Logo reveal ─────────────────────────────────────────
  const logoSpring = spring({
    frame: frame - 60,
    fps,
    config: SPRING_CONFIGS.bouncy,
  });
  const logoScale = interpolate(logoSpring, [0, 1], [0.2, 1]);
  const logoOpacity = interpolate(logoSpring, [0, 0.25], [0, 1], {
    extrapolateRight: 'clamp',
  });

  const glowBase =
    frame > 85
      ? Math.sin((frame - 85) * 0.08) * 0.12 + 0.32
      : interpolate(frame, [60, 85], [0, 0.32], {
          extrapolateLeft: 'clamp',
          extrapolateRight: 'clamp',
        });

  // ── Tagline ─────────────────────────────────────────────
  const taglineOpacity = interpolate(frame, [82, 102], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: easeOut,
  });
  const taglineY = interpolate(frame, [82, 102], [14, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: easeOut,
  });

  // ── Accent line sweep ───────────────────────────────────
  const sweepPct = interpolate(frame, [88, 125], [0, 100], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: easeOut,
  });

  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.bg.primary }}>
      {/* ── Audio ──────────────────────────────────────── */}
      <Audio src={staticFile('sfx/logo-reveal.wav')} volume={0.85} />

      {/* ── Background energy field ────────────────────── */}
      <AbsoluteFill style={{ opacity: bgOpacity }}>
        <Img
          src={staticFile('logo-intro/bg-energy.jpg')}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
      </AbsoluteFill>

      {/* ── Orbs + particle trails ──────────────────────── */}
      {ORBS.map((orb, orbIdx) => {
        // Movement progress (0 → 1)
        const progress = interpolate(
          frame,
          [orb.enterStart, orb.enterEnd],
          [0, 1],
          { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: easeInOut },
        );
        const x = interpolate(progress, [0, 1], [orb.startX, 0]);
        const y = interpolate(progress, [0, 1], [orb.startY, 0]);
        const scale = interpolate(progress, [0, 0.6, 1], [1.15, 0.9, 0.25]);
        const orbOpacity = interpolate(
          frame,
          [orb.enterStart, orb.enterStart + 10, orb.enterEnd, orb.enterEnd + 12],
          [0, 0.92, 0.92, 0],
          { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' },
        );

        // Subtle organic wobble on the image rotation
        const wobble = Math.sin(frame * 0.14 + orbIdx * 2.5) * 3.5;
        const rotation = orb.imageRotation + wobble;

        // Particle drift speed — faster when orb is moving fast
        const driftSpeed = interpolate(
          frame,
          [orb.enterStart, orb.enterEnd],
          [3.0, 0.3],
          { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' },
        );

        // Particle layer opacity (fades with orb)
        const particleLayerOpacity = interpolate(
          frame,
          [orb.enterStart + 3, orb.enterStart + 14, orb.enterEnd - 5, orb.enterEnd + 10],
          [0, 1, 1, 0],
          { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' },
        );

        return (
          <React.Fragment key={orbIdx}>
            {/* ── Rotated orb image (screen-blended) ─── */}
            <AbsoluteFill
              style={{
                mixBlendMode: 'screen',
                opacity: orbOpacity,
                transform: `translate(${x}px, ${y}px) rotate(${rotation}deg) scale(${scale})`,
                willChange: 'transform, opacity',
              }}
            >
              <Img
                src={staticFile(orb.src)}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            </AbsoluteFill>

            {/* ── Procedural particle trail ──────────── */}
            <AbsoluteFill
              style={{
                opacity: particleLayerOpacity,
                pointerEvents: 'none',
              }}
            >
              {orb.particles.map((p, pi) => {
                // Dynamic distance: particles drift outward over time
                const elapsed = Math.max(0, frame - orb.enterStart);
                const dist =
                  ((p.baseDist + elapsed * driftSpeed + p.driftOffset) %
                    MAX_TRAIL_DIST);
                const distFactor = 1 - dist / MAX_TRAIL_DIST;

                // Shimmer/pulse
                const pulse =
                  0.45 + 0.55 * Math.sin(frame * p.pulseRate + p.pulsePhase);

                // Position along tail + perpendicular scatter + jitter
                const perpAngle = orb.tailAngle + Math.PI / 2;
                const jitterX =
                  Math.sin(frame * p.jitterRate + pi * 1.7) * p.jitterAmpX;
                const jitterY =
                  Math.cos(frame * p.jitterRate + pi * 2.3) * p.jitterAmpY;

                const px =
                  CX +
                  x +
                  dist * Math.cos(orb.tailAngle) +
                  p.scatter * Math.cos(perpAngle) +
                  jitterX;
                const py =
                  CY +
                  y +
                  dist * Math.sin(orb.tailAngle) +
                  p.scatter * Math.sin(perpAngle) +
                  jitterY;

                const opacity = p.baseOpacity * distFactor * pulse;
                const size = p.size * (0.35 + 0.65 * distFactor);
                const blur = size * 0.6;

                if (opacity < 0.03) return null;

                return (
                  <div
                    key={pi}
                    style={{
                      position: 'absolute',
                      left: px - size / 2,
                      top: py - size / 2,
                      width: size,
                      height: size,
                      borderRadius: '50%',
                      backgroundColor: orb.color,
                      opacity,
                      filter: `blur(${blur}px)`,
                      boxShadow: `0 0 ${size * 2}px ${withOpacity(orb.color, opacity * 0.6)}`,
                    }}
                  />
                );
              })}
            </AbsoluteFill>
          </React.Fragment>
        );
      })}

      {/* ── Convergence flash ──────────────────────────── */}
      <AbsoluteFill
        style={{
          background: `radial-gradient(circle at 50% 48%, ${withOpacity('#FFFFFF', flashOpacity)} 0%, transparent 55%)`,
          pointerEvents: 'none',
        }}
      />

      {/* ── Combined tri-color glow behind logo ────────── */}
      {frame > 55 && (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -55%)',
            width: 520,
            height: 520,
            borderRadius: '50%',
            background: `radial-gradient(circle,
              ${withOpacity(PILLARS[1].accent, glowBase * 0.45)} 0%,
              ${withOpacity(PILLARS[2].accent, glowBase * 0.35)} 30%,
              ${withOpacity(PILLARS[3].accent, glowBase * 0.25)} 60%,
              transparent 80%
            )`,
            filter: 'blur(60px)',
            opacity: logoOpacity,
            pointerEvents: 'none',
          }}
        />
      )}

      {/* ── AI&U Logo (PNG wordmark) ───────────────────── */}
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: `translate(-50%, -58%) scale(${logoScale})`,
          opacity: logoOpacity,
          willChange: 'transform, opacity',
        }}
      >
        <Img
          src={staticFile('brand/aiu-logo.png')}
          style={{ width: 300, height: 'auto' }}
        />
      </div>

      {/* ── Tagline ────────────────────────────────────── */}
      <div
        style={{
          position: 'absolute',
          top: '59%',
          left: '50%',
          transform: `translate(-50%, ${taglineY}px)`,
          opacity: taglineOpacity,
          whiteSpace: 'nowrap',
        }}
      >
        <span
          style={{
            fontFamily: FONT_FAMILY.body,
            fontWeight: 500,
            fontSize: 20,
            color: COLORS.text.secondary,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
          }}
        >
          Practical GenAI for Real People
        </span>
      </div>

      {/* ── Accent gradient line ───────────────────────── */}
      <div
        style={{
          position: 'absolute',
          top: '65%',
          left: '50%',
          transform: 'translateX(-50%)',
          width: 340,
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            width: `${sweepPct}%`,
            height: 2,
            background: `linear-gradient(90deg, ${PILLARS[1].accent}, ${PILLARS[2].accent}, ${PILLARS[3].accent})`,
            boxShadow: `0 0 10px ${withOpacity(PILLARS[2].accent, 0.4)}`,
          }}
        />
      </div>
    </AbsoluteFill>
  );
};
