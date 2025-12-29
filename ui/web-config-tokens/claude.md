# Web Config Tokens

## Overview

Web Config Tokens is a **web component for visualizing and editing W3C design tokens** with live preview and CSS generation. It serves as the main container that orchestrates the design token ecosystem.

## Architecture

### System Overview

```
web-config-tokens (this component)
  ├─ Loads tokens from JSON (src attribute)
  ├─ Builds token registry (design-token-utils)
  ├─ Generates CSS custom properties (design-token-utils)
  ├─ Injects CSS into shadow DOM
  └─ Renders <design-token> components
      ├─ Receives registry for reference resolution
      ├─ Uses CSS variables for live previews
      └─ Dispatches token-changed events
```

### Package Structure

```
web-config-tokens/
├── index.js              # Main web component (WebConfigTokens)
├── index.html            # Demo page
├── index.css             # Component styles
├── readme.md             # User documentation
├── package.json          # NPM package configuration
├── design.tokens.json    # Example tokens
├── design.tokens.css     # Generated CSS output
├── design.tokens.md      # Token specification
├── export-css.js         # CSS export script
├── data/                 # Additional token examples
├── figma/                # Figma integration
└── src/                  # Additional source files
```

### Dependencies

- **design-token-utils**: Token conversion, CSS export, reference resolution
- **design-token-styles**: Shared CSS for token editors
- **design-token**: Individual token display/edit component
- **design-token-editors**: Specialized editors (color, etc.)

## Features

- **W3C Compliant**: Supports W3C Design Tokens Format Module (2025)
- **Live CSS Generation**: Automatically generates CSS custom properties
- **Reference Resolution**: Resolves `{path.to.token}` to CSS variables
- **Interactive Editing**: Click any token to edit
- **Real-time Preview**: Token changes update CSS immediately
- **Hierarchical Display**: Organized groups with collapsible sections
- **Type-Specific Rendering**: Visual previews for all token types
- **Advanced Color Editor**: Full color space support

## Usage

### Basic

```html
<web-config-tokens src="design.tokens.json"></web-config-tokens>

<script type="module">
  import './web-config-tokens/index.js';
</script>
```

### Token File Format

W3C-compliant JSON:

```json
{
  "color": {
    "primitive": {
      "blue": {
        "500": {
          "$type": "color",
          "$value": "#1976D2",
          "$extensions": {
            "css": { "var": "--blue-500" }
          }
        }
      }
    },
    "semantic": {
      "primary": {
        "$type": "color",
        "$value": "{color.primitive.blue.500}",
        "$extensions": {
          "css": { "var": "--color-primary" }
        }
      }
    }
  }
}
```

## Generated CSS

```css
@layer design-tokens {
  :host {
    --blue-500: #1976D2;
    --color-primary: var(--blue-500);
  }
}
```

## API

### Attributes

| Attribute | Description | Required |
|-----------|-------------|----------|
| `src` | URL to design tokens JSON file | Yes |

### Events

#### `token-changed`

Fired when any token is modified:

```javascript
tokenViewer.addEventListener('token-changed', (e) => {
  const { token, cssVar } = e.detail;
  console.log('Token updated:', token);
  console.log('CSS variable:', cssVar);

  // Sync to database
  saveToken(token);
});
```

## Supported Token Types

### Basic Types

| Type | Description |
|------|-------------|
| `color` | Hex, RGB, HSL, wide gamut |
| `dimension` | Sizes with units |
| `number` | Unitless values |
| `duration` | Time values |
| `fontFamily` | Font stacks |
| `fontWeight` | 100-900 or keyword |
| `fontStyle` | italic, normal, oblique |

### Composite Types

| Type | Description |
|------|-------------|
| `gradient` | Linear, radial, conic |
| `shadow` | Box/text shadows |
| `border` | Border definitions |
| `typography` | Complete typography |
| `transition` | Transition definitions |

### Advanced Features

- **CSS Functions**: `light-dark()`, `clamp()`, `calc()`
- **Color Spaces**: sRGB, display-p3, OKLAB, OKLCH, LAB, LCH
- **Token References**: `{path.to.token}` syntax

## Token Organization

Tokens display hierarchically:

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

Generated CSS uses layers for cascade control:

```css
@layer design-tokens {
  :host {
    /* All token variables */
  }
}
```

## Token Editing

Click any token to open editor dialog with:

1. **Basic Info**: Name, description, CSS variable, value
2. **Advanced Editor**: Type-specific editors (color picker, etc.)
3. **JSON Source**: View/edit raw token JSON

Changes update preview immediately and dispatch `token-changed` event.

## Reference Resolution

References resolve to CSS variable references:

```json
{
  "primary": {
    "$value": "{color.primitive.blue.500}"
  }
}
```

Generates:

```css
--primary: var(--color-primitive-blue-500);
```

## W3C Compliance

Follows W3C Design Tokens specifications:
- **Format Module** (2025): Token structure and types
- **Color Module**: Wide gamut color support
- **Resolver**: Reference resolution semantics

## Integration

### Export to CSS File

```javascript
import { exportTokensToCSS } from './design-token-utils/index.js';

const css = exportTokensToCSS(tokens, {
  fileName: 'design.tokens.css',
  layer: 'design-tokens',
  selector: ':root'
});
```

### Figma Integration

See `/figma` directory for Figma plugin integration.

## Debugging Tips

1. **Tokens not loading?** Check `src` attribute URL
2. **CSS not generating?** Verify token `$value` structure
3. **References not resolving?** Check path matches token hierarchy
4. **Editor not appearing?** Verify design-token-editors is accessible
5. **Preview wrong color?** Check color space support in browser

## Browser Support

- Modern browsers with Shadow DOM
- CSS Custom Properties
- Constructable Stylesheets
- CSS Layers (gracefully degrades)
