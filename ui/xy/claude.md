# XY Controller - Internal Architecture

## Overview

`<x-y>` is a custom HTML element that provides a 2D coordinate picker/controller. It allows users to select a point within a bounded area using mouse, touch, or keyboard navigation. The component is commonly used for color pickers (saturation/brightness), audio controllers, or any UI requiring 2D input.

**Version:** 1.0.15 (index.js header)

**Component Type:** Web Component (Custom Element with Shadow DOM)

**Key Characteristics:**
- Shadow DOM encapsulation with Constructable Stylesheets
- Pointer and keyboard event handling
- Optional grid snapping
- ResizeObserver for responsive behavior
- Custom events for integration
- CSS custom properties for theming

**Dependencies:**
- `@browser.style/base` (peer dependency for CSS variables)

## Architecture Overview

### Component Structure

```
<x-y>                           ← Host element (receives focus, handles events)
  #shadow-root
    └── <button part="xypoint"> ← Visual indicator (inert, pointer-events: none)
```

The button is marked `inert` to prevent it from receiving focus or being clickable—all interaction is handled on the host element.

### Coordinate System

The component maps pixel positions to logical values:

```
Visual (pixels)              Logical (values)
┌─────────────────┐          min-x ──────────── max-x
│ (0,0)           │            │                  │
│        ●        │     →      │     (x, y)       │
│           (tx,ty)│           │                  │
└─────────────────┘          min-y ──────────── max-y
   (maxX, maxY)

Note: Y-axis is inverted (visual top = max-y, visual bottom = min-y)
```

### State Properties

| Property | Type | Description |
|----------|------|-------------|
| `x` | Number | Current logical X value |
| `y` | Number | Current logical Y value |
| `xCurrent` | Number | Current pixel X position |
| `yCurrent` | Number | Current pixel Y position |
| `active` | Boolean | Whether pointer is currently down |
| `settings` | Object | Parsed configuration from attributes |

### Settings Object

Parsed from attributes in `connectedCallback`:

```javascript
this.settings = {
  gridX: parseInt(this.getAttribute('grid-x')) || 0,
  gridY: parseInt(this.getAttribute('grid-y')) || 0,
  leave: this.getAttribute('leave') !== null ? this.getAttribute('leave') === 'true' : true,
  minX: parseInt(this.getAttribute('min-x')) || 0,
  maxX: parseInt(this.getAttribute('max-x')) || 100,
  minY: parseInt(this.getAttribute('min-y')) || 0,
  maxY: parseInt(this.getAttribute('max-y')) || 100,
  shift: parseInt(this.getAttribute('shift')) || 10,
  x: parseInt(this.getAttribute('x')) || 0,
  y: parseInt(this.getAttribute('y')) || 100
};
```

## Event System

### Custom Events

| Event | Trigger | Detail |
|-------|---------|--------|
| `xydown` | Pointer down | None |
| `xyup` | Pointer up or leave | None |
| `xymove` | Position change | `{ x, y, tx, ty, gx, gy }` |
| `xytoggle` | Spacebar pressed | None |

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
| Arrow keys | Move by ratio amount |
| Shift + Arrow | Move by `shift` amount (default: 10x) |
| Shift + Alt + Arrow | Move by 1 pixel |
| Home | Move to min-x |
| End | Move to max-x |
| Ctrl + Home | Move to min-y |
| Ctrl + End | Move to max-y |
| Space | Dispatch `xytoggle` event |

## Grid Snapping

When `grid-x` and `grid-y` attributes are set:

1. **Visual grid** is rendered via CSS `conic-gradient`
2. **Point snaps** to grid intersections
3. **Point size** becomes `100% / grid-x`

```css
:host([grid-x][grid-y]) {
  --ui-xy-point-sz: calc(100% / var(--xy-grid-x));
  background: conic-gradient(from 90deg at var(--ui-xy-grid-bdw) var(--ui-xy-grid-bdw),
    #0000 25%, var(--ButtonFace) 0) 0 0 / var(--_wx) var(--_wy);
}
```

Snap calculation:
```javascript
this.snapX = this.settings.gridX ? this.areaX / this.settings.gridX : 0;
this.snapY = this.settings.gridY ? this.areaY / this.settings.gridY : 0;

// In update():
if (this.snapX) this.xCurrent = Math.round(this.xCurrent / this.snapX) * this.snapX;
if (this.snapY) this.yCurrent = Math.round(this.yCurrent / this.snapY) * this.snapY;
```

## Coordinate Conversion

### Pixel to Logical (`updateXY`)

