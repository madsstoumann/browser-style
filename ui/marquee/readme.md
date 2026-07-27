# @browser.style/marquee

A CSS-only scrolling content strip — zero JavaScript. Scrolls text, logos, images
or chips across a clip viewport. Part of the card-furniture family alongside
`@browser.style/chip`, `@browser.style/beacon` and `@browser.style/sticker` —
same `theme=` hue axis, same `fill=`/`ink=` escape hatch, same size scale, same
corner vocabulary and the same dual-arm token model (standalone attribute + card
`media="marquee(…)"` token).

> **v5 is a full rewrite.** The old `.ui-marquee` label + hidden-checkbox markup
> and `uiMarquee.js` are gone. See [Migration 4.x → 5.0](#migration-4x--50).

## Features

- **Three modes**
  - **Fade before repeat** (default) — the run fully clears the frame before it
    repeats, at *any* content length. All modern browsers, no JS.
  - **Loop** (`variant="loop"`) — never-ending continuous **text** that re-appears
    with no fade ("BREAKING NEWS • …"). Two identical copies + `translate -100%`.
    All modern browsers.
  - **Seamless** (`variant="seam"`) — gap-free **logo/item** loop via the
    modern css-tip `offset`/`sibling-count()` technique. Chrome-only; degrades to
    fade mode everywhere else.
- **Four directions** — `left` (default), `right`, `up`, `down`. Horizontal flips
  automatically under `dir="rtl"`.
- **Pauses on hover / focus** — `:hover` and `:focus-within` stop the scroll so a
  reader can catch up (jump-free; CSS can't change speed mid-run without a snap).
- **`paused` attribute** — declarative full stop; toggle from JS.
- **Optional edge-fade** (`fade`) — a static mask melts both ends into the
  background; the scroll-shadow analog.
- **Type control** — `font=` bag for family / weight / italic.
- **Hues** — the shared `theme=` axis or arbitrary `fill=` / `ink=` colours.
- **Reduced-motion safe** — under `prefers-reduced-motion: reduce` no marquee
  ever auto-scrolls (WCAG 2.3.1); the strip becomes hand-scrollable instead.
- **No wrapper** — content is direct children, or zero-markup via `aria-label`
  (fills `::before`/`::after`, and doubles as the accessible name).
- **Zero JavaScript** — every mode is pure CSS.

---

## Install

```bash
npm install @browser.style/marquee
```

Peer dependency:

```bash
npm install @browser.style/base
```

---

## DOM structure

`<ui-marquee>` is the clip viewport. **No wrapper element** — content comes from
direct children, or from `aria-label` (which also becomes the accessible name):

```html
<!-- fade: one child is the moving run -->
<ui-marquee><span>Breaking news …</span></ui-marquee>

<!-- loop: two identical children (2nd aria-hidden) -->
<ui-marquee variant="loop">
  <span>NEWS • </span><span aria-hidden="true">NEWS • </span>
</ui-marquee>

<!-- seam: the logos/items themselves, no wrapper -->
<ui-marquee variant="seam">
  <img src="logo-1.svg" alt="ACME">
  <img src="logo-2.svg" alt="Globex">
  <img src="logo-3.svg" alt="Initech">
</ui-marquee>

<!-- zero-markup text via aria-label (fills ::before, + ::after for loop) -->
<ui-marquee aria-label="Breaking news …"></ui-marquee>
<ui-marquee variant="loop" aria-label="NEWS • NEWS • NEWS • "></ui-marquee>
```

How content maps to items:

- **fade** — one child (or `::before` from `aria-label`) is the moving run.
- **loop** — two identical items shifted `-100%` each; supply two children, or an
  `aria-label` on an **empty** marquee (it fills `::before` **and** `::after`).
- **seam** — the direct children are the items the css-tip path staggers.

> `aria-label` only generates content when the marquee is `:empty`. With children
> present it's just the accessible name.

---

## Usage

### CSS-only (vanilla HTML)

```html
<link rel="stylesheet" href="@browser.style/base/index.css">
<link rel="stylesheet" href="@browser.style/marquee/index.css">

<ui-marquee><span>Latest headlines scroll here …</span></ui-marquee>
```

No script tag — `<ui-marquee>` renders as a styled unknown element, exactly like
`<ui-beacon>`.

---

## Modes

### Fade before repeat (default)

A single run scrolls in, fully exits, then repeats. The keyframe animates
`translate: 100cqi → -100%`: `100cqi` is the full viewport (content starts fully
off-screen) and `-100%` is the track's own `max-content` size (content is fully
gone before it loops) — so it clears correctly for any length, no measurement
needed.

```html
<ui-marquee><span>This clears the frame completely before looping.</span></ui-marquee>
```

### Loop — `variant="loop"`

For a never-ending **text** ticker where the phrase re-appears with no fade — the
classic "BREAKING NEWS • BREAKING NEWS •" scroller. Cross-browser, no JS: two
identical items sit side by side and each shifts by exactly `-100%` of its own
width, so the second lands where the first began.

```html
<!-- two direct children (2nd aria-hidden) -->
<ui-marquee variant="loop" theme="red">
  <span>BREAKING NEWS &bull; BREAKING NEWS &bull; BREAKING NEWS &bull; </span>
  <span aria-hidden="true">BREAKING NEWS &bull; BREAKING NEWS &bull; BREAKING NEWS &bull; </span>
</ui-marquee>

<!-- or zero markup: aria-label fills ::before + ::after -->
<ui-marquee variant="loop" theme="red" aria-label="BREAKING NEWS • BREAKING NEWS • BREAKING NEWS • "></ui-marquee>
```

Two rules for a gap-free result:

1. **Repeat the phrase** enough that one copy already exceeds the frame width
   (otherwise you get empty space, not a gap-free loop).
2. **Provide two identical copies** — two children, or the `aria-label` form
   which auto-supplies the second via `::after`. Bake spacing into the text (a
   trailing `• `); the container `gap` is forced to `0` so the `-100%` stays exact.

Works with every direction (`right` / `up` / `down` reorient it) and with `fade`,
`theme`, `font`, `speed`, etc.

### Seamless — `variant="seam"`

For logo strips and repeating items. Each item rides an `offset` path sized by
`sibling-count()` and staggered by `sibling-index()`, producing a continuous
gap-free loop with **no content duplication**.

```html
<ui-marquee variant="seam" style="--ui-marquee-item-size: 9rem;">
  <img …><img …><img …><img …>
</ui-marquee>
```

Tune it with `--ui-marquee-item-size` (nominal item size) and
`--ui-marquee-visible` (how many are visible at once, default `4`).

> **Chrome-only.** `offset` with `shape()` / `sibling-count()` is not yet in
> Firefox or Safari. There, the `@supports` gate falls through and the marquee
> uses the fade animation instead — no broken layout. Vertical seamless is not
> supported and also falls back to fade.

---

## Directions

| Value | Motion |
|---|---|
| `left` | **default** — content scrolls left (right → left) |
| `right` | content scrolls right |
| `up` | vertical, bottom → top |
| `down` | vertical, top → bottom |

```html
<ui-marquee direction="right"><span>→</span></ui-marquee>
<ui-marquee direction="up" style="--ui-marquee-block-size: 10rem;">
  <div><p>Line one</p><p>Line two</p><p>Line three</p></div>
</ui-marquee>
```

Vertical directions need a height — set `--ui-marquee-block-size` (default
`12rem`). Under `dir="rtl"` the default `left` becomes `right` automatically.

---

## Colours — the shared `theme=` axis

```html
<ui-marquee theme="red"><span>Breaking</span></ui-marquee>
<ui-marquee theme="slate"><span>Markets ticker</span></ui-marquee>
```

Arbitrary colours via `fill=` (plate) and `ink=` (text); ink auto-contrasts from
fill when omitted:

```html
<ui-marquee fill="#8b5cf6"><span>Violet plate, auto ink</span></ui-marquee>
<ui-marquee fill="#facc15" ink="#111"><span>Explicit ink</span></ui-marquee>
```

Without a colour the marquee is transparent (it reads over whatever it sits on —
e.g. card media).

---

## Type — `font=`

An order-free bag controlling the content type:

```html
<ui-marquee font="mono bold italic"><span>Ticker</span></ui-marquee>
```

- **family** — `body` · `heading` · `mono` · `serif`
- **weight** — `thin light normal medium semibold bold black`
- **style** — `italic`

Each is also settable directly via `--ui-marquee-font-family` /
`--ui-marquee-font-weight` / `--ui-marquee-font-style`.

---

## Speed & pause

```html
<ui-marquee speed="fast"><span>10s base</span></ui-marquee>
<ui-marquee speed="slow"><span>40s base</span></ui-marquee>
<ui-marquee paused><span>Stopped until paused is removed</span></ui-marquee>
```

- `speed` — `slow` (40s) · `normal` (20s, default) · `fast` (8s) · `faster` (4s),
  or set `--ui-marquee-duration` directly for any value. Note duration is
  time-per-cycle, so longer content scans faster at the same `speed`.
- **Hover / focus** pause the scroll (jump-free) so a reader can catch up. CSS
  can't change speed mid-run without the position snapping, so pausing is used
  instead of slowing; for a true slow-down set `element.getAnimations()` /
  `playbackRate` via the Web Animations API.
- `paused` freezes any running animation. Toggle from JS:
  ```js
  marquee.toggleAttribute('paused');
  ```

---

## Edge-fade — `fade`

```html
<ui-marquee fade><span>Edges melt into the background</span></ui-marquee>
```

A static `mask` gradient, auto-oriented to the scroll axis (horizontal or
vertical). Width via `--ui-marquee-fade-size` (default `3rem`). Mirrors the
*look* of `ui-card`'s `scr(x)` / `scr(y)` scroll-shadows (this component has no
scroll container, so the mask is static rather than scroll-driven).

