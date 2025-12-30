# Design Token Editors - Internal Architecture

## Overview

Design Token Editors provides **specialized web component editors** for working with W3C design tokens. Currently features an advanced color editor with full color space support for 14 color spaces.

**Component Type:** Web Components (Custom Elements)

**Package Version:** 1.0.0

**Total LOC:** 354 lines core JS (875 lines including docs/demos)

**Key architectural decisions:**
- **Color.js integration**: CDN-loaded color manipulation library
- **13 color space support**: RGB-like and perceptual spaces
- **Shared stylesheet caching**: Module-level singleton pattern
- **Real-time preview**: Live updates with gamut warnings
- **Bidirectional input sync**: Range + number inputs stay synchronized

## Architecture Overview

### Component Ecosystem

```
design-token (token display)
  └─ Dynamically imports design-token-editors
      └─ edit-color (color picker)
          ├─ Uses Color.js (CDN) for conversions
          └─ Uses design-token-styles (shared CSS)
```

### EditColor Data Flow

```
Value Input (string or object)
  ↓
Parse via Color.js
  ↓
Store in #color private field
  ↓
updateUI() - sync preview, input, selector
  ↓
renderSliders() - generate space-specific controls
  ↓
User adjusts sliders/inputs
  ↓
updateValue() - read sliders, update #color
  ↓
updateWarning() - check sRGB gamut
  ↓
Dispatch 'change' event with detail
```

## File Structure

```
design-token-editors/
├── index.js                    14 lines   Package exports
├── package.json                28 lines   NPM configuration
├── README.md                   80 lines   User documentation
├── claude.md                   ---        This file
└── color/
    ├── index.js               320 lines   EditColor component
    ├── index.html             251 lines   Demo/test page
    └── readme.md              105 lines   Component documentation
```

## EditColor Component API

### Class Definition

**File:** [color/index.js](color/index.js)
**Lines 64-321:** `EditColor` extends `HTMLElement`
**Tag Name:** `edit-color`
**Registration:** Line 321: `customElements.define('edit-color', EditColor);`

### Observed Attributes (Lines 71-73)

```javascript
static get observedAttributes() {
  return ['value'];
}
```

### Private Fields (Lines 68-69)

| Field | Type | Purpose |
|-------|------|---------|
| `#color` | Color | Color.js instance for current color |
| `#elements` | Object | Cached DOM element references |

### Public Properties

#### `value` Setter (Lines 102-118)

```javascript
// String format - parsed by Color.js
editor.value = '#FF5733';
editor.value = 'hsl(15 100% 60%)';
editor.value = 'oklch(0.5 0.2 15)';
editor.value = 'color(display-p3 0.1 0.46 0.82)';

// W3C token object format
editor.value = {
  colorSpace: 'display-p3',
  components: [0.1, 0.46, 0.82],
  alpha: 1
};
```

**Space Remapping (Lines 110-112):**
- `'rgb'` → `'srgb'` (Color.js internal name)
- `'display-p3'` → `'p3'` (Color.js internal name)

#### `value` Getter (Lines 120-127)

```javascript
// Returns object format
const color = editor.value;
// { colorSpace: 'rgb', components: [0.5, 0.2, 0.1], alpha: 1 }

// Maps 'srgb' back to 'rgb' for compatibility
```

### Lifecycle Methods

| Method | Lines | Purpose |
|--------|-------|---------|
| `constructor()` | 75-78 | Attaches shadow DOM (open mode) |
| `connectedCallback()` | 80-94 | Loads shared CSS, renders UI, sets up listeners |
| `attributeChangedCallback()` | 96-100 | Reacts to `value` attribute changes |

### Instance Methods

| Method | Lines | Purpose |
|--------|-------|---------|
| `render()` | 129-188 | Creates shadow DOM structure |
| `updateUI()` | 190-208 | Updates preview, input, selector, calls renderSliders |
| `renderSliders()` | 210-254 | Generates range + number input pairs |
| `updateValue()` | 256-306 | Reads sliders, updates color, dispatches event |
| `updateWarning()` | 308-318 | Checks gamut, shows fallback for out-of-gamut |

### Events

#### `change` Event (Lines 295-303)

```javascript
editor.addEventListener('change', (e) => {
  const { space, components, alpha, css } = e.detail;

  console.log(space);      // 'oklch'
  console.log(components); // [0.7, 0.27, 240]
  console.log(alpha);      // 1
  console.log(css);        // 'oklch(0.7 0.27 240)'
});
```

