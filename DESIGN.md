# Design System

## Overview

**browser.style** is a CSS-first component library that embraces native browser capabilities. The visual language is neutral by design — no strong brand color bias, no opinionated aesthetic. Components should feel like natural extensions of the browser's default UI, enhanced with consistent spacing, typography, and subtle depth.

Light and dark modes are supported natively via `light-dark()` and `color-scheme: light dark`. All tokens adapt automatically.

### Guiding principles

- CSS-first: leverage custom properties, cascade layers, and container queries
- Progressive enhancement: components work without JavaScript
- Neutral palette: achromatic base with a single accent hue (blue)
- Readable defaults: generous line-height, comfortable measure (65ch–85ch)

### Token source of truth

All design tokens are defined as CSS custom properties in [`ui/base/core.css`](ui/base/core.css) inside `@layer bs-core`.

---

## Colors

Semantic color roles using `light-dark()` for automatic light/dark adaptation.

### Core palette

- **Accent** (`--color-accent`): `light-dark(hsl(211, 100%, 50%), hsl(211, 60%, 50%))` — Primary actions, active states, focus rings, links
- **Accent Dark** (`--color-accent-dark`): `light-dark(hsl(211, 80%, 30%), hsl(211, 30%, 20%))` — Darker accent for hover states
- **Accent Text** (`--color-accent-text`): `hsl(211, 100%, 95%)` — Text on accent backgrounds

### Surfaces

- **Surface** (`--color-surface`): `light-dark(hsl(0, 0%, 100%), hsl(0, 0%, 0%))` — Page backgrounds, card backgrounds
- **Surface Alt** (`--color-surface-alt`): `light-dark(hsl(0, 0%, 95%), hsl(0, 0%, 15%))` — Alternate/raised surfaces
- **Field** (`--color-field`): `light-dark(hsl(0, 0%, 97.5%), hsl(0, 0%, 2.5%))` — Form field backgrounds, hover highlights

### Text

- **Text** (`--color-text`): `light-dark(hsl(0, 0%, 15%), hsl(0, 0%, 85%))` — Primary body text
- **Text Muted** (`--color-text-muted`): `light-dark(hsl(0, 0%, 60%), hsl(0, 0%, 40%))` — Secondary text, captions, placeholders
- **Link** (`--color-link`): `light-dark(hsl(221, 100%, 73%), hsl(221, 70%, 70%))` — Hyperlinks
- **Link Visited** (`--color-link-visited`): `light-dark(hsl(264, 33%, 61%), hsl(264, 25%, 70%))` — Visited links

### UI chrome

- **Border** (`--color-border`): `light-dark(hsl(0, 0%, 80%), hsl(0, 0%, 20%))` — Borders, dividers, separators
- **Button** (`--color-button`): `light-dark(hsl(0, 0%, 90%), hsl(0, 0%, 40%))` — Button backgrounds
- **Button Text** (`--color-button-text`): `light-dark(hsl(0, 0%, 40%), hsl(0, 0%, 60%))` — Button label text
- **Highlight** (`--color-highlight`): `light-dark(hsl(211, 100%, 95%), hsl(211, 30%, 20%))` — Selection highlights
- **Mark** (`--color-mark`): `light-dark(hsl(61, 100%, 80%), hsl(61, 50%, 80%))` — `<mark>` highlight background
- **Mark Text** (`--color-mark-text`): `light-dark(hsl(60, 100%, 2%), hsl(60, 50%, 10%))` — Text on mark backgrounds

### Status

- **Info** (`--color-info`): `light-dark(hsl(210, 60%, 46%), hsl(210, 30%, 46%))` — Informational messages
- **Error** (`--color-error`): `light-dark(hsl(360, 60%, 46%), hsl(360, 40%, 56%))` — Errors, destructive actions
- **Success** (`--color-success`): `light-dark(hsl(136, 41%, 41%), hsl(136, 21%, 51%))` — Success confirmations
- **Warning** (`--color-warning`): `light-dark(hsl(33, 99%, 59%), hsl(33, 69%, 59%))` — Warnings, caution states

### Overlays

- **Overlay** (`--color-overlay`): `color-mix(in srgb, CanvasText, transparent 50%)` — Modal backdrops, scrim
- **Overlay Light** (`--color-overlay-light`): `color-mix(in srgb, CanvasText 25%, transparent)` — Subtle overlays

---

## Typography

### Font families

- **Body** (`--font-body`): `Avenir, Montserrat, Corbel, 'URW Gothic', source-sans-pro, sans-serif` — All body text
- **Headings** (`--font-heading`): `inherit` — Headings inherit body font by default; override per-project
- **Forms** (`--font-form`): `ui-sans-serif, system-ui` — Form controls use the system font
- **Monospace** (`--font-mono`): `ui-monospace, 'Cascadia Code', 'Source Code Pro', Menlo, Consolas, 'DejaVu Sans Mono', monospace` — Code blocks, pre, kbd
- **Serif** (`--font-serif`): `'Iowan Old Style', 'Palatino Linotype', 'URW Palladio L', P052, serif` — Available for editorial/article use

