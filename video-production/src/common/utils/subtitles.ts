/**
 * Subtitle Utilities — Video Production Common Library
 * Word-level subtitle grouping for karaoke-style overlays.
 */

export interface SubtitleWord {
  word: string;
  start: number; // seconds
  end: number; // seconds
  confidence?: number;
}

export interface SubtitleGroup {
  words: SubtitleWord[];
  text: string;
  start: number; // seconds
  end: number; // seconds
}

const MAX_WORDS_PER_GROUP = 5;
const PAUSE_THRESHOLD_MS = 200;
const PUNCTUATION_BREAKS = /[.!?,;:—–\-]$/;

/** Group word-level subtitles into display chunks */
export function groupSubtitles(segments: SubtitleWord[]): SubtitleGroup[] {
  if (segments.length === 0) return [];

  const groups: SubtitleGroup[] = [];
  let currentWords: SubtitleWord[] = [];

  for (let i = 0; i < segments.length; i++) {
    const word = segments[i];
    currentWords.push(word);

    const isLastWord = i === segments.length - 1;
    const reachedMaxWords = currentWords.length >= MAX_WORDS_PER_GROUP;

    let hasPauseAfter = false;
    if (!isLastWord) {
      const nextWord = segments[i + 1];
      const gap = (nextWord.start - word.end) * 1000;
      hasPauseAfter = gap > PAUSE_THRESHOLD_MS;
    }

    const hasPunctuation = PUNCTUATION_BREAKS.test(word.word.trim());

    if (isLastWord || reachedMaxWords || hasPauseAfter || hasPunctuation) {
      groups.push({
        words: [...currentWords],
        text: currentWords.map((w) => w.word).join(' '),
        start: currentWords[0].start,
        end: currentWords[currentWords.length - 1].end,
      });
      currentWords = [];
    }
  }

  return groups;
}

/** Find the active subtitle group at a given time */
export function getActiveGroup(
  groups: SubtitleGroup[],
  timeSec: number,
): SubtitleGroup | null {
  return groups.find((g) => timeSec >= g.start && timeSec <= g.end) ?? null;
}

/** Find the active word index within a group */
export function getActiveWordIndex(
  group: SubtitleGroup,
  timeSec: number,
): number {
  for (let i = 0; i < group.words.length; i++) {
    if (timeSec >= group.words[i].start && timeSec <= group.words[i].end) {
      return i;
    }
  }
  for (let i = group.words.length - 1; i >= 0; i--) {
    if (timeSec > group.words[i].end) return i;
  }
  return 0;
}

/** Generate SRT content from subtitle groups */
export function generateSRT(groups: SubtitleGroup[]): string {
  return groups
    .map((group, index) => {
      const startTC = formatTimecode(group.start);
      const endTC = formatTimecode(group.end);
      return `${index + 1}\n${startTC} --> ${endTC}\n${group.text}\n`;
    })
    .join('\n');
}

function formatTimecode(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  const ms = Math.round((seconds % 1) * 1000);
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')},${ms.toString().padStart(3, '0')}`;
}

/** Parse Whisper JSON output into SubtitleWord array */
export function parseWhisperOutput(whisperJson: {
  segments: Array<{
    words: Array<{
      word: string;
      start: number;
      end: number;
      probability: number;
    }>;
  }>;
}): SubtitleWord[] {
  const segments: SubtitleWord[] = [];
  for (const segment of whisperJson.segments) {
    if (!segment.words) continue;
    for (const word of segment.words) {
      segments.push({
        word: word.word.trim(),
        start: word.start,
        end: word.end,
        confidence: word.probability,
      });
    }
  }
  return segments;
}
