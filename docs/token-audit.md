# Design Token Audit — Complete Overview

> Generated 2026-04-01 by auditing all 148 `ui-*.css` component stylesheets.
> Cross-referenced against existing global tokens in `ui/base/core.css`.

---

## Global Tokens (core.css — v4)

| Category | Tokens |
|----------|--------|
| **Colors** | `--color-accent`, `--color-accent-dark`, `--color-accent-text`, `--color-border`, `--color-button`, `--color-button-text`, `--color-surface`, `--color-surface-alt`, `--color-text`, `--color-field`, `--color-text-muted`, `--color-highlight`, `--color-link`, `--color-mark`, `--color-mark-text`, `--color-link-visited`, `--color-info`, `--color-error`, `--color-success`, `--color-warning`, `--color-overlay`, `--color-overlay-light` |
| **Font Family** | `--font-body`, `--font-form`, `--font-heading`, `--font-mono`, `--font-serif` |
| **Font Size** | `--font-size-xs` (0.75rem) .. `--font-size-9xl` (8rem) — 13 steps |
| **Font Weight** | `--font-weight-thin` (100), `--font-weight-light` (300), `--font-weight-normal` (400), `--font-weight-medium` (500), `--font-weight-semibold` (600), `--font-weight-bold` (700), `--font-weight-black` (900) |
| **Line Height** | `--line-height-none` (1), `--line-height-tight` (1.1), `--line-height-snug` (1.25), `--line-height-normal` (1.5), `--line-height-relaxed` (1.625), `--line-height-loose` (2) |
| **Letter Spacing** | `--tracking-tighter` (-0.05em) .. `--tracking-widest` (0.1em) — 6 steps |
| **Spacing** | `--spacing-xs` (0.25rem), `--spacing-sm` (0.5rem), `--spacing-md` (1rem), `--spacing-lg` (1.5rem), `--spacing-xl` (2rem), `--spacing-2xl` (3rem) |
| **Border Width** | `--border-width` (1px), `--border-width-thick` (2px), `--border-width-heavy` (3px) |
| **Radius** | `--radius-xs` (0.125rem) .. `--radius-4xl` (2rem), `--radius-circle` (50%), `--radius-pill` — 12 steps |
| **Shadows** | `--shadow-sm`, `--shadow-md`, `--shadow-lg`, `--shadow-xl` |
| **Duration** | `--duration-fast` (100ms), `--duration-normal` (200ms), `--duration-slow` (300ms), `--duration-slower` (400ms) |
| **Easing** | `--ease-default`, `--ease-in`, `--ease-out`, `--ease-in-out` |
| **Blur** | `--blur-sm` (4px), `--blur-md` (12px), `--blur-lg` (24px) |
| **Z-Index** | `--z-index-1` (1), `--z-index-2` (10), `--z-index-3` (100), `--z-index-4` (500), `--z-index-5` (1000) |
| **Opacity** | `--opacity-disabled` (0.5) |

---

## Audit Findings — Hardcoded Values Across Components

### 1. Spacing Scale (gaps in `ch` / `em` units)

Components overwhelmingly use `ch` for padding/gap. The current spacing scale is `rem`-based only. Many components need a **content-relative** scale.

| Hardcoded Value | Frequency | Used In (examples) | Proposed Token |
|-----------------|-----------|---------------------|----------------|
| `.25ch` / `.25em` | 12+ | pagination, color-palette, reaction, timeslot | `--spacing-xs` *(exists as 0.25rem)* |
| `.33ch` / `.33em` | 15+ | position, timeslot, color-mask, mood, blink, chat | *(no token — see note)* |
| `.5ch` / `.5em` | 25+ | check-list, chip, tab-bar, tabs, draggable, number-spinner | `--spacing-sm` *(exists as 0.5rem)* |
| `.66ch` / `.66em` | 8+ | card, dock, listgrid, color-palette, step | *(no token — see note)* |
| `1ch` / `1em` | 50+ | details, divider, footer, grid, scroll, toast, nearly everywhere | `--spacing-md` *(exists as 1rem)* |
| `1.5ch` / `1.5em` | 20+ | accordion, menu, timeline, color-key, number-spinner, context-menu | `--spacing-lg` *(exists as 1.5rem)* |
| `2ch` / `2em` | 30+ | syntax, tabs, footer, form-step, slider, text-slider, timeline | `--spacing-xl` *(exists as 2rem)* |
| `3ch` | 6+ | footer, launchpad, tab-bar, tabs | `--spacing-2xl` *(exists as 3rem)* |

