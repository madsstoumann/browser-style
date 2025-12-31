# Color Picker - Internal Architecture

## Overview

`<ui-color-picker>` is a custom HTML element that provides a visual color picker with HSV-based controls. It features an XY pad for saturation/brightness, sliders for hue and alpha, and outputs color values in multiple formats (hex, rgba, hsla, hsva).

**Version:** 1.0.00 (index.js header)

**Component Type:** Web Component (Custom Element with Shadow DOM)

**Key Characteristics:**
- Shadow DOM encapsulation with Constructable Stylesheets
- HSV/HSB color model for intuitive picking
- Uses `<x-y>` component for saturation/brightness control
- Outputs hex, rgba, hsla, and hsva formats
- Click-to-copy hex value
- Observed `value` attribute for programmatic color setting

**Dependencies:**
- `@browser.style/xy` (x-y controller component)
- `@browser.style/base` (peer dependency for CSS variables)

## Architecture Overview

### Component Structure

```
<ui-color-picker value="#007bff">
  #shadow-root
    ├── <x-y part="xy">              ← Saturation (X) / Brightness (Y)
    ├── <input type="range" part="hue">   ← Hue slider (0-360)
    ├── <input type="range" part="alpha"> ← Alpha slider (0-1)
    └── <button part="output">       ← Color preview / copy button
```

### Color Model

The picker uses HSV internally, converting to other formats for output:

```
HSV (Hue, Saturation, Value/Brightness)
  ↓
  ├── HSLA (for CSS output)
  ├── RGBA (computed via CSS)
  └── Hex (final conversion)
```

**Why HSV?**
- X-axis maps directly to Saturation (0-100%)
- Y-axis maps directly to Value/Brightness (0-100%)
- Hue is independent on its own slider
- More intuitive than RGB for color selection

## Color State Object

```javascript
this.color = {
  hsla: { h, s, l, a },   // Hue, Saturation, Lightness, Alpha
  hsva: { h, s, v, a },   // Hue, Saturation, Value, Alpha (primary)
  rgba: { r, g, b, a },   // Red, Green, Blue, Alpha
  hex: '#rrggbb[aa]'      // Hex with optional alpha
};
```

## Color Conversion Methods

### hexToRgb(hex)

Converts hex color to RGB:

```javascript
hexToRgb('#007bff') → { r: 0, g: 123, b: 255 }
```

### rgbToHsv(r, g, b)

Converts RGB to HSV:

```javascript
rgbToHsv(0, 123, 255) → { h: 211, s: 1, v: 1 }
```

### hsvaToHsla(h, s, v, a)

Converts HSVA to HSLA:

```javascript
hsvaToHsla(211, 1, 1, 1) → { h: 211, s: 100, l: 50, a: 1 }
```

The conversion formula:
```javascript
let l = v * (1 - s / 2);
let hslSaturation = (minL === 0) ? 0 : (v - l) / minL;
```

### rgbaToHex(r, g, b, a)

Converts RGBA to hex:

```javascript
rgbaToHex(0, 123, 255, 1) → '#007bff'
rgbaToHex(0, 123, 255, 0.5) → '#007bff80'
```

## Control Mappings

### XY Pad

| Axis | Range | Maps To |
|------|-------|---------|
| X | 0-100 | Saturation (0-1) |
| Y | 0-100 | Value/Brightness (0-1) |

```javascript
this.xy.addEventListener('xymove', (e) => {
  this.updateColor('s', e.detail.x / 100);
  this.updateColor('v', e.detail.y / 100);
});
```

### Hue Slider

| Range | Maps To |
|-------|---------|
| 0-360 | Hue (degrees) |

### Alpha Slider

| Range | Maps To |
|-------|---------|
| 0-1 | Alpha (opacity) |

## Visual Rendering

### XY Pad Background

Three-layer gradient creating the HSV picker:

```css
:host::part(xy) {
  /* Base hue color */
  background-color: hsl(var(--_h, 0), 100%, 50%);

  /* Black gradient (bottom = dark) */
  background-image:
    linear-gradient(rgba(0, 0, 0, 0) 0%, rgb(0, 0, 0) 100%),
    /* White gradient (left = white) */
    linear-gradient(to right, rgb(255, 255, 255) 0%, rgba(255, 255, 255, 0) 100%);
}
```

### Hue Slider Background

Rainbow gradient representing all hues:

```css
:host::part(hue) {
  background-image: linear-gradient(90deg,
    #f00 0%, #ff0 17%, #0f0 33%, #0ff 50%,
    #00f 67%, #f0f 83%, #f00 100%);
}
```

### Alpha Slider Background

Gradient from transparent to current hue over checkerboard:

```css
:host::part(alpha) {
  background:
    linear-gradient(90deg, #0000, hsl(var(--_h, 0), 100%, 50%)) 0 0/100% 100%,
    repeating-conic-gradient(from 90deg, #FFF 0 25%, #0000 0, #0003 0 50%) 0 0/10px 10px;
}
```

## updateColor Method

Central method for all color updates:

```javascript
updateColor(prop, value) {
  // 1. Update HSVA
  this.color.hsva[prop] = value;

  // 2. Convert to HSLA
  this.color.hsla = this.hsvaToHsla(...Object.values(this.color.hsva));

  // 3. Apply HSLA to output button
  this.output.style.backgroundColor = `hsla(${h}, ${s}%, ${l}%, ${a})`;

  // 4. Update hue CSS variable for XY pad
  this.style.setProperty('--_h', h);

  // 5. Get computed RGB from CSS
  const [r, g, b] = getComputedStyle(this.output).backgroundColor.match(/\d+/g);

  // 6. Convert to hex
  this.color.hex = this.rgbaToHex(r, g, b, a);

  // 7. Dispatch change event
  this.dispatchEvent(new CustomEvent('change', { detail: this.color }));
}
```

## Observed Attributes

```javascript
static observedAttributes = ['value'];
```

Setting the `value` attribute updates the picker:

```javascript
attributeChangedCallback(name, oldValue, newValue) {
  if (name === 'value') {
    const { r, g, b } = this.hexToRgb(newValue);
    const { h, s, v } = this.rgbToHsv(r, g, b);
    this.color.hsva = { h, s, v, a: 1 };
    this.alpha.value = 1;
    this.hue.value = h;
    this.xy.setAttribute('x', s * 100);
    this.xy.setAttribute('y', v * 100);
  }
}
```

## Events

### change

Dispatched whenever the color changes:

```javascript
colorPicker.addEventListener('change', (e) => {
  console.log(e.detail.hex);   // '#007bff'
  console.log(e.detail.rgba);  // { r: 0, g: 123, b: 255, a: 1 }
  console.log(e.detail.hsla);  // { h: 211, s: 100, l: 50, a: 1 }
  console.log(e.detail.hsva);  // { h: 211, s: 1, v: 1, a: 1 }
});
```

## CSS Custom Properties

| Property | Default | Description |
|----------|---------|-------------|
| `--ui-color-picker-bdrs` | `0.75em` | Border radius |
| `--ui-color-picker-bdw` | `2px` | Border width |
| `--ui-color-picker-w` | `250px` | Maximum width |

### XY Controller Overrides

```css
--ui-xy-bg: #0000;
--ui-xy-point-bdc: #FFF;
--ui-xy-point-bdw: 2px;
--ui-xy-point-bg: #0000;
--ui-xy-point-sz: 24px;
--ui-xy-point--focus: #0000;
```

## CSS Parts

| Part | Element | Description |
|------|---------|-------------|
| `xy` | `<x-y>` | Saturation/brightness picker |
| `hue` | `<input type="range">` | Hue slider |
| `alpha` | `<input type="range">` | Alpha/opacity slider |
| `output` | `<button>` | Color preview (click to copy) |

## Usage Patterns

### Basic Usage

```html
<ui-color-picker value="#007bff"></ui-color-picker>
```

### Listen for Changes

```javascript
const picker = document.querySelector('ui-color-picker');
picker.addEventListener('change', (e) => {
  document.body.style.backgroundColor = e.detail.hex;
});
```

### Programmatic Color Setting

```javascript
picker.setAttribute('value', '#ff5500');
```

### Copy to Clipboard

Clicking the output button copies the hex value:

```javascript
this.output.addEventListener('click', () => {
  navigator.clipboard.writeText(this.color.hex);
});
```

### With Popover

```html
<button popovertarget="color-picker">Pick Color</button>
<div id="color-picker" popover>
  <ui-color-picker value="#007bff"></ui-color-picker>
</div>
```

## Gotchas & Edge Cases

1. **RGB extraction hack**: The component uses `getComputedStyle().backgroundColor` to get RGB values after setting HSLA, which relies on browser CSS color conversion.

2. **Alpha reset**: When setting `value` attribute, alpha is reset to 1.

3. **No input event**: The component only dispatches `change` events, not `input` events during continuous dragging.

4. **Hex alpha format**: When alpha < 1, hex includes alpha as two extra characters (e.g., `#007bff80`).

5. **FIX ME comment**: Line 111 has a `/*FIX ME*/` comment regarding alpha slider hue variable.

6. **Native color picker**: The component recommends using native `<input type="color">` for better mobile experience.
