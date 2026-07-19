# @browser.style/content

> **Status:** shipped (v4). `<ui-content>` is the CSS-first content primitive extracted from the `ui-card` monolith into `ui/card/content.css`, per `docs/plans/2026-06-20-ui-media-content-split-design.md` (§5). This documents the implemented API.

A CSS-first **content (text) primitive** — a vertical flex column that styles a card's textual parts (eyebrow, headline, summary, byline, tags, actions, …) from a single inherited token namespace. It works **standalone** or **nested inside any host** (`<ui-card>`, `<ui-reveal>`, or your own layout), with no descendant-selector coupling to a parent.

`<ui-content>` is the sibling of `<ui-media>`: media owns the picture, content owns the words. `<ui-card>` / `<ui-reveal>` are thin *composition* layers that orchestrate the two primitives via layout.

## Features

- Pure CSS — zero JavaScript required
- Standalone **or** nested in `<ui-card>` / `<ui-reveal>` / any layout host
- Reads its own inherited `--ui-content-*` namespace — no `[variant]` ancestor needed
- Configured by a compact `content=` token DSL on **itself or any ancestor** (inheritance does the wiring)
- Auto-styled semantic parts via `data-part` (never keyed off the tag) — the same part renders identically as a phrasing element (inside a `<summary>`) or a flow/semantic element (in a revealed panel)
- Fluid container-query typography ramp (`cqi` `clamp()`) for body + headline, switchable per instance
- Overlay-aware: a host writes placement/ink tokens when content is stacked over media
- Theme-aware: host themes write the muted / eyebrow / tag ink into the content namespace
- Arbitrary values via `style="--ui-content-*"` — no exhaustive token list to memorize
- RTL-safe (logical properties throughout)

---

## Install

```bash
npm install @browser.style/content
```

Peer dependency:

```bash
npm install @browser.style/base
```

> `@browser.style/base` provides the global design token system (`--spacing-*`, `--color-*`, `--font-weight-*`, …). Because base is a required peer dependency, the global tokens `<ui-content>` references are always present — no hardcoded fallbacks are needed for them.

---

## Usage

### CSS-only (vanilla HTML)

```html
<link rel="stylesheet" href="@browser.style/base/index.css">
<link rel="stylesheet" href="@browser.style/content/index.css">
```

Or via CSS `@import`:

```css
@import '@browser.style/base';
@import '@browser.style/content/style';
```

```html
<ui-content content="scl(lg) pad(md) gap(sm)">
  <small data-part="eyebrow">New</small>
  <h2 data-part="headline">A standalone content block</h2>
  <p data-part="summary">Configured entirely from the <code>content=</code> attribute.</p>
</ui-content>
```

### Nested in a host

The `content=` attribute can sit on `<ui-content>` itself **or on any ancestor** — the tokens it sets are custom properties, which inherit down to the primitive:

```html
<!-- token on the host: inherits down to ui-content -->
<ui-card content="scl(lg) pad(md) gap(sm)">
  <ui-media>…</ui-media>
  <ui-content>
    <h2 data-part="headline">Headline</h2>
    <p data-part="summary">Body copy.</p>
  </ui-content>
</ui-card>
```

This is the core mechanism: there is **one rule set** that serves both cases — `<ui-content content="…">` matches itself; `<ui-card content="…"> … <ui-content>` matches the card and inherits the property down.

### Web Component

When the package ships a JS entry, importing it only registers the element — the HTML structure is identical to CSS-only:

```js
import '@browser.style/content';
```

`<ui-content>` is a CSS-first primitive; the element is functionally complete without JavaScript.

---

## The `content=` token DSL

`content=` is a compact attribute mini-language. Each modifier is a **3-letter code** with `()` arguments, plus one bare flag (`scr`). Every token simply writes a custom property, so an unsupported value is never a blocker — set the property directly via `style` (see *Arbitrary values*).

| Token | Args | Controls | Responsive (`md:`/`lg:`) |
|-------|------|----------|--------------------------|
| `scl()` | `sm` `md` `lg` `xl` · mode `fix` `fluid` | master type-scale step — swaps the active body **and** headline stop AND re-points the relational size ladder (see *Relational scale*). `fix` switches every stop to the global static scale, `fluid` back to the `cqi` clamps (see *Static scale*) | steps **Yes** (modes No) |
| `hl()` | size `sm` `md` `lg` `xl` `2xl` `3xl` · tone · weight · font `body`/`head`/`serif`/`mono`/`form` · `grad` · `shd` | headings group — headline size (only, relational), ink, weight, **font**, gradient, shadow | size **Yes** |
| `fnt()` | `body` `head` `serif` `mono` `form` | container font family for the whole column (`--ui-content-font`) | No |
| `eb()` | size `sm`–`xl` · tone · weight · `flat` · `shd` | eyebrow group — size (relational), ink, weight, drop uppercase, shadow | No* |
| `tx()` | size `sm`–`xl` · tone · weight · `shd` | body group — size (relational), ink, weight, shadow (summary/quote/list/address/timeline/price/stat) | No* |
| `mt()` | size `sm`–`xl` · tone · weight · `shd` | meta group — size (relational), ink, weight, shadow (meta/caption/byline/footer/tags/rating/options) | No* |
| `pad()` | `none` `xs` `sm` `md` `lg` `xl` `2xl` | content padding (`--ui-content-p`) | **Yes** |
| `gap()` | `none` `xs` `sm` `md` `lg` | row gap between parts (`--ui-content-gap`) | **Yes** |
| `ctr` / `end` | *(flag)* | standalone cross-axis + text alignment — centre / end the whole content column (`--ui-content-align`), independent of `ovr()` overlay placement | No |
| `scr` / `scr(y)` / `scr(x)` | *(flag)* | scrollable content + shared `ui-scroll-fade` edge mask (`ui/base/scroll.css`). Bare `scr` = `scr(y)` = vertical column; `scr(x)` = horizontal row | No |

