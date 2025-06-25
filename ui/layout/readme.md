# @browser.style/layout

A modern, configurable CSS layout system with support for responsive design using both media queries and container queries. This system uses a JSON-driven build process to generate optimized CSS from modular layout definitions.

## Installation

```bash
npm install @browser.style/layout
```

## Usage Options

### 1. Pre-built CSS (Recommended)

Use the optimized, pre-built CSS files:

```css
/* Standard version */
@import '@browser.style/layout';

/* Minified version (production) */
@import '@browser.style/layout/layout.min';
```

### 2. Custom Build (Advanced)

For advanced customization, access the layout definitions and build your own:

```javascript
import config from '@browser.style/layout/config.json';
import LayoutBuilder from '@browser.style/layout/builder';

// Custom build with your own configuration
const builder = new LayoutBuilder('./my-config.json', './layouts/', './my-layout.css');
await builder.build();
```

## HTML Usage

### Basic Example

```html
<lay-out sm="columns(2)" md="bento(6a-fixed)" xl="mosaic(photo-lg)">
  <div>Content 1</div>
  <div>Content 2</div>
  <div>Content 3</div>
  <div>Content 4</div>
  <div>Content 5</div>
  <div>Content 6</div>
</lay-out>
```

### Responsive Design

Use different layout types at different breakpoints:

```html
<!-- Auto-fit on small screens, grid pattern on medium+, bento on large -->
<lay-out sm="auto(fit)" md="grid(2sm:1lg-h)" xl="bento(6a-fixed)">
  <article>Article 1</article>
  <article>Article 2</article>
  <article>Article 3</article>
</lay-out>
```

### Container Queries

Some breakpoints use container queries for component-level responsiveness:

```html
<!-- This layout responds to its container size, not viewport -->
<div style="width: 400px;">
  <lay-out sm="columns(2)">
    <div>Card 1</div>
    <div>Card 2</div>
  </lay-out>
</div>
```

## Available Layouts

### Layout Types by Category

**Grid Layouts** (`grid` prefix)
- Repeatable grid patterns with mixed item sizes that can accommodate unlimited items
- Examples: `grid(2sm:1lg-h)`, `grid(1lg-v:4sm)`, `grid(1xl-v:2sm:2sm)`

**Bento Layouts** (`bento` prefix)  
- Fixed, non-repeatable layouts inspired by traditional Japanese bento boxes
- Highly curated arrangements with specific item counts (6-9 items)
- Examples: `bento(6a-fixed)`, `bento(7b-fixed)`, `bento(9a-fixed)`

**Other Layout Types**
- **autofit/autofill** (`auto` prefix): Auto-fitting grid layouts
- **columns** (`columns` prefix): 2-6 column layouts  
- **asymmetrical** (`asym` prefix): Basic asymmetrical grid layouts
- **ratios** (`ratio` prefix): Ratio-based layouts (25:75, 33:66, etc.)
- **mosaic** (`mosaic` prefix): Photo gallery and artistic patterns

## Configuration

The layout system is fully configurable through JSON files:

### Default Breakpoints

The default configuration includes the following breakpoints (fully customizable in `config.json`):

- **xs**: 240px+ (extra small)
- **sm**: 380px+ (small) 
- **md**: 540px+ (medium)
- **lg**: 720px+ (large)
- **xl**: 920px+ (extra large)
- **xxl**: 1140px+ (extra extra large)

### Custom Configuration

You can customize breakpoints, query types, and core modules in `config.json`:

```json
{
  "breakpoints": {
    "mobile": {
      "type": "@media",
      "min": "320px",
      "layouts": ["columns", "autofit"]
    },
    "tablet": {
      "type": "@container", 
      "min": "768px",
      "layouts": ["grid", "bento", "mosaic"]
    }
  },
  "core": ["base", "animations", "demo"]
}
```

## Development & Building

### Quick Start

```bash
# Build CSS once
npm run build

# Build and watch for changes (development)
npm run dev

# Build minified version
npm run build:min

# Build with watch mode
npm run build:watch
```

### Build Features

