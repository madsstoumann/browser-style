# Build System Documentation

**@browser.style/layout**

This document explains how the layout system generates CSS, layouts map, demos, and icons.

---

## Overview

The layout system uses **build-time generation** for all assets:
- CSS is never generated at runtime
- All files are pre-built and shipped with the npm package
- Consumers can use pre-built files OR generate custom builds

---

## Build Commands

### Available Scripts

```bash
npm run build       # Build CSS only
npm run build:maps  # Generate layouts-map.js
npm run build:demo  # Generate HTML demo files
npm run build:icons # Generate SVG icons
npm run build:all   # Build everything
```

### What Each Command Does

#### `npm run build`
Generates CSS from `layout.config.json`:
- Input: `layout.config.json`, `layouts/*.json`, `core/*.css`
- Output: `dist/layout.css` (~33 KB)
- Includes only layouts specified in breakpoints

#### `npm run build:maps`
Generates JavaScript srcset map:
- Input: `layouts/*.json`, `layout.config.json`
- Output: `layouts-map.js` (~7 KB)
- Contains srcset data for all 57 layouts + config

#### `npm run build:demo`
Generates HTML demonstration files:
- Input: `layouts/*.json`
- Output: 9 HTML files in `dist/` + 63 SVG icons in `dist/icons/`
- Showcases all layout patterns with visual examples

#### `npm run build:icons`
Generates SVG icon files:
- Input: `layouts/*.json` (icon data)
- Output: 63 SVG files in `dist/icons/`
- One icon per layout variant

#### `npm run build:all`
Runs all build commands in sequence:
1. Generates layouts-map.js
2. Generates CSS
3. Generates demo HTML files
4. Generates icon SVGs

This command runs automatically before `npm publish` via `prepublishOnly`.

---

## Configuration File

### layout.config.json

The configuration file controls what gets built:

```json
{
  "fileName": "layout.css",
  "element": "lay-out",
  "layer": "layout",

  "core": ["base"],
  "common": ["animations"],

  "layoutContainer": {
    "maxLayoutWidth": {
      "value": 1024,
      "cssProperty": "--layout-bleed-mw"
    }
  },

  "breakpoints": {
    "md": {
      "type": "@media",
      "min": "540px",
      "layouts": ["columns"]
    },
    "lg": {
      "type": "@media",
      "min": "720px",
      "layouts": [
        "columns",
        { "grid": ["grid(3a)", "grid(3c)"] }
      ]
    }
  }
}
```

### Key Configuration Options

#### `maxLayoutWidth.value`
- **Type:** `number`
- **Purpose:** Maximum container width for responsive image calculations
- **Example:** `1024` means 1024 pixels
- **Used in:** Srcset calculations for `sizes` attribute

#### `breakpoints`
Each breakpoint specifies:
- `min`: Minimum viewport width (e.g., "720px")
- `type`: Either `@media` or `@container`
- `layouts`: Array of layout types to include

**Layout inclusion syntax:**
```json
// String = ALL variants
"layouts": ["columns"]  // Includes columns(1) through columns(6)

// Object = SPECIFIC variants only
"layouts": [
  { "grid": ["grid(3a)", "grid(3c)"] }  // Only these two
]
```

This keeps CSS bundles small by only including what you need.

---

## Usage in Projects

### Option 1: Zero-Config (Recommended)

**Best for:** 90% of users who want to use default layouts

```bash
npm install @browser.style/layout
```

```html
<!-- Import pre-built CSS -->
<link rel="stylesheet" href="node_modules/@browser.style/layout/dist/layout.css">

<!-- Use immediately -->
<lay-out md="columns(2)" lg="grid(4a)">
  <div>Item 1</div>
  <div>Item 2</div>
</lay-out>
```

**What you get:**
- Pre-built CSS with all default layouts (~33 KB)
- Pre-built layouts-map.js with srcset data
- No configuration needed
- Works immediately

### Option 2: Custom Build

**Best for:** Projects needing custom breakpoints or selective layouts

#### Step 1: Create your config

Create `layout.config.json` at the root of your project:

```json
{
  "breakpoints": {
    "md": {
      "type": "@media",
      "min": "768px",
      "layouts": ["columns"]
    }
  }
}
```

#### Step 2: Build CSS

```bash
# Direct build
node build.js

# With custom config path
node build.js --config path/to/config.json

# With custom output path
node build.js --output dist/custom.css
```

**What happens:**
- Reads your `layout.config.json`
- Uses layouts from package
- Generates `dist/layout.css` (only includes specified layouts)

#### Step 3: Use your custom CSS

```html
<link rel="stylesheet" href="dist/layout.css">
```

Or in your JavaScript:
```javascript
import './dist/layout.css'
```

### Option 3: Custom Layouts

**Best for:** Projects with unique layout patterns

#### Step 1: Create custom layout JSON

```json
// layouts/hero.json
{
  "name": "Hero Layouts",
  "prefix": "hero",
  "layouts": [{
    "id": "1",
    "columns": "2fr 1fr",
    "srcset": "66.67%,33.33%",
    "items": 2,
    "icon": [
      { "w": 66.67, "h": 100, "x": 0, "y": 0 },
      { "w": 33.33, "h": 100, "x": 66.67, "y": 0 }
    ],
    "rules": []
  }]
}
```

