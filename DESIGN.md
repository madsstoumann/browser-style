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

All design tokens are defined as CSS custom properties in [`ui/base/tokens.css`](ui/base/tokens.css) inside `@layer bs-core`. Since `@browser.style/base` is a required peer dependency for all components, global tokens are always available — no hardcoded fallbacks are needed when referencing them.

---

## Colors

Semantic color roles using `light-dark()` for automatic light/dark adaptation.

### Core palette

- **Accent** (`--color-accent`): `light-dark(hsl(211, 100%, 38%), hsl(211, 60%, 50%))` — Primary actions, active states, focus rings, links. This is the **plate** arm: it fills accent buttons, checkboxes and `theme="accent"` surfaces
- **Accent Dark** (`--color-accent-dark`): `light-dark(hsl(211, 80%, 30%), hsl(211, 30%, 20%))` — Darker accent for hover states
- **Accent Ink** (`--color-accent-ink`): the accent hue **as text**, derived from `--color-accent` with its OKLCH lightness clamped to the readable side of the current `color-scheme` (`min(l, 0.55)` light / `max(l, 0.78)` dark). Card eyebrows and the `eb|tx|mt|hl(accent)` tones read this, so accent text clears AA on a dark card plate as well as on the page surface. Not to be confused with `--color-accent-text`, which is the ink **on** an accent plate
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

- **Border** (`--color-border`): `light-dark(hsl(0, 0%, 80%), hsl(0, 0%, 35%))` — Borders, dividers, separators (dark arm stays ≥35% so borders remain visible on dark card plates)
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

## Theme bundles — the `theme=` axis

A shared, cross-component color axis: nine named bundles, each a surface (`--ui-theme-{name}-bg`) plus a paired ink (`--ui-theme-{name}-c`). Bundles live in `ui/base/tokens.css`; the resolver and modifiers live in `ui/base/theme.css`. Full documentation: `ui/base/theme.md`.

The vocabulary is **concrete color names** (red, slate…), not semantic words — deliberately distinct from button's semantic `.bg-*` / `color=` axis.

| Bundle | Surface (`-bg`) | Ink (`-c`) |
|--------|-----------------|------------|
| `--ui-theme-red-*` | `var(--color-error)` | `hsl(0 0% 100%)` |
| `--ui-theme-orange-*` | `var(--color-warning)` | `var(--color-text)` |
| `--ui-theme-green-*` | `var(--color-success)` | `hsl(0 0% 100%)` |
| `--ui-theme-blue-*` | `var(--color-info)` | `hsl(0 0% 100%)` |
| `--ui-theme-accent-*` | `var(--color-accent)` | `var(--color-accent-text)` |
| `--ui-theme-white-*` | `light-dark(hsl(0 0% 100%), hsl(0 0% 90%))` | `light-dark(hsl(0 0% 15%), hsl(0 0% 10%))` |
| `--ui-theme-gray-*` | `light-dark(hsl(0 0% 93%), hsl(0 0% 84%))` | `light-dark(hsl(0 0% 15%), hsl(0 0% 10%))` |
| `--ui-theme-slate-*` | `var(--ui-card-muted-bg, light-dark(hsl(215 19% 27%), hsl(215 16% 38%)))` | `light-dark(hsl(0 0% 96%), hsl(0 0% 88%))` |
| `--ui-theme-black-*` | `var(--ui-card-dark-bg, light-dark(hsl(215 28% 17%), hsl(215 22% 27%)))` | `light-dark(hsl(0 0% 96%), hsl(0 0% 88%))` |

The neutrals form a light→dark ramp (`white` < `gray` < `slate` < `black`) and stay true to their names in both schemes — a `white` theme is still a light surface in dark mode; the `light-dark()` pair only softens the shade.

### Attribute convention

`theme=` is a space-separated token list: exactly one color token plus any number of modifiers. Use `theme=` on custom elements and `data-theme=` on native elements (a bare `theme` attribute is invalid HTML on built-ins) — every resolver rule in `theme.css` is a pair, so both spellings resolve identically:

```html
<ui-card theme="black dark">…</ui-card>
<ui-chip theme="red pale">soft</ui-chip>
<section data-theme="slate glass">…</section>
```