- ✅ **CSS optimization**: Groups identical selectors and properties
- ✅ **Mixed query types**: Supports both `@media` and `@container` queries
- ✅ **Deduplication**: Eliminates redundant CSS rules
- ✅ **Watch mode**: Auto-rebuilds on file changes
- ✅ **Layer support**: Uses CSS `@layer` for proper cascade control

## Package Contents

When you install this package, you get:

```
@browser.style/layout/
├── dist/               # Compiled output
│   ├── layout.css      # Pre-built CSS (standard)
│   ├── layout.min.css  # Pre-built CSS (minified)
│   └── *.html          # Demo files for each layout type
├── config.json         # Layout configuration
├── layouts/            # Layout JSON definitions
│   ├── autofit.json    # Auto-fitting grid layouts
│   ├── asymmetrical.json # Asymmetrical layouts
│   ├── bento.json      # Bento box layouts
│   ├── columns.json    # Column layouts
│   ├── grid.json       # Grid layouts
│   ├── ratios.json     # Ratio layouts
│   └── mosaic.json     # Mosaic layouts
├── core/               # Core CSS files
│   ├── base.css        # Base layout styles
│   ├── animations.css  # Layout animations
│   └── demo.css        # Demo styling
├── build.js            # Build script
└── README.md           # This documentation
```

### Layout Definition Structure

Each layout type is defined in a JSON file with this structure:

```json
{
  "name": "Human-readable name",
  "prefix": "css-prefix",
  "layouts": [
    {
      "id": "short-id",
      "description": "Description of the layout",
      "columns": "CSS grid columns",
      "items": 3,
      "repeatable": true,
      "rules": [
        {
          "selector": "*:nth-of-type(3n+1)",
          "properties": {
            "--layout-ga": "span 2 / span 1"
          }
        }
      ]
    }
  ]
}
```

## Quick Reference

### Most Common Layouts

```html
<!-- Responsive columns -->
<lay-out sm="columns(2)" lg="columns(3)">
  
<!-- Auto-fitting grid -->
<lay-out md="auto(fit)">

<!-- Bento box (fixed layout) -->
<lay-out lg="bento(6a-fixed)">

<!-- Repeating grid pattern -->
<lay-out md="grid(2sm:1lg-h)">

<!-- Asymmetrical layout -->
<lay-out md="asym(left-right)">
```

### Layout Prefixes Quick Guide

- `auto()` - Auto-fitting grids
- `columns()` - Column layouts
- `bento()` - Fixed bento layouts
- `grid()` - Repeatable grid patterns  
- `asym()` - Asymmetrical layouts
- `ratio()` - Proportional layouts
- `mosaic()` - Mosaic patterns

## File Sizes

- **dist/layout.css**: ~61KB (optimized with breakpoint layers)
- **dist/layout.min.css**: ~53KB (14% smaller)

## Browser Support

- All modern browsers supporting CSS Grid
- Container queries supported where available (with graceful fallback)

## License

ISC

### CSS Layer Structure

The generated CSS uses CSS cascade layers for better control and organization:

```css
@layer layout.base      /* Core layout system */
@layer layout.reset     /* Reset and initialization */  
@layer layout.animations /* Animation definitions */
@layer layout.demo      /* Demo styling (optional) */
@layer layout.xs        /* Extra small breakpoint styles */
@layer layout.sm        /* Small breakpoint styles */
@layer layout.md        /* Medium breakpoint styles */
@layer layout.lg        /* Large breakpoint styles */
@layer layout.xl        /* Extra large breakpoint styles */
@layer layout.xxl       /* Extra extra large breakpoint styles */
```

This structure provides:
- ✅ **Predictable cascade**: Layers ensure consistent styling precedence
- ✅ **Breakpoint isolation**: Each breakpoint has its own layer for better organization
- ✅ **Customization**: You can override styles by targeting specific layers
- ✅ **Modularity**: Core, animations, and demo styles are separated



/*
	If you use bleed, you must set `--layout-mi` and `--layout-bleed-mw`
	and wrap a container around the layout, with a `data-layout-wrapper` attribute
*/
/* [data-layout-wrapper] {
	margin-inline: max(var(--layout-mi, 0), 50vw - var(--layout-bleed-mw, 100vw) / 2);
} */