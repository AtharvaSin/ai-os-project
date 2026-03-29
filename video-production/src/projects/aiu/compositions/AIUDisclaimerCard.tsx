/**
 * AIUDisclaimerCard — "Before We Begin" card with 3 disclaimer bullets.
 *
 * Timeline (210 frames @ 30fps):
 *    0-10   Background fade
 *    8-30   Card springs up from below
 *   15-35   Amber left border draws top-to-bottom
 *   30-50   Title springs in (scale + opacity)
 *   40-50   Divider line draws left-to-right
 *   50-90   3 bullet items stagger in (12 frames apart)
 *   90-180  Breathing + amber dot pulse
 *  180-210  Gentle opacity fade to 95%
 */
import React from "react";
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  spring,
  interpolate,
} from "remotion";
import { loadFont as loadSpaceGrotesk } from "@remotion/google-fonts/SpaceGrotesk";
import { loadFont as loadInter } from "@remotion/google-fonts/Inter";
import { AIU_COLORS, SPRING_CONFIG } from "../aiu-legacy-constants";

const { fontFamily: spaceGrotesk } = loadSpaceGrotesk();
const { fontFamily: inter } = loadInter();

/* ---------- data ---------- */

const BULLETS = [
  "AI is evolving rapidly \u2014 frameworks matter more than specific tools",
  "This is an iterative process, not a silver bullet",
  "Combine theory with hands-on practice for best results",
];

/* ---------- layout constants ---------- */

const CARD_W = 900;
const CARD_H = 420;
const CARD_X = (1920 - CARD_W) / 2;
const CARD_Y_CENTER = (1080 - CARD_H) / 2;
const PAD_X = 56;
const PAD_Y = 48;
const BORDER_W = 3;
const CORNER_R = 12;
const INTERIOR_W = CARD_W - PAD_X * 2;

/* ---------- sub-components ---------- */

interface BulletItemProps {
  text: string;
  index: number;
  frame: number;
  fps: number;
}

const BulletItem: React.FC<BulletItemProps> = ({ text, index, frame, fps }) => {
  const delay = 50 + index * 12;
  const yOffset = 24 + 16 + 24 + index * 40; // below divider + gap + stacking

  // Dot scales in with spring
  const dotSpring = spring({
    frame: Math.max(0, frame - delay),
    fps,
    config: SPRING_CONFIG,
  });

  // Text fades from right
  const textDelay = delay + 4;
  const textOpacity = interpolate(frame, [textDelay, textDelay + 10], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const textX = interpolate(frame, [textDelay, textDelay + 10], [20, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Idle dot pulse (frames 90-180)
  const dotPulse =
    frame >= 90 && frame <= 180
      ? 0.85 + 0.15 * (0.5 + 0.5 * Math.sin(frame * 0.08 + index * 1.2))
      : 1;

  return (
    <div
      style={{
        position: "absolute",
        left: PAD_X,
        top: PAD_Y + yOffset,
        display: "flex",
        alignItems: "center",
        gap: 20,
      }}
    >
      {/* Amber dot */}
      <div
        style={{
          width: 10,
          height: 10,
          borderRadius: "50%",
          backgroundColor: AIU_COLORS.amber,
          flexShrink: 0,
          transform: `scale(${dotSpring})`,
          opacity: dotPulse,
        }}
      />

      {/* Text */}
      <span
        style={{
          fontFamily: inter,
          fontWeight: 400,
          fontSize: 22,
          color: AIU_COLORS.inkBlack,
          lineHeight: 1.4,
          opacity: textOpacity,
          transform: `translateX(${textX}px)`,
          maxWidth: INTERIOR_W - 30,
        }}
      >
        {text}
      </span>
    </div>
  );
};

/* ---------- main component ---------- */

export const AIUDisclaimerCard: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Background fade
  const bgOpacity = interpolate(frame, [0, 10], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Card springs up from y=1200 to center
  const cardSpring = spring({
    frame: Math.max(0, frame - 8),
    fps,
    config: { damping: 12, stiffness: 90, mass: 0.8 },
  });
  const cardY = interpolate(cardSpring, [0, 1], [1200, CARD_Y_CENTER]);

  // Breathing (frames 90-180): gentle Y oscillation
  const breathY =
    frame >= 90 && frame <= 180
      ? Math.sin(frame * 0.04) * 1.5
      : 0;

  // End fade (frames 180-210)
  const endOpacity = interpolate(frame, [180, 210], [1, 0.95], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Amber left border draws (frames 15-35)
  const borderHeight = interpolate(frame, [15, 35], [0, CARD_H], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Title spring (frames 30-50)
  const titleSpring = spring({
    frame: Math.max(0, frame - 30),
    fps,
    config: SPRING_CONFIG,
  });
  const titleScale = interpolate(titleSpring, [0, 1], [0.8, 1]);

  // Divider draws (frames 40-50)
  const dividerProgress = interpolate(frame, [40, 50], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: AIU_COLORS.warmIvory,
        opacity: bgOpacity,
      }}
    >
      {/* Card container */}
      <div
        style={{
          position: "absolute",
          left: CARD_X,
          top: cardY + breathY,
          width: CARD_W,
          height: CARD_H,
          opacity: endOpacity,
        }}
      >
        {/* Shadow */}
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 4,
            width: CARD_W,
            height: CARD_H,
            borderRadius: CORNER_R,
            backgroundColor: "rgba(0,0,0,0.06)",
            filter: "blur(8px)",
          }}
        />

        {/* Card body */}
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            width: CARD_W,
            height: CARD_H,
            borderRadius: CORNER_R,
            backgroundColor: AIU_COLORS.cloudWhite,
            overflow: "hidden",
          }}
        >
          {/* Amber left border (drawing animation) */}
          <div
            style={{
              position: "absolute",
              left: 0,
              top: 0,
              width: BORDER_W,
              height: borderHeight,
              backgroundColor: AIU_COLORS.amber,
              borderRadius: `${CORNER_R}px 0 0 ${borderHeight >= CARD_H ? CORNER_R : 0}px`,
            }}
          />

          {/* Title */}
          <div
            style={{
              position: "absolute",
              left: PAD_X,
              top: PAD_Y,
              transform: `scale(${titleScale})`,
              opacity: titleSpring,
              transformOrigin: "left center",
            }}
          >
            <span
              style={{
                fontFamily: spaceGrotesk,
                fontWeight: 700,
                fontSize: 36,
                color: AIU_COLORS.inkBlack,
              }}
            >
              Before We Begin
            </span>
          </div>

          {/* Divider line (SVG draw) */}
          <svg
            style={{
              position: "absolute",
              left: PAD_X,
              top: PAD_Y + 48 + 16,
              width: INTERIOR_W,
              height: 2,
            }}
          >
            <line
              x1={0}
              y1={1}
              x2={INTERIOR_W}
              y2={1}
              stroke={AIU_COLORS.mist}
              strokeWidth={1.5}
              strokeDasharray={INTERIOR_W}
              strokeDashoffset={INTERIOR_W * (1 - dividerProgress)}
            />
          </svg>

          {/* Bullets */}
          {BULLETS.map((text, i) => (
            <BulletItem
              key={i}
              text={text}
              index={i}
              frame={frame}
              fps={fps}
            />
          ))}
        </div>
      </div>
    </AbsoluteFill>
  );
};
