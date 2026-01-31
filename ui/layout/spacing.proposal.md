# Spacing Proposal: Breakpoint-Controlled Spacing for `lay-out`

## Overview

This proposal explores options for adding breakpoint-controlled spacing to the `lay-out` component, using a combined syntax approach where spacing tokens are embedded within breakpoint attributes.

**Proposed syntax:**
```html
<lay-out sm="columns(1) p(1)" lg="grid(3a) px(2) g(1)">
```

---

## Current System Analysis

### Layout Breakpoints (Existing)

The layout system uses **media queries + CSS layers + attribute selectors**:

```css
@media (min-width: 720px) {
  @layer layout.lg {
    lay-out[lg="grid(3a)"] {
      --layout-gtc: 1fr 1fr;
    }
  }
}
```

### Spacing Attributes (Current: Global Only)

Spacing is read via `attr()` and applies at **all viewport sizes**:

```css
lay-out {
  --layout-pi: attr(pad-inline type(<number>), 0);
  padding-inline: calc(var(--layout-pi) * var(--layout-space-unit));
}
```

```html
<lay-out pad-inline="2" lg="columns(3)">  <!-- pad-inline=2 at ALL sizes -->
```

---

## Combined Syntax Feasibility

### Required Change: Exact Match → Contains Match

```css
/* Current - exact match = */
lay-out[lg="columns(3)"] { ... }

/* Combined syntax requires *= (contains) */
lay-out[lg*="columns(3)"] { ... }
lay-out[lg*="p(2)"] { ... }
```

### Why This Works

With `*=` (contains), both selectors match independently:

| Attribute Value | `[lg*="columns(3)"]` | `[lg*="p(2)"]` |
|-----------------|----------------------|----------------|
| `"columns(3)"` | matches | no match |
| `"columns(3) p(2)"` | matches | matches |
| `"p(2) columns(3)"` | matches | matches |

**Order independence is preserved.**

### Value Collision Safety

The closing parenthesis `)` acts as a delimiter:

| Search String | Test Value | Contains? |
|---------------|------------|-----------|
| `columns(1)` | `columns(10)` | No — `)` prevents partial match |
| `p(1)` | `p(10)` | No |
| `p(2)` | `p(2) g(3)` | Yes (correct) |

### Selector Performance

| Selector Type | Relative Speed | Notes |
|---------------|----------------|-------|
| `[attr="value"]` (exact) | 1.0x (baseline) | Hash lookup |
| `[attr*="value"]` (contains) | ~1.2-1.5x | String scan |

**Negligible impact** — modern browsers run attribute matching in nanoseconds. The system already uses `*=` for `lanes(` detection.

---

## Short Token Names

### Recommended Set

| Token | Sets | CSS Property |
|-------|------|--------------|
| `p(N)` | all padding | `padding` |
| `px(N)` | pad-inline | `padding-inline` |
| `py(N)` | pad-block | `padding-block` |
| `g(N)` | gap (both) | `gap` |
| `gx(N)` | col-gap | `column-gap` |
| `gy(N)` | row-gap | `row-gap` |

### Extended Set (Optional)

| Token | Sets | CSS Property |
|-------|------|--------------|
| `m(N)` | all margin | `margin` |
| `mx(N)` | margin-inline | `margin-inline` |
| `my(N)` | margin-block | `margin-block` |

---

## 4-Value System with Custom Properties

### Concept

Instead of numeric multipliers, use **5 semantic values** (0-4) that map to user-defined CSS custom properties:

| Value | Resolves To | Default |
|-------|-------------|---------|
| `0` | `0` | 0 |
| `1` | `var(--layout-s1, 0.5rem)` | 0.5rem |
| `2` | `var(--layout-s2, 1rem)` | 1rem |
| `3` | `var(--layout-s3, 2rem)` | 2rem |
| `4` | `var(--layout-s4, 4rem)` | 4rem |

### Generated CSS

```css
@media (min-width: 720px) {
  lay-out[lg*="p(0)"] {
    --layout-pi: 0;
    --layout-pbs: 0;
    --layout-pbe: 0;
  }
  lay-out[lg*="p(1)"] {
    --layout-pi: var(--layout-s1);
    --layout-pbs: var(--layout-s1);
    --layout-pbe: var(--layout-s1);
  }
  lay-out[lg*="p(2)"] {
    --layout-pi: var(--layout-s2);
    --layout-pbs: var(--layout-s2);
    --layout-pbe: var(--layout-s2);
  }
  /* ... */
}
```

### Selector Count

| Configuration | Selectors |
|---------------|-----------|
| Full (9 tokens × 5 values × 6 breakpoints) | 270 |
| Standard (6 tokens × 5 values × 6 breakpoints) | 180 |
| Minimal (4 tokens × 5 values × 6 breakpoints) | **120** |
| Ultra-minimal (2 tokens × 5 values × 6 breakpoints) | 60 |

---

## User-Defined Spacing Per Breakpoint

**Key advantage:** Users can dynamically update spacing variables per breakpoint using standard CSS — no additional selectors required:

