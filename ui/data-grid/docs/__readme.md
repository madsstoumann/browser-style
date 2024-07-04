
# Data Grid Custom Element

Welcome to the Data Grid Custom Element documentation! This guide will help you implement and use the `<data-grid>` custom element in your projects. Whether you're wrapping an existing `<table>` or setting data programmatically, we've got you covered.

## Introduction

`<data-grid>` is a powerful and flexible custom element designed to enhance HTML tables with additional functionality such as sorting, pagination, searching, and selection. You can use it by either wrapping it around an existing `<table>` element or by providing data through attributes or JavaScript.

## Features

- **Sorting**: Easily sort table columns.
- **Pagination**: Navigate through large datasets with pagination controls.
- **Searching**: Filter table data based on search terms.
- **Selection**: Select rows with checkboxes.
- **Editable**: Enable cell editing for quick data updates.
- **Exportable**: Export table data to CSV or JSON.
- **Printable**: Print the table directly from the browser.
- **Customizable**: Customize the appearance and behavior with attributes and configuration options.

## Usage Examples

### Basic Usage

Wrap an existing `<table>` with `<data-grid>`:

```html
<data-grid itemsperpage="5" page="0" selectable>
  <table>
    <thead>
      <tr><th>ID</th><th>First Name</th><th>Last Name</th><th>Email</th></tr>
    </thead>
    <tbody>
      <tr><td>1</td><td>John</td><td>Doe</td><td>john@example.com</td></tr>
      <tr><td>2</td><td>Jane</td><td>Doe</td><td>jane@example.com</td></tr>
    </tbody>
  </table>
</data-grid>
```

### Setting Data Programmatically

You can set data programmatically using the `data` attribute or via JavaScript:

```html
<data-grid id="myGrid" itemsperpage="5" page="0" selectable></data-grid>

<script>
  const myGrid = document.getElementById('myGrid');
  myGrid.data = [
    { id: 1, name: 'John Doe', age: 30, email: 'john@example.com' },
    { id: 2, name: 'Jane Doe', age: 25, email: 'jane@example.com' }
  ];
  myGrid.setAttribute('items', '10');
</script>
```

### Using Configuration

Customize the table headers and other configurations:

```html
<data-grid id="customGrid" itemsperpage="5" page="0" selectable></data-grid>

<script>
  const customGrid = document.getElementById('customGrid');
  customGrid.config = {
    thead: [
      { field: 'id', label: 'ID', uid: true },
      { field: 'name', label: 'Name' },
      { field: 'age', label: 'Age' },
      { field: 'email', label: 'Email', formatter: 'email' }
    ]
  };
  customGrid.data = [
    { id: 1, name: 'John Doe', age: 30, email: 'john@example.com' },
    { id: 2, name: 'Jane Doe', age: 25, email: 'jane@example.com' }
  ];
</script>
```

## Events

`<data-grid>` emits several custom events that you can listen for to handle various interactions:

- **dg:append**: Append data to the end of the table.
- **dg:cellchange**: A cell has been edited.
- **dg:clearselected**: Clear all selected rows.
- **dg:pagechange**: The page has changed.
- **dg:rowclick**: A row has been clicked.
- **dg:selection**: A selection or deselection has been made.
- **dg:getselected**: Get selected rows, triggers `dg:selected`.
- **dg:selected**: Get all selected rows.
- **dg:getrow**: Get row data, triggers `dg:row`.
- **dg:row**: Row data has been retrieved.

### Event Usage Example

```html
<script>
  const grid = document.getElementById('grid');

  grid.addEventListener('dg:pagechange', (e) => { console.log('dg:pagechange', e.detail); });
  grid.addEventListener('dg:cellchange', (e) => { console.log('dg:cellchange', e.detail); });
  grid.addEventListener('dg:selection', (e) => { console.log('dg:selection', e.detail); });
  grid.addEventListener('dg:row', (e) => { console.log('dg:row', e.detail); });
  grid.addEventListener('dg:rowclick', (e) => { console.log('dg:rowclick', e.detail); });
  grid.addEventListener('dg:selected', (e) => { console.log('dg:selected', e.detail); });
</script>
```

## Conclusion

`<data-grid>` is a versatile and powerful custom element that can greatly enhance the functionality of your HTML tables. Whether you're working with existing tables or dynamically setting data, it offers a range of features to help you manage and display your data effectively.

Happy coding!
