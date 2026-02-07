# Grid Animations Proposal: Animating Layouts at Breakpoints

## Overview

This proposal investigates options for animating grid layouts when they change at breakpoints — for example, when a layout morphs from `columns(2)` to `mosaic(scatter)`.

**Example:**
```html
<lay-out md="columns(2)" lg="grid(4c)" xl="mosaic(scatter)">
```

---

## The Challenge

When a layout changes at breakpoints, multiple properties change simultaneously:

| Property | `columns(2)` | `mosaic(scatter)` |
|----------|--------------|-------------------|
| `grid-template-columns` | `1fr 1fr` | `repeat(12, 1fr)` |
| `grid-template-rows` | `auto` | `repeat(12, 1fr)` |
| Track count | 2 columns | 12 columns × 12 rows |
| Item placement | Auto-flow | Explicit `grid-area` per item |

The fundamental issue: CSS Grid can only animate track sizing when the **number of tracks remains constant**.

---

## CSS Grid Animation Capabilities

### What Works (Native CSS)

Grid track **sizing** can be animated when:

- Same number of tracks before and after
- Compatible units (`fr` to `fr`, `px` to `px`)
- Using the `0fr` trick to "show/hide" columns

```css
/* This animates smoothly */
lay-out {
  transition: grid-template-columns 0.3s ease;
}

/* From */
grid-template-columns: 1fr 1fr 0fr;

/* To */
grid-template-columns: 1fr 1fr 1fr;
```

**Browser Support:**

| Browser | Version |
|---------|---------|
| Chrome | 107+ |
| Firefox | 66+ |
| Safari | 16+ |
| Edge | 107+ |

### What Doesn't Work

- Different track counts (`1fr 1fr` → `repeat(12, 1fr)`)
- Mixed units (`1fr` → `200px`)
- Adding/removing tracks without the `0fr` trick
- Animating `grid-area` changes on items

---

## Solution Options

### Option 1: View Transitions API (Recommended)

The View Transitions API can morph elements between completely different layouts by capturing before/after states and animating between them.

#### How It Works

1. Assign unique `view-transition-name` to each item
2. Wrap layout change in `document.startViewTransition()`
3. Browser calculates optimal animation path automatically

#### CSS Implementation

```css
/* Opt-in via attribute */
lay-out[animate-layout] > * {
  view-transition-name: var(--vt-name, none);
}

/* Auto-assign names with sibling-index (future) */
@supports (animation-delay: calc(sibling-index() * 1ms)) {
  lay-out[animate-layout] > * {
    view-transition-name: layout-item-sibling-index();
  }
}

/* Fallback: nth-child assignment */
lay-out[animate-layout] > *:nth-child(1) { view-transition-name: layout-item-1; }
lay-out[animate-layout] > *:nth-child(2) { view-transition-name: layout-item-2; }
lay-out[animate-layout] > *:nth-child(3) { view-transition-name: layout-item-3; }
lay-out[animate-layout] > *:nth-child(4) { view-transition-name: layout-item-4; }
lay-out[animate-layout] > *:nth-child(5) { view-transition-name: layout-item-5; }
lay-out[animate-layout] > *:nth-child(6) { view-transition-name: layout-item-6; }
lay-out[animate-layout] > *:nth-child(7) { view-transition-name: layout-item-7; }
lay-out[animate-layout] > *:nth-child(8) { view-transition-name: layout-item-8; }
lay-out[animate-layout] > *:nth-child(9) { view-transition-name: layout-item-9; }
lay-out[animate-layout] > *:nth-child(10) { view-transition-name: layout-item-10; }
lay-out[animate-layout] > *:nth-child(11) { view-transition-name: layout-item-11; }
lay-out[animate-layout] > *:nth-child(12) { view-transition-name: layout-item-12; }

/* Customize transition animation */
::view-transition-group(*) {
  animation-duration: var(--layout-morph-duration, 0.35s);
  animation-timing-function: var(--layout-morph-easing, ease-in-out);
}

/* Optional: stagger item animations */
::view-transition-group(layout-item-1) { animation-delay: 0ms; }
::view-transition-group(layout-item-2) { animation-delay: 25ms; }
::view-transition-group(layout-item-3) { animation-delay: 50ms; }
::view-transition-group(layout-item-4) { animation-delay: 75ms; }
/* ... */
```

#### JavaScript (Required)

```javascript
// Minimal script to trigger view transitions at breakpoints
(function() {
  if (!document.startViewTransition) return;

  const breakpoints = [
    window.matchMedia('(min-width: 240px)'),   // xs
    window.matchMedia('(min-width: 380px)'),   // sm
    window.matchMedia('(min-width: 540px)'),   // md
    window.matchMedia('(min-width: 720px)'),   // lg
    window.matchMedia('(min-width: 920px)'),   // xl
    window.matchMedia('(min-width: 1140px)')   // xxl
  ];

  breakpoints.forEach(mq => {
    mq.addEventListener('change', () => {
      document.startViewTransition(() => {
        // CSS media queries handle the layout change
        // View Transitions API captures and animates
      });
    });
  });
})();
```

#### Browser Support

| Browser | Version | Notes |
|---------|---------|-------|
| Chrome | 111+ | Full support |
| Edge | 111+ | Full support |
| Safari | 18+ | Full support (iOS 18+) |
| Firefox | Nightly | In development |

**Coverage:** ~75% of global browser usage

---

### Option 2: 0fr Trick (Limited Use Cases)

For simpler transitions where track structure can be preserved, pre-define all tracks and hide unused ones with `0fr`:

```css
lay-out {
  transition: grid-template-columns 0.3s ease;

  /* Always define max tracks, hide unused with 0fr */
  grid-template-columns: 1fr 1fr 0fr 0fr 0fr 0fr;
}

@media (min-width: 720px) {
  lay-out {
    grid-template-columns: 1fr 1fr 1fr 0fr 0fr 0fr;
  }
}

@media (min-width: 920px) {
  lay-out {
    grid-template-columns: 1fr 1fr 1fr 1fr 1fr 1fr;
  }
}
```

**Limitations:**

- Won't work for complex layouts like `mosaic(scatter)` (12×12 grid)
- Requires knowing maximum track count in advance
- Items in `0fr` columns may still affect layout

---

### Option 3: CSS `@starting-style` (Entry Only)

For initial appearance animations (not breakpoint transitions):

```css
lay-out {
  transition: opacity 0.3s, transform 0.3s;

  @starting-style {
    opacity: 0;
    transform: translateY(20px);
  }
}
```

**Limitation:** Only works for initial render, not breakpoint changes.

---

### Option 4: FLIP Animation Pattern

Manually calculate and animate position changes:

```javascript
function animateLayoutChange(layout) {
  const items = layout.querySelectorAll(':scope > *:not([slot])');

  // First: Record current positions
  const firstRects = [...items].map(el => el.getBoundingClientRect());

  // Layout change happens via CSS (class toggle or media query)
  // ... force reflow ...

  // Last: Get new positions
  const lastRects = [...items].map(el => el.getBoundingClientRect());

  // Invert + Play: Animate from old to new
  items.forEach((el, i) => {
    const dx = firstRects[i].left - lastRects[i].left;
    const dy = firstRects[i].top - lastRects[i].top;
    const dw = firstRects[i].width / lastRects[i].width;
    const dh = firstRects[i].height / lastRects[i].height;

    el.animate([
      { transform: `translate(${dx}px, ${dy}px) scale(${dw}, ${dh})` },
      { transform: 'translate(0, 0) scale(1, 1)' }
    ], {
      duration: 350,
      easing: 'ease-in-out'
    });
  });
}
```

**Limitations:**

- Requires JavaScript
- Doesn't capture all visual changes (borders, shadows, etc.)
- Scale transform can distort content

---

## Comparison Matrix

| Approach | Pure CSS | Handles Different Track Counts | Browser Support | Complexity |
|----------|----------|-------------------------------|-----------------|------------|
| View Transitions API | ❌ (needs JS trigger) | ✅ | ~75% | Low |
| 0fr Trick | ✅ | ❌ | ~95% | Medium |
| @starting-style | ✅ | ❌ (entry only) | ~80% | Low |
| FLIP Pattern | ❌ | ⚠️ (limited) | ~95% | High |

---

## Recommended Implementation

### Attribute Design

```html
<!-- Opt-in to layout morphing -->
<lay-out md="columns(2)" xl="mosaic(scatter)" animate-layout>
```

### CSS Custom Properties

| Property | Default | Description |
|----------|---------|-------------|
| `--layout-morph-duration` | `0.35s` | Transition duration |
| `--layout-morph-easing` | `ease-in-out` | Timing function |
| `--layout-morph-stagger` | `25ms` | Delay between items |

### Files to Add

1. **CSS:** Add `view-transition-name` rules to `base.css` or new `transitions.css`
2. **JavaScript:** Optional `breakpoint-transitions.js` polyfill/enhancement

### Usage Example

```html
<lay-out
  md="columns(2)"
  lg="grid(4c)"
  xl="mosaic(scatter)"
  animate-layout
  style="--layout-morph-duration: 0.5s;">

  <item-card></item-card>
  <item-card></item-card>
  <item-card></item-card>
  <item-card></item-card>
  <item-card></item-card>
  <item-card></item-card>
  <item-card></item-card>
  <item-card></item-card>
</lay-out>
```

---

## Future Considerations

### `sibling-index()` for Dynamic Names

When `sibling-index()` becomes widely available:

```css
lay-out[animate-layout] > * {
  view-transition-name: layout-item-sibling-index();
}
```

This eliminates the need for nth-child fallbacks.

### Cross-Document View Transitions

CSS View Transitions Level 2 introduces `@view-transition` rule for MPA transitions, which could enable animated layout changes during navigation.

---

## Summary

| Question | Answer |
|----------|--------|
| **Can we animate grid tracks at breakpoints?** | Only if track count stays the same |
| **Can we animate `columns` → `mosaic`?** | Not with pure CSS |
| **Best solution?** | View Transitions API + matchMedia |
| **Requires JavaScript?** | Yes, minimal (~15 lines) |
| **Browser support?** | ~75% (Chrome, Safari 18+, Edge) |
| **Impact on current system?** | Low — opt-in attribute + optional script |

---

## Sources

- [web.dev: CSS Animated Grid Layouts](https://web.dev/articles/css-animated-grid-layouts)
- [CSS-Tricks: Animating CSS Grid](https://css-tricks.com/animating-css-grid-how-to-examples/)
- [Bram.us: Animate CSS Grid with View Transitions](https://www.bram.us/2023/05/09/rearrange-animate-css-grid-layouts-with-the-view-transition-api/)
- [Chrome Blog: View Transitions 2025 Update](https://developer.chrome.com/blog/view-transitions-in-2025)
- [Frontend Masters: Fanout with Grid and View Transitions](https://frontendmasters.com/blog/fanout-with-grid-and-view-transitions/)
- [MDN: View Transition API](https://developer.mozilla.org/en-US/docs/Web/API/View_Transition_API)
- [CSS-Tricks: Animated Media Queries](https://css-tricks.com/animated-media-queries/)
- [Mozilla Bug: Animating grid-template-columns/rows](https://bugzilla.mozilla.org/show_bug.cgi?id=1348519)
