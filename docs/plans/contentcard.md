# Content Card Design System — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Transform content-card from hardcoded CSS into a token-based design system with CSS-driven multipliers.

**Architecture:** CSS-first, no JS for styling. Compound attribute strings with `token(value)` syntax, enumerated CSS rules per container breakpoint, CSS nesting throughout.

**Tech Stack:** CSS (nesting, container queries, light-dark(), attr()), Web Components (ES Modules)

---

## Overview

Transform the content-card component from hardcoded CSS values into a proper design system built on W3C-compliant design tokens. The card references global tokens (colors, typography, spacing, shadows, aspect ratios) and provides a per-instance multiplier system for container-breakpoint-responsive scaling — all CSS-driven, no JS required for styling.

## Architecture

### Relationship to Layout System

- **Layout (`<lay-out>`)**: Uses **media breakpoints** (xs/sm/md/lg/xl/xxl) to change page-level layouts
- **Content Card (`<content-card>`)**: Uses **container queries** (card/card-md/card-xl) to change card-level layouts

Both systems share the same pattern:
- Compound attribute strings with `token(value)` syntax
- Attribute substring selectors `[attr*="token(value)"]`
- CSS nesting for compact output
- Enumerated CSS rules per breakpoint
- Config-driven build step to generate enumerated rules (future phase)

### Token Hierarchy

```
Global Tokens (tokens.json)          Component Tokens (base.css)
─────────────────────────           ──────────────────────────
--fs-lg: 1.15rem            ──►    --cc-fs-headline: var(--fs-lg)
--fw-bold: 700              ──►    --cc-fw-headline: var(--fw-bold)
--bxsh-sm: 0 2px 4px ...   ──►    --cc-bxsh: var(--bxsh-sm)
--ar-portrait: 3 / 4        ──►    --cc-ar: var(--ar-portrait)
--space-md: 1.25rem         ──►    --cc-pi: var(--space-md)
```

Component tokens (`--cc-*`) exist only where the card needs semantic aliasing or card-specific overrides. Standard design decisions (colors, sizes, shadows) reference global tokens directly with fallbacks.

## File Structure

```
content-card/demo/css/
├── base.css          Token definitions, container setup, .cc-inner, multiplier wiring
├── typography.css    .cc-headline, .cc-eyebrow, .cc-subheadline, .cc-summary
├── button.css        .cc-btn, .cc-btn--primary, .cc-btn--secondary, .cc-actions
├── link.css          .cc-cta, .cc-links, .cc-stretched-link
├── tag.css           .cc-tags, .cc-tag
├── media.css         .cc-media, img handling
├── badge.css         .cc-caption, .cc-ribbon, .cc-sticker
├── gallery.css       .cc-gallery, dots, arrows, counter
├── layouts.css       Layout variants + container-query breakpoints
├── overlay.css       Overlay positioning, gradients, color overrides
```

## base.css — Token Definitions

Uses Emmet abbreviations for all variable names.

