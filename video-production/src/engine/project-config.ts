/**
 * Project Configuration Types — Video Production Engine
 * TypeScript representation of project.yaml schema.
 */

export interface ProjectConfig {
  id: string;
  name: string;
  brand_context: string;
  description: string;
  brand: BrandConfig;
  art_style: ArtStyleConfig;
  content_pillars: ContentPillar[];
  content_channels: ContentChannel[];
  formats: Record<string, FormatConfig>;
  timing: TimingConfig;
  cta: CTAConfig;
  notebooks: NotebookConfig[];
  pipeline: PipelineConfig;
}

export interface BrandConfig {
  colors: {
    bg_primary: string;
    bg_surface: string;
    bg_elevated?: string;
    accent_primary: string;
    accent_secondary?: string;
    text_primary: string;
    text_secondary: string;
    text_muted: string;
    border?: string;
  };
  typography: {
    display: string;
    body: string;
    mono: string;
    narrative?: string;
  };
  effects: {
    film_grain?: { enabled: boolean; base_frequency?: number; opacity?: number };
    vignette?: { enabled: boolean; opacity?: number };
    scan_lines?: { enabled: boolean; opacity?: number };
    letterbox?: { enabled: boolean; aspect_ratio?: number };
    glow?: { enabled: boolean; color?: string; spread?: number };
  };
}

export interface ArtStyleConfig {
  primary: string;
  descriptors: string[];
  negative_prompts: string[];
  prompt_template: string;
}

export interface ContentPillar {
  id: string;
  label: string;
  colors: { primary: string; accent: string; highlight: string };
  mood?: string;
}

export interface ContentChannel {
  id: string;
  intro_style: string;
  overlay_intensity: number;
  badge_format?: string;
}

export interface FormatConfig {
  width: number;
  height: number;
  fps: number;
}

export interface TimingConfig {
  intro_duration_s: number;
  endcard_duration_s: number;
  slide_duration_default_s?: number;
  typewriter_speed_ms?: number;
  [key: string]: number | undefined;
}

export interface CTAConfig {
  url: string;
  display: string;
  logo_path: string;
  intent: string;
}

export interface NotebookConfig {
  id: string;
  use_for: string[];
}

export interface PipelineConfig {
  calendar_path: string;
  rendered_path: string;
  prompts_path: string;
}
