# @browser.style/avatar

A CSS-first avatar component with random per-element colors, status indicators, activity rings, and flexible group layouts. No JavaScript required for the base experience — an optional web component wrapper provides framework-friendly overflow handling.

## Features

- Pure CSS color generation using `random(per-element)` and `contrast-color()`
- Shape variants: circle (default), square, squircle (`corner-shape`)
- Status indicators: online, offline, busy, away
- Activity ring with customizable color
- Group layouts: stack (overlapping), spread
- Overflow counting: CSS-only via `max` attribute, or framework-rendered via `overflow` attribute
- Light/dark mode support via `light-dark()`
- RTL support via logical properties
- Focus-visible and hover interactions
- Works without JavaScript (CSS-only mode)

---

## Install

```bash
npm install @browser.style/avatar
```

Peer dependency:

```bash
npm install @browser.style/base
```

> `@browser.style/base` provides the design token system (colors, spacing, radii, etc.).
> The avatar works without it — tokens fall back to neutral defaults — but you'll want it for a complete design.

---

## Usage

### CSS-only (vanilla HTML)

Import the styles, then write native HTML. No JavaScript needed.

```html
<link rel="stylesheet" href="@browser.style/base/index.css">
<link rel="stylesheet" href="@browser.style/avatar/index.css">
```

Or via CSS `@import`:

```css
@import '@browser.style/base';
@import '@browser.style/avatar/style';
```

```html
<!-- Avatar with image and initials fallback -->
<ui-avatar>
  <abbr title="Kim Cronos">KC</abbr>
  <img src="avatar.webp" alt="Kim Cronos">
</ui-avatar>

<!-- Initials only — gets a random background color -->
<ui-avatar>
  <abbr title="Kim Cronos">KC</abbr>
</ui-avatar>
```

The `<abbr>` provides initials with a full-name tooltip. The `<img>` overlays it — if the image loads, it covers the initials; if it fails, the initials show through.

---

### Web Component

Import the module to register `<ui-avatar>` and `<ui-avatar-group>`:

```js
import '@browser.style/avatar';
```

```html
<ui-avatar>
  <abbr title="Kim Cronos">KC</abbr>
  <img src="avatar.webp" alt="Kim Cronos">
</ui-avatar>

<ui-avatar-group>
  <ui-avatar tooltip="Kim Cronos">
    <img src="a1.webp" alt="Kim Cronos">
  </ui-avatar>
  <ui-avatar tooltip="Greg Hanson">
    <img src="a2.webp" alt="Greg Hanson">
  </ui-avatar>
  <ui-avatar tooltip="John Doe">
    <img src="a3.webp" alt="John Doe">
  </ui-avatar>
</ui-avatar-group>
```

The web component uses the **exact same** HTML structure as CSS-only. It's a convenience wrapper for framework integration, not a replacement — the CSS is identical in both modes.

#### Attributes

**`<ui-avatar>`**

