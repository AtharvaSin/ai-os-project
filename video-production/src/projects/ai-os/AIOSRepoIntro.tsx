import React from "react";
import {
  AbsoluteFill,
  Easing,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { loadFont as loadSpaceGrotesk } from "@remotion/google-fonts/SpaceGrotesk";
import { loadFont as loadInter } from "@remotion/google-fonts/Inter";
import { AIU_COLORS, SPRING_CONFIG } from "../aiu/aiu-legacy-constants";

// Note: AIU_COLORS and SPRING_CONFIG are imported from the legacy AI&U constants.
// This component was originally part of the remotion_video project.

const { fontFamily: spaceGrotesk } = loadSpaceGrotesk();
const { fontFamily: inter } = loadInter();

const labelStyle: React.CSSProperties = {
  fontFamily: inter,
  fontSize: 28,
  fontWeight: 500,
  letterSpacing: 6,
  textTransform: "uppercase",
};

export const AIOSRepoIntro: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const introProgress = spring({
    fps,
    frame,
    config: SPRING_CONFIG,
  });

  const outroOpacity = interpolate(frame, [132, 150], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const titleY = interpolate(introProgress, [0, 1], [70, 0]);
  const titleOpacity = interpolate(frame, [0, 18], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const cardScale = interpolate(introProgress, [0, 1], [0.92, 1], {
    easing: Easing.out(Easing.cubic),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const cardOpacity = interpolate(frame, [10, 34], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const lineWidth = interpolate(frame, [24, 70], [0, 1000], {
    easing: Easing.out(Easing.quad),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const pillOpacity = interpolate(frame, [46, 74], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const pulse = interpolate(frame, [0, 75, 150], [1.04, 1, 1.02], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        background:
          "radial-gradient(circle at top left, #20394f 0%, #0c1620 42%, #06090d 100%)",
        color: AIU_COLORS.cloudWhite,
        opacity: outroOpacity,
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: -120,
          background:
            "radial-gradient(circle at 20% 20%, rgba(72,221,113,0.16), transparent 34%), radial-gradient(circle at 78% 28%, rgba(220,141,82,0.18), transparent 28%), radial-gradient(circle at 50% 80%, rgba(91,106,191,0.18), transparent 32%)",
          transform: `scale(${pulse})`,
        }}
      />

      <AbsoluteFill
        style={{
          justifyContent: "center",
          alignItems: "center",
          padding: "96px 120px",
        }}
      >
        <div
          style={{
            width: "100%",
            maxWidth: 1480,
            padding: "72px 80px",
            borderRadius: 40,
            background: "rgba(8, 12, 18, 0.62)",
            border: "1px solid rgba(255,255,255,0.10)",
            boxShadow: "0 24px 80px rgba(0, 0, 0, 0.35)",
            backdropFilter: "blur(14px)",
            transform: `scale(${cardScale})`,
            opacity: cardOpacity,
          }}
        >
          <div
            style={{
              ...labelStyle,
              color: AIU_COLORS.amber,
              opacity: titleOpacity,
              transform: `translateY(${titleY}px)`,
            }}
          >
            AI Operating System
          </div>

          <div
            style={{
              marginTop: 22,
              fontFamily: spaceGrotesk,
              fontSize: 108,
              lineHeight: 1,
              fontWeight: 700,
              letterSpacing: -4,
              opacity: titleOpacity,
              transform: `translateY(${titleY}px)`,
            }}
          >
            Personal AI Ops.
          </div>

          <div
            style={{
              marginTop: 18,
              width: lineWidth,
              maxWidth: "100%",
              height: 6,
              borderRadius: 999,
              background:
                "linear-gradient(90deg, rgba(220,141,82,1) 0%, rgba(72,221,113,1) 55%, rgba(91,106,191,1) 100%)",
            }}
          />

          <div
            style={{
              marginTop: 32,
              fontFamily: inter,
              fontSize: 34,
              lineHeight: 1.45,
              color: "rgba(254,254,254,0.88)",
              maxWidth: 1160,
              opacity: interpolate(frame, [30, 60], [0, 1], {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
              }),
            }}
          >
            Claude + LangGraph + GCP working together across professional
            work, creative projects, and personal operations.
          </div>

          <div
            style={{
              marginTop: 44,
              display: "flex",
              gap: 18,
              flexWrap: "wrap",
              opacity: pillOpacity,
            }}
          >
            {["Category A: Claude", "Category B: Cloud Functions", "Category C: LangGraph"].map(
              (item) => (
                <div
                  key={item}
                  style={{
                    padding: "14px 22px",
                    borderRadius: 999,
                    background: "rgba(255,255,255,0.08)",
                    border: "1px solid rgba(255,255,255,0.12)",
                    fontFamily: inter,
                    fontSize: 24,
                    color: AIU_COLORS.cloudWhite,
                  }}
                >
                  {item}
                </div>
              ),
            )}
          </div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
