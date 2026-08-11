# Layout Component

## Overview

Layout is a **modern CSS layout system** with responsive grid patterns and automatic responsive image srcset generation. It works as pure CSS (no JavaScript required) with an optional web component for enhanced functionality.

## Architecture

### Package Structure

```
layout/
├── build.js              # Main CSS build script
├── layouts-map.js        # Generated layout definitions
├── layout.config.json    # Build configuration
├── readme.md             # User documentation
├── package.json          # NPM package configuration
├── core/                 # Core CSS files
│   ├── base.css          # Base styles
│   └── animations.css    # Animation utilities
├── layouts/              # Layout JSON definitions
│   ├── columns.json      # Equal column layouts
│   ├── grid.json         # Advanced grid patterns
│   ├── bento.json        # Bento box layouts
│   ├── mosaic.json       # Mosaic patterns
│   ├── asym.json         # Asymmetric layouts
│   ├── ratios.json       # Aspect ratio layouts
│   └── lanes.json        # Masonry/lanes layouts (CSS grid-lanes)
├── dist/                 # Built output
│   ├── layout.css        # Complete CSS bundle
│   └── index.html        # Visual demos
├── src/
│   ├── components/
│   │   └── layout/       # Optional web component
│   └── srcsets.js        # Srcset generation utilities
├── polyfills/
│   └── attr-fallback.js  # Safari/Firefox polyfill
└── docs/
    ├── BUILD.md          # Build documentation
    └── RUN.md            # Command reference
```

## Usage

### Basic (CSS Only)

```html
<link rel="stylesheet" href="@browser.style/layout/dist/layout.css">

<lay-out md="columns(2)" lg="grid(3a)">
  <div>Item 1</div>
  <div>Item 2</div>
  <div>Item 3</div>
</lay-out>
```

### Breakpoint Attributes

| Attribute | Breakpoint |
|-----------|------------|
| `xs` | 240px |
| `sm` | 380px |
| `md` | 540px |
| `lg` | 720px |
| `xl` | 920px |
| `xxl` | 1140px |

### Layout Types

#### Columns (Equal Width)
```html
<lay-out lg="columns(3)">...</lay-out>
```
Available: `columns(1)` through `columns(6)`

#### Grid (Advanced Patterns)
```html
<lay-out lg="grid(3a)">...</lay-out>
```
19 variants with different item arrangements

#### Bento (Box Layouts)
```html
<lay-out lg="bento(6a)">...</lay-out>
```
10 variants for dashboard-style layouts

#### Mosaic (Patterns)
```html
<lay-out lg="mosaic(hex)">...</lay-out>
```
5 variants including hexagonal patterns

#### Asymmetric
```html
<lay-out lg="asym(l-r)">...</lay-out>
```
6 variants for sidebar/content layouts

#### Ratios
```html
<lay-out lg="ratios(2:1)">...</lay-out>
```
9 variants for aspect ratio-based layouts

#### Autofit
```html
<lay-out xs="auto(fit)">...</lay-out>
```
2 variants for auto-fitting grids

#### Lanes (Masonry)
```html
<lay-out sm="lanes(2)" lg="lanes(4)">...</lay-out>
<lay-out sm="lanes(2)" lg="lanes(auto)" lanes-min="12rem">...</lay-out>
```
6 variants for CSS `display: grid-lanes` masonry layouts. Uses CSS columns fallback for browsers without grid-lanes support. Supports `lanes-min` and `lanes-max` attributes for configurable column sizing.

Two things to know when touching this:

- **Safari 26 ships `display: grid-lanes`; Chromium does not** (verified — Chromium 145 supports no masonry syntax at all, and neither engine has `item-flow`/`grid-template-rows: masonry`). So both arms of the `@supports` are live in the wild and must agree. The fallback's `column-count` maths mirrors `repeat(auto-fill, minmax(lanes-min, 1fr))` — `floor((W + gap) / (min + gap))` — including the `10rem` default, which must stay in sync with the track list in `layouts/lanes.json`.
- **Lane items carry `min-inline-size: 0`.** As grid items their automatic minimum is min-content, so anything with an `aspect-ratio` or a definite `min-block-size` transfers that into a minimum *width* and overflows its lane. The column-count fallback never needed this (block boxes just fill the column), which is why it only surfaced when Safari shipped grid-lanes.

Config note: `lanes` is generated for `sm`/`md`/`lg` only (`layout.config.json`), but the static `@supports` selector matches all six breakpoints — so `xl="lanes(3)"` flips on `display: grid-lanes` with no track list and collapses to one lane. Add the breakpoint to the config before using it.

#### Stack (Overlapping Layers)
```html
<lay-out xs="stack(hero)">
  <div>Back layer</div>
  <div>Front layer</div>
</lay-out>
```
Stacks every direct child into the **same grid cell** (`--layout-gtc: 1fr` on the container, `--layout-ga: 1 / 1` on the children) so they overlap. Any name works — the selector is a substring match on `stack(`, so `stack(hero)`, `stack(overlay)`, `stack(my-thing)` are the same rule. Paint order is DOM order (last child on top, no `z-index` involved), the tallest child sets the height, and children keep normal grid-item alignment, so `place-self` / margins position them within the shared cell.

`stack(reveal)` is the one reserved name: it additionally makes the layout a sticky full-height cage (`core/base.css`) and redirects an `animate-self="reveal(…)"` onto its last child (`core/animations.css`) — the scroll-driven layer-peel in `dist/reveal-stack.html`. It depends on the generic rule above for the overlap.

For a badge or label over an image, prefer `<ui-media>` furniture (`ui-chip`/`ui-beacon`/`ui-sticker`/`ui-save`/`ui-play`) — it has a real 3×3 position grid and theming. `stack()` is for whole-layer composition, where the children are arbitrary.

### Breakpoint Spacing Tokens

