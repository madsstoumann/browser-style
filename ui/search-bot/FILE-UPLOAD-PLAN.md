# File Upload Handling for search-bot

## Context

The search-bot needs a way for users to attach a file (image, document, etc.) alongside a query. The file may be sent to a specialized service for pre-processing before the query is dispatched. Example: photo of a fridge → food-recognition service → array of items → recipe endpoint. This is an opt-in feature controlled by a `files` attribute.

## Design

### New Attribute: `files`

Controls accepted file types. Maps to `<input accept="">`. When absent, the file button is hidden.

```html
<search-bot api="..." files="image/*">
<search-bot api="..." files="image/*,.pdf">
<search-bot api="..." files=".jpg,.png,.webp">
```

### UI Changes

**File button** — a styled `<label>` + hidden `<input type="file">` inside the fieldset, next to the textarea. New `attach` icon in the ICONS map.

**Preview bar** — appears above the textarea when a file is attached. Shows an image thumbnail (via `URL.createObjectURL`) or a filename for non-images, with a remove button. Single file only.

```
┌─────────────────────────────────────┐
│  [🖼 fridge.jpg ✕]                  │  ← preview bar (only when file attached)
│  Ask a question or a follow-up      │
│                                     │
│  [📎]                               │
└─────────────────────────────────────┘
```

New CSS parts:

| Part | Element | Purpose |
|------|---------|---------|
| `search-file-input` | input[type=file] | Hidden native input |
| `search-file-label` | label | Styled attach icon button |
| `search-attachment` | div | Preview container (thumbnail + name + remove) |
| `search-attachment-remove` | button | Remove attached file |

### Public Method: `registerFileHandler(mimePattern, handler)`

Follows the `registerRenderer` pattern. One file at a time.

- **mimePattern**: `"image/*"`, `"image/jpeg"`, `"application/pdf"`, or `"*"` (catch-all)
- **handler**: `async (file: File, query: string) => { context?, query? } | null`

Matching priority: exact type (`image/jpeg`) > wildcard (`image/*`) > catch-all (`*`).

```javascript
bot.registerFileHandler('image/*', async (file, query) => {
  const form = new FormData();
  form.append('image', file);
  const res = await fetch('https://api.example.com/recognize-food', {
    method: 'POST',
    body: form,
  });
  const { items } = await res.json();
  return {
    context: { items },
    query: `${query} (detected: ${items.join(', ')})`,
  };
});
```

**Return shape:**
- `context` — merged into the search context passed to the adapter
- `query` — replaces the user's query text
- `null` — skip, proceed with original query

### Modified Search Flow

```
User submits query + file
  ↓
1. Find best matching handler for file.type
  ↓
2a. Handler found → await handler(file, query)
      → Merge result: rewrite query, add context
  ↓
2b. No handler → emit 'search-bot:file' event
      → External code can handle via event listener
      → Query proceeds as-is
  ↓
3. Render user message with file preview in conversation
  ↓
4. Revoke object URL, clear preview bar, reset file input
  ↓
5. Pass (possibly rewritten) query + context to adapter.buildRequest
```

### New Events

| Event | Detail | When |
|-------|--------|------|
| `search-bot:file-added` | `{ file, objectURL }` | File selected via input |
| `search-bot:file-removed` | `{ file }` | File removed from preview |
| `search-bot:file` | `{ file, query, handlerResult }` | Before search — after handler runs (or null if no handler) |

### New Instance State

```javascript
this.pendingFile = null;       // Single File object
this.fileHandlers = new Map(); // mimePattern → handler
this._objectURL = null;        // Track for revocation
```

### New CSS Custom Properties

```css
--sbot-attach-sz: 1.5em;
--sbot-preview-sz: 3rem;
--sbot-preview-bdrs: 0.5ch;
```

### Files to Modify

| File | Changes |
|------|---------|
| `src/index.js` | `registerFileHandler()`, `pendingFile` state, file input in `render()`, preview rendering, handler matching in `search()`, object URL lifecycle, new events |
| `src/index.css` | File input hiding, label styling, preview bar layout, thumbnail sizing, remove button |
| `AGENTS.md` | Document `files` attribute, `registerFileHandler`, new events, new CSS parts/properties |

### Verification

1. Add `files="image/*"` → attach button appears. Remove it → button hidden.
2. Select an image → preview with thumbnail and filename appears above textarea.
3. Click remove → preview disappears, object URL revoked (check DevTools).
4. Submit with file + registered handler → handler called, query rewritten, context passed to adapter.
5. Submit with file + no handler → `search-bot:file` event fires, query proceeds unchanged.
6. Submit without file → normal search, no file events.
7. Memory: attach/remove/submit cycle — no leaked object URLs or File references.
