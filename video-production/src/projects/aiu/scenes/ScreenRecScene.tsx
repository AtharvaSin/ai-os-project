/**
 * ScreenRecScene — Screen recording with zoom, callouts, and optional PIP.
 *
 * Plays a screen recording video trimmed to [startAt, startAt + duration].
 * Supports smooth zoom-point transitions via CSS transform (translate + scale),
 * CalloutHighlight annotations at specified times, an optional picture-in-picture
 * facecam, SubtitleOverlay, graphic overlays, and Watermark.
 */

import React from 'react';
import {
  AbsoluteFill,
  OffthreadVideo,
  Sequence,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
} from 'remotion';
import { SIZING, type PillarNumber } from '../constants';
import type {
  SubtitleSegment,
  GraphicOverlay,
  ZoomPoint,
  Callout,
  PipPosition,
} from '../types';
import { getPillarColor } from '../utils/colors';
import { EASING } from '../utils/animations';
import { CalloutHighlight } from '../components/CalloutHighlight';
import { SubtitleOverlay } from '../components/SubtitleOverlay';
import { Watermark } from '../components/Watermark';
import { renderOverlay } from './overlayRenderer';

// ── Props ──────────────────────────────────────────────────────

interface ScreenRecSceneProps {
  /** Path to the screen recording video file */
  screenRecSrc: string;
  /** Start time in the source video (seconds) */
  startAt: number;
  /** Scene duration (seconds) */
  duration: number;
  /** Content pillar (determines accent colors) */
  pillar: PillarNumber;
  /** Timed zoom points for pan-and-scan on the recording */
  zoomPoints?: ZoomPoint[];
  /** Timed callout annotations drawn over the recording */
  callouts?: Callout[];
  /** Whether to show a picture-in-picture facecam */
  pipFacecam?: boolean;
  /** Path to the facecam video for PIP */
  pipFacecamSrc?: string;
  /** Corner position for the PIP window */
  pipPosition?: PipPosition;
  /** Word-level subtitle segments */
  subtitles?: SubtitleSegment[];
  /** Graphic overlays rendered at their specified enterAt times */
  overlays?: GraphicOverlay[];
  /** Whether to show the AI&U watermark (default: true) */
  showWatermark?: boolean;
}

