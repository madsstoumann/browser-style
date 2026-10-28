# Form widget: Spreadsheet grid

`ui.widget: "data-grid"` on a repeating group (`type: "list"`) draws an editable [`<data-grid>`](../../data/grid/) in [`<form-flow>`](../../form-flow/). The field type is `grid/sheet` ("Spreadsheet").

```html
<form-flow form="…" packages="/ui/form-widgets/grid/types.json"></form-flow>
```

Each column is one of the group's `items.properties`, the first column is a running row number, and **+ Add row** appends a row. Cells are text: numbers are read back as numbers (a decimal comma is accepted), yes/no from `yes`, `true`, `1` or `x`, choices from their value or label. The engine checks every row exactly as it checks the built-in table (types, required, ranges), so the answers are the same whichever control typed them.

The grid writes cells as HTML, so the adapter escapes everything before it is shown. `<data-grid>` is light DOM; the adapter adds its stylesheets (`ui/table`, `ui/data/grid`) to the page, or to the shadow root of an embedded form, the first time it is used.
