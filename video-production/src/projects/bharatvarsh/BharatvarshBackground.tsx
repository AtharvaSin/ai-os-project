/**
 * BharatvarshBackground Component
 * Extends the base Background with Bharatvarsh-specific overlays:
 * - Film grain (6% opacity)
 * - Vignette (radial gradient darkening edges)
 * - Story-angle color tint (15% opacity faction color)
 * - Ken burns animation (inherited from base)
 */

import {
  AbsoluteFill,
  Img,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { FPS, IMAGE_HEIGHT, IMAGE_WIDTH } from "./lib-constants";
import { BackgroundElement } from "./lib-types";
import { calculateBlur, getImagePath } from "./lib-utils";
import { COLORS } from "./constants";
import { FilmGrain } from "../../common/effects/FilmGrain";
import { getChannelStyle, getFactionColors } from "./utils";
import { ContentChannel, StoryAngle } from "./types";

const EXTRA_SCALE = 0.2;

export const BharatvarshBackground: React.FC<{
  item: BackgroundElement;
  project: string;
  storyAngle: StoryAngle;
  contentChannel: ContentChannel;
}> = ({ item, project, storyAngle, contentChannel }) => {
  const frame = useCurrentFrame();
  const localMs = (frame / FPS) * 1000;
  const { width, height } = useVideoConfig();

  const imageRatio = IMAGE_HEIGHT / IMAGE_WIDTH;
  const imgWidth = height;
  const imgHeight = imgWidth * imageRatio;
  let animScale = 1 + EXTRA_SCALE;

  const currentScaleAnim = item.animations?.find(
    (anim) =>
      anim.type === "scale" && anim.startMs <= localMs && anim.endMs >= localMs,
  );

  if (currentScaleAnim) {
    const progress =
      (localMs - currentScaleAnim.startMs) /
      (currentScaleAnim.endMs - currentScaleAnim.startMs);
    animScale =
      EXTRA_SCALE +
      progress * (currentScaleAnim.to - currentScaleAnim.from) +
      currentScaleAnim.from;
  }

  const imgScale = animScale;
  const top = -(imgHeight * imgScale - height) / 2;
  const left = -(imgWidth * imgScale - width) / 2;

  const blur = calculateBlur({ item, localMs });
  const maxBlur = 25;
  const currentBlur = maxBlur * blur;

  // Get faction colors for tint overlay
  const factionColors = getFactionColors(storyAngle);
  const channelStyle = getChannelStyle(contentChannel);

  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.obsidian }}>
      {/* Base image with Ken Burns animation */}
      <Img
        src={staticFile(getImagePath(project, item.imageUrl))}
        style={{
          width: imgWidth * imgScale,
          height: imgHeight * imgScale,
          position: "absolute",
          top,
          left,
          filter: `blur(${currentBlur}px)`,
          WebkitFilter: `blur(${currentBlur}px)`,
        }}
      />

      {/* Surveillance grid overlay (if applicable) */}
      {(contentChannel === "declassified_report" ||
        contentChannel === "news_article") && (
        <AbsoluteFill
          style={{
            backgroundImage: `
              linear-gradient(0deg, transparent 24%, rgba(201, 219, 238, 0.08) 25%, rgba(201, 219, 238, 0.08) 26%, transparent 27%, transparent 74%, rgba(201, 219, 238, 0.08) 75%, rgba(201, 219, 238, 0.08) 76%, transparent 77%, transparent),
              linear-gradient(90deg, transparent 24%, rgba(201, 219, 238, 0.08) 25%, rgba(201, 219, 238, 0.08) 26%, transparent 27%, transparent 74%, rgba(201, 219, 238, 0.08) 75%, rgba(201, 219, 238, 0.08) 76%, transparent 77%, transparent)
            `,
            backgroundSize: "50px 50px",
            pointerEvents: "none",
            zIndex: 15,
          }}
        />
      )}

      {/* Story angle color tint overlay */}
      <AbsoluteFill
        style={{
          backgroundColor: factionColors.primary,
          opacity: channelStyle.overlayIntensity,
          pointerEvents: "none",
          zIndex: 11,
        }}
      />

      {/* Vignette darkening at edges */}
      <AbsoluteFill
        style={{
          background:
            "radial-gradient(ellipse at center, transparent 0%, rgba(10, 13, 18, 0.4) 100%)",
          pointerEvents: "none",
          zIndex: 12,
        }}
      />

      {/* Film grain overlay */}
      <FilmGrain />
    </AbsoluteFill>
  );
};
