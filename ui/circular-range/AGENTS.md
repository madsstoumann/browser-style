# Circular Range Component - Internal Architecture

## Overview

`<circular-range>` is a form-associated custom element that provides a circular/radial range slider with visual feedback. It supports partial arcs (speedometers, gauges), full 360° rotations, labels, tick indices, and keyboard/pointer interaction.

**Version:** 1.0.8 (index.js:3)

**Component Type:** Form-associated custom element (static formAssociated = true)

**Key Characteristics:**
- Pure vanilla JavaScript, no dependencies
- Uses Shadow DOM with Constructable Stylesheets
- Form-associated via ElementInternals API
- Supports partial arcs (start/end angles) and full circles
- Keyboard accessible with arrow key navigation
- Pointer-based drag interaction
- Safari-specific workarounds for rendering issues

**Use Cases:**
- Speedometers and gauges
- Temperature controls (ovens, thermostats)
- Volume/brightness knobs
- Time pickers (clock faces)
- Partial arc sliders (top-half, bottom-half, quarter arcs)

## Architecture Overview

### Component Structure

```
<circular-range>                     ← Host element (form-associated)
  #shadow-root
    ├── <div part="track">           ← Background track (conic gradient)
    ├── <div part="fill">            ← Value fill indicator (conic gradient)
    ├── <div part="thumb">           ← Draggable thumb element (rotated)
    ├── <ul part="indices">          ← Tick mark container
    │     └── <li>*                  ← Individual tick marks (offset-path positioned)
    ├── <ol part="labels">           ← Label container
    │     └── <li>*                  ← Individual labels (offset-path positioned)
    └── <slot>                       ← Default slot for custom content
```

### Lifecycle Flow

```
constructor()
  ↓
  attachShadow({ mode: 'open' })
  attachInternals() → this.#internals
  Create CSSStyleSheet, adoptedStyleSheets
  Inject HTML template (track, fill, thumb, indices, labels, slot)
  ↓
connectedCallback()
  ↓
  Set tabIndex = 0 (focusable)
  #readAttributes() → Parse min/max/step/start/end/reverse
  #convertInitialValue() → Handle reverse mode value transformation
  Generate indices HTML
  #renderLabels() → Generate label elements
  Set role="slider", aria-valuemin, aria-valuemax
  ↓
  setTimeout(() => {                ← Ensures styles applied
    #update()                       ← Initial visual update
    #updateActiveLabel()            ← Highlight active label if set
    #internals.setFormValue()       ← Initialize form value
    Toggle 'at-min' class           ← Visual state for minimum
    Safari repaint workaround
  })
  ↓
  Add event listeners (keydown, pointerdown)
  Safari visibility handlers (if Safari detected)
  ↓
attributeChangedCallback(name, oldValue, newValue)
  ↓
  'value' → #update()
  'active-label' → #updateActiveLabel()
  ↓
disconnectedCallback()
  ↓
  Remove event listeners
  Remove Safari-specific listeners
```

## Coordinate System & Angle Calculations

### Angle System

The component uses a coordinate system where:
- **0°** = 12 o'clock position (top center)
- **90°** = 3 o'clock position (right)
- **180°** = 6 o'clock position (bottom)
- **270°** = 9 o'clock position (left)
- **360°** = back to 12 o'clock

```
         0°/360°
           │
    315°   │   45°
       ╲   │   ╱
        ╲  │  ╱
  270° ────●──── 90°
        ╱  │  ╲
       ╱   │   ╲
    225°   │   135°
           │
         180°
```

### Critical Formulas

**Value to Angle Conversion:**
```javascript
// From #update() (index.js:372-387)
const fillPercentage = (value - min) / range;           // 0 to 1
const fillAngle = startAngle + (fillPercentage * angleRange);
```

**Pointer to Value Conversion:**
```javascript
// From #pointerMove() (index.js:428-443)
const degree = ((Math.atan2(offsetY - CY, offsetX - CX) * 180 / Math.PI) + 90 + 360) % 360;
const relativeDegree = (degree - startAngle + 360) % 360;
const value = (relativeDegree / radian) + min;
```

