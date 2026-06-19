# @browser.style/card

> **NOTE:** Wrap the card's children in a `<cq-box>` grid layer. The host is the
> size container and a container can't query its own size, so the layout (and the
> responsive `variant-md` / `variant-lg` tiers) lives on this descendant. Same
> pattern as `ui-accordion` / `ui-tabs`. (An optional JS component could later
> auto-insert it; for now add it by hand.)

A CSS-first card engine. Every card is an arrangement of two structural
elements — `<ui-media>` and `<ui-content>` — so a card can be media-only,
content-only, media above/below content, or content over media (overlay).

Layout, aspect-ratio, object-position and font-size are controlled with
space-separated `variant` tokens. No JavaScript required.

The engine is **host-agnostic**: it keys off the `variant` attribute and the
`<ui-media>` / `<ui-content>` elements, never the `ui-card` tag. That lets other
components — like [`@browser.style/reveal`](../reveal) — `@import` this stylesheet
and inherit the whole layout/typography engine.

## Install

```bash
npm install @browser.style/card @browser.style/base
```

```css
@import '@browser.style/base';
@import '@browser.style/card';
```

`@browser.style/base` is a required peer dependency — it provides the global
design tokens (`--color-*`, `--spacing-*`, `--radius-*`, …).

## Anatomy

```html
<ui-card variant="vertical ar(16/9) fs(md)">
  <cq-box>
    <ui-media>
      <img src="…" alt="">
    </ui-media>
    <ui-content>
      <small data-part="eyebrow">Category</small>
      <h2 data-part="headline">Headline</h2>
      <p data-part="subheadline">Subheadline</p>
      <p data-part="summary">A short description.</p>
      <ul data-part="tags"><li><a href="#">Tag</a></li></ul>
      <nav data-part="actions"><a class="ui-button" href="#">Read</a></nav>
    </ui-content>
  </cq-box>
</ui-card>
```

Common parts are styled by the **`data-part`** attribute, not by tag name, so you
pick the semantically correct element for the context (a `<p>` in a card body, a
`<span>` inside a `<summary>`).

