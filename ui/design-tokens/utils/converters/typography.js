/**
 * Typography converter for design tokens
 * Handles composite typography tokens
 */

import { resolveReference } from '../resolvers/index.js';

/**
 * Generates CSS typography value (font shorthand)
 * @param {Object} value - Typography value object
 * @param {Map} registry - Token registry for reference resolution
 * @returns {string} CSS font shorthand
 */
export function generateTypographyValue(value, registry = new Map()) {
  const parts = [];

  if (value.fontStyle) {
    parts.push(resolveReference(value.fontStyle, registry));
  }
  if (value.fontWeight) {
    parts.push(resolveReference(value.fontWeight, registry));
  }
  if (value.fontSize) {
    const fontSize = resolveReference(value.fontSize, registry);
    const lineHeight = value.lineHeight ? `/${resolveReference(value.lineHeight, registry)}` : '';
    parts.push(`${fontSize}${lineHeight}`);
  }
  if (value.fontFamily) {
    parts.push(resolveReference(value.fontFamily, registry));
  }

  return parts.join(' ') || '/* composite typography token */';
}

/**
 * Generates CSS font-family value
 * @param {string|Array} value - Font family value
 * @returns {string} CSS font-family value
 */
export function generateFontFamilyValue(value) {
  if (Array.isArray(value)) {
    return value.map(font => {
      // Quote font names with spaces
      return font.includes(' ') ? `"${font}"` : font;
    }).join(', ');
  }
  return value;
}

/**
 * Generates CSS transition value
 * @param {Object} value - Transition value object
 * @param {Map} registry - Token registry for reference resolution
 * @returns {string} CSS transition value
 */
export function generateTransitionValue(value, registry = new Map()) {
  const duration = resolveReference(value.duration, registry);
  const timingFunction = resolveReference(value.timingFunction, registry);
  const delay = value.delay ? resolveReference(value.delay, registry) : '0ms';

  return `all ${duration} ${timingFunction} ${delay}`;
}
