# `media.carousel.css` — architecture & internals

Implementation notes for the CSS-only `<ui-media>` carousel. **User-facing token
reference + examples live in [carousel.md](./carousel.md)** — this file documents
*how* the stylesheet works (the "why" that used to live in code comments).

The behavior layer (`auto`, `loop`) is in [ui-media.js](./ui-media.js); see
carousel.md for those tokens.

---

## Two entry points, one vocabulary

Every option works through **either** form (they resolve to the same rule / props):

- **`media="…"`** — the inheritable single-attribute string. Parens-wrapped, prefixed
  tokens (`nav(blw) arw(lg) arw(drk)`). Set it on the `<ui-media>` **or any ancestor**
  (`<ui-card>` / CMS) — it inherits down. Tokens can't be grouped (CSS substring matching
  can't isolate inner values), so each is its own token.
- **`nav=` / `arrow=` / `dot=`** — dedicated, **space-separated grouped** attributes on the
  `<ui-media>` **itself only** (NOT inherited — by design, so they never sit on the parent).
  Whole-word `~=` matched, so the attribute namespaces the value: `arrow="lg drk arr set"`.

Equivalence: `media="nav(blw)"` ≡ `nav="blw"` · `media="arw(drk)"` ≡ `arrow="drk"` ·
`media="dot(pll) dot(be)"` ≡ `dot="pll be"` · bare `media="nav"` ≡ boolean `nav` ·
`media="axis(y)"` ≡ `nav="y"`. The value is the **same 3-letter code**; only the wrapper differs.

### Shared ink scale

Controls + scrim share one shade vocabulary: `lgt` (light/white) · `drk` (dark/black) ·
`med` (scrim only). Arrows + dots use `lgt`/`drk`.

## All tokens (alphabetical)

Every option the carousel recognises, in both forms. **Layer:** CSS = `media.carousel.css`,
JS = `ui-media.js`, load = `ui-media-srcset.js`. (`nav` is required to make the
scroller; the rest layer on top. `asr()` etc. belong to the base frame — see media.md.)

