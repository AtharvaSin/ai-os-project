/**
 * HookLockup.tsx — Scene 6: The Question (frames 450–540)
 *
 * "Seven Cities Burn" BVN-24x7 breaking news broadcast reel.
 *
 * Redesigned to match post-4 reel end-card style:
 *   - Rich navy #0D1B2A background (NOT pure black)
 *   - Subtle surveillance grid texture
 *   - Ghosted war room image at low opacity
 *   - Large "BHARATVARSH" watermark
 *   - Bold question text in Bebas Neue display font
 *   - Cyan trident icon above the question
 *   - Mustard CTA URL + author credit
 *   - Accent stripes (mustard top, red bottom)
 *   - Brand watermark bottom-left
 *
 * Animation timeline (1.5x scaled):
 *   Frame 450–465  Background + watermark + grid fade in
 *   Frame 455–460  Trident icon fades in
 *   Frame 458–480  Line 1: "WHO ATTACKS A NATION" fades in
 *   Frame 475–497  Line 2: "THAT WATCHES EVERYTHING?" fades in
 *   Frame 510–525  CTA URL fades in
 *   Frame 518–533  Author credit fades in
 *
 * No props required — uses useCurrentFrame internally.
 */

import React from "react";
import {
  AbsoluteFill,
  interpolate,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { C, FONT, TEXT_SHADOW, TEXT_SHADOW_HEAVY, SAFE_MARGIN } from "./constants";

// ─── Image Paths ─────────────────────────────────────────────────────────────
const IMG = {
  warRoom: staticFile("content/post-seven-cities/image2_war_room.jpg"),
};

// ─── Frame boundaries ────────────────────────────────────────────────────────
const BG_START = 450;
const BG_END = 465;
const TRIDENT_START = 455;
const TRIDENT_END = 460;
const LINE1_START = 458;
const LINE1_END = 480;
const LINE2_START = 475;
const LINE2_END = 497;
const CTA_START = 510;
const CTA_END = 525;
const AUTHOR_START = 518;
const AUTHOR_END = 533;

// ─── Surveillance Grid Background ──────────────────────────────────────────
const GridBackground: React.FC<{ frame: number }> = ({ frame }) => {
  const opacity = interpolate(frame, [BG_START, BG_END], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <>
      {/* Solid navy base */}
      <AbsoluteFill style={{ backgroundColor: C.navy, zIndex: 1 }} />

      {/* Ghosted war room image */}
      <img
        src={IMG.warRoom}
        alt=""
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          objectFit: "cover",
          filter: "blur(12px) brightness(0.15) saturate(0.5)",
          opacity: opacity * 0.25,
          zIndex: 2,
        }}
      />

      {/* Surveillance grid overlay */}
      <AbsoluteFill
        style={{
          backgroundImage: `
            linear-gradient(rgba(23,208,227,0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(23,208,227,0.03) 1px, transparent 1px)
          `,
          backgroundSize: "40px 40px",
          opacity,
          zIndex: 3,
          pointerEvents: "none",
        }}
      />
    </>
  );
};

// ─── Accent Stripes ─────────────────────────────────────────────────────────
const AccentStripes: React.FC<{ frame: number }> = ({ frame }) => {
  const opacity = interpolate(frame, [BG_START, BG_END], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <>
      {/* Mustard stripe — top */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: 3,
          backgroundColor: C.mustard,
          boxShadow: `0 0 15px ${C.mustard}60`,
          opacity,
          zIndex: 50,
        }}
      />
      {/* Red stripe — bottom */}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: 3,
          backgroundColor: C.red,
          boxShadow: `0 0 15px ${C.red}60`,
          opacity,
          zIndex: 50,
        }}
      />
    </>
  );
};

// ─── Bharatsena Symbol ───────────────────────────────────────────────────────
/**
 * Bharatsena emblem: inverted triangle with overlaid circle containing
 * a sunburst spoke wheel (16 radiating spokes with dots).
 * Mustard gold (#F1C232) on dark background.
 */
