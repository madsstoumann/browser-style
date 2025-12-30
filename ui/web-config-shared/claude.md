# Web Config Shared - Internal Architecture

## Overview

Web Config Shared provides **shared utilities and CSS** for all `web-config-*` editor components. It includes style adoption, translation, state management, and details panel state persistence.

**Package Type:** JavaScript Utilities + CSS

**Package Version:** 1.0.0

**Total LOC:** ~318 lines (95 JS + 223 CSS)

**Key architectural decisions:**
- **Constructable stylesheets**: Single cached stylesheet shared across all component instances
- **Singleton pattern**: Stylesheet promise cached at module level for efficiency
- **Generic state management**: `setState` returns changed keys for selective re-rendering
- **Details persistence**: Capture/restore accordion panel state across re-renders
- **Translation with fallback**: Nested key lookup with language fallback

## Architecture Overview

### Shared Stylesheet Flow

```
Component connectedCallback()
  ↓
adoptSharedStyles(shadowRoot)
  ↓
First call → Fetch CSS + Create CSSStyleSheet
  ↓
Cache promise at module level
  ↓
Subsequent calls → Return cached promise
  ↓
Apply to shadowRoot.adoptedStyleSheets
```

### State Update Flow

```
setState(instance, partialState)
  ↓
Initialize instance.state if undefined
  ↓
For each key in partialState:
  ↓
Compare with equality function
  ↓
If changed → Update state, add to changedKeys
  ↓
Return changedKeys array
  ↓
Component selectively re-renders based on changes
```

### Details Persistence Flow

```
Before render: captureOpenDetailsState(shadowRoot)
  ↓
Query all open <details> with name attribute
  ↓
Build array of { group, key } objects
  ↓
After render: restoreOpenDetailsState(shadowRoot, openState)
  ↓
Match by group::key token
  ↓
Set/remove open attribute
```

## File Structure

```
web-config-shared/
├── index.js        95 lines    Utility functions
├── index.css       223 lines   Shared component styles
├── README.md       ---         User documentation
├── package.json    ---         NPM configuration
└── claude.md       ---         This file
```

## API Reference

### File: [index.js](index.js)

#### `adoptSharedStyles(shadowRoot)` (Lines 3-15)

Adopts the shared stylesheet into a component's shadow root.

```javascript
/**
 * @param {ShadowRoot} shadowRoot - The shadow root to apply styles to
 * @returns {Promise<void>}
 */
export async function adoptSharedStyles(shadowRoot)
```

**Implementation:**

```javascript
/* Line 1 - Module-level singleton cache */
let _sharedStylesheetPromise;

/* Lines 3-15 - Fetch and cache on first call */
export async function adoptSharedStyles(shadowRoot) {
  if (!_sharedStylesheetPromise) {
    _sharedStylesheetPromise = (async () => {
      const sharedCss = await fetch(new URL('./index.css', import.meta.url)).then(r => r.text());
      const sheet = new CSSStyleSheet();
      await sheet.replace(sharedCss);
      return sheet;
    })();
  }

  const sharedSheet = await _sharedStylesheetPromise;
  shadowRoot.adoptedStyleSheets = [sharedSheet];
}
```

**Usage:**

```javascript
async connectedCallback() {
  await adoptSharedStyles(this.shadowRoot);
  this.render();
}
```

#### `createTranslator(i18nDataOrGetter, getLang, fallbackLang)` (Lines 17-29)

Creates a translation function with nested key support and fallback.

```javascript
/**
 * @param {object|Function} i18nDataOrGetter - Translation data object or getter function
 * @param {string|Function} getLang - Current language string or getter function
 * @param {string} fallbackLang - Fallback language (default: 'en')
 * @returns {Function} Translation function t(key)
 */
export function createTranslator(i18nDataOrGetter, getLang, fallbackLang = 'en')
```

**Implementation:**

