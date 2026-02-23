# SearchBot Component - Internal Architecture

## Overview

`<search-bot>` is a conversational search overlay / chatbot web component that streams results via Server-Sent Events (SSE). It can be displayed as a full-screen modal (default) or as a positioned chatbot panel. Provider-specific logic is isolated in adapter modules, making the component protocol-agnostic.

**Version:** 1.0.0

**Component Type:** Autonomous custom element extending HTMLElement

**Key Features:**
- Adapter-based SSE streaming (provider-agnostic)
- Two display modes: full-screen modal and docked chatbot panel (CSS-only switch)
- Opt-in chat history persistence (localStorage)
- Opt-in UI state restoration across page loads (sessionStorage)
- Inline markdown parsing with XSS-safe rendering
- Extensible renderer registry for custom components
- 8 custom lifecycle events
- Feedback buttons (like/dislike) on responses
- Full theming via `--sbot-*` custom properties

**Key architectural decisions:**
- **No base class inheritance**: Standalone HTMLElement, no FormElement dependency
- **CSS import assertions**: `import stylesheet from './index.css' with { type: 'css' }` and `adoptedStyleSheets`
- **Dynamic adapter loading**: `await import(`./adapters/${provider}.js`)` on first query
- **DOM-based markdown parsing**: Uses `document.createDocumentFragment()` for untrusted content (XSS-safe)
- **innerHTML for static templates**: The `render()` method uses innerHTML for developer-controlled markup only
- **EventSource on main thread**: Non-blocking SSE, no worker overhead
- **Declarative dialog API**: Uses `commandfor`/`command` attributes for dialog open/close
- **Popover API**: History panel uses native popover

## Architecture Overview

### Component Lifecycle

```
constructor()
  ↓
  attachShadow({ mode: 'open' })
  adoptedStyleSheets = [stylesheet]
  Initialize: messages[], chatKey, eventSource, adapter, renderers Map
  ↓
connectedCallback()
  ↓
  render() → innerHTML static template
  Cache element references in this.elements
  Attach event listeners (form, input, history, trigger, dialog)
  ↓
  If preserve-state + preserve-history:
    Register beforeunload handler
    Restore UI state from sessionStorage
    Optionally reopen dialog and reload chat
  ↓
attributeChangedCallback('provider')
  ↓
  Reset adapter to null (lazy-loaded on next query)
  ↓
disconnectedCallback()
  ↓
  Close EventSource
  Remove beforeunload listener
```

### Module System

**Three-file component structure:**

- **src/index.js** (481 lines) — SearchBot class, helpers, inline markdown parser
- **src/index.css** (464 lines) — Shadow DOM styles with `--sbot-*` custom properties
- **src/adapters/nlweb.js** (40 lines) — NLWeb protocol adapter
- **src/adapters/aisearch.js** (37 lines) — Cloudflare AI Search streaming adapter
- **src/adapters/README.md** — Adapter documentation and authoring guide

**No external dependencies.** Pure vanilla JavaScript, no build step required.

## Data Flow Pipeline

### Query → SSE → Rendered Response

```
User submits query (form submit or Enter key)
  ↓
search(query)  [index.js:202]
  ↓
  Generate chatKey if new chat
  Push user message to this.messages
  Emit 'chat-start' (if new) + 'message'
  Render user bubble in conversation
  ↓
  Lazy-load adapter: import(`./adapters/${provider}.js`)
  ↓
  adapter.buildRequest(api, query, context, options)
    → { url } for EventSource
  ↓
  new EventSource(url)
  ↓
  onmessage → adapter.parseEvent(e.data) → normalized message
  ↓
  Switch on message.type:
    'chunk'     → appendChunk(text)       — append to streaming text node
    'results'   → appendResults(items)    — render result cards with images
    'component' → appendComponent(name, props) — invoke registered renderer
    'done'      → completeResponse()      — finalize, parse markdown, save, emit
    'error'     → handleError(message)    — emit error, close connection
```

### Response Finalization (completeResponse)

```
completeResponse()  [index.js:280]
  ↓
  Close EventSource
  Replace streaming text node with parsed markdown (renderParsedSummary)
  Push response message to this.messages
  Push any component messages to this.messages
  Emit 'response' event
  Save chat to localStorage (if preserve-history)
  Append feedback buttons (if feedback attribute)
  Scroll to response
```

### Markdown Parsing Pipeline

