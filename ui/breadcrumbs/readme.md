# @browser.style/breadcrumbs

A CSS-first breadcrumb navigation component with separator variants. No JavaScript required for the base experience — an optional web component wrapper provides a declarative API for framework integration.

## Features

- Styled `<ol>` with automatic separator characters between items
- Separator variants: default (`›`), `slash`, `dot`, `arrow`
- Custom separator via `--ui-breadcrumbs-separator` token
- Light/dark mode support via design tokens
- Works as plain CSS with `<ol data-breadcrumbs>` or as a `<ui-breadcrumbs>` web component
- RTL support built in
- No JavaScript required for full styling
- `BreadcrumbList` structured data — emitted by the web component, documented for the CSS-only path

---

## Install

```bash
npm install @browser.style/breadcrumbs
```

Peer dependency:

```bash
npm install @browser.style/base
```

> `@browser.style/base` provides the design token system (colors, spacing, typography, etc.).

---

## Usage

### CSS-only (vanilla HTML)

Import the styles, then use a native `<ol>` with `data-breadcrumbs`:

```html
<link rel="stylesheet" href="@browser.style/base/index.css">
<link rel="stylesheet" href="@browser.style/breadcrumbs/index.css">
```

Or via CSS `@import`:

```css
@import '@browser.style/base';
@import '@browser.style/breadcrumbs/style';
```

```html
<nav aria-label="Breadcrumb">
  <ol data-breadcrumbs>
    <li><a href="/books">Books</a></li>
    <li><a href="/books/scifi">Science Fiction</a></li>
    <li>Award Winners</li>
  </ol>
</nav>
```

With a separator variant:

```html
<nav aria-label="Breadcrumb">
  <ol data-breadcrumbs data-variant="slash">
    <li><a href="/books">Books</a></li>
    <li><a href="/books/scifi">Science Fiction</a></li>
    <li>Award Winners</li>
  </ol>
</nav>
```

---

### Web Component

Import the module to register `<ui-breadcrumbs>` and `<ui-breadcrumbs-item>`:

```js
import '@browser.style/breadcrumbs';
```

```html
<ui-breadcrumbs>
  <ui-breadcrumbs-item href="/books">Books</ui-breadcrumbs-item>
  <ui-breadcrumbs-item href="/books/scifi">Science Fiction</ui-breadcrumbs-item>
  <ui-breadcrumbs-item>Award Winners</ui-breadcrumbs-item>
</ui-breadcrumbs>
```

The web component renders native `<li>` (with optional `<a>`) elements into the light DOM. `<ui-breadcrumbs>` automatically sets `role="navigation"` and `aria-label="Breadcrumb"`.

You can also use native `<li>` elements directly:

```html
<ui-breadcrumbs>
  <li><a href="/books">Books</a></li>
  <li><a href="/books/scifi">Science Fiction</a></li>
  <li>Award Winners</li>
</ui-breadcrumbs>
```

#### Attributes

**`<ui-breadcrumbs>`**

| Attribute | Type | Description |
|-----------|------|-------------|
| `variant` | string | Separator style: `slash`, `dot`, or `arrow` |

**`<ui-breadcrumbs-item>`**

| Attribute | Type | Description |
|-----------|------|-------------|
| `href` | string | Link URL. If omitted, renders as plain text (typically the current page) |

---

### React

```jsx
import '@browser.style/breadcrumbs';
import '@browser.style/base';
import '@browser.style/breadcrumbs/style';

function Breadcrumbs() {
  return (
    <ui-breadcrumbs variant="slash">
      <ui-breadcrumbs-item href="/books">Books</ui-breadcrumbs-item>
      <ui-breadcrumbs-item href="/books/scifi">Science Fiction</ui-breadcrumbs-item>
      <ui-breadcrumbs-item>Award Winners</ui-breadcrumbs-item>
    </ui-breadcrumbs>
  );
}
```

> React 19+ handles custom elements natively. For React 18, custom element attributes work in JSX but you may need `ref` for setting properties.

---

### Vue

```vue
<script setup>
import '@browser.style/breadcrumbs';
import '@browser.style/base';
import '@browser.style/breadcrumbs/style';
</script>

<template>
  <ui-breadcrumbs variant="slash">
    <ui-breadcrumbs-item href="/books">Books</ui-breadcrumbs-item>
    <ui-breadcrumbs-item href="/books/scifi">Science Fiction</ui-breadcrumbs-item>
    <ui-breadcrumbs-item>Award Winners</ui-breadcrumbs-item>
  </ui-breadcrumbs>
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
  import '@browser.style/breadcrumbs';
  import '@browser.style/base';
  import '@browser.style/breadcrumbs/style';
</script>

<ui-breadcrumbs variant="slash">
  <ui-breadcrumbs-item href="/books">Books</ui-breadcrumbs-item>
  <ui-breadcrumbs-item href="/books/scifi">Science Fiction</ui-breadcrumbs-item>
  <ui-breadcrumbs-item>Award Winners</ui-breadcrumbs-item>
</ui-breadcrumbs>
```

---

### Astro / Server-rendered HTML

Use the CSS-only approach with `data-breadcrumbs`:

```html
<link rel="stylesheet" href="@browser.style/base/index.css">
<link rel="stylesheet" href="@browser.style/breadcrumbs/index.css">

<nav aria-label="Breadcrumb">
  <ol data-breadcrumbs>
    <li><a href="/books">Books</a></li>
    <li><a href="/books/scifi">Science Fiction</a></li>
    <li>Award Winners</li>
  </ol>
</nav>
```

