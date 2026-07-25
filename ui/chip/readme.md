# @browser.style/chip

A CSS-first chip component for tags, labels, filters, and status indicators. Visually aligned with `<ui-button>` — it shares the same color and spacing tokens and hosts badges at any corner.

## Features

- 9 theme colours (red orange green blue accent white gray slate black) + `pale`/`muted` modifiers, or any arbitrary fill/ink
- Three sizes: small, medium (default), large
- Style variants: solid (default), light (tinted), outline
- Shape variants: pill (default), square, squircle (`corner-shape`)
- Hosts `<ui-badge>` at any corner
- Light/dark mode support via design tokens
- RTL support via logical properties
- Works without JavaScript (CSS-only mode)

---

## Install

```bash
npm install @browser.style/chip
```

Peer dependency:

```bash
npm install @browser.style/base
```

> `@browser.style/base` provides the design token system. The chip works without it — tokens fall back to neutral defaults.

---

## Usage

### CSS-only (vanilla HTML)

```html
<link rel="stylesheet" href="@browser.style/base/index.css">
<link rel="stylesheet" href="@browser.style/chip/index.css">
```

Or via CSS `@import`:

```css
@import '@browser.style/base';
@import '@browser.style/chip/style';
```

```html
<ui-chip>Default</ui-chip>
<ui-chip theme="green">All services up ✓</ui-chip>
<ui-chip variant="outline" theme="blue">Premium</ui-chip>
```

### Web Component

Import the module to register `<ui-chip>`:

```js
import '@browser.style/chip';
```

The web component uses the **exact same** HTML structure as CSS-only — the JS only registers the element.

#### Attributes

| Attribute | Type | Description |
|-----------|------|-------------|
| `theme` | string | A theme colour (bg + ink pair): `red orange green blue accent white gray slate black`, + `pale`/`muted` modifiers. See [theme.md](../base/theme.md) |
| `fill` | `<color>` | Arbitrary background — any CSS colour; text auto-contrasts. Overrides `theme` |
| `ink` | `<color>` | Arbitrary text colour — any CSS colour. Overrides the auto-contrast |
| `size` | string | `sm`, `lg`, `xl`, `2xl` (`md` is the default) |
| `radius` | string | Corner shape: `non` sharp · `rnd` rounded · `pll` pill (default) · `crc` circle · `sqr` squircle |
| `variant` | string | Space-separated: `light`, `outline` (`square`/`squircle` are aliases for `radius="rnd"`/`"sqr"`) |

> This colour/size model is shared by all `<ui-media>` furniture (`chip`, `sticker`, `save`,
> `play`) and works identically standalone or via the card `media=` token. Standalone
> attribute ↔ card token: `theme=` ↔ `chip(<hue>)`, `size=` ↔ `chip(<size>)`, `radius=` ↔
> `chip(<corner>)`, `variant="light"` ↔ `chip(lgt)`, `variant="outline"` ↔ `chip(out)`.

---

### React

```jsx
import '@browser.style/chip';
import '@browser.style/chip/style';

function StatusChip({ status }) {
  return <ui-chip theme={status}>{status}</ui-chip>;
}
```

### Vue

```vue
<script setup>
import '@browser.style/chip';
import '@browser.style/chip/style';
</script>

<template>
  <ui-chip variant="light" theme="green">All services up</ui-chip>
</template>
```

> Tell Vue to skip custom element resolution in `vite.config.js`:
> ```js
> vue({ template: { compilerOptions: { isCustomElement: tag => tag.startsWith('ui-') } } })
> ```

### Svelte

```svelte
<script>
  import '@browser.style/chip';
  import '@browser.style/chip/style';
</script>

<ui-chip theme="orange">Warning: Low</ui-chip>
```

### Astro / SSR

Use the CSS-only approach — no JavaScript needed:

```html
<link rel="stylesheet" href="@browser.style/base/index.css">
<link rel="stylesheet" href="@browser.style/chip/index.css">

<ui-chip theme="blue">Premium</ui-chip>
```

---

## Colors

Use `theme` for a named hue (a background + paired ink in one keyword):

```html
<ui-chip theme="blue">Info</ui-chip>
<ui-chip theme="green">Success</ui-chip>
<ui-chip theme="orange">Warning</ui-chip>
<ui-chip theme="red">Error</ui-chip>
<ui-chip theme="accent">Accent</ui-chip>
```

| `theme` value | Colour |
|-------|-------------|
| _(none)_ | Default — `--color-button` background |
| `red` | `--color-error` |
| `orange` | `--color-warning` |
| `green` | `--color-success` |
| `blue` | `--color-info` |
| `accent` `dark` `light` `subtle` | the matching `--ui-theme-*` bundle |

For an **arbitrary colour**, use `fill` (surface) — text auto-contrasts — and optionally `ink`
(text):

```html
<ui-chip fill="gold">Gold</ui-chip>                 <!-- → black text -->
<ui-chip fill="#1d1d1d">Dark</ui-chip>              <!-- → white text -->
<ui-chip fill="rebeccapurple" ink="gold">Custom</ui-chip>
```

