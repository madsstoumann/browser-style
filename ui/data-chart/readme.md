# Data Chart

Data Chart is a web component for creating various types of charts. It is built with HTML, CSS, and JavaScript, and can be used with any framework.

## Installation

To install the component, run the following command in your terminal:

```bash
npm install @browser.style/data-chart
```

## Usage

Here are some examples of how to use the component.

### Loading Data from a JSON file

You can load data from an external JSON file by providing the path to the file in the `data` attribute.

```html
<data-chart
  type="area"
  data="../data-chart/demo/temperature.json"
  options="caption-end x-labels value-labels y-grid y-labels"
  items-xs="5"
  items-sm="10"
></data-chart>
```

The component will fetch the JSON file and render the chart. The JSON file should have a `settings` object and a `data` array.

Example `temperature.json`:
```json
{
  "settings": {
    "min": 0,
    "max": 15,
    "caption": "Hourly Temperature Readings (°C)",
    "yAxis": [0, "", 3, "", 6, "", 9, "", 12, "", 15]
  },
  "data": [
    {
      "value": 6.4,
      "label": "01:00",
      "displayValue": "6.4°",
      "displayLabel": false
    },
    {
      "value": 6.3,
      "label": "02:00",
      "displayValue": "6.3°"
    }
  ]
}
```

### Inline Data

You can also provide the data directly as a JSON string in the `data` attribute. The JSON should include a `settings` object (optional) and a `data` array.

```html
<data-chart
  options="x-labels y-labels y-grid groups"
  type="column"
  data='{
    "settings": {"legend": ["January", "February", "March"]},
    "data": [
      {"label": "2022", "value": [10, 20, 30]},
      {"label": "2023", "value": [15, 25, 35]},
      {"label": "2024", "value": [20, 30, 40]}
    ]
  }'
></data-chart>
```

### Column Chart

```html
<data-chart
  options="x-labels y-labels y-grid groups"
  type="column"
  data='{
    "settings": {"legend": ["January", "February", "March"]},
    "data": [
      {"label": "2022", "value": [10, 20, 30]},
      {"label": "2023", "value": [15, 25, 35]},
      {"label": "2024", "value": [20, 30, 40]}
    ]
  }'
></data-chart>
```

### Bar Chart

```html
<data-chart
  options="x-labels"
  type="bar"
  data='{
    "data": [
      {"label": "Apples", "value": 40},
      {"label": "Oranges", "value": 60},
      {"label": "Bananas", "value": 80}
    ]
  }'
></data-chart>
```

### Donut Chart

```html
<data-chart
  type="donut"
  data='{
    "settings": {"legend": ["Red", "Green", "Blue"]},
    "data": [
      {"value": 20},
      {"value": 30},
      {"value": 50}
    ]
  }'
></data-chart>
```

### Pie Chart

```html
<data-chart
  type="pie"
  data='{
    "settings": {"legend": ["Red", "Green", "Blue"]},
    "data": [
      {"value": 20},
      {"value": 30},
      {"value": 50}
    ]
  }'
></data-chart>
```

### Candlestick Chart

```html
<data-chart
  type="candlestick"
  options="caption x-labels y-grid y-labels"
  data='{
    "settings": {
      "min": 100,
      "max": 120,
      "caption": "Stock Price"
    },
    "data": [
      {
        "label": "W1",
        "value": 108.5,
        "displayValue": "$108.50",
        "open": 105.2,
        "high": 110.8,
        "low": 104.1,
        "close": 108.5
      },
      {
        "label": "W2",
        "value": 112.3,
        "displayValue": "$112.30",
        "open": 108.5,
        "high": 114.2,
        "low": 107.9,
        "close": 112.3
      }
    ]
  }'
></data-chart>
```

### Poll Chart

```html
<data-chart
  type="poll"
  options="x-labels"
  data='{
    "data": [
      {"label": "Option A", "value": 950, "displayValue": "950 votes / 5%"},
      {"label": "Option B", "value": 2191, "displayValue": "2191 votes / 13%"},
      {"label": "Option C", "value": 1857, "displayValue": "1857 votes / 11%"}
    ]
  }'
></data-chart>
```

### Responsiveness

The chart component is responsive and allows you to control the number of data points displayed at different screen sizes using the `items-*` attributes.

