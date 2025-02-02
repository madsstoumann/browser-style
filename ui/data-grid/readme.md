# DataGrid

A dynamic web component for creating interactive data grids with sorting, filtering, pagination, and internationalization support.

## Installation

```bash
npm install @browser.style/data-grid
```

## Usage

```javascript
import '@browser.style/data-grid';
```

```html
<!-- Basic usage -->
<data-grid
  data="/api/data"
  itemsperpage="10">
</data-grid>

<!-- Full featured -->
<data-grid
  data="/api/data"
  debug
  density="medium"
  export-csv
  export-json
  i18n="/api/i18n"
  itemsperpage="25"
  lang="en"
  printable
  searchable
  selectable
  stickycols="0,1"
  styles>
</data-grid>
```

## Attributes

- `data`: URL to fetch data or JSON string
- `debug`: Enable debug logging
- `density`: Row density ('small', 'medium', 'large')
- `export-csv`: Enable CSV export
- `export-json`: Enable JSON export
- `external-navigation`: Enable external page navigation
- `i18n`: URL to fetch translations
- `itemsperpage`: Items per page (default: 10)
- `lang`: Language code (default: 'en')
- `layoutfixed`: Fixed table layout (default: true)
- `noform`: Hide form controls
- `nonav`: Hide navigation
- `nopage`: Disable pagination
- `norows`: Hide rows per page selector
- `nosortable`: Disable sorting
- `page`: Initial page number
- `printable`: Enable print functionality
- `schema`: URL to fetch JSON schema
- `searchable`: Enable search functionality
- `selectable`: Enable row selection
- `stickycols`: Comma-separated sticky column indices
- `tableclasses`: Space-separated table CSS classes
- `textoptions`: Show text wrap/layout options
- `textwrap`: Enable text wrapping (default: true)
- `wrapperclasses`: Comma-separated wrapper CSS classes

## Events

- `dg:itemsperpage`: Items per page changed
- `dg:loaded`: Grid initialized
- `dg:requestpagechange`: Page change requested
- `dg:selection`: Selection changed

## Form Integration

```html
<form>
  <data-grid name="grid"></data-grid>
</form>
```

Access grid instance:
```javascript
const form = document.querySelector('form');
const grid = form.elements.grid;
```

## Custom Rendering

```javascript
const grid = document.querySelector('data-grid');
grid.addEventListener('dg:loaded', () => {
  // Grid is ready for customization
  console.log('Total items:', grid.state.items);
});
```

## External Navigation

```html
<data-grid
  data="/api/data?page=0&size=10"
  external-navigation
  itemsperpage="10">
</data-grid>
```

Handle page changes:
```javascript
grid.addEventListener('dg:requestpagechange', event => {
  const { page, direction } = event.detail;
  // Fetch new data and update grid
});
```
