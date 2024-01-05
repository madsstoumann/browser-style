# ui-datagrid

`<ui-datagrid>` is a Web Component, you can wrap around an existing `<table>`, or fill with `fetch`’ed data through the `src`-attribute.

## Attributes

| Property     | Description |
|--------------|-------------|
| editable     | Makes the datagrid editable [`boolean`] |
| itemsperpage | Number of rows per page [`number`] |
| searchable   | Adds search functionality [`boolean`] |
| selectable   | Allows for selection of rows [`boolean`] |
| src          | Fill with data from external `src` [`string`] |

### Examples

With existing `<table>`:

```html
<ui-datagrid itemsperpage="20" searchable>
  <table>
    <thead>...</thead>
    <tbody>...</tbody>
  </table>
</ui-datagrid>
```

With `src`:

```html
<ui-datagrid itemsperpage="20" searchable src="https://endpoint.com/">
</ui-datagrid>
```

With `src` and some default `<table>`-styles:

```html
<ui-datagrid itemsperpage="20" searchable src="https://endpoint.com/">
  <table class="my-table-classes"></table>
</ui-datagrid>
```

## Data Source
If you're using an existing table as data-source, you need to structure it with `<thead>` and `<tbody>`-tags. To keep it simple, `colspan` and `rowspan` -attributes are **not** allowed, and you can only use `<th>`-tags within `<tr>`’s in `<thead>` and `<td>`-tags within `<tr>`s in `<tbody>`:

```html
<table>
  <thead>
    <tr><th data-uid hidden><th>First Name</th><th>Last Name</th><th>AKA</th></tr>
  </thead>
  <tbody>
    <tr><td>1</td><td>Bruce</td><td>Wayne</td><td>Batman</td></tr>
  </tbody>
</table>
```

---

If you're using an external `src`, the endpoint must return an object with two properties, `tbody` and `thead`, each containing arrays:

```json
{
  "tbody": [],
  "thead": []
}
```

`thaed` consists of objects with column definitions:

```json
{
  "thead": [
    {
      "field": "firstname",
      "label": "First Name"
    },
    {
      "field": "lastname",
      "label": "Last Name",
    },
    {
      "field": "id",
      "label": "ID",
      "hidden": true,
      "id": true
    }
  ]
}
```

`hidden` is optional, and `false` by default.

`id` is also optional — and only required, if `editable` is used.

---

`tbody` consists of objects with a property for each column:

```json
{
  "tbody": [
    {
      "id": "id415265",
      "firstname": "Alexis",
      "lastname": "Minico",
    }
  ]
}
```

`id` is optional, and only required, if the `editable`-attribute has been set.

---

### Additional Attributes
The following attributes are mostly set by code, but can be set to preload with specific settings:

| Property   | Description |
|------------|-------------|
| debug      | Log events and errors to console |
| idcolumn   | Column-index of id |
| idhide     | Hide the column with id |
| page       | The current page number, start from `0` zero |
| searchterm | The term used in the search-functionality |
| sortindex  | The column-index used for sorting (starting from `0` zero) |
| sortorder  | Sort Ascending (`0` zero) or Descending (`1` one) |

---

_Example: Load with pre-filled searchterm, first column sorted descending, showing second page of results:_

```html
<ui-datagrid sortindex="0" sortorder="1" searchterm="batman" page="1" itemsperpage="5">
</ui-datagrid>
```

#### idcolumn
Used to specify the column-index holding the `id`, if using an existing `<table>` as data-source. Only needed if `editable` has been set.

---

## Events

### Emitting
- cellValueChanged
- pagechange
- rowSelected
- sortchange
- copy

### Recieving
- appendData
- clearSelection
- getSelected
- exportExcel
- exportJSON


## State


| Key          | Initial Value | Description |
|--------------|---------------| ----------- |
| cellIndex    | 0             | Column index of selected Cell |
| cols         | 0             | Number of columns |
| itemsPerPage | 10            | Items Per Page |
| page         | 0             | Current Page |
| pages        | 0             | Total number of pages |
| pageItems    | 0             | Items for *current* page |
| rowIndex     | 0             | Row Index of Active Cell |
| rows         | 0             | Total amount of rows in dataset |
| selected     | []            | Array of selected rows |
| sortIndex    | -1            | Column index of field to sort by |
| sortOrder    | 0             | 0: Ascending, 1: Descending |
| tbody        | []            | Array of Objects: Table Data |
| thead        | []            | Array of Column Definitions |


## Keyboard Navigation

https://www.w3.org/WAI/ARIA/apg/patterns/grid/

- `Right Arrow`: Moves focus one cell to the right. If focus is on the right-most cell in the row, focus does not move.
- `Left Arrow`: Moves focus one cell to the left. If focus is on the left-most cell in the row, focus does not move.
- `Down Arrow`: Moves focus one cell down. If focus is on the bottom cell in the column, focus does not move.
- `Up Arrow`: Moves focus one cell up. If focus is on the top cell in the column, focus does not move.
- `Page Down`: Moves focus down an author-determined number of rows, typically scrolling so the bottom row in the currently visible set of rows becomes one of the first visible rows. If focus is in the last row of the grid, focus does not move.
- `Page Up`: Moves focus up an author-determined number of rows, typically scrolling so the top row in the currently visible set of rows becomes one of the last visible rows. If focus is in the first row of the grid, focus does not move.
- `Home`: Moves focus to the first cell in the row that contains focus.
- `End`: Moves focus to the last cell in the row that contains focus.
- `Command/Control + Home`: Moves focus to the first cell in the first row.
- `CommandControl + End`: Moves focus to the last cell in the last row.
- `Shift + Home`: Moves focus to the first row in the column that contains focus
- `Shift + End`: Moves focus to the last row in the column that contains focus


- `Space`: If selected cell is a sortable header, sorts current column.
- `Shift + Space`: Selects current row
- `Command/Control + a`: Selects all visible cells
- `Command/Control + Shift + i`: Inverts selection

Headers
- `Shift + Arrow Left`: Resize column
- `Shift + Arrow Right`: Resize column