```css
content-card {
  color-scheme: light dark;

  /* — Surface — */
  --cc-bg: light-dark(var(--c-white, #fff), var(--c-gray-80, #161616));
  --cc-bdrs: var(--bdrs-md, 6px);
  --cc-bxsh: var(--bxsh-sm);
  --cc-bxsh-hover: var(--bxsh-md);
  --cc-bd: light-dark(var(--c-gray-20, #e0e0e0), var(--c-gray-60, #393939));
  --cc-trs: var(--animdur-normal, 300ms) ease;

  /* — Ink — */
  --cc-c: light-dark(var(--c-gray-90, #1a1a1a), var(--c-gray-20, #e0e0e0));
  --cc-c-muted: light-dark(var(--c-gray-50, #525252), var(--c-gray-40, #8d8d8d));
  --cc-accent: light-dark(var(--c-accent, #e84e1b), var(--c-accent-light, #f06530));
  --cc-on-accent: var(--c-white, #fff);

  /* — Spacing (base values, scaled by multipliers) — */
  --cc-pi: var(--space-md, 1.25rem);
  --cc-pb: var(--space-lg, 1.5rem);
  --cc-rg: var(--space-xs, 0.4rem);
  --cc-cg: 0;

  /* — Multipliers (default 1, overridden per breakpoint via attributes) — */
  --cc-fsh-m: 1;
  --cc-fsb-m: 1;
  --cc-pi-m: 1;
  --cc-pb-m: 1;
  --cc-rg-m: 1;
  --cc-cg-m: 1;

  /* — Headline typography — */
  --cc-fs-headline: var(--fs-lg, 1.15rem);
  --cc-fw-headline: var(--fw-bold, 700);
  --cc-lh-headline: var(--lh-tight, 1.25);
  --cc-ls-headline: -0.02em;

  /* — Body typography (summary, subheadline) — */
  --cc-fs-body: var(--fs-sm, 0.85rem);
  --cc-fw-body: var(--fw-light, 300);
  --cc-lh-body: var(--lh-normal, 1.55);

  /* — Eyebrow typography — */
  --cc-fs-eyebrow: var(--fs-xs, 0.7rem);
  --cc-fw-eyebrow: var(--fw-medium, 500);
  --cc-ls-eyebrow: var(--ls-wide, 0.08em);

  /* — Overlay — */
  --cc-overlay-ink: #fff;
  --cc-overlay-ink-muted: rgba(255,255,255,.75);
  --cc-overlay-gradient-start: rgba(0,0,0,.45);
  --cc-overlay-gradient-end: rgba(0,0,0,0);
  --cc-overlay-gradient-center: rgba(0,0,0,.4);
  --cc-overlay-gradient-center-end: rgba(0,0,0,.05);
  --cc-overlay-blur: 4px;

  /* — Media — */
  --cc-media-bg: light-dark(var(--c-gray-10, #e8e0d8), var(--c-gray-70, #2a2520));
  --cc-media-min-h: 180px;

  /* — Container setup — */
  display: block;
  container-type: inline-size;
  container-name: card;
}

/* — Inner Grid Wrapper — */
.cc-inner {
  background: var(--cc-bg);
  border-radius: var(--cc-bdrs);
  box-shadow: var(--cc-bxsh);
  color: var(--cc-c);
  display: grid;
  grid-template-rows: auto 1fr;
  overflow: clip;
  transition: box-shadow var(--cc-trs);
}

.cc-inner:hover {
  box-shadow: var(--cc-bxsh-hover);
}
```

## Multiplier System

### Attribute Syntax

Everything goes in compound attribute strings per breakpoint:

```html
<content-card
  card="vertical ar(portrait) fsh(2) pi(1.5)"
  card-md="horizontal fsh(3) rg(2)"
  card-xl="overlay(bl) fsh(4) fsb(1.5) pi(2)">
</content-card>
```

### Multiplier Tokens

| Token | Emmet | CSS Property | What it scales |
|-------|-------|-------------|----------------|
| `fsh(n)` | `--cc-fsh-m` | font-size | Headline |
| `fsb(n)` | `--cc-fsb-m` | font-size | Body text (summary, subheadline) |
| `pi(n)` | `--cc-pi-m` | padding-inline | Content padding inline |
| `pb(n)` | `--cc-pb-m` | padding-block | Content padding block |
| `rg(n)` | `--cc-rg-m` | row-gap | Content row-gap |
| `cg(n)` | `--cc-cg-m` | column-gap | Content/layout column-gap |

### Enumerated Steps

Multiplier values: `1, 1.25, 1.5, 2, 2.5, 3, 4`

### CSS Pattern — Cascade-Driven with Nesting

`card` = source of truth, always applies. `card-md` and `card-xl` only override within their container query scope. CSS nesting keeps the output compact.

