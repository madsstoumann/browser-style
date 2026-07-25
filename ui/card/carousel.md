# `<ui-media>` Carousel

A **CSS-only** carousel for `<ui-media>`: a flex scroll-snap row with native
`::scroll-marker` dots and `::scroll-button()` arrows — **no JavaScript**. Driven by
a `media=` token string — the only configuration surface (see
[Configuring](#configuring)).

```html
<ui-media media="asr(16/9) nav">
  <img src="1.jpg" alt="">
  <img src="2.jpg" alt="">
  <img src="3.jpg" alt="">
</ui-media>
```

- **Children**: any number of `<img>` / `<video>`. Each becomes a full-bleed slide.
- **The `nav` token is the trigger** — without a `nav*` token `<ui-media>` is a
  plain single image, not a scroller.
- Requires `ui-card.css` loaded (it `@import`s `media.css` + `media.carousel.css`).

---

## Configuring

**`media=` tokens are the only form.** Parens-wrapped, prefixed tokens,
**substring-matched** — each token is atomic (one value per `token(…)`, never
grouped). Order never matters. The old dedicated `nav=` / `arrow=` / `dot=`
attributes are **removed**.

```html
<ui-media media="asr(16/9) nav(blw) arw(lg) arw(drk) mrk(be)"> … </ui-media>

<!-- or on the card host (propagates to the inner <ui-media>) -->
<ui-card media="asr(16/9) nav(blw) arw(lg) arw(drk)">
  <cq-box><ui-media> … </ui-media></cq-box>
</ui-card>
```

**Inheritance stops at the card.** A `<ui-media>` reads `media=` from **itself or its
nearest `<ui-card>` / `<ui-reveal>` host only** — the natural CMS vehicle (one attribute
on the card configures the inner media) — never from arbitrary ancestors. A `media=` on
a `<lay-out overflow>` scroller uses this **same control vocabulary**
(`<lay-out overflow media="nav(blw) arw(bare) pages">`) but configures only the
lay-out's **own** carousel; it never leaks into a descendant `<ui-media>`.

> **Shared ink scale.** Controls + scrim use one shade vocabulary: `lgt` (light/white) ·
> `drk` (dark/black) · `med` (scrim only). Arrows + markers use `lgt`/`drk`.

> **Gotcha (standalone):** don't put `overflow` / `display` on a bare `ui-media`
> selector in your own CSS — that beats the component's zero-specificity
> `:where()` rules and breaks the scroller. Style a wrapper instead.

---

## Browser support

The markers/arrows use `::scroll-marker-group` / `::scroll-button()` — **Chromium
only**, gated by `@supports (scroll-marker-group: after)`. Everywhere else it
**degrades gracefully** to a bare swipe/scroll-snap row (no markers/arrows).
`prefers-reduced-motion` is respected (no smooth scroll, no pill timer animation).

---

## Token reference

### `nav()` — which controls

| `media=` token | Result |
|----------------|--------|
| `nav` | Both **markers + arrows** (overlaid) |
| `nav(mrk)` | Markers only |
| `nav(arw)` | Arrows only |
| `nav(blw)` | Markers + arrows in a reserved **band below** the media |
| `nav(abv)` | Markers + arrows in a reserved **band above** the media (mirror of `nav(blw)`) |

### `axis()` — scroll direction

| `media=` token | Result |
|----------------|--------|
| *(default)* | Horizontal (snap on X) |
| `axis(y)` | **Vertical** carousel (column, snap on Y). Arrows become **up/down**; dots become a vertical column on the inline-end edge. Give the frame a portrait `asr()` so there's height to scroll. |

### `asr()` — aspect ratio of the frame

`asr(1/1)` · `asr(6/7)` · `asr(3/4)` · `asr(4/3)` · `asr(3/2)` · `asr(2/3)` ·
`asr(16/9)` · `asr(21/9)`

### `arw()` — arrows

| `media=` token | Result |
|----------------|--------|
| *(default)* | Chevron glyph (no token needed) |
| `arw(arr)` | Full arrow glyph (shaft + head) |
| `arw(lgt)` | **Light theme** — light circle + dark glyph (the default look, made explicit) |
| `arw(drk)` | **Dark theme** in one atom — dark circle + white glyph + light hover ring; composes on the overlay and in `nav(blw)`/`nav(abv)` bands. On `arw(bare)` it just paints a dark glyph |
| `arw(sm)` `arw(lg)` `arw(xl)` | Button size (default 2.25rem — no token) |
| `arw(bare)` | **Drop the circle** — render the glyph itself as a recolourable shape (`--ui-media-arrow-color`) |
| `arw(sqr)` `arw(sft)` | **Square** button instead of the default circle — `sqr` = sharp corners, `sft` = slight radius (`--ui-media-arrow-radius`) |
| `arw(set)` | Group both arrows as an **adjacent pair** (one cluster). Place it in any grid cell — `arw(set) arw(<cell>)`, e.g. `arw(set) arw(bs)` (bottom-start), `arw(set) arw(cc)` (dead center). Default `ce` (horizontal) / `be` (vertical) |
| `arw(hid)` | Auto-**hide** the dead-end arrow (default keeps it visible but dimmed) |
| `arw(rev)` | **Reveal on hover/focus** — arrows hidden until the media is hovered or keyboard-focused (also on the button's own `:focus-visible`). Gated on `@media (hover: hover)` so touch keeps them visible |
| `arw(tc)` `arw(cc)` `arw(bc)` | **Split arrows** vertical band — `cc` = centered default. (Inline part of the cell is ignored for split arrows; only the block row applies) |
| `arw(cs)` | `axis(y)`: a start-inline cell moves the up/down arrows (and marker column) to the inline-**start** edge (default is inline-end) |
| `arw(blw)` `arw(abv)` | Arrows **alone** in a reserved band below / above the media — markers keep their on-media position/ink; the arrow ink flips to the band theme |

> **Default look:** the overlay circle is Instagram-style — a frosted semi-transparent-white
> circle, dark chevron, soft shadow. `arw(lgt)` = that light theme; `arw(drk)` = the dark
> theme. Shape (`arw(arr)`) and theme (`lgt`/`drk`) compose, e.g. `arw(arr) arw(drk)`.
> One base SVG is **rotated** per direction (left 180°, up −90°, down 90°).

### Multiple items per slide — group wrappers

**Every direct child of `<ui-media>` is one slide** — an `<img>`/`<video>`, or any
**wrapper element** holding a group of items. The wrapper tag is not hardcoded: use
`<ui-slide>`, a layout-system element (`<lay-out>`), or a plain `<div>` — all behave
identically (one slide, one marker, snaps the whole group).

> **Exception — overlay furniture.** `<ui-chip>`, `<ui-sticker>`, `<ui-play>` and
> `<ui-save>` are *excluded*: they stay absolutely positioned over the frame and never
> become slides or get a marker. (Selector: `> :not(ui-chip, ui-sticker, ui-play, ui-save)`.)

**The carousel does NOT lay out items inside a slide** — that grid is yours (the layout
system, or your own class). The wrapper is just the snap-child container; it keeps its
own `display`, so a `<lay-out>` or `.slide-cols` element controls the inner columns.

```html
<!-- you own the grid (here a demo class with --cols) -->
<ui-media media="asr(21/9) nav">
  <ui-slide class="slide-cols" style="--cols: 3"><img src="1.jpg"><img src="2.jpg"><img src="3.jpg"></ui-slide>
  <ui-slide class="slide-cols" style="--cols: 3"><img src="4.jpg"><img src="5.jpg"><img src="6.jpg"></ui-slide>
</ui-media>
```
```css
.slide-cols { display: grid; gap: 1rem; grid-template-columns: repeat(var(--cols, 2), 1fr); }
.slide-cols > :is(img, video) { aspect-ratio: 1; block-size: 100%; inline-size: 100%; object-fit: cover; position: relative; inset: auto; }
```

A group can also hold full **`<ui-card>`s** — standard (content below) or layered
(content on the media). The carousel never leaks into a nested card's own
`<ui-media>`.

```html
<!-- standard cards (content below) -->
<ui-media media="nav">
  <ui-slide class="slide-cols" style="--cols: 3">
    <ui-card variant="col" media="asr(4/3)"><cq-box>
      <ui-media><img src="1.jpg"></ui-media>
      <ui-content><h3 data-part="headline">Title</h3></ui-content>
    </cq-box></ui-card>
    … two more …
  </ui-slide>
</ui-media>

<!-- layered cards (content on media — ui/reveal pattern: media + scm on the CARD) -->
<ui-media media="nav">
  <ui-slide class="slide-cols" style="--cols: 3">
    <ui-card variant="ovr(bl)" media="asr(3/4) obp(cc) scm"><cq-box>
      <ui-media><img src="1.jpg"></ui-media>
      <ui-content><h3 data-part="headline">Title</h3></ui-content>
    </cq-box></ui-card>
    … two more …
  </ui-slide>
</ui-media>
```

### `mrk()` — markers

| `media=` token | Result |
|----------------|--------|
| *(default)* | Circular dots (no token needed) |
| `mrk(pll)` | Rounded-rect pills; the active pill **fills L→R** over the autoplay duration as a timer hint |
| `mrk(hyb)` | **Hybrid** — markers stay circle dots; the active one morphs into a pill and runs the same fill timer as `mrk(pll)` |
| `mrk(bar)` | **Thin styled scrollbar** — one continuous hairline track spanning the container; the current slide's stretch renders thicker in the active ink (the thumb, 1/N of the width). Click-to-jump + keyboard-navigable. See [Styled scrollbar](#styled-scrollbar--mrkbar) |
| `mrk(lgt)` `mrk(drk)` | Ink — light / dark (`bg` + active). `nav(blw)`/`nav(abv)` default to dark |
| `mrk(sm)` `mrk(md)` `mrk(lg)` `mrk(xl)` | Size (`md` = default) — one scale for dots, pills **and** thumbnails, so `mrk(tmb) mrk(lg)` = large thumbnails. With `mrk(bar)` the scale sets the bar **width** instead: 33% · 50% · 75% (`lg` = default) · 100% |
| **In a band** — `mrk(bs/bc/be)` (below) · `mrk(ts/tc/te)` (above) | **Position within a band** — the row is locked by `nav(blw)`/`nav(abv)`, so the cell's inline letter aligns the markers: start / center (default) / end. Start/end clear the arrow on that side (or the `arw(set)` pair). |
| `mrk(bc)` | `axis(y)`: dots centered at the **bottom** (e.g. with a pill timer) |
| `mrk(non)` | **No dots** (keeps arrows) — e.g. an arrows-only `nav(blw)`/`nav(abv)` band |
| `mrk(blw)` `mrk(abv)` | Dots **alone** in a reserved band below / above the media — arrows keep their on-media position/ink; the marker/pill ink flips to the band theme |
| `mrk(tmb)` | **Image thumbnails** instead of dots. Each slide sets `--ui-media-thumb-url: url(…)`; the active thumb shows full opacity + (during **autoplay**) a bottom **timer** stripe that fills L→R over `--ui-media-autoplay`. Overlay in any corner (`mrk(ts/te/bs/be)`), or add `mrk(blw)`/`nav(blw)` for a **gallery filmstrip band** below (see below). |
| `mrk(ts)` `mrk(te)` `mrk(bs)` `mrk(be)` | **Corner placement** for the overlay marker-group — top-start / top-end / bottom-start / bottom-end (logical, RTL-safe). Center row `mrk(cs)` `mrk(cc)` `mrk(ce)` completes the 9-grid. Inset via `--ui-media-marker-inset`. |
| `mrk(rail)` | With `axis(y)` + `mrk(tmb)`: a **vertical thumbnail rail beside** the media (inline-start; **right in RTL**). Image keeps `asr()`, rail added outside; arrows dropped; overflow shrinks-to-floor then scrolls. See below. |
| `tmb(<ratio>)` | **Thumbnail aspect-ratio** (default `4/3`) — `tmb(1/1)` · `tmb(4/3)` · `tmb(3/4)` · `tmb(16/9)` · `tmb(3/2)` · `tmb(2/3)` (slash, mirrors `asr()`). In a `mrk(rail)` the rail width tracks the ratio. Or set `--ui-media-thumb-ratio` directly. |

### Thumbnail navigation — `mrk(tmb)`

Turn the marker-group into a **thumbnail rail**. Give each slide its own picture with a
custom property; place the rail in any corner:

```html
<ui-media media="asr(4/3) nav mrk(tmb) mrk(te)">
  <img src="1.jpg" style="--ui-media-thumb-url: url('1.jpg')">
  <img src="2.jpg" style="--ui-media-thumb-url: url('2.jpg')">
</ui-media>
```

**Filmstrip below (gallery)** — add `mrk(blw)` (or `nav(blw)` to keep arrows on the image)
to move the thumbnails into a reserved band **below** the media, like a classic image
gallery. The band auto-sizes to the thumb size (`mrk(sm|md|lg|xl)`); the cell's inline
letter aligns them (`mrk(bs)` left · `mrk(bc)` centre default · `mrk(be)` right). `mrk(abv)`
mirrors it above. In a band the image keeps its full `asr()` aspect-ratio (the band is added
outside via `box-sizing: content-box`) and each slide is rounded on **all four** corners to
`rds()`, floating as a card above the strip:

```html
<ui-media media="asr(16/9) rds(md) clip nav mrk(tmb) mrk(blw) mrk(lg)">
  <img src="1.jpg" style="--ui-media-thumb-url: url('1.jpg')">
  <img src="2.jpg" style="--ui-media-thumb-url: url('2.jpg')">
</ui-media>
```

**Thumbnail rail beside (`axis(y) mrk(rail)`)** — the inline analogue of `mrk(blw)`: a
**vertical thumbnail rail beside** an `axis(y)` (vertical) carousel — inline-start (left in
LTR, **right in RTL** automatically). The main image keeps its full `asr()` — the rail is
reserved *outside* it (`padding-inline-start` + `box-sizing: content-box`), not carved from
it. The rail is the navigation, so up/down arrows are dropped. Many thumbs shrink to a
readable floor (`--ui-carousel-thumb-min`), then the rail scrolls. Width via `--ui-carousel-rail`.

```html
<ui-media media="asr(4/3) rds(lg) clip axis(y) nav(mrk) mrk(tmb) mrk(rail) mrk(md)">
  <img src="1.jpg" style="--ui-media-thumb-url: url('1.jpg')">
  <img src="2.jpg" style="--ui-media-thumb-url: url('2.jpg')">
</ui-media>
```

Each slide can also be its own layered `<ui-card>` (unique headline/CTA per slide) — the
thumbnail is set on the **card**: `<ui-card style="--ui-media-thumb-url: url(…)">`. The
active thumb runs a bottom **timer** stripe synced to `--ui-media-autoplay` — but only while
**autoplay** is running (`ui-media.js` turns it on via `--ui-media-thumb-timer-name`; it's off
in pure CSS). (The URL uses a custom property today; it swaps to typed
`attr(data-thumb type(<image>))` once that's Baseline.)

### Styled scrollbar — `mrk(bar)`

Turn the marker-group into a **thin scrollbar**: a hairline track across the full
container width, with the current slide's segment drawn thicker in the active-marker
ink — the thumb. Every marker becomes an invisible, equal-width segment of the
track, so the thumb is automatically **1/N of the width**, clicking anywhere on
the track snaps to that slide, and the segments stay keyboard-focusable
(a focused segment shows a ring).

```html
<!-- overlaid on the media (light ink) -->
<ui-media media="asr(16/9) nav mrk(bar)"> … </ui-media>

<!-- the listing pattern: arrows top-right, full-width bar in a band below (dark ink) -->
<lay-out md="columns(3)" overflow media="nav arw(abv) arw(set) mrk(bar) mrk(xl) mrk(blw)"> … </lay-out>
```

- **Width** comes from the repurposed size scale: `mrk(sm)` 33% · `mrk(md)` 50% ·
  `mrk(lg)` 75% (**default**, no token needed) · `mrk(xl)` 100%. A partial-width
  bar is centered; pin it to an edge with the cell's inline letter —
  `mrk(bs)`/`mrk(ts)` = start, `mrk(be)`/`mrk(te)` = end. Fine-tune with
  `--ui-carousel-bar-span` (a **fraction**, e.g. `0.6` — it multiplies the
  scroller's `anchor-size()`, so it can't be a percentage).
- **Ink** follows the marker tokens — track = `--ui-carousel-marker-bg`, thumb =
  `--ui-carousel-marker-active` — so `mrk(lgt)`/`mrk(drk)` and the automatic dark
  flip in `nav(blw)`/`mrk(blw)`/`nav(abv)` bands just work.
- **Thickness / geometry tokens**: `--ui-carousel-bar-size` (thumb thickness,
  `3px`), `--ui-carousel-bar-track-size` (track thickness, `1px`) — bump these
  for a heavier bar; `--ui-carousel-bar-hit` (clickable strip height, `0.875rem`),
  `--ui-carousel-bar-inset` (inline inset from the container edges, `0px`).
- **Placement**: overlaid at the media's block-end by default (like dots); use the
  band atoms (`mrk(blw)`, `nav(blw)`, …) to move it under the media. Horizontal
  carousels only — `axis(y)` keeps its marker column.
- **Fallback**: where `::scroll-marker-group` is unsupported, the scroller keeps
  its **native thin scrollbar**, tinted via `scrollbar-color` with the active-marker
  ink — still thin, still interactive.

### `load()` — image/video loading (JS-applied)

| Token | Result |
|-------|--------|
| *(default)* | Every slide `loading="lazy"`, `decoding="async"`; video `preload="none"` |
| `load(eager)` | **All** slides eager, **first** slide gets `fetchpriority="high"` (hero); video `preload="auto"` |
| `load(lazy)` | All slides lazy (the default, made explicit) |

Applied by `ui-media-srcset.js`. Best practice: add `load(eager)` to the one
above-the-fold (hero) carousel; leave the rest default-lazy. Author
`loading`/`preload`/`srcset` attributes are never overwritten.

### `stagger` — staggered content reveal (pure CSS)

| Token | Result |
|-------|--------|
| `stagger` | Each slide's `<ui-content>` children fade + rise in, one after another, when the slide becomes the **snapped** (current) one — the hero-slider reveal |
| `ani(<type>)` | **Content** reveal type: `rise` (default) · `fall` · `lft` · `rgt` · `zom` · `blr` · `fde`. Set on the carousel or per **slide/card**. e.g. `media="stagger ani(zom)"` |
| `crd(<type>)` | **Card** reveal type (multi-card `<ui-slide>` slides) — same 7 types, **independent** of `ani()`. e.g. `media="stagger crd(rise)"` |

**No JavaScript.** Each slide is a `container-type: scroll-state` query container; a
`@container scroll-state(snapped: inline)` query reveals its content children with a
per-child `transition-delay`. Time-based, so the ~1s cascade is identical on autoplay,
arrow-click and swipe (it can't be scrubbed by scroll velocity) — the same technique as
[chrome.dev's slider](https://chrome.dev/carousel/horizontal/slider/). Needs a snapping
carousel (`nav`). Tune with the shared `--stagger-{begin,distance,duration,easing,step}`
tokens (also used by `ui-tabs`). Chromium-only (`scroll-state()`); elsewhere content just
shows. Off under `prefers-reduced-motion`.

**Reveal types** (shared by `ani()` and `crd()`): `rise` (from below, default) · `fall`
(from above) · `lft` / `rgt` (from the inline-start / -end) · `zom` (scale up) · `blr`
(blur + fade) · `fde` (plain fade).

**Two channels for multi-card slides.** When a slide is a `<ui-slide>` group of cards, the
**cards themselves** cascade in (`crd()`) *and* each card's **content** cascades within it
(`ani()`) — nested (card index, then child index), each with its own from-state. So the
cards can rise as units while a card's copy slides in independently:

```html
<ui-media media="nav stagger crd(rise)" style="--ui-media-gap: var(--spacing-lg)">
  <ui-slide class="slide-cols" style="--cols: 3">
    <ui-card media="asr(3/4) obp(cc) scm ani(lft)">…</ui-card>  <!-- content slides in -->
    <ui-card media="asr(3/4) obp(cc) scm ani(zom)">…</ui-card>  <!-- content zooms -->
    <ui-card media="asr(3/4) obp(cc) scm ani(fde)">…</ui-card>  <!-- content fades -->
  </ui-slide>
</ui-media>
```

`--ui-media-gap` (on the scroller) sets the space **between slides/pages** — default `0`
(flush); set e.g. `--ui-media-gap: var(--spacing-lg)` on multi-card carousels so pages
don't touch.

---

## Keyboard focus

The carousel `<ui-media>` is a keyboard-focusable scroller (arrow keys scroll it). On
`:focus-visible` it draws a **dashed ring** via `--ui-media-focus-*`:

- **Nested** in a `<ui-card>` / `<ui-reveal>` the ring is drawn on the **wrapper** (the
  whole card), via `:has()` — the scroller's own ring is suppressed.
- **Standalone** it rings the **media** itself.
- A slide's own **nested** `<ui-media>` never rings (only the outer scroller does).

Scroll buttons (arrows) and dots keep their **own** focus rings: the **circle** arrow uses
a real `outline` (`--ring-width` / `--ring-color` / `--ring-offset`); a **bare** glyph can't
outline (its `mask` clips it), so it scales to `--ui-media-arrow-hover-scale` on
`:focus-visible` instead, and the scroller's dashed ring carries the rest.

> **Clip + focus.** On a **clipped** standalone scroller (the `clip` frame token →
> `clip-path`) the clip would crop the outset ring, so on `:focus-visible` the element
> **drops `clip-path`** — the `border-radius` still rounds the frame while idle.
>
> **Clip + `nav(abv)`.** In a band-above layout the media's top is a straight internal
> edge under the band, so the band + media read as **one** rounded frame (rounded via
> `clip`). Don't round slide children individually — `border-radius` on scrolling content
> can drop mid-scroll.

---

## JavaScript behaviors (`ui-media.js`)

Two things CSS can't do are added by `ui-media.js` as **pure progressive
enhancement** — with JS off the carousel still scrolls, snaps, and shows
markers/arrows; these tokens simply no-op.

| Token | Needs JS | Result |
|-------|:--------:|--------|
| `auto` · `auto(4s)` · `auto(800ms)` | yes | Autoplay; advances one slide per interval (default 5s), seamlessly wraps. Pauses on hover / focus / drag / hidden tab / reduced-motion. Sets `--ui-media-autoplay` so a `mrk(pll)` timer stays in sync. |
| `loop` | yes | **Seamless** infinite loop — clones the first/last slide so next-past-the-last smooth-scrolls into a clone, then invisibly resets. Works with markers + arrows, both directions. |
| `play(<corner>)` + a `<ui-play>` child | yes | Explicit **play/pause** control. The button is `position:sticky`-pinned to the scrollport corner (plain furniture scrolls away with the slides). When present it becomes the **sole** pause mechanism — implicit hover/focus auto-pause is dropped, so the play↔pause glyph always matches state. Toggling sets `--ui-media-play-state` (`running`/`paused`), which also freezes the `mrk(pll)`/`mrk(tmb)` fill timer. Emits `ui-play-toggle`. Add `variant="reveal"` to hide until hover/focus. Needs `@browser.style/play` loaded. |

**Performance.** The script runs **one** `document.querySelectorAll` at idle for just
these tokens (`auto`, `loop`) — plain `<ui-media>` and CSS-only carousels never match,
so a page with hundreds of media items costs nothing. **No IntersectionObserver /
MutationObserver.** For content injected after load, call `window.uiMedia.scan()` to
re-run discovery.

---

## Custom properties

All optional — sensible defaults baked in. Set via `style="--token: value"` on the
`<ui-media>` (or any ancestor).

### Arrows

| Property | Default | Purpose |
|----------|---------|---------|
| `--ui-media-arrow-size` | `2.25rem` | Button size (or use `arw(sm/md/lg/xl)`) |
| `--ui-media-arrow-bg` | `rgb(255 255 255 / 0.7)` | Circle background — frosted semi-transparent white (Instagram-style default; `arw(drk)` flips it dark, `nav(blw)`/`nav(abv)` bands use a light grey) |
| `--ui-media-arrow-bg-hover` | `rgb(255 255 255 / 0.9)` | Circle background on hover (brightens) |
| `--ui-media-arrow-glyph` | chevron-dark | Glyph image (override directly, or use `arw(arr)`/`arw(lgt)`/`arw(drk)`) |
| `--ui-media-arrow-glyph-size` | `75%` (circle) / `80%` (bare) | Glyph size within the button |
| `--ui-media-arrow-nudge` | `calc(arrow-size * 0.03)` chevron · `* 0.015` full-arrow | **Optical** shift of the glyph toward its tip (a geometrically-centred chevron/arrow reads as off-centre). The full arrow needs less (its shaft balances it). Scales with size; set `0` to disable |
| `--ui-media-arrow-radius` | `--radius-circle` | Button corner radius |
| `--ui-media-arrow-border` | `0` | Button border — no ring on the default light circle (set e.g. `1px solid …` to add one) |
| `--ui-media-arrow-shadow` | `0 1px 3px rgb(0 0 0 / 0.15)` | Soft circle drop shadow — keeps the frosted circle legible over any photo (`nav(blw)`/`nav(abv)` bands set `none`; set `none` to drop) |
| `--ui-media-arrow-hover-ring` | = `--ui-media-arrow-shadow` | Circle `box-shadow` on hover — `arw(drk)` sets a light ring (`0 0 0 2px rgb(255 255 255 / 0.5)`) |
| `--ui-media-arrow-hover-scale` | `1.18` | Scale of a **bare** glyph on hover / `:focus-visible` |
| `--ui-media-arrow-gap` | `0.5rem` | Gap between the two arrows in `arw(set)` |
| `--ui-media-arrow-disabled-opacity` | `0.4` | Dimming of a dead-end arrow (`arw(hid)` sets `0`) |
| `--ui-media-arrow-color` | `#fff` (over image) / dark (in band) | **Bare** glyph ink (`arw(bare)`; the circle ignores it) |
| `--ui-media-arrow-color-hover` | = arrow-color | Bare glyph ink on hover (bands darken it) |
| `--ui-media-arrow-glyph-dim` | = `--ui-media-arrow-glyph` | Disabled **bare** glyph (kept dark/dimmed so the mask can drop without flashing a circle) |
| `--ui-media-arrow-top` | centered | Manual vertical position (or use `arw(top/mid/bot)`) |

### Markers / pills

| Property | Default | Purpose |
|----------|---------|---------|
| `--ui-media-marker-size` | `0.6rem` | Marker diameter (or `mrk(sm/md/lg/xl)`) |
| `--ui-media-marker-gap` | `0.5rem` | Gap between markers |
| `--ui-media-marker-bg` | `rgb(255 255 255 / 0.5)` | Inactive marker |
| `--ui-media-marker-active` | `#fff` | Active marker |
| `--ui-media-marker-border` | `0` | Marker border |
| `--ui-media-pill-width` | `1.5rem` | Pill width |
| `--ui-media-pill-height` | `0.35rem` | Pill height |
| `--ui-media-pill-track` | `rgb(255 255 255 / 0.35)` | Pill track (unfilled) |
| `--ui-media-pill-fill` | `#fff` | Pill fill (timer) |
| `--ui-media-autoplay` | `5s` | Pill / thumb timer duration (auto-set by `auto(Ns)`) |
| `--ui-media-play-state` | `running` | `running` / `paused` for the pill/thumb fill timer — `ui-media.js` sets `paused` when a `<ui-play>` control pauses autoplay |

### Thumbnails (`mrk(tmb)`)

| Property | Default | Purpose |
|----------|---------|---------|
| `--ui-media-thumb-url` | *(none)* | **Per-slide** thumbnail image — set on each slide/card (`url(…)`) |
| `--ui-media-thumb-size` | `2.25rem` | Thumbnail height (width follows `--ui-media-thumb-ratio`; or use `mrk(sm/md/lg/xl)`) |
| `--ui-media-thumb-ratio` | `4 / 3` | Thumbnail aspect-ratio |
| `--ui-media-thumb-border` | `2px solid #fff` | Thumbnail border (white by default) |
| `--ui-media-thumb-radius` | `--radius-sm` | Thumbnail corner radius |
| `--ui-media-thumb-bg` | `rgb(0 0 0 / 0.2)` | Placeholder behind the image |
| `--ui-media-thumb-opacity` | `0.55` | Inactive thumbnail opacity (active = `1`) |
| `--ui-media-thumb-timer` | `#fff` (matches the border) | Active-thumb bottom timer-stripe colour (separate from `--ui-media-thumb-border`) |
| `--ui-media-thumb-timer-height` | `3px` | Timer-stripe thickness |
| `--ui-media-thumb-timer-name` | `none` (off) | Fill-timer animation. **Off by default** — `ui-media.js` sets it to `ui-media-thumb-timer` when **autoplay** (`auto`/`loop`) runs. Set it to that keyframe manually to preview without JS. |
| `--ui-media-marker-inset` | `1rem` (thumb) / `--ui-media-overlay-gap` | Corner inset from the edges (`mrk(tl/tr/bl/br)`) |

### Control band (`nav(blw)` / `nav(abv)`)

| Property | Default | Purpose |
|----------|---------|---------|
| `--ui-media-band` | `2.75rem` | Band height |
| `--ui-media-below-gap` | `var(--spacing-sm, 0.5rem)` | Gap between the media content and a **below** band (`nav(blw)`) |
| `--ui-media-above-gap` | `var(--spacing-sm, 0.5rem)` | Gap between an **above** band (`nav(abv)`) and the media content |
| `--ui-media-controls-bg` | card surface | Band background |

> **Multi-item slides** (`<ui-slide>` groups) have **no carousel tokens** — the grid
> inside a slide is your own CSS / the layout system, not the carousel's job.

### Focus ring (scroller)

| Property | Default | Purpose |
|----------|---------|---------|
| `--ui-media-focus-width` | `2px` | Dashed focus-ring width on the scroller (or its wrapper) |
| `--ui-media-focus-offset` | `3px` | Focus-ring offset |
| `--ui-media-focus-color` | `var(--ring-color)` | Focus-ring colour |

### Layout / shared

| Property | Default | Purpose |
|----------|---------|---------|
| `--ui-media-overlay-gap` | `0.75rem` | Inset of overlaid controls from the edges |
| `--ui-media-gap` | `0` | Space between slides/pages (flush by default; set for multi-card slides) |

### Staggered reveal (`stagger` / `ani()` / `crd()`)

Global tokens (defined in `@browser.style/base`, shared with `ui-tabs`):

| Property | Default | Purpose |
|----------|---------|---------|
| `--stagger-begin` | `0s` | Lead-in delay before the first item (added to every item) |
| `--stagger-distance` | `5rem` | Travel distance (`rise`/`fall`/`lft`/`rgt` from-state) |
| `--stagger-duration` | `0.75s` | Per-item fade/move duration |
| `--stagger-easing` | `cubic-bezier(0.16, 1, 0.3, 1)` | Easing (swap for a spring/linear curve) |
| `--stagger-step` | `0.07s` | Delay added per item (per child, and per card) |

Per-item delay = `--stagger-begin + (index) * --stagger-step`, where *index* is the child
index (single-card slides) or `card-index + child-index` (multi-card slides). Private
from-state vars (`--_stg-*` content, `--_stg-crd-*` card) are set by `ani()` / `crd()` — not
authored directly.

---

## Recipes

```html
<!-- Default: dots + chevron arrows, overlaid -->
<ui-media media="asr(16/9) nav"> … </ui-media>

<!-- Full arrows, large, dark ink, pill timer dots -->
<ui-media media="asr(16/9) nav arw(arr) arw(drk) arw(lg) mrk(pll)"> … </ui-media>

<!-- Bare arrows (no circle), accent colour -->
<ui-media media="asr(16/9) nav(arw) arw(bare)"
          style="--ui-media-arrow-color: var(--color-accent)"> … </ui-media>

<!-- Controls in a band below; dots left, arrow pair right -->
<ui-media media="asr(16/9) nav(blw) arw(set) mrk(bs)"> … </ui-media>

<!-- Vertical carousel, up/down arrows on the right -->
<ui-media media="asr(3/4) axis(y) nav"> … </ui-media>

<!-- Vertical, arrow pair stacked bottom-left -->
<ui-media media="asr(3/4) axis(y) nav(arw) arw(set) arw(cs)"> … </ui-media>

<!-- lay-out carousel — same control tokens on the layout's OWN media= -->
<lay-out overflow media="nav(blw) arw(bare) pages"> … </lay-out>
```

See [`carousel.html`](./carousel.html) for live, copy-pasteable examples of every
configuration.
