# DataMapper Component - Internal Architecture

## Overview

`<data-mapper>` is a Web Component that enables importing, transforming, and exporting data in multiple formats (CSV, JSON, NDJSON, TSV, XML, YAML). It provides a visual mapping interface for field transformation with type conversion and text formatting capabilities.

**Version:** Not specified in code

**Component Type:** Custom element extending HTMLElement (not FormElement)

**Key Features:**
- Multi-format import (CSV, JSON, NDJSON, TSV, XML, YAML)
- Multi-format export (same formats)
- Visual field mapping interface
- Type converters (boolean, date, float, int, number)
- Text formatters (capitalize, currency, lowercase, etc.)
- Multi-source field concatenation
- Live preview of transformed data
- Prefix/suffix support
- Configurable field ordering
- Internationalization support

**Key architectural decisions:**
- **Fullscreen popover**: Modal interface for mapping configuration
- **Internal CSV format**: All data converted to CSV for processing
- **Separate data formats module**: Parsers and converters in dataformats.js
- **Extensible converters/formatters**: Can add custom functions at runtime
- **Shadow DOM with adopted stylesheets**: Encapsulated styling

## Architecture Overview

### Component Lifecycle

```
constructor()
  ↓
  Read 'lang' and 'separator' attributes (lines 240-241)
  Attach shadow DOM with adopted stylesheet (lines 242-245)
  ↓
  If not 'nomount' attribute:
    #initialize() (line 247)
  ↓
#initialize()  [lines 471-491]
  ↓
  Generate random UID (lines 474-475)
  Read accept, label, required attributes (lines 476-478)
  Parse mapping attribute if present (lines 480-487)
  Call initializeComponent() (line 489)
  Set #initialized flag (line 490)
  ↓
initializeComponent()  [lines 284-301]
  ↓
  Query file input [part~=file] (line 286)
  Read firstrow checkbox state (line 288)
  Render shadow DOM template (line 291)
  Update datalists with converters/formatters (line 294)
  Setup event listeners (line 297)
  ↓
User selects file
  ↓
#processFile(file)  [lines 493-562]
  ↓
  Detect format from extension/content (line 499)
  Parse to objects (JSON/XML/YAML) or process as CSV/TSV (lines 506-544)
  Convert to internal CSV format (line 536)
  Get headers and render mapping UI (lines 545-547)
  Apply custom mappings if present (line 551)
  Trigger live preview (line 554)
  ↓
User configures mappings
  ↓
import()  [lines 314-317]
  ↓
  #getCurrentMappings() (line 315)
  #processMapping(mappings) (line 316)
  ↓
output(format)  [lines 319-328]
  ↓
  Convert to requested format via dataFormats
  ↓
download(format)  [lines 330-337]
  ↓
  Generate file and trigger download
```

### Module System

**Two-file component structure:**

- **index.js** (818 lines) - DataMapper class and styling
- **dataformats.js** (301 lines) - Format converters and parsers

**Import strategy:**
```javascript
import { dataFormats, mimeTypes, inputParsers } from './dataformats.js';
```

## Data Flow Pipeline

### Import Flow

```
File Input Selection
  ↓
#processFile(file)  [lines 493-562]
  ↓
  #detectFormat(file) (line 499)
    - Check extension (.csv, .json, etc.)
    - Check MIME type
    - Analyze content for .txt files
  ↓
  If CSV/TSV:
    FileReader.readAsText() (line 506)
    Auto-detect separator (line 514)
    Set this.content (lines 516-519)
  ↓
  If JSON/NDJSON/XML/YAML:
    FileReader.readAsText() (line 527)
    #parseInputFormat(text, format) (line 531)
    #objectsToCsv(data) (line 536)
    Set this.content (line 537)
  ↓
#getHeaders(lines)  [lines 437-456]
  ↓
  If firstrow=true: Use first line as headers
  Else: Generate COL 1, COL 2, etc.
  ↓
#renderMapping(headers)  [lines 649-785]
  ↓
  Create mapping UI with source/target/type/formatter/prefix/suffix
  Setup event listeners for live preview
  ↓
OUTPUT: Mapping interface ready for user configuration
```

### Export Flow

```
User clicks Import button
  ↓
import()  [lines 314-317]
  ↓
  #getCurrentMappings() (line 315)
    - Query all mapping rows
    - Extract target, type, formatter, prefix, suffix
    - Group by target field
  ↓
  #processMapping(mappings) (line 316)
    - For each content line:
      - For each target field:
        - #processTargetField() for conversion
    - Return array of objects
  ↓
output(format)  [lines 319-328]
  ↓
  dataFormats[format](data, options)
  ↓
  Return formatted string
  ↓
download(format)  [lines 330-337]
  ↓
  #downloadFile(content, filename, mimeType)
```

