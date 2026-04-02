# Conveyor Animation Pattern

A diagonal "conveyor belt" carousel driven entirely by CSS scroll-driven animations. Items flow along a diagonal path (e.g., top-right to bottom-left), scaling up as they reach the center and scaling down as they leave. Vertical scrolling drives horizontal-diagonal movement.

## Reference

Inspired by [Apple Music 100 Best Albums](https://100best.music.apple.com/). Apple's implementation uses ~200+ lines of imperative JS to update per-item inline transforms on every scroll tick. This document describes a CSS-only recreation using `animation-timeline: scroll()` and `sibling-index()`.

## How It Works

```
┌─────────────────────────────────────────────────┐
│  .conveyor-track                                │
│  height: calc(item-size * item-count + 100vh)   │
│  scroll-snap-type: y proximity (optional)       │
│                                                 │
│  ┌───────────────────────────────────────────┐  │
│  │  .conveyor-viewport                       │  │
│  │  position: sticky; top: 0; height: 100vh  │  │
│  │                                           │  │
│  │  ┌─────────────────────────────────┐      │  │
│  │  │  items (absolutely positioned)  │      │  │
│  │  │  each animates along diagonal   │      │  │
│  │  │  via animation-timeline: scroll │      │  │
│  │  └─────────────────────────────────┘      │  │
│  └───────────────────────────────────────────┘  │
│                                                 │
│  (optional: invisible snap markers)             │
└─────────────────────────────────────────────────┘
```

1. **Tall scroll track** — creates the scroll runway. Height = item count * item size + 100vh.
2. **Sticky viewport** — stays fixed in the viewport while the track scrolls. Contains all items.
3. **Absolutely positioned items** — each item occupies the same space (centered) but is offset by a scroll-driven animation.
4. **`animation-timeline: scroll()`** — maps the track's scroll position to each item's transform keyframe.
5. **`sibling-index()`** — offsets each item's `animation-range` so they stagger through the diagonal path.

## Key Difference From Existing Animations

| | Layout animations (current) | Conveyor pattern |
|---|---|---|
| Timeline | `animation-timeline: view()` | `animation-timeline: scroll()` |
| Trigger | Element enters/exits viewport | Scroll position within a container |
| Items | Each has its own viewport entry | All share one scroll container |
| Position | Items are in normal flow | Items are absolutely positioned in a sticky viewport |

## CSS Implementation

### Structure

```html
<div class="conveyor-track">
  <div class="conveyor-viewport">
    <a class="conveyor-item" href="#">
      <img src="album1.jpg" alt="Album 1">
      <span>1. Album Title</span>
    </a>
    <a class="conveyor-item" href="#">
      <img src="album2.jpg" alt="Album 2">
      <span>2. Album Title</span>
    </a>
    <!-- ... more items ... -->
  </div>
</div>
```

### Core CSS

```css
.conveyor-track {
  --item-count: 100;
  --item-size: 375px;
  --skew: 15deg;
  --scale-inactive: 0.38;
  --diagonal-offset: 60; /* vw/vh units */

  height: calc(var(--item-size) * var(--item-count) + 100vh);
  position: relative;
}

.conveyor-viewport {
  position: sticky;
  top: 0;
  height: 100vh;
  width: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  overflow: hidden;
}

.conveyor-item {
  position: absolute;
  width: var(--item-size);
  height: var(--item-size);
  transform: skewY(var(--skew));

  animation: conveyor-path linear;
  animation-timeline: scroll(nearest block);
  animation-fill-mode: both;
}

@keyframes conveyor-path {
  0%   {
    translate: calc(var(--diagonal-offset) * 1vw) calc(var(--diagonal-offset) * -1vh);
    scale: var(--scale-inactive);
    opacity: 0;
  }
  40%  {
    translate: calc(var(--diagonal-offset) * 0.5vw) calc(var(--diagonal-offset) * -0.5vh);
    scale: var(--scale-inactive);
    opacity: 1;
  }
  50%  {
    translate: 0 0;
    scale: 1;
    opacity: 1;
  }
  60%  {
    translate: calc(var(--diagonal-offset) * -0.5vw) calc(var(--diagonal-offset) * 0.5vh);
    scale: var(--scale-inactive);
    opacity: 1;
  }
  100% {
    translate: calc(var(--diagonal-offset) * -1vw) calc(var(--diagonal-offset) * 1vh);
    scale: var(--scale-inactive);
    opacity: 0;
  }
}
```

### Per-Item Stagger via `sibling-index()`

```css
@supports (width: calc(sibling-index() * 1px)) {
  .conveyor-item {
    animation-range:
      calc((sibling-index() - 1) / var(--item-count) * 100%)
      calc((sibling-index() + 2) / var(--item-count) * 100%);
  }
}
```

Fallback for browsers without `sibling-index()` would require generated nth-child rules (similar to the existing stagger pattern in `animations.css`).

### Optional: Scroll Snap

For discrete "stops" at each item:

```css
.conveyor-track {
  scroll-snap-type: y proximity;
}

/* Invisible snap markers (one per item) */
.conveyor-track::before {
  content: '';
  display: block;
  height: calc(var(--item-size) * var(--item-count));
}

.snap-marker {
  scroll-snap-align: start;
  height: var(--item-size);
}
```

Alternatively, if the conveyor is the page's only scrolling content, set `scroll-snap-type` on `html` and place snap alignment on the track's child spacing elements.

## Direction Variants

The diagonal direction can be changed by adjusting the keyframe translate values:

| Direction | Entry → Exit |
|---|---|
| `top-right → bottom-left` | `translate(+X, -Y)` → `translate(-X, +Y)` (default, matches Apple) |
| `top-left → bottom-right` | `translate(-X, -Y)` → `translate(+X, +Y)` |
| `horizontal` | `translate(+X, 0)` → `translate(-X, 0)` |
| `vertical` | `translate(0, -Y)` → `translate(0, +Y)` |

## Custom Properties (Public API)

| Property | Default | Description |
|---|---|---|
| `--item-count` | `100` | Total number of items (used for height + range calculation) |
| `--item-size` | `375px` | Item width/height and scroll distance per item |
| `--skew` | `15deg` | SkewY angle for parallelogram look (set to `0` for square items) |
| `--scale-inactive` | `0.38` | Scale of non-active items |
| `--diagonal-offset` | `60` | Distance from center in vw/vh units |

## Integration With Layout System

### What Already Exists

- **`sibling-index()` stagger** — used in `animations.css` for per-child animation-range offsets
- **Scroll-driven animation infrastructure** — `@supports (view-transition-name: none)` feature gate
- **Keyframe architecture with custom properties** — multiplier pattern, computed internal vars
- **Progressive enhancement layers** — scroll-driven → sibling-index → scroll-triggered

### What Would Be New

- **`animation-timeline: scroll()`** — the system currently only uses `view()`. The conveyor needs scroll-position mapping, not viewport-entry mapping.
- **Sticky viewport pattern** — a container that stays in viewport while a tall parent scrolls.
- **Scale transitions along a path** — current keyframes do scale (zoom-in/out) or translate, but not combined path animation with scale as a function of position.
- **"Focused item" concept** — the center item is full-size while neighbors are miniatures.
- **Scroll-snap integration** — the layout system has no snap-point support today.

### Possible Attribute Syntax

```html
<!-- Basic diagonal conveyor -->
<lay-out animate-self="conveyor()" lg="columns(1)"
         style="--item-count: 20; --skew: 15deg;">
  <div>Item 1</div>
  <div>Item 2</div>
  <!-- ... -->
</lay-out>

<!-- Horizontal conveyor, no skew -->
<lay-out animate-self="conveyor(horizontal)" lg="columns(1)"
         style="--item-count: 10; --skew: 0deg;">
  <!-- ... -->
</lay-out>
```

## Browser Support

| Feature | Chrome | Firefox | Safari |
|---|---|---|---|
| `animation-timeline: scroll()` | 115+ | 110+ | 18+ |
| `sibling-index()` | 128+ | Not yet | Not yet |
| `scroll-snap-type` | 69+ | 68+ | 11+ |
| `position: sticky` | 56+ | 32+ | 13+ |

Without `sibling-index()`, fallback nth-child rules would be needed (generated by the build system, similar to the existing stagger pattern for 6 children but extended to N items).

## Apple's Implementation Details (Reference)

Observed from [100best.music.apple.com](https://100best.music.apple.com/dk):

- **Framework**: SvelteKit
- **Section height**: `calc(var(--album-dimensions) * var(--number-of-keyframes) + 100vh)` = ~38,034px
- **Sticky container**: `position: sticky; top: 0; height: 100vh`
- **100 items**: All absolutely positioned in `.item-container`
- **JS scroll handler**: Updates per-item inline `transform: matrix(scale, 0, 0, scale, tx, ty)` and `opacity` on every scroll event
- **Active item**: `scale(1)` at center, neighbors at `scale(0.38)` offset ~25px per step along diagonal
- **Skew**: `.album { transform: skewY(15deg) }` (static CSS, not animated)
- **No scroll-snap**: `scrollSnapType: none` everywhere
- **No CSS animations**: All transforms are imperative JS
