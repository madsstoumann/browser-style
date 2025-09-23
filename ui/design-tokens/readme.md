# Design Tokens

## Overview

This design tokens system provides a W3C-compliant, CSS-based approach to managing design consistency across projects. Tokens are organized into logical groups that mirror CSS properties and design concepts, making them intuitive for developers and designers.

## Token Groups

Design tokens are organized into logical groups based on CSS properties and design concepts. Each group contains related tokens that work together to create consistent design systems.

### Core Visual Properties

#### color
Color values for all visual elements (backgrounds, text, borders, etc.)

#### dimension / sizes
Measurements with units (px, rem, em, %, vw, vh) for spacing, sizing, and layout

#### number
Pure numeric values without units (opacity, z-index, flex values)

#### ratio
Aspect ratio values for consistent proportions (16:9, 4:3, 1:1)

### Typography

#### typography
Text-related properties for consistent typography systems
- font-family (string) - Font stack definitions
- font-size / font-size-fluid (dimension / function) - Text size values
- font-weight (number, 100-950) - Font weight values
- letter-spacing (dimension) - Character spacing
- line-height (dimension) - Line spacing
- hyphenation and overflow - Text flow controls

### Layout & Structure

#### border
CSS border properties for element outlines and boundaries
- color (color) - Border color values
- size (dimension) - Border width measurements
- radius (dimension / ratio) - Corner rounding values
- style (string: none, hidden, dotted, dashed, solid, double, groove, ridge, inset, outset) - Border line styles

#### shadow
CSS shadow effects for depth and elevation
- box-shadow (inner, outer) - Element shadows
- drop-shadow - Filter-based shadows
- text-shadow - Text shadow effects

#### shape
CSS shape properties for non-rectangular layouts
- clip-path definitions and shape functions

### Motion & Effects

#### animation
CSS animation properties for controlling motion and transitions
- delay (dimension) - Animation start delay
- direction (string: normal, reverse, alternate, alternate-reverse) - Animation direction
- duration (dimension) - Animation timing duration
- fill-mode (string: none, forwards, backwards, both) - Animation fill behavior
- iteration-count (number) - Number of animation repetitions
- name (string) - Animation keyframe name
- play-state (string: running, paused) - Animation execution state
- timing-function (easing) - Animation acceleration curve

#### easing
Animation timing functions for smooth motion curves
- built-in (string: ease, ease-in etc.) - CSS predefined easing
- cubic-bezier (string) - Custom bezier curve definitions

#### transform
CSS transform functions for element positioning and effects
- Individual transform properties and composite functions

### Visual Effects

#### gradient
CSS gradient functions for background and fill effects
- linear-gradient, radial-gradient, conic-gradient definitions

#### filter
CSS filter functions for visual effects
- Functions like blur(), brightness(), contrast(), etc.

### Advanced Types

#### function
CSS function values for dynamic calculations
- calc - Mathematical calculations
- clamp - Value clamping with min/max
- min - Minimum value selection
- max - Maximum value selection
- etc.

#### url
File references and external resource links

## W3C Standard Types

### Basic Types
- **color**: Hex, rgb(), hsl(), named colors
- **dimension**: Number with unit (px, rem, em, %, etc.)
- **duration**: Time values for animations
- **number**: Plain numeric values
- **url**: File references

### Typography Types
- **font-family**: Font stack (string or array)
- **font-weight**: 1-1000 or keywords

### Advanced Types
- **cubic-bezier**: Animation easing (4-number array)
- **shadow**: Complex shadow objects

## Code Examples

### Basic Token Structure

```json
{
  "name": "My Design System",
  "version": "1.0.0",
  "$description": "Optional description of the design system",
  "tokens": {
    "colors": {
      "--primary-blue": {
        "$value": "#3399ff",
        "$type": "color",
        "$description": "Primary brand blue color"
      }
    }
  }
}
```

### Token References

