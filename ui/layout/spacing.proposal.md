# Spacing Proposal: Breakpoint-Controlled Spacing for `lay-out`

## Overview

This proposal explores options for adding breakpoint-controlled spacing to the `lay-out` component, using a combined syntax approach where spacing tokens are embedded within breakpoint attributes.

**Proposed syntax:**
```html
<lay-out sm="columns(1) p(1)" lg="grid(3a) pi(2) g(1)">
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
| `pi(N)` | padding-inline | `padding-inline` |
| `pb(N)` | padding-block | `padding-block` |
| `g(N)` | gap (both) | `gap` |
| `gc(N)` | column-gap | `column-gap` |
| `rg(N)` | row-gap | `row-gap` |

### Extended Set (Optional)

| Token | Sets | CSS Property |
|-------|------|--------------|
| `mbs(N)` | margin-block-start | `margin-block-start` |
| `mbe(N)` | margin-block-end | `margin-block-end` |

---

## ⚠️ Compatibility Analysis: base.css Changes Required

### The Problem

The current `base.css` treats spacing properties as **numeric multipliers**:

```css
/* base.css lines 18-22: Properties are numbers */
--layout-pbe: attr(pad-bottom type(<number>), 0);
--layout-pbs: attr(pad-top type(<number>), 0);
--layout-pi: attr(pad-inline type(<number>), 0);
--layout-colmg: attr(col-gap type(<number>), 1);
--layout-rg: attr(row-gap type(<number>), 1);

/* base.css lines 28, 38-42: Used as multipliers */
column-gap: calc(var(--layout-colmg) * var(--layout-space-unit));
padding-block-end: calc(var(--layout-pbe) * var(--layout-space-unit));
padding-block-start: calc(var(--layout-pbs) * var(--layout-space-unit));
padding-inline: calc(var(--layout-pi) * var(--layout-space-unit));
row-gap: calc(var(--layout-rg) * var(--layout-space-unit));
```

The proposal sets these properties to **length values**:

```css
lay-out[lg*="pi(2)"] {
  --layout-pi: var(--layout-s2, 1rem);  /* This is a length! */
}
```

**Result: Invalid CSS**
```css
padding-inline: calc(1rem * 1rem);  /* ❌ Cannot multiply two lengths */
```

### Resolution Options

#### Option A: Remove Global Spacing Attributes (Breaking Change)

Remove the global spacing attributes entirely, using **only** breakpoint tokens for spacing.

**What to REMOVE from base.css:**

```css
/* DELETE these attr() declarations (lines 12, 15-16, 18-20, 22): */
--layout-colmg: attr(col-gap type(<number>), 1);      /* DELETE */
--layout-mbe: attr(space-bottom type(<number>), 0);   /* DELETE */
--layout-mbs: attr(space-top type(<number>), 0);      /* DELETE */
--layout-pbe: attr(pad-bottom type(<number>), 0);     /* DELETE */
--layout-pbs: attr(pad-top type(<number>), 0);        /* DELETE */
--layout-pi: attr(pad-inline type(<number>), 0);      /* DELETE */
--layout-rg: attr(row-gap type(<number>), 1);         /* DELETE */
```

**What to CHANGE in base.css:**

```css
/* Before (lines 28, 34-35, 38-40, 42): */
column-gap: calc(var(--layout-colmg) * var(--layout-space-unit));
margin-block-start: calc(var(--layout-mbs) * var(--layout-space-unit));
margin-block-end: calc(var(--layout-mbe) * var(--layout-space-unit));
padding-block-end: calc(var(--layout-pbe) * var(--layout-space-unit));
padding-block-start: calc(var(--layout-pbs) * var(--layout-space-unit));
padding-inline: calc(var(--layout-pi) * var(--layout-space-unit));
row-gap: calc(var(--layout-rg) * var(--layout-space-unit));

/* After — use direct values with defaults: */
column-gap: var(--layout-gc-val, var(--layout-space-unit));
margin-block-start: var(--layout-mbs-val, 0);
margin-block-end: var(--layout-mbe-val, 0);
padding-block-end: var(--layout-pbe-val, 0);
padding-block-start: var(--layout-pbs-val, 0);
padding-inline: var(--layout-pi-val, 0);
row-gap: var(--layout-rg-val, var(--layout-space-unit));
```

**HTML attributes to REMOVE from documentation:**

| Attribute | Replacement |
|-----------|-------------|
| `pad-inline="2"` | `xs="pi(2)"` or similar |
| `pad-top="1"` | Use `pb(N)` in breakpoint |
| `pad-bottom="1"` | Use `pb(N)` in breakpoint |
| `col-gap="2"` | Use `gc(N)` in breakpoint |
| `row-gap="2"` | Use `rg(N)` in breakpoint |
| `space-top="1"` | Use `mb(N)` in breakpoint |
| `space-bottom="1"` | Use `mb(N)` in breakpoint |

| Pros | Cons |
|------|------|
| Clean, single system | **Breaking change** |
| No legacy code to maintain | Existing HTML must be migrated |
| Simpler mental model | Removes fine-grained numeric control |

#### Option B: Use Separate Property Names (Non-Breaking)

Introduce new properties for breakpoint-controlled spacing:

```css
/* New properties for breakpoint spacing */
lay-out[lg*="pi(2)"] {
  --layout-pi-val: var(--layout-s2, 1rem);
}

