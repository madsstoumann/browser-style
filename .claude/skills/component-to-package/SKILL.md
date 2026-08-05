---
name: component-to-package
description: Convert an existing browser-style CSS component into a dual-mode npm package (CSS-only + web component) with proper design tokens, fallback chains, package.json, and readme.
argument-hint: <component-name>
allowed-tools: Read, Write, Edit, Bash, Glob, Grep, AskUserQuestion
---

# Component-to-Package Skill

Convert an existing `ui/<component>` CSS component into a publishable dual-mode npm package: **CSS-only** for vanilla/server-rendered use, and a **light DOM web component** for framework integration.

**Reference implementation:** `ui/accordion/` — all patterns below are modeled on it.

### Design philosophy

The visual language is neutral — no strong brand color bias, no opinionated aesthetic. Components should feel like natural extensions of the browser's default UI, enhanced with consistent spacing, typography, and subtle depth. Light and dark modes are supported natively via `light-dark()` and `color-scheme: light dark`.

## Input

`$ARGUMENTS` is the component name (e.g., `tabs`, `card`, `tooltip`). The source lives at `ui/$ARGUMENTS/`.

---

## Step-by-step process

### 1. Audit the existing component

Read all files in `ui/$ARGUMENTS/`:

- **CSS files**: Identify all custom properties, class names, selectors, variants
- **JS files**: Identify existing web component (if any), Shadow DOM vs Light DOM
- **HTML files**: Identify demo markup patterns and variants
- **package.json**: Check if one already exists, note current version

Use `AskUserQuestion` to confirm:
- Which variants/modifiers should be preserved?
- Are there any dependencies on other components (icons, shared utils)?
- Should the component use Shadow DOM or Light DOM? (Default: Light DOM)

### 2. Refactor design tokens (two-tier architecture)

Since `@browser.style/base` is a required peer dependency for all components, global tokens from `ui/base/tokens.css` are always available. No hardcoded fallbacks are needed when referencing global tokens — only component-level tokens that introduce new values need fallbacks.

```
Component Token --> Global Semantic Token (from tokens.css)
```

#### 2a. Identify global tokens from `ui/base/tokens.css`

Available global tokens (defined in `:root`). Full reference: `DESIGN.md`.

| Category | Tokens |
|----------|--------|
| **Colors** | `--color-accent`, `--color-accent-dark`, `--color-accent-text`, `--color-border`, `--color-button`, `--color-button-text`, `--color-surface`, `--color-surface-alt`, `--color-text`, `--color-field`, `--color-text-muted`, `--color-highlight`, `--color-link`, `--color-mark`, `--color-mark-text`, `--color-link-visited`, `--color-info`, `--color-error`, `--color-success`, `--color-warning`, `--color-overlay`, `--color-overlay-light` |
| **Font family** | `--font-body`, `--font-form`, `--font-heading`, `--font-mono`, `--font-serif` |
| **Font size** | `--font-size-xs` .. `--font-size-9xl` (13 steps), `--font-size-fluid-xs` .. `--font-size-fluid-4xl` (8 clamp-based) |
| **Font weight** | `--font-weight-thin` (100), `--font-weight-light` (300), `--font-weight-normal` (400), `--font-weight-medium` (500), `--font-weight-semibold` (600), `--font-weight-bold` (700), `--font-weight-black` (900) |
| **Line height** | `--line-height-none` (1), `--line-height-tight` (1.1), `--line-height-snug` (1.25), `--line-height-normal` (1.5), `--line-height-relaxed` (1.625), `--line-height-loose` (2) |
| **Letter spacing** | `--tracking-tighter` (-0.05em) .. `--tracking-widest` (0.1em) — 6 steps |
| **Spacing** | `--spacing-xs` (0.25rem), `--spacing-sm` (0.5rem), `--spacing-md` (1rem), `--spacing-lg` (1.5rem), `--spacing-xl` (2rem), `--spacing-2xl` (3rem) |
| **Border width** | `--border-width` (1px), `--border-width-thick` (2px), `--border-width-heavy` (3px) |
| **Radius** | `--radius-xs` (0.125rem) .. `--radius-4xl` (2rem), `--radius-circle` (50%), `--radius-pill` |
| **Shadows** | `--shadow-sm`, `--shadow-md`, `--shadow-lg`, `--shadow-xl` |
| **Duration** | `--duration-fast` (100ms), `--duration-normal` (200ms), `--duration-slow` (300ms), `--duration-slower` (400ms) |
| **Easing** | `--ease-default`, `--ease-in`, `--ease-out`, `--ease-in-out` |
| **Blur** | `--blur-sm` (4px), `--blur-md` (12px), `--blur-lg` (24px) |
| **Z-index** | `--z-index-1` (1), `--z-index-2` (10), `--z-index-3` (100), `--z-index-4` (500), `--z-index-5` (1000) |
| **Opacity** | `--opacity-disabled` (0.5) |
| **Ring / focus** | `--ring-width` (2px), `--ring-offset` (3px), `--ring-color` (accent) |
| **Content widths** | `--width-xs` (20rem) .. `--width-7xl` (80rem), `--width-prose` (65ch) |

