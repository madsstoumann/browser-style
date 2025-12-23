/**
 * Shadow converter for design tokens
 * Handles single and multiple shadows
 */

import { resolveReference } from '../resolvers/index.js';

/**
 * Generates CSS shadow value
 * @param {Object|Array} value - Shadow value (single or multiple shadows)
 * @param {Map} registry - Token registry for reference resolution
 * @returns {string} CSS shadow value
 */
export function generateShadowValue(value, registry = new Map()) {
  const shadows = Array.isArray(value) ? value : [value];

  return shadows.map(shadow => {
    const color = resolveReference(shadow.color, registry);
    const offsetX = shadow.offsetX || '0px';
    const offsetY = shadow.offsetY || '0px';
    const blur = shadow.blur || '0px';
    const spread = shadow.spread || '0px';

    return `${offsetX} ${offsetY} ${blur} ${spread} ${color}`.trim();
  }).join(', ');
}
