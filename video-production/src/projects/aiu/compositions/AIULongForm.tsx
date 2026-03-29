/**
 * AIULongForm — Main Long-Form Video Assembler
 *
 * Top-level composition that reads input.json via getInputProps() and
 * assembles the full video timeline:
 *
 *   IntroSting -> [ChapterCard -> Scene, Scene, ...] x N -> EndScreen
 *
 * Background music spans the entire video with volume ducking during
 * speech segments. Each scene type maps to the appropriate scene
 * component, and subtitles are filtered per-scene based on the
 * facecam time window.
 */

import React from 'react';
import {
  AbsoluteFill,
  Sequence,
  Audio,
  getInputProps,
  useVideoConfig,
  staticFile,
} from 'remotion';
import type {
  AIUVideoInput,
  Chapter,
  KeyTermNote,
  Scene,
  SubtitleSegment,
} from '../types';
import { TIMING } from '../constants';
import { createVolumeEnvelope, secondsToFrames } from '../utils/audio';

import { IntroSting } from '../components/IntroSting';
import { ChapterCard } from '../components/ChapterCard';
import { EndScreen } from '../components/EndScreen';

import { FacecamScene } from '../scenes/FacecamScene';
import { ScreenRecScene } from '../scenes/ScreenRecScene';
import { SplitScreenScene } from '../scenes/SplitScreenScene';
import { DiagramScene } from '../scenes/DiagramScene';
import { FullScreenTextScene } from '../scenes/FullScreenTextScene';
import { BRollScene } from '../scenes/BRollScene';
import { KeyTermCard } from '../components/KeyTermCard';

// ── Timeline Element ────────────────────────────────────────────

/**
 * A positioned element in the video timeline, carrying enough
 * information to render a Sequence with the correct from/duration.
 */
interface TimelineElement {
  id: string;
  fromFrame: number;
  durationFrames: number;
  render: () => React.ReactNode;
}

// ── Subtitle Filtering ──────────────────────────────────────────

/**
 * Extract subtitle segments that fall within a given time window.
 * Returns segments with their timestamps shifted relative to the
 * window start so they align with the scene-local timeline.
 */
function filterSubtitlesForWindow(
  allSubtitles: SubtitleSegment[],
  windowStartSec: number,
  windowDurationSec: number,
): SubtitleSegment[] {
  const windowEndSec = windowStartSec + windowDurationSec;

  return allSubtitles
    .filter((seg) => seg.end > windowStartSec && seg.start < windowEndSec)
    .map((seg) => ({
      ...seg,
      start: Math.max(0, seg.start - windowStartSec),
      end: Math.min(windowDurationSec, seg.end - windowStartSec),
    }));
}

// ── Scene Renderer ──────────────────────────────────────────────

/**
 * Renders the appropriate scene component based on scene.type,
 * forwarding the correct props from the scene config and global assets.
 */
function renderScene(
  scene: Scene,
  pillar: AIUVideoInput['pillar'],
  assets: AIUVideoInput['assets'],
  sceneSubtitles: SubtitleSegment[],
): React.ReactNode {
  const showSubs = sceneSubtitles.length > 0;

  switch (scene.type) {
    case 'facecam': {
      const config = scene.facecam;
      return (
        <FacecamScene
          facecamSrc={assets.facecam}
          startAt={config?.startAt ?? 0}
          duration={scene.duration}
          pillar={pillar}
          lowerThird={config?.lowerThird}
          subtitles={config?.showSubtitles && showSubs ? sceneSubtitles : undefined}
          overlays={scene.overlays}
        />
      );
    }

    case 'screen_rec': {
      const config = scene.screenRec;
      return (
        <ScreenRecScene
          screenRecSrc={assets.screenRecording}
          startAt={config?.startAt ?? 0}
          duration={scene.duration}
          pillar={pillar}
          zoomPoints={config?.zoomPoints}
          callouts={config?.callouts}
          pipFacecam={config?.pipFacecam}
          pipFacecamSrc={config?.pipFacecam ? assets.facecam : undefined}
          pipPosition={config?.pipPosition}
          subtitles={showSubs ? sceneSubtitles : undefined}
          overlays={scene.overlays}
        />
      );
    }

    case 'split_screen': {
      const facecamConfig = scene.facecam;
      const screenRecConfig = scene.screenRec;
      return (
        <SplitScreenScene
          facecamSrc={assets.facecam}
          screenRecSrc={assets.screenRecording}
          facecamStartAt={facecamConfig?.startAt ?? 0}
          screenRecStartAt={screenRecConfig?.startAt ?? 0}
          duration={scene.duration}
          pillar={pillar}
          subtitles={showSubs ? sceneSubtitles : undefined}
        />
      );
    }

    case 'diagram': {
      const config = scene.diagram;
      return (
        <DiagramScene
          component={config?.component ?? 'StatCard'}
          componentProps={config?.props ?? {}}
          duration={scene.duration}
          pillar={pillar}
          audioSrc={scene.facecam ? assets.facecam : undefined}
          audioStartAt={scene.facecam?.startAt}
          subtitles={showSubs ? sceneSubtitles : undefined}
        />
      );
    }

    case 'full_text': {
      const config = scene.fullText;
      return (
        <FullScreenTextScene
          headline={config?.headline ?? ''}
          subtext={config?.subtext}
          style={config?.style ?? 'statement'}
          pillar={pillar}
          duration={secondsToFrames(scene.duration)}
        />
      );
    }

    case 'b_roll': {
      const config = scene.bRoll;
      return (
        <BRollScene
          source={config?.source ?? ''}
          animation={config?.animation ?? 'fade'}
          duration={secondsToFrames(scene.duration)}
          overlay={config?.overlay}
          pillar={pillar}
          subtitles={showSubs ? sceneSubtitles : undefined}
        />
      );
    }

    default:
      return (
        <AbsoluteFill
          style={{
            backgroundColor: '#0F1117',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#EF4444',
            fontSize: 24,
          }}
        >
          Unknown scene type: {(scene as Scene).type}
        </AbsoluteFill>
      );
  }
}

