/**
 * WarRoomOverlay.tsx — Scene 4 console panel overlay for the "Seven Cities Burn" reel.
 *
 * THE CENTREPIECE OF THE ENTIRE REEL.
 *
 * Renders seven city monitoring console panels over the war room image.
 * Each panel displays a city name and a status readout.
 *
 * The horror moment: panels flash red one by one at 12-frame intervals
 * starting at frame 262, but every single status readout reads
 * "ANOMALY: NONE" in glowing green. The dissonance between the screaming
 * red backgrounds and the calm green "NONE" is the key visual.
 *
 * Layout adapts to orientation:
 *   - Vertical (9:16): 4 top + 3 bottom row, upper 60% of frame.
 *   - Landscape (16:9): 7 across in a single row, upper 40% of frame.
 *
 * Animation timeline (absolute frames, 12-frame intervals starting at 262):
 *   262  Bhojpal flash
 *   274  Mysuru flash
 *   286  Gopakapattana flash
 *   298  Jammu flash
 *   310  Kathmandu flash
 *   322  Kolkata flash
 *   334  Lakshmanpur flash
 *   340–360  All seven pulsing red. All seven reading NONE in green. Hold.
 */

import React, { useMemo } from "react";
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { C, CITIES, FONT, TEXT_SHADOW } from "./constants";

// ─── Flash trigger frames (12 apart, starting at 262) ───────────────────────
const FLASH_TRIGGERS: readonly number[] = [262, 274, 286, 298, 310, 322, 334];

// ─── Panel dimensions per orientation ────────────────────────────────────────
interface PanelDimensions {
  w: number;
  h: number;
}

const PANEL_VERTICAL: PanelDimensions = { w: 120, h: 80 };
const PANEL_LANDSCAPE: PanelDimensions = { w: 200, h: 100 };

// ─── Single console panel ────────────────────────────────────────────────────
interface ConsolePanelProps {
  /** City name label. */
  cityName: string;
  /** Absolute frame at which this panel's red flash begins. */
  triggerFrame: number;
  /** Panel pixel width. */
  panelW: number;
  /** Panel pixel height. */
  panelH: number;
}

const ConsolePanel: React.FC<ConsolePanelProps> = ({
  cityName,
  triggerFrame,
  panelW,
  panelH,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const hasTriggered = frame >= triggerFrame;
  const localFrame = hasTriggered ? frame - triggerFrame : 0;

  // ── Red flash opacity ──────────────────────────────────────────────────
  // Initial burst: spring from 0 → 0.6, then settle.
  // After settling, a subtle sin-wave pulse holds at ~0.2 +/- 0.05.
  let redOpacity = 0;
  if (hasTriggered) {
    const springVal = spring({
      frame: localFrame,
      fps,
      config: { stiffness: 150, damping: 14 },
    });
    // Spring drives 0 → 0.6 initially, then decays toward 0.
    // We want it to settle at 0.2 with a subtle pulse.
    const burstOpacity = springVal * 0.6;
    const settledOpacity = 0.2 + Math.sin(frame * 0.4) * 0.05;

    // Crossfade from burst to settled over ~15 frames after trigger.
    const blendFactor = Math.min(localFrame / 15, 1);
    redOpacity = burstOpacity * (1 - blendFactor) + settledOpacity * blendFactor;
  }

  // ── Status text ────────────────────────────────────────────────────────
  const statusText = hasTriggered ? "ANOMALY: NONE" : "NOMINAL";
  const statusColor = C.green; // ALWAYS green. That is the horror.

  // Font sizes scale with panel size.
  const nameFontSize = panelW <= 140 ? 9 : 11;
  const statusFontSize = panelW <= 140 ? 10 : 12;

  return (
    <div
      style={{
        width: panelW,
        height: panelH,
        backgroundColor: `rgba(13, 27, 42, 0.85)`,
        border: `1px solid ${hasTriggered ? C.red : C.textMuted}`,
        borderRadius: 4,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
        overflow: "hidden",
        gap: 6,
      }}
    >
      {/* Red flash overlay */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundColor: C.red,
          opacity: redOpacity,
          borderRadius: 3,
          pointerEvents: "none",
        }}
      />

      {/* City name label */}
      <span
        style={{
          fontFamily: FONT.mono,
          fontSize: nameFontSize,
          color: C.cream,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          textShadow: TEXT_SHADOW,
          position: "relative",
          zIndex: 1,
        }}
      >
        {cityName}
      </span>

      {/* Status readout — ALWAYS GREEN */}
      <span
        style={{
          fontFamily: FONT.mono,
          fontSize: statusFontSize,
          fontWeight: 700,
          color: statusColor,
          textShadow: `0 0 8px ${C.green}, ${TEXT_SHADOW}`,
          letterSpacing: "0.06em",
          position: "relative",
          zIndex: 1,
        }}
      >
        {statusText}
      </span>
    </div>
  );
};