```javascript
/* Lines 17-29 */
export function createTranslator(i18nDataOrGetter, getLang, fallbackLang = 'en') {
  // Support both static object and getter function
  const getData = () => typeof i18nDataOrGetter === 'function'
    ? i18nDataOrGetter()
    : i18nDataOrGetter;

  // Nested key lookup (e.g., "errors.required" → i18n.en.errors.required)
  const lookup = (lang, key) => {
    let value = getData()?.[lang];
    for (const part of String(key).split('.')) value = value?.[part];
    return typeof value === 'string' ? value : undefined;
  };

  // Return translator function
  return function t(key) {
    const lang = (typeof getLang === 'function' ? getLang() : getLang) || fallbackLang;
    return lookup(lang, key) ?? lookup(fallbackLang, key) ?? key;
  };
}
```

**Usage:**

```javascript
const i18n = {
  en: { title: 'Settings', errors: { required: 'Required' } },
  da: { title: 'Indstillinger', errors: { required: 'Påkrævet' } }
};

const t = createTranslator(i18n, () => this.lang);
t('title');           // 'Settings' or 'Indstillinger'
t('errors.required'); // Nested lookup
t('unknown.key');     // Returns key if not found
```

#### `setState(instance, partialState, options)` (Lines 31-49)

Updates component state and returns array of changed keys.

```javascript
/**
 * @param {object} instance - Object with .state property
 * @param {object} partialState - Partial state to merge
 * @param {object} options - Optional equality configuration
 * @param {Function} options.equals - Default equality function (default: Object.is)
 * @param {object} options.equalsByKey - Per-key equality functions
 * @returns {string[]} Array of changed key names
 */
export function setState(instance, partialState, { equals = Object.is, equalsByKey } = {})
```

**Implementation:**

```javascript
/* Lines 34-49 */
export function setState(instance, partialState, { equals = Object.is, equalsByKey } = {}) {
  // Guard clauses
  if (!instance || typeof instance !== 'object') return [];
  if (!partialState || typeof partialState !== 'object') return [];

  // Initialize state if needed
  instance.state ??= {};

  const changedKeys = [];
  for (const [key, nextValue] of Object.entries(partialState)) {
    const prevValue = instance.state[key];
    // Use per-key equality or default
    const eq = equalsByKey?.[key] ?? equals;
    if (!eq(prevValue, nextValue)) {
      instance.state[key] = nextValue;
      changedKeys.push(key);
    }
  }
  return changedKeys;
}
```

**Usage:**

```javascript
class MyComponent extends HTMLElement {
  state = { count: 0, items: [] };

  update(changes) {
    const changed = setState(this, changes, {
      // Deep compare arrays
      equalsByKey: {
        items: (a, b) => JSON.stringify(a) === JSON.stringify(b)
      }
    });

    if (changed.includes('count')) {
      this.renderCount();
    }
    if (changed.includes('items')) {
      this.renderItems();
    }
  }
}
```

#### `getDetailsKey(detailsEl)` (Lines 51-57)

Internal helper to extract identifying key from a details element.

```javascript
/* Lines 51-57 - Key extraction priority */
function getDetailsKey(detailsEl) {
  return detailsEl?.dataset?.panel      // 1. data-panel
    || detailsEl?.dataset?.directive    // 2. data-directive
    || detailsEl?.dataset?.section      // 3. data-section
    || detailsEl?.id                    // 4. id attribute
    || null;
}
```

#### `captureOpenDetailsState(shadowRoot)` (Lines 64-74)

Captures which accordion panels are currently open.

```javascript
/**
 * @param {ShadowRoot} shadowRoot - Shadow root containing details elements
 * @returns {Array<{group: string, key: string}>} Open panel state
 */
export function captureOpenDetailsState(shadowRoot)
```

**Implementation:**

```javascript
/* Lines 64-74 */
export function captureOpenDetailsState(shadowRoot) {
  if (!shadowRoot) return [];
  const open = [];
  shadowRoot.querySelectorAll('details[open]').forEach(detailsEl => {
    const group = detailsEl.getAttribute('name');
    const key = getDetailsKey(detailsEl);
    if (!group || !key) return;  // Both required
    open.push({ group, key });
  });
  return open;
}
```

#### `restoreOpenDetailsState(shadowRoot, openState)` (Lines 79-94)

Restores accordion panel open/closed state after re-render.

```javascript
/**
 * @param {ShadowRoot} shadowRoot - Shadow root containing details elements
 * @param {Array<{group: string, key: string}>} openState - State from captureOpenDetailsState
 */
export function restoreOpenDetailsState(shadowRoot, openState)
```

