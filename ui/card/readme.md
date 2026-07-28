# @browser.style/card

A CSS-first **card engine**. `<ui-card>` is a thin **composition** over two primitives — `<ui-media>` (the media frame) and `<ui-content>` (the text column). Every card is an arrangement of those two: media above/below content, side by side, content overlaid on media, or a single part. Layout, overlay, theme and corners are driven by a compact `variant=` token string; the media and content are configured by their own `media=` / `content=` DSLs. Light DOM, no Shadow DOM, no JavaScript required.

> **Status:** shipped (v4). `<ui-card>` composes the `<ui-media>` + `<ui-content>` primitives per `docs/plans/2026-06-20-ui-media-content-split-design.md`. This documents the implemented API.

The three docs this file links to are authoritative for their surfaces:

- **[media.md](media.md)** — the `media=` DSL and the `--ui-media-*` tokens (frame, scrim, carousel, overlay furniture).
- **[content.md](content.md)** — the `content=` DSL, the `data-part` parts, and the `--ui-content-*` tokens.
- **[ui-card-tokens.md](ui-card-tokens.md)** — the card-level composition tokens (`variant=`, `ovr()`, `rds()`, host surface) and the shared `theme=` axis ([theme.md](../base/theme.md)).

---

## Install

```bash
npm install @browser.style/card
```

Peer dependency:

```bash
npm install @browser.style/base
```

> `@browser.style/base` is a required peer dependency — it provides the global design tokens (`--color-*`, `--spacing-*`, `--radius-*`, `--shadow-*`, …) that the card references. Because base is always present, no hardcoded fallbacks are needed.

The **overlay furniture** elements are separate packages — install only the ones you use inside `<ui-media>`:

```bash
npm install @browser.style/chip      # <ui-chip>    — label marker
npm install @browser.style/sticker   # <ui-sticker> — disc / burst marker
npm install @browser.style/save      # <ui-save>    — favorite toggle  (card-only)
npm install @browser.style/play      # <ui-play>    — play affordance  (card-only)
```

`<ui-play>` additionally peer-deps `@browser.style/icon` (its glyph is a `<ui-icon type="play">` sub-element).

---

## Usage

### CSS-only (vanilla HTML)

```html
<link rel="stylesheet" href="@browser.style/base/index.css">
<link rel="stylesheet" href="@browser.style/card/index.css">
```

Or via CSS `@import`:

```css
@import '@browser.style/base';
@import '@browser.style/card';
```

`index.css` imports `media.css` and `content.css`, so installing `card` brings both primitives' styles with it.

> **`<cq-box>` is required in CSS-only usage.** The card is the size container, and a container can't query its own size — so the layout grid (and the responsive `md:` / `lg:` tiers) lives on a queryable descendant. Wrap the card's children in `<cq-box>` by hand. (A web-component build auto-inserts it.)

### Web Component

A JS module, when imported, only registers the element and auto-inserts `<cq-box>`; the HTML is otherwise identical to CSS-only:

```js
import '@browser.style/card';
```

The frame, overlays, scrim, layout and marker controls are all pure CSS — JS is only progressive enhancement (carousel wiring, interactive `<ui-play>` / `hov(track)`).

---

## Quick start

### Minimal card (`col`)

Media above content — the default arrangement.

```html
<ui-card variant="col" media="asr(16/9)">
  <cq-box>
    <ui-media><img src="cover.jpg" alt="Cover"></ui-media>
    <ui-content>
      <small data-part="eyebrow">Web Development</small>
      <h2 data-part="headline">Mastering interactive popovers</h2>
      <p data-part="summary">Best practices, patterns and real-world examples.</p>
      <address data-part="byline"><img src="avatar.jpg" alt=""> Sarah Chen</address>
      <ul data-part="tags"><li><a href="#">UX</a></li><li><a href="#">A11y</a></li></ul>
    </ui-content>
  </cq-box>
</ui-card>
```

