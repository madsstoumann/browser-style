# @browser.style/beacon

A CSS-first live indicator component combining two animation modes: a **live ticker** (sliding text with animated dots) and a **classic blink** (with click-to-pause toggle). Supports semantic colors like badge. No JavaScript required for the base experience.

## Features

- Default mode: live ticker with dot animation and slide-out/in effect
- Blink variant: classic blinking text with click-to-pause toggle
- Semantic `color` attribute: `info`, `success`, `warning`, `error`
- Light/dark mode support via design tokens
- Works as plain CSS or as a `<ui-beacon>` web component
- Web component auto-generates inner structure (dots, toggle checkbox)

---

## Install

```bash
npm install @browser.style/beacon
```

Peer dependency:

```bash
npm install @browser.style/base
```

> `@browser.style/base` provides the design token system and the `data-sr` utility for visually hidden elements.

---

## Usage

### CSS-only (vanilla HTML)

Import the styles:

```html
<link rel="stylesheet" href="@browser.style/base/index.css">
<link rel="stylesheet" href="@browser.style/beacon/index.css">
```

Or via CSS `@import`:

```css
@import '@browser.style/base';
@import '@browser.style/beacon/style';
```

**Live ticker** (default):

```html
<ui-beacon>
  <span>Live <i></i></span>
</ui-beacon>
```

> The `<i>` element renders the animated dots. It's required in CSS-only mode.

**Blink** (with click-to-pause):

```html
<ui-beacon variant="blink">
  <label>
    <input type="checkbox" data-sr>
    <span>Live now</span>
  </label>
</ui-beacon>
```

> Click to pause/resume the blink. The `data-sr` class visually hides the checkbox.

---

### Web Component

Import the module to register `<ui-beacon>`:

```js
import '@browser.style/beacon';
```

**Live ticker** — the web component wraps content in `<span>` and appends the `<i>` dots automatically:

```html
<ui-beacon>Live</ui-beacon>
```

**Blink** — the web component creates the `<label>`, hidden checkbox, and `<span>` automatically:

```html
<ui-beacon variant="blink">Live now</ui-beacon>
```

#### Attributes

| Attribute | Type | Description |
|-----------|------|-------------|
| `variant` | string | `"blink"` for classic blink mode. Omit for live ticker. |
| `color` | string | Semantic color: `info`, `success`, `warning`, `error` |

---

### React

```jsx
import '@browser.style/beacon';
import '@browser.style/base';
import '@browser.style/beacon/style';

function LiveIndicator() {
  return <ui-beacon color="error">Live</ui-beacon>;
}

function BlinkIndicator() {
  return <ui-beacon variant="blink" color="success">On Air</ui-beacon>;
}
```

---

### Vue

```vue
<script setup>
import '@browser.style/beacon';
import '@browser.style/base';
import '@browser.style/beacon/style';
</script>

<template>
  <ui-beacon color="error">Live</ui-beacon>
  <ui-beacon variant="blink" color="success">On Air</ui-beacon>
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
  import '@browser.style/beacon';
  import '@browser.style/base';
  import '@browser.style/beacon/style';
</script>

<ui-beacon color="error">Live</ui-beacon>
<ui-beacon variant="blink" color="success">On Air</ui-beacon>
```

---

### Astro / Server-rendered HTML

Use the CSS-only approach:

```html
<link rel="stylesheet" href="@browser.style/base/index.css">
<link rel="stylesheet" href="@browser.style/beacon/index.css">

<ui-beacon>
  <span>Live <i></i></span>
</ui-beacon>
```

Add the web component script for the declarative API:

```html
<script type="module">
  import '@browser.style/beacon';
</script>
```

---

## Variants

### Default (live ticker)

Sliding text with animated dots. The text periodically slides out and back in.

```html
<ui-beacon>
  <span>Live <i></i></span>
</ui-beacon>
```

### Blink

Classic blinking text. Click to pause/resume.

```html
<ui-beacon variant="blink">
  <label>
    <input type="checkbox" data-sr>
    <span>Live now</span>
  </label>
</ui-beacon>
```

---

## Colors

Use the `color` attribute for semantic coloring (same pattern as `ui-badge`):

```html
<ui-beacon color="info">Info</ui-beacon>
<ui-beacon color="success">Active</ui-beacon>
<ui-beacon color="warning">Caution</ui-beacon>
<ui-beacon color="error">Live</ui-beacon>
```

Works with both default and blink variants:

```html
<ui-beacon variant="blink" color="error">
  <label><input type="checkbox" data-sr><span>LIVE</span></label>
</ui-beacon>
```

---

## Customization

### Design tokens

Override global tokens to theme all beacons:

```css
:root {
  --color-accent: hsl(0, 80%, 50%);
  --color-accent-text: white;
}
```

### Component tokens

```css
ui-beacon {
  --ui-beacon-bg: crimson;
  --ui-beacon-slide-duration: 8s;
}
```

### All component tokens

| Token | Default | Description |
|-------|---------|-------------|
| `--ui-beacon-bg` | `var(--color-accent)` | Background color |
| `--ui-beacon-color` | `var(--color-accent-text)` | Text color |
| `--ui-beacon-track-bg` | `var(--color-highlight)` | Track background visible during slide (live mode) |
| `--ui-beacon-font-size` | `smaller` | Font size |
| `--ui-beacon-font-weight` | `var(--font-weight-medium)` | Font weight (live mode) |
| `--ui-beacon-padding` | `0.25ch 1.5ch` (live) / `.33ch 1ch` (blink) | Inner padding |
| `--ui-beacon-slide-duration` | `5s` | Duration of the slide animation cycle (live mode) |
| `--ui-beacon-blink-duration` | `2s` | Duration of the blink animation cycle (blink mode) |

---

## Accessibility

- Blink variant uses a native `<label>` + `<input type="checkbox">` — keyboard accessible via `Space`/`Enter`
- Focus ring shown on keyboard focus (`focus-visible`)
- Click or keyboard toggle pauses the animation (reduces motion for users who find it distracting)
- Consider `prefers-reduced-motion` media query for users who need it:
  ```css
  @media (prefers-reduced-motion: reduce) {
    ui-beacon span, ui-beacon i { animation: none; }
  }
  ```
- Works with JavaScript disabled (CSS-only mode)

---

## Browser support

- All modern browsers (Chrome, Firefox, Safari, Edge)
- CSS animations: universally supported
- `translate` property: Chrome 104+, Firefox 72+, Safari 14.1+
- Graceful degradation: animations degrade cleanly in older browsers
