# Design Tokens Complete Reference

This document provides a comprehensive list of design token types based on the [Design Tokens Community Group Specification](https://www.designtokens.org/tr/third-editors-draft/) and [Open Props](https://open-props.style/).

## Table of Contents

1. [Token Type Hierarchy](#token-type-hierarchy)
2. [Raw/Primitive Token Types](#rawprimitive-token-types)
3. [Composite Token Types](#composite-token-types)
4. [Extended Token Categories](#extended-token-categories)
5. [Token Format Structure](#token-format-structure)

---

## Token Type Hierarchy

Design tokens follow a **two-tier type system**:

### Raw/Primitive Types
These are fundamental, indivisible token types that represent single values:
- **Color** - Individual color values in various color spaces
- **Dimension** - Distance measurements (px, rem)
- **Font Family** - Font names/stack
- **Font Weight** - Numeric weight values (1-1000)
- **Duration** - Time values (ms, s)
- **Cubic Bézier** - Easing curve definitions (4 numbers)
- **Number** - Unitless numeric values
- **Stroke Style** - Line/border patterns

### Composite Types
These combine multiple raw/primitive types into structured objects:
- **Border** - Combines: color + dimension (width) + stroke style
- **Shadow** - Combines: color + dimension (offsetX, offsetY, blur, spread)
- **Gradient** - Array of: color + number (position)
- **Transition** - Combines: duration + duration (delay) + cubic bézier
- **Typography** - Combines: font family + dimension (size) + font weight + dimension (letter spacing) + number (line height)

### Semantic/Alias Tokens
Beyond raw and composite types, tokens can reference other tokens to create semantic layers. For example, a "canvas" color token could reference different raw color tokens for light and dark modes through token aliasing:

```json
{
  "color": {
    "raw": {
      "neutral-50": {
        "$type": "color",
        "$value": {
          "colorSpace": "srgb",
          "components": [0.98, 0.98, 0.98],
          "alpha": 1,
          "hex": "#FAFAFA"
        }
      },
      "neutral-900": {
        "$type": "color",
        "$value": {
          "colorSpace": "srgb",
          "components": [0.09, 0.09, 0.09],
          "alpha": 1,
          "hex": "#171717"
        }
      },
      "neutral-800": {
        "$type": "color",
        "$value": {
          "colorSpace": "srgb",
          "components": [0.15, 0.15, 0.15],
          "alpha": 1,
          "hex": "#262626"
        }
      },
      "neutral-100": {
        "$type": "color",
        "$value": {
          "colorSpace": "srgb",
          "components": [0.96, 0.96, 0.96],
          "alpha": 1,
          "hex": "#F5F5F5"
        }
      }
    },
    "semantic": {
      "canvas": {
        "$type": "color",
        "$value": "{color.raw.neutral-50}",
        "$description": "Main background color",
        "$extensions": {
          "colorScheme": {
            "dark": "{color.raw.neutral-900}"
          }
        }
      },
      "text": {
        "$type": "color",
        "$value": "{color.raw.neutral-900}",
        "$description": "Primary text color",
        "$extensions": {
          "colorScheme": {
            "dark": "{color.raw.neutral-50}"
          }
        }
      },
      "surface": {
        "$type": "color",
        "$value": "{color.raw.neutral-100}",
        "$description": "Card and panel background",
        "$extensions": {
          "colorScheme": {
            "dark": "{color.raw.neutral-800}"
          }
        }
      }
    }
  }
}
```

This example shows:
- **Raw color tokens** (neutral-50, neutral-100, neutral-800, neutral-900) with complete color space definitions
- **Semantic tokens** (canvas, text, surface) that reference raw colors using the standard `{group.token}` syntax
- **Light color scheme** uses the `$value` property (neutral-50 for canvas, neutral-900 for text)
- **Dark color scheme** uses the `$extensions.colorScheme.dark` property (neutral-900 for canvas, neutral-50 for text)
- This creates "composite color pairs" where each semantic token adapts to the color scheme

**Note on Standards:**
- Token aliasing/references using `{group.token}` syntax is part of the official specification
- The `$extensions` property is also standardized for vendor-specific metadata
- However, the specific `colorScheme.dark` pattern for theme switching is **not standardized** - it's a common implementation pattern but not part of the official spec
- Using `colorScheme` aligns with CSS's `color-scheme` property standard
- Alternative approaches include:
  - Separate token files per theme
  - Build-time token resolution
  - Tool-specific theme systems

---

## Raw/Primitive Token Types

### Color

Represents UI colors with support for multiple color spaces.

**Properties:**
- `$type`: `"color"`
- `$value`: Object containing:
  - `colorSpace` (required): String specifying the color space
  - `components` (required): Array of color component values or `'none'` keyword
  - `alpha` (optional): Number between 0-1 (default: 1)
  - `hex` (optional): 6-digit CSS hex fallback value

**Supported Color Spaces:**
- `srgb` - sRGB [Red, Green, Blue] [0-1]
- `srgb-linear` - sRGB linear [Red, Green, Blue] [0-1]
- `hsl` - HSL [Hue [0-360), Saturation [0-100], Lightness [0-100]]
- `hwb` - HWB [Hue [0-360), Whiteness [0-100], Blackness [0-100]]
- `lab` - CIELAB [Lightness [0-100], A [-∞,∞], B [-∞,∞]]
- `lch` - LCH [Lightness [0-100], Chroma [0,∞], Hue [0-360)]
- `oklab` - OKLAB [Lightness [0-1], A [-∞,∞], B [-∞,∞]]
- `oklch` - OKLCH [Lightness [0-1], Chroma [0,∞], Hue [0-360)]
- `display-p3` - Display P3 [Red, Green, Blue] [0-1]
- `a98-rgb` - A98 RGB [Red, Green, Blue] [0-1]
- `prophoto-rgb` - ProPhoto RGB [Red, Green, Blue] [0-1]
- `rec2020` - Rec 2020 [Red, Green, Blue] [0-1]
- `xyz-d65` - XYZ-D65 [X, Y, Z] [0-1]
- `xyz-d50` - XYZ-D50 [X, Y, Z] [0-1]

**Example:**
```json
{
  "primary-color": {
    "$type": "color",
    "$value": {
      "colorSpace": "srgb",
      "components": [0.2, 0.4, 0.8],
      "alpha": 1,
      "hex": "#3366CC"
    }
  }
}
```

### Dimension

Represents distances in UI design (positions, widths, heights, radii, thickness).

**Properties:**
- `$type`: `"dimension"`
- `$value`: Object containing:
  - `value`: Number (integer or float)
  - `unit`: String - `"px"` or `"rem"`

**Example:**
```json
{
  "spacing-md": {
    "$type": "dimension",
    "$value": {
      "value": 1,
      "unit": "rem"
    }
  }
}
```

### Font Family

Represents font names in order of preference.

**Properties:**
- `$type`: `"fontFamily"`
- `$value`: String (single font) or Array of strings (font stack)

**Example:**
```json
{
  "font-body": {
    "$type": "fontFamily",
    "$value": ["Helvetica", "Arial", "sans-serif"]
  }
}
```

### Font Weight

Represents font thickness/boldness.

**Properties:**
- `$type`: `"fontWeight"`
- `$value`: Number [1-1000] or predefined string

**Predefined Values:**
- `100` or `"thin"`, `"hairline"`
- `200` or `"extra-light"`, `"ultra-light"`
- `300` or `"light"`
- `400` or `"normal"`, `"regular"`, `"book"`
- `500` or `"medium"`
- `600` or `"semi-bold"`, `"demi-bold"`
- `700` or `"bold"`
- `800` or `"extra-bold"`, `"ultra-bold"`
- `900` or `"black"`, `"heavy"`, `"extra-black"`, `"ultra-black"`

**Example:**
```json
{
  "font-weight-heading": {
    "$type": "fontWeight",
    "$value": 700
  }
}
```

### Font Size

Represents text size.

**Properties:**
- `$type`: `"dimension"`
- `$value`: Dimension value (typically rem or px)

**Categories (from Open Props):**
- Static font sizes (px-based)
- Fluid font sizes (viewport-responsive)

### Letter Spacing

Represents character spacing in text.

**Properties:**
- `$type`: `"dimension"`
- `$value`: Dimension value

### Line Height

Represents vertical spacing between lines of text.

**Properties:**
- `$type`: `"number"`
- `$value`: Unitless number (relative to font size)

**Example:**
```json
{
  "line-height-normal": {
    "$type": "number",
    "$value": 1.5
  }
}
```

### Duration

Represents animation/transition timing.

**Properties:**
- `$type`: `"duration"`
- `$value`: Object containing:
  - `value`: Number
  - `unit`: String - `"ms"` or `"s"`

**Example:**
```json
{
  "duration-fast": {
    "$type": "duration",
    "$value": {
      "value": 200,
      "unit": "ms"
    }
  }
}
```

### Cubic Bézier

Represents animation easing curves.

**Properties:**
- `$type`: `"cubicBezier"`
- `$value`: Array of four numbers `[P1x, P1y, P2x, P2y]`
  - P1x and P2x must be in range [0, 1]
  - P1y and P2y are unrestricted

**Easing Types (from Open Props):**
- Linear
- Ease (in, out, in-out)
- Elastic (in, out, in-out)
- Spring (1-5)
- Bounce (in, out, in-out)
- Step functions

**Example:**
```json
{
  "ease-out-cubic": {
    "$type": "cubicBezier",
    "$value": [0.33, 1, 0.68, 1]
  }
}
```

### Number

Represents unitless numeric values.

**Properties:**
- `$type`: `"number"`
- `$value`: Number (can be positive, negative, or fractional)

**Use Cases:**
- Line heights
- Opacity values
- Z-index values
- Gradient positions

---

## Composite Token Types

### Stroke Style

Represents line/border styling.

**Properties:**
- `$type`: `"strokeStyle"`
- `$value`: String or Object

**String Values:**
- `"solid"`
- `"dashed"`
- `"dotted"`
- `"double"`
- `"groove"`
- `"ridge"`
- `"outset"`
- `"inset"`

**Object Format:**
```json
{
  "dashArray": [5, 5],
  "lineCap": "round"
}
```

### Border

Represents complete border styling.

**Properties:**
- `$type`: `"border"`
- `$value`: Object containing:
  - `color`: Color value
  - `width`: Dimension value
  - `style`: Stroke style value

**Border Categories (from Open Props):**
- Border widths (thin to thick)
- Corner radii (standard, conditional)
- Hand-drawn border effects
- Blob shapes

**Example:**
```json
{
  "border-default": {
    "$type": "border",
    "$value": {
      "color": {"$ref": "color.neutral.500"},
      "width": {"value": 1, "unit": "px"},
      "style": "solid"
    }
  }
}
```

### Shadow

Represents drop shadows and box shadows.

**Properties:**
- `$type`: `"shadow"`
- `$value`: Object containing:
  - `color`: Color value
  - `offsetX`: Dimension value
  - `offsetY`: Dimension value
  - `blur`: Dimension value
  - `spread`: Dimension value
  - `inset` (optional): Boolean

**Shadow Types (from Open Props):**
- Outer shadows (1-6 levels)
- Inner shadows (0-4 levels)
- Light/dark mode adaptive shadows

**Example:**
```json
{
  "shadow-md": {
    "$type": "shadow",
    "$value": {
      "color": {"colorSpace": "srgb", "components": [0, 0, 0], "alpha": 0.1},
      "offsetX": {"value": 0, "unit": "px"},
      "offsetY": {"value": 4, "unit": "px"},
      "blur": {"value": 6, "unit": "px"},
      "spread": {"value": 0, "unit": "px"}
    }
  }
}
```

### Gradient

Represents color gradients.

**Properties:**
- `$type`: `"gradient"`
- `$value`: Array of gradient stop objects, each containing:
  - `color`: Color value
  - `position`: Number [0-1]

**Note:** The standard `gradient` type only defines color stops. Gradient direction (angle) or type (linear/radial) are typically handled via custom extensions or wrapper objects.

**Gradient Types (from Open Props):**
- Linear gradients (30+ presets)
- Radial gradients
- Conic gradients
- Noise effects (1-5 levels)

**Example:**
```json
{
  "gradient-sunset": {
    "$type": "gradient",
    "$value": [
      {
        "color": {"colorSpace": "srgb", "components": [1, 0.6, 0.2]},
        "position": 0
      },
      {
        "color": {"colorSpace": "srgb", "components": [1, 0.3, 0.5]},
        "position": 1
      }
    ]
  }
}
```

### Transition

Represents CSS transitions.

**Properties:**
- `$type`: `"transition"`
- `$value`: Object containing:
  - `duration`: Duration value
  - `delay`: Duration value
  - `timingFunction`: Cubic bézier value

**Example:**
```json
{
  "transition-default": {
    "$type": "transition",
    "$value": {
      "duration": {"value": 300, "unit": "ms"},
      "delay": {"value": 0, "unit": "ms"},
      "timingFunction": [0.4, 0, 0.2, 1]
    }
  }
}
```

### Typography

Represents complete typography styling.

**Properties:**
- `$type`: `"typography"`
- `$value`: Object containing:
  - `fontFamily`: Font family value
  - `fontSize`: Dimension value
  - `fontWeight`: Font weight value
  - `letterSpacing`: Dimension value
  - `lineHeight`: Number value

**Example:**
```json
{
  "typography-heading-1": {
    "$type": "typography",
    "$value": {
      "fontFamily": ["Inter", "sans-serif"],
      "fontSize": {"value": 3, "unit": "rem"},
      "fontWeight": 700,
      "letterSpacing": {"value": -0.02, "unit": "rem"},
      "lineHeight": 1.2
    }
  }
}
```

---

## Extended Token Categories

These categories are commonly used in design systems (from Open Props and common practice):

### Size Tokens

**Use Cases:**
- Container widths/heights
- Spacing scale
- Content sizes
- Header sizes
- Relative sizing

**Properties:**
- `$type`: `"dimension"`
- `$value`: Dimension value

**Size Categories:**
- Static sizes (px-based)
- Relative sizes (rem-based)
- Fluid sizes (viewport-responsive)
- Content sizes (max-width constraints)
- Character-relative sizes (ch-based)

### Aspect Ratio

**Use Cases:**
- Image containers
- Video players
- Card layouts

**Properties:**
- `$type`: `"number"`
- `$value`: Number representing width/height ratio

**Common Ratios:**
- Square: 1
- Landscape: 4/3, 16/9
- Portrait: 3/4, 9/16
- Widescreen: 21/9
- Ultrawide: 32/9
- Golden ratio: 1.618

### Z-Index

**Use Cases:**
- Layer stacking
- Modals and overlays
- Sticky elements
- Tooltips

**Properties:**
- `$type`: `"number"`
- `$value`: Integer

**Example Layers:**
- Base: 1
- Dropdown: 2
- Sticky: 3
- Modal: 4
- Toast: 5

### Animation Keyframes

**Use Cases:**
- Entry/exit animations
- Loading states
- Attention-seeking effects

**Animation Types (from Open Props):**
- Fade (in, out)
- Slide (in/out from various directions)
- Shake (x, y)
- Spin
- Ping
- Blink
- Float
- Bounce
- Pulse

### Masks

**Use Cases:**
- Edge treatments
- Image masks
- Decorative effects

**Mask Categories:**
- Edge effects:
  - Scoops
  - Scalloped
  - Drips
  - Zig-zag
  - Waves
- Corner effects:
  - Corner cuts
  - Notches
  - Bevels

**Properties:**
- `$type`: `"string"` (Note: `string` is a common extension, not part of the core spec)
- `$value`: String (URL or inline SVG)

### Radius/Shape

**Use Cases:**
- Border radius
- Shaped containers
- Blob effects

**Properties:**
- `$type`: `"dimension"`
- `$value`: Dimension value or shorthand string

**Categories:**
- Simple radii (small, medium, large)
- Conditional radii (per-corner)
- Blob shapes (organic forms)
- Hand-drawn effects

### Media Queries

**Use Cases:**
- Responsive breakpoints
- Feature detection
- User preferences

**Breakpoint Categories:**
- Viewport sizes (mobile, tablet, desktop, wide)
- Device capabilities:
  - Touch support
  - Pointer precision
  - HDR color support
- User preferences:
  - Dark mode
  - Reduced motion
  - High contrast

**Properties:**
(Note: `string` type is a common extension, not part of the core spec)
```json
{
  "breakpoint-tablet": {
    "$type": "string",
    "$value": "(min-width: 768px)"
  }
}
```

### Color Palettes

**Use Cases:**
- Brand colors
- Semantic colors
- State colors
- Surface colors

**Color Families (from Open Props):**
- Neutrals: gray, stone
- Reds: red, pink
- Purples: purple, violet
- Blues: indigo, blue, cyan
- Greens: teal, green, lime
- Yellows: yellow, orange
- Browns: choco, brown, sand
- Earth tones: camo, jungle

**Scale Levels:** Typically 13 shades per color (50-900)

### Opacity

**Use Cases:**
- Element transparency
- Overlay backgrounds
- Disabled states

**Properties:**
- `$type`: `"number"`
- `$value`: Number [0-1]

### Blur

**Use Cases:**
- Backdrop filters
- Focus effects
- Glass morphism

**Properties:**
- `$type`: `"dimension"`
- `$value`: Dimension value (typically px)

### Scale/Transform

**Use Cases:**
- Hover effects
- Active states
- Animation transforms

**Properties:**
- `$type`: `"number"`
- `$value`: Number (scale factor)

---

## Token Format Structure

### Token Object Schema

```json
{
  "token-name": {
    "$type": "tokenType",
    "$value": "value or object",
    "$description": "Optional description",
    "$extensions": {
      "custom-property": "value"
    }
  }
}
```

### Group Structure

Tokens can be organized in groups with shared properties:

```json
{
  "color": {
    "$type": "color",
    "primary": {
      "100": {"$value": {...}},
      "200": {"$value": {...}},
      "300": {"$value": {...}}
    }
  }
}
```

### Aliases/References

Tokens can reference other tokens:

```json
{
  "color-background": {
    "$type": "color",
    "$value": "{color.primary.500}"
  }
}
```

### Type Inheritance

Types can be declared at group level and inherited by child tokens:

```json
{
  "spacing": {
    "$type": "dimension",
    "small": {"$value": {"value": 0.5, "unit": "rem"}},
    "medium": {"$value": {"value": 1, "unit": "rem"}},
    "large": {"$value": {"value": 2, "unit": "rem"}}
  }
}
```

### Custom CSS Property Names

Tokens can specify custom CSS custom property names using `$extensions.cssProp`:

```json
{
  "color": {
    "raw": {
      "neutral": {
        "50": {
          "$value": {...},
          "$extensions": {
            "cssProp": "--neutral-50"
          }
        }
      }
    },
    "semantic": {
      "background": {
        "canvas": {
          "$value": "{color.raw.neutral.50}",
          "$extensions": {
            "cssProp": "--canvas",
            "colorScheme": {
              "dark": "{color.raw.neutral.900}"
            }
          }
        }
      }
    }
  }
}
```

**Naming Strategies:**
- **Full path** (auto-generated): `--color-raw-neutral-50`, `--color-semantic-background-canvas`
- **Simplified** (using cssProp): `--neutral-50`, `--canvas`
- **Namespaced**: `--c-neutral-50`, `--bg-canvas`, `--txt-primary`

### CSS Functions in Extensions

Tokens can specify CSS functions to be applied to the value using `$extensions.cssFunc`:

```json
{
  "color": {
    "semantic": {
      "text": {
        "primary": {
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
    }
  },
  "spacing": {
    "fluid": {
      "base": {
        "$type": "dimension",
        "$value": {"value": 1, "unit": "rem"},
        "$extensions": {
          "cssProp": "--spacing-fluid",
          "cssFunc": {
            "name": "clamp",
            "args": [
              {"value": 0.875, "unit": "rem"},
              {"value": 0.5, "unit": "rem"},
              "2vw",
              {"value": 1.5, "unit": "rem"}
            ]
          }
        }
      }
    }
  },
  "size": {
    "container": {
      "max": {
        "$type": "dimension",
        "$value": {"value": 1200, "unit": "px"},
        "$extensions": {
          "cssProp": "--container-max",
          "cssFunc": {
            "name": "min",
            "args": [
              {"value": 1200, "unit": "px"},
              "100vw - 2rem"
            ]
          }
        }
      }
    }
  }
}
```

**Supported CSS Functions:**
- `light-dark(light-value, dark-value)` - Native CSS color scheme switching
- `clamp(min, preferred, max)` - Fluid sizing with constraints
- `min(value1, value2, ...)` - Minimum of multiple values
- `max(value1, value2, ...)` - Maximum of multiple values
- `calc(expression)` - Mathematical calculations

**CSS Function Object Structure:**
```json
{
  "cssFunc": {
    "name": "function-name",
    "args": [
      "arg1",
      {"value": 1, "unit": "rem"},
      "{token.reference}"
    ]
  }
}
```

**Arguments can be:**
- **Token references**: `"{color.raw.neutral.900}"` → resolved to CSS var
- **Dimension objects**: `{"value": 1, "unit": "rem"}` → converted to `1rem`
- **String expressions**: `"100vw - 2rem"` → used as-is
- **Primitive values**: `50`, `"#FF0000"` → used as-is

**Example Output:**
```css
:root {
  --text: light-dark(var(--color-raw-neutral-900), var(--color-raw-neutral-50));
  --spacing-fluid: clamp(0.875rem, 0.5rem + 2vw, 1.5rem);
  --container-max: min(1200px, 100vw - 2rem);
}
```

**Advantages of cssFunc over colorScheme:**
- Uses native CSS `light-dark()` function (better browser support in modern browsers)
- More flexible - works with any CSS function
- Composable - can combine multiple functions
- Standards-aligned - uses actual CSS syntax

**When to use colorScheme vs cssFunc:**
- `colorScheme`: Build-time token transformation, polyfill support needed
- `cssFunc` with `light-dark()`: Runtime CSS, modern browser only
- Both can coexist for maximum compatibility

---

## Comprehensive Token Checklist

### Visual Tokens
- ✓ Colors (sRGB, P3, Lab, etc.)
- ✓ Gradients (linear, radial, conic)
- ✓ Shadows (box, text, inner)
- ✓ Opacity/transparency
- ✓ Blur effects
- ✓ Masks and shapes

### Typography Tokens
- ✓ Font families
- ✓ Font weights
- ✓ Font sizes
- ✓ Line heights
- ✓ Letter spacing
- ✓ Text decorations

### Layout Tokens
- ✓ Dimensions (widths, heights)
- ✓ Spacing scale
- ✓ Border widths
- ✓ Border radii
- ✓ Aspect ratios
- ✓ Z-index layers

### Animation Tokens
- ✓ Durations
- ✓ Timing functions (easing)
- ✓ Delays
- ✓ Keyframes
- ✓ Transitions

### Interaction Tokens
- ✓ Stroke styles
- ✓ Borders (complete)
- ✓ Focus indicators
- ✓ Hover states
- ✓ Active states

### Responsive Tokens
- ✓ Breakpoints
- ✓ Fluid sizing
- ✓ Container queries
- ✓ Media query features

---

## Resources

- [Design Tokens Community Group Specification](https://www.designtokens.org/tr/third-editors-draft/)
- [Design Tokens Format Module](https://www.designtokens.org/TR/drafts/format/)
- [Design Tokens Color Module](https://www.designtokens.org/TR/drafts/color/)
- [Open Props](https://open-props.style/)
