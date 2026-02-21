# search-bot — Architecture Design

## Overview

Rename `search-widget` to `search-bot`. A CSS-first web component that works as both a full-screen search overlay and a compact chatbot panel, controlled by a `mode` attribute. Uses SSE streaming on the main thread with an adapter layer for provider-agnostic API integration.

## Migration from search-widget

This is a refactor of the existing `ui/search-widget/` component, not a greenfield build.

### Steps

1. **Rename directory** — `ui/search-widget/` → `ui/search-bot/`
2. **Rename custom element** — `customElements.define('search-widget', ...)` → `customElements.define('search-bot', ...)`
3. **Update storage prefix** — `search-widget:` → `search-bot:` (localStorage keys)
4. **Add `package.json`** — new file for `@browser.style/search-bot`
5. **Refactor `index.js`** — extract SSE + NLWeb-specific logic into `adapters/nlweb.js`, add adapter dispatch, events, state preservation, markdown parsing, renderer registry
6. **Extend `index.css`** — add `:host([mode="chatbot"])` rules, `preserve-history` visibility, chatbot sizing/positioning

The existing conversation logic (`messages` array, `saveChat`, `loadChat`, `renderHistory`, `getSearchContext`), DOM structure (`<dialog>`, `<form>`, popover history panel), and rendering helpers (`el()`, `icon()`, `appendResultItem`) are preserved and built upon.

## File Structure

```
ui/search-bot/
├── package.json            @browser.style/search-bot
├── index.html              Demo page
├── src/
│   ├── index.js            Component (UI, state, SSE connection)
│   ├── index.css           Styles (both modes, all layout variants)
│   └── adapters/
│       └── nlweb.js        NLWeb adapter (request builder + response parser)
```

## Attributes

| Attribute | Values | Description |
|-----------|--------|-------------|
| `api` | URL string | Endpoint URL |
| `provider` | `"nlweb"` (default) | Selects which adapter module to load |
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

## Adapter Layer

### Adapter Interface

Each provider adapter is a plain ES module exporting two functions:

```js
export function buildRequest(api, query, context) → { url }
export function parseEvent(eventData) → { type, ... } | null
```

- **`buildRequest`** — constructs the SSE URL with query parameters from the normalized query and context.
- **`parseEvent`** — parses a raw SSE event and returns a normalized message (`chunk`, `results`, `component`, `done`, `error`) or `null` to skip.

The `nlweb.js` adapter maps:
- `summary` → `{ type: 'chunk', text }`
- `result_batch` → `{ type: 'results', items }` (with result normalization)
- `complete` → `{ type: 'done' }`

### Component ↔ Adapter Flow

The component imports the adapter dynamically based on the `provider` attribute and uses it directly on the main thread:

```js
// index.js (pseudocode)
async search(query) {
  if (!this.adapter) {
    const provider = this.getAttribute('provider') || 'nlweb';
    this.adapter = await import(`./adapters/${provider}.js`);
  }

  this.closeEventSource();
  const { url } = this.adapter.buildRequest(this.getAttribute('api'), query, this.getSearchContext());
  this.eventSource = new EventSource(url);

  this.eventSource.onmessage = (e) => {
    const msg = this.adapter.parseEvent(e.data);
    if (!msg) return;
    switch (msg.type) {
      case 'chunk': this.appendChunk(msg.text); break;
      case 'results': this.appendResults(msg.items); break;
      case 'component': this.renderComponent(msg.name, msg.props); break;
      case 'done': this.completeResponse(); break;
      case 'error': this.handleError(msg.message); break;
    }
  };

  this.eventSource.onerror = () => {
    this.emit('search-bot:error', { chatKey: this.chatKey, message: 'Connection failed' });
    this.closeEventSource();
  };
}
```

EventSource is inherently non-blocking — the browser handles the HTTP connection on a network thread. The per-chunk cost on the main thread (JSON parse + DOM append) is negligible. A Web Worker can be added later if profiling shows a need, without changing the adapter interface.

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
  "description": "Search overlay and chatbot component with adapter-based SSE streaming",
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

The parser lives in the component (`index.js`). The adapter sends raw text via normalized `chunk` messages — the component handles parsing and rendering.

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

## Custom Events

The component emits custom events at key lifecycle moments. All events use `bubbles: true, composed: true` so they cross the shadow DOM boundary. The host page listens on the element or any ancestor.

### Event Catalog

| Event | Fired when | `detail` payload |
|-------|------------|------------------|
| `search-bot:open` | Dialog opens | `{ chatKey }` |
| `search-bot:close` | Dialog closes | `{ chatKey }` |
| `search-bot:chat-start` | New conversation begins (first query) | `{ chatKey, query }` |
| `search-bot:message` | Each user query is submitted | `{ chatKey, role: 'user', text }` |
| `search-bot:response` | A complete response is received (`done`) | `{ chatKey, summary, results }` |
| `search-bot:chat-clear` | User starts a new chat | `{ previousChatKey }` |
| `search-bot:feedback` | User clicks like/dislike (requires `feedback` attr) | `{ chatKey, messageIndex, value: 'like' \| 'dislike' }` |
| `search-bot:error` | SSE connection or adapter error | `{ chatKey, message }` |

### Usage Example

```js
document.querySelector('search-bot').addEventListener('search-bot:response', (e) => {
  const { chatKey, summary, results } = e.detail;
  // Post to server, attach user_id, enforce login gate, etc.
  fetch('/api/conversations', {
    method: 'POST',
    body: JSON.stringify({ chatKey, summary, results, userId: currentUser?.id }),
  });
});
```

### Login Gate Pattern (Future)

The host page counts `search-bot:message` events and shows a login modal after N messages. The component is unaware of auth — it just emits events.

```js
let messageCount = 0;
bot.addEventListener('search-bot:message', () => {
  if (++messageCount >= 5 && !currentUser) showLoginModal();
});
```

## Key Decisions

1. **SSE on main thread** — kept as transport. EventSource is inherently non-blocking. No Web Worker needed — can be added later if profiling shows a need.
2. **Adapter pattern** — normalizes both request building and response parsing per provider. Loaded as plain ES modules on the main thread.
3. **CSS-only modes** — `mode` attribute switches between overlay and chatbot via `:host()` selectors.
4. **Opt-in persistence** — `preserve-history` for localStorage, `preserve-state` for sessionStorage.
5. **Five normalized message types** — `chunk`, `results`, `component`, `done`, `error`. Provider-specific formats stay inside adapters.
6. **Normal navigation** — same-domain links navigate normally; state is restored via sessionStorage on the new page.
7. **Inline markdown** — lightweight parser for links, bare URLs, bold, italic, code. Chunk buffering handles split tokens across streamed messages. DOM-based rendering (no innerHTML) to prevent XSS.
8. **Rich components** — dual path: server-suggested via adapter + client-configured via attributes. Renderer registry on the component instance controls what renders. No arbitrary HTML from server — only registered renderers execute.
9. **Custom events** — granular lifecycle events (`open`, `close`, `chat-start`, `message`, `response`, `chat-clear`, `feedback`, `error`) enable server-side storage, analytics, login gates, and any host-page integration without coupling.
