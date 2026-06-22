# @browser.style/save

A CSS-first save / favorite / wishlist / bookmark toggle. State is entirely CSS-driven via a wrapped checkbox — no JavaScript required for the toggle behavior.

## Features

- Three glyphs: heart (default), bookmark, star
- CSS-only checked state — the wrapped checkbox provides state + keyboard support
- Three sizes: small, medium (default), large
- Token-driven idle and active (checked) ink colors
- Hover and checked opacity transitions
- Light/dark mode support via design tokens
- RTL-safe (icon is symmetric / mask-based)
- Works without JavaScript (CSS-only mode)

---

## Install

```bash
npm install @browser.style/save
```

Peer dependency:

```bash
npm install @browser.style/base
```

> `@browser.style/base` provides the design token system that the toggle references for colors.

---

## Usage

### CSS-only (vanilla HTML)

```html
<link rel="stylesheet" href="@browser.style/base/index.css">
<link rel="stylesheet" href="@browser.style/save/index.css">
```

Or via CSS `@import`:

```css
@import '@browser.style/base';
@import '@browser.style/save/style';
```

The required markup is a `<ui-save>` wrapping a single checkbox. **Always** give the checkbox an `aria-label`:

```html
<ui-save><input type="checkbox" aria-label="Add to favorites"></ui-save>
<ui-save icon="bookmark"><input type="checkbox" aria-label="Bookmark"></ui-save>
<ui-save icon="star"><input type="checkbox" aria-label="Add to wishlist"></ui-save>
```

### Web Component

Import the module to register `<ui-save>`:

```js
import '@browser.style/save';
```

The web component uses the **exact same** HTML structure as CSS-only — the JS only registers the element. The toggle state lives on the wrapped checkbox.

#### Attributes

| Attribute | Type | Description |
|-----------|------|-------------|
| `icon` | string | Glyph: `heart` (default), `bookmark`, `star` |
| `theme` | string | Decorative ink color from a bundle: `red`, `orange`, `green`, `blue`, `accent`, `dark`, `light`, `subtle` |
| `size` | string | Predefined size: `sm`, `md` (default), `lg` |

The wrapped `<input type="checkbox">` carries the checked state; pre-check it with the standard `checked` attribute and label it with `aria-label`.

---

### React

```jsx
import '@browser.style/save';
import '@browser.style/save/style';

function FavoriteToggle({ saved, onChange }) {
  return (
    <ui-save>
      <input type="checkbox" aria-label="Add to favorites"
             checked={saved} onChange={onChange} />
    </ui-save>
  );
}
```

### Vue

```vue
<script setup>
import '@browser.style/save';
import '@browser.style/save/style';
</script>

<template>
  <ui-save icon="bookmark">
    <input type="checkbox" aria-label="Bookmark" v-model="saved">
  </ui-save>
</template>
```

> Tell Vue to skip custom element resolution in `vite.config.js`:
> ```js
> vue({ template: { compilerOptions: { isCustomElement: tag => tag.startsWith('ui-') } } })
> ```

### Svelte

```svelte
<script>
  import '@browser.style/save';
  import '@browser.style/save/style';
  let saved = false;
</script>

<ui-save icon="star">
  <input type="checkbox" aria-label="Add to wishlist" bind:checked={saved}>
</ui-save>
```

### Astro / SSR

Use the CSS-only approach — no JavaScript needed:

```html
<link rel="stylesheet" href="@browser.style/base/index.css">
<link rel="stylesheet" href="@browser.style/save/index.css">

<ui-save><input type="checkbox" aria-label="Add to favorites"></ui-save>
```

---

## Icons

```html
<ui-save><input type="checkbox" aria-label="Favorite"></ui-save>
<ui-save icon="bookmark"><input type="checkbox" aria-label="Bookmark"></ui-save>
<ui-save icon="star"><input type="checkbox" aria-label="Wishlist"></ui-save>
```

| Value | Glyph |
|-------|-------|
| _(none)_ | Heart (default) |
| `bookmark` | Bookmark |
| `star` | Star |

Supply your own glyph by overriding `--ui-save-icon` with any `url(...)` (a `fill="currentColor"` SVG works best, since the icon is rendered as a CSS `mask`):

```css
ui-save { --ui-save-icon: url('/icons/pin.svg'); }
```

## Theme

The `theme` attribute applies a decorative color from a **bundle**. Because the save toggle is icon-only (no background), only the bundle's ink color (`c`) is used to tint the idle glyph. This is distinct from the semantic `color` axis used elsewhere; `theme` is purely cosmetic, and if a component supports both, `theme` wins.

```html
<ui-save theme="accent"><input type="checkbox" aria-label="Favorite"></ui-save>
<ui-save icon="star" theme="orange"><input type="checkbox" aria-label="Wishlist"></ui-save>
```

8 keys:

```
red   orange  green   blue
accent  dark  light  subtle
```

The bundles are defined as `--ui-theme-*` tokens in `@browser.style/base` and are retunable globally. (The checked color is still driven by `--ui-save-c-active`.)

## Sizes

```html
<ui-save size="sm"><input type="checkbox" aria-label="Favorite"></ui-save>
<ui-save size="md"><input type="checkbox" aria-label="Favorite"></ui-save>
<ui-save size="lg"><input type="checkbox" aria-label="Favorite"></ui-save>
```

---

## Customization

### Component tokens

| Token | Default | Description |
|-------|---------|-------------|
| `--ui-save-icon` | `var(--_heart)` | Glyph as a `url(...)` (rendered via CSS `mask`) |
| `--ui-save-c` | `var(--color-text)` | Idle (unchecked) color |
| `--ui-save-c-active` | `var(--color-error)` | Checked color |
| `--ui-save-sz` | `1.6em` | Icon size (block-size, square) |
| `--ui-save-opacity` | `0.85` | Idle opacity (hover/checked → 1) |

Override per instance or globally:

```css
ui-save {
  --ui-save-c-active: hotpink;
  --ui-save-sz: 2em;
}
```

---

## Accessibility

- The wrapped `<input type="checkbox">` provides the toggle semantics, keyboard support (Space to toggle), and focus handling for free.
- **Always** set `aria-label` (or an associated `<label>`) on the checkbox — the glyph is purely visual.
- The checked state is exposed to assistive tech via the native checkbox; no `aria-pressed` juggling needed.

---

## Browser Support

All modern browsers.

| Feature | Support |
|---------|---------|
| Custom elements | All modern browsers |
| CSS `mask` | Chrome 120+ (unprefixed), Firefox 53+, Safari 15.4+ |
| `appearance: none` | All modern browsers |
| `light-dark()` (via base tokens) | Chrome 123+, Firefox 120+, Safari 17.5+ |
