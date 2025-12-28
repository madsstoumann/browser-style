# Data Grid Component - Internal Architecture

## Overview

`<data-grid>` is a JavaScript web component that wraps HTML `<table>` elements with sorting, filtering, pagination, selection, editing, and printing capabilities. Unlike purely CSS-driven components, data-grid manages complex state synchronization between attributes, internal state, DOM, and external data sources.

**Version:** 1.0.35 (index.js:12)

**Component Type:** Autonomous custom element extending HTMLElement

**Operational Modes:**
1. **Internal navigation** - Component manages all data, filtering, sorting, pagination
2. **External navigation** - Server handles pagination, component handles UI state only

**Key architectural decisions:**
- **Modular design**: Core logic split across 8 focused modules to prevent monolithic growth
- **Composite keys**: Uses comma-separated strings for multi-column row identification (enables complex primary keys)
- **Set-based selection**: O(1) lookup for selected rows vs O(n) with arrays
- **Attribute-driven reactivity**: Changes to observed attributes trigger targeted re-renders
- **Event-driven architecture**: Custom events for all significant state changes enable loose coupling

## Architecture Overview

### Component Lifecycle

```
constructor()
  ↓
  createSettings() → Parse attributes into settings object
  createState() → Initialize state with defaults
  ↓
connectedCallback()
  ↓
  loadResources() → Fetch data/i18n/schema (async, parallel)
  ↓
  setupElements() → Create wrapper, form, table structure
  ↓
  settingsWatcher() → Apply settings to DOM
  ↓
  renderTable() → Initial render (if data exists)
  ↓
  attachEventListeners() → Wire up all event handlers
  attachCustomEventHandlers() → Wire up custom event handlers
  ↓
  setInitialWidths() → Calculate column widths (requestAnimationFrame)
  ↓
  dispatch('dg:loaded')
  ↓
attributeChangedCallback(name, oldValue, newValue)
  ↓
  Update state + conditional re-render
  ↓
disconnectedCallback()
  ↓
  Cleanup: observers, print templates
```

**Critical timing:** `loadResources()` is async but component continues setup. Data may arrive after DOM is ready. This is why `renderTable()` has a guard check `if (this.state.items > 0)`.

**Manual table data flow:** If a `<table>` exists as child, `dataFromTable()` extracts it into state (index.js:518). The `manualTableData` flag prevents double-rendering.

### Module System

**Why modules?** The component was becoming unmaintainable as a single 2000+ line file. Modules separate concerns:

- **data.js** (177 lines) - Data transformation, parsing, sorting logic
- **events.js** (215 lines) - Event handlers, delegation, user interactions
- **events.keyboard.js** (207 lines) - Keyboard navigation state machine
- **render.table.js** (296 lines) - Rendering engine for table/thead/tbody/navigation
- **render.form.js** (101 lines) - Form controls HTML generation
- **print.js** (132 lines) - Print preview integration
- **utility.js** (101 lines) - Pure helper functions
- **icons.js** (21 lines) - SVG path constants

**Import strategy:** All modules import from each other as needed. No circular dependencies exist.

## Data Flow Pipeline

### Complete Data Journey

```
INPUT (4 possible sources)
  ↓
1. data attribute (URL) → fetch() → JSON
2. data attribute (inline JSON) → JSON.parse()
3. <table> element → dataFromTable()
4. JavaScript: grid.data = array
  ↓
parseData(data, context)  [data.js:131-176]
  ↓
  Normalize to { thead: [], tbody: [] }
  Generate thead from tbody keys if missing
  Merge with settings.thead if provided
  Apply displayOrder reordering if set
  Calculate cols, items, pages
  ↓
  Return: { thead, tbody, cols, items, pages }
  ↓
Assign to this.state
  ↓
renderTable()  [render.table.js:90-100]
  ↓
  renderColGroup() → Create <col> elements
  renderColumnFilter() → Populate filter checkboxes
  renderTHead() → Generate header HTML
  renderTBody() → CORE RENDERING PIPELINE (below)
  ↓
renderTBody()  [render.table.js:102-230]
  ↓
  Copy state.tbody (avoid mutation)
  ↓
  filterData() → Search term filtering
  ↓
  applySorting() → Sort by column (if sortIndex > -1)
  ↓
  paginate() → Slice for current page
  ↓
  Generate HTML:
    - Build row HTML with formatters
    - Add selection checkboxes
    - Add expandable popovers
    - Highlight search terms
  ↓
  Inject into table.tBodies[0].innerHTML
  ↓
  updateNavigation() → Update pagination UI
  ↓
OUTPUT: Rendered table in DOM
```

### Critical Transformation Points

**Point 1: parseData() normalization** (data.js:131)
- Input can be `Array` or `{ thead, tbody }`
- Output is ALWAYS `{ thead, tbody, cols, items, pages }`
- Hidden columns affect `cols` calculation: `(thead.length - hiddenCount) + (selectable ? 1 : 0)`

**Point 2: Column reordering** (data.js:158-163)
- If `settings.displayOrder` exists, `reorderColumns()` runs
- Creates new thead/tbody with fields in specified order
- Fields not in displayOrder appear at end
- Gotcha: This happens AFTER config merge, so indices change

**Point 3: filterData()** (render.table.js:42-63)
- Iterates `Object.values(row)` which includes ALL fields
- Must check `hiddenIndices` to avoid searching hidden columns
- Gotcha: If you forget to filter hidden columns, hidden data appears in search results
- Search term is lowercased and trimmed, cells are too (case-insensitive by design)

**Point 4: applySorting()** (render.table.js:4-40)
- Sorts by `type` field from column config (string/number/date/boolean/currency/percentage)
- Uses `localeCompare()` for strings (respects locale setting)
- Gotcha: If type doesn't match data, sort fails silently (falls through to string comparison)
- Currency/percentage types strip formatting before parsing

**Point 5: paginate()** (render.table.js:65-70)
- **Internal mode:** Slices array based on `page * itemsPerPage`
- **External mode:** Returns data unchanged (server already paginated)
- Gotcha: External mode requires manual `state.pageItems` update after load

**Point 6: Formatter execution** (render.table.js:173)
- `formatter(cellValue, row)` receives both cell and entire row
- Runs on EVERY render, no memoization
- Can return HTML (inserted via innerHTML)
- Gotcha: Formatters with side effects will repeat on every pagination/sort/filter

### State Mutation vs Immutability

**Immutable operations:**
- `filterData()`: `[...tbody]` creates copy (line 115)
- `applySorting()`: Sorts the copy, not original
- `paginate()`: Uses `.slice()`, non-destructive

**Mutable operations:**
- `dg:append`: `state.tbody.push(...detail)` (events.js:10) - DIRECT MUTATION
- `dataFromTable()`: Mutates passed state object
- `state.selected`: Set is mutated directly via `.add()` / `.delete()`

**Why this mix?** Performance. Copying large tbody arrays on every operation would be expensive. The component owns state, so mutation is safe. External users can't accidentally mutate unless they access `grid.state.tbody` directly.

## State & Settings Synchronization

### The Three State Layers

