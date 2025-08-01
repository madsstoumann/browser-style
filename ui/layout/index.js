/**
 * Layout Srcsets Generator
 * 
 * This module provides utilities for generating responsive srcsets attributes
 * for lay-out web components based on layout configurations.
 * 
 * @example
 * import { generateLayoutSrcsets, getSrcset, createLayoutsDataMap } from './layout/index.js';
 * 
 * // Load configuration and layout data
 * const config = await fetch('config.json').then(r => r.json());
 * const gridData = await fetch('systems/layouts/grid.json').then(r => r.json());
 * const columnsData = await fetch('systems/layouts/columns.json').then(r => r.json());
 * 
 * const layoutsData = createLayoutsDataMap({
 *   'grid.json': gridData,
 *   'columns.json': columnsData
 * });
 * 
 * // Generate srcsets for a layout element
 * const layoutElement = document.querySelector('lay-out');
 * const srcsets = generateLayoutSrcsets(layoutElement, config, layoutsData);
 * // Returns: "default:100vw;540:50vw,50vw,100vw;720:33.33vw"
 * 
 * // Get srcset for a specific child element
 * const childSrcset = getSrcset(layoutElement, 0); // First child
 * // Returns: "(min-width: 720px) 33.33vw, (min-width: 540px) 50vw, 100vw"
 */

/**
 * Generates srcsets attribute for lay-out elements
 * @param {Element|string} element - DOM element or lay-out element string
 * @param {Object} config - Loaded config.json object
 * @param {Map} layoutsData - Map of layout type -> layout objects array
 * @returns {string} Formatted srcsets string (e.g., "default:100vw;540:50vw;720:33.33vw")
 */
export function generateLayoutSrcsets(element, config, layoutsData) {
  const breakpoints = parseBreakpointsFromElement(element);
  
  if (!breakpoints || Object.keys(breakpoints).length === 0) {
    return 'default:100vw';
  }
  
  const srcsetParts = ['default:100vw']; // Mobile-first fallback
  
  for (const [breakpointName, layoutPattern] of Object.entries(breakpoints)) {
    const srcset = getSrcsetForPattern(layoutPattern, layoutsData);
    if (srcset) {
      const pixelKey = getPixelKeyForBreakpoint(breakpointName, config);
      if (pixelKey) {
        srcsetParts.push(`${pixelKey}:${srcset}`);
      }
    }
  }
  
  return srcsetParts.join(';');
}

/**
 * Generates CSS srcset string for a specific child element within a lay-out
 * @param {Element|string} layoutElementOrSrcsets - Layout DOM element, element string, or srcsets string directly
 * @param {number} childIndex - Zero-based index of the child element
 * @returns {string} CSS srcset string (e.g., "(min-width: 720px) 33.33vw, (min-width: 540px) 50vw, 100vw")
 */
export function getSrcset(layoutElementOrSrcsets, childIndex) {
  // Get the srcsets string from various input types
  let srcsets;
  
  if (typeof layoutElementOrSrcsets === 'string') {
    // Check if it's an element string with srcsets attribute
    const match = layoutElementOrSrcsets.match(/srcsets="([^"]+)"/);
    if (match) {
      srcsets = match[1];
    } else {
      // Assume it's the srcsets string directly
      srcsets = layoutElementOrSrcsets;
    }
  } else if (layoutElementOrSrcsets && layoutElementOrSrcsets.getAttribute) {
    // It's a DOM element
    srcsets = layoutElementOrSrcsets.getAttribute('srcsets');
  }
  
  if (!srcsets) {
    return '100vw'; // Fallback if no srcsets found
  }
  
  // Parse srcsets into breakpoint rules
  const rules = parseSrcsetRules(srcsets);
  
  // Extract width for this child index from each rule
  const cssRules = [];
  
  // Sort rules by pixel value (largest first) for proper CSS srcset order
  const sortedRules = rules
    .filter(rule => rule.pixelKey !== 'default')
    .sort((a, b) => {
      const aMin = parseInt(a.pixelKey.split('-')[0]);
      const bMin = parseInt(b.pixelKey.split('-')[0]);
      return bMin - aMin; // Descending order
    });
  
  // Add breakpoint rules (largest first)
  for (const rule of sortedRules) {
    const width = getWidthForChild(rule.widths, childIndex);
    if (width) {
      cssRules.push(`${rule.mediaQuery} ${width}`);
    }
  }
  
  // Add default rule (no media query, comes last)
  const defaultRule = rules.find(rule => rule.pixelKey === 'default');
  if (defaultRule) {
    const defaultWidth = getWidthForChild(defaultRule.widths, childIndex);
    if (defaultWidth) {
      cssRules.push(defaultWidth);
    }
  }
  
  return cssRules.join(', ') || '100vw';
}

/**
 * Parses breakpoint attributes from lay-out element
 * @param {Element|string} element - DOM element or element string
 * @returns {Object} Object with breakpoint -> layout pattern mappings
 */
function parseBreakpointsFromElement(element) {
  let elementString;
  
  if (typeof element === 'string') {
    elementString = element;
  } else if (element && element.outerHTML) {
    elementString = element.outerHTML;
  } else {
    return {};
  }
  
  const breakpointRegex = /(\w+)="([^"]+)"/g;
  const breakpoints = {};
  let match;
  
  while ((match = breakpointRegex.exec(elementString)) !== null) {
    const [, breakpoint, value] = match;
    if (breakpoint !== 'srcsets' && breakpoint !== 'overflow') {
      breakpoints[breakpoint] = value;
    }
  }
  
  return breakpoints;
}

