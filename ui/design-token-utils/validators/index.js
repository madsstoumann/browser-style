/**
 * Validators for design tokens
 * Validates token structure and values according to W3C spec
 */

/**
 * Checks if an object is a valid design token
 * @param {any} obj - Object to validate
 * @returns {boolean} True if valid token
 */
export function isValidToken(obj) {
  if (!obj || typeof obj !== 'object') return false;
  return '$value' in obj;
}

/**
 * Validates token structure
 * @param {Object} token - Token to validate
 * @returns {{valid: boolean, errors: string[]}} Validation result
 */
export function validateTokenStructure(token) {
  const errors = [];

  if (!token || typeof token !== 'object') {
    return { valid: false, errors: ['Token must be an object'] };
  }

  if (!('$value' in token)) {
    errors.push('Token must have a $value property');
  }

  // $type is recommended but not strictly required
  // (can be inherited from parent group)

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Checks if a token is a color token
 * @param {Object} token - Token to check
 * @returns {boolean} True if color token
 */
export function isColorToken(token) {
  return isValidToken(token) && token.$type === 'color';
}

/**
 * Checks if a token is a gradient token
 * @param {Object} token - Token to check
 * @returns {boolean} True if gradient token
 */
export function isGradientToken(token) {
  return isValidToken(token) && token.$type === 'gradient';
}

/**
 * Checks if a token is a shadow token
 * @param {Object} token - Token to check
 * @returns {boolean} True if shadow token
 */
export function isShadowToken(token) {
  return isValidToken(token) && token.$type === 'shadow';
}
