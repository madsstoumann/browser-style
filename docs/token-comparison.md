# Design Token Naming Comparison

> browser.style v4 vs Tailwind CSS v4 vs Open Props v2

---

## Colors

| Purpose | browser.style | Tailwind v4 | Open Props |
|---------|--------------|-------------|------------|
| Primary/accent | `--color-accent` | `--color-blue-500` (palette) | `--blue-6` |
| Surface/background | `--color-surface` | `--color-white` / `--color-gray-50` | `--surface-1` |
| Alt surface | `--color-surface-alt` | `--color-gray-100` | `--surface-2` |
| Text | `--color-text` | `--color-gray-950` | `--text-1` |
| Muted text | `--color-text-muted` | `--color-gray-500` | `--text-2` |
| Border | `--color-border` | `--color-gray-200` | `--surface-3` |
| Field/input bg | `--color-field` | *(none)* | *(none)* |
| Link | `--color-link` | *(none)* | `--link` |
| Info | `--color-info` | `--color-blue-600` | `--blue-7` |
| Error | `--color-error` | `--color-red-600` | `--red-7` |
| Success | `--color-success` | `--color-green-600` | `--green-7` |
| Warning | `--color-warning` | `--color-orange-500` | `--orange-6` |
| Overlay | `--color-overlay` | *(none)* | *(none)* |
| Overlay light | `--color-overlay-light` | *(none)* | *(none)* |

**Approach:** browser.style uses semantic names. Tailwind uses numeric hue palettes (`--color-{hue}-{50-950}`). Open Props uses short hue scales (`--{hue}-{0-12}`) plus semantic aliases (`--surface-*`, `--text-*`).

---

## Font Family

| Purpose | browser.style | Tailwind v4 | Open Props |
|---------|--------------|-------------|------------|
| Body/sans | `--font-body` | `--font-sans` | `--font-sans` |
| Form | `--font-form` | *(none)* | *(none)* |
| Heading | `--font-heading` | *(none)* | *(none)* |
| Monospace | `--font-mono` | `--font-mono` | `--font-mono` |
| Serif | `--font-serif` | `--font-serif` | `--font-serif` |

---

## Font Size

| Step | browser.style | Tailwind v4 | Open Props |
|------|--------------|-------------|------------|
| Extra small | `--font-size-xs` (0.75rem) | `--font-size-xs` (0.75rem) | `--font-size-0` (0.75rem) |
| Small | `--font-size-sm` (0.875rem) | `--font-size-sm` (0.875rem) | `--font-size-1` (1rem) |
| Base | `--font-size-base` (1rem) | `--font-size-base` (1rem) | `--font-size-2` (1.1rem) |
| Large | `--font-size-lg` (1.125rem) | `--font-size-lg` (1.125rem) | `--font-size-3` (1.25rem) |
| XL | `--font-size-xl` (1.25rem) | `--font-size-xl` (1.25rem) | `--font-size-4` (1.5rem) |
| 2XL | `--font-size-2xl` (1.5rem) | `--font-size-2xl` (1.5rem) | `--font-size-5` (2rem) |
| 3XL | `--font-size-3xl` (1.875rem) | `--font-size-3xl` (1.875rem) | `--font-size-6` (2.5rem) |
| 4XL | `--font-size-4xl` (2.25rem) | `--font-size-4xl` (2.25rem) | `--font-size-7` (3.5rem) |
| 5XL | `--font-size-5xl` (3rem) | `--font-size-5xl` (3rem) | `--font-size-8` (6rem) |
| 6XL | `--font-size-6xl` (3.75rem) | `--font-size-6xl` (3.75rem) | *(none)* |
| 7XL | `--font-size-7xl` (4.5rem) | `--font-size-7xl` (4.5rem) | *(none)* |
| 8XL | `--font-size-8xl` (6rem) | `--font-size-8xl` (6rem) | *(none)* |
| 9XL | `--font-size-9xl` (8rem) | `--font-size-9xl` (8rem) | *(none)* |

**Note:** browser.style names and values are identical to Tailwind v4 across the full 13-step scale. Open Props uses numeric keys and stops at step 8.

---

## Font Weight

| Weight | browser.style | Tailwind v4 | Open Props |
|--------|--------------|-------------|------------|
| 100 | `--font-weight-thin` | `--font-weight-thin` | `--font-weight-1` |
| 200 | *(none)* | `--font-weight-extralight` | `--font-weight-2` |
| 300 | `--font-weight-light` | `--font-weight-light` | `--font-weight-3` |
| 400 | `--font-weight-normal` | `--font-weight-normal` | `--font-weight-4` |
| 500 | `--font-weight-medium` | `--font-weight-medium` | `--font-weight-5` |
| 600 | `--font-weight-semibold` | `--font-weight-semibold` | `--font-weight-6` |
| 700 | `--font-weight-bold` | `--font-weight-bold` | `--font-weight-7` |
| 800 | *(none)* | `--font-weight-extrabold` | `--font-weight-8` |
| 900 | `--font-weight-black` | `--font-weight-black` | `--font-weight-9` |

