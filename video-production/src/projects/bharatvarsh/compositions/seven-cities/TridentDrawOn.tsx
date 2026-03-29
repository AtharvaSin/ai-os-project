/**
 * TridentDrawOn.tsx — Scene 5: The Claim (frames 360–450)
 *
 * "Seven Cities Burn" BVN-24x7 breaking news broadcast reel.
 *
 * Shows the New Tribhuj trident being drawn over the graffiti image,
 * simulating spray-paint in real time via stroke-dashoffset animation.
 *
 * Animation timeline (1.5x scaled from original):
 *   Frame 360–420 (12.0–14.0s)  SVG trident path draws on via stroke-dashoffset
 *   Frame 420–450 (14.0–15.0s)  Chromatic aberration effect + scanline bloom on trident
 *   Frame 428–450 (14.27–15.0s) "WE REMEMBER WHAT YOU ERASED" text fades in below trident
 *   Frame 362+                   "CCTV FOOTAGE — CLASSIFIED" stamp fades in top-left
 *
 * Background: image3_graffiti_trident.jpg full-bleed.
 * SVG trident: three-pronged stylised trident with crossbar.
 * Post-draw: chromatic split (red +2px, blue -2px) + drop-shadow glow.
 * Text: JetBrains Mono 19px (vertical bump), white, centred below trident.
 *
 * No props required — uses useCurrentFrame internally.
 */

