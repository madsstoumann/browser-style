# Design Token Utils

Complete toolkit for working with W3C design tokens.

## Features

- **Converters**: Transform individual tokens to CSS values
- **Exporters**: Export token collections to CSS files
- **Validators**: Validate token structure
- **Resolvers**: Resolve token references

## Installation

```bash
npm install @browser-style/design-token-utils
```

## Quick Start

```javascript
import { exportTokensToCSS, toCssValue } from '@browser-style/design-token-utils';

// Export entire token collection
const css = exportTokensToCSS(tokens, {
  layer: 'design-tokens',
  selector: ':root'
});

// Convert individual token
const token = {
  $type: 'color',
  $value: { colorSpace: 'oklab', components: [0.7, 0.27, -0.08] }
};
const cssValue = toCssValue(token);
// → "oklab(0.7 0.27 -0.08)"
```

## API

### Exporters

#### `exportTokensToCSS(tokens, options)`

Exports design tokens to CSS custom properties.

```javascript
const css = exportTokensToCSS(tokens, {
  fileName: './output.css',  // Optional: write to file
  layer: 'design-tokens',     // CSS @layer name
  selector: ':root'           // CSS selector
});
```

#### `exportFromFile(jsonPath, options)`

Loads tokens from JSON file and exports to CSS (Node.js only).

```javascript
await exportFromFile('./tokens.json', {
  fileName: './output.css',
  layer: 'tokens',
  selector: ':root'
});
```

#### `injectTokensToPage(tokens, options)`

Injects tokens as `<style>` tag (browser only).

```javascript
injectTokensToPage(tokens, {
  layer: 'tokens',
  selector: ':root'
});
```

### Converters

#### `toCssValue(token, registry?)`

Main converter - converts any token to CSS value.

```javascript
const css = toCssValue({
  $type: 'color',
  $value: 'color(display-p3 0.1 0.46 0.82)'
});
```

#### Individual Converters

- `generateColorValue(value, registry?)`
- `generateGradientValue(value, cssExt, registry?)`
- `generateShadowValue(value, registry?)`
- `generateBorderValue(value, registry?)`
- `generateTypographyValue(value, registry?)`

### Validators

- `isValidToken(obj)` - Check if object is valid token
- `validateTokenStructure(token)` - Validate token structure
- `isColorToken(token)` - Check if color token
- `isGradientToken(token)` - Check if gradient token
- `isShadowToken(token)` - Check if shadow token

### Resolvers

- `resolveReference(value, registry)` - Resolve `{path.to.token}` references
- `buildRegistry(tokens)` - Build token registry from tokens object

## Supported Token Types

- `color` - All color formats (hex, rgb, oklab, display-p3, etc.)
- `gradient` - Linear, radial, conic gradients
- `shadow` - Single and multiple shadows
- `border` - Border values
- `typography` - Composite typography tokens
- `dimension`, `duration`, `number` - Numeric values
- `fontFamily`, `fontWeight`, `fontStyle` - Typography values
- `cubicBezier` - Animation easing
- `transition` - Transition values

## Color Format Support

✅ RGB-like spaces (wrapped in `color()` function):
- `display-p3`, `srgb`, `rec2020`, etc.

✅ Perceptual spaces (direct functions):
- `oklab`, `oklch`, `lab`, `lch`

```javascript
// display-p3 → color(display-p3 0.1 0.46 0.82)
// oklab → oklab(0.7 0.27 -0.08)
```

## License

MIT
