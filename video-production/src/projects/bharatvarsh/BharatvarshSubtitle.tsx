/**
 * BharatvarshSubtitle Component
 * Branded text overlay with:
 * - Bebas Neue for short phrases (≤3 words)
 * - Crimson Pro for longer narrative text
 * - Mustard gold accent line above
 * - Bottom gradient bar with obsidian glow
 * - Spring animation entrance (slower, more cinematic)
 */

import React from "react";
import {
  AbsoluteFill,
  spring,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
} from "remotion";
import { COLORS, FONTS } from "./constants";

export const BharatvarshSubtitle: React.FC<{
  text: string;
}> = ({ text }) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();

  // Spring animation with slower damping for cinematic feel
  const enter = spring({
    frame,
    fps,
    config: {
      damping: 150, // Slower than default (200)
      mass: 1,
      stiffness: 100,
    },
    durationInFrames: 8,
  });

  // Determine font based on word count
  const wordCount = text.split(" ").length;
  const isShortPhrase = wordCount <= 3;
  const fontFamily = isShortPhrase ? FONTS.bebasNeue : FONTS.crimsonPro;
  const fontSize = isShortPhrase ? 72 : 56;
  const letterSpacing = isShortPhrase ? 3 : 1;

  // Calculate opacity and transform
  const opacity = interpolate(enter, [0, 1], [0, 1]);
  const translateY = interpolate(enter, [0, 1], [30, 0]);
  const scale = interpolate(enter, [0, 1], [0.9, 1]);

  return (
    <AbsoluteFill>
      {/* Bottom gradient bar */}
      <AbsoluteFill
        style={{
          bottom: 0,
          left: 0,
          right: 0,
          height: "35%",
          background:
            "linear-gradient(to bottom, transparent 0%, rgba(10, 13, 18, 0.5) 50%, rgba(10, 13, 18, 0.9) 100%)",
          pointerEvents: "none",
          zIndex: 14,
        }}
      />

      {/* Mustard accent line above text */}
      <AbsoluteFill
        style={{
          bottom: "36%",
          left: "50%",
          transform: "translateX(-50%)",
          width: "60%",
          height: 2,
          backgroundColor: COLORS.mustard,
          boxShadow: `0 0 15px rgba(241, 194, 50, 0.5)`,
          zIndex: 13,
        }}
      />

      {/* Text container */}
      <AbsoluteFill
        style={{
          justifyContent: "flex-end",
          alignItems: "center",
          paddingBottom: 80,
          paddingLeft: 40,
          paddingRight: 40,
        }}
      >
        <div
          style={{
            fontSize,
            color: COLORS.textPrimary,
            fontFamily,
            letterSpacing,
            textShadow: `0 2px 20px rgba(10, 13, 18, 0.9)`,
            textAlign: "center",
            maxWidth: width * 0.85,
            opacity,
            transform: `translateY(${translateY}px) scale(${scale})`,
            transition: "none",
            textTransform: isShortPhrase ? "uppercase" : "none",
            lineHeight: 1.4,
            wordBreak: "break-word",
          }}
        >
          {text}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
