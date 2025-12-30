# Configuration

This document covers all configuration options for customizing DataGrid behavior.

## Settings Object

The `settings` object controls advanced behavior:

```javascript
grid.settings = {
  // External navigation mode
  externalNavigation: false,  // Let server handle pagination
  
  // Density options (compact, standard, comfortable)
  densityOptions: {
    small: { 
      label: 'Compact', 
      icon: 'densitySmall', 
      i18n: 'compact' 
    },
    medium: { 
      label: 'Standard', 
      icon: 'densityMedium', 
      i18n: 'standard' 
    },
    large: { 
      label: 'Comfortable', 
      icon: 'densityLarge', 
      i18n: 'comfortable' 
    }
  },
  
  // Current density
  density: 'medium',
  
  // Column display order
  displayOrder: ['id', 'name', 'email'],  // null = use thead order
  
  // Locale for sorting
  locale: 'en'  // Uses <html lang> if not set
};
```

## Formatters

Custom formatters transform cell values before display.

### Built-in Formatters

DataGrid includes these default formatters:

```javascript
{
  bold: (value) => `<strong>${value}</strong>`,
  semibold: (value) => `<b>${value}</b>`,
  gray: (value) => `<span class="c-gray">${value}</span>`,
  email: (value) => `<a href="mailto:${value}">${value}</a>`
}
```

### Custom Formatters

Define your own formatters:

```javascript
grid.formatters = {
  // Simple formatter
  uppercase: (value) => value.toUpperCase(),
  
  // With HTML
  badge: (value) => `<span class="badge">${value}</span>`,
  
  // Access full row data
  fullName: (value, row) => `${row.firstName} ${row.lastName}`,
  
  // Complex formatting
  currency: (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(value);
  },
  
  // Date formatting
  date: (value) => {
    const date = new Date(value);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  },
  
  // Conditional formatting
  status: (value) => {
    const colors = {
      active: 'green',
      pending: 'yellow',
      inactive: 'red'
    };
    const color = colors[value] || 'gray';
    return `<span class="status status--${color}">${value}</span>`;
  },
  
  // Image formatter
  avatar: (value, row) => {
    return `<img src="${value}" alt="${row.name}" class="avatar">`;
  },
  
  // Link formatter
  link: (value) => {
    return `<a href="${value}" target="_blank">View</a>`;
  },
  
  // Truncate long text
  truncate: (value) => {
    return value.length > 50 
      ? value.substring(0, 47) + '...' 
      : value;
  },
  
  // Boolean formatter
  boolean: (value) => {
    return value ? '✓' : '✗';
  },
  
  // Array formatter
  tags: (value) => {
    if (!Array.isArray(value)) return value;
    return value.map(tag => `<span class="tag">${tag}</span>`).join(' ');
  }
};
```

### Using Formatters

Reference formatters in thead:

```javascript
grid.data = {
  thead: [
    { field: 'name', label: 'Name', formatter: 'bold' },
    { field: 'email', label: 'Email', formatter: 'email' },
    { field: 'salary', label: 'Salary', formatter: 'currency' },
    { field: 'joinDate', label: 'Joined', formatter: 'date' },
    { field: 'status', label: 'Status', formatter: 'status' },
    { field: 'avatar', label: 'Avatar', formatter: 'avatar' }
  ],
  tbody: [...]
};
```

### Formatter Best Practices

**1. Return HTML Strings**
```javascript
// ✅ Good
formatter: (value) => `<strong>${value}</strong>`

// ❌ Bad (returns DOM node)
formatter: (value) => {
  const strong = document.createElement('strong');
  strong.textContent = value;
  return strong;
}
```

**2. Escape User Input**
```javascript
// ✅ Good
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

formatter: (value) => `<div>${escapeHtml(value)}</div>`

// ❌ Bad (XSS vulnerability)
formatter: (value) => `<div>${value}</div>`
```

**3. Handle Null/Undefined**
```javascript
// ✅ Good
formatter: (value) => {
  if (value == null) return '';
  return value.toUpperCase();
}

// ❌ Bad (crashes on null)
formatter: (value) => value.toUpperCase()
```

**4. Access Full Row When Needed**
```javascript
// ✅ Good (uses row parameter)
formatter: (value, row) => {
  if (row.premium) {
    return `<strong>${value}</strong>`;
  }
  return value;
}
```

## Internationalization (i18n)

Support multiple languages with the i18n object.

### Default Keys

