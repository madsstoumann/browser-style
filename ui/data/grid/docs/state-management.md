# State Management

This document explains how DataGrid manages internal state, handles data updates, and maintains consistency.

## State Object Structure

The `state` object is the central data store for the component:

```javascript
context.state = {
  // Column Definitions
  thead: [
    {
      field: 'id',          // Property name in row objects
      label: 'ID',          // Display label in header
      type: 'number',       // Data type for sorting
      key: true,            // Use in composite key
      uid: false,           // Unique identifier (for editing)
      hidden: false,        // Column visibility
      sortable: true,       // Allow sorting
      formatter: 'bold',    // Custom formatter name
      event: 'customEvent', // Custom click event
      eventData: {...}      // Data for custom event
    }
  ],
  
  // Row Data
  tbody: [
    { id: 1, name: 'Alice', email: 'alice@example.com' },
    { id: 2, name: 'Bob', email: 'bob@example.com' }
  ],
  
  // Metrics
  cols: 3,              // Number of visible columns
  rows: 100,            // Total number of rows
  items: 100,           // Alias for rows (legacy)
  pages: 4,             // Total pages (rows / itemsPerPage)
  
  // Pagination
  page: 1,              // Current page (1-based)
  pageItems: 25,        // Number of items in current page
  
  // Sorting
  sortIndex: -1,        // Index of sorted column (-1 = none)
  sortOrder: 0,         // Sort direction (0 = asc, 1 = desc)
  
  // Selection
  selected: Set(),      // Set of composite keys for selected rows
  
  // Active Cell (for keyboard navigation)
  cellIndex: 0,         // Active cell column index
  rowIndex: 0           // Active cell row index
};
```

## thead Configuration

Each column in `thead` can have these properties:

### Required Properties

| Property | Type | Description |
|----------|------|-------------|
| `field` | string | Property name in row objects (e.g., 'email') |
| `label` | string | Display text in header (e.g., 'Email Address') |

### Optional Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `type` | string | 'string' | Data type: 'string', 'number', 'date', 'currency' |
| `key` | boolean | false | Include in composite key for row identification |
| `uid` | boolean | false | Unique identifier (required for editing) |
| `hidden` | boolean | false | Hide column from display |
| `sortable` | boolean | true | Allow sorting this column |
| `formatter` | string | null | Name of custom formatter function |
| `event` | string | null | Custom event name to dispatch on cell click |
| `eventData` | any | null | Data to include in custom event |

### Example

```javascript
thead: [
  {
    field: 'id',
    label: 'ID',
    type: 'number',
    key: true,
    hidden: true
  },
  {
    field: 'email',
    label: 'Email Address',
    type: 'string',
    key: true,
    formatter: 'email'
  },
  {
    field: 'salary',
    label: 'Annual Salary',
    type: 'currency',
    sortable: true,
    formatter: 'currency'
  },
  {
    field: 'actions',
    label: 'Actions',
    sortable: false,
    event: 'row:action',
    eventData: { source: 'grid' }
  }
]
```

## tbody Data Format

Each row in `tbody` is a plain JavaScript object:

```javascript
tbody: [
  {
    id: 1,
    name: 'Alice Johnson',
    email: 'alice@example.com',
    salary: 75000,
    department: 'Engineering',
    joinDate: '2020-01-15'
  },
  // ... more rows
]
```

**Important Rules:**

1. All rows must have the same properties
2. Property names must match `thead` field names
3. Values should match the declared `type`
4. Missing values should be `null` or `undefined`, not empty string

## Composite Keys

DataGrid uses composite keys (multiple fields) to uniquely identify rows.

### Why Composite Keys?

Single field IDs aren't always unique:

```javascript
// Problem: Duplicate IDs across different tables
{ id: 1, table: 'users', name: 'Alice' }
{ id: 1, table: 'products', name: 'Widget' }

// Solution: Composite key includes both
thead: [
  { field: 'id', key: true },
  { field: 'table', key: true }
]
// Composite key: '1,users' and '1,products'
```

