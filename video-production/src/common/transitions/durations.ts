/**
 * Transition Duration Constants (frames at 30fps)
 */

export const TRANSITION_DURATION = {
  /** Quick cut (0.3s) — between sub-scenes */
  quick: 9,
  /** Standard (0.5s) — between major scenes */
  standard: 15,
  /** Slow (1s) — dramatic scene changes */
  slow: 30,
  /** Cinematic (1.5s) — intro/outro/chapter transitions */
  cinematic: 45,
} as const;

export type TransitionSpeed = keyof typeof TRANSITION_DURATION;
