import React from "react";
import {
  AbsoluteFill,
  Easing,
  Img,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { loadFont as loadBebasNeue } from "@remotion/google-fonts/BebasNeue";
import { loadFont as loadInter } from "@remotion/google-fonts/Inter";
import { loadFont as loadCrimsonPro } from "@remotion/google-fonts/CrimsonPro";
import { loadFont as loadJetBrainsMono } from "@remotion/google-fonts/JetBrainsMono";

// Load Google Fonts (Bharatvarsh Context B typography)
const bebasNeue = loadBebasNeue();
const inter = loadInter();
const crimsonPro = loadCrimsonPro();
const jetBrainsMono = loadJetBrainsMono();

// ─── Context B Brand Tokens ────────────────────────────────────────────────
const OBSIDIAN_950 = "#0A0D12";
const MUSTARD_500 = "#F1C232";
const POWDER_300 = "#C9DBEE";
const TEXT_MUTED = "#718096";

// Film grain SVG noise pattern (from atmospheric-effects.css)
const GRAIN_SVG = `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`;

// Text content
const MAIN_TEXT = "The coast remained a doorway.";

/**
 * BharatvarshPost — 5-second animated Instagram post (1080x1080, 30fps)
 *
 * Phase 1 (0.0–1.2s): Dark → image reveal from diagonal tear
 * Phase 2 (1.2–2.0s): "1717" stamp drops in with spring bounce
 * Phase 3 (2.0–3.6s): Typewriter text — "The coast remained a doorway."
 * Phase 4 (3.6–4.5s): "Not a wound." fade-in + DECLASSIFIED watermark
 * Phase 5 (4.5–5.0s): URL + fade to black for seamless loop
 */
export const BharatvarshPost: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // ─── PHASE 1: Image reveal (frames 0–36) ─────────────────────────────────
  const imageOpacity = interpolate(frame, [9, 36], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const kenBurns = interpolate(frame, [0, 150], [1.0, 1.04], {
    extrapolateRight: "clamp",
  });

  const tearGlow = interpolate(frame, [9, 20, 36], [0, 0.25, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // ─── PHASE 2: "1717" stamp (frames 36–60) ────────────────────────────────
  const stampProgress =
    frame >= 36
      ? spring({
          frame: frame - 36,
          fps,
          config: { damping: 12, stiffness: 200, mass: 0.8 },
        })
      : 0;

  const stampY = interpolate(stampProgress, [0, 1], [-30, 0]);

  const stampOpacity = interpolate(frame, [36, 39], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const stampGlow =
    frame >= 36
      ? interpolate(frame, [36, 42, 54], [30, 8, 15], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        })
      : 0;

  // Mustard rule wipe (frames 48–60)
  const ruleWidth = interpolate(frame, [48, 60], [0, 300], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });

  // ─── PHASE 3: Typewriter (frames 60–108) ─────────────────────────────────
  const totalTypeFrames = 108 - 60;
  const charsVisible =
    frame >= 60
      ? Math.min(
          MAIN_TEXT.length,
          Math.floor(((frame - 60) / totalTypeFrames) * MAIN_TEXT.length),
        )
      : 0;
  const typewriterText = MAIN_TEXT.slice(0, charsVisible);
  const cursorVisible =
    frame >= 60 && frame <= 114 && Math.floor(frame / 4) % 2 === 0;

  // ─── PHASE 4: Counter line + watermark (frames 108–135) ──────────────────
  const counterOpacity = interpolate(frame, [108, 123], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const declassifiedOpacity = interpolate(frame, [108, 123], [0, 0.08], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const glowIntensity =
    frame >= 108
      ? interpolate(
          Math.sin(((frame - 108) / fps) * Math.PI * 2),
          [-1, 1],
          [8, 20],
        )
      : 0;

  // ─── PHASE 5: URL + fade to black (frames 135–150) ───────────────────────
  const urlOpacity = interpolate(frame, [135, 140], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const fadeOut = interpolate(frame, [144, 150], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Film grain position shift per frame
  const grainX = (frame * 17) % 256;
  const grainY = (frame * 23) % 256;

  // Scanline sweep position
  const scanlineTop = ((frame / fps) % 4) / 4;

  return (
    <AbsoluteFill style={{ backgroundColor: OBSIDIAN_950 }}>
      {/* ─── Layer 1: Background image with Ken Burns ─── */}
      <AbsoluteFill
        style={{
          opacity: imageOpacity,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          overflow: "hidden",
        }}
      >
        <Img
          src={staticFile("content/bhv-20260412-001/image.png")}
          style={{
            width: `${1080 * kenBurns}px`,
            height: `${1080 * kenBurns}px`,
            objectFit: "cover",
          }}
        />
      </AbsoluteFill>

      {/* ─── Layer 2: Dark gradient overlay for text readability ─── */}
      <AbsoluteFill
        style={{
          background: `linear-gradient(180deg,
            transparent 0%,
            transparent 30%,
            rgba(15, 20, 25, 0.3) 50%,
            rgba(15, 20, 25, 0.75) 70%,
            rgba(15, 20, 25, 0.92) 100%)`,
          opacity: imageOpacity,
          pointerEvents: "none",
        }}
      />

      {/* ─── Layer 3: Diagonal tear glow (during reveal) ─── */}
      <AbsoluteFill
        style={{
          background: `linear-gradient(135deg,
            transparent 40%,
            rgba(241, 194, 50, ${tearGlow}) 49%,
            rgba(241, 194, 50, ${tearGlow * 0.6}) 51%,
            transparent 60%)`,
          pointerEvents: "none",
        }}
      />

      {/* ─── Layer 4: Surveillance grid ─── */}
      <AbsoluteFill
        style={{
          opacity: 0.02 * imageOpacity,
          backgroundImage: `
            linear-gradient(rgba(201, 219, 238, 0.3) 1px, transparent 1px),
            linear-gradient(90deg, rgba(201, 219, 238, 0.3) 1px, transparent 1px)`,
          backgroundSize: "40px 40px",
          pointerEvents: "none",
        }}
      />

      {/* ─── Layer 5: Film grain (animated) ─── */}
      <AbsoluteFill
        style={{
          opacity: 0.04,
          backgroundImage: GRAIN_SVG,
          backgroundPosition: `${grainX}px ${grainY}px`,
          backgroundSize: "256px 256px",
          backgroundRepeat: "repeat",
          pointerEvents: "none",
          mixBlendMode: "overlay",
        }}
      />

      {/* ─── Layer 6: Vignette (medium) ─── */}
      <AbsoluteFill
        style={{
          background: `radial-gradient(
            ellipse at center,
            transparent 45%,
            rgba(10, 13, 18, 0.4) 75%,
            rgba(10, 13, 18, 0.7) 100%)`,
          pointerEvents: "none",
          opacity: imageOpacity,
        }}
      />

      {/* ─── Layer 7: Scanline sweep ─── */}
      <AbsoluteFill style={{ overflow: "hidden", pointerEvents: "none" }}>
        <div
          style={{
            position: "absolute",
            left: 0,
            width: "100%",
            height: 4,
            background:
              "linear-gradient(to bottom, transparent, rgba(201, 219, 238, 0.08), transparent)",
            top: `${scanlineTop * 100}%`,
          }}
        />
      </AbsoluteFill>

      {/* ════════════════════════════════════════════════════════════════════════
         TEXT ELEMENTS
         ════════════════════════════════════════════════════════════════════════ */}

      {/* "1717" stamp — Bebas Neue, mustard, spring-drop */}
      {frame >= 36 && (
        <div
          style={{
            position: "absolute",
            left: 80,
            top: 680 + stampY,
            opacity: stampOpacity,
            fontFamily: bebasNeue.fontFamily,
            fontSize: 140,
            fontWeight: 400,
            color: MUSTARD_500,
            letterSpacing: 4,
            lineHeight: 1,
            textShadow: `0 0 ${stampGlow}px rgba(241, 194, 50, 0.35)`,
            zIndex: 30,
          }}
        >
          1717
        </div>
      )}

      {/* Mustard horizontal rule — wipes left to right */}
      {frame >= 48 && (
        <div
          style={{
            position: "absolute",
            left: 80,
            top: 820,
            width: ruleWidth,
            height: 2,
            backgroundColor: MUSTARD_500,
            opacity: 0.8,
            zIndex: 30,
          }}
        />
      )}

      {/* Typewriter text — Inter, powder blue */}
      {frame >= 60 && (
        <div
          style={{
            position: "absolute",
            left: 80,
            top: 842,
            fontFamily: inter.fontFamily,
            fontSize: 26,
            fontWeight: 600,
            color: POWDER_300,
            letterSpacing: 0.5,
            zIndex: 30,
            whiteSpace: "nowrap",
          }}
        >
          {typewriterText}
          {cursorVisible && (
            <span style={{ color: POWDER_300, opacity: 0.6, marginLeft: 2 }}>
              ▎
            </span>
          )}
        </div>
      )}

      {/* "Not a wound." — Crimson Pro italic, mustard, glow pulse */}
      {frame >= 108 && (
        <div
          style={{
            position: "absolute",
            left: 80,
            top: 882,
            fontFamily: crimsonPro.fontFamily,
            fontSize: 22,
            fontWeight: 400,
            fontStyle: "italic",
            color: MUSTARD_500,
            opacity: counterOpacity,
            textShadow: `0 0 ${glowIntensity}px rgba(241, 194, 50, 0.4)`,
            zIndex: 30,
          }}
        >
          Not a wound.
        </div>
      )}

      {/* DECLASSIFIED watermark — centered, faint, rotated */}
      {frame >= 108 && (
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%) rotate(-8deg)",
            fontFamily: jetBrainsMono.fontFamily,
            fontSize: 48,
            fontWeight: 800,
            letterSpacing: 12,
            textTransform: "uppercase" as const,
            color: POWDER_300,
            opacity: declassifiedOpacity,
            pointerEvents: "none",
            whiteSpace: "nowrap",
            zIndex: 25,
          }}
        >
          DECLASSIFIED
        </div>
      )}

      {/* URL — JetBrains Mono, muted, bottom center */}
      {frame >= 135 && (
        <div
          style={{
            position: "absolute",
            bottom: 40,
            left: 0,
            right: 0,
            textAlign: "center",
            fontFamily: jetBrainsMono.fontFamily,
            fontSize: 11,
            fontWeight: 600,
            letterSpacing: 1,
            color: TEXT_MUTED,
            opacity: urlOpacity,
            zIndex: 30,
          }}
        >
          <span style={{ color: MUSTARD_500, marginRight: 8 }}>
            {"\u2022"}
          </span>
          welcometobharatvarsh.com
        </div>
      )}

      {/* ─── Fade to black (loop reset) ─── */}
      <AbsoluteFill
        style={{
          backgroundColor: OBSIDIAN_950,
          opacity: fadeOut,
          zIndex: 50,
          pointerEvents: "none",
        }}
      />
    </AbsoluteFill>
  );
};
