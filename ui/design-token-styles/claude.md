# Design Token Styles

## Overview

Design Token Styles provides **shared CSS** for the design token component ecosystem. It ensures consistent styling across `<design-token>`, `<edit-color>`, and all `<edit-*>` components.

## Architecture

### Package Structure

```
design-token-styles/
├── index.css          # Main stylesheet (~195 lines)
└── package.json       # NPM package configuration
```

### Usage Pattern

Components fetch and adopt this stylesheet:

```javascript
// In design-token/index.js
const cssUrl = new URL('../design-token-styles/index.css', import.meta.url).href;
const response = await fetch(cssUrl);
const text = await response.text();
const sharedSheet = new CSSStyleSheet();
sharedSheet.replaceSync(text);
this.shadowRoot.adoptedStyleSheets = [sharedSheet];
```

## CSS Structure

### Host Styles

```css
:host {
  color-scheme: inherit;
  display: grid;
  font-family: system-ui, sans-serif;
  row-gap: 1rem;
  --_v: initial;  /* Token value preview variable */
}
```

### Global Form Elements

```css
input, select, textarea {
  border: 1px solid #EEE;
  border-radius: .25rem;
  font-size: .75rem;
  padding: .25rem .5rem;
}

label {
  display: inline-grid;
  font-size: 12px;
  gap: .125rem;
}

textarea {
  field-sizing: content;
  resize: vertical;
}
```

### Token Button (Preview)

```css
[part="design-token-button"] {
  appearance: none;
  border: 1px solid #ccc;
  background: Canvas;
  padding: 0.5rem;
  border-radius: 4px;
  cursor: pointer;
  display: inline-grid;
  align-items: center;
  gap: 0.5rem;
  width: 100%;
  word-break: break-all;

  &::before {
    content: '';
    height: 1.5rem;
    border: 1px solid #eee;
    border-radius: 4px;
    background: #eee; /* Fallback */
  }
}
```

### Type-Specific Previews

#### Color
```css
:host([type="color"]) [part="design-token-button"]::before {
  background-color: #fff;
  background-image:
    linear-gradient(var(--_v), var(--_v)),
    conic-gradient(#eee 0.25turn, #fff 0.25turn 0.5turn, #eee 0.5turn 0.75turn, #fff 0.75turn);
  background-size: 100% 100%, 0.5rem 0.5rem;
  background-repeat: no-repeat, repeat;
}
```

#### Border
```css
:host([type="border"]) [part="design-token-button"]::before {
  background: transparent;
  border: var(--_v);
}
```

#### Shadow
```css
:host([type="shadow"]) [part="design-token-button"]::before {
  background: #fff;
  box-shadow: var(--_v);
}
```

#### Gradient
```css
:host([type="gradient"]) [part="design-token-button"]::before {
  background: var(--_v);
}
```

#### Aspect Ratio
```css
:host([type="aspectRatio"]) [part="design-token-button"]::before {
  width: 2rem;
  height: auto;
  aspect-ratio: var(--_v);
  background: #ccc;
}
```

### Token Dialog

```css
[part="design-token-dialog"] {
  border: none;
  border-radius: 2rem;
  box-shadow: /* Multi-layer shadow */;
  corner-shape: squircle;
  padding: 1.5rem;

  /* Tab-like details navigation */
  details {
    display: grid;
    grid-column: 1 / -1;
    grid-row: 1 / span 2;
    grid-template-columns: subgrid;
    grid-template-rows: subgrid;

    &:nth-of-type(1) > summary { grid-column: 1; }
    &:nth-of-type(2) > summary { grid-column: 2; }
    &:nth-of-type(3) > summary { grid-column: 3; }
    &[open] > summary { border-color: cornflowerblue; }
  }

  cq-box {
    display: grid;
    grid-template-columns: min-content min-content auto;
    column-gap: 1.5rem;
    row-gap: .75rem;
  }
}
```

### Color Editor Styles

```css
/* Preview with transparency grid */
[part="edit-color-preview"] {
  height: 3rem;
  border-radius: 4px;
  border: 1px solid #EEE;
  background-color: #fff;
  background-image:
    linear-gradient(var(--preview-color, transparent), var(--preview-color, transparent)),
    conic-gradient(#eee 0.25turn, #fff 0.25turn 0.5turn, #eee 0.5turn 0.75turn, #fff 0.75turn);
  background-size: 100% 100%, 1rem 1rem;
}

/* Wide gamut warning */
[part~="edit-color-warning"] {
  color: #b45309;
}

/* Fallback preview */
[part~="edit-color-warning-fallback"] {
  background: var(--_bg, #fff);
  height: 2rem;
}

/* Component input rows */
[part~="edit-color-row"] {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(0, 1fr));
  gap: 0.5rem;
}

/* Range slider rows */
[part~="edit-color-row"]:has([type="range"]) {
  align-items: center;
  grid-template-columns: 1ch 1fr 7ch;
}
```

## CSS Parts Reference

| Part | Component | Purpose |
|------|-----------|---------|
| `design-token-button` | design-token | Preview/trigger button |
| `design-token-dialog` | design-token | Edit dialog |
| `edit-color-preview` | edit-color | Color swatch preview |
| `edit-color-row` | edit-color | Input row container |
| `edit-color-warning` | edit-color | Wide gamut warning text |
| `edit-color-warning-fallback` | edit-color | Fallback color preview |

## CSS Custom Properties

| Property | Purpose | Default |
|----------|---------|---------|
| `--_v` | Token value for preview | `initial` |
| `--preview-color` | Color editor preview | `transparent` |
| `--_bg` | Fallback color background | `#fff` |

## Design Principles

### Transparency Grid Pattern

Used for color previews to show alpha channel:

```css
conic-gradient(
  #eee 0.25turn,
  #fff 0.25turn 0.5turn,
  #eee 0.5turn 0.75turn,
  #fff 0.75turn
)
```

### Dialog Tabs via Details

Uses `<details>` elements with subgrid for tab-like UI without JavaScript:

```css
details {
  grid-template-columns: subgrid;
  grid-template-rows: subgrid;
}
```

### Squircle Borders

Uses `corner-shape: squircle` for modern rounded corners (progressive enhancement).

## Integration

### Shared Stylesheet Pattern

```javascript
let sharedSheet; // Module-level cache

async connectedCallback() {
  if (!sharedSheet) {
    const cssUrl = new URL('../design-token-styles/index.css', import.meta.url);
    const text = await fetch(cssUrl).then(r => r.text());
    sharedSheet = new CSSStyleSheet();
    sharedSheet.replaceSync(text);
  }
  this.shadowRoot.adoptedStyleSheets = [sharedSheet];
}
```

## Browser Support

- Constructable Stylesheets
- CSS Nesting
- `:has()` selector
- `subgrid`
- `field-sizing: content`
- `corner-shape: squircle` (progressive enhancement)
