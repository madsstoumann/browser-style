# @browser.style/media

A CSS-first **media primitive** — an image/video frame with overlay furniture (label, beacon, sticker, favorite, play). It works **standalone** or **nested inside** `<ui-card>` / `<ui-reveal>`, and it is configured entirely through a compact `media=` token string that can sit on the element *itself* or on its **`<ui-card>` / `<ui-reveal>` host** (the configuration inherits down through custom properties — but stops at the card: a `media=` on any other ancestor, e.g. a `<lay-out>`, configures that element's own scroller and never leaks into a nested `<ui-media>`).

> **Status:** shipped (v4). `<ui-media>` is the media primitive extracted from `ui-card.css` into `ui/card/media.css`, per the 2026-06-20 media/content split design (plan doc removed 2026-08-19 — git history). This documents the implemented API.

## Features

- Aspect ratio, object-position (9-grid), object-fit, image flip, and **standalone corners** (`rds()`) — all from one `media=` string
- Optional, **host-gated Cloudflare `srcset`** upgrade for responsive images (root-relative paths, no hardcoded domain) — pure progressive enhancement
- Hover effects (zoom / pan / cursor-track) — media-only
- Scrim gradients in **9 directions** (4 edges + 4 diagonals + a centered double-stop)
- Native carousel via `::scroll-marker` / `::scroll-button` (markers + arrows)
- A **3×3 overlay grid** for furniture: `<ui-chip>`, `<ui-beacon>`, `<ui-sticker>`, `<ui-save>`, `<ui-play>`, `<ui-lightbox>`
- Logical / RTL-aware positioning — geometry defined once, mirrors automatically
- Reads its own inherited `--ui-media-*` namespace — no descendant-selector coupling, so it is **inert-proof standalone**
- Works without JavaScript (CSS-only mode); markers need no JS at all

---

## Install

```bash
npm install @browser.style/media
```

Peer dependency:

```bash
npm install @browser.style/base
```

> `@browser.style/base` provides the design token system. Because base is a required peer dependency, the global tokens `<ui-media>` references (`--color-overlay-light`, `--spacing-*`, `--radius-*`, the `--ui-theme-*` bundles, …) are always available — no hardcoded fallbacks needed.

The **overlay furniture** elements are separate packages. Install only the ones you use:

```bash
npm install @browser.style/chip      # <ui-chip>    — label marker
npm install @browser.style/sticker   # <ui-sticker> — disc / burst marker (multi-line)
npm install @browser.style/save      # <ui-save>    — favorite toggle  (card-only)
npm install @browser.style/play      # <ui-play>    — play affordance  (card-only)
npm install @browser.style/lightbox  # <ui-lightbox> — view-gallery / fullscreen toggle (card-only)
```

`<ui-play>` additionally peer-deps `@browser.style/icon` (its glyph is a `<ui-icon type="play">` sub-element, not a pseudo-element).

---

## Usage

### CSS-only (vanilla HTML)

```html
<link rel="stylesheet" href="@browser.style/base/index.css">
<link rel="stylesheet" href="@browser.style/media/index.css">
```

Or via CSS `@import`:

```css
@import '@browser.style/base';
@import '@browser.style/media/style';
```

```html
<ui-media media="asr(16/9) obp(ts) hov(zoom) scm">
  <img src="https://picsum.photos/800/450" alt="Mountain trail at dawn">
</ui-media>
```

### Optional JavaScript — one entry point, three chunks

The frame, overlays, scrim, and marker controls are **all pure CSS** — `<ui-media>` needs no JS. The enhancement layer is `index.js`, an orchestrator that imports three feature chunks; each chunk is also importable on its own, so a page can load just the slice it uses:

```js
import '@browser.style/card';                      // = index.js — hover + carousel + video
// …or cherry-pick:
import '@browser.style/card/hover.js';             // cursor-tracked hov(track|drift|tilt)
import '@browser.style/card/carousel.js';          // loop clones · autoplay · pause-on-slide-leave
import '@browser.style/card/video.js';             // embed facades · media commands · vid() tools · <ui-play>
import '@browser.style/card/ui-media-srcset.js';   // responsive Cloudflare srcset (transitional, see below)
```

| Module | Role |
|--------|------|
| **`index.js`** | The package entry (`main` / the `.` export). Imports the three chunks, exports `scan()`, and is the **sole owner** of the idle scan + `globalThis.uiMedia.scan`. |
| **`hover.js`** | Sets `--ui-media-mx` / `--ui-media-my` (−1…1) on frames matching `hov(track)`, `hov(drift)` or `hov(tilt)`. Listeners are attached per frame on first scan; the pointer handler is `requestAnimationFrame`-throttled and skips updates under `prefers-reduced-motion: reduce`. |
| **`carousel.js`** | Seamless `loop` (clone slides), `auto(…)` autoplay, pause-a-slide's-video-on-leave, and **fragment links to a slide scroll only the carousel** (§ Anchors). Slides are counted with the shared `NOT_SLIDE` exclusion list. |
| **`shared.js`** | Not a feature — the primitives `carousel.js` / `video.js` / `index.js` share (`mediaStr`, `hasToken`, `slidesOf` / `NOT_SLIDE`, `reflectPlay`, `bindVideo`). |
| **`ui-media-srcset.js`** | Registers the `<ui-media>` element and upgrades its `<img>` children (`loading`/`decoding`/`sizes="auto"` + host-gated Cloudflare `srcset`; see *Responsive images*). **Transitional** and deliberately outside `index.js` — once srcset is server-side rendered, stop loading it. |

A chunk imported on its own falls back to its own idle scan, so cherry-picking needs no extra wiring. All of them use the **exact same** HTML as CSS-only; with no JS the element still renders and still scrolls.

#### Attributes

| Attribute | Type | Description |
|-----------|------|-------------|
| `media` | token string | Configures the frame + overlays. Valid on `<ui-media>` **or its `<ui-card>` / `<ui-reveal>` host** (it inherits — but only from the card host, never from other ancestors). See the DSL below. |
| `cdn` | `on` \| `off` | Force-enable/disable the Cloudflare `srcset` upgrade regardless of host. Default: auto (on only for `*.browser.style`). |
| `breakpoints` | CSV of widths | Override srcset widths. Default `240,320,480,720,1200`. |
| `format` / `quality` / `fit` | string | Cloudflare transform params. Default `avif` / `80` / `cover`. |
| `sizes` | string | The `sizes` value. Default `auto`. |

Loading strategy is a **`media=` token**, not an attribute: `load(eager)` (all slides eager, first `<img>` gets `fetchpriority="high"` — hero) / `load(lazy)` (the default).

There are no per-overlay positioning/theming attributes on the overlay elements themselves — everything is driven from the parent `media=` string. (The overlay elements do expose their own `theme=` / `size=` for self-service use; see *Overlay furniture*.)

---

## The `media=` token DSL

The `media=` string is a small **domain-specific language**: space-separated **3-letter modifier codes** with `()` arguments, plus a couple of bare flags. Every token simply writes a `--ui-media-*` custom property, which is why **arbitrary values have an automatic escape hatch** via `style="--ui-media-*"` (see below) — there is no exhaustive token list to memorize.

Because custom properties inherit, **one rule set serves both placement cases**:

- `<ui-media media="asr(16/9)">` — matches itself → reads its own prop.
- `<ui-card media="asr(16/9)"><ui-media>…</ui-media></ui-card>` — the card matches → the prop **inherits down** to the nested `<ui-media>`.

### Token reference

The inventory below — every `media=` stem and bare flag, its argument vocabulary and
the custom properties it writes (the alias column is empty system-wide after the v5
sweep) — is **generated from
`data/tokens.json`**, the same manifest `render.js` and `tokens.lint.js` read. It cannot
drift from the CSS. (`md:/lg:` is the container-query prefix column: only `asr()` takes one.)

<!-- tokens:summary attr=media -->
| token | axis | args | aliases | bare | writes | md:/lg: | deprecated |
|---|---|---|---|---|---|---|---|
| `asr()` | aspect | **ratio** 1/1 1/2 6/7 3/4 4/3 3/2 2/3 16/9 21/9 | — | — | --ui-media-ar | md: lg: (ratio) | — |
| `obp()` | position | **pos** ts tc te cs cc ce bs bc be | — | — | --ui-media-op | — | — |
| `rds()` | corners | **size** non sm md lg xl 2xl full pill sm-sq md-sq lg-sq xl-sq | — | — | --ui-media-radius --ui-media-squircle-exp | — | — |
| `obf()` | fit | **mode** cover contain fill none | — | — | --ui-media-fit | — | — |
| `flp()` | flip | **mode** h v hv | — | — | --ui-media-fl-x --ui-media-fl-y | — | — |
| `shp()` | shape | **shape** pt-d pt-u pt-l pt-r cut-r cut-l skew-r skew-l para rhomb inset hex chev-l chev-r arr-l arr-r star plus minus close bolt msg frame frame-in blinds-h blinds-v curve-d curve-u curve-r curve-l circle circ-45 | — | — | --ui-media-shape --ui-shape-morph --_shp --_shp-full --_r4 --_r5 --_r5l --_r5r --_ell --_shp-clip | — | — |
| `hov()` | hover | **mode** zoom pan track drift tilt tilt-out tilt-in rot-r rot-l shape shape-rev gray blur bright sat dim tint | — | — | --_hv-dur --_hv-ease --_hv-t --_f-gray --_f-blur --_f-bright --_f-sat --_hv-any --_hv-zoom --_hv-pan --_hv-track --_hv-drift --_hv-tilt --_hv-tiltx --_hv-tilt-out --_hv-tilt-in --_hv-rot-r --_hv-rot-l --_hv-shape --_hv-filter --_hv-tint | — | — |
| `tnt()` | tint | **hue** red orange green blue accent black white gray slate | — | yes | --ui-media-tint-color --_tnt --_hv-tint | — | — |
| `scm()` | scrim | **pos** ts tc te cs cc ce bs bc be · **size** sm md lg xl · **tone** shr lgt med drk sld | — | yes | --ui-media-scrim --ui-media-scrim-paint --ui-media-scrim-color --ui-media-scrim-fade --ui-media-scrim-mid-stop --ui-media-scrim-end-stop --ui-media-scrim-cc-a --ui-media-scrim-cc-b | — | — |
| `chip()` | furniture | **pos** ts tc te cs cc ce bs bc be · **hue** red orange green blue accent black white gray slate · **mode** pale muted · **variant** lgt out · **size** sm lg xl 2xl · **disc** non rnd pll crc sqr | — | — | --ui-chip-* --_theme-base-bg --_theme-base-c --_theme-bg --_theme-c | — | — |
| `sticker()` | furniture | **pos** ts tc te cs cc ce bs bc be · **hue** red orange green blue accent black white gray slate · **mode** pale muted · **size** sm lg xl 2xl 3xl · **disc** non rnd pll crc sqr · **shape** text spl spr sh:burst sh:blob sh:spark sh:sunburst sh:heart sh:&lt;custom&gt; · **flag** fit | — | — | --ui-sticker-* --_theme-base-bg --_theme-base-c --_theme-bg --_theme-c | — | — |
| `save()` | furniture | **pos** ts tc te cs cc ce bs bc be · **hue** red orange green blue accent black white gray slate · **size** sm lg xl · **disc** non rnd crc sqr | — | — | --ui-save-c --ui-save-c-active --ui-save-sz --ui-save-circle-* | — | — |
| `play()` | furniture | **pos** ts tc te cs cc ce bs bc be · **hue** red orange green blue accent black white gray slate · **size** sm md lg xl · **disc** non rnd pll crc sqr | — | — | --ui-play-sz --ui-play-icon-sz --ui-play-bg --ui-play-c --ui-play-radius --ui-play-corner --_play-block --_play-inline --_play-justify --_play-size | — | — |
| `beacon()` | furniture | **pos** ts tc te cs cc ce bs bc be · **hue** red orange green blue accent black white gray slate · **mode** pale muted · **size** xs sm md lg xl 2xl · **face** sld tck ldr dts · **anim** bln pls brt · **disc** pll rnd sqr non | — | — | --ui-beacon-* --_theme-base-bg --_theme-base-c --_theme-bg --_theme-c | — | — |
| `lightbox()` | furniture | **pos** ts tc te cs cc ce bs bc be · **hue** red orange green blue accent black white gray slate · **size** sm lg xl · **disc** non rnd crc sqr | — | — | --ui-lightbox-c --ui-lightbox-c-hover --ui-lightbox-sz --ui-lightbox-circle-* --_lb-block --_lb-inline --_lb-justify --_lb-size | — | — |
| `marquee()` | band | **pos** top bot · **hue** red orange green blue accent black white gray slate · **mode** rpt seam fade pale muted · **size** sm lg xl 2xl · **disc** non rnd pll crc sqr · **value** right up down slow fast faster gap-sm gap-lg | — | — | --ui-marquee-* --_name --_dir --_theme-base-bg --_theme-base-c --_theme-bg --_theme-c --_mrq | — | — |
| `vid()` | video | **mode** cc pip fls · **size** sm md lg xl | — | — | --ui-media-tool-fullscreen --ui-media-tool-pip --ui-media-tool-cc --ui-media-tool-bg --ui-media-tool-bg-hover --ui-media-tool-size | — | — |
| `load()` | loading | **mode** eager lazy | — | — | — | — | — |
| `nav()` | carousel | **mode** mrk arw blw abv end non | — | yes | --ui-media-bg --ui-carousel-* | — | — |
| `arw()` | arrows | **variant** arr bare sqr sft lgt drk hid rev set · **size** sm lg xl · **pos** ts tc te cs cc bs bc be · **mode** blw abv out | — | — | --ui-carousel-arrow-glyph --ui-carousel-arrow-size --ui-carousel-arrow-radius --ui-carousel-arrow-bg --ui-carousel-arrow-bg-hover --ui-carousel-arrow-color --ui-carousel-arrow-color-hover --ui-carousel-arrow-ink --ui-carousel-arrow-ink-hover --ui-carousel-arrow-plate --ui-carousel-arrow-plate-hover --ui-carousel-arrow-shadow --ui-carousel-arrow-hover-ring --ui-carousel-arrow-nudge --ui-carousel-arrow-disabled-opacity --ui-carousel-arrow-top --_arw-rot --_arw-scale | — | — |
| `mrk()` | markers | **variant** pll hyb bar tmb tml rail non lgt drk sbr lbl dyn · **size** sm md lg xl · **pos** ts tc te cs cc ce bs bc be · **mode** blw abv | — | — | --ui-carousel-marker-size --ui-carousel-marker-bg --ui-carousel-marker-active --ui-carousel-marker-inset --ui-carousel-pill-width --ui-carousel-pill-height --ui-carousel-pill-track --ui-carousel-pill-fill --ui-carousel-thumb-size --ui-carousel-bar-* --ui-carousel-band --ui-carousel-rail --ui-carousel-sbr-* --ui-carousel-label-* --ui-carousel-tml-* --ui-carousel-dyn-* | — | — |
| `tmb()` | thumbs | **ratio** 1/1 4/3 3/4 16/9 3/2 2/3 | — | — | --ui-carousel-thumb-ratio --ui-carousel-thumb-ratio-n | — | — |
| `axis()` | carousel | **value** y | — | — | — | — | — |
| `auto()` | carousel | **value** &lt;n&gt; &lt;n&gt;s &lt;n&gt;ms | — | yes | --ui-carousel-autoplay --ui-carousel-play-state --ui-carousel-thumb-timer-name --_play-block --_play-inline --_play-justify --_play-size | — | — |
| `ani()` | carousel | **anim** rise fall lft rgt zom blr fde | — | — | --_stg-tr --_stg-sc --_stg-fl --_stg-origin | — | — |
| `crd()` | carousel | **anim** rise fall lft rgt zom blr fde | — | — | --_stg-crd-tr --_stg-crd-sc --_stg-crd-fl | — | — |
| `open:grid()` | open-state | **cols** 2c 3c 4c | — | — | --_lb-cols | — | — |
| `hug` | fill | — | — | yes | — | — | — |
| `clip` | corners | — | — | yes | --ui-media-radius | — | — |
| `loop` | carousel | — | — | yes | --_play-block --_play-inline --_play-justify --_play-size | — | — |
| `stagger` | carousel | — | — | yes | --_stg-base-i --_stg-crd-i | — | — |
| `gate` | carousel | — | — | yes | — | — | — |
| `pages` | carousel | — | — | yes | --_pg | — | — |
| `open:furniture` | open-state | — | — | yes | — | — | — |
<!-- /tokens -->

What each one is *for*:

| Token | Controls |
|-------|----------|
| `asr()` | aspect-ratio (or any ratio via `style="--ui-media-ar"`) |
| `rds()` | corners (**standalone only**) — plain steps plus `-sq` squircles |
| `obp()` | object-position (9-grid), logical cells only (`ts tc te · cs cc ce · bs bc be`) — the physical `tl…br` spellings were **removed in v5**; see below |
| `obf()` | object-fit |
| `flp()` | flip / mirror the image |
| `shp()` | clip the frame to one of the shared `--shape-*` glyphs (`ui/base/shapes.css`) |
| `hov()` | hover effect (image only) — 17 values across five families, see the table below |
| `tnt()` | colour tint over the image (`media.tint.css`, opt-in), faded out by `hov(tint)` |
| `scm()` | scrim — bare matches the host `ovr()`; three composable axes (direction · size · intensity) |
| `nav()` | carousel — **the token IS the trigger**; bare = markers + arrows (full control vocabulary — `arw()`, `mrk()`, `tmb()`, `axis(y)`, `auto`, `loop`, `stagger`, `load()` — in [carousel.md](./carousel.md)) |
| `vid()` | player-tool cluster over a chrome-less `<video>` — JS **injects** the requested buttons (bottom-end; order CC → PiP → fullscreen, fullscreen rightmost). Size mirrors `arw()` (`vid(sm)`…`vid(xl)`, default 2.5rem). Needs `index.js`; PiP feature-detected (skipped in Firefox). `cc` = subtitles/captions button (glyph only — **switching not wired yet**). *(Play/pause is `<ui-play>` furniture, not a `vid()` value.)* |
| `load()` | loading strategy — `load(eager)` makes every slide eager and gives the first `fetchpriority="high"` |
| `chip()` `sticker()` `beacon()` `save()` `play()` | place + theme an overlay element — position **or** hue **or** that element's own size/shape args, one atomic token each |
| `play()` | also **sizes** the `<ui-play>` control (`sm md lg xl`). Mirrors `<ui-play>`'s own `size=` scale; an explicit `size=` on the element still wins. Position args (`ts…be`) and size args are disjoint vocabularies, so one stem parses unambiguously. *(The old `ply(<size>)` stem was removed in v5.)* |
| `marquee()` | the `<ui-marquee>` **band** (not 9-grid furniture) — see *Overlay furniture* |
| `pages` | **`<lay-out overflow>` only** — one `::scroll-marker` per *page* of items instead of per item; see [carousel.md](./carousel.md#pages--one-marker-per-page-lay-out-overflow-only) |

#### `asr()` — the 9 numeric aspect ratios

<!-- tokens:args attr=media stems=asr -->
| token | arg class | values | aliases |
|---|---|---|---|
| `asr()` | **ratio** | 1/1 1/2 6/7 3/4 4/3 3/2 2/3 16/9 21/9 | — |
<!-- /tokens -->

There were never any named keywords — ratios are always numeric. Any other ratio goes through the escape hatch: `style="--ui-media-ar: 5/4"`. Setting `asr()` also zeroes the frame's `min-block-size` so the ratio governs height.

**Responsive aspect — `md:asr()` / `lg:asr()`.** `asr()` is the one `media=` token that takes the card's `md:`/`lg:` **container-query** prefixes (all other `media=` tokens are unprefixed). The prefixed form re-sets the ratio once the card itself renders ≥ 25rem (`md:`) or ≥ 44rem (`lg:`) wide — so a card can be portrait when it's the only one in a narrow carousel and landscape once it widens:

```html
<ui-card media="asr(3/4) md:asr(3/2)">…</ui-card>
```

The base (unprefixed) value is the small-card default; the prefixes only ever override upward in width. Only `asr()` is prefixable — the base rule is whole-token (`~=`) matched so `md:`/`lg:` variants don't leak into it. (Prefixes are the card's own width via container queries, not the viewport, so aspect tracks how wide the card actually renders regardless of layout.)

**`asr()` loses to a row card — unless you add `hug`.** In a `row`/`md:row`/`lg:row` card the frame is given `block-size: 100%` so a photo fills the card's full height beside the text. A definite height beats `aspect-ratio`, so the declared `asr()` is silently discarded and `object-fit: cover` crops the image to whatever the copy length happens to produce — a 4:3 photo in a card whose text column runs 456px tall is cropped to 1.08:1, and the crop moves every time the copy is edited. Most row cards want the fill; the ones that mean their ratio say so:

```html
<ui-card variant="col lg:row lg:spl(1/1)" media="asr(4/3) hug rds(lg)">…</ui-card>
```

`hug` opts the frame out of the fill rule (all three tiers) and adds `align-self: start`, so grid stretch cannot put the height back. It is bare, substring-matched and unprefixed — whether a frame owns its height is not a breakpoint decision — and inert outside a row card, where the frame already owns its height. `mrk(rail)` frames opt out of the same rule for their own reason (the rail reserves inline space), which is why the thumbnail-rail product page never had this problem and the single-photo one did.

**Where the attribute may sit.** Each prefixed `asr()` ships **two arms**, so the token works in either placement:

| `media=` sits on | Arm | Works? |
|---|---|---|
| the host `<ui-card>` / `<ui-reveal>` | host arm — `:where([media~="md:asr(…)"]) :is(cq-box, summary)` | yes (needs the `<cq-box>` / `<summary>` descendant) |
| the `<ui-media>` itself, inside a card | self arm — `:where(ui-media[media~="md:asr(…)"])` | yes — this is the **renderer's canonical placement** |
| a standalone `<ui-media>`, no card | self arm | only inside a `bs-card`-named container — see below |

The queries are **named**: `@container bs-card (inline-size >= 25rem)`. An *unnamed* size query resolves against the subject's nearest size container, so a self-armed `<ui-media>` standing outside a card could otherwise switch tiers off an unrelated ancestor's width. With the name, only `ui-card` / `ui-reveal` / `lay-out-group` match. A standalone primitive opts in deliberately:

```html
<div style="container: bs-card / inline-size">
  <ui-media media="asr(3/4) md:asr(16/9)"><img src="…" alt="…"></ui-media>
</div>
```

#### `rds()` — corners (standalone only)

Inside `<ui-card>`/`<ui-reveal>` the **parent** rounds and clips the frame (via its own `variant="rds(…)"`), so you don't set corners on the media. A **standalone** `<ui-media>` can round its own corners with `rds()` — the same scale as the card:

```
rds(sm)  rds(md)  rds(lg)  rds(xl)  rds(2xl)  rds(full)  rds(pill)
rds(sm-sq)  rds(md-sq)  rds(lg-sq)  rds(xl-sq)      ← squircle (superellipse corner-shape)
```

The plain steps map to the global `--radius-*` tokens; the `-sq` variants add a bespoke radius plus `corner-shape: superellipse()` (Chrome 135+, degrades to the rounded radius). Arbitrary corners via the escape hatch: `style="--ui-media-radius: 1rem"`.

Add **`clip`** to also apply `clip-path: inset(0 round …)` at that same radius — a **scroll container** (carousel) can drop its rounded corners mid-scroll because `border-radius` + `overflow` compositing lets the scrolled content bleed past the corner; `clip-path` clips reliably. It's a boolean token that reuses the `rds()` value (`--ui-media-radius`, falling back to the card radius), so `rds(2xl) clip` rounds *and* clips. (`round()` has no superellipse, so a `-sq` frame clips as a plain round.) Note: `clip-path` also clips anything overlaid at the very edge, so keep controls/furniture inset.

#### `obp()` — object-position 9-grid

The same nine logical cells the rest of the system uses — furniture, `scm()`, `ovr()`, `mrk()`, `arw()`, `plc()`, reveal's `ico()`.

```
ts  tc  te   ·   cs  cc  ce   ·   bs  bc  be     ← s/e follow the writing direction
```

`s`/`e` mirror: `obp(ts)` is `left top` in LTR and `right top` under `dir="rtl"`. The centre
column (`tc` `cc` `bc`) is axis-pure and never moves. Default (no token) is `center`.

**Why this needs machinery.** `object-position` has **no logical keywords in any engine**.
The css-values-4 `<position>` grammar does list `x-start`, `y-end`, `block-start`,
`inline-start` and bare `start`/`end`, but none of them are implemented — Chromium 151
rejects every one and computes `50% 50%`. So the cell is resolved in two axes: the block
letter sets `--_obp-b` (`top`/`center`/`bottom`), the inline letter sets `--_obp-i` from
base's `--_dir-s`/`--_dir-e` pair, which flips once per direction for the whole system
instead of once per family.

**For a focal point that must *not* mirror** — a subject baked into the left of the frame,
where the photo's own geometry is what matters and the page's reading direction is
irrelevant — set the public custom property directly. It takes the full `object-position`
grammar, so it is strictly more expressive than the six physical corner keywords it
replaced (`obp(tl…br)`, removed in v5):

```html
<ui-media style="--ui-media-op: 30% 20%">
```

It wins over any `obp()` token on the same element. `flp(h)` covers the other case — mirroring
the asset itself.

#### `flp()` — mirror

`flp(h)` flips horizontally (`--ui-media-fl-x: -1`), `flp(v)` vertically, `flp(hv)` both. Applied as a `transform: scale()` on the `img`/`video` so it composes with hover effects.

#### `hov()` — hover effect (image only)

Seventeen values in five families. All compose — the animated properties share **one** transition list on the image, so `hov(shape) hov(zoom)` (or `hov(gray) hov(blur)`) stack without clobbering each other.

| Value | Family | JS? | Effect |
|-------|--------|-----|--------|
| `zoom` | scale | — | scales the image up on hover (`1.08`) |
| `pan` | scale | — | scales (`1.12`) + translates in a **fixed** direction |
| `track` | cursor | **yes** | cursor-tracked pan — image follows the pointer (`1.12` + up to `4%` translate) |
| `drift` | cursor | **yes** | cursor-**counter** parallax — oversized image (rest `1.3`) shrinks toward `1.2` on hover and drifts **opposite** the cursor |
| `tilt` | cursor | **yes** | 3D rotate **toward** the cursor (`rotateX`/`rotateY`, up to `8deg`) on a `600px` perspective; overfills to `1.08` while active so the rotated corners don't expose the frame |
| `tilt-out` | 3D | — | **fixed** tilt on hover, top edge toward the viewer (`rotateX −14deg`) |
| `tilt-in` | 3D | — | **fixed** tilt on hover, top edge away (`rotateX +14deg`) |
| `rot-r` | rotate | — | whole-image rotation right (`3deg`) + `1.06` overfill |
| `rot-l` | rotate | — | whole-image rotation left |
| `shape` | clip | — | morphs the `shp()` clip-path to its `--ui-shape-morph` target on hover |
| `shape-rev` | clip | — | the same morph set up in the reverse direction (`media.shapes.css`) |
| `gray` | filter | — | rest greyscale, restored to colour on hover |
| `blur` | filter | — | rest blurred (`4px`), sharpens on hover |
| `bright` | filter | — | rest darkened (`0.6`), restored on hover |
| `sat` | filter | — | rest desaturated (`0.4`), restored on hover |
| `dim` | filter | — | the filter family's exception: rest **natural**, hover **darkens** (`0.6`) — for text overlaid on the image |
| `tint` | tint | — | fades a `tnt()` colour tint out on hover to reveal the true-colour image. Lives in `media.tint.css`, which is **opt-in** — `ui-card.css` does not bundle it, so link it on pages that tint |

**Which need JS.** Only the three **cursor** effects — `track`, `drift`, `tilt` — read `--ui-media-mx` / `--ui-media-my`, which are set by the pointer handler in `hover.js` (load `index.js`, or `hover.js` alone). Without it those three are inert: `track`/`drift` sit at their resting scale and `tilt` renders flat. Everything else is pure CSS.

> `hov(tilt)` is **not** gone in v4 — it ships, and it is the cursor-driven member of the tilt family. `tilt-out` / `tilt-in` are its JS-free fixed-angle siblings. (What *was* removed in v4 are the old card-level hovers `hv(lift)` / `hv(shrink)` / `hv(tilt)` — the `hv()` stem itself; hover is now media-only under `hov()`.)

All hover effects are guarded by `@media (hover: hover)`. Under `prefers-reduced-motion: reduce` transitions are dropped, the cursor effects pin to their resting position, and the JS handler stops updating. The four filter vars are registered with `@property` so the filter **interpolates** instead of jumping. The token can sit on the host `<ui-card>`/`<ui-reveal>` or on the `<ui-media>` itself — one folded selector serves both arms (`hov(tint)` is the exception: it paints on `ui-media::before` and keeps two literal arms, see *v5 support posture* below).

### Arbitrary values — the `style=` escape hatch

Every `()` token is *sugar* over a custom property, so any value that has no token is set directly:

```html
<ui-media media="hov(zoom)" style="--ui-media-ar: 5/4; --ui-media-hv-zoom: 1.15;">
  <img src="…" alt="…">
</ui-media>
```

---

## Overlay furniture

The media area hosts **six overlay elements** — `<ui-chip>`, `<ui-beacon>`, `<ui-sticker>`, `<ui-save>`, `<ui-play>`, `<ui-lightbox>`. They carry **only their text/glyph** — position and theme come from the parent `media=` string (so a `<ui-card>` can configure them and the config inherits down).

### Furniture vs band — `<ui-marquee>` is not furniture

A seventh element, **`<ui-marquee>`, is a *band*, not furniture**, and that distinction is why it is counted separately:

| | Furniture (chip · beacon · sticker · save · play · lightbox) | Band (`<ui-marquee>`) |
|---|---|---|
| Sizing | intrinsic — as wide as its content | **full-width** (`inset-inline: 0`) |
| Placement | any of the **nine** logical grid points | **top / bottom only** — a full-width strip has no `start`/`end`, and no centre row |
| Vocabulary | `el(ts…be)` | `marquee(top)` (default) / `marquee(bot)` |
| Stacking | `z-index: 2` | `z-index: 1` — **below** the furniture, so a chip or beacon sits on top of a running band |

Two placement modes:

- **Overlaid in `<ui-media>`** — the band is absolutely positioned and **token-placed**: `marquee(top)` (the default) or `marquee(bot)`.
- **Inside `<ui-content>`** — the band is an ordinary flow child and is **markup-placed**: it lands wherever you write it in source order. There is no position token in this mode.

```html
<!-- overlaid on the media, pinned to the bottom -->
<ui-card variant="col" media="asr(4/3) marquee(bot) marquee(rpt) marquee(red) marquee(sm)">
  <cq-box>
    <ui-media>
      <img src="…" alt="…">
      <ui-marquee aria-label="BREAKING NEWS • BREAKING NEWS • "></ui-marquee>
    </ui-media>
    <ui-content>…</ui-content>
  </cq-box>
</ui-card>
```

Args beyond position: mode `marquee(rpt)` (continuous repeat) / `marquee(seam)` / `marquee(fade)`, hue (the canonical nine, below), size `marquee(sm|lg|xl|2xl)`, speed `marquee(slow|fast|faster)`, gap `marquee(gap-sm|gap-lg)`, corner `marquee(non|rnd|pll|crc|sqr)`, direction `marquee(right|up|down)`.

> **`marquee(rpt)` was `marquee(loop)`.** Renamed because `loop` is also a bare carousel flag in the same `media=` string — `media="nav loop"` starts autoplay-with-clones, and a substring-matched `marquee(loop)` collided with it. The old spelling is **fully removed** (no live alias — the one rename where keeping one would re-create the collision surface); the carousel's own bare `loop` is whole-token matched so the two can never cross-fire again.

Content is markup-free: put the text in `aria-label` on an empty `<ui-marquee>` and it fills `::before`/`::after` while doubling as the accessible name. Full component: [ui/marquee](../../marquee).

> **Placement caveat.** Unlike the nine-point furniture tokens, the two *position* tokens are matched as `:where([media*="marquee(top|bot)"]) ui-media ui-marquee` — the token holder must be an **ancestor** of the `<ui-media>`. Put `marquee(bot)` on the `<ui-card>`/`<ui-reveal>` host, not on the `<ui-media>` itself. Every other `marquee()` arg (hue, size, mode, speed…) resolves through the component's own arms and works from either placement; `marquee(top)` is the base default regardless.

### The 3×3 positioning grid

Overlays are **absolutely positioned** (not grid items — that survives the carousel's flex scroller). Each element is placed at one of nine **logical** positions via `inset-block` / `inset-inline` + `translate`, the inset driven by `--ui-media-overlay-gap`:

```
ts   tc   te        top-start    top-center    top-end
cs   cc   ce   →    center-start center-center center-end
bs   bc   be        bottom-start bottom-center bottom-end
```

Positions use **logical** insets (`inset-inline-start/-end`), so they **mirror automatically in RTL** — `ts` renders top-right in Arabic. An overlay element just *picks a position*; the geometry is keyed on the parent `media="el(pos)"` token, never duplicated per element instance. The `img` / `video` sit underneath (`position: absolute; inset: 0`).

### The six elements & their default areas

| Element | Role | Default area | Type | Valid in `<summary>`? |
|---------|------|--------------|------|------------------------|
| `<ui-chip>` | label ("New", "Sale") | `ts` (top-start) | marker (non-interactive) | ✅ yes |
| `<ui-beacon>` | live/status indicator ("LIVE", "REC") | `ts` (top-start) | marker (non-interactive) | ✅ yes |
| `<ui-sticker>` | callout disc / burst ("−20%") | `te` (top-end) | marker (non-interactive) | ✅ yes |
| `<ui-save>` | favorite / wishlist toggle | `te` (top-end) | **control** (interactive) | ❌ card-only |
| `<ui-play>` | play affordance | `cc` (center) | **control** (interactive) | ❌ card-only |
| `<ui-lightbox>` | view-gallery / fullscreen toggle | `bs` (bottom-start) | **control** (interactive) | ❌ card-only |

**Markers vs controls.** Markers (`<ui-chip>`, `<ui-beacon>`, `<ui-sticker>`) are non-interactive autonomous custom elements = valid **phrasing content**, so they parse inside a card *and* inside a reveal `<summary>` (the trigger face), with **no JS**. Controls (`<ui-save>`, `<ui-play>`, `<ui-lightbox>`) are interactive → **card-only**: a click inside `<summary>` toggles the `<details>`, and interactive content is invalid there.

### Position override

Override an element's default area with a position token in `media=`:

```html
<ui-media media="chip(be) sticker(cc)">
  <img src="product.jpg" alt="Product">
  <ui-chip>Bottom-end label</ui-chip>       <!-- moved to be -->
  <ui-sticker>Center</ui-sticker>           <!-- moved to cc -->
</ui-media>
```

A position token writes the element's `inset-block` / `inset-inline` / `translate` directly — there is no intermediate `--ui-media-*-area` custom property. Overlay
elements are **always children of `<ui-media>`** (the box that positions them) — see
[Nesting](#nested-in-ui-card--everything-configured-on-the-parent).

### Theming an overlay from the parent

Theme an element with a **sub-theme key** in `media=`:

```html
<ui-media media="chip(red) sticker(green)">
  <img src="product.jpg" alt="Product">
  <ui-chip>Sale</ui-chip>            <!-- red bundle -->
  <ui-sticker>-20%</ui-sticker>      <!-- green bundle -->
</ui-media>
```

#### The canonical nine hues

```
red   orange   green   blue
accent   black   white   gray   slate
```

Four hues + five neutrals — decorative, *not* status. The neutral ramp runs
`white < gray < slate < black`; `slate` was promoted from a `gray` alias to a
canonical hue in v5 because it always routed to its own `--ui-theme-slate-*`
bundle, never to gray's. They route into the element's **own** tokens (`--ui-chip-accent`/`-c`, `--ui-sticker-bg/-c`, `--ui-beacon-accent/-c`, `--ui-marquee-bg/-c`, `--ui-save-c`, `--ui-play-bg/-c`) and resolve from the shared `--ui-theme-*` bundles defined once in `@browser.style/base`. This is the **same palette** as each element's self-service `theme=` attribute — `media="chip(red)"` and `<ui-chip theme="red">` produce identical colors.

Two **fill modifiers** compose on top of a hue: `el(pale)` (mixed 80% into the surface, hue-coloured ink) and `el(muted)` (50% transparent).

#### Removed hue aliases (v5)

The doc-era spellings `dark`, `light` and `subtle` were **removed in v5** on every
hue-taking token — use `black`, `white` and `gray`. `slate` was *not* removed: it
became a canonical hue (above). Nothing is left in the alias table, which is
generated, so it stays empty until a new alias is declared:

<!-- tokens:aliases attr=media stems=tnt,chip,sticker,beacon,marquee,save,play,lightbox -->
| deprecated | canonical | on | kind |
|---|---|---|---|
<!-- /tokens -->

> **Why `slate` was promoted rather than removed.** `dark`/`light`/`subtle` really were re-spellings of `black`/`white`/`gray` and routed to those bundles, so dropping them cost nothing. `slate` never did: it routes to its **own** `--ui-theme-slate-*` bundle — a fifth neutral, one step lighter than `black` — and every one of the six furniture/band elements plus `tnt()` implements it. Removing it would have deleted a colour, so it joined the canonical set instead. `theme="slate"` on the element itself keeps working exactly as before.

#### Per-element support matrix (generated from the manifest)

The furniture stems and the exact vocabulary each one accepts. A blank cell means that
element has no such axis — `pos` and `hue` are universal; the rest differ per element.

<!-- tokens:matrix attr=media stems=chip,sticker,beacon,marquee,save,play,lightbox classes=pos,hue,mode,size,disc,face,anim,shape,flag,value -->
| token | pos | hue | mode | size | disc | face | anim | shape | flag | value | deprecated aliases |
|---|---|---|---|---|---|---|---|---|---|---|---|
| `chip()` | ts tc te cs cc ce bs bc be | red orange green blue accent black white gray slate | pale muted | sm lg xl 2xl | non rnd pll crc sqr | — | — | — | — | — | — |
| `sticker()` | ts tc te cs cc ce bs bc be | red orange green blue accent black white gray slate | pale muted | sm lg xl 2xl 3xl | non rnd pll crc sqr | — | — | text spl spr sh:burst sh:blob sh:spark sh:sunburst sh:heart sh:&lt;custom&gt; | fit | — | — |
| `beacon()` | ts tc te cs cc ce bs bc be | red orange green blue accent black white gray slate | pale muted | xs sm md lg xl 2xl | pll rnd sqr non | sld tck ldr dts | bln pls brt | — | — | — | — |
| `marquee()` | top bot | red orange green blue accent black white gray slate | rpt seam fade pale muted | sm lg xl 2xl | non rnd pll crc sqr | — | — | — | — | right up down slow fast faster gap-sm gap-lg | — |
| `save()` | ts tc te cs cc ce bs bc be | red orange green blue accent black white gray slate | — | sm lg xl | non rnd crc sqr | — | — | — | — | — | — |
| `play()` | ts tc te cs cc ce bs bc be | red orange green blue accent black white gray slate | — | sm md lg xl | non rnd pll crc sqr | — | — | — | — | — | — |
| `lightbox()` | ts tc te cs cc ce bs bc be | red orange green blue accent black white gray slate | — | sm lg xl | non rnd crc sqr | — | — | — | — | — | — |
<!-- /tokens -->

> **Honest gap: no `pale`/`muted` on `save`/`play`/`lightbox`.** The `mode` column is empty for all three — the **hue** axis on each drives a single ink (`--ui-save-c`, `--ui-play-bg/-c`, `--ui-lightbox-c`) with nothing to mix a tint into, so `media="save(pale)"` / `media="play(muted)"` are silently inert. All three *do* ship the full canonical nine, `slate` included (verified in `ui/save/ui-save.css` and `ui/play/ui-play.css`), so hue itself has no holes.
>
> Not a hue: `save`/`lightbox` also carry a **disc**, and its default is inherited from the carousel rather than from the page — `--ui-carousel-arrow-plate` / `-ink`, so the furniture matches the arrows in every nav style and no longer flips with `color-scheme` on its own. See [carousel.md § The furniture discs follow the arrows](./carousel.md#the-furniture-discs-follow-the-arrows).

> **Position and hue are disjoint vocabularies** (`ts…be` vs `red…gray`), so `chip(cc)` and `chip(black)` parse unambiguously. They are **two atomic tokens** — `media="chip(te) chip(black)"`, not a combined `chip(te black)` — so the pure-CSS substring parser can scope each arg to its element. Because position usually defaults by role, the common case is a single token (e.g. `chip(black)`).

### Element details

| Element | Shape / markup | Notes |
|---------|----------------|-------|
| `<ui-chip>` | pill label (reuses `ui/chip`) | `variant` light/outline/square/squircle, `size`, `theme`, `color`. (The unrelated `<ui-badge>` cart-number badge is untouched.) |
| `<ui-beacon>` | animated dot / pill / solid label (reuses `ui/beacon`) | the chip's **live** counterpart. Card tokens: hue `beacon(red…white)` (same `--ui-theme-*` bundles as chip/sticker), face `beacon(dts)` dots / `beacon(pll)` pill / `beacon(sld)` solid / `beacon(tck)` ticker (markup-free — the sliding panel and dot loader are pseudo-elements), animation `beacon(bln)` blink / `beacon(pls)` pulse / `beacon(brt)` breathe / `beacon(non)` off (solid defaults to blink), size `beacon(xs\|sm\|md\|lg\|xl\|2xl)`, corner `beacon(rnd\|sqr)`, arbitrary colour via `fill=`/`ink=`. Over imagery prefer `pll`/`sld` — the bare dot has no contrast plate. **Marker-class as furniture**: plain text-only markup, summary-safe. Animations are gated behind `prefers-reduced-motion: no-preference` (never start for reduced-motion users); `[paused]` freezes a running one. |
| `<ui-sticker>` | round disc; opt-in starburst via `variant="sh:burst"` (`--ui-sticker-clip-path`); **multi-line** | each direct child is a line; `--ui-sticker-gap` controls line-spacing, `text-box: cap alphabetic` trims leading |
| `<ui-save>` | `<ui-save><button type="button" command="--save" commandfor="<media id>" aria-label="Save …"><ui-icon type="shape" shape="heart" variant="outline"></ui-icon></button></ui-save>` | favorite ≈ wishlist ≈ bookmark. Composes an **invoker button** with `aria-pressed` for saved state (`aria-pressed="true"` = saved) — the same invoker shape `<ui-play>` uses. Glyph via the `<ui-icon shape>` (heart / bookmark / star). |
| `<ui-play>` | see the invoker contract below | play affordance (default `cc`, sized with `play(sm\|md\|lg\|xl)`). `variant="reveal"` hides until media hover/focus. **In a scrolling carousel** (`auto`/`loop`) it becomes the play/pause control: `position:sticky`-pinned to the scrollport (plain furniture scrolls away) and wired by `carousel.js` — see [media.carousel.md](./media.carousel.md#playpause-control-ui-play). |
| `<ui-lightbox>` | `<ui-lightbox><button type="button" command="toggle-popover" commandfor="<media id>" aria-label="View gallery"><ui-icon type="grid"></ui-icon></button></ui-lightbox>` | view-gallery / fullscreen toggle (default `bs`). The **built-in** `toggle-popover` command lifts a `<ui-media popover>` frame into the top layer — see [Lightbox](#lightbox--the-popover-fullscreen-gallery). In a `nav` scroller it is sticky-pinned like `<ui-play>` and must sit **before the slides** (first child); start corners only. |

#### `<ui-play>` — one contract

Over a `<video>` — or a chromeless `<audio>` (podcast cards) — `<ui-play>` is driven **declaratively** by the Invoker Commands API. The inner `<button>` carries `command="--play-pause"` and `commandfor="<video id>"` — the `--` prefix is the spec's custom-command namespace, used because the proposed bare `play-pause` value does not validate yet; `video.js` handles both spellings:

```html
<ui-media media="play(cc) play(lg)">
  <video id="reel" src="/media/reel.mp4" playsinline poster="/media/reel.jpg"></video>
  <ui-play>
    <button type="button" command="--play-pause" commandfor="reel" aria-label="Play">
      <ui-icon type="play-pause" aria-hidden="true"></ui-icon>
    </button>
  </ui-play>
</ui-media>
```

- **`video.js` handles the command** — it ships a polyfill for the proposed media commands (`play-pause`, `play`, `pause`, `toggle-muted`) that **auto-disables** once the browser supports them natively.
- **State is mirrored, never guessed.** The `<video>`'s own `play`/`pause`/`ended` events drive `aria-pressed` on the button and `[open]` on the host, which morphs a `<ui-icon type="play-pause">` glyph purely in CSS.
- **There is no `ui-play-toggle` event in the card system.** A button carrying `command`/`commandfor` is toggled by the command handler; the card's JS only reflects state, or the two would cancel each other out.
- **CSS-only fallback** is the authored static button plus the browser's own `<video controls>` if you add it — the frame, the sizing and the placement need no JS at all.
Two shapes sit outside the invoker contract, both because their target isn't an `HTMLMediaElement`:

- **Provider embeds** (`provider="youtube|vimeo"`) use the **click facade** in `video.js` — the click drops the poster, appends `autoplay=1` and hands off to the platform player. An `<iframe>` can't receive a media command.
- **The carousel control** — with no `commandfor`, a `<ui-play>` inside an `auto`/`loop` scroller is auto-discovered by `carousel.js`, which binds the click directly and writes `--ui-carousel-play-state` (`running`/`paused`), freezing the `mrk(pll)` / `mrk(tmb)` fill timer with it.

**`<ui-sticker>` multi-line** — "SAVE / 20%" is two children at different scales:

```html
<ui-sticker variant="sh:burst">
  <span style="font-size:.7em">SAVE</span>
  <b style="font-size:1.6em">20%</b>
</ui-sticker>
```

A single text node still works as one line: `<ui-sticker>-20%</ui-sticker>`.

> **Removed:** `ribbon` and `counter` (and the diagonal-ribbon treatment). **Deferred:** a sold-out / `cover` full-bleed state. *(The once-deferred Popover-API lightbox has landed as the frame-level [Lightbox](#lightbox--the-popover-fullscreen-gallery) + `<ui-lightbox>` furniture; the remaining `<ui-play>`-specific sugar — auto-play-on-open — is a ~5-line `lightbox.js` extension.)*

---

## Carousel

The `nav()` token **is the trigger** — there is no separate `crs` flag. Any `nav` turns the frame into a flex scroll-snap row; each direct `img`/`video` becomes a 100%-wide slide. (Full token reference and recipes: [carousel.md](./carousel.md); internals: [media.carousel.md](./media.carousel.md).)

| Token | Controls shown |
|-------|----------------|
| `nav` *(bare)* | dots **+** arrows |
| `nav(mrk)` | dots only |
| `nav(arw)` | arrows only |
| `nav(blw)` | dots **+** arrows in a reserved **band below** the media (not overlaid) |
| `nav(abv)` | dots **+** arrows in a reserved **band above** the media |

```html
<ui-media media="nav asr(16/9)">
  <img src="…/1" alt="Slide 1">
  <img src="…/2" alt="Slide 2">
  <img src="…/3" alt="Slide 3">
</ui-media>
```

Controls use native `::scroll-marker` (dots) and `::scroll-button(inline-start|inline-end)` (arrows — the keyword names the scroll *action*, so Previous/Next stay correct in RTL), `@supports`-gated and anchor-positioned to each scroller — they **degrade to a bare swipeable scroller** where unsupported. Smooth scroll is enabled under `prefers-reduced-motion: no-preference`.

The full marker/arrow token surface is token-driven (see *Tokens* — `--ui-carousel-marker-*`, `--ui-carousel-arrow-*`, and `--ui-carousel-overlay-gap` which drives the control inset). Arrows ship with **built-in glyph sets** — `--ui-carousel-chevron-{light,dark,grey}` and `--ui-carousel-arrow-{light,dark,grey}` — selected by `arw(lgt)`/`arw(drk)`/`arw(arr)`; colour the circle with `--ui-carousel-arrow-bg`, or point the single `--ui-carousel-arrow-glyph` at your own `url()` to fully customise.

All carousel CSS lives in **`media.carousel.css`** (imported by `ui-card.css` alongside `media.css`).

### Arrow style & placement — `arw()`

| Token | Effect |
|-------|--------|
| *(default)* | chevron glyph in a frosted light circle, vertically centered — no token needed |
| `arw(arr)` | full-arrow glyph, shaft + head (shape) |
| `arw(lgt)` · `arw(drk)` | theme — light circle + dark glyph (the default, made explicit) / dark circle + white glyph |
| `arw(sm)` · `arw(lg)` · `arw(xl)` | arrow button size (`1.75` / `2.75` / `3.25rem`; default `2.25rem`, no token) |
| `arw(sqr)` · `arw(sft)` | square button — sharp corners / slight radius |
| `arw(ts…be)` | placement cell — `ts tc te · cs cc · bs bc be`. For **split** arrows only the block row counts (`tc` top / `cc` center, the default / `bc` bottom); the inline letter matters under `axis(y)` and for `arw(set)` |
| `arw(set)` | both arrows as an adjacent pair (place with `arw(set) arw(<cell>)`, default inline-end) |
| `arw(bare)` | drop the circle — render the glyph itself as a coloured arrow (any colour) |
| `arw(hid)` | **auto-hide** the dead-end arrow (no slide that way) — opt out of the always-visible default |
| `arw(blw)` · `arw(abv)` | arrows alone in a reserved band below / above the media |

`arw()` atoms are **independent** — combine them as separate tokens, e.g. `arw(arr) arw(drk) arw(lg)` or `arw(set) arw(bc)`, **not** `arw(arr drk)`. Shape (`arw(arr)`) and theme (`arw(lgt)`/`arw(drk)`) are separate axes and compose. A direct `style="--ui-carousel-arrow-glyph: url(…)"` still overrides as an escape hatch — it is **one** token for both directions; the button pseudo mirrors it per direction.

#### Theming arrows

Two render modes, both token-driven — no named theme atoms needed:

- **Circle** *(default)* — an Instagram-style frosted button: a semi-transparent-white `--ui-carousel-arrow-bg` (`rgb(255 255 255 / 0.7)`, picks up the image tint), dark glyph, no border, and a soft `--ui-carousel-arrow-shadow`. Colour the circle with `--ui-carousel-arrow-bg` / `--ui-carousel-arrow-bg-hover`; for a dark circle + white glyph in one token use `arw(drk)` (composes with `arw(arr)`). Square it with `--ui-carousel-arrow-radius` (or `arw(sqr)`/`arw(sft)`); add a border with `--ui-carousel-arrow-border`, drop the shadow with `--ui-carousel-arrow-shadow: none`.
- **Bare** (`arw(bare)`) — no circle; the glyph *is* the colour, set with `--ui-carousel-arrow-color` (and `--ui-carousel-arrow-color-hover`). Default ink is **white** over an image and **auto-flips dark** in a `nav(blw)`/`nav(abv)` (light) band. Set any colour:

```html
<!-- black bare arrows -->
<ui-media media="nav(arw) arw(bare)" style="--ui-carousel-arrow-color: #000">…</ui-media>
```

Bare drops the circle (and its `--ui-carousel-arrow-shadow`), so a white glyph relies on the image being dark enough; over bright photos use `arw(bare)` on a `nav(blw)`/`nav(abv)` band, or keep the frosted circle. Bare composes with `arw(arr)` (masked full-arrow) and every placement/`set` atom.

**By default every arrow stays visible** — at the first/last slide the dead-end arrow dims to `--ui-carousel-arrow-disabled-opacity` (default `0.4`) instead of disappearing. Add `arw(hid)` to auto-hide it instead.

### Pill dots with autoplay fill — `mrk()`

| Token | Effect |
|-------|--------|
| *(default)* | round dots — no token needed |
| `mrk(pll)` | rounded-rect pills; the **active** pill fills left→right over `--ui-carousel-autoplay` (default `5s`) as a timer hint |
| `mrk(hyb)` | hybrid — round dots whose active marker morphs into a pill and runs the same fill timer |
| `mrk(sm)` · `mrk(md)` *(default)* · `mrk(lg)` · `mrk(xl)` | dot / pill size (composes with `mrk(pll)`) |

The fill restarts whenever the active slide changes (`:target-current`); the `auto` token (JS autoplay) keeps it in sync with the advance interval. Under `prefers-reduced-motion: reduce` the active pill shows filled with no animation. Theme with `--ui-carousel-pill-track` / `--ui-carousel-pill-fill` / `--ui-carousel-pill-width` / `--ui-carousel-pill-height`.

Those four are the frame-level highlights. The **full** `mrk()` vocabulary — `bar` (styled scrollbar) · `tmb` (thumbnails) · `rail` · `sbr` (real scrollbar) · `lbl` (`aria-label` text pills) · `non` · the `lgt`/`drk` ink pair · the nine placement cells · the `blw`/`abv` band atoms — is generated in [carousel.md](./carousel.md#token-reference).

### Controls in a band — `nav(blw)` / `nav(abv)`

`nav(blw)` shows **both** controls in a reserved, non-scrolling **bottom band** beneath the frame (the band is block-end padding on the flex scroller, so the absolute controls re-anchor into it without overlaying the image); `nav(abv)` is the mirror band above. Default layout: dots centered, arrows at the band's left/right ends. Combine with `arw(set)` to pin the dots to the start and pair the arrows at the end, or `mrk(pll)` for a timer bar across the band. Size the band with `--ui-carousel-band` (default `2.75rem`); colour it with `--ui-carousel-controls-bg`. The `arw(tc)/arw(cc)/arw(bc)` placement atoms are for the **overlay** variant — the bands own their own vertical placement.

> **Band slides are sized by stretch, not by `block-size: 100%`.** The generic slide rule uses a percentage, and WebKit resolves a flex item's percentage block size against the scroller's **padding** box — which under `blw`/`abv` is the image box *plus* the reserved band, so every slide paints over the band and the controls land on top of the image. Band slides therefore get `align-self: stretch; block-size: auto` instead, which resolves against the content box in both engines (`media.carousel.css`). `calc(100% - band)` is **not** a fix: Chromium's percentage was already correct and would subtract the band twice.

---

## Collage — a `<lay-out>` grid inside the frame

A frame does not have to hold one image. Give `<ui-media>` a `<lay-out>` child and it holds a **grid of nested frames** — the collage:

```html
<ui-media>
  <lay-out xs="cg(0) rg(0)" md="columns(3)" lg="grid(3c)">
    <ui-media media="asr(1/1) hov(zoom)"><img src="…/1" alt="…"></ui-media>
    <ui-media media="asr(1/1) hov(zoom)"><img src="…/2" alt="…"></ui-media>
    <ui-media media="asr(1/1) hov(zoom)"><img src="…/3" alt="…"></ui-media>
  </lay-out>
</ui-media>
```

**There are no collage tokens.** The vocabulary is entirely borrowed: `<lay-out>`'s own [breakpoint attributes](../../../layout/readme.md#breakpoint-spacing-tokens) (`xs=` / `md=` / `lg=`) for the grid and its gutters — the word-size spacing steps (`cg(xs)`, `rg(2xs)`) exist precisely for gutters this tight — and ordinary `media=` on each tile. Nothing new was added to the DSL, and nothing about the outer card changes.

Two mechanisms make it work, both already in place:

- **The frame drops its height floor.** `:where(ui-media:has(> lay-out)) { min-block-size: 0 }` (`media.css`) — the grid's own cells own their heights, so the frame must size to content. Without it the default `--ui-media-min` (12.5rem) paints as a dead band under any collage shorter than that. This is the same escape `asr()` takes.
- **The nested layout does not inherit a bleed width.** `--layout-w` is registered non-inheriting, so a collage inside a card inside a `bleed` section resolves its width from the frame rather than from the viewport — see [`layout/core/base.md` § bleed](../../../layout/core/base.md#--layout-w--the-width-knob-bleed-writes-and-why-it-does-not-inherit).

Tiles are nested `<ui-media>`, which the `ui-media ui-media` rule pins to a plain frame — a tile is never a scroller and never paints its own scrim/controls.

### Two tile regimes — pick by gutter

| Gutter | Tiles | Why |
|---|---|---|
| Flush (`cg(0) rg(0)`) | **`asr()` tiles** | Square tiling is exact: one `asr(1/1)` at `2fr` equals two stacked `asr(1/1)` at `1fr`. |
| Visible (`cg(xs)` and up) | **aspect-less tiles** (no `asr()`) | A spanning tile covers N rows *plus* the row-gaps between them, which a fixed-ratio image can never fill — the slack renders as a double gap under it. An aspect-less tile stretches to fill its grid area, so bottoms stay flush at any gap size. |

With aspect-less tiles the row height comes from the tiles' own floor: **`--ui-media-min`** (see [Frame tokens](#frame), default `12.5rem`) is the collage's row-height knob. Set it on the tiles, or on an ancestor to tune the whole collage.

### Gutter colour — theme the lay-out, never the frame

A gap is a **hole**: it shows whatever paints behind it, and the nearest layer is the `<lay-out>` itself. A collage with visible gutters therefore paints them on the layout — `theme="gray"` (the shared axis, which feeds `--_theme-bg`) or `--layout-bg` directly. The builder already does this for `mosaic(photo)`, which ships `--layout-bg: light-dark(#333, #EEE)`.

Do **not** leave the layout transparent and let the frame's own plate show through. It looks like it works — a bare `<ui-media>` paints `--color-overlay-light` — right up until the frame gains `nav`: a scroller sets `--ui-media-bg: #0000` so slides fill it edge to edge, and every gutter goes invisible in the same commit that added the carousel. That is exactly what happened to the ProductGroup collage in `demo/schema.html`, whose `cg(3xs) rg(3xs)` hairline was still 1px wide and painting white on white.

Two properties make the layout the right layer: `--_theme-bg` is `@property … inherits: false`, so `theme=` stops at the layout and tiles keep their own colours; and under the `pages` dissolve the layout is `display: contents` and paints nothing, which is correct — a carousel arm has no gaps to fill.

### Collage carousel — CSS-only

Put `nav` on the **outer** frame and each direct `<lay-out>` child becomes a slide: a swipeable, snapping, dotted collage carousel with no JavaScript. Without `nav`, a lone `<lay-out>` child is just a grid — the scroller only activates on `nav`.

The slides are **CSS-only**, and that boundary is deliberate: `LAY-OUT` is on the JS `NOT_SLIDE` list, so `slidesOf()` never counts a `<lay-out>` slide. `loop`, `auto`, per-slide `<ui-play>` video control and the polyfill's dots all silently no-op on a collage carousel. Reach for `<ui-slide>` / `<div>` wrappers (with the grid *inside*) when you need those — see [carousel.md § Multiple items per slide](./carousel.md#multiple-items-per-slide--group-wrappers).

Demo: [`media.collage.html`](../demo/media.collage.html).

---

## Map — the frame as an embedded map

A card with coordinates can make the **map** its media, instead of a photo of the place. For **one static point there is no element and no token** — the frame already styles `iframe` exactly like `img` / `video` —

```css
:where(ui-media) & :is(iframe, img, picture, video) { inset: 0; position: absolute; block-size: 100%; inline-size: 100%; border: 0; }
```

— so an embed inherits `asr()`, `rds()`, the `shp()` clip, the overlay furniture, the carousel and the lightbox with nothing added. Registering an element for it would re-earn all of that and buy nothing; the difference between providers is a **URL**, not a DOM, so the seam lives in `render.js`.

> **Two map paths, and this is the boundary between them.** The rule above holds for a
> single, static point, and that path is unchanged. It does **not** stretch to a *collection*:
> clustering needs tile fetching, a spatial index and hit-testing, which no `src` can express.
> That case is `<ui-map>` in [`@browser.style/map`](../../map/readme.md) — a light-DOM element
> configured by the fourth token DSL, `map=`, which reads its points from the microdata the
> card's text column already carries. Do not collapse the two: an `<iframe>` cannot cluster,
> and loading a map engine to drop one pin would be the waste this section was written to
> prevent.

**CSS-only** (the reference markup on [`schema.html`](../demo/schema.html)):

```html
<ui-card variant="col" media="asr(16/9)" itemscope itemtype="https://schema.org/Place">
  <cq-box>
    <ui-media><iframe src="https://www.openstreetmap.org/export/embed.html?bbox=…&amp;layer=mapnik&amp;marker=55.7076,12.5993"
      title="Map of Nordhavn Studio" loading="lazy" itemprop="hasMap"></iframe></ui-media>
    …
```

**From content**, one media item with no URL in it at all — the coordinates come from `details.geo`, the same object that emits the card's `GeoCoordinates` scope, so the map and the microdata can never drift apart:

```json
"media": [{ "mediaType": "map", "alt": "Map of Nordhavn Studio" }],
"details": { "geo": { "latitude": 55.7076, "longitude": 12.5993 } }
```

| Field | Default | Notes |
|---|---|---|
| `provider` | `osm` | `osm` · `google`. An unknown or unbuildable provider falls back to OSM |
| `zoom` | `16` | clamped to 1–20. **Not a URL parameter** — see § Zoom is a bbox |
| `latitude` / `longitude` | `details.geo` | per-item override, for a map that must point somewhere else (a parking entrance) |
| `alt` | `Map of {headline}` | becomes the iframe `title` — an iframe needs one |
| `src` | — | an explicit embed URL, bypassing the builder entirely |
| `layer` | `mapnik` | the basemap style — allowlisted. See § Basemap layer |

`itemprop="hasMap"` is gated to the `business` and `location` types, because `hasMap` is a
`Place` property. A caller that KNOWS its enclosing scope descends from `Place` — the
real-estate detail page's map band, which sits inside `mainEntity` → `Apartment` — passes
`hasMap` to `mapFrame()` explicitly instead. Docs: [schema.md § Real estate](./schema.md#real-estate--realestatelisting).

### Basemap layer

The OSM embed takes a **`layer=` string** that picks the basemap style: the same list the
layer switcher on openstreetmap.org offers. Set it per media item —
`{ "mediaType": "map", "layer": "cyclosm" }` — and it defaults to `mapnik`.

| `layer=` | OSM's name | Tiles | In an embed |
|---|---|---|---|
| `mapnik` | Standard | raster | ✅ the default |
| `cyclosm` | CyclOSM | raster | ✅ |
| `cyclemap` | Cycle Map | raster | ✅ |
| `transportmap` | Transport Map | vector | ✅ |
| `hot` | Humanitarian | raster | ✅ |
| `shortbread` | Shortbread | vector | ✅ |
| `tracestracktopo` | Tracestrack Topo | raster | ✖ renders Standard |
| `openmaptiles_osm` | MapTiler OMT | vector | ✖ renders Standard |

**Two of the eight are in the switcher but not in an embed.** OpenStreetMap's
`config/layers.yml` marks each entry `canEmbed`, `MapLayers::embed_definitions` selects on
that flag, and `embed.js` resolves the parameter as `layers[layerId] || layers.mapnik` — so
an unlisted value is not an error, it is silently the Standard basemap. **That is why
`OSM_LAYERS` is an allowlist, not a pass-through** — the same discipline as `SUBTYPES`
([schema.md § Subtypes](./schema.md#subtypes)). `tracestracktopo` and `openmaptiles_osm` are
deliberately unspellable: offering a value that quietly does nothing is worse than refusing
it. Anything off the list renders `mapnik`.

### Zoom is a bbox, not a parameter

The embed URL has **no zoom parameter**. `zoom` is expressed by how wide a `bbox` the
builder computes — `osmEmbed()` derives a half-span of `180 / 2 ** zoom` and scales the
latitude half by `cos(latitude)`. That is why a wide subject needs a *lower* number:
`demo/schema.place.html` frames the Colosseum at 17 (~230 m across) and Kansai's artificial
island at 13 (~4 km).

**There is no `bbox` field and there should not be.** `layer` plus `zoom` express every map
on that page: `render.test.js` § map asserts all eight of its frames are reproducible from
`{ mediaType: 'map', layer, zoom }` + `details.geo`, so a hand-written bbox would only be a
second way to say the same thing — and one that could disagree with the coordinates.

### Providers — only one is keyless

| Provider | Ships | Why |
|---|---|---|
| **OpenStreetMap** | ✅ the default | `openstreetmap.org/export/embed.html` needs no key |
| **Google Maps** | builder present, arms on `details.map.key` | the Maps Embed API requires an API key |
| **Apple Maps** | ✖ deferred | the Maps Embed API requires a MapKit JWT bound to a Team ID, a Maps ID and registered domains — not derivable from coordinates |

For anything keyed, `src` on the item is the escape hatch.

### Coordinates are validated as numbers, never as text

`mapCoords()` runs `Number.isFinite` and a range check (lat ±90, lon ±180) **before** anything reaches a URL; `esc()` is the second layer, not the first — the same discipline as the `SUBTYPES` allowlist ([schema.md § Subtypes](./schema.md#subtypes)). A record that fails renders **no frame**, rather than a broken one.

The OSM bbox is `(west, south, east, north)`, and its latitude half-span is scaled by `cos(latitude)` so the box stays square **on the ground** — in raw degrees it would flatten towards the poles.

### `hasMap` is the property, and it is emitted once

`itemprop="hasMap"` rides the `<iframe>` — HTML takes a frame's microdata value from its `src`, so no companion `<link>` is needed. It is gated to types whose itemtype descends from `Place` (`business`, `location`); other types still get the frame, unmarked. The `Open in Maps` action link in `DETAILS.location` deliberately stays **unmarked**, so a map card declares the property exactly once — see [schema.md § One property, one value](./schema.md#one-property-one-value).

### Places — the frame as a clustered map, optionally a carousel

A `places` card's frame is a `<ui-map>` (see [schema.md § Places](./schema.md)). With
`details.slides: true` it becomes a **carousel whose first slide is the map** and whose rest
are one nested `<ui-card>` per place — ordinary `nav()` on the frame, no new token:

```html
<ui-media media="asr(1/1) nav(mrk)">
  <ui-map map="tiles(auto) cluster fit">…</ui-map>
  <ui-card id="homes-1-place-1" variant="ovr(bs)" media="asr(1/1) scm" itemprop="itemListElement" …>…</ui-card>
  …
</ui-media>
```

The `map=` vocabulary itself — `tiles()` for the basemap, `tint()` for its look, plus
`pin()` / `cluster()` / `zoom()` / `ctl()` / `fit` / `scroll` — is documented in
[`@browser.style/map`'s readme](../../map/readme.md), with a value-by-value table for each.

Three things make it hold together:

- **`<ui-map>` is a slide, not furniture.** It is deliberately absent from `NOT_SLIDE` and
  from the CSS `:not()` lists, exactly like `<img>` and `<iframe>` — it is frame *content*.
  (It was briefly added to both; that was wrong and is reverted.) The consequence to know:
  `loop` clones leading and trailing slides, and cloning a `<ui-map>` would start a second
  map engine — **do not combine `loop` with a map slide.**
- **The slide's `asr()` must match the frame's.** The frame owns the height.
- **Each slide gets a minted `id` — the map included,** so a plain `<a href="#…">` reaches
  it: a scroll-snap child needs no JavaScript to be addressable. The map popup uses this to
  jump from a pin to its card, and `#<cardId>-map` goes back. Keeping the *page* still while
  the carousel moves is JavaScript's job — see § Anchors below.

### Anchors — a fragment link to a slide

Native fragment navigation is `block: start`: the browser scrolls **every** ancestor scroll
container, the page included, to put the target at the viewport top. Measured on the demo
(viewport 762, frame parked 200 px down): a plain `#slide` link moved the page +360;
`scroll-margin-block-start: 100dvh`, `scroll-margin-block: 100dvh` and
`scroll-padding-block-start: 100dvh` on `:root` all moved it −562 and parked the frame one
viewport *lower* — the hack relocates the alignment, it never cancels it. `nearest` exists
only in `scrollIntoView()`, so `carousel.js` installs one delegated click handler: a
same-document link whose target is a slide of a scroll container (`slidesOf()`, so a
collage `<lay-out>` slide is excluded like everywhere else in JS) gets
`scrollIntoView({ block: 'nearest', inline: 'start' })` — smooth unless
`prefers-reduced-motion` — and the URL is left alone: a refresh would not honour a hash
anyway (scroll restoration restores where you were), so writing one only churns the address
bar. Modified clicks (⌘/ctrl-click opens the plain anchor — a fresh navigation *does* honour
the fragment, so that is the deep link) and already-handled clicks (`defaultPrevented`, e.g.
the map popup's own link) pass through. With JS off the link still works, page jump and hash
included.
- **A slide must not carry a stretched `cover` link.** It would swallow the swipe and turn
  the whole photo into a link — see [schema.md § Places](./schema.md).

Outside a card, [`@browser.style/map`](../../map/readme.md) carries `<ui-map>` for the interactive, clustered form on a bare page. (The pre-v4 `.ui-map` class it used to ship for a plain iframe was removed when that package was converted — the iframe above needs no class.)

---

## Lightbox — the popover fullscreen gallery

Any frame — a `nav` carousel, a [collage](#collage--a-lay-out-grid-inside-the-frame), or a plain image — can open **fullscreen as a lightbox**, with the **same DOM in both states**: no re-render, no attribute churn. Three ingredients:

```html
<ui-card variant="col" media="asr(4/3) nav lightbox(bs) open:grid(3c)">
  <cq-box>
    <ui-media id="gallery-1" popover>          <!-- 1. static popover + id -->
      <ui-lightbox>                            <!-- 2. the furniture invoker, BEFORE the slides -->
        <button type="button" command="toggle-popover" commandfor="gallery-1" aria-label="View gallery">
          <ui-icon><!-- /assets/svg/library-photo.svg, inlined (bare viewBox) --><svg viewBox="0 0 24 24"><path d="…"/></svg></ui-icon>
        </button>
      </ui-lightbox>
      <img src="…" alt="…"><img src="…" alt="…"><img src="…" alt="…">
    </ui-media>
    <ui-content>…</ui-content>
  </cq-box>
</ui-card>
```

1. **`popover` + `id` on the `<ui-media>`** — a static attribute; the closed frame renders exactly as without it (author CSS beats the UA popover sheet on cascade *origin*, and `media.lightbox.css` resets the few properties no author rule sets — see the header comment there before "fixing" anything).
2. **`<ui-lightbox>`** — interactive furniture (default area `bs`), whose button carries the **built-in** `command="toggle-popover"`. Opening and closing is pure platform: Esc, light-dismiss, focus and `::backdrop` come free, and the **top layer** is immune to the card's `container-type`/`overflow`, `<lay-out>`'s containment and `<lay-out-group>` clipping — the traps reveal's `exp pop` has to fight. The button rides into the top layer with the frame and doubles as the **close** affordance: while open it always pins **top-end** (the universal close position — the `lightbox()` position token only governs the closed state), and the svg hides while the icon draws ui-icon's `cross` bars — an animated twist to ×. The glyph is one of the two canonical `/assets/svg` icons, inlined per ui-icon's svg pattern: `library-photo.svg` "open gallery" (default; renderer `furniture.lightbox.shape: photos`) or `window-maximize.svg` "full screen" (`shape: maximize`). In a `nav` scroller it is sticky-pinned to the scrollport and must sit **before the slides** (first child, like sticky `<ui-play>`; start corners only — end corners are the deferred case).
3. **`open:` tokens** describe the open-state presentation.

Demo: [media.lightbox.html](../demo/media.lightbox.html).

### The `open:` token family

Whole-token (`~=`) **state** prefix — like `md:`/`lg:` are the *container-tier* prefix — arming only while the frame is `:popover-open`:

| Token | While open |
|---|---|
| *(none)* | a `nav` frame opens as a **fullscreen carousel** — snapping, swipe and keyboard now viewport-sized (dots + arrows are the DOM controls below); a collage re-tiers to its largest pattern (its `<lay-out>` breakpoints are viewport-keyed, and the frame now IS the viewport); a plain frame shows the image letterboxed (`object-fit: contain`, direct children only) |
| `open:grid(2c\|3c\|4c)` | the same children as an N-column scrollable **grid** ("view all" contact sheet) — snapping/markers off, tiles edge-to-edge (`cover`), `loop` clones hidden |
| `open:furniture` *(bare)* | keep chips/stickers/beacons/marquees/save visible while open (they hide by default; `<ui-play>` and `<ui-lightbox>` always stay) |

> **There is deliberately no `open:nav`.** `nav` is substring-matched (`[media*="nav"]`), so the spelling `open:nav` would arm every *closed* carousel rule. The rule generalizes: **an `open:` spelling must never contain a substring-matched stem** — which is also why the family is whole-matched and named with the prefix in the manifest (so the shadow lint polices future additions). Fullscreen carousel is simply the default open presentation of a `nav` frame.

### Carousel controls — real elements, not pseudos

The native `::scroll-marker-group`/`::scroll-button()` boxes **do not follow a popover frame into the top layer** (current Chromium keeps them in the document layer, positioned against the card, behind the `::backdrop` — a browser limitation, not fixable by positioning; revisit if Chromium moves scroll-control pseudos into the top layer with their element). So a popover frame's dots + arrows are **real elements**: `ui/card/lightbox.js` injects the [`/ui/carousel/polyfill/carousel-controls.js`](../../carousel/polyfill/readme.md) `<ui-carousel-controls>` — in **every** browser and in **both states**, so closed and open stay continuous — and `media.lightbox.css` suppresses the native pseudos on exactly those `[data-ui-carousel-polyfill]` frames (grid mode hides the DOM controls via an unlayered rule, since the polyfill sheet is unlayered). Without `lightbox.js` the open carousel falls back to swipe, keyboard and a thin scrollbar.

### `media-open=` — ANY existing nav style while open

The open state can switch the carousel into **any of the shipped nav styles** — dots → the vertical thumbnail rail, arrows-only → dots + arrows, a pills bar, an `axis(y)` flip… The control stems (`nav`/`mrk()`/`arw()`/`tmb()`/`axis()`) are **substring-matched**, so their spellings can never ride inside `media=` behind an `open:` prefix (they would arm the *closed* carousel) — instead they live in the companion **`media-open=`** attribute, on the same element `media=` sits on:

```html
<ui-card media="asr(4/3) nav(mrk) lightbox(bs)"
         media-open="axis(y) nav(mrk) mrk(tmb) mrk(rail) mrk(lg)">
```

`lightbox.js` swaps **only the control words** of the resolved media string on open (everything else — `asr()`, furniture, `open:` tokens, `loop`/`auto` bindings — is untouched) and restores them on close, re-stamping the DOM controls' `data-media` so every existing rule (rail padding, band reservation, thumbnail face, axis flip) applies unchanged. **Slide continuity** is kept across the swap in both directions (the index is captured on `beforetoggle`, re-asserted after the close-side `overlay` retention ends). Controls are built as the **union** of both states' needs, with per-state visibility keyed off the current `data-media` stamp. Thumbnails need no authoring: when a slide carries no `--ui-carousel-thumb-url`, the dot derives it from the slide's image. Preset field: `media-open` (validated against the media vocabulary by the preset lint). Without JS, the open lightbox simply keeps the closed nav style.

### Runtime carousel ↔ grid — `--lightbox-layout`

A second invoker inside `<ui-lightbox>` (hidden while closed) with the custom `command="--lightbox-layout"` flips the open frame between carousel and grid by toggling `data-lightbox="grid|nav"` — handled by the opt-in [`ui/card/lightbox.js`](../lightbox.js) (built on the shared `ui/common/command.js` router). Closing clears the attribute, so the frame always reopens on its `open:` tokens. The same module reflects `[open]`/`aria-expanded` and ships a `togglePopover()` click fallback for browsers without `command=` invokers (`popovertarget` is the wider-support no-JS alternative markup).

### Layout shift — the placeholder

A top-layer element leaves flow, so the frame's grid cell would collapse. While a card-hosted frame is open, a `::before` on `<cq-box>`/`<summary>` reserves the cell, mirroring the frame's sizing: `--ui-media-ar` inherits down from a host-placed `asr()`; for the self-arm placement (the token on the frame, below the `::before`'s reach) **lightbox.js relays the ratio onto the host once at init** — the old `:has(ui-media[media~="asr(…)"])` mirrors were removed because a `media` needle in a `:has()` argument taxes every `media=` write page-wide (`/docs/style-performance.md` §8.1, lint-enforced); the `12.5rem` floor covers everything else, and a CSS-only page with a frame-placed `asr()` degrades to the `3 / 2` fallback placeholder while open. Verified: neighbouring cards do not move across open/close. A **standalone** `<ui-media popover>` directly in a `<lay-out>` has no parent hook for a placeholder — documented limitation: the backdrop masks the reflow while open, and closing restores flow.

### What works without JS — the degradation table

| Feature | With `lightbox.js` | Without JS |
|---|---|---|
| open/close, Esc, light-dismiss, `::backdrop`, focus return | platform | platform (unchanged) |
| dots / arrows / thumbnails in the lightbox | DOM controls | swipe, keyboard, thin scrollbar |
| `media-open=` nav-style switch | swapped on toggle | closed nav style kept |
| `open:grid()` / `open:furniture` / animations | CSS | CSS (unchanged) |
| flow placeholder ratio | host-placed `asr()`: CSS; frame-placed: relayed at init | host-placed: CSS (unchanged); frame-placed: `3 / 2` fallback |
| grid tile → slide jump | tap-to-open at that slide | grid still browsable |
| hi-res image upgrade on open | browser-native (`sizes="auto"`) — no JS in either column | same |
| modality (`inert`), back-button close, pause-on-close, VT morph | active | non-modal popover; Esc still closes |

### Notes

- **Open/close animation, three mechanisms.** The frame's entry is a **keyframe** (clip-reveal + opacity; the frame is always rendered — `display` never flips — so `@starting-style` has nothing to fire from on it, and a scale/translate entry would create a transient containing block and yank `position: fixed` furniture). The **`::backdrop`** *does* start being rendered at open, so it fades in via a standalone `@starting-style` + fades out on close via `opacity`/`display`/`overlay allow-discrete` transitions, with an `overlay` transition on the frame retaining the top layer through the close. `lightbox.js` upgrades button-invoked open/close to a **View Transition morph** (card ↔ fullscreen, both directions; `[data-lightbox-vt]` suppresses the keyframe so the two never double-animate; Esc/light-dismiss closes and reduced-motion users get the CSS fade only).
- **Page scroll lock, zero JS.** `html:has(ui-media[popover]:popover-open)` gets `overflow: hidden` + `scrollbar-gutter: stable`: the root scrollbar hides (the backdrop covers the full viewport) and wheel/touch can't scroll the page behind the open lightbox, while the stable gutter keeps the viewport width identical on classic-scrollbar platforms so nothing reflows behind the `::backdrop`. `overflow: hidden` — not `clip` — so the root stays a scroll container and keeps its offset.
- **`md:`/`lg:` container tiers still query the card's width** while the frame is in the top layer (DOM ancestry is unchanged) — the open-state rules override the size-critical properties instead.
- **`stagger` + `open:grid`**: grid mode removes snapping, so slide-level and content-level subjects are pinned visible at real specificity (the `media="pages"` escape pattern) rather than stranded at their scroll-state from-state.
- **Image resolution in fullscreen — `srcset` + `sizes="auto"` solves it, zero JS.** With `srcset` (w descriptors) + `sizes="auto"` + `loading="lazy"`, the browser derives the slot width from layout and **re-selects a larger candidate when the img's layout box grows** — opening the lightbox triggers an automatic hi-res re-fetch (verified in Chromium: 800w → 2200w on open; browsers never downgrade afterwards, so closing costs nothing). A **static `sizes`** tuned to the card (`33vw`, `500px`…) never upgrades — author it to cover the fullscreen case (worst-case `100vw`) or use `auto`. The system's own srcset path already does the right thing: `ui-media-srcset.js` defaults to `sizes: 'auto'` with lazy loading, so Cloudflare-upgraded galleries get lightbox-resolution images for free. A plain single-`src` image has no candidates to upgrade — that is an asset question, not a lightbox one.
- **Support**: Popover is Baseline (Safari 17+/Firefox 125+); `command=`/`commandfor=` invokers are newer (Chrome/Edge 135+, Safari 26+) — hence the click fallback in `lightbox.js`, or use `popovertarget`.

---

## Scrim

`scm` paints a darkening gradient that covers the **whole frame**, layered **between the image and the overlays**:

| Layer | z-index |
|-------|---------|
| `img` / `video` | `0` |
| scrim (`::after`) | `1` |
| overlays (chip/sticker/save/play) + a `data-part="caption"` placed in the media | `2` |

The scrim `::after` stays out of grid flow (`position: absolute; inset: 0`).

`scm()` has **three orthogonal axes** — direction, size, and intensity — each a separate, composable token, e.g. `scm(bc) scm(lg) scm(drk)`. The **position** grid uses the same logical `ts/tc/te … bs/bc/be` tokens as the `chip()`/`sticker()` furniture. All nine directional gradients read shared colour + stop custom properties, so size and intensity vary without re-baking a gradient per combination. The 9 directions are the 4 edges, the 4 **diagonals** (`to bottom right` / `to bottom left` / `to top right` / `to top left`) for corner placements, and the **`cc` center double-stop** (`linear-gradient(to bottom, #0000, color, transparent)`).

| Axis | Tokens | Behavior |
|------|--------|----------|
| *(bare)* | `scm` | reads `--ui-media-scrim-default` — set by the host `ovr()` to match the overlay corner; falls back to `bc` |
| **direction** | `scm(ts)` … `scm(be)` | explicit direction (overrides the default) — `ts tc te cs cc ce bs bc be`, matching furniture placement |
| **size** | `scm(sm)` `scm(md)` `scm(lg)` `scm(xl)` | how far the gradient reaches across the frame; sets `--ui-media-scrim-mid-stop`/`-end-stop` (and the `cc` band edges). `md` = default (`40%`/`80%`); `xl` nearly fills the frame |
| **intensity** | `scm(shr)` `scm(lgt)` `scm(med)` `scm(drk)` `scm(sld)` | dark-end opacity; sets `--ui-media-scrim-color` (`0.35` / `0.55` / `0.78` default / `0.92` / `1`). 3-letter codes only — the long `sheer`/`solid` spellings were **removed in v5**. `sld` also pulls the mid stop to the full colour, so it holds opaque across the covered area instead of fading through the translucent mid mix |

Combine axes freely, e.g. `scm(bc) scm(lg) scm(drk)`. `scm` works **standalone** too (a darkened image, no overlay content needed).

**RTL — scrims mirror.** `linear-gradient()` has no logical directions, so the six gradients carrying an inline-axis component take their direction keyword from base's `--_dir-s`/`--_dir-e` — `linear-gradient(to bottom var(--_dir-e), …)` computes to `to right bottom` in LTR and `to left bottom` in RTL:

| Position | LTR | RTL |
|---|---|---|
| `ts` | `to bottom right` | `to bottom left` |
| `te` | `to bottom left` | `to bottom right` |
| `cs` | `to right` | `to left` |
| `ce` | `to left` | `to right` |
| `bs` | `to top right` | `to top left` |
| `be` | `to top left` | `to top right` |

`tc`, `bc` and `cc` are axis-pure (`to bottom` / `to top` / a vertical band) and never flip. This is what keeps a `chip(ts)` and its matching `scm(ts)` in agreement: before this round the chip mirrored in RTL and the scrim didn't. The resolver is defined once in `ui/base/core.css` against `:dir()`, so it follows the token holder's own resolved directionality — `dir` on the element or on any ancestor — and nested direction islands reset correctly.

---

## Tokens

Two namespaces, split by ownership. Both inherit down from wherever `media=` is set.

| Namespace | Owns | Defined in |
|---|---|---|
| `--ui-media-*` | the **frame** — aspect, fit, position, flip, background, hover, scrim, overlay gap, scroller focus ring | `media.css`, `media.hover.css`, `media.carousel.css` |
| `--ui-carousel-*` | the **controls** — dots, pills, arrows, thumbnails, bands, the scrollbar, autoplay timing | `ui/carousel/carousel.css` (shared with `lay-out[overflow]`) |

The split is deliberate: the control chrome is shared with `<lay-out overflow>`, which has no `<ui-media>` at all, so it can't live in the media namespace. A handful of tokens stay `--ui-media-*` inside the carousel because they belong to the frame rather than the controls: `--ui-media-bg`, `--ui-media-gap`, `--ui-media-radius`, `--ui-media-overlay-gap`, and the three `--ui-media-focus-*` ring tokens.

### Frame

| Token | Default | Description |
|-------|---------|-------------|
| `--ui-media-ar` | `auto` | aspect-ratio (set by `asr()`) |
| `--ui-media-fit` | `cover` | object-fit (set by `obf()`) |
| `--ui-media-op` | `center` | object-position (set by `obp()`) |
| `--ui-media-fl-x` | `1` | horizontal flip scale (`-1` flips) |
| `--ui-media-fl-y` | `1` | vertical flip scale (`-1` flips) |
| `--ui-media-bg` | `var(--color-overlay-light, transparent)` | frame background (behind `contain`/`none` letterboxing) |
| `--ui-media-min` | `12.5rem` | min-block-size when no `asr()` is set |

### Hover

| Token | Default | Description |
|-------|---------|-------------|
| `--ui-media-hv-zoom` | `1.08` (`pan`/`track`: `1.12`) | hover zoom scale |
| `--ui-media-hv-pan-x` / `-pan-y` | `-2%` | `pan` translate |
| `--ui-media-hv-track` | `4%` | `track` max translate (× pointer offset) |
| `--ui-media-hv-track-dur` | `var(--duration-normal)` | `track` / `drift` translate duration |
| `--ui-media-hv-drift` | `4%` | `drift` max translate (× pointer offset, applied **opposite** the cursor) |
| `--ui-media-hv-drift-rest` | `1.3` | `drift` resting scale (image overfills the frame) |
| `--ui-media-hv-drift-hover` | `1.2` | `drift` scale on hover (shrinks from rest) |
| `--ui-media-hover-duration` | `var(--duration-slower)` | hover transition duration |
| `--ui-media-hover-easing` | `var(--ease-out)` | hover transition easing |
| `--ui-media-mx` / `--ui-media-my` | `0` | pointer offset hooks for `hov(track)` / `hov(drift)` (−1…1), set by JS |

### Carousel — markers

| Token | Default | Description |
|-------|---------|-------------|
| `--ui-carousel-marker-bg` | `rgb(255 255 255 / 0.5)` | marker color |
| `--ui-carousel-marker-active` | `#fff` | current-marker color |
| `--ui-carousel-marker-size` | `0.6rem` | marker diameter (the `mrk(sm\|md\|lg\|xl)` scale sets this **and** the pill + thumb sizes together) |
| `--ui-carousel-marker-gap` | `0.5rem` | gap between dots |
| `--ui-carousel-marker-border` | `0` | marker border |
| `--ui-carousel-marker-inset` | `--ui-carousel-overlay-gap` (`1rem` under `mrk(tmb)`) | corner inset for the overlay marker group (`mrk(ts…be)`) |
| `--ui-carousel-pill-width` | `1.5rem` | `mrk(pll)` width |
| `--ui-carousel-pill-height` | `0.35rem` | `mrk(pll)` height |
| `--ui-carousel-pill-track` | `rgb(255 255 255 / 0.35)` | `mrk(pll)` inactive/track color |
| `--ui-carousel-pill-fill` | `#fff` | `mrk(pll)` active fill color |
| `--ui-carousel-autoplay` | `5s` | `mrk(pll)` timer-fill duration — written by `carousel.js` from the `auto(Ns)` token |
| `--ui-carousel-play-state` | `running` | `running` / `paused` for the pill + thumb fill timer; `carousel.js` sets `paused` when a `<ui-play>` pauses autoplay |

### Carousel — arrows

| Token | Default | Description |
|-------|---------|-------------|
| `--ui-carousel-arrow-bg` | `rgb(255 255 255 / 0.7)` | arrow button circle (frosted semi-transparent white) |
| `--ui-carousel-arrow-bg-hover` | `rgb(255 255 255 / 0.9)` | arrow hover circle |
| `--ui-carousel-arrow-size` | `2.25rem` | arrow button size (`arw(sm\|lg\|xl)`) |
| `--ui-carousel-arrow-radius` | `var(--radius-circle, 50%)` | arrow corner radius (`arw(sqr)` → `0`, `arw(sft)` → `--radius-sm`) |
| `--ui-carousel-arrow-border` | `0` | circle border (add e.g. `1px solid …`) |
| `--ui-carousel-arrow-glyph-size` | `75%` | glyph size within the button |
| `--ui-carousel-arrow-nudge` | `calc(arrow-size * 0.03)` chevron · `* 0.015` full arrow | optical shift of the glyph toward its tip; `0` to disable |
| `--ui-carousel-arrow-color` | `#fff` (`rgb(0 0 0 / 0.8)` in a band) | bare-glyph ink |
| `--ui-carousel-arrow-color-hover` | inherits the base ink (band flips to `rgb(0 0 0 / 1)`) | bare-glyph ink on hover |
| `--ui-carousel-arrow-hover-scale` | `1.18` | bare-glyph scale on hover / focus |
| `--ui-carousel-arrow-shadow` | `0 1px 3px rgb(0 0 0 / 0.15)` (`none` in a band) | soft `box-shadow` on the circle button |
| `--ui-carousel-arrow-hover-ring` | — | replaces the shadow on hover (set by `arw(drk)`) |
| `--ui-carousel-arrow-disabled-opacity` | `0.4` (`0` with `arw(hid)`) | opacity of a dead-end arrow (no slide that way) |
| `--ui-carousel-arrow-glyph` | `var(--ui-carousel-chevron-dark)` | **the** glyph. One token, not a prev/next pair — the button pseudo mirrors it per direction |
| `--ui-carousel-chevron-light` / `-dark` / `-grey` | white / black / `#555` chevron SVG | built-in chevron glyph set |
| `--ui-carousel-arrow-light` / `-dark` / `-grey` | white / black / `#555` full-arrow SVG | built-in full-arrow glyph set (selected by `arw(arr)`) |
| `--ui-carousel-arrow-top` | `calc(anchor(center) − size/2)` | vertical-placement hook (set by `arw(ts…be)` and the band tokens) |
| `--ui-carousel-arrow-gap` | `0.5rem` | spacing between the two arrows in an `arw(set)` pair |
| `--ui-carousel-band` | `2.75rem` (auto-grown under `mrk(tmb)`) | `nav(blw)`/`nav(abv)` band height |
| `--ui-carousel-above-gap` / `-below-gap` | `var(--spacing-sm)` | gap between the frame and an above/below band |
| `--ui-carousel-controls-bg` | `var(--ui-media-bg)` | band background |
| `--ui-carousel-overlay-gap` | `0.75rem` | inset of the **controls** from the frame edges |
| `--ui-media-focus-width` | `2px` | scroller keyboard-focus dashed ring width |
| `--ui-media-focus-offset` | `3px` | scroller focus ring offset |
| `--ui-media-focus-color` | `var(--ring-color)` | scroller focus ring colour |

The arrow is a **circular button**: a themeable circle (`--ui-carousel-arrow-bg`) + one glyph image. The glyph is **dark by default** (for the frosted light circle); `arw(lgt)` and `arw(drk)` swap the whole ink bundle, and `arw(arr)` swaps the chevron family for the full-arrow family — no SVG pasting. Square off the circle with `--ui-carousel-arrow-radius`.

> The old `--ui-media-marker-*` / `--ui-media-pill-*` / `--ui-media-arrow-{prev,next}*` / `--ui-media-band` / `--ui-media-controls-bg` names documented before this round **never existed in shipped code** — they are not aliases, and setting them does nothing. Use the `--ui-carousel-*` names above.

### Scrim

| Token | Default | Description |
|-------|---------|-------------|
| `--ui-media-scrim-color` | `rgb(0 0 0 / 0.78)` | base scrim color (the `scm()` intensity tokens set this) |
| `--ui-media-scrim-m` | `color-mix(scrim-color, transparent 55%)` | mid stop — holds the dark near the edge before fading, so spanning text stays legible over bright images |
| `--ui-media-scrim-mid-stop` / `-end-stop` | `40%` / `80%` | shared gradient stops (the `scm()` size tokens set these) |
| `--ui-media-scrim-cc-a` / `-cc-b` | `25%` / `75%` | `cc` centre-band edges (also driven by the size tokens) |
| `--ui-media-scrim-ts` … `-be` | per-direction `linear-gradient()` | the 9 directional gradients (4 edges + 4 diagonals + `cc` double-stop), all reading the shared colour + stop vars. **Declared only on `ui-media`, on `[media*="scm"]` hosts and on `[variant*="ovr("]` hosts** — the exact set of subjects that read them (tightened in v5; they used to be declared on every `[media]`/`[variant]` element) |
| `--ui-media-scrim-default` | (set by host `ovr()`) | the bare-`scm` direction; matches the overlay corner |
| `--ui-media-scrim-paint` | `#0000` (none) | the selected gradient that gets painted |

### Overlays

| Token | Default | Description |
|-------|---------|-------------|
| `--ui-media-overlay-gap` | `0.75rem` | inset of every overlay element; also drives marker/arrow inset |

Overlay positions are **not tokens** — each element has a default position by role (`<ui-chip>` `ts`, `<ui-sticker>`/`<ui-save>` `te`, `<ui-play>` `cc`) and is repositioned via the parent `media="el(<pos>)"` token, where `<pos>` is one of the nine logical codes.

> Each overlay element also exposes its own token namespace (`--ui-chip-*`, `--ui-sticker-*`, `--ui-save-*`, `--ui-play-*`) — see the element's own README. The `media="chip(<theme>)"` routing and the element's own `theme=` both write the same target tokens.

---

## Examples

### Standalone media

```html
<ui-media media="asr(16/9) obp(ts) hov(zoom) scm">
  <img src="https://picsum.photos/800/450" alt="Lake at sunrise">
</ui-media>
```

### Standalone with overlay furniture

```html
<ui-media media="asr(4/3) chip(red) sticker(green) sticker(cc)">
  <img src="https://picsum.photos/600/450" alt="Hiking boots">
  <ui-chip>Sale</ui-chip>            <!-- ts (default), red -->
  <ui-sticker>-20%</ui-sticker>      <!-- cc (override), green, single line -->
</ui-media>
```

### Carousel

```html
<ui-media media="nav asr(16/9)">
  <img src="https://picsum.photos/id/10/800/450" alt="View 1">
  <img src="https://picsum.photos/id/11/800/450" alt="View 2">
  <img src="https://picsum.photos/id/12/800/450" alt="View 3">
</ui-media>
```

### Nested in `<ui-card>` — everything configured on the parent

```html
<ui-card media="asr(4/3) chip(red) sticker(cc) sticker(green)"
         content="scl(lg) pad(md)"
         variant="col">
  <ui-media>
    <img src="product.jpg" alt="Product name">
    <ui-chip>Sale</ui-chip>          <!-- ts (default), red -->
    <ui-sticker>-20%</ui-sticker>    <!-- cc (override), green -->
    <ui-save>                        <!-- te (default); card-only control -->
      <input type="checkbox" aria-label="Save to wishlist">
    </ui-save>
  </ui-media>
  <ui-content>
    <h2 data-part="headline">Trail Runner GTX</h2>
    <p data-part="summary">All-weather grip for any terrain.</p>
  </ui-content>
</ui-card>
```

> **Overlay elements always live inside `<ui-media>`** — it is the 3×3 grid that
> positions them. The `media=` string may sit on `<ui-card>` (it inherits down) or on
> the `<ui-media>` itself, but the `<ui-chip>` / `<ui-sticker>` / `<ui-save>` /
> `<ui-play>` children belong to `<ui-media>`, never directly to `<ui-card>` (with no
> `<ui-media>` there's no grid to place them).

### Overlay theming via the element's own attribute

```html
<ui-media media="asr(1/1)">
  <img src="…" alt="…">
  <ui-chip theme="dark">Bestseller</ui-chip>   <!-- self-themed; theme= wins over media= -->
</ui-media>
```

### In a reveal `<summary>` — markers only

```html
<ui-reveal>
  <summary>
    <ui-media media="asr(16/9) scm">
      <img src="…" alt="Cover">
      <ui-chip>New</ui-chip>        <!-- marker: valid -->
      <ui-sticker>Hot</ui-sticker>  <!-- marker: valid -->
      <!-- DO NOT add <ui-save> / <ui-play> here — interactive, card-only -->
    </ui-media>
  </summary>
  <!-- revealed panel… -->
</ui-reveal>
```

### RTL

No extra markup. The grid columns follow the inline axis, so all overlay positions mirror automatically — `chip(ts)` renders top-right under `dir="rtl"`. Glyphs (save icon) are symmetric / mask-based and stay correct.

---

## Responsive

`<ui-card>` / `<ui-reveal>` support `md:` / `lg:` breakpoint prefixes — **named** container queries, `@container bs-card (inline-size >= 25rem)` and `>= 44rem`, evaluated against the queryable descendant (`cq-box` in a card, `summary` in a reveal) or against the primitive itself.

**`asr()` is the one prefixable `media=` token.** `md:asr()` / `lg:asr()` ship all nine ratios per tier — the aspect a card wants genuinely depends on how wide it renders (portrait in a 1-up carousel, landscape once it widens). Every other `media=` token (`obp()`, `hov()`, `scm()`, `obf()`, `flp()`, `rds()`…) is unprefixed; the base `asr()` rule is whole-token (`~=`) matched so the prefixed forms never leak into it.

Placement and the standalone opt-in are covered under [`asr()`](#asr--the-8-numeric-aspect-ratios) above: two arms (host + self), and a standalone `<ui-media>` joins the tiers by sitting in a `bs-card`-named container.

On the `content=` side the prefixes cover rather more — size (`scl()`, `hl()`), `gap()`, and the whole seven-token padding system (`pad() pb() pi() pbs() pbe() pis() pie()`). See [content.md](./content.md#responsive).

The parse layer is purely additive, so prefixing further media tokens later is a non-breaking generation step — `asr()` is the template (a rule per value × tier × arm).

### Responsive images — Cloudflare `srcset`

Two delivery paths share one contract (widths `240,320,480,720,1200`, `asr()`-derived heights, the `load(eager|lazy)` token, `fetchpriority="high"` on an eager first frame):

**SSR (preferred): `renderCard(ucf, presets, cards, { images })`.** Passing an `images` options bag makes `render.js` emit `srcset`/`sizes`/`loading`/`decoding`/`fetchpriority` directly on every eligible `<img>` (frames via `buildSrcset`, avatars and comparison thumbs as fixed-size `1x/2x` pairs). Omit the bag and the output is byte-identical to the pre-srcset renderer — that keeps local/off-zone pages free of dead `/cdn-cgi/` URLs. `images.cdnBase` prefixes an absolute origin (e.g. `https://v4.browser.style`) so the markup also works on hosts off the zone (pages.dev, localhost); `images.sizes` is the computed fallback list — lazy frames get `auto, ` prepended (Safari has no `sizes="auto"`, eager frames must not use it), typically from layout's `generateSrcsets`/`calculateSizes` bridge (see `layout/docs/card-integration.md` Phase 3). `demo/render.html` and the hand-authored `demo/schema.html` carry the reference output.

**Client (transitional): `import '@browser.style/card/ui-media-srcset.js'`** upgrades each `<img>` child at runtime as **progressive enhancement** — for pages whose markup wasn't SSR'd. Deliberately kept **outside** `index.js` (which owns the hover/carousel/video enhancements); stop loading it on pages that render srcset server-side:

- **Always:** sets `loading="lazy"`, `decoding="async"`, and `sizes="auto"` if absent. (`sizes="auto"` needs `loading="lazy"`; the browser then picks the candidate from the image's real rendered width — Chrome 121+/Firefox, graceful elsewhere.) The `load(eager)` media token makes every image load eagerly, with `fetchpriority="high"` on the first for a hero.
- **On the deployed `*.browser.style` host only:** injects a [Cloudflare Image Resizing](https://developers.cloudflare.com/images/transform-images/) `srcset`, deriving each candidate's height from the element's `asr()` token:

  ```
  /cdn-cgi/image/format=avif,quality=80,fit=cover,width=480,height=270/assets/images/foo.png 480w, …
  ```

**Why host-gated + root-relative.** `/cdn-cgi/image/` only resolves on the Cloudflare zone (it 404s on localhost, and a failed `srcset` candidate does *not* fall back to `src`). So author images with **root-relative** paths (`/assets/images/foo.png`): they load straight from disk in dev (no `srcset`), and on production the same markup gains the transformed `srcset` — no hardcoded domain anywhere. Force the upgrade locally for previewing with `cdn="on"` (or `globalThis.uiMedia.cdn = true`).

Config precedence is **attribute → `globalThis.uiMedia` → built-in default**:

```js
globalThis.uiMedia = { cdn: true, breakpoints: [240,320,480,720,1200], format: 'avif', quality: 80, fit: 'cover', sizes: 'auto' };
```

Skipped automatically: images that already have a `srcset`, `data:`/`blob:`/absolute-`http(s)` sources, and non-`<img>` children (`<video>`, `<picture>`, nested `<ui-media>`). No `srcset` token (`asr()` absent) → height is omitted so Cloudflare keeps the natural ratio.

#### The ladder never exceeds the original

⚠️ **Cloudflare's `fit=cover` does not decline an oversized request — it manufactures the
pixels.** Measured against a deployed 509×509 asset: `width=480` returns 480×360 at 13,489
bytes, `width=1200` returns 1200×900 at **57,879 bytes** — 4× the weight for no extra detail,
and a high-DPR phone picks the big one. So every candidate is checked against the original:

```
maxUsableWidth = ratio ? min(intrinsicW, floor(intrinsicH × ratio)) : intrinsicW
```

Both axes bind, because a cover crop fills the frame: a 1440×960 original tops out at **1280**
in a `asr(4/3)` frame (height-bound) but at its full 1440 in `asr(16/9)` (width-bound). Rungs
above the cap are dropped; if not even the narrowest fits, no `srcset` is emitted at all and
the plain `src` — already smaller than any candidate — serves.

Sizes come from **`data/assets.json`** (+ its ES-module mirror `data/assets.data.js`),
generated by `node ui/card/assets.build.js`, which reads real dimensions out of the PNG `IHDR`
and JPEG `SOF` headers — no dependency, no network. `render.js` imports the mirror and uses it
as the default, so **every caller is capped without passing anything**. It cannot silently rot:
`assets.build.js --check` fails on a stale manifest, `build.js` reports the image count, and a
test in `render.test.js` renders the whole data corpus and asserts no candidate exceeds its
original.

Two overrides, in precedence order:

| Source | Use for |
|---|---|
| `width`/`height` on the media item (SSR) or on the `<img>` (client) | remote or generated images the manifest never saw |
| `images.intrinsic` — a `{ "/assets/images/x.jpg": [w, h] }` map | a different asset set entirely |

`ui-media-srcset.js` ships **no** manifest — it is a client module and 112 entries is not worth
the bytes — so it caps only from `width`/`height` attributes. Pages that SSR their srcset (the
preferred path) get the full cap for free.

---

## Accessibility

- **Always provide `alt`** on `<img>` (or `aria-label`/captions for `<video>`). The frame is purely presentational.
- **`<ui-save>`** — always set a descriptive `aria-label` on the inner `<button>` (the renderer writes "Save <headline> to favorites"). Saved state is `aria-pressed`; keyboard and focus come from the native button.
- **`<ui-play>`** — the inner `<button>` carries `aria-label`; `aria-pressed` is mirrored from the target's **real** playback state, never guessed. The CSS-only fallback is still a real, focusable button.
- **Interactive overlays are card-only.** Never place `<ui-save>` / `<ui-play>` inside a reveal `<summary>` — a click there toggles the `<details>`, and interactive content is invalid in `summary`. Markers (`<ui-chip>`, `<ui-sticker>`) are safe there.
- **Color isn't meaning.** Hues (`red`/`green`/…) are decorative; convey status with text, not hue alone.
- Hover effects respect `prefers-reduced-motion: reduce` (disabled); carousel smooth-scroll is gated the same way.

---

## Video layer

Video-player styles live in **`media.video.css`** (imported after `media.css`, before `media.carousel.css`). It owns the preview overlay, the native `<video>` play-control behaviour, `play(<size>)` sizing, and the `vid()` PLAYER TOOLS cluster. Wired by `index.js` (`initEmbeds` / `initVideoPlay` / `initVideoTools` / `initMediaCommands`). Carousel-context video mentions (slide-type `img|video`, the scroller's own autoplay control) stay in `media.carousel.css`.

- **Preview overlay.** `data-preview` is the **provider-agnostic facade layer** — a `<video data-preview>` (animated gif-like loop, e.g. Vimeo) **or** an `<img data-preview>` (static poster, e.g. a YouTube thumbnail). It sits on top of the real, SSR'd player behind it (`z-index: 1`, below furniture at `z-index: 2`) — the `z-index` lifts it, so **source order doesn't matter**. `pointer-events: none` lets clicks fall through to a real `<video controls>`, so a native video can reveal with no JS; `:playing` then hides the preview (`ui-media:has(> video:not([data-preview]):playing)`). `:playing` is Safari/Chrome only — Firefox falls back to the JS drop in `initEmbeds`. An `<iframe>` embed has no matching `<video>`, so its preview stays until the JS click facade drops it.
- **Play-control fade.** On a frame with a direct `<video>`, `<ui-play>` fades out while playing (`[open]`, set by `index.js` from real playback state) and reveals on hover/focus of the whole slide — the parent, not just the frame, since a layered `<ui-content>` overlay would otherwise swallow the hover.
- **`play(<size>)`** sizes `<ui-play>` (`sm md lg xl`, mirroring its `size=` scale); **`play(<pos>)`** positions it (`ts…be`). **One stem, two disjoint vocabularies** — they parse unambiguously and compose: `media="play(be) play(lg)"`. (The old `ply(<size>)` stem was **removed in v5** — no alias remains.)
- **PLAYER TOOLS (`vid()`).** Tool vars live on the `[media]` host (like the arrow vars) so they inherit to the JS-injected buttons and an ancestor `vid(sm…xl)` can override the size. Buttons are discs with `url()` SVG glyphs; state via `aria-pressed`. PiP is hidden until `<ui-play>` reports playing (before play, a facade has no `<video>` → the button is a no-op); fullscreen targets the frame so it stays available.
- **CC switcher.** A customizable `<select class="ui-media-cc">` (`appearance: base-select`, Chrome 135+ / Safari soon; degrades to a plain native select). The trigger is the CC disc — `selectedcontent` and `::picker-icon` hidden, glyph shown; the picker lists the languages. `index.js` (`initVideoTools` → `wireCcSelect`) attaches the one `change` → `textTrack.mode` handler (track switching is JS-only; no declarative equivalent exists). Gotchas baked into the CSS: the `<select>` wrapper is pinned to the tool size (it otherwise reserves picker-icon width and mis-sizes); the wrapper swallows the button's `:hover`, so hover state is triggered from `.ui-media-cc:hover button`; **don't** zero the button `font-size` — the base hover ring (`--button-bxsh--hover`) spread is `.16em`; option rows set `background-color: transparent` to kill the UA's stale-active grey, and a soft `border-block-end` replaces the UA's solid `#ccc` divider.

## Aliases — the v5 sweep left none

**There are no live aliases left in the system.** The generated table below is the
full inventory across all three attributes, straight from the manifest, and it is
empty — it stays that way until a new alias is declared:

<!-- tokens:aliases attr=media,variant,content -->
| deprecated | canonical | on | kind |
|---|---|---|---|
<!-- /tokens -->

### Removed in v5 (no alias remains)

These stopped resolving — the CSS arms and the manifest entries are gone, so the
old spellings are inert (no console warning: a token that matches no rule is
simply a no-op). Migration is a find-and-replace, but it is now mandatory:

| removed | use instead | on |
|---|---|---|
| `ovr(tl)` `ovr(tr)` `ovr(cl)` `ovr(cr)` `ovr(bl)` `ovr(br)` | `ovr(ts)` `ovr(te)` `ovr(cs)` `ovr(ce)` `ovr(bs)` `ovr(be)` | `variant=` |
| `…(dark)` `…(light)` `…(subtle)` on `tnt` `chip` `sticker` `beacon` `marquee` `save` `play` | `…(black)` `…(white)` `…(gray)` | `media=` |
| `marquee(loop)` | `marquee(rpt)` | `media=` |
| `rds(none)` | `rds(non)` | `variant=` `media=` `content=` |
| `scm(sheer)` `scm(solid)` | `scm(shr)` `scm(sld)` | `media=` |
| `ply(sm\|md\|lg\|xl)` | `play(sm\|md\|lg\|xl)` | `media=` |
| `scl` `scl(ts…be)` `lg:scl` `lg:scl(ts…be)` | `grw` `grw(ts…be)` `lg:grw` `lg:grw(ts…be)` | `variant=` |

- **`ovr(tl…br)` → `ovr(ts…be)`** — the implementation was **already logical**: `ovr(tl)` rendered top-*end* in RTL, so the physical names were mislabels, not behaviour. Six spellings went, not nine: `ovr(tc)`/`ovr(cc)`/`ovr(bc)` are identical in both grids. `obp(tl…br)` followed in a later v5 round, so `ts tc te · cs cc ce · bs bc be` is now the single spelling everywhere.
- **`…(dark)`/`…(light)`/`…(subtle)` → `…(black)`/`…(white)`/`…(gray)`** — one hue palette (see *The canonical nine hues*). `slate` was **not** removed with them: it routes to its own `--ui-theme-slate-*` bundle, so it was promoted to a canonical hue instead.
- **`marquee(loop)` → `marquee(rpt)`** — `loop` is also the bare carousel autoplay-with-clones flag in the same attribute; the substring match collided, and keeping an alias would have kept the collision surface alive.
- **`rds(none)` → `rds(non)`** (all three attributes) — three-letter args everywhere; `non` matches the `non`/`rnd`/`pll`/`crc`/`sqr` corner vocabulary the furniture already uses.
- **`scm(sheer)`/`scm(solid)` → `scm(shr)`/`scm(sld)`** — same, canonical 3-letter intensity codes, matching the `lgt`/`med`/`drk` ones between them.
- **`ply(<size>)` → `play(<size>)`** — folds the system's only two-stem element into one. Position args (`ts…be`) and size args are disjoint, so one stem parses unambiguously. `render.js` used to normalize `ply(` → `play(` on preset and override input; that code path is gone too, so a stale `ply()` now reaches `media=` verbatim and matches nothing.
- **`scl` / `scl(ts…be)` / `lg:scl` → `grw` / `grw(ts…be)` / `lg:grw`** (`variant=` on `<ui-reveal>`) — reveal's scale-morph animation collided by name with `content=`'s `scl()` type scale. Different attributes, but one spelling should mean one thing; `scl()` now means the type scale and nothing else. The reveal preset word `"type": "scale"` still folds to `grw` — only the token spelling `scl` was dropped.

- **`obp(tl…br)` → `obp(ts…be)`** — the last physical position vocabulary, removed in the same v5 line. Unlike `ovr()`'s rename this one *does* change behaviour: an `s`/`e` cell now mirrors under `dir="rtl"` where `tl…br` never did. Direction-independent focal points move to the `--ui-media-op` custom property, which takes percentages and is strictly more expressive — see [`obp()`](#obp--object-position-9-grid). No exception to the one-position-grid rule remains.

---

## Notes (media.css)

- **Nested `<ui-media>`** (a layered frame used as a carousel slide) is always a plain frame, never a scroller. Raw `ui-media ui-media` (specificity 0,0,2) out-specifies the carousel's descendant rules (0,0,1) in `media.carousel.css`, so the frame wins regardless of import order — no `!important`.
- **Collage** — `:where(ui-media:has(> lay-out)) { min-block-size: 0 }` is what lets a frame host a nested `<lay-out>` grid instead of a single image: the grid's cells own their heights, so the frame must size to content rather than to the `--ui-media-min` floor. Full pattern (tile regimes, row-height knob, the CSS-only collage carousel): [§ Collage](#collage--a-lay-out-grid-inside-the-frame).
- **`clip`** applies `clip-path: inset(0 round …)` because a scroll container's `border-radius` can drop its corners mid-scroll (compositing); `clip-path` clips reliably. `round()` has no superellipse, so `-sq` squircles clip as a plain round.
- **Scrim** has three orthogonal axes — direction (9 gradients, logical `ts…be` grid matching furniture, mirrored under `:dir(rtl)`), size (`sm md lg xl`, sets the shared stop positions), and intensity (`shr lgt med drk sld` — the `sheer`/`solid` aliases were removed in v5 — sets the dark-end opacity). The directional default is set by the host `ovr()` (`ui-card.css`) to match the overlay corner; `scm(<pos>)` overrides; bare `scm` paints the default. A mid colour stop holds the dark before fading so text spanning the frame stays legible, not just at the very corner.

---

## Browser Support

All modern browsers for the core frame, overlays, and scrim.

| Feature | Support |
|---------|---------|
| Custom elements | All modern browsers |
| CSS Grid / logical properties (RTL) | All modern browsers |
| `aspect-ratio` | Chrome 88+, Firefox 89+, Safari 15+ |
| `sizes="auto"` (responsive `srcset`) | Chrome 121+, Firefox 101+; elsewhere falls back to the default `sizes` |
| `corner-shape: superellipse` (`rds(*-sq)`) | Chrome 135+; degrades to the rounded radius |
| Container queries (responsive host) | Chrome 105+, Firefox 110+, Safari 16+ |
| `::scroll-marker` / `::scroll-button` (carousel controls) | Chromium-only; **degrades to a swipeable scroller** elsewhere |
| `anchor()` positioning (carousel controls) | Chromium-only (same gate) |
| `text-box: cap alphabetic` (sticker line-trim) | Chrome 133+; degrades to normal leading |
| `corner-shape` (chip squircle) | Chrome 135+ |
| `color-mix()` / `light-dark()` (tokens) | Chrome 111+/123+, Firefox 113+/120+, Safari 16.2+/17.5+ |
| **`@container style()` style queries** (see below) | Chrome 111+, Safari 18+, Firefox 128+ |

Graceful degradation: the carousel always remains a native, swipeable scroll-snap row even without `::scroll-marker`/`anchor()`; markers and the scrim are pure CSS and need no JS.

### v5 support posture — style queries

A `media=` token that sets **real properties** (not just custom properties) has to reach a
subject that is not the element carrying the attribute — and the attribute may sit on the
host (`<ui-card>`/`<ui-reveal>`) or on the `<ui-media>` itself. Through v4 that meant every
such rule was written with **two selector arms**. In v5 (R-14 step 4) the migrated families
instead set an **inheriting `--_*` flag** with one combinator-free selector that matches
both placements, and apply their properties from a single `@container style(--_flag: …)`
block. The mechanism is the same one `<ui-reveal>` already uses for `--_rvl` and the card
uses for `variant="sub"`.

**Migrated so far:** `marquee(top|bot)` position · `shp()`'s image clip · the `hov()` family
in `media.hover.css` (14 rules). (`tnt`'s paint and `hov(tint)`'s fade were migrated and then
**reverted** — they live in `media.tint.css` and are back on two arms; see *What did NOT
migrate* below.)

**What this costs:** style queries are **Chrome 111+, Safari 18+, Firefox 128+**. On older
Firefox these three families now no-op — the frame renders in its default/un-hovered state.
Nothing breaks structurally: the image, the aspect ratio, the scrim, the furniture and every
carousel control are unaffected, because none of those go through a style query. This is an
accepted v5 posture decision, consistent with the project already shipping `style()` queries
in `ui/reveal` and `layout/core` and Chromium-only `::scroll-marker` controls.

**What did NOT migrate, and why it never will.** A container cannot restyle *itself*: a style
query resolves against the subject's nearest **ancestor**. So a token whose real properties
land on the attribute-bearing `<ui-media>` has nothing to read the flag from when the token
sits on that same element, and keeps its two-arm form permanently:

| Token | Property on `<ui-media>` |
|---|---|
| `asr()` | `min-block-size: 0` (drops the 12.5rem floor) |
| `rds(*-sq)` | `corner-shape: superellipse()` |
| `shp()` | the frame's transparent `background` |
| `tnt` | `isolation: isolate` |
| `hov(tilt*)` | `perspective` |
| the carousel bundle (`nav` · `axis(y)` · `mrk(blw/abv/tmb/rail/sbr)` · `arw(blw/abv)`) | `display` / `overflow` / `box-sizing` / `padding` / `inline-size` / `scrollbar-*` — the scroller box **is** the frame |

Tokens that only write custom properties (`flp()`, `obf()`, `obp()`, the `rds()` radius
scale, `asr()`'s ratio, the `scm()` scrim) never needed two arms in the first place — custom
properties already inherit — and are untouched by this change.

**And one class found the hard way: a pseudo-element's style query, in WebKit.** In theory a
`::before`/`::after` resolves its style query against its **originating** element, so
`@container style(--_tnt: 1) { ui-media::before { … } }` should see a flag set on
`<ui-media>` itself — and in Chromium it does. **WebKit does not evaluate it at first
paint.** The query matched nothing on load, so a tinted frame rendered *untinted* and the
tint only appeared on the first hover — the exact inverse of `hov(tint)`, which stayed put
instead of fading. Declaring `--_tnt` on `<ui-media>` rather than the host does not help
(verified); only dropping the query does.

So `tnt`'s paint and `hov(tint)`'s fade were migrated in R-14 step 4 and then **reverted to
their two-arm form**. Both keep their `--_*` flags — `media.css`'s registry still resets
them across nested hosts, and they remain the documented hook — but no `@container style()`
gates the paint. **Do not re-migrate them.** The guardrail comment in `media.tint.css` says
the same thing at the code.

This is the second boundary of the technique, alongside "a container cannot restyle itself":
a subject reached only through a pseudo-element is not reliably reachable either.

---

## Internals (`media.css`, `media.hover.css`, `media.tint.css`)

> The *why* behind the sheets. These sections used to live as essay-length comment
> blocks at the top of the CSS; the files keep one-line pointers back here plus the
> guardrail markers a future editor must not delete.

### Why the flag pattern reaches both attribute placements

A style query resolves against the subject's **nearest ancestor**, and that is exactly
what makes one flag serve both arms:

- **Token on the host** (`<ui-card>`/`<ui-reveal>`) — the flag is set there and *inherits*
  down through `<cq-box>`/`<ui-media>` to the subject's parent.
- **Token on the `<ui-media>`** — the flag is set on `<ui-media>`, which **is** the
  subject's parent.

Either way the query sees it, so one combinator-free `:where([media*="tok"])` setter
replaces the two selector arms — and it is cheap, because a combinator-free selector is
the fastest shape the engine has.

**Pseudo-elements looked like the friendly special case — they are not.** On paper a
`::before`/`::after` resolves its style query against its **originating** element, so
`ui-media::before` should see a flag set on `<ui-media>` itself; that was verified in
Chromium and is what made `tnt`'s paint look migratable. **WebKit does not evaluate that
query at first paint**, so the migrated form rendered untinted until the first hover, and
`tnt` + `hov(tint)` were reverted to two arms (`media.tint.css` carries the guardrail
comment). Treat a pseudo-element subject as **not** reachable by a style query.

### The flag registry and the nesting boundary

`media=` inheritance stops at the card host, but a **custom property does not** — so a
host nested inside another host has to clear every migrated flag, or an outer card's
`media=` would drive a nested card's frame. One reset block at the top of `media.css`
does that:

```css
:where(ui-card, ui-reveal) :where(ui-card, ui-reveal) { --_mrq: initial; /* … */ }
```

Two rules follow from it, both load-bearing:

1. **Every new flag MUST be listed in that block.** It is the flag registry as well as
   the boundary — a flag missing from it leaks across host nesting. The comment marking
   it in `media.css` stays for that reason.
2. **It is declared BEFORE any setter** so an inner host carrying its own token re-wins
   on source order (both sides are zero-specificity `:where()`). Same nearest-host-wins
   discipline `ui-card.css` uses for `sub` and `content.typography.css` for the size
   ladder.

### Where the hover state is read — two deliberately different shapes

`hov()` is the largest migrated family (14 rules), and its `:hover` sits in one of two
places depending on where it sat before the migration:

- Effects whose `:hover` was on the **token holder** (`zoom` `pan` `tilt-out` `tilt-in`
  `rot-r` `rot-l` `shape`) put `:hover`/`:focus-within` on the **flag setter**, so
  hovering anywhere in the card still fires a card-placed token.
- Effects whose `:hover` was on the **frame** (`drift`, `tilt` overfill) keep `:hover` on
  the subject *inside* the query — `ui-media:hover :is(…)`. The flag only gates; the
  frame's own hover still selects. That preserves the `(0,1,2)` specificity those rules
  always had.

Two implementation notes ride along. The 3D effects (`tilt-out` / `tilt-in` / `rot-r` /
`rot-l`) are driven by the **`rotate:` / `scale:` longhands, not a `transform` list**: a
multi-function `transform` falls back to matrix decomposition between keyframes and jitters
on the way out, while the longhands each interpolate their own value (and leave `transform`
free for `flp()`, so flip composes with them). Perspective for the whole tilt family sits on
the frame and keeps its two-arm form — the subject *is* `<ui-media>`, and a style query
resolves against the subject's nearest **ancestor**, so a self arm would have nothing to
read. The **filter family** (`gray` `blur` `bright` `sat` `dim`) needs no flag at all: it
composes through per-filter custom properties, which already inherit — rest values are set
on the frame, hover values override at higher specificity.

Every image rule stays at `(0,0,2)`, which is what lets `hov(shape)` beat `shp()`'s own
`clip-path` (`media.css`, also `(0,0,2)`, earlier in source). Both are now the same
`ui-media :is(iframe, img, picture, video)` shape inside a style query, so the win is
plain **source order** rather than a hand-tuned selector. All animated properties also
share **one** transition list on the image, so effects compose (`hov(shape) hov(zoom)`)
without clobbering each other's transition. The `filter` vars are `@property`-registered
so they *interpolate* — an unregistered custom property changes discretely and the filter
would jump.

`hov(track|drift|tilt)` are the three effects that need JS (`--ui-media-mx/my` from
`index.js`); the other eleven are CSS-only.

### `obp()` — logical cells over a physical property

`obp()` uses the one grid (`ts tc te · cs cc ce · bs bc be`) like everything else, but
`object-position` accepts only physical keywords — the css-values-4 logical `<position>`
spellings are unimplemented everywhere. It is therefore written in **two axes**: the block
letter sets `--_obp-b`, the inline letter sets `--_obp-i` from base's `--_dir-s`/`--_dir-e`,
and one rule composes them into `--ui-media-op`. No per-family `:dir(rtl)` arm.

`--_obp-b`/`--_obp-i` inherit but are read only inside the `[media*="obp("]` rule, so they
are deliberately **not** in the host-boundary flag registry. The physical `tl…br` spellings
were removed in v5; the escape hatch is `--ui-media-op` itself.

### The marquee band's position args

`marquee()` is a **band**, not a 9-grid point, so it has a band-only `top`/`bot`
vocabulary (`top` = default) and sits at `z-index: 1`, **below** the `z-index: 2`
furniture. Hue and size come from the component's own arms in `ui-marquee.css`
(`:where([media*="marquee(…)"]) &`), which already resolve from either placement.

Only the **position** args are R-14-step-4 migrated: one flag setter plus one style query
whose subject is `<ui-marquee>`, a *child* of the frame — so the query reads the flag off
`<ui-media>` whichever placement set it. `:where(ui-media)` is kept on the subject so the
rule stays scoped to frames and at the same `(0,0,1)` specificity as the base rule it must
beat on source order.

### Scrim — declaration scope and the RTL resolver

`scm()` composes three orthogonal axes on the furniture 3×3 grid — direction
(`scm(<pos>)`), extent (`scm(sm|md|lg|xl)`, `md` default) and intensity
(`scm(shr|lgt|med|drk|sld)`) — and all nine gradients read shared colour + stop vars, so
size and intensity vary without re-baking a gradient per combination. A **mid stop** holds
the dark before fading, so text spanning the frame stays legible rather than only at the
very corner. Each ramp also carries a **concave interpolation hint** biased below the
mid→end midpoint: a long, soft tail into transparent blends the edge invisibly and spreads
the fade over more pixels, which is what keeps a plain three-stop linear ramp from banding.

**Declaration scope (F-12, tightened in v5).** The nine gradient families are declared on
exactly the three subjects that can read them, never on every `[media]`/`[variant]` host:

| Subject | Why it reads them |
|---|---|
| `:where(ui-media)` | the painter (`::after`) and the standalone frame |
| `:where([media*="scm"])` | any host carrying an `scm` token — it computes `--ui-media-scrim` / `--ui-media-scrim-paint` there |
| `:where([variant*="ovr("])` | the overlay host — `ovr()` writes `--ui-media-scrim-default: var(--ui-media-scrim-<pos>)` (`ui-card.css`), which must substitute on the **host** |

A card that uses neither `scm` nor `ovr()` no longer carries 13 custom-property
declarations for nothing.

**RTL via the shared resolver.** The scrim positions are spelled logically, but
`linear-gradient()` has no logical directions — so the six gradients that carry an inline-axis
component interpolate their direction keyword from `--_dir-s`/`--_dir-e` (`ui/base/core.css`).
Without it a `chip(ts)` would mirror in RTL and its matching `scm(ts)` would not. `tc`/`bc`/`cc`
are axis-pure (to bottom / to top / a vertical band) and never flip. This replaced a twin
`:dir(rtl)` block that re-baked all six gradients verbatim — two copies of nine gradients that
had to be kept in sync by hand. The same pair drives `obp()`'s inline axis.

### Sub-theme routing lives in the components

`chip(<hue>)` / `sticker(<hue>)` colour and `save(<hue>|<size>|non)` are **not** in
`media.css`. Each lives in its own sheet (`ui/{chip,sticker,save}/ui-*.css`) in one nested
rule combined with the standalone attribute form (`theme=` / `color=` / `size=` /
`variant="non"`), so there is a single source of truth per element. Only the shared
**positions** — `chip/sticker/save/play(<pos>)` — stay in `media.css`.

### `tnt()` — the opt-in tint sheet

`media.tint.css` is **not** imported by `ui-card.css` — link it on pages that tint (see
`media.tint.html`). It washes the image in a solid colour through a blended overlay on
`ui-media::before`, because a plain `filter` cannot target an exact colour (`hue-rotate`
only rotates the hues already there).

```html
<ui-media media="tnt(red)">                                   <!-- named preset → --ui-theme-red-bg -->
<ui-media media="tnt" style="--ui-media-tint-color:#c8102e">  <!-- any brand colour or gradient -->
<ui-media media="tnt(blue) hov(tint)">                        <!-- fade out on hover → true colour -->
```

Knobs: `--ui-media-tint-color` (default `--color-accent`; any CSS `<color>` **or** a
gradient, since it is painted via `background`), `--ui-media-tint-blend` (default `color`;
try `multiply`/`luminosity`/`screen`), `--ui-media-tint-opacity` (default `1`).

**Layering:** image (base) · tint `::before` (z-1, blends with the image) · scrim `::after`
(z-1) · furniture (z-2). `isolation: isolate` scopes the blend to the frame. Nested frames
suppress the second tint (`ui-media ui-media::before { content: none }`).

The needle `[media*="tnt"]` is safe because no other `media=` token contains the substring
`tnt`. The **paint** is the textbook flag case (the `::before` originating-element rule
above); `isolation: isolate` is not migratable — its subject *is* `<ui-media>` — so it keeps
the two-arm form. Specificity is unchanged: the old `&::before` under the `(0,0,1)` host arm
was `(0,0,2)`, and so is the bare `ui-media::before`, which the `(0,0,2)`
`ui-media ui-media::before` nested-frame guard still beats on source order.

### `shp()` — the opt-in shape library

`media.shapes.css` is likewise **not** bundled — link it on pages that use `shp()` (see
`media.shape.html`). Each rule sets two neutral vars, `--_shp` (the shape) and `--_shp-full`
(its matching-vertex full frame), and a shared bridge wires them into the mechanism that
lives in `media.css` and ships with the card:

| Tokens | Effect |
|---|---|
| `shp(x) hov(shape)` | forward — shape morphs to the full frame on hover |
| `shp(x) hov(shape-rev)` | reverse — full frame (square) morphs to the shape on hover |

Because the mechanism is in `media.css`, it also works with your own custom
`--ui-media-shape` / `--ui-shape-morph` values without the library sheet.

**Why the morph targets look odd.** A clip-path only interpolates cleanly between shapes of
the same function and the same vertex count, so each `--_shp-full` is a full-bleed rectangle
padded to its shape's vertex count — the extra vertices sit on the edge nearest each tip.
The curve shapes pair with an `ellipse()` at 75% radii (clears all four corners) and the
circular ones with a `circle()` past 71% (a circle percentage resolves against the diagonal,
so 71%+ covers a square frame). `frame` routes its seam slit to bottom-centre at zero width,
so the four inner points can collapse to the true centre with no visible line cutting through.