#### Step 2: Reference in config

```json
{
  "breakpoints": {
    "lg": {
      "layouts": [
        { "hero": ["hero(1)"] }
      ]
    }
  }
}
```

#### Step 3: Rebuild

```bash
npm run build:all
```

---

## CLI Usage

### Command Line Arguments

```bash
# Basic build
node build.js

# Custom config path
node build.js --config path/to/config.json

# Custom output path
node build.js --output path/to/custom.css

# Combined options
node build.js --config custom.json --output dist/custom.css
```

### How Config Discovery Works

**Priority order:**
1. `--config` flag - If specified, uses that path
2. Project directory - Checks for `layout.config.json` in `process.cwd()`
3. Package directory - Falls back to package's default config

**Layout sources:**
- If you have a `layouts/` folder next to your config, it uses that
- Otherwise, it uses layouts from the package

**Output location:**
- If config is in your project, outputs to `./dist/layout.css`
- Can be overridden with `--output` flag

### Programmatic API

```javascript
import { buildLayout } from '@browser.style/layout/build'

const result = await buildLayout({
  configPath: './layout.config.json',
  layoutsPath: './layouts',
  outputPath: './dist/layout.css'
})

console.log(result.css)     // Generated CSS
console.log(result.config)  // Parsed config
```

---

## How It Works

### 1. Configuration Loading
Reads `layout.config.json` and validates structure.

### 2. Layout File Discovery
Loads all JSON files from `layouts/`:
- asymmetrical.json (6 layouts)
- autofit.json (2 layouts)
- bento.json (10 layouts)
- columns.json (6 layouts)
- grid.json (19 layouts)
- mosaic.json (5 layouts)
- ratios.json (9 layouts)

**Total: 57 layout variants**

### 3. Per-Breakpoint Processing
For each breakpoint:
1. Extract `layouts` array
2. For string entries: Load ALL variants of that type
3. For object entries: Load ONLY specified variants
4. Generate CSS for each included variant

### 4. CSS Generation
Generates attribute selectors for each layout:

```css
@media (min-width: 720px) {
  lay-out[lg="columns(2)"] {
    --layout-gtc: 1fr 1fr;
  }

  lay-out[lg="grid(3a)"] {
    --layout-gtc: 1fr 1fr;
  }

  lay-out[lg="grid(3a)"] > *:nth-child(3n+3) {
    --layout-ga: auto / span 2;
  }
}
```

### 5. Layouts Map Generation
Creates JavaScript module with srcset data:

```javascript
export const srcsetMap = {
  "columns(2)": "50%",
  "grid(3a)": "50%,50%,100%",
  // ... all 57 layouts
}

export const layoutConfig = {
  "maxLayoutWidth": 1024,
  "breakpoints": {
    "md": 540,
    "lg": 720,
    // ...
  }
}
```

---

## Performance

### CSS Bundle Sizes

| Configuration | Size | Gzipped |
|--------------|------|---------|
| Minimal (columns only, 2 breakpoints) | ~8 KB | ~3 KB |
| Default (all layouts, 6 breakpoints) | ~33 KB | ~12 KB |
| Full (all variants, all breakpoints) | ~110 KB | ~35 KB |

### Build Times

- Configuration loading: < 10ms
- Layout file parsing: ~50ms
- CSS generation: ~100-500ms
- **Total: < 1 second**

### Runtime Performance

- ✅ Zero runtime cost (all CSS is static)
- ✅ No JavaScript required for layouts
- ✅ Fully cacheable CSS
- ✅ No layout shift (grid-based)

---

## Troubleshooting

### "Cannot find layout.config.json"

**Solution:** Create `layout.config.json` or specify path:
```bash
node build.js --config path/to/config.json
```

### "Layout not appearing"

**Check:**
1. Is layout included in breakpoint's `layouts` array?
2. Is variant name correct? Use `grid(3a)` not `grid-3a`
3. Did you import the generated CSS?

### "Bundle size too large"

**Solutions:**
1. Use object syntax to include only specific variants
2. Remove unused breakpoints
3. Remove unused layout types

---

## Publishing Workflow

### What Happens on `npm publish`

The `prepublishOnly` script runs automatically:

```bash
npm run build:all && npm test
```

This ensures the package includes:
1. ✅ layouts-map.js (generated)
2. ✅ dist/layout.css (generated)
3. ✅ dist/*.html (demo files)
4. ✅ dist/icons/*.svg (icon files)
5. ✅ Source files (src/, layouts/, core/)

### Files Included in Package

From `package.json` files array:
- `index.js` - Main entry point
- `build.js` - Build script
- `layout.config.json` - Default config
- `layouts-map.js` - Generated srcset map
- `core/` - Base CSS modules
- `layouts/` - Layout JSON definitions
- `src/` - Source JavaScript modules
- `dist/layout.css` - Generated CSS
- `README.md`, `LICENSE`

---

## Next Steps

- See [RUN.md](RUN.md) for detailed command reference
- See [README.md](../README.md) for usage examples
- See layout JSON files in `layouts/` for structure reference