| `media=` token | Attr form | Layer | Effect |
|----------------|-----------|-------|--------|
| `ani(<type>)` | — | CSS | `stagger` **content** reveal type: `rise` (default) · `fall` · `lft` · `rgt` · `zom` · `blr` · `fde` (see "Staggered content reveal") |
| `crd(<type>)` | — | CSS | `stagger` **card** reveal type (multi-card slides) — same vocabulary, independent of `ani()` |
| `arw(arr)`  | `arrow="arr"` | CSS | Full-arrow glyph (default is chevron) |
| `arw(bare)` | `arrow="bare"` | CSS | Drop the circle — glyph painted as a recolourable shape (`--ui-media-arrow-color`) |
| `arw(bc)`   | `arrow="bc"` | CSS | Split arrows, bottom band (block row) |
| `arw(chv)`  | `arrow="chv"` | CSS | Chevron glyph (**default**) |
| `arw(drk)`  | `arrow="drk"` | CSS | **Dark theme** preset — dark circle + white glyph + light hover ring (composes on the overlay and in `nav(blw)`/`nav(abv)` bands; on `arw(bare)` it just paints a dark glyph) |
| `arw(hid)`  | `arrow="hid"` | CSS | Auto-hide the dead-end arrow (default dims it) |
| `arw(lg)`   | `arrow="lg"` | CSS | Arrow size 2.75rem |
| `arw(lgt)`  | `arrow="lgt"` | CSS | **Light theme** preset — light circle + dark glyph (the default look, made explicit) |
| `arw(md)`   | `arrow="md"` | CSS | Arrow size 2.25rem (**default**) |
| `arw(cc)`   | `arrow="cc"` | CSS | Split arrows, vertically centered (**default**) |
| `arw(set)`  | `arrow="set"` | CSS | Cluster both arrows; placeable in any grid cell — `arw(set) arw(<cell>)`, default `ce` (horizontal) / `be` (vertical) |
| `arw(sm)`   | `arrow="sm"` | CSS | Arrow size 1.75rem |
| `arw(cs)`   | `arrow="cs"` | CSS | `axis(y)`: start-inline cell moves up/down arrows + dots to the inline-start edge |
| `arw(tc)`   | `arrow="tc"` | CSS | Split arrows, top band (block row) |
| `arw(xl)`   | `arrow="xl"` | CSS | Arrow size 3.25rem |
| `auto` · `auto(4s)` · `auto(800ms)` | `nav="auto"` | JS | Autoplay (default 5s); pauses on hover/focus/drag/hidden-tab/reduced-motion. Attr form has no inline duration — defaults to 5s. Add a `<ui-play>` child for an explicit play/pause control (then hover/focus pause is dropped — see `play(<corner>)`) |
| `axis(y)`   | `nav="y"` | CSS | Vertical carousel (snap on Y; arrows become up/down) |
| `dot(cir)`  | `dot="cir"` | CSS | Circular dots (**default**) |
| `dot(bc)` `dot(tc)` | `dot="bc/tc"` | CSS | `nav(blw)`/`nav(abv)`: dots centered in the band (**default**) — `bc` below, `tc` above |
| `dot(drk)`  | `dot="drk"` | CSS | Dark dot ink |
| `dot(be)` `dot(te)` | `dot="be/te"` | CSS | `nav(blw)`/`nav(abv)`: dots at the inline-end — `be` below, `te` above |
| `dot(lg)`   | `dot="lg"` | CSS | Dot size 0.8rem |
| `dot(lgt)`  | `dot="lgt"` | CSS | Light/white dot ink |
| `dot(md)`   | `dot="md"` | CSS | Dot size 0.6rem (**default**) |
| `dot(pll)`  | `dot="pll"` | CSS | Pill dots; active pill fills L→R over `--ui-media-autoplay` (timer hint) |
| `dot(sm)`   | `dot="sm"` | CSS | Dot size 0.45rem |
| `dot(bs)` `dot(ts)` | `dot="bs/ts"` | CSS | `nav(blw)`/`nav(abv)`: dots at the inline-start — `bs` below, `ts` above |
| `dot(non)`  | `dot="non"` | CSS | No dots (keeps arrows) — arrows-only band |
| `dot(tmb)`| `dot="tmb"` | CSS | Image thumbnails; per-slide `--ui-media-thumb-url`; active thumb has a bottom timer stripe |
| `dot(ts)` `dot(te)` `dot(bs)` `dot(be)` | `dot="ts/te/bs/be"` | CSS | Corner placement for the overlay marker-group — logical (top-start / top-end / bottom-start / bottom-end). Center row `dot(cs)` `dot(cc)` `dot(ce)` completes the 9-grid. Inset via `--ui-media-marker-inset` |
| `dot(xl)`   | `dot="xl"` | CSS | Dot size 1rem |
| `loop`      | `nav="loop"` | JS | Seamless infinite loop (clones first/last slide) |
| `nav`       | `nav` (boolean) | CSS | Carousel **on** — dots + arrows (the trigger) |
| `nav(arw)`  | `nav="arw"` | CSS | Arrows only |
| `nav(blw)`  | `nav="blw"` | CSS | Dots + arrows in a reserved band below the media |
| `nav(abv)`  | `nav="abv"` | CSS | Dots + arrows in a reserved band above the media (mirror of `nav(blw)`) |
| `nav(dot)`  | `nav="dot"` | CSS | Dots only |
| `nav(non)`  | `nav="non"` | CSS | Bare swipe scroller (no controls) |
| `stagger`   | `nav="stagger"` | CSS | Staggered content reveal — each slide's `<ui-content>` children fade + rise in when it becomes the snapped slide (pure CSS via `scroll-state` queries; see below) |

### `<ui-media>` frame tokens (not carousel — for reference)

These belong to the base `<ui-media>` frame ([media.css](./media.css), docs in
[media.md](./media.md)) and work with or without a carousel. Listed by family
(`<pos>` = 9-grid `tl tc tr cl cc cr bl bc br`; the furniture ones use the corner set
`ts tc te cs cc ce bs bc be`).

