# Header Proposal: Headline & Description in Layout System

## Overview

This proposal investigates options for inserting a headline and description block within `lay-out` components without breaking the existing breakpoint-based layout system.

**Goal:** Allow semantic header content (headline + description) that doesn't interfere with `:nth-child()` grid-area assignments.

---

## Current Approach (aria-label)

From `base.backup.css`:

```css
&[aria-label] {
  &::before {
    content: attr(aria-label);
    font-size: var(--layout-header-fs, 2em);
    font-weight: var(--layout-header-fw, 500);
    grid-area: 1 / 1 / 1 / -1;
    text-box: text;
  }
}
```

**Issues:**

1. **Accessibility**: `aria-label` is meant for accessible names, not visible content
2. **Single element only**: Cannot add both headline AND description
3. **Not in DOM**: Cannot select, copy, or interact with pseudo-element content
4. **No semantic markup**: Screen readers see label, not heading structure
5. **No rich content**: Plain text only, no links or formatting

---

## The Core Problem

Layouts use `:nth-child()` selectors for grid-area assignment:

```css
lay-out[lg="grid(3a)"] > *:nth-child(3n+3) {
  --layout-ga: auto / span 2;
}
```

Adding a header element as a child **shifts ALL indices**:

| Without Header | With Header |
|----------------|-------------|
| Item 1 = `:nth-child(1)` | Header = `:nth-child(1)` (wrong placement) |
| Item 2 = `:nth-child(2)` | Item 1 = `:nth-child(2)` (wrong placement) |
| Item 3 = `:nth-child(3)` | Item 2 = `:nth-child(3)` (wrong placement) |

This breaks every layout pattern that relies on child indices.

---

## Solution Options

### Option 1: `:nth-child(An+B of S)` Selector (Recommended)

CSS Selectors Level 4 introduced filtered counting:

```css
/* Count only among non-header children */
lay-out[lg="grid(3a)"] > *:nth-child(3n+3 of :not([slot="header"])) {
  --layout-ga: auto / span 2;
}
```

**Usage:**

```html
<lay-out lg="grid(3a)">
  <header slot="header">
    <h2>Headline</h2>
    <p>Description text here</p>
  </header>
  <div>Item 1</div>  <!-- Counted as :nth-child(1 of :not([slot="header"])) -->
  <div>Item 2</div>  <!-- Counted as :nth-child(2 of :not([slot="header"])) -->
  <div>Item 3</div>  <!-- Counted as :nth-child(3 of :not([slot="header"])) -->
</lay-out>
```

**Browser Support:**

| Browser | Version | Release Date |
|---------|---------|--------------|
| Chrome | 111+ | March 2023 |
| Safari | 16.4+ | March 2023 |
| Firefox | 113+ | May 2023 |
| Edge | 111+ | March 2023 |

**Assessment:**

| Aspect | Rating | Notes |
|--------|--------|-------|
| Semantics | Excellent | Real `<header>`, `<h2>`, `<p>` elements |
| Accessibility | Excellent | Proper heading hierarchy |
| Flexibility | High | Any HTML content in header |
| Build Impact | Medium | Modify selector generation |
| Browser Support | Good | 2023+ browsers |

---

### Option 2: Slot Attribute with CSS Exclusion

Use attribute presence for simpler selectors:

```css
/* Header spans full width, placed in first row */
lay-out > [slot="header"] {
  grid-column: 1 / -1;
  grid-row: 1;
}

/* Push all non-header items to row 2+ */
lay-out:has([slot="header"]) > *:not([slot="header"]) {
  grid-row-start: 2;
}
```

**Problem:** This positions the header correctly but doesn't fix the `:nth-child()` counting issue. Layout patterns would still break.

**Verdict:** Requires Option 1's `:nth-child(of S)` syntax to fully work.

---

### Option 3: Pseudo-Elements with Attributes

Use both `::before` and `::after` for headline and description:

```css
lay-out[header] {
  grid-template-rows: auto auto var(--layout-gtr, auto);
}

lay-out[header]::before {
  content: attr(header);
  font-size: var(--layout-header-fs, 1.5em);
  font-weight: var(--layout-header-fw, 600);
  grid-column: 1 / -1;
  grid-row: 1;
}

lay-out[header][header-desc]::after {
  content: attr(header-desc);
  font-size: var(--layout-desc-fs, 1em);
  opacity: var(--layout-desc-o, 0.8);
  grid-column: 1 / -1;
  grid-row: 2;
}
```

