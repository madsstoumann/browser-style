# Card System — Agent Orientation

> Read this first when working on `ui/card`, `ui/reveal`, or anything that places cards inside the root `/layout` system. It explains the architecture and points to the detailed docs — it does not duplicate them.

## Overview

A CSS-first **universal card system**: one set of primitives renders articles, products, events, recipes, profiles and 25+ other content types. Everything is **light DOM, no Shadow DOM**; JavaScript is progressive enhancement only — every card works with CSS alone.

### Naming — read this once

**`<ui-card>` is the host. Its two areas are the *media area* and the *text area*.**

| Element | Attribute | Is | Is **not** |
|---|---|---|---|
| `<ui-card>` | `variant=` | the **host** — composition, arrangement, themes, container-query root | one of the two areas |
| `<ui-media>` | `media=` | the **media area** — the frame and its furniture | |
| `<ui-content>` | `content=` | the **text area** — eyebrow, headline, summary, byline, tags, actions | the card as a whole |

`<ui-content>` names the **text area only** — never the card. The word "content"
reads like the container to a newcomer, which is the one genuinely confusing thing
about these names, so the docs say **text area / text column** and reserve "content"
for the attribute and element spellings. Renaming it to `<ui-text>` was evaluated
and rejected — see `docs/plans/2026-08-03-card-system-structure-decision.md`
(~3,900 edits and a major version to buy a nicer word, while nothing else in the
system wants the name). What would reopen it: a second host that composes media +
text but is not a card. `<ui-reveal>` is not one — it *is* a card plus a flipside,
which is why it builds on the card engine instead of competing with it.

Each card has two areas:

- **`<ui-media>`** — the media frame: images, video, carousels, plus "furniture" overlaid on top (chips, beacons, stickers, save/play buttons).
- **`<ui-content>`** — the text area: eyebrow, headline, summary, byline, tags, actions… tagged with `data-part` and schema.org microdata.

They compose inside a host — `<ui-card>` (static) or `<ui-reveal>` (disclosure, in `ui/reveal`) — and the host adapts its internal arrangement to **its own width** via container queries, so the same markup works as a hero, a grid cell, or a sidebar item.

### Packages and load order

The engine spans four packages. Each ships a **peer-exclusive** bundle — one
`dist/*.css` per package, containing only that package's own CSS — so a `<link>`
consumer makes four **parallel** requests instead of walking a 3-4 deep `@import`
chain. Load them in dependency order:

```html
<link rel="stylesheet" href="…/@browser.style/base/dist/base.min.css">
<link rel="stylesheet" href="…/@browser.style/carousel/dist/carousel.min.css">  <!-- carousels only -->
<link rel="stylesheet" href="…/@browser.style/card/dist/card.min.css">
<link rel="stylesheet" href="…/@browser.style/reveal/dist/reveal.min.css">      <!-- ui-reveal only -->
```

Sources stay shipped and export-mapped, so cherry-picking a single sheet
(`@browser.style/card/media.css`) still works. **No package may `@import` another
package's CSS** — `scripts/css-bundle.js` reads esbuild's metafile and fails the
build if a bundle inlines a foreign file. `ui-reveal.css` used to pull in
`../card/ui-card.css`, which made every page linking both parse the card engine
twice; that is what the gate exists to prevent.

`@browser.style/carousel` holds the shared carousel controls (arrows, dots, pills,
thumbnails, bands) plus the Safari/Chromium DOM-control polyfill. It used to live in
`ui/base/carousel.css` — 65.7 kB in the package every component depends on, selecting
`ui-card`/`ui-reveal`/`ui-media`/`lay-out[overflow]` from the bottom of the stack.

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
| `<ui-save>`, `<ui-play>`, `<ui-lightbox>` | no | interactive furniture — `ui/save`, `ui/play`, `ui/lightbox` (view-gallery popover toggle) |
| `<ui-icon>` | no | reveal toggle icon — `ui/icon` |

Everything except `<ui-media>` is an **unregistered custom element** styled purely by CSS attribute selectors. Do not register elements CSS alone can drive.

## The three attribute DSLs

