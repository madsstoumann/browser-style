# Terminal Commands

All commands you can run from the terminal in the `@browser.style/layout` package.

## Build Commands

### Build CSS (Development)
```bash
node build.js
```
Generates unminified CSS to `dist/layout.css` for development and debugging.

### Build CSS (Production)
```bash
node build.js --minify
```
Generates minified CSS to `dist/layout.css` for production use.

### Watch Mode
```bash
node build.js --watch
```
Watches for changes to `layout.config` and `layouts/*.json` files and automatically rebuilds CSS.

### Custom Config
```bash
node build.js --config path/to/layout.config
```
Build CSS using a custom config file location.

### Custom Output
```bash
node build.js --output path/to/output.css
```
Build CSS to a custom output location.

### Combined Options
```bash
node build.js --config custom.config --output dist/custom.css --minify
```
All options can be combined as needed.

## Package Scripts

### Install Dependencies
```bash
npm install
```
Installs all development dependencies.

### Build CSS via npm
```bash
npm run build
```
Runs the default build command (defined in package.json).

### Clean Build
```bash
rm -rf dist && node build.js
```
Remove existing dist folder and perform fresh build.

## Demo Generation

### Generate Demo Files (Node.js)
```javascript
import { buildDemoFiles } from './src/demofiles.js'

buildDemoFiles('./layouts', './dist')
```

This generates:
- All HTML demo files (asymmetrical.html, autofit.html, etc.)
- Icon gallery (icons.html)
- Main index (index.html)
- All SVG icons in dist/icons/

### Generate Icons Only (Node.js)
```javascript
import { buildIcons } from './src/icons.js'

buildIcons('./layouts', './dist/icons')
```

## Programmatic Usage

### Build CSS from JavaScript
```javascript
import { LayoutBuilder } from './src/builder.js'

const builder = new LayoutBuilder(
  './layout.config',
  './layouts',
  './dist/layout.css'
)

// Development build
await builder.build(false)

// Production build
await builder.buildAll()
```

### Work with Presets
```javascript
import { createPreset, presetToHTML, validatePreset } from './src/preset.js'

// Create a preset
const preset = createPreset({
  id: 'hero',
  name: 'Hero Section',
  breakpoints: {
    md: 'columns(1)',
    lg: 'grid(3a)'
  },
  spaceTop: 3,
  spaceBottom: 3
})

// Convert to HTML
const html = presetToHTML(preset)
// <lay-out md="columns(1)" lg="grid(3a)" space-top="3" space-bottom="3">

// Validate
const result = validatePreset(preset)
if (!result.valid) {
  console.error(result.errors)
}
```

### Auto-generate Srcsets (Node.js)
```javascript
import { autoGenerateSrcsets } from './src/srcset.js'
import { readConfig } from './src/preset.js'

const config = await readConfig('./layout.config')
const preset = { /* your preset */ }

const srcsets = autoGenerateSrcsets(preset, config)
// { default: "100vw", 540: "50vw", 720: "33.33vw" }
```

### Generate Layouts Map
```bash
npm run generate:layouts-map
```

Generates `layouts-map.js` containing:
- Srcset data for all layouts
- Configuration (breakpoints, maxLayoutWidth)
- Helper functions for browser usage

**When to run:**
- After adding custom layout JSON files
- After modifying srcset values in layouts
- After changing maxLayoutWidth in config
- Automatically runs during `npm run prepublishOnly`

## Testing & Verification

### Check Output Size
```bash
ls -lh dist/layout.css
```
View generated CSS file size.

### Compare with Original
```bash
diff dist/layout.css ../layout/dist/layout.css
```
Compare new CSS with original (from ui/layout).

### View Build Stats
The build command outputs:
- Number of breakpoints processed
- Layouts included per breakpoint
- Final CSS file size
- Build time

## Development Workflow

### Typical Development Cycle
```bash
# 1. Clean build
rm -rf dist

# 2. Build CSS
node build.js

# 3. Generate demos (optional)
node -e "import('./src/demofiles.js').then(m => m.buildDemoFiles('./layouts', './dist'))"

# 4. Check output
ls -lh dist/
```

### Watch Mode Development
```bash
# Start watch mode
node build.js --watch

# In another terminal, edit files
# Build automatically triggers on save
```

### Quick Test Build
```bash
# Single command: clean, build, check
rm -rf dist && node build.js && ls -lh dist/layout.css
```

## Package Installation

### Install from npm (when published)
```bash
npm install @browser.style/layout
```