---

## Attributes

| Attribute | Type | Description |
|---|---|---|
| `variant` | `loop \| seam \| fade` | `loop` = never-ending text (all browsers); `seam` = gap-free (seamless) item loop (Chrome); `fade` = edge-fade mask |
| `direction` | `left \| right \| up \| down` | Scroll direction (default `left`; flips under `dir="rtl"`) |
| `theme` | `red \| orange \| green \| blue \| accent \| gray \| slate \| black \| white` + `pale \| muted \| light \| dark` | Shared hue axis |
| `fill` | `<color>` | Arbitrary plate colour; overrides `theme` |
| `ink` | `<color>` | Text colour; overrides the value derived from `fill` |
| `size` | `sm \| md \| lg \| xl \| 2xl` | Font-size scale (default `md` = `1em`) |
| `radius` | `non \| rnd \| pll \| crc \| sqr` | Corner shape (default `non`) |
| `font` | family · weight · `italic` | Type control bag (see above) |
| `speed` | `slow \| normal \| fast \| faster` | Base duration (`40s \| 20s \| 8s \| 4s`) |
| `gap` | `sm \| lg` | Space between repeated items |
| `fade` | _(boolean)_ | Edge-fade mask (same as `variant="fade"`) |
| `paused` | _(boolean)_ | Freeze the animation |
| `aria-label` | `<string>` | On an **empty** marquee, becomes the scrolling text via `::before` (+ `::after` for loop) — and the accessible name |

