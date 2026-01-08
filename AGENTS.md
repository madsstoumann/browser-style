# Browser Style - Project Architecture

## Overview

**Browser Style** is a CSS-first component library and design system that embraces native browser capabilities. The project provides baseline CSS, utility classes, and a comprehensive collection of web components.

**Repository:** https://github.com/madsstoumann/browser-style
**Homepage:** https://browser.style/
**Package Scope:** `@browser.style/*`

## Project Structure

```
browser-style/
├── package.json          Workspace root (npm workspaces)
├── ui/                   Monorepo containing all components
│   ├── base/             Core CSS package (@browser.style/base)
│   ├── [component]/      Individual component packages
│   └── ...
├── scripts/              Build and publish utilities
└── docs/                 Documentation
```

## Architecture Principles

### CSS-First Philosophy
- Leverage native CSS features (custom properties, container queries, cascade layers)
- Minimal JavaScript - enhance, don't replace CSS capabilities
- Progressive enhancement over JavaScript-dependent solutions
- Web Components for complex interactive functionality

### Package Structure
- **Monorepo**: npm workspaces with `ui/*` as workspace members
- **Independent versioning**: Each package versioned separately
- **Public npm registry**: Published under `@browser.style` scope

## Core Package: @browser.style/base

The foundational CSS package providing:

- **core.css** - CSS reset, base element styles, custom properties
- **form.css** - Form element normalization and styling
- **utility.css** - Utility classes for common patterns
- **webcomponents.css** - Base styles for web component patterns

**Install:**
```bash
npm install @browser.style/base
```

**Import:**
```css
@import '@browser.style/base';
/* or individual files */
@import '@browser.style/base/core.css';
```

## Component Categories

The `ui/` folder contains component packages organized by function:

| Category | Examples |
|----------|----------|
| **Form Controls** | button, checkbox, radio, select, range, input-button |
| **Data Display** | table, data-grid, data-mapper, data-entry, data-chart |
| **Navigation** | layout, nav-compass, breadcrumbs, tabs, menu |
| **Cards/Content** | card, content-card, card-expand, product-card |
| **Design Tokens** | design-token, design-token-editors, design-token-utils |
| **Visualization** | color-picker, color-palette, data-chart, bar-chart |
| **Weather** | weather-widget, weather-overview, weather-forecast-* |
| **Web Config** | web-config-card, web-config-csp, web-config-manifest |
| **Interactive** | calculator, piano-keys, rich-text, barcode-scanner |

## Development

### Workspace Commands

```bash
# Build all packages
npm run build

# Test all packages
npm run test

# Version all packages (patch)
npm run version-all

# Publish all packages
npm run publish-all

# Update peer dependencies
npm run update-peers
```

### Package.json Structure

**Root workspace:**
```json
{
  "name": "@browser-style/workspace",
  "private": true,
  "type": "module",
  "workspaces": ["ui/*"]
}
```

**Individual packages** typically include:
```json
{
  "name": "@browser.style/[component]",
  "version": "x.x.x",
  "type": "module",
  "main": "index.js",
  "style": "index.css"
}
```

## Component Patterns

### Web Component Template

Components follow a consistent pattern:

```javascript
export default class ComponentName extends HTMLElement {
  static observedAttributes = ['attr1', 'attr2'];

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  connectedCallback() {
    // Initialize component
  }

  attributeChangedCallback(name, oldValue, newValue) {
    // Handle attribute changes
  }
}

customElements.define('component-name', ComponentName);
```

### Shared Stylesheet Pattern

Components often share styles via module-level caching:

```javascript
let sharedSheet;

async connectedCallback() {
  if (!sharedSheet) {
    const response = await fetch(new URL('./styles.css', import.meta.url));
    sharedSheet = new CSSStyleSheet();
    sharedSheet.replaceSync(await response.text());
  }
  this.shadowRoot.adoptedStyleSheets = [sharedSheet];
}
```

## Documentation

- Component-level documentation in each `ui/[component]/README.md`
- Internal architecture docs in `ui/[component]/AGENTS.md`
- Agent instructions reference AGENTS.md via CLAUDE.md files

## Key Conventions

1. **ES Modules**: All JavaScript uses ES module syntax
2. **CSS Custom Properties**: Prefer `--property-name` for theming
3. **Shadow DOM**: Open mode for styling access via `::part()`
4. **Events**: Custom events with `bubbles: true, composed: true`
5. **Naming**: Kebab-case for custom elements, camelCase for JS
