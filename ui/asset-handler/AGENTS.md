# Asset Handler Component

## Overview

Asset Handler is a **web component** (`<asset-handler>`) for uploading, tagging, and managing assets (images, videos, documents) via an external asset server API. It provides a drag-and-drop interface with file previews and tag management.

## Architecture

### HTML Structure

```html
<asset-handler
  api="https://your-api.com"
  asset-id="123456"
  label="Upload files"
  save="Save"
  delete="Delete">
</asset-handler>
```

### Key Elements

- **`<asset-handler>`**: Custom element with Shadow DOM encapsulation
- **Dropzone**: Drag-and-drop file upload area
- **Asset List**: Grid of uploaded assets with thumbnails/previews
- **Tag Chips**: Checkbox-based tag selection per asset
- **Action Buttons**: Save and Delete buttons per asset

### Files

- **[index.js](index.js)**: Main web component (~312 lines)
- **[index.html](index.html)**: Demo page
- **[data.json](data.json)**: Demo data for demo mode
- **[package.json](package.json)**: NPM package configuration

## Component API

### Attributes

| Attribute | Description | Required |
|-----------|-------------|----------|
| `api` | Base URL of asset server API, or path to JSON file for demo mode | Yes |
| `asset-id` | Unique identifier for the asset group | Yes |
| `label` | Text shown on upload button | No (default: "Upload") |
| `save` | Text for save button | No (default: "Save") |
| `delete` | Text for delete button | No (default: "Delete") |

### Observed Attributes

- `asset-id`: Triggers re-initialization when changed

## Modes of Operation

### Live Mode

When `api` points to a server URL (not ending in `.json`):

```javascript
this.#url = {
  config: `${api}/api/config/client`,      // GET: Fetch allowed file types, max size, tags
  list: `${api}/api/asset-list/${assetId}`, // GET: Fetch current assets
  tags: `${api}/api/asset/${assetId}/tags`, // PUT: Update asset tags
  upload: `${api}/api/asset/${assetId}`,    // POST: Upload, DELETE: Remove
}
```

### Demo Mode

When `api` ends with `.json`, the component enters read-only demo mode:
- Loads asset list from JSON file
- Upload, delete, and tag changes are disabled
- Useful for prototyping UI without backend

## Expected API Contract

### Config Endpoint (`GET /api/config/client`)

```json
{
  "accept": "image/*,video/*,application/pdf",
  "maxFileSize": 2,
  "tags": ["front", "back", "video", "manual"]
}
```

### Asset List Endpoint (`GET /api/asset-list/{assetId}`)

```json
{
  "assets": [
    {
      "name": "test1.jpeg",
      "path": "assets/12/34/56/123456/test1.jpeg",
      "type": "image",
      "tags": ["front"],
      "size": 202300,
      "mimeType": "image/jpeg"
    }
  ]
}
```

## CSS Custom Properties

```css
:host {
  --accent: light-dark(hsl(211, 100%, 50%), hsl(211, 60%, 50%));
  --accent-text: hsl(211, 100%, 95%);
  --error: light-dark(hsl(360, 60%, 46%), hsl(360, 40%, 56%));
  --success: light-dark(hsl(136, 41%, 41%), hsl(136, 21%, 51%));
  --asset-handler-cg: .5ch;   /* Column gap */
  --asset-handler-rg: 1em;    /* Row gap */
}
```

## Key Implementation Details

### Shadow DOM

Uses `mode: 'open'` Shadow DOM with `adoptedStyleSheets` for encapsulated styling.

### File Upload

- Supports multiple file upload via `<input type="file" multiple>`
- Validates file size against `config.maxFileSize` (in MB)
- Uses `FormData` for multipart upload
- Supports drag-and-drop with visual feedback

### Asset Type Handling

```javascript
if (asset.type === 'image') {
  // Renders <img> with width parameter for thumbnails
} else if (asset.type === 'video') {
  // Renders <video> with controls
} else {
  // Renders download link for PDFs/documents
}
```

### Tag Management

- Tags from config are rendered as checkbox chips
- `PUT` to `/api/asset/{assetId}/tags` with JSON body:
  ```json
  { "filename": "test.jpg", "tags": ["front", "back"] }
  ```

### Visual Feedback

- Success/error states use CSS `pulse` animation
- Buttons get `.success` or `.error` class for 3 seconds
- Dropzone has `.dragover` class during drag operations

## Related Resources

- **Asset Server**: [github.com/madsstoumann/asset-server](https://github.com/madsstoumann/asset-server)

## Debugging Tips

1. **Component not loading?** Check `api` and `asset-id` attributes are set
2. **Demo mode active?** API URL ending in `.json` triggers demo mode
3. **Upload failing?** Check file size against `config.maxFileSize`
4. **Tags not saving?** Verify API endpoint returns `{ success: true }`

## Browser Support

- Modern browsers with Web Components support
- Shadow DOM
- Constructable Stylesheets
- `light-dark()` CSS function

## Events

The component dispatches no custom events in the main implementation. File operations are handled internally.

## CSS Parts

| Part | Description |
|------|-------------|
| `dropzone` | The file upload dropzone area |
| `tags` | Container for tag checkboxes |
| `actions` | Container for Save/Delete buttons |

## Internal Structure

### Private Fields

```javascript
#api;        // Base API URL
#assetId;    // Current asset group ID
#elements;   // DOM element references
#url;        // Constructed API endpoints
#demoMode;   // Boolean for demo mode detection
```

### Initialization Flow

1. Constructor reads `api` and `asset-id` attributes
2. Determines demo mode (API ends in `.json`)
3. Constructs URL endpoints or sets demo URLs
4. `connectedCallback` fetches config
5. `initialize()` renders the UI
6. Event listeners attached for drag/drop and clicks

## Alternative Implementation

An experimental implementation exists in `_tmp/asset-uploader.js` with additional features:

### Additional Attributes (`AssetUploader`)

| Attribute | Description |
|-----------|-------------|
| `product-id` | Product identifier (instead of `asset-id`) |
| `upload-url` | Custom upload endpoint path |
| `allowed-types` | Comma-separated MIME types |
| `allowed-tags` | Comma-separated tag options |
| `max-size` | Maximum file size in MB |

### Additional Events (`AssetUploader`)

| Event | Detail |
|-------|--------|
| `upload-success` | `{ file, response }` |
| `upload-error` | `{ file, error }` |
| `tags-updated` | `{ filename, tags, response }` |

### Additional Features

- Upload progress tracking with progress bar
- Per-file upload status display
- Inline tag editing per asset
- File size formatting utility

## File Structure

```
asset-handler/
├── index.js           # Main AssetHandler component (312 lines)
├── index.html         # Demo page
├── data.json          # Demo asset data
├── package.json       # NPM package config
├── claude.md          # This documentation
├── _tmp/              # Experimental/alternative implementations
│   ├── asset-uploader.js  # Alternative implementation with more features
│   ├── __index.html
│   ├── __index.js
│   └── README.md
└── assets/            # Demo asset storage
    └── 12/34/56/123456/
        ├── metadata.json
        └── [asset files]
```

## Server Integration

The component is designed to work with [asset-server](https://github.com/madsstoumann/asset-server). The asset server:

- Stores files in a hash-based directory structure (e.g., `12/34/56/123456/`)
- Maintains a `metadata.json` file per asset group
- Supports image resizing via query parameters (e.g., `?w=75`)
