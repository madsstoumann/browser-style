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

The summary IS always a card — so no `card` token. `variant` holds layout tokens
borrowed **verbatim from `content-card`** (same author mental model across both
components). Trimmed subset — reveal carries a trigger, not a full content page.

| Value | Layout |
|-------|--------|
| *(none)* | `vertical` — media above content (default) |
| `vertical-r` | media below content |
| `horizontal` | media left, content right |
| `horizontal-r` | media right, content left |
| `media-only` | media fills entire face (was `cover`) |
| `overlay(pos)` | content stacked on media, 9 positions (was `overlay`) |
| `inset` | media gets same padding as text, no bleed (reveal extra) — Apple-Store-card look |

`overlay(pos)` positions = `tl tc tr · cl cc cr · bl bc br` (same 2-char grid as
content-card). `overlay(pos)` + `media-only` together cover the old `cover`/`overlay`
pair the request describes.

**Modifiers kept:** `ar()` aspect ratio (drives `--ui-reveal-aspect`).

**`inset` — Apple-Store pattern** (`inspiration/41030.jpg`): content-area on top
(eyebrow + large headline + summary), media-area below as a padded "floating" image
that does not bleed to card edges, plus-icon `bottom right dark`. Usually paired with
`vertical`. This is the reason `inset` stays — no content-card equivalent.

**Dropped from content-card** (page-level, imply links/actions/rich content reveal
doesn't carry): `content-only`, `split()`, `hs()`, `eyebrow()`, `rg()`, `subgrid`.

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

> **`<summary>` content model = phrasing content + optional heading content only.**
> Flow elements (`<figure>`, `<div>`, `<p>`, `<section>`) are **invalid** inside a
> summary. The two-box wrappers must be phrasing content — autonomous custom elements
> qualify, so use `<ui-media>` / `<ui-content>`. The revealed panel
> (`::details-content`) has no such restriction — `<figure>`/`<div>`/`<p>` are fine
> there.

**No `class` attributes in component markup** — classes belong to clients consuming the
system. Structural hooks are custom elements (`<ui-media>`, `<ui-content>`) styled in
CSS, same approach as `<cq-box>`. They need no JS registration; unknown/undefined
elements still style and are valid phrasing content.

Two-box model — `<ui-media>` + `<ui-content>` — mirrors content-card's `.cc-media` /
`.cc-content` so layout CSS (vertical/horizontal/overlay) is **shared, not reinvented**.
Icon is a sibling of the two boxes. Both are `display` re-typed (block/grid) via CSS.

Summary is lean: it becomes a single `role="button"` accessible name, so keep it to
headline (+ optional brow). The headline in the summary is a **`<b>`, not a heading** —
summary swallows heading role anyway, and `<b>` is a classless stylistic hook.
Description and the real heading live in the revealed panel. See **Accessibility**.

```html
<!-- vertical (default) + expand -->
<ui-reveal>
  <details>
    <summary>
      <ui-media><img src="..." alt=""></ui-media>
      <ui-content>
        <small>Brow</small>
        <b>Headline</b>
      </ui-content>
      <ui-icon type="plus-cross" aria-hidden="true"></ui-icon>
    </summary>
    <div>
      <h3>Real heading for outline</h3>
      <p>Description + body live here.</p>
    </div>
  </details>
</ui-reveal>

<!-- Panel heading level follows the surrounding outline (one below the section
     heading) — under an <h2> section, the card heading is <h3>. The summary <b>
     is NOT a heading, so the panel heading is the card's first real heading. -->

<!-- media-only + slide from right + icon top-right dark -->
<ui-reveal type="slide" from="right" variant="media-only" icon="top right dark">
  <details>
    <summary>
      <ui-media><img src="..." alt="Meaningful alt — this is the button name"></ui-media>
      <ui-icon type="plus-cross" aria-hidden="true"></ui-icon>
    </summary>
    <div>Revealed content</div>
  </details>
</ui-reveal>

<!-- overlay, text bottom-left + flip -->
<ui-reveal type="flip" variant="overlay(bl)" icon="bottom right">
  <details>
    <summary>
      <ui-media><img src="..." alt=""></ui-media>
      <ui-content>
        <small>Brow</small>
        <b>Headline</b>
      </ui-content>
      <ui-icon type="plus-cross" aria-hidden="true"></ui-icon>
    </summary>
    <div>Revealed content</div>
  </details>
</ui-reveal>
```

---

## Grid Strategy — Summary Layout

> **NEEDS REVISION for two-box model.** The CSS below assumes flat summary children
> (img + text + icon in one grid). With the `<figure>`/`<div>` two-box structure, the
> summary grid places media-area + content-area + icon instead, and layout variants
> (`vertical` / `horizontal` / `overlay`) port directly from content-card's
> `layouts.css` / `overlay.css`. Reuse those rules rather than the flat ones here.
> Kept below as reference for the icon-placement logic.

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
│ img  img  img     img  img  img │  ← full bleed
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

## Accessibility

`<summary>` is exposed as `role="button"`. Consequences drive the structure above:

1. **Whole summary = one accessible name.** All summary text concatenates into the
   button label. Keep summary lean (headline, optional brow). Push description + body
   into the revealed `<div>`.
2. **Headings lose role inside summary** in many AT (swallowed by the button). Don't
   put `<h3>` in summary — style a `<b>` instead, and put the real heading (`<h4>`) in
   the revealed panel for the document outline.
3. **No interactive content in summary** — spec forbids nested `<a>`, `<button>`,
   controls. Matches the "no links/actions in summary" requirement. Web component
   should warn (dev) if it finds interactive descendants in `summary`.
4. **Summary content model = phrasing + heading only.** No `<figure>`/`<div>`/`<p>`/
   `<section>` (flow content) inside summary — use `<span>` wrappers. The revealed
   panel has no such restriction.
5. **Icon is decorative** — `aria-hidden="true"`. Open/closed state already announced
   by the summary button + native `<details>` semantics.
6. **`media-only` face** is named only by `img` `alt`. Require a meaningful `alt`, or
   add a visually-hidden label.

## Reduced Motion

> All transition/animation declarations should be wrapped in `@media (prefers-reduced-motion: no-preference)`, or use `transition-duration: 0s` as override. Expand (block-size) transitions can stay — they are non-vestibular. Slide, flip, scale, and popup elevation should be disabled.

---

## Future: Popup via Same-Document View Transitions

Idea: morph the `type="popup"` card from its grid cell straight to a full-bleed
`position: fixed` overlay using the View Transitions API — the "expand thumbnail
into hero" pattern. Browser snapshots old rect (grid cell) + new rect (fixed
`inset: 0`) and morphs size/position automatically, in the top layer above any
`z-index`.

