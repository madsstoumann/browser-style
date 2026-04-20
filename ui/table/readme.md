# @browser.style/table

A CSS-first styling system for native HTML `<table>` elements, with composable layout variants, interactive hover effects, zebra striping, row states, and a scrollable overflow wrapper with sticky header and columns. No JavaScript required for the base experience — an optional web component wrapper handles overflow detection and sticky-column offsets.

## Features

- Native `<table>` — accessible, screen-reader friendly, works without JS
- Composable layout variants: `rounded`, `split-cols`, `split-rows`, `block-border`, `th-dark`, `th-light`, thead-divider family (`th-divide-lg/xl` widths, `th-dotted/dashed/double/groove/ridge` styles), cell-border style (`td-dotted`, `td-dashed`), `caption-bottom`, `fixed`, `no-border`, `no-wrap`
- Three density sizes via `data-size` (`sm`, default, `lg`)
- Zebra striping: rows *and* columns, even/odd
- 8 hover effects via separate `data-hover` attribute: `col`, `col-outline`, `td`, `td-outline`, `tr`, `tr-outline`, `th-outline`, `all`
- Row states: `data-row="active" | "selected"` plus semantic tints `"success" | "warning" | "error" | "info"` and `"group"` for section headers (composes, e.g. `"group info"`)
- Multi-row `<thead>` with `<th colspan>` / `<th rowspan>` — corner radii stay on the top row only, and the border doubling on row 2+'s first `<th>` is auto-resolved
- `<caption>` styled via `@browser.style/base`'s global reset; `<tfoot>` rows get thicker top border + semibold text
- Per-column text alignment via `data-c1`…`data-c8` — works on any `<table>`
- Tabular figures per column via the same attribute (`data-c3="end tabular"`) — `font-variant-numeric: tabular-nums`
- Overflow wrapper with sticky header, sticky columns, sticky **group headers** (iOS contact-list displacement), scroll-end shadow on the inline axis, and scroll-driven shadow on the sticky thead
- Inner focus surfaces on the wrapper via `:focus-within` — one consolidated ring, not per-cell
- Light/dark mode via design tokens (`contrast-color()` handles foreground text)
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

> `@browser.style/base` provides the design token system (colors, spacing, radii, etc.). The table works without it — tokens fall back to neutral defaults — but you'll want it for complete theming.

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

`<ui-table>` is a light-DOM wrapper. JS behaviour gates on two opt-in attributes: `mount` (forwarding only) and `frame` (framed visuals + forwarding + `ResizeObserver` for Safari ≤ 18 fallback and sticky-offset computation). Bare `<ui-table>` (neither attribute) is inert — a CSS-only scroll container — even when this module is imported.

#### Attributes

| Attribute | Type | Description |
|-----------|------|-------------|
| `mount` | boolean | Activates JS attribute forwarding only. No visual change. Use for framework reactivity on visually plain tables. |
| `frame` | boolean | Framed scroll-container mode — border, rounded corners, sticky thead + group rows, sticky columns, focus-ring surfacing, opaque cell bg. Implies `mount` plus `ResizeObserver`-driven overflow detection and sticky-offset computation. |
| `variant` | string | Forwarded as `data-variant` on both `<ui-table>` and child `<table>`. Requires `mount` or `frame`. |
| `hover` | string | Space-separated hover effects (forwarded as `data-hover`). Requires `mount` or `frame`. |
| `size` | `sm` \| `lg` | Density (forwarded as `data-size`). Requires `mount` or `frame`. |
| `tint` | string | Graduated-tint start color (forwarded as `data-tint`). Pair with `tinted` on `<tbody>`/`<colgroup>`. Requires `mount` or `frame`. |
| `tint-end` | string | Graduated-tint end color (default white). Requires `mount` or `frame`. |
| `tint-tr` / `tint-bl` | string | 2D-tint top-right / bottom-left corner colors. Requires `mount` or `frame`. |
| `tint-axis` | `vertical` \| `horizontal` \| `2d` | Places `tinted` on the right grandchild: first `<tbody>` for vertical/2d, first `<colgroup>` for horizontal. Idempotent across axis changes (clears the old target before setting the new). Horizontal paints through `<col>` backgrounds, which requires transparent cells — pair it with `mount`, not `frame` (frame forces opaque cell bg for sticky integrity). CSS-only authors can set `tinted` directly on `<tbody>`/`<colgroup>` instead. Requires `mount` or `frame`. |
| `c1` … `c8` | string | Per-column formatting — `start`/`center`/`end` for text alignment, or `tabular` for `font-variant-numeric: tabular-nums`. Composable: `c3="end tabular"`. Requires `mount` or `frame`. |
| `sticky` | string | Space-separated sticky column indices (e.g. `"c0 c2"`). Requires `frame`. |