- `items-xs`: Number of items to show on extra-small screens (<400px).
- `items-sm`: Number of items to show on small screens (400px - 700px).
- `items-md`: Number of items to show on medium screens.
- `items-lg`: Number of items to show on large screens.
- `items-xl`: Number of items to show on extra-large screens.

In this example, the chart will show 5 items on screens smaller than 400px and 10 items on screens between 400px and 700px.

```html
<data-chart
  type="area"
  data="../data-chart/demo/temperature.json"
  items-xs="5"
  items-sm="10"
></data-chart>
```

## Attributes

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `data` | String | — | JSON string or URL to JSON file |
| `type` | String | `"column"` | Chart type (see below) |
| `options` | String | — | Space-separated display options |
| `min` | Number | `0` | Scale minimum (auto-set from settings) |
| `max` | Number | `100` | Scale maximum (auto-set from settings) |
| `reverse` | Boolean | — | Reverse y-axis label order |
| `items-xs` | Number | — | Max items at <400px width |
| `items-sm` | Number | — | Max items at 400-700px width |
| `items-md` | Number | — | Max items at medium width |
| `items-lg` | Number | — | Max items at large width |
| `items-xl` | Number | — | Max items at extra-large width |

## Data Structure

### Chart Types
The `type` attribute can be:
- `column` (default)
- `area`
- `bar`
- `candlestick`
- `donut`
- `line`
- `pie`
- `poll`

### Data Properties

Each data item is an object that can contain:

- `value` (required): The data value. Can be a single number/string or an array of values for grouped charts.
- `label` (optional): The label for this data point.
- `displayValue` (optional): Custom display text for the value. If `false`, hides the value display.
- `displayLabel` (optional): Custom display text for the label. If `false`, hides the label display.
- `styles` (optional): Custom CSS styles for this data point (string or array of strings for grouped data).

#### Candlestick-Specific Properties
For candlestick charts, each data item should also include:
- `open`: Opening price
- `high`: Highest price
- `low`: Lowest price  
- `close`: Closing price

The `value` property typically matches the `close` value for candlestick charts.

### Settings Object

The settings object can contain:
- `min`: Minimum value for the chart scale
- `max`: Maximum value for the chart scale
- `caption`: Chart title/caption
- `yAxis`: Array of y-axis labels
- `legend`: Array of legend items
- `style`: Global styles for the chart

## Display Options

The `options` attribute controls chart display features. Multiple options can be combined with spaces:

### Caption Options
- `caption`: Show the chart caption
- `caption-start`: Align caption to start
- `caption-end`: Align caption to end

### Label Options
- `x-labels`: Show x-axis labels
- `x-labels-vertical`: Display x-axis labels vertically
- `y-labels`: Show y-axis labels
- `y-labels-end`: Align y-axis labels to end

### Grid Options
- `x-grid`: Show vertical grid lines
- `y-grid`: Show horizontal grid lines

### Value Display Options
- `value-labels`: Show value labels on data points
- `value-labels-center`: Center-align value labels
- `value-labels-end`: End-align value labels

### Grouping Options
- `groups`: Enable grouped data styling (for multi-series charts)

Example:
```html
<data-chart options="caption-end x-labels y-grid y-labels groups"></data-chart>
```

## Browser Compatibility

The component uses modern CSS features and includes automatic fallbacks for browsers that don't support advanced CSS attribute functions. Safari and older browsers will receive a JavaScript polyfill for full functionality.

## Error Handling

The component includes built-in validation and will display error messages for:
- Missing or invalid data
- Incorrect data structure
- Network errors when loading external JSON files

## Custom Properties

