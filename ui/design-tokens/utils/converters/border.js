/**
 * Border converter for design tokens
 */

import { resolveReference } from '../resolvers/index.js';

/**
 * Generates CSS border value
 * @param {Object} value - Border value object
 * @param {Map} registry - Token registry for reference resolution
 * @returns {string} CSS border value
 */
export function generateBorderValue(value, registry = new Map()) {
  const width = resolveReference(value.width, registry);
  const style = value.style || 'solid';
  const color = resolveReference(value.color, registry);

  return `${width} ${style} ${color}`;
}