```
renderParsedSummary(container, text, refs)  [index.js:315]
  ↓
  Split text into lines
  Extract [N] reference section if present
  ↓
  For each line:
    "* bullet" → <ul><li> with inline content
    Other text → <p> with inline content
  ↓
  appendInlineContent(container, text, refs, refMap)  [index.js:351]
    ↓
    Split on [N] reference markers
    For ref markers → <a> link using refMap URL
    For text segments → parseInlineMarkdown()
      ↓
      parseInlineMarkdown(text)  [index.js:46]
        Regex matchAll for: `code`, **bold**, *italic*, [text](url), bare URLs
        ↓
        Each match creates DOM node via el() helper
        Links validated: only http/https protocols allowed (XSS prevention)
        ↓
        Returns DocumentFragment
```

## Adapter Interface

Adapters are plain ES modules at `src/adapters/{provider}.js` loaded dynamically on first query.

### Required Exports

```javascript
/**
 * Build the SSE request URL from component state.
 * @param {string} api      - Base URL from the component's api attribute
 * @param {string} query    - Trimmed user query
 * @param {object} context  - { prev: string[], last: object[] }
 *   prev: last 10 user queries for conversation context
 *   last: last 20 result objects for search context
 * @param {object} [options] - Optional tuning from element attributes
 *   maxResults: number from max-results attribute
 *   rewrite: boolean from rewrite attribute
 * @returns {{ url: string }}
 */
export function buildRequest(api, query, context, options = {}) { ... }

/**
 * Parse a raw SSE event into a normalized message.
 * @param {string} eventData - Raw event data (usually JSON)
 * @returns {object|null} Normalized message or null to skip
 */
export function parseEvent(eventData) { ... }
```

### Normalized Message Types

| Type | Shape | Purpose |
|------|-------|---------|
| `chunk` | `{ type: 'chunk', text }` | Streaming text fragment |
| `results` | `{ type: 'results', items: [{ url, name, description, image }] }` | Search result batch |
| `component` | `{ type: 'component', name, props }` | Custom component to render |
| `done` | `{ type: 'done' }` | Stream complete |
| `error` | `{ type: 'error', message }` | Error occurred |

### NLWeb Adapter (nlweb.js)

For backends implementing Microsoft's NLWeb SSE protocol. Used by full NLWeb servers (e.g. `wild-flower`) and custom workers that emit the same message types.

**Endpoint:** `{api}/ask?query=...&display_mode=full&generate_mode=summarize`

Maps NLWeb protocol to normalized messages:
- `message_type: 'summary'` → `{ type: 'chunk' }`
- `message_type: 'result_batch'` → `{ type: 'results' }` with `normalizeResult()` extracting `schema_object`
- `message_type: 'complete'` → `{ type: 'done' }`
- Unknown types → `null` (skipped)

**Context:** Sends `prev` (previous queries) and `last_ans` (previous results) as query parameters.

**Options:** Forwards `max_results` and `rewrite` as query parameters. Note: full NLWeb servers (like `wild-flower`) ignore these; custom workers (like `wpp-search`) respect them.

### AI Search Adapter (aisearch.js)

For backends using Cloudflare AI Search (`aiSearch`) with streaming. The worker calls `aiSearch({ stream: true })` for the LLM summary and `rag.search()` in parallel for result items (since `aiSearch` streaming only returns response tokens, not search results).

**Endpoint:** `{api}/stream?query=...`

Maps a simpler event format to normalized messages:
- `type: 'chunk'` → `{ type: 'chunk' }`
- `type: 'results'` → `{ type: 'results' }` with `normalizeResult()` extracting `schema_object`
- `type: 'done'` → `{ type: 'done' }`
- `type: 'error'` → `{ type: 'error' }`

**Context:** Sends `prev` (previous queries). Does not send `last_ans`.

**Options:** Forwards `max_results` and `rewrite` as query parameters.

### Writing a Custom Adapter

See `src/adapters/README.md` for the full authoring guide. Minimal example:

```javascript
// src/adapters/my-provider.js
export function buildRequest(api, query, context, options = {}) {
  return { url: `${api}/search?q=${encodeURIComponent(query)}` };
}

export function parseEvent(eventData) {
  try {
    const data = JSON.parse(eventData);
    if (data.text) return { type: 'chunk', text: data.text };
    if (data.hits) return { type: 'results', items: data.hits };
    if (data.end) return { type: 'done' };
    return null;
  } catch { return null; }
}
```

