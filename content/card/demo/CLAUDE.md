# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What This Is

Standalone demo for the unified `<content-card>` web component. This is **not** the `@browser.style/content-card` npm package — it's a separate, simplified prototype with its own web component (`content-card.js`), its own CSS, and its own data format. The parent package has 25 card classes with Schema.org support and Shadow DOM; this demo has a single class rendering to light DOM.

## Development

No build step, no dependencies. Open `index.html` in a browser or serve with any static server (`npx serve .`). Card data loads from `data/cards.json` via a fetch call in the `<script>` block at the bottom of `index.html`.

## Architecture

### Token-Driven Layout System

Layout is configured via space-separated tokens in HTML attributes:

```html
<content-card content="demo-1"
  card="vertical ar(16/9)"
  card-md="horizontal split(1/2)"
  card-xl="overlay(bl) hs(xl)">
```

- `card` — base layout (no container query)
- `card-md` — applies at container width >= 400px
- `card-xl` — applies at container width >= 700px

**Available tokens:**

| Token | Values | Effect |
|-------|--------|--------|
| layout | `vertical`, `vertical-r`, `horizontal`, `horizontal-r`, `overlay(pos)`, `media-only`, `content-only` | Grid direction |
| `ar()` | Any ratio, e.g. `16/9`, `1/1`, `4/3` | Media aspect ratio via `--card-ar` |
| `split()` | Ratio, e.g. `1/2`, `2/1`, `1/1` | Horizontal column split via fr units |
| `hs()` | `sm`, `md`, `lg`, `xl` | Headline size tier |
| `eyebrow()` | `above`, `outside` | Eyebrow placement (default: inside content) |
| `rg()` | Multiplier | Row gap multiplier for content spacing |
| `subgrid` | flag | Enable CSS subgrid alignment across cards |

Overlay positions use a 2-char grid: `tl`, `tc`, `tr`, `cl`, `cc`, `cr`, `bl`, `bc`, `br`.

### How Tokens Flow

1. `parseTokens()` extracts tokens from attribute string via regex
2. `_applyTokens()` sets CSS custom properties (`--card-ar`, `--card-split`, `--card-hs`, `--card-rg-m`) with breakpoint suffixes
3. CSS in `layouts.css` and `overlays.css` uses attribute selectors (`[card*="horizontal"]`) with container queries to apply grid rules
4. The `clickable` attribute enables stretched-link behavior (entire card clickable when exactly 1 link exists)

### CSS File Responsibilities

| File | Purpose |
|------|---------|
| `base.css` | All `--card-*` custom properties, container query setup (`container-name: card`), `.cc-inner` grid wrapper |
| `content.css` | Content elements: eyebrow, headline, summary, tags, buttons, links, stretched-link |
| `media.css` | Media area: images, captions, ribbons, stickers, gallery carousel |
| `layouts.css` | Layout variants (vertical/horizontal/media-only/content-only/subgrid) repeated for base, `card-md`, `card-xl` |
| `overlays.css` | Overlay mode with 9-position grid and gradient directions, repeated for base, `card-md`, `card-xl` |

### Data Format

`data/cards.json` is a flat array. Each card has:

```json
{
  "id": "demo-1",
  "headline": "...",
  "subheadline": "...",
  "summary": "...",
  "category": "...",
  "media": { "sources": [{ "type": "image", "src": "...", "alt": "..." }], "caption": "..." },
  "tags": [{ "name": "..." }],
  "actions": [{ "text": "...", "style": "primary|secondary", "url": "..." }],
  "links": [{ "url": "...", "text": "..." }],
  "data": { "type": "article", "ribbon": {...}, "sticker": {...} }
}
```

Cards are matched to `<content-card content="demo-1">` elements by `id`.

## Conventions

- CSS classes: `cc-` prefix (e.g. `.cc-media`, `.cc-content`, `.cc-headline`)
- Dark mode: automatic via `light-dark()` CSS function and `color-scheme: light dark`
- CSS nesting: uses `&` syntax throughout
- Container: `content-card` is a size container named `card` (`container-type: inline-size`)
- Schema.org: `SCHEMA_MAP` in `content-card.js` maps card types to schema types, applied automatically via `_applySchema()`
