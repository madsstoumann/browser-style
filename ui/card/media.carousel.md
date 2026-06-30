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
`media="dot(pll) dot(end)"` ≡ `dot="pll end"` · bare `media="nav"` ≡ boolean `nav` ·
`media="axis(y)"` ≡ `nav="y"`. The value is the **same 3-letter code**; only the wrapper differs.

### Shared ink scale

Controls + scrim share one shade vocabulary: `lgt` (light/white) · `drk` (dark/black) ·
`sub` (subtle/low-contrast) · `med` (scrim only). Arrows + dots use `lgt`/`drk`/`sub`.

## All tokens (alphabetical)

Every option the carousel recognises, in both forms. **Layer:** CSS = `media.carousel.css`,
JS = `ui-media.js`, load = `ui-media-srcset.js`. (`nav` is required to make the
scroller; the rest layer on top. `asr()` etc. belong to the base frame — see media.md.)

| `media=` token | Attr form | Layer | Effect |
|----------------|-----------|-------|--------|
| `arw(arr)`  | `arrow="arr"` | CSS | Full-arrow glyph (default is chevron) |
| `arw(bare)` | `arrow="bare"` | CSS | Drop the circle — glyph painted as a recolourable shape (`--ui-media-arrow-color`) |
| `arw(bot)`  | `arrow="bot"` | CSS | Edge arrows at the bottom |
| `arw(chv)`  | `arrow="chv"` | CSS | Chevron glyph (**default**) |
| `arw(drk)`  | `arrow="drk"` | CSS | Dark/black glyph ink (default is white) |
| `arw(hid)`  | `arrow="hid"` | CSS | Auto-hide the dead-end arrow (default dims it) |
| `arw(lg)`   | `arrow="lg"` | CSS | Arrow size 2.75rem |
| `arw(lgt)`  | `arrow="lgt"` | CSS | Light/white glyph ink (**default**) |
| `arw(md)`   | `arrow="md"` | CSS | Arrow size 2.25rem (**default**) |
| `arw(mid)`  | `arrow="mid"` | CSS | Edge arrows vertically centered (**default**) |
| `arw(set)`  | `arrow="set"` | CSS | Both arrows as an adjacent pair at the end |
| `arw(sm)`   | `arrow="sm"` | CSS | Arrow size 1.75rem |
| `arw(sta)`  | `arrow="sta"` | CSS | `axis(y)`: move up/down arrows + dots to the inline-start edge |
| `arw(sub)`  | `arrow="sub"` | CSS | Subtle low-contrast ink (for light surfaces / `nav(blw)`) |
| `arw(top)`  | `arrow="top"` | CSS | Edge arrows at the top |
| `arw(xl)`   | `arrow="xl"` | CSS | Arrow size 3.25rem |
| `auto` · `auto(4s)` · `auto(800ms)` | `nav="auto"` | JS | Autoplay (default 5s); pauses on hover/focus/drag/hidden-tab/reduced-motion. Attr form has no inline duration — defaults to 5s |
| `axis(y)`   | `nav="y"` | CSS | Vertical carousel (snap on Y; arrows become up/down) |
| `dot(cir)`  | `dot="cir"` | CSS | Circular dots (**default**) |
| `dot(ctr)`  | `dot="ctr"` | CSS | `nav(blw)`: dots centered in the band (**default**) |
| `dot(drk)`  | `dot="drk"` | CSS | Dark dot ink |
| `dot(end)`  | `dot="end"` | CSS | `nav(blw)`: dots at the inline-end |
| `dot(lg)`   | `dot="lg"` | CSS | Dot size 0.8rem |
| `dot(lgt)`  | `dot="lgt"` | CSS | Light/white dot ink |
| `dot(md)`   | `dot="md"` | CSS | Dot size 0.6rem (**default**) |
| `dot(pll)`  | `dot="pll"` | CSS | Pill dots; active pill fills L→R over `--ui-media-autoplay` (timer hint) |
| `dot(sm)`   | `dot="sm"` | CSS | Dot size 0.45rem |
| `dot(sta)`  | `dot="sta"` | CSS | `nav(blw)`: dots at the inline-start |
| `dot(sub)`  | `dot="sub"` | CSS | Subtle low-contrast dot ink |
| `dot(xl)`   | `dot="xl"` | CSS | Dot size 1rem |
| `loop`      | `nav="loop"` | JS | Seamless infinite loop (clones first/last slide) |
| `nav`       | `nav` (boolean) | CSS | Carousel **on** — dots + arrows (the trigger) |
| `nav(arw)`  | `nav="arw"` | CSS | Arrows only |
| `nav(bar)`  | `nav="bar"` | CSS | Native scrollbar only (no dots/arrows) |
| `nav(blw)`  | `nav="blw"` | CSS | Dots + arrows in a reserved band below the media |
| `nav(dot)`  | `nav="dot"` | CSS | Dots only |
| `nav(non)`  | `nav="non"` | CSS | Bare swipe scroller (no controls) |

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
| `flp(h · v · hv)` | CSS | Flip the image horizontally / vertically / both |
| `hov(zoom · pan · track · drift)` | CSS (+JS) | Hover effect; `track`/`drift` follow the cursor (need `ui-media.js`) |
| `scm` · `scm(<pos>)` · `scm(lgt · med · drk)` | CSS | Scrim — placement + intensity |
| `load(eager · lazy)` | load | Image/video loading (`ui-media-srcset.js`); `eager` (bool attr) = first slide eager + `fetchpriority="high"` |
| `chip(<corner>)` · `chip(<color>)` | CSS | Position + colour a `<ui-chip>` child (`accent blue green orange red dark light subtle`) |
| `sticker(<corner>)` · `sticker(<color>)` | CSS | Position + colour a `<ui-sticker>` child |
| `play(<corner>)` | CSS | Position a `<ui-play>` child |
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
  swipe/scroll-snap row elsewhere. `nav(bar)` (native scrollbar) lives outside the gate.
