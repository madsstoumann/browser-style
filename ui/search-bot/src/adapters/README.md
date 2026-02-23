# Search Bot Adapters

Adapters bridge `<search-bot>` to different search backends. Each adapter exports two functions:

```js
export function buildRequest(api, query, context, options) → { url }
export function parseEvent(eventData) → { type, ... } | null
```

The component loads an adapter based on the `provider` attribute:

```html
<search-bot provider="nlweb" api="https://example.workers.dev">
```

If omitted, `provider` defaults to `"nlweb"`.

## Adapter Interface

### `buildRequest(api, query, context, options)`

Builds the SSE endpoint URL.

| Parameter | Type | Description |
|-----------|------|-------------|
| `api` | `string` | Base URL from the `api` attribute |
| `query` | `string` | User's search query |
| `context` | `{ prev: string[], last: object[] }` | Conversation history |
| `options` | `{ maxResults?, rewrite? }` | Optional tuning from element attributes |

Returns `{ url }` — the full URL the component opens as an `EventSource`.

### `parseEvent(eventData)`

Parses a single SSE `data:` payload into a normalized message.

Must return one of:

| Return value | Effect |
|-------------|--------|
| `{ type: 'chunk', text }` | Appends text to the streaming summary |
| `{ type: 'results', items }` | Renders search result cards |
| `{ type: 'done' }` | Closes the connection, finalizes the response |
| `{ type: 'error', message }` | Handles the error |
| `null` | Ignores the event |

Each result item in `items` should have: `{ name, url, description?, image? }`.

---

## Available Adapters

### `nlweb` (default)

For backends that implement Microsoft's [NLWeb](https://github.com/nicholasgasior/nlweb) SSE protocol.

**Endpoint:** `{api}/ask?query=...&display_mode=full&generate_mode=summarize`

**SSE format:**
```
data: {"message_type":"summary","message":"token"}
data: {"message_type":"result_batch","results":[...]}
data: {"message_type":"complete"}
```

**Context support:** Sends `prev` (previous queries) and `last_ans` (previous results) as query parameters for conversation continuity.

**Compatible backends:**
- Any NLWeb-compliant server (e.g. `wild-flower-99ce-nlweb.stoumann.workers.dev`)
- Custom workers that emit the NLWeb message types (e.g. `wpp-search` at `/ask`)

**Usage:**
```html
<search-bot api="https://wild-flower-99ce-nlweb.stoumann.workers.dev">
<search-bot provider="nlweb" api="https://wpp-search.stoumann.workers.dev">
```

### `aisearch`

For backends using Cloudflare AI Search (`aiSearch`) with streaming.

**Endpoint:** `{api}/stream?query=...`

**SSE format:**
```
data: {"type":"chunk","text":"token"}
data: {"type":"results","items":[...]}
data: {"type":"done"}
```

**Context support:** Sends `prev` (previous queries). Does not send `last_ans`.

**Compatible backends:**
- The `wpp-search` worker at `/stream`, which calls `aiSearch({ stream: true })` for the summary and `rag.search()` in parallel for result items.

**Usage:**
```html
<search-bot provider="aisearch" api="https://wpp-search.stoumann.workers.dev">
```

---

## Optional Attributes

These HTML attributes on `<search-bot>` are passed to adapters via the `options` parameter:

| Attribute | Type | Description |
|-----------|------|-------------|
| `max-results` | `number` | Maximum number of search results to return |
| `rewrite` | `"true"\|"false"` | Whether the backend should rewrite the query for better search |

Both adapters forward these as `max_results` and `rewrite` query parameters. Backend support varies — the `wpp-search` worker respects both; the full NLWeb framework (`wild-flower`) ignores them.

---

## Writing a New Adapter

Create a file in this directory (e.g. `my-adapter.js`) that exports `buildRequest` and `parseEvent`:

```js
export function buildRequest(api, query, context, options = {}) {
  const params = new URLSearchParams({ q: query });
  return { url: `${api}/search?${params}` };
}

export function parseEvent(eventData) {
  try {
    const data = JSON.parse(eventData);
    // Map your backend's format to the normalized types
    if (data.text) return { type: 'chunk', text: data.text };
    if (data.hits) return { type: 'results', items: data.hits };
    if (data.end) return { type: 'done' };
    return null;
  } catch {
    return null;
  }
}
```

Then use it:
```html
<search-bot provider="my-adapter" api="https://my-backend.example.com">
```

The component dynamically imports `./adapters/${provider}.js`, so no registration step is needed.
