/**
 * Subtitle utilities — re-exported from common library.
 * This shim maintains backward compatibility with existing AI&U imports.
 */
export {
  groupSubtitles,
  getActiveGroup,
  getActiveWordIndex,
  generateSRT,
  parseWhisperOutput,
  type SubtitleWord,
  type SubtitleGroup,
} from '../../../common/utils/subtitles';
