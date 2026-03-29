/**
 * DiagramScene — Full-screen diagram overlay with voiceover and subtitles.
 *
 * Renders one of the diagram components (StatCard, ComparisonChart,
 * ProcessFlow, CodeBlock) centered on a dark background. Optionally
 * plays audio (voiceover extracted from facecam) and shows karaoke
 * subtitles via SubtitleOverlay. Watermark is always present.
 */

import React from 'react';
import { AbsoluteFill, Audio } from 'remotion';
import { COLORS, type PillarNumber } from '../constants';
import type { SubtitleSegment } from '../types';

import { StatCard } from '../components/StatCard';
import { ComparisonChart } from '../components/ComparisonChart';
import { ProcessFlow } from '../components/ProcessFlow';
import { CodeBlock } from '../components/CodeBlock';
import { SubtitleOverlay } from '../components/SubtitleOverlay';
import { Watermark } from '../components/Watermark';
import { useScaleIn } from '../utils/animations';

// ── Component Registry ──────────────────────────────────────

/**
 * Maps component name strings from input.json to actual React components.
 * Each component accepts `Record<string, unknown>` as spread props.
 */
const COMPONENT_MAP: Record<string, React.FC<Record<string, unknown>>> = {
  StatCard: StatCard as unknown as React.FC<Record<string, unknown>>,
  ComparisonChart: ComparisonChart as unknown as React.FC<Record<string, unknown>>,
  ProcessFlow: ProcessFlow as unknown as React.FC<Record<string, unknown>>,
  CodeBlock: CodeBlock as unknown as React.FC<Record<string, unknown>>,
};

// ── Props ───────────────────────────────────────────────────

interface DiagramSceneProps {
  /** Name of the diagram component to render (must match a key in COMPONENT_MAP) */
  component: string;
  /** Props to forward to the diagram component */
  componentProps: Record<string, unknown>;
  /** Total scene duration in frames (used for audio trim — not consumed by this component) */
  duration: number;
  /** Content pillar for accent colors and subtitles */
  pillar: PillarNumber;
  /** Optional voiceover audio source path */
  audioSrc?: string;
  /** Start offset in seconds for the audio file */
  audioStartAt?: number;
  /** Optional word-level subtitle segments for karaoke overlay */
  subtitles?: SubtitleSegment[];
}

// ── Component ───────────────────────────────────────────────

export const DiagramScene: React.FC<DiagramSceneProps> = ({
  component,
  componentProps,
  duration: _duration,
  pillar,
  audioSrc,
  audioStartAt,
  subtitles,
}) => {
  const DiagramComponent = COMPONENT_MAP[component];
  const { scale, opacity } = useScaleIn(5);

  return (
    <AbsoluteFill
      style={{
        backgroundColor: COLORS.bg.primary,
      }}
    >
      {/* Centered diagram component */}
      <AbsoluteFill
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 80,
        }}
      >
        {DiagramComponent ? (
          <div
            style={{
              transform: `scale(${scale})`,
              opacity,
            }}
          >
            <DiagramComponent {...componentProps} pillar={pillar} />
          </div>
        ) : (
          <div
            style={{
              color: COLORS.status.error,
              fontSize: 24,
              fontWeight: 600,
            }}
          >
            Unknown component: {component}
          </div>
        )}
      </AbsoluteFill>

      {/* Voiceover audio (video-less — audio only from facecam file) */}
      {audioSrc ? (
        <Audio
          src={audioSrc}
          startFrom={
            audioStartAt !== undefined
              ? Math.round(audioStartAt * 30)
              : undefined
          }
        />
      ) : null}

      {/* Karaoke subtitles */}
      {subtitles && subtitles.length > 0 ? (
        <SubtitleOverlay segments={subtitles} pillar={pillar} />
      ) : null}

      {/* Watermark */}
      <Watermark />
    </AbsoluteFill>
  );
};
