# Data Chart Component - Internal Architecture

## Overview

`<data-chart>` is a custom element that renders various chart types (column, bar, area, line, pie, donut, candlestick, poll) using semantic HTML tables styled with CSS. It's a CSS-first charting solution where chart visualization is achieved through CSS properties, grid layouts, and clip-paths rather than SVG or Canvas.

**Version:** 1.0.0 (package.json), 1.0.1 (index.js)

**Component Type:** Autonomous custom element extending HTMLElement

**Key Characteristics:**
- Pure CSS visualization using HTML tables
- Uses modern CSS features: container queries, `attr()` with type coercion, `conic-gradient`, `clip-path`
- Data loaded from JSON (inline or external URL)
- Safari polyfill for advanced `attr()` syntax
- 10 built-in color palette with automatic cycling
- Responsive item limiting via `items-*` attributes

**Supported Chart Types:**
- `column` (default): Vertical bar chart
- `bar`: Horizontal bar chart
- `area`: Filled area chart
- `line`: Line chart using clip-path
- `pie`: Pie chart using conic-gradient
- `donut`: Pie chart with center cutout
- `candlestick`: Financial OHLC chart
- `poll`: Horizontal poll/survey results

## Architecture Overview

### Component Structure

```
<data-chart>                                 ← Host element (block, container-type: inline-size)
  #shadow-root
    ├── <table aria-disabled="true">         ← Chart container (CSS grid)
    │     ├── <caption>                      ← Chart title (optional)
    │     ├── <thead aria-hidden="true">     ← Y-axis labels container
    │     │     └── <tr><th colspan="N">     ← Y-axis label rows
    │     └── <tbody data-t="totalSum">      ← Data container (CSS grid)
    │           └── <tr>                     ← Data point row
    │                 ├── <th scope="row">   ← X-axis label
    │                 └── <td data-v="...">  ← Data value cell(s)
    └── <ul>                                 ← Legend (optional)
          └── <li>                           ← Legend items
```

### Rendering Approach

The chart uses a semantic `<table>` structure where:

1. **`<tbody>`** is a CSS grid container with `container-type: size`
2. **`<tr>`** elements are grid items, each containing a label and value cell(s)
3. **`<td>`** elements use CSS custom properties from `data-*` attributes to calculate height/width
4. **Chart type styles** transform the table layout via CSS (clip-path, conic-gradient, etc.)

### Data Flow

```
data attribute set/changed
  ↓
attributeChangedCallback('data', ...)
  ↓
load(source)
  ↓
  Is JSON string? → JSON.parse()
  Is URL? → fetch() then .json()
  ↓
#dataset = parsed data
  ↓
render()
  ↓
  Validate data structure
  Calculate sums for pie/donut
  Calculate accumulated values for area/line
  ↓
  Generate HTML:
    - <table> with <caption>, <thead>, <tbody>
    - <ul> for legend
  ↓
  #isAdvancedAttrSupported()?
    No → #applyAdvancedAttrPolyfill()
```

## CSS Value Calculation

### Bar Height Formula

The core formula for vertical bars:

```css
tbody td {
  --_v: attr(data-v type(<number>), 0);
  --_y: calc(1 - ((var(--_v) - var(--_min)) / (var(--_max) - var(--_min))));
  height: calc(((var(--_v) - var(--_min)) / (var(--_max) - var(--_min))) * 100cqb);
}
```

- `--_v`: Value from `data-v` attribute
- `--_min`, `--_max`: Scale bounds from host attributes
- Height is percentage of container block size (`cqb`)

### Area/Line Chart Clip-Path

Area and line charts use `clip-path: polygon()` to create shapes:

```css
/* Area chart */
:host([type=area]) tbody td {
  clip-path: polygon(
    -1% 100%,                           /* Bottom-left */
    -1% calc(var(--_py) * 100%),        /* Previous value Y */
    101% calc(var(--_y) * 100%),        /* Current value Y */
    101% 100%                           /* Bottom-right */
  );
  grid-area: 1 / 1 / 2 / 2;             /* Stack all cells */
  height: calc(100cqb - var(--data-chart-label-h));
}

/* Line chart - same but thinner */
:host([type=line]) tbody td {
  clip-path: polygon(
    -1% calc(var(--_py) * 100% + var(--line-chart-line-h) / 2),
    -1% calc(var(--_py) * 100% - var(--line-chart-line-h) / 2),
    101% calc(var(--_y) * 100% - var(--line-chart-line-h) / 2),
    101% calc(var(--_y) * 100% + var(--line-chart-line-h) / 2)
  );
}
```

**Key insight:** All `<td>` elements occupy the same grid cell (`grid-area: 1/1/2/2`), stacked on top of each other. The clip-path creates the illusion of connected segments.

### Pie/Donut Chart Conic-Gradient

```css
:host(:is([type=donut], [type=pie])) tbody td {
  --_av: attr(data-av type(<number>), 0);  /* Accumulated value */
  --_start: calc((var(--_av) / var(--_t)) * 360deg);
  --_end: calc((var(--_v) / var(--_t)) * 360deg);

  background: conic-gradient(
    from var(--_start),
    var(--_bg) 0 var(--_end),
    #0000 var(--_end) calc(var(--_start) + 360deg)
  );
  grid-area: 1 / 1 / 2 / 2;  /* Stack all slices */
}

/* Donut adds center cutout */
:host([type=donut]) tbody {
  mask: radial-gradient(circle, #0000 40%, #000 40%);
}
```

### Candlestick Chart

Candlestick uses pseudo-elements for wick and body:

```css
:host([type=candlestick]) tbody td {
  --_open: attr(data-open type(<number>), 0);
  --_high: attr(data-high type(<number>), 0);
  --_low: attr(data-low type(<number>), 0);
  --_close: attr(data-close type(<number>), 0);
  height: calc(((var(--_high) - var(--_min)) / (var(--_max) - var(--_min))) * 100cqb);
}

/* Wick (::before) */
:host([type=candlestick]) tbody td::before {
  bottom: calc(((var(--_low) - var(--_min)) / (var(--_max) - var(--_min))) * 100%);
  height: calc(((var(--_high) - var(--_low)) / (var(--_max) - var(--_min))) * 100%);
}

/* Body (::after) - Bullish (up) */
:host([type=candlestick]) tbody td[data-direction="up"]::after {
  background: var(--data-chart-candlestick-up, #22c55e);
  bottom: calc(((var(--_open) - var(--_min)) / (var(--_max) - var(--_min))) * 100%);
  height: calc(((var(--_close) - var(--_open)) / (var(--_max) - var(--_min))) * 100%);
}

/* Body (::after) - Bearish (down) */
:host([type=candlestick]) tbody td[data-direction="down"]::after {
  background: var(--data-chart-candlestick-down, #ef4444);
  bottom: calc(((var(--_close) - var(--_min)) / (var(--_max) - var(--_min))) * 100%);
  height: calc(((var(--_open) - var(--_close)) / (var(--_max) - var(--_min))) * 100%);
}
```

## Safari Polyfill

Safari doesn't support `attr()` with type coercion. The component detects this and applies inline styles:

```javascript
#isAdvancedAttrSupported() {
  const T = document.createElement('div');
  document.body.appendChild(T);
  try {
    T.style.setProperty('--t', 'attr(data-test type(<number>), 0)');
    T.dataset.test = "123";
    const computedValue = getComputedStyle(T).getPropertyValue('--t').trim();
    return computedValue === "123";
  } finally {
    T.remove();
  }
}

#applyAdvancedAttrPolyfill() {
  const tds = this.#root.querySelectorAll('td[data-v], td[data-open]');
  tds.forEach(td => {
    if (td.hasAttribute('data-v')) {
      td.style.setProperty('--_v', td.getAttribute('data-v'));
      td.style.setProperty('--_pv', td.getAttribute('data-pv'));
      td.style.setProperty('--_av', td.getAttribute('data-av'));
    }
    if (td.hasAttribute('data-open')) {
      td.style.setProperty('--_open', td.getAttribute('data-open'));
      td.style.setProperty('--_high', td.getAttribute('data-high'));
      td.style.setProperty('--_low', td.getAttribute('data-low'));
      td.style.setProperty('--_close', td.getAttribute('data-close'));
    }
  });

  const tbody = this.#root.querySelector('tbody');
  if (tbody) {
    tbody.style.setProperty('--_t', tbody.getAttribute('data-t'));
    tbody.style.setProperty('--_min', this.getAttribute('min'));
    tbody.style.setProperty('--_max', this.getAttribute('max'));
  }
}
```

