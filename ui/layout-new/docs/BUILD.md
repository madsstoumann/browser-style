# Build System Documentation

**@browser.style/layout v2.0**

This document explains how the layout system generates CSS and how it works in client projects.

---

## How CSS Generation Works

The layout system uses **build-time CSS generation**. CSS is never generated at runtime - it's always pre-built static files.

### Build Process

1. **Load Configuration**: Read `layout.config` file
2. **Load Layout Definitions**: Load JSON files from `/layouts` folder
3. **Process Breakpoints**: For each breakpoint, process only specified layouts
4. **Generate CSS**: Create CSS rules with attribute selectors
5. **Output**: Write to `dist/layout.css`

### Per-Breakpoint Filtering

The system only generates CSS for layouts explicitly specified in each breakpoint:

**String syntax** = ALL variants:
```json
"md": {
  "layouts": ["columns"]  // Generates columns(1) through columns(6)
}
```

**Object syntax** = ONLY specific variants:
```json
"md": {
  "layouts": [
    { "grid": ["grid(3a)"] }  // Only generates grid(3a)
  ]
}
```

This keeps CSS bundles small by only including what you need.

---

## Usage in Client Projects

### Option 1: Zero-Config (Pre-generated CSS)

**Best for**: Most projects using default layouts

#### Installation
```bash
npm install @browser.style/layout
```

#### Usage in React
```jsx
import '@browser.style/layout/dist/layout.css'
import { Layout } from '@browser.style/layout'

function App() {
  return (
    <Layout md="columns(2)" lg="bento(4a)" spaceTop={2}>
      <Card />
      <Card />
    </Layout>
  )
}
```

#### Usage in Vanilla JS / Svelte / Vue
```html
<script type="module">
  import '@browser.style/layout/dist/layout.css'
</script>

<lay-out md="columns(2)" lg="bento(4a)" space-top="2">
  <div>Item 1</div>
  <div>Item 2</div>
</lay-out>
```

**What happens:**
- CSS is already pre-generated and shipped with the npm package
- Includes default breakpoints (xs, sm, md, lg, xl, xxl)
- Includes layouts as specified in default `layout.config`
- No build step required
- Just import and use

**Bundle size**: ~33 KB (unminified), ~12-15 KB (minified + gzipped)

---

### Option 2: Custom Configuration

**Best for**: Projects needing custom breakpoints, selective layouts, or different defaults

#### Step 1: Create Configuration

Create `layout.config` in your project root:

```json
{
  "fileName": "layout.css",
  "element": "lay-out",

  "core": ["base"],
  "common": [],

  "breakpoints": {
    "sm": {
      "type": "@media",
      "min": "640px",
      "max": null,
      "layouts": ["columns"]
    },
    "lg": {
      "type": "@media",
      "min": "1024px",
      "max": null,
      "layouts": ["columns", "grid", "bento"]
    }
  },

  "themes": {
    "brand": {
      "bg": "#ff6b6b",
      "color": "#ffffff"
    }
  }
}
```

#### Step 2: Generate CSS

**Option A - CLI Command:**

Add to `package.json`:
```json
{
  "scripts": {
    "build:layout": "browser-style-layout build --output ./src/styles/layout.css",
    "prebuild": "npm run build:layout"
  }
}
```

Run:
```bash
npm run build:layout
```

**Option B - Programmatic (in build tool):**

For Vite:
```js
// vite.config.js
import { buildLayout } from '@browser.style/layout/build'

export default {
  plugins: [{
    name: 'layout-css',
    async buildStart() {
      await buildLayout({
        configPath: './layout.config',
        outputPath: './src/styles/layout.css'
      })
    }
  }]
}
```

For Next.js:
```js
// next.config.js
import { buildLayout } from '@browser.style/layout/build'

// Run once at build start
await buildLayout({
  configPath: './layout.config',
  outputPath: './styles/layout.css'
})

export default {
  // ... your Next.js config
}
```

For Webpack:
```js
// webpack.config.js
import { buildLayout } from '@browser.style/layout/build'

export default {
  plugins: [
    {
      apply: (compiler) => {
        compiler.hooks.beforeCompile.tapPromise('LayoutCSS', async () => {
          await buildLayout({
            configPath: './layout.config',
            outputPath: './src/styles/layout.css'
          })
        })
      }
    }
  ]
}
```

#### Step 3: Import Generated CSS

```jsx
import './styles/layout.css' // Your custom CSS
import { Layout } from '@browser.style/layout'
```

---

### Option 3: Custom Layouts

**Best for**: Projects with unique layout patterns not covered by defaults

#### Step 1: Create Custom Layout JSON

Create a layout file (e.g., `layouts/custom-hero.json`):

