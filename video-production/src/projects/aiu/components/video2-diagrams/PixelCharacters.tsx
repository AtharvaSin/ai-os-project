/**
 * PixelCharacters --- 16-bit pixel art character sprites for the Persona Gateway.
 *
 * Each character is a React component built from absolutely-positioned div
 * rectangles, following the same pattern as PixelCar/PixelBus in DeploymentLanes.
 *
 * Characters:
 *   1. BusinessProCharacter  -- suited man with briefcase (~36x58 PX)
 *   2. TeacherStudentCharacter -- teacher + student pair (~46x58 PX)
 *   3. EntrepreneurCharacter  -- casual founder with laptop & rocket (~36x58 PX)
 *   4. EngineerCharacter      -- hoodie dev with laptop & code brackets (~36x58 PX)
 *   5. BusinessProPortrait    -- head+shoulders crop for badges (~20x24 PX)
 *
 * All sprites use PX=5 as the base pixel unit.
 */
import React from 'react';

// ── Base pixel unit ─────────────────────────────────────────
const PX = 5;

// ── Persona accent colors ───────────────────────────────────
export const PERSONA_COLORS = {
  businessPro: '#F59E0B',
  teacherStudent: '#06B6D4',
  entrepreneur: '#10B981',
  engineer: '#6366F1',
} as const;

// ── Shared props ────────────────────────────────────────────
interface CharacterProps {
  /** Multiplier for all pixel dimensions. Default 1. */
  scale?: number;
  /** When true all colored pixels become dark silhouette with amber edge glow. */
  silhouette?: boolean;
}

// ── Pixel helper ────────────────────────────────────────────
/** Absolutely-positioned pixel rectangle (mirrors DeploymentLanes pattern). */
const px = (
  x: number,
  y: number,
  w: number,
  h: number,
  bg: string,
  extra?: React.CSSProperties,
): React.CSSProperties => ({
  position: 'absolute',
  left: x * PX,
  top: y * PX,
  width: w * PX,
  height: h * PX,
  backgroundColor: bg,
  ...extra,
});

// ── Silhouette wrapper ──────────────────────────────────────
const SILHOUETTE_COLOR = '#1A1F2E';

const SilhouetteWrap: React.FC<{
  silhouette: boolean;
  width: number;
  height: number;
  scale: number;
  children: React.ReactNode;
}> = ({ silhouette, width, height, scale, children }) => {
  const w = width * PX * scale;
  const h = height * PX * scale;

  if (!silhouette) {
    return (
      <div style={{ position: 'relative', width: w, height: h, transform: `scale(${scale})`, transformOrigin: 'top left' }}>
        {children}
      </div>
    );
  }

  return (
    <div
      style={{
        position: 'relative',
        width: w,
        height: h,
        transform: `scale(${scale})`,
        transformOrigin: 'top left',
        filter: `drop-shadow(0 0 3px rgba(245,158,11,0.5)) drop-shadow(0 0 6px rgba(245,158,11,0.25))`,
      }}
    >
      {/* Render children but override all backgrounds to silhouette color via a CSS filter trick:
          we render the sprite normally then overlay a color mask. Since these are simple div rects,
          the cleanest approach is to re-render with silhouette bg. We achieve this by passing
          silhouette color through a CSS variable and using mix-blend-mode. However for maximum
          reliability with absolute-positioned divs, we simply set all bg colors via the parent
          applying a brightness(0) + sepia + hue-rotate chain. For pixel art divs, a simpler
          approach: render a clipped copy. We use the CSS approach below. */}
      <div
        style={{
          position: 'relative',
          width: width * PX,
          height: height * PX,
          filter: 'brightness(0.08) saturate(0.4)',
        }}
      >
        {children}
      </div>
    </div>
  );
};

