# @browser.style/reveal

A CSS-first **disclosure** built on native `<details>` / `<summary>`, composed over the same card engine as `<ui-card>`. The `<summary>` is the trigger face; the revealed panel is `::details-content` (everything after `</summary>`). Four reveal animations — `exp`, `flp`, `sld`, `grw` — plus a full-card trigger (`trg(card)`) and an expand-to-popup mode (`pop`), all configured through the same `variant=` token attribute `<ui-card>` uses. No JavaScript required.

`<ui-reveal>` `@import`s `ui-card.css`, so it shares the card primitives and DSLs verbatim: the **`media=`** frame ([media.md](../card/media.md)), the **`content=`** text column ([content.md](../card/content.md)), and the **`variant=`** arrangement / overlay / theme / corners ([ui-card-tokens.md](../card/ui-card-tokens.md)). This package adds only the reveal-specific parts: the `<details>` / `<summary>` wiring, `<ui-icon>`, `<ui-face>`, and the reveal `variant=` tokens (`exp`, `flp()`, `sld()`, `grw()`, `ico()`, …) that drive the animations.

> The grow-morph animation is spelled **`grw()`**. `scl` / `scl(ts|te|bs|be)` / `lg:scl` are kept as **deprecated aliases** (removed in v5) — `scl()` is `content=`'s type-scale token, and one spelling should mean one thing even across attributes.

---

## Install

```bash
npm install @browser.style/reveal
```

Peer dependencies:

```bash
npm install @browser.style/base @browser.style/card @browser.style/icon
```

> `@browser.style/base` provides the token system; `@browser.style/card` provides the shared card engine (`<ui-media>` / `<ui-content>`, the `media=` / `content=` / `variant=` DSLs); `@browser.style/icon` provides `<ui-icon>`. Because base is a required peer dependency, the global tokens reveal references are always available.

---

## Usage

```css
@import '@browser.style/base';
@import '@browser.style/card/style';
@import '@browser.style/reveal/style';   /* pulls in @browser.style/icon */
```

---

## Quick start

### Basic disclosure

`<details>` is the direct child; `<summary>` is the front face; one element after `</summary>` is the panel. Use `<ui-content>` for the panel so it inherits the card typography + `data-part` engine.

```html
<ui-reveal variant="exp ico(te)">
  <details>
    <summary>
      <ui-content>
        <small data-part="eyebrow">Featured</small>
        <b data-part="headline">The trigger headline</b>
        <span data-part="summary">A short teaser that toggles the panel.</span>
      </ui-content>
      <ui-icon type="plus-cross" aria-hidden="true"></ui-icon>
    </summary>
    <ui-content>
      <small data-part="eyebrow">Featured</small>
      <h2 data-part="headline">The trigger headline</h2>
      <p data-part="summary">The full copy, now with real semantic structure.</p>
    </ui-content>
  </details>
</ui-reveal>
```

> **Phrasing vs flow — the content model differs between the two faces.** Inside `<summary>` only **phrasing** content is valid (`<b data-part="headline">`, `<span data-part="summary">`, `<small data-part="eyebrow">`); the revealed panel allows **flow / semantic** tags (`<h2 data-part="headline">`, `<p data-part="summary">`, `<address data-part="byline">`). Because styling keys off `data-part` and never the tag, the same part renders identically in both. See [content.md — Tag choice by context](../card/content.md).

### Reveal with media + overlay marker

For `flp` / `grw` / `sld`, wrap the front face in `<ui-face>` so it can transform independently of the toggle icon. Overlay **markers** (`<ui-chip>`, `<ui-sticker>`) are valid inside the `<summary>` media; overlay **controls** (`<ui-save>`, `<ui-play>`) are **not** — they are interactive, which is invalid in `<summary>` (a click there toggles the `<details>`).

```html
<ui-reveal variant="flp ovr(ts) rds(lg-sq) ico(te) ico(sm) icc(drk) scr"
           media="asr(1/1) hov(zoom) obp(tc)">
  <details name="flip">
    <summary>
      <ui-face>
        <ui-media>
          <img src="cover.jpg" alt="" loading="lazy">
          <ui-chip>New</ui-chip>            <!-- marker: valid in summary -->
        </ui-media>
        <ui-content><small>Gothic</small><strong>The Lure</strong></ui-content>
      </ui-face>
      <ui-icon type="plus-cross" aria-hidden="true"></ui-icon>
    </summary>
    <ui-content>
      <small data-part="eyebrow">Gothic</small>
      <h2 data-part="headline">The Lure</h2>
      <p data-part="summary">Darkwave from the old quarter — reverb, dread, and a baritone tuned until the strings flap.</p>
    </ui-content>
  </details>
</ui-reveal>
```

