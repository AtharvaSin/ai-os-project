/**
 * Root — Master Composition Registry
 * Video Production System
 *
 * Registers all compositions from all projects:
 *   - System test compositions
 *   - Bharatvarsh (dystopian cinematic content)
 *   - AI&U (educational YouTube content)
 *   - AI OS (system demo videos)
 *
 * Each composition references a render-ready component from
 * src/projects/{id}/compositions/ and declares explicit
 * dimensions, fps, and duration.
 */

import React from 'react';
import { Composition } from 'remotion';
import { DIMENSIONS, DEFAULT_FPS } from './engine/registry';
import { loadSharedFonts } from './common/utils/fonts';

// ── Bharatvarsh Compositions ────────────────────────────────────
import { BharatvarshPost } from './projects/bharatvarsh/compositions/BharatvarshPost';
import { TridentSurveillance } from './projects/bharatvarsh/compositions/TridentSurveillance';
import { TridentSurveillanceReel } from './projects/bharatvarsh/compositions/TridentSurveillanceReel';
import { BracecommReel } from './projects/bharatvarsh/compositions/BracecommReel';
import { BracecommReelV2 } from './projects/bharatvarsh/compositions/BracecommReelV2';
import { SevenCitiesReel } from './projects/bharatvarsh/compositions/seven-cities/SevenCitiesReel';

// ── AI&U Test Compositions ──────────────────────────────────────
import { AIUTest } from './projects/aiu/compositions/AIUTest';
import {
  TestIntroSting,
  TestLowerThird,
  TestChapterCard,
  TestTextPunch,
  TestStatCard,
  TestCodeBlock,
} from './projects/aiu/compositions/TestCompositions';

// ── AI&U Video 2 — Section 1 ───────────────────────────────────
import {
  V2_G01_IntroSting,
  V2_G02_LowerThird,
  V2_G03_Roadmap8Bit,
  V2_G04_Disclaimer,
} from './projects/aiu/compositions/Video2Section1';

// ── AI&U Video 2 — Sections 2–7 ────────────────────────────────
import { V2_ExperienceOrbit } from './projects/aiu/compositions/Video2ExperienceOrbit';
import { V2_Part3_ToolFirstTrap } from './projects/aiu/compositions/Video2Part3';
import {
  V2_S4_ChapterCard,
  V2_S4_FiveStepRoadmap,
} from './projects/aiu/compositions/Video2Part4';
import {
  V2_S5_FacecamWithCards,
  V2_S5_ExplorerToolkit,
} from './projects/aiu/compositions/Video2Part5';
import {
  V2_S6_Step3Facecam,
  V2_S6_DeploymentLanes,
  V2_S6_Step4Facecam,
  V2_S6_Step5Facecam,
} from './projects/aiu/compositions/Video2Part6';
import { V2_S7_Composite } from './projects/aiu/compositions/Video2Part7Composite';

// ── AI OS Compositions ──────────────────────────────────────────
import { AIOSRepoIntro } from './projects/ai-os/AIOSRepoIntro';

// ── Font Loading ────────────────────────────────────────────────
loadSharedFonts();

// ── Test Compositions ───────────────────────────────────────────

/** Simple test composition to verify the system works */
const TestCard: React.FC = () => {
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        backgroundColor: '#0A0D12',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 24,
        fontFamily: 'Inter, sans-serif',
      }}
    >
      <div
        style={{
          width: 80,
          height: 4,
          backgroundColor: '#00D492',
          borderRadius: 2,
        }}
      />
      <h1
        style={{
          fontSize: 48,
          fontWeight: 800,
          color: '#EEEAE4',
          letterSpacing: '-0.02em',
        }}
      >
        Video Production System
      </h1>
      <p
        style={{
          fontSize: 18,
          color: '#A09D95',
          fontFamily: 'JetBrains Mono, monospace',
        }}
      >
        Unified Remotion Engine — v1.0
      </p>
    </div>
  );
};

// ── Composition Registry ────────────────────────────────────────

