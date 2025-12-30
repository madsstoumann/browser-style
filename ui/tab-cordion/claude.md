# Tab-Cordion Component - Internal Architecture

## Overview

Tab-Cordion is a **pure CSS hybrid component** that automatically transforms between accordion and tabs layouts based on container width. It requires no JavaScript—all behavior is achieved through modern CSS Container Queries and CSS Anchor Positioning.

**Package Type:** Pure CSS (no JavaScript)

**Package Version:** 1.0.0

**Total LOC:** ~486 lines across 7 CSS files

**Key architectural decisions:**
- **Container Queries**: Responsive transformation at 700px container width
- **CSS Anchor Positioning**: Sliding tab indicator tracks active tab
- **Token-based attributes**: Space-separated tokens control appearance
- **CSS-only state**: Index counting and tab tracking via `:nth-child()` selectors
- **Native accessibility**: Built on `<details>` and `<summary>` elements

## Architecture Overview

### Transformation Flow

```
Container width < 700px          Container width >= 700px
        ↓                                   ↓
   Accordion Mode                      Tabs Mode
        ↓                                   ↓
  `from` tokens apply             `to` tokens apply
        ↓                                   ↓
  Vertical stacking               Horizontal tab bar
        ↓                                   ↓
  Content expands below           Panel below all tabs
```

### CSS Layer Cascade

```css
/* index.css:14 - Layer order defines specificity */
@layer components.tab-cordion.base,      /* Host styles, custom properties */
       components.tab-cordion.state,     /* Item indexing, tab counting */
       components.tab-cordion.accordion, /* Accordion variants */
       components.tab-cordion.tabs,      /* Tabs transformation */
       components.tab-cordion.transitions, /* Hover effects */
       components.tab-cordion.fixes;     /* Safari/WebKit workarounds */
```

## File Structure

```
tab-cordion/
├── index.css        21 lines    Layer imports and documentation
├── css/
│   ├── base.css     120 lines   Host styles, custom properties
│   ├── state.css    30 lines    Item indexing (1-8)
│   ├── accordion.css 174 lines  Accordion token variants
│   ├── tabs.css     282 lines   Tabs transformation
│   ├── transitions.css 69 lines Hover effects
│   └── fixes.css    21 lines    Safari/WebKit fixes
├── index_v0.css     ---         Legacy version
├── demo.html        ---         Live examples
└── claude.md        ---         This file
```

## HTML Structure

```html
<tab-cordion from="[accordion-tokens]" to="[tabs-tokens]">
  <cq-box>
    <details name="group" open>
      <summary>Tab Title <ui-icon type="chevron"></ui-icon></summary>
      <div class="content">Panel content here</div>
    </details>
    <details name="group">
      <summary>Another Tab</summary>
      <div class="content">More content</div>
    </details>
    <!-- Up to 8 items supported -->
  </cq-box>
</tab-cordion>
```

### Key Elements

| Element | Purpose | Required |
|---------|---------|----------|
| `<tab-cordion>` | Root container with `container-type: inline-size` | Yes |
| `<cq-box>` | Grid container managing layout transformation | Yes |
| `<details>` | Each accordion/tab item | Yes |
| `<summary>` | Clickable header/tab button | Yes |
| `<ui-icon>` | Optional icon in header | No |

## CSS Custom Properties Reference

### File: [css/base.css](css/base.css)

#### Accent and Colors (Lines 10-62)

