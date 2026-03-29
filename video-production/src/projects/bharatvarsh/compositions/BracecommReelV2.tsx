/**
 * BracecommReelV2 — BHV-20260427-001 (10s)
 * Product-demo exploded-view reel — inspired by 3D product teardown reels.
 *
 * Style: Assembled device → exploded view with component callouts →
 *        stats overlay → context shot → hook. Pure black bg throughout.
 *        Bold subtitle text with keyword highlighting (cyan box).
 *
 * Timeline (300 frames at 30fps):
 *   Scene 1  0–45f    (0–1.5s)   Hero intro — assembled device drifts in
 *   Scene 2  45–120f  (1.5–4s)   Explode reveal — crossfade to exploded + callouts
 *   Scene 3  120–180f (4–6s)     Stat overlay — "98.6% ADOPTION"
 *   Scene 4  180–240f (6–8s)     Context headline — checkpoint + "ZERO CRIME"
 *   Scene 5  240–300f (8–10s)    Hook lockup — quote + URL
 *
 * Audio: PhonkBGM1 (from 10s mark)
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
  black: "#000000",
  obsidian: "#0A0D12",
  cyan: "#17D0E3",
  mustard: "#F1C232",
  amber: "#F59E0B",
  white: "#FFFFFF",
  textPrimary: "#F0F4F8",
  textSecondary: "#A0AEC0",
  textMuted: "#718096",
};

const FONT = {
  mono: "'JetBrains Mono', 'Courier New', monospace",
  display: "'Bebas Neue', 'Impact', sans-serif",
  body: "'Inter', 'Helvetica Neue', sans-serif",
};

const IMG = {
  assembled: staticFile("content/post-bracecomm/image1_device_hero.jpg"),
  exploded: staticFile("content/post-bracecomm/image4_exploded.jpg"),
  checkpoint: staticFile("content/post-bracecomm/image3_urban_context.jpg"),
};

// ─── Film Grain ──────────────────────────────────────────────────────────────
const FilmGrain: React.FC = () => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const seed = frame % 12;
  return (
    <AbsoluteFill style={{ zIndex: 90, pointerEvents: "none", opacity: 0.05 }}>
      <svg width={width} height={height}>
        <filter id={`bcv2-grain-${seed}`}>
          <feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves={3} seed={seed} />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <rect width={width} height={height} fill="rgba(200,200,200,0.5)" filter={`url(#bcv2-grain-${seed})`} />
      </svg>
    </AbsoluteFill>
  );
};

// ─── Highlighted Subtitle (reference style) ──────────────────────────────────
// Renders text with specific words highlighted in a colored box
const HighlightedText: React.FC<{
  parts: Array<{ text: string; highlight?: boolean }>;
  fontSize?: number;
  opacity?: number;
  highlightColor?: string;
}> = ({ parts, fontSize = 32, opacity = 1, highlightColor = C.cyan }) => (
  <div
    style={{
      display: "flex",
      flexWrap: "wrap",
      justifyContent: "center",
      alignItems: "center",
      gap: 8,
      opacity,
    }}
  >
    {parts.map((part, i) => (
      <span
        key={i}
        style={{
          fontFamily: FONT.display,
          fontSize,
          color: part.highlight ? C.black : C.white,
          letterSpacing: 3,
          lineHeight: 1.4,
          padding: part.highlight ? "2px 10px" : "0",
          backgroundColor: part.highlight ? highlightColor : "transparent",
          borderRadius: part.highlight ? 4 : 0,
        }}
      >
        {part.text}
      </span>
    ))}
  </div>
);

// ─── Component Callout Label ─────────────────────────────────────────────────
const CalloutLabel: React.FC<{
  text: string;
  x: string;
  y: string;
  opacity: number;
  translateY?: number;
  lineDirection?: "left" | "right";
}> = ({ text, x, y, opacity, translateY = 0, lineDirection = "right" }) => (
  <div
    style={{
      position: "absolute",
      left: x,
      top: y,
      display: "flex",
      alignItems: "center",
      gap: 8,
      opacity,
      transform: `translateY(${translateY}px)`,
      zIndex: 30,
      flexDirection: lineDirection === "left" ? "row-reverse" : "row",
    }}
  >
    {/* Connector line */}
    <div
      style={{
        width: 30,
        height: 1,
        backgroundColor: C.cyan,
        boxShadow: `0 0 6px ${C.cyan}80`,
      }}
    />
    {/* Dot */}
    <div
      style={{
        width: 5,
        height: 5,
        borderRadius: "50%",
        backgroundColor: C.cyan,
        boxShadow: `0 0 8px ${C.cyan}`,
        flexShrink: 0,
      }}
    />
    {/* Label */}
    <div
      style={{
        fontFamily: FONT.mono,
        fontSize: 11,
        color: C.cyan,
        letterSpacing: 2,
        whiteSpace: "nowrap",
        textShadow: `0 0 10px ${C.cyan}40`,
      }}
    >
      {text}
    </div>
  </div>
);

