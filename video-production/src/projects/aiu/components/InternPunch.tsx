/**
 * InternPunch — 16-bit "AI Intern" character overlay with trait highlights.
 *
 * A fun card on the right side of the screen showing a pixel art intern
 * character with speech bubble, title, staggered trait highlights, and
 * a footer takeaway. Transparent background for compositing.
 *
 * Duration: 330 frames (11 seconds).
 * Animation: slide in -> speech bubble -> title -> traits highlight -> footer -> slide out.
 */

import React from 'react';
import {
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
  Easing,
} from 'remotion';
import { FONT_FAMILY } from '../utils/fonts';
import {
  loadFont as loadPressStart,
  fontFamily as pressStartFamily,
} from '@remotion/google-fonts/PressStart2P';

loadPressStart('normal', { weights: ['400'], subsets: ['latin'] });

// ── Constants ──────────────────────────────────────────────────

const PX = 5;
const CARD_WIDTH = 420;
const CARD_HEIGHT = 540;

interface TraitDef {
  label: string;
  color: string;
}

const TRAITS: TraitDef[] = [
  { label: 'Fast', color: '#F59E0B' },
  { label: 'Helpful', color: '#10B981' },
  { label: 'Overconfident', color: '#FB923C' },
  { label: 'Occasionally Wrong', color: '#EF4444' },
];

// ── Pixel Art Components ───────────────────────────────────────

/** A single pixel block at PX scale */
const Px: React.FC<{
  w: number;
  h: number;
  color: string;
  style?: React.CSSProperties;
}> = ({ w, h, color, style }) => (
  <div
    style={{
      width: w * PX,
      height: h * PX,
      backgroundColor: color,
      flexShrink: 0,
      ...style,
    }}
  />
);

/** 16-bit intern character built from div pixels */
const InternCharacter: React.FC<{
  clipboardRotation: number;
  breatheY: number;
}> = ({ clipboardRotation, breatheY }) => {
  const skinColor = '#E8C4A0';
  const hairColor = '#6B4423';
  const shirtColor = '#F59E0B';
  const pantsColor = '#374151';
  const shoeColor = '#1F2937';

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        transform: `translateY(${breatheY}px)`,
        position: 'relative',
      }}
    >
      {/* Hair with stray pixels */}
      <div style={{ position: 'relative', width: 12 * PX, height: 4 * PX }}>
        <Px w={12} h={4} color={hairColor} />
        {/* Stray hair pixels sticking up */}
        <div
          style={{
            position: 'absolute',
            top: -2 * PX,
            left: 3 * PX,
            width: 1 * PX,
            height: 2 * PX,
            backgroundColor: hairColor,
          }}
        />
        <div
          style={{
            position: 'absolute',
            top: -3 * PX,
            left: 7 * PX,
            width: 1 * PX,
            height: 3 * PX,
            backgroundColor: hairColor,
          }}
        />
      </div>

      {/* Face */}
      <div style={{ position: 'relative', width: 12 * PX, height: 12 * PX }}>
        <Px w={12} h={12} color={skinColor} />
        {/* Left eye */}
        <div
          style={{
            position: 'absolute',
            top: 3 * PX,
            left: 2 * PX,
            width: 2 * PX,
            height: 2 * PX,
            backgroundColor: '#1A1A2E',
          }}
        />
        {/* Right eye */}
        <div
          style={{
            position: 'absolute',
            top: 3 * PX,
            right: 2 * PX,
            width: 2 * PX,
            height: 2 * PX,
            backgroundColor: '#1A1A2E',
          }}
        />
        {/* Smile */}
        <div
          style={{
            position: 'absolute',
            bottom: 3 * PX,
            left: 4 * PX,
            width: 4 * PX,
            height: 1 * PX,
            backgroundColor: '#1A1A2E',
          }}
        />
      </div>

      {/* Body: shirt + arms + clipboard area */}
      <div style={{ position: 'relative', width: 16 * PX, height: 16 * PX }}>
        {/* Shirt */}
        <Px w={16} h={16} color={shirtColor} />

        {/* Name badge */}
        <div
          style={{
            position: 'absolute',
            top: 2 * PX,
            left: 5 * PX,
            width: 6 * PX,
            height: 3 * PX,
            backgroundColor: '#FFFFFF',
            borderRadius: 1,
          }}
        />

        {/* Thumbs-up arm (right side, extends up) */}
        <div
          style={{
            position: 'absolute',
            top: -3 * PX,
            right: -4 * PX,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-end',
          }}
        >
          {/* Thumb */}
          <Px w={1} h={2} color={skinColor} />
          {/* Fist */}
          <Px w={2} h={2} color={skinColor} />
          {/* Upper arm */}
          <Px w={2} h={4} color={shirtColor} />
        </div>

        {/* Clipboard arm (left side) */}
        <div
          style={{
            position: 'absolute',
            top: 4 * PX,
            left: -6 * PX,
            transform: `rotate(${clipboardRotation}deg)`,
            transformOrigin: 'right center',
          }}
        >
          {/* Arm */}
          <Px w={3} h={2} color={shirtColor} style={{ marginBottom: 0 }} />
          {/* Clipboard board */}
          <div style={{ position: 'relative' }}>
            <Px w={8} h={10} color="#92400E" />
            {/* Paper on clipboard */}
            <div
              style={{
                position: 'absolute',
                top: 1 * PX,
                left: 1 * PX,
                width: 6 * PX,
                height: 7 * PX,
                backgroundColor: '#FFFFFF',
              }}
            />
          </div>
        </div>
      </div>

      {/* Pants */}
      <div style={{ display: 'flex', gap: 1 }}>
        <Px w={7} h={10} color={pantsColor} />
        <Px w={7} h={10} color={pantsColor} />
      </div>

      {/* Shoes */}
      <div style={{ display: 'flex', gap: 2 }}>
        <Px w={7} h={3} color={shoeColor} style={{ borderRadius: '0 0 2px 2px' }} />
        <Px w={7} h={3} color={shoeColor} style={{ borderRadius: '0 0 2px 2px' }} />
      </div>
    </div>
  );
};

