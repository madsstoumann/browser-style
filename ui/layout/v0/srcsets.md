# Responsive Srcsets Implementation Plan

## Overview

This document outlines the implementation plan for converting layout srcsets from `vw` units to percentage-based values that intelligently generate responsive `sizes` attributes based on layout constraints.

## Current System Analysis

### Layout JSON Structure
Currently, layout files contain srcsets like:
```json
{
  "srcset": "50vw,50vw,100vw"
}
```

### CSS Constraint System
The layout system has multiple width constraint mechanisms:

1. **`--layout-bleed-mw`**: Global maximum width constraint (set on `body/:host`)
2. **`width` attribute**: Layout-specific width constraints (`xs`, `sm`, `md`, `lg`, `xl`, `xxl`)
3. **`max-width` attribute**: Direct max-width specification
4. **`bleed` attribute**: Full-width behavior that respects `--layout-bleed-mw`

### Key CSS Properties
- `max-inline-size: var(--layout-mw)` - Base max-width (line 33)
- `&[width]:not([bleed]) { max-inline-size: var(--_mi); }` - Width-constrained layouts (line 130)
- `--_mi: var(--layout-width-md, 48rem)` - Width token mapping (lines 131-136)
- `--layout-bleed-mw` - Global width constraint for bleed layouts (line 62)

## Implementation Plan

### Phase 1: Update Layout JSON Files

**Convert all srcset values from `vw` to `%`:**

```json
// Before
{
  "srcset": "50vw,50vw,100vw"
}

// After  
{
  "srcset": "50%,50%,100%"
}
```

### Phase 2: Enhance Configuration

**Add to existing `config.json` systems array:**

```json
{
  "systems": [{
    // ... existing layout system config ...
    "layoutContainer": {
      "maxLayoutWidth": {
        "value": "1200px",
        "cssProperty": "--layout-bleed-mw"
      },
      "layoutMargin": {
        "value": "1rem", 
        "cssProperty": "--layout-mi"
      },
      "widthTokens": {
        "xs": { "value": "20rem", "cssProperty": "--layout-width-xs" },
        "sm": { "value": "30rem", "cssProperty": "--layout-width-sm" },
        "md": { "value": "48rem", "cssProperty": "--layout-width-md" },
        "lg": { "value": "64rem", "cssProperty": "--layout-width-lg" },
        "xl": { "value": "80rem", "cssProperty": "--layout-width-xl" },
        "xxl": { "value": "96rem", "cssProperty": "--layout-width-xxl" }
      }
    }
  }]
}
```

### Phase 3: Enhanced Srcset Generation Logic

**Update `index.js` with constraint-aware generation:**

```javascript
function generateConstrainedSizes(percentages, layoutElement, config) {
  const constraints = getLayoutConstraints(layoutElement, config);
  
  if (!constraints.hasMaxWidth) {
    // No constraints: direct percentage to vw conversion
    return percentages.map(p => p.replace('%', 'vw'));
  }

  // Generate complex sizes attribute
  return percentages.map(percentage => {
    const percent = parseFloat(percentage);
    return generateComplexSizes(percent, constraints, config);
  });
}

function getLayoutConstraints(element, config) {
  const layoutConfig = config.systems[0].layoutContainer;
  const constraints = {
    hasMaxWidth: false,
    maxWidth: null,
    widthToken: null,
    globalMaxWidth: layoutConfig?.maxLayoutWidth?.value,
    layoutMargin: layoutConfig?.layoutMargin?.value,
    hasBleed: false
  };

  // Check for bleed attribute
  if (element.hasAttribute && element.hasAttribute('bleed')) {
    constraints.hasBleed = true;
  }

  // Check for width attribute - this is our main constraint mechanism
  if (element.hasAttribute && element.hasAttribute('width')) {
    constraints.hasMaxWidth = true;
    constraints.widthToken = element.getAttribute('width');
    constraints.maxWidth = layoutConfig.widthTokens[constraints.widthToken]?.value;
  }

  // For bleed layouts without width token, use global constraint
  if (constraints.hasBleed && !constraints.hasMaxWidth && constraints.globalMaxWidth) {
    constraints.hasMaxWidth = true;
    constraints.maxWidth = constraints.globalMaxWidth;
  }
  
  return constraints;
}

function generateComplexSizes(percentage, constraints, config) {
  // Use existing breakpoints from config
  const breakpoints = config.systems[0].breakpoints;
  const maxWidth = parseFloat(constraints.maxWidth);
  
  let sizes = [];
  
  // Mobile-first: use vw on small screens
  const smBreakpoint = breakpoints.sm?.min || '380px';
  sizes.push(`(max-width: ${smBreakpoint}) ${percentage}vw`);
  
  // Tablet and up: use min() with constraint
  if (constraints.hasMaxWidth) {
    const constrainedWidth = maxWidth * (percentage / 100);
    sizes.push(`min(${percentage}vw, ${constrainedWidth}px)`);
  } else {
    sizes.push(`${percentage}vw`);
  }
  
  return sizes.join(', ');
}
```

