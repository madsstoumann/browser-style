# Web Config Tokens - Internal Architecture

## Overview

Web Config Tokens is a **web component for visualizing and editing W3C design tokens** with live preview and CSS generation. It serves as the main container that orchestrates the design token ecosystem, providing tree-based navigation and CRUD operations for token management.

**Component Type:** Web Component (Custom Element)

**Tag Name:** `web-config-tokens`

**Total LOC:** 648 lines (single file component)

**Key architectural decisions:**
- **Hierarchical tree rendering**: Recursive render() builds nested `<details>` for groups
- **Live CSS injection**: Generates and adopts CSS stylesheet from tokens
- **Token registry**: Builds registry for reference resolution across tokens
- **Event delegation**: Single click handler on form for all button actions
- **Dialog-based CRUD**: Modal dialog for creating/editing groups and tokens
- **Cached dialog elements**: Avoids repeated querySelector calls

## Architecture Overview

### System Overview

```
web-config-tokens (this component)
  ├─ Loads tokens from JSON (src attribute)
  ├─ Builds token registry (design-token-utils)
  ├─ Generates CSS custom properties (design-token-utils)
  ├─ Injects CSS into shadow DOM
  └─ Renders <design-token> components
      ├─ Receives registry for reference resolution
      ├─ Uses CSS variables for live previews
      └─ Dispatches token-changed events
```

### Component Lifecycle

```
connectedCallback()
  ↓
Fetch tokens JSON from src attribute
  ↓
Store in #fullTokens, build #registry
  ↓
Generate CSS via exportTokensToCSS()
  ↓
Create and adopt #tokenStyles stylesheet
  ↓
Create form container + create-dialog
  ↓
Recursive render() builds DOM tree
  ↓
Attach click handler for event delegation
  ↓
User clicks token → opens <design-token> dialog
User clicks action button → handleClick() routes action
  ↓
token-changed event → handleTokenChange() updates CSS
```

## File Structure

```
web-config-tokens/
├── src/
│   └── index.js          648 lines   Main web component
├── index.html            ---         Demo page
├── index.css             ---         Component styles
├── readme.md             ---         User documentation
├── package.json          ---         NPM package configuration
├── design.tokens.json    ---         Example tokens
├── design.tokens.css     ---         Generated CSS output
├── design.tokens.md      ---         Token specification
├── export-css.js         ---         CSS export script
├── data/                 ---         Additional token examples
├── figma/                ---         Figma integration
└── claude.md             ---         This file
```

## Component API

### Class Definition

**File:** [src/index.js](src/index.js)

**Lines 196-647:** `WebConfigTokens extends HTMLElement`

**Registration:** Line 647: `customElements.define('web-config-tokens', WebConfigTokens);`

### Private Fields (Lines 197-201)

| Field | Type | Purpose |
|-------|------|---------|
| `#fullTokens` | Object | Complete token tree from JSON |
| `#registry` | Map | Token registry for reference resolution |
| `#tokenStyles` | CSSStyleSheet | Adopted stylesheet with token CSS |
| `#form` | HTMLFormElement | Container form element |
| `#dialogElements` | Object | Cached dialog element references |

### Constructor (Lines 203-212)

```javascript
constructor() {
  super();
  this.attachShadow({ mode: 'open' });
  this.shadowRoot.adoptedStyleSheets = [styles];

  // Listen for token changes and update CSS variables
  this.addEventListener('token-changed', (e) => {
    this.handleTokenChange(e.detail);
  });
}
```

### Attributes

| Attribute | Lines | Description |
|-----------|-------|-------------|
| `src` | 215-216 | URL to load design tokens JSON file |

### Lifecycle Methods

| Method | Lines | Purpose |
|--------|-------|---------|
| `connectedCallback()` | 214-281 | Fetch tokens, build registry, generate CSS, render tree |

### Instance Methods

