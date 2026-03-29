/**
 * Test Compositions — One per atomic component
 *
 * Each renders a component in isolation on a dark background
 * with sample data for visual verification in Remotion Studio.
 */

import React from 'react';
import { AbsoluteFill } from 'remotion';
import { COLORS } from '../constants';

// Components
import { IntroSting } from '../components/IntroSting';
import { LowerThird } from '../components/LowerThird';
import { ChapterCard } from '../components/ChapterCard';
import { SubtitleOverlay } from '../components/SubtitleOverlay';
import { EndScreen } from '../components/EndScreen';
import { PillarBadge } from '../components/PillarBadge';
import { ProgressBar } from '../components/ProgressBar';
import { Watermark } from '../components/Watermark';
import { CalloutHighlight } from '../components/CalloutHighlight';
import { TextPunch } from '../components/TextPunch';
import { StatCard } from '../components/StatCard';
import { ComparisonChart } from '../components/ComparisonChart';
import { ProcessFlow } from '../components/ProcessFlow';
import { BRollDrop } from '../components/BRollDrop';
import { CodeBlock } from '../components/CodeBlock';
import { KeyTermCard } from '../components/KeyTermCard';
import { HighlightBox } from '../components/HighlightBox';
import { ExperienceOrbit } from '../components/ExperienceOrbit';

// Types
import type { SubtitleSegment } from '../types';

// ── Dark background wrapper ──────────────────────────────────

const DarkBg: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <AbsoluteFill style={{ backgroundColor: COLORS.bg.primary }}>
    {children}
  </AbsoluteFill>
);

// ── Test: IntroSting ─────────────────────────────────────────

export const TestIntroSting: React.FC = () => (
  <DarkBg>
    <IntroSting pillar={1} />
  </DarkBg>
);

// ── Test: LowerThird ─────────────────────────────────────────

export const TestLowerThird: React.FC = () => (
  <DarkBg>
    <LowerThird
      name="Atharva Singh"
      title="AI & Cloud Product Leader"
      pillar={2}
    />
  </DarkBg>
);

// ── Test: ChapterCard ────────────────────────────────────────

export const TestChapterCard: React.FC = () => (
  <DarkBg>
    <ChapterCard
      chapterNumber={2}
      title="The 5-Point Checklist"
      miniPromise="Here's how to know if AI is right for your task"
      pillar={1}
      totalChapters={5}
    />
  </DarkBg>
);

// ── Test: SubtitleOverlay ────────────────────────────────────

const sampleSubtitles: SubtitleSegment[] = [
  { word: 'The', start: 0.0, end: 0.15, confidence: 0.98 },
  { word: 'first', start: 0.16, end: 0.4, confidence: 0.97 },
  { word: 'thing', start: 0.41, end: 0.6, confidence: 0.99 },
  { word: 'you', start: 0.61, end: 0.75, confidence: 0.98 },
  { word: 'need', start: 0.76, end: 0.95, confidence: 0.97 },
  { word: 'to', start: 0.96, end: 1.05, confidence: 0.99 },
  { word: 'understand', start: 1.06, end: 1.5, confidence: 0.96 },
  { word: 'about', start: 1.51, end: 1.7, confidence: 0.98 },
  { word: 'AI', start: 1.71, end: 1.9, confidence: 0.99 },
  { word: 'is', start: 1.91, end: 2.05, confidence: 0.97 },
  { word: 'that', start: 2.06, end: 2.25, confidence: 0.98 },
  { word: 'it', start: 2.26, end: 2.35, confidence: 0.99 },
  { word: 'works', start: 2.36, end: 2.6, confidence: 0.97 },
  { word: 'best', start: 2.61, end: 2.85, confidence: 0.98 },
  { word: 'when', start: 2.86, end: 3.0, confidence: 0.96 },
];

export const TestSubtitleOverlay: React.FC = () => (
  <DarkBg>
    <SubtitleOverlay segments={sampleSubtitles} pillar={1} />
  </DarkBg>
);

