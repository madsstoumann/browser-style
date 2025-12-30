# Design Token Utils - Internal Architecture

## Overview

Design Token Utils is a **complete toolkit for working with W3C design tokens**. It provides converters, exporters, validators, and resolvers for transforming design tokens into CSS and other formats.

**Package Type:** ES Module library (no UI)

**Package Version:** 1.0.0

**Total LOC:** 693 lines across 11 files

**Key architectural decisions:**
- **Modular converters**: Each token type has dedicated converter
- **Registry-driven resolution**: Map-based lookup for references
- **Environment-aware exports**: Node.js and browser support
- **W3C compliance**: Follows Design Tokens Format specification
- **Zero external dependencies**: Pure JavaScript

## Architecture Overview

### System Role

```
Token JSON → design-token-utils → CSS Custom Properties
                ├─ Converters: Individual token → CSS value
                ├─ Exporters: Token collection → CSS file
                ├─ Resolvers: Reference → CSS variable
                └─ Validators: Token → boolean
```

### Converter Pipeline

```
Token Object
  ↓
toCssValue(token, registry)
  ↓
Check $extensions.css for CSS functions
  ↓
Switch on $type
  ↓
Call type-specific converter
  ↓
Resolve any {references} via registry
  ↓
Return CSS string
```

### Exporter Pipeline

```
Token Collection (JSON)
  ↓
buildRegistry(tokens)
  ↓
For each token in registry:
  ├─ toCssValue(token, registry)
  └─ Format as CSS property
  ↓
Wrap in @layer and selector
  ↓
Output CSS string (or write to file)
```

## File Structure

```
design-token-utils/
├── index.js                    67 lines   Main exports
├── package.json                33 lines   NPM configuration
├── converters/
│   ├── index.js                78 lines   Main toCssValue dispatcher
│   ├── color.js                76 lines   Color token converter
│   ├── gradient.js             53 lines   Gradient converter
│   ├── shadow.js               26 lines   Shadow converter
│   ├── border.js               19 lines   Border converter
│   └── typography.js           62 lines   Typography converter
├── exporters/
│   ├── index.js                15 lines   Exporter exports
│   └── toCSS.js               116 lines   CSS exporter
├── resolvers/
│   └── index.js                82 lines   Reference resolver
└── validators/
    └── index.js                66 lines   Token validators
```

## Converters API

### Main Entry: `toCssValue()` (converters/index.js)

**Lines 29-78**

```javascript
import { toCssValue } from '@browser-style/design-token-utils';

const token = {
  $type: 'color',
  $value: { colorSpace: 'oklab', components: [0.7, 0.27, -0.08] }
};

const css = toCssValue(token, registry);
// → "oklab(0.7 0.27 -0.08)"
```

**CSS Functions Extension (Lines 32-37):**
```javascript
// Token with CSS function
const token = {
  $type: 'color',
  $value: '#000',
  $extensions: {
    css: {
      fn: 'light-dark',
      args: ['{color.light}', '{color.dark}']
    }
  }
};
// → "light-dark(var(--color-light), var(--color-dark))"
```

**Type Dispatch (Lines 40-77):**

| Type | Converter | Output Example |
|------|-----------|----------------|
| `color` | generateColorValue | `oklab(0.7 0.27 -0.08)` |
| `gradient` | generateGradientValue | `linear-gradient(90deg, #f00 0%, #00f 100%)` |
| `shadow` | generateShadowValue | `0px 4px 8px rgba(0,0,0,0.2)` |
| `border` | generateBorderValue | `1px solid #ccc` |
| `typography` | generateTypographyValue | `500 1rem/1.5 Inter` |
| `fontFamily` | generateFontFamilyValue | `Inter, sans-serif` |
| `cubicBezier` | direct | `cubic-bezier(0.4, 0, 0.2, 1)` |
| `transition` | generateTransitionValue | `all 0.3s ease` |
| `dimension` | direct | `16px` |
| `duration` | direct | `300ms` |
| `number` | String() | `1.5` |
| `fontWeight` | direct | `500` |
| `fontStyle` | direct | `italic` |
| `aspectRatio` | direct | `16/9` |
| `custom-path` | direct | `path('M0 0...')` |

### Color Converter (converters/color.js)

**Lines 14-76**

