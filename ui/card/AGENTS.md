# Card System — Agent Orientation

> Read this first when working on `ui/card`, `ui/reveal`, or anything that places cards inside the root `/layout` system. It explains the architecture and points to the detailed docs — it does not duplicate them.

## Overview

A CSS-first **universal card system**: one set of primitives renders articles, products, events, recipes, profiles and 25+ other content types. Everything is **light DOM, no Shadow DOM**; JavaScript is progressive enhancement only — every card works with CSS alone.

Each card has two areas:

- **`<ui-media>`** — the media frame: images, video, carousels, plus "furniture" overlaid on top (chips, stickers, save/play buttons).
- **`<ui-content>`** — the text column: eyebrow, headline, summary, byline, tags, actions… tagged with `data-part` and schema.org microdata.

They compose inside a host — `<ui-card>` (static) or `<ui-reveal>` (disclosure, in `ui/reveal`) — and the host adapts its internal arrangement to **its own width** via container queries, so the same markup works as a hero, a grid cell, or a sidebar item.

```html
<ui-card variant="col lg:row lg:spl(1/1)" media="asr(16/9)">
  <cq-box>
    <ui-media><img src="…" alt=""></ui-media>
    <ui-content>
      <small data-part="eyebrow">…</small>
      <h2 data-part="headline">…</h2>
      <p data-part="summary">…</p>
    </ui-content>
  </cq-box>
</ui-card>
```

## The elements

| Element | Registered? | Role |
|---|---|---|
| `<ui-card>` | no | static host; container-query root; grid |
| `<cq-box>` | no | queryable descendant inside `<ui-card>` — the grid actually lives here (hand-authored; there is no auto-insert build) |
| `<ui-media>` | **yes** — the ONLY registered element (`ui-media-srcset.js`) | media frame; registration only adds srcset/loading upgrades |
| `<ui-content>` | no | text column |
| `<ui-reveal>` | no | disclosure host built on `<details>/<summary>` (`ui/reveal`) |
| `<ui-face>` | no | front-face wrapper inside `<summary>` for flip/scale/slide |
| `<ui-chip>`, `<ui-sticker>` | no | marker furniture (labels/badges on media) — own packages `ui/chip`, `ui/sticker` |
| `<ui-save>`, `<ui-play>` | no | interactive furniture — `ui/save`, `ui/play` |
| `<ui-icon>` | no | reveal toggle icon — `ui/icon` |

Everything except `<ui-media>` is an **unregistered custom element** styled purely by CSS attribute selectors. Do not register elements CSS alone can drive.

## The three attribute DSLs

Space-separated token strings; values flow down via CSS custom properties, so a token may sit on the host or the primitive itself.

| Attribute | On | Controls | Example tokens | Doc |
|---|---|---|---|---|
| `variant=` | `ui-card` / `ui-reveal` | composition | `col` `row` `col-r` `row-r` `spl(1/2)` `vis(media)` `ovr(bl)` `rds(lg-sq)` | `ui-card-tokens.md` |
| `theme=` | `ui-card` / `ui-reveal` | shared theme axis (colour + `pale`/`muted`/`light`/`dark`) | `black dark` `red pale` `gray` | `../base/theme.md` |
| `media=` | `ui-media` or ancestor | media frame | `asr(16/9)` `obf()` `obp(cc)` `flp(h)` `hov(zoom)` `scm` `nav(dot)` `chip(ts)` `sticker(red)` `vid()` `load(eager)` | `media.md`, `media.carousel.md` |
| `content=` | `ui-content` or ancestor | text column | `scl(lg)` `hl(poster)` `eb(accent)` `tx(lgt)` `mt(med)` `pad(xl)` `gap()` `scr` | `content.md` |

## Container-query model (how cards respond)

The host (`ui-card`/`ui-reveal`) is an **anonymous inline-size container** (no `container-name`). A container can't query its own size, so all `@container` rules target the queryable descendant — `<cq-box>` in a card, `<summary>` in a reveal — via `:is(cq-box, summary)`, which is how card and reveal share one rule set (`ui-card.css`).

