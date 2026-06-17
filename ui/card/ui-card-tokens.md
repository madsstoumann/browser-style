# `ui-card` — Design Tokens

Every visual value in `@browser.style/card` is a CSS custom property with a
built-in fallback, so you override only what you need — globally, per theme, or
per instance:

```css
ui-card { --ui-card-radius: 0; --ui-card-shadow: none; }
```
```html
<ui-card variant="vertical" style="--ui-card-eyebrow-fs: 0.8rem;"> … </ui-card>
```

Tokens fall into two kinds:

- **Knobs** — meant for you to set. Listed with their default.
- **Internal** — written by the `variant` tokens (`ar()`, `op()`, `sp()`,
  `sq()`, `fs()`, `sc()`) or by JS. Don't set these directly; use the variant
  token instead. Collected at the end for reference.

All global tokens referenced as fallbacks (`--color-*`, `--spacing-*`,
`--radius-*`, `--shadow-*`, `--font-weight-*`, …) come from the required
`@browser.style/base` peer dependency.

---

## Card core

| Token | Default | Controls |
|-------|---------|----------|
| `--ui-card-bg` | `var(--color-surface)` | card background |
| `--ui-card-radius` | `var(--radius-2xl)` | corner radius |
| `--ui-card-shadow` | `var(--shadow-xl)` | card shadow |
| `--ui-card-p` | `var(--spacing-md)` | content padding |
| `--ui-card-row-gap` | `1em` | gap between content rows |
| `--ui-card-muted` | `color-mix(in oklab, currentColor 65%, transparent)` | muted text colour (meta, footer, subheadline) |

## Font scale

Two container-driven (`cqi`) `clamp()` scales — a body scale and a more
aggressive headline scale. `fs(sm|md|lg|xl)` swaps which stop is active.

| Token | Default | Controls |
|-------|---------|----------|
| `--ui-card-fs` | `var(--ui-card-fs-md)` | active body font-size |
| `--ui-card-headline` | `var(--ui-card-headline-md)` | active headline font-size |
| `--ui-card-headline-weight` | `var(--font-weight-bold, 700)` | headline weight |

The scale stops `--ui-card-fs-sm/md/lg/xl` and `--ui-card-headline-sm/md/lg/xl`
are overridable too, but you normally pick a stop with `fs()`.

## Media frame

| Token | Default | Controls |
|-------|---------|----------|
| `--ui-card-media-bg` | `var(--color-overlay-light, transparent)` | media placeholder background |
| `--ui-card-media-min` | `12.5rem` | min media height when no `ar()` is set |
| `--ui-card-object-fit` | `cover` | image/video fit |

## Hover effects — `hv()`

| Token | Default | Controls |
|-------|---------|----------|
| `--ui-card-hover-duration` | `var(--duration-slower)` | transition duration |
| `--ui-card-hover-easing` | `var(--ease-out)` | transition easing |
| `--ui-card-hv-zoom` | `1.08` (`hv(zoom)`) / `1.12` (`hv(pan)`,`hv(track)`) | image zoom scale |
| `--ui-card-hv-pan-x` / `--ui-card-hv-pan-y` | `-2%` / `-2%` | `hv(pan)` translate |
| `--ui-card-hv-track` | `4%` | `hv(track)` max cursor offset |
| `--ui-card-hv-track-dur` | `var(--duration-normal)` | `hv(track)` follow duration |
| `--ui-card-hv-lift` | `0.5rem` | `hv(lift)` rise distance |
| `--ui-card-hv-shrink` | `0.97` | `hv(shrink)` scale |
| `--ui-card-hv-tilt` | `-1.5deg` | `hv(tilt)` rotation |

## Carousel — controls

Dots (`::scroll-marker`) and arrows (`::scroll-button`). Chromium-only;
degrade to a bare scroller elsewhere.

| Token | Default | Controls |
|-------|---------|----------|
| `--ui-card-dot-size` | `0.6rem` | dot diameter |
| `--ui-card-dot-bg` | `rgb(255 255 255 / 0.5)` | inactive dot |
| `--ui-card-dot-active` | `#fff` | active dot |
| `--ui-card-dot-border` | `0` | dot border |
| `--ui-card-dots-gap` | `0.5rem` | gap between dots |
| `--ui-card-arrow-size` | `2rem` | arrow button diameter |
| `--ui-card-arrow-bg` | `rgb(255 255 255 / 0.75)` | button fill |
| `--ui-card-arrow-bg-hover` | `rgb(255 255 255 / 0.95)` | button fill on hover |
| `--ui-card-arrow-border` | `0` | button border |
| `--ui-card-arrow-radius` | `var(--radius-circle, 50%)` | button corner |
| `--ui-card-arrow-glyph-size` | `45%` | chevron size (`background-size`) |
| `--ui-card-arrow-prev` / `--ui-card-arrow-next` | inline-SVG chevrons | arrow icon — a `url()` |
| `--ui-card-overlay-gap` | `0.75rem` | inset of dots/arrows **and** ribbon/badge from the frame edge |

## Media overlays — ribbon & badge

