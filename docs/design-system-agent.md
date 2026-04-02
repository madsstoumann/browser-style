# Browser Style v4 — Design System Agent Guide

> This document is the authoritative context for any Claude Code session working on the browser.style v4 design system refactor. Read this before making changes.

---

## Project Context

**browser.style** is a CSS-first component library with 148+ components. The v4 refactor introduces a comprehensive design token system aligned with Tailwind CSS v4 naming conventions, and converts CSS-only components into dual-mode npm packages (CSS-only + light DOM web component).

**Branch:** `v4`
**Author:** Mads Stoumann
**Key docs:**
- `AGENTS.md` — project architecture
- `docs/token-audit.md` — full audit of all 148 components
- `docs/token-comparison.md` — naming comparison vs Tailwind v4 and Open Props
- `.claude/skills/component-to-package/SKILL.md` — step-by-step conversion skill

---

## Design Token System

### Source of truth: `ui/base/core.css`

All global tokens are defined in `:root` inside `@layer bs-core`. The system covers 18 categories:

| Category | Pattern | Example |
|----------|---------|---------|
| Colors (semantic) | `--color-{name}` | `--color-accent`, `--color-surface`, `--color-overlay` |
| Font family | `--font-{name}` | `--font-body`, `--font-mono` |
| Font size | `--font-size-{step}` | `--font-size-base`, `--font-size-3xl`, `--font-size-9xl` |
| Font size (fluid) | `--font-size-fluid-{step}` | `--font-size-fluid-base` (uses `clamp()`) |
| Font weight | `--font-weight-{name}` | `--font-weight-bold`, `--font-weight-medium` |
| Line height | `--line-height-{name}` | `--line-height-tight`, `--line-height-normal` |
| Letter spacing | `--tracking-{name}` | `--tracking-tight`, `--tracking-wide` |
| Spacing | `--spacing-{size}` | `--spacing-sm` (0.5rem), `--spacing-2xl` (3rem) |
| Border width | `--border-width{-modifier}` | `--border-width` (1px), `--border-width-thick` (2px) |
| Border radius | `--radius-{size}` | `--radius-md`, `--radius-circle`, `--radius-pill` |
| Shadows | `--shadow-{size}` | `--shadow-sm`, `--shadow-xl` |
| Duration | `--duration-{speed}` | `--duration-fast` (100ms), `--duration-slower` (400ms) |
| Easing | `--ease-{name}` | `--ease-default`, `--ease-in-out` |
| Blur | `--blur-{size}` | `--blur-sm` (4px), `--blur-lg` (24px) |
| Z-index | `--z-index-{n}` | `--z-index-1` (1) through `--z-index-5` (1000) |
| Opacity | `--opacity-{name}` | `--opacity-disabled` (0.5) |
| Ring / focus | `--ring-{property}` | `--ring-width` (2px), `--ring-offset` (3px), `--ring-color` |
| Content widths | `--width-{size}` | `--width-sm` (24rem), `--width-prose` (65ch) |

### Three-tier token architecture

```
Component Token  -->  Global Semantic Token  -->  Hardcoded Fallback
--ui-card-bg         var(--color-surface,         hsl(0, 0%, 100%))
```

Every component token MUST have a fallback chain ending in a hardcoded value. This ensures components work standalone without `core.css`.

### Naming rules

- **Tailwind v4 compatible**: Names match Tailwind where a convention exists
- **Full readable names**: `--ui-accordion-border-width`, never `--ui-accordion-bdw`
- **Component prefix**: `--ui-{component}-{property}`
- **No PascalCase**: Legacy `--AccentColor` etc. are aliased but never used in new code
- **`ch` values are NOT tokenized**: Content-relative `ch` units stay as-is in components

### Legacy aliases

`core.css` still contains PascalCase aliases (`--AccentColor: var(--color-accent)`, etc.) for backward compatibility. Many components still reference these. During refactoring:
- Replace PascalCase references with new token names
- Do NOT remove the aliases from `core.css` — they stay until all components are migrated

---

## Base Package Files

| File | Purpose |
|------|---------|
| `ui/base/core.css` | Global tokens, CSS reset, element styles |
| `ui/base/form.css` | Form normalization, focus styles using `--ring-*` tokens |
| `ui/base/button.css` | Button styles (extracted from form.css), focus ring tokens |
| `ui/base/utility.css` | Utility classes (`bg-*`, `c-*`, layout helpers) |
| `ui/base/webcomponents.css` | Base styles for web component patterns |
| `ui/base/index.css` | Entry point importing all modules |

---

## Component Conversion Process

Use the `/component-to-package` skill to convert components. It handles:

1. Audit existing CSS/JS/HTML
2. Refactor tokens (three-tier with fallbacks)
3. Rename PascalCase properties
4. Wrap in `@layer bs-component` with `:where()` selectors
5. Create `<ui-{component}>` custom element (light DOM, no Shadow DOM)
6. Create `package.json` with dual exports
7. Write `readme.md` with framework examples
8. Update demo HTML

### Key patterns

**CSS selectors** — target the custom element directly, not classes:
```css
:where(ui-badge) { /* base styles */ }
```

