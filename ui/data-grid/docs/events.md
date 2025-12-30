# Events

DataGrid has a comprehensive event system for monitoring user interactions and integrating with external systems.

## Event Overview

All custom events are prefixed with `dg:` and follow these patterns:

- **Action Events** - Dispatched BY the grid when something happens
- **Command Events** - Received BY the grid to perform actions
- **Request Events** - Dispatched BY the grid requesting external handling

## Event Lifecycle

```
User Action (click, key, input)
  ↓
Browser Event (click, keydown, input)
  ↓
Event Handler (handleTableClick, handleKeyboardEvents)
  ↓
State Update (state.page++, state.selected.add())
  ↓
Conditional Render (renderTBody, updateNavigation)
  ↓
Dispatch Custom Event (dg:selection, dg:cellchange)
  ↓
External Listeners (your code)
```

## Action Events

Events dispatched BY DataGrid when actions occur.

### dg:loaded

Dispatched when component is fully initialized and ready.

**When:** After `connectedCallback()` completes and initial render finishes

**Detail:**
```javascript
{
  message: 'DataGrid is ready'
}
```

**Usage:**
```javascript
grid.addEventListener('dg:loaded', (event) => {
  console.log(event.detail.message);
  // Safe to interact with grid now
  grid.setAttribute('page', 2);
});
```

**Important:** Always add listeners BEFORE setting data, or add them in `dg:loaded` handler to avoid missing events.

### dg:selection

Dispatched when row selection changes (checked/unchecked).

**When:** After checkbox clicked, Space pressed, or programmatic selection

**Detail:** `Set<string>` of composite keys

**Usage:**
```javascript
grid.addEventListener('dg:selection', (event) => {
  const selectedKeys = event.detail;  // Set(['1,alice@example.com', '2,bob@example.com'])
  console.log(`${selectedKeys.size} rows selected`);
  
  // Convert to array
  const keysArray = Array.from(selectedKeys);
  
  // Update UI
  document.getElementById('count').textContent = selectedKeys.size;
});
```

**Note:** This event fires on EVERY selection change. For getting the full list of selected rows (with data), use `dg:getselected` instead.

### dg:selected

Dispatched in response to `dg:getselected` command with full row data.

**When:** After `dg:getselected` event received

**Detail:** `Array<{ row: Object, rowIndex: number }>`

**Usage:**
```javascript
// First, request selected rows
grid.dispatchEvent(new Event('dg:getselected'));

// Then, listen for response
grid.addEventListener('dg:selected', (event) => {
  const selected = event.detail;  // [{ row: {...}, rowIndex: 0 }, ...]
  
  selected.forEach(({ row, rowIndex }) => {
    console.log(`Row ${rowIndex}:`, row.name, row.email);
  });
  
  // Send to server
  const ids = selected.map(({ row }) => row.id);
  fetch('/api/bulk-action', {
    method: 'POST',
    body: JSON.stringify({ ids })
  });
});
```

### dg:rowclick

Dispatched when a row is clicked OR when Shift+Enter is pressed on an active row.

**When:** 
- User clicks anywhere in a tbody row
- User presses Shift+Enter with focus on a row

**Detail:**
```javascript
{
  rowIndex: 7,                    // Position in state.tbody (0-based)
  row: { id: 8, name: 'Alice' },  // Full row object
  pageIndex: 2,                   // Current page (1-based)
  keys: {                         // Only if key fields defined in thead
    id: 8,
    email: 'alice@example.com'
  }
}
```

**Usage:**
```javascript
grid.addEventListener('dg:rowclick', (event) => {
  const { row, rowIndex, pageIndex, keys } = event.detail;
  
  // Show detail modal
  showDetailModal(row);
  
  // Or navigate to detail page
  location.href = `/users/${row.id}`;
  
  // Or expand inline
  console.log(`Clicked row ${rowIndex} on page ${pageIndex}`);
});
```

**Recent Change (2025-12-30):** Now works with ANY tbody row, not just rows with `data-uid`.

### dg:cellchange

Dispatched when an editable cell value changes.

**When:** After user edits a cell (requires `editable` attribute and `uid` column)

**Detail:**
```javascript
{
  field: 'email',                     // Column field name
  newValue: 'alice@newcompany.com',   // New cell value
  oldValue: 'alice@oldcompany.com',   // Previous value
  row: { id: 1, name: 'Alice', ... }, // Full row object
  rowIndex: 0                         // Position in state.tbody
}
```