> **Note:** The `.33` and `.66` values are thirds — common in `ch`-based layouts but not present in any standard spacing scale. These are likely intentional one-offs and don't need dedicated tokens. Components already using `ch` benefit from content-relative sizing. The existing `rem`-based scale works as a reference; components should fall back to it where appropriate.

### 2. Border Width

| Hardcoded Value | Frequency | Used In (examples) | Proposed Token |
|-----------------|-----------|---------------------|----------------|
| `1px` | 40+ | check-list, context-menu, description-list, divider, file-list, file-tree, marquee, select, tabs, timeline, worldmap, blink, draggable, reaction, image-compare, image-gallery, calculator, calendar | `--border-width` or `--border-width-default` |
| `2px` | 10+ | avatar, color-mask, config-group, product-grid, table-resize, range-circular, cinema | `--border-width-thick` |
| `3px` | 3 | split-panel, tabs (active indicator) | `--border-width-heavy` |

### 3. Font Weight

| Hardcoded Value | Frequency | Used In (examples) | Proposed Token |
|-----------------|-----------|---------------------|----------------|
| `100` | 1 | calculator | `--font-weight-thin` |
| `300` | 1 | countdown | `--font-weight-light` |
| `400` | 5+ | calculator, calendar, chronology, periodic-table, syntax | `--font-weight-normal` |
| `500` | 8+ | accordion, live, periodic-table, step, tabs, analog-clock, font-weight in base | `--font-weight-medium` |
| `600` | 2 | testimonial | `--font-weight-semibold` |
| `700` | 15+ | range-arc, range-circular, range-gauge, range-mask, rating-histogram, ribbon, step, word-cloud, word-wheel, pie-chart, digital-clock, bmi, countdown | `--font-weight-bold` |
| `900` | 6+ | number, chronology, slideshow, confetti, word-replace | `--font-weight-black` |

### 4. Line Height

| Hardcoded Value | Frequency | Used In (examples) | Proposed Token |
|-----------------|-----------|---------------------|----------------|
| `1` | 8+ | bento, chronology, periodic-table, badge (text variant) | `--line-height-none` |
| `1.1` | 4 | timeslot, tooltip, word-cloud, team | `--line-height-tight` |
| `1.2` | 4 | testimonial, chronology, team | `--line-height-snug` |
| `1.3` | 2 | chat | `--line-height-normal` |
| `1.6` | 2 | linenumber, ribbon | `--line-height-relaxed` |

### 5. Transition / Animation Duration

| Hardcoded Value | Frequency | Used In (examples) | Proposed Token |
|-----------------|-----------|---------------------|----------------|
| `.15s` / `150ms` | 3 | pie-chart, periodic-table | *(use --duration-fast)* |
| `.2s` / `200ms` | 20+ | avatar, gallery, card-flip, tooltip, radial-menu, color-compare, color-mask, config-group, image-select, mood, reaction, scroll-nav | *(use --duration-normal — already exists)* |
| `.25s` / `250ms` | 10+ | card-expand, details, menu, video-list, image-map | *(between fast/normal)* |
| `.3s` / `300ms` | 5+ | accordion | *(use --duration-slow — already exists)* |
| `.33s` | 3 | card-flip, progress | *(close to --duration-slow)* |
| `.4s` | 8+ | context-menu, drawer, expand-feature, launchpad, reaction | `--duration-slower` |
| `.5s` | 4 | card-flip, dark-mode, video-list | `--duration-slowest` |
| `.6s` | 2 | accordion (media), dark-mode | *(use --duration-slowest or component-level)* |

> **Recommendation:** Add `--duration-slower: 400ms` and optionally `--duration-slowest: 600ms`. Most `.25s` uses can map to `--duration-normal` or `--duration-slow`.

### 6. Easing Functions

