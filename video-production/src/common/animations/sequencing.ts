/**
 * Sequencing Utilities — Video Production Common Library
 * Helpers for staggered animations and timeline math.
 */

/** Calculate stagger delay for the nth item in a sequence */
export function staggerDelay(index: number, perItemDelay = 6): number {
  return index * perItemDelay;
}

/** Calculate total duration for a staggered sequence */
export function staggeredDuration(
  itemCount: number,
  perItemDelay: number,
  itemDuration: number,
): number {
  return (itemCount - 1) * perItemDelay + itemDuration;
}

/** Generate an array of delays for N items */
export function staggerDelays(count: number, perItemDelay = 6): number[] {
  return Array.from({ length: count }, (_, i) => i * perItemDelay);
}
