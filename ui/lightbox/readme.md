# ui-lightbox

A CSS-first **"view gallery" / fullscreen toggle**. `<ui-lightbox>` composes an
invoker button and a `<ui-icon>` glyph — one of the two canonical SVGs from
`/assets/svg` (`library-photo.svg` = "open gallery", the default;
`window-maximize.svg` = "full screen"), inlined with a bare `viewBox` so
ui-icon's svg rules supply stroke and sizing. Pointed at a
`<ui-media popover>` frame, the button lifts the *existing* gallery — carousel or
collage, same DOM — into the top layer as a fullscreen lightbox, using the
platform's built-in `toggle-popover` command: **zero JavaScript** to open,
`Esc` + light-dismiss to close, `::backdrop` for free.

The element itself is furniture (a sibling of `ui-save` / `ui-play` in the card
system); the frame-level lightbox presentation — fullscreen sizing, backdrop,
`open:` tokens, furniture hiding — lives in `ui/card/media.lightbox.css` and is
documented in [`ui/card/docs/media.md`](../card/docs/media.md).

## Install

```bash
npm install @browser.style/lightbox
```

```js
import '@browser.style/lightbox';          /* registers the tag (no behaviour) */
```

```css
@import '@browser.style/lightbox';         /* index.css — icon + component */
```

## Markup

```html
<ui-media id="gallery-1" popover media="asr(16/9) nav lightbox(bs)">
  <ui-lightbox>
    <button type="button" command="toggle-popover" commandfor="gallery-1" aria-label="View gallery">
      <ui-icon><!-- /assets/svg/library-photo.svg, inlined --><svg viewBox="0 0 24 24"><path d="…"/></svg></ui-icon>
    </button>
  </ui-lightbox>
  <img src="…" alt="…">
  <img src="…" alt="…">
  <img src="…" alt="…">
</ui-media>
```

In a `nav` scroller, place `<ui-lightbox>` **before the slides** (first child):
it is sticky-pinned to the scrollport there, and a start-corner sticky pin only
holds from the run's start — same contract as sticky `<ui-play>`.

Give the slides `srcset` + `sizes="auto"` + `loading="lazy"` and the browser
re-selects a **higher-resolution candidate automatically** when the frame goes
fullscreen (verified; a static `sizes` tuned to the card never upgrades — cover
the fullscreen case or use `auto`). The `ui-media-srcset.js` path already emits
this by default.

- `command="toggle-popover"` is a **built-in** invoker command (Baseline; see
  fallback below) — the platform opens/closes the popover and manages focus.
- The button rides into the top layer *with* its frame, so while open it doubles
  as the close affordance: it always pins **top-end** while open (the position
  token only governs the closed state), the svg hides and the icon draws
  ui-icon's `cross` bars — an animated twist to × — via `:popover-open` (pure CSS).
- `<ui-icon>` styling comes from `ui/icon` — load the package entry
  (`index.css` imports it) or link `../icon/ui-icon.css` alongside the raw
  `ui-lightbox.css`; without it the svg glyph collapses to 0×0.
- Inside a card, position/hue/size come from the `media=` DSL:
  `lightbox(bs)` (default area), `lightbox(white)`, `lightbox(lg)`, ….

## Attributes (standalone) / card tokens

| Axis | Attribute | Card token | Values |
|---|---|---|---|
| position | — (card-only) | `lightbox(<pos>)` | `ts tc te cs cc ce bs bc be` — default `bs` |
| hue | `theme=` | `lightbox(<hue>)` | `red orange green blue accent black white gray slate` |
| size | `size=` | `lightbox(<size>)` | `sm lg xl` (md = default) |
| disc | `radius=` / `variant="non"` | `lightbox(sqr\|rnd\|crc\|non)` | squircle · rounded · circle · no disc |
| ink/fill | `ink=` / `fill=` | — | any CSS color (typed `attr()`, polyfilled) |
| hover | `hover=` | — | `pop` `press` |

## Optional JS — `ui/card/lightbox.js`