const BharatsenaSymbol: React.FC<{ frame: number }> = ({ frame }) => {
  const opacity = interpolate(frame, [TRIDENT_START, TRIDENT_END], [0, 0.3], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  if (opacity <= 0) return null;

  const color = C.mustard;
  const spokes = 16;
  const cx = 100;
  const cy = 75;
  const circleR = 52;
  const innerR = 8;
  const outerR = 40;
  const dotR = 46;

  return (
    <div
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        paddingBottom: 240,
        zIndex: 10,
        pointerEvents: "none",
      }}
    >
      <svg
        width={80}
        height={96}
        viewBox="0 0 200 240"
        style={{
          opacity,
          filter: `drop-shadow(0 0 8px ${color}40)`,
        }}
      >
        {/* Inverted triangle (point-down) */}
        <polygon
          points="18,72 182,72 100,228"
          fill="none"
          stroke={color}
          strokeWidth="5"
          strokeLinejoin="round"
        />

        {/* Circle overlaid on upper triangle */}
        <circle
          cx={cx}
          cy={cy}
          r={circleR}
          fill="none"
          stroke={color}
          strokeWidth="5"
        />

        {/* 16 radiating spokes */}
        {Array.from({ length: spokes }).map((_, i) => {
          const angle = (i * 360) / spokes * (Math.PI / 180);
          const x1 = cx + Math.cos(angle) * innerR;
          const y1 = cy + Math.sin(angle) * innerR;
          const x2 = cx + Math.cos(angle) * outerR;
          const y2 = cy + Math.sin(angle) * outerR;
          const dx = cx + Math.cos(angle) * dotR;
          const dy = cy + Math.sin(angle) * dotR;
          return (
            <g key={i}>
              <line
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke={color}
                strokeWidth="2.5"
              />
              <circle cx={dx} cy={dy} r="3" fill={color} />
            </g>
          );
        })}

        {/* Center dot */}
        <circle cx={cx} cy={cy} r="4" fill={color} />
      </svg>
    </div>
  );
};

// ─── BHARATVARSH Watermark ──────────────────────────────────────────────────
const LargeWatermark: React.FC<{
  frame: number;
  isVertical: boolean;
}> = ({ frame, isVertical }) => {
  const opacity = interpolate(frame, [BG_START, BG_END], [0, 0.12], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  if (opacity <= 0) return null;

  return (
    <div
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        paddingBottom: isVertical ? 60 : 40,
        zIndex: 5,
        pointerEvents: "none",
      }}
    >
      <span
        style={{
          fontFamily: FONT.display,
          fontSize: isVertical ? 88 : 130,
          color: C.cream,
          letterSpacing: "0.25em",
          opacity,
          willChange: "opacity",
          userSelect: "none",
        }}
      >
        BHARATVARSH
      </span>
    </div>
  );
};

