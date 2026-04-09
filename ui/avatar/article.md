# Building an Avatar Component with Pure CSS

Avatars are everywhere — chat apps, team pages, comment sections, dashboards. They seem simple, but once you start thinking about *initials fallback*, *status indicators*, *activity rings*, *group layouts*, *overflow counters* — and doing it all in both light and dark mode — things get interesting.

Most avatar components lean heavily on JavaScript. But what if we could build the entire thing in CSS — random colors, contrast-aware text, overflow counting — and only reach for JS when a framework needs it?

That's exactly what we'll do. Let's get started!

---

## The Markup

An avatar is fundamentally two things stacked on top of each other: **initials** and an **image**. If the image loads, it covers the initials. If it doesn't — or hasn't loaded yet — the initials show through.

We'll use an `<abbr>` tag for the initials (it gives us a free tooltip with the `title` attribute) and a plain `<img>`:

```html
<ui-avatar>
  <abbr title="Kim Cronos">KC</abbr>
  <img src="avatar.webp" alt="Kim Cronos" loading="lazy">
</ui-avatar>
```

`<ui-avatar>` is a custom element — but we're *not* using Shadow DOM or any JavaScript here. It's just a semantic HTML tag that we'll target with CSS. Think of it as a more meaningful `<div>`.

For an initials-only avatar, simply omit the image:

```html
<ui-avatar>
  <abbr title="Kim Cronos">KC</abbr>
</ui-avatar>
```

> **NOTE**: [Image: Two avatars side by side — one showing a photo, one showing "KC" initials on a colored background.]

---

## Base Styles

Let's make it *look* like an avatar. The key ingredients: a square with `aspect-ratio`, a circle via `border-radius`, CSS Grid to stack the children, and `container-type` so we can use container query units (`cqi`) for responsive sizing:

```css
:where(ui-avatar) {
  aspect-ratio: 1 / 1;
  block-size: 4em;
  border-radius: 50%;
  border: 2px solid light-dark(hsl(0, 0%, 95%), hsl(0, 0%, 15%));
  display: grid;
  place-content: center;
  position: relative;
}
```

The `<abbr>` and `<img>` are stacked with `grid-area: 1 / -1` — a CSS Grid trick that places both elements in the same cell, one on top of the other:

```css
ui-avatar abbr, ui-avatar img {
  grid-area: 1 / -1;
}
ui-avatar abbr {
  font-size: 33cqi;
  place-self: center;
  text-decoration: none;
  user-select: none;
}
ui-avatar img {
  border-radius: inherit;
}
```

So what's going on? The `grid-area: 1 / -1` makes both children occupy the exact same grid cell. Since the `<img>` comes after `<abbr>` in the markup, it naturally paints on top. The initials are always there underneath — they just get covered by the photo.

The `33cqi` font size means the initials scale proportionally with the container width. Nice!

> **NOTE**: [Image: A single circular avatar showing a photo, with browser DevTools open showing the Grid overlay and both stacked elements.]

Not much to see yet — it's a circle with a photo. Let's make it more interesting.

---

## Random Colors

Here's where things get fun. CSS now has a `random()` function that can generate a *different* value for *each element*:

```css
:where(ui-avatar) {
  --ui-avatar-background: oklch(0.5 0.25 random(auto, 0, 360));
  background: var(--ui-avatar-background);
}
```

The `random(auto, 0, 360)` picks a random hue for each avatar. The `auto` keyword means *per-element* — so every avatar on the page gets its own color. We're using `oklch` because it gives us *perceptually uniform* colors: all avatars will have similar lightness and saturation, just different hues.

> **NOTE**: [Image: A row of 4 initials-only avatars, each with a different vibrant background color — purple, teal, orange, pink.]

Cool! But wait — some of those colors might have dark text on a dark background. We need contrast-aware text.

---

## Auto-Contrast Text

CSS also gives us `contrast-color()`, which automatically picks black or white based on the background:

```css
:where(ui-avatar) {
  color: contrast-color(var(--ui-avatar-background));
}
```

That's it. One line. The browser figures out whether white or black text has better contrast against the random background. No JavaScript color math, no lookup tables.

> **NOTE**: [Image: Same row of colored avatars, but now some show white initials (on dark backgrounds) and others show dark initials (on light backgrounds). All are clearly readable.]

Much better!

---

## Sizes

Sizes are just a custom property override on the `size` attribute:

```css
:where(ui-avatar[size="xs"]) { --ui-avatar-size: 1.5rem; }
:where(ui-avatar[size="sm"]) { --ui-avatar-size: 2rem; }
:where(ui-avatar[size="md"]) { --ui-avatar-size: 3rem; }
/* lg is the default: 4em */
:where(ui-avatar[size="xl"]) { --ui-avatar-size: 5rem; }
:where(ui-avatar[size="2xl"]) { --ui-avatar-size: 7.5rem; }
```

