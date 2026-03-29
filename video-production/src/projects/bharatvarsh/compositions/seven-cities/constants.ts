/**
 * constants.ts — Brand tokens for the "Seven Cities Burn" BVN-24x7 reel.
 *
 * Context B emergency palette, font stacks, city target data,
 * scene frame timeline, and global video config.
 *
 * 18 seconds at 30 fps = 540 frames total (1.5× original 12s).
 */

// ─── Brand Colors — Context B emergency palette ─────────────────────────────
export const C = {
  obsidian: "#0A0D12",
  navy: "#0D1B2A",
  cyan: "#17D0E3",
  mustard: "#F1C232",
  red: "#FF2D2D",
  cream: "#F5F0E1",
  green: "#00FF66",
  textPrimary: "#F0F4F8",
  textSecondary: "#A0AEC0",
  textMuted: "#718096",
  white: "#FFFFFF",
};

// ─── Font Stacks ─────────────────────────────────────────────────────────────
export const FONT = {
  mono: "'JetBrains Mono', 'Courier New', monospace",
  display: "'Bebas Neue', 'Impact', sans-serif",
};

// ─── Seven target cities in detonation order ─────────────────────────────────
// x/y are normalised map coordinates (0–1) for overlay positioning.
export const CITIES = [
  { name: "Bhojpal", x: 0.35, y: 0.42 },
  { name: "Mysuru", x: 0.4, y: 0.78 },
  { name: "Gopakapattana", x: 0.52, y: 0.65 },
  { name: "Jammu", x: 0.38, y: 0.18 },
  { name: "Kathmandu", x: 0.58, y: 0.25 },
  { name: "Kolkata", x: 0.68, y: 0.45 },
  { name: "Lakshmanpur", x: 0.48, y: 0.35 },
] as const;

// ─── Frame timeline (30 fps, 18 seconds = 540 frames) ───────────────────────
// 1.5× the original 12-second timeline for more breathing room.
export const SCENE = {
  standby:  { start: 0,   end: 67 },   // 0.0–2.25s  (was 0–1.5s)
  breaking: { start: 67,  end: 135 },   // 2.25–4.5s  (was 1.5–3.0s)
  street:   { start: 135, end: 247 },   // 4.5–8.25s  (was 3.0–5.5s)
  warRoom:  { start: 247, end: 360 },   // 8.25–12.0s (was 5.5–8.0s)
  claim:    { start: 360, end: 450 },   // 12.0–15.0s (was 8.0–10.0s)
  question: { start: 450, end: 540 },   // 15.0–18.0s (was 10.0–12.0s)
} as const;

export const FPS = 30;
export const DURATION_FRAMES = 540;

// ─── Common text shadow for legibility ───────────────────────────────────────
export const TEXT_SHADOW = "0 2px 8px rgba(0,0,0,0.9), 0 0 20px rgba(0,0,0,0.6)";
export const TEXT_SHADOW_HEAVY = "0 2px 12px rgba(0,0,0,0.95), 0 0 30px rgba(0,0,0,0.7), 0 4px 40px rgba(0,0,0,0.5)";

// ─── Safe margins for social media (keep text away from edges) ──────────────
export const SAFE_MARGIN = 72; // px — generous margin from edges
