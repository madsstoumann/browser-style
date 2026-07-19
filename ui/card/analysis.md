# Attribute Analysis — Layout, Card & Base Systems

A reference of every HTML **attribute** exposed by the three systems. Attribute **values** are intentionally omitted; only names, target elements, purpose and type are listed.

**Type key:** `Boolean` = presence-only · `Value` = takes a single value · `Token-list` = space-separated keyword tokens (often `token(arg)` DSL). Many attributes are compact DSL strings where modifiers live *inside* the value (e.g. `theme="red muted ink"`), not as separate attributes.

**`data-*` twin convention:** several base/layout attributes have a `data-`prefixed form. Custom elements use the bare name (`stagger`); native HTML elements use the `data-` form (`data-stagger`). They are the same feature.

---

## 1. Layout System (`/layout`)

Driven by two custom elements — **`<lay-out>`** (the grid host; children are items) and **`<lay-out-group>`** (a section wrapper: header `<ui-content>` + inner `<lay-out>`). Both work as pure CSS; the optional `<lay-out>` web component only adds automatic `srcset`/`sizes` generation. The page root is a native `<body>`/`<main>` marked with `data-*` attributes.

### Layout pattern & responsive breakpoints

| Attribute | Applies To | Purpose | Type |
|-----------|-----------|---------|------|
| `xs` | `<lay-out>` | Layout pattern at the xs breakpoint (240px+). | Value |
| `sm` | `<lay-out>` | Layout pattern at the sm breakpoint (380px+). | Value |
| `md` | `<lay-out>` | Layout pattern at the md breakpoint (540px+). | Value |
| `lg` | `<lay-out>` | Layout pattern at the lg breakpoint (720px+). | Value |
| `xl` | `<lay-out>` | Layout pattern at the xl breakpoint (920px+). | Value |
| `xxl` | `<lay-out>` | Layout pattern at the xxl breakpoint (1140px+). | Value |

The breakpoint attributes also carry embedded **inline tokens** (not separate attributes). Spacing is **token-only** — there are no bare `pad-*`/`space-*`/`*-gap` attributes. Spacing tokens: `p()` (all sides), `pi()`, `pb()`, `pbs()`, `pbe()`, `mbs()`, `mbe()`, `cg()`, `rg()`, plus the `subgrid(on)` / `subgrid(off)` keywords. Child alignment is also a per-breakpoint builder token — `items(start|center|end|stretch)`, e.g. `lg="columns(2) items(start)"` (the former standalone `items=` attribute is removed). The lowest breakpoint (`xs`, no `min` in the default config) emits un-media-queried, acting as the mobile-first base; larger breakpoints override. Which tokens are generated per breakpoint is set in `layout.config.json` (`spacing.tokens` + per-breakpoint `spacing`).

### Global spacing & sizing

| Attribute | Applies To | Purpose | Type |
|-----------|-----------|---------|------|
| `columns` | `<lay-out>` | Sets `grid-template-columns` directly. | Value |
| `rows` | `<lay-out>` | Sets `grid-template-rows` directly. | Value |
| `max-width` | `<lay-out>` | Caps the element's max inline size. | Value |
| `width` | `<lay-out>` | Constrains to a named width preset (xs–xxl). | Value |
| `self` | `<lay-out>` | Sets the element's own `place-self` within its parent grid. | Value |
| `size` | `<lay-out>` | Enables `content-visibility` with a `contain-intrinsic-size` hint. | Value |
| `subgrid` | `<lay-out>` | Row count each child adopts as shared subgrid rows (activated per-breakpoint by the `subgrid(on)` token; turned off by `subgrid(off)`). | Value |

### Full-bleed & decorations

| Attribute | Applies To | Purpose | Type |
|-----------|-----------|---------|------|
| `bleed` | `<lay-out>`, `<lay-out-group>` | Breaks the element out to full viewport width (optionally scaled). | Boolean / Value |
| `gap-decorations` | `<lay-out>` | Draws column/row rules in the grid gaps. | Token-list |

### Masonry (lanes)

| Attribute | Applies To | Purpose | Type |
|-----------|-----------|---------|------|
| `lanes-min` | `<lay-out>` | Minimum column size for `lanes(auto)` masonry. | Value |
| `lanes-max` | `<lay-out>` | Maximum column size for `lanes(auto)` masonry. | Value |

