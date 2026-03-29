/**
 * ExperienceOrbit — Animated credential badges orbiting around the creator avatar.
 *
 * A reusable "creator credentials intro" overlay used across all videos.
 * Shows a half-body avatar inside a holographic pedestal frame, centered on
 * screen, with capability badges (with SVG icons) orbiting in a pseudo-3D
 * elliptical path.
 *
 * Reusable across pillars — swap pillar prop to change accent color.
 * Avatar image must be provided per pillar (different outfit color).
 *
 * Usage:
 *   - Video 2 S1 (P1): credentials intro at ~1:22-1:34
 *   - Any future video: same segment, different pillar
 */

import React from 'react';
import {
  AbsoluteFill,
  Img,
  OffthreadVideo,
  Sequence,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
  Easing,
} from 'remotion';
import { COLORS, SIZING, type PillarNumber, PILLARS } from '../constants';
import { getPillarColor, withOpacity } from '../utils/colors';
import { FONT_FAMILY } from '../utils/fonts';

// ── Badge icon SVGs (inline, 20x20 viewBox) ─────────────────

const BADGE_ICONS: Record<string, React.ReactNode> = {
  'AI Solutions': (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2a4 4 0 0 1 4 4c0 1.5-.8 2.8-2 3.4V11h3a3 3 0 0 1 3 3v1" />
      <path d="M12 2a4 4 0 0 0-4 4c0 1.5.8 2.8 2 3.4V11H7a3 3 0 0 0-3 3v1" />
      <circle cx="12" cy="18" r="3" />
      <path d="M12 15v-4" />
      <path d="M4 15v2a3 3 0 0 0 3 3h2" />
      <path d="M20 15v2a3 3 0 0 1-3 3h-2" />
    </svg>
  ),
  'Cloud Architecture': (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.5 19a4.5 4.5 0 1 0 0-9 1 1 0 0 0-.1 0A5.5 5.5 0 0 0 7 10.5a1 1 0 0 0 0 .1A4.5 4.5 0 0 0 6.5 19h11z" />
      <path d="M12 13v6" />
      <path d="M9.5 15.5L12 13l2.5 2.5" />
    </svg>
  ),
  'Enterprise Systems': (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="2" width="16" height="20" rx="2" />
      <path d="M9 7h6" />
      <path d="M9 11h6" />
      <path d="M9 15h4" />
      <circle cx="16" cy="18" r="1" fill="currentColor" />
    </svg>
  ),
  'On-Premise AI': (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="2" width="20" height="8" rx="2" />
      <rect x="2" y="14" width="20" height="8" rx="2" />
      <circle cx="6" cy="6" r="1" fill="currentColor" />
      <circle cx="6" cy="18" r="1" fill="currentColor" />
      <path d="M14 6h4" />
      <path d="M14 18h4" />
    </svg>
  ),
  'Production AI': (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M12 1v2" />
      <path d="M12 21v2" />
      <path d="M4.22 4.22l1.42 1.42" />
      <path d="M18.36 18.36l1.42 1.42" />
      <path d="M1 12h2" />
      <path d="M21 12h2" />
      <path d="M4.22 19.78l1.42-1.42" />
      <path d="M18.36 5.64l1.42-1.42" />
    </svg>
  ),
  'GenAI Systems': (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3l1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5L12 3z" />
      <path d="M19 14l.9 2.7 2.7.9-2.7.9-.9 2.7-.9-2.7-2.7-.9 2.7-.9L19 14z" />
      <path d="M5 17l.6 1.8 1.8.6-1.8.6-.6 1.8-.6-1.8-1.8-.6 1.8-.6L5 17z" />
    </svg>
  ),
};

// ── Default badges (creator's experience areas) ──────────────

const DEFAULT_BADGES = [
  'AI Solutions',
  'Cloud Architecture',
  'Enterprise Systems',
  'On-Premise AI',
  'Production AI',
  'GenAI Systems',
];

// ── Pillar-specific background tints (light mode panels) ─────

