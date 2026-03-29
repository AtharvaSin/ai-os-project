/**
 * ProcessFlow — Animated horizontal node chain.
 *
 * Renders a row of rounded card nodes connected by arrow lines.
 * Nodes appear one at a time with a staggered spring, then connection
 * arrows draw on between them. An active node is highlighted with a
 * pillar glow and accent border.
 */

import React from 'react';
import { useCurrentFrame, useVideoConfig, spring, interpolate } from 'remotion';
import { COLORS, SIZING, type PillarNumber } from '../constants';
import { getPillarColor, getPillarGlow, withOpacity } from '../utils/colors';
import { SPRING_CONFIGS } from '../utils/animations';
import { FONT_FAMILY } from '../utils/fonts';

interface ProcessFlowNode {
  label: string;
  icon?: string;
}

interface ProcessFlowProps {
  /** Ordered list of nodes in the flow */
  nodes: ProcessFlowNode[];
  /** Index of the currently active/highlighted node */
  activeIndex?: number;
  /** Which content pillar determines the accent color */
  pillar: PillarNumber;
  /** Frame delay before the entrance animation starts */
  delay?: number;
}

/** Frames between each node's entrance */
const NODE_STAGGER = 8;
/** Frames after all nodes are visible before arrows begin drawing */
const ARROW_WAIT = 5;
/** Frames for each arrow draw animation */
const ARROW_DRAW_FRAMES = 10;
/** Arrow line color */
const ARROW_COLOR = '#6B6E7B';

export const ProcessFlow: React.FC<ProcessFlowProps> = ({
  nodes,
  activeIndex,
  pillar,
  delay = 0,
}) => {
  const accent = getPillarColor(pillar);
  const glow = getPillarGlow(pillar, 0.25);

  // Frame at which the last node finishes its entrance
  const allNodesVisibleAt = delay + (nodes.length - 1) * NODE_STAGGER;
  // Frame at which arrows start drawing
  const arrowsStartAt = allNodesVisibleAt + ARROW_WAIT;

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 0,
      }}
    >
      {nodes.map((node, index) => {
        const isLast = index === nodes.length - 1;
        return (
          <React.Fragment key={node.label}>
            <FlowNode
              node={node}
              index={index}
              isActive={activeIndex === index}
              accent={accent}
              glow={glow}
              delay={delay}
            />
            {!isLast && (
              <FlowArrow
                index={index}
                startFrame={arrowsStartAt + index * ARROW_DRAW_FRAMES}
              />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};

// ── Flow Node ───────────────────────────────────────────────

interface FlowNodeProps {
  node: ProcessFlowNode;
  index: number;
  isActive: boolean;
  accent: string;
  glow: string;
  delay: number;
}

const FlowNode: React.FC<FlowNodeProps> = ({
  node,
  index,
  isActive,
  accent,
  glow,
  delay,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const nodeDelay = delay + index * NODE_STAGGER;

  const progress = spring({
    frame: frame - nodeDelay,
    fps,
    config: SPRING_CONFIGS.bouncy,
  });

  const scale = interpolate(progress, [0, 1], [0.3, 1]);
  const opacity = interpolate(progress, [0, 0.2], [0, 1], {
    extrapolateRight: 'clamp',
  });

  return (
    <div
      style={{
        transform: `scale(${scale})`,
        opacity,
        backgroundColor: COLORS.bg.card,
        borderRadius: SIZING.borderRadius,
        border: isActive
          ? `2px solid ${accent}`
          : `1px solid ${COLORS.border}`,
        padding: SIZING.cardPaddingSm,
        boxShadow: isActive ? glow : 'none',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 6,
        minWidth: 100,
      }}
    >
      {/* Optional icon / emoji */}
      {node.icon ? (
        <div style={{ fontSize: 22, lineHeight: 1 }}>{node.icon}</div>
      ) : null}

      {/* Label */}
      <div
        style={{
          fontFamily: FONT_FAMILY.body,
          fontWeight: 500,
          fontSize: 14,
          color: isActive ? COLORS.text.primary : COLORS.text.secondary,
          textAlign: 'center',
          lineHeight: 1.3,
          whiteSpace: 'nowrap',
        }}
      >
        {node.label}
      </div>
    </div>
  );
};

// ── Flow Arrow ──────────────────────────────────────────────

interface FlowArrowProps {
  index: number;
  startFrame: number;
}

const FlowArrow: React.FC<FlowArrowProps> = ({ startFrame }) => {
  const frame = useCurrentFrame();
  const elapsed = frame - startFrame;

  // Arrow fades / draws in over ARROW_DRAW_FRAMES
  const drawProgress = interpolate(elapsed, [0, ARROW_DRAW_FRAMES], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const lineWidth = 32;
  const arrowSize = 6;

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        width: lineWidth + arrowSize,
        height: 20,
        opacity: drawProgress,
        flexShrink: 0,
      }}
    >
      {/* Line */}
      <div
        style={{
          width: lineWidth * drawProgress,
          height: 2,
          backgroundColor: ARROW_COLOR,
        }}
      />
      {/* Arrowhead (simple triangle via border trick) */}
      <div
        style={{
          width: 0,
          height: 0,
          borderTop: `${arrowSize}px solid transparent`,
          borderBottom: `${arrowSize}px solid transparent`,
          borderLeft: `${arrowSize}px solid ${withOpacity(ARROW_COLOR, drawProgress)}`,
        }}
      />
    </div>
  );
};
