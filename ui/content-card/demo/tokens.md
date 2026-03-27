# Content Card — Design Token Proposal

This document proposes a comprehensive design token system for the `<content-card>` component. The demo ships with a minimal set of custom properties; this document covers the full taxonomy for when the card moves from demo to package.

---

## Token Naming Convention

All tokens use the `--card-` prefix, followed by an optional element name and the property:

```
--card-{property}              → Card-level token
--card-{element}-{property}    → Element-level token
```

Examples:
- `--card-radius` → card border-radius
- `--card-headline-size` → headline font-size
- `--card-tag-bg` → tag background color

---

## Surface Tokens

| Token | Default | Description |
|---|---|---|
| `--card-bg` | `#fff` | Card background |
| `--card-bg-alt` | `#f7f5f2` | Alternative background (content-only cards) |
| `--card-radius` | `6px` | Border radius |
| `--card-shadow` | `0 1px 3px rgba(0,0,0,.06), 0 4px 12px rgba(0,0,0,.04)` | Default shadow |
| `--card-shadow-hover` | `0 2px 8px rgba(0,0,0,.08), 0 8px 24px rgba(0,0,0,.06)` | Hover shadow |
| `--card-border` | `#e0dbd5` | Border/divider color |
| `--card-border-width` | `0` | Border width (0 = no border, shadow only) |

---

## Typography Tokens

### Headline

| Token | Default | Description |
|---|---|---|
| `--card-headline-font` | `inherit` | Font family |
| `--card-headline-size` | `1.15rem` | Font size |
| `--card-headline-weight` | `700` | Font weight |
| `--card-headline-lh` | `1.25` | Line height |
| `--card-headline-ls` | `-0.02em` | Letter spacing |
| `--card-headline-color` | `var(--card-ink)` | Text color |

### Subheadline

| Token | Default | Description |
|---|---|---|
| `--card-subheadline-font` | `inherit` | Font family |
| `--card-subheadline-size` | `0.85rem` | Font size |
| `--card-subheadline-weight` | `300` | Font weight |
| `--card-subheadline-color` | `var(--card-ink-muted)` | Text color |
| `--card-subheadline-style` | `italic` | Font style |

### Summary

| Token | Default | Description |
|---|---|---|
| `--card-summary-font` | `inherit` | Font family |
| `--card-summary-size` | `0.82rem` | Font size |
| `--card-summary-weight` | `300` | Font weight |
| `--card-summary-lh` | `1.55` | Line height |
| `--card-summary-color` | `var(--card-ink-muted)` | Text color |

### Eyebrow

| Token | Default | Description |
|---|---|---|
| `--card-eyebrow-size` | `0.7rem` | Font size |
| `--card-eyebrow-weight` | `500` | Font weight |
| `--card-eyebrow-ls` | `0.08em` | Letter spacing |
| `--card-eyebrow-color` | `var(--card-accent)` | Text color |
| `--card-eyebrow-transform` | `uppercase` | Text transform |

### CTA Link

| Token | Default | Description |
|---|---|---|
| `--card-cta-size` | `0.78rem` | Font size |
| `--card-cta-weight` | `700` | Font weight |
| `--card-cta-color` | `var(--card-accent)` | Text color |

### Tag

| Token | Default | Description |
|---|---|---|
| `--card-tag-size` | `0.65rem` | Font size |
| `--card-tag-weight` | `500` | Font weight |
| `--card-tag-bg` | `#f0ece8` | Background color |
| `--card-tag-color` | `var(--card-ink-muted)` | Text color |
| `--card-tag-radius` | `100px` | Border radius (pill) |
| `--card-tag-px` | `0.55rem` | Horizontal padding |
| `--card-tag-py` | `0.2rem` | Vertical padding |

---

## Spacing Tokens

| Token | Default | Description |
|---|---|---|
| `--card-pi` | `1.25rem` | Content padding-inline |
| `--card-pbs` | `1.25rem` | Content padding-block-start |
| `--card-pbe` | `1.5rem` | Content padding-block-end |
| `--card-gap` | `0` | Gap between media and content areas |
| `--card-content-gap` | `0.4rem` | Gap between content elements |
| `--card-tags-gap` | `0.35rem` | Gap between tags |
| `--card-actions-gap` | `0.5rem` | Gap between action buttons |

---

## Color Tokens

| Token | Default | Description |
|---|---|---|
| `--card-ink` | `#1a1a1a` | Primary text color |
| `--card-ink-muted` | `#6b6560` | Secondary/muted text color |
| `--card-accent` | `#e84e1b` | Accent color (eyebrow, CTA, buttons) |
| `--card-accent-hover` | `brightness(0.9)` | Accent hover state |
| `--card-accent-light` | `#fff0eb` | Light accent (backgrounds) |

---

## Media Tokens

| Token | Default | Description |
|---|---|---|
| `--card-media-bg` | `#e8e0d8` | Media placeholder background |
| `--card-media-min-h` | `180px` | Minimum height (when no ar set) |
| `--card-media-radius` | `0` | Media area border-radius (inside card) |

---

## Button Tokens

