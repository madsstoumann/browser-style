# CSP Manager Web Component

A powerful, interactive web component for building and managing Content Security Policy (CSP) directives with built-in security evaluation.

[![npm version](https://img.shields.io/npm/v/@browser.style/csp-manager.svg)](https://www.npmjs.com/package/@browser.style/csp-manager)
[![License: ISC](https://img.shields.io/badge/License-ISC-blue.svg)](https://opensource.org/licenses/ISC)

## ✨ Features

### Core Functionality
- **🎨 Interactive Visual Editor**: Easily add, remove, and manage CSP directive values through an intuitive UI
- **🔒 Built-in Security Evaluation**: Real-time security checks based on Google's CSP Evaluator
- **🚦 Color-Coded Severity Levels**: Visual indicators (red/orange/green) for security issues
- **📝 Live Preview**: See the generated `<meta>` tag update in real-time
- **🌍 Internationalization**: Full i18n support (English and Danish included)

### Smart UI Features
- **Boolean Directives**: Directives like `upgrade-insecure-requests` are handled as simple toggles
- **Token-based Directives**: Directives like `sandbox` provide dropdowns of valid tokens
- **Autocomplete**: Native `<datalist>` integration for quick directive selection
- **Collapsible Sections**: Clean interface showing only relevant directives

### Developer-Friendly
- **📦 CMS Integration**: Ready for Contentful, Storyblok, and other headless CMSs
- **🔔 Event System**: `csp-change` event fires on every policy modification
- **💾 Multiple Formats**: Export as JSON policy object or CSP header string
- **🎯 Parse CSP Strings**: Import existing CSP policies via `fromString()` method
- **♿ Accessible**: Screen-reader-friendly with proper ARIA patterns

---

## 📦 Installation

### Via npm

```bash
npm install @browser.style/csp-manager
```

### Via CDN

```html
<script type="module" src="https://unpkg.com/@browser.style/csp-manager/src/index.js"></script>
```

---

## 🚀 Quick Start

### Basic Usage

```html
<!DOCTYPE html>
<html>
<head>
  <script type="module">
    import '@browser.style/csp-manager';
  </script>
</head>
<body>
  <csp-manager></csp-manager>
</body>
</html>
```

### With Security Evaluation

Enable real-time security checks:

```html
<csp-manager evaluate></csp-manager>
```

### With Language Support

```html
<csp-manager lang="da" evaluate></csp-manager>
```

---

## 📚 Documentation

- **[Live Demo](https://browser.style/ui/csp-manager/demo.html)** - See all features in action
- **[Custom Configuration](https://browser.style/ui/csp-manager/config.html)** - Add custom directives and rules
- **[Contentful Integration](./docs/contentful.md)** - Complete guide for Contentful CMS
- **[Storyblok Integration](./docs/storyblok.md)** - Complete guide for Storyblok CMS

---

## 🎯 Key Features Explained

### Security Evaluation

The component includes a security evaluator based on simplified logic from [Google's CSP Evaluator](https://csp-evaluator.withgoogle.com/):

```html
<csp-manager evaluate></csp-manager>
```

**What it checks:**
- 🔴 **High Severity**: `'unsafe-inline'`, `'unsafe-eval'` in script/style directives
- 🟠 **Medium Severity**: Wildcards (`*`, `http:`, `https:`), `data:` URIs
- 🟢 **Secure**: Nonces, hashes, strict policies

**Visual Feedback:**
- Red borders for critical security issues
- Orange borders for warnings
- Green borders for secure configurations
- Inline recommendations for fixes

---

### Event System

Listen to policy changes for CMS integration:

```javascript
const cspManager = document.querySelector('csp-manager');

cspManager.addEventListener('csp-change', (event) => {
  const { policy, cspString, evaluations } = event.detail;

  // Save to CMS
  cms.updateField('csp_policy', policy);

  // Check for security issues
  if (evaluations) {
    console.log('Security evaluation:', evaluations);
  }
});
```

**Event Detail Properties:**
- `policy` - Policy object (JSON-serializable)
- `cspString` - Generated CSP header string
- `evaluations` - Security evaluation results (if `evaluate` attribute present)

**When the event fires:**
- Adding/removing directive values
- Enabling/disabling directives
- Setting policy via `policy` property
- Parsing CSP string via `fromString()`

---

### Parsing CSP Strings

Import existing CSP policies:

```javascript
const cspManager = document.querySelector('csp-manager');

const existingCSP = `
  script-src 'self' https://cdn.example.com;
  style-src 'self' 'unsafe-inline';
  img-src 'self' data: https:;
`;

cspManager.fromString(existingCSP);
```

---

## 🔧 API Reference

### Attributes

| Attribute | Type | Description |
|-----------|------|-------------|
| `evaluate` | Boolean | Enable security evaluation |
| `lang` | String | Language code (e.g., `"en"`, `"da"`) |
| `initial-policy` | String | JSON string of initial policy |
| `directives` | String | JSON string or URL for custom directives config |
| `i18n` | String | JSON string or URL for custom translations |
| `rules` | String | JSON string or URL for custom evaluation rules |

### Properties

#### `policy` (get/set)

Get or set the entire CSP configuration:

```javascript
// Get current policy
const currentPolicy = cspManager.policy;
console.log(JSON.stringify(currentPolicy, null, 2));

// Set policy (simplified client format)
cspManager.policy = {
  "script-src": {
    "added": ["https://cdn.example.com", "'unsafe-inline'"]
  },
  "style-src": {
    "added": ["https://fonts.googleapis.com"]
  }
};
```

**Policy Format:**
```typescript
{
  [directive: string]: {
    added: string[],      // Values added by user
    defaults?: string[]   // Optional: override defaults
  }
}
```

#### `cspString` (get)

Get the generated CSP meta tag:

```javascript
const metaTag = cspManager.cspString;
// Returns: <meta http-equiv="Content-Security-Policy" content="...">

// For plain text:
const plainText = metaTag.replace(/&lt;/g, '<').replace(/&gt;/g, '>');
```

---

### Methods

#### `fromString(cspString)`

Parse and load a CSP string:

```javascript
cspManager.fromString("script-src 'self'; style-src 'self' 'unsafe-inline'");
```

#### `enableDirective(directiveName)`

Enable a directive programmatically:

```javascript
cspManager.enableDirective('font-src');
```

#### `addValue(directive, value)`

Add a value to a directive:

```javascript
cspManager.addValue('script-src', 'https://cdn.example.com');
```

#### `removeValue(directive, index)`

Remove a value by index:

```javascript
cspManager.removeValue('script-src', 0);
```

#### `getAvailableDirectives()`

Get list of disabled directives:

```javascript
const available = cspManager.getAvailableDirectives();
// Returns: [{ key: "font-src", description: "..." }, ...]
```

#### `runEvaluation()`

Manually trigger security evaluation (if `evaluate` attribute is set):

```javascript
cspManager.runEvaluation();
```

#### `setDirectivesConfig(config)`

Add or override directive definitions. Merges with existing configuration:

```javascript
cspManager.setDirectivesConfig({
  'navigate-to': {
    defaults: ["'self'"],
    type: 'source-list',
    enabled: false
  }
});
```

#### `setI18nConfig(config)`

Add or override translations. Deep merges with existing i18n data:

```javascript
cspManager.setI18nConfig({
  en: {
    directives: {
      'navigate-to': 'Restricts navigation URLs'
    }
  }
});
```

#### `setRulesConfig(config)`

Replace evaluation rules. Merges with default rules:

```javascript
cspManager.setRulesConfig({
  unsafeKeywords: {
    "'wasm-unsafe-eval'": {
      severity: 'medium',
      messageKey: 'eval.wasmWarning',
      recommendationKey: 'eval.wasmWarningRec'
    }
  }
});
```

---

## 🛠️ Custom Configuration

The CSP Manager supports custom directives, translations, and evaluation rules, allowing you to extend the component as new CSP directives are added or when you need custom security policies.

### Why Custom Configuration?

- **Future-proof**: Add new CSP directives as they're added to the specification
- **Organization-specific**: Define custom security rules for your company
- **Experimental features**: Test browser-specific or experimental directives
- **Multi-language**: Add translations for additional languages

### Quick Start

#### HTML Attributes (Static)

Load custom configurations via attributes (read once on mount):

```html
<!-- Inline JSON -->
<csp-manager
  directives='{"navigate-to": {"defaults": [], "type": "source-list"}}'
  i18n='{"en": {"directives": {"navigate-to": "Navigation directive"}}}'
></csp-manager>

<!-- External Files -->
<csp-manager
  directives="./custom-directives.json"
  i18n="./custom-i18n.json"
  rules="./custom-rules.json"
></csp-manager>
```

#### JavaScript Setters (Dynamic)

Configure programmatically after mount:

```javascript
const manager = document.querySelector('csp-manager');

// Add custom directive
manager.setDirectivesConfig({
  'prefetch-src': {
    defaults: ["'self'"],
    type: 'source-list',
    enabled: false
  }
});

// Add translation
manager.setI18nConfig({
  en: {
    directives: {
      'prefetch-src': 'Valid sources for prefetch and prerendering'
    }
  }
});

// Add evaluation rule
manager.setRulesConfig({
  criticalDirectives: {
    'form-action': {
      messageKey: 'eval.missingFormAction',
      recommendationKey: 'eval.missingFormActionRec'
    }
  }
});
```

### Configuration Formats

#### Directives Configuration

```json
{
  "directive-name": {
    "defaults": ["'self'"],
    "type": "source-list",
    "enabled": false,
    "tokens": []
  }
}
```

**Types:**
- `source-list` - URL sources (e.g., `script-src`, `style-src`)
- `token-list` - Predefined tokens (e.g., `sandbox`)
- `boolean` - Flag directives (e.g., `upgrade-insecure-requests`)

#### i18n Configuration

```json
{
  "en": {
    "directives": {
      "directive-name": "Description"
    },
    "eval": {
      "messageKey": "Evaluation message",
      "recommendationKey": "Recommendation"
    }
  }
}
```

#### Rules Configuration

```json
{
  "unsafeKeywords": {
    "'keyword'": {
      "severity": "high",
      "messageKey": "eval.message",
      "recommendationKey": "eval.recommendation"
    }
  },
  "criticalDirectives": {
    "directive": {
      "messageKey": "eval.missing",
      "recommendationKey": "eval.missingRec"
    }
  }
}
```

### Examples

See [config.html](./config.html) for interactive examples and the [examples/](./examples/) folder for sample JSON files.

---

## 🎨 Customization

### CSS Custom Properties

Customize the appearance:

```css
csp-manager {
  /* Colors */
  --csp-manager-accent: hsl(211, 100%, 95%);
  --csp-manager-accent-dark: hsl(211, 50%, 50%);
  --csp-manager-buttonface: #efefef;

  /* Evaluation colors */
  --csp-eval-high: hsl(0, 80%, 50%);
  --csp-eval-high-bg: hsl(0, 80%, 95%);
  --csp-eval-medium: hsl(35, 90%, 50%);
  --csp-eval-medium-bg: hsl(35, 90%, 95%);
  --csp-eval-secure: hsl(120, 50%, 45%);
  --csp-eval-secure-bg: hsl(120, 50%, 95%);

  /* Typography */
  --csp-manager-ff-mono: 'Courier New', monospace;
  --csp-manager-ff-system: system-ui, sans-serif;
  --csp-manager-font-size: 14px;

  /* Spacing */
  --csp-manager-gap: 1rem;
  --csp-manager-bdrs: 0.5rem;
  --csp-manager-tab-width: 2;
}
```

---

## 🌍 Internationalization

### Available Languages

- English (`en`) - Default
- Danish (`da`)

### Usage

```html
<csp-manager lang="da"></csp-manager>
```

### Translation Structure

The `i18n.json` file contains:

```json
{
  "en": {
    "directives": {
      "script-src": "Specifies valid sources for JavaScript.",
      ...
    },
    "ui": {
      "add": "Add",
      "addDirective": "Add Directive",
      ...
    },
    "eval": {
      "unsafeInline": "Using 'unsafe-inline' allows inline scripts...",
      "unsafeInlineRec": "Use nonces or hashes instead...",
      ...
    }
  }
}
```

### Adding a New Language

1. Add a new language object to `src/i18n.json`
2. Translate all keys under `directives`, `ui`, and `eval`
3. Use `lang` attribute: `<csp-manager lang="fr"></csp-manager>`

---

## 🔌 CMS Integration

### Contentful

See the complete [Contentful Integration Guide](./docs/contentful.md) for:
- Custom field extension setup
- Content model configuration
- Backend integration examples
- Webhook automation

### Storyblok

See the complete [Storyblok Integration Guide](./docs/storyblok.md) for:
- Vue.js plugin setup
- Component schema configuration
- Nuxt.js integration
- Multi-environment support

### Generic Integration Pattern

```javascript
// 1. Initialize with existing data
const cspManager = document.querySelector('csp-manager');
cspManager.policy = JSON.parse(cms.getField('csp_policy'));

// 2. Listen to changes
cspManager.addEventListener('csp-change', (e) => {
  cms.updateField('csp_policy', JSON.stringify(e.detail.policy));
  cms.updateField('csp_header', e.detail.cspString);
});

// 3. Handle validation
cspManager.addEventListener('csp-change', (e) => {
  if (e.detail.evaluations) {
    const hasErrors = Object.values(e.detail.evaluations)
      .some(eval => eval.severity === 'high');

    if (hasErrors) {
      cms.setFieldError('csp_policy', 'Security issues detected');
    } else {
      cms.clearFieldError('csp_policy');
    }
  }
});
```

---

## 📁 Project Structure

```
csp-manager/
├── src/
│   ├── index.js              # Main component
│   ├── evaluate.js           # Security evaluator
│   ├── config-utils.js       # Configuration utilities
│   ├── index.css             # Component styles
│   ├── csp-directives.json   # CSP specification
│   └── i18n.json             # Translations
├── examples/
│   ├── custom-directives.json # Example custom directives
│   ├── custom-i18n.json       # Example translations
│   └── custom-rules.json      # Example evaluation rules
├── docs/
│   ├── contentful.md         # Contentful guide
│   └── storyblok.md          # Storyblok guide
├── demo.html                 # Interactive demos
├── config.html               # Custom configuration demo
├── index.html                # Basic example
├── package.json
└── README.md
```

---

## 🧪 Development

### Running Locally

```bash
# Clone the repo
git clone https://github.com/madsstoumann/browser-style.git
cd browser-style/ui/csp-manager

# Start a local server
python -m http.server 8888
# OR
npx serve

# Open in browser
open http://localhost:8888
```

### Building for Production

The component uses ES modules and CSS/JSON imports - no build step required!

For bundled deployment:
1. Bundle with your preferred tool (Vite, Webpack, etc.)
2. Include all files from `src/`
3. Ensure JSON and CSS imports are supported

---

## 🤝 Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

---

## 📄 License

ISC License - see [LICENSE](../../LICENSE) file for details.

---

## 🔗 Links

- **Homepage**: https://browser.style/ui/csp-manager
- **Demo**: https://browser.style/ui/csp-manager/demo.html
- **npm**: https://www.npmjs.com/package/@browser.style/csp-manager
- **GitHub**: https://github.com/madsstoumann/browser-style
- **Issues**: https://github.com/madsstoumann/browser-style/issues

---

## 🙏 Acknowledgments

- Security evaluation logic inspired by [Google's CSP Evaluator](https://csp-evaluator.withgoogle.com/)
- CSP specification based on [MDN Web Docs](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP)
