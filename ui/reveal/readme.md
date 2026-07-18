# @browser.style/reveal

A CSS-first **disclosure** built on native `<details>` / `<summary>`, composed over the same card engine as `<ui-card>`. The `<summary>` is the trigger face; the revealed panel is `::details-content` (everything after `</summary>`). Four reveal animations — `rvl(exp)`, `rvl(flp)`, `rvl(sld)`, `rvl(scl)` — plus a full-card trigger (`trg(card)`) and an expand-to-popup mode (`pop`), all configured through the same `variant=` token attribute `<ui-card>` uses. No JavaScript required.

`<ui-reveal>` `@import`s `ui-card.css`, so it shares the card primitives and DSLs verbatim: the **`media=`** frame ([media.md](../card/media.md)), the **`content=`** text column ([content.md](../card/content.md)), and the **`variant=`** arrangement / overlay / theme / corners ([ui-card-tokens.md](../card/ui-card-tokens.md)). This package adds only the reveal-specific parts: the `<details>` / `<summary>` wiring, `<ui-icon>`, `<ui-face>`, and the reveal `variant=` tokens (`rvl()`, `frm()`, `ico()`, …) that drive the animations.

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
@import '@browser.style/icon';
@import '@browser.style/reveal/style';
```

---

## Quick start

### Basic disclosure

`<details>` is the direct child; `<summary>` is the front face; one element after `</summary>` is the panel. Use `<ui-content>` for the panel so it inherits the card typography + `data-part` engine.

```html
<ui-reveal variant="rvl(exp) ico(te)">
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

For `rvl(flp)` / `rvl(scl)` / `rvl(sld)`, wrap the front face in `<ui-face>` so it can transform independently of the toggle icon. Overlay **markers** (`<ui-chip>`, `<ui-sticker>`) are valid inside the `<summary>` media; overlay **controls** (`<ui-save>`, `<ui-play>`) are **not** — they are interactive, which is invalid in `<summary>` (a click there toggles the `<details>`).

```html
<ui-reveal variant="rvl(flp) ovr(tl) rds(lg-sq) ico(te) ico(sm) icc(drk) scr"
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
- `<details>` — direct child, one per card. Optional `name` groups cards into a mutually-exclusive set.
- `<summary>` — the front face. For `rvl(flp)` / `rvl(scl)` / `rvl(sld)`, wrap it in `<ui-face>`. `<ui-media>` / `<ui-content>` inside come from the card engine.
- `<ui-icon>` — the toggle (optional with `trg(card)`).
- **One** element after `</summary>` — the panel. Use `<ui-content>` to give the back the card typography + `data-part` parts; the front-only `ovr()` overlay is reset on the back, so it renders as a normal flow column on the panel background.

> All reveal rules are **direct-child scoped** (`> details`, `> details > summary`), so you can nest other `<details>`-based components (e.g. a `<ui-accordion>` of FAQs) in the panel without them inheriting the card chrome, the floating icon, or the transforms.

---

## Reveal-specific `variant=` tokens

Reveal behaviour lives on the same space-separated, composable `variant=` attribute as the card tokens (`ovr()`, `thm()`, `rds()`, …) — mix them freely.

| Token | Values | Effect |
|---|---|---|
| `rvl()` | *(omit)* `rvl(exp)` `rvl(flp)` `rvl(sld)` `rvl(scl)` | Reveal animation (see below). |
| `lg:rvl()` | `lg:rvl(scl)` | Swaps the animation to `scale` at the `lg` width (≥ 44rem container), overriding the base `rvl()`. |
| `frm()` | `frm(lft)` `frm(rgt)` *(default)* `frm(top)` `frm(btm)` | Direction for `rvl(flp)` / `rvl(sld)`. |
| `trg(card)` | — | Whole card toggles, front and back — no `<ui-icon>` needed. |
| `pop` | — | `rvl(exp)` only — opens the card as a fixed, centered popup with a backdrop and pop-in. |
| `scr` | — | Locks a long panel to the card frame and scrolls the overflow. `rvl(flp)` (any width) and `lg:rvl(scl)` (≥ 44rem). |
| `ico()` | position + style + size words, one per token | Positions and styles the toggle icon (see below). |
| `icc()` | same words as `ico()` | Same words, applied only while the card is **open** (re-place / re-colour the icon on the back). |

> `name` is the native `<details>` attribute (set on the inner `<details>`), not a reveal token. With `rvl(exp) pop`, the in-flow `<ui-reveal>` stays as a placeholder (reserves the cell via `aspect-ratio`) and only the inner `<details>` goes `position: fixed`, so the surrounding grid never reflows.

### `rvl()` — animation

| Token | Behaviour |
|---|---|
| *(omit)* | Plain disclosure — content shows/hides, no special motion. |
| `rvl(exp)` | Panel expands open below the front face (height animation to `auto`). With `pop` it morphs into a fixed popup. |
| `rvl(flp)` | Card flips 180° to reveal the back. Wrap the front in `<ui-face>`. Direction via `frm()`. |
| `rvl(sld)` | Panel slides in over the face from an edge. Direction via `frm()`. |
| `rvl(scl)` | Panel morphs out from the icon's corner, scaling to fill the card. Morph origin follows the `ico()` position. |

### `ico()` / `icc()` — toggle icon

One word per token — `ico(te) ico(sm)` anchors a small icon in the top-right corner. `icc()` takes the same words but applies only while open.

| Group | Words | Effect |
|---|---|---|
| Corner | `ts` `te` `bs` `be` | Anchors the icon in that corner (furniture spellings: top/bottom × start/end; logical axes, rtl-safe). Absolute, inset by `--ui-reveal-icon-m`. |
| Style | `drk` | Solid dark icon (default is light). |
| Style | `sem` | Reduced opacity (`--ui-reveal-icon-opacity`, default `0.6`). |
| Size | `sm` `lg` | `sm` = `--size-5`, default = `--size-7`, `lg` = `--size-8`. |

```html
<ui-reveal variant="rvl(flp) ico(te) ico(sm) icc(be) icc(drk)">…</ui-reveal>
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
| `--ui-reveal-icon-sz` | `var(--size-7)` | Icon button size (`sm` / `lg` override). |
| `--ui-reveal-icon-bg` | `var(--color-button)` | Icon background (`drk` sets `#000`). |
| `--ui-reveal-icon-radius` | `var(--radius-circle)` | Icon shape. |
| `--ui-reveal-icon-m` | `var(--spacing-md)` | Icon inset from the edge (decoupled from content padding). |
| `--ui-reveal-icon-opacity` | `0.6` | Opacity for the `sem` modifier. |

