/**
 * Brand Resolver — Video Production Engine
 * Converts ProjectConfig into BrandTokens for common components.
 */

import type { BrandTokens } from '../common/utils/brand-tokens';
import type { ProjectConfig } from './project-config';

/**
 * Build BrandTokens from a project configuration.
 * Optionally applies a content pillar override for faction/pillar-specific styling.
 */
export function resolveBrandTokens(
  project: ProjectConfig,
  pillarId?: string,
): BrandTokens {
  const { brand } = project;
  const pillar = pillarId
    ? project.content_pillars.find((p) => p.id === pillarId)
    : undefined;

  return {
    bg: {
      primary: brand.colors.bg_primary,
      surface: brand.colors.bg_surface,
      elevated: brand.colors.bg_elevated ?? brand.colors.bg_surface,
    },
    accent: {
      primary: pillar?.colors.accent ?? brand.colors.accent_primary,
      secondary: brand.colors.accent_secondary,
    },
    text: {
      primary: brand.colors.text_primary,
      secondary: brand.colors.text_secondary,
      muted: brand.colors.text_muted,
    },
    border: brand.colors.border ?? brand.colors.bg_surface,
    fonts: {
      display: brand.typography.display,
      body: brand.typography.body,
      mono: brand.typography.mono,
      narrative: brand.typography.narrative,
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
      filmGrain: brand.effects.film_grain?.enabled
        ? {
            baseFrequency: brand.effects.film_grain.base_frequency ?? 0.65,
            opacity: brand.effects.film_grain.opacity ?? 0.06,
          }
        : undefined,
      vignette: brand.effects.vignette?.enabled
        ? { opacity: brand.effects.vignette.opacity ?? 0.4 }
        : undefined,
      glow: brand.effects.glow?.enabled
        ? {
            color: brand.effects.glow.color ?? brand.colors.accent_primary,
            spread: brand.effects.glow.spread ?? 30,
          }
        : undefined,
      scanLines: brand.effects.scan_lines?.enabled
        ? { opacity: brand.effects.scan_lines.opacity ?? 0.02 }
        : undefined,
    },
    borderRadius: 8,
    accentBarWidth: 80,
  };
}

/**
 * Get pillar-specific accent color from a project config.
 */
export function getPillarAccent(project: ProjectConfig, pillarId: string): string {
  const pillar = project.content_pillars.find((p) => p.id === pillarId);
  return pillar?.colors.accent ?? project.brand.colors.accent_primary;
}
