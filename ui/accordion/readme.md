# @browser.style/accordion

A CSS-first accordion component built on native `<details>` and `<summary>` elements. No JavaScript required for the base experience — an optional web component wrapper provides a declarative API for framework integration.

## Features

- Native `<details>`/`<summary>` — accessible, keyboard-navigable, works without JS
- Exclusive open behavior via the HTML `name` attribute (no JS needed)
- Smooth open/close transitions via `::details-content`
- Light/dark mode support via design tokens
- Composable variants: `bordered`, `breakout`, `divided`, `rounded`, `separate`, `shadow`
- Layout types: `horizontal`, `horizontal-fixed`, `split` (responsive via container query)
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
<link rel="stylesheet" href="@browser.style/accordion/ui-accordion.css">
```

Or via CSS `@import`:

```css
@import '@browser.style/base';
@import '@browser.style/accordion/ui-accordion.css';
```

Wrap items in `<ui-accordion>` — it's a plain HTML element that works as a structural wrapper even without JavaScript:

```html
<ui-accordion>
  <details name="faq">
    <summary>How do I reset my password?<ui-icon type="plus-minus"></ui-icon></summary>
    <div>
      <p>Go to the login page and click "Forgot Password".</p>
    </div>
  </details>
  <details name="faq">
    <summary>What payment methods do you accept?<ui-icon type="plus-minus"></ui-icon></summary>
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

The web component renders native `<details>` + `<summary>` HTML into the light DOM. It's a convenience wrapper, not a replacement — the CSS is identical in both modes.

The `name` attribute on `<ui-accordion>` automatically propagates to all child `<details>` elements.

#### Attributes

**`<ui-accordion>`**

| Attribute | Type | Description |
|-----------|------|-------------|
| `name` | string | Groups items for exclusive open behavior (propagated to `<details>`) |
| `variant` | string | Space-separated: `bordered`, `breakout`, `divided`, `rounded`, `separate`, `shadow` |
| `type` | string | Layout mode: `horizontal`, `horizontal-fixed`, `split` |
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
import '@browser.style/accordion/ui-accordion.css';

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
import '@browser.style/accordion/ui-accordion.css';
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
  import '@browser.style/accordion/ui-accordion.css';
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
<link rel="stylesheet" href="@browser.style/accordion/ui-accordion.css">

<ui-accordion>
  <details name="faq">
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

Combine variants via space-separated values on the `variant` attribute. These only override custom properties — they never break the open/close mechanism.

### Default

No variant attribute needed. Plain accordion with hover effect.

```html
<ui-accordion>
  <details name="group">
    <summary>Title<ui-icon type="plus-minus"></ui-icon></summary>
    <div>Content</div>
  </details>
</ui-accordion>
```

### Divided (`variant="divided"`)

Adds a divider line between each item:

```html
<ui-accordion variant="divided" name="group">
  <details name="group">
    <summary>Title<ui-icon type="plus-minus"></ui-icon></summary>
    <div>Content</div>
  </details>
</ui-accordion>
```

### Bordered (`variant="bordered"`)

Adds a border frame around the entire group with inline padding:

```html
<ui-accordion variant="bordered" name="group">
  ...
</ui-accordion>
```

### Bordered + Rounded (`variant="bordered rounded"`)

Framed group with rounded corners on first and last items:

```html
<ui-accordion variant="bordered rounded" name="group">
  ...
</ui-accordion>
```

### Breakout (`variant="breakout"`)

Open item shifts out via `translate`; adjacent items react. Uses thicker border on the open item:

```html
<ui-accordion variant="breakout" name="group">
  ...
</ui-accordion>
```

Combine with `rounded` for contextual border-radius on the open item and its neighbors:

```html
<ui-accordion variant="breakout rounded" name="group">
  ...
</ui-accordion>
```

### Separate (`variant="separate"`)

Card-style layout with gap between items and full border on each:

```html
<ui-accordion variant="separate divided rounded" name="group">
  ...
</ui-accordion>
```

### Shadow (`variant="shadow"`)

Adds box-shadow to each item, removes borders. Combines well with `rounded`:

```html
<ui-accordion variant="shadow rounded" name="group">
  ...
</ui-accordion>
```

### No-collapse (`no-collapse`)

Keeps one item always open — the open item's summary becomes non-interactive:

```html
<ui-accordion no-collapse name="always-one">
  <details name="always-one" open>
    <summary>Always visible</summary>
    <div>This item cannot be closed.</div>
  </details>
  ...
</ui-accordion>
```

Works with all variants.

---

## Layout Types

Layout types are set via the `type` attribute and activate inside a `@container (inline-size > 650px)` query. Below 650px they fall back to the default vertical accordion. Types require a `<cq-box>` wrapper for CSS-only usage — the web component inserts it automatically.

