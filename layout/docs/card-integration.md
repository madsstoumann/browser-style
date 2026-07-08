# Card × Layout Integration

How the root-level **layout system** (`/layout`, `<lay-out>`) and the **card system** (`ui/card`, `ui/reveal`) compose — and the phased plan to make them one story, from demo grids to a shared, editor-ready JSON format.

**Status:** Phase 1 (proof of concept) implemented — `ui/card/index.html` and `ui/reveal/index.html` use `<lay-out>` instead of hard-coded `.grid` classes. Phases 2–6 are specified below, not yet implemented.

## Why

Every card/reveal demo page used to define its own `.grid` / `.grid-2/3/4` classes in an inline `<style>` block. A census of the 17 demo pages found three different breakpoint conventions for the same visual intent:

| Pages | Classes | Breakpoints |
|---|---|---|
| `ui/card/render.html`, `article.render.html`, most `media.*.html` (13 pages) | `.grid-2/.grid-3` | 540px |
| pages with `.grid-4` (9 pages, overlapping) | `.grid-4` | 540px → 2-col, 900px → 4-col |
| `ui/card/index.html`, `ui/reveal/index.html` | `.grid-2/.grid-3` | 720px |

Duplicated, inconsistent, and expressible only as uniform columns. Meanwhile `/layout` generates exactly this kind of CSS from JSON (`layout.config.json` + `layouts/*.json` → `dist/layout.css`), with a far richer vocabulary (`grid()`, `bento()`, `mosaic()`, `asym()`, `ratios()` …), consistent breakpoints, and a format prepared for a visual editor.

## The composition model — two axes, two systems

The systems compose cleanly **by construction**:

- **`<lay-out md="…" lg="…">`** — *viewport* `@media` queries (xs 240 / sm 380 / md 540 / lg 720 / xl 920 / xxl 1140 px). Decides the **section layout**: how many cells, what pattern, which card gets a wide cell.
- **card `md:` / `lg:` token prefixes** (in `variant=` / `content=`) — *container* queries on the card's **own width** (`md` ≥ 25rem/400px, `lg` ≥ 44rem/704px, queried via `<cq-box>` / `<summary>`). Decides the **card's internal arrangement**: stacked vs row, split ratios, spacing.

Chain of effects: viewport width → `lay-out` picks a pattern → each cell gets a width → each card's container queries react to that width. One markup, no coordination needed.

Worked example (live on `ui/card/index.html`, "Layout system" section):

```html
<lay-out md="columns(2)" lg="grid(3a)">
  <ui-card variant="col lg:row lg:spl(1/1)" media="asr(16/9)">…</ui-card>
  <ui-card variant="col lg:row lg:spl(1/1)" media="asr(16/9)">…</ui-card>
  <ui-card variant="col lg:row lg:spl(1/1)" media="asr(16/9)">…</ui-card>
</lay-out>
```

At viewport ≥ 720px, `grid(3a)` gives the first two cards half-width cells (~below 44rem → they stay `col`, stacked) and the third card the full bottom row (crosses 44rem → `lg:row lg:spl(1/1)` kicks in, media beside content). All three cards have **identical markup**.

### Why it doesn't collide

- `lay-out` has `contain: layout inline-size` but **no `container-type`** — it never becomes a query container, so `cq-box`/`summary` still resolve to their `ui-card`/`ui-reveal` ancestor.
- Card CSS lives in `@layer bs-component` (base in `bs-core`); layout CSS in `@layer layout.*`. Zero selector/layer overlap.
- `lay-out > *:not(lay-out) { grid-area: var(--_ga, var(--layout-ga, auto)) }` is harmless — cards never set their own `grid-area`.
- **One known conflict:** `dist/layout.css` ends with an *unlayered* `body { margin-inline: max(…) }` rule (generated from `layoutContainer` in `layout.config.json`) that beats base's `:where(body) { margin-inline: auto }`. Demo pages counter it in `ui/card/demo.layout.css`; the upstream fix (Phase 6) is to emit that rule inside `@layer layout.base`.

### Naming: keep both vocabularies

