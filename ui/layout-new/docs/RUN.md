# Terminal Commands Reference

All commands you can run from the terminal in the `@browser.style/layout` package.

---

## Quick Reference

```bash
npm run build         # Build CSS only
npm run build:watch   # Build CSS in watch mode
npm run build:maps    # Generate layouts-map.js
npm run build:demo    # Generate HTML demos
npm run build:icons   # Generate SVG icons
npm run build:all     # Build everything
npm test              # Test package exports
```

---

## Build Commands

### Build CSS

#### Development Build
```bash
npm run build
```
or
```bash
node build.js
```

**Output:** `dist/layout.css` (unminified, ~33 KB)

**What it does:**
- Reads `layout.config.json`
- Loads layout JSON files from `layouts/`
- Generates CSS with attribute selectors
- Writes to `dist/layout.css`

#### Production Build
```bash
node build.js --minify
```

**Output:** `dist/layout.css` (minified, ~15 KB)

#### Watch Mode
```bash
npm run build:watch
```
or
```bash
node build.js --watch
```

**What it does:**
- Watches `layout.config.json` and `layouts/*.json`
- Automatically rebuilds on changes
- Useful during development

#### Custom Config Path
```bash
node build.js --config path/to/custom.config.json
```

Use a different configuration file.

#### Custom Output Path
```bash
node build.js --output path/to/custom.css
```

Write CSS to a custom location.

#### Combined Options
```bash
node build.js --config custom.config.json --output dist/custom.css --minify
```

All options can be combined.

---

### Build Layouts Map

#### Generate layouts-map.js
```bash
npm run build:maps
```
or
```bash
node src/maps.js
```

**Output:** `layouts-map.js` (~7 KB)

