/**
 * TridentSurveillanceReel — BHV-20260415-001 (8s × 9:16)
 * Instagram Reel / YouTube Shorts format
 *
 * Uses the Jim Lee illustration as background — the trident wall,
 * post-anomaly. Frame 0 is a cinematic key still (thumbnail-ready).
 *
 * Timing (240 frames at 30fps):
 *   0-30f    (0-1s):   CCTV still — Jim Lee art + HUD (thumbnail)
 *   30-68f   (1-2.3s): "INCIDENT LOG — MESH ANOMALY" header
 *   68-115f  (2.3-3.8s): Location text
 *   115-165f (3.8-5.5s): "THE MESH WAS WATCHING."
 *   165-186f (5.5-6.2s): "IT SAW NOTHING."
 *   186-240f (6.2-8s):  End card
 *
 * Text vertically centred in safe zone (avoiding platform UI chrome
 * at top ~120px and bottom ~240px on a 1920px canvas).
 *
 * Tribhuj palette: Grey #4A4A4A, Red #DC2626, Orange #FF6B35
 * Brand: Mustard #F1C232, Obsidian #0A0D12
 */

import React from "react";
import {
  AbsoluteFill,
  Audio,
  Img,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
  Sequence,
} from "remotion";

// ─── Brand Tokens ────────────────────────────────────────────────────────────
const C = {
  obsidian:      "#0A0D12",
  obsidian800:   "#1A1F2E",
  mustard:       "#F1C232",
  textPrimary:   "#F0F4F8",
  textSecondary: "#A0AEC0",
  textMuted:     "#718096",
  tribhujGrey:   "#4A4A4A",
  tribhujRed:    "#DC2626",
  tribhujOrange: "#FF6B35",
  tridentCyan:   "#17D0E3",
  tridentBlue:   "#4A90D9",
};

const FONT = {
  mono:    "'JetBrains Mono', 'Courier New', monospace",
  display: "'Bebas Neue', 'Impact', sans-serif",
  body:    "'Inter', 'Helvetica Neue', sans-serif",
  lore:    "'Crimson Pro', 'Georgia', serif",
};

// ─── Background: Jim Lee Wall Art ────────────────────────────────────────────
const JimLeeBackground: React.FC<{ frame: number }> = ({ frame }) => {
  // Very slow ken burns — top to bottom drift over 8 seconds
  const scale = interpolate(frame, [0, 240], [1.04, 1.0], {
    extrapolateRight: "clamp",
  });
  const translateY = interpolate(frame, [0, 240], [0, 12], {
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        transform: `scale(${scale}) translateY(${translateY}px)`,
        transformOrigin: "center top",
        overflow: "hidden",
      }}
    >
      <Img
        src={staticFile("content/post-4/images/trident-wall.jpg")}
        style={{
          width:          "100%",
          height:         "100%",
          objectFit:      "cover",
          objectPosition: "center 30%",
          filter:         "sepia(0.04) contrast(1.06) brightness(0.82)",
        }}
      />
    </AbsoluteFill>
  );
};

// ─── Atmosphere Layers ────────────────────────────────────────────────────────
const Atmosphere: React.FC = () => (
  <>
    {/* Vignette */}
    <AbsoluteFill
      style={{
        background:    "radial-gradient(ellipse at center, transparent 38%, rgba(0,0,0,0.55) 100%)",
        zIndex:        3,
        pointerEvents: "none",
      }}
    />
    {/* Bottom gradient — 72% height covers the vertically-centred text block */}
    <div
      style={{
        position:      "absolute",
        bottom:        0,
        left:          0,
        right:         0,
        height:        "72%",
        background:    "linear-gradient(to top, rgba(10,13,18,1.0) 0%, rgba(10,13,18,0.82) 30%, rgba(10,13,18,0.40) 60%, transparent 100%)",
        zIndex:        4,
        pointerEvents: "none",
      }}
    />
    {/* Scanlines */}
    <AbsoluteFill
      style={{
        backgroundImage: `repeating-linear-gradient(
          0deg,
          rgba(0,0,0,0.10) 0px,
          rgba(0,0,0,0.10) 1px,
          transparent 1px,
          transparent 3px
        )`,
        zIndex:        5,
        pointerEvents: "none",
      }}
    />
  </>
);

// ─── Film Grain (per-frame seed) ─────────────────────────────────────────────
const FilmGrain: React.FC<{ frame: number }> = ({ frame }) => (
  <AbsoluteFill
    style={{ zIndex: 6, pointerEvents: "none", opacity: 0.065 }}
  >
    <svg width="100%" height="100%">
      <filter id={`grain${frame % 12}`}>
        <feTurbulence
          type="fractalNoise"
          baseFrequency="0.72"
          numOctaves="3"
          seed={frame % 12}
        />
      </filter>
      <rect width="100%" height="100%" filter={`url(#grain${frame % 12})`} />
    </svg>
  </AbsoluteFill>
);

