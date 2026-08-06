# The Universal Card System

One content model, one preset model, one renderer — recreating all 25 schema.org card
types from the legacy `content/card` package with the modern v4 card engine
(`<ui-card>` + `<ui-media>` + `<ui-content>`), full inline microdata included — and
extending the taxonomy with nine additional high-usage types (organization, video,
howto, qa, podcast, movie, book, dataset, claim; model v1.3, 35 `schemaType` values).
Rationale + the web-usage research behind the picks:
[`docs/plans/2026-08-05-card-schema-coverage.md`](../../../docs/plans/2026-08-05-card-schema-coverage.md).

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
| Legacy generic renderer | [`content/card/demo/`](../../../content/card/demo/index.html) — [`content-card.js`](../../../content/card/demo/content-card.js) | One `<content-card>` class, `TYPE_RENDERERS` table, 25 types, token layout language (`card="overlay(bl) ar(21/9)"`), light DOM, microdata |
| Card package | [`content/card/src/`](../../../content/card) → [`dist/`](../../../content/card/dist) | 25 dedicated classes extending `BaseCard`, `<lay-out>` layout system, srcset generation, static SEO pages built with Puppeteer |
| Baseline CMS model | [`cms/baseline/models/content-card.schema.json`](../../../cms/baseline/models/content-card.schema.json) | Envelope + one opaque `data` object (editor-card widget) |
| UCM / UCF specs | [`cms/baseline/docs/UCM/`](../../../cms/baseline/docs/UCM) · [`cms/baseline/docs/UCF/`](../../../cms/baseline/docs/UCF) | Unified Content Model (type definitions) and Unified Content Format (content instances) |

Both legacy systems agree on the 25-type taxonomy and emit **microdata only** (no
JSON-LD). This system carries all of that forward onto the v4 primitives, then
extends the taxonomy (v1.3) with the nine types above that the legacy systems
never had.

## The pieces

| File | Role |
|------|------|
| [`cms/baseline/models/card.schema.json`](../../../cms/baseline/models/card.schema.json) | **Content model** (UCM). Structured envelope + `schemaType` select (35 values) + `preset` reference + one `details` object per type |
| [`cms/baseline/models/card-preset.schema.json`](../../../cms/baseline/models/card-preset.schema.json) | **Preset model** (UCM). The attributes on the host element itself |
| [`data/card.presets.json`](../data/card.presets.json) | Preset instances — **25** named looks |
| [`data/*.json`](../data) | 37 UCF card instances (one per schemaType + two presentation-only blocks) + [`index.json`](../data/index.json) manifest |
| [`render.js`](../render.js) | Rendering engine: UCF + presets → DOM with microdata |
| [`render.html`](../demo/render.html) | Live demo — all 35 typed cards rendered from data |
| [`schema.html`](../demo/schema.html) | Hand-authored reference markup for every type (the spec render.js follows) |
| [`content.css`](../content.css) | `<ui-content>` parts — all parts styled (incl. the 8 once-proposed structured parts) |

## Content model — `card`

The **hybrid** shape: everything shared is structured; everything type-specific
lives in one `details` object discriminated by `schemaType`.

### Envelope fields

| Field | Type | Notes |
|-------|------|-------|
| `internalName` | string | CMS editor label (required, invariant) |
| `schemaType` | select | 35 values — drives itemtype + microdata mapping |
| `preset` | reference → `card-preset` | The look & feel. Swap to restyle |
| `eyebrow` | string | Kicker; → `articleSection`/`category`/`recipeCategory`/`about`/`industry` |
| `headline` | string | → `headline` (article/news), `title` (job), `name` (rest) |
| `subheadline` | string | |
| `summary` | text | → `description` — or `reviewBody` (review), `text` (quote/announcement/social) |
| `body` | richtext | Long-form |
| `published` / `modified` | datetime | → `datePublished`/`dateModified` — `datePosted` for job/announcement |
| `readingTime` | string | |
| `media` | array | `{asset\|src, mediaType: image\|video\|audio\|youtube\|vimeo, alt, caption}` — more than one item ⇒ carousel. Video items also take `{autoplay, muted, loop, controls, poster}`; an `audio` item is a chromeless `<audio>` in the frame (poster image stays the visual; `furniture.play` drives it, scoped `associatedMedia` → `AudioObject`); youtube/vimeo items set `provider`/`video` lite-embed attributes on the frame |
| `authors` | array | `{name, role, avatar}` → byline, `author`/`creator` → Person |
| `tags` | tags | → pill list |
| `actions` | array | `{link, style}` → `data-part="actions"` buttons. In an `ovr()` overlay card a plain solid button (`.ui-button` with no `data-variant`) is given **dark** text by `ui-card.css` so it stays legible on its light surface instead of inheriting the overlay's white ink; colour variants (accent, text, …) set their own ink and are left untouched |
| `links` | array of link | Plain related links |
| `furniture` | object | Overlay elements on the media — `{chip, beacon, sticker, save, play}` (five; `<ui-marquee>` is a **band**, not furniture, and has no renderer field — see the gap note under *Renderer*). **Content only** (text/semantics); the *look* (position, hue, size, shape) lives in the preset's `media=` tokens. See **Furniture** below |
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
2. **Editorial.** `flipside` references another `card`; its text column
   (envelope + details + actions) becomes the back panel. Rendered one level
   deep as a plain text column — a flipside's own `flipside` (or reveal
   preset) is ignored, so chains cannot recurse.