| Token | Layer | Effect |
|-------|-------|--------|
| `asr(1/1 · 6/7 · 3/4 · 4/3 · 3/2 · 2/3 · 16/9 · 21/9)` | CSS | Aspect ratio of the frame |
| `obf(cover · contain · fill · none)` | CSS | `object-fit` (default cover) |
| `obp(<pos>)` | CSS | `object-position` (9-grid) |
| `rds(none · sm · md · lg · xl · 2xl · full · pill)` | CSS | Corner radius (standalone frame); `-sq` variants add a squircle corner |
| `clip` | CSS | `clip-path: inset(0 round …)` at the `rds()` radius — keeps rounded corners while a carousel scrolls (border-radius alone can drop them mid-scroll). Reuses `--ui-media-radius`; no superellipse |
| `flp(h · v · hv)` | CSS | Flip the image horizontally / vertically / both |
| `hov(zoom · pan · track · drift)` | CSS (+JS) | Hover effect; `track`/`drift` follow the cursor (need `ui-media.js`) |
| `scm` · `scm(<pos>)` · `scm(sm · md · lg · xl)` · `scm(sheer · lgt · med · drk · solid)` | CSS | Scrim — direction (furniture grid) + size + intensity |
| `load(eager · lazy)` | load | Image/video loading (`ui-media-srcset.js`); `eager` (bool attr) = first slide eager + `fetchpriority="high"` |
| `chip(<corner>)` · `chip(<color>)` | CSS | Position + colour a `<ui-chip>` child (`accent blue green orange red dark light subtle`) |
| `sticker(<corner>)` · `sticker(<color>)` | CSS | Position + colour a `<ui-sticker>` child |
| `play(<corner>)` | CSS (+JS on autoplay) | Position a `<ui-play>` child. On a **scrolling** carousel (`auto`/`loop`) the control is `position:sticky`-pinned to the scrollport (plain furniture would scroll away) and `ui-media.js` wires it as the play/pause button — see "Play/pause control" below |
| `save(<corner>)` | CSS | Position a `<ui-save>` child |

---

## Foundations

- **Cascade layer:** everything is in `@layer bs-component` (same layer as `media.css`,
  which is imported first — so carousel rules win ties on source order).
- **The `nav` token is the trigger.** `:where([media*="nav"])` turns `<ui-media>` into a
  flex scroll-snap row. Without it, `<ui-media>` is a plain single-image frame.
- **Dual-selector form.** Every rule lists two (or three) selectors so the same option
  works from `media=` on an ancestor, `media=` on the element, **or** the dedicated
  `nav=`/`arrow=`/`dot=` attribute on the element:
  - descendant form (inherits): `:where([media*="x"]) ui-media …`
  - self form: `ui-media:where([media*="x"], [arrow~="x"]) …`
- **`@supports (scroll-marker-group: after)` gate.** Dots (`::scroll-marker`) and arrows
  (`::scroll-button`) are Chromium-only; everything inside that block degrades to a bare
  swipe/scroll-snap row elsewhere.
- **Matching.** `media=` tokens match with `[media*="…"]` (substring); `:not([media*="nav("])`
  distinguishes bare `nav` from the parenthesised `nav(dot)` / `nav(arw)` / etc. Attribute
  forms match whole-word with `~=` (`[arrow~="lg"]`), which is what lets them be grouped.

## Token → control mapping (inside `@supports`)

- **DOTS present** = bare `nav` · `nav(dot)` · `nav(blw)`
- **ARROWS present** = bare `nav` · `nav(arw)` · `nav(blw)`
- `nav(non)` enables neither (bare swipe scroller).

## Scroller

- `inline-size: round(down, 100%, 1px)` — a fractional width makes the browser round
  `scrollWidth` up and `clientWidth` down, inventing ~1px of phantom scroll the dead-end
  (right) `::scroll-button` can never reach, so it never goes `:disabled`. Integer width
  makes the last slide exactly reachable. `round()` is ignored where unsupported (which
  also lacks `::scroll-button`).
- `background: var(--ui-media-bg, transparent)` — the scroller's own bg shows through the
  gap between multi-item slides, so it defaults transparent (the placeholder grey is only
  for empty single-image frames).
- Slides (`> :is(img, video)`) are `flex: 0 0 100%; scroll-snap-align: start`, reset to
  `position: static` (the base frame absolutely-stacks a single image).
- `scroll-behavior: smooth` only under `prefers-reduced-motion: no-preference`.

## `axis(y)` — vertical

Column scroller, `scroll-snap-type: y mandatory`. Works with or without marker/button
support. Cross-axis buttons are hidden per axis (a vertical scroller still generates dead
left/right buttons, a horizontal one dead up/down).

