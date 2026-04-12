# @browser.style/blockquote

A CSS-first blockquote component with decorative variants. No JavaScript required for the base experience — an optional web component wrapper provides a declarative API for framework integration.

## Features

- Styled `<blockquote>` with automatic em-dash on `<cite>`
- Variants: `bigquote` (large decorative open-quote), `breaker` (centered with horizontal rules), `code` (curly brace decoration)
- Light/dark mode support via design tokens
- Works as plain CSS with `data-variant` or as a `<ui-blockquote>` web component
- No JavaScript required for full styling

---

## Install

```bash
npm install @browser.style/blockquote
```

Peer dependency:

```bash
npm install @browser.style/base
```

> `@browser.style/base` provides the design token system (colors, spacing, typography, etc.).

---

## Usage

### CSS-only (vanilla HTML)

Import the styles, then use native `<blockquote>` elements with `data-variant`:

```html
<link rel="stylesheet" href="@browser.style/base/index.css">
<link rel="stylesheet" href="@browser.style/blockquote/index.css">
```

Or via CSS `@import`:

```css
@import '@browser.style/base';
@import '@browser.style/blockquote/style';
```

Default blockquote (adds an em-dash before `<cite>`):

```html
<blockquote data-variant>
  <q>The only true wisdom is in knowing you know nothing.</q>
  <cite>Socrates</cite>
</blockquote>
```

With a variant:

```html
<blockquote data-variant="bigquote">
  <q>The only true wisdom is in knowing you know nothing.</q>
  <cite>Socrates</cite>
</blockquote>
```

---

### Web Component

Import the module to register `<ui-blockquote>`:

```js
import '@browser.style/blockquote';
```

```html
<ui-blockquote>
  <q>The only true wisdom is in knowing you know nothing.</q>
  <cite>Socrates</cite>
</ui-blockquote>
```

With a variant:

```html
<ui-blockquote variant="bigquote">
  <q>The only true wisdom is in knowing you know nothing.</q>
  <cite>Socrates</cite>
</ui-blockquote>
```

The web component renders a native `<blockquote>` into the light DOM and maps `variant` to `data-variant` on the inner element. The CSS is identical in both modes.

#### Attributes

| Attribute | Type | Description |
|-----------|------|-------------|
| `variant` | string | Variant name: `bigquote`, `breaker`, or `code` |
| `cite` | string | URL of the quote source (mapped to native `cite` attribute) |

---

### React

```jsx
import '@browser.style/blockquote';
import '@browser.style/base';
import '@browser.style/blockquote/style';

function Quote() {
  return (
    <ui-blockquote variant="bigquote">
      <q>The only true wisdom is in knowing you know nothing.</q>
      <cite>Socrates</cite>
    </ui-blockquote>
  );
}
```

> React 19+ handles custom elements natively. For React 18, custom element attributes work in JSX but you may need `ref` for setting properties.

---

### Vue

```vue
<script setup>
import '@browser.style/blockquote';
import '@browser.style/base';
import '@browser.style/blockquote/style';
</script>

<template>
  <ui-blockquote variant="bigquote">
    <q>The only true wisdom is in knowing you know nothing.</q>
    <cite>Socrates</cite>
  </ui-blockquote>
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
  import '@browser.style/blockquote';
  import '@browser.style/base';
  import '@browser.style/blockquote/style';
</script>

<ui-blockquote variant="bigquote">
  <q>The only true wisdom is in knowing you know nothing.</q>
  <cite>Socrates</cite>
</ui-blockquote>
```

---

### Astro / Server-rendered HTML

Use the CSS-only approach with `data-variant`:

```html
<link rel="stylesheet" href="@browser.style/base/index.css">
<link rel="stylesheet" href="@browser.style/blockquote/index.css">

<blockquote data-variant="bigquote">
  <q>The only true wisdom is in knowing you know nothing.</q>
  <cite>Socrates</cite>
</blockquote>
```

Add the web component script only if you want the `<ui-blockquote>` declarative API:

```html
<script type="module">
  import '@browser.style/blockquote';
</script>
```

---

## Variants

### Default

Adds an em-dash before `<cite>`:

```html
<blockquote data-variant>
  <q>Quote text here.</q>
  <cite>Author</cite>
</blockquote>
```

### bigquote

Large decorative open-quote character:

```html
<blockquote data-variant="bigquote">
  <q>Quote text here.</q>
  <cite>Author</cite>
</blockquote>
```

### breaker

Centered quote with horizontal rules above and below:

```html
<blockquote data-variant="breaker">
  <q>Quote text here.</q>
  <cite>Author</cite>
</blockquote>
```

### code

Curly brace decoration for code-related quotes:

```html
<blockquote data-variant="code">
  <q>Quote text here.</q>
  <cite>Author</cite>
</blockquote>
```

---

## Customization

### Design tokens

Override global tokens to theme all blockquotes:

```css
:root {
  --color-text-muted: #6b7280;
  --font-size-9xl: 10rem;
}
```

### Component tokens

Override blockquote-specific tokens for targeted changes:

```css
ui-blockquote {
  --ui-blockquote-accent-color: #e63946;
  --ui-blockquote-accent-font-size: 12rem;
}
```

### All component tokens

| Token | Default | Description |
|-------|---------|-------------|
| `--ui-blockquote-accent-color` | `var(--color-text-muted)` | Color for decorative elements (quote marks, rules, braces) |
| `--ui-blockquote-accent-font-size` | `var(--font-size-9xl)` | Font size for decorative characters (bigquote, code) |
| `--ui-blockquote-accent-font-family` | `ui-serif, serif` | Font family for bigquote open-quote character |
| `--ui-blockquote-bigquote-indent` | `5rem` | Left padding for bigquote variant |
| `--ui-blockquote-breaker-max-width` | `var(--width-xs)` | Max width for breaker variant |
| `--ui-blockquote-breaker-rule-spacing` | `3ch` | Vertical spacing of horizontal rules (breaker) |
| `--ui-blockquote-code-indent` | `6ch` | Horizontal padding for code variant |

---

## Accessibility

- Built on native `<blockquote>` — screen readers announce it as a quote block
- `<cite>` provides attribution semantics
- Use the `cite` attribute for machine-readable source URLs
- Works with JavaScript disabled (CSS-only mode)

---

## Browser support

- All modern browsers (Chrome, Firefox, Safari, Edge)
- `light-dark()`: Chrome 123+, Firefox 120+, Safari 17.5+
- Graceful degradation: decorative elements degrade cleanly in older browsers