// ─── Main overlay component ──────────────────────────────────────────────────
// ─── Header bar fade-in frame (3 frames into Scene 4) ───────────────────────
const HEADER_ENTER_FRAME = 250;
const HEADER_HEIGHT = 50;

export const WarRoomOverlay: React.FC = () => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const isVertical = height > width;

  // Header bar fade-in: 0 → 1 over 10 frames starting at frame 250.
  const headerOpacity = interpolate(
    frame,
    [HEADER_ENTER_FRAME, HEADER_ENTER_FRAME + 10],
    [0, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );

  // Determine panel dimensions based on orientation.
  const panelDims = isVertical ? PANEL_VERTICAL : PANEL_LANDSCAPE;

  // Compute grid layout positions.
  const panelPositions = useMemo(() => {
    if (isVertical) {
      // Vertical (9:16): 4 top row + 3 bottom row, centred in upper 60%.
      const gap = 12;
      const topRowCount = 4;
      const bottomRowCount = 3;
      const topRowWidth = topRowCount * panelDims.w + (topRowCount - 1) * gap;
      const bottomRowWidth = bottomRowCount * panelDims.w + (bottomRowCount - 1) * gap;
      const topRowStartX = (width - topRowWidth) / 2;
      const bottomRowStartX = (width - bottomRowWidth) / 2;
      const regionTop = height * 0.15;
      const rowGap = panelDims.h + 20;

      const positions: Array<{ left: number; top: number }> = [];

      // Top row: first 4 cities
      for (let i = 0; i < topRowCount; i++) {
        positions.push({
          left: topRowStartX + i * (panelDims.w + gap),
          top: regionTop,
        });
      }

      // Bottom row: last 3 cities
      for (let i = 0; i < bottomRowCount; i++) {
        positions.push({
          left: bottomRowStartX + i * (panelDims.w + gap),
          top: regionTop + rowGap,
        });
      }

      return positions;
    } else {
      // Landscape (16:9): 7 across in a single row, upper 40%.
      const gap = 16;
      const totalWidth = 7 * panelDims.w + 6 * gap;
      const startX = (width - totalWidth) / 2;
      const topY = height * 0.15;

      return CITIES.map((_, i) => ({
        left: startX + i * (panelDims.w + gap),
        top: topY,
      }));
    }
  }, [isVertical, width, height, panelDims.w, panelDims.h]);

  return (
    <AbsoluteFill style={{ zIndex: 30, pointerEvents: "none" }}>
      {/* Header bar — MESH CENTRAL COMMAND */}
      <div
        style={{
          position: "absolute",
          top: height * 0.1,
          left: 0,
          width: "100%",
          height: HEADER_HEIGHT,
          backgroundColor: "rgba(13, 27, 42, 0.9)",
          borderBottom: `2px solid ${C.mustard}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          opacity: headerOpacity,
        }}
      >
        <span
          style={{
            fontFamily: FONT.mono,
            fontSize: 12,
            lineHeight: "14px",
            color: C.cream,
            letterSpacing: "0.1em",
            textShadow: TEXT_SHADOW,
          }}
        >
          MESH CENTRAL COMMAND — NATIONAL GRID STATUS
        </span>
      </div>

      {CITIES.map((city, i) => (
        <div
          key={city.name}
          style={{
            position: "absolute",
            left: panelPositions[i].left,
            top: panelPositions[i].top,
          }}
        >
          <ConsolePanel
            cityName={city.name}
            triggerFrame={FLASH_TRIGGERS[i]}
            panelW={panelDims.w}
            panelH={panelDims.h}
          />
        </div>
      ))}
    </AbsoluteFill>
  );
};
