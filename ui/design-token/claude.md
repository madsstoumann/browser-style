# Design Token Component

## Overview

The `<design-token>` component is a **web component for displaying and editing individual W3C design tokens**. It shows a visual preview of the token value and opens a dialog for editing when clicked. Part of a larger design token ecosystem.

## Architecture

### System Overview

```
web-config-tokens (container)
  ├─ Generates CSS custom properties from all tokens
  ├─ Builds token registry for reference resolution
  └─ Creates multiple <design-token> components
      ├─ Receives registry for reference resolution
      ├─ Uses CSS variables for previews (--_v)
      └─ Loads specialized editors on-demand
```

### Files

- **[index.js](index.js)**: Main web component (~283 lines)
- **[README.md](README.md)**: User documentation
- **[package.json](package.json)**: NPM package configuration

## Component API

### Properties

#### `src` (setter/getter)
The token object to display and edit:

```javascript
token.src = {
  $type: 'color',
  $value: '#1976D2',
  $description: 'Primary brand color',
  $extensions: {
    css: { var: '--color-primary' }
  }
};
```

#### `registry` (setter/getter)
A Map containing all tokens for resolving `{path.to.token}` references:

```javascript
import { buildRegistry } from '../design-token-utils/index.js';
const registry = buildRegistry(allTokens);
token.registry = registry;
```

### Attributes

| Attribute | Description |
|-----------|-------------|
| `name` | Display name shown on button and dialog |
| `type` | Automatically set from token's `$type` |

### Events

#### `token-changed`
Fired when token is modified and saved:

```javascript
token.addEventListener('token-changed', (e) => {
  const { token, cssVar } = e.detail;
  console.log('Token updated:', token);
});
```

## Internal Structure

### Shadow DOM Template

```html
<button part="design-token-button">
  <span id="token-name-display">Token Name</span>
</button>

<dialog id="dialog" part="design-token-dialog">
  <form method="dialog">
    <details name="token" open>
      <summary>Basic Info</summary>
      <!-- Name, Description, CSS Variable, Value inputs -->
    </details>
    <details name="token">
      <summary>Advanced Editor</summary>
      <!-- Type-specific editor loaded here -->
    </details>
    <details name="token">
      <summary>JSON Source</summary>
      <pre><!-- Raw JSON --></pre>
    </details>
    <button value="save">Save</button>
  </form>
</dialog>
```

### CSS Variable Preview

The component uses `--_v` custom property for live preview:

```javascript
// If CSS variable exists, use it
if (cssVar) {
  this.style.setProperty('--_v', `var(${cssVar})`);
} else {
  // Otherwise compute the value
  this.style.setProperty('--_v', toCssValue(token, this.#registry));
}
```

## Supported Token Types

Visual previews vary by type:

| Type | Preview Style |
|------|--------------|
| `color` | Color swatch with transparency grid |
| `gradient` | Gradient background |
| `shadow` | Box shadow preview |
| `border` | Border preview |
| `aspectRatio` | Aspect ratio box |
| `dimension` | Numeric value |
| `typography` | Typography composite |

## Advanced Editors

Type-specific editors are loaded on-demand:

```javascript
if ($type === 'color' && !isAlias) {
  await import('../design-token-editors/color/index.js');
  const editor = document.createElement('edit-color');
  editor.value = $value;
}
```

Currently supported:
- **color** → `<edit-color>` with full color space support

## Token Value Handling

### Color Tokens

When saving color tokens edited via the advanced editor:

```javascript
token.$value = {
  colorSpace: 'display-p3',
  components: [0.1, 0.46, 0.82],
  alpha: 1
};
```

### Alias Tokens

Reference tokens like `{color.brand.primary}` skip advanced editors:

```javascript
const isAlias = typeof $value === 'string'
  && $value.startsWith('{')
  && $value.endsWith('}');
```

### Other Types

Attempts JSON parse for objects/arrays, otherwise stores as string:

```javascript
if (finalValue.trim().startsWith('[') || finalValue.trim().startsWith('{')) {
  token.$value = JSON.parse(finalValue);
} else {
  token.$value = finalValue;
}
```

## Styling

Uses shared styles from `design-token-styles`:

```javascript
const cssUrl = new URL('../design-token-styles/index.css', import.meta.url).href;
const response = await fetch(cssUrl);
sharedSheet.replaceSync(text);
this.shadowRoot.adoptedStyleSheets = [sharedSheet];
```

### CSS Parts

```css
design-token::part(design-token-button) { /* Preview button */ }
design-token::part(design-token-dialog) { /* Edit dialog */ }
```

### Type-Specific Styling

```css
design-token[type="color"]::part(design-token-button)::before {
  /* Color swatch with transparency grid */
}
```

## Dependencies

- **design-token-utils**: `toCssValue()` for token-to-CSS conversion
- **design-token-styles**: Shared CSS for consistent styling
- **design-token-editors** (optional): Specialized editors loaded on-demand

## Implementation Notes

### Render ID Pattern

Prevents stale renders when async operations complete out of order:

```javascript
async render() {
  const renderId = ++this.#renderId;
  // ... async operations ...
  if (this.#renderId !== renderId) return; // Stale render, abort
}
```

### Dialog Close Handling

Uses `returnValue` to distinguish save vs cancel:

```javascript
handleDialogClose() {
  if (dialog.returnValue !== 'save') {
    this.render(); // Reset form
    return;
  }
  // Process save...
}
```

## Debugging Tips

1. **Preview not showing?** Check `--_v` CSS variable is set correctly
2. **Editor not loading?** Verify design-token-editors package is accessible
3. **Changes not saving?** Check dialog `returnValue` is "save"
4. **References not resolving?** Ensure registry is set before src