**Usage:**
```javascript
grid.addEventListener('dg:cellchange', async (event) => {
  const { field, newValue, oldValue, row, rowIndex } = event.detail;
  
  console.log(`${field} changed from "${oldValue}" to "${newValue}"`);
  
  // Validate
  if (field === 'email' && !newValue.includes('@')) {
    alert('Invalid email');
    // Revert (you'd need to implement this)
    return;
  }
  
  // Save to server
  try {
    await fetch(`/api/users/${row.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ [field]: newValue })
    });
    console.log('Saved successfully');
  } catch (error) {
    console.error('Save failed:', error);
    // Consider implementing rollback
  }
});
```

**Important:** This event fires AFTER state is updated. Implement your own validation/rollback logic if needed.

### dg:removed

Dispatched after rows are deleted via `dg:remove` event.

**When:** After `dg:remove` event successfully deletes rows

**Detail:**
```javascript
{
  count: 3,                       // Number of rows deleted
  rows: [                         // Actual deleted row objects
    { id: 1, name: 'Alice' },
    { id: 2, name: 'Bob' },
    { id: 3, name: 'Carol' }
  ],
  remaining: 4207                 // Total rows left in table
}
```

**Usage:**
```javascript
grid.addEventListener('dg:removed', (event) => {
  const { count, rows, remaining } = event.detail;
  
  console.log(`Deleted ${count} rows, ${remaining} remaining`);
  
  // Notify server
  const ids = rows.map(row => row.id);
  fetch('/api/users/bulk-delete', {
    method: 'DELETE',
    body: JSON.stringify({ ids })
  });
  
  // Show notification
  showNotification(`Deleted ${count} row(s)`);
});
```



### dg:itemsperpage

Dispatched when items per page changes.

**When:** User selects different value from "Items per page" dropdown

**Detail:** Full `state` object

**Usage:**
```javascript
grid.addEventListener('dg:itemsperpage', (event) => {
  const state = event.detail;
  const itemsPerPage = parseInt(grid.getAttribute('itemsperpage'));
  
  console.log(`Items per page changed to ${itemsPerPage}`);
  console.log(`Now ${state.pages} total pages`);
  
  // Save preference
  localStorage.setItem('grid-pagesize', itemsPerPage);
});
```

### dg:requestpagechange

Dispatched in EXTERNAL NAVIGATION mode when user navigates pages.

**When:** 
- `settings.externalNavigation = true`
- User clicks navigation button
- No active search term

**Detail:**
```javascript
{
  page: 3,          // Requested page number (1-based)
  direction: 'next' // 'next', 'prev', 'first', 'last', or null
}
```

**Usage:**
```javascript
grid.settings = { externalNavigation: true };

grid.addEventListener('dg:requestpagechange', async (event) => {
  const { page, direction } = event.detail;
  
  console.log(`User wants to go to page ${page} (${direction})`);
  
  // Fetch from server
  const response = await fetch(`/api/data?page=${page}&limit=25`);
  const result = await response.json();
  // result = { data: [...], total: 10000 }
  
  // Update grid
  grid.data = result.data;
  grid.state.pageItems = result.data.length;  // Important!
  grid.setPage(page);
});
```

**Critical:** You MUST set `state.pageItems` manually, or navigation display will be wrong.

**Note:** This event does NOT fire when search is active (component handles internally).

### dg:printerror

Dispatched when a print operation fails.

**When:** 
- User tries to print with no data
- User selects "Print Selected" with no rows selected
- Print template validation fails

**Detail:**
```javascript
{
  error: Error,           // Error object
  printOptions: 'selected' // 'all', 'page', 'search', or 'selected'
}
```

**Usage:**
```javascript
grid.addEventListener('dg:printerror', (event) => {
  const { error, printOptions } = event.detail;
  
  console.error(`Print failed (${printOptions}):`, error.message);
  
  // Show user-friendly message
  if (printOptions === 'selected' && error.message.includes('No rows')) {
    alert('Please select at least one row to print');
  } else {
    alert(`Print failed: ${error.message}`);
  }
});
```

### Custom Column Events

Dispatch custom events when cells with `event` config are clicked.

**Setup:**
```javascript
grid.data = {
  thead: [
    { field: 'name', label: 'Name' },
    { 
      field: 'actions', 
      label: 'Actions',
      event: 'user:action',          // Custom event name
      eventData: { source: 'grid' }  // Additional data
    }
  ],
  tbody: [...]
};
```

**Usage:**
```javascript
grid.addEventListener('user:action', (event) => {
  const data = event.detail;  // { ...eventData, row, cell }
  
  console.log('Action clicked:', data.row.name);
  console.log('Source:', data.source);  // 'grid'
});
```

## Command Events

Events sent TO DataGrid to perform actions.

### dg:append

Append rows to the end of tbody.

**Usage:**
```javascript
const newRows = [
  {
    id: 101,
    name: 'Ugo Quaisse',
    email: 'ugo@quaisse.fr',
    city: 'Paris'
  },
  {
    id: 102,
    name: 'Steven Singh',
    email: 'steven@singh.dk',
    city: 'Copenhagen'
  }
];