Two tiers, driven by the **card's own rendered width**, not the viewport:

- `md:` → `@container (inline-size >= 25rem)` (400px)
- `lg:` → `@container (inline-size >= 44rem)` (704px)

Prefixable this round: `variant=` arrangement tokens, `content=` spacing (`gap()`/`pad()`), and `content=` **size** (`scl()` and `hl(<size>)`). Not prefixed: `media=` tokens and `content=` **tone/weight** (`eb()`/`hl()`/`tx()`/`mt()` ink + weight).

## Presets + renderer (JSON → HTML)

A **preset** is a named look-&-feel bundle written verbatim to the host attributes:

```json
"hero": {
  "element": "ui-card",
  "variant": "ovr(bl)",
  "media": "asr(4/3) scm",
  "content": "scl(lg)"
}
```

Shape: `{ element, variant, media, content, text?, styles?, reveal?{type, typeLg, icon, iconClose, scroll…} }`. Collections: `data/card.presets.json` (canonical) and `data/card.presets.demo.json`. Content instances reference one via `"preset": { "$ref": "card-preset/hero" }` — swap the ref to restyle without touching content. Schemas live in `cms/baseline/models/` (`card.schema.json`, `card-preset.schema.json`).

`render.js` is a **string-producing SSR engine** — no `document`, runs unchanged in Node. `renderCard(ucf, presets, cards)` resolves the preset, dispatches on `preset.element` (`ui-card` | `ui-reveal` | `ui-media` | `ui-content`), and appends furniture tokens from the content (e.g. a `chip` field → `chip(ts) chip(green)` on `media=`). Everything passes through `esc()`. Demo data: `data/demo/*.json`, manifest `data/index.json`, driver `render.html`. Full walkthrough: `card.md`.

## ui/reveal — the sibling

`<ui-reveal>` (`ui/reveal/ui-reveal.css`) composes the **same engine** over native `<details>/<summary>` — it `@import`s `../card/ui-card.css`, so all three DSLs work unchanged. Front face lives in `<summary>` (wrapped in `<ui-face>` for flip/scale/slide), the revealed panel is the one element after `</summary>` (usually `<ui-content>`), animated via `::details-content`. Reveal-specific attributes: `type` (`expand|flip|slide|scale`), `type-lg`, `from`, `to`, `trigger="card"`, `scroll`, `icon`/`icon-close`, native `<details name>` for exclusivity. Interactive furniture (`ui-save`/`ui-play`) is **invalid inside `<summary>`**; markers (`ui-chip`/`ui-sticker`) are fine. Details: `ui/reveal/readme.md`, design rationale: `ui/reveal/plan.md`.

## Layout integration (section layout comes from /layout)

Multi-card layout is **not** part of the card system. Sections are arranged by the root layout system's `<lay-out>` element (JSON-configured, build-generated CSS — see `layout/AGENTS.md`):

```html
<lay-out md="columns(2)" lg="grid(3a)">
  <ui-card …>…</ui-card>
  <ui-card …>…</ui-card>
  <ui-card …>…</ui-card>
</lay-out>
```

Two axes, one markup:

- **`<lay-out md= lg=>`** — *viewport* `@media` breakpoints (xs 240 / sm 380 / md 540 / lg 720 / xl 920 / xxl 1140 px) pick the section pattern and give each card a cell.
- **card `md:` / `lg:`** — *container* queries react to the cell width the layout produced.

Both vocabularies use "md"/"lg" but never co-occur on one element (attribute vs token prefix) — keep both, don't rename. They don't collide technically either: `lay-out` has `contain: layout inline-size` but no `container-type` (cards keep their query root), and the CSS lives in disjoint cascade layers (`layout.*` vs `bs-component`).

Demo include pattern (see `index.html`):