| Attribute | Type | Description |
|-----------|------|-------------|
| `size` | string | Predefined size: `xs`, `sm`, `md`, `lg` (default), `xl`, `2xl` |
| `variant` | string | Shape variant: `square`, `squircle` (default: circle) |
| `status` | string | Status indicator: `online`, `offline`, `busy`, `away` |
| `ring` | color \| boolean | Activity ring. Empty = accent color, or provide a CSS color value |
| `tooltip` | string | Tooltip text (uses `ui-tooltip` styles) |
| `overflow` | boolean | Marks this avatar as the overflow counter element (see [Overflow](#overflow)) |

**`<ui-avatar-group>`**

| Attribute | Type | Description |
|-----------|------|-------------|
| `max` | number | CSS-only: limits visible avatars, hides the rest, shows a `+N` counter |
| `variant` | string | `spread` for evenly spaced layout (default: stacked/overlapping) |
| `dir` | string | `rtl` for right-to-left layout |

---

### React

```jsx
import '@browser.style/avatar';
import '@browser.style/avatar/style';

function TeamAvatars({ members, max = 3 }) {
  const visible = members.slice(0, max);
  const overflow = members.length - max;

  return (
    <ui-avatar-group>
      {visible.map(m => (
        <ui-avatar key={m.id} tooltip={m.name}>
          <img src={m.avatar} alt={m.name} />
        </ui-avatar>
      ))}
      {overflow > 0 && (
        <ui-avatar overflow><abbr>+{overflow}</abbr></ui-avatar>
      )}
    </ui-avatar-group>
  );
}
```

> React 19+ handles custom elements natively. For React 18, custom element attributes work in JSX but you may need `ref` for setting properties.

**With Next.js `<Image>`** — use any image component as the child:

```jsx
import Image from 'next/image';

<ui-avatar>
  <abbr title={user.name}>{user.initials}</abbr>
  <Image src={user.avatar} alt={user.name} width={64} height={64} />
</ui-avatar>
```

---

### Vue

```vue
<script setup>
import '@browser.style/avatar';
import '@browser.style/avatar/style';

const props = defineProps({ members: Array, max: { type: Number, default: 3 } });
const visible = computed(() => props.members.slice(0, props.max));
const overflow = computed(() => props.members.length - props.max);
</script>

<template>
  <ui-avatar-group>
    <ui-avatar v-for="user in visible" :key="user.id" :tooltip="user.name">
      <img :src="user.avatar" :alt="user.name">
    </ui-avatar>
    <ui-avatar v-if="overflow > 0" overflow>
      <abbr>+{{ overflow }}</abbr>
    </ui-avatar>
  </ui-avatar-group>
</template>
```

> Tell Vue to skip custom element resolution in `vite.config.js`:
> ```js
> vue({ template: { compilerOptions: { isCustomElement: tag => tag.startsWith('ui-') } } })
> ```

**With Nuxt `<NuxtImg>`**:

```vue
<ui-avatar>
  <abbr :title="user.name">{{ user.initials }}</abbr>
  <NuxtImg :src="user.avatar" :alt="user.name" width="64" height="64" />
</ui-avatar>
```

---

### Svelte

```svelte
<script>
  import '@browser.style/avatar';
  import '@browser.style/avatar/style';

  let { members, max = 3 } = $props();
  let visible = $derived(members.slice(0, max));
  let overflow = $derived(members.length - max);
</script>

<ui-avatar-group>
  {#each visible as user (user.id)}
    <ui-avatar tooltip={user.name}>
      <img src={user.avatar} alt={user.name}>
    </ui-avatar>
  {/each}
  {#if overflow > 0}
    <ui-avatar overflow><abbr>+{overflow}</abbr></ui-avatar>
  {/if}
</ui-avatar-group>
```

---

### Astro / Server-rendered HTML

Use the CSS-only approach:

```html
<link rel="stylesheet" href="@browser.style/base/index.css">
<link rel="stylesheet" href="@browser.style/avatar/index.css">

<ui-avatar>
  <abbr title="Kim Cronos">KC</abbr>
  <img src="avatar.webp" alt="Kim Cronos">
</ui-avatar>
```

For overflow, render the counter server-side — no client JS needed:

```astro
---
const visible = members.slice(0, 3);
const overflow = members.length - 3;
---

<ui-avatar-group>
  {visible.map(m => (
    <ui-avatar>
      <img src={m.avatar} alt={m.name}>
    </ui-avatar>
  ))}
  {overflow > 0 && (
    <ui-avatar overflow><abbr>+{overflow}</abbr></ui-avatar>
  )}
</ui-avatar-group>
```

---

## Sizes

Use the `size` attribute: `xs`, `sm`, `md`, `lg` (default), `xl`, `2xl`.

```html
<ui-avatar size="xs"><abbr title="Anna Berg">AB</abbr></ui-avatar>
<ui-avatar size="sm"><abbr title="Kim Cronos">KC</abbr></ui-avatar>
<ui-avatar size="2xl">
  <abbr title="Kim Cronos">KC</abbr>
  <img src="avatar.webp" alt="Kim Cronos">
</ui-avatar>
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

The squircle variant uses `corners: 50% superellipse(2)`. Browsers without support fall back to standard rounded corners.

### Group variants

```html
<!-- Stack: overlapping (default) -->
<ui-avatar-group>...</ui-avatar-group>

<!-- Spread: evenly spaced row -->
<ui-avatar-group variant="spread">...</ui-avatar-group>
```

## Status

Add a status indicator dot to any avatar (except `size="xs"`):

```html
<ui-avatar status="online">...</ui-avatar>
<ui-avatar status="away">...</ui-avatar>
<ui-avatar status="busy">...</ui-avatar>
<ui-avatar status="offline">...</ui-avatar>
```

## Ring

Add an activity ring around an avatar. Empty attribute uses the accent color, or provide a CSS color:

```html
<ui-avatar ring>...</ui-avatar>
<ui-avatar ring="hsl(136, 41%, 41%)">...</ui-avatar>
```

## Overflow

There are two approaches to overflow counting:

### CSS-only (`max` attribute)

Set `max` on the group. CSS uses `sibling-count()` and `sibling-index()` to hide excess avatars and display a `+N` counter via a pseudo-element. All avatars are in the DOM.

```html
<ui-avatar-group max="3">
  <ui-avatar><img src="a1.webp" alt="User 1"></ui-avatar>
  <ui-avatar><img src="a2.webp" alt="User 2"></ui-avatar>
  <ui-avatar><img src="a3.webp" alt="User 3"></ui-avatar>
  <ui-avatar><img src="a4.webp" alt="User 4"></ui-avatar>
  <ui-avatar><img src="a5.webp" alt="User 5"></ui-avatar>
  <ui-avatar><img src="a6.webp" alt="User 6"></ui-avatar>
  <ui-avatar><img src="a7.webp" alt="User 7"></ui-avatar>
</ui-avatar-group>
```

### Framework-rendered (`overflow` attribute)

In frameworks, render only the visible avatars and add a `<ui-avatar overflow>` element with the count. No `max` attribute needed — the framework controls the loop. This is more efficient as hidden avatars are never rendered.

```html
<ui-avatar-group>
  <ui-avatar><img src="a1.webp" alt="User 1"></ui-avatar>
  <ui-avatar><img src="a2.webp" alt="User 2"></ui-avatar>
  <ui-avatar><img src="a3.webp" alt="User 3"></ui-avatar>
  <ui-avatar overflow><abbr>+4</abbr></ui-avatar>
</ui-avatar-group>
```

The `overflow` attribute applies a neutral background and muted text color, matching the CSS-only counter appearance.

---

## Customization

### Global token overrides

```css
:root {
  --color-border: hsl(220, 20%, 70%);
  --border-width-thick: 3px;
  --radius-circle: 50%;
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
| `--ui-avatar-ring-offset` | `2px` | Ring gap from avatar edge |
| `--ui-avatar-ring-width` | `2px` | Ring stroke width |
| `--ui-avatar-status-size` | `20cqi` | Status indicator size |
| `--ui-avatar-status-border-width` | `3cqi` | Status indicator border |
| `--ui-avatar-status-inset` | `2cqi` | Status indicator position |

### Example: custom size and colors

```css
.team-section {
  --ui-avatar-size: 6em;
  --ui-avatar-border-width: 3px;
  --ui-avatar-background: var(--color-accent);
}
```

---

## Accessibility

- Uses `<abbr>` with `title` attribute for initials — provides full name on hover
- `tabindex="0"` can be added for keyboard navigation in groups
- Focus ring uses `--ring-width`, `--ring-color`, and `--ring-offset` tokens
- Images should always include meaningful `alt` text
- `<ui-avatar-group>` can be given `role="group"` and `aria-label` for screen readers

---

## Browser Support

| Feature | Support |
|---------|---------|
| Custom elements | All modern browsers |
| `random(per-element)` | Chrome 138+, requires CSS Values Level 5 |
| `contrast-color()` | Chrome 138+, requires CSS Color Level 5 |
| `corner-shape: squircle` | Chrome 135+, requires CSS Backgrounds Level 4 |
| `sibling-count()` / `sibling-index()` | Chrome 133+, Safari 18.4+ |
| `light-dark()` | Chrome 123+, Firefox 120+, Safari 17.5+ |
| Container query units (`cqi`) | Chrome 105+, Firefox 110+, Safari 16+ |

Graceful degradation: without `random()`, avatars use the fallback `--ui-avatar-background` value. Without `corner-shape`, squircle falls back to `border-radius: 25%`. Without `contrast-color()`, set `--ui-avatar-color` explicitly. Without `sibling-count()`, use the framework-rendered `overflow` approach instead of `max`.