**Radian Calculation:**
```javascript
// From #readAttributes() (index.js:349-351)
this.#range = max - min;
this.#angleRange = endAngle - startAngle;
this.#radian = angleRange / range;  // Degrees per unit value
```

### CSS Custom Properties for Angles

```css
--_start: ${startAngle}         /* Track start angle in degrees */
--_end: ${endAngle}             /* Track end angle in degrees */
--_fill: ${fillAngle}           /* Current fill angle in degrees */
--_fill-start: ${fillStartAngle}/* Fill gradient start (reverse-aware) */
--_fill-range: ${fillRange}     /* Fill gradient range in degrees */
--_ta: ${trackEndPercent}%      /* Track end cap offset-distance */
--_tb: ${trackStartPercent}%    /* Track start cap offset-distance */
--_value: ${displayValue}       /* Counter value for ::after */
```

## Rendering Pipeline

### Track & Fill (Conic Gradients)

Both track and fill use `conic-gradient` with a radial mask to create the ring shape:

```css
/* Mask creates the ring (hollow center) */
--_mask: radial-gradient(
  circle farthest-side at center,
  #0000 calc(100% - var(--circular-range-track-sz) - 1px),  /* Transparent center */
  var(--circular-range-fill) calc(100% - var(--circular-range-track-sz))  /* Visible ring */
);

/* Track: full arc from start to end */
[part="track"] {
  background: conic-gradient(
    from calc(var(--_start) * 1deg),
    var(--circular-range-track) 0deg,
    var(--circular-range-track) calc((var(--_end) - var(--_start)) * 1deg),
    #0000 calc((var(--_end) - var(--_start)) * 1deg)
  );
}

/* Fill: partial arc from start to current value */
[part="fill"] {
  background: conic-gradient(
    from calc(var(--_fill-start) * 1deg),
    var(--circular-range-fill-start) 0deg,
    var(--circular-range-fill-middle) calc(var(--_fill-range) * 0.5deg),
    var(--circular-range-fill-end) calc(var(--_fill-range) * 1deg),
    #0000 calc(var(--_fill-range) * 1deg)
  );
}
```

### Arc End Caps (Pseudo-elements)

The track and fill have rounded end caps using `offset-path` positioning:

```css
[part="fill"]::before,
[part="track"]::before,
[part="track"]::after {
  border-radius: 50%;
  content: '';
  height: var(--circular-range-track-sz);
  width: var(--circular-range-track-sz);
  offset-anchor: top;
  offset-path: content-box;
  offset-distance: var(--_tb);  /* or --_ta for end */
}
```

### Thumb Rotation

The thumb is positioned via CSS `rotate` transform:

```css
[part="thumb"] {
  rotate: calc(1deg * var(--_fill, 0));  /* Rotates to fill angle */
  height: 100%;
  width: var(--circular-range-track-sz);
}
```

### Indices & Labels (offset-path)

Both indices and labels use CSS `offset-path` for circular positioning:

```javascript
// Index generation (index.js:454-462)
const startPercent = startAngle / 360 * 100;
const rangePercent = angleRange / 360 * 100;
const step = rangePercent / (count - 1);
return Array.from({ length: count }, (_, i) =>
  `<li style="--_p:${startPercent + (i * step)}%"></li>`
).join('');
```

```css
[part="indices"] li,
[part="labels"] li {
  offset-anchor: top;
  offset-distance: var(--_p, 0%);
  offset-path: content-box;
}
```

## Reverse Mode

When `reverse` attribute is present, values are inverted:

**Visual Behavior:**
- Fill grows from end angle toward start angle (counter-clockwise)
- User sees max→min as they drag clockwise

**Implementation:**

```javascript
// Value getter (index.js:315-318)
get value() {
  const value = Number(this.getAttribute('value')) || 0;
  return this.#reverse ? this.#min + this.#max - value : value;
}

// Value setter (index.js:320-323)
set value(newValue) {
  const normalizedValue = this.#reverse ? this.#min + this.#max - newValue : newValue;
  this.#setValue(normalizedValue);
}

// Fill direction (index.js:381-387)
if (this.#reverse) {
  this.style.setProperty('--_fill-start', fillAngle);
  this.style.setProperty('--_fill-range', this.#endAngle - fillAngle);
} else {
  this.style.setProperty('--_fill-start', this.#startAngle);
  this.style.setProperty('--_fill-range', fillAngle - this.#startAngle);
}
```

