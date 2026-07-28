# `ui-card` — Design Tokens

`<ui-card>` is the **composition layer** over two primitives:

- `<ui-media>` — the media frame, carousel, scrim, and overlay furniture. Its `media=` DSL and `--ui-media-*` tokens are documented in **[media.md](media.md)**.
- `<ui-content>` — the text column and its parts. Its `content=` DSL and `--ui-content-*` tokens are documented in **[content.md](content.md)**.

This file covers only the **card-level** tokens: the host surface, the media↔content arrangement (`variant=`), the overlay bridge (`ovr()`), the shared theme axis (`theme=`, see [base/theme.md](../base/theme.md)), and corners (`rds()`). Every value is a CSS custom property with a built-in fallback, so override only what you need:

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
| `rds()` | corners | **size** non sm md lg xl 2xl full pill sm-sq md-sq lg-sq xl-sq | none→non | — | --ui-card-radius --ui-card-squircle-exp | — | — |
| `bdr()` | border | **size** sm md lg · **tone** lgt drk | — | yes | --ui-card-border-width --ui-card-border-color | — | — |
| `spl()` | split | **ratio** 1/1 1/2 2/1 1/3 3/1 | — | — | --ui-card-split | md: lg: (ratio) | — |
| `vis()` | visibility | **value** media content | — | — | — | md: lg: (value) | — |
| `ovr()` | overlay | **pos** ts tc te cs cc ce bs bc be | — | — | --ui-card-stack --ui-content-ov-ink --ui-content-ov-z --ui-content-heading-text-shadow --ui-content-eyebrow-text-shadow --ui-content-ov-justify --ui-content-ov-align --ui-content-ov-text --ui-media-scrim-default | — | — |
| `flp()` | reveal-animation | **pos** top btm lft rgt | — | yes | --_rvl --_face-closed --_face-open --_panel-closed --_panel-open --ui-reveal-icon-clear | — | — |
| `sld()` | reveal-animation | **pos** top btm lft rgt | — | yes | --_rvl | — | — |
| `grw()` | reveal-animation | **pos** ts te bs be | — | yes | --_rvl --_scale-bs --_scale-be --_scale-is --_scale-ie | lg: (pos) | — |
| `scl()` | reveal-animation | **pos** ts te bs be | — | yes | --_rvl --_scale-bs --_scale-be --_scale-is --_scale-ie | lg: (pos) | yes → `grw` |
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

