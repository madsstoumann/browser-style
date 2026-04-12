# @browser.style/table

A CSS-first table styling system with composable layout variants and interactive hover effects. No JavaScript required — an optional web component wrapper provides a declarative API for framework integration.

## Features

- Composable layout variants: `rounded`, `split-cols`, `split-rows`, `block-border`, `th-dark`, `th-light`, `fixed`, `no-border`, `no-wrap`, density sizes
- Zebra striping: rows and columns, even/odd
- 8 hover effects via separate `data-hover` attribute: `col`, `col-outline`, `td`, `td-outline`, `tr`, `tr-outline`, `th-outline`, `all`
- Row states: `data-row="active"` and `data-row="selected"` on `<tr>`
- Overflow wrapper with sticky header/columns and scroll-driven shadow
- Light/dark mode via design tokens
- RTL support with logical properties
- Touch-safe: hover effects wrapped in `@media (hover: hover)`

---

## Install

```bash
npm install @browser.style/table
```

Peer dependency:

```bash
npm install @browser.style/base
```

---

## Usage

### CSS-only (vanilla HTML)

```css
@import '@browser.style/base';
@import '@browser.style/table/style';
```

Add `data-variant` to the `<table>` for layout variants, and `data-hover` for hover effects:

```html
<table data-variant="rounded" data-hover="tr td">
  <colgroup><col><col><col></colgroup>
  <thead>
    <tr><th>Name</th><th>Role</th><th>Location</th></tr>
  </thead>
  <tbody>
    <tr><td>Bruce Wayne</td><td>Batman</td><td>Gotham</td></tr>
    <tr><td>Clark Kent</td><td>Superman</td><td>Metropolis</td></tr>
  </tbody>
</table>
```

> Column hover effects (`col`, `col-outline`) require `<colgroup>` with `<col>` elements matching the column count.

---

### Web Component

```js
import '@browser.style/table';
```

`<ui-table>` forwards `variant` and `hover` to the child `<table>` as `data-variant` and `data-hover`:

```html
<ui-table variant="rounded split-cols th-dark" hover="col td">
  <table>
    <colgroup><col><col><col></colgroup>
    <thead>
      <tr><th>Name</th><th>Role</th><th>Location</th></tr>
    </thead>
    <tbody>
      <tr><td>Bruce Wayne</td><td>Batman</td><td>Gotham</td></tr>
    </tbody>
  </table>
</ui-table>
```

#### Attributes

| Attribute | Type | Description |
|-----------|------|-------------|
| `variant` | string | Space-separated layout variants (forwarded as `data-variant`) |
| `hover` | string | Space-separated hover effects (forwarded as `data-hover`) |
| `overflow` | boolean | Enables scroll container with sticky header |

---

### React

```jsx
import '@browser.style/table';
import '@browser.style/table/style';

function DataTable() {
  return (
    <ui-table variant="rounded" hover="tr">
      <table>
        <colgroup><col /><col /><col /></colgroup>
        <thead><tr><th>Name</th><th>Role</th><th>City</th></tr></thead>
        <tbody>
          <tr><td>Bruce Wayne</td><td>Batman</td><td>Gotham</td></tr>
        </tbody>
      </table>
    </ui-table>
  );
}
```

---

### Vue

```vue
<script setup>
import '@browser.style/table';
import '@browser.style/table/style';
</script>

<template>
  <ui-table variant="rounded" hover="tr">
    <table>
      <colgroup><col /><col /><col /></colgroup>
      <thead><tr><th>Name</th><th>Role</th><th>City</th></tr></thead>
      <tbody>
        <tr><td>Bruce Wayne</td><td>Batman</td><td>Gotham</td></tr>
      </tbody>
    </table>
  </ui-table>
</template>
```

---

### Svelte

```svelte
<script>
  import '@browser.style/table';
  import '@browser.style/table/style';
</script>

<ui-table variant="rounded" hover="tr">
  <table>
    <colgroup><col><col><col></colgroup>
    <thead><tr><th>Name</th><th>Role</th><th>City</th></tr></thead>
    <tbody>
      <tr><td>Bruce Wayne</td><td>Batman</td><td>Gotham</td></tr>
    </tbody>
  </table>
</ui-table>
```

---

### Astro / Server-rendered HTML

```html
<link rel="stylesheet" href="@browser.style/base/index.css">
<link rel="stylesheet" href="@browser.style/table/index.css">

<table data-variant="rounded th-dark" data-hover="tr">
  <colgroup><col><col><col></colgroup>
  <thead><tr><th>A</th><th>B</th><th>C</th></tr></thead>
  <tbody><tr><td>1</td><td>2</td><td>3</td></tr></tbody>
</table>
```

---