**Usage:**

```html
<lay-out lg="grid(3a)" header="Featured Products" header-desc="Our top picks for this season">
  <div>Item 1</div>
  <div>Item 2</div>
  <div>Item 3</div>
</lay-out>
```

**Assessment:**

| Aspect | Rating | Notes |
|--------|--------|-------|
| Semantics | Poor | No real heading elements |
| Accessibility | Poor | Content in pseudo-elements not accessible |
| Flexibility | Low | Text only, no rich HTML |
| Build Impact | Low | Add to base.css only |
| Browser Support | Excellent | Works everywhere |

---

### Option 4: Position Absolute Header

Remove header from grid flow entirely:

```css
lay-out {
  position: relative;
}

lay-out > [slot="header"] {
  position: absolute;
  inset-block-start: 0;
  inset-inline: 0;
  transform: translateY(-100%);
}

lay-out:has([slot="header"]) {
  margin-block-start: var(--layout-header-height, 4rem);
}
```

**Assessment:**

| Aspect | Rating | Notes |
|--------|--------|-------|
| Semantics | Good | Real elements |
| Accessibility | Good | Proper structure |
| Flexibility | Medium | Requires known/estimated height |
| Build Impact | Low | Base CSS addition |
| Browser Support | Excellent | Works everywhere |

**Drawback:** Header height must be known or estimated, limiting flexibility.

---

### Option 5: Display Contents Wrapper

Use `display: contents` to flatten structure:

```html
<lay-out lg="grid(3a)">
  <div slot="header" style="display: contents">
    <header style="grid-column: 1 / -1">
      <h2>Headline</h2>
      <p>Description</p>
    </header>
  </div>
  <div>Item 1</div>
  <div>Item 2</div>
  <div>Item 3</div>
</lay-out>
```

**Problem:** With `display: contents`, the inner `<header>` becomes a direct grid child, but the outer `<div slot="header">` is still counted by `:nth-child()`.

**Verdict:** Still needs Option 1's filtered counting to work correctly.

---

## Recommended Implementation

### Strategy: Option 1 with Graceful Fallback

Use the modern `:nth-child(of S)` selector with fallback styling for older browsers.

### Build System Change

Modify selector generation in `builder.js`:

```javascript
// Current selector generation
"*:nth-child(3n+3)"

// New selector generation - exclude header from counting
"*:nth-child(3n+3 of :not([slot='header']))"
```

### Base CSS Addition

```css
/* === Header slot === */
lay-out > [slot="header"] {
  grid-column: 1 / -1;
  grid-row: 1;
  display: block;
  margin-block-end: calc(var(--layout-rg, 1) * var(--layout-space-unit));
}

/* Reset margins on header children */
lay-out > [slot="header"] > * {
  margin: 0;
}

/* Style first child as headline */
lay-out > [slot="header"] > :first-child {
  font-size: var(--layout-header-fs, 1.5em);
  font-weight: var(--layout-header-fw, 600);
  line-height: var(--layout-header-lh, 1.2);
}

/* Style second child as description */
lay-out > [slot="header"] > :nth-child(2) {
  font-size: var(--layout-desc-fs, 1em);
  color: var(--layout-desc-c, inherit);
  opacity: var(--layout-desc-o, 0.8);
  margin-block-start: var(--layout-desc-gap, 0.5em);
}

/* Adjust grid to accommodate header row */
lay-out:has(> [slot="header"]) {
  grid-template-rows: auto var(--layout-gtr, auto);
}

/* Fallback for browsers without :nth-child(of S) support */
@supports not selector(:nth-child(1 of .test)) {
  lay-out > [slot="header"] {
    grid-column: 1 / -1;
    margin-block-end: var(--layout-space-unit);
  }

  /* Warning: layouts may break in older browsers when header is present */
}
```

### CSS Custom Properties

