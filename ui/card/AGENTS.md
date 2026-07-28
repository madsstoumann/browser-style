# Card System — Agent Orientation

> Read this first when working on `ui/card`, `ui/reveal`, or anything that places cards inside the root `/layout` system. It explains the architecture and points to the detailed docs — it does not duplicate them.

## Overview

A CSS-first **universal card system**: one set of primitives renders articles, products, events, recipes, profiles and 25+ other content types. Everything is **light DOM, no Shadow DOM**; JavaScript is progressive enhancement only — every card works with CSS alone.

Each card has two areas:

- **`<ui-media>`** — the media frame: images, video, carousels, plus "furniture" overlaid on top (chips, beacons, stickers, save/play buttons).
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
| `<ui-chip>`, `<ui-sticker>`, `<ui-beacon>` | no | marker furniture (labels/badges/live indicators on media) — own packages `ui/chip`, `ui/sticker`, `ui/beacon`; all faces incl. the beacon ticker are markup-free CSS |
| `<ui-save>`, `<ui-play>` | no | interactive furniture — `ui/save`, `ui/play` |
| `<ui-icon>` | no | reveal toggle icon — `ui/icon` |

Everything except `<ui-media>` is an **unregistered custom element** styled purely by CSS attribute selectors. Do not register elements CSS alone can drive.

## The three attribute DSLs

