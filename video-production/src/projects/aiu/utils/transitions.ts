/**
 * Transition utilities — re-exported from common library.
 * This shim maintains backward compatibility with existing AI&U imports.
 */
export {
  fadeTransition,
  slideTransition,
  wipeTransition,
  flipTransition,
  clockWipeTransition,
} from '../../../common/transitions/presets';
export {
  TRANSITION_DURATION,
  type TransitionSpeed,
} from '../../../common/transitions/durations';
