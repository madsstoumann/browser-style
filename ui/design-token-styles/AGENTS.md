# Design Token Styles - Internal Architecture

## Overview

Design Token Styles provides **shared CSS** for the design token component ecosystem. It ensures consistent styling across `<design-token>`, `<edit-color>`, and all `<edit-*>` components using a single constructable stylesheet.

**Package Type:** Pure CSS (no JavaScript)

**Package Version:** 1.0.0

**Total LOC:** 194 lines CSS

**Key architectural decisions:**
- **Constructable stylesheets**: Fetched and adopted by web components
- **CSS Parts**: Component styling via `::part()` selectors
- **Attribute-based variants**: `[type="color"]` for type-specific previews
- **Pseudo-element previews**: `::before` for visual token representation
- **Progressive enhancement**: Modern CSS features with graceful fallbacks

## Architecture Overview

### Usage Pattern

```javascript
// In web component connectedCallback()
let sharedSheet;  // Module-level singleton

if (!sharedSheet) {
  const cssUrl = new URL('../design-token-styles/index.css', import.meta.url).href;
  const response = await fetch(cssUrl);
  const text = await response.text();
  sharedSheet = new CSSStyleSheet();
  sharedSheet.replaceSync(text);
}
this.shadowRoot.adoptedStyleSheets = [sharedSheet];
```

### Component Consumers

- `<design-token>` - Token preview and edit dialog
- `<edit-color>` - Color picker component
- Future `<edit-*>` components

## File Structure

```
design-token-styles/
├── index.css      194 lines   Main stylesheet
├── package.json    25 lines   NPM configuration
└── claude.md       ---        This file
```

## CSS Structure Breakdown

### Host Styles (Lines 6-12)

```css
:host {
  color-scheme: inherit;
  display: grid;
  font-family: system-ui, sans-serif;
  row-gap: 1rem;
  --_v: initial;
}
```

Base styles for all component hosts.

### Global Form Elements (Lines 14-32)

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

### Design Token Button (Lines 34-60)

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
}
```

### Token Preview Pseudo-Element (Lines 50-59)

```css
[part="design-token-button"]::before {
  content: '';
  height: 1.5rem;
  border: 1px solid #eee;
  border-radius: 4px;
  background: #eee;  /* Fallback */
}
```

## Type-Specific Previews (Lines 62-91)

### Color Preview (Lines 63-70)

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

**Transparency Grid Pattern:** Checkerboard using conic-gradient shows alpha channel.

### Border Preview (Lines 72-75)

```css
:host([type="border"]) [part="design-token-button"]::before {
  background: transparent;
  border: var(--_v);
}
```

### Shadow Preview (Lines 77-80)

```css
:host([type="shadow"]) [part="design-token-button"]::before {
  background: #fff;
  box-shadow: var(--_v);
}
```

### Gradient Preview (Lines 82-84)

```css
:host([type="gradient"]) [part="design-token-button"]::before {
  background: var(--_v);
}
```

### Aspect Ratio Preview (Lines 86-91)

```css
:host([type="aspectRatio"]) [part="design-token-button"]::before {
  width: 2rem;
  height: auto;
  aspect-ratio: var(--_v);
  background: #ccc;
}
```

## Dialog Styles (Lines 93-156)

### Dialog Container (Lines 94-100)

```css
[part="design-token-dialog"] {
  border: none;
  border-radius: 2rem;
  box-shadow: 0 -1px 2px 0 hsl(220 3% 15% / calc(1% + 2%)),
              0 2px 1px -2px hsl(220 3% 15% / calc(1% + 3%)),
              0 5px 5px -2px hsl(220 3% 15% / calc(1% + 3%)),
              0 10px 10px -2px hsl(220 3% 15% / calc(1% + 4%)),
              0 20px 20px -2px hsl(220 3% 15% / calc(1% + 5%)),
              0 40px 40px -2px hsl(220 3% 15% / calc(1% + 7%));
  corner-shape: squircle;
  padding: 1.5rem;
}
```

**Multi-layer Shadow:** 6 shadow layers create depth effect.

**Squircle Corners:** Progressive enhancement for modern browsers.

### Tab Layout via Details (Lines 101-111)

```css
details {
  display: grid;
  grid-column: 1 / -1;
  grid-row: 1 / span 2;
  grid-template-columns: subgrid;
  grid-template-rows: subgrid;

  &:nth-of-type(1) > summary { grid-column: 1; }
  &:nth-of-type(2) > summary { grid-column: 2; }
  &:nth-of-type(3) > summary { grid-column: 3; justify-self: start; }
  &[open] > summary { border-color: cornflowerblue; }
}
```

**Subgrid Layout:** Advanced CSS Grid for tab-like navigation without JavaScript.

### Details Content (Lines 113-116)

```css
::details-content {
  grid-column: 1 / -1;
  grid-row: 2;
}
```

### Form Structure (Lines 118-134)

```css
fieldset {
  border: 0;
  display: grid;
  gap: .75rem;
}

