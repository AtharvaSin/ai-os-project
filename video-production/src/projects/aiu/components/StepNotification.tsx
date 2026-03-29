/**
 * StepNotification — Semi-transparent step announcement card.
 *
 * Overlays on blurred facecam to announce a framework step.
 * 70% opacity dark background with full-opaque text for legibility.
 * Pillar-colored accent. Spring entrance/exit.
 *
 * Used in Video 2 when transitioning between framework steps.
 */

import React from 'react';
import {
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import { type PillarNumber, PILLARS } from '../constants';
import { withOpacity } from '../utils/colors';
import { FONT_FAMILY } from '../utils/fonts';

export interface StepNotificationProps {
  stepNumber: number;
  title: string;
  description: string;
  pillar: PillarNumber;
  /** Total frames the card is visible (including enter/exit) */
  holdFrames?: number;
}

const ENTER_FRAMES = 18;
const EXIT_FRAMES = 14;

export const StepNotification: React.FC<StepNotificationProps> = ({
  stepNumber,
  title,
  description,
  pillar,
  holdFrames = 180,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const accent = PILLARS[pillar].accent;

  // Enter — spring scale + fade
  const enterProgress = spring({
    frame,
    fps,
    config: { damping: 160, stiffness: 240, mass: 0.9 },
  });
  const enterScale = interpolate(enterProgress, [0, 1], [0.92, 1]);
  const enterOpacity = interpolate(enterProgress, [0, 0.4], [0, 1], {
    extrapolateRight: 'clamp',
  });

  // Exit — ease-out fade + slide down
  const exitStart = holdFrames - EXIT_FRAMES;
  const exitProgress = frame >= exitStart
    ? interpolate(frame - exitStart, [0, EXIT_FRAMES], [0, 1], {
        extrapolateLeft: 'clamp',
        extrapolateRight: 'clamp',
      })
    : 0;
  const exitOpacity = interpolate(exitProgress, [0, 1], [1, 0]);
  const exitY = interpolate(exitProgress, [0, 1], [0, 20]);

  const opacity = enterOpacity * exitOpacity;
  const translateY = exitY;
  const scale = enterScale;

  return (
    <div
      style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: `translate(-50%, -50%) translateY(${translateY}px) scale(${scale})`,
        opacity,
        zIndex: 50,
        width: 700,
        display: 'flex',
        flexDirection: 'column',
        gap: 0,
      }}
    >
      <div
        style={{
          backgroundColor: 'rgba(15, 17, 23, 0.70)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderRadius: 16,
          borderLeft: `5px solid ${accent}`,
          padding: '36px 40px',
          boxShadow: `0 12px 48px rgba(0,0,0,0.4), 0 0 30px ${withOpacity(accent, 0.15)}`,
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
        }}
      >
        {/* Step chip */}
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            alignSelf: 'flex-start',
            backgroundColor: withOpacity(accent, 0.2),
            color: accent,
            fontFamily: FONT_FAMILY.code,
            fontWeight: 700,
            fontSize: 14,
            padding: '5px 14px',
            borderRadius: 999,
            letterSpacing: 1.5,
            textTransform: 'uppercase' as const,
          }}
        >
          Step {stepNumber}
        </div>

        {/* Title */}
        <div
          style={{
            fontFamily: FONT_FAMILY.display,
            fontWeight: 700,
            fontSize: 34,
            color: '#F0F2F5',
            letterSpacing: -0.5,
            lineHeight: 1.2,
          }}
        >
          {title}
        </div>

        {/* Description */}
        <div
          style={{
            fontFamily: FONT_FAMILY.body,
            fontWeight: 400,
            fontSize: 18,
            color: '#A0A3B1',
            lineHeight: 1.5,
          }}
        >
          {description}
        </div>
      </div>
    </div>
  );
};

/**
 * Returns the blur filter value for the facecam based on card visibility.
 * Call with the current frame and card timing to get the blur CSS string.
 */
export function getCardBlur(
  frame: number,
  cardAppearFrame: number,
  cardHoldFrames: number,
): string {
  const cardEndFrame = cardAppearFrame + cardHoldFrames;
  const BLUR_TRANSITION = 10; // frames to transition blur in/out

  if (frame < cardAppearFrame) return 'blur(0px)';
  if (frame > cardEndFrame) return 'blur(0px)';

  // Fade blur in
  if (frame < cardAppearFrame + BLUR_TRANSITION) {
    const t = (frame - cardAppearFrame) / BLUR_TRANSITION;
    return `blur(${t * 4}px)`;
  }
  // Fade blur out
  if (frame > cardEndFrame - BLUR_TRANSITION) {
    const t = (cardEndFrame - frame) / BLUR_TRANSITION;
    return `blur(${t * 4}px)`;
  }

  return 'blur(4px)';
}
