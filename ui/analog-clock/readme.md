# Analog Clock

A customizable analog clock web component that displays time with support for multiple time zones, number systems, indices and visual styles.

## Installation

```bash
npm install @browser.style/analog-clock
```

## Basic Usage

```javascript
import '@browser.style/analog-clock';
```

```html
<analog-clock></analog-clock>
```

## Attributes

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `date` | String | — | Date format tokens: "day", "month", "year" or any combination |
| `indices` | Boolean/String | — | Show tick marks; "hours" for 12 marks, empty for 60 |
| `label` | String | — | Text label displayed below clock |
| `marker` | String | `"\|"` | Character used for minute tick marks |
| `marker-hour` | String | (marker) | Character used for hour tick marks |
| `numerals` | Number | `12` | Number of numerals to display (1-12) |
| `steps` | Boolean | `false` | Use stepping animation for seconds hand |
| `system` | String | `"latn"` | Number system: "roman", "romanlow", or any valid [Intl numberingSystem](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/NumberFormat/NumberFormat#numberingsystem) |
| `timezone` | Number | `0` | UTC offset in hours (e.g., -4, +5.5, +9) |

## CSS Parts

Style internal elements using the `::part()` pseudo-element.

| Part | Description |
|------|-------------|
| `indices` | Tick marks container |
| `index` | Individual tick mark |
| `hour` | Hour tick mark (combined with `index`) |
| `numerals` | Numerals container |
| `hands` | Hands container |
| `seconds` | Second hand |
| `minutes` | Minute hand |
| `hours` | Hour hand |
| `date` | Date display |
| `label` | Label text |

Example:
```css
analog-clock::part(seconds) {
  background-color: red;
}

analog-clock::part(hour) {
  color: gold;
  font-weight: 900;
}
```

## CSS Custom Properties

### Layout & Typography

| Property | Default | Description |
|----------|---------|-------------|
| `--analog-clock-ff` | `ui-sans-serif, system-ui, sans-serif` | Font family |
| `--analog-clock-fs` | `6cqi` | Font size for numerals |
| `--analog-clock-fw` | `700` | Font weight for numerals |

### Colors & Theme

| Property | Default | Description |
|----------|---------|-------------|
| `--analog-clock-bg` | `light-dark(hsl(0, 0%, 95%), hsl(0, 0%, 15%))` | Background color/gradient |
| `--analog-clock-c` | `light-dark(hsl(0, 0%, 15%), hsl(0, 0%, 85%))` | Main text color |
| `--analog-clock-cap` | `currentColor` | Center cap color |
| `--analog-clock-cap-sz` | `8cqi` | Center cap size |
| `--analog-clock-hour` | `currentColor` | Hour hand color |
| `--analog-clock-minute` | `currentColor` | Minute hand color |
| `--analog-clock-second` | `#ff8c05` | Second hand color |

### Indices

| Property | Default | Description |
|----------|---------|-------------|
| `--analog-clock-indices-c` | `light-dark(hsl(0, 0%, 85%), hsl(0, 0%, 35%))` | Indices color |
| `--analog-clock-indices-fs` | `6cqi` | Indices font size |
| `--analog-clock-indices-p` | `0` | Indices container padding |
| `--analog-clock-indices-hour-c` | `light-dark(hsl(0, 0%, 15%), hsl(0, 0%, 85%))` | Hour mark color |
| `--analog-clock-indices-hour-fw` | `800` | Hour mark font weight |

### Numerals

| Property | Default | Description |
|----------|---------|-------------|
| `--analog-clock-numerals-m` | `0` | Numerals container margin |

### Date & Label

| Property | Default | Description |
|----------|---------|-------------|
| `--analog-clock-date-c` | `#888` | Date text color |
| `--analog-clock-date-ff` | `ui-monospace, monospace` | Date font family |
| `--analog-clock-date-fs` | `5cqi` | Date font size |
| `--analog-clock-label-c` | `currentColor` | Label text color |
| `--analog-clock-label-fs` | `5cqi` | Label font size |
| `--analog-clock-label-fw` | `600` | Label font weight |

## Examples

```html
<!-- Basic clock with New York time -->
<analog-clock label="New York" timezone="-4"></analog-clock>

<!-- Gold-themed clock with Roman numerals and hour marks -->
<analog-clock
  class="gold"
  system="roman"
  numerals="4"
  indices="hours"
  marker="●"
></analog-clock>

<!-- Clock with minute indices and date display -->
<analog-clock
  indices
  marker="|"
  date="day month"
></analog-clock>

<!-- Clock with different markers for hours and minutes -->
<analog-clock
  indices
  marker="·"
  marker-hour="●"
  date="day month"
></analog-clock>
```

```css
/* Gold theme example */
.gold {
  --_gold: #E2CA7D;
  --_dark: color-mix(in oklab, var(--_gold) 60%, black);
  --_accent: color-mix(in oklab, var(--_gold) 80%, maroon);

  --analog-clock-bg: radial-gradient(
    circle at 50% 50%,
    color-mix(in oklab, var(--_gold) 20%, white) 50%,
    var(--_gold) 51%,
    color-mix(in oklab, var(--_gold) 85%, black) 95%
  );
  --analog-clock-c: color-mix(in oklab, var(--_gold) 50%, black);
  --analog-clock-ff: "Didot", serif;
  --analog-clock-hour: var(--_dark);
  --analog-clock-minute: var(--_dark);
  --analog-clock-second: var(--_accent);
  --analog-clock-cap: color-mix(in oklab, var(--_dark), white 20%);
}
```
