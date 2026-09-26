# CSS Carousels

No JavaScript. Just scroll-snap and three new pseudo-elements.

---

## What is a CSS Carousel?

A scroll-snap row, plus browser-generated controls:

- `::scroll-marker-group` — the dots
- `::scroll-marker` — one dot per slide
- `::scroll-button()` — the arrows

Chrome 135+. Safari: not yet.

---

## Step 1: the scroller

```css
.carousel {
  display: flex;
  overflow-x: auto;
  scroll-snap-type: x mandatory;
}
.carousel > * {
  scroll-snap-align: start;
}
```

Swipe works already. Now add controls.

---

## Step 2: dots — `scroll-marker-group`

```css
.carousel {
  scroll-marker-group: after;
}
.carousel > *::scroll-marker {
  content: "";
  inline-size: 0.6rem;
  aspect-ratio: 1;
  border-radius: 50%;
  background: rgb(255 255 255 / 0.5);
}
.carousel > *::scroll-marker:target-current {
  background: #fff;
}
```

`after` = dots after the slides. `:target-current` = the visible slide.

---

## Step 3: arrows — `scroll-button()`

```css
.carousel::scroll-button(inline-start) {
  content: "" / "Previous";
}
.carousel::scroll-button(inline-end) {
  content: "" / "Next";
}
```

Names the **scroll action**, not a side. Works in RTL for free.

Disabled at the ends automatically (`:disabled`).

---

## Arrows: shape

An arrow is a pseudo-element. Style it like a button.

```css
.carousel::scroll-button(*) {
  inline-size: 2.25rem;
  aspect-ratio: 1;
  border-radius: 50%;
  background: url(chevron.svg) center / 75% no-repeat rgb(255 255 255 / 0.7);
}
```

Square, rounded, circle — just `border-radius`.

---

## Arrows: fill

Circle: `background-color` is the fill.

Bare glyph: `mask-image` + `background-color` = recolourable arrow.

```css
.carousel::scroll-button(*) {
  mask: url(chevron.svg) center / 80% no-repeat;
  background: #fff;
}
.carousel::scroll-button(*):hover {
  scale: 1.2;
}
```

---

## Arrows: place

Anchor positioning. The scroller is the anchor.

```css
.carousel::scroll-button(*) {
  position: absolute;
  position-anchor: auto;
  top: anchor(center);
}
.carousel::scroll-button(inline-start) {
  inset-inline-start: calc(anchor(self-start) + 1rem);
}
.carousel::scroll-button(inline-end) {
  inset-inline-end: calc(anchor(self-end) + 1rem);
}
```

---

## Dots: style

One dot = one `::scroll-marker`. Any background, size, border.

```css
.carousel > *::scroll-marker {
  inline-size: 1.5rem;
  block-size: 0.35rem;
  border-radius: 999px;
  background: rgb(255 255 255 / 0.35);
}
.carousel > *::scroll-marker:target-current {
  background: #fff;
}
```

Pills, squares, rings — it is just a box.

---

## Dots: place

The group is one box. Position it with anchors.

```css
.carousel::scroll-marker-group {
  display: flex;
  gap: 0.5rem;
  position: absolute;
  position-anchor: auto;
  justify-self: anchor-center;
  top: calc(anchor(bottom) - 1rem);
}
```

Any corner. Or below the image: `scroll-marker-group: after` + normal flow.

---

## Thumbnails instead of dots

Custom properties inherit into `::scroll-marker`.
Set one per slide, read it in the marker.

```html
<img src="1.jpg" style="--thumb: url(1.jpg)">
<img src="2.jpg" style="--thumb: url(2.jpg)">
```

```css
.carousel > *::scroll-marker {
  background: var(--thumb) center / cover;
  inline-size: 3rem;
  aspect-ratio: 4 / 3;
  border: 2px solid rgb(255 255 255 / 0.5);
}
.carousel > *::scroll-marker:target-current {
  border-color: #fff;
}
```

---

## Bar instead of dots

Markers stay. Make them invisible, equal-width segments.

```css
.carousel::scroll-marker-group {
  display: flex;
  inline-size: 100%;
}
.carousel > *::scroll-marker {
  flex: 1;
  block-size: 1rem;
  background: linear-gradient(#fff5 0 0) center / 100% 1px no-repeat;
}
.carousel > *::scroll-marker:target-current {
  background: linear-gradient(#fff 0 0) center / 100% 3px no-repeat;
}
```

Thumb = 1/N of the width. Click anywhere = jump.

---

## Timeline instead of dots

Marker text comes from an attribute.

```html
<img src="1.jpg" alt="2016 — Founded in Copenhagen" data-date="2016">
```

`data-date` = what you see. `alt` / `aria-label` = what a screen reader hears.

```css
.carousel::scroll-marker-group { gap: 0; }
.carousel > *::scroll-marker {
  content: attr(data-date);
  padding-block-start: 1rem;
  background:
    radial-gradient(circle at 50% 6px, #fff 0 4px, #0000 5px),
    linear-gradient(#fff5 0 0) 0 5px / 100% 2px no-repeat;
}
```

Dot + rail = two background layers. `gap: 0` keeps the rail unbroken.

A pseudo-element has no pseudo-elements — no `::before` here.

---

## Stagger on slide change

Each slide is a `scroll-state` container.
Hidden until it snaps. Then children transition in, one by one.

