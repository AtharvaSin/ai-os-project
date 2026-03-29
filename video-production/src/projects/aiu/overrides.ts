/**
 * AI&U Brand Resolver
 *
 * Maps project constants to the BrandTokens interface
 * so common components can render with AI&U's visual identity.
 * Pass a pillar number to apply pillar-specific accent overrides.
 */
import type { BrandTokens } from '../../common/utils/brand-tokens';
import { COLORS, PILLARS, SIZING, FONT_SIZE, type PillarNumber } from './constants';

/**
 * Build a BrandTokens object for the AI&U project.
 * @param pillar - Which content pillar to style for (1, 2, or 3). Defaults to 1.
 */
export function getAIUTokens(pillar: PillarNumber = 1): BrandTokens {
  const p = PILLARS[pillar];

  return {
    bg: {
      primary: COLORS.bg.primary,
      surface: COLORS.bg.card,
      elevated: COLORS.bg.elevated,
    },
    accent: {
      primary: p.accent,
      gradient: p.gradient,
    },
    text: {
      primary: COLORS.text.primary,
      secondary: COLORS.text.secondary,
      muted: COLORS.text.muted,
    },
    border: COLORS.border,
    fonts: {
      display: 'Space Grotesk',
      body: 'Inter',
      mono: 'JetBrains Mono',
    },
    fontSizes: {
      display: FONT_SIZE.display,
      h1: FONT_SIZE.heading1,
      h2: FONT_SIZE.heading2,
      body: FONT_SIZE.body,
      caption: FONT_SIZE.caption,
      label: FONT_SIZE.label,
    },
    effects: {
      glow: { color: p.accent, spread: 30 },
    },
    borderRadius: SIZING.borderRadius,
    accentBarWidth: SIZING.accentBarWidth,
  };
}