## Slides — every direct child (tag-agnostic)

**A slide is any direct child of the carousel** — selected as
`> :not(ui-chip, ui-sticker, ui-play, ui-save)` so the tag is never hardcoded. It can be:
- an `<img>`/`<video>` (a single-media slide), or
- **any wrapper** holding a group: `<ui-slide>`, a layout-system element (`<lay-out>`),
  or a plain `<div>`. The carousel only makes it a snap child
  (`flex: 0 0 100%; scroll-snap-align: start`) and gives it **one** `::scroll-marker`.

**Excluded — overlay furniture.** `<ui-chip>` / `<ui-sticker>` / `<ui-play>` / `<ui-save>`
are direct children too, but stay absolutely positioned over the frame (media.css). The
`:not()` keeps them out of the slide layout *and* out of the dot set (no phantom dots).
The same exclusion list lives in `ui-media.js` (`NOT_SLIDE`) for the loop/autoplay count.

**The carousel does NOT lay out the items inside a group** (columns/gap/object-fit) — the
wrapper keeps its own `display`, so the **layout system** (or a `.slide-cols` class with a
`--cols` var) owns that. There is intentionally no `cols()` token. Note: `media.css`
absolutely-stacks any `<img>` descendant of `<ui-media>`, so a layout class for
plain-image groups must reset them to `position: relative; inset: auto`.

## Nesting guard

A `<ui-media>` nested **inside** a layered `<ui-card>` slide is NOT itself a scroller.
The descendant carousel rules would otherwise cascade into it. The **layout reset** lives
in `media.css` as a rendering rule — `ui-media ui-media` (specificity 0,0,2) pins it back
to the base frame (grid, `overflow: hidden`, abspos images), out-specifying the carousel's
descendant rules (0,0,1). The carousel-specific **control suppression** stays here in
`@supports` (`scroll-marker-group: none`, `::scroll-button { display:none }`,
`::scroll-marker { content: none }`).

## Dots

- `::scroll-marker-group` is `position: absolute; position-anchor: auto`, centered via
  `justify-self: anchor-center`, anchored above the bottom edge with `anchor(bottom)`.
- `dot(cir)` (default) round markers; `dot(pll)` rounded-rect.
- **Ink:** `dot(lgt)` / `dot(drk)` set `--ui-media-dot-bg` + `--ui-media-dot-active`
  to the light / dark pairs (`nav(blw)` defaults to dark).
- **`dot(pll)` timer:** the `:target-current` pill fills L→R over `--ui-media-autoplay`
  via the `ui-media-pill-fill` keyframes (a visual autoplay hint; ui-media.js advances).
  Under `prefers-reduced-motion: reduce` the fill is shown static (no animation).
- Sizes `dot(sm|md|lg|xl)` set `--ui-media-dot-size` + matching pill width/height **and**
  `--ui-media-thumb-size` (`md` = default) — one scale for dots, pills and thumbnails.