### Carousel / overflow scroller

| Attribute | Applies To | Purpose | Type |
|-----------|-----------|---------|------|
| `overflow` | `<lay-out>` | Turns the layout into a horizontal scroll-snap carousel — the mode flag; behaviour is tuned via `media=` tokens. | Boolean |
| `media` | `<lay-out>` (with `overflow`) | Carousel control tokens for the lay-out's **own** scroller — same vocabulary as `<ui-media>` (`nav`/`nav()`, `arw()`, `mrk()`, `auto`, `loop`) plus `pages` (one scroll-marker dot per page of items instead of per item). Replaces the former `nav=`/`arrow=`/`dot=`/`pages` attributes. Scoped: it never leaks into a descendant `<ui-media>`. | Token-list |

### Animations (scroll-driven)

> These are **base-owned, not layout-specific** — the whole `[animate]` engine lives in `@browser.style/base` (see §3) and works on **any** element. They're listed here because `<lay-out>` is a common host; "Applies To" below means "valid on `<lay-out>` (among any element)."

| Attribute | Applies To | Purpose | Type |
|-----------|-----------|---------|------|
| `animate` | any element (here `<lay-out>`) | Animates child items on scroll via a named view-timeline; modifiers `clip`/`deep`/`trigger*` and pace tokens `very-slow slow fast very-fast exit exit-fast exit-slow` (the former `pace=` attribute, now words inside the value — e.g. `animate="fade-in(2) slow exit-fast"`); shape reveals `reveal(hex\|star\|…)`. | Value / Token-list |
| `animate-self` | any element (here `<lay-out>`) | Animates the element itself on scroll (incl. `reveal(...)`; `morph()` is specced but unimplemented); takes the same pace tokens. | Value / Token-list |
| `easing` | any animated element | Selects a named easing curve (`--ease-*`). | Value |
| `stagger` | `<lay-out>` / any host | Cascading reveal of direct children (custom-element form). | Token-list |
| `data-stagger` | Native host elements | Same cascading-child reveal for native elements. | Token-list |

### Responsive images

| Attribute | Applies To | Purpose | Type |
|-----------|-----------|---------|------|
| `srcsets` | `<lay-out>` | Per-breakpoint item width percentages for responsive image sizing (auto-generated by the web component, or manual). | Value |

### Page root & section group (native / group elements)

| Attribute | Applies To | Purpose | Type |
|-----------|-----------|---------|------|
| `data-layout-root` | `<body>`/`<main>` (parent of top-level `<lay-out>`s) | Makes the container a single-column grid for uniform vertical spacing between stacked sections. | Boolean |
| `data-page-gap` | element with `data-layout-root` | Gap between stacked sections as a multiple of the space unit. | Value |
| `page-gap` | element with `data-layout-root` | Legacy fallback for `data-page-gap`. | Value |
| `data-part` | children of the group header `<ui-content>` | Marks header roles (eyebrow / headline / summary / link). | Value |
| `data-bleed` | `<ui-content>` header inside a `bleed` group | Opts the header into spanning the full bleed band. | Boolean |
| `content` | `<lay-out-group>` header `<ui-content>` | Card content token-DSL to restyle header parts (inherited from the card package). | Value |

> **Not public API:** `data-clone` (script-generated for cloned carousel slides) and `repeat` (demo-only replay control in `demo.css`).

---

## 2. Card System (`/ui/card`, consumed by `/ui/reveal`)

Elements: **`<ui-card>`** (static host, unregistered), **`<cq-box>`** (queryable grid descendant), **`<ui-media>`** (the only JS-registered element), **`<ui-content>`** (text column, unregistered), **`<ui-reveal>`** (disclosure host on `<details>`/`<summary>`, unregistered), **`<ui-face>`** (front-face wrapper inside `<summary>`). The three primary DSL attributes (`media`, `content`, `variant`) may sit on the host and inherit down, or live directly on the primitive.

### Card host — `<ui-card>` (also `<ui-reveal>`)

