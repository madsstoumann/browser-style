# Design Token Editors

## Overview

Design Token Editors provides **specialized web component editors** for working with W3C design tokens. Currently features an advanced color editor with full color space support.

## Architecture

### Package Structure

```
design-token-editors/
├── index.js           # Main exports
├── README.md          # User documentation
├── package.json       # NPM package configuration
└── color/
    └── index.js       # EditColor component
```

### Component Ecosystem

```
design-token (token display)
  └─ Dynamically imports design-token-editors
      └─ edit-color (color picker)
          └─ Uses design-token-styles (shared CSS)
```

## EditColor Component

### Overview

`<edit-color>` is a comprehensive color picker supporting all modern CSS color spaces.

### Usage

```html
<edit-color value="#1976D2"></edit-color>

<script type="module">
  import '@browser.style/design-token-editors/color';

  const editor = document.querySelector('edit-color');
  editor.addEventListener('change', (e) => {
    console.log('New color:', e.detail.css);
  });
</script>
```

### Supported Color Spaces

| Space | Type | CSS Output |
|-------|------|------------|
| sRGB | RGB-like | `color(srgb 0.1 0.46 0.82)` |
| display-p3 | RGB-like | `color(display-p3 0.1 0.46 0.82)` |
| rec2020 | RGB-like | `color(rec2020 ...)` |
| OKLAB | Perceptual | `oklab(0.7 0.27 -0.08)` |
| OKLCH | Perceptual | `oklch(0.7 0.27 240)` |
| LAB | Perceptual | `lab(70 27 -8)` |
| LCH | Perceptual | `lch(70 28 340)` |
| HSL | Legacy | `hsl(210 100% 50%)` |
| HWB | Legacy | `hwb(210 0% 0%)` |

### Value Formats

Accepts both string and object formats:

```javascript
// String format
editor.value = '#1976D2';
editor.value = 'oklch(0.7 0.27 240)';
editor.value = 'color(display-p3 0.1 0.46 0.82)';

// W3C token format
editor.value = {
  colorSpace: 'display-p3',
  components: [0.1, 0.46, 0.82],
  alpha: 1
};
```

### Events

#### `change`

Fired when color value changes:

```javascript
editor.addEventListener('change', (e) => {
  const { css, space, components, alpha } = e.detail;
  console.log('CSS:', css);              // "oklch(0.7 0.27 240)"
  console.log('Space:', space);          // "oklch"
  console.log('Components:', components); // [0.7, 0.27, 240]
  console.log('Alpha:', alpha);          // 1
});
```

### Properties

| Property | Type | Description |
|----------|------|-------------|
| `value` | string \| object | Get/set color value |

## Styling

Uses shared styles from `design-token-styles`:

```css
/* Preview with transparency grid */
[part="edit-color-preview"] {
  background-image:
    linear-gradient(var(--preview-color), var(--preview-color)),
    conic-gradient(#eee 0.25turn, #fff 0.25turn 0.5turn, ...);
}

/* Component rows */
[part~="edit-color-row"] {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(0, 1fr));
}

/* Range slider rows */
[part~="edit-color-row"]:has([type="range"]) {
  grid-template-columns: 1ch 1fr 7ch;
}
```

## Dependencies

