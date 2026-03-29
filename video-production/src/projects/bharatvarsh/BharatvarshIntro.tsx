/**
 * BharatvarshIntro Component
 * Channel-specific intro card with three distinct visual modes:
 * - declassified_report: Classified stamp flicker, badge, scanlines
 * - graffiti_photo: Atmospheric fade reveal, title glow
 * - news_article: BVN-24x7 masthead, typewriter title, BREAKING ticker
 */

import React from "react";
import {
  AbsoluteFill,
  Img,
  Sequence,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
} from "remotion";
import { COLORS, FONTS, TIMING } from "./constants";
import { ContentChannel, StoryAngle } from "./types";

export const BharatvarshIntro: React.FC<{
  contentChannel: ContentChannel;
  shortTitle: string;
  badge?: string;
  storyAngle?: StoryAngle;
  durationInFrames: number;
}> = ({ contentChannel, shortTitle, badge, storyAngle, durationInFrames }) => {
  const frame = useCurrentFrame();

  const showBharatsenaLogo = storyAngle === "bharatsena";

  if (contentChannel === "declassified_report") {
    return (
      <DeclassifiedReportIntro
        shortTitle={shortTitle}
        badge={badge}
        showLogo={showBharatsenaLogo}
        durationInFrames={durationInFrames}
      />
    );
  } else if (contentChannel === "news_article") {
    return (
      <NewsArticleIntro
        shortTitle={shortTitle}
        showLogo={showBharatsenaLogo}
        durationInFrames={durationInFrames}
      />
    );
  } else {
    // graffiti_photo
    return (
      <GraffitiPhotoIntro
        shortTitle={shortTitle}
        durationInFrames={durationInFrames}
      />
    );
  }
};

/**
 * Declassified Report Intro
 * - Obsidian background
 * - "CLASSIFIED" stamp that flickers in with glow
 * - Badge text in JetBrains Mono, Mustard gold
 * - Horizontal scanline animation
 * - Surveillance grid
 */
