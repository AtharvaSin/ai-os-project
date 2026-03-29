/**
 * BracecommReel — BHV-20260427-001 (10s)
 * "Bracecomm 4.0 — 98.6% Adoption, Zones 4 & 5 Zero Crime"
 *
 * 5-scene product-reveal reel — Apple keynote energy × Bharatvarsh dystopia.
 * Works for both 9:16 (1080×1920) and 16:9 (1920×1080) via useVideoConfig.
 *
 * Timeline (300 frames at 30fps):
 *   Scene 1  0–30f   (0–1s)     Cold open — BVN-24x7 chyron
 *   Scene 2  30–105f (1–3.5s)   Device reveal — particle assembly + image1
 *   Scene 3  105–165f (3.5–5.5s) Stat slam — "98.6%" over image2
 *   Scene 4  165–225f (5.5–7.5s) Headline — "ZONES 4 & 5 / ZERO CRIME" over image3
 *   Scene 5  225–300f (7.5–10s)  Hook lockup — quote + URL
 *
 * Bharatsena palette: Navy #0B2742, Cyan #17D0E3, Mustard #F1C232
 * Brand: Context B — Bharatvarsh
 *
 * Audio (two-layer design):
 *   Layer 1: Crime Scene Thrill — dark atmospheric bed, full duration, low volume
 *   Layer 2: Thrill Riser — tension build from device reveal through headline
 */

import React from "react";
import {
  AbsoluteFill,
  Audio,
  Img,
  Sequence,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

// ─── Brand Tokens ────────────────────────────────────────────────────────────
const C = {
  obsidian: "#0A0D12",
  navy: "#0B2742",
  cyan: "#17D0E3",
  mustard: "#F1C232",
  textPrimary: "#F0F4F8",
  textSecondary: "#A0AEC0",
  textMuted: "#718096",
  white: "#FFFFFF",
};

const FONT = {
  mono: "'JetBrains Mono', 'Courier New', monospace",
  display: "'Bebas Neue', 'Impact', sans-serif",
  body: "'Inter', 'Helvetica Neue', sans-serif",
};

// ─── Image Paths ─────────────────────────────────────────────────────────────
const IMG = {
  device: staticFile("content/post-bracecomm/image1_device_hero.jpg"),
  dataGrid: staticFile("content/post-bracecomm/image2_data_atmosphere.jpg"),
  checkpoint: staticFile("content/post-bracecomm/image3_urban_context.jpg"),
};

// ─── Film Grain ──────────────────────────────────────────────────────────────
const FilmGrain: React.FC = () => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const seed = frame % 12;

  return (
    <AbsoluteFill style={{ zIndex: 90, pointerEvents: "none", opacity: 0.06 }}>
      <svg width={width} height={height}>
        <filter id={`bc-grain-${seed}`}>
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.65"
            numOctaves={3}
            seed={seed}
          />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <rect
          width={width}
          height={height}
          fill="rgba(200,200,200,0.5)"
          filter={`url(#bc-grain-${seed})`}
        />
      </svg>
    </AbsoluteFill>
  );
};

// ─── Vignette ────────────────────────────────────────────────────────────────
const Vignette: React.FC = () => (
  <AbsoluteFill
    style={{
      background:
        "radial-gradient(ellipse at center, transparent 30%, rgba(10,13,18,0.45) 100%)",
      zIndex: 91,
      pointerEvents: "none",
    }}
  />
);

// ─── Scene 1: Cold Open (frames 0–30) ────────────────────────────────────────
const ColdOpen: React.FC<{ frame: number }> = ({ frame }) => {
  const chyronOpacity = interpolate(frame, [8, 22], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: "#000",
        justifyContent: "flex-end",
        alignItems: "center",
      }}
    >
      {/* BVN-24x7 chyron bar */}
      <div
        style={{
          position: "absolute",
          bottom: "12%",
          left: 0,
          right: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          opacity: chyronOpacity,
        }}
      >
        {/* Mustard accent line */}
        <div
          style={{
            width: 120,
            height: 2,
            backgroundColor: C.mustard,
            marginBottom: 18,
            boxShadow: `0 0 12px ${C.mustard}60`,
          }}
        />
        <div
          style={{
            fontFamily: FONT.mono,
            fontSize: 16,
            color: C.mustard,
            letterSpacing: 4,
            textTransform: "uppercase",
            textAlign: "center",
          }}
        >
          BVN-24x7
        </div>
        <div
          style={{
            fontFamily: FONT.mono,
            fontSize: 13,
            color: C.textSecondary,
            letterSpacing: 3,
            marginTop: 8,
            textAlign: "center",
          }}
        >
          CIVIC HARMONY REPORT · OCTOBER 15, 2025
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ─── Scene 2: Device Reveal — Particle Assembly (frames 30–105) ──────────────