**Variants** — use `variant` attribute (not `--` classes) on the custom element:
```html
<ui-badge color="success" variant="inline text">new</ui-badge>
```

**Semantic attributes** — use `color` for semantic colors (info, success, warning, error):
```css
&[color="info"] { --ui-badge-bg: var(--color-info, hsl(210, 60%, 46%)); }
```

**Parent propagation** — parent element propagates shared state to children:
```js
for (const child of this.children) { /* iterate direct children only */ }
```

**Security** — never `innerHTML` with user data. Use `createElement` + `textContent`.

---

## Components Already Converted

| Component | Version | Notes |
|-----------|---------|-------|
| `accordion` | 4.0.0 | Reference implementation. Parent/item pattern, variant attributes, exclusive open via `name` |
| `badge` | 3.0.0 | Simple single-element. `color` attribute for semantic colors, `variant` for positioning |

---

## Components Needing Refactoring (by priority)

From `docs/token-audit.md`, ranked by hardcoded value count:

### High priority (12+ hardcoded values)
- `chronology` — font-size, font-weight, line-height, gap, color
- `dock` — shadow, blur, spacing, color
- `menu` / `menu-details` — duration, gap, color, shadow
- `calculator` — font-size, font-weight, radius, gap, color
- `periodic-table` — font-size, font-weight, gap, 10 hex colors
- `reaction` — font-size, padding, duration, radius, scale
- `progress-meter` — font-size, radius, padding, color
- `slideshow` — font-size, font-weight, opacity, color
- `video-list` — duration, opacity, color, blur
- `blockquote` — font-size, line-height, padding, margin
- `syntax` — padding, font-weight, radius, 3 hex colors
- `cinema` / `flight` — font-size, radius, border-width, opacity

### Medium priority (8–12 hardcoded values)
- `chat`, `card-expand`, `card-flip`, `context-menu`, `drawer`, `expand-feature`
- `notification`, `pagination`, `product-card`, `tabs`, `timeline`, `tooltip`

### Common patterns to watch for
- `rgba(0,0,0,.25)` / `color-mix(CanvasText, transparent)` → use `--color-overlay` / `--color-overlay-light`
- `backdrop-filter: blur(10px)` → use `--blur-md`
- `box-shadow: 0 0 0 2px` (focus rings) → use `--ring-width` and `--ring-color`
- `border: 1px solid` → use `--border-width`
- `font-weight: 700` → use `--font-weight-bold`
- `transition: .2s ease-in-out` → use `--duration-normal` and `--ease-in-out`
- `max-inline-size: 1200px` → use `--width-7xl` (80rem)
- `z-index: 1` → use `--z-index-1`

---

## Content Width Token Mapping

Components with hardcoded `max-width`/`max-inline-size` should use `--width-*` tokens:

| Hardcoded Value | Closest Token | Used In |
|-----------------|---------------|---------|
| `300px` (18.75rem) | `--width-xs` (20rem) | calendar, color-grid |
| `320px` (20rem) | `--width-xs` (20rem) | range-arc, range-circular, range-gauge, range-mask |
| `30em` (480px) | `--width-md` (28rem) or `--width-lg` (32rem) | chat |
| `1200px` (75rem) | `--width-7xl` (80rem) | menu, menu-details |

---

## What NOT to Do

1. **Don't tokenize `ch` values** — they are content-relative by design and already the right abstraction
2. **Don't tokenize CSS keywords** — `smaller`, `small`, `larger` are already relative
3. **Don't tokenize animation endpoints** — `opacity: 0` and `opacity: 1` have no semantic meaning as tokens
4. **Don't tokenize `cqi` values** — container-query units must stay component-level
5. **Don't tokenize domain-specific colors** — planet colors, mood emoji colors, periodic table element colors stay as component-level custom properties
6. **Don't use Shadow DOM** — all new web components use light DOM for framework compatibility
7. **Don't use `innerHTML` with attribute/user values** — XSS risk. Use `createElement` + `textContent`
8. **Don't use `querySelectorAll` without scoping** — leaks into nested components. Use `:scope >` or iterate `this.children`
9. **Don't define variant tokens in multiple selectors** — consolidate class-based and attribute-based into one rule
10. **Don't remove legacy aliases from core.css** — they stay until all components are migrated

---

## Workflow for New Sessions

1. **Read this file** and `docs/token-audit.md` for context
2. **Check the `v4` branch** — all work happens here
3. **Use `/component-to-package <name>`** to convert a component
4. **Run `/simplify`** after converting JS components to catch security/quality issues
5. **Commit with descriptive messages** referencing what changed and why
6. **Push to `v4`** branch

---

## File Reference

```
ui/base/
├── core.css              Global design tokens (source of truth)
├── form.css              Form styles + focus ring tokens
├── button.css            Button styles (extracted from form.css)
├── utility.css           Utility classes
├── webcomponents.css     Web component base styles
└── index.css             Entry point

docs/
├── design-system-agent.md   This file
├── token-audit.md           Audit of all 148 components
└── token-comparison.md      Naming comparison vs Tailwind/Open Props

.claude/skills/
└── component-to-package/    Skill for converting components
    └── SKILL.md
```
