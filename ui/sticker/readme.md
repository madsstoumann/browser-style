# @browser.style/sticker

A CSS-first sticker component for promotional callouts — "Save 20%", "Best value", "-20%". A round disc by default, with optional star/heart/blob/speech shapes.

## Features

- Disc (default), `burst`, `spark`, `sunburst`, `heart`, `blob`, `speech` balloon or `text` shape (`variant`)
- `fill` = any CSS background color with auto-contrast ink; `ink` = any text color (override)
- Gradients via a custom class (set `--ui-sticker-bg`)
- Two typographic shorthands: `font` (label/body lines) and `font-lead` (the `<strong>` line)
- Six box sizes (`sm`–`3xl`) with fluid `cqi` text; `font="fit"` for native `text-fit` fill
- Soft or `solid` drop-shadows (with `off()` offset) that follow clipped shapes
- Opt-in `hover` effects (`lift`, `pop`, `tilt`, `spin`, `press` (+ `-tilt`/`-spin`)) — CSS-only, reduced-motion aware
- Square aspect-ratio with centered content
- Light/dark mode + RTL support via design tokens / logical properties
- Works without JavaScript (CSS-only mode)

---

## Install

```bash
npm install @browser.style/sticker
```

Peer dependency:

```bash
npm install @browser.style/base
```

> `@browser.style/base` provides the design token system that the sticker references for colors, radius, and typography.

---

## Usage

### CSS-only (vanilla HTML)

```html
<link rel="stylesheet" href="@browser.style/base/index.css">
<link rel="stylesheet" href="@browser.style/sticker/index.css">
```

Or via CSS `@import`:

```css
@import '@browser.style/base';
@import '@browser.style/sticker/style';
```

```html
<ui-sticker>Save 20%</ui-sticker>
<ui-sticker variant="burst" fill="#BC2F2F" ink="#fff">-20%</ui-sticker>
<ui-sticker fill="#3E9355" ink="#fff">Best value</ui-sticker>
```

### Web Component

Import the module to register `<ui-sticker>`:

```js
import '@browser.style/sticker';
```

The web component uses the **exact same** HTML structure as CSS-only — the JS only registers the element.

#### Attributes

| Attribute | Type | Description |
|-----------|------|-------------|
| `variant` | string | **Shape only:** `burst`, `spark`, `sunburst`, `heart`, `blob`, `speech(l)`, `speech(r)`, `text`, `clip` (bring-your-own via `--ui-sticker-clip-path`) |
| `fill` | color | Any CSS color → background; ink auto-contrasted via `contrast-color()` |
| `ink` | color | Any CSS color → text color; overrides the auto-contrast |
| `size` | string | Box size: `sm`, `md`, `lg` (default), `xl`, `2xl`, `3xl` |
| `font` | string | Typography for the `<small>`/`<span>` lines — order-free tokens: family (`body\|heading\|mono\|serif`) · size (`xs`…`2xl`) · weight (`thin`…`black`) · text-shadow `shadow(sm\|md\|lg\|xl)` soft or `shadow(solid\|solid-sm…solid-xl)` hard · `fit` |
| `font-lead` | string | Same vocabulary for the `<strong>` lead line |
| `gap` | string | Line gap: `sm`, `md`, `lg` |
| `shadow` | string | Box drop-shadow: `sm`…`2xl` or `solid`, plus offset `off(sm\|md\|lg\|xl)` / `-off(…)` (left) |
| `hover` | string | Opt-in hover effects (composable): `lift`, `pop`, `tilt`, `spin`, `press` (+ `-tilt`/`-spin`) |
| `angle` | angle | Rotation for `variant="text"` (e.g. `-3deg`) |

> **Migrating from 1.x:** `color` → `fill`; the `color-end`/`angle` gradient → a custom class; `variant`'s `fs()` → `font`/`font-lead` size, `fw()` → weight, `gap()` → `gap`, `sh()` → `shadow`, `shadow()` → `font="shadow()"`, `fit` → `font="fit"`, `ink()` → `ink`. (`glass` was removed.) `--ui-sticker-text-font` → `--ui-sticker-font-family`.

---

### React

