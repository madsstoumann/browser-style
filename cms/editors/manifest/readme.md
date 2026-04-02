# Editor Manifest Web Component

A visual web component for managing `manifest.json` files. Built with the same look and feel as the Editor CSP component.

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
npm install @browser.style/editor-manifest
```

```html
<script type="module" src="https://unpkg.com/@browser.style/editor-manifest/src/index.js"></script>
```

## Basic Usage

```html
<editor-manifest></editor-manifest>
```

## Attributes

### `src`
URL to load a complete `manifest.json` file.

```html
<editor-manifest src="/manifest.json"></editor-manifest>
```

### `value`
JSON string to set initial configuration.

```html
<editor-manifest
  value='{"name":"My App","display":"standalone"}'>
</editor-manifest>
```

### `lang`
Set the language for the UI. Supported languages: `en` (English), `da` (Danish). Defaults to `en`.

```html
<editor-manifest lang="da"></editor-manifest>
```

## JavaScript API

### Properties

#### `value` (getter/setter)
Get or set the current configuration as a JSON string.

```javascript
const manager = document.querySelector('editor-manifest');
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
