/**
 * MotionBlur — Presets for @remotion/motion-blur
 */

export { CameraMotionBlur, Trail } from '@remotion/motion-blur';

export const MOTION_BLUR_PRESETS = {
  light: { samples: 8, shutterAngle: 90 },
  standard: { samples: 12, shutterAngle: 180 },
  heavy: { samples: 16, shutterAngle: 270 },
  cinematic: { samples: 20, shutterAngle: 180 },
} as const;