## Interaction Handling

### Pointer Interaction

```javascript
// Pointer down (index.js:418-426)
#pointerdown(event) {
  this.setPointerCapture(event.pointerId);  // Capture for drag
  this.#lastValue = Number(this.getAttribute('value')) || 0;
  this.#CX = this.offsetWidth / 2;   // Calculate center
  this.#CY = this.offsetHeight / 2;
  this.#pointerMove(event);          // Initial position update
  this.addEventListener('pointermove', this.#pointerMove);
  this.addEventListener('pointerup', () => /* cleanup */, { once: true });
}

// Pointer move (index.js:428-444)
#pointerMove(event) {
  // Convert pointer coordinates to angle
  const degree = ((Math.atan2(event.offsetY - CY, event.offsetX - CX) * 180 / Math.PI) + 90 + 360) % 360;
  const relativeDegree = (degree - startAngle + 360) % 360;
  let value = (relativeDegree / radian) + min;

  // Handle partial arcs (snap to endpoints outside arc)
  if (angleRange < 360) {
    if (relativeDegree > angleRange) {
      this.#setValue(relativeDegree - angleRange < (360 - angleRange) / 2 ? max : min);
      return;
    }
  }
  // Handle full circle wrap-around
  else if (Math.abs(value - lastValue) > range / 2) {
    value = value > lastValue ? min : max;
  }

  this.#setValue(value);
}
```

### Keyboard Navigation

```javascript
// Keyboard handler (index.js:446-452)
#keydown(event) {
  if (!event.key.startsWith('Arrow')) return;
  event.preventDefault();
  const step = event.shiftKey ? this.#shiftStep : this.#step;
  const increment = (event.key === 'ArrowUp' || event.key === 'ArrowRight') ? step : -step;
  this.#setValue((Number(this.getAttribute('value')) || min) + increment);
}
```

**Keyboard mappings:**
- `ArrowUp` / `ArrowRight` → Increase value by step
- `ArrowDown` / `ArrowLeft` → Decrease value by step
- `Shift` + Arrow → Increase/decrease by shift-step

## Form Association

```javascript
// Form associated flag (index.js:9)
static formAssociated = true;

// Internals setup (index.js:255)
this.#internals = this.attachInternals();

// Value reporting (index.js:402)
this.#internals.setFormValue(clampedValue);
```

**Form Integration:**
```html
<form>
  <circular-range name="temperature" min="0" max="100" value="50"></circular-range>
</form>
```

```javascript
const form = document.querySelector('form');
const formData = new FormData(form);
console.log(formData.get('temperature')); // "50"
```

## Safari Compatibility

Safari has rendering issues with conic gradients and offset-path. The component includes specific workarounds:

```javascript
// Safari detection (index.js:253)
this.#isSafari = /Safari\//.test(navigator.userAgent) &&
  !/(Chrome|Chromium|Edg|OPR|CriOS|FxiOS)/.test(navigator.userAgent);

// Repaint trigger (index.js:390-395)
#safariRepaint() {
  const v = this.getAttribute('value') ?? '0';
  this.getBoundingClientRect();  // Force layout calculation
  this.style.setProperty('--_invalidate', performance.now().toString());
  this.setAttribute('value', v);  // Re-trigger render
}

// Visibility handlers (index.js:285-290)
// Handle tab switching and page show/hide
document.addEventListener('visibilitychange', this.#safariVisHandler);
window.addEventListener('pageshow', this.#safariPageShowHandler);
```

## Attributes Reference

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `value` | Number | `0` | Current value |
| `min` | Number | `0` | Minimum value |
| `max` | Number | `100` | Maximum value |
| `step` | Number | `1` | Value increment |
| `shift-step` | Number | `step` | Increment when Shift held |
| `start` | Number | `0` | Start angle in degrees |
| `end` | Number | `360` | End angle in degrees |
| `reverse` | Boolean | `false` | Reverse value direction |
| `indices` | Number | `0` | Number of tick marks |
| `labels` | String | `null` | Comma-separated "value:label" pairs |
| `active-label` | String | `null` | Value of label to highlight |
| `suffix` | String | `""` | Suffix for displayed value |
| `enable-min` | Boolean | `false` | Show different thumb style at min |
| `name` | String | `""` | Form field name |