The flipside shares the host's schema.org itemscope — its itemprops attach to
the host entity. Use the same `schemaType` (or the neutral `content`) so the
microdata stays coherent. Demo: [`data/software.json`](../data/software.json) →
[`data/software-flipside.json`](../data/software-flipside.json).

### `details` shapes (per schemaType)

Documented in full in the model's `details` description. Examples:

- **product** `{ price:{current,original,currency,discountText}, availability, rating:{value,count,max}, sku, validUntil }`
- **recipe** `{ prepTime, cookTime, servings, ingredients[], instructions[] }` (ISO 8601 durations)
- **faq** `{ items:[{question,answer}] }` — rendered as a nested `<ui-accordion>`
- **poll** `{ options:[{headline,votes}], totalVotes }` — percentages computed by the renderer
- **business** `{ businessType?, address{…}, telephone, email, website, priceRange?, rating{…}?, sameAs[]?, foundingDate?, geo{…}, openingHours:[{schema,display}] }` — an allowlisted `businessType` (Restaurant, CafeOrCoffeeShop, …) sharpens the root itemtype; each parsable `openingHours.schema` string also emits a structured `OpeningHoursSpecification`
- **organization** `{ foundingDate, numberOfEmployees, sameAs[], headquarters:{address{…}}, offices:[{name, address{…}, telephone, openingHours[]}] }` — the multi-office shape; every office emits `department` → `LocalBusiness`
- **howto** `{ totalTime, estimatedCost:{value,currency}, difficulty, supplies[], tools[], steps:[{name,text}] }` — steps render as the recipe-style nested `<ui-accordion>`
- **qa** `{ question, upvotes, answers:[{text,author,upvotes,accepted}] }` — `mainEntity` → `Question` with `acceptedAnswer`/`suggestedAnswer`
- **claim** `{ claim, claimant, reviewDate, verdict:{value,max,label} }` — `claimReviewed` quote + `reviewRating` → `Rating` with `alternateName` verdict chip

Machine values stay schema-ready (`PT15M`, salary numbers, geo coordinates);
`*Display` keys carry pre-formatted strings only where formatting is not derivable.

## Furniture — chip · sticker · save · play

The four overlay elements (`<ui-chip>`, `<ui-sticker>`, `<ui-save>`, `<ui-play>`) share
one rule: **content decides *what* and *whether*; the preset decides *how it looks*.** The
content model carries a single `furniture` object holding only text/semantics; the preset's
`media=` token string carries position, hue, size and shape. The renderer emits the elements
from `furniture` and *never* generates position/hue tokens — they come from the preset (the
hand-authored [`media.furniture.html`](../demo/media.furniture.html) is the reference shape).

```jsonc
// content — text/semantics only
"furniture": {
  "chip":    { "text": "Breaking", "badge": "4", "style": "ts red" },
  "sticker": { "lines": [ {"role":"label","text":"SAVE"}, {"role":"lead","text":"20","sup":"%"} ] },
  "save":    { "shape": "heart", "saved": false },
  "play":    true
}
```
```jsonc
// preset — look (media= tokens)
"media": "asr(4/3) sticker(te) sticker(sh:burst) sticker(green) save(be) play(cc)"
```

**Look tokens on `media=`** — single-value tokens (the CSS matches them by substring, so
one value per token, never `chip(ts red)`). The vocabulary is generated from
`data/tokens.json`, so it can't drift from the element stylesheets:

<!-- tokens:matrix attr=media stems=chip,sticker,save,play,lightbox classes=pos,hue,mode,size,disc,shape,flag -->
| token | pos | hue | mode | size | disc | shape | flag | deprecated aliases |
|---|---|---|---|---|---|---|---|---|
| `chip()` | ts tc te cs cc ce bs bc be | red orange green blue accent black white gray slate | pale muted | sm lg xl 2xl | non rnd pll crc sqr | — | — | — |
| `sticker()` | ts tc te cs cc ce bs bc be | red orange green blue accent black white gray slate | pale muted | sm lg xl 2xl 3xl | non rnd pll crc sqr | text spl spr sh:burst sh:blob sh:spark sh:sunburst sh:heart sh:&lt;custom&gt; | fit | — |
| `save()` | ts tc te cs cc ce bs bc be | red orange green blue accent black white gray slate | — | sm lg xl | non rnd crc sqr | — | — | — |
| `play()` | ts tc te cs cc ce bs bc be | red orange green blue accent black white gray slate | — | sm md lg xl | non rnd pll crc sqr | — | — | — |
| `lightbox()` | ts tc te cs cc ce bs bc be | red orange green blue accent black white gray slate | — | sm lg xl | non rnd crc sqr | — | — | — |
<!-- /tokens -->