Use it with `<search-bot provider="my-provider">`. The component dynamically imports `./adapters/${provider}.js`, so no registration step is needed.

## State Management

### Instance Properties

```javascript
this.messages = [];          // Conversation history: [{ role, text|summary|results|name|props }]
this.chatKey = null;         // Current chat ID: 'search-bot:slug-timestamp'
this.eventSource = null;     // Active SSE connection
this.adapter = null;         // Lazy-loaded adapter module { buildRequest, parseEvent }
this.renderers = new Map();  // Renderer registry: Map<name, (props) => HTMLElement>
this.currentResponse = null; // Active response accumulator during streaming
this.elements = {};          // Cached DOM references (set in connectedCallback)
```

### Message Roles

```javascript
{ role: 'user', text: 'query string' }
{ role: 'response', summary: 'markdown text', results: [{ name, url, image, description }] }
{ role: 'component', name: 'renderer-name', props: { ... } }
```

### Storage

**localStorage** (when `preserve-history` attribute present):

```javascript
// Key: 'search-bot:slug-timestamp'
{
  title: "First user query",
  created: 1708000000000,
  messages: [ /* message objects */ ]
}
```

**sessionStorage** (when `preserve-state` + `preserve-history` present):

```javascript
// Key: 'search-bot:ui-state'
{
  open: true,              // Was dialog open?
  activeChatKey: "search-bot:slug-timestamp"
}
```

## Event System

All events use `bubbles: true, composed: true` to cross the Shadow DOM boundary.

| Event | Fired When | Detail |
|-------|-----------|--------|
| `search-bot:open` | Dialog opens | `{ chatKey }` |
| `search-bot:close` | Dialog closes | `{ chatKey }` |
| `search-bot:chat-start` | First query of new conversation | `{ chatKey, query }` |
| `search-bot:message` | Each user query submitted | `{ chatKey, role: 'user', text }` |
| `search-bot:response` | Response stream completes | `{ chatKey, summary, results }` |
| `search-bot:chat-clear` | User clicks "New question" | `{ previousChatKey }` |
| `search-bot:feedback` | User clicks like/dislike | `{ chatKey, messageIndex, value }` |
| `search-bot:error` | SSE or adapter error | `{ chatKey, message }` |

### Event Usage

```javascript
const bot = document.querySelector('search-bot');

bot.addEventListener('search-bot:response', (e) => {
  console.log(e.detail.summary, e.detail.results);
});

bot.addEventListener('search-bot:feedback', (e) => {
  fetch('/api/feedback', {
    method: 'POST',
    body: JSON.stringify(e.detail),
  });
});
```

## DOM Structure

### Shadow DOM Template

```html
<button part="search-trigger" commandfor="search-dialog" command="show-modal">
  <slot name="icon"><!-- AI sparkle SVG --></slot>
</button>

<dialog id="search-dialog" part="search-overlay" closedby="any">
  <div part="search-header">
    <button part="search-history" popovertarget="search-history-popover">
      <!-- Chat bubble SVG -->
    </button>
    <div id="search-history-popover" part="search-history-panel" popover>
      <ul part="search-history-list"></ul>
    </div>
    <button part="search-close" commandfor="search-dialog" command="close">
      <!-- X stroke SVG -->
    </button>
  </div>

  <ol part="search-conversation">
    <!-- Dynamic: <li part="user"> and <li part="response"> -->
  </ol>

  <form part="search-form">
    <fieldset part="search-fieldset">
      <legend part="search-legend">Ask a question</legend>
      <textarea part="search-input" name="q"></textarea>
    </fieldset>
    <button part="search-new">New question</button>
  </form>
</dialog>
```

### CSS Parts

| Part | Element | Purpose |
|------|---------|---------|
| `search-trigger` | button | Floating button that opens the overlay |
| `search-overlay` | dialog | Full-screen modal or chatbot panel |
| `search-header` | div | Top bar with history + close |
| `search-history` | button | History toggle button |
| `search-history-panel` | div[popover] | History popover container |
| `search-history-list` | ul | Saved conversations list |
| `search-history-delete` | button | Delete button on history items |
| `search-close` | button | Close dialog button |
| `search-conversation` | ol | Scrollable message thread |
| `user` | li | User message bubble |
| `response` | li | Bot response container |
| `search-result-img` | img | Result thumbnail |
| `search-result-desc` | small | Result description |
| `search-feedback` | div | Feedback buttons container |
| `search-feedback-like` | button | Thumbs-up button |
| `search-feedback-dislike` | button | Thumbs-down button |
| `search-form` | form | Sticky bottom input area |
| `search-fieldset` | fieldset | Input wrapper |
| `search-legend` | legend | Dynamic label ("Ask a question" / "Ask a follow-up") |
| `search-input` | textarea | Query input |
| `search-new` | button | "New question" button |
| `icon-stroke` | svg | Stroke-based icon styling (fill: none, stroke: currentColor) |