import React from "react";
import {
  AbsoluteFill,
  interpolate,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { C, FONT, TEXT_SHADOW, TEXT_SHADOW_HEAVY, SAFE_MARGIN } from "./constants";

// ─── Image Paths ─────────────────────────────────────────────────────────────
const IMG = {
  graffiti: staticFile("content/post-seven-cities/image3_graffiti_trident.jpg"),
};

// ─── Trident SVG Path Data ───────────────────────────────────────────────────
/**
 * Simplified three-pronged trident in a 200x300 viewBox:
 *   - Central shaft from bottom to junction
 *   - Three prongs diverging upward (left, centre, right)
 *   - Horizontal crossbar
 *
 * Total estimated path length: ~600 units.
 */
const TRIDENT_PATH =
  "M 100,280 L 100,120 " +
  "M 100,120 L 60,40 L 70,45 L 100,100 " +
  "M 100,120 L 100,20 " +
  "M 100,120 L 140,40 L 130,45 L 100,100 " +
  "M 85,180 L 115,180";

const ESTIMATED_PATH_LENGTH = 600;

// ─── Scene frame boundaries (1.5x scaled) ───────────────────────────────────
const DRAW_START = 360;
const DRAW_END = 420;
const ABERRATION_START = 420;
const TEXT_FADE_START = 428;
const TEXT_FADE_END = 450;
const CCTV_FADE_START = 362;

// ─── Scanline Bloom Overlay ──────────────────────────────────────────────────
/**
 * Horizontal scanline overlay applied over the trident area after draw completes.
 * 2px transparent / 2px semi-opaque banding at 50% opacity.
 */
const ScanlineBloom: React.FC<{ opacity: number }> = ({ opacity }) => {
  if (opacity <= 0) return null;

  return (
    <div
      style={{
        position: "absolute",
        top: "15%",
        left: "25%",
        width: "50%",
        height: "50%",
        backgroundImage: `repeating-linear-gradient(
          0deg,
          transparent 0px,
          transparent 2px,
          rgba(23, 208, 227, 0.08) 2px,
          rgba(23, 208, 227, 0.08) 4px
        )`,
        backgroundSize: "100% 4px",
        opacity,
        zIndex: 25,
        pointerEvents: "none",
      }}
    />
  );
};

// ─── CCTV Classified Stamp ───────────────────────────────────────────────────
/**
 * "CCTV FOOTAGE — CLASSIFIED" stamp in top-left area.
 * Fades in 2 frames into the scene, holds at ~0.8 with subtle pulse.
 */
const CCTVStamp: React.FC<{
  frame: number;
  isVertical: boolean;
}> = ({ frame, isVertical }) => {
  // Fade in over 8 frames starting at frame 362
  const baseOpacity = interpolate(
    frame,
    [CCTV_FADE_START, CCTV_FADE_START + 8],
    [0, 0.8],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );

  if (baseOpacity <= 0) return null;

  // Subtle pulse: oscillate between 0.7 and 0.9
  const pulse = 0.8 + 0.1 * Math.sin((frame - CCTV_FADE_START) * 0.3);
  const opacity = Math.min(baseOpacity, pulse);

  const fontSize = isVertical ? 13 : 11;

  return (
    <div
      style={{
        position: "absolute",
        left: SAFE_MARGIN,
        top: "18%",
        zIndex: 35,
        pointerEvents: "none",
      }}
    >
      <span
        style={{
          fontFamily: FONT.mono,
          fontSize,
          color: C.red,
          letterSpacing: "0.06em",
          opacity,
          border: `1px solid ${C.red}`,
          padding: "6px 12px",
          textShadow: TEXT_SHADOW_HEAVY,
          willChange: "opacity",
        }}
      >
        CCTV FOOTAGE — CLASSIFIED
      </span>
    </div>
  );
};

// ─── Trident SVG Layer ───────────────────────────────────────────────────────
/**
 * SVG trident with stroke-dashoffset draw-on animation.
 * After draw completes, applies chromatic aberration via triple-layer rendering.
 */
const TridentSVG: React.FC<{
  frame: number;
  width: number;
  height: number;
}> = ({ frame, width, height }) => {
  // Calculate draw-on progress (0→1 over frames 360–420)
  const drawProgress = interpolate(
    frame,
    [DRAW_START, DRAW_END],
    [0, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );

  // stroke-dashoffset: full length → 0 as path draws on
  const dashOffset = ESTIMATED_PATH_LENGTH * (1 - drawProgress);

  // Has the draw completed?
  const isDrawComplete = frame >= ABERRATION_START;

  // Chromatic aberration opacity ramps in after draw completes
  const aberrationOpacity = interpolate(
    frame,
    [ABERRATION_START, ABERRATION_START + 5],
    [0, 0.5],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );

  // SVG dimensions — scale trident to ~40% of frame width, centred
  const svgWidth = width * 0.4;
  const svgHeight = svgWidth * 1.5; // Maintain 200:300 aspect ratio
  const svgLeft = (width - svgWidth) / 2;
  const svgTop = (height - svgHeight) / 2 - height * 0.05; // Slightly above centre

  /** Shared stroke properties for all trident layers. */
  const baseStrokeProps = {
    d: TRIDENT_PATH,
    fill: "none",
    strokeWidth: 3,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    strokeDasharray: ESTIMATED_PATH_LENGTH,
  };

  return (
    <div
      style={{
        position: "absolute",
        left: svgLeft,
        top: svgTop,
        width: svgWidth,
        height: svgHeight,
        zIndex: 20,
        pointerEvents: "none",
        filter: isDrawComplete ? `drop-shadow(0 0 12px ${C.cyan})` : "none",
      }}
    >
      <svg
        viewBox="0 0 200 300"
        width={svgWidth}
        height={svgHeight}
        style={{ overflow: "visible" }}
      >
        {/* Red channel — offset +2px right (chromatic aberration) */}
        {isDrawComplete && (
          <path
            {...baseStrokeProps}
            stroke="rgba(255, 45, 45, 0.5)"
            strokeDashoffset={0}
            opacity={aberrationOpacity}
            transform="translate(2, 0)"
          />
        )}

        {/* Blue channel — offset -2px left (chromatic aberration) */}
        {isDrawComplete && (
          <path
            {...baseStrokeProps}
            stroke="rgba(23, 208, 227, 0.5)"
            strokeDashoffset={0}
            opacity={aberrationOpacity}
            transform="translate(-2, 0)"
          />
        )}

        {/* Primary trident path — cyan draw-on */}
        <path
          {...baseStrokeProps}
          stroke={C.cyan}
          strokeDashoffset={dashOffset}
        />
      </svg>
    </div>
  );
};

// ─── Text Reveal ─────────────────────────────────────────────────────────────
/**
 * "WE REMEMBER WHAT YOU ERASED" text fading in below the trident.
 * JetBrains Mono, white, centred, broadcast-safe margins.
 */
const ClaimText: React.FC<{
  frame: number;
  isVertical: boolean;
}> = ({ frame, isVertical }) => {
  const textOpacity = interpolate(
    frame,
    [TEXT_FADE_START, TEXT_FADE_END],
    [0, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );

  if (textOpacity <= 0) return null;

  const fontSize = isVertical ? 19 : 16;

  return (
    <div
      style={{
        position: "absolute",
        bottom: "22%",
        left: 0,
        right: 0,
        display: "flex",
        justifyContent: "center",
        zIndex: 30,
        pointerEvents: "none",
      }}
    >
      <span
        style={{
          fontFamily: FONT.mono,
          fontSize,
          color: C.white,
          letterSpacing: "0.08em",
          opacity: textOpacity,
          textShadow: TEXT_SHADOW,
          textAlign: "center",
          willChange: "opacity",
        }}
      >
        WE REMEMBER WHAT YOU ERASED
      </span>
    </div>
  );
};

// ─── Main Component ──────────────────────────────────────────────────────────
export const TridentDrawOn: React.FC = () => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();

  const isVertical = height > width;

  // Scanline bloom opacity — fades in after draw completes
  const scanlineOpacity = interpolate(
    frame,
    [ABERRATION_START, ABERRATION_START + 10],
    [0, 0.5],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );

  return (
    <AbsoluteFill style={{ backgroundColor: C.obsidian }}>
      {/* Full-bleed graffiti background */}
      <img
        src={IMG.graffiti}
        alt=""
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          objectFit: "cover",
          zIndex: 1,
        }}
      />

      {/* CCTV classified stamp — top-left */}
      <CCTVStamp frame={frame} isVertical={isVertical} />

      {/* SVG trident draw-on + chromatic aberration */}
      <TridentSVG frame={frame} width={width} height={height} />

      {/* Scanline bloom over trident area */}
      <ScanlineBloom opacity={scanlineOpacity} />

      {/* Claim text reveal */}
      <ClaimText frame={frame} isVertical={isVertical} />
    </AbsoluteFill>
  );
};
