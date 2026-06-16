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
| `headline` | `<h2>`–`<h6>` or `<b>` | uses the headline scale; headings get it automatically |
| `subheadline` | `<p>` / `<span>` | muted secondary line |
| `summary` | `<p>` | body copy |
| `byline` | `<address>` | author row; an `<img>` inside becomes a round avatar |
| `meta` | `<small>` | date, reading time |
| `caption` | `<small>` | media caption (place inside `<ui-media>`) |
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
| `sp(1/1 \| 1/2 \| 2/1 \| 1/3 \| 3/1)` | column ratio for `horizontal` |
| `sq(sm \| md \| lg \| xl)` | superellipse (squircle) corners |
| `sc` / `sc(pos)` | scrim over media for overlaid text (see below) |
| `th(dark \| brand)` | colour theme (see below) |

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
alongside the base `variant`; they re-apply arrangement, `ar()`, `fs()` and
`sp()` tokens at those breakpoints.

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
queries, no JS. (`ov(pos)` / `sc(pos)` are not yet responsive; they can be
layered on the same pattern.)

## Custom tokens

Override any component token, globally or per instance:

```css
ui-card { --ui-card-radius: 0; --ui-card-shadow: none; }
```

```html
<ui-card variant="vertical" style="--ui-card-headline: clamp(1.5rem, 4cqi, 3rem);"> … </ui-card>
```

Key tokens: `--ui-card-bg`, `--ui-card-radius`, `--ui-card-shadow`, `--ui-card-p`,
`--ui-card-row-gap`, `--ui-card-fs`, `--ui-card-headline`,
`--ui-card-eyebrow-color`, `--ui-card-overlay-ink`, `--ui-card-scrim-color`.

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