## Attributes

| Attribute | Type | Default | Purpose |
|-----------|------|---------|---------|
| `api` | URL | _(required)_ | SSE endpoint base URL |
| `provider` | string | `'nlweb'` | Adapter module name (`./adapters/{provider}.js`) |
| `mode` | string | `'search'` | `'search'` (full-screen) or `'chatbot'` (docked panel) |
| `position` | string | — | Trigger/panel placement: `'bottom right'`, `'top left'`, `'inline'`, etc. |
| `max-results` | number | — | Maximum search results (passed to adapter as `options.maxResults`) |
| `rewrite` | `'true'\|'false'` | — | Whether backend should rewrite query (passed as `options.rewrite`) |
| `preserve-history` | boolean | — | Enable localStorage chat persistence |
| `preserve-state` | boolean | — | Restore dialog open state on reload (requires `preserve-history`) |
| `feedback` | boolean | — | Show like/dislike buttons on responses |

### Observed Attributes

Only `provider` is observed. Changing it resets the cached adapter so the new one is loaded on next query.

## Public API

### Methods

| Method | Signature | Purpose |
|--------|-----------|---------|
| `registerRenderer(name, fn)` | `(string, (props) => HTMLElement)` | Register a custom component renderer |
| `search(query)` | `(string) → Promise<void>` | Programmatically initiate a search |
| `emit(name, detail)` | `(string, object)` | Dispatch a `search-bot:*` custom event |

### Renderer Registry

```javascript
const bot = document.querySelector('search-bot');

bot.registerRenderer('recipe-card', (props) => {
  const card = document.createElement('recipe-card');
  card.data = props;
  return card;
});
```

When the adapter returns `{ type: 'component', name: 'recipe-card', props: {...} }`, the registered renderer is invoked. Component messages are serialized to chat history and re-rendered via the registry on `loadChat()`.

## CSS Custom Properties

All visual properties are driven by `--sbot-*` custom properties on `:host` for external theming.

### Typography & Global
| Property | Default | Purpose |
|----------|---------|---------|
| `--sbot-ff` | `'Iowan Old Style', 'Palatino Linotype', ...serif` | Font family |
| `--sbot-icon-sz` | `2em` | Default SVG icon size |
| `--sbot-hover-bg` | `hsl(0 0% 0% / 0.05)` | Shared hover background |
| `--sbot-scrollbar-thumb` | `hsl(0 0% 0% / 0.25)` | Scrollbar thumb color |
| `--sbot-scrollbar-track` | `transparent` | Scrollbar track color |

### Trigger Button
| Property | Default | Purpose |
|----------|---------|---------|
| `--sbot-trigger-bg` | `hsl(0 0% 10% / 0.15)` | Background |
| `--sbot-trigger-bdrs` | `50%` | Border radius |
| `--sbot-trigger-offset` | `1rem` | Distance from viewport edge |

### Overlay / Dialog
| Property | Default | Purpose |
|----------|---------|---------|
| `--sbot-overlay-bg` | `hsl(0 0% 100% / 0.15)` | Dialog background |
| `--sbot-overlay-bdf` | `blur(16px) saturate(180%)` | Backdrop filter |
| `--sbot-overlay-bdc` | `hsl(0 0% 100% / 0.3)` | Border color |
| `--sbot-overlay-backdrop` | `hsl(0 0% 90% / 0.4)` | `::backdrop` color |

### Header
| Property | Default | Purpose |
|----------|---------|---------|
| `--sbot-header-g` | `0.5rem` | Gap |
| `--sbot-header-p` | `1rem 2rem` | Padding |