## Color Space Configuration (Lines 3-63)

### RGB-like Spaces

Used by: `rgb`, `display-p3`, `a98-rgb`, `prophoto-rgb`, `rec2020`, `srgb-linear`

```javascript
const rgbSliders = {
  r: { min: 0, max: 100, step: 0.1, value: 0, label: 'R', suffix: '%' },
  g: { min: 0, max: 100, step: 0.1, value: 0, label: 'G', suffix: '%' },
  b: { min: 0, max: 100, step: 0.1, value: 0, label: 'B', suffix: '%' },
  alpha: { min: 0, max: 1, step: 0.001, value: 1, label: 'A', prefix: '/ ' }
};
```

**Note:** Displayed as 0-100%, stored as 0-1 internally (Lines 238-239, 273).

### HSL (Lines 18-22)

```javascript
{
  h: { min: 0, max: 360, step: 0.1, value: 0, label: 'H' },
  s: { min: 0, max: 100, step: 0.1, value: 0, label: 'S', suffix: '%' },
  l: { min: 0, max: 100, step: 0.1, value: 0, label: 'L', suffix: '%' },
  alpha: { ... }
}
```

### HWB (Lines 24-28)

```javascript
{
  h: { min: 0, max: 360, step: 0.1, value: 0, label: 'H' },
  w: { min: 0, max: 100, step: 0.1, value: 0, label: 'W', suffix: '%' },
  b: { min: 0, max: 100, step: 0.1, value: 0, label: 'B', suffix: '%' },
  alpha: { ... }
}
```

### Lab (Lines 36-40)

```javascript
{
  l: { min: 0, max: 100, step: 0.1, value: 0, label: 'L' },
  a: { min: -125, max: 125, step: 0.1, value: 0, label: 'a' },
  b: { min: -125, max: 125, step: 0.1, value: 0, label: 'b' },
  alpha: { ... }
}
```

### Oklab (Lines 42-46)

```javascript
{
  l: { min: 0, max: 1, step: 0.001, value: 0, label: 'L' },
  a: { min: -0.4, max: 0.4, step: 0.001, value: 0, label: 'a' },
  b: { min: -0.4, max: 0.4, step: 0.001, value: 0, label: 'b' },
  alpha: { ... }
}
```

### LCH (Lines 48-52)

```javascript
{
  l: { min: 0, max: 100, step: 0.1, value: 0, label: 'L' },
  c: { min: 0, max: 150, step: 0.1, value: 0, label: 'C' },
  h: { min: 0, max: 360, step: 0.1, value: 0, label: 'H' },
  alpha: { ... }
}
```

### Oklch (Lines 54-58)

```javascript
{
  l: { min: 0, max: 1, step: 0.001, value: 0, label: 'L' },
  c: { min: 0, max: 0.4, step: 0.001, value: 0, label: 'C' },
  h: { min: 0, max: 360, step: 0.1, value: 0, label: 'H' },
  alpha: { ... }
}
```

### XYZ Variants (Lines 10-14, 60-62)

Used by: `xyz`, `xyz-d50`, `xyz-d65`

```javascript
{
  x: { min: 0, max: 1, step: 0.001, value: 0, label: 'X' },
  y: { min: 0, max: 1, step: 0.001, value: 0, label: 'Y' },
  z: { min: 0, max: 1, step: 0.001, value: 0, label: 'Z' },
  alpha: { ... }
}
```

## Shadow DOM Structure (Lines 133-148)

```html
<div part="edit-color-preview"></div>

<fieldset part="edit-color-row">
  <label><input type="text" name="value"></label>
  <label><select name="space">
    <option value="rgb">RGB</option>
    <option value="hsl">HSL</option>
    <!-- ... 11 more spaces ... -->
  </select></label>
</fieldset>

<div><!-- Sliders rendered here --></div>

<fieldset part="edit-color-row edit-color-warning" hidden>
  <small>Color is outside sRGB gamut. Fallback:</small>
  <span part="edit-color-warning-fallback"></span>
</fieldset>
```

### Element Cache (Lines 150-157)

