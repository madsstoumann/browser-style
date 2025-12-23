/**
 * Color converter for design tokens
 * Handles all color formats including modern color spaces
 */

import { resolveReference } from '../resolvers/index.js';

/**
 * Generates CSS color value from design token value
 * @param {string|Object} value - Color value (hex string or color object)
 * @param {Map} registry - Token registry for reference resolution
 * @returns {string} CSS color value
 */
export function generateColorValue(value, registry = new Map()) {
  // Handle reference strings
  if (typeof value === 'string') {
    return resolveReference(value, registry);
  }

  // Handle color object with colorSpace
  if (value.colorSpace && value.components) {
    const { colorSpace, components, alpha } = value;
    const componentStr = components.map(c => c === 'none' ? 'none' : c).join(' ');

    // RGB-like color spaces (display-p3, srgb, rec2020, etc.) need the color() function wrapper
    // Perceptual color spaces (oklab, oklch, lab, lch, etc.) are direct functions
    const rgbLikeSpaces = ['display-p3', 'srgb', 'srgb-linear', 'rec2020', 'a98-rgb', 'prophoto-rgb', 'xyz', 'xyz-d50', 'xyz-d65'];
    const needsColorWrapper = rgbLikeSpaces.includes(colorSpace.toLowerCase());

    // Format the color value
    if (needsColorWrapper) {
      // RGB-like: color(display-p3 0.1 0.46 0.82 / alpha)
      if (alpha !== undefined && alpha !== 1) {
        return `color(${colorSpace} ${componentStr} / ${alpha})`;
      }
      return `color(${colorSpace} ${componentStr})`;
    } else {
      // Perceptual: oklab(0.7 0.27 -0.08 / alpha)
      if (alpha !== undefined && alpha !== 1) {
        return `${colorSpace}(${componentStr} / ${alpha})`;
      }
      return `${colorSpace}(${componentStr})`;
    }
  }

  // Fallback to hex if available
  if (value.hex) {
    return value.hex;
  }

  return value;
}
