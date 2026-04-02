---
name: component-to-package
description: Convert an existing browser-style CSS component into a dual-mode npm package (CSS-only + web component) with proper design tokens, fallback chains, package.json, and readme.
argument-hint: <component-name>
allowed-tools: Read, Write, Edit, Bash, Glob, Grep, AskUserQuestion
---

# Component-to-Package Skill

Convert an existing `ui/<component>` CSS component into a publishable dual-mode npm package: **CSS-only** for vanilla/server-rendered use, and a **light DOM web component** for framework integration.

**Reference implementation:** `ui/accordion/` — all patterns below are modeled on it.

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

### 2. Refactor design tokens (three-tier architecture)

The token system follows three tiers with fallback chains:

```
Component Token --> Global Semantic Token --> Hardcoded Fallback
```

#### 2a. Identify global tokens from `ui/base/core.css`

Available global tokens (defined in `:root`). Full reference: `docs/design-system-agent.md`.

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

Naming convention: `--ui-[component]-[property]` with **full readable names** (no Emmet abbreviations).

Every component token MUST have a fallback chain:

```css
--ui-tabs-border-color: var(--color-border, hsl(0, 0%, 80%));
--ui-tabs-border-radius: var(--radius-md, 0.375rem);
--ui-tabs-padding: var(--spacing-md, 1rem);
--ui-tabs-duration: var(--duration-normal, .2s);
```

Rules:
- **Use full property names**: `border-width` not `bdw`, `border-color` not `bdc`
- **Always include a hardcoded fallback** as the last value so the component works without core.css
- **Map to the closest global token** where one exists
- **Declare all component tokens** at the top of the component rule block

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

### 3. Refactor CSS

#### 3a. Wrap in `@layer bs-component`

```css
@layer bs-component {
  /* All component styles here */
}
```

#### 3b. Use `:where()` for zero-specificity base styles

```css
:where(.ui-tabs) {
  --ui-tabs-border-color: var(--color-border, hsl(0, 0%, 80%));
  /* ... tokens ... */
  border-color: var(--ui-tabs-border-color);
}
```

#### 3c. Modifier pattern

Use `.--modifier` class pattern (dot-dash-dash):

```css
:where(.ui-tabs) {
  &.--vertical { /* variant */ }
  &.--rounded { /* variant */ }
}
```

For variants controlled by a parent wrapper element, use attribute selectors:

```css
:where(ui-tabs[variant~="pills"]) > .ui-tab { /* ... */ }
```

Consolidate duplicate variant rules — never define the same tokens in both a class-based and attribute-based selector. Combine them:

```css
:where(ui-tabs[variant~="pills"]) > .ui-tab,
:where(.ui-tab).--pills {
  /* tokens defined once */
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

### 5. Create the web component (Light DOM)

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

### 6. Create `package.json`

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

### 7. Write `readme.md`

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

### 8. Update demo HTML

Update `ui/$ARGUMENTS/index.html` to demonstrate both modes:
- CSS-only examples
- Web component examples
- All variants
- Token customization example

### 9. Verify

Run the following checks:

1. **Token audit**: Every hardcoded color/spacing/radius in the CSS should be a component token referencing a global token with a hardcoded fallback
2. **No PascalCase**: `grep -E '--[A-Z]' ui/$ARGUMENTS/*.css` should return nothing
3. **No innerHTML with data**: Verify the JS never sets innerHTML with attribute values
4. **No querySelectorAll leaks**: Verify scoping with `:scope >` or `this.children`
5. **CSS duplication**: No variant tokens defined in multiple selectors
6. **Package valid**: `cd ui/$ARGUMENTS && npm pack --dry-run` lists expected files

### 10. Final checklist

Use `AskUserQuestion` to confirm with the user before committing:

- [ ] Component tokens use `--ui-[component]-[property]` naming
- [ ] All tokens have fallback chains (global token + hardcoded)
- [ ] CSS wrapped in `@layer bs-component`
- [ ] Base styles use `:where()` for zero specificity
- [ ] Light DOM web component (no Shadow DOM)
- [ ] Safe DOM construction (no innerHTML with data)
- [ ] Scoped queries (`:scope >` or `this.children`)
- [ ] package.json with dual exports (import + style)
- [ ] readme.md with CSS-only, web component, and framework examples
- [ ] Demo HTML updated
