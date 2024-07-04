
# Getting Data into `<data-grid>`

The `<data-grid>` custom element supports various ways to populate data. You can use the `data` attribute with a URL or JSON string, set the data programmatically using JavaScript, or wrap an existing inline `<table>` element.

## Using the `data` Attribute

You can set the `data` attribute to a URL or a JSON string that contains the data to be displayed in the grid.

### From a URL

When the `data` attribute is a URL, `<data-grid>` fetches the data from the provided endpoint.

```html
<data-grid data="https://api.example.com/data" itemsperpage="10" selectable searchable></data-grid>
```

### From a JSON String

You can also set the `data` attribute to a JSON string. This string should represent an object with `thead` and `tbody` properties.

```html
<data-grid data='{"thead":[{"field":"id","label":"ID"},{"field":"name","label":"Name"}],"tbody":[{"id":1,"name":"John Doe"},{"id":2,"name":"Jane Doe"}]}' itemsperpage="10" selectable searchable></data-grid>
```

## Using JavaScript

You can set the data programmatically using JavaScript by accessing the `data` property of the `<data-grid>` element.

### Example

```html
<script>
  const grid = document.getElementById('myGrid');
  const data = [
    { id: 1, name: 'John Doe', age: 30, email: 'john@example.com' },
    { id: 2, name: 'Jane Doe', age: 25, email: 'jane@example.com' },
    // More data...
  ];

  grid.data = data;
</script>
```

## Wrapping an Existing Inline `<table>`

You can also wrap an existing inline `<table>` element with `<data-grid>`. The table should have a `<thead>` and `<tbody>`.

### Example

```html
<data-grid itemsperpage="10" selectable searchable>
  <table>
    <thead>
      <tr>
        <th>ID</th>
        <th>Name</th>
        <th>Age</th>
        <th>Email</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>1</td>
        <td>John Doe</td>
        <td>30</td>
        <td>john@example.com</td>
      </tr>
      <tr>
        <td>2</td>
        <td>Jane Doe</td>
        <td>25</td>
        <td>jane@example.com</td>
      </tr>
      <!-- More rows... -->
    </tbody>
  </table>
</data-grid>
```

### Handling Hidden Columns

If a column is marked as `hidden`, the corresponding `<td>` elements in each row should also be hidden.

```html
<thead>
  <tr>
    <th hidden>ID</th>
    <th>Name</th>
    <th>Age</th>
    <th>Email</th>
  </tr>
</thead>
<tbody>
  <tr>
    <td hidden>1</td>
    <td>John Doe</td>
    <td>30</td>
    <td>john@example.com</td>
  </tr>
  <!-- More rows... -->
</tbody>
```

## Combining Methods

You can combine methods to initialize the grid with default data and then update it dynamically.

### Example

```html
<data-grid id="grid" itemsperpage="10" selectable searchable></data-grid>
<script>
  const grid = document.getElementById('grid');

  // Initial data
  const initialData = [
    { id: 1, name: 'John Doe', age: 30, email: 'john@example.com' },
    { id: 2, name: 'Jane Doe', age: 25, email: 'jane@example.com' },
  ];
  grid.data = initialData;

  // Fetch new data when needed
  async function fetchData() {
    const response = await fetch('https://api.example.com/data');
    const newData = await response.json();
    grid.data = newData;
  }

  // Example of updating data on some event
  document.getElementById('updateButton').addEventListener('click', fetchData);
</script>
```
