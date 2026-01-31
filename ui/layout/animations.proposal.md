# Animations Proposal: Scroll-Driven Item Animations

## Overview

This proposal investigates options for animating individual items within a `lay-out` component using CSS scroll-driven animations, including the upcoming `sibling-index()` and `sibling-count()` functions.

**Goal:** Enable staggered item animations where a layout fades in, then each item animates sequentially (e.g., slides up one-by-one).

---

## Current System

The layout system supports scroll-driven animations on **containers**:

```css
@supports (view-transition-name: none) {
  :where([animation]) {
    animation: var(--_animn, none), var(--_animn2, none);
    animation-timeline: view();
    animation-range: var(--_animr, var(--_animrs, entry 0%) var(--_animre, entry 75%));
  }
}
```

**Current usage:**
```html
<lay-out lg="grid(3a)" animation="fade-right">
  <!-- Entire layout animates, not individual items -->
</lay-out>
```

---

## The Challenge

**Desired effect:**
```
Timeline:
┌─────────────────────────────────────────┐
│ Layout enters viewport                   │
│   └─ Layout animates (fade-right)        │
│        └─ Item 1 animates (slide-up)     │
│             └─ Item 2 animates           │
│                  └─ Item 3 animates      │
└─────────────────────────────────────────┘
```

**Requirements:**
1. Each item needs its own animation timeline or staggered delay
2. Items should animate sequentially, not simultaneously
3. Solution should work with dynamic item counts
4. Must integrate with existing breakpoint/layout system

---

## CSS Scroll-Driven Animation Fundamentals

### `animation-timeline: view()`

Creates a timeline based on element visibility within the scrollport:

```css
.item {
  animation: slide-up;
  animation-timeline: view();
}
```

When applied to children, **each item gets an independent timeline** based on its own visibility.

### `animation-range` Property

Controls when animation plays relative to visibility:

| Range | Description |
|-------|-------------|
| `entry 0% entry 100%` | Full entry animation |
| `exit 0% exit 100%` | Full exit animation |
| `contain 0% contain 100%` | While fully visible |
| `cover 0% cover 100%` | From first pixel to last |

---

## New CSS Features: `sibling-index()` and `sibling-count()`

### `sibling-index()`

Returns an integer representing the element's position among siblings (1-indexed):

```css
.item {
  animation-delay: calc(sibling-index() * 100ms);
}
```

| Child Position | `sibling-index()` Returns |
|----------------|---------------------------|
| First child | `1` |
| Second child | `2` |
| Third child | `3` |
| Last child | `sibling-count()` |

### `sibling-count()`

Returns the total number of siblings (including the element itself):

```css
.item {
  /* Divide animation evenly across all items */
  animation-delay: calc((sibling-index() / sibling-count()) * 1s);
}
```

### Key Advantages Over `nth-child`

| Approach | Dynamic Count | No Inline Styles | Single Selector |
|----------|---------------|------------------|-----------------|
| `nth-child` selectors | ❌ | ✅ | ❌ |
| Inline `--i` variable | ✅ | ❌ | ✅ |
| `sibling-index()` | ✅ | ✅ | ✅ |

### Browser Support (as of January 2026)

| Browser | Support |
|---------|---------|
| Chrome | 133+ (behind flag), stable TBD |
| Edge | 133+ (behind flag) |
| Firefox | In development |
| Safari | In development |