### How It Works

```javascript
// 1. Define key fields in thead
thead: [
  { field: 'id', key: true },
  { field: 'email', key: true },
  { field: 'name', key: false }
]

// 2. For each row, extract key values
const row = { id: 1, email: 'alice@example.com', name: 'Alice' };
const keyFields = ['id', 'email'];
const keyValues = [row.id, row.email];  // [1, 'alice@example.com']

// 3. Join with comma to create composite key
const compositeKey = keyValues.join(',');  // '1,alice@example.com'

// 4. Store in Set for O(1) lookups
state.selected.add(compositeKey);
state.selected.has(compositeKey);  // true
```

### Type-Aware Comparison

The `getObj()` function supports type-aware key matching:

```javascript
// Without type checking (default, fast)
getObj(state, node, false);
// Compares as strings: '1' === '1' ✓

// With type checking (slower, accurate)
getObj(state, node, true);
// Compares with types: Number('1') === Number('1') ✓
```

Use type checking when:
- Keys contain numbers AND strings
- Precision matters (e.g., financial data)
- Data comes from untrusted sources

## Selection Management

### Selection Storage

Selected rows stored as Set of composite keys:

```javascript
state.selected = new Set([
  '1,alice@example.com',
  '2,bob@example.com',
  '3,carol@example.com'
]);
```

**Benefits of Set:**
- O(1) add/delete/has operations
- No duplicates
- Fast iteration

### Selection Operations

```javascript
// Add selection
state.selected.add(compositeKey);

// Remove selection
state.selected.delete(compositeKey);

// Check selection
if (state.selected.has(compositeKey)) {
  // Row is selected
}

// Clear all
state.selected.clear();

// Get count
const count = state.selected.size;

// Iterate
state.selected.forEach(key => {
  console.log('Selected:', key);
});
```

### Selection Persistence

Selection persists across:

✅ Sorting - Rows stay selected regardless of order
✅ Filtering - Selection Set unchanged, but rows may be hidden
✅ Pagination - Selected rows on other pages stay selected
✅ Data refresh - If composite key still exists

❌ Lost when:
- Component destroyed
- `state.selected.clear()` called
- `dg:clearselected` event fired
- New data with different keys

### Multi-Page Selection

Users can select rows across multiple pages:

```javascript
// Page 1: Select rows 1, 2, 3
state.selected.add('1,alice@example.com');
state.selected.add('2,bob@example.com');
state.selected.add('3,carol@example.com');

// Navigate to page 2
// Selection persists!

// Page 2: Select rows 26, 27
state.selected.add('26,xena@example.com');
state.selected.add('27,yale@example.com');

// state.selected.size === 5
```

**UI Indicator:**
```
[5 selected]  ← Shows total across all pages
```

## Data Flow

### 1. Data Input

Three ways to provide data:

```javascript
// A. Via attribute (URL or JSON string)
<data-grid data="https://api.example.com/data"></data-grid>
<data-grid data='{"thead":[...],"tbody":[...]}'></data-grid>

// B. Via property (JavaScript)
grid.data = [{ id: 1, name: 'Alice' }];
grid.data = { thead: [...], tbody: [...] };

// C. Via inline table
<data-grid>
  <table>...</table>
</data-grid>
```

### 2. Data Parsing

`parseData()` converts any format to standard structure:

```javascript
data (any format)
  ↓
parseData()
  ├── Array? → dataFromJSON()
  ├── {thead,tbody}? → dataFromHeadBody()
  └── <table>? → dataFromTable()
  ↓
state = {
  thead: [...],
  tbody: [...],
  cols, rows, pages
}
```

### 3. Data Normalization

`parseData()` ensures tbody consistency:

```javascript
// Input: Fields in random order
tbody: [
  { name: 'Alice', id: 1, email: 'alice@ex.com' },
  { email: 'bob@ex.com', name: 'Bob', id: 2 }
]

// Output: Consistent field order matching thead
tbody: [
  { id: 1, name: 'Alice', email: 'alice@ex.com' },
  { id: 2, name: 'Bob', email: 'bob@ex.com' }
]
```

**Why?** Some operations (like filtering) rely on Object.values() order.

### 4. State Update

```javascript
connectedCallback() {
  const data = this.getAttribute('data');
  const parsed = parseData(data, itemsPerPage, selectable);
  
  this.state = {
    ...parsed,
    page: 1,
    sortIndex: -1,
    sortOrder: 0,
    selected: new Set(),
    cellIndex: 0,
    rowIndex: 0
  };
}
```

## Attribute-Driven Reactivity

### Observed Attributes

These attributes trigger `attributeChangedCallback()`:

```javascript
static observedAttributes = [
  'itemsperpage',
  'page',
  'searchterm',
  'sortindex',
  'sortorder'
];
```

### Reactivity Flow

```javascript
// 1. User interaction or programmatic change
grid.setAttribute('page', '3');

// 2. attributeChangedCallback triggered
attributeChangedCallback('page', '2', '3') {
  // 3. Guard against duplicate updates
  if (oldValue === newValue) return;
  
  // 4. Update state
  this.state.page = parseInt(newValue);
  
  // 5. Re-render
  if (render) {
    renderTBody(context);
    updateNavigation(context);
  }
}
```

### Bidirectional Sync

Some state changes update attributes back:

```javascript
// State → Attribute
setPage(page) {
  this.state.page = page;
  this.setAttribute('page', page);  // Sync back
}

// Attribute → State (via attributeChangedCallback)
attributeChangedCallback('page', oldVal, newVal) {
  this.state.page = parseInt(newVal);
}
```

**Circular Update Prevention:**

```javascript
attributeChangedCallback(name, oldValue, newValue) {
  // Guard: Skip if value unchanged
  const render = (oldValue && (oldValue !== newValue)) || false;
  if (!render) return;
  // ...
}
```

## State Mutations

### Safe Mutations

These operations are safe and trigger proper re-renders:

```javascript
// ✅ Via attributes (recommended)
grid.setAttribute('page', 2);
grid.setAttribute('itemsperpage', 50);
grid.setAttribute('searchterm', 'alice');

// ✅ Via property setters
grid.data = newData;
grid.formatters = newFormatters;

// ✅ Via public methods
grid.setPage(2);
grid.selectRows([row1, row2]);
```

### Unsafe Mutations

These bypass reactivity and may cause inconsistencies:

```javascript
// ❌ Direct state mutation
grid.state.page = 2;  // No re-render!

// ❌ Direct tbody mutation
grid.state.tbody.push(newRow);  // Metrics not updated!

// ❌ Direct thead mutation
grid.state.thead[0].hidden = true;  // No re-render!
```

**Fix:** Use proper APIs:

```javascript
// ✅ Instead of direct mutation
grid.dispatchEvent(new CustomEvent('dg:append', { detail: [newRow] }));
```

## Calculated Properties

Some properties are calculated on-demand:

```javascript
// cols: Number of visible columns
get cols() {
  return this.state.thead.filter(cell => !cell.hidden).length;
}

// rows: Total number of rows
get rows() {
  return this.state.tbody.length;
}

// pages: Total number of pages
get pages() {
  const { rows } = this;
  const itemsPerPage = parseInt(this.getAttribute('itemsperpage')) || 0;
  return itemsPerPage > 0 ? Math.ceil(rows / itemsPerPage) : 0;
}
```

## State Persistence

### In Memory Only

State is NOT persisted by default:

- Page refresh → State lost
- Navigation away → State lost
- Component destroyed → State lost

### Manual Persistence

Save state to localStorage:

```javascript
// Save
function saveState(grid) {
  const state = {
    page: grid.state.page,
    itemsPerPage: grid.getAttribute('itemsperpage'),
    searchterm: grid.getAttribute('searchterm'),
    sortIndex: grid.state.sortIndex,
    sortOrder: grid.state.sortOrder,
    selected: Array.from(grid.state.selected)
  };
  localStorage.setItem('grid-state', JSON.stringify(state));
}

// Restore
function restoreState(grid) {
  const saved = localStorage.getItem('grid-state');
  if (!saved) return;
  
  const state = JSON.parse(saved);
  grid.setAttribute('page', state.page);
  grid.setAttribute('itemsperpage', state.itemsPerPage);
  grid.setAttribute('searchterm', state.searchterm || '');
  grid.setAttribute('sortindex', state.sortIndex);
  grid.setAttribute('sortorder', state.sortOrder);
  
  // Restore selection
  state.selected.forEach(key => grid.state.selected.add(key));
  grid.renderTBody(grid.createContext());
}

// Usage
grid.addEventListener('dg:loaded', () => {
  restoreState(grid);
});

window.addEventListener('beforeunload', () => {
  saveState(grid);
});
```

### URL State

Sync state with URL query params:

```javascript
function syncStateToURL(grid) {
  const params = new URLSearchParams();
  params.set('page', grid.state.page);
  params.set('search', grid.getAttribute('searchterm') || '');
  params.set('sort', `${grid.state.sortIndex},${grid.state.sortOrder}`);
  
  const url = `${location.pathname}?${params.toString()}`;
  history.replaceState(null, '', url);
}

function syncURLToState(grid) {
  const params = new URLSearchParams(location.search);
  
  if (params.has('page')) {
    grid.setAttribute('page', params.get('page'));
  }
  if (params.has('search')) {
    grid.setAttribute('searchterm', params.get('search'));
  }
  if (params.has('sort')) {
    const [index, order] = params.get('sort').split(',');
    grid.setAttribute('sortindex', index);
    grid.setAttribute('sortorder', order);
  }
}

// Setup
grid.addEventListener('dg:loaded', () => syncURLToState(grid));
grid.addEventListener('dg:pagechange', () => syncStateToURL(grid));
```

## Performance Considerations

### State Size

Monitor state size for large datasets:

```javascript
// Calculate memory usage
const stateSize = JSON.stringify(grid.state).length;
console.log(`State size: ${(stateSize / 1024).toFixed(2)} KB`);

// For 10,000 rows with 10 columns:
// ~1-5 MB typical
// ~10+ MB if rows have large nested objects
```

**Optimization:** Use external navigation for large datasets:

```javascript
grid.settings = { externalNavigation: true };
// Now only ~25-100 rows in memory at once
```

### Selection Set Size

Selection Set is efficient even for large selections:

```javascript
// Set overhead: ~32 bytes per entry
const selectionSize = grid.state.selected.size * 32;
console.log(`Selection size: ${(selectionSize / 1024).toFixed(2)} KB`);

// 10,000 selected rows = ~320 KB
// Still efficient!
```

## Debugging State

### Enable Debug Mode

```html
<data-grid debug></data-grid>
```

### Console Logging

```javascript
// Log state changes
grid.addEventListener('dg:pagechange', () => {
  console.log('State:', grid.state);
});

// Log selection changes
grid.addEventListener('dg:selection', (e) => {
  console.log('Selected keys:', Array.from(e.detail));
  console.log('Selected count:', e.detail.size);
});
```

### DevTools Inspection

```javascript
// In browser console:
$0.state  // View entire state
$0.state.thead  // View column definitions
$0.state.tbody  // View row data
$0.state.selected  // View selected Set
Array.from($0.state.selected)  // View as array
```

## Next Steps

- [Architecture](architecture.md) - Component structure
- [Events](events.md) - Event system and lifecycle
- [Debugging](debugging.md) - Troubleshooting guide
