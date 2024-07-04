
# UI DataGrid Keyboard Shortcuts

## Navigation

The grid can be navigated by keyboard, using the [W3C standard for grids](https://www.w3.org/WAI/ARIA/apg/patterns/grid/), with some additions:

| Key Combination       | Action                                                                                                            |
|-----------------------|-------------------------------------------------------------------------------------------------------------------|
| `Right Arrow`         | Moves focus one cell to the right. If focus is on the right-most cell in the row, focus does not move.            |
| `Left Arrow`          | Moves focus one cell to the left. If focus is on the left-most cell in the row, focus does not move.              |
| `Down Arrow`          | Moves focus one cell down. If focus is on the bottom cell in the column, focus does not move.                     |
| `Up Arrow`            | Moves focus one cell up. If focus is on the top cell in the column, focus does not move.                          |
| `Page Down`           | Moves focus down an author-determined number of rows, typically scrolling so the bottom row in the currently visible set of rows becomes one of the first visible rows. If focus is in the last row of the grid, focus does not move. |
| `Page Up`             | Moves focus up an author-determined number of rows, typically scrolling so the top row in the currently visible set of rows becomes one of the last visible rows. If focus is in the first row of the grid, focus does not move. |
| `Home`                | Moves focus to the first cell in the row that contains focus.                                                     |
| `End`                 | Moves focus to the last cell in the row that contains focus.                                                      |
| `Cmd/Ctrl + Home`     | Moves focus to the first cell in the first row.                                                                   |
| `Cmd/Ctrl + End`      | Moves focus to the last cell in the last row.                                                                     |
| `Shift + Home`        | Moves focus to the first row in the column that contains focus.                                                   |
| `Shift + End`         | Moves focus to the last row in the column that contains focus.                                                    |

## Print

| Key Combination   | Action                                 |
|-------------------|----------------------------------------|
| `Cmd/Ctrl + p`    | If `printable` is set, printing can be triggered with this. |

## Header Cells Only

| Key Combination       | Action                                                                                                            |
|-----------------------|-------------------------------------------------------------------------------------------------------------------|
| `Space`               | Sorts column — or, if table is `selectable` — the first column toggles row-selection                              |
| `Shift + Arrow Left`  | Resize column: shrink.                                                                                           |
| `Shift + Arrow Right` | Resize column: expand.                                                                                           |

## Row Cells Only

| Key Combination       | Action                                                                                                            |
|-----------------------|-------------------------------------------------------------------------------------------------------------------|
| `Space`               | If table is `selectable` — toggles row-selection in first column                                                 |
| `Shift + Space`       | Toggles selection of current row                                                                                  |
| `Cmd/Ctrl + a`        | Selects all visible cells                                                                                        |
| `Cmd/Ctrl + Shift + i`| Inverts selection                                                                                                |