| Method | Lines | Purpose |
|--------|-------|---------|
| `render(data, path)` | 283-400 | Recursive tree renderer |
| `handleClick(e)` | 402-536 | Event delegation for all button actions |
| `updateChildPaths(element, oldPath, newPath)` | 539-558 | Updates data-path on children after rename |
| `toJSON()` | 560-634 | Reconstructs token object from DOM |
| `handleTokenChange({token, cssVar})` | 636-644 | Updates CSS variable on token edit |

### Events

#### `token-changed` (Bubbles from child `<design-token>`)

```javascript
// Handled internally at Line 209-211
this.addEventListener('token-changed', (e) => {
  this.handleTokenChange(e.detail);
});
```

## Icon System (Lines 4-56)

### Icon Definitions (Lines 4-50)

SVG path data for UI icons:

```javascript
const ICONS = {
  up: { paths: ['M11.293 7.293a1...'], filled: true },
  down: { paths: ['M18 9c.852 0...'], filled: true },
  edit: { paths: ['M4 20h4l10.5...', 'M13.5 6.5l4 4'] },
  groupAdd: { paths: ['M12 19h-7a2...', 'M16 19h6', 'M19 16v6'] },
  groupRemove: { paths: ['M12 19h-7a2...', 'M16 19h6'] },
  tokenAdd: { paths: ['M14 3v4a1...', 'M17 21h-10a2...', 'M12 11l0 6', 'M9 14l6 0'] },
  deleteToken: { paths: ['M19 2h-14a3...'], filled: true }
};
```

### Icon Renderer (Lines 52-56)

```javascript
const renderIcon = (icon) => {
  const { paths, filled } = icon;
  const className = filled ? 'filled' : '';
  return `<svg viewBox="0 0 24 24" class="${className}">${paths.map(d => `<path d="${d}" />`).join('')}</svg>`;
};
```

## Token Types (Lines 66-110)

### W3C Token Types Array (Lines 67-87)

```javascript
const TOKEN_TYPES = [
  // Standard Basic Types
  'color', 'dimension', 'fontFamily', 'fontWeight', 'fontStyle',
  'duration', 'cubicBezier', 'number',
  // Composite Types
  'border', 'shadow', 'gradient', 'typography', 'transition',
  // Custom Types
  'aspectRatio', 'cornerShape', 'customPath'
];
```

### Default Value Factory (Lines 90-110)

```javascript
const getDefaultValue = (type) => {
  switch (type) {
    case 'color': return '#000000';
    case 'dimension': return '1rem';
    case 'fontFamily': return ['system-ui', 'sans-serif'];
    case 'fontWeight': return 400;
    case 'fontStyle': return 'normal';
    case 'duration': return '200ms';
    case 'cubicBezier': return [0.4, 0, 0.2, 1];
    case 'number': return 1;
    case 'aspectRatio': return '16/9';
    case 'border': return { color: '#000000', width: '1px', style: 'solid' };
    case 'shadow': return { color: '#00000033', offsetX: '0px', offsetY: '2px', blur: '4px', spread: '0px' };
    case 'gradient': return [{ color: '#000000', position: 0 }, { color: '#ffffff', position: 1 }];
    case 'typography': return { fontFamily: ['system-ui', 'sans-serif'], fontSize: '1rem', fontWeight: 400, lineHeight: 1.5 };
    case 'transition': return { duration: '200ms', delay: '0ms', timingFunction: [0.4, 0, 0.2, 1] };
    case 'cornerShape': return 'round';
    case 'customPath': return '';
    default: return '';
  }
};
```

## Constructable Stylesheet (Lines 112-194)

### Component Styles

```javascript
const styles = new CSSStyleSheet();
styles.replaceSync(`
  :host {
    --web-config-tokens-gap: clamp(0.375rem, 0.125rem + 1vw, 0.75rem);
    display: block;
    font-family: system-ui, sans-serif;
  }
  /* ... */
`);
```

### Key Style Patterns

