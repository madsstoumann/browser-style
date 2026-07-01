# @browser.style/media

A CSS-first **media primitive** — an image/video frame with overlay furniture (label, sticker, favorite, play). It works **standalone** or **nested inside** `<ui-card>` / `<ui-reveal>`, and it is configured entirely through a compact `media=` token string that can sit on the element *itself* or on **any ancestor** (the configuration inherits down through custom properties).

> **Status:** shipped (v4). `<ui-media>` is the media primitive extracted from `ui-card.css` into `ui/card/media.css`, per `docs/plans/2026-06-20-ui-media-content-split-design.md`. This documents the implemented API.

## Features

- Aspect ratio, object-position (9-grid), object-fit, image flip, and **standalone corners** (`rds()`) — all from one `media=` string
- Optional, **host-gated Cloudflare `srcset`** upgrade for responsive images (root-relative paths, no hardcoded domain) — pure progressive enhancement
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

### Optional JavaScript — two independent modules

The frame, overlays, scrim, and marker controls are **all pure CSS** — `<ui-media>` needs no JS. Two small, independent modules add optional progressive enhancement; load only what a page uses:

```js
import '@browser.style/card/ui-media.js';          // cursor-tracked hover: hov(track) / hov(drift)
import '@browser.style/card/ui-media-srcset.js';   // responsive Cloudflare srcset (transitional, see below)
```

- **`ui-media.js`** — wires the two cursor-tracked hover effects (`hov(track)`, `hov(drift)`). It uses **event delegation**: one idle set of listeners that never iterates or mounts `<ui-media>` — nothing runs until a pointer enters a `track`/`drift` frame. Load it only on pages that use those tokens.
- **`ui-media-srcset.js`** — registers the `<ui-media>` element and upgrades its `<img>` children (`loading`/`decoding`/`sizes="auto"` + host-gated Cloudflare `srcset`; see *Responsive images*). **Transitional:** once the srcset is server-side rendered, stop loading it.

Both use the **exact same** HTML as CSS-only; with no JS the element still renders.

#### Attributes

| Attribute | Type | Description |
|-----------|------|-------------|
| `media` | token string | Configures the frame + overlays. Valid on `<ui-media>` **or any ancestor** (it inherits). See the DSL below. |
| `cdn` | `on` \| `off` | Force-enable/disable the Cloudflare `srcset` upgrade regardless of host. Default: auto (on only for `*.browser.style`). |
| `breakpoints` | CSV of widths | Override srcset widths. Default `240,320,480,720,1200`. |
| `format` / `quality` / `fit` | string | Cloudflare transform params. Default `avif` / `80` / `cover`. |
| `sizes` | string | The `sizes` value. Default `auto`. |
| `eager` | boolean | First `<img>` loads `eager` + `fetchpriority="high"` (hero image). |

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
| `rds()` | `sm md lg xl 2xl full pill` + `sm-sq md-sq lg-sq xl-sq` | corners (**standalone only**) | `--ui-media-radius` (+ `corner-shape`) |
| `obp()` | `tl tc tr · cl cc cr · bl bc br` | object-position (9-grid) | `--ui-media-op` |
| `obf()` | `cover` `contain` `fill` `none` | object-fit | `--ui-media-fit` |
| `flp()` | `h` `v` `hv` | flip / mirror the image | `--ui-media-fl-x` / `-fl-y` |
| `hov()` | `zoom` `pan` `track` `drift` | hover effect (image only) | `--ui-media-hv-*` |
| `scm()` | *(bare, or `tl … br`)* | scrim — bare matches the host `ovr()`; explicit picks a direction | `--ui-media-scrim-paint` |
| `nav()` | *(bare, or `dots` `arrows` `none`)* | carousel — **the token IS the trigger**; bare = dots + arrows | carousel layout + controls |
| `chip()` `sticker()` `save()` `play()` | `ts … be` *(position)* **or** `red orange green blue accent dark light subtle` *(sub-theme)* | place + theme an overlay element | element inset (absolute) / element `--ui-{el}-*` tokens |

#### `asr()` — the 8 numeric aspect ratios

