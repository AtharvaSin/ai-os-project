/**
 * SolutionEngineCard — Compact overlay card for introducing solution engines.
 *
 * Shows a pixel art icon, title, and description in a dark glass card.
 * Positioned at bottom-right. Transparent background for compositing.
 *
 * Duration: 150 frames (5 seconds). Spring entrance, icon idle animation, fade exit.
 */

import React from 'react';
import {
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
  Easing,
} from 'remotion';
import { withOpacity } from '../utils/colors';
import { FONT_FAMILY } from '../utils/fonts';

// ── Props ──────────────────────────────────────────────────────

export interface SolutionEngineCardProps {
  title: string;
  description: string;
  iconType: 'briefing' | 'decision' | 'accelerator';
  /** Accent color for left bar and icon details. Defaults to Amber. */
  accentColor?: string;
}

// ── Constants ──────────────────────────────────────────────────

const AMBER = '#F59E0B';
const ICON_PX = 2;
const CARD_WIDTH = 380;
const CARD_HEIGHT = 96;

// ── Pixel Art Icons ────────────────────────────────────────────

/** Single pixel helper at the icon scale */
const Ipx: React.FC<{
  w: number;
  h: number;
  color: string;
  style?: React.CSSProperties;
}> = ({ w, h, color, style }) => (
  <div
    style={{
      width: w * ICON_PX,
      height: h * ICON_PX,
      backgroundColor: color,
      position: 'absolute',
      ...style,
    }}
  />
);