Spacing is **token-only** — card-style tokens embedded alongside layout tokens in the breakpoint attributes. **There are no bare `pad-inline` / `pad-top` / `col-gap` etc. attributes** (removed in v4); every spacing value lives inside a breakpoint attribute. Tokens are multipliers of `--layout-space-unit` in two spellings: **numbers** (`0`–`4`, e.g. `cg(2)`) and **word sizes** on the content-DSL ladder — `2xs` 0.125 · `xs` 0.25 · `sm` 0.5 · `md` 1 · `lg` 1.5 · `xl` 2 · `2xl` 3 (`cg(2xs)` = a 2px hairline at the default 1rem unit; the collision-safe needle includes the closing paren, so `cg(2)` never matches `cg(2xs)`). Both write the `--layout-*` custom props that `base.css`/`group.css` compose into padding/margin/gap. Tokens are generated at the breakpoints in the `spacing.breakpoints` allowlist — shipped config: `["xs","lg"]` (`xs` = the mobile-first base) — so gaps can change per allowlisted breakpoint: `xs="columns(2) cg(sm)" lg="grid(3a) cg(2xs)"`. Add a breakpoint (e.g. `xl` for mosaic tiers) to the allowlist to author spacing there.

| Token | CSS Custom Property(ies) | CSS Property |
|-------|-------------------|--------------|
| `p(N)` | `--layout-pi` + `--layout-pbs` + `--layout-pbe` | `padding` (all sides) |
| `pi(N)` | `--layout-pi` | `padding-inline` |
| `pb(N)` | `--layout-pbs` + `--layout-pbe` | `padding-block` |
| `pbs(N)` | `--layout-pbs` | `padding-block-start` |
| `pbe(N)` | `--layout-pbe` | `padding-block-end` |
| `mbs(N)` | `--layout-mbs` | `margin-block-start` |
| `mbe(N)` | `--layout-mbe` | `margin-block-end` |
| `cg(N)` | `--layout-colmg` | `column-gap` |
| `rg(N)` | `--layout-rg` | `row-gap` |

Margin is **block-only** (`mbs`/`mbe`) by design — `margin-inline` stays `auto` for centering. Tokens are generated for **both** `<lay-out>` and `<lay-out-group>` (via `:is(...)`).

```html
<!-- xs has no min in the default config, so it is the mobile-first base -->
<lay-out xs="p(1)" md="columns(2) pi(2) pb(1)" lg="columns(4) p(4)">
```

The lowest breakpoint (`xs`, no `min`) emits its rules **without** a media query — the mobile-first base; larger breakpoints override via cascade-layer order. Values persist until a larger breakpoint overrides them. Selectors use `*=` (contains match) so multiple tokens fit in one attribute value; this is collision-safe because every value is delimited as `token(N)`.

