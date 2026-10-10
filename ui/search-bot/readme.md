# @browser.style/search-bot

A conversation on a search box. `<ui-search-bot>` wraps a [`<ui-search>`](../search/readme.md) —
the form that works without script, is the `?q=` link, the `SearchAction` target and the WebMCP
tool — and, with script and an `api=`, streams an answer to the same question: a summary in words,
the pages it came from, follow-ups, history. Four modes: `inline` under the box, `overlay` (a
window), `search` (full screen), `chatbot` (docked by a floating button). Without a box to wrap it
brings its own form. Light DOM, no Shadow DOM.

Demo: [`index.html`](index.html).

## Install

```bash
npm install @browser.style/search-bot @browser.style/search @browser.style/base
```

```html
<link rel="stylesheet" href="@browser.style/base/index.css">
<link rel="stylesheet" href="@browser.style/search/index.css">
<link rel="stylesheet" href="@browser.style/search-bot/index.css">
<script type="module" src="@browser.style/search/index.js"></script>
<script type="module" src="@browser.style/search-bot/index.js"></script>
```

`@browser.style/search` is optional: without a wrapped box the bot draws its own form.

## Markup

**On a search box** — the box stays what it is; the bot adds the conversation:

```html
<ui-search-bot mode="overlay" context="site" api="/api/ask" trigger="submit" preserve-history feedback>
  <ui-search api="/api/search" trigger="input" variant="bar popover" highlight>
    <search aria-label="Site">
      <form action="/search" method="get">
        <label for="site-q">Search the site</label>
        <input type="search" id="site-q" name="q" required minlength="3" autocomplete="off" enterkeyhint="search">
        <button>Search</button>
      </form>
    </search>
  </ui-search>
</ui-search-bot>
```

**Standalone** — a floating button and a panel with its own field:

```html
<ui-search-bot mode="chatbot" position="be" context="brand" api="/api/ask" preserve-history preserve-state></ui-search-bot>
```

The script builds the rest, in the light DOM, as `data-bot=` parts:

```html
<ui-search-bot mode="overlay" …>
  <ui-search>…</ui-search>
  <button data-bot="ask">Ask</button>                       <!-- beside a wrapped box, in a dialog mode -->
  <button data-bot="trigger" commandfor="…" command="show-modal">…</button>   <!-- instead, when standalone -->
  <dialog data-bot="panel" closedby="any">                 <!-- a <div> in mode="inline" -->
    <div data-bot="header">
      <button data-bot="history" popovertarget="…">…</button> <ul data-bot="history-list" popover></ul>
      <button data-bot="new">…</button> <button data-bot="stop" hidden>…</button> <button data-bot="close">…</button>
    </div>
    <ol data-bot="conversation" aria-live="polite">
      <li data-bot="user">somewhere to sleep by the sea</li>
      <li data-bot="response">
        <p>… <a data-bot="ref" href="…" title="Masseria Lucia" aria-label="Source 1: Masseria Lucia">1</a> …</p>
        <ul data-bot="results"><li><a href="…"><img …><span><strong>name</strong><small>description</small></span></a></li></ul>
        <div data-bot="actions">…</div>
      </li>
    </ol>
    <form data-bot="form"><label data-bot="legend">Ask a question</label><input type="search" name="q"><button data-bot="send">…</button></form>
  </dialog>
</ui-search-bot>
```

## Attributes

