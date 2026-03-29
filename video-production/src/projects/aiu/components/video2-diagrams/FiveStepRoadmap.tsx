/**
 * FiveStepRoadmap — Vertical roadmap infographic for the 5-step AI framework.
 *
 * Light theme (Pillar 1 Warmth) full-screen graphic with:
 * - Vertical path track on the left with numbered waypoints
 * - Content cards that spring in from the right for each step
 * - Progressive reveal synced to narration timing
 * - Step 3 has deployment lane sub-items
 * - Progress bar at bottom
 *
 * Duration: 73s (2190 frames at 30fps)
 * Used in Video 2 Section 2 ("The General Approach")
 */

import React from 'react';
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
  Easing,
} from 'remotion';
import { FONT_FAMILY } from '../../utils/fonts';

// ── Colors (Pillar 1 Light Theme) ────────────────────────────

const C = {
  bg: '#FFF8F0',           // Warm Ivory
  cardBg: '#FEFEFE',       // Cloud White
  accent: '#DC8D52',       // Amber Orange
  accentLight: '#FDF0E4',  // Peach Cream
  accentDark: '#A65D2E',   // Burnt Sienna
  companion: '#E8A87C',    // Soft Coral
  ink: '#080808',          // Ink Black
  slate: '#6B7280',        // Slate
  mist: '#E5E7EB',         // Mist
  warmGray: '#F5F3F0',     // Warm Gray
  white: '#FFFFFF',
} as const;

// ── Step data ────────────────────────────────────────────────

interface StepData {
  num: number;
  title: string;
  description: string;
  iconPath: string; // SVG path data
}

const STEPS: StepData[] = [
  {
    num: 1,
    title: 'Identify Pain Points',
    description: 'List every task where AI can reduce friction in your workflow',
    iconPath: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4',
  },
  {
    num: 2,
    title: 'Classify AI Impact',
    description: 'Map each pain point to an AI capability category',
    iconPath: 'M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12',
  },
  {
    num: 3,
    title: 'Choose Deployment Lane',
    description: 'Decide the scope: Personal, Team, or Organization',
    iconPath: 'M13 7l5 5m0 0l-5 5m5-5H6M3 7v10',
  },
  {
    num: 4,
    title: 'Add Guardrails',
    description: 'Control AI behavior, validate outputs, set boundaries',
    iconPath: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z',
  },
  {
    num: 5,
    title: 'Operationalize',
    description: 'Integrate AI into real workflows — not just experiments',
    iconPath: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z',
  },
];

// Step 3 deployment lane sub-items
const DEPLOY_LANES = [
  { label: 'Personal Life', color: C.companion },
  { label: 'Work Environment', color: C.accent },
  { label: 'Community & Other', color: C.accentLight, textColor: C.accentDark },
];

// ── Timing (frame numbers at 30fps) ──────────────────────────

// Timings mapped to actual SRT narration, relative to infographic start (B-roll 144.5s)
const STEP_TIMINGS = [
  { activateFrame: 25, label: 'Step 1' },    // 0.8s — "it starts with identifying pain points"
  { activateFrame: 147, label: 'Step 2' },   // 4.9s — "classifying which AI impact area"
  { activateFrame: 471, label: 'Step 3' },   // 15.7s — "choosing your own deployment lane"
  { activateFrame: 1131, label: 'Step 4' },  // 37.7s — "add guardrails to the AI"
  { activateFrame: 1626, label: 'Step 5' },  // 54.2s — "operationalize AI"
];
const COMPLETION_FRAME = 2040; // 68s
const TOTAL_FRAMES = 2130;    // 71s
const DEPLOY_LANES_FRAME = 570; // 19s — sub-items appear for step 3

// ── Layout constants ─────────────────────────────────────────

const PATH_X = 260;          // center of waypoint circles
const CARD_X = 340;          // left edge of content cards
const CARD_WIDTH = 1350;
const WAYPOINT_R = 26;       // circle radius
const FIRST_Y = 200;         // y of first waypoint
const STEP_SPACING = 165;    // vertical space between waypoints
const CARD_HEIGHT = 120;
const PROGRESS_BAR_Y = 1030;

// ── Component ────────────────────────────────────────────────

