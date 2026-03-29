/**
 * Video 2 -- Part 7: Business Professional Persona (S7)
 *
 * 13 independently-rendered compositions assembled in DaVinci Resolve:
 *
 * 1. PersonaGateway        — 14s fullscreen "character select" intro (opaque)
 * 2. PersonaBadge enter     — 3s badge entrance animation (transparent)
 * 3. PersonaBadge idle      — 3s badge breathing loop (transparent)
 * 4. PainPointsBusiness     — 40s fullscreen 2×2 pain point stations (opaque)
 * 5. InternPunch            — 11s "AI as intern" overlay (transparent)
 * 6-8. SolutionEngineCards  — 5s each, 3 engine intro cards (transparent)
 * 9-13. ToolAnimations      — 4s loops each, 5 tool animations (transparent)
 *
 * B-roll timeline: 09:16–14:19 in master video
 * See S7 PRODUCTION PLAN for compositing order and timestamp mapping.
 */

import React from 'react';
import { AbsoluteFill, Sequence } from 'remotion';
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

// ── 1. Persona Gateway (14s, opaque) ──────────────────────────────
export const V2_S7_PersonaGateway: React.FC = () => (
  <AbsoluteFill>
    <PersonaGateway />
  </AbsoluteFill>
);

// ── 2. Persona Badge — entrance (3s, transparent) ─────────────────
export const V2_S7_BadgeBPEnter: React.FC = () => (
  <AbsoluteFill>
    <PersonaBadge
      personaNumber={1}
      title="BUSINESS PRO"
      descriptor="Management · HR · Corporate"
      accentColor="#F59E0B"
    />
  </AbsoluteFill>
);

// ── 3. Persona Badge — idle loop (3s, transparent) ────────────────
// Renders the settled badge at top-right with breathing glow only.
// In DaVinci, loop this clip for badge hold duration.
export const V2_S7_BadgeBPIdle: React.FC = () => (
  <AbsoluteFill>
    <PersonaBadge
      personaNumber={1}
      title="BUSINESS PRO"
      descriptor="Management · HR · Corporate"
      accentColor="#F59E0B"
      startSettled
    />
  </AbsoluteFill>
);

// ── 4. Pain Points — Business Pro (40s, opaque) ───────────────────
export const V2_S7_PainPointsBP: React.FC = () => (
  <AbsoluteFill>
    <PainPointsBusiness />
  </AbsoluteFill>
);

// ── 5. Intern Punch overlay (11s, transparent) ────────────────────
export const V2_S7_InternPunch: React.FC = () => (
  <AbsoluteFill>
    <InternPunch />
  </AbsoluteFill>
);

// ── 6. Engine Card: Briefing Engine (5s, transparent) ─────────────
export const V2_S7_EngineBriefing: React.FC = () => (
  <AbsoluteFill>
    <SolutionEngineCard
      title="BRIEFING ENGINE"
      description="Ingest → Extract → Summarize"
      iconType="briefing"
    />
  </AbsoluteFill>
);

// ── 7. Engine Card: Decision Engine (5s, transparent) ─────────────
export const V2_S7_EngineDecision: React.FC = () => (
  <AbsoluteFill>
    <SolutionEngineCard
      title="DECISION ENGINE"
      description="Context → Framework → Recommend"
      iconType="decision"
    />
  </AbsoluteFill>
);

// ── 8. Engine Card: Workflow Accelerator (5s, transparent) ────────
export const V2_S7_EngineAccelerator: React.FC = () => (
  <AbsoluteFill>
    <SolutionEngineCard
      title="WORKFLOW ACCELERATOR"
      description="Brain Dump → Draft → Iterate"
      iconType="accelerator"
    />
  </AbsoluteFill>
);

// ── 9. Tool Animation: Microsoft Copilot (4s loop, transparent) ──
export const V2_S7_ToolCopilot: React.FC = () => (
  <AbsoluteFill>
    <ToolCopilot />
  </AbsoluteFill>
);

// ── 10. Tool Animation: Copilot Studio (4s loop, transparent) ────
export const V2_S7_ToolCopilotStudio: React.FC = () => (
  <AbsoluteFill>
    <ToolCopilotStudio />
  </AbsoluteFill>
);

// ── 11. Tool Animation: Gemini (4s loop, transparent) ────────────
export const V2_S7_ToolGemini: React.FC = () => (
  <AbsoluteFill>
    <ToolGemini />
  </AbsoluteFill>
);

// ── 12. Tool Animation: ChatGPT Enterprise (4s loop, transparent) ─
export const V2_S7_ToolChatGPT: React.FC = () => (
  <AbsoluteFill>
    <ToolChatGPT />
  </AbsoluteFill>
);

// ── 13. Tool Animation: Workflow Builders (4s loop, transparent) ──
export const V2_S7_ToolWorkflowBuilders: React.FC = () => (
  <AbsoluteFill>
    <ToolWorkflowBuilders />
  </AbsoluteFill>
);