### Type scale (fixed)

| Token | Size | Typical use |
|-------|------|-------------|
| `--font-size-xs` | 0.75rem (12px) | Fine print, badges |
| `--font-size-sm` | 0.875rem (14px) | Captions, labels, meta text |
| `--font-size-base` | 1rem (16px) | Body text |
| `--font-size-lg` | 1.125rem (18px) | Lead paragraphs |
| `--font-size-xl` | 1.25rem (20px) | Section subheadings |
| `--font-size-2xl` | 1.5rem (24px) | H4-level headings |
| `--font-size-3xl` | 1.875rem (30px) | H3-level headings |
| `--font-size-4xl` | 2.25rem (36px) | H2-level headings |
| `--font-size-5xl` | 3rem (48px) | H1-level headings |
| `--font-size-6xl` | 3.75rem (60px) | Hero headings |
| `--font-size-7xl` | 4.5rem (72px) | Display text |
| `--font-size-8xl` | 6rem (96px) | Large display |
| `--font-size-9xl` | 8rem (128px) | Oversized display |

### Type scale (fluid)

Responsive sizes using `clamp()` — no breakpoints needed:

| Token | Range | Use |
|-------|-------|-----|
| `--font-size-fluid-xs` | 0.75rem → 0.875rem | Responsive fine print |
| `--font-size-fluid-sm` | 0.875rem → 1rem | Responsive captions |
| `--font-size-fluid-base` | 1rem → 1.25rem | Responsive body |
| `--font-size-fluid-lg` | 1.125rem → 1.5rem | Responsive lead text |
| `--font-size-fluid-xl` | 1.25rem → 1.875rem | Responsive subheadings |
| `--font-size-fluid-2xl` | 1.5rem → 2.25rem | Responsive section headings |
| `--font-size-fluid-3xl` | 1.875rem → 3rem | Responsive page headings |
| `--font-size-fluid-4xl` | 2.25rem → 3.75rem | Responsive hero headings |

### Font weights

| Token | Value | Use |
|-------|-------|-----|
| `--font-weight-thin` | 100 | Decorative, display only |
| `--font-weight-light` | 300 | Light emphasis |
| `--font-weight-normal` | 400 | Body text default |
| `--font-weight-medium` | 500 | Summaries, labels, UI emphasis |
| `--font-weight-semibold` | 600 | Subheadings, strong labels |
| `--font-weight-bold` | 700 | Headings, strong emphasis |
| `--font-weight-black` | 900 | Display, impact text |

### Line height

| Token | Value | Use |
|-------|-------|-----|
| `--line-height-none` | 1 | Single-line UI elements |
| `--line-height-tight` | 1.1 | Large headings |
| `--line-height-snug` | 1.25 | Subheadings, compact text |
| `--line-height-normal` | 1.5 | Body text (default) |
| `--line-height-relaxed` | 1.625 | Long-form reading |
| `--line-height-loose` | 2 | Spacious, accessibility-focused |

### Letter spacing

| Token | Value | Use |
|-------|-------|-----|
| `--tracking-tighter` | -0.05em | Large display text |
| `--tracking-tight` | -0.025em | Headings |
| `--tracking-normal` | 0em | Body text |
| `--tracking-wide` | 0.025em | Small caps, labels |
| `--tracking-wider` | 0.05em | Uppercase text |
| `--tracking-widest` | 0.1em | Sparse letter spacing |

---

## Spacing

A 6-step scale based on `rem` units:

| Token | Value | Use |
|-------|-------|-----|
| `--spacing-xs` | 0.25rem (4px) | Tight gaps, icon padding |
| `--spacing-sm` | 0.5rem (8px) | Compact element spacing |
| `--spacing-md` | 1rem (16px) | Default gap, standard padding |
| `--spacing-lg` | 1.5rem (24px) | Section padding |
| `--spacing-xl` | 2rem (32px) | Large section gaps |
| `--spacing-2xl` | 3rem (48px) | Page-level separation |

---

## Border

### Width

| Token | Value | Use |
|-------|-------|-----|
| `--border-width` | 1px | Default borders, dividers |
| `--border-width-thick` | 2px | Emphasis borders, active states |
| `--border-width-heavy` | 3px | Strong visual weight |

### Radius

| Token | Value | Use |
|-------|-------|-----|
| `--radius-xs` | 0.125rem (2px) | Subtle rounding |
| `--radius-sm` | 0.25rem (4px) | Inputs, small elements |
| `--radius-md` | 0.375rem (6px) | Buttons, badges |
| `--radius-lg` | 0.5rem (8px) | Cards, containers |
| `--radius-xl` | 0.75rem (12px) | Modals, large cards |
| `--radius-2xl` | 1rem (16px) | Prominent rounding |
| `--radius-3xl` | 1.5rem (24px) | Pills, tags |
| `--radius-4xl` | 2rem (32px) | Oversized rounding |
| `--radius-circle` | 50% | Avatars, circular elements |
| `--radius-pill` | calc(infinity * 1px) | Fully rounded pill shape |