- **design-token-styles**: Shared CSS for consistent styling
- **Color.js**: Color space conversions (https://colorjs.io/)

## Future Editors

Planned components:

| Component | Purpose |
|-----------|---------|
| `<edit-gradient>` | Linear, radial, conic gradient editor |
| `<edit-shadow>` | Box shadow editor |
| `<edit-border>` | Border editor |
| `<edit-typography>` | Typography token editor |
| `<edit-transition>` | Transition/animation editor |

## Integration with design-token

The `<design-token>` component dynamically loads editors:

```javascript
// In design-token/index.js
if ($type === 'color' && !isAlias) {
  await import('../design-token-editors/color/index.js');
  const editor = document.createElement('edit-color');
  editor.value = $value;

  editor.addEventListener('change', (e) => {
    this.#pendingValue = e.detail;
    // Update preview and value input
  });
}
```

## Implementation Notes

### Color Space Detection

The component must detect and preserve the original color space:

```javascript
// Parse incoming value to detect space
// Store space for output conversion
// Allow user to switch spaces while editing
```

### Wide Gamut Handling

For wide gamut colors (display-p3, rec2020):
- Show warning if color exceeds sRGB
- Provide fallback color suggestion
- Use `@supports` for browser capability detection

## Color Space Slider Configurations

Each color space has specific slider ranges:

### RGB-like Spaces (rgb, display-p3, a98-rgb, prophoto-rgb, rec2020, srgb-linear)
```javascript
r: { min: 0, max: 100, step: 0.1, suffix: '%' }
g: { min: 0, max: 100, step: 0.1, suffix: '%' }
b: { min: 0, max: 100, step: 0.1, suffix: '%' }
```

### HSL
```javascript
h: { min: 0, max: 360, step: 0.1 }      // Hue
s: { min: 0, max: 100, step: 0.1, suffix: '%' }  // Saturation
l: { min: 0, max: 100, step: 0.1, suffix: '%' }  // Lightness
```

### HWB
```javascript
h: { min: 0, max: 360, step: 0.1 }      // Hue
w: { min: 0, max: 100, step: 0.1, suffix: '%' }  // Whiteness
b: { min: 0, max: 100, step: 0.1, suffix: '%' }  // Blackness
```

### OKLAB
```javascript
l: { min: 0, max: 1, step: 0.001 }      // Lightness
a: { min: -0.4, max: 0.4, step: 0.001 } // Green-Red axis
b: { min: -0.4, max: 0.4, step: 0.001 } // Blue-Yellow axis
```

### OKLCH
```javascript
l: { min: 0, max: 1, step: 0.001 }      // Lightness
c: { min: 0, max: 0.4, step: 0.001 }    // Chroma
h: { min: 0, max: 360, step: 0.1 }      // Hue
```

### LAB
```javascript
l: { min: 0, max: 100, step: 0.1 }      // Lightness
a: { min: -125, max: 125, step: 0.1 }   // Green-Red axis
b: { min: -125, max: 125, step: 0.1 }   // Blue-Yellow axis
```

### LCH
```javascript
l: { min: 0, max: 100, step: 0.1 }      // Lightness
c: { min: 0, max: 150, step: 0.1 }      // Chroma
h: { min: 0, max: 360, step: 0.1 }      // Hue
```

### XYZ Spaces (xyz, xyz-d50, xyz-d65)
```javascript
x: { min: 0, max: 1, step: 0.001 }
y: { min: 0, max: 1, step: 0.001 }
z: { min: 0, max: 1, step: 0.001 }
```

### Alpha Channel (all spaces)
```javascript
alpha: { min: 0, max: 1, step: 0.001, prefix: '/ ' }
```

## Gamut Warning System

When colors fall outside sRGB gamut:

```javascript
updateWarning() {
  const isInGamut = this.#color.inGamut('srgb');
  if (!isInGamut) {
    const clamped = this.#color.toGamut('srgb');
    this.#elements.fallback.style.setProperty('--_bg', clamped.toString({ format: 'hex' }));
    this.#elements.warning.hidden = false;
  }
}
```

## CSS Parts

| Part | Description |
|------|-------------|
| `edit-color-preview` | Color preview swatch |
| `edit-color-row` | Slider row containers |
| `edit-color-warning` | Out-of-gamut warning |
| `edit-color-warning-fallback` | Clamped color preview |

## Debugging Tips

1. **Color not updating?** Check `change` event listener is attached
2. **Weird color values?** Verify color space conversion is correct
3. **Editor not loading?** Check import path and module resolution
4. **Alpha not working?** Ensure alpha channel is included in components
5. **Out-of-gamut warning not showing?** Check if color is actually outside sRGB gamut