### Flip / expand-popup

| Token | Default | Purpose |
|---|---|---|
| `--ui-reveal-perspective` | `1000px` | 3D perspective for `rvl(flp)`. |
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
| `content=` | `<ui-content>` / any ancestor | text column + parts — `scl()` `pad()` `gap()` `scr` | [content.md](../card/content.md) |
| `variant=` | `<ui-reveal>` | arrangement, overlay, theme, corners — `col` `col-r` `row` `row-r` `spl()` `vis()` `ovr()` `thm()` `rds()` | [ui-card-tokens.md](../card/ui-card-tokens.md) |

```html
<ui-reveal variant="rvl(flp) ovr(bl) rds(md-sq) thm(dark)"
           media="asr(3/4) obp(cc) hov(zoom) scm" content="scl(xl) pad(lg)"> … </ui-reveal>
```

Notes:

- **Squircle corners** — `rds(*-sq)` sets the card radius and `--ui-card-squircle-exp`; reveal reads that exponent to apply the same `corner-shape: superellipse()` to its `<details>`.
- **Overlay markers only in `<summary>`** — `<ui-chip>` / `<ui-sticker>` are valid in the trigger face; `<ui-save>` / `<ui-play>` are interactive controls and stay **card-only** (never inside `<summary>`).
- **Responsive front face** — `<ui-reveal>` is a container, so the card engine's `md:` / `lg:` prefixes apply to the front face (`variant` arrangement + `content=` spacing). The queryable descendant for the `@container` rules is the `<summary>` subtree (not `<cq-box>`). `media=` tokens and `scl()` are not breakpoint-prefixed this round.
- **`content="scr"` vs reveal `variant="… scr"`** — `content="scr"` is the content-column scroll (scrollable text + edge mask); the `scr` token on `variant=` is reveal's own panel scroll for `rvl(flp)` / `lg:rvl(scl)`. They are different mechanisms on different targets, but share **one** fade primitive — the `@property` / `@keyframes ui-scroll-fade` and the `--ui-scroll-fade-mask` gradient live in [`ui/base/scroll.css`](../base/scroll.css) and both scrollers consume it.

---

## Browser support

| Feature | Required for | Minimum |
|---|---|---|
| `::details-content` | all `rvl()` animations | Chrome 131+, Safari 18.1+, Firefox 131+ |
| `transition-behavior: allow-discrete` | enter/exit animation | Chrome 117+, Safari 17.4+, Firefox 129+ |
| `interpolate-size: allow-keywords` | `rvl(exp)` height animation to `auto` | Chrome 129+ |
| `:has()` | `pop` popup state, `trg(card)` | Chrome 105+, Safari 15.4+, Firefox 121+ |
| Container queries | responsive front face, `lg:rvl()` | Chrome 105+, Firefox 110+, Safari 16+ |
| `corner-shape: superellipse(…)` | `rds(*-sq)` squircle corners | Chrome 135+ (falls back to normal rounding) |
| `animation-timeline: scroll()` | `scr` fade-shadow mask | Chrome 115+ (degrades to a plain scroll) |

Without `::details-content`, the component is not usable.

## HTML demo

See `index.html` in this package for live examples of every reveal animation, variant token, and combination.