export const RemotionRoot: React.FC = () => {
  return (
    <>
      {/* ──────────────────────────────────────────────────────────
       *  SYSTEM
       * ────────────────────────────────────────────────────────── */}

      <Composition
        id="test-card"
        component={TestCard}
        durationInFrames={150}
        fps={DEFAULT_FPS}
        width={DIMENSIONS.landscape.width}
        height={DIMENSIONS.landscape.height}
      />

      {/* ──────────────────────────────────────────────────────────
       *  BHARATVARSH
       * ────────────────────────────────────────────────────────── */}

      <Composition
        id="bhv-post-example"
        component={BharatvarshPost}
        durationInFrames={150}
        fps={DEFAULT_FPS}
        width={DIMENSIONS.square.width}
        height={DIMENSIONS.square.height}
      />

      <Composition
        id="bhv-trident-surveillance"
        component={TridentSurveillance}
        durationInFrames={300}
        fps={DEFAULT_FPS}
        width={DIMENSIONS.portrait.width}
        height={DIMENSIONS.portrait.height}
      />

      <Composition
        id="bhv-trident-reel"
        component={TridentSurveillanceReel}
        durationInFrames={240}
        fps={DEFAULT_FPS}
        width={DIMENSIONS.vertical.width}
        height={DIMENSIONS.vertical.height}
      />

      <Composition
        id="bhv-bracecomm-reel"
        component={BracecommReel}
        durationInFrames={300}
        fps={DEFAULT_FPS}
        width={DIMENSIONS.vertical.width}
        height={DIMENSIONS.vertical.height}
      />

      <Composition
        id="bhv-bracecomm-reel-v2"
        component={BracecommReelV2}
        durationInFrames={300}
        fps={DEFAULT_FPS}
        width={DIMENSIONS.vertical.width}
        height={DIMENSIONS.vertical.height}
      />

      <Composition
        id="bhv-seven-cities-reel"
        component={SevenCitiesReel}
        durationInFrames={540}
        fps={DEFAULT_FPS}
        width={DIMENSIONS.vertical.width}
        height={DIMENSIONS.vertical.height}
      />

      {/* ──────────────────────────────────────────────────────────
       *  AI&U — Component Tests
       * ────────────────────────────────────────────────────────── */}

      <Composition
        id="aiu-test"
        component={AIUTest}
        durationInFrames={90}
        fps={DEFAULT_FPS}
        width={DIMENSIONS.landscape.width}
        height={DIMENSIONS.landscape.height}
      />

      <Composition
        id="aiu-test-intro-sting"
        component={TestIntroSting}
        durationInFrames={75}
        fps={DEFAULT_FPS}
        width={DIMENSIONS.landscape.width}
        height={DIMENSIONS.landscape.height}
      />

      <Composition
        id="aiu-test-lower-third"
        component={TestLowerThird}
        durationInFrames={180}
        fps={DEFAULT_FPS}
        width={DIMENSIONS.landscape.width}
        height={DIMENSIONS.landscape.height}
      />

      <Composition
        id="aiu-test-chapter-card"
        component={TestChapterCard}
        durationInFrames={52}
        fps={DEFAULT_FPS}
        width={DIMENSIONS.landscape.width}
        height={DIMENSIONS.landscape.height}
      />

      <Composition
        id="aiu-test-text-punch"
        component={TestTextPunch}
        durationInFrames={60}
        fps={DEFAULT_FPS}
        width={DIMENSIONS.landscape.width}
        height={DIMENSIONS.landscape.height}
      />

      <Composition
        id="aiu-test-stat-card"
        component={TestStatCard}
        durationInFrames={90}
        fps={DEFAULT_FPS}
        width={DIMENSIONS.landscape.width}
        height={DIMENSIONS.landscape.height}
      />

      <Composition
        id="aiu-test-code-block"
        component={TestCodeBlock}
        durationInFrames={120}
        fps={DEFAULT_FPS}
        width={DIMENSIONS.landscape.width}
        height={DIMENSIONS.landscape.height}
      />

      {/* ──────────────────────────────────────────────────────────
       *  AI&U — Video 2 Section 1 (Intro graphics)
       * ────────────────────────────────────────────────────────── */}

      <Composition
        id="aiu-v2-s1-intro-sting"
        component={V2_G01_IntroSting}
        durationInFrames={75}
        fps={DEFAULT_FPS}
        width={DIMENSIONS.landscape.width}
        height={DIMENSIONS.landscape.height}
      />

      <Composition
        id="aiu-v2-s1-lower-third"
        component={V2_G02_LowerThird}
        durationInFrames={180}
        fps={DEFAULT_FPS}
        width={DIMENSIONS.landscape.width}
        height={DIMENSIONS.landscape.height}
      />

      <Composition
        id="aiu-v2-s1-roadmap-8bit"
        component={V2_G03_Roadmap8Bit}
        durationInFrames={600}
        fps={DEFAULT_FPS}
        width={DIMENSIONS.landscape.width}
        height={DIMENSIONS.landscape.height}
      />

      <Composition
        id="aiu-v2-s1-disclaimer"
        component={V2_G04_Disclaimer}
        durationInFrames={150}
        fps={DEFAULT_FPS}
        width={DIMENSIONS.landscape.width}
        height={DIMENSIONS.landscape.height}
      />

      {/* ──────────────────────────────────────────────────────────
       *  AI&U — Video 2 Section 2 (Experience Orbit)
       * ────────────────────────────────────────────────────────── */}

      <Composition
        id="aiu-v2-experience-orbit"
        component={V2_ExperienceOrbit}
        durationInFrames={495}
        fps={DEFAULT_FPS}
        width={DIMENSIONS.landscape.width}
        height={DIMENSIONS.landscape.height}
      />

      {/* ──────────────────────────────────────────────────────────
       *  AI&U — Video 2 Part 3 (The Tool-First Trap)
       * ────────────────────────────────────────────────────────── */}

      <Composition
        id="aiu-v2-part3"
        component={V2_Part3_ToolFirstTrap}
        durationInFrames={1011}
        fps={DEFAULT_FPS}
        width={DIMENSIONS.landscape.width}
        height={DIMENSIONS.landscape.height}
      />

      {/* ──────────────────────────────────────────────────────────
       *  AI&U — Video 2 Part 4 (Chapter Card + 5-Step Roadmap)
       * ────────────────────────────────────────────────────────── */}

      <Composition
        id="aiu-v2-s4-chapter-card"
        component={V2_S4_ChapterCard}
        durationInFrames={75}
        fps={DEFAULT_FPS}
        width={DIMENSIONS.landscape.width}
        height={DIMENSIONS.landscape.height}
      />

      <Composition
        id="aiu-v2-s4-five-step-roadmap"
        component={V2_S4_FiveStepRoadmap}
        durationInFrames={2130}
        fps={DEFAULT_FPS}
        width={DIMENSIONS.landscape.width}
        height={DIMENSIONS.landscape.height}
      />

      {/* ──────────────────────────────────────────────────────────
       *  AI&U — Video 2 Part 5 (Step 1 & 2 Deep-Dive)
       * ────────────────────────────────────────────────────────── */}

      <Composition
        id="aiu-v2-s5-facecam-with-cards"
        component={V2_S5_FacecamWithCards}
        durationInFrames={1545}
        fps={DEFAULT_FPS}
        width={DIMENSIONS.landscape.width}
        height={DIMENSIONS.landscape.height}
      />

      <Composition
        id="aiu-v2-s5-explorer-toolkit"
        component={V2_S5_ExplorerToolkit}
        durationInFrames={3930}
        fps={DEFAULT_FPS}
        width={DIMENSIONS.landscape.width}
        height={DIMENSIONS.landscape.height}
      />

      {/* ──────────────────────────────────────────────────────────
       *  AI&U — Video 2 Part 6 (Steps 3, 4 & 5 Deep-Dive)
       * ────────────────────────────────────────────────────────── */}

      <Composition
        id="aiu-v2-s6-step3-facecam"
        component={V2_S6_Step3Facecam}
        durationInFrames={420}
        fps={DEFAULT_FPS}
        width={DIMENSIONS.landscape.width}
        height={DIMENSIONS.landscape.height}
      />

      <Composition
        id="aiu-v2-s6-deployment-lanes"
        component={V2_S6_DeploymentLanes}
        durationInFrames={1500}
        fps={DEFAULT_FPS}
        width={DIMENSIONS.landscape.width}
        height={DIMENSIONS.landscape.height}
      />

      <Composition
        id="aiu-v2-s6-step4-facecam"
        component={V2_S6_Step4Facecam}
        durationInFrames={1530}
        fps={DEFAULT_FPS}
        width={DIMENSIONS.landscape.width}
        height={DIMENSIONS.landscape.height}
      />

      <Composition
        id="aiu-v2-s6-step5-facecam"
        component={V2_S6_Step5Facecam}
        durationInFrames={2460}
        fps={DEFAULT_FPS}
        width={DIMENSIONS.landscape.width}
        height={DIMENSIONS.landscape.height}
      />

      {/* ──────────────────────────────────────────────────────────
       *  AI&U — Video 2 Part 7 (Business Professional Composite)
       * ────────────────────────────────────────────────────────── */}

      <Composition
        id="aiu-v2-part7-composite"
        component={V2_S7_Composite}
        durationInFrames={9090}
        fps={DEFAULT_FPS}
        width={DIMENSIONS.landscape.width}
        height={DIMENSIONS.landscape.height}
      />

      {/* ──────────────────────────────────────────────────────────
       *  AI OS
       * ────────────────────────────────────────────────────────── */}

      <Composition
        id="ai-os-intro"
        component={AIOSRepoIntro}
        durationInFrames={150}
        fps={DEFAULT_FPS}
        width={DIMENSIONS.landscape.width}
        height={DIMENSIONS.landscape.height}
      />
    </>
  );
};