See [layout/AGENTS.md](../../layout/AGENTS.md#subgrid--subgrid) for the layout half, and `layout/demo-assets/wpp.html` + `layout/dist/section.html` for working demos.

**Responsive:** `col` `col-r` `row` `row-r` `spl()` `vis()` accept `md:` (≥ 25rem) and `lg:` (≥ 44rem) container-query prefixes, e.g. `variant="col md:row lg:spl(1/2)"`. All size queries are **named** — `@container bs-card (…)`. `variant=` is host-only (no self arm): it arranges the two children, so it belongs on the host by nature. `content=` spacing (`gap()` + the seven padding tokens) and size (`scl()`, `hl()`) are prefixable **and** ship a self arm — see [content.md](content.md#responsive). On `media=`, only `asr()` is prefixable.

## Overlay — `ovr()`

Stacks `<ui-content>` over `<ui-media>` (same grid cell) and places + aligns it at one of nine positions. Also sets the matching default scrim direction (paint it with `scm` on `media=`) and the overlay ink.

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

> **The physical spellings `ovr(tl) ovr(tr) ovr(cl) ovr(cr) ovr(bl) ovr(br)` were removed in v5** — they no longer resolve. They were always *mislabelled* rather than wrong: the implementation has been logical all along, so `ovr(tl)` already rendered top-**end** under `dir="rtl"`, and the migration is a pure find-and-replace (`tl`→`ts`, `tr`→`te`, `cl`→`cs`, `cr`→`ce`, `bl`→`bs`, `br`→`be`). `ovr(tc)`, `ovr(cc)` and `ovr(bc)` are spelled identically in both grids and are unaffected. With `ovr()` converted, **`obp()` is the system's only physical position vocabulary** — see [media.md](media.md#obp--object-position-9-grid).

## Corners — `rds()`

| Token | Default | Controls |
|-------|---------|----------|
| `--ui-card-radius` | `var(--radius-2xl)` | corner radius |
| `--ui-card-squircle-exp` | `1.8` | superellipse exponent for `-sq` variants |

- **Round** (global radius scale): `rds(non · sm · md · lg · xl · 2xl · full · pill)`. `rds(none)` is a **deprecated alias** of `rds(non)`, removed in v5. The same scale and the same alias exist on `media=` (standalone frame) and `content=` (standalone content corners).
- **Squircle** (bespoke radius + `corner-shape: superellipse()`): `rds(sm-sq · md-sq · lg-sq · xl-sq)` → radii `1.25 / 2 / 2.8 / 3.5rem` with exponents `1.5 / 1.7 / 1.8 / 2`. `ui-reveal` reads `--ui-card-squircle-exp` to apply the same corner-shape to its `<details>`.

## Border — `bdr`

Opt-in hairline for cards on a `surface` background whose edges otherwise vanish. Distinct from the `theme=` `border()` system ([base/theme.md](../base/theme.md)) — that needs a colour theme and makes the fill transparent; `bdr` leaves the surface fill intact.

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
[base/theme.md](../base/theme.md). A `theme=` value is one colour
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

> **Migrated from `thm()`:** the old `variant="thm(dark\|muted\|subtle)"` spelling was
> **removed in v4** — use `theme=`: `thm(dark)`→`theme="black dark"`, `thm(muted)`→
> `theme="slate dark"`, `thm(subtle)`→`theme="gray"`.
>
> The overlay-furniture **sub-themes** (`chip(red)`, `sticker(green)`, …) are the
> same bundles routed via `media=` — see [media.md](media.md).

## Reveal tokens (`ui-reveal`)

`<ui-reveal>` (in `ui/reveal`) is configured through the **same `variant=` attribute** as the card — its former individual attributes (`type`, `type-lg`, `from`, `to`, `trigger`, `scroll`, `icon`, `icon-close`) are **removed**, folded into `variant=` tokens. Like the card's arrangement tokens they are whole-token (`~=`) matched, and the `lg:` container-tier prefix works the same way (`lg:grw` replaces the old `type-lg=`). The animation token carries its own direction/origin — there is no separate `frm()` token.

The argument vocabularies are generated from the manifest:

<!-- tokens:args attr=variant stems=exp,flp,sld,grw,scl,pop,trg,scr,ico,icc -->
| token | arg class | values | aliases |
|---|---|---|---|
| `exp` | *(bare flag)* | — | — |
| `flp()` | **pos** | top btm lft rgt | — |
| `sld()` | **pos** | top btm lft rgt | — |
| `grw()` | **pos** | ts te bs be | — |
| `scl()` | **pos** | ts te bs be | — |
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
| `lg:grw` | `type-lg=` | Swap to the grow-morph at the `lg:` container tier (≥ 44rem). **`grw` is the only animation with an `lg:` form** (its deprecated alias `lg:scl` too) — there is no `lg:exp`, `lg:flp` or `lg:sld` |
| `pop` | `to=` | popup mode for the revealed panel |
| `trg(card)` | `trigger="card"` | whole card toggles the disclosure — **and suppresses the toggle icon** |
| `scr` | `scroll` | scrollable reveal panel |
| `ico()` | `icon=` | toggle-icon placement / ink / size — placement uses the furniture corner spellings (top/bottom × start/end, logical + rtl-safe); **one token per word**, e.g. `ico(te) ico(sm)`. Size is `sm` / `lg` only: the default (`--size-7`) has **no** token, so there is no `ico(md)` |
| `icc()` | `icon-close=` | same words as `ico()`, applied in the **open** state (and likewise no `icc(md)`) |

> **`scl()` → `grw()`.** The reveal's scale-morph animation was renamed this round: `scl` is `content=`'s type-scale token, and one spelling should mean one thing even across attributes. `scl`, `scl(ts\|te\|bs\|be)` and `lg:scl` (+ its corner forms) are kept as **deprecated aliases**, removed in v5.

There is **no `thm()` token.** Theming goes through the shared `theme=` attribute — see *Themes* above for the migration mapping.

The renderer's default icon is `ico(te) ico(sm)`. Native `<details name>` (exclusivity) and `open` stay as real attributes; `render.js` emits `name=` only when the preset supplies `reveal.name`. Full reveal reference: [../reveal/readme.md](../reveal/readme.md).

---

## Internal tokens (written by `variant=` — don't set directly)

| Token | Set by | Holds |
|-------|--------|-------|
| `--ui-card-cols` | arrangement | `<cq-box>` grid columns |
| `--ui-card-split` | `spl()` | row column ratio |
| `--ui-card-stack` | `ovr()` | `1 / 1` grid area to overlay media + content |
| `--ui-card-squircle-exp` | `rds(*-sq)` | superellipse exponent |
