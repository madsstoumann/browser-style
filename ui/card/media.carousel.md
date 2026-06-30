# `media.carousel.css` — architecture & internals

Implementation notes for the CSS-only `<ui-media>` carousel. **User-facing token
reference + examples live in [carousel.md](./carousel.md)** — this file documents
*how* the stylesheet works (the "why" that used to live in code comments).

The behavior layer (`auto`, `loop`) is in [ui-media.js](./ui-media.js); see
carousel.md for those tokens.

---

## Foundations

- **Cascade layer:** everything is in `@layer bs-component` (same layer as `media.css`,
  which is imported first — so carousel rules win ties on source order).
- **The `nav` token is the trigger.** `:where([media*="nav"])` turns `<ui-media>` into a
  flex scroll-snap row. Without it, `<ui-media>` is a plain single-image frame.
- **Dual-selector form.** Every rule is written twice so `media=` can sit on the
  `<ui-media>` itself **or** any ancestor (e.g. `<ui-card>`, props inherit down):
  - descendant form: `:where([media*="x"]) ui-media …`
  - self form: `ui-media:where([media*="x"]) …`
- **`@supports (scroll-marker-group: after)` gate.** Dots (`::scroll-marker`) and arrows
  (`::scroll-button`) are Chromium-only; everything inside that block degrades to a bare
  swipe/scroll-snap row elsewhere. `nav(bar)` (native scrollbar) lives outside the gate.
- **Substring matching.** Tokens are matched with `[media*="…"]`; `:not([media*="nav("])`
  distinguishes bare `nav` from the parenthesised `nav(dots)` / `nav(arrows)` / etc.

## Token → control mapping (inside `@supports`)

- **DOTS present** = bare `nav` · `nav(dots)` · `nav(below)`
- **ARROWS present** = bare `nav` · `nav(arrows)` · `nav(below)`
- `nav(none)` enables neither (bare swipe scroller). `nav(bar)` shows the native scrollbar only.

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

## Multi-item slides (`<ui-slide>` groups)

A `<ui-slide>` element is **one slide** (snap child) that can hold multiple items
(plain `<img>`/`<video>`, or layered `<ui-card>`s). The carousel only makes it a snap
child — `flex: 0 0 100%; display: grid; scroll-snap-align: start` — and gives it **one**
`::scroll-marker`. **It does NOT lay out the items inside** (columns/gap/object-fit):
that's the **layout system's job** (or, in the demos, a `.slide-cols` class with a
`--cols` var). There is intentionally no `cols()` token. Note: `media.css` absolutely-
stacks any `<img>` descendant of `<ui-media>`, so a layout class for plain-image groups
must reset them to `position: relative; inset: auto`.

## Nesting guard

A `<ui-media>` nested **inside** a layered `<ui-card>` slide is NOT itself a scroller.
The descendant carousel rules would otherwise cascade into it, so `ui-media ui-media` is
pinned back to the base frame (grid, `overflow: hidden`, abspos images) and its leaked
controls/markers are killed (`scroll-marker-group: none`, `::scroll-button { display:none }`,
`::scroll-marker { content: none }`).

## Dots

- `::scroll-marker-group` is `position: absolute; position-anchor: auto`, centered via
  `justify-self: anchor-center`, anchored above the bottom edge with `anchor(bottom)`.
- `dot(circle)` (default) round markers; `dot(pill)` rounded-rect.
- **`dot(pill)` timer:** the `:target-current` pill fills L→R over `--ui-media-autoplay`
  via the `ui-media-pill-fill` keyframes (a visual autoplay hint; ui-media.js advances).
  Under `prefers-reduced-motion: reduce` the fill is shown static (no animation).
- Sizes `dot(sm|md|lg|xl)` set `--ui-media-dot-size` + matching pill width/height (`md` = default).

## Arrows

- A circular `::scroll-button` = themeable circle (`--ui-media-arrow-bg`) + a glyph,
  frosted (`backdrop-filter` blur + `box-shadow` ring).
- **One base glyph, rotated.** A single RIGHT-pointing SVG (chevron or full arrow, in
  light/dark) is rotated per direction via `--_arw-rot` (left 180°, up −90°, down 90°) —
  no prev/next/up/down SVG duplication.
- **Shape × shade** (independent, composed): shape = chevron (default) · `arw(arrow)`;
  ink = light/white (default, for a dark circle) · `arw(dark)` (for a light circle). A
  direct `--ui-media-arrow-glyph` override wins.
- Sizes `arw(sm|md|lg|xl)` set `--ui-media-arrow-size` (`md` = 2.25rem default).
- **Placement** `arw(mid|top|bot)` set `--ui-media-arrow-top` (mid = `anchor(center)` default).
- **`arw(set)`** moves the left button next to the right one (adjacent pair at inline-end).
- **Disabled (dead-end) arrow** dims to `--ui-media-arrow-disabled-opacity` (0.4) by
  default; **`arw(hide)`** sets it to 0 (auto-hide instead of dim).
- **`arw(bare)`** drops the circle: the glyph itself is painted as a recolourable shape
  (`mask-image` of the SVG + `background-color` = the ink), so it can be any colour
  (`--ui-media-arrow-color`). A `:disabled` `::scroll-button` drops its mask, so the
  disabled bare arrow paints the glyph SVG directly as `background-image`
  (`--ui-media-arrow-glyph-dim`) to avoid a circle artifact. A drop-shadow keeps a white
  glyph legible over photos.

## `nav(below)` — control band

A non-scrolling bottom band, created by `padding-block-end` on the flex scroller (vertical
padding doesn't scroll in a horizontal scroller; images keep `block-size: 100%` and stay
above it). The absolute controls re-anchor into the band via `anchor(bottom)`. The band
defaults to the (light) card surface, so the dot/arrow ink defaults flip to dark here
(inline `style=` on the holder still wins by specificity).

- **Band size:** `--ui-media-band` (2.75rem) + a gap above it, `--ui-media-below-gap`
  (`--spacing-sm`), so card-shadow/elevation has room inside the clipped scrollport.
- **Dot position:** centered by default; `dot(start|center|end)` move them — `start` = after
  the left arrow, `end` = before the right arrow (or the `arw(set)` pair). `arw(set)`
  defaults dots to `start`; offsets account for arrow size/gap so they never overlap.

## Vertical controls (`axis(y)`)

Up/down arrows + a vertical dot column on the inline-end edge by default; `arw(start)`
flips both to the inline-start edge; `arw(set)` stacks the pair at the block-end.

**`nav(below)` + `axis(y)`** is special: a vertical scroller's `padding-block-end` is on
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