### Install Locally for Testing
```bash
# From this directory
npm link

# In another project
npm link @browser.style/layout
```

### Use in Project
```javascript
// Import CSS in your entry file
import '@browser.style/layout/css'

// Or use preset utilities
import { createPreset, presetToHTML } from '@browser.style/layout/preset'
```

## CLI Tool (when installed globally)

### Install CLI
```bash
npm install -g @browser.style/layout
```

### Run from Anywhere
```bash
browser-style-layout --config my-project/layout.config --output dist/layout.css
```

## Troubleshooting

### Build Fails
```bash
# Check Node.js version (requires Node.js 16+)
node --version

# Verify config file exists
cat layout.config

# Check layouts directory
ls -la layouts/
```

### CSS Size Too Large
Check your `layout.config` breakpoints:
- Use object syntax for specific variants: `{"grid": ["grid(3a)"]}`
- Remove unused layout types from breakpoints
- Consider splitting into multiple builds for different pages

### Icons Not Generating
```bash
# Verify layout JSON files have icon data
cat layouts/columns.json | grep -A5 '"icon"'

# Manually trigger icon generation
node -e "import('./src/icons.js').then(m => m.buildIcons('./layouts', './dist/icons'))"
```

---

## Responsive Images with Srcsets

**New in v2.0**: Advanced srcset utilities for responsive images with child-position awareness.

### Overview

The layout system provides automatic srcset generation for responsive images. Each layout knows how wide its children are at each breakpoint, enabling precise `sizes` attributes for `<img>` and Next.js `<Image>` components.

### Browser Usage (React)

#### Simple Usage - All Children Same Size

```javascript
import { Layout } from '@browser.style/layout/react'
import Image from 'next/image'

// Simple srcsets (all children same size)
const sizes = Layout.getSizes("default:100vw;720:50%")
// → "(min-width: 720px) min(50vw, 512px), 100vw"

<Layout lg="columns(2)">
  <Image src="/photo1.jpg" sizes={sizes} />
  <Image src="/photo2.jpg" sizes={sizes} />
</Layout>
```

#### Advanced Usage - Per-Child Sizes

```javascript
import { Layout } from '@browser.style/layout/react'

// Different sizes for each child
const srcsets = "default:100vw;720:66.67%,33.33%,33.33%"

// Child 0 gets 66.67% at lg breakpoint
const sizes0 = Layout.getSizesForChild(srcsets, 0)
// → "(min-width: 720px) min(66.67vw, 683px), 100vw"

// Child 1 gets 33.33% at lg breakpoint
const sizes1 = Layout.getSizesForChild(srcsets, 1)
// → "(min-width: 720px) min(33.33vw, 341px), 100vw"

<Layout lg="grid(3c)">
  <Image src="/photo1.jpg" sizes={sizes0} />
  <Image src="/photo2.jpg" sizes={sizes1} />
  <Image src="/photo3.jpg" sizes={sizes1} />
</Layout>
```

#### Auto-Generate from Layout Patterns

```javascript
import { Layout } from '@browser.style/layout/react'

// Auto-generate srcsets from breakpoint definitions
const breakpoints = { md: 'columns(2)', lg: 'grid(3c)' }

// Automatically looks up srcsets from layouts-map.js
const sizes0 = Layout.autoGenerateSizes(breakpoints, 0)
// → "(min-width: 720px) min(66.67vw, 683px), (min-width: 540px) min(50vw, 512px), 100vw"

const sizes1 = Layout.autoGenerateSizes(breakpoints, 1)
// → "(min-width: 720px) min(33.33vw, 341px), (min-width: 540px) min(50vw, 512px), 100vw"

<Layout md="columns(2)" lg="grid(3c)">
  <Image src="/photo1.jpg" sizes={sizes0} />
  <Image src="/photo2.jpg" sizes={sizes1} />
</Layout>
```

### How It Works

1. **Layout JSON** defines srcset for each layout:
   ```json
   {
     "id": "3c",
     "srcset": "66.67%,33.33%,33.33%"
   }
   ```

2. **Layouts Map** is generated containing all srcset data:
   ```javascript
   layoutsMap["grid(3c)"] = { srcset: "66.67%,33.33%,33.33%" }
   ```

3. **buildSrcsets()** merges breakpoints:
   ```javascript
   buildSrcsets({ md: 'columns(2)', lg: 'grid(3c)' })
   // → "default:100vw;540:50%;720:66.67%,33.33%,33.33%"
   ```