```javascript
import { generateColorValue } from '@browser-style/design-token-utils';

// Hex string
generateColorValue('#1976D2');  // → "#1976D2"

// W3C token format - RGB-like space
generateColorValue({
  colorSpace: 'display-p3',
  components: [0.1, 0.46, 0.82]
});  // → "color(display-p3 0.1 0.46 0.82)"

// W3C token format - Perceptual space
generateColorValue({
  colorSpace: 'oklab',
  components: [0.7, 0.27, -0.08]
});  // → "oklab(0.7 0.27 -0.08)"

// With alpha
generateColorValue({
  colorSpace: 'oklch',
  components: [0.7, 0.27, 240],
  alpha: 0.5
});  // → "oklch(0.7 0.27 240 / 0.5)"
```

#### Color Space Categories (Line 51)

**RGB-like Spaces** (use `color()` wrapper):
- `display-p3`, `srgb`, `srgb-linear`, `rec2020`, `a98-rgb`, `prophoto-rgb`
- `xyz`, `xyz-d50`, `xyz-d65`

**Perceptual Spaces** (direct function):
- `oklab`, `oklch`, `lab`, `lch`, `hwb`, `hsl`

#### Legacy RGB/HSL Handling

**RGB (Lines 26-33):**
```javascript
// Input: components as 0-1 range
// Output: 0-255 range
const [r, g, b] = components.map(c => c === 'none' ? 'none' : Math.round(c * 255));
// → "rgb(128 191 255)"
```

**HSL (Lines 35-43):**
```javascript
// Input: hue in degrees, s/l as 0-1
// Output: hue degrees, s/l as percentages
const sat = s === 'none' ? 'none' : `${s * 100}%`;
// → "hsl(210 50% 75%)"
```

### Gradient Converter (converters/gradient.js)

**Lines 15-53**

```javascript
import { generateGradientValue } from '@browser-style/design-token-utils';

generateGradientValue({
  type: 'linear',
  angle: '90deg',
  stops: [
    { color: '#ff0000', position: 0 },
    { color: '#0000ff', position: 1 }
  ]
});
// → "linear-gradient(90deg, #ff0000 0%, #0000ff 100%)"
```

**Stop Position Scaling (Line 24):**
```javascript
// Input: 0-1 range
// Output: 0-100%
const position = stop.position !== undefined ? ` ${stop.position * 100}%` : '';
```

**Gradient Types (Lines 28-48):**
- `linear`: `${angle}, ${stops}`
- `radial`: `${shape} at ${position}, ${stops}`
- `conic`: `from ${angle} at ${position}, ${stops}`

### Shadow Converter (converters/shadow.js)

**Lines 14-26**

```javascript
import { generateShadowValue } from '@browser-style/design-token-utils';

// Single shadow
generateShadowValue({
  offsetX: '0px',
  offsetY: '4px',
  blur: '8px',
  spread: '0px',
  color: 'rgba(0,0,0,0.2)'
});
// → "0px 4px 8px 0px rgba(0,0,0,0.2)"

// Multiple shadows (array)
generateShadowValue([shadow1, shadow2]);
// → "0px 4px 8px ... , 0px 2px 4px ..."
```

### Border Converter (converters/border.js)

**Lines 10-19**

```javascript
import { generateBorderValue } from '@browser-style/design-token-utils';

generateBorderValue({
  width: '1px',
  style: 'solid',
  color: '#ccc'
});
// → "1px solid #ccc"
```

**Style Default (Line 15):**
```javascript
const style = value.style || 'solid';
```

### Typography Converter (converters/typography.js)

**Lines 20-62**

```javascript
import { generateTypographyValue } from '@browser-style/design-token-utils';

generateTypographyValue({
  fontFamily: 'Inter, sans-serif',
  fontSize: '1rem',
  fontWeight: '500',
  lineHeight: '1.5'
});
// → "500 1rem/1.5 Inter, sans-serif"
```

## Exporters API

### `exportTokensToCSS()` (exporters/toCSS.js)

**Lines 18-55**

```javascript
import { exportTokensToCSS } from '@browser-style/design-token-utils';

const css = exportTokensToCSS(tokens, {
  layer: 'design-tokens',
  selector: ':root'
});

// Output:
// @layer design-tokens {
//   :root {
//     --blue-500: #1976D2;
//     --color-primary: var(--blue-500);
//   }
// }
```

