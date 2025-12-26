---
title: "Building a Circular Range Slider Web Component"
description: "Circular sliders have always fascinated me — there's something satisfying about dragging a thumb around a circle. In this tutorial, we'll build a fully accessible, customizable circular range slider as a Web Component."
tags: ["css", "javascript", "webdev", "showdev"]
---

I've always had a soft spot for circular sliders — don't know why, really. Maybe it's the tactile feel of old-school volume knobs, or the satisfying motion of dragging something around a circle. Either way, I've wanted to build a proper one for years.

The problem? Making circular sliders _accessible_ is surprisingly tricky. You can't just rotate a regular `<input type="range">` and call it a day — the thumb still moves horizontally, and pointer interaction becomes a mess.

So in the end, I had to call my father, a retired maths teacher, to brush up my trigonometry and understanding of arctangents, in order to create an accessible, circular range slider.

Let's dive in!

---

## The Goal

We want a circular slider that:

- Works with pointer devices _and_ keyboard navigation
- Supports partial arcs (not just full circles)
- Can be customized with CSS Custom Properties
- Includes optional labels and indices
- Participates in forms like a native input

Here's what we're building:

![Circular Range Examples](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/circular-range-examples.png)

Let's get started!

---

## Markup

The markup is beautifully simple — it's a custom element with a few attributes:

```html
<circular-range
  value="50"
  min="0"
  max="100"
  step="1"
  suffix="%"
></circular-range>
```

That's it! The component handles everything internally. But wait — there's more. We can add labels, indices, and control the arc:

```html
<circular-range
  value="90"
  min="0"
  max="200"
  start="220"
  end="500"
  indices="50"
  labels="0:0,50:50,100:100,150:150,200:200"
  suffix=" km"
></circular-range>
```

This creates a speedometer-style slider with a partial arc starting at 220° and ending at 500° (which wraps around). The `indices` attribute adds tick marks, and `labels` places text at specific values.

---

## The Shadow DOM Structure

Inside the component, we create a simple structure:

```html
<div part="track"></div>
<div part="fill"></div>
<div part="thumb"></div>
<ul part="indices"></ul>
<ol part="labels"></ol>
<slot></slot>
```

Each part has a specific job:

- **track** — The background arc
- **fill** — The colored portion showing the current value
- **thumb** — The draggable circle
- **indices** — Optional tick marks
- **labels** — Optional value labels

We use CSS `::part()` for external styling, so users can customize without diving into the Shadow DOM.

---

## The CSS Magic

Here's where it gets interesting! We use a CSS Grid to stack everything on top of each other:

```css
:host {
  aspect-ratio: 1;
  display: grid;
  grid-template-rows: repeat(var(--circular-range-rows), 1fr);
  place-items: center;
}

[part="fill"],
[part="track"] {
  border-radius: 50%;
  grid-area: var(--_ga);
  height: 100%;
  mask: var(--_mask);
  width: 100%;
}
```

**So what's going on?** We create a square container with `aspect-ratio: 1`, then use `grid-area` to stack all elements in the same cell. The circular shape comes from `border-radius: 50%` and a radial gradient mask that cuts out the center.

The track and fill are `conic-gradient`s:

```css
[part="fill"] {
  background: conic-gradient(
    from calc(var(--_fill-start) * 1deg),
    var(--circular-range-fill-start) 0deg,
    var(--circular-range-fill-middle) calc(var(--_fill-range) * 0.5deg),
    var(--circular-range-fill-end) calc(var(--_fill-range) * 1deg),
    #0000 calc(var(--_fill-range) * 1deg)
  );
}
```

Cool! The fill gradient supports three colors — start, middle, and end — allowing for beautiful gradient effects.

---

## Positioning Labels and Indices

Here's a neat trick: we use the CSS `offset-path` property to position labels and indices around the circle:

```css
[part="labels"] li {
  display: inline-block;
  offset-anchor: top;
  offset-distance: var(--_p, 0%);
  offset-path: content-box;
  offset-rotate: 0deg;
}
```

