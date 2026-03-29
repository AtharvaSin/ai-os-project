/**
 * ScrollingTicker.tsx — Bottom ticker bar for the "Seven Cities Burn" BVN-24x7 reel.
 *
 * A full-width navy bar at the absolute bottom of the frame that slides up
 * at the specified enter frame and displays a continuously scrolling marquee
 * of breaking news headlines.
 *
 * The ticker text is rendered 3x to create a seamless loop effect.
 * Scroll speed: 1.5px per frame (moves left).
 *
 * Enters during Scene 4 (frame 170) and remains visible through the end
 * of the reel.
 *
 * @example
 *   <ScrollingTicker enterFrame={170} />
 */

import React from "react";
import { AbsoluteFill, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { C, FONT, TEXT_SHADOW } from "./constants";

// ─── Props ───────────────────────────────────────────────────────────────────
interface ScrollingTickerProps {
  /** Absolute frame at which the ticker slides into view. */
  enterFrame: number;
}

// ─── Constants ───────────────────────────────────────────────────────────────
const BAR_HEIGHT = 40;
const SCROLL_SPEED = 1.5; // pixels per frame
const TICKER_TEXT =
  "COORDINATED DETONATIONS CONFIRMED \u00B7 SEVEN CITIES \u00B7 HUNDREDS FEARED DEAD \u00B7 DIRECTORATE MOBILISING RESPONSE \u00B7 MESH COVERAGE 100% \u00B7 ALL SYSTEMS NOMINAL";
const SEPARATOR = "     \u00B7     ";

// Build the triple-repeated string for seamless looping.
const FULL_TICKER = `${TICKER_TEXT}${SEPARATOR}${TICKER_TEXT}${SEPARATOR}${TICKER_TEXT}${SEPARATOR}`;

// ─── Component ───────────────────────────────────────────────────────────────
export const ScrollingTicker: React.FC<ScrollingTickerProps> = ({
  enterFrame,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Not yet time to enter.
  if (frame < enterFrame) return null;

  const localFrame = frame - enterFrame;

  // Spring-driven slide-up for the bar itself.
  const slideProgress = spring({
    frame: localFrame,
    fps,
    config: { stiffness: 120, damping: 20 },
  });

  // Bar starts below the viewport and slides up to resting position.
  const barTranslateY = (1 - slideProgress) * BAR_HEIGHT;

  // Scrolling offset — moves left continuously.
  const scrollOffset = localFrame * SCROLL_SPEED;

  return (
    <AbsoluteFill style={{ zIndex: 55, pointerEvents: "none" }}>
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          width: "100%",
          height: BAR_HEIGHT,
          backgroundColor: C.navy,
          transform: `translateY(${barTranslateY}px)`,
          overflow: "hidden",
          display: "flex",
          alignItems: "center",
        }}
      >
        {/* Scrolling text container */}
        <div
          style={{
            whiteSpace: "nowrap",
            transform: `translateX(-${scrollOffset}px)`,
            fontFamily: FONT.mono,
            fontSize: 11,
            color: C.cream,
            letterSpacing: "0.04em",
            textShadow: TEXT_SHADOW,
          }}
        >
          {FULL_TICKER}
        </div>
      </div>
    </AbsoluteFill>
  );
};