// ─── Scene 1: Hero Intro (0–45f) ─────────────────────────────────────────────
const HeroIntro: React.FC<{ frame: number; isVertical: boolean }> = ({ frame, isVertical }) => {
  // Device fades in and drifts upward slightly
  const deviceOpacity = interpolate(frame, [0, 18], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const deviceY = interpolate(frame, [0, 45], [30, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const deviceScale = interpolate(frame, [0, 45], [0.92, 1.0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Title text
  const titleOpacity = interpolate(frame, [12, 24], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // BVN chyron
  const chyronOpacity = interpolate(frame, [20, 32], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{ backgroundColor: C.black }}>
      {/* Assembled device — centered */}
      <div
        style={{
          position: "absolute",
          top: isVertical ? "18%" : "8%",
          left: "50%",
          transform: `translateX(-50%) translateY(${deviceY}px) scale(${deviceScale})`,
          opacity: deviceOpacity,
          width: isVertical ? "75%" : "45%",
          zIndex: 10,
        }}
      >
        <Img
          src={IMG.assembled}
          style={{
            width: "100%",
            height: "auto",
            objectFit: "contain",
            filter: "brightness(1.05) contrast(1.08)",
          }}
        />
        {/* Subtle cyan glow underneath */}
        <div
          style={{
            position: "absolute",
            bottom: "-10%",
            left: "20%",
            width: "60%",
            height: "30%",
            background: `radial-gradient(ellipse at center, ${C.cyan}15 0%, transparent 70%)`,
            filter: "blur(20px)",
            pointerEvents: "none",
          }}
        />
      </div>

      {/* Title: BRACECOMM 4.0 */}
      <div
        style={{
          position: "absolute",
          bottom: isVertical ? "18%" : "15%",
          left: 0,
          right: 0,
          textAlign: "center",
          opacity: titleOpacity,
          zIndex: 20,
        }}
      >
        <div
          style={{
            fontFamily: FONT.display,
            fontSize: isVertical ? 56 : 48,
            color: C.white,
            letterSpacing: 8,
          }}
        >
          BRACECOMM 4.0
        </div>
        <div
          style={{
            fontFamily: FONT.mono,
            fontSize: 12,
            color: C.mustard,
            letterSpacing: 4,
            marginTop: 10,
            opacity: chyronOpacity,
          }}
        >
          BVN-24x7 · CIVIC HARMONY REPORT · OCTOBER 15, 2025
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ─── Scene 2: Explode Reveal (45–120f) ───────────────────────────────────────
const ExplodeReveal: React.FC<{ frame: number; fps: number; isVertical: boolean }> = ({
  frame,
  fps,
  isVertical,
}) => {
  const localFrame = frame - 45;
  if (localFrame < 0) return null;

  // Crossfade: assembled → exploded
  const assembledOpacity = interpolate(localFrame, [0, 20], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const explodedOpacity = interpolate(localFrame, [8, 28], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Slow zoom into exploded view
  const explodedScale = interpolate(localFrame, [0, 75], [0.88, 1.02], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Callout labels — staggered entrance
  const callout1 = spring({
    frame: localFrame - 25,
    fps,
    config: { damping: 120 },
    durationInFrames: 15,
  });
  const callout2 = spring({
    frame: localFrame - 35,
    fps,
    config: { damping: 120 },
    durationInFrames: 15,
  });
  const callout3 = spring({
    frame: localFrame - 45,
    fps,
    config: { damping: 120 },
    durationInFrames: 15,
  });

  // Bottom subtitle text
  const subtitleOpacity = interpolate(localFrame, [30, 42], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const imgWidth = isVertical ? "80%" : "50%";
  const imgTop = isVertical ? "12%" : "5%";

  return (
    <AbsoluteFill style={{ backgroundColor: C.black }}>
      {/* Assembled device — fading out */}
      <div
        style={{
          position: "absolute",
          top: imgTop,
          left: "50%",
          transform: `translateX(-50%) scale(${explodedScale})`,
          opacity: assembledOpacity,
          width: imgWidth,
          zIndex: 10,
        }}
      >
        <Img
          src={IMG.assembled}
          style={{
            width: "100%",
            height: "auto",
            objectFit: "contain",
            filter: "brightness(1.05) contrast(1.08)",
          }}
        />
      </div>

      {/* Exploded view — fading in */}
      <div
        style={{
          position: "absolute",
          top: imgTop,
          left: "50%",
          transform: `translateX(-50%) scale(${explodedScale})`,
          opacity: explodedOpacity,
          width: imgWidth,
          zIndex: 11,
        }}
      >
        <Img
          src={IMG.exploded}
          style={{
            width: "100%",
            height: "auto",
            objectFit: "contain",
            filter: "brightness(1.05) contrast(1.08)",
          }}
        />
      </div>

      {/* Component callout labels */}
      {isVertical ? (
        <>
          <CalloutLabel
            text="MESH INTERFACE"
            x="12%"
            y="22%"
            opacity={callout1}
            translateY={interpolate(callout1, [0, 1], [10, 0])}
            lineDirection="right"
          />
          <CalloutLabel
            text="BIOMETRIC SCANNER"
            x="52%"
            y="44%"
            opacity={callout2}
            translateY={interpolate(callout2, [0, 1], [10, 0])}
            lineDirection="left"
          />
          <CalloutLabel
            text="SENSOR ARRAY"
            x="12%"
            y="58%"
            opacity={callout3}
            translateY={interpolate(callout3, [0, 1], [10, 0])}
            lineDirection="right"
          />
        </>
      ) : (
        <>
          <CalloutLabel
            text="MESH INTERFACE"
            x="8%"
            y="18%"
            opacity={callout1}
            translateY={interpolate(callout1, [0, 1], [10, 0])}
          />
          <CalloutLabel
            text="BIOMETRIC SCANNER"
            x="60%"
            y="42%"
            opacity={callout2}
            translateY={interpolate(callout2, [0, 1], [10, 0])}
            lineDirection="left"
          />
          <CalloutLabel
            text="SENSOR ARRAY"
            x="8%"
            y="62%"
            opacity={callout3}
            translateY={interpolate(callout3, [0, 1], [10, 0])}
          />
        </>
      )}

      {/* Bottom subtitle: keyword highlight style */}
      <div
        style={{
          position: "absolute",
          bottom: isVertical ? "10%" : "8%",
          left: 0,
          right: 0,
          textAlign: "center",
          zIndex: 20,
        }}
      >
        <HighlightedText
          parts={[
            { text: "COMMAND" },
            { text: "AT YOUR WRIST.", highlight: true },
          ]}
          fontSize={isVertical ? 36 : 30}
          opacity={subtitleOpacity}
        />
      </div>
    </AbsoluteFill>
  );
};

// ─── Scene 3: Stat Overlay (120–180f) ────────────────────────────────────────
const StatOverlay: React.FC<{ frame: number; fps: number; isVertical: boolean }> = ({
  frame,
  fps,
  isVertical,
}) => {
  const localFrame = frame - 120;
  if (localFrame < 0) return null;

  // Exploded image stays as dimmed bg
  const bgScale = interpolate(localFrame, [0, 60], [1.02, 1.06], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // "98.6%" slam
  const statEnter = spring({
    frame: localFrame - 4,
    fps,
    config: { stiffness: 200, damping: 22 },
    durationInFrames: 12,
  });

  // "ADOPTION" subtitle
  const adoptionOpacity = interpolate(localFrame, [16, 24], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const adoptionY = interpolate(localFrame, [16, 24], [15, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Horizontal pulse lines
  const lineOpacity = interpolate(localFrame, [10, 18, 40], [0, 0.5, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const lineWidth = interpolate(localFrame, [10, 30], [0, 100], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{ backgroundColor: C.black }}>
      {/* Dimmed exploded view bg */}
      <div
        style={{
          position: "absolute",
          top: isVertical ? "12%" : "5%",
          left: "50%",
          transform: `translateX(-50%) scale(${bgScale})`,
          opacity: 0.2,
          width: isVertical ? "80%" : "50%",
          zIndex: 5,
        }}
      >
        <Img
          src={IMG.exploded}
          style={{
            width: "100%",
            height: "auto",
            objectFit: "contain",
            filter: "brightness(0.6) blur(2px)",
          }}
        />
      </div>

      {/* Central stat */}
      <AbsoluteFill
        style={{
          justifyContent: "center",
          alignItems: "center",
          zIndex: 20,
        }}
      >
        {/* Horizontal pulse lines behind stat */}
        <div
          style={{
            position: "absolute",
            width: `${lineWidth}%`,
            height: 1,
            backgroundColor: C.cyan,
            opacity: lineOpacity,
            boxShadow: `0 0 15px ${C.cyan}60`,
          }}
        />

        {/* "98.6%" */}
        <div
          style={{
            fontFamily: FONT.display,
            fontSize: isVertical ? 150 : 130,
            color: C.white,
            letterSpacing: 6,
            opacity: statEnter,
            transform: `scale(${interpolate(statEnter, [0, 1], [1.6, 1])})`,
            textShadow: `0 0 80px ${C.cyan}30, 0 4px 40px rgba(0,0,0,0.8)`,
            lineHeight: 1,
          }}
        >
          98.6%
        </div>

        {/* "ADOPTION" */}
        <div
          style={{
            fontFamily: FONT.mono,
            fontSize: isVertical ? 24 : 20,
            color: C.cyan,
            letterSpacing: 10,
            marginTop: 16,
            opacity: adoptionOpacity,
            transform: `translateY(${adoptionY}px)`,
          }}
        >
          ADOPTION
        </div>
      </AbsoluteFill>

      {/* Bottom subtitle */}
      <div
        style={{
          position: "absolute",
          bottom: isVertical ? "10%" : "8%",
          left: 0,
          right: 0,
          textAlign: "center",
          zIndex: 20,
        }}
      >
        <HighlightedText
          parts={[
            { text: "THE MESH" },
            { text: "IN YOUR SLEEVE.", highlight: true },
          ]}
          fontSize={isVertical ? 32 : 26}
          opacity={adoptionOpacity}
        />
      </div>
    </AbsoluteFill>
  );
};

// ─── Scene 4: Context Headline (180–240f) ────────────────────────────────────
const ContextHeadline: React.FC<{ frame: number; fps: number; isVertical: boolean }> = ({
  frame,
  fps,
  isVertical,
}) => {
  const localFrame = frame - 180;
  if (localFrame < 0) return null;

  // Background image
  const bgOpacity = interpolate(localFrame, [0, 10], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const bgScale = interpolate(localFrame, [0, 60], [1.08, 1.0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // "ZONES 4 & 5" text
  const line1Enter = spring({
    frame: localFrame - 6,
    fps,
    config: { damping: 120 },
    durationInFrames: 12,
  });

  // "ZERO CRIME" text
  const line2Enter = spring({
    frame: localFrame - 15,
    fps,
    config: { damping: 120 },
    durationInFrames: 12,
  });

  // Chyron
  const chyronOpacity = interpolate(localFrame, [18, 28], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{ backgroundColor: C.black }}>
      {/* Checkpoint bg */}
      <AbsoluteFill
        style={{
          opacity: bgOpacity * 0.45,
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
            filter: "brightness(0.5) contrast(1.15)",
          }}
        />
      </AbsoluteFill>

      {/* Dark overlay */}
      <AbsoluteFill
        style={{
          background: "linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.4) 50%, rgba(0,0,0,0.7) 100%)",
          zIndex: 8,
        }}
      />

      {/* Text block — centered */}
      <AbsoluteFill
        style={{
          justifyContent: "center",
          alignItems: "center",
          zIndex: 20,
        }}
      >
        {/* "ZONES 4 & 5" */}
        <div
          style={{
            fontFamily: FONT.display,
            fontSize: isVertical ? 72 : 60,
            color: C.white,
            letterSpacing: 6,
            opacity: line1Enter,
            transform: `translateX(${interpolate(line1Enter, [0, 1], [-40, 0])}px)`,
            textShadow: "0 2px 30px rgba(0,0,0,0.9)",
          }}
        >
          ZONES 4 & 5
        </div>

        {/* Mustard accent bar */}
        <div
          style={{
            width: isVertical ? 200 : 160,
            height: 3,
            backgroundColor: C.mustard,
            marginTop: 12,
            marginBottom: 12,
            opacity: line2Enter,
            boxShadow: `0 0 15px ${C.mustard}60`,
          }}
        />

        {/* "ZERO CRIME" */}
        <div
          style={{
            fontFamily: FONT.display,
            fontSize: isVertical ? 90 : 76,
            color: C.cyan,
            letterSpacing: 8,
            opacity: line2Enter,
            transform: `translateX(${interpolate(line2Enter, [0, 1], [40, 0])}px)`,
            textShadow: `0 0 40px ${C.cyan}40, 0 2px 30px rgba(0,0,0,0.9)`,
          }}
        >
          ZERO CRIME
        </div>
      </AbsoluteFill>

      {/* Bottom chyron bar */}
      <div
        style={{
          position: "absolute",
          bottom: isVertical ? "8%" : "6%",
          left: 0,
          right: 0,
          opacity: chyronOpacity,
          zIndex: 20,
        }}
      >
        <HighlightedText
          parts={[
            { text: "DEPT. OF", highlight: true },
            { text: "CIVIC HARMONY" },
          ]}
          fontSize={isVertical ? 28 : 22}
          opacity={chyronOpacity}
          highlightColor={C.mustard}
        />
      </div>
    </AbsoluteFill>
  );
};

// ─── Scene 5: Hook Lockup (240–300f) ─────────────────────────────────────────
const HookLockup: React.FC<{ frame: number; isVertical: boolean }> = ({
  frame,
  isVertical,
}) => {
  const localFrame = frame - 240;
  if (localFrame < 0) return null;

  // Ghost bg
  const ghostOpacity = interpolate(localFrame, [0, 15], [0, 0.12], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Line 1
  const line1Opacity = interpolate(localFrame, [5, 22], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Line 2
  const line2Opacity = interpolate(localFrame, [18, 35], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // URL
  const urlOpacity = interpolate(localFrame, [38, 52], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{ backgroundColor: C.black }}>
      {/* Ghost assembled device */}
      <AbsoluteFill style={{ opacity: ghostOpacity }}>
        <Img
          src={IMG.assembled}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            filter: "blur(25px) brightness(0.5)",
          }}
        />
      </AbsoluteFill>

      {/* Quote text — centered */}
      <AbsoluteFill
        style={{
          justifyContent: "center",
          alignItems: "center",
          zIndex: 20,
          padding: isVertical ? "0 40px" : "0 100px",
        }}
      >
        <div style={{ textAlign: "center" }}>
          {/* Line 1 */}
          <div
            style={{
              fontFamily: FONT.mono,
              fontSize: isVertical ? 24 : 22,
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
              fontSize: isVertical ? 24 : 22,
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
              fontSize: isVertical ? 26 : 24,
              color: C.mustard,
              letterSpacing: 3,
              marginTop: 36,
              opacity: urlOpacity,
              textShadow: `0 0 20px ${C.mustard}50`,
            }}
          >
            WWW.WELCOMETOBHARATVARSH.COM
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
          bottom: 14,
          left: 16,
          fontFamily: FONT.mono,
          fontSize: 9,
          color: C.textMuted,
          opacity: 0.3 * urlOpacity,
          letterSpacing: 1,
          zIndex: 30,
        }}
      >
        BHARATVARSH // BHV-20260427-001
      </div>
    </AbsoluteFill>
  );
};

// ─── Scene Transition (quick black flash) ────────────────────────────────────
const Flash: React.FC<{ frame: number; at: number; dur?: number }> = ({
  frame,
  at,
  dur = 5,
}) => {
  const progress = interpolate(frame, [at, at + dur], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  if (progress <= 0 || progress >= 1) return null;
  return (
    <AbsoluteFill
      style={{
        backgroundColor: C.black,
        opacity: interpolate(progress, [0, 0.4, 1], [0, 0.85, 0]),
        zIndex: 80,
        pointerEvents: "none",
      }}
    />
  );
};

// ─── Main Composition ────────────────────────────────────────────────────────
export const BracecommReelV2: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const isVertical = height > width;

  // Audio volume envelope
  const bgmVolume = interpolate(
    frame,
    [0, 15, 45, 120, 240, 280, 300],
    [0, 0.55, 0.7, 0.75, 0.6, 0.2, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  return (
    <AbsoluteFill style={{ backgroundColor: C.black }}>
      {/* Audio: PhonkBGM1 from 10s mark */}
      <Sequence from={0} durationInFrames={300}>
        <Audio
          src={staticFile("content/post-bracecomm/audio/phonk-bgm.wav")}
          volume={bgmVolume}
        />
      </Sequence>

      {/* Scene 1: Hero Intro (0–45f) */}
      <Sequence durationInFrames={45}>
        <HeroIntro frame={frame} isVertical={isVertical} />
      </Sequence>

      {/* Scene 2: Explode Reveal (45–120f) */}
      <Sequence from={45} durationInFrames={75}>
        <ExplodeReveal frame={frame} fps={fps} isVertical={isVertical} />
      </Sequence>

      {/* Scene 3: Stat Overlay (120–180f) */}
      <Sequence from={120} durationInFrames={60}>
        <StatOverlay frame={frame} fps={fps} isVertical={isVertical} />
      </Sequence>

      {/* Scene 4: Context Headline (180–240f) */}
      <Sequence from={180} durationInFrames={60}>
        <ContextHeadline frame={frame} fps={fps} isVertical={isVertical} />
      </Sequence>

      {/* Scene 5: Hook Lockup (240–300f) */}
      <Sequence from={240} durationInFrames={60}>
        <HookLockup frame={frame} isVertical={isVertical} />
      </Sequence>

      {/* Scene transitions */}
      <Flash frame={frame} at={43} dur={5} />
      <Flash frame={frame} at={118} dur={5} />
      <Flash frame={frame} at={178} dur={5} />
      <Flash frame={frame} at={238} dur={5} />

      {/* Global overlays */}
      <FilmGrain />
    </AbsoluteFill>
  );
};
