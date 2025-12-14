# Web Config Manifest Web Component

A visual web component for managing `manifest.json` files. Built with the same look and feel as the Web Config CSP component.

## Features

- 📋 **Visual Management**: Organize manifest properties into Identity, Presentation, and Navigation sections
- 🎨 **Color Pickers**: Easy selection of `theme_color` and `background_color`
- 📱 **Display Modes**: Dropdown selection for `display` and `orientation` modes
- 🌐 **Localization**: Built-in support for English (`en`) and Danish (`da`)
- ⚡ **Live Preview**: See the generated `manifest.json` content in real-time
- 🔔 **Event-Driven**: Listen for changes with `manifest-change` events
- 💾 **Import/Export**: Parse and generate manifest.json files

## Installation

```bash
npm install @browser.style/web-config-manifest
```

```html
<script type="module" src="https://unpkg.com/@browser.style/web-config-manifest/src/index.js"></script>
```

## Basic Usage

```html
<web-config-manifest></web-config-manifest>
```

## Attributes

### `src`
URL to load a complete `manifest.json` file.

```html
<web-config-manifest src="/manifest.json"></web-config-manifest>
```

### `value`
JSON string to set initial configuration.

```html
<web-config-manifest
  value='{"name":"My App","display":"standalone"}'>
</web-config-manifest>
```

### `lang`
Set the language for the UI. Supported languages: `en` (English), `da` (Danish). Defaults to `en`.

```html
<web-config-manifest lang="da"></web-config-manifest>
```

## JavaScript API

### Properties

#### `value` (getter/setter)
Get or set the current configuration as a JSON string.

```javascript
const manager = document.querySelector('web-config-manifest');
console.log(manager.value); // '{"name": "..."}'
```

### Events

### `manifest-change`
Dispatched whenever the configuration changes.

```javascript
manager.addEventListener('manifest-change', (event) => {
  console.log('State:', event.detail); // Object
});
```

## Styling

The component uses CSS custom properties for theming, consistent with other managers in this suite.