**Tone** (ink strength + hue): `shr` (30%) · `lgt` (45%) · `med` (65%, = muted) · `drk` (85%) · `sld` (100%, theme text) · `accent` · `inv` (white, for overlays).
**Weight**: `300`–`900` → `--font-weight-*` (`800` is a literal). **Vocabularies are disjoint** so a size, a tone, and a weight never collide inside one family — e.g. `hl(3xl)`, `hl(accent)`, and `hl(900)` compose freely.

\* Group **sizes** have no `md:`/`lg:` prefixed forms of their own — they don't need them: a group size names a step on the relational ladder, so a responsive `md:`/`lg:` `scl()` already shifts it per breakpoint (see *Relational scale*).

```css
/* parse layer — matches the element OR any ancestor. Whole-token (~=) matching,
   so base tokens don't collide with the md:/lg: prefixed forms. */
:where([content~="scl(lg)"]) { --ui-content-fs: var(--ui-content-fs-lg); --ui-content-headline: var(--ui-content-headline-lg); }
:where([content~="pad(lg)"]) { --ui-content-p:   var(--spacing-lg); }
:where([content~="gap(sm)"]) { --ui-content-gap: var(--spacing-sm); }
```

### Arbitrary values (escape hatch)

The `()` tokens are *sugar* — each rule just writes a custom property. For any value not in the token list, set the property directly:

```html
<ui-content style="--ui-content-gap: 1.25rem; --ui-content-p: 2.5rem;">…</ui-content>
```

### `scl()` vs the card's old `fs()`

`scl()` replaces the legacy `fs()` token. It lives on `content=` (typography is a content concern) and swaps the **active body and headline stop** in one go. Media overlays (`<ui-chip>` etc.) read the same inherited `--ui-content-fs` for sizing.

### Relational scale — how sizes compose with `scl()`

Size tokens name a **step on a ladder**, not an absolute stop:

- **No `scl()` present** → sizes are **fixed**: `hl(2xl) tx(xl)` is the 2xl headline clamp over the xl body clamp, at every width.
- **`scl()` present** (incl. responsive `md:`/`lg:` forms) → the master step **re-points the whole ladder**: `scl(sm)` shifts every named step one stop down, `scl(md)` is identity, `scl(lg)` one up, `scl(xl)` two up — **saturating at the ends**. So `scl(sm) hl(2xl)` renders the xl stop, and the mobile-first idiom

```html
<ui-content content="scl(sm) lg:scl(md) hl(2xl) tx(xl)">…</ui-content>
```

renders headline/summary at the xl/lg stops in a narrow container and steps them up to 2xl/xl once the container passes lg — every size token rides the master step while keeping its **relative** prominence.

**Headline ladder** (`hl()` steps; the body ladder for `tx()`/`eb()`/`mt()` follows the same pattern over `fs-sm`…`fs-2xl`):

| token | scl(sm) −1 | scl(md) 0 | scl(lg) +1 | scl(xl) +2 |
|-------|-----------|-----------|-----------|------------|
| `hl(sm)` | sm | sm | md | lg |
| `hl(md)` | sm | md | lg | xl |
| `hl(lg)` | md | lg | xl | 2xl |
| `hl(xl)` | lg | xl | 2xl | 3xl |
| `hl(2xl)` | xl | 2xl | 3xl | 3xl |
| `hl(3xl)` | 2xl | 3xl | 3xl | 3xl |

Note the saturation: under `scl(xl)` the display steps merge at `3xl`. The `scl(md)` column is the identity — which is also why existing scl-only markup renders exactly as before.

Under the hood: `scl()` writes the ladder vars `--ui-content-hl-{sm…3xl}` / `--ui-content-tx-{sm…xl}`, and each size token reads its ladder var with the absolute stop as fallback (all in `content.typography.css`). The group bases are the escape hatches: `--ui-content-body-fs` (Body), `--ui-content-meta-base` (Meta), `--ui-content-eyebrow-fs` (Eyebrow) — set them directly via `style=` for any off-ladder size.

### Static scale — `scl(fix)` / `scl(fluid)`

Fluidity is a **mode**, and `scl(fix)` turns it off: every stop is re-pointed from its hand-tuned `cqi` clamp to the **global static type scale** (`--font-size-*` in `ui/base/tokens.css`), so type changes only at the `md:`/`lg:` container breakpoints — never in between. Everything else keeps working unchanged (steps, the relational ladder, responsive prefixes, per-part ×-factors), just between discrete sizes:

```html
<!-- the designer's model: two exact sizes, switched at the lg breakpoint -->
<ui-card content="scl(fix) hl(lg) lg:hl(xl)">…</ui-card>  <!-- 1.875rem, then 3rem -->
```

