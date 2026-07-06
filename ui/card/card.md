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
| `media` | array | `{asset|src, mediaType: image|video|youtube|vimeo, alt, caption}` — more than one item ⇒ carousel. Video items also take `{autoplay, muted, loop, controls, poster}`; youtube/vimeo items set `provider`/`video` lite-embed attributes on the frame |
| `authors` | array | `{name, role, avatar}` → byline, `author`/`creator` → Person |
| `tags` | tags | → pill list |
| `actions` | array | `{link, style}` → `data-part="actions"` buttons |
| `links` | array of link | Plain related links |
| `chip` | object | `{text, position, hue}` → `<ui-chip>` (legacy ribbon) |
| `sticker` | object | `{text, position, hue, burst}` → `<ui-sticker>` |
| `play` | object | `{position, hue, size}` → `<ui-play>` button (videos, autoplay carousels) |
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
| `text` | both | which long text the content column shows: `summary` (teaser — default), `body` (full view — body **instead of** summary, with the summary kept as a hidden `description` meta), `both`. Reveal back panels always render both |
| `styles` | both | object of CSS custom properties → `style` attribute (e.g. `--ui-reveal-content-bg`) |
| `nav` / `arrow` / `dot` | both | dual-attribute carousel form, written to the `<ui-media>` child (groupable: `arrow="lg drk arr set"`) |
| `reveal` | ui-reveal | nested object grouping the reveal-only config: `{ type, typeLg, to, icon, iconType, iconClose, from, trigger, scroll }`. Keys map 1:1 to attributes (`typeLg` → `type-lg=`); `scroll` is a boolean; `iconType` sets the toggle glyph — `plus-cross` (default) or directional `{up,down,left,right}-arrow-cross`, pairing with slide direction (panel from top → `down-arrow-cross`, etc.) |

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

A second collection, [`data/card.presets.demo.json`](data/card.presets.demo.json),
holds **121 demo presets** extracted 1:1 from the original demo pages
(`media-*`, `carousel-*`, `video-*`, `reveal-*` key prefixes) — every distinct
attribute combination those pages use, powering the `*.render.html` recreations.

## Renderer — `render.js`

Zero dependencies, ES module, **SSR string engine** (v2): template literals
returning HTML strings, no `document` usage — runs unchanged in Node or the
browser.

**Security model:** every interpolated value passes `esc()` (`& < > "`); the
single deliberate exception is the headline, where `renderInline()` re-allows
`<b>` only (the gradient-highlight marker). Output is therefore safe to
`insertAdjacentHTML`/stream by construction. `format: "html"` richtext is never
rendered — bodies are paragraph-split plain text.

```js
import { renderCard, loadPresets } from './render.js';

const presets = await loadPresets('data/card.presets.json');
const ucf = await (await fetch('data/product.json')).json();
grid.insertAdjacentHTML('beforeend', renderCard(ucf, presets));
```

| Export | Signature | Purpose |
|--------|-----------|---------|
| `renderCard` | `(ucf, presets?, cards?) => string` | UCF instance (or bare fields) → HTML for `<ui-card>`/`<ui-reveal>`/bare primitive. `cards` = id→UCF map for resolving `flipside` references |
| `renderCardFrom` | `(url, presets?, cards?) => Promise<string>` | fetch + render |
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
- **VideoObject** (matching the legacy emission): native video items carry the
  scope on the `<video>` element itself with `<meta>` children as fallback
  content — `name` (alt), `contentUrl`, `thumbnailUrl` (poster), `uploadDate`,
  `duration`, `description`. Provider embeds (youtube/vimeo) emit a hidden
  `<div itemprop="video" itemscope …VideoObject>` in the content column with
  `embedUrl` + `thumbnailUrl` (`i.ytimg.com/vi/{id}/hqdefault.jpg` for YouTube)
- **articleBody**: for `article`/`news` the `body` paragraphs are wrapped in
  `<div itemprop="articleBody">`. Teaser/full is a preset decision — the `text`
  field: cards show the `summary` only; a `text: "body"` preset (e.g. `prose`)
  shows the body *instead*, keeping the summary as a hidden `description` meta
- **Gradient headline**: `headline` is short rich text (≤256 chars, model-enforced);
  inline `<b>` renders as gradient text via `--ui-content-headline-gradient`
  (rule in content.css); all other markup is escaped
