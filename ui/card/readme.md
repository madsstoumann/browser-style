# @browser.style/card

A CSS-first card engine. Every card is an arrangement of two structural
elements — `<ui-media>` and `<ui-content>` — so a card can be media-only,
content-only, media above/below content, or content over media (overlay).

Layout, aspect-ratio, object-position and font-size are controlled with
space-separated `variant` tokens. No JavaScript required.

The engine is **host-agnostic**: it keys off the `variant` attribute and the
`<ui-media>` / `<ui-content>` elements, never the `ui-card` tag. That lets other
components — like [`@browser.style/reveal`](../reveal) — `@import` this stylesheet
and inherit the whole layout/typography engine.

## Install

```bash
npm install @browser.style/card @browser.style/base
```

```css
@import '@browser.style/base';
@import '@browser.style/card';
```

`@browser.style/base` is a required peer dependency — it provides the global
design tokens (`--color-*`, `--spacing-*`, `--radius-*`, …).

## Anatomy

```html
<ui-card variant="vertical ar(16/9) fs(md)">
  <ui-media>
    <img src="…" alt="">
  </ui-media>
  <ui-content>
    <small data-part="eyebrow">Category</small>
    <h2 data-part="headline">Headline</h2>
    <p data-part="subheadline">Subheadline</p>
    <p data-part="summary">A short description.</p>
    <ul data-part="tags"><li><a href="#">Tag</a></li></ul>
    <nav data-part="actions"><a class="ui-button" href="#">Read</a></nav>
  </ui-content>
</ui-card>
```

Common parts are styled by the **`data-part`** attribute, not by tag name, so you
pick the semantically correct element for the context (a `<p>` in a card body, a
`<span>` inside a `<summary>`). Recognised parts: `eyebrow`, `headline`,
`subheadline`, `summary`, `byline`, `meta`, `caption`, `tags`, `actions`, `footer`.
Headings (`h2`–`h6`) inside `<ui-content>` also get the headline ramp by default.

## Variant tokens

Put them all in one space-separated `variant` attribute.

### Arrangement

| Token | Result |
|-------|--------|
| *(none)* / `vertical` | media above content (default) |
| `vertical-r` | content above media |
| `horizontal` | media left, content right |
| `horizontal-r` | content left, media right |
| `media-only` | media fills; content hidden |
| `content-only` | no media box |
| `overlay(pos)` | content stacked on media — 9 positions |

`overlay(pos)` positions: `tl tc tr · cl cc cr · bl bc br`.

### Modifiers

| Token | Effect |
|-------|--------|
| `ar(16/9 \| 1/1 \| 4/3 \| 3/4 \| 3/2 \| 2/3 \| 21/9 \| square \| portrait \| landscape \| panorama)` | media aspect-ratio |
| `op(tl…br)` | image object-position (9 positions) |
| `fs(sm \| md \| lg \| xl)` | font-size tier (see below) |
| `split(1/1 \| 1/2 \| 2/1 \| 1/3 \| 3/1)` | column ratio for `horizontal` |
| `sq(sm \| md \| lg \| xl)` | superellipse (squircle) corners |

## Font scale — `fs()`

One root token, `--ui-card-fs`, drives every part by ratio. Each tier is a
`clamp()` using container-query units (`cqi`), so a card **grows in wide
containers and shrinks in narrow ones** — bounded between a min and max.

```html
<!-- identical markup; renders larger in a wide hero than in a 3-up grid -->
<ui-card variant="overlay(bl) ar(21/9) fs(xl)"> … </ui-card>
```

`fs(xl)` is a hero/display tier (larger clamp + bigger headline ratio).
`fs(md)` is the default.

## Theming

Override any component token, globally or per instance:

```css
ui-card { --ui-card-radius: 0; --ui-card-shadow: none; }
```

```html
<ui-card variant="vertical" style="--ui-card-headline-ratio: 2.4;"> … </ui-card>
```

Key tokens: `--ui-card-bg`, `--ui-card-radius`, `--ui-card-shadow`, `--ui-card-p`,
`--ui-card-row-gap`, `--ui-card-fs`, `--ui-card-headline-ratio`,
`--ui-card-eyebrow-color`, `--ui-card-overlay-gradient`, `--ui-card-overlay-ink`.

## Notes

- **CSS-only.** No web component ships in this version.
- **Schema.org** microdata and the 25 type-specific parts (price, rating,
  recipe steps, …) live at a higher layer and are not part of this engine.
- **Responsive tiers** (`variant-md` / `variant-lg`) need a queryable descendant
  (`<cq-box>`) since a container can't query itself; deferred to a future pass.

## Used by

- [`@browser.style/reveal`](../reveal) — `@import`s `ui-card.css` and adds
  `<details>`/`<summary>` reveal animations on top of the shared engine.
