# `media.carousel.css` — architecture & internals

Implementation notes for the CSS-only `<ui-media>` carousel. **User-facing token
reference + examples live in [carousel.md](./carousel.md)** — this file documents
*how* the stylesheet works (the "why" that used to live in code comments).

The behavior layer (`auto`, `loop`) is in [carousel.js](./carousel.js) — imported by
the package entry [index.js](./index.js), or loadable on its own; see
carousel.md for those tokens.

---

## One entry point, one vocabulary

**`media="…"` tokens are the only configuration surface.** Parens-wrapped, prefixed
tokens (`nav(blw) arw(lg) arw(drk)`). Tokens can't be grouped (CSS substring matching
can't isolate inner values), so each is its own token. The old dedicated `nav=` /
`arrow=` / `dot=` attributes are **removed** — there is no attribute form.

**Inheritance stops at the card.** A `<ui-media>` reads `media=` from **itself or its
nearest `<ui-card>` / `<ui-reveal>` host only** — never from arbitrary ancestors. A
`media=` on a `<lay-out overflow>` configures only the lay-out's **own** scroller (it
uses these same control tokens — `<lay-out overflow media="nav(blw) arw(bare) pages">`)
and never leaks into a descendant `<ui-media>`. Contrast `content=`, which is pure
custom-property inheritance and flows down freely.

### Shared ink scale

Controls + scrim share one shade vocabulary: `lgt` (light/white) · `drk` (dark/black) ·
`med` (scrim only). Arrows + markers use `lgt`/`drk`.

## All tokens (alphabetical)

Every option the carousel recognises. **Layer:** CSS = `media.carousel.css` (with the
generic control chrome in `ui/base/carousel.css`, and `stagger` / `ani()` / `crd()` entirely
in `ui/base/stagger.css` — see *Staggered content reveal*), JS = `carousel.js` / `video.js` /
`hover.js` (all bundled by `index.js`), load = `ui-media-srcset.js`. (`nav` is required to
make the scroller; the rest layer on top. `asr()` etc. belong to the base frame — see
media.md.)