```css
.carousel > * { container-type: scroll-state; }

.slide-content > * {
  transition: opacity 0.75s, translate 0.75s;
  transition-delay: calc(sibling-index() * 0.07s);
}
@container not scroll-state(snapped: inline) {
  .slide-content > * { opacity: 0; translate: 0 5rem; }
}
```

Time-based, not scroll-linked. Same on swipe, arrow, autoplay.

---

## Recap

| Want | How |
|---|---|
| Dots | `scroll-marker-group` + `::scroll-marker` |
| Arrows | `::scroll-button(inline-start / inline-end)` |
| Active state | `:target-current` |
| Thumbnails | `background: var(--thumb)` per slide |
| Bar | `flex: 1` markers, hairline background |
| Timeline | `content: attr(data-date)` + two gradients |
| Stagger | `@container not scroll-state(snapped: inline)` |

Zero JavaScript. Now: the demo.

---

## Note: why `anchor()` and not `top` / `left`?

The control pseudo-elements are generated **outside** the scroll container, as siblings, not children:

```
wrapper
├── ::scroll-button(inline-start)
├── .carousel        ← the scroll container (slides inside)
├── ::scroll-button(inline-end)
└── ::scroll-marker-group
```

They have to be siblings. Inside the scroller they would scroll away with the slides.

**Plain `position: absolute` measures against the wrong box.** `top: 0; left: 0` resolves against the nearest *positioned ancestor* — the wrapper, or `<body>`, never `.carousel`. Making it work means `position: relative` on the wrapper, and the wrapper must match the carousel's size exactly: no padding, no sibling content. It breaks the moment the carousel sits beside text in a row layout.

**Anchor positioning measures against the carousel itself.** The spec makes the originating element (the scroller) the *implicit anchor* of its own scroll pseudos; `position-anchor: auto` opts in. Then:

- `anchor(bottom)`, `anchor(center)` resolve to the scroller's real border-box edges, whatever the containing block is
- `justify-self: anchor-center` centres on the carousel — `left: 50%` would centre on the containing block
- `anchor(self-start)` / `anchor(self-end)` are logical: RTL flips for free, `left` / `right` do not

The element is still `position: absolute`. Only the insets change: `anchor()` instead of lengths.

**Gotcha:** `anchor(start)` and `anchor(end)` resolve against the *containing block's* writing mode; `self-start` / `self-end` resolve against the anchor's own. Mixing a logical `inset-inline-start` with plain `start` on an LTR page computes one edge and applies the other — the control lands outside the frame. Always use `self-*`.

**Net result:** zero coupling to the wrapper, no `position: relative` anywhere, and the controls follow the carousel box wherever layout puts it.

---

## Note: one `--thumb` variable, N thumbnails

There is no `:nth-child` and no per-slide rule. The trick is *who owns the marker*.

A `::scroll-marker` is generated **per slide**. Its originating element is the `<img>`, not the scroller. The selector `.carousel > *::scroll-marker` matches N markers, one per child — the browser does the "nth" for you.

Pseudo-elements inherit from their originating element, the same way `::before` inherits `color`. A custom property set on slide 3 inherits into slide 3's marker, and nowhere else:

```html
<img src="1.jpg" style="--thumb: url(1.jpg)">
<img src="2.jpg" style="--thumb: url(2.jpg)">
<img src="3.jpg" style="--thumb: url(3.jpg)">
```

```css
.carousel > *::scroll-marker {
  background: var(--thumb) center / cover;
}
```

One declaration. Each marker resolves `var(--thumb)` against its own slide, so three markers show three images. The data stays in the HTML, the style stays in one rule — a CMS can emit any number of slides without touching the CSS.

**Why a custom property and not `attr()`?** The ideal form is `background: attr(data-thumb type(<image>))` — a plain data attribute, no inline style. Chrome parses typed `attr()` but does not yet paint images from it, and Safari has no typed `attr()` at all. So the URL travels as a custom property for now. The active thumb is just `:target-current`, the same pseudo-class the dots use.

---

## Note: how the timeline shows its value

Same idea as the thumbnails, with a string instead of an image. The marker is a pseudo-element of the slide, so it can read the slide's attributes:

```html
<img src="1.jpg" alt="2016 — Founded in Copenhagen" data-date="2016">
```

```css
.carousel > *::scroll-marker {
  content: attr(data-date);
}
```

`content: attr(…)` with a **string** is old CSS and works everywhere — that is why the timeline needs no custom property while the thumbnails do.

Two attributes, two audiences:

- `data-date` is **what you see** — the short label painted into the node.
- `alt` (or `aria-label`) is **what a screen reader hears**. The marker is exposed as a `tab` that targets its slide, and it takes the slide's accessible name. The node shows `2016`; assistive tech announces the whole sentence.

One string per node: `content:` cannot be styled in parts, so the short form and the full sentence have to be two attributes.

Where the sentence lives depends on the slide element. An `<img>` already has `alt` — use it, and do not add `aria-label` (it would silently override the `alt`). A `<video>` takes `aria-label` directly. A `<div>` or custom element has role `generic`, and ARIA forbids `aria-label` on `generic` — give it `role="group"`, which is also the WAI-ARIA carousel-slide idiom.

The dot and the rail are two background layers on the same marker: a `radial-gradient` for the dot over a `linear-gradient` for the rail. A pseudo-element has no pseudo-elements of its own, so `::before` / `::after` are not available here. The group runs `gap: 0` so the rail segments meet and read as one continuous line.
