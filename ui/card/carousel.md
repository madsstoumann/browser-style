# `<ui-media>` Carousel

A **CSS-only** carousel for `<ui-media>`: a flex scroll-snap row with native
`::scroll-marker` dots and `::scroll-button()` arrows — **no JavaScript**. Driven
entirely by a `media=` token string.

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

## Where the `media=` attribute goes

Tokens are **substring-matched** and **inherit down**, so `media=` may sit on:

```html
<!-- on <ui-media> directly -->
<ui-media media="asr(16/9) nav arw(set)"> … </ui-media>

<!-- or on an ancestor <ui-card> (propagates to the inner <ui-media>) -->
<ui-card media="asr(16/9) nav arw(set)">
  <cq-box><ui-media> … </ui-media></cq-box>
</ui-card>
```

Both forms are fully supported for **every** configuration. Order of tokens in the
string doesn't matter.

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

| Token | Result |
|-------|--------|
| `nav` | Both **dots + arrows** (overlaid) |
| `nav(dots)` | Dots only |
| `nav(arrows)` | Arrows only |
| `nav(none)` | No controls — bare swipe scroller |
| `nav(below)` | Dots + arrows in a reserved **band below** the media |
| `nav(bar)` | No dots/arrows — a styled **native scrollbar** is the only affordance |

### `axis()` — scroll direction

| Token | Result |
|-------|--------|
| *(default)* | Horizontal (snap on X) |
| `axis(y)` | **Vertical** carousel (column, snap on Y). Arrows become **up/down**; dots become a vertical column on the inline-end edge. Give the frame a portrait `asr()` so there's height to scroll. |

### `asr()` — aspect ratio of the frame

`asr(1/1)` · `asr(6/7)` · `asr(3/4)` · `asr(4/3)` · `asr(3/2)` · `asr(2/3)` ·
`asr(16/9)` · `asr(21/9)`

### `arw()` — arrows

| Token | Axis | Result |
|-------|------|--------|
| `arw(chevron)` | — | Chevron glyph (**default**) |
| `arw(arrow)` | — | Full arrow glyph (shaft + head) |
| `arw(dark)` | — | Dark/black ink (for light circles / light bands) — default ink is white |
| `arw(sm)` `arw(md)` `arw(lg)` `arw(xl)` | — | Button size (`md` = 2.25rem default) |
| `arw(bare)` | — | **Drop the circle** — render the glyph itself as a recolourable shape (`--ui-media-arrow-color`) |
| `arw(set)` | both | Group both arrows as an **adjacent pair** at the end (horizontal: bottom/edge-end; vertical: stacked at block-end) |
| `arw(hide)` | — | Auto-**hide** the dead-end arrow (default keeps it visible but dimmed) |
| `arw(mid)` `arw(top)` `arw(bot)` | horizontal overlay | Vertical placement of the edge arrows (`mid` = centered default) |
| `arw(start)` | `axis(y)` | Move the up/down arrows (and dot column) to the inline-**start** edge (default is inline-end) |

> Shape (`chevron`/`arrow`) and ink (light/`dark`) are independent and compose,
> e.g. `arw(arrow) arw(dark)`. One base SVG is **rotated** per direction (left
> 180°, up −90°, down 90°) — no per-direction SVG duplication.

### Multiple items per slide — `<ui-slide>` groups

By default each direct child of `<ui-media>` is one slide. To show **multiple items
per slide**, wrap a group in a `<ui-slide>` element — that group becomes one slide and
the carousel snaps the whole group (one dot per group).

**The carousel does NOT lay out items inside a slide** — that grid is yours (the
layout system, or your own class). `<ui-slide>` is just the snap-child container.

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

| Token | Result |
|-------|--------|
| `dot(circle)` | Circular dots (**default**) |
| `dot(pill)` | Rounded-rect pills; the active pill **fills L→R** over the autoplay duration as a timer hint |
| `dot(sm)` `dot(md)` `dot(lg)` `dot(xl)` | Size (`md` = default) |
| `dot(start)` `dot(center)` `dot(end)` | **Position within a `nav(below)` band** — left / center (default) / right. `start`/`end` clear the arrow on that side (or the `arw(set)` pair). |

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
| `auto` · `auto(4s)` · `auto(800ms)` | yes | Autoplay; advances one slide per interval (default 5s), seamlessly wraps. Pauses on hover / focus / drag / hidden tab / reduced-motion. Sets `--ui-media-autoplay` so a `dot(pill)` timer stays in sync. |
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
| `--ui-media-arrow-glyph` | chevron-light | Glyph image (override directly, or use `arw(arrow)`/`arw(dark)`) |
| `--ui-media-arrow-glyph-size` | `45%` (circle) / `80%` (bare) | Glyph size within the button |
| `--ui-media-arrow-ring` | `0 0 0 1px …, 0 2px 6px …` | Frosted ring / shadow |
| `--ui-media-arrow-blur` | `4px` | Backdrop blur behind the circle |
| `--ui-media-arrow-radius` | `--radius-circle` | Button corner radius |
| `--ui-media-arrow-border` | `0` | Button border |
| `--ui-media-arrow-gap` | `0.5rem` | Gap between the two arrows in `arw(set)` |
| `--ui-media-arrow-disabled-opacity` | `0.4` | Dimming of a dead-end arrow (`arw(hide)` sets `0`) |
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
| `--ui-media-autoplay` | `5s` | Pill timer duration (auto-set by `auto(Ns)`) |

### Below-band (`nav(below)`)

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
<ui-media media="asr(16/9) nav arw(arrow) arw(dark) arw(lg) dot(pill)"> … </ui-media>

<!-- Bare arrows (no circle), accent colour -->
<ui-media media="asr(16/9) nav(arrows) arw(bare)"
          style="--ui-media-arrow-color: var(--color-accent)"> … </ui-media>

<!-- Controls in a band below; dots left, arrow pair right -->
<ui-media media="asr(16/9) nav(below) arw(set) dot(start)"> … </ui-media>

<!-- Vertical carousel, up/down arrows on the right -->
<ui-media media="asr(3/4) axis(y) nav"> … </ui-media>

<!-- Vertical, arrow pair stacked bottom-left -->
<ui-media media="asr(3/4) axis(y) nav(arrows) arw(set) arw(start)"> … </ui-media>

<!-- Plain native scrollbar, no dots/arrows -->
<ui-media media="asr(16/9) nav(bar)"> … </ui-media>
```

See [`carousel.html`](./carousel.html) for live, copy-pasteable examples of every
configuration.
