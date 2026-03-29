/**
 * Video 2 -- Part 6: Steps 3, 4 & 5 Deep-Dive
 *
 * Four independently-rendered segments assembled via ffmpeg:
 *
 * Segment A: Step 3 facecam + StepNotification (14s, 420 frames)
 *   - B-roll: broll-s6-step3.mp4 (master 400s–414s)
 *   - StepCard at frame 20 for 6s
 *
 * Segment B: DeploymentLanes 8-bit highway infographic (50s, 1500 frames)
 *   - Standalone, no B-roll video
 *   - Audio from master B-roll 414s–464s, muxed in assembly
 *   - Lane activations: Personal @3s, Workspace @10s, Hybrid @27s
 *
 * Segment C: Step 4 facecam + StepNotification + GuardrailsRiskCard (51s, 1530 frames)
 *   - B-roll: broll-s6-step4.mp4 (master 464s–515s)
 *   - StepCard at frame 30 (1s) for 6s
 *   - GuardrailsRiskCard at frame 930 (31s) for 5s
 *
 * Segment D: Step 5 facecam + StepNotification (82s, 2460 frames)
 *   - B-roll: broll-s6-step5.mp4 (master 515s–597s)
 *   - StepCard at frame 30 (1s) for 6s
 *   - NOTE: Add video link overlay in DaVinci Resolve during publish
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
import { GuardrailsRiskCard } from '../components/GuardrailsRiskCard';
import { DeploymentLanes } from '../components/video2-diagrams/DeploymentLanes';

// ── Segment A: Step 3 Facecam + StepCard (14s) ──────────────────

const S3_STEP_APPEAR = 20;   // ~0.67s in
const S3_STEP_HOLD = 180;    // 6s

export const V2_S6_Step3Facecam: React.FC = () => {
  const frame = useCurrentFrame();
  const blur = getCardBlur(frame, S3_STEP_APPEAR, S3_STEP_HOLD);

  return (
    <AbsoluteFill>
      <OffthreadVideo
        src={staticFile('video2/broll-s6-step3.mp4')}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          filter: blur,
        }}
      />
      <Sequence from={S3_STEP_APPEAR} durationInFrames={S3_STEP_HOLD} layout="none">
        <StepNotification
          stepNumber={3}
          title="Choose Your Deployment Lane"
          description="Select the right environment for your AI implementation"
          pillar={1}
          holdFrames={S3_STEP_HOLD}
        />
      </Sequence>
    </AbsoluteFill>
  );
};

// ── Segment B: DeploymentLanes (standalone, 50s) ─────────────────

export const V2_S6_DeploymentLanes: React.FC = () => (
  <AbsoluteFill>
    <DeploymentLanes />
  </AbsoluteFill>
);

// ── Segment C: Step 4 Facecam + StepCard + GuardrailsCard (51s) ──

const S4_STEP_APPEAR = 30;     // 1s in — card at S6 1:05
const S4_STEP_HOLD = 180;      // 6s
const S4_GUARD_APPEAR = 930;   // 31s in — card at S6 1:35
const S4_GUARD_HOLD = 150;     // 5s

export const V2_S6_Step4Facecam: React.FC = () => {
  const frame = useCurrentFrame();

  // Compute blur from both overlays
  const isCard1 = frame >= S4_STEP_APPEAR && frame < S4_STEP_APPEAR + S4_STEP_HOLD;
  const isCard2 = frame >= S4_GUARD_APPEAR && frame < S4_GUARD_APPEAR + S4_GUARD_HOLD;
  const blur = isCard2
    ? getCardBlur(frame, S4_GUARD_APPEAR, S4_GUARD_HOLD)
    : isCard1
      ? getCardBlur(frame, S4_STEP_APPEAR, S4_STEP_HOLD)
      : 'blur(0px)';

  return (
    <AbsoluteFill>
      <OffthreadVideo
        src={staticFile('video2/broll-s6-step4.mp4')}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          filter: blur,
        }}
      />

      {/* Step 4 notification */}
      <Sequence from={S4_STEP_APPEAR} durationInFrames={S4_STEP_HOLD} layout="none">
        <StepNotification
          stepNumber={4}
          title="Add Guardrails Before Scaling"
          description="Ensure safety and reliability before expanding AI use"
          pillar={1}
          holdFrames={S4_STEP_HOLD}
        />
      </Sequence>

      {/* Guardrails risk card */}
      <Sequence from={S4_GUARD_APPEAR} durationInFrames={S4_GUARD_HOLD} layout="none">
        <GuardrailsRiskCard holdFrames={S4_GUARD_HOLD} />
      </Sequence>
    </AbsoluteFill>
  );
};

// ── Segment D: Step 5 Facecam + StepCard (82s) ──────────────────

const S5_STEP_APPEAR = 30;   // 1s in — card at S6 1:56
const S5_STEP_HOLD = 180;    // 6s

export const V2_S6_Step5Facecam: React.FC = () => {
  const frame = useCurrentFrame();
  const blur = getCardBlur(frame, S5_STEP_APPEAR, S5_STEP_HOLD);

  return (
    <AbsoluteFill>
      <OffthreadVideo
        src={staticFile('video2/broll-s6-step5.mp4')}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          filter: blur,
        }}
      />
      <Sequence from={S5_STEP_APPEAR} durationInFrames={S5_STEP_HOLD} layout="none">
        <StepNotification
          stepNumber={5}
          title="Operationalize AI"
          description="Embed AI into your workflows with reliable automation"
          pillar={1}
          holdFrames={S5_STEP_HOLD}
        />
      </Sequence>
    </AbsoluteFill>
  );
};
