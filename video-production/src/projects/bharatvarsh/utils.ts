/**
 * Utility functions for Bharatvarsh video compositions
 */

import { FACTION_COLORS, OVERLAY_INTENSITIES } from "./constants";
import { ContentChannel, StoryAngle } from "./types";

/**
 * Get faction colors for a given story angle
 */
export const getFactionColors = (storyAngle: StoryAngle) => {
  return FACTION_COLORS[storyAngle];
};

/**
 * Get channel-specific styling configuration
 */
export const getChannelStyle = (contentChannel: ContentChannel) => {
  const overlayIntensity =
    OVERLAY_INTENSITIES[contentChannel as keyof typeof OVERLAY_INTENSITIES] ||
    0.12;

  return {
    overlayIntensity,
    introType: contentChannel,
    hasGrid: contentChannel === "declassified_report" || contentChannel === "news_article",
    hasScanlines: contentChannel === "declassified_report",
    hasTickerText: contentChannel === "news_article",
    hasBroadcastBoot: contentChannel === "news_article",
    hasGraffiti: contentChannel === "graffiti_photo",
  };
};

/**
 * Get BVN-24x7 masthead style object
 */
export const getBroadcastMastheadStyle = (): React.CSSProperties => ({
  position: "absolute",
  top: 0,
  left: 0,
  right: 0,
  height: 60,
  backgroundColor: "#0B2742",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  color: "#FFFFFF",
  fontFamily: "JetBrains Mono, monospace",
  fontSize: 24,
  fontWeight: "bold",
  letterSpacing: 8,
  zIndex: 100,
  borderBottom: "2px solid #F1C232",
});

/**
 * Get classified stamp animation style
 */
export const getClassifiedStampStyle = (
  opacity: number,
): React.CSSProperties => ({
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%) rotate(-15deg)",
  color: "#F1C232",
  fontFamily: "JetBrains Mono, monospace",
  fontSize: 80,
  fontWeight: "bold",
  letterSpacing: 6,
  opacity,
  textShadow: "0 0 20px rgba(241, 194, 50, 0.6)",
  zIndex: 50,
});

/**
 * Get surveillance grid overlay style
 */
export const getSurveillanceGridStyle = (opacity: number): React.CSSProperties => ({
  position: "absolute",
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundImage: `
    linear-gradient(0deg, transparent 24%, rgba(201, 219, 238, 0.1) 25%, rgba(201, 219, 238, 0.1) 26%, transparent 27%, transparent 74%, rgba(201, 219, 238, 0.1) 75%, rgba(201, 219, 238, 0.1) 76%, transparent 77%, transparent),
    linear-gradient(90deg, transparent 24%, rgba(201, 219, 238, 0.1) 25%, rgba(201, 219, 238, 0.1) 26%, transparent 27%, transparent 74%, rgba(201, 219, 238, 0.1) 75%, rgba(201, 219, 238, 0.1) 76%, transparent 77%, transparent)
  `,
  backgroundSize: "50px 50px",
  opacity,
  pointerEvents: "none",
  zIndex: 15,
});

/**
 * Get vignette overlay style
 */
export const getVignetteStyle = (): React.CSSProperties => ({
  position: "absolute",
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  background: "radial-gradient(ellipse at center, transparent 0%, rgba(10, 13, 18, 0.4) 100%)",
  pointerEvents: "none",
  zIndex: 12,
});

/**
 * Get bottom gradient bar style (for text zones)
 */
export const getBottomGradientBarStyle = (): React.CSSProperties => ({
  position: "absolute",
  bottom: 0,
  left: 0,
  right: 0,
  height: "35%",
  background:
    "linear-gradient(to bottom, transparent 0%, rgba(10, 13, 18, 0.5) 50%, rgba(10, 13, 18, 0.9) 100%)",
  pointerEvents: "none",
  zIndex: 14,
});

/**
 * Get mustard accent bar style (above text)
 */
export const getMustardAccentBarStyle = (): React.CSSProperties => ({
  position: "absolute",
  bottom: "36%",
  left: "50%",
  transform: "translateX(-50%)",
  width: "60%",
  height: 2,
  backgroundColor: "#F1C232",
  boxShadow: "0 0 15px rgba(241, 194, 50, 0.5)",
  zIndex: 13,
});

/**
 * Get faction glow stripe style (end card)
 */
export const getFactionGlowStripeStyle = (factionColor: string): React.CSSProperties => ({
  position: "absolute",
  bottom: 0,
  left: 0,
  right: 0,
  height: 2,
  backgroundColor: factionColor,
  boxShadow: `0 0 20px ${factionColor}`,
  zIndex: 20,
});
