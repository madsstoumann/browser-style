# @browser.style/tooltip

A CSS-first speech-bubble tooltip drawn as a single element via `clip-path`, so backgrounds (including gradients) flow seamlessly across the bubble and arrow. Drop it as a child of any focusable element. No JavaScript required for the base experience — an optional web component wrapper provides ARIA wiring and ESC dismissal.

## Features

- Speech-bubble shape with arrow drawn via single-element `clip-path`
- Backgrounds (including **gradients**) flow seamlessly across bubble + arrow
- 12 positions: top/bottom/left/right + start/center/end variants
- Auto-flip on collision in modern browsers via CSS anchor positioning + `position-try-fallbacks`
- Semantic colors: info, success, warning, error
- Four sizes: sm, md (default), lg, **match** — `match` scales with the trigger via `cqi` units
- Multiline / wrapping variant with `--ui-tooltip-max-width`
- Inline help-text variants (`underline`, `overline`, `help`) for body copy
- Configurable open delay
- Light/dark mode support via design tokens
- RTL support via logical properties
- Works without JavaScript

---

## Install

```bash
npm install @browser.style/tooltip
```

Peer dependency:

```bash
npm install @browser.style/base
```

> `@browser.style/base` provides the design token system. The tooltip works without it — tokens fall back to neutral defaults.

---

## Usage

### CSS-only (vanilla HTML)

```html
<link rel="stylesheet" href="@browser.style/base/index.css">
<link rel="stylesheet" href="@browser.style/tooltip/index.css">
```

Or via CSS `@import`:

```css
@import '@browser.style/base';
@import '@browser.style/tooltip/style';
```

```html
<button>
  Save
  <ui-tooltip>Press ⌘S</ui-tooltip>
</button>
```

The tooltip shows on `:hover` or `:focus-visible` of its parent. The parent automatically gets `position: relative`. **No JavaScript required.**

### Web Component

Import the module to register `<ui-tooltip>`:

```js
import '@browser.style/tooltip';
```

The web component uses the **exact same** HTML structure as CSS-only. The JS only adds:
- `aria-describedby` wiring on the parent (if focusable)
- ESC key to dismiss
- Auto-generated unique `id`
- `role="tooltip"`

#### Attributes

| Attribute | Type | Description |
|-----------|------|-------------|
| `position` | string | `top` (default), `top-start`, `top-end`, `bottom`, `bottom-start`, `bottom-end`, `left`, `left-start`, `left-end`, `right`, `right-start`, `right-end` |
| `color` | string | Semantic color: `info`, `success`, `warning`, `error` |
| `size` | string | `sm`, `md` (default), `lg`, `match` |
| `variant` | string | Space-separated: `multiline`, `no-arrow`, `help`, `underline`, `overline` |
| `delay` | string | `none`, `short` (default ~100ms), `long` (~400ms) |
| `disabled` | boolean | Suppress the tooltip |
| `hidden` | boolean | Hide the tooltip (set by ESC) |

---

### React

```jsx
import '@browser.style/tooltip';
import '@browser.style/tooltip/style';

function SaveButton() {
  return (
    <button>
      Save
      <ui-tooltip color="info">Press <kbd>⌘S</kbd></ui-tooltip>
    </button>
  );
}
```

> React 19+ handles custom elements natively. For React 18, custom element attributes work in JSX but you may need `ref` for setting properties.

### Vue

```vue
<script setup>
import '@browser.style/tooltip';
import '@browser.style/tooltip/style';
</script>

<template>
  <button>
    Save
    <ui-tooltip color="info">Press ⌘S</ui-tooltip>
  </button>
</template>
```

> Tell Vue to skip custom element resolution in `vite.config.js`:
> ```js
> vue({ template: { compilerOptions: { isCustomElement: tag => tag.startsWith('ui-') } } })
> ```

### Svelte

```svelte
<script>
  import '@browser.style/tooltip';
  import '@browser.style/tooltip/style';
</script>

<button>
  Save
  <ui-tooltip>Press ⌘S</ui-tooltip>
</button>
```

### Astro / SSR

Use the CSS-only approach — no JavaScript needed:

```html
<link rel="stylesheet" href="@browser.style/base/index.css">
<link rel="stylesheet" href="@browser.style/tooltip/index.css">

<button>
  Save
  <ui-tooltip>Press ⌘S</ui-tooltip>
</button>
```

---

## Positions

Use the `position` attribute. There are 12 positions: 4 sides × 3 alignments.

```html
<ui-tooltip position="top">Top center (default)</ui-tooltip>
<ui-tooltip position="top-start">Top, aligned to start</ui-tooltip>
<ui-tooltip position="top-end">Top, aligned to end</ui-tooltip>
<ui-tooltip position="bottom">Bottom center</ui-tooltip>
<ui-tooltip position="left">Left center</ui-tooltip>
<ui-tooltip position="right">Right center</ui-tooltip>
```

In modern browsers (Chrome 125+, Safari 26+) the tooltip **automatically flips** when there isn't enough room — `top` becomes `bottom`, `left` becomes `right`. Powered by CSS anchor positioning and `position-try-fallbacks`. Older browsers keep the requested position without flipping.

## Sizes

```html
<ui-tooltip size="sm">Small tooltip</ui-tooltip>
<ui-tooltip size="md">Medium (default)</ui-tooltip>
<ui-tooltip size="lg">Large tooltip</ui-tooltip>
```

The **`match`** size scales with the trigger's container query inline-size — perfect for avatars and other variable-size triggers:

```html
<ui-avatar size="xs">
  <abbr>KC</abbr>
  <ui-tooltip size="match">Kim Cronos</ui-tooltip>
</ui-avatar>
```

