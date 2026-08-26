# `ui-card` — Design Tokens

`<ui-card>` is the **composition layer** over two primitives:

- `<ui-media>` — the media frame, carousel, scrim, and overlay furniture. Its `media=` DSL and `--ui-media-*` tokens are documented in **[media.md](media.md)**.
- `<ui-content>` — the text column and its parts. Its `content=` DSL and `--ui-content-*` tokens are documented in **[content.md](content.md)**.

This file covers only the **card-level** tokens: the host surface, the media↔content arrangement (`variant=`), the overlay bridge (`ovr()`), the shared theme axis (`theme=`, see [base/theme.md](../../base/theme.md)), and corners (`rds()`). Every value is a CSS custom property with a built-in fallback, so override only what you need:

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
| `--ui-card-bg` | `var(--color-surface)` | card background (also set by `theme=`) |
| `--ui-card-radius` | `var(--radius-2xl)` | corner radius (set with `rds()`) |
| `--ui-card-shadow` | `var(--shadow-xl)` | card shadow |

The card is `display: grid` + `container-type: inline-size` + `overflow: hidden`. Children are wrapped in a `<cq-box>` (the queryable descendant for container queries); its grid columns come from `--ui-card-cols`.

`--ui-card-bg` is a `light-dark()` pair — light arm the normal surface, dark arm the card's own slate (`--ui-card-dark-bg`). Because the *default* is already a pair, a card theme only has to flip `color-scheme`, which is what `theme="black dark"` does.

## Arrangement — `variant=`

The `variant=` string composes the media and content primitives. Tokens are **whole-token** matched (`~=`), so `md:`/`lg:` prefixes don't collide with the base form.

The full `variant=` inventory — every token, its argument vocabulary, its deprecated
spellings, the properties it writes and which tokens take a `md:`/`lg:` prefix — is
**generated from `data/tokens.json`**, the manifest `render.js` and `tokens.lint.js` read.
The reveal-only tokens (`exp`, `flp()`, `sld()`, `grw()`, `ico()`, …) are in the same
attribute and therefore the same table; they are explained under *Reveal tokens* below.

<!-- tokens:summary attr=variant -->
| token | axis | args | aliases | bare | writes | md:/lg: | deprecated |
|---|---|---|---|---|---|---|---|
| `rds()` | corners | **size** non sm md lg xl 2xl full pill sm-sq md-sq lg-sq xl-sq | — | — | --ui-card-radius --ui-card-squircle-exp | — | — |
| `shd()` | elevation | **size** non sm md lg xl | — | — | --ui-card-shadow | — | — |
| `bdr()` | border | **size** sm md lg · **tone** lgt drk | — | yes | --ui-card-border-width --ui-card-border-color | — | — |
| `spl()` | split | **ratio** 1/1 1/2 2/1 1/3 3/1 | — | — | --ui-card-split | md: lg: (ratio) | — |
| `vis()` | visibility | **value** media content | — | — | — | md: lg: (value) | — |
| `ovr()` | overlay | **pos** ts tc te cs cc ce bs bc be | — | — | --ui-card-stack --ui-content-ov-ink --ui-content-ov-z --ui-content-heading-text-shadow --ui-content-eyebrow-text-shadow --ui-content-ov-justify --ui-content-ov-align --ui-content-ov-text --ui-media-scrim-default | — | — |
| `flp()` | reveal-animation | **pos** top btm lft rgt | — | yes | --_rvl --_face-closed --_face-open --_panel-closed --_panel-open --ui-reveal-icon-clear | — | — |
| `sld()` | reveal-animation | **pos** top btm lft rgt | — | yes | --_rvl | — | — |
| `grw()` | reveal-animation | **pos** ts te bs be | — | yes | --_rvl --_scale-bs --_scale-be --_scale-is --_scale-ie | lg: (pos) | — |
| `trg()` | reveal-mode | **value** card | — | — | — | — | — |
| `ico()` | reveal-icon | **pos** ts te bs be · **tone** drk sem · **size** sm lg | — | — | --ui-reveal-icon-bg --ui-reveal-icon-sz --_scale-bs --_scale-be --_scale-is --_scale-ie | — | — |
| `icc()` | reveal-icon | **pos** ts te bs be · **tone** drk sem · **size** sm lg | — | — | --ui-reveal-icon-bg --ui-reveal-icon-sz | — | — |
| `col` | arrangement | — | — | yes | --ui-card-cols | md: lg: | — |
| `col-r` | arrangement | — | — | yes | --ui-card-cols | md: lg: | — |
| `row` | arrangement | — | — | yes | --ui-card-cols | md: lg: | — |
| `row-r` | arrangement | — | — | yes | --ui-card-cols | md: lg: | — |
| `exp` | reveal-animation | — | — | yes | --_rvl | — | — |
| `pop` | reveal-mode | — | — | yes | --ui-reveal-expand-m --ui-media-ar --ui-reveal-content-fs | — | — |
| `scr` | scroll | — | — | yes | — | — | — |
| `sub` | subgrid | — | — | yes | --_sub | — | — |
<!-- /tokens -->