### Row card (media beside content)

```html
<ui-card variant="row spl(1/2)" media="asr(1/1)">
  <cq-box>
    <ui-media><img src="ergochair.jpg" alt="ErgoChair Pro"></ui-media>
    <ui-content>
      <small data-part="eyebrow">Best seller</small>
      <h2 data-part="headline">ErgoChair Pro</h2>
      <p data-part="subheadline">USD 349 · free shipping</p>
      <p data-part="summary">Adaptive lumbar support and a 12-year warranty.</p>
      <nav data-part="actions"><a class="ui-button" href="#">Add to cart</a></nav>
    </ui-content>
  </cq-box>
</ui-card>
```

### Overlay hero (`ovr()` + `scm`)

Content stacked over the media (`ovr(bs)`), a scrim for legibility (`scm` on `media=`), and a display-size headline (`scl(xl)` on `content=`).

```html
<ui-card variant="ovr(bs)" media="asr(16/9) obp(cc) scm" content="scl(xl)">
  <cq-box>
    <ui-media><img src="websummit.jpg" alt="Web Innovators Summit"></ui-media>
    <ui-content>
      <small data-part="eyebrow">Featured</small>
      <strong data-part="headline">Web Innovators Summit 2025</strong>
      <p data-part="summary">Two days exploring the future of the web — Oct 25–26.</p>
      <nav data-part="actions"><a class="ui-button" href="#">View agenda</a></nav>
    </ui-content>
  </cq-box>
</ui-card>
```

> `ovr()` only **stacks and places** content over the media — it does not darken the image. Add `scm` to `media=` for the legibility scrim; bare `scm` auto-matches the `ovr()` corner.

### Carousel

Multiple `<img>`/`<video>` inside `<ui-media>` + `nav()` — a CSS scroll-snap row with native markers + arrows. No JS.

```html
<ui-card variant="col" media="asr(16/9) nav" content="scl(lg)">
  <cq-box>
    <ui-media>
      <img src="1.jpg" alt="Slide 1">
      <img src="2.jpg" alt="Slide 2">
      <img src="3.jpg" alt="Slide 3">
    </ui-media>
    <ui-content>
      <small data-part="eyebrow">Travel</small>
      <h2 data-part="headline">Slow-travel carousel</h2>
      <p data-part="summary">Swipe, click an arrow or tap a dot — pure CSS scroll-markers.</p>
    </ui-content>
  </cq-box>
</ui-card>
```

---

## The three attributes

