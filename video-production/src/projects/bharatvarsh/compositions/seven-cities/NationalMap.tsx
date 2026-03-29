/**
 * NationalMap.tsx — Scene 2 centrepiece: India map + city dots (frames 67–135)
 *
 * "Seven Cities Burn" BVN-24x7 breaking news broadcast reel.
 *
 * Uses the actual India outline reference PNG (india-outline.png) with CSS
 * filters to create a cyan wireframe look, instead of a hand-traced SVG path.
 * This gives a pixel-perfect India outline.
 *
 * Three phases (1.5× scaled):
 *   Phase A (frames 75–85):   India map image fades in with cyan wireframe filter
 *   Phase B (frames 82–127):  Seven city dots stagger in (7 frames apart)
 *   Phase C (frames 127–135): All dots pulsing red, map holds
 *
 * Death toll counter fades in at frame 100.
 *
 * No props required — uses useCurrentFrame internally.
 */

import React from "react";
import {
  AbsoluteFill,
  Img,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { C, FONT, TEXT_SHADOW } from "./constants";

// ─── Assets ──────────────────────────────────────────────────────────────────
const INDIA_MAP = staticFile("content/post-seven-cities/india-outline.png");

// ─── Constants ───────────────────────────────────────────────────────────────
const MAP_FADE_START = 75;
const MAP_FADE_END = 85;
const DOTS_START = 82;
const DOT_STAGGER = 7;
const COUNTER_FADE_START = 100;

/**
 * City positions mapped to the India outline image.
 * The reference image has India roughly centered, so positions are relative
 * to the map container which crops the image to show just India.
 *
 * These are tuned to place dots on the correct geographic locations
 * within the reference outline image.
 */
const CITY_POSITIONS = [
  { name: "Bhojpal", x: 0.38, y: 0.48 },
  { name: "Mysuru", x: 0.40, y: 0.80 },
  { name: "Gopakapattana", x: 0.50, y: 0.68 },
  { name: "Jammu", x: 0.34, y: 0.14 },
  { name: "Kathmandu", x: 0.56, y: 0.28 },
  { name: "Kolkata", x: 0.68, y: 0.46 },
  { name: "Lakshmanpur", x: 0.48, y: 0.38 },
] as const;

// ─── India Map Image ─────────────────────────────────────────────────────────
/**
 * Renders the India outline PNG with CSS filters to create a cyan wireframe.
 * The image is inverted (white bg → black, black lines → white),
 * then tinted cyan via hue-rotate + saturate.
 */
const MapImage: React.FC<{
  frame: number;
  mapW: number;
  mapH: number;
}> = ({ frame, mapW, mapH }) => {
  const opacity = interpolate(frame, [MAP_FADE_START, MAP_FADE_END], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  if (opacity <= 0) return null;

  return (
    <div
      style={{
        position: "absolute",
        top: "50%",
        left: "50%",
        width: mapW,
        height: mapH,
        transform: "translate(-50%, -50%)",
        opacity,
      }}
    >
      <Img
        src={INDIA_MAP}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "contain",
          // Invert + high contrast to keep only bold outlines, suppress light text
          filter: "invert(1) brightness(0.35) contrast(1.5) sepia(1) hue-rotate(145deg) saturate(8)",
          mixBlendMode: "screen",
        }}
      />
      {/* Cyan glow overlay for the map lines */}
      <Img
        src={INDIA_MAP}
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          objectFit: "contain",
          filter: "invert(1) brightness(0.2) contrast(1.3) sepia(1) hue-rotate(145deg) saturate(8) blur(3px)",
          mixBlendMode: "screen",
          opacity: 0.5,
        }}
      />
    </div>
  );
};