// ─── CCTV HUD ────────────────────────────────────────────────────────────────
const CctvHud: React.FC<{ frame: number }> = ({ frame }) => {
  const recBlink = frame % 40 > 20;
  const hudColor = C.tribhujRed; // post-anomaly: always red

  return (
    <>
      {/* Timestamp — top left */}
      <div
        style={{
          position:      "absolute",
          top:           36,
          left:          40,
          fontFamily:    FONT.mono,
          fontSize:      26,
          color:         hudColor,
          letterSpacing: 2,
          zIndex:        50,
          textShadow:    `0 0 8px ${hudColor}`,
        }}
      >
        03:22:07
      </div>

      {/* REC — top right */}
      <div
        style={{
          position:   "absolute",
          top:        36,
          right:      40,
          display:    "flex",
          alignItems: "center",
          gap:        8,
          zIndex:     50,
        }}
      >
        <div
          style={{
            width:           10,
            height:          10,
            borderRadius:    "50%",
            backgroundColor: C.tribhujRed,
            opacity:         recBlink ? 1 : 0.25,
            boxShadow:       recBlink ? `0 0 10px ${C.tribhujRed}` : "none",
          }}
        />
        <span
          style={{
            fontFamily:    FONT.mono,
            fontSize:      18,
            color:         hudColor,
            letterSpacing: 3,
          }}
        >
          REC
        </span>
      </div>

      {/* Camera ID — below timestamp */}
      <div
        style={{
          position:      "absolute",
          top:           74,
          left:          40,
          fontFamily:    FONT.mono,
          fontSize:      14,
          color:         hudColor,
          letterSpacing: 1.5,
          opacity:       0.65,
          zIndex:        50,
        }}
      >
        CAM-S7-14C-EAST // MESH NODE 4471
      </div>

      {/* Date — below REC */}
      <div
        style={{
          position:      "absolute",
          top:           74,
          right:         40,
          fontFamily:    FONT.mono,
          fontSize:      14,
          color:         hudColor,
          letterSpacing: 1.5,
          opacity:       0.65,
          zIndex:        50,
        }}
      >
        18-OCT-2025
      </div>

      {/* Corner brackets — adapted for 9:16 */}
      {[
        { top: 100,   left:  50 },
        { top: 100,   right: 50 },
        { bottom: 80, left:  50 },
        { bottom: 80, right: 50 },
      ].map((pos, i) => (
        <div
          key={i}
          style={{
            position:    "absolute",
            ...pos,
            width:       40,
            height:      40,
            borderColor: `${hudColor}44`,
            borderStyle: "solid",
            borderWidth: 0,
            ...(i === 0
              ? { borderTopWidth: 1, borderLeftWidth: 1 }
              : i === 1
                ? { borderTopWidth: 1, borderRightWidth: 1 }
                : i === 2
                  ? { borderBottomWidth: 1, borderLeftWidth: 1 }
                  : { borderBottomWidth: 1, borderRightWidth: 1 }),
            zIndex: 50,
          }}
        />
      ))}

      {/* Website watermark — bottom right */}
      <div
        style={{
          position:      "absolute",
          bottom:        36,
          right:         40,
          fontFamily:    FONT.mono,
          fontSize:      11,
          color:         C.textMuted,
          letterSpacing: 1,
          opacity:       0.35,
          zIndex:        50,
        }}
      >
        www.welcometobharatvarsh.com
      </div>
    </>
  );
};

