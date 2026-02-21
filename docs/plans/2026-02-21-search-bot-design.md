# search-bot — Architecture Design

## Overview

Rename `search-widget` to `search-bot`. A CSS-first web component that works as both a full-screen search overlay and a compact chatbot panel, controlled by a `mode` attribute. Communication runs in a dedicated Web Worker with an adapter layer for provider-agnostic API integration.

## File Structure

```
ui/search-bot/
├── package.json            @browser.style/search-bot
├── index.html              Demo page
├── src/
│   ├── index.js            Component (UI, state, Worker management)
│   ├── index.css           Styles (both modes, all layout variants)
│   ├── worker.js           Web Worker (SSE connection, adapter dispatch)
│   └── adapters/
│       └── nlweb.js        NLWeb/Cloudflare adapter
```

## Attributes

| Attribute | Values | Description |
|-----------|--------|-------------|
| `api` | URL string | Endpoint URL, passed to the Worker |
| `provider` | `"nlweb"` (default) | Selects which adapter the Worker loads |
| `mode` | `"search"` (default), `"chatbot"` | Pure CSS — controls overlay vs docked panel |
| `position` | `"bottom right"`, etc. | CSS-driven trigger button placement |
| `preserve-history` | boolean attribute | Opt-in to save chats to localStorage |
| `preserve-state` | boolean attribute | Opt-in to restore UI state across navigation (requires `preserve-history`) |

### Usage Examples

Minimal (no persistence):
```html
<search-bot api="https://..." provider="nlweb"></search-bot>
```

Full persistence:
```html
<search-bot api="https://..." provider="nlweb" preserve-history preserve-state></search-bot>
```

Chatbot mode:
```html
<search-bot api="https://..." provider="nlweb" mode="chatbot" position="bottom right" preserve-history></search-bot>
```

## CSS Mode Architecture

Both modes share the same DOM structure. No JS branching for mode.

**`mode="search"` (default):** Full-screen modal overlay with backdrop.

**`mode="chatbot"`:** Compact docked panel. The `<dialog>` is still opened with `showModal()`, but CSS hides the backdrop and repositions/resizes the dialog:

```css
:host([mode="chatbot"]) [part="search-overlay"]::backdrop {
  background: transparent;
  pointer-events: none;
}
:host([mode="chatbot"]) [part="search-overlay"] {
  /* compact sizing and fixed positioning */
}
```

History button hidden when `preserve-history` is absent:

```css
:host(:not([preserve-history])) [part="search-history"] {
  display: none;
}
```

## Web Worker & Adapter Layer

### Worker Lifecycle

- **`connectedCallback`** — spawns Worker, sends `{ type: 'connect', api, provider }`
- **`disconnectedCallback`** — sends `{ type: 'abort' }`, then `worker.terminate()`
- **Per query** — sends `{ type: 'query', query, context }`
- **Cancel / new chat** — sends `{ type: 'abort' }`

### Message Protocol

Component → Worker:
```
{ type: 'connect', api, provider }
{ type: 'query', query, context }
{ type: 'abort' }
```

Worker → Component:
```
{ type: 'chunk', text }
{ type: 'results', items: [{ url, name, description, image }] }
{ type: 'done' }
{ type: 'error', message }
```

### Adapter Interface

Each provider adapter exports two functions:

```js
export function buildRequest(api, query, context) → { url, params }
export function parseEvent(eventData) → { type, ... } | null
```

- **`buildRequest`** — constructs the SSE URL + query parameters from the normalized query and context.
- **`parseEvent`** — parses a raw SSE event and returns a normalized message (`chunk`, `results`, `done`, `error`) or `null` to skip.

The `nlweb.js` adapter maps:
- `summary` → `{ type: 'chunk', text }`
- `result_batch` → `{ type: 'results', items }` (with `normalizeResult` logic)
- `complete` → `{ type: 'done' }`

### Worker Internals

