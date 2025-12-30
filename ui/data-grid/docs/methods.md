# Methods

DataGrid provides public methods for programmatic control and interaction.

## Navigation Methods

### setPage(page, forceRender = false)

Navigate to a specific page.

**Parameters:**
- `page` (number) - Page number (1-based)
- `forceRender` (boolean) - Force re-render even in external navigation mode

**Usage:**
```javascript
// Navigate to page 3
grid.setPage(3);

// Navigate and force render (external navigation mode)
grid.setPage(3, true);
```

**Behavior:**
- Updates `state.page`
- Sets `page` attribute
- Triggers `renderTBody()` (unless external navigation without search)
- Dispatches `dg:pagechange` event

**External Navigation:**
```javascript
grid.settings = { externalNavigation: true };
grid.setPage(3);  // Doesn't render (waits for data)
grid.setPage(3, true);  // Forces render
```

### next()

Navigate to the next page.

**Usage:**
```javascript
grid.next();
```

Equivalent to:
```javascript
grid.setPage(grid.state.page + 1);
```

Calls `navigatePage(null, 'next')` internally.

### prev()

Navigate to the previous page.

**Usage:**
```javascript
grid.prev();
```

Equivalent to:
```javascript
grid.setPage(grid.state.page - 1);
```

Calls `navigatePage(null, 'prev')` internally.

### navigatePage(page, direction)

Low-level navigation method.

**Parameters:**
- `page` (number|null) - Specific page, or null to use direction
- `direction` (string) - 'first', 'prev', 'next', 'last'

**Usage:**
```javascript
// Navigate by direction
grid.navigatePage(null, 'first');
grid.navigatePage(null, 'last');

// Navigate to specific page
grid.navigatePage(5, null);
```

**Behavior:**
- Calculates target page based on direction
- Handles external navigation
- Dispatches `dg:requestpagechange` if external mode
- Otherwise calls `setPage()`

## Selection Methods

### selectRows(rows, toggle = true, force = false)

Select specific rows.

**Parameters:**
- `rows` (Array<HTMLElement>) - Array of `<tr>` elements
- `toggle` (boolean) - Toggle selection state (true) or force add (false)
- `force` (boolean) - Force specific state (requires toggle=false)

**Usage:**
```javascript
// Select first row
const firstRow = grid.table.tBodies[0].rows[0];
grid.selectRows([firstRow]);

// Select multiple rows
const rows = Array.from(grid.table.tBodies[0].rows).slice(0, 3);
grid.selectRows(rows);

// Force select (don't toggle)
grid.selectRows([firstRow], false, true);

// Force deselect
grid.selectRows([firstRow], false, false);
```

**Behavior:**
- Extracts composite keys from rows
- Adds/removes from `state.selected` Set
- Updates row `aria-selected` attribute
- Updates navigation selected count
- Dispatches `dg:selection` event

### getSelectedRows()

Get array of selected row objects with data.

**Usage:**
```javascript
// Request selected
grid.dispatchEvent(new Event('dg:getselected'));

// Listen for response
grid.addEventListener('dg:selected', (event) => {
  const selected = event.detail;
  // [{ row: {...}, rowIndex: 0 }, ...]
});
```

**Note:** This is triggered via events, not a direct method call.

### clearSelection()

Clear all selected rows.

**Usage:**
```javascript
grid.dispatchEvent(new Event('dg:clearselected'));
```

## Editing Methods

### editBegin()

Begin editing the active cell.

**Requirements:**
- Grid must have `editable` attribute
- At least one column must have `uid: true`
- Cell must be focused

**Usage:**
```javascript
// User presses Enter on a cell
grid.editBegin();
```

**Behavior:**
- Makes cell `contenteditable`
- Selects cell text
- Adds editing class
- Stores original value

**Internal:** Typically called by keyboard handler, not directly by users.

### editEnd(node)

End editing and save changes.

**Parameters:**
- `node` (HTMLElement) - The cell being edited