/* base.css modification */
padding-inline: var(--layout-pi-val, calc(var(--layout-pi) * var(--layout-space-unit)));
```

| Pros | Cons |
|------|------|
| **Fully backwards compatible** | Two parallel systems |
| Existing attributes continue to work | More CSS custom properties |
| Gradual migration possible | Slightly more complex |

**Property mapping:**

| Token | New Property | Fallback to Existing |
|-------|--------------|---------------------|
| `pi(N)` | `--layout-pi-val` | `calc(var(--layout-pi) * var(--layout-space-unit))` |
| `pb(N)` | `--layout-pb-val` | `calc(var(--layout-pbs/pbe) * ...)` |
| `g(N)` | `--layout-g-val` | existing gap calculation |
| `gc(N)` | `--layout-gc-val` | `calc(var(--layout-colmg) * ...)` |
| `rg(N)` | `--layout-gr-val` | `calc(var(--layout-rg) * ...)` |

#### Option C: Keep Multiplier System — Simplest Approach ⭐

Spacing tokens output **multiplier values** (numbers), not lengths. Users control the actual spacing by setting `--layout-space-unit` per breakpoint.

**Generated CSS:**

```css
@media (min-width: 720px) {
  lay-out[lg*="pi(2)"] { --layout-pi: 2; }
  lay-out[lg*="pi(3)"] { --layout-pi: 3; }
  lay-out[lg*="g(1)"]  { --layout-colmg: 1; --layout-rg: 1; }
  lay-out[lg*="g(2)"]  { --layout-colmg: 2; --layout-rg: 2; }
  /* ... */
}
```

**base.css changes: NONE** — existing calculations work as-is:

```css
/* These stay exactly the same */
padding-inline: calc(var(--layout-pi) * var(--layout-space-unit));
column-gap: calc(var(--layout-colmg) * var(--layout-space-unit));
row-gap: calc(var(--layout-rg) * var(--layout-space-unit));
```

**User controls spacing scale via `--layout-space-unit`:**

```css
:root {
  --layout-space-unit: 0.5rem;  /* Mobile: compact */
}

@media (min-width: 540px) {
  :root { --layout-space-unit: 0.75rem; }  /* Tablet */
}

