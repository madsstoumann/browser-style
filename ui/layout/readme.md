# @browser.style/layout

A modern, configurable CSS layout system with support for responsive design using both media queries and container queries.

## Installation

```bash
npm install @browser.style/layout
```

## Usage Options

### 1. Pre-built CSS (Recommended)

Use the optimized, pre-built CSS files:

```css
/* Standard version */
@import '@browser.style/layout/layout.css';

/* Minified version (production) */
@import '@browser.style/layout/layout.min.css';
```

### 2. Modular CSS (Advanced)

Import individual layout modules:

```css
/* Import the base layout system */
@import '@browser.style/layout';
/* or */
@import '@browser.style/layout/index.css';
```

### 3. Custom Build (Advanced)

For advanced customization, access the layout definitions and build your own:

```javascript
import config from '@browser.style/layout/config.json';
import LayoutBuilder from '@browser.style/layout/build-css.js';

// Custom build with your own configuration
const builder = new LayoutBuilder('./my-config.json', './layouts/', './my-layout.css');
await builder.build();
```

## HTML Usage

```html
<lay-out sm="columns(2)" md="bento(1lg-v:2sm)" xl="mosaic(photo)">
  <div>Content 1</div>
  <div>Content 2</div>
  <div>Content 3</div>
</lay-out>
```

## Available Layouts

- **autofit/autofill**: Auto-fitting grid layouts
- **columns**: 2-6 column layouts  
- **bento**: Bento box patterns with various arrangements
- **asymmetrical**: Asymmetrical grid layouts
- **ratios**: Ratio-based layouts (25:75, 33:66, etc.)
- **mosaic**: Photo gallery and artistic patterns

## Breakpoints

- **xs**: 240px+ (extra small)
- **sm**: 380px+ (small) 
- **md**: 540px+ (medium)
- **lg**: 720px+ (large)
- **xl**: 920px+ (extra large)
- **xxl**: 1140px+ (extra extra large)

## Package Contents

When you install this package, you get:

```
@browser.style/layout/
├── layout.css           # Pre-built CSS (standard)
├── layout.min.css       # Pre-built CSS (minified)
├── index.css           # Modular CSS entry point
├── config.json         # Layout configuration
├── build/              # Layout JSON definitions
│   ├── autofit.json
│   ├── bento.json
│   ├── columns.json
│   └── ...
├── build-css.js        # Build script
└── BUILD.md           # Build documentation
```

## File Sizes

- **layout.css**: ~25KB (optimized)
- **layout.min.css**: ~21KB (15% smaller)

## Browser Support

- All modern browsers supporting CSS Grid
- Container queries supported where available (with graceful fallback)

## License

ISC
