# @browser.style/search

A site search box. `<ui-search>` wraps a native `<search>` landmark and a plain GET form, so it
works with no JavaScript: Enter submits to the form's `action=`, the results page. Give it `api=`
and the same form fields go to a JSON endpoint, and come back as a list of links under the field
or anywhere on the page. Light DOM, no Shadow DOM, no microdata of its own.

Demo: [`index.html`](index.html).

## Install

```bash
npm install @browser.style/search @browser.style/base
```

```html
<link rel="stylesheet" href="@browser.style/base/index.css">
<link rel="stylesheet" href="@browser.style/search/index.css">
<script type="module" src="@browser.style/search/index.js"></script>
```

The script is optional. Without it the form is still a working search form.

## Markup

```html
<ui-search api="/api/search" trigger="input" variant="bar popover" highlight>
  <search aria-label="Site">
    <form action="/search" method="get">
      <label for="site-q">Search the site</label>
      <input type="search" id="site-q" name="q" required minlength="3" maxlength="200"
             autocomplete="off" enterkeyhint="search">
      <button>Search</button>
    </form>
  </search>
</ui-search>
```

| Part | Rule |
|---|---|
| `<search>` | the landmark (implicit role `search`). Name it with `aria-label` when a page has more than one |
| `<form action method="get">` | `action` is the results page; it is what the page-level `SearchAction` names (§ Structured data) |
| `<label>` | always present. `variant="bar"` hides it visually, never from assistive tech |
| `<input type="search" name="q">` | the query. Its `name` is the query parameter, sent to `action` and to `api` alike |
| other form controls | filters (a `<select>`, radios, `<input type="hidden" name="culture">`). Every named field is sent |
| `<template data-search="item">` | optional, a child of `<ui-search>`: the row to draw per result (§ Your own row) |

The script adds a status line and a list inside the `<search>`, or inside `results=`'s element:

```html
<div data-search="panel">
  <p data-search="status" role="status">8 results for “sea”</p>
  <ol data-search="results">…</ol>
</div>
```

Write them yourself, server-side, and the script fills those instead.

## Attributes

| Attribute | Values | Default | What it does |
|---|---|---|---|
| `api` | URL | none | the JSON endpoint. Absent: no fetching, the form submits natively |
| `suggest` | URL | `api` | the endpoint for as-you-type searches only. Submit, `search()` and agents use `api` |
| `trigger` | `submit`, `input`, `input submit` | `submit` | `input`: search as you type. `submit`: search on Enter instead of submitting. Without `submit`, Enter submits the form to `action` |
| `min` | number | the input's `minlength`, else `3` | characters before a search runs |
| `debounce` | ms | `300` | pause after typing before an `input` search |
| `take` | number | `8` | sent as `take=`; the most results to draw |
| `variant` | `bar`, `popover` (token list) | none | `bar`: field and button joined, label visually hidden. `popover`: the panel floats under the field while the search has focus |
| `highlight` | boolean | off | marks the matched words in `<mark>` |
| `sync-url` | boolean | off | a `submit` search writes the form into the address (`?q=…`), and a page opened with `?q=…` fills the form and searches |
| `results` | id | inside `<search>` | where the panel goes. A results page puts it in the main content (§ Accessibility) |
| `label-loading` | text | `Searching…` | status while a request runs |
| `label-empty` | text, `{query}` | `No results for “{query}”` | status for zero results |
| `label-error` | text | `Search is not available right now.` | status when the request fails |
| `label-one`, `label-other` | text, `{count}` `{query}` | `{count} result(s) for “{query}”` | the result count |
| `label-zero`, `label-two`, `label-few`, `label-many` | text | `label-other` | the other CLDR plural categories, for languages that use them (`Intl.PluralRules` of the nearest `lang`) |

## Request

`GET {api}?q=…&{every other named field}&take={take}` with `Accept: application/json`. Query
parameters already in `api` (or `suggest`) are kept, so a value the visitor never changes, such as
`culture`, belongs there and not in a hidden field. A newer search aborts the one in flight; a late
answer to an old query is dropped.

Empty fields are left out of every request, the form's own native submit included, so a shared
results link reads `/search?q=sea` and not `/search?q=sea&type=`.

## Response

```json
{
  "total": 12,
  "mode": "hybrid",
  "terms": ["sleep", "sea"],
  "items": [
    { "name": "Masseria Lucia", "url": "/rentals/masseria-lucia/", "type": "Rental",
      "description": "A farmhouse ten minutes from the Adriatic.", "image": "/media/lucia.webp" }
  ]
}
```

