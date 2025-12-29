# Web Config CSP

A web component for managing Content Security Policy (CSP) directives with built-in security evaluation, visual editing, and internationalization support.

## Component Overview

| Property | Value |
|----------|-------|
| Custom Element | `<web-config-csp>` |
| Shadow DOM | Yes (open mode, adoptedStyleSheets) |
| Dependencies | `@browser.style/web-config-shared` |
| i18n Support | English, Danish |

## Installation

```bash
npm install @anthropic/web-config-csp
```

## Usage

```html
<web-config-csp
  name="default"
  lang="en"
  evaluate
></web-config-csp>
```

### With Custom Configuration

```html
<web-config-csp
  directives="./custom-directives.json"
  rules="./custom-rules.json"
  i18n="./custom-i18n.json"
></web-config-csp>
```

### Parse Existing CSP

```javascript
const csp = document.querySelector('web-config-csp');
await csp.ready;
csp.fromString("default-src 'self'; script-src 'self' 'unsafe-inline'");
```

## Attributes

| Attribute | Type | Description |
|-----------|------|-------------|
| `name` | string | Configuration profile name |
| `lang` | string | Language code (`en`, `da`) |
| `evaluate` | boolean | Enable security evaluation display |
| `directives` | string | URL to custom directives JSON |
| `rules` | string | URL to custom evaluation rules JSON |
| `i18n` | string | URL to custom i18n JSON |

## Properties

| Property | Type | Description |
|----------|------|-------------|
| `policy` | Object | Get/set full CSP policy object |
| `cspString` | string | Get CSP as formatted header string |
| `evaluations` | Object | Current security evaluation results |
| `state` | Object | Internal component state |
| `ready` | Promise | Resolves when component is initialized |

## Methods

### `fromString(cspString)`
Parse an existing CSP header string into the component.

```javascript
csp.fromString("default-src 'self'; script-src 'self' https://cdn.example.com");
```

### `runEvaluation()`
Manually trigger security evaluation of current policy.

```javascript
const results = csp.runEvaluation();
```

## Events

### `csp-change`
Fired when any directive value changes.

```javascript
csp.addEventListener('csp-change', (e) => {
  console.log('Policy updated:', e.target.cspString);
});
```

## CSP Directives

The component supports 24 CSP directives organized by type:

### Source-List Directives
Directives that accept source expressions (`'self'`, `'unsafe-inline'`, URLs, etc.):

| Directive | Default Enabled | Description |
|-----------|----------------|-------------|
| `base-uri` | Yes | Restricts URLs for `<base>` element |
| `child-src` | No | Sources for workers and frames |
| `connect-src` | No | URLs for fetch, XHR, WebSocket |
| `default-src` | Yes | Fallback for other directives |
| `font-src` | No | Sources for fonts |
| `form-action` | No | URLs for form submissions |
| `frame-ancestors` | Yes | Who can embed this page |
| `frame-src` | No | Sources for frames |
| `img-src` | No | Sources for images |
| `manifest-src` | No | Sources for manifests |
| `media-src` | No | Sources for audio/video |
| `object-src` | Yes | Sources for plugins |
| `prefetch-src` | No | Sources for prefetch |
| `script-src` | No | Sources for scripts |
| `script-src-attr` | No | Inline event handlers |
| `script-src-elem` | No | Script elements |
| `style-src` | No | Sources for stylesheets |
| `style-src-attr` | No | Inline style attributes |
| `style-src-elem` | No | Style elements |
| `worker-src` | No | Sources for workers |

### Token-List Directives
Directives that accept specific keyword values:

| Directive | Description |
|-----------|-------------|
| `require-trusted-types-for` | Require Trusted Types |
| `sandbox` | Enable sandbox mode |
| `trusted-types` | Configure Trusted Types policies |

### Boolean Directives

| Directive | Description |
|-----------|-------------|
| `upgrade-insecure-requests` | Upgrade HTTP to HTTPS |
| `block-all-mixed-content` | Block mixed content |

## Security Evaluation

The component includes a security evaluation engine inspired by Google's CSP Evaluator. When the `evaluate` attribute is present, directives are analyzed for security issues.

### Severity Levels

```javascript
import { SEVERITY } from './evaluate.js';

SEVERITY.HIGH    // Critical security issues
SEVERITY.MEDIUM  // Moderate concerns
SEVERITY.SECURE  // No issues detected
```

### Evaluation Rules

The evaluator checks for:

1. **Unsafe Keywords**
   - `'unsafe-inline'` - HIGH severity
   - `'unsafe-eval'` - HIGH severity
   - `'unsafe-hashes'` - MEDIUM severity

2. **Overly Permissive Sources**
   - `*` wildcard - HIGH severity
   - `http:` scheme - HIGH severity
   - `https:` scheme - MEDIUM severity
   - `data:` scheme - MEDIUM severity

3. **Nonce/Hash Security**
   - Valid `'nonce-...'` patterns - SECURE
   - Valid `'sha256-...'`, `'sha384-...'`, `'sha512-...'` - SECURE

4. **Missing Recommended Directives**
   - Warns if `script-src`, `object-src`, `base-uri` are not configured

### Custom Evaluation Rules

Create custom rules via the `rules` attribute:

```json
{
  "rules": {
    "script-src": {
      "disallowedSources": ["https://cdn.example.com"],
      "message": "External CDN not allowed",
      "severity": "HIGH"
    }
  }
}
```

## Internationalization

The component uses the `createTranslator` utility from web-config-shared for i18n support.

### Default Languages

- **English** (`en`) - Full support
- **Danish** (`da`) - Full support

### Translation Structure

