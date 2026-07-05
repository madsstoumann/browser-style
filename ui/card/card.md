# The Universal Card System

One content model, one preset model, one renderer — recreating all 25 schema.org card
types from the legacy `content/card` package with the modern v4 card engine
(`<ui-card>` + `<ui-media>` + `<ui-content>`), full inline microdata included.

```
┌─────────────────────────┐     ┌──────────────────────────────┐
│ Content (what)          │     │ Preset (how it looks)        │
│ card.schema.json        │ ──▶ │ card-preset.schema.json      │
│ envelope + schemaType   │ ref │ element + variant/media/     │
│ + details               │     │ content attributes           │
└───────────┬─────────────┘     └──────────────┬───────────────┘
            │ UCF instances                    │ instances
            ▼                                  ▼
      data/*.json  ──────────────▶  data/card.presets.json
                        │
                        ▼
                   render.js  ──▶  <ui-card> / <ui-reveal> + microdata
```

## Lineage — the original card systems

| System | Where | What it was |
|--------|-------|-------------|
| Legacy generic renderer | [`content/card/demo/`](../../content/card/demo/index.html) — [`content-card.js`](../../content/card/demo/content-card.js) | One `<content-card>` class, `TYPE_RENDERERS` table, 25 types, token layout language (`card="overlay(bl) ar(21/9)"`), light DOM, microdata |
| Card package | [`content/card/src/`](../../content/card/) → [`dist/`](../../content/card/dist/) | 25 dedicated classes extending `BaseCard`, `<lay-out>` layout system, srcset generation, static SEO pages built with Puppeteer |
| Baseline CMS model | [`cms/baseline/models/content-card.schema.json`](../../cms/baseline/models/content-card.schema.json) | Envelope + one opaque `data` object (editor-card widget) |
| UCM / UCF specs | [`cms/baseline/docs/UCM/`](../../cms/baseline/docs/UCM/) · [`cms/baseline/docs/UCF/`](../../cms/baseline/docs/UCF/) | Unified Content Model (type definitions) and Unified Content Format (content instances) |

Both legacy systems agree on the 25-type taxonomy and emit **microdata only** (no
JSON-LD). This system carries all of that forward onto the v4 primitives.

## The pieces

| File | Role |
|------|------|
| [`cms/baseline/models/card.schema.json`](../../cms/baseline/models/card.schema.json) | **Content model** (UCM). Structured envelope + `schemaType` select (26 values) + `preset` reference + one `details` object per type |
| [`cms/baseline/models/card-preset.schema.json`](../../cms/baseline/models/card-preset.schema.json) | **Preset model** (UCM). The attributes on the host element itself |
| [`data/card.presets.json`](data/card.presets.json) | Preset instances — 15 named looks |
| [`data/*.json`](data/) | 26 UCF card instances (one per schemaType) + [`index.json`](data/index.json) manifest |
| [`render.js`](render.js) | Rendering engine: UCF + presets → DOM with microdata |
| [`render.html`](render.html) | Live demo — all 26 cards rendered from data |
| [`schema.html`](schema.html) | Hand-authored reference markup for every type (the spec render.js follows) |
| [`content.css`](content.css) | `<ui-content>` parts — includes commented stubs for the 8 proposed parts |

## Content model — `card`

The **hybrid** shape: everything shared is structured; everything type-specific
lives in one `details` object discriminated by `schemaType`.

### Envelope fields

| Field | Type | Notes |
|-------|------|-------|
| `internalName` | string | CMS editor label (required, invariant) |
| `schemaType` | select | 26 values — drives itemtype + microdata mapping |
| `preset` | reference → `card-preset` | The look & feel. Swap to restyle |
| `eyebrow` | string | Kicker; → `articleSection`/`category`/`recipeCategory`/`about`/`industry` |
| `headline` | string | → `headline` (article/news), `title` (job), `name` (rest) |
| `subheadline` | string | |
| `summary` | text | → `description` — or `reviewBody` (review), `text` (quote/announcement/social) |
| `body` | richtext | Long-form |
| `published` / `modified` | datetime | → `datePublished`/`dateModified` — `datePosted` for job/announcement |
| `readingTime` | string | |
| `media` | array | `{asset|src, mediaType, alt, caption}` — more than one item ⇒ carousel |
| `authors` | array | `{name, role, avatar}` → byline, `author`/`creator` → Person |
| `tags` | tags | → pill list |
| `actions` | array | `{link, style}` → `data-part="actions"` buttons |
| `links` | array of link | Plain related links |
| `chip` | object | `{text, position, hue}` → `<ui-chip>` (legacy ribbon) |
| `sticker` | object | `{text, position, hue, burst}` → `<ui-sticker>` |
| `saveable` | boolean | → `<ui-save>` toggle |
| `engagement` | object | counts → `InteractionCounter` microdata |
| `details` | object | Type-specific payload (`ui.widget: editor-card`) |
| `flipside` | reference → `card` | Optional custom reveal back panel — see below |