| Selector | Lines | Purpose |
|----------|-------|---------|
| `:host` | 114-118 | Base layout, fluid gap |
| `details` | 119-121 | Indentation via data-level attr() |
| `[data-token-group]` | 122-127 | Grid for token cards |
| `[data-level="0"]` | 128-138 | Top-level group styling |
| `.token-wrapper` | 141-142 | Relative position for delete button |
| `.actions` | 157-159 | Show on hover/focus-within |
| `button` | 164-183 | Icon button styling with SVG |
| `dialog` | 190-193 | Modal dialog styling |

## Tree Rendering (Lines 283-400)

### render(data, path) Method

#### Leaf Node Detection (Lines 284-302)

```javascript
// Leaf node (Token)
if (data.$value !== undefined) {
  const name = path.join('.');
  const container = document.createElement('div');
  container.className = 'token-wrapper';
  container.innerHTML = `
    <design-token name="${name}" data-path="${name}"></design-token>
    <button name="action" value="delete" title="Delete Token" class="token-delete-btn">
      ${renderIcon(ICONS.deleteToken)}
    </button>
  `;

  // Set token data and registry programmatically
  const el = container.querySelector('design-token');
  el.registry = this.#registry;
  el.src = data;

  return container;
}
```

#### Root Container (Lines 307-324)

```javascript
if (isRoot) {
  const fieldset = document.createElement('fieldset');
  entries.forEach(([k, v]) => {
    path.push(k);
    fieldset.append(this.render(v, path));
    path.pop();
  });

  const addBtn = document.createElement('button');
  addBtn.innerHTML = `${renderIcon(ICONS.groupAdd)} Add Group`;
  addBtn.name = 'action';
  addBtn.value = 'add-group';
  addBtn.dataset.path = '';
  fieldset.append(addBtn);

  return fieldset;
}
```

#### Group Details/Summary (Lines 326-400)

```javascript
const details = document.createElement('details');
const level = path.length - 1;
const currentPath = path.join('.');

details.setAttribute('data-level', level);
details.setAttribute('data-path', currentPath);

// Accordion behavior: Level 0 groups exclusive, deeper levels share parent path
details.setAttribute('name', level === 0 ? 'token-group' : path.slice(0, -1).join('-'));

const summary = document.createElement('summary');
summary.innerHTML = `
  <span>${titleText}</span>
  <input type="hidden" name="key" value="${key}" data-path="${currentPath}">
  <input type="hidden" name="title" value="${title}">
  <fieldset class="actions">
    <button name="action" value="edit-group" ...>${renderIcon(ICONS.edit)}</button>
    <button name="action" value="move-up" ...>${renderIcon(ICONS.up)}</button>
    <button name="action" value="move-down" ...>${renderIcon(ICONS.down)}</button>
    <button name="action" value="delete" ...>${renderIcon(ICONS.groupRemove)}</button>
  </fieldset>
`;
```

## Event Handling (Lines 402-536)

### handleClick(e) - Event Delegation

#### Early Exit Pattern (Lines 403-404)

```javascript
// Early exit for non-button clicks - major performance improvement
if (e.target.tagName !== 'BUTTON' && !e.target.closest('button')) return;
```

#### Action Switch (Lines 416-536)

```javascript
switch (action) {
  case 'delete':
    if (confirm('Are you sure you want to delete this item?')) {
      container.remove();
    }
    break;

  case 'move-up':
    sibling = container.previousElementSibling;
    if (sibling) sibling.before(container);
    break;

  case 'move-down':
    sibling = container.nextElementSibling;
    if (sibling) sibling.after(container);
    break;

  case 'add-group':
  case 'add-token':
  case 'edit-group':
    // Dialog handling...
    break;
}
```

### Dialog Configuration (Lines 437-463)