> **Why `<cq-box>`?** A container can't query its own size — the `@container` rule must target a descendant. `<cq-box>` is a generic, zero-layout wrapper (`display: contents`) provided by `@browser.style/base` that sits between the container host and its queryable children.

### Horizontal (`type="horizontal"`)

Blinds-style horizontal grid. Collapsed items display text vertically via `writing-mode: vertical-lr`.

```html
<ui-accordion variant="bordered rounded" name="sections" type="horizontal">
  <cq-box>
    <details name="sections" open>
      <summary>About Us<ui-icon type="chevron down"></ui-icon></summary>
      <div><p>Content</p></div>
    </details>
    <details name="sections">
      <summary>Services<ui-icon type="chevron down"></ui-icon></summary>
      <div><p>Content</p></div>
    </details>
  </cq-box>
</ui-accordion>
```

Variants adapt to horizontal layout: `divided` draws vertical lines between items, `bordered` frames the group.

### Horizontal Fixed (`type="horizontal-fixed"`)

Fixed-height horizontal accordion with `flex` and `inline-size` transitions. Items smoothly expand/collapse horizontally.

```html
<ui-accordion variant="bordered rounded" name="sections" type="horizontal-fixed" no-collapse>
  <cq-box>
    <details name="sections" open>
      <summary>Title<ui-icon type="chevron down"></ui-icon></summary>
      <div>Content</div>
    </details>
    ...
  </cq-box>
</ui-accordion>
```

### Split (`type="split"`)

Two-column layout at wider viewports. Text in the left column, media/content in the right panel. Add `data-split` to the element that should appear in the right panel (images and videos are automatically detected).

```html
<ui-accordion name="showcase" type="split" variant="divided" no-collapse>
  <cq-box>
    <details name="showcase" open>
      <summary>Our Workspace<ui-icon type="plus-minus"></ui-icon></summary>
      <div>
        <p>Description text</p>
        <img src="photo.jpg" alt="Photo" data-split>
      </div>
    </details>
  </cq-box>
</ui-accordion>
```

Web component (no `<cq-box>` needed — auto-inserted by JS):

```html
<ui-accordion name="showcase" type="split" variant="divided" no-collapse>
  <ui-accordion-item label="Our Workspace" open>
    <p>Description text</p>
    <img src="photo.jpg" alt="Photo" data-split>
  </ui-accordion-item>
</ui-accordion>
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
ui-accordion {
  --ui-accordion-border-color: #e63946;
  --ui-accordion-border-width: 2px;
  --ui-accordion-padding-block: 2ch;
  --ui-accordion-duration: 500ms;
}
```

### All component tokens

| Token | Default | Description |
|-------|---------|-------------|
| `--ui-accordion-background` | `inherit` | Background color |
| `--ui-accordion-bg-hover` | gradient using `--color-field` | Summary hover background |
| `--ui-accordion-border-color` | `var(--color-border, hsl(0, 0%, 80%))` | Border color |
| `--ui-accordion-border-radius` | `1ch` | Base corner radius |
| `--ui-accordion-border-style` | `solid` | Border line style |
| `--ui-accordion-border-width` | `var(--input-border-width, 1px)` | Border width |
| `--ui-accordion-breakout-border-width` | `var(--border-width-thick, 2px)` | Border width for open items (breakout) |
| `--ui-accordion-breakout-unit` | `var(--spacing-md, 1rem)` | Translate distance (breakout) |
| `--ui-accordion-color` | `inherit` | Text color |
| `--ui-accordion-duration` | `var(--duration-slow, .3s)` | Open/close animation speed |
| `--ui-accordion-gap` | `var(--spacing-xl, 2rem)` | Gap between items (separate, shadow) |
| `--ui-accordion-horizontal-fixed-height` | `400px` | Height for horizontal-fixed type |
| `--ui-accordion-margin-end` | `0` | Bottom margin |
| `--ui-accordion-media-duration` | `.6s` | Split-view transition speed |
| `--ui-accordion-padding-block` | `1.5ch` | Vertical padding |
| `--ui-accordion-padding-inline` | `1.5ch` | Horizontal padding (bordered, separate) |
| `--ui-accordion-padding-inline-separate` | `2.25ch` | Horizontal padding (separate, shadow) |
| `--ui-accordion-shadow` | `none` | Box shadow |
| `--ui-accordion-summary-font-size` | `1em` | Summary heading font size |
| `--ui-accordion-summary-font-weight` | `500` | Summary heading font weight |

### Private shorthands

These are computed from the tokens above and used internally:

| Property | Value |
|----------|-------|
| `--_border` | `border-width + border-style + border-color` |
| `--_border-breakout` | `breakout-border-width + border-style + border-color` |

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