What each arrangement token does:

| Token | Effect |
|-------|--------|
| `col` *(default)* | content below media (single column) |
| `col-r` | content **above** media (reversed column; `ui-content { order: -1 }`) |
| `row` | media \| content side by side (`--ui-card-cols: --ui-card-split`) |
| `row-r` | content \| media (reversed row) |
| `spl(1/1 · 1/2 · 2/1 · 1/3 · 3/1)` | column ratio for `row`/`row-r` (writes `--ui-card-split`) |
| `vis(media)` | show only the media (hide `<ui-content>`) |
| `vis(content)` | show only the content (hide `<ui-media>`) |
| `sub` | join the parent `<lay-out>`'s subgrid rows — dissolves `> cq-box` and `> cq-box > ui-content` so the leaf parts become the card's own grid items (see below) |

### `sub` — join the parent layout's subgrid

`<lay-out lg="columns(3) subgrid" subgrid="4">` gives every **direct** child N shared rows. A card's parts sit two wrappers deep (`ui-card > cq-box > ui-content > eyebrow/headline/CTA`) and every wrapper breaks the subgrid chain, so `sub` flattens the wrappers with `display: contents`: media lands in row 1, then one content part per row, aligned across the whole deck however differently the headlines wrap.

```html
<lay-out lg="columns(3) subgrid" subgrid="4">
  <ui-card variant="col sub" media="asr(16/9)"><cq-box>
    <ui-media><img src="…" alt=""></ui-media>
    <ui-content><small data-part="eyebrow">…</small><h3 data-part="headline">…</h3><nav data-part="actions">…</nav></ui-content>
  </cq-box></ui-card>
  …
</lay-out>
```

**`sub` names no breakpoint — it follows the layout's flag.** The bare `subgrid` token only flips `--_subgrid: on` on the `<lay-out>` inside whichever `@media` the layout builder emitted it for; `sub` syncs to that live flag. Moving the markup from `lg="columns(3) subgrid"` to `xl="…"` (or `md=`, or several breakpoints) therefore needs **no card-side change at all** — the flag goes on and off with the layout's own breakpoint, and `sub` goes on and off with the flag. Below that breakpoint the card is an ordinary card again.

Three things to know:

- **`<ui-media>` is not flattened** — it *is* the row-1 grid item. Dissolving it would drop `asr()`/`rds()`/`scm` and spill its `<img>` plus any furniture across several rows.
- **While flattened, `<ui-content>`'s box is gone**, so its `pad()`/`gap()` have nothing to apply to; vertical rhythm comes from the layout's row gaps (`rg(N)` / `--layout-rg`). The subgrid engine also neutralises the card's `container-type`, so the card's own `md:`/`lg:` **container** tiers are suspended for as long as the flag is on. Both are by design.
- **`<ui-reveal>` is not a host for `sub`** — its front face is `details > summary`, and dissolving those destroys the disclosure surface and its `::details-content` animation. Use `<ui-card>` for subgridded decks.