## Layout Variants (`data-variant`)

| Variant | Description |
|---------|-------------|
| `block-border` | Bottom borders only |
| `density-sm` | Compact: smaller font and padding |
| `density-lg` | Spacious: larger font and padding |
| `fixed` | `table-layout: fixed` |
| `no-border` | Remove all borders |
| `no-wrap` | Prevent text wrapping in cells |
| `rounded` | Rounded corners on the table |
| `split-cols` | Horizontal spacing between columns |
| `split-rows` | Vertical spacing between rows |
| `th-dark` | Dark header background |
| `th-light` | Light/tinted header background |
| `zebracol-even` | Stripe even columns (requires `<colgroup>`) |
| `zebracol-odd` | Stripe odd columns (requires `<colgroup>`) |
| `zebrarow-even` | Stripe even rows |
| `zebrarow-odd` | Stripe odd rows |

Variants are composable:

```html
<table data-variant="rounded split-cols th-dark zebrarow-odd">
```

---

## Hover Effects (`data-hover`)

| Value | Description |
|-------|-------------|
| `all` | Enable col + td + tr + th-outline simultaneously |
| `col` | Column background highlight (requires `<colgroup>`) |
| `col-outline` | Column outline on hover |
| `td` | Cell fill on hover |
| `td-outline` | Cell outline on hover |
| `tr` | Row background highlight |
| `tr-outline` | Row outline on hover |
| `th-outline` | Header cell outline on hover |

Composable and touch-safe (`@media (hover: hover)`):

```html
<table data-variant="rounded" data-hover="col td th-outline">
```

---

## Row States (`data-row`)

Applied directly to `<tr>` elements:

```html
<tr data-row="active"><td>Active row</td></tr>
<tr data-row="selected"><td>Selected row</td></tr>
```

---

## Overflow Wrapper

For scrollable tables with sticky headers and columns:

```html
<ui-table overflow overflowing data-sticky="c0 c1" style="--c0: 0; --c1: 100px; max-height: 300px;">
  <table data-variant="rounded" data-hover="tr">
    <colgroup><col><col><col></colgroup>
    ...
  </table>
</ui-table>
```

Or CSS-only:

```html
<div data-table-wrapper overflowing data-sticky="c0" style="--c0: 0; max-height: 300px;">
  <table data-variant="rounded" data-hover="tr">...</table>
</div>
```

---

## Customization

### All component tokens

| Token | Default | Description |
|-------|---------|-------------|
| `--ui-table-border-color` | `var(--color-border)` | Border color |
| `--ui-table-border-width` | `var(--border-width)` | Border width |
| `--ui-table-border-radius` | `0` | Corner radius (`rounded` sets `--radius-md`) |
| `--ui-table-padding` | `.6ch 1.2ch` | Cell padding |
| `--ui-table-font-family` | `inherit` | Font family |
| `--ui-table-font-size` | `inherit` | Font size |
| `--ui-table-cell-bg` | `inherit` | Cell background |
| `--ui-table-header-bg` | `inherit` | Header background |
| `--ui-table-header-font-weight` | `var(--font-weight-semibold)` | Header font weight |
| `--ui-table-col-hover-bg` | `var(--color-button)` | Column hover background |
| `--ui-table-cell-hover-bg` | `var(--color-button-text)` | Cell hover fill color |
| `--ui-table-row-hover-bg` | `var(--color-button)` | Row hover background |
| `--ui-table-outline-color` | `var(--color-button-text)` | Outline hover color |
| `--ui-table-outline-width` | `var(--border-width-thick)` | Outline hover width |
| `--ui-table-zebra-bg` | `var(--color-surface-alt)` | Zebra stripe background |
| `--ui-table-th-dark-bg` | `var(--color-button-text)` | Dark header background |
| `--ui-table-active-bg` | `var(--color-accent)` | Active row background |
| `--ui-table-active-color` | `var(--color-accent-text)` | Active row text |
| `--ui-table-selected-bg` | `var(--color-highlight)` | Selected row background |
| `--ui-table-selected-color` | `var(--color-text)` | Selected row text |

---

## Accessibility

- Built on native `<table>` semantics — screen readers handle structure automatically
- Hover effects use `@media (hover: hover)` to avoid sticky states on touch devices
- Focus-visible styles on cells for keyboard navigation
- Row states (`data-row`) are visual only — add `aria-selected="true"` for programmatic selection

---

## Browser support

- All modern browsers (Chrome, Firefox, Safari, Edge)
- `:has()` selector: Chrome 105+, Firefox 121+, Safari 15.4+
- `animation-timeline: scroll()`: Chrome 115+ (scroll shadow degrades gracefully)
- Column hover limited to 9 columns via explicit CSS selectors
