/**
 * Bharatvarsh Content Pipeline — Brand Tokens (Context B)
 *
 * Canonical source: knowledge-base/BRAND_IDENTITY.md, Context B section.
 * These tokens are consumed by all bharatvarsh content pipeline templates and rendering pipelines.
 * Do NOT add tokens from Context A or C here — this file is Context B only.
 */

// ─── Backgrounds (Obsidian Scale) ───────────────────────────────────────────
export const OBSIDIAN_950 = '#0A0D12';  // Deepest bg, outer wrapper
export const OBSIDIAN_900 = '#0F1419';  // Base app background
export const OBSIDIAN_850 = '#141A21';  // Intermediate layer
export const OBSIDIAN_800 = '#1A1F2E';  // Surface cards
export const OBSIDIAN_700 = '#252A3B';  // Elevated surfaces
export const OBSIDIAN_600 = '#323848';  // Borders, dividers

// ─── Primary (Navy) ────────────────────────────────────────────────────────
export const NAVY_900 = '#0B2742';      // Deep navy sections, faction-military bg
export const NAVY_800 = '#0D3050';
export const NAVY_700 = '#11405F';
export const NAVY_600 = '#15506E';
export const NAVY_500 = '#1A607D';

// ─── Accent: Mustard Gold (Primary Interactive) ────────────────────────────
export const MUSTARD_400 = '#F5D56A';   // Light highlight
export const MUSTARD_500 = '#F1C232';   // PRIMARY interactive/selection
export const MUSTARD_600 = '#D9AD2B';   // Hover state
export const MUSTARD_700 = '#B8921F';   // Active/pressed

// ─── Accent: Powder Blue (Technical/Secondary) ────────────────────────────
export const POWDER_100 = '#E8F1F8';
export const POWDER_200 = '#D1E3F1';
export const POWDER_300 = '#C9DBEE';    // Accent text, technical readouts
export const POWDER_400 = '#A8C5DD';
export const POWDER_500 = '#87AFCC';

// ─── Text Colors ───────────────────────────────────────────────────────────
export const TEXT_PRIMARY   = '#F0F4F8';  // Main body text
export const TEXT_SECONDARY = '#A0AEC0';  // Supporting text
export const TEXT_MUTED     = '#718096';  // Disabled, inactive
export const TEXT_ACCENT    = POWDER_300; // Highlighted, technical

// ─── Semantic Status Colors ────────────────────────────────────────────────
export const STATUS_ALERT   = '#DC2626';  // Red — danger
export const STATUS_WARNING = '#F59E0B';  // Amber
export const STATUS_SUCCESS = '#10B981';  // Green
export const STATUS_INFO    = '#3B82F6';  // Blue

// ─── Faction Colors ────────────────────────────────────────────────────────
export const FACTION_MILITARY   = '#0B2742';
export const FACTION_MESH       = '#8B5CF6';
export const FACTION_RESISTANCE = '#DC2626';
export const FACTION_REPUBLIC   = '#3B82F6';
export const FACTION_GUILD      = '#F1C232';

// ─── Timeline Event Type Colors ────────────────────────────────────────────
export const TIMELINE_ECONOMIC   = '#F1C232';  // Mustard
export const TIMELINE_POLITICAL  = '#0B2742';  // Navy
export const TIMELINE_CONFLICT   = '#DC2626';  // Red
export const TIMELINE_GOVERNANCE = '#10B981';  // Green
export const TIMELINE_ERA_MARKER = '#8B5CF6';  // Purple

// ─── Typography ────────────────────────────────────────────────────────────
export const FONT_DISPLAY     = "'Bebas Neue', sans-serif";
export const FONT_BODY        = "'Inter', sans-serif";
export const FONT_LORE        = "'Crimson Pro', serif";
export const FONT_DEVANAGARI  = "'Noto Sans Devanagari', sans-serif";
export const FONT_MONO        = "'JetBrains Mono', monospace";

// ─── Glow Effects ──────────────────────────────────────────────────────────
export const GLOW_MUSTARD = '0 0 20px rgba(241, 194, 50, 0.3)';
export const GLOW_POWDER  = '0 0 20px rgba(201, 219, 238, 0.2)';
export const GLOW_MESH    = '0 0 30px rgba(139, 92, 246, 0.2)';

// ─── Gradients ─────────────────────────────────────────────────────────────
export const GRADIENT_HERO = `linear-gradient(180deg, ${OBSIDIAN_900}, ${NAVY_900})`;
export const GRADIENT_CARD = `linear-gradient(135deg, ${OBSIDIAN_800}, ${OBSIDIAN_700})`;
export const GRADIENT_TEXT = `linear-gradient(135deg, ${POWDER_300}, ${MUSTARD_500})`;

// ─── CSS Custom Properties (for injection into template <style> blocks) ────
export const CSS_CUSTOM_PROPERTIES = `
  :root {
    --obsidian-950: ${OBSIDIAN_950};
    --obsidian-900: ${OBSIDIAN_900};
    --obsidian-850: ${OBSIDIAN_850};
    --obsidian-800: ${OBSIDIAN_800};
    --obsidian-700: ${OBSIDIAN_700};
    --obsidian-600: ${OBSIDIAN_600};
    --navy-900: ${NAVY_900};
    --navy-800: ${NAVY_800};
    --navy-700: ${NAVY_700};
    --navy-600: ${NAVY_600};
    --navy-500: ${NAVY_500};
    --mustard-400: ${MUSTARD_400};
    --mustard-500: ${MUSTARD_500};
    --mustard-600: ${MUSTARD_600};
    --mustard-700: ${MUSTARD_700};
    --powder-100: ${POWDER_100};
    --powder-200: ${POWDER_200};
    --powder-300: ${POWDER_300};
    --powder-400: ${POWDER_400};
    --powder-500: ${POWDER_500};
    --b-text-primary: ${TEXT_PRIMARY};
    --b-text-secondary: ${TEXT_SECONDARY};
    --b-text-muted: ${TEXT_MUTED};
    --b-text-accent: ${TEXT_ACCENT};
    --glow-mustard: ${GLOW_MUSTARD};
    --glow-powder: ${GLOW_POWDER};
    --glow-mesh: ${GLOW_MESH};
  }
`;