### Flipside — the reveal back panel

`ui-reveal` is a card with an *extra* content area. It does **not** get its own
model — the back panel is handled in two tiers:

1. **Derived (default).** No `flipside` set → the renderer generates the back
   from the card's own envelope + `details`. Reveal stays pure presentation:
   switch the preset from `stack` to `flip` and the card flips, no content
   changes, no migration.
2. **Editorial.** `flipside` references another `card`; its content column
   (envelope + details + actions) becomes the back panel. Rendered one level
   deep as a plain content column — a flipside's own `flipside` (or reveal
   preset) is ignored, so chains cannot recurse.

The flipside shares the host's schema.org itemscope — its itemprops attach to
the host entity. Use the same `schemaType` (or the neutral `content`) so the
microdata stays coherent. Demo: [`data/software.json`](data/software.json) →
[`data/software-flipside.json`](data/software-flipside.json).

### `details` shapes (per schemaType)

Documented in full in the model's `details` description. Examples:

- **product** `{ price:{current,original,currency,discountText}, availability, rating:{value,count,max}, sku, validUntil }`
- **recipe** `{ prepTime, cookTime, servings, ingredients[], instructions[] }` (ISO 8601 durations)
- **faq** `{ items:[{question,answer}] }` — rendered as a nested `<ui-accordion>`
- **poll** `{ options:[{headline,votes}], totalVotes }` — percentages computed by the renderer
- **business** `{ address{…}, telephone, email, website, geo{…}, openingHours:[{schema,display}] }`

Machine values stay schema-ready (`PT15M`, salary numbers, geo coordinates);
`*Display` keys carry pre-formatted strings only where formatting is not derivable.

## Preset model — `card-preset`

> A card has a *configuration*: the attributes on the `<ui-card>` or `<ui-reveal>`
> element itself. A preset is that configuration, named and reusable.

| Field | Applies to | Notes |
|-------|-----------|-------|
| `name`, `description` | both | e.g. “Hero Preset” |
| `element` | both | `ui-card` (default), `ui-reveal` — or `ui-media` / `ui-content` for **bare primitives**: the renderer emits just the media frame or content column, no card chrome. Standalone blocks are presentation, not a separate content model |
| `variant` | both | `col row row-r spl() ovr() vis() thm() rds()` |
| `media` | both | `asr() obf() obp() hov() scm nav() auto loop clip …` — furniture tokens are appended by the renderer from content |
| `content` | both | `scl() pad() gap() scr` |
| `styles` | both | object of CSS custom properties → `style` attribute (e.g. `--ui-reveal-content-bg`) |
| `nav` / `arrow` / `dot` | both | dual-attribute carousel form, written to the `<ui-media>` child (groupable: `arrow="lg drk arr set"`) |
| `type`, `typeLg`, `to`, `icon`, `iconClose`, `from`, `trigger`, `scroll` | ui-reveal | reveal animation (`type-lg` = responsive override, `to="viewport"` = expand popup, `scroll` = boolean panel scrolling) |

Attribute audit across all `ui/card` + `ui/reveal` demos found exactly these on the
host elements: `variant`, `media`, `content`, `type`, `type-lg`, `to`, `icon`,
`icon-close`, `from`, `trigger`, `scroll` (bare boolean), `style`, `class`.
`class` is an instance hook, not preset material. Media-element attributes
(`provider`, `video`, `cdn`, `quality`, `breakpoints`) are per-media-item content
and belong in the card's `media[]` items. Bare booleans like `clip`, `auto`,
`loop`, `stagger`, `eager` are tokens **inside** the `media=` string, not separate
attributes.

### Shipped presets ([`data/card.presets.json`](data/card.presets.json))

| id | Element | Look | Used by (demo data) |
|----|---------|------|---------------------|
| `stack` | ui-card | `col` · 16:9 | content, article, recipe, booking, achievement, social |
| `showcase` | ui-card | `col` · 4:3 | product |
| `split` | ui-card | `row spl(1/2)` · 4:3 | news, course, business |
| `split-reverse` | ui-card | `row-r spl(2/1)` · 1:1 | contact |
| `portrait` | ui-card | `row spl(1/2)` · 1:1 | review |
| `portrait-top` | ui-card | + `obp(tc)` | profile |
| `panel` | ui-card | `vis(content)` | job, poll, faq, timeline, comparison |
| `panel-subtle` | ui-card | + `thm(subtle) scl(lg)` | quote |
| `panel-brand` | ui-card | + `thm(brand)` | statistic, membership |
| `panel-dark` | ui-card | + `thm(dark)` | announcement |
| `hero` | ui-card | `ovr(bl)` · 4:3 · scrim · `scl(lg)` | event |
| `poster` | ui-card | `ovr(bl)` · 3:4 · scrim | location |
| `carousel` | ui-card | `nav(dot)` | gallery |
| `media` | ui-media | bare frame · 21:9 · `rds(lg)` | media-block |
| `prose` | ui-content | bare content column | prose-block |
| `flip` | ui-reveal | flip · `ovr(bl) rds(lg-sq)` · `scroll` | software |
| `hero-reveal` | ui-reveal | expand → scale at lg · 21:9 · dark panel via `styles` | — (from the ui/reveal hero demo) |