// Predetermined particle positions (8 particles at cardinal + diagonal angles)
const PARTICLES = [
  { angle: 0, dist: 380 },
  { angle: 45, dist: 420 },
  { angle: 90, dist: 360 },
  { angle: 135, dist: 400 },
  { angle: 180, dist: 380 },
  { angle: 225, dist: 440 },
  { angle: 270, dist: 370 },
  { angle: 315, dist: 410 },
];

const DeviceReveal: React.FC<{ frame: number; fps: number }> = ({
  frame,
  fps,
}) => {
  const localFrame = frame - 30;
  if (localFrame < 0) return null;

  // Phase 1: Spark (0–10f)
  const sparkScale = interpolate(localFrame, [0, 5, 10], [0, 1.2, 0.3], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const sparkOpacity = interpolate(localFrame, [0, 3, 10, 20], [0, 1, 0.8, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Phase 2: Particles radiate out (10–25f) then converge back (25–60f)
  const particleProgress = (index: number) => {
    // Stagger each particle slightly
    const stagger = index * 0.8;
    const outward = interpolate(
      localFrame,
      [10 + stagger, 22 + stagger],
      [0, 1],
      { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
    );
    const converge = spring({
      frame: localFrame - 25 - stagger,
      fps,
      config: { stiffness: 80, damping: 18 },
      durationInFrames: 35,
    });

    // Outward then back: distance goes 0 → 1 → 0
    if (localFrame < 25 + stagger) {
      return outward;
    }
    return 1 - converge;
  };

  // Phase 3: Device image materialises (50–70f)
  const deviceOpacity = interpolate(localFrame, [45, 65], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const deviceScale = interpolate(localFrame, [45, 65], [0.85, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Phase 4: Cyan display glow activation (60–75f)
  const displayGlow = interpolate(localFrame, [55, 70], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Phase 5: Mustard pulse rings (60–75f)
  const pulseProgress = interpolate(localFrame, [58, 75], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Particle visibility (fade out once device assembles)
  const particleOpacity = interpolate(localFrame, [45, 60], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: "#000",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      {/* Central spark */}
      {localFrame < 20 && (
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            width: 6,
            height: 6,
            borderRadius: "50%",
            backgroundColor: C.cyan,
            transform: `translate(-50%, -50%) scale(${sparkScale})`,
            opacity: sparkOpacity,
            boxShadow: `0 0 ${20 * sparkScale}px ${C.cyan}, 0 0 ${40 * sparkScale}px ${C.cyan}60`,
            zIndex: 30,
          }}
        />
      )}

      {/* Spark ring expansion */}
      {localFrame >= 5 && localFrame < 25 && (
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            width: interpolate(localFrame, [5, 25], [6, 80], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            }),
            height: interpolate(localFrame, [5, 25], [6, 80], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            }),
            borderRadius: "50%",
            border: `2px solid ${C.cyan}`,
            transform: "translate(-50%, -50%)",
            opacity: interpolate(localFrame, [5, 15, 25], [0, 0.8, 0], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            }),
            boxShadow: `0 0 15px ${C.cyan}80`,
            zIndex: 29,
          }}
        />
      )}

      {/* Particle fragments */}
      {PARTICLES.map((p, i) => {
        const progress = particleProgress(i);
        const rad = (p.angle * Math.PI) / 180;
        const x = Math.cos(rad) * p.dist * progress;
        const y = Math.sin(rad) * p.dist * progress;
        const size = 4 + (i % 3) * 2;

        return (
          <div
            key={i}
            style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              width: size,
              height: size,
              backgroundColor: i % 2 === 0 ? C.cyan : C.mustard,
              transform: `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))`,
              opacity: particleOpacity * (localFrame > 10 ? 1 : 0),
              boxShadow: `0 0 8px ${i % 2 === 0 ? C.cyan : C.mustard}`,
              zIndex: 28,
            }}
          />
        );
      })}

      {/* Device image — materialises from particles */}
      <div
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: `translate(-50%, -50%) scale(${deviceScale})`,
          opacity: deviceOpacity,
          width: "70%",
          maxWidth: 600,
          zIndex: 25,
        }}
      >
        <Img
          src={IMG.device}
          style={{
            width: "100%",
            height: "auto",
            objectFit: "contain",
            filter: `brightness(${0.9 + displayGlow * 0.15}) contrast(1.08)`,
          }}
        />

        {/* Cyan display glow overlay */}
        <div
          style={{
            position: "absolute",
            top: "30%",
            left: "25%",
            width: "50%",
            height: "35%",
            background: `radial-gradient(ellipse at center, ${C.cyan}${Math.round(displayGlow * 25).toString(16).padStart(2, "0")} 0%, transparent 70%)`,
            pointerEvents: "none",
            filter: "blur(8px)",
          }}
        />
      </div>

      {/* Mustard gold pulse rings */}
      {[0, 1, 2].map((ring) => {
        const ringDelay = ring * 0.15;
        const ringProgress = Math.max(0, pulseProgress - ringDelay);
        const ringSize = 100 + ringProgress * 500;

        return (
          <div
            key={`ring-${ring}`}
            style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              width: ringSize,
              height: ringSize,
              borderRadius: "50%",
              border: `1.5px solid ${C.mustard}`,
              transform: "translate(-50%, -50%)",
              opacity: Math.max(0, (1 - ringProgress * 1.3) * 0.6),
              boxShadow: `0 0 10px ${C.mustard}40`,
              zIndex: 24,
              pointerEvents: "none",
            }}
          />
        );
      })}
    </AbsoluteFill>
  );
};

