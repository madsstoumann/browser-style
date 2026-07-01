# @browser.style/play

A CSS-first, **target-agnostic** play/pause button — a round affordance designed to overlay media (images, video posters, cards). It works as a styled button with no JavaScript, and upgrades to a `<ui-play>` web component that manages an `is-playing` state and drives *anything* — a `<video>`, a CSS animation, a YouTube lite-embed, a carousel — through the native **Invoker Commands API** (`command` + `commandfor`). `<ui-play>` never learns what it controls: the target handles the command and reflects the real state back via the `playing` property.

The glyph is a `<ui-icon>` sub-element from `@browser.style/icon`. Use `type="play-pause"` for a single glyph that **morphs** play↔pause as state changes (driven by `open` on the host); the older static `type="play|pause"` is still swapped at runtime for backward compatibility.

## Features

- Round play button rendered from a single `<button>` wrapping a `<ui-icon>` glyph
- The play/pause glyph is a `<ui-icon type="play|pause">` (from `@browser.style/icon`) — no icon font, no SVG asset
- `reveal` variant — hidden until the parent media frame is hovered/focused
- Brand/shape variants — `youtube` (red squircle), `vimeo` (cyan disc), `rounded(sm|md|lg)` (clip-path play triangle)
- Four sizes: small, medium (default), large, extra-large
- `theme` bundles for decorative colors
- Optional web component: toggles `is-playing`, morphs the `<ui-icon>`, and drives targets via the native Invoker Commands API (`command`/`commandfor`) — with a bundled controller for `<video>` and CSS animations. Falls back to a `ui-play-toggle` event when no `commandfor` is set (carousel), and keeps a `for=` shorthand for `<video>`
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

Load `index.js` when you want the **is-playing toggle** — the `aria-pressed` state,
the morphing glyph, command dispatch, the `ui-play-toggle` event, or `for=` driving a
`<video>`. For popover-based playback the popover state is the source of truth, so the
JS toggle is usually unnecessary.

### Command model (`command` / `commandfor`)

The primary way to wire `<ui-play>` to a target is the **native Invoker Commands API**.
Put `command` + `commandfor` on the inner `<button>`; on click the platform dispatches a
`CommandEvent` on the element with that `id`. Custom commands must be `--`-prefixed:

- `--toggle-play` — flip the target's state (the usual single button)
- `--play` / `--pause` — explicit, for separate controls

```html
<ui-play><button type="button" command="--toggle-play" commandfor="promo" aria-label="Play"><ui-icon type="play-pause"></ui-icon></button></ui-play>
<video id="promo" src="promo.mp4" playsinline></video>
```

The target handles the command and reflects reality back via `uiPlay.playing = bool`.
For `<video>`/`<audio>` and CSS-animation targets, import the bundled controller once —
it adds a single delegated `command` listener:

```js
import '@browser.style/play';           // registers <ui-play>
import '@browser.style/play/command.js'; // wires <video> + CSS-animation targets
```

- **`<video>` / `<audio>`** → `.play()` / `.pause()`; the controller binds to the real
  `play`/`pause`/`ended` events so the glyph follows native controls too.
- **CSS animation** → toggles `animation-play-state` on the target element.

A YouTube lite-embed (see `@browser.style/video-embed`) uses a
`<ui-media provider="youtube" video="ID">` frame with a nested `<ui-play>`; its own tiny
controller defers the iframe until the first command.

On browsers without native custom-command support, `<ui-play>` dispatches the same
`CommandEvent` itself as a fallback — the controller behaves identically.

### `ui-play-toggle` event (no `commandfor`)

When the button has **no** `commandfor`, clicking dispatches `ui-play-toggle` on the
`<ui-play>` element instead. It **bubbles** and is **composed**. This is the loose
contract auto-discovered by ancestors (e.g. the carousel in `@browser.style/card`,
whose control is a descendant with no `id`).

```js
document.querySelector('ui-play')
  .addEventListener('ui-play-toggle', (e) => {
    console.log(e.detail.playing); // true | false
  });
```

### `is-playing` state / the `playing` property

State lives on the inner button as `aria-pressed`, mirrored by `open` on the host:

- `aria-pressed="false"` / no `open` → idle
- `aria-pressed="true"` / `open` → playing

`open` drives a `<ui-icon type="play-pause">` glyph to morph via CSS (icon state selector
`[open] >* > ui-icon`). A legacy static `type="play|pause"` glyph is swapped instead, so
old markup keeps working. Read or set the state with the `playing` property — this is the
reflect channel a target uses to report truth:

```js
document.querySelector('ui-play').playing = true; // → aria-pressed + open + glyph
```

### `for` — `<video>` shorthand

Set `for` to the `id` of a `<video>` for direct control without commands. On toggle the
component calls `video.play()` / `video.pause()` and mirrors the video's real state.

```html
<ui-play for="promo"><button type="button" aria-label="Play promo"><ui-icon type="play-pause"></ui-icon></button></ui-play>
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
