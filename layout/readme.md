# @browser.style/layout

Modern CSS layout system with responsive grid patterns and responsive image srcsets.

---

## Quick Start

### Install

```bash
npm install @browser.style/layout
```

### Use Pre-built CSS

```html
<!DOCTYPE html>
<html>
<head>
  <link rel="stylesheet" href="node_modules/@browser.style/layout/dist/layout.css">
</head>
<body>
  <lay-out md="columns(2)" lg="grid(3a)">
    <div>Item 1</div>
    <div>Item 2</div>
    <div>Item 3</div>
  </lay-out>
</body>
</html>
```

Or import in JavaScript:

```javascript
import '@browser.style/layout/dist/layout.css'
```

That's it! No JavaScript required for layouts.

---

## Configure page width & margin (read this first)

The stylesheet ships with two project-level knobs. As soon as a `<lay-out>`
appears on the page, the layout system takes over `<body>` — centering it,
applying the inline gutter, and enabling full-bleed sections:

| Custom property | Default | Controls |
|-----------------|---------|----------|
| `--layout-bleed-mw` | `1024px` | Max content width — the column your layouts are centered in |
| `--layout-mi` | `1rem` | Minimum inline margin (the side gutter on smaller viewports) |

The defaults are emitted on `:root`. **Override them per project from your own
CSS**, loaded after `layout.css`:

```css
:root {
  --layout-bleed-mw: 1200px; /* wider content column */
  --layout-mi: 2rem;         /* larger side gutter    */
}
```

The generated rule that consumes them:

```css
:root {
  --layout-bleed-mw: 1024px;
  --layout-mi: 1rem;
}
/* Inert until a <lay-out> exists, then <body> becomes the layout container: */
body:has(lay-out) {
  margin-inline: max(var(--layout-mi), 50cqw - var(--layout-bleed-mw) / 2);
  max-inline-size: none; /* clears any reading-column max-width on <body>   */
  padding-inline: 0;     /* the gutter above owns inline spacing            */
}
```