A shared `name` on the `<details>` makes a group of cards mutually exclusive (native behaviour).

### Required structure

- `<ui-reveal>` — component root (renders as a block; sets `container-type: inline-size`).
- `<details>` — direct child, one per card. Optional native `name` groups cards into a mutually-exclusive set. The renderer emits it **only** from the preset's `reveal.name` field — there is no `variant=` token for it and it is never inferred.
- `<summary>` — the front face. For `flp` / `sld` / `grw`, wrap it in `<ui-face>` — those three transform the front face, so they need a wrapper to transform. `exp` animates the **host**, so it needs no `<ui-face>` (and `render.js` emits one only for the three faced animations). `<ui-media>` / `<ui-content>` inside come from the card engine.
- `<ui-icon>` — the toggle. **Omitted entirely under `trg(card)`**: the whole summary is the trigger, so there is nothing for an icon to add. `render.js` emits no `<ui-icon>` when `reveal.trigger` is set.
- **One** element after `</summary>` — the panel. Use `<ui-content>` to give the back the card typography + `data-part` parts; the front-only `ovr()` overlay is reset on the back, so it renders as a normal flow column on the panel background.

> All reveal rules are **direct-child scoped** (`> details`, `> details > summary`), so you can nest other `<details>`-based components (e.g. a `<ui-accordion>` of FAQs) in the panel without them inheriting the card chrome, the floating icon, or the transforms.

---

## Reveal-specific `variant=` tokens

Reveal behaviour lives on the same space-separated, composable `variant=` attribute as the card tokens (`ovr()`, `rds()`, `bdr`, …) — mix them freely.

> **There is no `thm()` token.** The old `variant="thm(…)"` spelling was removed in v4; colour comes from the shared `theme=` attribute (`theme="gray"`, `theme="black dark"`). Migration mapping in [base/theme.md](../base/theme.md): `thm(dark)` → `theme="black dark"`, `thm(muted)` → `theme="slate dark"`, `thm(subtle)` → `theme="gray"`.

Argument vocabularies are **generated from the card manifest** (`ui/card/data/tokens.json`) —
the same file `render.js` and the token lint read, so this list cannot drift from
`ui-reveal.css`. The `md:/lg:` column is the container-tier prefix: only `grw()` (and its
deprecated `scl()` alias) has one.

<!-- tokens:summary attr=variant stems=exp,flp,sld,grw,scl,pop,trg,scr,ico,icc -->
| token | axis | args | aliases | bare | writes | md:/lg: | deprecated |
|---|---|---|---|---|---|---|---|
| `exp` | reveal-animation | — | — | yes | --_rvl | — | — |
| `flp()` | reveal-animation | **pos** top btm lft rgt | — | yes | --_rvl --_face-closed --_face-open --_panel-closed --_panel-open --ui-reveal-icon-clear | — | — |
| `sld()` | reveal-animation | **pos** top btm lft rgt | — | yes | --_rvl | — | — |
| `grw()` | reveal-animation | **pos** ts te bs be | — | yes | --_rvl --_scale-bs --_scale-be --_scale-is --_scale-ie | lg: (pos) | — |
| `scl()` | reveal-animation | **pos** ts te bs be | — | yes | --_rvl --_scale-bs --_scale-be --_scale-is --_scale-ie | lg: (pos) | yes → `grw` |
| `pop` | reveal-mode | — | — | yes | --ui-reveal-expand-m --ui-media-ar --ui-reveal-content-fs | — | — |
| `trg()` | reveal-mode | **value** card | — | — | — | — | — |
| `scr` | scroll | — | — | yes | — | — | — |
| `ico()` | reveal-icon | **pos** ts te bs be · **tone** drk sem · **size** sm lg | — | — | --ui-reveal-icon-bg --ui-reveal-icon-sz --_scale-bs --_scale-be --_scale-is --_scale-ie | — | — |
| `icc()` | reveal-icon | **pos** ts te bs be · **tone** drk sem · **size** sm lg | — | — | --ui-reveal-icon-bg --ui-reveal-icon-sz | — | — |
<!-- /tokens -->