form {
  display: grid;
  gap: 1rem;
}

cq-box {
  display: grid;
  grid-template-columns: min-content min-content auto;
  column-gap: 1.5rem;
  row-gap: .75rem;
}
```

### Summary Tabs (Lines 142-155)

```css
summary {
  border: 0;
  border-bottom: 1px solid transparent;
  color: CanvasText;
  cursor: pointer;
  font-family: system-ui;
  font-size: .625rem;
  letter-spacing: 0.05em;
  padding: .5rem 0;
  text-transform: uppercase;
  &::marker { content: ''; }
}
```

## Color Editor Styles (Lines 158-194)

### Preview Swatch (Lines 159-169)

```css
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
```

### Gamut Warning (Lines 171-177)

```css
[part~="edit-color-warning"] {
  color: #b45309;  /* Orange warning color */
}

[part~="edit-color-warning-fallback"] {
  background: var(--_bg, #fff);
  height: 2rem;
}
```

### Input Rows (Lines 180-194)

```css
[part~="edit-color-row"] {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(0, 1fr));
  gap: 0.5rem;
  &:has(select) { align-items: end; }
}

[part~="edit-color-row"]:has([type="range"]) {
  align-items: center;
  grid-template-columns: 1ch 1fr 7ch;  /* label | slider | value */
}
```

## CSS Custom Properties

| Property | Line | Default | Purpose |
|----------|------|---------|---------|
| `--_v` | 11 | `initial` | Token value for preview rendering |
| `--preview-color` | 165 | `transparent` | Color editor preview color |
| `--_bg` | 175 | `#fff` | Fallback color background |

## CSS Parts Reference

| Part | Component | Lines | Purpose |
|------|-----------|-------|---------|
| `design-token-button` | design-token | 35-60 | Preview/trigger button |
| `design-token-dialog` | design-token | 94-156 | Edit dialog |
| `edit-color-preview` | edit-color | 159-169 | Color swatch preview |
| `edit-color-row` | edit-color | 180-194 | Input row container |
| `edit-color-warning` | edit-color | 171-173 | Wide gamut warning |
| `edit-color-warning-fallback` | edit-color | 174-177 | Clamped color preview |

## Design Patterns

### Transparency Grid Pattern

Used for color previews to visualize alpha channel:

```css
background-image:
  linear-gradient(var(--_v), var(--_v)),
  conic-gradient(#eee 0.25turn, #fff 0.25turn 0.5turn, #eee 0.5turn 0.75turn, #fff 0.75turn);
background-size: 100% 100%, 0.5rem 0.5rem;
background-repeat: no-repeat, repeat;
```

**Layer 1:** Color overlay (linear-gradient as solid color)
**Layer 2:** Checkerboard pattern (conic-gradient)

### Multi-Layer Elevation Shadow

