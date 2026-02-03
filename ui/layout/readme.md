# @browser.style/layout

Modern CSS layout system with responsive grid patterns and responsive image srcsets.

---

## Quick Start

### Install

```bash
npm install @browser.style/layout
```

### Use Pre-built CSS

```html
<!DOCTYPE html>
<html>
<head>
  <link rel="stylesheet" href="node_modules/@browser.style/layout/dist/layout.css">
</head>
<body>
  <lay-out md="columns(2)" lg="grid(3a)">
    <div>Item 1</div>
    <div>Item 2</div>
    <div>Item 3</div>
  </lay-out>
</body>
</html>
```

Or import in JavaScript:

```javascript
import '@browser.style/layout/dist/layout.css'
```

That's it! No JavaScript required for layouts.

---

## Features

- **Pure CSS** - No JavaScript runtime needed
- **Responsive** - Breakpoint-based layouts with `@media` or `@container` queries
- **63 Layout Patterns** - Columns, grids, bento boxes, mosaics, lanes (masonry), and more
- **Responsive Images** - Automatic srcset generation for optimal image loading
- **Customizable** - Create custom layouts and breakpoints
- **Small Bundle** - ~33 KB uncompressed, ~12 KB gzipped
- **Zero Config** - Works out of the box with sensible defaults

---

## Usage

### Basic Layouts

Use the `lay-out` element with breakpoint attributes:

```html
<!-- 1 column on mobile, 2 columns on tablet, 3 columns on desktop -->
<lay-out md="columns(2)" lg="columns(3)">
  <article>Content 1</article>
  <article>Content 2</article>
  <article>Content 3</article>
</lay-out>
```

### Available Breakpoints

Default breakpoints (customizable):

- `xs` - 240px
- `sm` - 380px
- `md` - 540px
- `lg` - 720px
- `xl` - 920px
- `xxl` - 1140px

### Layout Types

**Columns:**
```html
<lay-out lg="columns(3)">...</lay-out>
```
Equal-width columns (1-6 columns available)

**Grid:**
```html
<lay-out lg="grid(3a)">...</lay-out>
```
Advanced grid patterns (19 variants available)

**Bento:**
```html
<lay-out lg="bento(6a)">...</lay-out>
```
Bento box layouts (10 variants available)

**Mosaic:**
```html
<lay-out lg="mosaic(hex)">...</lay-out>
```
Mosaic patterns (5 variants available)

**Asymmetrical:**
```html
<lay-out lg="asym(l-r)">...</lay-out>
```
Asymmetric layouts (6 variants available)

**Ratios:**
```html
<lay-out lg="ratios(2:1)">...</lay-out>
```
Aspect ratio layouts (9 variants available)

**Autofit:**
```html
<lay-out xs="auto(fit)">...</lay-out>
```
Auto-fitting layouts (2 variants available)

**Lanes (Masonry):**
```html
<lay-out sm="lanes(2)" lg="lanes(4)">...</lay-out>
<lay-out sm="lanes(2)" lg="lanes(auto)" lanes-min="12rem">...</lay-out>
```
Masonry-style layouts using CSS `display: grid-lanes` (6 variants available). Falls back to CSS columns for browsers without grid-lanes support. Use `lanes-min` and `lanes-max` attributes to configure column sizing for `lanes(auto)`.

See [demos](dist/index.html) for visual examples of all layouts.

### Breakpoint Spacing Tokens

Spacing tokens can be embedded alongside layout tokens in breakpoint attributes. They use a multiplier (0–4) applied to `--layout-space-unit`.

| Token | Property | Default |
|-------|----------|---------|
| `pi(N)` | `padding-inline` | 0 |
| `pbs(N)` | `padding-block-start` | 0 |
| `pbe(N)` | `padding-block-end` | 0 |
| `mbs(N)` | `margin-block-start` | 0 |
| `mbe(N)` | `margin-block-end` | 0 |
| `cg(N)` | `column-gap` | 1 |
| `rg(N)` | `row-gap` | 1 |

```html
<!-- Responsive padding and gaps -->
<lay-out md="columns(2) pi(1) pbs(1) pbe(1)" lg="columns(4) pi(4) pbs(2) pbe(2)">
  <div>Item 1</div>
  <div>Item 2</div>
  <div>Item 3</div>
  <div>Item 4</div>
</lay-out>
```

Global HTML attributes (`pad-inline`, `col-gap`, etc.) still work and provide defaults at all breakpoints. Breakpoint tokens override at specific breakpoints. Values persist until a larger breakpoint overrides them.

See [spacing demos](dist/spacing.html) for visual examples.