```css
:root {
  /* Mobile-first: compact spacing */
  --layout-s1: 0.25rem;
  --layout-s2: 0.5rem;
  --layout-s3: 1rem;
  --layout-s4: 1.5rem;
}

@media (min-width: 540px) {
  :root {
    /* Tablet: moderate spacing */
    --layout-s1: 0.375rem;
    --layout-s2: 0.75rem;
    --layout-s3: 1.5rem;
    --layout-s4: 2.5rem;
  }
}

@media (min-width: 720px) {
  :root {
    /* Desktop: generous spacing */
    --layout-s1: 0.5rem;
    --layout-s2: 1rem;
    --layout-s3: 2rem;
    --layout-s4: 4rem;
  }
}
```

This means `p(2)` **automatically scales** across breakpoints:
- Mobile: 0.5rem
- Tablet: 0.75rem
- Desktop: 1rem

**Zero extra CSS selectors needed** — the 4-value system becomes a powerful abstraction layer.

### Per-Component Override

```css
/* Compact variant */
lay-out.compact {
  --layout-s1: 0.125rem;
  --layout-s2: 0.25rem;
  --layout-s3: 0.5rem;
  --layout-s4: 1rem;
}

/* Spacious variant */
lay-out.spacious {
  --layout-s1: 1rem;
  --layout-s2: 2rem;
  --layout-s3: 4rem;
  --layout-s4: 8rem;
}
```

---

## Usage Examples

### Basic Responsive Spacing

```html
<!-- Tight on mobile, spacious on desktop -->
<lay-out sm="columns(1) p(1)" lg="columns(3) p(3) g(2)">
  <div>Item 1</div>
  <div>Item 2</div>
  <div>Item 3</div>
</lay-out>
```

### Horizontal-Only Padding

```html
<!-- Bleed content with horizontal padding only -->
<lay-out sm="columns(1) px(2)" lg="grid(3a) px(3)" bleed>
  <div>Item 1</div>
  <div>Item 2</div>
  <div>Item 3</div>
</lay-out>
```

### Dense Grid

```html
<!-- Minimal gaps on mobile, standard on desktop -->
<lay-out sm="columns(2) g(1)" xl="columns(4) g(2)">
  <div>Item 1</div>
  <div>Item 2</div>
  <div>Item 3</div>
  <div>Item 4</div>
</lay-out>
```

### Combined with Custom Scale

```html
<lay-out sm="columns(1) p(2)" lg="grid(3a) p(3) g(2)" class="spacious">
  <!-- Uses .spacious custom properties -->
</lay-out>
```

---

## Build System Changes

### builder.js Modification

1. Change selector generation from exact to contains match:

```javascript
// Line 184: Change = to *=
const baseSelector = `${elementSelector}[${breakpointName}*="${selectorValue}"]`
```

2. Add spacing selector generation:

```javascript
const spacingTokens = {
  'p': ['--layout-pi', '--layout-pbs', '--layout-pbe'],
  'px': ['--layout-pi'],
  'py': ['--layout-pbs', '--layout-pbe'],
  'g': ['--layout-colmg', '--layout-rg'],
  'gx': ['--layout-colmg'],
  'gy': ['--layout-rg']
};

const spacingValues = {
  '0': '0',
  '1': 'var(--layout-s1, 0.5rem)',
  '2': 'var(--layout-s2, 1rem)',
  '3': 'var(--layout-s3, 2rem)',
  '4': 'var(--layout-s4, 4rem)'
};
```

### base.css Addition

```css
lay-out {
  /* Spacing scale defaults */
  --layout-s1: 0.5rem;
  --layout-s2: 1rem;
  --layout-s3: 2rem;
  --layout-s4: 4rem;
}
```

---

## Implementation Summary

| Aspect | Recommendation |
|--------|----------------|
| **Tokens** | `p`, `px`, `py`, `g` (4 minimum) |
| **Values** | 0, 1, 2, 3, 4 (5 total) |
| **Breakpoints** | xs, sm, md, lg, xl, xxl (6) |
| **Total Selectors** | 120 (minimal) to 180 (standard) |
| **Estimated CSS Size** | ~3-4 KB additional |
| **User Control** | Full via `--layout-s1` through `--layout-s4` |
| **Breakpoint Scaling** | User-defined via CSS media queries |

---

## Benefits

1. **Single attribute** — Layout and spacing in one place per breakpoint
2. **Minimal CSS** — Only 120-180 new selectors
3. **Full user control** — Custom properties define actual values
4. **Responsive by default** — Users can scale values per breakpoint
5. **Backwards compatible** — Existing attributes continue to work
6. **No JavaScript** — Pure CSS implementation
7. **Performant** — `*=` selectors are well-optimized in modern browsers

---

## Alternative: T-Shirt Sizes

For more semantic naming:

| Token | Maps To |
|-------|---------|
| `p(none)` | 0 |
| `p(xs)` | `--layout-s-xs` |
| `p(sm)` | `--layout-s-sm` |
| `p(md)` | `--layout-s-md` |
| `p(lg)` | `--layout-s-lg` |

```html
<lay-out lg="grid(3a) p(sm) g(md)">
```

Same selector count, more readable.

---

## Next Steps

1. Decide on token set (minimal vs standard)
2. Decide on value naming (numeric vs t-shirt)
3. Update builder.js selector generation
4. Add spacing token generation to build
5. Add default custom properties to base.css
6. Update documentation