```jsx
import '@browser.style/sticker';
import '@browser.style/sticker/style';

function SaleSticker({ amount }) {
  return <ui-sticker variant="burst" fill="#BC2F2F" ink="#fff">-{amount}%</ui-sticker>;
}
```

### Vue

```vue
<script setup>
import '@browser.style/sticker';
import '@browser.style/sticker/style';
</script>

<template>
  <ui-sticker fill="#3E9355" ink="#fff">Best value</ui-sticker>
</template>
```

> Tell Vue to skip custom element resolution in `vite.config.js`:
> ```js
> vue({ template: { compilerOptions: { isCustomElement: tag => tag.startsWith('ui-') } } })
> ```

### Svelte

```svelte
<script>
  import '@browser.style/sticker';
  import '@browser.style/sticker/style';
</script>

<ui-sticker variant="burst">Save 20%</ui-sticker>
```

### Astro / SSR

Use the CSS-only approach — no JavaScript needed:

```html
<link rel="stylesheet" href="@browser.style/base/index.css">
<link rel="stylesheet" href="@browser.style/sticker/index.css">

<ui-sticker fill="#BC2F2F" ink="#fff">-20%</ui-sticker>
```

---

## Colors — `theme` (hues) or `fill` + `ink` (arbitrary)

For a **named hue**, use `theme=` — the 8 theme hues `red orange green blue accent dark light subtle`, a background + paired ink in one keyword:

```html
<ui-sticker theme="red">Sale</ui-sticker>
<ui-sticker theme="green">In stock</ui-sticker>
```

For an **arbitrary colour**, think of it as print: **`fill`** is the stock/background, **`ink`** is
what's printed on it. They override `theme`.

`fill` takes **any CSS color**, read with `attr(fill type(<color>))` for the background; the text ink is auto-picked with `contrast-color()` — so any background gets legible text for free. The default background (no `theme`/`fill`) is `--color-accent`.

```html
<ui-sticker>Default</ui-sticker>
<ui-sticker fill="rebeccapurple">New</ui-sticker>
<ui-sticker fill="gold">Best value</ui-sticker>   <!-- → black ink -->
<ui-sticker fill="oklch(0.7 0.18 150)">Fresh</ui-sticker>
```

Set `ink` to override the auto-contrast with any color:

```html
<ui-sticker fill="#1d1d1d" ink="gold">Premium</ui-sticker>
```

> **Browser support:** typed `attr()` + `contrast-color()` need Chrome 133+ / Safari 17.4+. For older browsers, set `--ui-sticker-bg` (and `--ui-sticker-c`) directly via a custom class or inline style instead of `fill`/`ink`.

### Gradient (custom class)

