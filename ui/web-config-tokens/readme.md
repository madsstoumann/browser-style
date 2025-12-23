# Web Config Tokens

A web component for visualizing and editing W3C design tokens with live preview and CSS generation.

## Overview

The `<web-config-tokens>` component provides a complete interface for managing design token systems. It loads W3C-compliant design tokens from JSON, generates CSS custom properties, and provides interactive editing capabilities through nested `<design-token>` components.

## Features

- ✅ **W3C Compliant**: Supports W3C Design Tokens Format Module (2025)
- ✅ **Live CSS Generation**: Automatically generates CSS custom properties from tokens
- ✅ **Reference Resolution**: Resolves `{path.to.token}` references to CSS variables
- ✅ **Interactive Editing**: Click any token to edit with specialized editors
- ✅ **Real-time Preview**: Token changes update CSS variables immediately
- ✅ **Hierarchical Display**: Organized token groups with collapsible sections
- ✅ **Type-Specific Rendering**: Visual previews for colors, gradients, shadows, borders
- ✅ **Advanced Color Editor**: Full color space support (sRGB, display-p3, OKLAB, OKLCH, etc.)

## Quick Start

```html
<web-config-tokens src="design.tokens.json"></web-config-tokens>

<script type="module" src="./web-config-tokens/index.js"></script>
```

## Architecture

The component is part of a modular design token system:

```
web-config-tokens
  ├─ Loads tokens from JSON
  ├─ Builds token registry (design-token-utils)
  ├─ Generates CSS custom properties (design-token-utils)
  ├─ Injects CSS into shadow DOM
  └─ Renders design-token components
      ├─ Uses CSS variables for previews
      ├─ Loads specialized editors (design-token-editors)
      └─ Dispatches token-changed events
```

### Package Dependencies

- **design-token-utils** - Token conversion, CSS export, reference resolution
- **design-token-styles** - Shared CSS for token editors
- **design-token** - Individual token display/edit component
- **design-token-editors** - Specialized editors (color, gradient, etc.)

## Usage

### Basic Implementation

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Design Tokens</title>
</head>
<body>
  <web-config-tokens src="design.tokens.json"></web-config-tokens>
  <script type="module" src="./web-config-tokens/index.js"></script>
</body>
</html>
```

### Token File Format

Your `design.tokens.json` should follow the W3C specification:

```json
{
  "color": {
    "primitive": {
      "blue": {
        "500": {
          "$type": "color",
          "$value": "#1976D2",
          "$extensions": { "css": { "var": "--blue-500" } }
        }
      }
    },
    "semantic": {
      "primary": {
        "$type": "color",
        "$value": "{color.primitive.blue.500}",
        "$extensions": { "css": { "var": "--color-primary" } }
      }
    }
  }
}
```

## Features in Detail

### Automatic CSS Generation

The component generates CSS custom properties from all tokens:

```javascript
// Generated CSS is injected into shadow DOM
@layer design-tokens {
  :host {
    --blue-500: #1976D2;
    --color-primary: var(--blue-500);
  }
}
```

### Reference Resolution

Token references like `{path.to.token}` are automatically resolved:

```json
{
  "spacing": {
    "base": { "$value": "1rem" },
    "large": { "$value": "{spacing.base}" }  // Resolves to var(--spacing-base)
  }
}
```

### Live Token Editing

Click any token to open an editor dialog:

1. **Basic editing** - Name, description, CSS variable name, value
2. **Advanced editor** - Type-specific editors (color picker, etc.)
3. **JSON source** - View/edit raw token JSON
4. **Real-time preview** - Changes update immediately

### Event System

Listen for token changes to sync with your data source:

```javascript
const tokenViewer = document.querySelector('web-config-tokens');

