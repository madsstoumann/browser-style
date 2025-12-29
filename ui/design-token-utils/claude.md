# Design Token Utils

## Overview

Design Token Utils is a **complete toolkit for working with W3C design tokens**. It provides converters, exporters, validators, and resolvers for transforming design tokens into CSS and other formats.

## Architecture

### Package Structure

```
design-token-utils/
├── index.js              # Main exports and entry point
├── README.md             # User documentation
├── package.json          # NPM package configuration
├── converters/           # Token-to-CSS converters
│   ├── color.js          # Color token converter
│   ├── gradient.js       # Gradient converter
│   ├── shadow.js         # Shadow converter
│   ├── border.js         # Border converter
│   └── typography.js     # Typography converter
├── exporters/            # Collection exporters
│   └── css.js            # CSS file exporter
├── resolvers/            # Reference resolution
│   └── reference.js      # {path.to.token} resolver
└── validators/           # Token validation
    └── structure.js      # Structure validators
```

### System Role

```
Token JSON → design-token-utils → CSS Custom Properties
                ├─ Converters: Individual token → CSS value
                ├─ Exporters: Token collection → CSS file
                ├─ Resolvers: Reference → CSS variable
                └─ Validators: Token → boolean
```

## API Reference

### Main Export: `toCssValue(token, registry?)`

Converts any token to its CSS value:

```javascript
import { toCssValue } from '@browser-style/design-token-utils';

const token = {
  $type: 'color',
  $value: { colorSpace: 'oklab', components: [0.7, 0.27, -0.08] }
};

const css = toCssValue(token);
// → "oklab(0.7 0.27 -0.08)"
```

### Exporters

#### `exportTokensToCSS(tokens, options)`

Exports design tokens to CSS custom properties:

```javascript
import { exportTokensToCSS } from '@browser-style/design-token-utils';

const css = exportTokensToCSS(tokens, {
  layer: 'design-tokens',     // CSS @layer name
  selector: ':root'           // CSS selector
});

// Output:
// @layer design-tokens {
//   :root {
//     --blue-500: #1976D2;
//     --color-primary: var(--blue-500);
//   }
// }
```

#### `exportFromFile(jsonPath, options)`

Node.js only - loads tokens from file and exports:

```javascript
await exportFromFile('./tokens.json', {
  fileName: './output.css',
  layer: 'tokens',
  selector: ':root'
});
```

#### `injectTokensToPage(tokens, options)`

Browser only - injects tokens as `<style>` tag:

```javascript
injectTokensToPage(tokens, {
  layer: 'tokens',
  selector: ':root'
});
```

### Converters

#### `generateColorValue(value, registry?)`

```javascript
// Hex
generateColorValue('#1976D2');  // → "#1976D2"

// RGB-like spaces (wrapped in color())
generateColorValue({
  colorSpace: 'display-p3',
  components: [0.1, 0.46, 0.82]
});  // → "color(display-p3 0.1 0.46 0.82)"

// Perceptual spaces (direct function)
generateColorValue({
  colorSpace: 'oklab',
  components: [0.7, 0.27, -0.08]
});  // → "oklab(0.7 0.27 -0.08)"
```

#### `generateGradientValue(value, cssExt, registry?)`

```javascript
generateGradientValue({
  type: 'linear',
  angle: '90deg',
  stops: [
    { color: '#ff0000', position: '0%' },
    { color: '#0000ff', position: '100%' }
  ]
});  // → "linear-gradient(90deg, #ff0000 0%, #0000ff 100%)"
```

#### `generateShadowValue(value, registry?)`

```javascript
// Single shadow
generateShadowValue({
  offsetX: '0px', offsetY: '4px',
  blur: '8px', spread: '0px',
  color: 'rgba(0,0,0,0.2)'
});

// Multiple shadows (array)
generateShadowValue([shadow1, shadow2]);
```

#### `generateBorderValue(value, registry?)`

```javascript
generateBorderValue({
  width: '1px', style: 'solid', color: '#ccc'
});  // → "1px solid #ccc"
```

#### `generateTypographyValue(value, registry?)`

```javascript
generateTypographyValue({
  fontFamily: 'Inter, sans-serif',
  fontSize: '1rem',
  fontWeight: '500',
  lineHeight: '1.5'
});
```

### Resolvers

#### `resolveReference(value, registry)`

Resolves `{path.to.token}` references:

```javascript
const registry = buildRegistry(tokens);

resolveReference('{color.brand.primary}', registry);
// → "var(--color-brand-primary)"
```

#### `buildRegistry(tokens)`

Builds a flat Map of all tokens:

```javascript
const tokens = {
  color: {
    brand: {
      primary: { $type: 'color', $value: '#1976D2' }
    }
  }
};

const registry = buildRegistry(tokens);
// Map { 'color.brand.primary' => { $type: 'color', $value: '#1976D2' } }
```

### Validators

```javascript
import {
  isValidToken,
  validateTokenStructure,
  isColorToken,
  isGradientToken,
  isShadowToken
} from '@browser-style/design-token-utils';

isValidToken(obj);            // boolean
validateTokenStructure(token); // { valid: boolean, errors: string[] }
isColorToken(token);          // boolean
isGradientToken(token);       // boolean
isShadowToken(token);         // boolean
```

## Supported Token Types

