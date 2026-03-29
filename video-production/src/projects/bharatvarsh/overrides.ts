/**
 * Bharatvarsh Brand Resolver
 * Maps project constants to BrandTokens interface for common components.
 */
import type { BrandTokens } from '../../common/utils/brand-tokens';
import { COLORS, FACTION_COLORS, FONTS } from './constants';
import type { StoryAngle } from './types';

export function getBharatvarshTokens(faction?: StoryAngle): BrandTokens {
  const factionColors = faction ? FACTION_COLORS[faction] : undefined;

  return {
    bg: {
      primary: COLORS.obsidian,
      surface: COLORS.obsidian800,
      elevated: '#252A3B',
    },
    accent: {
      primary: factionColors?.highlight ?? COLORS.mustard,
      secondary: COLORS.powderBlue,
    },
    text: {
      primary: COLORS.textPrimary,
      secondary: COLORS.textSecondary,
      muted: COLORS.textMuted,
    },
    border: '#323848',
    fonts: {
      display: FONTS.bebasNeue,
      body: FONTS.inter,
      mono: FONTS.jetbrainsMono,
      narrative: FONTS.crimsonPro,
    },
    fontSizes: {
      display: 72,
      h1: 48,
      h2: 36,
      body: 18,
      caption: 14,
      label: 12,
    },
    effects: {
      filmGrain: { baseFrequency: 0.65, opacity: COLORS.grainOpacity },
      vignette: { opacity: 0.4 },
      scanLines: { opacity: 0.02 },
    },
    borderRadius: 4,
    accentBarWidth: 80,
  };
}
