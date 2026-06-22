# @browser.style/sticker

A CSS-first sticker component for promotional callouts — "Save 20%", "Best value", "-20%". A round disc by default, with an optional 24-point starburst shape.

## Features

- Disc (default) or starburst shape (`variant="burst"`)
- Semantic colors: info, success, warning, error
- Three sizes: small, medium (default), large
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
<ui-sticker variant="burst" color="error">-20%</ui-sticker>
<ui-sticker color="success">Best value</ui-sticker>
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
| `color` | string | Semantic color: `info`, `success`, `warning`, `error` |
| `theme` | string | Decorative color bundle (bg + ink): `red`, `orange`, `green`, `blue`, `accent`, `dark`, `light`, `subtle` |
| `size` | string | Predefined size: `sm`, `md` (default), `lg` |
| `variant` | string | Shape: `burst` (24-point starburst) |

---

### React

```jsx
import '@browser.style/sticker';
import '@browser.style/sticker/style';

function SaleSticker({ amount }) {
  return <ui-sticker variant="burst" color="error">-{amount}%</ui-sticker>;
}
```

### Vue

```vue
<script setup>
import '@browser.style/sticker';
import '@browser.style/sticker/style';
</script>

<template>
  <ui-sticker color="success">Best value</ui-sticker>
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

<ui-sticker color="error">-20%</ui-sticker>
```

---

## Colors

Use the `color` attribute for semantic colors. The default background is `--color-accent`.

```html
<ui-sticker>Default</ui-sticker>
<ui-sticker color="info">Info</ui-sticker>
<ui-sticker color="success">Success</ui-sticker>
<ui-sticker color="warning">Warning</ui-sticker>
<ui-sticker color="error">Error</ui-sticker>
```

| Value | Description |
|-------|-------------|
| _(none)_ | Default — `--color-accent` background |
| `info` | Blue — `--color-info` |
| `success` | Green — `--color-success` |
| `warning` | Orange — `--color-warning` |
| `error` | Red — `--color-error` |

For full control, set the tokens directly:

```html
<ui-sticker style="--ui-sticker-bg: hotpink; --ui-sticker-c: black;">Sale</ui-sticker>
```

## Theme

The `theme` attribute applies a decorative color **bundle** — a background and a paired ink color in one keyword. This is distinct from the semantic `color` axis (`info` / `success` / `warning` / `error`), which carries meaning. Use `theme` purely for looks. If both `color` and `theme` are set, **`theme` wins**.

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

## Multi-line

A sticker is a centered grid: **each direct child is its own line**. `--ui-sticker-gap` controls the spacing between lines. Every child gets `text-box: cap alphabetic`, which trims the font's leading so the visual spacing is driven by `gap` alone (no stray line-box padding). Set a per-line `font-size` and/or `font-weight` on the child — use any element (`<b>`, `<small>`, `<span>`) or a class.

```html
<ui-sticker variant="burst">
  <span style="font-size:.7em">SAVE</span>
  <b style="font-size:1.6em">20%</b>
</ui-sticker>
```

```html
<ui-sticker style="--ui-sticker-gap: .2em">
  <small>FROM</small>
  <b style="font-size:1.8em">$9</b>
  <small>/mo</small>
</ui-sticker>
```

## Sizes

```html
<ui-sticker size="sm" color="error">-10%</ui-sticker>
<ui-sticker size="md" color="error">-20%</ui-sticker>
<ui-sticker size="lg" color="error">-30%</ui-sticker>
```

## Shape variants

The default is a disc. Use `variant="burst"` for a 24-point starburst:

```html
<ui-sticker>Disc (default)</ui-sticker>
<ui-sticker variant="burst" color="warning">Starburst</ui-sticker>
```

Override the star shape via `--ui-sticker-clip-path` with any `polygon()` / `path()`.

---

## Customization

### Component tokens

| Token | Default | Description |
|-------|---------|-------------|
| `--ui-sticker-bg` | `var(--color-accent)` | Background color |
| `--ui-sticker-c` | `hsl(0 0% 100%)` | Text color |
| `--ui-sticker-font-size` | `0.875em` | Font size (scales the whole sticker) |
| `--ui-sticker-font-weight` | `var(--font-weight-bold, 700)` | Font weight |
| `--ui-sticker-gap` | `0` | Gap between lines (each direct child is a line) |
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