| Field | Type | Required | Drawn as |
|---|---|---|---|
| `items` | array (or the whole response is the array) | yes | one row each |
| `items[].name` | string | yes | the link text |
| `items[].url` | string | yes | the link. Only `http:`, `https:` and relative URLs; anything else drops the row |
| `items[].description` | string | no | a line under the link |
| `items[].image` | string, or `{ "url": … }` | no | a thumbnail, `alt=""` (the link names the row) |
| `items[].type` | string | no | a small label above the link, and `data-type` on the row |
| `total` | number | no | the count in the status line; default `items.length` |
| `mode` | string | no | passed through in the event, e.g. `semantic`, `keyword`, `hybrid` |
| `terms` | string[] | no | the words to mark with `highlight`; default the query's words of three letters or more |
| anything else | any | no | never drawn; kept in `response` for the event, `search()` and agents |

A backend that answers in another shape is mapped with `transform` (below).

## Script API

| Member | Kind | What it does |
|---|---|---|
| `transform` | property, `(json, params) => response` | maps any JSON onto the response above; may be async |
| `search()` | method, returns `Promise<result \| null>` | runs the form's current query now, against `api`. `result` is `{ items, total, mode, terms, response }`: the normalised fields, plus `response`, the JSON as the endpoint (or `transform`) gave it |
| `clear()` | method | empties status and results, cancels what is in flight |
| `form` | getter | the wrapped `<form>` |

| Event | `detail` | When |
|---|---|---|
| `ui-search:results` | `{ query, params, items, total, mode, terms, response }` | after a response is drawn |
| `ui-search:error` | `{ query, error }` | the request failed or the JSON did not parse |

Both bubble and are composed.

| State | Where | Values |
|---|---|---|
| `data-state` | `<ui-search>` | `idle` `loading` `results` `empty` `error` |
| `aria-busy` | the results list | present while loading |

## Your own row

```html
<ui-search api="/api/search">
  <search>…</search>
  <template data-search="item">
    <li><a data-field="name"></a> <small data-field="type"></small></li>
  </template>
</ui-search>
```

| `data-field` | Written as |
|---|---|
| `name`, `description` | text (with `<mark>` when `highlight` is on) |
| `type` | text |
| `url` | `href` (an `<a>` without `href` gets the URL too) |
| `image` | `src`; the element is removed when the result has none |

An element whose field is empty is removed. Nothing is ever written as HTML.

## Keyboard

| Key | In the field | On a result |
|---|---|---|
| ArrowDown | first result | next result |
| ArrowUp | | previous result; from the first, back to the field |
| Escape | closes the results; a second Escape clears the field (native) | closes the results, focus back in the field |
| Enter | `submit` search, or the form submits to `action` | follows the link |
| Tab | the results are ordinary links in the tab order | |

## Tokens

| Token | Default | |
|---|---|---|
| `--ui-search-gap` | `var(--spacing-sm)` | field to button, thumbnail to text |
| `--ui-search-row-gap` | `var(--spacing-md)` | between results |
| `--ui-search-thumb` | `3.5rem` | thumbnail size |
| `--ui-search-thumb-radius` | `var(--radius-md)` | thumbnail corners and the row's focus ring |
| `--ui-search-c-muted` | `var(--color-text-muted)` | status, type and description ink |
| `--ui-search-mark-bg` / `--ui-search-mark-c` | `var(--color-mark)` / `var(--color-mark-text)` | highlighted words |
| `--ui-search-progress` | `var(--color-accent)` | the loading bar under the form |
| `--ui-search-panel-bg` | `var(--color-surface)` | `popover` panel |
| `--ui-search-panel-bdc` | `var(--color-border)` | `popover` panel border |
| `--ui-search-panel-max` | `70dvb` | `popover` panel height before it scrolls |
| `--ui-search-panel-shadow` | a soft drop shadow | `popover` panel |
| `--ui-search-radius` | `var(--input-radius)` | `popover` panel corners |

## Structured data

The component writes **no** microdata, on purpose:

| Rule | Why |
|---|---|
| No `WebSite` or `SearchAction` from the component | a site has one `WebSite` node. Google reads it for the site name and asks for the search action to sit **in that same node**, not in a second `WebSite` block. A widget that emitted its own would duplicate it on every page that has a search box |
| No `itemprop` inside `<ui-search>` | an `itemprop` attaches to the nearest ancestor `itemscope`. A box placed in a card, or in a detail page's `<article itemscope>`, would add a stray property to that Product or Article |
| No microdata on result rows | results are drawn by script, are not the page's subject, and a results page is `noindex` |

