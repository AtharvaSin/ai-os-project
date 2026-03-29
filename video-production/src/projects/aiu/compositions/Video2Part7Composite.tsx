/**
 * Video 2 -- Part 7 Composite: Business Professional Persona
 *
 * Single render-ready composition that embeds B-roll and layers all S7
 * graphics at their correct timestamps. Outputs opaque MP4.
 *
 * B-roll: broll-s7-business-pro.mp4 (master 09:16–14:19, 303s)
 * Timeline (seconds from 0):
 *   0-14:    PersonaGateway fullscreen
 *   14-17:   Facecam + badge enter
 *   17-33:   Facecam + badge idle
 *   33-73:   PainPoints fullscreen
 *   73-84:   Facecam + badge + intern punch
 *   84-90:   Facecam + badge
 *   90-95:   Facecam + badge + engine briefing
 *   95-117:  Facecam + badge
 *   117-122: Facecam + badge + engine decision
 *   122-132: Facecam + badge
 *   132-137: Facecam + badge + engine accelerator
 *   137-153: Facecam + badge
 *   153-189: Facecam + badge + tool copilot loop
 *   189-220: Facecam + badge + tool copilot studio loop
 *   220-241: Facecam + badge + tool gemini loop
 *   241-252: Facecam + badge + tool chatgpt loop
 *   252-267: Facecam + badge + tool workflows loop
 *   267-303: Facecam only (badge fades out)
 */

import React from 'react';
import {
  AbsoluteFill,
  OffthreadVideo,
  Sequence,
  staticFile,
  Loop,
  useCurrentFrame,
  useVideoConfig,
  spring,
  interpolate,
} from 'remotion';
import { PersonaGateway } from '../components/video2-diagrams/PersonaGateway';
import { PainPointsBusiness } from '../components/video2-diagrams/PainPointsBusiness';
import { PersonaBadge } from '../components/PersonaBadge';
import { InternPunch } from '../components/InternPunch';
import { SolutionEngineCard } from '../components/SolutionEngineCard';
import { ToolCopilot } from '../components/tool-animations/ToolCopilot';
import { ToolCopilotStudio } from '../components/tool-animations/ToolCopilotStudio';
import { ToolGemini } from '../components/tool-animations/ToolGemini';
import { ToolChatGPT } from '../components/tool-animations/ToolChatGPT';
import { ToolWorkflowBuilders } from '../components/tool-animations/ToolWorkflowBuilders';
import { withOpacity } from '../utils/colors';

const FPS = 30;

// Convert seconds to frames
const s = (seconds: number): number => Math.round(seconds * FPS);

// ── Tool PIP Wrapper ─────────────────────────────────────────────
// Plays child fullscreen for first loop (4s), then spring-shrinks
// to PIP at top-right (below badge) for the remaining duration.

const PIP_WIDTH = 320;
const PIP_HEIGHT = 180;
const PIP_RIGHT = 48;
const PIP_TOP = 136; // below badge (48 + 80 badge + 8 gap)

