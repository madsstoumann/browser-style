# Asset Handler Component

A customizable web component for uploading and managing assets with progressive upload status.

## Features

- Drag and drop file upload
- Progress tracking for uploads
- File type and size validation
- Configurable upload endpoint
- Events for monitoring upload success and errors
- Support for marking assets as "default"

## Installation

```bash
npm install @browser.style/asset-handler
```

## Usage

```html
<script type="module">
  import '@browser.style/asset-handler';
</script>

<asset-uploader
  api="http://localhost:3000"
  upload-url="/api/asset"
  product-id="123456"
  allowed-types="image/jpeg,image/png,application/pdf"
  max-size="5"
  auto-default="true"
></asset-uploader>
```

## Attributes

| Attribute      | Description                                      | Default                                |
|----------------|--------------------------------------------------|----------------------------------------|
| api            | Base URL for the API server                      | "" (empty, uses relative paths)        |
| upload-url     | The endpoint for uploading files                 | /api/asset                             |
| product-id     | The product ID for organizing files              | (required)                             |
| allowed-types  | Comma-separated list of allowed MIME types       | image/jpeg,image/png,image/gif,application/pdf |
| max-size       | Maximum file size in MB                          | 10                                     |
| auto-default   | Whether to set the first uploaded file as default| true                                   |

## Events

| Event          | Description                                      | Detail                                 |
|----------------|--------------------------------------------------|----------------------------------------|
| upload-success | Fired when a file is successfully uploaded       | { file, response }                     |
| upload-error   | Fired when an error occurs during upload         | { file, error }                        |
| default-set    | Fired when an asset is set as default            | { filename, response }                 |

## Server API Integration

This component works with the companion Express server which supports:

- GET /api/asset/:id - Retrieve assets with optional dimensions and DPI
- POST /api/asset/:id - Upload files with a specific product ID
- GET /api/asset-list/:id - List all assets for a specific product

## Example with Cross-Origin API

```html
<!-- Using a remote API server -->
<asset-uploader
  api="https://api.example.com"
  upload-url="/assets"
  product-id="123456"
  allowed-types="image/jpeg,image/png"
  max-size="5"
></asset-uploader>
```
````