```css
content-card {
  /* Base — always active */
  &[card*="fsh(1.5)"] { --cc-fsh-m: 1.5; }
  &[card*="fsh(2)"]   { --cc-fsh-m: 2; }
  &[card*="fsh(2.5)"] { --cc-fsh-m: 2.5; }
  &[card*="fsh(3)"]   { --cc-fsh-m: 3; }
  &[card*="fsh(4)"]   { --cc-fsh-m: 4; }

  &[card*="fsb(1.5)"] { --cc-fsb-m: 1.5; }
  &[card*="fsb(2)"]   { --cc-fsb-m: 2; }

  &[card*="pi(1.5)"]  { --cc-pi-m: 1.5; }
  &[card*="pi(2)"]    { --cc-pi-m: 2; }

  &[card*="pb(1.5)"]  { --cc-pb-m: 1.5; }
  &[card*="pb(2)"]    { --cc-pb-m: 2; }

  &[card*="rg(1.5)"]  { --cc-rg-m: 1.5; }
  &[card*="rg(2)"]    { --cc-rg-m: 2; }
  &[card*="rg(3)"]    { --cc-rg-m: 3; }

  &[card*="cg(1)"]    { --cc-cg-m: 1; }
  &[card*="cg(2)"]    { --cc-cg-m: 2; }
}

/* MD — overrides base when container >= 400px */
@container card (min-width: 400px) {
  content-card {
    &[card-md*="fsh(1.5)"] { --cc-fsh-m: 1.5; }
    &[card-md*="fsh(2)"]   { --cc-fsh-m: 2; }
    &[card-md*="fsh(2.5)"] { --cc-fsh-m: 2.5; }
    &[card-md*="fsh(3)"]   { --cc-fsh-m: 3; }
    &[card-md*="fsh(4)"]   { --cc-fsh-m: 4; }

    &[card-md*="fsb(1.5)"] { --cc-fsb-m: 1.5; }
    &[card-md*="fsb(2)"]   { --cc-fsb-m: 2; }

    &[card-md*="pi(1.5)"]  { --cc-pi-m: 1.5; }
    &[card-md*="pi(2)"]    { --cc-pi-m: 2; }

    &[card-md*="pb(1.5)"]  { --cc-pb-m: 1.5; }
    &[card-md*="pb(2)"]    { --cc-pb-m: 2; }

    &[card-md*="rg(1.5)"]  { --cc-rg-m: 1.5; }
    &[card-md*="rg(2)"]    { --cc-rg-m: 2; }
    &[card-md*="rg(3)"]    { --cc-rg-m: 3; }

    &[card-md*="cg(1)"]    { --cc-cg-m: 1; }
    &[card-md*="cg(2)"]    { --cc-cg-m: 2; }
  }
}

/* XL — overrides both when container >= 700px */
@container card (min-width: 700px) {
  content-card {
    &[card-xl*="fsh(1.5)"] { --cc-fsh-m: 1.5; }
    &[card-xl*="fsh(2)"]   { --cc-fsh-m: 2; }
    &[card-xl*="fsh(2.5)"] { --cc-fsh-m: 2.5; }
    &[card-xl*="fsh(3)"]   { --cc-fsh-m: 3; }
    &[card-xl*="fsh(4)"]   { --cc-fsh-m: 4; }

    &[card-xl*="fsb(1.5)"] { --cc-fsb-m: 1.5; }
    &[card-xl*="fsb(2)"]   { --cc-fsb-m: 2; }

    &[card-xl*="pi(1.5)"]  { --cc-pi-m: 1.5; }
    &[card-xl*="pi(2)"]    { --cc-pi-m: 2; }

    &[card-xl*="pb(1.5)"]  { --cc-pb-m: 1.5; }
    &[card-xl*="pb(2)"]    { --cc-pb-m: 2; }

    &[card-xl*="rg(1.5)"]  { --cc-rg-m: 1.5; }
    &[card-xl*="rg(2)"]    { --cc-rg-m: 2; }
    &[card-xl*="rg(3)"]    { --cc-rg-m: 3; }

    &[card-xl*="cg(1)"]    { --cc-cg-m: 1; }
    &[card-xl*="cg(2)"]    { --cc-cg-m: 2; }
  }
}
```

Each multiplier token has its own set of steps — `fs` gets the full range for headlines, while `pb` and `pi` only need 1.5 and 2.

### Cascade Behavior

- `card="vertical fsh(2)"` with no `card-md` → base `fsh(2)` persists at all container sizes
- Add `card-md="horizontal fsh(3)"` → at >=400px the container query rule comes later in cascade, overrides to 3; below 400px, container query doesn't match, base stays at 2
- Add `card-xl="overlay(bl) fsh(4)"` → at >=700px overrides to 4

## Aspect Ratios

Named tokens (from global `tokens.json`) and raw values, enumerated per breakpoint with CSS nesting:

```css
content-card {
  /* Base */
  &[card*="ar(square)"]    { --cc-ar: var(--ar-square); }
  &[card*="ar(portrait)"]  { --cc-ar: var(--ar-portrait); }
  &[card*="ar(landscape)"] { --cc-ar: var(--ar-landscape); }
  &[card*="ar(panorama)"]  { --cc-ar: var(--ar-panorama); }
  &[card*="ar(1/1)"]       { --cc-ar: 1 / 1; }
  &[card*="ar(3/4)"]       { --cc-ar: 3 / 4; }
  &[card*="ar(4/3)"]       { --cc-ar: 4 / 3; }
  &[card*="ar(16/9)"]      { --cc-ar: 16 / 9; }
  &[card*="ar(21/9)"]      { --cc-ar: 21 / 9; }
}

@container card (min-width: 400px) {
  content-card {
    &[card-md*="ar(square)"]    { --cc-ar: var(--ar-square); }
    &[card-md*="ar(portrait)"]  { --cc-ar: var(--ar-portrait); }
    &[card-md*="ar(landscape)"] { --cc-ar: var(--ar-landscape); }
    &[card-md*="ar(panorama)"]  { --cc-ar: var(--ar-panorama); }
    &[card-md*="ar(1/1)"]       { --cc-ar: 1 / 1; }
    &[card-md*="ar(3/4)"]       { --cc-ar: 3 / 4; }
    &[card-md*="ar(4/3)"]       { --cc-ar: 4 / 3; }
    &[card-md*="ar(16/9)"]      { --cc-ar: 16 / 9; }
    &[card-md*="ar(21/9)"]      { --cc-ar: 21 / 9; }
  }
}

@container card (min-width: 700px) {
  content-card {
    &[card-xl*="ar(square)"]    { --cc-ar: var(--ar-square); }
    &[card-xl*="ar(portrait)"]  { --cc-ar: var(--ar-portrait); }
    &[card-xl*="ar(landscape)"] { --cc-ar: var(--ar-landscape); }
    &[card-xl*="ar(panorama)"]  { --cc-ar: var(--ar-panorama); }
    &[card-xl*="ar(1/1)"]       { --cc-ar: 1 / 1; }
    &[card-xl*="ar(3/4)"]       { --cc-ar: 3 / 4; }
    &[card-xl*="ar(4/3)"]       { --cc-ar: 4 / 3; }
    &[card-xl*="ar(16/9)"]      { --cc-ar: 16 / 9; }
    &[card-xl*="ar(21/9)"]      { --cc-ar: 21 / 9; }
  }
}
```

## Sub-Component CSS

### typography.css

```css
.cc-headline {
  font-size: calc(var(--cc-fs-headline) * var(--cc-fsh-m, 1));
  font-weight: var(--cc-fw-headline);
  letter-spacing: var(--cc-ls-headline);
  line-height: var(--cc-lh-headline);
  margin: 0;
}

.cc-eyebrow {
  color: var(--cc-accent);
  font-size: var(--cc-fs-eyebrow);
  font-weight: var(--cc-fw-eyebrow);
  letter-spacing: var(--cc-ls-eyebrow);
  text-transform: uppercase;
}

.cc-subheadline {
  font-size: calc(var(--cc-fs-body) * var(--cc-fsb-m, 1));
  color: var(--cc-c-muted);
  font-weight: var(--cc-fw-body);
  font-style: italic;
}

.cc-summary {
  font-size: calc(var(--cc-fs-body) * var(--cc-fsb-m, 1));
  color: var(--cc-c-muted);
  line-height: var(--cc-lh-body);
  font-weight: var(--cc-fw-body);
}
```

### button.css

```css
.cc-actions {
  display: flex;
  flex-wrap: wrap;
  gap: var(--cc-actions-gap, 0.5rem);
  margin-block-start: var(--cc-rg);
}

.cc-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--cc-rg);
  font-family: inherit;
  font-size: var(--cc-fs-btn, var(--fs-sm, 0.78rem));
  font-weight: var(--cc-fw-btn, var(--fw-bold, 700));
  letter-spacing: 0.02em;
  padding: var(--cc-btn-pb, 0.65rem) var(--cc-btn-pi, 1.4rem);
  border: none;
  border-radius: var(--cc-btn-bdrs, var(--bdrs-sm, 4px));
  cursor: pointer;
  text-decoration: none;
  transition: background var(--cc-trs), color var(--cc-trs), box-shadow var(--cc-trs);
  align-self: flex-start;
}

.cc-btn--primary {
  background: var(--cc-accent);
  color: var(--cc-on-accent);
}

.cc-btn--primary:hover {
  filter: brightness(0.9);
  box-shadow: 0 2px 8px color-mix(in srgb, var(--cc-accent) 25%, transparent);
}

.cc-btn--secondary {
  background: transparent;
  color: var(--cc-c);
  border: 1.5px solid var(--cc-bd);
}

.cc-btn--secondary:hover {
  border-color: var(--cc-c);
}
```