| Type | CSS Output |
|------|------------|
| `color` | Hex, RGB, HSL, OKLAB, OKLCH, display-p3, etc. |
| `gradient` | linear-gradient, radial-gradient, conic-gradient |
| `shadow` | box-shadow value (single or multiple) |
| `border` | border shorthand |
| `typography` | font shorthand or individual properties |
| `dimension` | Value with unit (px, rem, em, %, vw, vh) |
| `duration` | Time value (ms, s) |
| `number` | Unitless number |
| `fontFamily` | Font stack string |
| `fontWeight` | 100-900 or keyword |
| `fontStyle` | normal, italic, oblique |
| `cubicBezier` | cubic-bezier() function |
| `transition` | transition shorthand |

## Color Space Handling

### RGB-like Spaces

Wrapped in `color()` function:

```css
color(srgb 0.1 0.46 0.82)
color(display-p3 0.1 0.46 0.82)
color(rec2020 0.1 0.46 0.82)
```

### Perceptual Spaces

Direct function syntax:

```css
oklab(0.7 0.27 -0.08)
oklch(0.7 0.27 240)
lab(70 27 -8)
lch(70 28 340)
```

## Token Reference Resolution

References use `{path.to.token}` syntax:

```json
{
  "color": {
    "primitive": {
      "blue-500": { "$value": "#1976D2" }
    },
    "semantic": {
      "primary": { "$value": "{color.primitive.blue-500}" }
    }
  }
}
```

Resolves to CSS variable references:

```css
--color-semantic-primary: var(--color-primitive-blue-500);
```

## Integration with design-token

```javascript
import { toCssValue, buildRegistry } from '../design-token-utils/index.js';

// Build registry for reference resolution
const registry = buildRegistry(allTokens);

// Convert individual token to CSS
const cssValue = toCssValue(token, registry);

// Use for preview
this.style.setProperty('--_v', cssValue);
```

## W3C Compliance

Follows W3C Design Tokens specifications:
- **Format Module** (2025): Token structure and types
- **Color Module**: Wide gamut color support
- **Resolver**: Reference resolution semantics

## Registry Building Details

The `buildRegistry` function recursively traverses the token tree:

```javascript
function collectTokens(obj, path, registry) {
  // Is this a token? (has $value)
  if ('$value' in obj) {
    const cssVar = obj.$extensions?.css?.var || generateCSSVarName(path);
    registry.set(path.join('.'), {
      path,
      cssVar,
      $type: obj.$type,
      $value: obj.$value,
      $extensions: obj.$extensions
    });
    return;
  }

  // Recursively process children, skipping $ prefixed properties
  for (const [key, value] of Object.entries(obj)) {
    if (!key.startsWith('$')) {
      collectTokens(value, [...path, key], registry);
    }
  }
}
```

### CSS Variable Name Generation

```javascript
function generateCSSVarName(path) {
  return '--' + path.join('-').replace(/\./g, '-');
}
// ['color', 'brand', 'primary'] → '--color-brand-primary'
```

## Color Space Categories

### RGB-like Spaces (use `color()` wrapper)
```javascript
const rgbLikeSpaces = [
  'display-p3',
  'srgb',
  'srgb-linear',
  'rec2020',
  'a98-rgb',
  'prophoto-rgb',
  'xyz',
  'xyz-d50',
  'xyz-d65'
];
// Output: color(display-p3 0.1 0.46 0.82)
```

### Perceptual Spaces (direct function)
```javascript
// oklab, oklch, lab, lch, hwb, hsl
// Output: oklab(0.7 0.27 -0.08)
```

### Legacy RGB/HSL Handling

RGB values are converted from 0-1 to 0-255:
```javascript
if (space === 'rgb') {
  const [r, g, b] = components.map(c => Math.round(c * 255));
  return `rgb(${r} ${g} ${b})`;
}
```

HSL saturation/lightness are converted to percentages:
```javascript
if (space === 'hsl') {
  const hue = h;
  const sat = `${s * 100}%`;
  const light = `${l * 100}%`;
  return `hsl(${hue} ${sat} ${light})`;
}
```

## CSS Functions Extension

Tokens can specify CSS functions via `$extensions.css`:

```json
{
  "$type": "color",
  "$value": "#000",
  "$extensions": {
    "css": {
      "fn": "light-dark",
      "args": ["{color.light}", "{color.dark}"]
    }
  }
}
```

Outputs: `light-dark(var(--color-light), var(--color-dark))`

## File Structure (Detailed)

```
design-token-utils/
├── index.js                    # Main exports (~68 lines)
├── converters/
│   ├── index.js               # Main toCssValue (~79 lines)
│   ├── color.js               # generateColorValue (~77 lines)
│   ├── gradient.js            # generateGradientValue
│   ├── shadow.js              # generateShadowValue
│   ├── border.js              # generateBorderValue
│   └── typography.js          # typography functions
├── exporters/
│   ├── index.js               # Exporter exports
│   └── toCSS.js               # CSS exporter
├── resolvers/
│   └── index.js               # resolveReference, buildRegistry (~83 lines)
└── validators/
    └── index.js               # Token validators
```

## Debugging Tips

1. **Reference not resolving?** Check registry has the referenced path
2. **Wrong color format?** Verify colorSpace matches expected output
3. **CSS invalid?** Check token $type matches $value structure
4. **Export empty?** Ensure tokens have $value property
5. **CSS variable name wrong?** Check if `$extensions.css.var` is set
