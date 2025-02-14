# DataMapper

A web component for importing and transforming CSV/TSV text files with a visual mapping interface.

## Installation

```bash
npm install @browser.style/data-mapper
```

## Basic Usage

```javascript
import '@browser.style/data-mapper';
```

```html
<data-mapper>
  <label part="row">
    <span part="label">File<abbr title="required">*</abbr></span>
    <input part="file" type="file" name="file" accept=".csv,.txt,.tsv">
  </label>
  <label part="row">
    <input type="checkbox" part="firstrow" name="firstrow" checked>
    <span part="label">First row contains headers</span>
  </label>
</data-mapper>
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

- `--accent-color`: Primary accent color (default: `light-dark(hsl(211, 100%, 50%), hsl(211, 60%, 50%))`)
- `--accent-color-text`: Text color for accent elements (default: `hsl(211, 100%, 95%)`)
- `--grey-light`: Light grey color (default: `#f3f3f3`)
- `--grey-dark`: Dark grey color (default: `#333`)
- `--data-mapper-button-bg`: Background color for buttons (default: `light-dark(var(--grey-light), var(--grey-dark))`)
- `--data-mapper-input-bg`: Background color for input fields
- `--data-mapper-input-placeholder`: Color for input placeholders
- `--data-mapper-close-bg`: Background color for close button

## Custom Mapping

```javascript
dataMapper.customMapping = [
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

- `boolean`: Converts values to true/false (truthy: 'true', '1', 'yes', 'y'; falsy: 'false', '0', 'no', 'n')
- `date`: Converts dates from MM/DD/YYYY to YYYY-MM-DD format
- `float`: Converts to floating point number (returns null if invalid)
- `int`: Converts to integer (returns null if invalid)
- `number`: Converts to number (returns null if invalid)

### Built-in Formatters

- `capitalize`: Capitalizes first letter
- `currency`: Formats as currency with 2 decimal places
- `lowercase`: Converts to lowercase
- `percentage`: Adds % symbol
- `removeSpaces`: Removes all spaces
- `slugify`: Creates URL-friendly slug (lowercase, hyphens, no special chars)
- `titleCase`: Capitalizes Each Word
- `trim`: Removes leading/trailing spaces
- `truncate`: Limits text to 100 characters with ellipsis
- `uppercase`: Converts to uppercase

## Custom Formatters

```javascript
dataMapper.formatters = {
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