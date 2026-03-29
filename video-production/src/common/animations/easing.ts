/**
 * Easing Presets — Video Production Common Library
 */

import { Easing } from 'remotion';

export const EASING = {
  /** Standard ease-out for entrances */
  enter: Easing.out(Easing.cubic),
  /** Standard ease-in for exits */
  exit: Easing.in(Easing.cubic),
  /** Ease-in-out for continuous motion */
  move: Easing.inOut(Easing.cubic),
  /** Sharp snap for impactful motion */
  snap: Easing.bezier(0.7, 0, 0.3, 1),
  /** Overshoot for bouncy effects */
  overshoot: Easing.bezier(0.34, 1.56, 0.64, 1),
} as const;
