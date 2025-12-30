# Architecture

This document provides a detailed overview of DataGrid's internal architecture, design principles, and module organization.

## Design Philosophy

DataGrid is built on these core principles:

1. **Autonomous Custom Element** - Self-contained web component with zero runtime dependencies
2. **Modular Design** - 8 focused modules with single responsibilities
3. **Performance First** - Single-pass rendering, efficient data structures
4. **Attribute-Driven Reactivity** - UI updates triggered by attribute changes
5. **Accessibility** - Full ARIA support, keyboard navigation per W3C standards
6. **Progressive Enhancement** - Graceful degradation for older browsers

## Component Structure

```
index.js (150 lines)                    # Main custom element class
├── connectedCallback()                 # Initialization
├── attributeChangedCallback()          # Reactive updates
├── data setter/getter                  # Data management
└── Public methods                      # API surface

modules/
├── data.js (177 lines)                # Data parsing & normalization
├── events.js (215 lines)              # Click events & editing
├── events.keyboard.js (207 lines)     # Keyboard navigation
├── icons.js (21 lines)                # Icon definitions
├── print.js (132 lines)               # Print integration
├── render.form.js (101 lines)         # Navigation UI
├── render.table.js (296 lines)        # Table rendering
└── utility.js (101 lines)             # Pure helper functions
```

**Total:** ~1,400 lines of well-organized, maintainable code

## Module Responsibilities

### 1. data.js - Data Parser & Normalizer

**Purpose:** Convert any data format into standardized thead/tbody structure.

**Key Functions:**

- `parseData(data, itemsPerPage, selectable)` - Main entry point
- `dataFromJSON(data)` - Parse JSON arrays
- `dataFromHeadBody(data)` - Parse { thead, tbody } objects
- `dataFromTable(table)` - Extract from inline `<table>` element

**Output Format:**
```javascript
{
  thead: [
    { 
      field: 'id',
      label: 'ID',
      type: 'number',
      key: true,
      hidden: false,
      sortable: true,
      formatter: 'bold'
    }
  ],
  tbody: [
    { id: 1, name: 'Alice', email: 'alice@example.com' }
  ],
  cols: 3,        // Number of visible columns
  rows: 100,      // Total rows
  items: 100,     // Same as rows (for compatibility)
  pages: 4        // Total pages (if paginated)
}
```

**Important:** All tbody rows are normalized to have consistent field order matching thead.

### 2. events.js - Event Handler & Editor

**Purpose:** Handle user interactions (clicks, edits) and dispatch custom events.

**Key Functions:**

- `attachEventHandlers(context)` - Setup click listeners
- `handleTableClick(context, event)` - Route click events
- `handleCellEdit(context, cell)` - Inline cell editing
- `attachCustomEventHandlers(context)` - Listen for custom events

**Handles:**
- Header clicks → Sorting
- Cell clicks → Selection/editing/custom actions
- Checkbox clicks → Row selection
- Button clicks → Actions (expand, navigate, export)

**Custom Events Listened:**
- `dg:append` - Add rows to tbody
- `dg:clearselected` - Clear all selections
- `dg:getselected` - Request selected rows
- `dg:remove` - Delete rows by keys

### 3. events.keyboard.js - Keyboard Navigator

**Purpose:** Implement full W3C ARIA grid keyboard navigation.

**Key Functions:**

- `attachKeyboardHandlers(context)` - Setup keyboard listeners
- `handleArrowKeys(context, event)` - Navigate between cells
- `handleHomeEnd(context, event)` - Jump to first/last
- `handlePageUpDown(context, event)` - Navigate pages
- `handleSpaceKey(context, event)` - Select rows/sort columns
- `handleEnterKey(context, event)` - Edit cells/dispatch events
- `handlePrintShortcut(context, event)` - Ctrl/Cmd+P