### History Panel
| Property | Default | Purpose |
|----------|---------|---------|
| `--sbot-history-bg` | `hsl(0 0% 100% / 0.95)` | Background |
| `--sbot-history-bdf` | `blur(8px)` | Backdrop filter |
| `--sbot-history-bdc` | `hsl(0 0% 0% / 0.1)` | Border color |
| `--sbot-history-bdrs` | `0.5rem` | Border radius |
| `--sbot-history-bxsh` | `0 4px 12px hsl(0 0% 0% / 0.15)` | Box shadow |
| `--sbot-history-mxbs` | `60vh` | Max block size |
| `--sbot-history-mxis` | `20rem` | Max inline size |

### Conversation
| Property | Default | Purpose |
|----------|---------|---------|
| `--sbot-conversation-mxw` | `70ch` | Max content width |

### User Message
| Property | Default | Purpose |
|----------|---------|---------|
| `--sbot-user-bgc` | `hsl(200 25% 90% / 1)` | Bubble background |
| `--sbot-user-bdrs` | `0.75rem` | Border radius |
| `--sbot-user-p` | `0.625rem 1rem` | Padding |

### Code & Links (inside responses)
| Property | Default | Purpose |
|----------|---------|---------|
| `--sbot-code-bg` | `hsl(0 0% 0% / 0.06)` | Inline code background |
| `--sbot-code-bdrs` | `0.25em` | Code border radius |
| `--sbot-code-ff` | `monospace` | Code font family |
| `--sbot-link-c` | `hsl(210 100% 40%)` | Link color |

### Form / Input
| Property | Default | Purpose |
|----------|---------|---------|
| `--sbot-form-p` | `1rem 2rem` | Form padding |
| `--sbot-input-bdrs` | `1ch` | Input border radius |
| `--sbot-input-p` | `1ch 2ch` | Input padding |

### Result Images
| Property | Default | Purpose |
|----------|---------|---------|
| `--sbot-img-ar` | `16/9` | Aspect ratio |
| `--sbot-img-bgc` | `hsl(0 0% 50% / 0.15)` | Placeholder background |
| `--sbot-img-mxis` | `200px` | Max inline size |

### Feedback Buttons
| Property | Default | Purpose |
|----------|---------|---------|
| `--sbot-feedback-g` | `0.5rem` | Gap |
| `--sbot-feedback-bdc` | `hsl(0 0% 0% / 0.1)` | Border color |
| `--sbot-feedback-bdrs` | `0.25rem` | Border radius |

### Chatbot Mode
| Property | Default | Purpose |
|----------|---------|---------|
| `--sbot-chatbot-bs` | `min(600px, 80vh)` | Panel block size |
| `--sbot-chatbot-is` | `min(400px, 90vw)` | Panel inline size |
| `--sbot-chatbot-bdrs` | `1rem` | Panel border radius |
| `--sbot-chatbot-bxsh` | `0 8px 32px hsl(0 0% 0% / 0.2)` | Panel box shadow |
| `--sbot-chatbot-offset` | `5rem` | Distance from corner |

## Integration Examples

### Basic Usage

```html
<search-bot
  api="https://api.example.com"
  provider="nlweb"
  position="bottom right"
></search-bot>
```

### Full-Featured

```html
<search-bot
  api="https://api.example.com"
  provider="nlweb"
  position="bottom right"
  preserve-history
  preserve-state
  feedback
></search-bot>
```

### Chatbot Mode

```html
<search-bot
  api="https://api.example.com"
  provider="nlweb"
  mode="chatbot"
  position="bottom right"
  preserve-history
></search-bot>
```

### Custom Trigger Icon

```html
<search-bot api="https://api.example.com" provider="nlweb" position="bottom right">
  <svg slot="icon" viewBox="0 0 24 24"><!-- custom icon --></svg>
</search-bot>
```

### Custom Component Renderers

```javascript
const bot = document.querySelector('search-bot');

bot.registerRenderer('product-card', (props) => {
  const el = document.createElement('product-card');
  el.data = props;
  return el;
});

bot.registerRenderer('map-view', ({ lat, lng, label }) => {
  const div = document.createElement('div');
  div.textContent = `Map: ${label} (${lat}, ${lng})`;
  return div;
});
```

### Listening to Events

```javascript
const bot = document.querySelector('search-bot');

bot.addEventListener('search-bot:chat-start', (e) => {
  analytics.track('search_started', { chatKey: e.detail.chatKey });
});

bot.addEventListener('search-bot:response', (e) => {
  console.log('Summary:', e.detail.summary);
  console.log('Results:', e.detail.results);
});

bot.addEventListener('search-bot:feedback', (e) => {
  fetch('/api/feedback', {
    method: 'POST',
    body: JSON.stringify(e.detail),
  });
});
```

