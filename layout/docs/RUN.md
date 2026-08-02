# Terminal Commands Reference

All commands you can run from the terminal in the `@browser.style/layout` package.

---

## Quick Reference

```bash
npm run build         # Build CSS
npm run build:maps    # Generate layouts-map.js
npm run build:demo    # Generate HTML demos
npm run build:icons   # Generate SVG icons
npm run build:all     # Build everything
npm test              # Test package exports
```

---

## Build Commands

### Build CSS

```bash
npm run build
```

**What it does:**
- Reads `layout.config.json` and layout JSON files
- Generates `dist/layout.css` (~33 KB)
- Includes only layouts specified in breakpoints

**Direct execution:**
```bash
node build.js
```

**With custom config:**
```bash
node build.js --config path/to/custom.config.json
```

**With custom output:**
```bash
node build.js --output path/to/custom.css
```

---

### Build Layouts Map

```bash
npm run build:maps
```

**Output:** `layouts-map.js` (~7 KB)

**What it includes:**
```javascript
export const srcsetMap = {
  "columns(2)": "50%",
  "grid(3a)": "50%,50%,100%",
  // ... all 57 layouts
}

export const srcsetConfig = {
  "maxLayoutWidth": 1024,
  "breakpoints": {
    "xs": 240,
    "sm": 380,
    "md": 540,
    "lg": 720,
    "xl": 920,
    "xxl": 1140
  }
}
```

**When to regenerate:**
- After adding/modifying layout JSON files
- After changing `layoutContainer.maxWidth` in config
- After changing breakpoints in config

---

### Build Demo Files

```bash
npm run build:demo
```

**Output:** 22 HTML files + 70 SVG icons (the script logs `23` — see the `stack.html` note below)

The step has **two halves**. Only the first is generated from JSON; the second copies
hand-authored pages. **Never edit `dist/*.html` — it is overwritten on every run.**

**Generated from `layouts/*.json`:**
- `dist/asymmetrical.html`
- `dist/autofit.html`
- `dist/bento.html`
- `dist/columns.html`
- `dist/grid.html`
- `dist/lanes.html`
- `dist/mosaic.html`
- `dist/ratios.html`
- `dist/stack.html` *(immediately overwritten by the copy step below)*
- `dist/overflow.html` (from `layouts/columns.json`, gated on its `overflowIcons` block;
  markup lives in `generateOverflowHTML()` in `src/demo.js`)
- `dist/icons.html` (icon gallery)
- `dist/index.html` (main index — built from the set of files this run produced, so a new
  `src/pages/*.html` self-links)
- `dist/icons/*.svg` (70 icon files)

**Copied verbatim from `src/pages/` (edit these, not `dist/`):**
`animate.html` · `animate-self.html` · `bleed.html` · `carousel.html` · `gapdeco.html` ·
`reveal.html` · `reveal-stack.html` · `scroll-test.html` · `spacing.html` · `stack.html` ·
`widths.html`

The copy applies one rewrite: `/ui/layout/` → `/layout/`.

> **Note on the count.** `stack.html` has two producers — `layouts/stack.json` generates it,
> then `src/pages/stack.html` overwrites it (the copy runs later, so the hand-authored page
> wins). The script's `demoCount` counts both, which is why it logs `23` for 22 distinct
> files. `dist/` also holds two untracked orphans (`morph-stack.html`, `section.html`) that
> no build step produces.

---

### Build Icons

```bash
npm run build:icons
```

**Output:** 63 SVG files in `dist/icons/`

---

### Build Everything

```bash
npm run build:all
```

**Runs in sequence:**
1. `npm run build:maps` → Generate layouts-map.js
2. `npm run build` → Generate CSS
3. `npm run build:demo` → Generate demos
4. `npm run build:icons` → Generate icons

---

## Programmatic Usage

### Build CSS from JavaScript