**Supports:**
- Arrow keys (↑ ↓ ← →)
- Home/End (with Ctrl/Cmd/Shift modifiers)
- Page Up/Down
- Space (selection/sorting)
- Enter/Shift+Enter (edit/row click)
- Ctrl/Cmd+A (select all)
- Ctrl/Cmd+Shift+I (invert selection)
- Ctrl/Cmd+P (print)

### 4. render.table.js - Table Renderer

**Purpose:** Generate table HTML with filtering, sorting, and pagination.

**Key Functions:**

- `renderTHead(context)` - Create header with sort indicators
- `renderTBody(context)` - **The heart of the component**
- `applySorting(context, data)` - Type-aware sorting
- `filterData(context, data)` - Search/filter implementation
- `paginate(context, data)` - Extract current page
- `updateNavigation(context)` - Update "X-Y of Z" display

**renderTBody() Pipeline:**

```
Get visible columns
  ↓
Filter data (if searchterm exists)
  ↓
Apply sorting (if sortIndex set)
  ↓
Paginate data (if itemsPerPage set)
  ↓
Generate HTML for each row
  ├── Apply formatters
  ├── Add selection checkboxes
  ├── Highlight search terms
  ├── Create expandable popovers
  └── Set ARIA attributes
  ↓
Inject into DOM (single write)
  ↓
Update navigation UI
```

**Performance:** Single pass through data, batch DOM update.

### 5. render.form.js - Navigation UI

**Purpose:** Render search box, navigation controls, and action buttons.

**Key Functions:**

- `renderSearch(context)` - Search input + column filters
- `renderNavigation(context)` - Pagination controls
- `renderForm(context)` - Density controls + actions
- `renderActions(context)` - Export/print buttons

**Generates:**
- Search input with column filter popover
- First/Prev/Next/Last buttons
- Page selector dropdown
- Items per page dropdown
- Selected count display
- Export buttons (CSV/JSON)
- Print button
- Density toggle (compact/standard/comfortable)

### 6. print.js - Print Integration

**Purpose:** Interface with `<print-preview>` component for professional printing.

**Key Functions:**

- `setupPrint(context)` - Initialize print preview
- `printTable(context, directPrint)` - Execute print operation

**Print Options:**
- **All** - Print entire dataset
- **Page** - Print current page only
- **Search** - Print filtered results
- **Selected** - Print selected rows only

**Template Closure:** Print template function closes over `context`, accessing current state when print is invoked.

### 7. utility.js - Pure Helpers

**Purpose:** Provide pure helper functions with no side effects.

**Key Functions:**

| Function | Purpose | Example |
|----------|---------|---------|
| `calculatePages(items, itemsPerPage)` | Calculate total pages | `calculatePages(100, 25) → 4` |
| `camelCase(str)` | Convert to camelCase | `camelCase('First Name') → 'firstName'` |
| `capitalize(str)` | Capitalize first letter | `capitalize('hello') → 'Hello'` |
| `getKeys(state)` | Extract key fields from thead | Returns array of key field configs |
| `getObj(state, node, typeCheck)` | Find row by composite key | Returns `{ row, rowIndex }` |
| `t(key, lang, i18n)` | Translate UI string | `t('next', 'fr', i18n) → 'Suivant'` |

**Characteristics:**
- No external dependencies
- No state mutation
- Predictable output for given input
- Easily testable

### 8. icons.js - Icon Definitions

**Purpose:** Provide SVG icon definitions for UI elements.

**Icons:**
- `sortAsc` / `sortDesc` - Sort indicators
- `chevronFirst` / `chevronLast` - Navigation
- `chevronLeft` / `chevronRight` - Navigation
- `density` variations - Density controls
- `export` / `print` / `search` - Action buttons

## Data Flow Pipeline

### 1. Initialization Flow

```
connectedCallback()
  ↓
Get data attribute
  ↓
fetch(data) if URL
  ↓
parseData(data)
  ↓
state = { thead, tbody, ... }
  ↓
renderTHead(context)
  ↓
renderTBody(context)
  ↓
renderNavigation(context)
  ↓
renderSearch(context)
  ↓
attachEventHandlers(context)
  ↓
dispatch('dg:loaded')
```

