# Unify `<ui-table>` and `<ui-table-wrapper>` — Design

**Date:** 2026-04-20
**Branch:** `v4`
**Status:** Approved, pending implementation

## Motivation

Today `ui/table/` ships two wrapper elements with overlapping purpose:

- `<ui-table-wrapper>` — unregistered custom element, CSS-only. Author hard-codes sticky column offsets inline.
- `<ui-table overflow>` — registered web component. ResizeObserver + JS-computed sticky offsets; forwards `variant`/`hover`/`size`/`sticky` attrs to the inner `<table>` as `data-*`.

Both already share one ruleset via `:where(ui-table[overflow], ui-table-wrapper)`. The split reflects "do I need JS or not?" — not a conceptual difference. Authors have to pick the right tag up-front, which is avoidable friction.

Secondary concern: wide tables elsewhere in the demos (e.g. the 8-column tint ramps at [ui/table/index.html:462](ui/table/index.html#L462) and [:476](ui/table/index.html#L476)) overflow on narrow viewports but aren't wrapped. A single unified `<ui-table>` would make adding the overflow container a one-line change.

## Design decisions

| # | Decision | Choice |
|---|---|---|
| 1 | Should `<ui-table>` always wrap every `<table>`? | **No — opt-in.** Bare `<table data-variant="…">` keeps working. Wrap only when overflow/scroll-container/sticky-column/framework use is wanted. |
| 2 | Keep the `overflow` attribute as an opt-in switch? | **No — drop it.** Wrapping in `<ui-table>` *is* the opt-in. The element always provides the scroll container, sticky-column machinery, and focus ring. |
| 3 | Keep `<ui-table-wrapper>` as a CSS alias? | **No — drop it cleanly.** v4 is pre-release; one name, one story. |
| 4 | JS registration strategy (import = register, opt-in attr, auto-detect, or two entry points). | **Deferred.** Not blocking the CSS-level unification. |

## Markup model

```html
<!-- Simple table — bare, unchanged -->
<table data-variant="rounded" data-hover="tr">…</table>

<!-- Wide / scroll / sticky-column table — opt into <ui-table> -->
<ui-table data-variant="rounded"
          data-sticky="c0 c2"
          style="--c0: 0; --c2: 100.59px">
  <table data-variant="rounded no-wrap th-light" data-hover="tr">…</table>
</ui-table>
```

**Attribute placement:**

- Table-level concerns on `<table>`: `data-variant` (layout tokens), `data-hover`, `data-size`, `data-tint` / `data-tint-end`, `data-c1…data-c8`.
- Wrapper-level concerns on `<ui-table>`: `data-variant="rounded"` (wrapper radius), `data-sticky`, `--c0`…`--c8` style props for sticky offsets.
- `data-variant="rounded"` lives independently on each — the wrapper rounds its own frame, the table rounds its own corners. No cross-inference.

## Component behaviour

### CSS-only (no JS imported)

Everything works today's `<ui-table-wrapper>` supports, under the new name:

- Scroll-driven overflow detection via `animation-timeline: scroll()` flips `--_has-overflow` on either axis.
- Wrapper frame (border, radius, edge-border collapse) is gated by `calc(--_has-overflow * …)` — invisible until there's actually overflow.
- Sticky thead, sticky columns, sticky group headers — all CSS. Offsets (`--c0`, `--c2`, …) come from inline `style=""`.
- Focus ring surfaces `:focus-within` on the wrapper.
- Scroll shadows on thead (top) and inline-end edge.

### With JS (registered `<ui-table>` web component)

Adds the ergonomics that need scripting:

- Forwards `variant` / `hover` / `size` / `sticky` attrs to the child `<table>` as `data-*`. Framework users bind state to `<ui-table>` props directly.
- ResizeObserver computes sticky column offsets from `cell.offsetWidth` — no more hard-coding `--c0`, `--c2` inline.
- ResizeObserver also toggles an `[overflowing]` attribute → flips `--_has-overflow` to 1 for Safari ≤ 18 and any browser without `animation-timeline` support.

The previous `overflow` attribute gate goes away. If JS is loaded and registered, it always runs (propagateAttributes + ResizeObserver). The cost is negligible.

## CSS changes — [ui/table/ui-table.css](ui/table/ui-table.css)

### Root selector (line 46)

```css
/* Before */
:where(table:is([data-variant], [data-hover], [data-size]), ui-table > table)

/* After */
:where(table:is([data-variant], [data-hover], [data-size]))
```

The `ui-table > table` branch was a safety net for JS attribute forwarding. With the unified model, authors still write `data-variant` on the `<table>` — nothing implicit from the wrapper. Drop the branch.

### Wrapper selector (line 428)

```css
/* Before */
:where(ui-table[overflow], ui-table-wrapper)

/* After */
:where(ui-table)
```

Everything else in the wrapper block — scroll-driven animations, sticky columns, focus ring, scroll shadow, `data-sticky` enumeration — is unchanged.

### Keyframes / registered custom properties

Unchanged. `--_has-overflow`, `--ui-table-cell-bg`, `--_tm`, `table-overflow-mark`, `table-scroll-shadow` all carry over as-is.

## JS changes — [ui/table/index.js](ui/table/index.js)

Class stays close to today's `UiTable` with the `overflow` gate removed:

```js
connectedCallback() {
  this.propagateAttributes();
  this.observer = new ResizeObserver(() => this.update());
  this.observer.observe(this);
  this.update();
}
```

`propagateAttributes`, `update`, `setStickyOffsets` — logic unchanged. `observedAttributes` stays `['variant', 'hover', 'size', 'sticky']`.

The still-open question (skipped for now) is *when* this class registers: import = register, opt-in marker, auto-detect, or split entry points. That decision doesn't affect the class itself — only the bottom `customElements.define` line.

## Migration

### [ui/table/index.html](ui/table/index.html)

- Lines 529, 559, 590: `<ui-table-wrapper …>` → `<ui-table …>` and matching close tags. Three occurrences.
- Optional: wrap the 8-column tint ramp demos at [:462](ui/table/index.html#L462), [:476](ui/table/index.html#L476) in `<ui-table>` to show the auto-overflow case on narrow viewports. Bare tables still work; wrapping earns its keep once the viewport narrows.
- Update the prose at [:17](ui/table/index.html#L17) and [:526](ui/table/index.html#L526) to describe one wrapper, not two.

### [ui/table/AGENTS.md](ui/table/AGENTS.md)

- "Root selector" section: drop the `ui-table > table` branch from the shown selector and the two-branch explanation.
- "Attribute surface" table: remove the `<ui-table-wrapper>` row. `data-sticky` moves from "wrapper" to live on `<ui-table>`.
- "Overflow wrapper: dual-path detection" → keep both paths (CSS-only scroll-timeline + JS `[overflowing]` fallback), but the JS path now always engages when the element is registered, not via the `overflow` attribute.
- Drop the "two wrapper options, same styles" paragraph.

### [ui/table/readme.md](ui/table/readme.md) and [ui/table/wc-demo.html](ui/table/wc-demo.html)

Audit for `ui-table-wrapper` / `overflow` references and update to the unified form.

## What's not changing

- The `<table>`-level API: `data-variant`, `data-hover`, `data-size`, `data-tint*`, `data-row`, `data-c1…data-c8`. Identical.
- Column-hover enumeration (`:has()` + `<colgroup>`), zebra mechanisms, graduated-tint system, 2D bilinear ramp, status tints, group rows, thead-divider family, hover routing via `--_rb`/`--_hb`, multi-row thead corrections — all unchanged.
- Scroll-driven overflow detection, `@property --_has-overflow`, keyframe-clamp trick, edge-border collapse via `calc()` — all unchanged.

## Post-implementation correction

The initial implementation dropped the `overflow` attribute and mass-wrapped every demo table in `<ui-table>`. That made three `<col>`-based features (zebracol, col hover, colgroup tint) break because the wrapper's inner-table rule forces `--ui-table-cell-bg: var(--color-surface)` (opaque) to keep sticky cells from bleeding during scroll. Forcing opaque cells on every table hides the `<col>` background and defeats those features. The mass-wrap also introduced unwanted scrollbar behaviour on tables that don't overflow.

The correction splits `<ui-table>` into two modes via a new `frame` attribute:

- **Bare** `<ui-table>` — passive scroll container only: `display: block; overflow: auto` with styled scrollbar. Scrollbars appear only when content overflows. No sticky behaviour, no cell-bg override, no border frame. `<col>`-based features keep working.
- **Framed** `<ui-table frame>` — the full treatment from the original design: scroll-driven overflow detection, border/radius frame gated by `--_has-overflow`, sticky `<thead>` + group rows, opaque cell backgrounds, opt-in sticky columns via `data-sticky`, focus-ring surfacing.

The JS `ResizeObserver` is gated behind `hasAttribute('frame')` — bare wrappers do no work.

Name chosen: **`frame`** (over `overflow`, which was a misnomer since bare mode also overflows). Describes the visual outcome — a visible frame appears when the inner table actually overflows.

## Open items

1. **JS registration strategy.** Four options sketched during brainstorming (import-registers, opt-in attribute, auto-detect, split entry points). Deferred — pick before merging the implementation.
2. **Optional polish.** Should `<ui-table data-variant="rounded">` imply `--ui-table-border-radius` on the inner `<table>` for visual consistency? Today they're independent, and the design keeps them independent. Revisit only if a real case makes the inconsistency hurt.
