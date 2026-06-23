# @browser.style/sticker

A CSS-first sticker component for promotional callouts — "Save 20%", "Best value", "-20%". A round disc by default, with an optional 24-point starburst shape.

## Features

- Disc (default), `burst`, `spark`, `sunburst`, `heart` or `speech` balloon shape (`variant`)
- `color` = any CSS color with auto-contrast ink, gradients via `color-end`, or `theme` bundles
- Six box sizes (`sm`–`3xl`) with fluid `cqi` text; `fit` for native `text-fit` fill
- Soft or solid (`sh(solid)`) drop-shadows that follow clipped shapes
- Token-driven background and ink color
- Square aspect-ratio with centered content
- Light/dark mode support via design tokens
- RTL support via logical properties
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
<ui-sticker variant="burst" theme="red">-20%</ui-sticker>
<ui-sticker theme="green">Best value</ui-sticker>
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
| `color` | string | Any CSS color → background; ink auto-contrasted via `contrast-color()` |
| `color-end` | string | Second CSS color → background becomes a two-stop `linear-gradient` |
| `angle` | angle | Gradient direction when `color-end` is set (e.g. `180deg`); default `90deg` |
| `theme` | string | Decorative color bundle (bg + ink): `red`, `orange`, `green`, `blue`, `accent`, `dark`, `light`, `subtle` |
| `size` | string | Box size: `sm`, `md`, `lg` (default), `xl`, `2xl`, `3xl` |
| `variant` | string | Space-separated tokens: shape (`burst`, `spark`, `sunburst`, `heart`, `speech(l)`, `speech(r)`) · `text` / `text(industrial\|slab\|antique\|handwritten)` · shadow (`sh(sm)`…`sh(2xl)`, `sh(solid)`) · font-scale (`fs(xs)`…`fs(2xl)`) · font-weight (`fw(normal)`…`fw(black)`) · `fit` / `fit(shrink)` · `gap(sm\|md\|lg)` |

---

### React

```jsx
import '@browser.style/sticker';
import '@browser.style/sticker/style';

function SaleSticker({ amount }) {
  return <ui-sticker variant="burst" theme="red">-{amount}%</ui-sticker>;
}
```

### Vue

```vue
<script setup>
import '@browser.style/sticker';
import '@browser.style/sticker/style';
</script>

<template>
  <ui-sticker theme="green">Best value</ui-sticker>
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

<ui-sticker theme="red">-20%</ui-sticker>
```

---

## Colors

`color` takes **any CSS color**. The value is read with `attr(color type(<color>))` for the background, and the text ink is auto-picked with `contrast-color()` — so any background gets legible text for free. The default background (no `color`) is `--color-accent`.

```html
<ui-sticker>Default</ui-sticker>
<ui-sticker color="rebeccapurple">New</ui-sticker>
<ui-sticker color="gold">Best value</ui-sticker>   <!-- → black ink -->
<ui-sticker color="hotpink">Hot deal</ui-sticker>
<ui-sticker color="oklch(0.7 0.18 150)">Fresh</ui-sticker>
```

