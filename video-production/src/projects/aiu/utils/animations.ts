/**
 * Animation utilities — re-exported from common library.
 * This shim maintains backward compatibility with existing AI&U imports.
 */
export {
  SPRING_CONFIGS,
  useSpring,
  type SpringPreset,
} from '../../../common/animations/springs';
export { EASING } from '../../../common/animations/easing';
export {
  useSlideIn,
  useScaleIn,
  useFadeIn,
  useSlamIn,
} from '../../../common/animations/interpolations';
export {
  staggerDelay,
  staggeredDuration,
  staggerDelays,
} from '../../../common/animations/sequencing';
