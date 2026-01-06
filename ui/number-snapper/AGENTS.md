# Number Snapper Component - Internal Architecture

## Overview

`<number-snapper>` is a custom element that transforms a standard range input into an interactive horizontal scrolling interface with tick marks, snap points, and advanced number formatting. The user scrolls horizontally through values while a center indicator shows the current selection.

**Component Type:** Autonomous custom element extending HTMLElement

**Key Characteristics:**
- Pure vanilla JavaScript, no dependencies
- Uses Shadow DOM with Constructable Stylesheets
- Built on native `<input type="range">` for accessibility
- Bidirectional sync between scroll position and input value
- Supports Intl.NumberFormat for currency, units, percentages
- CSS Container Queries for responsive tick track width
- Configurable snap points (all ticks, major ticks, specific values, or none)

**Use Cases:**
- Salary/price selectors with currency formatting
- Timeline selectors (historical dates with events)
- Temperature controls with unit formatting
- Storage/memory size selectors
- Any numeric input benefiting from visual context

## Architecture Overview

### Component Structure

```
<number-snapper>                          ← Host element (container query context)
  #shadow-root
    └── <fieldset>
          ├── <legend>${label}</legend>   ← Label text
          ├── <output name="out">         ← Formatted display value
          ├── <label>
          │     ├── <input type="range">  ← Hidden native input (accessibility)
          │     ├── <span data-scroll>    ← Scrollable container (pointer events)
          │     │     └── <span data-scroll-bg>
          │     │           ├── <i>       ← Left spacer (50cqi)
          │     │           ├── <ol data-scroll-snap part="scroll-snap">
          │     │           │     └── <li value="N">*  ← Individual ticks
          │     │           └── <i>       ← Right spacer (50cqi)
          │     └── ::before              ← Triangle indicator
          │     └── ::after               ← Center line indicator
          └── <slot name="info">          ← Info slot for additional content
```

### Lifecycle Flow

```
constructor()
  ↓
  attachShadow({ mode: 'open' })
  adoptedStyleSheets = [styles]
  Bind event handlers (#boundOnMove, #boundOnEnd)
  ↓
connectedCallback()
  ↓
  Parse attributes into #A object:
    currency, decimals, format, label, lang,
    max, min, snap, step, ticks, unit, value
  Calculate range = max - min
  ↓
  Inject HTML template:
    fieldset > legend + output + label + slot
  ↓
  Cache DOM references into #E object:
    in (input), out (output), scroll, snap
  ↓
  Calculate initial #scrollRange
  Setup ResizeObserver on scroll element
  ↓
  Attach event listeners:
    - pointerdown on scroll → drag interaction
    - input on root → slider change
    - scroll on scroll element → scroll sync
  ↓
  #update() → Initial value/scroll sync
```

## Data Flow & Synchronization

### Bidirectional Sync Model

The component maintains sync between three states:
1. **Input value** (`<input type="range">`)
2. **Scroll position** (`data-scroll` element scrollLeft)
3. **Display value** (`<output>` element)

```
User scrolls horizontally
       ↓
scroll event fires
       ↓
#update(fromScroll: true)
       ↓
Calculate value from scroll position:
  value = min + (scrollLeft / scrollRange) * range
       ↓
Round to step: Math.round(value / step) * step
       ↓
Update input.value (silent, no event)
Update output with formatted value
       ↓
Dispatch 'change' CustomEvent

─────────────────────────────────────

User drags input slider (keyboard/AT)
       ↓
input event fires on root
       ↓
#update(fromScroll: false)
       ↓
Read value from input.value
       ↓
Round to step: Math.round(value / step) * step
       ↓
Calculate scroll position:
  scrollLeft = ((value - min) / range) * scrollRange
       ↓
Update scroll.scrollLeft (silent)
Update output with formatted value
       ↓
Dispatch 'change' CustomEvent
```

### Critical Formula

```javascript
// Scroll position to value (index.js:217-218)
const val = min + ((scrollLeft / scrollRange) * range);

// Value to scroll position (index.js:229)
scrollLeft = ((value - min) / range) * scrollRange;

// Scroll range calculation (index.js:190)
scrollRange = scroll.scrollWidth - scroll.clientWidth;
```

## Scroll-Based Interaction

### Scroll Container Structure

The scroll system uses a clever 3-column grid to create centered snapping:

```css
[data-scroll-bg] {
  display: grid;
  grid-template-columns: 50cqi var(--number-snapper-w, 200cqi) 50cqi;
  /*                     ↑ left spacer   ↑ tick area   ↑ right spacer */
}
```

