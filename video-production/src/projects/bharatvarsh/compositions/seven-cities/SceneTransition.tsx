/**
 * SceneTransition.tsx — Quick black-dip transition between scenes.
 *
 * Renders a full-screen black overlay that ramps to 0.8 opacity at the
 * midpoint of the transition window, then fades back to fully transparent.
 *
 * Usage:
 *   <SceneTransition triggerFrame={43} />           // 6-frame default
 *   <SceneTransition triggerFrame={88} duration={8} />
 *
 * zIndex 80 so it sits below the grain/vignette overlays (90/91)
 * but above all scene content.
 */

import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";

// ─── Props ───────────────────────────────────────────────────────────────────
interface SceneTransitionProps {
  /** Frame at which the transition begins. */
  triggerFrame: number;
  /** Total transition length in frames. Defaults to 6. */
  duration?: number;
}

// ─── Component ───────────────────────────────────────────────────────────────
export const SceneTransition: React.FC<SceneTransitionProps> = ({
  triggerFrame,
  duration = 6,
}) => {
  const frame = useCurrentFrame();

  const progress = interpolate(
    frame,
    [triggerFrame, triggerFrame + duration],
    [0, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );

  // Outside the transition window — render nothing.
  if (progress <= 0 || progress >= 1) return null;

  const opacity = interpolate(progress, [0, 0.5, 1], [0, 0.8, 0]);

  return (
    <AbsoluteFill
      style={{
        backgroundColor: "#000",
        opacity,
        zIndex: 80,
        pointerEvents: "none",
      }}
    />
  );
};