A card is configured by three independent token strings. `media=` / `content=` may sit on `<ui-card>` (they inherit down to the primitives) or directly on `<ui-media>` / `<ui-content>`. Note the scoping difference: `media=` inheritance **stops at the card** — a `<ui-media>` reads it from itself or its nearest `<ui-card>` / `<ui-reveal>` host only (a `media=` on a `<lay-out>` configures the layout's own scroller, never a nested `<ui-media>`), while `content=` is plain custom-property inheritance and flows down freely (it also works on `<lay-out>` / `<lay-out-group>`).

### `media=` — the media frame

Configures `<ui-media>`: aspect-ratio, fit/position, hover, scrim, carousel, and overlay furniture. Set it on the card or on `<ui-media>`.

| Token | Controls |
|-------|----------|
| `asr()` | aspect-ratio — the **only** `media=` token that takes `md:`/`lg:` prefixes |
| `obf()` | object-fit |
| `obp()` | object-position (9-grid) — logical `ts…be` **and** physical `tl…br`, both current |
| `flp()` | mirror the image |
| `hov()` | hover effect (image-only) — 17 values; only `track`/`drift`/`tilt` need JS |
| `rds()` | corners on a **standalone** `<ui-media>` (inside a card the card owns the radius) |
| `scm` / `scm()` | scrim — bare matches the host `ovr()`; direction picks a corner (furniture grid), size sets the extent, tone sets darkness. Three composable tokens, e.g. `scm(bc) scm(lg) scm(drk)` |
| `nav` / `nav()` | carousel — the token **is** the trigger; bare = markers + arrows. All carousel controls (`arw()`, `mrk()`, `tmb()`, `axis(y)`, `auto`, `loop`, `stagger`, `load()`) are `media=` tokens — see [carousel.md](carousel.md) |
| `chip()` `sticker()` `save()` `play()` | place + theme an overlay element — one atomic token per axis (`chip(te) chip(black)`, never `chip(te black)`) |

Argument vocabularies, **generated from `data/tokens.json`** so they can't drift from the CSS:

<!-- tokens:args attr=media stems=asr,obf,obp,flp,hov,rds,scm,nav -->
| token | arg class | values | aliases |
|---|---|---|---|
| `asr()` | **ratio** | 1/1 1/2 6/7 3/4 4/3 3/2 2/3 16/9 21/9 | — |
| `obf()` | **mode** | cover contain fill none | — |
| `obp()` | **pos** | ts tc te cs cc ce bs bc be tl tr cl cr bl br | — |
| `flp()` | **mode** | h v hv | — |
| `hov()` | **mode** | zoom pan track drift tilt tilt-out tilt-in rot-r rot-l shape shape-rev gray blur bright sat dim tint | — |
| `rds()` | **size** | non sm md lg xl 2xl full pill sm-sq md-sq lg-sq xl-sq | — |
| `scm()` | **pos** | ts tc te cs cc ce bs bc be | — |
| `scm()` | **size** | sm md lg xl | — |
| `scm()` | **tone** | shr lgt med drk sld | — |
| `nav()` | **mode** | mrk arw blw abv non | — |
<!-- /tokens -->

Overlay furniture — position, hue and each element's own axes:

<!-- tokens:matrix attr=media stems=chip,sticker,save,play classes=pos,hue,mode,size,disc -->
| token | pos | hue | mode | size | disc | deprecated aliases |
|---|---|---|---|---|---|---|
| `chip()` | ts tc te cs cc ce bs bc be | red orange green blue accent black white gray slate | pale muted | sm lg xl 2xl | non rnd pll crc sqr | — |
| `sticker()` | ts tc te cs cc ce bs bc be | red orange green blue accent black white gray slate | pale muted | sm lg xl 2xl 3xl | non rnd pll crc sqr | — |
| `save()` | ts tc te cs cc ce bs bc be | red orange green blue accent black white gray slate | — | sm lg xl | non rnd crc sqr | — |
| `play()` | ts tc te cs cc ce bs bc be | red orange green blue accent black white gray slate | — | sm md lg xl | non rnd pll crc sqr | — |
<!-- /tokens -->

`<ui-beacon>` and `<ui-marquee>` take the same shape with extra axes of their own — full matrix in [media.md](media.md).

```html
<ui-card variant="col" media="asr(4/3) obp(cc) hov(zoom) chip(be) chip(green)"> … </ui-card>
```

Every token just writes a `--ui-media-*` custom property, so any value with no token has a `style="--ui-media-*"` escape hatch. **Full surface, tokens and behavior:** see **[media.md](media.md)**.

### `content=` — the text column

Configures `<ui-content>`: type scale, padding, gap, scroll. Set it on the card or on `<ui-content>`.

| Token | Args | Controls | `md:` / `lg:` |
|-------|------|----------|---------------|
| `scl()` | `sm md lg xl` | type-scale step (body **and** headline) | No |
| `pad()` | `none xs sm md lg xl 2xl` | content padding | Yes |
| `gap()` | `none xs sm md lg` | row gap between parts | Yes |
| `scr` | *(bare flag)* | scrollable column with edge-fade mask | No |

Content **parts** are styled by `data-part`, never by tag — pick the semantically correct element for the context:

| `data-part` | Suggested element | Notes |
|-------------|-------------------|-------|
| `eyebrow` | `<small>` | uppercase, tracked, accent kicker |
| `headline` | `<h2>`–`<h6>` (bare headings get it too) | headline type ramp |
| `subheadline` | `<p>` | muted secondary line |
| `summary` | `<p>` | body / lede |
| `meta` / `caption` | `<small>` / `<figcaption>` | small muted line (caption may go inside `<ui-media>`) |
| `byline` | `<address>` | author row; inner `<img>` becomes a round avatar |
| `tags` | `<ul>` | pill list (`<li>` / `<a>` render as pills) |
| `actions` | `<nav>` / `<div>` | button / link row |
| `footer` | `<footer>` | trailing muted meta |

**Full part list, type ramp and tokens:** see **[content.md](content.md)**.

### `variant=` — the composition

Composes the two primitives — arrangement, split, visibility, overlay, theme, corners. **Whole-token** matched (`~=`), so `md:`/`lg:` prefixes don't collide with the base form.

| Token | Effect |
|-------|--------|
| `col` *(default)* | content below media (single column) |
| `col-r` | content **above** media (reversed column) |
| `row` | media \| content side by side |
| `row-r` | content \| media (reversed row) |
| `spl()` | `1/1 1/2 2/1 1/3 3/1` — column ratio for `row` / `row-r` |
| `vis(media)` | show only the media (hide content) |
| `vis(content)` | show only the content (hide media) |
| `ovr()` | `ts tc te · cs cc ce · bs bc be` — stack content over media at one of 9 **logical** positions; sets the matching default scrim direction. (The six physical spellings `tl tr cl cr bl br` were removed in v5; `tc`/`cc`/`bc` are spelled the same in both grids.) |
| `theme=` | shared theme axis: a colour (`red … black`) + `pale`/`muted`/`light`/`dark` modifiers. Surface + ink; ink crosses into the content namespace. See [theme.md](../base/theme.md). (Replaces the old `variant="thm(…)"` spelling, removed in v4) |
| `rds()` | `non sm md lg xl 2xl full pill` (round) · `sm-sq md-sq lg-sq xl-sq` (squircle, `corner-shape: superellipse()`) — corner radius. The old `rds(none)` spelling was removed in v5 |

```html
<ui-card variant="row spl(1/2) rds(lg)" theme="gray" media="asr(4/3)" content="scl(lg) pad(lg)"> … </ui-card>
```

**Full surface, host tokens and the `ovr()` bridge:** see **[ui-card-tokens.md](ui-card-tokens.md)**; the `theme=` axis is documented in **[theme.md](../base/theme.md)**.

---

## Overlay furniture

The media area hosts **five** overlay elements as **children of `<ui-media>`**. They carry only their text/glyph — **position and hue come from the parent `media=` token** (e.g. `media="chip(be) chip(red)"`), not from attributes on the element itself.

| Element | Role | Default area | In `<summary>`? |
|---------|------|--------------|------------------|
| `<ui-chip>` | label ("New", "Sale") | `ts` (top-start) | ✅ marker |
| `<ui-beacon>` | live/status indicator ("LIVE", "REC") | `ts` (top-start) | ✅ marker |
| `<ui-sticker>` | callout disc / `variant="sh:burst"` ("−20%") | `te` (top-end) | ✅ marker |
| `<ui-save>` | favorite / wishlist toggle | `te` (top-end) | ❌ card-only (interactive) |
| `<ui-play>` | play affordance | `cc` (center) | ❌ card-only (interactive) |

A sixth element, **`<ui-marquee>`, is a *band*, not furniture** — full-width, `top`/`bot` only (no nine-point grid), and it sits at `z-index: 1`, *below* the furniture. Overlaid in `<ui-media>` it is token-placed (`marquee(top)` / `marquee(bot)`); inside `<ui-content>` it is markup-placed by flow order. Details in **[media.md](media.md#furniture-vs-band--ui-marquee-is-not-furniture)**.

Hues are the canonical nine — `red orange green blue accent black white gray slate` (four hues + the `white < gray < slate < black` neutral ramp). The doc-era `dark`/`light`/`subtle` aliases were removed in v5; `slate` was promoted to a canonical hue rather than removed, because it always routed to its own `--ui-theme-slate-*` bundle.

```html
<ui-card variant="col" media="asr(4/3) chip(be) chip(green) sticker(ts) sticker(red)">
  <cq-box>
    <ui-media>
      <img src="product.jpg" alt="Product">
      <ui-chip>New</ui-chip>            <!-- bottom-end, green -->
      <ui-sticker>Featured</ui-sticker> <!-- top-start, red -->
    </ui-media>
    <ui-content><h2 data-part="headline">AuraSound Pro</h2></ui-content>
  </cq-box>
</ui-card>
```

Position (`ts…be`) and theme (`red…subtle`) are disjoint vocabularies and are **two atomic tokens** — `media="chip(be) chip(green)"`, not `chip(be green)`. **Full grid, theming and per-element details:** see **[media.md](media.md)**.

---

## Responsive

Add `md:` (container width ≥ 25rem) and/or `lg:` (≥ 44rem) prefixes to make a card react to **its own width** (evaluated against the `<cq-box>` descendant). Same markup renders differently in a hero slot vs. a 3-up grid — no media queries.

**Prefixable:**

- `variant=` arrangement — `col` `col-r` `row` `row-r` `spl()` `vis()` *(host only — it arranges the two children)*
- `content=` spacing — `gap()` and all seven padding tokens (`pad()` `pb()` `pi()` `pbs()` `pbe()` `pis()` `pie()`)
- `content=` size — `scl()` and `hl(<size>)`
- `media=` — `asr()` (the only prefixable media token)

Everything else (`obp()`, `scm()`, `hov()`, content tone/weight, …) is unprefixed.

All size queries are **named** — `@container bs-card (…)` — and each `content=`/`asr()` rule ships **two arms**, so the attribute may sit on the host *or* on the primitive itself (the renderer's canonical placement). `<lay-out-group>` is now a `bs-card` container too, so section headers support the same prefixes. A **standalone** `<ui-content>`/`<ui-media>` opts in with a named wrapper: `<div style="container: bs-card / inline-size">`.

**Optional JS.** The package entry is **`index.js`** — an orchestrator importing three feature chunks, each also importable alone:

```js
import '@browser.style/card';              // index.js: hover + carousel + video
import '@browser.style/card/hover.js';     // cursor-tracked hov(track|drift|tilt)
import '@browser.style/card/carousel.js';  // loop clones · autoplay · pause-on-leave
import '@browser.style/card/video.js';     // embed facades · media commands · vid() · <ui-play>
```

Separately, `import '@browser.style/card/ui-media-srcset.js'` upgrades each `<ui-media>` `<img>` — `loading`/`decoding`/`sizes="auto"` always, plus a host-gated Cloudflare `srcset` on `*.browser.style` (heights from `asr()`). Author `src`s **root-relative** (`/assets/images/foo.png`) so they load from disk in dev and gain the transformed `srcset` in production — no hardcoded domain. Force it locally with `cdn="on"`. (Transitional, and deliberately outside `index.js` — drop it once srcset is server-side rendered.) Full detail in **[media.md](media.md)**.

```html
<!-- stacked in a narrow grid cell; media beside content when the container is wide -->
<ui-card variant="col lg:row lg:spl(1/2)"
         media="asr(16/9)"
         content="pad(md) lg:pad(lg) gap(sm) lg:gap(md)">
  <cq-box>
    <ui-media><img src="cover.jpg" alt=""></ui-media>
    <ui-content> … </ui-content>
  </cq-box>
</ui-card>
```

---

## Framework examples

`<ui-card>` is a light-DOM custom element, so the markup is identical across frameworks — there is no wrapper component or prop API to learn. Import the package once (to register the element + auto-insert `<cq-box>`), then write the same HTML.

### React

```jsx
import '@browser.style/card';

function Card() {
  return (
    <ui-card variant="col" media="asr(16/9)" content="scl(lg)">
      <cq-box>
        <ui-media><img src="cover.jpg" alt="Cover" /></ui-media>
        <ui-content>
          <small data-part="eyebrow">Article</small>
          <h2 data-part="headline">The headline</h2>
          <p data-part="summary">A short summary.</p>
        </ui-content>
      </cq-box>
    </ui-card>
  );
}
```

### Vue

```vue
<script setup>
import '@browser.style/card';
</script>

<template>
  <ui-card variant="col" media="asr(16/9)" content="scl(lg)">
    <cq-box>
      <ui-media><img src="cover.jpg" alt="Cover"></ui-media>
      <ui-content>
        <small data-part="eyebrow">Article</small>
        <h2 data-part="headline">The headline</h2>
        <p data-part="summary">A short summary.</p>
      </ui-content>
    </cq-box>
  </ui-card>
</template>
```

### Svelte

```svelte
<script>
  import '@browser.style/card';
</script>

<ui-card variant="col" media="asr(16/9)" content="scl(lg)">
  <cq-box>
    <ui-media><img src="cover.jpg" alt="Cover"></ui-media>
    <ui-content>
      <small data-part="eyebrow">Article</small>
      <h2 data-part="headline">The headline</h2>
      <p data-part="summary">A short summary.</p>
    </ui-content>
  </cq-box>
</ui-card>
```

---

## Browser support

The core surface — frame, layout, overlay furniture, scrim, themes, type ramp — works in all modern browsers and is pure CSS.

| Feature | Support |
|---------|---------|
| Custom elements / CSS Grid / logical properties (RTL) | All modern browsers |
| `aspect-ratio` | Chrome 88+, Firefox 89+, Safari 15+ |
| Container queries (`md:` / `lg:` tiers, `cqi` type ramp) | Chrome 105+, Firefox 110+, Safari 16+ |
| `color-mix()` (themes, muted ink) | Chrome 111+, Firefox 113+, Safari 16.2+ |
| `::scroll-marker` / `::scroll-button` + `anchor()` (carousel markers/arrows) | Chromium-only |
| `corner-shape: superellipse()` (`rds(*-sq)` squircles) | Chrome 135+ |
| `text-box: cap alphabetic` (leading trim) | Chrome 133+ |
| `@container style()` (`hov()`, `tnt`, `shp()`'s clip, `marquee()` placement) | Chrome 111+, Safari 18+, Firefox 128+ |

**v5 support posture:** in v5 those four token families moved from duplicated selectors to an inherited `--_*` flag read by a `@container style()` query, so the token works identically whether it sits on the host or on `<ui-media>`. On **older Firefox** they now no-op — the frame simply renders un-hovered / un-tinted / un-clipped. Nothing else is affected: images, aspect ratio, scrim, furniture and every carousel control avoid style queries entirely. Full rationale and the list of tokens that can never migrate: [`media.md` § v5 support posture](media.md#v5-support-posture--style-queries).

**Graceful degradation:** the carousel always remains a native, swipeable scroll-snap row even without `::scroll-marker` / `anchor()` (the markers/arrows simply don't appear). The scrim and the overlay markers are pure CSS and need no JS. Squircle corners fall back to the bespoke radius without the superellipse shape. Where `cqi` / `color-mix()` are unavailable, the type ramp resolves at its preferred value and ink falls back to the inherited color — the layout stays intact.

---

## Used by

- [`@browser.style/reveal`](../reveal) — `@import`s `ui-card.css` and adds `<details>` / `<summary>` reveal animations on top of the shared composition engine (reusing the same `<ui-media>` / `<ui-content>` primitives and the `md:` / `lg:` tiers, evaluated against `<summary>` instead of `<cq-box>`).
</content>
</invoke>
