/**
 * FacecamScene — Full-frame facecam with overlays.
 *
 * Plays a facecam video source trimmed to [startAt, startAt + duration].
 * Composites optional LowerThird, SubtitleOverlay, graphic overlays
 * (StatCard, TextPunch, etc.), and a Watermark. Used for talking-head
 * segments where the speaker addresses the camera directly.
 */

import React from 'react';
import {
  AbsoluteFill,
  OffthreadVideo,
  Sequence,
  useVideoConfig,
} from 'remotion';
import type { PillarNumber } from '../constants';
import type { SubtitleSegment, GraphicOverlay } from '../types';
import { LowerThird } from '../components/LowerThird';
import { SubtitleOverlay } from '../components/SubtitleOverlay';
import { Watermark } from '../components/Watermark';
import { renderOverlay } from './overlayRenderer';

// ── Props ──────────────────────────────────────────────────────

interface FacecamSceneProps {
  /** Path to the facecam video file */
  facecamSrc: string;
  /** Start time in the source video (seconds) */
  startAt: number;
  /** Scene duration (seconds) */
  duration: number;
  /** Content pillar (determines accent colors) */
  pillar: PillarNumber;
  /** Optional lower third name card shown at scene start */
  lowerThird?: {
    name: string;
    title: string;
  };
  /** Word-level subtitle segments for karaoke-style overlay */
  subtitles?: SubtitleSegment[];
  /** Graphic overlays rendered at their specified enterAt times */
  overlays?: GraphicOverlay[];
  /** Whether to show the AI&U watermark (default: true) */
  showWatermark?: boolean;
}

export const FacecamScene: React.FC<FacecamSceneProps> = ({
  facecamSrc,
  startAt,
  duration,
  pillar,
  lowerThird,
  subtitles,
  overlays,
  showWatermark = true,
}) => {
  const { fps } = useVideoConfig();
  const startFromFrames = Math.round(startAt * fps);
  const durationFrames = Math.round(duration * fps);

  return (
    <AbsoluteFill>
      {/* Base facecam video */}
      <AbsoluteFill>
        <OffthreadVideo
          src={facecamSrc}
          startFrom={startFromFrames}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
      </AbsoluteFill>

      {/* Lower third at scene start */}
      {lowerThird && (
        <Sequence from={0} durationInFrames={durationFrames}>
          <LowerThird
            name={lowerThird.name}
            title={lowerThird.title}
            pillar={pillar}
            enterFrame={0}
          />
        </Sequence>
      )}

      {/* Graphic overlays, each in its own timed Sequence */}
      {overlays?.map((overlay, index) => {
        const overlayFromFrame = Math.round(overlay.enterAt * fps);
        const overlayDurationFrames = Math.round(overlay.duration * fps);

        return (
          <Sequence
            key={`overlay-${index}`}
            from={overlayFromFrame}
            durationInFrames={overlayDurationFrames}
          >
            <AbsoluteFill
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: getOverlayJustification(overlay.position),
                padding: 48,
              }}
            >
              {renderOverlay(overlay, pillar)}
            </AbsoluteFill>
          </Sequence>
        );
      })}

      {/* Subtitles spanning the full scene */}
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

/**
 * Maps an overlay position to a CSS justify-content value.
 * Keeps overlay placement consistent across all scenes.
 */
function getOverlayJustification(
  position: GraphicOverlay['position'],
): React.CSSProperties['justifyContent'] {
  switch (position) {
    case 'left':
      return 'flex-start';
    case 'right':
      return 'flex-end';
    case 'center':
    case 'full_screen':
    case 'top':
    case 'bottom':
    default:
      return 'center';
  }
}