| Attribute | Applies To | Purpose | Type |
|-----------|-----------|---------|------|
| `variant` | card / reveal | Composition DSL: arrangement, split, visibility, overlay, corners. | Token-list |
| `theme` | card / reveal | Shared theme axis (colour + light/dark/pale/muted modifiers); surface + ink. | Token-list |
| `media` | card (inherits to media) | Media-frame DSL; can live on the host and flow down to `<ui-media>`. | Token-list |
| `content` | card (inherits to content) | Content-column DSL; can live on the host and flow down to `<ui-content>`. | Token-list |
| `data-view` | card (and optionally its `<img>`) | Sets `view-transition-name` for cross-page view transitions. | Value |

### Media — `<ui-media>`

| Attribute | Applies To | Purpose | Type |
|-----------|-----------|---------|------|
| `media` | media | Primary media DSL — the **only** configuration surface: aspect-ratio, fit/position, flip, hover, scrim, shape, tint, furniture, **all carousel controls** (`nav`/`nav()`, `arw()`, `mrk()`, `axis(y)`, `auto`/`auto(4s)`, `loop`, `stagger`, `ani()`/`crd()`), loading (`load(eager\|lazy)`) and video sizing (`vid()`, `ply()`). The former alias attributes `nav=`/`arrow=`/`dot=`/`vid=`/`ply=`/`eager`/carousel-`loop` are removed. Read from the element itself or its nearest `ui-card`/`ui-reveal` host only (never other ancestors). | Token-list |
| `provider` | media | Video embed provider (e.g. youtube/vimeo) for the facade path. | Value |
| `video` | media | Video / embed identifier. | Value |
| `src` | media (and inner `<img>`/`<video>`) | Direct media file URL / native source. | Value |
| `loop` | media | Video loops. | Boolean |
| `muted` | media | Video muted. | Boolean |
| `autoplay` | media | Video autoplays (decorative when muted+autoplay). | Boolean |
| `cdn` | media | Force/gate the Cloudflare srcset upgrade. | Value |
| `quality` | media | srcset image quality. | Value |
| `format` | media | srcset image format. | Value |
| `fit` | media | srcset fit mode. | Value |
| `sizes` | media | srcset `sizes` attribute. | Value |
| `breakpoints` | media | srcset breakpoint widths. | Value |
| `data-preview` | media child (facade poster) | Marks the facade/preview element for a video embed. | Boolean / Value |
| `data-title` | media | Title applied to the generated embed `<iframe>`. | Value |
| `data-track` | media (inner `<video>`) | Identifier used for caption/track wiring. | Value |

> Video-toolbar controls generated inside `<ui-media>` use standard control attributes (`command`, `commandfor`, `aria-pressed`, `open`) — framework-generated, not author-set. Overlay furniture (`<ui-chip>`, `<ui-sticker>`, `<ui-save>`, `<ui-play>`) inherits position/theme from the parent's `media` tokens rather than its own attributes.

### Content — `<ui-content>`

| Attribute | Applies To | Purpose | Type |
|-----------|-----------|---------|------|
| `content` | content | Content DSL: type scale (`scl`), headline/eyebrow/text/meta tone+weight (`hl`/`eb`/`tx`/`mt`), font family (`fnt`), padding (`pad`), gap (`gap`), alignment (`ctr`/`end`), scroll (`scr`). | Token-list |
| `data-part` | content children | Semantic part role (eyebrow, headline, subheadline, summary, meta/caption, byline, tags, actions, footer, price, rating, stat, quote, timeline, address, list, options, cover, …). | Value |

### Reveal — `<ui-reveal>` (on `<details>`/`<summary>`, with `<ui-face>`)