```json
{
  "tokens": {
    "colors": {
      "--primary": {
        "$value": "#3399ff",
        "$type": "color"
      },
      "--button-bg": {
        "$value": "{colors.--primary}",
        "$type": "color"
      }
    }
  }
}
```

### Group Organization

```json
{
  "tokens": {
    "colors": {
      "brand": {
        "--primary": { "$value": "#3399ff", "$type": "color" },
        "--secondary": { "$value": "#ff6b35", "$type": "color" }
      },
      "semantic": {
        "--error": { "$value": "#d32f2f", "$type": "color" },
        "--success": { "$value": "#4caf50", "$type": "color" }
      }
    },
    "spacing": {
      "--xs": { "$value": "4px", "$type": "dimension" },
      "--sm": { "$value": "8px", "$type": "dimension" },
      "--md": { "$value": "16px", "$type": "dimension" }
    }
  }
}
```

### Complex Shadow Token

```json
{
  "shadow": {
    "--bxsh-medium": {
      "$type": "shadow",
      "$description": "A composite token where some sub-values are references to tokens that have the correct type and others are explicit values",
      "$value": {
        "color": "{color.shadow-050}",
        "offsetX": "{space.small}",
        "offsetY": "{space.small}",
        "blur": "1.5rem",
        "spread": "0rem"
      }
    }
  }
}
```

### Shadow Property Structure

```css
box-shadow: {
  inset, /* boolean keyword */
  offset-x,
  offset-y,
  blur-radius,
  spread-radius,
  color
}

text-shadow: {
  color,
  offset-x,
  offset-y,
  blur-radius
}
```

## W3C Compliance

This project follows the [W3C Design Tokens Format](https://deploy-preview-298--designtokensorg.netlify.app/tr/drafts/format/) and [Resolver](https://deploy-preview-289--designtokensorg.netlify.app/tr/drafts/resolver/) specifications.

### Required Properties
- `$value`: The actual token value
- `$type`: The type of token (recommended but optional)

### Optional Properties
- `$description`: Human-readable description
- `$extensions`: Vendor-specific metadata

### Validation Rules

1. **Required Properties**: All tokens must have `$value`
2. **Reserved Names**: Token names cannot start with `$`
3. **Type Validation**: Values must match their declared type
4. **No Circular References**: Token references must not create loops
5. **Valid Units**: Dimensions must use valid CSS units
6. **Font Weight Range**: Must be 1-1000 or valid keywords

### Best Practices

1. **Use Semantic Names**: Prefer `--primary-blue` over `--color-1`
2. **Consistent Grouping**: Organize by purpose (colors, spacing, typography)
3. **CSS Custom Property Keys**: Use CSS custom property names as token keys
4. **Descriptive Documentation**: Include `$description` for complex tokens
5. **Type Specification**: Always specify `$type` for clarity
6. **Reference Patterns**: Use references to maintain consistency

### Non-W3C Extensions

This system supports additional custom properties:
- Custom types like `ratio`, `gradient` (with `render` property for visualization)
- CSS custom property mapping through token key names
- Extended metadata in root-level properties

## Resources & Documentation

### Official W3C Specifications
- **W3C Design Tokens Format**: https://deploy-preview-298--designtokensorg.netlify.app/tr/drafts/format/
  - Comprehensive specification for token structure, types, and validation rules
- **W3C Design Tokens Resolver**: https://deploy-preview-289--designtokensorg.netlify.app/tr/drafts/resolver/
  - Guidelines for token resolution, references, and alias handling
- **W3C Community Group**: https://design-tokens.github.io/community-group/format/
  - Community-driven development and discussions

### Inspiration & Tools
- **Open Props**: https://github.com/argyleink/open-props
  - CSS custom properties framework that inspired this token organization approach
  - Provides excellent examples of CSS-based design token patterns

### Development Tools
- **Figma Plugin**: Integration tools for design-to-token workflows (configuration needed)