```js
// worker.js (pseudocode)
let adapter, eventSource;

self.onmessage = async ({ data }) => {
  switch (data.type) {
    case 'connect':
      adapter = await import(`./adapters/${data.provider}.js`);
      break;
    case 'query':
      eventSource?.close();
      const { url } = adapter.buildRequest(data.api, data.query, data.context);
      eventSource = new EventSource(url);
      eventSource.onmessage = (e) => {
        const msg = adapter.parseEvent(e.data);
        if (msg) self.postMessage(msg);
        if (msg?.type === 'done') eventSource.close();
      };
      eventSource.onerror = () => {
        self.postMessage({ type: 'error', message: 'Connection failed' });
        eventSource.close();
      };
      break;
    case 'abort':
      eventSource?.close();
      eventSource = null;
      break;
  }
};
```

## State Preservation

### localStorage (when `preserve-history` present)

Chat conversations stored with `search-bot:` prefix:

```json
{
  "title": "first user query",
  "created": 1708000000000,
  "messages": [
    { "role": "user", "text": "..." },
    { "role": "response", "summary": "...", "results": [...] }
  ]
}
```

When `preserve-history` is absent: no saves, no loads, no history UI.

### sessionStorage (when `preserve-state` present)

Single key `search-bot:ui-state`:

```json
{ "open": true, "activeChatKey": "search-bot:some-key" }
```

- Written on dialog open/close and on each `saveChat()`
- Read in `connectedCallback` — if `open` is true, reopens dialog and loads active chat
- Wrapped in try/catch for Safari compatibility
- Only meaningful when `preserve-history` is also set

### Navigation Flow

1. User is chatting, dialog is open
2. Clicks a same-domain link in a response
3. `beforeunload` writes `{ open: true, activeChatKey }` to sessionStorage
4. New page loads, component initializes
5. `connectedCallback` reads sessionStorage, reopens dialog, loads active chat
6. User continues where they left off

## package.json

```json
{
  "name": "@browser.style/search-bot",
  "version": "1.0.0",
  "description": "Search overlay and chatbot component with Web Worker communication",
  "type": "module",
  "module": "index.js",
  "exports": {
    ".": {
      "import": "./index.js",
      "style": "./index.css"
    },
    "./style": "./index.css"
  },
  "files": [
    "index.js",
    "index.css"
  ],
  "publishConfig": {
    "access": "public",
    "registry": "https://registry.npmjs.org/"
  },
  "keywords": [
    "browser.style",
    "web-components",
    "search-bot",
    "chatbot"
  ],
  "author": "Mads Stoumann",
  "license": "ISC",
  "repository": {
    "type": "git",
    "url": "git+https://github.com/madsstoumann/browser-style.git",
    "directory": "ui/search-bot"
  },
  "bugs": {
    "url": "https://github.com/madsstoumann/browser-style/issues"
  },
  "homepage": "https://browser.style/ui/search-bot"
}
```

## Inline Markdown Parsing

LLM responses contain inline markdown (links, bold, italic, code) and bare URLs. The component includes a lightweight inline markdown parser — no external dependencies.

### Supported Syntax

| Markdown | HTML |
|----------|------|
| `[text](url)` | `<a href="url">text</a>` |
| `https://example.com` | `<a href="https://example.com">example.com</a>` |
| `**bold**` | `<strong>bold</strong>` |
| `*italic*` | `<em>italic</em>` |
| `` `code` `` | `<code>code</code>` |
| `* item` | `<ul><li>item</li></ul>` (already supported) |

### Chunk Buffering

Since text streams in chunks, markdown tokens can arrive split across two messages (e.g. `[some te` in one chunk, `xt](url)` in the next). The parser handles this with a small trailing-buffer:

