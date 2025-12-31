# Table Component

A collection of CSS modifier classes to enhance the appearance of native HTML tables. Supports zebra striping, hover effects, sticky headers/columns, and more—all without JavaScript.

## Installation

```bash
npm install @browser.style/table
```

For required dependencies and basic setup, see the [main documentation](../readme.md).

## Usage

Import the component CSS:

```html
<link rel="stylesheet" href="node_modules/@browser.style/table/index.css">
```

Or in your CSS:
```css
@import '@browser.style/table';
```

## Basic Example

```html
<table class="ui-table">
  <colgroup><col><col><col></colgroup>
  <thead>
    <tr><th>Name</th><th>Role</th><th>Status</th></tr>
  </thead>
  <tbody>
    <tr><td>Alice</td><td>Developer</td><td>Active</td></tr>
    <tr><td>Bob</td><td>Designer</td><td>Away</td></tr>
  </tbody>
</table>
```

> **Note:** Include `<colgroup>` with `<col>` elements for column hover and zebra column effects to work.

## Table Modifiers

Add these classes to the `<table class="ui-table">` element:

| Modifier | Description |
|----------|-------------|
| `--block-border` | Bottom borders only |
| `--density-sm` | Smaller font size and padding |
| `--density-lg` | Larger font size and padding |
| `--fixed` | Fixed table layout (`table-layout: fixed`) |
| `--no-border` | Remove all borders |
| `--no-wrap` | Prevent text wrapping in cells |
| `--rounded` | Rounded corners (0.33rem) |
| `--split-cols` | Horizontal spacing between columns |
| `--split-rows` | Vertical spacing between rows |
| `--th-dark` | Dark header background |
| `--th-light` | Light header background |

### Zebra Striping

| Modifier | Description |
|----------|-------------|
| `--zebracol-even` | Stripe even columns |
| `--zebracol-odd` | Stripe odd columns |
| `--zebrarow-even` | Stripe even rows |
| `--zebrarow-odd` | Stripe odd rows |

Column striping requires `<colgroup>` with `<col>` elements.

### Hover Effects

All hover effects are wrapped in `@media (hover: hover)` to prevent sticky states on touch devices.

| Modifier | Description |
|----------|-------------|
| `--hover-all` | Enable all hover effects |
| `--hover-col` | Column background highlight on hover |
| `--hover-col-outline` | Column outline on hover |
| `--hover-td` | Cell fill on hover |
| `--hover-td-outline` | Cell outline on hover |
| `--hover-tr` | Row background highlight on hover |
| `--hover-tr-outline` | Row outline on hover |
| `--hover-th-outline` | Header cell outline on hover |

## Row Modifiers

Apply these classes directly to `<tr>` elements:

| Modifier | Description |
|----------|-------------|
| `--row-active` | Active row state (AccentColor background) |
| `--row-selected` | Selected row state (Highlight background) |

```html
<tr class="--row-selected"><td>Selected row</td><td>...</td></tr>
<tr class="--row-active"><td>Active row</td><td>...</td></tr>
```

## Overflow Wrapper

For scrollable tables with sticky headers and columns, wrap the table in `.ui-table-wrapper`:

```html
<div class="ui-table-wrapper --overflowing --rounded" style="max-height: 300px;">
  <table class="ui-table --hover-tr">
    <colgroup><col><col><col></colgroup>
    ...
  </table>
</div>
```

### Wrapper Modifiers

| Modifier | Description |
|----------|-------------|
| `--overflowing` | Enable sticky header and scroll shadows |
| `--rounded` | Rounded corners on wrapper border |
| `--c0` to `--c8` | Make columns 1-9 sticky |

### Sticky Columns

For multiple sticky columns, provide cumulative offsets:

```html
<div class="ui-table-wrapper --overflowing --c0 --c1"
     style="--c0: 0; --c1: 100px; max-height: 400px;">
  <table class="ui-table">...</table>
</div>
```

The `--c0`, `--c1`, etc. custom properties define the `left` position for each sticky column.

## CSS Custom Properties

