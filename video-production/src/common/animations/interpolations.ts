/**
 * Interpolation Hooks — Video Production Common Library
 * Higher-level animation hooks built on springs.
 */

import { useCurrentFrame, interpolate } from 'remotion';
import { useSpring } from './springs';
import { EASING } from './easing';

interface SlideInOptions {
  direction?: 'left' | 'right' | 'top' | 'bottom';
  distance?: number;
  delay?: number;
}

/** Returns translateX/Y + opacity for a slide-in animation */
export function useSlideIn(options: SlideInOptions = {}): {
  translateX: number;
  translateY: number;
  opacity: number;
} {
  const { direction = 'left', distance = 40, delay = 0 } = options;
  const progress = useSpring({ delay, config: 'smooth' });

  const offset = interpolate(progress, [0, 1], [distance, 0]);
  const opacity = interpolate(progress, [0, 0.3], [0, 1], {
    extrapolateRight: 'clamp',
  });

  switch (direction) {
    case 'left':
      return { translateX: -offset, translateY: 0, opacity };
    case 'right':
      return { translateX: offset, translateY: 0, opacity };
    case 'top':
      return { translateX: 0, translateY: -offset, opacity };
    case 'bottom':
      return { translateX: 0, translateY: offset, opacity };
  }
}

/** Returns scale + opacity for a pop-in animation (0.3 → 1 with overshoot) */
export function useScaleIn(delay = 0): { scale: number; opacity: number } {
  const progress = useSpring({ delay, config: 'bouncy' });
  return {
    scale: interpolate(progress, [0, 1], [0.3, 1]),
    opacity: interpolate(progress, [0, 0.2], [0, 1], {
      extrapolateRight: 'clamp',
    }),
  };
}

/** Returns opacity for a fade-in effect */
export function useFadeIn(delay = 0, duration = 15): number {
  const frame = useCurrentFrame();
  return interpolate(frame - delay, [0, duration], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: EASING.enter,
  });
}

/** Returns scale + opacity for a slam-in (1.8 → 1, heavy damping) */
export function useSlamIn(delay = 0): { scale: number; opacity: number } {
  const progress = useSpring({ delay, config: 'impact' });
  return {
    scale: interpolate(progress, [0, 1], [1.8, 1]),
    opacity: interpolate(progress, [0, 0.15], [0, 1], {
      extrapolateRight: 'clamp',
    }),
  };
}
