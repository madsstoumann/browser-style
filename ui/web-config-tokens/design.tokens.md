# Design Token Architecture & Specification

**Standard:** W3C Design Tokens Format Module (2025 Final)
**Filename:** `design.tokens.json`

---

## 1. Overview

This design system uses a strictly typed, hierarchical JSON format to define style primitives and semantic decisions. It creates a platform-agnostic source of truth that can be transformed into CSS Custom Properties, iOS, Android, or Figma variables.

### Key Principles
- **Type Safety**: Every token has an explicit or inherited `$type`
- **Scalability**: Hierarchical structure supports design systems of any size
- **Extensibility**: Custom `$extensions` for build tool integration
- **Interoperability**: Standards-compliant for maximum tool support

---

## 2. File Architecture

The token file follows a strict **"Primitive vs. Semantic"** separation to ensure scalability and theming support.

### Structure

```json
{
  "$name": "System Name",
  "group-name": {
    "$description": "High-level description of the group",
    "$extensions": { "ui": { "title": "Human Readable Title" } },
    "primitive": { ... }, // Raw values (e.g., blue-500)
    "semantic": { ... }   // Contextual aliases (e.g., text-action)
  }
}
```

### Token Categories

| Category | Purpose | Naming Convention | Example |
|----------|---------|-------------------|---------|
| **Primitive** | Raw available choices | Describes *what it is* | `blue.500`, `spacing.4` |
| **Semantic** | Applied design decisions | Describes *how it's used* | `text.primary`, `gap.fluid` |
---

## 3. Supported Token Types

We utilize standard W3C types along with specific custom extensions to support modern CSS features.

### A. Standard Basic Types

| Type | Description | JSON Example |
|------|-------------|--------------|
| `color` | Hex, RGB, or Wide Gamut (OKLAB/P3) | `"#FF0000"` or `{ "colorSpace": "oklab", ... }` |
| `dimension` | Value with unit (`px`, `rem` only) | `"1rem"`, `"16px"` |
| `fontFamily` | Array of font names | `["Inter", "sans-serif"]` |
| `fontWeight` | Number (1-1000) or String | `400`, `"bold"` |
| `duration` | Time value | `"200ms"`, `"1s"` |
| `cubicBezier` | Easing curve array [4 numbers] | `[0.4, 0, 0.2, 1]` |
| `number` | Unitless number | `1.5` (line-height), `100` (z-index) |

> **Note:** Per W3C spec, dimensions only support `px` and `rem` units. Unit is required even for zero values.

### B. Composite Types

These tokens bundle multiple basic types into a single design concept.

| Type | Components | Usage |
|------|------------|-------|
| `border` | `color`, `width`, `style` | Component boundaries |
| `shadow` | `color`, `offsetX`, `offsetY`, `blur`, `spread` | Elevation (supports array for multiple shadows) |
| `gradient` | Array of `{ color, position }` objects | Backgrounds |
| `typography` | `fontFamily`, `fontSize`, `fontWeight`, `lineHeight`, etc. | Text Styles |
| `transition` | `duration`, `delay`, `timingFunction` | Animations |

### C. Custom & Experimental Types

These types are extensions to the standard to support specific CSS features.

| Type | Description | CSS Property | Status |
|------|-------------|--------------|--------|
| `aspectRatio` | Ratio string or number | `aspect-ratio` | Custom |
| `cornerShape` | Keywords (`notch`, `scoop`, `superellipse`) | `corner-shape` | **Experimental** |
| `fontStyle` | `italic`, `normal`, `oblique` | `font-style` | Custom |
| `custom-path` | SVG path string | `clip-path` | Custom |
---

## 4. Value Definitions

Detailed structure for complex values following W3C specifications.

### Color Values

Colors support multiple formats:

#### Simple Hex Format
```json
"brand-blue": {
  "$type": "color",
  "$value": "#3b82f6"
}
```

#### Wide Gamut (OKLAB)
For high-definition displays supporting extended color spaces:

```json
"vivid-pink": {
  "$type": "color",
  "$value": {
    "colorSpace": "oklab",
    "components": [0.70, 0.27, -0.08],
    "alpha": 1
  }
}
```

#### Display P3 (Wide Gamut)
```json
"brand-500": {
  "$type": "color",
  "$value": {
    "colorSpace": "display-p3",
    "components": [0.1, 0.46, 0.82],
    "alpha": 1,
    "hex": "#1976D2"
  }
}
```

> **Supported Color Spaces:** `srgb`, `srgb-linear`, `hsl`, `hwb`, `lab`, `lch`, `oklab`, `oklch`, `display-p3`, `a98-rgb`, `prophoto-rgb`, `rec2020`, `xyz-d65`, `xyz-d50`

### Shadow Values

Shadows define the X/Y offset, blur radius, spread, and color. Alpha must be embedded in the color value.

#### Single Shadow
```json
"elevation-md": {
  "$type": "shadow",
  "$value": {
    "color": "#00000033",
    "offsetX": "0px",
    "offsetY": "4px",
    "blur": "6px",
    "spread": "-1px"
  }
}
```

#### Multiple Shadows (Layered)
```json
"elevation-lg": {
  "$type": "shadow",
  "$value": [
    {
      "color": "#0000001a",
      "offsetX": "0px",
      "offsetY": "10px",
      "blur": "15px",
      "spread": "-3px"
    },
    {
      "color": "#0000000d",
      "offsetX": "0px",
      "offsetY": "4px",
      "blur": "6px",
      "spread": "-2px"
    }
  ]
}
```

---

## 5. Metadata & Extensions

We use the `$extensions` object to pass build tool logic without breaking standard parsers.

