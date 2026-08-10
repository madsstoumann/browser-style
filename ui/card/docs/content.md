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

`content=` is a compact attribute mini-language. Each modifier is a **3-letter code** with `()` arguments, plus one bare flag — `scr` (which also takes an axis arg). Every token simply writes a custom property, so an unsupported value is never a blocker — set the property directly via `style` (see *Arbitrary values*). (The old combined `ctr`/`end` bare flags are **removed** — use `plc()` for box placement and `tal()` for text alignment: `ctr` ≈ `plc(tc) tal(ctr)`, `end` ≈ `plc(te) tal(end)`.)

Argument vocabularies, the custom properties each token writes, and which tokens take the
`md:`/`lg:` container-query prefixes are **generated from `data/tokens.json`** — the manifest
`render.js` and `tokens.lint.js` read, so this inventory cannot drift from the CSS:

<!-- tokens:summary attr=content -->
| token | axis | args | aliases | bare | writes | md:/lg: | deprecated |
|---|---|---|---|---|---|---|---|
| `pad()` | padding | **size** none xs sm md lg xl 2xl | — | — | --ui-content-p | md: lg: (size) | — |
| `pb()` | padding | **size** none xs sm md lg xl 2xl | — | — | --ui-content-pb | md: lg: (size) | — |
| `pi()` | padding | **size** none xs sm md lg xl 2xl | — | — | --ui-content-pi | md: lg: (size) | — |
| `pbs()` | padding | **size** none xs sm md lg xl 2xl | — | — | --ui-content-pbs | md: lg: (size) | — |
| `pbe()` | padding | **size** none xs sm md lg xl 2xl | — | — | --ui-content-pbe | md: lg: (size) | — |
| `pis()` | padding | **size** none xs sm md lg xl 2xl | — | — | --ui-content-pis | md: lg: (size) | — |
| `pie()` | padding | **size** none xs sm md lg xl 2xl | — | — | --ui-content-pie | md: lg: (size) | — |
| `gap()` | spacing | **size** none xs sm md lg | — | — | --ui-content-gap | md: lg: (size) | — |
| `scl()` | type-scale | **size** sm md lg xl · **mode** fix fluid | — | — | --ui-content-fs --ui-content-headline --ui-content-tx-sm --ui-content-tx-md --ui-content-tx-lg --ui-content-tx-xl --ui-content-hl-sm --ui-content-hl-md --ui-content-hl-lg --ui-content-hl-xl --ui-content-hl-2xl --ui-content-hl-3xl --ui-content-fs-sm --ui-content-fs-md --ui-content-fs-lg --ui-content-fs-xl --ui-content-fs-2xl --ui-content-headline-sm --ui-content-headline-md --ui-content-headline-lg --ui-content-headline-xl --ui-content-headline-2xl --ui-content-headline-3xl | md: lg: (size) | — |
| `hl()` | type-group | **size** sm md lg xl 2xl 3xl · **tone** shr lgt med drk sld accent inv · **weight** 300 400 500 600 700 800 900 · **font** body head serif mono form · **flag** shd | — | — | --ui-content-heading-ink --ui-content-heading-weight --ui-content-heading-text-shadow --ui-content-heading-font --ui-content-headline | md: lg: (size) | — |
| `eb()` | type-group | **size** sm md lg xl · **tone** shr lgt med drk sld accent inv · **weight** 300 400 500 600 700 800 900 · **flag** flat shd | — | — | --ui-content-eyebrow-ink --ui-content-eyebrow-weight --ui-content-eyebrow-transform --ui-content-eyebrow-text-shadow --ui-content-eyebrow-fs | — | — |
| `tx()` | type-group | **size** sm md lg xl · **tone** shr lgt med drk sld accent inv · **weight** 300 400 500 600 700 800 900 · **flag** shd | — | — | --ui-content-body-ink --ui-content-body-weight --ui-content-body-text-shadow --ui-content-body-fs | — | — |
| `mt()` | type-group | **size** sm md lg xl · **tone** shr lgt med drk sld accent inv · **weight** 300 400 500 600 700 800 900 · **flag** shd | — | — | --ui-content-meta-ink --ui-content-meta-weight --ui-content-meta-text-shadow --ui-content-meta-base | — | — |
| `fnt()` | font | **font** body head serif mono form | — | — | --ui-content-font | — | — |
| `rds()` | corners | **size** non sm md lg xl 2xl full pill sm-sq md-sq lg-sq xl-sq | — | — | --ui-content-radius --ui-content-squircle-exp | — | — |
| `plc()` | placement | **pos** ts tc te cs cc ce bs bc be | — | — | --ui-content-place-block --ui-content-place-inline | — | — |
| `wid()` | measure | **size** sm md lg xl 2xl | — | — | --ui-content-max | — | — |
| `tal()` | alignment | **value** start ctr end | — | — | --ui-content-text-align | — | — |
| `scr()` | scroll | **value** x y | — | yes | --ui-scroll-fade-dir --ui-scroll-fade-start --ui-scroll-fade-end | — | — |
<!-- /tokens -->

What each one is *for*:

| Token | Controls | Responsive (`md:`/`lg:`) |
|-------|----------|--------------------------|
| `scl()` | master type-scale step — swaps the active body **and** headline stop AND re-points the relational size ladder (see *Relational scale*). `fix` switches every stop to the global static scale, `fluid` back to the `cqi` clamps (see *Static scale*) | steps **Yes** (modes No) |
| `hl()` | headings group — headline size (only, relational), ink, weight, **font**, gradient, shadow | size **Yes** |
| `fnt()` | container font family for the whole column (`--ui-content-font`) | No |
| `eb()` | eyebrow group — size (relational), ink, weight, drop uppercase (`flat`), shadow | No* |
| `tx()` | body group — size (relational), ink, weight, shadow (summary/quote/list/address/timeline/price/stat) | No* |
| `mt()` | meta group — size (relational), ink, weight, shadow (meta/caption/byline/footer/tags/rating/options) | No* |
| `pad()` | padding, **all sides** (`--ui-content-p`) | **Yes** |
| `pb()` `pi()` | padding, **one axis** — block / inline (`--ui-content-pb` / `-pi`) | **Yes** |
| `pbs()` `pbe()` `pis()` `pie()` | padding, **one side** — block-start / block-end / inline-start / inline-end | **Yes** |
| `rds()` | corners on a **standalone** `<ui-content>` (`--ui-content-radius`) | No |
| `gap()` | row gap between parts (`--ui-content-gap`) | **Yes** |
| `plc()` | 3×3 placement of the content rows inside the column's box — same nine logical cells as the furniture grid, via flex alignment (block letter → `justify-content`, inline letter → `align-items`; NOT absolute positioning). Sits under the `ovr()` slots, above `ctr`/`end` | No |
| `wid()` | text measure — caps each row's `max-inline-size`: `sm` 35ch · `md` 50ch · `lg` 65ch · `xl` 80ch · `2xl` 100%. No-token default = `--width-prose` (65ch); `scr(x)` rows exempt | No |
| `tal()` | explicit `text-align` — `start` (default) / `ctr` / `end`. Sits under the `ovr()` slot (like `plc()`): `content=` inherits freely, so a group-level `tal(ctr)` never overrides a nested overlay card's cell-derived alignment | No |
| `scr` / `scr(y)` / `scr(x)` | *(bare flag + axis arg)* scrollable content + shared `ui-scroll-fade` edge mask (`ui/base/scroll.css`). Bare `scr` = `scr(y)` = vertical column; `scr(x)` = horizontal row | No |

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

### Padding — seven tokens, one value set

Padding has three granularities. All seven tokens share the **same value set** — `none xs sm md lg xl 2xl` — and every one of them has `md:` and `lg:` forms.

| Granularity | Tokens | Writes |
|---|---|---|
| all sides | `pad()` | `--ui-content-p` |
| one axis | `pb()` block · `pi()` inline | `--ui-content-pb` / `--ui-content-pi` |
| one side | `pbs()` `pbe()` `pis()` `pie()` | `--ui-content-pbs` / `-pbe` / `-pis` / `-pie` |

The stems match the layout package's spacing vocabulary exactly (`pb pbs pbe pi pis pie`); only the value system differs — content uses the named `--spacing-*` steps, layout uses numeric multiples of its own unit.

#### Precedence: side beats axis beats all-sides

Precedence lives in the **`var()` chain**, not the cascade. Each of the four physical longhands resolves through its own three-step fallback:

```css
:where(ui-content) {
  padding-block-start:  var(--ui-content-pbs, var(--ui-content-pb, var(--ui-content-p, var(--spacing-md))));
  padding-block-end:    var(--ui-content-pbe, var(--ui-content-pb, var(--ui-content-p, var(--spacing-md))));
  padding-inline-start: var(--ui-content-pis, var(--ui-content-pi, var(--ui-content-p, var(--spacing-md))));
  padding-inline-end:   var(--ui-content-pie, var(--ui-content-pi, var(--ui-content-p, var(--spacing-md))));
}
```

Each token fills exactly **one slot**, and the slots have a fixed order. So:

```html
<ui-content content="pad(lg) lg:pbs(none)">…</ui-content>
```

At any width the four sides are `lg`. Once the card renders ≥ 44rem, `lg:pbs(none)` fills the `pbs` slot with `0` — the chain reaches `pbs` before `p`, so **block-start goes to 0 while the other three sides stay `lg`**. No ordering rule, no `!important`, no source-order dependency.

> **A breakpoint changes the VALUE in a slot; it never changes the slot order.** This is deliberately *unlike* CSS shorthand ordering. `content="pbs(sm) lg:pad(xl)"` keeps block-start at `sm` even at the `lg` tier, because the `pbs` slot is still filled. Predictable is the point: each of the seven tokens is its own independent override axis, which is what makes preset merging safe.

Because custom properties resolve per-side from the nearest declaring ancestor, the base token and the breakpoint token can even sit on **different elements** and still compose correctly.

`--ui-content-p` remains the all-sides slot, so every existing `pad()` token and the `style="--ui-content-p: …"` escape hatch keep working unchanged. A `padding` **shorthand** (as used by `lay-out-group`'s header reset and reveal's panel double-padding guard) resets all four longhands and therefore overrides the whole chain — that's intended.

### `rds()` — corners on a standalone `<ui-content>`

Inside a `<ui-card>` / `<ui-reveal>` the host owns the corners: it rounds itself and clips the inner areas through `overflow: hidden`, so media and content corners follow the arrangement. `rds()` on `content=` therefore targets the **standalone** case — a bare `<ui-content>` emitted as its own primitive (presets do this), which until this round had no token-level corners at all.

```
rds(sm)  rds(md)  rds(lg)  rds(xl)  rds(2xl)  rds(full)  rds(pill)   rds(non)
rds(sm-sq)  rds(md-sq)  rds(lg-sq)  rds(xl-sq)       ← squircle (superellipse corner-shape)
```