| Attribute | Values | Default | What it does |
|---|---|---|---|
| `api` | URL | — | the stream's endpoint. Nothing happens without it; the wrapped box keeps working |
| `context` | word(s) | — | sent as `context=` so the endpoint knows what to answer from: `site`, `brand`, `site brand`, your own |
| `mode` | `inline` `overlay` `search` `chatbot` | `inline` | where the conversation lives (§ Modes) |
| `position` | `ts tc te cs cc ce bs bc be` | `be` | the floating trigger's cell, and the side a `chatbot` panel docks on (§ Position) |
| `trigger` | `submit` | — | in a dialog mode with a wrapped box: Enter on the box asks too, not only the Ask button |
| `provider` | `nlweb` `aisearch` or a module URL | `nlweb` | the adapter that builds the request and reads the messages (§ The stream) |
| `max-results` | number | — | passed to the adapter as `max_results` |
| `rewrite` | `true` `false` | — | passed to the adapter as `rewrite` (aisearch) |
| `options` | `close history new` | `close new history` (dialog), `new history` (inline) | the header's buttons. `history` also needs `preserve-history` |
| `multiline` | boolean | — | the bot's own field is a textarea: Enter sends, Shift+Enter breaks the line |
| `preserve-history` | boolean | — | threads are kept in `localStorage` and listed under the history button |
| `preserve-state` | boolean | — | with `preserve-history`: the open panel and its thread come back after a reload |
| `feedback` | boolean | — | like and dislike on every answer (`ui-search-bot:feedback`) |
| `share` | boolean | — | copy, and share where `navigator.share` exists |
| `theme` | a browser.style hue and its modifiers | — | paints the panel and the floating trigger, never the host (§ Theme) |
| `label-*` | text | English | every word the bot shows (§ Words) |
| `id` | | `ui-search-bot` | the storage prefix: two bots with different ids keep separate histories |

## Modes

| `mode` | Panel | Input | Trigger |
|---|---|---|---|
| `inline` | a `<div>` under the box, in the page, shown once there is a thread | the wrapped box's field; the bot's own when there is no box | none: Enter asks |
| `overlay` | a modal `<dialog>`, a centred window | the panel's own field | Ask beside the box, or a floating button |
| `search` | a modal `<dialog>` filling the screen | the panel's own field | the same |
| `chatbot` | a modal `<dialog>` docked by its trigger, without a backdrop | the panel's own field | the same |

With a wrapped box in a dialog mode, the box's text seeds the first question: type, press Ask, and
the window opens already answering. The dialog grows out of its trigger and shrinks back (anchor
positioning and `@starting-style`), and stands still under `prefers-reduced-motion`. `closedby="any"`:
Escape and a click outside close it.

### Position

One grid, shared with the card system's furniture: block `t`/`c`/`b` then inline `s`/`c`/`e`, so
`position="be"` is the end corner in both directions and mirrors in RTL. The floating trigger sits
in that cell, `--ui-search-bot-offset` from the edges; a `chatbot` panel opens on the trigger's side
and falls back to the other when there is no room.

### Icons

Every icon button takes your own icon: a direct child with one of these `slot=` names is moved into
that button when the bot builds. It keeps its own `fill` and `stroke` (only the built-in outlines are
styled), is sized by `--ui-search-bot-icon` and gets `aria-hidden="true"`; the button keeps its
`aria-label`. Until then, and when its button is not built (no `preserve-history`, no `close` in
`options`), it stays hidden.

| `slot` | Button | Built-in |
|---|---|---|
| `icon-trigger` | the floating trigger (standalone, dialog modes) | sparkles |
| `icon-history` | Earlier questions | clock |
| `icon-new` | New question | plus |
| `icon-close` | Close (dialog modes) | cross |
| `icon-submit` | Send, on the bot's own form | paper plane |
| `icon-stop` | Stop, while an answer streams | square |

```html
<ui-search-bot mode="chatbot" position="bs" api="/api/ask">
  <svg slot="icon-trigger" viewBox="0 0 24 24" fill="currentColor"><path d="…"/></svg>
</ui-search-bot>
```

The Ask button beside a wrapped box is a word, not an icon.

### Theme

`theme=` is the shared axis from `ui/base/theme.css`: a hue (`red orange green blue accent black
white gray slate`) and its modifiers (`pale`, `muted`, `ink`, `glass`, `light`, `dark`). The bot
re-publishes it, and the host itself never paints (its box is the page's, around a wrapped search
box):

