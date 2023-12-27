# table
The table component 

---

## Structure

A table should contain a `data-blok="table"`-attribute, a `<thead>`-tag with a single row (`<tr>`) of `<th>`-cells, and a single `<tbody>`-tag with rows (`<tr>`) of `<td>`-cells:

```html
<table data-blok="table">
  <thead></thead>
  <tbody></tbody>
</table>
```

The `table` should be wrapped in an element with a `data-blok="table-inner"`-attribute.  
The outer element is necessary for overflow-scrolling, but can be omitted if not needed.

```html
<div data-blok="table-inner">
  <table data-blok="table">...</table>
</div>
```

If pagination, search, sorting or row-density is used, add an *additional* outer wrapper:

```html
<div data-blok="table-outer">
  <div data-blok="table-inner">
  <table data-blok="table">...</table>
</div>
```

The **outermost** element should contain a `data-table-param`-attribute:

```html
<div data-blok="table-outer" data-table-param="PARAMETERS">
  ...
</div>
```

---

## Parameters
Parameters are added as space-separated entries in the `data-table-param`-attribute.

- `bdrscol`. Adds `border-radius` to columns (need col-spacing).
- `bdrsrow`. Adds `border-radius` to rows (need row-spacing).
- `bdrstable`. Adds `border-radius` to “table”: first and last cells of first and last rows.
- `density`. Adds density-control to table.
- `editable`. Allow table to be edited.
- `exportcsv`. Export table-data to CSV.
- `exportjson`. Export table-data to JSON.
- `headborder`. `<thead>` uses same borders as `<tbody>`.
- `hideempty`. Hides empty cells.
- `hovercell`. Adds hover to `<tbody>`-cells.
- `hovercol`. Adds hover to `<tbody>`-columns.
- `hoverrow`. Adds hover to `<tbody>`-rows.
- `noinlineborder`. Hides inline borders from columns, keeps first and last.
- `resizable`. JavaScript-hook for making columns resizable.
- `searchable`. JavaScript-hook for making the table searchable.
- `selectable`. JavaScript-hook for making rows selectable. Wrapper-element should be a `<form>`.
- `sortable`. JavaScript-hook for making columns sortable.
- `stickycol`. Makes first column sticky.
- `stickyrow`. Makes `<thead>` sticky.
- `zebracol`. Adds zebra-styling to columns.
- `zebrarow`. Adds zebra-styling to rows.

*Example:*
```html
<div data-blok="table-outer" data-table-param="zebrarow stickyrow">
  ...
</div>
```

---

## Alignment, Display and Width

Each column has three *CSS Custom Properties*, to control `display`, `text-align` and `width`:

- `--cd[INDEX]`. Display, defaults to `table-cell`.
- `--ca[INDEX]`. Text-align, defaults to `inital`.
- `--cw[INDEX]`. Width. Defaults to `initial`.

The propeties should be set/modified on the `<table>` or outermost element.

```css
.your-table {
  --cd1: none; /* first column will not be displayed */
  --ca4: right; /* fourth column will have text aligned right */
  --cw2: 50%; /* second column will be 50% wide */
}
```

---

## Column Groups

On manual tables, add `<colgroup>` and `<col>`-tags immediately after the `<table>`-opening tag, if you want to style columns. Example, on a table with **four** columns:

```html
<table data-blok="table>
  <colgroup>
    <col>
    <col>
    <col>
    <col>
  </colgroup>
  <thead>...</thead>
  <tbody>...</tbody>
</table>
```

*Example: Highlight all cells in second column:*

```html
<colgroup>
  <col>
  <col style="background-color: deeppink;">
  <col>
  <col>
</colgroup>
```

Colgroups are added automatically on *dynamic tables*. To style these, use `nth()`-selectors.

*Example:*

```css
colgroup col:nth-of-type(2) {
  background-color: deeppink;
}
```

---

## Dynamic Tables
`data-table-fetch`

---

## Utility Classes

### `tbl--check`
Utility-class for setting a table-cell to a checkmark, often used in comparison-tables.

```html
<td><span class="tbl--check">✓</span></td>
```

If CSS does not load/fails, the unicode checkmark will be used.

### `tbl--cross`
Utility-class for setting a table-cell to a cross, often used in comparison-tables.

```html
<td><span class="tbl--cross">×</span></td>
```

If CSS does not load/fails, the unicode multiplication-x will be used.