// ─── Text Overlays ────────────────────────────────────────────────────────────
// All bottom values are shifted to vertically centre the text block on a 1920px
// canvas, staying clear of platform UI chrome (~120px top, ~240px bottom).
// Safe zone centre ≈ 980px from bottom. Text block spans ~1100→730 from bottom.
const IncidentText: React.FC<{ frame: number; fps: number }> = ({ frame, fps }) => {
  // Header — frame 30
  const headerOpacity = interpolate(frame, [30, 42], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Location — frame 68 (was 50 — extra hold on header alone)
  const locationOpacity = interpolate(frame, [68, 80], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // "THE MESH WAS WATCHING." — frame 115 (was 70)
  const hookEnter = spring({
    frame:            frame - 115,
    fps,
    config:           { damping: 140 },
    durationInFrames: 14,
  });

  // "IT SAW NOTHING." — frame 165 (was 100)
  const nothingEnter = spring({
    frame:            frame - 165,
    fps,
    config:           { damping: 110, stiffness: 180 },
    durationInFrames: 14,
  });

  return (
    <AbsoluteFill style={{ zIndex: 45, pointerEvents: "none" }}>

      {/* INCIDENT LOG header — bottom: 1100 (centred in safe zone) */}
      {frame >= 30 && (
        <div
          style={{
            position: "absolute",
            bottom:   1100,
            left:     52,
            right:    52,
            opacity:  headerOpacity,
          }}
        >
          <div
            style={{
              fontFamily:    FONT.mono,
              fontSize:      23,
              color:         C.tribhujRed,
              letterSpacing: 3,
              marginBottom:  10,
              textShadow:    `0 0 12px rgba(220,38,38,0.6)`,
            }}
          >
            INCIDENT LOG — MESH ANOMALY
          </div>
          <div
            style={{
              width:           "100%",
              height:          1.5,
              backgroundColor: `${C.tribhujRed}B3`,
            }}
          />
        </div>
      )}

      {/* Location — bottom: 1010 */}
      {frame >= 68 && (
        <div
          style={{
            position: "absolute",
            bottom:   1010,
            left:     52,
            right:    52,
            opacity:  locationOpacity,
          }}
        >
          <div
            style={{
              fontFamily: FONT.lore,
              fontSize:   34,
              color:      C.textSecondary,
              lineHeight: 1.6,
            }}
          >
            Sector 7, Lakshmanpur. Block 14-C.
          </div>
          <div
            style={{
              fontFamily: FONT.lore,
              fontSize:   29,
              color:      C.textSecondary,
              lineHeight: 1.6,
              marginTop:  4,
            }}
          >
            A Grey Trident appeared between 03:17 and 03:22.
          </div>
        </div>
      )}

      {/* "THE MESH WAS WATCHING." — bottom: 860 */}
      {frame >= 115 && (
        <div
          style={{
            position:  "absolute",
            bottom:    860,
            left:      52,
            right:     52,
            transform: `translateY(${interpolate(hookEnter, [0, 1], [24, 0])}px)`,
            opacity:   hookEnter,
          }}
        >
          {/* Mustard accent line */}
          <div
            style={{
              width:           "60%",
              height:          3,
              backgroundColor: C.mustard,
              marginBottom:    16,
              boxShadow:       `0 0 18px ${C.mustard}80, 0 0 6px ${C.mustard}`,
            }}
          />
          <div
            style={{
              fontFamily:    FONT.display,
              fontSize:      72,
              color:         C.textPrimary,
              letterSpacing: 3,
              textTransform: "uppercase",
              textShadow:    `0 2px 30px rgba(10,13,18,0.98), 0 0 20px rgba(10,13,18,0.8)`,
              lineHeight:    1.1,
            }}
          >
            The Mesh was watching.
          </div>
        </div>
      )}

      {/* "IT SAW NOTHING." — bottom: 730 */}
      {frame >= 165 && (
        <div
          style={{
            position:  "absolute",
            bottom:    730,
            left:      52,
            right:     52,
            transform: `translateY(${interpolate(nothingEnter, [0, 1], [18, 0])}px)`,
            opacity:   nothingEnter,
          }}
        >
          {/* Red glow strip behind text */}
          <div
            style={{
              position:     "absolute",
              inset:        "-8px -16px",
              background:   `rgba(220,38,38,0.08)`,
              borderLeft:   `3px solid ${C.tribhujRed}60`,
              borderRadius: 2,
            }}
          />
          <div
            style={{
              fontFamily:    FONT.display,
              fontSize:      86,
              color:         C.tribhujRed,
              letterSpacing: 4,
              textTransform: "uppercase",
              textShadow:    `0 0 50px ${C.tribhujRed}90, 0 0 20px ${C.tribhujRed}50, 0 2px 24px rgba(10,13,18,0.98)`,
              position:      "relative",
            }}
          >
            It saw nothing.
          </div>
        </div>
      )}
    </AbsoluteFill>
  );
};

// ─── End Card (frames 186-240, 1.8s) ─────────────────────────────────────────
const EndCard: React.FC<{ localFrame: number }> = ({ localFrame }) => {
  const fadeIn = interpolate(localFrame, [0, 18], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const urlOpacity = interpolate(localFrame, [10, 22], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const ctaOpacity = interpolate(localFrame, [18, 30], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: C.obsidian,
        opacity:         fadeIn,
        justifyContent:  "center",
        alignItems:      "center",
        flexDirection:   "column",
      }}
    >
      {/* Surveillance grid */}
      <AbsoluteFill
        style={{
          backgroundImage: `
            linear-gradient(0deg, transparent 24%, rgba(201,219,238,0.05) 25%, rgba(201,219,238,0.05) 26%, transparent 27%, transparent 74%, rgba(201,219,238,0.05) 75%, rgba(201,219,238,0.05) 76%, transparent 77%),
            linear-gradient(90deg, transparent 24%, rgba(201,219,238,0.05) 25%, rgba(201,219,238,0.05) 26%, transparent 27%, transparent 74%, rgba(201,219,238,0.05) 75%, rgba(201,219,238,0.05) 76%, transparent 77%)
          `,
          backgroundSize: "50px 50px",
          pointerEvents:  "none",
          zIndex:         5,
        }}
      />

      {/* Mustard accent bar — top */}
      <div
        style={{
          position:        "absolute",
          top:             0,
          left:            "10%",
          right:           "10%",
          height:          3,
          backgroundColor: C.mustard,
          boxShadow:       `0 0 20px ${C.mustard}`,
          zIndex:          15,
        }}
      />

      {/* Trident silhouette */}
      <Img
        src={staticFile("brand/tribhuj-trident.svg")}
        style={{
          width:        90,
          height:       136,
          marginBottom: 28,
          filter:       `drop-shadow(0 0 14px ${C.tridentCyan}80)`,
          opacity:      interpolate(localFrame, [6, 18], [0, 0.65], {
            extrapolateLeft:  "clamp",
            extrapolateRight: "clamp",
          }),
          zIndex: 20,
        }}
      />

      {/* URL */}
      <div
        style={{
          color:         C.mustard,
          fontFamily:    FONT.display,
          fontSize:      38,
          letterSpacing: 2,
          textTransform: "uppercase",
          textShadow:    `0 0 22px rgba(241,194,50,0.55)`,
          marginBottom:  18,
          opacity:       urlOpacity,
          zIndex:        20,
          textAlign:     "center",
          paddingLeft:   24,
          paddingRight:  24,
        }}
      >
        www.welcometobharatvarsh.com
      </div>

      {/* CTA subtitle */}
      <div
        style={{
          color:         C.textSecondary,
          fontFamily:    FONT.body,
          fontSize:      20,
          letterSpacing: 2,
          opacity:       ctaOpacity,
          zIndex:        20,
        }}
      >
        Read the full story
      </div>

      {/* Tribhuj red glow stripe — bottom */}
      <div
        style={{
          position:        "absolute",
          bottom:          0,
          left:            0,
          right:           0,
          height:          3,
          backgroundColor: C.tribhujRed,
          boxShadow:       `0 0 25px ${C.tribhujRed}, 0 0 50px ${C.tribhujRed}60`,
          zIndex:          20,
        }}
      />

      {/* Brand text — bottom left */}
      <div
        style={{
          position:      "absolute",
          bottom:        20,
          left:          24,
          fontFamily:    FONT.mono,
          fontSize:      9,
          color:         C.textMuted,
          opacity:       0.4,
          letterSpacing: 1,
          zIndex:        20,
        }}
      >
        BHARATVARSH // BHV-20260415-001
      </div>
    </AbsoluteFill>
  );
};

// ─── Main Composition ─────────────────────────────────────────────────────────
export const TridentSurveillanceReel: React.FC = () => {
  const frame       = useCurrentFrame();
  const { fps }     = useVideoConfig();

  return (
    <AbsoluteFill style={{ backgroundColor: "#000" }}>

      {/* ── Audio ── */}
      {/* Background bed: Crime Scene Thrill — full 8s */}
      <Sequence from={0} durationInFrames={240}>
        <Audio
          src={staticFile("content/post-4/audio/crime-scene-thrill.wav")}
          volume={0.38}
        />
      </Sequence>
      {/* Tension riser: kicks in at 3.3s (frame 100), peaks at "IT SAW NOTHING." */}
      <Sequence from={100} durationInFrames={140}>
        <Audio
          src={staticFile("content/post-4/audio/thrill-riser.wav")}
          volume={0.72}
        />
      </Sequence>

      {/* Jim Lee background — wall phase (0-186f) */}
      <Sequence durationInFrames={186}>
        <JimLeeBackground frame={frame} />
      </Sequence>

      {/* Atmosphere (vignette, bottom fade, scanlines) — wall phase */}
      <Sequence durationInFrames={186}>
        <Atmosphere />
      </Sequence>

      {/* Film grain — wall phase */}
      <Sequence durationInFrames={186}>
        <FilmGrain frame={frame} />
      </Sequence>

      {/* CCTV HUD — wall phase */}
      <Sequence durationInFrames={186}>
        <CctvHud frame={frame} />
      </Sequence>

      {/* Text overlays — wall phase */}
      <Sequence durationInFrames={186}>
        <IncidentText frame={frame} fps={fps} />
      </Sequence>

      {/* End card — frames 186-240 (1.8s) */}
      <Sequence from={186} durationInFrames={54}>
        <EndCard localFrame={frame - 186} />
      </Sequence>

    </AbsoluteFill>
  );
};