// =====================================================================
// 1. BusinessProCharacter (~36 x 58 PX units)
// =====================================================================
export const BusinessProCharacter: React.FC<CharacterProps> = ({
  scale = 1,
  silhouette = false,
}) => {
  const HAIR = '#4A3728';
  const SKIN = '#DDB68C';
  const EYES = '#2D2E3A';
  const SUIT = '#2D3748';
  const TIE = '#F59E0B';
  const SHIRT = '#E8E8E8';
  const PANTS = '#374151';
  const SHOE = '#1A1A1A';
  const CASE_BODY = '#8B6534';
  const CASE_CLASP = '#F59E0B';

  return (
    <SilhouetteWrap silhouette={silhouette} width={36} height={58} scale={scale}>
      {/* ── Hair ── */}
      <div style={px(13, 0, 10, 3, HAIR)} />
      <div style={px(12, 1, 12, 2, HAIR)} />

      {/* ── Head ── */}
      <div style={px(13, 3, 10, 10, SKIN)} />
      {/* Eyes */}
      <div style={px(15, 6, 2, 2, EYES)} />
      <div style={px(19, 6, 2, 2, EYES)} />
      {/* Mouth hint */}
      <div style={px(16, 9, 4, 1, '#C4956A')} />

      {/* ── Neck ── */}
      <div style={px(16, 13, 4, 2, SKIN)} />

      {/* ── Shirt collar visible ── */}
      <div style={px(15, 15, 6, 2, SHIRT)} />

      {/* ── Suit jacket body ── */}
      <div style={px(10, 15, 16, 18, SUIT)} />

      {/* ── Tie ── */}
      <div style={px(17, 16, 2, 12, TIE)} />

      {/* ── Left arm (viewer's right) ── */}
      <div style={px(6, 16, 4, 16, SUIT)} />
      {/* Left hand */}
      <div style={px(6, 32, 4, 3, SKIN)} />

      {/* ── Right arm (viewer's left) holding briefcase ── */}
      <div style={px(26, 16, 4, 16, SUIT)} />
      {/* Right hand */}
      <div style={px(26, 32, 4, 3, SKIN)} />

      {/* ── Briefcase ── */}
      <div style={px(25, 35, 10, 7, CASE_BODY)} />
      {/* Handle */}
      <div style={px(28, 33, 4, 2, CASE_BODY)} />
      {/* Clasp */}
      <div style={px(29, 37, 2, 1, CASE_CLASP)} />

      {/* ── Pants ── */}
      <div style={px(11, 33, 6, 16, PANTS)} />
      <div style={px(19, 33, 6, 16, PANTS)} />

      {/* ── Shoes ── */}
      <div style={px(10, 49, 7, 3, SHOE)} />
      <div style={px(19, 49, 7, 3, SHOE)} />
    </SilhouetteWrap>
  );
};