```html
<script type="module" src="…/card/lightbox.js"></script>
```

The runtime niceties are **frame behaviour, not element behaviour** — every hook
is gated on `ui-media[popover]` — so they live with the card system's other
frame modules (`carousel.js`, `video.js`), not in this package. The all-in-one
`ui/card/index.js` entry includes them. Eight niceties (the baseline open/close
needs none of them):

1. **`--lightbox-layout`** — a custom command for a second button inside the
   lightbox that flips the open frame between fullscreen carousel and grid
   (`data-lightbox="grid|nav"`; cleared on close).
2. **`[open]` reflection** — mirrors the frame's ToggleEvent onto the
   `<ui-lightbox>` host and keeps `aria-expanded` on the invoker buttons.
3. **Invoker fallback** — browsers with Popover but without `command=`
   support get a delegated click handler calling `togglePopover()`.
   (Alternatively use the older `popovertarget="<id>"` attribute, which has
   wider support and also needs no JS.)
4. **DOM carousel controls** — the native `::scroll-marker`/`::scroll-button`
   pseudos do **not** follow a popover frame into the top layer (a
   current-Chromium limitation: they keep painting behind the `::backdrop`), so
   every `ui-media[popover]` carousel gets real-element dots + arrows via
   `/ui/carousel/polyfill/carousel-controls.js` — in every browser, both states, so closed
   and open stay continuous (`media.lightbox.css` suppresses the native pseudos
   on exactly those frames). Without this module the open lightbox falls back
   to swipe, keyboard and a thin scrollbar.
5. **View Transition morph** — button-invoked open/close is wrapped in
   `document.startViewTransition()` where supported, so the card morphs into
   the fullscreen lightbox and back. Reduced-motion users and Esc/light-dismiss
   closes skip the morph (the CSS backdrop fade still runs).
6. **`media-open=`** — swap the carousel into ANY existing nav style while
   open (e.g. `media-open="axis(y) nav(mrk) mrk(tmb) mrk(rail)"` for the
   vertical thumbnail rail): only the control words of the resolved media
   string are replaced on open and restored on close, with slide continuity
   both ways; controls are built as the union of both states' needs, and
   thumbnails auto-derive from each slide's image.
7. **Modality + history** — the rest of the page is `inert` while open (Tab
   and assistive tech stay inside), and one history entry per open makes the
   platform/hardware Back button close the lightbox (other closes consume the
   entry, so the stack never grows).
8. **Grid tile → slide jump** (tap a photo in the "view all" grid to open the
   carousel at that slide) and **media pause on close**.

## CSS custom properties

`--ui-lightbox-c` (ink) · `--ui-lightbox-c-hover` · `--ui-lightbox-sz` ·
`--ui-lightbox-circle-bg / -bg-hover / -border-color / -border-width / -pad /
-radius / -shadow / -corner` · `--ui-lightbox-hover-pop / -press / -duration / -ease` ·
`--ui-lightbox-open-c / -open-bg / -open-bg-hover` (the close button while fullscreen).

### The disc follows the carousel, not the page

Defaults are **not** `Canvas` / `--color-text`, and deliberately do not track
`color-scheme`: the button sits on media, so a document-surface disc turned near-black at
OS-dark while the carousel arrows beside it stayed white. It now reads the carousel's own
chrome — `--ui-carousel-arrow-plate` (disc) and `--ui-carousel-arrow-ink` (glyph), plus
their `-hover` twins — so it matches the arrows in every nav style, including the band
modes where the arrows are a bare masked glyph and the disc drops out entirely.

Off a carousel those tokens are undeclared and the fallbacks apply: a white 70% disc, a
dark glyph, a soft shadow and a hairline ring (carousels suppress the ring via
`--ui-carousel-arrow-border: 0`). Hovering lightens the disc rather than re-hueing the
glyph — again matching the arrows.

`lightbox(<hue>)`, `ink=` / `fill=` and `lightbox(non)` all still override this.
Full table: [card docs — band ink](../card/docs/carousel.md#the-furniture-discs-follow-the-arrows).
