# ui/search — internal notes

`<ui-search>` is a registered light-DOM element (CSS cannot fetch), wrapping markup the page
writes: `<search>` › `<form>` › label, `input[name]`, button, filters. The public API is
`readme.md`; this file is what is easy to break.

| File | Role |
|---|---|
| `ui-search.js` | the element. Reads the form, sends `FormData` + `take` to `api=`, draws rows, keeps the status line |
| `ui-search.css` | `@layer bs-component`, `:where()` only. Tokens fall back **at the point of use** |
| `index.html` | the demo; `data/demo.json` + an in-page `transform` stand in for a backend |

## Invariants

- **The form must keep working without the script.** Never move behaviour into the element that the form cannot do natively; `trigger` without `submit` leaves Enter to the browser.
- **No microdata, anywhere in the element.** An `itemprop` would attach to an ancestor item (a card, a detail page's `<article itemscope>`), and a `WebSite` node would duplicate the page's own. readme.md § Structured data.
- **Tokens are never declared on the host.** `results=` can put the panel outside `<ui-search>`, where host-declared custom properties do not inherit; and declaring defaults on the panel would block a host override. So every `var(--ui-search-*, fallback)` carries its default where it is used.
- **The status element exists before text is written.** A live region inserted together with its text is not announced. `connectedCallback` creates it empty.
- **Data is text.** Rows are built with `createElement` + `textContent`; `<mark>` comes from splitting text nodes; URLs pass `safeUrl()` (http, https, relative) before they reach `href` or `src`.
- **Stale answers are dropped** by a sequence number, and the previous request is aborted. Keep both: abort alone does not stop a `transform` that is already running.
- **Results are links, not a combobox.** Arrow keys are a shortcut; do not add `role="listbox"`/`option` without the whole APG combobox pattern.
- **An agent's answer is the response, not the rows.** `#answer()` returns `result.response` as the endpoint (or `transform`) gave it, so fields the element never draws (a product's `sku`, price) reach the agent. Errors are returned as `{ error }`, never thrown: WebMCP hands an agent nothing from a rejection.
- **`suggest` is for typing only.** `search()`, a submit, `sync-url` and an agent all use `api`; only the debounced `input` search reads `suggest`.
- **Empty fields never leave the form.** `#onFormData` strips them on the `formdata` event, which fires for the native submit and for every `new FormData(form)` here (requests, `sync-url`). Results links stay `?q=…`; do not reintroduce a hidden field that always has a value (put it in `api=`).
