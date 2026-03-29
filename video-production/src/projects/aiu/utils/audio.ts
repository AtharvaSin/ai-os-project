/**
 * Audio utilities — common library re-exports + AI&U specific helpers.
 * This shim maintains backward compatibility with existing AI&U imports.
 */

// Re-export common utilities (with compatibility wrapper)
import {
  createVolumeEnvelope as _createVolumeEnvelope,
  type MusicTrackConfig,
  type SpeechSegment,
} from '../../../common/utils/audio';
export type { MusicTrackConfig, SpeechSegment };

/**
 * Compatibility wrapper for createVolumeEnvelope.
 * Accepts either the old object-arg format or the new positional-arg format.
 */
export function createVolumeEnvelope(
  optionsOrTotalFrames: { totalFrames: number; music: MusicTrackConfig; subtitles: SpeechSegment[] } | number,
  music?: MusicTrackConfig,
  speechSegments?: SpeechSegment[],
  fps?: number,
): (frame: number) => number {
  if (typeof optionsOrTotalFrames === 'object') {
    return _createVolumeEnvelope(
      optionsOrTotalFrames.totalFrames,
      optionsOrTotalFrames.music,
      optionsOrTotalFrames.subtitles,
      fps,
    );
  }
  return _createVolumeEnvelope(optionsOrTotalFrames, music!, speechSegments ?? [], fps);
}
export {
  secondsToFrames,
  framesToSeconds,
  msToFrames,
  framesToMs,
  calculateFrameTiming,
  DEFAULT_FPS,
} from '../../../common/utils/timing';

// AI&U-specific audio helpers
import { SFX } from '../constants';

export type SfxName = keyof typeof SFX;

/** Map component events to their default SFX names */
export const COMPONENT_SFX: Record<string, SfxName> = {
  intro_enter: 'whoosh',
  lower_third_enter: 'slide',
  lower_third_exit: 'slide',
  chapter_card_enter: 'whoosh',
  stat_card_enter: 'pop',
  callout_enter: 'pop',
  checklist_check: 'click',
  highlight_enter: 'ding',
  text_punch_enter: 'bassDrop',
  meme_drop_enter: 'bassDrop',
  code_type: 'type',
  b_roll_enter: 'pop',
};

/** Get the file path for a given SFX name */
export function getSfxPath(name: SfxName): string {
  return SFX[name];
}

/** Check if a SFX name is defined in the AI&U constants */
export function isSfxAvailable(sfxName: SfxName): boolean {
  return sfxName in SFX;
}
