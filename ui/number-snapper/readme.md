# Number Snapper

A customizable, accessible web component that transforms the standard range input into an interactive scrolling interface. It supports advanced number formatting (currency, units, percentages), configurable snap points for precise value selection, and smooth scroll interaction.

## Installation

### Load the Component

```html
<script type="module" src="./index.js"></script>
```

## Usage

### Basic Example

```html
<number-snapper
  label="Select a value"
  min="0"
  max="100"
  step="1"
  value="50">
</number-snapper>
```

### Currency Example

```html
<number-snapper
  currency="USD"
  format="currency"
  label="Monthly Salary"
  lang="en-US"
  max="25000"
  min="0"
  step="500"
  value="5000"
  ticks="100"
  interval="5"
  snap="all">
</number-snapper>
```

### Unit Example

```html
<number-snapper
  format="unit"
  unit="celsius"
  label="Temperature"
  lang="en-GB"
  min="0"
  max="100"
  step="10"
  value="10"
  ticks="100"
  interval="10"
  snap="major">
</number-snapper>
```

## Attributes

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `currency` | String | `"USD"` | Currency code for formatting (e.g., "USD", "EUR", "GBP"). Used when `format="currency"`. |
| `decimals` | Number | `0` | Number of decimal places to display in the formatted output. |
| `format` | String | `"integer"` | Number format type: `"integer"`, `"currency"`, `"unit"`, or `"percent"`. |
| `interval` | Number | - | Controls which ticks are styled as major ticks. Valid values: `2`, `3`, `4`, `5`, `10`. For example, `interval="5"` makes every 5th tick a major tick. |
| `label` | String | `""` | Label text displayed above the component. |
| `lang` | String | `"en-US"` | Language/locale for number formatting (e.g., "en-US", "de-DE", "fr-FR"). |
| `max` | Number | `100` | Maximum value of the range. |
| `min` | Number | `0` | Minimum value of the range. |
| `snap` | String | `"none"` | Snap behavior: `"none"` (no snapping), `"all"` (snap to all ticks), `"major"` (snap to major ticks only), `"value"` (snap to ticks with titles). |
| `step` | Number | `1` | Step increment for values. |
| `ticks` | Number | `10` | Total number of tick marks to display. |
| `unit` | String | `null` | Unit for formatting (e.g., "celsius", "meter", "gigabyte"). Used when `format="unit"`. |
| `value` | Number | `0` | Initial/current value. |

## Events

### `change`

Dispatched when the value changes. The event detail contains:

```javascript
{
  value: Number,        // Raw numeric value
  formattedValue: String // Formatted display value
}
```

**Example:**

```javascript
const snapper = document.querySelector('number-snapper');

snapper.addEventListener('change', (e) => {
  console.log('Value:', e.detail.value);
  console.log('Formatted:', e.detail.formattedValue);
});
```

## Slots

### `info`

Optional slot for displaying additional information below the component.

```html
<number-snapper label="Select value">
  <small slot="info">Additional information here</small>
</number-snapper>
```

## CSS Custom Properties

### Layout & Spacing

| Property | Default | Description |
|----------|---------|-------------|
| `--number-snapper-rg` | `0.875rem` | Row gap within the fieldset. |
| `--number-snapper-label-rg` | `0.25rem` | Row gap within the label. |
| `--number-snapper-w` | `200cqi` | Width of the tick track (in container query units). |
| `--number-snapper-w-xs` | `600cqi` | Width at small sizes (< 400px). |
| `--number-snapper-w-md` | `400cqi` | Width at medium sizes (401px - 768px). |
| `--number-snapper-w-lg` | `100cqi` | Width at large sizes (> 1400px). |

### Typography

| Property | Default | Description |
|----------|---------|-------------|
| `--number-snapper-ff` | `ui-sans-serif, system-ui` | Font family for the component. |
| `--number-snapper-output-c` | `light-dark(#222, #EEE)` | Color of the output value. |
| `--number-snapper-output-fs` | `2rem` | Font size of the output value. |
| `--number-snapper-output-fw` | `600` | Font weight of the output value. |
| `--number-snapper-legend-c` | `light-dark(#222, #EEE)` | Color of the legend/label text. |
| `--number-snapper-legend-fs` | `0.875rem` | Font size of the legend/label. |
| `--number-snapper-legend-fw` | `400` | Font weight of the legend/label. |

### Indicator (Center Line)

| Property | Default | Description |
|----------|---------|-------------|
| `--number-snapper-indicator-bg` | `light-dark(#555, #EEE)` | Background color of the center indicator line. |
| `--number-snapper-indicator-w` | `5px` | Width of the center indicator line. |
| `--number-snapper-indicator-h` | `32px` | Height of the center indicator line. |
| `--number-snapper-indicator-bdrs` | `3px` | Border radius of the center indicator line. |

