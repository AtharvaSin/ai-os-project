/**
 * AIUVideoRoadmap — "What We'll Cover Today" agenda with vertical timeline.
 *
 * Timeline (300 frames @ 30fps):
 *    0-15   Background fade
 *   10-30   Title springs in from above
 *   20-60   Vertical connecting line draws top-to-bottom
 *   40-100  4 stops spring in with 15-frame stagger
 *   80-120  Sub-labels fade in
 *  100-300  Ambient particles + breathing
 *  250-300  Gentle brightness fade
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
  SPRING_SOFT,
} from "../aiu-legacy-constants";

const { fontFamily: spaceGrotesk } = loadSpaceGrotesk();
const { fontFamily: inter } = loadInter();

/* ---------- data ---------- */

interface RoadmapStop {
  number: string;
  label: string;
  sublabel: string;
}

const STOPS: RoadmapStop[] = [
  { number: "1", label: "General Approach", sublabel: "A framework for anyone" },
  { number: "2", label: "4 Persona Deep-Dives", sublabel: "Tailored to your role" },
  { number: "3", label: "5-Layer Tool Map", sublabel: "From free to enterprise" },
  { number: "4", label: "Top 5 AI Skills", sublabel: "Start building today" },
];

/* ---------- layout constants ---------- */

const TIMELINE_X = 500;
const STOP_Y_START = 250;
const STOP_Y_END = 900;
const STOP_SPACING = (STOP_Y_END - STOP_Y_START) / (STOPS.length - 1);
const CIRCLE_R = 20;

/* ---------- helpers ---------- */

const seededRandom = (seed: number): number => {
  const x = Math.sin(seed * 9301 + 49297) * 49297;
  return x - Math.floor(x);
};

/* ---------- sub-components ---------- */

interface ParticleDotProps {
  index: number;
  frame: number;
}

const ParticleDot: React.FC<ParticleDotProps> = ({ index, frame }) => {
  const r = (n: number) => seededRandom(index * 73 + n);
  const size = 4 + r(1) * 5;
  const startX = r(2) > 0.5 ? 40 + r(3) * 300 : 1580 + r(3) * 300;
  const startY = 100 + r(4) * 880;
  const phase = r(5) * Math.PI * 2;
  const speed = 0.02 + r(6) * 0.02;

  const appearOpacity = interpolate(frame, [100, 120], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const x = startX + Math.sin(frame * speed + phase) * 12;
  const y = startY + Math.cos(frame * speed * 0.6 + phase) * 8;

  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        width: size,
        height: size,
        borderRadius: "50%",
        backgroundColor: AIU_COLORS.amber,
        opacity: appearOpacity * 0.15,
      }}
    />
  );
};

interface TimelineStopProps {
  stop: RoadmapStop;
  index: number;
  frame: number;
  fps: number;
}

