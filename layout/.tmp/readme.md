# Layout Srcsets Generator

This module provides utilities for generating responsive `srcsets` attributes for `lay-out` web components based on layout configurations.

## Features

- ✅ **Self-contained**: No file system dependencies
- ✅ **Flexible input**: Accepts both DOM elements and HTML strings
- ✅ **Pixel-based output**: Generates media query-ready pixel values
- ✅ **Range support**: Handles min-width, max-width, and ranges (e.g., `540-920`)

## Installation

### From npm

```bash
npm install @browser.style/layout
```

```javascript
// Import the srcsets utilities
import { generateLayoutSrcsets, getSrcset, createLayoutsDataMap } from '@browser.style/layout';

// Or import specific functions
import { getSrcset } from '@browser.style/layout/srcsets';

// Import CSS (optional)
import '@browser.style/layout/css';
```

### Local Development

```javascript
import { generateLayoutSrcsets, getSrcset, createLayoutsDataMap } from './layout/index.js';
```

## Usage

### Basic Example

```javascript
// Load configuration and layout data
const config = await fetch('config.json').then(r => r.json());
const gridData = await fetch('systems/layouts/grid.json').then(r => r.json());
const columnsData = await fetch('systems/layouts/columns.json').then(r => r.json());

// Create layouts data map
const layoutsData = createLayoutsDataMap({
  'grid.json': gridData,
  'columns.json': columnsData
});

// Generate srcsets for an element
const element = document.querySelector('lay-out');
const srcsets = generateLayoutSrcsets(element, config, layoutsData);

// Apply to element
element.setAttribute('srcsets', srcsets);
```

### String Input Example

```javascript
const elementString = '<lay-out md="grid(3a)" lg="columns(3)">';
const srcsets = generateLayoutSrcsets(elementString, config, layoutsData);
// Returns: "default:100vw;540:50vw,50vw,100vw;720:33.33vw"
```

### Child Component Srcset Generation

```javascript
// Get CSS srcset for specific child elements
const layoutElement = document.querySelector('lay-out');

// Generate srcsets for different children
const firstChildSrcset = getSrcset(layoutElement, 0);  // First child
const secondChildSrcset = getSrcset(layoutElement, 1); // Second child

// Apply to image elements
document.querySelector('img:nth-child(1)').setAttribute('sizes', firstChildSrcset);
document.querySelector('img:nth-child(2)').setAttribute('sizes', secondChildSrcset);
```

### Complete Example

```javascript
// 1. Load layout configuration
const config = await fetch('config.json').then(r => r.json());
const layoutFiles = {
  'grid.json': await fetch('systems/layouts/grid.json').then(r => r.json()),
  'columns.json': await fetch('systems/layouts/columns.json').then(r => r.json())
};
const layoutsData = createLayoutsDataMap(layoutFiles);

// 2. Generate and apply srcsets to layout element
const layoutElement = document.querySelector('lay-out');
const srcsets = generateLayoutSrcsets(layoutElement, config, layoutsData);
layoutElement.setAttribute('srcsets', srcsets);

// 3. Generate individual srcsets for child images
const images = layoutElement.querySelectorAll('img');
images.forEach((img, index) => {
  const imgSizes = getSrcset(layoutElement, index);
  img.setAttribute('sizes', imgSizes);
});

// Example output:
// Layout srcsets: "default:100vw;540:50vw,50vw,100vw;720:33.33vw"
// Child 0 sizes: "(min-width: 720px) 33.33vw, (min-width: 540px) 50vw, 100vw"
// Child 1 sizes: "(min-width: 720px) 33.33vw, (min-width: 540px) 50vw, 100vw"
// Child 2 sizes: "(min-width: 720px) 33.33vw, (min-width: 540px) 100vw, 100vw"
```

## Output Format

The generated srcsets use a pixel-based format that child components can easily parse:

- **`default:100vw`** - Mobile-first fallback (no media query)
- **`540:50vw`** - `min-width: 540px` (simple number for min-width only)
- **`540-920:50vw`** - `min-width: 540px AND max-width: 920px` (range format)

## Child Component Usage

Child components can parse the srcsets attribute to generate proper media queries:

```javascript
function parseSrcsets(srcsets) {
  const rules = srcsets.split(';');
  return rules.map(rule => {
    const [key, value] = rule.split(':');
    
    if (key === 'default') {
      return { value, mediaQuery: null }; // No media query
    }
    
    if (key.includes('-')) {
      // Range: "540-920" -> "(min-width: 540px) and (max-width: 920px)"
      const [min, max] = key.split('-');
      return { 
        value, 
        mediaQuery: `(min-width: ${min}px) and (max-width: ${max}px)` 
      };
    } else {
      // Min-width only: "540" -> "(min-width: 540px)"
      return { 
        value, 
        mediaQuery: `(min-width: ${key}px)` 
      };
    }
  });
}
```

## API Reference

### `generateLayoutSrcsets(element, config, layoutsData)`

Generates srcsets attribute for lay-out elements.

**Parameters:**
- `element` (Element|string) - DOM element or lay-out element string
- `config` (Object) - Loaded config.json object
- `layoutsData` (Map) - Map of layout type → layout objects array

**Returns:**
- `string` - Formatted srcsets string

### `getSrcset(layoutElement, childIndex)`

Generates CSS srcset string for a specific child element within a lay-out.

**Parameters:**
- `layoutElement` (Element|string) - Layout DOM element or element string with srcsets attribute
- `childIndex` (number) - Zero-based index of the child element

**Returns:**
- `string` - CSS srcset string ready for img elements (e.g., "(min-width: 720px) 33.33vw, (min-width: 540px) 50vw, 100vw")

**Example:**
```javascript
const layoutEl = document.querySelector('lay-out[srcsets]');
const imgSrcset = getSrcset(layoutEl, 0); // First child
// Returns: "(min-width: 720px) 33.33vw, (min-width: 540px) 50vw, 100vw"
```

## NPM Package Structure

The package provides multiple export paths for different use cases:

```javascript
// Main exports (srcsets utilities)
import { generateLayoutSrcsets, getSrcset, createLayoutsDataMap } from '@browser.style/layout';

// CSS imports
import '@browser.style/layout/css';           // Full CSS
import '@browser.style/layout/css/min';       // Minified CSS

// Configuration and layout data
import config from '@browser.style/layout/config';
import gridLayouts from '@browser.style/layout/systems/layouts/grid.json';

// Build system
import builder from '@browser.style/layout/builder';
```

### `createLayoutsDataMap(layoutFiles)`

Helper function to create layoutsData Map from JSON files.

**Parameters:**
- `layoutFiles` (Object) - Object where keys are filenames and values are loaded JSON data

**Returns:**
- `Map` - Map suitable for use with generateLayoutSrcsets

## Integration with Build System

This module works alongside the existing build system in `build.js`. The build system automatically generates srcsets during the build process, while this module provides runtime generation for dynamic scenarios.