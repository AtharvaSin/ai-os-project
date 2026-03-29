/**
 * Audio Utilities — Video Production Common Library
 * Volume envelope, ducking, and SFX helpers.
 */

import { interpolate } from 'remotion';
import { DEFAULT_FPS } from './timing';

export interface MusicTrackConfig {
  volume: number;
  fadeIn: number; // seconds
  fadeOut: number; // seconds
  duckDuringVoice?: boolean;
  duckVolume?: number; // 0-1, default 0.04
}

export interface SpeechSegment {
  start: number; // seconds
  end: number; // seconds
}

/**
 * Create a volume envelope function for background music.
 * Handles fade-in, fade-out, and ducking during speech.
 */
export function createVolumeEnvelope(
  totalFrames: number,
  music: MusicTrackConfig,
  speechSegments: SpeechSegment[] = [],
  fps = DEFAULT_FPS,
): (frame: number) => number {
  const fadeInFrames = music.fadeIn * fps;
  const fadeOutFrames = music.fadeOut * fps;
  const duckVolume = music.duckVolume ?? 0.04;

  return (frame: number): number => {
    let volume = music.volume;

    // Fade in
    if (frame < fadeInFrames) {
      volume *= interpolate(frame, [0, fadeInFrames], [0, 1], {
        extrapolateRight: 'clamp',
      });
    }

    // Fade out
    if (frame > totalFrames - fadeOutFrames) {
      volume *= interpolate(
        frame,
        [totalFrames - fadeOutFrames, totalFrames],
        [1, 0],
        { extrapolateLeft: 'clamp' },
      );
    }

    // Duck during speech
    if (music.duckDuringVoice && speechSegments.length > 0) {
      const currentTimeSec = frame / fps;
      const isSpeaking = speechSegments.some(
        (seg) => currentTimeSec >= seg.start && currentTimeSec <= seg.end,
      );
      if (isSpeaking) {
        volume = duckVolume;
      }
    }

    return Math.max(0, Math.min(1, volume));
  };
}
