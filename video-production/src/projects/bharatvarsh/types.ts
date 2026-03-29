/**
 * Bharatvarsh-specific types and schemas
 */

import { z } from "zod";
import {
  AudioElementSchema,
  BackgroundElementSchema,
  TextElementSchema,
  TimelineElementSchema,
} from "./lib-types";

// Story angle/faction
export const StoryAngleSchema = z.union([
  z.literal("bharatsena"),
  z.literal("akakpen"),
  z.literal("tribhuj"),
]);

// Content channel (3 visual styles)
export const ContentChannelSchema = z.union([
  z.literal("declassified_report"),
  z.literal("graffiti_photo"),
  z.literal("news_article"),
]);

// Bharatvarsh timeline format (extends the base Timeline but with metadata)
export const BharatvarshTimelineSchema = z.object({
  postId: z.string(),
  shortTitle: z.string().describe("4-5 words, hook title"),
  hook: z.string().optional(),
  storyAngle: StoryAngleSchema,
  contentChannel: ContentChannelSchema,
  badge: z.string().optional().describe("e.g. 'DIRECTIVE 1984-R/07 · DECLASSIFIED'"),
  ctaUrl: z.string().optional().describe("e.g. 'welcometobharatvarsh.com'"),
  elements: z.array(BackgroundElementSchema),
  text: z.array(TextElementSchema),
  audio: z.array(AudioElementSchema).optional().default([]),
});

export type StoryAngle = z.infer<typeof StoryAngleSchema>;
export type ContentChannel = z.infer<typeof ContentChannelSchema>;
export type BharatvarshTimeline = z.infer<typeof BharatvarshTimelineSchema>;

// Props for BharatvarshVideo component
export const BharatvarshVideoPropsSchema = z.object({
  timeline: BharatvarshTimelineSchema.nullable(),
});

export type BharatvarshVideoProps = z.infer<
  typeof BharatvarshVideoPropsSchema
>;
