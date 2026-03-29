/**
 * AI&U Brand Constants — Context D (Dark Mode Primary)
 *
 * All color tokens, pillar config, timing constants, font scale,
 * component sizing, and SFX paths for the Remotion video pipeline.
 */

// ── Color Tokens (Dark Mode) ─────────────────────────────────

export const COLORS = {
  bg: {
    primary: '#0F1117',
    card: '#1A1B23',
    elevated: '#242530',
    code: '#0D0D14',
  },
  border: '#2D2E3A',
  text: {
    primary: '#F0F2F5',
    secondary: '#A0A3B1',
    muted: '#6B6E7B',
  },
  status: {
    success: '#10B981',
    highlight: '#F59E0B',
    warning: '#92400E',
    error: '#EF4444',
  },
} as const;

// ── Pillar System ────────────────────────────────────────────

export type PillarNumber = 1 | 2 | 3;

export interface PillarConfig {
  accent: string;
  gradient: string;
  label: string;
  shortLabel: string;
  logoLetters: string;
}

export const PILLARS: Record<PillarNumber, PillarConfig> = {
  1: {
    accent: '#F59E0B',
    gradient: 'linear-gradient(135deg, #F59E0B, #EF4444)',
    label: 'AI for Common Person',
    shortLabel: 'Warmth',
    logoLetters: 'AI',
  },
  2: {
    accent: '#10B981',
    gradient: 'linear-gradient(135deg, #10B981, #06B6D4)',
    label: 'Using AI Tools',
    shortLabel: 'Momentum',
    logoLetters: '&',
  },
  3: {
    accent: '#6366F1',
    gradient: 'linear-gradient(135deg, #6366F1, #8B5CF6)',
    label: 'Building AI Workflows',
    shortLabel: 'Precision',
    logoLetters: 'U',
  },
} as const;

// ── Timing Constants (in frames at 30fps) ────────────────────

export const FPS = 30;

export const TIMING = {
  /** Intro sting duration in frames */
  introFrames: 75, // 2.5s
  /** Chapter card display duration in frames */
  chapterCardFrames: 52, // ~1.7s
  /** Lower third hold duration in frames */
  lowerThirdHoldFrames: 120, // 4s
  /** Lower third slide-in duration in frames */
  lowerThirdEnterFrames: 15, // 0.5s
  /** Lower third slide-out duration in frames */
  lowerThirdExitFrames: 12, // 0.4s
  /** End screen duration in frames */
  endScreenFrames: 270, // 9s
  /** Subtitle fade transition in frames */
  subtitleFadeFrames: 4,
  /** Default graphic overlay duration in frames */
  overlayDefaultFrames: 120, // 4s
  /** B-roll / meme flash duration range in frames */
  bRollMinFrames: 15, // 0.5s
  bRollMaxFrames: 60, // 2s
  /** Text punch duration in frames */
  textPunchFrames: 45, // 1.5s
  /** Callout draw-on duration in frames */
  calloutDrawFrames: 15, // 0.5s
  /** Music fade-in duration in frames */
  musicFadeInFrames: 60, // 2s
  /** Music fade-out duration in frames */
  musicFadeOutFrames: 90, // 3s
  /** Key term card default hold duration in frames */
  keyTermHoldFrames: 180, // 6s
  /** Minimum gap between key term cards in frames */
  keyTermMinGapFrames: 9000, // ~5 minutes at 30fps
} as const;

// ── Font Sizes (px) ──────────────────────────────────────────

export const FONT_SIZE = {
  /** Thumbnail / intro title */
  display: 72,
  /** Chapter card mini-promise */
  heading1: 36,
  /** Section headers / stat values */
  heading2: 28,
  /** Lower third name / card titles */
  heading3: 20,
  /** Subtitle text */
  subtitle: 22,
  /** Body / descriptions */
  body: 16,
  /** Lower third title / secondary */
  caption: 14,
  /** Code labels / source attributions */
  label: 12,
  /** Small metadata */
  micro: 11,
} as const;

// ── Component Sizing ─────────────────────────────────────────

export const SIZING = {
  /** Card border radius */
  borderRadius: 12,
  /** Small border radius */
  borderRadiusSm: 8,
  /** Card padding */
  cardPadding: 24,
  /** Small card padding */
  cardPaddingSm: 16,
  /** Pillar accent bar width */
  accentBarWidth: 4,
  /** Watermark size */
  watermarkSize: 48,
  /** Watermark opacity */
  watermarkOpacity: 0.08,
  /** Watermark margin from edge */
  watermarkMargin: 24,
  /** PIP facecam width */
  pipWidth: 240,
  /** PIP facecam height */
  pipHeight: 180,
  /** PIP border width */
  pipBorderWidth: 3,
  /** PIP border radius */
  pipBorderRadius: 12,
  /** Lower third max width */
  lowerThirdMaxWidth: 360,
  /** Progress bar height */
  progressBarHeight: 4,
  /** Safe area margin (bottom, for YouTube controls) */
  safeAreaBottom: 80,
  /** Safe area margin (sides) */
  safeAreaSide: 48,
} as const;

// ── Video Dimensions ─────────────────────────────────────────

export const DIMENSIONS = {
  longForm: { width: 1920, height: 1080 },
  short: { width: 1080, height: 1920 },
  thumbnail: { width: 1280, height: 720 },
} as const;

// ── SFX File Paths ───────────────────────────────────────────

export const SFX = {
  whoosh: 'public/sfx/whoosh.mp3',
  pop: 'public/sfx/pop.mp3',
  click: 'public/sfx/click.mp3',
  ding: 'public/sfx/ding.mp3',
  bassDrop: 'public/sfx/bass-drop.mp3',
  slide: 'public/sfx/slide.mp3',
  type: 'public/sfx/type.mp3',
} as const;

// ── Card Style Presets ───────────────────────────────────────

export const CARD_STYLE = {
  /** Standard dark card with backdrop blur */
  default: {
    backgroundColor: 'rgba(26, 27, 35, 0.85)',
    backdropFilter: 'blur(12px)',
    borderRadius: SIZING.borderRadius,
    border: `1px solid ${COLORS.border}`,
  },
  /** Elevated card (brighter bg) */
  elevated: {
    backgroundColor: COLORS.bg.elevated,
    borderRadius: SIZING.borderRadius,
    border: `1px solid ${COLORS.border}`,
  },
  /** Code block card (darker bg) */
  code: {
    backgroundColor: COLORS.bg.code,
    borderRadius: SIZING.borderRadius,
    border: `1px solid ${COLORS.border}`,
  },
} as const;