`data-box` is the geometry companion for native nodes — padding (`--ui-box-p`) and corners (`--ui-box-radius`) on the element carrying `data-theme` (`ui/base/theme.md` § Box).

### Modifiers

- **`pale`** — tinted surface: `color-mix` of the color with `--color-surface` (80%), ink becomes the color itself. The pastel version.
- **`muted`** — fades surface and ink via `color-mix(… transparent 50%)`. Alpha only — no element `opacity`, so descendant content is not dimmed. Composes with `pale`: `theme="green pale muted"`.
- **`ink`** — applies the paired text color (themes set only the background by default).
- **`light` / `dark`** — set `color-scheme`, picking the `light-dark()` arm and re-toning descendants.
- **`border`** — outline in the solid base color, transparent fill; `border(<side>)` / `border(sm…2xl)` / `border(dashed|dotted|double)` variants.
- **`glass`** — translucent material with backdrop blur + saturation, configured by `--ui-theme-glass-bg`, `--ui-theme-glass-edge`, `--ui-theme-glass-fade` (62%), `--ui-theme-glass-blur` (`var(--blur-md)`), `--ui-theme-glass-saturate` (180%).

### Gotcha: bundles resolve at `:root`

The five color-hue bundles reference `--color-*` tokens **and are declared at `:root`** — the `var()` substitution happens there, so descendants inherit the already-resolved color, not the reference. A page skin that sets a brand `--color-accent` on `body` will therefore **not** change `theme="accent"` surfaces. Either set the brand color on `:root` itself, or re-declare the bundle alongside the skin:

```css
body {
	--color-accent: light-dark(#4f46e5, #6366f1);
	--ui-theme-accent-bg: var(--color-accent); /* re-resolve against body's value */
}
```

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
| `--font-size-3xs` | 0.5rem (8px) | Micro labels, dense data displays |
| `--font-size-2xs` | 0.625rem (10px) | Tags, eyebrows, tiny meta text |
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

## Sizes

A 15-step scale for **element dimensions** — icon boxes, avatars, rating stars, clock faces. Distinct from `--spacing-*` (gaps, padding) and `--width-*` (content container max-widths):

| Token | Value | Use |
|-------|-------|-----|
| `--size-1` | 0.25rem (4px) | Dots, hairline indicators |
| `--size-2` | 0.5rem (8px) | Small dots, beacon markers |
| `--size-3` | 1rem (16px) | Small icons, badge dots |
| `--size-4` | 1.25rem (20px) | Compact icons |
| `--size-5` | 1.5rem (24px) | Default icon size, badges, small ratings |
| `--size-6` | 1.75rem (28px) | Medium icons |
| `--size-7` | 2rem (32px) | Large icons, small avatars |
| `--size-8` | 3rem (48px) | Touch targets, medium avatars |
| `--size-9` | 4rem (64px) | Large avatars, small widgets |
| `--size-10` | 5rem (80px) | XL avatars |
| `--size-11` | 7.5rem (120px) | 2XL avatars, medium widgets |
| `--size-12` | 10rem (160px) | Thumbnails |
| `--size-13` | 15rem (240px) | Large widgets (e.g. clock faces) |
| `--size-14` | 20rem (320px) | Small panels |
| `--size-15` | 30rem (480px) | Large panels |

Numeric keys (not t-shirt sizes) because this is a dimension ramp, not a semantic scale — components map their own `size="sm|md|lg"` attributes onto steps of it (e.g. `ui-avatar[size="md"]` → `--size-8`).

---

## Border

### Width

| Token | Value | Use |
|-------|-------|-----|
| `--border-width` | 1px | Default borders, dividers |
| `--border-width-thick` | 2px | Emphasis borders, active states |
| `--border-width-heavy` | 3px | Strong visual weight |
| `--border-width-xl` | 4px | Theme `border(xl)` modifier |
| `--border-width-2xl` | 6px | Theme `border(2xl)` modifier |

The `xl`/`2xl` steps extend the scale for the theme axis' `border(<size>)` modifier — its `sm`/`md`/`lg` steps reuse `--border-width` / `-thick` / `-heavy`.

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

### Squircle corners

Squircles pair a **bespoke radius** with a **superellipse exponent** — the radius values are deliberately larger than the `--radius-*` scale because `corner-shape: superellipse()` flattens the curve. Consumed as a pair by every `rds(*-sq)` variant (`ui-card variant=`, `ui-media media=`, `ui-content content=`):

