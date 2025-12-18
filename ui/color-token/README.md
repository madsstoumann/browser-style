# Color Token Component

A custom element for displaying and editing design tokens of type "color" with full support for the Design Tokens specification.

## Component: `<color-token>`

### Purpose

The `<color-token>` element provides an interactive interface for:
1. **Displaying** color design tokens with their metadata
2. **Editing** color values, properties, and extensions
3. **Syncing** changes back to the JSON token file
4. **Supporting** multiple color spaces (sRGB, OKLCH, Display P3, HSL, etc.)
5. **Managing** semantic tokens with light/dark mode pairs

---

## Attributes

The component is designed to work with simple, human-readable attributes that can be used standalone without JSON configuration.

### Core Attributes

#### `name` (required)
The token name/identifier.

```html
<color-token name="gray-50"></color-token>
```

#### `space`
The color space for the token. Defaults to `"srgb"`.

```html
<color-token name="blue-500" space="oklch"></color-token>
```

**Supported values:**
- `srgb`, `srgb-linear`
- `hsl`, `hwb`
- `lab`, `lch`
- `oklab`, `oklch`
- `display-p3`, `a98-rgb`, `prophoto-rgb`, `rec2020`
- `xyz-d65`, `xyz-d50`

#### `components`
Space-separated list of color component values.

```html
<color-token
  name="gray-50"
  space="srgb"
  components="0.98 0.98 0.98">
</color-token>
```

**Or for HSL:**
```html
<color-token
  name="purple-500"
  space="hsl"
  components="291 64 42">
</color-token>
```

#### `value`
Shorthand for common formats. Can be:
- **Hex color** (auto-detected as sRGB): `#fafafa`
- **Token reference**: `{color.raw.neutral.50}`
- **CSS color string**: `rgb(250, 250, 250)`, `hsl(291, 64%, 42%)`

```html
<!-- Hex shorthand -->
<color-token name="gray-50" value="#fafafa"></color-token>

<!-- Token reference -->
<color-token name="canvas" value="{color.raw.neutral.50}"></color-token>

<!-- CSS color -->
<color-token name="blue" value="oklch(0.58 0.21 240)"></color-token>
```

#### `alpha`
Alpha/opacity value (0-1). Defaults to `1`.

```html
<color-token
  name="overlay"
  value="#000000"
  alpha="0.5">
</color-token>
```

---

### Extension Attributes

#### `prop`
Custom CSS custom property name (for `$extensions.cssProp`).

```html
<color-token
  name="canvas"
  value="{color.raw.neutral.50}"
  prop="--canvas">
</color-token>
```

**Note:** If omitted, auto-generates from `name` (e.g., `name="canvas"` → `--canvas`)

#### `description`
Human-readable description of the token (for `$description`).

```html
<color-token
  name="gray-50"
  value="#fafafa"
  description="Lightest neutral shade">
</color-token>
```

---

### CSS Function Attributes

#### `func`
CSS function name to apply to the value (e.g., `light-dark`, `clamp`, `min`, `max`, `calc`).

```html
<color-token
  name="text"
  func="light-dark"
  args="{color.raw.neutral.900} {color.raw.neutral.50}"
  prop="--text">
</color-token>
```

#### `args`
Space-separated arguments for the CSS function. Works in conjunction with `func` attribute.

**For light-dark() function:**
```html
<color-token
  name="canvas"
  func="light-dark"
  args="{color.raw.neutral.50} {color.raw.neutral.900}">
</color-token>
```

**For clamp() function:**
```html
<color-token
  name="spacing"
  func="clamp"
  args="0.875rem 2vw 1.5rem">
</color-token>
```

**Arguments can be:**
- Token references: `{color.raw.neutral.50}`
- Hex colors: `#fafafa`
- CSS colors: `rgba(0, 0, 0, 0.5)`
- Dimensions: `1rem`, `2vw`, `100%`
- Expressions: `100vw - 2rem`

---

### How func and args Map to JSON

The HTML attributes map directly to the JSON `cssFunc` structure:

**HTML:**
```html
<color-token
  name="canvas"
  func="light-dark"
  args="{color.raw.neutral.50} {color.raw.neutral.900}"
  prop="--canvas">
</color-token>
```

