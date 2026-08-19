# @browser.style/icon

A CSS-first icon component built entirely with pseudo-elements and CSS transforms. No SVG sprites, no icon fonts, no JavaScript required. Icons animate smoothly between states using CSS custom properties.

## Features

- Pure CSS — no images, fonts, or JavaScript needed
- 25+ icon types: arrows, chevrons, media controls, menu toggles, grid dots
- Animated state transitions via `[open]` and `:checked` (hamburger-to-cross, plus-to-minus, etc.)
- Configurable stroke width and size via attributes
- SVG support — wrap any SVG inside `<ui-icon>` for consistent sizing and stroke
- `rounded` attribute for soft line caps on dot-based icons
- Works inline with text, buttons, and flex layouts
- Light/dark mode compatible (inherits `currentColor`)
- Works without JavaScript (CSS-only mode)

---

## Install

```bash
npm install @browser.style/icon
```

Peer dependency:

```bash
npm install @browser.style/base
```

> `@browser.style/base` provides the design token system (duration, easing, radius, etc.).
> The icon works without it — tokens fall back to neutral defaults — but you'll want it for a complete design.

---

## Usage

### CSS-only (vanilla HTML)

Import the styles, then use the `<ui-icon>` custom element directly. No JavaScript needed — it works as a plain HTML element styled by CSS.

```html
<link rel="stylesheet" href="@browser.style/base/index.css">
<link rel="stylesheet" href="@browser.style/icon/index.css">
```

Or via CSS `@import`:

```css
@import '@browser.style/base';
@import '@browser.style/icon/style';
```

```html
<button>
  Settings
  <ui-icon type="chevron right"></ui-icon>
</button>
```

The `type` attribute defines the icon shape. Compound types use space-separated words:

```html
<ui-icon type="chevron down"></ui-icon>
<ui-icon type="arrow left"></ui-icon>
<ui-icon type="plus-minus"></ui-icon>
```

---

### With state transitions

Icons animate automatically when inside an `[open]` parent or next to a `:checked` input:

```html
<!-- Chevron flips when details opens -->
<details>
  <summary>Expand <ui-icon type="chevron down"></ui-icon></summary>
  <p>Content</p>
</details>

<!-- Hamburger morphs to cross when checkbox is checked -->
<label>
  <input type="checkbox">
  <ui-icon type="burger-menu"></ui-icon>
</label>

<!-- Plus morphs to minus -->
<details>
  <summary>More <ui-icon type="plus-minus"></ui-icon></summary>
  <p>Content</p>
</details>
```

The state selector matches `[open] > * > ui-icon`, so the icon must be a grandchild of the `[open]` element (e.g., inside `<summary>`).

---

### SVG icons

Wrap any SVG inside `<ui-icon>` to inherit consistent sizing and stroke styling:

```html
<ui-icon>
  <svg viewBox="0 0 24 24">
    <path d="M4 20h4l10.5-10.5a2.828 2.828 0 1 0-4-4L4 16v4"></path>
    <path d="M13.5 6.5l4 4"></path>
  </svg>
</ui-icon>
```

The `size` and `stroke` attributes work with SVG icons too.

---

### React

```jsx
import '@browser.style/base';
import '@browser.style/icon/style';

function Toolbar() {
  return (
    <div>
      <button>
        <ui-icon type="chevron left"></ui-icon>
        Back
      </button>
      <button>
        Next
        <ui-icon type="chevron right"></ui-icon>
      </button>
    </div>
  );
}
```

> React 19+ handles custom elements natively. For React 18, custom element attributes work in JSX.

---

### Vue

```vue
<script setup>
import '@browser.style/base';
import '@browser.style/icon/style';
</script>

<template>
  <button>
    <ui-icon type="chevron left"></ui-icon>
    Back
  </button>
</template>
```

> Tell Vue to skip custom element resolution in `vite.config.js`:
> ```js
> vue({ template: { compilerOptions: { isCustomElement: tag => tag.startsWith('ui-') } } })
> ```

---

### Svelte

```svelte
<script>
  import '@browser.style/base';
  import '@browser.style/icon/style';
</script>

<button>
  <ui-icon type="chevron left"></ui-icon>
  Back
</button>
```

---

### Astro / Server-rendered HTML

Use the CSS-only approach — no client JavaScript needed:

```html
<link rel="stylesheet" href="@browser.style/base/index.css">
<link rel="stylesheet" href="@browser.style/icon/index.css">

<details>
  <summary>FAQ <ui-icon type="plus-minus"></ui-icon></summary>
  <p>Answer here.</p>
</details>
```

---

## Icon types

### Directional