```
asr(1/1)   asr(6/7)   asr(3/4)   asr(4/3)
asr(3/2)   asr(2/3)   asr(16/9)  asr(21/9)
```

There were never any named keywords — ratios are always numeric. Any other ratio goes through the escape hatch: `style="--ui-media-ar: 5/4"`. Setting `asr()` also zeroes the frame's `min-block-size` so the ratio governs height.

#### `rds()` — corners (standalone only)

Inside `<ui-card>`/`<ui-reveal>` the **parent** rounds and clips the frame (via its own `variant="rds(…)"`), so you don't set corners on the media. A **standalone** `<ui-media>` can round its own corners with `rds()` — the same scale as the card:

```
rds(sm)  rds(md)  rds(lg)  rds(xl)  rds(2xl)  rds(full)  rds(pill)
rds(sm-sq)  rds(md-sq)  rds(lg-sq)  rds(xl-sq)      ← squircle (superellipse corner-shape)
```

The plain steps map to the global `--radius-*` tokens; the `-sq` variants add a bespoke radius plus `corner-shape: superellipse()` (Chrome 135+, degrades to the rounded radius). Arbitrary corners via the escape hatch: `style="--ui-media-radius: 1rem"`.

Add **`clip`** to also apply `clip-path: inset(0 round …)` at that same radius — a **scroll container** (carousel) can drop its rounded corners mid-scroll because `border-radius` + `overflow` compositing lets the scrolled content bleed past the corner; `clip-path` clips reliably. It's a boolean token that reuses the `rds()` value (`--ui-media-radius`, falling back to the card radius), so `rds(2xl) clip` rounds *and* clips. (`round()` has no superellipse, so a `-sq` frame clips as a plain round.) Note: `clip-path` also clips anything overlaid at the very edge, so keep controls/furniture inset.

#### `obp()` — object-position 9-grid

`tl tc tr · cl cc cr · bl bc br` map to `left top` … `right bottom`. Default is `center`.

#### `flp()` — mirror

`flp(h)` flips horizontally (`--ui-media-fl-x: -1`), `flp(v)` vertically, `flp(hv)` both. Applied as a `transform: scale()` on the `img`/`video` so it composes with hover effects.

#### `hov()` — hover effect (image only)

| Value | Effect |
|-------|--------|
| `zoom` | scales the image up on hover |
| `pan` | scales + translates the image |
| `track` | cursor-tracked pan — reads `--ui-media-mx` / `--ui-media-my` (−1…1), set by the pointer handler in **`ui-media.js`** (load it; **inert without it**). Image follows the cursor |
| `drift` | cursor-**counter** parallax (ioi.dk-style) — oversized image (rest scale `1.3`) shrinks toward `1.2` on hover and drifts **opposite** the cursor. Same `--ui-media-mx` / `--ui-media-my` handler in `ui-media.js` |

`track` and `drift` are the **only** hover effects that need JS — load `ui-media.js` (delegated; activates only when a `track`/`drift` frame is hovered). `zoom` and `pan` are pure CSS. All hover effects are guarded by `@media (hover: hover)` and disabled under `prefers-reduced-motion: reduce` (the JS handler skips updates under reduced-motion too). The token can sit on the host `<ui-card>`/`<ui-reveal>` or on a standalone `<ui-media>`.

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