### Extension Namespaces

#### `ui` Namespace
Used for documentation generators (Storybook, Styleguide).

| Property | Description |
|----------|-------------|
| `title` | Clean, human-readable name for the group |

```json
"$extensions": {
  "ui": { "title": "Colors" }
}
```

#### `css` Namespace
Used for transforming JSON into CSS Custom Properties.

| Property | Description | Required |
|----------|-------------|----------|
| `var` | CSS variable name (e.g., `--text-primary`) | Yes |
| `prop` | Forces specific CSS property (e.g., `corner-shape`) | No |
| `fn` | Wraps value in CSS function | No |
| `args` | Arguments passed to function | No |

### Extension Examples

#### CSS `light-dark()` Function
Allows tokens to switch automatically based on system theme:

```json
"surface-base": {
  "$type": "color",
  "$value": "{color.primitive.neutral.0}",
  "$extensions": {
    "css": {
      "var": "--surface-base",
      "fn": "light-dark",
      "args": ["{color.primitive.neutral.0}", "{color.primitive.neutral.950}"]
    }
  }
}
```

**Output:**
```css
--surface-base: light-dark(var(--neutral-0), var(--neutral-950));
```

#### CSS `clamp()` Function
Used for fluid typography or spacing:

```json
"gap-fluid": {
  "$type": "dimension",
  "$value": "2rem",
  "$extensions": {
    "css": {
      "var": "--gap-fluid",
      "fn": "clamp",
      "args": ["1rem", "2vw", "3rem"]
    }
  }
}
```

**Output:**
```css
--gap-fluid: clamp(1rem, 2vw, 3rem);
```

---

## 6. Token References & Aliases

Per W3C specification, tokens can reference other tokens using curly brace syntax:

### Reference Syntax

```json
"semantic-color": {
  "$type": "color",
  "$value": "{color.primitive.blue-500}"
}
```

### Rules
- References use dot notation: `{group.subgroup.token}`
- Aliases must reference tokens of matching `$type`
- **Circular references are invalid** and make all tokens in the chain unknown
- Deep aliases are permitted if non-circular

---

## 7. CSS Property Mapping

Reference guide for which token type maps to which CSS properties.

| Token Type | Primary CSS Properties |
|------------|------------------------|
| `color` | `background-color`, `color`, `border-color`, `fill`, `stroke` |
| `dimension` | `width`, `height`, `margin`, `padding`, `gap`, `font-size`, `border-radius` |
| `fontFamily` | `font-family` |
| `fontWeight` | `font-weight` |
| `fontStyle` | `font-style` |
| `duration` | `transition-duration`, `animation-duration` |
| `cubicBezier` | `transition-timing-function`, `animation-timing-function` |
| `number` | `line-height`, `z-index`, `opacity`, `flex-grow` |
| `border` | `border`, `outline` |
| `shadow` | `box-shadow`, `text-shadow`, `filter: drop-shadow()` |
| `gradient` | `background-image` |
| `transition` | `transition` (shorthand) |
| `aspectRatio` | `aspect-ratio` |
| `cornerShape` | `corner-shape` (experimental) |
| `custom-path` | `clip-path` |

---

## 8. Example JSON Snippets

Quick reference examples following the specification.

### Basic Color System
```json
{
  "color": {
    "$description": "System colors",
    "$extensions": { "ui": { "title": "Colors" } },
    "primitive": {
      "blue-500": {
        "$type": "color",
        "$value": "#3b82f6",
        "$extensions": { "css": { "var": "--blue-500" } }
      }
    },
    "semantic": {
      "action": {
        "$type": "color",
        "$value": "{color.primitive.blue-500}",
        "$extensions": { "css": { "var": "--text-action" } }
      }
    }
  }
}
```

### Wide Gamut Colors
```json
{
  "color": {
    "vivid": {
      "pink": {
        "$type": "color",
        "$value": {
          "colorSpace": "oklab",
          "components": [0.70, 0.27, -0.08],
          "alpha": 1
        },
        "$extensions": { "css": { "var": "--vivid-pink" } }
      }
    }
  }
}
```

### Composite Typography
```json
{
  "typography": {
    "semantic": {
      "heading-xl": {
        "$type": "typography",
        "$value": {
          "fontFamily": "{typography.primitive.fontFamily.sans}",
          "fontSize": "{typography.primitive.size.3xl}",
          "fontWeight": "{typography.primitive.weight.bold}",
          "lineHeight": 1.1
        },
        "$extensions": { "css": { "var": "--type-heading-xl" } }
      }
    }
  }
}
```

---

## 9. Validation Rules

Per W3C specification:

- ✅ **Required:** Every token must have `$value`
- ✅ **Required:** `$type` must be explicit or inherited from parent group
- ✅ **Invalid:** If explicit type is set but value doesn't match expected syntax
- ✅ **Invalid:** Circular references make all tokens in chain unknown
- ✅ **Dimensions:** Only `px` and `rem` units permitted (unit required for zero)
- ✅ **Font Weight:** Valid range [1, 1000] or named aliases

---

## 10. File Format

**MIME Types:**
- Preferred: `application/design-tokens+json`
- Fallback: `application/json`

**File Extensions:**
- `.tokens`
- `.tokens.json`

---

## References

- [W3C Design Tokens Format Module 2025](https://www.w3.org/community/reports/design-tokens/CG-FINAL-format-20251028/)
- [W3C Color Module 2025](https://www.w3.org/community/reports/design-tokens/CG-FINAL-color-20251028/)
- [W3C Resolver Module 2025](https://www.w3.org/community/reports/design-tokens/CG-FINAL-resolver-20251028/)