| Type | Description |
|------|-------------|
| `chevron left` | Chevron pointing left |
| `chevron right` | Chevron pointing right |
| `chevron down` | Chevron pointing down (flips on `[open]`) |
| `chevron up` | Chevron pointing up (flips on `[open]`) |
| `arrow left` | Arrow pointing left |
| `arrow right` | Arrow pointing right |
| `arrow down` | Arrow pointing down (flips on `[open]`) |
| `arrow up` | Arrow pointing up (flips on `[open]`) |
| `arrow upleft` | Diagonal arrow |
| `arrow upright` | Diagonal arrow |
| `arrow downleft` | Diagonal arrow |
| `arrow downright` | Diagonal arrow |

### Toggles

| Type | Description |
|------|-------------|
| `plus` | Plus sign |
| `minus` | Minus sign |
| `cross` | X mark |
| `check` | Checkmark |
| `plus-minus` | Animates from plus to minus on `[open]` |
| `plus-cross` | Animates from plus to cross on `[open]` |

### Menu

| Type | Description |
|------|-------------|
| `burger-menu` | Three-line hamburger (morphs to cross on `[open]`) |
| `veggie-menu` | Thin three-line menu (morphs to cross on `[open]`) |

### Dots

| Type | Description |
|------|-------------|
| `kebab` | Vertical three dots (rotates on `[open]`) |
| `meatball` | Horizontal three dots (rotates on `[open]`) |
| `grid` | 3x3 dot grid (rotates on `[open]`) |
| `drag` | 2x3 dot grid (drag handle) |

### Media controls

| Type | Description |
|------|-------------|
| `play` | Play triangle |
| `pause` | Pause bars |
| `stop` | Stop square |
| `play-pause` | Animates from play to pause on `[open]` |
| `first` | Skip to first |
| `last` | Skip to last |
| `rewind` | Rewind |
| `forward` | Fast forward |
| `triangle` | Simple triangle |

---

## Attributes

| Attribute | Type | Description |
|-----------|------|-------------|
| `type` | string | Icon shape (see tables above). Space-separated for compound types |
| `size` | string | Size preset: `xs`, `sm`, `md`, `lg`, `xl`, `2xl` |
| `stroke` | string | Stroke weight: `xs`, `sm`, `md`, `lg`, `xl` |
| `variant` | string | `border` draws a ring/badge around the glyph (e.g. a circled `+`) |
| `rounded` | boolean | Rounded line caps on dot-based icons (kebab, grid, etc.) |
| `state` | string | Explicit open animation: `flip`, `flip-x`, `flip-y` |
| `open` | boolean | Manually trigger the open/animated state |

---

## Customization

### Global token overrides

```css
:root {
  --duration-slow: 500ms;
  --ease-default: ease-in-out;
  --radius-circle: 50%;
}
```

### Component tokens

```css
ui-icon {
  --ui-icon-stroke: 0.1em;
  --ui-icon-size: 150%;
  --ui-icon-bg: light-dark(hsl(0, 0%, 90%), hsl(0, 0%, 30%));
  --ui-icon-padding: 0.25em;
  --ui-icon-radius: 5%;
}
```

### Border / badge (`variant="border"`)

Wraps the glyph in a ring — circular by default — for a badge look (e.g. a circled `+`). The border width defaults to the icon stroke and the color to `currentColor`, so it always matches the glyph; padding defaults to `0.3em`. Override any of them, and set `--ui-icon-radius` for the shape.

```html
<ui-icon type="plus" variant="border"></ui-icon>                 <!-- circled + -->
<ui-icon type="plus" variant="border"
  style="--ui-icon-radius: var(--radius-md)"></ui-icon>          <!-- slightly-rounded square -->
```

The ring uses `box-sizing: content-box`, so padding/border grow the box outward and leave the `1em` glyph intact.

The solid `clip-path` icons (`play`, `pause`, `stop`, `triangle`, `play-pause`) can look cramped inside the ring. Shrink only the glyph — not the ring — with `--ui-icon-glyph-size`:

```html
<ui-icon type="play" variant="border" style="--ui-icon-glyph-size: .8em"></ui-icon>
```

It resizes the glyph's box rather than scaling it with a transform, so the shape stays crisp at any value (a `scale` would rasterize then resample and blur).

### Direction (RTL)

The glyph is built in a fixed `direction: ltr` coordinate space, so every icon renders identically regardless of the document's `dir` — nothing shifts or detaches in RTL.

Horizontally-directional icons mirror automatically under `[dir="rtl"]` so they follow the reading direction:

- `arrow left` ↔ `arrow right` and `chevron left` ↔ `chevron right` flip.
- `arrow up`/`down`, symbols, menus, dots, and transport controls (`play`, `pause`, `stop`) are **not** flipped.
- The skip controls (`chevron left first` / `chevron right last`) keep their authored orientation.
- An open `chevron right` still animates downwards in RTL (the mirror is compensated).