Space-separated token strings; values flow down via CSS custom properties, so a token may sit on the host or the primitive itself. **Scoping differs per DSL:** `media=` inheritance **stops at the card host** — a `<ui-media>` reads `media=` from itself or its nearest `ui-card`/`ui-reveal` only, never from other ancestors (a `media=` on a `<lay-out overflow>` drives the *layout's own* carousel and never leaks into descendant `<ui-media>`). Note what the rule does **not** stop: the boundary is the card host, not `<ui-media>`. In a **collage** (a `<lay-out>` grid of nested `<ui-media>` tiles inside a frame, see below) an outer `media="hov(zoom)"` still reaches the tiles — the flag setters match any `[media]` element and the flags inherit; only a nested `ui-card`/`ui-reveal` resets them. Put per-tile tokens on the tiles and expect frame-level ones to cascade. `content=` by contrast is pure custom-property inheritance and flows down freely — it works on `lay-out` / `lay-out-group` too.

| Attribute | On | Controls | Example tokens | Doc |
|---|---|---|---|---|
| `variant=` | `ui-card` / `ui-reveal` | composition (+ all reveal config on `ui-reveal` — `exp`/`flp()`/`sld()`/`grw()` etc., see below) | `col` `row` `col-r` `row-r` `spl(1/2)` `vis(media)` `ovr(bs)` `rds(lg-sq)` | `docs/ui-card-tokens.md` |
| `theme=` | `ui-card` / `ui-reveal` | shared theme axis (colour + `pale`/`muted`/`light`/`dark`) | `black dark` `red pale` `gray` | `../base/theme.md` |
| `media=` | `ui-media` or its card host (also `lay-out[overflow]` for its own scroller) | media frame + **all carousel controls (media-token-only — the old `nav=`/`arrow=`/`dot=`/`vid=`/`ply=`/`eager` attributes are removed)** | `asr(16/9)` `md:asr(4/3)` `obf()` `obp(cc)` `flp(h)` `hov(zoom)` `scm` `nav(mrk)` `arw(drk)` `mrk(pll)` `axis(y)` `auto` `loop` `stagger` `chip(ts)` `sticker(red)` `beacon(sld)` `marquee(bot)` `vid()` `play(lg)` `lightbox(bs)` `open:grid(3c)` `load(eager)` | `docs/media.md`, `docs/carousel.md`, `docs/media.carousel.md` |
| `content=` | `ui-content` (canonical) or ancestor | text column | `scl(lg)` `hl(3xl)` `eb(accent)` `tx(lgt)` `mt(med)` `pad(xl)` `lg:pbs(none)` `gap()` `rds(lg)` `scr` | `docs/content.md` |

## Container-query model (how cards respond)

The host (`ui-card`/`ui-reveal`) is an inline-size container **named `bs-card`** — `lay-out-group` joins the same namespace. A container can't query its own size, so the **host arm** of every rule targets the queryable descendant (`<cq-box>` in a card, `<summary>` in a reveal) via `:is(cq-box, summary)`, which is how card and reveal share one rule set (`ui-card.css`). Each `content=`/`asr()` rule also ships a **self arm** (`ui-content[content~=…]` / `ui-media[media~=…]`) so the attribute can sit on the primitive — the renderer's canonical placement. `variant=` gets no self arm: it arranges the two children.

Two tiers, driven by the **card's own rendered width**, not the viewport:

- `md:` → `@container bs-card (inline-size >= 25rem)` (400px)
- `lg:` → `@container bs-card (inline-size >= 44rem)` (704px)

The **name is load-bearing**: an unnamed size query resolves against the subject's nearest size container, so a self-armed primitive outside a card would switch tiers off an unrelated ancestor. A standalone `<ui-content>`/`<ui-media>` opts in with `<div style="container: bs-card / inline-size">`. `<lay-out>` deliberately stays a non-container so cards keep their own query root — which is also what lets a `<lay-out>` sit *inside* a `<ui-media>` (the collage, below) without stealing the card's tiers.

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

`render.js` is a **string-producing SSR engine** — no `document`, runs unchanged in Node. `renderCard(ucf, presets, cards)` resolves the preset, dispatches on `preset.element` (`ui-card` | `ui-reveal` | `ui-media` | `ui-content`), and appends furniture tokens from the content (e.g. a `chip` field → `chip(ts) chip(green)` on `media=`). Everything passes through `esc()`. Demo data: `data/demo/*.json`, manifest `data/index.json`, driver `demo/render.html`. Full walkthrough: `docs/card.md`.

## ui/reveal — the sibling

`<ui-reveal>` (`ui/reveal/ui-reveal.css`) composes the **same engine** over native `<details>/<summary>` — it `@import`s `../card/ui-card.css`, so all three DSLs work unchanged. Front face lives in `<summary>` (wrapped in `<ui-face>` for flip/scale/slide), the revealed panel is the one element after `</summary>` (usually `<ui-content>`), animated via `::details-content`. Reveal-specific config is **`variant=` tokens** (the old `type`/`type-lg`/`from`/`to`/`trigger`/`scroll`/`icon`/`icon-close` attributes are removed): `exp` · `flp(top|btm|lft|rgt)` · `sld(top|btm|lft|rgt)` · `grw(ts|te|bs|be)` (the animation token carries its own direction/origin; type+from fold into one — the old `scl()`/`lg:scl` spellings were removed in v5), `lg:grw` (container-tier swap, was `type-lg`; **`grw` is the only animation with an `lg:` form**), `pop` (popup mode, was `to=`), `trg(card)`, `scr`, `ico(ts|te|bs|be|drk|sem|sm|lg)` one token per word, `icc(…)` same words for the open-state icon; native `<details name>` still handles exclusivity. Interactive furniture (`ui-save`/`ui-play`) is **invalid inside `<summary>`**; markers (`ui-chip`/`ui-sticker`/`ui-beacon`) are fine. Details: `ui/reveal/readme.md`, design rationale: `ui/reveal/plan.md`.

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

Demo include pattern (see `demo/index.html`):

```html
<link rel="stylesheet" href="/layout/dist/layout.css">
<link rel="stylesheet" href="/ui/card/demo.layout.css">  <!-- shim: gap rhythm + body centering -->
<script type="module" src="/layout/polyfills/attr-fallback.js"></script>  <!-- Safari/FF gaps -->
```

Variant guidance for card lists: all `columns(N)` and `grid(N…)` variants are `repeatable` — safe for any card count. `asym()` and some `bento()`/`mosaic()` variants hide children beyond their pattern — only use when the item count matches.

**The third placement: a layout *inside* a frame (collage).** Besides arranging cards, `<lay-out>` can be a direct child of `<ui-media>`, turning one frame into a grid of nested `<ui-media>` tiles. No new tokens: `<lay-out>` breakpoint attributes (incl. the word-size spacing steps `2xs`…`2xl`) plus ordinary `media=` on the tiles. Two things make it hold together — `:where(ui-media:has(> lay-out)) { min-block-size: 0 }` drops the frame's height floor so it sizes to the grid, and `--layout-w` is registered non-inheriting so a nested layout never picks up an ancestor `bleed` section's viewport width. Adding `nav` to the outer frame makes each `<lay-out>` child a slide — a **CSS-only** collage carousel, since `slidesOf()` excludes `LAY-OUT`. Full pattern: [`docs/media.md` § Collage](docs/media.md#collage--a-lay-out-grid-inside-the-frame); demo `demo/media.collage.html`.

**The full integration roadmap** (remaining demo migration, srcset bridge, editor-ready section-preset JSON combining a layout config with per-item card-preset refs) lives in `layout/docs/card-integration.md`. Phase 1 is done: `ui/card/demo/cards.html` and `ui/reveal/index.html` use `<lay-out>`.

## JS modules (all optional, progressive enhancement)

| File | Purpose |
|---|---|
| `index.js` | all-in-one entry: imports the four chunks below, exports `scan()` (also `globalThis.uiMedia.scan`) |
| `hover.js` | cursor-tracked `hov(track\|drift\|tilt)` — standalone, zero imports. (`ui-media.js` is **deleted**; this replaced it) |
| `carousel.js` | loop (seamless clones), autoplay, pause-on-slide-leave, per-slide `<ui-play>` video controls |
| `video.js` | embed facades, media-command polyfill, `vid()` player tools, solo play, opt-in tracking |
| `lightbox.js` | popover-lightbox niceties, all gated on `ui-media[popover]` (moved from `ui/lightbox/command.js`): DOM carousel controls via `/ui/carousel/polyfill/carousel-controls.js`, `media-open=` swap, `--lightbox-layout`, View Transition morph, modality, back-button close, tile jump, pause-on-close |
| `shared.js` | primitives shared by carousel.js/video.js — `reflectPlay`, `bindVideo`, token readers (`mediaStr`, `hasToken`), and the single exported slide-exclusion list `NOT_SLIDE`/`slidesOf` (cross-referenced from the `:not()` list in `media.carousel.css`, which is a **subset**: `NOT_SLIDE` also drops `LAY-OUT`, so a collage `<lay-out>` slide snaps in CSS but is invisible to `loop`/`auto`/per-slide JS) |
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
8. **One hue palette — nine hues.** `red orange green blue accent black white gray slate`: four hues plus the `white < gray < slate < black` neutral ramp. `slate` was promoted from alias to canonical in v5 (it always routed to its own `--ui-theme-slate-*` bundle, never to gray) and is implemented by all six furniture/band elements plus `tnt()`. The `dark`/`light`/`subtle` aliases were **removed** in the same round — no live alias remains. The real per-element gap is the `pale`/`muted` fill modifiers: `ui/save`, `ui/play` and `ui/lightbox` are single-ink controls and implement none of them.
9. **`<ui-play>` has one contract:** `command="play-pause" commandfor="<video id>"`, handled by `video.js`. No `ui-play-toggle` event. The carousel's control is the one target-less exception, auto-discovered by `carousel.js`.
10. **`open:` is a whole-token STATE prefix, not a cq tier.** The family (`open:grid()`, bare `open:furniture`) arms only under `ui-media[popover]:popover-open` (the `<ui-lightbox>` lightbox, `media.lightbox.css`), is whole-matched, and lives in the manifest under names that *include* the prefix — deliberately not the `cqPrefixes` machinery. Never mint an `open:` spelling containing a substring-matched stem (`open:nav` would arm every closed carousel — fullscreen carousel is simply a `nav` frame's default open presentation). The popover's closed state relies on author-origin-beats-UA; do not "restore" `display` there. Native scroll-control pseudos do NOT follow a popover frame into the top layer (Chromium) — popover carousels get the /ui/carousel/polyfill/carousel-controls.js DOM controls via ui/card/lightbox.js, with the native pseudos suppressed on those frames only. The open state can switch into ANY existing nav style via the companion `media-open=` ATTRIBUTE (same element as media=) — an attribute precisely because the control stems are substring-matched; lightbox.js swaps only the control words of the media string on toggle and restores on close (JS-optional: without it the open lightbox keeps the closed nav style).

## Doc map — read this when…

| Doc | Read when… |
|---|---|
| `readme.md` | you need the public API / quick-start for `<ui-card>` |
| `docs/card.md` | working on the content model, presets, or `render.js` |
| `docs/media.md` | working on the media frame, furniture positioning, or video |
| `docs/media.carousel.md` | working on carousel internals (scroll-markers, dots, arrows) |
| `docs/stagger.md` | working on the stagger reveal engine (details / snap-carousel / scroll-driven adapters) |
| `docs/animations.md` | working on the keyframe library or the `[animate]`/`animate-self` scroll API |
| `docs/content.md` | working on the text column, `scl()`, `data-part`s, tag choice |
| `docs/typography.md` | you want to *use* the type system — use-case guide to `scl()`, the relational size ladder, group sizes, fonts |
| `docs/ui-card-tokens.md` | you need the `variant=` token / custom-property reference |
| `docs/video.md` | integrating video providers / posters / facades |
| `../reveal/readme.md` + `../reveal/plan.md` | working on `<ui-reveal>` |
| `../../layout/AGENTS.md` | working on the layout system itself |
| `../../layout/docs/card-integration.md` | placing cards in layouts, srcset bridge, section presets |
| `../../cms/baseline/models/` | changing card / preset / layout-config schemas |