```javascript
this.#elements = {
  preview: this.shadowRoot.querySelector('[part="edit-color-preview"]'),
  spaceSelect: this.shadowRoot.querySelector('select'),
  slidersContainer: this.shadowRoot.querySelector('div:not([part])'),
  valueInput: this.shadowRoot.querySelector('input[type="text"]'),
  warning: this.shadowRoot.querySelector('[part~="edit-color-warning"]'),
  fallback: this.shadowRoot.querySelector('[part="edit-color-warning-fallback"]')
};
```

## Color Space Conversion (Lines 220-224)

```javascript
const targetSpace = (effectiveSpaceName === 'rgb') ? 'srgb' : effectiveSpaceName;
if (this.#color.spaceId !== targetSpace) {
  this.#color = this.#color.to(targetSpace);
}
```

Uses Color.js `.to()` method for all conversions.

## Slider Rendering (Lines 226-252)

### Component Extraction

```javascript
const coords = this.#color.coords;  // [r, g, b] or [l, c, h] etc.
const alphaVal = this.#color.alpha;
```

### RGB Scaling (Line 238-239)

```javascript
// Display as 0-100%, stored as 0-1
if (effectiveSpaceName === 'rgb') val *= 100;
```

### NaN Handling (Line 241)

```javascript
if (isNaN(val)) val = def.value || 0;
```

### Decimal Precision (Lines 243-244)

```javascript
const decimals = (step.toString().split('.')[1] || '').length;
val = Number(val.toFixed(decimals));
```

## Event Handling (Lines 159-183)

### Space Selector Change (Lines 159-162)

```javascript
this.#elements.spaceSelect.addEventListener('change', () => {
  this.renderSliders();
  this.updateValue();
});
```

### Value Input Change (Lines 164-166)

```javascript
this.#elements.valueInput.addEventListener('change', () => {
  this.value = this.#elements.valueInput.value;
});
```

### Slider Synchronization (Lines 168-183)

```javascript
this.#elements.slidersContainer.addEventListener('input', (e) => {
  const target = e.target;
  const row = target.closest('[part~="edit-color-row"]');
  const range = row.querySelector('[type="range"]');
  const num = row.querySelector('[type="number"]');

  // Bidirectional sync
  if (target === range) {
    num.value = range.value;
  } else if (target === num) {
    range.value = num.value;
  }

  this.updateValue();
});
```

## Gamut Warning System (Lines 308-318)

```javascript
updateWarning() {
  if (!this.#color) return;

  const isInGamut = this.#color.inGamut('srgb');

  if (isInGamut) {
    this.#elements.warning.hidden = true;
  } else {
    // Clamp to sRGB and show fallback
    const clamped = this.#color.toGamut('srgb');
    this.#elements.fallback.style.setProperty(
      '--_bg',
      clamped.toString({ format: 'hex' })
    );
    this.#elements.warning.hidden = false;
  }
}
```

## Dependencies

### External CDN

```javascript
// Line 1
import Color from "https://colorjs.io/dist/color.js";
```

**Color.js methods used:**
- `new Color(value)` - parse string
- `new Color(space, components, alpha)` - construct from components
- `.to(space)` - convert to different color space
- `.toString({ format })` - output CSS string
- `.inGamut(space)` - check if color is in gamut
- `.toGamut(space)` - clamp to gamut
- `.coords` - get component array
- `.alpha` - get alpha value
- `.spaceId` - get current color space

### Internal Dependencies

```json
// package.json lines 11-13
"dependencies": {
  "@browser-style/design-token-styles": "^1.0.0"
}
```

### Module Exports

```javascript
// index.js line 9
export { default as EditColor } from './color/index.js';

// package.json exports
{
  ".": "./index.js",
  "./color": "./color/index.js"
}
```

## CSS Parts

| Part | Lines | Purpose |
|------|-------|---------|
| `edit-color-preview` | 133 | Large color preview swatch |
| `edit-color-row` | 135, 180-189 | Input row containers |
| `edit-color-warning` | 145, 171-173 | Out-of-gamut warning |
| `edit-color-warning-fallback` | 146, 174-177 | Clamped color preview |

## Gotchas & Edge Cases

### 1. Invalid Color Parsing (Lines 105-117)

```javascript
try {
  if (typeof val === 'string') {
    this.#color = new Color(val);
  } else if (typeof val === 'object') {
    // ... object processing
  }
  this.updateUI();
} catch (e) {
  console.warn('Invalid color value:', val, e);  // Silent failure
}
```

