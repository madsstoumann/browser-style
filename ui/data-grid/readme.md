# ui-datagrid

`<ui-datagrid>` is a Custom Element, you can wrap around an existing `<table>`, or fill with data through the `src`-attribute, using either a stringified object or a URL to an endpoint.

With an existing `<table>`:

```html
<ui-datagrid
  itemsperpage="20"
  searchable>
  <table>
    <thead>...</thead>
    <tbody>...</tbody>
  </table>
</ui-datagrid>
```

With `src`:

```html
<ui-datagrid
  itemsperpage="20"
  searchable
  src="https://endpoint.com/">
</ui-datagrid>
```

With `src` **and** some default `<table>`-styles:

```html
<ui-datagrid
  itemsperpage="20"
  searchable
  src="https://endpoint.com/">
  <table
    class="my-table-classes">
  </table>
</ui-datagrid>
```

From JavaScript:

```js
const grid = document.createElement('ui-datagrid');
grid.setAttribute('itemsperpage', 20);
grid.setAttribute('searchable', '');
grid.setAttribute('src', 'https://endpoint.com');
document.body.append(grid);
```

With `src` containing JSON, as attribute:

```html
<ui-datagrid
  src='{"tbody":[{"id":"1","firstName":"Bruce","lastName":"Wayne","knownAs":"Batman","place":"GothamCity"},{"id":"2","firstName":"Clark","lastName":"Kent","knownAs":"Superman","place":"Metropolis"}],"thead":[{"field":"id","hidden":true,"label":"ID","uid":true},{"field":"firstName","hidden":false,"label":"FirstName","uid":false},{"field":"lastName","hidden":false,"label":"LastName","uid":false},{"field":"knownAs","hidden":false,"label":"KnownAs","uid":false},{"field":"place","hidden":false,"label":"Place","uid":false}]}'>
  ...
</ui-datagrid>
```

From JavaScript:

```js
const obj = {
  thead: [...],
  tbody: [...]
}

const grid = document.createElement('ui-datagrid');
grid.setAttribute('src', JSON.stringify(obj));
document.body.append(grid);
```

## Table Data
If you're using an existing, inline `<table>` as data-source, you need to structure it with `<thead>` and `<tbody>`-tags. To keep it simple, `colspan` and `rowspan` -attributes are **not** allowed, and you can only use `<th>`-tags within `<tr>`’s in `<thead>` — and `<td>`-tags within `<tr>`s in `<tbody>`:

```html
<table>
  <thead>
    <tr>
      <th>First Name</th>
      <th>Last Name</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>Bruce</td>
      <td>Wayne</td>
    </tr>
  </tbody>
</table>
```

---

If you're using an **external** `src`, the endpoint must return an object with two properties, `tbody` and `thead`:

```json
{
  "tbody": [...],
  "thead": [...]
}
```

---

If you're using the `data`-attribute, the stringified object should return the same type of object as above, with two properties, `tbody` and `thead`:

```json
{
  "tbody": [...],
  "thead": [...]
}
```

### Column Definitions

`thead` is an array of objects with column definitions:

```json
{
  "thead": [
    {
      "field": "id",
      "formatter": "bold",
      "hidden": true,
      "label": "ID",
      "type": "number",
      "uid": true,
    },
    {
      "field": "firstname",
      "label": "First Name"
    },
  ]
}
```
`formatter` is optional, and refers to a cell formatting-method in the `formatters`-object. More on this [below](#formatters).

`hidden` is optional, and `false` by default.

`type` is "string" by default, and only required if you want to be able to sort the column by `number`.

`uid` is also optional — and only required, if `editable` is used.

---

If you're using an inline `<table>`, you can set these extra, optional properties as attributes:

```html
<tr>
  <th
    data-uid
    data-formatter="bold"
    data-type="number"
    hidden>
    ID
  </th>
  <th>
    First Name†
  </th>
</tr>
```

†) When using an inline `<table>`, headers are automatically converted to `camelCase`:

```json
{
  "field": "firstname",
  "label": "First Name"
},
```

### Row Data

`tbody` consists of objects with a property for each column:

```json
{
  "tbody": [
    {
      "id": "1",
      "firstname": "Bruce",
      "lastname": "Wayne",
    }
  ]
}
```

