/**
 * Video 2 — Part 4 compositions: Chapter Card + 5-Step Roadmap.
 *
 * These are standalone compositions with NO video elements.
 * Final assembly is done via ffmpeg to avoid flicker:
 *   1. Render chapter card (2.5s)
 *   2. Extract B-roll facecam (13.3s)
 *   3. Render infographic (73s)
 *   4. Extract B-roll facecam closing (6s)
 *   5. Concatenate all segments + continuous audio
 */

import React from 'react';
import { AbsoluteFill } from 'remotion';
import { ChapterCard } from '../components/ChapterCard';
import { FiveStepRoadmap } from '../components/video2-diagrams/FiveStepRoadmap';

// ── Chapter Card: Part A — The 5 Step Process ────────────────

export const V2_S4_ChapterCard: React.FC = () => (
  <ChapterCard
    chapterNumber={1}
    title="Part A"
    miniPromise="The 5 Step Process"
    pillar={1}
    totalChapters={4}
  />
);

// ── 5-Step Roadmap Infographic ───────────────────────────────

export const V2_S4_FiveStepRoadmap: React.FC = () => (
  <AbsoluteFill>
    <FiveStepRoadmap />
  </AbsoluteFill>
);
