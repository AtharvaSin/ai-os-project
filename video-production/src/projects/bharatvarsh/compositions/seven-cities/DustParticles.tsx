/**
 * DustParticles.tsx — Floating dust/debris particles for Scene 3 (street carnage).
 *
 * Renders deterministic pseudo-random SVG circles that drift using
 * sin/cos oscillation (no external noise library required).
 *
 * Each particle has a staggered lifecycle:
 *   - Fade in  over 10 frames
 *   - Drift    for  40 frames
 *   - Fade out over 10 frames
 *   Total cycle: 60 frames, then the particle loops.
 *
 * Particle positions are seeded from their index so results are
 * reproducible across renders.
 *
 * zIndex 15 — behind text overlays but above background imagery.
 */

import React, { useMemo } from "react";
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";

// ─── Props ───────────────────────────────────────────────────────────────────
interface DustParticlesProps {
  /** Number of particles to render. Defaults to 18. */
  count?: number;
}

// ─── Deterministic pseudo-random seeder ──────────────────────────────────────
/** Returns a value between 0 and 1 based on a seed integer. */
const seededRandom = (seed: number): number => {
  const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};

// ─── Particle config type ────────────────────────────────────────────────────
interface ParticleConfig {
  /** Normalised start x (0–1). */
  baseX: number;
  /** Normalised start y (0–1). */
  baseY: number;
  /** Circle radius in px (1–3). */
  radius: number;
  /** Base opacity (0.2–0.4). */
  opacity: number;
  /** Frame offset for staggered spawn. */
  spawnOffset: number;
}

// ─── Lifecycle constants ─────────────────────────────────────────────────────
const FADE_IN = 10;
const DRIFT = 40;
const FADE_OUT = 10;
const CYCLE = FADE_IN + DRIFT + FADE_OUT; // 60 frames

// ─── Component ───────────────────────────────────────────────────────────────
export const DustParticles: React.FC<DustParticlesProps> = ({ count = 18 }) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();

  // Build deterministic particle configs once.
  const particles = useMemo<ParticleConfig[]>(() => {
    return Array.from({ length: count }, (_, i) => ({
      baseX: seededRandom(i * 3),
      baseY: seededRandom(i * 3 + 1),
      radius: 1 + seededRandom(i * 3 + 2) * 2, // 1–3 px
      opacity: 0.2 + seededRandom(i * 7) * 0.2, // 0.2–0.4
      spawnOffset: Math.floor(seededRandom(i * 5 + 3) * CYCLE), // 0–59
    }));
  }, [count]);

  return (
    <AbsoluteFill style={{ zIndex: 15, pointerEvents: "none" }}>
      <svg width={width} height={height}>
        {particles.map((p, i) => {
          // Determine where this particle is in its lifecycle.
          const localFrame = (frame + p.spawnOffset) % CYCLE;

          // Lifecycle opacity envelope: fade-in / hold / fade-out.
          const lifecycleOpacity = interpolate(
            localFrame,
            [0, FADE_IN, FADE_IN + DRIFT, CYCLE],
            [0, 1, 1, 0],
            { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
          );

          if (lifecycleOpacity <= 0) return null;

          // Drift offsets — deterministic sin/cos oscillation.
          const xOffset = Math.sin(frame * 0.03 + i * 1.7) * 30;
          const yOffset = Math.cos(frame * 0.02 + i * 2.3) * 20;

          const cx = p.baseX * width + xOffset;
          const cy = p.baseY * height + yOffset;

          return (
            <circle
              key={i}
              cx={cx}
              cy={cy}
              r={p.radius}
              fill={`rgba(255, 255, 255, ${p.opacity * lifecycleOpacity})`}
            />
          );
        })}
      </svg>
    </AbsoluteFill>
  );
};
