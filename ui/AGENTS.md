# UI Monorepo - Internal Architecture

## Overview

The `ui/` folder is an **npm workspaces monorepo** containing independent component packages. Each package can be installed separately from the `@browser.style` npm scope.

## Directory Structure

```
ui/
├── base/                 Core CSS package (foundational)
├── [component]/          Individual component packages
├── blank.html            Template for new components
└── readme.md             Quick reference
```

## Core Package: base/

**Package:** `@browser.style/base` (v1.0.11)

The foundation all other components build upon. Provides CSS reset, form normalization, utility classes, and web component base styles.

### Files

| File | Purpose |
|------|---------|
| `index.css` | Main entry point, imports all modules |
| `core.css` | CSS reset, base element styles, custom properties |
| `form.css` | Form element normalization and enhanced styling |
| `utility.css` | Utility classes for common patterns |
| `webcomponents.css` | Base styles for web component patterns |
| `assets/` | Shared assets (icons, fonts) |

### Installation

```bash
npm install @browser.style/base
```

### Usage

```css
/* Import everything */
@import '@browser.style/base';

/* Or individual modules */
@import '@browser.style/base/core.css';
@import '@browser.style/base/form.css';
```

## Component Package Structure

Each component follows a consistent structure:

```
[component]/
├── package.json        Package metadata
├── index.js            Main JavaScript (web component)
├── index.css           Component styles
├── README.md           User documentation
├── AGENTS.md           Internal architecture (if exists)
└── CLAUDE.md           References AGENTS.md (if exists)
```

### Package.json Template

```json
{
  "name": "@browser.style/[component]",
  "version": "1.0.0",
  "type": "module",
  "main": "index.js",
  "style": "index.css",
  "files": ["*.js", "*.css"],
  "publishConfig": {
    "access": "public",
    "registry": "https://registry.npmjs.org/"
  },
  "repository": {
    "type": "git",
    "url": "git+https://github.com/madsstoumann/browser-style.git",
    "directory": "ui/[component]"
  }
}
```

## Component Categories

### Form Controls
`button`, `button-group`, `checkbox`, `radio`, `select`, `range`, `input-button`, `color-input`, `number-snapper`, `circular-range`

### Data Display & Entry
`table`, `data-grid`, `data-mapper`, `data-entry`, `data-chart`, `bar-chart`, `column-chart`, `area-chart`, `candlestick-chart`

### Layout & Navigation
`layout`, `accordion`, `tabs`, `tab-cordion`, `breadcrumbs`, `menu`, `nav-compass`, `carousel`, `bento`

### Cards & Content
`card`, `card-expand`, `card-flip`, `content-card`, `product-card`, `article`, `blockquote`, `chat`

### Design Token System
`design-token`, `design-token-editors`, `design-token-utils`, `design-token-styles`

### Color Tools
`color-picker`, `color-palette`, `color-grid`, `color-input`, `color-compare`, `color-swatch`, `color-visualizer-rgb`

### Weather Components
`weather-widget`, `weather-overview`, `weather-forecast-*`, `weather-radar`, `weather-current`, `weather-alert`

### Web Config Tools
`web-config-card`, `web-config-csp`, `web-config-manifest`, `web-config-robots`, `web-config-security`, `web-config-shared`, `web-config-taxonomy`, `web-config-tokens`

### Interactive/Games
`calculator`, `piano-keys`, `periodic-table`, `lottery-numbers`, `word-wheel`, `pocket-synth`, `barcode-scanner`

### Utilities
`async-loader`, `asset-handler`, `print-preview`, `msg-box`, `snack-bar`, `tooltip`

## Component Development Patterns

### Web Component Registration

```javascript
export default class MyComponent extends HTMLElement {
  static observedAttributes = ['attr'];

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  connectedCallback() {
    this.render();
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (oldValue !== newValue) this.render();
  }

  render() {
    // Update shadow DOM
  }
}

customElements.define('my-component', MyComponent);
```

### Shared Stylesheet Caching

For performance, components cache fetched stylesheets at module level:

```javascript
let sharedSheet;

async connectedCallback() {
  if (!sharedSheet) {
    const cssUrl = new URL('./index.css', import.meta.url).href;
    const response = await fetch(cssUrl);
    sharedSheet = new CSSStyleSheet();
    sharedSheet.replaceSync(await response.text());
  }
  this.shadowRoot.adoptedStyleSheets = [sharedSheet];
}
```

### Event Dispatch Pattern

```javascript
this.dispatchEvent(new CustomEvent('component-event', {
  bubbles: true,
  composed: true,  // Crosses shadow DOM boundary
  detail: { /* data */ }
}));
```

### CSS Parts for External Styling

```javascript
// In component
this.shadowRoot.innerHTML = `
  <button part="button">Click</button>
`;

// External CSS
my-component::part(button) {
  background: blue;
}
```

## Dependencies Between Packages

Some packages depend on others:

```
design-token
  └── design-token-utils (toCssValue)
  └── design-token-styles (shared CSS)
  └── design-token-editors (lazy loaded)

web-config-*
  └── web-config-shared (common utilities)
  └── web-config-card (UI container)
```

## Creating New Components

1. Copy `blank.html` as starting template
2. Create folder: `ui/[component-name]/`
3. Add `package.json` with proper metadata
4. Create `index.js` (web component) and/or `index.css`
5. Add `README.md` for user documentation
6. Optionally add `AGENTS.md` for complex components

## Testing Locally

Components can be tested by opening their HTML files directly or via a local server:

```bash
# From ui/[component]
npx serve .
```

## Publishing

Individual packages are published to npm via workspace commands from root:

```bash
# Version all packages
npm run version-all

# Publish all (requires npm OTP)
npm run publish-all
```