```css
/* Lines 10-11 */
--tc-accent: light-dark(hsl(210, 100%, 45%), hsl(210, 100%, 75%));

/* Lines 13-16 - Borders */
--tc-item-bdc: light-dark(hsl(0 0% 80%), hsl(0 0% 30%));
--tc-item-bdc-open: light-dark(hsl(0 0% 60%), hsl(0 0% 40%));
--tc-item-bdrs: 1em;
--tc-item-bdrs-separate: 1.5em;

/* Lines 17-21 - Border widths and shadows */
--tc-item-bdw: 1px;
--tc-item-bdw-open: 2px;
--tc-item-bxsh: 0 0 1px 0 rgba(0, 0, 0, .07), ...;
--tc-item-bxsh-open: 0 0 2px 0 rgba(0, 0, 0, .14), ...;

/* Lines 22-31 - Tabs-specific borders */
--tc-tabs-bdrs: 3em;
--tc-tabs-bdw: 4px;
--tc-tabs-container-bdrs: 1em;
--tc-tabs-item-bdc: light-dark(#FFF, rgba(255, 255, 255, .30));
--tc-tabs-item-bdw: 1px;
--tc-tabs-line-bdw: 3px;
--tc-tabs-line-bdc: light-dark(#EEE, #555);
--tc-tabs-mw: 1024px;
--tc-tabs-panel-bxsh: 0 8px 18px -12px rgba(0, 0, 0, .35), ...;

/* Lines 49-53 - Background colors */
--tc-bg: light-dark(#EEE, #222527);
--tc-hover-bg: light-dark(hsl(210, 100%, 95%), hsl(210, 50%, 15%));
--tc-item-bg-active: light-dark(rgba(255, 255, 255, .5), rgba(255, 255, 255, .14));
--tc-tabs-bg: light-dark(#EAEAEA, #222527);
--tc-tabs-panel-bg: light-dark(#f7f7f7, #1c1c1c);

/* Lines 55-62 - Hover states */
--tc-from-hover-bg: var(--tc-hover-bg);
--tc-from-hover-accent: var(--tc-accent);
--tc-to-hover-bg: light-dark(rgba(0, 0, 0, 0.05), rgba(255, 255, 255, 0.1));
--tc-to-hover-accent: var(--tc-accent);
--tc-to-hover-line: light-dark(#CCC, #888);
```

#### Spacing (Lines 33-46)

```css
/* Lines 34-39 */
--tc-breakout-unit: 1rem;
--tc-group-rg: 1em;
--tc-item-p: 1.25ch 1.5ch;
--tc-item-p-separate: 1.5ch 2.5ch;
--tc-item-p-tabs: 1.25ch;
--tc-item-trsdu: 300ms;

/* Lines 41-46 - Panel spacing */
--tc-panel-fs: inherit;
--tc-panel-pb: 0 2ch;
--tc-panel-pi: 1.5ch;
--tc-tabs-panel-pb: 2ch;
--tc-tabs-panel-pi: 1.5ch;
```

#### Host Base Styles (Lines 64-91)

```css
/* Lines 65-67 */
container-type: inline-size;
display: block;
interpolate-size: allow-keywords;

/* Lines 73-91 - Details content animation */
details {
  &::details-content {
    block-size: 0;
    content-visibility: hidden;
    transition: block-size var(--tc-item-trsdu),
                content-visibility var(--tc-item-trsdu),
                padding-block var(--tc-item-trsdu);
    transition-behavior: allow-discrete;
  }
  &[open]::details-content {
    block-size: auto;
    content-visibility: visible;
  }
}
```

## State Management (CSS-Only)

### File: [css/state.css](css/state.css)

#### Item Indexing (Lines 13-20)

```css
/* Each details element receives its index as a CSS custom property */
details:nth-child(1) { --tab-cordion-index: 1; }
details:nth-child(2) { --tab-cordion-index: 2; }
details:nth-child(3) { --tab-cordion-index: 3; }
details:nth-child(4) { --tab-cordion-index: 4; }
details:nth-child(5) { --tab-cordion-index: 5; }
details:nth-child(6) { --tab-cordion-index: 6; }
details:nth-child(7) { --tab-cordion-index: 7; }
details:nth-child(8) { --tab-cordion-index: 8; }
```

#### Tab Counting (Lines 22-29)

```css
/* Parent container counts children for grid column count */
cq-box:has(> details:nth-child(1):last-child) { --tab-cordion-tabs: 1; }
cq-box:has(> details:nth-child(2):last-child) { --tab-cordion-tabs: 2; }
cq-box:has(> details:nth-child(3):last-child) { --tab-cordion-tabs: 3; }
/* ... up to 8 */
```

**Usage:** The `--tab-cordion-tabs` variable powers the grid layout:
```css
grid-template-columns: repeat(var(--tab-cordion-tabs, 6), 1fr);
```

## Accordion Variants (`from` attribute)

### File: [css/accordion.css](css/accordion.css)

#### Container Background (Lines 20-25)

```css
&:where([from~="cnt-bg"]) {
  cq-box {
    background: var(--tc-bg);
    padding: var(--tc-bg-p, 1.5ch);
  }
}
```

#### Breakout Variant (Lines 27-64)