#### 2b. Define component tokens

Naming convention: `--ui-[component]-[property]`.

**Inline vs. declared:** Only declare a component token as a custom property at the top of the component rule block when it is **referenced more than once** (e.g., by variants, pseudo-classes, or child selectors). If a token is used only once, apply it directly on the CSS property:

```css
/* Single-use — inline, no separate declaration needed */
background: var(--ui-chip-bg, var(--color-button));
border-radius: var(--ui-chip-bdrs, 3ch);
color: var(--ui-chip-c, inherit);

/* Multi-use — declared at top, referenced by variants */
--ui-badge-bg: var(--color-text);
--ui-badge-border-color: transparent;
```

**Fallback rules:** Global tokens from `tokens.css` are always available (base is a required peer dep), so **no hardcoded fallback is needed** when referencing them. Only add a hardcoded fallback for component-specific values that don't come from a global token:

```css
/* Global token reference — no fallback needed */
border-color: var(--ui-component-border-color, var(--color-border));
duration: var(--ui-component-duration, var(--duration-slow));

/* Component-specific value — hardcoded fallback */
border-radius: var(--ui-chip-bdrs, 3ch);
padding: var(--ui-component-p, .5ch 2ch);
```

**Use CSS shorthand properties** where possible instead of separate longhand declarations:

```css
/* Good — shorthand */
border: var(--ui-badge-bdw, 1px) solid var(--ui-badge-border-color);
padding: var(--ui-component-p, .5ch 2ch);

/* Avoid — separate longhands when a shorthand suffices */
border-width: var(--ui-badge-bdw, 1px);
border-style: solid;
border-color: var(--ui-badge-border-color);
```

When a component needs a complex shorthand assembled from multiple tokens, use a **private custom property** (double-underscore prefix):

```css
--_border: var(--ui-accordion-border-width) var(--ui-accordion-border-style) var(--ui-accordion-border-color);
border: var(--_border);
```

Rules:
- **No fallbacks for global tokens** — `tokens.css` is always loaded via the required `@browser.style/base` peer dependency
- **Hardcoded fallbacks only** for component-specific values not sourced from a global token
- **Map to the closest global token** where one exists
- **Prefer shorthand** CSS properties (`border`, `padding`, `margin`, `gap`) over separate longhands
- **Reference `DESIGN.md`** for actual token values when needed

#### 2c. Rename any PascalCase properties

If the component uses old PascalCase tokens (--AccentColor, --Canvas, etc.), update to the new names:

| Old | New |
|-----|-----|
| `--AccentColor` | `--color-accent` |
| `--Canvas` | `--color-surface` |
| `--CanvasText` | `--color-text` |
| `--ButtonBorder` | `--color-border` |
| `--ButtonFace` | `--color-button` |
| `--Field` | `--color-field` |
| `--GrayText` | `--color-text-muted` |
| `--ff-body` | `--font-body` |
| `--ff-form` | `--font-form` |
| `--ff-mono` | `--font-mono` |

#### 2d. Common hardcoded-to-token replacements

When auditing the existing CSS, look for these common patterns:

| Hardcoded pattern | Replace with |
|-------------------|-------------|
| `rgba(0,0,0,.25)` / `color-mix(CanvasText, transparent)` | `--color-overlay` / `--color-overlay-light` |
| `backdrop-filter: blur(10px)` | `--blur-md` |
| `box-shadow: 0 0 0 2px` (focus rings) | `--ring-width` and `--ring-color` |
| `border: 1px solid` | `--border-width` |
| `font-weight: 700` | `--font-weight-bold` |
| `transition: .2s ease-in-out` | `--duration-normal` and `--ease-in-out` |
| `max-inline-size: 1200px` | `--width-7xl` (80rem) |
| `z-index: 1` | `--z-index-1` |

#### 2e. Content width mapping

Components with hardcoded `max-width`/`max-inline-size` should use `--width-*` tokens:

| Hardcoded value | Closest token | Common components |
|-----------------|---------------|-------------------|
| `300px` (18.75rem) | `--width-xs` (20rem) | calendar, color-grid |
| `320px` (20rem) | `--width-xs` (20rem) | range-arc, range-circular, range-gauge |
| `30em` (480px) | `--width-md` (28rem) or `--width-lg` (32rem) | chat |
| `1200px` (75rem) | `--width-7xl` (80rem) | menu, menu-details |

### 3. Refactor CSS

#### 3a. Wrap in `@layer bs-component`

```css
@layer bs-component {
  /* All component styles here */
}
```

#### 3b. Use `:where()` for zero-specificity base styles

For custom elements, target the element name directly. Multi-use tokens go at the top; single-use tokens go inline on their CSS property:

```css
:where(ui-badge) {
  /* Multi-use tokens — declared here because variants override them */
  --ui-badge-bg: var(--color-text);
  --ui-badge-border-color: transparent;

  /* Single-use tokens — inline, no fallback needed for global tokens */
  background: var(--ui-badge-bg);
  border: 1px solid var(--ui-badge-border-color);
  border-radius: var(--ui-badge-border-radius, var(--radius-circle));
  color: var(--ui-badge-color, var(--color-surface));
  display: inline-grid;
  font-size: var(--ui-badge-font-size, .675rem);
  height: var(--ui-badge-size, 1.5rem);
}
```

For components not yet converted to custom elements, use a class selector:

```css
:where(.ui-chip) {
  background: var(--ui-chip-bg, var(--color-button));
  border-radius: var(--ui-chip-bdrs, 3ch);
  color: var(--ui-chip-c, inherit);
}
```

#### 3c. Attribute sections with comments

Use `variant` attribute with space-separated values for custom elements. Use `data-variant` for native HTML elements where `variant` is not a valid attribute. Add a **short comment** above each attribute group:

```css
:where(ui-badge) {
  /* ... base styles ... */

  /* Colors */
  &[color="info"]    { --ui-badge-bg: var(--color-info); }
  &[color="success"] { --ui-badge-bg: var(--color-success); }
  &[color="warning"] { --ui-badge-bg: var(--color-warning); }
  &[color="error"]   { --ui-badge-bg: var(--color-error); }

  /* Variants */
  &[variant~="inline"] {
    position: static;
    translate: 0;
  }
  &[variant~="text"] {
    --ui-badge-border-radius: var(--radius-sm, 0.25em);
    height: auto;
    padding: .33ch .66ch;
  }
}
```

For complex components, variant selectors live **outside** the base `:where()` block at full specificity:

```css
/* === Variants === */

/* bordered */
ui-accordion[variant~="bordered"] {
  border: var(--_border);
  details { padding-inline: var(--ui-accordion-padding-inline); }
}

/* breakout */
ui-accordion[variant~="breakout"] { /* ... */ }

/* divided — shared by bordered/breakout/divided */
ui-accordion:is([variant~="bordered"], [variant~="breakout"], [variant~="divided"]) details:not(:last-of-type) {
  border-block-end: var(--_border);
}
```

Use `:is()` to combine related variant selectors that share rules. Never define the same tokens in multiple selectors.