Space-separated token strings; values flow down via CSS custom properties, so a token may sit on the host or the primitive itself. **Scoping differs per DSL:** `media=` inheritance **stops at the card host** — a `<ui-media>` reads `media=` from itself or its nearest `ui-card`/`ui-reveal` only, never from other ancestors (a `media=` on a `<lay-out overflow>` drives the *layout's own* carousel and never leaks into descendant `<ui-media>`). `content=` by contrast is pure custom-property inheritance and flows down freely — it works on `lay-out` / `lay-out-group` too.

| Attribute | On | Controls | Example tokens | Doc |
|---|---|---|---|---|
| `variant=` | `ui-card` / `ui-reveal` | composition (+ all reveal config on `ui-reveal` — `exp`/`flp()`/`sld()`/`grw()` etc., see below) | `col` `row` `col-r` `row-r` `spl(1/2)` `vis(media)` `ovr(bs)` `rds(lg-sq)` | `ui-card-tokens.md` |
| `theme=` | `ui-card` / `ui-reveal` | shared theme axis (colour + `pale`/`muted`/`light`/`dark`) | `black dark` `red pale` `gray` | `../base/theme.md` |
| `media=` | `ui-media` or its card host (also `lay-out[overflow]` for its own scroller) | media frame + **all carousel controls (media-token-only — the old `nav=`/`arrow=`/`dot=`/`vid=`/`ply=`/`eager` attributes are removed)** | `asr(16/9)` `md:asr(4/3)` `obf()` `obp(cc)` `flp(h)` `hov(zoom)` `scm` `nav(mrk)` `arw(drk)` `mrk(pll)` `axis(y)` `auto` `loop` `stagger` `chip(ts)` `sticker(red)` `beacon(sld)` `marquee(bot)` `vid()` `play(lg)` `load(eager)` | `media.md`, `carousel.md`, `media.carousel.md` |
| `content=` | `ui-content` (canonical) or ancestor | text column | `scl(lg)` `hl(3xl)` `eb(accent)` `tx(lgt)` `mt(med)` `pad(xl)` `lg:pbs(none)` `gap()` `rds(lg)` `scr` | `content.md` |

## Container-query model (how cards respond)

The host (`ui-card`/`ui-reveal`) is an inline-size container **named `bs-card`** — `lay-out-group` joins the same namespace. A container can't query its own size, so the **host arm** of every rule targets the queryable descendant (`<cq-box>` in a card, `<summary>` in a reveal) via `:is(cq-box, summary)`, which is how card and reveal share one rule set (`ui-card.css`). Each `content=`/`asr()` rule also ships a **self arm** (`ui-content[content~=…]` / `ui-media[media~=…]`) so the attribute can sit on the primitive — the renderer's canonical placement. `variant=` gets no self arm: it arranges the two children.

Two tiers, driven by the **card's own rendered width**, not the viewport:

- `md:` → `@container bs-card (inline-size >= 25rem)` (400px)
- `lg:` → `@container bs-card (inline-size >= 44rem)` (704px)

The **name is load-bearing**: an unnamed size query resolves against the subject's nearest size container, so a self-armed primitive outside a card would switch tiers off an unrelated ancestor. A standalone `<ui-content>`/`<ui-media>` opts in with `<div style="container: bs-card / inline-size">`. `<lay-out>` deliberately stays a non-container so cards keep their own query root.

Prefixable: `variant=` arrangement tokens, `content=` spacing (`gap()` + the seven padding tokens `pad() pb() pi() pbs() pbe() pis() pie()`), `content=` **size** (`scl()`, `hl(<size>)`), and `media=`'s `asr()`. Not prefixed: every other `media=` token and `content=` **tone/weight**.

## Presets + renderer (JSON → HTML)

A **preset** is a named look-&-feel bundle written verbatim to the host attributes:

```json
"hero": {
  "element": "ui-card",
  "variant": "ovr(bs)",
  "media": "asr(4/3) scm",
  "content": "scl(lg)"
}
```

Shape: `{ element, variant, media, content, text?, styles?, reveal?{type, typeLg, icon, iconClose, scroll…} }` — the structured `reveal{}` object stays, but `render.js` folds it into `variant=` tokens (`exp`/`flp()`/`sld()`/`grw()` — type+from fold into ONE token — plus the `lg:grw` swap, `pop`, `trg(card)`, `scr`, `ico()`, `icc()`) at render time; the preset schema has no `nav`/`arrow`/`dot` fields (carousel controls are `media=` tokens). Collections: `data/card.presets.json` (canonical) and `data/card.presets.demo.json`. Content instances reference one via `"preset": { "$ref": "card-preset/hero" }` — swap the ref to restyle without touching content. Schemas live in `cms/baseline/models/` (`card.schema.json`, `card-preset.schema.json`).

`render.js` is a **string-producing SSR engine** — no `document`, runs unchanged in Node. `renderCard(ucf, presets, cards)` resolves the preset, dispatches on `preset.element` (`ui-card` | `ui-reveal` | `ui-media` | `ui-content`), and appends furniture tokens from the content (e.g. a `chip` field → `chip(ts) chip(green)` on `media=`). Everything passes through `esc()`. Demo data: `data/demo/*.json`, manifest `data/index.json`, driver `render.html`. Full walkthrough: `card.md`.

## ui/reveal — the sibling

`<ui-reveal>` (`ui/reveal/ui-reveal.css`) composes the **same engine** over native `<details>/<summary>` — it `@import`s `../card/ui-card.css`, so all three DSLs work unchanged. Front face lives in `<summary>` (wrapped in `<ui-face>` for flip/scale/slide), the revealed panel is the one element after `</summary>` (usually `<ui-content>`), animated via `::details-content`. Reveal-specific config is **`variant=` tokens** (the old `type`/`type-lg`/`from`/`to`/`trigger`/`scroll`/`icon`/`icon-close` attributes are removed): `exp` · `flp(top|btm|lft|rgt)` · `sld(top|btm|lft|rgt)` · `grw(ts|te|bs|be)` (the animation token carries its own direction/origin; type+from fold into one — `scl()` is the deprecated spelling of `grw()`), `lg:grw` (container-tier swap, was `type-lg`; **`grw` is the only animation with an `lg:` form**), `pop` (popup mode, was `to=`), `trg(card)`, `scr`, `ico(ts|te|bs|be|drk|sem|sm|lg)` one token per word, `icc(…)` same words for the open-state icon; native `<details name>` still handles exclusivity. Interactive furniture (`ui-save`/`ui-play`) is **invalid inside `<summary>`**; markers (`ui-chip`/`ui-sticker`/`ui-beacon`) are fine. Details: `ui/reveal/readme.md`, design rationale: `ui/reveal/plan.md`.

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

- **`<lay-out md= lg=>`** — *viewport* `@media` breakpoints (xs 240 / sm 380 / md 540 / lg 720 / xl 920 / xxl 1140 px) pick the section pattern and give each card a cell. Alignment is a per-breakpoint **builder token** inside those attributes: `items(start|center|end|stretch)`, e.g. `lg="columns(2) items(start)"` (the old standalone `items=` attribute is removed).
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
| `hover.js` | cursor-tracked `hov(track\|drift\|tilt)` — standalone, zero imports. (`ui-media.js` is **deleted**; this replaced it) |
| `carousel.js` | loop (seamless clones), autoplay, pause-on-slide-leave, per-slide `<ui-play>` video controls |
| `video.js` | embed facades, media-command polyfill, `vid()` player tools, solo play, opt-in tracking |
| `shared.js` | primitives shared by carousel.js/video.js — `reflectPlay`, `bindVideo`, token readers (`mediaStr`, `hasToken`), and the single exported slide-exclusion list `NOT_SLIDE`/`slidesOf` (cross-referenced from the `:not()` list in `media.carousel.css`) |
| `build.js` | `node build.js` → bundled+minified `*.min.js` per entry + gzip/brotli size table |
| `ui-media-srcset.js` | registers `<ui-media>`; host-gated Cloudflare `srcset` + loading/decoding upgrades. **Transitional** — retire once srcset is SSR'd |
| `srcset.js` | dependency-free Cloudflare Image Resizing URL builder |
| `render.js` | Node-safe SSR: JSON (UCF) → HTML string. Published (in `package.json` `files`/`exports`) together with `data/` |

## Conventions & pitfalls

1. **Hand-author `<cq-box>`** inside `<ui-card>` — nothing auto-inserts it.
2. **Never `innerHTML` with data** — `render.js` escapes everything via `esc()`; only `<b>` in headlines survives. Keep it that way.
3. **Direct-child scoping** — reveal rules use `> details > summary` so nested `<details>` don't inherit chrome; follow the same discipline (`:scope >`) in JS.
4. **Don't register elements CSS can drive** — only `<ui-media>` needs JS, and only for srcset.
5. **Demos use `<lay-out>`** — do not reintroduce per-page `.grid` classes; use the mapping table in `layout/docs/card-integration.md`.
6. **`ovr()` needs `scm`** (or a dark image) for contrast; themes go through the shared `theme=` axis ([base/theme.md](../base/theme.md)), not ad-hoc colors. (The old `variant="thm(…)"` spelling was removed in v4 — use `theme=`.)
7. **One position grid.** `ovr()`, furniture, `scm()`, `mrk()`, `plc()` and reveal's `ico()` all use the logical `ts tc te · cs cc ce · bs bc be` set. The physical `tl…br` aliases were **removed in v5**; `obp()` is now the system's *only* physical vocabulary (`object-position` has no logical keywords), and it keeps both spellings by design.
8. **One hue palette — nine hues.** `red orange green blue accent black white gray slate`: four hues plus the `white < gray < slate < black` neutral ramp. `slate` was promoted from alias to canonical in v5 (it always routed to its own `--ui-theme-slate-*` bundle, never to gray) and is implemented by all six furniture/band elements plus `tnt()`. The `dark`/`light`/`subtle` aliases were **removed** in the same round — no live alias remains. The real per-element gap is the `pale`/`muted` fill modifiers: `ui/save` and `ui/play` are single-ink controls and implement neither.
9. **`<ui-play>` has one contract:** `command="play-pause" commandfor="<video id>"`, handled by `video.js`. No `ui-play-toggle` event. The carousel's control is the one target-less exception, auto-discovered by `carousel.js`.

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
| `typography.md` | you want to *use* the type system — use-case guide to `scl()`, the relational size ladder, group sizes, fonts |
| `ui-card-tokens.md` | you need the `variant=` token / custom-property reference |
| `video.md` | integrating video providers / posters / facades |
| `../reveal/readme.md` + `../reveal/plan.md` | working on `<ui-reveal>` |
| `../../layout/AGENTS.md` | working on the layout system itself |
| `../../layout/docs/card-integration.md` | placing cards in layouts, srcset bridge, section presets |
| `../../cms/baseline/models/` | changing card / preset / layout-config schemas |
