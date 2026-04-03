# @browser.style/accordion

A CSS-first accordion component built on native `<details>` and `<summary>` elements. No JavaScript required for the base experience — an optional web component wrapper provides a declarative API for framework integration.

## Features

- Native `<details>`/`<summary>` — accessible, keyboard-navigable, works without JS
- Exclusive open behavior via the HTML `name` attribute (no JS needed)
- Smooth open/close transitions via `::details-content`
- Light/dark mode support via design tokens
- Composable variants: `bordered`, `divided`, `separated`, `rounded`, `breakout`, `elevated`, `background`
- `split-view` variant for side-by-side layout with `<cq-box>`
- `type="horizontal"` for blinds-style horizontal layout
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
| `variant` | string | Space-separated: `bordered`, `divided`, `separated`, `rounded`, `breakout`, `elevated`, `background`, `split-view` |
| `type` | string | Layout mode: `"horizontal"` for blinds-style layout |
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
    <ui-accordion name="faq" variant="bordered rounded">
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
  <ui-accordion name="faq" variant="separated rounded">
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

<ui-accordion variant="bordered divided rounded">
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

Variants are composable — combine them via space-separated values on the `variant` attribute.

### Default

```html
<ui-accordion>
  <details class="ui-accordion" name="group">
    <summary>Title<ui-icon type="plus-minus"></ui-icon></summary>
    <div>Content</div>
  </details>
</ui-accordion>
```

### Bordered

Adds a border frame around the group:

```html
<ui-accordion variant="bordered">
  ...
</ui-accordion>
```

### Divided

Adds divider lines between items:

```html
<ui-accordion variant="divided">
  ...
</ui-accordion>
```

### Separated

Card-style with gap between items and full border on each:

```html
<ui-accordion variant="separated">
  ...
</ui-accordion>
```

### Rounded

Applies border-radius. Behavior depends on what it's combined with:

- **Default**: First item gets top radius, last item gets bottom radius
- **With `separated`**: All items get `--ui-accordion-border-radius-separated` (larger)
- **With `breakout`**: Open item gets full radius, adjacent items get contextual radius

```html
<ui-accordion variant="bordered rounded">
  ...
</ui-accordion>
```

### Breakout

Open items shift out via CSS `translate`. Adjacent items react:

```html
<ui-accordion variant="breakout bordered rounded">
  ...
</ui-accordion>
```

### Elevated

Box-shadow on items instead of borders. Requires `breakout`:

```html
<ui-accordion variant="breakout elevated rounded">
  ...
</ui-accordion>
```

### Background

Container gets a background color and padding:

```html
<ui-accordion variant="background bordered divided rounded">
  ...
</ui-accordion>
```

### Combination examples

```html
<!-- Framed group with rounded corners -->
<ui-accordion variant="bordered rounded">

<!-- Separated cards -->
<ui-accordion variant="separated rounded">

<!-- Breakout with shadow (no borders on open item) -->
<ui-accordion variant="breakout elevated rounded">

<!-- Full treatment: background, frame, dividers, rounded -->
<ui-accordion variant="background bordered divided rounded">
```

---

## Split View

Side-by-side layout at wider viewports (>650px). Requires a `<cq-box>` wrapper for CSS-only usage.

CSS-only:

```html
<ui-accordion variant="split-view" name="showcase">
  <cq-box>
    <details class="ui-accordion" open>
      <summary>Our Workspace<ui-icon type="plus-minus"></ui-icon></summary>
      <div>
        <p>Description text</p>
        <img src="photo.jpg" alt="Photo">
      </div>
    </details>
  </cq-box>
</ui-accordion>
```

Web component (no `<cq-box>` needed — auto-inserted by JS):

```html
<ui-accordion variant="split-view" name="showcase">
  <ui-accordion-item label="Our Workspace" open>
    <p>Description text</p>
    <img src="photo.jpg" alt="Photo">
  </ui-accordion-item>
</ui-accordion>
```

### `data-split` for generic content

By default, `img`, `video`, and `picture` elements auto-position in the split panel. For any other content, add the `data-split` attribute:

```html
<details class="ui-accordion" open>
  <summary>Feature Overview</summary>
  <div>
    <p>Description goes here.</p>
    <div data-split>
      <p>Any content can go in the split panel.</p>
    </div>
  </div>
</details>
```