**Gotcha:** Invalid colors just warn to console; component renders with stale value.

### 2. Null/Undefined Handling (Line 103)

```javascript
if (!val) return;
```

Silently ignores falsy values - no error, no update.

### 3. Space Name Mapping (Lines 110-112)

```javascript
let spaceId = colorSpace === 'rgb' ? 'srgb' : colorSpace;
if (spaceId === 'display-p3') spaceId = 'p3';
```

**Critical:** Must normalize space names BEFORE passing to Color() constructor.

### 4. RGB Value Scaling

**Input:** Object with 0-1 components
**Display:** Sliders show 0-100%
**Storage:** Color.js stores 0-1

Scale on display (Line 238-239):
```javascript
if (effectiveSpaceName === 'rgb') val *= 100;
```

Scale on update (Line 273):
```javascript
newComponents.push(effectiveSpaceName === 'rgb' ? val / 100 : val);
```

### 5. Active Element Check (Lines 197, 291)

```javascript
if (this.#elements.valueInput &&
    this.#elements.valueInput !== this.shadowRoot.activeElement) {
  this.#elements.valueInput.value = cssString;
}
```

**Purpose:** Prevents overwriting user's active text input while typing.

### 6. NaN Component Fallback (Line 241)

```javascript
if (isNaN(val)) val = def.value || 0;
```

Handles undefined/NaN components gracefully.

### 7. Space Fallback (Lines 202-204)

```javascript
let initialSpace = this.#color.spaceId === 'srgb' ? 'rgb' : this.#color.spaceId;
if (!spaces[initialSpace]) initialSpace = 'rgb';
```

Falls back to 'rgb' if space not in slider definitions.

### 8. Shared Stylesheet Loading (Lines 65, 81-88)

```javascript
let sharedSheet;  // Module-level singleton

if (!sharedSheet) {
  const cssUrl = new URL('../../design-token-styles/index.css', import.meta.url).href;
  const response = await fetch(cssUrl);
  // ...
}
```

**Gotcha:** All instances share same stylesheet. CSS changes require page reload.

### 9. Render Called Twice on Init

- Line 90: `this.render()` (initial UI creation)
- Line 186: `this.updateUI()` (if color exists)
- Line 206: `renderSliders()` called again in updateUI

This is intentional for initialization.

### 10. Wide Gamut Visibility

Display-p3 and rec2020 colors may exceed sRGB monitor gamut. The warning system shows:
- Orange warning text
- Clamped fallback color swatch

But the preview shows the actual color (if monitor supports it).

## Supported Color Spaces

| Space | Type | CSS Output | Slider Step |
|-------|------|------------|-------------|
| RGB | RGB-like | `rgb(128 64 255)` | 0.1 |
| sRGB | RGB-like | `color(srgb 0.5 0.25 1)` | 0.1 |
| Display P3 | RGB-like | `color(display-p3 0.5 0.25 1)` | 0.1 |
| A98 RGB | RGB-like | `color(a98-rgb ...)` | 0.1 |
| ProPhoto RGB | RGB-like | `color(prophoto-rgb ...)` | 0.1 |
| Rec2020 | RGB-like | `color(rec2020 ...)` | 0.1 |
| sRGB Linear | RGB-like | `color(srgb-linear ...)` | 0.1 |
| HSL | Legacy | `hsl(240 50% 50%)` | 0.1 |
| HWB | Legacy | `hwb(240 0% 0%)` | 0.1 |
| Lab | Perceptual | `lab(50 25 -25)` | 0.1 |
| LCH | Perceptual | `lch(50 35 300)` | 0.1 |
| Oklab | Perceptual | `oklab(0.5 0.1 -0.1)` | 0.001 |
| Oklch | Perceptual | `oklch(0.5 0.2 300)` | 0.001 |
| XYZ/D50/D65 | Device | `color(xyz 0.5 0.5 0.5)` | 0.001 |

## Integration with design-token

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

## Debugging Tips

1. **Color not updating?** Check `change` event listener is attached
2. **Weird color values?** Verify color space conversion is correct
3. **Editor not loading?** Check import path and module resolution
4. **Alpha not working?** Ensure alpha channel is included in components
5. **Out-of-gamut warning not showing?** Check if color is actually outside sRGB gamut
6. **NaN in sliders?** Component value may be undefined - check value setter
7. **Slider sync broken?** Check event delegation on slidersContainer
