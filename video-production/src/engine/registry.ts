/**
 * Composition Registry — Video Production Engine
 * Helpers for registering compositions from project directories.
 */

export const DIMENSIONS = {
  /** 16:9 landscape (YouTube, general) */
  landscape: { width: 1920, height: 1080 },
  /** 9:16 vertical (Reels, Shorts, TikTok) */
  vertical: { width: 1080, height: 1920 },
  /** 1:1 square (Instagram feed) */
  square: { width: 1080, height: 1080 },
  /** 4:5 portrait (Instagram, Facebook) */
  portrait: { width: 1080, height: 1350 },
  /** Thumbnail (YouTube) */
  thumbnail: { width: 1280, height: 720 },
} as const;

export type DimensionPreset = keyof typeof DIMENSIONS;

export const DEFAULT_FPS = 30;

/** Get dimensions for a format string */
export function getDimensions(format: DimensionPreset | string): { width: number; height: number } {
  if (format in DIMENSIONS) {
    return DIMENSIONS[format as DimensionPreset];
  }
  // Parse custom format like "1920x1080"
  const parts = format.split('x').map(Number);
  if (parts.length === 2 && parts[0] > 0 && parts[1] > 0) {
    return { width: parts[0], height: parts[1] };
  }
  return DIMENSIONS.landscape;
}