## Data Structure

### JSON Schema

```typescript
interface ChartData {
  settings?: {
    min?: number;       // Scale minimum (default: 0)
    max?: number;       // Scale maximum (default: 100)
    caption?: string;   // Chart title
    yAxis?: (string | number)[];  // Y-axis labels
    legend?: string[];  // Legend items
    style?: string;     // Global CSS styles
  };
  data: DataItem[];
}

interface DataItem {
  value: number | number[];           // Required: value or array for grouped
  label?: string;                     // X-axis label
  displayValue?: string | false;      // Custom display or hide
  displayLabel?: string | false;      // Custom label display or hide
  styles?: string | string[];         // Per-item CSS

  // Candlestick only
  open?: number;
  high?: number;
  low?: number;
  close?: number;
}
```

### Accumulated Values

For pie/donut and area/line charts, the render method calculates accumulated values:

```javascript
// Single values
let accumulated = 0;
this.data.map((item, rowIdx) => {
  const prevAccum = accumulated;
  accumulated += Number(item.value) || 0;
  return `<td data-v="${item.value}" data-av="${prevAccum}">`;
});

// Grouped values
let accumulatedArr = [];
item.value.forEach((v, index) => {
  const prevAccum = accumulatedArr[index] || 0;
  accumulatedArr[index] = prevAccum + (Number(v) || 0);
});
```

## Attributes Reference

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `data` | String | — | JSON string or URL to JSON file |
| `type` | String | `"column"` | Chart type: column, bar, area, line, pie, donut, candlestick, poll |
| `options` | String | — | Space-separated display options |
| `min` | Number | `0` | Scale minimum (auto-set from settings) |
| `max` | Number | `100` | Scale maximum (auto-set from settings) |
| `reverse` | Boolean | — | Reverse y-axis label order |
| `items-xs` | Number | — | Max items at <400px width |
| `items-sm` | Number | — | Max items at 400-700px width |
| `items-md` | Number | — | Max items at medium width |
| `items-lg` | Number | — | Max items at large width |
| `items-xl` | Number | — | Max items at extra-large width |

### Options Attribute Values

| Option | Description |
|--------|-------------|
| `caption` | Show chart caption |
| `caption-start` | Align caption to start |
| `caption-end` | Align caption to end |
| `x-labels` | Show x-axis labels |
| `x-labels-vertical` | Rotate x-axis labels vertical |
| `y-labels` | Show y-axis labels |
| `y-labels-end` | Align y-axis labels to end |
| `x-grid` | Show vertical grid lines |
| `y-grid` | Show horizontal grid lines |
| `value-labels` | Show values on bars |
| `value-labels-center` | Center-align value labels |
| `value-labels-end` | End-align value labels |
| `groups` | Enable grouped bar coloring |

## CSS Custom Properties Reference

### Layout

| Property | Default | Description |
|----------|---------|-------------|
| `--data-chart-bg` | `#FFF0` | Chart background |
| `--data-chart-bdrs` | `0.5rem` | Chart border radius |
| `--data-chart-ff` | `ui-sans-serif, system-ui` | Font family |
| `--data-chart-mih` | `275px` | Minimum chart height |
| `--data-chart-p` | `0` | Chart padding |

### Bars

