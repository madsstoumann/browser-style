# @browser.style/accordion

A CSS-first accordion component built on native `<details>` and `<summary>` elements. No JavaScript required for the base experience — an optional web component wrapper provides a declarative API for framework integration.

## Features

- Native `<details>`/`<summary>` — accessible, keyboard-navigable, works without JS
- Exclusive open behavior via the HTML `name` attribute (no JS needed)
- Smooth open/close transitions via `::details-content`
- Light/dark mode support via design tokens
- Variants: default, `--item` (card-style), `--no-border`
- Optional `<ui-accordion>` / `<ui-accordion-item>` web components for framework use
- Works standalone or with `@browser.style/base` for full theming

---

## Install

```bash
npm install @browser.style/accordion
```

Peer dependencies:

```bash
npm install @browser.style/base @browser.style/icon
```

> `@browser.style/base` provides the design token system (colors, spacing, radii, etc.).
> `@browser.style/icon` provides the animated open/close indicators.
> The accordion works without these — tokens fall back to neutral defaults — but you'll want them for a complete design.

---

## Usage

### CSS-only (vanilla HTML)

Import the styles, then write native HTML. No JavaScript needed.

```html
<link rel="stylesheet" href="@browser.style/base/core.css">
<link rel="stylesheet" href="@browser.style/accordion/index.css">
```

Or via CSS `@import`:

```css
@import '@browser.style/base';
@import '@browser.style/accordion/style';
```

Then use native `<details>` elements:

```html
<details class="ui-accordion" name="faq">
  <summary>How do I reset my password?</summary>
  <div>
    <p>Go to the login page and click "Forgot Password".</p>
  </div>
</details>

<details class="ui-accordion" name="faq">
  <summary>What payment methods do you accept?</summary>
  <div>
    <p>We accept Visa, Mastercard, PayPal, and Apple Pay.</p>
  </div>
</details>
```

The `name` attribute groups items — only one can be open at a time (native browser behavior, no JS).

To add an animated icon indicator:

```html
<details class="ui-accordion" name="faq">
  <summary>Question?<ui-icon type="plus-minus"></ui-icon></summary>
  <div>Answer.</div>
</details>
```

> **Note**: `<ui-icon>` is a web component from `@browser.style/icon`. If you prefer CSS-only, you can omit it or use your own icon solution.

---

### Web Component

Import the module to register `<ui-accordion>` and `<ui-accordion-item>`:

```js
import '@browser.style/accordion';
```

```html
<ui-accordion name="faq">
  <ui-accordion-item label="How do I reset my password?">
    <p>Go to the login page and click "Forgot Password".</p>
  </ui-accordion-item>
  <ui-accordion-item label="What payment methods do you accept?" open>
    <p>We accept Visa, Mastercard, PayPal, and Apple Pay.</p>
  </ui-accordion-item>
</ui-accordion>
```

The web component renders the **exact same** native `<details>` + `<summary>` HTML into the light DOM. It's a convenience wrapper, not a replacement.

#### Attributes

**`<ui-accordion>`**

| Attribute | Description |
|-----------|-------------|
| `name` | Groups items for exclusive open behavior (maps to `<details name>`) |
| `variant` | Applies a variant to all child items (e.g. `"item"`) |

**`<ui-accordion-item>`**

| Attribute | Description |
|-----------|-------------|
| `label` | The summary/heading text (required) |
| `open` | Opens this item by default |
| `icon` | Icon type for the indicator (default: `"plus-minus"`) |
| `variant` | Per-item variant override (e.g. `"item"`, `"no-border"`) |

---

### React

```jsx
// Import the web component (registers custom elements)
import '@browser.style/accordion';

// Import styles — your bundler handles CSS
import '@browser.style/base';
import '@browser.style/accordion/style';

function FAQ() {
  return (
    <ui-accordion name="faq">
      <ui-accordion-item label="How do I reset my password?">
        <p>Go to the login page and click "Forgot Password".</p>
      </ui-accordion-item>
      <ui-accordion-item label="What payment methods do you accept?">
        <p>We accept Visa, Mastercard, PayPal, and Apple Pay.</p>
      </ui-accordion-item>
    </ui-accordion>
  );
}
```

> React 19+ handles custom elements natively. For React 18, custom element attributes work in JSX but you may need `ref` for setting properties.

Or use the **CSS-only approach** in React — just write the HTML:

```jsx
import '@browser.style/base';
import '@browser.style/accordion/style';

function FAQ() {
  return (
    <details className="ui-accordion" name="faq">
      <summary>How do I reset my password?</summary>
      <div>
        <p>Go to the login page and click "Forgot Password".</p>
      </div>
    </details>
  );
}
```

---

### Vue