**Not CSS-only.** Same-document VT only fires via `document.startViewTransition()`.
This requires a light-DOM `index.js` web component (fits v4 dual-mode pattern).
Progressive enhancement: no `startViewTransition` support → native toggle, no anim.

Baseline: View transitions newly available 2025-10-14 (Chrome 111, Safari 18,
Firefox 144).

### Blockers / gotchas

1. **Native `<details>` snapshots too late.** The `toggle` event fires *after*
   `open` flips, so "before" state is already gone. Must intercept the `summary`
   `click`, `preventDefault()`, then flip `open` inside `startViewTransition`.
2. **Unique `view-transition-name` per instance.** Two+ elements sharing a name =
   no transition. Each card in the grid needs its own name; apply only during the
   transition and clean up on `finished`.
3. **Existing `block-size` transition fights VT.** The `::details-content` height
   animation must be gated off for popup when JS is active, else double effect.
4. **`prefers-reduced-motion`** — disable VT animations (mandatory).
5. **A11y** — route focus into the opened popup after `transition.finished`.
6. **Aspect-ratio stretch.** Card changes aspect ratio (cell → fullscreen);
   counter with `::view-transition-old/new { height: 100%; object-fit: cover }`.
   Name selectors don't take wildcards — use `view-transition-class` to target all
   reveal cards with one rule.

### Sketch

```css
:where(ui-reveal[type="popup"]) details {
  view-transition-name: var(--ui-reveal-vt, none); /* JS sets unique name */
}
:where(ui-reveal[type="popup"]) details[open] {
  inset: 0; position: fixed; z-index: 100; overflow-y: auto;
}
@media (prefers-reduced-motion: reduce) {
  ::view-transition-group(*),
  ::view-transition-old(*),
  ::view-transition-new(*) { animation: none !important; }
}
```

```js
summary.addEventListener('click', (e) => {
  if (!document.startViewTransition) return; // native toggle, no anim
  e.preventDefault();
  details.style.setProperty('--ui-reveal-vt', `reveal-${this._id}`);
  const t = document.startViewTransition(() => { details.open = !details.open; });
  t.finished.finally(() => {
    if (!details.open) details.style.removeProperty('--ui-reveal-vt');
    (details.open ? details.querySelector('h4,[tabindex]') : summary)?.focus?.();
  });
});
```

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

  /* === variant: layout (ported from content-card layouts.css) === */
  ui-reveal[variant~="vertical-r"]   summary   /* media below content */
  ui-reveal[variant~="horizontal"]   summary   /* media left, content right */
  ui-reveal[variant~="horizontal-r"] summary   /* reversed */

  /* === variant: media-only (was cover) === */
  ui-reveal[variant~="media-only"] summary > ui-media    /* media fills face */
  ui-reveal[variant~="media-only"] summary > ui-content  /* content-area hidden */

  /* === variant: overlay(pos) (was overlay; ported from overlay.css) === */
  ui-reveal[variant*="overlay("] summary                 /* stack media + content, scrim */
  ui-reveal[variant*="overlay(bl)"] summary > ui-content /* 9-position align */

  /* === variant: inset === */
  ui-reveal[variant~="inset"] summary > ui-media /* media padded, no bleed */

  /* === icon placement === */
  ui-reveal[icon~="top"]    summary > ui-icon
  ui-reveal[icon~="bottom"] summary > ui-icon
  ui-reveal[icon~="left"]   summary > ui-icon
  ui-reveal[icon~="right"]  summary > ui-icon
  ui-reveal[icon~="dark"]   summary > ui-icon
  ui-reveal[icon~="light"]  summary > ui-icon
}
```
