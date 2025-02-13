# TextImport

A web component for importing and transforming CSV/TSV text files with a visual mapping interface.

## Installation

```bash
npm install @browser.style/text-import
```

## Basic Usage

```javascript
import '@browser.style/text-import';
```

```html
<text-import>
  <label part="row">
    <span part="label">Import<abbr title="required">*</abbr></span>
    <input part="file" type="file" name="file" accept=".csv,.txt,.tsv">
  </label>
  <label part="row">
    <input type="checkbox" part="firstrow" name="firstrow" checked>
    <span part="label">First row contain headers</span>
  </label>
</text-import>
```

## Attributes

- `accept`: File types to accept (default: `.txt`)
- `label`: Label text for file input (default: `Select file`)
- `mapping`: JSON string for predefined field mappings
- `nomount`: Prevents automatic initialization
- `required`: Makes file input required

## Events

- `ti:processed`: Fired when file processing is complete. The `detail` property contains the processed data array.
- `ti:error`: Fired when an error occurs. The `detail` property contains the error message.
- `ti:close`: Can be dispatched to close the mapping interface.

## CSS Custom Properties

- `--accent-color`: Primary accent color
- `--accent-color-text`: Text color for accent elements
- `--grey-light`: Light grey color
- `--grey-dark`: Dark grey color
- `--text-import-button-bg`: Background color for buttons
- `--text-import-input-bg`: Background color for input fields
- `--text-import-input-placeholder`: Color for input placeholders
- `--text-import-close-bg`: Background color for close button

## Custom Mapping

```javascript
textImport.customMapping = [
  { 
    source: 'SOURCE_FIELD',    // Source field name
    target: 'target_field',    // Target field name
    order: 0,                  // Optional order for concatenated fields
    type: 'int',              // Optional data type converter
    formatter: 'titleCase',    // Optional text formatter
    prefix: 'Prefix: ',       // Optional prefix text
    suffix: '.'               // Optional suffix text
  }
];
```

### Available Type Converters

- `boolean`: Converts to boolean (true/false)
- `date`: Converts MM/DD/YYYY to YYYY-MM-DD
- `float`: Converts to floating point number
- `int`: Converts to integer
- `number`: Converts to number

### Built-in Formatters

- `capitalize`: Capitalizes first letter
- `currency`: Formats as currency (2 decimals)
- `lowercase`: Converts to lowercase
- `percentage`: Adds % symbol
- `removeSpaces`: Removes all spaces
- `slugify`: Creates URL-friendly slug
- `titleCase`: Capitalizes Words
- `trim`: Removes leading/trailing spaces
- `truncate`: Limits to 100 characters
- `uppercase`: Converts to uppercase

## Custom Formatters

```javascript
textImport.formatters = {
  isbn: str => {
    if (!str) return null;
    const cleaned = str.replace(/\D/g, '');
    return cleaned.length >= 13 ? cleaned.slice(0, 13) : cleaned;
  }
};
```

## Styling Parts

Use these part names to style component elements:

- `close`: Close button
- `file`: File input
- `firstrow`: First row checkbox
- `icon`: SVG icons
- `label`: Labels
- `mapping`: Mapping container
- `mapping-content`: Mapping fields container
- `mapping-header`: Column headers
- `mapping-input`: Mapping input fields
- `mapping-nav`: Navigation buttons
- `mapping-row`: Mapping row
- `output`: Preview/output area
- `preview`: Preview button
- `process`: Process button
- `row`: Form row