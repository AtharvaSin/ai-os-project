/**
 * BrandOverlay.tsx — Film grain + vignette overlay for the "Seven Cities Burn" reel.
 *
 * Applied globally on every frame to give a cinematic broadcast texture.
 *
 * Film grain:
 *   SVG feTurbulence filter (baseFrequency 0.65, 3 octaves).
 *   Seed rotates every frame (frame % 12) for subtle animation.
 *   Default opacity 0.06; Scene 3 (street carnage) passes 0.08.
 *   zIndex 90.
 *
 * Vignette:
 *   Radial gradient from transparent centre to obsidian at 45% opacity.
 *   zIndex 91.
 *
 * Filter IDs use the "sc-grain-" prefix to avoid collision with other reels.
 */

import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { C } from "./constants";

// ─── Props ───────────────────────────────────────────────────────────────────
interface BrandOverlayProps {
  /** Film grain opacity. Defaults to 0.06. Scene 3 uses 0.08. */
  grainIntensity?: number;
}

// ─── Film Grain ──────────────────────────────────────────────────────────────
const FilmGrain: React.FC<{ intensity: number }> = ({ intensity }) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const seed = frame % 12;

  return (
    <AbsoluteFill
      style={{ zIndex: 90, pointerEvents: "none", opacity: intensity }}
    >
      <svg width={width} height={height}>
        <filter id={`sc-grain-${seed}`}>
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.65"
            numOctaves={3}
            seed={seed}
          />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <rect
          width={width}
          height={height}
          fill="rgba(200,200,200,0.5)"
          filter={`url(#sc-grain-${seed})`}
        />
      </svg>
    </AbsoluteFill>
  );
};

// ─── Vignette ────────────────────────────────────────────────────────────────
const Vignette: React.FC = () => (
  <AbsoluteFill
    style={{
      background: `radial-gradient(ellipse at center, transparent 30%, ${C.obsidian}73 100%)`,
      zIndex: 91,
      pointerEvents: "none",
    }}
  />
);

// ─── Combined Overlay ────────────────────────────────────────────────────────
export const BrandOverlay: React.FC<BrandOverlayProps> = ({
  grainIntensity = 0.06,
}) => {
  return (
    <>
      <FilmGrain intensity={grainIntensity} />
      <Vignette />
    </>
  );
};