```json
{
  "name": "Custom Hero Layouts",
  "prefix": "hero",
  "desc": "Custom hero layouts for landing pages",
  "layouts": [
    {
      "id": "1",
      "description": "Two-column hero with 2:1 ratio",
      "columns": "2fr 1fr",
      "rows": "auto",
      "items": 2,
      "icon": [
        { "w": 66.67, "h": 100, "x": 0, "y": 0 },
        { "w": 33.33, "h": 100, "x": 66.67, "y": 0 }
      ],
      "repeatable": true,
      "srcset": "66.67%,33.33%",
      "breakpoints": {
        "lg": "hero(1)"
      },
      "rules": []
    }
  ]
}
```

#### Step 2: Reference in layout.config

```json
{
  "breakpoints": {
    "lg": {
      "type": "@media",
      "min": "1024px",
      "layouts": [
        "columns",
        { "hero": ["hero(1)"] }
      ]
    }
  }
}
```

Note: The system automatically loads all `.json` files from the `/layouts` folder when installed from npm. For custom layouts in your project, you can place them anywhere and reference them.

#### Step 3: Build CSS

Same as Option 2 - run your build command.

#### Step 4: Use Your Custom Layout

```jsx
<Layout lg="hero(1)" spaceTop={4}>
  <MainContent />
  <Sidebar />
</Layout>
```

---

## Build API Reference

### buildLayout(options)

Programmatically build layout CSS.

```typescript
import { buildLayout } from '@browser.style/layout/build'

const result = await buildLayout({
  configPath: './layout.config',    // Path to config file
  layoutsPath: './layouts',          // Path to layouts folder (optional)
  outputPath: './dist/layout.css',   // Output CSS path
  minify: false                      // Minify output (optional)
})

// Result:
// {
//   css: string,              // Generated CSS
//   layouts: Map,             // Layout data (for srcset generation)
//   config: object            // Parsed configuration
// }
```

### CLI Command

```bash
npx browser-style-layout build [options]

Options:
  --config <path>    Path to layout.config (default: ./layout.config)
  --output <path>    Output CSS path (default: ./dist/layout.css)
  --minify           Minify output CSS
  --watch            Watch mode (rebuild on changes)
```

---

## Configuration Reference

### layout.config Structure

```json
{
  "fileName": "layout.css",
  "element": "lay-out",
  "layer": "layout",
  "generateHTML": false,

  "core": ["base"],
  "common": ["animations"],

  "layoutContainer": {
    "layoutRootElement": "body",
    "maxLayoutWidth": {
      "value": "1024px",
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
    "<name>": {
      "type": "@media" | "@container",
      "min": "640px",
      "max": null,
      "layouts": [
        "layoutType",                          // All variants
        { "layoutType": ["variant1", ...] }    // Specific variants
      ]
    }
  },

  "themes": {
    "<themeName>": {
      "bg": "#color",
      "color": "#color"
    }
  }
}
```

---

## Performance Considerations

### CSS Bundle Size

The generated CSS size depends on which layouts you include:

| Configuration | Approx Size | Gzipped |
|--------------|-------------|---------|
| Minimal (columns only, 2 breakpoints) | ~8 KB | ~3 KB |
| Default (all layouts, 6 breakpoints) | ~33 KB | ~12 KB |
| Full (all variants, all breakpoints) | ~110 KB | ~35 KB |

**Optimization tips:**
- Only include layouts you actually use
- Use object syntax to include specific variants only
- Fewer breakpoints = smaller bundle
- Consider code-splitting if using many layouts

### Build Time

- **Configuration loading**: < 10ms
- **Layout file parsing**: ~50ms (8 files)
- **CSS generation**: ~100-500ms
- **Total**: < 1 second

Build time is negligible in most projects.

### Runtime Performance

- **Zero runtime cost**: All CSS is static
- **No JavaScript required**: Pure CSS (unless using React/Web Components)
- **Cacheable**: CSS file can be cached indefinitely
- **No layout shift**: Grid layouts prevent CLS

---

## How It Works Internally

### 1. Configuration Loading

Reads `layout.config` and parses JSON.

### 2. Layout File Discovery

Loads all `.json` files from `/layouts` folder:
- `columns.json` - Column layouts
- `grid.json` - Grid patterns
- `bento.json` - Bento box layouts
- `mosaic.json` - Mosaic patterns
- `ratios.json` - Aspect ratio layouts
- `asymmetrical.json` - Asymmetric layouts
- `autofit.json` - Auto-fit/fill grids

### 3. Per-Breakpoint Processing

For each breakpoint in config:
1. Extract `layouts` array
2. For each entry:
   - If **string**: Load ALL variants of that type
   - If **object**: Load ONLY specified variants
3. Generate CSS for each included variant

### 4. CSS Generation

For each layout variant:

```css
/* Container properties */
lay-out[lg="columns(2)"] {
  --layout-gtc: 1fr 1fr;
}

/* Reset rules */
lay-out[lg*="columns("] {
  --_ga: initial;
}

lay-out[lg*="columns("] > * {
  --layout-ga: auto;
}

/* Layout-specific rules (from layout.rules in JSON) */
lay-out[lg="bento(4a)"] > *:nth-child(4n+1) {
  --layout-ga: span 3 / auto;
}
```

