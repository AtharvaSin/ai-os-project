/**
 * Video 2 — Part 3: "The Tool-First Trap"
 *
 * B-roll with KeyTermCard (P1, 1.2x) overlay.
 * Uses OffthreadVideo to avoid flicker during rendering.
 *
 * Dialogue covered (B-roll 95.3s–125.5s):
 *   "And by this channel, I want to share my learning..."
 *   through "...how it might go wrong."
 *
 * Timeline (30.2s):
 *   0–16s:    Pure B-roll facecam
 *   16–29s:   KeyTermCard overlay (top-right, 1.2x)
 *   29–30.2s: Card exits, B-roll continues
 */

import React from 'react';
import {
  AbsoluteFill,
  Sequence,
  OffthreadVideo,
  staticFile,
} from 'remotion';
import { KeyTermCard } from '../components/KeyTermCard';

export const V2_Part3_ToolFirstTrap: React.FC = () => {
  return (
    <AbsoluteFill>
      {/* Base layer: B-roll with narration audio (OffthreadVideo for stable rendering) */}
      <OffthreadVideo
        src={staticFile('video2/broll-s3.mp4')}
        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
      />

      {/* KeyTermCard overlay: appears at ~16s, holds ~13s */}
      <Sequence from={16 * 30} durationInFrames={13 * 30} layout="none">
        <div
          style={{
            position: 'absolute',
            top: 0,
            right: 0,
            width: 560,
            height: 400,
            transform: 'scale(1.2)',
            transformOrigin: 'top right',
            pointerEvents: 'none',
            zIndex: 10,
          }}
        >
          <KeyTermCard
            term="The Tool-First Trap"
            note="Starting with 'Which AI tool should I use?' is like walking into a hardware store and buying power drills without knowing what you want to build. Start with your pain points first."
            pillar={1}
            position="top-right"
            category="Common Mistake"
            holdFrames={13 * 30}
          />
        </div>
      </Sequence>
    </AbsoluteFill>
  );
};