---

## Component tokens

Every token falls back to a global from `@browser.style/base` where one exists.

| Token | Default | Description |
|---|---|---|
| `--ui-marquee-duration` | `20s` | Base scroll cycle |
| `--ui-marquee-gap` | `2rem` | Space between repeated items |
| `--ui-marquee-fade-size` | `3rem` | Edge-fade mask width |
| `--ui-marquee-item-size` | `150px` | Seamless: nominal item size |
| `--ui-marquee-visible` | `4` | Seamless: items visible at once |
| `--ui-marquee-block-size` | `12rem` | Height for vertical directions |
| `--ui-marquee-bg` | `transparent` | Plate background (set by `theme`/`fill`) |
| `--ui-marquee-c` | `inherit` | Text colour (set by `theme`/`ink`) |
| `--ui-marquee-radius` | `0` | Corner radius |
| `--ui-marquee-corner` | `round` | `corner-shape` (`sqr` → superellipse) |
| `--ui-marquee-font-family` | `inherit` | Content font family |
| `--ui-marquee-font-weight` | `var(--font-weight-semibold)` (600) | Content font weight |
| `--ui-marquee-font-style` | `normal` | Content font style |
| `--ui-marquee-font-size` | `1em` | Content font size (drives the scale) |
| `--ui-marquee-padding-block` | `0.5em` | Viewport block padding |
| `--ui-marquee-padding-inline` | `0` | Viewport inline padding |