```css
box-shadow:
  0 -1px 2px 0 hsl(220 3% 15% / calc(1% + 2%)),     /* Top edge */
  0 2px 1px -2px hsl(220 3% 15% / calc(1% + 3%)),   /* Tight bottom */
  0 5px 5px -2px hsl(220 3% 15% / calc(1% + 3%)),   /* Medium spread */
  0 10px 10px -2px hsl(220 3% 15% / calc(1% + 4%)), /* Large spread */
  0 20px 20px -2px hsl(220 3% 15% / calc(1% + 5%)), /* Larger spread */
  0 40px 40px -2px hsl(220 3% 15% / calc(1% + 7%)); /* Ambient */
```

Creates realistic depth with progressive opacity increase.

### CSS Nesting with Attribute Variants

```css
:host([type="color"]) [part="design-token-button"]::before {
  /* Color-specific preview */
}

:host([type="border"]) [part="design-token-button"]::before {
  /* Border-specific preview */
}
```

Type attribute on host element controls preview style.

### Subgrid Tab Layout

```css
details {
  display: grid;
  grid-column: 1 / -1;
  grid-row: 1 / span 2;
  grid-template-columns: subgrid;
  grid-template-rows: subgrid;
}
```

Enables tab-like UI using native `<details>` elements without JavaScript.

## Browser Feature Requirements

| Feature | Used In | Lines | Fallback |
|---------|---------|-------|----------|
| Constructable Stylesheets | Component integration | N/A | None (required) |
| CSS Nesting | Dialog, rows | 50, 101-155, 180-189 | None |
| `:has()` selector | Range row layout | 191 | None |
| `subgrid` | Tab layout | 105-106 | Breaks tab UI |
| `field-sizing: content` | Textarea | 30 | Fixed height |
| `corner-shape: squircle` | Dialog | 98 | Standard rounded |
| `::details-content` | Tab content | 113-116 | Content may shift |

## Gotchas & Edge Cases

### 1. Shared Stylesheet Singleton

All component instances share the same stylesheet via module-level caching. Changes to CSS require page reload to take effect.

### 2. Transparency Grid Performance

The conic-gradient checkerboard pattern is rendered per-element. Many color previews may impact performance.

### 3. Subgrid Browser Support

Tab layout relies on CSS Subgrid. Safari 16+, Chrome 117+, Firefox 71+. Older browsers break layout.

### 4. `:has()` Browser Support

Range slider row layout uses `:has()`. Safari 15.4+, Chrome 105+, Firefox 121+. Older browsers get default grid.

### 5. Squircle Progressive Enhancement

`corner-shape: squircle` only works in supported browsers. Falls back to standard `border-radius`.

### 6. Dialog Backdrop

No explicit backdrop styling. Uses browser default `::backdrop`.

### 7. Color Scheme Inheritance

```css
:host {
  color-scheme: inherit;
}
```

Inherits from parent, enabling dark mode support. Requires parent to set `color-scheme`.

### 8. Custom Element Styling

`cq-box` selector assumes custom element exists in DOM. Component must define this element.

### 9. Form Reset Styling

Inputs use minimal styling (`border`, `border-radius`, `padding`). No focus states defined.

### 10. Text Overflow

```css
[part="design-token-button"] {
  word-break: break-all;
}
```

Long token names break anywhere. May cause awkward line breaks.

## Integration Notes

### Adding New Token Types

1. Add attribute selector variant:
```css
:host([type="newType"]) [part="design-token-button"]::before {
  /* Type-specific preview styles */
}
```

2. Use `--_v` custom property for dynamic value.

### Adding New Editors

1. Define CSS parts for component structure
2. Add part styles to index.css
3. Use existing patterns (rows, previews, warnings)

### Customizing via CSS Parts

```css
/* External stylesheet */
design-token::part(design-token-button) {
  border-color: blue;
}

edit-color::part(edit-color-preview) {
  height: 5rem;
}
```

## Debugging Tips

1. **Preview not showing?** Check `--_v` is set and `type` attribute matches
2. **Tab layout broken?** Verify browser supports subgrid
3. **Row layout wrong?** Check `:has()` browser support
4. **Colors look wrong?** Verify color-scheme inheritance
5. **Styles not applying?** Confirm stylesheet is adopted to shadow root
6. **Dialog not styled?** Check part attribute matches exactly