See [layout/AGENTS.md](../../../layout/AGENTS.md#subgrid--subgrid) for the layout half, and `layout/demo-assets/wpp.html` + `layout/dist/section.html` for working demos.

**Responsive:** `col` `col-r` `row` `row-r` `spl()` `vis()` accept `md:` (≥ 25rem) and `lg:` (≥ 44rem) container-query prefixes, e.g. `variant="col md:row lg:spl(1/2)"`. All size queries are **named** — `@container bs-card (…)`. `variant=` is host-only (no self arm): it arranges the two children, so it belongs on the host by nature. `content=` spacing (`gap()` + the seven padding tokens) and size (`scl()`, `hl()`) are prefixable **and** ship a self arm — see [content.md](content.md#responsive). On `media=`, only `asr()` is prefixable.

## Overlay — `ovr()`

Stacks `<ui-content>` over `<ui-media>` (same grid cell) and places + aligns it at one of nine positions. Also sets the matching default scrim direction (paint it with `scm` on `media=`) and the overlay ink.

**Resize behaviour:** the frame's `asr()` ratio sets the card's height as long as the overlaid column fits inside it. When a narrow card makes the column taller than the ratio height, the frame stretches to the stacked row (`min-block-size: 100%`) so the image keeps covering the whole card — the ratio is a floor, never a clip. Same family as the row-arrangement fill (where `hug` opts out to keep `asr()`).

| Token | Default | Controls |
|-------|---------|----------|
| `--ui-card-overlay-ink` | `#fff` | text colour when content is overlaid (`--ui-content-ov-ink`) |

`ovr()` takes the **logical** nine-point grid — the same one furniture, `scm()` and reveal's `ico()` use:

```
ovr(ts)  ovr(tc)  ovr(te)
ovr(cs)  ovr(cc)  ovr(ce)
ovr(bs)  ovr(bc)  ovr(be)
```

Each sets `--ui-content-ov-justify` / `-align` / `-text` and points `--ui-media-scrim-default` at the matching gradient (which itself mirrors under `:dir(rtl)` — see [media.md](media.md#scrim)).

Two ink details ride along with the overlay: the headline and eyebrow get a legibility
`text-shadow` (`--ui-content-heading-text-shadow` / `--ui-content-eyebrow-text-shadow`,
silence it per instance with `style="--ui-content-heading-text-shadow: none"`), and a plain
solid CTA button inside an overlay keeps **dark** text — it still paints its light surface,
so inheriting the overlay's white would make it vanish. Colour button variants (`accent`,
`text`, …) set their own `--button-c` and are left untouched.

> **The physical spellings `ovr(tl) ovr(tr) ovr(cl) ovr(cr) ovr(bl) ovr(br)` were removed in v5** — they no longer resolve. They were always *mislabelled* rather than wrong: the implementation has been logical all along, so `ovr(tl)` already rendered top-**end** under `dir="rtl"`, and the migration is a pure find-and-replace (`tl`→`ts`, `tr`→`te`, `cl`→`cs`, `cr`→`ce`, `bl`→`bs`, `br`→`be`). `ovr(tc)`, `ovr(cc)` and `ovr(bc)` are spelled identically in both grids and are unaffected. `obp()` dropped its own physical spellings in a later v5 round, so no physical position vocabulary remains — see [media.md](media.md#obp--object-position-9-grid).

## Corners — `rds()`

| Token | Default | Controls |
|-------|---------|----------|
| `--ui-card-radius` | `var(--radius-2xl)` | corner radius |
| `--ui-card-squircle-exp` | `1.8` | superellipse exponent for `-sq` variants |

- **Round** (global radius scale): `rds(non · sm · md · lg · xl · 2xl · full · pill)`. The old `rds(none)` spelling was **removed in v5** — migrate to `rds(non)`. The same scale exists on `media=` (standalone frame) and `content=` (standalone content corners), and the alias is gone on all three.
- **Squircle** (bespoke radius + `corner-shape: superellipse()`): `rds(sm-sq · md-sq · lg-sq · xl-sq)` → radii `1.25 / 2 / 2.8 / 3.5rem` with exponents `1.5 / 1.7 / 1.8 / 2`. `ui-reveal` reads `--ui-card-squircle-exp` to apply the same corner-shape to its `<details>`.

> **Three `rds()` blocks, one scale — keep them in lock-step.** `ui-card.css`
> (`--ui-card-*`), `media.css` (`--ui-media-*`) and `content.css` (`--ui-content-*`) each
> ship the same ladder against a different namespace, and a token added to one must be added
> to all three. The single manifest source lands with R-13; until then the three comment
> markers are the contract. What they do **not** own is the values: `--radius-*`,
> `--radius-*-sq` and `--squircle-*` all come from `ui/base/tokens.css`, the canonical scale
> — the blocks only route a token arg to a namespace.
>
> The three differ only in **scope and matching**, all for the same reason — inside a card
> the host rounds itself and clips the inner areas via `overflow: hidden`, so only the host's
> radius is ever visible:
>
> | Sheet | Serves | Matching |
> |---|---|---|
> | `ui-card.css` | the card/reveal host | whole-token (`~=`) |
> | `media.css` | a **standalone** `<ui-media>` frame | substring (`*=`) |
> | `content.css` | a **standalone** `<ui-content>` that has been given a surface (`theme=`, author CSS) — the default `0` is inert inside a card | substring (`*=`) |
>
> Substring matching is safe for the two standalone blocks because `rds()` has no `md:`/`lg:`
> forms to shadow and `rds(sm)` is not a substring of `rds(sm-sq)` — the closing paren
> separates them. The `-sq` **shape** application is a separate stem-less needle
> (`[…*="-sq)"]`) in each sheet, and it is the only real property `rds()` sets — which is why
> it keeps a dual arm permanently (`corner-shape`'s subject *is* the element carrying the
> attribute; a container cannot restyle itself). A nested frame under `clip` is forced back to
> `--ui-media-radius: 0`.

## Border — `bdr`

Opt-in hairline for cards on a `surface` background whose edges otherwise vanish. Distinct from the `theme=` `border()` system ([base/theme.md](../../base/theme.md)) — that needs a colour theme and makes the fill transparent; `bdr` leaves the surface fill intact.

- **On:** `variant="bdr"` (default: `--color-border`, 1px, solid). Substring-matched, so any `bdr(…)` arg alone also enables it.
- **Shade:** `bdr(lgt)` super-light · default · `bdr(drk)` darker (same `lgt`/`drk` vocabulary as the carousel). There is no `bdr(sub)` / `bdr(strong)`.
- **Width:** `bdr(sm)` 1px (default) · `bdr(md)` 2px · `bdr(lg)` 3px (reuses `--border-width` / `-thick` / `-heavy`).

<!-- tokens:args attr=variant stems=bdr -->
| token | arg class | values | aliases |
|---|---|---|---|
| `bdr()` | **size** | sm md lg | — |
| `bdr()` | **tone** | lgt drk | — |
<!-- /tokens -->

| Custom property | Default | Purpose |
|---|---|---|
| `--ui-card-border-color` | `var(--color-border)` | border colour (or use `bdr(lgt)`/`bdr(drk)`) |
| `--ui-card-border-width` | `var(--border-width)` | border width (or use `bdr(sm)`/`bdr(md)`/`bdr(lg)`) |
| `--ui-card-border-style` | `solid` | border style — **author-only** (e.g. `dashed`, `dotted`) |

> **On `<ui-reveal>` the border paints on `> details`, not the host box.** The rounded
> surface a reveal actually shows is the inner `<details>` (that is what carries the radius,
> the background and the flip/grow transforms), so painting the hairline on `<ui-reveal>`
> itself would draw a square outline floating around a rounded card. `variant="bdr"` on a
> reveal therefore targets the direct-child `<details>`; the tokens and the arg vocabulary
> are identical to the card's.

```html
<ui-card variant="col bdr bdr(lgt)"> … </ui-card>
<ui-card variant="col bdr bdr(md)" style="--ui-card-border-style: dashed; --ui-card-border-color: var(--color-accent)"> … </ui-card>
```

## Themes — `theme=`

Cards use the **shared cross-component `theme=` axis** — full reference in
[base/theme.md](../../base/theme.md). A `theme=` value is one colour
(`red orange green blue accent white gray slate black`) plus optional modifiers
(`pale` tint, `muted` fade, `light`/`dark` scheme). The ink crosses into the
`<ui-content>` namespace (muted / eyebrow / tag) so parts re-tone; add the `dark`
modifier (`theme="black dark"`) to flip `color-scheme` so accent / pills / controls
re-tone too. The neutral surfaces form a light→dark ramp: **`white` < `gray` <
`slate` < `black`**.

Card-local override hooks (feed the `--ui-theme-black-*`/`slate` bundles):

| Token | Default | Controls |
|-------|---------|----------|
| `--ui-card-dark-bg` | `#1f2937` | `theme="black"` surface — set to `var(--color-accent)` for a branded surface |
| `--ui-card-muted-bg` | `#374151` | `theme="slate"` surface |

**On a `<ui-reveal>`** the axis works the same, with one twist: the painted, rounded
box is the inner `<details>`, so the host arm *re-publishes* the resolved surface into
`--ui-reveal-bg` (the back panel and the `pop` popup card follow through their own
fallback chains). The **flipside** carries its own `theme=` on the element after
`</summary>` — see [Two sides, two themes](../../reveal/readme.md#two-sides-two-themes).
`theme="… border"` is routed too: the host takes the card radius grown by the border
width, and the card shadow is dropped (the fill is transparent by then).

> **Migrated from `thm()`:** the old `variant="thm(dark\|muted\|subtle)"` spelling was
> **removed in v4** — use `theme=`: `thm(dark)`→`theme="black dark"`, `thm(muted)`→
> `theme="slate dark"`, `thm(subtle)`→`theme="gray"`.
>
> The overlay-furniture **sub-themes** (`chip(red)`, `sticker(green)`, …) are the
> same bundles routed via `media=` — see [media.md](media.md).

## Reveal tokens (`ui-reveal`)

`<ui-reveal>` (in `ui/reveal`) is configured through the **same `variant=` attribute** as the card — its former individual attributes (`type`, `type-lg`, `from`, `to`, `trigger`, `scroll`, `icon`, `icon-close`) are **removed**, folded into `variant=` tokens. Like the card's arrangement tokens they are whole-token (`~=`) matched, and the `lg:` container-tier prefix works the same way (`lg:grw` replaces the old `type-lg=`). The animation token carries its own direction/origin — there is no separate `frm()` token.

The argument vocabularies are generated from the manifest:

<!-- tokens:args attr=variant stems=exp,flp,sld,grw,pop,trg,scr,ico,icc -->
| token | arg class | values | aliases |
|---|---|---|---|
| `exp` | *(bare flag)* | — | — |
| `flp()` | **pos** | top btm lft rgt | — |
| `sld()` | **pos** | top btm lft rgt | — |
| `grw()` | **pos** | ts te bs be | — |
| `pop` | *(bare flag)* | — | — |
| `trg()` | **value** | card | — |
| `scr` | *(bare flag)* | — | — |
| `ico()` | **pos** | ts te bs be | — |
| `ico()` | **tone** | drk sem | — |
| `ico()` | **size** | sm lg | — |
| `icc()` | **pos** | ts te bs be | — |
| `icc()` | **tone** | drk sem | — |
| `icc()` | **size** | sm lg | — |
<!-- /tokens -->

| Token | Replaces | Effect |
|-------|----------|--------|
| `exp` · `flp()` · `sld()` · `grw()` | `type=` + `from=` | ONE token per animation, direction/origin in the value (expand / flip / slide / **grow**). Bare `flp`/`sld` = from the right; bare `grw` follows the `ico()` corner |
| `lg:grw` | `type-lg=` | Swap to the grow-morph at the `lg:` container tier (≥ 44rem). **`grw` is the only animation with an `lg:` form** — there is no `lg:exp`, `lg:flp` or `lg:sld` |
| `pop` | `to=` | popup mode for the revealed panel |
| `trg(card)` | `trigger="card"` | whole card toggles the disclosure — **and suppresses the toggle icon** |
| `scr` | `scroll` | scrollable reveal panel |
| `ico()` | `icon=` | toggle-icon placement / ink / size — placement uses the furniture corner spellings (top/bottom × start/end, logical + rtl-safe); **one token per word**, e.g. `ico(te) ico(sm)`. Size is `sm` / `lg` only: the default (`--size-7`) has **no** token, so there is no `ico(md)` |
| `icc()` | `icon-close=` | same words as `ico()`, applied in the **open** state (and likewise no `icc(md)`) |

> **`scl()` → `grw()`.** The reveal's scale-morph animation was renamed: `scl` is `content=`'s type-scale token, and one spelling should mean one thing even across attributes. `scl`, `scl(ts\|te\|bs\|be)`, `lg:scl` and its corner forms were **removed in v5** — no alias remains, so migrate `scl` → `grw`, `scl(<corner>)` → `grw(<corner>)`, `lg:scl…` → `lg:grw…`.

There is **no `thm()` token.** Theming goes through the shared `theme=` attribute — see *Themes* above for the migration mapping.

The renderer's default icon is `ico(te) ico(sm)`. Native `<details name>` (exclusivity) and `open` stay as real attributes; `render.js` emits `name=` only when the preset supplies `reveal.name`. Full reveal reference: [../reveal/readme.md](../../reveal/readme.md).

---

## Internal tokens (written by `variant=` — don't set directly)

| Token | Set by | Holds |
|-------|--------|-------|
| `--ui-card-cols` | arrangement | `<cq-box>` grid columns |
| `--ui-card-split` | `spl()` | row column ratio |
| `--ui-card-stack` | `ovr()` | `1 / 1` grid area to overlay media + content |
| `--ui-card-squircle-exp` | `rds(*-sq)` | superellipse exponent |

---

## Internals (`ui-card.css`)

> The *why* behind the sheet. These sections used to live as essay-length comment
> blocks in the CSS; the file keeps one-line pointers back here plus the guardrail
> markers a future editor must not delete.

### `sub` — the two-hop flag relay

`sub` is a **flag relay**, not a breakpoint. Two hops are required, because a style query
resolves against the subject's **parent**:

| Hop | Subject | Parent | Reads / writes |
|---|---|---|---|
| 1 | the `<ui-card>` | the `<lay-out>` | reads `--_subgrid` (non-inheriting, set by the layout's bare `subgrid` token) → writes `--_sub: 1` |
| 2 | `<cq-box>` | the `<ui-card>` | reads the inherited `--_sub` → `display: contents` on `> cq-box` and `> cq-box > ui-content` |

Hop 2 cannot read `--_subgrid` directly: the card has none of its own, precisely because
that property does not inherit. So hop 1 relays the state into `--_sub`, an ordinary
**inheriting** custom property — deliberately *not* `@property`-registered, since the
default `inherits: true` is exactly what the relay needs. **Verified in Chromium: the
single-hop form matches nothing.**

The layout half is `layout/core/base.css`: `<lay-out lg="columns(3) subgrid" subgrid="4">`
gives every direct child `display: grid` + `grid-row: span var(--_sg)` +
`grid-template-rows: subgrid`, plus `container-type: normal` so the child's own inline-size
container cannot sever the subgrid chain.

**Boundary reset.** A host nested inside another host starts `--_sub: 0`, so a subgridded
outer card cannot flatten an inner one that is not itself a direct child of an ON layout.
It is declared **before** the setter, so the setter re-wins for an inner card that genuinely
is one (both sides are zero-specificity `:where()`, so source order decides) — the same
nearest-host-wins discipline `content.typography.css` uses for its size resets. The comment
marking it in the CSS stays for that reason.

### The named `bs-card` container (F-42)

Every `md:`/`lg:` rule queries a **named** container, `@container bs-card (…)`. An *unnamed*
size query resolves against the subject's nearest size container — so a self-armed primitive
standing outside a card could match an unrelated ancestor container and switch tiers off the
wrong box's width. With the name, only `ui-card` / `ui-reveal` / `lay-out-group` match, and
a standalone primitive opts in deliberately:

```html
<div style="container: bs-card / inline-size"> <ui-content content="lg:scl(xl)"> … </div>
```

### Two arms per responsive token (R-14 step 3 / R-18)

- **Host arm** — targets the queryable descendant (`cq-box` for a card, `summary` for a
  reveal). Setting the `--ui-content-*` / `--ui-media-*` props *there* (nearer than the
  host) is what overrides the base per container.
- **Self arm** — targets the primitive itself, so a token placed directly on
  `<ui-content>`/`<ui-media>` (the renderer's canonical placement) works too.
  Nearest-wins keeps precedence right: a declaration on the primitive beats the one it
  would otherwise inherit from `cq-box`.
- **`variant=` gets no self arm** — it arranges the two children, so it belongs on the host
  by nature.

`content=` **size** (`md:`/`lg:` `scl()` and `hl(<size>)`) lives in
`content.typography.css`, not here: those rules must precede/follow the base size rules in a
fixed source order (everything ties at `:where()` specificity), so the whole type cascade
stays in one file. `content=` tone/weight and `media=` tokens are not prefixed — **except**
`asr()`, whose `md:`/`lg:` forms set `--ui-media-ar` per container width, because the aspect
a card wants genuinely depends on how wide it renders (portrait in a 1-up carousel,
landscape once it widens). Base `asr()` is whole-token matched, so it ignores the prefixed
forms.

### `bdr` — why the reveal arm moves one level in

The specificity contract behind the note in *Border* above: the **card** arm keeps its exact
original selector at `(0,0,0)`; the **reveal** arm is `(0,0,1)` because it names a child
element, matching every other `> details` rule in `ui-reveal.css`. The reveal arm inherits
the same `--ui-card-border-*` knobs (still declared on the host by the
`bdr(<size>)`/`bdr(<shade>)` rules) and picks up the `<details>` radius, which is already
`var(--ui-card-radius, …)` — so `rds()` keeps working.

### `theme=` — how ink crosses namespaces

Surface + ink come from the resolved `--_theme-*` pair (see
[base/theme.md](../../base/theme.md)), both `light-dark()` so they adapt, falling back to the
default host surface when unthemed. Adding the `dark`/`light` modifier
(`theme="black dark"`) also flips `color-scheme`, which is what re-tones the content ink
ramp, eyebrow, tags, pills, form controls and scrollbars. A **branded** surface is
`theme="black"` plus a `--ui-card-dark-bg` override (hooked in the `--ui-theme-black-bg`
bundle).

### Cross-document view transitions

`@view-transition` is a top-level at-rule, so this block ships **outside** `@layer`.

Add a `data-view` attribute to any card (and optionally its media `<img>`) plus a matching
one on the target page's container, link the two pages with a regular `<a>` (see
`data-part="cover"` in `content.css`), and the card morphs across the navigation — both
directions. Names come from the attribute via CSS `attr()` (CSS Values 5, Chromium 133+), so
there are no inline styles and it stays strict-CSP friendly. Where unsupported the name
resolves to `none` and navigation degrades to a plain swap.

**The race that bites.** Both documents must be same-origin, and — critically — the incoming
page's named elements must exist in the DOM when the browser takes the new-page snapshot.
That snapshot races HTML parsing: if the parser has not reached the card/hero yet, the morph
silently degrades to a plain root cross-fade. (This is why a repeat/bfcache navigation can
appear to "stop animating".) Render-block each incoming page until its named elements are
parsed — `<link rel="expect" href="#…" blocking="render">` in the `<head>`, as
`ui/card/articles/build.js` emits. Client-fetched content cannot win this race at all:
server-render or pre-build the named markup.

A **mandatory** safety rule follows in the sheet: no navigation transitions under
`prefers-reduced-motion: reduce`.

---

## Internals (`ui-reveal.css`)

### The card-rule leak checklist

`ui-card.css` writes many rules as host-scoped **descendant** selectors
(`:where([variant…]) ui-content`, `… :is(cq-box, summary)`). A `<ui-reveal>` is a
`[variant]` host, so those rules reach *past* the front face and into the revealed panel —
which is not a card area at all. Each one is counter-reset in `ui-reveal.css`:

| # | Leaking card rule | Undone by |
|---|---|---|
| 1 | `ovr()` ink + placement + z (`--ui-content-ov-*`) | `> details > ui-content` — `color` / `align-items` / `justify-content` / `text-align` / `z-index` |
| 2 | `vis(media)`'s `ui-content { display: none }` | `display: flex` in the same block |
| 3 | `ovr()`'s grid-area stacking (`:where([variant]) :is(ui-media, ui-content)`) | `grid-area: auto` in the same block |
| 4 | content padding doubling (`--ui-content-p` **and** `--ui-reveal-content-p`) | `> details[open]:has(> ui-content)::details-content { padding: 0 }` |
| 5 | type-scale on a panel with no `content=` of its own | `> details > ui-content:not([content])` |

Items 6 and 7 are the exceptions that prove the rule — rules that reach into the panel **on
purpose**:

| # | Card/content rule reaching the panel | Why it stays |
|---|---|---|
| 6 | `align-content` (the `ui-card.css` arrangement block) reaches `<summary>` | shared on purpose (F-14) |
| 7 | `ui-content[theme]` surface + ink (`content.css`) | **not undone — by design.** Its subject sits inside `ui-reveal > details` without passing `summary`, which is exactly the point: it is how a flipside gets its own colour. Written at (0,1,0) so it deliberately out-specifies item 1's `color` reset; `ui-reveal.css` adds only the geometric fill (`min-block-size: 100%`) plus the same payload for a non-`ui-content` back |

> **The audit rule — keep the CSS marker.** When a new card token is added, ask: *does its
> selector subject sit inside `ui-reveal > details` without passing through
> `summary`/`ui-face`?* If yes, it either leaks into the panel and needs an entry here plus a
> counter-reset — or it reaches the panel **intentionally**, in which case it still needs a
> row (items 6-7) saying so, and the specificity that makes it survive the counter-resets. Long-term (v5) the card rules move to front-face-scoped subjects and this
> list shrinks toward zero.

**Why #5 tests `content=` and not `variant=`.** An explicit `content=` on the back
(`scl()`, `hl()`, `tx()`, …) means the author wants the panel to size itself through the
content DSL, and the reset would otherwise out-specify it. The **back content** itself is an
optional generic `<ui-content>` placed after `</summary>`: it inherits the card typography
and `data-part` engine, keeps its own content padding (`--ui-content-p`, settable with
`pad()`), and the panel padding is zeroed so the two do not double.

### The `--_rvl` animation-dispatch flag

Each `variant=` animation family writes **one** value onto `> details` (`exp` | `flp` |
`sld` | `grw`); the per-animation geometry blocks match it with style queries against the
`details` container (named `bs-rvl`). So every animation's tokens are enumerated exactly
once, and the `lg:` tier swaps the animation by **re-flipping the flag** rather than
duplicating geometry.

`--_rvl` is **non-inheriting on purpose**: a nested `<ui-reveal>`'s `<details>` must not pick
up an outer reveal's animation. The universal syntax (`syntax: "*"`) needs no
`initial-value` — the guaranteed-invalid initial simply never matches a style query.

### `theme=` — the two sides

**Card arm.** `:where(ui-reveal)&[theme]` re-publishes the resolved pair into
`--ui-reveal-bg` (consumed by `> details`) plus one `color` on the host. It has to
re-publish rather than paint: `--_theme-*` are `inherits: false`, so only a rule whose
subject *is* the themed element can read them, and the painted box is a child. Everything
downstream then follows through existing fallbacks — the panel via
`var(--ui-reveal-content-bg, var(--ui-reveal-bg))`, the popup card via
`--ui-reveal-expand-bg`, the icon focus rings. Ink is set once and inherits into both faces,
so `--ui-reveal-content-c` is deliberately left alone. Surface-style ink fallback
(`--color-text`), not the badge pair — that is what makes `theme="black dark"` re-tone
through `color-scheme`.

`theme="… border"` is routed on the host too: `theme.css` draws the ring on the
`<ui-reveal>` box, which has neither radius nor fill, so the host takes the card radius
grown by `--_theme-bw` (concentric curves under border-box sizing) and drops the card
shadow — the fill is already transparent, since `border` sets `--_theme-bg: #0000`.
`--_theme-border`/`-bw` are **not** re-published to `> details`: that would flatten the
per-side `border(bs|be|is|ie|bk|in)` vocabulary into one width.

**Back slot.** The panel's own colour comes from a `theme=` on the back element, matched as
`> details > :where(:not(summary))[theme]` — "any direct child of `<details>` that isn't the
trigger", so it covers a `<ui-content>`, a `<div>` wrapper around a nested component, or a
`<ui-media>`. It **paints itself** (a pseudo-element can't carry an attribute, and the
non-inheriting `--_theme-*` can't cross elements), while `::details-content` keeps its
`--ui-reveal-content-bg` paint behind it. `min-block-size: 100%` stretches it to the panel
box — `flp`/`sld`/`grw` panels are `grid-area: 1 / -1`, `scr` is `inset: 0`; under `exp` the
in-flow panel height is indefinite, so the percentage is inert. The rule sits at (0,1,2) to
out-specify the row-1 `ovr()` ink counter-reset above, and repeats `content.css`'s payload so
a non-`ui-content` back works too. Panel padding is already zeroed for a `<ui-content>` back
(checklist item 4), which is what lets the fill reach the panel edges.

**The open-panel focus ring.** The second tab stop (a `[tabindex]` back) suppresses its own
clipped outline and recolours the summary's icon ring instead. The ring is the panel's ink —
`--ui-reveal-ring-active` → `--ui-reveal-content-c` → `--color-text`, **not** `currentColor`,
which on that icon is the glyph (white under `ico(drk)`/`icc(drk)`). The gap is the panel's
surface — `--ui-reveal-ring-gap` → `--ui-reveal-content-bg` → `--ui-reveal-bg`. Neither can
read a back that paints itself, so a back themed `dark` / `light` flips `color-scheme` on the
icon: both `light-dark()` tokens re-resolve and a dark flipside gets a dark gap with a light
ring, with no hand-set colour. Arbitrary back colours set the two properties directly.

### Panel geometry — `scr`, `icc()` clearance, `grw` origin, the `lg:` re-flip

- **`scr`** takes the panel out of grid track sizing (`position: absolute; inset: 0`) so a
  long flipside can't grow the card; default height is the closed face, overridable with
  `--ui-reveal-content-bs`. Its scroll fade-shadow drives the shared engine in
  `ui/base/scroll.css` (`@keyframes ui-scroll-fade-s`/`-e` + `--ui-scroll-fade-mask`, also
  driven by `content="scr"` and `<lay-out overflow="fade*">`); the mask cuts the panel's own
  paint, so the faded edges reveal whatever is *behind* it — the `<details>` background.
  **The panel does not have to be a `<ui-content>`.** The engine declares
  `--ui-scroll-fade-mask` on `ui-reveal > details > *`, i.e. on the element that actually
  animates, so a plain `<div>` panel is masked identically. It used to be declared on
  `:where(ui-content, ui-reveal)` — and because a `var()` inside a custom property
  substitutes at the *declaring* element, a non-`<ui-content>` panel inherited a gradient
  computed on `<ui-reveal>`, where both lengths are permanently `0px`: the mask was silently
  dead. Nothing but a non-`<ui-content>` panel exposes this, which is why it survived.
- **`icc()` clearance** indents only the panel's first child out from under a top close-icon,
  with logical padding so it flips in rtl. The active side is `icc()` if set, else `ico()`.
- **`grw` origin** follows the icon corner unless a `grw(ts|te|bs|be)` pins it; the setters
  live on the host (a container can't style itself) and are inert unless the dispatched flag
  is `grw`. One geometry block serves both the base tokens and the `lg:` tier.
- **`lg:grw`** swaps the animation by re-flipping `--_rvl` on `<details>` — same 0-0-1
  specificity as the base setters, later in the file, so it wins by source order. No geometry
  is duplicated.
- **`flp` rotation pairs** share one axis per direction (closed/open), so the transforms
  interpolate as rotations instead of degenerating at 180°. The icon dip is twin keyframes
  (open/close) so re-toggling restarts the fade.

### `pop` — why the backdrop is on `ui-reveal::before`

`pop` keeps the **outer** `<ui-reveal>` in normal flow as a placeholder, reserving the closed
tile's cell via its aspect ratio so siblings do not reflow; only the **inner** `<details>`
goes fixed. The backdrop therefore sits on `ui-reveal::before`, **not** `details::before`:
`<details>` runs a scale transform (`ui-reveal-pop`), which makes it the containing block for
fixed descendants *and* clips them via `overflow: hidden`. `<ui-reveal>` has no transform, so
its fixed `::before` fills the viewport. The host block also stays attribute-keyed rather
than style-queried — a container cannot style itself, and `pop` only exists with `exp`.

**The popup escape hatch ships UNLAYERED, on purpose.** `<lay-out>` sets
`contain: layout inline-size` in `@layer layout.base`, and *layout* containment makes it the
containing block for the fixed popup, trapping it inside the grid cell. While a popup is
open the rule drops the `layout` keyword (keeping `inline-size`, so track sizing is
untouched) so the popup's `inset` resolves against the viewport again. Unlayered beats
`layout.base` regardless of stylesheet order — the marker in the CSS records that; do not
move the rule into a layer.