| Theme value | Goes to |
|---|---|
| the final fill (`pale`, `muted`, `glass` applied) | `--ui-search-bot-bg`, the panel and the history list |
| the paired text, only with `ink` | `--ui-search-bot-c` (else the page's text colour, re-toned by `light`/`dark`) |
| the hue itself, solid | `--ui-search-bot-trigger-bg` / `--ui-search-bot-trigger-c`, the floating trigger |
| the `glass` material | `--ui-search-bot-bdf`, the panel's `backdrop-filter` |

`theme="blue pale"` is a solid blue button and a pale blue panel; `theme="slate ink"` a slate panel
with light text.

## The stream

`api=` is the endpoint, with any query string of its own. The adapter adds the question and the
thread and reads what comes back. `EventSource` carries it: GET, `text/event-stream`, one JSON object
per `data:` line.

**`nlweb`** (default) speaks [NLWeb](https://github.com/nlweb-ai/NLWeb):

| Direction | Shape |
|---|---|
| request | `?query=…&display_mode=full&generate_mode=summarize&context=site&prev=["earlier question"]&last_ans=[{"name","url"}]` |
| `result_batch` | `{ "message_type": "result_batch", "results": [{ "url", "name", "schema_object": { "name", "description", "image" } }] }` |
| `summary` | `{ "message_type": "summary", "message": "a piece of the answer" }` — concatenated as they come |
| `complete` | `{ "message_type": "complete" }` — the bot closes the connection |
| `error` | `{ "message_type": "error", "message": "…" }` — shown under the answer; the connection closes |

**`aisearch`** is the same with `type: chunk | results | done | error`, `text` and `items`.

The summary is text with a little Markdown: paragraphs, `*`/`-`/`1.` lists, `` `code` ``,
`**strong**`, `*em*`, `[text](url)` and bare URLs (http and https only; anything else stays text).
A trailing block

```
References
[1] https://example.com/page
[2] https://example.com/other
```

turns every `[1]` in the text into a small numbered chip (`data-bot="ref"`) linking to that URL; its
`title` and `aria-label` name the hit with that URL, when there is one ("Source 1: Masseria Lucia").
A trailer URL may be relative: it resolves against the page, so an endpoint can answer for whatever
host the visitor is on. A `[n]` the trailer has no URL for is a chip without a link; with no trailer
at all, `[n]` stays text. Copy and Share write chips back as `[n]`.

**Your own adapter**: `provider="./my-adapter.js"` imports a module exporting `buildRequest(api,
query, context, options)` → a URL and `parseEvent(json)` → `{ type: 'chunk', text } | { type:
'results', items } | { type: 'component', name, props } | { type: 'done' } | { type: 'error', message }
| null`. Or set `bot.adapter = { buildRequest, parseEvent }`. `context` is `{ prev: string[], last:
{ name, url }[] }`; `options` is `{ context, maxResults, rewrite }` from the attributes.

**Your own transport**: `bot.connect = (url) => source` returns anything with `onmessage`,
`onerror` and `close()` — a mock, as the demo's, or a `fetch` reader for POST.

The bot closes the connection itself on `complete`, on `error` and when stopped: left open, the
browser would reconnect and ask again.

## Words

Every string is a `label-*` attribute, read when the bot builds (set them in the markup):

| Attribute | English |
|---|---|
| `label-ask` | Ask |
| `label-question` / `label-follow-up` | Ask a question / Ask a follow-up question |
| `label-placeholder` | Ask a question or a follow-up |
| `label-send` / `label-stop` / `label-stopped` | Send / Stop / Answer stopped |
| `label-new` / `label-close` / `label-delete` | New question / Close / Delete |
| `label-history` / `label-no-history` | Earlier questions / No saved conversations |
| `label-like` / `label-dislike` | Good answer / Poor answer |
| `label-copy` / `label-share` | Copy / Share |
| `label-source` | Source (a citation chip's accessible name: "Source 1: page name") |
| `label-error` | The assistant is not available right now. |

## Script API

```js
const bot = document.querySelector('ui-search-bot');
bot.ask('somewhere to sleep by the sea');   // joins the thread, streams the answer
bot.open('a question');                      // dialog modes: show the panel, then ask (optional)
bot.close();
bot.stop();                                  // keep what has arrived
bot.newChat();
bot.registerRenderer('recipe-card', (props) => node);   // draws a `component` message
bot.adapter = { buildRequest, parseEvent };  // instead of provider=
bot.connect = (url) => source;               // instead of EventSource
bot.search;                                  // the wrapped <ui-search>, or null
bot.messages;                                // [{ role: 'user', text }, { role: 'response', summary, results }]
```

### Events

All bubble and are composed, named `ui-search-bot:*`:

| Event | When | `detail` |
|---|---|---|
| `open` / `close` | the dialog opens / closes | `{ chatKey }` |
| `chat-start` | the first question of a thread | `{ chatKey, query }` |
| `message` | a question is sent | `{ chatKey, role: 'user', text }` |
| `response` | an answer is complete | `{ chatKey, summary, results }` |
| `abort` | Stop was pressed | `{ chatKey }` |
| `error` | the stream failed or sent `error` | `{ chatKey, message }` |
| `feedback` | like or dislike | `{ chatKey, messageIndex, value }` |
| `copy` / `share` | | `{ chatKey, text }` |
| `chat-clear` | New question | `{ previousChatKey }` |

### History

`preserve-history` writes each thread to `localStorage` under `<id>:<slug>-<timestamp>` (`id`
defaults to `ui-search-bot`) with its title, time and messages; the history button lists them,
newest first, each with a delete button. `preserve-state` adds `<id>:ui-state` in `sessionStorage`,
so a reload reopens the panel on the same thread. Both are per browser and silent when storage is
blocked.

## Tokens

| Token | Default | Where |
|---|---|---|
| `--ui-search-bot-bg` / `--ui-search-bot-c` | `--color-surface` / `--color-text` | the panel; `theme=` sets both |
| `--ui-search-bot-bdc` | `--color-border` | panel and header borders |
| `--ui-search-bot-radius` | `0` (search), `--radius-xl` (overlay, chatbot) | the panel |
| `--ui-search-bot-w` / `--ui-search-bot-h` | per mode | the panel's size |
| `--ui-search-bot-offset` | `--spacing-lg` | the trigger's distance from the edges, and the overlay's margin |
| `--ui-search-bot-morph` | `--duration-slow` | the open and close animation |
| `--ui-search-bot-gap` | `--spacing-sm` | padding and gaps |
| `--ui-search-bot-prose` | `--width-prose` | the thread's measure |
| `--ui-search-bot-user-bg` | `--color-surface-alt` | the question bubble |
| `--ui-search-bot-thumb` | `3.5rem` | a hit's picture |
| `--ui-search-bot-button-bg` | `--color-surface-alt` | the icon buttons |
| `--ui-search-bot-trigger-bg` / `--ui-search-bot-trigger-c` | `--color-button` / `--color-button-text` | the floating trigger; `theme=` sets both |
| `--ui-search-bot-ref-bg` / `--ui-search-bot-ref-c` | `--color-surface-alt` / inherit | a citation chip |
| `--ui-search-bot-bdf` | `none` | the panel's `backdrop-filter`; `theme="… glass"` sets it |
| `--ui-search-bot-icon` | `--size-5` | icon size |
| `--ui-search-bot-backdrop` / `--ui-search-bot-backdrop-blur` | `--color-overlay` / `--blur-md` | behind an overlay or full-screen panel |

## Accessibility

- The wrapped `<search>` landmark and its labelled field are untouched; the Ask button is a real
  button with text. The panel is a `<dialog>` (modal, focus held, Escape closes) or, inline, a plain
  block after the form.
- The thread is an `aria-live="polite"` list marked `aria-busy` while an answer streams, so a
  screen reader gets the finished answer, not every token. Errors are `role="alert"`.
- Every icon button has an `aria-label`; like and dislike carry `aria-pressed`. An author's icon is
  `aria-hidden`. Hits are links; a hit's picture is decorative (`alt=""`). A citation chip's
  accessible name contains its number and names its page.
- The open and close animation, the backdrop blur and the waiting dots stop under
  `prefers-reduced-motion: reduce`.
- Logical properties throughout; `position` cells mirror in RTL.

## Agents (WebMCP)

The bot never answers an agent. A wrapped form keeps its `toolname`; when a browser's agent submits
it (`event.agentInvoked`), the bot steps aside and `<ui-search>` responds with the search response,
as documented in [`ui/search/readme.md`](../search/readme.md#agents-webmcp). The bot's own form
carries no tool.

## Browser support

Chrome 150+ and Safari 26.5+ (the repository baseline). Load-bearing: `<dialog closedby>`,
`commandfor`/`command`, the popover API, anchor positioning (`anchor-size()`, `position-area`),
`@starting-style` with `transition-behavior: allow-discrete`, `field-sizing`, `:has()`, `EventSource`.