| Attribute | Applies To | Purpose | Type |
|-----------|-----------|---------|------|
| `variant` | reveal | Composition DSL (shared with card) — **plus all reveal-specific config**, folded in as tokens: `exp`\|`flp()`\|`sld()`\|`scl()` (one token, direction/origin in the value), `lg:scl` (container tier), `pop` (popup mode), `trg(card)`, `scr` (scroll), `ico()`/`icc()` (toggle icon, one token per word). The former individual attributes `type`/`type-lg`/`from`/`to`/`trigger`/`scroll`/`icon`/`icon-close` are removed. | Token-list |
| `theme` | reveal | Theme axis (shared with card). | Token-list |
| `media` | reveal (inherits) | Media DSL (shared with card). | Token-list |
| `content` | reveal (inherits) | Content DSL (shared with card). | Token-list |
| `name` | reveal (native `<details>`) | Exclusive-accordion group name. | Value |
| `open` | reveal (native `<details>`) | Open/expanded state. | Boolean |
| `tabindex` | reveal / summary | Focus behaviour of the disclosure. | Value |
| `stagger` | reveal | Staggered child reveal (scroll-driven; supports `trigger`). | Boolean / Value |
| `data-stagger` | reveal | Internal/state hook for the stagger engine. | Boolean / Value |

### Cross-cutting animation attributes (card / reveal hosts & layout containers)

| Attribute | Applies To | Purpose | Type |
|-----------|-----------|---------|------|
| `animate` | host / container | Scroll-driven or scroll-triggered reveal for children (`fx()` syntax; modifiers `clip`/`deep`, `trigger*`, pace tokens `slow`/`fast`/`very-*`/`exit*` — the former `pace=` attribute is now words inside this value). | Token-list |
| `animate-self` | host / element | Scroll animation applied to the element itself on its own `view()` timeline; same pace tokens. | Token-list |
| `easing` | animated element | Overrides the animation easing. | Value |

> `media`, `content` and `variant` are space-separated token DSLs; every token ultimately writes a `--ui-media-*` / `--ui-content-*` / card custom property, so any value also has a `style="--ui-*"` escape hatch.

---

## 3. Base System (`/ui/base`)

Global/universal attributes usable on any opted-in element. Token-list attributes pack their modifiers *inside* the single attribute rather than as separate siblings.

### Global attributes

| Attribute | Feature / File | Purpose | Type |
|-----------|----------------|---------|------|
| `theme` | `theme.css` | Shared cross-component colour axis; themed surface + ink on any opted-in element. Modifiers (`ink`, `pale`, `muted`, `light`, `dark`, `border`, `border(...)`) are tokens within this attribute. | Token-list |
| `tint` / `data-tint` | `tint.css` | Start (top-left) colour of a colour-tinting ramp. | Value |
| `tint-end` / `data-tint-end` | `tint.css` | End (bottom-right) colour of the tint ramp. | Value |
| `tint-tr` / `data-tint-tr` | `tint.css` | Top-right corner colour (2D bilinear mode). | Value |
| `tint-bl` / `data-tint-bl` | `tint.css` | Bottom-left corner colour (2D bilinear mode). | Value |
| `tinted` / `data-tinted` | `tint.css` | Opt-in to graduate the tint across direct children; optional value switches to a 2D ramp. | Boolean / Value |
| `stagger` / `data-stagger` | `stagger.css` | Marks a stagger-reveal group whose direct children cascade in; effect-vector tokens + one-shot `trigger` token as values. | Boolean / Token-list |
| `animate` | `animate.css` (engine), `animations.css` (`@keyframes`) | Scroll-driven/triggered animation engine applied to an element's **children**; keyframe-name tokens + modifiers (`(2)`/`(3)`, `clip`, `deep`, `trigger*`), pace tokens (`slow`, `fast`, `very-*`, `exit*` — the former `pace=` attribute, now words inside the value, e.g. `animate="fade-in(2) slow exit-fast"`) and shape reveals `reveal(hex\|star\|rhomb\|plus\|circ)`. Attribute-driven, so it works on **any** element. | Token-list |
| `animate-self` | `animate.css` (engine), `animations.css` (`@keyframes`) | Same engine targeting the element **itself** (incl. `reveal(...)` and the pace tokens); also a companion flag stagger checks to yield container-entry ownership. | Token-list |
| `easing` | `animate.css` (+ `--ease-*` tokens in `easings.css`) | Selects a named easing curve (`ease-1..5`, `ease-spring-*`, `ease-bounce-*`, `ease-elastic-*`, `ease-{circ,cubic,…}-{in,out,in-out}`, …) for the animation. | Value |

### Pattern-specific attributes (carousel / media)