Stop → global token mapping (the 3xl→5xl skip mirrors the fluid ramp's own big `lg`→`xl` jump):

| Stop | Body | Headline |
|------|------|----------|
| `sm` | `--font-size-sm` (0.875rem) | `--font-size-xl` (1.25rem) |
| `md` | `--font-size-base` (1rem) | `--font-size-2xl` (1.5rem) |
| `lg` | `--font-size-lg` (1.125rem) | `--font-size-3xl` (1.875rem) |
| `xl` | `--font-size-xl` (1.25rem) | `--font-size-5xl` (3rem) |
| `2xl` | `--font-size-2xl` (1.5rem) | `--font-size-6xl` (3.75rem) |
| `3xl` | — | `--font-size-7xl` (4.5rem) |

`scl(fluid)` is the explicit opt-out — a nested card inside a `fix` deck goes fluid again (the fluid clamps live in the `--ui-content-{fs,headline}-fluid-*` companion vars, single-sourced). Notes: the modes are **not** `md:`/`lg:` prefixable (a mode, not a step); mode tokens are matched at `(0,1,0)` self + descendant forms, so the **nearest mode token wins** — except an explicit `scl(fluid)` cannot be re-fixed further down (source-order tie-break). Rebrand the static scale globally by overriding `--font-size-*`, or per-scope by overriding the stop vars directly.

---

## Type styling — groups, tone, size, weight

Every part belongs to one of **four logical groups**. A group family token writes a group-level custom property; each part reads `var(--ui-content-{part}-X, var(--ui-content-{group}-X, <default>))`, so a group token restyles the whole group while a per-part `style="--ui-content-{part}-X"` still overrides one part.

| Group | Family | Group ink prop | Parts |
|-------|--------|----------------|-------|
| Eyebrow | `eb()` | `--ui-content-eyebrow-ink` | eyebrow |
| Headings | `hl()` | `--ui-content-heading-ink` | headline (+ bare `h2`–`h6`), subheadline |
| Body | `tx()` | `--ui-content-body-ink` | summary, quote, list, address, timeline, price, stat |
| Meta | `mt()` | `--ui-content-meta-ink` | meta, caption, byline, footer, tags, rating, options |

**Three disjoint arg vocabularies** (so whole-token matching can't confuse them):

- **tone** (ink): `shr` `lgt` `med` `drk` `sld` `accent` `inv` — an opacity ramp of the current ink (`shr` 30% → `sld` 100% via `--ui-content-{shr,soft,muted,drk}`), plus `accent` (`--color-accent`) and `inv` (`#fff`, for overlays). Writes the group ink prop.
- **size** (all four families + `scl()`): `sm` `md` `lg` `xl` (+ `2xl` `3xl` on `hl()`). `scl()` is the master step (body **and** headline, `sm`–`xl`); `hl()` sizes the **headline only** (`sm`–`3xl`) so a display title can decouple from readable body copy; `eb()`/`tx()`/`mt()` size their group off the body ramp. All sizes are **relational** — they shift with `scl()` (see *Relational scale*). `3xl` is the display step (`clamp(2.5rem, 1rem + 11cqi, 8rem)`, the token formerly called `poster`).
- **weight**: `300`–`900` → `--font-weight-*` (`800` is a literal; there is no `--font-weight-extrabold`). Offered on `eb()`, `hl()`, `tx()`, `mt()`.

Plus flags: **`eb(flat)`** drops the eyebrow's default uppercase; **`hl(grad)`** clips the whole headline to `--ui-content-headline-gradient` (the same gradient an inner `<b>` gets); **`shd`** on any family (`hl(shd)` `eb(shd)` `tx(shd)` `mt(shd)`) adds a legibility **text-shadow** to that group.

### `shd` — text-shadow for legibility

`shd` is an opt-in flag (disjoint from tone/size/weight) that turns on a text-shadow for a group — primarily for **overlaid** headline/eyebrow read over a `scm` scrim. It writes the group's shadow prop from the tunable `--ui-content-text-shadow` default (`0 1px 3px` of a 55% black), and each part reads `text-shadow: var(--ui-content-{part}-text-shadow, var(--ui-content-{group}-text-shadow, none))` — so shadows are off by default and overridable per part.

```html
<!-- explicit opt-in -->
<ui-content content="hl(shd) eb(shd)"> … </ui-content>
```

**Scrim synergy:** a host `ovr()` (overlay) **automatically** sets the headline + eyebrow shadow (`--ui-content-heading-text-shadow` / `--ui-content-eyebrow-text-shadow` → `--ui-content-text-shadow`), so overlaid titles get a legibility shadow over the scrim with no extra token. Turn it off per instance with `style="--ui-content-heading-text-shadow: none"`, or retune globally via `--ui-content-text-shadow`.

### `fnt()` — font families (container + heading split)

`fnt(<font>)` sets the font of the **whole text column**; `hl(<font>)` overrides **only the headline**. Both take the same disjoint arg set — `body` `head` `serif` `mono` `form` — which maps to the global `--font-*` tokens. Because those words don't collide with `hl()`'s size / tone / weight / flag args, `hl(serif)` etc. compose safely on the same token.

| Arg | Token | |
|-----|-------|---|
| `body` | `--font-body` | default sans column |
| `head` | `--font-heading` | the theme's heading stack (`inherit` by default) |
| `serif` | `--font-serif` | serif |
| `mono` | `--font-mono` | monospace |
| `form` | `--font-form` | system-UI (form controls) |

- **`fnt(<font>)`** writes `--ui-content-font` → the container `font-family`. `fnt(serif)` makes the **entire** column serif.
- **`hl(<font>)`** writes `--ui-content-heading-font` → the headline `font-family`. Since `--font-heading` resolves to `inherit`, a headline **follows the container font** unless `hl(<font>)` overrides it — so `hl(serif)` gives a **serif headline over a sans body** (the editorial split). Reverse it with `fnt(serif) hl(body)`.

```html
<!-- serif headline, sans body -->
<ui-content content="hl(serif)"> … </ui-content>
<!-- whole column monospace -->
<ui-content content="fnt(mono)"> … </ui-content>
```

Escape hatch: set `--ui-content-font` (column) or `--ui-content-heading-font` (headline) directly via `style` for any family not in the token set. Live demo: [content.typography.html](content.typography.html).

```html
<!-- big accent display title, light body, muted meta -->
<ui-content content="hl(3xl) hl(accent) tx(lgt) mt(med)">
  <small data-part="eyebrow">Featured</small>
  <h2 data-part="headline">Display headline</h2>
  <p data-part="summary">Readable body copy.</p>
  <p data-part="meta">Muted meta line.</p>
</ui-content>
```

Because `hl(<size>)` and `scl()` both write `--ui-content-headline` at zero specificity, the `hl()` rules are placed **after** every `scl()` form (base and responsive) in `content.typography.css`, so `hl(<size>)` wins when both appear — while still shifting *with* `scl()` via the ladder.

---

## Parts (`data-part`)

Content parts are **semantic children** marked with `data-part`. They are auto-styled — you don't add classes. Styling keys off `[data-part]`, **never the tag name**, which is what lets the same part render identically across two different content models (see *Tag choice by context* below).

| Part | Typical element | What it styles |
|------|-----------------|----------------|
| `eyebrow` | `<small data-part="eyebrow">` / `<p>` | Uppercase, tracked, accent-colored kicker above the headline |
| `headline` | `<h2 data-part="headline">` (also bare `h2`–`h6`) | The title — headline type ramp, bold weight, tight tracking, `text-wrap: pretty` |
| `subheadline` | `<p data-part="subheadline">` | Secondary title — muted color, normal weight, ~0.88× body |
| `summary` | `<p data-part="summary">` | The body / lede paragraph — body size, normal line-height |
| `meta` | `<p data-part="meta">` | Small muted metadata line (date, read-time) — ~0.75× body |
| `caption` | `<figcaption data-part="caption">` | Same treatment as `meta`; usable inside `<ui-media>` (sits above the scrim) |
| `byline` | `<address data-part="byline">` | Author row — flex, centered; an inner `<img>` becomes a round avatar |
| `tags` | `<ul data-part="tags">` | Tag list — flex-wrap. Children are either **plain links** (default pill) or **`<ui-chip>`** (full colour palette) — see below |
| `actions` | `<div data-part="actions">` | Button / link row — flex-wrap with action gap |
| `footer` | `<footer data-part="footer">` | Trailing muted meta row — flex-wrap |
| `price` | `<p data-part="price">` | **Body group** (prominent) — large current price; `<del>` struck original, `<small>` accent discount |
| `stat` | `<p data-part="stat">` | **Body group** (prominent) — big `<data>` number + `<small>` unit; muted trend |
| `list` | `<ul>`/`<ol data-part="list">` | **Body group** — feature / step list; flex column |
| `address` | `<address data-part="address">` | **Body group** — postal block, no avatar (distinct from byline) |
| `timeline` | `<ol data-part="timeline">` | **Body group** — dated entries; muted `<time>` |
| `quote` | `<blockquote data-part="quote">` | **Body group** — indented; composes with `@browser.style/blockquote` `data-variant` |
| `rating` | `<div data-part="rating">` | **Meta group** — inline star row + count |
| `options` | `<ul data-part="options">` | **Meta group** — poll / comparison rows with `<progress>` |

Bare headings (`h2`–`h6`) are styled identically to `data-part="headline"` as a convenience, so plain semantic markup just works.

Each part keeps its own `--ui-content-{part}-*` token(s) (see *Tokens*) for future per-part typography knobs.

### Tags — plain links or `<ui-chip>`

`data-part="tags"` hosts two kinds of child, and they compose in the same list:

- **Plain links** — `<li><a href="…">Tag</a></li>` render as the built-in **pill** (`--ui-content-tag-bg` / `-color` / `-radius` / `-padding`). This is the default and the current `render.js` output.
- **`<ui-chip>` children** — `<li><ui-chip><a href="…">Tag</a></ui-chip></li>` style themselves via `@browser.style/chip`. A **bare `<ui-chip>` (no attributes) is the default grey pill** (grey on light surfaces, darker grey on dark — same `--color-button` as the plain-link default), so it's a drop-in upgrade; add `theme=` (red/orange/green/blue/accent/dark/light/subtle) or `variant="light"` / `variant="outline"` (plus `size=`, `radius=`) for the full palette. See [ui/chip](../chip/).

The bespoke pill is scoped to `& a:not(ui-chip *)`, so it is a **fallback** that never leaks onto a chip's own `<a>` — a `<ui-chip>` always styles itself. Mixing both in one list is fine.

> **Renderer:** `render.js` currently emits the plain-link form (`<li><a>`), which keeps working as the default pill. Emitting `<ui-chip>` from tag/category data is **deferred to the render rework** — the CSS + demos support chips now; `render.js` is intentionally not changed in this pass.

---

## CRITICAL — tag choice by context

A `<ui-content>` can appear in two places inside a `<ui-reveal>`, and the two have **opposite content-model rules**. Pick the element tag to match the context; the `data-part` value stays the same, so the styling is identical either way.

| Context | Content model | Use |
|---------|---------------|-----|
| Inside `<summary>` (the trigger face) | **Phrasing content only** — `<p>`, `<h2>`, `<address>`, `<ul>` are **invalid** here | Phrasing elements with `data-part`: `<b data-part="headline">`, `<span data-part="summary">`, `<small data-part="eyebrow">` |
| The revealed panel — `::details-content`, **after** `</summary>` | Flow content allowed | Real **semantic tags**: `<h2 data-part="headline">`, `<p data-part="summary">`, `<address data-part="byline">` |

Because styling keys off `[data-part]` and never the tag, the **same part token renders identically in both** — the author just swaps a phrasing element (inside `<summary>`) for a flow/semantic element (in the revealed panel). This is precisely *why* parts stay `data-part` rather than becoming custom elements.

### Before / after

**Inside `<summary>` — phrasing-only (valid):**

```html
<summary>
  <ui-content>
    <small data-part="eyebrow">Featured</small>
    <b data-part="headline">The trigger headline</b>
    <span data-part="summary">A short teaser that toggles the panel.</span>
  </ui-content>
</summary>
```

**In the revealed panel — flow / semantic tags (valid):**

```html
<!-- after </summary>, inside ::details-content -->
<ui-content>
  <small data-part="eyebrow">Featured</small>
  <h2 data-part="headline">The trigger headline</h2>
  <p data-part="summary">The full article copy, now with real semantic structure.</p>
  <address data-part="byline"><img src="…" alt=""> Jane Doe</address>
</ui-content>
```

`<b>` → `<h2>`, `<span>` → `<p>`, (added) `<address>` — all sharing the same `data-part`, all styled the same.

---

## Typography ramp

The two fluid `cqi` `clamp()` scales (body + headline) live on `<ui-content>` (defined in `content.typography.css`). `scl()` swaps which stop is *active*; the full ladder is always defined so any stop is reachable via `style`. The clamps are single-sourced in `--ui-content-{fs,headline}-fluid-*` companion vars — the canonical stops default to them, and `scl(fix)` re-points the stops to the global static `--font-size-*` scale instead (see *Static scale*).

**Body scale** (`--ui-content-fs-{sm..2xl}`):

| Stop | `clamp()` |
|------|-----------|
| `sm` | `clamp(0.80rem, 0.74rem + 0.4cqi, 0.90rem)` |
| `md` *(default)* | `clamp(0.88rem, 0.80rem + 0.6cqi, 1.00rem)` |
| `lg` | `clamp(0.95rem, 0.86rem + 0.8cqi, 1.10rem)` |
| `xl` | `clamp(1.00rem, 0.92rem + 0.9cqi, 1.20rem)` |
| `2xl` | `clamp(1.08rem, 0.98rem + 1.1cqi, 1.32rem)` — ladder headroom only (no `scl(2xl)`/`tx(2xl)` token; reached when `scl(lg)`/`scl(xl)` shift `tx(lg)`/`tx(xl)` up) |

**Headline scale** (`--ui-content-headline-{sm..3xl}`):

| Stop | `clamp()` |
|------|-----------|
| `sm` | `clamp(1.05rem, 0.90rem + 1.0cqi, 1.35rem)` |
| `md` *(default)* | `clamp(1.20rem, 1.00rem + 1.6cqi, 1.75rem)` |
| `lg` | `clamp(1.45rem, 1.05rem + 3.0cqi, 2.50rem)` |
| `xl` | `clamp(1.90rem, 1.10rem + 5.5cqi, 4.50rem)` |
| `2xl` | `clamp(2.25rem, 1.20rem + 7cqi, 5.50rem)` — `hl()`-only display step |
| `3xl` | `clamp(2.50rem, 1.00rem + 11cqi, 8.00rem)` — `hl()`-only display step (formerly `poster`) |

`scl(lg)` sets `--ui-content-fs: var(--ui-content-fs-lg)` **and** `--ui-content-headline: var(--ui-content-headline-lg)` together.

> The `cqi` unit measures against the nearest container. Standalone, drop `<ui-content>` inside an element with `container-type: inline-size` to make the ramp fluid; otherwise the `clamp()` resolves at its preferred value. Inside `<ui-card>` the card is the container.

### Per-part size ratios

Parts size relative to the active body size (`--ui-content-fs`), so the whole block scales together:

| Part | Size relative to body |
|------|-----------------------|
| `headline` | the headline ramp (`--ui-content-headline`) |
| `subheadline` | ~0.88× |
| `summary` | 1× (body) |
| `eyebrow` | ~0.78× |
| `byline` | ~0.82× |
| `meta` / `caption` | ~0.75× |
| `tags` | ~0.72× |
| `footer` | ~0.78× |

### Headline rhythm (leading + space-after)

The headline's vertical rhythm is set by two size-independent formulas so it reads correctly from `sm` to `3xl` without per-step tuning:

- **`line-height: calc(1em + 0.25rem)`** — a *constant-leading* formula. The added leading is a fixed `0.25rem` at every size, so the effective ratio tightens as the type grows (md `1.75rem` → ~1.14; 3xl ~110px → ~1.04; asymptote → 1.0). Small headings stay airy, display headings stay tight. Override with `--ui-content-headline-line-height`.
- **`margin-block-end: 0.25em`** — *modular* rhythm: the gap after the heading scales with the heading's own em, so a bigger title gets a proportionally bigger gap to the body (this is in addition to the flex `gap()` between parts). Override with `--ui-content-headline-rhythm`. The em rule wins over the container's `& > * { margin: 0 }` reset (attribute/type specificity beats the zero-specificity reset).

---

## Overlay placement

When content is **stacked over media** (a host applies `ovr()` — overlay), the host writes the `--ui-content-ov-*` placement tokens *into* the content namespace, so the primitive stays self-contained:

| Token | Written by host `ovr()` | Standalone default |
|-------|-------------------------|--------------------|
| `--ui-content-ov-align` | `align-items` (start / center / end) | `normal` |
| `--ui-content-ov-justify` | `justify-content` (start / center / end) | `normal` |
| `--ui-content-ov-text` | `text-align` (start / center / end) | `start` |
| `--ui-content-ov-ink` | overlay ink color (e.g. `#fff`) | `inherit` |
| `--ui-content-ov-z` | stacking (`1` over media) | `auto` |

Example — host overlay at bottom-center:

```css
:where([variant*="ovr(bc)"]) {
  --ui-content-ov-justify: end; --ui-content-ov-align: center; --ui-content-ov-text: center;
  --ui-content-ov-ink: var(--ui-card-overlay-ink, #fff); --ui-content-ov-z: 1;
}
```

Standalone content gets the neutral `normal` / `inherit` / `start` / `auto` defaults — overlay placement is inert until a layout asks for it.

---

## Theme ink

Host themes come from the shared `theme=` axis ([base/theme.md](../base/theme.md)) and set the card surface; the neutrals ramp **`white` < `gray` < `slate` < `black`**. Adding the `dark` modifier (`theme="slate dark"`, `theme="black dark"`) flips `color-scheme: dark` so the muted / eyebrow / tag ink and controls re-tone automatically (the ink ramp derives from `currentColor`, so most parts follow with no explicit write). Where a theme sets ink explicitly, those tokens live on `<ui-content>`, not on the card:

| Token | Read by | Themed by |
|-------|---------|-----------|
| `--ui-content-muted` | subheadline, meta, caption, byline, footer | theme |
| `--ui-content-eyebrow-color` | eyebrow | theme |
| `--ui-content-tag-bg` | tags pills | theme |

```css
:where([theme~="black"]) {
  --ui-content-muted: color-mix(in oklab, currentColor 60%, transparent);
  --ui-content-tag-bg: rgb(255 255 255 / 0.12);
}
```

> **Namespace trap:** the legacy tokens were `--ui-card-muted` / `--ui-card-eyebrow-color` / `--ui-card-tag-bg`. In v4 they move to the `--ui-content-*` spelling. A theme rule that still writes the old `--ui-card-*` names will silently lose its muted / eyebrow / tag remap.

> **`-color` → `-ink` rename:** per-part ink hooks are now spelled `--ui-content-{part}-ink` (house term for text colour, cf. `--ui-content-ov-ink`). The old `--ui-content-{part}-color` names are **kept as aliases** — each part reads `var(--ui-content-{part}-ink, var(--ui-content-{part}-color, …))` — so existing themes/demos keep working. Prefer `-ink` in new code. `eb()` writes `--ui-content-eyebrow-ink`, which wins over a theme-set `--ui-content-eyebrow-color`.

---

## Tokens

All tokens live in the `--ui-content-*` namespace. Override per instance, per host, or globally.

### Container

| Token | Default | Description |
|-------|---------|-------------|
| `--ui-content-font` | `var(--font-body)` | Container font family (set by `fnt()`) |
| `--ui-content-heading-font` | `var(--font-heading)` (= `inherit`) | Headline font family (set by `hl(<font>)`; follows the column font otherwise) |
| `--ui-content-fs` | `var(--ui-content-fs-md)` | Active body font-size |
| `--ui-content-fs-sm` | `clamp(0.80rem, 0.74rem + 0.4cqi, 0.90rem)` | Body ramp — small |
| `--ui-content-fs-md` | `clamp(0.88rem, 0.80rem + 0.6cqi, 1.00rem)` | Body ramp — medium (default) |
| `--ui-content-fs-lg` | `clamp(0.95rem, 0.86rem + 0.8cqi, 1.10rem)` | Body ramp — large |
| `--ui-content-fs-xl` | `clamp(1.00rem, 0.92rem + 0.9cqi, 1.20rem)` | Body ramp — extra large |
| `--ui-content-fs-2xl` | `clamp(1.08rem, 0.98rem + 1.1cqi, 1.32rem)` | Body ramp — ladder headroom (no `scl(2xl)`/`tx(2xl)` token) |
| `--ui-content-headline` | `var(--ui-content-headline-md)` | Active headline font-size |
| `--ui-content-headline-sm` | `clamp(1.05rem, 0.90rem + 1.0cqi, 1.35rem)` | Headline ramp — small |
| `--ui-content-headline-md` | `clamp(1.20rem, 1.00rem + 1.6cqi, 1.75rem)` | Headline ramp — medium (default) |
| `--ui-content-headline-lg` | `clamp(1.45rem, 1.05rem + 3.0cqi, 2.50rem)` | Headline ramp — large |
| `--ui-content-headline-xl` | `clamp(1.90rem, 1.10rem + 5.5cqi, 4.50rem)` | Headline ramp — extra large |
| `--ui-content-headline-2xl` | `clamp(2.25rem, 1.20rem + 7cqi, 5.50rem)` | Headline ramp — display (`hl()`-only) |
| `--ui-content-headline-3xl` | `clamp(2.50rem, 1.00rem + 11cqi, 8.00rem)` | Headline ramp — display (`hl()`-only; formerly `poster`) |
| `--ui-content-tx-{sm..xl}` / `--ui-content-hl-{sm..3xl}` | *(unset without `scl()`)* | Relational ladders written by `scl()` — read by all size tokens (see *Relational scale*) |
| `--ui-content-body-fs` | *(unset — body parts fall back to `--ui-content-fs`)* | Body-group base size (set by `tx(<size>)`) |
| `--ui-content-meta-base` | *(unset — meta parts fall back to `--ui-content-fs`)* | Meta-group base size (set by `mt(<size>)`) |
| `--ui-content-p` | `var(--spacing-md)` | Content padding (set by `pad()`) |
| `--ui-content-gap` | `1em` | Row gap between parts (set by `gap()`) |
| `--ui-content-muted` | `color-mix(in oklab, currentColor 65%, transparent)` | Muted ink (subheadline, meta, byline, footer) |

### Overlay (written by host `ovr()`)

| Token | Default | Description |
|-------|---------|-------------|
| `--ui-content-ov-align` | `normal` | `align-items` when overlaid |
| `--ui-content-ov-justify` | `normal` | `justify-content` when overlaid |
| `--ui-content-ov-text` | `start` | `text-align` when overlaid |
| `--ui-content-ov-ink` | `inherit` | Ink color when overlaid |
| `--ui-content-ov-z` | `auto` | Stacking when overlaid |

### Per-part

| Token | Default | Part |
|-------|---------|------|
| `--ui-content-eyebrow-color` | `var(--color-accent)` | eyebrow color |
| `--ui-content-eyebrow-fs` | `calc(var(--ui-content-fs) * 0.78)` | eyebrow size |
| `--ui-content-eyebrow-weight` | `var(--font-weight-medium, 500)` | eyebrow weight |
| `--ui-content-headline-weight` | `var(--font-weight-bold, 700)` | headline weight |
| `--ui-content-headline-line-height` | `calc(1em + 0.25rem)` | headline line-height (constant-leading formula — see below) |
| `--ui-content-headline-rhythm` | `0.25em` | space after the headline (modular em rhythm — see below) |
| `--ui-content-subheadline-color` | `var(--ui-content-muted)` | subheadline color |
| `--ui-content-subheadline-fs` | `calc(var(--ui-content-fs) * 0.88)` | subheadline size |
| `--ui-content-subheadline-weight` | `var(--font-weight-normal, 400)` | subheadline weight |
| `--ui-content-summary-color` | `inherit` | summary color |
| `--ui-content-summary-fs` | `var(--ui-content-fs)` | summary size |
| `--ui-content-meta-color` | `var(--ui-content-muted)` | meta / caption color |
| `--ui-content-meta-fs` | `calc(var(--ui-content-fs) * 0.75)` | meta / caption size |
| `--ui-content-byline-fs` | `calc(var(--ui-content-fs) * 0.82)` | byline size |
| `--ui-content-byline-gap` | `var(--spacing-sm)` | byline gap |
| `--ui-content-avatar-size` | `2.25em` | byline avatar size |
| `--ui-content-tags-fs` | `calc(var(--ui-content-fs) * 0.72)` | tags size |
| `--ui-content-tags-gap` | `var(--spacing-xs, 0.35rem)` | tags gap |
| `--ui-content-tag-bg` | `var(--color-button, hsl(0, 0%, 90%))` | tag pill background |
| `--ui-content-tag-color` | `inherit` | tag pill text |
| `--ui-content-tag-radius` | `var(--radius-pill, 100px)` | tag pill corner radius — set to `0` (or a small radius) for square tags |
| `--ui-content-tag-padding` | `0.2em 0.7em` | tag pill padding (label is centered via `place-content`) |
| `--ui-content-actions-gap` | `var(--spacing-sm)` | actions gap |
| `--ui-content-footer-color` | `var(--ui-content-muted)` | footer color |
| `--ui-content-footer-fs` | `calc(var(--ui-content-fs) * 0.78)` | footer size |
| `--ui-content-footer-gap` | `var(--spacing-sm)` | footer gap |

Override per instance or globally:

```css
ui-content {
  --ui-content-gap: 1.25rem;
  --ui-content-eyebrow-color: hotpink;
}
```

---

## Examples

### Standalone

```html
<ui-content content="scl(lg) pad(md) gap(sm)">
  <small data-part="eyebrow">Guide</small>
  <h2 data-part="headline">Composing with content</h2>
  <p data-part="summary">A drop-in text column that styles its parts from one namespace.</p>
  <ul data-part="tags"><li>CSS</li><li>Primitive</li></ul>
</ui-content>
```

### Card body (flow content, full semantic tags)

```html
<ui-card content="scl(md) pad(lg) gap(sm)">
  <ui-media media="asr(16/9)"><img src="…" alt="…"></ui-media>
  <ui-content>
    <small data-part="eyebrow">Article</small>
    <h2 data-part="headline">The headline of the piece</h2>
    <p data-part="summary">A lede paragraph.</p>
    <address data-part="byline"><img src="…" alt=""> Jane Doe</address>
    <ul data-part="tags"><li>News</li><li>Design</li></ul>
  </ui-content>
</ui-card>
```

### Reveal `<summary>` (phrasing-only tags)

```html
<ui-reveal>
  <summary>
    <ui-content>
      <small data-part="eyebrow">Featured</small>
      <b data-part="headline">Trigger headline</b>
      <span data-part="summary">Teaser copy on the closed face.</span>
    </ui-content>
  </summary>
  <!-- panel below -->
</ui-reveal>
```

### Revealed panel (semantic tags)

```html
<!-- after </summary>, inside ::details-content -->
<ui-content content="gap(sm)">
  <small data-part="eyebrow">Featured</small>
  <h2 data-part="headline">Trigger headline</h2>
  <p data-part="summary">The full article copy with real headings and paragraphs.</p>
  <address data-part="byline"><img src="…" alt=""> Jane Doe</address>
</ui-content>
```

---

## Responsive

`md:` / `lg:` breakpoint prefixes are parsed inside `@container` against the host's queryable descendant (`cq-box` for `<ui-card>`, `<summary>` for `<ui-reveal>`); the resulting properties inherit down to `<ui-content>`.

**Responsive this round: `content=` *spacing* (`gap()`, `pad()`) and *size* (`scl()`, `hl(<size>)`):**

```html
<ui-content content="scl(md) lg:scl(lg) hl(md) lg:hl(3xl) gap(sm) md:gap(lg) pad(md) md:pad(lg)">…</ui-content>
```

```css
/* spacing lives in ui-card.css; SIZE lives in content.typography.css (source
   order vs the base size rules is load-bearing — see that file's header) */
@container (inline-size >= 25rem) {            /* md */
  :where([content~="md:gap(lg)"]) :is(cq-box, summary) { --ui-content-gap: var(--spacing-lg); }
  :where([content~="md:pad(lg)"]) :is(cq-box, summary) { --ui-content-p:   var(--spacing-lg); }
  :where([content~="md:scl(lg)"]) :is(cq-box, summary) { --ui-content-fs: var(--ui-content-fs-lg); --ui-content-headline: var(--ui-content-headline-lg); /* + re-points the tx/hl ladders */ }
  :where([content~="md:hl(3xl)"]) :is(cq-box, summary) { --ui-content-headline: var(--ui-content-hl-3xl, var(--ui-content-headline-3xl)); }
}
@container (inline-size >= 44rem) { /* lg — same shape */ }
```

Breakpoints: **md = 25rem, lg = 44rem**. `scl()` accepts `sm`/`md`/`lg`/`xl` prefixed; `hl(<size>)` accepts `sm`–`3xl`. Content **tone/weight** (`eb()`/`hl()`/`tx()`/`mt()` ink + weight), group **sizes** (`eb()`/`tx()`/`mt()` `sm`–`xl`) and `media=` tokens stay unprefixed — tone/weight would cost a rule per token × breakpoint and is deferred; group sizes don't need prefixes at all, since a responsive `scl()` shifts them via the relational ladder.

**Axis:** bare `scr` (alias `scr(y)`) is a **vertical** scrolling column with a top/bottom fade; **`scr(x)`** is a **horizontal** scrolling row (`flex-direction: row`, `overflow-x: auto`) with a left/right fade — handy for a strip of thumbnails, tags or chips that overflows the card. Both share the one `ui-scroll-fade` primitive; `scr(x)` just flips the mask direction (`--ui-scroll-fade-dir: to right`) and the scroll-timeline axis (`inline`). Cap the scroll extent with `--ui-content-scroll-bs` (block) as usual.

```html
<ui-content content="scr(x) gap(sm)">
  <ul data-part="tags"> … many pills … </ul>
</ui-content>
```

> **`scr` (content) vs `scr` (reveal):** `content="scr"` is the *content-column* scroll (scrollable text + `ui-scroll-fade` mask). `<ui-reveal>` has its **own** `scr` token on the host's `variant=` (the flip-panel / `lg:scl` panel scroll; it replaced the old `[scroll]` attribute) — that is a different mechanism on a different attribute. Don't conflate them.

---

## Accessibility

- **Use real semantic tags in flow contexts.** In a card body or revealed panel, use `<h2>`/`<h3>` for headlines, `<p>` for summaries, `<address>` for bylines, `<ul>` for tags. The `data-part` is for styling only — it does not replace semantics.
- **Mind heading levels.** `data-part="headline"` styles `h2`–`h6` identically; choose the level that fits the document outline, not the visual size.
- **Phrasing-only inside `<summary>`.** Flow elements are invalid there; use `<b>` / `<span>` / `<small>` with `data-part`. These carry no heading semantics, which is acceptable for a clickable trigger face — the real heading belongs in the revealed panel.
- **Decorative byline avatars** should use empty `alt=""`.

---

## Browser Support

All modern browsers.

| Feature | Support |
|---------|---------|
| Custom elements | All modern browsers |
| CSS custom properties / inheritance | All modern browsers |
| Container query units (`cqi`) | Chrome 105+, Firefox 110+, Safari 16+ |
| `color-mix()` (muted ink) | Chrome 111+, Firefox 113+, Safari 16.2+ |
| `text-box: cap alphabetic` (leading trim) | Chrome 133+ (progressive enhancement) |
| Scroll-driven `ui-scroll-fade` mask (`scr`) | Chrome 115+ (graceful fallback to a plain scroll) |
| `::details-content` (reveal panel styling) | Chrome 131+, with fallbacks |

Graceful degradation: where `cqi`/`color-mix()`/`text-box` are unavailable, the `clamp()` ramp resolves at its preferred value, the muted ink falls back to the inherited color, and leading-trim is simply skipped — the layout stays intact.
