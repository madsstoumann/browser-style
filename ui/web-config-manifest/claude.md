# Web Config Manifest - Internal Architecture

## Overview

Web Config Manifest is a **web component for editing Web App Manifest files**. It provides a form-based UI for configuring PWA settings with live JSON output and form-association support for integration with native HTML forms.

**Package Type:** Web Component (Custom Element)

**Tag Name:** `web-config-manifest`

**Total LOC:** ~245 lines (single file + i18n JSON)

**Key architectural decisions:**
- **Form-associated element**: Integrates with native `<form>` elements via `ElementInternals`
- **Accordion sections**: Uses `<details>` elements with state persistence
- **Dual color inputs**: Synchronized color picker and text input pairs
- **Live JSON output**: Real-time manifest preview as user types
- **External loading**: Supports loading from existing manifest.json files

## Architecture Overview

### Component Lifecycle

```
constructor()
  ↓
Create shadow DOM + ElementInternals
  ↓
Initialize default state
  ↓
Create translator from i18n.json
  ↓
connectedCallback()
  ↓
Check src attribute → Load external manifest.json
  OR
Check value attribute → Parse inline JSON
  ↓
render() + setFormValue()
  ↓
User edits form
  ↓
_updateState() → render() or updateOutput()
  ↓
Dispatch manifest-change event
```

### Form Association Flow

```
<form>
  <web-config-manifest name="manifest"></web-config-manifest>
  <button type="submit">Save</button>
</form>

Form submission:
  ↓
ElementInternals.setFormValue(JSON.stringify(state))
  ↓
FormData includes manifest field
```

## File Structure

```
web-config-manifest/
├── src/
│   ├── index.js        245 lines   Main web component
│   └── i18n.json       ---         Translation strings
├── demo.html           ---         Demo page
└── claude.md           ---         This file
```

## Component API

### Class Definition

**File:** [src/index.js](src/index.js)

**Lines 5-244:** `WebConfigManifest extends HTMLElement`

**Registration:** Line 244: `customElements.define('web-config-manifest', WebConfigManifest);`

### Static Properties (Lines 6-7)

```javascript
static formAssociated = true;  // Enables form participation
static observedAttributes = ['lang', 'value', 'src'];
```

### Constructor (Lines 9-29)

```javascript
constructor() {
  super();
  this.attachShadow({ mode: 'open' });
  this._loadStyles();
  this._internals = this.attachInternals();  // Form association
  this._loadedUrls = { src: null };          // Track loaded URLs
  this.t = createTranslator(i18nData, () => this.lang || this.getAttribute('lang') || 'en');

  this.state = {
    name: '',
    short_name: '',
    description: '',
    display: 'standalone',
    orientation: 'any',
    theme_color: '#222222',
    background_color: '#eeeeee',
    start_url: '/',
    scope: '/',
    icons: []
  };
}
```

### Observed Attributes

| Attribute | Lines | Description |
|-----------|-------|-------------|
| `lang` | 90 | Language code for translations |
| `value` | 98-104 | Inline JSON manifest data |
| `src` | 91-97 | URL to load manifest.json from |

### Properties

#### `value` (Lines 107-113)

```javascript
get value() {
  return JSON.stringify(this.state, null, 2);  // Pretty-printed JSON
}

set value(val) {
  this.setAttribute('value', val);  // Triggers attributeChangedCallback
}
```

### Lifecycle Methods

| Method | Lines | Purpose |
|--------|-------|---------|
| `connectedCallback()` | 65-86 | Load from src/value, initial render |
| `attributeChangedCallback()` | 88-105 | Handle attribute changes |
| `_loadStyles()` | 57-63 | Adopt shared stylesheet |

### Instance Methods

#### `_applyManifestData(data)` (Lines 31-42)

Applies manifest data to component state.