Both systems use "md"/"lg", meaning different things (viewport attribute vs container token prefix). **Recommendation: don't rename either.** They never co-occur on one element — `md=` is an attribute on `<lay-out>`, `md:` a prefix inside `variant=`/`content=` — and both systems are published. One deliberate near-alignment worth knowing: card-`lg` (44rem = 704px) ≈ layout-`lg` (720px), so a full-bleed card flips to its `lg` tier just before the section re-flows.

### Browser support note

Generated variant rules use literal values (`--layout-gtc: 1fr 1fr 1fr`), so patterns work everywhere. The *attribute-driven* props (`col-gap=`, `pad-inline=`, `bleed=` …) use typed `attr()` (Chromium-only) — pages must load `/layout/polyfills/attr-fallback.js` for Safari/Firefox, or gaps silently disappear.

## Usage pattern (Phase 1, implemented)

Includes (demos are served from the repo root):

```html
<link rel="stylesheet" href="/ui/base/index.css">
<link rel="stylesheet" href="/layout/dist/layout.css">
<link rel="stylesheet" href="ui-card.css">
<link rel="stylesheet" href="/ui/card/demo.layout.css">
<script type="module" src="/layout/polyfills/attr-fallback.js"></script>
```

Do **not** include `/layout/demo.css` — it styles layout's own demo furniture (`item-card`, `body { display: grid }`).

`ui/card/demo.layout.css` is a tiny unlayered shim: re-asserts body centering (see conflict above) and maps the old `.grid` rhythm onto layout (`--layout-space-unit: var(--spacing-lg)`, `margin-block-end: var(--spacing-2xl)`).

**Variant guidance for card lists:** all `columns(N)` and `grid(N…)` variants are `repeatable: true` — safe for any card count. `asym()`, and some `bento()`/`mosaic()` variants hide children beyond their pattern (`nth-child(n+…) { display: none }`) — only use them when the item count matches the pattern's `items`.

## Phase 2 — migrate the remaining ~15 demo pages

