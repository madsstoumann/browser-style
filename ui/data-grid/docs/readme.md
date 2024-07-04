
# UI Data Grid

`<ui-datagrid>` is a Custom Element that you can wrap around an existing `<table>`, or fill with data through the `data` attribute, using either a stringified object or a URL to an endpoint.

## Table of Contents
- [Introduction](#introduction)
- [Basic Usage](#basic-usage)
- [Table Data](#table-data)
- [Keyboard Navigation](keyboard-shortcuts.md)
- [Events](events.md)
- [Attributes](attributes.md)
- [Data Management](data.md)
- [Advanced Usage](advanced.md)

## Introduction
The `<ui-datagrid>` component is designed to provide a rich data grid experience with support for pagination, sorting, searching, and inline editing. It can be used with an existing HTML table or populated with data via JavaScript.

## Basic Usage

### Wrapping an Existing Table
```html
<ui-datagrid
  itemsperpage="20"
  searchable>
  <table>
    <thead>
      <!-- Table Headers -->
    </thead>
    <tbody>
      <!-- Table Body -->
    </tbody>
  </table>
</ui-datagrid>
```

### Using the `data` Attribute with a URL
```html
<ui-datagrid
  itemsperpage="20"
  searchable
  data="https://endpoint.com/">
</ui-datagrid>
```

### Using the `data` Attribute with JSON Data
```html
<ui-datagrid
  itemsperpage="20"
  searchable
  data='{"tbody":[{"id":"1","firstName":"Bruce","lastName":"Wayne","knownAs":"Batman","place":"GothamCity"},{"id":"2","firstName":"Clark","lastName":"Kent","knownAs":"Superman","place":"Metropolis"}],"thead":[{"field":"id","hidden":true,"label":"ID","uid":true},{"field":"firstName","hidden":false,"label":"FirstName","uid":false},{"field":"lastName","hidden":false,"label":"LastName","uid":false},{"field":"knownAs","hidden":false,"label":"KnownAs","uid":false},{"field":"place","hidden":false,"label":"Place","uid":false}]}'>
</ui-datagrid>
```

### From JavaScript
```js
const grid = document.createElement('ui-datagrid');
grid.setAttribute('itemsperpage', 20);
grid.setAttribute('searchable', '');
grid.setAttribute('data', 'https://endpoint.com');
document.body.append(grid);
```

## Table Data
If you're using an existing, inline `<table>` as data-source, you need to structure it with `<thead>` and `<tbody>` tags. To keep it simple, `colspan` and `rowspan` attributes are **not** allowed, and you can only use `<th>` tags within `<tr>`’s in `<thead>` — and `<td>` tags within `<tr>`s in `<tbody>`:

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

If you're using an **external** `data` attribute, the endpoint must return an object with two properties, `tbody` and `thead`:

```json
{
  "tbody": [...],
  "thead": [...]
}
```

If you're using the `data` attribute, the stringified object should return the same type of object as above, with two properties, `tbody` and `thead`:

```json
{
  "tbody": [...],
  "thead": [...]
}
```

## Keyboard Navigation
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

## Events
Refer to [events.md](events.md) for a detailed description of events emitted and received by the grid.

## Attributes
Refer to [attributes.md](attributes.md) for a detailed description of all attributes available for `<ui-datagrid>`.

## Data Management
Refer to [data.md](data.md) for a detailed description of how to manage data in `<ui-datagrid>`.

## Advanced Usage
Refer to [advanced.md](advanced.md) for advanced usage examples and customizations.