@media (min-width: 720px) {
  :root { --layout-space-unit: 1rem; }  /* Desktop */
}
```

**Result for `pi(2)`:**

| Breakpoint | Calculation | Result |
|------------|-------------|--------|
| Mobile | `2 × 0.5rem` | 1rem |
| Tablet | `2 × 0.75rem` | 1.5rem |
| Desktop | `2 × 1rem` | 2rem |

| Pros | Cons |
|------|------|
| **Zero base.css changes** | Single scale for all properties |
| Fully backwards compatible | Less granular than `--layout-s1`...`s4` |
| Simplest implementation | User must understand multiplier concept |
| Tokens are intuitive (1=small, 4=large) | Can't have different scales for padding vs gap |

**Why this might be best:**

1. No new CSS custom properties needed
2. No changes to base.css property calculations
3. Existing global attributes (`pad-inline="2"`) continue to work
4. Users already familiar with the multiplier system
5. Build system changes are minimal — just generate selectors that set multiplier values

### Recommendation

**Option C (Multipliers)** is the simplest path:

1. Zero base.css changes to property calculations
2. Zero new CSS custom properties
3. Fully backwards compatible with existing attributes
4. Users control responsive scaling via single `--layout-space-unit` variable
5. Minimal build system changes

**Option A (Remove Global Attributes)** is cleanest long-term:

1. Single, consistent system
2. No legacy code to maintain
3. Forces responsive-first thinking
4. But requires migration of existing HTML

**Option B (Separate Properties)** if you need both systems indefinitely.

### Required base.css Modifications (Option B)

```css
lay-out {
  /* Add spacing scale defaults */
  --layout-s1: 0.5rem;
  --layout-s2: 1rem;
  --layout-s3: 2rem;
  --layout-s4: 4rem;

  /* Modify property applications to check for breakpoint values first */
  padding-inline: var(--layout-pi-val, calc(var(--layout-pi) * var(--layout-space-unit)));
  padding-block-start: var(--layout-pbs-val, calc(var(--layout-pbs) * var(--layout-space-unit)));
  padding-block-end: var(--layout-pbe-val, calc(var(--layout-pbe) * var(--layout-space-unit)));
  column-gap: var(--layout-gc-val, calc(var(--layout-colmg) * var(--layout-space-unit)));
  row-gap: var(--layout-gr-val, calc(var(--layout-rg) * var(--layout-space-unit)));
}
```

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

Using Option B (separate property names) for backwards compatibility:

```css
@media (min-width: 720px) {
  lay-out[lg*="p(0)"] {
    --layout-pi-val: 0;
    --layout-pbs-val: 0;
    --layout-pbe-val: 0;
  }
  lay-out[lg*="p(1)"] {
    --layout-pi-val: var(--layout-s1);
    --layout-pbs-val: var(--layout-s1);
    --layout-pbe-val: var(--layout-s1);
  }
  lay-out[lg*="p(2)"] {
    --layout-pi-val: var(--layout-s2);
    --layout-pbs-val: var(--layout-s2);
    --layout-pbe-val: var(--layout-s2);
  }
  lay-out[lg*="g(1)"] {
    --layout-gc-val: var(--layout-s1);
    --layout-gr-val: var(--layout-s1);
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

### Option C: Single `--layout-space-unit` (Simplest)

Users control responsive spacing with one variable:

```css
:root {
  --layout-space-unit: 0.5rem;  /* Mobile: compact */
}

@media (min-width: 540px) {
  :root { --layout-space-unit: 0.75rem; }  /* Tablet */
}

@media (min-width: 720px) {
  :root { --layout-space-unit: 1rem; }  /* Desktop */
}
```

With `pi(2)`:
- Mobile: `2 × 0.5rem` = 1rem
- Tablet: `2 × 0.75rem` = 1.5rem
- Desktop: `2 × 1rem` = 2rem

**Zero extra CSS selectors needed** — spacing scales automatically.

### Option B: Multiple Scale Variables (More Control)

For independent control over different spacing levels:

```css
:root {
  --layout-s1: 0.25rem;
  --layout-s2: 0.5rem;
  --layout-s3: 1rem;
  --layout-s4: 1.5rem;
}

@media (min-width: 720px) {
  :root {
    --layout-s1: 0.5rem;
    --layout-s2: 1rem;
    --layout-s3: 2rem;
    --layout-s4: 4rem;
  }
}
```

### Per-Component Override

```css
/* Works with either option */
lay-out.compact {
  --layout-space-unit: 0.25rem;  /* Option C */
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

### Inline Padding Only

```html
<!-- Bleed content with inline padding only -->
<lay-out sm="columns(1) pi(2)" lg="grid(3a) pi(3)" bleed>
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

#### Option C (Simplest — Multipliers)

```javascript
const spacingTokens = {
  'p': ['--layout-pi', '--layout-pbs', '--layout-pbe'],
  'pi': ['--layout-pi'],
  'pb': ['--layout-pbs', '--layout-pbe'],
  'g': ['--layout-colmg', '--layout-rg'],
  'gc': ['--layout-colmg'],
  'rg': ['--layout-rg']
};

// Values are just multipliers (numbers)
const spacingValues = { '0': 0, '1': 1, '2': 2, '3': 3, '4': 4 };
```

**base.css changes: NONE**

#### Option B (Separate Properties)

```javascript
const spacingTokens = {
  'p': ['--layout-pi-val', '--layout-pbs-val', '--layout-pbe-val'],
  'pi': ['--layout-pi-val'],
  'pb': ['--layout-pbs-val', '--layout-pbe-val'],
  'g': ['--layout-gc-val', '--layout-rg-val'],
  'gc': ['--layout-gc-val'],
  'rg': ['--layout-rg-val']
};

// Values are length references
const spacingValues = {
  '0': '0',
  '1': 'var(--layout-s1, 0.5rem)',
  '2': 'var(--layout-s2, 1rem)',
  '3': 'var(--layout-s3, 2rem)',
  '4': 'var(--layout-s4, 4rem)'
};
```

**base.css changes required:**

```css
lay-out {
  --layout-s1: 0.5rem;
  --layout-s2: 1rem;
  --layout-s3: 2rem;
  --layout-s4: 4rem;

  padding-inline: var(--layout-pi-val, calc(var(--layout-pi) * var(--layout-space-unit)));
  padding-block-start: var(--layout-pbs-val, calc(var(--layout-pbs) * var(--layout-space-unit)));
  padding-block-end: var(--layout-pbe-val, calc(var(--layout-pbe) * var(--layout-space-unit)));
  column-gap: var(--layout-gc-val, calc(var(--layout-colmg) * var(--layout-space-unit)));
  row-gap: var(--layout-rg-val, calc(var(--layout-rg) * var(--layout-space-unit)));
}
```

---

## Implementation Summary

| Aspect | Recommendation |
|--------|----------------|
| **Tokens** | `p`, `pi`, `pb`, `g` (4 minimum) |
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

1. **Decide on compatibility approach:**
   - **Option C** (Multipliers) — Zero base.css changes, simplest
   - **Option A** (Remove globals) — Clean break, requires HTML migration
   - **Option B** (Parallel systems) — Maximum compatibility, more complex

2. Decide on token set (minimal: `p`, `pi`, `pb`, `g` vs standard: add `gc`, `rg`, `m`, `mi`, `mb`)
3. Decide on value naming (numeric `0-4` vs t-shirt `xs/sm/md/lg`)
4. Update builder.js:
   - Change `=` to `*=` for attribute selectors
   - Add spacing token generation
5. If Option A: Remove global spacing attrs from base.css
6. If Option B: Add `*-val` properties and scale defaults to base.css
7. Update documentation
