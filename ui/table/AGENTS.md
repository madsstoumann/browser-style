# ui-table — Internal Architecture (v4)

CSS-first styling for native `<table>` elements. An optional `<ui-table>` light-DOM wrapper adds overflow detection and dynamic sticky-column offsets — everything else is CSS.

## Root selector

```css
:where(table:is([data-variant], [data-hover], [data-size]), ui-table > table)
```

Two branches:
1. Any `<table>` that opts in via `data-variant`, `data-hover`, or `data-size`.
2. Any `<table>` directly inside `<ui-table>` — the web component forwards its attributes as `data-*` on the child, so this branch is mostly a safety net.

`:where()` keeps specificity at 0. Layout variants and hover modifiers nest under this root as `&[data-variant~="…"]` / `&[data-hover~="…"]` — avoids repeating `table[…]` on every rule.

The overflow wrapper has its own root:

```css
:where(ui-table[overflow], ui-table-wrapper)
```

Two wrapper options, same styles: the `<ui-table>` web component (JS-driven, auto-detects overflow and computes sticky offsets) or the bare `<ui-table-wrapper>` custom element (CSS-only, author hard-codes sticky offsets). `<ui-table-wrapper>` is not registered via `customElements.define` — it's just a tag with a hyphen, valid HTML, styled purely in CSS, zero JS required.

## Attribute surface

| Attribute | Where | Purpose |
|-----------|-------|---------|
| `data-variant` | table | Space-separated layout tokens (`rounded`, `split-cols`, `split-rows`, `th-dark`, `th-light`, thead-divider family (width: `th-divide-lg/xl`; style: `th-dotted/dashed/double/groove/ridge`), `caption-bottom`, `fixed`, `block-border`, `no-border`, `no-wrap`, zebra variants) |
| `data-hover` | table | Space-separated hover effects (`col`, `col-outline`, `td`, `tr`, `all`, …) |
| `data-size` | table | Density: `sm` / `lg` (no value = medium). Separate from `data-variant` so density composes orthogonally with layout tokens. |
| `data-row` | `<tr>` | Space-separated list of states — selector uses `~=` so values compose. `active` / `selected` apply solid accent/highlight; `success` / `warning` / `error` / `info` apply a tint (see *Status tints* below); `group` turns the row into a section heading (semibold + `--color-surface-alt` tint) and pairs naturally with a single `<td colspan="N">`. Tint rules are ordered after `group` in the CSS, so e.g. `data-row="group info"` gives a semibold section heading with the info tint. When inside the overflow wrapper, `group` rows are also `position: sticky` and displace each other on vertical scroll (iOS contact-list pattern). |
| `data-c1`…`data-c8` | table | Per-column formatting — composable values: `start` / `center` / `end` (text alignment) + `tabular` (`font-variant-numeric: tabular-nums`). Defined in a top-level `:where(table) { … }` block so it works on any `<table>`, not just tables that opt into this component. |
| `<ui-table-wrapper>` | wrapper | CSS-only overflow-wrapper element (an un-registered custom element, styled purely via CSS — no JS dependency) |
| `data-sticky` | wrapper | Sticky column indices (e.g. `c0 c2`, 0-indexed) |

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

### JS fallback (`<ui-table overflow>`)

`ResizeObserver` toggles `[overflowing]` based on `scrollWidth > clientWidth`. A CSS rule `&[overflowing] { --_has-overflow: 1 }` flips the same flag. Needed for Safari ≤ 18 and any browser without scroll-driven animations.

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

The four semantic variants (`success`/`warning`/`error`/`info`) use a shared rule with a private `--_c` variable to stay compact:

```css
& tr:is([data-row~="success"], [data-row~="warning"], [data-row~="error"], [data-row~="info"]) {
  --ui-table-cell-bg: light-dark(color-mix(in oklab, var(--_c) 15%, #FFF), var(--_c));
  color: contrast-color(var(--ui-table-cell-bg));
}
& tr[data-row~="success"] { --_c: var(--color-success); }
/* …warning/error/info */
```

- **Light mode** mixes 15% of the semantic color with white for a soft tinted background
- **Dark mode** uses the color directly — the muted dark-mode variants of `--color-success` etc. already work well as backgrounds, so no mixing needed (and mixing with a near-black surface just looked near-black)
- **Text color** is resolved by `contrast-color()`, which picks black or white based on contrast with the resolved background — no per-variant `color` declaration needed

## Focus ring

The overflow wrapper surfaces its inner focus state on itself:

```css
:where(ui-table[overflow], ui-table-wrapper) {
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

1. **Sticky cells need opaque backgrounds.** Without `--ui-table-cell-bg` and `--ui-table-header-bg` set on the wrapper, sticky cells are transparent and scrolling content bleeds through them. `th-light`/`th-dark` variants override `--ui-table-header-bg` independently.
2. **Column hover requires `<colgroup>`.** `data-hover~="col"`, `data-hover~="col-outline"`, and `zebracol-*` only work when `<col>` elements exist in matching count.
3. **`table-layout: fixed` reads widths from the first row or `<col>`**, never from body rows. Widths on arbitrary `<td>` elements are ignored.
4. **`box-sizing: border-box` matters.** Comes from `@browser.style/base`'s global reset. Without it, cell borders add to specified widths and sticky offsets drift.
5. **`@property --_has-overflow { inherits: true }`.** The inner table reads the flag for its edge-border `calc()` — inheritance is required. Similarly `--cN` is declared on the wrapper and inherited to cells.

## Version

v4 — rewrite of the v1 class-based implementation (`.--modifier`) to data-attributes (`data-variant~="modifier"`), full-readable token names, nested CSS, and CSS-only overflow detection.