tokenViewer.addEventListener('token-changed', (e) => {
  const { token, cssVar } = e.detail;
  console.log('Token updated:', token);
  console.log('CSS variable:', cssVar);

  // Sync to database, localStorage, etc.
  saveToken(token);
});
```

## Supported Token Types

### Basic Types
- **color** - Hex, RGB, HSL, wide gamut (display-p3, OKLAB, OKLCH)
- **dimension** - Sizes with units (px, rem, em, %, vw, vh)
- **number** - Unitless values (opacity, z-index, line-height)
- **duration** - Time values (ms, s)
- **fontFamily** - Font stacks
- **fontWeight** - Font weights (100-900)
- **fontStyle** - italic, normal, oblique

### Composite Types
- **gradient** - Linear, radial, conic gradients
- **shadow** - Box shadows, text shadows (single or multiple)
- **border** - Border definitions (width, style, color)
- **typography** - Complete typography tokens
- **transition** - Transition definitions

### Advanced Features
- **CSS Functions** - light-dark(), clamp(), calc()
- **Color Spaces** - sRGB, display-p3, OKLAB, OKLCH, LAB, LCH
- **Token References** - `{path.to.token}` syntax
- **Aliases** - Reference tokens that inherit from other tokens

## Advanced Color Support

The integrated color editor supports all modern color spaces:

- **sRGB** - Standard web colors
- **display-p3** - Wide gamut for modern displays
- **OKLAB** - Perceptually uniform color space
- **OKLCH** - OKLAB in cylindrical coordinates
- **LAB** - CIE LAB color space
- **LCH** - CIE LCH color space
- **HSL** - Hue, Saturation, Lightness
- **HWB** - Hue, Whiteness, Blackness

## Token Organization

Tokens are organized hierarchically with collapsible groups:

```
Color
  ├─ Primitive
  │   ├─ Neutral
  │   │   ├─ 0 (white)
  │   │   └─ 950 (black)
  │   └─ Brand
  │       └─ 500 (primary)
  └─ Semantic
      ├─ primary
      └─ surface
```

## CSS Layer Support

Generated CSS uses CSS layers for cascade control:

```css
@layer design-tokens {
  :host {
    /* All token variables */
  }
}
```

Configure the layer name via the component's internal options.

## Browser Support

- Modern browsers with Shadow DOM support
- CSS Custom Properties
- Constructable Stylesheets
- CSS Layers (optional, gracefully degrades)

## Development

### File Structure

```
web-config-tokens/
├── index.js              # Main component
├── demo.html             # Live demo
├── design.tokens.json    # Example tokens
├── design.tokens.md      # Token specification
├── package.json          # Package config
├── readme.md             # This file
└── data/                 # Additional token examples
```

### Testing

Open `demo.html` in a browser to see the component in action with example tokens.

## API Reference

### Attributes

#### `src` (required)
URL to the design tokens JSON file.

```html
<web-config-tokens src="tokens.json"></web-config-tokens>
```

### Events

#### `token-changed`
Fired when any token is modified and saved.

```javascript
{
  detail: {
    token: {/* full token object */},
    cssVar: '--variable-name'
  }
}
```

## Related Packages

- **@browser-style/design-token-utils** - Token conversion and CSS export utilities
- **@browser-style/design-token-styles** - Shared CSS for token editors
- **@browser-style/design-token-editors** - Specialized token editors (color, gradient, etc.)

## W3C Compliance

This component follows:
- **W3C Design Tokens Format Module (2025)**: Token structure and types
- **W3C Design Tokens Resolver**: Reference resolution
- **W3C Color Module**: Wide gamut color support

## Resources

- [W3C Design Tokens Format](https://www.w3.org/community/reports/design-tokens/CG-FINAL-format-20251028/)
- [W3C Design Tokens Color](https://www.w3.org/community/reports/design-tokens/CG-FINAL-color-20251028/)
- [W3C Design Tokens Resolver](https://www.w3.org/community/reports/design-tokens/CG-FINAL-resolver-20251028/)
- [design.tokens.md](./design.tokens.md) - Full token specification

## License

MIT