// ── Speech Bubble ──────────────────────────────────────────────

const SpeechBubble: React.FC<{ scale: number; opacity: number }> = ({
  scale,
  opacity,
}) => (
  <div
    style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      transform: `scale(${scale})`,
      opacity,
    }}
  >
    <div
      style={{
        backgroundColor: '#F0F2F5',
        borderRadius: 8,
        padding: '8px 14px',
        position: 'relative',
      }}
    >
      <div
        style={{
          fontFamily: pressStartFamily,
          fontSize: 10,
          color: '#0F1117',
          whiteSpace: 'nowrap' as const,
          lineHeight: 1.4,
        }}
      >
        {"I'M ON IT!"}
      </div>
    </div>
    {/* Triangle pointer */}
    <div
      style={{
        width: 0,
        height: 0,
        borderLeft: '6px solid transparent',
        borderRight: '6px solid transparent',
        borderTop: '8px solid #F0F2F5',
      }}
    />
  </div>
);

// ── Main Component ─────────────────────────────────────────────

export const InternPunch: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // ── Card slide in (frames 0-18) ─────────────────────────────
  const cardEnterProgress = spring({
    frame,
    fps,
    config: { damping: 140, stiffness: 200, mass: 1 },
  });
  const cardEnterX = interpolate(cardEnterProgress, [0, 1], [400, 0]);

  // ── Card slide out (frames 300-330) ─────────────────────────
  const cardExitProgress = interpolate(frame, [300, 330], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.in(Easing.cubic),
  });
  const cardExitX = interpolate(cardExitProgress, [0, 1], [0, 400]);

  const cardTranslateX = cardEnterX + cardExitX;

  // ── Speech bubble pop (frames 18-42) ────────────────────────
  const bubbleSpring = spring({
    frame: Math.max(0, frame - 18),
    fps,
    config: { damping: 100, stiffness: 300, mass: 0.7 },
  });
  const bubbleScale = frame < 18
    ? 0
    : interpolate(bubbleSpring, [0, 0.6, 1], [0, 1.15, 1.0]);
  const bubbleOpacity = frame < 18
    ? 0
    : interpolate(bubbleSpring, [0, 0.3], [0, 1], { extrapolateRight: 'clamp' });

  // ── Title fade in (frames 42-54) ────────────────────────────
  const titleOpacity = interpolate(frame, [42, 54], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const titleY = interpolate(frame, [42, 54], [10, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.cubic),
  });

  // ── Traits highlight (frames 78-174) ────────────────────────
  // Each trait: 24 frames duration, staggered 24 frames apart
  const getTraitHighlight = (index: number): { color: string; scale: number } => {
    const traitStart = 78 + index * 24;
    const traitEnd = traitStart + 24;

    if (frame < traitStart || frame >= traitEnd) {
      return { color: '#6B6E7B', scale: 1.0 };
    }

    const progress = (frame - traitStart) / 24;
    // Pulse scale: 1.0 -> 1.05 -> 1.0
    const pulseScale = 1.0 + 0.05 * Math.sin(progress * Math.PI);

    return { color: TRAITS[index].color, scale: pulseScale };
  };

  // ── Footer fade in (frames 174-186) ─────────────────────────
  const footerOpacity = interpolate(frame, [174, 186], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // ── Clipboard rock (frames 174-240) ─────────────────────────
  const clipboardRotation =
    frame >= 174 && frame <= 300
      ? 3 * Math.sin((frame - 174) * 0.08)
      : 0;

  // ── Character idle breathe (frames 240-300) ─────────────────
  const breatheY =
    frame >= 240 && frame <= 300
      ? Math.sin((frame - 240) * (Math.PI / 30)) * 1
      : 0;

  return (
    <div
      style={{
        position: 'absolute',
        right: 48,
        top: '50%',
        transform: `translateY(-50%) translateX(${cardTranslateX}px)`,
        width: CARD_WIDTH,
        height: CARD_HEIGHT,
        zIndex: 80,
      }}
    >
      <div
        style={{
          width: '100%',
          height: '100%',
          backgroundColor: 'rgba(15, 17, 23, 0.82)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          border: '1px solid #2D2E3A',
          borderRadius: 14,
          padding: 28,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 16,
        }}
      >
        {/* Speech bubble */}
        <SpeechBubble scale={bubbleScale} opacity={bubbleOpacity} />

        {/* Pixel Intern Character */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 180,
            height: 240,
          }}
        >
          <InternCharacter
            clipboardRotation={clipboardRotation}
            breatheY={breatheY}
          />
        </div>

        {/* Title */}
        <div
          style={{
            fontFamily: FONT_FAMILY.display,
            fontWeight: 700,
            fontSize: 22,
            color: '#FFFFFF',
            textAlign: 'center',
            lineHeight: 1.2,
            opacity: titleOpacity,
            transform: `translateY(${titleY}px)`,
          }}
        >
          Treat AI Like an Intern
        </div>

        {/* Traits line */}
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'center',
            gap: 0,
            fontFamily: FONT_FAMILY.body,
            fontSize: 13,
            lineHeight: 1.5,
          }}
        >
          {TRAITS.map((trait, i) => {
            const { color, scale } = getTraitHighlight(i);
            const separator = i < TRAITS.length - 1 ? ' \u00B7 ' : '';
            return (
              <React.Fragment key={trait.label}>
                <span
                  style={{
                    color,
                    transform: `scale(${scale})`,
                    display: 'inline-block',
                    transition: 'none',
                    fontWeight: color !== '#6B6E7B' ? 600 : 400,
                  }}
                >
                  {trait.label}
                </span>
                {separator && (
                  <span style={{ color: '#6B6E7B' }}>{separator}</span>
                )}
              </React.Fragment>
            );
          })}
        </div>

        {/* Footer */}
        <div
          style={{
            fontFamily: FONT_FAMILY.body,
            fontWeight: 500,
            fontSize: 14,
            color: '#10B981',
            opacity: footerOpacity,
            marginTop: 4,
          }}
        >
          {'\u2713'} Delegate, but Verify
        </div>
      </div>
    </div>
  );
};
