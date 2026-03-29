/**
 * Color Utilities — Video Production Common Library
 * Brand-neutral color manipulation functions.
 */

/**
 * Convert hex color to RGBA with specified opacity.
 */
export function withOpacity(hex: string, opacity: number): string {
  const cleaned = hex.replace('#', '');
  const r = parseInt(cleaned.substring(0, 2), 16);
  const g = parseInt(cleaned.substring(2, 4), 16);
  const b = parseInt(cleaned.substring(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
}

/**
 * Generate a glow box-shadow CSS string.
 */
export function glowShadow(
  color: string,
  intensity = 0.3,
  spread = 40,
): string {
  return `0 0 ${spread}px ${withOpacity(color, intensity)}, 0 0 ${spread * 2}px ${withOpacity(color, intensity * 0.5)}`;
}

/**
 * Generate accent bar CSS style.
 */
export function accentBarStyle(
  color: string,
  width = 80,
): React.CSSProperties {
  return {
    width,
    height: 4,
    backgroundColor: color,
    borderRadius: 2,
  };
}

/**
 * Blend two hex colors at a given ratio (0 = color1, 1 = color2).
 */
export function blendColors(
  hex1: string,
  hex2: string,
  ratio: number,
): string {
  const c1 = hex1.replace('#', '');
  const c2 = hex2.replace('#', '');
  const r = Math.round(
    parseInt(c1.substring(0, 2), 16) * (1 - ratio) +
      parseInt(c2.substring(0, 2), 16) * ratio,
  );
  const g = Math.round(
    parseInt(c1.substring(2, 4), 16) * (1 - ratio) +
      parseInt(c2.substring(2, 4), 16) * ratio,
  );
  const b = Math.round(
    parseInt(c1.substring(4, 6), 16) * (1 - ratio) +
      parseInt(c2.substring(4, 6), 16) * ratio,
  );
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}
