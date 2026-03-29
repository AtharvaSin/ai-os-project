/**
 * AIULowerThird — Name/title overlay card for face cam.
 *
 * Timeline (180 frames @ 30fps):
 *    0-20   Card springs in from off-screen left
 *   15-25   Amber left border draws top-to-bottom
 *   20-45   "Atharva Singh" types letter-by-letter
 *   35-55   Subtitle fades in
 *   55-120  Idle float (gentle Y oscillation)
 *  120-150  Card slides out to left
 *  150-180  Empty / transparent
 *
 * Background is FULLY TRANSPARENT for overlay compositing.
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
import { AIU_COLORS } from "../aiu-legacy-constants";

const { fontFamily: spaceGrotesk } = loadSpaceGrotesk();
const { fontFamily: inter } = loadInter();

/* ---------- constants ---------- */

const CARD_W = 500;
const CARD_H = 100;
const CARD_X = 60;
const CARD_Y = 880;
const BORDER_WIDTH = 4;
const CORNER_RADIUS = 12;

const NAME = "Atharva Singh";
const SUBTITLE = "AI & Cloud Product Leader";

/* ---------- component ---------- */

export const AIULowerThird: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  /* --- Card entrance (spring from x=-500 to x=CARD_X) --- */
  const entranceSpring = spring({
    frame,
    fps,
    config: { damping: 10, stiffness: 80, mass: 0.8 },
  });
  const entranceX = interpolate(entranceSpring, [0, 1], [-500, CARD_X]);

  /* --- Card exit (frames 120-150, ease to x=-500) --- */
  const exitProgress = interpolate(frame, [120, 150], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  // Ease-in curve for exit
  const exitEased = exitProgress * exitProgress;
  const exitX = interpolate(exitEased, [0, 1], [0, -(CARD_X + 500)]);

  /* --- Idle float (frames 55-120) --- */
  const idleFloat =
    frame >= 55 && frame <= 120
      ? Math.sin(frame * 0.05) * 2
      : 0;

  /* --- Combined card position --- */
  const cardX = frame < 120 ? entranceX : entranceX + exitX;
  const cardY = CARD_Y + idleFloat;

  /* --- Hide card after frame 150 --- */
  const cardOpacity = frame > 150 ? 0 : 1;

  /* --- Amber left border height draw (frames 15-25) --- */
  const borderHeight = interpolate(frame, [15, 25], [0, CARD_H], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  /* --- Name typewriter (frames 20-45, 2 frames per letter) --- */
  const nameChars = frame >= 20 ? Math.min(
    Math.floor((frame - 20) / 2) + 1,
    NAME.length,
  ) : 0;
  const displayedName = NAME.slice(0, nameChars);

  /* --- Subtitle fade (frames 35-55) --- */
  const subtitleOpacity = interpolate(frame, [35, 50], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{ background: "transparent" }}>
      <div
        style={{
          position: "absolute",
          left: cardX,
          top: cardY,
          width: CARD_W,
          height: CARD_H,
          opacity: cardOpacity,
        }}
      >
        {/* Shadow layer */}
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 2,
            width: CARD_W,
            height: CARD_H,
            borderRadius: CORNER_RADIUS,
            backgroundColor: "rgba(0,0,0,0.08)",
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
            borderRadius: CORNER_RADIUS,
            backgroundColor: AIU_COLORS.cloudWhite,
            overflow: "hidden",
          }}
        >
          {/* Amber left border (draws top-to-bottom) */}
          <div
            style={{
              position: "absolute",
              left: 0,
              top: 0,
              width: BORDER_WIDTH,
              height: borderHeight,
              backgroundColor: AIU_COLORS.amber,
              borderRadius: `${CORNER_RADIUS}px 0 0 ${borderHeight >= CARD_H ? CORNER_RADIUS : 0}px`,
            }}
          />

          {/* Text content */}
          <div
            style={{
              position: "absolute",
              left: BORDER_WIDTH + 20,
              top: 0,
              bottom: 0,
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
            }}
          >
            {/* Name */}
            <div
              style={{
                fontFamily: spaceGrotesk,
                fontWeight: 700,
                fontSize: 26,
                color: AIU_COLORS.inkBlack,
                lineHeight: 1.2,
                whiteSpace: "pre",
              }}
            >
              {displayedName}
              {/* Blinking cursor during typing */}
              {nameChars < NAME.length && (
                <span
                  style={{
                    opacity: Math.sin(frame * 0.4) > 0 ? 1 : 0,
                    color: AIU_COLORS.amber,
                    fontWeight: 300,
                  }}
                >
                  |
                </span>
              )}
            </div>

            {/* Subtitle */}
            <div
              style={{
                fontFamily: inter,
                fontWeight: 400,
                fontSize: 16,
                color: AIU_COLORS.slate,
                opacity: subtitleOpacity,
                marginTop: 4,
              }}
            >
              {SUBTITLE}
            </div>
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