```javascript
// Use cached dialog elements
const { dialog, form, typeField, titleEl, confirmBtn } = this.#dialogElements;

// Reset form
form.reset();

// Configure dialog based on action
if (action === 'add-token') {
  typeField.classList.remove('hidden');
  titleEl.textContent = 'Add New Token';
  confirmBtn.textContent = 'Create';
} else if (action === 'add-group') {
  typeField.classList.add('hidden');
  titleEl.textContent = 'Add New Group';
  confirmBtn.textContent = 'Create';
} else if (action === 'edit-group') {
  typeField.classList.add('hidden');
  titleEl.textContent = 'Edit Group';
  confirmBtn.textContent = 'Save';
  // Pre-fill values from current group
}
```

### Dialog Close Handler (Lines 466-532)

```javascript
dialog.onclose = () => {
  if (dialog.returnValue === 'confirm') {
    const formData = new FormData(form);
    const key = formData.get('key');
    const title = formData.get('title');
    const type = formData.get('type');

    if (key) {
      if (action === 'edit-group') {
        // Handle renaming and path updates
        this.updateChildPaths(container, path, newPath);
      } else {
        // Handle Add (Group or Token)
        if (action === 'add-group') {
          const newGroup = { $extensions: { ui: { title: title || key } } };
          node = this.render(newGroup, newPath);
          btn.parentElement.before(node);
        } else {
          // Create new token with default value based on type
          const newToken = {
            $type: type,
            $value: getDefaultValue(type),
            $extensions: { ui: { title: title || key } }
          };
          // Insert into token container
        }
      }
    }
  }
};

dialog.showModal();
```

## Path Management (Lines 539-558)

### updateChildPaths(element, oldPathPrefix, newPathPrefix)

```javascript
updateChildPaths(element, oldPathPrefix, newPathPrefix) {
  const elements = element.querySelectorAll('[data-path]');
  elements.forEach(el => {
    const currentPath = el.dataset.path;
    if (currentPath.startsWith(oldPathPrefix)) {
      const newPath = newPathPrefix + currentPath.substring(oldPathPrefix.length);
      el.dataset.path = newPath;

      if (el.name && el.name !== 'key' && el.name !== 'action') {
        el.name = newPath;
      }

      // Update buttons with data-path
      if (el.tagName === 'BUTTON') {
        el.dataset.path = newPath;
      }
    }
  });
}
```

## JSON Reconstruction (Lines 560-634)

### toJSON() Method

#### DOM Traversal Pattern (Lines 584-631)

```javascript
const traverse = (element) => {
  const result = {};

  // Handle root
  if (element.tagName === 'FORM' || element.tagName === 'FIELDSET') {
    const children = element.children;
    for (const child of children) {
      if (child.tagName === 'DETAILS') {
        const keyInput = child.querySelector('summary > input[name="key"]');
        const key = keyInput ? keyInput.value : null;
        if (key) {
          result[key] = traverse(child.querySelector('fieldset'));

          // Add extensions if title exists
          const titleSpan = child.querySelector('summary > span');
          if (titleSpan && titleSpan.textContent) {
            result[key].$extensions = { ui: { title: titleSpan.textContent } };
          }
        }
      } else if (child.tagName === 'DIV' && child.hasAttribute('data-token-group')) {
        Object.assign(result, traverse(child));
      } else if (child.tagName === 'DIV' && child.querySelector('design-token')) {
        const tokenEl = child.querySelector('design-token');
        const path = tokenEl.dataset.path;
        const key = path.split('.').pop();
        result[key] = tokenEl.src;  // Get token object from element
      }
    }
    return result;
  }

  // Handle token group div
  if (element.tagName === 'DIV' && element.hasAttribute('data-token-group')) {
    for (const child of element.children) {
      if (child.tagName === 'DIV' && child.querySelector('design-token')) {
        const tokenEl = child.querySelector('design-token');
        const path = tokenEl.dataset.path;
        const key = path.split('.').pop();
        result[key] = tokenEl.src;
      }
    }
    return result;
  }

  return result;
};
```

## Token Change Handling (Lines 636-644)

### handleTokenChange({token, cssVar})

