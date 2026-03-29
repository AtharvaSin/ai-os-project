/**
 * Spring Configurations — Video Production Common Library
 * Reusable spring physics presets for consistent motion.
 */

import { spring, useCurrentFrame, useVideoConfig } from 'remotion';

export const SPRING_CONFIGS = {
  /** Fast, snappy — element pops, callouts */
  fast: { damping: 200, stiffness: 300, mass: 0.8 },
  /** Smooth, natural — slides, fades */
  smooth: { damping: 150, stiffness: 200, mass: 1 },
  /** Bouncy, playful — intro logo, meme drops */
  bouncy: { damping: 100, stiffness: 350, mass: 0.6 },
  /** Heavy, impactful — text punch, slam-in */
  impact: { damping: 80, stiffness: 400, mass: 1.2 },
  /** Cinematic, slow — dramatic reveals */
  cinematic: { damping: 200, stiffness: 120, mass: 1.5 },
} as const;

export type SpringPreset = keyof typeof SPRING_CONFIGS;

interface UseSpringOptions {
  delay?: number;
  config?: SpringPreset;
  reverse?: boolean;
}

/** Hook returning a spring value (0 → 1) using current frame */
export function useSpring(options: UseSpringOptions = {}): number {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { delay = 0, config = 'smooth', reverse = false } = options;

  const value = spring({
    frame: frame - delay,
    fps,
    config: SPRING_CONFIGS[config],
  });

  return reverse ? 1 - value : value;
}
