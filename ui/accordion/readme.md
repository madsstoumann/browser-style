# @browser.style/accordion

A CSS-first accordion component built on native `<details>` and `<summary>` elements. No JavaScript required for the base experience — an optional web component wrapper provides a declarative API for framework integration.

## Features

- Native `<details>`/`<summary>` — accessible, keyboard-navigable, works without JS
- Exclusive open behavior via the HTML `name` attribute (no JS needed)
- Smooth open/close transitions via `::details-content`
- Light/dark mode support via design tokens
- Composable variants: `bordered`, `divided`, `rounded`, `pill`, `breakout`, `separate`, `filled`, `hide-summary`
- Color tinting via `tint` + `tinted` attributes (from `@browser.style/base`)
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
| `variant` | string | Space-separated: `bordered`, `divided`, `rounded`, `pill`, `breakout`, `separate`, `filled`, `hide-summary` |
| `type` | string | Layout mode: `"horizontal"` (blinds-style) or `"split"` (two-column with `data-split` content) |
| `tint` | color | Base color for tinting items (e.g. `oklch(0.35 0.18 210)`) |
| `tinted` | boolean | Enables a graduated color ramp across items (requires `tint`) |
| `no-collapse` | boolean | Ensures one item always stays open |
| `indent` | boolean | On the outermost accordion, enables a depth-based staircase: each nested level adds `--ui-accordion-padding-inline` to the inline-start of summaries and leaf panel content |
| `tabs` | string | Morph into tabs. Value is a token list — variants (`pill`, `rounded`, `bordered`, `compact`, `ellipse`, `panel`, `bleed`, `no-background`) plus the accordion-specific `expanded` for mega-menu mode. Loads `@browser.style/tabs` |

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
| `pill` | Fully rounded ends per item, matching `ui/tabs` pill radius (`--radius-pill`). Compose with `separate` for discrete pills |
| `breakout` | Open item shifts out via translate; adjacent items react |
| `filled` | Light surface background (`--color-surface-alt`) per item. Pairs with `separate rounded` (or `pill`) for a gray pill look |
| `hide-summary` | Hides the open item's summary so only its content shows. **Requires `no-collapse` + `name`** — without them a hidden summary leaves no way to reopen or close the item (see below) |

### Hide summary on open (`variant="hide-summary"`)

Collapses the summary of the open item, revealing only its content. Closed items keep their summaries, so the group reads as a list of labels with one expanded panel.

**Required pairing:** `no-collapse` + `name`. Because the open item's summary is hidden, there is no toggle left to close it — you switch panels by opening another item. `no-collapse` keeps one item always open and `name` makes the group exclusive. Omit either and the open item becomes a dead end with no summary to click. The variant is purely visual and composes with any layout, including `type="split"` (hide the summary, keep the media-on-right) and `separate pill filled` (chip column).

Closed items shrink to their label width (left-aligned chips); the open item keeps full width for its revealed content. The summary's icon leads the label — author the `<summary>` with `<ui-icon>` before the text.

```html
<ui-accordion type="split" variant="hide-summary separate rounded" name="showcase" no-collapse>
  <cq-box>
    <details name="showcase" open>
      <summary>Sound quality</summary>
      <div>
        <p>Detail shown when open; summary is hidden.</p>
        <img src="photo.jpg" alt="Photo" data-split>
      </div>
    </details>
    <details name="showcase">
      <summary>Fit and feel</summary>
      <div><p>…</p><img src="fit.jpg" alt="Fit" data-split></div>
    </details>
  </cq-box>
</ui-accordion>
```

### Split layout (`type="split"`)

Two-column layout at wider viewports (>650px): summary and text occupy the left column while any element marked with `data-split` (image, video, or arbitrary content) is pulled into the right panel. Requires `<cq-box>` for CSS-only; auto-inserted by the web component.

**Ratio** — add a `spl(content/media)` token to `variant` to size the columns (same DSL as `ui/card`). Defaults to `spl(1/1)` (50/50). Available: `spl(1/1)`, `spl(3/2)`, `spl(2/3)`, `spl(2/1)`, `spl(1/2)`. Example — wider content, narrower media:

```html
<ui-accordion type="split" variant="divided spl(3/2)" name="showcase" no-collapse>
```

**Entry animation** — opening an item fades/scales the media in (`accordion-media-in`) and staggers the text fade just after (`accordion-content-in`), so switching items reads as a smooth crossfade rather than a hard cut. Tune via `--ui-accordion-media-duration`, `--ui-accordion-media-easing`, `--ui-accordion-media-shift`, and `--ui-accordion-media-delay`. Honors `prefers-reduced-motion` (fade only, no movement).