**Implementation:**

```javascript
/* Lines 79-94 */
export function restoreOpenDetailsState(shadowRoot, openState) {
  if (!shadowRoot || !Array.isArray(openState) || openState.length === 0) return;

  // Create lookup set with "group::key" tokens
  const openTokens = new Set(openState.map(({ group, key }) => `${group}::${key}`));
  const groups = new Set(openState.map(({ group }) => group));

  shadowRoot.querySelectorAll('details').forEach(detailsEl => {
    const group = detailsEl.getAttribute('name');
    if (!group || !groups.has(group)) return;  // Only process relevant groups

    const key = getDetailsKey(detailsEl);
    if (!key) return;

    const token = `${group}::${key}`;
    if (openTokens.has(token)) detailsEl.setAttribute('open', '');
    else detailsEl.removeAttribute('open');
  });
}
```

**Usage:**

```javascript
render() {
  // Capture before destroying DOM
  const openState = captureOpenDetailsState(this.shadowRoot);

  // Re-render (destroys existing elements)
  this.shadowRoot.innerHTML = this.template();

  // Restore panel state
  restoreOpenDetailsState(this.shadowRoot, openState);
}
```

## CSS Reference

### File: [index.css](index.css)

#### Host Styles (Lines 1-34)

```css
:host {
  /* Accent colors */
  --web-config-accent: hsl(211, 100%, 95%);
  --web-config-accent-dark: hsl(211, 50%, 50%);

  /* UI colors */
  --web-config-buttonface: #efefef;
  --web-config-focus-c: hsl(211, 5%, 60%);

  /* Typography */
  --web-config-ff-mono: ui-monospace, 'Cascadia Code', ...;
  --web-config-ff-system: system-ui, sans-serif;

  /* Spacing */
  --web-config-bdrs: .5rem;
  --web-config-gap: 1rem;
  --web-config-tab-width: 2;

  /* Status colors (Lines 12-20) */
  --web-config-status-danger: hsl(0, 80%, 50%);
  --web-config-status-danger-bg: hsl(0, 80%, 95%);
  --web-config-status-warn: hsl(35, 90%, 50%);
  --web-config-status-warn-bg: hsl(35, 90%, 95%);
  --web-config-status-ok: hsl(120, 50%, 45%);
  --web-config-status-ok-bg: hsl(120, 50%, 95%);
  --web-config-status-info: var(--web-config-accent-dark);
  --web-config-status-info-bg: var(--web-config-accent);

  /* Base layout */
  display: grid;
  font-family: var(--web-config-ff, system-ui);
  font-size: var(--web-config-font-size, 16px);
  row-gap: var(--web-config-gap);
}
```

#### Screen Reader Only (Lines 36-46)

```css
[data-sr] {
  border: 0;
  clip: rect(0 0 0 0);
  height: 1px;
  margin: -1px;
  overflow: hidden;
  padding: 0;
  position: absolute;
  width: 1px;
  white-space: nowrap;
}
```

#### Form Controls (Lines 48-63, 109-133)

```css
/* Buttons (Lines 48-56) */
button {
  background: var(--web-config-buttonface);
  border: 0;
  cursor: pointer;
}

/* Shared form control styles (Lines 58-63) */
button, input, textarea, select {
  border-radius: var(--web-config-bdrs);
  font-family: var(--web-config-ff);
  font-size: inherit;
  &:focus-visible {
    box-shadow: inset 0 0 0 2px var(--web-config-focus-c);
    outline: 0;
  }
}

/* Input fields (Lines 109-114) */
input, textarea, select {
  border: 1px solid var(--web-config-buttonface);
  flex: 1;
  padding: 1ch 1.5ch;
  box-sizing: border-box;
}

/* Color input normalization (Lines 116-127) */
[type=color] {
  block-size: unset;
  padding: 0;
  width: 100%;
  &::-webkit-color-swatch,
  &::-webkit-color-swatch-wrapper {
    border: 0;
    border-radius: 3px;
    padding: 0;
  }
}

/* Textarea (Lines 129-133) */
textarea {
  field-sizing: content;
  min-block-size: 6ch;
  resize: vertical;
}
```