| `data-part` | Suggested element | Notes |
|-------------|-------------------|-------|
| `eyebrow` | `<small>` | category/kicker — uppercase, accent colour |
| `headline` | `<h2>`–`<h6>` (or any element with `data-part="headline"`) | uses the headline scale; headings get it automatically |
| `subheadline` | `<p>` / `<span>` | muted secondary line |
| `summary` | `<p>` | body copy |
| `byline` | `<address>` | author row; an `<img>` inside becomes a round avatar |
| `meta` | `<small>` | date, reading time |
| `caption` | `<small>` | media caption (place inside `<ui-media>`) |
| `ribbon` | `<span>` | media banner (place inside `<ui-media>`) — see [Media](#media--overlays-video-carousel) |
| `badge` | `<span>` | media sticker/pill (place inside `<ui-media>`) |
| `tags` | `<ul>` | pill list (style applies to `<a>` / `<li>`) |
| `actions` | `<nav>` | button / link row |
| `footer` | `<footer>` | trailing meta |

Headings (`h2`–`h6`) inside `<ui-content>` get the headline ramp without a
`data-part`. Everything not listed just inherits the body scale.

## Variant tokens

Put them all in one space-separated `variant` attribute.

### Arrangement

| Token | Result |
|-------|--------|
| *(none)* / `vertical` | media above content (default) |
| `vertical-r` | content above media |
| `horizontal` | media left, content right |
| `horizontal-r` | content left, media right |
| `media-only` | media fills; content hidden |
| `content-only` | no media box |
| `ov(pos)` | content stacked on media — 9 positions |

`ov(pos)` positions: `tl tc tr · cl cc cr · bl bc br`.

`ov()` only **stacks and places** the content over the media — it does *not*
darken the image. For legible text over a busy photo, add a **scrim** with
`sc()` (see below).

### Modifiers

| Token | Effect |
|-------|--------|
| `ar(16/9 \| 1/1 \| 4/3 \| 3/4 \| 3/2 \| 2/3 \| 21/9 \| square \| portrait \| landscape \| panorama)` | media aspect-ratio |
| `op(tl…br)` | image object-position (9 positions) |
| `fs(sm \| md \| lg \| xl)` | font-size tier (see below) |
| `p(none \| xs \| sm \| md \| lg \| xl \| 2xl)` | content padding (maps to `--spacing-*`) |
| `sp(1/1 \| 1/2 \| 2/1 \| 1/3 \| 3/1)` | column ratio for `horizontal` |
| `sq(sm \| md \| lg \| xl)` | superellipse (squircle) corners |
| `sc` / `sc(pos)` | scrim over media for overlaid text (see below) |
| `th(dark \| brand)` | colour theme (see below) |

## Media — overlays, video, carousel

`<ui-media>` is the media frame. By default it stacks a single `<img>` (or
`<video>`) edge-to-edge with `object-fit: cover`. It also takes overlays and a
multi-source carousel mode.

### Ribbon &amp; badge

Place a `data-part="ribbon"` or `data-part="badge"` **inside `<ui-media>`**. Both
are positioned with the same 9-code `pos()` system as `ov()` — `pos="tl tc tr ·
cl cc cr · bl bc br"` (default `tl`). `color="info | success | warning | error"`
maps the semantic palette.

```html
<ui-media>
  <img src="…" alt="">
  <span data-part="ribbon" pos="tl" color="error">Featured</span>
  <span data-part="badge"  pos="br" color="success">New</span>
</ui-media>
```

- **ribbon** — straight uppercase banner. Add `variant="diagonal"` for a 45°
  corner banner (corner positions `tl tr bl br` only; `ui-media`'s
  `overflow:hidden` clips the tails).
- **badge** — small pill sticker.

Tune with `--ui-card-ribbon-bg` / `--ui-card-ribbon-ink`, `--ui-card-badge-bg` /
`--ui-card-badge-ink`, and the shared `--ui-card-overlay-gap` (edge inset).
Diagonal ribbon: `--ui-card-ribbon-diag-width`, `--ui-card-ribbon-diag-offset`,
`--ui-card-ribbon-diag-pull`.

### Video

A `<video>` fills the frame exactly like an image (same `object-fit: cover`).
Use native attributes — no JS:

```html
<ui-media>
  <video src="clip.mp4" poster="poster.jpg" controls muted loop playsinline></video>
</ui-media>
```

### Carousel — `variant="carousel"`

Add the `carousel` token to put **multiple sources** in a horizontal
scroll-snap row (CSS scroller, no JS). Each child image/video snaps to the
frame. By default it also shows CSS-only navigation — a row of dots and
prev/next arrows — with no extra markup:

```html
<ui-card variant="carousel vertical ar(16/9)">
  <cq-box>
    <ui-media>
      <img src="1.jpg" alt=""><img src="2.jpg" alt=""><img src="3.jpg" alt="">
    </ui-media>
    <ui-content> … </ui-content>
  </cq-box>
</ui-card>
```

Use the [`controls`](#picking-controls--the-controls-attribute) attribute to
pick which controls show — including **`controls="none"`** for a bare swipe
scroller (no dots, no arrows). Overlays (`ribbon` / `badge`) stay pinned over
the scroller. There is no live "1 / N" counter — that would need JS.

### How it works — the scroll pseudo-elements

The carousel is built entirely from the CSS Overflow Level 5 scroll
pseudo-elements. The browser generates and wires them up; there is no
JavaScript and no extra markup. Four pieces are involved:

**1. `scroll-marker-group` (property) → `::scroll-marker-group` (pseudo).**
Set `scroll-marker-group: after` (or `before`) on the scroll container
(`<ui-media>`). The browser generates a `::scroll-marker-group` element — a
container that holds one marker per item and exposes itself to assistive tech
as a **tab list**. `after` puts it after the scroller in the DOM/a11y order.

**2. `::scroll-marker` (pseudo, on each item) → the dots.**
Every scroll-snap child that has `::scroll-marker { content: "" }` contributes
one marker to the group. Activating a marker (click, or ←/→ when the group has
focus) scrolls its item into view — that's the dot-to-slide jump, for free.
Markers also work on replaced elements, so bare `<img>` children get dots with
no wrapper.

**3. `:target-current` (pseudo-class) → the active dot.**
The browser sets `:target-current` on the marker whose item is currently
snapped. We use it to highlight the active dot:
`…::scroll-marker:target-current { background: … }`. (Siblings can be matched
with `:target-before` / `:target-after` if you want directional styling.)

**4. `::scroll-button()` (pseudo, on the scroller) → the arrows.**
`::scroll-button(left)` / `(right)` (also `up`/`down`/`block-start`/
`inline-end`/… or `*` for all) generate real `<button>`s that scroll the
container by one "page". Each one **only exists if its `content` is not
`none`** — that's why we set `content: "" / "Next"` (the empty string generates
the box; the `/ "Next"` part is the accessible name). The browser automatically
adds `:disabled` to a button when the scroller can't move further that way, so
the arrow hides itself at the first / last slide.

#### Positioning with `anchor()`

The marker group and buttons are children of the *scroll container*, so by
default an absolutely-positioned one is laid out against the scroller's
**content box** — i.e. the full, multi-page-wide scrollable area. Position them
with plain `inset` and they drift off-screen as you page.

The fix is anchor positioning: these scroll pseudos are **implicitly anchored
to their own scroll container's frame**. With `position-anchor: auto` you can
then use `anchor(left | right | center | top | bottom)` to pin them to the
*visible* media frame instead of the scrolled content:

```css
ui-media::scroll-button(left)  { left:  calc(anchor(left)  + 0.75rem); top: anchor(center); }
ui-media::scroll-button(right) { right: calc(anchor(right) + 0.75rem); top: anchor(center); }
ui-media::scroll-marker-group  { top: calc(anchor(bottom) - …); justify-self: anchor-center; }
```

Because the anchor is each pseudo's *own* scroller (not a named anchor),
**any number of carousels coexist on one page** with no `anchor-name`
collisions — nothing to declare or keep unique.

#### Smooth slide animation

The scroller sets `scroll-behavior: smooth`, so clicking an arrow or a dot
**slides** the next image in instead of jumping. It's wrapped in
`@media (prefers-reduced-motion: no-preference)`, so users who ask for less
motion get an instant jump. Native touch/trackpad swiping is unaffected either
way.

#### Why the arrow glyph is a background SVG

A font glyph (`‹`, `❮`, …) sits on the text baseline, not the box's geometric
centre, so it always looks slightly high even with `place-content: center`. The
chevron is instead a `background-image` SVG centred with
`background-position: center` — pure geometry, perfectly centred, typeface-
independent. `content: ""` keeps generating the button; the icon lives in the
background.

### Picking controls — the `controls` attribute

`variant="carousel"` shows **both** dots and arrows by default. Use the
**`controls`** attribute (a space-separated list of `dots` / `arrows`) to choose
which appear:

```html
<ui-card variant="carousel">…</ui-card>                          <!-- both (default) -->
<ui-card variant="carousel" controls="dots">…</ui-card>          <!-- dots only -->
<ui-card variant="carousel" controls="arrows">…</ui-card>        <!-- arrows only -->
<ui-card variant="carousel" controls="dots arrows">…</ui-card>   <!-- both -->
<ui-card variant="carousel" controls="none">…</ui-card>          <!-- bare swipe scroller -->
```

Any `controls` value without `dots`/`arrows` (e.g. `none`) yields a bare
scroller — there is no separate `gallery` variant; a carousel with its controls
turned off *is* the gallery.

### Theming the controls

Every colour, size and glyph is a token (override globally or per instance):

| Token | Default | Controls |
|-------|---------|----------|
| `--ui-card-dot-size` | `0.6rem` | dot diameter |
| `--ui-card-dot-bg` | `rgb(255 255 255 / 0.5)` | inactive dot |
| `--ui-card-dot-active` | `#fff` | active dot |
| `--ui-card-dot-border` | `0` | dot border |
| `--ui-card-dots-gap` | `0.5rem` | gap between dots |
| `--ui-card-arrow-size` | `2rem` | button diameter |
| `--ui-card-arrow-bg` / `--ui-card-arrow-bg-hover` | `rgb(255 255 255 / 0.75)` / `0.95` | button fill |
| `--ui-card-arrow-radius` | `50%` | button corner |
| `--ui-card-arrow-glyph-size` | `45%` | chevron size (`background-size`) |
| `--ui-card-arrow-prev` / `--ui-card-arrow-next` | `url(…chevron…)` | the chevron icon — a `url()` SVG |

The chevron is a centred **`background-image` SVG** (geometry, not a font
glyph), so it's pixel-centred regardless of typeface. Override the icon by
pointing `--ui-card-arrow-prev/-next` at your own `url()` — set the stroke/fill
*inside* the SVG (it's a background, so there's no `ink` token to tint it):

```html
<style>
  .svg-arrows {
    --ui-card-arrow-prev: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='18' height='18' viewBox='0 0 24 24' fill='none' stroke='%23fff' stroke-width='3' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M15 18l-6-6 6-6'/%3E%3C/svg%3E");
    --ui-card-arrow-next: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='18' height='18' viewBox='0 0 24 24' fill='none' stroke='%23fff' stroke-width='3' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M9 18l6-6-6-6'/%3E%3C/svg%3E");
  }
</style>
<ui-card class="svg-arrows" variant="carousel" controls="dots arrows">…</ui-card>
```

**Browser support:** the scroll-marker / scroll-button pseudo-elements are
Chromium-only (Chrome/Edge 135+) and **not** Baseline. This is progressive
enhancement: in Firefox/Safari `carousel` degrades to the plain swipe
scroller (dots/arrows simply don't appear). Everything is wrapped in
`@supports (scroll-marker-group: after)`.

> Avoid combining `carousel` with `ov()` overlay content — the flex scroller
> and the overlay grid-stack conflict. Use `carousel` with `vertical` /
> `horizontal` arrangements.

## Font scale — `fs()`

`fs(sm | md | lg | xl)` (default `md`) sets **two** container-driven (`cqi`)
`clamp()` scales: a **body** scale (`--ui-card-fs`, used by eyebrow / summary /
meta / tags) and a separate, more aggressive **headline** scale
(`--ui-card-headline`). Decoupling them means a big card gets a display-size
title while the body copy stays readable — e.g. on a wide `fs(xl)` hero the
headline lands around 4.5rem but the summary stays ~1.2rem.

```html
<!-- identical markup; the headline scales hard, the body gently -->
<ui-card variant="ov(bl) sc(bl) ar(21/9) fs(xl)"> … </ui-card>
```

Both scales also grow/shrink with the card's own width (bounded). `fs(xl)` is the
hero/display tier.

## Scrim — `sc()`

A **scrim** is a film/photography term: a translucent sheet placed in front of a
light to dim and diffuse it. In UI it's the semi-opaque gradient laid over an
image so overlaid text stays readable against a bright or busy photo. `sc` is the
two-letter token for it — pairing with `ov()` the same way `op()`/`ar()` do.

`ov()` and `sc()` are **two separate jobs**:

- `ov(pos)` — *places* the content over the media (stack + 9 positions). No
  darkening. Use it alone when the image is already dark or you want the card's
  own text colour.
- `sc` / `sc(pos)` — *paints* the darkening gradient and flips the overlaid text
  to light. Opt in only when you need the legibility boost.

```html
<!-- placed text, NO scrim -->          <ui-card variant="ov(bl) ar(16/9)"> … </ui-card>
<!-- placed text WITH bottom scrim -->  <ui-card variant="ov(bl) sc(bl) ar(16/9)"> … </ui-card>
```

Bare `sc` **auto-matches** the `ov()` position, so `ov(bl) sc` gives a
bottom-anchored scrim, `ov(tr) sc` a top-right diagonal one. Pass an explicit
`sc(pos)` to override the direction independently of the text placement.

`sc(pos)` directions use the same 9 codes as `ov()` — `tl tc tr · cl cc cr · bl
bc br`:

| code | gradient |
|------|----------|
| `bc` `tc` `cl` `cr` | linear from that edge, fading to transparent |
| `tl` `tr` `bl` `br` | diagonal from that corner |
| `cc` | a centred **band** (`transparent → colour → transparent`) that only covers text sitting in the middle |

Overlaid text defaults to **white** for both `ov()` and `sc()` (overlay-on-photo
is almost always dark imagery). Set `--ui-card-overlay-ink` when an image is light
and the text needs to go dark. Tune the scrim itself with `--ui-card-scrim-color`
(gradient colour, defaults to a fixed `rgb(0 0 0 / 0.65)` — intentionally *not* a
`CanvasText`-based token, so the scrim stays dark in dark mode instead of flipping
white).

```html
<ui-card variant="ov(cc) sc(cc)" style="--ui-card-scrim-color: rgb(20 0 40 / 0.7);"> … </ui-card>
```

## Themes — `th()`

`th(dark)` and `th(brand)` remap the card's colour tokens (surface, ink, eyebrow,
tags). Add as a `variant` token:

```html
<ui-card variant="vertical ar(16/9) th(dark)"> … </ui-card>
<ui-card variant="vertical ar(16/9) th(brand)"> … </ui-card>
```

Each theme value is overridable — e.g. `--ui-card-dark-bg`, `--ui-card-dark-ink`,
`--ui-card-dark-accent`, `--ui-card-brand-bg`, `--ui-card-brand-ink`.

## Responsive tiers — `variant-md` / `variant-lg`

Because the grid lives on `<cq-box>`, a card can react to **its own width**. Add
`variant-md` (applies at container width ≥ 25rem) and/or `variant-lg` (≥ 44rem)
alongside the base `variant`; they re-apply **arrangement, `ar()`, `fs()`,
`sp()`, `ov()`, `op()` and `sc`** at those breakpoints.

```html
<!-- vertical + small in a narrow grid cell; horizontal + larger when wide -->
<ui-card
  variant="vertical ar(16/9) fs(sm)"
  variant-md="horizontal sp(1/2) fs(md)"
  variant-lg="horizontal sp(1/3) fs(lg)">
  <cq-box> … </cq-box>
</ui-card>
```

The same markup renders differently in a hero slot vs. a 3-up grid — no media
queries, no JS.

### Responsive overlay hero

A card can be a **regular vertical card when narrow** and flip into an **overlay
hero when wide** — same markup:

```html
<ui-card variant="vertical ar(16/9)"
         variant-lg="ov(bl) sc ar(21/9) op(cc) fs(xl)">
  <cq-box>
    <ui-media><img src="…" alt=""></ui-media>
    <ui-content> … </ui-content>
  </cq-box>
</ui-card>
```

Below 44rem it's media-above-content with dark body text; at/above 44rem the
content stacks over the media with a scrim and a display-size headline. (`ov()`,
`op()` and bare `sc` are responsive; explicit `sc(pos)` per tier is not — bare
`sc` auto-matches the tier's `ov()` position.)

## Custom tokens

Override any component token, globally or per instance:

```css
ui-card { --ui-card-radius: 0; --ui-card-shadow: none; }
```

```html
<ui-card variant="vertical" style="--ui-card-headline: clamp(1.5rem, 4cqi, 3rem);"> … </ui-card>
```

Common ones: `--ui-card-bg`, `--ui-card-radius`, `--ui-card-shadow`,
`--ui-card-p`, `--ui-card-fs`, `--ui-card-headline`. Every content part also
exposes a font-size / colour / gap token (e.g. `--ui-card-eyebrow-fs`,
`--ui-card-byline-gap`).

```css
/* e.g. bump the eyebrow and tighten the byline */
ui-card { --ui-card-eyebrow-fs: 0.8rem; --ui-card-byline-gap: 0.25rem; }
```

**See [`ui-card-tokens.md`](ui-card-tokens.md) for the complete token reference**
— every knob, grouped by section, with defaults.

## Demo

`index.html` shows the engine end to end: article cards, responsive layout
switching (`variant-lg`), the `fs(xl)` hero, scrim overlay cards, the three
themes, and profile/product cards — with realistic content and images under
`assets/`.

## Notes

- **CSS-only.** No web component ships in this version — add `<cq-box>` by hand.
- **Schema.org** microdata and the 25 type-specific parts (price, rating,
  recipe steps, …) live at a higher layer and are not part of this engine.

## Used by

- [`@browser.style/reveal`](../reveal) — `@import`s `ui-card.css` and adds
  `<details>`/`<summary>` reveal animations on top of the shared engine.