```javascript
/* Lines 31-42 */
_applyManifestData(data) {
  if (typeof data !== 'object' || data === null) return;

  const nextState = { ...this.state };
  const stringKeys = ['name', 'short_name', 'description', 'display',
                      'orientation', 'theme_color', 'background_color',
                      'start_url', 'scope'];

  for (const key of stringKeys) {
    if (key in data) nextState[key] = String(data[key] ?? '');
  }
  if (Array.isArray(data.icons)) nextState.icons = data.icons;

  this._updateState(nextState);
}
```

#### `_loadFromManifestJson(url)` (Lines 44-55)

Fetches and parses external manifest.json file.

```javascript
/* Lines 44-55 */
async _loadFromManifestJson(url) {
  try {
    const response = await fetch(url);
    const text = await response.text();
    const parsed = JSON.parse(text);
    this._applyManifestData(parsed);
  } catch (error) {
    console.error(`Failed to load manifest.json from ${url}:`, error);
    this.render();
    this._internals.setFormValue(this.value);
  }
}
```

#### `_updateState(partialState, skipRender)` (Lines 115-122)

Updates state and triggers re-render or output update.

```javascript
/* Lines 115-122 */
_updateState(partialState, skipRender = false) {
  const changedKeys = setState(this, partialState);
  if (changedKeys.length === 0) return;

  if (!skipRender) this.render();
  else this.updateOutput();

  this.dispatchChangeEvent();
  this._internals.setFormValue(this.value);  // Update form value
}
```

#### `updateOutput()` (Lines 132-137)

Updates only the JSON output without full re-render.

```javascript
/* Lines 132-137 */
updateOutput() {
  const code = this.shadowRoot.querySelector('code');
  if (code) {
    code.textContent = this.value;
  }
}
```

### Events

#### `manifest-change` (Lines 124-130)

```javascript
dispatchChangeEvent() {
  this.dispatchEvent(new CustomEvent('manifest-change', {
    detail: this.state,
    bubbles: true,
    composed: true
  }));
}
```

## Shadow DOM Structure (Lines 143-217)

```html
<!-- Identity Section -->
<details name="manifest-accordion" data-panel="identity" open data-status="ok">
  <summary>Identity</summary>
  <div>
    <label>
      <small>Name</small>
      <input type="text" data-key="name" placeholder="App Name">
    </label>
    <label>
      <small>Short Name</small>
      <input type="text" data-key="short_name" placeholder="App">
    </label>
    <label>
      <small>Description</small>
      <textarea data-key="description" placeholder="Description"></textarea>
    </label>
  </div>
</details>

<!-- Presentation Section -->
<details name="manifest-accordion" data-panel="presentation">
  <summary>Presentation</summary>
  <div>
    <label>
      <small>Display Mode</small>
      <select data-key="display">
        <option value="fullscreen">Fullscreen</option>
        <option value="standalone" selected>Standalone</option>
        <option value="minimal-ui">Minimal UI</option>
        <option value="browser">Browser</option>
      </select>
    </label>
    <label>
      <small>Orientation</small>
      <select data-key="orientation">
        <option value="any" selected>Any</option>
        <option value="natural">Natural</option>
        <option value="landscape">Landscape</option>
        <option value="portrait">Portrait</option>
      </select>
    </label>

    <!-- Color inputs with synchronization -->
    <small>Theme Color</small>
    <fieldset>
      <input type="color" value="#222222" data-key="theme_color">
      <input type="text" value="#222222" data-key="theme_color">
    </fieldset>

    <small>Background Color</small>
    <fieldset>
      <input type="color" value="#eeeeee" data-key="background_color">
      <input type="text" value="#eeeeee" data-key="background_color">
    </fieldset>
  </div>
</details>

<!-- Navigation Section -->
<details name="manifest-accordion" data-panel="navigation">
  <summary>Navigation</summary>
  <div>
    <label>
      <small>Start URL</small>
      <input type="text" data-key="start_url" placeholder="/">
    </label>
    <label>
      <small>Scope</small>
      <input type="text" data-key="scope" placeholder="/">
    </label>
  </div>
</details>

<!-- JSON Output -->
<pre><code>{ ... manifest JSON ... }</code></pre>
```

