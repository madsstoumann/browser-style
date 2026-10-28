---
title: CSS Carousels — no JavaScript required
status: DRAFT
notes: CodePen embeds are marked {% codepen TODO-NN %} — NN = the folder number in ui/card/demo/codepen. Screenshots are marked ![…](TODO).
---

# CSS Carousels — no JavaScript required

I'm probably not the only developer who has a love-hate relationship with **carousels**. Clients *love* them. Users … mostly swipe past them. And we developers have spent the better part of two decades installing 40 KB JavaScript libraries just to move a row of images 100% to the left.

The other day I added a carousel to a product card. *Again*. Except this time, I didn't write a single line of JavaScript, and the carousel had dots, arrows, thumbnails, a timeline, and a staggered animation on every slide.

The browser can now draw the controls for us. Scroll-snap has been around for years. What's new is a handful of pseudo-elements: `::scroll-marker-group`, `::scroll-marker` and `::scroll-button()`. Add a sprinkle of anchor positioning and scroll-driven animations, and we've got ourselves a carousel library … made entirely of CSS.

In this article we'll start with the absolute basics, a row of images that snaps, and then gradually build it up. There are 14 small demos along the way. There's also a dedicated section on **animation and staggering**, written for absolute beginners, because that's where the *really* fun stuff is.

Ready? Let's get started.

---

## The markup

Here's all the HTML we need:

```html
<div class="carousel">
  <img src="hubble.png" alt="Galaxy photographed by a space telescope">
  <img src="quantum.png" alt="Quantum computer">
  <img src="websummit.png" alt="Conference stage">
  <img src="world.png" alt="Globe">
</div>
```

A wrapper, and some children. Every direct child is a *slide*. It doesn't have to be an `<img>`. It can be an `<article>`, a `<figure>` or a `<fieldset>`, and we'll use all of those later on.

---

## Step 1: The scroller

```css
.carousel {
  aspect-ratio: 4 / 3;
  display: flex;
  overflow-x: auto;
  overscroll-behavior-x: contain;
  scroll-snap-type: x mandatory;
}
.carousel > * {
  flex: 0 0 100%;
  scroll-snap-align: start;
}
```

Let's break this down:

- `display: flex` puts the slides on a row.
- `flex: 0 0 100%` makes each slide exactly as wide as the carousel. No growing, no shrinking.
- `overflow-x: auto` turns the carousel into a horizontal **scroll container**.
- `scroll-snap-type: x mandatory` tells it to always come to rest on a *snap point* …
- … and `scroll-snap-align: start` makes the start edge of every slide a snap point.
- `overscroll-behavior-x: contain` stops a hard swipe from triggering the browser's "back" gesture.

![A row of images, the first one fills the frame](TODO)

Not much to see yet, but swipe it on a phone, or shift-scroll with a mouse, and it already *snaps*. This works in every browser and has done so for years. It's our safety net: whatever we add from here on, this part keeps working.

---

## Step 2: Dots

Now for the new stuff. First, we ask the browser to generate a **group** for the dots:

```css
.carousel {
  scroll-marker-group: after;
}
```