---

## Responsive Images

### Automatic Srcset Generation

Import the srcset utilities:

```javascript
import { srcsetMap, layoutConfig } from '@browser.style/layout/maps'
import { generateSrcsets } from '@browser.style/layout/src/srcsets.js'

// Generate srcsets for a layout
const srcsets = generateSrcsets(
  { md: "columns(2)", lg: "grid(3a)" },
  srcsetMap,
  layoutConfig
)
// Returns: "540:50%;720:50%,50%,100%@1024"
```

### Apply to Existing Elements

```javascript
import { applySrcsets } from '@browser.style/layout/src/srcsets.js'
import { srcsetMap, layoutConfig } from '@browser.style/layout/maps'

// After adding lay-out elements to DOM
applySrcsets('lay-out', srcsetMap, layoutConfig)
```

### Manual Srcsets

```html
<lay-out md="columns(2)" lg="grid(3a)" srcsets="540:50%;720:50%,50%,100%@1024">
  <img src="image.jpg">
  <img src="image.jpg">
  <img src="image.jpg">
</lay-out>
```

The `srcsets` attribute tells the browser what percentage of the layout width each item occupies at different breakpoints.

---

## Web Component (Optional)

For enhanced functionality with automatic srcset generation:

```javascript
import '@browser.style/layout/src/components/layout/index.js'
```

This registers a `<lay-out>` web component that:
- Automatically generates `srcsets` from breakpoint attributes
- Adds `sizes` attributes to child images
- Works with responsive image loading

**Example:**

```html
<lay-out md="columns(2)" lg="grid(3a)">
  <img src="image.jpg" alt="Photo">
  <img src="image.jpg" alt="Photo">
  <img src="image.jpg" alt="Photo">
</lay-out>

<script type="module">
  import '@browser.style/layout/src/components/layout/index.js'
</script>
```

The component automatically:
1. Generates `srcsets="540:50%;720:50%,50%,100%@1024"`
2. Adds `sizes` to all child `<img>` elements
3. Optimizes image loading based on layout

---

## Custom Configuration

### Create Custom Build

If you need different layouts or breakpoints:

**1. Create `layout.config.json` in your project:**

```json
{
  "element": "lay-out",
  "core": ["base"],
  "common": ["animations"],

  "layoutContainer": {
    "element": "body",
    "maxWidth": 1024,
    "margin": "1rem"
  },

  "breakpoints": {
    "md": {
      "type": "@media",
      "min": "768px",
      "layouts": ["columns"]
    },
    "lg": {
      "type": "@media",
      "min": "1024px",
      "layouts": [
        "columns",
        { "grid": ["grid(3a)", "grid(3c)"] }
      ]
    }
  }
}
```

**2. Build CSS:**

```bash
node node_modules/@browser.style/layout/build.js
```

This generates `dist/layout.css` with only your specified layouts.

**3. Include your custom CSS:**

```html
<link rel="stylesheet" href="dist/layout.css">
```

### Configuration Options

#### `element` (required)
The HTML element name for layout containers.
- Default: `"lay-out"`

#### `core` (required)
Core CSS files to include from `/core` folder.
- Example: `["base"]`

#### `common` (required)
Common CSS files to include from `/core` folder.
- Example: `["animations"]`

#### `layoutContainer` (required)
Configuration for the layout container element and CSS custom properties.

Properties:
- `element` (optional, default: `"body"`): HTML element to apply container styles to
- `maxWidth` (required): Maximum container width in pixels (generates `--layout-bleed-mw` CSS custom property)
- `margin` (required): Inline margin value (generates `--layout-mi` CSS custom property)
- `setRoot` (optional, default: `true`): Whether to apply the `margin-inline` calculation to the element

**With `setRoot: true` (default):**
```json
{
  "element": "body",
  "maxWidth": 1024,
  "margin": "1rem",
  "setRoot": true
}
```

Generates:
```css
body {
  --layout-bleed-mw: 1024px;
  --layout-mi: 1rem;
  margin-inline: max(var(--layout-mi), 50cqw - var(--layout-bleed-mw) / 2);
}
```

**With `setRoot: false`:**
Only sets CSS variables without the margin calculation, giving you full control via the `[data-layout-root]` attribute in base.css.

#### `breakpoints` (required)
Define your breakpoints and which layouts to include.

**Include all variants:**
```json
"layouts": ["columns"]
```
This includes all 6 column layouts: `columns(1)` through `columns(6)`

**Include specific variants only:**
```json
"layouts": [
  { "grid": ["grid(3a)", "grid(3c)"] }
]
```
This includes only those 2 specific grid layouts, keeping your CSS small.

