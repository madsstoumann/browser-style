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
│   ├── index.css             # Component styles
│   ├── csp-directives.json   # CSP specification
│   └── i18n.json             # Translations
├── docs/
│   ├── contentful.md         # Contentful guide
│   └── storyblok.md          # Storyblok guide
├── demo.html                 # Interactive demos
├── index.html                # Basic example
├── package.json
└── readme.md
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
