/**
 * AIUIntroSting — Branded 3-second channel intro.
 *
 * Timeline (90 frames @ 30fps):
 *   0-15   Background fade + decorative line draw
 *  12-30   "AI" / "&" / "U" spring in staggered
 *  25-45   Tagline word-by-word fade-up
 *  30-75   Progress bar fill
 *  20-90   Ambient floating particles
 *  75-90   Whole-scene breath pulse
 */
import React, { useMemo } from "react";
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  spring,
  interpolate,
} from "remotion";
import { loadFont as loadSpaceGrotesk } from "@remotion/google-fonts/SpaceGrotesk";
import { loadFont as loadInter } from "@remotion/google-fonts/Inter";
import {
  AIU_COLORS,
  SPRING_CONFIG,
  SPRING_BOUNCY,
} from "../aiu-legacy-constants";

const { fontFamily: spaceGrotesk } = loadSpaceGrotesk();
const { fontFamily: inter } = loadInter();

/* ---------- helpers ---------- */

/** Deterministic pseudo-random from a seed integer */
const seededRandom = (seed: number): number => {
  const x = Math.sin(seed * 9301 + 49297) * 49297;
  return x - Math.floor(x);
};

/* ---------- sub-components ---------- */

interface ParticleProps {
  index: number;
  frame: number;
}

const AmbientParticle: React.FC<ParticleProps> = ({ index, frame }) => {
  const r = (n: number) => seededRandom(index * 100 + n);
  const size = 3 + r(1) * 3; // 3-6 px
  const startX = 80 + r(2) * 1760;
  const startY = 80 + r(3) * 920;
  const phase = r(4) * Math.PI * 2;
  const ampX = 8 + r(5) * 20;
  const ampY = 6 + r(6) * 14;
  const speed = 0.03 + r(7) * 0.03;

  const colors = [AIU_COLORS.amber, AIU_COLORS.softCoral, AIU_COLORS.mist];
  const color = colors[index % colors.length];

  const appearOpacity = interpolate(frame, [20, 35], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const x = startX + Math.sin(frame * speed + phase) * ampX;
  const y = startY + Math.cos(frame * speed * 0.7 + phase) * ampY;

  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        width: size,
        height: size,
        borderRadius: "50%",
        backgroundColor: color,
        opacity: appearOpacity * (0.35 + r(8) * 0.25),
      }}
    />
  );
};

/* ---------- decorative lines ---------- */

interface DecorativeLineProps {
  frame: number;
  fromTop: boolean;
  index: number; // 0, 1, 2
}