### Transformation Flow

```
#processTargetField(mappings, values)  [lines 631-647]
  ↓
  If single mapping:
    Get source value by index
    #convertField(value, mapping)
  ↓
  If multiple mappings (concatenation):
    For each mapping:
      #convertField(value, mapping)
    Join with concatenator (default: '\n')
  ↓
#convertField(value, mapping)  [lines 363-377]
  ↓
  If empty/null: return null
  ↓
  If type specified:
    Apply converter function (lines 366-368)
  ↓
  If formatter specified:
    Apply formatter function (lines 370-372)
  ↓
  If prefix/suffix specified:
    Prepend prefix (line 374)
    Append suffix (line 376)
  ↓
  Return transformed value
```

## Type Converters

### Built-in Converters (lines 155-173)

| Name | Input Examples | Output | Line |
|------|----------------|--------|------|
| `boolean` | 'true', '1', 'yes', 'y' | true | 156-161 |
| | 'false', '0', 'no', 'n' | false | |
| | Other | null | |
| `date` | '04/22/2025' | '2025-04-22' | 163-166 |
| `float` | '3.14' | 3.14 or null | 167 |
| `int` | '42' | 42 or null | 168 |
| `number` | '3.14' or '42' | Numeric or null | 169-172 |

### Adding Custom Converters

```javascript
const mapper = document.querySelector('data-mapper');
mapper.converters = {
  isbn: str => str.replace(/\D/g, '').slice(0, 13)
};
```

## Text Formatters

### Built-in Formatters (lines 175-197)

| Name | Input | Output | Line |
|------|-------|--------|------|
| `capitalize` | 'hello' | 'Hello' | 176 |
| `currency` | '19.5' | '19.50' | 177-180 |
| `lowercase` | 'HELLO' | 'hello' | 181 |
| `percentage` | '25' | '25%' | 182-185 |
| `removeSpaces` | 'hello world' | 'helloworld' | 186 |
| `slugify` | 'Hello World!' | 'hello-world' | 187-189 |
| `titleCase` | 'hello world' | 'Hello World' | 190-193 |
| `trim` | '  hello  ' | 'hello' | 194 |
| `truncate` | Long string | First 97 chars + '...' | 195 |
| `uppercase` | 'hello' | 'HELLO' | 196 |

### Adding Custom Formatters

```javascript
const mapper = document.querySelector('data-mapper');
mapper.formatters = {
  phoneFormat: str => str.replace(/(\d{3})(\d{3})(\d{4})/, '($1) $2-$3')
};
```

## Data Formats Module (dataformats.js)

### Format Converters

**CSV Converter (lines 7-38):**
```javascript
csv(data, options = {}) {
  // Options: delimiter, headers, quotes, replaceNewlines
  // Handles: escaping, quoting, empty values
}
```

**JSON Converter (lines 40-49):**
```javascript
json(data, options = {}) {
  // Options: pretty, space
  // Returns: JSON string
}
```

**NDJSON Converter (lines 51-52):**
```javascript
ndjson(data) {
  // Returns: Newline-delimited JSON
}
```

**TSV Converter (lines 54-60):**
```javascript
tsv(data, options = {}) {
  // Delegates to csv() with tab delimiter
}
```

**YAML Converter (lines 62-94):**
```javascript
yaml(data, options = {}) {
  // Options: flowStyle, indent
  // Handles: nested objects, arrays
}
```

**XML Converter (lines 96-124):**
```javascript
xml(data, options = {}) {
  // Options: root, item, pretty, indent
  // Includes: XML declaration
}
```

### Input Parsers

**CSV Parser (lines 137-159):**
- Handles delimiters, headers, trimming
- Auto-generates field names if no headers

**YAML Parser (lines 161-240):**
- Handles nested structures
- Converts boolean/number/null values
- Supports list syntax with `-` prefix

**XML Parser (lines 242-299):**
- Uses DOMParser
- Groups similar tags as arrays
- Handles attributes with `@` prefix
- Type conversion for primitives

### MIME Types (lines 127-134)

| Format | MIME Type |
|--------|-----------|
| csv | text/csv |
| json | application/json |
| ndjson | application/x-ndjson |
| tsv | text/tab-separated-values |
| yaml | application/x-yaml |
| xml | application/xml |

