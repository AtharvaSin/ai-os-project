/**
 * BRollScene — Visual insert scene with animation variants.
 *
 * Displays a video clip or static image with one of four animation
 * presets: ken_burns (slow zoom + pan), slide_in (from right),
 * fade (simple opacity), or flash (scale-pop like BRollDrop).
 * Optionally renders a text overlay strip at the bottom and
 * karaoke subtitles if voiceover continues during the b-roll.
 * Watermark is always present.
 */

import React from 'react';
import {
  AbsoluteFill,
  Img,
  OffthreadVideo,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
} from 'remotion';
import { COLORS, SIZING, type PillarNumber } from '../constants';
import type { BRollAnimation, SubtitleSegment } from '../types';
import { getPillarColor, withOpacity } from '../utils/colors';
import { FONT_FAMILY } from '../utils/fonts';
import { EASING } from '../utils/animations';
import { SubtitleOverlay } from '../components/SubtitleOverlay';
import { Watermark } from '../components/Watermark';

// ── Props ───────────────────────────────────────────────────

interface BRollSceneProps {
  /** Path to the media file (video or image) */
  source: string;
  /** Animation preset to apply to the media */
  animation: BRollAnimation;
  /** Total scene duration in frames */
  duration: number;
  /** Optional text to overlay on a dark gradient strip at the bottom */
  overlay?: string;
  /** Content pillar for accent colors and subtitles */
  pillar: PillarNumber;
  /** Optional word-level subtitle segments for karaoke overlay */
  subtitles?: SubtitleSegment[];
}

// ── Helpers ─────────────────────────────────────────────────

/**
 * Determine whether a source path points to a video file.
 */
function isVideoSource(source: string): boolean {
  const lower = source.toLowerCase();
  return lower.endsWith('.mp4') || lower.endsWith('.webm');
}

// ── Component ───────────────────────────────────────────────

export const BRollScene: React.FC<BRollSceneProps> = ({
  source,
  animation,
  duration,
  overlay,
  pillar,
  subtitles,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const accent = getPillarColor(pillar);
  const isVideo = isVideoSource(source);

  // ── Animation transforms ────────────────────────────────────

  let animStyle: React.CSSProperties = {};

  switch (animation) {
    case 'ken_burns': {
      // Slow zoom from 1.0 to 1.1 with slight upward pan
      const zoomProgress = interpolate(frame, [0, duration], [1.0, 1.1], {
        extrapolateLeft: 'clamp',
        extrapolateRight: 'clamp',
      });
      const panY = interpolate(frame, [0, duration], [0, -15], {
        extrapolateLeft: 'clamp',
        extrapolateRight: 'clamp',
      });
      // Fade in over first 10 frames
      const kenOpacity = interpolate(frame, [0, 10], [0, 1], {
        extrapolateLeft: 'clamp',
        extrapolateRight: 'clamp',
      });
      animStyle = {
        transform: `scale(${zoomProgress}) translateY(${panY}px)`,
        opacity: kenOpacity,
      };
      break;
    }

    case 'slide_in': {
      // Slide from off-screen right
      const slideProgress = interpolate(frame, [0, 15], [0, 1], {
        extrapolateLeft: 'clamp',
        extrapolateRight: 'clamp',
        easing: EASING.enter,
      });
      const translateX = interpolate(slideProgress, [0, 1], [200, 0]);
      const slideOpacity = interpolate(slideProgress, [0, 0.3], [0, 1], {
        extrapolateRight: 'clamp',
      });
      animStyle = {
        transform: `translateX(${translateX}px)`,
        opacity: slideOpacity,
      };
      break;
    }

    case 'fade': {
      // Simple opacity fade over 15 frames
      const fadeOpacity = interpolate(frame, [0, 15], [0, 1], {
        extrapolateLeft: 'clamp',
        extrapolateRight: 'clamp',
        easing: EASING.enter,
      });
      animStyle = {
        opacity: fadeOpacity,
      };
      break;
    }

    case 'flash': {
      // Quick scale-pop (BRollDrop style): 0.8 -> 1.0 with overshoot
      const enterScale = interpolate(frame, [0, 10], [0.8, 1], {
        extrapolateLeft: 'clamp',
        extrapolateRight: 'clamp',
        easing: EASING.overshoot,
      });
      const enterRotation = interpolate(frame, [0, 10], [-2, 0], {
        extrapolateLeft: 'clamp',
        extrapolateRight: 'clamp',
        easing: EASING.enter,
      });
      const enterOpacity = interpolate(frame, [0, 4], [0, 1], {
        extrapolateLeft: 'clamp',
        extrapolateRight: 'clamp',
      });
      // Exit fade in last 8 frames
      const exitStart = Math.max(duration - 8, 0);
      const exitOpacity = interpolate(frame, [exitStart, duration], [1, 0], {
        extrapolateLeft: 'clamp',
        extrapolateRight: 'clamp',
      });
      animStyle = {
        transform: `scale(${enterScale}) rotate(${enterRotation}deg)`,
        opacity: Math.min(enterOpacity, exitOpacity),
      };
      break;
    }
  }

  // ── Overlay text fade-in ────────────────────────────────────

  const overlayOpacity = overlay
    ? interpolate(frame, [Math.round(fps * 0.3), Math.round(fps * 0.6)], [0, 1], {
        extrapolateLeft: 'clamp',
        extrapolateRight: 'clamp',
      })
    : 0;

  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.bg.primary }}>
      {/* Media layer with animation */}
      <AbsoluteFill style={animStyle}>
        {isVideo ? (
          <OffthreadVideo
            src={staticFile(source)}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
            }}
          />
        ) : (
          <Img
            src={staticFile(source)}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
            }}
          />
        )}
      </AbsoluteFill>

      {/* Optional text overlay strip at bottom */}
      {overlay ? (
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            background: `linear-gradient(transparent 0%, ${withOpacity(COLORS.bg.primary, 0.85)} 40%, ${withOpacity(COLORS.bg.primary, 0.95)} 100%)`,
            padding: `${SIZING.safeAreaBottom + 20}px ${SIZING.safeAreaSide}px ${SIZING.safeAreaBottom}px`,
            display: 'flex',
            justifyContent: 'center',
            opacity: overlayOpacity,
          }}
        >
          <div
            style={{
              fontFamily: FONT_FAMILY.body,
              fontWeight: 500,
              fontSize: 20,
              color: COLORS.text.primary,
              textAlign: 'center',
              lineHeight: 1.5,
              maxWidth: 800,
              textShadow: `0 2px 8px ${withOpacity('#000000', 0.6)}`,
              borderLeft: `3px solid ${accent}`,
              paddingLeft: 16,
            }}
          >
            {overlay}
          </div>
        </div>
      ) : null}

      {/* Karaoke subtitles (if voiceover continues during b-roll) */}
      {subtitles && subtitles.length > 0 ? (
        <SubtitleOverlay segments={subtitles} pillar={pillar} />
      ) : null}

      {/* Watermark */}
      <Watermark />
    </AbsoluteFill>
  );
};