```vue
<script setup>
import '@browser.style/accordion';
import '@browser.style/base';
import '@browser.style/accordion/style';
</script>

<template>
  <ui-accordion name="faq">
    <ui-accordion-item label="How do I reset my password?">
      <p>Go to the login page and click "Forgot Password".</p>
    </ui-accordion-item>
    <ui-accordion-item label="What payment methods do you accept?">
      <p>We accept Visa, Mastercard, PayPal, and Apple Pay.</p>
    </ui-accordion-item>
  </ui-accordion>
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
  import '@browser.style/accordion';
  import '@browser.style/base';
  import '@browser.style/accordion/style';
</script>

<ui-accordion name="faq">
  <ui-accordion-item label="How do I reset my password?">
    <p>Go to the login page and click "Forgot Password".</p>
  </ui-accordion-item>
  <ui-accordion-item label="What payment methods do you accept?">
    <p>We accept Visa, Mastercard, PayPal, and Apple Pay.</p>
  </ui-accordion-item>
</ui-accordion>
```

> Svelte handles custom elements natively. No extra config needed.

---

### Astro / Server-rendered HTML

Astro, PHP, Rails, Django, or any server framework — use the CSS-only approach:

```html
---
// Astro example
import '@browser.style/base';
import '@browser.style/accordion/style';
---

<details class="ui-accordion" name="faq">
  <summary>How do I reset my password?</summary>
  <div><p>Click "Forgot Password" on the login page.</p></div>
</details>
```

Add the web component script only if you want the declarative API:

```html
<script type="module">
  import '@browser.style/accordion';
</script>
```

---

## Variants

### Default

```html
<details class="ui-accordion" name="group">
  <summary>Title</summary>
  <div>Content</div>
</details>
```

### Card style (`--item`)

Adds shadow, border radius, spacing, and removes the border:

```html
<details class="ui-accordion --item" name="group">
  <summary>Title</summary>
  <div>Content</div>
</details>
```

Web component:

```html
<ui-accordion name="group" variant="item">
  <ui-accordion-item label="Title">Content</ui-accordion-item>
</ui-accordion>
```

### No border (`--no-border`)

```html
<details class="ui-accordion --no-border">
  <summary>Title</summary>
  <div>Content</div>
</details>
```

---

## Customization

### Design tokens

Override global tokens to theme all accordions:

```css
:root {
  --color-border: #a8dadc;
  --color-field: #f1faee;
  --duration-slow: 500ms;
}
```

### Component tokens

Override accordion-specific tokens for targeted changes:

```css
.ui-accordion {
  --ui-accordion-border-color: #e63946;
  --ui-accordion-border-width: 2px;
  --ui-accordion-padding-block: 2ch;
  --ui-accordion-duration: 500ms;
}
```

### All component tokens

| Token | Default | Description |
|-------|---------|-------------|
| `--ui-accordion-border-style` | `solid` | Border line style |
| `--ui-accordion-border-width` | `var(--input-border-width, 1px)` | Border width |
| `--ui-accordion-border-color` | `var(--color-border, hsl(0,0%,80%))` | Border color |
| `--ui-accordion-border-radius` | `0` | Corner radius |
| `--ui-accordion-bg-hover` | gradient using `--color-field` | Summary hover background |
| `--ui-accordion-gap` | `var(--spacing-xl, 2rem)` | Media layout column gap |
| `--ui-accordion-shadow` | `none` | Box shadow |
| `--ui-accordion-margin-end` | `0` | Bottom margin |
| `--ui-accordion-padding-block` | `1.5ch` | Vertical padding |
| `--ui-accordion-padding-inline` | `0` | Horizontal padding |
| `--ui-accordion-duration` | `var(--duration-slow, .3s)` | Open/close animation speed |
| `--ui-accordion-media-duration` | `.6s` | Media image transition speed |

---

## Grouping

### Exclusive open (accordion behavior)

Use the `name` attribute — native HTML, no JS:

```html
<details class="ui-accordion" name="faq">...</details>
<details class="ui-accordion" name="faq">...</details>
<details class="ui-accordion" name="faq">...</details>
```

### No-collapse group

Wrap in `.ui-accordion-group.--no-collapse` to keep one item always open:

```html
<div class="ui-accordion-group --no-collapse">
  <details class="ui-accordion" name="always-one" open>...</details>
  <details class="ui-accordion" name="always-one">...</details>
</div>
```

### Media layout

At wider viewports, shows content beside a media panel:

```html
<div class="ui-accordion-media">
  <div class="ui-accordion-group">
    <details class="ui-accordion" name="media" open>
      <summary>Title</summary>
      <div>
        <p>Description text</p>
        <img src="photo.jpg" alt="Photo">
      </div>
    </details>
  </div>
</div>
```

---

## Accessibility

- Built on native `<details>`/`<summary>` — screen readers announce expand/collapse state automatically
- Keyboard accessible: `Enter`/`Space` toggles, `Tab` navigates between items
- No ARIA attributes needed — the browser handles semantics natively
- Works with JavaScript disabled (CSS-only mode)

---

## Browser support

- All modern browsers (Chrome, Firefox, Safari, Edge)
- `name` attribute for exclusive behavior: Chrome 120+, Safari 17.2+, Firefox 130+
- `::details-content` transitions: Chrome 131+, Safari 18.2+
- Graceful degradation: older browsers show instant open/close without animation
