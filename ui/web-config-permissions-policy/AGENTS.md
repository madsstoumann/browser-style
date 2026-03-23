# Web Config Permissions-Policy - Internal Architecture

## Overview

Web Config Permissions-Policy is a **web component for editing Permissions-Policy headers**. It provides per-feature controls organized by category (privacy, media, other) with three modes: Disabled, Self only, or Custom origins.

**Package Type:** Web Component (Custom Element)

**Tag Name:** `web-config-permissions-policy`

**Total LOC:** ~280 lines (single file + i18n JSON)

**Key architectural decisions:**
- **Form-associated element**: Integrates with native `<form>` elements via `ElementInternals`
- **Feature grouping**: 12 browser features organized into privacy, media, and other categories
- **Three-mode allowlists**: Each feature can be Disabled (`[]`), Self only (`["self"]`), or Custom (specific origins)
- **Default-deny posture**: All features default to Disabled for maximum security
- **Deep equality**: JSON comparison for array state changes
- **Ready promise**: Async initialization pattern for external consumers

## Architecture Overview

### Component Lifecycle

```
constructor()
  ↓
Create shadow DOM + ElementInternals
  ↓
Initialize all features to [] (disabled)
  ↓
Create translator from i18n.json
  ↓
connectedCallback()
  ↓
Check value/initial-config attributes
  ↓
render() + setFormValue()
  ↓
User changes feature mode or adds origins
  ↓
_updateState() → render()
  ↓
Dispatch permissions-policy-change event
```

## File Structure

```
web-config-permissions-policy/
├── src/
│   ├── index.js        ~280 lines   Main web component
│   └── i18n.json       ---          Translation strings
├── demo.html           ---          Demo page
├── index.html          ---          Documentation page
└── package.json        ---          NPM configuration
```

## Component API

### Custom Element

`<web-config-permissions-policy>`

### Attributes

| Attribute | Type | Description |
|-----------|------|-------------|
| `lang` | string | Language code (`en`, `da`) |
| `value` | string | JSON config object |
| `initial-config` | string | JSON config applied on connect |

### Properties

| Property | Type | Description |
|----------|------|-------------|
| `config` | Object | Get/set full policy config |
| `value` | string | JSON string of current state |
| `headerString` | string | Full serialized header string |

### Events

#### `permissions-policy-change`

```javascript
el.addEventListener('permissions-policy-change', (e) => {
  console.log(e.detail.config);       // { camera: [], geolocation: ["self"], ... }
  console.log(e.detail.headerString); // "camera=(), geolocation=(self), ..."
});
```

## Feature Groups

### Privacy
| Feature | Description |
|---------|-------------|
| `camera` | Camera access |
| `microphone` | Microphone access |
| `geolocation` | Location access |
| `interest-cohort` | FLoC interest cohort |

### Media
| Feature | Description |
|---------|-------------|
| `autoplay` | Media autoplay |
| `picture-in-picture` | PiP mode |
| `display-capture` | Screen capture |
| `encrypted-media` | EME API |
| `fullscreen` | Fullscreen API |

### Other
| Feature | Description |
|---------|-------------|
| `payment` | Payment Request API |
| `screen-wake-lock` | Wake Lock API |
| `xr-spatial-tracking` | WebXR tracking |

## State Structure

```javascript
{
  camera: string[],              // [] = disabled, ["self"] = self only, ["self", "https://..."] = custom
  microphone: string[],
  geolocation: string[],
  "interest-cohort": string[],
  autoplay: string[],
  "picture-in-picture": string[],
  "display-capture": string[],
  "encrypted-media": string[],
  fullscreen: string[],
  payment: string[],
  "screen-wake-lock": string[],
  "xr-spatial-tracking": string[]
}
```

## Dependencies

| Import | Source | Purpose |
|--------|--------|---------|
| `i18nData` | `./i18n.json` | Translation strings |
| `adoptSharedStyles` | `@browser.style/web-config-shared` | Shared CSS |
| `captureOpenDetailsState` | `@browser.style/web-config-shared` | Accordion persistence |
| `createTranslator` | `@browser.style/web-config-shared` | i18n function |
| `restoreOpenDetailsState` | `@browser.style/web-config-shared` | Accordion persistence |
| `setState` | `@browser.style/web-config-shared` | State management |

## Output Example

```
camera=(), microphone=(), geolocation=(self), interest-cohort=(), autoplay=(), picture-in-picture=(), display-capture=(), encrypted-media=(), fullscreen=(self), payment=(), screen-wake-lock=(), xr-spatial-tracking=()
```

## Related Components

- [web-config-shared](../web-config-shared/) - Shared utilities and styles
