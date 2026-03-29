/**
 * Font loading — common library re-exports + AI&U specific fonts.
 * This shim maintains backward compatibility with existing AI&U imports.
 */
export { SHARED_FONTS, loadSharedFonts } from '../../../common/utils/fonts';

import {
  loadFont as loadSpaceGrotesk,
  fontFamily as spaceGroteskFamily,
} from '@remotion/google-fonts/SpaceGrotesk';
import {
  loadFont as loadInter,
  fontFamily as interFamily,
} from '@remotion/google-fonts/Inter';
import {
  loadFont as loadJetBrainsMono,
  fontFamily as jetBrainsMonoFamily,
} from '@remotion/google-fonts/JetBrainsMono';

/** AI&U font family constants — Space Grotesk (display), Inter (body), JetBrains Mono (code) */
export const FONT_FAMILY = {
  display: spaceGroteskFamily,
  body: interFamily,
  code: jetBrainsMonoFamily,
} as const;

/** Load all AI&U project fonts */
export function loadFonts(): void {
  loadSpaceGrotesk('normal', {
    weights: ['400', '600', '700'],
    subsets: ['latin'],
  });
  loadInter('normal', {
    weights: ['400', '500', '600', '700'],
    subsets: ['latin'],
  });
  loadJetBrainsMono('normal', {
    weights: ['400', '500', '600'],
    subsets: ['latin'],
  });
}