#### Details/Summary Accordion (Lines 65-88)

```css
details {
  border: 1px solid var(--web-config-buttonface);
  border-radius: var(--web-config-bdrs);
  padding: var(--web-config-gap);
  user-select: none;

  &:has(:focus-visible) {
    outline: 2px solid var(--web-config-focus-c);
    outline-offset: 3px;
  }

  /* Status-based border colors (Lines 72-81) */
  &[data-status="danger"] { border-color: var(--web-config-status-danger); }
  &[data-status="warn"] { border-color: var(--web-config-status-warn); }
  &[data-status="ok"] { border-color: var(--web-config-status-ok); }
  &[data-status="info"] { border-color: var(--web-config-status-info); }

  /* Legacy severity support */
  &[data-severity="high"] { border-color: var(--web-config-status-danger); }
  &[data-severity="medium"] { border-color: var(--web-config-status-warn); }
  &[data-severity="secure"] { border-color: var(--web-config-status-ok); }
}

summary {
  font-family: var(--web-config-ff-mono);
  outline: 0;
  cursor: pointer;
}
```

#### List Item Status Badges (Lines 162-207)

```css
li {
  align-items: center;
  background: var(--web-config-buttonface);
  border: 1px solid transparent;
  border-radius: var(--web-config-bdrs);
  display: grid;
  font-family: var(--web-config-ff-mono);
  font-size: small;
  gap: 1ch;
  grid-auto-flow: column;
  padding: .5ch 1ch;
  place-content: center;

  /* Status variants (Lines 175-197) */
  &[data-status="danger"] {
    background: var(--web-config-status-danger-bg);
    border-color: var(--web-config-status-danger);
    color: var(--web-config-status-danger);
  }

  &[data-status="warn"] {
    background: var(--web-config-status-warn-bg);
    border-color: var(--web-config-status-warn);
    color: var(--web-config-status-warn);
  }

  &[data-status="ok"] {
    background: var(--web-config-status-ok-bg);
    border-color: var(--web-config-status-ok);
    color: var(--web-config-status-ok);
  }

  &[data-status="info"] {
    background: var(--web-config-status-info-bg);
    border-color: var(--web-config-status-info);
    color: var(--web-config-status-info);
  }
}
```

#### Action Buttons (Lines 209-222)

```css
[data-move],
[data-remove] {
  border-radius: 50%;
  border: 1px solid;
  display: inline-grid;
  height: 1.25em;
  padding: 0;
  place-content: center;
  width: 1.25em;
}

[data-remove] {
  background-color: currentColor;
  -webkit-text-fill-color: #FFF;
}
```

## CSS Custom Properties Reference

| Property | Default | Purpose | Lines |
|----------|---------|---------|-------|
| `--web-config-accent` | `hsl(211, 100%, 95%)` | Light accent color | 2 |
| `--web-config-accent-dark` | `hsl(211, 50%, 50%)` | Dark accent color | 3 |
| `--web-config-buttonface` | `#efefef` | Button/input background | 4 |
| `--web-config-bdrs` | `.5rem` | Border radius | 5 |
| `--web-config-ff-mono` | `ui-monospace, ...` | Monospace font stack | 6 |
| `--web-config-ff-system` | `system-ui, ...` | System font stack | 7 |
| `--web-config-gap` | `1rem` | Standard spacing | 8 |
| `--web-config-focus-c` | `hsl(211, 5%, 60%)` | Focus ring color | 9 |
| `--web-config-tab-width` | `2` | Pre/code tab width | 10 |
| `--web-config-status-danger` | `hsl(0, 80%, 50%)` | Error/danger color | 13 |
| `--web-config-status-warn` | `hsl(35, 90%, 50%)` | Warning color | 15 |
| `--web-config-status-ok` | `hsl(120, 50%, 45%)` | Success color | 17 |
| `--web-config-status-info` | accent-dark | Info color | 19 |

## Consumer Components

Used by all web-config-* components:

- `web-config-csp` - CSP editor
- `web-config-manifest` - Web App Manifest editor
- `web-config-robots` - robots.txt editor
- `web-config-security` - security.txt editor
- `web-config-tokens` - Design token tree editor

