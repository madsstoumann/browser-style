/**
 * Layout Srcsets Generator
 * 
 * This module provides utilities for generating responsive srcsets attributes
 * for lay-out web components based on layout configurations with constraint-aware sizing.
 * 
 * @example
 * import { generateLayoutSrcsets, getSrcset, createLayoutsDataMap, applyCSSDefaults } from './layout/index.js';
 * 
 * // Load configuration and layout data
 * const config = await fetch('config.json').then(r => r.json());
 * const gridData = await fetch('systems/layouts/grid.json').then(r => r.json());
 * const columnsData = await fetch('systems/layouts/columns.json').then(r => r.json());
 * 
 * // Apply CSS defaults (optional - only if layoutRootElement is specified in config)
 * applyCSSDefaults(config);
 * 
 * const layoutsData = createLayoutsDataMap({
 *   'grid.json': gridData,
 *   'columns.json': columnsData
 * });
 * 
 * // Generate constraint-aware srcsets for a layout element
 * const layoutElement = document.querySelector('lay-out[width="lg"]');
 * const srcsets = generateLayoutSrcsets(layoutElement, config, layoutsData);
 * // Returns: "default:100vw;540:(max-width: 380px) 33.33vw, min(33.33vw, 213px);720:(max-width: 380px) 50vw, min(50vw, 512px),(max-width: 380px) 50vw, min(50vw, 512px),(max-width: 380px) 100vw, min(100vw, 1024px)"
 * 
 * // Get srcset for a specific child element
 * const childSrcset = getSrcset(layoutElement, 0); // First child
 * // Returns: "(min-width: 720px) (max-width: 380px) 50vw, min(50vw, 512px), (min-width: 540px) (max-width: 380px) 33.33vw, min(33.33vw, 213px), 100vw"
 */

/**
 * Generates srcsets attribute for lay-out elements with constraint-aware sizing
 * @param {Element|string} element - DOM element or lay-out element string
 * @param {Object} config - Loaded config.json object
 * @param {Map} layoutsData - Map of layout type -> layout objects array
 * @returns {string} Formatted srcsets string (e.g., "default:100vw;540:33.33%;720:50%,50%,100%")
 */