```css
&:where([from~="itm-breakout"]) {
  details[open]:not(:first-of-type),
  details[open]:first-of-type~details {
    --_y: 1;  /* Translate down by 1 unit */
  }
  details[open]~details {
    --_y: 2;  /* Siblings translate down by 2 units */
  }

  /* Elevated sub-variant (Lines 48-63) */
  &:where([from~="itm-elevated"]) {
    --tc-item-bdw-open: 0px;
    details[open] {
      box-shadow: var(--tc-item-bxsh-open);
    }
  }
}
```

**Translation mechanism (base.css:75):**
```css
details {
  translate: 0 calc(var(--_y) * var(--tc-breakout-unit));
}
```

#### Separate Variant (Lines 66-85)

```css
&:where([from~="itm-separate"]) {
  cq-box {
    row-gap: var(--tc-group-rg);
  }
  details {
    --_y: 0;  /* Disable breakout translation */
    border: var(--tc-item-bdw) solid var(--tc-item-bdc);
  }
}
```

#### Container Border (Lines 87-110)

```css
&:where([from~="cnt-border"]) {
  details {
    border-inline: var(--tc-item-bdw) solid var(--tc-item-bdc);
  }
  details:first-of-type {
    border-block-start: var(--tc-item-bdw) solid var(--tc-item-bdc);
  }
  details:last-of-type {
    border-block-end: var(--tc-item-bdw) solid var(--tc-item-bdc);
  }
}
```

#### Divided Variant (Lines 112-117)

```css
&:where([from~="itm-divided"]) {
  details {
    border-block-end: var(--tc-item-bdw) solid var(--tc-item-bdc);
  }
}
```

#### Rounded Variant (Lines 119-173)

```css
&:where([from~="rounded"]) {
  /* Non-breakout: first/last items rounded */
  &:where(:not([from~="itm-breakout"])) {
    details:first-of-type { border-top-*-radius: var(--tc-item-bdrs); }
    details:last-of-type { border-bottom-*-radius: var(--tc-item-bdrs); }
  }

  /* Breakout: dynamic rounding based on open state */
  &:where([from~="itm-breakout"]) {
    details[open]+details { border-top-*-radius: var(--tc-item-bdrs); }
    details:has(+ details[open]) { border-bottom-*-radius: var(--tc-item-bdrs); }
    [open] { border-radius: var(--tc-item-bdrs); }
  }

  /* Separate: all items fully rounded */
  &:where([from~="itm-separate"]) {
    details, details summary {
      border-radius: var(--tc-item-bdrs-separate);
    }
  }
}
```

### Accordion Token Reference

| Token | Effect | Lines |
|-------|--------|-------|
| `cnt-bg` | Container background color | 20-25 |
| `cnt-border` | Border around entire group | 87-110 |
| `itm-breakout` | Open items "break out" via translation | 27-64 |
| `itm-elevated` | Shadow instead of border (requires breakout) | 48-63 |
| `itm-separate` | Cards with gaps between | 66-85 |
| `itm-divided` | Separator lines between items | 112-117 |
| `rounded` | Rounded corners | 119-173 |

## Tabs Transformation (`to` attribute)

### File: [css/tabs.css](css/tabs.css)

#### Container Query Trigger (Line 15)

```css
&[to] {
  @container (width >= 700px) {
    /* Tabs mode styles */
  }
}
```

#### Grid Layout (Lines 16-25)

```css
cq-box {
  grid-template-columns: repeat(var(--tab-cordion-tabs, 6), 1fr);
  grid-template-rows: auto 1fr;
  isolation: isolate;
  margin-inline: auto;
  max-width: var(--tc-tabs-mw);
}
```

#### Anchor Positioning Indicator (Lines 27-39)

```css
cq-box::after {
  block-size: anchor-size(--tab-active height);
  inline-size: anchor-size(--tab-active width);
  inset-block-start: 0;
  inset-inline-start: anchor(--tab-active left);
  position: absolute;
  transition: inset-inline-start var(--tc-item-trsdu) ease,
              inline-size var(--tc-item-trsdu) ease;
}

/* Active tab sets anchor name (Line 60-62) */
details[open] summary {
  anchor-name: --tab-active;
}
```

#### Subgrid Layout (Lines 47-57)

```css
details {
  display: grid;
  grid-column: 1 / -1;
  grid-row: 1 / span 2;
  grid-template-columns: subgrid;
  grid-template-rows: subgrid;
  pointer-events: none;
}
```