On initial mount the component respects any `data-*` already set on the child `<table>` — author's direct markup wins. Later changes to attributes on `<ui-table>` (via `setAttribute` / framework reactivity) do overwrite.

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
| `caption-bottom` | Renders `<caption>` below the table (`caption-side: bottom`) |
| `fixed` | `table-layout: fixed` — equal-width columns |
| `no-border` | Remove all cell borders |
| `no-wrap` | Prevent text wrapping in cells |
| `rounded` | Rounded corners on the table frame |
| `split-cols` | Visual gap between columns; each column reads as a separate card |
| `split-rows` | Visual gap between rows; each row reads as a separate card |
| `th-dark` | Dark header background (inverted text) |
| `th-light` | Tinted header background (subtle contrast) |
| `th-divide-lg` | Thead/tbody divider, thick solid (width opt-in; default style + color) |
| `th-divide-xl` | Thead/tbody divider, xl solid |
| `th-dotted` | Thead/tbody divider, dotted (default thick width) |
| `th-dashed` | Thead/tbody divider, dashed (default thick width) |
| `th-double` | Thead/tbody divider, double-line (auto-forces xl width — CSS `double` needs ≥3px) |
| `th-groove` | Thead/tbody divider, groove 3D style (auto-forces 6px width for visible 3D effect) |
| `th-ridge` | Thead/tbody divider, ridge 3D style (auto-forces 6px width for visible 3D effect) |
| `td-dotted` | Dotted style on every cell border |
| `td-dashed` | Dashed style on every cell border |
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

Separate attribute for density.

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
<tr data-row="success"><td>Tinted green (uses --color-success)</td></tr>
<tr data-row="warning"><td>Tinted amber (uses --color-warning)</td></tr>
<tr data-row="error"><td>Tinted red (uses --color-error)</td></tr>
<tr data-row="info"><td>Tinted blue (uses --color-info)</td></tr>
<tr data-row="group"><td colspan="4">Section heading</td></tr>
<tr data-row="group info"><td colspan="4">Tinted section heading</td></tr>
```

`active`/`selected` apply solid accent/highlight colors. The semantic tints (`success`/`warning`/`error`/`info`) use `light-dark()`: in light mode they're a soft 15% `color-mix` tint over white; in dark mode they use the muted status color directly (the dark-mode variants of `--color-success` etc. already work well as backgrounds). `contrast-color()` picks a readable text color in both modes. `group` turns a `<tr>` into a section divider: pair a single `<td colspan="N">` with `data-row="group"` for a semibold, `--color-surface-alt`-tinted heading inside a `<tbody>`. Values are space-separated and compose — `data-row="group info"` gives you a semibold section heading tinted with the info color.

**Sticky group headers** — inside the overflow wrapper, `data-row~="group"` rows are also `position: sticky` and displace each other on vertical scroll (iOS contact-list pattern: each new section pushes the previous one out as you scroll past). The pin offset is driven by `--ui-table-group-offset`; the web component measures the actual thead height on mount/resize and writes it on the host. CSS-only users get a `33.6px` fallback (roughly one thead row at default density) and can override inline when their thead is taller.

Row states compose with hover: hovering an active/selected row shows a distinct hover color; hovering a cell in an active/selected row with `hover="td"` shows the state's "hover" variant.

### Per-column text alignment & tabular figures

Apply `data-c1`…`data-c8` to any `<table>`:

```html
<table data-c2="center" data-c3="end tabular" data-c4="end">
```

Values: `start` (default), `center`, `end`, `tabular`. They compose — `end tabular` right-aligns the column *and* uses monospaced digit widths (`font-variant-numeric: tabular-nums`), so figures line up vertically. Extend beyond 8 columns by copying the pattern in `ui-table.css`.

### Caption & footer

Native `<caption>` and `<tfoot>` both work out of the box:

```html
<table data-variant>
  <caption>Orders — October 2026</caption>
  <thead>…</thead>
  <tbody>…</tbody>
  <tfoot>
    <tr><td colspan="3">Total</td><td>$2,060.50</td></tr>
  </tfoot>