grid.dispatchEvent(new CustomEvent('dg:append', { detail: newRows }));
```

**Important:** 
- Rows are appended as-is, no validation
- Must match existing thead structure
- Updates `state.tbody`, `state.rows`, `state.items`, `state.pages`
- Triggers re-render

**Gotcha:** Directly mutates state (no immutability):
```javascript
context.state.tbody.push(...detail);
```

### dg:clearselected

Clear all selected rows.

**Usage:**
```javascript
grid.dispatchEvent(new Event('dg:clearselected'));
```

**Effect:**
- Clears `state.selected` Set
- Unchecks all checkboxes
- Triggers re-render
- Updates navigation count

### dg:getselected

Request array of selected rows with full data.

**Usage:**
```javascript
// Request
grid.dispatchEvent(new Event('dg:getselected'));

// Response arrives via dg:selected event
grid.addEventListener('dg:selected', (event) => {
  const selected = event.detail;  // Array of { row, rowIndex }
  console.log('Selected:', selected);
});
```

**Response Format:**
```javascript
[
  { 
    row: { id: 1, name: 'Alice', email: 'alice@example.com' },
    rowIndex: 0 
  },
  { 
    row: { id: 5, name: 'Eve', email: 'eve@example.com' },
    rowIndex: 4 
  }
]
```

### dg:remove

Delete rows by composite keys.

**Usage:**
```javascript
// Remove specific rows
const keysToRemove = [
  '1,alice@example.com',  // Composite key format
  '2,bob@example.com'
];

grid.dispatchEvent(new CustomEvent('dg:remove', { detail: keysToRemove }));
```

**Requirements:**
- At least one column must have `key: true` in thead
- Keys must be in composite format (even if single key field)
- Keys must exist in current tbody

**Process:**
1. Validates key fields exist
2. Filters matching rows from tbody
3. Updates rows, items, pages metrics
4. Removes keys from selected Set
5. Handles pagination edge case (adjusts page if needed)
6. Re-renders table
7. Dispatches `dg:removed` event

**Example with Selection:**
```javascript
// Remove selected rows
grid.addEventListener('dg:selection', (event) => {
  const selectedKeys = Array.from(event.detail);
  
  if (confirm(`Delete ${selectedKeys.length} rows?`)) {
    grid.dispatchEvent(new CustomEvent('dg:remove', { detail: selectedKeys }));
  }
});

// Handle result
grid.addEventListener('dg:removed', (event) => {
  console.log(`Deleted ${event.detail.count} rows`);
});
```

**Error Handling:**
```javascript
try {
  grid.dispatchEvent(new CustomEvent('dg:remove', { detail: keys }));
} catch (error) {
  if (error.message.includes('No key fields')) {
    console.error('Cannot remove: No key fields defined in thead');
  }
}
```

## Event Timing

### Render-Triggered Events

These attributes trigger renders, which may dispatch events:

| Attribute | Renders | Dispatches |
|-----------|---------|------------|
| `itemsperpage` | ✅ | `dg:itemsperpage` |
| `page` | ✅ | - |
| `searchterm` | ✅ | - |
| `sortindex` | ✅ | - |
| `sortorder` | ✅ | - |

### Selection Events

```
User clicks checkbox
  ↓
state.selected.add(key)  or  state.selected.delete(key)
  ↓
Update checkbox visually (aria-selected)
  ↓
dispatch('dg:selection', state.selected)
```

**Note:** Selection does NOT trigger re-render (visual update via ARIA only).

### Event Order Example

```javascript
// User changes page
grid.setAttribute('page', 2);
  ↓
attributeChangedCallback('page', '1', '2')
  ↓
state.page = 2
  ↓
renderTBody(context)  // Re-renders table
  ↓