Mapping table (normalizes the 540/720/900 inconsistency to layout's canonical breakpoints):

| Old wrapper | New wrapper |
|---|---|
| `.grid grid-2` @ 540 | `<lay-out md="columns(2)">` |
| `.grid grid-2` @ 720 | `<lay-out lg="columns(2)">` |
| `.grid grid-3` @ 540 | `<lay-out md="columns(2)" lg="columns(3)">` |
| `.grid grid-3` @ 720 | `<lay-out lg="columns(3)">` |
| `.grid grid-4` @ 540/900 | `<lay-out md="columns(2)" xl="columns(4)">` |
| lone hero card | leave unwrapped |

JS-created wrappers (`render.html` and friends): `<lay-out>` needs no registration — pure CSS —

```js
const grid = document.createElement('lay-out');
grid.setAttribute('md', 'columns(2)');
```

Then delete each page's inline `.grid*` styles and add the includes above.

## Phase 3 — srcset bridge

Both systems compute responsive-image hints, differently:

- **layout:** each variant's `srcset` field (% width per item) is compiled into `layouts-map.js`; `src/srcsets.js` `generateSrcsets()` produces a `srcsets="540:50%;720:50%,50%,100%@1024"` attribute and `calculateSizes(srcsets, childIndex)` turns it into a real `sizes` string per child.
- **card:** `ui/card/ui-media-srcset.js` builds Cloudflare-CDN `srcset` from a fixed width list (`[240,320,480,720,1200]`) with `sizes="auto"` — it knows nothing about the cell the card occupies.

Bridge (minimal, progressive enhancement): keep the CDN width list, fix `sizes` from layout context —

```js
// in ui-media-srcset.js
#layoutSizes() {
  const layout = this.closest('lay-out');
  const srcsets = layout?.getAttribute('srcsets');
  if (!srcsets) return null;
  const cell = [...layout.children].find(c => c.contains(this));
  return calculateSizes(srcsets, [...layout.children].indexOf(cell));
}
// upgrade(): sizes = this.#layoutSizes() ?? cfg.sizes
```

Coupling rule: `calculateSizes` must be **injected** (e.g. via `globalThis.uiMedia` or a guarded dynamic import), never a hard dependency of the published `@browser.style/ui-card` package. The `srcsets` attribute comes from (a) hand-authoring, (b) loading layout's `<lay-out>` web component (`/layout/src/components/layout/index.js`, derives it from the breakpoint attributes via `layouts-map.js`), or (c) SSR (Phase 4).

Known imprecision: `calculateSizes` emits `vw`-based sizes assuming `lay-out` spans the viewport (capped at `@1024`); inside an 85ch-capped body it slightly over-requests. Acceptable; a container-relative refinement belongs in layout v2.

## Phase 4 — section preset + section renderer (SSR)

The shared, editor-ready format. One JSON document describes a **section**: a layout config plus the cards inside it, each with an optional card-preset override. Builds on the schemas that already exist — `cms/baseline/models/layout-config.schema.json` (per-breakpoint token strings) and `card-preset.schema.json` — not a new vocabulary. The layout half is exactly what the composer (`layout/src/components/composer/`, `model.json`) already edits; the card half is what a future card editor would edit.

```json
{
  "model": "section",
  "id": "front-teasers",
  "layout": {
    "md": "columns(2)", "lg": "grid(3a)",
    "colGap": 2, "rowGap": 2, "spaceBottom": 3, "bleed": 0, "width": "xl"
  },
  "items": [
    { "card": { "$ref": "card/article-001" }, "preset": { "$ref": "card-preset/stack" } },
    { "card": { "$ref": "card/product-001" }, "preset": { "$ref": "card-preset/showcase" } },
    { "card": { "$ref": "card/event-001" } }
  ]
}
```

- Schema: `cms/baseline/models/section.schema.json`. `layout` either inlines the layout-config fields or `$ref`s a stored layout-config — support both, like `preset` refs work today.
- Renderer: `ui/card/render-section.js`, string-based and Node-safe like `render.js`:

```js
import { renderCard } from './render.js';

export function renderSection(section, presets = {}, cards = {}, layoutTools = null) {
  const l = section.layout ?? {};
  const bp = Object.fromEntries(
    ['xs','sm','md','lg','xl','xxl'].filter(k => l[k]).map(k => [k, l[k]]));
  const srcsets = layoutTools
    ? layoutTools.generateSrcsets(bp, layoutTools.srcsetMap, layoutTools.layoutConfig)
    : null;
  const items = section.items.map(it =>
    renderCard(withPreset(resolveCard(it.card, cards), it.preset), presets, cards)).join('');
  return `<lay-out${attrs({ ...bp, 'col-gap': l.colGap, 'row-gap': l.rowGap,
    bleed: l.bleed, width: l.width, overflow: l.overflow, srcsets })}>${items}</lay-out>`;
}
```

`layoutTools` (`{ generateSrcsets, srcsetMap, layoutConfig }` from `/layout/src/srcsets.js` + `/layout/layouts-map.js`) is injected so `render-section.js` has no hard layout dependency. The emitted `srcsets` attribute is what the Phase 3 bridge consumes — SSR layout context flows into client image `sizes` with no extra plumbing. True SSR `srcset` on `<img>` inside `render.js` is the follow-up that retires `ui-media-srcset.js` entirely (it's documented as transitional).

- Validation: a section referencing a non-`repeatable` variant should check `items.length` against the variant's `items` count in `layouts/*.json` (the composer's `model.json` already carries this metadata).
- Demo: `ui/card/section.render.html` + a sample `ui/card/data/sections/*.json`.

## Phase 5 — visual editor alignment

The layout composer (`layout/src/components/composer/`) edits exactly the `layout` half of a section. Whether cards get their own visual editor is still undecided; the section format above keeps that door open — a card editor would edit `items[n].preset` (+ the preset collections in `ui/card/data/card.presets.json`) without touching the layout half. The layout v2 roadmap (`layout/.tmp/todo.md`, Phases 2/5: `LayoutPreset`, `presetToAttributes`, configurator package, Sanity.io schema) slots in as the persistence/UI layer for the same document.

## Phase 6 — upstream cleanups

- `layout/src/builder.js`: emit the generated `layoutContainer` `body` rule inside `@layer layout.base`, then drop the counter-rule from `demo.layout.css`.
- Remove `.grid` guidance from card docs; point to this document.
- Optional: a `cards` theme in layout demos so `item-card` placeholders can be replaced by real `<ui-card>`s in `/layout/dist/*.html` demos too.