## CSS Custom Properties Reference

### Dimensions & Layout
| Property | Default | Description |
|----------|---------|-------------|
| `--circular-range-w` | `100%` | Component width |
| `--circular-range-maw` | `320px` | Maximum width |
| `--circular-range-track-sz` | `1.5rem` | Track/thumb thickness |
| `--circular-range-rows` | `5` | Grid rows for layout |

### Colors
| Property | Default | Description |
|----------|---------|-------------|
| `--circular-range-fill` | `#0066cc` | Fill color |
| `--circular-range-fill-start` | `var(--circular-range-fill)` | Gradient start |
| `--circular-range-fill-middle` | `var(--circular-range-fill)` | Gradient middle |
| `--circular-range-fill-end` | `var(--circular-range-fill)` | Gradient end |
| `--circular-range-track` | `#f0f0f0` | Track color |
| `--circular-range-thumb` | `var(--circular-range-fill)` | Thumb color |
| `--circular-range-thumb-min` | `#e0e0e0` | Thumb color at minimum |

### Output Value Display
| Property | Default | Description |
|----------|---------|-------------|
| `--circular-range-output-fs` | `200%` | Font size |
| `--circular-range-output-fw` | `700` | Font weight |
| `--circular-range-output-c` | `inherit` | Color |
| `--circular-range-output-gr` | `2` | Grid row placement |
| `--circular-range-output-as` | `end` | Align-self |

### Indices & Labels
| Property | Default | Description |
|----------|---------|-------------|
| `--circular-range-indices-w` | `80%` | Indices container width |
| `--circular-range-indice-w` | `1px` | Individual index width |
| `--circular-range-indice-h` | `5px` | Individual index height |
| `--circular-range-indice-c` | `#999` | Index color |
| `--circular-range-labels-w` | `70%` | Labels container width |
| `--circular-range-labels-fs` | `x-small` | Labels font size |
| `--circular-range-labels-c` | `light-dark(#333, #CCC)` | Labels color |

## CSS Parts

| Part | Description |
|------|-------------|
| `track` | Background track arc |
| `fill` | Value fill arc |
| `thumb` | Draggable thumb element |
| `indices` | Tick marks container |
| `labels` | Labels container |
| `label-{value}` | Individual label by value |
| `active-label` | Currently active label |

## Events

| Event | Bubbles | Detail | Description |
|-------|---------|--------|-------------|
| `input` | Yes | None | Fired on every value change |

## Common Configurations

### Full Circle (Knob)
```html
<circular-range min="0" max="100" value="50" step="1"></circular-range>
```

### Speedometer (Partial Arc)
```html
<circular-range
  start="220" end="500"
  min="0" max="200"
  suffix=" km/h"
  indices="50"
  labels="0:0,50:50,100:100,150:150,200:200">
</circular-range>
```

### Temperature Gauge
```html
<circular-range
  start="20" end="340"
  min="0" max="330"
  suffix="°C"
  step="5"
  indices="67">
</circular-range>
```

### Top Arc (Half Circle)
```html
<circular-range
  class="top-arc"
  start="270" end="450"
  min="0" max="100">
</circular-range>
```
```css
.top-arc {
  clip-path: inset(0 0 40% 0);
  margin-bottom: -120px;
}
```

### Reversed Arc
```html
<circular-range
  reverse
  start="180" end="360"
  min="0" max="100">
</circular-range>
```

## Gotchas & Edge Cases

1. **Arc angles > 360°**: Supported (e.g., `start="270" end="450"` creates a top arc spanning 180°)

2. **Reverse mode timing**: Initial value conversion happens in `#convertInitialValue()` before first render

3. **Safari repaint**: If gradients don't render on tab switch, the component auto-triggers repaint

4. **Shift-step default**: If not specified, defaults to same as `step`, not `step * 10`

5. **Labels positioning in reverse mode**: Labels are positioned based on their numeric values, which are spatially inverted

6. **Touch interaction**: `touch-action: none` prevents scroll interference during drag

7. **User selection**: All parts have `user-select: none` to prevent text selection during interaction