/** Briefing icon: scroll/document with magnifying glass and sparkle */
const BriefingIcon: React.FC<{ frame: number }> = ({ frame }) => {
  // Magnifying glass sway: translateX +/-2px, period 60 frames
  const sway = 2 * Math.sin((frame * 2 * Math.PI) / 60);

  return (
    <div
      style={{
        width: 64,
        height: 64,
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {/* Document/scroll */}
      <div style={{ position: 'relative', width: 12 * ICON_PX, height: 16 * ICON_PX }}>
        <Ipx w={12} h={16} color="#E8E8E8" style={{ borderRadius: 1, top: 0, left: 0 }} />
        {/* Text lines */}
        <Ipx w={8} h={1} color="#A0A3B1" style={{ top: 3 * ICON_PX, left: 2 * ICON_PX }} />
        <Ipx w={8} h={1} color="#A0A3B1" style={{ top: 6 * ICON_PX, left: 2 * ICON_PX }} />
        <Ipx w={8} h={1} color="#A0A3B1" style={{ top: 9 * ICON_PX, left: 2 * ICON_PX }} />
      </div>

      {/* Magnifying glass (overlapping bottom-right) */}
      <div
        style={{
          position: 'absolute',
          bottom: 4,
          right: 4,
          transform: `translateX(${sway}px)`,
        }}
      >
        {/* Lens ring */}
        <div
          style={{
            width: 6 * ICON_PX,
            height: 6 * ICON_PX,
            border: `${ICON_PX}px solid #3B82F6`,
            borderRadius: '50%',
            position: 'relative',
          }}
        >
          {/* Sparkle on lens */}
          <div
            style={{
              position: 'absolute',
              top: 1,
              left: 1,
              width: 1 * ICON_PX,
              height: 1 * ICON_PX,
              backgroundColor: AMBER,
            }}
          />
          <div
            style={{
              position: 'absolute',
              top: -1,
              left: 2 * ICON_PX,
              width: 1 * ICON_PX,
              height: 1 * ICON_PX,
              backgroundColor: AMBER,
            }}
          />
          <div
            style={{
              position: 'absolute',
              top: 1,
              left: 3 * ICON_PX + 1,
              width: 1 * ICON_PX,
              height: 1 * ICON_PX,
              backgroundColor: AMBER,
            }}
          />
        </div>
        {/* Handle (diagonal) */}
        <div
          style={{
            width: 4 * ICON_PX,
            height: 1 * ICON_PX,
            backgroundColor: '#6B6E7B',
            position: 'absolute',
            bottom: -2 * ICON_PX,
            right: -2 * ICON_PX,
            transform: 'rotate(45deg)',
            transformOrigin: 'top left',
          }}
        />
      </div>
    </div>
  );
};

/** Decision icon: balance scale with colored cubes, golden weight, gear-brain */
const DecisionIcon: React.FC<{ frame: number }> = ({ frame }) => {
  // Scale tips: rotate +/-2deg, period 75 frames
  const tilt = 2 * Math.sin((frame * 2 * Math.PI) / 75);

  return (
    <div
      style={{
        width: 64,
        height: 64,
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div
        style={{
          position: 'relative',
          width: 16 * ICON_PX,
          height: 14 * ICON_PX,
        }}
      >
        {/* Vertical pillar */}
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: '50%',
            transform: 'translateX(-50%)',
            width: 2 * ICON_PX,
            height: 6 * ICON_PX,
            backgroundColor: '#6B6E7B',
          }}
        />

        {/* Gear-brain on top of pillar */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: '50%',
            transform: 'translateX(-50%)',
            width: 6 * ICON_PX,
            height: 6 * ICON_PX,
            borderRadius: '50%',
            overflow: 'hidden',
            display: 'grid',
            gridTemplateColumns: `repeat(3, ${2 * ICON_PX}px)`,
            gridTemplateRows: `repeat(3, ${2 * ICON_PX}px)`,
          }}
        >
          {[
            '#8B5CF6', '#6B6E7B', '#8B5CF6',
            '#6B6E7B', '#8B5CF6', '#6B6E7B',
            '#8B5CF6', '#6B6E7B', '#8B5CF6',
          ].map((color, i) => (
            <div
              key={i}
              style={{
                width: 2 * ICON_PX,
                height: 2 * ICON_PX,
                backgroundColor: color,
              }}
            />
          ))}
        </div>

        {/* Horizontal beam (tilts) */}
        <div
          style={{
            position: 'absolute',
            top: 6 * ICON_PX,
            left: '50%',
            transform: `translateX(-50%) rotate(${tilt}deg)`,
            transformOrigin: 'center center',
            width: 14 * ICON_PX,
            height: 1 * ICON_PX,
            backgroundColor: '#6B6E7B',
          }}
        >
          {/* Left pan area */}
          <div
            style={{
              position: 'absolute',
              top: 2 * ICON_PX,
              left: 0,
              display: 'flex',
              gap: 1,
            }}
          >
            <div style={{ width: 2 * ICON_PX, height: 2 * ICON_PX, backgroundColor: '#3B82F6' }} />
            <div style={{ width: 2 * ICON_PX, height: 2 * ICON_PX, backgroundColor: '#8B5CF6' }} />
            <div style={{ width: 2 * ICON_PX, height: 2 * ICON_PX, backgroundColor: '#10B981' }} />
          </div>

          {/* Right pan area */}
          <div
            style={{
              position: 'absolute',
              top: 2 * ICON_PX,
              right: 0,
            }}
          >
            <div style={{ width: 4 * ICON_PX, height: 3 * ICON_PX, backgroundColor: AMBER }} />
          </div>
        </div>
      </div>
    </div>
  );
};

/** Accelerator icon: lightning bolt striking a transforming document */
const AcceleratorIcon: React.FC<{ frame: number }> = ({ frame }) => {
  // Lightning flicker: opacity 0.85 <-> 1.0, period 10 frames
  const flickerOpacity = 0.85 + 0.15 * Math.abs(Math.sin((frame * Math.PI) / 10));

  return (
    <div
      style={{
        width: 64,
        height: 64,
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {/* Document (split: left rough, right clean) */}
      <div
        style={{
          position: 'absolute',
          right: 6,
          top: 8,
          display: 'flex',
          overflow: 'hidden',
          borderRadius: 1,
        }}
      >
        {/* Left half: rough (alternating pixels) */}
        <div style={{ width: 4 * ICON_PX, height: 12 * ICON_PX, position: 'relative', backgroundColor: '#E8E8E8' }}>
          {[1, 3, 5, 7, 9].map((row) => (
            <div
              key={row}
              style={{
                position: 'absolute',
                top: row * ICON_PX,
                left: ICON_PX,
                width: 2 * ICON_PX,
                height: 1 * ICON_PX,
                backgroundColor: row % 2 === 1 ? '#A0A3B1' : '#CACDD8',
              }}
            />
          ))}
        </div>
        {/* Right half: clean */}
        <div style={{ width: 4 * ICON_PX, height: 12 * ICON_PX, position: 'relative', backgroundColor: '#F0F2F5' }}>
          {[2, 4, 6, 8].map((row) => (
            <div
              key={row}
              style={{
                position: 'absolute',
                top: row * ICON_PX,
                left: ICON_PX,
                width: 2 * ICON_PX,
                height: 1 * ICON_PX,
                backgroundColor: '#6B6E7B',
              }}
            />
          ))}
        </div>
      </div>

      {/* Lightning bolt */}
      <div
        style={{
          position: 'absolute',
          left: 6,
          top: 6,
          opacity: flickerOpacity,
        }}
      >
        {/* Lightning bolt shape built from pixel blocks */}
        <div style={{ position: 'relative', width: 10 * ICON_PX, height: 16 * ICON_PX }}>
          {/* Top-right diagonal */}
          <Ipx w={5} h={2} color={AMBER} style={{ top: 0, left: 4 * ICON_PX }} />
          <Ipx w={4} h={2} color={AMBER} style={{ top: 2 * ICON_PX, left: 3 * ICON_PX }} />
          <Ipx w={7} h={2} color={AMBER} style={{ top: 4 * ICON_PX, left: 2 * ICON_PX }} />
          {/* Middle wide section */}
          <Ipx w={5} h={2} color={AMBER} style={{ top: 6 * ICON_PX, left: 3 * ICON_PX }} />
          <Ipx w={4} h={2} color={AMBER} style={{ top: 8 * ICON_PX, left: 2 * ICON_PX }} />
          {/* Bottom point */}
          <Ipx w={3} h={2} color={AMBER} style={{ top: 10 * ICON_PX, left: 1 * ICON_PX }} />
          <Ipx w={2} h={2} color={AMBER} style={{ top: 12 * ICON_PX, left: 0 }} />
          <Ipx w={1} h={2} color={AMBER} style={{ top: 14 * ICON_PX, left: 0 }} />
        </div>
      </div>

      {/* Speed lines (right of bolt) */}
      <div
        style={{
          position: 'absolute',
          left: 10 * ICON_PX + 14,
          top: 14,
          display: 'flex',
          flexDirection: 'column',
          gap: 3,
          opacity: flickerOpacity,
        }}
      >
        <div style={{ width: 8, height: 1 * ICON_PX, backgroundColor: withOpacity(AMBER, 0.6) }} />
        <div style={{ width: 6, height: 1 * ICON_PX, backgroundColor: withOpacity(AMBER, 0.4) }} />
        <div style={{ width: 4, height: 1 * ICON_PX, backgroundColor: withOpacity(AMBER, 0.3) }} />
      </div>
    </div>
  );
};

// ── Icon Resolver ──────────────────────────────────────────────

const IconForType: React.FC<{
  iconType: SolutionEngineCardProps['iconType'];
  frame: number;
}> = ({ iconType, frame }) => {
  switch (iconType) {
    case 'briefing':
      return <BriefingIcon frame={frame} />;
    case 'decision':
      return <DecisionIcon frame={frame} />;
    case 'accelerator':
      return <AcceleratorIcon frame={frame} />;
  }
};

// ── Main Component ─────────────────────────────────────────────

export const SolutionEngineCard: React.FC<SolutionEngineCardProps> = ({
  title,
  description,
  iconType,
  accentColor = AMBER,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // ── Enter animation (frames 0-15): spring translateY + scale + opacity
  const enterProgress = spring({
    frame,
    fps,
    config: { damping: 160, stiffness: 240, mass: 0.9 },
  });

  const enterTranslateY = interpolate(enterProgress, [0, 1], [24, 0]);
  const enterScale = interpolate(enterProgress, [0, 1], [0.92, 1.0]);
  const enterOpacity = interpolate(enterProgress, [0, 0.4], [0, 1], {
    extrapolateRight: 'clamp',
  });

  // ── Exit animation (frames 120-150): fade out + slide down
  const exitProgress = interpolate(frame, [120, 150], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.in(Easing.cubic),
  });

  const exitOpacity = interpolate(exitProgress, [0, 1], [1, 0]);
  const exitTranslateY = interpolate(exitProgress, [0, 1], [0, 12]);

  const combinedOpacity = enterOpacity * exitOpacity;
  const combinedTranslateY = enterTranslateY + exitTranslateY;
  const combinedScale = enterScale;

  return (
    <div
      style={{
        position: 'absolute',
        right: 48,
        bottom: 96,
        width: CARD_WIDTH,
        height: CARD_HEIGHT,
        transform: `translateY(${combinedTranslateY}px) scale(${combinedScale})`,
        opacity: combinedOpacity,
        zIndex: 80,
      }}
    >
      <div
        style={{
          width: '100%',
          height: '100%',
          backgroundColor: 'rgba(15, 17, 23, 0.78)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          border: `1px solid ${withOpacity(AMBER, 0.25)}`,
          borderLeft: `3px solid ${accentColor}`,
          borderRadius: 12,
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          padding: '0 16px',
          gap: 14,
          boxShadow: `0 4px 24px rgba(0, 0, 0, 0.4), 0 0 8px ${withOpacity(accentColor, 0.1)}`,
        }}
      >
        {/* Left zone: pixel icon */}
        <div
          style={{
            width: 64,
            height: 64,
            flexShrink: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <IconForType iconType={iconType} frame={frame} />
        </div>

        {/* Right zone: text */}
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            gap: 4,
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              fontFamily: FONT_FAMILY.display,
              fontWeight: 600,
              fontSize: 17,
              color: '#FFFFFF',
              lineHeight: 1.2,
              letterSpacing: -0.2,
            }}
          >
            {title}
          </div>
          <div
            style={{
              fontFamily: FONT_FAMILY.body,
              fontWeight: 400,
              fontSize: 12,
              color: '#A0A3B1',
              lineHeight: 1.4,
            }}
          >
            {description}
          </div>
        </div>
      </div>
    </div>
  );
};
