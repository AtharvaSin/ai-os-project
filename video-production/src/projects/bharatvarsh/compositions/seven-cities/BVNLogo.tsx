/**
 * BVNLogo.tsx — Scene 1: Standby (frames 0–67, 2.25s at 30fps)
 *
 * "Seven Cities Burn" BVN-24x7 breaking news broadcast reel.
 * 1.5x timeline scale from original 0–45 frame range.
 *
 * Animation timeline:
 *   Frame 0–22  (0.0–0.73s)  Pure obsidian with CRT scanline overlay scrolling upward
 *   Frame 22–52 (0.73–1.73s) BVN-24x7 logo fades in centre-frame (Easing.inOut)
 *   Frame 32–52 (1.07–1.73s) Dateline text fades in (10 frames after logo starts)
 *   Frame 52–67 (1.73–2.25s) Logo holds; 2-frame glitch at frames 60–61
 *                             (chromatic split: red +2px, blue -2px, translateX +2px)
 *   Frame 22–52              LIVE indicator fades in (top-right, pulsing red dot)
 *
 * CRT scanlines: repeating-linear-gradient background, 4px period, 3% opacity,
 * backgroundPosition scrolls upward 1px per frame.
 *
 * No props required — uses useCurrentFrame and useVideoConfig internally.
 */

import React from "react";
import {
  AbsoluteFill,
  Easing,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { C, FONT, TEXT_SHADOW, SAFE_MARGIN } from "./constants";

// ─── CRT Scanline Overlay ─────────────────────────────────────────────────────
/**
 * Full-screen CRT scanline effect with horizontal lines scrolling upward.
 * 2px transparent / 2px dark banding at 3% opacity.
 */
const CRTScanlines: React.FC<{ frame: number }> = ({ frame }) => {
  const yOffset = -(frame % 4); // scroll 1px per frame, wrap every 4px period

  return (
    <AbsoluteFill
      style={{
        backgroundImage: `repeating-linear-gradient(
          0deg,
          transparent 0px,
          transparent 2px,
          rgba(0, 0, 0, 0.03) 2px,
          rgba(0, 0, 0, 0.03) 4px
        )`,
        backgroundSize: "100% 4px",
        backgroundPosition: `0px ${yOffset}px`,
        zIndex: 10,
        pointerEvents: "none",
      }}
    />
  );
};

// ─── Logo Text ────────────────────────────────────────────────────────────────
/**
 * BVN-24x7 centred logo with mustard gold colour, Bebas Neue display font.
 * Handles fade-in (frames 22–52), dateline subtitle, and 2-frame glitch (frames 60–61).
 */
const LogoText: React.FC<{
  frame: number;
  isVertical: boolean;
}> = ({ frame, isVertical }) => {
  // Fade-in: opacity 0→1 over frames 22–52 with easeInOut
  const logoOpacity = interpolate(frame, [22, 52], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.inOut(Easing.ease),
  });

  // Dateline fades in 10 frames after logo starts (frames 32–52)
  const datelineOpacity = interpolate(frame, [32, 52], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.inOut(Easing.ease),
  });

  // Before frame 22 — logo not visible yet
  if (frame < 22) return null;

  // Glitch: frames 60–61 — chromatic split + horizontal offset
  const isGlitching = frame >= 60 && frame <= 61;

  const transform = isGlitching ? "translateX(2px)" : "translateX(0px)";

  const glitchTextShadow = isGlitching
    ? `2px 0px 0px rgba(255, 0, 0, 0.7), -2px 0px 0px rgba(0, 100, 255, 0.7)`
    : TEXT_SHADOW;

  const fontSize = isVertical ? 48 : 56;
  const datelineFontSize = isVertical ? 13 : 13;

  return (
    <div
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 20,
        pointerEvents: "none",
      }}
    >
      <span
        style={{
          fontFamily: FONT.display,
          fontSize,
          color: C.mustard,
          letterSpacing: "0.2em",
          textTransform: "uppercase",
          opacity: logoOpacity,
          transform,
          textShadow: glitchTextShadow,
          willChange: "transform, opacity",
        }}
      >
        BVN-24x7
      </span>

      {/* Dateline — fades in 10 frames after logo */}
      {frame >= 32 && (
        <span
          style={{
            fontFamily: FONT.mono,
            fontSize: datelineFontSize,
            lineHeight: "15px",
            color: C.textSecondary,
            letterSpacing: "3px",
            textTransform: "uppercase",
            opacity: datelineOpacity,
            marginTop: 12,
            textShadow: TEXT_SHADOW,
            willChange: "opacity",
          }}
        >
          CIVIC HARMONY REPORT · OCTOBER 20, 2025
        </span>
      )}
    </div>
  );
};

// ─── LIVE Indicator ───────────────────────────────────────────────────────────
/**
 * Top-right "LIVE" badge with pulsing red dot. Fades in with the logo (frames 22–52).
 * Dot pulses via Math.sin on the current frame.
 */
const LiveIndicator: React.FC<{ frame: number }> = ({ frame }) => {
  // Fade in with logo: frames 22–52
  const opacity = interpolate(frame, [22, 52], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.inOut(Easing.ease),
  });

  if (frame < 22) return null;

  // Pulsing red dot: oscillate opacity between 0.4 and 1.0
  const dotPulse = 0.7 + 0.3 * Math.sin(frame * 0.3);

  return (
    <div
      style={{
        position: "absolute",
        top: "15%",
        right: SAFE_MARGIN,
        display: "flex",
        alignItems: "center",
        gap: 8,
        opacity,
        zIndex: 20,
        pointerEvents: "none",
      }}
    >
      {/* Pulsing red dot */}
      <div
        style={{
          width: 10,
          height: 10,
          borderRadius: "50%",
          backgroundColor: C.red,
          opacity: dotPulse,
          boxShadow: `0 0 8px ${C.red}`,
        }}
      />

      <span
        style={{
          fontFamily: FONT.mono,
          fontSize: 12,
          color: C.white,
          letterSpacing: "2px",
          textShadow: TEXT_SHADOW,
        }}
      >
        LIVE
      </span>
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────
export const BVNLogo: React.FC = () => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();

  const isVertical = height > width;

  return (
    <AbsoluteFill
      style={{
        backgroundColor: C.obsidian,
      }}
    >
      <CRTScanlines frame={frame} />
      <LogoText frame={frame} isVertical={isVertical} />
      <LiveIndicator frame={frame} />
    </AbsoluteFill>
  );
};
