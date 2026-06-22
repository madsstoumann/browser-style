# @browser.style/media

A CSS-first **media primitive** — an image/video frame with overlay furniture (label, sticker, favorite, play). It works **standalone** or **nested inside** `<ui-card>` / `<ui-reveal>`, and it is configured entirely through a compact `media=` token string that can sit on the element *itself* or on **any ancestor** (the configuration inherits down through custom properties).

> **Status:** this documents the **planned** v4 API from
> `docs/plans/2026-06-20-ui-media-content-split-design.md`. `<ui-media>` is extracted from the current `ui-card.css`; the API below is the target the extraction reproduces (parity intent noted where the plan and shipped CSS differ).

## Features

- Aspect ratio, object-position (9-grid), object-fit, and image flip — all from one `media=` string
- Hover effects (zoom / pan / cursor-track) — media-only
- Scrim gradients in **9 directions** (4 edges + 4 diagonals + a centered double-stop)
- Native carousel via `::scroll-marker` / `::scroll-button` (dots + arrows)
- A **3×3 overlay grid** for furniture: `<ui-chip>`, `<ui-sticker>`, `<ui-save>`, `<ui-play>`
- Logical / RTL-aware positioning — geometry defined once, mirrors automatically
- Reads its own inherited `--ui-media-*` namespace — no descendant-selector coupling, so it is **inert-proof standalone**
- Works without JavaScript (CSS-only mode); markers need no JS at all

---

## Install

```bash
npm install @browser.style/media
```

Peer dependency:

```bash
npm install @browser.style/base
```

> `@browser.style/base` provides the design token system. Because base is a required peer dependency, the global tokens `<ui-media>` references (`--color-overlay-light`, `--spacing-*`, `--radius-*`, the `--ui-theme-*` bundles, …) are always available — no hardcoded fallbacks needed.

The **overlay furniture** elements are separate packages. Install only the ones you use:

```bash
npm install @browser.style/chip      # <ui-chip>    — label marker
npm install @browser.style/sticker   # <ui-sticker> — disc / burst marker (multi-line)
npm install @browser.style/save      # <ui-save>    — favorite toggle  (card-only)
npm install @browser.style/play      # <ui-play>    — play affordance  (card-only)
```

`<ui-play>` additionally peer-deps `@browser.style/icon` (its glyph is a `<ui-icon type="play">` sub-element, not a pseudo-element).

---

## Usage

### CSS-only (vanilla HTML)

```html
<link rel="stylesheet" href="@browser.style/base/index.css">
<link rel="stylesheet" href="@browser.style/media/index.css">
```

Or via CSS `@import`:

```css
@import '@browser.style/base';
@import '@browser.style/media/style';
```

```html
<ui-media media="asr(16/9) obp(tl) hov(zoom) scm">
  <img src="https://picsum.photos/800/450" alt="Mountain trail at dawn">
</ui-media>
```

### Web Component

Import the module to register `<ui-media>`:

```js
import '@browser.style/media';
```

The web component uses the **exact same** HTML as CSS-only. The JS only registers the element (and, when a `nav()` carousel or interactive `<ui-play>`/`track` hover is present, adds the optional progressive-enhancement wiring). The frame, overlays, scrim, and marker controls are all pure CSS.

#### Attributes

| Attribute | Type | Description |
|-----------|------|-------------|
| `media` | token string | Configures the frame + overlays. Valid on `<ui-media>` **or any ancestor** (it inherits). See the DSL below. |

There are no per-overlay positioning/theming attributes on the overlay elements themselves — everything is driven from the parent `media=` string. (The overlay elements do expose their own `theme=` / `size=` for self-service use; see *Overlay furniture*.)

---

## The `media=` token DSL

The `media=` string is a small **domain-specific language**: space-separated **3-letter modifier codes** with `()` arguments, plus a couple of bare flags. Every token simply writes a `--ui-media-*` custom property, which is why **arbitrary values have an automatic escape hatch** via `style="--ui-media-*"` (see below) — there is no exhaustive token list to memorize.

Because custom properties inherit, **one rule set serves both placement cases**:

- `<ui-media media="asr(16/9)">` — matches itself → reads its own prop.
- `<ui-card media="asr(16/9)"><ui-media>…</ui-media></ui-card>` — the card matches → the prop **inherits down** to the nested `<ui-media>`.

