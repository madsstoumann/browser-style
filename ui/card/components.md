# Components used in the card demos

Every package the demos in [`demo/`](./demo/) and [`index.html`](./index.html) pull in,
grouped by role. Paths are relative to `ui/`, matching how the demos link them
(`../../chip/ui-chip.css`).

## Core — loaded by every demo

| Package | Element / usage | Stylesheet |
|---|---|---|
| `ui/base` | reset, tokens, utilities, `.ui-button`, stagger + animation engine | `base/index.css` |
| `ui/card` | `<ui-card>` · `<ui-media>` · `<ui-content>` | `card/ui-card.css` |
| `ui/carousel` | carousel controls (arrows, dots, pills, thumbs, bands) + Safari polyfill | `carousel/index.css` |
| `layout` | `<lay-out>` · `<lay-out-group>` — section layout, collage grids | `/layout/dist/layout.css` |

## Host

| Package | Element | Stylesheet |
|---|---|---|
| `ui/reveal` | `<ui-reveal>` · `<ui-face>` — disclosure host on `<details>/<summary>` | `reveal/ui-reveal.css` |

## Media furniture — overlaid on `<ui-media>`

| Package | Element | Stylesheet |
|---|---|---|
| `ui/beacon` | `<ui-beacon>` | `beacon/ui-beacon.css` |
| `ui/chip` | `<ui-chip>` | `chip/ui-chip.css` |
| `ui/lightbox` | `<ui-lightbox>` | `lightbox/ui-lightbox.css` |
| `ui/marquee` | `<ui-marquee>` | `marquee/ui-marquee.css` |
| `ui/play` | `<ui-play>` | `play/ui-play.css` |
| `ui/save` | `<ui-save>` | `save/ui-save.css` |
| `ui/sticker` | `<ui-sticker>` | `sticker/ui-sticker.css` |

## Text-area sub-components — inside `<ui-content>`

| Package | Element / usage | Stylesheet |
|---|---|---|
| `ui/accordion` | `<ui-accordion>` — faq / recipe / job presets | `accordion/ui-accordion.css` |
| `ui/avatar` | `<ui-avatar>` — byline images + initials | `avatar/ui-avatar.css` |
| `ui/button-group` | `.ui-button-group` — the product-page size picker (`details.variants.control: "buttons"`) | `button-group/ui-button-group.css` |
| `ui/gradient-text` | `<ui-gradient-text>` | `gradient-text/ui-gradient-text.css` |
| `ui/highlight` | `<high-light>` — pen-marker highlight on inline text | `highlight/ui-highlight.css` |
| `ui/icon` | `<ui-icon>` — reveal + accordion toggles | `icon/index.css` |
| `ui/progress` | bare `<progress>` — poll / comparison parts | `progress/ui-progress.css` |
| `ui/quote` | `<ui-quote>`, `data-part="quote"` | `quote/ui-quote.css` |
| `ui/rating` | `.ui-rating`, `data-part="rating"` | `rating/ui-rating.css` |
| `ui/timeline` | `data-part="timeline"` on an `<ol>` | `timeline/ui-timeline.css` |

## Structural — no package of their own

| Element | Owned by | Notes |
|---|---|---|
| `<cq-box>` | `ui/card` | queryable descendant inside `<ui-card>`; hand-authored, never auto-inserted |
| `<ui-slide>` | `ui/base` (`stagger.css`) | groups several cards into one carousel slide |

## Notes

- **`.ui-button` is not a package.** It ships in `ui/base` (`button.css`, `utility.css`);
  `ui/button` holds docs only (`index.html`, `readme.md`), no CSS.
- **Only `<ui-media>` is a registered custom element** (`ui-media-srcset.js`). Everything
  else here is an unregistered element styled purely by CSS attribute selectors.
- **JS is optional** — demos load `card/index.js` (or `video.js` alone) plus the two
  typed-`attr()` polyfills (`base/polyfills/attr-fallback.js`,
  `layout/polyfills/attr-fallback.js`). Every demo renders without them.
- **Package name ≠ element name in two places:** `ui/highlight` registers `<high-light>`
  (stylesheet `ui-highlight.css`), and `ui/gradient-text` registers `<ui-gradient-text>`.
- **No single demo links everything.** The two widest are
  [`demo/schema.html`](./demo/schema.html) — the text-area set (quote, accordion, avatar,
  timeline, rating, progress, gradient-text, icon, reveal) — and
  [`demo/media.furniture.html`](./demo/media.furniture.html) — the media-furniture set
  (beacon, chip, play, save, sticker, marquee). Neither links the other's packages.