| Token | Values | Effect |
|---|---|---|
| animation | *(omit)* `exp` · `flp` / `flp(top\|btm\|lft\|rgt)` · `sld` / `sld(top\|btm\|lft\|rgt)` · `grw` / `grw(ts\|te\|bs\|be)` | The reveal animation — ONE token that carries its own direction/origin (see below). Bare `flp`/`sld` come from the right; bare `grw` morphs from the `ico()` corner. |
| `lg:` animation | `lg:grw` (+ the deprecated `lg:scl`) | Swaps to the grow-morph at the `lg` width (≥ 44rem container), overriding the base one. **`grw` is the only animation with an `lg:` form** — there is no `lg:exp`, `lg:flp` or `lg:sld`. |
| `trg(card)` | `card` | Whole card toggles, front and back — and **no `<ui-icon>` is rendered**. |
| `pop` | *(bare flag)* | `exp` only — opens the card as a fixed, centered popup with a backdrop and pop-in. |
| `scr` | *(bare flag)* | Locks a long panel to the card frame and scrolls the overflow. `flp` (any width) and the grow-morph — `grw` or `lg:grw` — whenever it is the active animation. |
| `ico()` | corner + style + size words, one per token | Positions and styles the toggle icon (see below). |
| `icc()` | same words as `ico()` | Same words, applied only while the card is **open** (re-place / re-colour the icon on the back). |
| `bdr` / `bdr()` | shade `lgt` `drk` · width `sm` `md` `lg` | The card engine's hairline border. On a reveal it paints on the direct-child **`> details`** — the rounded surface — not on the `<ui-reveal>` host box, so it follows `rds()` corners and the flip/grow transforms. Same tokens as the card ([ui-card-tokens.md](../card/ui-card-tokens.md#border--bdr)). |

> `name` is the native `<details>` attribute (set on the inner `<details>`), not a reveal token. With `exp pop`, the in-flow `<ui-reveal>` stays as a placeholder (reserves the cell via `aspect-ratio`) and only the inner `<details>` goes `position: fixed`, so the surrounding grid never reflows.

### The animation token

| Token | Behaviour |
|---|---|
| *(omit)* | Plain disclosure — content shows/hides, no special motion. |
| `exp` | Panel expands open below the front face (height animation to `auto`). With `pop` it morphs into a fixed popup. |
| `flp` / `flp(top\|btm\|lft\|rgt)` | Card flips 180° to reveal the back. Wrap the front in `<ui-face>`. Direction in the value; bare = from the right. |
| `sld` / `sld(top\|btm\|lft\|rgt)` | Panel slides in over the face from an edge. Direction in the value; bare = from the right. |
| `grw` / `grw(ts\|te\|bs\|be)` | Panel morphs out from a corner, scaling to fill the card. Origin follows the `ico()` position, or pin it explicitly with the value. |

> **Renamed this round: `scl()` → `grw()`.** `scl()` is `content=`'s type-scale token, and one spelling should mean one thing even across attributes. `scl`, `scl(ts\|te\|bs\|be)`, `lg:scl` and its corner forms are kept as **deprecated aliases** — they still work in v4 and are removed in v5.

Every deprecated `variant=` spelling a reveal can carry, generated from the manifest:

<!-- tokens:aliases attr=variant -->
| deprecated | canonical | on | kind |
|---|---|---|---|
| `rds(none)` | `rds(non)` | `variant=` | arg |
| `scl()` | `grw()` | `variant=` | whole token |
<!-- /tokens -->

`ovr()`'s six physical aliases (`ovr(tl)` `ovr(tr)` `ovr(cl)` `ovr(cr)` `ovr(bl)` `ovr(br)`) were **removed in v5** — use the logical `ovr(ts)` `ovr(te)` `ovr(cs)` `ovr(ce)` `ovr(bs)` `ovr(be)`. There were six, not nine: `ovr(tc)` / `ovr(cc)` / `ovr(bc)` are spelled identically in both grids and are unaffected. `ico()` / `icc()` were always logical-only.

### `ico()` / `icc()` — toggle icon

One word per token — `ico(te) ico(sm)` anchors a small icon in the top-right corner. `icc()` takes the same words but applies only while open.

| Group | Words | Effect |
|---|---|---|
| Corner | `ts` `te` `bs` `be` | Anchors the icon in that corner (furniture spellings: top/bottom × start/end; logical axes, rtl-safe). Absolute, inset by `--ui-reveal-icon-m`. |
| Style | `drk` | Dark chrome — sets `--ui-reveal-icon-bg` to the neutral ramp's **`--ui-theme-black-bg`** bundle (a `light-dark()` pair that stays dark in *both* colour schemes, and picks up a `--ui-card-dark-bg` override so a branded card brands its icon) plus a real `color: var(--ui-theme-black-c, #fff)` for the glyph. Not a flat `#000`, and not `--color-text`, which would invert in dark mode. |
| Style | `sem` | Reduced opacity (`--ui-reveal-icon-opacity`, default `0.6`). |
| Size | `sm` `lg` | `sm` = `--size-5`, `lg` = `--size-8`. The **default is `--size-7` and has no token** — "medium" is the *absence* of a size word, so `ico(md)` / `icc(md)` do not exist. |