### Token reference

| Token | Args | Controls | Writes |
|-------|------|----------|--------|
| `asr()` | `1/1` `6/7` `3/4` `4/3` `3/2` `2/3` `16/9` `21/9` (or any via `style`) | aspect-ratio | `--ui-media-ar` |
| `obp()` | `tl tc tr · cl cc cr · bl bc br` | object-position (9-grid) | `--ui-media-op` |
| `obf()` | `cover` `contain` `fill` `none` | object-fit | `--ui-media-fit` |
| `flp()` | `h` `v` `hv` | flip / mirror the image | `--ui-media-fl-x` / `-fl-y` |
| `hov()` | `zoom` `pan` `track` | hover effect (image only) | `--ui-media-hv-*` |
| `scm()` | *(bare, or `tl … br`)* | scrim — bare matches the host `ovr()`; explicit picks a direction | `--ui-media-scrim-paint` |
| `nav()` | *(bare, or `dots` `arrows` `none`)* | carousel — **the token IS the trigger**; bare = dots + arrows | carousel layout + controls |
| `chip()` `sticker()` `save()` `play()` | `ts … be` *(position)* **or** `red orange green blue accent dark light subtle` *(sub-theme)* | place + theme an overlay element | `--ui-media-{el}-area` / element `--ui-{el}-*` tokens |

#### `asr()` — the 8 numeric aspect ratios

```
asr(1/1)   asr(6/7)   asr(3/4)   asr(4/3)
asr(3/2)   asr(2/3)   asr(16/9)  asr(21/9)
```

There were never any named keywords — ratios are always numeric. Any other ratio goes through the escape hatch: `style="--ui-media-ar: 5/4"`. Setting `asr()` also zeroes the frame's `min-block-size` so the ratio governs height.

#### `obp()` — object-position 9-grid

`tl tc tr · cl cc cr · bl bc br` map to `left top` … `right bottom`. Default is `center`.

#### `flp()` — mirror

`flp(h)` flips horizontally (`--ui-media-fl-x: -1`), `flp(v)` vertically, `flp(hv)` both. Applied as a `transform: scale()` on the `img`/`video` so it composes with hover effects.

#### `hov()` — hover effect (image only)

| Value | Effect |
|-------|--------|
| `zoom` | scales the image up on hover |
| `pan` | scales + translates the image |
| `track` | cursor-tracked pan — reads `--ui-media-mx` / `--ui-media-my` (−1…1), set by a pointer-move handler (JS, added later; **inert until then**) |

All hover effects are guarded by `@media (hover: hover)` and disabled under `prefers-reduced-motion: reduce`.

> **Removed:** the old card-level hovers `hv(lift)` / `hv(shrink)` / `hv(tilt)` are **gone** in v4 — hover is now media-only.

### Arbitrary values — the `style=` escape hatch

Every `()` token is *sugar* over a custom property, so any value that has no token is set directly:

```html
<ui-media media="hov(zoom)" style="--ui-media-ar: 5/4; --ui-media-hv-zoom: 1.15;">
  <img src="…" alt="…">
</ui-media>
```

---

## Overlay furniture

The media area hosts four overlay elements. They carry **only their text/glyph** — position and theme come from the parent `media=` string (so a `<ui-card>` can configure them and the config inherits down).

### The 3×3 positioning grid

`<ui-media>` is a 3×3 grid (`auto 1fr auto` tracks). Its nine areas are logical codes, defined **once**:

```
ts   tc   te        top-start    top-center    top-end
cs   cc   ce   →    center-start center-center center-end
bs   bc   be        bottom-start bottom-center bottom-end
```

Columns follow the **inline axis**, so the grid **mirrors automatically in RTL** — `ts` renders top-right in Arabic. An overlay element just *picks an area*; the geometry is never duplicated per element type. The `img` / `video` sit underneath, out of grid flow (`position: absolute; inset: 0`).

### The four elements & their default areas

| Element | Role | Default area | Type | Valid in `<summary>`? |
|---------|------|--------------|------|------------------------|
| `<ui-chip>` | label ("New", "Sale") | `ts` (top-start) | marker (non-interactive) | ✅ yes |
| `<ui-sticker>` | callout disc / burst ("−20%") | `te` (top-end) | marker (non-interactive) | ✅ yes |
| `<ui-save>` | favorite / wishlist toggle | `te` (top-end) | **control** (interactive) | ❌ card-only |
| `<ui-play>` | play affordance | `cc` (center) | **control** (interactive) | ❌ card-only |