```html
<ui-avatar size="xs"><abbr title="AB">AB</abbr></ui-avatar>
<ui-avatar size="sm"><abbr title="KC">KC</abbr></ui-avatar>
<ui-avatar size="2xl">
  <abbr title="KC">KC</abbr>
  <img src="avatar.webp" alt="Kim Cronos">
</ui-avatar>
```

Because we used `container-type: inline-size` and `cqi` units for the font size, the initials scale automatically with the avatar size. No media queries, no extra font-size rules.

> **NOTE**: [Image: A row of avatars in ascending sizes from xs to 2xl, showing how initials and images scale proportionally.]

---

## Shape Variants

Circles are the default, but sometimes you want a different shape. We support three:

```css
/* Square */
:where(ui-avatar[variant~="square"]) {
  --ui-avatar-border-radius: 0.375rem;
}

/* Squircle — iOS-style superellipse */
:where(ui-avatar[variant~="squircle"]) {
  corners: 50% superellipse(2);
}
```

The **squircle** uses `corners` with `superellipse()` — a CSS property that creates the smooth iOS-style rounded rectangle. It's a *true* superellipse, not just a big `border-radius`. Browsers that don't support it fall back to standard rounded corners.

```html
<ui-avatar variant="square">...</ui-avatar>
<ui-avatar variant="squircle">...</ui-avatar>
```

> **NOTE**: [Image: Three avatars side by side — circle (default), square with small radius, and squircle with the smooth iOS-style shape.]

---

## Status Indicator

Chat apps need to show whether someone is online, busy, or away. We'll use a `::after` pseudo-element positioned in the bottom-right corner:

```css
:where(ui-avatar[status])::after {
  background: var(--ui-avatar-status-color);
  block-size: 20cqi;
  inline-size: 20cqi;
  border-radius: 50%;
  border: 3cqi solid light-dark(hsl(0, 0%, 100%), hsl(0, 0%, 0%));
  content: "";
  position: absolute;
  inset-block-end: 4cqi;
  inset-inline-end: 4cqi;
}
```

Each status maps to a semantic color:

```css
:where(ui-avatar[status="online"]) {
  --ui-avatar-status-color: var(--color-success, hsl(136, 41%, 41%));
}
:where(ui-avatar[status="busy"]) {
  --ui-avatar-status-color: var(--color-error, hsl(360, 60%, 46%));
}
:where(ui-avatar[status="away"]) {
  --ui-avatar-status-color: var(--color-warning, hsl(33, 99%, 59%));
}
:where(ui-avatar[status="offline"]) {
  --ui-avatar-status-color: var(--color-text-muted, hsl(0, 0%, 60%));
}
```

The `cqi` units mean the dot scales with the avatar — a large avatar gets a larger dot, a small avatar gets a smaller one. And notice the border uses `light-dark()` — the white ring around the dot in light mode becomes black in dark mode, matching the surface color.

```html
<ui-avatar status="online">...</ui-avatar>
<ui-avatar status="busy">...</ui-avatar>
```

> **NOTE**: [Image: Four avatars showing each status — online (green dot), away (yellow dot), busy (red dot), offline (gray dot). Show both light and dark mode side by side.]

Getting there!

---

## Activity Ring

Some designs show a ring around the avatar — like Instagram stories. We'll use `box-shadow` with two layers: one for the gap between the avatar and the ring, and one for the ring itself:

```css
:where(ui-avatar[ring]) {
  --_ring: attr(ring type(<color>), var(--color-accent, hsl(211, 100%, 50%)));
  box-shadow:
    0 0 0 var(--ui-avatar-ring-offset, 3px) light-dark(white, black),
    0 0 0 calc(var(--ui-avatar-ring-offset, 3px) + var(--ui-avatar-ring-width, 2px)) var(--_ring);
}
```

So what happened? The first shadow creates a gap (matching the background), and the second shadow draws the colored ring outside it. The `attr(ring type(<color>))` reads the ring color directly from the HTML attribute — if no color is provided, it falls back to the accent color.

```html
<!-- Default accent ring -->
<ui-avatar ring>...</ui-avatar>

<!-- Custom green ring -->
<ui-avatar ring="hsl(136, 41%, 41%)">...</ui-avatar>
```

> **NOTE**: [Image: Four avatars with rings in different colors — blue (default), green, orange, red. One is a squircle, one is square, to show ring adapts to shape.]

Nice!

---

## Avatar Group

Now let's group multiple avatars — the overlapping stack you see on team pages and PR reviewers. Wrap them in a `<ui-avatar-group>`:

```html
<ui-avatar-group>
  <ui-avatar><img src="a1.webp" alt="Kim Cronos"></ui-avatar>
  <ui-avatar><img src="a2.webp" alt="Greg Hanson"></ui-avatar>
  <ui-avatar><img src="a3.webp" alt="John Doe"></ui-avatar>
  <ui-avatar><img src="a4.webp" alt="Linda Payne"></ui-avatar>
</ui-avatar-group>
```

The CSS is minimal — flexbox with a *negative* margin to create the overlap:

```css
:where(ui-avatar-group) {
  display: flex;
}
ui-avatar-group > *:not(:first-child) {
  margin-inline-start: -1cqi;
}
```

The negative margin pulls each avatar to the left (or right in RTL!), overlapping the previous one. Because we use `margin-inline-start` instead of `margin-left`, it works automatically with `dir="rtl"`.

We'll also add a subtle hover/focus effect — scaling the image up when you interact with an avatar:

```css
ui-avatar-group ui-avatar:focus-visible img { scale: 1.1; }

@media (hover: hover) {
  ui-avatar-group ui-avatar:hover img { scale: 1.1; }
}
```

> **NOTE**: [Image: A row of 4 overlapping avatars in a stack. One avatar is hovered, showing its image slightly scaled up.]

For evenly spaced avatars (no overlap), use `variant="spread"`:

```html
<ui-avatar-group variant="spread">...</ui-avatar-group>
```

```css
:where(ui-avatar-group[variant~="spread"]) {
  gap: 0.5rem;
}
ui-avatar-group[variant~="spread"] > *:not(:first-child) {
  margin-inline-start: 0;
}
```

> **NOTE**: [Image: Same 4 avatars, but now evenly spaced with gaps instead of overlapping.]

---

## Overflow Counter — The CSS-Only Way

Here's the *really* fun part. When you have 20 team members, you don't want to show all 20 avatars. You want to show 3 and a "+17" counter.

Traditionally, this requires JavaScript to count children and create the counter element. But CSS now has `sibling-count()` and `sibling-index()` — two functions that let CSS *count* and *identify* elements among their siblings. Combined with `counter-set`, we can do the entire overflow calculation in pure CSS.

Set `max` on the group:

```html
<ui-avatar-group max="3">
  <ui-avatar>...</ui-avatar> <!-- Visible -->
  <ui-avatar>...</ui-avatar> <!-- Visible -->
  <ui-avatar>...</ui-avatar> <!-- Visible -->
  <ui-avatar>...</ui-avatar> <!-- Counter: +4 -->
  <ui-avatar>...</ui-avatar> <!-- Hidden -->
  <ui-avatar>...</ui-avatar> <!-- Hidden -->
  <ui-avatar>...</ui-avatar> <!-- Hidden -->
</ui-avatar-group>
```

Let's break this down. First, we read the `max` attribute into a CSS variable using typed `attr()`:

```css
:where(ui-avatar-group[max]) {
  --_max: attr(max type(<number>), 0);
  counter-reset: overflow 0;
}
```

Then, for each child avatar, we calculate three things:

```css
ui-avatar-group[max] > ui-avatar {
  /* 1 if there ARE overflow items, 0 if not */
  --_has-overflow: clamp(0, sibling-count() - var(--_max), 1);

  /* 1 if THIS element should be hidden */
  --_hidden: clamp(0, sibling-index() - var(--_max) - 1, 1);

  /* 1 if THIS element is the counter position */
  --_is-counter: calc(1 - clamp(0, abs(sibling-index() - var(--_max) - 1), 1));
}
```

What happened here? `sibling-count()` returns the total number of children. `sibling-index()` returns the 1-based position of each child. Using `clamp()` and `abs()`, we turn these into binary flags — either 0 or 1.

The element at position `max + 1` becomes the counter. Everything after it gets hidden by shrinking to zero:

```css
block-size: calc(var(--ui-avatar-size) * (1 - var(--_hidden)));
opacity: calc(1 - var(--_hidden));
```

The counter element itself gets a `::after` pseudo with the overflow number. We use a CSS counter to display it:

```css
counter-set: overflow calc(sibling-count() - var(--_max));
```

Then, a style container query checks whether this element *is* the counter:

```css
@property --_show-counter {
  syntax: '<number>';
  inherits: false;
  initial-value: 0;
}
```

```css
--_show-counter: calc(var(--_is-counter) * var(--_has-overflow));

@container style(--_show-counter: 1) {
  ui-avatar::after {
    content: "+" counter(overflow);
    background: light-dark(hsl(0, 0%, 95%), hsl(0, 0%, 15%));
    color: light-dark(hsl(0, 0%, 60%), hsl(0, 0%, 40%));
    /* ... positioned to cover the avatar */
  }
}
```

