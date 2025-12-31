# Table Component - Internal Architecture

## Overview

`.ui-table` is a CSS-only component that provides extensive styling modifiers for native HTML tables. It uses CSS cascade layers, custom properties, and modern selectors like `:has()` to achieve complex interactive effects without JavaScript.

**Version:** 1.0.10 (package.json)

**Component Type:** Pure CSS, no JavaScript

**Key Characteristics:**
- CSS-only implementation using `@layer bs-component`
- BEM-like modifier classes (`--modifier-name`)
- Uses CSS system colors (e.g., `ButtonFace`, `Highlight`, `AccentColor`)
- Column hover via `:has()` selector with `<colgroup>`/`<col>` elements
- Supports sticky headers and columns via wrapper class
- Scroll-driven animations for shadow effects
- RTL-compatible with logical properties

**Dependencies:**
- `@browser.style/base` (peer dependency for system color variables)

## Architecture Overview

### CSS Layer Structure

```css
@layer bs-component {
  :where(.ui-table) {
    /* Base styles and custom properties */
  }
}
```

Using `@layer` ensures predictable cascade ordering. The `:where()` wrapper gives zero specificity for easy overrides.

### Core Structure

```
.ui-table                    ← Main table element
  ├── <colgroup>             ← Required for column hover effects
  │     └── <col>            ← One per column
  ├── <thead>
  │     └── <tr><th>...</th></tr>
  └── <tbody>
        └── <tr><td>...</td></tr>

.ui-table-wrapper            ← Optional overflow container
  └── .ui-table              ← Enables sticky header/columns
```

### Border System

The component uses `border-collapse: separate` with individual border control:

```css
& :is(td, th) {
  border-block-width: var(--ui-table-bdw) 0;     /* Top only */
  border-inline-width: 0 var(--ui-table-bdw);    /* Right only */
  &:first-of-type { border-inline-start-width: var(--ui-table-bdw); }
}

& tr:last-of-type td {
  border-block-end-width: var(--ui-table-bdw);   /* Bottom on last row */
}
```

This creates a connected border grid while allowing `border-spacing` for split layouts.

## Modifier System

### Table-Level Modifiers

| Modifier | Effect |
|----------|--------|
| `--block-border` | Bottom borders only |
| `--density-sm` | Smaller font/padding |
| `--density-lg` | Larger font/padding |
| `--fixed` | `table-layout: fixed` |
| `--no-border` | Remove all borders |
| `--no-wrap` | Prevent text wrapping |
| `--rounded` | Rounded corners (`0.33rem`) |
| `--split-cols` | Horizontal spacing between columns |
| `--split-rows` | Vertical spacing between rows |
| `--th-dark` | Dark header background |
| `--th-light` | Light header background |

### Zebra Striping Modifiers

| Modifier | Effect |
|----------|--------|
| `--zebracol-even` | Stripe even columns |
| `--zebracol-odd` | Stripe odd columns |
| `--zebrarow-even` | Stripe even rows |
| `--zebrarow-odd` | Stripe odd rows |

**Implementation:**
```css
&.--zebracol-even col:nth-of-type(even),
&.--zebracol-odd col:nth-of-type(odd),
&.--zebrarow-even tr:nth-of-type(even) td,
&.--zebrarow-odd tr:nth-of-type(odd) td {
  --ui-table-td-bg: var(--ui-table-zebra-bgc, var(--CanvasGray));
}
```

Column striping requires `<colgroup>` with `<col>` elements.

### Hover Modifiers

All hover effects are wrapped in `@media (hover: hover)` to prevent sticky states on touch devices.

| Modifier | Effect |
|----------|--------|
| `--hover-all` | Enable all hover effects |
| `--hover-col` | Column background highlight |
| `--hover-col-outline` | Column outline on hover |
| `--hover-td` | Cell fill on hover |
| `--hover-td-outline` | Cell outline on hover |
| `--hover-tr` | Row background highlight |
| `--hover-tr-outline` | Row outline on hover |
| `--hover-th-outline` | Header cell outline on hover |

### Row-Level Modifiers

Applied directly to `<tr>` elements:

| Modifier | Effect |
|----------|--------|
| `--row-active` | Active row state (AccentColor) |
| `--row-selected` | Selected row state (Highlight) |

```html
<tr class="--row-selected"><td>...</td></tr>
<tr class="--row-active"><td>...</td></tr>
```

## Column Hover Technique

The column hover effect uses the `:has()` selector to detect which column is being hovered:

```css
&:has(:is(td,th):nth-child(1):is(:focus-visible,:hover)) col:nth-child(1),
&:has(:is(td,th):nth-child(2):is(:focus-visible,:hover)) col:nth-child(2),
/* ... repeated for columns 1-9 */
{
  background-color: var(--ui-table-col-hover);
}
```

**How it works:**
1. When any cell in column N is hovered
2. The `:has()` selector on the table matches
3. The corresponding `<col>` element gets a background color
4. The `<col>` background shows through all cells in that column

**Requirement:** Must have `<colgroup>` with `<col>` elements matching column count.

### Column Outline Hover

More complex - uses pseudo-elements on each cell:

```css
&.--hover-col-outline {
  & :is(td,th) {
    position: relative;
    &::after {
      border-inline: var(--ui-table-outline-bdw) solid transparent;
      content: '';
      inset: calc(0px - var(--ui-table-bdw)) 0 0 0;
      position: absolute;
    }
  }
  /* First row gets top border */
  & tr:first-of-type th::after {
    border-block-start: var(--ui-table-outline-bdw) solid transparent;
  }
  /* Last row gets bottom border */
  & tr:last-of-type td::after {
    border-block-end: var(--ui-table-outline-bdw) solid transparent;
  }

  /* On hover, make borders visible */
  &:has(:is(td,th):nth-child(N):is(:focus-visible,:hover)) :is(td,th):nth-child(N)::after {
    border-color: var(--ui-table-outline-bdc);
  }
}
```

## Split Layout Modes

### Split Columns

```css
&.--split-cols {
  --ui-table-bdsp-x: 2ch;
  margin-inline: calc(0px - var(--ui-table-bdsp-x));  /* Compensate for spacing */
  & :is(td, th) { border-inline-width: var(--ui-table-bdw); }  /* Full inline borders */
}
```

Each column becomes a visually separate card. The negative margin compensates for edge spacing.

### Split Rows

```css
&.--split-rows {
  --ui-table-bdsp-y: 1.5ch;
  margin-block: calc(0px - var(--ui-table-bdsp-y));
  & :is(td, th) { border-block-width: var(--ui-table-bdw); }
}
```

Each row becomes a visually separate card.

## Overflow Wrapper

The `.ui-table-wrapper` class provides scrollable containers with sticky headers/columns:

```html
<div class="ui-table-wrapper --overflowing --c0 --c1 --rounded"
     style="--c0: 0; --c1: 100px; max-height: 300px;">
  <table class="ui-table">...</table>
</div>
```

### Sticky Header

```css
&.--overflowing table thead {
  inset-block-start: 0;
  position: sticky;
  z-index: 2;
}
```

### Sticky Columns

Classes `--c0` through `--c8` make columns 1-9 sticky:

```css
&.--c0 :is(td,th):nth-of-type(1),
&.--c1 :is(td,th):nth-of-type(2),
/* ... */
{
  inset-inline-start: var(--_iis);
  position: sticky;
  z-index: 1;
}

&.--c0 :is(td,th):nth-of-type(1) { --_iis: var(--c0); }
&.--c1 :is(td,th):nth-of-type(2) { --_iis: var(--c1); }
```

The `--c0`, `--c1`, etc. custom properties define the `left` offset for each sticky column, allowing cumulative positioning.

### Scroll Shadow Animation

Uses scroll-driven animations for a shadow that appears when scrolled:

```css
@supports (animation-timeline: scroll()) {
  &.--overflowing table thead {
    animation: scroll-shadow linear both;
    animation-timeline: scroll();
    animation-range: 0ex 5ex;
  }
}

@keyframes scroll-shadow {
  from { box-shadow: none; }
  to { box-shadow: 0em .4em .2em -.2em var(--ButtonBorder); }
}
```

The shadow appears progressively as the user scrolls.

## CSS Custom Properties Reference

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

## Usage Patterns

### Basic Table with Hover

```html
<table class="ui-table --hover-tr">
  <colgroup><col><col><col></colgroup>
  <thead><tr><th>A</th><th>B</th><th>C</th></tr></thead>
  <tbody>
    <tr><td>1</td><td>2</td><td>3</td></tr>
  </tbody>
</table>
```

### Split Columns with Dark Header

```html
<table class="ui-table --split-cols --th-dark --rounded --hover-tr">
  <colgroup><col><col><col></colgroup>
  ...
</table>
```

### Zebra Rows with Cell Outline Hover

```html
<table class="ui-table --zebrarow-odd --hover-td-outline">
  <colgroup><col><col><col></colgroup>
  ...
</table>
```

### Scrollable with Sticky Header and First Column

```html
<div class="ui-table-wrapper --overflowing --rounded --c0"
     style="--c0: 0; max-height: 400px;">
  <table class="ui-table --hover-tr">
    <colgroup><col><col><col></colgroup>
    ...
  </table>
</div>
```

### Row Selection States

```html
<table class="ui-table --hover-all">
  <tbody>
    <tr class="--row-selected"><td>...</td></tr>
    <tr class="--row-active"><td>...</td></tr>
    <tr><td>...</td></tr>
  </tbody>
</table>
```

## Gotchas & Edge Cases

1. **Column hover requires `<colgroup>`**: The `--hover-col` and `--zebracol-*` modifiers only work if the table has `<colgroup>` with matching `<col>` elements.

2. **Column limit**: Column hover/sticky is limited to columns 1-9 due to explicit CSS selectors.

3. **Split + outline incompatibility**: `--hover-col-outline` doesn't work well with `--split-cols` or `--split-rows` due to `border-spacing`.

4. **Touch devices**: All hover effects are wrapped in `@media (hover: hover)` to avoid sticky hover states on touch.

5. **Active/selected row vs hover**: When hovering cells in `--row-active` or `--row-selected` rows, the row background is preserved. Only the hovered cell changes to the respective hover color (`--ui-table-tr-active-hover` or `--ui-table-tr-selected-hover`).

6. **RTL support**: Uses logical properties (`inline-start`, `block-end`) throughout for RTL compatibility.

7. **Sticky column offsets**: When using multiple sticky columns (`--c0 --c1`), you must provide cumulative offsets via CSS custom properties (`--c0: 0; --c1: 100px;`).

8. **Scroll shadow browser support**: The scroll-driven animation shadow only works in browsers supporting `animation-timeline: scroll()`.

9. **System colors**: Uses CSS system colors that adapt to light/dark mode automatically but may vary across browsers/OS.

10. **Wrapper border adjustment**: When `.--overflowing` is active, inner table borders are removed to prevent double borders with the wrapper.