### Tabs Token Reference

| Token | Effect | Lines |
|-------|--------|-------|
| `tab-bg` | Background on tab header area | 93-101 |
| `tab-bleed` | Full-width panel bleeding past container | 103-119 |
| `tab-compact` | Tabs compress to intrinsic width | 121-136 |
| `tab-line` | Line below tab headers | 138-146 |
| `tab-no-icons` | Hide icons in tabs | 148-153 |
| `tab-rounded` | Round tab container edges | 155-180 |
| `ind-accent` | Accent color on active tab text | 182-187 |
| `ind-bg` | Background fill on indicator | 189-194 |
| `ind-bd` | Border on indicator | 196-201 |
| `ind-gap` | Inset indicator with padding | 203-211 |
| `ind-line` | Underline indicator instead of pill | 213-220 |
| `ind-rounded` | Round all tab buttons | 222-234 |
| `pnl-bg` | Background on content panel | 236-241 |
| `pnl-elevated` | Shadow under content panel | 243-248 |
| `cnt-border` | Border around entire tabs container | 250-273 |

## Hover Effects

### File: [css/transitions.css](css/transitions.css)

#### Accordion Hover (Lines 10-30)

```css
/* Non-transforming accordion */
&:not([to])[from~="hvr-bg"] details:hover:not([open]) {
  background: var(--tc-from-hover-bg);
}

&:not([to])[from~="hvr-accent"] details:hover:not([open]) {
  color: var(--tc-from-hover-accent);
}

/* Accordion mode when tabs available but narrow */
@container (width <=700px) {
  @media (hover: hover) {
    &[from~="hvr-bg"] details:hover:not([open]) {
      background: var(--tc-from-hover-bg);
    }
  }
}
```

#### Tabs Hover (Lines 32-68)

```css
@container (width >=700px) {
  @media (hover: hover) {
    /* Background hover */
    &[to~="hvr-bg"] details:not([open]) summary:hover {
      background: var(--tc-to-hover-bg);
    }

    /* Accent color hover */
    &[to~="hvr-accent"] summary:hover {
      color: var(--tc-to-hover-accent);
    }

    /* Underline hover (Lines 52-66) */
    &[to~="hvr-line"] {
      details:not([open]) summary::after {
        border-block-end: var(--tc-tabs-line-bdw) solid var(--tc-to-hover-line);
        opacity: 0;
        transition: opacity var(--tc-item-trsdu) ease;
      }
      details:not([open]) summary:hover::after {
        opacity: 1;
      }
    }
  }
}
```

### Hover Token Reference

| Token | Mode | Effect |
|-------|------|--------|
| `hvr-bg` | Both | Background color on hover |
| `hvr-accent` | Both | Text color change on hover |
| `hvr-line` | Tabs only | Underline appears on hover |

## Browser Fixes

### File: [css/fixes.css](css/fixes.css)

#### Safari/WebKit `::details-content` Fix (Lines 9-19)

```css
@supports (background: -webkit-named-image(i)) {
  tab-cordion {
    details[open]::details-content {
      display: contents;
    }
    details > summary + * {
      grid-column: 1 / -1;
      grid-row: 2;
      pointer-events: auto;
    }
  }
}
```

**Problem:** Safari doesn't properly handle `::details-content` in grid subgrid contexts.

**Solution:** Use `display: contents` on the pseudo-element and apply grid positioning to the actual content element.

## Modern CSS Features Required

| Feature | Location | Browser Support |
|---------|----------|-----------------|
| Container Queries | tabs.css:15 | Chrome 105+, Safari 16+, Firefox 110+ |
| CSS Anchor Positioning | tabs.css:27-39 | Chrome 125+, Edge 125+ |
| CSS Nesting | All files | Chrome 120+, Safari 17.2+, Firefox 117+ |
| `:has()` selector | accordion.css:59, state.css:22-29 | Chrome 105+, Safari 15.4+, Firefox 121+ |
| `::details-content` | base.css:77-90 | Chrome 131+, Safari 17.2+, Firefox 131+ |
| `interpolate-size` | base.css:67 | Chrome 129+, Safari 18.1+ |
| `light-dark()` | base.css:11,13-16,49-62 | Chrome 123+, Safari 17.5+, Firefox 120+ |
| Subgrid | tabs.css:55-56 | Chrome 117+, Safari 16+, Firefox 71+ |