/**
 * Gets srcset string for a specific layout pattern
 * @param {string} pattern - Layout pattern like "grid(3a)" or "columns(3)"
 * @param {Map} layoutsData - Map of layout data
 * @returns {string|null} Srcset string or null if not found
 */
function getSrcsetForPattern(pattern, layoutsData) {
  // Parse pattern like "grid(3a)" or "columns(3)"
  const match = pattern.match(/(\w+)\(([^)]+)\)/);
  if (!match) return null;
  
  const [, layoutType, layoutId] = match;
  
  // Look up the layout in our layouts data
  let layouts = layoutsData.get(layoutType);
  if (!layouts) {
    // Try with 's' suffix (e.g., "columns" for "column")
    layouts = layoutsData.get(layoutType + 's');
  }
  if (!layouts) {
    // Try finding by prefix
    for (const [key, value] of layoutsData.entries()) {
      if (Array.isArray(value) && value.length > 0 && value[0].id?.startsWith(layoutType + '(')) {
        layouts = value;
        break;
      }
    }
  }
  
  if (!layouts) {
    return null;
  }
  
  const layout = layouts.find(l => l.originalId === layoutId || l.id === `${layoutType}(${layoutId})`);
  if (!layout) {
    return null;
  }
  
  return layout.srcset || null;
}

/**
 * Converts breakpoint name to pixel-based key
 * @param {string} breakpointName - Breakpoint name like "md", "lg"
 * @param {Object} config - Config object with systems containing breakpoints
 * @returns {string|null} Pixel key like "540" or "540-920"
 */
function getPixelKeyForBreakpoint(breakpointName, config) {
  let breakpointConfig = null;
  
  // Search through all systems for the breakpoint
  if (config?.systems) {
    for (const system of config.systems) {
      if (system.breakpoints?.[breakpointName]) {
        breakpointConfig = system.breakpoints[breakpointName];
        break;
      }
    }
  }
  
  if (!breakpointConfig) return null;
  
  const min = breakpointConfig.min ? parseInt(breakpointConfig.min.replace('px', '')) : null;
  const max = breakpointConfig.max ? parseInt(breakpointConfig.max.replace('px', '')) : null;
  
  // Convert to pixel-based key format
  if (min && max) {
    return `${min}-${max}`; // Range: "540-920"
  } else if (min) {
    return `${min}`; // Min-width only: "540"
  } else if (max) {
    return `0-${max}`; // Max-width only: "0-720" (rare case)
  }
  
  return null;
}

/**
 * Helper function to create layoutsData Map from JSON files
 * @param {Object} layoutFiles - Object where keys are filenames and values are loaded JSON data
 * @returns {Map} Map suitable for use with generateLayoutSrcsets
 * 
 * @example
 * const layoutFiles = {
 *   'grid.json': await loadJSON('grid.json'),
 *   'columns.json': await loadJSON('columns.json')
 * };
 * const layoutsData = createLayoutsDataMap(layoutFiles);
 */
export function createLayoutsDataMap(layoutFiles) {
  const layoutsData = new Map();
  
  for (const [filename, layoutData] of Object.entries(layoutFiles)) {
    const layoutName = filename.replace('.json', '');
    
    if (layoutData.layouts && Array.isArray(layoutData.layouts)) {
      const transformedLayouts = layoutData.layouts.map(layout => ({
        ...layout,
        id: `${layoutData.prefix}(${layout.id})`,
        originalId: layout.id
      }));
      layoutsData.set(layoutName, transformedLayouts);
      layoutsData.set(`${layoutName}_prefix`, layoutData.prefix);
    } else {
      layoutsData.set(layoutName, layoutData);
    }
  }
  
  return layoutsData;
}

/**
 * Parses srcsets string into structured rules
 * @param {string} srcsets - Srcsets string like "default:100vw;540:50vw,50vw,100vw;720:33.33vw"
 * @returns {Array} Array of rule objects with pixelKey, mediaQuery, and widths
 */
function parseSrcsetRules(srcsets) {
  const rules = srcsets.split(';');
  return rules.map(rule => {
    const [pixelKey, widthsString] = rule.split(':');
    const widths = widthsString.split(',');
    
    let mediaQuery = null;
    if (pixelKey !== 'default') {
      if (pixelKey.includes('-')) {
        // Range: "540-920" -> "(min-width: 540px) and (max-width: 920px)"
        const [min, max] = pixelKey.split('-');
        mediaQuery = `(min-width: ${min}px) and (max-width: ${max}px)`;
      } else {
        // Min-width only: "540" -> "(min-width: 540px)"
        mediaQuery = `(min-width: ${pixelKey}px)`;
      }
    }
    
    return {
      pixelKey,
      mediaQuery,
      widths: widths.map(w => w.trim())
    };
  });
}

/**
 * Gets the appropriate width value for a specific child index
 * @param {Array} widths - Array of width values for different children
 * @param {number} childIndex - Zero-based child index
 * @returns {string} Width value for this child
 */
function getWidthForChild(widths, childIndex) {
  if (widths.length === 1) {
    // Single width applies to all children
    return widths[0];
  } else if (childIndex < widths.length) {
    // Specific width for this child index
    return widths[childIndex];
  } else {
    // Fallback to last width if index exceeds available widths
    return widths[widths.length - 1];
  }
}