export const FiveStepRoadmap: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // ── Header entrance ─────────────────────────────────────
  const headerOpacity = interpolate(frame, [0, 30], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const headerY = interpolate(frame, [0, 30], [20, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.cubic),
  });

  // ── Path track entrance ─────────────────────────────────
  const trackOpacity = interpolate(frame, [15, 45], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // ── Completion pulse ────────────────────────────────────
  const isComplete = frame >= COMPLETION_FRAME;
  const completePulse = isComplete
    ? interpolate(
        (frame - COMPLETION_FRAME) % 60,
        [0, 30, 60],
        [0, 0.3, 0],
      )
    : 0;

  // ── Fade out ────────────────────────────────────────────
  const fadeOut = interpolate(
    frame,
    [TOTAL_FRAMES - 30, TOTAL_FRAMES],
    [1, 0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' },
  );

  // ── Determine active step ───────────────────────────────
  let activeStep = -1;
  for (let i = STEP_TIMINGS.length - 1; i >= 0; i--) {
    if (frame >= STEP_TIMINGS[i].activateFrame) {
      activeStep = i;
      break;
    }
  }

  // ── Progress bar ────────────────────────────────────────
  const progressFraction = activeStep >= 0 ? (activeStep + 1) / 5 : 0;
  const progressWidth = spring({
    frame: Math.max(0, frame - (STEP_TIMINGS[Math.max(0, activeStep)]?.activateFrame || 0)),
    fps,
    config: { damping: 200, stiffness: 120, mass: 1 },
  });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: C.bg,
        opacity: fadeOut,
      }}
    >
      {/* Header */}
      <div
        style={{
          position: 'absolute',
          top: 50,
          left: 0,
          right: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 12,
          opacity: headerOpacity,
          transform: `translateY(${headerY}px)`,
        }}
      >
        <span
          style={{
            fontFamily: FONT_FAMILY.display,
            fontWeight: 700,
            fontSize: 40,
            color: C.ink,
            letterSpacing: -1,
          }}
        >
          The 5-Step AI Readiness Framework
        </span>
        <div
          style={{
            width: 80,
            height: 3,
            backgroundColor: C.accent,
            borderRadius: 2,
          }}
        />
      </div>

      {/* Path track (vertical line) */}
      <div
        style={{
          position: 'absolute',
          left: PATH_X - 2,
          top: FIRST_Y,
          width: 4,
          height: STEP_SPACING * 4,
          opacity: trackOpacity,
        }}
      >
        {/* Mist background track */}
        <div
          style={{
            position: 'absolute',
            width: '100%',
            height: '100%',
            backgroundColor: C.mist,
            borderRadius: 2,
          }}
        />
        {/* Amber filled portion */}
        <div
          style={{
            position: 'absolute',
            width: '100%',
            height: activeStep >= 0
              ? `${((Math.min(activeStep, 3) + 1) / 4) * 100}%`
              : '0%',
            backgroundColor: C.accent,
            borderRadius: 2,
            transition: 'height 0.8s ease-out',
          }}
        />
      </div>

      {/* Waypoints + Cards */}
      {STEPS.map((step, i) => {
        const timing = STEP_TIMINGS[i];
        const isActive = activeStep === i;
        const isCompleted = activeStep > i;
        const isUpcoming = activeStep < i;

        // Waypoint fill animation
        const waypointProgress = spring({
          frame: Math.max(0, frame - timing.activateFrame),
          fps,
          config: { damping: 180, stiffness: 280, mass: 0.8 },
        });

        // Card entrance
        const cardProgress = spring({
          frame: Math.max(0, frame - timing.activateFrame - 5),
          fps,
          config: { damping: 140, stiffness: 200, mass: 1 },
        });
        const cardX = interpolate(cardProgress, [0, 1], [60, 0]);
        const cardOpacity = interpolate(cardProgress, [0, 0.3], [0, 1], {
          extrapolateRight: 'clamp',
        });

        // Dim completed cards
        const dimOpacity = isCompleted ? 0.65 : 1;

        const y = FIRST_Y + i * STEP_SPACING;

        return (
          <React.Fragment key={i}>
            {/* Waypoint circle */}
            <div
              style={{
                position: 'absolute',
                left: PATH_X - WAYPOINT_R,
                top: y - WAYPOINT_R,
                width: WAYPOINT_R * 2,
                height: WAYPOINT_R * 2,
                borderRadius: WAYPOINT_R,
                backgroundColor: isUpcoming
                  ? C.bg
                  : interpolate(waypointProgress, [0, 1], [0, 1]) > 0.5
                    ? C.accent
                    : C.mist,
                border: isUpcoming
                  ? `3px solid ${C.mist}`
                  : `3px solid ${C.accent}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                opacity: trackOpacity,
                boxShadow: (isActive && !isComplete)
                  ? `0 0 20px ${C.accent}40`
                  : isComplete && completePulse > 0
                    ? `0 0 ${20 + completePulse * 30}px ${C.accent}60`
                    : 'none',
                zIndex: 5,
              }}
            >
              {isCompleted ? (
                // Checkmark
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
                  stroke={C.white} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                // Number
                <span
                  style={{
                    fontFamily: FONT_FAMILY.display,
                    fontWeight: 700,
                    fontSize: 18,
                    color: isUpcoming ? C.mist : C.white,
                    lineHeight: 1,
                  }}
                >
                  {step.num}
                </span>
              )}
            </div>

            {/* Content card */}
            {!isUpcoming && (
              <div
                style={{
                  position: 'absolute',
                  left: CARD_X,
                  top: y - 45,
                  width: CARD_WIDTH,
                  opacity: cardOpacity * dimOpacity,
                  transform: `translateX(${cardX}px)`,
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 20,
                  backgroundColor: C.cardBg,
                  borderRadius: 12,
                  borderLeft: `4px solid ${isActive ? C.accent : C.mist}`,
                  padding: '20px 28px',
                  boxShadow: isActive
                    ? `0 4px 24px rgba(0,0,0,0.08), 0 0 0 1px ${C.accent}20`
                    : '0 2px 8px rgba(0,0,0,0.04)',
                }}
              >
                {/* Icon */}
                <div
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 12,
                    backgroundColor: isActive ? `${C.accent}18` : C.warmGray,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none"
                    stroke={isActive ? C.accent : C.slate}
                    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d={step.iconPath} />
                  </svg>
                </div>

                {/* Text */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <span
                    style={{
                      fontFamily: FONT_FAMILY.display,
                      fontWeight: 700,
                      fontSize: 26,
                      color: C.ink,
                      letterSpacing: -0.5,
                      lineHeight: 1.2,
                    }}
                  >
                    {step.title}
                  </span>
                  {/* Show description only for active step */}
                  {isActive && (
                    <span
                      style={{
                        fontFamily: FONT_FAMILY.body,
                        fontWeight: 400,
                        fontSize: 18,
                        color: C.slate,
                        lineHeight: 1.4,
                      }}
                    >
                      {step.description}
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Step 3 deployment lane sub-items */}
            {i === 2 && isActive && frame >= DEPLOY_LANES_FRAME && (
              <div
                style={{
                  position: 'absolute',
                  left: CARD_X + 80,
                  top: y + 55,
                  display: 'flex',
                  gap: 12,
                }}
              >
                {DEPLOY_LANES.map((lane, li) => {
                  const laneProgress = spring({
                    frame: Math.max(0, frame - DEPLOY_LANES_FRAME - li * 8),
                    fps,
                    config: { damping: 160, stiffness: 260, mass: 0.8 },
                  });
                  const laneScale = interpolate(laneProgress, [0, 1], [0.7, 1]);
                  const laneOpacity = interpolate(laneProgress, [0, 0.3], [0, 1], {
                    extrapolateRight: 'clamp',
                  });

                  return (
                    <div
                      key={li}
                      style={{
                        transform: `scale(${laneScale})`,
                        opacity: laneOpacity,
                        padding: '8px 18px',
                        borderRadius: 999,
                        backgroundColor: lane.color,
                        color: lane.textColor || C.white,
                        fontFamily: FONT_FAMILY.body,
                        fontWeight: 600,
                        fontSize: 15,
                        whiteSpace: 'nowrap',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                      }}
                    >
                      {lane.label}
                    </div>
                  );
                })}
              </div>
            )}
          </React.Fragment>
        );
      })}

      {/* Progress bar */}
      <div
        style={{
          position: 'absolute',
          left: 260,
          right: 260,
          top: PROGRESS_BAR_Y,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 10,
          opacity: trackOpacity,
        }}
      >
        <div
          style={{
            width: '100%',
            height: 6,
            borderRadius: 3,
            backgroundColor: C.mist,
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              height: '100%',
              width: `${progressFraction * progressWidth * 100}%`,
              borderRadius: 3,
              backgroundColor: C.accent,
              boxShadow: `0 0 12px ${C.accent}40`,
            }}
          />
        </div>
        {/* Step indicator dots */}
        <div style={{ display: 'flex', gap: 8 }}>
          {STEPS.map((_, i) => (
            <div
              key={i}
              style={{
                width: 8,
                height: 8,
                borderRadius: 4,
                backgroundColor: i <= activeStep ? C.accent : C.mist,
              }}
            />
          ))}
        </div>
      </div>
    </AbsoluteFill>
  );
};