## DOM Structure

### Shadow DOM Template (lines 458-465)

```html
<datalist id="converters-{uid}">
  <!-- Converter options -->
</datalist>
<datalist id="formatters-{uid}">
  <!-- Formatter options -->
</datalist>
<fieldset part="mapping" id="popover-{uid}" popover>
  <!-- Mapping interface rendered by #renderMapping() -->
</fieldset>
```

### Mapping Interface Structure (lines 651-696)

```html
<fieldset part="mapping" popover>
  <div part="mapping-wrapper">
    <button part="close">×</button>
    <ul part="mapping-content">
      <li part="mapping-thead">
        <span>Source</span>
        <span>Target</span>
        <span>Type</span>
        <span>Formatter</span>
        <span>Prefix</span>
        <span>Suffix</span>
      </li>
      <!-- For each header: -->
      <li part="mapping-row">
        <span part="mapping-header">{header}</span>
        <input part="mapping-input" name="target">
        <input part="mapping-input" name="type" list="converters">
        <input part="mapping-input" name="formatter" list="formatters">
        <input part="mapping-input" name="prefix">
        <input part="mapping-input" name="suffix">
      </li>
    </ul>
    <nav part="mapping-nav">
      <small part="numobjects">{count} objects</small>
      <select part="outputformat">
        <option>json</option>
        <option>csv</option>
        <!-- etc. -->
      </select>
      <button name="updatetargets">Auto</button>
      <button name="download">Download</button>
      <button part="import" name="import">Import</button>
    </nav>
    <pre part="output">{preview}</pre>
  </div>
</fieldset>
```

### CSS Parts

| Part | Element | Purpose |
|------|---------|---------|
| `close` | button | Close button |
| `icon` | svg | Icon styling |
| `mapping` | fieldset | Main popover container |
| `mapping-wrapper` | div | Centered content wrapper |
| `mapping-content` | ul | Grid layout for mappings |
| `mapping-thead` | li | Header row |
| `mapping-row` | li | Data row |
| `mapping-header` | span | Column header |
| `mapping-input` | input | Mapping input fields |
| `mapping-nav` | nav | Navigation buttons |
| `button` | button | Standard buttons |
| `outputformat` | select | Format dropdown |
| `output` | pre | Output preview |
| `import` | button | Import button |
| `numobjects` | small | Record count |

## Public API

### Properties (Getters/Setters)

| Property | Type | Access | Purpose |
|----------|------|--------|---------|
| `converters` | Object | get/set | Type converter functions |
| `customMapping` | Array | get/set | Field mapping configuration |
| `formatters` | Object | get/set | Text formatter functions |
| `initialized` | Boolean | get | Initialization status |
| `content` | String | get/set | Raw CSV content |
| `outputData` | Array | get/set | Processed output data |

### Methods

| Method | Parameters | Returns | Purpose |
|--------|------------|---------|---------|
| `initializeComponent()` | None | Promise | Initialize component |
| `mount()` | None | Promise | Manual initialization |
| `import()` | None | Promise<Array> | Process and return data |
| `output(format)` | String | Promise<String> | Get formatted output |
| `download(format)` | String | Promise | Download as file |
| `addTemplate(name, template, settings)` | String, Function, Object | void | Add custom template |
| `defaultTemplate(data)` | Array | String | Default template |
| `setContent(html)` | String | void | Set content directly |

### Static Methods

| Method | Purpose |
|--------|---------|
| `register()` | Register custom element |

## Event System

### Custom Events Dispatched

| Event | Detail | Trigger | Line |
|-------|--------|---------|------|
| `dm:imported` | Array | Import button clicked | 741 |
| `dm:error` | `{ message }` | File processing fails | 557 |

### DOM Events Handled

| Event | Target | Handler | Purpose | Line |
|-------|--------|---------|---------|------|
| `change` | File input | #processFile | Process file | 796 |
| `beforetoggle` | Popover | Anonymous | Toggle input inert | 797 |
| `click` | Close button | Anonymous | Close popover | 722 |
| `click` | Update targets | Anonymous | Auto-fill targets | 725 |
| `click` | Import button | import() | Process data | 737 |
| `click` | Download button | download() | Export file | 751 |
| `change` | Format select | Anonymous | Update preview | 762 |
| `input` | Mapping inputs | #updateLivePreview | Update preview | 774 |

## Attributes Reference

### Configuration