**Usage:**
```javascript
const cell = document.querySelector('td[contenteditable]');
grid.editEnd(cell);
```

**Behavior:**
- Reads new cell value
- Compares with original value
- Updates `state.tbody` if changed
- Dispatches `dg:cellchange` event
- Removes `contenteditable`

**Internal:** Typically called automatically on blur or Enter key.

### getObj(node, typeCheck = false)

Get row data for a cell.

**Parameters:**
- `node` (HTMLElement) - Cell or element within a row
- `typeCheck` (boolean) - Use type-aware key comparison

**Returns:** `{ row: Object, rowIndex: number }` or `null`

**Usage:**
```javascript
const cell = document.querySelector('td');
const result = grid.getObj(cell);

if (result) {
  const { row, rowIndex } = result;
  console.log('Row data:', row);
  console.log('Row index:', rowIndex);
}
```

**With Type Checking:**
```javascript
// Slower but more accurate
const result = grid.getObj(cell, true);
```

**How It Works:**
1. Finds parent `<tr>` with `data-keys` attribute
2. Extracts composite key from `data-keys`
3. Searches `state.tbody` for matching row
4. Returns row data and index

## Rendering Methods

### renderTBody(context)

Re-render the table body.

**Parameters:**
- `context` (Object) - Context object with state, settings, etc.

**Usage:**
```javascript
const context = {
  ...grid,
  state: grid.state,
  settings: grid.settings,
  formatters: grid.formatters,
  // ... other properties
};

grid.renderTBody(context);
```

**Note:** Not typically called directly. Use attribute changes instead:

```javascript
// ✅ Preferred: Triggers render automatically
grid.setAttribute('page', 2);

// ❌ Manual: Requires creating context
grid.renderTBody(context);
```

### renderTHead(context)

Re-render the table header.

**Parameters:**
- `context` (Object) - Context object

**Usage:**
```javascript
grid.renderTHead(context);
```

**When to use:**
- After changing column visibility
- After changing sort indicators
- After programmatic thead modifications

### updateNavigation(context)

Update navigation UI (page indicators, counts).

**Parameters:**
- `context` (Object) - Context object

**Usage:**
```javascript
grid.updateNavigation(context);
```

**Updates:**
- "X-Y of Z" display
- Current page indicator
- Page dropdown options
- Selected count

## Column Methods

### resizeColumn(index, value)

Resize a column by a delta value.

**Parameters:**
- `index` (number) - Column index (0-based)
- `value` (number) - Pixels to add/subtract

**Usage:**
```javascript
// Expand first column by 20px
grid.resizeColumn(0, 20);

// Shrink second column by 10px
grid.resizeColumn(1, -10);
```

**Keyboard Shortcut:**
- `Shift + Arrow Right` - Expand by 20px
- `Shift + Arrow Left` - Shrink by 20px

**Implementation:**
```javascript
resizeColumn(index, value) {
  const th = this.table.tHead.rows[0].cells[index];
  const currentWidth = th.offsetWidth;
  const newWidth = currentWidth + value;
  th.style.width = `${newWidth}px`;
}
```

### setActive()

Set the active cell for keyboard navigation.

**Usage:**
```javascript
grid.setActive();
```

**Behavior:**
- Focuses the cell at `state.cellIndex`, `state.rowIndex`
- Scrolls cell into view if needed
- Sets `tabindex="0"` on active cell
- Removes `tabindex` from other cells

**Automatic:** Called by keyboard navigation handlers.

## Print Methods

### printTable(directPrint = false)

Open print preview or print directly.

**Parameters:**
- `directPrint` (boolean) - Skip preview, print immediately

**Requirements:**
- Grid must have `printable` attribute
- `@browser.style/print-preview` component must be loaded

**Usage:**
```javascript
// Open print preview
grid.printTable();

// Print directly
grid.printTable(true);
```

**Print Options:**

Set before calling:
```javascript
grid.form.elements.printOptions.value = 'selected';  // 'all', 'page', 'search', 'selected'
grid.printTable();
```