**Options:**
| Option | Default | Purpose |
|--------|---------|---------|
| `fileName` | null | Output file path (Node.js) |
| `layer` | 'base' | CSS @layer name |
| `selector` | ':root' | CSS selector |

**Config from Token (Lines 19-24):**
```javascript
const config = tokens.$extensions?.export || {};
const { fileName = config.fileName || null, ... } = options;
```

Token-level config serves as defaults, options override.

### `exportFromFile()` (exporters/toCSS.js)

**Lines 69-95** (Node.js only)

```javascript
await exportFromFile('./tokens.json', {
  fileName: './output.css',
  layer: 'tokens',
  selector: ':root'
});
// Logs: "CSS exported to: /path/to/output.css"
```

**File Path Resolution (Lines 81-87):**
```javascript
// options.fileName: relative to CWD
outputPath = path.resolve(options.fileName);

// config.fileName (from token): relative to JSON file
outputPath = path.resolve(jsonDir, config.fileName);
```

### `injectTokensToPage()` (exporters/toCSS.js)

**Lines 105-116** (Browser only)

```javascript
import { injectTokensToPage } from '@browser-style/design-token-utils';

injectTokensToPage(tokens, {
  layer: 'tokens',
  selector: ':root'
});
// Creates <style data-tokens="design-tokens">...</style>
```

## Resolvers API

### `resolveReference()` (resolvers/index.js)

**Lines 11-35**

```javascript
import { resolveReference, buildRegistry } from '@browser-style/design-token-utils';

const registry = buildRegistry(tokens);
resolveReference('{color.brand.primary}', registry);
// → "var(--color-brand-primary)"
```

**Reference Pattern (Line 18):**
```javascript
const referencePattern = /\{([^}]+)\}/g;
```

**Missing Reference Warning (Line 28):**
```javascript
if (!ref) {
  console.warn(`Token reference not found: ${match}`);
  return match;  // Return original string
}
```

### `buildRegistry()` (resolvers/index.js)

**Lines 38-82**

```javascript
const tokens = {
  color: {
    brand: {
      primary: { $type: 'color', $value: '#1976D2' }
    }
  }
};

const registry = buildRegistry(tokens);
// Map {
//   'color.brand.primary' => {
//     path: ['color', 'brand', 'primary'],
//     cssVar: '--color-brand-primary',
//     $type: 'color',
//     $value: '#1976D2'
//   }
// }
```

**Recursive Traversal (Lines 50-73):**
```javascript
function collectTokens(obj, path, registry) {
  if ('$value' in obj) {
    // This is a token - add to registry
    registry.set(path.join('.'), { ... });
    return;
  }

  // Recurse into children
  for (const [key, value] of Object.entries(obj)) {
    if (!key.startsWith('$')) {  // Skip $ properties
      collectTokens(value, [...path, key], registry);
    }
  }
}
```

**CSS Variable Generation (Line 81):**
```javascript
function generateCSSVarName(path) {
  return '--' + path.join('-').replace(/\./g, '-');
}
// ['color', 'brand', 'primary'] → '--color-brand-primary'
```

## Validators API (validators/index.js)

### `isValidToken()` (Lines 11-14)

```javascript
isValidToken(obj);  // boolean
// True if obj exists and has $value property
```

### `validateTokenStructure()` (Lines 20-38)

```javascript
validateTokenStructure(token);
// { valid: boolean, errors: string[] }
```

### Type Checkers (Lines 43-66)

```javascript
isColorToken(token);     // $type === 'color'
isGradientToken(token);  // $type === 'gradient'
isShadowToken(token);    // $type === 'shadow'
```

## Module Exports

### Main Entry (index.js)

```javascript
// Named exports
export { toCssValue, generateColorValue, ... } from './converters/index.js';
export { exportTokensToCSS, exportFromFile, injectTokensToPage } from './exporters/index.js';
export { isValidToken, validateTokenStructure, ... } from './validators/index.js';
export { resolveReference, buildRegistry } from './resolvers/index.js';

// Default export
export default { /* all functions */ };
```

### Package Exports (package.json)

