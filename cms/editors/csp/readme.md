# Editor CSP Web Component

A powerful, interactive web component for building and managing Content Security Policy (CSP) directives with built-in security evaluation.

## Features

- 🛡️ **Interactive Editor**: Easily add, remove, and manage CSP directives through an intuitive UI
- 🔍 **Security Evaluation**: Real-time security checks based on Google's CSP Evaluator logic
- 👁️ **Live Preview**: See the generated `<meta>` tag update as you make changes
- 🌐 **Localization**: Built-in support for English (`en`) and Danish (`da`)
- 🔌 **CMS Integration**: Designed for easy integration with headless CMSs
- 🔔 **Event-Driven**: Fires a `csp-change` event on every modification
- 💾 **Import/Export**: Supports importing from existing CSP strings and exporting to JSON or header string

## Installation

```bash
npm install @browser.style/editor-csp
```

```html
<script type="module" src="https://unpkg.com/@browser.style/editor-csp/src/index.js"></script>
```

## Basic Usage

```html
<editor-csp evaluate></editor-csp>
```

## Attributes

### `evaluate`
Enables the security evaluation feature.

```html
<editor-csp evaluate></editor-csp>
```

### `initial-policy`
JSON string to set initial configuration.

```html
<editor-csp
  initial-policy='{"default-src":{"added":["self"]}}'>
</editor-csp>
```

### `lang`
Set the language for the UI. Supported languages: `en` (English), `da` (Danish). Defaults to `en`.

```html
<editor-csp lang="da"></editor-csp>
```

## JavaScript API

### Properties

#### `policy` (getter/setter)
Get or set the current configuration as a JavaScript object.

```javascript
const manager = document.querySelector('editor-csp');
console.log(manager.policy); // { "default-src": { "added": ["self"] } }
```

#### `cspString` (getter)
Get the generated CSP meta tag string.

```javascript
console.log(manager.cspString);
```

### Methods

#### `fromString(cspString)`
Parse a CSP string and update the component state.

```javascript
manager.fromString("default-src 'self'; script-src 'unsafe-inline'");
```

### Events

### `csp-change`
Dispatched whenever the configuration changes.

```javascript
manager.addEventListener('csp-change', (event) => {
  console.log('Policy:', event.detail.policy);
  console.log('String:', event.detail.cspString);
  if (event.detail.evaluations) {
    console.log('Security Issues:', event.detail.evaluations);
  }
});
```

## Styling

The component uses CSS custom properties for theming, consistent with other managers in this suite.