When using an inline `<table>`, this is simply like the markup in the beginning of this section, with one caveat:

If a column is `hidden`, each row for this column needs to be `hidden` as well:

```html
<thead>
  <tr>
    <th
      data-uid
      hidden>
      ID
    </th>
    <th>First Name</th>
  </tr>
</thead>
<tbody>
  <tr>
    <td hidden>1</td>
    <td>Bruce</td>
  </tr>
</tbody>

```

## Attributes

`<ui-datagrid>` can be configured through a bunch of attributes:

### editable
Boolean attribute. If present, the grid is editable — but **only** if at least one column has `"uid": true`

---

### itemsperpage
Numeric. Indicates the number of items on a page. If omitted, pagination is **not** used.

---

### searchable
Boolean attribute. If present, an `<input type="search">` is added _before_ the table, allowing for basic filtering.

> **NOTE:** See `searchterm` and `searchmethod` below.

---

### selectable
Boolean attribute. Allows selection of rows.

---

### src
String. The URL of an endpoint API, returning an object with `thead` and `tbody`-data.
`src` can also be a stringified object (json), see example at beginning of this document.

---

## Additional Attributes
The following attributes are mostly set by code, but can be set in HTML to preload the grid with specific settings. Attributes like `i18n` and `formatters` are objects. 

 `i18n` can be set as stringified objects in attributes, whereas `formatters` can only be set in code.

---

### debug
Boolean attribute. Log events and errors to console.

---

### density
Boolean attribute. Adds a density-buttons tot the actions-part of the bottom navigation, allowing to toggle between a compact and expanded state.

---

### exportable
Boolean attribute. Adds `CSV` and `JSON`-export-buttons tot the actions-part of the bottom navigation.

---

### formatters
Object. By default, cells are using a formatter, that simply returns the content. Thus you can, in principle, use HTML in the json with row data:

```json
"firstname": "<u>Bruce</u>",
```

A better approach is to use custom formatters, specified in the `formatters`-object:

```js
const formatters = {
  bold: (value) => `<strong>${value}</strong>`,
  email: (value) => `<a href="mailto:${value}">${value}</a>`,
  ...
}
```

Then, in the column definitions-object (`thead`), add the name of the formatter for a column:

```json
{
  "thead": [
    {
      "field": "email",
      "formatter": "email",
      "label": "Email address"
    }
  ]
}
```

`formatters` can **only** be set from script:

```js
grid.formatters = formatters;
```

---

### i18n
Object. To use `<ui-datagrid>` in a specific language, you can set an `i18n` (internationalization)-object for the current `lang`. 

You need an object with these properties, replacing `en` with your language-code :

```js
const i18n = {
  en: {
    all: 'All',
    endsWith: 'Ends with',
    equals: 'Equals',
    first: 'First',
    includes: 'Includes',
    last: 'Last',
    next: 'Next',
    noResult: 'No results',
    of: 'of',
    page: 'Page',
    prev: 'Previous',
    rowsPerPage: 'Rows',
    search: 'Filter Columns',
    selected: 'selected',
    startsWith: 'Starts with',
  }
}
```

Set it from JavaScript:

```js
grid.setAttribute('i18n', JSON.stringify(i18n))
```

You can also set it as an attribute:

```html
<ui-datagrid
  i18n='{"da":{"all":"Alle","next":"Næste","of":"af","page":"Side","prev":"Forrige","selected":"valgt","size":"Rækker per side"}}'>
  ...
</ui-datagrid>
```

Note the **single apostrophe** wrapping the attribute. This is necessary to encode the JSON correctly (in double quotes).

> **IMPORTANT:** If you set the `i18n`-attribute to another lang than `en`, you **must** set that lang as an attribute on `<ui-datagrid>` or on the `<html>`-element:

```html
<ui-datagrid lang="fr">...</ui-datagrid>
```

---

### lang
Standard HTML-attribute. If no `lang`-attribute is present, the code will look for the attribute on the `<html>`-tag, othwerise fallback to "en" (see i18n-section above).

---

### page
Numeric. Indicates the current page in a paginated result. This attribute is updated from the internal code, when changing pages — but can be set as an attribute in HTML to preload the grid on a specific page.