---

## Card furniture — `marquee(…)` tokens

Inside the card system a marquee is designed to be **overlay furniture** on
`<ui-media>` (a scrolling banner across the image) or a flowing ticker inside
`<ui-content>`. The component already ships the card-routing arms, so every axis
works from the parent `media=` string:

```html
<ui-card media="asr(16/9) marquee(red) marquee(fade)">
  <cq-box>
    <ui-media>
      <img src="…" alt="">
      <ui-marquee><span>Now showing · Live coverage · Breaking</span></ui-marquee>
    </ui-media>
    …
  </cq-box>
</ui-card>
```

| Axis | Tokens |
|---|---|
| hue | `marquee(red\|orange\|green\|blue\|accent\|white\|gray\|slate\|black)` |
| hue modifier | `marquee(pale)` (light tint + hue ink) · `marquee(muted)` (translucent plate) — add alongside a hue, e.g. `marquee(green) marquee(pale)` |
| mode | `marquee(rpt)` (alias: `marquee(loop)`, deprecated) · `marquee(seam)` · `marquee(fade)` |
| direction | `marquee(right)` · `marquee(up)` · `marquee(down)` |
| size | `marquee(sm\|lg\|xl\|2xl)` |
| corner | `marquee(non\|rnd\|pll\|crc\|sqr)` |
| speed | `marquee(slow)` · `marquee(fast)` · `marquee(faster)` |
| gap | `marquee(gap-sm)` · `marquee(gap-lg)` |

> **Note:** the `ui/card` side of the integration (the low-z-index band
> positioning inside `<ui-media>`, below the other furniture) is a separate
> follow-up. As furniture the marquee is intended to sit *below* chips / stickers
> / beacons — a background banner, not a foreground badge.

---

## Migration 4.x → 5.0

**The markup changed** from a `<label>`-with-checkbox to a custom element:

```html
<!-- 4.x -->
<label class="ui-marquee">
  <input type="checkbox" data-sr>
  <span>…</span>
</label>

<!-- 5.0 -->
<ui-marquee><span>…</span></ui-marquee>
```

- **Pause** is now the `paused` attribute, not the hidden checkbox (the
  "checkbox hack" and `uiMarquee.js` are removed entirely).
- **RTL** still works via `dir="rtl"` — it now flips the *direction* rather than
  swapping keyframes.
- **`--ui-marquee-animdur`** → **`--ui-marquee-duration`** (or use `speed=`).
- **No JavaScript** — the content-width measurement is replaced by
  container-query units, so the strip clears correctly on its own.

---

## Framework integration

### React

```jsx
import '@browser.style/base';
import '@browser.style/marquee/style';

<ui-marquee theme="red"><span>Breaking</span></ui-marquee>
```

### Vue

```vue
<script setup>
import '@browser.style/base';
import '@browser.style/marquee/style';
</script>

<template>
  <ui-marquee theme="red"><span>Breaking</span></ui-marquee>
</template>
```

> Tell Vue to skip custom-element resolution in `vite.config.js`:
> ```js
> vue({ template: { compilerOptions: { isCustomElement: tag => tag.startsWith('ui-') } } })
> ```

### Svelte

```svelte
<script>
  import '@browser.style/base';
  import '@browser.style/marquee/style';
</script>

<ui-marquee theme="red"><span>Breaking</span></ui-marquee>
```

### Astro / server-rendered HTML

```html
<link rel="stylesheet" href="@browser.style/base/index.css">
<link rel="stylesheet" href="@browser.style/marquee/index.css">

<ui-marquee theme="red"><span>Breaking</span></ui-marquee>
```

---

## Implementation notes

The `ui-marquee.css` comments are kept terse; the reasoning behind the mechanics
lives here.

### Items, and no wrapper

`<ui-marquee>` is the clip viewport (`overflow: hidden`, `container-type`, `flex`).
The **items** are its direct children — or `::before`/`::after` generated from
`aria-label` when the marquee is `:empty`. Animation is var-driven: the host sets
`--_name` (which keyframes) and `--_dir` (direction), and every item — child or
pseudo — reads them via `animation: var(--_name) …; animation-direction: var(--_dir)`.
That's why one item rule covers children and pseudos, and why the mode/direction
rules only need to flip a custom property on the host.