const DecorativeLine: React.FC<DecorativeLineProps> = ({
  frame,
  fromTop,
  index,
}) => {
  // Each line starts from an edge and draws toward center
  const totalLength = 500 + index * 60;
  const progress = interpolate(frame, [0, 15], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const dashOffset = totalLength * (1 - progress);

  const xOffset = 300 + index * 450;
  const y1 = fromTop ? 0 : 1080;
  const y2 = fromTop ? 480 + index * 30 : 600 - index * 30;

  return (
    <svg
      style={{ position: "absolute", left: 0, top: 0, width: 1920, height: 1080 }}
    >
      <line
        x1={xOffset}
        y1={y1}
        x2={xOffset + (index - 1) * 40}
        y2={y2}
        stroke={AIU_COLORS.amber}
        strokeWidth={1.5}
        strokeOpacity={0.25}
        strokeDasharray={totalLength}
        strokeDashoffset={dashOffset}
      />
    </svg>
  );
};

/* ---------- main component ---------- */

export const AIUIntroSting: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Background fade
  const bgOpacity = interpolate(frame, [0, 10], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // "AI" springs in from left (frame 12)
  const aiSpring = spring({
    frame: Math.max(0, frame - 12),
    fps,
    config: SPRING_CONFIG,
  });
  const aiX = interpolate(aiSpring, [0, 1], [-200, 0]);

  // "&" springs in from below (frame 17)
  const ampSpring = spring({
    frame: Math.max(0, frame - 17),
    fps,
    config: SPRING_BOUNCY,
  });
  const ampY = interpolate(ampSpring, [0, 1], [120, 0]);

  // "U" springs in from right (frame 22)
  const uSpring = spring({
    frame: Math.max(0, frame - 22),
    fps,
    config: SPRING_CONFIG,
  });
  const uX = interpolate(uSpring, [0, 1], [200, 0]);

  // Tagline word-by-word
  const taglineWords = ["Practical", "GenAI", "for", "Real", "People"];

  // Progress bar
  const barProgress = interpolate(frame, [30, 75], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  // Snap easing: fast middle, decelerate at end
  const barWidth = (1920 - 160) * Math.pow(barProgress, 0.6);

  // Breath pulse (frames 75-90)
  const breathScale = interpolate(
    frame,
    [75, 82, 90],
    [1.0, 1.005, 1.0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );

  // Particle count
  const particles = useMemo(() => Array.from({ length: 10 }, (_, i) => i), []);

  return (
    <AbsoluteFill
      style={{
        backgroundColor: AIU_COLORS.warmIvory,
        opacity: bgOpacity,
        transform: `scale(${breathScale})`,
      }}
    >
      {/* Decorative lines — 3 from top, 3 from bottom */}
      {[0, 1, 2].map((i) => (
        <DecorativeLine key={`top-${i}`} frame={frame} fromTop index={i} />
      ))}
      {[0, 1, 2].map((i) => (
        <DecorativeLine key={`bot-${i}`} frame={frame} fromTop={false} index={i} />
      ))}

      {/* Logo text: "AI & U" */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 60,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 16,
        }}
      >
        {/* AI */}
        <span
          style={{
            fontFamily: spaceGrotesk,
            fontWeight: 700,
            fontSize: 120,
            color: AIU_COLORS.amber,
            transform: `translateX(${aiX}px)`,
            opacity: aiSpring,
            letterSpacing: -2,
          }}
        >
          AI
        </span>

        {/* & */}
        <span
          style={{
            fontFamily: spaceGrotesk,
            fontWeight: 700,
            fontSize: 150,
            color: AIU_COLORS.signalGreen,
            transform: `translateY(${ampY}px)`,
            opacity: ampSpring,
            lineHeight: 1,
            marginTop: -10,
          }}
        >
          &
        </span>

        {/* U */}
        <span
          style={{
            fontFamily: spaceGrotesk,
            fontWeight: 700,
            fontSize: 120,
            color: AIU_COLORS.steelIndigo,
            transform: `translateX(${uX}px)`,
            opacity: uSpring,
            letterSpacing: -2,
          }}
        >
          U
        </span>
      </div>

      {/* Tagline */}
      <div
        style={{
          position: "absolute",
          top: "50%",
          left: 0,
          right: 0,
          marginTop: 60,
          display: "flex",
          justifyContent: "center",
          gap: 10,
        }}
      >
        {taglineWords.map((word, i) => {
          const wordDelay = 25 + i * 3;
          const wordOpacity = interpolate(
            frame,
            [wordDelay, wordDelay + 8],
            [0, 1],
            { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
          );
          const wordY = interpolate(
            frame,
            [wordDelay, wordDelay + 8],
            [12, 0],
            { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
          );

          return (
            <span
              key={word + i}
              style={{
                fontFamily: inter,
                fontWeight: 400,
                fontSize: 32,
                color: AIU_COLORS.slate,
                opacity: wordOpacity,
                transform: `translateY(${wordY}px)`,
              }}
            >
              {word}
            </span>
          );
        })}
      </div>

      {/* Progress bar */}
      <div
        style={{
          position: "absolute",
          top: 1000,
          left: 80,
          right: 80,
          height: 4,
          backgroundColor: AIU_COLORS.mist,
          borderRadius: 2,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            width: barWidth,
            height: "100%",
            backgroundColor: AIU_COLORS.amber,
            borderRadius: 2,
          }}
        />
      </div>

      {/* Ambient particles */}
      {particles.map((i) => (
        <AmbientParticle key={i} index={i} frame={frame} />
      ))}
    </AbsoluteFill>
  );
};
