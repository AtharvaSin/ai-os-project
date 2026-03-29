/**
 * Font Loading Utilities — Video Production Common Library
 *
 * Dynamic font loading via @remotion/google-fonts.
 * Each project calls loadProjectFonts() with its specific font requirements.
 */

// Common fonts used across multiple projects
import {
  loadFont as loadInter,
  fontFamily as interFamily,
} from '@remotion/google-fonts/Inter';

import {
  loadFont as loadJetBrainsMono,
  fontFamily as jetBrainsMonoFamily,
} from '@remotion/google-fonts/JetBrainsMono';

/** Font family constants for fonts shared across all projects */
export const SHARED_FONTS = {
  inter: interFamily,
  jetBrainsMono: jetBrainsMonoFamily,
} as const;

/** Load the universal shared fonts (Inter + JetBrains Mono) */
export function loadSharedFonts(): void {
  loadInter('normal', {
    weights: ['400', '500', '600', '700'],
    subsets: ['latin'],
  });
  loadJetBrainsMono('normal', {
    weights: ['400', '500', '600'],
    subsets: ['latin'],
  });
}