const PILLAR_BG: Record<PillarNumber, string> = {
  1: 'rgba(255, 248, 240, 0.88)', // Warm Ivory
  2: 'rgba(240, 255, 247, 0.88)', // Cool Mint
  3: 'rgba(244, 244, 251, 0.88)', // Cool Ivory
};

// ── Pillar-specific solid backgrounds for matching ───────────

const PILLAR_BG_SOLID: Record<PillarNumber, string> = {
  1: '#FFF8F0', // Warm Ivory
  2: '#F0FFF7', // Cool Mint
  3: '#F4F4FB', // Cool Ivory
};

// ── Props ────────────────────────────────────────────────────

export interface ExperienceOrbitProps {
  /** Content pillar — determines accent color and background tint */
  pillar: PillarNumber;
  /**
   * Path to the avatar image (transparent PNG or video).
   * Use staticFile() path. Must be a bust crop (~1200x1600).
   */
  avatarSrc: string;
  /** Whether avatarSrc is a video file (mp4) instead of a static image */
  avatarIsVideo?: boolean;
  /** Badge labels — defaults to the 6 standard credential badges */
  badges?: string[];
  /** Seconds per full orbit revolution (default: 24) */
  orbitSpeed?: number;
  /** Frame delay before the overall animation starts (default: 0) */
  delay?: number;
  /**
   * Frame delay before the avatar appears inside the pedestal.
   * The pedestal frame and orbiting badges are visible from frame 0.
   * The avatar fades in after this many frames. (default: 0)
   */
  avatarDelayFrames?: number;
}

// ── Orbit math helpers ───────────────────────────────────────

/** Ellipse semi-axes */
const ORBIT_RX = 680;
const ORBIT_RY = 280;
/** Ellipse center offset from frame center (push orbit slightly lower) */
const ORBIT_CENTER_Y_OFFSET = 20;
/** Tilt angle in radians (~12°) for depth feel */
const ORBIT_TILT = 0.21;

interface BadgePosition {
  x: number;
  y: number;
  scale: number;
  opacity: number;
  zIndex: number;
}

function getBadgePosition(angle: number): BadgePosition {
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  const x = ORBIT_RX * cos;
  const rawY = ORBIT_RY * sin;
  const y = rawY * Math.cos(ORBIT_TILT);

  const depth = (sin + 1) / 2;
  const scale = interpolate(depth, [0, 1], [1.0, 0.82]);
  const opacity = interpolate(depth, [0, 1], [1.0, 0.5]);
  const zIndex = sin < 0 ? 30 : 10;

  return { x, y, scale, opacity, zIndex };
}

// ── Component ────────────────────────────────────────────────