```html
<link rel="stylesheet" href="/layout/dist/layout.css">
<link rel="stylesheet" href="/ui/card/demo.layout.css">  <!-- shim: gap rhythm + body centering -->
<script type="module" src="/layout/polyfills/attr-fallback.js"></script>  <!-- Safari/FF gaps -->
```

Variant guidance for card lists: all `columns(N)` and `grid(N…)` variants are `repeatable` — safe for any card count. `asym()` and some `bento()`/`mosaic()` variants hide children beyond their pattern — only use when the item count matches.

**The full integration roadmap** (remaining demo migration, srcset bridge, editor-ready section-preset JSON combining a layout config with per-item card-preset refs) lives in `layout/docs/card-integration.md`. Phase 1 is done: `ui/card/index.html` and `ui/reveal/index.html` use `<lay-out>`.

## JS modules (all optional, progressive enhancement)

| File | Purpose |
|---|---|
| `index.js` | all-in-one entry: imports the three chunks below, exports `scan()` (also `globalThis.uiMedia.scan`) |
| `hover.js` | cursor-tracked `hov(track|drift|tilt)` — standalone, zero imports |
| `carousel.js` | loop (seamless clones), autoplay, pause-on-slide-leave, per-slide `<ui-play>` video controls |
| `video.js` | embed facades, media-command polyfill, `vid()` player tools, solo play, opt-in tracking |
| `shared.js` | primitives shared by carousel.js/video.js (`reflectPlay`, `bindVideo`, token readers) |
| `build.js` | `node build.js` → bundled+minified `*.min.js` per entry + gzip/brotli size table |
| `ui-media.js` | hover tracking only (`hov(track)`/`hov(drift)`) — superseded by `hover.js` |
| `ui-media-srcset.js` | registers `<ui-media>`; host-gated Cloudflare `srcset` + loading/decoding upgrades. **Transitional** — retire once srcset is SSR'd |
| `srcset.js` | dependency-free Cloudflare Image Resizing URL builder |
| `render.js` | Node-safe SSR: JSON (UCF) → HTML string |

## Conventions & pitfalls

1. **Hand-author `<cq-box>`** inside `<ui-card>` — nothing auto-inserts it.
2. **Never `innerHTML` with data** — `render.js` escapes everything via `esc()`; only `<b>` in headlines survives. Keep it that way.
3. **Direct-child scoping** — reveal rules use `> details > summary` so nested `<details>` don't inherit chrome; follow the same discipline (`:scope >`) in JS.
4. **Don't register elements CSS can drive** — only `<ui-media>` needs JS, and only for srcset.
5. **Demos use `<lay-out>`** — do not reintroduce per-page `.grid` classes; use the mapping table in `layout/docs/card-integration.md`.
6. **`ovr()` needs `scm`** (or a dark image) for contrast; themes go through the shared `theme=` axis ([base/theme.md](../base/theme.md)), not ad-hoc colors. (The old `variant="thm(…)"` spelling was removed in v4 — use `theme=`.)

## Doc map — read this when…

| Doc | Read when… |
|---|---|
| `readme.md` | you need the public API / quick-start for `<ui-card>` |
| `card.md` | working on the content model, presets, or `render.js` |
| `media.md` | working on the media frame, furniture positioning, or video |
| `media.carousel.md` | working on carousel internals (scroll-markers, dots, arrows) |
| `stagger.md` | working on the stagger reveal engine (details / snap-carousel / scroll-driven adapters) |
| `animations.md` | working on the keyframe library or the `[animate]`/`animate-self` scroll API |
| `content.md` | working on the text column, `scl()`, `data-part`s, tag choice |
| `ui-card-tokens.md` | you need the `variant=` token / custom-property reference |
| `video.md` | integrating video providers / posters / facades |
| `../reveal/readme.md` + `../reveal/plan.md` | working on `<ui-reveal>` |
| `../../layout/AGENTS.md` | working on the layout system itself |
| `../../layout/docs/card-integration.md` | placing cards in layouts, srcset bridge, section presets |
| `../../cms/baseline/models/` | changing card / preset / layout-config schemas |