**Status:** Part of CSS Values and Units Module Level 5 (Working Draft). Proposed for [Interop 2026](https://github.com/web-platform-tests/interop/issues/1024).

---

## Implementation Options

### Option 1: Per-Item View Timeline (Natural Stagger)

Each item animates based on its own visibility — items higher on the page animate first naturally.

```css
lay-out[animation-items] > *:not([slot]) {
  animation: var(--_item-anim, fade-up), opacity;
  animation-timeline: view();
  animation-range: entry 0% entry 75%;
  animation-fill-mode: backwards;
}
```

**Behavior:** Items animate as they individually enter the viewport. Natural stagger based on scroll position and item placement.

| Aspect | Assessment |
|--------|------------|
| Stagger Control | Low — depends on scroll speed |
| Dynamic Items | ✅ Works with any count |
| Browser Support | Good (Chrome 115+, Safari 26+) |
| Complexity | Minimal |

---

### Option 2: `sibling-index()` Stagger (Future-Ready)

Use `sibling-index()` for automatic delay calculation:

```css
lay-out[animation-items] > *:not([slot]) {
  animation: var(--_item-anim, fade-up), opacity;
  animation-timeline: view();
  animation-range: entry 0% entry 75%;
  animation-delay: calc(sibling-index() * var(--layout-stagger, 100ms));
}
```

**Behavior:** Each item delays based on its position. First item: 100ms, second: 200ms, etc.

| Aspect | Assessment |
|--------|------------|
| Stagger Control | High — predictable timing |
| Dynamic Items | ✅ Automatic |
| Browser Support | Limited (Chromium flag only) |
| Complexity | Minimal |

---

### Option 3: `nth-child` with Delays (Current Fallback)

Pre-define delays for fixed child counts:

```css
lay-out[animation-items] > *:not([slot]) {
  animation: var(--_item-anim, fade-up), opacity;
  animation-timeline: view();
  animation-range: entry 0% entry 75%;
}

lay-out[animation-items] > *:nth-child(1 of :not([slot])) { animation-delay: 0ms; }
lay-out[animation-items] > *:nth-child(2 of :not([slot])) { animation-delay: 100ms; }
lay-out[animation-items] > *:nth-child(3 of :not([slot])) { animation-delay: 200ms; }
lay-out[animation-items] > *:nth-child(4 of :not([slot])) { animation-delay: 300ms; }
lay-out[animation-items] > *:nth-child(5 of :not([slot])) { animation-delay: 400ms; }
lay-out[animation-items] > *:nth-child(6 of :not([slot])) { animation-delay: 500ms; }
lay-out[animation-items] > *:nth-child(n+7 of :not([slot])) { animation-delay: 600ms; }
```

| Aspect | Assessment |
|--------|------------|
| Stagger Control | High |
| Dynamic Items | ⚠️ Limited to defined count |
| Browser Support | Good (`:nth-child(of S)` in 2023+ browsers) |
| Complexity | Medium (many selectors) |

---

### Option 4: CSS Custom Property `--i` (Universal Fallback)

Use inline `style` with index variable:

```css
lay-out[animation-items] > *:not([slot]) {
  animation: var(--_item-anim, fade-up), opacity;
  animation-timeline: view();
  animation-delay: calc(var(--i, 0) * var(--layout-stagger, 100ms));
}
```

**Usage:**
```html
<lay-out lg="grid(3a)" animation-items="fade-up">
  <div style="--i: 0">Item 1</div>
  <div style="--i: 1">Item 2</div>
  <div style="--i: 2">Item 3</div>
</lay-out>
```

| Aspect | Assessment |
|--------|------------|
| Stagger Control | Maximum |
| Dynamic Items | ✅ Works with any count |
| Browser Support | Excellent |
| Complexity | Requires inline styles |

---

### Option 5: Staggered Animation Ranges

Offset `animation-range` per child instead of using delays:

```css
lay-out[animation-items] > *:nth-child(1 of :not([slot])) {
  animation-range: entry 0% entry 50%;
}
lay-out[animation-items] > *:nth-child(2 of :not([slot])) {
  animation-range: entry 10% entry 60%;
}
lay-out[animation-items] > *:nth-child(3 of :not([slot])) {
  animation-range: entry 20% entry 70%;
}
```

**With `sibling-index()` (future):**
```css
lay-out[animation-items] > *:not([slot]) {
  --_offset: calc(sibling-index() * 10%);
  animation-range:
    entry var(--_offset)
    entry calc(50% + var(--_offset));
}
```

| Aspect | Assessment |
|--------|------------|
| Stagger Control | Scroll-position based |
| Dynamic Items | ✅ With sibling-index() |
| Browser Support | Mixed |
| Complexity | Medium |

---

### Option 6: Named Container Timeline (Coordinated)

Children animate based on **container's** visibility, not their own:

```css
lay-out[animation-items] {
  view-timeline: --layout-timeline;
}

lay-out[animation-items] > *:not([slot]) {
  animation: var(--_item-anim, fade-up), opacity;
  animation-timeline: --layout-timeline;
  animation-range: entry 50% entry 100%;
  animation-delay: calc(sibling-index() * 100ms);
}
```

| Aspect | Assessment |
|--------|------------|
| Stagger Control | Coordinated with container |
| Dynamic Items | ✅ With sibling-index() |
| Browser Support | Good |
| Complexity | Medium |

---

## Recommended Implementation

### Progressive Enhancement Strategy

```css
/* === Base: Per-item view timeline (works now) === */
lay-out[animation-items] > *:not([slot]) {
  animation: var(--_item-anim, fade-up), opacity;
  animation-timing-function: var(--layout-item-timing, ease-out);
  animation-fill-mode: backwards;
  animation-timeline: view();
  animation-range: entry 0% entry 75%;
}

/* === Enhancement: sibling-index() stagger (future) === */
@supports (animation-delay: calc(sibling-index() * 1ms)) {
  lay-out[animation-items] > *:not([slot]) {
    animation-delay: calc(sibling-index() * var(--layout-stagger, 100ms));
  }
}

/* === Fallback: nth-child stagger (current) === */
@supports not (animation-delay: calc(sibling-index() * 1ms)) {
  lay-out[animation-items] > *:nth-child(1 of :not([slot])) { animation-delay: 0ms; }
  lay-out[animation-items] > *:nth-child(2 of :not([slot])) { animation-delay: 100ms; }
  lay-out[animation-items] > *:nth-child(3 of :not([slot])) { animation-delay: 200ms; }
  lay-out[animation-items] > *:nth-child(4 of :not([slot])) { animation-delay: 300ms; }
  lay-out[animation-items] > *:nth-child(5 of :not([slot])) { animation-delay: 400ms; }
  lay-out[animation-items] > *:nth-child(6 of :not([slot])) { animation-delay: 500ms; }
  lay-out[animation-items] > *:nth-child(n+7 of :not([slot])) { animation-delay: 600ms; }
}
```

### Item Animation Presets

```css
/* Animation type selection */
[animation-items~="fade-up"] > *:not([slot]) { --_item-anim: fade-up; }
[animation-items~="fade-down"] > *:not([slot]) { --_item-anim: fade-down; }
[animation-items~="fade-left"] > *:not([slot]) { --_item-anim: fade-left; }
[animation-items~="fade-right"] > *:not([slot]) { --_item-anim: fade-right; }
[animation-items~="zoom-in"] > *:not([slot]) { --_item-anim: zoom-in; }
[animation-items~="flip-up"] > *:not([slot]) { --_item-anim: flip-up; }
[animation-items~="slide-up"] > *:not([slot]) { --_item-anim: slide-up; }

/* Stagger timing presets */
[animation-items~="stagger-fast"] { --layout-stagger: 50ms; }
[animation-items~="stagger-normal"] { --layout-stagger: 100ms; }
[animation-items~="stagger-slow"] { --layout-stagger: 150ms; }
[animation-items~="stagger-slower"] { --layout-stagger: 200ms; }
```

### Reverse Stagger (Last-to-First)

With `sibling-index()` and `sibling-count()`:

```css
[animation-items~="reverse"] > *:not([slot]) {
  animation-delay: calc(
    (sibling-count() - sibling-index()) * var(--layout-stagger, 100ms)
  );
}
```

---

## Usage Examples

### Basic Item Animation

```html
<lay-out lg="grid(3a)" animation="fade-right" animation-items="fade-up">
  <div>Item 1</div>
  <div>Item 2</div>
  <div>Item 3</div>
</lay-out>
```

### Custom Stagger Timing

```html
<lay-out lg="columns(4)" animation-items="slide-up stagger-slow">
  <div>Item 1</div>
  <div>Item 2</div>
  <div>Item 3</div>
  <div>Item 4</div>
</lay-out>
```

### With Header Slot

```html
<lay-out lg="bento(6a)" animation="fade-in" animation-items="zoom-in stagger-fast">
  <header slot="header">
    <h2>Featured Content</h2>
    <p>Latest updates from our team</p>
  </header>
  <article>Article 1</article>
  <article>Article 2</article>
  <article>Article 3</article>
</lay-out>
```

### Manual Index Override

```html
<lay-out lg="columns(3)" animation-items="fade-up">
  <div style="--i: 2">Appears third</div>
  <div style="--i: 0">Appears first</div>
  <div style="--i: 1">Appears second</div>
</lay-out>
```

### Reverse Animation Order

```html
<lay-out lg="columns(4)" animation-items="fade-up reverse">
  <div>Appears last</div>
  <div>Appears third</div>
  <div>Appears second</div>
  <div>Appears first</div>
</lay-out>
```

---

## Browser Support Matrix

### Scroll-Driven Animations

| Feature | Chrome | Firefox | Safari | Edge |
|---------|--------|---------|--------|------|
| `animation-timeline: view()` | 115+ | 110+ | 26+ | 115+ |
| `animation-range` | 115+ | 110+ | 26+ | 115+ |
| `view-timeline` (named) | 115+ | 110+ | 26+ | 115+ |

### Sibling Functions

| Feature | Chrome | Firefox | Safari | Edge |
|---------|--------|---------|--------|------|
| `sibling-index()` | 133+ (flag) | In dev | In dev | 133+ (flag) |
| `sibling-count()` | 133+ (flag) | In dev | In dev | 133+ (flag) |

### Selector Support

| Feature | Chrome | Firefox | Safari | Edge |
|---------|--------|---------|--------|------|
| `:nth-child(of S)` | 111+ | 113+ | 16.4+ | 111+ |

---

## Integration with Existing System

### Attribute Design

| Attribute | Scope | Purpose | Example |
|-----------|-------|---------|---------|
| `animation` | Container | Container animation | `animation="fade-right"` |
| `animation-items` | Children | Item animation + stagger | `animation-items="fade-up stagger-slow"` |
| `range` | Both | Animation range override | `range="cover"` |

### CSS Custom Properties

| Property | Default | Description |
|----------|---------|-------------|
| `--layout-stagger` | `100ms` | Delay between items |
| `--layout-item-timing` | `ease-out` | Item animation easing |
| `--_item-anim` | `fade-up` | Item animation name |
| `--i` | `sibling-index()` | Manual index override |

### Keyframe Reuse

Existing keyframes from `animations.css` work for items:

- `fade-up`, `fade-down`, `fade-left`, `fade-right`
- `zoom-in`, `zoom-out`
- `slide-up`, `slide-down`, `slide-in`, `slide-out`
- `flip-up`, `flip-down`, `flip-left`, `flip-right`
- `bounce-in-*`

---

## Implementation Complexity

| Component | Selectors | CSS Size | Build Changes |
|-----------|-----------|----------|---------------|
| Base item animation | ~3 | ~0.2 KB | None |
| Animation presets | ~7 | ~0.4 KB | None |
| Stagger presets | ~4 | ~0.2 KB | None |
| nth-child fallback | ~7 | ~0.5 KB | None |
| sibling-index() enhancement | ~2 | ~0.2 KB | None |
| **Total** | **~23** | **~1.5 KB** | **None** |

---

## Summary

### What's Possible Now

1. **Per-item `view()` timeline** — natural stagger based on scroll position
2. **`nth-child` with delays** — controlled stagger for fixed item counts
3. **CSS custom property `--i`** — manual stagger with inline styles
4. **Named container timeline** — coordinated animations

### What's Coming

1. **`sibling-index()`** — automatic index without inline styles
2. **`sibling-count()`** — dynamic calculations based on total items
3. **Reverse stagger** — last-to-first animations with simple calc()

### Recommendation

Implement a **progressive enhancement strategy**:

1. **Base layer:** Per-item `view()` timeline (works everywhere)
2. **Enhancement:** `sibling-index()` when supported (future-ready)
3. **Fallback:** `nth-child` delays for controlled stagger (current browsers)

This approach provides immediate functionality while automatically upgrading as browser support improves.

---

## Sources

- [MDN: CSS Scroll-driven Animations](https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Scroll-driven_animations)
- [MDN: sibling-index()](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Values/sibling-index)
- [MDN: sibling-count()](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Values/sibling-count)
- [MDN: animation-range](https://developer.mozilla.org/en-US/docs/Web/CSS/animation-range)
- [CSS-Tricks: sibling-index()](https://css-tricks.com/almanac/functions/s/sibling-index/)
- [CSS-Tricks: Staggered Animation Approaches](https://css-tricks.com/different-approaches-for-creating-a-staggered-animation/)
- [Frontend Masters: Staggered Animation with CSS sibling-* Functions](https://frontendmasters.com/blog/staggered-animation-with-css-sibling-functions/)
- [Smashing Magazine: CSS Scroll-Driven Animations Introduction](https://www.smashingmagazine.com/2024/12/introduction-css-scroll-driven-animations/)
- [CSS-Tricks: Scroll-Based Animations with view()](https://css-tricks.com/creating-scroll-based-animations-in-full-view/)
- [W3C: Scroll-driven Animations Module Level 1](https://drafts.csswg.org/scroll-animations-1/)
- [Interop 2026 Proposal: sibling-count() and sibling-index()](https://github.com/web-platform-tests/interop/issues/1024)