**JSON:**
```json
{
  "canvas": {
    "$value": "{color.raw.neutral.50}",
    "$extensions": {
      "cssProp": "--canvas",
      "cssFunc": {
        "name": "light-dark",
        "args": [
          "{color.raw.neutral.50}",
          "{color.raw.neutral.900}"
        ]
      }
    }
  }
}
```

**CSS Output:** `--canvas: light-dark(var(--color-raw-neutral-50), var(--color-raw-neutral-900));`

**Key mapping:**
- `func="light-dark"` → `cssFunc.name`
- `args="value1 value2"` → `cssFunc.args` array (space-separated values are parsed into array)

**With hex values:**
```html
<color-token
  name="canvas"
  func="light-dark"
  args="#fafafa #212121">
</color-token>
```

Generates:
```json
{
  "canvas": {
    "$value": "#fafafa",
    "$extensions": {
      "cssFunc": {
        "name": "light-dark",
        "args": ["#fafafa", "#212121"]
      }
    }
  }
}
```

**CSS Output:** `--canvas: light-dark(#fafafa, #212121);`

---

### Metadata Attributes

#### `group`
Token group/category path (e.g., `"gray"` or `"background"`).

```html
<color-token
  name="50"
  group="gray"
  value="#fafafa">
</color-token>
```

#### `editable`
Boolean attribute to enable/disable editing mode. Defaults to `true`.

```html
<color-token
  name="gray-50"
  value="#fafafa"
  editable="false">
</color-token>
```

#### `readonly`
Boolean attribute (opposite of `editable`). Makes the token read-only.

```html
<color-token name="brand" value="#2196F3" readonly></color-token>
```

---

## Usage Examples

### Example 1: Simple Hex Color (Minimal)

```html
<color-token name="gray-50" value="#fafafa"></color-token>
```

**Generates:**
```json
{
  "gray-50": {
    "$value": {
      "colorSpace": "srgb",
      "components": [0.98, 0.98, 0.98],
      "hex": "#fafafa"
    }
  }
}
```

**CSS Output:** `--gray-50: #fafafa;`

---

### Example 2: OKLCH Color with Components

```html
<color-token
  name="blue-500"
  space="oklch"
  components="0.58 0.21 240"
  description="Primary blue">
</color-token>
```

**Generates:**
```json
{
  "blue-500": {
    "$value": {
      "colorSpace": "oklch",
      "components": [0.58, 0.21, 240]
    },
    "$description": "Primary blue"
  }
}
```

**CSS Output:** `--blue-500: oklch(0.58 0.21 240);`

---

### Example 3: HSL Color with Custom Prop Name

```html
<color-token
  name="purple-500"
  space="hsl"
  components="291 64 42"
  prop="--purple"
  description="Primary purple">
</color-token>
```

**CSS Output:** `--purple: hsl(291, 64%, 42%);`

---

### Example 4: Simple Token Reference

```html
<color-token
  name="canvas"
  value="{color.raw.neutral.50}"
  description="Main background">
</color-token>
```

**Generates:**
```json
{
  "canvas": {
    "$value": "{color.raw.neutral.50}",
    "$description": "Main background"
  }
}
```

**CSS Output:** `--canvas: var(--color-raw-neutral-50);`

---

### Example 5: Using light-dark() Function with Token References

```html
<color-token
  name="text"
  func="light-dark"
  args="{color.raw.neutral.900} {color.raw.neutral.50}"
  prop="--text"
  description="Primary text color">
</color-token>
```

**Generates:**
```json
{
  "text": {
    "$value": "{color.raw.neutral.900}",
    "$description": "Primary text color",
    "$extensions": {
      "cssProp": "--text",
      "cssFunc": {
        "name": "light-dark",
        "args": [
          "{color.raw.neutral.900}",
          "{color.raw.neutral.50}"
        ]
      }
    }
  }
}
```

**CSS Output:** `--text: light-dark(var(--color-raw-neutral-900), var(--color-raw-neutral-50));`

**Note:** The space-separated `args` attribute is parsed into the `cssFunc.args` array. First value becomes `args[0]` (light mode), second becomes `args[1]` (dark mode).

---

### Example 6: light-dark() with CSS Color Values

