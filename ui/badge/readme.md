# @browser.style/badge

A CSS-first badge component for status indicators and notification counts. Works as a plain CSS class or as a `<ui-badge>` custom element with variant attributes.

## Features

- Pure CSS — works without JavaScript
- Absolute positioning with automatic parent `position: relative`
- Variants: `inline`, `text`, `bottom-right`, `top-right`
- RTL support via `:dir(rtl)`
- Light/dark mode via design tokens
- Optional `<ui-badge>` web component with `variant` attribute
- Works standalone or with `@browser.style/base` for full theming

---

## Install

```bash
npm install @browser.style/badge
```

Peer dependency:

```bash
npm install @browser.style/base
```

> `@browser.style/base` provides the design token system (colors, spacing, radii). The badge works without it — tokens fall back to neutral defaults.

---

## Usage

### CSS-only (vanilla HTML)

```html
<link rel="stylesheet" href="@browser.style/base/core.css">
<link rel="stylesheet" href="@browser.style/badge/index.css">
```

Or via CSS `@import`:

```css
@import '@browser.style/base';
@import '@browser.style/badge/style';
```

Use any inline element with the `ui-badge` class:

```html
<button type="button">
  Notifications
  <b class="ui-badge">5</b>
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
  <ui-badge>5</ui-badge>
</button>
```

Use the `variant` attribute instead of modifier classes:

```html
<ui-badge variant="inline">4</ui-badge>
<ui-badge variant="text">new</ui-badge>
<ui-badge variant="bottom-right">👍</ui-badge>
```

Variants can be combined:

```html
<ui-badge variant="inline text">new</ui-badge>
```

The web component automatically sets `role="status"` for accessibility.

#### Attributes

| Attribute | Type | Description |
|-----------|------|-------------|
| `variant` | string | Space-separated variants: `"inline"`, `"text"`, `"bottom-right"`, `"top-right"` |

---

### React

```jsx
import '@browser.style/badge';
import '@browser.style/badge/style';

function NotificationButton() {
  return (
    <button type="button">
      Notifications
      <ui-badge>5</ui-badge>
    </button>
  );
}
```

Or CSS-only:

```jsx
import '@browser.style/badge/style';

function NotificationButton() {
  return (
    <button type="button">
      Notifications
      <b className="ui-badge">5</b>
    </button>
  );
}
```

---

### Vue

```vue
<script setup>
import '@browser.style/badge';
import '@browser.style/badge/style';
</script>

<template>
  <button type="button">
    Notifications
    <ui-badge variant="inline">5</ui-badge>
  </button>
</template>
```

> Tell Vue to skip custom element resolution:
> ```js
> vue({ template: { compilerOptions: { isCustomElement: tag => tag.startsWith('ui-') } } })
> ```

---

### Svelte

```svelte
<script>
  import '@browser.style/badge';
  import '@browser.style/badge/style';
</script>

<button type="button">
  Notifications
  <ui-badge>5</ui-badge>
</button>
```

---

### Astro / Server-rendered HTML

```html
<link rel="stylesheet" href="@browser.style/base/core.css">
<link rel="stylesheet" href="@browser.style/badge/index.css">

<button type="button">
  Notifications
  <ui-badge>5</ui-badge>
</button>
```

The `<ui-badge>` element works as a structural element even without JavaScript — all styling is CSS-driven.

---

## Variants

### Default (top-right overlay)

```html
<div class="ui-avatar">
  <img src="avatar.jpg" alt="User">
  <ui-badge>3</ui-badge>
</div>
```

### Inline (`variant="inline"`)

Flows inline with text, no absolute positioning:

```html
<span class="ui-chip">Messages <ui-badge variant="inline">4</ui-badge></span>
```

### Text (`variant="text"`)

Pill-shaped badge for text labels:

```html
<span class="ui-chip">Status <ui-badge variant="text">new</ui-badge></span>
```

### Bottom-right (`variant="bottom-right"`)

Positions at the bottom-right corner:

```html
<div class="ui-avatar">
  <img src="avatar.jpg" alt="User">
  <ui-badge variant="bottom-right">👍</ui-badge>
</div>
```

### Top-right (`variant="top-right"`)

Positions at top-right without the default translate offset:

```html
<div class="ui-avatar">
  <img src="avatar.jpg" alt="User">
  <ui-badge variant="top-right">99</ui-badge>
</div>
```

---

## Customization

### Design tokens

Override global tokens to theme all badges:

```css
:root {
  --color-text: navy;
  --color-surface: white;
}
```

### Component tokens

Override badge-specific tokens:

```css
.ui-badge, ui-badge {
  --ui-badge-bg: crimson;
  --ui-badge-color: white;
  --ui-badge-size: 2rem;
  --ui-badge-font-size: .8rem;
}
```

### All component tokens

| Token | Default | Description |
|-------|---------|-------------|
| `--ui-badge-size` | `1.5rem` | Badge height and min-width |
| `--ui-badge-bg` | `var(--color-text, hsl(0,0%,15%))` | Background color |
| `--ui-badge-color` | `var(--color-surface, hsl(0,0%,100%))` | Text color |
| `--ui-badge-border-color` | `transparent` | Border color |
| `--ui-badge-border-radius` | `var(--radius-circle, 50%)` | Corner radius |
| `--ui-badge-font-size` | `.675rem` | Font size |

### Coloring with utility classes

Combine with `bg-*` utility classes from `@browser.style/base`:

```html
<ui-badge class="bg-success">3</ui-badge>
<ui-badge class="bg-error">!</ui-badge>
<ui-badge class="bg-warning" variant="inline">4</ui-badge>
```

---

## Accessibility

- Web component sets `role="status"` automatically — screen readers announce badge content as a live region
- Use meaningful content (numbers, short labels) rather than decorative symbols
- For purely decorative badges, add `aria-hidden="true"`
- Color alone should not convey meaning — pair with text or icons

---

## Browser support

- All modern browsers (Chrome, Firefox, Safari, Edge)
- `text-box: cap alphabetic`: Chrome 133+, Safari 18.2+ (graceful degradation: slightly different vertical alignment)
- `:dir(rtl)`: Chrome 120+, Firefox 49+, Safari 16.4+
