# 2. Getting started

## Install

```bash
npm install @browser.style/layout @browser.style/base
```

## Load the CSS

Load `base` first, then the layout CSS. Pages that may run in Safari also need the `attr()`
polyfill. It does nothing in browsers that support typed `attr()`.

```html
<link rel="stylesheet" href="/node_modules/@browser.style/base/dist/base.min.css">
<link rel="stylesheet" href="/node_modules/@browser.style/layout/dist/layout.min.css">
<script src="/node_modules/@browser.style/layout/polyfills/attr-fallback.js" defer></script>
```

With a bundler, import the same two files in that order:

```js
import '@browser.style/base/dist/base.css'
import '@browser.style/layout/dist/layout.css'
```

The order matters. Layout builds on base's tokens, and a few layout rules win over base's
only because they load after it.

## Your first layout

```html
<body data-layout-root>
  <lay-out md="columns(2)" lg="columns(3)">
    <article>One</article>
    <article>Two</article>
    <article>Three</article>
  </lay-out>
</body>
```

- Below 540px the three articles stack.
- From 540px (`md`) there are two columns, so the third article starts a new row.
- From 720px (`lg`) there are three columns.

## What happens to the page

As soon as a `<lay-out>` exists, the layout system takes over `<body>`. It centres the page
in a content column with a side gutter on small screens, which is what makes full-width
bands ([Bleed](06-bleed-and-widths.md)) possible. Two custom properties control it:

| Property | Default | Controls |
|---|---|---|
| `--layout-bleed-mw` | `1024px` | The width of the content column |
| `--layout-mi` | `1rem` | The minimum side gutter |

Override them in your own CSS:

```css
:root {
  --layout-bleed-mw: 1200px;
  --layout-mi: 2rem;
}
```

`data-layout-root` on `<body>` (or on the `<main>` that holds your sections) spaces stacked
sections evenly. More in [Spacing](05-spacing.md#space-between-sections).

## The breakpoints

| Attribute | From | Typical device |
|---|---|---|
| `xs` | 0 (always) | The base: every phone |
| `sm` | 380px | Larger phones |
| `md` | 540px | Small tablets, phones in landscape |
| `lg` | 720px | Tablets, small laptops |
| `xl` | 920px | Laptops |
| `xxl` | 1140px | Desktops |

These are **viewport** widths (`@media (min-width)`), and each one applies from its width
upward until a larger breakpoint takes over.

Next: [Breakpoints: a different layout at every width →](03-breakpoints.md)