</table>
```

`<caption>` inherits the global reset (italic, smaller, `margin-block: 1rlh`). Flip it below the table with `data-variant="caption-bottom"`. `<tfoot>` rows get a thicker top border (`--border-width-thick`) and `font-weight: semibold` — ideal for totals and summary rows.

> **Known limitation with `<tfoot>`:** the base rule that draws the bottom border on `tr:last-of-type td` fires once per parent, so both `<tbody>`'s last row *and* `<tfoot>`'s last row currently get a bottom border. This is visually OK in practice (both borders collapse onto the same pixel line in most cases) and the current behavior is preserved by design. If you need strict single-border behavior, switch to a structural selector such as `table > tfoot > tr:last-of-type td, table:not(:has(tfoot)) > tbody > tr:last-of-type td`.

### Multi-row headers (`<th colspan>` / `<th rowspan>`)

Grouped column headers work with normal HTML — the CSS handles the edge cases automatically:

```html
<table data-variant="rounded th-light th-divide-lg">
  <thead>
    <tr>
      <th rowspan="2">Hero</th>
      <th colspan="2">Identity</th>
      <th colspan="2">First Appearance</th>
    </tr>
    <tr>
      <th>Real Name</th>
      <th>Location</th>
      <th>Publisher</th>
      <th>Year</th>
    </tr>
  </thead>
  <tbody>…</tbody>
</table>
```

Two things the CSS handles for you on row 2+ of the thead:
1. **Border radii are reset** so only the topmost header row contributes to the table's rounded corners.
2. **The inline-start border on the first `<th>` of row 2+ is zeroed** — it's never at the visual left edge (a `rowspan` from row 1 covers it), so without the reset it would sit adjacent to the rowspan cell's inline-end border and produce a 2px double line.

> **Caveat**: the border-reset assumes that in a multi-row thead, the first `<th>` of each non-top row is always covered by a `rowspan` from above (the normal grouped-header pattern). If you build a multi-row thead where row 2 genuinely starts at the table's left edge (no rowspan above), you'd need to re-add `border-inline-start-width: var(--ui-table-border-width)` on that cell.

### Overflow wrapper

`<ui-table>` has two modes:

- **Bare** (`<ui-table>`) — passive scroll container. `display: block; overflow: auto` plus a styled scrollbar. Scrollbars only appear when the inner table overflows. No border, no sticky thead, no cell-background override. Use this for wide tables that should scroll horizontally on narrow viewports without any other visual change.

  ```html
  <ui-table>
    <table data-variant="no-border">
      <colgroup><col><col><col><col><col><col><col><col></colgroup>
      ...
    </table>
  </ui-table>
  ```

- **Framed** (`<ui-table frame>`) — full iOS-style framed scroll container. Adds border (appears only when actually overflowing), rounded corners, scroll-driven overflow detection via `animation-timeline: scroll()`, sticky `<thead>`, sticky group rows, opt-in sticky columns via `sticky`, and focus-ring surfacing on the wrapper.

  ```html
  <ui-table frame data-variant="rounded" sticky="c0 c2" style="--c0: 0; --c2: 101px;">
    <table data-variant="rounded no-wrap" data-hover="tr">
      <colgroup>...</colgroup>
      <thead>...</thead>
      <tbody>...</tbody>
    </table>
  </ui-table>
  ```

  For sticky columns, measure pin positions once in devtools and hard-code them as `--c0`, `--c1`, … `--c8`. Each value is the scroll-x offset at which that column should lock — effectively the cumulative width of sticky columns *before* it (non-sticky columns scroll away and don't contribute).

**Web component path** — import `index.js` to register `<ui-table>`. With `mount` or `frame`, attributes on `<ui-table>` (`variant`, `hover`, `size`, and the tint / per-column family) are forwarded to the child `<table>` as `data-*`. `sticky` stays a plain attribute on the wrapper — CSS reads it directly. With `frame`, a `ResizeObserver` additionally toggles the `overflowing` attribute (Safari ≤ 18 fallback for browsers without scroll-driven animations) and walks the `sticky` attribute to write the correct `--cN` values on the host — so framework code can bind to the wrapper directly without computing offsets:

```html
<ui-table frame sticky="c0 c2" variant="rounded th-light no-wrap" hover="tr">
  <table>
    <colgroup><col><col><col><col><col><col></colgroup>
    <thead>...</thead>
    <tbody>...</tbody>
  </table>