| Property | Default | Description |
|----------|---------|-------------|
| `--layout-header-fs` | `1.5em` | Headline font size |
| `--layout-header-fw` | `600` | Headline font weight |
| `--layout-header-lh` | `1.2` | Headline line height |
| `--layout-desc-fs` | `1em` | Description font size |
| `--layout-desc-c` | `inherit` | Description color |
| `--layout-desc-o` | `0.8` | Description opacity |
| `--layout-desc-gap` | `0.5em` | Gap between headline and description |

---

## Usage Examples

### Basic Header

```html
<lay-out lg="grid(3a)">
  <header slot="header">
    <h2>Featured Products</h2>
    <p>Our top picks for this season</p>
  </header>
  <div>Product 1</div>
  <div>Product 2</div>
  <div>Product 3</div>
</lay-out>
```

### Header with Rich Content

```html
<lay-out lg="bento(6a)">
  <header slot="header">
    <h2>Latest News</h2>
    <p>Updates from our team. <a href="/news">View all articles</a></p>
  </header>
  <article>News 1</article>
  <article>News 2</article>
  <!-- ... -->
</lay-out>
```

### Headline Only (No Description)

```html
<lay-out lg="columns(4)">
  <header slot="header">
    <h3>Related Items</h3>
  </header>
  <div>Item 1</div>
  <div>Item 2</div>
  <div>Item 3</div>
  <div>Item 4</div>
</lay-out>
```

### Custom Styling

```html
<lay-out lg="grid(3a)" style="--layout-header-fs: 2em; --layout-desc-o: 0.6;">
  <header slot="header">
    <h2>Large Headline</h2>
    <p>Subtle description text</p>
  </header>
  <!-- items -->
</lay-out>
```

---

## Implementation Checklist

### Phase 1: Base CSS (No Breaking Changes)

- [ ] Add `[slot="header"]` styling to base.css
- [ ] Add CSS custom properties for header styling
- [ ] Add `:has()` rule for grid-template-rows adjustment
- [ ] Add `@supports` fallback block

### Phase 2: Builder Update (Opt-in)

- [ ] Add configuration option for header-aware selectors
- [ ] Modify selector generation to use `:nth-child(of :not([slot="header"]))`
- [ ] Update layout JSON schema documentation
- [ ] Regenerate layout.css

### Phase 3: Documentation

- [ ] Update AGENTS.md with header slot usage
- [ ] Update base.md with new attributes
- [ ] Add examples to demo pages

---

## Impact Assessment

| Change | Effort | Risk |
|--------|--------|------|
| Add `[slot="header"]` base styles | Low | None |
| Add CSS custom properties | Low | None |
| Modify selector generation | Medium | Low (additive) |
| Update documentation | Low | None |

### Selector Performance

`:nth-child(3n+3 of :not([slot="header"]))` adds complexity but:

- Filtering occurs once during style calculation
- Modern CSS engines optimize `:not()` efficiently
- Impact is negligible with typical element counts
- Only applies when `slot="header"` attribute is present

### CSS Size Impact

- Base styles: ~0.5 KB
- Selector change: ~10-15 bytes per selector
- Total for all layouts: ~2-3 KB additional

---

## Browser Support Summary

| Feature | Chrome | Firefox | Safari | Edge |
|---------|--------|---------|--------|------|
| `:nth-child(of S)` | 111+ | 113+ | 16.4+ | 111+ |
| `:has()` | 105+ | 121+ | 15.4+ | 105+ |
| `slot` attribute | All | All | All | All |

**Minimum browser versions for full support:** Chrome/Edge 111, Firefox 121, Safari 16.4

---

## Comparison Summary

| Option | Semantics | A11y | Flexibility | Recommended |
|--------|-----------|------|-------------|-------------|
| 1. `:nth-child(of S)` | Excellent | Excellent | High | **Yes** |
| 2. Slot + exclusion | Good | Good | Medium | Partial |
| 3. Pseudo-elements | Poor | Poor | Low | No |
| 4. Position absolute | Good | Good | Medium | Fallback |
| 5. Display contents | Good | Good | Medium | No |

**Final Recommendation:** Implement Option 1 using the `:nth-child(An+B of S)` selector. Browser support is now sufficient (2023+), and it provides the cleanest semantic solution while maintaining full backwards compatibility with existing layouts.