## Event Handling (Lines 224-240)

### Input Handler

```javascript
/* Lines 224-240 */
addEventListeners() {
  this.shadowRoot.querySelectorAll('input, select, textarea').forEach(el => {
    el.addEventListener('input', (e) => {
      const key = e.target.dataset.key;
      if (key) {
        // Update state without full re-render
        this._updateState({ [key]: e.target.value }, true);

        // Sync color inputs (text <-> color picker)
        if (key === 'theme_color' || key === 'background_color') {
          const siblings = this.shadowRoot.querySelectorAll(`[data-key="${key}"]`);
          siblings.forEach(sib => {
            if (sib !== e.target) sib.value = e.target.value;
          });
        }
      }
    });
  });
}
```

## State Structure

```javascript
{
  name: string,            // App name
  short_name: string,      // Short name for home screen
  description: string,     // App description
  display: string,         // 'fullscreen' | 'standalone' | 'minimal-ui' | 'browser'
  orientation: string,     // 'any' | 'natural' | 'landscape' | 'portrait'
  theme_color: string,     // CSS color value
  background_color: string, // CSS color value
  start_url: string,       // Starting URL path
  scope: string,           // Navigation scope
  icons: Array             // Icon definitions (preserved but not edited)
}
```

## Dependencies

| Import | Line | Source | Purpose |
|--------|------|--------|---------|
| `i18nData` | 1 | `./i18n.json` | Translation strings |
| `adoptSharedStyles` | 3 | `@browser.style/web-config-shared` | Shared CSS |
| `captureOpenDetailsState` | 3 | `@browser.style/web-config-shared` | Accordion persistence |
| `createTranslator` | 3 | `@browser.style/web-config-shared` | i18n function |
| `restoreOpenDetailsState` | 3 | `@browser.style/web-config-shared` | Accordion persistence |
| `setState` | 3 | `@browser.style/web-config-shared` | State management |

## Manifest Output Example

```json
{
  "name": "My Progressive Web App",
  "short_name": "MyPWA",
  "description": "A sample progressive web application",
  "display": "standalone",
  "orientation": "any",
  "theme_color": "#1976D2",
  "background_color": "#ffffff",
  "start_url": "/",
  "scope": "/",
  "icons": []
}
```

## Usage Examples

### Basic Usage

```html
<web-config-manifest lang="en"></web-config-manifest>

<script type="module">
  import '@browser.style/web-config-manifest';

  const manifest = document.querySelector('web-config-manifest');
  manifest.addEventListener('manifest-change', (e) => {
    console.log('Manifest updated:', e.detail);
  });
</script>
```

### Load Existing Manifest

```html
<web-config-manifest src="/manifest.json"></web-config-manifest>
```

### Inline Value

```html
<web-config-manifest value='{"name":"My App","display":"standalone"}'></web-config-manifest>
```

### Form Integration

```html
<form id="settings-form">
  <web-config-manifest name="manifest"></web-config-manifest>
  <button type="submit">Save Settings</button>
</form>

<script>
  document.getElementById('settings-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const manifestJson = formData.get('manifest');
    console.log('Saving manifest:', JSON.parse(manifestJson));
  });
</script>
```

### Programmatic Access

```javascript
const manifest = document.querySelector('web-config-manifest');

// Get current manifest JSON
console.log(manifest.value);

// Set manifest data
manifest.value = JSON.stringify({
  name: 'Updated App',
  display: 'fullscreen'
});
```

## Gotchas & Edge Cases

### 1. Form Association Requires attachInternals() (Line 13)

```javascript
this._internals = this.attachInternals();
```

The component must call `attachInternals()` in the constructor. This is only available in browsers supporting form-associated custom elements.