// ── Test: EndScreen ──────────────────────────────────────────

export const TestEndScreen: React.FC = () => (
  <DarkBg>
    <EndScreen
      nextVideoTitle="5 AI Tools That Actually Save You Time"
      pillar={2}
      channelHandle="@aiandu"
    />
  </DarkBg>
);

// ── Test: PillarBadge ────────────────────────────────────────

export const TestPillarBadge: React.FC = () => (
  <DarkBg>
    <AbsoluteFill
      style={{
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 32,
      }}
    >
      <PillarBadge pillar={1} size="lg" />
      <PillarBadge pillar={2} size="lg" />
      <PillarBadge pillar={3} size="lg" />
    </AbsoluteFill>
  </DarkBg>
);

// ── Test: ProgressBar ────────────────────────────────────────

export const TestProgressBar: React.FC = () => (
  <DarkBg>
    <AbsoluteFill
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 24,
        padding: 100,
      }}
    >
      <ProgressBar progress={0.33} pillar={1} />
      <ProgressBar progress={0.66} pillar={2} />
      <ProgressBar progress={1.0} pillar={3} />
    </AbsoluteFill>
  </DarkBg>
);

// ── Test: Watermark ──────────────────────────────────────────

export const TestWatermark: React.FC = () => (
  <DarkBg>
    <Watermark />
  </DarkBg>
);

// ── Test: CalloutHighlight ───────────────────────────────────

export const TestCalloutHighlight: React.FC = () => (
  <DarkBg>
    <CalloutHighlight type="circle" x={300} y={300} width={120} label="Click here" delay={0} />
    <CalloutHighlight type="box" x={600} y={250} width={200} height={100} label="This area" delay={10} />
    <CalloutHighlight type="underline" x={1000} y={400} width={250} label="Important" delay={20} />
    <CalloutHighlight type="arrow" x={1400} y={300} width={100} height={80} label="Note" delay={30} />
  </DarkBg>
);

// ── Test: TextPunch ──────────────────────────────────────────

export const TestTextPunch: React.FC = () => (
  <DarkBg>
    <TextPunch text="AI is not magic." pillar={1} />
  </DarkBg>
);

// ── Test: StatCard ───────────────────────────────────────────

export const TestStatCard: React.FC = () => (
  <DarkBg>
    <AbsoluteFill
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <StatCard
        value="73%"
        label="of developers use AI coding tools daily"
        source="Stack Overflow 2025"
        pillar={2}
      />
    </AbsoluteFill>
  </DarkBg>
);

// ── Test: ComparisonChart ────────────────────────────────────

export const TestComparisonChart: React.FC = () => (
  <DarkBg>
    <AbsoluteFill
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <ComparisonChart
        items={[
          { label: 'ChatGPT', value: 82 },
          { label: 'Claude', value: 71 },
          { label: 'Gemini', value: 58 },
          { label: 'Copilot', value: 45 },
        ]}
        type="bars"
        pillar={3}
      />
    </AbsoluteFill>
  </DarkBg>
);

// ── Test: ProcessFlow ────────────────────────────────────────

export const TestProcessFlow: React.FC = () => (
  <DarkBg>
    <AbsoluteFill
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <ProcessFlow
        nodes={[
          { label: 'Input' },
          { label: 'Process' },
          { label: 'Review' },
          { label: 'Output' },
        ]}
        activeIndex={2}
        pillar={3}
      />
    </AbsoluteFill>
  </DarkBg>
);

// ── Test: BRollDrop ──────────────────────────────────────────

export const TestBRollDrop: React.FC = () => (
  <DarkBg>
    <BRollDrop
      imageSrc="brand/aiu-logo.png"
      caption="When your AI does something unexpected"
    />
  </DarkBg>
);

// ── Test: CodeBlock ──────────────────────────────────────────