```javascript
import { LayoutBuilder } from './src/builder.js'

const builder = new LayoutBuilder(
  './layout.config.json',
  './layouts',
  './dist/layout.css'
)

await builder.build()
```

### Using buildLayout Function

```javascript
import { buildLayout } from './build.js'

const result = await buildLayout({
  configPath: './layout.config.json',
  layoutsPath: './layouts',
  outputPath: './dist/layout.css'
})

console.log(result.css)     // Generated CSS string
console.log(result.config)  // Parsed configuration
```

### Generate Demo Files

```javascript
import { buildDemoFiles } from './src/demo.js'

buildDemoFiles('./layouts', './dist')
```

### Generate Icons Only

```javascript
import { buildIcons } from './src/icons.js'

buildIcons('./layouts', './dist/icons')
```

### Generate Layouts Map

```javascript
import { generateLayoutsMap } from './src/maps.js'

generateLayoutsMap()
```

---

## Package Scripts

### Install Dependencies
```bash
npm install
```

### Test Package
```bash
npm test
```

### Clean Build
```bash
rm -rf dist && npm run build:all
```

---

## Development Workflow

### Typical Development Cycle

```bash
# 1. Clean build
rm -rf dist

# 2. Build everything
npm run build:all

# 3. Check output
ls -lh dist/
```

### Quick Test Build

```bash
npm run build:all && npm test
```

---

## Build Tool Integration

### Vite

```javascript
// vite.config.js
import { buildLayout } from '@browser.style/layout/build'

export default {
  plugins: [{
    name: 'layout-css',
    async buildStart() {
      await buildLayout({
        configPath: './layout.config.json',
        outputPath: './src/styles/layout.css'
      })
    }
  }]
}
```

### Next.js

```javascript
// next.config.js
import { buildLayout } from '@browser.style/layout/build'

await buildLayout({
  configPath: './layout.config.json',
  outputPath: './styles/layout.css'
})

export default {
  // ... your Next.js config
}
```

---

## Package Installation

### Install from npm

```bash
npm install @browser.style/layout
```

### Install Locally for Testing

```bash
# From package directory
npm link

# In another project
npm link @browser.style/layout
```

### Use in Project

#### Import CSS
```javascript
import '@browser.style/layout/dist/layout.css'
```

#### Import Layouts Map
```javascript
import { srcsetMap, srcsetConfig } from '@browser.style/layout/maps'
```

---

## Troubleshooting

### Build Fails

**Check Node.js version:**
```bash
node --version  # Requires Node.js 16+
```

**Verify config file exists:**
```bash
cat layout.config.json
```

**Check layouts directory:**
```bash
ls -la layouts/
```

### CSS Size Too Large

Optimize your `layout.config.json` breakpoints:
```json
{
  "breakpoints": {
    "lg": {
      "layouts": [
        { "grid": ["grid(3a)", "grid(3c)"] }
      ]
    }
  }
}
```

**Tips:**
- Only include layouts you actually use
- Use object syntax for specific variants
- Remove unused breakpoints

---

## Performance Notes

### Build Times

| Command | Time |
|---------|------|
| `npm run build` | ~500ms |
| `npm run build:maps` | ~100ms |
| `npm run build:demo` | ~1-2s |
| `npm run build:icons` | ~200ms |
| **`npm run build:all`** | **~3s** |

### Output Sizes

| File | Size |
|------|------|
| `dist/layout.css` | ~33 KB |
| `dist/layout.css` (gzipped) | ~12 KB |
| `layouts-map.js` | ~7 KB |
| All demo HTML | ~100 KB |
| All icons SVG | ~50 KB |

---

## CI/CD Integration

### GitHub Actions Example

```yaml
name: Build and Test

on: [push, pull_request]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm install
      - run: npm run build:all
      - run: npm test
```

---

## Next Steps

- See [BUILD.md](BUILD.md) for build system documentation
- See [README.md](../README.md) for usage examples
- See layout JSON files in `layouts/` for structure reference
