# @browser.style/beacon

A CSS-first status indicator. Four layout variants (bare dot, pill, solid, ticker) and three animation modes (blink, pulse, breathe). Visually aligned with `@browser.style/badge` and `@browser.style/chip` — same semantic colors, same size scale, same shape tokens.

## Features

- **Bare dot** by default — colored circle with optional inline label
- **Three distinct animations**: `blink` (broadcast LIVE/REC), `pulse` (outward ripple, attention), `breathe` (gentle scale)
- **Pill variant** — chip-style tinted background with inner dot
- **Solid variant** — original `<blink>`-style filled label, defaults to blink
- **Ticker variant** — sliding marquee with trailing 3-dot loader
- **Three pause mechanisms**: `prefers-reduced-motion`, `paused` attribute, click-to-pause via inner checkbox
- **Sizes**: `xs`, `sm`, `md`, `lg`
- **Semantic colors**: `info`, `success`, `warning`, `error`
- Light/dark mode via design tokens
- Works as plain CSS or as a `<ui-beacon>` web component (light DOM, no Shadow DOM)

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
<ui-beacon color="success"></ui-beacon>
<ui-beacon color="error" animation="blink">Recording</ui-beacon>
```

Solid / pill with click-to-pause needs a manual `<label>`:

```html
<ui-beacon variant="solid" color="error">
  <label><input type="checkbox" data-sr><span>LIVE</span></label>
</ui-beacon>
```

Ticker needs a manual `<span>` and `<i>`:

```html
<ui-beacon variant="ticker" color="error">
  <span>Live <i></i></span>
</ui-beacon>
```

### Web component

```js
import '@browser.style/beacon';
```

The component auto-renders the inner structure for `solid`, `pill`, animated labels, and `ticker`:

```html
<ui-beacon color="error" animation="blink">Recording</ui-beacon>
<ui-beacon variant="solid" color="error">LIVE</ui-beacon>
<ui-beacon variant="ticker" color="error">Live</ui-beacon>
```

---

## Variants

### Bare dot (default)

A colored circle. Optionally followed by an inline label.

```html
<ui-beacon color="success"></ui-beacon>           <!-- presence dot -->
<ui-beacon color="success">Online</ui-beacon>     <!-- dot + label -->
```

Use cases: presence (online / away / busy), notification dots, inline status.

### Pill — `variant="pill"`

Chip-style tinted background with a colored dot inside.

```html
<ui-beacon variant="pill" color="info">Beta</ui-beacon>
<ui-beacon variant="pill" color="error" animation="blink">Live</ui-beacon>
```

### Solid — `variant="solid"`

A solid-coloured pill whose whole face flashes. Defaults to `blink` animation. The classic LIVE / REC label.

```html
<ui-beacon variant="solid" color="error">LIVE</ui-beacon>
<ui-beacon variant="solid" color="info">News</ui-beacon>
<ui-beacon variant="solid" color="error" animation="none">Static</ui-beacon>
```

### Ticker — `variant="ticker"`

Slide-out / slide-in compound animation with a trailing 3-dot loader.

```html
<ui-beacon variant="ticker" color="error">Live</ui-beacon>
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

---

## Sizes

`xs`, `sm`, `md` (default), `lg`. Same scale as `<ui-badge>`.

```html
<ui-beacon size="xs" color="success"></ui-beacon>
<ui-beacon size="sm" color="success"></ui-beacon>
<ui-beacon size="md" color="success"></ui-beacon>
<ui-beacon size="lg" color="success"></ui-beacon>
```

---

## Colors

`info`, `success`, `warning`, `error`. Same semantic palette as `<ui-badge>` and `<ui-chip>`.

```html
<ui-beacon color="info">Info</ui-beacon>
<ui-beacon color="success">Success</ui-beacon>
<ui-beacon color="warning">Warning</ui-beacon>
<ui-beacon color="error">Error</ui-beacon>
```

Without `color`, the dot uses the current text color.

---

## Pause behavior

Three mechanisms, ordered from most to least automatic:

1. **`prefers-reduced-motion: reduce`** — every beacon animation stops automatically (WCAG 2.3.1).
2. **`paused` attribute** — declarative pause; toggleable from JS.
   ```html
   <ui-beacon variant="solid" color="error" paused>Paused</ui-beacon>
   ```
   ```js
   beacon.toggleAttribute('paused');
   ```
3. **Click-to-pause** — animated labelled beacons render an inner `<label><input type="checkbox" data-sr><span>…</span></label>` so users can click to pause / resume. No JS handler needed; it relies on native label-click → checkbox-toggle → CSS `:has(input:checked)`.

---

## Attributes

| Attribute | Type | Description |
|---|---|---|
| `color` | `info \| success \| warning \| error` | Semantic color (defaults to text color) |
| `size` | `xs \| sm \| md \| lg` | Size scale (defaults to `md`) |
| `animation` | `blink \| pulse \| breathe \| none` | Animation mode (defaults to none, except `solid` defaults to `blink`) |
| `variant` | `pill \| solid \| ticker` | Layout variant (defaults to bare dot) |
| `paused` | _(boolean)_ | Pause any active animation |

---

## Component tokens

| Token | Default | Description |
|---|---|---|
| `--ui-beacon-bg` | `var(--color-text)` (or semantic color) | Dot / pill / solid background |
| `--ui-beacon-size` | `var(--size-3)` | Dot diameter |
| `--ui-beacon-font-size` | `var(--font-size-sm)` | Label font size |
| `--ui-beacon-font-weight` | `var(--font-weight-medium)` | Label font weight |
| `--ui-beacon-track-bg` | `var(--color-highlight)` | Ticker track background |
| `--ui-beacon-blink-duration` | `1.5s` | Blink cycle |
| `--ui-beacon-pulse-duration` | `1.5s` | Pulse cycle |
| `--ui-beacon-breathe-duration` | `2s` | Breathe cycle |
| `--ui-beacon-slide-duration` | `5s` | Ticker slide cycle |

---

## Framework integration

### React

```jsx
import '@browser.style/beacon';
import '@browser.style/base';
import '@browser.style/beacon/style';

<ui-beacon color="success">Online</ui-beacon>
<ui-beacon variant="solid" color="error">LIVE</ui-beacon>
```

### Vue

```vue
<script setup>
import '@browser.style/beacon';
import '@browser.style/base';
import '@browser.style/beacon/style';
</script>

<template>
  <ui-beacon color="success">Online</ui-beacon>
  <ui-beacon variant="solid" color="error">LIVE</ui-beacon>
</template>
```

> Tell Vue to skip custom-element resolution in `vite.config.js`:
> ```js
> vue({ template: { compilerOptions: { isCustomElement: tag => tag.startsWith('ui-') } } })
> ```

### Svelte

```svelte
<script>
  import '@browser.style/beacon';
  import '@browser.style/base';
  import '@browser.style/beacon/style';
</script>

<ui-beacon color="success">Online</ui-beacon>
<ui-beacon variant="solid" color="error">LIVE</ui-beacon>
```

### Astro / server-rendered HTML

```html
<link rel="stylesheet" href="@browser.style/base/index.css">
<link rel="stylesheet" href="@browser.style/beacon/index.css">

<ui-beacon color="success">Online</ui-beacon>
<ui-beacon variant="solid" color="error">
  <label><input type="checkbox" data-sr><span>LIVE</span></label>
</ui-beacon>
```

---

## Accessibility

- All animations honour `prefers-reduced-motion: reduce` — no opt-in or media query authoring required.
- Click-to-pause is keyboard accessible via the native `<label>` + `<input type="checkbox">` pattern (Space / Enter).
- Focus ring shown on keyboard focus via `--ring-*` tokens.
- The dot is decorative; expose status via the text label inside the beacon.
- Works without JavaScript (CSS-only mode).

---

## Browser support

All modern browsers (Chrome, Firefox, Safari, Edge). `:has()`, `color-mix()`, and `@container` are widely supported as of 2024.