| Hardcoded Value | Frequency | Used In (examples) | Proposed Token |
|-----------------|-----------|---------------------|----------------|
| `ease-in-out` | 15+ | avatar, gallery, card-flip, color-compare, config-group, pie-chart | `--ease-in-out` |
| `ease-in` | 5+ | card-flip, image-map, scroll-nav, skeleton | `--ease-in` |
| `ease-out` | 3 | reaction | `--ease-out` |
| `cubic-bezier(.4, 0, .2, 1)` | 3 | details, drawer | `--ease-default` *(already exists)* |
| `cubic-bezier(.2, 0, .2, 1)` | 1 | details | *(close to default)* |
| `linear` | 5+ | mood, skeleton | *(CSS keyword, no token needed)* |

### 7. Opacity

| Hardcoded Value | Frequency | Used In (examples) | Proposed Token |
|-----------------|-----------|---------------------|----------------|
| `0` | 30+ | Many (hide/show animations) | *(CSS keyword, no token needed)* |
| `0.33` | 2 | price-card | `--opacity-muted` |
| `0.5` | 4 | draggable, rich-text, blinds | `--opacity-disabled` |
| `0.6` | 2 | skeleton | `--opacity-subtle` |
| `0.75` | 2 | video-list | `--opacity-soft` |
| `0.9` | 3 | tooltip, wheel-of-fortune | `--opacity-high` |
| `1` | 20+ | Many (show state) | *(CSS default, no token needed)* |

> **Recommendation:** Only `--opacity-disabled: 0.5` is worth a global token. Others are too context-specific.

### 8. Z-Index Scale

| Hardcoded Value | Frequency | Used In (examples) | Proposed Token |
|-----------------|-----------|---------------------|----------------|
| `1` | 5+ | launchpad, tooltip | `--z-index-raised` |
| `500` | 1 | scroll-nav | `--z-index-sticky` |

> **Recommendation:** Add a z-index scale for layering: `--z-index-base: 0`, `--z-index-raised: 1`, `--z-index-dropdown: 100`, `--z-index-sticky: 500`, `--z-index-overlay: 1000`.

### 9. Backdrop Filter (Blur)

| Hardcoded Value | Frequency | Used In (examples) | Proposed Token |
|-----------------|-----------|---------------------|----------------|
| `blur(3px)` | 1 | video-list | `--blur-sm` |
| `blur(10px)` | 2 | dock, skeleton | `--blur-md` |
| `blur(20px)` | 2 | drawer, expand-feature | `--blur-lg` |

### 10. Overlay / Scrim Colors

| Hardcoded Value | Frequency | Used In (examples) | Proposed Token |
|-----------------|-----------|---------------------|----------------|
| `rgba(0,0,0,.25)` | 2 | menu, menu-details | `--color-overlay` |
| `color-mix(in srgb, CanvasText, transparent 48%)` | 2 | drawer, expand-feature | `--color-overlay` *(same use)* |
| `color-mix(in srgb, CanvasText 25%, transparent)` | 2 | dialog, launchpad | `--color-overlay-light` |
| `color-mix(in srgb, CanvasText 10%, transparent)` | 1 | accordion, table-resize | `--color-overlay-subtle` |
| `#000A` / `#000C` | 2 | pie-chart, video-list | `--color-overlay` *(dark variant)* |

> **Recommendation:** Add `--color-overlay: color-mix(in srgb, CanvasText, transparent 50%)` and `--color-overlay-light: color-mix(in srgb, CanvasText 25%, transparent)`. These replace scattered `rgba(0,0,0,...)` and `color-mix` patterns.

### 11. Box Shadow Patterns

| Hardcoded Value | Frequency | Used In (examples) | Proposed Token |
|-----------------|-----------|---------------------|----------------|
| `0px 25px 50px -12px color-mix(...)` | 2 | dialog, launchpad | `--shadow-xl` *(exists — remap)* |
| `0px 6px 15px rgba(0,0,0,.12)` | 2 | menu, menu-details | `--shadow-md` *(exists — remap)* |
| `0 0 0 2px ...` (ring/focus) | 5+ | range-circular, scroll-nav, price-card | `--ring-width: 2px` + `--ring-offset: 0` |

### 12. Breakpoints (for reference)

Not tokenizable in CSS custom properties, but worth documenting for consistency:

| Hardcoded Value | Frequency | Used In (examples) |
|-----------------|-----------|---------------------|
| `400px` | 1 | chronology |
| `480px` | 4 | grid |
| `600px` | 3 | carousel, image-gallery |
| `768px` | 4 | grid |
| `800px` | 1 | timeslot |
| `1024px` | 4 | grid |
| `1200px` | 2 | menu |
| `1440px` | 4 | grid |

---

## Implemented in v4

All high and medium priority tokens have been added to `core.css`. New categories:

- **Font Size** — 9-step scale (xs–5xl), aligned with Tailwind v4
- **Font Weight** — 7 named weights (thin–black), aligned with Tailwind/Shoelace
- **Line Height** — 6-step scale (none–loose), aligned with Tailwind `--leading-*`
- **Letter Spacing** — 6-step scale (tighter–widest), aligned with Tailwind `--tracking-*`
- **Border Width** — 3 steps (1px, 2px, 3px)
- **Duration** — added `--duration-slower` (400ms)
- **Easing** — added `--ease-in`, `--ease-out`, `--ease-in-out` (cubic-bezier values)
- **Blur** — 3 steps for backdrop-filter (4px, 12px, 24px)
- **Z-Index** — 5-step numeric scale (1, 10, 100, 500, 1000)
- **Opacity** — `--opacity-disabled` (0.5)
- **Overlay Colors** — `--color-overlay`, `--color-overlay-light` (color-mix based, light/dark safe)

### Low Priority / Not Recommended

| Value | Reason |
|-------|--------|
| `.33ch`, `.66ch` spacing | Content-relative thirds — intentional per-component choice |
| `font-size: smaller/small/larger` | CSS keywords, already relative — no benefit from tokenizing |
| `opacity: 0` / `opacity: 1` | Animation endpoints — no semantic meaning as tokens |
| `border-radius: 50%` | Already exists as `--radius-circle` |
| Planet colors, mood colors, BMI colors, periodic table colors | Domain-specific — should remain component-level tokens |
| Breakpoints | Can't be CSS custom properties (used in `@media`) |
| `cqi`-based values | Container-query-relative — must stay component-level |

---

## Token Naming Convention (Tailwind 4 Compatible)

All proposed tokens follow the `--{category}-{modifier}` pattern:

| Category | Pattern | Examples |
|----------|---------|----------|
| Color | `--color-{name}` | `--color-overlay`, `--color-overlay-light` |
| Spacing | `--spacing-{size}` | `--spacing-xs` through `--spacing-2xl` |
| Radius | `--radius-{size}` | `--radius-sm` through `--radius-circle` |
| Shadow | `--shadow-{size}` | `--shadow-sm` through `--shadow-xl` |
| Font | `--font-{family}` | `--font-body`, `--font-mono` |
| Font weight | `--font-weight-{name}` | `--font-weight-bold`, `--font-weight-medium` |
| Line height | `--line-height-{name}` | `--line-height-tight`, `--line-height-normal` |
| Border | `--border-width-{name}` | `--border-width`, `--border-width-thick` |
| Duration | `--duration-{speed}` | `--duration-fast` through `--duration-slowest` |
| Easing | `--ease-{name}` | `--ease-default`, `--ease-in-out` |
| Blur | `--blur-{size}` | `--blur-sm`, `--blur-md`, `--blur-lg` |
| Z-index | `--z-index-{name}` | `--z-index-raised`, `--z-index-overlay` |
| Opacity | `--opacity-{name}` | `--opacity-disabled` |

---

## Components With Most Hardcoded Values (refactor priority)

| Component | Hardcoded Count | Key Issues |
|-----------|----------------|------------|
| chronology | 15+ | font-size, font-weight, line-height, gap, color |
| dock | 12+ | shadow, blur, spacing, color |
| menu / menu-details | 12+ | duration, gap, color, shadow |
| calculator | 12+ | font-size, font-weight, radius, gap, color |
| periodic-table | 12+ | font-size, font-weight, gap, 10 hex colors |
| reaction | 12+ | font-size, padding, duration, radius, scale |
| progress-meter | 10+ | font-size, radius, padding, color |
| slideshow | 10+ | font-size, font-weight, opacity, color |
| video-list | 12+ | duration, opacity, color, blur |
| blockquote | 10+ | font-size, line-height, padding, margin |
| syntax | 10+ | padding, font-weight, radius, 3 hex colors |
| cinema / flight | 10+ each | font-size, radius, border-width, opacity |
