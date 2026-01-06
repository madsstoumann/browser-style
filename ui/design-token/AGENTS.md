# Design Token Component - Internal Architecture

## Overview

The `<design-token>` component is a **web component for displaying and editing individual W3C design tokens**. It shows a visual preview of the token value and opens a dialog for editing when clicked.

**Component Type:** Web Component (Custom Element)

**Tag Name:** `design-token`

**Total LOC:** ~282 lines (single file component)

**Key architectural decisions:**
- **Shadow DOM**: Open mode for styling access
- **Shared stylesheet caching**: Module-level singleton for performance
- **Lazy editor loading**: Type-specific editors imported on-demand
- **Stale render prevention**: Render ID pattern for async safety
- **Event-driven updates**: `token-changed` custom event for parent communication

## Architecture Overview

### Component Lifecycle

```
Parent sets .src property
  ↓
render() called
  ↓
Increment #renderId (stale prevention)
  ↓
Extract token properties ($type, $value, etc.)
  ↓
Set host [type] attribute for CSS
  ↓
Calculate CSS value via toCssValue()
  ↓
Set --_v custom property for preview
  ↓
ensureStructure() - create shadow DOM if needed
  ↓
Update form inputs with token data
  ↓
If color token + not alias → lazy load <edit-color>
  ↓
Check #renderId (abort if stale)
  ↓
Attach color editor change listener
```

### Dialog Interaction Flow

```
User clicks preview button
  ↓
Dialog opens (closedby="any")
  ↓
User edits form fields / uses advanced editor
  ↓
User clicks Save (or clicks outside to cancel)
  ↓
handleDialogClose() triggered
  ↓
Check returnValue === 'save'
  ↓
Extract form values
  ↓
Update token object
  ↓
Dispatch 'token-changed' event
  ↓
Re-render to reflect changes
```

## File Structure

```
design-token/
├── index.js        282 lines   Main web component
├── README.md       183 lines   User documentation
└── claude.md       ---         This file
```

**Note:** No package.json - inherits from workspace root. Version aligns with ecosystem: **1.0.0**

## Component API

### Class Definition

**File:** [index.js](index.js)
**Lines 1-282:** `DesignToken` extends `HTMLElement`
**Registration:** Line 282: `customElements.define('design-token', DesignToken);`

### Static Members

| Member | Line | Returns |
|--------|------|---------|
| `observedAttributes` | 17-19 | `['src']` (note: actually observes 'name' per line 40) |

### Private Fields (Lines 6-15)

| Field | Type | Purpose |
|-------|------|---------|
| `#token` | Object | Current token with $type, $value, $description, $extensions |
| `#elements` | Object | Cached shadow DOM element references |
| `#renderId` | Number | Counter for stale render prevention |
| `#pendingValue` | null/Object | Temp storage for color editor changes |
| `#registry` | null/Map | Token registry for reference resolution |

### Public Properties

#### `src` (Lines 45-52)

```javascript
// Setter - accepts token object
token.src = {
  $type: 'color',
  $value: '#1976D2',
  $description: 'Primary brand color',
  $extensions: {
    css: { var: '--color-primary' }
  }
};

// Getter - returns current token
const currentToken = token.src;
```

#### `registry` (Lines 54-64)

```javascript
import { buildRegistry } from '../design-token-utils/index.js';

// Set registry for reference resolution
token.registry = buildRegistry(allTokens);

// Only triggers render if token already exists
// Order matters: set src before registry
```

### Attributes

| Attribute | Lines | Description |
|-----------|-------|-------------|
| `name` | 40-42, 159, 210-211 | Display name (observed, triggers render) |
| `type` | 216-218 | Auto-set from `$type`, used for CSS styling |

### Lifecycle Methods

| Method | Lines | Purpose |
|--------|-------|---------|
| `constructor()` | 21-24 | Attaches shadow DOM with mode='open' |
| `connectedCallback()` | 26-37 | Fetches shared CSS, caches it, calls render() |
| `attributeChangedCallback()` | 39-43 | Triggers render when 'name' changes |

### Instance Methods

| Method | Lines | Purpose |
|--------|-------|---------|
| `ensureStructure()` | 66-135 | Creates shadow DOM, wires event listeners |
| `handleDialogClose()` | 137-204 | Processes form data, dispatches event |
| `render()` | 206-279 | Main async render - updates DOM, loads editors |

### Events

#### `token-changed` (Lines 197-201)

```javascript
token.addEventListener('token-changed', (e) => {
  const { token, cssVar } = e.detail;
  // token: Updated token object
  // cssVar: CSS variable name (e.g., '--color-primary')
});
```

**Event properties:** `bubbles: true`, `composed: true`

## Shadow DOM Structure (Lines 69-115)