### tag.css

```css
.cc-tags {
  display: flex;
  flex-wrap: wrap;
  gap: var(--cc-tags-gap, 0.35rem);
}

.cc-tag {
  font-size: var(--cc-fs-tag, var(--fs-xs, 0.65rem));
  font-weight: var(--cc-fw-tag, var(--fw-medium, 500));
  padding: var(--cc-tag-pb, 0.2rem) var(--cc-tag-pi, 0.55rem);
  border-radius: var(--cc-tag-bdrs, 100px);
  background: var(--cc-tag-bg, light-dark(var(--c-gray-10, #f0ece8), var(--c-gray-60, #333)));
  color: var(--cc-c-muted);
  letter-spacing: 0.02em;
}
```

### Content area (in base.css or layouts.css)

```css
.cc-content {
  display: flex;
  flex-direction: column;
  flex: 1;
  padding-inline: calc(var(--cc-pi) * var(--cc-pi-m, 1));
  padding-block: calc(var(--cc-pb) * var(--cc-pb-m, 1));
  row-gap: calc(var(--cc-rg) * var(--cc-rg-m, 1));
  column-gap: calc(var(--cc-cg) * var(--cc-cg-m, 1));
}
```

## Implementation Phases

### Phase 1: Handwritten CSS

Write the CSS files directly — `base.css`, `typography.css`, `button.css`, etc. — with hardcoded enumerated rules using CSS nesting. This establishes the design system, validates the token structure, and provides a working reference implementation.

### Phase 2: Config-Driven Build