| Property | Default | Description |
|----------|---------|-------------|
| `--data-chart-bar-bdrs` | `clamp(0.125rem, -0.35rem + 1cqi, 0.33rem)` | Bar border radius |
| `--data-chart-bar-bg` | `hsla(210, 100%, 70%, .8)` | Bar background |
| `--data-chart-bar-c` | `currentColor` | Bar text color |
| `--data-chart-bar-fs` | `clamp(0.5625rem, 0.45rem + .5cqi, 0.75rem)` | Bar font size |
| `--data-chart-bar-fw` | `400` | Bar font weight |
| `--data-chart-bar-gap` | `0.25rem` | Gap between bars |
| `--data-chart-bar-miw` | `1.25cqi` | Minimum bar width |
| `--data-chart-bar-p` | `0.75ch 0 0 0` | Bar padding |

### Grid Lines

| Property | Default | Description |
|----------|---------|-------------|
| `--data-chart-bdw` | `1px` | Labeled grid line width |
| `--data-chart-bds` | `solid` | Labeled grid line style |
| `--data-chart-bdc` | `light-dark(#CCC, #666)` | Labeled grid line color |
| `--data-chart-nolabel-bdw` | `1px` | Unlabeled grid line width |
| `--data-chart-nolabel-bds` | `solid` | Unlabeled grid line style |
| `--data-chart-nolabel-bdc` | `light-dark(#EBEBEB, #444)` | Unlabeled grid line color |

### Axes

| Property | Default | Description |
|----------|---------|-------------|
| `--data-chart-x-axis-c` | `light-dark(#444, #EEE)` | X-axis label color |
| `--data-chart-x-axis-fs` | `clamp(0.5625rem, 0.4rem + .5cqi, 0.6875rem)` | X-axis font size |
| `--data-chart-x-axis-fw` | `400` | X-axis font weight |
| `--data-chart-y-axis-c` | `light-dark(#696969, #EEE)` | Y-axis label color |
| `--data-chart-y-axis-fs` | `10px` | Y-axis font size |
| `--data-chart-y-axis-fw` | `300` | Y-axis font weight |
| `--data-chart-y-axis-w` | `1.5rem` | Y-axis width |
| `--data-chart-label-h` | `20px` | X-axis label height |
| `--data-chart-label-w` | `5rem` | Bar chart label width |

### Caption & Legend

| Property | Default | Description |
|----------|---------|-------------|
| `--data-chart-caption-fs` | `11px` | Caption font size |
| `--data-chart-caption-fw` | `500` | Caption font weight |
| `--data-chart-caption-h` | `1.5rem` | Caption area height |
| `--data-chart-legend-fs` | `small` | Legend font size |
| `--data-chart-legend-gap` | `0.25rem 1rem` | Legend item gap |
| `--data-chart-legend-jc` | `center` | Legend justify-content |
| `--data-chart-legend-m` | `1rem 0` | Legend margin |
| `--data-chart-legend-item-bdrs` | `0` | Legend swatch border radius |
| `--data-chart-legend-item-gap` | `0.5rem` | Legend item internal gap |
| `--data-chart-legend-item-h` | `1rem` | Legend swatch height |
| `--data-chart-legend-item-w` | `1.5rem` | Legend swatch width |

### Candlestick

| Property | Default | Description |
|----------|---------|-------------|
| `--data-chart-candlestick-up` | `#22c55e` | Bullish candle color |
| `--data-chart-candlestick-down` | `#ef4444` | Bearish candle color |
| `--data-chart-candlestick-wick` | `#666` | Wick color |
| `--data-chart-candlestick-wick-w` | `1px` | Wick width |

### Poll

| Property | Default | Description |
|----------|---------|-------------|
| `--data-chart-poll-bg` | `#EEE` | Poll bar background |
| `--data-chart-poll-fw` | `600` | Poll label font weight |
| `--data-chart-poll-row-gap` | `1ch` | Gap between poll rows |

### Line Chart

