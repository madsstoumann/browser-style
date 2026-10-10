# ui/search-bot — internal notes

`<ui-search-bot>` is a registered light-DOM element: the conversation layer on a search form. The
public API is `readme.md`; this file is what is easy to break. Version 2 is the v4 treatment of the
Shadow-DOM `<search-bot>` (`--sbot-*`, `part=`, an English `I18N` constant, its own `<textarea>`
form); nothing of that markup survives, so do not pattern-match from a page that still uses it.

| File | Role |
|---|---|
| `ui-search-bot.js` | the element: builds the panel, takes the wrapped form's submit, opens the stream, draws the thread, keeps history |
| `ui-search-bot.css` | `@layer bs-component`, `:where()` only, `--ui-search-bot-*` on base tokens; the four modes and the morph |
| `index.html` | the demo: `/ui/search/data/demo.json` + a mock `connect` speaking NLWeb |

## Invariants

- **The box is `<ui-search>`'s, not ours.** The bot never writes into the wrapped element, never
  adds microdata or tool attributes, and leaves an agent's submit (`event.agentInvoked`) alone so
  `<ui-search>` answers it. Everything the bot builds is a sibling of the box, marked `data-bot=`.
- **The wrapped submit is caught on the way down.** `addEventListener('submit', …, true)` on the host
  runs before `<ui-search>`'s listener on the form; `stopPropagation()` there keeps the event from the
  form. Only when the bot takes it: `api=` set, and `mode="inline"` or `trigger~="submit"`. Then it
  mirrors the box's `sync-url` (`?q=` in the address, so the plain results are one reload away) and
  calls `search.clear()` so the list and the answer never show together.
- **Dialog modes need their own field.** A modal dialog makes the page inert, so the panel carries a
  form; inline with a wrapped box it does not (one field on the page). `#input` is the panel's field
  or null — a wrapped question is read from the box's field at submit time.
- **The connection is closed by us.** On `complete`, `error`, Stop and disconnect. An `EventSource`
  left open after the server closes reconnects and asks again: with a model behind the endpoint,
  that is a second paid call. `source.onerror` therefore ends the answer; it never retries.
- **Stale sources are ignored.** Every handler checks `this.#source === source`; a new question
  closes the old stream first.
- **Data is text.** Rows, bubbles and the summary are `createElement` + `textContent`; Markdown
  becomes nodes through `inline()`; `safeUrl()` gates every `href` and `src` (http, https, relative).
  Icons are path data turned into SVG nodes, never markup strings. There is no `innerHTML` in the
  file; keep it that way.
- **`[n]` chips need the References trailer.** `#renderSummary` maps `[n] url` lines to `[n]` in
  the text; each becomes `[data-bot="ref"]` showing the number, linked when the trailer gives a URL,
  with `title`/`aria-label` from the hit with that URL. No trailer: the `[n]` stays text. Never put
  the hit's name in the chip's text — adjacent chips then run together ("235" or "CardsPresets").
- **Author icons are moved, never cloned.** `#icon(name)` takes `:scope > [slot="icon-<name>"]` into
  its button once, at build. The CSS styles only `svg:not([slot])`, so an author's fill and stroke
  survive; an unclaimed slot child stays `display: none`.
- **The host never paints its theme.** Universal paint (`ui/base/theme.css`, bs-core) fills any
  `[theme]`; the bot resets the host from bs-component and re-publishes into inheriting
  `--ui-search-bot-*` tokens, because the `--_theme-*` vars do not inherit.
- **The summary node is replaced at the end.** While streaming, one text node grows; at `complete`
  (or Stop, or error) it is parsed and replaced, keeping `ul[data-bot="results"]` and components.
- **Words come from `label-*`, read once at build.** Changing a label attribute later changes
  nothing drawn; the defaults are the English `LABELS` table.
- **Storage never throws.** `read()`/`write()` wrap `localStorage`/`sessionStorage`; a blocked
  store means no history, not a broken bot. Keys are `<id>:…`; the `ui-state` key is skipped when
  listing threads.
- **Position is the nine-cell grid**, matched by prefix and suffix (`[position^="b"]`,
  `[position$="e"]`): no `top`/`left` words. The trigger and the Ask button both carry
  `anchor-name: --ui-search-bot-trigger`; the panel's closed and starting states size and place
  themselves with `anchor-size()`/`anchor(self-start)` — `self-start`, never `start`
  (docs/v4.md § Known sharp edges).
- **`position-area` docks the chatbot panel**, with `inset: auto` — an inset would fight it. The
  window modes centre with explicit insets, not `margin: auto`, so the morph can interpolate from
  the trigger's edges.
- **Reduced motion is a separate arm**: the transitions, the backdrop fade and the waiting dots all
  live under `prefers-reduced-motion: no-preference` or get an explicit `reduce` override.