// =====================================================================
// 2. TeacherStudentCharacter (~46 x 58 PX units)
// =====================================================================
export const TeacherStudentCharacter: React.FC<CharacterProps> = ({
  scale = 1,
  silhouette = false,
}) => {
  // ── Teacher colors ──
  const T_HAIR = '#6B4423';
  const T_SKIN = '#C4956A';
  const T_BLAZER = '#4B5563';
  const T_GLASSES = '#7DD3FC';
  const T_PANTS = '#374151';
  const T_SHOE = '#1A1A1A';
  const T_BOOK_PAGE = '#F0F2F5';
  const T_BOOK_COVER = '#EF4444';

  // ── Student colors ──
  const S_HAIR = '#2D2E3A';
  const S_SKIN = '#E8C4A0';
  const S_SHIRT = '#06B6D4';
  const S_BACKPACK = '#374151';
  const S_PANTS = '#1E293B';
  const S_SHOE = '#1A1A1A';

  return (
    <SilhouetteWrap silhouette={silhouette} width={46} height={58} scale={scale}>
      {/* ════════════ TEACHER (left, taller) ════════════ */}

      {/* Hair bun */}
      <div style={px(7, 0, 6, 3, T_HAIR)} />
      {/* Hair main */}
      <div style={px(5, 2, 10, 3, T_HAIR)} />
      {/* Head */}
      <div style={px(5, 4, 10, 10, T_SKIN)} />
      {/* Glasses */}
      <div style={px(7, 7, 3, 2, T_GLASSES)} />
      <div style={px(11, 7, 3, 2, T_GLASSES)} />
      {/* Glasses bridge */}
      <div style={px(10, 7, 1, 1, T_GLASSES)} />
      {/* Mouth */}
      <div style={px(8, 11, 4, 1, '#A0785A')} />

      {/* Neck */}
      <div style={px(8, 14, 4, 2, T_SKIN)} />

      {/* Blazer body */}
      <div style={px(2, 16, 16, 18, T_BLAZER)} />

      {/* Left arm */}
      <div style={px(0, 17, 3, 14, T_BLAZER)} />
      <div style={px(0, 31, 3, 2, T_SKIN)} />

      {/* Right arm (raised holding book) */}
      <div style={px(17, 16, 3, 8, T_BLAZER)} />
      <div style={px(17, 10, 3, 6, T_BLAZER)} />
      {/* Hand */}
      <div style={px(17, 8, 3, 2, T_SKIN)} />
      {/* Book */}
      <div style={px(16, 4, 6, 5, T_BOOK_COVER)} />
      <div style={px(17, 5, 4, 3, T_BOOK_PAGE)} />

      {/* Pants */}
      <div style={px(3, 34, 6, 16, T_PANTS)} />
      <div style={px(11, 34, 6, 16, T_PANTS)} />

      {/* Shoes */}
      <div style={px(2, 50, 7, 3, T_SHOE)} />
      <div style={px(11, 50, 7, 3, T_SHOE)} />

      {/* ════════════ STUDENT (right, shorter) ════════════ */}

      {/* Hair */}
      <div style={px(31, 10, 10, 3, S_HAIR)} />
      <div style={px(30, 12, 12, 2, S_HAIR)} />
      {/* Head */}
      <div style={px(31, 14, 10, 10, S_SKIN)} />
      {/* Eyes */}
      <div style={px(33, 17, 2, 2, '#2D2E3A')} />
      <div style={px(37, 17, 2, 2, '#2D2E3A')} />
      {/* Mouth */}
      <div style={px(34, 21, 4, 1, '#C4956A')} />

      {/* Neck */}
      <div style={px(34, 24, 4, 2, S_SKIN)} />

      {/* T-shirt */}
      <div style={px(28, 26, 16, 14, S_SHIRT)} />

      {/* Backpack (visible behind right shoulder) */}
      <div style={px(43, 26, 3, 10, S_BACKPACK)} />
      <div style={px(42, 28, 1, 6, S_BACKPACK)} />

      {/* Left arm */}
      <div style={px(26, 27, 3, 12, S_SHIRT)} />
      <div style={px(26, 39, 3, 2, S_SKIN)} />

      {/* Right arm (raised) */}
      <div style={px(43, 26, 3, 4, S_SHIRT)} />
      <div style={px(43, 20, 3, 6, S_SHIRT)} />
      {/* Raised hand */}
      <div style={px(43, 17, 3, 3, S_SKIN)} />

      {/* Pants */}
      <div style={px(29, 40, 6, 14, S_PANTS)} />
      <div style={px(37, 40, 6, 14, S_PANTS)} />

      {/* Shoes */}
      <div style={px(28, 54, 7, 3, S_SHOE)} />
      <div style={px(37, 54, 7, 3, S_SHOE)} />
    </SilhouetteWrap>
  );
};