Gradients are a custom class that sets `--ui-sticker-bg` (and `--ui-sticker-c`, since `contrast-color()` can't read a gradient). Works on discs and clipped shapes alike — the clip shapes paint `--ui-sticker-bg` on their `::before`, and the speech tail inherits it.

```css
.grad-teal { --ui-sticker-bg: linear-gradient(90deg, #38BC90, #21A7AE); --ui-sticker-c: #fff; }
```
```html
<ui-sticker class="grad-teal"><small>GRAB A</small><strong>DEAL</strong></ui-sticker>
<ui-sticker variant="heart" class="grad-teal"><strong>LOVE</strong></ui-sticker>
```

For a one-off, set the tokens inline:

```html
<ui-sticker style="--ui-sticker-bg: hotpink; --ui-sticker-c: black;">Sale</ui-sticker>
```

## Typography (`font` + `font-lead`)

Two order-free shorthand attributes, each a space-separated set of tokens — family (`body | heading | mono | serif`) · size (`xs`…`2xl`) · weight (`thin | light | normal | medium | semibold | bold | black`) · text-shadow — soft `shadow(sm)`…`shadow(xl)` or hard `shadow(solid)` / graded `shadow(solid-sm)`…`shadow(solid-xl)`:

- **`font`** styles the "other" lines — `<small>` and `<span>` (the shared label/body typography).
- **`font-lead`** styles the `<strong>` lead line.

A typical sticker is `<small>Save</small><strong>10%</strong><small>Today</small>` — the two `<small>` lines share `font`, the lead uses `font-lead`:

```html
<ui-sticker font="serif medium" font-lead="heading black">
  <small>Save</small><strong>10%</strong><small>Today</small>
</ui-sticker>
```

Children inside a line — `<sup>`, `<sub>` — inherit the line's family automatically.

`font`/`font-lead` only need the tokens you want to change; everything else keeps the tag default. The default ratios are `<small>` = 0.55 × base, `<strong>` = 1.1 × base, `<span>`/text = base, where the base line is `max(10px, 40cqi)` — i.e. 40 % of the box, with a 10px legibility floor.

> Set per-instance escape hatches with `--ui-sticker-small-font` / `--ui-sticker-strong-font` (family), `--ui-sticker-small-scale` / `--ui-sticker-strong-scale` (size ratio), `--ui-sticker-font-family` (the whole sticker), or `--ui-sticker-lead-c` to color the `<strong>` lead line independently (two-tone callouts).

## Fluid text (`cqi`)

The sticker is its own query container, so **element** lines size in `cqi` and scale automatically with the box — no media queries, no per-size font tweaks.

- **A raw text line** (no wrapping element) keeps a fixed `em` size.
- **Any element line** (`<span>`, `<strong>`, `<small>`, …) sizes in `cqi` and scales with the box.

```html
<ui-sticker>-20%</ui-sticker>            <!-- fixed em -->
<ui-sticker><span>-20%</span></ui-sticker> <!-- fluid, scales with size= -->
```

No `cq-box` wrapper is needed — each element line is already a descendant of the sticker container. `cqi` resolves against the *content* box, so the clipped shapes keep their padding small and lower the base a little so the text still fits the inner outline.

## Multi-line

A sticker is a centered grid: **each direct child is its own line**. Every child gets `text-box: cap alphabetic`, which trims the font's leading so the visual spacing is driven by the gap alone.

```html
<ui-sticker variant="burst">
  <small>SAVE</small>
  <strong>20%</strong>
</ui-sticker>
```

### Line gap

The gap is a **top-margin on the lines, sized as a fraction of the font** — not grid `gap`, because the host can't resolve `cqi` against itself. So the gap **scales with the box** too. `--ui-sticker-gap` is a unitless factor (default `0.16`); tune it with the `gap` attribute:

| `gap` | Factor |
|-------|--------|
| `sm` | 0.12 |
| `md` | 0.25 |
| `lg` | 0.45 |

```html
<ui-sticker gap="md">
  <small>FROM</small>
  <strong>$9</strong>
  <small>/mo</small>
</ui-sticker>
```

## Sizes

The `size` attribute scales the **box** (`--ui-sticker-sz`); element lines follow via `cqi`.

```html
<ui-sticker fill="#BC2F2F" ink="#fff" size="sm"><span>-20%</span></ui-sticker>
<ui-sticker fill="#BC2F2F" ink="#fff" size="3xl"><span>-20%</span></ui-sticker>
```

## Corners

`radius=` reshapes the plain disc: `non` sharp · `rnd` rounded · `pll` pill · `crc` circle (default) ·
`sqr` squircle. In a card, `sticker(<corner>)`. (The decorative `variant=` silhouettes — burst,
blob, heart… — set their own `clip-path` and ignore `radius`.)

```html
<ui-sticker theme="blue" radius="sqr"><strong>New</strong></ui-sticker>
```

## Shadow

Add a box drop-shadow with the `shadow` attribute. It uses `filter: drop-shadow()`, so it follows clipped star/heart outlines (a `box-shadow` would be cut off by `clip-path`).

| `shadow` | Shadow |
|----------|--------|
| `sm` | subtle (soft) |
| `md` | small (soft) |
| `lg` | medium (soft) |
| `xl` | large (soft) |
| `2xl` | extra large (soft) |
| `solid` | hard offset, zero-blur (comic look) |

`solid` is the classic tactical/sticker shadow — a big solid-black offset. Step the offset with `off(sm|md|lg|xl)`, or `-off(sm|md|lg|xl)` to throw the shadow to the **left** (negative x, e.g. for a left-pointing `speech(l)` balloon). Tune `--ui-sticker-shadow-x` / `-y` / `-color` directly for full control (e.g. a darker shade of the bg for a tinted shadow — `--ui-sticker-shadow-color: color-mix(in srgb, var(--ui-sticker-bg), #000 40%)`).

```html
<ui-sticker shadow="md">New</ui-sticker>
<ui-sticker variant="heart" fill="#BC2F2F" ink="#fff" shadow="lg"><span>Sale</span></ui-sticker>
<ui-sticker fill="orange" shadow="solid off(lg)"><span>SALE</span></ui-sticker>
```

## Hover (`hover`)

Opt-in, CSS-only hover effects — space-separated and composable (`hover="lift pop"`):

| Token | Effect |
|-------|--------|
| `lift` | rise up (keeps any author-set `shadow`) |
| `pop` | scale up |
| `tilt` / `-tilt` | small rotate, either direction |
| `spin` / `-spin` | one full turn, either direction |
| `press` | scale down on click (`:active`) |

The `-` prefix reverses direction (mirrors `shadow`'s `-off()`).

```html
<ui-sticker hover="lift" fill="#2F75BC" ink="#fff"><strong>Sale</strong></ui-sticker>
<ui-sticker variant="sunburst" hover="spin" fill="#7B5EA7" ink="#fff"><strong>New</strong></ui-sticker>
```

**Interactivity is opt-in.** A sticker is `pointer-events: none` by default — purely decorative, so it never blocks an underlying link or the card's own hover. Setting any `hover` value flips it to `pointer-events: auto` for self-hover.

**Two triggers.** Effects fire on the sticker's own `:hover` **and** on a hovered ancestor `ui-card` — so a sticker overlaid on a product card animates when you hover the card:

```css
&[hover~="lift"]:hover,
:where(ui-card:hover) ui-sticker[hover~="lift"] { /* … */ }
```

**Notes:**
- `tilt`/`-tilt` and `spin`/`-spin` all drive `rotate` — don't combine them.
- On `variant="text"` (which uses `rotate` for its tilt), prefer `pop`/`lift`; `tilt`/`spin` override the resting angle on hover.
- `prefers-reduced-motion: reduce` drops the movement (translate/scale/rotate/spin).

Tune via the `--ui-sticker-hover-*` tokens (see [Customization](#component-tokens)).

## Shape variants

The default is a disc. Set `variant` for a clipped shape (`variant` carries the shape only):

| `variant` | Shape | Technique |
|-----------|-------|-----------|
| `burst` | 24-point starburst | `clip-path: polygon()` |
| `spark` | sharp 10-point star (price seal) | `clip-path: polygon()` |
| `sunburst` | fine 40-point sawtooth ring | `clip-path: polygon()` |
| `heart` | heart | `clip-path: shape()` |
| `blob` | organic rounded splat | `clip-path: shape()` |
| `clip` | bring-your-own — set `--ui-sticker-clip-path` to any `polygon()`/`shape()` | custom |
| `speech(l)` / `speech(r)` | rounded balloon + tail (bottom-left / -right) | `border-radius` + `::after` tail |
| `text` | puffy lettering, no box | text-stroke + drop-shadow |

```html
<ui-sticker variant="burst" fill="#FEA12F" ink="#262626">Starburst</ui-sticker>
<ui-sticker variant="heart" fill="#BC2F2F" ink="#fff">Heart</ui-sticker>
<ui-sticker variant="speech(l)" fill="#2980b9"><span>Hi!</span></ui-sticker>
```

The clipped shapes draw their fill on a `::before` layer so the host stays unclipped and the `drop-shadow` follows the silhouette. The balloon isn't square: it uses a `5/4` aspect-ratio and a tail that **inherits the fill** (solid or gradient) and is included in the `drop-shadow`.

## Text sticker (`variant="text"`)

Puffy "sticker lettering" — no box, just the glyphs with a thick white stroke (the puff), a solid colored fill, and a thin colored keyline. Pure CSS, no `data-text`, no SVG:

- **stroke puff** → `-webkit-text-stroke` + `paint-order: stroke fill` on the line element
- **fill** → `-webkit-text-fill-color` from `fill`
- **keyline** → 4-way `drop-shadow` in the host's existing shadow slot

The fill color comes from `fill`. Set the typeface with the `font` attribute (`font="serif"`, …) or a custom class that sets `--ui-sticker-font-family` — a **fat, rounded display face** holds the puff best. Good Google Fonts: **Bagel Fat One**, **Cherry Bomb One**, **Fredoka**, **Titan One**; or a brush/marker like **Sedgwick Ave Display** / **Freckle Face**:

```css
.font-bagel { --ui-sticker-font-family: "Bagel Fat One", system-ui; }
```
```html
<ui-sticker variant="text" class="font-bagel" fill="#7ec27c"><span>50% Off</span></ui-sticker>
```

Tune with `--ui-sticker-text-size` (default `3.5em`), `--ui-sticker-text-stroke-w`/`-c` (puff), `--ui-sticker-text-outline-w`/`-c` (keyline), and `--ui-sticker-text-fill` (override the fill color). Sizes in `em` (the `cqi` box containment is dropped for this variant).

**Slight tilt:** text stickers use the `angle` attribute to rotate the lettering for a hand-placed look:

```html
<ui-sticker variant="text" angle="-3deg" class="font-bagel" fill="#ff9797"><span>Last Call</span></ui-sticker>
```

## Fit to width (`font="fit"`)

The `fit` token uses the native [`text-fit`](https://drafts.csswg.org/css-text-5/#text-fit-property) property (`grow`) to scale each line up to fill the box width — no overflow, no SVG, no JS. Put it on `font` (the `<small>`/`<span>` lines), on `font-lead` (the `<strong>` line), or both. Each line is its own single-line element, so each fills its column independently (`grid-template-columns: 100%`). Wrapped in `@supports (text-fit: grow)`, so it's a **progressive enhancement** (Chrome 150+); where unsupported, the `cqi` sizing and centered layout both stay.

```html
<ui-sticker fill="#2F75BC" font="fit" font-lead="fit" ink="#fff"><small>UP TO</small><strong>40%</strong></ui-sticker>
```

> Safari/Firefox have no signal yet, so keep `fit` as an enhancement on top of a sensible `size` baseline.

`spark`, `sunburst` and `heart` are recreations of classic SVG "tactical element" price badges, redrawn as pure CSS clip paths so they scale with `font-size` and need no markup. `heart` uses `clip-path: shape()` (Chrome 137+, Safari 18.4+); the polygon stars work everywhere `clip-path` is supported.

Every clipped shape (including each preset) reads `--ui-sticker-clip-path`, so you can override any of them:

```html
<ui-sticker variant="burst" style="--ui-sticker-clip-path: polygon(50% 0, 100% 100%, 0 100%)">▲</ui-sticker>
```

Or use `variant="clip"` for a bring-your-own shape with no preset — the `burst`/`spark`/etc. are just named presets of the same mechanism:

```html
<ui-sticker variant="clip" style="--ui-sticker-clip-path: shape(…)"><strong>SALE</strong></ui-sticker>
```

---

## Customization

### Component tokens

| Token | Default | Description |
|-------|---------|-------------|
| `--ui-sticker-bg` | `var(--color-accent)` | Background color (set a `linear-gradient()` here for a gradient) |
| `--ui-sticker-c` | `hsl(0 0% 100%)` | Text/ink color (all lines) |
| `--ui-sticker-lead-c` | `inherit` | Color of the `<strong>` lead line only — a second color for two-tone callouts |
| `--ui-sticker-font-family` | `var(--font-body)` | Typeface (set by `font`/`font-lead` family tokens) |
| `--ui-sticker-sz` | `5em` | Box size (disc diameter); also set by `size=` |
| `--ui-sticker-fs` | `40cqi` | Base line size (clip shapes lower this) |
| `--ui-sticker-small-scale` / `-strong-scale` | `0.55` / `1.1` | `<small>` / `<strong>` size ratio |
| `--ui-sticker-small-font` / `-strong-font` | inherit family | Per-tag family override |
| `--ui-sticker-font-weight` | `var(--font-weight-bold, 700)` | Host weight default |
| `--ui-sticker-gap` | `0.16` | Line gap as a unitless factor of the font-size (scales with the box) |
| `--ui-sticker-radius` | `var(--radius-circle, 50%)` | Corner radius (disc / speech) |
| `--ui-sticker-clip-path` | per shape (24-point star for `burst`) | The `clip-path` the active clipped shape uses — override any preset, or supply it with `variant="clip"` |
| `--ui-sticker-shadow-x` / `-y` / `-color` | `0.25em` / `0.25em` / `#000` | Offset + tint for `shadow="solid"` |
| `--ui-sticker-text-shadow` | `none` | Text-shadow on the lines (set by `shadow()`, in `cqi`) |
| `--ui-sticker-text-shadow-color` | `contrast-color(ink)` | `shadow()` tint — auto the **opposite** of the ink |
| `--ui-sticker-text-size` | `3.5em` | Font size for `variant="text"` |
| `--ui-sticker-text-stroke-w` / `-c` | `0.2em` / `#fff` | The puff (white stroke) |
| `--ui-sticker-text-outline-w` / `-c` | `2px` / the fill | The keyline |
| `--ui-sticker-hover-duration` / `-ease` | `--duration-normal` / `--ease-out` | Hover transition timing |
| `--ui-sticker-hover-lift` | `-0.35em` | `hover="lift"` rise distance |
| `--ui-sticker-hover-scale` / `-press` | `1.06` / `0.95` | `hover="pop"` / `hover="press"` scale |
| `--ui-sticker-hover-rotate` | `-4deg` | `hover="tilt"` angle |
| `--ui-sticker-hover-spin-duration` | `0.8s` | `hover="spin"` rotation period |

```css
ui-sticker {
  --ui-sticker-bg: hsl(340, 80%, 55%);
  --ui-sticker-sz: 6em;
}
```

---

## Implementation notes

The non-obvious "why" behind the CSS (kept here so the stylesheet stays terse):

- **`cqi` resolves against an *ancestor* container, never the element itself.** The sticker is its own `container-type: inline-size`, so a line's `cqi` font-size resolves against the sticker — but only because the line is a **child**. The host can't size *itself* in `cqi`.
- **Line gap is a child `margin`, not `row-gap`.** To make the gap scale with the box it must be a fraction of the `cqi` font-size; `cqi` only resolves correctly on the child (`& > * + *` → `margin-block-start`).
- **`font` / `font-lead` split by line group.** `font` targets `> :not(strong)` (the `<small>`/`<span>` lines), `font-lead` targets `> strong`. The attribute rules out-specify the tag defaults, so they win; `<sup>`/`<sub>` inherit their line's family.
- **Square floor on *both* axes.** `aspect-ratio: 1/1` alone can't keep a short callout square, so both `min-block-size` and `min-inline-size` are set.
- **Clipped shapes draw their fill on a `::before`.** `clip-path` clips the result of an element's `filter`, so a host `drop-shadow` would be cut away. Instead the host stays unclipped and the `::before` carries `background` + `clip-path: var(--ui-sticker-clip-path)`.
- **Shape positioning is zero-specificity (`&:where(…)`).** The `::before` needs a positioned host, but `position: relative` at normal specificity would out-specify `ui-card`'s `sticker(te)` `position: absolute`. `&:where(…)` gives it 0 specificity so an external placement wins.
- **`text` fill uses `-webkit-text-fill-color`, not `background-clip: text`** (which doesn't composite as a fill alongside `-webkit-text-stroke`).
- **`fit` targets the line elements** with `grid-template-columns: 100%`; `…per-line` is a no-op on a single-line element, so `grow consistent` is used.
- **`drop-shadow`, not `box-shadow`.** Only `drop-shadow` follows the clipped star/heart/blob outlines.
- **`shadow()` shadow auto-flips.** The ink is `contrast-color(bg)`, so the text-shadow tint defaults to `contrast-color(ink)` — the *opposite* of the ink. Sized in `cqi`.

## Accessibility

- Stickers are decorative callouts. The promotional value (e.g. "-20%") must also appear in the real product data — don't rely on the sticker alone to convey price.
- Color alone shouldn't convey meaning — include text labels.
- For purely decorative stickers, add `aria-hidden="true"`.

---

## Browser Support

All modern browsers.

| Feature | Support |
|---------|---------|
| Custom elements | All modern browsers |
| `clip-path: polygon()` | All modern browsers |
| `aspect-ratio` | Chrome 88+, Firefox 89+, Safari 15+ |
| typed `attr()` + `contrast-color()` | Chrome 133+, Safari 17.4+ |
| `light-dark()` (via base tokens) | Chrome 123+, Firefox 120+, Safari 17.5+ |
