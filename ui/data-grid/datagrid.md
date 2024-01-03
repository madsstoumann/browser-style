## Attributes


editable
itemsperpage
page
searchable
searchterm
selectable
sortindex
sortorder
src

## Events
cellValueChanged
pagechange
rowSelected
sortingChanged


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