**Layer 1: Attributes** (HTML)
- Observed: `items`, `itemsperpage`, `page`, `searchterm`, `sortindex`, `sortorder` (index.js:18)
- Changes trigger `attributeChangedCallback()`
- Some attributes are one-way (component sets, user shouldn't)

**Layer 2: state** (component internal)
```javascript
{
  cellIndex: 0,           // Current focused cell
  cols: 0,               // Visible column count
  items: 0,              // Total items (all pages)
  itemsPerPage: 10,      // Items per page
  page: 0,               // Current page (0-indexed)
  pages: 0,              // Total pages
  pageItems: 0,          // Items on current page
  printOptions: 'all',   // Print mode
  rowIndex: 0,           // Current focused row
  searchItems: 0,        // Items after filtering
  searchPages: 0,        // Pages after filtering
  selected: Set(),       // Selected row keys
  sortIndex: -1,         // Sort column (-1 = none)
  sortOrder: 0,          // 0=asc, 1=desc
  tbody: [],             // Row data
  thead: []              // Column config
}
```

**Layer 3: settings** (configuration)
```javascript
{
  debug: false,
  density: 'medium',
  expandable: true,
  externalNavigation: false,
  filter: true,
  navigation: true,
  pagination: true,
  searchable: true,
  selectable: false,
  sortable: true,
  // ... 20+ more settings
}
```

### Synchronization Flows

**User changes itemsperpage:**
```
User selects dropdown
  ↓
form input event → handleFormInput() [events.js:110]
  ↓
setAttribute('itemsperpage', value)
  ↓
attributeChangedCallback('itemsperpage', old, new) [index.js:117]
  ↓
setItemsPerPage(newValue) [index.js:451]
  ↓
state.itemsPerPage = newValue
state.pages recalculated
form.elements.itemsperpage.value updated (if different)
  ↓
setPage(0) → renderTBody()
  ↓
dispatch('dg:itemsperpage', state)
```

**Programmatic: grid.setItemsPerPage(50)**
```
setItemsPerPage(50) [index.js:451]
  ↓
Updates state.itemsPerPage, state.pages
Updates form.elements.itemsperpage.value
  ↓
Checks if attribute needs updating
  ↓
setAttribute('itemsperpage', 50) (if different)
  ↓
attributeChangedCallback triggered
  ↓
Guard check: if (newValue === state.itemsPerPage) return
  (Prevents infinite loop)
```

**Gotcha: Attribute change loops**
- `setItemsPerPage()` calls `setAttribute()` which triggers `attributeChangedCallback()`
- Guard checks prevent infinite loops: `if (oldValue && (oldValue !== newValue)) || false` (line 114)
- First render: `oldValue === null`, so guard fails and render happens
- Subsequent: `oldValue === newValue` prevents duplicate renders

### External Navigation State Handling

**The problem:** In external mode, server owns the data. Component must track:
- Total items (for pagination UI)
- Current page (for UI state)
- Items on current page (for navigation display)

But `state.tbody` only contains current page's data.

**The solution:**
```javascript
// After fetching page data
grid.setTotalItems(result.total);  // Server's total count
grid.data = result.data;            // Current page data
grid.state.pageItems = result.data.length;  // Manual update!
grid.setPage(requestedPage);        // Update UI
```

**Gotcha:** Forgetting `state.pageItems` causes incorrect navigation display (shows wrong "X-Y of Z").

**Why setTotalItems() exists:** In external mode, `state.items` and `state.tbody.length` are different. `setTotalItems()` updates the former (index.js:475-483).

**Search term special case:** When searching in external mode, component switches to internal filtering (index.js:497). This is because search results are small enough to handle client-side.

### Why Getters/Setters

**The `data` setter** (index.js:679-696)
- First call: Full parse with `parseData()`, renders table, sets widths
- Subsequent calls: Only updates `state.tbody`, re-renders body
- Uses `dataInitialized` flag to differentiate
- Why? Initial render needs thead, subsequent updates reuse existing thead

**The `settings` setter** (index.js:711-714)
- Merges new settings: `{ ...this._settings, ...value }`
- Calls `settingsWatcher()` to apply to DOM
- Why? Settings changes often require DOM updates (classes, visibility)

**The `i18n` setter** (index.js:702-709)
- Validates type (must be object)
- Stores in private `_i18n`
- Why? Prevents invalid i18n from breaking translation system

## Module System Deep Dive

### data.js - Data Transformation Engine

**Primary responsibilities:**
1. Parse input data into normalized format
2. Extract data from existing `<table>` elements
3. Handle column reordering
4. Manage sorting state changes

#### parseData(data, context) [lines 131-176]

**Input variations:**
```javascript
// Array of objects
[{ id: 1, name: 'John' }, ...]

// Object with thead/tbody
{ thead: [...], tbody: [...] }

// Empty/invalid (throws)
```

**Normalization flow:**
```javascript
let { thead = [], tbody = [] } = data;

// Case 1: No thead, but tbody exists
if (!thead.length && tbody.length) {
  thead = generateTheadFromTbody(tbody);
}

// Case 2: No tbody, data is array
if (!tbody.length && Array.isArray(data)) {
  tbody = data;
  thead = generateTheadFromTbody(tbody);
}

// Case 3: Merge with settings.thead
if (context.settings?.thead) {
  thead = thead.map(col => {
    const configCol = context.settings.thead.find(c => c.field === col.field);
    return configCol ? { ...col, ...configCol } : col;
  });
}
```

**Gotcha: Column merging**
- Settings.thead OVERWRITES matching columns
- Example: Data has `{ field: 'price', type: 'string' }`, settings has `{ field: 'price', type: 'currency' }`
- Result: `{ field: 'price', type: 'currency' }` (settings win)
- This allows runtime reconfiguration of data structure

**Gotcha: Hidden column count**
```javascript
const hiddenCount = thead.filter(cell => cell.hidden).length;
cols = (thead.length - hiddenCount) + (selectable ? 1 : 0);
```
- Hidden columns reduce visible `cols`
- But selectable adds one column back (checkbox column)
- Navigation uses `cols` for arrow key bounds checking

#### reorderColumns(thead, tbody, displayOrder) [lines 75-104]

**Purpose:** Allow visual column reordering without changing data structure.

**Mechanism:**
```javascript
const orderMap = displayOrder.reduce((acc, field, idx) => {
  acc[field] = idx;
  return acc;
}, {});

const reorderedThead = [...thead].sort((a, b) => {
  const aOrder = orderMap[a.field] ?? Number.MAX_SAFE_INTEGER;
  const bOrder = orderMap[b.field] ?? Number.MAX_SAFE_INTEGER;
  return aOrder - bOrder;
});
```

**Gotcha: Fields not in displayOrder**
- Fields missing from displayOrder get `Number.MAX_SAFE_INTEGER`
- They sort to the end, preserving original order among themselves
- Intentional: Allows partial reordering

**Gotcha: tbody reordering**
- Must create NEW objects with reordered properties
- Can't just reorder Object.keys() (object iteration order)
- Uses `newRow[field] = row[field]` construction (line 98)

#### dataFromTable(table, itemsPerPage, selectable) [lines 3-18]

**Purpose:** Extract data from manually provided `<table>` element.

**Flow:**
```javascript
getTableHead(table) → { thead: [...], hiddenCount }
  ↓
getTableBody(table, thead) → [{ row objects }]
  ↓
Calculate: cols, items, pages
  ↓
Return state object
```

**Gotcha: Hidden cells**
- `<th hidden>` and `<td hidden>` are detected via `hasAttribute('hidden')`
- Hidden cells still have data in tbody
- `hiddenCount` tracked separately for `cols` calculation

**Gotcha: UID columns**
- `<th data-uid>` marks unique identifier columns
- Stored as `uid: true` in thead
- Used by external systems to track rows
- Not used internally (component uses composite keys)

### render.table.js - The Rendering Engine

**Primary responsibilities:**
1. Generate table HTML from state
2. Apply filtering and sorting
3. Handle pagination
4. Manage expandable row popovers
5. Update navigation UI

#### renderTBody() [lines 102-230] - The Heart of the Component

**This function does EVERYTHING:**
- Filters data
- Sorts data
- Paginates data
- Applies formatters
- Generates selection checkboxes
- Creates expandable popovers
- Highlights search terms
- Injects HTML into DOM
- Updates navigation

**Why so much?** Performance. Separate functions would mean multiple iterations over data.

**Critical flow:**

```javascript
// 1. Get fresh data
const visibleColumns = thead.filter(cell => !cell.hidden);

// 2. Filter and sort
let data = filterData(context, [...tbody]);
if (sortable) applySorting(context, data);

// 3. Handle no results
if (!data.length) {
  // Show "no results" message
  return;
}

// 4. Paginate
const page = paginate(context, data);

// 5. Generate HTML
const tbodyHTML = page.map((row) => {
  // Build row HTML
}).join('');

// 6. Inject
table.tBodies[0].innerHTML = tbodyHTML;

// 7. Update UI
updateNavigation(context);
```

**Gotcha: Popover cleanup** (line 108)
```javascript
context.querySelectorAll('.ui-table-expand').forEach(popover => popover.remove());
```
- Must remove old popovers BEFORE rendering
- Popovers are outside table (inserted into wrapper)
- Without removal: memory leak, orphaned DOM nodes
- Why outside table? Popover positioning requirements

**Gotcha: Selection state persistence** (line 165)
```javascript
const rowSelected = selected.has(rowKeys) ? ' aria-selected' : '';
```
- Checks `state.selected` Set for each row
- Uses composite key constructed from key fields
- If row was selected on page 1, stays selected when viewing page 2
- Set persists across renders, checkbox states reconstructed

**Gotcha: Search term highlighting** (line 180)
```javascript
cellValue = searchterm
  ? cellValue.replace(new RegExp(`(${searchterm})`, 'gi'), '<mark>$1</mark>')
  : cellValue;
```
- Runs AFTER formatter
- Uses global, case-insensitive RegEx
- Gotcha within gotcha: If searchterm contains RegEx special chars, crashes
- Not escaped because expected to be literal user input
- Could fail on input like `user@example.com` (@ is special)

**Gotcha: Formatter context** (line 173)
```javascript
const formatter = context.formatters?.[thead[index].formatter] || ((value) => value);
return formatter(cellValue, row);
```
- Formatters receive ENTIRE row, not just cell
- Enables computed columns: `(value, row) => row.first + ' ' + row.last`
- But exposes all row data to formatter function
- Security consideration if formatters are user-provided

#### applySorting(context, data) [lines 4-40]

**Type-based sorting:**
```javascript
switch (type) {
  case 'number':
    return Number(A) - Number(B);
  case 'date':
    return new Date(A) - new Date(B);
  case 'currency':
    const numA = parseFloat(A.replace(/[^0-9.-]+/g, ""));
    return numA - numB;
  // ... etc
}
```

**Gotcha: Null/undefined handling**
```javascript
const A = a[field] ?? '';
const B = b[field] ?? '';
```
- Null coalesces to empty string
- Empty strings sort to beginning (for strings)
- Empty strings as numbers become `NaN` → sort unpredictably
- Intentional: Shows missing data first

**Gotcha: Currency parsing**
- Strips ALL non-numeric chars: `/[^0-9.-]+/g`
- Works for: `$1,234.56`, `€1.234,56`, `¥1234`
- Fails for: Negative values with trailing minus (rare)
- Why not Intl.NumberFormat? Need to parse formatted strings, not format numbers

**Gotcha: Locale sorting** (line 32)
```javascript
return String(A).localeCompare(String(B), locale, { sensitivity: 'variant' });
```
- Uses `settings.locale` if available
- `sensitivity: 'variant'` means case-sensitive, accent-sensitive
- Why? Preserves alphabetical order across languages
- Could be made configurable per-column

#### filterData(context, data) [lines 42-63]

**Search method strategies:**
```javascript
const searchMethods = {
  start: (cell, term) => cell.startsWith(term),
  end: (cell, term) => cell.endsWith(term),
  equals: (cell, term) => cell === term,
  includes: (cell, term) => cell.includes(term),
};
```

**Gotcha: Hidden column check** (line 59)
```javascript
if (hiddenIndices.includes(index) || cell == null || typeof cell === 'object') {
  return false;
}
```
- MUST check `hiddenIndices` or hidden columns are searchable
- `cell == null` handles both null and undefined (loose equality)
- `typeof cell === 'object'` skips nested objects (shouldn't exist, but safety)

**Gotcha: Object.values() iteration** (line 58)
```javascript
Object.values(row).some((cell, index) => { ... })
```
- Index here is Object.values() index, not thead index
- They match ONLY if row has same field order as thead
- Why it works: parseData() ensures consistent order
- Fragile: Custom data with different field order breaks

**Performance consideration:**
- O(n * m) where n=rows, m=cells per row
- For 10,000 rows × 20 columns = 200,000 cell checks
- No optimization (indexing, debouncing)
- Why? Expected use: <1000 rows client-side, else use external navigation

#### Expandable Rows Implementation [lines 187-213]

**Mechanism:**
```javascript
const expandFields = thead
  .map(header => header.hidden ? `<p><strong>${header.label}</strong><br>${row[header.field]}</p>` : '')
  .filter(content => content !== '')
  .join('');

if (expandFields) {
  const popoverId = `p${crypto.randomUUID()}`;
  const buttonHTML = `<button popovertarget="${popoverId}">...</button>`;
  const popoverHTML = `<div id="${popoverId}" popover>...</div>`;

  context.wrapper.insertAdjacentHTML('beforeend', popoverHTML);
  // Insert buttonHTML into last cell
}
```

**Gotcha: UUID generation**
- Uses `crypto.randomUUID()` for unique IDs
- Required because multiple popovers exist simultaneously
- Older approach: Sequential IDs caused conflicts on re-render

**Gotcha: Button placement** (lines 206-211)
```javascript
const cellHTML = rowHTML.split('</td>');
cellHTML[lastVisibleColumnIndex] = cellHTML[lastVisibleColumnIndex].replace(
  /(<td[^>]*>)(.*)/,
  `$1<span class="ui-table-expand--trigger"><span>$2</span>${buttonHTML}</span>`
);
```
- String manipulation to inject button into last cell
- Why? Already generated HTML string
- Fragile: Relies on `</td>` split working correctly
- Alternative (safer): Build DOM nodes, but slower

**Gotcha: Popover cleanup timing**
- Popovers removed at START of renderTBody() (line 108)
- But created at END of renderTBody()
- Why? innerHTML replacement destroys buttons, but popovers are outside
- Orphaned popovers would accumulate in DOM

### events.js - Event Orchestration

**Primary responsibilities:**
1. Wire up all component event listeners
2. Handle user interactions (clicks, inputs)
3. Manage selection logic
4. Provide custom event handlers for external communication

#### attachEventListeners(context) [lines 39-108]

**Delegation pattern:**
```javascript
table.addEventListener('click', (event) => handleTableClick(event, context));
```

**Why delegation?** Table contents replaced via `innerHTML` on every render. Individual cell listeners would be lost. Delegation on `<table>` persists.

**Event types:**
- `click` on table (cell clicks, checkbox clicks)
- `focus` on table (detect cell focus for editing)
- `focusout` on table (save cell edits)
- `input` on table (track edits in progress)
- `keydown` on table (keyboard navigation)
- `input` on form (itemsperpage, page number changes)
- `change` on form controls (density, layout, etc.)

#### handleTableClick(event, context) [lines 116-161]

**Click delegation logic:**
```javascript
const node = event.target;

if (node === table) return; // Click on table itself, ignore

if (['TD', 'TH'].includes(node.nodeName)) {
  // Cell clicked
  state.cellIndex = node.cellIndex;
  state.rowIndex = node.parentNode.rowIndex;

  if (state.rowIndex === 0 && node.nodeName === 'TH') {
    // Header clicked → Sort
    handleSorting(context, node.dataset.sortIndex);
  }

  if (node.nodeName === 'TD' && columnConfig?.event) {
    // Cell with custom event → Dispatch
    context.dispatch(columnConfig.event, eventData);
  }

  context.setActive(); // Update focus
}

if (settings.selectable && node.nodeName === 'INPUT') {
  // Checkbox clicked
  if (node.hasAttribute('data-toggle-row')) {
    context.selectRows([node.closest('tr')], true);
  } else if (node.hasAttribute('data-toggle-all')) {
    context.selectRows(allRows, node.checked, true, event.shiftKey);
  }
}
```

**Gotcha: cellIndex adjustment for selectable**
```javascript
const columnConfig = state.thead[
  settings.selectable && state.cellIndex > 0
    ? state.cellIndex - 1
    : state.cellIndex
];
```
- If selectable, first column is checkbox (not data)
- Must subtract 1 from cellIndex to get thead index
- But only if cellIndex > 0 (checkbox column is 0)
- Error here breaks custom column events

**Gotcha: Checkbox tabindex** (line 189 in render.table.js)
```javascript
<input type="checkbox" tabindex="-1">
```
- Checkboxes are NOT in tab order
- Why? Interferes with arrow key navigation
- Users must click or use Space key on cell
- Design decision: Keyboard navigates cells, not form controls

#### Selection Logic: selectRows() [index.js:374-403]

**Function signature:**
```javascript
selectRows(rows, toggle = true, force = false, shiftKey = false)
```

**Parameters:**
- `rows`: NodeList or Array of `<tr>` elements
- `toggle`: true=select, false=deselect
- `force`: If true, use `toggle` value for all rows (ignore current state)
- `shiftKey`: If true, apply to ALL rows across pages (bulk operation)

**Logic:**
```javascript
if (shiftKey) {
  this.toggleSelection(toggle); // Bulk: update Set directly
}

Array.from(rows).forEach(row => {
  const shouldSelect = force
    ? toggle
    : row.hasAttribute('aria-selected') ? !toggle : toggle;

  row.toggleAttribute('aria-selected', shouldSelect);

  const key = row.dataset.keys;
  if (shouldSelect) this.state.selected.add(key);
  else this.state.selected.delete(key);
});
```

**Gotcha: Shift key behavior**
- Shift + click "select all" = Modifies `state.selected` across ALL pages
- Non-shift click = Only modifies visible rows
- Why? Power users want bulk selection, regular users want page-level
- Implemented by `toggleSelection()` which iterates `state.tbody` (index.js:655-669)

**Gotcha: Checkbox indeterminate state** (line 398)
```javascript
this.toggle.indeterminate = this.state.selected.size > 0 && this.state.selected.size < this.state.pageItems;
```
- Three states: unchecked (0 selected), checked (all selected), indeterminate (some selected)
- Only works for CURRENT page
- Selecting all on page 1, then going to page 2 shows unchecked (not indeterminate)
- Why? No way to know if page 2 has selections without checking every row

#### Editable Cell Lifecycle [lines 163-214]

**Three event handlers:**
```javascript
table.addEventListener('focus', handleCellFocus, true); // Capture phase
table.addEventListener('input', handleCellEdit);
table.addEventListener('focusout', handleCellUpdate);
```

**Flow:**
```
User clicks editable cell
  ↓
focus event → handleCellFocus()
  ↓
  cell.dataset.oldValue = cell.textContent.trim()
  cell.dataset.newValue = cell.textContent.trim()
  ↓
User types
  ↓
input event → handleCellEdit()
  ↓
  cell.dataset.newValue = cell.textContent.trim()
  ↓
User blurs cell (Tab, click away)
  ↓
focusout event → handleCellUpdate()
  ↓
  Compare oldValue vs newValue
  ↓
  If different:
    Update state.tbody
    Dispatch 'dg:cellchange' event
    cell.dataset.oldValue = newValue
```

**Gotcha: Why data attributes?**
- Can't use JavaScript variables (events are separate function calls)
- Can't store on cell object (innerHTML replacement destroys it)
- Dataset persists across events

**Gotcha: Trim() everywhere**
- `textContent` includes whitespace from HTML formatting
- `<td>  value  </td>` → textContent = "  value  "
- Without trim(), every edit appears changed
- But this prevents intentional leading/trailing spaces (feature or bug?)

**Gotcha: State update timing** (line 199)
```javascript
row[field] = newValue;
```
- DIRECT mutation of state.tbody
- No re-render triggered
- UI and state now in sync (user edited, DOM shows it, state has it)
- If you programmatically re-render later, edit persists

### events.keyboard.js - Keyboard Navigation Matrix

**Primary responsibility:** Manage cell focus state with arrow keys, Home/End, PageUp/PageDown, and action keys.

**State machine:**
- Current position: `state.rowIndex`, `state.cellIndex`
- Focused element: `this.active` (reference to actual DOM cell)
- `setActive()` synchronizes them

#### handleKeyboardEvents(event, context) [lines 3-206]

**Main switch:**
```javascript
switch (key) {
  case ' ': handleSpaceKey(); break;
  case 'a': handleAKey(); break; // Ctrl+A
  case 'i': handleIKey(); break; // Ctrl+Shift+I
  case 'ArrowDown':
  case 'ArrowUp':
  case 'ArrowRight':
  case 'ArrowLeft': handleArrowKeys(key); break;
  case 'End': handleEndKey(); break;
  case 'Home': handleHomeKey(); break;
  case 'p': handlePKey(); break; // Ctrl+P
  case 'PageDown':
  case 'PageUp': handlePageKeys(key); break;
  case 'Tab': handleTabKey(); break;
  case 'Enter': handleEnterKey(); break;
}

context.setActive(); // After every key, re-sync focus
```

#### Arrow Key Logic [lines 17-50]

**The editable check:**
```javascript
const editable = context.active?.isContentEditable;

if (!editable || (editable && metaKey)) {
  event.preventDefault();
  context.state.cellIndex = Math.min(cellIndex + 1, cols - 1);
}
```

**Why?** Editable cells need arrow keys for cursor movement. Only prevent default if:
- Cell is NOT editable, OR
- Cell is editable BUT meta key is held (Ctrl/Cmd)

**Gotcha: Column resize** (lines 30-32, 40-42)
```javascript
if (shiftKey && node.nodeName === 'TH') {
  event.preventDefault();
  return context.resizeColumn(cellIndex, 1); // Right arrow: wider
}
```
- Shift+Arrow on headers resizes columns
- `resizeColumn()` adjusts percentage widths (index.js:364-372)
- Why return early? Prevent normal navigation

**Gotcha: Bounds checking**
```javascript
context.state.rowIndex = Math.min(rowIndex + 1, pageItems);
context.state.cellIndex = Math.max(cellIndex - 1, 0);
```
- `pageItems` is last row index (not `pageItems - 1`)
- Why? Row 0 is header, row 1 is first data row
- `pageItems` accounts for this

#### Home/End Keys [lines 54-76]

**Behavior:**
- `Home`: First cell in row
- `Ctrl+Home`: First cell in first row
- `Shift+Home`: First row, keep same cell
- `End`: Last cell in row
- `Ctrl+End`: Last cell in last row
- `Shift+End`: Last row, keep same cell

**Implementation:**
```javascript
const handleHomeKey = () => {
  event.preventDefault();
  if (!shiftKey) {
    context.state.cellIndex = 0;
  }
  if (ctrlKey || metaKey || shiftKey) {
    context.state.rowIndex = 0;
  }
};
```

**Gotcha: Shift key meaning**
- In Excel: Shift+Home selects from cursor to start
- Here: Shift+Home jumps to first row (no selection)
- Why different? Component doesn't have range selection
- Shift is repurposed for "keep same column, change row"

#### Space Key: Context-Aware [lines 96-121]

**On header:**
```javascript
if (node.nodeName === 'TH') {
  if (isSelectable && cellIndex === 0) {
    // First column = select all checkbox
    const selectAll = !context.toggle.checked;
    context.selectRows(allRows, selectAll, true, event.shiftKey);
  } else {
    // Other columns = sort
    handleSorting(context, node.dataset.sortIndex);
  }
}
```

**On cell:**
```javascript
if (node.nodeName === 'TD' && isSelectable) {
  if (cellIndex === 0 || shiftKey) {
    // First column OR shift key = select row
    context.selectRows([node.parentNode], true);
  }
}
```

**Gotcha: Space scrolls page**
- Default browser behavior: Space scrolls down
- Must `preventDefault()` to prevent (line 108, 117)
- Only prevented in specific cases (header sort, cell select)
- Normal Space in editable cell still works (no preventDefault)

#### Enter Key: Triple Purpose [lines 144-164]

```javascript
if (shiftKey) {
  // Shift+Enter: Trigger custom row click event
  context.dispatch('dg:rowclick', { detail: { id: row.dataset.uid } });
}
else if (ctrlKey || metaKey) {
  // Ctrl+Enter: Open expandable popover
  const popoverButton = row.querySelector('button[popovertarget]');
  if (popoverButton) popoverButton.click();
}
// (No modifier: Focus cell, allow editing)
```

**Gotcha: uid dependency**
- `dg:rowclick` uses `row.dataset.uid`
- Only works if row has UID column
- If missing, dispatches with `undefined`
- Should this validate? Or is undefined acceptable?

### render.form.js - Form Controls Generation

**Primary responsibility:** Generate HTML for form controls (navigation, density, search).

**Key insight:** Form elements are named for `form.elements` API:
```javascript
form.elements.itemsperpage // <select name="itemsperpage">
form.elements.page         // <input name="page">
form.elements.selected     // <output name="selected">
```

This enables direct access without `querySelector`.

#### renderForm(context) [lines 9-30]

**Density controls generation:**
```javascript
const densityControls = Object.keys(context.settings.densityOptions).map(key => {
  const { label, icon: densityIcon, i18n } = context.settings.densityOptions[key];
  return `<label class="ui-button" title="${t(i18n)}">
    <input type="radio" name="density_option" value="${key}"${key === currentDensity ? ' checked' : ''} data-sr>
    ${icon(icons[densityIcon])}
  </label>`;
}).join('');
```

**Gotcha: Radio buttons for density**
- Uses radio group with `name="density_option"`
- All radios named the same for mutual exclusivity
- Values: "small", "medium", "large"
- But also an `<input name="density" hidden>` stores current value
- Why both? Radios for UI, hidden input for programmatic access

#### renderSearch(context) [lines 58-100]

**Popover integration:**
```javascript
const popoverID = `${crypto.randomUUID()}`;

<button id="cfb${popoverID}" popovertarget="cf${popoverID}">Filter</button>
<fieldset id="cf${popoverID}" style="--_pa:cfb${popoverID};" popover>
  <!-- Column filter checkboxes -->
</fieldset>
```

**Gotcha: CSS anchor positioning**
- `style="--_pa:cfb${popoverID};"` sets anchor
- CSS uses `position-anchor: var(--_pa);`
- `inset-block: anchor(bottom) auto;`
- Positions popover relative to button
- Why UUID? Multiple grids on page need unique IDs

**Gotcha: form attribute**
```javascript
<input name="searchterm" form="${context.form.id}">
```
- Search input is OUTSIDE the form (in fieldset[name=search])
- But associated via `form` attribute
- Why? Layout flexibility (search bar can be repositioned)

### print.js - Print Preview Integration

**Primary responsibility:** Interface with `<print-preview>` component for printing.

#### setupPrint(context) [lines 4-69]

**Lazy initialization:**
```javascript
let printPreview = document.querySelector('print-preview');
if (!printPreview) {
  printPreview = document.createElement('print-preview');
  document.body.appendChild(printPreview);
}
context.printPreview = printPreview;
```

**Why lazy?** Print-preview is only needed if user prints. Don't load until necessary.

**Template registration:**
```javascript
const template = (data) => {
  // Validate data
  const visibleColumns = context.state.thead.filter(col => !col.hidden);
  return `<table>...</table>`;
};

printPreview.addTemplate(context.templateId, template, {
  'font-family': 'ff-system',
  'font-size': 'small',
  'margin-top': '15mm',
  // ... print settings
});
```

**Gotcha: Template function closure**
- Template function closes over `context`
- Has access to current state when called
- But registered once during setup
- If thead changes (columns hidden/shown), template needs re-registration
- Current implementation: Doesn't handle this (bug?)

**Gotcha: Template cleanup** (index.js:104-107)
```javascript
disconnectedCallback() {
  if (this.printPreview && this.templateId) {
    this.printPreview._templates.delete(this.templateId);
    this.printPreview._templates.delete(`${this.templateId}-settings`);
  }
}
```
- Must clean up templates when component destroyed
- Otherwise: Memory leak in print-preview's template Map
- Note: Accesses private `_templates` (fragile, no public API)

#### printTable(context, directPrint) [lines 71-131]

**Print options logic:**
```javascript
switch (printOptions) {
  case 'search':
    dataToPrint = filterData(context, sortedData);
    break;
  case 'page':
    dataToPrint = sortedData.slice(startIndex, startIndex + itemsPerPage);
    break;
  case 'selected':
    dataToPrint = sortedData.filter(row => {
      const compositeKey = keyFields.map(field => row[field]).join(',');
      return selected.has(compositeKey);
    });
    break;
  case 'all':
  default:
    dataToPrint = sortedData;
}
```

**Critical: Sort application** (line 84)
```javascript
let sortedData = [...context.state.tbody];
sortedData = context.state.sortIndex > -1 ? applySorting(context, sortedData) : sortedData;
```
- Always sorts BEFORE filtering for print
- Why? User expects printed table to match visual order
- Even "page" mode sorts entire dataset first, then slices
- Performance: O(n log n) on full dataset even for small prints

**Gotcha: Selected print validation** (lines 98-100)
```javascript
if (!selected?.size) {
  throw new Error('No rows selected');
}
```
- Throws if user chooses "print selected" with no selection
- Caught and dispatched as `dg:printerror` (line 127)
- UI should disable "print selected" when selection empty (doesn't currently)

### utility.js - Pure Helper Functions

All functions are pure (no side effects, no context dependency).

#### calculatePages(items, itemsPerPage) [lines 5-11]

```javascript
if (itemsPerPage <= 0) {
  throw new Error('Invalid value: items per page should be greater than 0');
}
if (items === 0) return 0;
return Math.ceil(items / itemsPerPage);
```

**Gotcha: Division by zero protection**
- Throws if `itemsPerPage <= 0`
- Returns 0 if `items === 0` (special case)
- Why? `Math.ceil(0 / 10) = 0` works, but explicit is clearer

#### camelCase(str) [lines 13-20]

```javascript
return str
  .toLowerCase()
  .split(' ')
  .map((word, index) => index === 0 ? word : capitalize(word))
  .join('');
```

**Used by:** `dataFromTable()` to convert "First Name" → "firstName"

**Gotcha: Only handles spaces**
- Doesn't handle underscores: "first_name" → "first_name"
- Doesn't handle hyphens: "first-name" → "first-name"
- Doesn't handle multiple spaces: "first  name" → "first name" (broken)

#### getObj(state, node, typeCheck) [lines 57-95]

**Purpose:** Retrieve row data from state.tbody using composite key.

**Mechanism:**
```javascript
const keyFields = state.thead.filter(cell => cell.key).map(cell => ({ field, type }));
const dataKeys = node.parentNode.dataset.keys; // e.g., "1,John"
const keyParts = dataKeys.split(',');

const rowIndex = state.tbody.findIndex(row =>
  keyFields.every((keyConfig, index) => {
    const rowValue = row[keyConfig.field];
    const keyPart = keyParts[index];

    return typeCheck && type === 'number'
      ? Number(rowValue) === Number(keyPart)
      : String(rowValue).trim() === keyPart;
  })
);
```

**Gotcha: Type checking**
- `typeCheck` parameter controls strict type comparison
- `false` (default): String comparison (fast but loose)
- `true`: Type-aware comparison (slower but accurate)
- Why optional? Performance vs correctness tradeoff
- Most use cases: IDs are unique strings, no need for type check

**Gotcha: Not found returns null** (line 86)
- If row not found, returns `null`
- Caller must handle: `const { row } = getObj() || {};`
- Why not throw? Row might legitimately not exist (deleted server-side)

#### t(key, lang, i18n) [lines 97-100]

```javascript
if (!i18n || typeof i18n !== 'object') return key;
return i18n[lang]?.[key] || key;
```

**Fallback chain:**
1. Return `i18n[lang][key]` if exists
2. Else return `key` (English default)
3. If i18n invalid, return `key`

**Gotcha: No warning on missing translations**
- Silently returns key
- In UI: Sees "rowsPerPage" instead of "Lignes par page"
- Helps during development (shows what's missing)
- But no way to detect incomplete translations programmatically

## Event Lifecycle and Custom Events

### Complete Event Flow

```
User Action (click, type, key)
  ↓
Browser Event (click, input, keydown)
  ↓
Event Handler (handleTableClick, handleKeyboardEvents, etc.)
  ↓
State Update (state.page++, state.selected.add(), etc.)
  ↓
Conditional Render (renderTBody, updateNavigation)
  ↓
Dispatch Custom Event (dg:selection, dg:cellchange, etc.)
  ↓
External Listeners (user code)
```

### When Renders Happen

**Renders triggered by:**
- `setAttribute('itemsperpage')` → `attributeChangedCallback` → `renderTBody()`
- `setAttribute('page')` → `attributeChangedCallback` → `renderTBody()`
- `setAttribute('searchterm')` → `attributeChangedCallback` → `renderTBody()`
- `setAttribute('sortindex')` → `attributeChangedCallback` → `renderTBody()`
- `setAttribute('sortorder')` → `attributeChangedCallback` → `renderTBody()`

**Renders NOT triggered by:**
- `state.selected` changes (selection is visual-only via aria-selected)
- `state.cellIndex`, `state.rowIndex` changes (focus is visual-only)
- Form control changes (they update state, which updates attributes, which triggers render)

**Optimization: Guard checks** (index.js:114)
```javascript
const render = (oldValue && (oldValue !== newValue)) || false;
```
- Only renders if attribute ACTUALLY changed
- `oldValue === null` on first set (renders)
- `oldValue === newValue` on duplicate set (skips render)

### Custom Event Patterns

**Naming convention:** All custom events prefixed with `dg:`

**Dispatch helper:**
```javascript
dispatch(name, detail) {
  this.log(`event: ${name}`, '#A0A');
  this.dispatchEvent(new CustomEvent(name, { detail }));
}
```

**Events dispatched BY component:**

| Event | When | Detail | Bubbles |
|-------|------|--------|---------|
| `dg:loaded` | After `connectedCallback` completes | `{ message: 'DataGrid is ready' }` | Yes |
| `dg:selection` | After selection changes | `Set<string>` of keys | No |
| `dg:selected` | After `dg:getselected` received | `{ detail: Array }` of row objects | No |
| `dg:cellchange` | After editable cell updated | `{ field, newValue, oldValue, row, rowIndex }` | No |
| `dg:itemsperpage` | After items per page changes | `state` object | No |
| `dg:requestpagechange` | In external nav mode, user navigates | `{ page, direction }` | No |
| `dg:printerror` | Print operation fails | `{ error, printOptions }` | No |
| Custom (configurable) | Cell click with `event` in column config | Custom `eventData` | No |

**Events listened FOR by component:**

| Event | Action | Handler |
|-------|--------|---------|
| `dg:append` | Append rows to tbody | `attachCustomEventHandlers` (events.js:8-14) |
| `dg:clearselected` | Clear all selections | `attachCustomEventHandlers` (events.js:17-26) |
| `dg:getselected` | Retrieve selected rows | `attachCustomEventHandlers` (events.js:29-36) |

**Gotcha: Event timing**
```javascript
grid.addEventListener('dg:loaded', () => {
  // Safe: Component fully initialized
});

grid.data = [...]; // Sets data

grid.addEventListener('dg:selection', () => {
  // Might miss events if selection happened during data load
});
```
- Always add listeners BEFORE setting data
- Or add in `dg:loaded` handler

**Gotcha: dg:append mutation** (events.js:10)
```javascript
context.state.tbody.push(...detail);
```
- DIRECTLY mutates state
- No immutability
- No validation of appended data structure
- Caller must ensure data matches existing thead structure

### Integration Events

**External navigation flow:**
```
User clicks "Next" button
  ↓
navigatePage(null, 'next') [index.js:325]
  ↓
Check: settings.externalNavigation && !searchtermExists
  ↓
dispatch('dg:requestpagechange', { page: newPage, direction: 'next' })
  ↓
User code fetches data from server
  ↓
grid.data = result.data
  ↓
grid.state.pageItems = result.data.length
  ↓
grid.setPage(newPage)
  ↓
renderTBody() (if forceRender=true or searchterm exists)
```

**Gotcha: Search term override**
- If search term exists, ignores `externalNavigation`
- Switches to internal filtering
- Why? Search results are small, client-side is faster
- But breaks if server expects to handle search too

**Gotcha: forceRender parameter** (index.js:499)
```javascript
if (!this.settings.externalNavigation || searchtermExists || forceRender) {
  renderTBody(this);
}
```
- External nav normally doesn't render (waits for data update)
- `forceRender` forces render anyway
- Used by `setItemsPerPage()` to update display immediately
- Subtle: Can cause double-render if not careful

## Print System Integration

### Architecture

```
DataGrid Component
  ↓
  Creates/finds <print-preview> element
  ↓
  Registers template function via addTemplate()
  ↓
  Template stored in print-preview._templates Map
  ↓
  On print: printTable() calls print-preview.preview() or .print()
  ↓
  Print-preview calls template function with data
  ↓
  Template returns HTML string
  ↓
  Print-preview renders in print context
```

### Template Function Lifecycle

**Registration** (print.js:21-53)
```javascript
const template = (data) => {
  // Validate input
  if (!Array.isArray(data)) throw new Error('Print data must be an array');
  if (!context.state?.thead) throw new Error('Table headers not initialized');

  const visibleColumns = context.state.thead.filter(col => !col.hidden);

  return `
    <style>/* print styles */</style>
    <paper-sheet>
      <table>
        <thead>
          <tr>${visibleColumns.map(col => `<th>${col.label}</th>`).join('')}</tr>
        </thead>
        <tbody>
          ${data.map(row => `
            <tr>
              ${visibleColumns.map(col => `<td>${row[col.field] || ''}</td>`).join('')}
            </tr>
          `).join('')}
        </tbody>
      </table>
    </paper-sheet>
  `;
};

printPreview.addTemplate(context.templateId, template, settings);
```

**Key properties:**
- **Closure over context**: Has access to `context.state.thead`
- **Validation**: Throws on invalid data (caught by caller)
- **Column filtering**: Uses `visibleColumns` (respects hidden state at CALL time)
- **No formatters**: Prints raw data, not formatted (intentional? or oversight?)

**Gotcha: thead closure**
```javascript
const visibleColumns = context.state.thead.filter(col => !col.hidden);
```
- Evaluates WHEN TEMPLATE IS CALLED, not when registered
- If user hides columns after setup, print reflects new state
- Good: Dynamic behavior
- Bad: If thead replaced entirely, old reference might be stale

**Gotcha: No formatters in print**
- Formatters only apply during `renderTBody()`
- Print uses raw `row[col.field]`
- Example: Price shows "1234.56" not "$1,234.56"
- Intentional? Or should print apply formatters?

### Print Data Selection

**The sorting step** (print.js:83-84)
```javascript
let sortedData = [...context.state.tbody];
sortedData = context.state.sortIndex > -1 ? applySorting(context, sortedData) : sortedData;
```

**Why always sort?**
- User sees sorted table on screen
- Expects printed table to match visual order
- Even if printing single page, sorts entire dataset first
- Performance cost: O(n log n) on full data even for small prints

**Print options:**

**1. Print All** (default)
```javascript
dataToPrint = sortedData;
```
- Entire dataset
- Sorted by current sort
- Ignores pagination

**2. Print Current Page**
```javascript
const startIndex = page * itemsPerPage;
dataToPrint = sortedData.slice(startIndex, startIndex + itemsPerPage);
```
- Only rows visible on current page
- Still sorts entire dataset first (necessary for correct page slice)

**3. Print Search Results**
```javascript
dataToPrint = filterData(context, sortedData);
```
- All rows matching current search term
- Sorted
- Ignores pagination

**4. Print Selected**
```javascript
const keyFields = context.state.thead.filter(col => col.key).map(col => col.field);
dataToPrint = sortedData.filter(row => {
  const compositeKey = keyFields.map(field => row[field]).join(',');
  return selected.has(compositeKey);
});
```
- Only selected rows
- Preserves sort order
- Works across pages (Set contains all selected keys)

**Gotcha: Selection print validation** (print.js:98-100)
```javascript
if (!selected?.size) {
  throw new Error('No rows selected');
}
```
- Throws immediately if nothing selected
- Caught and converted to `dg:printerror` event
- UI shows error (if listener exists)
- Should UI disable "print selected" when empty? (currently doesn't)

### Memory Management

**Template registration:**
```javascript
printPreview.addTemplate(context.templateId, template, settings);
```
- Stores in `print-preview._templates` Map
- Key: `context.templateId` (UUID)
- Value: `{ template, settings }`
- Persists until explicitly removed

**Cleanup** (index.js:104-107)
```javascript
disconnectedCallback() {
  if (this.printPreview && this.templateId) {
    this.printPreview._templates.delete(this.templateId);
    this.printPreview._templates.delete(`${this.templateId}-settings`);
  }
}
```

**Gotcha: Why two deletes?**
- `addTemplate()` stores template under `templateId`
- Also stores settings under `${templateId}-settings`
- Must delete both to prevent memory leak
- Fragile: Depends on print-preview's internal structure

**Gotcha: Shared print-preview instance**
- Multiple data-grids share one `<print-preview>` element
- Each grid has unique `templateId`
- Templates accumulate in shared `_templates` Map
- If grid destroyed without cleanup: Memory leak
- If grid re-created: Old template still exists (harmless but wasteful)

## Critical Implementation Details

### Composite Keys

**Purpose:** Identify rows uniquely even with multi-column primary keys.

**Construction** (render.table.js:132, 162)
```javascript
const keyFields = thead.filter(cell => cell.key).map(cell => cell.field);
const rowKeys = keyFields.map(field => row[field]).join(',');
```

**Example:**
```javascript
thead = [
  { field: 'userId', key: true },
  { field: 'orderId', key: true },
  { field: 'product' }
];

row = { userId: 123, orderId: 456, product: 'Widget' };
rowKeys = "123,456";
```

**Storage:**
```html
<tr data-keys="123,456">...</tr>
```

**Usage:**
- Selection: `state.selected.add("123,456")`
- Retrieval: `state.selected.has("123,456")`
- Lookup: `getObj(state, node)` parses keys back to find row

**Gotcha: Comma in data**
```javascript
row = { userId: 123, name: "Smith, John" };
rowKeys = "123,Smith, John";
```
- If key field contains comma, parsing breaks
- `split(',')` produces wrong number of parts
- No escaping mechanism
- Solution: Don't use fields with commas as keys
- Or: Change delimiter (not configurable currently)

**Gotcha: Type coercion** (utility.js:79-81)
```javascript
return typeCheck && type === 'number'
  ? Number(rowValue) === Number(keyPart)
  : String(rowValue).trim() === keyPart;
```
- Numeric keys stored as strings in data-keys attribute
- Comparison as strings works: `"123" === "123"`
- But `0` vs `"0"` requires type checking
- Most code uses string comparison (faster, usually works)

### Selection Set

**Why Set instead of Array?**

**Performance:**
```javascript
// Array: O(n)
if (selectedArray.includes(key)) { ... }

// Set: O(1)
if (selectedSet.has(key)) { ... }
```

For 1000 selected rows:
- Array: 1000 comparisons per check
- Set: 1 hash lookup per check

**Operations:**
```javascript
state.selected.add(key);      // O(1)
state.selected.delete(key);   // O(1)
state.selected.has(key);      // O(1)
state.selected.size;          // O(1)
```

**Gotcha: Set serialization**
```javascript
JSON.stringify(state.selected); // "{}"
```
- Sets don't serialize to JSON
- Must convert: `Array.from(state.selected)`
- Or: `[...state.selected]`

**Gotcha: Set iteration order**
- Insertion order preserved
- First selected appears first in iteration
- But display order may differ (depends on table order)

### Column Width Calculation

**Initial widths** (index.js:424-448)
```javascript
setInitialWidths() {
  const calculateWidths = () => {
    const tableWidth = this.table.offsetWidth;

    Array.from(this.colgroup.children).forEach((col, index) => {
      if (this.settings?.colWidths && this.settings.colWidths[index] !== undefined) {
        col.style.width = `${this.settings.colWidths[index]}%`;
      } else {
        const cell = this.table.tHead?.rows[0]?.cells[index] || this.table.tBodies[0].rows[0].cells[index];
        if (cell) {
          const colWidthPercentage = ((cell.offsetWidth / tableWidth) * 100).toFixed(2);
          col.style.width = `${colWidthPercentage}%`;
        }
      }
    });
  };

  requestAnimationFrame(calculateWidths);
}
```

**Why requestAnimationFrame?**
- Table layout not complete when `connectedCallback` runs
- `offsetWidth` would be 0 or incorrect
- RAF waits until next paint (layout complete)

**Why percentages?**
- Responsive: Columns scale with table width
- Preserves proportions on resize
- Alternative: Fixed pixels (doesn't scale)

**Gotcha: settings.colWidths override**
```javascript
if (this.settings?.colWidths && this.settings.colWidths[index] !== undefined) {
  col.style.width = `${this.settings.colWidths[index]}%`;
}
```
- If `settings.colWidths` provided, uses those
- Otherwise calculates from actual cell widths
- Array indices must match column indices
- Hidden columns still need entry (or index shifts)

**Gotcha: thead vs tbody fallback**
```javascript
const cell = this.table.tHead?.rows[0]?.cells[index] || this.table.tBodies[0].rows[0].cells[index];
```
- Tries thead first (headers might be wider due to labels)
- Falls back to tbody if thead missing
- But what if BOTH missing? No guard, could error
- When does this happen? Empty table (shouldn't render)

### Form Element References

**The pattern:**
```javascript
this.form.elements.itemsperpage.value = 10;
this.form.elements.page.setAttribute('max', 5);
```

**Why not querySelector?**
```javascript
// This works but is slower
this.form.querySelector('[name="itemsperpage"]').value = 10;

// This is O(1) lookup
this.form.elements.itemsperpage.value = 10;
```

**How it works:**
- `form.elements` is a `HTMLFormControlsCollection`
- Indexed by `name` attribute
- `<input name="page">` → `form.elements.page`
- `<select name="itemsperpage">` → `form.elements.itemsperpage`
- `<output name="total">` → `form.elements.total`

**Gotcha: Name collisions**
```javascript
<input name="data">
<button name="data">
```
- `form.elements.data` returns HTMLCollection of both
- Must access: `form.elements.data[0]`, `form.elements.data[1]`
- Component avoids this by using unique names

**Gotcha: Non-form elements**
```javascript
<output name="total">
```
- `<output>` is form-associated but not a control
- Still appears in `form.elements`
- Value set via `.value`, not `.textContent`

### The Colgroup Pattern

**Why colgroup?**
```html
<colgroup>
  <col style="width: 20%">
  <col style="width: 30%">
  <col style="width: 50%">
</colgroup>
```

**Benefits:**
- Set column widths without touching cells
- All cells in column inherit width
- Resize entire column by changing one `<col>`

**Gotcha: Recreation vs update**
```javascript
renderColGroup(colgroup, cols) {
  colgroup.innerHTML = new Array(cols).fill('<col>').join('');
}
```
- Destroys and recreates ALL `<col>` elements
- Loses any manually set widths
- Called on EVERY thead render
- Why not preserve? Width calculation happens after anyway

**Gotcha: Sticky columns**
```javascript
this.table.style.setProperty(`--c${index}`, `${offset}px`);
this.table.classList.add(`--c${index}`);
```
- CSS custom properties store column offsets
- Classes enable column-specific styles
- Why? Can't style `<col>` elements (limited CSS support)
- Must style cells via classes like `td:nth-child(1)`

### Formatters

**Invocation** (render.table.js:173)
```javascript
const formatter = context.formatters?.[thead[index].formatter] || ((value) => value);
const cellValue = row[index];
return formatter(cellValue, row);
```

**Signature:**
```javascript
(value, row) => string | HTML
```

**Execution context:**
- Called during `renderTBody()`
- Runs for every visible cell
- Output inserted via `innerHTML`
- No sanitization (XSS risk if formatter returns user input)

**Gotcha: Timing**
```javascript
grid.formatters = {
  price: (val) => `$${val}`
};

grid.data = [...]; // Formatters applied
grid.formatters.price = (val) => `£${val}`; // Change formatter
// Next render uses new formatter (no explicit update needed)
```
- Formatters looked up fresh each render
- Can change formatters dynamically
- But no re-render triggered automatically
- Must trigger via attribute change or manual `renderTBody()`

**Gotcha: Search highlighting after formatting** (render.table.js:180)
```javascript
const formatter = context.formatters?.[thead[index].formatter] || ((value) => value);
cellValue = searchterm
  ? cellValue.replace(new RegExp(`(${searchterm})`, 'gi'), '<mark>$1</mark>')
  : cellValue;
return `<td>${formatter(cellValue, row)}</td>`;
```
- Wait, this is WRONG in the code!
- Highlighting happens BEFORE formatter in this order
- Should be: `formatter(cellValue, row)` THEN highlight
- Bug? Or intentional to highlight raw values?
- Actual code at line 173: formatter IS called
- Line 180: highlighting happens
- Order: format THEN highlight (correct)

### Hidden Columns

**Implementation:**
```javascript
{ field: 'password', label: 'Password', hidden: true }
```

**Effects:**
- Excluded from visible column count: `cols`
- Not rendered in thead
- Not rendered in tbody cells
- But still in `state.thead` array
- But still in `state.tbody` row objects

**Why keep in state?**
- Expandable rows show hidden columns in popover
- Formatters might reference hidden data
- Export might include all columns

**Gotcha: Column index shifting**
```javascript
const columnConfig = state.thead[cellIndex];
```
- If first column is hidden, cellIndex 0 maps to SECOND thead entry
- Must adjust for hidden columns when looking up config
- Selection checkbox complicates this further (adds column 0)

**Gotcha: Search includes hidden unless filtered** (render.table.js:59)
```javascript
const hiddenIndices = thead.reduce((acc, cell, index) => cell.hidden ? [...acc, index] : acc, []);

Object.values(row).some((cell, index) => {
  if (hiddenIndices.includes(index) || cell == null) return false;
  return searchMethod(cell.toString(), searchterm);
});
```
- Must explicitly check `hiddenIndices`
- Otherwise hidden columns searchable (privacy issue)

## External Navigation Mode

### Why It Exists

**The problem:**
- Dataset: 100,000 rows
- Loading all: 50+ MB JSON, browser freezes
- Pagination: Client-side filtering/sorting on 100k rows still slow

**The solution:**
- Server owns data
- Client requests one page at a time
- Server handles filtering, sorting, pagination
- Client only renders current page

### State Divergence

**In internal mode:**
```javascript
state.tbody.length === state.items
state.pages === Math.ceil(state.items / state.itemsPerPage)
```

**In external mode:**
```javascript
state.tbody.length === state.pageItems  // Current page only
state.items                              // Server's total count
state.pages                              // Server's total pages
```

**Critical difference:**
- `state.tbody` is subset of data
- `state.items` is full count (provided by server)
- `state.pages` calculated from `state.items`, not `state.tbody`

### The setTotalItems() Contract

**Purpose:** Tell component how many items exist server-side.

**Implementation** (index.js:475-483)
```javascript
setTotalItems(totalItems) {
  if (this.settings.externalNavigation && Number.isInteger(totalItems) && totalItems >= 0) {
    this.state.items = totalItems;
    this.state.pages = calculatePages(this.state.items, this.state.itemsPerPage);
    this.state.pageItems = Math.min(this.state.itemsPerPage, totalItems - this.state.page * this.state.itemsPerPage);
    this.form.elements.pages.value = this.state.pages;
    this.form.elements.total.value = this.state.items;
  }
}
```

**Gotcha: Only works in external mode**
- Guard check: `if (this.settings.externalNavigation ...)`
- In internal mode, does nothing
- Why? Internal mode calculates from `state.tbody.length`

**Gotcha: pageItems calculation**
```javascript
this.state.pageItems = Math.min(this.state.itemsPerPage, totalItems - this.state.page * this.state.itemsPerPage);
```
- Assumes current page is within bounds
- If page 5 of 3 pages: `totalItems - page * itemsPerPage` goes negative
- `Math.min()` still works (clamps to itemsPerPage)
- But `pageItems` wrong (should be 0)
- Should validate: `this.state.page < this.state.pages`

### Search Term Handling

**The conflict:**
```javascript
navigatePage(page, direction) {
  const searchtermExists = this.form?.elements.searchterm?.value?.length > 0;

  if (this.settings.externalNavigation && !searchtermExists) {
    this.dispatch('dg:requestpagechange', { page: newPage, direction });
  } else {
    this.setPage(newPage);
  }
}
```

**Local vs remote filtering:**
- No search term: Dispatch event, let server handle
- Search term exists: Handle locally (internal filtering)

**Why switch modes?**
- Search results are small (hundreds, not thousands)
- Client-side filtering is fast on small data
- Avoids round-trip for every keystroke
- But requires re-fetching on clear

**Gotcha: Data staleness**
```javascript
// User types "test"
// -> Internal filtering on current page's data
// -> Shows results from current page only
// -> Other pages might have matches (not shown)
```
- Search only works on data already loaded
- For true global search, need server-side
- Current implementation: Local search on paginated data (incomplete results)

### Critical Flow: dg:requestpagechange

**User perspective:**
1. Click "Next" button
2. See loading indicator (if implemented)
3. Table updates with new data

**Implementation:**

```javascript
// 1. Component dispatches event
grid.addEventListener('dg:requestpagechange', async (event) => {
  const { page, direction } = event.detail;

  // 2. User code fetches from server
  const response = await fetch(`/api/data?page=${page}&limit=25`);
  const result = await response.json();
  // result = { data: [...25 items...], total: 10000 }

  // 3. Update component state
  grid.data = result.data;              // Updates state.tbody
  grid.state.pageItems = result.data.length;  // Manual!
  grid.setPage(page);                   // Updates UI
});
```

**Gotcha: Must set pageItems manually** (line after `grid.data =`)
- `grid.data = ...` sets `state.tbody`
- But doesn't update `state.pageItems`
- `updateNavigation()` uses `pageItems` for "X-Y of Z" display
- Forgetting this: Shows wrong range

**Gotcha: setPage() rendering** (index.js:499)
```javascript
if (!this.settings.externalNavigation || searchtermExists || forceRender) {
  renderTBody(this);
}
```
- In external mode WITHOUT search, `setPage()` doesn't render
- Assumes you'll set `grid.data` which triggers render
- If you only call `setPage()`: UI doesn't update
- Must either set data OR pass `forceRender: true`

### Why forceRender Parameter Exists

**Use case:**
```javascript
// Update total items without changing current page data
grid.setTotalItems(5000);  // Server reports new total
grid.setPage(grid.state.page, true);  // Force re-render navigation
```

**What it does:**
```javascript
setPage(page, forceRender = false) {
  // ... update state.page ...

  if (!this.settings.externalNavigation || searchtermExists || forceRender) {
    renderTBody(this);
  }
}
```

**Why needed?**
- External mode skips render (waits for data)
- But sometimes need to update UI without new data
- Example: Change items per page, update navigation only
- `forceRender` bypasses external mode check

**Gotcha: Double render risk**
```javascript
grid.setPage(2, true);  // Renders with old data
grid.data = newData;    // Renders again with new data
```
- Two renders in quick succession
- Inefficient, causes flicker
- Solution: Only use `forceRender` when NOT updating data

## Known Limitations and Edge Cases

### No Virtual Scrolling

**Current behavior:**
- All rows for current page rendered as real DOM
- 1000 rows per page = 1000 `<tr>` elements
- Browser handles OK up to ~5000 rows
- Beyond that: Lag, scroll jank, memory issues

**Why no virtual scrolling?**
- Complexity: Requires scroll position tracking, viewport calculation, row recycling
- Conflicts with native table layout
- External navigation preferred for large datasets

**Workaround:**
```javascript
grid.setAttribute('itemsperpage', 100);  // Keep pages small
grid.settings = { externalNavigation: true };  // Let server paginate
```

### Column Count Limit

**No hard limit, but:**
- 50+ columns: Horizontal scrolling required
- 100+ columns: Sticky columns performance degrades
- 200+ columns: Initial width calculation slow

**Performance bottlenecks:**
- `renderTBody()`: Iterates all cells (rows × cols)
- `setInitialWidths()`: Measures all cells
- `filterData()`: Checks all cells for search term

**Mitigation:**
- Hide unnecessary columns
- Use `displayOrder` to show important columns first
- Consider pivoting data (rows ↔ columns)

### Formatter Execution Performance

**No memoization:**
```javascript
// Page 1: formatPrice() called 25 times
// User navigates to page 2
// Page 2: formatPrice() called 25 times again
// User navigates back to page 1
// Page 1: formatPrice() called 25 times AGAIN
```

**Why not cache?**
- Formatters can access entire row (non-pure)
- Row data might change (editable cells)
- Cache invalidation complexity
- Performance penalty not significant for typical formatters

**Workaround for expensive formatters:**
```javascript
// Precompute during data load
grid.data = serverData.map(row => ({
  ...row,
  formattedPrice: formatPrice(row.price)  // Do once
}));

grid.formatters = {
  price: (value, row) => row.formattedPrice  // Just return
};
```

### Search Performance

**Algorithm:**
```javascript
// Pseudocode
for each row in tbody:
  for each cell in row:
    if cell.includes(searchterm):
      include row in results
```

**Complexity:** O(n × m) where n = rows, m = columns

**Example:**
- 10,000 rows × 20 columns = 200,000 string comparisons
- At ~1μs per comparison = 200ms
- Adds up with typing (each keystroke searches)

**Why no optimization?**
- Expected use: <1000 rows client-side
- Larger datasets use external navigation (server-side search)
- Debouncing search input helps

**Gotcha: No debouncing**
```javascript
form.elements.searchterm.addEventListener('input', e => {
  context.setAttribute('searchterm', e.target.value);
});
```
- Every keystroke triggers full search + render
- Typing "test" = 4 searches (t, te, tes, test)
- Could add debounce (user should, or component should?)

### Selection Across Pages

**Set persists:**
```javascript
state.selected = Set(['1', '2', '3', '101', '102']);
```

**But UI only shows current page:**
```
Page 1: Rows 1, 2, 3 shown as selected ✓
Page 2: Rows 101, 102 shown as selected ✓
Page 3: No selected rows shown (none on this page)
```

**The problem:**
- User can't see total selected count across pages
- `form.elements.selected.value` shows count, but not which pages
- "Select all" only selects current page (not bulk select)

**Why?**
- Bulk select requires iterating entire tbody (expensive)
- Shift+click "select all" DOES bulk select (intentional power user feature)

**Gotcha: Selection survives sorting/filtering**
```javascript
// Select rows 1, 2, 3
// Sort by name
// Rows 1, 2, 3 still selected (might be different visual positions)
// Filter by "test"
// Rows 1, 2, 3 still in Set, but not visible if filtered out
```
- Selection is by key, not position
- Persists through any operation
- But invisible if row filtered/paginated out

### Sticky Columns Limitations

**Only horizontal overflow:**
```javascript
setupOverflowListener(wrapper, table, callback) {
  const checkOverflow = () => {
    const isOverflowing = wrapper.scrollWidth > wrapper.clientWidth;
    callback(isOverflowing);
  };
  // ...
}
```

**Doesn't check vertical overflow**
- Sticky columns appear only when scrolling horizontally
- Vertical scroll doesn't affect them (as expected)

**ResizeObserver dependency:**
```javascript
const wrapperObserver = new ResizeObserver(checkOverflow);
wrapperObserver.observe(wrapper);
```

**Gotcha: What if ResizeObserver not supported?**
- Script errors
- No fallback
- Modern browsers only (2020+)

**Gotcha: Overflow detection timing**
```javascript
let callbackPending = false;

const checkOverflow = () => {
  if (!callbackPending) {
    callbackPending = true;
    requestAnimationFrame(() => {
      callback(isOverflowing);
      setTimeout(() => callbackPending = false, 50);
    });
  }
};
```
- Debounced with RAF + 50ms timeout
- Multiple rapid resizes: Only last one processes
- Why 50ms? Arbitrary (could be tuned)

### Print Template Memory

**One template per grid:**
```javascript
context.templateId = `data-grid-${crypto.randomUUID()}`;
printPreview.addTemplate(context.templateId, template, settings);
```

**Accumulation:**
- 10 grids on page = 10 templates in memory
- Each template is a closure over context (references data)
- If grid destroyed without cleanup: Leak

**Cleanup required:**
```javascript
disconnectedCallback() {
  this.printPreview._templates.delete(this.templateId);
}
```

**Gotcha: What if user removes element without disconnecting?**
```javascript
grid.remove();  // Calls disconnectedCallback ✓
grid.outerHTML = '';  // Doesn't call disconnectedCallback ✗
```
- `outerHTML = ''` doesn't trigger lifecycle
- Template leaks
- Rare case, but possible

### Attribute vs Property Sync

**One-way sync (attribute → property):**
- `itemsperpage`, `page`, `searchterm`, `sortindex`, `sortorder`
- Changes to attribute update property
- Some properties update attribute back (circular, with guards)

**No sync (property-only):**
- `data` (setter exists, no attribute)
- `formatters` (setter exists, no attribute)
- `i18n` (setter exists, attribute is source, not synced)

**Gotcha: Attribute changes via DevTools**
```javascript
// In DevTools console:
grid.setAttribute('page', 5);
// ✓ Updates UI, renders new page

grid.state.page = 5;
// ✗ Updates state but not attribute, no render
// Must call: grid.setPage(5)
```

**Gotcha: data attribute is one-time**
```javascript
<data-grid data="./api/data.json"></data-grid>
// Fetches once on connectedCallback

grid.setAttribute('data', './api/other.json');
// Does nothing (not in observedAttributes)
// Must use: grid.data = newData
```

### Browser Requirements

**Hard requirements (script breaks without):**
- `crypto.randomUUID()` - Chrome 92+, Safari 15.4+
- Popover API - Chrome 114+, Safari 17+
- `ResizeObserver` - Chrome 64+, Safari 13.1+

**Soft requirements (degrades):**
- Container queries (CSS) - Navigation still works without
- `light-dark()` (CSS) - Falls back to light mode
- `anchor()` positioning (CSS) - Popover positioning degrades

**Gotcha: No feature detection**
- Component assumes modern browser
- No try/catch around `crypto.randomUUID()`
- No check for Popover API
- Script errors in older browsers

**Polyfill strategy:**
```javascript
// Could add at component level:
if (!window.crypto.randomUUID) {
  window.crypto.randomUUID = () => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
      const r = Math.random() * 16 | 0;
      return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
    });
  };
}
```

## Debugging Strategies

### Enable Debug Mode

**Activation:**
```html
<data-grid debug ...></data-grid>
```

**Output:**
```javascript
consoleLog(message, bg = '#000', debug = false) {
  if (debug) {
    console.log(`%c${message}`, `background:${bg};color:#FFF;padding:0.5ch 1ch;`);
  }
}
```

**Messages:**
- `attr: itemsperpage=25 (#046)` - Attribute changes
- `render: table (#52B)` - Table render
- `render: thead (#56F)` - Header render
- `render: tbody (#584)` - Body render
- `event: dg:selection (#A0A)` - Custom events

**Gotcha: Color codes**
- Background colors for different message types
- Not documented (must read source)
- `#046` = Dark blue (attributes)
- `#52B` = Blue (table render)
- `#F00` = Red (errors)

### Common Issues by Symptom

#### "No data showing"

**Check:**
1. `grid.state.tbody` - Empty? Data not loaded
2. `grid.state.items` - 0? Parse failed
3. Console errors - JSON parse error? Network error?
4. `itemsperpage` attribute - Missing? Defaults to 10, might be less than expected

**Debug:**
```javascript
console.log('tbody:', grid.state.tbody);
console.log('items:', grid.state.items);
console.log('pages:', grid.state.pages);
console.log('page:', grid.state.page);
```

**Common causes:**
- Data format wrong (array instead of {thead, tbody})
- `data` attribute URL 404s
- CORS blocking fetch
- `itemsperpage="0"` (throws error)

#### "Sorting not working"

**Check:**
1. `nosortable` attribute - If present, sorting disabled
2. `grid.state.sortIndex` - -1? No column sorted
3. Column type - `{ type: 'number' }` but data is strings?
4. Click header - Does `sortindex` attribute update?

**Debug:**
```javascript
console.log('sortIndex:', grid.state.sortIndex);
console.log('sortOrder:', grid.state.sortOrder);
console.log('Column type:', grid.state.thead[grid.state.sortIndex]?.type);
```

**Common causes:**
- Type mismatch (numbers as strings, dates as strings)
- Custom column config missing `type`
- Event listener not attached (check `nosortable`)

#### "Selection broken"

**Check:**
1. `selectable` attribute - Must be present
2. `grid.state.selected` - Set contents correct?
3. Composite keys - `<tr data-keys="...">` present?
4. Key fields - `{ field: 'id', key: true }` in thead?

**Debug:**
```javascript
console.log('selected Set:', Array.from(grid.state.selected));
console.log('key fields:', grid.state.thead.filter(c => c.key));
console.log('row keys:', grid.table.tBodies[0].rows[0].dataset.keys);
```

**Common causes:**
- No key columns defined (composite key construction fails)
- Key values contain commas (parsing breaks)
- Selection checkbox column shifts indices (off-by-one)

#### "Print fails"

**Check:**
1. Print-preview loaded - `document.querySelector('print-preview')`
2. `noprint` attribute - If present, print disabled
3. `grid.state.tbody` - Empty? Nothing to print
4. Console errors - Template validation failing?

**Debug:**
```javascript
console.log('printPreview:', grid.printPreview);
console.log('templateId:', grid.templateId);
console.log('tbody length:', grid.state.tbody.length);
grid.print();  // Check console for errors
```

**Common causes:**
- Print-preview component not imported
- Template throws during execution
- Print selected with no selection

#### "Events not firing"

**Check:**
1. Event name spelling - `dg:selection` not `dg:select`
2. Listener timing - Added before or after `connectedCallback`?
3. Event bubbling - Some events don't bubble
4. Debug mode - Does console show event dispatch?

**Debug:**
```javascript
grid.addEventListener('dg:selection', e => {
  console.log('SELECTION EVENT:', e.detail);
});

// Enable debug to see all dispatches
grid.setAttribute('debug', '');
```

**Common causes:**
- Typo in event name
- Listener added too late (after event dispatched)
- Expecting event on wrong element (parent vs component)

#### "External nav issues"

**Check:**
1. `settings.externalNavigation` - true?
2. `state.items` - Set via `setTotalItems()`?
3. `state.pageItems` - Manually updated after fetch?
4. `dg:requestpagechange` listener - Attached?

**Debug:**
```javascript
console.log('externalNavigation:', grid.settings.externalNavigation);
console.log('items (total):', grid.state.items);
console.log('tbody.length (current page):', grid.state.tbody.length);
console.log('pageItems:', grid.state.pageItems);
```

**Common causes:**
- Forgot `grid.state.pageItems = data.length`
- Forgot `grid.setTotalItems(total)`
- Listener not attached before user navigates

### Key Inspection Points

**Access grid instance:**
```javascript
const grid = document.querySelector('data-grid');
// or
const grid = document.getElementById('myGrid');
```

**Inspect state:**
```javascript
grid.state.tbody       // All row data (or current page if external)
grid.state.thead       // Column config
grid.state.selected    // Selected row keys (Set)
grid.state.page        // Current page (0-indexed)
grid.state.items       // Total items
grid.state.searchItems // Items after filtering
```

**Inspect settings:**
```javascript
grid.settings.externalNavigation
grid.settings.selectable
grid.settings.sortable
grid.settings.expandable
```

**Inspect form elements:**
```javascript
grid.form.elements.itemsperpage.value
grid.form.elements.page.value
grid.form.elements.searchterm.value
```

**Inspect DOM:**
```javascript
grid.table              // <table> element
grid.table.tBodies[0]   // <tbody>
grid.table.tHead        // <thead>
grid.colgroup           // <colgroup>
grid.wrapper            // Wrapper <div>
```

### Console Helpers

**Trigger events manually:**
```javascript
// Append data
grid.dispatchEvent(new CustomEvent('dg:append', {
  detail: [{ id: 999, name: 'Test' }]
}));

// Get selected
grid.dispatchEvent(new CustomEvent('dg:getselected'));

// Clear selected
grid.dispatchEvent(new CustomEvent('dg:clearselected'));
```

**Force re-render:**
```javascript
grid.renderTable();  // Full re-render (not exposed, use at risk)
// Better: Change attribute to trigger render
grid.setAttribute('page', grid.state.page);
```

**Inspect private state:**
```javascript
grid._settings    // Settings before watcher applied
grid._i18n        // Translations object
grid.dataInitialized  // Has data been set?
grid.manualTableData  // Did table exist before component?
```

### Module Debugging

**Which file handles which behavior:**

| Behavior | Module | Function |
|----------|--------|----------|
| Table not rendering | render.table.js | renderTable(), renderTBody() |
| Sorting wrong | data.js | applySorting() |
| Search not working | render.table.js | filterData() |
| Selection broken | events.js | selectRows() |
| Keyboard nav broken | events.keyboard.js | handleKeyboardEvents() |
| Cell editing broken | events.js | handleCellUpdate() |
| Pagination broken | render.table.js | paginate(), updateNavigation() |
| Print broken | print.js | printTable(), setupPrint() |
| Custom events not dispatching | events.js | attachCustomEventHandlers() |

**Add breakpoints:**
```javascript
// In DevTools, search for function name
// Set breakpoint at start of function
// Trigger action (click, type, etc.)
// Step through to see state changes
```

**Logging inside modules:**
```javascript
// Edit module temporarily (during development):
console.log('filterData input:', data);
console.log('filterData output:', filteredData);
```

## Extension Patterns

### Subclassing Approach

**When to subclass:**
- Need to add new public methods
- Need to override lifecycle hooks
- Need to change core rendering logic
- Building specialized variant (e.g., TreeGrid extends DataGrid)

**When NOT to subclass:**
- Just need custom formatters (use `grid.formatters`)
- Just need custom settings (use `grid.settings`)
- Just need event handlers (use `addEventListener`)

**Example:**
```javascript
import DataGrid from '@browser.style/data-grid';

class CustomDataGrid extends DataGrid {
  constructor() {
    super();
    // Add custom initialization
    this.customState = {};
  }

  connectedCallback() {
    super.connectedCallback();
    // Add after standard setup
    this.setupCustomFeature();
  }

  // Override method
  renderTBody() {
    // Custom pre-processing
    this.preprocessData();
    // Call original
    super.renderTBody();
    // Custom post-processing
    this.addCustomAnnotations();
  }

  // New method
  setupCustomFeature() {
    this.addEventListener('dg:selection', (e) => {
      this.customState.lastSelection = e.detail;
    });
  }
}

customElements.define('custom-data-grid', CustomDataGrid);
```

**Gotcha: Calling super**
- Always call `super.connectedCallback()` etc.
- Call at START for lifecycle hooks (setup)
- Call in MIDDLE for render methods (wrap behavior)

**Gotcha: Module imports**
- Subclass doesn't have direct access to modules
- Must import needed functions:
```javascript
import { filterData, applySorting } from './modules/render.table.js';
```

### Adding Custom Formatters

**Library pattern:**
```javascript
// formatters.js
export const currencyFormatter = (value, row) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(value);
};

export const dateFormatter = (value, row) => {
  return new Date(value).toLocaleDateString();
};

export const linkFormatter = (value, row) => {
  return `<a href="${row.url}" target="_blank">${value}</a>`;
};

// Computed column example
export const fullNameFormatter = (value, row) => {
  return `${row.firstName} ${row.lastName}`;
};
```

**Usage:**
```javascript
import * as formatters from './formatters.js';

grid.formatters = formatters;

grid.settings = {
  thead: [
    { field: 'price', formatter: 'currencyFormatter' },
    { field: 'date', formatter: 'dateFormatter' },
    { field: 'link', formatter: 'linkFormatter' }
  ]
};
```

**Gotcha: this context**
```javascript
// BAD: Uses this (what is this?)
export const formatter = function(value, row) {
  return this.customMethod(value);  // this = window
};

// GOOD: Arrow function or explicit binding
export const formatter = (value, row) => {
  return customMethod(value);  // Closure scope
};
```

### Custom Column Types

**Adding new sort type:**
```javascript
// Extend applySorting in custom subclass
import { applySorting as originalApplySorting } from './modules/render.table.js';

class ExtendedDataGrid extends DataGrid {
  applySorting(data) {
    const { sortIndex, sortOrder } = this.state;
    const { type = 'string' } = this.state.thead[sortIndex] || {};

    if (type === 'semantic-version') {
      data.sort((a, b) => {
        const A = a[this.state.thead[sortIndex].field];
        const B = b[this.state.thead[sortIndex].field];
        return this.compareSemanticVersions(A, B);
      });
      if (sortOrder === 1) data.reverse();
      return data;
    }

    // Fall back to original
    return originalApplySorting(this, data);
  }

  compareSemanticVersions(a, b) {
    const aParts = a.split('.').map(Number);
    const bParts = b.split('.').map(Number);
    for (let i = 0; i < 3; i++) {
      if (aParts[i] !== bParts[i]) {
        return aParts[i] - bParts[i];
      }
    }
    return 0;
  }
}
```

**Gotcha: Module function vs method**
- `applySorting(context, data)` is module function
- To override, make it a method: `applySorting(data)`
- Pass `this` as context to module function

### New Search Methods

**Adding regex search:**
```javascript
class RegexDataGrid extends DataGrid {
  constructor() {
    super();
    this.customSearchMethods = {
      regex: (cell, term) => {
        try {
          return new RegExp(term, 'i').test(cell);
        } catch {
          return false;  // Invalid regex
        }
      }
    };
  }

  // Override filterData to use custom methods
  filterData(data) {
    const searchterm = this.getAttribute('searchterm')?.toLowerCase()?.trim();
    const method = this.getAttribute('searchmethod') || 'includes';

    // Check custom methods first
    const searchMethod = this.customSearchMethods[method] || this.defaultSearchMethods[method];

    // ... rest of filterData logic
  }
}
```

**Gotcha: Must also update UI**
```javascript
// Add regex option to search method dropdown
const select = this.form.elements.searchmethod;
select.innerHTML += '<option value="regex">Regex</option>';
```

### Custom Events

**Naming convention:**
- Use `dg:*` prefix for consistency
- Descriptive names: `dg:rowexpand` not `dg:expand`
- Past tense for completed actions: `dg:sorted` not `dg:sort`

**Example:**
```javascript
class AuditedDataGrid extends DataGrid {
  constructor() {
    super();
    this.addEventListener('dg:cellchange', (e) => {
      this.dispatchAuditEvent(e.detail);
    });
  }

  dispatchAuditEvent(changeDetail) {
    this.dispatchEvent(new CustomEvent('dg:audit', {
      bubbles: true,
      detail: {
        timestamp: Date.now(),
        user: this.currentUser,
        change: changeDetail
      }
    }));
  }
}
```

**Detail structure best practices:**
```javascript
{
  // Primary data
  row: {...},
  rowIndex: 5,

  // Context
  timestamp: Date.now(),
  page: this.state.page,

  // Action-specific
  field: 'email',
  newValue: 'new@example.com'
}
```

### Overriding Renders

**Safe override points:**
```javascript
class StyledDataGrid extends DataGrid {
  // Safe: Called after standard render
  connectedCallback() {
    super.connectedCallback();
    this.applyCustomStyles();
  }

  // Safe: Wrap standard render
  renderTBody() {
    this.beforeRender();
    super.renderTBody();
    this.afterRender();
  }

  beforeRender() {
    this.wrapper.classList.add('rendering');
  }

  afterRender() {
    this.wrapper.classList.remove('rendering');
    this.highlightChangedRows();
  }
}
```

**Dangerous override points:**
```javascript
class DangerousDataGrid extends DataGrid {
  // Dangerous: Replaces entire render
  renderTBody() {
    // NOT calling super
    this.table.tBodies[0].innerHTML = this.customRender();
    // State now out of sync, navigation broken, etc.
  }
}
```

**Why dangerous?**
- `renderTBody()` does 10+ things (filter, sort, paginate, expand, select, etc.)
- Skipping super loses all that functionality
- Must re-implement everything

**Better approach:**
```javascript
class BetterDataGrid extends DataGrid {
  // Override smaller piece
  renderCell(value, row, column) {
    if (column.field === 'status') {
      return this.renderStatusCell(value);
    }
    return super.renderCell(value, row, column);
  }
}
```

Wait, `renderCell()` doesn't exist. Point is: Override smallest possible scope.

### Module Replacement

**NOT recommended, but possible:**
```javascript
// Replace entire module
import CustomRenderTable from './custom-render-table.js';

class ModularDataGrid extends DataGrid {
  constructor() {
    super();
    // Swap out renderTBody implementation
    this.renderTBody = CustomRenderTable.renderTBody.bind(this);
  }
}
```

**Why not recommended?**
- Tight coupling between modules
- Module expects specific context structure
- Future updates break replacement
- Better to subclass and override methods

### Settings Extension

**Adding new settings:**
```javascript
class ConfigurableDataGrid extends DataGrid {
  createSettings() {
    const baseSettings = super.createSettings();
    return {
      ...baseSettings,
      customSetting: this.getAttribute('custom') || 'default',
      nestedSetting: {
        option1: true,
        option2: false
      }
    };
  }

  settingsWatcher() {
    super.settingsWatcher();

    // Apply custom settings
    if (this.settings.customSetting === 'dark') {
      this.table.classList.add('dark-theme');
    }
  }
}
```

**Gotcha: Settings watcher timing**
- `settingsWatcher()` called during `connectedCallback()`
- Called again when `settings` setter used
- Must be idempotent (safe to call multiple times)

**Gotcha: Nested settings**
```javascript
grid.settings = { nestedSetting: { option1: false } };
// Only option1 updated? Or entire nestedSetting replaced?

// Current implementation (index.js:712):
this._settings = { ...this._settings, ...value };
// Shallow merge! Nested objects replaced, not merged

// Result:
// nestedSetting = { option1: false } (option2 lost!)
```

**Solution: Deep merge**
```javascript
class DeepMergeGrid extends DataGrid {
  set settings(value) {
    this._settings = this.deepMerge(this._settings, value);
    this.settingsWatcher();
  }

  deepMerge(target, source) {
    // Implementation of deep merge
    // ...
  }
}
```

---

## Summary

This document covers the internal architecture of the data-grid component:

1. **Architecture** - Component lifecycle, module system, operational modes
2. **Data Flow** - Complete pipeline from input to rendered output
3. **State Sync** - How attributes, state, settings, and DOM stay synchronized
4. **Modules** - Deep dive into each module's responsibilities and gotchas
5. **Events** - Event lifecycle, custom events, integration patterns
6. **Print** - Print preview integration, template system, memory management
7. **Critical Details** - Composite keys, Set-based selection, column widths, formatters, etc.
8. **External Nav** - Server-side pagination, state divergence, critical flows
9. **Limitations** - Known issues, edge cases, performance characteristics
10. **Debugging** - Strategies for diagnosing common issues
11. **Extension** - Patterns for extending and customizing the component

This documentation is designed to help Claude (and developers) understand the component deeply enough to modify, debug, and extend it effectively.