// ─── Bold Question Text ─────────────────────────────────────────────────────
const QuestionText: React.FC<{
  frame: number;
  isVertical: boolean;
}> = ({ frame, isVertical }) => {
  const line1Opacity = interpolate(frame, [LINE1_START, LINE1_END], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const line2Opacity = interpolate(frame, [LINE2_START, LINE2_END], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const fontSize = isVertical ? 38 : 44;

  return (
    <div
      style={{
        position: "absolute",
        top: 0,
        left: SAFE_MARGIN,
        right: SAFE_MARGIN,
        bottom: 0,
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 20,
        pointerEvents: "none",
      }}
    >
      <span
        style={{
          fontFamily: FONT.display,
          fontSize,
          color: C.white,
          letterSpacing: "0.1em",
          textTransform: "uppercase",
          opacity: line1Opacity,
          textShadow: TEXT_SHADOW_HEAVY,
          textAlign: "center",
          willChange: "opacity",
        }}
      >
        WHO ATTACKS A NATION
      </span>

      <span
        style={{
          fontFamily: FONT.display,
          fontSize,
          color: C.white,
          letterSpacing: "0.1em",
          textTransform: "uppercase",
          opacity: line2Opacity,
          textShadow: TEXT_SHADOW_HEAVY,
          marginTop: 8,
          textAlign: "center",
          willChange: "opacity",
        }}
      >
        THAT WATCHES EVERYTHING?
      </span>
    </div>
  );
};

// ─── CTA URL ─────────────────────────────────────────────────────────────────
const CTAUrl: React.FC<{ frame: number; isVertical: boolean }> = ({ frame, isVertical }) => {
  const opacity = interpolate(frame, [CTA_START, CTA_END], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  if (opacity <= 0) return null;

  return (
    <div
      style={{
        position: "absolute",
        top: 0,
        left: SAFE_MARGIN,
        right: SAFE_MARGIN,
        bottom: 0,
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        paddingTop: isVertical ? 180 : 160,
        zIndex: 20,
        pointerEvents: "none",
      }}
    >
      <span
        style={{
          fontFamily: FONT.display,
          fontSize: isVertical ? 20 : 18,
          color: C.mustard,
          letterSpacing: "0.12em",
          opacity,
          textShadow: `${TEXT_SHADOW}, 0 0 20px rgba(241, 194, 50, 0.3)`,
          textAlign: "center",
          willChange: "opacity",
        }}
      >
        WWW.WELCOMETOBHARATVARSH.COM
      </span>
    </div>
  );
};

// ─── Author Credit ───────────────────────────────────────────────────────────
const AuthorCredit: React.FC<{ frame: number; isVertical: boolean }> = ({ frame, isVertical }) => {
  const opacity = interpolate(frame, [AUTHOR_START, AUTHOR_END], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  if (opacity <= 0) return null;

  return (
    <div
      style={{
        position: "absolute",
        top: 0,
        left: SAFE_MARGIN,
        right: SAFE_MARGIN,
        bottom: 0,
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        paddingTop: isVertical ? 230 : 200,
        zIndex: 20,
        pointerEvents: "none",
      }}
    >
      <span
        style={{
          fontFamily: FONT.mono,
          fontSize: 12,
          color: C.textSecondary,
          letterSpacing: "0.1em",
          opacity,
          textShadow: TEXT_SHADOW,
          textAlign: "center",
          willChange: "opacity",
        }}
      >
        Read the full story
      </span>
    </div>
  );
};

// ─── Brand Watermark ─────────────────────────────────────────────────────────
const BrandWatermark: React.FC<{ frame: number }> = ({ frame }) => {
  const opacity = interpolate(frame, [CTA_START, CTA_END], [0, 0.35], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  if (opacity <= 0) return null;

  return (
    <div
      style={{
        position: "absolute",
        bottom: 16,
        left: SAFE_MARGIN,
        zIndex: 25,
        pointerEvents: "none",
      }}
    >
      <span
        style={{
          fontFamily: FONT.mono,
          fontSize: 9,
          color: C.textMuted,
          letterSpacing: "0.04em",
          opacity,
          willChange: "opacity",
        }}
      >
        BHARATVARSH // BHV-20260503-001
      </span>
    </div>
  );
};

// ─── Main Component ──────────────────────────────────────────────────────────
export const HookLockup: React.FC = () => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const isVertical = height > width;

  return (
    <AbsoluteFill style={{ backgroundColor: C.navy }}>
      <GridBackground frame={frame} />
      <AccentStripes frame={frame} />
      <LargeWatermark frame={frame} isVertical={isVertical} />
      <BharatsenaSymbol frame={frame} />
      <QuestionText frame={frame} isVertical={isVertical} />
      <CTAUrl frame={frame} isVertical={isVertical} />
      <AuthorCredit frame={frame} isVertical={isVertical} />
      <BrandWatermark frame={frame} />
    </AbsoluteFill>
  );
};
