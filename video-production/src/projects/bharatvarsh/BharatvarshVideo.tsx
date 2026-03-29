/**
 * BharatvarshVideo Component
 * Main composition for Bharatvarsh-branded video content
 *
 * Sequential phases:
 * 1. Intro (2s): Channel-specific branded intro card
 * 2. Content slides (4-8s each): Background + text overlays + film grain
 * 3. End card (3s): Lead-gen card with CTA
 *
 * Supports three content channels:
 * - declassified_report: Breaking news, official documents, classification stamps
 * - graffiti_photo: Atmospheric, artistic, spray-paint textures, poetic
 * - news_article: Newspaper/broadcast layouts, BVN-24x7 masthead, ticker
 */

import { AbsoluteFill, Sequence, useVideoConfig } from "remotion";
import { z } from "zod";
import { FPS } from "./lib-constants";
import { calculateFrameTiming } from "./lib-utils";
import { BharatvarshBackground } from "./BharatvarshBackground";
import { BharatvarshEndCard } from "./BharatvarshEndCard";
import { BharatvarshIntro } from "./BharatvarshIntro";
import { BharatvarshSubtitle } from "./BharatvarshSubtitle";
import {
  COLORS,
  INTRO_DURATION_BHARATVARSH,
  ENDCARD_DURATION,
} from "./constants";
import { BharatvarshVideoPropsSchema, BharatvarshTimeline } from "./types";
import { FilmGrain } from "../../common/effects/FilmGrain";

export const bharatvarshVideoSchema = BharatvarshVideoPropsSchema;

export const BharatvarshVideo: React.FC<
  z.infer<typeof bharatvarshVideoSchema>
> = ({ timeline }) => {
  if (!timeline) {
    throw new Error("Expected timeline to be fetched");
  }

  const { id } = useVideoConfig();

  // Calculate total content duration
  const contentDurationFrames = timeline.elements.reduce((max, element) => {
    const endFrame = Math.floor((element.endMs / 1000) * FPS);
    return Math.max(max, endFrame);
  }, 0);

  const totalDurationFrames =
    INTRO_DURATION_BHARATVARSH + contentDurationFrames + ENDCARD_DURATION;

  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.obsidian }}>
      {/* Phase 1: Intro card (2s) */}
      <Sequence durationInFrames={INTRO_DURATION_BHARATVARSH}>
        <BharatvarshIntro
          contentChannel={timeline.contentChannel}
          shortTitle={timeline.shortTitle}
          badge={timeline.badge}
          storyAngle={timeline.storyAngle}
          durationInFrames={INTRO_DURATION_BHARATVARSH}
        />
      </Sequence>

      {/* Phase 2: Content slides with background images and text overlays */}
      {timeline.elements.map((element, index) => {
        const { startFrame, duration } = calculateFrameTiming(
          element.startMs,
          element.endMs,
          { addIntroOffset: true },
        );

        return (
          <Sequence
            key={`bg-element-${index}`}
            from={startFrame}
            durationInFrames={duration}
            premountFor={3 * FPS}
          >
            <BharatvarshBackground
              project={id}
              item={element}
              storyAngle={timeline.storyAngle}
              contentChannel={timeline.contentChannel}
            />
          </Sequence>
        );
      })}

      {/* Text overlays */}
      {timeline.text.map((element, index) => {
        const { startFrame, duration } = calculateFrameTiming(
          element.startMs,
          element.endMs,
          { addIntroOffset: true },
        );

        return (
          <Sequence
            key={`text-element-${index}`}
            from={startFrame}
            durationInFrames={duration}
          >
            <BharatvarshSubtitle text={element.text} />
          </Sequence>
        );
      })}

      {/* Phase 3: End card (3s) */}
      <Sequence
        from={INTRO_DURATION_BHARATVARSH + contentDurationFrames}
        durationInFrames={ENDCARD_DURATION}
      >
        <BharatvarshEndCard
          shortTitle={timeline.shortTitle}
          ctaUrl={timeline.ctaUrl}
          storyAngle={timeline.storyAngle}
          durationInFrames={ENDCARD_DURATION}
        />
      </Sequence>

      {/* Film grain overlay (always on top) */}
      <FilmGrain />
    </AbsoluteFill>
  );
};
