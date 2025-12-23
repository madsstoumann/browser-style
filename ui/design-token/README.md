# Design Token Component

A web component for displaying and editing W3C design tokens.

## Overview

The `<design-token>` component provides a visual interface for viewing and editing individual design tokens. It displays a preview button showing the token's value and opens a dialog for editing when clicked.

## Features

- **Visual Preview**: Shows a preview of the token value (color swatch, border, shadow, etc.)
- **Type-Specific Rendering**: Different preview styles for different token types
- **Advanced Editors**: Loads specialized editors for complex token types (e.g., color picker)
- **Dialog Interface**: Edit token properties in a modal dialog
- **JSON Source View**: View and edit the raw token JSON
- **CSS Variable Support**: Uses CSS custom properties for previews when available

## Usage

```html
<design-token name="Primary Color"></design-token>

<script type="module">
  import './design-token/index.js';

  const token = document.querySelector('design-token');

  // Set the token data
  token.src = {
    $type: 'color',
    $value: '#1976D2',
    $description: 'Primary brand color',
    $extensions: {
      css: { var: '--color-primary' }
    }
  };

  // Optionally provide a registry for reference resolution
  token.registry = myTokenRegistry;
</script>
```

## Properties

### `src` (setter/getter)
The token object to display and edit.

```javascript
token.src = {
  $type: 'color',
  $value: { colorSpace: 'oklab', components: [0.7, 0.27, -0.08] },
  $description: 'A vibrant blue in OKLAB color space',
  $extensions: {
    css: { var: '--brand-blue' }
  }
};
```

### `registry` (setter/getter)
A Map containing all tokens for resolving references like `{path.to.token}`.

```javascript
import { buildRegistry } from '../design-token-utils/index.js';
const registry = buildRegistry(allTokens);
token.registry = registry;
```

## Attributes

### `name`
The display name of the token shown on the button and in the dialog title.

```html
<design-token name="Primary Color"></design-token>
```

### `type`
Automatically set based on the token's `$type`. Used for type-specific styling.

Values: `color`, `gradient`, `shadow`, `border`, `typography`, `dimension`, etc.

## Events

### `token-changed`
Fired when the token value is modified and saved. Bubbles and composes through shadow DOM.

```javascript
token.addEventListener('token-changed', (e) => {
  const { token, cssVar } = e.detail;
  console.log('Token updated:', token);
  console.log('CSS variable:', cssVar);
});
```

## Supported Token Types

- **color** - Shows color swatch with transparency pattern
- **gradient** - Shows gradient preview
- **shadow** - Shows box shadow preview
- **border** - Shows border preview
- **aspectRatio** - Shows aspect ratio box
- **typography** - Composite typography tokens
- **dimension**, **duration**, **number** - Numeric values
- **fontFamily**, **fontWeight**, **fontStyle** - Typography values

## Advanced Editors

For certain token types, the component dynamically loads specialized editors:

- **color** → Loads `<edit-color>` from design-token-editors package

More editors coming soon for gradients, shadows, borders, etc.

## Dependencies

- **design-token-utils** - For token-to-CSS conversion (`toCssValue`)
- **design-token-styles** - Shared CSS for consistent styling
- **design-token-editors** (optional) - Specialized editors loaded on-demand

## Architecture

The component works as part of a larger design token system:

```
web-config-tokens (container)
  ├─ Generates CSS custom properties from all tokens
  ├─ Builds token registry for reference resolution
  └─ Creates multiple <design-token> components
      ├─ Receives registry for reference resolution
      ├─ Uses CSS variables for previews (--_v)
      └─ Loads specialized editors on-demand
```

## Styling

The component uses CSS parts for styling:

```css
design-token::part(design-token-button) {
  /* Style the preview button */
}

design-token::part(design-token-dialog) {
  /* Style the edit dialog */
}
```

Type-specific styling is applied via the `type` attribute:

```css
design-token[type="color"]::part(design-token-button)::before {
  /* Color-specific preview styles */
}
```

## Example: Full Integration

```javascript
import { buildRegistry } from '../design-token-utils/index.js';
import '../design-token/index.js';

// Load tokens
const tokens = await fetch('tokens.json').then(r => r.json());
const registry = buildRegistry(tokens);

// Create token component
const tokenEl = document.createElement('design-token');
tokenEl.setAttribute('name', 'Primary Color');
tokenEl.registry = registry;
tokenEl.src = tokens.color.brand.primary;

// Listen for changes
tokenEl.addEventListener('token-changed', (e) => {
  // Update your token data source
  updateTokenInDatabase(e.detail.token);
});

document.body.appendChild(tokenEl);
```

## License

MIT
