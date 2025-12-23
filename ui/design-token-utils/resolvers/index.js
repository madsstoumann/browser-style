/**
 * Reference resolution utilities for design tokens
 * Handles {path.to.token} reference syntax
 */

/**
 * Resolves token references in the format {path.to.token}
 * @param {any} value - Value that may contain references
 * @param {Map} registry - Token registry for reference lookup
 * @returns {string} Resolved value
 */
export function resolveReference(value, registry = new Map()) {
  if (typeof value !== 'string') {
    return String(value);
  }

  // Match {token.reference.path} pattern
  const referencePattern = /\{([^}]+)\}/g;

  return value.replace(referencePattern, (match, refPath) => {
    const referencedToken = registry.get(refPath);

    if (referencedToken) {
      return `var(${referencedToken.cssVar})`;
    }

    // If reference not found, return as-is (could be external reference)
    console.warn(`Reference not found: ${refPath}`);
    return match;
  });
}

/**
 * Builds a token registry from a design token object
 * @param {Object} tokens - Design tokens object
 * @returns {Map} Token registry
 */
export function buildRegistry(tokens) {
  const registry = new Map();
  collectTokens(tokens, [], registry);
  return registry;
}

/**
 * Recursively collects all tokens from the design token tree
 * @param {Object} obj - Current object being traversed
 * @param {string[]} path - Current path in the token tree
 * @param {Map} registry - Token registry to populate
 */
function collectTokens(obj, path, registry) {
  if (!obj || typeof obj !== 'object') return;

  // Check if this is a token (has $value)
  if ('$value' in obj) {
    const cssVar = obj.$extensions?.css?.var || generateCSSVarName(path);

    registry.set(path.join('.'), {
      path,
      cssVar,
      $type: obj.$type,
      $value: obj.$value,
      $extensions: obj.$extensions
    });
    return;
  }

  // Recursively process children, skipping $ prefixed properties
  for (const [key, value] of Object.entries(obj)) {
    if (!key.startsWith('$')) {
      collectTokens(value, [...path, key], registry);
    }
  }
}

/**
 * Generates a CSS variable name from a token path
 * @param {string[]} path - Token path segments
 * @returns {string} CSS variable name
 */
function generateCSSVarName(path) {
  return '--' + path.join('-').replace(/\./g, '-');
}
