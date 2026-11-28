# 1. What is the layout system?

Most pages are built from the same kind of building block: a section holding a few items in
a grid, such as three news stories, a product row, a hero with two teasers, or a gallery.
The layout system gives you that building block as one HTML element, `<lay-out>`, and you
describe its arrangement with attributes:

```html
<lay-out md="columns(2)" lg="bento(6a)">
  <article>…</article>
  <article>…</article>
  <article>…</article>
  <article>…</article>
  <article>…</article>
  <article>…</article>
</lay-out>
```

Read the attributes like a sentence: *"from medium screens, two columns; from large screens,
the bento pattern called 6a."* Below medium, the items simply stack, one per row.

The children can be anything: cards, images, plain text or another `<lay-out>`.

## What you get

**Layouts as a vocabulary.** More than 60 named arrangements, from plain columns to bento
boxes, mosaics and masonry lanes. You pick a layout by name. See [The layouts](04-layouts.md).

**A different layout at every breakpoint.** Each breakpoint attribute (`xs`, `sm`, `md`,
`lg`, `xl`, `xxl`) can hold a *completely different* layout, not just a different column
count. See [Breakpoints](03-breakpoints.md).

**Spacing on the same attributes.** Padding, margins and gaps are short tokens in the same
attribute: `lg="columns(3) cg(2) pb(3)"`. See [Spacing](05-spacing.md).

**Page-level features.** Full-width bands (`bleed`), content widths (`width`), colour themes
(`theme`), section headers (`<lay-out-group>`), scroll animations (`animate`) and carousels
(`overflow`). Each has its own chapter.

**CSS you can trim.** The stylesheet is generated from a config file. The default build
includes everything; a site build can include only the layouts and spacing it uses. See
[Configuration](10-configuration.md).

## How it works, briefly

`<lay-out>` is a CSS grid. Each layout name turns into a few custom properties: the column
template and, for patterned layouts, where each child goes. The breakpoint attributes are
matched by attribute selectors inside `@media` rules, so the arrangement changes as the
viewport grows.

All of it lives in CSS cascade layers (`@layer layout.*`) and uses zero-specificity
selectors, so your own CSS can override anything without `!important`.

## What it needs

- **[`@browser.style/base`](../../ui/base/)**, loaded before `layout.css`. It provides the
  design tokens, the colour themes and the animation engine.
- **Browsers:** Chrome 150+ and Safari 26.5+. Safari doesn't support typed `attr()` yet, so
  pages load a small polyfill (see [Getting started](02-getting-started.md)). Firefox isn't
  a support target.
- **Optional:** [`@browser.style/carousel`](../../ui/carousel/) for carousel controls, and
  [`@browser.style/card`](../../ui/card/) for the section-header typography in
  `<lay-out-group>`.

Next: [Getting started →](02-getting-started.md)
