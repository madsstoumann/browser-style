# Build System Documentation

**@browser.style/layout v2.0**

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
npm run build          # Build CSS only
npm run build:watch    # Build CSS in watch mode
npm run build:maps     # Generate layouts-map.js
npm run build:demo     # Generate HTML demo files
npm run build:icons    # Generate SVG icons
npm run build:all      # Build everything (maps → CSS → demos → icons)
```

### What Each Command Does

#### `npm run build`
Generates CSS from `layout.config.json`:
- Input: `layout.config.json`, `layouts/*.json`, `core/*.css`
- Output: `dist/layout.css` (~33 KB unminified)
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
  },

  "themes": {
    "primary": {
      "bg": "#f0f0f0",
      "color": "#333"
    }
  }
}
```

### Key Configuration Options

#### `maxLayoutWidth.value`
- **Type:** `number` (not string!)
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
      "layouts": ["columns"]  // Only columns, exclude others
    }
  }
}
```

#### Step 2: Build CSS

The CLI automatically finds `layout.config.json` in your project directory!

**Option A - Using npx (one command):**
```bash
npx browser-style-layout build
```

**Option B - Add npm script (recommended):**
```json
// package.json
{
  "scripts": {
    "build:layout": "browser-style-layout build"
  }
}
```

Then run:
```bash
npm run build:layout
```

**What happens:**
- ✅ CLI finds `layout.config.json` in your project root automatically
- ✅ Uses layouts from `node_modules/@browser.style/layout/layouts/`
- ✅ Generates `dist/layout.css` in your project directory
- ✅ CSS includes only layouts you specified (smaller bundle!)

**Custom output location:**
```bash
npx browser-style-layout build --output src/styles/layout.css
```

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

### How Config Discovery Works

The CLI is smart about finding your configuration:

**Priority order:**
1. **`--config` flag** - If you specify a path, it uses that
2. **Project directory** - Checks for `layout.config.json` in `process.cwd()`
3. **Package directory** - Falls back to the package's default config

**Example:**
```bash
# CLI automatically finds ./layout.config.json
npx browser-style-layout build
# Output: ✓ Found layout.config.json in project directory
# Output: ✓ Generated: ./dist/layout.css
```

**Layout sources:**
- If you have a `layouts/` folder next to your config, it uses that
- Otherwise, it uses layouts from `node_modules/@browser.style/layout/layouts/`

**Output location:**
- If config is in your project, outputs to `./dist/layout.css`
- Can be overridden with `--output` flag

### Direct Build Commands

```bash
# Simple build (auto-finds config in your project)
npx browser-style-layout build

# Build with custom config path
npx browser-style-layout build --config path/to/layout.config.json

# Build to custom output
npx browser-style-layout build --output path/to/custom.css

# Build minified
npx browser-style-layout build --minify

# Watch mode
npx browser-style-layout build --watch

# Combined options
npx browser-style-layout build --config custom.json --output dist/layout.css --minify
```

### Recommended Workflow

Add to your `package.json`:

```json
{
  "scripts": {
    "build:layout": "browser-style-layout build",
    "build:layout:watch": "browser-style-layout build --watch",
    "build:layout:prod": "browser-style-layout build --minify"
  }
}
```

Then use:
```bash
npm run build:layout        # Development build
npm run build:layout:watch  # Watch mode
npm run build:layout:prod   # Production build
```

### Programmatic API

```javascript
import { buildLayout } from '@browser.style/layout/build'

const result = await buildLayout({
  configPath: './layout.config.json',
  layoutsPath: './layouts',
  outputPath: './dist/layout.css',
  minify: false
})

console.log(result.css)      // Generated CSS
console.log(result.layouts)  // Layout data
console.log(result.config)   // Parsed config
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
- `src/` - Source JavaScript (builder, demo, icons, maps)
- `dist/layout.css` - Generated CSS
- `README.md`, `LICENSE`

---

## Next Steps

- See [run.md](run.md) for detailed command reference
- See [README.md](../README.md) for usage examples
- See layout JSON files in `layouts/` for structure reference