updateNavigation(context)  // Updates nav UI
```

## Integration Patterns

### Pattern 1: Master-Detail

```javascript
grid.addEventListener('dg:rowclick', (event) => {
  const { row } = event.detail;
  
  // Load detail view
  fetch(`/api/users/${row.id}/details`)
    .then(res => res.json())
    .then(details => {
      document.getElementById('detail-panel').innerHTML = renderDetails(details);
      document.getElementById('detail-panel').classList.add('open');
    });
});
```

### Pattern 2: Bulk Actions

```javascript
// Get selected rows
document.getElementById('bulk-delete').addEventListener('click', () => {
  grid.dispatchEvent(new Event('dg:getselected'));
});

grid.addEventListener('dg:selected', async (event) => {
  const selected = event.detail;
  
  if (selected.length === 0) {
    alert('No rows selected');
    return;
  }
  
  if (!confirm(`Delete ${selected.length} rows?`)) return;
  
  // Get composite keys
  const keys = selected.map(({ row }) => {
    const keyFields = grid.state.thead.filter(col => col.key);
    return keyFields.map(col => row[col.field]).join(',');
  });
  
  // Remove from grid
  grid.dispatchEvent(new CustomEvent('dg:remove', { detail: keys }));
});

// Sync with server
grid.addEventListener('dg:removed', async (event) => {
  const { rows } = event.detail;
  const ids = rows.map(row => row.id);
  
  await fetch('/api/users/bulk-delete', {
    method: 'DELETE',
    body: JSON.stringify({ ids })
  });
});
```

### Pattern 3: Real-Time Updates

```javascript
// WebSocket updates
socket.on('user:created', (user) => {
  grid.dispatchEvent(new CustomEvent('dg:append', { detail: [user] }));
});

socket.on('user:updated', (user) => {
  // Find and update row
  const rowIndex = grid.state.tbody.findIndex(row => row.id === user.id);
  if (rowIndex !== -1) {
    grid.state.tbody[rowIndex] = user;
    grid.renderTBody(grid.createContext());
  }
});

socket.on('user:deleted', (userId) => {
  const keyFields = grid.state.thead.filter(col => col.key);
  const key = keyFields.map(col => {
    const row = grid.state.tbody.find(r => r.id === userId);
    return row[col.field];
  }).join(',');
  
  grid.dispatchEvent(new CustomEvent('dg:remove', { detail: [key] }));
});
```

### Pattern 4: External Navigation with Loading State

```javascript
grid.settings = { externalNavigation: true };

grid.addEventListener('dg:requestpagechange', async (event) => {
  const { page } = event.detail;
  
  // Show loading
  grid.classList.add('loading');
  
  try {
    const response = await fetch(`/api/data?page=${page}&limit=25`);
    const result = await response.json();
    
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

## Event Gotchas

### 1. Event Timing

```javascript
// ❌ Wrong: Listener added AFTER data
grid.data = [...];
grid.addEventListener('dg:loaded', () => {
  // This might not fire (data already loaded)
});

// ✅ Correct: Listener added BEFORE data
grid.addEventListener('dg:loaded', () => {
  // This will fire
});
grid.data = [...];
```

### 2. dg:selected Double Wrap (FIXED)

**Before (v1.0.35):**
```javascript
context.dispatch('dg:selected', { detail: [...] });
// event.detail = { detail: [...] }  ← Double wrapped!
```

**After (v1.0.36):**
```javascript
context.dispatch('dg:selected', [...]);
// event.detail = [...]  ← Correct!
```

### 3. External Navigation with Search

```javascript
grid.settings = { externalNavigation: true };

// With search active:
grid.setAttribute('searchterm', 'alice');

// User clicks "Next"
// → Does NOT dispatch dg:requestpagechange
// → Handles internally (filters local data)
```

**Why?** Search results are typically small enough for client-side pagination.

## Next Steps

- [Keyboard Shortcuts](keyboard-shortcuts.md) - Keyboard navigation
- [State Management](state-management.md) - Understanding state
- [Configuration](configuration.md) - External navigation and settings

### dg:getselected
Emits `dg:selected`.

**Usage:**
```javascript
grid.dispatchEvent(new Event('dg:getselected'));
```

### dg:append
Append data to the table.

**Usage:**
```javascript
const dataToAppend = [
    { id: 6, name: 'New User', age: 30, email: 'newuser@example.com' }
];
grid.dispatchEvent(new CustomEvent('dg:append', { detail: dataToAppend }));
```

### dg:clearselected
Clear selected rows.

**Usage:**
```javascript
grid.dispatchEvent(new Event('dg:clearselected'));
```
