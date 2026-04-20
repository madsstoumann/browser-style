# ui-table — Internal Architecture (v4)

CSS-first styling for native `<table>` elements. An optional `<ui-table>` light-DOM wrapper adds overflow detection and dynamic sticky-column offsets — everything else is CSS.

## Root selector

```css
:where(table:is([data-variant], [data-hover], [data-size]))
```

Any `<table>` that opts in via `data-variant`, `data-hover`, or `data-size`. `:where()` keeps specificity at 0. Layout variants and hover modifiers nest under this root as `&[data-variant~="…"]` / `&[data-hover~="…"]` — avoids repeating `table[…]` on every rule.

The wrapper `<ui-table>` has two modes, selected by whether the `frame` attribute is present:

```css
:where(ui-table)         /* bare: passive scroll container */
:where(ui-table[frame])  /* framed: sticky thead + columns + border frame */
```

**Bare** (`<ui-table>`) is a pure scroll container — `display: block; overflow: auto` and a styled scrollbar. Scrollbars appear only when the inner `<table>` overflows. No border, no sticky thead, no `--ui-table-cell-bg` override, so `<col>`-based features (zebracol, col hover, colgroup tint) keep working. Use this to let wide tables scroll horizontally on narrow viewports without any other visual change.

**Framed** (`<ui-table frame>`) adds the full treatment: a border frame gated by `--_has-overflow` (appears only when actually overflowing), rounded corners, scroll-driven overflow detection, sticky `<thead>`, sticky group rows (`<tr data-row="group">`), sticky columns via `data-sticky`, opaque cell backgrounds (so sticky cells don't bleed through during scroll), focus-ring surfacing on the wrapper. Use for data tables that benefit from a framed, iOS-style scroll container.

Independently, `<ui-table>` works in two JS modes:

- **CSS-only** (no JS imported): `<ui-table>` is an unregistered custom element — just a tag with a hyphen, valid HTML, styled purely via CSS. Author writes `data-variant` on the inner `<table>` and (in frame mode) hard-codes sticky offsets (`style="--c0: 0; --c2: 101px"`). Scroll-driven animations handle overflow detection.
- **Registered web component** (JS imported): `customElements.define('ui-table', UiTable)` upgrades the element. Attributes on `<ui-table>` (`variant`, `hover`, `size`, `sticky`) are forwarded to the child `<table>` as `data-*`. When `frame` is set, a `ResizeObserver` auto-computes sticky column offsets and toggles an `[overflowing]` attribute as a Safari ≤ 18 fallback for browsers without `animation-timeline` support.

## Attribute surface

| Attribute | Where | Purpose |
|-----------|-------|---------|
| `data-variant` | table | Space-separated layout tokens (`rounded`, `split-cols`, `split-rows`, `th-dark`, `th-light`, thead-divider family (width: `th-divide-lg/xl`; style: `th-dotted/dashed/double/groove/ridge`), `caption-bottom`, `fixed`, `block-border`, `no-border`, `no-wrap`, zebra variants) |
| `data-hover` | table | Space-separated hover effects (`col`, `col-outline`, `td`, `tr`, `all`, …) |
| `data-size` | table | Density: `sm` / `lg` (no value = medium). Separate from `data-variant` so density composes orthogonally with layout tokens. |
| `data-row` | `<tr>` | Space-separated list of states — selector uses `~=` so values compose. `active` / `selected` apply solid accent/highlight; `success` / `warning` / `error` / `info` apply a tint (see *Status tints* below); `group` turns the row into a section heading (semibold + `--color-surface-alt` tint) and pairs naturally with a single `<td colspan="N">`. Tint rules are ordered after `group` in the CSS, so e.g. `data-row="group info"` gives a semibold section heading with the info tint. When inside the overflow wrapper, `group` rows are also `position: sticky` and displace each other on vertical scroll (iOS contact-list pattern). |
| `data-c1`…`data-c8` | table | Per-column formatting — composable values: `start` / `center` / `end` (text alignment) + `tabular` (`font-variant-numeric: tabular-nums`). Defined in a top-level `:where(table) { … }` block so it works on any `<table>`, not just tables that opt into this component. |
| `<ui-table>` | wrapper | Passive scroll container (`display: block; overflow: auto` + styled scrollbar). No other visual change. |
| `<ui-table frame>` | wrapper | Framed scroll container: adds border (gated by `--_has-overflow`), radius, sticky `<thead>` + group rows, opaque cell bg, focus-ring surfacing. Enables `data-sticky` and the scroll-driven overflow detection. |
| `data-sticky` | wrapper | Sticky column indices (e.g. `c0 c2`, 0-indexed) on `<ui-table frame>`. No-op in bare mode. |

## Column hover via `:has()` + `<colgroup>`

`data-hover~="col"` highlights an entire column on cell hover by enumerating nth-child slots:

```css
&:has(:is(td,th):nth-child(N):is(:focus-visible,:hover)) col:nth-child(N) {
  background-color: var(--ui-table-col-hover-bg);
}
```

The browser paints the `<col>` background through to every cell in that column. Limited to 9 columns (N = 1..9); extend if needed. `col-outline` uses the same `:has()` technique on `::after` pseudo-elements with transparent-then-visible borders.

## Zebra cols vs zebra rows — different mechanisms

Not unifiable:

- **`zebracol-*`**: sets `background-color` directly on `<col>`. Works because cells have `background: inherit` from a transparent `<tr>`, so the col background paints through.
- **`zebrarow-*`**: sets `--ui-table-cell-bg` on `<td>`. Cell's own `background: var(--ui-table-cell-bg, inherit)` reads it.

The col custom-property approach doesn't cascade to cells (different subtrees) — that's why an earlier draft of setting `--ui-table-cell-bg` on `<col>` silently failed.

## Overflow wrapper: dual-path detection

Two independent mechanisms converge on the same `--_has-overflow` custom property (0 or 1), typed via `@property`, which gates the wrapper frame and edge-border collapse via `calc()`.

### CSS-only path

```css
@supports (animation-timeline: scroll()) {
  animation: table-overflow-mark linear, table-overflow-mark linear;
  animation-timeline: scroll(self inline), scroll(self block);
}
```

Two scroll-driven animations, same keyframe, one per axis. When either timeline has scrollable content, that animation activates and the keyframe (`from, to { --_has-overflow: 1 }`) clamps the value to 1 regardless of scroll position. When neither axis overflows, both timelines are inactive, the animations produce no output, and `--_has-overflow` keeps its un-animated value of 0. Detects *presence* of overflow on either axis, not scroll progress.

### JS fallback (registered `<ui-table>`)

When `index.js` is imported and the element upgrades, a `ResizeObserver` toggles `[overflowing]` based on `scrollWidth > clientWidth`. A CSS rule `&[overflowing] { --_has-overflow: 1 }` flips the same flag. Needed for Safari ≤ 18 and any browser without scroll-driven animations.

### Why not `@container scroll-state()`

`container-type: scroll-state` is the semantically correct tool for "is this container scrollable," but `@container` rules target *descendants* of the container — you cannot style the container itself. The wrapper frame (border, radius, edge-collapse) lives on the container, so `@container` is unusable here. `animation-timeline: scroll()` is the escape hatch: it animates properties on the element itself.

## Sticky columns

Author declares them via `data-sticky="c0 c2"` on the wrapper (0-indexed). CSS enumerates for c0..c8:

```css
&[data-sticky~="c0"] :is(td,th):nth-of-type(1) { --_iis: var(--c0); }
&[data-sticky~="c0"] :is(td,th):nth-of-type(1), … {
  inset-inline-start: var(--_iis);
  position: sticky;
  z-index: var(--z-index-1);
}
```

Pin positions (`--c0`, `--c2`, …) are up to the caller:

- **CSS-only**: hard-coded on the wrapper (`style="--c0: 0; --c2: 101px;"`). Each `--cN` is the cumulative width of sticky columns *before* it — non-sticky columns scroll away and don't contribute. Measure once in devtools.
- **Web component**: JS reads `cell.offsetWidth` for each sticky `<th>` and writes the values on the host.

Sticky thead and columns apply always — they're no-ops when the wrapper isn't actually scrollable.

## `<caption>` and `<tfoot>`

- **`<caption>`** is styled by `@browser.style/base`'s `core.css` reset (italic, smaller, `margin-block: 1rlh`). No per-component rules needed; works out of the box. Flip position with inline `caption-side: bottom`.
- **`<tfoot>`** rows get `border-block-start-width: var(--border-width-thick)` and `font-weight: semibold` (via the component token `--ui-table-border-width-thick`). Note: the `tr:last-of-type td` rule that draws the bottom border fires once per parent, so `<tbody>`'s last row *and* `<tfoot>`'s last row both currently get a bottom border. Left as-is because the lines visually collapse onto the same edge and the change is invasive. Strict fix if ever needed: `table > tfoot > tr:last-of-type td, table:not(:has(tfoot)) > tbody > tr:last-of-type td`.

## Section / group header rows

Supported via `data-row~="group"` on a `<tr>` containing a single `<td colspan="N">`. Gets `--ui-table-cell-bg: var(--color-surface-alt)` and semibold font-weight. Composes with status variants (`data-row="group info"` etc.) because the status rules are ordered *after* `group` in the CSS and write the same `--ui-table-cell-bg`, overriding the default surface-alt with the tint.

**Sticky group displacement (inside the overflow wrapper):** group rows are `position: sticky; inset-block-start: var(--ui-table-group-offset, 33.6px)` with `z-index: calc(var(--z-index-1) - 1)` (one below the sticky thead). CSS sticky's native behavior handles the displacement — when a second group row scrolls up to meet the first at the threshold, it pushes the first out of view. The 33.6px default matches the default thead height; override per-table via the custom property for different densities.

## Status tints

The four semantic variants (`success`/`warning`/`error`/`info`) use a shared rule with a private `--_tc` variable to stay compact:

```css
& tr:is([data-row~="success"], [data-row~="warning"], [data-row~="error"], [data-row~="info"]) {
  --ui-table-cell-bg: light-dark(color-mix(in oklab, var(--_tc) 15%, #FFF), var(--_tc));
  color: contrast-color(var(--ui-table-cell-bg));
}
& tr[data-row~="success"] { --_tc: var(--color-success); }
/* …warning/error/info */
```

- **Light mode** mixes 15% of the semantic color with white for a soft tinted background
- **Dark mode** uses the color directly — the muted dark-mode variants of `--color-success` etc. already work well as backgrounds, so no mixing needed (and mixing with a near-black surface just looked near-black)
- **Text color** is resolved by `contrast-color()`, which picks black or white based on contrast with the resolved background — no per-variant `color` declaration needed


## Hover routing via private vars

Each row variant publishes two private vars — `--_rb` (bg on tr-hover) and `--_hb` (bg on td-hover) — alongside its base state. The entire `@media (hover: hover)` fill section is two rules that read them:

```css
/* Defaults on the table; variants overwrite what they need */
--_rb: var(--ui-table-row-hover-bg);
--_hb: var(--ui-table-cell-hover-bg);

/* Variant example */
& tr[data-row~="active"] {
  --ui-table-cell-bg: var(--ui-table-active-bg);
  color: var(--ui-table-active-color);
  --_rb: var(--ui-table-active-bg);        /* tr-hover bg */
  --_hb: var(--ui-table-active-hover-bg);  /* td-hover bg */
}

/* Hover block */
@media (hover: hover) {
  &:is([data-hover~="all"], [data-hover~="td"]) td:is(:focus-visible,:hover) {
    --ui-table-cell-bg: var(--_hb);
    color: contrast-color(var(--ui-table-cell-bg));
    outline: 0;
  }
  &:is([data-hover~="all"], [data-hover~="tr"]) tr:has(td:is(:focus-visible,:hover)) {
    --ui-table-cell-bg: var(--_rb);
    color: contrast-color(var(--ui-table-cell-bg));
  }
}
```

### Why only two vars per variant (not five)

**Text color is derived, not stored.** `color: contrast-color(var(--ui-table-cell-bg))` picks black or white based on the just-applied bg — no per-variant `--_rc`/`--_hc` needed. Works uniformly for plain, active, selected, status, and tinted rows.

**Border-color stays put on hover.** The old "border merges with hover bg" flip caused a color jump on tinted tables (whose static border is tint-blended, not gray). Removing the flip fixes that visually and drops `--_hd` entirely.

### Why `--_tm` is registered as `<color>`

Tinted rows compute their ramp via `sibling-index()`, which must evaluate *in the element where the formula is authored* — `<tr>` for vertical tint (row index), `<td>` for horizontal tint (column index). Without `@property syntax: '<color>'`, substitution is lazy and `var(--_tm)` read on a different element would re-run `sibling-index()` in the wrong context.

Registering `--_tm` forces eager evaluation. Its downstream derivations `--_rb` and `--_hb` just reference `var(--_tm)` — they inherit a concrete color and don't need their own registration.

### What this replaces

Ten previous variant-specific hover rules (plain, active, selected, status, vertical-tinted × td + tr, plus horizontal-tinted td) collapse to two. Public tokens (`--ui-table-active-hover-bg`, etc.) are unchanged — variants route them through `--_rb`/`--_hb`.


## Focus ring

The framed wrapper surfaces its inner focus state on itself:

```css
:where(ui-table[frame]) {
  &:focus-within {
    outline: var(--ring-width) solid var(--ring-color);
    outline-offset: var(--ring-offset);
  }
  & :focus-within { outline: 0; }
}
```

`:focus-within` (not `:has(:focus-visible)`) because we want the ring regardless of how the user got there. The inner `:focus-within { outline: 0 }` suppresses per-cell focus rings so only the container ring shows. Tokens come from `@browser.style/base`'s `--ring-*` set.

## Multi-row thead

Two corrections make `<th colspan>` / `<th rowspan>` headers render cleanly:

```css
& thead tr:not(:first-of-type) th {
  &:first-of-type {
    border-inline-start-width: 0;   /* row 2+'s first th is never at the left edge */
    border-start-start-radius: 0;   /* only topmost row should round */
  }
  &:last-of-type { border-start-end-radius: 0; }
}
```

- **Corner reset**: `& th { &:first-of-type { border-start-start-radius: … } }` applies to every thead row by default. For multi-row headers we zero the radius on row 2+ so only the topmost row gets the table-top corners.
- **Inline-start border reset**: the base rule adds a left border to every `tr`'s first `<th>`. In row 2+ of a typical grouped header, that first `<th>` is never at the visual left edge (a `rowspan` from row 1 covers it), so its left border would sit adjacent to the rowspan cell's right border, producing a 2px double line. Resetting `border-inline-start-width: 0` gives the expected single line.

**Caveat**: this reset assumes the first `<th>` of row 2+ is always covered on the left by a `rowspan` from row 1. If you build a multi-row thead where row 2 genuinely starts at the table's left edge (no rowspan above), that cell needs `border-inline-start-width` restored — not the typical grouped-header pattern, so left as an edge case.

## Thead-divider variant family

A family of variants that paint a stronger border between `<thead>` and the first `<tbody>` row — Bootstrap's `.table-group-divider` concept, expanded into two *independent axes* that compose: **width** and **style**. Any variant activates the border; unset axes fall back to thick / solid.

| Variant | Sets |
|---|---|
| `th-divide-lg` | `--_dw: var(--border-width-thick)` |
| `th-divide-xl` | `--_dw: calc(var(--border-width-thick) * 2)` (4px) |
| `th-dotted` | `--_ds: dotted` |
| `th-dashed` | `--_ds: dashed` |
| `th-double` | `--_ds: double` + auto-forces `--_dw` to 4px (CSS `double` needs ≥3px) |
| `th-groove` | `--_ds: groove` + auto-forces `--_dw` to 6px (`calc(heavy * 2)`, minimum for visible 3D) |
| `th-ridge` | `--_ds: ridge` + auto-forces `--_dw` to 6px |

### Activator / implementation pattern

One `:is(…)` union selector catches *any* of the family variants and paints the border. Private tokens (`--_dw`, `--_ds`) hold the values; each variant is a one-liner:

```css
&:is(
  [data-variant~="th-divide-lg"], [data-variant~="th-divide-xl"],
  [data-variant~="th-dotted"], [data-variant~="th-dashed"], [data-variant~="th-double"],
  [data-variant~="th-groove"], [data-variant~="th-ridge"]
) tbody > tr:first-of-type :is(td, th) {
  border-block-start-style: var(--_ds, solid);
  border-block-start-width: var(--_dw, var(--border-width-thick));
}
&[data-variant~="th-divide-lg"] { --_dw: var(--border-width-thick); }
&[data-variant~="th-dashed"]    { --_ds: dashed; }
/* …etc */
```

### Composition rules

- **Width × style are orthogonal.** `th-divide-xl th-dashed` → xl width, dashed style.
- **`th-double` forces its own width** because CSS `double` needs ≥3px to render two lines. Placing the rule *after* `th-divide-lg/xl` in source order means `th-double` wins when both are set — intentional.
- **`th-groove` / `th-ridge` force 6px width** (`calc(var(--border-width-heavy) * 2)`) because the 3D effect is not perceptible at thinner widths. Same override-on-source-order behavior as `th-double`.
- **No defaults activate the border.** Unlike tokens with an always-on fallback, the activator only matches if at least one family variant is present — so opting in is explicit.

### Extending the family

Adding a new style is one line + one entry in the activator. Candidates:
- `th-inset` / `th-outset` — CSS 3D style variants
- Semantic color variants (`th-warning`, `th-success`) — would need to reintroduce a `--_dc` axis with `border-block-start-color: var(--_dc, var(--color-border))` in the activator block

## Scroll-end shadow

Third scroll-driven animation on the overflow wrapper (alongside the two `--_has-overflow` markers): `table-scroll-shadow-end` paints an inset `box-shadow` on the inline-end edge that *fades out* as you scroll to the far right — indicates "more content this way" and goes away when there isn't any. Mirrors the existing `table-scroll-shadow` on the sticky thead (fades in at the top during vertical scroll) but in the opposite direction on the inline axis. Uses `scroll(self inline)` timeline, `animation-range: normal` (full timeline).

## Critical gotchas

1. **Sticky cells need opaque backgrounds (framed mode only).** In `<ui-table frame>`, the wrapper forces `--ui-table-cell-bg` and `--ui-table-header-bg` to `var(--color-surface)` so sticky cells stay opaque during scroll. In bare `<ui-table>` these stay at their `@property` default (`transparent`) so `<col>` backgrounds (zebracol, col hover, colgroup tint) paint through correctly. `th-light`/`th-dark` variants override `--ui-table-header-bg` independently.
2. **Column hover requires `<colgroup>`.** `data-hover~="col"`, `data-hover~="col-outline"`, and `zebracol-*` only work when `<col>` elements exist in matching count.
3. **`table-layout: fixed` reads widths from the first row or `<col>`**, never from body rows. Widths on arbitrary `<td>` elements are ignored.
4. **`box-sizing: border-box` matters.** Comes from `@browser.style/base`'s global reset. Without it, cell borders add to specified widths and sticky offsets drift.
5. **`@property --_has-overflow { inherits: true }`.** The inner table reads the flag for its edge-border `calc()` — inheritance is required. Similarly `--cN` is declared on the wrapper and inherited to cells.
6. **Split-cols / split-rows inside `<ui-table>`.** These variants use negative inline/block margins to align outer cells with surrounding page content. Inside a scroll container, `overflow: auto` clips the outermost 1px border of the first cell because it sits exactly on the clip edge. The wrapper adds `padding-inline-start: var(--ui-table-border-width)` (and the block equivalent) to the inner split-layout table to nudge the outer border inside the clip edge. The alignment trick is preserved.

## Version

v4 — rewrite of the v1 class-based implementation (`.--modifier`) to data-attributes (`data-variant~="modifier"`), full-readable token names, nested CSS, and CSS-only overflow detection.