**Why 50cqi spacers?** They allow the first and last ticks to be scrollable to the center indicator. Without spacers, min/max values couldn't reach the center.

### Scroll Snap Configuration

```css
[data-scroll-snap] {
  scroll-snap-type: x mandatory;  /* Snap is required */
}

li {
  scroll-snap-align: center;      /* Snap to center of element */
}
```

**Snap mode overrides:**

```css
/* No snapping */
:host([snap=none]) li {
  scroll-snap-align: none;
}

/* Only ticks with title attribute snap */
:host([snap=value]) li:not([title]) {
  scroll-snap-align: none;
}

/* Only major ticks snap (interval-based) */
:host([interval="5"][snap=major]) li:not(:nth-of-type(5n+1)) {
  scroll-snap-align: none;
}
```

### Pointer Drag Handling

```javascript
// Start drag (index.js:248-257)
#onStart(e) {
  e.stopPropagation();
  this.#E.scroll.dataset.pointer = e.clientX;      // Store start position
  this.#E.scroll.dataset.scroll = scrollLeft;      // Store start scroll
  this.#E.scroll.classList.add('grabbing');        // Change cursor
  this.#E.scroll.setPointerCapture(e.pointerId);   // Capture pointer
  // Add move/up listeners to document
}

// During drag (index.js:237-239)
#onMove(e) {
  // Calculate new scroll position based on pointer delta
  scrollLeft = startScroll - (e.clientX - startPointer);
}

// End drag (index.js:241-246)
#onEnd() {
  this.#E.scroll.classList.remove('grabbing');
  // Remove document listeners
}
```

## Number Formatting

### Intl.NumberFormat Integration

```javascript
// Format method (index.js:203-212)
#format(num) {
  if (this.#A.format === 'integer') return num;

  const options = {
    style: this.#A.format,  // 'currency', 'unit', 'percent'
    minimumFractionDigits: this.#A.decimals,
    maximumFractionDigits: this.#A.decimals,
    ...(format === 'currency' && { currency: this.#A.currency }),
    ...(format === 'unit' && unit && { unit: this.#A.unit }),
  };

  return new Intl.NumberFormat(this.#A.lang, options)
    .format(num)
    .replace(/\u00A0/g, ' ');  // Replace non-breaking spaces
}
```

### Format Types

| Format | Required Attribute | Example Output |
|--------|-------------------|----------------|
| `integer` | (none) | `5000` |
| `currency` | `currency="USD"` | `$5,000.00` |
| `unit` | `unit="celsius"` | `25 °C` |
| `percent` | (none) | `50%` |

### Supported Units (via Intl)

- **Temperature:** `celsius`, `fahrenheit`
- **Length:** `meter`, `kilometer`, `foot`, `mile`, `inch`
- **Data:** `byte`, `kilobyte`, `megabyte`, `gigabyte`, `terabyte`
- **Speed:** `meter-per-second`, `kilometer-per-hour`, `mile-per-hour`
- **Volume:** `liter`, `gallon`
- **Duration:** `second`, `minute`, `hour`, `day`
- Many more via [Intl.NumberFormat](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/NumberFormat)

## Tick Generation

### Tick Rendering

```javascript
// From connectedCallback (index.js:172-175)
Array.from({ length: ticks + 1 }).map((_, i) => {
  const tickValue = Math.round(min + (i * range / ticks));
  return `<li value="${tickValue}"></li>`;
}).join('')
```

**Note:** `ticks + 1` creates fence-post ticks (e.g., `ticks="10"` creates 11 tick marks for values 0-100 at 10-unit intervals).

### Major vs Minor Ticks (CSS-based)

Major ticks are styled via CSS, not generated differently:

```css
/* Default minor tick styling */
li {
  background: var(--number-snapper-minor-tick-bg, #CCC);
  height: var(--number-snapper-minor-tick-h, 70%);
  width: var(--number-snapper-minor-tick-w, 1px);
}

/* Major tick styling (interval-based) */
li[title],
:host([interval="5"]) li:nth-of-type(5n+1),
:host([interval="10"]) li:nth-of-type(10n+1) {
  background: var(--number-snapper-major-tick-bg, #CCC);
  height: var(--number-snapper-major-tick-h, 100%);
  width: var(--number-snapper-major-tick-w, 2px);
}
```

**Interval options:** `2`, `3`, `4`, `5`, `10`

## Responsive Behavior

### Container Queries

The component uses CSS Container Queries to adjust tick track width:

```css
:host {
  container-type: inline-size;  /* Enable container queries */
}

/* Default */
fieldset { --number-snapper-w: var(--number-snapper-w, 200cqi); }

/* Small containers (< 400px) */
@container (max-width: 400px) {
  fieldset { --number-snapper-w: var(--number-snapper-w-xs, 600cqi); }
}

/* Medium containers (401px - 768px) */
@container (min-width: 401px) and (max-width: 768px) {
  fieldset { --number-snapper-w: var(--number-snapper-w-md, 400cqi); }
}

/* Large containers (> 1400px) */
@container (min-width: 1400px) {
  fieldset { --number-snapper-w: var(--number-snapper-w-lg, 100cqi); }
}
```

**Why cqi units?** Container query inline units allow the tick track to scale proportionally to the component width, maintaining visual density.

### ResizeObserver Integration

```javascript
// From connectedCallback (index.js:191-195)
new ResizeObserver(() => {
  this.#isResizing = true;
  this.#scrollRange = scroll.scrollWidth - scroll.clientWidth;
  setTimeout(() => { this.#isResizing = false }, 200);
}).observe(this.#E.scroll);
```

**Why the resizing flag?** During resize, scroll events fire rapidly. The `#isResizing` flag prevents value recalculation during resize, which would cause jittery behavior.

## Data Property (Advanced)

The `data` property allows assigning metadata to specific values:

```javascript
// Usage example
timeline.data = {
  1969: 'Moon Landing',
  1989: 'Fall of Berlin Wall',
  2000: 'New Millennium'
};

// Then add title attributes to ticks
const ticks = timeline.shadowRoot.querySelectorAll('li[value]');
ticks.forEach(li => {
  const value = li.getAttribute('value');
  if (timeline.data[value]) {
    li.setAttribute('title', timeline.data[value]);
  }
});
```

**Effect:** Ticks with `title` attributes:
1. Are styled as major ticks (via CSS `li[title]` selector)
2. Can be exclusively snapped to with `snap="value"`
3. Show tooltip on hover

## Attributes Reference

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `currency` | String | `"USD"` | Currency code (ISO 4217) |
| `decimals` | Number | `0` | Decimal places in output |
| `format` | String | `"integer"` | Format type: integer, currency, unit, percent |
| `interval` | Number | — | Major tick interval: 2, 3, 4, 5, or 10 |
| `label` | String | `""` | Legend/label text |
| `lang` | String | `"en-US"` | Locale for formatting |
| `max` | Number | `100` | Maximum value |
| `min` | Number | `0` | Minimum value |
| `snap` | String | `"none"` | Snap mode: none, all, major, value |
| `step` | Number | `1` | Value increment |
| `ticks` | Number | `10` | Number of tick intervals |
| `unit` | String | `null` | Unit for formatting (e.g., "celsius") |
| `value` | Number | `0` | Initial value |

## CSS Custom Properties Reference

### Layout & Spacing
| Property | Default | Description |
|----------|---------|-------------|
| `--number-snapper-rg` | `0.875rem` | Row gap in fieldset |
| `--number-snapper-label-rg` | `0.25rem` | Row gap in label |
| `--number-snapper-w` | `200cqi` | Tick track width |
| `--number-snapper-w-xs` | `600cqi` | Width at < 400px |
| `--number-snapper-w-md` | `400cqi` | Width at 401-768px |
| `--number-snapper-w-lg` | `100cqi` | Width at > 1400px |

### Typography
| Property | Default | Description |
|----------|---------|-------------|
| `--number-snapper-ff` | `ui-sans-serif, system-ui` | Font family |
| `--number-snapper-output-c` | `light-dark(#222, #EEE)` | Output value color |
| `--number-snapper-output-fs` | `2rem` | Output font size |
| `--number-snapper-output-fw` | `600` | Output font weight |
| `--number-snapper-legend-c` | `light-dark(#222, #EEE)` | Legend color |
| `--number-snapper-legend-fs` | `0.875rem` | Legend font size |
| `--number-snapper-legend-fw` | `400` | Legend font weight |

### Center Indicator
| Property | Default | Description |
|----------|---------|-------------|
| `--number-snapper-indicator-bg` | `light-dark(#555, #EEE)` | Indicator background |
| `--number-snapper-indicator-w` | `5px` | Indicator width |
| `--number-snapper-indicator-h` | `32px` | Indicator height |
| `--number-snapper-indicator-bdrs` | `3px` | Indicator border radius |

