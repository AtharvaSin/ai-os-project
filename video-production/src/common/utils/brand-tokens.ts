/**
 * BrandTokens — The universal brand contract
 *
 * Every common component accepts a `tokens: BrandTokens` prop.
 * Each project provides a factory function that builds BrandTokens
 * from its project-specific constants.
 */

export interface BrandTokens {
  /** Background colors */
  bg: {
    primary: string;
    surface: string;
    elevated: string;
  };
  /** Accent colors */
  accent: {
    primary: string;
    secondary?: string;
    gradient?: string;
  };
  /** Text colors */
  text: {
    primary: string;
    secondary: string;
    muted: string;
  };
  /** Border color */
  border: string;
  /** Typography — Google Fonts family names */
  fonts: {
    display: string;
    body: string;
    mono: string;
    narrative?: string;
  };
  /** Font sizes in px */
  fontSizes: {
    display: number;
    h1: number;
    h2: number;
    body: number;
    caption: number;
    label: number;
  };
  /** Optional visual effects */
  effects: {
    filmGrain?: { baseFrequency: number; opacity: number };
    vignette?: { opacity: number };
    glow?: { color: string; spread: number };
    scanLines?: { opacity: number };
  };
  /** Layout tokens */
  borderRadius: number;
  accentBarWidth: number;
}

/** Default font sizes — can be overridden per project */
export const DEFAULT_FONT_SIZES = {
  display: 72,
  h1: 48,
  h2: 36,
  body: 18,
  caption: 14,
  label: 12,
} as const;