**What it includes:**
```javascript
export const srcsetMap = {
  "columns(2)": "50%",
  "grid(3a)": "50%,50%,100%",
  // ... all 57 layouts
}

export const layoutConfig = {
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
- After changing `maxLayoutWidth` in config
- After changing breakpoints in config

---

### Build Demo Files

#### Generate HTML Demos
```bash
npm run build:demo
```

**Output:** 9 HTML files + 63 SVG icons

**Generated files:**
- `dist/asymmetrical.html`
- `dist/autofit.html`
- `dist/bento.html`
- `dist/columns.html`
- `dist/grid.html`
- `dist/mosaic.html`
- `dist/ratios.html`
- `dist/icons.html` (icon gallery)
- `dist/index.html` (main index)
- `dist/icons/*.svg` (63 icon files)

**What it does:**
- Reads all layout JSON files
- Generates HTML demonstrations for each layout type
- Creates SVG icons from icon data
- Builds index page with links to all demos

---

### Build Icons

#### Generate SVG Icons
```bash
npm run build:icons
```

**Output:** 63 SVG files in `dist/icons/`

**Generated icons:**
- One icon per layout variant
- Named by layout pattern (e.g., `grid-3a.svg`)
- Used in demo files and documentation

**Icon format:**
```svg
<svg viewBox="0 0 100 100">
  <rect width="48" height="48" x="0" y="0" rx="4"/>
  <text x="20" y="26">1</text>
  <rect width="48" height="48" x="50" y="0" rx="4"/>
  <text x="70" y="26">2</text>
</svg>
```

---

### Build Everything

#### Complete Build
```bash
npm run build:all
```

**Runs in sequence:**
1. `npm run build:maps` → Generate layouts-map.js
2. `npm run build` → Generate CSS
3. `npm run build:demo` → Generate demos
4. `npm run build:icons` → Generate icons

**Total outputs:**
- `layouts-map.js` (srcset data)
- `dist/layout.css` (CSS bundle)
- 9 HTML demo files
- 63 SVG icon files

**When to use:**
- Before publishing to npm
- After making changes to layout files
- To regenerate all build artifacts

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

// Development build
await builder.build(false)

// Production build (minified)
await builder.build(true)
```

### Using buildLayout Function

```javascript
import { buildLayout } from './build.js'

const result = await buildLayout({
  configPath: './layout.config.json',
  layoutsPath: './layouts',
  outputPath: './dist/layout.css',
  minify: false
})

console.log(result.css)      // Generated CSS string
console.log(result.layouts)  // Map of layouts
console.log(result.config)   // Parsed configuration
```

### Generate Demo Files

```javascript
import { buildDemoFiles } from './src/demo.js'

buildDemoFiles('./layouts', './dist')
```

**Generates:**
- All HTML demo files
- Icon gallery (icons.html)
- Main index (index.html)
- All SVG icons in dist/icons/

### Generate Icons Only

```javascript
import { buildIcons } from './src/icons.js'

buildIcons('./layouts', './dist/icons')
```

**Generates:** 63 SVG icon files

### Generate Layouts Map

```javascript
import { generateLayoutsMap } from './src/maps.js'

generateLayoutsMap()
```

**Generates:** `layouts-map.js` with srcset data

---

## Package Scripts

### Install Dependencies
```bash
npm install
```

Installs all development dependencies.

### Test Package
```bash
npm test
```

Verifies that package exports are working correctly.

### Clean Build
```bash
rm -rf dist && npm run build:all
```

Remove existing dist folder and perform fresh build.

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

### Watch Mode Development

```bash
# Terminal 1: Start watch mode
npm run build:watch

# Terminal 2: Edit files
# Changes to layout.config.json or layouts/*.json trigger rebuild
```

### Quick Test Build

```bash
npm run build:all && npm test
```

Builds everything and verifies package integrity.

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

// Run before Next.js starts
await buildLayout({
  configPath: './layout.config.json',
  outputPath: './styles/layout.css'
})

export default {
  // ... your Next.js config
}
```

### Webpack

```javascript
// webpack.config.js
import { buildLayout } from '@browser.style/layout/build'

export default {
  plugins: [
    {
      apply: (compiler) => {
        compiler.hooks.beforeCompile.tapPromise('LayoutCSS', async () => {
          await buildLayout({
            configPath: './layout.config.json',
            outputPath: './src/styles/layout.css'
          })
        })
      }
    }
  ]
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
// Import pre-built CSS
import '@browser.style/layout/dist/layout.css'
```

#### Import Layouts Map
```javascript
// Import srcset data
import { srcsetMap, layoutConfig } from '@browser.style/layout/maps'
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

Check your `layout.config.json` breakpoints:
```json
{
  "breakpoints": {
    "lg": {
      "layouts": [
        // Use object syntax for specific variants only
        { "grid": ["grid(3a)", "grid(3c)"] }
      ]
    }
  }
}
```

**Optimization tips:**
- Only include layouts you actually use
- Use object syntax to include specific variants only
- Remove unused breakpoints
- Consider code-splitting for different pages

### Icons Not Generating

**Verify layout JSON files have icon data:**
```bash
cat layouts/columns.json | grep -A5 '"icon"'
```

**Manually trigger icon generation:**
```bash
npm run build:icons
```

### Demos Not Working

**Check that CSS is built:**
```bash
ls -lh dist/layout.css
```

**Rebuild everything:**
```bash
npm run build:all
```

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
| `dist/layout.css` (unminified) | ~33 KB |
| `dist/layout.css` (minified) | ~15 KB |
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

### Pre-commit Hook

```json
// package.json
{
  "scripts": {
    "precommit": "npm run build:all && npm test"
  }
}
```

Or use husky:
```bash
npx husky add .husky/pre-commit "npm run build:all"
```

---

## Advanced Usage

### Custom Layouts Workflow

```bash
# 1. Create custom layout
echo '{
  "name": "Custom Layouts",
  "prefix": "custom",
  "layouts": [{
    "id": "1",
    "columns": "2fr 1fr",
    "srcset": "66.67%,33.33%",
    "items": 2,
    "icon": [
      {"w": 66.67, "h": 100, "x": 0, "y": 0},
      {"w": 33.33, "h": 100, "x": 66.67, "y": 0}
    ]
  }]
}' > layouts/custom.json

# 2. Add to config
# Edit layout.config.json to include custom layouts

# 3. Rebuild everything
npm run build:all

# 4. Verify it's included
grep "custom" layouts-map.js
grep "custom" dist/layout.css
```

### Testing Specific Layouts

```bash
# Check available layouts
node -e "import('./layouts-map.js').then(m => console.log(Object.keys(m.srcsetMap)))"

# Check specific layout srcset
node -e "import('./layouts-map.js').then(m => console.log(m.srcsetMap['grid(3c)']))"

# Check configuration
node -e "import('./layouts-map.js').then(m => console.log(m.layoutConfig))"
```

---

## Next Steps

- See [build.md](build.md) for build system documentation
- See [README.md](../README.md) for usage examples
- See layout JSON files in `layouts/` for structure reference
