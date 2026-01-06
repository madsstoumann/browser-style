# Umbraco Integration

This folder contains HTML wrapper pages that adapt browser.style web components for use as Umbraco property editors.

## Architecture

Similar to the Contentful integration, these wrappers:
1. Load the web component from browser.style
2. Communicate with Umbraco via `postMessage`
3. Handle value sync and iframe resizing

## Available Widgets

| Widget | URL | Description |
|--------|-----|-------------|
| web-config-card | `/ui/cms/umbraco/web-config-card/` | Content Card editor |
| web-config-csp | `/ui/cms/umbraco/web-config-csp/` | CSP policy editor |
| web-config-manifest | `/ui/cms/umbraco/web-config-manifest/` | PWA manifest editor |
| web-config-robots | `/ui/cms/umbraco/web-config-robots/` | robots.txt editor |
| web-config-security | `/ui/cms/umbraco/web-config-security/` | security.txt editor |

## Communication Protocol

### Parent (Umbraco) → Child (iframe)

```javascript
// Initialize with value
{ type: 'init', value: {...}, origin: 'https://your-umbraco-site.com' }

// Update value
{ type: 'setValue', value: {...} }

// Request current state
{ type: 'getState' }
```

### Child (iframe) → Parent (Umbraco)

```javascript
// Iframe loaded, waiting for init
{ type: 'loaded' }

// Component ready
{ type: 'ready' }

// Value changed
{ type: 'valueChanged', value: {...}, validation: null | 'error message' }

// Resize request
{ type: 'resize', height: number }

// State response
{ type: 'state', value: {...} }
```

## Umbraco Setup

### 1. Install the Property Editor Package

Copy the `App_Plugins/BrowserStyle` folder to your Umbraco project's `wwwroot/App_Plugins/` directory.

### 2. Create Data Types

1. Go to **Settings** → **Data Types**
2. Create a new Data Type for each widget you want to use:
   - Name: "Content Card Editor" (or similar)
   - Property Editor: Select "Web Config Card" (or the appropriate editor)
   - Widget URL: Should auto-fill with the default URL

### 3. Add to Content Type

1. Go to **Settings** → **Document Types**
2. Add a property using your new Data Type
3. The widget will render in the content editor

## Production URLs

| Widget | Production URL |
|--------|----------------|
| Content Card | `https://browser.style/ui/cms/umbraco/web-config-card/` |
| CSP | `https://browser.style/ui/cms/umbraco/web-config-csp/` |
| Manifest | `https://browser.style/ui/cms/umbraco/web-config-manifest/` |
| Robots | `https://browser.style/ui/cms/umbraco/web-config-robots/` |
| Security | `https://browser.style/ui/cms/umbraco/web-config-security/` |

## Security Notes

The iframe sandbox attribute includes:
- `allow-scripts` - Required for component functionality
- `allow-same-origin` - Required for postMessage communication
- `allow-forms` - Required for form inputs within components

The widgets validate the origin of incoming messages for security.

## Local Development

To test locally without Umbraco:
1. Open the widget HTML file directly in a browser
2. The component will run in "standalone mode"
3. Changes won't persist but you can test the UI

## Troubleshooting

### Widget not loading?
- Check browser console for errors
- Verify the widget URL is accessible
- Check CSP headers allow iframe embedding

### Value not saving?
- Check postMessage communication in console
- Verify Umbraco property editor is receiving `valueChanged` events

### Iframe too small/large?
- The widget sends `resize` events to auto-adjust height
- Check if ResizeObserver is working in the widget
