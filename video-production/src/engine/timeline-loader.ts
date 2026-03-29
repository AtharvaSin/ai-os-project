/**
 * Timeline Loader — Video Production Engine
 * Loads timeline JSON files from the public/ directory.
 */

import { staticFile } from 'remotion';
import { DEFAULT_FPS } from './registry';

/** Generic timeline element (Bharatvarsh format) */
export interface TimelineElement {
  startMs: number;
  endMs: number;
  imageUrl?: string;
  enterTransition?: 'fade' | 'blur' | 'none';
  exitTransition?: 'fade' | 'blur' | 'none';
  animations?: Array<{
    type: 'scale' | 'translate';
    from: number;
    to: number;
    startMs: number;
    endMs: number;
  }>;
}

/** Generic text element */
export interface TextElement {
  startMs: number;
  endMs: number;
  text: string;
  position: 'top' | 'bottom' | 'center';
}

/** Generic audio element */
export interface AudioElement {
  startMs: number;
  endMs: number;
  audioUrl: string;
}

/** Unified timeline structure */
export interface Timeline {
  postId: string;
  shortTitle: string;
  hook?: string;
  elements: TimelineElement[];
  text: TextElement[];
  audio: AudioElement[];
  // Project-specific metadata
  metadata?: Record<string, unknown>;
}

/** Load a timeline JSON from the public directory */
export async function loadTimeline(path: string): Promise<Timeline> {
  const res = await fetch(staticFile(path));
  const json = await res.json();
  const timeline = json as Timeline;
  timeline.elements.sort((a, b) => a.startMs - b.startMs);
  return timeline;
}

/** Calculate total duration in frames from a timeline */
export function getTimelineDuration(timeline: Timeline, fps = DEFAULT_FPS): number {
  const maxMs = Math.max(
    ...timeline.elements.map((e) => e.endMs),
    ...timeline.text.map((t) => t.endMs),
    ...timeline.audio.map((a) => a.endMs),
    0,
  );
  return Math.ceil((maxMs / 1000) * fps);
}

/** Get asset path helpers */
export function getTimelinePath(project: string): string {
  return `content/${project}/timeline.json`;
}

export function getImagePath(project: string, uid: string): string {
  return `content/${project}/images/${uid}.png`;
}

export function getAudioPath(project: string, uid: string): string {
  return `content/${project}/audio/${uid}.mp3`;
}
