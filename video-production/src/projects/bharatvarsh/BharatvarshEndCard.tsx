/**
 * BharatvarshEndCard Component
 * Lead-generation end card with:
 * - Obsidian background with surveillance grid
 * - CTA URL (welcometobharatvarsh.com) in Bebas Neue, Mustard gold
 * - "Read the full story" subtitle
 * - Mustard accent bar at top
 * - Faction glow stripe at bottom with animation
 * - Fade in from black over 500ms
 */

import React from "react";
import {
  AbsoluteFill,
  Img,
  interpolate,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { COLORS, FONTS, TIMING } from "./constants";
import { StoryAngle } from "./types";
import { getFactionColors } from "./utils";

export const BharatvarshEndCard: React.FC<{
  shortTitle: string;
  ctaUrl?: string;
  storyAngle: StoryAngle;
  durationInFrames: number;
}> = ({
  shortTitle,
  ctaUrl = "www.welcometobharatvarsh.com",
  storyAngle,
  durationInFrames,
}) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();

  // Get faction colors
  const factionColors = getFactionColors(storyAngle);

  // Fade in from black (first 500ms / ~15 frames at 30fps)
  const fadeInFrames = 15;
  const fadeOpacity = interpolate(frame, [0, fadeInFrames], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Glow pulse animation for the faction stripe
  const pulseProgress = (frame % (TIMING.gowPulseDuration * 2)) / (TIMING.gowPulseDuration * 2);
  const glowOpacity = 0.5 + Math.sin(pulseProgress * Math.PI) * 0.5;

  return (
    <AbsoluteFill
      style={{
        backgroundColor: COLORS.obsidian,
        opacity: fadeOpacity,
      }}
    >
      {/* Surveillance grid overlay */}
      <AbsoluteFill
        style={{
          backgroundImage: `
            linear-gradient(0deg, transparent 24%, rgba(201, 219, 238, 0.08) 25%, rgba(201, 219, 238, 0.08) 26%, transparent 27%, transparent 74%, rgba(201, 219, 238, 0.08) 75%, rgba(201, 219, 238, 0.08) 76%, transparent 77%, transparent),
            linear-gradient(90deg, transparent 24%, rgba(201, 219, 238, 0.08) 25%, rgba(201, 219, 238, 0.08) 26%, transparent 27%, transparent 74%, rgba(201, 219, 238, 0.08) 75%, rgba(201, 219, 238, 0.08) 76%, transparent 77%, transparent)
          `,
          backgroundSize: "50px 50px",
          pointerEvents: "none",
          zIndex: 5,
        }}
      />

      {/* Vignette overlay */}
      <AbsoluteFill
        style={{
          background:
            "radial-gradient(ellipse at center, transparent 0%, rgba(10, 13, 18, 0.3) 100%)",
          pointerEvents: "none",
          zIndex: 10,
        }}
      />

      {/* Top mustard accent bar */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: "10%",
          right: "10%",
          height: 4,
          backgroundColor: COLORS.mustard,
          boxShadow: `0 0 20px ${COLORS.mustard}`,
          zIndex: 15,
        }}
      />

      {/* Content container */}
      <AbsoluteFill
        style={{
          justifyContent: "center",
          alignItems: "center",
          flexDirection: "column",
          paddingLeft: 40,
          paddingRight: 40,
        }}
      >
        {/* Story title */}
        <div
          style={{
            color: COLORS.textSecondary,
            fontFamily: FONTS.inter,
            fontSize: 18,
            letterSpacing: 1,
            marginBottom: 20,
            opacity: interpolate(frame, [fadeInFrames, fadeInFrames + 15], [0, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            }),
          }}
        >
          {shortTitle}
        </div>

        {/* CTA URL */}
        <div
          style={{
            color: COLORS.mustard,
            fontFamily: FONTS.bebasNeue,
            fontSize: 52,
            letterSpacing: 3,
            textTransform: "uppercase",
            textAlign: "center",
            textShadow: `0 0 20px rgba(241, 194, 50, 0.6)`,
            marginBottom: 30,
            opacity: interpolate(frame, [fadeInFrames + 5, fadeInFrames + 20], [0, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            }),
          }}
        >
          {ctaUrl}
        </div>

        {/* Subtitle */}
        <div
          style={{
            color: COLORS.textSecondary,
            fontFamily: FONTS.inter,
            fontSize: 24,
            letterSpacing: 2,
            textAlign: "center",
            opacity: interpolate(frame, [fadeInFrames + 10, fadeInFrames + 25], [0, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            }),
          }}
        >
          Read the full story
        </div>
      </AbsoluteFill>

      {/* Bharatsena logo watermark — bottom-left */}
      <Img
        src={staticFile("brand/bharatsena-logo.jpeg")}
        style={{
          position: "absolute",
          bottom: 20,
          left: 20,
          width: 48,
          height: 48,
          objectFit: "contain",
          opacity: interpolate(frame, [fadeInFrames + 15, fadeInFrames + 25], [0, 0.5], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          }),
          zIndex: 25,
        }}
      />

      {/* Faction glow stripe at bottom */}
      <AbsoluteFill
        style={{
          bottom: 0,
          left: 0,
          right: 0,
          height: 3,
          backgroundColor: factionColors.primary,
          boxShadow: `0 0 25px ${factionColors.primary}, 0 0 40px rgba(${hexToRgb(factionColors.primary)}, ${glowOpacity})`,
          zIndex: 20,
        }}
      />
    </AbsoluteFill>
  );
};

/**
 * Helper function to convert hex color to RGB for CSS
 */
function hexToRgb(hex: string): string {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (result) {
    return `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}`;
  }
  return "241, 194, 50";
}
