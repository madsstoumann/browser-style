# ui-reveal — Naming Strategy & Structure

## Attributes

### `type` — reveal mechanism

| Value | Behavior |
|-------|----------|
| *(none)* | Expand below (accordion-style transition) |
| `slide` | Panel slides in; direction via `from` |
| `flip` | 3D card flip — summary AND content flip together |
| `scale` | Morph/grow from icon position |
| `popup` | Expand below + `position: sticky` on card |

### `from` — slide direction (only with `type="slide"`)

| Value | Panel enters from... |
|-------|---------------------|
| `top` | Top edge |
| `right` | Right edge *(default if omitted)* |
| `bottom` | Bottom edge |
| `left` | Left edge |

### `variant` — summary card layout (space-separated, composable)

| Value | Layout |
|-------|--------|
| *(none)* | **Card** — image in document flow, text padded, image bleeds to edges |
| `cover` | Image fills entire card face |
| `overlay` | Cover + text content positioned on top of image |
| `inset` | Image gets same padding as text (no bleed) |

### `icon` — toggle icon placement (space-separated tokens)

| Token | Meaning |
|-------|---------|
| *(none)* | Icon in natural document flow (end of card grid) |
| `top` | Top of card |
| `bottom` | Bottom of card |
| `left` | Left side |
| `right` | Right side |
| `dark` | Dark background on icon |
| `light` | Light background on icon |

Combining: `icon="top right dark"` = top-right corner, dark background.
No position tokens = icon stays in natural flow within card grid.

---

## HTML Structure

```html
<!-- Card (default) + expand -->
<ui-reveal>
  <details>
    <summary>
      <small>Brow</small>
      <h3>Headline</h3>
      <span>Description</span>
      <img src="..." alt="...">
      <ui-icon type="plus-cross"></ui-icon>
    </summary>
    <div>Revealed content</div>
  </details>
</ui-reveal>

<!-- Cover + slide from right + icon top-right dark -->
<ui-reveal type="slide" from="right" variant="cover" icon="top right dark">
  <details>
    <summary>
      <img src="..." alt="...">
      <ui-icon type="plus-cross"></ui-icon>
    </summary>
    <div>Revealed content</div>
  </details>
</ui-reveal>

<!-- Overlay (cover + text on top) + flip -->
<ui-reveal type="flip" variant="overlay" icon="bottom right">
  <details>
    <summary>
      <small>Brow</small>
      <h3>Headline</h3>
      <span>Description</span>
      <img src="..." alt="...">
      <ui-icon type="plus-cross"></ui-icon>
    </summary>
    <div>Revealed content</div>
  </details>
</ui-reveal>
```

---

## Grid Strategy — Summary Layout

No `padding` on `summary` itself. Use full-bleed grid pattern so image bleeds to edges while text stays padded:

```
grid-template-columns: [full-start] var(--pad) [content-start] 1fr [content-end] var(--pad) [full-end]
```

### Card: icon in natural flow (no position tokens)

```
┌─────┬─────────────────────┬─────┐
│ pad │  small (brow)       │ pad │
├─────┼─────────────────────┼─────┤
│ pad │  h3 (headline)      │ pad │
├─────┼─────────────────────┼─────┤
│ pad │  span (description) │ pad │
├─────┼─────────────────────┼─────┤
│ img   img   img   img   img   img │  ← full bleed
├─────┼─────────────────────┼─────┤
│ pad │              icon   │ pad │  ← natural flow position
└─────┴─────────────────────┴─────┘
```

### Card: image first, icon on image (icon="top left|right")

```
┌──────────────────────────────┐
│ [icon]     IMAGE     [icon]  │  ← img + icon share grid-row: 1
├─────┬────────────────┬───────┤
│ pad │  brow          │  pad  │
│ pad │  headline      │  pad  │
│ pad │  text          │  pad  │
└─────┴────────────────┴───────┘
```