export const ExperienceOrbit: React.FC<ExperienceOrbitProps> = ({
  pillar,
  avatarSrc,
  avatarIsVideo = false,
  badges = DEFAULT_BADGES,
  orbitSpeed = 24,
  delay = 0,
  avatarDelayFrames = 0,
}) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const f = frame - delay;

  const accent = getPillarColor(pillar);
  const bgTint = PILLAR_BG[pillar];
  const bgSolid = PILLAR_BG_SOLID[pillar];
  const badgeCount = badges.length;

  // ── Phase timing (in adjusted frames) ───────────────────
  const BADGE_SPAWN_START = 8; // badges start appearing quickly
  const BADGE_SPAWN_STAGGER = 12; // slightly faster stagger
  const FADE_OUT_START = durationInFrames - delay - 45; // 1.5s fade out
  const FADE_OUT_END = durationInFrames - delay;

  // ── Avatar entrance (delayed by avatarDelayFrames) ──────
  const avatarFrame = Math.max(0, f - avatarDelayFrames);
  const avatarEnter = spring({
    frame: avatarFrame,
    fps,
    config: { damping: 140, stiffness: 180, mass: 1.1 },
  });
  const avatarTranslateY = interpolate(avatarEnter, [0, 1], [40, 0]);
  const avatarOpacity = interpolate(avatarEnter, [0, 0.4], [0, 1], {
    extrapolateRight: 'clamp',
  });

  // ── Pedestal glow pulse ─────────────────────────────────
  const glowPulse = interpolate(
    Math.sin((f / fps) * Math.PI * 0.8),
    [-1, 1],
    [0.3, 0.6],
  );

  // ── Background panel entrance ───────────────────────────
  const panelOpacity = interpolate(f, [0, 20], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // ── Fade-out phase ──────────────────────────────────────
  const fadeOutProgress = interpolate(
    f,
    [FADE_OUT_START, FADE_OUT_END],
    [1, 0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' },
  );

  // ── Orbit rotation (continuous) ─────────────────────────
  const framesPerRevolution = orbitSpeed * fps;
  const baseAngle = (f / framesPerRevolution) * Math.PI * 2;

  // ── Pedestal scan line animation ────────────────────────
  const scanY = interpolate(
    (f % (fps * 3)) / (fps * 3),
    [0, 1],
    [0, 100],
  );

  return (
    <AbsoluteFill
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: bgSolid,
      }}
    >
      {/* Frosted background panel */}
      <div
        style={{
          position: 'absolute',
          width: 1600,
          height: 900,
          borderRadius: 24,
          backgroundColor: bgTint,
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          boxShadow: `0 8px 60px rgba(0, 0, 0, 0.12), 0 0 0 1px ${withOpacity(accent, 0.15)}`,
          opacity: panelOpacity * fadeOutProgress,
        }}
      />

      {/* Orbit container (centered) */}
      <div
        style={{
          position: 'absolute',
          width: ORBIT_RX * 2 + 200,
          height: ORBIT_RY * 2 + 200,
          top: '50%',
          left: '50%',
          transform: `translate(-50%, calc(-50% + ${ORBIT_CENTER_Y_OFFSET}px))`,
        }}
      >
        {/* Back badges (behind avatar, z < 20) */}
        {badges.map((label, i) => {
          const angle = baseAngle + (i / badgeCount) * Math.PI * 2;
          const pos = getBadgePosition(angle);
          if (pos.zIndex >= 20) return null;
          return (
            <OrbitBadge
              key={`back-${i}`}
              label={label}
              index={i}
              accent={accent}
              pos={pos}
              adjustedFrame={f}
              fps={fps}
              spawnStart={BADGE_SPAWN_START}
              spawnStagger={BADGE_SPAWN_STAGGER}
              fadeOut={fadeOutProgress}
              containerWidth={ORBIT_RX * 2 + 200}
              containerHeight={ORBIT_RY * 2 + 200}
            />
          );
        })}

        {/* ── Holographic Pedestal + Avatar (z-index 20) ── */}
        <div
          style={{
            position: 'absolute',
            left: '50%',
            top: '50%',
            transform: 'translate(-50%, -45%)',
            opacity: panelOpacity * fadeOutProgress,
            zIndex: 20,
            width: 440,
            height: 560,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'flex-start',
          }}
        >
          {/* Pedestal frame — outer glow border */}
          <div
            style={{
              position: 'relative',
              width: '100%',
              height: '100%',
              borderRadius: 20,
              border: `2px solid ${withOpacity(accent, glowPulse)}`,
              boxShadow: [
                `0 0 30px ${withOpacity(accent, glowPulse * 0.4)}`,
                `0 0 60px ${withOpacity(accent, glowPulse * 0.15)}`,
                `inset 0 0 40px ${withOpacity(accent, 0.05)}`,
              ].join(', '),
              overflow: 'hidden',
              backgroundColor: bgSolid,
            }}
          >
            {/* Avatar media — fills the pedestal, fades in after avatarDelayFrames */}
            <div
              style={{
                width: '100%',
                height: '100%',
                position: 'relative',
                opacity: avatarOpacity,
                transform: `translateY(${avatarTranslateY}px)`,
              }}
            >
              {avatarIsVideo ? (
                <Sequence
                  from={avatarDelayFrames + delay}
                  layout="none"
                >
                  <OffthreadVideo
                    src={avatarSrc}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      objectPosition: 'center 15%',
                    }}
                    muted
                  />
                </Sequence>
              ) : (
                <Img
                  src={avatarSrc}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    objectPosition: 'center 15%',
                  }}
                />
              )}

              {/* Bottom fade — blends avatar into pedestal base */}
              <div
                style={{
                  position: 'absolute',
                  bottom: 0,
                  left: 0,
                  right: 0,
                  height: '35%',
                  background: `linear-gradient(to bottom, transparent 0%, ${bgSolid} 100%)`,
                }}
              />

              {/* Side fades — soften left/right edges */}
              <div
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  bottom: 0,
                  width: '12%',
                  background: `linear-gradient(to right, ${withOpacity(bgSolid, 0.6)} 0%, transparent 100%)`,
                }}
              />
              <div
                style={{
                  position: 'absolute',
                  top: 0,
                  right: 0,
                  bottom: 0,
                  width: '12%',
                  background: `linear-gradient(to left, ${withOpacity(bgSolid, 0.6)} 0%, transparent 100%)`,
                }}
              />

              {/* Holographic scan line */}
              <div
                style={{
                  position: 'absolute',
                  left: 0,
                  right: 0,
                  top: `${scanY}%`,
                  height: 2,
                  background: `linear-gradient(90deg, transparent 0%, ${withOpacity(accent, 0.25)} 30%, ${withOpacity(accent, 0.4)} 50%, ${withOpacity(accent, 0.25)} 70%, transparent 100%)`,
                }}
              />
            </div>

            {/* Corner brackets — holographic frame accents */}
            <HoloBracket position="top-left" accent={accent} />
            <HoloBracket position="top-right" accent={accent} />
            <HoloBracket position="bottom-left" accent={accent} />
            <HoloBracket position="bottom-right" accent={accent} />
          </div>

          {/* Pedestal base glow — beneath the frame */}
          <div
            style={{
              width: '80%',
              height: 8,
              marginTop: -4,
              borderRadius: '0 0 20px 20px',
              background: `linear-gradient(90deg, transparent, ${withOpacity(accent, glowPulse * 0.5)}, transparent)`,
              filter: 'blur(6px)',
            }}
          />
        </div>

        {/* Front badges (in front of avatar, z >= 20) */}
        {badges.map((label, i) => {
          const angle = baseAngle + (i / badgeCount) * Math.PI * 2;
          const pos = getBadgePosition(angle);
          if (pos.zIndex < 20) return null;
          return (
            <OrbitBadge
              key={`front-${i}`}
              label={label}
              index={i}
              accent={accent}
              pos={pos}
              adjustedFrame={f}
              fps={fps}
              spawnStart={BADGE_SPAWN_START}
              spawnStagger={BADGE_SPAWN_STAGGER}
              fadeOut={fadeOutProgress}
              containerWidth={ORBIT_RX * 2 + 200}
              containerHeight={ORBIT_RY * 2 + 200}
            />
          );
        })}
      </div>

      {/* Subtle accent glow at bottom center */}
      <div
        style={{
          position: 'absolute',
          bottom: 80,
          left: '50%',
          transform: 'translateX(-50%)',
          width: 600,
          height: 120,
          borderRadius: '50%',
          background: `radial-gradient(ellipse, ${withOpacity(accent, 0.12)} 0%, transparent 70%)`,
          opacity: panelOpacity * fadeOutProgress,
          filter: 'blur(30px)',
        }}
      />
    </AbsoluteFill>
  );
};