```javascript
this.x = tx * (this.difX / (this.areaX - this.pointsize)) + this.settings.minX;
this.y = this.difY - ty * (this.difY / (this.areaY - this.pointsize)) + this.settings.minY;
```

Where:
- `difX` = `maxX - minX` (logical range)
- `areaX` = component width in pixels
- `pointsize` = point element width
- Y is inverted (visual top = logical max)

### Logical to Pixel (`xyset`)

```javascript
this.xCurrent = (x - this.settings.minX) * this.ratioX;
this.yCurrent = ((this.settings.maxY - y) + this.settings.minY) * this.ratioY;
```

Where:
- `ratioX` = `(areaX - pointsize) / (maxX - minX)`
- `ratioY` = `(areaY - pointsize) / (maxY - minY)`

## ResizeObserver

The component uses ResizeObserver to maintain correct positioning when resized:

```javascript
this.ro = new ResizeObserver(() => {
  this.refresh();           // Recalculate ratios
  this.xyset(this.x, this.y); // Convert current values to new pixel positions
  this.update();            // Apply new positions
});
this.ro.observe(this);
```

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

### Grid Styling (when grid-x/grid-y set)

| Property | Default | Description |
|----------|---------|-------------|
| `--ui-xy-grid-bdw` | `2px` | Grid line width |

### Internal CSS Variables

Set on the host element via JavaScript:

| Property | Description |
|----------|-------------|
| `--tx` | Pixel X translation |
| `--ty` | Pixel Y translation |
| `--xy-grid-x` | Grid X divisions |
| `--xy-grid-y` | Grid Y divisions |

## CSS Parts

| Part | Element | Description |
|------|---------|-------------|
| `xypoint` | `<button>` | The draggable point indicator |

## Observed Attributes

```javascript
static observedAttributes = ['x', 'y'];
```

When `x` or `y` attributes change externally, the component updates its internal state via `attributeChangedCallback`.

## Usage Patterns

### Basic XY Pad

```html
<x-y x="50" y="50"></x-y>
```

### With Custom Range

```html
<x-y min-x="0" max-x="360" min-y="0" max-y="100" x="180" y="50"></x-y>
```

### Grid Mode

```html
<x-y grid-x="6" grid-y="6"></x-y>
```

### In Color Picker (Saturation/Brightness)

```html
<x-y x="100" part="xy"
     style="--ui-xy-bg: #0000;
            --ui-xy-point-bdc: #FFF;
            --ui-xy-point-bdw: 2px;
            --ui-xy-point-bg: #0000;
            --ui-xy-point-sz: 24px;"></x-y>
```

### Prevent Leave Event

```html
<x-y leave="false"></x-y>
```

By default, `pointerleave` triggers `pointerup`. Set `leave="false"` to only trigger on actual `pointerup`.

### JavaScript Integration

```javascript
const xy = document.querySelector('x-y');

// Listen for movement
xy.addEventListener('xymove', (e) => {
  const { x, y, gx, gy } = e.detail;
  console.log(`Position: (${x}, ${y})`);
  console.log(`Grid cell: (${gx}, ${gy})`);
});

// Listen for interaction states
xy.addEventListener('xydown', () => console.log('Started'));
xy.addEventListener('xyup', () => console.log('Ended'));
xy.addEventListener('xytoggle', () => console.log('Toggled'));

// Programmatic positioning
xy.setAttribute('x', '75');
xy.setAttribute('y', '25');
```

## Gotchas & Edge Cases

1. **Y-axis inversion**: Visual Y increases downward, but logical Y increases upward (like a standard coordinate system).

2. **Point size affects range**: The usable area is `element size - point size`, so large points reduce the effective range.

3. **Grid point sizing**: In grid mode, point size is automatically set to `100% / grid-x`, filling one cell.

4. **Leave behavior**: Default `leave="true"` triggers `xyup` when pointer leaves. Useful for color pickers, but set to `false` for continuous tracking.

5. **No disconnectedCallback**: The ResizeObserver is not disconnected when the element is removed. Consider adding cleanup if elements are frequently added/removed.

6. **Integer parsing**: All attribute values are parsed with `parseInt`, so decimal values are truncated.

7. **Focus requirement**: The host element has `tabIndex = 0` to enable keyboard navigation.

8. **Direction override**: Host uses `direction: ltr` to ensure consistent left-to-right behavior regardless of document direction.

## Consumer Components

- **Color Picker** (`ui/color-picker`): Uses x-y for saturation (x) and brightness (y) selection
- **Pocket Synth** (`ui/pocket-synth`): Uses x-y for frequency control with custom min-y/max-y range
