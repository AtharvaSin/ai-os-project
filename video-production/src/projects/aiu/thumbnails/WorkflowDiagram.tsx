/**
 * WorkflowDiagram — Thumbnail Template C
 *
 * 3-5 nodes connected by arrows in a horizontal flow.
 * One highlighted active node with pillar glow (the middle node).
 * Title text at the top.
 * Clean, minimal, mobile-readable layout.
 * Dimensions: 1280x720 (YouTube thumbnail standard).
 */

import React from 'react';
import { AbsoluteFill } from 'remotion';
import { COLORS, DIMENSIONS, SIZING, type PillarNumber } from '../constants';
import { FONT_FAMILY } from '../utils/fonts';
import { getPillarColor, getPillarGlow, withOpacity } from '../utils/colors';

// ── Props ───────────────────────────────────────────────────

export interface WorkflowDiagramProps {
  /** 3-5 node labels for the workflow */
  diagramNodes: string[];
  /** Title text at the top */
  text: string;
  /** Content pillar (1-3) */
  pillar: 1 | 2 | 3;
}

// ── Constants ───────────────────────────────────────────────

const THUMB_W = DIMENSIONS.thumbnail.width;
const THUMB_H = DIMENSIONS.thumbnail.height;
const NODE_MIN_WIDTH = 140;
const NODE_HEIGHT = 80;
const ARROW_LINE_WIDTH = 40;
const ARROW_HEAD_SIZE = 8;
const TITLE_FONT_SIZE = 40;
const NODE_FONT_SIZE = 16;
const ARROW_COLOR = '#6B6E7B';

// ── Component ───────────────────────────────────────────────

export const WorkflowDiagram: React.FC<WorkflowDiagramProps> = ({
  diagramNodes,
  text,
  pillar,
}) => {
  const accent = getPillarColor(pillar as PillarNumber);
  const glow = getPillarGlow(pillar as PillarNumber, 0.3);

  // The active node is the middle one (floor division for even counts)
  const activeIndex = Math.floor(diagramNodes.length / 2);

  return (
    <AbsoluteFill
      style={{
        width: THUMB_W,
        height: THUMB_H,
        backgroundColor: COLORS.bg.primary,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
      }}
    >
      {/* ── Background subtle radial glow ────────────────────── */}
      <div
        style={{
          position: 'absolute',
          top: '55%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 700,
          height: 400,
          borderRadius: '50%',
          background: `radial-gradient(ellipse, ${withOpacity(accent, 0.08)} 0%, transparent 70%)`,
          filter: 'blur(60px)',
          pointerEvents: 'none',
        }}
      />

      {/* ── Title Text ───────────────────────────────────────── */}
      <div
        style={{
          position: 'absolute',
          top: 40,
          left: 0,
          right: 0,
          display: 'flex',
          justifyContent: 'center',
        }}
      >
        <div
          style={{
            fontFamily: FONT_FAMILY.display,
            fontWeight: 700,
            fontSize: TITLE_FONT_SIZE,
            color: COLORS.text.primary,
            textAlign: 'center',
            lineHeight: 1.2,
            letterSpacing: '-0.02em',
            textTransform: 'uppercase',
            maxWidth: '80%',
          }}
        >
          {text}
        </div>
      </div>

      {/* ── Node Chain ───────────────────────────────────────── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 0,
          marginTop: 40,
        }}
      >
        {diagramNodes.map((label, index) => {
          const isActive = index === activeIndex;
          const isLast = index === diagramNodes.length - 1;

          return (
            <React.Fragment key={`${label}-${index}`}>
              {/* Node */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  minWidth: NODE_MIN_WIDTH,
                  height: NODE_HEIGHT,
                  padding: '12px 20px',
                  borderRadius: SIZING.borderRadius,
                  backgroundColor: isActive
                    ? withOpacity(accent, 0.15)
                    : COLORS.bg.card,
                  border: isActive
                    ? `2px solid ${accent}`
                    : `1px solid ${COLORS.border}`,
                  boxShadow: isActive ? glow : 'none',
                }}
              >
                <span
                  style={{
                    fontFamily: FONT_FAMILY.body,
                    fontWeight: isActive ? 700 : 500,
                    fontSize: NODE_FONT_SIZE,
                    color: isActive ? COLORS.text.primary : COLORS.text.secondary,
                    textAlign: 'center',
                    lineHeight: 1.3,
                    whiteSpace: 'nowrap',
                  }}
                >
                  {label}
                </span>
              </div>

              {/* Arrow between nodes */}
              {!isLast && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    width: ARROW_LINE_WIDTH + ARROW_HEAD_SIZE,
                    flexShrink: 0,
                  }}
                >
                  {/* Line */}
                  <div
                    style={{
                      width: ARROW_LINE_WIDTH,
                      height: 2,
                      backgroundColor: ARROW_COLOR,
                    }}
                  />
                  {/* Arrowhead */}
                  <div
                    style={{
                      width: 0,
                      height: 0,
                      borderTop: `${ARROW_HEAD_SIZE}px solid transparent`,
                      borderBottom: `${ARROW_HEAD_SIZE}px solid transparent`,
                      borderLeft: `${ARROW_HEAD_SIZE}px solid ${ARROW_COLOR}`,
                    }}
                  />
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* ── Step numbers below nodes ─────────────────────────── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 0,
          marginTop: 16,
        }}
      >
        {diagramNodes.map((_, index) => {
          const isActive = index === activeIndex;
          const isLast = index === diagramNodes.length - 1;

          return (
            <React.Fragment key={`step-${index}`}>
              <div
                style={{
                  minWidth: NODE_MIN_WIDTH,
                  display: 'flex',
                  justifyContent: 'center',
                }}
              >
                <span
                  style={{
                    fontFamily: FONT_FAMILY.code,
                    fontSize: 12,
                    fontWeight: 600,
                    color: isActive ? accent : COLORS.text.muted,
                    letterSpacing: '0.05em',
                  }}
                >
                  STEP {index + 1}
                </span>
              </div>
              {/* Spacer matching arrow width */}
              {!isLast && (
                <div
                  style={{
                    width: ARROW_LINE_WIDTH + ARROW_HEAD_SIZE,
                    flexShrink: 0,
                  }}
                />
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* ── Bottom accent line ───────────────────────────────── */}
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: 4,
          background: `linear-gradient(90deg, transparent 10%, ${accent} 50%, transparent 90%)`,
        }}
      />
    </AbsoluteFill>
  );
};
