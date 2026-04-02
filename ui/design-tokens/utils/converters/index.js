/**
 * Main converters module
 * Exports all token converters and the main toCssValue function
 */

export { generateColorValue } from './color.js';
export { generateGradientValue } from './gradient.js';
export { generateShadowValue } from './shadow.js';
export { generateBorderValue } from './border.js';
export {
  generateTypographyValue,
  generateFontFamilyValue,
  generateTransitionValue
} from './typography.js';

import { generateColorValue } from './color.js';
import { generateGradientValue } from './gradient.js';
import { generateShadowValue } from './shadow.js';
import { generateBorderValue } from './border.js';
import { generateTypographyValue, generateFontFamilyValue, generateTransitionValue } from './typography.js';
import { resolveReference } from '../resolvers/index.js';

/**
 * Main converter - converts any single token to CSS value
 * @param {Object} token - Design token object
 * @param {Map} registry - Token registry for reference resolution
 * @returns {string} CSS value
 */
export function toCssValue(token, registry = new Map()) {
  const { $type, $value, $extensions } = token;

  // Handle CSS functions (light-dark, clamp, etc.)
  const cssExt = $extensions?.css || {};
  if (cssExt.fn && cssExt.args) {
    const resolvedArgs = cssExt.args.map(arg => resolveReference(arg, registry));
    return `${cssExt.fn}(${resolvedArgs.join(', ')})`;
  }

  // Type-specific conversion
  switch ($type) {
    case 'color':
      return generateColorValue($value, registry);

    case 'gradient':
      return generateGradientValue($value, cssExt, registry);

    case 'shadow':
      return generateShadowValue($value, registry);

    case 'border':
      return generateBorderValue($value, registry);

    case 'typography':
      return generateTypographyValue($value, registry);

    case 'fontFamily':
      return generateFontFamilyValue($value);

    case 'cubicBezier':
      return `cubic-bezier(${$value.join(', ')})`;

    case 'transition':
      return generateTransitionValue($value, registry);

    case 'dimension':
    case 'duration':
    case 'number':
    case 'fontWeight':
    case 'fontStyle':
    case 'aspectRatio':
    case 'custom-path':
      return resolveReference($value, registry);

    default:
      // For unknown types, attempt to resolve references
      return resolveReference($value, registry);
  }
}
