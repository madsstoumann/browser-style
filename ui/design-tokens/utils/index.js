/**
 * Design Token Utils - Complete toolkit for working with W3C design tokens
 *
 * @module design-token-utils
 * @description Complete toolkit for working with W3C design tokens, including:
 * - Converters: Transform individual tokens to CSS values
 * - Exporters: Export entire token collections to CSS files
 * - Validators: Validate token structure and values
 * - Resolvers: Resolve token references
 */

// Converters (individual token → CSS value)
export {
  toCssValue,
  generateColorValue,
  generateGradientValue,
  generateShadowValue,
  generateBorderValue,
  generateTypographyValue,
  generateFontFamilyValue,
  generateTransitionValue
} from './converters/index.js';

// Exporters (token collection → full output)
export {
  exportTokensToCSS,
  exportFromFile,
  injectTokensToPage
} from './exporters/index.js';

// Validators
export {
  isValidToken,
  validateTokenStructure,
  isColorToken,
  isGradientToken,
  isShadowToken
} from './validators/index.js';

// Resolvers
export {
  resolveReference,
  buildRegistry
} from './resolvers/index.js';

// Default export for convenience
export default {
  // Converters
  toCssValue: (await import('./converters/index.js')).toCssValue,
  generateColorValue: (await import('./converters/index.js')).generateColorValue,
  generateGradientValue: (await import('./converters/index.js')).generateGradientValue,
  generateShadowValue: (await import('./converters/index.js')).generateShadowValue,
  generateBorderValue: (await import('./converters/index.js')).generateBorderValue,

  // Exporters
  exportTokensToCSS: (await import('./exporters/index.js')).exportTokensToCSS,
  exportFromFile: (await import('./exporters/index.js')).exportFromFile,
  injectTokensToPage: (await import('./exporters/index.js')).injectTokensToPage,

  // Validators
  isValidToken: (await import('./validators/index.js')).isValidToken,
  validateTokenStructure: (await import('./validators/index.js')).validateTokenStructure,

  // Resolvers
  resolveReference: (await import('./resolvers/index.js')).resolveReference,
  buildRegistry: (await import('./resolvers/index.js')).buildRegistry
};