const TimelineStop: React.FC<TimelineStopProps> = ({ stop, index, frame, fps }) => {
  const y = STOP_Y_START + index * STOP_SPACING;
  const delay = 40 + index * 15;

  // Circle scales in with spring
  const circleSpring = spring({
    frame: Math.max(0, frame - delay),
    fps,
    config: SPRING_CONFIG,
  });

  // Label fades in from right, 6 frames after circle
  const labelDelay = delay + 6;
  const labelOpacity = interpolate(frame, [labelDelay, labelDelay + 10], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const labelX = interpolate(frame, [labelDelay, labelDelay + 10], [30, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Sub-label fades in (frames 80-120 with per-stop stagger)
  const subDelay = 80 + index * 10;
  const subOpacity = interpolate(frame, [subDelay, subDelay + 12], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <div style={{ position: "absolute", left: 0, top: 0 }}>
      {/* Circle */}
      <div
        style={{
          position: "absolute",
          left: TIMELINE_X - CIRCLE_R,
          top: y - CIRCLE_R,
          width: CIRCLE_R * 2,
          height: CIRCLE_R * 2,
          borderRadius: "50%",
          backgroundColor: AIU_COLORS.amber,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transform: `scale(${circleSpring})`,
          boxShadow: "0 2px 8px rgba(220,141,82,0.25)",
        }}
      >
        <span
          style={{
            fontFamily: spaceGrotesk,
            fontWeight: 700,
            fontSize: 18,
            color: AIU_COLORS.cloudWhite,
            lineHeight: 1,
          }}
        >
          {stop.number}
        </span>
      </div>

      {/* Label */}
      <div
        style={{
          position: "absolute",
          left: TIMELINE_X + CIRCLE_R + 20,
          top: y - 14,
          opacity: labelOpacity,
          transform: `translateX(${labelX}px)`,
        }}
      >
        <div
          style={{
            fontFamily: spaceGrotesk,
            fontWeight: 700,
            fontSize: 30,
            color: AIU_COLORS.inkBlack,
            lineHeight: 1.2,
          }}
        >
          {stop.label}
        </div>

        {/* Sub-label */}
        <div
          style={{
            fontFamily: inter,
            fontWeight: 400,
            fontSize: 18,
            color: AIU_COLORS.slate,
            marginTop: 6,
            opacity: subOpacity,
          }}
        >
          {stop.sublabel}
        </div>
      </div>
    </div>
  );
};

/* ---------- main component ---------- */

export const AIUVideoRoadmap: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Background fade
  const bgOpacity = interpolate(frame, [0, 15], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Title spring from above
  const titleSpring = spring({
    frame: Math.max(0, frame - 10),
    fps,
    config: SPRING_SOFT,
  });
  const titleY = interpolate(titleSpring, [0, 1], [-60, 0]);

  // Vertical connecting line (draws from stop 1 to stop 4)
  const lineTop = STOP_Y_START;
  const lineBottom = STOP_Y_END;
  const lineLength = lineBottom - lineTop;
  const lineProgress = interpolate(frame, [20, 60], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const lineDashOffset = lineLength * (1 - lineProgress);

  // Breathing (subtle scale oscillation)
  const breathScale =
    frame >= 100
      ? 1 + Math.sin(frame * 0.015) * 0.002
      : 1;

  // Gentle brightness fade at end (250-300)
  const endBrightness = interpolate(frame, [250, 300], [1, 1.03], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Particles
  const particles = useMemo(() => Array.from({ length: 12 }, (_, i) => i), []);

  return (
    <AbsoluteFill
      style={{
        backgroundColor: AIU_COLORS.warmIvory,
        opacity: bgOpacity,
        transform: `scale(${breathScale})`,
        filter: `brightness(${endBrightness})`,
      }}
    >
      {/* Title */}
      <div
        style={{
          position: "absolute",
          top: 80,
          left: 0,
          right: 0,
          textAlign: "center",
          transform: `translateY(${titleY}px)`,
          opacity: titleSpring,
        }}
      >
        <span
          style={{
            fontFamily: spaceGrotesk,
            fontWeight: 700,
            fontSize: 48,
            color: AIU_COLORS.inkBlack,
          }}
        >
          What We'll Cover Today
        </span>
      </div>

      {/* Vertical connecting line (SVG) */}
      <svg
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          width: 1920,
          height: 1080,
          pointerEvents: "none",
        }}
      >
        <line
          x1={TIMELINE_X}
          y1={lineTop}
          x2={TIMELINE_X}
          y2={lineBottom}
          stroke={AIU_COLORS.amber}
          strokeWidth={3}
          strokeDasharray={lineLength}
          strokeDashoffset={lineDashOffset}
          strokeLinecap="round"
        />
      </svg>

      {/* Stops */}
      {STOPS.map((stop, i) => (
        <TimelineStop key={i} stop={stop} index={i} frame={frame} fps={fps} />
      ))}

      {/* Ambient particles */}
      {particles.map((i) => (
        <ParticleDot key={i} index={i} frame={frame} />
      ))}
    </AbsoluteFill>
  );
};