// ── Main Composition ────────────────────────────────────────────

export const AIULongForm: React.FC = () => {
  const input = getInputProps() as unknown as AIUVideoInput;
  const { fps } = useVideoConfig();

  const { chapters, assets, subtitles, pillar, keyTerms } = input;
  const totalChapters = chapters.length;

  // ── Build Timeline ──────────────────────────────────────────

  const timeline: TimelineElement[] = [];
  let cursor = 0;

  // 1. IntroSting
  timeline.push({
    id: 'intro',
    fromFrame: cursor,
    durationFrames: TIMING.introFrames,
    render: () => <IntroSting pillar={pillar} />,
  });
  cursor += TIMING.introFrames;

  // 2. Chapters: each starts with a ChapterCard, then its scenes
  chapters.forEach((chapter: Chapter, chapterIdx: number) => {
    const chapterNumber = chapterIdx + 1;

    // Chapter card
    timeline.push({
      id: `chapter-card-${chapter.id}`,
      fromFrame: cursor,
      durationFrames: TIMING.chapterCardFrames,
      render: () => (
        <ChapterCard
          chapterNumber={chapterNumber}
          title={chapter.title}
          miniPromise={chapter.miniPromise}
          pillar={pillar}
          totalChapters={totalChapters}
        />
      ),
    });
    cursor += TIMING.chapterCardFrames;

    // Scenes within the chapter
    chapter.scenes.forEach((scene: Scene, sceneIdx: number) => {
      const sceneDurationFrames = secondsToFrames(scene.duration);

      // Determine the facecam time window for subtitle filtering.
      // For facecam and screen_rec scenes, use the startAt from their config.
      // For other scene types that may have audio from facecam, use the
      // scene's facecam config if present.
      const sceneStartAtSec = scene.facecam?.startAt
        ?? scene.screenRec?.startAt
        ?? 0;

      const sceneSubtitles = filterSubtitlesForWindow(
        subtitles,
        sceneStartAtSec,
        scene.duration,
      );

      timeline.push({
        id: `scene-${chapter.id}-${sceneIdx}`,
        fromFrame: cursor,
        durationFrames: sceneDurationFrames,
        render: () => renderScene(scene, pillar, assets, sceneSubtitles),
      });
      cursor += sceneDurationFrames;
    });
  });

  // 3. EndScreen
  const nextVideoTitle = input.metadata.playlist
    ? `More from ${input.metadata.playlist}`
    : 'Watch Next';

  timeline.push({
    id: 'end-screen',
    fromFrame: cursor,
    durationFrames: TIMING.endScreenFrames,
    render: () => (
      <EndScreen
        nextVideoTitle={nextVideoTitle}
        pillar={pillar}
      />
    ),
  });
  cursor += TIMING.endScreenFrames;

  const totalFrames = cursor;

  // ── Background Music ────────────────────────────────────────

  const musicTrack = assets.music;
  const volumeCallback = musicTrack
    ? createVolumeEnvelope({
        totalFrames,
        music: musicTrack,
        subtitles,
      })
    : null;

  // ── Render ──────────────────────────────────────────────────

  return (
    <AbsoluteFill>
      {/* Scene timeline — each element in its own Sequence */}
      {timeline.map((element) => (
        <Sequence
          key={element.id}
          from={element.fromFrame}
          durationInFrames={element.durationFrames}
          name={element.id}
        >
          {element.render()}
        </Sequence>
      ))}

      {/* Key term explainer cards — corner overlays every ~5 min */}
      {keyTerms?.map((kt: KeyTermNote, idx: number) => {
        const fromFrame = Math.round(kt.showAt * fps);
        const durationFrames = Math.round((kt.duration ?? 6) * fps);
        return (
          <Sequence
            key={`key-term-${idx}`}
            from={fromFrame}
            durationInFrames={durationFrames}
            name={`key-term-${kt.term.toLowerCase().replace(/\s+/g, '-')}`}
          >
            <KeyTermCard
              term={kt.term}
              note={kt.note}
              pillar={pillar}
              position={kt.position ?? 'top-right'}
              category={kt.category}
              holdFrames={durationFrames}
            />
          </Sequence>
        );
      })}

      {/* Background music spanning the entire video */}
      {musicTrack && volumeCallback && (
        <Sequence from={0} durationInFrames={totalFrames} name="background-music">
          <Audio
            src={staticFile(musicTrack.path)}
            volume={volumeCallback}
          />
        </Sequence>
      )}
    </AbsoluteFill>
  );
};