**`data-variant` fallback for native elements:** When a component wraps a native HTML element (e.g., `<blockquote>`, `<table>`) rather than a custom element, use `data-variant` instead of `variant` to avoid validation warnings. Target both in CSS:

```css
:where(ui-quote):is([variant~="bordered"], [data-variant~="bordered"]) {
  /* variant styles */
}
```

#### 3d. Create `index.css`

```css
@import './ui-[component].css';
```

If the component depends on other component CSS (e.g., icons), import it:

```css
@import '../icon/index.css';
```

### 4. Create the wrapper element (CSS-only structural wrapper)

The custom element name (e.g., `<ui-tabs>`) serves as a plain HTML wrapper even without JavaScript:

```css
:where(ui-tabs) {
  display: block; /* or flex, grid as needed */
}
```

This element:
- Works as a structural grouping element in CSS-only mode
- Hosts variant attributes: `variant="pills"`, `no-collapse`, etc.
- Becomes a proper web component when JS is loaded

### 5. Handle container queries (`<cq-box>`)

If the component uses `container-type` on its wrapper element **and** has `@container` rules, it needs a `<cq-box>` inner wrapper (a container can't query its own size).

**CSS:** Target `> cq-box` inside `@container` rules:

```css
@container (inline-size > 650px) {
  :where(ui-[component][variant~="responsive"]) > cq-box {
    /* responsive layout */
  }
}
```

**CSS-only HTML:** Document that users must add `<cq-box>` manually.

**Web component JS:** Auto-insert `<cq-box>` when the relevant variant is set:

```javascript
ensureCqBox() {
  const needs = (this.getAttribute('variant') || '').includes('media');
  if (needs && !this.querySelector(':scope > cq-box')) {
    const box = document.createElement('cq-box');
    while (this.firstChild) box.appendChild(this.firstChild);
    this.appendChild(box);
  }
}
```

Call `ensureCqBox()` from `connectedCallback()` and when the `variant` attribute changes.

When propagating attributes to children, check for `cq-box` first:

```javascript
const container = this.querySelector(':scope > cq-box') || this;
for (const child of container.children) { /* ... */ }
```

Reference: `ui/accordion/` demonstrates this pattern fully (media variant).

### 6. Create the web component (Light DOM)

#### 5a. Pattern: parent + item components

```
<ui-[component]>          - Parent wrapper, propagates shared state
  <ui-[component]-item>   - Item, renders native HTML into light DOM
```

#### 5b. Implementation template

```javascript
/**
 * <ui-[component]> and <ui-[component]-item>
 * Light DOM web component wrappers for the CSS-first [component].
 * Renders native HTML elements - no Shadow DOM.
 * @version x.x.x
 */

class Ui[Component]Item extends HTMLElement {
  static observedAttributes = ['label', 'open', /* component-specific attrs */];

  connectedCallback() {
    if (!this.querySelector(/* expected native element */)) this.render();
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (oldValue === newValue || !this.isConnected) return;
    // Update existing DOM elements — never use innerHTML
  }

  render() {
    // Build native HTML using document.createElement
    // NEVER use innerHTML with user-supplied data (XSS risk)
    // Move existing children into content wrapper:
    // while (this.firstChild) { content.appendChild(this.firstChild); }
    // Append to this (light DOM, no shadow root)
  }
}

class Ui[Component] extends HTMLElement {
  static observedAttributes = ['name', /* shared attrs */];

  connectedCallback() {
    // Propagate shared attributes to children
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (oldValue !== newValue && this.isConnected) {
      // Re-propagate
    }
  }
}

customElements.define('ui-[component]-item', Ui[Component]Item);
customElements.define('ui-[component]', Ui[Component]);
export { Ui[Component], Ui[Component]Item };
```

#### 5c. Security rules

- **Never use `innerHTML`** with attribute values or user content
- Use `document.createElement` + `textContent` for safe DOM construction
- Use `:scope >` in `querySelector` to avoid leaking into nested components
- Iterate `this.children` (not `querySelectorAll`) when propagating to direct children only

#### 5d. Item element renders as `display: contents`

```css
:where(ui-[component]-item) {
  display: contents;
}
```

### 7. Create `package.json`

```json
{
  "name": "@browser.style/$ARGUMENTS",
  "version": "1.0.0",
  "description": "CSS-first $ARGUMENTS component with optional web component wrapper",
  "type": "module",
  "module": "index.js",
  "style": "index.css",
  "exports": {
    ".": {
      "import": "./index.js",
      "style": "./index.css"
    },
    "./style": "./index.css",
    "./index.css": "./index.css"
  },
  "files": [
    "index.js",
    "index.css",
    "ui-$ARGUMENTS.css"
  ],
  "publishConfig": {
    "access": "public",
    "registry": "https://registry.npmjs.org/"
  },
  "keywords": [
    "browser.style",
    "$ARGUMENTS",
    "css-first",
    "web-components"
  ],
  "author": "Mads Stoumann",
  "license": "ISC",
  "repository": {
    "type": "git",
    "url": "git+https://github.com/madsstoumann/browser-style.git",
    "directory": "ui/$ARGUMENTS"
  },
  "homepage": "https://browser.style/ui/$ARGUMENTS",
  "peerDependencies": {
    "@browser.style/base": "^1.0.11"
  }
}
```

Add additional peer dependencies as needed (e.g., `@browser.style/icon`).

### 8. Write `readme.md`

Follow this structure (see `ui/accordion/readme.md` as reference):

1. **Title & description** - one-liner about the component
2. **Features** - bullet list of capabilities
3. **Install** - npm install + peer deps
4. **Usage: CSS-only** - vanilla HTML with `<link>` or `@import`
5. **Usage: Web Component** - JS import + custom element markup
6. **Usage: React** - both web component and CSS-only approaches
7. **Usage: Vue** - with `isCustomElement` config note
8. **Usage: Svelte** - native custom element support
9. **Usage: Astro/Server** - CSS-only with optional JS enhancement
10. **Variants** - each variant with code examples
11. **Customization** - global token overrides + component token table
12. **Accessibility** - native semantics, keyboard support, ARIA notes
13. **Browser support** - feature requirements and graceful degradation

### 9. Update demo HTML

Update `ui/$ARGUMENTS/index.html` to demonstrate both modes:
- CSS-only examples
- Web component examples
- All variants
- Token customization example

### 10. Verify

Run the following checks:

1. **Token audit**: Every hardcoded color/spacing/radius in the CSS should use a component token referencing a global token — either declared at root (multi-use) or inline on the property (single-use). No hardcoded fallbacks for global tokens.
2. **Dark mode**: Color fallbacks use `light-dark()` where appropriate (check `DESIGN.md` for correct HSL pairs)
3. **No PascalCase**: `grep -E '--[A-Z]' ui/$ARGUMENTS/*.css` should return nothing
4. **No innerHTML with data**: Verify the JS never sets innerHTML with attribute values
5. **No querySelectorAll leaks**: Verify scoping with `:scope >` or `this.children`
6. **CSS duplication**: No variant tokens defined in multiple selectors
7. **Consistent corners**: Don't mix rounded and sharp corners within the same component variant
8. **Body text readability**: Body text uses `--line-height-normal` (1.5) unless there's a specific reason not to
9. **Package valid**: `cd ui/$ARGUMENTS && npm pack --dry-run` lists expected files

### 11. Final checklist

Use `AskUserQuestion` to confirm with the user before committing:

- [ ] Component tokens use `--ui-[component]-[property]` naming
- [ ] Global token references have no hardcoded fallbacks (base is required)
- [ ] Single-use tokens are inline on the property, not declared at root
- [ ] Multi-use tokens (overridden by variants) are declared at root
- [ ] CSS shorthand properties used where possible
- [ ] Attribute sections have short comments (`/* Colors */`, `/* Variants */`)
- [ ] CSS wrapped in `@layer bs-component`
- [ ] Base styles use `:where()` for zero specificity
- [ ] Light DOM web component (no Shadow DOM)
- [ ] Safe DOM construction (no innerHTML with data)
- [ ] Scoped queries (`:scope >` or `this.children`)
- [ ] package.json with dual exports (import + style)
- [ ] readme.md with CSS-only, web component, and framework examples
- [ ] Demo HTML updated