```javascript
const defaultI18n = {
  en: {
    all: 'All',
    endsWith: 'Ends with',
    equals: 'Equals',
    first: 'First',
    includes: 'Includes',
    last: 'Last',
    next: 'Next',
    noResult: 'No results',
    of: 'of',
    page: 'Page',
    prev: 'Previous',
    rowsPerPage: 'Rows per page',
    search: 'Filter columns',
    selected: 'selected',
    startsWith: 'Starts with',
    compact: 'Compact',
    standard: 'Standard',
    comfortable: 'Comfortable'
  }
};
```

### Adding Languages

```javascript
grid.i18n = {
  // French
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
    compact: 'Compact',
    standard: 'Standard',
    comfortable: 'Confortable'
  },
  
  // Spanish
  es: {
    all: 'Todos',
    endsWith: 'Termina con',
    equals: 'Igual a',
    first: 'Primero',
    includes: 'Contiene',
    last: 'Último',
    next: 'Siguiente',
    noResult: 'Sin resultados',
    of: 'de',
    page: 'Página',
    prev: 'Anterior',
    rowsPerPage: 'Filas por página',
    search: 'Filtrar columnas',
    selected: 'seleccionados',
    startsWith: 'Empieza con',
    compact: 'Compacto',
    standard: 'Estándar',
    comfortable: 'Cómodo'
  },
  
  // German
  de: {
    all: 'Alle',
    endsWith: 'Endet mit',
    equals: 'Gleich',
    first: 'Erste',
    includes: 'Enthält',
    last: 'Letzte',
    next: 'Weiter',
    noResult: 'Keine Ergebnisse',
    of: 'von',
    page: 'Seite',
    prev: 'Zurück',
    rowsPerPage: 'Zeilen pro Seite',
    search: 'Spalten filtern',
    selected: 'ausgewählt',
    startsWith: 'Beginnt mit',
    compact: 'Kompakt',
    standard: 'Standard',
    comfortable: 'Komfortabel'
  }
};

// Set language
grid.setAttribute('lang', 'fr');
```

### Via HTML Attribute

```html
<data-grid 
  lang="fr"
  i18n='{"fr":{"all":"Tout","next":"Suivant","prev":"Précédent","page":"Page","of":"de","rowsPerPage":"Lignes par page","selected":"sélectionnés","search":"Filtrer les colonnes","noResult":"Aucun résultat"}}'>
</data-grid>
```

### Language Fallback Chain

```javascript
// 1. Try grid lang attribute
const lang = grid.getAttribute('lang');

// 2. Fall back to <html lang>
|| document.documentElement.lang

// 3. Fall back to 'en'
|| 'en';
```

### Translation Function

```javascript
t(key, lang, i18n) {
  if (!i18n || typeof i18n !== 'object') return key;
  return i18n[lang]?.[key] || key;
}

// Usage
t('next', 'fr', i18n);  // → 'Suivant'
t('next', 'xx', i18n);  // → 'next' (fallback to key)
```

## External Navigation

For large datasets, delegate pagination to the server.

### Setup

```javascript
grid.settings = { externalNavigation: true };
grid.setAttribute('itemsperpage', 25);

// Initial data (first page)
grid.data = {
  thead: [...],
  tbody: [...25 rows...]
};

// Set total count
grid.state.rows = 10000;  // Total rows in database
grid.state.pages = 400;   // 10000 / 25
```

### Handle Navigation

```javascript
grid.addEventListener('dg:requestpagechange', async (event) => {
  const { page, direction } = event.detail;
  
  console.log(`Requesting page ${page} (direction: ${direction})`);
  
  // Show loading indicator
  grid.classList.add('loading');
  
  try {
    // Fetch from server
    const response = await fetch(`/api/data?page=${page}&limit=25`);
    const result = await response.json();
    // result = { data: [...], total: 10000 }
    
    // Update grid
    grid.data = result.data;
    grid.state.rows = result.total;
    grid.state.pageItems = result.data.length;
    grid.setPage(page);
    
  } catch (error) {
    console.error('Failed to load page:', error);
    alert('Failed to load data');
  } finally {
    grid.classList.remove('loading');
  }
});
```

### With Sorting

```javascript
let currentSort = { index: -1, order: 0 };

// Track sort changes
grid.addEventListener('dg:sortchange', (event) => {
  currentSort = {
    index: grid.state.sortIndex,
    order: grid.state.sortOrder
  };
});

// Include sort in requests
grid.addEventListener('dg:requestpagechange', async (event) => {
  const { page } = event.detail;
  const { index, order } = currentSort;
  
  const field = index >= 0 ? grid.state.thead[index].field : null;
  const direction = order === 0 ? 'asc' : 'desc';
  
  const url = `/api/data?page=${page}&limit=25&sort=${field}&order=${direction}`;
  const response = await fetch(url);
  // ...
});
```

### Behavior with Search

