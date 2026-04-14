# @browser.style/accordion

A CSS-first accordion component built on native `<details>` and `<summary>` elements. No JavaScript required for the base experience — an optional web component wrapper provides a declarative API for framework integration.

## Features

- Native `<details>`/`<summary>` — accessible, keyboard-navigable, works without JS
- Exclusive open behavior via the HTML `name` attribute (no JS needed)
- Smooth open/close transitions via `::details-content`
- Light/dark mode support via design tokens
- Composable variants: `bordered`, `divided`, `rounded`, `breakout`, `separate`, `tinted`
- `type="horizontal"` for blinds-style horizontal layout (responsive via container query)
- `type="split"` for two-column layout with `data-split` content panels
- `no-collapse` attribute to ensure one item stays open
- Optional `<ui-accordion-item>` web component for framework use
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

Wrap items in `<ui-accordion>` — it's a plain HTML element that works as a structural wrapper even without JavaScript:

```html
<ui-accordion>
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
</ui-accordion>
```

The `name` attribute groups items — only one can be open at a time (native browser behavior, no JS).

To add an animated icon indicator, use `<ui-icon>` inside the summary:

```html
<summary>Question?<ui-icon type="plus-minus"></ui-icon></summary>
```

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

The web component renders the **exact same** native `<details class="ui-accordion">` + `<summary>` HTML into the light DOM. It's a convenience wrapper, not a replacement — the CSS is identical in both modes.

The `name` attribute on `<ui-accordion>` automatically propagates to all child `<details>` elements.

#### Attributes

**`<ui-accordion>`**

| Attribute | Type | Description |
|-----------|------|-------------|
| `name` | string | Groups items for exclusive open behavior (propagated to `<details>`) |
| `variant` | string | Space-separated: `bordered`, `divided`, `rounded`, `breakout`, `separate`, `tinted` |
| `type` | string | Layout mode: `"horizontal"` (blinds-style) or `"split"` (two-column with `data-split` content) |
| `tint` | color | Base color for `tinted` variant (e.g. `oklch(0.35 0.18 210)`) |
| `no-collapse` | boolean | Ensures one item always stays open |

**`<ui-accordion-item>`**

| Attribute | Type | Description |
|-----------|------|-------------|
| `label` | string | The summary/heading text (required) |
| `open` | boolean | Opens this item by default |
| `icon` | string | Icon type for the indicator (default: `"plus-minus"`) |

---

### React

```jsx
import '@browser.style/accordion';
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
> vue({ template: { compilerOptions: { isCustomElement: tag => tag.startsWith('ui-') || tag === 'cq-box' } } })
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

---

### Astro / Server-rendered HTML

Use the CSS-only approach:

```html
<link rel="stylesheet" href="@browser.style/base/core.css">
<link rel="stylesheet" href="@browser.style/accordion/index.css">

<ui-accordion>
  <details class="ui-accordion" name="faq">
    <summary>How do I reset my password?</summary>
    <div><p>Click "Forgot Password" on the login page.</p></div>
  </details>
</ui-accordion>
```

Add the web component script only if you want the `<ui-accordion-item>` declarative API:

```html
<script type="module">
  import '@browser.style/accordion';
</script>
```

---

## Variants

### Default

```html
<ui-accordion>
  <details class="ui-accordion" name="group">
    <summary>Title<ui-icon type="plus-minus"></ui-icon></summary>
    <div>Content</div>
  </details>
</ui-accordion>
```

### No-collapse (`no-collapse`)

Keeps one item always open — the open item's summary becomes non-interactive:

```html
<ui-accordion no-collapse name="always-one">
  <details class="ui-accordion" open>
    <summary>Always visible</summary>
    <div>This item cannot be closed while others are collapsed.</div>
  </details>
  <details class="ui-accordion">
    <summary>Collapsible</summary>
    <div>This can be toggled.</div>
  </details>
</ui-accordion>
```

Works with all variants.

### Composable variants

Combine variants via space-separated values. These only override custom properties — they never break the open/close mechanism.

```html
<!-- Framed group with rounded corners -->
<ui-accordion variant="bordered rounded" name="group">

<!-- Separated borderless items (gap only) -->
<ui-accordion variant="separate rounded" name="group">

<!-- Separated cards with borders around each item -->
<ui-accordion variant="bordered separate rounded" name="group">

<!-- Breakout with rounded corners -->
<ui-accordion variant="breakout rounded" name="group">

<!-- Floating cards (shadow via utility class on each details) -->
<ui-accordion variant="separate rounded" name="group">
  <details class="shadow-2xl">...</details>
</ui-accordion>

