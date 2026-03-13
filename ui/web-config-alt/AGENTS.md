# Web Config Alt

A web component and Cloudflare Worker for generating AI-powered alt text and long descriptions for images using Claude's vision capabilities.

## Component Overview

| Property | Value |
|----------|-------|
| Custom Element | `<web-config-alt>` |
| Shadow DOM | Yes (open mode, adoptedStyleSheets) |
| Form Associated | Yes |
| Dependencies | `@browser.style/web-config-shared` |
| Backend | Cloudflare Worker + D1 database |
| AI Model | Claude Haiku 4.5 |

## Installation

```bash
npm install @browser.style/web-config-alt
```

## Usage

```html
<web-config-alt id="editor"></web-config-alt>

<script type="module">
  import './src/index.js';

  const editor = document.getElementById('editor');
  editor.src = 'https://example.com/photo.jpg';

  editor.addEventListener('requestGenerate', async () => {
    const response = await fetch('https://your-worker.workers.dev/analyze', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': 'your-api-key'
      },
      body: JSON.stringify({ url: editor.src })
    });
    const data = await response.json();
    editor.value = data.alt;
    editor.longdesc = data.longdesc;
    editor.generating = false;
  });
</script>
```

## Component Attributes

| Attribute | Type | Description |
|-----------|------|-------------|
| `value` | string | Alt text value (max 125 chars) |
| `longdesc` | string | Long description value (max 512 chars) |

## Component Properties

| Property | Type | Description |
|----------|------|-------------|
| `src` | string | Image URL to generate descriptions for |
| `value` | string | Get/set alt text |
| `longdesc` | string | Get/set long description |
| `generating` | boolean | Controls spinner and button disabled state |

## Component Methods

### `showError(message)`
Display an error message in the component.

```javascript
editor.showError('Worker URL and Image URL are required.');
```

## Component Events

### `requestGenerate`
Fired when the user clicks the Generate button. The host page handles the API call.

```javascript
editor.addEventListener('requestGenerate', async () => {
  // Call worker API, then set editor.value and editor.longdesc
  editor.generating = false;
});
```

### `change`
Fired when either textarea is edited by the user.

```javascript
editor.addEventListener('change', (e) => {
  console.log(e.detail); // { alt: '...', longdesc: '...' }
});
```

## Worker API

### `POST /analyze`

Accepts an image and returns both alt text and long description.

**Input (JSON):**
```json
{ "url": "https://example.com/photo.jpg" }
```

**Input (FormData):**
Multipart form with `image` file field.

**Required Header:** `X-API-Key`

**Response:**
```json
{
  "alt": "Short description, max 125 chars",
  "longdesc": "Longer description covering subject, setting, mood, colors, and composition, max 512 chars",
  "usage": {
    "requests_today": 5,
    "daily_limit": 50
  }
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
├── scripts/
│   └── seed-api-key.sh # Generate test API keys
└── src/
    ├── index.ts        # Router with CORS
    ├── types.ts        # Shared TypeScript interfaces
    ├── middleware/
    │   └── auth.ts     # X-API-Key auth, SHA-256 hashing, daily rate limiting
    ├── handlers/
    │   ├── analyze.ts  # Main pipeline: auth → image → vision → log
    │   └── health.ts   # DB connectivity check
    ├── services/
    │   ├── image.ts    # Image validation, base64 encoding, URL fetching
    │   └── vision.ts   # Claude API integration, prompt engineering
    └── db/
        └── usage.ts    # Usage logging and daily count queries
```

### Vision Service

The worker makes a single Claude API call per request with a system prompt that asks for a JSON response containing both fields:

- `alt`: Max 125 characters. One concise sentence naming the primary subject.
- `longdesc`: Max 512 characters. 2-3 sentences covering subject, setting, mood, colors, and composition.

Both fields are truncated at word boundaries if they exceed limits.

### Authentication

- API keys stored as SHA-256 hashes in D1 (never plaintext)
- Daily rate limiting per key (default: 50 requests/day)
- Keys validated via `X-API-Key` header

### Image Processing

- Supported formats: JPEG, PNG, WebP, GIF
- Max size: 5 MB
- URL fetches have 10-second timeout

## Worker Deployment

```bash
cd worker
npm install
npx wrangler deploy
```

Secrets (ANTHROPIC_API_KEY) are managed via Cloudflare dashboard or `wrangler secret put`.

## Security

- `.dev.vars` contains local development secrets and is gitignored
- No secrets are hardcoded in source code
- `ANTHROPIC_API_KEY` is read from Cloudflare environment variables
- Client API keys are hashed with SHA-256 before storage
- CORS allows all origins (public API)

## Database Schema

```sql
api_keys:
  id, key_hash, name, daily_limit, monthly_limit, is_active, created_at

usage_log:
  id, user_id, source, input_tokens, output_tokens, estimated_cost_usd, char_count, created_at
```

## File Structure

```
web-config-alt/
├── index.html      # Demo page
├── package.json    # Web component package
├── src/
│   └── index.js    # <web-config-alt> web component
├── worker/         # Cloudflare Worker backend
│   └── ...
├── AGENTS.md       # This file
└── CLAUDE.md       # References AGENTS.md
```
