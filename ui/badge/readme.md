# @browser.style/badge

A CSS-first badge component for status indicators and notification counts. It positions itself at a corner of its parent (avatar, button, chip, etc.) or can flow inline as a label. Semantic colors, three sizes, and shape variants — no JavaScript required for the base experience.

## Features

- Auto-positioning — parent gets `position: relative` automatically
- Semantic colors: info, success, warning, error
- Three sizes: small, medium (default), large
- Shape variants: circle (default), square, squircle (`corner-shape`)
- Four corner positions: top-right (default), top-left, bottom-right, bottom-left
- Circular-host awareness — badge sits on the arc, not outside the circle
- Auto-detection for circular `<ui-avatar>` parents
- Inline and text variants for non-positioned use
- Light/dark mode support via design tokens
- RTL support via logical properties
- Works without JavaScript (CSS-only mode)

---

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

### CSS-only (vanilla HTML)

Import the styles, then write native HTML. No JavaScript needed.

```html
<link rel="stylesheet" href="@browser.style/base/index.css">
<link rel="stylesheet" href="@browser.style/badge/index.css">
```

Or via CSS `@import`:

```css
@import '@browser.style/base';
@import '@browser.style/badge/style';
```

```html
<button type="button">
  Notifications
  <ui-badge color="info">5</ui-badge>
</button>
```

The badge positions itself at the top-right corner of its parent. The parent automatically gets `position: relative`.

---

### Web Component

Import the module to register `<ui-badge>`:

```js
import '@browser.style/badge';
```

```html
<button type="button">
  Notifications
  <ui-badge color="info">5</ui-badge>
</button>
```

The web component uses the **exact same** HTML structure as CSS-only. It's a convenience wrapper for framework integration, not a replacement — the CSS is identical in both modes. The JS only adds `role="status"` for screen readers.

#### Attributes

| Attribute | Type | Description |
|-----------|------|-------------|
| `color` | string | Semantic color: `info`, `success`, `warning`, `error` |
| `size` | string | Predefined size: `sm`, `md` (default), `lg` |
| `position` | string | Corner placement: `top-right` (default), `top-left`, `bottom-right`, `bottom-left` |
| `host-shape` | string | Hint about the parent's shape. `circle` offsets the badge inward so it sits on the 45° arc. Auto-applied when the parent is a circular `<ui-avatar>`. |
| `variant` | string | Space-separated: `inline`, `text`, `square`, `squircle` |

---

### React

```jsx
import '@browser.style/badge';
import '@browser.style/badge/style';

function NotificationButton({ count }) {
  return (
    <button type="button">
      Notifications
      <ui-badge color="info">{count}</ui-badge>
    </button>
  );
}
```

> React 19+ handles custom elements natively. For React 18, custom element attributes work in JSX but you may need `ref` for setting properties.

---

### Vue

```vue
<script setup>
import '@browser.style/badge';
import '@browser.style/badge/style';

defineProps({ count: Number });
</script>

<template>
  <button type="button">
    Notifications
    <ui-badge color="info">{{ count }}</ui-badge>
  </button>
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
  import '@browser.style/badge';
  import '@browser.style/badge/style';

  let { count } = $props();
</script>

<button type="button">
  Notifications
  <ui-badge color="success">{count}</ui-badge>
</button>
```

---

### Astro / Server-rendered HTML

Use the CSS-only approach — no JavaScript needed:

```html
<link rel="stylesheet" href="@browser.style/base/index.css">
<link rel="stylesheet" href="@browser.style/badge/index.css">

<button type="button">
  Notifications
  <ui-badge color="error">9</ui-badge>
</button>
```

---

## Colors

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

## Sizes

Use the `size` attribute: `sm`, `md` (default), `lg`.

```html
<ui-badge size="sm" color="info">3</ui-badge>
<ui-badge size="md" color="info">12</ui-badge>
<ui-badge size="lg" color="info">99</ui-badge>
```

## Positions

Use the `position` attribute to place the badge at any corner of its parent:

```html
<ui-badge position="top-right">99</ui-badge>   <!-- default -->
<ui-badge position="top-left">!</ui-badge>
<ui-badge position="bottom-right">👍</ui-badge>
<ui-badge position="bottom-left">2</ui-badge>
```

Positions use logical properties so they flip automatically in RTL.

## Host shape

A badge positioned at the corner of the bounding box floats outside a circular parent. Use `host-shape="circle"` to offset the badge inward by ~14.6% so it sits on the 45° arc of the circle:

```html
<div class="round-avatar">
  <ui-badge host-shape="circle" position="top-right">5</ui-badge>
</div>
```

For `<ui-avatar>` parents without `variant="square"` or `variant="squircle"`, this is applied **automatically** — you don't need to set `host-shape` yourself:

```html
<ui-avatar>
  <img src="avatar.webp" alt="Kim Cronos">
  <ui-badge color="success">5</ui-badge>
</ui-avatar>
```

The math: for a circle of radius *r* inscribed in a square, the 45° arc point is `r(1 − 1/√2) ≈ 14.6%` inside each edge of the bounding box.

## Variants

Use the `variant` attribute for shape and display mode. Values are space-separated and can be combined:

```html
<ui-badge variant="inline">4</ui-badge>
<ui-badge variant="text">new</ui-badge>
<ui-badge variant="square">5</ui-badge>
<ui-badge variant="squircle">!</ui-badge>
<ui-badge color="success" variant="inline text">new</ui-badge>
```

| Variant | Description |
|---------|-------------|
| _(none)_ | Default — absolute, circular |
| `inline` | Flows inline, no absolute positioning |
| `text` | Pill-shaped for text labels |
| `square` | Rounded corners (`--radius-md`) |
| `squircle` | iOS-style superellipse (`corner-shape`) |

The squircle variant uses `corners: 50% superellipse(2)`. Browsers without support fall back to the default circular shape.

---

## Customization

### Global token overrides

```css
:root {
  --color-info: hsl(210, 80%, 50%);
  --radius-md: 0.5rem;
}
```

### Component tokens

| Token | Default | Description |
|-------|---------|-------------|
| `--ui-badge-size` | `var(--size-5, 1.5rem)` | Height and min-width |
| `--ui-badge-bg` | `var(--color-text)` | Background color |
| `--ui-badge-color` | `var(--color-surface)` | Text color |
| `--ui-badge-border-color` | `transparent` | Border color |
| `--ui-badge-border-width` | `var(--border-width, 1px)` | Border width |
| `--ui-badge-border-radius` | `var(--radius-circle, 50%)` | Corner radius |
| `--ui-badge-font-size` | `0.675rem` | Font size |
| `--ui-badge-inset` | `0%` | Inset from host edges. Auto-set to `14.6%` when `host-shape="circle"` |

Override per instance or globally:

```css
ui-badge {
  --ui-badge-size: 2rem;
  --ui-badge-font-size: .8rem;
}
```

---

## Accessibility

- The web component sets `role="status"` automatically — screen readers announce badge content as a live region
- Use meaningful content (numbers, short labels) rather than decorative symbols
- For purely decorative badges, add `aria-hidden="true"`

---

## Browser Support

| Feature | Support |
|---------|---------|
| Custom elements | All modern browsers |
| `text-box: cap alphabetic` | Chrome 133+, Safari 18.2+ (graceful degradation) |
| `corner-shape: squircle` | Chrome 135+, requires CSS Backgrounds Level 4 |
| `light-dark()` | Chrome 123+, Firefox 120+, Safari 17.5+ |

Graceful degradation: without `corner-shape`, the squircle variant falls back to the default circular shape. Without `text-box`, vertical alignment may shift slightly.