- **`dot(tmb)` — image thumbnails.** Each marker becomes a picture set per-slide via
  `--ui-media-thumb-url` (on the slide `<img>` or the slide `<ui-card>`); it inherits to that
  slide's `::scroll-marker`. Sized by `--ui-media-thumb-size` × `--ui-media-thumb-ratio`,
  white `--ui-media-thumb-border`, inactive dimmed via `--ui-media-thumb-opacity`. The active
  thumb layers a **bottom timer stripe** (2-layer background: `linear-gradient` stripe over
  the image) animated 0→100% width by the `ui-media-thumb-timer` keyframes over
  `--ui-media-autoplay`. **The timer is OFF by default** (`--ui-media-thumb-timer-name: none`) —
  it's autoplay feedback, so `ui-media.js` sets the keyframe name only when autoplay (`auto`/
  `loop`) runs (set it manually to preview without JS). URL is a custom property today; swaps
  to `attr(data-thumb type(<image>))` once that resolves (Chrome parses it but doesn't yet paint).
- **Corner placement.** `dot(tl|tr|bl|br)` re-anchor the whole marker-group to a corner
  (overlay), inset by `--ui-media-marker-inset` (defaults to the overlay gap; `dot(tmb)`
  bumps it to `1rem`). In `axis(y)` the corner rail stacks vertically. Default (no corner
  token) stays bottom-centered.

## Arrows

- A circular `::scroll-button` = themeable circle (`--ui-media-arrow-bg`) + a glyph.
  Default is Instagram-style: a frosted semi-transparent-white circle (`rgb(255 255 255 / 0.7)`),
  dark glyph, no border, a soft `--ui-media-arrow-shadow`.
- **One base glyph, rotated.** A single RIGHT-pointing SVG (chevron or full arrow, in
  light/dark) is rotated per direction via `--_arw-rot` (left 180°, up −90°, down 90°) —
  no prev/next/up/down SVG duplication.
- **Shape × shade** (independent, composed): shape = chevron (default, `arw(chv)`) · `arw(arr)`;
  theme = light (default / `arw(lgt)`: light circle + dark glyph) · `arw(drk)` (dark circle + white glyph
  + light hover ring, one atom — works on the overlay and in bands). A direct `--ui-media-arrow-glyph` / `--ui-media-arrow-bg` override wins.
- Sizes `arw(sm|md|lg|xl)` set `--ui-media-arrow-size` (`md` = 2.25rem default).
- **Placement** `arw(mid|top|bot)` set `--ui-media-arrow-top` (mid = `anchor(center)` default).
- **`arw(set)`** moves the left button next to the right one (adjacent pair at inline-end).
- **Disabled (dead-end) arrow** dims to `--ui-media-arrow-disabled-opacity` (0.4) by
  default; **`arw(hid)`** sets it to 0 (auto-hide instead of dim).
- **`arw(bare)`** drops the circle: the glyph itself is painted as a recolourable shape
  (`mask-image` of the SVG + `background-color` = the ink), so it can be any colour
  (`--ui-media-arrow-color`). A `:disabled` `::scroll-button` drops its mask, so the
  disabled bare arrow paints the glyph SVG directly as `background-image`
  (`--ui-media-arrow-glyph-dim`) to avoid a circle artifact, with `transition: none` so
  the switch is instant (no bg-colour fade flashing a filled circle as the mask drops).
- **Hover / focus** — the button `transform` carries a `scale()` slot; bare glyphs scale to
  `--ui-media-arrow-hover-scale` (1.18) on hover and `:focus-visible`. Focus ring: the
  **circle** variant uses a real `outline` (`--ring-*`); **bare** can't (its `mask` clips the
  outline), so it uses a stacked `drop-shadow` in `--ring-color` that traces the glyph.