Image is first in DOM → naturally gets row 1 via auto-flow.
Icon gets explicit `grid-row: 1` + `grid-column: 1 / -1` → stacks on image.

### Card: image last, icon on image (icon="bottom left|right")

```
┌─────┬────────────────┬───────┐
│ pad │  brow          │  pad  │
│ pad │  headline      │  pad  │
│ pad │  text          │  pad  │
├─────┴────────────────┴───────┤
│ [icon]     IMAGE     [icon]  │  ← img + icon share grid-row: 99
└──────────────────────────────┘
```

Both `img` and `ui-icon` get `grid-row: 99` → pushed after all auto-placed content, sharing same row.

### CSS mapping

```css
summary {
  display: grid;
  grid-template-columns: var(--ui-reveal-padding) 1fr var(--ui-reveal-padding);
  row-gap: 1ch;
}

/* Text children → content column */
summary > :not(img):not(ui-icon) {
  grid-column: 2;
}

/* Image → full bleed */
summary > img {
  grid-column: 1 / -1;
}

/* Icon in natural flow (no position tokens) → content column, end-aligned */
summary > ui-icon {
  grid-column: 2;
  justify-self: end;
}
```

### Icon on image (via attribute selectors)

When `icon` has position tokens, both image and icon share a grid row — stacking via grid, no absolute positioning:

```css
/* Shared: icon overlays image, both span full bleed */
ui-reveal:is([icon~="top"],[icon~="bottom"]) summary > ui-icon {
  grid-column: 1 / -1;
  padding-inline: var(--ui-reveal-padding);
}

/* Top: image first in DOM, icon stacks on row 1 */
ui-reveal[icon~="top"] summary > ui-icon {
  grid-row: 1;
  align-self: start;
}

/* Bottom: both image and icon pushed to end, sharing row */
ui-reveal[icon~="bottom"] summary > img,
ui-reveal[icon~="bottom"] summary > ui-icon {
  grid-row: 99;
}
ui-reveal[icon~="bottom"] summary > ui-icon {
  align-self: end;
}

/* Horizontal alignment */
ui-reveal[icon~="right"] summary > ui-icon {
  justify-self: end;
}
ui-reveal[icon~="left"] summary > ui-icon {
  justify-self: start;
}
```

For `variant="cover"`, everything stacks in one cell — icon placement purely via `justify-self` / `align-self`.

### Cover variant grid

```css
/* All children stack in same cell */
ui-reveal[variant~="cover"] summary > * {
  grid-area: 1 / 1 / -1 / -1;
}
/* Image fills via object-fit */
ui-reveal[variant~="cover"] summary > img {
  object-fit: cover;
  height: 100%;
  width: 100%;
}
```

### Overlay variant

Same stacking as cover, but text children get `align-self: end` so they sit at the bottom of the image. A gradient background on the text area ensures readability over bright images:

```css
ui-reveal[variant~="overlay"] summary > :not(img):not(ui-icon) {
  align-self: end;
  grid-area: 1 / 1 / -1 / -1;
}

/* Gradient behind text — applied via pseudo-element on summary */
ui-reveal[variant~="overlay"] summary::after {
  background: var(--ui-reveal-overlay-gradient, linear-gradient(to top, rgb(0 0 0 / 0.6), transparent));
  content: "";
  grid-area: 1 / 1 / -1 / -1;
  align-self: end;
  height: 50%;
  pointer-events: none;
}
```

### Aspect ratio

Set on image, not on card. Works for both card and cover variants:

```css
:where(ui-reveal) summary > img {
  aspect-ratio: var(--ui-reveal-aspect, auto);
}
```

---

## Token Summary

