# Item Animations for `<lay-out>`

Add item-level scroll-driven animations to the layout system. Children of `<lay-out>` animate based on the **container's** scroll visibility via a named `view-timeline`. Stagger via nth-child fallback (up to 6 children) with `sibling-index()` progressive enhancement for unlimited children.

---

## Attribute Design

| Attribute | Scope | Purpose | Example |
|-----------|-------|---------|---------|
| `animation` | Container | Container animation (existing) | `animation="fade-right"` |
| `animation-items` | Children | Item animation name | `animation-items="fade-up"` |

Both attributes work independently and together.

---

## How It Works

1. `[animation-items]` creates a named `view-timeline: --layout-tl` on the container
2. All direct children (`> *`) animate using `animation-timeline: --layout-tl`
3. nth-child rules offset `animation-range` per child (20% per child, up to 6 children)
4. With `sibling-index()` support: stagger scales to any number of children automatically

**Why `animation-range` offset instead of `animation-delay`:**
Scroll-driven timelines map to scroll progress, not wall-clock time. `animation-delay` (time-based) doesn't produce predictable stagger with scroll-driven animations. Offsetting `animation-range` per child is the correct scroll-driven stagger technique.

**Why animation longhands instead of shorthand:**
The `animation` shorthand resets `animation-timeline` and `animation-range` due to CSS pending substitution when `var()` is used. Using individual `animation-name`, `animation-timing-function`, `animation-fill-mode` longhands avoids this interference.

---

## Item Animation Presets

Each preset maps to a single self-contained keyframe (opacity baked in):

| Preset | Keyframe |
|--------|----------|
| `fade-up` | `fade-up` |
| `fade-down` | `fade-down` |
| `fade-left` | `fade-left` |
| `fade-right` | `fade-right` |
| `fade-in` | `fade-in` |
| `zoom-in` | `zoom-in` |
| `flip-up` | `flip-up` |

---

## CSS Custom Properties

| Property | Default | Description |
|----------|---------|-------------|
| `--layout-item-timing` | `ease-out` | Item animation easing |

---

## CSS Implementation

All additions are in `core/animations.css` within the existing `@layer layout.animations` block, inside the `@supports (view-transition-name: none)` wrapper. No build changes required.

```css
/* Named container timeline for item animations */
[animation-items] {
  view-timeline: --layout-tl;
}

/* Item animation presets — single keyframe per preset */
[animation-items~="fade-up"] > * { --_item-animn: fade-up; }
[animation-items~="fade-down"] > * { --_item-animn: fade-down; }
[animation-items~="fade-left"] > * { --_item-animn: fade-left; }
[animation-items~="fade-right"] > * { --_item-animn: fade-right; }
[animation-items~="fade-in"] > * { --_item-animn: fade-in; }
[animation-items~="zoom-in"] > * { --_item-animn: zoom-in; }
[animation-items~="flip-up"] > * { --_item-animn: flip-up; }

/* Base item animation (scroll-driven via container timeline) */
[animation-items] > * {
  animation-name: var(--_item-animn);
  animation-timing-function: var(--layout-item-timing, ease-out);
  animation-fill-mode: backwards;
  animation-timeline: --layout-tl;
  animation-range: entry 0% entry 75%;
}

/* Stagger: offset animation-range per child (fallback) */
[animation-items] > :nth-child(2) { animation-range: entry 20% entry 95%; }
[animation-items] > :nth-child(3) { animation-range: entry 40% entry 100%; }
[animation-items] > :nth-child(4) { animation-range: entry 50% entry 100%; }
[animation-items] > :nth-child(5) { animation-range: entry 60% entry 100%; }
[animation-items] > :nth-child(6) { animation-range: entry 70% entry 100%; }
```

### Stagger enhancement (sibling-index)

```css
@supports (width: calc(sibling-index() * 1px)) {
  [animation-items] > * {
    animation-range:
      entry calc((sibling-index() - 1) * 20%)
      entry calc(75% + (sibling-index() - 1) * 20%);
  }
}
```

### Stagger math (20% offset per child)

| Child | Range Start | Range End |
|-------|-------------|-----------|
| 1 | `entry 0%` | `entry 75%` |
| 2 | `entry 20%` | `entry 95%` |
| 3 | `entry 40%` | `entry 100%` |
| 4 | `entry 50%` | `entry 100%` |
| 5 | `entry 60%` | `entry 100%` |
| 6 | `entry 70%` | `entry 100%` |

---

## Usage

```html
<!-- Item animation only -->
<lay-out animation-items="fade-up" lg="grid(3a)">
  <div>Item 1</div>
  <div>Item 2</div>
  <div>Item 3</div>
</lay-out>

<!-- Container + item animation -->
<lay-out animation="fade-right" animation-items="fade-up" lg="grid(3a)">
  <div>Item 1</div>
  <div>Item 2</div>
  <div>Item 3</div>
</lay-out>
```

---

## Browser Support

| Feature | Chrome | Firefox | Safari |
|---------|--------|---------|--------|
| `animation-timeline: view()` | 115+ | 110+ | 26+ |
| `view-timeline` (named) | 115+ | 110+ | 26+ |
| `sibling-index()` | 133+ | In dev | In dev |

Without `sibling-index()`: nth-child fallback staggers up to 6 children. With `sibling-index()`: stagger scales to any number of children.
