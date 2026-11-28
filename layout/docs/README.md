# The layout system guide

This guide explains `@browser.style/layout` from the beginning, using screenshots from the
demo pages in [v4.browser.style/layout/dist](https://v4.browser.style/layout/dist/). Read the chapters in order the first time; after that,
each one stands on its own.

1. [What is the layout system?](01-introduction.md): one element and a handful of
   attributes.
2. [Getting started](02-getting-started.md): install it, load it and build your first layout.
3. [Breakpoints: a different layout at every width](03-breakpoints.md): the idea the whole
   system is built around.
4. [The layouts](04-layouts.md): columns, grid, bento, mosaic, asym, ratio, lanes, auto and
   stack.
5. [Spacing: padding, margins and gaps](05-spacing.md): the spacing tokens, the scale they
   use, and the space between sections.
6. [Bleed and widths](06-bleed-and-widths.md): full-width bands, and content columns
   narrower than the page.
7. [Themes and sections](07-themes-and-sections.md): coloured bands, and section headers
   with `<lay-out-group>`.
8. [Animations](08-animations.md): scroll-driven entrances for the layout and its items.
9. [Carousels](09-carousels.md): turning any layout into a scroller, with or without
   controls.
10. [Configuration and custom builds](10-configuration.md): shipping only the CSS your site
    uses, and checking your markup against it.

The reference documentation sits next to the package: [`../readme.md`](../readme.md) covers
the full API, [`../core/base.md`](../core/base.md) every attribute, and
[`../core/animations.md`](../core/animations.md) every animation.

> **About the screenshots.** They were taken in Chromium from the demo pages in this
> repository, at the viewport widths given under each image. The coloured boxes stand in for
> your content, such as cards, images or text.
