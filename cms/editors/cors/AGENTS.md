# Editor CORS - Internal Architecture

## Overview

Editor CORS is a **web component for editing CORS (Cross-Origin Resource Sharing) headers**. It provides a structured interface for configuring origins, methods, headers, and options with live header preview and validation warnings.

**Package Type:** Web Component (Custom Element)

**Tag Name:** `editor-cors`

**Total LOC:** ~340 lines (single file + i18n JSON)

**Key architectural decisions:**
- **Form-associated element**: Integrates with native `<form>` elements via `ElementInternals`
- **Wildcard/credentials validation**: Automatically disables credentials when `*` is in allowed origins
- **OPTIONS auto-warning**: Warns when OPTIONS method is missing from allowed methods
- **Header presets**: Common headers (Content-Type, Authorization, etc.) available as one-click buttons
- **Deep equality**: JSON comparison for array state changes
- **Ready promise**: Async initialization pattern for external consumers

## Architecture Overview

### Component Lifecycle

```
constructor()
  ↓
Create shadow DOM + ElementInternals
  ↓
Initialize default state (GET+OPTIONS, max_age 86400)
  ↓
Create translator from i18n.json
  ↓
connectedCallback()
  ↓
Check value/initial-config attributes
  ↓
render() + setFormValue()
  ↓
User edits configuration
  ↓
_updateState() → render()
  ↓
Dispatch cors-change event
```

## File Structure

```
editor-cors/
├── src/
│   ├── index.js        ~340 lines   Main web component
│   └── i18n.json       ---          Translation strings
├── demo.html           ---          Demo page
├── index.html          ---          Documentation page
└── package.json        ---          NPM configuration
```

## Component API

### Custom Element

`<editor-cors>`

### Attributes

| Attribute | Type | Description |
|-----------|------|-------------|
| `lang` | string | Language code (`en`, `da`) |
| `value` | string | JSON config object |
| `initial-config` | string | JSON config applied on connect |

### Properties

| Property | Type | Description |
|----------|------|-------------|
| `config` | Object | Get/set full CORS config |
| `value` | string | JSON string of current state |
| `headerStrings` | string | Full serialized CORS headers |

### Events

#### `cors-change`

```javascript
el.addEventListener('cors-change', (e) => {
  console.log(e.detail.config);
  console.log(e.detail.headerStrings);
});
```

## UI Sections

### Origins
- Tag-style multi-input for origin URLs
- Special value `*` disables the credentials option

### Methods
- Checkbox group: GET, POST, PUT, PATCH, DELETE, OPTIONS
- Warning when OPTIONS is not selected

### Headers
- Allowed Headers: tag-style multi-input with preset buttons
- Preset buttons: Content-Type, Authorization, X-Requested-With, Accept, Origin
- Expose Headers: separate tag-style multi-input

### Options
- Max Age: numeric input (seconds), default 86400
- Allow Credentials: checkbox, disabled when wildcard origin is present

## State Structure

```javascript
{
  allowed_origins: string[],    // Origin URLs or ["*"]
  allowed_methods: string[],    // HTTP methods
  allowed_headers: string[],    // Request headers
  expose_headers: string[],     // Response headers to expose
  max_age: number,              // Preflight cache seconds
  allow_credentials: boolean    // Send credentials
}
```

## Validation Rules

1. `allow_credentials: true` + `allowed_origins: ["*"]` is invalid (browsers reject this)
2. `OPTIONS` should always be in `allowed_methods` for preflight support

## Dependencies

| Import | Source | Purpose |
|--------|--------|---------|
| `i18nData` | `./i18n.json` | Translation strings |
| `adoptSharedStyles` | `@browser.style/editor-shared` | Shared CSS |
| `captureOpenDetailsState` | `@browser.style/editor-shared` | Accordion persistence |
| `createTranslator` | `@browser.style/editor-shared` | i18n function |
| `restoreOpenDetailsState` | `@browser.style/editor-shared` | Accordion persistence |
| `setState` | `@browser.style/editor-shared` | State management |

## Output Example

```
Access-Control-Allow-Origin: https://app.example.com
Access-Control-Allow-Methods: GET, POST, OPTIONS
Access-Control-Allow-Headers: Content-Type, Authorization
Access-Control-Max-Age: 86400
Access-Control-Allow-Credentials: true
```

## Related Components

- [editor-shared](../editor-shared/) - Shared utilities and styles
