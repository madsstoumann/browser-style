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
| `data-variant` | table | Space-separated layout tokens (`rounded`, `split-cols`, `th-dark`, `fixed`, …) |
| `data-hover` | table | Space-separated hover effects (`col`, `col-outline`, `td`, `tr`, `all`, …) |
| `data-size` | table | Density: `sm` / `lg` (no value = medium). Separate from `data-variant` to match the convention used by `<ui-avatar>`, `<ui-badge>` etc. |
| `data-row` | `<tr>` | Row state: `active` / `selected` |
| `data-c1`…`data-c8` | table | Per-column text alignment — provided by `@browser.style/base`'s `core.css`, not this package |
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

## Critical gotchas

1. **Sticky cells need opaque backgrounds.** Without `--ui-table-cell-bg` and `--ui-table-header-bg` set on the wrapper, sticky cells are transparent and scrolling content bleeds through them. `th-light`/`th-dark` variants override `--ui-table-header-bg` independently.
2. **Column hover requires `<colgroup>`.** `data-hover~="col"`, `data-hover~="col-outline"`, and `zebracol-*` only work when `<col>` elements exist in matching count.
3. **`table-layout: fixed` reads widths from the first row or `<col>`**, never from body rows. Widths on arbitrary `<td>` elements are ignored.
4. **`box-sizing: border-box` matters.** Comes from `@browser.style/base`'s global reset. Without it, cell borders add to specified widths and sticky offsets drift.
5. **`@property --_has-overflow { inherits: true }`.** The inner table reads the flag for its edge-border `calc()` — inheritance is required. Similarly `--cN` is declared on the wrapper and inherited to cells.

## Version

v4 — rewrite of the v1 class-based implementation (`.--modifier`) to data-attributes (`data-variant~="modifier"`), full-readable token names, nested CSS, and CSS-only overflow detection.