- **Blockquote**: quote parts compose with `@browser.style/blockquote` —
  `<blockquote data-part="quote" data-variant="bigquote"><q>…</q><cite>…</cite></blockquote>`
  (quote), bare `data-variant` (review), plain (social); pages import
  `../blockquote/ui-blockquote.css`

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

Two parts are already **implemented** in content.css: the gradient-headline `b`
rule, and `cover` — an `<a data-part="cover">` inside the headline whose
`::after` covers the whole card (the clickable-card link; see the Article
pattern below).

## Navigation models and ui-accordion / ui-tabs (assessment)

Can `navigation` / `navigation-item` ([models](../../cms/baseline/models/navigation.schema.json))
drive `<ui-accordion>` and `<ui-tabs>`? **Yes for menu-style uses — and one
mapping serves both components**, because accordion and tabs share the exact
same inner markup (`cq-box > details > summary + panel`) and morph via the
`tabs="<variant tokens>"` attribute (`--_render` container-style query).

| navigation-item field | maps to |
|----------------------|---------|
| `label` | `<summary>` text |
| `badge` | `<sup>` / `<ui-chip>` inside the summary |
| `description` | panel paragraph |
| `url` / `page` (ref) | panel link (`page` needs URL resolution) |
| `children` (self-nesting refs) | panel link list; nested `group` items → sub-sections |
| `icon` / `image` (media) | summary icon / panel image (needs asset resolution) |
| `is_featured` | e.g. `open` on the details, or a featured style hook |

Example shape (one `navigation` with `group`-type items → tabs mega-menu):

```html
<ui-accordion tabs="pill panel expanded" group="main-header">
  <cq-box>
    <details name="main-header"><summary>Components <sup>new</sup></summary>
      <div><p>{description}</p><a href="{url}">…</a> <!-- + children links --></div>
    </details>…
  </cq-box>
</ui-accordion>
```

**Gaps:** `description` is plain `text`, not richtext — panels can't carry rich
content; `page` references and media assets need resolution; there's no
per-item `open`/variant control on the model. **Verdict:** navigation models
fit *navigational* accordions/tabs (menus, footers, mega-menus — UCF instances
already exist in [`cms/baseline/content/navigation/`](../../cms/baseline/content/navigation/)).
*Content* accordions (FAQ, recipe steps, job requirements) stay in the card's
`details.items` — they are card content, not site structure. No renderer code
for this yet; a `renderNavigation(nav, items, { as, variant })` export is the
natural next step if needed.

## Article pattern — teaser card → full-page view

One `card` instance serves both states; presets and view-transition names do the
rest ([`article.render.html`](article.render.html) is the working demo):

- **Teaser (grid).** The card's preset defaults to `text: "summary"` — the short
  description shows, the `body` never renders.
- **Full view.** The *same UCF* re-renders through the two bare presets:
  `media` (hero frame) + `prose` (`text: "body"` — the body renders **instead
  of** the summary, wrapped in `itemprop="articleBody"`; the summary survives as
  a hidden `description` meta). Zero article-specific renderer code.
- **Morph — cross-document, both directions.** Every article has its *own page*
  under [`articles/`](articles/). Both documents opt in with
  `@view-transition { navigation: auto; }` and carry matching per-article
  `view-transition-name`s, nested: `card-{id}` on the grid `<ui-card>` *and* on
  the article page's `<article>` container, `hero-{id}` on the media `<img>` in
  both — the whole card morphs into the page across the navigation while the
  image morphs within it, and morphs back on the “← All articles” link or the
  browser Back button. The article surface gets card chrome
  (`--ui-card-bg`/`--ui-card-radius` + padding) so it reads as the card
  growing. Non-clicked cards have unique names and simply fade.
- **Names via `data-view` + CSS `attr()` — built into ui-card.css, no inline
  styles.** The view-transition machinery lives at the end of
  [`ui-card.css`](ui-card.css) (outside `@layer` — `@view-transition` is a
  top-level at-rule), so it works for *any* card on *any* page that imports it:
  add `data-view` to a card (and optionally its `<img>`), a matching one on the
  target page's container, link the pages with a regular `<a>` — done.

  ```css
  @view-transition { navigation: auto; }
  [data-view] { view-transition-name: attr(data-view type(<custom-ident>), none); }
  ```
  ```html
  <ui-card data-view="card-article-1">… <img data-view="hero-article-1" …>
  ```
  Group timing is tokenized: `--ui-card-vt-duration` (0.4s) and
  `--ui-card-vt-easing`, gated behind `prefers-reduced-motion`. Advanced
  `attr()` is Chromium 133+; where unsupported the name resolves to `none` and
  the navigation degrades to a plain crossfade/instant swap. Markup stays
  strict-CSP clean — no `style=` attributes anywhere.