### Triangle Pointer
| Property | Default | Description |
|----------|---------|-------------|
| `--number-snapper-triangle-bg` | `light-dark(#555, #EEE)` | Triangle background |
| `--number-snapper-triangle-w` | `10px` | Triangle width |
| `--number-snapper-triangle-h` | `5px` | Triangle height |

### Major Ticks
| Property | Default | Description |
|----------|---------|-------------|
| `--number-snapper-major-tick-bg` | `#CCC` | Major tick background |
| `--number-snapper-major-tick-w` | `2px` | Major tick width |
| `--number-snapper-major-tick-h` | `100%` | Major tick height |
| `--number-snapper-major-tick-bdrs` | `2px` | Major tick border radius |

### Minor Ticks
| Property | Default | Description |
|----------|---------|-------------|
| `--number-snapper-minor-tick-bg` | `#CCC` | Minor tick background |
| `--number-snapper-minor-tick-w` | `1px` | Minor tick width |
| `--number-snapper-minor-tick-h` | `70%` | Minor tick height |
| `--number-snapper-minor-tick-bdrs` | `1px` | Minor tick border radius |

### Focus & Outline
| Property | Default | Description |
|----------|---------|-------------|
| `--number-snapper-outline-style` | `solid` | Focus outline style |
| `--number-snapper-outline-c` | `#CCC` | Focus outline color |
| `--number-snapper-outline-off` | `4px` | Focus outline offset |

### Edge Mask
| Property | Default | Description |
|----------|---------|-------------|
| `--number-snapper-mask` | `linear-gradient(to right, #0000, #000 15%, #000 85%, #0000)` | Edge fade mask |

## CSS Parts

| Part | Description |
|------|-------------|
| `scroll-snap` | The `<ol>` containing tick marks |

## Events

| Event | Bubbles | Composed | Detail |
|-------|---------|----------|--------|
| `change` | Yes | Yes | `{ value: Number, formattedValue: String }` |

## Slots

| Slot | Description |
|------|-------------|
| `info` | Additional content below the component |

## Accessibility

- Built on native `<input type="range">` for keyboard support
- Arrow keys navigate the hidden input
- `aria-valuetext` updated with formatted value for screen readers
- Focus indicator on label when input focused
- Proper `<legend>` for form field labeling

## Common Configurations

### Currency Selector
```html
<number-snapper
  format="currency"
  currency="USD"
  lang="en-US"
  label="Monthly Budget"
  min="0"
  max="10000"
  step="100"
  value="5000"
  ticks="100"
  interval="5"
  snap="all">
</number-snapper>
```

### Temperature Control
```html
<number-snapper
  format="unit"
  unit="celsius"
  label="Temperature"
  min="0"
  max="100"
  step="1"
  value="20"
  ticks="100"
  interval="10"
  snap="major">
</number-snapper>
```

### Timeline with Events
```html
<number-snapper
  id="timeline"
  label="Year"
  min="1900"
  max="2000"
  step="1"
  value="1950"
  ticks="100"
  snap="value">
</number-snapper>
```
```javascript
timeline.data = { 1945: 'WWII Ends', 1969: 'Moon Landing' };
// Add title attributes to ticks...
```

### Storage Size
```html
<number-snapper
  format="unit"
  unit="gigabyte"
  decimals="1"
  label="Storage"
  min="0"
  max="128"
  step="0.25"
  value="32"
  ticks="128"
  interval="4"
  snap="none">
</number-snapper>
```

## Gotchas & Edge Cases

1. **Tick count vs intervals**: `ticks="10"` creates 11 tick marks (fence-post pattern). For exact value intervals, use `ticks = (max - min) / step`.

2. **Resize scroll jitter**: The `#isResizing` flag prevents value recalculation during resize. If you programmatically resize the container rapidly, there's a 200ms debounce.

3. **Scroll event vs input event**: Scroll events fire continuously during drag. Input events only fire when the hidden range input changes (keyboard/AT use).

4. **Non-breaking spaces**: `Intl.NumberFormat` uses `\u00A0` (non-breaking space) as thousand separator in some locales. The component replaces these with regular spaces for display consistency.

5. **Container query units**: The `cqi` unit is relative to the container's inline size. If the component isn't properly sized, tick widths may be unexpected.

6. **Major tick CSS specificity**: The `interval` attribute must be on the host element for CSS selectors to work. Setting `interval` dynamically requires the attribute, not just a property.

7. **Data property timing**: Use `customElements.whenDefined()` before accessing the `data` property or shadow DOM elements.