- **Matching.** `media=` tokens match with `[media*="…"]` (substring); `:not([media*="nav("])`
  distinguishes bare `nav` from the parenthesised `nav(dot)` / `nav(arw)` / etc. Attribute
  forms match whole-word with `~=` (`[arrow~="lg"]`), which is what lets them be grouped.

## Token → control mapping (inside `@supports`)

- **DOTS present** = bare `nav` · `nav(dot)` · `nav(blw)`
- **ARROWS present** = bare `nav` · `nav(arw)` · `nav(blw)`
- `nav(non)` enables neither (bare swipe scroller). `nav(bar)` shows the native scrollbar only.

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

## `nav(bar)` — plain scrollbar

Native thin scrollbar (`scrollbar-color: auto`) by default — cleanest, platform-correct.
Override colours with a single `--ui-media-scrollbar-color` token (`"<thumb> <track>"`,
e.g. `#ccc transparent`); width via `--ui-media-scrollbar-width`.

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
- **Ink:** `dot(lgt)` / `dot(drk)` / `dot(sub)` set `--ui-media-dot-bg` + `--ui-media-dot-active`
  to the light / dark / subtle pairs (`nav(blw)` defaults to dark; `sub` is re-asserted after
  the band holder so it still wins inside the band).
- **`dot(pll)` timer:** the `:target-current` pill fills L→R over `--ui-media-autoplay`
  via the `ui-media-pill-fill` keyframes (a visual autoplay hint; ui-media.js advances).
  Under `prefers-reduced-motion: reduce` the fill is shown static (no animation).
- Sizes `dot(sm|md|lg|xl)` set `--ui-media-dot-size` + matching pill width/height (`md` = default).

## Arrows

- A circular `::scroll-button` = themeable circle (`--ui-media-arrow-bg`) + a glyph,
  frosted (`backdrop-filter` blur + `box-shadow` ring).
- **One base glyph, rotated.** A single RIGHT-pointing SVG (chevron or full arrow, in
  light/dark) is rotated per direction via `--_arw-rot` (left 180°, up −90°, down 90°) —
  no prev/next/up/down SVG duplication.
- **Shape × shade** (independent, composed): shape = chevron (default, `arw(chv)`) · `arw(arr)`;
  ink = light/white (default, `arw(lgt)`, for a dark circle) · `arw(drk)` (for a light circle) ·
  `arw(sub)` (subtle low-contrast). A direct `--ui-media-arrow-glyph` override wins.
- Sizes `arw(sm|md|lg|xl)` set `--ui-media-arrow-size` (`md` = 2.25rem default).
- **Placement** `arw(mid|top|bot)` set `--ui-media-arrow-top` (mid = `anchor(center)` default).
- **`arw(set)`** moves the left button next to the right one (adjacent pair at inline-end).
- **Disabled (dead-end) arrow** dims to `--ui-media-arrow-disabled-opacity` (0.4) by
  default; **`arw(hid)`** sets it to 0 (auto-hide instead of dim).
- **`arw(bare)`** drops the circle: the glyph itself is painted as a recolourable shape
  (`mask-image` of the SVG + `background-color` = the ink), so it can be any colour
  (`--ui-media-arrow-color`). A `:disabled` `::scroll-button` drops its mask, so the
  disabled bare arrow paints the glyph SVG directly as `background-image`
  (`--ui-media-arrow-glyph-dim`) to avoid a circle artifact. A drop-shadow keeps a white
  glyph legible over photos.

## `nav(blw)` — control band

A non-scrolling bottom band, created by `padding-block-end` on the flex scroller (vertical
padding doesn't scroll in a horizontal scroller; images keep `block-size: 100%` and stay
above it). The absolute controls re-anchor into the band via `anchor(bottom)`. The band
defaults to the (light) card surface, so the dot/arrow ink defaults flip to dark here
(inline `style=` on the holder still wins by specificity).

- **Band size:** `--ui-media-band` (2.75rem) + a gap above it, `--ui-media-below-gap`
  (`--spacing-sm`), so card-shadow/elevation has room inside the clipped scrollport.
- **Dot position:** centered by default; `dot(sta|ctr|end)` move them — `sta` = after
  the left arrow, `end` = before the right arrow (or the `arw(set)` pair). `arw(set)`
  defaults dots to `sta`; offsets account for arrow size/gap so they never overlap.

## Vertical controls (`axis(y)`)

Up/down arrows + a vertical dot column on the inline-end edge by default; `arw(sta)`
flips both to the inline-start edge; `arw(set)` stacks the pair at the block-end.

**`nav(blw)` + `axis(y)`** is special: a vertical scroller's `padding-block-end` is on
the SCROLL axis, so it can't carve a fixed cross-axis band (the next slide peeks through).
So the band is a **solid, full-width overlay** (the marker-group itself) pinned to the
bottom of the scrollport — it covers the peek; the rotated up/down arrows sit on it
(`z-index: 4`). The base `padding-block-end` still shrinks each slide to fit above it.

## Loop clones

`ui-media.js` prepends/appends a clone slide for the seamless `loop`. Clones carry
`[data-clone]` and `ui-media > [data-clone]::scroll-marker { content: none }` suppresses
their dots, so only the real slides count.

## Tokens

All `--ui-media-*` custom properties are listed in [carousel.md](./carousel.md#custom-properties).