</ui-table>
```

The `overflowing` attribute and the `--_has-overflow` flag converge on the same styles, so both paths render identically — the only difference is who computes them.

Sticky columns are declared via `sticky~="c0"` … `c8` (0-indexed: `c0` = first column). Up to 9 columns via explicit selectors; extend in the CSS if you need more.

**What else the wrapper does:**

- **Scroll-end shadow on the inline axis** — a scroll-driven `box-shadow` on the wrapper's inline-end edge. It's visible whenever there's horizontal content to the right, and fades out as you reach the end. Signals "more this way". Counterpart to the sticky-thead bottom shadow that appears when vertical scroll is possible.
- **Focus ring surfacing** — `&:focus-within { outline: var(--ring-width) solid var(--ring-color); outline-offset: var(--ring-offset); }`. When any cell inside receives focus (keyboard or click), the wrapper itself gets the ring — and the inner cell's default ring is suppressed. One consolidated indicator, matching iOS/macOS scroll-container behavior. Uses `--ring-*` tokens from `@browser.style/base`.
- **Sticky group headers** — `<tr data-row~="group">` inside the wrapper is `position: sticky` and displaces each other on vertical scroll. Offset is `var(--ui-table-group-offset, 33.6px)` — the web component measures `thead.offsetHeight` and writes the var on the host; CSS-only users get the 33.6px fallback (one thead row at default density) and can override inline for taller theads.

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
| `--ui-table-group-offset` | `33.6px` | Sticky offset for `data-row="group"` rows inside the overflow wrapper (distance below the sticky thead) |

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

ui-table[frame] {
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
ui-table[frame] {
  border-width: calc(var(--_has-overflow) * var(--border-width));
  border-radius: calc(var(--_has-overflow) * var(--ui-table-border-radius, 0));
}
ui-table[frame] :is(td,th):first-of-type {
  border-inline-start-width: calc((1 - var(--_has-overflow)) * var(--ui-table-border-width));
}
```

When `--_has-overflow` is `0`, multiply-by-zero turns frame styles off; when `1`, they come on. The inverse `(1 - flag)` collapses the inner table's edge borders once the wrapper frame takes over, preventing double borders.

### JS fallback path

Safari ≤ 18 (and any browser without scroll-driven animations) fails the `@supports (animation-timeline: scroll())` guard. Importing `index.js` covers those: for `<ui-table frame>`, the registered component uses a `ResizeObserver` to check `scrollWidth > clientWidth` and toggles the `overflowing` attribute, which a separate rule converts to the same flag:

```css
ui-table[frame][overflowing] { --_has-overflow: 1; }
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
- `ResizeObserver` (used by the registered `<ui-table>` web component): all modern browsers
- Column hover and sticky columns support up to 9 columns via explicit selectors (extend in the CSS if you need more)