| Token | Default | Description |
|---|---|---|
| `--card-btn-font` | `inherit` | Font family |
| `--card-btn-size` | `0.78rem` | Font size |
| `--card-btn-weight` | `700` | Font weight |
| `--card-btn-radius` | `4px` | Border radius |
| `--card-btn-px` | `1.4rem` | Horizontal padding |
| `--card-btn-py` | `0.65rem` | Vertical padding |
| `--card-btn-primary-bg` | `var(--card-accent)` | Primary background |
| `--card-btn-primary-color` | `#fff` | Primary text color |
| `--card-btn-secondary-bg` | `transparent` | Secondary background |
| `--card-btn-secondary-color` | `var(--card-ink)` | Secondary text color |
| `--card-btn-secondary-border` | `var(--card-border)` | Secondary border color |

---

## Interactive Tokens

| Token | Default | Description |
|---|---|---|
| `--card-transition` | `.25s ease` | Default transition timing |
| `--card-hover-lift` | `0` | Translate Y on hover (e.g., `-2px`) |
| `--card-focus-ring` | `2px solid var(--card-accent)` | Focus outline |
| `--card-focus-offset` | `2px` | Focus outline offset |

---

## Overlay Tokens

| Token | Default | Description |
|---|---|---|
| `--card-overlay-gradient-start` | `rgba(0,0,0,.45)` | Gradient dark end |
| `--card-overlay-gradient-end` | `rgba(0,0,0,0)` | Gradient transparent end |
| `--card-overlay-blur` | `0` | Backdrop blur for overlay content |
| `--card-overlay-ink` | `#fff` | Text color in overlay mode |
| `--card-overlay-ink-muted` | `rgba(255,255,255,.75)` | Muted text in overlay |
| `--card-overlay-tag-bg` | `rgba(255,255,255,.18)` | Tag background in overlay |

---

## Tailwind Integration

### Direct Mapping

Use Tailwind's `theme()` function to map card tokens to your design system:

```css
content-card {
  --card-accent: theme('colors.brand.500');
  --card-radius: theme('borderRadius.lg');
  --card-headline-size: theme('fontSize.lg');
  --card-shadow: theme('boxShadow.md');
}
```

### Utility Override (per instance)

Use Tailwind's arbitrary property syntax to override tokens on individual cards:

```html
<content-card class="[--card-accent:theme('colors.blue.600')] [--card-radius:0]">
```

### Wrapper Theme Class

Create theme wrappers that set multiple tokens at once:

```css
.card-theme-dark {
  --card-bg: var(--card-ink);
  --card-ink: #fff;
  --card-ink-muted: rgba(255,255,255,.7);
  --card-tag-bg: rgba(255,255,255,.12);
  --card-tag-color: rgba(255,255,255,.85);
  --card-border: rgba(255,255,255,.15);
}

.card-theme-brand {
  --card-bg: var(--card-accent);
  --card-ink: #fff;
  --card-ink-muted: rgba(255,255,255,.8);
  --card-eyebrow-color: rgba(255,255,255,.7);
}
```

### Tailwind Plugin (Future)

A potential Tailwind plugin could provide a shorthand:

```js
// tailwind.config.js
plugins: [
  require('@browser.style/content-card/tailwind')({
    accent: 'brand.500',
    radius: 'lg',
    shadow: 'md'
  })
]
```

---

## Per-Instance Override Pattern

Tokens can be overridden per card instance via inline styles:

```html
<!-- Rounded card with no shadow -->
<content-card style="--card-radius: 16px; --card-shadow: none;">

<!-- Large headline -->
<content-card style="--card-headline-size: 2rem;">

<!-- Custom accent -->
<content-card style="--card-accent: #2563eb;">
```

---

## Theming Extension Points (Future)

### Dark Theme

```css
content-card[theme="dark"] {
  --card-bg: var(--card-ink);
  --card-ink: #fff;
  --card-ink-muted: rgba(255,255,255,.7);
  --card-tag-bg: rgba(255,255,255,.12);
  --card-tag-color: rgba(255,255,255,.85);
  --card-border: rgba(255,255,255,.15);
  --card-media-bg: #2a2520;
  --card-btn-primary-bg: #fff;
  --card-btn-primary-color: var(--card-ink);
}
```

### Brand Theme

```css
content-card[theme="brand"] {
  --card-bg: var(--card-accent);
  --card-ink: #fff;
  --card-ink-muted: rgba(255,255,255,.8);
  --card-eyebrow-color: rgba(255,255,255,.7);
  --card-tag-bg: rgba(255,255,255,.2);
  --card-tag-color: #fff;
}
```

### System Dark Mode

```css
@media (prefers-color-scheme: dark) {
  content-card {
    --card-bg: #1e1e1e;
    --card-ink: #e5e5e5;
    --card-ink-muted: #a0a0a0;
    --card-media-bg: #2a2a2a;
    --card-tag-bg: #333;
    --card-border: #404040;
    --card-shadow: 0 1px 3px rgba(0,0,0,.2), 0 4px 12px rgba(0,0,0,.15);
  }
}
```

---

## Migration Path

The minimal set shipped in the demo covers ~15 tokens. The full set above adds ~50 more. Migration is non-breaking:

1. **Phase 1 (demo):** Ship minimal set, hardcoded values in CSS
2. **Phase 2 (package):** Replace hardcoded values with token references
3. **Phase 3 (theming):** Add theme attribute support and presets
4. **Phase 4 (Tailwind):** Ship optional Tailwind plugin