### 5. Media Query Organization

All rules are organized within media queries:

```css
@media (min-width: 1024px) {
  /* All lg breakpoint layouts */
  lay-out[lg="columns(2)"] { ... }
  lay-out[lg="grid(3a)"] { ... }
  /* etc. */
}
```

### 6. Theme Generation

From `themes` in config:

```css
lay-out[theme="brand"] {
  --layout-bg: #ff6b6b;
  --layout-c: #ffffff;
}
```

---

## Troubleshooting

### CSS not being generated

**Check:**
1. Is `layout.config` in the correct location?
2. Do you have the `/layouts` folder?
3. Are you running the build command?

### Layouts not appearing

**Check:**
1. Is the layout included in your breakpoint's `layouts` array?
2. Is the variant name correct (e.g., `"grid(3a)"` not `"grid-3a"`)?
3. Did you import the generated CSS?

### Bundle size too large

**Solutions:**
1. Use object syntax to include only specific variants
2. Remove unused breakpoints
3. Remove unused layout types
4. Consider code-splitting

---

## FAQ

**Q: Can I use this with any framework?**
A: Yes! The CSS is framework-agnostic. We provide React and Web Components for convenience, but you can use the raw CSS with any framework.

**Q: Does this work with Tailwind?**
A: Yes! The layout system uses custom properties and attribute selectors, so it works alongside Tailwind.

**Q: Can I customize the element name?**
A: Yes, change `"element": "lay-out"` to any name in `layout.config`.

**Q: Do I need to rebuild CSS on every change?**
A: Only if you change `layout.config`. Changes to your React components don't require rebuilding.

**Q: Can I use container queries instead of media queries?**
A: Yes! Set `"type": "@container"` in any breakpoint config.

**Q: Is this production-ready?**
A: Yes. The CSS is static, tested, and has no runtime dependencies.

---

## Layouts Map Generation

**New in v2.0**: The system generates a JavaScript module containing layout srcset data for responsive images.

### What is layouts-map.js?

`layouts-map.js` is an auto-generated file containing:
- Srcset data for all 57 layouts
- Configuration (breakpoints, maxLayoutWidth)
- Helper functions for srcset lookups

**Location**: `layouts-map.js` (package root, NOT in `src/`)

**Size**: ~7 KB (uncompressed)

### How to Generate

The layouts map is automatically generated during `npm run prepublishOnly`, but you can also generate it manually:

```bash
npm run generate:layouts-map
```

Or directly:

```bash
node src/generate-layouts-map.js
```

### When to Regenerate

Regenerate `layouts-map.js` when:
1. **Adding custom layouts**: After creating new layout JSON files
2. **Modifying srcsets**: After changing srcset values in existing layouts
3. **Changing config**: After modifying `maxLayoutWidth` or breakpoints in `layout.config`

### What It Contains

```javascript
// Example structure
export const layoutsMap = {
  "grid(3c)": {
    "srcset": "66.67%,33.33%,33.33%",
    "items": 3,
    "repeatable": true
  },
  "columns(2)": {
    "srcset": "50%",
    "items": 2,
    "repeatable": true
  },
  // ... all 57 layouts
}

export const layoutConfig = {
  "maxLayoutWidth": "1024px",
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

### Usage with React

The layouts map enables advanced srcset features for responsive images:

```jsx
import { Layout, layoutsMap } from '@browser.style/layout/react'
import Image from 'next/image'

// Auto-generate sizes for specific child
const sizes = Layout.autoGenerateSizes(
  { md: 'columns(2)', lg: 'grid(3c)' },
  0  // child index
)

// Result: "(min-width: 720px) min(66.67vw, 683px), (min-width: 540px) min(50vw, 512px), 100vw"

<Layout md="columns(2)" lg="grid(3c)">
  <Image src="/photo.jpg" sizes={sizes} />
</Layout>
```

See [RUN.md](RUN.md) for complete srcset usage documentation.

### Custom Layouts

If you add custom layout JSON files, regenerate the map to include them:

```bash
# 1. Create custom layout
echo '{
  "name": "My Layouts",
  "prefix": "custom",
  "layouts": [{
    "id": "1",
    "srcset": "75%,25%",
    "items": 2
  }]
}' > layouts/custom.json

# 2. Regenerate map
npm run generate:layouts-map

# 3. Use in your app
import { layoutsMap } from '@browser.style/layout/react'
console.log(layoutsMap['custom(1)'])  // { srcset: "75%,25%", ... }
```

### Build Integration

For CI/CD pipelines, ensure the map is generated:

```json
{
  "scripts": {
    "build": "npm run generate:layouts-map && npm run build:css",
    "prepublishOnly": "npm run generate:layouts-map && npm run build && npm test"
  }
}
```

---

## Next Steps

- See [README.md](README.md) for component usage
- See [RUN.md](RUN.md) for srcset and responsive image documentation
- See [todo.md](todo.md) for implementation roadmap
- See [TEST-RESULTS.md](TEST-RESULTS.md) for test documentation
