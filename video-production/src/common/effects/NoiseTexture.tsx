/**
 * NoiseTexture — Procedural noise utilities using @remotion/noise
 */

import { noise2D, noise3D } from '@remotion/noise';

export { noise2D, noise3D } from '@remotion/noise';

/** Get smooth noise value between 0 and 1 */
export function smoothNoise(seed: string, x: number, y: number): number {
  return (noise2D(seed, x, y) + 1) / 2;
}

/** Get animated noise with time dimension */
export function animatedNoise(
  seed: string,
  x: number,
  y: number,
  time: number,
): number {
  return (noise3D(seed, x, y, time) + 1) / 2;
}

/** Generate smooth floating offset for organic motion */
export function floatingOffset(
  seed: string,
  time: number,
  amplitude = 8,
): { x: number; y: number } {
  const x = noise2D(seed + '-x', time * 0.5, 0) * amplitude;
  const y = noise2D(seed + '-y', 0, time * 0.5) * amplitude;
  return { x, y };
}

/** Generate hue rotation offset in degrees */
export function hueShift(seed: string, time: number, range = 30): number {
  return noise2D(seed, time * 0.2, 0) * range;
}
