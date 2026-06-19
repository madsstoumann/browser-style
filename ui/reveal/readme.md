# @browser.style/reveal

A CSS-only reveal card built on native `<details>` and `<summary>`. The front face lives in `<summary>`; the revealed content lives in `::details-content`. Four animation types — `expand`, `flip`, `slide`, `scale` — plus an optional full-card trigger and an expand-to-popup mode. No JavaScript required.

`ui-reveal` inherits the host-agnostic layout/typography engine from [`@browser.style/card`](../card/readme.md): variants (`overlay()`, `ar()`, `op()`, `fs()`, `sq()`, `vertical-r`, `horizontal`, `media-only`, …), `<ui-media>` and `<ui-content>`. This package adds only the reveal-specific parts: the `<details>`/`<summary>` wiring, `<ui-icon>`, `<ui-face>`, and the four animation types.

## Features

- Native `<details>` / `<summary>` — accessible, keyboard-navigable, works without JS.
- Four reveal animations: `expand`, `flip`, `slide`, `scale`.
- `trigger="card"` — the whole card toggles, front and back; interactive panel content still works.
- `expand` + `to="viewport"` opens the card as a fixed, centered popup — CSS-only, with an in-flow placeholder so the surrounding grid doesn't shift.
- Toggle icon with position / style / size modifiers, plus a separate open-state icon (`icon-close`).
- Full ui-card variant vocabulary (aspect ratio, object position, overlay placement, squircle corners, media layout).
- Light/dark mode and full theming via design tokens.

---

## Install

```bash
npm install @browser.style/reveal
```

Peer dependencies:

```bash
npm install @browser.style/base @browser.style/card @browser.style/icon
```

> `@browser.style/base` provides the token system; `@browser.style/card` provides the shared card engine; `@browser.style/icon` provides `<ui-icon>`.

---

## Usage

```css
@import '@browser.style/base';
@import '@browser.style/card/style';
@import '@browser.style/icon';
@import '@browser.style/reveal/style';
```

```html
<ui-reveal type="flip" icon="top right sm" variant="overlay(bl) ar(3/4) op(cc)">
  <details>
    <summary>
      <ui-face>
        <ui-media><img src="card.jpg" alt="" loading="lazy"></ui-media>
        <ui-content><small>Category</small><strong>Title</strong></ui-content>
      </ui-face>
      <ui-icon type="plus-cross" aria-hidden="true"></ui-icon>
    </summary>
    <div>
      <h3>Back face</h3>
      <p>Revealed content…</p>
    </div>
  </details>
</ui-reveal>
```

### Required structure

- `<ui-reveal>` — component root (renders as a plain block).
- `<details>` — direct child. One per card. Add a shared `name` to make a group of cards mutually exclusive.
- `<summary>` — the front face (required by `<details>`).
  - For `flip`/`scale`/`slide`, wrap the front face in `<ui-face>` so it can transform independently of the toggle icon.
  - `<ui-media>` / `<ui-content>` inside come from ui-card.
- `<ui-icon>` — the toggle (optional with `trigger="card"`).
- **One** non-summary element after `<summary>` — the panel content. **Wrap multiple elements in a single `<div>`** (or `<article>`). `::details-content` is a slot-like pseudo: you can't add a combinator after it, so panel layout is applied to that single wrapper, not to `::details-content` itself. (See [Technical notes](#technical-notes).)
  - Use **`<ui-content>`** as that wrapper to give the back the same card typography + `data-part` parts (eyebrow / headline / summary / tags…) as the front. The front-only `ov()` overlay (which leaks via descendant selectors) is reset on the back, so it renders as a normal flow column on the panel background — dark-on-light, left-aligned, base font-size. Override the back scale with `--ui-reveal-content-fs`.

