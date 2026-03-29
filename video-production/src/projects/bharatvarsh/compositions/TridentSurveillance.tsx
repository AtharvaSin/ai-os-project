/**
 * TridentSurveillance — BHV-20260415-001
 * "Trident on the Wall — Sector 7 Graffiti"
 *
 * 10-second surveillance tape aesthetic — 4:5 (1080×1350)
 * 0-3s:   Empty concrete wall, CCTV timestamp ticking (03:16→03:17)
 * 3-3.2s: Hard cut — glowing trident appears, timestamp jumps to 03:22
 * 3.2-7s: Slow drift on the trident wall, incident text drops
 * 7-8s:   "The Mesh was watching. It saw nothing." beat
 * 8-10s:  End card — www.welcometobharatvarsh.com
 *
 * Uses tribhuj-trident.svg (staticFile) — silhouette based on book cover.
 * Tribhuj palette: Grey #4A4A4A, Red #DC2626, Orange #FF6B35
 */

import React from "react";
import {
  AbsoluteFill,
  Img,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
  Sequence,
} from "remotion";

const FPS = 30;

// ─── Brand Tokens ────────────────────────────────────────────────────────────
const C = {
  obsidian: "#0A0D12",
  obsidian800: "#1A1F2E",
  navy: "#0B2742",
  mustard: "#F1C232",
  textPrimary: "#F0F4F8",
  textSecondary: "#A0AEC0",
  textMuted: "#718096",
  tribhujGrey: "#4A4A4A",
  tribhujRed: "#DC2626",
  tribhujOrange: "#FF6B35",
  cctvGreen: "#22C55E",
  cctvAmber: "#F59E0B",
  tridentCyan: "#17D0E3",
  tridentBlue: "#4A90D9",
};

const FONT = {
  mono: "'JetBrains Mono', 'Courier New', monospace",
  display: "'Bebas Neue', 'Impact', sans-serif",
  body: "'Inter', 'Helvetica Neue', sans-serif",
  lore: "'Crimson Pro', 'Georgia', serif",
};