A 1rem avatar gets a small tooltip; a 5rem avatar gets a proportionally larger one.

## Colors

```html
<ui-tooltip color="info">Info</ui-tooltip>
<ui-tooltip color="success">Success</ui-tooltip>
<ui-tooltip color="warning">Warning</ui-tooltip>
<ui-tooltip color="error">Error</ui-tooltip>
```

| Value | Description |
|-------|-------------|
| _(none)_ | Default — uses `--color-text` (dark in light mode, light in dark) |
| `info` | Blue |
| `success` | Green |
| `warning` | Orange |
| `error` | Red |

## Gradients

Because the bubble and arrow are drawn as **one element** via `clip-path`, gradient backgrounds flow seamlessly across both:

```html
<button>
  Premium
  <ui-tooltip style="--ui-tooltip-background: linear-gradient(135deg, hsl(260, 70%, 55%), hsl(320, 70%, 55%));">
    Pro feature
  </ui-tooltip>
</button>
```

## Variants

### `multiline` — wrapping content

By default tooltips are single-line (`white-space: nowrap`). Add `variant="multiline"` to allow wrapping, and set `--ui-tooltip-max-width` to control the max width:

```html
<ui-tooltip variant="multiline" style="--ui-tooltip-max-width: 16rem;">
  This is a longer tooltip that wraps onto multiple lines.
</ui-tooltip>
```

### `no-arrow` — plain rectangle

Removes the speech-bubble tail and uses `border-radius` instead:

```html
<ui-tooltip variant="no-arrow">No tail</ui-tooltip>
```

### `underline` / `overline` — inline help in body text

These variants style the **parent** element with a dotted text decoration and help cursor — perfect for inline help inside paragraphs:

```html
<p>
  The display uses
  <abbr>
    OLED panels
    <ui-tooltip variant="underline">Organic Light-Emitting Diode</ui-tooltip>
  </abbr>
  for true blacks.
</p>
```

The `<abbr>` becomes a dotted-underlined word with a help cursor; hovering shows the tooltip above.

### `help` — just a help cursor on the parent

Like `underline` but without any text decoration:

```html
<span>
  Highlighted phrase
  <ui-tooltip variant="help">More info on hover</ui-tooltip>
</span>
```

## Delay

```html
<ui-tooltip delay="none">Instant</ui-tooltip>
<ui-tooltip delay="short">~100ms (default)</ui-tooltip>
<ui-tooltip delay="long">~400ms</ui-tooltip>
```

---

## Customization

### Global token overrides

```css
:root {
  --color-text: hsl(220, 20%, 15%);
  --radius-sm: 0.5rem;
}
```

### Component tokens

| Token | Default | Description |
|-------|---------|-------------|
| `--ui-tooltip-background` | `var(--color-text)` | Background color (or gradient) |
| `--ui-tooltip-color` | `var(--color-surface)` | Text color |
| `--ui-tooltip-font-family` | `var(--font-body, …)` | Font family |
| `--ui-tooltip-font-size` | `var(--font-size-xs, 0.75rem)` | Font size (also drives padding via em) |
| `--ui-tooltip-font-weight` | `var(--font-weight-normal, 400)` | Font weight |
| `--ui-tooltip-line-height` | `var(--line-height-tight, 1.1)` | Line height |
| `--ui-tooltip-padding-block` | `0.4em` | Vertical padding (em-based) |
| `--ui-tooltip-padding-inline` | `0.75em` | Horizontal padding (em-based) |
| `--ui-tooltip-arrow-base` | `1em` | Arrow base width |
| `--ui-tooltip-arrow-height` | `0.4em` | Arrow protrusion depth |
| `--ui-tooltip-arrow-position` | `50%` | Position of the arrow along its edge |
| `--ui-tooltip-offset` | `0.125em` | Gap between trigger and tooltip |
| `--ui-tooltip-max-width` | `var(--width-xs, 20rem)` | Max width when `multiline` |
| `--ui-tooltip-open-delay` | `100ms` | Open delay |
| `--ui-tooltip-z-index` | `var(--z-index-3, 100)` | Stacking order |
| `--ui-tooltip-opacity` | `0.95` | Open-state opacity |

> Padding and arrow size are em-based, so changing `--ui-tooltip-font-size` (or setting `size="sm/md/lg/match"`) scales the whole tooltip proportionally.

---

## Accessibility

- The web component sets `role="tooltip"` and wires `aria-describedby` from the parent (if focusable) to the tooltip's auto-generated ID
- Tooltip text is announced by screen readers when the parent element receives focus
- ESC dismisses the currently-open tooltip
- Hover and focus-visible both trigger the tooltip — no mouse-only behavior
- Tooltips have `pointer-events: none` so they don't block clicks on elements behind them
- For purely decorative tooltips, the parent doesn't need to be focusable; the tooltip remains hover-only

---

## Browser Support

| Feature | Support |
|---------|---------|
| Custom elements | All modern browsers |
| `clip-path: polygon()` | All modern browsers |
| `:has()` (parent selector) | Chrome 105+, Safari 15.4+, Firefox 121+ |
| `light-dark()` | Chrome 123+, Firefox 120+, Safari 17.5+ |
| `position-try-fallbacks` (auto-flip) | Chrome 125+, Safari 26+ |
| `text-box: cap alphabetic` | Chrome 133+, Safari 18.2+ |

Graceful degradation: without `position-try-fallbacks`, the tooltip stays in its requested position without auto-flipping. Without `:has()`, the inline help-text variants (`underline`/`overline`/`help`) lose the parent-affecting cursor and text-decoration but the tooltip itself still works.
