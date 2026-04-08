# @browser.style/avatar

CSS-first avatar component with random per-element colors, shape variants, and flexible group layouts.

## Features

- Pure CSS color generation using `random(per-element)` and `contrast-color()`
- Shape variants: circle (default), square, squircle (`corner-shape`)
- Group layouts: stack (overlapping), spread
- Light/dark mode support via `light-dark()`
- RTL support via logical properties
- Focus-visible and hover interactions
- Works without JavaScript (CSS-only mode)

## Install

```bash
npm install @browser.style/avatar
```

Peer dependency:

```bash
npm install @browser.style/base
```

## Usage: CSS-only

```html
<link rel="stylesheet" href="@browser.style/base/index.css">
<link rel="stylesheet" href="@browser.style/avatar/index.css">

<!-- Single avatar with image -->
<ui-avatar>
  <abbr title="Kim Cronos">KC</abbr>
  <img src="avatar.webp" alt="Kim Cronos">
</ui-avatar>

<!-- Initials only — gets a random background color -->
<ui-avatar>
  <abbr title="Kim Cronos">KC</abbr>
</ui-avatar>
```

## Usage: Web Component

```js
import '@browser.style/avatar';
```

```html
<ui-avatar>
  <img src="avatar.webp" alt="Kim Cronos">
</ui-avatar>

<ui-avatar-group>
  <ui-avatar><img src="a1.webp" alt="User 1"></ui-avatar>
  <ui-avatar><img src="a2.webp" alt="User 2"></ui-avatar>
  <ui-avatar><img src="a3.webp" alt="User 3"></ui-avatar>
</ui-avatar-group>
```

## Usage: React

```jsx
// Web component approach
import '@browser.style/avatar';

function TeamAvatars({ members }) {
  return (
    <ui-avatar-group>
      {members.map(m => (
        <ui-avatar key={m.id}>
          <img src={m.avatar} alt={m.name} />
        </ui-avatar>
      ))}
    </ui-avatar-group>
  );
}

// CSS-only approach
import '@browser.style/avatar/index.css';

function Avatar({ name, initials, src }) {
  return (
    <ui-avatar>
      {initials && <abbr title={name}>{initials}</abbr>}
      {src && <img src={src} alt={name} />}
    </ui-avatar>
  );
}
```

## Usage: Vue

```js
// vite.config.js
export default {
  plugins: [vue({
    template: {
      compilerOptions: {
        isCustomElement: tag => tag.startsWith('ui-')
      }
    }
  })]
}
```

```vue
<template>
  <ui-avatar-group variant="spread">
    <ui-avatar v-for="user in users" :key="user.id">
      <img :src="user.avatar" :alt="user.name">
    </ui-avatar>
  </ui-avatar-group>
</template>

<script setup>
import '@browser.style/avatar';
</script>
```

## Usage: Svelte

```svelte
<script>
  import '@browser.style/avatar';
  export let users;
</script>

<ui-avatar-group>
  {#each users as user}
    <ui-avatar>
      <img src={user.avatar} alt={user.name}>
    </ui-avatar>
  {/each}
</ui-avatar-group>
```

## Usage: Astro / Server

```astro
---
import '@browser.style/avatar/index.css';
const { name, initials, src } = Astro.props;
---

<ui-avatar>
  {initials && <abbr title={name}>{initials}</abbr>}
  {src && <img src={src} alt={name}>}
</ui-avatar>

<!-- Optional: register custom elements for client-side features -->
<script>
  import '@browser.style/avatar';
</script>
```

## Variants

### Shape variants

```html
<!-- Circle (default) -->
<ui-avatar><abbr title="KC">KC</abbr></ui-avatar>

<!-- Square -->
<ui-avatar variant="square"><abbr title="KC">KC</abbr></ui-avatar>

<!-- Squircle (iOS-style superellipse) -->
<ui-avatar variant="squircle"><abbr title="KC">KC</abbr></ui-avatar>
```

The squircle variant uses `corner-shape: squircle` with `border-radius: 25%`. Browsers without `corner-shape` support fall back to standard rounded corners.

### Group variants

```html
<!-- Stack: overlapping (default) -->
<ui-avatar-group>...</ui-avatar-group>

<!-- Spread: evenly spaced row -->
<ui-avatar-group variant="spread">...</ui-avatar-group>
```

## Customization

### Global token overrides

```css
:root {
  --color-border: hsl(220, 20%, 70%);
  --border-width-thick: 3px;
  --radius-circle: 50%;
  --font-weight-semibold: 600;
}
```

### Component tokens

| Token | Default | Description |
|-------|---------|-------------|
| `--ui-avatar-background` | `oklch(0.65 0.25 random(...))` | Background color (random per element) |
| `--ui-avatar-border-width` | `var(--border-width-thick, 2px)` | Border width |
| `--ui-avatar-border-radius` | `50%` | Border radius |
| `--ui-avatar-color` | `contrast-color(...)` | Text color (auto-contrast) |
| `--ui-avatar-font-size` | `33cqi` | Initials font size |
| `--ui-avatar-size` | `4em` | Avatar dimensions |
| `--ui-avatar-overlap` | `-1cqi` | Overlap in stack layout |
| `--ui-avatar-ring-offset` | `var(--ring-offset, 3px)` | Ring gap from avatar edge |
| `--ui-avatar-ring-width` | `var(--ring-width, 2px)` | Ring stroke width |
| `--ui-avatar-status-size` | `20cqi` | Status indicator size |

### Example: custom size and colors

```css
.team-section {
  --ui-avatar-size: 6em;
  --ui-avatar-border-width: 3px;
  --ui-avatar-background: var(--color-accent);
}
```

## Accessibility

- Uses `<abbr>` with `title` attribute for initials — provides full name on hover
- `tabindex="0"` can be added for keyboard navigation in groups
- Focus ring uses `--ring-width`, `--ring-color`, and `--ring-offset` tokens
- Images should always include meaningful `alt` text
- `<ui-avatar-group>` can be given `role="group"` and `aria-label` for screen readers

## Browser Support

| Feature | Support |
|---------|---------|
| Custom elements | All modern browsers |
| `random(per-element)` | Chrome 138+, requires CSS Values Level 5 |
| `contrast-color()` | Chrome 138+, requires CSS Color Level 5 |
| `corner-shape: squircle` | Chrome 135+, requires CSS Backgrounds Level 4 |
| `light-dark()` | Chrome 123+, Firefox 120+, Safari 17.5+ |
| Container query units (`cqi`) | Chrome 105+, Firefox 110+, Safari 16+ |

Graceful degradation: without `random()`, avatars use the fallback `--ui-avatar-background` value. Without `corner-shape`, squircle falls back to `border-radius: 25%`. Without `contrast-color()`, set `--ui-avatar-color` explicitly.