### Phase 4: Integration Points

**Update `getSrcsetForPattern()` in `index.js:158`:**

```javascript
function getSrcsetForPattern(pattern, layoutsData, layoutElement, config) {
  // ... existing pattern matching logic ...
  
  if (!layout) {
    return null;
  }

  const rawSrcset = layout.srcset;
  
  // Convert percentage-based srcsets to constraint-aware sizes
  if (rawSrcset && rawSrcset.includes('%')) {
    const percentages = rawSrcset.split(',').map(s => s.trim());
    return generateConstrainedSizes(percentages, layoutElement, config).join(',');
  }

  return rawSrcset;
}
```

**Update `generateLayoutSrcsets()` in `index.js:37`:**

```javascript
export function generateLayoutSrcsets(element, config, layoutsData) {
  const breakpoints = parseBreakpointsFromElement(element);
  
  if (!breakpoints || Object.keys(breakpoints).length === 0) {
    return 'default:100vw';
  }
  
  const srcsetParts = ['default:100vw'];
  
  for (const [breakpointName, layoutPattern] of Object.entries(breakpoints)) {
    // Pass element to getSrcsetForPattern for constraint detection
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
```

## Implementation Priority

### High Priority
1. **Phase 1**: Update all layout JSON files to use percentages
2. **Phase 3**: Implement basic constraint-aware generation
3. **Phase 4**: Integrate with existing srcset generation pipeline

### Medium Priority  
1. **Phase 2**: Enhanced configuration options
2. Runtime detection of `--layout-bleed-mw` from CSS

### Low Priority
1. Advanced constraint combinations
2. Custom constraint types
3. Performance optimizations

## Example Output

**Before (current):**
```html
<img sizes="(min-width: 720px) 33.33vw, (min-width: 540px) 50vw, 100vw" />
```

**After (with simplified constraints):**
```html
<!-- Layout with width="lg" (64rem max) -->
<img sizes="(max-width: 380px) 100vw, 
             (max-width: 720px) min(50vw, 512px), 
             min(33.33vw, 341px)" />

<!-- Layout with bleed and global 1200px constraint -->
<img sizes="(max-width: 380px) 100vw,
             (max-width: 720px) min(50vw, 600px),
             min(33.33vw, 400px)" />

<!-- Layout without constraints -->
<img sizes="(min-width: 720px) 33.33vw, (min-width: 540px) 50vw, 100vw" />
```

## Benefits

1. **Semantic clarity**: Layout definitions use percentage-based thinking
2. **Responsive optimization**: Images size correctly within constrained containers  
3. **Backwards compatibility**: Unconstrained layouts work as before
4. **Performance**: Better image loading decisions by browsers
5. **Maintainability**: Centralized constraint logic

## Server-Side Rendering Considerations

1. **Config-driven constraints**: All layout constraints defined in config with CSS property mapping
2. **Render-time calculation**: All constraint data available without DOM access
3. **Layout attribute parsing**: SSR can read `width`, `max-width`, `bleed` from element markup
4. **CSS/Config sync**: Config includes CSS property names for runtime application
5. **Demo generation**: Default values can be applied when rendering demo files

### CSS Property Application
```javascript
// Apply config values to CSS at runtime
function applyCSSDefaults(config) {
  const layoutConfig = config.systems[0].layoutContainer;
  
  document.documentElement.style.setProperty(
    layoutConfig.maxLayoutWidth.cssProperty,
    layoutConfig.maxLayoutWidth.value
  );
  
  document.documentElement.style.setProperty(
    layoutConfig.layoutMargin.cssProperty, 
    layoutConfig.layoutMargin.value
  );
  
  // Apply width tokens
  Object.entries(layoutConfig.widthTokens).forEach(([token, config]) => {
    document.documentElement.style.setProperty(config.cssProperty, config.value);
  });
}
```

## Simplified Constraint System

To avoid complexity, we'll focus on just two constraint mechanisms:

1. **`width` attribute** - Width token from config (xs, sm, md, lg, xl, xxl)
2. **`bleed` behavior** - Uses global `maxLayoutWidth` from config
3. **No constraints** - Falls back to vw units

```html
<!-- Simplified examples -->
<lay-out width="lg">                          <!-- lg (64rem) constraint -->
<lay-out width="md" bleed>                    <!-- md + global maxLayoutWidth -->
<lay-out bleed>                               <!-- Global maxLayoutWidth only -->
<lay-out>                                     <!-- No constraints, use vw -->
```

**Note**: `max-width` attribute is ignored in srcset calculations for simplicity, though it remains in CSS for other uses.

## Implementation Considerations

1. **Element detection**: Reliable constraint detection from layout attributes
2. **Config synchronization**: Ensure CSS and config values match for SSR
3. **Constraint priority**: Respect CSS cascade order (max-width > width > global)
4. **Fallback strategy**: Graceful degradation for unsupported scenarios  
5. **Testing**: Comprehensive testing across constraint combinations and SSR scenarios