Same scale as `variant="rds()"` on the card and `media="rds()"` on a standalone frame — the values come from the global `--radius-*` / `--radius-*-sq` / `--squircle-*` tokens in `@browser.style/base`, so all three stay in lock-step.

> **Corners need a background to be visible.** `--ui-content-radius` defaults to `0` and is inert inside a card, because `<ui-content>` paints no background *until you give it one*. The canonical way is **`theme=`** — `<ui-content theme="gray" content="rds(lg)">` is a rounded plate (see [Theme surface](#theme-surface)); `style="background: …"` or a utility class work too. Rounding a transparent box is a no-op.

`rds()` is substring-matched (like the card's and media's), which is safe here because it has no `md:`/`lg:` forms to shadow and `rds(sm)` is not a substring of `rds(sm-sq)`. The old `rds(none)` spelling was **removed in v5** on all three attributes — `rds(non)` is the only spelling.

### Arbitrary values (escape hatch)

The `()` tokens are *sugar* — each rule just writes a custom property. For any value not in the token list, set the property directly:

```html
<ui-content style="--ui-content-gap: 1.25rem; --ui-content-p: 2.5rem;">…</ui-content>
```

Because the padding chain reads four separate slots, the escape hatch works per-side too: `style="--ui-content-pis: 3ch"` indents only the inline-start edge and leaves `pad()` governing the rest.

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

Plus flags: **`eb(flat)`** drops the eyebrow's default uppercase; **`shd`** on any family (`hl(shd)` `eb(shd)` `tx(shd)` `mt(shd)`) adds a legibility **text-shadow** to that group.

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

Escape hatch: set `--ui-content-font` (column) or `--ui-content-heading-font` (headline) directly via `style` for any family not in the token set. Live demo: [content.typography.html](../demo/content.typography.html).

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
| `quote` | `<ui-quote data-part="quote">` wrapping `<blockquote>` | **Body group** — indented; composes with `@browser.style/quote` via `variant` |
| `rating` | `<div data-part="rating">` | **Meta group** — inline star row + count |
| `options` | `<ul data-part="options">` | **Meta group** — poll / comparison rows with `<progress>` |

Bare headings (`h2`–`h6`) are styled identically to `data-part="headline"` as a convenience, so plain semantic markup just works.

Each part keeps its own `--ui-content-{part}-*` token(s) (see *Tokens*) for future per-part typography knobs.

### Structured parts — microdata scope + who uses them

The eight later parts each carry a schema.org scope and were added for specific content
types (conventions in [card.md § Microdata](card.md#microdata-conventions)). The CSS keeps
only structural essentials — visuals stay token-driven.

| Part | Markup | Microdata | Used by |
|---|---|---|---|
| `price` | `<p>` + `<data>` current, `<del>` original, `<small>` discount | `Offer` / `PriceSpecification` / `MonetaryAmount` | product, course, booking, membership, software, job (salary) |
| `rating` | `<div>` + `<input class="ui-rating" disabled aria-hidden>` masked stars, `[data-sr]` full label, visible `<span aria-hidden>` count | `AggregateRating` / `Rating` | product, review, software |
| `list` | `<ul>` check-list / `<ol>` ordered | — | recipe, job, course, booking, location, membership |
| `address` | `<address>` block (no avatar — that's `byline`) | `PostalAddress` | business, location, event, contact |
| `stat` | `<p>` + `<data>` number, `<small>` unit, trend `<span>` | `QuantitativeValue` | statistic |
| `timeline` | `<ol>` of `<li>` with `<time>` + text | `subEvent` → `Event` | timeline |
| `quote` | `<ui-quote variant>` wrapping `<blockquote>` + `<q>`/`<cite>` | — | quote (`bigquote`), review + social (plain) |
| `options` | `<ul>` of `<li>` with `<label>` + `<progress>` | `suggestedAnswer` → `Answer` / `ListItem` | poll, comparison |

`quote` composes with `@browser.style/quote`: `variant` on the `<ui-quote>` wrapper
(`bigquote` / `breaker` / `code`) carries the visual style from `ui-quote.css`, and the
card-side hook is for card-scoped overrides only.

In rendered cards the wrapper's variant is **preset-authored**: the preset's
`parts.quote` value is written verbatim to the emitted `<ui-quote>` (the quote type
defaults to `bigquote`, review/social to none), and `parts.accordion` does the same
for the `<ui-accordion>` emitted by faq/recipe/job. `byline` avatars render through
`@browser.style/avatar` (`<ui-avatar>` with an `<abbr>` initials fallback — the card
sets no avatar styling at all; size it with the component's own `size=` attribute or
`--ui-avatar-size`), and the `options`
part's bare `<progress>` is styled by `@browser.style/progress`. See card.md
§ Sub-components for the full mapping and the deliberate non-goals (`rating` stays
hand-rolled until a v4 `ui-rating` display rewrite exists; `timeline` stays card-local).

### Tags — plain links or `<ui-chip>`

`data-part="tags"` hosts two kinds of child, and they compose in the same container:

- **`<ui-chip>` children** — the canonical form and the `render.js` output: `<span data-part="tags"><ui-chip itemprop="keywords">Tag</ui-chip>…</span>` (flat — no `<ul>`/`<li>`; `keywords`, or `knowsAbout` on Person). A **bare `<ui-chip>` is the default grey pill**, sized to the tag row (the card sets `--ui-chip-font-size`/`-padding-*` to the pill metrics); add `theme=`, `variant="light"`/`"outline"`, `size=`, `radius=`, `fill=` for the options. A linked tag wraps the anchor: `<ui-chip itemprop="keywords"><a href="…">Tag</a></ui-chip>` — the itemprop stays **on the chip** (microdata value = textContent), so the href never leaks into the extracted keyword.
- **Plain links** — `<li><a href="…">Tag</a></li>` or direct `<a>` children render as the built-in **pill fallback** (`--ui-content-tag-bg` / `-color` / `-radius` / `-padding`). Hand-authored lists keep working; `<li>` wrappers dissolve via `display: contents` (scoped to `li` only — a direct-child chip keeps its box).

The bespoke pill is scoped to `& a:not(ui-chip *)`, so it never leaks onto a chip's own `<a>` — a `<ui-chip>` always styles itself. Mixing both in one container is fine.

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

> The `cqi` unit measures against the nearest **query container**. Inside `<ui-card>` / `<ui-reveal>` the host is that container, so the ramp is fluid with no extra markup. Standalone, drop `<ui-content>` inside an element with `container-type: inline-size` to get the same behaviour.
>
> **With no container, `cqi` does not "fall back to the preferred value".** Per spec a container-relative unit with no query container resolves against the **small viewport size** — `1cqi` becomes `1svi`. The `clamp()` still evaluates normally; its middle term is just measured against the viewport instead of the card. On a wide screen that pushes the ramp toward its `max`; in a narrow column it will *not* shrink, because the column isn't what's being measured. That's the practical reason to wrap a standalone `<ui-content>`.

If the standalone element also needs the `md:`/`lg:` tiers, name that wrapper `bs-card` and it does both jobs at once:

```html
<div style="container: bs-card / inline-size">
  <ui-content content="scl(md) lg:scl(xl) pad(lg) lg:pbs(none)">…</ui-content>
</div>
```

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

## Theme surface

`<ui-content>` is itself a consumer of the shared `theme=` axis
([base/theme.md](../../base/theme.md)): put `theme=` on the element and it paints the
resolved surface, with surface ink (`--color-text`, re-toned by `light`/`dark`
through `color-scheme`; add `ink` for the theme's paired ink).

```html
<ui-content theme="gray" content="rds(lg) pad(lg)">…</ui-content>   <!-- standalone plate -->
```

Two things this unlocks: `rds()` finally has a background to round, and a
`<ui-reveal>` **flipside** can carry its own colour independent of the card's front
face — see [Two sides, two themes](../../reveal/readme.md#two-sides-two-themes).

Inside an `ovr()` card, a themed `<ui-content>` overlay becomes a solid/translucent
**plate** over the media (`theme="black muted"`) rather than a scrim-lit column: the
theme's ink replaces the overlay's `--ui-content-ov-ink` white, which is what a plate
wants. Leave `theme=` off to keep the scrim treatment.

## Theme ink

Host themes come from the shared `theme=` axis ([base/theme.md](../../base/theme.md)) and set the card surface; the neutrals ramp **`white` < `gray` < `slate` < `black`**. Adding the `dark` modifier (`theme="slate dark"`, `theme="black dark"`) flips `color-scheme: dark` so the muted / eyebrow / tag ink and controls re-tone automatically (the ink ramp derives from `currentColor`, so most parts follow with no explicit write). Where a theme sets ink explicitly, those tokens live on `<ui-content>`, not on the card:

| Token | Read by | Themed by |
|-------|---------|-----------|
| `--ui-content-muted` | subheadline, meta, caption, byline, footer | theme |
| `--ui-content-eyebrow-ink` | eyebrow | theme |
| `--ui-content-tag-bg` | tags pills | theme |

```css
:where([theme~="black"]) {
  --ui-content-muted: color-mix(in oklab, currentColor 60%, transparent);
  --ui-content-tag-bg: rgb(255 255 255 / 0.12);
}
```

> **Namespace trap:** the legacy tokens were `--ui-card-muted` / `--ui-card-eyebrow-color` / `--ui-card-tag-bg`. In v4 they move to the `--ui-content-*` spelling. A theme rule that still writes the old `--ui-card-*` names will silently lose its muted / eyebrow / tag remap.

> **`-color` → `-ink` rename (aliases REMOVED in v5):** per-part ink hooks are spelled
> `--ui-content-{part}-ink` (house term for text colour, cf. `--ui-content-ov-ink`). The old
> `--ui-content-{part}-color` names used to ride along as a second slot in each part's `var()`
> chain; that slot is **gone** — `-ink` is the only ink hook. Seven author-facing custom
> properties stopped resolving: `--ui-content-eyebrow-color`, `--ui-content-subheadline-color`,
> `--ui-content-summary-color`, `--ui-content-meta-color`, `--ui-content-byline-color`,
> `--ui-content-footer-color`, `--ui-content-rating-color`. Rename each to `-ink`. (Unrelated
> and untouched: `--ui-content-tag-color`, which is a pill fill hook, not an alias.)

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
| `--ui-content-eyebrow-ink` | `var(--color-accent)` | eyebrow ink |
| `--ui-content-eyebrow-fs` | `calc(var(--ui-content-fs) * 0.78)` | eyebrow size |
| `--ui-content-eyebrow-weight` | `var(--font-weight-medium, 500)` | eyebrow weight |
| `--ui-content-headline-weight` | `var(--font-weight-bold, 700)` | headline weight |
| `--ui-content-headline-line-height` | `calc(1em + 0.25rem)` | headline line-height (constant-leading formula — see below) |
| `--ui-content-headline-rhythm` | `0.25em` | space after the headline (modular em rhythm — see below) |
| `--ui-content-subheadline-ink` | `var(--ui-content-muted)` | subheadline ink |
| `--ui-content-subheadline-fs` | `calc(var(--ui-content-fs) * 0.88)` | subheadline size |
| `--ui-content-subheadline-weight` | `var(--font-weight-normal, 400)` | subheadline weight |
| `--ui-content-summary-ink` | `inherit` | summary ink |
| `--ui-content-summary-fs` | `var(--ui-content-fs)` | summary size |
| `--ui-content-summary-clamp` | `none` | teaser truncation — set a line count (e.g. `3`) to clamp the summary. Unset means no clamp; the flex-box formatting context and `overflow: hidden` only switch on for cards that set it |
| `--ui-content-meta-ink` | `var(--ui-content-muted)` | meta / caption ink |
| `--ui-content-meta-fs` | `calc(var(--ui-content-fs) * 0.75)` | meta / caption size |
| `--ui-content-byline-fs` | `calc(var(--ui-content-fs) * 0.82)` | byline size |
| `--ui-content-byline-gap` | `var(--spacing-sm)` | byline gap |
| `--ui-content-tags-fs` | `calc(var(--ui-content-fs) * 0.72)` | tags size |
| `--ui-content-tags-gap` | `var(--spacing-xs, 0.35rem)` | tags gap |
| `--ui-content-tag-bg` | `var(--color-button, hsl(0, 0%, 90%))` | tag pill background |
| `--ui-content-tag-color` | `inherit` | tag pill text |
| `--ui-content-tag-radius` | `var(--radius-pill, 100px)` | tag pill corner radius — set to `0` (or a small radius) for square tags |
| `--ui-content-tag-padding` | `0.2em 0.7em` | tag pill padding (label is centered via `place-content`) |
| `--ui-content-actions-gap` | `var(--spacing-sm)` | actions gap |
| `--ui-content-footer-ink` | `var(--ui-content-muted)` | footer ink |
| `--ui-content-footer-fs` | `calc(var(--ui-content-fs) * 0.78)` | footer size |
| `--ui-content-footer-gap` | `var(--spacing-sm)` | footer gap |

Override per instance or globally:

```css
ui-content {
  --ui-content-gap: 1.25rem;
  --ui-content-eyebrow-ink: hotpink;
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

Breakpoints: **md = 25rem, lg = 44rem** — the card's own rendered width, not the viewport. Every size query is **named**: `@container bs-card (…)`.

**Responsive this round: `content=` *spacing* (`gap()` + all seven padding tokens) and *size* (`scl()`, `hl(<size>)`):**

```html
<ui-content content="scl(md) lg:scl(lg) hl(md) lg:hl(3xl) gap(sm) md:gap(lg) pad(md) md:pad(lg) lg:pbs(none)">…</ui-content>
```

### Two arms — the attribute can sit on the primitive or the host

Every responsive `content=` rule ships **two** selectors:

```css
/* spacing lives in ui-card.css; SIZE lives in content.typography.css (source
   order vs the base size rules is load-bearing — see that file's header) */
@container bs-card (inline-size >= 25rem) {                              /* md */
  /*                    host arm                          self arm                          */
  :where([content~="md:gap(lg)"]) :is(cq-box, summary), :where(ui-content[content~="md:gap(lg)"]) { --ui-content-gap: var(--spacing-lg); }
  :where([content~="md:pad(lg)"]) :is(cq-box, summary), :where(ui-content[content~="md:pad(lg)"]) { --ui-content-p:   var(--spacing-lg); }
  :where([content~="md:pbs(none)"]) :is(cq-box, summary), :where(ui-content[content~="md:pbs(none)"]) { --ui-content-pbs: 0; }
  :where([content~="md:scl(lg)"]) :is(cq-box, summary), :where(ui-content[content~="md:scl(lg)"]) { --ui-content-fs: var(--ui-content-fs-lg); --ui-content-headline: var(--ui-content-headline-lg); /* + re-points the tx/hl ladders */ }
}
@container bs-card (inline-size >= 44rem) { /* lg — same shape */ }
```

- **Host arm** — the attribute sits on `<ui-card>`/`<ui-reveal>`/`<lay-out-group>` and the rule targets the queryable descendant (`cq-box` in a card, `summary` in a reveal). The properties then inherit down to `<ui-content>`.
- **Self arm** — the attribute sits on the `<ui-content>` itself. This is the **renderer's canonical placement**. Nearest-wins keeps precedence right: a declaration on the primitive beats the one it would otherwise inherit from `cq-box`.

`variant=` deliberately gets **no** self arm — it arranges the two children, so it belongs on the host by nature.

### Container-query support matrix

| Context | Is a `bs-card` container? | `md:`/`lg:` `content=` works? |
|---|---|---|
| `<ui-card>` | yes (`container: bs-card / inline-size`) | yes — both arms |
| `<ui-reveal>` | yes (own `container-type`, name declared in `ui-card.css`) | yes — both arms; queryable descendant is `<summary>` |
| `<lay-out-group>` | **yes, new this round** | yes — self arm directly; for the attribute *on the group*, wrap the header in `<cq-box>` |
| `<lay-out>` | **no** — deliberately not a container | n/a (cards inside it keep their own query root) |
| standalone `<ui-content>` | no | **opt in** with a `bs-card`-named wrapper |

The queries are named on purpose. An *unnamed* size query resolves against the subject's nearest size container, so a self-armed `<ui-content>` standing outside a card could switch tiers off an unrelated ancestor's width. With the name, only the three container elements above match — and a standalone primitive opts in deliberately:

```html
<div style="container: bs-card / inline-size">
  <ui-content content="pad(md) lg:pad(2xl)">…</ui-content>
</div>
```

### `lay-out-group` headers

`lay-out-group` now declares `container-name: bs-card; container-type: inline-size`, so a group header supports the full `md:`/`lg:` `content=` vocabulary. Two equivalent paths — prefer the first:

```html
<!-- self arm: no extra markup -->
<lay-out-group>
  <ui-content content="pad(md) lg:pbs(none) lg:hl(3xl)">…</ui-content>
  <lay-out md="columns(2)">…</lay-out>
</lay-out-group>

<!-- attribute on the group: needs the queryable descendant -->
<lay-out-group content="pad(md) lg:pbs(none)">
  <cq-box><ui-content>…</ui-content></cq-box>
  <lay-out md="columns(2)">…</lay-out>
</lay-out-group>
```

A group is viewport-wide, so the card-scale thresholds (25rem / 44rem) act as a mobile/desktop switch for headers — which is what a section header usually wants. Declarations made on the group (or its `cq-box`) inherit into the nested `<lay-out>`'s cards too; a card's own nearer declaration wins, per the ladder's nearest-host-wins design.

> **Group headers ride the relational ladder too.** A base **size** token (`hl(2xl)`, `tx(lg)`, …) reads its ladder var (`--ui-content-hl-2xl`) rather than the absolute stop, and a responsive `md:`/`lg:` `scl()` re-points that var on the queryable descendant. So the base size rules ship a second declaration on the descendant, or the token would resolve its ladder var from *above* the breakpoint rule and stay fixed. That second declaration used to cover `<ui-card>`'s `<cq-box>` and `<ui-reveal>`'s `<summary>` only — it now covers **`lay-out-group`** as well. `<lay-out-group content="scl(md) lg:scl(xl) hl(2xl)">` therefore steps its header exactly the way the identical tokens step inside a card; before this round the `hl(2xl)` stayed pinned to the base stop while the body copy moved.

### Canonical placement

`render.js` emits `content=` **on the `<ui-content>`** and `media=` on the `<ui-media>`; `variant=` and `theme=` stay on the host. Hand-authored HTML keeps working with the attribute on the host or any ancestor — **ancestor placement remains the bulk-config mechanism**, and is the right tool when one declaration should govern a whole section of cards.

### What is still unprefixed

Content **tone/weight** (`eb()`/`hl()`/`tx()`/`mt()` ink + weight), group **sizes** (`eb()`/`tx()`/`mt()` `sm`–`xl`), `fnt()`, `plc()`, `wid()`, `tal()`, `scr` and `rds()` have no `md:`/`lg:` forms. Tone/weight would cost a rule per token × tier × arm and is deferred; group sizes don't need prefixes at all, since a responsive `scl()` shifts them via the relational ladder. On the `media=` side only `asr()` is prefixable — see [media.md](./media.md#responsive).

**Axis:** bare `scr` (alias `scr(y)`) is a **vertical** scrolling column with a top/bottom fade; **`scr(x)`** is a **horizontal** scrolling row (`flex-direction: row`, `overflow-x: auto`) with a start/end fade — handy for a strip of thumbnails, tags or chips that overflows the card. Both drive the one scroll-edge-fade engine; `scr(x)` just flips the mask direction (`--ui-scroll-fade-dir: to var(--_dir-e)`, so it **mirrors under `dir="rtl"`**) and the timeline axis (`scroll(self inline)`). Cap the scroll extent with `--ui-content-scroll-bs` (block) as usual.

```html
<ui-content content="scr(x) gap(sm)">
  <ul data-part="tags"> … many pills … </ul>
</ui-content>
```

> **`scr` (content) vs `scr` (reveal):** `content="scr"` is the *content-column* scroll (scrollable text + `ui-scroll-fade` mask). `<ui-reveal>` has its **own** `scr` token on the host's `variant=` (the `flp` flip-panel / `grw` — or `lg:grw` — grow-morph panel scroll; it replaced the old `[scroll]` attribute) — that is a different mechanism on a different attribute. Don't conflate them.

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

---

## Internals (`content.css`, `content.typography.css`)

> The *why* behind the two sheets. These sections used to live as essay-length
> comment blocks in the CSS; the files keep one-line pointers back here plus the
> guardrail markers a future editor must not delete.

### Why the type layer is its own file

`content.typography.css` owns the scale stops, the master step `scl()`, the relational
ladders, the four styling groups (`eb`/`hl`/`tx`/`mt`) and `fnt()`. `content.css` keeps
spacing, container, scroll and the parts, and reads the group base props written over there
(`--ui-content-body-fs` for Body, `--ui-content-meta-base` for Meta). The split means a
standalone `<ui-content>` consumer gets the **whole** responsive type system from one file.

### Source order is load-bearing

Everything in the type layer is `:where()` — zero specificity on the host form, and the
`:is(cq-box, summary)` descendant forms all tie — so the cascade is decided purely by
**order within the file**:

```
base scl()  <  md:scl()  <  lg:scl()  <  base hl()  <  md:hl()  <  lg:hl()
```

`scl()` writes `--ui-content-headline` directly (the master default), and an explicit
`hl(<size>)` must beat it at **every** breakpoint. That is exactly why the responsive
`scl()`/`hl()` rules live in this file rather than with the other responsive tokens in
`ui-card.css`, and why the `hl()` block sits after every `scl()` form. Moving either
silently changes which one wins at a tier.

### Dual-declared size tokens, and why the `>` matters

Size tokens are declared **twice** — on the token host *and* on the host's own queryable
descendant:

```
ui-card[content]       > cq-box
lay-out-group[content] > cq-box
ui-reveal[content]     > details > summary
```

`var()` substitution happens where a custom property is **declared**, so only a
re-declaration on `cq-box`/`summary` can pick up a responsive `md:`/`lg:` `scl()` ladder
remap made there.

The `>` is deliberate: the dual declaration is scoped to the host's **own** box, not the
broad `:is(cq-box, summary)` the `md:`/`lg:` rules use. Without it, a size token on an outer
group would reach into nested cards and beat their nearer `scl()`/size declarations —
breaking nearest-host-wins.

The **`lay-out-group` arm** exists because a group is a `bs-card` container too (R-16,
`layout/core/group.css`) and takes the same `content=` tokens on the attribute-on-group
authoring shape (`<lay-out-group content> > <cq-box>`). Without it, a group header's
`md:`/`lg:` `scl()` ladder remapped on the `cq-box` while its `hl()`/`eb()`/`tx()`/`mt()`
size stayed resolved against the base ladder on the host — the header size simply never
moved with the responsive step.

The `md:`/`lg:` size queries are **named** (`bs-card`) for the same F-42 reason as the rest
of the system: a self-armed standalone primitive must never resolve its tiers against an
unrelated ancestor container.

### `scl(fix)` — the static stop mapping

`scl(fix)` re-points every stop from its fluid `cqi` clamp to the global static scale
(`--font-size-*` in `ui/base/tokens.css`):

| | sm | md | lg | xl | 2xl | 3xl |
|---|---|---|---|---|---|---|
| body | `sm` | `base` | `lg` | `xl` | `2xl` | — |
| headline | `xl` | `2xl` | `3xl` | `5xl` | `6xl` | `7xl` |

The headline `3xl→5xl` skip mirrors the fluid ramp's own big `lg→xl` jump. Because
`scl()`/`hl()`/the ladder are pure indirection through the stop vars, *everything* still
works — steps, relational shifting, `md:`/`lg:` jumps — just between static sizes.

**The one specificity exception in the file.** The stop-definition rule matches every
`ui-content`/`[content]` element, so `fix` must also re-declare on descendants — and its
**self** form must match the descendant form's `(0,1,0)`, hence `:is()` rather than
`:where()`. Otherwise a nested host's own mode token would lose to an ancestor's descendant
rule on the host element itself. `scl(fluid)` comes after `fix` in source, so on a tie fluid
wins — an explicit `scl(fluid)` cannot be re-fixed further down. Neither is `md:`/`lg:`
prefixable: they are **modes**, not steps. Both write only stop vars, so they never collide
with the `(0,0,1)` size rules.

### The four styling groups

Each group has a family token writing a group-level prop. A part reads its own
`--ui-content-{part}-X`, then the group `--ui-content-{group}-X`, then a default — so a group
token restyles the whole group while a per-part `style=` still overrides one part.

| Group | Token | Parts |
|---|---|---|
| Eyebrow | `eb()` | eyebrow |
| Headings | `hl()` | headline (+ bare `h2`–`h6`), subheadline |
| Body | `tx()` | summary, quote, list, address, timeline, price, stat |
| Meta | `mt()` | meta, caption, byline, footer, tags, rating, options |

Four **disjoint** arg vocabularies, so whole-token matching can never confuse them: tone
(`shr lgt med drk sld accent inv`), size (`sm md lg xl`, plus `2xl 3xl` on `hl`), weight
(`300`–`900`), plus the flag `eb(flat)` (drops uppercase). Size args read the ladder
with an absolute fallback — fixed without `scl()`,
shifted with it.

`scl(md)` writes the identity ladder **explicitly**, so a nested `scl(md)` resets an
ancestor's shifted ladder. Ladder values inherit as unresolved token streams (`clamp()` is
not evaluated inside custom properties), so they re-resolve wherever a size token
re-declares.

### Headline rhythm is mathematical

The headline defaults hold from `sm` to poster without a per-size table:

- `line-height: calc(1em + 0.25rem)` — a **constant-leading** formula. The extra leading is a
  fixed `0.25rem` whatever the size, so the *ratio* tightens as the type grows (md 1.75rem →
  1.14; poster ~110px → ~1.04; asymptote → 1.0).
- `margin-block-end: 0.25em` — **modular** rhythm: the space after the heading scales with
  the heading's own em.

This rule carries attribute/type specificity, so it wins over the container's
`& > * { margin: 0 }` reset at `(0,0,0)`. Both vars stay overridable.

### `plc()` is flex alignment, not positioning

`plc(<cell>)` uses the same nine logical cells as the media-furniture grid, but it is **not**
absolute positioning: the block letter drives `justify-content` (the flex column's main axis
— visible only when the column is taller than its rows, e.g. a row card beside `asr(1/1)`
media) and the inline letter drives `align-items`. `ovr()` placement
(`--ui-content-ov-*`) stays in charge in overlay mode, and `plc()` never touches
`text-align` — that is `tal()`.

`wid()`'s cap rides the **rows**, not the column box (`& > * { max-inline-size: … }`), so
`plc()`'s inline letter can still place the capped rows within the column.

### Padding: the precedence lives in the `var()` chain

Four longhands, each resolving side → axis → all-sides:

```css
padding-block-start: var(--ui-content-pbs, var(--ui-content-pb, var(--ui-content-p, var(--spacing-md))));
```

Precedence is therefore **not** cascade-based: whichever slot is filled nearest the front of
the chain wins, whatever order the tokens were written in and whichever element declared
them. That is what makes the seven padding stems compose in any order and at any breakpoint
— see *Precedence: side beats axis beats all-sides* above. The stems match `/layout`'s
spacing tokens (`p`/`pi`/`pb`/`pbs`/`pbe`/…) — same names, named `--spacing-*` steps instead
of layout's numeric unit multiples. All are whole-token (`~=`) matched so the base rules
never substring-match the `md:`/`lg:` forms declared in `ui-card.css`.

### `scr` drives the shared scroll-edge-fade engine

`content="scr"` / `scr(y)` scroll the block axis (`scr` is the back-compat default);
`scr(x)` scrolls the inline axis as a row. The `@property` registrations, the
`ui-scroll-fade-s` / `ui-scroll-fade-e` keyframes and the `--ui-scroll-fade-mask` gradient are
**not** defined here — they are the shared engine in `ui/base/scroll.css`, also driven by
`<ui-reveal variant="scr">` and `<lay-out overflow="fade*">`; the mask direction follows
`--ui-scroll-fade-dir`. Whole-token matched so `scr`, `scr(x)` and `scr(y)` stay distinct.

**Four declarations, and their order is load-bearing.** Each arm inside the
`@supports (animation-timeline: scroll())` + `prefers-reduced-motion` gate reads:

```css
animation: ui-scroll-fade-s both linear, ui-scroll-fade-e both linear;
animation-timeline: scroll(self block);   /* scroll(self inline) for scr(x) */
animation-range: 0 var(--ui-scroll-fade-ramp-s), calc(100% - var(--ui-scroll-fade-ramp-e)) 100%;
mask: var(--ui-scroll-fade-mask);
```

`animation-timeline` and `animation-range-*` **must follow** the `animation` shorthand — the
shorthand resets both, so putting either first silently drops it. Two keyframes rather than
one because the per-edge ramp now rides `animation-range` instead of plateau keyframe stops
(`0 10%` + `both` fill is equivalent to the old `0%` / `10%,100%` plateau), and because the
two animations must write **disjoint** properties or they would compete for one value.

**Why the axis is spelled out twice.** `scr`/`scr(y)` and `scr(x)` cannot share one rule: a
`var()` is not allowed inside `scroll()`, so the axis has to be a literal. Every consumer's
axis is a compile-time constant anyway, which is what let the old **named** scroll timelines
(`--ui-scroll`, `--ui-reveal-scroll`) go away — `scroll(self …)` needs no name and no
`scroll-timeline` declaration on the scroller.

**Knobs are per-scroller, by design.** All eight engine properties are registered
`inherits: false`, so `--ui-scroll-fade-size-s`/`-e` (edge width, default `3rem`) and
`--ui-scroll-fade-ramp-s`/`-e` (how much scroll the ramp spans, default `10%`) must be set
**on the scrolling element itself** — setting them on `<ui-card>` or any other ancestor has
no effect. That is deliberate: it is what stops a `<lay-out overflow="fade">` carousel from
leaking its `100px` edge into a `content="scr"` column nested inside one of its slides.

`scr(x)` needs its children to refuse to shrink or wrap — `row nowrap` on the container,
`flex: 0 0 auto` on the items, `nowrap` text — or they reflow to fit instead of overflowing.
Its `tags` override is declared **after** the tags part rule so the `nowrap` wins at equal
specificity; a horizontal strip must not wrap, and pills/chips must hold their width.

### Tags: bespoke pill as the fallback

A tag can be a plain link (styled as the bespoke pill) **or** a `<ui-chip>` child, which
styles itself via `ui-chip.css` and unlocks the full chip colour palette and variants. The
bespoke pill is the **fallback**, scoped to links *not* inside a `<ui-chip>` so it never
leaks onto the chip's own `<a>`. The container font-size joins the Meta group; pill ink
stays pill-driven (`--ui-content-tag-color`), since it sits on a fill.

Graceful degradation: the muted ink falls back to the inherited color where `color-mix()` is unavailable, and leading-trim is simply skipped without `text-box` — the layout stays intact either way.

`cqi` has **two** distinct fallback stories, and only the first is about support:

- **Where container query units are unsupported** the whole `clamp()` term is invalid at computed-value time, so the declaration is dropped and the part renders at its inherited/UA size. Every ramp stop is still a plain custom property, so `style="--ui-content-fs: 1rem"` (or `scl(fix)`, which re-points every stop at the static `--font-size-*` scale) gives those browsers exact sizes.
- **Where `cqi` is supported but there is no query container** — a standalone `<ui-content>` outside a card — the unit is perfectly valid and resolves against the **small viewport**: `1cqi` = `1svi`. The clamp evaluates normally, just measured against the viewport instead of the column, which pushes the ramp toward its `max` on a wide screen and will *not* shrink in a narrow column. See the note under *Typography ramp*; the fix is a `container-type: inline-size` wrapper, not a fallback.
