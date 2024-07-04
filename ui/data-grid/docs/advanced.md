
# Advanced Configuration

## Configuration Options

The `<data-grid>` component can be customized with various configuration options. These options can be set using attributes on the element or through JavaScript.

### Attributes

- `density`: Boolean attribute. Adds a density-button to the actions-part of the bottom navigation, allowing to toggle between a compact and expanded state.
- `debug`: Boolean attribute. Log events and errors to console.
- `editable`: Boolean attribute. If present, the grid is editable — but **only** if at least one column has `"uid": true`.
- `exportable`: Boolean attribute. Adds `CSV` and `JSON`-export-buttons to the actions-part of the bottom navigation.
- `itemsperpage`: Numeric. Indicates the number of items on a page. If omitted, pagination is **not** used.
- `printable`: Boolean attribute. Adds a print-button to the actions-part of the navigation and allows `CTRL + P` to be used to trigger it. Prints the active table.
- `searchable`: Boolean attribute. If present, an `<input type="search">` is added _before_ the table, allowing for basic filtering.
- `selectable`: Boolean attribute. Allows selection of rows.
- `src`: String. The URL of an endpoint API, returning an object with `thead` and `tbody`-data.
- `i18n`: Object. To use `<data-grid>` in a specific language, you can set an `i18n` (internationalization)-object for the current `lang`. See below for more details.
- `lang`: Standard HTML-attribute. If no `lang`-attribute is present, the code will look for the attribute on the `<html>`-tag, otherwise fallback to "en" (see i18n-section below).
- `page`: Numeric. Indicates the current page in a paginated result. This attribute is updated from the internal code, when changing pages — but can be set as an attribute in HTML to preload the grid on a specific page.
- `pagesize`: Array of numbers. Used for the "Page Size"-dropdown. A value corresponding to `itemsperpage` **must** exist in this array.
- `searchmethod`: String. Determines the way, search/filtering is applied. Used internally with the value "includes" by default. Valid values are: "end", "equals", "includes", "start".
- `searchterm`: String. Used internally, when a user types something in the search-field. Can be set as an attribute in HTML to preload the grid with a specific searchterm.
- `sortindex`: Numeric. The column-index used for sorting (starting from `0` zero). Set by code, but can be set as an attribute in HTML to preload the grid with a specific column sorted.
- `sortorder`: Numeric. Sort Ascending (`0` zero) or Descending (`1` one).
- `stickycol`: Boolean attribute. Adds a sticky header to the table.
- `tableclass`: String. If the grid is added from JavaScript, you can add style-classes to the internal `<table>`-element as a space-delimited string: `my-table-class is-dark zebra-rows`.

## Formatters

By default, cells are using a formatter that simply returns the content. You can use custom formatters to apply specific formatting to cell content.

### Built-in Formatters

- `bold`: Formats the cell content in bold.
- `email`: Formats the cell content as an email link.
- `semibold`: Formats the cell content in semi-bold.
- `gray`: Formats the cell content in gray color.

### Using Custom Formatters

Define custom formatters in JavaScript and assign them to the grid:

```js
const formatters = {
  bold: (value) => `<strong>${value}</strong>`,
  email: (value) => `<a href="mailto:${value}">${value}</a>`,
  semibold: (value) => `<b>${value}</b>`,
  gray: (value) => `<span class="c-gray">${value}</span>`,
};

grid.formatters = formatters;
```

Then, in the column definitions (`thead`), add the name of the formatter:

```json
{
  "field": "email",
  "formatter": "email",
  "label": "Email address"
}
```

## Internationalization (i18n)

To use `<data-grid>` in a specific language, you can set an `i18n` object for the current `lang`. 

### Example

```js
const i18n = {
  fr: {
    all: 'Tout',
    endsWith: 'Se termine par',
    equals: 'Égale',
    first: 'Premier',
    includes: 'Comprend',
    last: 'Dernier',
    next: 'Suivant',
    noResult: 'Aucun résultat',
    of: 'de',
    page: 'Page',
    prev: 'Précédent',
    rowsPerPage: 'Lignes par page',
    search: 'Filtrer les colonnes',
    selected: 'sélectionnés',
    startsWith: 'Commence par',
  },
};

grid.setAttribute('i18n', JSON.stringify(i18n));
grid.setAttribute('lang', 'fr');
```

You can also set it as an attribute:

```html
<ui-datagrid
  i18n='{"da":{"all":"Alle","next":"Næste","of":"af","page":"Side","prev":"Forrige","selected":"valgt","size":"Rækker per side"}}'>
</ui-datagrid>
```

> **Note:** If you set the `i18n` attribute to another lang than `en`, you **must** set that lang as an attribute on `<ui-datagrid>` or on the `<html>` element:

```html
<ui-datagrid lang="fr">...</ui-datagrid>
```

## Methods

The `<data-grid>` component provides several methods to interact with and manipulate the grid.

### `editBegin()`

Begins editing the active cell. This method is only applicable if the grid is editable.

### `editEnd(node)`

Ends editing the specified cell. This method should be called after editing a cell to save changes.

### `getObj(node)`

Retrieves the data object for the specified cell.

### `next()`

Navigates to the next page.

### `prev()`

Navigates to the previous page.

### `printTable()`

Prints the table. This method is only applicable if the grid is printable.

### `resizeColumn(index, value)`

Resizes the column at the specified index by the given value.

### `selectRows(rows, toggle = true, force = false)`

Selects the specified rows. If `toggle` is true, the selection state is toggled. If `force` is true, the selection state is forced.

### `setActive()`

Sets the active cell in the grid.

### Example Usage

```js
const grid = document.querySelector('ui-datagrid');

// Begin editing the active cell
grid.editBegin();

// End editing the specified cell
grid.editEnd(node);

// Get the data object for the specified cell
const data = grid.getObj(node);

// Navigate to the next page
grid.next();

// Navigate to the previous page
grid.prev();

// Print the table
grid.printTable();

// Resize the first column by 20 units
grid.resizeColumn(0, 20);

// Select the first row
grid.selectRows([grid.table.rows[1]]);
```
