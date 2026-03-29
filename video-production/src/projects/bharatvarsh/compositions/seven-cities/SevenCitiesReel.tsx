/**
 * SevenCitiesReel.tsx — BHV-20260503-001 "20-10: Seven Cities Burn"
 *
 * Master composition for the 18-second BVN-24x7 breaking news broadcast reel.
 * Works for both 9:16 (1080×1920 reel) and 16:9 (1920×1080 trailer)
 * via useVideoConfig orientation detection.
 *
 * IMPORTANT: All scene components use ABSOLUTE frame numbers via useCurrentFrame().
 * We do NOT wrap them in <Sequence> (which remaps frame to 0-based local).
 * Instead, each scene is rendered simultaneously and self-manages visibility
 * based on absolute frame ranges.
 *
 * Timeline (540 frames at 30fps, 1.5× original):
 *   Scene 1  0–67f     (0–2.25s)    Standby — BVN-24x7 logo, dateline, LIVE
 *   Scene 2  67–135f   (2.25–4.5s)  BREAKING — Red banner, national map, city dots
 *   Scene 3  135–247f  (4.5–8.25s)  Street carnage — Marketplace, headline, chyron
 *   Scene 4  247–360f  (8.25–12.0s) War room — ANOMALY: NONE, header, ticker
 *   Scene 5  360–450f  (12.0–15.0s) The claim — Trident draw-on, CCTV stamp
 *   Scene 6  450–540f  (15.0–18.0s) The question — Hook lockup, CTA, author
 *
 * Audio: PhonkBGM1.wav from the 10-second mark, volume envelope shaped per scene.
 *
 * Brand: Context B — Obsidian #0A0D12, Mustard #F1C232, Cyan #17D0E3,
 *        Emergency Red #FF2D2D. Bebas Neue + JetBrains Mono. news_article channel.
 *
 * Spoiler safety: Post frames 20-10 as genuine Tribhuj attack.
 *                 Do NOT reveal false-flag / Pratap orchestration.
 */

import React from "react";
import {
  AbsoluteFill,
  Audio,
  Img,
  interpolate,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

// ─── Scene Components ───────────────────────────────────────────────────────
import { BVNLogo } from "./BVNLogo";
import { BreakingBanner } from "./BreakingBanner";
import { NationalMap } from "./NationalMap";
import { DustParticles } from "./DustParticles";
import { ChyronBar } from "./ChyronBar";
import { WarRoomOverlay } from "./WarRoomOverlay";
import { ScrollingTicker } from "./ScrollingTicker";
import { TridentDrawOn } from "./TridentDrawOn";
import { HookLockup } from "./HookLockup";

// ─── Shared Components ──────────────────────────────────────────────────────
import { BrandOverlay } from "./BrandOverlay";
import { SceneTransition } from "./SceneTransition";

// ─── Constants ──────────────────────────────────────────────────────────────
import { C, FONT, SCENE, TEXT_SHADOW_HEAVY, SAFE_MARGIN } from "./constants";

// ─── Image & Audio Paths ────────────────────────────────────────────────────
const IMG = {
  marketplace: staticFile("content/post-seven-cities/image1_marketplace_aftermath.jpg"),
  warRoom: staticFile("content/post-seven-cities/image2_war_room.jpg"),
};
const AUDIO_BGM = staticFile("content/post-seven-cities/phonk-bgm.wav");

// ─── Helpers ────────────────────────────────────────────────────────────────
const inScene = (frame: number, scene: { start: number; end: number }): boolean =>
  frame >= scene.start && frame < scene.end;

// ─── Scene 3: Street Carnage ────────────────────────────────────────────────
const StreetCarnageScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const isVertical = height > width;

  if (!inScene(frame, SCENE.street)) return null;

  const localFrame = frame - SCENE.street.start;
  const sceneDuration = SCENE.street.end - SCENE.street.start;

  const bgScale = interpolate(localFrame, [0, sceneDuration], [1.0, 1.02], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const bgTranslateY = interpolate(localFrame, [0, sceneDuration], [0, -8], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const bgOpacity = interpolate(localFrame, [0, 8], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Headline: "LAKSHMANPUR MARKETPLACE — GROUND ZERO" fades in at frame 150
  const headlineOpacity = interpolate(frame, [150, 165], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const headlineFontSize = isVertical ? 28 : 24;

  return (
    <AbsoluteFill style={{ backgroundColor: C.obsidian, zIndex: 3 }}>
      <AbsoluteFill
        style={{
          opacity: bgOpacity,
          transform: `scale(${bgScale}) translateY(${bgTranslateY}px)`,
        }}
      >
        <Img
          src={IMG.marketplace}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            filter: "brightness(0.55) contrast(1.1)",
          }}
        />
        <AbsoluteFill
          style={{
            background:
              "radial-gradient(ellipse at center, rgba(10,13,18,0.3) 0%, rgba(10,13,18,0.7) 100%)",
          }}
        />
      </AbsoluteFill>

      {/* Headline — top area with generous margin */}
      {frame >= 150 && (
        <div
          style={{
            position: "absolute",
            top: "18%",
            left: SAFE_MARGIN,
            right: SAFE_MARGIN,
            zIndex: 25,
            opacity: headlineOpacity,
            pointerEvents: "none",
          }}
        >
          <div
            style={{
              fontFamily: FONT.display,
              fontSize: headlineFontSize,
              color: C.white,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              textShadow: TEXT_SHADOW_HEAVY,
              lineHeight: 1.2,
            }}
          >
            LAKSHMANPUR MARKETPLACE
          </div>
          <div
            style={{
              width: 60,
              height: 3,
              backgroundColor: C.red,
              marginTop: 8,
              boxShadow: `0 0 12px ${C.red}60`,
            }}
          />
          <div
            style={{
              fontFamily: FONT.display,
              fontSize: headlineFontSize - 4,
              color: C.red,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              textShadow: TEXT_SHADOW_HEAVY,
              marginTop: 6,
            }}
          >
            GROUND ZERO
          </div>
        </div>
      )}

      <DustParticles count={18} />
      <ChyronBar
        text={isVertical ? "LAKSHMANPUR — MARKETPLACE" : "LAKSHMANPUR — MARKETPLACE DISTRICT"}
        timestamp="19:47 IST"
        enterFrame={155}
      />
      <BrandOverlay grainIntensity={0.08} />
    </AbsoluteFill>
  );
};

// ─── Scene 4: War Room ──────────────────────────────────────────────────────
const WarRoomScene: React.FC = () => {
  const frame = useCurrentFrame();

  if (!inScene(frame, SCENE.warRoom)) return null;

  const localFrame = frame - SCENE.warRoom.start;
  const bgOpacity = interpolate(localFrame, [0, 6], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{ backgroundColor: C.obsidian, zIndex: 4 }}>
      <AbsoluteFill style={{ opacity: bgOpacity }}>
        <Img
          src={IMG.warRoom}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            filter: "brightness(0.6) contrast(1.08)",
          }}
        />
        <AbsoluteFill
          style={{
            background:
              "linear-gradient(to bottom, rgba(10,13,18,0.2) 0%, rgba(10,13,18,0.5) 100%)",
          }}
        />
      </AbsoluteFill>

      <WarRoomOverlay />
      <ScrollingTicker enterFrame={255} />
      <BrandOverlay />
    </AbsoluteFill>
  );
};