- After each chunk, check if the text ends with an incomplete markdown token (unmatched `[`, `**`, `` ` ``, or a bare `http` prefix without whitespace/end)
- If so, buffer the incomplete tail and don't render it yet
- Prepend the buffer to the next chunk before parsing
- On `done`, flush any remaining buffer as plain text

### Implementation

The parser lives in the component (`index.js`), not the Worker. The Worker sends raw text chunks — the component handles rendering. This keeps the Worker generic and the rendering logic co-located with the DOM.

```js
// Pseudocode
function parseInlineMarkdown(text) {
  return text
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/\*([^*]+)\*/g, '<em>$1</em>')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>')
    .replace(/(?<!["\w])https?:\/\/[^\s<)]+/g, url =>
      `<a href="${url}">${new URL(url).hostname}${new URL(url).pathname}</a>`
    );
}
```

The actual implementation will use DOM methods (`createElement`) rather than `innerHTML` to avoid XSS when rendering user/LLM content. The pseudocode above illustrates the parsing logic only.

## Rich Component Rendering

The component supports rendering custom interactive UI within responses via two paths:

### 1. Server-Suggested Components

The adapter can emit a fifth normalized message type:

```
{ type: 'component', name: 'recipe-card', props: { title: '...', image: '...', url: '...' } }
```

The component looks up a registered renderer for that name. If none is registered, the message is silently skipped — the server can suggest UI, but the client decides what to render.

### 2. Client-Configured Features

Built-in features can be enabled via attributes without any server involvement:

```html
<search-bot api="..." feedback></search-bot>
```

`feedback` — appends like/dislike buttons after each completed response. The component fires a custom event (`search-bot:feedback`) with the message context so the host page can handle it.

### Renderer Registry

The host page registers renderers via a public method:

```js
const bot = document.querySelector('search-bot');

bot.registerRenderer('recipe-card', (props) => {
  const card = document.createElement('recipe-card');
  card.data = props;
  return card;
});

bot.registerRenderer('product-preview', (props) => {
  const el = document.createElement('product-card');
  el.setAttribute('sku', props.sku);
  return el;
});
```

**Interface:** Each renderer is a function `(props) => HTMLElement | null`. It receives the props from the server message and returns a DOM node to append to the response, or `null` to skip.

**Storage:** Renderers are stored in a `Map` on the component instance. The registry is not serialized — it's runtime-only. This means when restoring a conversation from history, server-suggested components that were rendered during the original session won't reappear unless the host page re-registers the renderers and the stored message data includes the component messages.

### Message Storage

Component messages are stored in the chat history alongside text and results:

```json
{
  "messages": [
    { "role": "user", "text": "..." },
    { "role": "response", "summary": "...", "results": [...] },
    { "role": "component", "name": "recipe-card", "props": { "title": "..." } }
  ]
}
```

On `loadChat`, the component iterates messages and re-invokes registered renderers for any `component` entries. If the renderer isn't registered, the component entry is skipped silently.

### Normalized Message Types (Updated)

Five types total:

```
{ type: 'chunk', text }
{ type: 'results', items: [{ url, name, description, image }] }
{ type: 'component', name, props }
{ type: 'done' }
{ type: 'error', message }
```

## Key Decisions

1. **SSE** — kept as transport. No WebSocket needed for request → streamed response pattern.
2. **Web Worker** — thread isolation for SSE, JSON parsing, and adapter logic.
3. **Adapter pattern** — normalizes both request building and response parsing per provider.
4. **CSS-only modes** — `mode` attribute switches between overlay and chatbot via `:host()` selectors.
5. **Opt-in persistence** — `preserve-history` for localStorage, `preserve-state` for sessionStorage.
6. **Five normalized message types** — `chunk`, `results`, `component`, `done`, `error`. Provider-specific formats stay inside adapters.
7. **Normal navigation** — same-domain links navigate normally; state is restored via sessionStorage on the new page.
8. **Inline markdown** — lightweight parser for links, bare URLs, bold, italic, code. Chunk buffering handles split tokens across streamed messages. DOM-based rendering (no innerHTML) to prevent XSS.
9. **Rich components** — dual path: server-suggested via adapter + client-configured via attributes. Renderer registry on the component instance controls what renders. No arbitrary HTML from server — only registered renderers execute.
