# Button

CSS-first button styles with variant modifiers, color utilities, and proportional sizing via `ch` units.

## Features

- Styles native `<button>` and `<a class="ui-button">` elements
- Variants via `data-variant` attribute: `icon`, `outline`, `rounded`, `light`, `text`, `toggle`, `transparent`
- Icon-font glyph via `data-icon` (before the text) + `data-icon-at="end"` (after) — see § Icons
- Semantic colors via `bg-*` utility classes
- Proportional sizing — padding and gap scale with `font-size` (uses `ch` units)
- Submit buttons auto-styled with accent color
- Light/dark mode support via `light-dark()`
- Focus ring using `--ring-*` tokens

## Install

Button styles are included in the base package:

```bash
npm install @browser.style/base
```

## Usage: CSS-only

```html
<link rel="stylesheet" href="@browser.style/base/index.css">

<!-- Default button -->
<button type="button">Button</button>

<!-- Submit (accent-colored by default) -->
<button type="submit">Submit</button>

<!-- Disabled -->
<button type="button" disabled>Disabled</button>

<!-- With variants -->
<button type="button" data-variant="rounded">Rounded</button>
<button type="button" data-variant="outline">Outline</button>
<button type="button" data-variant="rounded outline">Rounded Outline</button>

<!-- With color -->
<button type="button" class="bg-accent" data-variant="rounded">Accent</button>

<!-- Light color variant -->
<button type="button" class="bg-accent" data-variant="light rounded">Light Accent</button>

<!-- Icon button -->
<button type="button" class="bg-accent" data-variant="icon">
  <ui-icon type="plus"></ui-icon>
</button>

<!-- Button with icon and text -->
<button type="button" class="bg-accent" data-variant="rounded">
  Add to order<ui-icon type="plus"></ui-icon>
</button>
```

## Usage: As link or other element

Any element can be styled as a button using the `.ui-button` class:

```html
<a href="/action" class="ui-button bg-accent" data-variant="rounded">Link Button</a>
<label class="ui-button" data-variant="icon">
  <input type="checkbox" hidden>
  <ui-icon type="heart"></ui-icon>
</label>
```

## Usage: React

```jsx
import '@browser.style/base/index.css';

function ActionButton({ children, color, variant, ...props }) {
  return (
    <button
      className={color ? `bg-${color}` : undefined}
      data-variant={variant}
      {...props}
    >
      {children}
    </button>
  );
}

// Usage
<ActionButton color="accent" variant="rounded outline">Save</ActionButton>
```

## Usage: Vue

```vue
<template>
  <button
    :class="color ? `bg-${color}` : undefined"
    :data-variant="variant"
  >
    <slot />
  </button>
</template>

<script setup>
import '@browser.style/base/index.css';
defineProps(['color', 'variant']);
</script>
```

## Usage: Svelte

```svelte
<script>
  import '@browser.style/base/index.css';
  export let color = '';
  export let variant = '';
</script>

<button
  class:bg-accent={color === 'accent'}
  class:bg-success={color === 'success'}
  data-variant={variant || undefined}
>
  <slot />
</button>
```

## Usage: Astro / Server

```astro
---
import '@browser.style/base/index.css';
const { color, variant, ...props } = Astro.props;
---

<button
  class={color ? `bg-${color}` : undefined}
  data-variant={variant}
  {...props}
>
  <slot />
</button>
```

## Icons