`after` means "put the group after the carousel" (there's also `before`). Then we style one **marker** per slide:

```css
.carousel > *::scroll-marker {
  background: rgb(255 255 255 / 0.5);
  block-size: 0.6rem;
  border-radius: 50%;
  content: "";
  inline-size: 0.6rem;
}
.carousel > *::scroll-marker:target-current {
  background: #fff;
}
```

So what's going on?

`::scroll-marker` is a pseudo-element, like `::before`. That means it needs `content` before it shows up. Notice the selector, too: it's a pseudo-element **of each slide**, not of the carousel. Four slides, four markers. The browser does the counting for us.

`:target-current` is a new pseudo-class: it matches the marker whose slide is currently in view. Click a marker, and the carousel scrolls to its slide. Use the keyboard, and the markers behave like a set of tabs.

![Dots below the image](TODO)

Hmm, the dots are *below* the carousel. That's what `after` means: the group is a real box, generated as a *sibling* of the scroller. We'll want them on top of the image, and we'll fix that in a minute.

---

## Step 3: Arrows

```css
.carousel::scroll-button(inline-start) {
  content: "" / "Previous";
}
.carousel::scroll-button(inline-end) {
  content: "" / "Next";
}
```

Two things are worth noticing here.

**The keyword names the scroll *action*, not a side.** `inline-start` means "scroll toward the start", so in a right-to-left language the buttons swap sides by themselves. (There's also `block-start` and `block-end`. Hold that thought for the vertical carousel.)

**`content` has two parts.** The bit before the slash is what we *see*: nothing, because we'll use a background image. The bit after the slash is the button's *accessible name*. So a screen reader announces "Previous, button". That's a lot of accessibility for one line of CSS.

The browser also *disables* the buttons when there's nowhere left to scroll, so we get `:disabled` for free:

```css
.carousel::scroll-button(*):disabled {
  opacity: 0.4;
}
```

`(*)` matches all of the scroll buttons at once. Let's give them a shape:

```css
.carousel::scroll-button(*) {
  aspect-ratio: 1;
  background: var(--arrow-glyph) center / 70% no-repeat rgb(255 255 255 / 0.75);
  border: 0;
  border-radius: 50%;
  inline-size: 2.25rem;
}
.carousel::scroll-button(inline-start) {
  rotate: 180deg;
}
```

`--arrow-glyph` is a chevron SVG in a data-URI. Both buttons use the same chevron, and the "previous" button is simply rotated.

---

## Step 4: Putting the controls where we want them

Right now, the arrows and dots are stacked somewhere around the carousel. We want them *on* it. The obvious answer is `position: absolute`. But absolute to *what*?

Here's the thing: the generated controls are **siblings** of the scroller, not children:

```
.demo
├── ::scroll-button(inline-start)
├── .carousel          ← the scroll container, slides inside
├── ::scroll-button(inline-end)
└── ::scroll-marker-group
```

They *have* to be siblings, because inside the scroller they would scroll away with the slides. But it means that `top: 0; left: 0` resolves against the nearest *positioned ancestor*, the wrapper or even `<body>`, and never against `.carousel`.

Enter **anchor positioning**. The spec makes the scroller the *implicit anchor* of its own scroll pseudo-elements. `position-anchor: auto` opts in, and then `anchor()` measures against the carousel itself:

```css
.carousel::scroll-button(*) {
  position: absolute;
  position-anchor: auto;
  top: calc(anchor(center) - 2.25rem / 2);
}
.carousel::scroll-button(inline-start) {
  inset-inline-start: calc(anchor(self-start) + 0.75rem);
}
.carousel::scroll-button(inline-end) {
  inset-inline-end: calc(anchor(self-end) + 0.75rem);
}

.carousel::scroll-marker-group {
  bottom: calc(anchor(bottom) + 0.75rem);
  display: flex;
  gap: 0.5rem;
  justify-self: anchor-center;
  position: absolute;
  position-anchor: auto;
}
```

- `anchor(center)` is the vertical middle of the carousel, wherever the carousel happens to be.
- `anchor(self-start)` and `anchor(self-end)` are *logical*, so RTL works for free.
- `justify-self: anchor-center` centers the dots on the carousel. `left: 50%` would center them on the containing block, which is a different thing entirely.

> **Gotcha:** use `self-start` / `self-end`, not `start` / `end`. The latter resolve against the *containing block's* writing mode. Mix them with a logical `inset-inline-start`, and you'll compute one edge and apply the other, so the button ends up outside the frame. Ask me how I know.

![Dots and arrows on the image](TODO)

Much better! There's no `position: relative` anywhere and no coupling to the wrapper, so the controls follow the carousel wherever the layout puts it.

One last detail: wrap all of this in a feature query, and hide the native scrollbar only when we have controls to replace it:

```css
@supports (scroll-marker-group: after) {
  .carousel {
    scroll-marker-group: after;
    scrollbar-width: none;
    /* … all the ::scroll-* rules … */
  }
}
```

Browsers without support keep a swipeable scroller *with* a scrollbar. More on those browsers at the end.

That's our base stylesheet. Everything from here on is an add-on.

{% codepen TODO-01 %}

---

## Styling the arrows

An arrow is a box, so everything we know about styling boxes applies. In the demos, every value is a custom property on `.carousel`, so a variant is a single line:

```css
.carousel.arrows-square { --arrow-radius: 0; }
.carousel.arrows-lg     { --arrow-size: 3rem; }
.carousel.arrows-dark   { --arrow-bg: rgb(0 0 0 / 0.6); --arrow-glyph: url(white-chevron.svg); }
```

The nicest trick is the **bare glyph**: no circle, just the chevron, in *any* colour. We turn the SVG into a `mask` and let `background` be the ink:

```css
.carousel.arrows-bare::scroll-button(*) {
  background: var(--arrow-ink, #fff);
  mask: var(--arrow-glyph) center / 90% no-repeat;
}
```

One SVG, any colour. Light images get `--arrow-ink: #000`, dark images get white.

Two more small ones. **Reveal on hover**, but only on devices that *can* hover, so touch users keep their arrows:

```css
@media (hover: hover) {
  .carousel.arrows-reveal::scroll-button(*) { opacity: 0; }
  .carousel.arrows-reveal:is(:hover, :focus-within)::scroll-button(*) { opacity: 1; }
}
```

And **hide the dead end** instead of dimming it:

```css
.carousel.arrows-hide-end::scroll-button(*):disabled { opacity: 0; }
```

{% codepen TODO-02 %}

---

## Placement, revisited

Because the controls are anchored, *moving* them is just a different `anchor()`:

```css
/* arrows at the top */
.carousel.arrows-top { --arrow-top: calc(anchor(top) + 0.75rem); }

/* both arrows as a pair in the bottom-end corner */
.carousel.arrows-pair::scroll-button(inline-start) {
  inset-inline-start: auto;
  inset-inline-end: calc(anchor(self-end) + 0.75rem + var(--arrow-size) + 0.5rem);
}
```

And arrows *outside* the image? Shrink the carousel with `margin-inline`, then push the arrows past its edges:

```css
.carousel.arrows-outside {
  margin-inline: calc(var(--arrow-size) + 0.5rem);
}
.carousel.arrows-outside::scroll-button(inline-start) {
  inset-inline-start: calc(anchor(self-start) - var(--arrow-size) - 0.5rem);
}
```

> Never use `padding-inline` for this! On a horizontal scroller that's the *scroll* axis, and the neighbouring slides would peek in.

{% codepen TODO-03 %}

---

## Controls in a band

Remember how the dots first showed up *below* the image? Sometimes that's exactly what we want: a classic listing carousel, with dots and arrows in a strip of their own.

So we go back to normal flow:

```css
.carousel.band::scroll-marker-group {
  align-items: center;
  justify-self: normal;
  min-block-size: 3rem;
  position: static;
}
```

The group now takes up room below the carousel, so nothing overlaps the image. The arrows stay absolute, anchored just below the carousel's bottom edge:

```css
.carousel.band::scroll-button(*) {
  top: calc(anchor(bottom) + (3rem - var(--arrow-size)) / 2);
}
```

Want the band *above*? `scroll-marker-group: before`. That's it.

> **Gotcha:** `justify-self: normal` matters. The base rule sets `anchor-center`, and on a *static* group that shrinks it to zero width, which makes the dots vanish. That one took me a while!

Since the band sits on the page and not on the image, its ink should follow the text colour:

```css
.carousel.band {
  --dot-bg: color-mix(in oklab, currentColor 25%, transparent);
  --dot-active: color-mix(in oklab, currentColor 75%, transparent);
}
.carousel > *::scroll-marker {
  color: inherit;
}
```

Why `color: inherit`? Because the browser styles a `::scroll-marker` like a *link*. Without it, `currentColor` is `LinkText`, and you get blue dots. 🤷

Dark mode now works for free.

{% codepen TODO-04 %}

---

## Dots, pills — and colourways

Let's play with the markers themselves. A **pill** is a wider, rounder dot:

```css
.carousel.dots-pill > *::scroll-marker {
  block-size: 0.35rem;
  border-radius: 1rem;
  inline-size: 1.5rem;
}
```

A **hybrid** keeps round dots, but the current one *stretches* into a pill:

```css
.carousel.dots-hybrid > *::scroll-marker {
  transition: inline-size 0.3s, border-radius 0.3s;
}
.carousel.dots-hybrid > *::scroll-marker:target-current {
  border-radius: 1rem;
  inline-size: 1.5rem;
}
```

Now for my favourite. Remember that the marker is a pseudo-element **of its slide**? Pseudo-elements *inherit* from their originating element, just like `::before` inherits `color`. So a custom property set on slide 3 is visible to slide 3's marker, and to no other marker:

```html
<img src="phone-blue.svg"   style="--dot-active: #2f6fe0">
<img src="phone-orange.svg" style="--dot-active: #f2782a">
<img src="phone-green.svg"  style="--dot-active: #2ea36b">
```

The *same* CSS rule now paints three different dots. That's a **colourway picker**, the kind you see on every phone shop's product page, with no `:nth-child` and no per-slide rules.

![Three phone colourways with matching coloured dots](TODO)

{% codepen TODO-05 %}

---

## Thumbnails

Same trick, but with an image:

```html
<img src="elephants.png" style="--thumb: url(elephants.png)">
```

```css
.carousel.thumbs > *::scroll-marker {
  aspect-ratio: 4 / 3;
  background: var(--thumb) center / cover;
  block-size: 3rem;
  border: 2px solid rgb(255 255 255 / 0.5);
  inline-size: auto;
}
.carousel.thumbs > *::scroll-marker:target-current {
  border-color: #fff;
}
```

Want a **filmstrip** below the image? Combine it with the band trick, and make the group scrollable:

```css
.carousel.thumbs.strip::scroll-marker-group {
  block-size: calc(3rem + 4px);
  overflow-x: auto;
  position: static;
}
```

Here's a cool detail: the group is a *scroll-target group*, so the browser keeps the current thumbnail scrolled into view, all by itself.

> **Why a custom property, and not `attr()`?** The dream is `background: attr(data-thumb type(<image>))`, with a plain data-attribute and no inline style. But Chrome doesn't paint images from typed `attr()` yet, and Safari has no typed `attr()` at all. So for now, the URL travels as a custom property.

> And another one from the "it took me a while" department: a *static*, *scrollable* group whose markers size themselves with `aspect-ratio` collapses to almost nothing in Chrome. An explicit `block-size` on the group fixes it.

{% codepen TODO-06 %}

---

## Labels and a timeline

Markers can hold text, too. `content: attr()` with a *string* is old CSS, and it works everywhere:

```html
<img src="spring.jpg" alt="Spring blossom" data-label="Spring">
```

```css
.carousel.labels > *::scroll-marker {
  border: 1px solid rgb(255 255 255 / 0.55);
  border-radius: 2rem;
  content: attr(data-label);
  padding: 0.25em 0.875em;
}
```

Too many labels for the frame? Cap the group at the carousel's width, measured with `anchor-size()`, and let it scroll:

```css
.carousel.labels {
  anchor-name: --labels;
  anchor-scope: --labels;
}
.carousel.labels::scroll-marker-group {
  max-inline-size: calc(anchor-size(--labels inline) - 1.5rem);
  overflow-x: auto;
  position-anchor: --labels;
}
```

`anchor-scope` keeps the name local, so ten carousels on a page don't fight over `--labels`.

A **timeline** is labels plus a dot on a rail. But a pseudo-element can't have pseudo-elements of its own, so there's no `::before` for the dot here. Instead, the dot and the rail are two *background layers* on the marker:

```css
.carousel.timeline > *::scroll-marker {
  background:
    radial-gradient(circle at 50% 6px, Canvas 0 4px, var(--rail) 4.5px 6px, #0000 6.5px),
    linear-gradient(to right, #0000 var(--rail-start, 0%), var(--rail) 0 var(--rail-end, 100%), #0000 0)
      0 5px / 100% 2px no-repeat;
  content: attr(data-date);
  flex: 0 0 7rem;
  padding-block-start: 1.25rem;
}
.carousel.timeline::scroll-marker-group {
  gap: 0; /* a gap breaks the rail into dashes */
}
```

The first and last markers set `--rail-start: 50%` and `--rail-end: 50%`, so the rail starts and stops *at* a dot.

A small accessibility note: `data-date` is what you *see*, while `alt` (or `aria-label`) is what a screen reader *hears*. The marker shows `1990`, and assistive tech announces "1990 — A telescope in orbit".

{% codepen TODO-07 %}

---

## A bar instead of dots

Keep the markers, but make them equal, seamless segments of one line:

```css
.carousel.bar::scroll-marker-group { gap: 0; inline-size: 100%; }
.carousel.bar > *::scroll-marker {
  background: linear-gradient(#fff8 0 0) center / 100% 1px no-repeat;
  block-size: 0.875rem;
  border-radius: 0;
  flex: 1;
}
.carousel.bar > *::scroll-marker:target-current {
  background: linear-gradient(#fff 0 0) center / 100% 3px no-repeat;
}
```

The marker is a tall, invisible hit area, and the *line* is a background. Every segment is clickable, so it works as a progress bar you can click anywhere.

Or skip the markers and style the **real** scrollbar, which is natively draggable:

```css
.carousel.scrollbar {
  scrollbar-color: var(--thumb) var(--track);
  scrollbar-width: thin;
}
```

{% codepen TODO-08 %}

---

## Going vertical

Swap the axis, and use the *block* buttons:

```css
.carousel.vertical {
  flex-direction: column;
  overflow: hidden auto;
  scroll-snap-type: y mandatory;
}
.carousel.vertical::scroll-button(inline-start),
.carousel.vertical::scroll-button(inline-end) { content: none; }

.carousel.vertical::scroll-button(block-start) {
  content: "" / "Previous";
  justify-self: anchor-center;
  rotate: -90deg;
  top: calc(anchor(top) + 0.75rem);
}
```

`content: none` is how you tell the browser "don't generate this one". The dots become a column at the inline-end edge, with `flex-direction: column` and `align-self: anchor-center`.

{% codepen TODO-09 %}

---

## More than one slide per view

Who says a slide has to be 100% wide? With three cards per view, we subtract the gaps and then divide:

```css
.carousel.cards > * {
  flex-basis: calc((100% - (var(--per-view) - 1) * var(--gap)) / var(--per-view));
}
```

Set `--per-view: 1.25` on small screens, and the *peek* of the next card says "swipe me".

Now we have nine dots for nine cards, but only three "pages". Here's a neat trick: only every third card is a snap point, and only every third card gets a marker:

```css
.carousel.paged > :not(:nth-child(3n + 1)) {
  scroll-snap-align: none;
}
.carousel.paged > :not(:nth-child(3n + 1))::scroll-marker {
  content: none;
}
```

Three dots, three pages. 🎉

And for **centred slides peeking in on both sides**, snap to the center and pad the scroller:

```css
.carousel.centered {
  padding-inline: 12%;
  scroll-padding-inline: 12%;
}
.carousel.centered > * { scroll-snap-align: center; }
```

{% codepen TODO-10 %}

---

## Animation and staggering — for absolute beginners

OK, this is the part I've been looking forward to. When you navigate to a new slide, we want its content (eyebrow, headline, text, button) to *cascade* in, one element after the other. That's called a **stagger**.

Before we write any code, we need to talk about *time*. There are four different ways to say "when" in CSS, and we'll use all of them:

| | Runs on … | Example |
|---|---|---|
| **Transition** | a clock, when a value *changes* | hover → fade in over 0.3s |
| **Animation** | a clock, when it's *applied* | spin for 1s, repeat forever |
| **Scroll-driven animation** | a *scroll position* instead of a clock | 0% scrolled → 100% scrolled |
| **Scroll-triggered animation** | a clock, but *started* by scrolling | entering the view → play once |

Let's take them one at a time.

### 1. A transition with a delay = a stagger

A transition animates a property from its old value to its new value. Add a `transition-delay` that grows for each sibling, and the siblings start one after the other:

```css
.slide-content > * {
  transition: opacity 0.75s, translate 0.75s;
  transition-delay: calc(sibling-index() * 0.1s);
}
```

`sibling-index()` is a new CSS function that returns an element's position among its siblings: 1, 2, 3 … The headline waits `0.1s`, the text waits `0.2s`, the button waits `0.3s`. That's the whole stagger.

> Before `sibling-index()`, we had to write `:nth-child(1) { --i: 1 }`, `:nth-child(2) { --i: 2 }` and so on, or set `style="--i: 3"` on every element. Not anymore!

But a transition needs a *change* to react to. So when does the content change?

### 2. A slide that knows it's snapped

This is where **scroll-state container queries** come in. You probably know size container queries: "if my container is wider than 30rem, then …". A *scroll-state* container can answer a different question: "*am I snapped right now?*"

```css
.carousel > * {
  container-type: scroll-state;
}
```

Every slide is now a container that knows its own snap state. So we can say: *while a slide is **not** snapped, hide its content*:

```css
@container not scroll-state(snapped: inline) {
  .slide-content > * {
    opacity: 0;
    translate: 0 3rem;
  }
}
```

Now, let's see what happens when we click "Next":

1. Slide 2 snaps into place. Its container query **stops** matching.
2. Its content goes from `opacity: 0; translate: 0 3rem` back to normal.
3. That's a *change*, so the transition runs …
4. … with the `sibling-index()` delays, so one … after … another.

And slide 1? It's no longer snapped, so its content quietly transitions back to the hidden state, ready for next time.

![Mid-stagger: the headline is in, the text is on its way](TODO)

Cool! And notice what we *didn't* do: we never asked *how* the slide got there. Swipe, arrow, dot, keyboard, or autoplay JS: it's the same snap, so it's the same animation.

### 3. Effects are just "from" values

The "from" state doesn't have to be "3rem down". Let's turn it into custom properties:

```css
@container not scroll-state(snapped: inline) {
  .slide-content > * {
    filter: var(--from-filter, none);
    opacity: 0;
    scale: var(--from-scale, 1);
    translate: var(--from-translate);
  }
}

.stagger-fall { --from-translate: 0 -3rem; }
.stagger-left { --from-translate: -3rem 0; }
.stagger-zoom { --from-translate: 0 0; --from-scale: 0.6; }
.stagger-blur { --from-translate: 0 0; --from-filter: blur(12px); }
```

Custom properties inherit, so put a class on the carousel to style every slide, or on *one* slide to give it its own effect. The closest one wins.

And please wrap all of it in a motion check. People who've asked their OS for less motion get the content *instantly*:

```css
@media (prefers-reduced-motion: no-preference) {
  /* the transitions and the from-state */
}
```

{% codepen TODO-11 %}

### 4. Scroll-*driven*: an animation on a timeline

So far everything has run on a clock: `0.75s`, from start to finish. A **scroll-driven** animation replaces the clock with a *timeline*. Think of the playhead in a video player: instead of moving by itself, it moves when you scroll.

```css
@keyframes reveal {
  from { opacity: 0; scale: 0.8; translate: 3rem 0; }
}

.carousel.reveal > * {
  animation: reveal linear both;
  animation-timeline: view(inline);
  animation-range: entry 0% entry 100%;
}
```

Let's break this down:

- `animation: reveal linear both`: a perfectly normal animation. But notice there's *no duration*. The timeline provides it.
- `animation-timeline: view(inline)`: "my timeline is *my own visibility* in my scroller, along the inline axis". This is a **view timeline**.
- `animation-range: entry 0% entry 100%`: only use the part of the timeline where I'm *entering* the view. At `entry 0%` the card's leading edge just touches the carousel's edge. At `entry 100%` the card is fully inside.

So as a card slides in from the right, it scales and fades in, *exactly* as fast as you scroll. Stop halfway, and it stops halfway. Scroll back, and it rewinds. 

![Cards scaling in as they enter the carousel](TODO)

A view timeline belongs to the element itself. There's also a **scroll timeline**, which is the scroll progress of a *scroller*, from 0% to 100%. Let's give our carousel a *named* one, and use it on an element *outside* the carousel, a progress line:

```css
.demo { timeline-scope: --carousel; }

.carousel.with-progress {
  scroll-timeline: --carousel inline;
}
.demo .progress::after {
  animation: grow linear both;
  animation-timeline: --carousel;
  scale: 0 1;
  transform-origin: 0 50%;
}
@keyframes grow { to { scale: 1 1; } }
```

`scroll-timeline` names the timeline. But a name is only visible to the scroller's *descendants*, and our progress line is a sibling. `timeline-scope` on a common ancestor lifts the name up so the siblings can see it.

### 5. Scroll-*triggered*: let the scroll press "play"

Scroll-driven is great, but sometimes you want a *proper* animation: one with a duration and an easing that plays once and stays, no matter how fast or slowly you scroll. For that, we use a **trigger**. The scroll decides *when*, and the clock decides *how*:

```css
.carousel.trigger > * {
  animation: reveal 0.75s cubic-bezier(0.16, 1, 0.3, 1) both;
  animation-trigger: --card play-forwards;
  timeline-trigger: --card view(inline) entry 25% exit 0%;
  trigger-scope: --card;
}
```

- `timeline-trigger` defines a trigger called `--card`: it *activates* when the card is 25% into its entry, and *deactivates* when it has fully exited.
- `animation-trigger: --card play-forwards` means "when `--card` activates, play the animation forwards". It's a normal, timed, one-shot animation.
- `trigger-scope` keeps each card's `--card` to itself.

This one is brand new (Chrome 145+), so keep it in an `@supports (timeline-trigger-name: --t)` block. Other browsers simply show the cards.

{% codepen TODO-12 %}

### 6. Bonus: animating a *number* (dynamic dots)

Here's where it gets a bit wild. With twelve slides, twelve dots is a lot. Instagram shows a five-dot *window* instead: the dots around the current one are full size, the rest shrink toward the edges, and the strip glides as you swipe.

The trick is to let a scroll-driven animation animate a *number* instead of a style. First we register a custom property, because only registered properties can be animated:

```css
@property --progress {
  syntax: "<number>";
  inherits: true;
  initial-value: 0;
}
@keyframes progress { to { --progress: 1; } }

.carousel.dynamic {
  animation: progress linear both;
  animation-timeline: scroll(self inline);
}
```

`scroll(self inline)` means "the carousel's own scroll progress". `--progress` now goes from `0` to `1` as you scroll, and because it *inherits*, every marker can read it. The rest is maths:

```css
.carousel.dynamic > *::scroll-marker {
  /* which slide is current, as a number */
  --center: clamp(1, var(--progress) * (sibling-count() - 1), sibling-count() - 2);
  /* how far THIS dot is from it */
  --distance: abs(sibling-index() - 1 - var(--center));
  scale: clamp(0.4, 1.3 - 0.3 * var(--distance), 1);
}
```

`sibling-count()` is `sibling-index()`'s twin: the total number of siblings. A dot that's 0–1 steps away gets full size, and every extra step shrinks it by 30%. The group itself is a fixed, five-dot window with `overflow: clip`. A negative margin on the *first* marker slides the whole strip along.

Phew! It's not beginner material, I know. But I think it's a beautiful example of what we just learned: a timeline doesn't have to drive a *style*. It can drive a *value*, and the rest of CSS can do whatever it likes with that value.

{% codepen TODO-13 %}

---

## Bonus: a gated quiz

One last thing, because it made me smile. What if each slide is a question, and you can't move on until you've answered?

```html
<form class="carousel quiz">
  <fieldset>
    <legend>Which pseudo-element draws the dots?</legend>
    <label><input type="radio" name="q2" required> ::scroll-dot</label>
    <label><input type="radio" name="q2" required> ::scroll-marker</label>
    …
  </fieldset>
  …
</form>
```

```css
.carousel.quiz > :has(:invalid) ~ * {
  display: none;
}
```

A `required` radio group is `:invalid` until one option is picked. Every slide *after* an unanswered question doesn't exist, so there's nothing to scroll to. The "Next" button disables itself, and the dot for the next question isn't even generated. Answer, and the next slide (and its dot) appears.

{% codepen TODO-14 %}

---

## What about Safari and Firefox?

As of writing (October 2026), `::scroll-marker`, `::scroll-button()` and scroll-state queries are Chrome-only. Safari 26 *does* support anchor positioning and scroll-driven animations, and Firefox has scroll-driven animations behind a flag.

Because we built this in layers, nothing breaks. Every carousel is a swipeable scroll-snap row in every browser. We just don't get the generated controls.

If you want the controls everywhere, the demos include a small fallback script. It runs *only* when the browser can't draw them:

```js
if (!CSS.supports('scroll-marker-group: after')) {
  /* wrap each .carousel, add real <button> dots and arrows */
}
```

It reads the carousel's custom properties, so the fallback buttons look the same, and it copies each slide's own properties (`--thumb`, the colourway colours) onto its dot. It also marks the current slide with `data-current`, so the stagger can use that when scroll-state queries aren't available:

```css
@supports not (container-type: scroll-state) {
  .carousel.stagger > :not([data-current]) .slide-content > * {
    opacity: 0;
    translate: var(--from-translate);
  }
}
```

Add `?polyfill` to any demo's URL to see the fallback in Chrome.

---

## Conclusion

We started with five lines of scroll-snap, and we ended with dots, pills, thumbnails, labels, timelines, cards, staggered content and scroll-driven reveals. The only JavaScript is an *optional* fallback.

To recap:

| Want | How |
|---|---|
| Swipe | `scroll-snap-type` + `scroll-snap-align` |
| Dots | `scroll-marker-group` + `::scroll-marker` |
| Arrows | `::scroll-button(inline-start / inline-end)` |
| Current dot | `:target-current` |
| Placement | anchor positioning: `position-anchor: auto` + `anchor()` |
| Per-slide dots | custom properties inherit into `::scroll-marker` |
| Text in dots | `content: attr(data-label)` |
| Stagger on snap | `container-type: scroll-state` + `sibling-index()` delays |
| Reveal on scroll | `animation-timeline: view(inline)` |
| Play once on scroll | `timeline-trigger` + `animation-trigger` |

All 14 demos are in this CodePen collection:

{% codepen TODO-collection %}

---

Thanks for reading!
