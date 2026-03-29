/**
 * Bharatvarsh Brand Constants
 * Color tokens, typography, timing, and faction-specific configurations
 */

export const FPS = 30;
export const INTRO_DURATION_BHARATVARSH = 2 * FPS; // 2 seconds
export const SLIDE_DURATION_DEFAULT = 5 * FPS; // 5 seconds
export const ENDCARD_DURATION = 3 * FPS; // 3 seconds

// Brand Colors
export const COLORS = {
  obsidian: "#0A0D12",
  obsidian800: "#1A1F2E",
  navy: "#0B2742",
  mustard: "#F1C232",
  mustardLight: "#F5D56A",
  powderBlue: "#C9DBEE",
  textPrimary: "#F0F4F8",
  textSecondary: "#A0AEC0",
  textMuted: "#718096",
  paper: "#C3B49B",
  badgeBg: "rgba(10, 13, 18, 0.78)",
  grainOpacity: 0.06,
} as const;

// Faction Colors
export const FACTION_COLORS = {
  bharatsena: {
    primary: "#0B2742", // Navy
    secondary: "#BFD7EA",
    accent: "#17D0E3", // Cyan
    highlight: "#FFB703", // Mustard
  },
  akakpen: {
    primary: "#162B18", // Deep Green
    secondary: "#223F1C",
    accent: "#D9781E", // Orange
    highlight: "#FFC933", // Marigold
  },
  tribhuj: {
    primary: "#4A4A4A", // Grey
    secondary: "#FF6B35", // Red-Orange
    accent: "#DC2626", // Red
    highlight: "#FF9D4D", // Light Orange
  },
} as const;

// Typography
export const FONTS = {
  bebasNeue: "Bebas Neue",
  inter: "Inter",
  crimsonPro: "Crimson Pro",
  jetbrainsMono: "JetBrains Mono",
} as const;

// Timing
export const TIMING = {
  flickerDuration: 500, // ms
  typewriterSpeed: 50, // ms per character
  gowPulseDuration: 1.5 * FPS, // 1.5 seconds
  gridScrollDuration: 3 * FPS, // 3 seconds
  scanlineScrollDuration: 2 * FPS, // 2 seconds
} as const;

// Intro durations by channel
export const CHANNEL_INTRO_DURATIONS = {
  declassified_report: 2 * FPS,
  graffiti_photo: 2 * FPS,
  news_article: 2 * FPS,
} as const;

// Overlay intensities
export const OVERLAY_INTENSITIES = {
  declassified_report: 0.15,
  graffiti_photo: 0.08,
  news_article: 0.12,
} as const;
