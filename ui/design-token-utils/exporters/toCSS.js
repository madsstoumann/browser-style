/**
 * Design Tokens to CSS Exporter
 * Exports design token collections to CSS custom properties
 */

import { toCssValue } from '../converters/index.js';
import { buildRegistry } from '../resolvers/index.js';

/**
 * Generates CSS custom properties from W3C-compliant design tokens
 * @param {Object} tokens - The design tokens object
 * @param {Object} options - Configuration options
 * @param {string} [options.fileName] - Optional file name to write CSS to
 * @param {string} [options.layer='base'] - CSS layer name
 * @param {string} [options.selector=':root'] - CSS selector
 * @returns {string} Generated CSS string
 */
export function exportTokensToCSS(tokens, options = {}) {
  const config = tokens.$extensions?.export || {};
  const {
    fileName = config.fileName || null,
    layer = config.layer ?? 'base',
    selector = config.selector ?? ':root'
  } = options;

  // Build token registry
  const tokenRegistry = buildRegistry(tokens);

  // Generate CSS properties
  const cssProperties = [];

  for (const [path, tokenData] of tokenRegistry) {
    const cssValue = toCssValue(tokenData, tokenRegistry);
    if (cssValue !== null) {
      cssProperties.push(`  ${tokenData.cssVar}: ${cssValue};`);
    }
  }

  // Build final CSS output
  let css = '';

  if (layer) {
    css += `@layer ${layer} {\n`;
  }

  css += `${selector} {\n`;
  css += cssProperties.join('\n');
  css += '\n}';

  if (layer) {
    css += '\n}';
  }

  return css;
}

/**
 * Loads tokens from a JSON file and exports to CSS
 * (Node.js environment)
 * @param {string} jsonPath - Path to design tokens JSON file
 * @param {Object} options - Export options
 * @returns {Promise<string>} Generated CSS
 */
export async function exportFromFile(jsonPath, options = {}) {
  if (typeof window !== 'undefined') {
    throw new Error('exportFromFile is only available in Node.js environment');
  }

  const fs = await import('fs/promises');
  const path = await import('path');

  const tokensData = await fs.readFile(jsonPath, 'utf-8');
  const tokens = JSON.parse(tokensData);

  const css = exportTokensToCSS(tokens, options);

  const config = tokens.$extensions?.export || {};
  let outputPath = null;

  if (options.fileName) {
    // If provided in options, resolve relative to CWD
    outputPath = path.resolve(options.fileName);
  } else if (config.fileName) {
    // If provided in JSON, resolve relative to the JSON file itself
    const absoluteJsonPath = path.resolve(jsonPath);
    const jsonDir = path.dirname(absoluteJsonPath);
    outputPath = path.resolve(jsonDir, config.fileName);
  }

  if (outputPath) {
    await fs.writeFile(outputPath, css, 'utf-8');
    console.log(`CSS exported to: ${outputPath}`);
  }

  return css;
}

/**
 * Injects CSS into the current page via <style> tag
 * (Browser environment)
 * @param {Object} tokens - Design tokens object
 * @param {Object} options - Export options (fileName ignored in browser)
 */
export function injectTokensToPage(tokens, options = {}) {
  if (typeof window === 'undefined') {
    throw new Error('injectTokensToPage is only available in browser environment');
  }

  const css = exportTokensToCSS(tokens, { ...options, fileName: null });

  const styleEl = document.createElement('style');
  styleEl.textContent = css;
  styleEl.setAttribute('data-tokens', 'design-tokens');

  document.head.appendChild(styleEl);
}