### Triangle (Below Indicator)

| Property | Default | Description |
|----------|---------|-------------|
| `--number-snapper-triangle-bg` | `light-dark(#555, #EEE)` | Background color of the triangle pointer. |
| `--number-snapper-triangle-w` | `10px` | Width of the triangle pointer. |
| `--number-snapper-triangle-h` | `5px` | Height of the triangle pointer. |

### Major Ticks

| Property | Default | Description |
|----------|---------|-------------|
| `--number-snapper-major-tick-bg` | `#CCC` | Background color of major tick marks. |
| `--number-snapper-major-tick-w` | `2px` | Width of major tick marks. |
| `--number-snapper-major-tick-h` | `100%` | Height of major tick marks. |
| `--number-snapper-major-tick-bdrs` | `2px` | Border radius of major tick marks. |

### Minor Ticks

| Property | Default | Description |
|----------|---------|-------------|
| `--number-snapper-minor-tick-bg` | `#CCC` | Background color of minor tick marks. |
| `--number-snapper-minor-tick-w` | `1px` | Width of minor tick marks. |
| `--number-snapper-minor-tick-h` | `70%` | Height of minor tick marks. |
| `--number-snapper-minor-tick-bdrs` | `1px` | Border radius of minor tick marks. |

### Focus & Outline

| Property | Default | Description |
|----------|---------|-------------|
| `--number-snapper-outline-style` | `solid` | Outline style when focused. |
| `--number-snapper-outline-c` | `#CCC` | Outline color when focused. |
| `--number-snapper-outline-off` | `4px` | Outline offset when focused. |

### Mask

| Property | Default | Description |
|----------|---------|-------------|
| `--number-snapper-mask` | `linear-gradient(to right, #0000, #000 15%, #000 85%, #0000)` | Mask gradient for fading edges of the scroll area. |

## Shadow Parts

### `scroll-snap`

The scrollable tick container. Use this part to add custom styling or pseudo-elements.

**Example:**

```css
number-snapper::part(scroll-snap) {
  position: relative;
  padding-block-end: 1rem;
}

number-snapper::part(scroll-snap)::after {
  content: '';
  position: absolute;
  inset: auto 0 0.33rem 0;
  height: 4px;
  background: linear-gradient(to right, blue, red);
  border-radius: 0.33rem;
}
```

## Advanced Features

### Data Property

You can assign a data object to the component to mark specific ticks with titles. Ticks with titles are styled as major ticks and can be snapped to with `snap="value"`.

```javascript
const timeline = document.querySelector('#timeline');

customElements.whenDefined('number-snapper').then(() => {
  timeline.data = {
    1900: 'Turn of the century',
    1945: 'End of World War II',
    1969: 'Moon Landing',
    2000: 'New millennium'
  };

  // Optionally add title attributes to the tick elements
  const ticks = timeline.shadowRoot.querySelectorAll('li[value]');
  ticks.forEach(li => {
    const value = li.getAttribute('value');
    if (timeline.data[value]) {
      li.setAttribute('title', timeline.data[value]);
    }
  });
});
```

### Formatting Options

The component uses `Intl.NumberFormat` for number formatting. The `format` attribute determines the style:

- **`integer`**: Plain number (default)
- **`currency`**: Formatted as currency (requires `currency` attribute)
- **`unit`**: Formatted with a unit (requires `unit` attribute)
- **`percent`**: Formatted as percentage

**Supported Units** (examples):
- Temperature: `celsius`, `fahrenheit`
- Length: `meter`, `kilometer`, `foot`, `mile`
- Data: `byte`, `kilobyte`, `megabyte`, `gigabyte`, `terabyte`
- Many more via Intl.NumberFormat

### Responsive Behavior

The component uses container queries to adjust the tick track width based on the component's size:

- **< 400px**: Uses `--number-snapper-w-xs` (default: `600cqi`)
- **401px - 768px**: Uses `--number-snapper-w-md` (default: `400cqi`)
- **769px - 1399px**: Uses `--number-snapper-w` (default: `200cqi`)
- **≥ 1400px**: Uses `--number-snapper-w-lg` (default: `100cqi`)

## Accessibility

- Built on native `<input type="range">` for keyboard support
- Proper ARIA labels
- Focus indicators
- Screen reader friendly with formatted value announcements via `aria-valuetext`

## Browser Support

- Modern browsers supporting:
  - Web Components (Custom Elements v1)
  - Shadow DOM
  - CSS Container Queries
  - `light-dark()` CSS function
  - Constructable Stylesheets