Each label gets a `--_p` custom property calculated from its value:

```js
const degree = ((value - this.#min) * this.#radian) + this.#startAngle;
li.style.setProperty('--_p', `${(degree / 360) * 100}%`);
```

The `offset-path: content-box` makes elements follow the border of their container — in our case, a circle! No trigonometry needed for positioning.

---

## A Bit of Math

For pointer interaction, we _do_ need some trigonometry. When the user drags the thumb, we calculate the angle:

```js
#pointerMove(event) {
  const degree = (
    ((Math.atan2(
      event.offsetY - this.#CY,
      event.offsetX - this.#CX
    ) * 180 / Math.PI) + 90 + 360) % 360
  );

  const relativeDegree = (degree - this.#startAngle + 360) % 360;
  let value = (relativeDegree / this.#radian) + this.#min;

  this.#setValue(value);
}
```

**So what's going on?** We use `Math.atan2()` to get the angle from the center of the component to the pointer position. We add 90° because `atan2` starts at 3 o'clock, but we want 12 o'clock as our reference. The modulo operations handle angle wrapping.

---

## Keyboard Navigation

Accessibility is built-in! The component is focusable and responds to arrow keys:

```js
#keydown(event) {
  if (!event.key.startsWith('Arrow')) return;
  event.preventDefault();

  const step = event.shiftKey ? this.#shiftStep : this.#step;
  const increment = (event.key === 'ArrowUp' || event.key === 'ArrowRight')
    ? step
    : -step;

  this.#setValue(this.value + increment);
}
```

Hold `Shift` for larger steps — perfect for quickly jumping through values.

---

## Form Participation

The component uses `ElementInternals` to participate in forms:

```js
static formAssociated = true;

constructor() {
  super();
  this.#internals = this.attachInternals();
}

#setValue(newValue) {
  // ... validation ...
  this.#internals.setFormValue(clampedValue);
  this.dispatchEvent(new Event('input', { bubbles: true }));
}
```

This means `<circular-range name="volume">` works just like a native input in forms!

---

## Variants

The same component can create wildly different UI elements. Here's an oven temperature control:

```html
<circular-range
  value="120"
  min="0"
  max="330"
  suffix="°C"
  step="5"
  start="20"
  end="340"
  indices="67"
  labels="0:0,60:60,120:120,180:180,240:240,300:300"
></circular-range>
```

Or partial arcs for more compact layouts:

```html
<circular-range
  class="top-arc"
  value="50"
  min="0"
  max="100"
  suffix="$"
  start="270"
  end="450"
></circular-range>
```

```css
.top-arc {
  clip-path: inset(0 0 40% 0);
  margin-bottom: -120px;
}
```

---

## CSS Custom Properties

The component is fully customizable through CSS Custom Properties:

| Property | Description |
|----------|-------------|
| `--circular-range-fill` | The fill color |
| `--circular-range-track` | The track color |
| `--circular-range-thumb` | The thumb color |
| `--circular-range-track-sz` | Track thickness |
| `--circular-range-output-fs` | Value font size |

There are over 25 properties available — see the full documentation for the complete list.

---

## Installation

Install from npm:

```bash
npm install @browser.style/circular-range
```

Then import:

```js
import '@browser.style/circular-range';
```

---

## Demo

Here's the component in action — a speedometer, oven control, and various arc configurations:

{% codepen https://codepen.io/stoumann/pen/circular-range %}

---

## What happened here?

We built a fully accessible circular range slider using:

- **CSS Grid** for stacking elements
- **Conic gradients** for the track and fill
- **offset-path** for positioning labels around the circle
- **Trigonometry** for pointer interaction
- **ElementInternals** for form participation

The result is a single custom element that can morph into speedometers, oven controls, volume knobs, or any circular slider you can imagine — all with a few attributes and CSS properties.

Thanks for reading!