## Usage Examples

### Basic Accordion (No Transformation)

```html
<tab-cordion from="cnt-border itm-divided rounded">
  <cq-box>
    <details name="faq" open>
      <summary>Question 1</summary>
      <div>Answer 1</div>
    </details>
    <details name="faq">
      <summary>Question 2</summary>
      <div>Answer 2</div>
    </details>
  </cq-box>
</tab-cordion>
```

### Cards That Transform to Pills

```html
<tab-cordion
  from="itm-separate itm-elevated rounded hvr-bg"
  to="ind-bg ind-rounded hvr-bg">
  <cq-box><!-- details items --></cq-box>
</tab-cordion>
```

### Minimal Line Tabs

```html
<tab-cordion
  from="cnt-bg itm-divided"
  to="tab-compact tab-line ind-line hvr-line hvr-accent">
  <cq-box><!-- details items --></cq-box>
</tab-cordion>
```

### Full-Featured

```html
<tab-cordion
  from="cnt-bg cnt-border itm-divided rounded hvr-bg hvr-accent"
  to="tab-bg tab-rounded ind-bg ind-gap pnl-bg pnl-elevated hvr-bg hvr-accent">
  <cq-box><!-- details items --></cq-box>
</tab-cordion>
```

## Gotchas & Edge Cases

### 1. Maximum 8 Items (state.css:13-29)

The CSS hardcodes indices 1-8. To support more items:
```css
/* Add to state.css */
details:nth-child(9) { --tab-cordion-index: 9; }
cq-box:has(> details:nth-child(9):last-child) { --tab-cordion-tabs: 9; }
```

### 2. Container Width Not Viewport Width

The 700px breakpoint is based on **container width**, not viewport:
```css
@container (width >= 700px) { /* Tabs mode */ }
```

If the parent element is narrow, tabs won't appear even on wide screens.

### 3. Anchor Positioning Fallback

CSS Anchor Positioning (Chrome 125+) lacks broad support. Without it, the sliding indicator won't animate. Consider a JS polyfill for wider support.

### 4. Named `<details>` Behavior

The `name` attribute on `<details>` creates accordion behavior (only one open at a time). This is native HTML5 behavior, not CSS.

### 5. Hover Pseudo-element Trick (transitions.css:52-66)

The hover line effect uses opacity transition because you can't transition a pseudo-element into existence:
```css
/* Always exists, but invisible */
summary::after { opacity: 0; }
/* Visible on hover */
summary:hover::after { opacity: 1; }
```

### 6. Breakout Translation Stacking

When using `itm-breakout`, the `--_y` variable cascades to siblings:
- Open item: `--_y: 0` (no translation)
- Siblings before: `--_y: 0`
- Siblings after: `--_y: 1` or `--_y: 2`

This creates the "push down" effect.

### 7. Dark Mode via `light-dark()`

All colors use `light-dark()` for automatic dark mode. The parent must set `color-scheme`:
```css
:root { color-scheme: light dark; }
```

### 8. Content Visibility Performance

`content-visibility: hidden` on closed details improves performance by skipping rendering. The transition behavior `allow-discrete` ensures smooth state changes.

### 9. Panel Content Selector

Content panel styles use `summary + *` selector to target the immediate sibling:
```css
summary + * {
  padding-block: var(--tc-tabs-panel-pb);
}
```

This means the first element after `<summary>` is the panel.

### 10. Icon Component Dependency

The component expects `<ui-icon>` from the icon package:
```css
@import "/ui/icon/index.css";  /* base.css:1 */
```

## Debugging Tips

1. **Tabs not appearing?** Check container width is >= 700px and `to` attribute exists
2. **Indicator not sliding?** Verify CSS Anchor Positioning browser support
3. **Items not counting?** Check `:nth-child()` rules support your item count
4. **Hover not working?** Check `@media (hover: hover)` support and correct tokens
5. **Content not animating?** Check `interpolate-size: allow-keywords` support
6. **Safari issues?** Verify fixes.css is loaded (Safari needs `display: contents` fix)
7. **Wrong mode active?** Inspect computed `--tab-cordion-tabs` on `cq-box`

## Related Components

- [ui-icon](../icon/) - Icon component for tab headers
