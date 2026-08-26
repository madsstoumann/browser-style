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

- **Children**: any number of `<img>` / `<video>` / `<picture>` / nested `<ui-media>`, or a
  `<ui-slide>` / `<div>` wrapper around a group. Each becomes a full-bleed slide. Overlay
  furniture, `<ui-marquee>` and `<lay-out>` are **not** slides — see
  [group wrappers](#multiple-items-per-slide--group-wrappers).
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

Every carousel token, its full argument vocabulary, the `--ui-carousel-*` / `--ui-media-*`
properties it writes, and the elements it may sit on are **generated from
`data/tokens.json`** — the manifest `render.js` and `tokens.lint.js` read, so this
inventory cannot drift from the CSS. The prose tables under it explain what the values
*do*; this one is the complete list.

<!-- tokens:summary attr=media stems=nav,arw,mrk,tmb,axis,auto,ani,crd,load,clip,loop,stagger,pages -->
| token | axis | args | aliases | bare | writes | md:/lg: | deprecated |
|---|---|---|---|---|---|---|---|
| `nav()` | carousel | **mode** mrk arw blw abv end non | — | yes | --ui-media-bg --ui-carousel-* | — | — |
| `arw()` | arrows | **variant** arr bare sqr sft lgt drk hid rev set · **size** sm lg xl · **pos** ts tc te cs cc bs bc be · **mode** blw abv | — | — | --ui-carousel-arrow-glyph --ui-carousel-arrow-size --ui-carousel-arrow-radius --ui-carousel-arrow-bg --ui-carousel-arrow-bg-hover --ui-carousel-arrow-color --ui-carousel-arrow-color-hover --ui-carousel-arrow-ink --ui-carousel-arrow-ink-hover --ui-carousel-arrow-plate --ui-carousel-arrow-plate-hover --ui-carousel-arrow-shadow --ui-carousel-arrow-hover-ring --ui-carousel-arrow-nudge --ui-carousel-arrow-disabled-opacity --ui-carousel-arrow-top --_arw-rot --_arw-scale | — | — |
| `mrk()` | markers | **variant** pll hyb bar tmb tml rail non lgt drk sbr lbl · **size** sm md lg xl · **pos** ts tc te cs cc ce bs bc be · **mode** blw abv | — | — | --ui-carousel-marker-size --ui-carousel-marker-bg --ui-carousel-marker-active --ui-carousel-marker-inset --ui-carousel-pill-width --ui-carousel-pill-height --ui-carousel-pill-track --ui-carousel-pill-fill --ui-carousel-thumb-size --ui-carousel-bar-* --ui-carousel-band --ui-carousel-rail --ui-carousel-sbr-* --ui-carousel-label-* --ui-carousel-tml-* | — | — |
| `tmb()` | thumbs | **ratio** 1/1 4/3 3/4 16/9 3/2 2/3 | — | — | --ui-carousel-thumb-ratio --ui-carousel-thumb-ratio-n | — | — |
| `axis()` | carousel | **value** y | — | — | — | — | — |
| `auto()` | carousel | **value** &lt;n&gt; &lt;n&gt;s &lt;n&gt;ms | — | yes | --ui-carousel-autoplay --ui-carousel-play-state --ui-carousel-thumb-timer-name --_play-block --_play-inline --_play-justify --_play-size | — | — |
| `ani()` | carousel | **anim** rise fall lft rgt zom blr fde | — | — | --_stg-tr --_stg-sc --_stg-fl --_stg-origin | — | — |
| `crd()` | carousel | **anim** rise fall lft rgt zom blr fde | — | — | --_stg-crd-tr --_stg-crd-sc --_stg-crd-fl | — | — |
| `load()` | loading | **mode** eager lazy | — | — | — | — | — |
| `clip` | corners | — | — | yes | --ui-media-radius | — | — |
| `loop` | carousel | — | — | yes | --_play-block --_play-inline --_play-justify --_play-size | — | — |
| `stagger` | carousel | — | — | yes | --_stg-base-i --_stg-crd-i | — | — |
| `pages` | carousel | — | — | yes | --_pg | — | — |
<!-- /tokens -->

### `nav()` — which controls

| `media=` token | Result |
|----------------|--------|
| `nav` | Both **markers + arrows** (overlaid) |
| `nav(mrk)` | Markers only |
| `nav(arw)` | Arrows only |
| `nav(blw)` | Markers + arrows in a reserved **band below** the media |
| `nav(abv)` | Markers + arrows in a reserved **band above** the media (mirror of `nav(blw)`) |
| `nav(end)` | Markers + arrows **inside the slides' content column**, at its end — `<lay-out overflow>` only. Every `<ui-content>` in the scroller grows its `padding-block-end` to *pbe · control row · pbe*, so the column's own end padding repeats above and below the controls; arrows align to the content's inline padding. Band ink (currentColor) — add `arw(drk)` for filled discs, `arw(sqr)`/`arw(sft)` for shape. Author the `content=` padding on the lay-out, not on a slide (the row reads it on the host). The scroller keeps `--ui-carousel-nav-end-room` (2.5rem) below the cards so their shadow is not clipped |
| `nav(non)` | **Scroller only, no controls** — a bare swipe carousel. The parenthesised arg suppresses the bare-`nav` needle (so neither dots nor arrows are declared) while the `nav` substring still enables the scroll-snap scroller |

### `axis()` — scroll direction

| `media=` token | Result |
|----------------|--------|
| *(default)* | Horizontal (snap on X) |
| `axis(y)` | **Vertical** carousel (column, snap on Y). Arrows become **up/down**; dots become a vertical column on the inline-end edge. Give the frame a portrait `asr()` so there's height to scroll. |

### `asr()` — aspect ratio of the frame

<!-- tokens:args attr=media stems=asr,tmb -->
| token | arg class | values | aliases |
|---|---|---|---|
| `asr()` | **ratio** | 1/1 1/2 6/7 3/4 4/3 3/2 2/3 16/9 21/9 | — |
| `tmb()` | **ratio** | 1/1 4/3 3/4 16/9 3/2 2/3 | — |
<!-- /tokens -->

`asr()` is the one `media=` token that takes the `md:` / `lg:` container-query prefixes
(`media="asr(3/4) md:asr(16/9)"`); `tmb()` sizes the `mrk(tmb)` thumbnails on the same
slash-ratio vocabulary.

### `arw()` — arrows

| `media=` token | Result |
|----------------|--------|
| *(default)* | Chevron glyph (no token needed) |
| `arw(arr)` | Full arrow glyph (shaft + head) |
| `arw(lgt)` | **Light theme** — light circle + dark glyph (the default look, made explicit) |
| `arw(drk)` | **Dark theme** in one atom — dark circle + white glyph + light hover ring; composes on the overlay and in `nav(blw)`/`nav(abv)` bands. On `arw(bare)` it just paints a dark glyph |
| `arw(sm)` `arw(lg)` `arw(xl)` | Button size (default 2.25rem — no token) |
| `arw(bare)` | **Drop the circle** — render the glyph itself as a recolourable shape (`--ui-carousel-arrow-color`). **Band arrows use this rendering by default** (that is how they follow the band ink); `arw(lgt)`/`arw(drk)` opt back out |
| `arw(sqr)` `arw(sft)` | **Square** button instead of the default circle — `sqr` = sharp corners, `sft` = slight radius (`--ui-carousel-arrow-radius`) |
| `arw(set)` | Group both arrows as an **adjacent pair** (one cluster). Place it in any grid cell — `arw(set) arw(<cell>)`, e.g. `arw(set) arw(bs)` (bottom-start), `arw(set) arw(cc)` (dead center). Default `ce` (horizontal) / `be` (vertical) |
| `arw(hid)` | Auto-**hide** the dead-end arrow (default keeps it visible but dimmed) |
| `arw(rev)` | **Reveal on hover/focus** — arrows hidden until the media is hovered or keyboard-focused (also on the button's own `:focus-visible`). Gated on `@media (hover: hover)` so touch keeps them visible |
| `arw(ts)` `arw(tc)` `arw(te)` `arw(cs)` `arw(cc)` `arw(bs)` `arw(bc)` `arw(be)` | **Placement cell.** The eight cells `arw()` implements — there is no `arw(ce)` (the inline-end column is `arw(set)`'s default) and no `arw(top)`/`arw(mid)`/`arw(bot)`. For **split** arrows only the block row is read: `tc` top · `cc` centered (**default**) · `bc` bottom. The inline letter matters for `arw(set)` and under `axis(y)` |
| `arw(cs)` | `axis(y)`: a start-inline cell moves the up/down arrows (and marker column) to the inline-**start** edge (default is inline-end) |
| `arw(blw)` `arw(abv)` | Arrows **alone** in a reserved band below / above the media — markers keep their on-media position/ink; the arrow ink follows the band (see *Automatic band ink*) |

> **Default look:** the overlay circle is Instagram-style — a frosted semi-transparent-white
> circle, dark chevron, soft shadow. `arw(lgt)` = that light theme; `arw(drk)` = the dark
> theme. Shape (`arw(arr)`) and theme (`lgt`/`drk`) compose, e.g. `arw(arr) arw(drk)`.
> One base SVG is **rotated** per direction (left 180°, up −90°, down 90°).

### Multiple items per slide — group wrappers

**Every direct child of `<ui-media>` is one slide, unless it is on the exclusion list** — so
an `<img>` / `<video>` / `<picture>` / nested `<ui-media>`, or any **wrapper element** holding
a group of items. The wrapper tag is not hardcoded: use `<ui-slide>` or a plain `<div>` — both
behave identically (one slide, one marker, snaps the whole group). Give the wrapper its own
`display` and the carousel leaves the inner layout alone.

> **Excluded — furniture, bands and control chrome.** The five overlay elements
> (`<ui-chip>`, `<ui-beacon>`, `<ui-sticker>`, `<ui-save>`, `<ui-play>`) and the
> `<ui-marquee>` band never become slides: they stay absolutely positioned over the frame and
> get no marker. The CSS selector is
> `> :not(ui-beacon, ui-chip, ui-marquee, ui-play, ui-save, ui-sticker)`; the JS list
> `NOT_SLIDE` in `shared.js` adds `UI-CAROUSEL-CONTROLS` (generated chrome) and **`LAY-OUT`**.
>
> **`<lay-out>` is a CSS slide, but not a JS slide — the two lists differ here on purpose.**
> The CSS `:not()` does *not* exclude it, so a direct `<lay-out>` child snaps and gets its own
> `::scroll-marker` like any other slide: that is the
> [collage carousel](./media.md#collage--a-lay-out-grid-inside-the-frame), a swipeable deck of
> grids with dots and **no JavaScript**. `slidesOf()` does exclude it, because a
> `<lay-out overflow>` is a scroller in its own right and counting it would make `loop` clone
> counts and autoplay indexing disagree with the markers.
>
> The consequence is a real limit, not a rough edge: on a `<lay-out>`-sliced carousel the
> JS-driven features — `loop`, `auto()`, per-slide `<ui-play>` video control, and the
> Safari controls polyfill's dots — find zero slides and **silently no-op**. Nothing breaks;
> nothing extra happens either. When you need any of them, use `<ui-slide>` or a `<div>` as
> the wrapper and put the grid *inside* it. Multi-card decks arranged **by** the layout system
> belong on `<lay-out overflow media="…">`, which runs the same control vocabulary on its own
> scroller.

**The carousel does NOT lay out items inside a slide** — that grid is yours. The wrapper is
just the snap-child container; it keeps its own `display`, so a `.slide-cols` class (or a
`<lay-out>` nested *inside* the wrapper) controls the inner columns. Use a nested `<lay-out>`
whenever the slide needs JS features; use `<lay-out>` *as* the slide only for the CSS-only
collage carousel above.

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

### Responsive page dissolve — `media="pages"` on a `<ui-media>` scroller

`pages` is one word with one intent — *"this carousel navigates by pages, and adapts
on mobile"* — and the mechanism follows from the markup shape. On a
`<lay-out overflow>` scroller it pages a **flat** card list by math (see the layout
docs: snap + dot per page of `columns(N)`, auto-adapting per breakpoint). On a
**`<ui-media>` scroller** it declares the `<lay-out>` children as **page wrappers**:

```html
<ui-media media="nav stagger crd(rise) pages">
  <lay-out md="columns(3)" stagger> …3 cards… </lay-out>
  <lay-out md="columns(3)" stagger> …3 cards… </lay-out>
</ui-media>
```

A **CSS-only** carousel (no `auto`/`loop`) may use `<lay-out>` grids as its page
wrappers — the CSS slide rules treat any non-furniture direct child as a slide; only
the JS features exclude `LAY-OUT`. Such a page (e.g. `md="columns(3)"`) has a mobile
problem: below the layout system's `md` viewport breakpoint the grid stacks, so one
slide becomes a tall three-card column. With `pages` on the scroller, **below `540px`**
each wrapper dissolves via `display: contents`: every card becomes its own full-width
snap target **with its own dot** — grandchild `::scroll-marker`s collect into the
scroller's marker group automatically, and a boxless wrapper generates none, so the
page dot vanishes for free. Above the breakpoint nothing changes: the page is one
slide, one dot.

Contract and limits (ui-media context):

- **CSS-only.** `slidesOf()` still counts the wrapper as **one** slide — `auto`/`loop`
  do not see through the dissolve. Use it on CSS-only carousels (like the stagger
  demos in `media.carousel.html#layoutgrids`).
- **Dot markers only** — the `pll`/`hyb`/`tmb`/`lbl` marker families stay
  per-direct-slide.
- **Stagger:** each dissolved card becomes its own `scroll-state inline-size`
  container (its `bs-card` size queries stay alive). The `ani()` content channel
  plays per-card — the same behaviour as a single-card slide; the `crd()` card
  channel is inert below the breakpoint (a container cannot restyle itself from its
  own query), and the card body is pinned visible.
- **Fixed breakpoint.** The dissolve happens below `md` (540px) — matching the
  common `md="columns(N)"` page pattern. The dissolve rule itself ships **unlayered**
  (the wrapper's `display: grid` comes from `@layer layout.base`, which outranks
  `bs-component`); the grandchild slide/marker/stagger arms stay layered.

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
    <ui-card variant="ovr(bs)" media="asr(3/4) obp(cc) scm"><cq-box>
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
| `mrk(lgt)` `mrk(drk)` | Ink — light / dark (`bg` + active). Bands don't need either: they ink themselves (see [Automatic band ink](#automatic-band-ink)) |
| `mrk(sm)` `mrk(md)` `mrk(lg)` `mrk(xl)` | Size (`md` = default) — one scale for dots, pills **and** thumbnails, so `mrk(tmb) mrk(lg)` = large thumbnails. With `mrk(bar)` the scale sets the bar **width** instead: 33% · 50% · 75% (`lg` = default) · 100% |
| **In a band** — `mrk(bs/bc/be)` (below) · `mrk(ts/tc/te)` (above) | **Position within a band** — the row is locked by `nav(blw)`/`nav(abv)`, so the cell's inline letter aligns the markers: start / center (default) / end. Start/end clear the arrow on that side (or the `arw(set)` pair). |
| `mrk(bc)` | `axis(y)`: dots centered at the **bottom** (e.g. with a pill timer) |
| `mrk(non)` | **No dots** (keeps arrows) — e.g. an arrows-only `nav(blw)`/`nav(abv)` band |
| `mrk(blw)` `mrk(abv)` | Dots **alone** in a reserved band below / above the media — arrows keep their on-media position/ink; the marker/pill ink follows the band (see *Automatic band ink*) |
| `mrk(tmb)` | **Image thumbnails** instead of dots. Each slide sets `--ui-carousel-thumb-url: url(…)`; the active thumb shows full opacity + (during **autoplay**) a bottom **timer** stripe that fills L→R over `--ui-carousel-autoplay`. Overlay in any corner (`mrk(ts/te/bs/be)`), or add `mrk(blw)`/`nav(blw)` for a **gallery filmstrip band** below (see below). |
| `mrk(ts)` `mrk(te)` `mrk(bs)` `mrk(be)` | **Corner placement** for the overlay marker-group — top-start / top-end / bottom-start / bottom-end (logical, RTL-safe). Center row `mrk(cs)` `mrk(cc)` `mrk(ce)` completes the 9-grid. Inset via `--ui-carousel-marker-inset`. |
| `mrk(rail)` | With `axis(y)` + `mrk(tmb)`: a **vertical thumbnail rail beside** the media (inline-start; **right in RTL**). Image keeps `asr()`, rail added outside; arrows dropped; overflow shrinks-to-floor then scrolls. See below. |
| `mrk(lbl)` | **Text-label pills** — each slide's `aria-label` becomes a pill (`content: attr(aria-label)`, the label analogue of `mrk(tmb)`'s per-slide image). Same nine placement cells; styled via the `--ui-carousel-label-*` custom properties (incl. an optional group plate). A long label set never spills: the group caps to the frame and **scrolls**, keeping the current label in view — see below |
| `mrk(tml)` | **Timeline** — a dot per slide on one continuous rail, labelled with the slide's `data-date` (`content: attr(data-date)`; the `aria-label` stays the accessible name, so a node can show `2016` while a screen reader hears the whole entry). Same nine placement cells; styled via `--ui-carousel-tml-*`. Pair with `mrk(blw)`/`nav(blw)` for a band, where the ink defaults to `CanvasText`. Like `mrk(lbl)`, a long series caps to the frame and **scrolls**, keeping the current node in view — see below |
| `mrk(sbr)` | **System bar (WIP)** — styles the scroller's **real** scrollbar as a full-width bottom bar instead of drawing a fake one, so it is natively draggable with zero JS. Central `--ui-carousel-sbr-*` tokens (`-track`, `-thumb`, `-size`, `-inset`, `-radius`, `-gap`) feed both the standard (Firefox `scrollbar-color`) and `::-webkit-scrollbar` paths; `content-box` like `mrk(tmb)`. See [media.carousel.md](./media.carousel.md) |
| `tmb(<ratio>)` | **Thumbnail aspect-ratio** (default `4/3`) — `tmb(1/1)` · `tmb(4/3)` · `tmb(3/4)` · `tmb(16/9)` · `tmb(3/2)` · `tmb(2/3)` (slash, mirrors `asr()`). In a `mrk(rail)` the rail width tracks the ratio. Or set `--ui-carousel-thumb-ratio` directly. |

### Automatic band ink

A band is **transparent** — it shows the card surface behind it, and that surface already
carries its own ink (`color` on the card: `--color-text`, or the `theme=` ink). So every
band control derives from **`--ui-carousel-controls-ink`, default `currentColor`**:

| Control | Derived value |
|---|---|
| Inactive dot / pill track | ink at 25% / 20% |
| Active dot / pill fill | ink at 70% |
| Arrow glyph | ink at 80% (full ink on hover) |
| Arrow hit area | ink at 8% (16% on hover) |

Band dots and arrows therefore follow `color-scheme` **and** `theme=` with no media query
and no `@supports` gate. Two consequences worth knowing:

- **Band arrows paint their own glyph** (the `arw(bare)` rendering) instead of drawing a
  circle behind a fixed image. A baked data-URI SVG can't be recoloured per scheme —
  painting the glyph is what lets it go light on a dark band. `arw(lgt)` / `arw(drk)` opt
  back out and keep their matched circle+glyph pair.
- To ink a **custom** band surface, set the surface and the ink together:
  `--ui-carousel-controls-bg: #123; --ui-carousel-controls-ink: white`. Individual
  `--ui-carousel-marker-*` / `--ui-carousel-arrow-*` overrides and
  `mrk(lgt)`/`mrk(drk)` still win over the derived defaults.

#### The furniture discs follow the arrows

`<ui-lightbox>` and `<ui-save>` sit **on the media**, next to the controls, so they take
their chrome from the same bundle the arrows use rather than from the document surface.
They were previously themed from `Canvas` / `--color-text`, which made them flip with
`color-scheme` while the arrows did not — a dark disc on a still-light photo.

Two tokens exist so a furniture disc can mirror an arrow exactly. They are **derived, not
authored** — there is no `media=` spelling for either:

| Token | Is | Why it is not `--ui-carousel-arrow-color` / `-bg` |
|---|---|---|
| `--ui-carousel-arrow-ink` | the ink the arrow glyph actually **draws** | `-color` only paints in the masked arm; elsewhere the ink is baked into the data-URI glyph (`#000` / `#fff` / `#555`), so `-color` holds a value that is never drawn — `#fff` in the default overlay bundle |
| `--ui-carousel-arrow-plate` | the disc the arrow actually **paints** | in the masked arm `mask` clips the box to the glyph, so the `-bg` disc is not rendered at all; masked bundles set `transparent` |

Both have a `-hover` twin. Off a carousel neither is declared, so the furniture falls back
to scheme-stable overlay chrome (white 70% disc, dark glyph) plus a hairline ring that
carousels suppress via `--ui-carousel-arrow-border: 0`.

Net effect per bundle — furniture and arrow agree in every one:

| Frame | Arrow | Disc + ink the furniture takes |
|---|---|---|
| overlay `nav` | white 70% circle, dark chevron | same |
| `nav(blw)` / `nav(abv)` / `arw(blw)` / `arw(abv)` | masked ink glyph, no circle | no disc, ink at 80% |
| `arw(drk)` | black 60% circle, light chevron | same |
| `arw(lgt)` | white 70% circle, dark chevron | same |
| `arw(bare)` | masked ink glyph, no circle | no disc, ink |
| no carousel | — | white 70% disc, dark glyph, hairline ring |

`lightbox(<hue>)` / `save(<hue>)`, `ink=` / `fill=` and `lightbox(non)` all still win over
the derived values — they are declared after this binding in the component sheets. While a
lightbox is **open**, the close button ignores all of it and pins light-on-dark, because the
fullscreen surface is always dark (`--ui-lightbox-open-c` / `-open-bg` retune it).

### Thumbnail navigation — `mrk(tmb)`

Turn the marker-group into a **thumbnail rail**. Give each slide its own picture with a
custom property; place the rail in any corner:

```html
<ui-media media="asr(4/3) nav mrk(tmb) mrk(te)">
  <img src="1.jpg" style="--ui-carousel-thumb-url: url('1.jpg')">
  <img src="2.jpg" style="--ui-carousel-thumb-url: url('2.jpg')">
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
  <img src="1.jpg" style="--ui-carousel-thumb-url: url('1.jpg')">
  <img src="2.jpg" style="--ui-carousel-thumb-url: url('2.jpg')">
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
  <img src="1.jpg" style="--ui-carousel-thumb-url: url('1.jpg')">
  <img src="2.jpg" style="--ui-carousel-thumb-url: url('2.jpg')">
</ui-media>
```

Each slide can also be its own layered `<ui-card>` (unique headline/CTA per slide) — the
thumbnail is set on the **card**: `<ui-card style="--ui-carousel-thumb-url: url(…)">`. The
active thumb runs a bottom **timer** stripe synced to `--ui-carousel-autoplay` — but only while
**autoplay** is running (`carousel.js` turns it on via `--ui-carousel-thumb-timer-name`; it's off
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

### `pages` — one marker per page (`<lay-out overflow>` only)

| Token | Result |
|-------|--------|
| *(default)* | One `::scroll-marker` per **item**, and each item is its own snap target |
| `pages` | One marker per **page** of `--_ci` items, and the scroller snaps page-by-page |

`pages` is the one `media=` token that exists **only** on `<lay-out overflow>` — never on a
`<ui-media>` frame. A layout carousel shows several cards at once (`--_ci`, the layout's own
items-per-view), so a marker per card would produce a dot row that doesn't match what a
swipe actually advances. `pages` collapses the two:

```html
<lay-out md="columns(3)" overflow media="nav(blw) arw(bare) mrk(bar) pages"> … </lay-out>
```

It is whole-token matched (`[media~="pages"]`) and implemented in `layout/core/base.css`
with `mod(sibling-index() - 1, --_ci)` + `if(style(--_pg: 0))`, writing the private `--_pg`.
Where `sibling-index()` / `if()` are unsupported it **degrades to per-item** markers — the
scroller still works, the dot count is just finer. Every other control token (`nav()`,
`arw()`, `mrk()`, `auto`, `loop`, `stagger`) behaves identically on a layout carousel and on
a `<ui-media>` one; `pages` is the only asymmetry.

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

> **Where it lives.** All of it — the `ani()`/`crd()` vocabulary arms, the
> `container-type: scroll-state` slide wiring, the `@container not scroll-state(snapped:
> inline)` from-state and the per-child delay — is in **[`ui/base/stagger.css`](../../base/stagger.css)**,
> the host-agnostic engine `ui-tabs`, `ui-reveal` and `ui-accordion` share.
> `media.carousel.css` contributes no stagger rules. Engine reference:
> [stagger.md](./stagger.md).

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
outline (its `mask` clips it), so it scales to `--ui-carousel-arrow-hover-scale` on
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

## JavaScript behaviors (`carousel.js`)

Two things CSS can't do are added by **`carousel.js`** as pure progressive
enhancement — with JS off the carousel still scrolls, snaps, and shows
markers/arrows; these tokens simply no-op.

Load it either way:

```js
import '@browser.style/card';             // index.js — hover + carousel + video
import '@browser.style/card/carousel.js'; // just this chunk
```

| Token | Needs JS | Result |
|-------|:--------:|--------|
| `auto` · `auto(4s)` · `auto(800ms)` | yes | Autoplay; advances one slide per interval (default 5s), seamlessly wraps. Pauses on hover / focus / pointer-down / hidden tab; never starts under reduced-motion. Sets `--ui-carousel-autoplay` so a `mrk(pll)` timer stays in sync. |
| `loop` | yes | **Seamless** infinite loop — clones the first/last slide so next-past-the-last smooth-scrolls into a clone, then invisibly resets. Works with markers + arrows, both directions. |
| `play(<pos>)` + a `<ui-play>` child | yes | Explicit **play/pause** control. The button is `position:sticky`-pinned to the scrollport corner (plain furniture scrolls away with the slides); an end-corner control (`play(*e)`) is moved to last child so sticky-inline-end can clamp. When present it becomes the **sole** pause mechanism — implicit hover/focus auto-pause is dropped, so the play↔pause glyph always matches state. Toggling sets `--ui-carousel-play-state` (`running`/`paused`), which also freezes the `mrk(pll)`/`mrk(tmb)` fill timer. Add `variant="reveal"` to hide until hover/focus. Needs `@browser.style/play` loaded for the element's own styling. |

> **No `ui-play-toggle` event.** The carousel control is auto-discovered by
> `carousel.js`, which binds the click directly and mirrors state back onto the
> `<ui-play>`. Elsewhere `<ui-play>` uses the invoker contract
> (`command="--play-pause" commandfor="…"`, handled by `video.js`). Either way the
> card system never listens for a `ui-play-toggle` event — see
> [media.md](./media.md#ui-play--one-contract).

**Slide counting.** "One slide" = a direct child that is **not** overlay furniture,
a band, a carousel control group, or a nested `<lay-out>` wrapper. That exclusion
list is exported **once**, as `NOT_SLIDE` in `shared.js`, and consumed by
`slidesOf()` — so `loop` clone counts and autoplay indexing can't drift apart. The
`:not()` list in `media.carousel.css` carries a cross-reference comment to it.

**Performance.** The chunk runs **one** `document.querySelectorAll` at idle for just
these tokens (`auto`, `loop`) — plain `<ui-media>` and CSS-only carousels never match,
so a page with hundreds of media items costs nothing. **No IntersectionObserver /
MutationObserver.** For content injected after load, call `globalThis.uiMedia.scan()`
to re-run discovery (owned by `index.js`; a solo chunk import registers its own).

---

## Custom properties

All optional — sensible defaults baked in. Set via `style="--token: value"` on the
`<ui-media>` (or any ancestor).

### Arrows

| Property | Default | Purpose |
|----------|---------|---------|
| `--ui-carousel-arrow-size` | `2.25rem` | Button size (or use `arw(sm/md/lg/xl)`) |
| `--ui-carousel-arrow-bg` | `rgb(255 255 255 / 0.7)` | Circle background — frosted semi-transparent white (Instagram-style default; `arw(drk)` flips it dark, `nav(blw)`/`nav(abv)` bands use a light grey) |
| `--ui-carousel-arrow-bg-hover` | `rgb(255 255 255 / 0.9)` | Circle background on hover (brightens) |
| `--ui-carousel-arrow-glyph` | chevron-dark | Glyph image (override directly, or use `arw(arr)`/`arw(lgt)`/`arw(drk)`) |
| `--ui-carousel-arrow-glyph-size` | `75%` (circle) / `80%` (bare) | Glyph size within the button |
| `--ui-carousel-arrow-nudge` | `calc(arrow-size * 0.03)` chevron · `* 0.015` full-arrow | **Optical** shift of the glyph toward its tip (a geometrically-centred chevron/arrow reads as off-centre). The full arrow needs less (its shaft balances it). Scales with size; set `0` to disable |
| `--ui-carousel-arrow-radius` | `--radius-circle` | Button corner radius |
| `--ui-carousel-arrow-border` | `0` | Button border — no ring on the default light circle (set e.g. `1px solid …` to add one) |
| `--ui-carousel-arrow-shadow` | `0 1px 3px rgb(0 0 0 / 0.15)` | Soft circle drop shadow — keeps the frosted circle legible over any photo (`nav(blw)`/`nav(abv)` bands set `none`; set `none` to drop) |
| `--ui-carousel-arrow-hover-ring` | = `--ui-carousel-arrow-shadow` | Circle `box-shadow` on hover — `arw(drk)` sets a light ring (`0 0 0 2px rgb(255 255 255 / 0.5)`) |
| `--ui-carousel-arrow-hover-scale` | `1.18` | Scale of a **bare** glyph on hover / `:focus-visible` |
| `--ui-carousel-arrow-gap` | `0.5rem` | Gap between the two arrows in `arw(set)` |
| `--ui-carousel-arrow-disabled-opacity` | `0.4` | Dimming of a dead-end arrow (`arw(hid)` sets `0`) |
| `--ui-carousel-arrow-color` | `#fff` (over image) / `--ui-carousel-controls-ink` at 80% (in band) | **Bare** glyph ink — used by `arw(bare)` **and by every band arrow**, which paints its own glyph (the circle ignores it) |
| `--ui-carousel-arrow-color-hover` | = arrow-color | Bare glyph ink on hover (bands go to the full ink) |
| `--ui-carousel-arrow-top` | centered | Manual vertical position (or use a placement cell — `arw(tc)` / `arw(cc)` / `arw(bc)` for split arrows, `arw(ts…be)` generally. There is no `arw(top)`/`arw(mid)`/`arw(bot)`) |

### Markers / pills

| Property | Default | Purpose |
|----------|---------|---------|
| `--ui-carousel-marker-size` | `0.6rem` | Marker diameter (or `mrk(sm/md/lg/xl)`) |
| `--ui-carousel-marker-gap` | `0.5rem` | Gap between markers |
| `--ui-carousel-marker-bg` | `rgb(255 255 255 / 0.5)` | Inactive marker |
| `--ui-carousel-marker-active` | `#fff` | Active marker |
| `--ui-carousel-marker-border` | `0` | Marker border |
| `--ui-carousel-pill-width` | `1.5rem` | Pill width |
| `--ui-carousel-pill-height` | `0.35rem` | Pill height |
| `--ui-carousel-pill-track` | `rgb(255 255 255 / 0.35)` | Pill track (unfilled) |
| `--ui-carousel-pill-fill` | `#fff` | Pill fill (timer) |
| `--ui-carousel-autoplay` | `5s` | Pill / thumb timer duration (auto-set by `auto(Ns)`) |
| `--ui-carousel-play-state` | `running` | `running` / `paused` for the pill/thumb fill timer — `carousel.js` sets `paused` when a `<ui-play>` control pauses autoplay |

> The four ink defaults above are the **overlay** values (white, for dots sitting on
> the image). In a **band** (`nav(blw)` `nav(abv)` `mrk(blw)` `mrk(abv)`) they are
> re-derived from `--ui-carousel-controls-ink` (default `currentColor`) at 25% / 70% /
> 20% / 70%, so band dots re-ink themselves for dark mode and `theme=` surfaces.
> `mrk(lgt)` / `mrk(drk)` still force either side explicitly.

### Thumbnails (`mrk(tmb)`)

| Property | Default | Purpose |
|----------|---------|---------|
| `--ui-carousel-thumb-url` | *(none)* | **Per-slide** thumbnail image — set on each slide/card (`url(…)`) |
| `--ui-carousel-thumb-size` | `2.25rem` | Thumbnail height (width follows `--ui-carousel-thumb-ratio`; or use `mrk(sm/md/lg/xl)`) |
| `--ui-carousel-thumb-ratio` | `4 / 3` | Thumbnail aspect-ratio |
| `--ui-carousel-thumb-border` | `2px solid #fff` | Thumbnail border shorthand (width + style) |
| `--ui-carousel-thumb-border-color` | `rgb(255 255 255 / 0.5)` | Inactive thumbnail border colour |
| `--ui-carousel-thumb-border-color-active` | `#fff` | Active thumbnail border colour — the default active/inactive signal |
| `--ui-carousel-thumb-radius` | `--radius-sm` | Thumbnail corner radius |
| `--ui-carousel-thumb-bg` | `rgb(0 0 0 / 0.2)` | Placeholder behind the image |
| `--ui-carousel-thumb-opacity` | `1` | Inactive thumbnail opacity. Thumbnails ship **fully opaque** and signal the active slide with `--ui-carousel-thumb-border-color-active` instead; set e.g. `0.55` to dim the inactive ones as well (active is always forced to `1`) |
| `--ui-carousel-thumb-timer` | `#fff` (matches the border) | Active-thumb bottom timer-stripe colour (separate from `--ui-carousel-thumb-border`) |
| `--ui-carousel-thumb-timer-height` | `3px` | Timer-stripe thickness |
| `--ui-carousel-thumb-timer-name` | `none` (off) | Fill-timer animation. **Off by default** — `carousel.js` sets it to the `ui-carousel-thumb-timer` keyframe when **autoplay** (`auto`/`loop`) runs. Set it to that keyframe manually to preview without JS. |
| `--ui-carousel-marker-inset` | `--ui-carousel-overlay-gap` (`1rem` under `mrk(tmb)`) | Corner inset from the edges (`mrk(ts/te/bs/be)`) |

### Labels (`mrk(lbl)`)

Per pill:

| Property | Default | Purpose |
|----------|---------|---------|
| `--ui-carousel-label-bg` / `-bg-current` | `transparent` / `rgb(255 255 255 / 0.25)` | Pill fill, idle / current |
| `--ui-carousel-label-color` / `-color-current` | `#fff` / *(inherits `-color`)* | Pill ink, idle / current |
| `--ui-carousel-label-border-width` | `1px` | Pill border width |
| `--ui-carousel-label-border-color` / `-border-color-current` | `rgb(255 255 255 / 0.6)` / `transparent` | Pill border colour, idle / current |
| `--ui-carousel-label-radius` | `--radius-pill` | Pill corner radius |
| `--ui-carousel-label-padding` | `0.4em 0.9em` | Pill padding |
| `--ui-carousel-label-font-size` | `--font-size-sm` | Pill type size |
| `--ui-carousel-label-font-weight` | `500` | Pill type weight |

On the group (the plate the pills sit in — off by default):

| Property | Default | Purpose |
|----------|---------|---------|
| `--ui-carousel-label-group-bg` | `transparent` | Group plate fill |
| `--ui-carousel-label-group-backdrop` | `none` | Group `backdrop-filter` — **no-op in Chrome today** (ignored on the `::scroll-marker-group` pseudo) |
| `--ui-carousel-label-group-shadow` | `none` | Group shadow |
| `--ui-carousel-label-group-radius` | `--radius-pill` | Group corner radius |
| `--ui-carousel-label-group-padding` | `0` | Group padding |
| `--ui-carousel-label-group-gap` | `--ui-carousel-marker-gap` | Gap between pills (also the scroll padding) |
| `--ui-carousel-label-group-max-inline-size` | `anchor-size(--ui-carousel-labels inline) - 2 × overlay-gap` | **Overflow cap** — the group never grows past the frame |
| `--ui-carousel-label-group-scrollbar` | `none` | `scrollbar-width` for the group scroller — set `thin` / `auto` to show it |
| `--ui-carousel-label-group-wrap` | `nowrap` | Set `wrap` to stack a long label set into rows instead of scrolling it |

### Timeline (`mrk(tml)`)

**Sizing, the short answer:** add a size atom — `mrk(tml) mrk(lg)` — and the node width,
the dot and the label all move one step together (`xl` also thickens the rail):

| Step | `-col` | `-dot-size` | `-font-size` |
|------|--------|-------------|--------------|
| `mrk(sm)` | `5.5rem` | `0.55rem` | `--font-size-xs` |
| `mrk(md)` *(default)* | `7rem` | `0.7rem` | `--font-size-sm` |
| `mrk(lg)` | `9rem` | `0.9rem` | `--font-size-base` |
| `mrk(xl)` | `11rem` | `1.1rem` | `--font-size-lg` (+ `3px` rail) |

Any single property still overrides the step — the atoms are declared at 0-0-0, so a class
or inline `--ui-carousel-tml-col` wins. Set the three below independently when the scale's
proportions aren't what you want.

Per node. Overlay defaults are the light pair (white on the image); in a band they
re-derive from `CanvasText`.

| Property | Default | Purpose |
|----------|---------|---------|
| `--ui-carousel-tml-col` | `7rem` | Node width (the `flex-basis` — also the dot-to-dot spacing) |
| `--ui-carousel-tml-dot-size` | `0.7rem` | Dot diameter |
| `--ui-carousel-tml-line-width` | `2px` | Rail thickness **and** the dot's ring width (`3px` at `mrk(xl)`) |
| `--ui-carousel-tml-gap` | `0.5rem` | Dot → label gap |
| `--ui-carousel-tml-rail` | `rgb(255 255 255 / 0.35)` | Rail colour |
| `--ui-carousel-tml-dot` | `rgb(255 255 255 / 0.6)` | Dot ring colour, idle |
| `--ui-carousel-tml-dot-bg` | `#0000` | Dot fill, idle — transparent, so an idle node reads as a ring |
| `--ui-carousel-tml-dot-current` | `#fff` | Current dot — **filled**, not ringed |
| `--ui-carousel-tml-color` / `-color-current` | `rgb(255 255 255 / 0.75)` / `#fff` | Label ink, idle / current |
| `--ui-carousel-tml-font-size` | `--font-size-sm` | Label type size |
| `--ui-carousel-tml-font-weight` / `-font-weight-current` | `500` / `--font-weight-bold` | Label type weight, idle / current |
| `--ui-carousel-tml-padding-inline` | `0.25rem` | Label side padding (does **not** inset the rail — the layers are `border-box`-origined) |
| `--ui-carousel-tml-radius` | `0` | Node corner radius (clips the background layers) |
| `--ui-carousel-tml-band` | `4.25rem` | Reserved band height under `mrk(blw)`/`mrk(abv)` — a token, since auto-height text can't be measured |
| `--ui-carousel-tml-inset` | `--ui-carousel-overlay-gap` | Corner inset |

On the group:

| Property | Default | Purpose |
|----------|---------|---------|
| `--ui-carousel-tml-group-bg` | `transparent` | Group plate fill — set one when overlaying a photo |
| `--ui-carousel-tml-group-radius` | `0` | Group corner radius |
| `--ui-carousel-tml-group-padding` | `0` | Group padding |
| `--ui-carousel-tml-group-max-inline-size` | `anchor-size(--ui-carousel-timeline inline) - 2 × overlay-gap` | **Overflow cap** — the group never grows past the frame |
| `--ui-carousel-tml-group-scrollbar` | `none` | `scrollbar-width` for the group scroller |

There is no group `gap` token: the group is pinned to `gap: 0` because the rail is drawn
per node, and any gap would break the stroke into dashes. Space nodes with
`--ui-carousel-tml-col`.

> **Long label sets never spill.** Labels are text, so a dozen of them outgrow any frame.
> The group therefore caps to the frame's inline size and becomes its own horizontal
> scroller — and because a `::scroll-marker-group` is a *scroll-target-group*, the browser
> keeps the current (`:target-current`) label scrolled into view by itself, with no JS.
> Mechanism and the browser caveats behind it: [media.carousel.md](./media.carousel.md).

### Control band (`nav(blw)` / `nav(abv)`)

| Property | Default | Purpose |
|----------|---------|---------|
| `--ui-carousel-band` | `2.75rem` | Band height |
| `--ui-carousel-below-gap` | `var(--spacing-sm, 0.5rem)` | Gap between the media content and a **below** band (`nav(blw)`) |
| `--ui-carousel-above-gap` | `var(--spacing-sm, 0.5rem)` | Gap between an **above** band (`nav(abv)`) and the media content |
| `--ui-carousel-controls-bg` | card surface | Band background |
| `--ui-carousel-controls-ink` | `currentColor` | Band control ink — the dot/pill defaults in a band derive from it (25% inactive, 70% active). The band is transparent, so `currentColor` *is* the ink of the surface showing through: it follows `color-scheme` and `theme=` automatically. Set this when you paint your own opaque `--ui-carousel-controls-bg`; set the individual `--ui-carousel-marker-*`/`--ui-carousel-pill-*` properties (or `mrk(lgt)`/`mrk(drk)`) to override just one |

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
| `--ui-carousel-overlay-gap` | `0.75rem` | Inset of overlaid **controls** (dots, arrows, thumb rail) from the frame edges |
| `--ui-media-overlay-gap` | `0.75rem` | Inset of overlaid **furniture** (chip/beacon/sticker/save/play) — the frame's token, not the carousel's |
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
          style="--ui-carousel-arrow-color: var(--color-accent)"> … </ui-media>

<!-- Controls in a band below; dots left, arrow pair right -->
<ui-media media="asr(16/9) nav(blw) arw(set) mrk(bs)"> … </ui-media>

<!-- Vertical carousel, up/down arrows on the right -->
<ui-media media="asr(3/4) axis(y) nav"> … </ui-media>

<!-- Vertical, arrow pair stacked bottom-left -->
<ui-media media="asr(3/4) axis(y) nav(arw) arw(set) arw(cs)"> … </ui-media>

<!-- lay-out carousel — same control tokens on the layout's OWN media= -->
<lay-out overflow media="nav(blw) arw(bare) pages"> … </lay-out>
```

See [`media.carousel.html`](../demo/media.carousel.html) for live, copy-pasteable examples of
every configuration.