**Keyboard Shortcut:**
- `Ctrl/Cmd + P` - Open print preview

## Data Methods

### data (setter)

Set grid data.

**Usage:**
```javascript
// Simple array
grid.data = [
  { id: 1, name: 'Alice', email: 'alice@example.com' },
  { id: 2, name: 'Bob', email: 'bob@example.com' }
];

// With thead/tbody
grid.data = {
  thead: [
    { field: 'id', label: 'ID', type: 'number', key: true },
    { field: 'name', label: 'Name', type: 'string' },
    { field: 'email', label: 'Email', type: 'string' }
  ],
  tbody: [
    { id: 1, name: 'Alice', email: 'alice@example.com' }
  ]
};
```

**Behavior:**
- Calls `parseData()` to normalize
- Updates `state` object
- Triggers full re-render
- Resets pagination to page 1

### data (getter)

Get current tbody data.

**Usage:**
```javascript
const currentData = grid.data;
// Returns: state.tbody array
```

## Utility Methods

### log(message, color)

Console log with styling (if debug mode enabled).

**Parameters:**
- `message` (string) - Message to log
- `color` (string) - Background color (hex)

**Usage:**
```javascript
grid.log('Custom message', '#FF0000');
```

**Requires:**
```html
<data-grid debug></data-grid>
```

### dispatch(name, detail)

Dispatch a custom event.

**Parameters:**
- `name` (string) - Event name
- `detail` (any) - Event detail data

**Usage:**
```javascript
grid.dispatch('dg:custom', { foo: 'bar' });
```

Equivalent to:
```javascript
grid.dispatchEvent(new CustomEvent('dg:custom', { detail: { foo: 'bar' } }));
```

**Built-in Events:**
- `dg:loaded`
- `dg:selection`
- `dg:rowclick`
- `dg:cellchange`
- `dg:pagechange`
- `dg:itemsperpage`
- `dg:requestpagechange`
- `dg:printerror`

## Advanced Usage

### Creating Context Object

Many methods require a `context` object. Create it like this:

```javascript
function createContext(grid) {
  return {
    ...grid,
    state: grid.state,
    settings: grid.settings,
    formatters: grid.formatters,
    i18n: grid.i18n,
    table: grid.table,
    form: grid.form,
    wrapper: grid.wrapper,
    log: grid.log.bind(grid),
    dispatch: grid.dispatch.bind(grid),
    getAttribute: grid.getAttribute.bind(grid),
    setAttribute: grid.setAttribute.bind(grid)
  };
}

const context = createContext(grid);
grid.renderTBody(context);
```

### Batch Operations

```javascript
// Multiple selections without re-rendering each time
const rows = Array.from(grid.table.tBodies[0].rows);

// Disable re-render temporarily
const originalRender = grid.renderTBody;
grid.renderTBody = () => {};

rows.slice(0, 10).forEach(row => {
  grid.selectRows([row], false, true);  // Force select
});

// Re-enable and render once
grid.renderTBody = originalRender;
grid.renderTBody(createContext(grid));
```

### Custom Sorting

```javascript
// Sort by custom comparator
function customSort(context) {
  const { state, settings } = context;
  const { tbody, thead, sortIndex, sortOrder } = state;
  
  const field = thead[sortIndex].field;
  const direction = sortOrder === 0 ? 1 : -1;
  
  return tbody.slice().sort((a, b) => {
    // Custom logic
    const aVal = a[field];
    const bVal = b[field];
    
    if (aVal === bVal) return 0;
    return (aVal > bVal ? 1 : -1) * direction;
  });
}

// Use in render pipeline
const sorted = customSort(context);
const paginated = paginate(context, sorted);
renderRows(paginated);
```

## Method Chaining

Some methods can be chained:

```javascript
grid
  .setPage(1)
  .selectRows([firstRow])
  .printTable();
```

## Next Steps

- [Events](events.md) - Event system reference
- [State Management](state-management.md) - Understanding state
- [Configuration](configuration.md) - Settings and options reference