---

### pagesize
Array of numbers. Used for the "Page Size"-dropdown. 

A value corresponding to `itemsperpage` **must** exist in this array.

---

### printable
Boolean attribute. Adds a print-button to the actions-part of the navigation and allows `CTRL + P` to be used to trigger it. Prints the active table.

---

### searchmethod
String. Determines the way, search/filtering is applied. Used internally with the value "includes" by default.

Valid values are:

- "end"
- "equals"
- "includes"
- "start"

---

### searchterm
String. Used internally, when a user types something in the search-field. Can be set as an attribute in HTML to preload the grid with a specific searchterm.

---

### sortindex
Numeric. The column-index used for sorting (starting from `0` zero). Set by code, but can be set as an attribute in HTML to preload the grid with a specific column sorted.

---

### sortorder
Numeric. Sort Ascending (`0` zero) or Descending (`1` one)

---

### tableclass
String. If the grid is added from JavaScript, you can add style-classes to the internal `<table>`-element as a space-delimited string:

`my-table-class is-dark zebra-rows`

---

_Example:_

Load grid with pre-filled searchterm, first column sorted descending, showing second page of results:

```html
<ui-datagrid
  itemsperpage="5"
  page="1"
  sortindex="0"
  sortorder="1"
  searchterm="batman">
</ui-datagrid>
```

---

## Keyboard Shortcuts

### Navigation

The grid can be navigated by keyboard, using the [W3C standard for grids](https://www.w3.org/WAI/ARIA/apg/patterns/grid/), with some additions:

| Key Combination | Action |
| --- | --- |
| `Right Arrow` | Moves focus one cell to the right. If focus is on the right-most cell in the row, focus does not move. |
| `Left Arrow` | Moves focus one cell to the left. If focus is on the left-most cell in the row, focus does not move. |
| `Down Arrow` | Moves focus one cell down. If focus is on the bottom cell in the column, focus does not move. |
| `Up Arrow` | Moves focus one cell up. If focus is on the top cell in the column, focus does not move. |
| `Page Down` | Moves focus down an author-determined number of rows, typically scrolling so the bottom row in the currently visible set of rows becomes one of the first visible rows. If focus is in the last row of the grid, focus does not move. |
| `Page Up` | Moves focus up an author-determined number of rows, typically scrolling so the top row in the currently visible set of rows becomes one of the last visible rows. If focus is in the first row of the grid, focus does not move. |
| `Home` | Moves focus to the first cell in the row that contains focus. |
| `End` | Moves focus to the last cell in the row that contains focus. |
| `Cmd/Ctrl + Home` | Moves focus to the first cell in the first row. |
| `Cmd/Ctrl + End` | Moves focus to the last cell in the last row. |
| `Shift + Home` | Moves focus to the first row in the column that contains focus. |
| `Shift + End` | Moves focus to the last row in the column that contains focus. |

### Print
| Key Combination | Action |
| --- | --- |
| `Cmd/Ctrl + p` | If `printable` is set, printing can be triggered with this. |

### Headers cells only

| Key Combination | Action |
| --- | --- |
| `Space` | Sorts column — or, if table is `selectable` — the first column toggles row-selection |
| `Shift + Arrow Left` | Resize column: shrink. |
| `Shift + Arrow Right` | Resize column: expand. |

### Row cells only

| Key Combination | Action |
| --- | --- |
| `Space` | If table is `selectable` — toggles row-selection in first column |
| `Shift + Space` | Toggles selection of current row |
| `Cmd/Ctrl + a` | Selects all visible cells |
| `Cmd/Ctrl + Shift + i` | Inverts selection |

---

## Events: Emitting

### dg:cellchange
Triggered when a cell has been edited.

### dg:pagechange
Triggered when a page change occurs.

### dg:row
Returns the current/active row, triggered from `dg:getrow`.

### dg:selected
Returns an array of selected objects, triggered from `dg:getselected`.

### dg:selection
Triggered when a selection occurs.

## Events: Recieving

### dg:appenddata

### dg:clearselected
Clears selection and emits `dg:selected`.

### dg:getrow
Emits `dg:selected`.

### dg:getselected
Emits `dg:selected`.