> Everything in `<ui-reveal>` is **direct-child scoped** (`> details`, `> details > summary`). You can safely nest other `<details>`-based components (e.g. a `<ui-accordion>` of FAQs on a flip card's back) in the panel — they won't inherit the card chrome, the floating icon, or the flip/slide/scale transforms.

---

## API

### `type` — animation

| Type | Behavior |
|---|---|
| *(none)* | Plain disclosure — content shows/hides with no special motion. |
| `expand` | Panel expands open below the front face (height animation). With `to="viewport"` it morphs into a fixed popup (see below). |
| `flip` | Card flips 180° to reveal the back face. Wrap the front in `<ui-face>`. Direction via `from`. |
| `slide` | Panel slides in over the face from an edge. Direction via `from`. |
| `scale` | Panel morphs out from the icon's corner, scaling to fill the card. |

### `from` — direction (flip / slide)

`left` · `right` (default) · `top` · `bottom`. For `flip`, closed/open states stay on the same rotation axis so the transform interpolates as a clean rotation.

### `trigger="card"`

The entire card is the toggle — front *and* back — no `<ui-icon>` needed. Clicks fall through the open panel to the `<summary>` beneath; interactive panel content (`a`, `button`, `input`, `select`, `textarea`, `[tabindex]`) opts back in automatically. The focus ring moves to the card itself.

### `to` — expand to popup (`type="expand"` only)

`to="viewport"` opens the card as a fixed, centered popup with a backdrop and a pop-in (scale + fade). **Pure CSS, no JavaScript** — driven entirely by the native `<details>` `[open]` state.

The outer `<ui-reveal>` stays in normal flow as a **placeholder** (it reserves the closed tile's cell via its `aspect-ratio`), and only the inner `<details>` goes `position: fixed`. So the surrounding grid never reflows — **no background layout shift**. The backdrop lives on `ui-reveal::before` (not `details::before`), because `details` runs a scale transform during the pop animation, which would otherwise become the containing block for — and clip — a fixed pseudo.

### `icon` / `icon-close`

Space-separated tokens on the `icon` attribute position and style the toggle icon. `icon-close` applies the same tokens but only while the card is **open** (e.g. move/recolor the icon on the back face).

| Group | Tokens | Effect |
|---|---|---|
| Position | `top` `bottom` `left` `right` | Anchors the icon to that corner/edge (absolute). |
| Style | `dark` | Solid dark icon (default is light). |
| Style | `semi` | Reduced opacity (`--ui-reveal-icon-opacity`, default `0.6`). |
| Size | `sm` `lg` | `sm` = `--size-5`, default = `--size-7`, `lg` = `--size-8`. |

```html
<ui-reveal icon="top right sm" icon-close="bottom right dark" type="flip">…</ui-reveal>
```

### `variant` — inherited from ui-card

Space-separated, combinable. Common ones:

| Variant | Effect |
|---|---|
| `ar(…)` | Aspect ratio: `1/1` `6/7` `3/4` `4/3` `3/2` `2/3` `16/9` `21/9`. |
| `op(…)` | Image object-position: `tl tc tr cl cc cr bl bc br`. |
| `overlay(…)` | Place `<ui-content>` over the media with a scrim: `tl tc tr cl cc cr bl bc br`. |
| `fs(…)` | Font-size scale: `sm` `md` `lg` `xl`. |
| `sq(…)` | Squircle corners: `sm` `md` `lg` `xl` (sets radius + curvature together). |
| `vertical-r` | Content above media (default is media above content). |
| `horizontal` / `horizontal-r` | Side-by-side media/content (and reversed). |
| `media-only` | Hide `<ui-content>` — image-only face. |

See the [card readme](../card/readme.md) for the full list.

### Responsive front — `variant-md` / `variant-lg`

`<ui-reveal>` is a container, so the card engine's responsive tiers apply to the
**front face** too. Give the front a base `variant` and a wider-width override —
e.g. a classic stacked card when narrow that becomes an overlay hero when wide:

```html
<ui-reveal type="expand" variant="vertical ar(16/9)"
           variant-lg="ov(bl) sc ar(21/9) op(cc) fs(xl)"> … </ui-reveal>
```

Below 44rem the front is media-above-content; at/above 44rem the content stacks
over the media with a scrim and a display headline. (`type="expand"` lets the
revealed panel grow to fit a long flipside; `scale`/`flip` lock it to the card
frame.)

---

## Tokens

Scoped to `:where(ui-reveal)` — low specificity, easy to override.

### Card

| Token | Default | Purpose |
|---|---|---|
| `--ui-reveal-bg` | `var(--color-surface)` | Card background. |
| `--ui-reveal-radius` | `var(--radius-2xl)` | Corner radius (overridden by `sq()` via `--ui-card-radius`). |
| `--ui-reveal-shadow` | `var(--shadow-xl)` | Card shadow. |
| `--ui-reveal-p` | `var(--spacing-md)` | Padding (feeds the shared ui-card spacing). |
| `--ui-reveal-row-gap` | `var(--spacing-sm)` | Row gap inside `<ui-content>` and the panel wrapper. |
| `--ui-reveal-duration` | `var(--duration-slower)` | Animation duration. |
| `--ui-reveal-easing` | `var(--ease-in-out)` | Animation easing. |

### Panel (revealed content)

| Token | Default | Purpose |
|---|---|---|
| `--ui-reveal-content-bg` | `var(--ui-reveal-bg)` | Panel background. |
| `--ui-reveal-content-c` | `inherit` | Panel text color. |
| `--ui-reveal-content-p` | `var(--ui-reveal-p)` | Panel padding. |
| `--ui-reveal-content-fs` | `inherit` / `base` | Panel font-size; also the body scale of a `<ui-content>` back. |
| `--ui-reveal-content-bs` | `auto` | Panel block-size in `scroll` mode (locks the flip back to the closed-card frame). |
| `--ui-reveal-scrollbar-color` | `currentColor 40%` | Scrollbar thumb colour in `scroll` mode. |

#### `<ui-content>` back overrides

When the panel is a `<ui-content>` (see [Required structure](#required-structure)), it inherits the card typography but the front-only `ov()` overlay is reset. These tune the back's own scale, decoupled from the front face's `fs()`:

| Token | Default | Purpose |
|---|---|---|
| `--ui-reveal-content-gap` | `1em` | Row gap between back blocks (roomier than the tight overlay-face gap). |
| `--ui-reveal-content-headline` | `var(--ui-card-headline-md)` | Back headline scale (won't grow with a `fs(xl)` face). |
| `--ui-reveal-content-headline-line-height` | `var(--line-height-tight)` | Back headline line-height (stays readable if the face uses a tight display value). |

### Icon

| Token | Default | Purpose |
|---|---|---|
| `--ui-reveal-icon-sz` | `var(--size-7)` | Icon button size (`sm`/`lg` modifiers override). |
| `--ui-reveal-icon-bg` | `var(--color-button)` | Icon background (`dark` modifier sets `#000`). |
| `--ui-reveal-icon-radius` | `var(--radius-circle)` | Icon shape. |
| `--ui-reveal-icon-m` | `var(--ui-reveal-p)` | Icon inset from the edge. |
| `--ui-reveal-icon-opacity` | `0.6` | Opacity for the `semi` modifier. |

### Flip / expand-popup

| Token | Default | Purpose |
|---|---|---|
| `--ui-reveal-perspective` | `1000px` | 3D perspective for `flip`. |
| `--ui-reveal-expand-aspect` | `16/9` | Popup aspect ratio (`to`). |
| `--ui-reveal-expand-max-is` | `65ch` | Popup max inline-size. |
| `--ui-reveal-expand-content-fs` | `var(--font-size-base)` | Popup panel font-size. |
| `--ui-reveal-expand-backdrop` | `color-mix(... 67% transparent)` | Popup backdrop color. |
| `--ui-reveal-pop-scale` | `0.92` | Popup entry scale (`@keyframes ui-reveal-pop`). |

---

## Technical notes

### `::details-content` is a slot — lay out on the wrapper

`::details-content` is a slot-like pseudo-element: you can't add a combinator after it, so its children are unreachable and `display: grid` on it is unreliable. It only carries inherited (font-size) and box props (padding, background, the block-size animation). Therefore the disclosed content **must be wrapped in a single element** (e.g. `<div>`), and panel layout is applied to that wrapper — the single non-summary child of `<details>`.

### Direct-child scoping

All rules target `> details` / `> details > summary`. A reveal card is always `ui-reveal > details > summary`, so the rules never reach `<details>`/`<summary>` belonging to nested components placed in the panel — which would otherwise inherit the card background/radius/shadow, the floating-circle icon, and the flip/slide/scale transforms.

### Flip rotation axis

The closed and open states of both the face and the panel are kept on the **same** rotation axis (e.g. both `rotateY`), so the transform interpolates as a rotation. Mixing axes would fall back to matrix interpolation and degenerate at 180°. `from` swaps which axis/sign is used.

### Expand popup animates on open only

In `to` popup mode the transition lives on the `[open]` state, so closing falls back to the no-transition base rule and snaps shut — preventing block-size drift back into the main grid when the fixed chrome drops.

### Flip icon dip

For `type="flip"`, the `<ui-icon>` fades out as the card turns edge-on, then fades back in once the new face lands. The open and close states carry identical keyframes under different names, so toggling restarts the animation. Runs only under `prefers-reduced-motion: no-preference`.

---

## Browser support

| Feature | Required for | Minimum |
|---|---|---|
| `::details-content` | all reveal types | Chrome 131+, Safari 18.1+, Firefox 131+ |
| `@starting-style` / `transition-behavior: allow-discrete` | enter/exit animation | Chrome 117+, Safari 17.4+, Firefox 129+ |
| `interpolate-size: allow-keywords` | height animation to `auto` | Chrome 129+ |
| `corner-shape: superellipse(…)` | `sq()` squircle corners | Chrome Canary 151+ (falls back to normal rounding) |
| `:has()` | `to="viewport"` popup state, full-card trigger | Chrome 105+, Safari 15.4+, Firefox 121+ |

Without `::details-content`, the component is not usable.

---

## HTML demo

See `index.html` in this package for live examples of every type, variant, and combination.