const ToolPIPWrapper: React.FC<{
  children: React.ReactNode;
  /** Frame at which the shrink transition starts (default: 120 = 4s) */
  shrinkAt?: number;
}> = ({ children, shrinkAt = 120 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Spring progress: 0 = fullscreen, 1 = PIP
  const p = frame <= shrinkAt
    ? 0
    : spring({
        frame: frame - shrinkAt,
        fps,
        config: { damping: 140, stiffness: 160, mass: 1.1 },
      });

  // Animate container dimensions and position
  const w = interpolate(p, [0, 1], [1920, PIP_WIDTH]);
  const h = interpolate(p, [0, 1], [1080, PIP_HEIGHT]);
  const left = interpolate(p, [0, 1], [0, 1920 - PIP_RIGHT - PIP_WIDTH]);
  const top = interpolate(p, [0, 1], [0, PIP_TOP]);
  const radius = interpolate(p, [0, 1], [0, 12]);
  const scaleX = w / 1920;
  const scaleY = h / 1080;

  return (
    <div
      style={{
        position: 'absolute',
        left,
        top,
        width: w,
        height: h,
        overflow: 'hidden',
        borderRadius: radius,
        boxShadow: p > 0.01
          ? `0 4px 24px rgba(0,0,0,0.5), 0 0 0 1px ${withOpacity('#F59E0B', 0.2 * p)}`
          : 'none',
        zIndex: p > 0.5 ? 25 : 30,
      }}
    >
      {/* Render content at native 1920×1080 and scale down */}
      <div
        style={{
          width: 1920,
          height: 1080,
          transform: `scale(${scaleX}, ${scaleY})`,
          transformOrigin: 'top left',
        }}
      >
        {children}
      </div>
    </div>
  );
};

export const V2_S7_Composite: React.FC = () => {
  return (
    <AbsoluteFill>
      {/* ── Layer 1: B-roll facecam (always playing underneath) ── */}
      <OffthreadVideo
        src={staticFile('video2/broll-s7-business-pro.mp4')}
        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
      />

      {/* ── Layer 2: Fullscreen inserts (replace B-roll completely) ── */}

      {/* Gateway: 0-14s */}
      <Sequence from={0} durationInFrames={s(14)} layout="none">
        <AbsoluteFill style={{ zIndex: 10 }}>
          <PersonaGateway />
        </AbsoluteFill>
      </Sequence>

      {/* Pain Points: 33-73s */}
      <Sequence from={s(33)} durationInFrames={s(40)} layout="none">
        <AbsoluteFill style={{ zIndex: 10 }}>
          <PainPointsBusiness />
        </AbsoluteFill>
      </Sequence>

      {/* ── Layer 3: Persona Badge ── */}

      {/* Badge enter animation: 14-17s */}
      <Sequence from={s(14)} durationInFrames={s(3)} layout="none">
        <AbsoluteFill style={{ zIndex: 20 }}>
          <PersonaBadge
            personaNumber={1}
            title="BUSINESS PRO"
            descriptor="Management · HR · Corporate"
            accentColor="#F59E0B"
          />
        </AbsoluteFill>
      </Sequence>

      {/* Badge idle: 17-33s (before pain points) */}
      <Sequence from={s(17)} durationInFrames={s(16)} layout="none">
        <AbsoluteFill style={{ zIndex: 20 }}>
          <PersonaBadge
            personaNumber={1}
            title="BUSINESS PRO"
            descriptor="Management · HR · Corporate"
            accentColor="#F59E0B"
            startSettled
          />
        </AbsoluteFill>
      </Sequence>

      {/* Badge idle: 73-267s (after pain points through tools) */}
      <Sequence from={s(73)} durationInFrames={s(194)} layout="none">
        <AbsoluteFill style={{ zIndex: 20 }}>
          <PersonaBadge
            personaNumber={1}
            title="BUSINESS PRO"
            descriptor="Management · HR · Corporate"
            accentColor="#F59E0B"
            startSettled
          />
        </AbsoluteFill>
      </Sequence>

      {/* ── Layer 4: Intern Punch overlay (73-84s) ── */}
      <Sequence from={s(73)} durationInFrames={s(11)} layout="none">
        <AbsoluteFill style={{ zIndex: 30 }}>
          <InternPunch />
        </AbsoluteFill>
      </Sequence>

      {/* ── Layer 5: Engine Cards ── */}

      {/* Briefing Engine: 90-95s */}
      <Sequence from={s(90)} durationInFrames={s(5)} layout="none">
        <AbsoluteFill style={{ zIndex: 30 }}>
          <SolutionEngineCard
            title="BRIEFING ENGINE"
            description="Ingest → Extract → Summarize"
            iconType="briefing"
          />
        </AbsoluteFill>
      </Sequence>

      {/* Decision Engine: 117-122s */}
      <Sequence from={s(117)} durationInFrames={s(5)} layout="none">
        <AbsoluteFill style={{ zIndex: 30 }}>
          <SolutionEngineCard
            title="DECISION ENGINE"
            description="Context → Framework → Recommend"
            iconType="decision"
          />
        </AbsoluteFill>
      </Sequence>

      {/* Workflow Accelerator: 132-137s */}
      <Sequence from={s(132)} durationInFrames={s(5)} layout="none">
        <AbsoluteFill style={{ zIndex: 30 }}>
          <SolutionEngineCard
            title="WORKFLOW ACCELERATOR"
            description="Brain Dump → Draft → Iterate"
            iconType="accelerator"
          />
        </AbsoluteFill>
      </Sequence>

      {/* ── Layer 6: Tool Animations (fullscreen 4s → PIP at top-right) ── */}

      {/* Copilot: 153-189s — fullscreen 4s then PIP */}
      <Sequence from={s(153)} durationInFrames={s(36)} layout="none">
        <ToolPIPWrapper shrinkAt={s(4)}>
          <Loop durationInFrames={s(4)}>
            <ToolCopilot />
          </Loop>
        </ToolPIPWrapper>
      </Sequence>

      {/* Copilot Studio: 189-220s — fullscreen 4s then PIP */}
      <Sequence from={s(189)} durationInFrames={s(31)} layout="none">
        <ToolPIPWrapper shrinkAt={s(4)}>
          <Loop durationInFrames={s(4)}>
            <ToolCopilotStudio />
          </Loop>
        </ToolPIPWrapper>
      </Sequence>

      {/* Gemini: 220-241s — fullscreen 4s then PIP */}
      <Sequence from={s(220)} durationInFrames={s(21)} layout="none">
        <ToolPIPWrapper shrinkAt={s(4)}>
          <Loop durationInFrames={s(4)}>
            <ToolGemini />
          </Loop>
        </ToolPIPWrapper>
      </Sequence>

      {/* ChatGPT: 241-252s — fullscreen 4s then PIP */}
      <Sequence from={s(241)} durationInFrames={s(11)} layout="none">
        <ToolPIPWrapper shrinkAt={s(4)}>
          <Loop durationInFrames={s(4)}>
            <ToolChatGPT />
          </Loop>
        </ToolPIPWrapper>
      </Sequence>

      {/* Workflows: 252-267s — fullscreen 4s then PIP */}
      <Sequence from={s(252)} durationInFrames={s(15)} layout="none">
        <ToolPIPWrapper shrinkAt={s(4)}>
          <Loop durationInFrames={s(4)}>
            <ToolWorkflowBuilders />
          </Loop>
        </ToolPIPWrapper>
      </Sequence>
    </AbsoluteFill>
  );
};
