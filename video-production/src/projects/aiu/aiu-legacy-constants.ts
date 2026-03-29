/**
 * AI&U Brand Constants
 * Color tokens, animation configs, and shared values for AI&U video compositions.
 */

export const AIU_COLORS = {
  amber: "#DC8D52",
  peachCream: "#FDF0E4",
  burntSienna: "#A65D2E",
  softCoral: "#E8A87C",
  warmIvory: "#FFF8F0",
  cloudWhite: "#FEFEFE",
  inkBlack: "#080808",
  slate: "#6B7280",
  mist: "#E5E7EB",
  warmGray: "#F5F3F0",
  signalGreen: "#48DD71",
  steelIndigo: "#5B6ABF",
} as const;

export const AIU_FPS = 30;

/** Standard spring — crisp entrance with minimal overshoot */
export const SPRING_CONFIG = { damping: 12, stiffness: 100, mass: 0.8 };

/** Soft spring — gentle, slow settle */
export const SPRING_SOFT = { damping: 15, stiffness: 80, mass: 1 };

/** Bouncy spring — playful overshoot */
export const SPRING_BOUNCY = { damping: 8, stiffness: 120, mass: 0.6 };