| `media=` token | Layer | Effect |
|----------------|-------|--------|
| `ani(<type>)` | CSS | `stagger` **content** reveal type: `rise` (default) · `fall` · `lft` · `rgt` · `zom` · `blr` · `fde` (see "Staggered content reveal") |
| `crd(<type>)` | CSS | `stagger` **card** reveal type (multi-card slides) — same vocabulary, independent of `ani()` |
| `arw(arr)`  | CSS | Full-arrow glyph (default is chevron — no token) |
| `arw(bare)` | CSS | Drop the circle — glyph painted as a recolourable shape (`--ui-carousel-arrow-color`) |
| `arw(bc)`   | CSS | Split arrows, bottom band (block row) |
| `arw(blw)` `arw(abv)` | CSS | Arrows **alone** in a reserved band below / above the media (markers keep their on-media position/ink); arrow ink flips to the band theme |
| `arw(drk)`  | CSS | **Dark theme** preset — dark circle + white glyph + light hover ring (composes on the overlay and in `nav(blw)`/`nav(abv)` bands; on `arw(bare)` it just paints a dark glyph) |
| `arw(hid)`  | CSS | Auto-hide the dead-end arrow (default dims it) |
| `arw(rev)`  | CSS | Reveal arrows on hover / focus-within (+ button `:focus-visible`); gated on `@media (hover: hover)` so touch keeps them visible |
| `arw(lg)`   | CSS | Arrow size 2.75rem |
| `arw(lgt)`  | CSS | **Light theme** preset — light circle + dark glyph (the default look, made explicit) |
| `arw(cc)`   | CSS | Split arrows, vertically centered (**default**) |
| `arw(set)`  | CSS | Cluster both arrows; placeable in any grid cell — `arw(set) arw(<cell>)`, default `ce` (horizontal) / `be` (vertical) |
| `arw(sm)`   | CSS | Arrow size 1.75rem (default is 2.25rem — no token) |
| `arw(sqr)` `arw(sft)` | CSS | **Square** button instead of the default circle — `sqr` = sharp corners, `sft` = slight radius |
| `arw(cs)`   | CSS | `axis(y)`: start-inline cell moves up/down arrows + dots to the inline-start edge |
| `arw(tc)`   | CSS | Split arrows, top band (block row) |
| `arw(xl)`   | CSS | Arrow size 3.25rem |
| `auto` · `auto(4s)` · `auto(800ms)` | JS | Autoplay (default 5s); pauses on hover/focus/drag/hidden-tab/reduced-motion. Add a `<ui-play>` child for an explicit play/pause control (then hover/focus pause is dropped — see `play(<corner>)`) |
| `axis(y)`   | CSS | Vertical carousel (snap on Y; arrows become up/down) |
| `mrk(bc)` `mrk(tc)` | CSS | `nav(blw)`/`nav(abv)`: dots centered in the band (**default**) — `bc` below, `tc` above |
| `mrk(blw)` `mrk(abv)` | CSS | Dots **alone** in a reserved band below / above the media (arrows keep their on-media position/ink); marker/pill ink flips to the band theme |
| `mrk(drk)`  | CSS | Dark marker ink |
| `mrk(be)` `mrk(te)` | CSS | `nav(blw)`/`nav(abv)`: dots at the inline-end — `be` below, `te` above |
| `mrk(hyb)`  | CSS | **Hybrid** dots — markers stay circles; the active one morphs into a pill and runs the `mrk(pll)` fill timer |
| `mrk(lbl)`  | CSS | **Text-label** markers — each slide's `aria-label` becomes a pill (`content: attr(aria-label)`, mirrors how `mrk(tmb)` reads a per-slide image). Positions with the same 9-grid cells (`mrk(ts/tc/te … bs/bc/be)`). Styled via `--ui-carousel-label-*` custom properties (below), incl. an optional group background/shadow |
| `mrk(lg)`   | CSS | Marker size 0.8rem |
| `mrk(lgt)`  | CSS | Light/white marker ink |
| `mrk(md)`   | CSS | Marker size 0.6rem (**default**) |
| `mrk(pll)`  | CSS | Pill dots; active pill fills L→R over `--ui-carousel-autoplay` (timer hint) |
| `mrk(sm)`   | CSS | Marker size 0.45rem |
| `mrk(bs)` `mrk(ts)` | CSS | `nav(blw)`/`nav(abv)`: dots at the inline-start — `bs` below, `ts` above |
| `mrk(non)`  | CSS | No dots (keeps arrows) — arrows-only band |
| `mrk(tmb)`| CSS | Image thumbnails; per-slide `--ui-carousel-thumb-url`; active thumb has a bottom timer stripe. Overlay in a corner, or `+ mrk(blw)`/`nav(blw)` for a gallery **filmstrip band** below — band auto-sizes to the thumb; image keeps `asr()` (`box-sizing: content-box`) and is rounded on all 4 corners to `rds()` |
| `mrk(ts)` `mrk(te)` `mrk(bs)` `mrk(be)` | CSS | Corner placement for the overlay marker-group — logical (top-start / top-end / bottom-start / bottom-end). Center row `mrk(cs)` `mrk(cc)` `mrk(ce)` completes the 9-grid. Inset via `--ui-carousel-marker-inset` |
| `mrk(rail)` | CSS | With `axis(y)` + `mrk(tmb)`: vertical thumbnail rail **beside** the media (inline-start; right in RTL). Reserves inline space (`padding-inline-start` + `content-box`) so the image keeps `asr()`; arrows dropped; thumbs shrink to `--ui-carousel-thumb-min` then the rail scrolls. Width `--ui-carousel-rail` |
| `mrk(sbr)` | CSS | **System bar (WIP)** — styles the scroller's **real** scrollbar as a full-width bottom bar instead of drawing markers, so it is natively draggable with zero JS. One central `--ui-carousel-sbr-*` set (`-track` `-thumb` `-size` `-inset` `-radius` `-track-radius` `-thumb-radius` `-gap`) feeds both the standard (Firefox `scrollbar-color`) and `::-webkit-scrollbar` paths; `content-box` like `mrk(tmb)` so the bar is added outside the `asr()` image |
| `tmb(<ratio>)` | CSS | Thumbnail aspect-ratio (default `4/3`): `1/1 · 4/3 · 3/4 · 16/9 · 3/2 · 2/3` (slash, mirrors `asr()`). Sets `--ui-carousel-thumb-ratio` (+ `-ratio-n`, the numeric form the `mrk(rail)` width calc uses) |
| `mrk(xl)`   | CSS | Marker size 1rem |
| `loop`      | JS | Seamless infinite loop (clones first/last slide) |
| `nav`       | CSS | Carousel **on** — markers + arrows (the trigger) |
| `nav(arw)`  | CSS | Arrows only |
| `nav(blw)`  | CSS | Markers + arrows in a reserved band below the media |
| `nav(abv)`  | CSS | Markers + arrows in a reserved band above the media (mirror of `nav(blw)`) |
| `nav(mrk)`  | CSS | Markers only |
| `pages`     | CSS | **`<lay-out overflow>` only** — one `::scroll-marker` per *page* of `--_ci` items instead of per item, and page-wise snapping. Whole-token matched; implemented in `layout/core/base.css` via `mod(sibling-index() - 1, --_ci)` + `if(style(--_pg: 0))`, degrading to per-item where those are unsupported |
| `stagger`   | CSS | Staggered content reveal — each slide's `<ui-content>` children fade + rise in when it becomes the snapped slide (pure CSS via `scroll-state` queries; see below) |

