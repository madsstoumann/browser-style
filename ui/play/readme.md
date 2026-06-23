# @browser.style/play

A CSS-first media **play button** — a round play affordance designed to overlay media (images, video posters, cards). It works as a styled button with no JavaScript, and upgrades to a `<ui-play>` web component that manages an `is-playing` state, swaps the play glyph for a pause glyph, emits a `ui-play-toggle` event, and can optionally drive a `<video>`.

The glyph is a `<ui-icon>` sub-element from `@browser.style/icon`. In CSS-only mode you author the icon `type` (`play` by default); the web component swaps it between `play` and `pause` at runtime.

## Features

- Round play button rendered from a single `<button>` wrapping a `<ui-icon>` glyph
- The play/pause glyph is a `<ui-icon type="play|pause">` (from `@browser.style/icon`) — no icon font, no SVG asset
- `reveal` variant — hidden until the parent media frame is hovered/focused
- Brand/shape variants — `youtube` (red squircle), `vimeo` (cyan disc), `rounded(sm|md|lg)` (clip-path play triangle)
- Four sizes: small, medium (default), large, extra-large
- `theme` bundles for decorative colors
- Optional web component: toggles `is-playing`, swaps the `<ui-icon type>`, emits an event, and can control a `<video>` via `for`
- Token-driven colors, radius, size, icon size, and transition duration
- Light/dark mode support via design tokens
- Works without JavaScript (CSS-only mode — a styled button without toggle)

---

## Install

```bash
npm install @browser.style/play
```

Peer dependencies:

```bash
npm install @browser.style/base @browser.style/icon
```

> `@browser.style/base` provides the design token system that the button references for colors, radius, and timing. `@browser.style/icon` provides the `<ui-icon>` glyph used for the play/pause symbol.

---

## Usage

### CSS-only (vanilla HTML)

```html
<link rel="stylesheet" href="@browser.style/base/index.css">
<link rel="stylesheet" href="@browser.style/icon/index.css">
<link rel="stylesheet" href="@browser.style/play/index.css">
```

Or via CSS `@import`:

```css
@import '@browser.style/base';
@import '@browser.style/icon/style';
@import '@browser.style/play/style';
```

The required markup is a `<ui-play>` wrapping a single `<button>` that contains a `<ui-icon type="play">` glyph. **Always** give the button an `aria-label`:

```html
<ui-play><button type="button" aria-label="Play"><ui-icon type="play"></ui-icon></button></ui-play>
```

Without JavaScript you still get a fully styled, focusable, accessible button — it just won't swap the glyph to pause on its own (it renders whatever `type` you author).

### Web Component

Import the module to register `<ui-play>`:

```js
import '@browser.style/play';
```

The web component uses the **exact same** HTML structure as CSS-only. The JS adds behavior: it toggles `aria-pressed` (the **is-playing** state) on click, swaps the inner `<ui-icon>` between `type="play"` and `type="pause"`, emits a `ui-play-toggle` event, and — if you set `for` — plays/pauses the referenced `<video>` and keeps the glyph in sync with the video's real state.

```html
<ui-play for="hero-video"><button type="button" aria-label="Play video"><ui-icon type="play"></ui-icon></button></ui-play>
<video id="hero-video" src="movie.mp4" playsinline></video>
```

#### Attributes

| Attribute | Type | Description |
|-----------|------|-------------|
| `variant` | string | Space-separated: `reveal` (hidden until parent hover/focus), `youtube`, `vimeo`, `rounded(sm)` / `rounded(md)` / `rounded(lg)` |
| `size` | string | Predefined size: `sm`, `md` (default), `lg`, `xl` |
| `theme` | string | Decorative color bundle: `red`, `orange`, `green`, `blue`, `accent`, `dark`, `light`, `subtle` |
| `for` | string | `id` of a `<video>` to control; toggling plays/pauses it and syncs the glyph |

The inner `<button>` carries the `aria-pressed` state (the is-playing flag). Always label it with `aria-label`. The glyph is a `<ui-icon>` inside the button.

---

### React

```jsx
import '@browser.style/play';
import '@browser.style/icon/style';
import '@browser.style/play/style';

function PlayOverlay({ onToggle }) {
  return (
    <ui-play onui-play-toggle={onToggle}>
      <button type="button" aria-label="Play"><ui-icon type="play" /></button>
    </ui-play>
  );
}
```

> React doesn't bind custom events by name; attach a `ref` and `addEventListener('ui-play-toggle', ...)` for full control.

### Vue

```vue
<script setup>
import '@browser.style/play';
import '@browser.style/icon/style';
import '@browser.style/play/style';
</script>

<template>
  <ui-play for="clip" @ui-play-toggle="onToggle">
    <button type="button" aria-label="Play"><ui-icon type="play" /></button>
  </ui-play>
  <video id="clip" src="clip.mp4" playsinline></video>
</template>
```

