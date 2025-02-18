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
- `lang`: Language code for UI text (default: `en`)
- `mapping`: JSON string for predefined field mappings
- `nomount`: Prevents automatic initialization
- `required`: Makes file input required
- `separator`: Character to use when concatenating multiple fields (default: `\n`)

## Methods

- `mount()`: Initialize component manually (when using `nomount`)
- `process()`: Process data with current mapping
- `preview(format)`: Generate preview in specified format
- `download(format)`: Download data in specified format
- `initializeComponent()`: Re-initialize the component

## Properties

- `content`: Get/set the raw content string
- `outputData`: Get/set processed data array
- `customMapping`: Get/set field mappings array
- `converters`: Get/set type converters object
- `formatters`: Get/set text formatters object

## Events

- `dm:processed`: Fired when file processing is complete. The `detail` property contains the processed data array.
- `dm:error`: Fired when an error occurs. The `detail` property contains the error message.
- `dm:close`: Can be dispatched to close the mapping interface.

## Output Formats
- CSV
- JSON
- NDJSON (Newline Delimited JSON)
- TSV
- XML
- YAML

## CSS Custom Properties

```css
:host {
  --accent-color: light-dark(hsl(211, 100%, 50%), hsl(211, 60%, 50%));
  --accent-color-text: hsl(211, 100%, 95%);
  --grey-light: #f3f3f3;
  --grey-dark: #333;
  --data-mapper-button-bg: light-dark(var(--grey-light), var(--grey-dark));
  --data-mapper-input-bg: light-dark(var(--grey-light), var(--grey-dark));
  --data-mapper-input-placeholder: light-dark(#CCC, #777);
  --data-mapper-close-bg: light-dark(var(--grey-dark), var(--grey-light));
}
```

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

### Custom Formatters

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

- `button`: Action buttons
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