Once the handwritten CSS is stable, introduce `card.config.json` and a build script (modeled on the layout system's `LayoutBuilder`) that generates the enumerated rules from config. The builder already supports `@container` queries via `generateMediaQuery()`.

#### card.config.json

```json
{
  "element": "content-card",
  "containerName": "card",
  "core": ["base"],
  "sub": ["typography", "button", "link", "tag", "media", "badge", "gallery", "overlay"],
  "breakpoints": {
    "card": {
      "type": "base",
      "layouts": ["vertical", "vertical-r", "horizontal", "horizontal-r",
                  "media-only", "content-only", "overlay", "subgrid"]
    },
    "card-md": {
      "type": "@container",
      "min": "400px",
      "layouts": ["vertical", "vertical-r", "horizontal", "horizontal-r",
                  "media-only", "content-only", "overlay", "subgrid"]
    },
    "card-xl": {
      "type": "@container",
      "min": "700px",
      "layouts": ["vertical", "vertical-r", "horizontal", "horizontal-r",
                  "media-only", "content-only", "overlay", "subgrid"]
    }
  },
  "multipliers": {
    "fsh":  { "prop": "--cc-fsh-m",  "steps": [1.5, 2, 2.5, 3, 4] },
    "fsb": { "prop": "--cc-fsb-m", "steps": [1.5, 2] },
    "pi":  { "prop": "--cc-pi-m",  "steps": [1.5, 2] },
    "pb":  { "prop": "--cc-pb-m",  "steps": [1.5, 2] },
    "rg":  { "prop": "--cc-rg-m",  "steps": [1.5, 2, 3] },
    "cg":  { "prop": "--cc-cg-m",  "steps": [1, 2] }
  },
  "aspectRatios": {
    "named": ["square", "portrait", "landscape", "panorama"],
    "raw": ["1/1", "3/4", "4/3", "16/9", "21/9"]
  }
}
```

Each multiplier defines only the steps it needs — `fs` gets the full range for headline scaling, while `pb` and `pi` only need 1.5 and 2. Adjusting the steps and rebuilding regenerates only the rules needed.

## Example Usage

```html
<!-- Simple vertical card -->
<content-card card="vertical ar(portrait)"></content-card>

<!-- Responsive: vertical → horizontal → overlay -->
<content-card
  card="vertical ar(square)"
  card-md="horizontal ar(landscape) fsh(1.5) pi(1.25)"
  card-xl="overlay(bl) ar(panorama) fsh(3) fsb(1.5) pi(2) rg(2)">
</content-card>

<!-- Hero banner -->
<content-card
  card="overlay(bl) ar(21/9) fsh(3) pi(2) pb(2)">
</content-card>

<!-- Inside a layout -->
<lay-out md="columns(3) rg(2) cg(1)">
  <content-card card="vertical ar(landscape)"></content-card>
  <content-card card="vertical ar(landscape)"></content-card>
  <content-card card="vertical ar(landscape)"></content-card>
</lay-out>
```

## Global Token Dependencies

The design system expects these global tokens to exist (with fallbacks for standalone use):

| Category | Tokens |
|----------|--------|
| Colors | `--c-gray-10` through `--c-gray-90`, `--c-accent`, `--c-white` |
| Font size | `--fs-xs`, `--fs-sm`, `--fs-base`, `--fs-lg`, `--fs-xl` |
| Font weight | `--fw-light`, `--fw-normal`, `--fw-medium`, `--fw-bold` |
| Line height | `--lh-tight`, `--lh-normal`, `--lh-loose` |
| Letter spacing | `--ls-tight`, `--ls-normal`, `--ls-wide` |
| Spacing | `--space-xs`, `--space-sm`, `--space-md`, `--space-lg`, `--space-xl` |
| Shadows | `--bxsh-xs`, `--bxsh-sm`, `--bxsh-md`, `--bxsh-lg` |
| Border radius | `--bdrs-sm`, `--bdrs-md`, `--bdrs-lg` |
| Aspect ratio | `--ar-square`, `--ar-portrait`, `--ar-landscape`, `--ar-panorama` |
| Duration | `--animdur-fast`, `--animdur-normal`, `--animdur-slow` |

---

## Phase 1 Implementation Tasks

All files in: `ui/content-card/demo/css/`

Old files to delete: `content.css`, `overlays.css` (replaced by split sub-components)

### Task 1: Write `base.css`

**Files:**
- Modify: `ui/content-card/demo/css/base.css`

Replace entire file. Contains:
- Component token definitions (`--cc-*`) referencing global tokens with fallbacks
- Multiplier defaults (`--cc-fsh-m: 1`, etc.)
- Container setup (`container-type`, `container-name`)
- `.cc-inner` grid wrapper
- `.cc-content` structural wrapper with multiplied spacing
- Enumerated multiplier rules for base, card-md, card-xl (using CSS nesting)
- Enumerated aspect-ratio rules for base, card-md, card-xl
- Enumerated split-ratio rules for base, card-md, card-xl

Key changes from old `base.css`:
- `--card-*` → `--cc-*` (Emmet abbreviations)
- `--card-hs-sm/md/lg/xl` t-shirt sizes → `fsh(n)` multiplier system
- `--card-rg-m` (set by JS) → `rg(n)` in attribute (CSS-driven)
- `--card-ar` (set by JS) → `ar()` in attribute (CSS-driven via attribute selectors)
- `--card-split` (set by JS) → `split()` in attribute (CSS-driven via attribute selectors)
- `.cc-content` moved from `content.css` to `base.css` (structural element)
- All hardcoded shadows/colors → token references with fallbacks

**Multiplier steps:**
- `fsh`: 1.5, 2, 2.5, 3, 4
- `fsb`: 1.5, 2
- `pi`: 1.5, 2
- `pb`: 1.5, 2
- `rg`: 1.5, 2, 3
- `cg`: 1, 2

**Aspect ratios:**
- Named: square, portrait, landscape, panorama (→ `var(--ar-*)`)
- Raw: 1/1, 3/4, 4/3, 16/9, 21/9

**Split ratios:** 1/1, 1/2, 2/1, 1/3, 3/1, 2/3, 3/2

### Task 2: Write `typography.css`

**Files:**
- Create: `ui/content-card/demo/css/typography.css`

Extract from old `content.css`:
- `.cc-headline` — uses `calc(var(--cc-fsh) * var(--cc-fsh-m, 1))` for font-size
- `.cc-eyebrow`, `.cc-eyebrow--above`, `.cc-eyebrow--outside`
- `.cc-subheadline` — uses `calc(var(--cc-fsb) * var(--cc-fsb-m, 1))` for font-size
- `.cc-summary` — same body multiplier as subheadline

All `--card-*` references → `--cc-*`.

### Task 3: Write `button.css`

**Files:**
- Create: `ui/content-card/demo/css/button.css`

Extract from old `content.css`:
- `.cc-actions`
- `.cc-btn`, `.cc-btn--primary`, `.cc-btn--secondary`
- Hover states

All `--card-*` → `--cc-*`.

### Task 4: Write `link.css`

**Files:**
- Create: `ui/content-card/demo/css/link.css`

Extract from old `content.css`:
- `.cc-cta` (arrow link)
- `.cc-links` (link list with borders)
- `.cc-stretched-link`, `.cc-stretched-link--hidden`
- `content-card[clickable]` rules

All `--card-*` → `--cc-*`.

### Task 5: Write `tag.css`

**Files:**
- Create: `ui/content-card/demo/css/tag.css`

Extract from old `content.css`:
- `.cc-tags`
- `.cc-tag`

All `--card-*` → `--cc-*`.

### Task 6: Write `media.css`

**Files:**
- Modify: `ui/content-card/demo/css/media.css`

Keep only media-area rules from old `media.css`:
- `.cc-media` — uses `aspect-ratio: var(--cc-ar, auto)`
- `.cc-media img`
- Remove the `content-card[style*="--card-ar"]` selector — replaced by `content-card[card*="ar("]`

Remove caption, ribbon, sticker, gallery (moved to `badge.css` and `gallery.css`).
All `--card-*` → `--cc-*`.

### Task 7: Write `badge.css`

**Files:**
- Create: `ui/content-card/demo/css/badge.css`

Extract from old `media.css`:
- `.cc-caption` + position variants
- `.cc-ribbon`
- `.cc-sticker`

All `--card-*` → `--cc-*`.

### Task 8: Write `gallery.css`

**Files:**
- Create: `ui/content-card/demo/css/gallery.css`

Extract from old `media.css`:
- `.cc-media--gallery`
- `.cc-gallery`, `.cc-gallery-slide`
- `.cc-gallery-dots`, `.cc-gallery-dot`
- `.cc-gallery-arrow`
- `.cc-gallery-counter`

All `--card-*` → `--cc-*`.

### Task 9: Write `layouts.css`

**Files:**
- Modify: `ui/content-card/demo/css/layouts.css`

Rewrite with:
- All `--card-*` → `--cc-*`
- `--card-split` → `--cc-split` (now CSS-driven, no JS)
- `--card-split-md` → `--cc-split-md`, `--card-split-xl` → `--cc-split-xl`
- Remove `content-card[style*="--card-ar-md"]` — replaced by `ar()` attribute selectors in `base.css`
- Keep CSS nesting structure

### Task 10: Write `overlay.css`

**Files:**
- Modify: `ui/content-card/demo/css/overlays.css` → rename to `overlay.css`

Rewrite with all `--card-*` → `--cc-*`. Same structure.

### Task 11: Update `index.html`

**Files:**
- Modify: `ui/content-card/demo/index.html`

- Replace stylesheet links: remove `content.css`, `overlays.css`; add `typography.css`, `button.css`, `link.css`, `tag.css`, `badge.css`, `gallery.css`; rename `overlays.css` → `overlay.css`
- Update demo cards to use `fsh()` instead of `hs()`
- Update hero banner: `hs(xl)` → `fsh(3)`

### Task 12: Update `content-card.js`

**Files:**
- Modify: `ui/content-card/demo/content-card.js`

- **Remove** `_applyTokens()` method entirely (CSS handles all styling now)
- **Remove** `resolveHs()` helper (no more t-shirt sizes)
- **Remove** `toFr()` helper (CSS handles split ratios)
- **Simplify** `parseTokens()` — only needs to extract `layout`, `eyebrow`, `subgrid` for rendering decisions
- **Remove** inline style manipulation for `--card-ar`, `--card-split`, `--card-hs`, `--card-rg-m`
- Keep `renderMedia()`, `renderContent()`, `_render()` unchanged (they build HTML, not styling)

### Task 13: Delete old files

**Files:**
- Delete: `ui/content-card/demo/css/content.css`
- Delete: `ui/content-card/demo/css/overlays.css` (if not already renamed)

### Task 14: Visual verification

Open the demo page and verify:
- All card variants render correctly
- Container-query responsive demo works (resize handle)
- Overlay positions work at all breakpoints
- Multiplier tokens scale headline/body/spacing correctly
- Aspect ratios resolve properly
- Split ratios work in horizontal layouts

### Task 15: Commit

```bash
git add ui/content-card/demo/
git commit -m "feat(content-card): implement token-based design system (Phase 1)"
```