### Core Properties

| Property | Default | Description |
|----------|---------|-------------|
| `--ui-table-bdrs` | `0` | Border radius |
| `--ui-table-bdw` | `1px` | Border width |
| `--ui-table-bdc` | `var(--ButtonBorder)` | Border color |
| `--ui-table-bdsp-x` | `0` | Horizontal border spacing |
| `--ui-table-bdsp-y` | `0` | Vertical border spacing |
| `--ui-table-ff` | `inherit` | Font family |
| `--ui-table-fs` | `inherit` | Font size |
| `--ui-table-p` | `.6ch 1.2ch` | Cell padding |

### Background Properties

| Property | Default | Description |
|----------|---------|-------------|
| `--ui-table-td-bg` | `inherit` | Cell background |
| `--ui-table-th-bg` | `inherit` | Header background |
| `--ui-table-th-dark` | `var(--ButtonText)` | Dark header color |
| `--ui-table-zebra-bgc` | `var(--CanvasGray)` | Zebra stripe color |

### Hover Properties

| Property | Default | Description |
|----------|---------|-------------|
| `--ui-table-col-hover` | `var(--ButtonFace)` | Column hover background |
| `--ui-table-td-hover` | `var(--ButtonText)` | Cell hover background |
| `--ui-table-tr-hover` | `var(--ButtonFace)` | Row hover background |
| `--ui-table-outline-bdc` | `var(--ButtonText)` | Outline hover color |
| `--ui-table-outline-bdw` | `2px` | Outline hover width |

### Row State Properties

| Property | Default | Description |
|----------|---------|-------------|
| `--ui-table-tr-active-bg` | `var(--AccentColor)` | Active row background |
| `--ui-table-tr-active-color` | `var(--AccentColorText)` | Active row text |
| `--ui-table-tr-active-hover` | `var(--AccentColorDark)` | Active row cell hover background |
| `--ui-table-tr-selected-bg` | `var(--Highlight)` | Selected row background |
| `--ui-table-tr-selected-color` | `var(--HighlightText)` | Selected row text |
| `--ui-table-tr-selected-hover` | `var(--AccentColor)` | Selected row cell hover background |

## Examples

### Split Columns with Dark Header

```html
<table class="ui-table --split-cols --th-dark --rounded --hover-tr">
  <colgroup><col><col><col></colgroup>
  <thead><tr><th>A</th><th>B</th><th>C</th></tr></thead>
  <tbody>
    <tr><td>1</td><td>2</td><td>3</td></tr>
  </tbody>
</table>
```

### Zebra Rows with Cell Outline Hover

```html
<table class="ui-table --zebrarow-odd --hover-td-outline">
  <colgroup><col><col><col></colgroup>
  <thead><tr><th>A</th><th>B</th><th>C</th></tr></thead>
  <tbody>
    <tr><td>1</td><td>2</td><td>3</td></tr>
    <tr><td>4</td><td>5</td><td>6</td></tr>
  </tbody>
</table>
```

### Scrollable with Sticky Header

```html
<div class="ui-table-wrapper --overflowing --rounded" style="max-height: 200px;">
  <table class="ui-table --hover-tr">
    <colgroup><col><col><col></colgroup>
    <thead><tr><th>A</th><th>B</th><th>C</th></tr></thead>
    <tbody>
      <tr><td>Row 1</td><td>...</td><td>...</td></tr>
      <!-- More rows -->
    </tbody>
  </table>
</div>
```

## Notes

- **Column hover requires `<colgroup>`**: The `--hover-col` and `--zebracol-*` modifiers only work if the table has `<colgroup>` with matching `<col>` elements.
- **Column limit**: Column hover and sticky columns are limited to columns 1-9.
- **Touch devices**: Hover effects are disabled on touch devices via `@media (hover: hover)`.
- **RTL support**: Uses logical properties (`inline-start`, `block-end`) for RTL compatibility.
- **Scroll shadow**: The sticky header shadow uses scroll-driven animations (browsers supporting `animation-timeline: scroll()`).