### `<ui-media>` frame tokens (not carousel — for reference)

These belong to the base `<ui-media>` frame ([media.css](./media.css), docs in
[media.md](./media.md)) and work with or without a carousel. Listed by family
(`obp()`'s `<pos>` accepts **both** the logical grid `ts tc te cs cc ce bs bc be` — canonical,
mirrors in RTL — and the physical grid `tl tc tr cl cc cr bl bc br`, which is kept on purpose
because `object-position` has no logical keywords. Furniture uses the logical set only.)

| Token | Layer | Effect |
|-------|-------|--------|
| `asr(1/1 · 1/2 · 6/7 · 3/4 · 4/3 · 3/2 · 2/3 · 16/9 · 21/9)` | CSS | Aspect ratio of the frame — nine ratios, and the one `media=` token that takes `md:`/`lg:` prefixes |
| `obf(cover · contain · fill · none)` | CSS | `object-fit` (default cover) |
| `obp(<pos>)` | CSS | `object-position` (9-grid, logical **or** physical spelling) |
| `rds(non · sm · md · lg · xl · 2xl · full · pill)` | CSS | Corner radius (standalone frame); `-sq` variants add a squircle corner. `rds(none)` is a deprecated alias of `rds(non)` |
| `clip` | CSS | `clip-path: inset(0 round …)` at the `rds()` radius — keeps rounded corners while a carousel scrolls (border-radius alone can drop them mid-scroll). Reuses `--ui-media-radius`; no superellipse |
| `flp(h · v · hv)` | CSS | Flip the image horizontally / vertically / both |
| `hov(<17 values>)` | CSS (+JS) | Hover effect. Five families — scale (`zoom` `pan`), cursor (`track` `drift` `tilt`), 3D (`tilt-out` `tilt-in`), rotate (`rot-r` `rot-l`), clip (`shape` `shape-rev`), filter (`gray` `blur` `bright` `dim` `sat`) + `tint`. Only the three **cursor** effects need JS (`hover.js`) — full table in [media.md](./media.md#hov--hover-effect-image-only) |
| `scm` · `scm(<pos>)` · `scm(sm · md · lg · xl)` · `scm(shr · lgt · med · drk · sld)` | CSS | Scrim — direction (logical furniture grid, mirrored under `:dir(rtl)`) + size + intensity. `sheer`/`solid` are deprecated aliases of `shr`/`sld` |
| `load(eager · lazy)` | load | Image/video loading (`ui-media-srcset.js`); `load(eager)` = all slides eager, first slide gets `fetchpriority="high"` (hero); `load(lazy)` = all lazy (the default) |
| `chip(<pos>)` · `chip(<hue>)` | CSS | Position + colour a `<ui-chip>` child. Canonical hues: `red orange green blue accent black white gray` (+ `pale`/`muted` modifiers; `dark`/`light`/`subtle`/`slate` are deprecated aliases) |
| `sticker(<pos>)` · `sticker(<hue>)` | CSS | Position + colour a `<ui-sticker>` child — same grid + hue set as `chip()` |
| `beacon(<pos>)` · `beacon(<hue>)` | CSS | Position + colour a `<ui-beacon>` child — same grid + hue set |
| `marquee(top · bot)` · `marquee(rpt · seam · fade)` · `marquee(<hue>)` · `marquee(sm · lg · xl · 2xl)` | CSS | The `<ui-marquee>` **band** — full-width, top/bottom only, `z-index: 1` (below furniture). The old `marquee(loop)` spelling is removed — use `marquee(rpt)` |
| `play(<pos>)` · `play(<size>)` | CSS (+JS on autoplay) | Position **and** size a `<ui-play>` child — one stem, two disjoint vocabularies (`ts…be` vs `sm md lg xl`). On a **scrolling** carousel (`auto`/`loop`) the control is `position:sticky`-pinned to the scrollport (plain furniture would scroll away) and `carousel.js` wires it as the play/pause button — see "Play/pause control" below. (`ply(<size>)` is a deprecated alias) |
| `save(<pos>)` · `save(<hue>)` | CSS | Position + colour a `<ui-save>` child |

---

## Foundations

- **Cascade layer:** everything is in `@layer bs-component` (same layer as `media.css`,
  which is imported first — so carousel rules win ties on source order).
- **The `nav` token is the trigger.** `:where([media*="nav"])` turns `<ui-media>` into a
  flex scroll-snap row. Without it, `<ui-media>` is a plain single-image frame.
- **Dual-selector form.** Every rule lists two selectors so the same option works from
  `media=` on the card host or on the element itself — and this pair is exactly the
  "stops at the card" scoping rule, expressed in CSS (only `ui-card`/`ui-reveal`
  qualify as hosts, never arbitrary ancestors):
  - host form (card-scoped): `:where(ui-card, ui-reveal):where([media*="x"]) ui-media …`
  - self form: `ui-media:where([media*="x"]) …`
- **`@supports (scroll-marker-group: after)` gate.** Dots (`::scroll-marker`) and arrows
  (`::scroll-button`) are Chromium-only; everything inside that block degrades to a bare
  swipe/scroll-snap row elsewhere.
- **Matching.** `media=` tokens match with `[media*="…"]` (substring); `:not([media*="nav("])`
  distinguishes bare `nav` from the parenthesised `nav(mrk)` / `nav(arw)` / etc. Substring
  matching is also why tokens are atomic — one value per `token(…)`, never grouped.

## Token → control mapping (inside `@supports`)

- **DOTS present** = bare `nav` · `nav(mrk)` · `nav(blw)` / `nav(abv)` (drop them with `mrk(non)`)
- **ARROWS present** = bare `nav` · `nav(arw)` · `nav(blw)` / `nav(abv)`

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

**A slide is any direct child of the carousel** — selected with a `:not()` exclusion
list rather than a tag whitelist, so the tag is never hardcoded. It can be:
- an `<img>`/`<video>` (a single-media slide), or
- **any wrapper** holding a group: `<ui-slide>`, a layout-system element (`<lay-out>`),
  or a plain `<div>`. The carousel only makes it a snap child
  (`flex: 0 0 100%; scroll-snap-align: start`) and gives it **one** `::scroll-marker`.

**Excluded — furniture, bands and control groups.** The five overlay elements
(`<ui-chip>` / `<ui-beacon>` / `<ui-sticker>` / `<ui-play>` / `<ui-save>`) and the
`<ui-marquee>` band are direct children too, but stay absolutely positioned over the
frame (media.css). The `:not()` keeps them out of the slide layout *and* out of the
marker set (no phantom markers).

**One exported list.** The exclusion list is defined **once**, as `NOT_SLIDE` in
[`shared.js`](./shared.js), and is what `slidesOf()` filters on — so the loop-clone
count and the autoplay index can never disagree with each other:

```js
export const NOT_SLIDE = /^(UI-BEACON|UI-CHIP|UI-MARQUEE|UI-PLAY|UI-SAVE|UI-STICKER|UI-CAROUSEL-CONTROLS|LAY-OUT)$/;
export const slidesOf = (el) => [...el.children].filter(c => !NOT_SLIDE.test(c.tagName));
```

The CSS `:not()` list in `media.carousel.css` is the visual half of the same rule and
carries a `keep in sync with NOT_SLIDE in shared.js` cross-reference:

```css
ui-media:where(…) > :not(ui-beacon, ui-chip, ui-marquee, ui-play, ui-save, ui-sticker) { … }
```

The two lists are **cross-referenced, not identical** — deliberately. Both exclude the
same six *painted* elements. `NOT_SLIDE` adds two more that only the counting side cares
about: `UI-CAROUSEL-CONTROLS` (generated control chrome — it never appears in hand-authored
markup the CSS rule has to size) and `LAY-OUT` (a scroller's own layout wrapper, which the
JS must not count as a slide of its own). If you add a new overlay element, add it to
**both**.

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

## Markers

- `::scroll-marker-group` is `position: absolute; position-anchor: auto`, centered via
  `justify-self: anchor-center`, anchored above the bottom edge with `anchor(bottom)`.
- Default markers are round dots (no token); `mrk(pll)` rounded-rect.
- **Ink:** overlaid dots default to the light pair (white on the image). In a **band**
  (`nav(blw|abv)`, `mrk(blw|abv)`) the marker + pill tokens are re-derived from
  `--ui-carousel-controls-ink`, default `currentColor` — the band is transparent, so
  the ink of the surface showing through (`--color-text`, or `--_theme-c` on a themed
  card) is exactly the right contrast reference, and the dots follow `color-scheme`
  and `theme=` with no media query. `mrk(lgt)` / `mrk(drk)` are declared after the band
  blocks and still force `--ui-carousel-marker-bg` + `--ui-carousel-marker-active` to
  the light / dark pairs.
  **Gotcha:** the UA styles a `::scroll-marker` like an anchor, so its `color` starts at
  `LinkText` (blue) — `currentColor` in a marker means *link blue*, not the card ink.
  The base marker rule therefore sets `color: inherit`; without it the band ink resolves
  blue. (Same reason `mrk(lbl)` sets an explicit colour + `text-decoration: none`.)
- **`mrk(pll)` timer:** the `:target-current` pill fills L→R over `--ui-carousel-autoplay`
  via the `ui-carousel-pill-fill` keyframes (a visual autoplay hint; `carousel.js` advances).
  Under `prefers-reduced-motion: reduce` the fill is shown static (no animation).
- Sizes `mrk(sm|md|lg|xl)` set `--ui-carousel-marker-size` + matching pill width/height **and**
  `--ui-carousel-thumb-size` (`md` = default) — one scale for dots, pills and thumbnails.
- **`mrk(tmb)` — image thumbnails.** Each marker becomes a picture set per-slide via
  `--ui-carousel-thumb-url` (on the slide `<img>` or the slide `<ui-card>`); it inherits to that
  slide's `::scroll-marker`. Sized by `--ui-carousel-thumb-size` × `--ui-carousel-thumb-ratio`,
  white `--ui-carousel-thumb-border`. Active vs inactive is signalled by border colour
  (`--ui-carousel-thumb-border-color` → `-color-active`); `--ui-carousel-thumb-opacity` defaults to
  `1`, so thumbs are fully opaque unless you set it lower. The active
  thumb layers a **bottom timer stripe** (2-layer background: `linear-gradient` stripe over
  the image) animated 0→100% width by the `ui-carousel-thumb-timer` keyframes over
  `--ui-carousel-autoplay`. **The timer is OFF by default** (`--ui-carousel-thumb-timer-name: none`) —
  it's autoplay feedback, so `carousel.js` sets the keyframe name only when autoplay (`auto`/
  `loop`) runs (set it manually to preview without JS). URL is a custom property today; swaps
  to `attr(data-thumb type(<image>))` once that resolves (Chrome parses it but doesn't yet paint).
- **`mrk(lbl)` — text-label pills.** Each marker prints its slide's `aria-label` via
  `content: attr(aria-label)` (the label analogue of `mrk(tmb)`'s per-slide image). The
  pill is auto-height (`block/inline-size: auto`, padded), so the default/bottom/center
  placement re-anchors the group by its own edges instead of `--ui-carousel-marker-size`
  (top-row cells already anchor by `anchor(top)`). Styled entirely by **custom properties,
  not tokens** — per pill: `--ui-carousel-label-bg` / `-bg-current`, `-color` / `-color-current`,
  `-border-width` / `-border-color` / `-border-color-current`, `-radius`, `-padding`,
  `-font-size`, `-font-weight`; and on the group itself (optional, off by default):
  `--ui-carousel-label-group-bg`, `-group-backdrop` (e.g. `blur(8px)` — **no-op in Chrome today**:
  `backdrop-filter` is ignored on the `::scroll-marker-group` pseudo, so a "frosted" capsule renders
  translucent-only until browsers paint it), `-group-shadow`, `-group-radius`, `-group-padding`,
  `-group-gap`. Positions with the same 9-grid cells as dots/thumbs. The group hugs its labels;
  like a wide dot row it can spill on very narrow frames (a `::scroll-marker-group`'s inline size
  can't be reliably clamped to the frame in current Chrome), so keep labels short.
- **Corner placement.** `mrk(ts|te|bs|be)` re-anchor the whole marker-group to a corner
  (overlay), inset by `--ui-carousel-marker-inset` (defaults to the overlay gap; `mrk(tmb)`
  bumps it to `1rem`). The centre row `mrk(cs|cc|ce)` completes the same nine-cell logical
  grid the furniture uses — these are **logical** spellings (start/end, rtl-safe); there are
  no physical `mrk(tl|tr|bl|br)` forms. In `axis(y)` the corner rail stacks vertically.
  Default (no cell token) stays bottom-centered.
- **`mrk(bar)` — segmented thin scrollbar.** The marker-group becomes one full-width
  strip: every marker is an invisible `flex: 1 1 0` segment painted as a centered
  hairline (`linear-gradient` track, `100% × --ui-carousel-bar-track-size`), and
  `:target-current` repaints its stretch thicker (`--ui-carousel-bar-size`) in the
  active-marker ink — the "thumb", 1/N wide, snapping segment-to-segment. Track clicks
  and keyboard focus are native marker behavior; a focused segment shows an inset ring.
  **Sizing** is the subtle part: the `flex: 1 1 0` markers give the group no intrinsic
  width and opposing `left`/`right` anchor insets don't reliably stretch an
  anchor-positioned pseudo, so the scroller declares `anchor-name: --ui-carousel-bar`
  and the group sizes itself with `inline-size: calc(anchor-size(--ui-carousel-bar
  inline) - 2 * --ui-carousel-bar-inset)` (+ `position-anchor` to the same name, so the
  unnamed `anchor()` top/centering rules keep resolving). The scroller's matching
  `anchor-scope: --ui-carousel-bar` is **load-bearing** — without it, multiple bar
  carousels on one page cross-bind to each other's anchors. The hit-strip height
  (`--ui-carousel-bar-hit`) is aliased into `--ui-carousel-marker-size` on the host arm so
  every existing group top/centering calc (overlay + bands) centers the bar without
  bar-specific position rules; the geometry block is declared last inside the gate so
  it wins the corner/in-band alignment rules on source order. Horizontal only; outside
  the `@supports` gate the host arm tints the native thin scrollbar via
  `scrollbar-color` as the fallback. **Width**: with `mrk(bar)` the dot size scale is
  repurposed — the atoms set `--ui-carousel-bar-span` (sm .33 · md .5 · lg .75 =
  default · xl 1), a **fraction** that multiplies the `anchor-size()` term in the
  group's `inline-size` calc (fraction, not percentage: `calc(<length> * <percentage>)`
  is invalid). A partial-span strip stays centered via `justify-self: anchor-center`;
  the cell's inline letter re-pins it (`mrk(bs)`/`mrk(ts)` → `left: anchor(left)`,
  `mrk(be)`/`mrk(te)` → `right: anchor(right)`) — rules declared after the geometry
  block so they win on source order. (A continuous gliding thumb is possible —
  scroll-driven animation on the scroller + an inherited custom property, since
  `scroll(nearest)` does **not** resolve from the group's own box — but the segmented
  form needs no timeline at all.)

## Arrows

- A circular `::scroll-button` = themeable circle (`--ui-carousel-arrow-bg`) + a glyph.
  Default is Instagram-style: a frosted semi-transparent-white circle (`rgb(255 255 255 / 0.7)`),
  dark glyph, no border, a soft `--ui-carousel-arrow-shadow`.
- **One base glyph, rotated.** A single RIGHT-pointing SVG (chevron or full arrow, in
  light/dark) is rotated per direction via `--_arw-rot` (left 180°, up −90°, down 90°) —
  no prev/next/up/down SVG duplication.
- **Shape × shade** (independent, composed): shape = chevron (default, no token) · `arw(arr)`;
  theme = light (default / `arw(lgt)`: light circle + dark glyph) · `arw(drk)` (dark circle + white glyph
  + light hover ring, one atom — works on the overlay and in bands). A direct `--ui-carousel-arrow-glyph` / `--ui-carousel-arrow-bg` override wins.
- Sizes `arw(sm|lg|xl)` set `--ui-carousel-arrow-size`. The 2.25rem default is the *absence*
  of a size arg — there is no `arw(md)`.
- **Placement** is the eight-cell vocabulary `arw(ts|tc|te|cs|cc|bs|bc|be)`, which sets
  `--ui-carousel-arrow-top`; for **split** arrows only the block row is read (`tc` top ·
  `cc` centered = `anchor(center)`, the default · `bc` bottom). There is no `arw(ce)` (the
  inline-end column is `arw(set)`'s default) and no `arw(top|mid|bot)`.
- **`arw(set)`** moves the left button next to the right one (adjacent pair at inline-end).
- **Disabled (dead-end) arrow** dims to `--ui-carousel-arrow-disabled-opacity` (0.4) by
  default; **`arw(hid)`** sets it to 0 (auto-hide instead of dim).
- **`arw(rev)`** hides the arrows (`opacity: 0`, added to the button transition) and reveals
  them on the scroller's `:hover` / `:focus-within`, plus the button's own `:focus-visible`
  (keyboard). Wrapped in `@media (hover: hover)` — on touch (no hover) the rule never applies,
  so arrows stay visible and reachable.
- **`arw(bare)`** drops the circle: the glyph itself is painted as a recolourable shape
  (`mask-image` of the SVG + `background-color` = the ink), so it can be any colour
  (`--ui-carousel-arrow-color`). A `:disabled` bare arrow **keeps** the mask and just dims
  `opacity` (`--ui-carousel-arrow-disabled-opacity`), so it stays the same ink, faded — a white
  bare arrow stays white on a dark frame (the old glyph-dim swap repainted a fixed dark SVG,
  invisible there).
- **Hover / focus** — the button `transform` carries a `scale()` slot; bare glyphs scale to
  `--ui-carousel-arrow-hover-scale` (1.18) on hover and `:focus-visible`. Focus ring: the
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
defaults to the (light) card surface, so the marker/arrow ink defaults flip to dark here
(inline `style=` on the holder still wins by specificity).

- **Band size:** `--ui-carousel-band` (2.75rem) + a gap above it, `--ui-carousel-below-gap`
  (`--spacing-sm`), so card-shadow/elevation has room inside the clipped scrollport.
- **Marker position:** centered by default; the row cell's inline letter moves them —
  start = after the left arrow, end = before the right arrow (or the `arw(set)` pair).
  In `nav(blw)` use the bottom-row cells `mrk(bs|bc|be)`; in `nav(abv)` the top-row
  `mrk(ts|tc|te)`. `arw(set)` defaults dots to start; offsets account for arrow size/gap
  so they never overlap. The vertical band edge differs by band; the inline math is shared.

## Vertical controls (`axis(y)`)

Up/down arrows + a vertical marker column on the inline-end edge by default; a start-inline
cell `arw(cs)` flips both to the inline-start edge; `arw(set)` stacks the pair at the
block-end (a top-row cell `arw(set) arw(te)` stacks it at the block-start instead).
`nav(blw)` / `nav(abv)` give a horizontal control band below / above the vertical media.

**Marker alignment:** the marker column is given `inline-size: var(--ui-carousel-arrow-size)` and
`align-items: center`, so the dots sit centered within the arrow-width band — on the same
vertical axis as the up/down arrows (rather than flush to the edge). Works on either edge:
`arw(cs)` only flips `justify-self`, the centering carries over.

**`nav(blw)` + `axis(y)`** is special: a vertical scroller's `padding-block-end` is on
the SCROLL axis, so it can't carve a fixed cross-axis band (the next slide peeks through).
So the band is a **solid, full-width overlay** (the marker-group itself) pinned to the
bottom of the scrollport — it covers the peek; the rotated up/down arrows sit on it
(`z-index: 4`). The base `padding-block-end` still shrinks each slide to fit above it.

## Thumbnail bands — filmstrip (`mrk(tmb) mrk(blw)`) & rail (`axis(y) mrk(tmb) mrk(rail)`)

`mrk(tmb)` markers can move off the media into a **reserved band** — below/above
(`mrk(blw)`/`mrk(abv)`, block axis) or **beside** (`mrk(rail)`, inline axis, `axis(y)` only).

- **Band auto-size.** `mrk(tmb)` bumps `--ui-carousel-band` to `thumb-size + spacing-sm` and
  aliases `--ui-carousel-marker-size` to `--ui-carousel-thumb-size` (same trick as `mrk(bar)`)
  so every existing band/corner centering calc sizes to the real thumb, not the 0.6rem dot.
- **`box-sizing: content-box` (load-bearing).** `aspect-ratio` on the default border-box frame
  makes the band's `padding` steal from the `asr()` image (squished). content-box makes `asr()`
  size the **content box**, so the band is added *outside* the image. For the inline **rail**
  the slide `inline-size` is also shrunk by the rail width, or the border box overflows the
  container horizontally.
- **All-4-corner radius.** The frame `clip`/`rds()` clips the whole border box, so its bottom
  (or inline) radius sits below/beside the band — the image's own edge stays square. In a band
  the slide media elements are rounded directly to `--ui-media-radius` so the image floats as a
  fully-rounded card.

### Rail specifics (`mrk(rail)`)

- **Reservation:** `padding-inline-start` (logical → left in LTR, **right in RTL**) sized to
  `--ui-carousel-rail` (`thumb-size × 4/3` + slack) + gaps; the column is parked in it.
- **`anchor()` positioning is mandatory (collision).** Multiple `::scroll-marker-group`s on a
  page positioned with plain/logical insets (`inset-inline-start`, `inset-block`) collide — the
  insets resolve against a **shared** containing block, so a second rail renders over the first.
  The rail group must use `anchor()` on both axes (per-scroller, like the corner rules).
  `anchor(left)`/`anchor(right)` are physical, so RTL is an explicit `:dir(rtl)` flip.
- **Arrows dropped.** The rail is the navigation; `::scroll-button(*) { content: none }`
  un-generates the arrows (must be `content: none`, not `display: none`).
- **Overflow:** thumbs `flex: 0 1 auto` with `min-block-size: --ui-carousel-thumb-min` shrink to
  fit the media height, then the group scrolls (`overflow: hidden auto`) — never slivers.

## Loop clones

`carousel.js` prepends/appends a clone slide for the seamless `loop`. Clones carry
`[data-clone]` and `ui-media > [data-clone]::scroll-marker { content: none }` suppresses
their markers, so only the real slides count.

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
  `carousel.js` moves the control to the **last child** so right-sticky can clamp (a
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

**Wiring (`carousel.js`).** When a `<ui-play>` is present in an autoplay carousel it becomes
the **sole** pause mechanism — the implicit hover/focus/pointer auto-pause is dropped so the
glyph never desyncs from reality:

- `initAuto` finds the control with `scroller.querySelector(':scope > ui-play')` — direct
  child only, so a nested frame's own control is never hijacked;
- init calls `setPlaying(true)`: `reflectPlay()` writes `aria-pressed` on the button and
  `[open]` on the host (which morphs the `play-pause` glyph in CSS), and the interval starts;
- a **direct click listener** on the inner `<button>` toggles it. There is **no
  `ui-play-toggle` event** — this control is deliberately the loose, target-less shape:
  it carries no `commandfor`, so it is auto-discovered here rather than going through the
  invoker contract `video.js` handles for `<video>` targets;
- toggling sets `--ui-carousel-play-state` (`running`/`paused`), which also freezes the
  `mrk(pll)`/`mrk(tmb)` fill animations via `animation-play-state`;
- `visibilitychange` resume is guarded by the user-pause state.

Under `prefers-reduced-motion` autoplay never starts, so the control stays a static button.
Add `variant="reveal"` (from `@browser.style/play`) to hide it until the frame is hovered
or focused. Requires `../play/index.js` loaded on the page.

## Staggered content reveal (`stagger`) — pure CSS

> **Not in this stylesheet.** Unlike every other section on this page, the stagger system
> lives entirely in **[`ui/base/stagger.css`](../base/stagger.css)** — the host-agnostic
> engine `ui-tabs`, `ui-reveal` and `ui-accordion` share: the `container-type:
> scroll-state` on each slide, the `@container not scroll-state(snapped: inline)`
> from-state, the per-child `transition-delay`, and the `ani()`/`crd()` vocabulary arms.
> `media.carousel.css` carries **no** stagger rules at all. The section below is kept here
> because `media="stagger"` is a carousel token, but the code to read is `stagger.css`
> (overview: [stagger.md](./stagger.md)).

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
Requires a snapping carousel (`nav`); needs no JavaScript at all.

## Tokens

All `--ui-media-*` custom properties are listed in [carousel.md](./carousel.md#custom-properties).