> Tell Vue to skip custom element resolution in `vite.config.js`:
> ```js
> vue({ template: { compilerOptions: { isCustomElement: tag => tag.startsWith('ui-') } } })
> ```

### Svelte

```svelte
<script>
  import '@browser.style/play';
  import '@browser.style/icon/style';
  import '@browser.style/play/style';
</script>

<ui-play on:ui-play-toggle={(e) => console.log(e.detail.playing)}>
  <button type="button" aria-label="Play"><ui-icon type="play" /></button>
</ui-play>
```

### Astro / SSR

Use the CSS-only approach — no JavaScript needed:

```html
<link rel="stylesheet" href="@browser.style/base/index.css">
<link rel="stylesheet" href="@browser.style/icon/index.css">
<link rel="stylesheet" href="@browser.style/play/index.css">

<ui-play><button type="button" aria-label="Play"><ui-icon type="play"></ui-icon></button></ui-play>
```

---

## Variants

```html
<!-- solid (default) -->
<ui-play><button type="button" aria-label="Play"><ui-icon type="play"></ui-icon></button></ui-play>

<!-- reveal — wrap in a hover container (e.g. a media frame) -->
<figure style="position: relative">
  <img src="poster.jpg" alt="">
  <ui-play variant="reveal"><button type="button" aria-label="Play"><ui-icon type="play"></ui-icon></button></ui-play>
</figure>
```

`reveal` keeps the button at `opacity: 0` until its **parent** is hovered or it receives focus inside, so the affordance appears on demand over media. It is implemented generically and works inside any container.

## Theme

The `theme` attribute applies a decorative color bundle (background + ink).

```html
<ui-play theme="dark"><button type="button" aria-label="Play"><ui-icon type="play"></ui-icon></button></ui-play>
<ui-play theme="accent"><button type="button" aria-label="Play"><ui-icon type="play"></ui-icon></button></ui-play>
```

8 keys:

```
red   orange  green   blue
accent  dark  light  subtle
```

The bundles are defined as `--ui-theme-*` tokens in `@browser.style/base` and are retunable globally. `theme` is placed after the color defaults, so it wins the cascade.

## Sizes

```html
<ui-play size="sm"><button type="button" aria-label="Play"><ui-icon type="play"></ui-icon></button></ui-play>
<ui-play size="md"><button type="button" aria-label="Play"><ui-icon type="play"></ui-icon></button></ui-play>
<ui-play size="lg"><button type="button" aria-label="Play"><ui-icon type="play"></ui-icon></button></ui-play>
<ui-play size="xl"><button type="button" aria-label="Play"><ui-icon type="play"></ui-icon></button></ui-play>
```

Sizes are `em`-based (`sm` 2.25em → `xl` 5em), so the button scales with the surrounding font-size; the glyph scales with it.

## Shape variants

Reshape the disc into a platform badge or a clipped play triangle. These keep the same markup — just add the `variant`.

```html
<!-- YouTube — red squircle, white arrow -->
<ui-play variant="youtube"><button type="button" aria-label="Play"><ui-icon type="play"></ui-icon></button></ui-play>

<!-- Vimeo — cyan disc, white arrow -->
<ui-play variant="vimeo"><button type="button" aria-label="Play"><ui-icon type="play"></ui-icon></button></ui-play>

<!-- rounded — clip-path play triangle; sm | md | lg controls corner rounding -->
<ui-play variant="rounded(md)"><button type="button" aria-label="Play"><ui-icon type="play"></ui-icon></button></ui-play>
```

- **`youtube`** — a landscape (`aspect-ratio: 1.422`) red squircle via `corner-shape: superellipse()`; degrades to plain rounded corners where `corner-shape` is unsupported. Keeps the white `<ui-icon>` arrow.
- **`vimeo`** — a cyan disc; keeps the white arrow.
- **`rounded(sm|md|lg)`** — clips the button into a right-pointing play triangle with `clip-path: shape()`. The `<ui-icon>` is hidden because the shape *is* the arrow. Corner rounding scales with `--ui-play-round`; plain `rounded` = `md`.

Recolor with `--ui-play-bg` / `--ui-play-bg-hover`, retune the squircle with `--ui-play-radius` / `--ui-play-corner`, the triangle rounding with `--ui-play-round`, or replace the path entirely with `--ui-play-shape`.

---

## JavaScript API

The web component adds behavior on top of the CSS-only markup.

### Not always required

`<ui-play>` wraps a real `<button>`, so it works **without the web component** whenever
the trigger is declarative — no JS needed:

- **Popover / lightbox** — point the button at a `[popover]` (e.g. a video overlay)
  with the native Popover API; the platform handles open/close:
  ```html
  <ui-play><button type="button" popovertarget="trailer" popovertargetaction="show" aria-label="Play trailer"><ui-icon type="play"></ui-icon></button></ui-play>
  <div id="trailer" popover><video src="trailer.mp4" controls></video></div>
  ```
- **Link to the video** — a plain navigation, also no JS:
  ```html
  <ui-play><a href="trailer.mp4" aria-label="Play trailer"><ui-icon type="play"></ui-icon></a></ui-play>
  ```
  *(when wrapping an `<a>`, style it the same as the button — see CSS-only usage).*

Load `index.js` only when you want the **is-playing toggle** — the `aria-pressed`
play↔pause swap (the `<ui-icon type>` swaps with it), the `ui-play-toggle` event, or
`for=` driving a `<video>` directly. For popover-based playback the popover state is
the source of truth, so the JS toggle is usually unnecessary.

### `ui-play-toggle` event

Dispatched on the `<ui-play>` element each time the button is clicked. It **bubbles** and is **composed**.

```js
document.querySelector('ui-play')
  .addEventListener('ui-play-toggle', (e) => {
    console.log(e.detail.playing); // true | false
  });
```

### `is-playing` state

The state lives on the inner button as `aria-pressed`:

- `aria-pressed="false"` → idle, the web component sets the glyph to `<ui-icon type="play">`
- `aria-pressed="true"`  → playing, the web component sets the glyph to `<ui-icon type="pause">`

The glyph swap is performed by the web component, which sets the inner `<ui-icon type>` to `play` or `pause` in step with `aria-pressed`. It is not a CSS pseudo-element — in CSS-only mode the authored `type` is rendered as-is.

### `for` — controlling a `<video>`

Set `for` to the `id` of a `<video>`. On toggle, the component calls `video.play()` / `video.pause()`, and listens to the video's `play`, `pause`, and `ended` events to keep `aria-pressed` (and therefore the glyph) in sync with the real playback state.

```html
<ui-play for="promo"><button type="button" aria-label="Play promo"><ui-icon type="play"></ui-icon></button></ui-play>
<video id="promo" src="promo.mp4" playsinline></video>
```

---

## Customization

### Component tokens

| Token | Default | Description |
|-------|---------|-------------|
| `--ui-play-bg` | `color-mix(in oklch, var(--color-surface) 80%, transparent)` | Solid background |
| `--ui-play-bg-hover` | `var(--color-surface)` | Hover/focus background (solid) |
| `--ui-play-c` | `var(--color-text)` | Glyph / ink color |
| `--ui-play-sz` | `3em` | Button diameter (inline-size, square) |
| `--ui-play-radius` | `var(--radius-circle, 50%)` | Button corner radius (also the squircle radius for `youtube`) |
| `--ui-play-icon-sz` | `1.5em` | Sizes the inner `<ui-icon>` glyph |
| `--ui-play-trsdu` | `.2s` | Transition duration (background, color, opacity) |
| `--ui-play-corner` | `squircle` | `corner-shape` for the `youtube` variant |
| `--ui-play-round` | `4.5%` | Corner rounding of the `rounded` triangle (`sm` 2.5% / `md` 4.5% / `lg` 6.5%) |
| `--ui-play-shape` | _(per variant)_ | `clip-path` override for the `rounded` triangle |

Override per instance or globally:

```css
ui-play {
  --ui-play-sz: 4.5em;
  --ui-play-bg: black;
  --ui-play-c: white;
}
```

---

## Accessibility

- The affordance is a real `<button type="button">`, so it is keyboard-focusable and operable (Enter / Space) for free.
- **Always** set `aria-label` on the button — the glyph is purely visual.
- The is-playing state is exposed via `aria-pressed` on the button, toggled by the web component (and mirrored from the bound video). The pause glyph is a visual reflection of that same state.
- It is intended as a **media overlay** for cards and media frames — it is interactive, so it must **not** be placed inside a `<summary>` (interactive content is not valid there).

---

## Browser Support

All modern browsers.

| Feature | Support |
|---------|---------|
| Custom elements | All modern browsers |
| CSS `clip-path: polygon()` (ui-icon glyph) | All modern browsers |
| `color-mix()` | Chrome 111+, Firefox 113+, Safari 16.2+ |
| `light-dark()` (via base tokens) | Chrome 123+, Firefox 120+, Safari 17.5+ |
| `clip-path: shape()` (`rounded` variant) | Chrome 137+, Safari 18.4+, Firefox 139+ — degrades to a plain disc |
| `corner-shape: superellipse()` (`youtube` squircle) | Chrome 139+ — degrades to plain rounded corners |