> **Why `<cq-box>`?** A container can't query its own size — the `@container` rule must target a descendant. `<cq-box>` is a generic, zero-layout wrapper (`display: contents`) provided by `@browser.style/base` that sits between the container host and its queryable children. The web component inserts it automatically.

---

## Horizontal Layout

Set `type="horizontal"` for a blinds-style layout where collapsed items display text vertically. At wider viewports (>650px) the layout switches from vertical to horizontal via a container query. Requires `<cq-box>` for CSS-only usage.

CSS-only:

```html
<ui-accordion type="horizontal" name="sections" style="block-size: 300px;">
  <cq-box>
    <details class="ui-accordion" name="sections" open>
      <summary>About Us</summary>
      <div><p>Content here.</p></div>
    </details>
    <details class="ui-accordion" name="sections">
      <summary>Products</summary>
      <div><p>Content here.</p></div>
    </details>
  </cq-box>
</ui-accordion>
```

Web component (no `<cq-box>` needed — auto-inserted by JS):

```html
<ui-accordion type="horizontal" name="sections" style="block-size: 300px;">
  <ui-accordion-item label="About Us" open>
    <p>Content here.</p>
  </ui-accordion-item>
  <ui-accordion-item label="Products">
    <p>Content here.</p>
  </ui-accordion-item>
</ui-accordion>
```

Below 650px, horizontal mode falls back to a standard vertical accordion.

Variants adapt to horizontal layout:

- `divided` — vertical divider lines between items
- `bordered` — frame with inline-start/inline-end borders on first/last
- `rounded` — left radii on first item, right radii on last
- `separated` — column gap between items

```html
<ui-accordion type="horizontal" variant="bordered rounded" style="block-size: 300px;">
  <cq-box>
    ...
  </cq-box>
</ui-accordion>
```

---

## No-collapse

Keeps one item always open — the open item's summary becomes non-interactive:

```html
<ui-accordion no-collapse name="always-one">
  <details class="ui-accordion" open>
    <summary>Always visible</summary>
    <div>This item cannot be closed.</div>
  </details>
</ui-accordion>
```

Works with all variants.

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
| `--ui-accordion-border-radius-separated` | `var(--radius-xl, 1.5em)` | Larger radius for `rounded` + `separated` |
| `--ui-accordion-bg-hover` | gradient using `--color-field` | Summary hover background |
| `--ui-accordion-gap` | `var(--spacing-xl, 2rem)` | Split-view column gap |
| `--ui-accordion-row-gap` | `var(--spacing-md, 1em)` | Gap between items (`separated`) |
| `--ui-accordion-shadow` | `none` | Box shadow |
| `--ui-accordion-shadow-elevated` | `var(--shadow-md, ...)` | Shadow for open items (`elevated`) |
| `--ui-accordion-shadow-elevated-adjacent` | `var(--shadow-sm, ...)` | Shadow for items adjacent to open (`elevated`) |
| `--ui-accordion-padding-block` | `1.5ch` | Vertical padding |
| `--ui-accordion-padding-inline` | `0` | Horizontal padding |
| `--ui-accordion-duration` | `var(--duration-slow, .3s)` | Open/close animation speed |
| `--ui-accordion-split-view-duration` | `.6s` | Split-view content transition speed |
| `--ui-accordion-background` | `var(--color-surface-alt, ...)` | Background color (`background` variant) |
| `--ui-accordion-background-padding` | `1.5ch` | Padding (`background` variant) |
| `--ui-accordion-breakout-unit` | `1rem` | Translate distance (`breakout`) |
| `--ui-accordion-horizontal-border-radius` | `var(--radius-md, 0.5em)` | Clip-path radius (horizontal) |
| `--ui-accordion-horizontal-shadow` | `-0.25em 0 1em -0.5em var(--color-overlay, ...)` | Shadow on collapsed horizontal items |

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
- `sibling-index()` / `sibling-count()` (horizontal mode): Chrome 136+
- Graceful degradation: older browsers show instant open/close without animation

---

## Breaking changes from v4

- `variant="item"` removed — use composable `variant="separated rounded"` instead
- `variant="media"` replaced by `variant="split-view"` (no backward compat)
- `--ui-accordion-margin-end` token removed
- `--ui-accordion-media-duration` renamed to `--ui-accordion-split-view-duration`