| Attribute | Type | Default | Purpose |
|-----------|------|---------|---------|
| `lang` | String | 'en' | UI language code |
| `separator` | String | '\n' | Field concatenation separator |
| `accept` | String | See below | File input accept types |
| `label` | String | 'Select file' | File input label |
| `required` | Boolean | false | File input required |
| `mapping` | JSON String | null | Pre-configured mappings |
| `nomount` | Boolean | false | Defer initialization |

**Default accept:**
```
.csv,.json,.ndjson,.tsv,.txt,.xml,.yaml,.yml
```

## Integration Patterns

### Basic Usage

```html
<data-mapper>
  <label part="row">
    <span part="label">File</span>
    <input part="file" type="file" accept=".csv,.json">
  </label>
  <label part="row">
    <input type="checkbox" part="firstrow" checked>
    <span part="label">First row contains headers</span>
  </label>
</data-mapper>
```

### JavaScript Integration

```javascript
const mapper = document.querySelector('data-mapper');

// Add custom formatters
mapper.formatters = {
  isbn: str => str.replace(/\D/g, '').slice(0, 13)
};

// Set field mappings
mapper.customMapping = [
  { source: 'firstName', target: 'first_name' },
  { source: 'email', target: 'email', type: 'string' }
];

// Listen for import
mapper.addEventListener('dm:imported', e => {
  console.log('Data imported:', e.detail);
});

// Download processed data
await mapper.download('json');
```

### Pre-configured Mappings

```html
<data-mapper mapping='[
  {"source": "Name", "target": "name", "formatter": "titleCase"},
  {"source": "Price", "target": "price", "type": "float", "prefix": "$"}
]'>
  <!-- ... -->
</data-mapper>
```

### Multi-Source Field Concatenation

```javascript
mapper.customMapping = [
  { source: 'firstName', target: 'fullName|0' },
  { source: 'lastName', target: 'fullName|1' }
];
// Result: "John\nDoe" (using default separator)
```

### Event Handling

```javascript
mapper.addEventListener('dm:imported', (e) => {
  const data = e.detail;
  // Send to server
  fetch('/api/import', {
    method: 'POST',
    body: JSON.stringify(data)
  });
});

mapper.addEventListener('dm:error', (e) => {
  console.error('Import failed:', e.detail.message);
});
```

## Deep Dives

### Format Detection (lines 564-581)

```javascript
#detectFormat(file) {
  const ext = file.name.split('.').pop().toLowerCase();

  // Check extension first
  if (['csv', 'json', 'ndjson', 'tsv', 'xml', 'yaml', 'yml'].includes(ext)) {
    return ext === 'yml' ? 'yaml' : ext;
  }

  // Special handling for .txt
  if (ext === 'txt') {
    if (file.name.toLowerCase().includes('tsv')) return 'tsv';
    // Will be determined by content analysis later
    return 'csv';
  }

  // Fall back to MIME type
  const mimeMap = { 'text/csv': 'csv', 'application/json': 'json', /* ... */ };
  return mimeMap[file.type] || 'csv';
}
```

### Separator Auto-Detection (line 260)

```javascript
set content(value) {
  this.#state.separator = value?.includes('\t') ? '\t' : ',';
  this.#state.content = value;
}
```

**Logic:** If content contains tabs, assume TSV; otherwise CSV.

### Mapping Object Structure

```javascript
{
  source: 'SOURCE_FIELD_NAME',      // Required: source column
  target: 'target_field_name',      // Required: target field
  order: 0,                         // Optional: concatenation order
  type: 'int',                      // Optional: converter name
  formatter: 'titleCase',           // Optional: formatter name
  prefix: 'Prefix: ',               // Optional: prepend text
  suffix: '.'                       // Optional: append text
}
```

### Live Preview System (lines 707-720)

```javascript
this.#updateLivePreview = () => {
  // Temporarily limit content to first row
  const originalContent = this.#state.content;
  const lines = originalContent.split('\n');
  this.#state.content = lines.slice(0, 2).join('\n');

  // Get mappings and process
  const mappings = this.#getCurrentMappings();
  const preview = this.#processMapping(mappings);

  // Restore content
  this.#state.content = originalContent;

  // Format and display preview
  const format = this.#state.elements.output.dataset.format || 'json';
  this.#state.elements.output.textContent = dataFormats[format](preview);
};
```

## CSS Architecture

### Layout Grid (line 60)

```css
grid-template-columns: 150px 1fr 90px 110px 175px 175px;
```

Columns: Source | Target | Type | Formatter | Prefix | Suffix

### CSS Custom Properties

