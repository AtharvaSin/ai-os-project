/**
 * BreakingBanner.tsx — Scene 2 top element (frames 67–135)
 *
 * "Seven Cities Burn" BVN-24x7 breaking news broadcast reel.
 *
 * Animation timeline (1.5× scaled):
 *   Frame 67–75 (2.23–2.5s)   Red banner wipes in from left edge to full width
 *   Frame 75–135 (2.5–4.5s)   Banner holds at full width
 *
 * Implementation:
 *   - Width animated from 0% to 100% using interpolate over frames 67–75
 *   - Background: C.red (#FF2D2D)
 *   - Text: "BREAKING NEWS" in Bebas Neue, white, 48px, with TEXT_SHADOW
 *   - Height: 80px (adjusted for landscape orientation)
 *   - zIndex 50
 *
 * No props required — uses useCurrentFrame internally.
 */

import React from "react";
import { interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { C, FONT, TEXT_SHADOW } from "./constants";

// ─── Main Component ───────────────────────────────────────────────────────────
export const BreakingBanner: React.FC = () => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();

  // Not visible before frame 67
  if (frame < 67) return null;

  const isVertical = height > width;
  const bannerHeight = isVertical ? 80 : 64;
  const fontSize = isVertical ? 48 : 40;

  // Width wipe: 0% → 100% over frames 67–75
  const widthPercent = interpolate(frame, [67, 75], [0, 100], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Text opacity: fade in slightly after the wipe starts for a cleaner reveal
  const textOpacity = interpolate(frame, [70, 75], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <div
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: `${widthPercent}%`,
        height: bannerHeight,
        backgroundColor: C.red,
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        overflow: "hidden",
        zIndex: 50,
      }}
    >
      <span
        style={{
          fontFamily: FONT.display,
          fontSize,
          color: C.white,
          letterSpacing: "0.15em",
          textTransform: "uppercase",
          opacity: textOpacity,
          whiteSpace: "nowrap",
          textShadow: TEXT_SHADOW,
        }}
      >
        BREAKING NEWS
      </span>
    </div>
  );
};