```javascript
handleTokenChange({ token, cssVar }) {
  if (!cssVar || !this.#tokenStyles) return;

  // Regenerate CSS value for this token
  const cssValue = toCssValue(token, this.#registry);

  // Update the CSS variable in the host
  this.style.setProperty(cssVar, cssValue);
}
```

## Dependencies

### Imports (Lines 1-2)

| Import | Source | Purpose |
|--------|--------|---------|
| `design-token` | `/ui/design-token/index.js` | Individual token component |
| `buildRegistry` | `/ui/design-token-utils/index.js` | Build token registry |
| `exportTokensToCSS` | `/ui/design-token-utils/index.js` | Generate CSS from tokens |
| `toCssValue` | `/ui/design-token-utils/index.js` | Convert token to CSS value |

## Shadow DOM Structure

### Create Dialog (Lines 240-264)

```html
<dialog id="create-dialog">
  <form method="dialog">
    <h3>Create New Item</h3>
    <label>
      Key (Property Name):
      <input name="key" required pattern="[a-zA-Z0-9_\-]+" title="Alphanumeric, dashes, or underscores">
    </label>
    <label>
      Title (Display Name):
      <input name="title">
    </label>
    <label id="type-field" class="hidden">
      Type:
      <select name="type">
        <option value="color">Color</option>
        <!-- ... all TOKEN_TYPES ... -->
      </select>
    </label>
    <div class="dialog-actions">
      <button value="cancel" formnovalidate>Cancel</button>
      <button value="confirm">Create</button>
    </div>
  </form>
</dialog>
```

### Token Tree Structure

```html
<form id="token-editor">
  <fieldset>
    <!-- Level 0 Group -->
    <details data-level="0" data-path="color" name="token-group">
      <summary>
        <span>Color</span>
        <input type="hidden" name="key" value="color">
        <input type="hidden" name="title" value="Color">
        <fieldset class="actions">
          <button name="action" value="edit-group">...</button>
          <button name="action" value="move-up">...</button>
          <button name="action" value="move-down">...</button>
          <button name="action" value="delete">...</button>
        </fieldset>
      </summary>
      <fieldset>
        <!-- Token container grid -->
        <div data-token-group>
          <div class="token-wrapper">
            <design-token name="color.primary" data-path="color.primary"></design-token>
            <button name="action" value="delete" class="token-delete-btn">...</button>
          </div>
        </div>
        <!-- Nested groups -->
        <div>
          <details data-level="1" data-path="color.semantic" name="color">
            <!-- ... -->
          </details>
        </div>
        <!-- Add buttons -->
        <div class="add-actions">
          <button name="action" value="add-token" data-path="color">Token</button>
          <button name="action" value="add-group" data-path="color">Group</button>
        </div>
      </fieldset>
    </details>
    <!-- Root add group button -->
    <button name="action" value="add-group" data-path="">Add Group</button>
  </fieldset>
</form>
```

## Gotchas & Edge Cases

### 1. Accordion Behavior via name Attribute (Lines 334-337)

```javascript
details.setAttribute('name', level === 0 ? 'token-group' : path.slice(0, -1).join('-'));
```

**Behavior:** Level 0 groups share name `token-group` making them exclusive. Deeper levels share parent-based names for nested accordion behavior.

### 2. First Group Auto-Open (Lines 377-380)

```javascript
if (firstGroup && node.tagName === 'DETAILS') {
  node.open = true;
  firstGroup = false;
}
```

**Gotcha:** Only the first nested group opens automatically. User must click to expand others.

### 3. Event Delegation Performance (Lines 403-404)

```javascript
if (e.target.tagName !== 'BUTTON' && !e.target.closest('button')) return;
```

**Optimization:** Early exit before expensive button lookup improves performance with many tokens.

### 4. Cached Dialog Elements (Lines 268-274)

```javascript
this.#dialogElements = {
  dialog,
  form: dialog.querySelector('form'),
  typeField: dialog.querySelector('#type-field'),
  titleEl: dialog.querySelector('h3'),
  confirmBtn: dialog.querySelector('button[value="confirm"]')
};
```