This example shows how CSS color strings in the `args` attribute are parsed into color objects:

```html
<color-token
  name="overlay"
  func="light-dark"
  args="rgba(0, 0, 0, 0.5) rgba(0, 0, 0, 0.7)"
  prop="--overlay"
  description="Semi-transparent overlay for modals">
</color-token>
```

**Generates:**
```json
{
  "overlay": {
    "$value": {
      "colorSpace": "srgb",
      "components": [0.0, 0.0, 0.0],
      "alpha": 0.5
    },
    "$description": "Semi-transparent overlay for modals",
    "$extensions": {
      "cssProp": "--overlay",
      "cssFunc": {
        "name": "light-dark",
        "args": [
          {
            "colorSpace": "srgb",
            "components": [0.0, 0.0, 0.0],
            "alpha": 0.5
          },
          {
            "colorSpace": "srgb",
            "components": [0.0, 0.0, 0.0],
            "alpha": 0.7
          }
        ]
      }
    }
  }
}
```

**CSS Output:** `--overlay: light-dark(rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.7));`

**Note:** The `args` array can contain full color objects (not just references or primitives), as shown in [colors.json:548-561](../web-config-tokens/data/colors.json#L548-L561).

---

### Example 7: light-dark() with Hex Values

```html
<color-token
  name="canvas"
  func="light-dark"
  args="#fafafa #212121"
  prop="--canvas"
  group="background"
  description="Main application background">
</color-token>
```

**Generates:**
```json
{
  "canvas": {
    "$value": "#fafafa",
    "$description": "Main application background",
    "$extensions": {
      "cssProp": "--canvas",
      "cssFunc": {
        "name": "light-dark",
        "args": ["#fafafa", "#212121"]
      }
    }
  }
}
```

**CSS Output:** `--canvas: light-dark(#fafafa, #212121);`

---

### Example 8: Semi-transparent Color (Single Value)

```html
<color-token
  name="overlay"
  value="#000000"
  alpha="0.5"
  description="Modal overlay">
</color-token>
```

**CSS Output:** `--overlay: #00000080;` (or `rgba(0, 0, 0, 0.5)`)

---

### Example 9: Display P3 Wide Gamut Color

```html
<color-token
  name="vibrant-green"
  space="display-p3"
  components="0.29 0.67 0.30"
  description="Vivid green for P3 displays">
</color-token>
```

**CSS Output:** `--vibrant-green: color(display-p3 0.29 0.67 0.30);`

---

### Example 10: Token Reference Only

```html
<color-token
  name="brand"
  value="{color.raw.blue.500}"
  prop="--brand">
</color-token>
```

**CSS Output:** `--brand: var(--color-raw-blue-500);`

---

### Example 11: Complete Example with All Features

```html
<color-token
  name="interactive"
  func="light-dark"
  args="{color.raw.blue.600} {color.raw.blue.400}"
  prop="--interactive"
  group="semantic"
  description="Interactive element color"
  editable>
</color-token>
```

---

## HTML Attributes ↔ JSON Structure Mapping

Understanding how HTML attributes map to the JSON token structure, particularly for `cssFunc`:

### Simple Color Token

**HTML:**
```html
<color-token name="gray-50" value="#fafafa"></color-token>
```

**JSON:**
```json
{
  "gray-50": {
    "$value": {
      "colorSpace": "srgb",
      "components": [0.98, 0.98, 0.98],
      "hex": "#fafafa"
    }
  }
}
```

### Token with Custom CSS Property

**HTML:**
```html
<color-token name="brand" value="{color.raw.blue.500}" prop="--brand"></color-token>
```

**JSON:**
```json
{
  "brand": {
    "$value": "{color.raw.blue.500}",
    "$extensions": {
      "cssProp": "--brand"
    }
  }
}
```

### Token with cssFunc (light-dark)

**HTML:**
```html
<color-token
  name="text"
  func="light-dark"
  args="{color.raw.neutral.900} {color.raw.neutral.50}"
  prop="--text">
</color-token>
```

**JSON:**
```json
{
  "text": {
    "$value": "{color.raw.neutral.900}",
    "$extensions": {
      "cssProp": "--text",
      "cssFunc": {
        "name": "light-dark",
        "args": [
          "{color.raw.neutral.900}",
          "{color.raw.neutral.50}"
        ]
      }
    }
  }
}
```

**Key mapping:**
- `func="light-dark"` → `cssFunc.name`
- `args="value1 value2"` → `cssFunc.args` array (space-separated string parsed into array)
- First arg `{color.raw.neutral.900}` → `cssFunc.args[0]`
- Second arg `{color.raw.neutral.50}` → `cssFunc.args[1]`

### cssFunc with Color Objects as Args

As shown in [colors.json:540-564](../web-config-tokens/data/colors.json#L540-L564), the `args` array can contain full color objects:

**JSON:**
```json
{
  "overlay": {
    "$value": {
      "colorSpace": "srgb",
      "components": [0.0, 0.0, 0.0],
      "alpha": 0.5
    },
    "$extensions": {
      "cssProp": "--overlay",
      "cssFunc": {
        "name": "light-dark",
        "args": [
          {
            "colorSpace": "srgb",
            "components": [0.0, 0.0, 0.0],
            "alpha": 0.5
          },
          {
            "colorSpace": "srgb",
            "components": [0.0, 0.0, 0.0],
            "alpha": 0.7
          }
        ]
      }
    }
  }
}
```

**HTML representation:**
```html
<color-token
  name="overlay"
  func="light-dark"
  args="rgba(0, 0, 0, 0.5) rgba(0, 0, 0, 0.7)"
  prop="--overlay">
</color-token>
```

The component parses the space-separated CSS color strings in the `args` attribute and converts them to color objects for the `cssFunc.args` array.

---

## Bi-directional Data Flow

### HTML → JSON (Writing Tokens)

When attributes change, the component should:

1. **Parse attributes** into token structure
2. **Validate** color values and references
3. **Generate** proper token JSON
4. **Emit custom event** `token-change` with token data
5. **Optional:** POST to `src` URL if provided

**Event structure:**
```javascript
element.addEventListener('token-change', (event) => {
  console.log(event.detail.name);       // "gray-50"
  console.log(event.detail.group);      // "color.raw.gray"
  console.log(event.detail.token);      // Complete token object
  console.log(event.detail.path);       // "color.raw.gray.50"
});
```

### JSON → HTML (Reading Tokens)

When loading from JSON:

1. **Parse JSON** token structure
2. **Extract** value, extensions, description
3. **Set attributes** on the element
4. **Render** UI based on token type

**Initialization:**
```javascript
const token = {
  "$value": {
    "colorSpace": "srgb",
    "components": [0.98, 0.98, 0.98],
    "hex": "#fafafa"
  },
  "$description": "Lightest neutral shade",
  "$extensions": {
    "cssProp": "--gray-50"
  }
};

const element = document.createElement('color-token');
element.setToken('gray-50', 'color.raw.gray', token);
```

---

## Attribute Parsing Logic

### Smart Value Detection

The `value` attribute intelligently detects the format:

**1. Hex color** (starts with `#`)
```html
<color-token name="gray" value="#fafafa"></color-token>
```
→ Parsed as sRGB hex, components auto-generated

**2. Token reference** (wrapped in `{}`)
```html
<color-token name="canvas" value="{color.raw.neutral.50}"></color-token>
```
→ Treated as reference, no color object created

**3. CSS color function**
```html
<color-token name="blue" value="oklch(0.58 0.21 240)"></color-token>
```
→ Parsed as OKLCH color, components extracted

**4. Named CSS color**
```html
<color-token name="primary" value="rebeccapurple"></color-token>
```
→ Converted to hex/RGB

### Attribute Priority Order

When multiple attributes define the same thing, priority is:

1. **`value`** (if set) - Takes precedence over everything
2. **`components` + `space`** - Explicit color definition
3. **`dual` + `light` + `dark`** - Dual mode overrides single value
4. **`func`** - Wraps the final value in a CSS function

### Examples of Priority

```html
<!-- Both value and components - value wins -->
<color-token
  name="test"
  value="#ff0000"
  components="0 0 255">
</color-token>
<!-- Result: #ff0000 (red, not blue) -->

<!-- func + args creates cssFunc extension -->
<color-token
  name="text"
  value="#000000"
  func="light-dark"
  args="#212121 #fafafa">
</color-token>
<!-- Result: Generates cssFunc with light-dark(#212121, #fafafa) -->
```

---

## Component Methods

### `setToken(name, group, tokenObject)`
Programmatically set token from JSON.

```javascript
element.setToken('gray-50', 'color.raw.gray', {
  "$value": { "colorSpace": "srgb", "components": [0.98, 0.98, 0.98], "hex": "#fafafa" },
  "$description": "Lightest neutral shade"
});
```

### `getToken()`
Get current token as JSON object.

```javascript
const token = element.getToken();
// Returns: { $value: {...}, $description: "...", $extensions: {...} }
```

### `getValue()`
Get just the `$value` portion.

```javascript
const value = element.getValue();
// Returns: { colorSpace: "srgb", components: [...], hex: "#fafafa" }
```

### `updateValue(newValue)`
Update the color value.

```javascript
element.updateValue({
  colorSpace: "oklch",
  components: [0.96, 0.02, 240]
});
```

### `save()`
Save current token to `src` URL (if provided).

```javascript
await element.save();
```

---

## Events

### `token-change`
Fired when any attribute/value changes.

```javascript
element.addEventListener('token-change', (event) => {
  const { name, group, token, path } = event.detail;
});
```

### `token-save`
Fired after successful save to JSON file.

```javascript
element.addEventListener('token-save', (event) => {
  console.log('Saved:', event.detail.path);
});
```

### `token-error`
Fired on validation or save errors.

```javascript
element.addEventListener('token-error', (event) => {
  console.error('Error:', event.detail.message);
});
```

---

## Attribute Summary Table

| Attribute | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `name` | String | Yes | - | Token name/key |
| `value` | String | Conditional* | - | Color value (hex, reference, or CSS color) |
| `space` | String | No | `"srgb"` | Color space identifier |
| `components` | String | No | - | Space-separated color components |
| `alpha` | Number | No | `1` | Alpha/opacity value (0-1) |
| `prop` | String | No | Auto-generated | Custom CSS property name |
| `func` | String | No | - | CSS function name (light-dark, clamp, etc.) |
| `args` | String | Conditional** | - | Space-separated function arguments |
| `description` | String | No | - | Human-readable description |
| `group` | String | No | - | Token group/category |
| `editable` | Boolean | No | `true` | Enable editing interface |
| `readonly` | Boolean | No | `false` | Make token read-only |

\* Required unless `components` or `func` + `args` are provided
\*\* Required when `func` is set

---

## Quick Start Examples

### Minimal (Hex Only)

```html
<color-token name="gray-50" value="#fafafa"></color-token>
```

### Raw Color with Components

```html
<color-token
  name="blue-500"
  space="oklch"
  components="0.58 0.21 240">
</color-token>
```

### With light-dark() Function

```html
<color-token
  name="canvas"
  func="light-dark"
  args="#fafafa #212121">
</color-token>
```

### Full Featured

```html
<color-token
  name="text"
  func="light-dark"
  args="{color.raw.neutral.900} {color.raw.neutral.50}"
  prop="--text"
  group="semantic"
  description="Primary text color">
</color-token>
```

### Programmatic Usage

```javascript
import './color-token.js';

// Create element
const token = document.createElement('color-token');
token.name = 'brand';
token.value = '#2196F3';
token.prop = '--brand';

document.body.appendChild(token);

// Listen for changes
token.addEventListener('token-change', (e) => {
  console.log('Updated:', e.detail.name, e.detail.cssValue);
});

// Update programmatically
token.value = '#1976D2';
```

---

## Future Enhancements

1. **Batch operations** - Load/save multiple tokens at once
2. **Color space conversion** - Convert between color spaces in UI
3. **Accessibility checks** - Contrast ratio validation
4. **Token references** - Visual links to referenced tokens
5. **History/undo** - Track changes and allow undo
6. **Import/export** - Support multiple token formats (Style Dictionary, Figma, etc.)
7. **Validation** - Real-time validation against Design Tokens spec

---

## Related Components

- `<color-palette>` - Display a group of related color tokens
- `<token-group>` - Container for organizing multiple tokens
- `<token-editor>` - Full-featured token management interface
