# @browser.style/badge

A CSS-first badge component for status indicators and notification counts. Uses the `<ui-badge>` custom element with `color` and `variant` attributes.

## Install

```bash
npm install @browser.style/badge
```

Peer dependency:

```bash
npm install @browser.style/base
```

> `@browser.style/base` provides the design token system. The badge works without it — tokens fall back to neutral defaults.

---

## Usage

```html
<link rel="stylesheet" href="@browser.style/badge/index.css">
<script type="module" src="@browser.style/badge"></script>
```

Or via bundler:

```js
import '@browser.style/badge';
import '@browser.style/badge/style';
```

### Basic

```html
<button type="button">
  Notifications
  <ui-badge>5</ui-badge>
</button>
```

The badge positions itself at the top-right corner of its parent. The parent automatically gets `position: relative`.

### Colors

Use the `color` attribute for semantic colors:

```html
<ui-badge color="info">5</ui-badge>
<ui-badge color="success">3</ui-badge>
<ui-badge color="warning">!</ui-badge>
<ui-badge color="error">9</ui-badge>
```

| Value | Description |
|-------|-------------|
| _(none)_ | Default — uses `--color-text` |
| `info` | Blue — `--color-info` |
| `success` | Green — `--color-success` |
| `warning` | Orange — `--color-warning` |
| `error` | Red — `--color-error` |

### Variants

Use the `variant` attribute for positioning and shape:

```html
<ui-badge variant="top-right">99</ui-badge>
<ui-badge variant="bottom-right">👍</ui-badge>
<ui-badge variant="inline">4</ui-badge>
<ui-badge variant="text">new</ui-badge>
```

Variants can be combined:

```html
<ui-badge color="success" variant="inline text">new</ui-badge>
```

| Variant | Description |
|---------|-------------|
| _(none)_ | Default — absolute, top-right with offset |
| `top-right` | Top-right without translate offset |
| `bottom-right` | Bottom-right corner |
| `inline` | Flows inline, no absolute positioning |
| `text` | Pill-shaped for text labels |

---

## Framework examples

### React

```jsx
import '@browser.style/badge';
import '@browser.style/badge/style';

function NotificationButton() {
  return (
    <button type="button">
      Notifications
      <ui-badge color="info">5</ui-badge>
    </button>
  );
}
```

### Vue

```vue
<script setup>
import '@browser.style/badge';
import '@browser.style/badge/style';
</script>

<template>
  <button type="button">
    Notifications
    <ui-badge color="info" variant="inline">5</ui-badge>
  </button>
</template>
```

### Svelte

```svelte
<script>
  import '@browser.style/badge';
  import '@browser.style/badge/style';
</script>

<button type="button">
  Notifications
  <ui-badge color="success">3</ui-badge>
</button>
```

### Astro / SSR

The `<ui-badge>` element works as a structural element even without JavaScript — all styling is CSS-driven:

```html
<link rel="stylesheet" href="@browser.style/badge/index.css">
<button type="button">
  Notifications
  <ui-badge color="error">9</ui-badge>
</button>
```

---

## Customization

### Component tokens

| Token | Default | Description |
|-------|---------|-------------|
| `--ui-badge-size` | `1.5rem` | Height and min-width |
| `--ui-badge-bg` | `var(--color-text)` | Background color |
| `--ui-badge-color` | `var(--color-surface)` | Text color |
| `--ui-badge-border-color` | `transparent` | Border color |
| `--ui-badge-border-radius` | `var(--radius-circle)` | Corner radius |
| `--ui-badge-font-size` | `.675rem` | Font size |

Override per instance or globally:

```css
ui-badge {
  --ui-badge-size: 2rem;
  --ui-badge-font-size: .8rem;
}
```

---

## Accessibility

- Sets `role="status"` automatically — screen readers announce badge content as a live region
- Use meaningful content (numbers, short labels) rather than decorative symbols
- For purely decorative badges, add `aria-hidden="true"`

## Browser support

All modern browsers. `text-box: cap alphabetic` requires Chrome 133+ / Safari 18.2+ (graceful degradation).