### Fade mode — why `100cqi → -100%`

The default keyframe animates the item's `translate` from `100cqi` (the full host
width → content starts fully off the right edge) to `-100%` (the item's own
`max-content` width → content is fully gone before the loop repeats). Because the
end is a percentage of the *item*, it clears correctly at **any** content length —
that's what the old `uiMarquee.js` measured `scrollWidth` for; container-query
units replace it, so the component is zero-JS. Vertical directions swap to
`cqb`/height and need a `--ui-marquee-block-size` so `100cqb` resolves.

### Loop mode — why gap `0` and `-100%`

`variant="loop"` uses **two identical items** (children, or `::before`+`::after`),
each shifted `-100%` of its own width. Since they're the same width they move in
lockstep, and copy 2 lands exactly where copy 1 began — seamless, no measurement,
no offset paths. The container `gap` is forced to `0` so the `-100%` stays exact
(bake spacing into the text).

### Seamless mode — css-tip, and why it's Chrome-only

`variant="seam"` uses the [css-tip logo-marquee](https://css-tip.com/logo-marquee/)
technique: each **direct child** rides an `offset` path sized by `sibling-count()`
and staggered by `sibling-index()` (host just switches `--_name` to the offset
keyframes). It's `@supports`-gated on `offset-path: shape(...)`; where that isn't
supported (Firefox, Safari) the fade animation from section B stays in force.
Horizontal only — vertical seamless falls back to fade.

### Why not repeat the text as a background image?

Tempting: tile one string with an SVG `<text>` `background: …repeat-x` and animate
`background-position-x` — a truly infinite loop from a single element, no children,
no `::after`. Two dealbreakers for this component: (1) **web fonts don't render**
inside a data-URI SVG used as `background-image` (no `@font-face` access in that
context), so `font=` / `--ui-marquee-font-family` would be limited to system
families; (2) the text becomes **pixels** — not selectable, not in the a11y tree.
The current real-text approach keeps fonts and accessibility; the duplicated copy
is one repaint, not a cost worth trading those for.

CSS `element()` (which could have referenced a live DOM node as an image) never
went cross-browser — it only ever shipped as Firefox's prefixed `-moz-element()`
and the spec stalled — so it's not an option either.

### Why pause, not slow, on hover

CSS can't change `animation-duration` mid-run without remapping elapsed time —
the scroll position snaps. So hover / focus **pause** (jump-free) rather than
slow. The pause rule targets both the fade/loop track (`> *`) and the seamless
items (`> * > *`). The seamless block uses animation **longhands** (not the
`animation` shorthand) on purpose: the shorthand resets `animation-play-state` to
`running`, and being later in source order than the pause rule it would override
it. For a true slow-down, drive `playbackRate` via the Web Animations API:

```js
marquee.querySelectorAll('*').forEach(el =>
  el.getAnimations().forEach(a => a.playbackRate = 0.3));
```

---

## Accessibility

- **No auto-scroll under reduced motion** — every animation is gated behind
  `prefers-reduced-motion: no-preference`; `reduce` users get a static,
  hand-scrollable strip (WCAG 2.3.1, "Pause, Stop, Hide").
- Hover / focus pause the motion; `paused` stops it.
- Content is real DOM text/markup — screen readers read it normally. Avoid
  putting essential, time-limited information *only* in a marquee.
- The `aria-label` form exposes the text as the element's accessible **name**
  (the visible glyphs are CSS-generated `content`); prefer real child text when
  the wording must be reliably announced across every screen reader.
- `user-select: none` keeps the moving text from being awkward to select; the
  reduced-motion static strip remains selectable.

---

## Browser support

- **Fade mode, loop mode, directions, edge-fade, theming** — all modern browsers
  (Chrome, Firefox, Safari, Edge). Uses container-query units, `mask`, `attr()`
  with `type()`, `contrast-color()`.
- **Seamless mode** — Chrome only (`offset` + `shape()` + `sibling-count()`);
  falls back to fade mode elsewhere via `@supports`.
