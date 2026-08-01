# ui-lightbox

A CSS-first **"view gallery" / fullscreen toggle**. `<ui-lightbox>` composes an
invoker button and a `<ui-icon type="grid">` glyph. Pointed at a
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
  <img src="…" alt="…">
  <img src="…" alt="…">
  <img src="…" alt="…">
  <ui-lightbox>
    <button type="button" command="toggle-popover" commandfor="gallery-1" aria-label="View gallery">
      <ui-icon type="grid"></ui-icon>
    </button>
  </ui-lightbox>
</ui-media>
```

- `command="toggle-popover"` is a **built-in** invoker command (Baseline; see
  fallback below) — the platform opens/closes the popover and manages focus.
- The button rides into the top layer *with* its frame, so while open it doubles
  as the close affordance: the grid glyph morphs into an × via
  `:popover-open` (pure CSS).
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

Adds three runtime niceties (the baseline open/close needs none of them):

1. **`--lightbox-layout`** — a custom command for a second button inside the
   lightbox that flips the open frame between fullscreen carousel and grid
   (`data-lightbox="grid|nav"`; cleared on close).
2. **`[open]` reflection** — mirrors the frame's ToggleEvent onto the
   `<ui-lightbox>` host and keeps `aria-expanded` on the invoker buttons.
3. **Invoker fallback** — browsers with Popover but without `command=`
   support get a delegated click handler calling `togglePopover()`.
   (Alternatively use the older `popovertarget="<id>"` attribute, which has
   wider support and also needs no JS.)

## CSS custom properties

`--ui-lightbox-c` (ink) · `--ui-lightbox-c-hover` · `--ui-lightbox-sz` ·
`--ui-lightbox-circle-bg / -border-color / -border-width / -pad / -radius /
-shadow / -corner` · `--ui-lightbox-hover-pop / -press / -duration / -ease`.