`fill`/`ink` override `theme`. The named hues are retunable `--ui-theme-*` tokens in
`@browser.style/base`:

```css
:root {
  --ui-theme-accent-bg: hsl(280, 80%, 55%);
  --ui-theme-accent-c: hsl(0, 0%, 100%);
}
```

## Sizes

`sm`, `lg`, `xl`, `2xl` — `md` is the default (no attribute). Sizes are `em`-based, so they scale with the surrounding text:

```html
<ui-chip size="sm" theme="blue">Small</ui-chip>
<ui-chip theme="blue">Medium (default)</ui-chip>
<ui-chip size="lg" theme="blue">Large</ui-chip>
<ui-chip size="xl" theme="blue">X-Large</ui-chip>
<ui-chip size="2xl" theme="blue">2X-Large</ui-chip>
```

## Variants

### Style variants

**Light** — tinted background with the `theme`/`fill` colour as text:

```html
<ui-chip variant="light" theme="blue">Premium</ui-chip>
```

**Outline** — transparent background with a colored border:

```html
<ui-chip variant="outline" theme="green">Available</ui-chip>
```

Both are addressable from a card via the `media=` token — `chip(lgt)` (light) and `chip(out)` (outline), combined with a hue/size like any other furniture token:

```html
<ui-card media="asr(4/3) chip(te) chip(lgt) chip(blue)"> … </ui-card>
```

The shared **hue modifiers** `chip(pale)` (light tint + hue ink, the theme-standard pale ratio) and `chip(muted)` (translucent plate) also work from a card — add one alongside a hue, e.g. `chip(red) chip(pale)`.

### Shape variants

The default is a pill shape. Use `square` for rounded corners or `squircle` for an iOS-style superellipse:

```html
<ui-chip>Pill (default)</ui-chip>
<ui-chip variant="square">Square</ui-chip>
<ui-chip variant="squircle">Squircle</ui-chip>
```

Variants can be combined: `variant="light square"`, `variant="outline squircle"`.

## With badges

Chips can host `<ui-badge>` at any corner:

```html
<ui-chip>Notifications <ui-badge color="error">4</ui-badge></ui-chip>
<ui-chip theme="blue">Messages <ui-badge color="warning" position="bottom-right">2</ui-badge></ui-chip>
```

Add `variant="inline"` to the badge to automatically push it to the inline end inside a chip:

```html
<ui-chip>Inline badge<ui-badge color="warning" variant="inline">4</ui-badge></ui-chip>
```

---

## Customization

### Global token overrides

```css
:root {
  --color-button: hsl(220, 20%, 90%);
  --radius-pill: 2rem;
}
```

### Component tokens

| Token | Default | Description |
|-------|---------|-------------|
| `--ui-chip-bg` | `var(--color-button)` | Background color |
| `--ui-chip-c` | `var(--color-text)` | Text color |
| `--ui-chip-border-color` | `transparent` | Border color |
| `--ui-chip-border-width` | `var(--border-width, 1px)` | Border width |
| `--ui-chip-radius` | `var(--radius-pill)` | Corner radius |
| `--ui-chip-font-family` | `var(--font-form)` | Font family |
| `--ui-chip-font-size` | `var(--font-size-sm, 0.875rem)` | Font size |
| `--ui-chip-font-weight` | `var(--font-weight-medium, 500)` | Font weight |
| `--ui-chip-line-height` | `var(--line-height-snug, 1.25)` | Line height |
| `--ui-chip-padding-block` | `0.5em` | Vertical padding (scales with font-size) |
| `--ui-chip-padding-inline` | `1.125em` | Horizontal padding (scales with font-size) |
| `--ui-chip-column-gap` | `0` | Gap between inline children (for icons, badges) |

> Padding and the `square` variant's border-radius are em-based, so changing `--ui-chip-font-size` (or setting `size="sm|md|lg"`) scales them proportionally. The `size` attribute is a thin convenience wrapper — it only swaps the font-size token.

Override per instance or globally:

```css
ui-chip {
  --ui-chip-column-gap: 0.5rem;
  --ui-chip-padding-inline: 1.5rem;
}
```

---

## Accessibility

- Chips are static labels by default. For interactive chips, wrap or place inside a `<button>`.
- Color alone shouldn't convey meaning — include text or icon labels.
- For purely decorative chips, add `aria-hidden="true"`.

---

## Browser Support

All modern browsers.

| Feature | Support |
|---------|---------|
| Custom elements | All modern browsers |
| `color-mix()` (light variant) | Chrome 111+, Firefox 113+, Safari 16.2+ |
| `corner-shape: squircle` | Chrome 135+, requires CSS Backgrounds Level 4 |
| `light-dark()` | Chrome 123+, Firefox 120+, Safari 17.5+ |

Graceful degradation: without `color-mix()`, set `--ui-chip-bg` explicitly for the light variant. Without `corner-shape`, squircle falls back to the default pill shape.
