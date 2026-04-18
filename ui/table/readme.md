# @browser.style/table

A CSS-first styling system for native HTML `<table>` elements, with composable layout variants, interactive hover effects, zebra striping, row states, and a scrollable overflow wrapper with sticky header and columns. No JavaScript required for the base experience — an optional web component wrapper handles overflow detection and sticky-column offsets.

## Features

- Native `<table>` — accessible, screen-reader friendly, works without JS
- Composable layout variants: `rounded`, `split-cols`, `split-rows`, `block-border`, `th-dark`, `th-light`, `fixed`, `no-border`, `no-wrap`, three density sizes
- Zebra striping: rows *and* columns, even/odd
- 8 hover effects via separate `data-hover` attribute: `col`, `col-outline`, `td`, `td-outline`, `tr`, `tr-outline`, `th-outline`, `all`
- Row states: `data-row="active"` and `data-row="selected"` on `<tr>`
- Per-column text alignment via `data-c1`…`data-c8` (provided by `@browser.style/base`'s `core.css`)
- Overflow wrapper with sticky header, sticky columns, and scroll-driven shadow
- Light/dark mode via design tokens
- RTL support via logical properties throughout
- Touch-safe: hover effects wrapped in `@media (hover: hover)`
- Optional `<ui-table>` web component handles overflow detection and sticky-column offsets

---

## Install

```bash
npm install @browser.style/table
```

Peer dependency:

```bash
npm install @browser.style/base
```

> `@browser.style/base` provides the design token system (colors, spacing, radii, etc.) *and* the `data-c1`…`data-c8` column-alignment rules via `core.css`. The table works without it — tokens fall back to neutral defaults — but you'll want it for complete theming.

---

## Usage

### CSS-only (vanilla HTML)

Import the styles, then write native HTML. No JavaScript needed for variants, hover, row states, or zebra striping.

```html
<link rel="stylesheet" href="@browser.style/base/index.css">
<link rel="stylesheet" href="@browser.style/table/index.css">
```

Or via CSS `@import`:

```css
@import '@browser.style/base';
@import '@browser.style/table/style';
```

Add `data-variant` for layout variants and `data-hover` for hover effects:

```html
<table data-variant="rounded th-light" data-hover="tr td">
  <colgroup><col><col><col></colgroup>
  <thead>
    <tr><th>Name</th><th>Role</th><th>Location</th></tr>
  </thead>
  <tbody>
    <tr><td>Bruce Wayne</td><td>Batman</td><td>Gotham City</td></tr>
    <tr><td>Clark Kent</td><td>Superman</td><td>Metropolis</td></tr>
  </tbody>
</table>
```

> Column-based effects (`hover="col"`, `hover="col-outline"`, `zebracol-even`, `zebracol-odd`) require `<colgroup>` with `<col>` elements matching the column count.

---

### Web Component

Import the module to register `<ui-table>`:

```js
import '@browser.style/table';
```

```html
<ui-table variant="rounded split-cols th-dark" hover="col td">
  <table>
    <colgroup><col><col><col></colgroup>
    <thead>
      <tr><th>Name</th><th>Role</th><th>Location</th></tr>
    </thead>
    <tbody>
      <tr><td>Bruce Wayne</td><td>Batman</td><td>Gotham City</td></tr>
    </tbody>
  </table>
</ui-table>
```

`<ui-table>` is a light-DOM wrapper that forwards `variant`, `hover`, and `sticky` to the child `<table>` as `data-*` attributes. When `overflow` is set, a `ResizeObserver` toggles the `overflowing` attribute based on actual scroll width and writes cumulative widths for sticky columns as CSS custom properties (e.g. `style="--c0: 0px; --c2: 36px;"`).

#### Attributes

| Attribute | Type | Description |
|-----------|------|-------------|
| `variant` | string | Space-separated layout variants (forwarded as `data-variant`) |
| `hover` | string | Space-separated hover effects (forwarded as `data-hover`) |
| `overflow` | boolean | Enables scrollable wrapper with sticky header and auto overflow detection |
| `sticky` | string | Space-separated sticky column indices (e.g. `"c0 c2"`) — pins columns 1 and 3 |

---

### React

```jsx
import '@browser.style/table';
import '@browser.style/base';
import '@browser.style/table/style';

function DataTable() {
  return (
    <ui-table variant="rounded th-light" hover="tr">
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

> React 19+ handles custom elements natively. For React 18, custom element attributes work in JSX but you may need `ref` for setting properties.

---

### Vue

```vue
<script setup>
import '@browser.style/table';
import '@browser.style/base';
import '@browser.style/table/style';
</script>

<template>
  <ui-table variant="rounded th-light" hover="tr">
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

> Tell Vue to skip custom element resolution in `vite.config.js`:
> ```js
> vue({ template: { compilerOptions: { isCustomElement: tag => tag.startsWith('ui-') } } })
> ```

---

### Svelte

```svelte
<script>
  import '@browser.style/table';
  import '@browser.style/base';
  import '@browser.style/table/style';
</script>

<ui-table variant="rounded th-light" hover="tr">
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

Use the CSS-only approach — no JS needed for variants and hover:

```html
<link rel="stylesheet" href="@browser.style/base/index.css">
<link rel="stylesheet" href="@browser.style/table/index.css">

<table data-variant="rounded th-dark" data-hover="tr">
  <colgroup><col><col><col></colgroup>
  <thead><tr><th>A</th><th>B</th><th>C</th></tr></thead>
  <tbody><tr><td>1</td><td>2</td><td>3</td></tr></tbody>
</table>
```

Add the web component script only if you need the overflow wrapper with auto-detection:

```html
<script type="module">
  import '@browser.style/table';
</script>
```

---

## Variants

### Layout variants (`data-variant`)

Combine variants via space-separated values. They only override custom properties — never break the native table semantics.

| Variant | What it does |
|---------|-------------|
| `block-border` | Bottom borders only (horizontal-rule look) |
| `density-sm` | Compact: smaller font + tighter padding |
| `density-lg` | Spacious: larger font + roomier padding |
| `fixed` | `table-layout: fixed` — equal-width columns |
| `no-border` | Remove all cell borders |
| `no-wrap` | Prevent text wrapping in cells |
| `rounded` | Rounded corners on the table frame |
| `split-cols` | Visual gap between columns; each column reads as a separate card |
| `split-rows` | Visual gap between rows; each row reads as a separate card |
| `th-dark` | Dark header background (inverted text) |
| `th-light` | Tinted header background (subtle contrast) |
| `zebracol-even` | Stripe even columns (requires `<colgroup>`) |
| `zebracol-odd` | Stripe odd columns (requires `<colgroup>`) |
| `zebrarow-even` | Stripe even rows |
| `zebrarow-odd` | Stripe odd rows |

```html
<!-- Framed, striped, dense -->
<table data-variant="rounded th-dark zebrarow-odd density-sm">

<!-- Card-like columns with rounded ends -->
<table data-variant="split-cols rounded th-dark">
```

### Hover effects (`data-hover`)

All hover effects are wrapped in `@media (hover: hover)` so they don't stick on touch devices. Composable:

| Value | What it does |
|-------|-------------|
| `all` | Enables `col` + `td` + `tr` + `th-outline` simultaneously |
| `col` | Column background highlight (requires `<colgroup>`) |
| `col-outline` | Column outline on hover — incompatible with `split-cols`/`split-rows` |
| `td` | Cell fill on hover |
| `td-outline` | Cell outline on hover |
| `tr` | Row background highlight |
| `tr-outline` | Row outline on hover |
| `th-outline` | Header-cell outline on hover (signals sortable) |

```html
<table data-variant="rounded" data-hover="col td th-outline">
```

### Row states (`data-row`)

Applied directly to `<tr>` for persistent visual state:

```html
<tr data-row="active"><td>Active row (accent color)</td></tr>
<tr data-row="selected"><td>Selected row (highlight color)</td></tr>
```

Row states compose with hover: hovering an active/selected row shows a distinct hover color; hovering a cell in an active/selected row with `hover="td"` shows the state's "hover" variant.

### Per-column text alignment

Provided by `@browser.style/base`'s `core.css` — apply `data-c1`…`data-c8` to any `<table>`:

```html
<table data-c2="center" data-c4="end">
```

Values: `start` (default), `center`, `end`. Extend beyond 8 columns by copying the pattern from `core.css`.

### Overflow wrapper

Scrollable container with sticky header, optional sticky columns, and a scroll-driven shadow effect. Two modes:

**Web component (recommended — auto-detection):**

```html
<ui-table overflow sticky="c0 c2" variant="rounded th-light no-wrap" hover="tr">
  <table>
    <colgroup><col><col><col><col><col><col></colgroup>
    <thead>...</thead>
    <tbody>...</tbody>
  </table>
</ui-table>
```

`<ui-table>` does three things when `overflow` is set:
1. Observes its own size with `ResizeObserver` and toggles the `overflowing` attribute when the table is wider than the wrapper.
2. Walks the `sticky` attribute and writes cumulative widths as CSS custom properties on the host (e.g. `style="--c0: 0px; --c2: 36px;"`) — the third column pins at the right edge of the first (since the second column scrolls away).
3. Applies the wrapper styling (border, border-radius, sticky thead) only while actually overflowing.

**CSS-only:** the same CSS works on any element with `data-table-wrapper`. You set the `overflowing` attribute and `--cN` widths yourself:

```html
<div data-table-wrapper overflowing data-sticky="c0" style="--c0: 0; max-block-size: 400px;">
  <table data-variant="rounded" data-hover="tr">
    <colgroup>...</colgroup>
    ...
  </table>
</div>
```

Sticky columns use `data-sticky~="c0"`…`c8` (0-indexed: `c0` = 1st column). Values in the `--cN` custom properties should be the cumulative width of *sticky* columns only.

---

## Customization

### Design tokens

Override global tokens to theme all tables:

```css
:root {
  --color-border: #a8dadc;
  --color-surface-alt: #f1faee;
  --color-accent: #e63946;
}
```

### Component tokens

Override table-specific tokens for targeted changes:

```css
table[data-variant] {
  --ui-table-border-color: #e63946;
  --ui-table-border-width: 2px;
  --ui-table-padding: 1ch 1.5ch;
  --ui-table-zebra-bg: #fef7e0;
}
```

### All component tokens

| Token | Default | Description |
|-------|---------|-------------|
| `--ui-table-border-color` | `var(--color-border)` | Cell border color |
| `--ui-table-border-width` | `var(--border-width)` | Cell border width |
| `--ui-table-border-radius` | `0` | Corner radius (`rounded` sets `var(--radius-md)`) |
| `--ui-table-padding` | `.6ch 1.2ch` | Cell padding |
| `--ui-table-font-family` | `inherit` | Font family (`density-sm` sets `system-ui`) |
| `--ui-table-font-size` | `inherit` | Font size |
| `--ui-table-spacing-x` | `0` | Horizontal border-spacing (`split-cols` sets `2ch`) |
| `--ui-table-spacing-y` | `0` | Vertical border-spacing (`split-rows` sets `1.5ch`) |
| `--ui-table-cell-bg` | `inherit` | Cell background |
| `--ui-table-header-bg` | `inherit` | Header (`<th>`) background |
| `--ui-table-header-font-weight` | `var(--font-weight-semibold)` | Header font weight |
| `--ui-table-zebra-bg` | `var(--color-surface-alt)` | Zebra stripe background |
| `--ui-table-th-dark-bg` | `var(--color-button-text)` | Dark header background |
| `--ui-table-col-hover-bg` | `var(--color-button)` | Column hover background |
| `--ui-table-cell-hover-bg` | `var(--color-button-text)` | Cell hover fill color |
| `--ui-table-row-hover-bg` | `var(--color-button)` | Row hover background |
| `--ui-table-outline-color` | `var(--color-button-text)` | Outline hover color |
| `--ui-table-outline-width` | `var(--border-width-thick)` | Outline hover width |
| `--ui-table-active-bg` | `var(--color-accent)` | Active row background |
| `--ui-table-active-color` | `var(--color-accent-text)` | Active row text |
| `--ui-table-active-hover-bg` | `var(--color-accent-dark)` | Active row cell-hover background |
| `--ui-table-active-hover-color` | `var(--color-accent-text)` | Active row cell-hover text |
| `--ui-table-selected-bg` | `var(--color-highlight)` | Selected row background |
| `--ui-table-selected-color` | `var(--color-text)` | Selected row text |
| `--ui-table-selected-hover-bg` | `var(--color-accent)` | Selected row cell-hover background |
| `--ui-table-selected-hover-color` | `var(--color-accent-text)` | Selected row cell-hover text |

---

## Accessibility

- Built on native `<table>` semantics — screen readers announce structure, headers, and navigation automatically
- Hover effects are wrapped in `@media (hover: hover)` — no sticky states on touch devices
- Focus-visible styles on cells support keyboard navigation
- Row states (`data-row="active"` / `data-row="selected"`) are visual only — pair with `aria-selected="true"` when expressing programmatic selection to assistive tech

---

## Browser support

- All modern browsers (Chrome, Firefox, Safari, Edge)
- `:has()` selector (required for column/row hover): Chrome 105+, Firefox 121+, Safari 15.4+
- CSS nesting: Chrome 120+, Firefox 117+, Safari 16.5+
- `animation-timeline: scroll()` (scroll shadow on sticky header): Chrome 115+, degrades gracefully
- `ResizeObserver` (used by `<ui-table overflow>`): all modern browsers
- Column hover and sticky columns support up to 9 columns via explicit selectors (extend in the CSS if you need more)
