# @browser.style/quote

A CSS-first quote component with decorative variants. No JavaScript required — the canonical form is a `<ui-quote>` wrapper around a native `<blockquote>`, and a bare `<blockquote data-variant>` still works. An optional module registers the element for `import` resolution only.

> **Renamed in v5** — this package was `@browser.style/blockquote` (element `<ui-blockquote>`) through v4. The old element name and the `blockquote[data-variant]` form remain styled as deprecated compat selectors. The v4 auto-wrap JS behavior (`<ui-blockquote>` wrapping its children in a `<blockquote>`) was removed — author the inner `<blockquote>` yourself.

## Features

- `<ui-quote>` wrapper carrying the look via a `variant` attribute — same shape as `<ui-accordion variant="…">`
- Styled `<blockquote>` with automatic em-dash on `<cite>`
- Variants: `bigquote` (large decorative open-quote), `breaker` (centered with horizontal rules), `code` (curly brace decoration)
- Light/dark mode support via design tokens
- Also works on a plain `<blockquote data-variant>` — no wrapper needed
- No JavaScript required for full styling
- Used by `@browser.style/card` for `Quotation` / `Review` / `SocialMediaPosting` schema cards

---

## Install

```bash
npm install @browser.style/quote
```

Peer dependency:

```bash
npm install @browser.style/base
```

> `@browser.style/base` provides the design token system (colors, spacing, typography, etc.).

---

## Usage

### CSS-only (vanilla HTML)

Import the styles, then wrap a native `<blockquote>` in `<ui-quote>`:

```html
<link rel="stylesheet" href="@browser.style/base/index.css">
<link rel="stylesheet" href="@browser.style/quote/index.css">
```

Or via CSS `@import`:

```css
@import '@browser.style/base';
@import '@browser.style/quote/style';
```

Default (left border, em-dash before `<cite>`):

```html
<ui-quote>
  <blockquote>
    <q>The only true wisdom is in knowing you know nothing.</q>
    <cite>Socrates</cite>
  </blockquote>
</ui-quote>
```

With a variant:

```html
<ui-quote variant="bigquote">
  <blockquote>
    <q>The only true wisdom is in knowing you know nothing.</q>
    <cite>Socrates</cite>
  </blockquote>
</ui-quote>
```

Without the wrapper (`data-variant` on the blockquote itself):

```html
<blockquote data-variant="bigquote">
  <q>The only true wisdom is in knowing you know nothing.</q>
  <cite>Socrates</cite>
</blockquote>
```

#### Attributes

| Attribute | Type | Description |
|-----------|------|-------------|
| `variant` | string | Variant name: `bigquote`, `breaker`, or `code` |

The optional module registers `<ui-quote>` (and the deprecated `<ui-blockquote>` alias) so `import '@browser.style/quote'` resolves — it adds no behavior:

```js
import '@browser.style/quote';
```

---

### React

```jsx
import '@browser.style/base';
import '@browser.style/quote/style';

function Quote() {
  return (
    <ui-quote variant="bigquote">
      <blockquote>
        <q>The only true wisdom is in knowing you know nothing.</q>
        <cite>Socrates</cite>
      </blockquote>
    </ui-quote>
  );
}
```

> React 19+ handles custom elements natively. For React 18, custom element attributes work in JSX but you may need `ref` for setting properties.

---

### Vue

```vue
<script setup>
import '@browser.style/base';
import '@browser.style/quote/style';
</script>

<template>
  <ui-quote variant="bigquote">
    <blockquote>
      <q>The only true wisdom is in knowing you know nothing.</q>
      <cite>Socrates</cite>
    </blockquote>
  </ui-quote>
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
  import '@browser.style/base';
  import '@browser.style/quote/style';
</script>

<ui-quote variant="bigquote">
  <blockquote>
    <q>The only true wisdom is in knowing you know nothing.</q>
    <cite>Socrates</cite>
  </blockquote>
</ui-quote>
```

---

### Astro / Server-rendered HTML

```html
<link rel="stylesheet" href="@browser.style/base/index.css">
<link rel="stylesheet" href="@browser.style/quote/index.css">

<ui-quote variant="bigquote">
  <blockquote>
    <q>The only true wisdom is in knowing you know nothing.</q>
    <cite>Socrates</cite>
  </blockquote>
</ui-quote>
```

---

## Variants

### Default

Left border on the wrapper, em-dash before `<cite>`:

```html
<ui-quote>
  <blockquote>
    <q>Quote text here.</q>
    <cite>Author</cite>
  </blockquote>
</ui-quote>
```

### bigquote

Large decorative open-quote character:

```html
<ui-quote variant="bigquote">
  <blockquote>
    <q>Quote text here.</q>
    <cite>Author</cite>
  </blockquote>
</ui-quote>
```

### breaker

Centered quote with horizontal rules above and below:

```html
<ui-quote variant="breaker">
  <blockquote>
    <q>Quote text here.</q>
    <cite>Author</cite>
  </blockquote>
</ui-quote>
```

### code

Curly brace decoration for code-related quotes:

```html
<ui-quote variant="code">
  <blockquote>
    <q>Quote text here.</q>
    <cite>Author</cite>
  </blockquote>
</ui-quote>
```

---

## Customization

### Design tokens

Override global tokens to theme all quotes:

```css
:root {
  --color-text-muted: #6b7280;
  --font-size-9xl: 10rem;
}
```

### Component tokens

Override quote-specific tokens for targeted changes:

```css
ui-quote {
  --ui-quote-accent-color: #e63946;
  --ui-quote-accent-font-size: 12rem;
}
```

### All component tokens

| Token | Default | Description |
|-------|---------|-------------|
| `--ui-quote-accent-color` | `var(--color-text-muted)` | Color for decorative elements (quote marks, rules, braces) |
| `--ui-quote-accent-font-size` | `var(--font-size-9xl)` | Font size for decorative characters (bigquote, code) |
| `--ui-quote-accent-font-family` | `ui-serif, serif` | Font family for bigquote open-quote character |
| `--ui-quote-bigquote-indent` | `5rem` | Inline-start padding for bigquote variant |
| `--ui-quote-breaker-max-width` | `var(--width-xs)` | Max width for breaker variant |
| `--ui-quote-breaker-rule-spacing` | `3ch` | Vertical spacing of horizontal rules (breaker) |
| `--ui-quote-code-indent` | `6ch` | Horizontal padding for code variant |

> The v4 `--ui-blockquote-*` token names were renamed to `--ui-quote-*` in v5.

---

## Accessibility

- Built on native `<blockquote>` — screen readers announce it as a quote block
- `<cite>` provides attribution semantics
- Use the native `cite` attribute on the `<blockquote>` for machine-readable source URLs
- Works with JavaScript disabled (CSS-only)

---

## Browser support

- All modern browsers (Chrome, Firefox, Safari, Edge)
- `light-dark()`: Chrome 123+, Firefox 120+, Safari 17.5+
- Graceful degradation: decorative elements degrade cleanly in older browsers