```css
:where(ui-reveal) {
  --ui-reveal-bg: var(--color-surface);
  --ui-reveal-border-radius: var(--radius-2xl);
  --ui-reveal-duration: var(--duration-slower);
  --ui-reveal-easing: var(--ease-in-out);
  --ui-reveal-icon-size: var(--size-8);
  --ui-reveal-padding: var(--spacing-md);
  --ui-reveal-shadow: var(--shadow-lg);

  /* Icon */
  --ui-reveal-icon-bg: var(--color-button);
  --ui-reveal-icon-radius: var(--radius-circle);

  /* Aspect ratio (set inline for card sizing) */
  --ui-reveal-aspect: none;
}
```

---

## Scale Morph (type="scale")

Inspired by `search-bot` chatbot mode morph. Panel morphs FROM icon dimensions/shape TO full card size — not a uniform `scale()` transform, but actual `width`/`height`/`border-radius` transitions for a true shape morph.

### How search-bot does it

```css
/* Closed: shrunk to trigger button size, circular */
&:not([open]) {
  border-radius: 50%;
  height: anchor-size(height);
  opacity: 0;
  width: anchor-size(width);
}

/* Open: full panel */
&[open] { /* transitions to final dimensions */ }

/* Entry animation origin */
@starting-style {
  &[open] { border-radius: 50%; height: anchor-size(height); opacity: 0; width: anchor-size(width); }
}
```

Key: transitions explicit `width`, `height`, `border-radius`, `opacity` — NOT `scale()`. Gives true rectangle-emerging-from-circle morph.

### Adapted for ui-reveal

Can't use `anchor-size()` (no popover/dialog). Instead use the known `--ui-reveal-icon-size` token:

```css
ui-reveal[type="scale"] details {
  overflow: hidden;
}

ui-reveal[type="scale"] details::details-content {
  border-radius: var(--radius-circle);
  height: var(--ui-reveal-icon-size);
  opacity: 0;
  width: var(--ui-reveal-icon-size);

  /* Origin matches icon position — driven by icon attribute */
  justify-self: var(--_scale-js, end);
  align-self: var(--_scale-as, end);
  margin: var(--ui-reveal-padding);

  transition-property: width, height, border-radius, opacity, margin, content-visibility;
  transition-duration: var(--ui-reveal-duration);
  transition-timing-function: var(--ui-reveal-easing);
  transition-behavior: allow-discrete;
}

ui-reveal[type="scale"] details[open]::details-content {
  border-radius: 0;
  height: 100%;
  margin: 0;
  opacity: 1;
  width: 100%;
}
```

### Morph origin from icon placement

Map `icon` attribute to scale origin so panel expands from where icon sits:

```css
ui-reveal[type="scale"][icon~="top"]    { --_scale-as: start; }
ui-reveal[type="scale"][icon~="bottom"] { --_scale-as: end; }
ui-reveal[type="scale"][icon~="left"]   { --_scale-js: start; }
ui-reveal[type="scale"][icon~="right"]  { --_scale-js: end; }
```

### Content stagger (search-bot pattern)

Inner content fades in AFTER morph completes — prevents text "swimming" during size transition:

```css
ui-reveal[type="scale"] details::details-content > * {
  opacity: 0;
  transition: opacity calc(var(--ui-reveal-duration) * 0.5) ease calc(var(--ui-reveal-duration) * 0.7);
}
ui-reveal[type="scale"] details[open]::details-content > * {
  opacity: 1;
}
```

---

## Flip (type="flip")

Both summary and `::details-content` must occupy the same grid cell for the card-flip illusion. `details` is the 3D space (perspective). Both faces hide their backface; summary rotates away, content counter-rotates in.

```css
ui-reveal[type="flip"] details {
  perspective: 1000px;
}

ui-reveal[type="flip"] summary {
  backface-visibility: hidden;
  transition: rotate var(--ui-reveal-duration) var(--ui-reveal-easing);
}

ui-reveal[type="flip"] details[open] summary {
  rotate: y 180deg;
}

ui-reveal[type="flip"] details::details-content {
  backface-visibility: hidden;
  grid-area: 1 / 1 / -1 / -1;   /* stack on top of summary */
  rotate: y -180deg;
  transition-property: rotate, content-visibility;
  transition-duration: var(--ui-reveal-duration);
  transition-timing-function: var(--ui-reveal-easing);
  transition-behavior: allow-discrete;
}

ui-reveal[type="flip"] details[open]::details-content {
  rotate: y 0deg;
}
```

