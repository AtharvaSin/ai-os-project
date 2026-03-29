/**
 * AI&U Video Pipeline — Full Input Schema
 *
 * Every video is driven by a single input.json conforming to AIUVideoInput.
 * Claude Code generates this from the script + asset manifest.
 */

// ── Top-Level Input ──────────────────────────────────────────

export interface AIUVideoInput {
  videoId: string;
  title: string;
  pillar: 1 | 2 | 3;
  level: 'flagship' | 'searchable' | 'workflow' | 'short';
  fps: 30;

  chapters: Chapter[];

  assets: {
    facecam: string;
    screenRecording: string;
    images?: ImageAsset[];
    music?: MusicTrack;
  };

  subtitles: SubtitleSegment[];

  /**
   * Key term explainer cards shown in the corner during longform videos.
   * Typically one every ~5 minutes. Only used by AIULongForm composition.
   */
  keyTerms?: KeyTermNote[];

  shortsMarkers?: ShortsMarker[];
  thumbnail?: ThumbnailInput;

  metadata: {
    description: string;
    tags: string[];
    category: string;
    playlist?: string;
  };
}

// ── Chapter ──────────────────────────────────────────────────

export interface Chapter {
  id: string;
  title: string;
  miniPromise: string;
  startTime: number;
  duration: number;
  scenes: Scene[];
}

// ── Scene ────────────────────────────────────────────────────

export type SceneType =
  | 'facecam'
  | 'screen_rec'
  | 'diagram'
  | 'split_screen'
  | 'full_text'
  | 'b_roll';

export interface Scene {
  type: SceneType;
  duration: number;

  facecam?: FacecamConfig;
  screenRec?: ScreenRecConfig;
  diagram?: DiagramConfig;
  fullText?: FullTextConfig;
  bRoll?: BRollConfig;
  overlays?: GraphicOverlay[];
}

export interface FacecamConfig {
  startAt: number;
  lowerThird?: {
    name: string;
    title: string;
  };
  showSubtitles: boolean;
}

export interface ScreenRecConfig {
  startAt: number;
  zoomPoints?: ZoomPoint[];
  callouts?: Callout[];
  pipFacecam?: boolean;
  pipPosition?: PipPosition;
}

export type PipPosition = 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';

export interface DiagramConfig {
  component: string;
  props: Record<string, unknown>;
  animation: 'build' | 'reveal' | 'none';
}

export type FullTextStyle = 'statement' | 'question' | 'rule' | 'myth_bust';

export interface FullTextConfig {
  headline: string;
  subtext?: string;
  style: FullTextStyle;
}

export interface BRollConfig {
  source: string;
  animation: BRollAnimation;
  overlay?: string;
  sfx?: string;
}

export type BRollAnimation = 'ken_burns' | 'slide_in' | 'fade' | 'flash';

// ── Graphic Overlays ─────────────────────────────────────────

export type OverlayType =
  | 'stat_card'
  | 'comparison'
  | 'process_flow'
  | 'text_punch'
  | 'checklist'
  | 'code_block'
  | 'meme_drop'
  | 'key_term_card';

export type OverlayPosition =
  | 'center'
  | 'left'
  | 'right'
  | 'top'
  | 'bottom'
  | 'full_screen';

export interface GraphicOverlay {
  type: OverlayType;
  enterAt: number;
  duration: number;
  position: OverlayPosition;
  props: Record<string, unknown>;
  sfx?: string;
}

// ── Subtitles ────────────────────────────────────────────────

export interface SubtitleSegment {
  word: string;
  start: number;
  end: number;
  confidence: number;
}

/** A grouped display chunk for rendering (derived from SubtitleSegments) */
export interface SubtitleGroup {
  words: SubtitleSegment[];
  text: string;
  start: number;
  end: number;
}

// ── Key Term Notes (Longform Only) ──────────────────────────

/**
 * A keyword or concept from the narration that gets a brief
 * notification-style explainer card in the corner of the frame.
 *
 * Extracted during the script review phase, appearing roughly
 * every 5 minutes. Only used in AI&U longform videos.
 */
export interface KeyTermNote {
  /** The keyword or phrase being explained */
  term: string;
  /** Brief contextual note — what it means here (1-2 sentences) */
  note: string;
  /** When the card appears, in seconds from video start */
  showAt: number;
  /** How long the card stays visible, in seconds (default: 6) */
  duration?: number;
  /** Which corner: top-right or top-left (default: top-right) */
  position?: 'top-right' | 'top-left';
  /** Optional category tag (e.g. "AI Concept", "Tool", "Framework") */
  category?: string;
}

// ── Shorts ───────────────────────────────────────────────────

export interface ShortsMarker {
  id: string;
  title: string;
  startTime: number;
  endTime: number;
  hookText: string;
  hookPosition: 'top' | 'bottom';
}

// ── Zoom & Callouts ──────────────────────────────────────────

export interface ZoomPoint {
  time: number;
  x: number;
  y: number;
  scale: number;
  duration: number;
}

export type CalloutType = 'circle' | 'arrow' | 'box' | 'underline';

export interface Callout {
  type: CalloutType;
  time: number;
  duration: number;
  x: number;
  y: number;
  width?: number;
  height?: number;
  label?: string;
  color?: string;
}

// ── Audio ────────────────────────────────────────────────────

export interface MusicTrack {
  path: string;
  volume: number;
  fadeIn: number;
  fadeOut: number;
  duckDuringVoice: boolean;
  duckVolume?: number;
}

// ── Assets ───────────────────────────────────────────────────

export interface ImageAsset {
  id: string;
  path: string;
  description: string;
}

// ── Thumbnails ───────────────────────────────────────────────

export type ThumbnailTemplate = 'big_promise' | 'before_after' | 'workflow_diagram';

export interface ThumbnailInput {
  template: ThumbnailTemplate;
  text: string;
  faceImage?: string;
  beforeImage?: string;
  afterImage?: string;
  diagramNodes?: string[];
  pillar: 1 | 2 | 3;
}

// ── Component Props (shared) ─────────────────────────────────

export interface StatCardProps {
  value: string;
  label: string;
  source?: string;
  pillar: 1 | 2 | 3;
}

export interface ComparisonItem {
  label: string;
  value: number;
  color?: string;
}

export interface ComparisonChartProps {
  items: ComparisonItem[];
  type: 'bars' | 'cards';
  pillar: 1 | 2 | 3;
}

export interface ProcessFlowNode {
  label: string;
  icon?: string;
}

export interface ProcessFlowProps {
  nodes: ProcessFlowNode[];
  activeIndex?: number;
  pillar: 1 | 2 | 3;
}

export interface CodeBlockProps {
  code: string;
  language: string;
  fileName?: string;
  highlightLines?: number[];
}

export interface ChecklistItem {
  text: string;
  checked: boolean;
}

export interface ChecklistCardProps {
  title: string;
  items: ChecklistItem[];
  pillar: 1 | 2 | 3;
}
