# @browser.style/beacon

A CSS-first status indicator. Four layout variants (bare dot, pill, solid, ticker) and three animation modes (blink, pulse, breathe). Visually aligned with `@browser.style/badge` and `@browser.style/chip` — same semantic colors, same size scale, same shape tokens.

## Features

- **Bare dot** by default — colored circle with optional inline label
- **Three distinct animations**: `blink` (broadcast LIVE/REC), `pulse` (outward ripple, attention), `breathe` (gentle scale)
- **Pill variant** — chip-style tinted background with inner dot
- **Solid variant** — original `<blink>`-style filled label, defaults to blink
- **Ticker variant** — sliding marquee with trailing 3-dot loader
- **Motion is opt-in**: every animation is gated behind `prefers-reduced-motion: no-preference` — reduced-motion users get a static beacon automatically; pause a running animation with the `paused` attribute
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

Solid / pill need no inner markup either:

```html
<ui-beacon variant="solid" color="error">LIVE</ui-beacon>
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

The component auto-renders the ticker's inner structure (everything else is pure CSS):

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

## Themes — the shared `theme=` axis

Beacon opts into the cross-component `theme=` axis (see `ui/base/theme.md`) exactly
like `<ui-chip>` and `<ui-sticker>`: one colour token (`red orange green blue accent
white gray slate black`) plus modifiers (`pale`, `muted`, `light`, `dark`). The theme
feeds the beacon's single colour input (`--ui-beacon-bg`) and the paired ink used by
the `solid`/`ticker` faces.

```html
<ui-beacon theme="red">Recording</ui-beacon>
<ui-beacon theme="red pale" variant="pill">Live</ui-beacon>
<ui-beacon theme="slate dark" variant="solid">REC</ui-beacon>
```

A `theme=` (or a card `beacon(<hue>)` token) wins over `color=` when both are present.

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
| position | `beacon(ts…be)` | 9-cell furniture grid; default `bs` (coexists with the chip's `ts`) |
| hue | `beacon(red\|orange\|green\|blue\|accent\|white\|gray\|slate\|black)` | same `--ui-theme-*` bundles as `chip()`/`sticker()` |
| face | `beacon(pll)` pill · `beacon(sld)` solid · `beacon(tck)` ticker | over imagery prefer these — the bare dot has no contrast plate |
| animation | `beacon(bln)` blink · `beacon(pls)` pulse · `beacon(brt)` breathe · `beacon(non)` off | solid defaults to blink |
| size | `beacon(xs\|sm\|md\|lg)` | same em scale as the `size=` attribute |

As furniture the beacon is **marker-class** (like chip/sticker): plain
non-interactive markup, valid inside a reveal `<summary>`. Animations are
reduced-motion-gated like everywhere else; `paused` still works.

**Ticker as furniture — `beacon(tck)`** — ticker styling is a normal card
token (dual arm with the standalone `variant="ticker"` attribute), but it is
the one face that needs inner *markup* (`<span>label <i></i></span>`), which
CSS cannot create. The markup comes from whichever layer renders the card:
the SSR renderer emits it when `tck` is in the beacon tokens; the web
component builds it when it sees `beacon(tck)` in its media scope (same
precedent as carousel.js building `loop` clones); CSS-only pages hand-author
the span. Without the span the face degrades to a static tinted label.

---

## Pause behavior

Motion is **opt-in at the system level**: every animation lives inside
`@media (prefers-reduced-motion: no-preference)`, so under
`prefers-reduced-motion: reduce` no beacon animation ever starts (WCAG 2.3.1) —
no per-instance wiring needed.

For everyone else, the **`paused` attribute** freezes a running animation
declaratively; toggle it from JS:

```html
<ui-beacon variant="solid" color="error" paused>Paused</ui-beacon>
```
```js
beacon.toggleAttribute('paused');
```

---

## Attributes

| Attribute | Type | Description |
|---|---|---|
| `color` | `info \| success \| warning \| error` | Semantic color (defaults to text color) |
| `size` | `xs \| sm \| md \| lg` | Size scale (defaults to `md`) |
| `animation` | `blink \| pulse \| breathe \| none` | Animation mode (defaults to none, except `solid` defaults to `blink`) |
| `variant` | `pill \| solid \| ticker` | Layout variant (defaults to bare dot) |
| `paused` | _(boolean)_ | Pause any active animation (animations never start under reduced motion) |

---

## Component tokens

| Token | Default | Description |
|---|---|---|
| `--ui-beacon-bg` | `var(--color-text)` (or semantic color) | Dot / pill / solid background |
| `--ui-beacon-size` | `var(--size-3)` | Dot diameter |
| `--ui-beacon-font-size` | `var(--font-size-sm)` | Label font size |
| `--ui-beacon-font-weight` | `var(--font-weight-medium)` | Label font weight |
| `--ui-beacon-track-bg` | `color-mix(--ui-beacon-bg 15%, --color-surface)` | Ticker track background (light tint of beacon color) |
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

- Animations are opt-in behind `prefers-reduced-motion: no-preference` — reduced-motion users never see them, with no media-query authoring required.
- The dot is decorative; expose status via the text label inside the beacon.
- Works without JavaScript (CSS-only mode).

---

## Browser support

All modern browsers (Chrome, Firefox, Safari, Edge). `:has()`, `color-mix()`, and `@container` are widely supported as of 2024.