### 2. User Interaction Flow

```
User Action (click/key)
  ↓
Event Handler
  ↓
Update State
  ↓
setAttribute(name, value)
  ↓
attributeChangedCallback()
  ↓
Guard: oldValue !== newValue?
  ↓ (Yes)
Conditional Render
  ↓
dispatch Custom Event
```

### 3. Render Trigger Flow

**Attributes that trigger renders:**

```javascript
observedAttributes = [
  'itemsperpage',  // → renderTBody()
  'page',          // → renderTBody()
  'searchterm',    // → renderTBody()
  'sortindex',     // → renderTBody()
  'sortorder'      // → renderTBody()
];
```

**Attributes that DON'T trigger renders:**
- `data` (property only)
- `formatters` (property only)
- `selectable`, `searchable`, `printable` (boolean, checked at render)

### 4. External Navigation Flow

When `settings.externalNavigation = true`:

```
User clicks "Next"
  ↓
navigatePage(null, 'next')
  ↓
Check: externalNavigation && !searchterm?
  ↓ (Yes)
dispatch('dg:requestpagechange', { page, direction })
  ↓
External listener fetches data
  ↓
grid.data = newData
  ↓
parseData() + renderTBody()
```

## State Management

### State Object Structure

```javascript
context.state = {
  // Data
  thead: [...],        // Column definitions
  tbody: [...],        // Row data
  cols: 3,            // Visible column count
  rows: 100,          // Total row count
  items: 100,         // Alias for rows
  pages: 4,           // Total pages
  
  // Pagination
  page: 1,            // Current page (1-based)
  pageItems: 25,      // Rows in current page
  
  // Sorting
  sortIndex: -1,      // Column index (-1 = none)
  sortOrder: 0,       // 0 = asc, 1 = desc
  
  // Selection
  selected: Set(),    // Set of composite keys
  
  // Active Cell
  cellIndex: 0,       // Active cell column
  rowIndex: 0         // Active cell row
};
```

### Composite Keys

Rows are identified by composite keys (multiple fields):

```javascript
// thead defines key fields
thead: [
  { field: 'id', key: true },
  { field: 'email', key: true },
  { field: 'name', key: false }
]

// Composite key for row { id: 1, email: 'alice@x.com', name: 'Alice' }
const compositeKey = '1,alice@x.com';

// Stored in selection Set
state.selected.add('1,alice@x.com');
state.selected.has('1,alice@x.com'); // true
```

**Benefits:**
- Handles non-unique IDs
- O(1) selection lookups
- Persists across sorts/filters

## Reactivity Model

### Attribute-Driven Updates

DataGrid uses HTML attributes as the source of truth:

```javascript
// User changes page
grid.setAttribute('page', 3);
  ↓
attributeChangedCallback('page', '2', '3')
  ↓
Guard: oldValue !== newValue
  ↓
state.page = 3
  ↓
renderTBody(context)
```

**Why attributes?**
- Declarative (visible in DevTools)
- Observable (mutation observers work)
- Serializable (can save state as HTML)
- Standard (follows web component best practices)

### Property vs Attribute

| Property | Attribute | Reactive | Notes |
|----------|-----------|----------|-------|
| `data` | ❌ | ✅ | Property-only, triggers render |
| `formatters` | ❌ | ✅ | Property-only, triggers render |
| `i18n` | ✅ | ❌ | Attribute read once |
| `itemsperpage` | ✅ | ✅ | Synced both ways |
| `page` | ✅ | ✅ | Synced both ways |
| `searchterm` | ✅ | ✅ | Synced both ways |
| `sortindex` | ✅ | ✅ | Synced both ways |
| `sortorder` | ✅ | ✅ | Synced both ways |

## Performance Optimizations