Because the `body:has(lay-out)` gate only reads the knobs (it never
re-declares them), a plain `:root` override always wins — no `!important`, no
rebuild. Prefer a build-time default instead? Set `layoutContainer.maxWidth` /
`layoutContainer.margin` in `layout.config.json` (see
[Custom Configuration](#custom-configuration)) and rebuild.

> **Requires `:has()`** (Chrome 105+, Safari 15.4+, Firefox 121+). In older
> browsers the container styles simply don't apply — content still renders, but
> `<body>` keeps its own width and `bleed` won't break out.

---

## Space between sections — `data-layout-root` + `data-page-gap`

The container rule above owns page **width**, not the vertical gap between
stacked `<lay-out>` sections. For that, mark the element that **directly
contains** your top-level `<lay-out>`s — usually `<body>`, sometimes `<main>` —
with `data-layout-root`. It becomes a single-column grid, and `data-page-gap="N"`
sets the gap between its direct children as `N × --layout-space-unit` (default
`1`):

```html
<body data-layout-root data-page-gap="2">
  <h1>…</h1>
  <lay-out md="columns(2)">…</lay-out>   <!-- 2rem gap between every -->
  <h2>…</h2>                             <!-- direct child of the root -->
  <lay-out md="columns(3)">…</lay-out>
</body>
```

Both attributes are `data-*` prefixed because the root is a **native** element,
where bare custom attributes are invalid HTML. (A bare `page-gap` is still read as
a legacy fallback, so older markup keeps working — migrate when convenient.)

The generated rule:

```css
[data-layout-root] {
  display: grid;
  row-gap: calc(attr(data-page-gap type(<number>), attr(page-gap type(<number>), 1)) * var(--layout-space-unit, 1rem));
}
```

Because the gap is grid `row-gap` on the **direct parent**, nested `<lay-out>`s
(e.g. carousel slide grids inside `<ui-media>`) are untouched — only the
sections you actually stack get spaced. Put it on whichever element is the real
parent: on pages where the sections live inside a `<main>`, mark the `<main>`,
not the `<body>`. Every direct child becomes a grid track, so the gap applies
uniformly to headings and intros too; reset their block margins if you want the
gap alone to govern the rhythm.

---

## Section headers — `<lay-out-group>`

Need a heading, category, subtitle and a "see all" link **above** a grid (the
classic BBC / WPP section)? Wrap an optional header and the `<lay-out>` in a
`<lay-out-group>` — a custom element in the `lay-out` family, so it takes the same
`bleed` attribute plus the same **breakpoint spacing tokens** as `<lay-out>` (see
[Breakpoint Spacing Tokens](#breakpoint-spacing-tokens)). CSS lives in
`core/group.css`, bundled into `dist/layout.css`.

```html
<lay-out-group bleed xs="pbs(3) pbe(3)" style="--layout-bg:#eaf6e9">
  <ui-content>                              <!-- the header -->
    <small data-part="eyebrow">Our work</small>
    <h2    data-part="headline">World-class ideas</h2>
    <p     data-part="summary">Optional subtitle.</p>
    <a     data-part="link" href="/work">View all →</a>
  </ui-content>
  <lay-out md="columns(2)" lg="grid(3a)"> …cards… </lay-out>
</lay-out-group>
```

### Structure

- The header sits **inside** the (themed) box but **outside** `<lay-out>`, so it
  never becomes a grid item — every layout pattern (columns, grid, bento, asym,
  mosaic) keeps its `nth-child` placement unchanged. Works over *any* layout.
- The header is a **`<ui-content>`**, not a `<header>`. That's deliberate: a native
  `<header>` inside the custom element can expose a stray `banner` landmark role —
  the `<h2 data-part="headline">` already carries the heading. Being a `<ui-content>`
  also means its part typography is reused, not re-implemented (see below).

### The header depends on `@browser.style/card`

Because the header is a `<ui-content>`, the **eyebrow / headline / summary / meta**
typography comes verbatim from card's `content.css`. `group.css` styles only the
header **layout** (a two-column grid that end-aligns the "see all" link, and zeroes
`ui-content`'s own padding so the header text lines up with the grid's content
column). So load card's CSS alongside the layout CSS:

```html
<link rel="stylesheet" href="@browser.style/layout/dist/layout.css">
<link rel="stylesheet" href="@browser.style/card/ui-card.css">  <!-- @imports content.css -->
```

Without `content.css` the header still lays out correctly, but the parts fall back
to bare element styles (no eyebrow uppercase/accent, no headline ramp). The `link`
part is the one exception — it's **group-specific** (`content.css` has no `link`
part), styled and end/bottom-aligned by `group.css` itself, and it drops below the
heading on narrow (`< 30rem`) viewports.

### Theme, bleed & spacing

- `bleed` + `--layout-bg` (or `--layout-group-bg`) paint a **full-bleed themed
  band**; the header and grid stay in the centred content column. It escapes the
  `data-layout-root` width like `lay-out[bleed]` (simplified — no per-item bleed
  scaling); the inner `<lay-out>` stays content-width and **must not** carry its own
  `bleed`/`--layout-bg`.
- **`<ui-content data-bleed>`** opts the header into spanning the whole band instead
  of the content column (only meaningful on a `bleed` group).
- `pb`/`pbs`/`pbe` tokens = inner padding *within* the band; `mbs`/`mbe` tokens
  = outer margin, added to `page-gap`. Set them on the same breakpoint attributes as
  `<lay-out>` (e.g. `xs="pbs(3) pbe(3)"`). `box-sizing: border-box`, so padding
  doesn't disturb the bleed width math.

### Styling the header parts

Restyle via the **`content=` token DSL** on the header `<ui-content>` (e.g.
`content="hl(lg) eb(accent)"`) or the `--ui-content-*` custom properties — the same
API as any card `<ui-content>`. Set the headline size with `--ui-content-headline`
(e.g. `--ui-content-headline: 2rem`). Group-level tunables: `--layout-group-gap`
(header→grid), `--layout-group-bg` / `--layout-group-c`.

Live demo: `dist/section.html` (loads `ui-card.css` for the header typography).

---

## Features

- **Pure CSS** - No JavaScript runtime needed
- **Responsive** - Breakpoint-based layouts with `@media` or `@container` queries
- **63 Layout Patterns** - Columns, grids, bento boxes, mosaics, lanes (masonry), and more
- **Responsive Images** - Automatic srcset generation for optimal image loading
- **Customizable** - Create custom layouts and breakpoints
- **Small Bundle** - ~33 KB uncompressed, ~12 KB gzipped
- **Zero Config** - Works out of the box with sensible defaults

---

## Usage

### Basic Layouts

Use the `lay-out` element with breakpoint attributes:

```html
<!-- 1 column on mobile, 2 columns on tablet, 3 columns on desktop -->
<lay-out md="columns(2)" lg="columns(3)">
  <article>Content 1</article>
  <article>Content 2</article>
  <article>Content 3</article>
</lay-out>
```

### Available Breakpoints

Default breakpoints (customizable):

- `xs` - 240px
- `sm` - 380px
- `md` - 540px
- `lg` - 720px
- `xl` - 920px
- `xxl` - 1140px

### Layout Types

**Columns:**
```html
<lay-out lg="columns(3)">...</lay-out>
```
Equal-width columns (1-6 columns available)

**Grid:**
```html
<lay-out lg="grid(3a)">...</lay-out>
```
Advanced grid patterns (19 variants available)

**Bento:**
```html
<lay-out lg="bento(6a)">...</lay-out>
```
Bento box layouts (10 variants available)

**Mosaic:**
```html
<lay-out lg="mosaic(hex)">...</lay-out>
```
Mosaic patterns (5 variants available)

**Asymmetrical:**
```html
<lay-out lg="asym(l-r)">...</lay-out>
```
Asymmetric layouts (6 variants available)

**Ratios:**
```html
<lay-out lg="ratios(2:1)">...</lay-out>
```
Aspect ratio layouts (9 variants available)

**Autofit:**
```html
<lay-out xs="auto(fit)">...</lay-out>
```
Auto-fitting layouts (2 variants available)

**Lanes (Masonry):**
```html
<lay-out sm="lanes(2)" lg="lanes(4)">...</lay-out>
<lay-out sm="lanes(2)" lg="lanes(auto)" lanes-min="12rem">...</lay-out>
```
Masonry-style layouts using CSS `display: grid-lanes` (6 variants available). Falls back to CSS columns for browsers without grid-lanes support. Use `lanes-min` and `lanes-max` attributes to configure column sizing for `lanes(auto)`.

See [demos](dist/index.html) for visual examples of all layouts.

### Carousels — `overflow` + `media=` controls

Add the `overflow` attribute to turn any layout into a horizontal scroller/carousel
(`preview*`, `center`, `frame`, `gaps`, `fade*`, `none`, `stop` tokens — see
`core/base.md` for the full reference). Carousel **controls** (arrows, dots, page
markers, autoplay, seamless loop) are configured with tokens in the **`media=`**
attribute — the same control vocabulary as `<ui-media>` in `@browser.style/card`,
styled by `ui/base/carousel.css` (load `@browser.style/base` alongside `layout.css`):

```html
<lay-out bleed md="columns(1)" overflow="preview-2xl center"
         media="nav(blw) arw(bare) dot(pll) pages auto(4s) loop">
  <div>Slide 1</div>
  <div>Slide 2</div>
  <div>Slide 3</div>
</lay-out>
```

- `nav` / `nav(dot|arw|blw|abv)` — which controls to show and where (`blw`/`abv` =
  reserved band below/above the scroller)
- `arw(…)` — arrow style/placement modifiers (`bare`, `sm`…`xl`, `sqr`, `sft`,
  `lgt`/`drk`, corner/edge positions, …)
- `dot(…)` — dot style modifiers (`sm`…`xl`, `pll` pills, `hyb`, `tmb` thumbnails,
  `non`, …)
- `pages` — snap + one dot per *page* of items instead of per item
- `auto` / `auto(4s)` — autoplay; `loop` — seamless infinite wrap (both are
  progressive enhancement via the shared carousel script in `@browser.style/card`)

> **Scoping:** `media=` on a `<lay-out>` configures only the lay-out's **own**
> scroller — it never inherits into `<ui-media>` carousels inside descendant cards
> (`media=` inheritance stops at the nearest `ui-card`/`ui-reveal` host).

> **Removed in v4:** the individual `nav`, `arrow=`, `dot=`, `pages`, `auto=` and
> carousel `loop` attributes on `<lay-out>` — use the `media=` tokens above.
> `overflow` itself is unchanged.

### Breakpoint Spacing Tokens

Spacing is **token-only** — the same card-style tokens embedded alongside layout
tokens in the breakpoint attributes. There are **no** bare `pad-inline` / `pad-top` /
`col-gap` etc. attributes; every spacing value lives inside a breakpoint attribute.
Tokens take a multiplier applied to `--layout-space-unit` (default steps `0`–`4`).

| Token | Property | Default |
|-------|----------|---------|
| `p(N)` | `padding` (all sides — inline + block) | 0 |
| `pi(N)` | `padding-inline` | 0 |
| `pb(N)` | `padding-block` (start + end) | 0 |
| `pbs(N)` | `padding-block-start` | 0 |
| `pbe(N)` | `padding-block-end` | 0 |
| `mbs(N)` | `margin-block-start` | 0 |
| `mbe(N)` | `margin-block-end` | 0 |
| `cg(N)` | `column-gap` | 1 |
| `rg(N)` | `row-gap` | 1 |

> Margin is **block-only** (`mbs`/`mbe`): `margin-inline` stays `auto` so layouts
> stay centered. There is no `mi`/`m` or all-sides margin token.

```html
<!-- Base padding from the smallest (un-media-queried) breakpoint, overridden up -->
<lay-out xs="p(1)" md="columns(2) pi(2) pb(1)" lg="columns(4) p(4)">
  <div>Item 1</div>
  <div>Item 2</div>
  <div>Item 3</div>
  <div>Item 4</div>
</lay-out>
```

The lowest breakpoint (`xs`, which has no `min` in the default config) emits its
rules **without** a media query, so it acts as the mobile-first base; larger
breakpoints override via cascade-layer order. Values persist until a larger
breakpoint overrides them.

**Configuring which tokens are generated.** Each token × step × breakpoint is a
generated rule, so the vocabulary is gated in `layout.config.json` to keep the CSS
small — see [Spacing configuration](#spacing-configuration).

See [spacing demos](dist/spacing.html) for visual examples.

### Row alignment — `subgrid(on)` / `subgrid(off)`

Make each direct child adopt the grid's shared rows so their internal rows (media ·
eyebrow · headline · meta) line up across the row, regardless of how far individual
headlines wrap. It's a **breakpoint token**, enabled per-breakpoint (only where the
grid is actually multi-column — a stacked single-column breakpoint would collapse the
shared rows):

```html
<lay-out subgrid="3" md="columns(3) subgrid(on)" xl="subgrid(off)">
  <ui-card>…</ui-card>
  <ui-card>…</ui-card>
  <ui-card>…</ui-card>
</lay-out>
```

- **`subgrid(on)`** — enable from that breakpoint up. The **row count** comes from the
  separate global **`subgrid="N"`** attribute (one value, not per-breakpoint).
- **`subgrid(off)`** — disable again from a larger breakpoint up (because
  `@media (min-width)` is cumulative, an earlier `subgrid(on)` otherwise persists). The
  off rule wins by cascade-layer order.
- Generated only for `md`/`lg`/`xl`/`xxl` — never `xs`/`sm`.
- Tuned for **card grids**: turning off restores the child's own `container-type:
  inline-size` (its container-query root). Each child adopts N shared rows and neutralises
  its own inline-size container while subgrid is on.

> **Authoring note:** the token becomes an attribute-selector value in the generated CSS
> (`lay-out[md~="subgrid(on)"]`). Any app/demo CSS that hooks the subgrid state (e.g. to
> flip a wrapper to `display: contents`) must match the exact token string —
> `[lg~="subgrid(on)"]`, not the old bare `[lg~="subgrid"]`.

### Item Animations

Scroll-driven animations for individual items within a layout. Items animate based on the container's scroll visibility using a named `view-timeline`.

```html
<!-- Item animation only -->
<lay-out animate="fade-up()" lg="grid(3a)">

<!-- Container + item animation -->
<lay-out animate-self="fade-right()" animate="fade-up()" lg="grid(3a)">
```

Available presets include: `fade-up()`, `fade-down()`, `fade-left()`, `fade-right()`, `fade-in()`, `zoom-in()`, `flip-up()`

Speed/exit ("pace") words are plain tokens in the same attribute value — there is no
separate `pace` attribute: `animate="fade-up() slow exit"` (`very-slow`, `slow`,
`fast`, `very-fast`, `exit`, `exit-fast`, `exit-slow`).

Items stagger automatically via nth-child `animation-range` offsets (up to 6 children). In browsers supporting `sibling-index()`, stagger scales to any number of children.

See [animation demos](dist/animations.html) for visual examples.

---

## Responsive Images

### Automatic Srcset Generation

Import the srcset utilities:

```javascript
import { srcsetMap, layoutConfig } from '@browser.style/layout/maps'
import { generateSrcsets } from '@browser.style/layout/src/srcsets.js'

// Generate srcsets for a layout
const srcsets = generateSrcsets(
  { md: "columns(2)", lg: "grid(3a)" },
  srcsetMap,
  layoutConfig
)
// Returns: "540:50%;720:50%,50%,100%@1024"
```

### Apply to Existing Elements

```javascript
import { applySrcsets } from '@browser.style/layout/src/srcsets.js'
import { srcsetMap, layoutConfig } from '@browser.style/layout/maps'

// After adding lay-out elements to DOM
applySrcsets('lay-out', srcsetMap, layoutConfig)
```

### Manual Srcsets

```html
<lay-out md="columns(2)" lg="grid(3a)" srcsets="540:50%;720:50%,50%,100%@1024">
  <img src="image.jpg">
  <img src="image.jpg">
  <img src="image.jpg">
</lay-out>
```

The `srcsets` attribute tells the browser what percentage of the layout width each item occupies at different breakpoints.

---

## Web Component (Optional)

For enhanced functionality with automatic srcset generation:

```javascript
import '@browser.style/layout/src/components/layout/index.js'
```

This registers a `<lay-out>` web component that:
- Automatically generates `srcsets` from breakpoint attributes
- Adds `sizes` attributes to child images
- Works with responsive image loading

**Example:**

```html
<lay-out md="columns(2)" lg="grid(3a)">
  <img src="image.jpg" alt="Photo">
  <img src="image.jpg" alt="Photo">
  <img src="image.jpg" alt="Photo">
</lay-out>

<script type="module">
  import '@browser.style/layout/src/components/layout/index.js'
</script>
```

The component automatically:
1. Generates `srcsets="540:50%;720:50%,50%,100%@1024"`
2. Adds `sizes` to all child `<img>` elements
3. Optimizes image loading based on layout

---

## Custom Configuration

### Create Custom Build

If you need different layouts or breakpoints:

**1. Create `layout.config.json` in your project:**

```json
{
  "element": "lay-out",
  "core": ["base"],
  "common": ["animations"],

  "layoutContainer": {
    "element": "body",
    "maxWidth": 1024,
    "margin": "1rem"
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

**2. Build CSS:**

```bash
node node_modules/@browser.style/layout/build.js
```

This generates `dist/layout.css` with only your specified layouts.

**3. Include your custom CSS:**

```html
<link rel="stylesheet" href="dist/layout.css">
```

### Configuration Options

#### `element` (required)
The HTML element name for layout containers.
- Default: `"lay-out"`

#### `core` (required)
Core CSS files to include from `/core` folder.
- Example: `["base"]`

#### `common` (required)
Common CSS files to include from `/core` folder.
- Example: `["animations"]`

#### Spacing configuration

The `spacing` block controls which [spacing tokens](#breakpoint-spacing-tokens)
the builder generates. Because every `token × step × breakpoint` combination is a
generated CSS rule, listing only what you need per breakpoint keeps the output
small.

```json
"spacing": {
  "steps": [0, 1, 2, 3, 4],
  "tokens": ["p", "pi", "pb", "pbs", "pbe", "mbs", "mbe", "cg", "rg"]
}
```

- `steps` — the multiplier values generated for each token (× `--layout-space-unit`).
- `tokens` — the **default** token vocabulary emitted for every breakpoint.
- `breakpoints` *(optional)* — an **allowlist**: generate spacing tokens for only
  these breakpoints. Omit it to generate for all.

**Limit which breakpoints get spacing tokens.** Add a `breakpoints` allowlist — e.g.
to generate padding/margin tokens for **only `xs` and `lg`**:

```json
"spacing": {
  "steps": [0, 1, 2, 3, 4],
  "tokens": ["p", "pi", "pb", "pbs", "pbe", "mbs", "mbe", "cg", "rg"],
  "breakpoints": ["xs", "lg"]
}
```

**Vary the token set per breakpoint.** Any breakpoint may override the token list
with its own `spacing` array (an empty array `[]` disables its spacing tokens):

```json
"breakpoints": {
  "xs": { "layouts": [...], "spacing": ["p","pi","pb","pbs","pbe","mbs","mbe","cg","rg"] },
  "md": { "min": "540px", "layouts": [...], "spacing": ["p","pi","pb","cg","rg"] }
}
```

Valid token names: `p` (all sides), `pi`, `pb`, `pbs`, `pbe`, `mbs`, `mbe`, `cg`,
`rg`. Tokens are generated for both `<lay-out>` and `<lay-out-group>`.

#### `layoutContainer` (required)
Configuration for the layout container element and CSS custom properties.

Properties:
- `element` (optional, default: `"body"`): HTML element to apply container styles to
- `maxWidth` (required): Maximum container width in pixels (generates `--layout-bleed-mw` CSS custom property)
- `margin` (required): Inline margin value (generates `--layout-mi` CSS custom property)
- `setRoot` (optional, default: `true`): Whether to apply the `margin-inline` calculation to the element

**With `setRoot: true` (default):**
```json
{
  "element": "body",
  "maxWidth": 1024,
  "margin": "1rem",
  "setRoot": true
}
```

Generates (the knobs on `:root` are project-overridable — see
[Configure page width & margin](#configure-page-width--margin-read-this-first)):
```css
:root {
  --layout-bleed-mw: 1024px;
  --layout-mi: 1rem;
}
body:has(lay-out) {
  margin-inline: max(var(--layout-mi), 50cqw - var(--layout-bleed-mw) / 2);
  max-inline-size: none; /* only when element is <body> */
  padding-inline: 0;     /* only when element is <body> */
}
```

**With `setRoot: false`:**
Only emits the `:root` CSS variables without the `body:has(…)` container rule, giving you full control via your own selector.

#### `breakpoints` (required)
Define your breakpoints and which layouts to include. Each breakpoint may set
`min`/`max` for its media query; **omit both on the lowest breakpoint** (e.g. `xs`)
and its rules emit without a media query, acting as the mobile-first base that
larger breakpoints override.

**Include all variants:**
```json
"layouts": ["columns"]
```
This includes all 6 column layouts: `columns(1)` through `columns(6)`

**Include specific variants only:**
```json
"layouts": [
  { "grid": ["grid(3a)", "grid(3c)"] }
]
```
This includes only those 2 specific grid layouts, keeping your CSS small.

---

## Create Custom Layouts

### 1. Create Layout JSON

Create a JSON file in your project's `layouts/` folder:

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
      ],
      "rules": []
    }
  ]
}
```

### 2. Reference in Config

```json
{
  "breakpoints": {
    "lg": {
      "layouts": [
        { "hero": ["hero(1)"] }
      ]
    }
  }
}
```

### 3. Build

```bash
npm run build:all
```

### 4. Use Your Layout

```html
<lay-out lg="hero(1)">
  <div>Main content</div>
  <aside>Sidebar</aside>
</lay-out>
```

### Layout JSON Properties

- **`id`** - Unique identifier (e.g., "1", "3a")
- **`columns`** - CSS grid-template-columns value
- **`rows`** - (Optional) CSS grid-template-rows value
- **`items`** - Number of items this layout expects
- **`srcset`** - Comma-separated percentages for each item
- **`icon`** - Array of rectangles for visual icon
- **`rules`** - (Optional) Array of CSS rules for specific children

See `layouts/` folder for examples.

---

## Build Commands

```bash
npm run build         # Build CSS
npm run build:maps    # Generate layouts-map.js
npm run build:demo    # Generate HTML demos
npm run build:icons   # Generate SVG icons
npm run build:all     # Build everything
```

For detailed build documentation, see [docs/BUILD.md](docs/BUILD.md)

---

## Examples

### Gallery

```html
<lay-out lg="grid(3a)" xl="grid(4a)">
  <img src="photo1.jpg" alt="Photo 1">
  <img src="photo2.jpg" alt="Photo 2">
  <img src="photo3.jpg" alt="Photo 3">
  <img src="photo4.jpg" alt="Photo 4">
  <img src="photo5.jpg" alt="Photo 5">
</lay-out>
```

### Blog Layout

```html
<lay-out md="columns(2)" lg="asym(l-r)">
  <article>
    <h2>Main Article</h2>
    <p>Content...</p>
  </article>
  <aside>
    <h3>Sidebar</h3>
    <p>Related content...</p>
  </aside>
</lay-out>
```

### Card Grid

```html
<lay-out sm="columns(2)" md="columns(3)" lg="grid(4a)">
  <article class="card">Card 1</article>
  <article class="card">Card 2</article>
  <article class="card">Card 3</article>
  <article class="card">Card 4</article>
</lay-out>
```

### Bento Box

```html
<lay-out lg="bento(6a)">
  <div>Feature 1</div>
  <div>Feature 2</div>
  <div>Feature 3</div>
  <div>Feature 4</div>
  <div>Feature 5</div>
  <div>Feature 6</div>
</lay-out>
```

---

## Browser Support

- Chrome/Edge 89+
- Firefox 88+
- Safari 14.1+

Requires CSS Grid and CSS Custom Properties support.

### Safari/Firefox Polyfill

This layout system uses the enhanced `attr()` CSS function with type support, which is currently only supported in Chrome/Edge. For Safari and Firefox, include the polyfill:

**In HTML:**
```html
<script type="module" src="node_modules/@browser.style/layout/polyfills/attr-fallback.js"></script>
```

**Or in JavaScript:**
```javascript
import '@browser.style/layout/polyfills/attr-fallback'
```

The polyfill:
- Auto-detects browser support and only runs when needed
- Automatically processes existing and new `<lay-out>` elements
- Watches for attribute changes dynamically
- Has zero overhead in browsers with native support

---

## Performance

- **Zero JavaScript** - Pure CSS, no runtime overhead
- **Lazy Loading** - Use with native `loading="lazy"` on images
- **Cacheable** - Static CSS, fully cacheable
- **No Layout Shift** - Grid-based, prevents CLS
- **Small Bundle** - ~12 KB gzipped

---

## Documentation

- [BUILD.md](docs/BUILD.md) - Build system documentation
- [RUN.md](docs/RUN.md) - Command reference
- [demos/](dist/index.html) - Visual examples

---

## License

ISC

---

## Links

- [npm package](https://www.npmjs.com/package/@browser.style/layout)
- [GitHub repository](https://github.com/madsstoumann/browser-style)
- [Website](https://browser.style/ui/layout)

---

## Contributing

Issues and pull requests welcome at [GitHub](https://github.com/madsstoumann/browser-style/issues)