**Markers vs controls.** Markers (`<ui-chip>`, `<ui-sticker>`) are non-interactive autonomous custom elements = valid **phrasing content**, so they parse inside a card *and* inside a reveal `<summary>` (the trigger face), with **no JS**. Controls (`<ui-save>`, `<ui-play>`) are interactive → **card-only**: a click inside `<summary>` toggles the `<details>`, and interactive content is invalid there.

### Position override

Override an element's default area with a position token in `media=`:

```html
<ui-media media="chip(be) sticker(cc)">
  <img src="product.jpg" alt="Product">
  <ui-chip>Bottom-end label</ui-chip>       <!-- moved to be -->
  <ui-sticker>Center</ui-sticker>           <!-- moved to cc -->
</ui-media>
```

This writes `--ui-media-chip-area: be`, `--ui-media-sticker-area: cc`, etc. Overlay
elements are **always children of `<ui-media>`** (the grid that positions them) — see
[Nesting](#nested-in-ui-card--everything-configured-on-the-parent).

### Theming an overlay from the parent

Theme an element with a **sub-theme key** in `media=`:

```html
<ui-media media="chip(red) sticker(green)">
  <img src="product.jpg" alt="Product">
  <ui-chip>Sale</ui-chip>            <!-- red bundle -->
  <ui-sticker>-20%</ui-sticker>      <!-- green bundle -->
</ui-media>
```

The 8 sub-theme keys are **hues + neutrals** (decorative, *not* status):

```
red   orange  green   blue
accent  dark  light  subtle
```

They route into the element's **own** tokens (`--ui-chip-bg` / `--ui-chip-c`, `--ui-sticker-bg/-c`, `--ui-save-c`, `--ui-play-bg/-c`) and resolve from the shared `--ui-theme-*` bundles defined once in `@browser.style/base`. This is the **same palette** as each element's self-service `theme=` attribute — `media="chip(red)"` and `<ui-chip theme="red">` produce identical colors.

> **Position and theme are disjoint vocabularies** (`ts…be` vs `red…subtle`), so `chip(cc)` and `chip(dark)` parse unambiguously. They are **two atomic tokens** — `media="chip(tl) chip(dark)"`, not a combined `chip(tl dark)` — so the pure-CSS substring parser can scope each arg to its element. Because position usually defaults by role, the common case is a single token (e.g. `chip(dark)`).

### Element details

| Element | Shape / markup | Notes |
|---------|----------------|-------|
| `<ui-chip>` | pill label (reuses `ui/chip`) | `variant` light/outline/square/squircle, `size`, `theme`, `color`. (The unrelated `<ui-badge>` cart-number badge is untouched.) |
| `<ui-sticker>` | round disc; opt-in starburst via `variant="burst"` (`--ui-sticker-clip-path`); **multi-line** | each direct child is a line; `--ui-sticker-gap` controls line-spacing, `text-box: cap alphabetic` trims leading |
| `<ui-save>` | `<ui-save><input type="checkbox" aria-label="Save"></ui-save>` | favorite ≈ wishlist ≈ bookmark. State + a11y + keyboard from the checkbox, **zero JS**. Icon swappable via `--ui-save-icon` (heart / bookmark / star). |
| `<ui-play>` | `<ui-play><button type="button" aria-label="Play"><ui-icon type="play"></ui-icon></button></ui-play>` | play affordance (default `cc`). `variant="reveal"` hides until media hover/focus. JS web component swaps `<ui-icon type>` play↔pause, toggles `aria-pressed`, emits `ui-play-toggle`, and optionally drives a `<video>` via `for="videoId"`. CSS-only fallback = the authored static button. |

**`<ui-sticker>` multi-line** — "SAVE / 20%" is two children at different scales:

```html
<ui-sticker variant="burst">
  <span style="font-size:.7em">SAVE</span>
  <b style="font-size:1.6em">20%</b>
</ui-sticker>
```

A single text node still works as one line: `<ui-sticker>-20%</ui-sticker>`.

> **Removed:** `ribbon` and `counter` (and the diagonal-ribbon treatment). **Deferred:** a sold-out / `cover` full-bleed state, and a Popover-API video lightbox for `<ui-play>` (this round ships only the play *button*).

---

## Carousel

The `nav()` token **is the trigger** — there is no separate `crs` flag. Any `nav` turns the frame into a flex scroll-snap row; each direct `img`/`video` becomes a 100%-wide slide.

| Token | Controls shown |
|-------|----------------|
| `nav` *(bare)* | dots **+** arrows |
| `nav(dots)` | dots only |
| `nav(arrows)` | arrows only |
| `nav(none)` | swipe-only (no controls) |

```html
<ui-media media="nav asr(16/9)">
  <img src="…/1" alt="Slide 1">
  <img src="…/2" alt="Slide 2">
  <img src="…/3" alt="Slide 3">
</ui-media>
```

Controls use native `::scroll-marker` (dots) and `::scroll-button(left|right)` (arrows), `@supports`-gated and anchor-positioned to each scroller — they **degrade to a bare swipeable scroller** where unsupported. Smooth scroll is enabled under `prefers-reduced-motion: no-preference`.

The full dot/arrow token surface is preserved from the current card (see *Tokens* — `--ui-media-dot-*`, `--ui-media-arrow-*`, and `--ui-media-overlay-gap` which drives the control inset). The custom SVG-arrow swap (`--ui-media-arrow-prev` / `-next`) is load-bearing for demos.

---

## Scrim

`scm` paints a darkening gradient that covers the **whole frame**, layered **between the image and the overlays**:

| Layer | z-index |
|-------|---------|
| `img` / `video` | `0` |
| scrim (`::after`) | `1` |
| overlays (chip/sticker/save/play) + a `data-part="caption"` placed in the media | `2` |

The scrim `::after` stays out of grid flow (`position: absolute; inset: 0`).

**All 9 directional gradients are preserved** (parity with the current `ui-card.css`): the 4 edges, the 4 **diagonals** (`to bottom right` / `to bottom left` / `to top right` / `to top left`) for corner placements, and the **`cc` center double-stop** (`linear-gradient(to bottom, #0000, color 50%, #0000)`). A single direction token can't reproduce the diagonals, so each `--ui-media-scrim-{tl…br}` carries a full gradient and `--ui-media-scrim-paint` selects one.

| Form | Behavior |
|------|----------|
| `scm` *(bare)* | reads `--ui-media-scrim-default` — set by the host `ovr()` to match the overlay corner; falls back to `bc` |
| `scm(tl)` … `scm(br)` | explicit direction (overrides the default) |

`scm` works **standalone** too (a darkened image, no overlay content needed).

---

## Tokens

Every token lives in the `--ui-media-*` namespace and inherits down from wherever `media=` is set.

### Frame

| Token | Default | Description |
|-------|---------|-------------|
| `--ui-media-ar` | `auto` | aspect-ratio (set by `asr()`) |
| `--ui-media-fit` | `cover` | object-fit (set by `obf()`) |
| `--ui-media-op` | `center` | object-position (set by `obp()`) |
| `--ui-media-fl-x` | `1` | horizontal flip scale (`-1` flips) |
| `--ui-media-fl-y` | `1` | vertical flip scale (`-1` flips) |
| `--ui-media-bg` | `var(--color-overlay-light, transparent)` | frame background (behind `contain`/`none` letterboxing) |
| `--ui-media-min` | `12.5rem` | min-block-size when no `asr()` is set |

### Hover

| Token | Default | Description |
|-------|---------|-------------|
| `--ui-media-hv-zoom` | `1.08` (`pan`/`track`: `1.12`) | hover zoom scale |
| `--ui-media-hv-pan-x` / `-pan-y` | `-2%` | `pan` translate |
| `--ui-media-hv-track` | `4%` | `track` max translate (× pointer offset) |
| `--ui-media-hv-track-dur` | `var(--duration-normal)` | `track` translate duration |
| `--ui-media-hover-duration` | `var(--duration-slower)` | hover transition duration |
| `--ui-media-hover-easing` | `var(--ease-out)` | hover transition easing |
| `--ui-media-mx` / `--ui-media-my` | `0` | pointer offset hooks for `hov(track)` (−1…1), set by JS |

### Carousel — dots

| Token | Default | Description |
|-------|---------|-------------|
| `--ui-media-dot-bg` | `rgb(255 255 255 / 0.5)` | dot color |
| `--ui-media-dot-active` | `#fff` | current-dot color |
| `--ui-media-dot-size` | `0.6rem` | dot diameter |
| `--ui-media-dots-gap` | `0.5rem` | gap between dots |
| `--ui-media-dot-border` | `0` | dot border |

### Carousel — arrows

| Token | Default | Description |
|-------|---------|-------------|
| `--ui-media-arrow-bg` | `rgb(255 255 255 / 0.75)` | arrow button background |
| `--ui-media-arrow-bg-hover` | `rgb(255 255 255 / 0.95)` | arrow hover background |
| `--ui-media-arrow-size` | `2rem` | arrow button size |
| `--ui-media-arrow-radius` | `var(--radius-circle, 50%)` | arrow corner radius |
| `--ui-media-arrow-border` | `0` | arrow border |
| `--ui-media-arrow-glyph-size` | `45%` | chevron glyph size |
| `--ui-media-arrow-prev` | chevron-left SVG | previous-arrow glyph (`url(...)`) |
| `--ui-media-arrow-next` | chevron-right SVG | next-arrow glyph (`url(...)`) |

### Scrim

| Token | Default | Description |
|-------|---------|-------------|
| `--ui-media-scrim-color` | `rgb(0 0 0 / 0.65)` | base scrim color |
| `--ui-media-scrim-tl` … `-br` | per-direction `linear-gradient()` | the 9 directional gradients (4 edges + 4 diagonals + `cc` double-stop) |
| `--ui-media-scrim-default` | (set by host `ovr()`) | the bare-`scm` direction; matches the overlay corner |
| `--ui-media-scrim-paint` | `#0000` (none) | the selected gradient that gets painted |

### Overlays

| Token | Default | Description |
|-------|---------|-------------|
| `--ui-media-overlay-gap` | `0.75rem` | inset (margin) of every overlay element; also drives dot/arrow inset |
| `--ui-media-chip-area` | `ts` | grid-area for `<ui-chip>` (override via `chip(<area>)`) |
| `--ui-media-sticker-area` | `te` | grid-area for `<ui-sticker>` |
| `--ui-media-save-area` | `te` | grid-area for `<ui-save>` |
| `--ui-media-play-area` | `cc` | grid-area for `<ui-play>` |

> Each overlay element also exposes its own token namespace (`--ui-chip-*`, `--ui-sticker-*`, `--ui-save-*`, `--ui-play-*`) — see the element's own README. The `media="chip(<theme>)"` routing and the element's own `theme=` both write the same target tokens.

---

## Examples

### Standalone media

```html
<ui-media media="asr(16/9) obp(tl) hov(zoom) scm">
  <img src="https://picsum.photos/800/450" alt="Lake at sunrise">
</ui-media>
```

### Standalone with overlay furniture

```html
<ui-media media="asr(4/3) chip(red) sticker(green) sticker(cc)">
  <img src="https://picsum.photos/600/450" alt="Hiking boots">
  <ui-chip>Sale</ui-chip>            <!-- ts (default), red -->
  <ui-sticker>-20%</ui-sticker>      <!-- cc (override), green, single line -->
</ui-media>
```

### Carousel

```html
<ui-media media="nav asr(16/9)">
  <img src="https://picsum.photos/id/10/800/450" alt="View 1">
  <img src="https://picsum.photos/id/11/800/450" alt="View 2">
  <img src="https://picsum.photos/id/12/800/450" alt="View 3">
</ui-media>
```

### Nested in `<ui-card>` — everything configured on the parent

```html
<ui-card media="asr(4/3) chip(red) sticker(cc) sticker(green)"
         content="scl(lg) pad(md)"
         variant="col">
  <ui-media>
    <img src="product.jpg" alt="Product name">
    <ui-chip>Sale</ui-chip>          <!-- ts (default), red -->
    <ui-sticker>-20%</ui-sticker>    <!-- cc (override), green -->
    <ui-save>                        <!-- te (default); card-only control -->
      <input type="checkbox" aria-label="Save to wishlist">
    </ui-save>
  </ui-media>
  <ui-content>
    <h2 data-part="headline">Trail Runner GTX</h2>
    <p data-part="summary">All-weather grip for any terrain.</p>
  </ui-content>
</ui-card>
```

> **Overlay elements always live inside `<ui-media>`** — it is the 3×3 grid that
> positions them. The `media=` string may sit on `<ui-card>` (it inherits down) or on
> the `<ui-media>` itself, but the `<ui-chip>` / `<ui-sticker>` / `<ui-save>` /
> `<ui-play>` children belong to `<ui-media>`, never directly to `<ui-card>` (with no
> `<ui-media>` there's no grid to place them).

### Overlay theming via the element's own attribute

```html
<ui-media media="asr(1/1)">
  <img src="…" alt="…">
  <ui-chip theme="dark">Bestseller</ui-chip>   <!-- self-themed; theme= wins over media= -->
</ui-media>
```

### In a reveal `<summary>` — markers only

```html
<ui-reveal>
  <summary>
    <ui-media media="asr(16/9) scm">
      <img src="…" alt="Cover">
      <ui-chip>New</ui-chip>        <!-- marker: valid -->
      <ui-sticker>Hot</ui-sticker>  <!-- marker: valid -->
      <!-- DO NOT add <ui-save> / <ui-play> here — interactive, card-only -->
    </ui-media>
  </summary>
  <!-- revealed panel… -->
</ui-reveal>
```

### RTL

No extra markup. The grid columns follow the inline axis, so all overlay positions mirror automatically — `chip(ts)` renders top-right under `dir="rtl"`. Glyphs (save icon) are symmetric / mask-based and stay correct.

---

## Responsive

`<ui-card>` / `<ui-reveal>` support `md:` / `lg:` breakpoint prefixes (container queries at md = `25rem`, lg = `44rem`, evaluated against the queryable descendant `cq-box` / `summary`).

> **This round, breakpoint prefixes apply to layout + spacing only** — `variant=` arrangement (`col`/`row`/`spl()`/`vis()`) and `content=` spacing (`gap()`/`pad()`). **`media=` tokens are *not* breakpoint-prefixed yet** — `asr()`, `obp()`, `hov()`, `scm()`, etc. do not transform at a breakpoint. Making every media token responsive is a rule-per-token × breakpoint cost that is deferred. A media frame that must change ratio/position at a breakpoint needs a static treatment (or your own `@container` rule writing `--ui-media-*`) for now.

The parse layer is purely additive, so adding responsive media tokens later is a non-breaking generation step.

---

## Accessibility

- **Always provide `alt`** on `<img>` (or `aria-label`/captions for `<video>`). The frame is purely presentational.
- **`<ui-save>`** — always set `aria-label` on the wrapped `<input type="checkbox">`. State, keyboard (Space), and focus come from the native checkbox; no `aria-pressed` juggling.
- **`<ui-play>`** — the inner `<button>` carries `aria-label`; the JS web component toggles `aria-pressed` (is-playing). The CSS-only fallback is still a real, focusable button.
- **Interactive overlays are card-only.** Never place `<ui-save>` / `<ui-play>` inside a reveal `<summary>` — a click there toggles the `<details>`, and interactive content is invalid in `summary`. Markers (`<ui-chip>`, `<ui-sticker>`) are safe there.
- **Color isn't meaning.** Sub-themes (`red`/`green`/…) are decorative; convey status with text, not hue alone.
- Hover effects respect `prefers-reduced-motion: reduce` (disabled); carousel smooth-scroll is gated the same way.

---

## Browser Support

All modern browsers for the core frame, overlays, and scrim.

| Feature | Support |
|---------|---------|
| Custom elements | All modern browsers |
| CSS Grid / logical properties (RTL) | All modern browsers |
| `aspect-ratio` | Chrome 88+, Firefox 89+, Safari 15+ |
| Container queries (responsive host) | Chrome 105+, Firefox 110+, Safari 16+ |
| `::scroll-marker` / `::scroll-button` (carousel controls) | Chromium-only; **degrades to a swipeable scroller** elsewhere |
| `anchor()` positioning (carousel controls) | Chromium-only (same gate) |
| `text-box: cap alphabetic` (sticker line-trim) | Chrome 133+; degrades to normal leading |
| `corner-shape` (chip squircle) | Chrome 135+ |
| `color-mix()` / `light-dark()` (tokens) | Chrome 111+/123+, Firefox 113+/120+, Safari 16.2+/17.5+ |

Graceful degradation: the carousel always remains a native, swipeable scroll-snap row even without `::scroll-marker`/`anchor()`; markers and the scrim are pure CSS and need no JS.