| Name | Description |
|------|-------------|
| `--data-chart-bar-bdrs` | Border radius for bars |
| `--data-chart-bar-c` | Text color for bar value labels |
| `--data-chart-bar-fs` | Font size for bar value labels |
| `--data-chart-bar-fw` | Font weight for bar value labels |
| `--data-chart-bar-gap` | Gap between bars |
| `--data-chart-bar-label-pi` | Padding inline for bar labels |
| `--data-chart-bar-miw` | Minimum inline width for bars |
| `--data-chart-bar-p` | Padding for bars |
| `--data-chart-bar-bg` | Background for bars |
| `--data-chart-bdc` | Border color for labeled grid lines |
| `--data-chart-bds` | Border style for labeled grid lines |
| `--data-chart-bdrs` | Border radius for the chart container |
| `--data-chart-bdw` | Border width for labeled grid lines |
| `--data-chart-bg` | Chart background |
| `--data-chart-caption-fs` | Font size for chart caption |
| `--data-chart-caption-fw` | Font weight for chart caption |
| `--data-chart-caption-h` | Height of the chart caption area |
| `--data-chart-ff` | Font family for the chart |
| `--data-chart-label-h` | Height of the x-axis label area |
| `--data-chart-label-h-vertical` | Height of x-axis label area when vertical |
| `--data-chart-label-w` | Width of the y-axis label area for bar charts |
| `--data-chart-legend-bdrs` | Border radius for legend color swatch |
| `--data-chart-legend-fs` | Font size for legend |
| `--data-chart-legend-gap` | Gap between legend items |
| `--data-chart-legend-item-bdrs` | Border radius for legend color swatch |
| `--data-chart-legend-item-gap` | Gap inside legend items |
| `--data-chart-legend-item-h` | Height for legend color swatch |
| `--data-chart-legend-item-w` | Width for legend color swatch |
| `--data-chart-legend-jc` | Justify content for legend |
| `--data-chart-legend-m` | Margin for legend |
| `--data-chart-mih` | Minimum height of the chart |
| `--data-chart-mih-vertical` | Minimum height of chart when x-axis labels are vertical |
| `--data-chart-nolabel-bdc` | Border color for unlabeled grid lines |
| `--data-chart-nolabel-bds` | Border style for unlabeled grid lines |
| `--data-chart-nolabel-bdw` | Border width for unlabeled grid lines |
| `--data-chart-p` | Padding for the chart container |
| `--data-chart-x-axis-bdc` | Border color for x-axis |
| `--data-chart-x-axis-bds` | Border style for x-axis |
| `--data-chart-x-axis-bdw` | Border width for x-axis |
| `--data-chart-x-axis-c` | Text color for x-axis labels |
| `--data-chart-x-axis-fs` | Font size for x-axis labels |
| `--data-chart-x-axis-fw` | Font weight for x-axis labels |
| `--data-chart-x-axis-p` | Padding for x-axis labels |
| `--data-chart-y-axis-c` | Text color for y-axis labels |
| `--data-chart-y-axis-fs` | Font size for y-axis labels |
| `--data-chart-y-axis-fw` | Font weight for y-axis labels |
| `--data-chart-y-axis-w` | Width of the y-axis label area |
| `--chart-group-bar-miw` | Minimum width for grouped bars |
| `--line-chart-line-h` | Height of the line in line chart |

### Candlestick Chart Properties
| Name | Description |
|------|-------------|
| `--data-chart-candlestick-up` | Color for bullish (up) candles |
| `--data-chart-candlestick-down` | Color for bearish (down) candles |
| `--data-chart-candlestick-wick` | Color for candlestick wicks |
| `--data-chart-candlestick-wick-w` | Width of candlestick wicks |

### Poll Chart Properties
| Name | Description |
|------|-------------|
| `--data-chart-poll-bg` | Background color for poll bars |
| `--data-chart-poll-fw` | Font weight for poll labels |
| `--data-chart-poll-row-gap` | Gap between poll rows |

> Note: Color variables like `--c1`, `--c2`, ... `--c10` are used for series coloring and can be set per chart instance.

## JavaScript API

### Properties

| Property | Type | Description |
|----------|------|-------------|
| `dataset` | Object | Get/set full dataset object (triggers re-render) |
| `settings` | Object | Get settings portion of dataset (read-only) |
| `data` | Array | Get data array portion of dataset (read-only) |

### Methods

| Method | Parameters | Description |
|--------|------------|-------------|
| `load(source)` | `source`: String | Load data from JSON string or URL |
| `render()` | — | Re-render the chart with current dataset |

### Example

```javascript
const chart = document.querySelector('data-chart');

// Load data from URL
chart.load('/api/sales-data.json');

// Or set data directly
chart.dataset = {
  settings: { min: 0, max: 100, caption: 'Sales' },
  data: [
    { label: 'Q1', value: 25 },
    { label: 'Q2', value: 45 },
    { label: 'Q3', value: 35 }
  ]
};

// Access current data
console.log(chart.settings.caption); // "Sales"
console.log(chart.data.length); // 3
```