<!-- Full treatment -->
<ui-accordion variant="bordered divided rounded" name="group">
```

| Token | What it does |
|-------|-------------|
| `bordered` | Border frame around the group + inline padding. Combined with `separate`, the border moves to each item instead |
| `divided` | Divider line on each item |
| `separate` | Gap between items (no borders by default — add `bordered` for framed cards, or use a shadow utility for floating cards) |
| `rounded` | Border-radius on first/last (or all with `separate`, or contextual with `breakout`) |
| `breakout` | Open item shifts out via translate; adjacent items react |

### Split layout (`type="split"`)

Two-column layout at wider viewports (>650px): summary and text occupy the left column while any element marked with `data-split` (image, video, or arbitrary content) is pulled into the right panel. Requires `<cq-box>` for CSS-only; auto-inserted by the web component.

```html
<ui-accordion type="split" variant="divided" name="showcase" no-collapse>
  <cq-box>
    <details name="showcase" open>
      <summary>Our Workspace</summary>
      <div>
        <p>Description text in the left column.</p>
        <img src="photo.jpg" alt="Photo" data-split>
      </div>
    </details>
    <details name="showcase">
      <summary>Product Demo</summary>
      <div>
        <p>Short description.</p>
        <video src="demo.webm" controls data-split></video>
      </div>
    </details>
  </cq-box>
</ui-accordion>
```

Web component (no `<cq-box>` needed — auto-inserted):

```html
<ui-accordion type="split" variant="divided" name="showcase" no-collapse>
  <ui-accordion-item label="Our Workspace" open>
    <p>Description text.</p>
    <img src="photo.jpg" alt="Photo" data-split>
  </ui-accordion-item>
  <ui-accordion-item label="Product Demo">
    <p>Short description.</p>
    <video src="demo.webm" controls data-split></video>
  </ui-accordion-item>
</ui-accordion>
```

> **Why `<cq-box>`?** A container can't query its own size — the `@container` rule must target a descendant. `<cq-box>` is a generic, zero-layout wrapper (`display: contents`) provided by `@browser.style/base` that sits between the container host and its queryable children. The web component inserts it automatically.

### Horizontal layout (`type="horizontal"`)

Blinds-style layout at wider viewports (>650px). Falls back to vertical accordion below. Requires `<cq-box>` for CSS-only; auto-inserted by web component.

```html
<ui-accordion type="horizontal" variant="bordered rounded" name="sections">
  <cq-box>
    <details class="ui-accordion" name="sections" open>
      <summary>About Us</summary>
      <div><p>Content</p></div>
    </details>
    <details class="ui-accordion" name="sections">
      <summary>Our Team</summary>
      <div><p>Content</p></div>
    </details>
  </cq-box>
</ui-accordion>
```

Variants adapt: `divided` draws vertical lines, `bordered` frames the group, `rounded` applies left/right radii.

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
| `--ui-accordion-border-width` | `var(--border-width, 1px)` | Border width |
| `--ui-accordion-border-color` | `var(--color-border, hsl(0,0%,80%))` | Border color |
| `--ui-accordion-border-color-open` | `light-dark(hsl(0 0% 60%), hsl(0 0% 40%))` | Border color for open items (breakout) |
| `--ui-accordion-border-width-open` | `var(--border-width-thick, 2px)` | Border width for open items (breakout) |
| `--ui-accordion-border-radius` | `0` | Base corner radius |
| `--ui-accordion-border-radius-rounded` | `var(--radius-lg, 1em)` | Radius for `rounded` variant |
| `--ui-accordion-border-radius-separate` | `var(--radius-xl, 1.5em)` | Larger radius for `rounded` + `separate` |
| `--ui-accordion-bg-hover` | gradient using `--color-field` | Summary hover background |
| `--ui-accordion-gap` | `var(--spacing-xl, 2rem)` | Split-view / media column gap |
| `--ui-accordion-row-gap` | `var(--spacing-md, 1em)` | Gap between items (`separate`) |
| `--ui-accordion-margin-end` | `0` | Bottom margin |
| `--ui-accordion-padding-block` | `1.5ch` | Vertical padding |
| `--ui-accordion-padding-inline` | `0` | Horizontal padding |
| `--ui-accordion-summary-font-size` | `1em` | Summary heading font size |
| `--ui-accordion-summary-font-weight` | `var(--font-weight-medium, 500)` | Summary heading font weight |
| `--ui-accordion-duration` | `var(--duration-slow, .3s)` | Open/close animation speed |
| `--ui-accordion-split-view-duration` | `.6s` | Split-view / media transition speed |
| `--ui-accordion-background` | `var(--color-surface-alt, ...)` | Background color (`background` variant) |
| `--ui-accordion-background-padding` | `1.5ch` | Padding (`background` variant) |
| `--ui-accordion-breakout-unit` | `1rem` | Translate distance (`breakout`) |
| `--ui-accordion-horizontal-border-radius` | `var(--radius-md, 0.5em)` | Clip-path radius (horizontal) |

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