| Radius token | Value | Exponent token | Value |
|--------------|-------|----------------|-------|
| `--radius-sm-sq` | 1.25rem | `--squircle-sm` | 1.5 |
| `--radius-md-sq` | 2rem | `--squircle-md` | 1.7 |
| `--radius-lg-sq` | 2.8rem | `--squircle-lg` | 1.8 |
| `--radius-xl-sq` | 3.5rem | `--squircle-xl` | 2 |

```css
border-radius: var(--radius-md-sq);
corner-shape: superellipse(var(--squircle-md));
```

Browsers without `corner-shape` fall back gracefully to the plain rounded corner.

---

## Shadows

| Token | Value | Use |
|-------|-------|-----|
| `--shadow-sm` | `0 1px 2px 0 rgb(0 0 0 / 0.05)` | Subtle lift, cards at rest |
| `--shadow-md` | `0 4px 6px -1px rgb(0 0 0 / 0.1)` | Hover state, dropdowns |
| `--shadow-lg` | `0 10px 15px -3px rgb(0 0 0 / 0.1)` | Modals, popovers |
| `--shadow-xl` | `0 20px 25px -5px rgb(0 0 0 / 0.1)` | High-prominence overlays |
| `--shadow-2xl` | `0 1em 4em color-mix(in srgb, CanvasText 10%, transparent)` | Large soft ambient glow — em-based (scales with font size), CanvasText-based (adapts to color scheme) |

---

## Motion

### Duration

| Token | Value | Use |
|-------|-------|-----|
| `--duration-fast` | 100ms | Micro-interactions, hover color changes |
| `--duration-normal` | 200ms | Standard transitions |
| `--duration-slow` | 300ms | Expand/collapse, accordion open |
| `--duration-slower` | 500ms | Complex animations, page transitions |

### Easing

| Token | Value | Use |
|-------|-------|-----|
| `--ease-default` | `cubic-bezier(0.4, 0, 0.2, 1)` | General purpose |
| `--ease-in` | `cubic-bezier(0.4, 0, 1, 1)` | Elements entering view |
| `--ease-out` | `cubic-bezier(0, 0, 0.2, 1)` | Elements leaving view |
| `--ease-in-out` | `cubic-bezier(0.4, 0, 0.2, 1)` | Symmetric transitions |

### Stagger

Knobs for the shared stagger-reveal engine (`ui/base/stagger.css`) — direct children of a `stagger=` / `data-stagger=` host cascade in one after another. Per-child delay = `--stagger-begin + (index − 1) × --stagger-step`, where index defaults to `sibling-index()` and can be overridden per child via `stagger-index=` / `stagger-step=`:

| Token | Value | Use |
|-------|-------|-----|
| `--stagger-begin` | 0s | Delay before the first child starts |
| `--stagger-distance` | 5rem | Travel distance for the `rise`/`fall`/`lft`/`rgt` vectors |
| `--stagger-duration` | 0.75s | Per-child animation duration |
| `--stagger-easing` | `cubic-bezier(0.16, 1, 0.3, 1)` | Reveal curve (pronounced ease-out) |
| `--stagger-step` | 0.07s | Delay between consecutive children |

The `shimmer` stagger (a `background-clip: text` sweep rather than a box vector) has its own token set — notably its own step, paced off the sweep duration itself (1s sweeps 0.07s apart would all run at once):

| Token | Value |
|-------|-------|
| `--stagger-shimmer-angle` | 90deg |
| `--stagger-shimmer-sweep-angle` | 110deg |
| `--stagger-shimmer-color` | `var(--color-accent)` |
| `--stagger-shimmer-duration` | 1s |
| `--stagger-shimmer-ink` | `CanvasText` |
| `--stagger-shimmer-spread` | 12ch |
| `--stagger-shimmer-step` | `calc(var(--stagger-shimmer-duration) * 0.6)` |

`--stagger-shimmer-ghost` is deliberately **not** declared at `:root` — it defaults to 15% of the ink at the use site. Declared globally it would resolve `var(--stagger-shimmer-ink)` against `:root` and inherit that one frozen color, so a card overriding the ink would keep a black ghost. Set it explicitly only to break the 15% relationship.

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