// =====================================================================
// 3. EntrepreneurCharacter (~36 x 58 PX units)
// =====================================================================
export const EntrepreneurCharacter: React.FC<CharacterProps> = ({
  scale = 1,
  silhouette = false,
}) => {
  const HAIR = '#5C4033';
  const SKIN = '#DDB68C';
  const EYES = '#2D2E3A';
  const SHIRT = '#10B981';
  const SHIRT_SLEEVE = '#0D9668';
  const PANTS = '#1E293B';
  const SHOE = '#1A1A1A';
  const LAPTOP_BODY = '#374151';
  const LAPTOP_SCREEN = '#4A90D9';
  const ROCKET_BODY = '#EF4444';
  const ROCKET_FLAME = '#F59E0B';

  return (
    <SilhouetteWrap silhouette={silhouette} width={36} height={58} scale={scale}>
      {/* ── Pixel rocket floating above right shoulder ── */}
      <div style={px(28, 0, 4, 2, ROCKET_BODY, { borderRadius: `${PX}px ${PX}px 0 0` })} />
      <div style={px(27, 2, 6, 5, ROCKET_BODY)} />
      {/* Rocket window */}
      <div style={px(29, 3, 2, 2, '#FFF', { borderRadius: PX })} />
      {/* Rocket fins */}
      <div style={px(26, 5, 2, 3, ROCKET_BODY)} />
      <div style={px(32, 5, 2, 3, ROCKET_BODY)} />
      {/* Flame */}
      <div style={px(28, 7, 4, 3, ROCKET_FLAME)} />
      <div style={px(29, 10, 2, 2, '#FF6B35')} />

      {/* ── Hair (slightly messy) ── */}
      <div style={px(12, 3, 11, 3, HAIR)} />
      <div style={px(11, 5, 3, 2, HAIR)} />
      <div style={px(21, 4, 3, 2, HAIR)} />

      {/* ── Head ── */}
      <div style={px(13, 6, 10, 10, SKIN)} />
      {/* Eyes */}
      <div style={px(15, 9, 2, 2, EYES)} />
      <div style={px(19, 9, 2, 2, EYES)} />
      {/* Grin */}
      <div style={px(16, 13, 4, 1, '#C4956A')} />

      {/* ── Neck ── */}
      <div style={px(16, 16, 4, 2, SKIN)} />

      {/* ── Shirt body ── */}
      <div style={px(10, 18, 16, 16, SHIRT)} />

      {/* ── Left arm (tucking laptop under) ── */}
      <div style={px(3, 19, 4, 10, SHIRT)} />
      {/* Rolled-up sleeve line */}
      <div style={px(3, 27, 4, 2, SHIRT_SLEEVE)} />
      {/* Forearm */}
      <div style={px(3, 29, 4, 5, SKIN)} />

      {/* ── Laptop tucked under left arm ── */}
      <div style={px(1, 26, 8, 2, LAPTOP_BODY)} />
      <div style={px(1, 24, 8, 2, LAPTOP_SCREEN, { opacity: 0.8 })} />

      {/* ── Right arm ── */}
      <div style={px(26, 19, 4, 10, SHIRT)} />
      {/* Rolled-up sleeve */}
      <div style={px(26, 27, 4, 2, SHIRT_SLEEVE)} />
      {/* Forearm */}
      <div style={px(26, 29, 4, 5, SKIN)} />
      {/* Hand */}
      <div style={px(26, 34, 4, 2, SKIN)} />

      {/* ── Pants (one leg slightly forward) ── */}
      <div style={px(11, 34, 6, 16, PANTS)} />
      <div style={px(19, 34, 6, 15, PANTS)} />
      {/* Forward leg offset */}
      <div style={px(19, 49, 6, 1, PANTS)} />

      {/* ── Shoes ── */}
      <div style={px(10, 50, 7, 3, SHOE)} />
      <div style={px(19, 50, 7, 3, SHOE)} />
    </SilhouetteWrap>
  );
};

