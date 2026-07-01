# `<ui-media>` Carousel

A **CSS-only** carousel for `<ui-media>`: a flex scroll-snap row with native
`::scroll-marker` dots and `::scroll-button()` arrows — **no JavaScript**. Driven by
a `media=` token string **or** the dedicated `nav=` / `arrow=` / `dot=` attributes (see
[Two ways to configure](#two-ways-to-configure)).

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

## Two ways to configure

Every option works through **either** form — pick whichever fits:

**1. `media=` string (inheritable).** Parens-wrapped, prefixed tokens. **Substring-matched**
and **inherits down**, so it may sit on the `<ui-media>` **or any ancestor** `<ui-card>` —
the natural CMS vehicle (one attribute on the card configures the inner media).

```html
<ui-media media="asr(16/9) nav(blw) arw(lg) arw(drk) dot(end)"> … </ui-media>

<!-- or on an ancestor <ui-card> (propagates to the inner <ui-media>) -->
<ui-card media="asr(16/9) nav(blw) arw(lg) arw(drk)">
  <cq-box><ui-media> … </ui-media></cq-box>
</ui-card>
```

**2. `nav=` / `arrow=` / `dot=` attributes (grouped, self-only).** Space-separated,
whole-word values — no repeated prefix. Set them on the `<ui-media>` **itself only**;
they are **not** inherited (so they never need to sit on the parent card).

```html
<ui-media nav="blw" arrow="lg drk" dot="end"> … </ui-media>
```

The two snippets above render **identically**. The value is the same 3-letter code; only
the wrapper differs: `media="arw(drk)"` ≡ `arrow="drk"`, `media="dot(pll) dot(end)"` ≡
`dot="pll end"`, bare `media="nav"` ≡ boolean `nav`, `media="axis(y)"` ≡ `nav="y"`.
Order never matters.

> **Shared ink scale.** Controls + scrim use one shade vocabulary: `lgt` (light/white) ·
> `drk` (dark/black) · `sub` (subtle/low-contrast) · `med` (scrim only).

> **Gotcha (standalone):** don't put `overflow` / `display` on a bare `ui-media`
> selector in your own CSS — that beats the component's zero-specificity
> `:where()` rules and breaks the scroller. Style a wrapper instead.

---

## Browser support

The dots/arrows use `::scroll-marker-group` / `::scroll-button()` — **Chromium
only**, gated by `@supports (scroll-marker-group: after)`. Everywhere else it
**degrades gracefully** to a bare swipe/scroll-snap row (no dots/arrows). `nav(bar)`
works everywhere (it's just a styled native scrollbar). `prefers-reduced-motion`
is respected (no smooth scroll, no pill timer animation).

---

## Token reference

### `nav()` — which controls

| `media=` token | Attr form | Result |
|----------------|-----------|--------|
| `nav` | `nav` (boolean) | Both **dots + arrows** (overlaid) |
| `nav(dot)` | `nav="dot"` | Dots only |
| `nav(arw)` | `nav="arw"` | Arrows only |
| `nav(non)` | `nav="non"` | No controls — bare swipe scroller |
| `nav(blw)` | `nav="blw"` | Dots + arrows in a reserved **band below** the media |
| `nav(bar)` | `nav="bar"` | No dots/arrows — a styled **native scrollbar** is the only affordance |

### `axis()` — scroll direction

| `media=` token | Attr form | Result |
|----------------|-----------|--------|
| *(default)* | — | Horizontal (snap on X) |
| `axis(y)` | `nav="y"` | **Vertical** carousel (column, snap on Y). Arrows become **up/down**; dots become a vertical column on the inline-end edge. Give the frame a portrait `asr()` so there's height to scroll. |

### `asr()` — aspect ratio of the frame

`asr(1/1)` · `asr(6/7)` · `asr(3/4)` · `asr(4/3)` · `asr(3/2)` · `asr(2/3)` ·
`asr(16/9)` · `asr(21/9)`

### `arw()` — arrows

| `media=` token | Attr form | Result |
|----------------|-----------|--------|
| `arw(chv)` | `arrow="chv"` | Chevron glyph (**default**) |
| `arw(arr)` | `arrow="arr"` | Full arrow glyph (shaft + head) |
| `arw(lgt)` | `arrow="lgt"` | Light/white ink (**default**, for a dark circle) |
| `arw(drk)` | `arrow="drk"` | Dark/black ink (for light circles / light bands) |
| `arw(sub)` | `arrow="sub"` | **Subtle** low-contrast ink (light surfaces / `nav(blw)`) |
| `arw(sm)` `arw(md)` `arw(lg)` `arw(xl)` | `arrow="sm…xl"` | Button size (`md` = 2.25rem default) |
| `arw(bare)` | `arrow="bare"` | **Drop the circle** — render the glyph itself as a recolourable shape (`--ui-media-arrow-color`) |
| `arw(set)` | `arrow="set"` | Group both arrows as an **adjacent pair** at the end (horizontal: bottom/edge-end; vertical: stacked at block-end) |
| `arw(hid)` | `arrow="hid"` | Auto-**hide** the dead-end arrow (default keeps it visible but dimmed) |
| `arw(mid)` `arw(top)` `arw(bot)` | `arrow="mid/top/bot"` | Vertical placement of the edge arrows (`mid` = centered default) |
| `arw(sta)` | `arrow="sta"` | `axis(y)`: move the up/down arrows (and dot column) to the inline-**start** edge (default is inline-end) |

> Shape (`chv`/`arr`) and ink (`lgt`/`drk`/`sub`) are independent and compose,
> e.g. `arw(arr) arw(drk)` ≡ `arrow="arr drk"`. One base SVG is **rotated** per direction
> (left 180°, up −90°, down 90°) — no per-direction SVG duplication.

### Multiple items per slide — group wrappers

**Every direct child of `<ui-media>` is one slide** — an `<img>`/`<video>`, or any
**wrapper element** holding a group of items. The wrapper tag is not hardcoded: use
`<ui-slide>`, a layout-system element (`<lay-out>`), or a plain `<div>` — all behave
identically (one slide, one dot, snaps the whole group).

> **Exception — overlay furniture.** `<ui-chip>`, `<ui-sticker>`, `<ui-play>` and
> `<ui-save>` are *excluded*: they stay absolutely positioned over the frame and never
> become slides or get a dot. (Selector: `> :not(ui-chip, ui-sticker, ui-play, ui-save)`.)

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

### `dot()` — dots

| `media=` token | Attr form | Result |
|----------------|-----------|--------|
| `dot(cir)` | `dot="cir"` | Circular dots (**default**) |
| `dot(pll)` | `dot="pll"` | Rounded-rect pills; the active pill **fills L→R** over the autoplay duration as a timer hint |
| `dot(lgt)` `dot(drk)` `dot(sub)` | `dot="lgt/drk/sub"` | Ink — light / dark / **subtle** (`bg` + active). `nav(blw)` defaults to dark |
| `dot(sm)` `dot(md)` `dot(lg)` `dot(xl)` | `dot="sm…xl"` | Size (`md` = default) — one scale for dots, pills **and** thumbnails, so `dot(thumb) dot(lg)` = large thumbnails |
| `dot(sta)` `dot(ctr)` `dot(end)` | `dot="sta/ctr/end"` | **Position within a `nav(blw)` band** — left / center (default) / right. `sta`/`end` clear the arrow on that side (or the `arw(set)` pair). |
| `dot(thumb)` | `dot="thumb"` | **Image thumbnails** instead of dots. Each slide sets `--ui-media-thumb-url: url(…)`; the active thumb shows full opacity + a bottom **timer** stripe (fills L→R over `--ui-media-autoplay`, like pills). |
| `dot(tl)` `dot(tr)` `dot(bl)` `dot(br)` | `dot="tl/tr/bl/br"` | **Corner placement** for the overlay marker-group (top-left / top-right / bottom-left / bottom-right). Inset via `--ui-media-marker-inset`. |

### Thumbnail navigation — `dot(thumb)`

Turn the marker-group into a **thumbnail rail**. Give each slide its own picture with a
custom property; place the rail in any corner:

```html
<ui-media media="asr(4/3) nav dot(thumb) dot(tr)">
  <img src="1.jpg" style="--ui-media-thumb-url: url('1.jpg')">
  <img src="2.jpg" style="--ui-media-thumb-url: url('2.jpg')">
</ui-media>
```

Each slide can also be its own layered `<ui-card>` (unique headline/CTA per slide) — the
thumbnail is set on the **card**: `<ui-card style="--ui-media-thumb-url: url(…)">`. The
active thumb runs a bottom **timer** stripe synced to `--ui-media-autoplay`. (The URL uses a
custom property today; it swaps to typed `attr(data-thumb type(<image>))` once that's Baseline.)

### `load()` — image/video loading (JS-applied)

| Token / attr | Result |
|--------------|--------|
| *(default)* | Every slide `loading="lazy"`, `decoding="async"`; video `preload="none"` |
| `eager` (attr) | **First** slide `loading="eager"` + `fetchpriority="high"` (hero); rest lazy |
| `load(eager)` | **All** slides eager (+ first `fetchpriority="high"`); video `preload="auto"` |
| `load(lazy)` | All slides lazy |

Applied by `ui-media-srcset.js`. Best practice: add `eager` to the one above-the-fold
(hero) carousel; leave the rest default-lazy. Author `loading`/`preload`/`srcset`
attributes are never overwritten.

---

## JavaScript behaviors (`ui-media.js`)

Two things CSS can't do are added by `ui-media.js` as **pure progressive
enhancement** — with JS off the carousel still scrolls, snaps, and shows
dots/arrows; these tokens simply no-op.

| Token | Needs JS | Result |
|-------|:--------:|--------|
| `auto` · `auto(4s)` · `auto(800ms)` | yes | Autoplay; advances one slide per interval (default 5s), seamlessly wraps. Pauses on hover / focus / drag / hidden tab / reduced-motion. Sets `--ui-media-autoplay` so a `dot(pll)` timer stays in sync. |
| `loop` | yes | **Seamless** infinite loop — clones the first/last slide so next-past-the-last smooth-scrolls into a clone, then invisibly resets. Works with dots + arrows, both directions. |

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
| `--ui-media-arrow-bg` | `rgb(0 0 0 / 0.45)` | Circle background |
| `--ui-media-arrow-bg-hover` | `rgb(0 0 0 / 0.7)` | Circle background on hover |
| `--ui-media-arrow-glyph` | chevron-light | Glyph image (override directly, or use `arw(arr)`/`arw(drk)`) |
| `--ui-media-arrow-glyph-size` | `45%` (circle) / `80%` (bare) | Glyph size within the button |
| `--ui-media-arrow-radius` | `--radius-circle` | Button corner radius |
| `--ui-media-arrow-border` | `1px solid rgb(255 255 255 / 0.6)` | Button border (set `0` to drop) |
| `--ui-media-arrow-gap` | `0.5rem` | Gap between the two arrows in `arw(set)` |
| `--ui-media-arrow-disabled-opacity` | `0.4` | Dimming of a dead-end arrow (`arw(hid)` sets `0`) |
| `--ui-media-arrow-color` | `#fff` (over image) / dark (in band) | **Bare** glyph ink |
| `--ui-media-arrow-color-hover` | = arrow-color | Bare glyph ink on hover |
| `--ui-media-arrow-shadow` | `drop-shadow(0 1px 2px …)` | Bare glyph shadow (set `none` to drop) |
| `--ui-media-arrow-top` | centered | Manual vertical position (or use `arw(top/mid/bot)`) |

### Dots / pills

| Property | Default | Purpose |
|----------|---------|---------|
| `--ui-media-dot-size` | `0.6rem` | Dot diameter (or `dot(sm/md/lg/xl)`) |
| `--ui-media-dot-gap` | `0.5rem` | Gap between dots |
| `--ui-media-dot-bg` | `rgb(255 255 255 / 0.5)` | Inactive dot |
| `--ui-media-dot-active` | `#fff` | Active dot |
| `--ui-media-dot-border` | `0` | Dot border |
| `--ui-media-pill-width` | `1.5rem` | Pill width |
| `--ui-media-pill-height` | `0.35rem` | Pill height |
| `--ui-media-pill-track` | `rgb(255 255 255 / 0.35)` | Pill track (unfilled) |
| `--ui-media-pill-fill` | `#fff` | Pill fill (timer) |
| `--ui-media-autoplay` | `5s` | Pill / thumb timer duration (auto-set by `auto(Ns)`) |

### Thumbnails (`dot(thumb)`)

| Property | Default | Purpose |
|----------|---------|---------|
| `--ui-media-thumb-url` | *(none)* | **Per-slide** thumbnail image — set on each slide/card (`url(…)`) |
| `--ui-media-thumb-size` | `2.25rem` | Thumbnail height (width follows `--ui-media-thumb-ratio`; or use `dot(sm/md/lg/xl)`) |
| `--ui-media-thumb-ratio` | `4 / 3` | Thumbnail aspect-ratio |
| `--ui-media-thumb-border` | `2px solid #fff` | Thumbnail border (white by default) |
| `--ui-media-thumb-radius` | `--radius-sm` | Thumbnail corner radius |
| `--ui-media-thumb-bg` | `rgb(0 0 0 / 0.2)` | Placeholder behind the image |
| `--ui-media-thumb-opacity` | `0.55` | Inactive thumbnail opacity (active = `1`) |
| `--ui-media-thumb-timer` | `#fff` (matches the border) | Active-thumb bottom timer-stripe colour (separate from `--ui-media-thumb-border`) |
| `--ui-media-thumb-timer-height` | `3px` | Timer-stripe thickness |
| `--ui-media-marker-inset` | `1rem` (thumb) / `--ui-media-overlay-gap` | Corner inset from the edges (`dot(tl/tr/bl/br)`) |

### Below-band (`nav(blw)`)

| Property | Default | Purpose |
|----------|---------|---------|
| `--ui-media-band` | `2.75rem` | Band height |
| `--ui-media-below-gap` | `var(--spacing-sm, 0.5rem)` | Gap between media content and the band |
| `--ui-media-controls-bg` | card surface | Band background |

### Scrollbar (`nav(bar)`)

| Property | Default | Purpose |
|----------|---------|---------|
| `--ui-media-scrollbar-color` | `auto` | `"<thumb> <track>"`, e.g. `#ccc transparent` |
| `--ui-media-scrollbar-width` | `thin` | `auto` · `thin` · `none` |

> **Multi-item slides** (`<ui-slide>` groups) have **no carousel tokens** — the grid
> inside a slide is your own CSS / the layout system, not the carousel's job.

### Layout / shared

| Property | Default | Purpose |
|----------|---------|---------|
| `--ui-media-overlay-gap` | `0.75rem` | Inset of overlaid controls from the edges |

---

## Recipes

```html
<!-- Default: dots + chevron arrows, overlaid -->
<ui-media media="asr(16/9) nav"> … </ui-media>

<!-- Full arrows, large, dark ink, pill timer dots -->
<ui-media media="asr(16/9) nav arw(arr) arw(drk) arw(lg) dot(pll)"> … </ui-media>

<!-- Bare arrows (no circle), accent colour -->
<ui-media media="asr(16/9) nav(arw) arw(bare)"
          style="--ui-media-arrow-color: var(--color-accent)"> … </ui-media>

<!-- Controls in a band below; dots left, arrow pair right -->
<ui-media media="asr(16/9) nav(blw) arw(set) dot(sta)"> … </ui-media>

<!-- Vertical carousel, up/down arrows on the right -->
<ui-media media="asr(3/4) axis(y) nav"> … </ui-media>

<!-- Vertical, arrow pair stacked bottom-left -->
<ui-media media="asr(3/4) axis(y) nav(arw) arw(set) arw(sta)"> … </ui-media>

<!-- Plain native scrollbar, no dots/arrows -->
<ui-media media="asr(16/9) nav(bar)"> … </ui-media>
```

See [`carousel.html`](./carousel.html) for live, copy-pasteable examples of every
configuration.