**Purpose:** Avoid repeated querySelector calls on each dialog open.

### 5. Token Registry Dependency (Lines 297-299)

```javascript
const el = container.querySelector('design-token');
el.registry = this.#registry;
el.src = data;
```

**Order matters:** Registry must be set before src for reference resolution to work.

### 6. CSS Variable Live Update (Lines 636-644)

```javascript
// Update the CSS variable in the host
this.style.setProperty(cssVar, cssValue);
```

**Behavior:** Token changes update CSS inline on host, not the adopted stylesheet. Original stylesheet preserved.

### 7. Path Validation Pattern (Line 247)

```javascript
<input name="key" required pattern="[a-zA-Z0-9_\\-]+" title="Alphanumeric, dashes, or underscores">
```

**Restriction:** Token/group keys must be alphanumeric with dashes or underscores only.

### 8. toJSON Traverses DOM (Lines 584-631)

```javascript
const traverse = (element) => { ... }
return traverse(this.#form);
```

**Gotcha:** JSON reconstruction reads from DOM, not internal state. DOM order becomes source of truth after edits.

### 9. Delete Confirmation (Lines 418-421)

```javascript
case 'delete':
  if (confirm('Are you sure you want to delete this item?')) {
    container.remove();
  }
```

**UX:** Browser confirm dialog used. No undo functionality.

### 10. Dynamic attr() for Indentation (Lines 119-121)

```css
details {
  padding-inline-start: calc(attr(data-level type(<number>)) * var(--web-config-tokens-gap));
}
```

**Browser Support:** Uses CSS `attr()` with type syntax. May not work in all browsers.

## Token File Format

### W3C Compliant JSON Structure

```json
{
  "$extensions": {
    "export": {
      "layer": "design-tokens",
      "selector": ":host"
    }
  },
  "color": {
    "primitive": {
      "$extensions": { "ui": { "title": "Primitive Colors" } },
      "blue": {
        "500": {
          "$type": "color",
          "$value": "#1976D2",
          "$extensions": {
            "css": { "var": "--blue-500" }
          }
        }
      }
    },
    "semantic": {
      "primary": {
        "$type": "color",
        "$value": "{color.primitive.blue.500}",
        "$extensions": {
          "css": { "var": "--color-primary" }
        }
      }
    }
  }
}
```

## Usage Examples

### Basic Usage

```html
<web-config-tokens src="design.tokens.json"></web-config-tokens>

<script type="module">
  import './web-config-tokens/src/index.js';

  const tokenEditor = document.querySelector('web-config-tokens');

  // Listen for individual token changes
  tokenEditor.addEventListener('token-changed', (e) => {
    console.log('Token changed:', e.detail);
  });

  // Export current state as JSON
  const tokensJson = tokenEditor.toJSON();
</script>
```

### Programmatic Token Access

```javascript
const tokenEditor = document.querySelector('web-config-tokens');

// Get reconstructed token object
const tokens = tokenEditor.toJSON();
console.log(JSON.stringify(tokens, null, 2));
```

## Related Components

- [design-token](../design-token/) - Individual token display/edit
- [design-token-utils](../design-token-utils/) - Token conversion and CSS generation
- [design-token-styles](../design-token-styles/) - Shared CSS for token components
- [design-token-editors](../design-token-editors/) - Type-specific editors (color, etc.)

## Debugging Tips

1. **Tokens not loading?** Check `src` attribute URL and network tab
2. **CSS not generating?** Verify `exportTokensToCSS` is called in connectedCallback
3. **References not resolving?** Check registry is built before rendering tokens
4. **Token changes not reflecting?** Verify `token-changed` event bubbles to component
5. **Dialog not opening?** Check cached `#dialogElements` are valid
6. **Path updates failing?** Verify `data-path` attributes are set correctly
7. **Order wrong after move?** Check sibling element exists before DOM manipulation