For standard HTML elements or cases where `variant` is not a valid attribute, use `data-variant` instead. The CSS should target both:

```css
:where(ui-accordion):is([variant~="bordered"], [data-variant~="bordered"]) { /* ... */ }
```

This is useful when a component wraps a native element (e.g., `<blockquote>`, `<table>`) rather than a custom element, since `variant` on a native element may trigger validation warnings or conflict with future HTML attributes.

### Semantic color attributes

Use `color` for status semantics (info, success, warning, error):

```html
<ui-badge color="success">Active</ui-badge>
```

### Token fallback

Component tokens reference global tokens directly — no hardcoded fallback needed since `@browser.style/base` is always loaded:

```css
--ui-card-bg: var(--color-surface);
```

Only add hardcoded fallbacks for component-specific values that don't come from a global token:

```css
border-radius: var(--ui-chip-bdrs, 3ch);
```

### Token architecture and naming

Two tiers — a component token references a global semantic token:

```
Component token       Global semantic token
--ui-card-bg     -->  var(--color-surface)
```

Naming rules:

- **Tailwind v4 compatible** — global token names match Tailwind where a convention exists
- **Component prefix** — component tokens are `--ui-{component}-{property}` (e.g. `--ui-accordion-border-width`)
- **Full readable names** — never abbreviations: `--ui-accordion-border-width`, not `--ui-accordion-bdw`
- **No PascalCase** — legacy `--AccentColor` etc. are aliased but never used in new code

### Legacy aliases

The bottom of `ui/base/tokens.css` carries 20 PascalCase color aliases (`--AccentColor`, `--Canvas`, `--GrayText`, …) plus five `--ff-*` font-family aliases, all pointing at the new token names. Components still referencing them get migrated as they are converted — replace PascalCase references with the new names, but do **not** remove the aliases from `tokens.css` until every component is migrated.

### Typed `attr()` fallback

Typed `attr()` has **no working fallback in Safari/Firefox**: `--x: attr(fill type(<color>), red)` does NOT fall back to `red`. A custom property parses any token stream, so `--x` holds the literal `attr(…)` text; it is never guaranteed-invalid, so a `var(--x, …)` fallback doesn't fire either — and the *consuming* property dies at computed-value time (no background, no ring, empty rating). Declaring a real value first doesn't help; the `attr()` declaration still wins.

Therefore:

- Every component using typed `attr()` ships an `@supports not (background-color: attr(x type(<color>), red))` block restoring the defaults
- Pages load `ui/base/polyfills/attr-fallback.js` to restore per-element values
- Feature-detect on a **real** property — `CSS.supports('--x', 'attr(…)')` returns `true` in Safari and lies

See `ui/base/polyfills/readme.md`.

---

## Do's and Don'ts

- Do use semantic token names (`--color-border`) not raw values (`hsl(0,0%,80%)`) in component CSS
- Do reference global tokens without hardcoded fallbacks — `tokens.css` is always loaded via the required base peer dependency
- Do add hardcoded fallbacks only for component-specific values not sourced from a global token
- Do use `light-dark()` for any color that should adapt to dark mode
- Do keep body text at `--line-height-normal` (1.5) for readability
- Don't tokenize `ch` units — they are already content-relative by design
- Don't tokenize CSS keywords like `smaller`, `larger` — they are already semantic
- Don't tokenize animation endpoints (`opacity: 0`, `opacity: 1`) — they have no semantic meaning as tokens
- Don't tokenize `cqi` values — container-query units must stay component-level
- Don't tokenize domain-specific colors — planet colors, mood emoji colors, periodic-table element colors stay as component-level custom properties
- Don't use Shadow DOM for new components — light DOM for framework compatibility
- Don't use `innerHTML` with attribute/user values — XSS risk; use `createElement` + `textContent`
- Don't use `querySelectorAll` without scoping — it leaks into nested components; use `:scope >` or iterate `this.children`
- Don't define variant tokens in multiple selectors — consolidate class-based and attribute-based into one rule
- Don't mix rounded and sharp corners within the same component variant
- Don't use PascalCase token names in new code — legacy aliases exist but are deprecated
- Don't remove the legacy aliases from `tokens.css` — they stay until all components are migrated
- Don't trust typed `attr()`'s fallback value — see [Typed `attr()` fallback](#typed-attr-fallback)
