# Web Config Image

A web component and Cloudflare Worker for AI-powered image analysis with multiple presets. Supports alt text generation and food recognition, with an extensible preset registry pattern.

## Component Overview

| Property | Value |
|----------|-------|
| Custom Element | `<web-config-image>` |
| Shadow DOM | Yes (open mode, adoptedStyleSheets) |
| Form Associated | Yes |
| Dependencies | `@browser.style/web-config-shared` |
| Backend | Cloudflare Worker + D1 database |
| AI Model | Claude Haiku 4.5 |

## Installation

```bash
npm install @browser.style/web-config-image
```

## Usage

```html
<web-config-image id="editor" preset="alttext"></web-config-image>

<script type="module">
  import '@browser.style/web-config-image';

  const editor = document.getElementById('editor');
  editor.src = 'https://example.com/photo.jpg';

  editor.addEventListener('requestGenerate', async () => {
    const response = await fetch('https://image.stoumann.workers.dev/analyze', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': 'your-api-key'
      },
      body: JSON.stringify({ url: editor.src, preset: editor.preset })
    });
    const data = await response.json();
    editor.result = data.result;
    editor.generating = false;
  });
</script>
```

## Presets

| Preset | Attribute Value | Description | Response Shape |
|--------|----------------|-------------|----------------|
| Alt Text | `alttext` | Generates accessible alt text and long description | `{ alt, longdesc }` |
| Food Recognition | `food` | Identifies food items with quantities | `{ ingredients: [{item, quantity}] }` |

## Component Attributes

| Attribute | Type | Description |
|-----------|------|-------------|
| `preset` | string | Which analysis preset to use (`alttext` or `food`) |

## Component Properties

| Property | Type | Description |
|----------|------|-------------|
| `preset` | string | Read from attribute |
| `src` | string | Image URL to analyze |
| `value` | string | JSON string of current result (for CMS storage) |
| `result` | object | Set with worker response `data.result` to populate UI |
| `generating` | boolean | Controls spinner and button disabled state |

## Component Methods

### `showError(message)`
Display an error message in the component.

## Component Events

### `requestGenerate`
Fired when the user clicks the Generate button. The host page handles the API call.

### `change`
Fired when the user edits a field (alttext preset only). `e.detail` contains the parsed result object.

## Worker API

### `POST /analyze`

Accepts an image and a preset name, returns preset-specific analysis.

**Input (JSON):**
```json
{ "url": "https://example.com/photo.jpg", "preset": "alttext" }
```

**Input (FormData):**
Multipart form with `image` file field and `preset` text field.

**Required Header:** `X-API-Key`

**Response:**
```json
{
  "preset": "alttext",
  "result": { "alt": "...", "longdesc": "..." },
  "usage": { "requests_today": 5, "daily_limit": 50 }
}
```

**Food preset response:**
```json
{
  "preset": "food",
  "result": { "ingredients": [{ "item": "red bell pepper", "quantity": "2" }] },
  "usage": { "requests_today": 5, "daily_limit": 50 }
}
```

### `GET /health`

Returns database connectivity status (200 or 503).

## Worker Architecture

```
worker/
├── .dev.vars           # Local secrets (gitignored)
├── package.json
├── wrangler.toml       # Cloudflare Worker config, D1 binding
├── tsconfig.json
├── schema.sql          # D1 database schema
└── src/
    ├── index.ts        # Router with CORS
    ├── types.ts        # Shared TypeScript interfaces
    ├── presets.ts       # Preset registry (prompts + parsers)
    ├── middleware/
    │   └── auth.ts     # X-API-Key auth, SHA-256 hashing, daily rate limiting
    ├── handlers/
    │   ├── analyze.ts  # Main pipeline: auth → image → preset → vision → log
    │   └── health.ts   # DB connectivity check
    ├── services/
    │   ├── image.ts    # Image validation, base64 encoding, URL fetching
    │   └── vision.ts   # Claude API integration (generic, preset-driven)
    └── db/
        └── usage.ts    # Usage logging and daily count queries
```

### Preset Registry (`presets.ts`)

The core extensibility point. Each preset defines:
- `systemPrompt` — the Claude system prompt
- `maxTokens` — max response tokens
- `parseResponse(raw)` — transforms Claude's text into structured data

Adding a new preset: add an entry to the `presets` record in `presets.ts`, then add a renderer in the web component's `renderers` object.

### Authentication

- API keys stored as SHA-256 hashes in D1 (never plaintext)
- Daily rate limiting per key (default: 50 requests/day)
- Keys validated via `X-API-Key` header

### Image Processing

- Supported formats: JPEG, PNG, WebP, GIF
- Max size: 5 MB
- URL fetches have 10-second timeout

## Adding a New Preset

1. **Worker:** Add entry to `presets` in `worker/src/presets.ts`
2. **Component:** Add renderer to `renderers` in `src/index.js`
3. **Usage:** `<web-config-image preset="newpreset">`

## File Structure

```
web-config-image/
├── index.html      # Demo page with preset dropdown
├── package.json    # Web component package
├── src/
│   └── index.js    # <web-config-image> web component
├── worker/         # Cloudflare Worker backend
│   └── ...
├── AGENTS.md       # This file
└── CLAUDE.md       # References AGENTS.md
```
