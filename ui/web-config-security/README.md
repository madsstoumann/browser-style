# Web Config Security Web Component

A visual web component for managing `security.txt` files (RFC 9116). Built with the same look and feel as the Web Config CSP and Web Config Robots components.

## Features

- 🛡️ **RFC 9116 Compliant**: Supports all standard fields (`Contact`, `Expires`, `Encryption`, etc.)
- 📋 **Visual Management**: Organize fields into Required and Optional sections
- 📅 **Date Picker**: Easy management of the `Expires` field
- 🌐 **Localization**: Built-in support for English (`en`) and Danish (`da`)
- ⚡ **Live Preview**: See the generated `security.txt` content in real-time
- 🔔 **Event-Driven**: Listen for changes with `sec-change` events
- 💾 **Import/Export**: Parse and generate security.txt files

## Installation

```bash
npm install @browser.style/web-config-security
```

```html
<script type="module" src="https://unpkg.com/@browser.style/web-config-security/src/index.js"></script>
```

## Basic Usage

```html
<web-config-security></web-config-security>
```

## Attributes

### `src`
URL to load a complete `security.txt` file.

```html
<web-config-security src="https://example.com/.well-known/security.txt"></web-config-security>
```

### `initial-config`
JSON string to set initial configuration.

```html
<web-config-security
  initial-config='{"contact":["mailto:security@example.com"],"expires":"2025-12-31T23:59:00.000Z"}'>
</web-config-security>
```

### `lang`
Set the language for the UI. Supported languages: `en` (English), `da` (Danish). Defaults to `en`.

```html
<web-config-security lang="da"></web-config-security>
```

## JavaScript API

### Properties

#### `config` (getter/setter)
Get or set the current configuration object.

```javascript
const manager = document.querySelector('web-config-security');
manager.config = {
  contact: ['mailto:security@example.com'],
  expires: '2026-01-01T00:00:00.000Z'
};
```

#### `securityTxt` (getter)
Get the generated `security.txt` string.

```javascript
console.log(manager.securityTxt);
```

### Methods

#### `fromString(securityTxtString)`
Parse a `security.txt` string and update the configuration.

```javascript
await manager.fromString(`
Contact: mailto:security@example.com
Expires: 2025-12-31T23:59:00.000Z
`);
```

## Events

### `sec-change`
Dispatched whenever the configuration changes.

```javascript
manager.addEventListener('sec-change', (event) => {
  console.log('Config:', event.detail.config);
  console.log('Security.txt:', event.detail.securityTxt);
});
```

## Styling

The component uses CSS custom properties for theming, consistent with other managers in this suite.

```css
sec-manager {
  --sec-manager-accent: hsl(211, 100%, 95%);
  --sec-manager-accent-dark: hsl(211, 50%, 50%);
  /* ... see src/index.css for full list */
}
```