```json
{
  "en": {
    "directives": {
      "default-src": "Default Source",
      "script-src": "Script Source"
    },
    "ui": {
      "enable": "Enable",
      "disable": "Disable",
      "add": "Add",
      "remove": "Remove",
      "evaluate": "Evaluate",
      "copy": "Copy to clipboard"
    },
    "eval": {
      "unsafe-inline": "Allows inline scripts which can be exploited via XSS",
      "unsafe-eval": "Allows eval() and similar dynamic code execution",
      "wildcard": "Allows loading from any source",
      "http-scheme": "Allows loading over insecure HTTP",
      "https-scheme": "Allows any HTTPS source",
      "data-scheme": "Allows data: URIs which can be exploited",
      "missing-directive": "Consider adding this directive for better security"
    }
  }
}
```

### Custom Translations

```html
<web-config-csp i18n="./my-translations.json" lang="de"></web-config-csp>
```

## Output Format

### CSP Header String

```javascript
const csp = document.querySelector('web-config-csp');
console.log(csp.cspString);
// Output: "default-src 'self'; script-src 'self' https://example.com; object-src 'none'"
```

### Policy Object

```javascript
const policy = csp.policy;
// {
//   "default-src": { enabled: true, values: ["'self'"] },
//   "script-src": { enabled: true, values: ["'self'", "https://example.com"] },
//   "object-src": { enabled: true, values: ["'none'"] }
// }
```

## CSS Custom Properties

The component inherits styling from web-config-shared and adds evaluation-specific styles:

```css
/* Evaluation status colors */
.wc-eval-danger { /* HIGH severity - red/warning */ }
.wc-eval-warn { /* MEDIUM severity - yellow/caution */ }
.wc-eval-ok { /* SECURE - green/success */ }

/* Inherited from web-config-shared */
--wc-bg: /* Panel background */
--wc-color: /* Text color */
--wc-border: /* Border color */
--wc-input-bg: /* Input background */
--wc-accent: /* Accent color */
```

## File Structure

```
web-config-csp/
├── src/
│   ├── index.js          # Main WebConfigCsp component
│   ├── index.css         # Evaluation styling
│   ├── evaluate.js       # Security evaluation engine
│   ├── config-utils.js   # Configuration loading utilities
│   ├── csp-directives.json  # Directive definitions
│   └── i18n.json         # Default translations
├── examples/
│   ├── custom-directives.json
│   └── custom-rules.json
├── demo.html
└── package.json
```

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      WebConfigCsp                            │
├─────────────────────────────────────────────────────────────┤
│  Shadow DOM                                                  │
│  ┌─────────────────────────────────────────────────────────┐│
│  │  Adopted Stylesheets (shared + local CSS)               ││
│  │  ┌─────────────────────────────────────────────────────┐││
│  │  │  Directive Editor UI                                │││
│  │  │  - Toggle enabled/disabled                          │││
│  │  │  - Source value inputs                              │││
│  │  │  - Security evaluation badges                       │││
│  │  └─────────────────────────────────────────────────────┘││
│  └─────────────────────────────────────────────────────────┘│
├─────────────────────────────────────────────────────────────┤
│  Dependencies                                                │
│  ├── web-config-shared (setState, createTranslator, styles) │
│  ├── config-utils.js (loadAndMergeConfigs)                  │
│  └── evaluate.js (evaluatePolicy, SEVERITY)                 │
└─────────────────────────────────────────────────────────────┘
```

## Key Implementation Details

### State Management
Uses `setState` from web-config-shared for reactive updates:

```javascript
import { setState } from '@browser.style/web-config-shared';

// Updates state and triggers re-render
setState(this, { directives: updatedDirectives });
```

### Configuration Loading
Supports URL-based or inline JSON configuration:

```javascript
import { loadAndMergeConfigs } from './config-utils.js';

// Load and merge with defaults
const config = await loadAndMergeConfigs(
  attributeValue,      // URL or inline JSON
  defaultConfig,       // Built-in defaults
  this.getAttribute('name')  // Config profile name
);
```

### Translation System
```javascript
import { createTranslator } from '@browser.style/web-config-shared';

this.t = createTranslator(
  () => this.i18nConfig,
  () => this.lang || 'en'
);

// Usage
this.t('directives.default-src')  // "Default Source"
this.t('eval.unsafe-inline')      // Security warning message
```

## Integration Example

```html
<!DOCTYPE html>
<html>
<head>
  <script type="importmap">
  {
    "imports": {
      "@browser.style/web-config-csp": "./src/index.js",
      "@browser.style/web-config-shared": "../web-config-shared/src/index.js"
    }
  }
  </script>
</head>
<body>
  <web-config-csp
    name="production"
    lang="en"
    evaluate
  ></web-config-csp>

  <script type="module">
    import '@browser.style/web-config-csp';

    const csp = document.querySelector('web-config-csp');

    // Wait for initialization
    await csp.ready;

    // Parse existing policy
    csp.fromString("default-src 'self'; script-src 'self' 'unsafe-inline'");

    // Listen for changes
    csp.addEventListener('csp-change', () => {
      console.log('New CSP:', csp.cspString);
      console.log('Evaluations:', csp.evaluations);
    });
  </script>
</body>
</html>
```

## Security Considerations

1. **Always evaluate policies** - Use the `evaluate` attribute in development
2. **Avoid unsafe keywords** - `'unsafe-inline'` and `'unsafe-eval'` significantly weaken CSP
3. **Use nonces or hashes** - Prefer cryptographic validation over unsafe keywords
4. **Restrict default-src** - Set `default-src 'self'` or `'none'` as baseline
5. **Configure object-src** - Set to `'none'` to prevent plugin-based attacks
6. **Test in report-only mode** - Use CSP reporting before enforcement