---

## Shadows

| Token | Value | Use |
|-------|-------|-----|
| `--shadow-sm` | `0 1px 2px 0 rgb(0 0 0 / 0.05)` | Subtle lift, cards at rest |
| `--shadow-md` | `0 4px 6px -1px rgb(0 0 0 / 0.1)` | Hover state, dropdowns |
| `--shadow-lg` | `0 10px 15px -3px rgb(0 0 0 / 0.1)` | Modals, popovers |
| `--shadow-xl` | `0 20px 25px -5px rgb(0 0 0 / 0.1)` | High-prominence overlays |

---

## Motion

### Duration

| Token | Value | Use |
|-------|-------|-----|
| `--duration-fast` | 100ms | Micro-interactions, hover color changes |
| `--duration-normal` | 200ms | Standard transitions |
| `--duration-slow` | 300ms | Expand/collapse, accordion open |
| `--duration-slower` | 400ms | Complex animations, page transitions |

### Easing

| Token | Value | Use |
|-------|-------|-----|
| `--ease-default` | `cubic-bezier(0.4, 0, 0.2, 1)` | General purpose |
| `--ease-in` | `cubic-bezier(0.4, 0, 1, 1)` | Elements entering view |
| `--ease-out` | `cubic-bezier(0, 0, 0.2, 1)` | Elements leaving view |
| `--ease-in-out` | `cubic-bezier(0.4, 0, 0.2, 1)` | Symmetric transitions |

---

## Effects

### Blur

| Token | Value | Use |
|-------|-------|-----|
| `--blur-sm` | 4px | Subtle backdrop blur |
| `--blur-md` | 12px | Standard backdrop blur, glass effects |
| `--blur-lg` | 24px | Heavy blur, frosted glass |

### Opacity

| Token | Value | Use |
|-------|-------|-----|
| `--opacity-disabled` | 0.5 | Disabled elements |

### Z-index

| Token | Value | Use |
|-------|-------|-----|
| `--z-index-1` | 1 | Slightly above siblings |
| `--z-index-2` | 10 | Sticky headers, floating elements |
| `--z-index-3` | 100 | Dropdowns, popovers |
| `--z-index-4` | 500 | Modals, overlays |
| `--z-index-5` | 1000 | Toasts, top-level notifications |

---

## Focus ring

Interactive elements use a consistent focus ring:

| Token | Value | Use |
|-------|-------|-----|
| `--ring-width` | 2px | Focus outline width |
| `--ring-offset` | 3px | Gap between element and ring |
| `--ring-color` | `var(--color-accent)` | Ring color (matches accent) |

---

## Content widths

Maximum widths for content containers:

| Token | Value | Use |
|-------|-------|-----|
| `--width-xs` | 20rem (320px) | Narrow widgets, sidebars |
| `--width-sm` | 24rem (384px) | Small cards, compact layouts |
| `--width-md` | 28rem (448px) | Medium cards |
| `--width-lg` | 32rem (512px) | Standard cards, dialogs |
| `--width-xl` | 36rem (576px) | Wide cards |
| `--width-2xl` | 42rem (672px) | Content columns |
| `--width-3xl` | 48rem (768px) | Article width |
| `--width-4xl` | 56rem (896px) | Wide content |
| `--width-5xl` | 64rem (1024px) | Dashboard panels |
| `--width-6xl` | 72rem (1152px) | Wide layouts |
| `--width-7xl` | 80rem (1280px) | Full-width content |
| `--width-prose` | 65ch | Optimal reading width |

---

## Component patterns

### Selectors

Components use `:where()` for zero specificity and target custom elements directly:

```css
:where(ui-accordion) { /* base styles */ }
```

### Variants

Use the `variant` attribute with space-separated values — not CSS classes:

```html
<ui-accordion variant="bordered rounded">
```

### Semantic color attributes

Use `color` for status semantics (info, success, warning, error):

```html
<ui-badge color="success">Active</ui-badge>
```

### Three-tier token fallback

Every component token chains to a global token with a hardcoded fallback, so components work standalone:

```css
--ui-card-bg: var(--color-surface, hsl(0, 0%, 100%));
```

---

## Do's and Don'ts

- Do use semantic token names (`--color-border`) not raw values (`hsl(0,0%,80%)`) in component CSS
- Do provide hardcoded fallbacks in every component token so it works without `core.css`
- Do use `light-dark()` for any color that should adapt to dark mode
- Do keep body text at `--line-height-normal` (1.5) for readability
- Don't tokenize `ch` units — they are already content-relative by design
- Don't tokenize CSS keywords like `smaller`, `larger` — they are already semantic
- Don't tokenize animation endpoints (`opacity: 0`, `opacity: 1`)
- Don't use Shadow DOM for new components — light DOM for framework compatibility
- Don't mix rounded and sharp corners within the same component variant
- Don't use PascalCase token names in new code — legacy aliases exist but are deprecated