// ─── Scene 3: Stat Slam (frames 105–165) ─────────────────────────────────────
const StatSlam: React.FC<{ frame: number; fps: number; isVertical: boolean }> = ({
  frame,
  fps,
  isVertical,
}) => {
  const localFrame = frame - 105;
  if (localFrame < 0) return null;

  // Background image fade in
  const bgOpacity = interpolate(localFrame, [0, 8], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Ken Burns on background
  const bgScale = interpolate(localFrame, [0, 60], [1.05, 1.0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // "98.6%" slam — scale 200%→100%, opacity 0→1, 8 frames
  const statScale = interpolate(localFrame, [4, 12], [2.0, 1.0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const statOpacity = interpolate(localFrame, [4, 12], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // "ADOPTION" — slide up, delay 10 frames after number
  const adoptionOpacity = interpolate(localFrame, [14, 22], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const adoptionY = interpolate(localFrame, [14, 22], [20, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Data pulse lines (SVG) — emanate from stat
  const lineProgress = interpolate(localFrame, [12, 24], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const lineOpacity = interpolate(localFrame, [12, 20, 36], [0, 0.7, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const statFontSize = isVertical ? 140 : 120;
  const adoptionFontSize = isVertical ? 28 : 24;

  return (
    <AbsoluteFill style={{ backgroundColor: "#000" }}>
      {/* Background — image2 (city grid) */}
      <AbsoluteFill
        style={{
          opacity: bgOpacity,
          transform: `scale(${bgScale})`,
        }}
      >
        <Img
          src={IMG.dataGrid}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            filter: "brightness(0.55) contrast(1.1)",
          }}
        />
        {/* Dark overlay to make stat pop */}
        <AbsoluteFill
          style={{
            background:
              "radial-gradient(ellipse at center, rgba(10,13,18,0.3) 0%, rgba(10,13,18,0.7) 100%)",
          }}
        />
      </AbsoluteFill>

      {/* Stat text */}
      <AbsoluteFill
        style={{
          justifyContent: "center",
          alignItems: "center",
          zIndex: 20,
        }}
      >
        {/* "98.6%" */}
        <div
          style={{
            fontFamily: FONT.display,
            fontSize: statFontSize,
            color: C.white,
            letterSpacing: 6,
            transform: `scale(${statScale})`,
            opacity: statOpacity,
            textShadow: `0 0 60px rgba(23,208,227,0.4), 0 4px 40px rgba(10,13,18,0.9)`,
            lineHeight: 1,
          }}
        >
          98.6%
        </div>

        {/* "ADOPTION" */}
        <div
          style={{
            fontFamily: FONT.mono,
            fontSize: adoptionFontSize,
            color: C.cyan,
            letterSpacing: 8,
            marginTop: 12,
            opacity: adoptionOpacity,
            transform: `translateY(${adoptionY}px)`,
            textShadow: `0 0 20px ${C.cyan}60`,
          }}
        >
          ADOPTION
        </div>
      </AbsoluteFill>

      {/* Data pulse lines */}
      <AbsoluteFill
        style={{
          justifyContent: "center",
          alignItems: "center",
          zIndex: 19,
          opacity: lineOpacity,
          pointerEvents: "none",
        }}
      >
        {[0, 60, 120, 180, 240, 300].map((angle, i) => {
          const rad = (angle * Math.PI) / 180;
          const len = 200 * lineProgress;
          const startDist = 100;
          const x1 = Math.cos(rad) * startDist;
          const y1 = Math.sin(rad) * startDist;
          const x2 = Math.cos(rad) * (startDist + len);
          const y2 = Math.sin(rad) * (startDist + len);

          return (
            <svg
              key={i}
              style={{
                position: "absolute",
                width: "100%",
                height: "100%",
                overflow: "visible",
              }}
              viewBox="-540 -960 1080 1920"
            >
              <line
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke={C.cyan}
                strokeWidth={1.5}
                opacity={0.6}
              />
            </svg>
          );
        })}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// ─── Scene 4: Headline (frames 165–225) ──────────────────────────────────────
const Headline: React.FC<{ frame: number; isVertical: boolean }> = ({
  frame,
  isVertical,
}) => {
  const localFrame = frame - 165;
  if (localFrame < 0) return null;

  // Background image fade in
  const bgOpacity = interpolate(localFrame, [0, 6], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Ken Burns
  const bgScale = interpolate(localFrame, [0, 60], [1.06, 1.0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // "ZONES 4 & 5" — slide from left
  const zone5Opacity = interpolate(localFrame, [4, 10], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const zone5X = interpolate(localFrame, [4, 10], [-60, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // "ZERO CRIME" — slide from left, delay 9 frames (0.3s)
  const crimeOpacity = interpolate(localFrame, [13, 19], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const crimeX = interpolate(localFrame, [13, 19], [-60, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Chyron bar — slide up from bottom
  const chyronY = interpolate(localFrame, [6, 14], [80, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const chyronOpacity = interpolate(localFrame, [6, 14], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const titleSize = isVertical ? 76 : 64;
  const crimeSize = isVertical ? 96 : 80;

  return (
    <AbsoluteFill style={{ backgroundColor: "#000" }}>
      {/* Background — image3 (checkpoint) */}
      <AbsoluteFill
        style={{
          opacity: bgOpacity,
          transform: `scale(${bgScale})`,
        }}
      >
        <Img
          src={IMG.checkpoint}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            objectPosition: "center 40%",
            filter: "brightness(0.5) contrast(1.12)",
          }}
        />
        {/* Bottom gradient for text readability */}
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: "60%",
            background:
              "linear-gradient(to top, rgba(10,13,18,0.95) 0%, rgba(10,13,18,0.6) 50%, transparent 100%)",
          }}
        />
      </AbsoluteFill>

      {/* Text overlay */}
      <AbsoluteFill style={{ zIndex: 20, pointerEvents: "none" }}>
        {/* "ZONES 4 & 5" */}
        <div
          style={{
            position: "absolute",
            bottom: isVertical ? "30%" : "28%",
            left: isVertical ? 52 : 80,
            right: isVertical ? 52 : 80,
            opacity: zone5Opacity,
            transform: `translateX(${zone5X}px)`,
          }}
        >
          <div
            style={{
              fontFamily: FONT.display,
              fontSize: titleSize,
              color: C.textPrimary,
              letterSpacing: 4,
              textTransform: "uppercase",
              textShadow: `0 2px 30px rgba(10,13,18,0.95)`,
              lineHeight: 1.1,
            }}
          >
            ZONES 4 & 5
          </div>
        </div>

        {/* "ZERO CRIME" */}
        <div
          style={{
            position: "absolute",
            bottom: isVertical ? "23%" : "20%",
            left: isVertical ? 52 : 80,
            right: isVertical ? 52 : 80,
            opacity: crimeOpacity,
            transform: `translateX(${crimeX}px)`,
          }}
        >
          {/* Mustard accent bar */}
          <div
            style={{
              width: "50%",
              height: 3,
              backgroundColor: C.mustard,
              marginBottom: 14,
              boxShadow: `0 0 18px ${C.mustard}80`,
            }}
          />
          <div
            style={{
              fontFamily: FONT.display,
              fontSize: crimeSize,
              color: C.cyan,
              letterSpacing: 6,
              textTransform: "uppercase",
              textShadow: `0 0 40px ${C.cyan}50, 0 2px 30px rgba(10,13,18,0.95)`,
              lineHeight: 1.1,
            }}
          >
            ZERO CRIME
          </div>
        </div>

        {/* BVN-24x7 chyron bar bottom */}
        <div
          style={{
            position: "absolute",
            bottom: isVertical ? "8%" : "6%",
            left: 0,
            right: 0,
            opacity: chyronOpacity,
            transform: `translateY(${chyronY}px)`,
          }}
        >
          <div
            style={{
              backgroundColor: `${C.navy}E6`,
              borderTop: `2px solid ${C.mustard}`,
              padding: "10px 24px",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              gap: 16,
            }}
          >
            <span
              style={{
                fontFamily: FONT.mono,
                fontSize: 11,
                color: C.mustard,
                letterSpacing: 3,
                fontWeight: "bold",
              }}
            >
              BVN-24x7
            </span>
            <span
              style={{
                fontFamily: FONT.mono,
                fontSize: 12,
                color: C.textSecondary,
                letterSpacing: 2,
              }}
            >
              Dept. of Civic Harmony · October 15, 2025
            </span>
          </div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// ─── Scene 5: Hook Lockup (frames 225–300) ───────────────────────────────────
const HookLockup: React.FC<{ frame: number; isVertical: boolean }> = ({
  frame,
  isVertical,
}) => {
  const localFrame = frame - 225;
  if (localFrame < 0) return null;

  // Ghost background — image1 at 15% opacity, blurred
  const ghostOpacity = interpolate(localFrame, [0, 15], [0, 0.15], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Line 1: "The citizen who wears it is known."
  const line1Opacity = interpolate(localFrame, [5, 25], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Line 2: "The citizen who is known is safe." — delay 15 frames
  const line2Opacity = interpolate(localFrame, [20, 40], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // URL — delay 40 frames after line 1
  const urlOpacity = interpolate(localFrame, [45, 60], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const quoteFontSize = isVertical ? 26 : 24;

  return (
    <AbsoluteFill style={{ backgroundColor: "#000" }}>
      {/* Ghost background — blurred device */}
      <AbsoluteFill style={{ opacity: ghostOpacity }}>
        <Img
          src={IMG.device}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            filter: "blur(20px) brightness(0.6)",
          }}
        />
      </AbsoluteFill>

      {/* Quote text */}
      <AbsoluteFill
        style={{
          justifyContent: "center",
          alignItems: "center",
          zIndex: 20,
          padding: isVertical ? "0 48px" : "0 120px",
        }}
      >
        <div style={{ textAlign: "center" }}>
          {/* Line 1 */}
          <div
            style={{
              fontFamily: FONT.mono,
              fontSize: quoteFontSize,
              color: C.white,
              lineHeight: 1.8,
              opacity: line1Opacity,
              letterSpacing: 1,
            }}
          >
            "The citizen who wears it is known.
          </div>

          {/* Line 2 */}
          <div
            style={{
              fontFamily: FONT.mono,
              fontSize: quoteFontSize,
              color: C.white,
              lineHeight: 1.8,
              opacity: line2Opacity,
              letterSpacing: 1,
              marginTop: 4,
            }}
          >
            The citizen who is known is safe."
          </div>

          {/* URL */}
          <div
            style={{
              fontFamily: FONT.display,
              fontSize: isVertical ? 28 : 26,
              color: C.mustard,
              letterSpacing: 3,
              marginTop: 40,
              opacity: urlOpacity,
              textShadow: `0 0 20px ${C.mustard}50`,
              textTransform: "uppercase",
            }}
          >
            www.welcometobharatvarsh.com
          </div>
        </div>
      </AbsoluteFill>

      {/* Mustard glow stripe — bottom */}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: 3,
          backgroundColor: C.mustard,
          boxShadow: `0 0 20px ${C.mustard}, 0 0 40px ${C.mustard}50`,
          zIndex: 30,
          opacity: urlOpacity,
        }}
      />

      {/* Brand watermark */}
      <div
        style={{
          position: "absolute",
          bottom: 16,
          left: 20,
          fontFamily: FONT.mono,
          fontSize: 9,
          color: C.textMuted,
          opacity: 0.35 * urlOpacity,
          letterSpacing: 1,
          zIndex: 30,
        }}
      >
        BHARATVARSH // BHV-20260427-001
      </div>
    </AbsoluteFill>
  );
};

// ─── Scene Transitions ───────────────────────────────────────────────────────
const SceneTransition: React.FC<{
  frame: number;
  triggerFrame: number;
  duration?: number;
}> = ({ frame, triggerFrame, duration = 6 }) => {
  const progress = interpolate(
    frame,
    [triggerFrame, triggerFrame + duration],
    [0, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  if (progress <= 0 || progress >= 1) return null;

  return (
    <AbsoluteFill
      style={{
        backgroundColor: "#000",
        opacity: interpolate(progress, [0, 0.5, 1], [0, 0.8, 0]),
        zIndex: 80,
        pointerEvents: "none",
      }}
    />
  );
};

// ─── Main Composition ────────────────────────────────────────────────────────
export const BracecommReel: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const isVertical = height > width;

  // ── Audio volume envelope ──
  // Phonk BGM: fade in, hold strong through scenes 2-4, fade out for hook
  const bgmVolume = interpolate(
    frame,
    [0, 15, 30, 105, 225, 275, 300],
    [0, 0.5, 0.7, 0.75, 0.6, 0.2, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  return (
    <AbsoluteFill style={{ backgroundColor: "#000" }}>
      {/* ── Audio: Phonk BGM (from 10s mark of PhonkBGM1) ── */}
      <Sequence from={0} durationInFrames={300}>
        <Audio
          src={staticFile("content/post-bracecomm/audio/phonk-bgm.wav")}
          volume={bgmVolume}
        />
      </Sequence>

      {/* Scene 1: Cold Open (0–30f) */}
      <Sequence durationInFrames={30}>
        <ColdOpen frame={frame} />
      </Sequence>

      {/* Scene 2: Device Reveal (30–105f) */}
      <Sequence from={30} durationInFrames={75}>
        <DeviceReveal frame={frame} fps={fps} />
      </Sequence>

      {/* Scene 3: Stat Slam (105–165f) */}
      <Sequence from={105} durationInFrames={60}>
        <StatSlam frame={frame} fps={fps} isVertical={isVertical} />
      </Sequence>

      {/* Scene 4: Headline (165–225f) */}
      <Sequence from={165} durationInFrames={60}>
        <Headline frame={frame} isVertical={isVertical} />
      </Sequence>

      {/* Scene 5: Hook Lockup (225–300f) */}
      <Sequence from={225} durationInFrames={75}>
        <HookLockup frame={frame} isVertical={isVertical} />
      </Sequence>

      {/* Scene transitions (quick black dips) */}
      <SceneTransition frame={frame} triggerFrame={28} duration={6} />
      <SceneTransition frame={frame} triggerFrame={103} duration={6} />
      <SceneTransition frame={frame} triggerFrame={163} duration={6} />
      <SceneTransition frame={frame} triggerFrame={223} duration={6} />

      {/* Global overlays — always on */}
      <FilmGrain />
      <Vignette />
    </AbsoluteFill>
  );
};
