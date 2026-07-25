# @browser.style/beacon

A CSS-only status indicator — zero JavaScript. Five layout variants (bare dot, dots, pill, solid, ticker) and three animation modes (blink, pulse, breathe). Part of the card-furniture family alongside `@browser.style/chip`, `@browser.style/sticker`, `@browser.style/play` and `@browser.style/save` — same `theme=` hue axis, same `fill=`/`ink=` escape hatch, same size scale, same corner vocabulary.

> **v5 is a breaking change.** The `color=` attribute is gone and three custom properties were renamed. See [Migration 4.x → 5.0](#migration-4x--50).

## Features

- **Bare dot** by default — colored circle with optional inline label
- **Three distinct animations**: `blink` (broadcast LIVE/REC), `pulse` (outward ripple, attention), `breathe` (gentle scale)
- **Pill variant** — chip-style tinted background with inner dot
- **Solid variant** — original `<blink>`-style filled label, defaults to blink
- **Dots variant** — chat-style "typing" indicator: three dots bobbing in a staggered sine wave
- **Ticker variant** — sliding marquee with trailing 3-dot loader
- **Motion is opt-in**: every animation is gated behind `prefers-reduced-motion: no-preference` — reduced-motion users get a static beacon automatically; pause a running animation with the `paused` attribute
- **Sizes**: `xs`, `sm`, `md` (default), `lg`, `xl`, `2xl` — the `<ui-chip>` scale
- **Hues**: the shared `theme=` axis (`red orange green blue accent gray slate black white` + `pale`/`muted`/`light`/`dark`), or arbitrary colours via `fill=` / `ink=`
- **Corners**: `radius="rnd | sqr | pll"` on the plated faces
- Light/dark mode via design tokens
- **Zero JavaScript, markup-free** — every face is plain text content; the ticker's sliding panel and dot loader are pseudo-elements driven by one registered `@property` animation clock

---

## Install

```bash
npm install @browser.style/beacon
```

Peer dependency:

```bash
npm install @browser.style/base
```

---

## Usage

### CSS-only (vanilla HTML)

```html
<link rel="stylesheet" href="@browser.style/base/index.css">
<link rel="stylesheet" href="@browser.style/beacon/index.css">
```

Bare dots need no inner markup:

```html
<ui-beacon theme="green"></ui-beacon>
<ui-beacon theme="red" animation="blink">Recording</ui-beacon>
```

Solid / pill need no inner markup either:

```html
<ui-beacon variant="solid" theme="red">LIVE</ui-beacon>
```

The ticker too — no inner markup:

```html
<ui-beacon variant="ticker" theme="red">Live</ui-beacon>
```

### How the markup-free ticker works

Transforms can't move inline text and CSS can't wrap a text node — but
`text-indent` is animatable. One registered `@property --_slide` percentage,
animated by a single host animation, drives the text (`text-indent`), the
colored panel (`::before` translate) and the dot loader (`::after` translate)
in frame-perfect sync; a paired `--_fade` and a `color` flip in the same
keyframes handle the wrap-around jump. There is no JavaScript in this package.

---

## Variants

### Bare dot (default)

A colored circle. Optionally followed by an inline label.

```html
<ui-beacon theme="green"></ui-beacon>           <!-- presence dot -->
<ui-beacon theme="green">Online</ui-beacon>     <!-- dot + label -->
```

Use cases: presence (online / away / busy), notification dots, inline status.

### Pill — `variant="pill"`

Chip-style tinted background with a colored dot inside.

```html
<ui-beacon variant="pill" theme="blue">Beta</ui-beacon>
<ui-beacon variant="pill" theme="red" animation="blink">Live</ui-beacon>
```

### Solid — `variant="solid"`

A solid-coloured pill whose whole face flashes. Defaults to `blink` animation. The classic LIVE / REC label.

```html
<ui-beacon variant="solid" theme="red">LIVE</ui-beacon>
<ui-beacon variant="solid" theme="blue">News</ui-beacon>
<ui-beacon variant="solid" theme="red" animation="none">Static</ui-beacon>
```

### Dots — `variant="dots"`

The chat "someone is typing" indicator: three dots hopping in sequence, then a short rest
beat before the loop repeats. It's the bare-dot face with three dots instead of one,
so an optional label still works. Animates by default — reads as a live/updating marker
in front of a headline.

```html
<ui-beacon variant="dots" theme="red"></ui-beacon>
<ui-beacon variant="dots" theme="red">Liveblog</ui-beacon>
<ui-beacon variant="dots" animation="none"></ui-beacon>   <!-- static -->
```

Tune it with `--ui-beacon-dots-size` (dot diameter), `--ui-beacon-dots-jump` (how far it
travels), `--ui-beacon-dots-width` (strip width) and `--ui-beacon-bounce-duration` (cycle).

> Each dot's arc is `sin²`, sampled every 4% and run `linear`. Both details matter: an
> easing function eases between *every* keyframe pair, so a sparse version stutters —
> the curve does the easing instead. And `sin²` has zero velocity at both ends, so a dot
> settles onto the line rather than snapping to a halt. The three hops finish at 75%,
> leaving a quarter-cycle rest beat before the loop repeats.

### Ticker — `variant="ticker"`

Slide-out / slide-in compound animation with a trailing 3-dot loader.

```html
<ui-beacon variant="ticker" theme="red">Live</ui-beacon>
```

---

## Animations

| Value | Motion | Use case |
|---|---|---|
| `blink` | Opacity 1 → 0 → 1 (1.5 s) | LIVE, REC, broadcast |
| `pulse` | Box-shadow ring expanding outward + fading (1.5 s, ease-out) | Attention, onboarding, "new feature" |
| `breathe` | Scale 1 ↔ 0.8 + opacity 1 ↔ 0.6 (2 s, ease-in-out) | Ambient, processing, idle |
| _(omitted)_ | none | Presence dot, notification dot |

In default + pill variants the animation targets the dot. In solid the whole pill animates. The ticker variant has a built-in slide animation regardless of the `animation` attribute.

### Staggering a row

Every animation shorthand takes `--ui-beacon-delay` (default `0s`), so a row of beacons
can be offset without touching the durations:

```css
/* sibling-index() is 1-based — subtract 1 to keep the first beacon at 0s */
.stagger ui-beacon { --ui-beacon-delay: calc((sibling-index() - 1) * 0.3s); }
```
```html
<p class="stagger">
  <ui-beacon variant="solid">Live now</ui-beacon>
  <ui-beacon variant="solid">On Air</ui-beacon>
  <ui-beacon variant="solid">LIVE</ui-beacon>
</p>
```

No index bookkeeping in the markup — add or reorder beacons and the offsets follow.
`sibling-index()` counts elements only, so the whitespace between them is ignored.

It applies to every face — blink, pulse, breathe and the ticker slide (with its dot
loader kept in step).

### RTL

The `ticker` face is pinned to `direction: ltr`. Its slide is driven by signed
percentages on `text-indent` and `translate`, which invert under `direction: rtl` and
desynchronise the label from the panel it rides on. The label's own bidi run still
shapes correctly, so RTL text renders normally inside an LTR ticker. Every other face
is fully logical and flips as expected.

---

## Sizes

`xs`, `sm`, `md` (default), `lg`, `xl`, `2xl` — em-based, the same scale as `<ui-chip>`.
A bare `<ui-beacon>` is identical to `size="md"`. The dot tracks the font size, so the
whole beacon scales as one unit.

| Value | Font size | |
|---|---|---|
| `xs` | `0.5em` | beacon extra — no chip equivalent |
| `sm` | `0.625em` | |
| `md` | `0.875em` | **default** |
| `lg` | `1em` | |
| `xl` | `1.15em` | |
| `2xl` | `1.4em` | |

```html
<ui-beacon size="xs" theme="green"></ui-beacon>
<ui-beacon size="lg" theme="green"></ui-beacon>
<ui-beacon size="2xl" theme="green"></ui-beacon>
```

---

## Colors — the shared `theme=` axis

Beacon opts into the cross-component `theme=` axis (see `ui/base/theme.md`) exactly
like `<ui-chip>`, `<ui-sticker>`, `<ui-play>` and `<ui-save>`: one colour token
(`red orange green blue accent white gray slate black`) plus modifiers (`pale`,
`muted`, `light`, `dark`). The theme feeds the beacon's hue input
(`--ui-beacon-accent`) and the paired ink (`--ui-beacon-c`) used by the plated
`solid` / `ticker` faces.

```html
<ui-beacon theme="red">Recording</ui-beacon>
<ui-beacon theme="red pale" variant="pill">Live</ui-beacon>
<ui-beacon theme="slate dark" variant="solid">REC</ui-beacon>
```

Without a `theme`, the dot uses the current text colour.

Each hue carries a curated ink, so a light plate never gets white text —
`theme="orange"` on a solid beacon renders **dark** label text.

### Arbitrary colours — `fill=` / `ink=`

`fill` sets the accent (dot, solid plate, ticker panel). On the plated faces the label
is derived from it with `contrast-color()`, so it stays readable without you picking a
pair. `ink` overrides that derived label.

```html
<ui-beacon fill="#8b5cf6">Violet dot</ui-beacon>
<ui-beacon fill="#facc15" variant="solid">Auto-contrasted ink</ui-beacon>
<ui-beacon fill="#8b5cf6" ink="gold" variant="solid">Explicit ink</ui-beacon>
```

### The three colour slots

| Slot | Read by | Notes |
|---|---|---|
| `--ui-beacon-accent` | dot, pill/ticker tint, solid plate, ticker panel, bare-dot + pill label | the hue input — `theme=` / `fill=` / `beacon(<hue>)` all write here |
| `--ui-beacon-bg` | pill, solid, ticker | the plate. Unset by default; each face supplies its own fallback |
| `--ui-beacon-c` | **solid + ticker labels only** | the ink. The bare dot and pill have no opaque plate, so their label is the accent — a curated white ink would vanish on the page background |

---

## Corners — `radius=`

`rnd` rounded · `sqr` squircle · `pll` fully rounded. Applies to the plated faces
(`pill`, `solid`, `ticker`).

```html
<ui-beacon variant="solid" theme="red" radius="rnd">LIVE</ui-beacon>
<ui-beacon variant="solid" theme="red" radius="sqr">LIVE</ui-beacon>
<ui-beacon variant="ticker" radius="pll">Live</ui-beacon>   <!-- pill ticker -->
```

`non` is deliberately **not** part of this axis — beacon spends that token on
animation-off (`beacon(non)`). `crc` is omitted because a circle makes no sense on a
text-bearing plate.

`pll` is the one asymmetric member. As an **attribute** it is free, because `radius=`
and `variant=` are separate namespaces — so `radius="pll"` gives you a pill ticker or a
pill solid. There is no `beacon(pll)` **card token** for it, because in the card's flat
token namespace `beacon(pll)` already means the *pill face*. From a card, reach it with
an inline `--ui-beacon-radius: var(--radius-pill)` instead.

## Card furniture — `beacon(…)` tokens

Inside the card system, a beacon is **overlay furniture** on `<ui-media>` — the
animated counterpart to the static `<ui-chip>` (LIVE / REC / Breaking). Everything is
driven from the parent `media=` string, same as chip/sticker (single-value tokens,
one axis per token):

```html
<ui-card media="asr(16/9) beacon(sld) beacon(red) beacon(bln)">
  <cq-box>
    <ui-media>
      <img src="…" alt="">
      <ui-beacon>LIVE</ui-beacon>
    </ui-media>
    …
  </cq-box>
</ui-card>
```

| Axis | Tokens | Notes |
|---|---|---|
| position | `beacon(ts…be)` | 9-cell furniture grid; default `ts` — same cell as the chip, so position one explicitly when a frame carries both |
| hue | `beacon(red\|orange\|green\|blue\|accent\|white\|gray\|slate\|black)` | same `--ui-theme-*` bundles as `chip()`/`sticker()` |
| hue modifier | `beacon(pale)` · `beacon(muted)` | pale = light tint + hue ink · muted = translucent plate; add alongside a hue, e.g. `beacon(red) beacon(pale)` |
| face | `beacon(dts)` dots · `beacon(pll)` pill · `beacon(sld)` solid · `beacon(tck)` ticker | over imagery prefer these — the bare dot has no contrast plate |
| animation | `beacon(bln)` blink · `beacon(pls)` pulse · `beacon(brt)` breathe · `beacon(non)` off | solid defaults to blink |
| size | `beacon(xs\|sm\|md\|lg\|xl\|2xl)` | same em scale as the `size=` attribute |
| corner | `beacon(rnd\|sqr)` | plated faces only; `pll`/`non` belong to the face and animation axes |

As furniture the beacon is **marker-class** (like chip/sticker): plain
non-interactive markup, valid inside a reveal `<summary>`. Animations are
reduced-motion-gated like everywhere else; `paused` still works.

**Ticker as furniture — `beacon(tck)`** — a normal card token (dual arm with
the standalone `variant="ticker"` attribute), markup-free like every other
face: `<ui-beacon>Live</ui-beacon>` plus the token is all it takes.

---

## Pause behavior

Motion is **opt-in at the system level**: every animation lives inside
`@media (prefers-reduced-motion: no-preference)`, so under
`prefers-reduced-motion: reduce` no beacon animation ever starts (WCAG 2.3.1) —
no per-instance wiring needed.

For everyone else, the **`paused` attribute** freezes a running animation
declaratively; toggle it from JS:

```html
<ui-beacon variant="solid" theme="red" paused>Paused</ui-beacon>
```
```js
beacon.toggleAttribute('paused');
```

---

## Attributes

| Attribute | Type | Description |
|---|---|---|
| `theme` | `red \| orange \| green \| blue \| accent \| gray \| slate \| black \| white` + `pale \| muted \| light \| dark` | Shared hue axis (defaults to text colour) |
| `fill` | `<color>` | Arbitrary accent colour; overrides `theme` |
| `ink` | `<color>` | Label colour on the plated faces; overrides the value derived from `fill` |
| `size` | `xs \| sm \| md \| lg \| xl \| 2xl` | Size scale (defaults to `md`) |
| `radius` | `rnd \| sqr \| pll` | Corner shape of the plated faces |
| `animation` | `blink \| pulse \| breathe \| none` | Animation mode (defaults to none, except `solid` defaults to `blink`) |
| `variant` | `dots \| pill \| solid \| ticker` | Layout variant (defaults to bare dot) |
| `paused` | _(boolean)_ | Pause any active animation (animations never start under reduced motion) |

---

## Component tokens

Every token falls back to a global from `@browser.style/base` where one exists.

### Colour

| Token | Default | Description |
|---|---|---|
| `--ui-beacon-accent` | `var(--color-text)` | Hue input — dot, tint, solid plate, ticker panel |
| `--ui-beacon-bg` | _(unset)_ | Plate for pill / solid / ticker; each face falls back on its own |
| `--ui-beacon-c` | `contrast-color(var(--ui-beacon-accent))` | Label ink on the plated faces |
| `--ui-beacon-tint` | `15%` | Accent share in the pill / ticker plate `color-mix()` |

### Geometry & type

| Token | Default | Description |
|---|---|---|
| `--ui-beacon-font-size` | `0.875em` | Label font size (drives the whole scale) |
| `--ui-beacon-font-family` | `var(--font-form)` | Label font family |
| `--ui-beacon-font-weight` | `var(--font-weight-medium)` | Label font weight |
| `--ui-beacon-line-height` | `var(--line-height-snug)` | Label line height |
| `--ui-beacon-dot-size` | `0.75em` | Dot diameter (relative to the beacon's own font size) |
| `--ui-beacon-dot-radius` | `var(--radius-circle)` | Dot shape |
| `--ui-beacon-column-gap` | `0.6ch` | Space between the dot and the label |
| `--ui-beacon-radius` | `var(--radius-sm)` (`--radius-pill` on the pill face) | Plate corner radius |
| `--ui-beacon-corner` | `round` | `corner-shape` — `sqr` swaps in a superellipse |
| `--ui-beacon-padding-block` | `0.33em` | Plate padding |
| `--ui-beacon-padding-inline` | `0.8em` | Plate padding |
| `--ui-beacon-padding-inline-end` | `var(--ui-beacon-padding-inline)` | Plate padding, inline end |

### Motion

| Token | Default | Description |
|---|---|---|
| `--ui-beacon-delay` | `0s` | `animation-delay` on **every** face and animation — offset a row so the beacons don't move in lockstep |
| `--ui-beacon-blink-duration` | `1.5s` | Blink cycle |
| `--ui-beacon-pulse-duration` | `1.5s` | Pulse cycle |
| `--ui-beacon-pulse-spread` | `1em` | How far the pulse ring expands |
| `--ui-beacon-breathe-duration` | `2s` | Breathe cycle |
| `--ui-beacon-breathe-scale` | `0.8` | Breathe scale floor |
| `--ui-beacon-breathe-opacity` | `0.6` | Breathe opacity floor |
| `--ui-beacon-slide-duration` | `5s` | Ticker slide cycle |
| `--ui-beacon-bounce-duration` | `1.1s` | Dots-face hop cycle, rest beat included |
| `--ui-beacon-dots-duration` | `1.5s` | Ticker dot-loader cycle |
| `--ui-beacon-dots-size` | `0.35em` | Dots-face dot diameter |
| `--ui-beacon-dots-jump` | `0.25em` | Dots-face bob travel, above and below centre |
| `--ui-beacon-dots-width` | `1.4em` | Ticker dot-loader width |
| `--ui-beacon-dots-inset` | `1.5ch` | Ticker dot-loader inline-end offset |

---

## Migration 4.x → 5.0

**`color=` is removed.** The `theme=` hues resolve to the identical colours
(`--ui-theme-red-bg` *is* `--color-error`, and so on), so the swap is 1:1:

| 4.x | 5.0 |
|---|---|
| `theme="blue"` | `theme="blue"` |
| `theme="green"` | `theme="green"` |
| `theme="orange"` | `theme="orange"` |
| `theme="red"` | `theme="red"` |

**Renamed custom properties:**

| 4.x | 5.0 |
|---|---|
| `--ui-beacon-bg` (hue input) | `--ui-beacon-accent` — `--ui-beacon-bg` now means the *plate* |
| `--ui-beacon-ink` | `--ui-beacon-c` |
| `--ui-beacon-size` | `--ui-beacon-dot-size` |
| `--ui-beacon-ff` | `--ui-beacon-font-family` |
| `--ui-beacon-track-bg` | `--ui-beacon-bg` (the ticker track is just the plate) |

**Default size changed** from `0.75em` to `0.875em`, so a bare `<ui-beacon>` now matches
`size="md"` and the family scale. Pin the old look with `--ui-beacon-font-size: 0.75em`
or `size="sm"`.

**Ink now auto-contrasts.** Solid and ticker labels previously fell back to hardcoded
white, which failed on light plates (`theme="orange"` was white-on-amber). They now use
the hue's curated ink, or `contrast-color()` when the accent comes from `fill=`. Force a
specific colour with `ink="…"`.

---

## Framework integration

### React

```jsx
import '@browser.style/base';
import '@browser.style/beacon/style';

<ui-beacon theme="green">Online</ui-beacon>
<ui-beacon variant="solid" theme="red">LIVE</ui-beacon>
```

### Vue

```vue
<script setup>
import '@browser.style/base';
import '@browser.style/beacon/style';
</script>

<template>
  <ui-beacon theme="green">Online</ui-beacon>
  <ui-beacon variant="solid" theme="red">LIVE</ui-beacon>
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
  import '@browser.style/beacon/style';
</script>

<ui-beacon theme="green">Online</ui-beacon>
<ui-beacon variant="solid" theme="red">LIVE</ui-beacon>
```

### Astro / server-rendered HTML

```html
<link rel="stylesheet" href="@browser.style/base/index.css">
<link rel="stylesheet" href="@browser.style/beacon/index.css">

<ui-beacon theme="green">Online</ui-beacon>
<ui-beacon variant="solid" theme="red">
  <label><input type="checkbox" data-sr><span>LIVE</span></label>
</ui-beacon>
```

---

## Accessibility

- Animations are opt-in behind `prefers-reduced-motion: no-preference` — reduced-motion users never see them, with no media-query authoring required.
- The dot is decorative; expose status via the text label inside the beacon.
- Works without JavaScript (CSS-only mode).

---

## Browser support

All modern browsers (Chrome, Firefox, Safari, Edge). `:has()`, `color-mix()`, and `@container` are widely supported as of 2024.
