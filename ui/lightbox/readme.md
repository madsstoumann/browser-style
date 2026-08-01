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
documented in [`ui/card/media.md`](../card/media.md).

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

- `command="toggle-popover"` is a **built-in** invoker command (Baseline; see
  fallback below) — the platform opens/closes the popover and manages focus.
- The button rides into the top layer *with* its frame, so while open it doubles
  as the close affordance: the svg hides and the icon draws ui-icon's `cross`
  bars — an animated twist to × — via `:popover-open` (pure CSS).
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

## Optional JS — `command.js`

```html
<script type="module" src="…/lightbox/command.js"></script>
```

Adds five runtime niceties (the baseline open/close needs none of them):

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
   `/polyfill/carousel-controls.js` — in every browser, both states, so closed
   and open stay continuous (`media.lightbox.css` suppresses the native pseudos
   on exactly those frames). Without this module the open lightbox falls back
   to swipe, keyboard and a thin scrollbar.
5. **View Transition morph** — button-invoked open/close is wrapped in
   `document.startViewTransition()` where supported, so the card morphs into
   the fullscreen lightbox and back. Reduced-motion users and Esc/light-dismiss
   closes skip the morph (the CSS backdrop fade still runs).

## CSS custom properties

`--ui-lightbox-c` (ink) · `--ui-lightbox-c-hover` · `--ui-lightbox-sz` ·
`--ui-lightbox-circle-bg / -border-color / -border-width / -pad / -radius /
-shadow / -corner` · `--ui-lightbox-hover-pop / -press / -duration / -ease`.