4. **getSizesForChild()** extracts child-specific width:
   ```javascript
   getSizesForChild(srcsets, 0)  // Gets first value: 66.67%
   getSizesForChild(srcsets, 1)  // Gets second value: 33.33%
   ```

5. **Constraint calculation** with maxLayoutWidth (1024px):
   ```javascript
   // 66.67% of 1024px = 683px
   "min(66.67vw, 683px)"

   // 33.33% of 1024px = 341px
   "min(33.33vw, 341px)"
   ```

### Srcset Format

#### String Format
```javascript
"default:100vw;540:50%;720:66.67%,33.33%,33.33%"
//       ↑        ↑          ↑
//    mobile   tablet   desktop (per-child)
```

#### Object Format
```javascript
{
  default: '100vw',
  540: '50%',                      // All children same
  720: '66.67%,33.33%,33.33%'      // Per-child
}
```

### API Reference

#### Layout.getSizes(srcsets)
Simple conversion (all children same size):
```javascript
Layout.getSizes("default:100vw;720:50%")
// → "(min-width: 720px) min(50vw, 512px), 100vw"
```

#### Layout.getSizesForChild(srcsets, childIndex, options)
Child-position aware conversion:
```javascript
Layout.getSizesForChild("default:100vw;720:66.67%,33.33%", 0)
// → "(min-width: 720px) min(66.67vw, 683px), 100vw"

Layout.getSizesForChild("default:100vw;720:66.67%,33.33%", 1, {
  maxLayoutWidth: '1200px'  // Override default
})
// → "(min-width: 720px) min(33.33vw, 400px), 100vw"
```

#### Layout.buildSrcsets(breakpoints)
Auto-generate srcsets from layout patterns:
```javascript
Layout.buildSrcsets({ md: 'columns(2)', lg: 'grid(3c)' })
// → "default:100vw;540:50%;720:66.67%,33.33%,33.33%"
```

#### Layout.autoGenerateSizes(breakpoints, childIndex, options)
Complete auto-generation:
```javascript
Layout.autoGenerateSizes({ md: 'columns(2)', lg: 'grid(3c)' }, 0)
// → "(min-width: 720px) min(66.67vw, 683px), (min-width: 540px) min(50vw, 512px), 100vw"
```

### Examples

#### Bento Layout with 6 Images
```javascript
<Layout lg="bento(6a)">
  {[0, 1, 2, 3, 4, 5].map(index => (
    <Image
      key={index}
      src={`/photo${index}.jpg`}
      sizes={Layout.autoGenerateSizes({ lg: 'bento(6a)' }, index)}
    />
  ))}
</Layout>

// Each image gets different sizes:
// Child 0: min(30vw, 307px)
// Child 1: min(40vw, 410px)
// Child 2: min(30vw, 307px)
// etc.
```

#### Multi-Breakpoint Hero
```javascript
const heroBreakpoints = {
  sm: 'columns(1)',
  md: 'columns(2)',
  lg: 'grid(3c)'
}

<Layout {...heroBreakpoints}>
  <Image
    src="/hero.jpg"
    sizes={Layout.autoGenerateSizes(heroBreakpoints, 0)}
  />
  {/* Sizes: "(min-width: 720px) min(66.67vw, 683px), (min-width: 540px) min(50vw, 512px), 100vw" */}
</Layout>
```

### Testing Srcsets

```bash
# Check what srcsets are available
node -e "import('./layouts-map.js').then(m => console.log(Object.keys(m.layoutsMap)))"

# Check specific layout srcset
node -e "import('./layouts-map.js').then(m => console.log(m.layoutsMap['grid(3c)']))"

# Test size calculation
node -e "
import { getSizesForChild } from './src/components/react/srcset-advanced.js';
console.log(getSizesForChild('default:100vw;720:66.67%,33.33%', 0));
"
```

### Custom Layouts with Srcsets

When creating custom layouts, always include srcset data:

```json
{
  "name": "Custom Layouts",
  "prefix": "custom",
  "layouts": [{
    "id": "hero",
    "columns": "3fr 1fr",
    "srcset": "75%,25%",
    "items": 2,
    "breakpoints": {
      "lg": "custom(hero)"
    }
  }]
}
```

Then regenerate the layouts map:
```bash
npm run generate:layouts-map
```

Now use in your app:
```javascript
Layout.autoGenerateSizes({ lg: 'custom(hero)' }, 0)
// → Automatically uses your custom srcset
```
