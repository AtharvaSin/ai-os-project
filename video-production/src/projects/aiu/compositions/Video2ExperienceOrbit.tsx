/**
 * Video 2 — ExperienceOrbit render-ready composition.
 *
 * The "creator credentials intro" overlay used at ~1:22-1:34.
 * Renders as a standalone 13.5s clip for DaVinci Resolve import.
 *
 * Timeline:
 *   0–2s:     Pedestal frame + orbiting badges visible, avatar fades in
 *   2–15s:    Avatar video (13s trimmed) plays in sync with narration (13s)
 *   15–16.5s: Everything fades out
 *
 * Avatar: avatar-p1-trimmed.mp4 (13s, trimmed 1s from each side of 15s source)
 * Narration: narration-credentials.wav (13s, "Myself ASR...infrastructure" + buffer)
 * Both start at frame 60 (2s) and end together.
 */

import React from 'react';
import {
  AbsoluteFill,
  Audio,
  Sequence,
  interpolate,
  staticFile,
  useVideoConfig,
} from 'remotion';
import { ExperienceOrbit } from '../components/ExperienceOrbit';
import { FPS } from '../constants';

// ── V2 ExperienceOrbit — Pillar 1, video avatar + narration ──

export const V2_ExperienceOrbit: React.FC = () => {
  const { durationInFrames } = useVideoConfig();

  // Narration volume with loudness boost and fade out
  const narrationVolume = React.useCallback(
    (f: number): number => {
      const narrationDurationFrames = Math.round(13.0 * FPS); // 390 frames
      const vol = interpolate(
        f,
        [0, 10, narrationDurationFrames - 30, narrationDurationFrames],
        [0, 1, 1, 0],
        { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' },
      );
      // Apply loudness boost (~+10dB = 3.16x multiplier)
      return vol * 3.16;
    },
    [],
  );

  return (
    <AbsoluteFill>
      <ExperienceOrbit
        pillar={1}
        avatarSrc={staticFile('video2/avatar-p1-trimmed.mp4')}
        avatarIsVideo
        avatarDelayFrames={60}
        badges={[
          'AI Solutions',
          'Cloud Architecture',
          'Enterprise Systems',
          'On-Premise AI',
          'Production AI',
          'GenAI Systems',
        ]}
        orbitSpeed={24}
      />

      {/* Narration audio — starts at 2s (frame 60), synced with avatar */}
      <Sequence from={60}>
        <Audio
          src={staticFile('video2/narration-credentials.wav')}
          volume={narrationVolume}
        />
      </Sequence>
    </AbsoluteFill>
  );
};
