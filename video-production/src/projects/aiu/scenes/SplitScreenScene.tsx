/**
 * SplitScreenScene — Side-by-side facecam + screen recording.
 *
 * Left 40%: facecam with subtle pillar accent border.
 * Right 60%: screen recording.
 * A 2px pillar accent divider separates the two panels.
 * SubtitleOverlay spans the full width at bottom. Both video
 * sources are trimmed independently via startFrom.
 */

import React from 'react';
import {
  AbsoluteFill,
  OffthreadVideo,
  Sequence,
  useVideoConfig,
} from 'remotion';
import type { PillarNumber } from '../constants';
import type { SubtitleSegment } from '../types';
import { getPillarColor } from '../utils/colors';
import { SubtitleOverlay } from '../components/SubtitleOverlay';
import { Watermark } from '../components/Watermark';

// ── Props ──────────────────────────────────────────────────────

interface SplitScreenSceneProps {
  /** Path to the facecam video file (left panel) */
  facecamSrc: string;
  /** Path to the screen recording video file (right panel) */
  screenRecSrc: string;
  /** Start time in the facecam source video (seconds) */
  facecamStartAt: number;
  /** Start time in the screen recording source video (seconds) */
  screenRecStartAt: number;
  /** Scene duration (seconds) */
  duration: number;
  /** Content pillar (determines accent colors for divider and border) */
  pillar: PillarNumber;
  /** Word-level subtitle segments (spans full width at bottom) */
  subtitles?: SubtitleSegment[];
  /** Whether to show the AI&U watermark (default: true) */
  showWatermark?: boolean;
}

/** Left panel takes 40% of the width */
const LEFT_RATIO = 0.4;
/** Right panel takes 60% of the width */
const RIGHT_RATIO = 0.6;
/** Divider width in pixels */
const DIVIDER_WIDTH = 2;
/** Subtle border width on the facecam panel */
const BORDER_WIDTH = 1;

export const SplitScreenScene: React.FC<SplitScreenSceneProps> = ({
  facecamSrc,
  screenRecSrc,
  facecamStartAt,
  screenRecStartAt,
  duration,
  pillar,
  subtitles,
  showWatermark = true,
}) => {
  const { fps } = useVideoConfig();

  const facecamStartFromFrames = Math.round(facecamStartAt * fps);
  const screenRecStartFromFrames = Math.round(screenRecStartAt * fps);
  const durationFrames = Math.round(duration * fps);

  const accent = getPillarColor(pillar);

  return (
    <AbsoluteFill>
      {/* Split layout container */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'row',
        }}
      >
        {/* Left panel: Facecam (40%) */}
        <div
          style={{
            width: `${LEFT_RATIO * 100}%`,
            height: '100%',
            position: 'relative',
            overflow: 'hidden',
            boxSizing: 'border-box',
            border: `${BORDER_WIDTH}px solid ${accent}`,
            borderRight: 'none',
          }}
        >
          <OffthreadVideo
            src={facecamSrc}
            startFrom={facecamStartFromFrames}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        </div>

        {/* Pillar accent divider */}
        <div
          style={{
            width: DIVIDER_WIDTH,
            height: '100%',
            backgroundColor: accent,
            flexShrink: 0,
          }}
        />

        {/* Right panel: Screen recording (60%) */}
        <div
          style={{
            width: `${RIGHT_RATIO * 100}%`,
            height: '100%',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <OffthreadVideo
            src={screenRecSrc}
            startFrom={screenRecStartFromFrames}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        </div>
      </div>

      {/* Subtitles spanning full width at bottom */}
      {subtitles && subtitles.length > 0 && (
        <Sequence from={0} durationInFrames={durationFrames}>
          <SubtitleOverlay segments={subtitles} pillar={pillar} />
        </Sequence>
      )}

      {/* Watermark */}
      {showWatermark && <Watermark />}
    </AbsoluteFill>
  );
};
