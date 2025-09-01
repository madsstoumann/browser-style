/**
 * Layout Srcsets Generator
 * 
 * Utilities for generating responsive srcsets attributes for lay-out web components
 * with constraint-aware sizing based on layout configurations.
 */

export function generateLayoutSrcsets(element, config, layoutsData) {
  const breakpoints = parseBreakpointsFromElement(element);
  
  if (!breakpoints || Object.keys(breakpoints).length === 0) {
    return 'default:100vw';
  }
  
  const srcsetParts = ['default:100vw'];
  
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

export function getSrcset(layoutElementOrSrcsets, childIndex, config = null) {
  let srcsets;
  
  if (typeof layoutElementOrSrcsets === 'string') {
    const match = layoutElementOrSrcsets.match(/srcsets="([^"]+)"/);
    if (match) {
      srcsets = match[1];
    } else {
      srcsets = layoutElementOrSrcsets;
    }
  } else if (layoutElementOrSrcsets?.getAttribute) {
    srcsets = layoutElementOrSrcsets.getAttribute('srcsets');
  }
  
  if (!srcsets) return '100vw';
  
  const rules = parseSrcsetRules(srcsets);
  const cssRules = [];
  
  const sortedRules = rules
    .filter(rule => rule.pixelKey !== 'default')
    .sort((a, b) => {
      const aMin = parseInt(a.pixelKey.split('-')[0]);
      const bMin = parseInt(b.pixelKey.split('-')[0]);
      return bMin - aMin;
    });
  
  for (const rule of sortedRules) {
    const width = getWidthForChild(rule.widths, childIndex);
    if (width) {
      const processedWidth = (config && width.includes('%')) 
        ? generateConstrainedSizes([width], layoutElementOrSrcsets, config)[0]
        : width;
      cssRules.push(`${rule.mediaQuery} ${processedWidth}`);
    }
  }
  
  const defaultRule = rules.find(rule => rule.pixelKey === 'default');
  if (defaultRule) {
    const defaultWidth = getWidthForChild(defaultRule.widths, childIndex);
    if (defaultWidth) {
      const processedWidth = (config && defaultWidth.includes('%')) 
        ? generateConstrainedSizes([defaultWidth], layoutElementOrSrcsets, config)[0]
        : defaultWidth;
      cssRules.push(processedWidth);
    }
  }
  
  return cssRules.join(', ') || '100vw';
}

function parseBreakpointsFromElement(element) {
  let elementString;
  
  if (typeof element === 'string') {
    elementString = element;
  } else if (element?.outerHTML) {
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

function getSrcsetForPattern(pattern, layoutsData) {
  const match = pattern.match(/(\w+)\(([^)]+)\)/);
  if (!match) return null;
  
  const [, layoutType, layoutId] = match;
  
  let layouts = layoutsData.get(layoutType);
  if (!layouts) {
    layouts = layoutsData.get(layoutType + 's');
  }
  if (!layouts) {
    for (const [, value] of layoutsData.entries()) {
      if (Array.isArray(value) && value.length > 0 && value[0].id?.startsWith(layoutType + '(')) {
        layouts = value;
        break;
      }
    }
  }
  
  if (!layouts) return null;
  
  const layout = layouts.find(l => l.originalId === layoutId || l.id === `${layoutType}(${layoutId})`);
  return layout?.srcset || null;
}

function getPixelKeyForBreakpoint(breakpointName, config) {
  let breakpointConfig = null;
  
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
  
  if (min && max) return `${min}-${max}`;
  if (min) return `${min}`;
  if (max) return `0-${max}`;
  
  return null;
}

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

function parseSrcsetRules(srcsets) {
  return srcsets.split(';').map(rule => {
    const [pixelKey, widthsString] = rule.split(':');
    const widths = widthsString.split(',').map(w => w.trim());
    
    let mediaQuery = null;
    if (pixelKey !== 'default') {
      if (pixelKey.includes('-')) {
        const [min, max] = pixelKey.split('-');
        mediaQuery = `(min-width: ${min}px) and (max-width: ${max}px)`;
      } else {
        mediaQuery = `(min-width: ${pixelKey}px)`;
      }
    }
    
    return { pixelKey, mediaQuery, widths };
  });
}

function getWidthForChild(widths, childIndex) {
  if (widths.length === 1) return widths[0];
  if (childIndex < widths.length) return widths[childIndex];
  return widths[widths.length - 1];
}

function generateConstrainedSizes(percentages, element, config) {
  const constraints = getLayoutConstraints(element, config);
  
  return percentages.map(percentage => {
    const percent = parseFloat(percentage);
    
    if (!constraints.hasMaxWidth) {
      return `${percent}vw`;
    }

    return generateComplexSizes(percent, constraints, config);
  });
}

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

  if (element.hasAttribute && element.hasAttribute('bleed')) {
    constraints.hasBleed = true;
  }

  if (element.hasAttribute && element.hasAttribute('width')) {
    constraints.hasMaxWidth = true;
    constraints.widthToken = element.getAttribute('width');
    constraints.maxWidth = layoutConfig.widthTokens?.[constraints.widthToken]?.value;
  } else if (constraints.globalMaxWidth) {
    constraints.hasMaxWidth = true;
    constraints.maxWidth = constraints.globalMaxWidth;
  }
  
  return constraints;
}

function generateComplexSizes(percentage, constraints, config) {
  const breakpoints = config.systems?.[0]?.breakpoints;
  if (!breakpoints) return `${percentage}vw`;

  // If maxWidth contains viewport units, treat as unconstrained
  if (constraints.maxWidth && constraints.maxWidth.includes('vw')) {
    return `${percentage}vw`;
  }

  const maxWidthValue = parseFloat(constraints.maxWidth);
  const constrainedWidth = Math.round(maxWidthValue * (percentage / 100));

  return `min(${percentage}vw, ${constrainedWidth}px)`;
}

export function applyCSSDefaults(config, doc = document) {
  const layoutConfig = config.systems?.[0]?.layoutContainer;
  if (!layoutConfig?.layoutRootElement) return false;

  const rootElement = doc.querySelector(layoutConfig.layoutRootElement);
  if (!rootElement) {
    console.warn(`Layout root element "${layoutConfig.layoutRootElement}" not found`);
    return false;
  }

  if (layoutConfig.maxLayoutWidth) {
    rootElement.style.setProperty(
      layoutConfig.maxLayoutWidth.cssProperty,
      layoutConfig.maxLayoutWidth.value
    );
  }
  
  if (layoutConfig.layoutMargin) {
    rootElement.style.setProperty(
      layoutConfig.layoutMargin.cssProperty, 
      layoutConfig.layoutMargin.value
    );
  }
  
  if (layoutConfig.widthTokens) {
    Object.entries(layoutConfig.widthTokens).forEach(([, tokenConfig]) => {
      rootElement.style.setProperty(tokenConfig.cssProperty, tokenConfig.value);
    });
  }

  return true;
}