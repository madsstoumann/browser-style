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

| Token | Effect |
|-------|--------|
| `col` *(default)* | content below media (single column) |
| `col-r` | content **above** media (reversed column; `ui-content { order: -1 }`) |
| `row` | media \| content side by side (`--ui-card-cols: --ui-card-split`) |
| `row-r` | content \| media (reversed row) |
| `spl(1/1 · 1/2 · 2/1 · 1/3 · 3/1)` | column ratio for `row`/`row-r` (writes `--ui-card-split`) |
| `vis(media)` | show only the media (hide `<ui-content>`) |
| `vis(content)` | show only the content (hide `<ui-media>`) |

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

> **The physical spellings `ovr(tl) ovr(tr) ovr(cl) ovr(cr) ovr(bl) ovr(br)` are deprecated aliases**, removed in v5. They were always *mislabelled* rather than wrong: the implementation has been logical all along, so `ovr(tl)` already rendered top-**end** under `dir="rtl"`. This round renames the args to match reality. `ovr(tc)`, `ovr(cc)` and `ovr(bc)` are spelled identically in both grids and are unaffected.

## Corners — `rds()`

| Token | Default | Controls |
|-------|---------|----------|
| `--ui-card-radius` | `var(--radius-2xl)` | corner radius |
| `--ui-card-squircle-exp` | `1.8` | superellipse exponent for `-sq` variants |

- **Round** (global radius scale): `rds(non · sm · md · lg · xl · 2xl · full · pill)`. `rds(none)` is a **deprecated alias** of `rds(non)`, removed in v5. The same scale and the same alias exist on `media=` (standalone frame) and `content=` (standalone content corners).
- **Squircle** (bespoke radius + `corner-shape: superellipse()`): `rds(sm-sq · md-sq · lg-sq · xl-sq)` → radii `1.25 / 2 / 2.8 / 3.5rem` with exponents `1.5 / 1.7 / 1.8 / 2`. `ui-reveal` reads `--ui-card-squircle-exp` to apply the same corner-shape to its `<details>`.

## Border — `bdr`

Opt-in hairline for cards on a `surface` background whose edges otherwise vanish. Distinct from the `theme=` `border()` system ([base/theme.md](../base/theme.md)) — that needs a colour theme and makes the fill transparent; `bdr` leaves the surface fill intact.

- **On:** `variant="bdr"` (default: `--color-border`, 1px, solid). `bdr(md)` alone also enables it.
- **Shade:** `bdr(lgt)` super-light · default · `bdr(drk)` darker (same `lgt`/`drk` vocabulary as the carousel).
- **Width:** `bdr(sm)` 1px (default) · `bdr(md)` 2px · `bdr(lg)` 3px (reuses `--border-width` / `-thick` / `-heavy`).

| Custom property | Default | Purpose |
|---|---|---|
| `--ui-card-border-color` | `var(--color-border)` | border colour (or use `bdr(sub)`/`bdr(strong)`) |
| `--ui-card-border-width` | `var(--border-width)` | border width (or use `bdr(sm/md/lg)`) |
| `--ui-card-border-style` | `solid` | border style — **author-only** (e.g. `dashed`, `dotted`) |

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

| Token | Values | Replaces | Effect |
|-------|--------|----------|--------|
| `exp` · `flp()` · `sld()` · `grw()` | `flp(top\|btm\|lft\|rgt)` · `sld(top\|btm\|lft\|rgt)` · `grw(ts\|te\|bs\|be)` | `type=` + `from=` | ONE token per animation, direction/origin in the value (expand / flip / slide / **grow**). Bare `flp`/`sld` = from the right; bare `grw` follows the `ico()` corner |
| `lg:` animation | e.g. `lg:grw` | `type-lg=` | animation at the `lg:` container tier (≥ 44rem) |
| `pop` | *(bare flag)* | `to=` | popup mode for the revealed panel |
| `trg(card)` | — | `trigger="card"` | whole card toggles the disclosure — **and suppresses the toggle icon** |
| `scr` | *(bare flag)* | `scroll` | scrollable reveal panel |
| `ico()` | corner `ts` `te` `bs` `be` · ink `drk` `sem` · size `sm` `lg` | `icon=` | toggle-icon placement / ink / size — placement uses the furniture corner spellings (top/bottom × start/end, logical + rtl-safe); **one token per word**, e.g. `ico(te) ico(sm)` |
| `icc()` | same words as `ico()` | `icon-close=` | icon placement/style in the **open** state |

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