### 1. Single-Pass Rendering

`renderTBody()` combines filter, sort, paginate, and format in ONE iteration:

```javascript
// Efficient: Single pass
const page = paginate(applySorting(filterData(data)));
const html = page.map(row => generateRowHTML(row)).join('');
table.tbody.innerHTML = html;

// Inefficient: Multiple passes
filterData(data);        // Pass 1
applySorting(data);      // Pass 2
paginate(data);          // Pass 3
data.forEach(format);    // Pass 4
data.forEach(render);    // Pass 5
```

### 2. Set-Based Selection

Using `Set` for `state.selected` provides O(1) lookups:

```javascript
// O(1) - Constant time
state.selected.has(compositeKey);

// vs Array - O(n) linear time
state.selected.includes(compositeKey);
```

### 3. Batch DOM Updates

All row HTML generated in memory, single write to DOM:

```javascript
// Fast: Single DOM write
const html = rows.map(row => `<tr>...</tr>`).join('');
tbody.innerHTML = html;

// Slow: Multiple DOM writes
rows.forEach(row => {
  const tr = document.createElement('tr');
  tbody.appendChild(tr);  // DOM write per row
});
```

### 4. Render Guards

Prevent unnecessary renders:

```javascript
attributeChangedCallback(name, oldValue, newValue) {
  const render = (oldValue && (oldValue !== newValue)) || false;
  if (!render) return;  // Skip if value unchanged
  // ... proceed with render
}
```

### 5. Lazy Print Initialization

Print preview component only loaded when needed:

```javascript
if (!printPreview) {
  printPreview = document.createElement('print-preview');
  document.body.appendChild(printPreview);
}
```

## Lifecycle Hooks

```javascript
class DataGrid extends HTMLElement {
  constructor() {
    // ✅ Initialize instance properties
    // ❌ Don't touch DOM or attributes
  }
  
  connectedCallback() {
    // ✅ Component added to DOM
    // ✅ Fetch data, setup listeners
    // ✅ Initial render
  }
  
  disconnectedCallback() {
    // ✅ Component removed from DOM
    // ✅ Cleanup print templates
    // ✅ Remove event listeners (if needed)
  }
  
  attributeChangedCallback(name, oldValue, newValue) {
    // ✅ Attribute changed
    // ✅ Update state, re-render
  }
  
  adoptedCallback() {
    // ⚠️ Rare: Component moved to new document
    // Not currently used
  }
}
```

## Design Patterns

### 1. Context Object Pattern

All functions receive a `context` object with everything needed:

```javascript
const context = {
  ...this,              // Component instance
  state,                // Data state
  settings,             // Configuration
  formatters,           // Custom formatters
  i18n,                 // Translations
  table,                // <table> element
  form,                 // Navigation form
  wrapper,              // Container element
  log: this.log.bind(this),
  dispatch: this.dispatch.bind(this)
};

renderTBody(context);
```

**Benefits:**
- No `this` binding issues
- Easy to test (pass mock context)
- Clear dependencies

### 2. Event Delegation

Single listener on wrapper, route based on event.target:

```javascript
wrapper.addEventListener('click', (event) => {
  if (event.target.closest('th[data-sort]')) handleSort(event);
  else if (event.target.closest('td[contenteditable]')) handleEdit(event);
  else if (event.target.type === 'checkbox') handleSelect(event);
  // ...
});
```

**Benefits:**
- Works with dynamic content
- Fewer listeners (better performance)
- Automatic cleanup

### 3. Dependency Injection

Formatters, icons, i18n injected via properties:

```javascript
grid.formatters = myFormatters;
grid.i18n = myTranslations;
```

**Benefits:**
- Testable (inject mocks)
- Customizable (user-provided)
- No hard-coded dependencies

## Next Steps

- [State Management](state-management.md) - Deep dive into state
- [State Management](state-management.md) - Component state structure
- [Debugging](debugging.md) - Troubleshooting and optimization