```html
<ui-reveal variant="flp ico(te) ico(sm) icc(be) icc(drk)">…</ui-reveal>
<ui-reveal variant="exp lg:grw ico(te)" theme="gray">…</ui-reveal>
```

---

## Reveal-specific tokens

Scoped to `:where(ui-reveal)` — low specificity, easy to override.

### Card

| Token | Default | Purpose |
|---|---|---|
| `--ui-reveal-bg` | `var(--color-surface)` | Card background. |
| `--ui-reveal-radius` | `var(--radius-2xl)` | Corner radius (overridden by `rds()` via `--ui-card-radius`). |
| `--ui-reveal-shadow` | `var(--shadow-xl)` | Card shadow. |
| `--ui-reveal-p` | `var(--ui-content-p, var(--spacing-md))` | Panel padding base. |
| `--ui-reveal-row-gap` | `1em` | Feeds the front-face `--ui-content-gap`. |
| `--ui-reveal-duration` | `var(--duration-slower)` | Animation duration. |
| `--ui-reveal-easing` | `var(--ease-in-out)` | Animation easing. |

### Panel (revealed content)

| Token | Default | Purpose |
|---|---|---|
| `--ui-reveal-content-bg` | `var(--ui-reveal-bg)` | Panel background. |
| `--ui-reveal-content-c` | `inherit` | Panel text colour. |
| `--ui-reveal-content-p` | `var(--ui-reveal-p)` | Panel padding. |
| `--ui-reveal-content-fs` | `inherit` / `var(--font-size-base)` | Panel font-size; also the body scale of a `<ui-content>` back. |
| `--ui-reveal-content-gap` | `1em` | Row gap between back blocks (roomier than the overlay-face gap). |
| `--ui-reveal-content-bs` | `auto` | Panel block-size in `scr` mode (locks the flip back to the closed-card frame). |
| `--ui-reveal-scrollbar-color` | `currentColor 40%` | Scrollbar thumb colour in `scr` mode. |
| `--ui-reveal-content-headline` | `var(--ui-content-headline-md)` | Back headline scale (when the back has no own `variant`). |
| `--ui-reveal-content-headline-line-height` | `var(--line-height-tight)` | Back headline line-height. |

### Icon

| Token | Default | Purpose |
|---|---|---|
| `--ui-reveal-icon-sz` | `var(--size-7)` | Icon button size (`ico(sm)` / `ico(lg)` override; the `--size-7` default has no token). |
| `--ui-reveal-icon-bg` | `var(--color-button)` | Icon background. `ico(drk)`/`icc(drk)` set it to `var(--ui-theme-black-bg)` — the neutral ramp's dark bundle, not a literal `#000` — and additionally set a real `color` for the glyph. |
| `--ui-reveal-icon-radius` | `var(--radius-circle)` | Icon shape. |
| `--ui-reveal-icon-m` | `var(--spacing-md)` | Icon inset from the edge (decoupled from content padding). |
| `--ui-reveal-icon-opacity` | `0.6` | Opacity for the `sem` modifier. |

### Flip / expand-popup

| Token | Default | Purpose |
|---|---|---|
| `--ui-reveal-perspective` | `1000px` | 3D perspective for `flp`. |
| `--ui-reveal-pop-scale` | `0.92` | Popup entry scale (`@keyframes ui-reveal-pop`). |
| `--ui-reveal-expand-aspect` | `16/9` | Popup aspect ratio (`pop`). |
| `--ui-reveal-expand-max-is` | `65ch` | Popup max inline-size. |
| `--ui-reveal-expand-content-fs` | `var(--font-size-base)` | Popup panel font-size. |
| `--ui-reveal-expand-bg` | `var(--ui-reveal-bg)` | Popup card panel background. |
| `--ui-reveal-expand-fixed-bg` | `transparent` | Fill on the in-flow placeholder (the cell the card lifted out of). |
| `--ui-reveal-expand-backdrop` | `color-mix(--color-surface 67%, transparent)` | Popup backdrop colour. |

---

## Shared DSL — inherited from the card engine

`<ui-reveal>` `@import`s the card engine, so it carries the **exact same** primitives and token strings. They are documented once on the card side — link, don't duplicate:

| DSL | On | Documents | Reference |
|---|---|---|---|
| `media=` | `<ui-media>` / any ancestor | frame, scrim, overlay markers, carousel — `asr()` `obp()` `obf()` `flp()` `hov()` `scm()` `nav()` `chip()` `sticker()` | [media.md](../card/media.md) |
| `content=` | `<ui-content>` / any ancestor | text column + parts — `scl()` `hl()` `gap()` · padding `pad()` `pb()` `pi()` `pbs()` `pbe()` `pis()` `pie()` · `rds()` `scr` | [content.md](../card/content.md) |
| `variant=` | `<ui-reveal>` | arrangement, overlay, corners — `col` `col-r` `row` `row-r` `spl()` `vis()` `ovr()` `rds()` `bdr` | [ui-card-tokens.md](../card/ui-card-tokens.md) |
| `theme=` | `<ui-reveal>` | colour — one hue + optional `pale` / `muted` / `light` / `dark` | [base/theme.md](../base/theme.md) |

```html
<ui-reveal variant="flp ovr(bs) rds(md-sq)" theme="black dark"
           media="asr(3/4) obp(cc) hov(zoom) scm" content="scl(xl) pad(lg) lg:pbs(none)"> … </ui-reveal>
```

Notes:

- **Squircle corners** — `rds(*-sq)` sets the card radius and `--ui-card-squircle-exp`; reveal reads that exponent to apply the same `corner-shape: superellipse()` to its `<details>`.
- **Overlay markers only in `<summary>`** — `<ui-chip>` / `<ui-sticker>` are valid in the trigger face; `<ui-save>` / `<ui-play>` are interactive controls and stay **card-only** (never inside `<summary>`).
- **Responsive front face** — `<ui-reveal>` is a `bs-card`-named container, so the card engine's `md:` / `lg:` prefixes apply to the front face. The **host arm** targets `<summary>` (reveal's queryable descendant, standing in for the card's `<cq-box>`); the **self arm** lets a `content=`/`media=` token sit on the `<ui-content>`/`<ui-media>` itself. Prefixable: `variant=` arrangement, `content=` size (`scl()`, `hl()`) and spacing (`gap()` + all seven padding tokens), and `media=`'s `asr()`.
- **`content="scr"` vs reveal `variant="… scr"`** — `content="scr"` is the content-column scroll (scrollable text + edge mask); the `scr` token on `variant=` is reveal's own panel scroll for `flp` / `lg:grw`. They are different mechanisms on different targets, but share **one** fade primitive — the `@property` / `@keyframes ui-scroll-fade` and the `--ui-scroll-fade-mask` gradient live in [`ui/base/scroll.css`](../base/scroll.css) and both scrollers consume it.

---

## Known limitations

- **`exp pop` inside a `lay-out-group` band.** A `variant="exp pop"` reveal opens as a
  `position: fixed` popup, and the component already releases its **own** containment for
  that (`container-type: normal` while open), plus `<lay-out>` carries an escape hatch for
  the section grid. Neither covers a `<lay-out-group>`: the group is a query container in
  its own right (`container-type: inline-size`, which implies `contain: layout`), so a
  popup opened from a card inside a group **band** is clipped to the band rather than
  filling the viewport. Rare enough that this round documents it rather than patching it.
  Workarounds: use `exp` without `pop` inside a group band, or place the popup-capable
  cards in a `<lay-out>` that is not wrapped in a `<lay-out-group>`.

---

## Browser support

| Feature | Required for | Minimum |
|---|---|---|
| `::details-content` | all reveal animations | Chrome 131+, Safari 18.1+, Firefox 131+ |
| `transition-behavior: allow-discrete` | enter/exit animation | Chrome 117+, Safari 17.4+, Firefox 129+ |
| `interpolate-size: allow-keywords` | `exp` height animation to `auto` | Chrome 129+ |
| `:has()` | `pop` popup state, `trg(card)` | Chrome 105+, Safari 15.4+, Firefox 121+ |
| Container queries | responsive front face, `lg:` animation swap | Chrome 105+, Firefox 110+, Safari 16+ |
| `corner-shape: superellipse(…)` | `rds(*-sq)` squircle corners | Chrome 135+ (falls back to normal rounding) |
| `animation-timeline: scroll()` | `scr` fade-shadow mask | Chrome 115+ (degrades to a plain scroll) |

Without `::details-content`, the component is not usable.

## HTML demo

See `index.html` in this package for live examples of every reveal animation, variant token, and combination.