### 2. URL Loading Prevents Duplicate Fetches (Lines 69-73, 91-97)

```javascript
if (srcUrl) {
  this._loadedUrls.src = srcUrl;  // Track loaded URL
  await this._loadFromManifestJson(srcUrl);
  return;  // Early return prevents re-render
}
```

The component tracks loaded URLs to prevent duplicate fetches on attribute changes.

### 3. Color Input Synchronization (Lines 231-236)

```javascript
if (key === 'theme_color' || key === 'background_color') {
  const siblings = this.shadowRoot.querySelectorAll(`[data-key="${key}"]`);
  siblings.forEach(sib => {
    if (sib !== e.target) sib.value = e.target.value;
  });
}
```

Each color has both `<input type="color">` and `<input type="text">`. Changes to either sync the other.

### 4. Skip Render Optimization (Line 229)

```javascript
this._updateState({ [key]: e.target.value }, true);  // skipRender = true
```

During input events, only the JSON output is updated (via `updateOutput()`) to avoid losing focus. Full re-render only happens on attribute changes.

### 5. Icons Array Preserved But Not Edited (Line 39)

```javascript
if (Array.isArray(data.icons)) nextState.icons = data.icons;
```

Icons are loaded and included in output but the UI doesn't provide icon editing. They're preserved from loaded manifests.

### 6. Accordion Panel Persistence (Lines 141, 219)

```javascript
const openState = captureOpenDetailsState(this.shadowRoot);
// ... render ...
restoreOpenDetailsState(this.shadowRoot, openState);
```

Open/closed state of accordion panels is preserved across re-renders.

### 7. First Panel Open by Default (Line 145)

```html
<details name="manifest-accordion" data-panel="identity" open data-status="ok">
```

The identity panel is open by default (has `open` attribute).

### 8. FormData Integration (Line 121)

```javascript
this._internals.setFormValue(this.value);
```

Every state change updates the form value, ensuring the manifest is always included in form submissions.

### 9. Language Change Triggers Re-render (Line 90)

```javascript
if (name === 'lang') this.render();
```

Changing the `lang` attribute re-renders the entire component with new translations.

### 10. Invalid JSON Silent Failure (Lines 79-81, 101-103)

```javascript
try {
  this._applyManifestData(JSON.parse(value));
} catch (e) {
  // ignore invalid JSON
}
```

Invalid JSON in the `value` attribute is silently ignored. Check console for manifest.json loading errors.

## Translation Keys

```json
{
  "ui": {
    "identity": "Identity",
    "presentation": "Presentation",
    "navigation": "Navigation",
    "name": "Name",
    "nameHint": "Full application name",
    "shortName": "Short Name",
    "shortNameHint": "Name for home screen",
    "description": "Description",
    "descriptionHint": "App description",
    "display": "Display Mode",
    "orientation": "Orientation",
    "themeColor": "Theme Color",
    "backgroundColor": "Background Color",
    "startUrl": "Start URL",
    "startUrlHint": "/",
    "scope": "Scope",
    "scopeHint": "/"
  },
  "options": {
    "display": {
      "fullscreen": "Fullscreen",
      "standalone": "Standalone",
      "minimal-ui": "Minimal UI",
      "browser": "Browser"
    },
    "orientation": {
      "any": "Any",
      "natural": "Natural",
      "landscape": "Landscape",
      "portrait": "Portrait"
    }
  }
}
```

## Debugging Tips

1. **Manifest not loading?** Check src URL is accessible and returns valid JSON
2. **Form value empty?** Ensure `formAssociated = true` and component is inside a `<form>`
3. **Colors not syncing?** Check both inputs have same `data-key` attribute
4. **Translation missing?** Verify language code matches i18n.json keys
5. **State not updating?** Check `setState` returns changed keys
6. **Panel state lost?** Ensure `data-panel` attribute is set on `<details>`

## Related Components

- [web-config-shared](../web-config-shared/) - Shared utilities and styles