Add the web component script only if you want the `<ui-breadcrumbs-item>` declarative API:

```html
<script type="module">
  import '@browser.style/breadcrumbs';
</script>
```

---

## Variants

### Default (guillemet `›`)

```html
<ol data-breadcrumbs>
  <li><a href="/">Home</a></li>
  <li><a href="/products">Products</a></li>
  <li>Details</li>
</ol>
```

### Slash (`/`)

```html
<ol data-breadcrumbs data-variant="slash">
  <li><a href="/">Home</a></li>
  <li><a href="/products">Products</a></li>
  <li>Details</li>
</ol>
```

### Dot (`·`)

```html
<ol data-breadcrumbs data-variant="dot">
  <li><a href="/">Home</a></li>
  <li><a href="/products">Products</a></li>
  <li>Details</li>
</ol>
```

### Arrow (`→`)

```html
<ol data-breadcrumbs data-variant="arrow">
  <li><a href="/">Home</a></li>
  <li><a href="/products">Products</a></li>
  <li>Details</li>
</ol>
```

### Custom separator

Use the `--ui-breadcrumbs-separator` token for any custom character:

```html
<ol data-breadcrumbs style="--ui-breadcrumbs-separator: '|';">
  <li><a href="/">Home</a></li>
  <li>Current</li>
</ol>
```

---

## Customization

### Design tokens

Override global tokens to theme all breadcrumbs:

```css
:root {
  --color-text-muted: #6b7280;
}
```

### Component tokens

Override breadcrumbs-specific tokens for targeted changes:

```css
ui-breadcrumbs {
  --ui-breadcrumbs-separator: '|';
  --ui-breadcrumbs-gap: .5ch;
  --ui-breadcrumbs-link-color: #1d4ed8;
}
```

### All component tokens

| Token | Default | Description |
|-------|---------|-------------|
| `--ui-breadcrumbs-separator` | `'\203A'` (`›`) | Separator character between items |
| `--ui-breadcrumbs-separator-color` | `var(--color-text-muted)` | Color of the separator |
| `--ui-breadcrumbs-separator-font-size` | `1.25em` | Font size of the separator |
| `--ui-breadcrumbs-link-color` | `var(--color-text-muted)` | Color of breadcrumb links |
| `--ui-breadcrumbs-underline-offset` | `.5em` | Underline offset on hover |
| `--ui-breadcrumbs-gap` | `.25ch .5ch` | Inline margin around the separator |
| `--ui-breadcrumbs-align` | `baseline` | Vertical alignment of items |

---

## Structured data

Breadcrumbs are one of Google's rich results, and the markup for it is `BreadcrumbList`
microdata. **The web component emits it for you**; on the CSS-only path it is hand-authored,
because CSS cannot add attributes.

The canonical form — the list is the `BreadcrumbList`, each `<li>` a `ListItem`, and the label
goes in a `<span itemprop="name">` *inside* the link so the `name` belongs to the list item and
not to the URL:

```html
<nav aria-label="Breadcrumb">
  <ol data-breadcrumbs itemscope itemtype="https://schema.org/BreadcrumbList">
    <li itemprop="itemListElement" itemscope itemtype="https://schema.org/ListItem">
      <a itemprop="item" href="/books"><span itemprop="name">Books</span></a>
      <meta itemprop="position" content="1">
    </li>
    <li itemprop="itemListElement" itemscope itemtype="https://schema.org/ListItem">
      <a itemprop="item" href="/books/scifi"><span itemprop="name">Science Fiction</span></a>
      <meta itemprop="position" content="2">
    </li>
    <li itemprop="itemListElement" itemscope itemtype="https://schema.org/ListItem">
      <span itemprop="name">Award Winners</span>
      <meta itemprop="position" content="3">
    </li>
  </ol>
</nav>
```

Two rules are easy to get wrong:

- **`position` starts at 1 and must not skip.** The component derives it from the item's
  position among its siblings, so it stays correct no matter what order the custom elements
  upgrade in.
- **The last crumb takes no `item`.** It is the current page, and Google expects it linkless —
  which is also the accessibility guidance below, so the two agree.

**The list scope is opened by the first `<ui-breadcrumbs-item>`, not by the host.** That is
deliberate, and it is what makes mixing safe: `<ui-breadcrumbs>` also accepts plain `<li>`
children, and a host that stamped `BreadcrumbList` unconditionally would publish an *empty*
list around them — a `BreadcrumbList` with no `itemListElement`, which is an error. It also
sidesteps a timing trap: a host upgrading mid-parse cannot see its own children yet. An
`itemscope` you put on the host yourself always wins, so a breadcrumb nested inside another
item scope stays under your control.

---

## Accessibility

- Use `<nav aria-label="Breadcrumb">` wrapper for CSS-only mode (added automatically by the web component)
- Built on native `<ol>` + `<li>` — screen readers announce list structure
- Last item (current page) should omit the `<a>` link
- Consider adding `aria-current="page"` to the last item for explicit current-page semantics
- Works with JavaScript disabled (CSS-only mode)

---

## Browser support

- All modern browsers (Chrome, Firefox, Safari, Edge)
- `color-mix()`: Chrome 111+, Firefox 113+, Safari 16.2+
- Graceful degradation: separator characters work in all browsers