## Usage Pattern

### Typical Component Setup

```javascript
import {
  adoptSharedStyles,
  createTranslator,
  setState,
  captureOpenDetailsState,
  restoreOpenDetailsState
} from '@browser.style/web-config-shared';

const i18n = {
  en: { title: 'Settings' },
  da: { title: 'Indstillinger' }
};

export class WebConfigExample extends HTMLElement {
  state = {};

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  async connectedCallback() {
    await adoptSharedStyles(this.shadowRoot);
    this.t = createTranslator(i18n, () => this.lang);
    this.render();
  }

  render() {
    const openState = captureOpenDetailsState(this.shadowRoot);

    this.shadowRoot.innerHTML = `
      <h2>${this.t('title')}</h2>
      <details name="sections" data-section="main" open>
        <summary>Main</summary>
        <!-- content -->
      </details>
    `;

    restoreOpenDetailsState(this.shadowRoot, openState);
  }

  updateState(newValues) {
    const changed = setState(this, newValues);
    if (changed.length > 0) {
      this.render();
      this.dispatchChange();
    }
  }
}
```

## Gotchas & Edge Cases

### 1. Stylesheet Singleton (index.js:1,4-11)

```javascript
let _sharedStylesheetPromise;  // Module-level cache
```

The stylesheet is fetched once and cached. If CSS changes during development, a page reload is required.

### 2. Details Key Priority (index.js:51-57)

The key extraction checks attributes in this order:
1. `data-panel`
2. `data-directive`
3. `data-section`
4. `id`

Ensure at least one of these is set on `<details>` elements for persistence to work.

### 3. Group Required for Persistence (index.js:70)

```javascript
if (!group || !key) return;
```

Both `name` attribute and a key attribute are required. Unnamed details won't be persisted.

### 4. adoptedStyleSheets Overwrites (index.js:14)

```javascript
shadowRoot.adoptedStyleSheets = [sharedSheet];
```

This replaces any existing adopted stylesheets. If the component needs additional styles, append after calling:

```javascript
await adoptSharedStyles(this.shadowRoot);
shadowRoot.adoptedStyleSheets = [...shadowRoot.adoptedStyleSheets, customSheet];
```

### 5. setState Initializes state (index.js:37)

```javascript
instance.state ??= {};
```

If `instance.state` is undefined, it's initialized to an empty object. Components can define defaults:

```javascript
class MyComponent {
  state = { count: 0 };  // Defaults
}
```

### 6. Translation Key as Fallback (index.js:27)

```javascript
return lookup(lang, key) ?? lookup(fallbackLang, key) ?? key;
```

If a translation key isn't found in current or fallback language, the raw key is returned. This makes missing translations visible.

### 7. Lazy i18n Data Support (index.js:18)

```javascript
const getData = () => typeof i18nDataOrGetter === 'function'
  ? i18nDataOrGetter()
  : i18nDataOrGetter;
```

Translation data can be a function that returns the data object. Useful for dynamic loading or updates.

### 8. Legacy Severity Aliases (index.css:22-28, 78-81)

```css
/* Legacy aliases */
--web-config-high: var(--web-config-status-danger);
```

Old components may use `data-severity="high"` instead of `data-status="danger"`. Both are supported for backwards compatibility.

### 9. Pre Tab Width (index.css:147)

```css
tab-size: var(--web-config-tab-width);
```

Set `--web-config-tab-width` to control indentation in code output. Default is 2 spaces.

### 10. Focus Ring via :has() (index.css:70)

```css
details:has(:focus-visible) { outline: 2px solid ...; }
```

When any focusable element inside details has focus, the panel gets an outline. Requires `:has()` support.

## Debugging Tips

1. **Styles not loading?** Check `adoptSharedStyles` is awaited
2. **Translations missing?** Verify i18n object structure and lang value
3. **State not updating?** Check `setState` returns expected changed keys
4. **Details state lost?** Ensure capture/restore around render, and name+key are set
5. **Focus ring not showing?** Verify `:has()` browser support
6. **Status colors wrong?** Check data-status vs legacy data-severity attribute usage