- **Static markup on BOTH sides — this is what makes the morph reliable.**
  [`articles/build.js`](articles/build.js) (`node ui/card/articles/build.js`)
  pre-renders the grid page *and* every article page through `render.js` — the
  SSR engine returning strings needs no DOM. A cross-document view transition
  captures the incoming page at first render: client-fetched content isn't
  there yet, names are missing, and the browser silently falls back to a root
  crossfade (`blocking="render"` on an inline module did not rescue the capture
  in Chromium). Fully static pages have no race — verified: forward, backlink
  and browser-Back all animate `::view-transition-group(card-{id})` +
  `(hero-{id})`, not just root.
- **Navigation — regular links via the `cover` part.** The card headline is a
  real `<a data-part="cover" href="articles/{name}.html">` — a part like every
  other (no classes), styled in [`content.css`](content.css): its `::after`
  covers the card (the legacy content-card "clickable" pattern). The link stays
  where it belongs semantically — inside the headline — so there are **no
  nested anchors**; the card's own links (tag pills, actions) stay clickable
  above it via `z-index`:

  ```css
  :where(ui-card):has([data-part~="cover"]) { position: relative; }
  :where(ui-content) [data-part~="cover"]::after {
    content: '';
    inset: 0;
    position: absolute;
    z-index: 1;
  }
  /* tags/actions links sit above the cover surface (z-index: 2) */
  ```

  The article page carries a plain “← All articles” backlink to
  `article.render.html`; browser Back morphs in reverse. Keyboard,
  middle-click and prefetching all behave — the whole demo cluster contains
  **zero runtime JavaScript**.
- **Furniture rides along.** Chips/stickers come from content, not the preset —
  the news card's "Breaking" chip appears in the full view automatically.

Fallback: browsers without cross-document view transitions get a normal
navigation; `prefers-reduced-motion` keeps default timing.

## Demo pages

| Page | Shows |
|------|-------|
| [`schema.html`](schema.html) | Hand-authored reference — all 26 types with microdata |
| [`render.html`](render.html) | Same 26 cards rendered by `render.js` from UCF data + presets |
| [`media.render.html`](media.render.html) · [`carousel.render.html`](carousel.render.html) · [`video.render.html`](video.render.html) · [`reveal.render.html`](reveal.render.html) | The original demo pages recreated data-driven: presets from [`data/card.presets.demo.json`](data/card.presets.demo.json) (121 presets extracted from the originals) + UCF instances in [`data/demo/`](data/demo/). Each page lists its not-expressible demos in a bottom note |
| [`article.render.html`](article.render.html) + [`articles/`](articles/) | The article pattern above, live and **fully static** (pre-rendered by `articles/build.js`): teaser cards with stretched-link headlines → cross-document view transition morphs the whole card into the per-article page and back (`card-{id}` + nested `hero-{id}` names via `data-view` + CSS `attr()`), body-instead-of-summary via the `prose` preset, plain `<a>` navigation, zero runtime JS |
| [`index.html`](index.html) · [`media.html`](media.html) · [`content.html`](content.html) · [`carousel.html`](carousel.html) · [`video.html`](video.html) | The card engine itself (hand-authored originals) |
| [`../reveal/index.html`](../reveal/index.html) | Reveal types incl. the hero (source of `hero-reveal` preset) |

Serve from the repo root (absolute `/ui/base/…` and `/assets/…` paths):

```bash
python3 -m http.server 8000 -d .
# → http://localhost:8000/ui/card/render.html
```

## Status / next steps

- [x] Content model, preset model, presets, UCF instances, SSR renderer, demos
- [x] Video/YouTube/Vimeo media items + `VideoObject` microdata
- [x] `body` → `articleBody`, gradient headlines, blockquote composition
- [ ] Style the remaining proposed parts in `content.css` (gradient-headline `b` and quote are done/composed)
- [ ] Sync models to a CMS via [UCM](../../cms/baseline/) (`cd cms/unified-content-model && npm run validate`)
- [ ] `editor-card` widget update for the new `details` shapes
- [ ] `renderNavigation()` if the navigation → accordion/tabs mapping gets adopted
- [ ] HTML-format richtext bodies (needs a sanitizer decision — the engine only emits escaped text)