| Token | Default | Controls |
|-------|---------|----------|
| `--ui-card-ribbon-bg` | `var(--color-accent)` | ribbon background (also set by `color=""`) |
| `--ui-card-ribbon-ink` | `#fff` | ribbon text |
| `--ui-card-ribbon-weight` | `var(--font-weight-bold, 700)` | ribbon weight |
| `--ui-card-badge-bg` | `var(--color-accent)` | badge background (also set by `color=""`) |
| `--ui-card-badge-ink` | `#fff` | badge text |
| `--ui-card-badge-weight` | `var(--font-weight-medium, 500)` | badge weight |
| `--ui-card-ribbon-diag-width` | `11rem` | diagonal ribbon length |
| `--ui-card-ribbon-diag-offset` | `1.6rem` | diagonal ribbon distance from corner |
| `--ui-card-ribbon-diag-pull` | `3rem` | diagonal ribbon outward pull |

## Overlay & scrim — `ov()` / `sc()`

| Token | Default | Controls |
|-------|---------|----------|
| `--ui-card-overlay-ink` | `#fff` | text colour when content is overlaid on media |
| `--ui-card-scrim-color` | `rgb(0 0 0 / 0.65)` | scrim gradient colour (stays dark in dark mode by design) |

## Scrollable content — `[scroll]`

| Token | Default | Controls |
|-------|---------|----------|
| `--ui-card-scroll-bs` | `100%` | max block-size of a scrollable `<ui-content>` |

## Content parts

Each part takes a font-size token (falling back to a multiple of
`--ui-card-fs`), plus colour / weight / gap where relevant.

| Part | font-size | weight | colour | gap / spacing |
|------|-----------|--------|--------|---------------|
| eyebrow | `--ui-card-eyebrow-fs` *(`fs × 0.78`)* | `--ui-card-eyebrow-weight` *(medium)* | `--ui-card-eyebrow-color` *(`--color-accent`)* | — |
| headline | `--ui-card-headline` | `--ui-card-headline-weight` *(bold)* | inherits | — |
| subheadline | `--ui-card-subheadline-fs` *(`fs × 0.88`)* | `--ui-card-subheadline-weight` *(normal)* | `--ui-card-subheadline-color` *(`--ui-card-muted`)* | — |
| summary | `--ui-card-summary-fs` *(`fs`)* | inherits | `--ui-card-summary-color` *(`inherit`)* | — |
| meta / caption | `--ui-card-meta-fs` *(`fs × 0.75`)* | inherits | `--ui-card-meta-color` *(`--ui-card-muted`)* | — |
| byline | `--ui-card-byline-fs` *(`fs × 0.82`)* | inherits | — | `--ui-card-byline-gap` *(`--spacing-sm`)*, `--ui-card-avatar-size` *(`2.25em`)* |
| tags | `--ui-card-tags-fs` *(`fs × 0.72`)* | inherits | `--ui-card-tag-bg` *(`--color-button`)* / `--ui-card-tag-color` *(`inherit`)* | `--ui-card-tags-gap` *(`--spacing-xs`)*, `--ui-card-tag-padding` *(`0.2em 0.7em`)* |
| actions | — | inherits | — | `--ui-card-actions-gap` *(`--spacing-sm`)* |
| footer | `--ui-card-footer-fs` *(`fs × 0.78`)* | inherits | `--ui-card-footer-color` *(`--ui-card-muted`)* | `--ui-card-footer-gap` *(`--spacing-sm`)* |

## Themes — `th()`

| Token | Default | Controls |
|-------|---------|----------|
| `--ui-card-dark-bg` | `#1f2937` | `th(dark)` background |
| `--ui-card-dark-ink` | `#f9fafb` | `th(dark)` text |
| `--ui-card-dark-accent` | `#93c5fd` | `th(dark)` eyebrow |
| `--ui-card-brand-bg` | `var(--color-accent)` | `th(brand)` background |
| `--ui-card-brand-ink` | `#fff` | `th(brand)` text |

---

## Internal tokens (set by variant tokens / JS — don't set directly)

| Token | Set by | Holds |
|-------|--------|-------|
| `--ui-card-ar` | `ar()` | media `aspect-ratio` |
| `--ui-card-op` | `op()` | image `object-position` |
| `--ui-card-cols` | arrangement | grid columns |
| `--ui-card-split` | `sp()` | `horizontal` column ratio |
| `--ui-card-squircle-exp` | `sq()` | superellipse exponent |
| `--ui-card-fs-sm/md/lg/xl` | `fs()` | body scale stops |
| `--ui-card-headline-sm/md/lg/xl` | `fs()` | headline scale stops |
| `--ui-card-scrim` | `sc(pos)` | explicit scrim gradient |
| `--ui-card-scrim-default` | `ov(pos)` | auto-matched scrim gradient |
| `--ui-card-scrim-c`, `--ui-card-scrim-tl … -br` | engine | computed scrim colour + 9 gradients |
| `--ui-card-mx` / `--ui-card-my` | pointermove handler | `hv(track)` cursor position (-1..1) |