const DeclassifiedReportIntro: React.FC<{
  shortTitle: string;
  badge?: string;
  showLogo?: boolean;
  durationInFrames: number;
}> = ({ shortTitle, badge, showLogo, durationInFrames }) => {
  const frame = useCurrentFrame();

  // Flicker effect: on/off pattern
  const flickerProgress = (frame % 10) / 10;
  const isFlickering = frame < 15; // Flicker for first 0.5 seconds
  const stampOpacity = isFlickering
    ? flickerProgress > 0.7 ? 0 : 1
    : 1;

  // Scanline scroll animation
  const scanlineOffset = (frame * 2) % 50;

  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.obsidian }}>
      {/* Surveillance grid background */}
      <AbsoluteFill
        style={{
          backgroundImage: `
            linear-gradient(0deg, transparent 24%, rgba(201, 219, 238, 0.08) 25%, rgba(201, 219, 238, 0.08) 26%, transparent 27%, transparent 74%, rgba(201, 219, 238, 0.08) 75%, rgba(201, 219, 238, 0.08) 76%, transparent 77%, transparent),
            linear-gradient(90deg, transparent 24%, rgba(201, 219, 238, 0.08) 25%, rgba(201, 219, 238, 0.08) 26%, transparent 27%, transparent 74%, rgba(201, 219, 238, 0.08) 75%, rgba(201, 219, 238, 0.08) 76%, transparent 77%, transparent)
          `,
          backgroundSize: "50px 50px",
          pointerEvents: "none",
          zIndex: 5,
        }}
      />

      {/* Badge text */}
      {badge && (
        <AbsoluteFill
          style={{
            justifyContent: "center",
            alignItems: "flex-start",
            paddingTop: 100,
          }}
        >
          <div
            style={{
              color: COLORS.mustard,
              fontFamily: FONTS.jetbrainsMono,
              fontSize: 18,
              letterSpacing: 2,
              opacity: interpolate(frame, [0, 10], [0, 1]),
              textShadow: `0 0 10px rgba(241, 194, 50, 0.6)`,
            }}
          >
            {badge}
          </div>
        </AbsoluteFill>
      )}

      {/* "CLASSIFIED" stamp */}
      <AbsoluteFill
        style={{
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <div
          style={{
            color: COLORS.mustard,
            fontFamily: FONTS.jetbrainsMono,
            fontSize: 100,
            fontWeight: "bold",
            letterSpacing: 8,
            opacity: stampOpacity,
            textShadow: `0 0 30px rgba(241, 194, 50, 0.8)`,
            transform: "rotate(-20deg)",
            zIndex: 10,
          }}
        >
          CLASSIFIED
        </div>
      </AbsoluteFill>

      {/* Scanline overlay */}
      <AbsoluteFill
        style={{
          backgroundImage: `repeating-linear-gradient(
            0deg,
            rgba(201, 219, 238, 0.1) 0px,
            rgba(201, 219, 238, 0.1) 2px,
            transparent 2px,
            transparent 4px
          )`,
          backgroundPosition: `0 ${scanlineOffset}px`,
          pointerEvents: "none",
          zIndex: 8,
        }}
      />

      {/* Bharatsena logo — top-right (Bharatsena angle only) */}
      {showLogo && (
        <Img
          src={staticFile("brand/bharatsena-logo.jpeg")}
          style={{
            position: "absolute",
            top: 20,
            right: 20,
            width: 80,
            height: 80,
            objectFit: "contain",
            opacity: interpolate(frame, [10, 20], [0, 0.85], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            }),
            zIndex: 25,
          }}
        />
      )}

      {/* www watermark — bottom-right */}
      <div
        style={{
          position: "absolute",
          bottom: 16,
          right: 20,
          color: COLORS.textMuted,
          fontFamily: FONTS.inter,
          fontSize: 16,
          opacity: 0.4,
          zIndex: 25,
        }}
      >
        www.welcometobharatvarsh.com
      </div>

      {/* Short title at bottom */}
      <AbsoluteFill
        style={{
          justifyContent: "flex-end",
          alignItems: "flex-end",
          paddingBottom: 60,
          paddingLeft: 40,
          paddingRight: 40,
        }}
      >
        <div
          style={{
            color: COLORS.textPrimary,
            fontFamily: FONTS.bebasNeue,
            fontSize: 48,
            letterSpacing: 3,
            textTransform: "uppercase",
            textAlign: "center",
            opacity: interpolate(frame, [15, durationInFrames - 10], [0, 1]),
          }}
        >
          {shortTitle}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

/**
 * News Article Intro
 * - BVN-24x7 masthead bar at top
 * - Title appears with typewriter effect
 * - "BREAKING" ticker at bottom scrolling left
 * - Digital grid background
 */
const NewsArticleIntro: React.FC<{
  shortTitle: string;
  showLogo?: boolean;
  durationInFrames: number;
}> = ({ shortTitle, showLogo, durationInFrames }) => {
  const frame = useCurrentFrame();
  const { width } = useVideoConfig();

  // Typewriter effect
  const charsPerFrame = 2;
  const visibleChars = Math.min(
    Math.floor(frame * charsPerFrame),
    shortTitle.length,
  );
  const displayText = shortTitle.substring(0, visibleChars);

  // Ticker scroll
  const tickerOffset = (frame * 3) % width;

  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.obsidian }}>
      {/* Grid background */}
      <AbsoluteFill
        style={{
          backgroundImage: `
            linear-gradient(0deg, transparent 24%, rgba(17, 208, 227, 0.08) 25%, rgba(17, 208, 227, 0.08) 26%, transparent 27%, transparent 74%, rgba(17, 208, 227, 0.08) 75%, rgba(17, 208, 227, 0.08) 76%, transparent 77%, transparent),
            linear-gradient(90deg, transparent 24%, rgba(17, 208, 227, 0.08) 25%, rgba(17, 208, 227, 0.08) 26%, transparent 27%, transparent 74%, rgba(17, 208, 227, 0.08) 75%, rgba(17, 208, 227, 0.08) 76%, transparent 77%, transparent)
          `,
          backgroundSize: "50px 50px",
          pointerEvents: "none",
          zIndex: 5,
        }}
      />

      {/* BVN-24x7 Masthead */}
      <AbsoluteFill
        style={{
          top: 0,
          left: 0,
          right: 0,
          height: 70,
          backgroundColor: COLORS.navy,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderBottom: `3px solid ${COLORS.mustard}`,
          zIndex: 20,
        }}
      >
        <div
          style={{
            color: COLORS.textPrimary,
            fontFamily: FONTS.jetbrainsMono,
            fontSize: 32,
            fontWeight: "bold",
            letterSpacing: 4,
          }}
        >
          BVN-24×7
        </div>
      </AbsoluteFill>

      {/* Title with typewriter effect */}
      <AbsoluteFill
        style={{
          justifyContent: "center",
          alignItems: "center",
          paddingTop: 70,
          paddingLeft: 40,
          paddingRight: 40,
        }}
      >
        <div
          style={{
            color: COLORS.textPrimary,
            fontFamily: FONTS.bebasNeue,
            fontSize: 60,
            letterSpacing: 3,
            textTransform: "uppercase",
            textAlign: "center",
            minHeight: 80,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {displayText}
          {visibleChars < shortTitle.length && (
            <span
              style={{
                display: "inline-block",
                width: 4,
                height: "1.2em",
                backgroundColor: COLORS.mustard,
                marginLeft: 10,
                opacity: (frame % 10) > 5 ? 1 : 0,
              }}
            />
          )}
        </div>
      </AbsoluteFill>

      {/* Bharatsena logo — top-right (Bharatsena angle only) */}
      {showLogo && (
        <Img
          src={staticFile("brand/bharatsena-logo.jpeg")}
          style={{
            position: "absolute",
            top: 80,
            right: 20,
            width: 80,
            height: 80,
            objectFit: "contain",
            opacity: interpolate(frame, [5, 15], [0, 0.85], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            }),
            zIndex: 25,
          }}
        />
      )}

      {/* www watermark — bottom-right, above ticker */}
      <div
        style={{
          position: "absolute",
          bottom: 58,
          right: 20,
          color: COLORS.textMuted,
          fontFamily: FONTS.inter,
          fontSize: 16,
          opacity: 0.4,
          zIndex: 25,
        }}
      >
        www.welcometobharatvarsh.com
      </div>

      {/* BREAKING ticker at bottom */}
      <AbsoluteFill
        style={{
          bottom: 0,
          left: 0,
          right: 0,
          height: 50,
          backgroundColor: COLORS.navy,
          borderTop: `2px solid ${COLORS.mustard}`,
          display: "flex",
          alignItems: "center",
          overflow: "hidden",
          zIndex: 20,
        }}
      >
        <div
          style={{
            display: "flex",
            gap: width,
            transform: `translateX(${-tickerOffset}px)`,
            whiteSpace: "nowrap",
          }}
        >
          <span
            style={{
              color: COLORS.mustard,
              fontFamily: FONTS.jetbrainsMono,
              fontSize: 20,
              fontWeight: "bold",
              letterSpacing: 2,
            }}
          >
            ◆ BREAKING NEWS ◆ CLASSIFIED DIRECTIVE ◆
          </span>
          <span
            style={{
              color: COLORS.mustard,
              fontFamily: FONTS.jetbrainsMono,
              fontSize: 20,
              fontWeight: "bold",
              letterSpacing: 2,
            }}
          >
            ◆ BREAKING NEWS ◆ CLASSIFIED DIRECTIVE ◆
          </span>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

/**
 * Graffiti Photo Intro
 * - Full black fade reveal
 * - Title in Bebas Neue with glow pulse
 * - Atmospheric, artistic mood
 * - No grid or stamps
 */
const GraffitiPhotoIntro: React.FC<{
  shortTitle: string;
  durationInFrames: number;
}> = ({ shortTitle, durationInFrames }) => {
  const frame = useCurrentFrame();

  // Fade in from black
  const fadeProgress = interpolate(frame, [0, durationInFrames * 0.6], [1, 0]);

  // Glow pulse
  const pulseProgress = (frame % (TIMING.gowPulseDuration * 2)) / (TIMING.gowPulseDuration * 2);
  const glowOpacity = 0.3 + Math.sin(pulseProgress * Math.PI) * 0.3;

  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.obsidian }}>
      {/* Title with glow pulse */}
      <AbsoluteFill
        style={{
          justifyContent: "center",
          alignItems: "center",
          paddingLeft: 40,
          paddingRight: 40,
        }}
      >
        <div
          style={{
            position: "relative",
            textAlign: "center",
          }}
        >
          {/* Glow effect */}
          <div
            style={{
              position: "absolute",
              top: "-20px",
              left: "-40px",
              right: "-40px",
              bottom: "-20px",
              background: `radial-gradient(ellipse at center, rgba(241, 194, 50, ${glowOpacity}) 0%, transparent 70%)`,
              zIndex: -1,
            }}
          />

          {/* Text */}
          <div
            style={{
              color: COLORS.mustard,
              fontFamily: FONTS.bebasNeue,
              fontSize: 80,
              letterSpacing: 4,
              textTransform: "uppercase",
              textShadow: `0 0 30px rgba(241, 194, 50, 0.8)`,
              opacity: interpolate(frame, [0, durationInFrames * 0.5], [0, 1]),
            }}
          >
            {shortTitle}
          </div>
        </div>
      </AbsoluteFill>

      {/* Black fade overlay */}
      <AbsoluteFill
        style={{
          backgroundColor: COLORS.obsidian,
          opacity: fadeProgress,
          zIndex: 30,
          pointerEvents: "none",
        }}
      />
    </AbsoluteFill>
  );
};