| Property | Default | Purpose |
|----------|---------|---------|
| `--accent-color` | hsl(211, 100%, 50%) | Import button |
| `--accent-color-text` | hsl(211, 100%, 95%) | Button text |
| `--grey-light` | #f3f3f3 | Light backgrounds |
| `--grey-dark` | #333 | Dark backgrounds |
| `--data-mapper-button-bg` | hsl(0, 0%, 90%) | Buttons |
| `--CanvasText` | hsl(0, 0%, 15%) | Text color |
| `--data-mapper-input-bg` | Derived | Input backgrounds |
| `--data-mapper-input-placeholder` | #CCC | Placeholders |
| `--data-mapper-close-bg` | Derived | Close hover |

## Gotchas and Edge Cases

### 1. Format Detection for .txt (lines 572-574)

**Issue:** .txt files need content analysis.

**Solution:** Check filename for 'tsv', analyze content for tabs.

### 2. Header Handling (lines 292-293)

**Issue:** `[part~=firstrow]` checkbox required for header detection.

**Impact:** Changing checkbox after load doesn't re-render.

### 3. Empty Field Handling (line 364)

**Issue:** Null/undefined/empty strings return null.

**Code:**
```javascript
if (!value && value !== 0) return null;
```

**Impact:** Cannot distinguish between null and empty string in CSV.

### 4. Type Conversion Failures (lines 167-168)

**Issue:** Invalid conversions return null silently.

**Impact:** No error reporting for failed conversions.

### 5. Popover Input State (lines 549-550)

**Issue:** Input becomes inert while popover open.

**Impact:** Cannot upload same file again without clicking.

### 6. UID Generation (lines 474-475)

**Issue:** Uses Uint8Array of 4 bytes.

**Impact:** Not guaranteed unique in rapid succession.

### 7. Live Preview Performance (lines 708-709)

**Issue:** Temporarily modifies content for preview.

**Impact:** Large files may show stale preview.

### 8. Multi-Source Concatenation Order

**Issue:** Order parsed from `target|order` format.

**Example:** `fullName|0`, `fullName|1`

**Impact:** Order determines concatenation sequence.

### 9. Separator vs Concatenator

**Issue:** `separator` attribute controls field separators, `concatenator` controls multi-source joining.

**Default concatenator:** '\n' (newline)

### 10. XML Attribute Handling (dataformats.js, line 280)

**Issue:** Attributes prefixed with `@`.

**Example:** `<item id="1">` → `{ "@id": "1" }`

## Dependencies

### Internal Module

```javascript
import { dataFormats, mimeTypes, inputParsers } from './dataformats.js';
```

### No External Dependencies

- Pure vanilla JavaScript
- Uses only standard browser APIs

### Browser APIs Used

| API | Purpose |
|-----|---------|
| `CustomEvent` | Event dispatching |
| `ShadowRoot` | Shadow DOM |
| `CSSStyleSheet` | Adopted stylesheets |
| `Popover API` | Modal popover |
| `DOMParser` | XML parsing |
| `File API` | File reading |
| `Blob API` | Downloads |
| `crypto.getRandomValues()` | UID generation |

## Internationalization

### i18n Object (lines 199-212)

```javascript
#i18n = {
  en: {
    close: 'Close',
    download: 'Download mapping',
    import: 'Import',
    numObjects: '{count} objects',
    outputFormat: 'Output format',
    updateTargets: 'Update targets from source'
  }
}
```

### Translation Helper (lines 801-803)

```javascript
#t(key) {
  return this.#i18n[this.#lang]?.[key] || key;
}
```

## File Summary

| File | Lines | Purpose |
|------|-------|---------|
| index.js | 818 | Main component + styling |
| dataformats.js | 301 | Format converters/parsers |
| index.html | ~200 | Demo page |
| package.json | ~50 | Package metadata |
| readme.md | ~150 | User documentation |
| demo.json | ~50 | Sample data |

## Summary Table

| Aspect | Details |
|--------|---------|
| **Total Lines** | 818 (index.js) + 301 (dataformats.js) |
| **Input Formats** | 6 (CSV, JSON, NDJSON, TSV, XML, YAML) |
| **Output Formats** | 6 |
| **Type Converters** | 5 built-in |
| **Text Formatters** | 10 built-in |
| **CSS Parts** | 16 |
| **CSS Custom Properties** | 8 |
| **Custom Events** | 2 (dm:imported, dm:error) |
| **Attributes** | 7 |
| **Dependencies** | None |
