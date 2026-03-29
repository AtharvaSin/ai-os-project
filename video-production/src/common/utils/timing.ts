/**
 * Timing Utilities — Video Production Common Library
 * Frame and millisecond conversion helpers.
 */

/** Default FPS for all compositions */
export const DEFAULT_FPS = 30;

/** Convert seconds to frames */
export function secondsToFrames(seconds: number, fps = DEFAULT_FPS): number {
  return Math.round(seconds * fps);
}

/** Convert frames to seconds */
export function framesToSeconds(frames: number, fps = DEFAULT_FPS): number {
  return frames / fps;
}

/** Convert milliseconds to frames */
export function msToFrames(ms: number, fps = DEFAULT_FPS): number {
  return Math.round((ms / 1000) * fps);
}

/** Convert frames to milliseconds */
export function framesToMs(frames: number, fps = DEFAULT_FPS): number {
  return (frames / fps) * 1000;
}

/** Calculate frame timing from ms range with optional intro offset */
export function calculateFrameTiming(
  startMs: number,
  endMs: number,
  options: { introOffset?: number; fps?: number } = {},
): { startFrame: number; durationFrames: number } {
  const { introOffset = 0, fps = DEFAULT_FPS } = options;
  const startFrame = msToFrames(startMs, fps) + introOffset;
  const durationFrames = msToFrames(endMs - startMs, fps);
  return { startFrame, durationFrames };
}
