# Color Picker

A custom element color picker with HSV-based controls. Features an XY pad for saturation/brightness, sliders for hue and alpha, and outputs in multiple formats.

## Installation

```bash
npm install @browser.style/color-picker
```

For required dependencies and basic setup, see the [main documentation](../readme.md).

## Usage

Import the component:

```javascript
import '@browser.style/color-picker';
```

Or include via script tag:

```html
<script type="module" src="node_modules/@browser.style/color-picker/index.js"></script>
```

## Basic Example

```html
<ui-color-picker value="#007bff"></ui-color-picker>
```

## Attributes

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `value` | String | — | Initial color in hex format |

## Events

### change

Dispatched whenever the color changes. Returns color in multiple formats:

```javascript
const picker = document.querySelector('ui-color-picker');
picker.addEventListener('change', (e) => {
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

## CSS Parts

| Part | Description |
|------|-------------|
| `xy` | Saturation/brightness picker pad |
| `hue` | Hue slider (0-360) |
| `alpha` | Alpha/opacity slider (0-1) |
| `output` | Color preview button (click to copy) |

## Examples

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

### With Popover

```html
<button popovertarget="color-picker" id="trigger"></button>
<div id="color-picker" popover>
  <ui-color-picker value="#007bff"></ui-color-picker>
</div>

<script>
  const picker = document.querySelector('ui-color-picker');
  const trigger = document.querySelector('#trigger');
  picker.addEventListener('change', (e) => {
    trigger.style.backgroundColor = e.detail.hex;
  });
</script>
```

### Custom Styling

```html
<ui-color-picker
  value="#007bff"
  style="--ui-color-picker-w: 320px; --ui-color-picker-bdrs: 1em;">
</ui-color-picker>
```

## Controls

| Control | Function |
|---------|----------|
| XY Pad | X = Saturation, Y = Brightness |
| Hue Slider | Select hue (0-360 degrees) |
| Alpha Slider | Set transparency (0-1) |
| Output Button | Click to copy hex value |

## Notes

- Uses the `<x-y>` component for the saturation/brightness pad
- Click the color preview button to copy hex value to clipboard
- For mobile devices, consider using native `<input type="color">` for better UX
- Setting `value` attribute resets alpha to 1