export const ScreenRecScene: React.FC<ScreenRecSceneProps> = ({
  screenRecSrc,
  startAt,
  duration,
  pillar,
  zoomPoints,
  callouts,
  pipFacecam = false,
  pipFacecamSrc,
  pipPosition = 'bottom-right',
  subtitles,
  overlays,
  showWatermark = true,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const startFromFrames = Math.round(startAt * fps);
  const durationFrames = Math.round(duration * fps);
  const currentTimeSec = frame / fps;

  // ── Zoom transform computation ─────────────────────────────
  const { translateX, translateY, scale } = computeZoomTransform(
    currentTimeSec,
    zoomPoints ?? [],
  );

  const accent = getPillarColor(pillar);

  return (
    <AbsoluteFill>
      {/* Screen recording with zoom transforms */}
      <AbsoluteFill style={{ overflow: 'hidden' }}>
        <div
          style={{
            width: '100%',
            height: '100%',
            transform: `translate(${translateX}%, ${translateY}%) scale(${scale})`,
            transformOrigin: 'center center',
            willChange: 'transform',
          }}
        >
          <OffthreadVideo
            src={screenRecSrc}
            startFrom={startFromFrames}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        </div>
      </AbsoluteFill>

      {/* Callout annotations */}
      {callouts?.map((callout, index) => {
        const calloutFromFrame = Math.round(callout.time * fps);
        const calloutDurationFrames = Math.round(callout.duration * fps);

        return (
          <Sequence
            key={`callout-${index}`}
            from={calloutFromFrame}
            durationInFrames={calloutDurationFrames}
          >
            <CalloutHighlight
              type={callout.type}
              x={callout.x}
              y={callout.y}
              width={callout.width}
              height={callout.height}
              label={callout.label}
              color={callout.color ?? accent}
            />
          </Sequence>
        );
      })}

      {/* Graphic overlays */}
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

      {/* PIP facecam */}
      {pipFacecam && pipFacecamSrc && (
        <Sequence from={0} durationInFrames={durationFrames}>
          <PipWindow
            src={pipFacecamSrc}
            startFromFrames={startFromFrames}
            position={pipPosition}
            accent={accent}
          />
        </Sequence>
      )}

      {/* Subtitles */}
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

// ── Zoom Transform Computation ─────────────────────────────────

interface ZoomState {
  translateX: number;
  translateY: number;
  scale: number;
}

/**
 * Compute the current zoom transform by interpolating between
 * adjacent ZoomPoints. When no zoom points are active, returns
 * the identity transform (no zoom, no pan).
 */
function computeZoomTransform(
  currentTimeSec: number,
  zoomPoints: ZoomPoint[],
): ZoomState {
  const identity: ZoomState = { translateX: 0, translateY: 0, scale: 1 };

  if (zoomPoints.length === 0) {
    return identity;
  }

  // Sort by time to ensure correct interpolation order
  const sorted = [...zoomPoints].sort((a, b) => a.time - b.time);

  // Before the first zoom point: identity
  if (currentTimeSec < sorted[0].time) {
    return identity;
  }

  // After the last zoom point ends: identity
  const lastPoint = sorted[sorted.length - 1];
  if (currentTimeSec > lastPoint.time + lastPoint.duration) {
    return identity;
  }

  // Find the active zoom point (the one we are inside or transitioning from)
  for (let i = 0; i < sorted.length; i++) {
    const point = sorted[i];
    const pointEnd = point.time + point.duration;

    // Inside this zoom point's hold duration
    if (currentTimeSec >= point.time && currentTimeSec <= pointEnd) {
      return {
        translateX: -point.x,
        translateY: -point.y,
        scale: point.scale,
      };
    }

    // In the transition gap between this point and the next
    const nextPoint = sorted[i + 1];
    if (nextPoint && currentTimeSec > pointEnd && currentTimeSec < nextPoint.time) {
      const transitionDuration = nextPoint.time - pointEnd;
      const progress = interpolate(
        currentTimeSec,
        [pointEnd, nextPoint.time],
        [0, 1],
        {
          extrapolateLeft: 'clamp',
          extrapolateRight: 'clamp',
          easing: EASING.move,
        },
      );

      return {
        translateX: interpolate(progress, [0, 1], [-point.x, -nextPoint.x]),
        translateY: interpolate(progress, [0, 1], [-point.y, -nextPoint.y]),
        scale: interpolate(progress, [0, 1], [point.scale, nextPoint.scale]),
      };
    }
  }

  return identity;
}

// ── PIP Window ────────────────────────────────────────────────

interface PipWindowProps {
  src: string;
  startFromFrames: number;
  position: PipPosition;
  accent: string;
}

/** Resolve a PipPosition to absolute CSS positioning. */
function getPipPositionStyle(position: PipPosition): React.CSSProperties {
  const margin = 20;

  switch (position) {
    case 'bottom-right':
      return { bottom: margin, right: margin };
    case 'bottom-left':
      return { bottom: margin, left: margin };
    case 'top-right':
      return { top: margin, right: margin };
    case 'top-left':
      return { top: margin, left: margin };
  }
}

const PipWindow: React.FC<PipWindowProps> = ({
  src,
  startFromFrames,
  position,
  accent,
}) => {
  const positionStyle = getPipPositionStyle(position);

  return (
    <div
      style={{
        position: 'absolute',
        ...positionStyle,
        width: SIZING.pipWidth,
        height: SIZING.pipHeight,
        borderRadius: SIZING.pipBorderRadius,
        border: `${SIZING.pipBorderWidth}px solid ${accent}`,
        overflow: 'hidden',
        boxShadow: '0 4px 24px rgba(0, 0, 0, 0.6)',
      }}
    >
      <OffthreadVideo
        src={src}
        startFrom={startFromFrames}
        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
      />
    </div>
  );
};

// ── Helpers ───────────────────────────────────────────────────

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