export const TestCodeBlock: React.FC = () => (
  <DarkBg>
    <AbsoluteFill
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 80,
      }}
    >
      <CodeBlock
        code={`import anthropic

client = anthropic.Anthropic()

message = client.messages.create(
    model="claude-sonnet-4-6-20250514",
    max_tokens=1024,
    messages=[
        {"role": "user", "content": "Hello!"}
    ]
)
print(message.content)`}
        language="python"
        fileName="main.py"
        highlightLines={[5, 6]}
      />
    </AbsoluteFill>
  </DarkBg>
);

// ── Key Term Card — Pillar 1 (top-right) ─────────────────────
export const TestKeyTermCardP1: React.FC = () => (
  <DarkBg>
    <KeyTermCard
      term="Context Engineering"
      note="The practice of carefully structuring the information you give to an AI model — through prompts, system instructions, or RAG pipelines — to improve output quality."
      pillar={1}
      position="top-right"
      category="AI Concept"
      holdFrames={180}
    />
  </DarkBg>
);

// ── Key Term Card — Pillar 2 (top-left) ──────────────────────
export const TestKeyTermCardP2: React.FC = () => (
  <DarkBg>
    <KeyTermCard
      term="RAG Pipeline"
      note="Retrieval-Augmented Generation — a technique where the AI retrieves relevant documents from a knowledge base before generating a response, grounding it in real data."
      pillar={2}
      position="top-left"
      category="Architecture"
      holdFrames={180}
    />
  </DarkBg>
);

// ── Key Term Card — Pillar 3 (top-right, no category) ────────
export const TestKeyTermCardP3: React.FC = () => (
  <DarkBg>
    <KeyTermCard
      term="Evaluation Harness"
      note="A structured test suite that measures AI output quality against known-good answers. Essential before scaling any AI workflow to production."
      pillar={3}
      position="top-right"
      holdFrames={180}
    />
  </DarkBg>
);

// ── HighlightBox — G04 Disclaimer Card ───────────────────────
export const TestHighlightBoxDisclaimer: React.FC = () => (
  <HighlightBox
    title="Before We Begin"
    bullets={[
      'AI is evolving rapidly — what works today may change tomorrow',
      'This is an iterative process, not a silver bullet',
      'Frameworks > specific tools — learn the thinking, not just the tool',
    ]}
    pillar={1}
    variant="info"
  />
);

// ── HighlightBox — Warning variant ───────────────────────────
export const TestHighlightBoxWarning: React.FC = () => (
  <HighlightBox
    title="The Over-Dependence Trap"
    bullets={[
      'Using AI as an answer machine bypasses the learning process',
      'The goal is AI as a scaffold — it should help you learn, not replace learning',
    ]}
    pillar={1}
    variant="warning"
  />
);

// ── ExperienceOrbit — Pillar 1 (placeholder avatar) ─────────
export const TestExperienceOrbitP1: React.FC = () => (
  <ExperienceOrbit
    pillar={1}
    avatarSrc="video2/avatar-p1.png"
  />
);

// ── ExperienceOrbit — Pillar 2 ──────────────────────────────
export const TestExperienceOrbitP2: React.FC = () => (
  <ExperienceOrbit
    pillar={2}
    avatarSrc="video2/avatar-p2.png"
  />
);

// ── ExperienceOrbit — Pillar 3 ──────────────────────────────
export const TestExperienceOrbitP3: React.FC = () => (
  <ExperienceOrbit
    pillar={3}
    avatarSrc="video2/avatar-p3.png"
  />
);

// ── ExperienceOrbit — Pillar 1 with video avatar ────────────
export const TestExperienceOrbitP1Video: React.FC = () => (
  <ExperienceOrbit
    pillar={1}
    avatarSrc="video2/avatar-p1.mp4"
    avatarIsVideo
  />
);

// ── Test: GuardrailsRiskCard ─────────────────────────────────
import { GuardrailsRiskCard } from '../components/GuardrailsRiskCard';

export const TestGuardrailsRiskCard: React.FC = () => (
  <DarkBg>
    <GuardrailsRiskCard holdFrames={300} />
  </DarkBg>
);
