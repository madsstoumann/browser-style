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
├── ui/                   UI component packages
│   ├── base/             Core CSS package (@browser.style/base)
│   ├── [component]/      Individual component packages
│   └── ...
├── apps/                 Standalone apps, games & tools (not npm packages)
│   ├── games/            Lottery, Wheel of Fortune, Word Search
│   ├── science/          Periodic Table, Solar System, BMI
│   ├── media/            ePub Reader, Image Edit, Dev.to
│   ├── music/            Fret Board, Pocket Synth, Piano Chord
│   └── utilities/        Barcode Scanner, Print Preview, etc.
├── cms/                  CMS tools and integrations
│   ├── baseline/         Content architecture docs & JSON schemas
│   ├── editors/          CMS field editor web components (@browser.style/editor-*)
│   └── integrations/     CMS platform wrappers (Contentful, Umbraco, etc.)
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
- **Monorepo**: npm workspaces with `ui/*`, `cms/baseline`, and `cms/editors/*` as workspace members
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
| **Data** (`ui/data/`) | chart, grid, entry, mapper |
| **Navigation** | layout, nav-compass, breadcrumbs, tabs, menu |
| **Cards/Content** | card, content-card, card-expand, product-card |
| **Design Tokens** (`ui/design-tokens/`) | core, editors, styles, utils |
| **Visualization** | color-picker, color-palette |
| **Weather** (`ui/weather/`) | widget, overview, forecast-*, feelslike, etc. |
| **GUI** (`ui/gui/`) | app, control, group, panel, tabs, icon, icon-button |
| **CMS Editors** | editor-card, editor-csp, editor-manifest (in `cms/editors/`) |
| **Interactive** | piano-keys, rich-text, xy, color-picker |

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
  "workspaces": ["ui/*", "ui/weather/*", "ui/gui/*", "ui/data/*", "ui/design-tokens/*", "cms/baseline", "cms/editors/*"]
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
