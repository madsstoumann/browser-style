# XY Controller

A 2D coordinate picker/controller custom element for selecting a point within a bounded area. Supports mouse, touch, and keyboard navigation with optional grid snapping.

## Installation

```bash
npm install @browser.style/xy
```

For required dependencies and basic setup, see the [main documentation](../readme.md).

## Usage

Import the component:

```javascript
import '@browser.style/xy';
```

Or include via script tag:

```html
<script type="module" src="node_modules/@browser.style/xy/index.js"></script>
```

## Basic Example

```html
<x-y x="50" y="50"></x-y>
```

## Attributes

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `x` | Number | `0` | Initial X value |
| `y` | Number | `100` | Initial Y value |
| `min-x` | Number | `0` | Minimum X value |
| `max-x` | Number | `100` | Maximum X value |
| `min-y` | Number | `0` | Minimum Y value |
| `max-y` | Number | `100` | Maximum Y value |
| `grid-x` | Number | `0` | Grid divisions on X axis (0 = no grid) |
| `grid-y` | Number | `0` | Grid divisions on Y axis (0 = no grid) |
| `shift` | Number | `10` | Movement multiplier when Shift is held |
| `leave` | Boolean | `true` | Trigger `xyup` on pointer leave |

## Events

| Event | Description | Detail |
|-------|-------------|--------|
| `xydown` | Pointer down on element | — |
| `xyup` | Pointer up or leave | — |
| `xymove` | Position changed | `{ x, y, tx, ty, gx, gy }` |
| `xytoggle` | Spacebar pressed | — |

### Event Detail Properties

| Property | Description |
|----------|-------------|
| `x` | Logical X value (within min-x to max-x) |
| `y` | Logical Y value (within min-y to max-y) |
| `tx` | Pixel X translation |
| `ty` | Pixel Y translation |
| `gx` | Grid X position (1-based, if grid enabled) |
| `gy` | Grid Y position (1-based, if grid enabled) |

## Keyboard Navigation

| Key | Action |
|-----|--------|
| Arrow keys | Move by single step |
| Shift + Arrow | Move by `shift` amount (default: 10x) |
| Shift + Alt + Arrow | Move by 1 pixel |
| Home | Move to min-x |
| End | Move to max-x |
| Ctrl + Home | Move to min-y |
| Ctrl + End | Move to max-y |
| Space | Dispatch `xytoggle` event |

## CSS Custom Properties

### Host Styling

| Property | Default | Description |
|----------|---------|-------------|
| `--ui-xy-bg` | `var(--CanvasGray)` | Background color |

### Point Styling

| Property | Default | Description |
|----------|---------|-------------|
| `--ui-xy-point-bg` | `var(--ButtonFace)` | Point background |
| `--ui-xy-point-bdc` | `var(--ButtonBorder)` | Point border color |
| `--ui-xy-point-bdw` | `0.5rem` | Point border width |
| `--ui-xy-point-bdrs` | `50%` | Point border radius |
| `--ui-xy-point-sz` | `4rem` | Point size |
| `--ui-xy-point--focus` | `var(--Highlight)` | Point focus background |

### Grid Styling

| Property | Default | Description |
|----------|---------|-------------|
| `--ui-xy-grid-bdw` | `2px` | Grid line width |

## CSS Parts

| Part | Description |
|------|-------------|
| `xypoint` | The draggable point indicator |

## Examples

### Custom Range

```html
<x-y min-x="0" max-x="360" min-y="0" max-y="100" x="180" y="50"></x-y>
```

### Grid Mode

```html
<x-y grid-x="6" grid-y="6"></x-y>
```

When grid is enabled, the point snaps to grid intersections and resizes to fill one cell.

### Custom Styling

```html
<x-y style="
  --ui-xy-bg: #333;
  --ui-xy-point-bg: transparent;
  --ui-xy-point-bdc: white;
  --ui-xy-point-bdw: 2px;
  --ui-xy-point-sz: 24px;
"></x-y>
```

### JavaScript Integration

```javascript
const xy = document.querySelector('x-y');

// Listen for movement
xy.addEventListener('xymove', (e) => {
  console.log(`X: ${e.detail.x}, Y: ${e.detail.y}`);
});

// Listen for interaction
xy.addEventListener('xydown', () => console.log('Started'));
xy.addEventListener('xyup', () => console.log('Ended'));

// Programmatic positioning
xy.setAttribute('x', '75');
xy.setAttribute('y', '25');
```

## Notes

- **Y-axis inversion**: Visual Y increases downward, but logical Y increases upward (like a standard coordinate system).
- **Grid sizing**: In grid mode, point size is automatically set to `100% / grid-x`.
- **Leave behavior**: Default `leave="true"` triggers `xyup` when pointer leaves. Set to `false` for continuous tracking outside bounds.
- **Focus**: The element is focusable (`tabIndex=0`) to enable keyboard navigation.