### Theming

```css
search-bot {
  --sbot-ff: system-ui, sans-serif;
  --sbot-overlay-bg: hsl(220 20% 10% / 0.9);
  --sbot-user-bgc: hsl(220 50% 30%);
  --sbot-link-c: hsl(200 100% 60%);
  --sbot-trigger-bg: hsl(220 80% 50%);
}
```

## Gotchas and Edge Cases

### 1. Adapter Loading Failure

**Issue:** If `provider` attribute names a module that doesn't exist, `import()` throws.

**Impact:** The `search()` method is async but doesn't surface the import error to the user beyond the console. The EventSource is never created.

### 2. preserve-state Without preserve-history

**Issue:** `preserve-state` requires `preserve-history` to function. Without saved chats in localStorage, there's nothing to restore.

**Guard:** `saveUIState()` early-returns if either attribute is missing.

### 3. Chat Key Collision

**Issue:** `chatKey()` uses `slug-Date.now()`. Two rapid queries with the same slug could theoretically collide.

**Impact:** Extremely unlikely in practice (requires same query within 1ms).

### 4. EventSource Left Open

**Issue:** If user navigates away mid-stream without `disconnectedCallback` firing (e.g., browser crash).

**Impact:** Server-side timeout handles cleanup. Client re-creates on next query.

### 5. History Panel Hidden Without Attribute

**CSS rule:** `:host(:not([preserve-history])) [part="search-history"] { display: none; }`

**Impact:** History toggle button is hidden but still in DOM. This is intentional — CSS-only visibility.

### 6. XSS in Markdown Links

**Issue:** LLM-generated markdown could contain `[text](javascript:alert(1))`.

**Guard:** `parseInlineMarkdown` validates link protocols — only `http:` and `https:` are rendered as `<a>`. Invalid protocols render as plain text.

### 7. Feedback Button Event Target

**Issue:** Click events on SVG elements inside feedback buttons need `.closest('button')`.

**Guard:** Event delegation with `e.target.closest('button')` handles clicks on nested SVG/path elements.

### 8. Result Data Completeness

**Issue:** `appendResults` saves `{ name, url, image, description }` so history restoration can render thumbnails.

**Impact:** If an adapter omits `image` or `description`, they're stored as `undefined` — harmless, just no thumbnail/description rendered.

## Helper Functions

| Function | Line | Purpose |
|----------|------|---------|
| `chatKey(query)` | 24 | Generate storage key: `search-bot:slug-timestamp` |
| `fromStorage(key)` | 29 | Safe JSON.parse from localStorage |
| `el(tag, attrs, children)` | 33 | DOM element factory with attribute/property handling |
| `parseInlineMarkdown(text)` | 46 | XSS-safe inline markdown → DocumentFragment |
| `icon(name, part)` | 73 | Generate SVG string from ICONS paths |

## Icons

| Name | Style | Usage |
|------|-------|-------|
| `ai` | Filled | Trigger button (sparkle stars) |
| `close` | Stroke | Close button (X cross) |
| `history` | Filled | History toggle (chat bubble with smile) |
| `like` | Stroke | Feedback thumbs-up |
| `dislike` | Stroke | Feedback thumbs-down |

## Browser APIs Used

| API | Purpose |
|-----|---------|
| `EventSource` | SSE streaming |
| `CustomEvent` | Lifecycle events (bubbles + composed) |
| `ShadowDOM` | Encapsulation (open mode) |
| `adoptedStyleSheets` | CSS import assertion |
| `Dialog` (showModal) | Full-screen/modal overlay |
| `Popover API` | History panel |
| `commandfor/command` | Declarative dialog control |
| `closedby` | Light-dismiss dialog |
| `localStorage` | Chat persistence |
| `sessionStorage` | UI state restoration |
| `Dynamic import()` | Adapter lazy loading |

## File Summary

| File | Lines | Purpose |
|------|-------|---------|
| src/index.js | 481 | Main component class + helpers |
| src/index.css | 464 | Shadow DOM styles with --sbot-* theming |
| src/adapters/nlweb.js | 40 | NLWeb protocol adapter |
| src/adapters/aisearch.js | 37 | Cloudflare AI Search streaming adapter |
| src/adapters/README.md | — | Adapter documentation and authoring guide |
| index.html | 28 | Demo page |
| package.json | 38 | Package metadata |