---

## Popup (type="popup")

Inspired by App Store "Today" cards. Card expands in place (like default expand) AND elevates to overlay position. Scrollable content within expanded card. Close affordance top-right.

**Collapsed:** normal card in flow.
**Expanded:** card becomes `position: sticky`, grows vertically, content scrolls inside.

```css
ui-reveal[type="popup"] details[open] {
  inset-block-start: var(--ui-reveal-popup-offset, var(--spacing-lg));
  max-block-size: var(--ui-reveal-popup-max-height, 90dvh);
  position: sticky;
  overflow-y: auto;
  box-shadow: var(--shadow-2xl);
}

ui-reveal[type="popup"] details::details-content {
  block-size: 0;
  content-visibility: hidden;
  overflow: hidden;
  transition: block-size var(--ui-reveal-duration), content-visibility var(--ui-reveal-duration);
  transition-behavior: allow-discrete;
}

ui-reveal[type="popup"] details[open]::details-content {
  block-size: auto;
  content-visibility: visible;
}
```

---

## Reduced Motion

> All transition/animation declarations should be wrapped in `@media (prefers-reduced-motion: no-preference)`, or use `transition-duration: 0s` as override. Expand (block-size) transitions can stay — they are non-vestibular. Slide, flip, scale, and popup elevation should be disabled.

---

## Selector Pattern (CSS structure outline)

```
@layer bs-component {
  /* === Base === */
  :where(ui-reveal)                          /* host defaults */
  :where(ui-reveal) details                  /* card container */
  :where(ui-reveal) summary                  /* full-bleed grid */
  :where(ui-reveal) details::details-content /* revealed panel base */

  /* === type: (none) — expand === */
  /* Same block-size transition as accordion */

  /* === type: slide === */
  ui-reveal[type="slide"]                    /* overflow: hidden on details */
  ui-reveal[type="slide"] ::details-content  /* translate + transition */
  ui-reveal[type="slide"][from="top"]        /* translate: 0 -100% */
  ui-reveal[type="slide"][from="right"]      /* translate: 100% 0 */
  ui-reveal[type="slide"][from="bottom"]     /* translate: 0 100% */
  ui-reveal[type="slide"][from="left"]       /* translate: -100% 0 */

  /* === type: flip === */
  ui-reveal[type="flip"] details             /* perspective */
  ui-reveal[type="flip"] summary             /* backface-visibility, rotate Y transition */
  ui-reveal[type="flip"] ::details-content   /* grid-area: 1/-1 (stacks on summary), backface-visibility, counter-rotate */

  /* === type: scale (morph) === */
  ui-reveal[type="scale"] ::details-content  /* morph from icon — see "Scale Morph" section */

  /* === type: popup === */
  ui-reveal[type="popup"] details[open]      /* position: sticky */

  /* === variant: cover === */
  ui-reveal[variant~="cover"] summary > *    /* grid-area: 1/1/-1/-1 (stack) */

  /* === variant: overlay === */
  ui-reveal[variant~="overlay"] summary      /* gradient scrim, text aligned to end */

  /* === variant: inset === */
  ui-reveal[variant~="inset"] summary > img  /* grid-column: 2 (content column) */

  /* === icon placement === */
  ui-reveal[icon~="top"]    summary > ui-icon
  ui-reveal[icon~="bottom"] summary > ui-icon
  ui-reveal[icon~="left"]   summary > ui-icon
  ui-reveal[icon~="right"]  summary > ui-icon
  ui-reveal[icon~="dark"]   summary > ui-icon
  ui-reveal[icon~="light"]  summary > ui-icon
}
```