**Note:** browser.style skips 200 and 800 (not used in any component). Naming matches Tailwind exactly.

---

## Line Height

| Purpose | browser.style | Tailwind v4 | Open Props |
|---------|--------------|-------------|------------|
| None | `--line-height-none` (1) | `--leading-none` (1) | `--font-lineheight-00` (0.95) |
| Tight | `--line-height-tight` (1.1) | `--leading-tight` (1.25) | `--font-lineheight-0` (1.1) |
| Snug | `--line-height-snug` (1.25) | `--leading-snug` (1.375) | `--font-lineheight-1` (1.25) |
| Normal | `--line-height-normal` (1.5) | `--leading-normal` (1.5) | `--font-lineheight-3` (1.5) |
| Relaxed | `--line-height-relaxed` (1.625) | `--leading-relaxed` (1.625) | `--font-lineheight-4` (1.7) |
| Loose | `--line-height-loose` (2) | `--leading-loose` (2) | `--font-lineheight-5` (2) |

**Note:** Tailwind uses `--leading-*`, Open Props uses `--font-lineheight-*`. browser.style uses `--line-height-*` for clarity. Values match Tailwind.

---

## Letter Spacing

| Purpose | browser.style | Tailwind v4 | Open Props |
|---------|--------------|-------------|------------|
| Tighter | `--tracking-tighter` (-0.05em) | `--tracking-tighter` (-0.05em) | `--font-letterspacing-0` (-0.05em) |
| Tight | `--tracking-tight` (-0.025em) | `--tracking-tight` (-0.025em) | `--font-letterspacing-1` (0.025em) |
| Normal | `--tracking-normal` (0em) | `--tracking-normal` (0em) | *(none)* |
| Wide | `--tracking-wide` (0.025em) | `--tracking-wide` (0.025em) | `--font-letterspacing-2` (0.05em) |
| Wider | `--tracking-wider` (0.05em) | `--tracking-wider` (0.05em) | `--font-letterspacing-3` (0.075em) |
| Widest | `--tracking-widest` (0.1em) | `--tracking-widest` (0.1em) | `--font-letterspacing-7` (0.15em) |

**Note:** browser.style follows Tailwind naming and values exactly. Uses `--tracking-*` rather than `--letter-spacing-*` for brevity (Tailwind convention).

---

## Spacing

| Step | browser.style | Tailwind v4 | Open Props |
|------|--------------|-------------|------------|
| 0.25rem | `--spacing-xs` | `--spacing-1` | `--size-1` |
| 0.5rem | `--spacing-sm` | `--spacing-2` | `--size-2` |
| 1rem | `--spacing-md` | `--spacing-4` | `--size-3` |
| 1.5rem | `--spacing-lg` | `--spacing-6` | `--size-5` |
| 2rem | `--spacing-xl` | `--spacing-8` | `--size-6` |
| 3rem | `--spacing-2xl` | `--spacing-12` | `--size-8` |

**Note:** Tailwind uses a numeric scale (1-96 in 0.25rem steps). Open Props uses `--size-*` (1-15). browser.style uses named t-shirt sizes (fewer steps, simpler).

---

## Border Width

| Purpose | browser.style | Tailwind v4 | Open Props |
|---------|--------------|-------------|------------|
| Default | `--border-width` (1px) | `--border` (1px) | `--border-size-1` (1px) |
| Thick | `--border-width-thick` (2px) | `--border-2` (2px) | `--border-size-2` (2px) |
| Heavy | `--border-width-heavy` (3px) | `--border-4` (4px) | `--border-size-3` (5px) |

---

## Border Radius

| Step | browser.style | Tailwind v4 | Open Props |
|------|--------------|-------------|------------|
| 0.125rem | `--radius-xs` | `--radius-xs` (0.125rem) | `--radius-1` (2px) |
| 0.25rem | `--radius-sm` | `--radius-sm` (0.25rem) | `--radius-2` (5px) |
| 0.375rem | `--radius-md` | `--radius-md` (0.375rem) | *(none)* |
| 0.5rem | `--radius-lg` | `--radius-lg` (0.5rem) | `--radius-3` (1rem) |
| 0.75rem | `--radius-xl` | `--radius-xl` (0.75rem) | *(none)* |
| 1rem | `--radius-2xl` | `--radius-2xl` (1rem) | `--radius-4` (2rem) |
| 1.5rem | `--radius-3xl` | `--radius-3xl` (1.5rem) | `--radius-5` (4rem) |
| 2rem | `--radius-4xl` | `--radius-4xl` (2rem) | `--radius-6` (8rem) |
| 50% | `--radius-circle` | *(use --radius-full)* | `--radius-round` |
| pill | `--radius-pill` | `--radius-full` (9999px) | `--radius-round` |

