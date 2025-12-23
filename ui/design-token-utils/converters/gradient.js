/**
 * Gradient converter for design tokens
 * Supports linear, radial, and conic gradients
 */

import { resolveReference } from '../resolvers/index.js';

/**
 * Generates CSS gradient value
 * @param {Array} value - Gradient stops array
 * @param {Object} cssExt - CSS extensions object
 * @param {Map} registry - Token registry for reference resolution
 * @returns {string} CSS gradient value
 */
export function generateGradientValue(value, cssExt, registry = new Map()) {
  // Normalize gradient type - ensure it has -gradient suffix
  let gradientType = cssExt.gradientType || 'linear';
  if (!gradientType.endsWith('-gradient')) {
    gradientType = `${gradientType}-gradient`;
  }

  const stops = value.map(stop => {
    const color = resolveReference(stop.color, registry);
    const position = stop.position !== undefined ? ` ${stop.position * 100}%` : '';
    return `${color}${position}`;
  }).join(', ');

  // Build gradient function arguments
  let args = [];

  if (gradientType === 'linear-gradient') {
    // Linear gradient: direction comes first
    if (cssExt.angle !== undefined) {
      args.push(cssExt.angle);
    }
  } else if (gradientType === 'radial-gradient') {
    // Radial gradient: shape and position
    const parts = [];
    if (cssExt.shape) parts.push(cssExt.shape);
    if (cssExt.position) parts.push(`at ${cssExt.position}`);
    if (parts.length > 0) args.push(parts.join(' '));
  } else if (gradientType === 'conic-gradient') {
    // Conic gradient: angle and position
    const parts = [];
    if (cssExt.angle !== undefined) parts.push(`from ${cssExt.angle}`);
    if (cssExt.position) parts.push(`at ${cssExt.position}`);
    if (parts.length > 0) args.push(parts.join(' '));
  }

  args.push(stops);

  return `${gradientType}(${args.join(', ')})`;
}