OK, that was a handful — but we basically built a pure CSS overflow counter. No JavaScript. The `@container style()` query checks a *per-element* custom property to decide which single avatar gets the counter overlay. The `@property` registration ensures the value defaults to 0 (no counter) when the calculations aren't applicable.

> **NOTE**: [Image: An avatar group with 3 visible avatars and a "+4" counter element. Annotate which CSS calculations produce the visibility, counter position, and counter text.]

---

## Overflow Counter — The Framework Way

The CSS approach is great for static pages, but in a *framework* like React, Vue, or Svelte, you're rendering avatars in a loop. You don't want to render all 20 avatars just to let CSS hide 17 of them.

Instead, slice the array and render only the visible avatars — then add a counter element with the `overflow` attribute:

```html
<ui-avatar-group>
  <ui-avatar><img src="a1.webp" alt="User 1"></ui-avatar>
  <ui-avatar><img src="a2.webp" alt="User 2"></ui-avatar>
  <ui-avatar><img src="a3.webp" alt="User 3"></ui-avatar>
  <ui-avatar overflow><abbr>+4</abbr></ui-avatar>
</ui-avatar-group>
```

The `overflow` attribute overrides the random background with a neutral surface color:

```css
:where(ui-avatar[overflow]) {
  --ui-avatar-background: var(--color-surface-alt);
  --ui-avatar-color: var(--color-text-muted);
}
```

Here's how it looks in React:

```jsx
function TeamAvatars({ members, max = 3 }) {
  const visible = members.slice(0, max);
  const overflow = members.length - max;

  return (
    <ui-avatar-group>
      {visible.map(m => (
        <ui-avatar key={m.id}>
          <img src={m.avatar} alt={m.name} />
        </ui-avatar>
      ))}
      {overflow > 0 && (
        <ui-avatar overflow><abbr>+{overflow}</abbr></ui-avatar>
      )}
    </ui-avatar-group>
  );
}
```

No `max` attribute. No hidden elements in the DOM. The framework controls the loop, CSS handles the styling. And because `<ui-avatar>` uses children — not a `src` attribute — you can use **any** image component: Next.js `<Image>`, Nuxt `<NuxtImg>`, or a `<picture>` element with responsive sources.

> **NOTE**: [Image: Same visual result as the CSS-only overflow, but the DevTools Elements panel shows only 4 elements in the DOM instead of 7.]

---

## Dark Mode

Everything we've built works in dark mode *automatically*. Every color uses `light-dark()` with appropriate values:

- Avatar border adapts
- Status indicator ring adapts
- Activity ring gap adapts
- Overflow counter background adapts

No JavaScript toggling, no extra classes:

```css
border: 2px solid light-dark(hsl(0, 0%, 95%), hsl(0, 0%, 15%));
```

> **NOTE**: [Image: Side-by-side comparison showing a full avatar group in light mode and dark mode — all elements adapt correctly.]

---

## RTL Support

Because we used logical properties throughout — `inline-size`, `block-size`, `inset-inline-end`, `margin-inline-start` — right-to-left works out of the box:

```html
<ui-avatar-group dir="rtl">...</ui-avatar-group>
```

The stacking order reverses, status indicators stay in the correct corner, and the overlap direction flips. No extra CSS needed.

> **NOTE**: [Image: An avatar group in RTL mode — avatars overlap right-to-left.]

---

## Browser Support

Let's be honest about what's cutting-edge here:

| Feature | Status |
|---------|--------|
| Custom elements, Grid, `cqi` units | Widely supported |
| `light-dark()` | Chrome 123+, Firefox 120+, Safari 17.5+ |
| `sibling-count()` / `sibling-index()` | Chrome 133+, Safari 18.4+ |
| `random(per-element)` | Chrome 138+ |
| `contrast-color()` | Chrome 138+ |
| `corners: superellipse()` | Chrome 135+ |
| `attr(name type(<T>))` | Chrome 133+ |

The avatar *works* in all modern browsers — the advanced features degrade gracefully. Without `random()`, you get the fallback background color. Without `contrast-color()`, set `--ui-avatar-color` explicitly. Without `sibling-count()`, use the framework `overflow` approach instead of the CSS `max` attribute.

---

## Conclusion

We built a complete avatar component — random colors, contrast text, status indicators, activity rings, group stacking, and two different overflow strategies — and the CSS does almost *all* of it. The only JavaScript is a thin custom element wrapper for framework convenience.

The real stars here are the newer CSS features: `random()` for per-element variation, `contrast-color()` for automatic text contrast, `sibling-count()` and `sibling-index()` for pure CSS overflow counting, and `@container style()` for conditional pseudo-elements. None of these existed a couple of years ago. CSS keeps getting better.

---

Thanks for reading!