**Note:** browser.style separates `--radius-circle` (50%) from `--radius-pill` (infinity). Tailwind collapses both into `--radius-full`. Open Props uses `--radius-round`.

---

## Shadows

| Step | browser.style | Tailwind v4 | Open Props |
|------|--------------|-------------|------------|
| Small | `--shadow-sm` | `--shadow-sm` | `--shadow-1` |
| Medium | `--shadow-md` | `--shadow-md` | `--shadow-2` |
| Large | `--shadow-lg` | `--shadow-lg` | `--shadow-3` |
| XL | `--shadow-xl` | `--shadow-xl` | `--shadow-4` |
| *(none)* | | `--shadow-2xl` | `--shadow-5`, `--shadow-6` |

---

## Transition Duration

| Purpose | browser.style | Tailwind v4 | Open Props |
|---------|--------------|-------------|------------|
| Fast | `--duration-fast` (100ms) | `--duration-100` | *(none — uses animation props)* |
| Normal | `--duration-normal` (200ms) | `--duration-200` | *(none)* |
| Slow | `--duration-slow` (300ms) | `--duration-300` | *(none)* |
| Slower | `--duration-slower` (400ms) | `--duration-500` | *(none)* |

**Note:** Tailwind uses numeric ms values as names. Open Props bundles duration into animation shorthand props.

---

## Easing

| Purpose | browser.style | Tailwind v4 | Open Props |
|---------|--------------|-------------|------------|
| Default | `--ease-default` | `--ease-in-out` | `--ease-3` |
| In | `--ease-in` | `--ease-in` | `--ease-in-3` |
| Out | `--ease-out` | `--ease-out` | `--ease-out-3` |
| In-out | `--ease-in-out` | `--ease-in-out` | `--ease-in-out-3` |

**Note:** Open Props provides 5 intensity levels per direction (e.g. `--ease-in-1` through `--ease-in-5`). browser.style and Tailwind provide one curve per direction.

---

## Blur

| Step | browser.style | Tailwind v4 | Open Props |
|------|--------------|-------------|------------|
| Small | `--blur-sm` (4px) | `--blur-sm` (4px) | *(none)* |
| Medium | `--blur-md` (12px) | `--blur-md` (12px) | *(none)* |
| Large | `--blur-lg` (24px) | `--blur-lg` (24px) | *(none)* |

**Note:** Tailwind also has `--blur-xs`, `--blur-xl`, `--blur-2xl`, `--blur-3xl`. Open Props does not provide blur tokens.

---

## Z-Index

| Step | browser.style | Tailwind v4 | Open Props |
|------|--------------|-------------|------------|
| 1 | `--z-index-1` (1) | `--z-10` (10) | `--layer-1` (1) |
| 2 | `--z-index-2` (10) | `--z-20` (20) | `--layer-2` (2) |
| 3 | `--z-index-3` (100) | `--z-30` (30) | `--layer-3` (3) |
| 4 | `--z-index-4` (500) | `--z-40` (40) | `--layer-4` (4) |
| 5 | `--z-index-5` (1000) | `--z-50` (50) | `--layer-5` (5) |

**Note:** All three use a 5-step numeric scale. browser.style uses real-world stacking values (1, 10, 100, 500, 1000) that leave gaps for component-level z-indexes in between. Open Props uses 1-5 literally. Tailwind uses 10-50.

---

## Opacity

| Purpose | browser.style | Tailwind v4 | Open Props |
|---------|--------------|-------------|------------|
| Disabled | `--opacity-disabled` (0.5) | `--opacity-50` (0.5) | *(none)* |

**Note:** Tailwind provides a full 0-100 scale in steps of 5. browser.style only provides the one semantically meaningful value.

---

## Categories Not in browser.style

| Category | Tailwind v4 | Open Props | browser.style rationale |
|----------|-------------|------------|------------------------|
| Color palettes (50-950) | `--color-{hue}-{shade}` | `--{hue}-{0-12}` | Semantic-only by design — theming via overrides, not palettes |
| Aspect ratio | `--aspect-*` (utility) | `--ratio-square`, `--ratio-landscape` | Not needed — CSS `aspect-ratio` property suffices |
| Named animations | `--animate-*` | `--animation-fade-in`, etc. | Component-level — no shared animation tokens |
| Container/breakpoints | `--breakpoint-sm` etc. | *(none)* | Not tokenizable as CSS custom properties for `@media` |
| Ring/outline width | `--ring-*` | *(none)* | Could add later — only 5 components use ring patterns |