| Attribute | Feature / File | Purpose | Type |
|-----------|----------------|---------|------|
| `media` | `carousel.css`, `stagger.css` | Master carousel/effect DSL (`nav(...)`, `arw(...)`, `mrk(...)`, `axis(...)`, `ani(...)`, `crd(...)`, `auto`, `loop`, `stagger`; on `lay-out[overflow]` also `pages`) — the **only** carousel-control surface; the former `nav=`/`arrow=`/`dot=` attributes are removed. | Token-list |
| `overflow` | `stagger.css` (layout) | `lay-out` mode flag selecting the overflow (horizontal-carousel) reveal path; companion to `stagger`. | Boolean |

### Utility / helper attributes

| Attribute | Feature / File | Purpose | Type |
|-----------|----------------|---------|------|
| `data-sr` | `core.css` | Visually-hidden (screen-reader-only) utility. | Boolean |
| `data-variant` | `button.css`, `utility.css`, `form.css` | Modifier axis for buttons and `.bg-*` controls (outline, light, icon, rounded, text, toggle, transparent, disabled, start/end, …). | Token-list |
| `data-output` | `form.css` | Marks a `<label>` that displays a range/output value. | Boolean |
| `data-clone` | `carousel.css` | Internal marker on cloned carousel slides (suppresses their scroll-marker). | Boolean (internal) |

> Base also **normalizes/styles** native HTML attributes without owning them as design-system API: `dir`, `hidden`, `open`, `popover`, `part`, `role`, `type`, `disabled`, `multiple`, `selected`, `size`, `list`, `autocomplete` (plus substring hooks `class*="bg-"`, `class*="an-"`, `class*="ar-"`, `style*="--output"`).

---

## Notes & overlaps

- **Shared vocabulary across systems.** `stagger`/`data-stagger`, `animate`, `animate-self`, `easing`, `media`, `overflow` and `theme` originate in **base** and are re-used by both **layout** and **card**. As of v4 the **entire animation engine** now lives in base: the `[animate]`/`[animate-self]`/`[easing]` wiring in `ui/base/animate.css` (pace is now words *inside* `animate=`/`animate-self=`, not an attribute), the `@keyframes` in `ui/base/animations.css`, and the `--ease-*` tokens in `ui/base/easings.css` — so `[animate]` works on **any** component, not just `<lay-out>`. Carousel controls (`media=` tokens — `nav()`/`arw()`/`mrk()` etc.; no `nav=`/`arrow=`/`dot=` attributes) and the `stagger` engine likewise live in `ui/base` (`carousel.css`, `stagger.css`). None of this is bundled into `layout.css` any more — `@browser.style/base` must be loaded alongside it (always true in practice). The **only** animation rule still in the layout package is `stack(reveal)` (`layout/core/animations.css`, layout-domain).
- **Shape reveals share the media-shape catalog.** `animate-self="reveal(hex\|star\|rhomb\|plus\|circ)"` animates a single `reveal-shape` keyframe whose clip-path endpoints come from the shared `--shp-*` catalog in `ui/base/shapes.css` — the same vertex-matched pairs that drive static media clips (`media="shp(...)"` in the card system). One shape definition, two uses (static clip + reveal). `--shp-*` is deliberately distinct from the `--shape-*` glyph namespace (icons/stickers) in the same file.
- **`data-*` twins.** The bare form is for custom elements; the `data-` form is for native HTML elements. Same feature, two spellings (`stagger`/`data-stagger`, `tint`/`data-tint`, `page-gap`/`data-page-gap`).
- **Token-list attributes are mini-DSLs.** `theme`, `variant`, `media`, `content`, `stagger`, `animate` each encode many sub-features as space-separated keywords or `token(arg)` values inside one attribute — this is why the same attribute name appears across elements but carries a different token vocabulary.
- **Inheritance.** On the card/reveal host, `media`, `content`, `variant` and `theme` may be authored once and cascade down to the `<ui-media>` / `<ui-content>` primitives. Scoping differs: **`media=` stops at the card** — a `<ui-media>` reads it from itself or its nearest `ui-card`/`ui-reveal` host only, and a `media=` on `<lay-out overflow>` configures only the lay-out's own scroller (it never reaches a descendant `<ui-media>`). **`content=` flows down freely** (pure custom-property inheritance) and also works on `<lay-out>` / `<lay-out-group>`.