With `@browser.style/icon`'s font sheet loaded, `data-icon` puts a glyph on the button —
before the text by default, after it with `data-icon-at="end"` (a chevron's place). The
glyph is a `::before`/`::after` grid item, spaced by the button's own `gap`, sized by
`--button-icon-fs` (1.25em), and rendered as `content: var(--icon) / ""` so it never
enters the accessible name. The name is the closed catalogue in `ui/icon/icons.json`.
The glyph is nudged up `0.17em` (`translate`) to undo the baseline shift the icon build bakes
into every outline for `::marker` use — measured: without it the icon sits 3 px low in a
centred button, and `text-box: cap alphabetic` cannot fix it (it trims by font metrics, the
shift is in the outlines).

```html
<a class="ui-button" data-icon="shopping-cart" href="/cart">Add to cart</a>
<a class="ui-button" data-icon="chevron-right" data-icon-at="end" href="/more">Read more</a>
```

## Variants

Variants are set via the `data-variant` attribute with space-separated values:

```html
<!-- Single variant -->
<button data-variant="rounded">Rounded</button>

<!-- Multiple variants -->
<button data-variant="rounded outline">Rounded Outline</button>
```

### Available variants

| Variant | Description |
|---------|-------------|
| `icon` | Square button with circular border-radius for icon-only buttons |
| `outline` | Transparent background with `currentColor` border on rest state |
| `rounded` | Pill-shaped border-radius |
| `text` | Transparent background, text color only |
| `toggle` | Zero padding (for toggle-style buttons wrapping inputs) |
| `transparent` | Transparent background |
| `end` | Align button to grid end |
| `start` | Align button to grid start |

### Colors

Colors use the `bg-*` utility classes from `utility.css`:

```html
<button class="bg-accent" data-variant="rounded">Accent</button>
<button class="bg-success" data-variant="rounded">Success</button>
<button class="bg-warning" data-variant="rounded">Warning</button>
<button class="bg-error" data-variant="rounded">Error</button>
<button class="bg-info" data-variant="rounded">Info</button>
<button class="bg-black" data-variant="rounded">Black</button>
<button class="bg-gray" data-variant="rounded">Gray</button>
```

The `light` variant creates a tinted background from the `bg-*` color:

```html
<button class="bg-accent" data-variant="light rounded">Light Accent</button>
```

The `outline` variant on `bg-accent` and `bg-black` inverts to a bordered style:

```html
<button class="bg-accent" data-variant="rounded outline">Accent Outline</button>
```

### Disabled state

Use the native `disabled` attribute or `data-variant="disabled"` for visual-only disable styling:

```html
<button disabled>Natively disabled</button>
<button data-variant="disabled">Visually disabled</button>
<button class="bg-accent" data-variant="rounded disabled">Disabled with other variants</button>
```

### Sizing

Buttons scale proportionally with `font-size` because padding and gap use `ch` units. Use font-size utilities to change size:

```html
<button class="fs-xs" data-variant="rounded">Small</button>
<button data-variant="rounded">Default</button>
<button class="fs-lg" data-variant="rounded">Large</button>
<button class="fs-xl" data-variant="rounded">Extra Large</button>
```

Or set font-size on a parent to scale all buttons uniformly:

```css
.toolbar { font-size: small; }
```

## Customization

### Component tokens

| Token | Default | Description |
|-------|---------|-------------|
| `--button-bg` | `var(--color-button, hsl(0, 0%, 90%))` | Background color |
| `--button-c` | `inherit` | Text color |
| `--button-p` | `1ch 2ch` | Padding |
| `--button-bdc` | `transparent` | Border color |
| `--button-bg--hover` | color-mix with `--color-text` | Hover background |
| `--button-c--hover` | `inherit` | Hover text color |
| `--button-bxsh--hover` | color-mix shadow | Hover box-shadow |

### Example: custom button

```css
.my-button {
  --button-bg: hsl(260, 60%, 50%);
  --button-c: white;
  --button-p: 0.75ch 2ch;
}
```

## Accessibility

- Native `<button>` semantics — no ARIA needed
- Focus ring uses `--ring-width`, `--ring-color`, and `--ring-offset` tokens
- Disabled buttons use `cursor: not-allowed` and reduced opacity
- `user-select: none` prevents text selection during click
- Icon-only buttons should include visually hidden text or `aria-label`

## Browser Support

| Feature | Support |
|---------|---------|
| `color-mix()` | Chrome 111+, Firefox 113+, Safari 16.2+ |
| `light-dark()` | Chrome 123+, Firefox 120+, Safari 17.5+ |
| `:focus-visible` | All modern browsers |
| `data-variant` attribute selectors | All browsers |
| Nesting (`&`) | Chrome 120+, Firefox 117+, Safari 17.2+ |