When search is active, external navigation is DISABLED:

```javascript
// User types search term
grid.setAttribute('searchterm', 'alice');

// Navigation now handled internally
// Only searches current page's data
// dg:requestpagechange NOT dispatched
```

To support server-side search:

```javascript
let searchDebounce = null;

// Listen for search changes
grid.form.elements.searchterm.addEventListener('input', (e) => {
  clearTimeout(searchDebounce);
  searchDebounce = setTimeout(async () => {
    const term = e.target.value;
    
    // Fetch search results from server
    const response = await fetch(`/api/data?search=${term}&limit=25`);
    const result = await response.json();
    
    grid.data = result.data;
    grid.state.rows = result.total;
    grid.setPage(1);
  }, 300);
});
```

## Display Order

Control column display order independently of data structure.

### Default Behavior

Columns displayed in thead order:

```javascript
thead: [
  { field: 'id', label: 'ID' },
  { field: 'name', label: 'Name' },
  { field: 'email', label: 'Email' }
]
// Displays: ID | Name | Email
```

### Custom Order

```javascript
grid.settings = {
  displayOrder: ['email', 'name', 'id']
};
// Displays: Email | Name | ID
```

### Partial Order

```javascript
grid.settings = {
  displayOrder: ['name', 'email']
  // 'id' not listed, but still shown (after specified columns)
};
// Displays: Name | Email | ID
```

### With Hidden Columns

```javascript
thead: [
  { field: 'id', label: 'ID', hidden: true },
  { field: 'name', label: 'Name' },
  { field: 'email', label: 'Email' }
]

grid.settings = {
  displayOrder: ['id', 'email', 'name']
};
// Displays: Email | Name (ID hidden regardless of order)
```

## Search Configuration

### Search Methods

Control how search matching works:

```javascript
grid.setAttribute('searchmethod', 'includes');  // Default
```

Available methods:

| Method | Description | Example |
|--------|-------------|---------|
| `includes` | Contains anywhere | 'john' matches 'John Doe' |
| `start` | Starts with | 'john' matches 'John' but not 'Bob John' |
| `end` | Ends with | 'doe' matches 'John Doe' |
| `equals` | Exact match | 'john' matches only 'john' (case-insensitive) |

### Custom Search Method

```javascript
// Override search method per column in thead
thead: [
  { field: 'email', label: 'Email', searchMethod: 'start' },
  { field: 'name', label: 'Name', searchMethod: 'includes' }
]
```

## Print Configuration

### Print Options

Control what gets printed:

```javascript
// Set print options via form
grid.form.elements.printOptions.value = 'selected';
```

Options:
- `all` - Print entire dataset
- `page` - Print current page only
- `search` - Print filtered results
- `selected` - Print selected rows only

### Print Settings

Configure print layout:

```javascript
// Accessed during setupPrint()
printPreview.addTemplate(templateId, templateFunction, {
  'font-family': 'ff-system',
  'font-size': 'small',
  'margin-top': '15mm',
  'margin-right': '15mm',
  'margin-bottom': '15mm',
  'margin-left': '15mm',
  'page-size': 'A4',
  'page-orientation': 'portrait'
});
```

## Page Size Options

Define available page size choices:

```html
<data-grid 
  itemsperpage="25"
  pagesize="10,25,50,100">
</data-grid>
```

**Rules:**
- `itemsperpage` value MUST exist in `pagesize` array
- If mismatch, component may behave unexpectedly

```javascript
// Programmatically
grid.setAttribute('pagesize', '5,10,25,50');
grid.setAttribute('itemsperpage', '10');
```

## Density Control

### Enable Density Toggle

```html
<data-grid density></data-grid>
```

### Density Options

```javascript
densityOptions: {
  small: {
    label: 'Compact',
    icon: 'densitySmall',
    i18n: 'compact'
  },
  medium: {
    label: 'Standard',
    icon: 'densityMedium',
    i18n: 'standard'
  },
  large: {
    label: 'Comfortable',
    icon: 'densityLarge',
    i18n: 'comfortable'
  }
}
```

Density affects row height via CSS classes:
- `small` → `.ui-table--small`
- `medium` → (no class, default)
- `large` → `.ui-table--large`

## Table Classes

Add custom CSS classes to the table element:

```javascript
grid.setAttribute('tableclass', 'my-table zebra-rows is-dark');
```

Classes applied to internal `<table>`:

```html
<table class="my-table zebra-rows is-dark">
```

Useful for:
- Custom styling
- Zebra striping
- Dark mode
- Responsive breakpoints

## Next Steps

- [Methods](methods.md) - API methods for grid interaction
- [Events](events.md) - Event system and integration patterns