---

## Create Custom Layouts

### 1. Create Layout JSON

Create a JSON file in your project's `layouts/` folder:

```json
{
  "name": "Hero Layouts",
  "prefix": "hero",
  "layouts": [
    {
      "id": "1",
      "columns": "2fr 1fr",
      "items": 2,
      "srcset": "66.67%,33.33%",
      "icon": [
        { "w": 66.67, "h": 100, "x": 0, "y": 0 },
        { "w": 33.33, "h": 100, "x": 66.67, "y": 0 }
      ],
      "rules": []
    }
  ]
}
```

### 2. Reference in Config

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

### 3. Build

```bash
npm run build:all
```

### 4. Use Your Layout

```html
<lay-out lg="hero(1)">
  <div>Main content</div>
  <aside>Sidebar</aside>
</lay-out>
```

### Layout JSON Properties

- **`id`** - Unique identifier (e.g., "1", "3a")
- **`columns`** - CSS grid-template-columns value
- **`rows`** - (Optional) CSS grid-template-rows value
- **`items`** - Number of items this layout expects
- **`srcset`** - Comma-separated percentages for each item
- **`icon`** - Array of rectangles for visual icon
- **`rules`** - (Optional) Array of CSS rules for specific children

See `layouts/` folder for examples.

---

## Build Commands

```bash
npm run build         # Build CSS
npm run build:maps    # Generate layouts-map.js
npm run build:demo    # Generate HTML demos
npm run build:icons   # Generate SVG icons
npm run build:all     # Build everything
```

For detailed build documentation, see [docs/BUILD.md](docs/BUILD.md)

---

## Examples

### Gallery

```html
<lay-out lg="grid(3a)" xl="grid(4a)">
  <img src="photo1.jpg" alt="Photo 1">
  <img src="photo2.jpg" alt="Photo 2">
  <img src="photo3.jpg" alt="Photo 3">
  <img src="photo4.jpg" alt="Photo 4">
  <img src="photo5.jpg" alt="Photo 5">
</lay-out>
```

### Blog Layout

```html
<lay-out md="columns(2)" lg="asym(l-r)">
  <article>
    <h2>Main Article</h2>
    <p>Content...</p>
  </article>
  <aside>
    <h3>Sidebar</h3>
    <p>Related content...</p>
  </aside>
</lay-out>
```

### Card Grid

```html
<lay-out sm="columns(2)" md="columns(3)" lg="grid(4a)">
  <article class="card">Card 1</article>
  <article class="card">Card 2</article>
  <article class="card">Card 3</article>
  <article class="card">Card 4</article>
</lay-out>
```

### Bento Box

```html
<lay-out lg="bento(6a)">
  <div>Feature 1</div>
  <div>Feature 2</div>
  <div>Feature 3</div>
  <div>Feature 4</div>
  <div>Feature 5</div>
  <div>Feature 6</div>
</lay-out>
```

---

## Browser Support

- Chrome/Edge 89+
- Firefox 88+
- Safari 14.1+

Requires CSS Grid and CSS Custom Properties support.

### Safari/Firefox Polyfill

This layout system uses the enhanced `attr()` CSS function with type support, which is currently only supported in Chrome/Edge. For Safari and Firefox, include the polyfill:

**In HTML:**
```html
<script type="module" src="node_modules/@browser.style/layout/polyfills/attr-fallback.js"></script>
```

**Or in JavaScript:**
```javascript
import '@browser.style/layout/polyfills/attr-fallback'
```

The polyfill:
- Auto-detects browser support and only runs when needed
- Automatically processes existing and new `<lay-out>` elements
- Watches for attribute changes dynamically
- Has zero overhead in browsers with native support

---

## Performance

- **Zero JavaScript** - Pure CSS, no runtime overhead
- **Lazy Loading** - Use with native `loading="lazy"` on images
- **Cacheable** - Static CSS, fully cacheable
- **No Layout Shift** - Grid-based, prevents CLS
- **Small Bundle** - ~12 KB gzipped

---

## Documentation

- [BUILD.md](docs/BUILD.md) - Build system documentation
- [RUN.md](docs/RUN.md) - Command reference
- [demos/](dist/index.html) - Visual examples

---

## License

ISC

---

## Links

- [npm package](https://www.npmjs.com/package/@browser.style/layout)
- [GitHub repository](https://github.com/madsstoumann/browser-style)
- [Website](https://browser.style/ui/layout)

---

## Contributing

Issues and pull requests welcome at [GitHub](https://github.com/madsstoumann/browser-style/issues)
