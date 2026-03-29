/**
 * ChyronBar.tsx — Lower-third news chyron for the "Seven Cities Burn" BVN-24x7 reel.
 *
 * A navy bar with a mustard accent stripe that slides up from the bottom of
 * the frame using a spring animation. Displays location text on the left
 * and a timestamp on the right.
 *
 * Orientation-aware: positions at 8% from bottom in vertical (9:16) and
 * 6% in landscape (16:9) via useVideoConfig().
 *
 * Once entered, the chyron stays visible for the remainder of the reel.
 *
 * @example
 *   <ChyronBar
 *     text="LAKSHMANPUR — MARKETPLACE DISTRICT"
 *     timestamp="19:47 IST"
 *     enterFrame={95}
 *   />
 */

import React from "react";
import { AbsoluteFill, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { C, FONT, TEXT_SHADOW } from "./constants";

// ─── Props ───────────────────────────────────────────────────────────────────
interface ChyronBarProps {
  /** Primary chyron text, e.g. "LAKSHMANPUR — MARKETPLACE DISTRICT". */
  text: string;
  /** Optional timestamp label, e.g. "19:47 IST". */
  timestamp?: string;
  /** Absolute frame number at which the chyron enters. */
  enterFrame: number;
}

// ─── Constants ───────────────────────────────────────────────────────────────
const BAR_HEIGHT = 60;
const ACCENT_HEIGHT = 4;

// ─── Component ───────────────────────────────────────────────────────────────
export const ChyronBar: React.FC<ChyronBarProps> = ({
  text,
  timestamp,
  enterFrame,
}) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();

  // Not yet time to enter — render nothing.
  if (frame < enterFrame) return null;

  const localFrame = frame - enterFrame;

  // Detect orientation: vertical when height exceeds width.
  const isVertical = height > width;
  const bottomOffset = isVertical ? 0.08 : 0.06;

  // Spring-driven slide-up: 0 → 1 over ~15 frames.
  const slideProgress = spring({
    frame: localFrame,
    fps,
    config: { stiffness: 120, damping: 20 },
  });

  // Translate from fully off-screen (BAR_HEIGHT + ACCENT_HEIGHT) to resting position.
  const translateY = (1 - slideProgress) * (BAR_HEIGHT + ACCENT_HEIGHT);

  return (
    <AbsoluteFill style={{ zIndex: 50, pointerEvents: "none" }}>
      <div
        style={{
          position: "absolute",
          bottom: height * bottomOffset,
          left: 0,
          width: "100%",
          transform: `translateY(${translateY}px)`,
        }}
      >
        {/* Mustard accent stripe — top edge */}
        <div
          style={{
            width: "100%",
            height: ACCENT_HEIGHT,
            backgroundColor: C.mustard,
          }}
        />

        {/* Navy bar body */}
        <div
          style={{
            width: "100%",
            height: BAR_HEIGHT,
            backgroundColor: C.navy,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "0 24px",
            boxSizing: "border-box",
          }}
        >
          {/* Left: location / headline text */}
          <span
            style={{
              fontFamily: FONT.mono,
              fontSize: 14,
              color: C.cream,
              letterSpacing: "0.05em",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
              textShadow: TEXT_SHADOW,
            }}
          >
            {text}
          </span>

          {/* Right: timestamp */}
          {timestamp && (
            <span
              style={{
                fontFamily: FONT.mono,
                fontSize: 12,
                color: C.cream,
                opacity: 0.85,
                letterSpacing: "0.04em",
                whiteSpace: "nowrap",
                marginLeft: 24,
                textShadow: TEXT_SHADOW,
              }}
            >
              {timestamp}
            </span>
          )}
        </div>
      </div>
    </AbsoluteFill>
  );
};