**Which tokens are generated is config-gated** — a top-level `spacing.tokens` default, overridable per breakpoint with `breakpointConfig.spacing` — so a project trims CSS by listing only the tokens each breakpoint needs (see [Configuration Options](#configuration-options)). Generated in `generateSpacingCSS()` in `src/builder.js`.

### Subgrid — `subgrid`

Breakpoint token (generated `md`+ only, in `generateSubgridCSS()`), using `~=`
exact-token matching:

- **`subgrid`** — each direct child adopts N shared rows (`grid-template-rows: subgrid`), aligning their internal rows across the grid. **N comes from the global `subgrid="N"` attribute** (one value, read via `attr()` into `--_sg`; `~=` matching keeps the token and the attribute from ever colliding); the child's own `container-type` is neutralised so its inline-size container doesn't sever the subgrid chain. Mechanically, the builder emits only a **flag flip** (`--_subgrid`, a non-inheriting registered property) plus the container's own physical rows; the per-child body lives once in `core/base.css` behind `@container style(--_subgrid: on)`.
- **One-way by design** — there is no off token. `@media (min-width)` is cumulative, so once a breakpoint commits to shared rows every larger one keeps them; a layout that switches to subgrid doesn't switch back. (The old `subgrid(on)`/`subgrid(off)` pair was removed with this simplification.)

> **The token is an attribute-selector value** in the generated CSS
> (`lay-out[md~="subgrid"]`). App/demo CSS that hooks the subgrid state by *token*
> must match the **exact** string — migrating the markup means migrating those
> selectors too (sweep `*.css`, not just `*.html`). CSS that hooks the *state*
> should instead read the flag (`@container style(--_subgrid: on)`), which is
> breakpoint-agnostic — that is what the card's `sub` variant does, below.

**Subgrid + `<ui-card>` — the `sub` variant (wrapper flattening).** `subgrid` only
reaches the **direct** child of `<lay-out>`. Flat children (`<article><img><h3><small>`)
map their parts onto the shared rows for free. A **card** nests its parts two wrappers
deep (`ui-card > cq-box > ui-media | ui-content > eyebrow/headline/CTA`), and every
wrapper breaks the chain. Opt the card in with **`variant="sub"`** and the card system
dissolves those wrappers, so the leaf parts become the card's own grid items:

```html
<lay-out lg="columns(3) subgrid" subgrid="4">
  <ui-card variant="col sub" media="asr(16/9)"><cq-box>
    <ui-media><img src="…" alt=""></ui-media>
    <ui-content><small data-part="eyebrow">…</small><h3 data-part="headline">…</h3><nav data-part="actions">…</nav></ui-content>
  </cq-box></ui-card>
  …
</lay-out>
```

No per-demo CSS is needed any more (`demo-assets/wpp.css` used to hand-write the
`display: contents` pair; `demo-assets/wpp.html` and `dist/section.html` now both use
`sub`). The implementation lives in `ui/card/ui-card.css` (near the arrangement
section) and is a **two-hop flag relay**:

```css
/* hop 1 — subject is the card, so the style query resolves against the <lay-out> */
@container style(--_subgrid: on) {
  :where(lay-out) > :where(ui-card):where([variant~="sub"]) { --_sub: 1; }
}
/* hop 2 — --_sub INHERITS, so the wrappers can read it (--_subgrid does not) */
@container style(--_sub: 1) {
  :where(ui-card[variant~="sub"]) > cq-box,
  :where(ui-card[variant~="sub"]) > cq-box > ui-content { display: contents; }
}
```

Two hops are required, not stylistic: a style query resolves against the **subject's
parent**. `<cq-box>`'s parent is the card, which has no `--_subgrid` of its own because
that property is registered `inherits: false` — the single-hop form
(`@container style(--_subgrid: on) { … > cq-box }`) matches nothing in Chromium
(verified). Hop 1 therefore relays into `--_sub`, an ordinary inheriting custom
property. A host nested inside another host resets `--_sub` to `0`, so a subgridded
outer card can't flatten an inner one.

**`sub` names no breakpoint — it follows the flag.** Because it syncs to the live
`--_subgrid` value rather than to a breakpoint of its own, changing
`lg="columns(3) subgrid"` to `xl="…"` (or `md=`, or several) needs **no card-side
change**: the flag goes on and off with the layout's own breakpoint and `sub` follows.
`dist/section.html` syncs at `md`, `demo-assets/wpp.html` at `lg`, with identical card
markup.

Known consequences, by design: `display: contents` drops `<ui-content>`'s own box
(padding/gap), so vertical rhythm comes from the layout's row gaps (`rg(N)`); and the
subgrid engine's `container-type: normal` on the child suspends the card's own
`md:`/`lg:` **container** tiers for as long as the flag is on. `<ui-media>` is
deliberately *not* flattened — it is the row-1 grid item. `<ui-reveal>` is **not**
supported (`details > summary` cannot be dissolved without destroying the disclosure).
Full token reference: `ui/card/docs/ui-card-tokens.md`.

### Item alignment — `items()` breakpoint token

The bare `items` attribute was **removed in v4**. Block-axis alignment of the layout's
own children (grid cells / flex slides) is a builder-generated **per-breakpoint token**:
`items(start|center|end|stretch)` inside the breakpoint attributes, e.g.
`lg="columns(2) items(start)"` to stop unequal-height cells stretching to the tallest.
It writes `--layout-ai` (composed into `align-items` by `base.css`); exotic values keep
the `style="--layout-ai: …"` escape hatch. Generated by `generateAlignmentCSS()` in
`src/builder.js` for all breakpoints.

### Carousel controls — `overflow` + `media=` tokens

The `overflow` attribute (full reference: `core/base.md`) turns a layout into a
horizontal scroller/carousel — its `preview*` / `center` / `frame` / `gaps` / `fade*` /
`none` / `stop` vocabulary is unchanged in v4. **The carousel controls, however, moved
from individual attributes into the `media=` token attribute**: the `nav`, `arrow=`,
`dot=`, `pages`, `auto=` and carousel `loop` attributes were removed from `<lay-out>`.

```html
<lay-out bleed md="columns(1)" overflow="preview-2xl center"
         media="nav(blw) arw(bare) mrk(pll) pages auto(4s) loop">
```

- **Shared vocabulary** with `<ui-media>` (styles in `ui/carousel/carousel.css`): bare
  `nav`, `nav(mrk|arw|blw|abv)`,
  `arw(arr|sm|lg|xl|sqr|sft|hid|lgt|drk|bare|set|rev|ts|tc|te|cs|cc|bs|bc|be|blw|abv)`,
  `mrk(sm|md|lg|xl|pll|hyb|tmb|bar|lbl|non|lgt|drk|ts…be|blw|abv)`, `tmb(<ratio>)`,
  `pages` (bare token, `~=` matched), `auto` / `auto(4s)` and `loop`. `loop`/`auto` are
  progressive enhancement driven by the shared carousel script in `@browser.style/card`.
  **The two placement grids differ by one cell**: `mrk()` has all nine
  (`ts tc te cs cc ce bs bc be`), `arw()` has **eight** — there is no `arw(ce)`, that
  cell is `arw(set)`'s own default.
- **Not available on `<lay-out overflow>`:** `axis(y)` (the layout scroller is always
  inline-axis) and therefore `mrk(rail)`, which requires `axis(y)` + `mrk(tmb)`. Both
  are `<ui-media>`-only.
- **Demo:** `dist/carousel.html` (source `src/pages/carousel.html`) covers the whole
  control vocabulary. The geometry tokens (`preview*`/`center`/`frame`/`gaps`/`stop`)
  are demoed separately in `dist/overflow.html` — that page is deliberately
  control-free and animation-free.
- **Scoping rule:** `media=` on a `<lay-out>` configures **only the lay-out's own
  scroller** — it never inherits into descendant `<ui-media>` inside cards (`media=`
  inheritance stops at the nearest `ui-card`/`ui-reveal` host). `content=`, by
  contrast, flows down freely via custom-property inheritance (which is why it works on
  `<lay-out-group>` headers and beyond).
- **`stagger` remains a standalone attribute** — it's the cross-component stagger
  engine, not a carousel control.
- **Safari has no controls without the polyfill.** Dots and arrows are
  `::scroll-marker` / `::scroll-button()`, gated on
  `@supports (scroll-marker-group: after)` — Chromium-only today. `<lay-out overflow>`
  is a first-class target of `/ui/carousel/polyfill/carousel.js`, which injects real
  `<button>` controls and styles them from the same tokens; it matches
  `lay-out[overflow]` directly and measures the **slide pitch** rather than assuming
  one slide per scrollport, which is what makes an N-up gapped card row page
  correctly. Contract and pitfalls: [`/polyfill/readme.md`](../ui/carousel/polyfill/readme.md).
  Without it the carousel is still a native swipeable scroller, just uncontrolled.

### Animations

Scroll-driven animations via `animate-self` (container) and `animate` (children) attributes. **The engine now lives in `@browser.style/base`** (`ui/base/animate.css` + the `@keyframes` in `ui/base/animations.css`, `@layer bs-core`) so any component can use `[animate]`/`[animate-self]` — load base alongside `layout.css`. The only animation rule still in this package is **`stack(reveal)`** (`core/animations.css`, `@layer layout.animations`), which is layout-domain (keys off the `stack()` layout token + breakpoint attributes). The `--ease-*` easing tokens also moved to base (`ui/base/easings.css`). Full engine docs: `core/animations.md`.

#### Syntax

Animations use function-call syntax with an optional multiplier: `fade-up()`, `fade-up(2)`, `fade-up(3)`.

#### Container Animation (`animate-self`)

Animates the entire `lay-out` element using `animation-timeline: view()`.

```html
<lay-out animate-self="fade-up()" lg="columns(3)">
```

#### Item Animation (`animate`)

Creates a named `view-timeline: --animate-tl` on the container; children animate independently using that timeline with staggered offsets.

```html
<lay-out animate="fade-up()" lg="columns(3)">
```

**Modifiers** (space-separated in the attribute):
- `clip` — sets `overflow: clip` on the container
- `deep` — animates grandchildren with two-level stagger (item offset + child offset)
- `trigger` — scroll-triggered entry animation (Chrome 145+)
- `trigger-exit` — scroll-triggered exit animation
- `trigger-both` — scroll-triggered entry + exit

**Stagger**: nth-child fallback offsets `animation-range` per child (up to 6 children, 20% offset each). `sibling-index()` behind `@supports` scales to any child count.

#### Available Animations

| Category | Animations |
|----------|-----------|
| **Bounce** | `bounce()` `bounce-in-up()` `bounce-in-down()` `bounce-in-left()` `bounce-in-right()` |
| **Fade** | `fade-in()` `fade-out()` `fade-up()` `fade-down()` `fade-left()` `fade-right()` `fade-up-left()` `fade-up-right()` `fade-down-left()` `fade-down-right()` |
| **Flip** | `flip-up()` `flip-down()` `flip-left()` `flip-right()` `flip-diagonal()` |
| **Reveal** (container only) | `reveal(circle)` `reveal(inset)` `reveal(polygon)` `reveal(superellipse)` — `[animate-self]` arm only, no child arm |
| **Reveal** (shape, both arms) | `reveal(hex)` `reveal(star)` `reveal(rhomb)` `reveal(plus)` `reveal(circ)` — clip endpoints from the shared `--shp-*` catalog (`ui/base/shapes.css`) |
| **Slide** | `slide-up()` `slide-down()` `slide-in()` `slide-out()` |
| **Zoom** | `zoom-in()` `zoom-in-rotate()` `zoom-out()` `zoom-out-rotate()` |
| **Other** | `opacity()` |

#### Pace

Controls animation speed. **The `pace` attribute was removed in v4 (system-wide)** — its words are plain tokens inside the `animate` / `animate-self` value, e.g. `animate="bounce() trigger-both slow"`.

**Entry speed:** `very-slow`, `slow`, *(default)*, `fast`, `very-fast` — maps to `animation-range` values.

**Exit tokens:** `exit`, `exit-fast`, `exit-slow` — activate a second animation slot in reverse (scroll-driven mode only).

#### Scroll-Triggered Mode (Chrome 145+)

Behind `@supports (timeline-trigger-name: --t)`. Scroll position *starts* the animation but doesn't control its progress — animations play at a fixed `--animate-dur` duration.

| Token | Direction | `animation-trigger` keyword |
|-------|-----------|---------------------------|
| `trigger` | Entry only | `play-forwards` |
| `trigger-exit` | Exit only | `play-backwards` |
| `trigger-both` | Both | `play-forwards play-backwards` |

Stagger uses `animation-delay` with `sibling-index()` multiplied by `--animate-stagger` (default `10`) and `--animate-delay` (default `0.005s`). Pace tokens map to `--animate-dur` in this mode.

**Important:** `animation-trigger` requires literal keywords — `var()` cannot be used for play direction.

#### Progressive Enhancement Layers

1. **Scroll-driven** (`@supports (view-transition-name: none)`) — base support
2. **`sibling-index()`** (`@supports (width: calc(sibling-index() * 1px))`) — dynamic stagger
3. **Scroll-triggered** (`@supports (timeline-trigger-name: --t)`) — time-based with trigger tokens

#### Morph Overlay

> **Not implemented.** `morph()` is specced here and in `core/animations.md` but no CSS defines it in either the base engine or the layout `stack(reveal)` file. Treat this section as a spec until built.

The `morph()` function in `animate-self` or `animate` adds a solid-color `::after` pseudo-element that covers the `lay-out` and morphs away via `clip-path` on scroll, revealing content underneath. Differs from `reveal-*` animations (which clip the element itself with opacity) -- morph overlays are opaque pseudo-elements with clip-path only.

| Value | Shape |
|-------|-------|
| `morph(circle)` | Circle shrinks to point |
| `morph(inset)` | Rectangle contracts from edges |
| `morph(polygon)` | Rectangle morphs to diamond |

Set `--layout-morph-bg` to match the previous section's background for seamless transitions. Reuses the pace/exit tokens (in the same `animate-self` value) and the `easing` attribute via inherited custom properties. Can combine with other animations in the same attribute.

```html
<lay-out bleed="0" animate-self="morph(circle) slow"
         style="--layout-bg: white; --layout-morph-bg: navy;">
```

## Responsive Images

### Automatic Srcset Generation

```javascript
import { srcsetMap, srcsetConfig } from '@browser.style/layout/maps';
import { generateSrcsets } from '@browser.style/layout/src/srcsets.js';

const srcsets = generateSrcsets(
  { md: "columns(2)", lg: "grid(3a)" },
  srcsetMap,
  srcsetConfig
);
// Returns: "540:50%;720:50%,50%,100%@1024"
```

### Apply to Existing Elements

```javascript
import { applySrcsets } from '@browser.style/layout/src/srcsets.js';

applySrcsets('lay-out', srcsetMap, srcsetConfig);
```

### Manual Srcsets

```html
<lay-out srcsets="540:50%;720:50%,50%,100%@1024">
  <img src="image.jpg">
</lay-out>
```

## Web Component (Optional)

```javascript
import '@browser.style/layout/src/components/layout/index.js';
```

Provides:
- Automatic srcset generation from breakpoint attributes
- Adds `sizes` attributes to child images
- Works with responsive image loading

## Custom Configuration

### layout.config.json

```json
{
  "element": "lay-out",
  "core": ["base"],
  "common": ["animations"],
  "layoutContainer": {
    "element": "body",
    "maxWidth": 1024,
    "margin": "1rem",
    "setRoot": true
  },
  "breakpoints": {
    "md": {
      "type": "@media",
      "min": "768px",
      "layouts": ["columns"]
    },
    "lg": {
      "type": "@media",
      "min": "1024px",
      "layouts": [
        "columns",
        { "grid": ["grid(3a)", "grid(3c)"] }
      ]
    }
  }
}
```

### Configuration Options

| Option | Description |
|--------|-------------|
| `element` | HTML element name for layout containers |
| `core` | Core CSS files to include |
| `common` | Common CSS files to include |
| `spacing.steps` | Steps generated for each spacing token: numbers (`[0,1,2,3,4]`) and/or labeled word sizes (`{"label":"2xs","value":0.125}` → `cg(2xs)`) |
| `spacing.tokens` | Default spacing-token vocabulary emitted for every breakpoint (`p`, `pi`, `pb`, `pbs`, `pbe`, `mbs`, `mbe`, `cg`, `rg`) |
| `spacing.breakpoints` | Optional allowlist — generate spacing tokens only for these breakpoints (e.g. `["xs","lg"]`); omit for all |
| `layoutContainer.maxWidth` | Max container width (generates `--layout-bleed-mw`) |
| `layoutContainer.margin` | Inline margin (generates `--layout-mi`) |
| `layoutContainer.setRoot` | Apply margin calculation to element |
| `breakpoints` | Define breakpoints and included layouts; omit `min`/`max` on the lowest to make it the un-media-queried mobile-first base |
| `breakpoints.<bp>.spacing` | Per-breakpoint override of the token list (array; `[]` disables spacing tokens for that breakpoint) |

**No `include` option any more** — the layout package no longer bundles base CSS
(`animations.css`, `stagger.css`) or the carousel controls. Load `@browser.style/base`
alongside `layout.css` for the animation `@keyframes` and the `stagger` engine, and
`@browser.style/carousel` for the `media=` carousel controls (`nav()`/`arw()`/`mrk()`).

### The dependency contract (declared since 2026-08-03)

`layout/package.json` used to declare **zero** dependencies while relying on two things it
could not see. Both are now `peerDependencies` — `@browser.style/base` (required) plus
`@browser.style/carousel` and `@browser.style/card` (optional, needed only for carousels).
What the contract actually consists of:

1. **Four custom properties owned by another package.** `layout/core/base.css` reads
   `--ui-carousel-controls-bg`, `--ui-carousel-below-gap`, `--ui-carousel-band` and
   `--ui-carousel-above-gap` to reserve the control band, each with a **hardcoded fallback**
   (`0.5rem`, `2.75rem`) that must be kept in sync **by hand** with
   `ui/carousel/carousel.css`. Change a default there and this file does not follow.
   Layout renders without the carousel package — it just falls back to those literals.
2. **Load order, not layer order.** The `[animate]`/`[animate-self]`/`[easing]` engine and
   the `@keyframes` library live in `@browser.style/base` (`@layer bs-core`); layout keeps
   only the `stack(reveal)` redirect, which wins **because base is loaded first**. Load
   layout before base and the redirect loses.
3. **Two more things base owns outright, both required by `overflow="fade*"`.** Since the
   scroll-edge fade was unified (v4), `core/base.css` no longer defines its own keyframes or
   mask layers — it only sets knobs and points four declarations at base's engine:
   - **`ui/base/scroll.css`** — the eight `@property` registrations plus the
     `ui-scroll-fade-s` / `ui-scroll-fade-e` keyframes and the `--ui-scroll-fade-mask`
     gradient. Without base loaded the keyframes don't exist and `fade*` paints nothing (the
     `mask` resolves to `none`), so the carousel degrades to a plain scroller — no error, just
     no fade. There is **no hardcoded fallback** for this one, unlike the four carousel
     properties above.
   - **`--_dir-s` / `--_dir-e`** (`ui/base/core.css`) — the direction resolver the fade's
     gradient reads (`--ui-scroll-fade-dir: to var(--_dir-e)`). Absent it, the gradient
     direction is invalid and the mask dies at computed-value time. Never add a per-family
     `:dir(rtl)` arm here; that pair is the one resolver.
   Both are shared with the card system, so the engine's defaults (`3rem` edge, `10%` ramp)
   are the card-side ones — layout overrides all four knobs to `--layout-preview-size` and
   `1rem`/`2rem`. Every engine property is registered `inherits: false`, which is what keeps a
   fading carousel from leaking its edge width into a `content="scr"` scroller nested inside
   one of its slides.

## Creating Custom Layouts

### 1. Create Layout JSON

```json
{
  "name": "Hero Layouts",
  "prefix": "hero",
  "layouts": [
    {
      "id": "1",
      "columns": "2fr 1fr",
      "items": 2,
      "srcset": "66.67%,33.33%",
      "icon": [
        { "w": 66.67, "h": 100, "x": 0, "y": 0 },
        { "w": 33.33, "h": 100, "x": 66.67, "y": 0 }
      ]
    }
  ]
}
```

### 2. Reference in Config

```json
"breakpoints": {
  "lg": {
    "layouts": [{ "hero": ["hero(1)"] }]
  }
}
```

### 3. Use

```html
<lay-out lg="hero(1)">
  <div>Main content</div>
  <aside>Sidebar</aside>
</lay-out>
```

## Build Commands

```bash
npm run build         # Build CSS
npm run build:maps    # Generate layouts-map.js
npm run build:demo    # Generate HTML demos
npm run build:icons   # Generate SVG icons
npm run build:all     # Build everything
```

## Browser Support

- Chrome/Edge 89+
- Firefox 88+
- Safari 14.1+

### Safari/Firefox Polyfill

For enhanced `attr()` CSS function support:

```html
<script type="module" src="@browser.style/layout/polyfills/attr-fallback.js"></script>
```

## CSS Custom Properties

Two project-level knobs, emitted on `:root` by the build (from
`layoutContainer` in `layout.config.json`). Override per project from CSS loaded
after `layout.css` — a plain `:root` override wins, no rebuild:

```css
:root {
  --layout-bleed-mw: 1024px;  /* Max content width (centering column) */
  --layout-mi: 1rem;          /* Min inline margin (side gutter)      */
}
```

The build pairs them with a `:has()`-gated container rule so the stylesheet is a
true drop-in — inert until a `<lay-out>` exists, then `<body>` becomes the layout
container:

```css
body:has(lay-out) {
  margin-inline: max(var(--layout-mi), 50cqw - var(--layout-bleed-mw) / 2);
  max-inline-size: none;  /* clears base's :where(body) reading column */
  padding-inline: 0;      /* the calculated margin owns inline spacing */
}
```

The knobs live on `:root`, **not** on the `body:has()` rule — declaring them
directly on `<body>` would beat an inherited `:root` override and lock projects
to the defaults. Generated by `generateLayoutContainerCSS()` in `src/builder.js`.

### Page-gap: `data-layout-root` + `data-page-gap`

The `body:has(lay-out)` rule owns page **width** only. Vertical spacing between
stacked top-level `<lay-out>` sections comes from a separate, opt-in rule in
`core/base.css` (static, not builder-generated):

```css
[data-layout-root] {
  display: grid;
  row-gap: calc(attr(data-page-gap type(<number>), attr(page-gap type(<number>), 1)) * var(--layout-space-unit, 1rem));
}
```

Mark the element that **directly contains** the top-level `<lay-out>`s with
`data-layout-root` (usually `<body>`; use `<main>` when the sections live inside
one — `row-gap` only affects direct grid children, so it must sit on the true
parent). `data-page-gap="N"` = `N × --layout-space-unit` (default `1`; the fallback
`1rem` is needed because `--layout-space-unit` is declared on `<lay-out>`, a
descendant, not an ancestor). **`data-*` prefixed** because the root is a native
element (`<body>`/`<main>`) where a bare `page-gap` is invalid HTML; the bare
`page-gap` attribute is still read as a **legacy fallback**, so existing markup
keeps working — migrate to `data-page-gap` when convenient. Because it's `row-gap`
on the direct parent,
**nested `<lay-out>`s (carousel slide grids inside `<ui-media>`) are untouched.**
All direct children become grid tracks, so headings/intros are spaced by the
same gap — reset their block margins if the gap alone should govern rhythm.

### Section headers — `<lay-out-group>` (`core/group.css`)

For a section that needs a **header above the grid** (eyebrow / title / subtitle /
"see all" link, à la BBC / WPP), wrap an optional header `<ui-content>` and the
`<lay-out>` in a `<lay-out-group>` — a custom element in the `lay-out` family, so it
takes the same `bleed` attribute plus the same **breakpoint spacing tokens** as
`<lay-out>` (`p`, `pi`, `pb`, `pbs`, `pbe`, `mbs`, `mbe`, `cg`, `rg`):

```html
<lay-out-group bleed xs="pbs(3) pbe(3)" style="--layout-bg:#eaf6e9">   <!-- all optional -->
  <ui-content>                              <!-- the header -->
    <small data-part="eyebrow">Our work</small>
    <h2    data-part="headline">World-class ideas</h2>
    <p     data-part="summary">Optional subtitle.</p>
    <a     data-part="link" href="/work">View all →</a>
  </ui-content>
  <lay-out md="columns(2)" lg="grid(3a)"> …cards… </lay-out>
</lay-out-group>
```

Unregistered (pure CSS, like `<ui-card>`). Key properties:

- **Header is inside the box but outside `<lay-out>`** — it never becomes a grid
  item, so the `nth-child` placement of every pattern (columns, grid, bento,
  asym, mosaic) is unaffected. Works over *any* layout.
- **Header is a `<ui-content>`, not `<header>`** — a native `<header>` in this
  custom element can expose a stray `banner` role; the `<h2 data-part="headline">`
  carries the heading. **This makes the header depend on card's `content.css`**
  (`@browser.style/card`): the eyebrow/headline/summary/meta typography is reused
  verbatim from it, so load `ui-card.css` (it `@import`s `content.css`) alongside
  `layout.css`. `group.css` styles **only the header layout** (the 1fr/auto grid +
  padding reset). Layer order puts `layout.base` after `bs-component`, so the grid
  override wins while content.css's `[data-part]` rules apply untouched.
- **The `link` part is group-specific** — `content.css` has no `link` part, so
  `group.css` styles + end/bottom-aligns it, dropping it below the heading on narrow
  (`< 30rem`) viewports.
- **Theme / bleed**: `<lay-out-group [bleed] style="--layout-bg:…">` paints a
  themed band. `bleed` escapes the `data-layout-root` width like `lay-out[bleed]`
  (its own simplified band — no per-item bleed scaling); the inner `<lay-out>`
  stays content-width and **must not** carry its own `bleed`/`--layout-bg`.
- **Header width**: content-column by default (aligns with the grid). Opt into a
  full-band header with `<ui-content data-bleed>` (data-* toggle).
- **Vertical spacing** uses the same bare `<lay-out>` vocabulary (valid on the
  custom element): `pb`/`pbs`/`pbe` tokens = inner padding *within* the band;
  `mbs`/`mbe` tokens = outer margin (added to `page-gap`), set on the same
  breakpoint attributes as `<lay-out>` (e.g. `xs="pbs(3) pbe(3)"`). It's
  `box-sizing: border-box` so padding doesn't disturb the bleed width math.
- **Styling parts**: use the `content=` DSL / `--ui-content-*` props on the header
  `<ui-content>` (e.g. `content="hl(lg)"`, `--ui-content-headline: 2rem`) — same API
  as any card `<ui-content>`. Group tunables: `--layout-group-gap` (header→grid),
  `--layout-group-bg`/`-c`.

`core/group.css` (no comments — full docs in `readme.md`) is bundled via
`layout.config.json` `core: ["base","group"]`. Demo: `dist/section.html` (loads
`ui-card.css` for the header typography). SSR target (deferred): `renderSection()`
emits this `<lay-out-group><ui-content>…</ui-content><lay-out>…</lay-out></lay-out-group>`
from a section JSON with an optional `header` object (see `docs/card-integration.md`
Phase 4).

## Performance

Rendering-performance policy — which properties composite, the `will-change` rules and
the measured cost of the scroll-fade mask and `stack(reveal)`: `docs/gpu-performance.md`
(repo root).

- **Zero JavaScript**: Pure CSS, no runtime overhead
- **Small Bundle**: ~12 KB gzipped
- **No Layout Shift**: Grid-based, prevents CLS
- **Cacheable**: Static CSS, fully cacheable

## LayoutBuilder Class

The build system is powered by the `LayoutBuilder` class:

```javascript
class LayoutBuilder {
  constructor(configPath, layoutsDir, outputPath, coreDir)

  // Main methods
  async build()           // Full build process
  async loadConfig()      // Load layout.config.json
  async loadLayouts()     // Load layout JSON files
  async loadCSSFiles()    // Load core/common CSS
  async processBreakpoints()  // Generate breakpoint CSS
  async generateCSS()     // Output final CSS

  // Internal methods
  generateMediaQuery(breakpointConfig)
  processLayout(layoutName, breakpointName, mediaQuery, ...)
  generateLayoutCSS(layout, prefix, layoutId, breakpointName, mediaQuery, ...)
  addRule(mediaQuery, selector, properties)
  generateLayoutContainerCSS()
}
```

### Build Pipeline

1. Load `layout.config.json`
2. Load all JSON files from `/layouts/` directory
3. Load core CSS files (base.css)
4. Load common CSS files (animations.css)
5. Process each breakpoint configuration
6. Generate CSS rules for each layout pattern
7. Output to `dist/layout.css`

## Srcset Utilities

### `generateSrcsets(breakpoints, srcsetMap, srcsetConfig)`

Generates srcset string from breakpoint attributes:

```javascript
generateSrcsets(
  { md: "columns(2)", lg: "grid(3a)" },
  srcsetMap,
  srcsetConfig
);
// Returns: "540:50%;720:50%,50%,100%@1024"
```

### `applySrcsets(selector, srcsetMap, srcsetConfig)`

Applies srcsets attribute to existing elements:

```javascript
applySrcsets('lay-out', srcsetMap, srcsetConfig);
// Adds srcsets="..." to all <lay-out> elements
```

### `calculateSizes(srcsets, childIndex)`

Calculates `sizes` attribute for a specific child:

```javascript
calculateSizes("540:50%;720:50%,50%,100%@1024", 0);
// Returns: "(min-width: 720px) min(50vw, 512px), ..."
```

## Layout JSON Structure

Each layout file follows this structure:

```json
{
  "name": "Grid Layouts",
  "prefix": "grid",
  "layouts": [
    {
      "id": "3a",
      "columns": "1fr 1fr",
      "items": 3,
      "srcset": "50%,50%,100%",
      "icon": [
        { "w": 50, "h": 50, "x": 0, "y": 0 },
        { "w": 50, "h": 50, "x": 50, "y": 0 },
        { "w": 100, "h": 50, "x": 0, "y": 50 }
      ],
      "rules": [
        {
          "selector": ":nth-child(3)",
          "properties": { "--layout-ga": "1 / -1" }
        }
      ]
    }
  ]
}
```

### Layout Properties

| Property | Description |
|----------|-------------|
| `id` | Layout identifier (used as `grid(3a)`) |
| `columns` | CSS `grid-template-columns` value |
| `rows` | CSS `grid-template-rows` value |
| `items` | Expected number of child items |
| `srcset` | Image width percentages for each item |
| `icon` | SVG preview rectangles for builder UI |
| `rules` | Additional CSS rules for items |

## Available Layouts (Complete)

### Columns (6 variants)
`columns(1)` through `columns(6)`

### Grid (19 variants)
`grid(3a)`, `grid(3b)`, `grid(3c)`, `grid(3d)`,
`grid(4a)` through `grid(4e)`,
`grid(5a)` through `grid(5h)`,
`grid(6a)`, `grid(6b)`

### Bento (10 variants)
`bento(4a)`,
`bento(6a)`, `bento(6b)`,
`bento(7a)`, `bento(7b)`, `bento(7c)`,
`bento(8a)`, `bento(8b)`,
`bento(9a)`, `bento(9b)`

### Mosaic (5 variants)
`mosaic(photo)`, `mosaic(scatter)`, `mosaic(hex)`,
`mosaic(pinwheel)`, `mosaic(cornerstone)`

### Asymmetric (6 variants)
`asym(l-r)`, `asym(r-l)`, `asym(t-b)`, `asym(b-t)`,
`asym(tl-br)`, `asym(bl-tr)`

### Ratios (9 variants)
`ratio(25:75)`, `ratio(33:66)`, `ratio(40:60)`,
`ratio(60:40)`, `ratio(66:33)`, `ratio(75:25)`,
`ratio(25:25:50)`, `ratio(25:50:25)`, `ratio(50:25:25)`

### Autofit (2 variants)
`auto(fit)`, `auto(fill)`

### Lanes (6 variants)
`lanes(2)`, `lanes(3)`, `lanes(4)`, `lanes(5)`, `lanes(6)`, `lanes(auto)`

### Stack (any name)
`stack(<name>)` — overlapping layers in one grid cell. `stack(reveal)` is reserved (sticky cage + reveal redirect).

## File Structure (Detailed)

```
layout/
├── build.js              # CLI entry point (~56 lines)
├── layouts-map.js        # Generated srcset/config export (~76 lines)
├── layout.config.json    # Build configuration
├── core/
│   ├── base.css          # Base grid styles
│   ├── base.md           # Base documentation
│   └── animations.css    # Animation utilities
├── layouts/
│   ├── columns.json      # Equal columns (1-6)
│   ├── grid.json         # Grid patterns (19 variants)
│   ├── bento.json        # Bento boxes (10 variants)
│   ├── mosaic.json       # Mosaic patterns (5 variants)
│   ├── asymmetrical.json # Asymmetric (6 variants)
│   ├── ratios.json       # Ratio-based (9 variants)
│   ├── autofit.json      # Auto-fit/fill (2 variants)
│   └── lanes.json        # Masonry/lanes (6 variants)
├── src/
│   ├── builder.js        # LayoutBuilder class (~329 lines)
│   ├── srcsets.js        # Srcset utilities (~79 lines)
│   ├── demo.js           # Demo page script
│   ├── maps.js           # Layout maps helper
│   ├── icons.js          # Icon generation
│   └── components/
│       ├── layout/index.js   # Optional web component
│       └── composer/         # Visual layout composer (predates the v4 attribute
│                             #   changes — emits pre-v4 attributes; stale)
├── polyfills/
│   ├── attr-fallback.js  # Safari/Firefox polyfill
│   └── attr-fallback.css # Polyfill styles
├── dist/
│   ├── layout.css        # Built CSS bundle
│   └── *.html            # Demo pages
└── docs/
    ├── BUILD.md          # Build documentation
    └── RUN.md            # Run commands
```

## Browser quirks & workarounds

Engine-specific behaviour this package works around. Each one is a real, verified
defect with a load-bearing fix in `core/base.css` — don't remove them as dead code.

### Bleed can produce a horizontal scrollbar in Safari

**Symptom:** a page with `bleed` gets a sliver of horizontal scroll in Safari; Chrome
is fine.

**Cause — two different references for "the viewport":**

| | unit | includes a space-taking scrollbar? |
|---|---|---|
| Page column (`body:has(lay-out)`) | `50cqw` | **no** — container units measure the content box |
| All bleed maths (`[bleed]`, `group.css`) | `100dvi` / `50dvi` | **yes** — viewport units span the full viewport |

Under **overlay** scrollbars the two agree, which is why Chrome on macOS never shows
it. Under **space-taking** scrollbars they diverge by the scrollbar width, so the
bleed band is sized and offset against a wider reference than the column it is
escaping. Safari uses space-taking scrollbars when *Show scroll bars: Always* is set,
or when a mouse is attached.

**Workaround** (`core/base.css`, near the top of `@layer layout.base`):

```css
@supports (-webkit-hyphens: none) {
  html:has(:is(lay-out, lay-out-group)[bleed]) { overflow-x: clip; }
}
```

- `-webkit-hyphens` is the WebKit gate — true in Safari and in every iOS browser
  (all WebKit, same behaviour), false in Chrome/Edge/Firefox.
- **`clip`, not `hidden`.** `clip` does not create a scroll container, so
  `position: sticky` (the `stack(reveal)` cage) and the scroll-driven view-timelines
  keep working. Only the inline axis is clipped; the block axis stays `visible`,
  which is the one combination allowed alongside `clip`.
- `:has()`-scoped so it is inert on pages that never bleed.

**This treats the symptom, not the cause.** The principled fix is to make the bleed
maths reference the same box as the column (subtract a measured scrollbar width, or
move both onto one unit). That touches every bleed calculation plus `group.css`, so
it needs verification in real Safari with space-taking scrollbars — headless
Playwright uses overlay scrollbars in both engines and cannot reproduce the
condition (`::-webkit-scrollbar` styling and `scrollbar-gutter: stable` both leave
the gutter at 0).

### Masonry: `display: grid-lanes` is Safari-only today

Verified, not assumed — and note that general web-guidance sources still say masonry
ships nowhere:

| syntax | Safari 26 | Chromium 145 |
|---|---|---|
| `display: grid-lanes` | **yes**, and it applies | no |
| `grid-template-rows: masonry` | no | no |
| `item-flow` / `item-pack` / `item-slack` | no | no |

So `display: grid-lanes` is the current spelling and **both arms of the `@supports`
pair are live in the wild** — they must agree. Two things keep them in sync:

- **`min-inline-size: 0` on lane children.** Lane items are grid items, so their
  automatic minimum is min-content; an `aspect-ratio` or definite `min-block-size`
  transfers that into a minimum *width* and the item overflows its lane, overlapping
  its neighbours. This is ordinary grid behaviour — plain `display: grid` does the
  same — and the column-count fallback never needed it because block boxes just fill
  the column. That is why it only surfaced when Safari shipped grid-lanes.
- **The fallback's `column-count` mirrors `auto-fill`:**
  `floor((W + gap) / (min + gap))`, including the `10rem` `--layout-lanes-min`
  default, which must match the track list in `layouts/lanes.json`. Getting either
  wrong makes the engines disagree on lane count at the same width.

**Config gap:** `lanes` is generated for `sm`/`md`/`lg` only, but the static
`@supports` selector matches all six breakpoints — so `xl="lanes(3)"` flips on
`display: grid-lanes` with no track list and collapses to one lane. Add the
breakpoint to `layout.config.json` before using it.

### Typed `attr()` has no fallback in Safari/Firefox

Repo-wide sharp edge (see `ui/base/polyfills/readme.md`). For this package it means
`lanes-min` / `lanes-max`, `bleed`, `columns`, `rows`, `max-width`, `self` and `size`
only work in Safari because `polyfills/attr-fallback.js` writes them back as inline
styles — a demo page that omits that script gets a *missing* value, not a wrong one,
and the consuming property dies at computed-value time. `CSS.supports('--x', 'attr(…)')`
is `true` in Safari, so feature-detect on a **real** property.

## Debugging Tips

1. **Layout not applying?** Check breakpoint attribute matches viewport
2. **Items not fitting?** Verify layout expects correct number of items
3. **Safari/Firefox issues?** Include the polyfill
4. **Images not sized correctly?** Check srcsets attribute format
5. **Build failing?** Check layout.config.json is valid JSON
6. **Missing layout?** Ensure layout is referenced in config breakpoints
7. **Stray horizontal scrollbar in Safari?** See *Browser quirks* above — a `bleed`
   band against space-taking scrollbars
8. **Masonry looks scrambled / items overlap?** Lane children need
   `min-inline-size: 0`; see *Browser quirks* above