| Property | Default | Description |
|----------|---------|-------------|
| `--line-chart-line-h` | `2cqb` | Line thickness |

### Color Palette

| Property | Default | Description |
|----------|---------|-------------|
| `--c1` | `hsla(210, 60%, 60%, .75)` | Series color 1 |
| `--c2` | `hsla(170, 45%, 55%, .75)` | Series color 2 |
| `--c3` | `hsla(100, 40%, 55%, .75)` | Series color 3 |
| `--c4` | `hsla(60, 40%, 60%, .75)` | Series color 4 |
| `--c5` | `hsla(35, 50%, 65%, .75)` | Series color 5 |
| `--c6` | `hsla(15, 55%, 60%, .75)` | Series color 6 |
| `--c7` | `hsla(350, 50%, 60%, .75)` | Series color 7 |
| `--c8` | `hsla(280, 40%, 60%, .75)` | Series color 8 |
| `--c9` | `hsla(240, 45%, 55%, .75)` | Series color 9 |
| `--c10` | `hsla(200, 30%, 65%, .75)` | Series color 10 |

## Properties

| Property | Type | Description |
|----------|------|-------------|
| `dataset` | Object | Get/set full dataset (triggers re-render) |
| `settings` | Object | Get settings portion of dataset |
| `data` | Array | Get data array portion of dataset |

## Observed Attributes

| Attribute | Description |
|-----------|-------------|
| `data` | Triggers `load()` when changed |

## Usage Patterns

### Column Chart from URL

```html
<data-chart
  type="column"
  data="/api/sales.json"
  options="caption x-labels y-labels y-grid"
></data-chart>
```

### Inline Pie Chart

```html
<data-chart
  type="pie"
  data='{"data":[{"value":30},{"value":50},{"value":20}],"settings":{"legend":["A","B","C"]}}'
></data-chart>
```

### Grouped Bar Chart

```html
<data-chart
  type="column"
  options="x-labels y-labels groups"
  data='{"data":[
    {"label":"Q1","value":[10,20,30]},
    {"label":"Q2","value":[15,25,35]}
  ],"settings":{"legend":["2022","2023","2024"]}}'
></data-chart>
```

### Candlestick Chart

```html
<data-chart
  type="candlestick"
  options="x-labels y-labels y-grid"
  data='{"settings":{"min":100,"max":150,"yAxis":["$100","$125","$150"]},
         "data":[{"label":"W1","open":110,"high":130,"low":105,"close":125}]}'
></data-chart>
```

### Responsive Chart

```html
<data-chart
  type="area"
  data="/data/hourly.json"
  items-xs="6"
  items-sm="12"
></data-chart>
```

## Gotchas & Edge Cases

1. **Safari requires polyfill**: Safari doesn't support `attr()` with `type(<number>)`. The component auto-detects and applies inline styles as fallback.

2. **Data attribute is observed**: Changing the `data` attribute triggers a full re-render. For programmatic updates, set the `dataset` property instead.

3. **Grouped data coloring**: Without `options="groups"`, all bars in a row share the same color (row-based). With `groups`, bars within a row get different colors (column-based).

4. **Area/Line stacking**: All `<td>` elements occupy the same grid cell. The `data-pv` (previous value) attribute enables connecting segments.

5. **Y-axis reversal**: By default, y-axis labels are reversed (highest at top). Add `reverse` attribute to keep original order.

6. **Pie/Donut totals**: The `data-t` attribute on `<tbody>` holds the sum for percentage calculation. Accumulated values (`data-av`) determine slice positions.

7. **Candlestick direction**: The `data-direction` attribute ("up" or "down") is auto-calculated from open vs close prices.

8. **Empty data handling**: The component displays an error message if data is missing, not an array, or items lack `value` properties.

9. **Color cycling**: Colors cycle through `--c1` to `--c10` using `:nth-of-type(10n+N)` selectors, supporting unlimited data points.

10. **Container queries required**: Uses `cqi` and `cqb` units extensively. Ensure parent has width defined.