// ── HoloBracket — corner accent for pedestal frame ───────────

interface HoloBracketProps {
  position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  accent: string;
}

const HoloBracket: React.FC<HoloBracketProps> = ({ position, accent }) => {
  const size = 24;
  const thickness = 2;
  const offset = 10;

  const isTop = position.includes('top');
  const isLeft = position.includes('left');

  return (
    <div
      style={{
        position: 'absolute',
        width: size,
        height: size,
        [isTop ? 'top' : 'bottom']: offset,
        [isLeft ? 'left' : 'right']: offset,
      }}
    >
      {/* Horizontal stroke */}
      <div
        style={{
          position: 'absolute',
          [isTop ? 'top' : 'bottom']: 0,
          [isLeft ? 'left' : 'right']: 0,
          width: size,
          height: thickness,
          backgroundColor: withOpacity(accent, 0.7),
          borderRadius: 1,
        }}
      />
      {/* Vertical stroke */}
      <div
        style={{
          position: 'absolute',
          [isTop ? 'top' : 'bottom']: 0,
          [isLeft ? 'left' : 'right']: 0,
          width: thickness,
          height: size,
          backgroundColor: withOpacity(accent, 0.7),
          borderRadius: 1,
        }}
      />
    </div>
  );
};

// ── OrbitBadge sub-component ─────────────────────────────────

