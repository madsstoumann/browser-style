# DataGrid

**@browser.style/data-grid** is a powerful, autonomous web component for displaying and manipulating tabular data with built-in support for sorting, filtering, pagination, selection, editing, and printing.

## Features

- ✅ **Zero Dependencies** - Standalone web component using only native browser APIs
- ✅ **Sorting** - Click any column header to sort ascending/descending
- ✅ **Filtering** - Real-time search across all visible columns
- ✅ **Pagination** - Client-side or server-side pagination support
- ✅ **Selection** - Multi-row selection with keyboard navigation
- ✅ **Editing** - Inline cell editing (when enabled)
- ✅ **Export** - Export to CSV or JSON formats
- ✅ **Print** - Professional print layouts with customizable settings
- ✅ **Keyboard Navigation** - Full W3C ARIA grid keyboard shortcuts
- ✅ **Accessibility** - ARIA attributes for screen readers
- ✅ **Internationalization** - Multi-language support
- ✅ **Formatters** - Custom cell rendering functions
- ✅ **Responsive** - Adapts to different screen sizes
- ✅ **Expandable Rows** - Inline detail views via popovers
- ✅ **Density Control** - Compact/standard/comfortable row heights
- ✅ **Sticky Columns** - Optional sticky first column and header

## Version

Current version: **1.0.36**

## Installation

### Via npm

```bash
npm install @browser.style/data-grid
```

### Via CDN

```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@browser.style/data-grid/index.css">
<script type="module" src="https://cdn.jsdelivr.net/npm/@browser.style/data-grid/index.js"></script>
```

### Peer Dependencies

DataGrid requires these @browser.style packages:

- `@browser.style/base` - Base styles
- `@browser.style/icon` - Icon components
- `@browser.style/table` - Table styling
- `@browser.style/print-preview` - Print functionality
- `@browser.style/table-expand` - Expandable rows

## Quick Start

### Basic Usage

```html
<data-grid
  data="https://api.example.com/data"
  itemsperpage="25"
  searchable
  selectable>
</data-grid>
```

### With Inline Table

```html
<data-grid itemsperpage="10" searchable selectable>
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
        <td>John Doe</td>
        <td>john@example.com</td>
        <td>New York</td>
      </tr>
      <tr>
        <td>Jane Smith</td>
        <td>jane@example.com</td>
        <td>San Francisco</td>
      </tr>
    </tbody>
  </table>
</data-grid>
```

### With JavaScript

```javascript
const grid = document.querySelector('data-grid');

// Set data programmatically
grid.data = [
  { id: 1, name: 'John Doe', email: 'john@example.com', city: 'New York' },
  { id: 2, name: 'Jane Smith', email: 'jane@example.com', city: 'San Francisco' }
];

// Listen to events
grid.addEventListener('dg:selection', (e) => {
  console.log('Selected rows:', e.detail);
});

grid.addEventListener('dg:cellchange', (e) => {
  console.log('Cell changed:', e.detail);
});
```

## Architecture Overview

DataGrid is built with a modular architecture consisting of 8 core modules:

### Core Modules

| Module | Purpose | Lines |
|--------|---------|-------|
| **data.js** | Data parsing, normalization, and table extraction | 177 |
| **events.js** | Click event handling, custom events, cell editing | 215 |
| **events.keyboard.js** | Keyboard navigation, shortcuts, accessibility | 207 |
| **icons.js** | Icon definitions for UI elements | 21 |
| **print.js** | Print preview integration and templates | 132 |
| **render.form.js** | Navigation UI, search, filters, density controls | 101 |
| **render.table.js** | Table rendering, sorting, filtering, pagination | 296 |
| **utility.js** | Helper functions (pure, no side effects) | 101 |

**Total:** ~1,250 lines of modular code + 150 lines in index.js

### Operational Modes

DataGrid supports two operational modes:

#### 1. Internal Navigation (Default)
- Component handles all pagination, sorting, and filtering
- Entire dataset loaded into memory
- Best for: < 10,000 rows

#### 2. External Navigation
- Server handles pagination, sorting, and filtering
- Component dispatches `dg:requestpagechange` events
- Client fetches data per-page
- Best for: Large datasets (100,000+ rows)

Enable external navigation:

```javascript
grid.settings = { externalNavigation: true };

grid.addEventListener('dg:requestpagechange', async (e) => {
  const { page, direction } = e.detail;
  const response = await fetch(`/api/data?page=${page}&limit=25`);
  const data = await response.json();
  grid.data = data.items;
});
```

### Data Flow Pipeline

```
Data Source (URL/JSON/Table)
  ↓
parseData() - Normalize to thead/tbody structure
  ↓
State Object - Central data store
  ↓
renderTHead() - Generate header with sort indicators
  ↓
renderTBody() - Filter → Sort → Paginate → Format → Render
  ↓
DOM Update - Table rows updated
  ↓
Event Dispatch - Custom events emitted
```

### Key Design Principles

1. **Attribute-Driven Reactivity** - Attributes trigger renders via `attributeChangedCallback`
2. **Composite Keys** - Rows identified by multiple key fields for uniqueness
3. **Set-Based Selection** - `state.selected` uses Set for O(1) lookups
4. **Modular Architecture** - Each module has single responsibility
5. **Performance First** - Single-pass rendering, efficient filtering
6. **Accessibility** - Full ARIA support, keyboard navigation

## Browser Support

### Required Features
- **ES Modules** - All modern browsers
- **Custom Elements** - Chrome 54+, Firefox 63+, Safari 10.1+, Edge 79+
- **Crypto.randomUUID()** - Chrome 92+, Firefox 95+, Safari 15.4+
- **Popover API** - Chrome 114+, Safari 17+
- **ResizeObserver** - Chrome 64+, Firefox 69+, Safari 13.1+

### Progressive Enhancement
- Container queries (CSS) - Navigation degrades gracefully
- `light-dark()` (CSS) - Falls back to light mode
- `anchor()` positioning (CSS) - Popover positioning degrades

## Next Steps

- [Getting Started Guide](getting-started.md) - Detailed setup instructions
- [Getting Started](getting-started.md) - Learn about data formats and loading
- [Attributes](attributes.md) - All available configuration attributes
- [Events](events.md) - Event system and integration
- [Keyboard Shortcuts](keyboard-shortcuts.md) - Full keyboard navigation reference

## License

ISC License - see repository for details

## Author

**Mads Stoumann**

- GitHub: [@madsstoumann](https://github.com/madsstoumann)
- Website: [browser.style](https://browser.style)