Restyling any card = changing its reference:

```json
"preset": { "$ref": "card-preset/hero" }
```

## Renderer — `render.js`

Zero dependencies, ES module, light DOM. All nodes via
`createElement`/`textContent` — **no `innerHTML`**, no XSS surface.

```js
import { renderCard, loadPresets } from './render.js';

const presets = await loadPresets('data/card.presets.json');
const ucf = await (await fetch('data/product.json')).json();
document.querySelector('.grid').append(renderCard(ucf, presets));
```

| Export | Signature | Purpose |
|--------|-----------|---------|
| `renderCard` | `(ucf, presets?, cards?) => HTMLElement` | UCF instance (or bare fields) → `<ui-card>`/`<ui-reveal>`. `cards` = id→UCF map for resolving `flipside` references |
| `renderCardFrom` | `(url, presets?, cards?) => Promise<HTMLElement>` | fetch + render |
| `loadPresets` | `(url) => Promise<object>` | fetch `card.presets.json` → id→preset map |
| `SCHEMA_TYPES` | map | schemaType → schema.org type |

Pipeline: resolve preset → build `<ui-media>` (items; furniture appended with
matching `media=` position/hue tokens) → build `<ui-content>` envelope parts →
run the per-type `DETAILS` renderer → append trailers (byline, tags, actions,
engagement). `preset.element === "ui-reveal"` switches to the reveal composition
(front `<ui-face>`, back panel). Unknown preset refs fall back to a plain stack
card; unknown schemaTypes fall back to CreativeWork.

## Microdata conventions

Followed throughout (`schema.html` is the reference; matched against the legacy
emission in [`content/card/dist/`](../../content/card/dist/)):

- Root: `itemscope itemtype="https://schema.org/{Type}"` on the host element
- Hidden machine values: `<meta itemprop content>`; visible machine values:
  `<data value>` / `<time datetime>` / `content` attribute
- Nested scopes: author→`Person`, offers→`Offer`, rating→`AggregateRating`/`Rating`,
  address→`PostalAddress`, geo→`GeoCoordinates`, steps→`ItemList`+`HowToStep`,
  FAQ→`Question`+`acceptedAnswer`→`Answer`, engagement→`InteractionCounter`
- Type-dependent props: headline → `title` (job) / `headline` (article, news) /
  `name` (rest); summary → `reviewBody` (review) / `text` (quote, announcement,
  social) / `description` (rest); published → `datePosted` (job, announcement)
- Reveal cards keep metas on the root/back panel so microdata survives either face

## Proposed `data-part` vocabulary

Eight parts used by the demos but not yet styled — commented stubs sit at the end
of [`content.css`](content.css):

| part | Element | Used by |
|------|---------|---------|
| `price` | `<p>` + `<data>`/`<del>`/`<small>` | product, course, booking, membership, software, job |
| `rating` | `<div role="img">` stars + count | product, review, software |
| `list` | `<ul>` check / `<ol>` ordered | recipe, job, course, booking, location, membership |
| `address` | `<address>` | business, location, event, contact |
| `stat` | `<p>` + `<data>` + unit + trend | statistic |
| `timeline` | `<ol>` of `<time>` + text | timeline |
| `quote` | `<blockquote>` + `<cite>` | quote, review, social |
| `options` | `<ul>` of `<label>` + `<progress>` | poll, comparison |

Everything else reuses existing parts: `meta` (salaries, hours, dates), `tags`
(skills, hashtags), `byline` (people), `footer` (totals, recommendations).

## Demo pages

| Page | Shows |
|------|-------|
| [`schema.html`](schema.html) | Hand-authored reference — all 26 types with microdata |
| [`render.html`](render.html) | Same 26 cards rendered by `render.js` from UCF data + presets |
| [`index.html`](index.html) · [`media.html`](media.html) · [`content.html`](content.html) · [`carousel.html`](carousel.html) · [`video.html`](video.html) | The card engine itself |
| [`../reveal/index.html`](../reveal/index.html) | Reveal types incl. the hero (source of `hero-reveal` preset) |

Serve from the repo root (absolute `/ui/base/…` and `/assets/…` paths):

```bash
python3 -m http.server 8000 -d .
# → http://localhost:8000/ui/card/render.html
```

## Status / next steps

- [x] Content model, preset model, presets, 26 UCF instances, renderer, demos
- [ ] Style the 8 proposed parts in `content.css`
- [ ] Sync models to a CMS via [UCM](../../cms/baseline/) (`cd cms/unified-content-model && npm run validate`)
- [ ] `editor-card` widget update for the new `details` shapes
- [ ] Video/YouTube media items in `render.js` (currently images; the engine's lite-embed support in [`index.js`](index.js) is the hook)