**RTL** — fully mirrored. Built on logical properties (`inset-inline`, `justify-self: start`), so under `dir="rtl"` the content moves to the inline-start (right) and the media to the inline-end (left) automatically; no extra markup.

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

## Nested accordions

Accordions can be nested arbitrarily deep — drop a `<ui-accordion>` directly inside a parent `<details>`:

```html
<ui-accordion variant="bordered divided rounded" name="outer">
  <cq-box>
    <details name="outer" open>
      <summary>Account</summary>
      <ui-accordion variant="divided" name="inner">
        <cq-box>
          <details name="inner"><summary>Profile</summary><div>…</div></details>
          <details name="inner"><summary>Security</summary><div>…</div></details>
        </cq-box>
      </ui-accordion>
    </details>
    <details name="outer"><summary>Billing</summary><div>…</div></details>
  </cq-box>
</ui-accordion>
```

Each level needs its own `name` so open-state groups stay independent.

### Auto-adjust when nested

When a `<ui-accordion>` is the direct child of a parent `<details>`, three visual conflicts are auto-resolved:

- **Border-radius zeroed on inner accordions** — `--ui-accordion-border-radius` is reset to `0` via inheritance, so a nested `bordered rounded` accordion sits flush with its parent's edges.
- **Inner bottom edge stripped** — for nested `bordered` accordions, the inner `cq-box`'s `border-block-end` is removed; for nested `breakout`, the last details' `border-block-end` is removed. No double lines against the parent's content edge.
- **Parent details `padding-inline` zeroed, summary compensates** — `bordered`/`breakout` variants normally pad the details content area inline. When a parent details holds a nested accordion, its inline padding drops to zero (so the nested accordion sits flush) but the parent's own summary keeps its inline padding so the title stays correctly indented.

These are unconditional — no opt-in attribute, just write the nesting and the rules engage.

### Indent attribute (`indent`)

For tree-style indentation, set `indent` on the **outermost** accordion:

```html
<ui-accordion variant="bordered divided rounded" name="outer" indent>
  …
</ui-accordion>
```

Indent is depth-based and uses `--ui-accordion-padding-inline` as the unit. Each nesting level adds one step:

- L1 summary text: `1 × --ui-accordion-padding-inline` (already from the variant rules)
- L2 nested summary: `2 × --ui-accordion-padding-inline`
- L3 nested summary: `3 × --ui-accordion-padding-inline`

The padding sits on the **summary** and on **leaf details' panel content** inside every nested `<ui-accordion>`. The `<details>` element itself stays full-width, so dividers and borders span the full inline axis without shifting. Only the textual content moves; parent details that contain a nested accordion as their content (rather than text) do not get extra padding so the nested accordion stays flush.

`[indent]` only goes on the outermost accordion — a depth-counter inherits down through every nested level. To stop the indent at a particular level, override `--ui-accordion-padding-inline` on that accordion (inline style or class).

To customise the indent step (which is just `--ui-accordion-padding-inline`):

```css
:root { --ui-accordion-padding-inline: 2ch; }
```

or per-instance:

```html
<ui-accordion indent style="--ui-accordion-padding-inline: 0.5rem">…</ui-accordion>
```

---

## Morph into tabs

`<ui-accordion>` shares its inner structure (`cq-box > details`) with `<ui-tabs>` from `@browser.style/tabs`. A single inherited custom property — `--_render` — decides which component's rendering engine wins:

- `--_render: accordion` → accordion styles apply
- `--_render: tabs` → tabs styles apply

Every rendering rule in both components lives inside `@container style(--_render: …)`. Flip the value, and the element re-renders on the same markup with no JS and no DOM change.

### Opt-in: `tabs` attribute

Load `@browser.style/tabs` alongside `@browser.style/accordion` and add a `tabs` attribute to the accordion. The tabs stylesheet sets `--_render: tabs` on any element with `[tabs]`, so the accordion renders as tabs from first paint:

```html
<link rel="stylesheet" href="@browser.style/base/index.css">
<link rel="stylesheet" href="@browser.style/accordion/index.css">
<link rel="stylesheet" href="@browser.style/tabs/index.css">

<ui-accordion tabs="pill" variant="bordered rounded" name="faq">
  <cq-box>
    <details name="faq" open>
      <summary>Shipping</summary>
      <div>…</div>
    </details>
    <details name="faq">
      <summary>Returns</summary>
      <div>…</div>
    </details>
  </cq-box>
</ui-accordion>
```

Any value the tabs component accepts (`pill`, `rounded`, `bordered`, `compact`, `ellipse`, `panel`, `bleed`) works on the `tabs="…"` attribute — see the tabs readme. One additional accordion-specific token is also recognised: `expanded`, which turns the tabs renderer into a mega-menu (see below).

### Mega-menu with `tabs="… expanded"`