// ─── Scene wrappers ─────────────────────────────────────────────────────────
const Scene1: React.FC = () => {
  const frame = useCurrentFrame();
  if (!inScene(frame, SCENE.standby)) return null;
  return (
    <AbsoluteFill style={{ zIndex: 1 }}>
      <BVNLogo />
      <BrandOverlay />
    </AbsoluteFill>
  );
};

const Scene2: React.FC = () => {
  const frame = useCurrentFrame();
  if (!inScene(frame, SCENE.breaking)) return null;
  return (
    <AbsoluteFill style={{ backgroundColor: C.obsidian, zIndex: 2 }}>
      <BreakingBanner />
      <NationalMap />
      <BrandOverlay />
    </AbsoluteFill>
  );
};

const Scene5: React.FC = () => {
  const frame = useCurrentFrame();
  if (!inScene(frame, SCENE.claim)) return null;
  return (
    <AbsoluteFill style={{ zIndex: 5 }}>
      <TridentDrawOn />
      <BrandOverlay />
    </AbsoluteFill>
  );
};

const Scene6: React.FC = () => {
  const frame = useCurrentFrame();
  if (!inScene(frame, SCENE.question)) return null;
  return (
    <AbsoluteFill style={{ zIndex: 6 }}>
      <HookLockup />
      <BrandOverlay />
    </AbsoluteFill>
  );
};

// ─── Main Composition ───────────────────────────────────────────────────────
export const SevenCitiesReel: React.FC = () => {
  const frame = useCurrentFrame();

  // ── Audio volume envelope ──
  // PhonkBGM1: fade in on standby, hold strong through scenes 2-4,
  // dip for claim (scene 5), fade out for hook (scene 6)
  const bgmVolume = interpolate(
    frame,
    [0, 30, 67, 135, 360, 420, 450, 510, 540],
    [0, 0.4, 0.6, 0.7, 0.7, 0.5, 0.3, 0.1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );

  return (
    <AbsoluteFill style={{ backgroundColor: C.obsidian }}>

      {/* ── Audio: PhonkBGM1 (skip first 9s = start from 270 frames at 30fps) ── */}
      <Audio
        src={AUDIO_BGM}
        startFrom={270}
        volume={bgmVolume}
      />

      {/* All scenes render simultaneously — each self-manages visibility
          via absolute frame checks (no Sequence remapping). */}
      <Scene1 />
      <Scene2 />
      <StreetCarnageScene />
      <WarRoomScene />
      <Scene5 />
      <Scene6 />

      {/* Scene transitions (quick black dips) */}
      <SceneTransition triggerFrame={SCENE.standby.end - 2} />
      <SceneTransition triggerFrame={SCENE.breaking.end - 2} />
      <SceneTransition triggerFrame={SCENE.street.end - 2} />
      <SceneTransition triggerFrame={SCENE.warRoom.end - 2} />
      <SceneTransition triggerFrame={SCENE.claim.end - 2} />
    </AbsoluteFill>
  );
};
