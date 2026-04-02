# Getting Started

This guide will help you set up and configure your first DataGrid component.

## Installation

### Package Manager

Install DataGrid and its peer dependencies:

```bash
npm install @browser.style/data-grid \
  @browser.style/base \
  @browser.style/icon \
  @browser.style/table \
  @browser.style/print-preview \
  @browser.style/table-expand
```

### Import in Your Project

```javascript
// Import the component
import '@browser.style/data-grid';

// Import styles
import '@browser.style/data-grid/index.css';
import '@browser.style/base';
import '@browser.style/icon';
import '@browser.style/table';
```

### CDN Usage

For quick prototyping or simple projects:

```html
<!DOCTYPE html>
<html>
<head>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@browser.style/base/index.css">
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@browser.style/table/index.css">
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@browser.style/data-grid/index.css">
</head>
<body>
  <data-grid id="myGrid"></data-grid>

  <script type="module">
    import 'https://cdn.jsdelivr.net/npm/@browser.style/data-grid/index.js';
    
    const grid = document.getElementById('myGrid');
    grid.data = [
      { id: 1, name: 'Alice', age: 30 },
      { id: 2, name: 'Bob', age: 25 }
    ];
  </script>
</body>
</html>
```

## Basic Examples

### Example 1: Simple Table

The simplest way to use DataGrid is with an inline `<table>`:

```html
<data-grid>
  <table>
    <thead>
      <tr>
        <th>Name</th>
        <th>Email</th>
        <th>City</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>Alice Johnson</td>
        <td>alice@example.com</td>
        <td>Seattle</td>
      </tr>
      <tr>
        <td>Bob Smith</td>
        <td>bob@example.com</td>
        <td>Portland</td>
      </tr>
    </tbody>
  </table>
</data-grid>
```

### Example 2: With Pagination

Add pagination by setting `itemsperpage`:

```html
<data-grid itemsperpage="10">
  <!-- table content -->
</data-grid>
```

You can customize the page size options:

```html
<data-grid 
  itemsperpage="25" 
  pagesize="10,25,50,100">
  <!-- table content -->
</data-grid>
```

### Example 3: Searchable and Selectable

Enable search and row selection:

```html
<data-grid 
  itemsperpage="25" 
  searchable 
  selectable>
  <!-- table content -->
</data-grid>
```

### Example 4: Full Featured

Enable all major features:

```html
<data-grid 
  itemsperpage="25"
  pagesize="10,25,50,100"
  searchable
  selectable
  exportable
  printable
  density
  stickycol>
  <!-- table content -->
</data-grid>
```

## Loading Data

### Method 1: From a URL

Load data from an API endpoint:

```html
<data-grid 
  data="https://api.example.com/users"
  itemsperpage="25"
  searchable>
</data-grid>
```

The endpoint should return JSON in this format:

```json
{
  "thead": [
    { "field": "id", "label": "ID", "type": "number" },
    { "field": "name", "label": "Name", "type": "string" },
    { "field": "email", "label": "Email", "type": "string" }
  ],
  "tbody": [
    { "id": 1, "name": "Alice", "email": "alice@example.com" },
    { "id": 2, "name": "Bob", "email": "bob@example.com" }
  ]
}
```

### Method 2: Via JavaScript

Set data programmatically:

```javascript
const grid = document.querySelector('data-grid');

// Simple array of objects
grid.data = [
  { id: 1, name: 'Alice', email: 'alice@example.com', city: 'Seattle' },
  { id: 2, name: 'Bob', email: 'bob@example.com', city: 'Portland' },
  { id: 3, name: 'Carol', email: 'carol@example.com', city: 'Austin' }
];
```

The component automatically infers thead structure from the data.

### Method 3: Custom thead/tbody

Provide explicit thead configuration:

```javascript
grid.data = {
  thead: [
    { 
      field: 'id', 
      label: 'User ID', 
      type: 'number',
      key: true,  // Use as unique identifier
      hidden: false
    },
    { 
      field: 'name', 
      label: 'Full Name', 
      type: 'string',
      sortable: true
    },
    { 
      field: 'email', 
      label: 'Email Address', 
      type: 'string',
      formatter: 'email'  // Apply custom formatter
    },
    {
      field: 'salary',
      label: 'Salary',
      type: 'currency',
      sortable: true
    }
  ],
  tbody: [
    { id: 1, name: 'Alice Johnson', email: 'alice@example.com', salary: 75000 },
    { id: 2, name: 'Bob Smith', email: 'bob@example.com', salary: 68000 }
  ]
};
```

## Event Handling

Listen to grid events:

```javascript
const grid = document.querySelector('data-grid');

// Component loaded and ready
grid.addEventListener('dg:loaded', () => {
  console.log('Grid is ready');
});

// Row selection changed
grid.addEventListener('dg:selection', (e) => {
  console.log('Selected row keys:', e.detail);
});

// Cell edited
grid.addEventListener('dg:cellchange', (e) => {
  const { field, newValue, oldValue, row } = e.detail;
  console.log(`${field} changed from ${oldValue} to ${newValue}`);
  
  // Save to server
  fetch(`/api/users/${row.id}`, {
    method: 'PATCH',
    body: JSON.stringify({ [field]: newValue })
  });
});

// Row clicked
grid.addEventListener('dg:rowclick', (e) => {
  const { row, rowIndex } = e.detail;
  console.log('Clicked row:', row);
});
```

## Custom Formatters

Add custom formatters for specific column types:

```javascript
const grid = document.querySelector('data-grid');

grid.formatters = {
  // Format email as clickable link
  email: (value) => `<a href="mailto:${value}">${value}</a>`,
  
  // Format currency
  currency: (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(value);
  },
  
  // Format date
  date: (value) => {
    return new Date(value).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  },
  
  // Badge formatter
  status: (value) => {
    const colors = {
      active: 'green',
      pending: 'orange',
      inactive: 'gray'
    };
    return `<span class="badge badge--${colors[value]}">${value}</span>`;
  },
  
  // Access full row data
  fullName: (value, row) => {
    return `${row.firstName} ${row.lastName}`;
  }
};
```

Then reference formatters in thead:

```javascript
grid.data = {
  thead: [
    { field: 'email', label: 'Email', formatter: 'email' },
    { field: 'salary', label: 'Salary', formatter: 'currency' },
    { field: 'joinDate', label: 'Joined', formatter: 'date' },
    { field: 'status', label: 'Status', formatter: 'status' }
  ],
  tbody: [...]
};
```

## Internationalization

Support multiple languages:

```javascript
const grid = document.querySelector('data-grid');

grid.i18n = {
  fr: {
    all: 'Tout',
    next: 'Suivant',
    prev: 'Précédent',
    page: 'Page',
    of: 'de',
    rowsPerPage: 'Lignes par page',
    selected: 'sélectionnés',
    search: 'Filtrer les colonnes',
    noResult: 'Aucun résultat',
    first: 'Premier',
    last: 'Dernier'
  },
  es: {
    all: 'Todos',
    next: 'Siguiente',
    prev: 'Anterior',
    page: 'Página',
    of: 'de',
    rowsPerPage: 'Filas por página',
    selected: 'seleccionados',
    search: 'Filtrar columnas',
    noResult: 'Sin resultados',
    first: 'Primero',
    last: 'Último'
  }
};

grid.setAttribute('lang', 'fr');
```

Or set via HTML:

```html
<data-grid 
  lang="fr"
  i18n='{"fr":{"all":"Tout","next":"Suivant","prev":"Précédent"}}'>
</data-grid>
```

## Next Steps

Now that you have a basic understanding:

- [Attributes Reference](attributes.md) - All available attributes
- [Architecture](architecture.md) - Component design and data flow
- [Events](events.md) - Complete event documentation
- [Configuration](configuration.md) - Advanced configuration options
- [Configuration](configuration.md) - Formatters and custom rendering
