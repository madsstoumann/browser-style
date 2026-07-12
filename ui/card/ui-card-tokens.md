# `ui-card` — Design Tokens

`<ui-card>` is the **composition layer** over two primitives:

- `<ui-media>` — the media frame, carousel, scrim, and overlay furniture. Its `media=` DSL and `--ui-media-*` tokens are documented in **[media.md](media.md)**.
- `<ui-content>` — the text column and its parts. Its `content=` DSL and `--ui-content-*` tokens are documented in **[content.md](content.md)**.

This file covers only the **card-level** tokens: the host surface, the media↔content arrangement (`variant=`), the overlay bridge (`ovr()`), themes (`thm()`), and corners (`rds()`). Every value is a CSS custom property with a built-in fallback, so override only what you need:

```css
ui-card { --ui-card-radius: 0; --ui-card-shadow: none; }
```
```html
<ui-card variant="row spl(1/2) rds(lg)" media="asr(4/3)" content="scl(lg) pad(lg)"> … </ui-card>
```

All global fallbacks (`--color-*`, `--spacing-*`, `--radius-*`, `--shadow-*`, …) come from the required `@browser.style/base` peer dependency.

---

## Host surface

| Token | Default | Controls |
|-------|---------|----------|
| `--ui-card-bg` | `var(--color-surface)` | card background (also set by `thm()`) |
| `--ui-card-radius` | `var(--radius-2xl)` | corner radius (set with `rds()`) |
| `--ui-card-shadow` | `var(--shadow-xl)` | card shadow |

The card is `display: grid` + `container-type: inline-size` + `overflow: hidden`. Children are wrapped in a `<cq-box>` (the queryable descendant for container queries); its grid columns come from `--ui-card-cols`.

## Arrangement — `variant=`

The `variant=` string composes the media and content primitives. Tokens are **whole-token** matched (`~=`), so `md:`/`lg:` prefixes don't collide with the base form.

| Token | Effect |
|-------|--------|
| `col` *(default)* | content below media (single column) |
| `col-r` | content **above** media (reversed column; `ui-content { order: -1 }`) |
| `row` | media \| content side by side (`--ui-card-cols: --ui-card-split`) |
| `row-r` | content \| media (reversed row) |
| `spl(1/1 · 1/2 · 2/1 · 1/3 · 3/1)` | column ratio for `row`/`row-r` (writes `--ui-card-split`) |
| `vis(media)` | show only the media (hide `<ui-content>`) |
| `vis(content)` | show only the content (hide `<ui-media>`) |

**Responsive:** `col` `col-r` `row` `row-r` `spl()` `vis()` accept `md:` (≥ 25rem) and `lg:` (≥ 44rem) container-query prefixes, e.g. `variant="col md:row lg:spl(1/2)"`. (Content spacing `gap()`/`pad()` are also prefixable — see [content.md](content.md). `media=` tokens and `scl()` are **not** prefixed this round.)

## Overlay — `ovr()`

Stacks `<ui-content>` over `<ui-media>` (same grid cell) and places + aligns it at one of nine positions. Also sets the matching default scrim direction (paint it with `scm` on `media=`) and the overlay ink.

| Token | Default | Controls |
|-------|---------|----------|
| `--ui-card-overlay-ink` | `#fff` | text colour when content is overlaid (`--ui-content-ov-ink`) |

`ovr(tl … br)` — nine positions (`tl tc tr · cl cc cr · bl br …`). Each sets `--ui-content-ov-justify/-align/-text` and `--ui-media-scrim-default` to the matching gradient.

## Corners — `rds()`

| Token | Default | Controls |
|-------|---------|----------|
| `--ui-card-radius` | `var(--radius-2xl)` | corner radius |
| `--ui-card-squircle-exp` | `1.8` | superellipse exponent for `-sq` variants |

- **Round** (global radius scale): `rds(none · sm · md · lg · xl · 2xl · full · pill)`.
- **Squircle** (bespoke radius + `corner-shape: superellipse()`): `rds(sm-sq · md-sq · lg-sq · xl-sq)` → radii `1.25 / 2 / 2.8 / 3.5rem` with exponents `1.5 / 1.7 / 1.8 / 2`. `ui-reveal` reads `--ui-card-squircle-exp` to apply the same corner-shape to its `<details>`.

## Themes — `thm()`

Decorative background + ink bundles. Ink tokens cross into the `<ui-content>` namespace (muted / eyebrow / tag) so parts re-tone automatically.

| Token | Default | Controls |
|-------|---------|----------|
| `--ui-card-dark-bg` | `#1f2937` | `thm(dark)` background |
| `--ui-card-dark-ink` | `#f9fafb` | `thm(dark)` text |
| `--ui-card-dark-accent` | `#93c5fd` | `thm(dark)` eyebrow |
| `--ui-card-subtle-bg` | `var(--color-surface-alt)` | `thm(subtle)` background |
| `--ui-card-subtle-ink` | `var(--color-text)` | `thm(subtle)` text |

> The overlay-furniture **sub-themes** (`chip(red)`, `sticker(green)`, …) are a separate, hue-based palette routed via `media=` — see [media.md](media.md). `thm()` is the card-surface theme; the sub-theme keys colour individual overlay elements.

---

## Internal tokens (written by `variant=` — don't set directly)

| Token | Set by | Holds |
|-------|--------|-------|
| `--ui-card-cols` | arrangement | `<cq-box>` grid columns |
| `--ui-card-split` | `spl()` | row column ratio |
| `--ui-card-stack` | `ovr()` | `1 / 1` grid area to overlay media + content |
| `--ui-card-squircle-exp` | `rds(*-sq)` | superellipse exponent |