// ─── City Dot ────────────────────────────────────────────────────────────────
const CityDot: React.FC<{
  city: (typeof CITY_POSITIONS)[number];
  triggerFrame: number;
  frame: number;
  fps: number;
  mapW: number;
  mapH: number;
}> = ({ city, triggerFrame, frame, fps, mapW, mapH }) => {
  if (frame < triggerFrame) return null;

  const localFrame = frame - triggerFrame;

  const bloomSpring = spring({
    frame: localFrame,
    fps,
    config: { stiffness: 200, damping: 12 },
  });

  const ringSize = interpolate(bloomSpring, [0, 1], [4, 30]);
  const isSettled = localFrame > 20;
  const pulseSize = isSettled ? Math.sin(frame * 0.15) * 2 + 8 : ringSize;
  const displayRing = isSettled ? pulseSize : ringSize;

  const dotColor = interpolate(localFrame, [0, 5], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const labelOpacity = interpolate(localFrame, [3, 8], [0, 0.6], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Position relative to map container
  const dotX = city.x * mapW;
  const dotY = city.y * mapH;

  const r = 255;
  const g = Math.round(255 * (1 - dotColor) + 45 * dotColor);
  const b = Math.round(255 * (1 - dotColor) + 45 * dotColor);
  const colorStr = `rgb(${r}, ${g}, ${b})`;

  return (
    <div
      style={{
        position: "absolute",
        left: dotX,
        top: dotY,
        transform: "translate(-50%, -50%)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        zIndex: 30,
        pointerEvents: "none",
      }}
    >
      {/* Expanding ring */}
      <div
        style={{
          position: "absolute",
          width: displayRing,
          height: displayRing,
          borderRadius: "50%",
          border: `1.5px solid ${C.red}`,
          opacity: interpolate(displayRing, [4, 15, 30], [0.9, 0.6, 0.3], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          }),
          boxShadow: `0 0 ${displayRing * 0.4}px ${C.red}80`,
        }}
      />

      {/* Solid centre dot */}
      <div
        style={{
          width: 5,
          height: 5,
          borderRadius: "50%",
          backgroundColor: colorStr,
          boxShadow: `0 0 8px ${dotColor > 0.5 ? C.red : C.white}`,
          zIndex: 31,
        }}
      />

      {/* City name label */}
      <span
        style={{
          position: "absolute",
          top: 12,
          fontFamily: FONT.mono,
          fontSize: 11,
          color: C.white,
          opacity: labelOpacity,
          whiteSpace: "nowrap",
          letterSpacing: "0.5px",
          textShadow: TEXT_SHADOW,
        }}
      >
        {city.name}
      </span>
    </div>
  );
};

// ─── Death Toll Counter ──────────────────────────────────────────────────────
const DeathTollCounter: React.FC<{ frame: number }> = ({ frame }) => {
  if (frame < COUNTER_FADE_START) return null;

  const fadeIn = interpolate(frame, [COUNTER_FADE_START, COUNTER_FADE_START + 8], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const flicker = 0.8 + 0.2 * Math.sin(frame * 0.3);
  const opacity = fadeIn * flicker;

  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        bottom: "-8%",
        display: "flex",
        justifyContent: "center",
        zIndex: 35,
        pointerEvents: "none",
      }}
    >
      <span
        style={{
          fontFamily: FONT.mono,
          fontSize: 14,
          lineHeight: "16px",
          color: C.cream,
          opacity,
          letterSpacing: "0.08em",
          textShadow: TEXT_SHADOW,
          whiteSpace: "nowrap",
        }}
      >
        CASUALTIES REPORTED: UPDATING...
      </span>
    </div>
  );
};

// ─── Main Component ──────────────────────────────────────────────────────────
export const NationalMap: React.FC = () => {
  const frame = useCurrentFrame();
  const { width, height, fps } = useVideoConfig();

  if (frame < 67) return null;

  const isVertical = height > width;

  // Map container sized to fit India proportionally
  // Reference image aspect ratio is roughly 0.82:1 (width:height)
  const maxH = height * 0.6;
  const maxW = width * 0.85;
  const mapH = Math.min(maxH, maxW / 0.82);
  const mapW = mapH * 0.82;

  const topOffset = isVertical ? 90 : 70;

  return (
    <AbsoluteFill
      style={{
        justifyContent: "center",
        alignItems: "center",
        paddingTop: topOffset,
        zIndex: 20,
        pointerEvents: "none",
      }}
    >
      <div
        style={{
          position: "relative",
          width: mapW,
          height: mapH,
        }}
      >
        {/* India outline image with cyan wireframe filter */}
        <MapImage frame={frame} mapW={mapW} mapH={mapH} />

        {/* City dots */}
        {CITY_POSITIONS.map((city, index) => {
          const triggerFrame = DOTS_START + Math.round(index * DOT_STAGGER);
          return (
            <CityDot
              key={city.name}
              city={city}
              triggerFrame={triggerFrame}
              frame={frame}
              fps={fps}
              mapW={mapW}
              mapH={mapH}
            />
          );
        })}

        {/* Death toll counter */}
        <DeathTollCounter frame={frame} />
      </div>
    </AbsoluteFill>
  );
};