> **Browser support:** typed `attr()` + `contrast-color()` need Chrome 133+ / Safari 17.4+. For preset semantic bundles that work everywhere, use [`theme`](#theme) (`red`, `green`, `orange`, `blue`, …).

### Gradient (`color` + `color-end`)

Add `color-end` for a two-stop `linear-gradient` background. Direction is the typed `angle="<angle>"` attribute (default `90deg` = left→right). Ink is contrasted against the **start** color.

> `angle` is a custom attribute — *not* the reserved HTML `dir`, which stays bound to text direction (RTL).

```html
<ui-sticker color="#38BC90" color-end="#21A7AE"><small>GØR ET</small><strong>KUP</strong></ui-sticker>

<!-- top → bottom -->
<ui-sticker angle="180deg" color="#111" color-end="purple">
  <small>HELLO</small><strong>SVG</strong>
</ui-sticker>
```

Works with any shape and any color syntax (the heart/burst clips and `oklch()` all apply).

For full manual control, set the tokens directly:

```html
<ui-sticker style="--ui-sticker-bg: hotpink; --ui-sticker-c: black;">Sale</ui-sticker>
```

## Theme

The `theme` attribute applies a decorative color **bundle** — a background and a paired ink color in one keyword — that works in every browser. The `color` axis takes any CSS color (auto-contrast ink) but needs newer `attr()`/`contrast-color()` support; `theme` is the safe preset alternative. If both `color` and `theme` are set, **`theme` wins**.

```html
<ui-sticker theme="accent">Accent</ui-sticker>
<ui-sticker variant="burst" theme="dark">Dark</ui-sticker>
<ui-sticker theme="subtle">Subtle</ui-sticker>
```

8 keys:

```
red   orange  green   blue
accent  dark  light  subtle
```

The bundles are defined as `--ui-theme-*` tokens in `@browser.style/base` and are retunable globally:

```css
:root {
  --ui-theme-accent-bg: hsl(280, 80%, 55%);
  --ui-theme-accent-c: hsl(0, 0%, 100%);
}
```

## Fluid text (`cqi`)

The sticker is its own query container, so **element** lines size in `cqi` and scale automatically with the box — no media queries, no per-size font tweaks. The rule:

- **A raw text line** (no wrapping element) keeps a fixed `em` size.
- **Any element line** (`<span>`, `<strong>`, `<small>`, …) sizes in `cqi` and scales with the box.

```html
<!-- fixed em size -->
<ui-sticker>-20%</ui-sticker>

<!-- fluid: scales with --ui-sticker-sz / size= -->
<ui-sticker><span>-20%</span></ui-sticker>
```

No `cq-box` wrapper is needed — each element line is already a descendant of the sticker container, so its `cqi` resolves against the sticker.

The base line is `max(10px, 40cqi)` — i.e. **40 % of the box**, with a `10px` floor so it stays legible on a very small sticker. `cqi` resolves against the *content* box, so the clipped shapes (`burst`, `spark`, `sunburst`, `heart`) keep their padding small and lower the base a little so the text still fits the inner outline.

### Per-line size from the tag — no inline styles

`--ui-sticker-font-size` is the single knob; `<small>` and `<strong>` derive from it by a fixed ratio, so changing it (or `fs()`) scales every line together:

| Tag | Role | Size |
|-----|------|------|
| `<small>` | label | small (`--ui-sticker-fs-sm`) |
| `<strong>` | headline | large (`--ui-sticker-fs-lg`) |
| `<span>` / text node | body | base (`--ui-sticker-font-size`) |

Nudge the **whole** sticker up or down with the `fs()` variant — it's a *scale multiplier* on the base, so the `small`/`strong`/`sup` ratios stay intact and it composes with any shape's base size. Useful when a long headline (e.g. `DEAL`) runs a touch large:

| `variant` | Scale |
|-----------|-------|
| `fs(xs)` | ×0.6 |
| `fs(sm)` | ×0.75 |
| `fs(md)` | ×0.87 |
| _(none)_ | ×1 (default) |
| `fs(lg)` | ×1.15 |
| `fs(xl)` | ×1.3 |
| `fs(2xl)` | ×1.5 |

`fw()` sets the weight: `fw(normal | medium | semibold | bold | black)`.

```html
<ui-sticker variant="fs(md)" color="#38BC90" color-end="#21A7AE">
  <small>GRAB A</small><strong>DEAL</strong>
</ui-sticker>
```

## Multi-line

A sticker is a centered grid: **each direct child is its own line**. Every child gets `text-box: cap alphabetic`, which trims the font's leading so the visual spacing is driven by the gap alone. Use semantic tags for fluid per-line sizes — no inline styles:

```html
<ui-sticker variant="burst">
  <small>SAVE</small>
  <strong>20%</strong>
</ui-sticker>
```

### Line gap

The gap is a **top-margin on the lines, sized as a fraction of the font** — not grid `gap`, because the host can't resolve `cqi` against itself. So the gap **scales with the box** too. `--ui-sticker-gap` is a unitless factor (default `0.16`); tune it with the `gap()` variant:

| `variant` | Factor |
|-----------|--------|
| `gap(sm)` | 0.12 |
| `gap(md)` | 0.25 |
| `gap(lg)` | 0.45 |

```html
<ui-sticker variant="gap(md)">
  <small>FROM</small>
  <strong>$9</strong>
  <small>/mo</small>
</ui-sticker>
```

## Sizes

The `size` attribute scales the **box** (`--ui-sticker-sz`); element lines follow via `cqi`.

```html
<ui-sticker size="sm" theme="red"><span>-20%</span></ui-sticker>
<ui-sticker size="md" theme="red"><span>-20%</span></ui-sticker>
<ui-sticker size="lg" theme="red"><span>-20%</span></ui-sticker>
<ui-sticker size="xl" theme="red"><span>-20%</span></ui-sticker>
<ui-sticker size="2xl" theme="red"><span>-20%</span></ui-sticker>
<ui-sticker size="3xl" theme="red"><span>-20%</span></ui-sticker>
```

## Shadow

Add a drop-shadow with `variant="sh(…)"` — function-style, aligned with card's `rds()`. It uses `filter: drop-shadow()`, so it follows clipped star/heart outlines (a `box-shadow` would be cut off by `clip-path`).

```html
<ui-sticker variant="sh(md)">New</ui-sticker>
<ui-sticker variant="heart sh(lg)" theme="red"><span>Sale</span></ui-sticker>
```

| `variant` | Shadow |
|-----------|--------|
| `sh(sm)` | subtle (soft) |
| `sh(md)` | small (soft) |
| `sh(lg)` | medium (soft) |
| `sh(xl)` | large (soft) |
| `sh(2xl)` | extra large (soft) |
| `sh(solid)` | hard offset, zero-blur (comic look) |

`sh(solid)` is the classic tactical/sticker shadow — a big solid-black offset like the original speech balloons (`drop-shadow(.5em .5em 0 #000)`). Tune the offset and color with `--ui-sticker-shadow-x`, `--ui-sticker-shadow-y`, `--ui-sticker-shadow-color` (e.g. set a darker shade of the bg for a tinted shadow).

```html
<ui-sticker variant="sh(solid)" color="orange"><span>SALE</span></ui-sticker>
<ui-sticker variant="spark sh(solid)" color="#2980b9"><strong>40%</strong></ui-sticker>
```

## Shape variants

The default is a disc. Set `variant` for a clipped shape:

| `variant` | Shape | Technique |
|-----------|-------|-----------|
| `burst` | 24-point starburst | `clip-path: polygon()` |
| `spark` | sharp 10-point star (price seal) | `clip-path: polygon()` |
| `sunburst` | fine 40-point sawtooth ring | `clip-path: polygon()` |
| `heart` | heart | `clip-path: shape()` |
| `speech(l)` / `speech(r)` | rounded balloon + tail (bottom-left / -right) | `border-radius` + `::after` tail |

```html
<ui-sticker>Disc (default)</ui-sticker>
<ui-sticker variant="burst" theme="orange">Starburst</ui-sticker>
<ui-sticker variant="spark" theme="red"><span>Spark</span></ui-sticker>
<ui-sticker variant="sunburst" theme="blue"><span>Sunburst</span></ui-sticker>
<ui-sticker variant="heart" theme="red">Heart</ui-sticker>
<ui-sticker variant="speech(l)" color="#2980b9"><span>Hi!</span></ui-sticker>
```

The balloon isn't square: it uses a `5/4` aspect-ratio and a tail that **inherits the fill** (solid or gradient) and is included in the `drop-shadow`.

## Text sticker (`variant="text"`)

Puffy "sticker lettering" — no box, just the glyphs with a thick white stroke (the puff), a solid colored fill, and a thin colored keyline. Pure CSS, no `data-text`, no SVG:

- **stroke puff** → `-webkit-text-stroke` + `paint-order: stroke fill` on the line element
- **fill** → `-webkit-text-fill-color` from `color`/`theme` (note: `background-clip:text` does **not** composite as fill alongside `text-stroke`, so a solid fill is used)
- **keyline** → 4-way `drop-shadow` in the host's existing shadow slot

The fill color comes from `color`/`theme`. Pick a system font (no webfont) with `text(<stack>)` — the four [modern font stacks](https://modernfontstacks.com/):

| `variant` | Font |
|-----------|------|
| `text` | handwritten (default) |
| `text(industrial)` | Bahnschrift / DIN — condensed sans |
| `text(slab)` | Rockwell / Roboto Slab |
| `text(antique)` | Superclarendon / Bookman |
| `text(handwritten)` | Segoe Print / Bradley Hand — casual |

```html
<ui-sticker variant="text" color="#ffcc33"><span>hello</span></ui-sticker>
<ui-sticker variant="text(slab)" color="#8fa0f8"><span>blueming</span></ui-sticker>
```

Tune with `--ui-sticker-text-size` (default `3.5em`), `--ui-sticker-text-stroke-w`/`-c` (puff), `--ui-sticker-text-outline-w`/`-c` (keyline), and `--ui-sticker-text-fill` (override the fill color). Sizes in `em` (the `cqi` box containment is dropped for this variant).

## Fit to width (`text-fit`)

`variant="fit"` uses the native [`text-fit`](https://drafts.csswg.org/css-text-5/#text-fit-property) property to grow each line to fill the box width — no overflow, no SVG, no JS.

`text-fit` fits text within the box it's set on, and the sticker host (a grid) has no direct text runs — the lines **are** the child elements. So `fit` targets the line elements and gives them the full box width to grow into (`grid-template-columns: 100%`). It's wrapped in `@supports (text-fit: grow)`, so it's a **progressive enhancement** (Chrome 150+); where unsupported, the `cqi` sizing and centered layout both stay.

| `variant` | Effect |
|-----------|--------|
| `fit` | each line grows to fill the box width |
| `fit(shrink)` | overlong lines shrink to fit |

> Each line is a single-line element, i.e. its *last* line — so `text-fit: …per-line` would be a no-op (the spec doesn't scale a block's last line). `fit` uses the default `grow consistent`, which does scale it.

```html
<ui-sticker variant="fit" theme="blue"><small>UP TO</small><strong>40%</strong></ui-sticker>
```

> Safari/Firefox have no signal yet, so keep `fit` as an enhancement on top of a sensible `fs()`/`size` baseline.

`spark`, `sunburst` and `heart` are recreations of classic SVG "tactical element"
price badges, redrawn as pure CSS clip paths so they scale with `font-size` and need
no markup. `heart` uses `clip-path: shape()` (Chrome 137+, Safari 18.4+); the polygon
stars work everywhere `clip-path` is supported.

Override the `burst` star shape via `--ui-sticker-clip-path` with any `polygon()` / `path()`.

---

## Customization

### Component tokens

| Token | Default | Description |
|-------|---------|-------------|
| `--ui-sticker-bg` | `var(--color-accent)` | Background color |
| `--ui-sticker-c` | `hsl(0 0% 100%)` | Text color |
| `--ui-sticker-font-size` | `0.875em` | Font size (scales the whole sticker) |
| `--ui-sticker-font-weight` | `var(--font-weight-bold, 700)` | Font weight |
| `--ui-sticker-gap` | `0.16` | Line gap as a unitless factor of the font-size (scales with the box) |
| `--ui-sticker-sz` | `4em` | Minimum width (disc diameter) |
| `--ui-sticker-radius` | `var(--radius-circle, 50%)` | Corner radius (disc shape) |
| `--ui-sticker-clip-path` | 24-point star `polygon()` | Clip path for `variant="burst"` |

> The sticker is sized in `em`, so changing `--ui-sticker-font-size` (or setting `size="sm\|md\|lg"`) scales padding and diameter proportionally.

Override per instance or globally:

```css
ui-sticker {
  --ui-sticker-bg: hsl(340, 80%, 55%);
  --ui-sticker-sz: 6em;
}
```

---

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
| `light-dark()` (via base tokens) | Chrome 123+, Firefox 120+, Safari 17.5+ |