// =====================================================================
// 4. EngineerCharacter (~36 x 58 PX units)
// =====================================================================
export const EngineerCharacter: React.FC<CharacterProps> = ({
  scale = 1,
  silhouette = false,
}) => {
  const HAIR = '#2D2E3A';
  const SKIN = '#F5D5B8';
  const EYES = '#2D2E3A';
  const HOODIE = '#6366F1';
  const HOODIE_DARK = '#4F46E5';
  const HEADPHONES = '#374151';
  const LAPTOP_BODY = '#374151';
  const LAPTOP_SCREEN = '#10B981';
  const LAPTOP_KEY = '#6B6E7B';
  const BRACKET_COLOR = '#A0A3B1';
  const JOGGERS = '#374151';
  const SHOE = '#1A1A1A';

  return (
    <SilhouetteWrap silhouette={silhouette} width={36} height={58} scale={scale}>
      {/* ── Floating code brackets ── */}
      {/* Left bracket { */}
      <div style={px(2, 14, 2, 1, BRACKET_COLOR)} />
      <div style={px(1, 15, 2, 1, BRACKET_COLOR)} />
      <div style={px(0, 16, 2, 4, BRACKET_COLOR)} />
      <div style={px(1, 20, 2, 1, BRACKET_COLOR)} />
      <div style={px(2, 21, 2, 1, BRACKET_COLOR)} />

      {/* Right bracket } */}
      <div style={px(32, 14, 2, 1, BRACKET_COLOR)} />
      <div style={px(33, 15, 2, 1, BRACKET_COLOR)} />
      <div style={px(34, 16, 2, 4, BRACKET_COLOR)} />
      <div style={px(33, 20, 2, 1, BRACKET_COLOR)} />
      <div style={px(32, 21, 2, 1, BRACKET_COLOR)} />

      {/* ── Hair ── */}
      <div style={px(13, 1, 10, 3, HAIR)} />
      <div style={px(12, 3, 12, 2, HAIR)} />

      {/* ── Head ── */}
      <div style={px(13, 4, 10, 10, SKIN)} />
      {/* Eyes */}
      <div style={px(15, 7, 2, 2, EYES)} />
      <div style={px(19, 7, 2, 2, EYES)} />
      {/* Mouth */}
      <div style={px(16, 11, 4, 1, '#D4A98A')} />

      {/* ── Headphones around neck ── */}
      <div style={px(11, 13, 2, 3, HEADPHONES)} />
      <div style={px(12, 15, 12, 2, HEADPHONES)} />
      <div style={px(23, 13, 2, 3, HEADPHONES)} />
      {/* Earpad accents */}
      <div style={px(11, 13, 2, 1, '#4B5563')} />
      <div style={px(23, 13, 2, 1, '#4B5563')} />

      {/* ── Neck ── */}
      <div style={px(16, 14, 4, 2, SKIN)} />

      {/* ── Hoodie body ── */}
      <div style={px(9, 16, 18, 18, HOODIE)} />
      {/* Hood (down, behind neck) */}
      <div style={px(10, 14, 16, 3, HOODIE_DARK)} />
      {/* Hoodie pocket */}
      <div style={px(12, 27, 12, 4, HOODIE_DARK)} />
      {/* Drawstrings */}
      <div style={px(15, 17, 1, 4, '#A0A3B1')} />
      <div style={px(20, 17, 1, 4, '#A0A3B1')} />

      {/* ── Arms reaching to laptop ── */}
      {/* Left arm */}
      <div style={px(6, 17, 4, 12, HOODIE)} />
      <div style={px(6, 29, 4, 3, SKIN)} />

      {/* Right arm */}
      <div style={px(26, 17, 4, 12, HOODIE)} />
      <div style={px(26, 29, 4, 3, SKIN)} />

      {/* ── Laptop (open at waist height) ── */}
      {/* Screen (tilted back illusion) */}
      <div style={px(8, 29, 20, 2, LAPTOP_SCREEN, { opacity: 0.7 })} />
      {/* Screen bezel */}
      <div style={px(7, 28, 22, 1, LAPTOP_BODY)} />
      {/* Keyboard base */}
      <div style={px(7, 31, 22, 3, LAPTOP_BODY)} />
      {/* Key dots */}
      <div style={px(9, 32, 2, 1, LAPTOP_KEY)} />
      <div style={px(13, 32, 2, 1, LAPTOP_KEY)} />
      <div style={px(17, 32, 2, 1, LAPTOP_KEY)} />
      <div style={px(21, 32, 2, 1, LAPTOP_KEY)} />
      <div style={px(25, 32, 2, 1, LAPTOP_KEY)} />

      {/* ── Joggers ── */}
      <div style={px(10, 34, 6, 16, JOGGERS)} />
      <div style={px(20, 34, 6, 16, JOGGERS)} />

      {/* ── Shoes ── */}
      <div style={px(9, 50, 7, 3, SHOE)} />
      <div style={px(20, 50, 7, 3, SHOE)} />
    </SilhouetteWrap>
  );
};

// =====================================================================
// 5. BusinessProPortrait -- Head + shoulders crop (~20 x 24 PX units)
// =====================================================================
export const BusinessProPortrait: React.FC<{ scale?: number }> = ({
  scale = 1,
}) => {
  const HAIR = '#4A3728';
  const SKIN = '#DDB68C';
  const EYES = '#2D2E3A';
  const SUIT = '#2D3748';
  const TIE = '#F59E0B';
  const SHIRT = '#E8E8E8';

  return (
    <div
      style={{
        position: 'relative',
        width: 20 * PX * scale,
        height: 24 * PX * scale,
        transform: `scale(${scale})`,
        transformOrigin: 'top left',
      }}
    >
      {/* Hair */}
      <div style={px(5, 0, 10, 3, HAIR)} />
      <div style={px(4, 1, 12, 2, HAIR)} />

      {/* Head */}
      <div style={px(5, 3, 10, 10, SKIN)} />
      {/* Eyes */}
      <div style={px(7, 6, 2, 2, EYES)} />
      <div style={px(11, 6, 2, 2, EYES)} />
      {/* Mouth */}
      <div style={px(8, 9, 4, 1, '#C4956A')} />

      {/* Neck */}
      <div style={px(8, 13, 4, 2, SKIN)} />

      {/* Shirt collar */}
      <div style={px(7, 15, 6, 2, SHIRT)} />

      {/* Suit shoulders */}
      <div style={px(1, 16, 18, 8, SUIT)} />

      {/* Tie */}
      <div style={px(9, 16, 2, 6, TIE)} />
    </div>
  );
};
