/**
 * Video 2 — Part 5: Step 1 & Step 2 Deep-Dive
 *
 * Segment A: Facecam with StepNotification overlays (OffthreadVideo)
 *   - Step 1 card at start, Step 2 card at 39.4s
 *   - Blur effect when cards are visible
 *   - B-roll: 221.6s–273.1s (51.5s)
 *
 * Segment B: VillageBuilder 8-bit animation (standalone, no video)
 *   - 5 AI impact areas as growing village
 *   - 131s with 8-bit music
 */

import React from 'react';
import {
  AbsoluteFill,
  OffthreadVideo,
  Sequence,
  staticFile,
  useCurrentFrame,
} from 'remotion';
import { StepNotification, getCardBlur } from '../components/StepNotification';
import { ExplorerToolkit } from '../components/video2-diagrams/ExplorerToolkit';

// ── Segment A: Facecam + Step Cards ──────────────────────────

// Card timing (in frames, relative to segment start)
const STEP1_APPEAR = 20;       // 0.67s
const STEP1_HOLD = 180;        // 6s
const STEP2_APPEAR = 39.4 * 30; // 1182 frames = 39.4s
const STEP2_HOLD = 150;        // 5s

export const V2_S5_FacecamWithCards: React.FC = () => {
  const frame = useCurrentFrame();

  // Compute blur from both cards
  const blur1 = getCardBlur(frame, STEP1_APPEAR, STEP1_HOLD);
  const blur2 = getCardBlur(frame, STEP2_APPEAR, STEP2_HOLD);
  const isBlurred = frame >= STEP1_APPEAR && frame < STEP1_APPEAR + STEP1_HOLD
    || frame >= STEP2_APPEAR && frame < STEP2_APPEAR + STEP2_HOLD;
  const blurValue = isBlurred ? (frame >= STEP2_APPEAR ? blur2 : blur1) : 'blur(0px)';

  return (
    <AbsoluteFill>
      {/* B-roll facecam with conditional blur */}
      <OffthreadVideo
        src={staticFile('video2/broll-s5-facecam.mp4')}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          filter: blurValue,
        }}
      />

      {/* Step 1 notification */}
      <Sequence from={STEP1_APPEAR} durationInFrames={STEP1_HOLD} layout="none">
        <StepNotification
          stepNumber={1}
          title="Build a Pain Point Inventory"
          description="Identify repetitive, cognitively heavy, or simple-deliverable tasks where AI can help"
          pillar={1}
          holdFrames={STEP1_HOLD}
        />
      </Sequence>

      {/* Step 2 notification */}
      <Sequence from={STEP2_APPEAR} durationInFrames={STEP2_HOLD} layout="none">
        <StepNotification
          stepNumber={2}
          title="Classify AI Impact"
          description="Map your tasks to five AI impact categories"
          pillar={1}
          holdFrames={STEP2_HOLD}
        />
      </Sequence>
    </AbsoluteFill>
  );
};

// ── Segment B: VillageBuilder (standalone, no video) ─────────

export const V2_S5_ExplorerToolkit: React.FC = () => (
  <AbsoluteFill>
    <ExplorerToolkit withMusic musicVolume={0.15} />
  </AbsoluteFill>
);