// ─── Surveillance Timestamp ──────────────────────────────────────────────────
const Timestamp: React.FC<{ frame: number }> = ({ frame }) => {
  const isBefore = frame < 90;

  let timeStr: string;
  if (isBefore) {
    const seconds = 42 + Math.floor(frame / FPS);
    const mins = 16 + Math.floor(seconds / 60);
    const secs = seconds % 60;
    timeStr = `03:${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  } else {
    timeStr = "03:22:07";
  }

  const colonVisible = frame % 30 > 5;
  const displayTime = colonVisible ? timeStr : timeStr.replace(/:/g, " ");

  return (
    <div
      style={{
        position: "absolute",
        top: 28,
        left: 32,
        fontFamily: FONT.mono,
        fontSize: 22,
        color: isBefore ? C.cctvGreen : C.tribhujRed,
        letterSpacing: 2,
        zIndex: 50,
        textShadow: `0 0 8px ${isBefore ? C.cctvGreen : C.tribhujRed}`,
      }}
    >
      {displayTime}
    </div>
  );
};

// ─── CCTV HUD Overlay ────────────────────────────────────────────────────────
const CctvHud: React.FC<{ frame: number }> = ({ frame }) => {
  const isBefore = frame < 90;
  const recBlink = frame % 40 > 20;
  const hudColor = isBefore ? C.cctvGreen : C.tribhujRed;

  return (
    <>
      {/* REC indicator */}
      <div
        style={{
          position: "absolute",
          top: 28,
          right: 32,
          display: "flex",
          alignItems: "center",
          gap: 8,
          zIndex: 50,
        }}
      >
        <div
          style={{
            width: 10,
            height: 10,
            borderRadius: "50%",
            backgroundColor: C.tribhujRed,
            opacity: recBlink ? 1 : 0.3,
            boxShadow: recBlink ? `0 0 8px ${C.tribhujRed}` : "none",
          }}
        />
        <span
          style={{
            fontFamily: FONT.mono,
            fontSize: 16,
            color: hudColor,
            letterSpacing: 3,
          }}
        >
          REC
        </span>
      </div>

      {/* Camera ID */}
      <div
        style={{
          position: "absolute",
          top: 58,
          left: 32,
          fontFamily: FONT.mono,
          fontSize: 13,
          color: hudColor,
          letterSpacing: 1.5,
          opacity: 0.7,
          zIndex: 50,
        }}
      >
        CAM-S7-14C-EAST // MESH NODE 4471
      </div>

      {/* Date */}
      <div
        style={{
          position: "absolute",
          top: 58,
          right: 32,
          fontFamily: FONT.mono,
          fontSize: 13,
          color: hudColor,
          letterSpacing: 1.5,
          opacity: 0.7,
          zIndex: 50,
        }}
      >
        18-OCT-2025
      </div>

      {/* Corner brackets — 4:5 adapted positions */}
      {[
        { top: 80, left: 50 },
        { top: 80, right: 50 },
        { bottom: 70, left: 50 },
        { bottom: 70, right: 50 },
      ].map((pos, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            ...pos,
            width: 36,
            height: 36,
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

      {/* Coverage bar — bottom left */}
      <div
        style={{
          position: "absolute",
          bottom: 28,
          left: 32,
          fontFamily: FONT.mono,
          fontSize: 11,
          color: hudColor,
          letterSpacing: 1.5,
          opacity: 0.5,
          zIndex: 50,
        }}
      >
        COVERAGE 100% // UPTIME 100%
      </div>

      {/* www watermark — bottom right (brand guideline) */}
      <div
        style={{
          position: "absolute",
          bottom: 28,
          right: 32,
          fontFamily: FONT.mono,
          fontSize: 10,
          color: C.textMuted,
          letterSpacing: 1,
          opacity: 0.35,
          zIndex: 50,
        }}
      >
        www.welcometobharatvarsh.com
      </div>
    </>
  );
};

// ─── Concrete Wall + Trident Image ──────────────────────────────────────────
const ConcreteWall: React.FC<{ frame: number; showTrident: boolean }> = ({
  frame,
  showTrident,
}) => {
  // Subtle ken burns drift
  const scale = interpolate(frame, [0, 300], [1.0, 1.06], {
    extrapolateRight: "clamp",
  });
  const translateX = interpolate(frame, [0, 300], [0, -10], {
    extrapolateRight: "clamp",
  });

  // Trident entrance animation — scale up with glow
  const tridentScale = showTrident
    ? spring({
        frame: frame - 90,
        fps: FPS,
        config: { damping: 80, stiffness: 120 },
        durationInFrames: 20,
      })
    : 0;

  const tridentGlow = showTrident
    ? interpolate(frame, [90, 100, 150, 300], [60, 30, 15, 10], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      })
    : 0;

  // Pulsing glow on trident
  const pulse = showTrident
    ? Math.sin((frame - 90) * 0.06) * 5 + 10
    : 0;

  return (
    <AbsoluteFill
      style={{
        background: `
          linear-gradient(135deg, #2A2A2A 0%, #1E1E1E 30%, #252525 60%, #1A1A1A 100%)
        `,
        transform: `scale(${scale}) translateX(${translateX}px)`,
      }}
    >
      {/* Concrete texture — layered noise */}
      <div
        style={{
          position: "absolute",
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundImage: `
            radial-gradient(ellipse at 20% 50%, rgba(60,60,60,0.3) 0%, transparent 50%),
            radial-gradient(ellipse at 80% 30%, rgba(50,50,50,0.2) 0%, transparent 40%),
            radial-gradient(ellipse at 50% 80%, rgba(40,40,40,0.25) 0%, transparent 45%)
          `,
        }}
      />

      {/* Mortar lines */}
      {[18, 35, 52, 68, 85].map((pct, i) => (
        <div
          key={`h${i}`}
          style={{
            position: "absolute",
            top: `${pct}%`,
            left: 0, right: 0,
            height: 1,
            backgroundColor: "rgba(40,40,40,0.4)",
            transform: `rotate(${(i % 2 === 0 ? 0.2 : -0.1)}deg)`,
          }}
        />
      ))}
      {[15, 45, 72].map((pct, i) => (
        <div
          key={`v${i}`}
          style={{
            position: "absolute",
            left: `${pct}%`,
            top: `${10 + i * 15}%`,
            width: 1,
            height: `${25 + i * 5}%`,
            backgroundColor: "rgba(40,40,40,0.3)",
          }}
        />
      ))}

      {/* Water stain streaks */}
      <div
        style={{
          position: "absolute",
          top: "15%", left: "25%",
          width: 3, height: "35%",
          background: "linear-gradient(to bottom, rgba(80,80,70,0.3), rgba(60,60,55,0.1), transparent)",
          transform: "rotate(2deg)",
        }}
      />
      <div
        style={{
          position: "absolute",
          top: "10%", right: "30%",
          width: 2, height: "30%",
          background: "linear-gradient(to bottom, rgba(70,70,65,0.25), transparent)",
          transform: "rotate(-1deg)",
        }}
      />

      {/* Pipe shadow — left side */}
      <div
        style={{
          position: "absolute",
          top: "5%", left: "12%",
          width: 8, height: "90%",
          background: "linear-gradient(90deg, rgba(30,30,30,0.6), rgba(40,40,40,0.3), transparent)",
          borderRadius: 4,
        }}
      />

      {/* Faded government poster */}
      <div
        style={{
          position: "absolute",
          top: "14%", right: "12%",
          width: 110, height: 70,
          background: "linear-gradient(135deg, rgba(45,45,45,0.6), rgba(35,35,35,0.4))",
          border: "1px solid rgba(60,60,60,0.3)",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          opacity: 0.4,
        }}
      >
        <span
          style={{
            fontFamily: FONT.mono,
            fontSize: 7,
            color: "rgba(150,150,150,0.5)",
            letterSpacing: 1,
            textAlign: "center",
          }}
        >
          HARMONY
          <br />
          IS ORDER
        </span>
      </div>

      {/* THE TRIDENT — appears after the cut, uses SVG asset */}
      {showTrident && (
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: `translate(-50%, -55%) scale(${tridentScale})`,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          {/* Glow halo behind trident */}
          <div
            style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              width: 500,
              height: 600,
              borderRadius: "50%",
              background: `radial-gradient(ellipse at center,
                ${C.tridentCyan}${Math.round(tridentGlow + pulse).toString(16).padStart(2, "0")} 0%,
                ${C.tridentBlue}08 40%,
                transparent 70%)`,
              filter: `blur(${20 + pulse}px)`,
              pointerEvents: "none",
            }}
          />

          {/* Trident SVG asset — from book cover silhouette */}
          <Img
            src={staticFile("brand/tribhuj-trident.svg")}
            style={{
              width: 320,
              height: 480,
              filter: `
                drop-shadow(0 0 ${tridentGlow + pulse}px ${C.tridentCyan})
                drop-shadow(0 0 ${(tridentGlow + pulse) * 2}px ${C.tridentBlue}80)
              `,
              opacity: interpolate(tridentScale, [0, 1], [0, 1]),
            }}
          />

          {/* Orange cloth strip — tied near base */}
          <div
            style={{
              position: "absolute",
              bottom: 80,
              left: "54%",
              width: 28,
              height: 5,
              backgroundColor: C.tribhujOrange,
              opacity: 0.8 * tridentScale,
              transform: "rotate(12deg)",
              borderRadius: 2,
              boxShadow: `0 0 10px ${C.tribhujOrange}40`,
            }}
          />

          {/* Spray paint drips */}
          {[
            { x: -60, y: 120, h: 50, w: 2 },
            { x: 70, y: 80, h: 35, w: 2 },
            { x: -30, y: 200, h: 40, w: 1.5 },
            { x: 45, y: 260, h: 55, w: 2 },
          ].map((drip, i) => (
            <div
              key={i}
              style={{
                position: "absolute",
                top: `${drip.y}px`,
                left: `calc(50% + ${drip.x}px)`,
                width: drip.w,
                height: drip.h,
                background: `linear-gradient(to bottom, ${C.tribhujGrey}60, transparent)`,
                opacity: tridentScale * 0.6,
              }}
            />
          ))}
        </div>
      )}
    </AbsoluteFill>
  );
};

// ─── Scanline + Noise Overlay ────────────────────────────────────────────────
const CctvNoise: React.FC<{ frame: number }> = ({ frame }) => {
  const scanY = (frame * 3) % 1350; // adjusted for 4:5

  const isGlitching = frame >= 88 && frame <= 95;
  const glitchIntensity = isGlitching
    ? interpolate(frame, [88, 91, 95], [0, 1, 0], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      })
    : 0;

  return (
    <>
      {/* Scanlines */}
      <AbsoluteFill
        style={{
          backgroundImage: `repeating-linear-gradient(
            0deg,
            rgba(0,0,0,0.12) 0px,
            rgba(0,0,0,0.12) 1px,
            transparent 1px,
            transparent 3px
          )`,
          zIndex: 40,
          pointerEvents: "none",
        }}
      />

      {/* Moving scanline bar */}
      <div
        style={{
          position: "absolute",
          top: scanY,
          left: 0, right: 0,
          height: 3,
          background: `linear-gradient(90deg, transparent, rgba(200,200,200,0.08), transparent)`,
          zIndex: 41,
          pointerEvents: "none",
        }}
      />

      {/* Glitch bands at cut */}
      {isGlitching && (
        <>
          <AbsoluteFill
            style={{
              backgroundColor: `rgba(255,255,255,${glitchIntensity * 0.12})`,
              zIndex: 42,
              pointerEvents: "none",
            }}
          />
          {/* RGB displacement bands */}
          {[0.2, 0.4, 0.6, 0.8].map((pct, i) => (
            <div
              key={i}
              style={{
                position: "absolute",
                top: `${pct * 100}%`,
                left: 0, right: 0,
                height: 6 + i * 3,
                backgroundColor: i % 2 === 0
                  ? `rgba(0,255,100,${glitchIntensity * 0.15})`
                  : `rgba(255,0,50,${glitchIntensity * 0.12})`,
                transform: `translateX(${(i % 2 === 0 ? 1 : -1) * glitchIntensity * 20}px)`,
                zIndex: 42,
                pointerEvents: "none",
              }}
            />
          ))}
        </>
      )}

      {/* Film grain */}
      <AbsoluteFill
        style={{
          zIndex: 43,
          pointerEvents: "none",
          opacity: 0.07,
        }}
      >
        <svg width="100%" height="100%">
          <filter id="cctvgrain">
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.75"
              numOctaves="3"
              seed={frame % 10}
            />
          </filter>
          <rect width="100%" height="100%" filter="url(#cctvgrain)" />
        </svg>
      </AbsoluteFill>

      {/* Vignette */}
      <AbsoluteFill
        style={{
          background:
            "radial-gradient(ellipse at center, transparent 45%, rgba(0,0,0,0.5) 100%)",
          zIndex: 44,
          pointerEvents: "none",
        }}
      />
    </>
  );
};

// ─── Text Overlays ───────────────────────────────────────────────────────────
const IncidentText: React.FC<{ frame: number; fps: number }> = ({
  frame,
  fps,
}) => {
  // INCIDENT LOG header — frame 105 (3.5s)
  const headerStart = 105;
  const headerOpacity = interpolate(frame, [headerStart, headerStart + 8], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Location text — frame 125 (4.2s)
  const mainStart = 125;
  const mainOpacity = interpolate(frame, [mainStart, mainStart + 10], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // "The Mesh was watching." — frame 195 (6.5s)
  const hookStart = 195;
  const hookEnter = spring({
    frame: frame - hookStart,
    fps,
    config: { damping: 150 },
    durationInFrames: 12,
  });

  // "It saw nothing." — frame 215 (7.2s)
  const nothingStart = 215;
  const nothingEnter = spring({
    frame: frame - nothingStart,
    fps,
    config: { damping: 120 },
    durationInFrames: 15,
  });

  return (
    <AbsoluteFill style={{ zIndex: 45, pointerEvents: "none" }}>
      {/* Bottom gradient for text readability */}
      <div
        style={{
          position: "absolute",
          bottom: 0, left: 0, right: 0,
          height: "50%",
          background:
            "linear-gradient(to top, rgba(10,13,18,0.95) 0%, rgba(10,13,18,0.7) 40%, transparent 100%)",
        }}
      />

      {/* INCIDENT LOG header */}
      {frame >= headerStart && (
        <div
          style={{
            position: "absolute",
            bottom: 340,
            left: 50, right: 50,
            opacity: headerOpacity,
          }}
        >
          <div
            style={{
              fontFamily: FONT.mono,
              fontSize: 13,
              color: C.tribhujRed,
              letterSpacing: 3,
              marginBottom: 8,
            }}
          >
            INCIDENT LOG — MESH ANOMALY
          </div>
          <div
            style={{
              width: "100%",
              height: 1,
              backgroundColor: `${C.tribhujRed}40`,
            }}
          />
        </div>
      )}

      {/* Location + sector */}
      {frame >= mainStart && (
        <div
          style={{
            position: "absolute",
            bottom: 260,
            left: 50, right: 50,
            opacity: mainOpacity,
          }}
        >
          <div
            style={{
              fontFamily: FONT.lore,
              fontSize: 20,
              color: C.textSecondary,
              lineHeight: 1.6,
            }}
          >
            Sector 7, Lakshmanpur. Block 14-C.
          </div>
          <div
            style={{
              fontFamily: FONT.lore,
              fontSize: 20,
              color: C.textSecondary,
              lineHeight: 1.6,
              marginTop: 4,
            }}
          >
            A Grey Trident appeared between 03:17 and 03:22.
          </div>
        </div>
      )}

      {/* THE HOOK — "The Mesh was watching." */}
      {frame >= hookStart && (
        <div
          style={{
            position: "absolute",
            bottom: 165,
            left: 50, right: 50,
            transform: `translateY(${interpolate(hookEnter, [0, 1], [20, 0])}px)`,
            opacity: hookEnter,
          }}
        >
          {/* Mustard accent line */}
          <div
            style={{
              width: "40%",
              height: 2,
              backgroundColor: C.mustard,
              marginBottom: 14,
              boxShadow: `0 0 10px ${C.mustard}60`,
            }}
          />
          <div
            style={{
              fontFamily: FONT.display,
              fontSize: 38,
              color: C.textPrimary,
              letterSpacing: 3,
              textTransform: "uppercase",
              textShadow: `0 2px 20px rgba(10,13,18,0.9)`,
            }}
          >
            The Mesh was watching.
          </div>
        </div>
      )}

      {/* "It saw nothing." */}
      {frame >= nothingStart && (
        <div
          style={{
            position: "absolute",
            bottom: 110,
            left: 50, right: 50,
            transform: `translateY(${interpolate(nothingEnter, [0, 1], [15, 0])}px)`,
            opacity: nothingEnter,
          }}
        >
          <div
            style={{
              fontFamily: FONT.display,
              fontSize: 44,
              color: C.tribhujRed,
              letterSpacing: 4,
              textTransform: "uppercase",
              textShadow: `0 0 30px ${C.tribhujRed}80`,
            }}
          >
            It saw nothing.
          </div>
        </div>
      )}
    </AbsoluteFill>
  );
};

// ─── End Card (last 2s) ──────────────────────────────────────────────────────
const EndCard: React.FC<{ frame: number }> = ({ frame }) => {
  const localFrame = frame;
  const fadeIn = interpolate(localFrame, [0, 15], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: C.obsidian,
        opacity: fadeIn,
        justifyContent: "center",
        alignItems: "center",
        flexDirection: "column",
      }}
    >
      {/* Surveillance grid */}
      <AbsoluteFill
        style={{
          backgroundImage: `
            linear-gradient(0deg, transparent 24%, rgba(201,219,238,0.06) 25%, rgba(201,219,238,0.06) 26%, transparent 27%, transparent 74%, rgba(201,219,238,0.06) 75%, rgba(201,219,238,0.06) 76%, transparent 77%),
            linear-gradient(90deg, transparent 24%, rgba(201,219,238,0.06) 25%, rgba(201,219,238,0.06) 26%, transparent 27%, transparent 74%, rgba(201,219,238,0.06) 75%, rgba(201,219,238,0.06) 76%, transparent 77%)
          `,
          backgroundSize: "50px 50px",
          pointerEvents: "none",
          zIndex: 5,
        }}
      />

      {/* Mustard accent bar */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: "10%", right: "10%",
          height: 3,
          backgroundColor: C.mustard,
          boxShadow: `0 0 20px ${C.mustard}`,
          zIndex: 15,
        }}
      />

      {/* Small trident silhouette on end card */}
      <Img
        src={staticFile("brand/tribhuj-trident.svg")}
        style={{
          width: 80,
          height: 120,
          marginBottom: 20,
          filter: `drop-shadow(0 0 12px ${C.tridentCyan}80)`,
          opacity: interpolate(localFrame, [5, 15], [0, 0.6], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          }),
          zIndex: 20,
        }}
      />

      {/* URL */}
      <div
        style={{
          color: C.mustard,
          fontFamily: FONT.display,
          fontSize: 40,
          letterSpacing: 3,
          textTransform: "uppercase",
          textShadow: `0 0 20px rgba(241,194,50,0.6)`,
          marginBottom: 16,
          opacity: interpolate(localFrame, [8, 20], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          }),
          zIndex: 20,
        }}
      >
        www.welcometobharatvarsh.com
      </div>

      {/* CTA subtitle */}
      <div
        style={{
          color: C.textSecondary,
          fontFamily: FONT.body,
          fontSize: 20,
          letterSpacing: 2,
          opacity: interpolate(localFrame, [15, 25], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          }),
          zIndex: 20,
        }}
      >
        Read the full story
      </div>

      {/* Tribhuj glow stripe at bottom */}
      <div
        style={{
          position: "absolute",
          bottom: 0, left: 0, right: 0,
          height: 3,
          backgroundColor: C.tribhujRed,
          boxShadow: `0 0 25px ${C.tribhujRed}, 0 0 50px ${C.tribhujRed}60`,
          zIndex: 20,
        }}
      />

      {/* Bharatsena logo placeholder — bottom left (brand guideline) */}
      {/* Replace with: <Img src={staticFile("brand/bharatsena-logo.jpeg")} /> once available */}
      <div
        style={{
          position: "absolute",
          bottom: 16, left: 20,
          fontFamily: FONT.mono,
          fontSize: 9,
          color: C.textMuted,
          opacity: 0.4,
          zIndex: 20,
        }}
      >
        BHARATSENA
      </div>
    </AbsoluteFill>
  );
};

// ─── Main Composition ────────────────────────────────────────────────────────
export const TridentSurveillance: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const showTrident = frame >= 90; // 3 seconds

  return (
    <AbsoluteFill style={{ backgroundColor: "#000" }}>
      {/* Wall background — 0 to 8s (frames 0-239) */}
      <Sequence durationInFrames={240}>
        <ConcreteWall frame={frame} showTrident={showTrident} />
      </Sequence>

      {/* CCTV noise + scanlines — always on during wall phase */}
      <Sequence durationInFrames={240}>
        <CctvNoise frame={frame} />
      </Sequence>

      {/* HUD overlay — always on during wall phase */}
      <Sequence durationInFrames={240}>
        <CctvHud frame={frame} />
        <Timestamp frame={frame} />
      </Sequence>

      {/* Text overlays — appear after the cut */}
      <Sequence durationInFrames={240}>
        <IncidentText frame={frame} fps={fps} />
      </Sequence>

      {/* End card — last 2s (frames 240-300) */}
      <Sequence from={240} durationInFrames={60}>
        <EndCard frame={frame - 240} />
      </Sequence>
    </AbsoluteFill>
  );
};