export function generateLayoutSrcsets(element, config, layoutsData) {
  const breakpoints = parseBreakpointsFromElement(element);
  
  if (!breakpoints || Object.keys(breakpoints).length === 0) {
    return 'default:100vw';
  }
  
  const srcsetParts = ['default:100vw']; // Mobile-first fallback
  
  for (const [breakpointName, layoutPattern] of Object.entries(breakpoints)) {
    const srcset = getSrcsetForPattern(layoutPattern, layoutsData, element, config);
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
 * @param {Object} [config] - Optional config for constraint-aware generation
 * @returns {string} CSS srcset string (e.g., "(min-width: 720px) 33.33vw, (min-width: 540px) 50vw, 100vw")
 */
export function getSrcset(layoutElementOrSrcsets, childIndex, config = null) {
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
      // Apply constraint-aware processing if config provided and width contains %
      const processedWidth = (config && width.includes('%')) 
        ? generateConstrainedSizes([width], layoutElementOrSrcsets, config)[0]
        : width;
      cssRules.push(`${rule.mediaQuery} ${processedWidth}`);
    }
  }
  
  // Add default rule (no media query, comes last)
  const defaultRule = rules.find(rule => rule.pixelKey === 'default');
  if (defaultRule) {
    const defaultWidth = getWidthForChild(defaultRule.widths, childIndex);
    if (defaultWidth) {
      // Apply constraint-aware processing if config provided and width contains %
      const processedWidth = (config && defaultWidth.includes('%')) 
        ? generateConstrainedSizes([defaultWidth], layoutElementOrSrcsets, config)[0]
        : defaultWidth;
      cssRules.push(processedWidth);
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
 * Gets srcset string for a specific layout pattern with constraint-aware conversion
 * @param {string} pattern - Layout pattern like "grid(3a)" or "columns(3)"
 * @param {Map} layoutsData - Map of layout data
 * @param {Element|string} element - Layout element for constraint detection
 * @param {Object} config - Config object
 * @returns {string|null} Constraint-aware srcset string or null if not found
 */
function getSrcsetForPattern(pattern, layoutsData, element, config) {
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

  const rawSrcset = layout.srcset;
  if (!rawSrcset) return null;

  // Return the raw srcset - constraint processing will happen in getSrcset()
  return rawSrcset;
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

/**
 * Generates constraint-aware sizes from percentage values
 * @param {Array} percentages - Array of percentage strings like ["50%", "50%", "100%"]
 * @param {Element|string} element - Layout element for constraint detection
 * @param {Object} config - Config object
 * @returns {Array} Array of constraint-aware size strings
 */
function generateConstrainedSizes(percentages, element, config) {
  const constraints = getLayoutConstraints(element, config);
  
  return percentages.map(percentage => {
    const percent = parseFloat(percentage);
    
    if (!constraints.hasMaxWidth) {
      // No constraints: direct percentage to vw conversion
      return `${percent}vw`;
    }

    // Generate complex sizes attribute for constrained layouts
    return generateComplexSizes(percent, constraints, config);
  });
}

/**
 * Extracts layout constraints from element attributes and config
 * @param {Element|string} element - Layout element
 * @param {Object} config - Config object
 * @returns {Object} Constraints object
 */
function getLayoutConstraints(element, config) {
  const layoutConfig = config.systems?.[0]?.layoutContainer;
  if (!layoutConfig) return { hasMaxWidth: false };

  const constraints = {
    hasMaxWidth: false,
    maxWidth: null,
    widthToken: null,
    globalMaxWidth: layoutConfig.maxLayoutWidth?.value,
    layoutMargin: layoutConfig.layoutMargin?.value,
    hasBleed: false
  };

  // Check for bleed attribute
  if (element.hasAttribute && element.hasAttribute('bleed')) {
    constraints.hasBleed = true;
  }

  // Check for width attribute - this overrides global constraint
  if (element.hasAttribute && element.hasAttribute('width')) {
    constraints.hasMaxWidth = true;
    constraints.widthToken = element.getAttribute('width');
    constraints.maxWidth = layoutConfig.widthTokens?.[constraints.widthToken]?.value;
  }
  // If config has maxLayoutWidth, use it as global default constraint
  else if (constraints.globalMaxWidth) {
    constraints.hasMaxWidth = true;
    constraints.maxWidth = constraints.globalMaxWidth;
  }
  
  return constraints;
}

/**
 * Generates complex sizes attribute for constrained layouts
 * @param {number} percentage - Percentage value (e.g., 50 for 50%)
 * @param {Object} constraints - Constraints object
 * @param {Object} config - Config object  
 * @returns {string} Complex sizes string
 */
function generateComplexSizes(percentage, constraints, config) {
  // Use existing breakpoints from config
  const breakpoints = config.systems?.[0]?.breakpoints;
  if (!breakpoints) return `${percentage}vw`;

  const maxWidthValue = parseFloat(constraints.maxWidth);
  const constrainedWidth = Math.round(maxWidthValue * (percentage / 100));

  // For constrained layouts, return the min() function
  // The media query wrapping will be handled by getSrcset()
  return `min(${percentage}vw, ${constrainedWidth}px)`;
}

/**
 * Applies CSS custom properties from config to the specified root element
 * @param {Object} config - Config object
 * @param {Document} [doc=document] - Document object (for testing)
 * @returns {boolean} True if properties were applied, false if no root element specified
 */
export function applyCSSDefaults(config, doc = document) {
  const layoutConfig = config.systems?.[0]?.layoutContainer;
  if (!layoutConfig?.layoutRootElement) {
    return false; // No root element specified, don't apply properties
  }

  const rootElement = doc.querySelector(layoutConfig.layoutRootElement);
  if (!rootElement) {
    console.warn(`Layout root element "${layoutConfig.layoutRootElement}" not found`);
    return false;
  }

  // Apply max layout width
  if (layoutConfig.maxLayoutWidth) {
    rootElement.style.setProperty(
      layoutConfig.maxLayoutWidth.cssProperty,
      layoutConfig.maxLayoutWidth.value
    );
  }
  
  // Apply layout margin
  if (layoutConfig.layoutMargin) {
    rootElement.style.setProperty(
      layoutConfig.layoutMargin.cssProperty, 
      layoutConfig.layoutMargin.value
    );
  }
  
  // Apply width tokens
  if (layoutConfig.widthTokens) {
    Object.entries(layoutConfig.widthTokens).forEach(([token, tokenConfig]) => {
      rootElement.style.setProperty(tokenConfig.cssProperty, tokenConfig.value);
    });
  }

  return true;
}