```html
<button type="button" command="show-modal" commandfor="dialog" part="design-token-button">
  <span id="token-name-display"></span>
</button>

<dialog id="dialog" closedby="any" part="design-token-dialog">
  <form method="dialog">
    <h2 id="dialog-title"></h2>
    <cq-box>
      <details name="token" open>
        <summary>Basic Info</summary>
        <fieldset>
          <label>Name <input name="name"></label>
          <label>Description <textarea name="description"></textarea></label>
          <label>CSS Variable <input name="property"></label>
          <label>Value <input name="value"></label>
        </fieldset>
      </details>

      <details name="token">
        <summary>Advanced Editor</summary>
        <fieldset name="advanced" id="advanced-editor"></fieldset>
      </details>

      <details name="token">
        <summary>JSON Source</summary>
        <pre id="json-source"></pre>
      </details>
    </cq-box>
    <button value="save">Save</button>
  </form>
</dialog>
```

### Element Cache (Lines 117-128)

```javascript
this.#elements = {
  dialog: this.shadowRoot.getElementById('dialog'),
  tokenNameDisplay: this.shadowRoot.getElementById('token-name-display'),
  dialogTitle: this.shadowRoot.getElementById('dialog-title'),
  jsonSource: this.shadowRoot.getElementById('json-source'),
  form: this.shadowRoot.querySelector('form'),
  advancedEditor: this.shadowRoot.getElementById('advanced-editor'),
  nameInput: this.shadowRoot.querySelector('input[name="name"]'),
  descriptionInput: this.shadowRoot.querySelector('textarea[name="description"]'),
  propertyInput: this.shadowRoot.querySelector('input[name="property"]'),
  valueInput: this.shadowRoot.querySelector('input[name="value"]')
};
```

## CSS Variable Preview System

### Preview Calculation (Lines 220-225)

```javascript
const cssVar = $extensions?.css?.var || '';

if (cssVar) {
  // Use existing CSS variable for live preview
  this.style.setProperty('--_v', `var(${cssVar})`);
} else {
  // Compute value from token definition
  this.style.setProperty('--_v', toCssValue(token, this.#registry));
}
```

### Type-Specific Preview Rendering

| Type | Preview Method |
|------|----------------|
| `color` | Swatch with transparency grid via `--_v` |
| `gradient` | Background gradient via `--_v` |
| `shadow` | Box-shadow via `--_v` |
| `border` | Border property via `--_v` |
| `aspectRatio` | Aspect ratio box via `--_v` |
| `typography` | Generic (uses `--_v` variable) |
| `dimension` | Generic numeric display |

## Advanced Editor Integration

### Dynamic Editor Loading (Lines 250-259)

```javascript
if ($type === 'color' && !isAlias) {
  try {
    await import('../design-token-editors/color/index.js');
    const editor = document.createElement('edit-color');
    editor.value = $value;
    editorContent = editor;
  } catch (e) {
    console.debug('Failed to load color editor:', e);
  }
}
```

### Alias Detection (Line 248)

```javascript
const isAlias = typeof $value === 'string'
  && $value.startsWith('{')
  && $value.endsWith('}');
```

Alias tokens (e.g., `{color.brand.primary}`) skip advanced editors.

### Color Editor Change Handling (Lines 267-275)

```javascript
editorContent.addEventListener('change', (e) => {
  this.#pendingValue = e.detail;  // Store temporarily
  const { css } = e.detail;
  const valueInput = this.#elements.valueInput;
  if (valueInput) {
    valueInput.value = css;
    this.style.setProperty('--_v', css);  // Live preview
  }
});
```

## Token Value Processing

### Color Token Save (Lines 175-180)

```javascript
if (token.$type === 'color' && this.#pendingValue?.components) {
  token.$value = {
    colorSpace: this.#pendingValue.space === 'hex' ? 'srgb' : this.#pendingValue.space,
    components: this.#pendingValue.components,
    alpha: this.#pendingValue.alpha
  };
}
```

### JSON Value Parsing (Lines 184-193)

```javascript
try {
  if (finalValue.trim().startsWith('[') || finalValue.trim().startsWith('{')) {
    token.$value = JSON.parse(finalValue);
  } else {
    token.$value = finalValue;
  }
} catch {
  token.$value = finalValue;  // Silent fallback to string
}
```

### CSS Variable Assignment (Lines 168-172)

```javascript
if (newCssVar !== cssVar) {
  if (!token.$extensions) token.$extensions = {};
  if (!token.$extensions.css) token.$extensions.css = {};
  token.$extensions.css.var = newCssVar;
}
```

## Dependencies

### Direct Imports

| Import | Line | Source | Purpose |
|--------|------|--------|---------|
| `toCssValue` | 1 | `../design-token-utils/index.js` | Convert token to CSS value |

### Dynamic Imports

| Import | Lines | Source | Condition |
|--------|-------|--------|-----------|
| `edit-color` | 252 | `../design-token-editors/color/index.js` | `$type === 'color' && !isAlias` |

### Shared Stylesheet (Lines 3, 27-35)

