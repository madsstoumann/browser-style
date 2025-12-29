# Web Config Manifest

## Overview

Web Config Manifest is a **visual web component** (`<web-config-manifest>`) for managing `manifest.json` files (Web App Manifest). It provides an organized interface for editing PWA manifest properties with real-time preview.

## Architecture

### Package Structure

```
web-config-manifest/
├── readme.md             # User documentation
├── index.html            # Demo page
├── package.json          # NPM package configuration
├── fixtures/             # Test fixtures
└── src/
    └── index.js          # Main web component
```

### Component Family

Part of the web-config suite with consistent design:
- web-config-csp (Content Security Policy)
- **web-config-manifest** (Web App Manifest)
- web-config-robots (robots.txt)
- web-config-security (security.txt)

## Features

- **Visual Management**: Organized into Identity, Presentation, and Navigation sections
- **Color Pickers**: Easy selection of `theme_color` and `background_color`
- **Display Modes**: Dropdown for `display` and `orientation`
- **Localization**: English (`en`) and Danish (`da`) support
- **Live Preview**: Real-time `manifest.json` output
- **Event-Driven**: `manifest-change` events on updates
- **Import/Export**: Parse and generate manifest files

## Usage

### Basic

```html
<web-config-manifest></web-config-manifest>

<script type="module">
  import '@browser.style/web-config-manifest/src/index.js';
</script>
```

### Load Existing Manifest

```html
<web-config-manifest src="/manifest.json"></web-config-manifest>
```

### Set Initial Value

```html
<web-config-manifest
  value='{"name":"My App","display":"standalone"}'>
</web-config-manifest>
```

## API

### Attributes

| Attribute | Description |
|-----------|-------------|
| `src` | URL to load manifest.json file |
| `value` | JSON string for initial configuration |
| `lang` | UI language (`en` or `da`) |

### Properties

#### `value` (getter/setter)

Get or set configuration as JSON string:

```javascript
const manager = document.querySelector('web-config-manifest');

// Get
console.log(manager.value);
// '{"name": "My App", "display": "standalone"}'

// Set
manager.value = JSON.stringify({ name: 'New App' });
```

### Events

#### `manifest-change`

Fired when configuration changes:

```javascript
manager.addEventListener('manifest-change', (e) => {
  console.log('State:', e.detail);
  // Save to backend, localStorage, etc.
});
```

## Manifest Properties

### Identity Section

| Property | Type | Description |
|----------|------|-------------|
| `name` | string | Full application name |
| `short_name` | string | Short name (home screen) |
| `description` | string | App description |

### Presentation Section

| Property | Type | Options |
|----------|------|---------|
| `display` | string | fullscreen, standalone, minimal-ui, browser |
| `orientation` | string | any, natural, landscape, portrait |
| `theme_color` | color | Browser UI color |
| `background_color` | color | Splash screen color |

### Navigation Section

| Property | Type | Description |
|----------|------|-------------|
| `start_url` | string | Start page URL |
| `scope` | string | Navigation scope |

## Localization

```html
<!-- Danish UI -->
<web-config-manifest lang="da"></web-config-manifest>
```

Change dynamically:

```javascript
manager.setAttribute('lang', 'da');
```

## Styling

Uses CSS custom properties consistent with the web-config suite.

## Integration

### Contentful

See `/ui/cms/contentful/web-config-manifest/` for Contentful CMS integration.

Field type: **JSON object**

### Backend

Save the manifest JSON to serve at `/manifest.json`:

```javascript
manager.addEventListener('manifest-change', async (e) => {
  await fetch('/api/manifest', {
    method: 'POST',
    body: JSON.stringify(e.detail),
    headers: { 'Content-Type': 'application/json' }
  });
});
```

## Dependencies

- **web-config-shared**: Shared styles and utilities

## Debugging Tips

1. **Colors not saving?** Check color picker value format
2. **Preview not updating?** Verify event listener is attached
3. **Load failing?** Check `src` URL is accessible
4. **Localization wrong?** Verify `lang` attribute value