Add `expanded` to the `tabs="…"` token list to turn the active tab panel into a mega-menu: every nested `<ui-accordion>` inside the panel renders fully expanded (all `::details-content` visible), nested summaries become static labels (no cursor, no clicks, no expand/collapse icons), and the whole subtree of the active tab is shown at once.

```html
<auto-morph render="tabs">
  <ui-accordion tabs="pill panel expanded" variant="bordered divided rounded" name="mega" indent>
    <cq-box>
      <details name="mega"><summary>Account</summary>
        <ui-accordion variant="divided" name="account">
          <cq-box>
            <details name="account"><summary>Profile</summary>
              <ui-accordion variant="divided" name="profile">…</ui-accordion>
            </details>
            …
          </cq-box>
        </ui-accordion>
      </details>
      …
    </cq-box>
  </ui-accordion>
</auto-morph>
```

`expanded` is **scoped to tabs mode** — when the auto-morph flips back to accordion below 650px, normal collapse semantics return (summaries clickable, panels collapsible, icons visible). It only takes effect on nested accordions; the outer's own summaries (the actual tab labels) keep their tabs-renderer behaviour.

### Auto-morph with `<auto-morph render="tabs">`

For responsive morph — accordion on narrow, tabs on wide — install [`@browser.style/auto-morph`](../auto-morph/readme.md) and wrap the element. The package ships the wrapper styles and the size-gated rule that flips `--_render: accordion` below 650px:

```bash
npm install @browser.style/auto-morph
```

```css
@import '@browser.style/auto-morph';
```

```html
<auto-morph render="tabs">
  <ui-accordion tabs="pill" variant="bordered rounded" name="faq">
    <cq-box>
      <details name="faq" open><summary>Shipping</summary><div>…</div></details>
      <details name="faq"><summary>Returns</summary><div>…</div></details>
    </cq-box>
  </ui-accordion>
</auto-morph>
```

Above 650px wrapper width → tabs. Below → accordion. Per-instance: a narrow sidebar can stay accordion while a wide main column morphs to tabs, with no viewport media queries in sight.

The attribute *value* (`tabs`) names the morph target. Future modes (`render="nav"`, `render="menu"`, …) plug in by adding paired rules. `--_render` itself is a plain inherited custom property — no `@property` registration needed; string-equality style queries work on plain custom properties.

### Why not query `<ui-accordion>` directly?

A CSS container can't query its own size; `@container` resolves against the *nearest ancestor* container. Since `<ui-accordion>` sets its own `container-type`, it can't react to its own width. The `<auto-morph>` wrapper is that ancestor — one element above the accordion, it gives the `@container` rule something to resolve against. You can use any ancestor with `container-type` (a grid cell, a section, a `<main>`); `@browser.style/auto-morph` is just the packaged shorthand.

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
| `--ui-accordion-gap` | `var(--spacing-xl, 2rem)` | Base gap token (default for `separate` and the split column gap) |
| `--ui-accordion-split-gap` | `var(--ui-accordion-gap, var(--spacing-xl))` | `type="split"` column gap between content and media |
| `--ui-accordion-split` | `1fr 1fr` | Split grid columns (set by `spl(x/y)` variant tokens) |
| `--ui-accordion-split-media` | `0.5` | Split media column fraction, unitless; media fills col2 = `fraction × (100% − gap)` (set by `spl(x/y)`) |
| `--ui-accordion-row-gap` | `var(--spacing-md, 1em)` | Gap between items (`separate`) |
| `--ui-accordion-margin-end` | `0` | Bottom margin |
| `--ui-accordion-padding-block` | `1.5ch` | Vertical padding |
| `--ui-accordion-padding-inline` | `0` | Horizontal padding (the `indent` attribute multiplies this value by nesting depth) |
| `--ui-accordion-pill-open-radius` | `var(--radius-3xl, 1.5rem)` | Corner radius of the open item, `pill` variant (rounded rectangle, not a full capsule) |
| `--ui-accordion-summary-font-size` | `1em` | Summary heading font size |
| `--ui-accordion-summary-font-weight` | `var(--font-weight-medium, 500)` | Summary heading font weight |
| `--ui-accordion-duration` | `var(--duration-slow, .3s)` | Open/close animation speed |
| `--ui-accordion-media-duration` | `var(--duration-slower, .4s)` | `type="split"` content/media entry animation duration |
| `--ui-accordion-media-easing` | `var(--ease-in-out)` | `type="split"` entry easing |
| `--ui-accordion-media-shift` | `0.75rem` | `type="split"` media rise distance on entry |
| `--ui-accordion-media-delay` | `calc(var(--ui-accordion-media-duration) * 0.4)` | Stagger before the text fades in (media leads) |
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