Overlays are **absolutely positioned** (not grid items — that survives the carousel's flex scroller). Each element is placed at one of nine **logical** positions via `inset-block` / `inset-inline` + `translate`, the inset driven by `--ui-media-overlay-gap`:

```
ts   tc   te        top-start    top-center    top-end
cs   cc   ce   →    center-start center-center center-end
bs   bc   be        bottom-start bottom-center bottom-end
```

Positions use **logical** insets (`inset-inline-start/-end`), so they **mirror automatically in RTL** — `ts` renders top-right in Arabic. An overlay element just *picks a position*; the geometry is keyed on the parent `media="el(pos)"` token, never duplicated per element instance. The `img` / `video` sit underneath (`position: absolute; inset: 0`).

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
| `<ui-play>` | `<ui-play><button type="button" aria-label="Play"><ui-icon type="play"></ui-icon></button></ui-play>` | play affordance (default `cc`). `variant="reveal"` hides until media hover/focus. JS web component swaps `<ui-icon type>` play↔pause, toggles `aria-pressed`, emits `ui-play-toggle`, and optionally drives a `<video>` via `for="videoId"`. CSS-only fallback = the authored static button. **In a scrolling carousel** (`auto`/`loop`) it becomes the play/pause control: `position:sticky`-pinned to the scrollport (plain furniture scrolls away) and wired by `ui-media.js` — see [media.carousel.md](./media.carousel.md#playpause-control-ui-play). |

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
| `nav(below)` | dots **+** arrows in a reserved bottom **band** (not overlaid) |

```html
<ui-media media="nav asr(16/9)">
  <img src="…/1" alt="Slide 1">
  <img src="…/2" alt="Slide 2">
  <img src="…/3" alt="Slide 3">
</ui-media>
```

Controls use native `::scroll-marker` (dots) and `::scroll-button(left|right)` (arrows), `@supports`-gated and anchor-positioned to each scroller — they **degrade to a bare swipeable scroller** where unsupported. Smooth scroll is enabled under `prefers-reduced-motion: no-preference`.

The full dot/arrow token surface is token-driven (see *Tokens* — `--ui-media-dot-*`, `--ui-media-arrow-*`, and `--ui-media-overlay-gap` which drives the control inset). Arrows ship with **built-in chevron glyphs** (white default + a `*-dark` set for light circles); colour the circle with `--ui-media-arrow-bg`, or override `--ui-media-arrow-prev/-next` with your own `url()` to fully customise.

All carousel CSS lives in **`media.carousel.css`** (imported by `ui-card.css` alongside `media.css`).

### Arrow style & placement — `arw()`

| Token | Effect |
|-------|--------|
| `arw(chevron)` *(default)* | chevron glyph (shape) |
| `arw(arrow)` | full-arrow glyph, shaft + head (shape) |
| `arw(light)` *(default)* · `arw(dark)` | glyph ink — light/white (for a dark circle) / dark (for a light circle) |
| `arw(sm)` · `arw(md)` *(default)* · `arw(lg)` · `arw(xl)` | arrow button size (`1.75` / `2.25` / `2.75` / `3.25rem`) |
| `arw(mid)` *(default)* | edge arrows at vertical center |
| `arw(top)` | edge arrows at top |
| `arw(bot)` | edge arrows at bottom |
| `arw(set)` | both arrows as an adjacent pair at the inline-end |
| `arw(bare)` | drop the circle — render the glyph itself as a coloured arrow (any colour) |
| `arw(hide)` | **auto-hide** the dead-end arrow (no slide that way) — opt out of the always-visible default |

`arw()` atoms are **independent** — combine them as separate tokens, e.g. `arw(arrow) arw(dark) arw(lg)` or `arw(set) arw(bot)`, **not** `arw(arrow dark)`. Shape (`arw(arrow)`) and ink (`arw(dark)`) are separate axes and compose. A direct `style="--ui-media-arrow-prev/-next: …"` still overrides as an escape hatch.

#### Theming arrows

Two render modes, both token-driven — no named theme atoms needed:

- **Circle** *(default)* — a clean bordered button: translucent `--ui-media-arrow-bg` + a `--ui-media-arrow-border` (1px light border; no backdrop-filter/shadow). Colour the circle with `--ui-media-arrow-bg` / `--ui-media-arrow-bg-hover`; for a light circle switch the glyph to dark with `arw(drk)` (composes with `arw(arr)`). Square it with `--ui-media-arrow-radius`; drop the border with `--ui-media-arrow-border: 0`.
- **Bare** (`arw(bare)`) — no circle; the glyph *is* the colour, set with `--ui-media-arrow-color` (and `--ui-media-arrow-color-hover`). Default ink is **white** over an image and **auto-flips dark** under `nav(below)` (light band). Set any colour:

```html
<!-- black bare arrows -->
<ui-media media="nav(arrows) arw(bare)" style="--ui-media-arrow-color: #000">…</ui-media>
<!-- accent bare arrows -->
<ui-media media="nav(arrows) arw(bare)" style="--ui-media-arrow-color: var(--color-accent)">…</ui-media>
```

A subtle `--ui-media-arrow-shadow` drop-shadow keeps a white bare glyph legible over bright photos; set it to `none` to remove it. Bare composes with `arw(arrow)` (masked full-arrow) and every placement/`set` atom.

**By default every arrow stays visible** — at the first/last slide the dead-end arrow dims to `--ui-media-arrow-disabled-opacity` (default `0.5`) instead of disappearing. Add `arw(hide)` to auto-hide it instead. (Implementation note: a `:disabled` `::scroll-button` can't carry a mask, so a bare dead-end arrow paints the glyph SVG directly — white over an image, dark under `nav(below)` — tracking the glyph's light/dark shade rather than an arbitrary `--ui-media-arrow-color`.)

### Pill dots with autoplay fill — `dot()`

| Token | Effect |
|-------|--------|
| `dot(circle)` *(default)* | round dots |
| `dot(pill)` | rounded-rect pills; the **active** pill fills left→right over `--ui-media-autoplay` (default `5s`) as a timer hint |
| `dot(sm)` · `dot(md)` *(default)* · `dot(lg)` · `dot(xl)` | dot / pill size (composes with `dot(pill)`) |

The fill restarts whenever the active slide changes (`:target-current`) and **holds full** when no JS advances the slide — JS-driven autoplay lands later; the indicator is wired now. Under `prefers-reduced-motion: reduce` the active pill shows filled with no animation. Theme with `--ui-media-pill-track` / `--ui-media-pill-fill` / `--ui-media-pill-width` / `--ui-media-pill-height`.

### Controls below the media — `nav(below)`

`nav(below)` shows **both** controls in a reserved, non-scrolling **bottom band** beneath the frame (B2: the band is block-end padding on the flex scroller, so the absolute controls re-anchor into it without overlaying the image). Default layout: dots centered, arrows at the band's left/right ends. Combine with `arw(set)` to pin the dots to the start and pair the arrows at the end, or `dot(pill)` for a timer bar across the band. Size the band with `--ui-media-band` (default `2.75rem`); colour it with `--ui-media-controls-bg`. The `arw(top)/arw(bot)` placement atoms are for the **overlay** variant — `nav(below)` owns its own vertical placement.

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
| `scm(lgt)` `scm(med)` `scm(drk)` | **intensity** — a second, disjoint `scm()` token; sets `--ui-media-scrim-color` (`0.55` / `0.78` default / `0.92`). Combine with a position, e.g. `scm scm(drk)` |

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
| `--ui-media-hv-track-dur` | `var(--duration-normal)` | `track` / `drift` translate duration |
| `--ui-media-hv-drift` | `4%` | `drift` max translate (× pointer offset, applied **opposite** the cursor) |
| `--ui-media-hv-drift-rest` | `1.3` | `drift` resting scale (image overfills the frame) |
| `--ui-media-hv-drift-hover` | `1.2` | `drift` scale on hover (shrinks from rest) |
| `--ui-media-hover-duration` | `var(--duration-slower)` | hover transition duration |
| `--ui-media-hover-easing` | `var(--ease-out)` | hover transition easing |
| `--ui-media-mx` / `--ui-media-my` | `0` | pointer offset hooks for `hov(track)` / `hov(drift)` (−1…1), set by JS |

### Carousel — dots

| Token | Default | Description |
|-------|---------|-------------|
| `--ui-media-dot-bg` | `rgb(255 255 255 / 0.5)` | dot color |
| `--ui-media-dot-active` | `#fff` | current-dot color |
| `--ui-media-dot-size` | `0.6rem` | dot diameter |
| `--ui-media-dots-gap` | `0.5rem` | gap between dots |
| `--ui-media-dot-border` | `0` | dot border |
| `--ui-media-pill-width` | `1.5rem` | `dot(pill)` width |
| `--ui-media-pill-height` | `0.35rem` | `dot(pill)` height |
| `--ui-media-pill-track` | `rgb(255 255 255 / 0.35)` | `dot(pill)` inactive/track color |
| `--ui-media-pill-fill` | `#fff` | `dot(pill)` active fill color |
| `--ui-media-autoplay` | `5s` | `dot(pill)` timer-fill duration (future JS autoplay cadence) |

### Carousel — arrows

| Token | Default | Description |
|-------|---------|-------------|
| `--ui-media-arrow-bg` | `rgb(0 0 0 / 0.5)` | arrow button circle (semi-transparent black) |
| `--ui-media-arrow-bg-hover` | `rgb(0 0 0 / 0.7)` | arrow hover circle |
| `--ui-media-arrow-size` | `2.25rem` | arrow button size |
| `--ui-media-arrow-radius` | `var(--radius-circle, 50%)` | arrow corner radius (square it off for rounded-rect) |
| `--ui-media-arrow-border` | `1px solid rgb(255 255 255 / 0.6)` | circle border (`0` to drop) |
| `--ui-media-arrow-glyph-size` | `75%` (circle) / `80%` (bare) | glyph size |
| `--ui-media-arrow-nudge` | `calc(arrow-size * 0.03)` chevron · `* 0.015` arrow | optical shift of the glyph toward its tip (rotates with the arrow); `0` to disable |
| `--ui-media-arrow-color` | `#fff` (dark under `nav(below)`) | `arw(bare)` glyph ink |
| `--ui-media-arrow-color-hover` | `var(--ui-media-arrow-color)` | `arw(bare)` glyph ink on hover |
| `--ui-media-arrow-shadow` | `drop-shadow(0 1px 2px rgb(0 0 0 / 0.5))` | `arw(bare)` legibility shadow (`none` to drop) |
| `--ui-media-arrow-disabled-opacity` | `0.5` (`0` with `arw(hide)`) | opacity of a dead-end arrow (no slide that way) |
| `--ui-media-arrow-{prev,next}-dim` | the live glyph (dark under `nav(below)`) | dead-end bare glyph SVG (`:disabled` can't mask, so it's painted directly) |
| `--ui-media-arrow-prev` | `var(--ui-media-arrow-prev-light)` | previous-arrow glyph (`url(...)`) |
| `--ui-media-arrow-next` | `var(--ui-media-arrow-next-light)` | next-arrow glyph (`url(...)`) |
| `--ui-media-arrow-prev-light` / `-next-light` | white chevron SVG | built-in chevron glyphs for the dark default circle |
| `--ui-media-arrow-prev-dark` / `-next-dark` | black chevron SVG | built-in chevron glyphs for a light circle — switch via `--ui-media-arrow-prev/-next: var(--ui-media-arrow-*-dark)` |
| `--ui-media-arrow-prev-arrow-light` / `-next-arrow-light` | white full-arrow SVG | built-in full-arrow glyphs (used by `arw(arrow)`) |
| `--ui-media-arrow-prev-arrow-dark` / `-next-arrow-dark` | black full-arrow SVG | full-arrow glyphs for a light circle |
| `--ui-media-arrow-top` | `calc(anchor(center) − size/2)` | vertical-placement hook (set by `arw(top)`/`arw(bot)`/`nav(below)`) |
| `--ui-media-arrow-gap` | `0.5rem` | spacing between the two arrows in an `arw(set)` pair |
| `--ui-media-band` | `2.75rem` | `nav(below)` bottom-band height |
| `--ui-media-controls-bg` | `var(--ui-media-bg)` | `nav(below)` band background |

The arrow is a **circular button**: a themeable circle (`--ui-media-arrow-bg`) + a chevron image. The chevron is **white by default** (for the dark circle); for a light circle, point `--ui-media-arrow-prev/-next` at the built-in `*-dark` glyphs — no SVG pasting. Square off the circle with `--ui-media-arrow-radius`.

### Scrim

| Token | Default | Description |
|-------|---------|-------------|
| `--ui-media-scrim-color` | `rgb(0 0 0 / 0.78)` | base scrim color (the `scm()` intensity tokens set this) |
| `--ui-media-scrim-m` | `color-mix(scrim-color, transparent 55%)` | mid stop — holds the dark near the edge before fading, so spanning text stays legible over bright images |
| `--ui-media-scrim-tl` … `-br` | per-direction `linear-gradient()` | the 9 directional gradients (4 edges + 4 diagonals + `cc` double-stop) |
| `--ui-media-scrim-default` | (set by host `ovr()`) | the bare-`scm` direction; matches the overlay corner |
| `--ui-media-scrim-paint` | `#0000` (none) | the selected gradient that gets painted |

### Overlays

| Token | Default | Description |
|-------|---------|-------------|
| `--ui-media-overlay-gap` | `0.75rem` | inset of every overlay element; also drives dot/arrow inset |

Overlay positions are **not tokens** — each element has a default position by role (`<ui-chip>` `ts`, `<ui-sticker>`/`<ui-save>` `te`, `<ui-play>` `cc`) and is repositioned via the parent `media="el(<pos>)"` token, where `<pos>` is one of the nine logical codes.

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

### Responsive images — Cloudflare `srcset` (optional JS)

Loading the srcset module (`import '@browser.style/card/ui-media-srcset.js'`) upgrades each `<img>` child as **progressive enhancement** (this is the transitional, SSR-replaceable module — separate from `ui-media.js`, which only does cursor hover):

- **Always:** sets `loading="lazy"`, `decoding="async"`, and `sizes="auto"` if absent. (`sizes="auto"` needs `loading="lazy"`; the browser then picks the candidate from the image's real rendered width — Chrome 121+/Firefox, graceful elsewhere.) `eager` makes the first image load `eager` + `fetchpriority="high"` for a hero.
- **On the deployed `*.browser.style` host only:** injects a [Cloudflare Image Resizing](https://developers.cloudflare.com/images/transform-images/) `srcset`, deriving each candidate's height from the element's `asr()` token:

  ```
  /cdn-cgi/image/format=avif,quality=80,fit=cover,width=480,height=270/assets/images/foo.png 480w, …
  ```

**Why host-gated + root-relative.** `/cdn-cgi/image/` only resolves on the Cloudflare zone (it 404s on localhost, and a failed `srcset` candidate does *not* fall back to `src`). So author images with **root-relative** paths (`/assets/images/foo.png`): they load straight from disk in dev (no `srcset`), and on production the same markup gains the transformed `srcset` — no hardcoded domain anywhere. Force the upgrade locally for previewing with `cdn="on"` (or `globalThis.uiMedia.cdn = true`).

Config precedence is **attribute → `globalThis.uiMedia` → built-in default**:

```js
globalThis.uiMedia = { cdn: true, breakpoints: [240,320,480,720,1200], format: 'avif', quality: 80, fit: 'cover', sizes: 'auto' };
```

Skipped automatically: images that already have a `srcset`, `data:`/`blob:`/absolute-`http(s)` sources, and non-`<img>` children (`<video>`, `<picture>`, nested `<ui-media>`). No `srcset` token (`asr()` absent) → height is omitted so Cloudflare keeps the natural ratio.

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
| `sizes="auto"` (responsive `srcset`) | Chrome 121+, Firefox 101+; elsewhere falls back to the default `sizes` |
| `corner-shape: superellipse` (`rds(*-sq)`) | Chrome 135+; degrades to the rounded radius |
| Container queries (responsive host) | Chrome 105+, Firefox 110+, Safari 16+ |
| `::scroll-marker` / `::scroll-button` (carousel controls) | Chromium-only; **degrades to a swipeable scroller** elsewhere |
| `anchor()` positioning (carousel controls) | Chromium-only (same gate) |
| `text-box: cap alphabetic` (sticker line-trim) | Chrome 133+; degrades to normal leading |
| `corner-shape` (chip squircle) | Chrome 135+ |
| `color-mix()` / `light-dark()` (tokens) | Chrome 111+/123+, Firefox 113+/120+, Safari 16.2+/17.5+ |

Graceful degradation: the carousel always remains a native, swipeable scroll-snap row even without `::scroll-marker`/`anchor()`; markers and the scrim are pure CSS and need no JS.
