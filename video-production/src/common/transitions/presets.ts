/**
 * Transition Presets — Video Production Common Library
 * Pre-configured scene transitions using @remotion/transitions.
 */

import { fade } from '@remotion/transitions/fade';
import { slide } from '@remotion/transitions/slide';
import { wipe } from '@remotion/transitions/wipe';
import { flip } from '@remotion/transitions/flip';
import { clockWipe } from '@remotion/transitions/clock-wipe';

/** Smooth crossfade */
export function fadeTransition() {
  return fade();
}

/** Directional slide */
export function slideTransition(
  direction: 'from-left' | 'from-right' | 'from-top' | 'from-bottom' = 'from-right',
) {
  return slide({ direction });
}

/** Horizontal/vertical wipe */
export function wipeTransition(
  direction: 'from-left' | 'from-right' | 'from-top' | 'from-bottom' = 'from-left',
) {
  return wipe({ direction });
}

/** Card flip */
export function flipTransition(
  direction: 'from-left' | 'from-right' | 'from-top' | 'from-bottom' = 'from-left',
) {
  return flip({ direction });
}

/** Circular clock wipe */
export function clockWipeTransition(width: number, height: number) {
  return clockWipe({ width, height });
}