interface OrbitBadgeProps {
  label: string;
  index: number;
  accent: string;
  pos: BadgePosition;
  adjustedFrame: number;
  fps: number;
  spawnStart: number;
  spawnStagger: number;
  fadeOut: number;
  containerWidth: number;
  containerHeight: number;
}

const OrbitBadge: React.FC<OrbitBadgeProps> = ({
  label,
  index,
  accent,
  pos,
  adjustedFrame,
  fps,
  spawnStart,
  spawnStagger,
  fadeOut,
  containerWidth,
  containerHeight,
}) => {
  const spawnFrame = spawnStart + index * spawnStagger;
  const spawnProgress = spring({
    frame: Math.max(0, adjustedFrame - spawnFrame),
    fps,
    config: { damping: 120, stiffness: 200, mass: 0.9 },
  });

  if (adjustedFrame < spawnFrame) return null;

  const currentX = interpolate(spawnProgress, [0, 1], [0, pos.x]);
  const currentY = interpolate(spawnProgress, [0, 1], [0, pos.y]);
  const currentScale = interpolate(spawnProgress, [0, 1], [0.3, pos.scale]);
  const currentOpacity = interpolate(spawnProgress, [0, 1], [0, pos.opacity]);

  const popScale =
    spawnProgress > 0.85
      ? interpolate(spawnProgress, [0.85, 0.95, 1], [1, 1.08, 1])
      : 1;

  const icon = BADGE_ICONS[label];

  return (
    <div
      style={{
        position: 'absolute',
        left: containerWidth / 2 + currentX,
        top: containerHeight / 2 + currentY,
        transform: `translate(-50%, -50%) scale(${currentScale * popScale})`,
        opacity: currentOpacity * fadeOut,
        zIndex: pos.zIndex,
        whiteSpace: 'nowrap',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: '10px 22px 10px 14px',
          borderRadius: 999,
          backgroundColor: '#FEFEFE',
          border: `2px solid ${withOpacity(accent, 0.35)}`,
          boxShadow: `0 2px 12px rgba(0, 0, 0, 0.08), 0 0 20px ${withOpacity(accent, 0.08)}`,
        }}
      >
        {/* Icon */}
        {icon ? (
          <div
            style={{
              width: 26,
              height: 26,
              borderRadius: 13,
              backgroundColor: withOpacity(accent, 0.12),
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: accent,
              flexShrink: 0,
            }}
          >
            {icon}
          </div>
        ) : (
          <div
            style={{
              width: 10,
              height: 10,
              borderRadius: 5,
              backgroundColor: accent,
              flexShrink: 0,
            }}
          />
        )}
        {/* Label */}
        <span
          style={{
            fontFamily: FONT_FAMILY.body,
            fontWeight: 600,
            fontSize: 18,
            color: '#080808',
            letterSpacing: 0.2,
          }}
        >
          {label}
        </span>
      </div>
    </div>
  );
};