- **`pos`** — the 9-code logical grid, shared with `ovr()`, `scm()` and reveal's `ico()`.
- **`hue`** — the canonical nine: four hues plus the `white < gray < slate < black` neutral
  ramp. `slate` became a canonical hue in v5 (it always resolved to its own
  `--ui-theme-slate-*` bundle, never to `gray`); the `dark`/`light`/`subtle` aliases were
  removed in the same round. See [media.md](media.md#the-canonical-nine-hues).
- **`mode`** — the `pale` / `muted` fill modifiers. `save` and `play` are single-ink controls
  and implement neither.
- **`size`** — `md` is the default on every element and is spelled by *omitting* a size arg,
  except on `play()` where `play(md)` is also accepted explicitly.
- **`disc`** — the backing shape: `crc` circle · `sqr` squircle · `rnd` rounded · `pll` pill ·
  `non` hides the disc.
- **`sticker(<shape>)`** — `text spl spr` plus the `sh:` clip set (`sh:burst`, `sh:blob`,
  `sh:spark`, `sh:sunburst`, `sh:heart`, or any `sh:<custom>` you define). No `variant=` needed.
- **`sticker(fit)`** — native `text-fit`; scales every line to fill the box width (= `font="fit"`).

Each element also works standalone via `theme=` / `fill=` / `ink=` / `size=` / `radius=` on
the element itself. `<ui-beacon>` and `<ui-marquee>` take the same `media=` shape with extra
axes of their own — full matrix in [media.md](media.md#per-element-support-matrix-generated-from-the-manifest).

**Per-card override — `style`.** Furniture styling defaults to the preset, but any item may
carry an optional `style` token string (same vocabulary) that the renderer appends after the
preset tokens. A same-axis override *replaces* the preset's token for that axis
(`mergeMediaTokens` strips the collision so the override wins deterministically — the CSS
resolves `media=` matches by source-order, not token-order). So one card can go
`chip: { text: "Breaking", style: "red" }` while the shared preset stays green.

**Text models.**
- **chip** — a plain `text` label, plus an optional `badge` → nested `<ui-badge>`.
- **sticker** — `lines[]`, one entry per typographic line: `role: "label"` → `<small>`
  (styled by `font=`), `"lead"` → `<strong>` (styled by `font-lead=`), `"plain"` → `<span>`
  (fluid). Optional `sup` renders a trailing `<sup>` (price cents, etc.). This structured shape
  replaces the old flat `sticker.text`, which could only ever emit one `<strong>` line.
- **save / play / lightbox** — no text; all accept a bare `true`. `save` takes `{shape, saved}`
  (the glyph `heart|bookmark|star` is content, authored on the emitted `<ui-icon shape=…>` — never
  a `media=` token; `saved` sets initial `aria-pressed`). `play` and `lightbox` take an optional
  `label`; `lightbox` also a `shape` (`photos` default | `maximize`) picking the
  /assets/svg glyph. A preset may carry **`media-open`** — ordinary carousel-control
  spellings the lightbox swaps in while open (see media.md § Lightbox); emitted on the
  frame only when the card has lightbox furniture, validated against the media vocabulary. `lightbox` additionally makes the renderer mark the frame as a **popover** (`popover` +
  id `<card-id>-media`) and emit the invoker **before the slides** (the sticky-pin contract); the
  open-state presentation comes from the preset's `open:` tokens — see
  [media.md § Lightbox](media.md#lightbox--the-popover-fullscreen-gallery).

**Save state & interactivity.** The look is pure CSS off the button's `aria-pressed` — unsaved =
outline + idle ink, saved = filled + active ink. The toggle is script: `command="--save"` is a
custom invoker whose `commandfor` the renderer points at the `<ui-media>` (id `<card-id>-media`)
so the handler has the frame in hand. The `command` event does **not** bubble — listen on the
target:

```js
media.addEventListener('command', (e) => {
  if (e.command !== '--save') return;
  const btn = e.source;
  const saved = btn.getAttribute('aria-pressed') !== 'true';
  btn.setAttribute('aria-pressed', saved);
  // persist to your store here
});
```

Save/play/lightbox are **controls** (interactive) — card-only, never inside a reveal `<summary>`.
Demos in [`media.furniture.html`](../demo/media.furniture.html) and
[`media.lightbox.html`](../demo/media.lightbox.html); components: [`ui/chip`](../../chip) ·
[`ui/sticker`](../../sticker) · [`ui/save`](../../save) · [`ui/play`](../../play) ·
[`ui/lightbox`](../../lightbox).

## Preset model — `card-preset`

> A card has a *configuration*: the attributes on the `<ui-card>` or `<ui-reveal>`
> element itself. A preset is that configuration, named and reusable.

| Field | Applies to | Notes |
|-------|-----------|-------|
| `name`, `description` | both | e.g. “Hero Preset” |
| `element` | both | `ui-card` (default), `ui-reveal` — or `ui-media` / `ui-content` for **bare primitives**: the renderer emits just the media frame or text column, no card chrome. Standalone blocks are presentation, not a separate content model |
| `variant` | both | `col row row-r spl() ovr() vis() rds()` |
| `theme` | both | shared theme axis — colour + `pale`/`muted`/`light`/`dark` (see [base/theme.md](../../base/theme.md)) |
| `media` | both | `asr() obf() obp() flp() rds() shp() hov() tnt() scm clip …` — plus **all carousel controls as tokens, the only form** (`nav`/`nav()`, `arw()`, `mrk()`, `axis(y)`, `auto`, `loop`, `stagger`, `load()`; the schema has no `nav`/`arrow`/`dot` fields) and the furniture look tokens (`chip/sticker/save/play` position/hue/size/shape). The renderer appends each furniture item's optional `style=` override after these |
| `content` | both | `scl() hl() gap() scr` · padding `pad() pb() pi() pbs() pbe() pis() pie()` · `rds()` — plus their `md:`/`lg:` forms |
| `text` | both | which long text the text column shows: `summary` (teaser — default), `body` (full view — body **instead of** summary, with the summary kept as a hidden `description` meta), `both`. Reveal back panels always render both |
| `parts` | both | sub-component variants, written verbatim as the emitted element's `variant` attribute: `parts.quote` → `<ui-quote>` (`bigquote` / `breaker` / `code`; the quote type defaults to `bigquote`, review/social to none), `parts.accordion` → `<ui-accordion>` (`bordered divided rounded pill separate filled`, space-separable) for faq items, recipe instructions, job requirements/benefits. Values are validated by `tokens.lint.js` against the component vocabularies |
| `styles` | both | object of CSS custom properties → `style` attribute (e.g. `--ui-reveal-content-bg`) |
| `reveal` | ui-reveal | nested object grouping the reveal-only config: `{ type, typeLg, to, icon, iconType, iconClose, from, trigger, scroll, name }`. The structured object stays in the schema, but the renderer **folds it into `variant=` tokens** at render time: `type`+`from` → one animation token (`exp`, `flp(top)`, `sld(lft)`, `grw`), `typeLg` → `lg:`-prefixed swap (`lg:grw`), `to` → `pop`, `trigger` → `trg(card)`, `scroll` → `scr`, `icon` → one `ico()` per word (default `ico(te) ico(sm)`), `iconClose` → one `icc()` per word. Three fields stay **markup**, not tokens: `iconType` sets the toggle glyph on the emitted `<ui-icon>` (`plus-cross` default, or directional `{up,down,left,right}-arrow-cross` pairing with slide direction — panel from top → `down-arrow-cross`); `name` becomes the native `<details name>`; and `trigger` additionally **suppresses the `<ui-icon>` entirely** |

**Three renderer behaviours worth knowing when writing a `reveal` object:**

| Field / condition | Emitted markup |
|---|---|
| `type` is `flip` / `slide` / `scale` (→ `flp` / `sld` / `grw`) | the front face is wrapped in `<ui-face>` — those three animate the **face**. `exp` animates the **host**, so it gets **no** `<ui-face>` |
| `trigger` set (→ `trg(card)`) | **no `<ui-icon>` at all** — the whole summary is the trigger |
| `name` set | `<details name="…">` for native exclusivity. Emitted **only** from this field; never inferred from the preset id, the card id, or anything else |

> **Schema note.** `render.js` reads `reveal.name`, but `card-preset.schema.json` does not
> yet declare it among the `reveal` properties (`type typeLg to icon iconType iconClose from
> trigger scroll`). The renderer honours it today; the schema needs the field added before an
> editor can surface it. (The schema's own `description` is current on the animation: the
> preset word `"type": "scale"` folds to the `grw`/`lg:grw` tokens. The old `scl`/`lg:scl`
> token spellings were **removed in v5** — migrate to `grw`/`lg:grw`.)

**`shp()` — clip the media content to a shape.** Applies a `clip-path` to the
`img`/`video`/`iframe` inside `<ui-media>` (the frame background goes transparent).
Names are short with `-l`/`-r` (left/right) and `-d`/`-u` (down/up) suffixes. Full set:
`pt-d pt-u cut-r cut-l skew-r skew-l curve-d curve-u curve-r curve-l para rhomb inset
hex arr-l arr-r pt-l pt-r chev-l chev-r star plus minus msg close frame frame-in bolt
blinds-h blinds-v circle circ-45`. The shape polygons live in the **opt-in
`media.shapes.css`** sheet (not bundled by `ui-card.css` — link it where you use `shp()`,
demos in [`media.shape.html`](../demo/media.shape.html)); the static clip **mechanism** ships in
`media.css`, so it also works with any custom `--ui-media-shape` you set.

Every shape carries a `--ui-shape-morph` target; add **`hov(shape)`** to animate the clip
to it on hover (the base clip is static without it) — polygons morph to a matching-vertex
rect, `curve-*` grows to a full-cover `ellipse()`, circles to a `circle()` (same-function
interpolation). Use **`hov(shape-rev)`** instead to swap the direction — rest at the full frame,
morph *into* the shape on hover (e.g. `shp(star) hov(shape-rev)`); `frame-in` is a bespoke variant.
The hover morph lives in `media.hover.css` (see `hov()` below).

**`tnt()` — tint the image a solid colour.** Blends a solid-colour overlay (`ui-media::before`)
over the image with `mix-blend-mode` — a plain `filter` can't hit an exact colour. Named keys
`tnt(red|orange|green|blue|accent|black|white|gray|slate)` map to the theme colours (the `dark`/`light`/`subtle` aliases were removed in v5); bare `tnt` reads
`--ui-media-tint-color` (any CSS colour **or gradient**) for arbitrary brand hues. Default blend
`color` (recolour, keeps detail); switch via `--ui-media-tint-blend`, fade with
`--ui-media-tint-opacity`. Pair with **`hov(tint)`** to fade the tint out on hover (reveal true
colour). Demos in [`media.tint.html`](../demo/media.tint.html); lives in the **opt-in `media.tint.css`**
sheet (link it where you tint; not bundled by `ui-card.css`).

The host elements carry exactly these attributes: `variant`, `media`, `content`,
`theme`, `style`, `class` — reveal config is `variant=` tokens
(`exp`/`flp()`/`sld()`/`grw()`/`pop`/`trg(card)`/`scr`/`ico()`/`icc()`), not separate
attributes. `class` is an instance hook, not preset material. Media-element
attributes (`provider`, `video`, `cdn`, `quality`, `breakpoints`) are per-media-item
content and belong in the card's `media[]` items. Bare booleans like `clip`, `auto`,
`loop`, `stagger` — and loading via `load(eager|lazy)` — are tokens **inside** the
`media=` string, not separate attributes.

### Shipped presets ([`data/card.presets.json`](../data/card.presets.json))

| id | Element | Look | Used by (demo data) |
|----|---------|------|---------------------|
| `stack` | ui-card | `col` · 16:9 | content, article, recipe, booking, achievement, social, organization, video, qa, podcast, dataset, claim |
| `showcase` | ui-card | `col` · 4:3 | product, movie, book |
| `split` | ui-card | `row spl(1/2)` · 4:3 | news, course, business |
| `split-reverse` | ui-card | `row-r spl(2/1)` · 1:1 | contact |
| `portrait` | ui-card | `row spl(1/2)` · 1:1 | review |
| `portrait-top` | ui-card | + `obp(tc)` | profile |
| `panel` | ui-card | `vis(content)` | job, poll, faq, timeline, comparison |
| `panel-subtle` | ui-card | + `theme="gray"`, `scl(lg)` | quote |
| `panel-brand` | ui-card | + `theme="black dark"` (set `--ui-card-dark-bg` to accent for a branded surface) | statistic, membership |
| `panel-dark` | ui-card | + `theme="black dark"` | announcement |
| `hero` | ui-card | `ovr(bs)` · 4:3 · scrim · `scl(lg)` | event |
| `poster` | ui-card | `ovr(bs)` · 3:4 · scrim | location |
| `carousel` | ui-card | `nav(mrk)` | gallery |
| `media` | ui-media | bare frame · 21:9 · `rds(lg)` | media-block |
| `prose` | ui-content | bare text column | prose-block |
| `flip` | ui-reveal | flip · `ovr(bs) rds(lg-sq)` · `scroll` | software |
| `hero-reveal` | ui-reveal | expand → scale at lg · 21:9 · dark panel via `styles` | — (from the ui/reveal hero demo) |

Restyling any card = changing its reference:

```json
"preset": { "$ref": "card-preset/hero" }
```

A second collection, [`data/card.presets.demo.json`](../data/card.presets.demo.json),
holds **129 demo presets** extracted 1:1 from the original demo pages
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

Pipeline: resolve preset → build `<ui-media>` (items; furniture emitted from the
`furniture` object, its look from the preset's `media=` tokens plus any `style=`
overrides) → build `<ui-content>` envelope parts →
run the per-type `DETAILS` renderer → append trailers (byline, tags, actions,
engagement). `preset.element === "ui-reveal"` switches to the reveal composition
(front face, back panel — `<ui-face>` only for `flp`/`sld`/`grw`). Unknown preset refs
fall back to a plain stack card; unknown schemaTypes fall back to CreativeWork.

### Canonical attribute placement

The renderer puts each token string on **the element that owns it**:

| Attribute | Emitted on | Why |
|---|---|---|
| `media=` | the `<ui-media>` | the frame's own config |
| `content=` | the `<ui-content>` | the text column's own config |
| `variant=` | the host (`<ui-card>` / `<ui-reveal>`) | it *arranges the two children*, so it belongs to the host by nature |
| `theme=` | the host | one colour axis for the whole card |

This is the **canonical** placement, not the only legal one. Hand-authored HTML may keep
`media=` / `content=` on the host or on any ancestor — nothing was removed. The responsive
`md:`/`lg:` rules ship **two arms** exactly so both placements keep working: a host arm
targeting the queryable descendant (`cq-box` / `summary`) and a self arm targeting the
primitive. See [content.md](content.md#two-arms--the-attribute-can-sit-on-the-primitive-or-the-host).

**Ancestor placement stays the bulk-config mechanism.** `content=` is pure custom-property
inheritance, so one declaration on a `<lay-out>` or `<lay-out-group>` still governs every
card beneath it, and a card's own nearer declaration wins. That is a feature, not legacy —
use it when a whole section should share type scale or padding. (`media=` is different: its
inheritance deliberately **stops at the card host**, so a `media=` on a `<lay-out overflow>`
configures that layout's own scroller and never leaks into a descendant `<ui-media>`.)

> **`<ui-marquee>` from data.** `buildFurniture` emits six elements: `marquee` (a band —
> `furniture.marquee.text` goes on `aria-label`, `style` words map to `marquee()` tokens),
> `play`, `chip`, `beacon`, `sticker`, `save`.

## Microdata conventions

Followed throughout (`schema.html` is the reference; matched against the legacy
emission in [`content/card/dist/`](../../../content/card/dist)):

- Root: `itemscope itemtype="https://schema.org/{Type}"` on the host element
- Hidden machine values: `<meta itemprop content>`; visible machine values:
  `<data value>` / `<time datetime>` / `content` attribute
- Nested scopes: author→`Person`, offers→`Offer`, rating→`AggregateRating`/`Rating`,
  address→`PostalAddress`, geo→`GeoCoordinates`, steps→`ItemList`+`HowToStep`,
  FAQ→`Question`+`acceptedAnswer`→`Answer`, engagement→`InteractionCounter`
- Type-dependent props: headline → `title` (job) / `headline` (article, news) /
  `name` (rest); summary → `reviewBody` (review) / `text` (quote, announcement,
  social) / `description` (rest); published → `datePosted` (job, announcement) /
  `uploadDate` (video); eyebrow → `genre` (video, movie, book)
- **Business subtype**: `details.businessType` sharpens the root itemtype from
  `LocalBusiness` to an ALLOWLISTED subtype (`BUSINESS_SUBTYPES` in render.js —
  never verbatim data, mirroring the old dynamic-schema pattern safely). Opening
  hours emit both forms: the flat `openingHours` meta AND, for parsable
  `"Mo-Fr 07:00-18:00"` strings, a hidden `OpeningHoursSpecification` scope with
  `dayOfWeek`/`opens`/`closes` (`hoursSpec()`)
- **Organization offices**: each office emits `department` →
  `LocalBusiness` (name, `PostalAddress`, `telephone`, opening hours — both
  forms), the Google-documented multi-location pattern;
  `numberOfEmployees` rides a hidden `QuantitativeValue`
- Reveal cards keep metas on the root/back panel so microdata survives either face
- **VideoObject** (matching the legacy emission): native video items carry the
  scope on the `<video>` element itself with `<meta>` children as fallback
  content — `name` (alt), `contentUrl`, `thumbnailUrl` (poster), `uploadDate`,
  `duration`, `description`. Provider embeds (youtube/vimeo) emit a hidden
  `<div itemprop="video" itemscope …VideoObject>` in the text column with
  `embedUrl` + `thumbnailUrl` (`i.ytimg.com/vi/{id}/hqdefault.jpg` for YouTube).
  **Exception — the `video` type**: its ROOT is the VideoObject
  (`ROOT_VIDEO_TYPES`), so media facts emit as root-level props
  (`contentUrl`/`embedUrl`, `thumbnailUrl`, `uploadDate`, `duration`) and no
  nested scope is created; `name`/`description` ride the envelope
- New-type nested scopes: howto steps → repeated `step` → `HowToStep` (plus
  `supply` → `HowToSupply`, `tool` → `HowToTool`, `estimatedCost` →
  `MonetaryAmount`); qa → `mainEntity` → `Question` with
  `acceptedAnswer`/`suggestedAnswer` → `Answer` (`upvoteCount` on both);
  podcast → `partOfSeries` → `PodcastSeries` + `associatedMedia` → `AudioObject`;
  movie → `director`/`actor` → `Person`; book → `publisher` → `Organization` +
  `offers` → `Offer` (`bookFormat` emits only for schema.org `BookFormatType`
  members); dataset → repeated `distribution` → `DataDownload`
  (`encodingFormat` + `contentUrl` on the download link); claim →
  `claimReviewed` text + `reviewRating` → `Rating` whose `alternateName` is the
  visible verdict chip
- **articleBody**: for `article`/`news` the `body` paragraphs are wrapped in
  `<div itemprop="articleBody">`. Teaser/full is a preset decision — the `text`
  field: cards show the `summary` only; a `text: "body"` preset (e.g. `prose`)
  shows the body *instead*, keeping the summary as a hidden `description` meta
- **Gradient headline**: `headline` is short rich text (≤256 chars, model-enforced).
  `renderInline()` escapes everything, then re-allows a two-tag ALLOWLIST: `<b>`
  (emphasis) and `<ui-gradient-text>` (@browser.style/gradient-text — the gradient
  treatment, optionally `animate="slide|breathe"`; no other attribute passes). All
  other markup is escaped. The card owns no gradient CSS — `hl(grad)` was removed in v5
- **Quote**: quote parts compose with `@browser.style/quote` —
  `<ui-quote data-part="quote" variant="bigquote"><blockquote><q>…</q><cite>…</cite></blockquote></ui-quote>`
  (quote), plain wrapper (review, social); pages import
  `../quote/ui-quote.css`

## Structured `data-part` vocabulary

Eight parts added for the typed cards, all styled in [`content.css`](../content.css):

| part | Element | Used by |
|------|---------|---------|
| `price` | `<p>` + `<data>`/`<del>`/`<small>` | product, course, booking, membership, software, job, book |
| `rating` | `<div>` + decorative `<input class="ui-rating">` + `[data-sr]` label + visible count | product, review, software, business, movie, book |
| `list` | `<ul>` check / `<ol>` ordered | recipe, job, course, booking, location, membership, howto, qa, dataset |
| `address` | `<address>` | business, location, event, contact, organization |
| `stat` | `<p>` + `<data>` + unit + trend | statistic |
| `timeline` | `<ol>` of `<time>` + text | timeline |
| `quote` | `<ui-quote>` wrapping `<blockquote>` + `<cite>` | quote, review, social, claim |
| `options` | `<ul>` of `<label>` + `<progress>` | poll, comparison |

Everything else reuses existing parts: `meta` (salaries, hours, dates), `tags`
(skills, hashtags), `byline` (people), `footer` (totals, recommendations).

Two parts are already **implemented** in content.css: the gradient-headline `b`
rule, and `cover` — an `<a data-part="cover">` inside the headline whose
`::after` covers the whole card (the clickable-card link; see the Article
pattern below).

## Sub-components — which packages the typed cards reuse

The renderer delegates parts to standalone `ui/*` packages where one earns its
place; everything else stays card-local `data-part` styling. All are **optional
peers** of `@browser.style/card` — pages link only the sheets their types need.

| schemaType(s) | Sub-component | Emitted markup |
|---|---|---|
| quote, review, social, claim | [`ui/quote`](../../quote/) | `<ui-quote data-part="quote" variant?>` wrapping `<blockquote itemprop>` — variant from `parts.quote` (quote defaults to `bigquote`) |
| faq, recipe, job, howto | [`ui/accordion`](../../accordion/) | `<ui-accordion group variant?><cq-box><details>…` — the `cq-box` is hand-authored by the renderer so the CSS-only form styles without the accordion JS; variant from `parts.accordion` |
| any card with `authors[]`, review | [`ui/avatar`](../../avatar/) | `<ui-avatar><img></ui-avatar>` in byline rows, `<abbr>` initials fallback when no image; the card sets scale via `--ui-avatar-size` |
| poll, comparison | [`ui/progress`](../../progress/) | bare `<progress>` — the package styles the native element, no markup contract |
| faq/recipe/job summaries, reveal toggles | [`ui/icon`](../../icon/) | `<ui-icon type="plus-minus">` etc. |

**Deliberate non-goals** (card-local `data-part` styling stays):

- `rating` — the star row stays hand-rolled (`ratingPart()`); legacy `ui/rating`
  is a pre-v4 range-input form control, the wrong tool for read-only display.
  Follow-up: a v4 display-mode `ui-rating` rewrite, then delegate.
- `table` for comparison/nutrition — wrong density at card widths; the
  `options` progress list is the card-scale rendering.
- `timeline` — legacy `.ui-timeline` is pre-v4; the card-local `timeline` part stays.

## Navigation models and ui-accordion / ui-tabs (assessment)

Can `navigation` / `navigation-item` ([models](../../../cms/baseline/models/navigation.schema.json))
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
already exist in [`cms/baseline/content/navigation/`](../../../cms/baseline/content/navigation)).
*Content* accordions (FAQ, recipe steps, job requirements) stay in the card's
`details.items` — they are card content, not site structure. No renderer code
for this yet; a `renderNavigation(nav, items, { as, variant })` export is the
natural next step if needed.

## Article pattern — teaser card → full-page view

One `card` instance serves both states; presets and view-transition names do the
rest ([`article.render.html`](../demo/article.render.html) is the working demo):

- **Teaser (grid).** The card's preset defaults to `text: "summary"` — the short
  description shows, the `body` never renders.
- **Full view.** The *same UCF* re-renders through the two bare presets:
  `media` (hero frame) + `prose` (`text: "body"` — the body renders **instead
  of** the summary, wrapped in `itemprop="articleBody"`; the summary survives as
  a hidden `description` meta). Zero article-specific renderer code.
- **Morph — cross-document, both directions.** Every article has its *own page*
  under [`articles/`](../demo/articles/). Both documents opt in with
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
  [`ui-card.css`](../ui-card.css) (outside `@layer` — `@view-transition` is a
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

  > **Note — why two `data-view` attrs (card *and* img), to rework later.**
  > One `data-view` = one custom-ident = ONE named element per document
  > (advanced `attr()` can't synthesise a second, distinct name, and a
  > `view-transition-name` must be unique per document). So a single attr can't
  > drive *both* a card-box morph and a hero-image morph — it forces a choice:
  > name the **card** (whole box morphs, image dissolves inside — soft), name
  > the **media** (image scales, text cross-fades), or use **two attrs** (box
  > morphs *and* hero scales cleanly — the current, richest result). We tried
  > auto-routing a single card `data-view` to the `<ui-media>` via an inherited
  > custom property; it works but is media-*only*, not "card + media", so it
  > looked worse. Kept the two-attr version. Revisit if a future CSS primitive
  > lets one attribute yield two names (or if media-only morph is acceptable).

  Group timing is tokenized: `--ui-card-vt-duration` (0.4s) and
  `--ui-card-vt-easing`, gated behind `prefers-reduced-motion`. Advanced
  `attr()` is Chromium 133+; where unsupported the name resolves to `none` and
  the navigation degrades to a plain crossfade/instant swap. Markup stays
  strict-CSP clean — no `style=` attributes anywhere.
- **Static markup + render-blocking — this is what makes the morph reliable.**
  [`articles/build.js`](../demo/articles/build.js) (`node ui/card/articles/build.js`)
  pre-renders the grid page *and* every article page through `render.js` — the
  SSR engine returning strings needs no DOM. But static markup alone is not
  enough: a cross-document transition snapshots the **incoming** page at first
  render, which *races* HTML parsing. If the parser hasn't reached the
  `card-{id}`/`hero-{id}` elements yet, the morph silently degrades to a root
  cross-fade — and bfcache shifts the timing enough that this shows up as
  "animates the first time, then stops until you refresh". The fix (per
  [Chrome's cross-document guidance](https://developer.chrome.com/docs/web-platform/view-transitions/cross-document))
  is to render-block each incoming page until its named elements are parsed:

  ```html
  <link rel="expect" href="#hero"  blocking="render">  <!-- article pages -->
  <link rel="expect" href="#cards" blocking="render">  <!-- grid page (reverse morph) -->
  ```
  The `<link rel="expect">` holds first paint (and the snapshot) until that
  `id` is parsed; `#hero` sits inside the `<article data-view="card-…">`, so
  both morph targets exist by then. Both pages are *incoming* (article on
  forward, grid on Back), so both carry one. `rel="expect"` ships with the same
  browsers as cross-document VT — no separate fallback. Verified: forward,
  backlink and browser-Back — including the repeat navigation — all animate
  `::view-transition-group(card-{id})` + `(hero-{id})`, not just root.
- **Navigation — regular links via the `cover` part.** The card headline is a
  real `<a data-part="cover" href="articles/{name}.html">` — a part like every
  other (no classes), styled in [`content.css`](../content.css): its `::after`
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
| [`schema.html`](../demo/schema.html) | Hand-authored reference — all 35 types with microdata |
| [`render.html`](../demo/render.html) | All 35 typed cards rendered by `render.js` from UCF data + presets |
| [`media.render.html`](../demo/media.render.html) · [`carousel.render.html`](../demo/carousel.render.html) · [`video.render.html`](../demo/video.render.html) · [`reveal.render.html`](../demo/reveal.render.html) | The original demo pages recreated data-driven: presets from [`data/card.presets.demo.json`](../data/card.presets.demo.json) (129 presets extracted from the originals) + UCF instances in [`data/demo/`](../data/demo). Each page lists its not-expressible demos in a bottom note |
| [`article.render.html`](../demo/article.render.html) + [`articles/`](../demo/articles/) | The article pattern above, live and **fully static** (pre-rendered by `articles/build.js`): teaser cards with stretched-link headlines → cross-document view transition morphs the whole card into the per-article page and back (`card-{id}` + nested `hero-{id}` names via `data-view` + CSS `attr()`), body-instead-of-summary via the `prose` preset, plain `<a>` navigation, zero runtime JS |
| [`index.html`](../index.html) · [`media.html`](../demo/media.html) · [`content.html`](../demo/content.html) · [`carousel.html`](../demo/media.carousel.html) · [`video.html`](../demo/media.video.html) | The card engine itself (hand-authored originals) |
| [`../reveal/index.html`](../../reveal/index.html) | Reveal types incl. the hero (source of `hero-reveal` preset) |

Serve from the repo root (absolute `/ui/base/…` and `/assets/…` paths):

```bash
python3 -m http.server 8000 -d .
# → http://localhost:8000/ui/card/demo/render.html
```

## Status / next steps

- [x] Content model, preset model, presets, UCF instances, SSR renderer, demos
- [x] Video/YouTube/Vimeo media items + `VideoObject` microdata
- [x] `body` → `articleBody`, gradient headlines, blockquote composition
- [x] Style the structured parts in `content.css`; sub-component alignment (quote wrapper, SSR accordion cq-box, avatar bylines, progress package, preset `parts=`)
- [x] Taxonomy extension v1.3 — nine new types (organization, video, howto, qa, podcast, movie, book, dataset, claim) + LocalBusiness depth (subtype itemtype, `OpeningHoursSpecification`, priceRange, aggregateRating). Analysis: [`docs/plans/2026-08-05-card-schema-coverage.md`](../../../docs/plans/2026-08-05-card-schema-coverage.md)
- [ ] Sync models to a CMS via [UCM](../../../cms/baseline) (`cd cms/unified-content-model && npm run validate`)
- [ ] `editor-card` widget update for the new `details` shapes
- [ ] `renderNavigation()` if the navigation → accordion/tabs mapping gets adopted
- [ ] HTML-format richtext bodies (needs a sanitizer decision — the engine only emits escaped text)