```json
{
  ".": "./index.js",
  "./converters": "./converters/index.js",
  "./exporters": "./exporters/index.js",
  "./validators": "./validators/index.js",
  "./resolvers": "./resolvers/index.js"
}
```

## Gotchas & Edge Cases

### Converter Edge Cases

#### 1. Color 'none' Keyword (color.js lines 29, 37, 47)

```javascript
c === 'none' ? 'none' : c
```
CSS `none` keyword preserved for missing components.

#### 2. Legacy RGB/HSL Detection (color.js line 26)

Only `rgb` and `hsl` get 0-1 → 0-255/% conversion. Other perceptual spaces expect 0-1 input.

**Risk:** Passing 0-255 RGB values to perceptual space = wrong output.

#### 3. Gradient Stop Position (gradient.js line 24)

```javascript
const position = stop.position !== undefined ? ` ${stop.position * 100}%` : '';
```
**Risk:** Position must be 0-1 range. Passing 50 (expecting percent) → 5000%.

#### 4. Shadow Default Values (shadow.js lines 19-22)

```javascript
const offsetX = shadow.offsetX || '0px';
```
Zero values evaluate to falsy if not strings. `0` becomes '0px' correctly.

#### 5. Typography Empty Composite (typography.js line 32)

```javascript
return parts.join(' ') || '/* composite typography token */';
```
Returns CSS comment if no properties set.

### Resolver Edge Cases

#### 6. Nested Braces (resolvers/index.js line 18)

```javascript
const referencePattern = /\{([^}]+)\}/g;
```
**Risk:** `{{color.primary}}` causes incorrect capture.

#### 7. Path Collision (resolvers/index.js line 57)

Uses dot notation as key: `path.join('.')`

**Risk:** Paths `['a.b', 'c']` and `['a', 'b', 'c']` both become `'a.b.c'` - collision!

#### 8. $ Property Skipping (resolvers/index.js line 69)

```javascript
if (!key.startsWith('$')) { collectTokens(...) }
```
ALL $ properties skipped, including custom metadata like `$custom`.

### Exporter Edge Cases

#### 9. Config Priority (exporters/toCSS.js lines 19-24)

Options override token-level config. Falsy values in options (like `layer: ''`) remove defaults.

#### 10. File Path Resolution (exporters/toCSS.js lines 81-87)

Different base paths:
- `options.fileName`: relative to CWD
- `config.fileName`: relative to JSON file

#### 11. Console Output (exporters/toCSS.js line 92)

```javascript
console.log(`CSS exported to: ${outputPath}`);
```
Always logs on file write - no silent option.

### Validator Edge Cases

#### 12. $type Optional (validators/index.js line 32)

`validateTokenStructure()` doesn't require `$type`, but type checkers do.

**Risk:** Token without `$type` passes validation but fails type-specific checks.

#### 13. No Value Validation (validators/index.js lines 11-14)

Only checks presence of `$value`, not validity.

**Risk:** `{ $value: undefined }` is "valid".

### Type Conversion Edge Cases

#### 14. Non-String Coercion (resolvers/index.js line 14)

```javascript
if (typeof value !== 'string') {
  return String(value);
}
```
**Risk:** Objects become `[object Object]`, null becomes `'null'`.

#### 15. Unknown Type Fallback (converters/index.js line 76)

Default case resolves value as reference.

**Risk:** Unknown types treated as potential references.

#### 16. cubicBezier Array Assumption (converters/index.js lines 59-60)

```javascript
return `cubic-bezier(${$value.join(', ')})`;
```
**Risk:** Assumes array. Object format `{ x1, y1, x2, y2 }` would fail.

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
- **Format Module (2025)**: Token structure (`$type`, `$value`, `$extensions`)
- **Color Module**: Wide gamut color support (display-p3, oklab, oklch, etc.)
- **Resolver**: Reference resolution semantics (`{path.to.token}`)

## Debugging Tips

1. **Reference not resolving?** Check registry has the referenced path
2. **Wrong color format?** Verify colorSpace matches expected output
3. **CSS invalid?** Check token $type matches $value structure
4. **Export empty?** Ensure tokens have $value property
5. **CSS variable name wrong?** Check if `$extensions.css.var` is set
6. **Missing token in registry?** Verify path doesn't collide with another
7. **Converter returning undefined?** Check $type is supported
