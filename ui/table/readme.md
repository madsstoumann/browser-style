# @browser.style/table

A CSS-first styling system for native HTML `<table>` elements, with composable layout variants, interactive hover effects, zebra striping, row states, and a scrollable overflow wrapper with sticky header and columns. No JavaScript required for the base experience — an optional web component wrapper handles overflow detection and sticky-column offsets.

## Features

- Native `<table>` — accessible, screen-reader friendly, works without JS
- Composable layout variants: `rounded`, `split-cols`, `split-rows`, `block-border`, `th-dark`, `th-light`, `fixed`, `no-border`, `no-wrap`
- Three density sizes via `data-size` (`sm`, default, `lg`) — matches the convention used by `<ui-avatar>`, `<ui-badge>`, etc.
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
| `size` | `sm` \| `lg` | Density — smaller or larger font/padding (forwarded as `data-size`) |
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
<table data-variant="rounded th-dark zebrarow-odd" data-size="sm">

<!-- Card-like columns with rounded ends -->
<table data-variant="split-cols rounded th-dark">
```

### Density (`data-size`)

Separate attribute, mirroring the convention used by `<ui-avatar>`, `<ui-badge>`, etc.

| Value | What it does |
|-------|-------------|
| `sm` | Compact: smaller font + tighter padding |
| (unset) | Default (medium) |
| `lg` | Spacious: larger font + roomier padding |

```html
<table data-size="sm">…</table>
<ui-table size="lg">…</ui-table>
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

Scrollable container with sticky header, optional sticky columns, and a scroll-driven shadow. How overflow is detected depends on which mode you use.

**CSS-only** — wrap the table in `<ui-table-wrapper>` (an un-registered custom element — just styled via CSS, no JS dependency). Two scroll-driven animations (`animation-timeline: scroll(self inline)` + `scroll(self block)`) detect overflow on either axis and toggle an internal `--_has-overflow` flag (0 or 1), which gates the wrapper frame and edge-border collapse via `calc()`:

```html
<ui-table-wrapper data-variant="rounded" data-sticky="c0 c2" style="--c0: 0; --c2: 101px;">
  <table data-variant="rounded no-wrap" data-hover="tr">
    <colgroup>...</colgroup>
    <thead>...</thead>
    <tbody>...</tbody>
  </table>
</ui-table-wrapper>
```

For sticky columns you measure the pin positions once in devtools and hard-code them as `--c0`, `--c1`, … `--c8`. Each value is the scroll-x offset at which that column should lock — effectively the cumulative width of sticky columns *before* it (non-sticky columns scroll away and don't contribute). In the snippet above, "First Name" renders at ~101px, so "Known As" pins at `--c2: 101px`.

**Web component** — `<ui-table overflow>` does the measuring for you. A `ResizeObserver` toggles the `overflowing` attribute when the table is wider than the wrapper, and walks the `sticky` attribute to write the correct `--cN` values on the host. This is also the fallback path on browsers without scroll-driven animations (Safari ≤ 18):

```html
<ui-table overflow sticky="c0 c2" variant="rounded th-light no-wrap" hover="tr">
  <table>
    <colgroup><col><col><col><col><col><col></colgroup>
    <thead>...</thead>
    <tbody>...</tbody>
  </table>
</ui-table>
```

The `overflowing` attribute and the `--_has-overflow` flag converge on the same styles, so both paths render identically — the only difference is who computes them.

Sticky columns are declared via `data-sticky~="c0"` … `c8` (0-indexed: `c0` = first column). Up to 9 columns via explicit selectors; extend in the CSS if you need more.

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

## Advanced: how the CSS-only overflow detection works

The wrapper needs two visual states: a plain scroll container when the table fits, and a framed container with collapsed edge borders when it overflows. CSS has no built-in selector for "is this element's content wider than its box," so we need a trick.

### Why `overflow: scroll` alone isn't enough

`overflow: auto` / `overflow: scroll` makes an element scrollable — it doesn't give CSS a way to *react* to the scrollable state. You can always scroll, but you can't write `@if-scrollable { border: … }`. Whatever styles you attach to the wrapper apply equally whether it's 1px or 10000px of content, with no distinction between "fits" and "overflows."

### Why `@container scroll-state()` doesn't solve it

`container-type: scroll-state` + `@container scroll-state(scrollable: inline)` is the semantically correct query — "is this container scrollable horizontally?" — but `@container` rules apply only to *descendants* of the container. You cannot style the container itself through `@container`. Since the wrapper frame (border, border-radius, edge-border collapse) lives on the container, scroll-state container queries are unusable for this case.

### The scroll-timeline trick

`animation-timeline: scroll()` binds an element's scroll position as an animation timeline, and — critically — it animates properties on the element *itself*, not just descendants. That's the escape hatch:

```css
@property --_has-overflow {
  syntax: '<number>';
  inherits: true;
  initial-value: 0;
}

@keyframes table-overflow-mark {
  from, to { --_has-overflow: 1; }
}

ui-table-wrapper {
  --_has-overflow: 0;                             /* baseline */
  animation: table-overflow-mark linear, table-overflow-mark linear;
  animation-timeline: scroll(self inline), scroll(self block);
}
```

Two animations, same keyframe, one per axis — so the flag flips when the element overflows on *either* inline or block. The key insight is how scroll timelines behave when there's nothing to scroll:

- **No scrollable overflow on that axis** → the timeline is *inactive*. Inactive timelines cause animations to produce no output: properties use their un-animated cascade values. If both axes are inactive, `--_has-overflow` stays at its declared `0`.
- **Scrollable overflow exists** → that timeline activates. Both keyframes set `--_has-overflow: 1`, so regardless of where the user is scrolled (0%, 50%, 100%), the value clamps to `1`. If only one axis overflows, only that animation is active — the other sits idle and doesn't reset the flag back to 0.

It's an overflow *presence* detector, not a scroll-progress animator. `@property` declares the type as `<number>` so `calc()` can use it:

```css
ui-table-wrapper {
  border-width: calc(var(--_has-overflow) * var(--border-width));
  border-radius: calc(var(--_has-overflow) * var(--ui-table-border-radius, 0));
}
ui-table-wrapper :is(td,th):first-of-type {
  border-inline-start-width: calc((1 - var(--_has-overflow)) * var(--ui-table-border-width));
}
```

When `--_has-overflow` is `0`, multiply-by-zero turns frame styles off; when `1`, they come on. The inverse `(1 - flag)` collapses the inner table's edge borders once the wrapper frame takes over, preventing double borders.

### JS fallback path

Safari ≤ 18 (and any browser without scroll-driven animations) fails the `@supports (animation-timeline: scroll())` guard. The `<ui-table overflow>` web component covers those: a `ResizeObserver` checks `scrollWidth > clientWidth` and toggles the `overflowing` attribute, which a separate rule converts to the same flag:

```css
ui-table-wrapper[overflowing] { --_has-overflow: 1; }
```

Both paths flip the same flag → the same `calc()`-gated styles render. The only difference is who flips it.

### `scroll(self <axis>)` specifics

- **`self`** — the element's own scroll position drives the timeline. Without `self`, `scroll()` defaults to the nearest ancestor scroll container, which isn't what we want here. The wrapper *is* the scrollable thing.
- **`inline` + `block` (two timelines)** — one detects horizontal overflow, the other vertical. We need both because the frame should activate whenever the wrapper is scrollable on *any* axis — a narrow-but-tall table scrolling vertically has just as much right to the "overflowing" framed look as a wide-but-short one scrolling horizontally.

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