- **Scroller focus** — the carousel `<ui-media>` is a keyboard-focusable scroller (arrow-key
  scrolling). On `:focus-visible` it draws a dashed ring (`--ui-media-focus-*`): nested in a
  `ui-card`/`ui-reveal` it rings the **wrapper** (via `:has()`), standalone it rings the
  **media**. A `<ui-media>` nested inside another (a slide's own frame) never rings.

## `nav(blw)` — control band

A non-scrolling bottom band, created by `padding-block-end` on the flex scroller (vertical
padding doesn't scroll in a horizontal scroller; images keep `block-size: 100%` and stay
above it). The absolute controls re-anchor into the band via `anchor(bottom)`. The band
defaults to the (light) card surface, so the dot/arrow ink defaults flip to dark here
(inline `style=` on the holder still wins by specificity).

- **Band size:** `--ui-media-band` (2.75rem) + a gap above it, `--ui-media-below-gap`
  (`--spacing-sm`), so card-shadow/elevation has room inside the clipped scrollport.
- **Dot position:** centered by default; the row cell's inline letter moves them —
  start = after the left arrow, end = before the right arrow (or the `arw(set)` pair).
  In `nav(blw)` use the bottom-row cells `dot(bs|bc|be)`; in `nav(abv)` the top-row
  `dot(ts|tc|te)`. `arw(set)` defaults dots to start; offsets account for arrow size/gap
  so they never overlap. The vertical band edge differs by band; the inline math is shared.

## Vertical controls (`axis(y)`)

Up/down arrows + a vertical dot column on the inline-end edge by default; a start-inline
cell `arw(cs)` flips both to the inline-start edge; `arw(set)` stacks the pair at the
block-end (a top-row cell `arw(set) arw(te)` stacks it at the block-start instead).
`nav(blw)` / `nav(abv)` give a horizontal control band below / above the vertical media.

**Dot alignment:** the dot column is given `inline-size: var(--ui-media-arrow-size)` and
`align-items: center`, so the dots sit centered within the arrow-width band — on the same
vertical axis as the up/down arrows (rather than flush to the edge). Works on either edge:
`arw(cs)` only flips `justify-self`, the centering carries over.

**`nav(blw)` + `axis(y)`** is special: a vertical scroller's `padding-block-end` is on
the SCROLL axis, so it can't carve a fixed cross-axis band (the next slide peeks through).
So the band is a **solid, full-width overlay** (the marker-group itself) pinned to the
bottom of the scrollport — it covers the peek; the rotated up/down arrows sit on it
(`z-index: 4`). The base `padding-block-end` still shrinks each slide to fit above it.

## Loop clones

`ui-media.js` prepends/appends a clone slide for the seamless `loop`. Clones carry
`[data-clone]` and `ui-media > [data-clone]::scroll-marker { content: none }` suppresses
their dots, so only the real slides count.

## Play/pause control (`<ui-play>`)

Drop a `<ui-play>` furniture child into an autoplay carousel to get a play/pause button:

```html
<ui-media media="asr(4/3) nav auto(4s) loop play(bs)">
  <ui-play size="sm"><button type="button" aria-label="Play/pause"><ui-icon type="play"></ui-icon></button></ui-play>
  <img …><img …>…
</ui-media>
```

**Pinning.** A scroll container's absolute furniture lives in the *scrolled content* and
scrolls away with the slides — only the browser-generated `::scroll-button`/`::scroll-marker`
pseudos sit in the non-scrolling layer. So on a scrolling carousel (`auto`/`loop`) the
control is turned into a **`position:sticky`** flex child pinned to the scrollport edge:

- **Start corners** (`play(bs)`/`play(ts)`/`play(cs)`) — zero inline-size, first child,
  left-sticky; the button overflows the 0-width box (`justify-items:start`).
- **End corners** (`play(be)`/`play(te)`/`play(ce)`) — `inline-size:max-content`, and
  `ui-media.js` moves the control to the **last child** so right-sticky can clamp (a
  zero-width box has no rectangle to stick on the inline-end).

Only the **6 edge corners** are pinnable — sticky pins to an edge, not the centre. The
center-inline tokens (`play(tc)`/`play(cc)`/`play(bc)`) are for a **non-scrolling video**
(a single centred play button, absolute furniture — see [media.md](./media.md)); on a
scrolling carousel they fall back to bottom-start.

Corner is driven by `play(*)` via three private vars set on the host/`<ui-media>`
(`--_play-block` · `--_play-inline` · `--_play-justify` · `--_play-size`); the vars use
`--ui-media-overlay-gap` (not `--_g`, which is only defined on the `<ui-play>` itself).
Non-scrolling media (a single `<ui-play>` over one image) is untouched — the pin is gated
on `auto`/`loop`.

**Wiring (`ui-media.js`).** When a `<ui-play>` is present in an autoplay carousel it becomes
the **sole** pause mechanism — the implicit hover/focus/pointer auto-pause is dropped so the
glyph never desyncs from reality:

- init: reflects the running state (`play.playing = true` → `aria-pressed`, `pause` glyph);
- `ui-play-toggle` → toggles the timer and sets `--ui-media-play-state` (`running`/`paused`),
  which also freezes the `dot(pll)`/`dot(tmb)` fill animations via `animation-play-state`;
- `visibilitychange` resume is guarded by the user-pause state.

Under `prefers-reduced-motion` autoplay never starts, so the control stays a static button.
Add `variant="reveal"` (from `@browser.style/play`) to hide it until the frame is hovered
or focused. Requires `../play/index.js` loaded on the page.

## Staggered content reveal (`stagger`) — pure CSS

Opt-in via `media="stagger"`. Each slide's `<ui-content>` children fade + rise in, one after
another, when the slide becomes the current (snapped) one — the "hero slider" reveal. This is
the same technique as [chrome.dev's slider](https://chrome.dev/carousel/horizontal/slider/):
**no JavaScript**.

**Mechanism — `scroll-state` container queries.**

1. Each slide (`> :not(<furniture>)`) becomes a scroll-state query container:
   `container-type: scroll-state`.
2. The `<ui-content>` children carry the transition + per-child delay (always).
3. Inside `@container not scroll-state(snapped: inline)` the children are hidden
   (`opacity: 0; translate: 0 var(--stagger-distance)`). When the slide **snaps** to the
   inline centre, that query stops matching → the children transition back to visible,
   staggered by their `transition-delay`.

Because it's a **time-based transition** (clock, not scroll-linked), the ~1s cascade plays
identically on autoplay, arrow-click and swipe — and it can't be "scrubbed" or compressed by
scroll velocity. Putting the *hidden* state inside the query means unsupported browsers just
show the content (graceful). `scroll-state()` is Chromium-only, same tier as `::scroll-marker`.

Shares the global tokens from `ui/base/tokens.css`:

| Token | Default | Purpose |
|-------|---------|---------|
| `--stagger-begin` | `0s` | Lead-in delay before the first child starts (added to every child) |
| `--stagger-distance` | `5rem` | Travel distance (`translate` start for rise/fall/lft/rgt) |
| `--stagger-duration` | `0.75s` | Per-child fade/rise duration |
| `--stagger-easing` | `cubic-bezier(0.16, 1, 0.3, 1)` | Easing |
| `--stagger-step` | `0.07s` | Delay added per child |

Per-child delay = `--stagger-begin + (sibling-index() - 1) * --stagger-step`.

**Reveal type — `ani(<type>)`.** The hidden "from" state is driven by private vars
(`--_stg-tr` translate · `--_stg-sc` scale · `--_stg-fl` filter), so `ani()` just swaps them —
the content rule already transitions `opacity`/`translate`/`scale`/`filter`. Compose:
`media="stagger ani(zom)"`. `<d>` = `var(--stagger-distance)`.

| token | from-state | feel |
|-------|-----------|------|
| `ani(rise)` | `translate: 0 <d>` | up (**default**, no token needed) |
| `ani(fall)` | `translate: 0 -<d>` | down |
| `ani(lft)` | `translate: -<d> 0` | slide from inline-start |
| `ani(rgt)` | `translate: <d> 0` | slide from inline-end |
| `ani(zom)` | `scale: 0.65` | zoom / scale up |
| `ani(blr)` | `filter: blur(12px)` | blur + fade |
| `ani(fde)` | — (opacity only) | plain fade |

Set `ani()` on the **carousel** for one shared reveal, or on an **individual slide's**
`media=` for a per-slide reveal — the setter is element-level (`:where([media*="ani(x)"])`),
so a slide's own `ani()` (a closer ancestor of its `<ui-content>`) overrides the
carousel-level one. e.g. `<ui-card media="asr(16/9) … ani(zom)">`.

**Multi-card slides + two channels (`crd()` + `ani()`).** When a slide is a `<ui-slide>`
group of cards, the **cards themselves** cascade in (like the ui-tabs/ui-reveal stagger),
*and* each card's content cascades within it (nested: card index, then child index). Two
independent from-state channels drive it, same type vocabulary:

- **`crd(<type>)`** → the **card** reveal (`--_stg-crd-*`). Default rise. Same type vocabulary as `ani()`.
- **`ani(<type>)`** → the **content** reveal (`--_stg-*`). Per-card.

So `media="stagger crd(rise)"` on the carousel + `ani(lft)` on a card = that card rises as a
unit while its copy slides in — independently. The per-card offset uses a registered
`@property --_stg-crd-i` (`<integer>`, inherits) set to `sibling-index() - 1` on each card, so
`sibling-index()` resolves on the *card* (a bare custom property would defer it to the content
child and lose the card's position). Single-card (hero) slides have no `<ui-slide>`, so
`--_stg-crd-i` stays `0` and only the content channel runs.

Add `--ui-media-gap` (on the scroller) for space between slides/pages — default `0` (flush);
set e.g. `--ui-media-gap: var(--spacing-lg)` on multi-card carousels so pages don't touch.

**Related — `ui-tabs`** uses a different trigger (`@starting-style` on `details[open]`, since
tabs aren't a scroller) but the **same shared `--stagger-*` tokens** (it aliases its
`--ui-tabs-stagger-*` to them). Gated on `@media (prefers-reduced-motion: no-preference)`.
Requires a snapping carousel (`nav`); needs no `ui-media.js`.

## Tokens

All `--ui-media-*` custom properties are listed in [carousel.md](./carousel.md#custom-properties).