```javascript
let sharedSheet;  // Module-level singleton

// Fetched once, shared across all instances
const cssUrl = new URL('../design-token-styles/index.css', import.meta.url).href;
const response = await fetch(cssUrl);
const text = await response.text();
sharedSheet = new CSSStyleSheet();
sharedSheet.replaceSync(text);
this.shadowRoot.adoptedStyleSheets = [sharedSheet];
```

## CSS Parts

```css
design-token::part(design-token-button) { /* Preview button */ }
design-token::part(design-token-dialog) { /* Edit dialog */ }
```

## Gotchas & Edge Cases

### 1. Shared Stylesheet Caching (Line 3, 27-28)

Module-level cache shared across all instances:
```javascript
let sharedSheet;  // Shared state
```
**Edge Case:** If CSS file changes after first component loads, subsequent instances won't see updates until page refresh.

### 2. Registry/Src Order Matters (Lines 54-60)

```javascript
set registry(val) {
  this.#registry = val;
  if (this.#token && this.#token.$value !== undefined) {
    this.render();  // Only renders if token exists
  }
}
```
**Gotcha:** Setting registry before `src` won't trigger render. Always set `src` first.

### 3. Name Attribute Precedence (Line 210-211)

```javascript
const name = this.getAttribute('name') || token.name || 'Token';
```
**Precedence:** attribute > internal token.name > default 'Token'

### 4. Silent JSON Parse Failure (Lines 192-193)

```javascript
} catch {
  token.$value = finalValue;  // Silent fallback
}
```
**Gotcha:** Invalid JSON silently reverts to string value. No error feedback to user.

### 5. Stale Render Prevention (Lines 207, 261)

```javascript
async render() {
  const renderId = ++this.#renderId;
  // ... async operations ...
  if (this.#renderId !== renderId) return;  // Abort if stale
}
```
**Purpose:** Prevents race conditions when multiple renders are triggered before async operations complete.

### 6. Dialog Close Behavior (Line 139)

```javascript
if (dialog.returnValue !== 'save') {
  this.render();  // Re-render resets form
  return;
}
```
**Gotcha:** Clicking outside dialog (closedby="any") returns empty string, triggering re-render. User changes are lost (intentional).

### 7. Color Editor Only for Non-Aliases (Line 248)

```javascript
const isAlias = typeof $value === 'string' && $value.startsWith('{') && $value.endsWith('}');
```
**Gotcha:** Reference tokens like `{color.brand.primary}` won't load advanced editor. Currently no alias editor exists.

### 8. CSS Fetch Error Handling (Lines 28-32)

No error handling for CSS fetch failure - will throw if CSS file is missing. No fallback styles.

### 9. Type Attribute Auto-Set (Lines 216-218)

```javascript
if ($type) {
  this.setAttribute('type', $type);
}
```
**Gotcha:** Setting `type` attribute manually has no effect - it's always overwritten from token's `$type`.

### 10. displayValue Object Serialization (Lines 238-243)

```javascript
let displayValue = $value;
if (typeof $value === 'object') {
  displayValue = JSON.stringify($value);
}
```
**Gotcha:** Object values shown as JSON strings in form. User must enter valid JSON when editing, or it falls back to string.

## Supported Token Types

| Type | Preview | Advanced Editor |
|------|---------|-----------------|
| `color` | Color swatch with alpha grid | `<edit-color>` |
| `gradient` | Gradient background | None (planned) |
| `shadow` | Box-shadow applied | None (planned) |
| `border` | Border applied | None (planned) |
| `aspectRatio` | Aspect ratio box | None |
| `typography` | Uses --_v variable | None (planned) |
| `dimension` | Generic preview | None |
| `duration` | Generic preview | None |
| `number` | Generic preview | None |
| `fontFamily` | Generic preview | None |
| `fontWeight` | Generic preview | None |
| `fontStyle` | Generic preview | None |

## Integration Pattern

### Parent Component Usage

```javascript
// Create token element
const tokenEl = document.createElement('design-token');
tokenEl.setAttribute('name', 'Primary Color');
tokenEl.src = {
  $type: 'color',
  $value: '#1976D2',
  $extensions: { css: { var: '--color-primary' } }
};

// Provide registry for reference resolution
tokenEl.registry = buildRegistry(allTokens);

// Listen for changes
tokenEl.addEventListener('token-changed', (e) => {
  const { token, cssVar } = e.detail;
  // Sync back to data source
});

container.appendChild(tokenEl);
```

## Debugging Tips

1. **Preview not showing?** Check `--_v` CSS variable is set correctly
2. **Editor not loading?** Verify design-token-editors package is accessible
3. **Changes not saving?** Check dialog `returnValue` is "save"
4. **References not resolving?** Ensure registry is set before src
5. **Stale data after edit?** Check for render ID mismatch in async flow
6. **No type-specific styling?** Verify `type` attribute is set from `$type`