```html
<html dir="rtl">
  <ui-icon type="chevron right"></ui-icon>  <!-- visually points left in RTL -->
```

### All component tokens

| Token | Default | Description |
|-------|---------|-------------|
| `--ui-icon-bg` | `transparent` | Background color |
| `--ui-icon-border-color` | `currentColor` | Ring color (`variant="border"`) |
| `--ui-icon-border-width` | icon stroke (`--ui-icon-stroke`) | Ring width (`variant="border"`); override to change |
| `--ui-icon-glyph-size` | `1em` | Inner glyph box size for the solid `clip-path` icons (`play`, `pause`, `stop`, `triangle`, `play-pause`). Shrink (e.g. `.8em`) to give the glyph breathing room inside `variant="border"` without resizing the ring |
| `--ui-icon-duration` | `var(--duration-slow, .3s)` | Transition duration |
| `--ui-icon-easing` | `var(--ease-default, cubic-bezier(0.4, 0, 0.2, 1))` | Transition easing |
| `--ui-icon-padding` | `0.3em` (under `variant="border"`) | Ring inner padding |
| `--ui-icon-radius` | `var(--radius-circle, 50%)` | Ring/shape radius — circle by default |
| `--ui-icon-size` | `100%` | Icon size (relative to parent font-size) |
| `--ui-icon-stroke` | `var(--border-width-thick, 2px)` | Stroke / line thickness |
| `--ui-icon-svg-stroke` | `1.25` | `stroke-width` for SVG children (set by `stroke=*`) |

---

## Icon font

`icon-font.css` is a **separate, opt-in sheet** — it is not pulled in by `index.css`, so
`<ui-icon>` users pay nothing for it.

```html
<link rel="stylesheet" href="…/@browser.style/icon/icon-font.css">
```

It ships 30 subset [Material Symbols](https://github.com/google/material-design-icons)
glyphs (Apache-2.0) as an inline base64 `@font-face` — **7,823 B of CSS, zero extra
requests** — plus a catalog:

```css
:root { --ui-icon-font: 'ui-icons'; --icon-bed: "\efdf"; … }
:where([data-icon="bed"]) { --icon: var(--icon-bed); }
```

So `--icon` resolves from a `data-icon` attribute, and consumers read it wherever they like:

```css
li[data-icon] { list-style-type: var(--icon); }          /* a ::marker */
a[href^="tel:"]::before { content: var(--icon); }        /* generated content */
```

Both inherit `color` from their element, since a glyph is text. Used by
`@browser.style/card` for list markers and the `tel:` / `mailto:` icons —
[content.md § Icon markers](../card/docs/content.md).

### Why the glyphs are baseline-shifted

Material Symbols centre their icon box at `+0.5em` above the baseline; text centres near
`+0.33em`. Inline, you would correct that with `vertical-align` — but `::marker` **ignores**
`vertical-align`, `transform` and `translate` (measured, Chrome 150), and accepts only font
properties and `color`. So the correction is baked into the outlines at build time
(`baselineShiftEm`, default `0.17`), which measured out at **−5.0px → −0.5px** against the
text's optical centre. A side benefit: the font needs no `vertical-align` in `::before`
either.

Inlining as base64 is also what keeps the font out of `scripts/css-bundle.js`'s way — a
`url()` to a real `.woff2` is a binary asset the bundler will not follow.

### Adding an icon

Edit `icons.json`, then regenerate (`icon-font.css` is committed — consumers never run this):

```bash
python3 -m pip install fonttools brotli
cd ui/icon && npm run build:icons
```

The source font and codepoint table are cached in `.cache/` (gitignored) after the first run.
Names are Material's own, written **kebab-case** in markup (`square_foot` → `square-foot`).
`ui/card/render.test.js` § *icon markers* fails if a card emits a name this sheet lacks.

## Accessibility

- Icons are decorative by default — pair with visible text labels
- Uses `currentColor` for automatic contrast with surrounding text
- State transitions use CSS transitions for reduced-motion compatibility
- No ARIA attributes needed when used alongside text (e.g., inside `<button>`)
- For standalone icon buttons, add `aria-label` to the button element

---

## Browser support

- All modern browsers (Chrome, Firefox, Safari, Edge)
- CSS trigonometric functions (`cos()`): Chrome 111+, Firefox 108+, Safari 15.4+
- CSS nesting: Chrome 120+, Firefox 117+, Safari 17.2+
- `:has()` selector (SVG support): Chrome 105+, Firefox 121+, Safari 15.4+
- Graceful degradation: without `cos()`, chevron/arrow sizing falls back to default
