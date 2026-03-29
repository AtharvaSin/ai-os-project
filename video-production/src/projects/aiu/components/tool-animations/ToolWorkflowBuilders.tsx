/**
 * ToolWorkflowBuilders — "The Node Graph"
 *
 * 120-frame (4s) looping animation showing a node-based workflow
 * diagram with trigger nodes, a central LLM brain node, and action
 * nodes. Data packets travel along bezier paths as triggers fire
 * and the LLM processes requests into actions.
 *
 * 1920x1080, transparent background.
 */

import React from 'react';
import {
  AbsoluteFill,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import { COLORS } from '../../constants';
import { FONT_FAMILY } from '../../utils/fonts';
import { withOpacity } from '../../utils/colors';
import { N8NLogo, ZapierLogo } from './ToolLogos';

const TOTAL_FRAMES = 120;

// ── Node definitions ─────────────────────────────────────────

interface NodeDef {
  x: number;
  y: number;
  width: number;
  height: number;
  label: string;
  icon: string;
}

const TRIGGER_NODES: NodeDef[] = [
  { x: 280, y: 280, width: 140, height: 56, label: 'On Email', icon: '\u2709' },
  { x: 280, y: 460, width: 140, height: 56, label: 'Schedule', icon: '\uD83D\uDCC5' },
  { x: 280, y: 640, width: 140, height: 56, label: 'Form Submit', icon: '\uD83D\uDCCB' },
];

const LLM_NODE: NodeDef = {
  x: 860,
  y: 460,
  width: 180,
  height: 80,
  label: 'LLM',
  icon: '',
};

const ACTION_NODES: NodeDef[] = [
  { x: 1440, y: 220, width: 140, height: 56, label: 'Send Email', icon: '\u2709' },
  { x: 1440, y: 400, width: 140, height: 56, label: 'Update Sheet', icon: '\uD83D\uDCC4' },
  { x: 1440, y: 580, width: 140, height: 56, label: 'Create Doc', icon: '\uD83D\uDCC3' },
  { x: 1440, y: 760, width: 140, height: 56, label: 'Notify Slack', icon: '\uD83D\uDCAC' },
];

// ── Bezier path utilities ────────────────────────────────────

interface Point {
  x: number;
  y: number;
}

function cubicBezier(
  p0: Point,
  p1: Point,
  p2: Point,
  p3: Point,
  t: number,
): Point {
  const mt = 1 - t;
  const mt2 = mt * mt;
  const mt3 = mt2 * mt;
  const t2 = t * t;
  const t3 = t2 * t;
  return {
    x: mt3 * p0.x + 3 * mt2 * t * p1.x + 3 * mt * t2 * p2.x + t3 * p3.x,
    y: mt3 * p0.y + 3 * mt2 * t * p1.y + 3 * mt * t2 * p2.y + t3 * p3.y,
  };
}

function bezierPathD(p0: Point, p1: Point, p2: Point, p3: Point): string {
  return `M${p0.x},${p0.y} C${p1.x},${p1.y} ${p2.x},${p2.y} ${p3.x},${p3.y}`;
}

function getTriggerToLLMPath(
  trigger: NodeDef,
): { p0: Point; p1: Point; p2: Point; p3: Point } {
  const p0 = { x: trigger.x + trigger.width / 2, y: trigger.y };
  const p3 = { x: LLM_NODE.x, y: LLM_NODE.y };
  const dx = (p3.x - p0.x) * 0.4;
  const p1 = { x: p0.x + dx, y: p0.y };
  const p2 = { x: p3.x - dx, y: p3.y };
  return { p0, p1, p2, p3 };
}

function getLLMToActionPath(
  action: NodeDef,
): { p0: Point; p1: Point; p2: Point; p3: Point } {
  const p0 = { x: LLM_NODE.x + LLM_NODE.width, y: LLM_NODE.y };
  const p3 = { x: action.x - action.width / 2, y: action.y };
  const dx = (p3.x - p0.x) * 0.4;
  const p1 = { x: p0.x + dx, y: p0.y };
  const p2 = { x: p3.x - dx, y: p3.y };
  return { p0, p1, p2, p3 };
}

// ── Data packet component ────────────────────────────────────

interface PacketProps {
  progress: number;
  path: { p0: Point; p1: Point; p2: Point; p3: Point };
  color: string;
}

const Packet: React.FC<PacketProps> = ({ progress, path, color }) => {
  if (progress < 0 || progress > 1) return null;
  const pos = cubicBezier(path.p0, path.p1, path.p2, path.p3, progress);
  return (
    <div
      style={{
        position: 'absolute',
        left: pos.x - 5,
        top: pos.y - 5,
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: color,
        boxShadow: `0 0 12px ${color}, 0 0 4px ${color}`,
      }}
    />
  );
};

// ── Workflow node component ──────────────────────────────────

interface WorkflowNodeProps {
  node: NodeDef;
  glowColor?: string;
  glowIntensity?: number;
  isLLM?: boolean;
}

const WorkflowNode: React.FC<WorkflowNodeProps> = ({
  node,
  glowColor,
  glowIntensity = 0,
  isLLM = false,
}) => {
  const bgStyle: React.CSSProperties = isLLM
    ? {
        background: 'linear-gradient(135deg, #F59E0B, #FB923C)',
      }
    : {
        backgroundColor: COLORS.bg.elevated,
      };

  return (
    <div
      style={{
        position: 'absolute',
        left: node.x - node.width / 2,
        top: node.y - node.height / 2,
        width: node.width,
        height: node.height,
        borderRadius: 12,
        ...bgStyle,
        border: `1.5px solid ${
          glowIntensity > 0 && glowColor
            ? withOpacity(glowColor, 0.6 + glowIntensity * 0.4)
            : COLORS.border
        }`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: isLLM ? 12 : 8,
        boxShadow:
          glowIntensity > 0 && glowColor
            ? `0 0 ${16 + glowIntensity * 20}px ${withOpacity(glowColor, glowIntensity * 0.5)}`
            : 'none',
      }}
    >
      {!isLLM && (
        <span style={{ fontSize: 18 }}>{node.icon}</span>
      )}
      <span
        style={{
          fontFamily: isLLM ? FONT_FAMILY.display : FONT_FAMILY.body,
          fontWeight: isLLM ? 700 : 500,
          fontSize: isLLM ? 24 : 13,
          color: isLLM ? '#FFFFFF' : COLORS.text.primary,
          letterSpacing: isLLM ? 1 : 0,
        }}
      >
        {node.label}
      </span>
    </div>
  );
};

// ── Gear icon sub-component ──────────────────────────────────

interface GearIconProps {
  x: number;
  y: number;
  rotation: number;
  opacity: number;
}

const GearIcon: React.FC<GearIconProps> = ({ x, y, rotation, opacity }) => (
  <div
    style={{
      position: 'absolute',
      left: x - 10,
      top: y - 10,
      width: 20,
      height: 20,
      opacity,
      transform: `rotate(${rotation}deg)`,
    }}
  >
    <svg width={20} height={20} viewBox="0 0 20 20" fill="none">
      <path
        d="M10 3 l1.5 0 l0.3 1.8 a5.5 5.5 0 0 1 1.5 0.9 l1.7-0.7 l0.75 1.3 l-1.4 1.1 a5.5 5.5 0 0 1 0 1.8 l1.4 1.1 l-0.75 1.3 l-1.7-0.7 a5.5 5.5 0 0 1-1.5 0.9 l-0.3 1.8 l-1.5 0 l-0.3-1.8 a5.5 5.5 0 0 1-1.5-0.9 l-1.7 0.7 l-0.75-1.3 l1.4-1.1 a5.5 5.5 0 0 1 0-1.8 l-1.4-1.1 l0.75-1.3 l1.7 0.7 a5.5 5.5 0 0 1 1.5-0.9Z"
        fill={withOpacity('#FFFFFF', 0.8)}
      />
      <circle cx={10} cy={10} r={2.5} fill={withOpacity('#F59E0B', 0.9)} />
    </svg>
  </div>
);

// ── Main component ───────────────────────────────────────────

export const ToolWorkflowBuilders: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const loopFrame = frame % TOTAL_FRAMES;

  const phase = Math.floor(loopFrame / 30);
  const phaseProgress = (loopFrame % 30) / 30;

  // ── Phase 0 (0-30): Email trigger fires, packet to LLM ──
  const emailTriggerGlow = phase === 0 ? interpolate(phaseProgress, [0, 0.15, 0.3], [0, 1, 0.3], { extrapolateRight: 'clamp' }) : 0;
  const emailPacketProgress =
    phase === 0
      ? interpolate(phaseProgress, [0.1, 0.9], [0, 1], {
          extrapolateLeft: 'clamp',
          extrapolateRight: 'clamp',
        })
      : -1;

  // ── Phase 1 (30-60): LLM processes, outputs to actions 0,1 ──
  const llmGlow =
    phase === 1
      ? interpolate(phaseProgress, [0, 0.2, 0.4], [0.3, 1, 0.5], {
          extrapolateRight: 'clamp',
        })
      : 0;
  const gearRotation =
    phase === 1 ? phaseProgress * 360 : 0;
  const gearOpacity = phase === 1 ? interpolate(phaseProgress, [0, 0.1, 0.5, 0.9], [0, 1, 1, 0]) : 0;

  const outputPacket0Progress =
    phase === 1
      ? interpolate(phaseProgress, [0.3, 0.9], [0, 1], {
          extrapolateLeft: 'clamp',
          extrapolateRight: 'clamp',
        })
      : -1;
  const outputPacket1Progress =
    phase === 1
      ? interpolate(phaseProgress, [0.4, 1.0], [0, 1], {
          extrapolateLeft: 'clamp',
          extrapolateRight: 'clamp',
        })
      : -1;

  // ── Phase 2 (60-90): Action nodes 0,1 glow; schedule trigger fires ──
  const action0Glow =
    phase === 2
      ? interpolate(phaseProgress, [0, 0.2, 0.5], [0.8, 0.4, 0], {
          extrapolateRight: 'clamp',
        })
      : 0;
  const action1Glow =
    phase === 2
      ? interpolate(phaseProgress, [0, 0.2, 0.5], [0.8, 0.4, 0], {
          extrapolateRight: 'clamp',
        })
      : 0;

  const scheduleTriggerGlow =
    phase === 2
      ? interpolate(phaseProgress, [0.2, 0.4, 0.6], [0, 1, 0.3], {
          extrapolateLeft: 'clamp',
          extrapolateRight: 'clamp',
        })
      : 0;
  const schedulePacketProgress =
    phase === 2
      ? interpolate(phaseProgress, [0.3, 0.95], [0, 1], {
          extrapolateLeft: 'clamp',
          extrapolateRight: 'clamp',
        })
      : -1;

  // ── Phase 3 (90-120): Outputs to actions 2,3; all glow then fade ──
  const outputPacket2Progress =
    phase === 3
      ? interpolate(phaseProgress, [0, 0.5], [0, 1], {
          extrapolateLeft: 'clamp',
          extrapolateRight: 'clamp',
        })
      : -1;
  const outputPacket3Progress =
    phase === 3
      ? interpolate(phaseProgress, [0.1, 0.6], [0, 1], {
          extrapolateLeft: 'clamp',
          extrapolateRight: 'clamp',
        })
      : -1;

  const action2Glow =
    phase === 3
      ? interpolate(phaseProgress, [0.45, 0.6, 0.85], [0, 0.8, 0], {
          extrapolateLeft: 'clamp',
          extrapolateRight: 'clamp',
        })
      : 0;
  const action3Glow =
    phase === 3
      ? interpolate(phaseProgress, [0.55, 0.7, 0.9], [0, 0.8, 0], {
          extrapolateLeft: 'clamp',
          extrapolateRight: 'clamp',
        })
      : 0;

  // ── Bezier paths ────────────────────────────────────────
  const triggerPaths = TRIGGER_NODES.map((t) => getTriggerToLLMPath(t));
  const actionPaths = ACTION_NODES.map((a) => getLLMToActionPath(a));

  return (
    <AbsoluteFill style={{ backgroundColor: 'transparent' }}>
      {/* SVG connection lines */}
      <svg
        width={1920}
        height={1080}
        style={{ position: 'absolute', top: 0, left: 0 }}
      >
        {/* Trigger → LLM bezier curves */}
        {triggerPaths.map((path, i) => (
          <path
            key={`trig-path-${i}`}
            d={bezierPathD(path.p0, path.p1, path.p2, path.p3)}
            fill="none"
            stroke={COLORS.border}
            strokeWidth={2}
          />
        ))}
        {/* LLM → Action bezier curves */}
        {actionPaths.map((path, i) => (
          <path
            key={`act-path-${i}`}
            d={bezierPathD(path.p0, path.p1, path.p2, path.p3)}
            fill="none"
            stroke={COLORS.border}
            strokeWidth={2}
          />
        ))}
      </svg>

      {/* Trigger nodes */}
      <WorkflowNode
        node={TRIGGER_NODES[0]}
        glowColor="#F59E0B"
        glowIntensity={emailTriggerGlow}
      />
      <WorkflowNode
        node={TRIGGER_NODES[1]}
        glowColor="#F59E0B"
        glowIntensity={scheduleTriggerGlow}
      />
      <WorkflowNode node={TRIGGER_NODES[2]} />

      {/* LLM center node */}
      <WorkflowNode
        node={LLM_NODE}
        isLLM
        glowColor="#F59E0B"
        glowIntensity={llmGlow}
      />

      {/* Gear icon inside LLM node (phase 1) */}
      <GearIcon
        x={LLM_NODE.x + LLM_NODE.width / 2 - 16}
        y={LLM_NODE.y - 4}
        rotation={gearRotation}
        opacity={gearOpacity}
      />

      {/* N8N and Zapier logos below LLM node */}
      <div
        style={{
          position: 'absolute',
          left: LLM_NODE.x - 44,
          top: LLM_NODE.y + LLM_NODE.height / 2 + 8,
          display: 'flex',
          gap: 12,
          alignItems: 'center',
        }}
      >
        <N8NLogo size={36} />
        <ZapierLogo size={36} />
      </div>

      {/* Action nodes */}
      <WorkflowNode
        node={ACTION_NODES[0]}
        glowColor="#10B981"
        glowIntensity={action0Glow}
      />
      <WorkflowNode
        node={ACTION_NODES[1]}
        glowColor="#10B981"
        glowIntensity={action1Glow}
      />
      <WorkflowNode
        node={ACTION_NODES[2]}
        glowColor="#10B981"
        glowIntensity={action2Glow}
      />
      <WorkflowNode
        node={ACTION_NODES[3]}
        glowColor="#10B981"
        glowIntensity={action3Glow}
      />

      {/* Data packets */}
      {/* Phase 0: Email → LLM */}
      <Packet
        progress={emailPacketProgress}
        path={triggerPaths[0]}
        color="#F59E0B"
      />

      {/* Phase 1: LLM → Action 0, Action 1 */}
      <Packet
        progress={outputPacket0Progress}
        path={actionPaths[0]}
        color="#10B981"
      />
      <Packet
        progress={outputPacket1Progress}
        path={actionPaths[1]}
        color="#10B981"
      />

      {/* Phase 2: Schedule → LLM */}
      <Packet
        progress={schedulePacketProgress}
        path={triggerPaths[1]}
        color="#F59E0B"
      />

      {/* Phase 3: LLM → Action 2, Action 3 */}
      <Packet
        progress={outputPacket2Progress}
        path={actionPaths[2]}
        color="#10B981"
      />
      <Packet
        progress={outputPacket3Progress}
        path={actionPaths[3]}
        color="#10B981"
      />

      {/* Bottom text */}
      <div
        style={{
          position: 'absolute',
          bottom: 30,
          left: 0,
          right: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 8,
        }}
      >
        <span
          style={{
            fontFamily: FONT_FAMILY.display,
            fontWeight: 700,
            fontSize: 28,
            color: COLORS.text.primary,
          }}
        >
          Workflow Automation
        </span>
        <span
          style={{
            fontFamily: FONT_FAMILY.body,
            fontSize: 16,
            color: COLORS.text.secondary,
          }}
        >
          N8N &middot; Zapier &middot; Make &mdash; Connect Everything
        </span>
      </div>
    </AbsoluteFill>
  );
};
