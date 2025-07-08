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
  display="caption-end x-labels value-labels y-grid y-labels"
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
      "label": "01:00"
    },
    {
      "value": 6.3,
      "label": "02:00"
    }
  ]
}
```

### Inline Data

You can also provide the data directly as a JSON string in the `data` attribute.

```html
<data-chart
  display="x-labels y-labels y-grid"
  type="column"
  legend='["January", "February", "March"]'
  data='[
    {"label": "2022", "value": [10, 20, 30]},
    {"label": "2023", "value": [15, 25, 35]},
    {"label": "2024", "value": [20, 30, 40]}
  ]'
></data-chart>
```

### Column Chart

```html
<data-chart
  display="x-labels y-labels y-grid"
  type="column"
  legend='["January", "February", "March"]'
  data='[
    {"label": "2022", "value": [10, 20, 30]},
    {"label": "2023", "value": [15, 25, 35]},
    {"label": "2024", "value": [20, 30, 40]}
  ]'
></data-chart>
```

### Bar Chart

```html
<data-chart
  display="x-labels"
  type="bar"
  data='[
    {"label": "Apples", "value": 40},
    {"label": "Oranges", "value": 60},
    {"label": "Bananas", "value": 80}
  ]'
></data-chart>
```

### Donut Chart

```html
<data-chart
  type="donut"
  legend='["Red", "Green", "Blue"]'
  data='[
    {"value": 20},
    {"value": 30},
    {"value": 50}
  ]'
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

## Data Structure

### Settings
- `type` can be
	- column (default)
	- area
	- donut
	- line
	- pie

### Data

- `value` can be a single string, number — or an array of values.

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
| `--data-chart-y-axis-c` | Text color for y-axis labels |
| `--data-chart-y-axis-fs` | Font size for y-axis labels |
| `--data-chart-y-axis-fw` | Font weight for y-axis labels |
| `--data-chart-y-axis-w` | Width of the y-axis label area |
| `--chart-group-bar-miw` | Minimum width for grouped bars |
| `--line-chart-line-h` | Height of the line in line chart |

> Note: Color variables like `--c1`, `--c2`, ... are used for series coloring and can be set per chart instance.

