# Edit Color Component

A custom web component for interactive color editing with support for multiple color spaces.

## Features

- **Multiple Color Spaces**: RGB, HSL, HWB, Lab, LCH, Oklab, Oklch
- **Real-time Preview**: Visual color preview that updates as you adjust values
- **Interactive Sliders**: Range and number inputs for precise color control
- **Alpha Support**: Transparency control with dedicated slider
- **Alias Detection**: Recognizes and handles color aliases (e.g., `{primary}`)
- **Event-driven**: Dispatches 'change' events with detailed color data

## Usage

```html
<edit-color value="red"></edit-color>
<edit-color value="#FF5733"></edit-color>
<edit-color value="rgb(255 87 51)"></edit-color>
<edit-color value="hsl(15 100% 60%)"></edit-color>
<edit-color value="oklab(0.5 0.2 0.1)"></edit-color>
```

## Attributes

- `value`: The color value as a string. Supports:
  - Named colors: `red`, `blue`, etc.
  - Hex: `#FF5733`, `#3366FF`
  - RGB: `rgb(255 87 51)`, `color(srgb 1 0.5 0.2)`
  - HSL: `hsl(15 100% 60%)`
  - HWB: `hwb(15 20% 20%)`
  - Lab: `lab(50 40 30)`
  - LCH: `lch(50 40 15)`
  - Oklab: `oklab(0.5 0.2 0.1)`
  - Oklch: `oklch(0.5 0.2 15)`
  - Wide gamut RGB: `color(display-p3 1 0 0)`, `color(rec2020 1 0 0)`
  - XYZ: `color(xyz-d65 0.5 0.3 0.2)`
  - Aliases: `{primary}`, `{accent}`

## Events

The component dispatches a `change` event whenever the color is modified. The event detail contains:

```javascript
{
  space: 'rgb',        // Current color space ('rgb', 'hsl', 'hwb', 'lab', 'lch', 'oklab', 'oklch', 'display-p3', 'a98-rgb', 'prophoto-rgb', 'rec2020', 'srgb-linear', 'xyz-d65', 'xyz-d50', 'hex')
  components: [0.5, 0.2, 0.1],  // Array of color component values
  alpha: 1,            // Alpha value (0-1)
  css: 'rgb(50% 20% 10%)'  // CSS color string
}
```

## JavaScript API

```javascript
const editor = document.querySelector('edit-color');

// Set color programmatically
editor.value = 'hsl(120 100% 50%)';

// Listen for changes
editor.addEventListener('change', (event) => {
  console.log('Color changed:', event.detail);
  // event.detail: { space, components, alpha, css }
});
```

## Color Spaces

### RGB-based Spaces
- **RGB/sRGB**: Standard RGB color space
- **Display P3**: Wide gamut RGB for modern displays
- **A98 RGB**: Adobe RGB (1998)
- **ProPhoto RGB**: Wide gamut RGB for professional photography
- **Rec. 2020**: Ultra-wide gamut RGB for 4K/HDR
- **sRGB Linear**: Linear version of sRGB

### HSL and HWB
- **HSL**: Hue, Saturation, Lightness
- **HWB**: Hue, Whiteness, Blackness

### Lab-based Spaces
- **Lab**: CIE Lab color space
- **LCH**: CIE Lab in polar coordinates (Lightness, Chroma, Hue)
- **Oklab**: Improved Lab space by Björn Ottosson
- **Oklch**: Oklab in polar coordinates

### XYZ Spaces
- **XYZ D65**: CIE XYZ with D65 white point
- **XYZ D50**: CIE XYZ with D50 white point

## Dependencies

- [Color.js](https://colorjs.io/) - For color space conversions and parsing

## Browser Support

Modern browsers with support for:
- Custom Elements
- ES6 Modules
- CSS Grid
- Shadow DOM

## Demo

See `index.html` for a comprehensive demo with examples of all supported color spaces and formats.