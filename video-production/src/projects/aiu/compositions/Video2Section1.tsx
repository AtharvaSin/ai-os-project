/**
 * Video 2 Section 1 — Render-ready compositions for all S1 graphics.
 *
 * Each graphic is a standalone composition with its assigned background
 * music, ready to render as an MP4 clip for DaVinci Resolve import.
 *
 * Music plan:
 *   G01 IntroSting    → UpbeatBeats1 (fade in)
 *   G02 LowerThird    → No music (transparent overlay for facecam)
 *   G03 8-Bit Roadmap → Own 8-bit music (built into component)
 *   G04 Disclaimer    → UpbeatBeats2 (starts after G03 in the edit)
 */

import React from 'react';
import {
  AbsoluteFill,
  Audio,
  Sequence,
  interpolate,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import { COLORS } from '../constants';
import { IntroSting } from '../components/IntroSting';
import { LowerThird } from '../components/LowerThird';
import { HighlightBox } from '../components/HighlightBox';
import { VideoRoadmap8Bit } from '../components/video2-diagrams/VideoRoadmap8Bit';

// ── Music volume callback factory ──────────────────────────────

function makeMusicVolume(
  durationInFrames: number,
  baseVolume: number,
  fadeInFrames = 30,
  fadeOutFrames = 45,
) {
  return (f: number): number =>
    interpolate(
      f,
      [0, fadeInFrames, durationInFrames - fadeOutFrames, durationInFrames],
      [0, baseVolume, baseVolume, 0],
      { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' },
    );
}

// ── G01: Intro Sting with UpbeatBeats1 ─────────────────────────

export const V2_G01_IntroSting: React.FC = () => {
  const { durationInFrames } = useVideoConfig();
  const volume = React.useCallback(
    makeMusicVolume(durationInFrames, 0.35, 10, 20),
    [durationInFrames],
  );

  return (
    <AbsoluteFill>
      <IntroSting pillar={1} />
      <Audio src={staticFile('music/upbeat-beats-1.wav')} volume={volume} />
    </AbsoluteFill>
  );
};

// ── G02: Lower Third (no music — overlay clip) ─────────────────

export const V2_G02_LowerThird: React.FC = () => {
  const { durationInFrames } = useVideoConfig();

  return (
    <AbsoluteFill style={{ backgroundColor: 'transparent' }}>
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          transform: 'scale(1.5)',
          transformOrigin: 'bottom left',
        }}
      >
        <Sequence from={0} durationInFrames={durationInFrames}>
          <LowerThird
            name="Atharva Singh"
            title="AI & Cloud Product Leader"
            pillar={1}
            enterFrame={0}
          />
        </Sequence>
      </div>
    </AbsoluteFill>
  );
};

// ── G03: 8-Bit Roadmap (own music, already built in) ───────────

export const V2_G03_Roadmap8Bit: React.FC = () => (
  <VideoRoadmap8Bit withMusic musicVolume={0.6} />
);

// ── G04: Disclaimer Card with UpbeatBeats2 ─────────────────────

export const V2_G04_Disclaimer: React.FC = () => {
  const { durationInFrames } = useVideoConfig();
  const volume = React.useCallback(
    makeMusicVolume(durationInFrames, 0.3, 20, 30),
    [durationInFrames],
  );

  return (
    <AbsoluteFill>
      <HighlightBox
        title="Before We Begin"
        bullets={[
          'AI is evolving rapidly — what works today may change tomorrow',
          'This is an iterative process, not a silver bullet',
          'Frameworks > specific tools — learn the thinking, not just the tool',
        ]}
        pillar={1}
        variant="info"
      />
      <Audio src={staticFile('music/upbeat-beats-2.wav')} volume={volume} />
    </AbsoluteFill>
  );
};