The site's one `WebSite` item carries the search, beside the content, as
[`ui/card/demo/schema.html`](../card/demo/schema.html) does. Its `urlTemplate` is the form's
`action` with the input's `name`:

```html
<div itemscope itemtype="https://schema.org/WebSite" hidden>
  <meta itemprop="name" content="Browser.style">
  <link itemprop="url" href="https://browser.style/">
  <div itemprop="potentialAction" itemscope itemtype="https://schema.org/SearchAction">
    <div itemprop="target" itemscope itemtype="https://schema.org/EntryPoint">
      <meta itemprop="urlTemplate" content="https://browser.style/search?q={search_term_string}">
    </div>
    <div itemprop="query-input" itemscope itemtype="https://schema.org/PropertyValueSpecification">
      <link itemprop="valueRequired" href="https://schema.org/True">
      <meta itemprop="valueName" content="search_term_string">
    </div>
  </div>
</div>
```

| Field | Must match |
|---|---|
| `name` | the site name used everywhere else (`og:site_name`, an article's `publisher`) |
| `url` | the canonical home page |
| `urlTemplate` | `action` + `?` + the input's `name` + `={search_term_string}` |
| `valueName` | the placeholder in `urlTemplate`, not a form field |

Google retired the sitelinks search box on 2024-11-21 and says the `SearchAction` may stay; the
`WebSite` node itself still feeds site names, which Google needs on the **home page** only.
Agents and other consumers still read the action. For the browser's own address bar, add an
OpenSearch description (`<link rel="search" type="application/opensearchdescription+xml">`) on
every page.

## Agents (WebMCP)

WebMCP lets a browser's agent call a page's forms as tools. The attributes are the page's own,
on the form; the element only answers the agent.

```html
<form action="/search" method="get" toolname="search_site" toolautosubmit
      tooldescription="Search this site's pages and products. Returns name, URL, summary and type per hit.">
  <label for="site-q">Search the site</label>
  <input type="search" id="site-q" name="q" required minlength="3"
         toolparamdescription="What to look for, in words or a product name.">
  <button>Search</button>
</form>
```

| Attribute | On | What it does |
|---|---|---|
| `toolname` | `<form>` | the tool's name. **One per page**: two forms with one name collide, so a page with a header box and a results-page box names one of them |
| `tooldescription` | `<form>` | what the tool does and what it returns, for the agent |
| `toolautosubmit` | `<form>` | the agent's call runs without the person pressing Search |
| `toolparamdescription` | a field | that parameter's description; without it, the field's label |

Every named field is a parameter of the tool, so a `<select name="type">` filter becomes its `type`.

| An agent submits | The element |
|---|---|
| with `api` set | answers with `event.respondWith()` instead of navigating: `response`, every field the endpoint sent (a product's `sku` and price included), not only the ones it draws. The results are drawn too, so the person sees what the agent found |
| with no `api` | does nothing: the browser submits to `action` |
| a query under `min` | answers `{ "error": "The query needs at least 3 characters." }` |
| and the request fails | answers `{ "error": label-error }`. Errors are values: an agent gets nothing from a thrown error |

While an agent fills the form, `:tool-form-active` draws a dashed ring around it in
`--ui-search-progress`. Browsers without WebMCP ignore all of it. As of October 2026 Chrome and Edge
ship WebMCP as an origin trial.

## Accessibility

- `<search>` maps to the `search` landmark. With more than one on a page, give each an `aria-label` (and do not repeat the word "search": the role is announced).
- A visible label, or `variant="bar"`'s visually hidden one. Never a placeholder alone.
- The status line is `role="status"` (polite) and is in the DOM before the first count is written into it; focus stays in the field.
- Results are links, not an ARIA combobox: Tab reaches them, and the arrow keys are a shortcut on top.
- Quick results may sit inside `<search>`. A results page's results belong in the main content, outside it: `results="…"`.
- No single-character shortcut (`/`) to focus the field; WCAG 2.1.4 would require a way to turn it off.
- The loading bar stops under `prefers-reduced-motion`.

## Choosing a trigger

| Backend | `trigger` | Why |
|---|---|---|
| keyword index (Lucene, Examine) | `input` | cheap per request; type-ahead reads well |
| semantic (embeddings) | `submit` | every new query is an embedding call, and a half-typed sentence means little. A backend that offers both answers typing with keywords and Enter with meaning: `suggest` for the keyword URL, `api` for the other |
| static JSON | `input` with `transform` | as on the demo page |

## Browser support

Chrome 150+ and Safari 26.5+, the repository's baseline. Uses `<search>`, `:has()`, CSS nesting
and `Intl.PluralRules`.
