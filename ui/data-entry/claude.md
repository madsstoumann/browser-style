# Data Entry Component - Internal Architecture

## Overview

`<data-entry>` is a JavaScript web component that generates dynamic forms from JSON Schema with support for nested objects, arrays, validation, auto-save, and external component integration. Unlike static form generators, data-entry handles bidirectional data flow between form inputs and JavaScript objects with real-time synchronization.

**Component Type:** Autonomous custom element extending HTMLElement

**Tag Name:** `<data-entry>`

**Total LOC:** ~3,442 lines across 9 modules

**Operational Modes:**
1. **Schema-driven** - JSON Schema defines form structure, validation, and rendering
2. **Auto-generated schema** - Schema inferred from data object structure
3. **External validation** - Custom validation function provided via attribute

**Key architectural decisions:**
- **Factory pattern**: Instance created via `createDataEntryInstance()` enables runtime extension
- **Template string resolution**: Dynamic values via `${path}`, `${t:key}`, `${v:constant}`, `${d:func}`
- **Render method dispatch**: Schema `render.method` determines field renderer (input, select, arrayUnit, etc.)
- **Path-based access**: Dot notation and bracket syntax for nested data (`items[0].name`)
- **Event-driven updates**: Custom events for all data changes enable parent component integration
- **Lazy component loading**: External components (auto-suggest, barcode-scanner) loaded on-demand

## Architecture Overview

### Component Lifecycle

```
constructor()
  ↓
  Create form element + instance factory
  Set language from attribute
  ↓
connectedCallback()
  ↓
  Load resources (parallel async):
    - data (URL or inline JSON)
    - schema (URL or inline JSON)
    - lookup (URL or inline JSON)
    - i18n (URL or inline JSON)
    - messages (URL or inline JSON)
  ↓
  Validate schema via validateMethod (if set)
  ↓
  Merge loaded resources into instance
  ↓
  renderAll() → Generate form HTML
  ↓
  mountComponents() → Initialize external components
  ↓
  Auto-save setup (if autosave attribute)
  ↓
  IntersectionObserver for navigation
  ↓
Ready for user interaction
  ↓
User input events
  ↓
syncInstanceData() → Update instance.data
  ↓
Dispatch 'de:custom' event
```

**Critical timing:** Resources load in parallel but rendering waits for all to complete. Schema is required; data is optional (defaults to empty object matching schema).

### Module System

**Why modules?** The component grew to 3000+ lines. Modules separate concerns:

- **index.js** (962 lines) - Main DataEntry class, lifecycle, public API
- **render.js** (752 lines) - All render methods for field types
- **utility.js** (440 lines) - Pure helper functions
- **components.js** (227 lines) - External component mounting and binding
- **schema.js** (214 lines) - Auto-schema generation from data
- **validate.js** (110 lines) - JSON Schema validation
- **dynamic.js** (99 lines) - Dynamic function library
- **factory.js** (69 lines) - Instance factory with extension API
- **custom.js** (3 lines) - Placeholder for custom methods

**Import strategy:** index.js imports from modules. Modules import from utility.js. No circular dependencies.

## Data Flow Pipeline

### Complete Data Journey

```
INPUT (4 possible sources)
  ↓
1. data attribute (URL) → fetch() → JSON
2. data attribute (inline JSON) → JSON.parse()
3. schema attribute → Auto-generate empty data
4. JavaScript: dataEntry.data = object
  ↓
Merge into instance.data (index.js:250)
  ↓
renderAll() [render.js:6-135]
  ↓
  Iterate schema.properties
  Generate HTML for each field based on render.method
  ↓
mountComponents() [components.js:44-63]
  ↓
  Detect custom elements in HTML
  Dynamically import their modules
  Bind event handlers
  ↓
HTML injected into form
  ↓
User interacts with form
  ↓
syncInstanceData() [index.js:399-475]
  ↓
  Read all form inputs
  Convert values to correct types
  Update instance.data object
  ↓
dispatch('de:custom', { data })
  ↓
OUTPUT: Updated data object available via dataEntry.data
```

### Critical Transformation Points

**Point 1: Schema property iteration** (render.js:6-135)
- Iterates `Object.entries(schema.properties)`
- For each property, determines render method from `property.render.method`
- Falls back to type-based defaults (string→input, array→arrayDetails)

**Point 2: Template string resolution** (utility.js:271-330)
- Patterns: `${path}`, `${t:key}`, `${v:constant}`, `${d:function(args)}`
- Resolved at render time against current data/i18n/constants
- Gotcha: Missing paths return empty string, not error

**Point 3: Path-based data access** (utility.js:133-189)
- Supports: `items[0].name`, `deeply.nested.path`
- `getObjectByPath(data, 'items[0].name')` returns value
- `setObjectByPath(data, 'items[0].name', newValue)` creates intermediate objects/arrays
- Gotcha: Bracket notation must use integers for arrays

**Point 4: Type conversion** (utility.js:98-112)
- Input values are always strings
- `convertValue(value, type)` handles: number, boolean, object, string
- Gotcha: Empty string for number becomes `0`, not `null`

**Point 5: Array entry management** (index.js:99-175)
- `addArrayEntry(path, item, method)` handles single additions
- Duplicate detection via configurable keys (render.duplicateCheck)
- Entry dialog via popover for user input

## State & Data Synchronization

### The Three Data Layers

**Layer 1: DOM (form inputs)**
- Actual HTML elements with values
- Source of truth during user interaction
- Named by path: `name="items[0].price"`

**Layer 2: instance.data (JavaScript object)**
- Structured data matching schema
- Updated via `syncInstanceData()` after changes
- Accessible via `dataEntry.data` getter

**Layer 3: instance.schema (configuration)**
- Defines structure, validation, rendering
- Contains render configuration per property
- Accessible via `dataEntry.schema` getter

### Synchronization Flow

**User types in input:**
```
<input name="product.name" value="Widget">
  ↓
input event
  ↓
syncInstanceData() [index.js:399-475]
  ↓
Iterate all form.elements
  ↓
For each element:
  Extract name (path) and value
  Convert value based on schema type
  setObjectByPath(instance.data, path, convertedValue)
  ↓
dispatch('de:custom', { action: 'update', data: instance.data })
```

**Programmatic update:**
```javascript
dataEntry.data = { product: { name: 'New Widget' } }
  ↓
set data() [index.js:66-77]
  ↓
deepMerge(instance.data, newData)
  ↓
renderAll() or targeted re-render
  ↓
DOM updated with new values
```

**Gotcha: Form elements vs data paths**
- Form elements named with full path: `items[0].variants[1].sku`
- Must match schema structure exactly
- Mismatch causes silent data loss (value stored nowhere)

### Auto-Save Mechanism

**Setup** (index.js:334-343):
```javascript
if (this.hasAttribute('autosave')) {
  const interval = parseInt(this.getAttribute('autosave'), 10) || 30000;
  this.autoSaveInterval = setInterval(() => {
    this.syncInstanceData();
    // Could trigger server save here
  }, interval);
}
```

**Gotcha:** Auto-save syncs data but doesn't persist. Must add event listener for actual persistence:
```javascript
dataEntry.addEventListener('de:custom', (e) => {
  if (e.detail.action === 'update') {
    saveToServer(e.detail.data);
  }
});
```

## Instance Factory System

### createDataEntryInstance(parent) [factory.js:9-68]

**Purpose:** Create extensible instance with methods, custom handlers, and dynamic functions.

**Structure:**
```javascript
{
  // Data references
  data: null,           // Current data object
  schema: null,         // JSON Schema
  lookup: [],           // Lookup tables for selects
  i18n: {},            // Translation strings
  constants: {},        // Static values

  // Method collections
  methods: { ...renderMethods },     // From render.js
  custom: { ...customMethods },      // From custom.js
  extensions: {
    customMethods: {},   // User-added custom methods
    renderMethods: {}    // User-added render methods
  },

  // Dynamic functions
  dynamicFunctions: { ...dynamicFunctions },  // From dynamic.js

  // Extension API
  extendRenderMethod(name, method) { ... },
  extendCustomMethod(name, method) { ... },
  extendDynamicFunction(name, func) { ... },
  getRenderMethod(name) { ... },
  getCustomMethod(name) { ... }
}
```

**Extension example:**
```javascript
const dataEntry = document.querySelector('data-entry');
dataEntry.instance.extendRenderMethod('colorPicker', function(data, config, instance) {
  return `<input type="color" name="${config.path}" value="${data}">`;
});
```

**Gotcha: Extension timing**
- Extensions must be added BEFORE `renderAll()` runs
- Use `connectedCallback` event or set before adding to DOM
- Extensions after render require manual re-render

### Method Resolution Order

```javascript
getRenderMethod(name) {
  return this.extensions.renderMethods[name]    // 1. User extension
      || this.methods[name]                     // 2. Built-in method
      || this.methods.input;                    // 3. Fallback to input
}
```

**Why fallback?** Unknown render methods shouldn't crash. Default to text input.

## Render Methods Deep Dive

### render.js - The Rendering Engine

**Primary responsibilities:**
1. Generate HTML for each schema property
2. Handle nested objects (recursive)
3. Handle arrays (multiple strategies)
4. Resolve template strings
5. Apply conditional rendering

### all(data, schema, instance, root, pathPrefix, form) [render.js:6-135]

**This is the main entry point for rendering:**

```javascript
export function all(data, schema, instance, root = false, pathPrefix = '', form = null) {
  const groupMap = new Map();
  const skipItems = new Set();
  let html = '';
  let nav = '';

  for (const [key, config] of Object.entries(schema.properties || {})) {
    // Skip if not configured for rendering
    if (!config.render) {
      skipItems.add(key);
      continue;
    }

    const path = pathPrefix ? `${pathPrefix}.${key}` : key;
    const value = getObjectByPath(data, path);

    // Get render method
    const method = instance.getRenderMethod(config.render.method);

    // Generate HTML
    html += method(value, { ...config, path, key }, instance);

    // Build navigation if root level
    if (root && config.render.nav) {
      nav += `<a href="#${key}">${config.title || key}</a>`;
    }
  }

  return { html, nav };
}
```

**Gotcha: Group handling** (lines 20-50)
- Properties can specify `render.group` to be grouped in fieldsets
- Groups collected first, then rendered together
- Order matters: grouped items appear where first group member was

### Array Render Methods

| Method | Purpose | Lines |
|--------|---------|-------|
| `arrayCheckbox` | Checkbox list for multi-select | 182-209 |
| `arrayDetail` | Single expandable item | 211-270 |
| `arrayDetails` | Multiple expandable items | 272-360 |
| `arrayGrid` | Grid layout for uniform items | 362-420 |
| `arrayLink` | Link list with actions | 422-475 |
| `arrayUnit` | Compact unit display | 477-540 |
| `arrayUnits` | Multiple compact units | 542-620 |

**arrayDetails** [render.js:272-360] - Most complex array renderer:

```javascript
export function arrayDetails(data, config, instance) {
  const items = Array.isArray(data) ? data : [];
  const itemSchema = config.items;

  return items.map((item, index) => {
    const path = `${config.path}[${index}]`;
    const summary = resolveTemplateString(config.render.summary, item, instance);

    return `
      <details data-path="${path}">
        <summary>${summary}</summary>
        <fieldset>
          ${all(item, itemSchema, instance, false, path).html}
        </fieldset>
      </details>
    `;
  }).join('');
}
```

**Gotcha: Index in path**
- Array items use bracket notation: `items[0].name`
- Index must be integer, not string
- Path parsing handles both: `items[0]` and `items.0`

### Form Element Render Methods

| Method | Purpose | Lines |
|--------|---------|-------|
| `input` | Text, number, date, etc. | 622-680 |
| `select` | Dropdown with options | 682-730 |
| `textarea` | Multi-line text | 732-752 |
| `richtext` | WYSIWYG editor | N/A (via richtext component) |
| `autosuggest` | Autocomplete input | N/A (via auto-suggest component) |
| `barcode` | Barcode scanner integration | N/A (via barcode-scanner component) |
| `datamapper` | Data import mapping | N/A (via data-mapper component) |
| `media` | Image/media display | 680-720 |
| `link` | Hyperlink display | 650-678 |

**input()** [render.js:622-680]:

```javascript
export function input(data, config, instance) {
  const {
    path,
    type = 'string',
    render = {}
  } = config;

  const inputType = render.inputType || typeToInputType(type);
  const value = data ?? render.default ?? '';
  const attributes = attrs(render.attributes || {});

  return `
    <label part="row">
      <span part="label">${resolveTemplateString(render.label || config.title, data, instance)}</span>
      <input
        type="${inputType}"
        name="${path}"
        value="${escapeHtml(value)}"
        ${attributes}
        part="input"
      >
    </label>
  `;
}
```

**select()** [render.js:682-730]:

```javascript
export function select(data, config, instance) {
  const options = fetchOptions(config, instance);
  const selectedValue = String(data ?? '');

  return `
    <label part="row">
      <span part="label">${config.render.label}</span>
      <select name="${config.path}" part="select">
        ${options.map(opt => `
          <option value="${opt.value}" ${opt.value === selectedValue ? 'selected' : ''}>
            ${opt.label}
          </option>
        `).join('')}
      </select>
    </label>
  `;
}
```

### fetchOptions(config, instance) [utility.js:194-245]

**Option sources (priority order):**
1. `config.render.options` - Inline array
2. `config.render.lookup` - Key in instance.lookup
3. `config.render.dataPath` - Path in instance.data
4. `config.render.localStorage` - Browser localStorage key

```javascript
export function fetchOptions(config, instance) {
  const render = config.render || {};

  // 1. Inline options
  if (Array.isArray(render.options)) {
    return render.options;
  }

  // 2. Lookup table
  if (render.lookup && instance.lookup) {
    const lookupData = instance.lookup.find(l => l.key === render.lookup);
    return lookupData?.options || [];
  }

  // 3. Data path
  if (render.dataPath) {
    return getObjectByPath(instance.data, render.dataPath) || [];
  }

  // 4. localStorage
  if (render.localStorage) {
    const stored = localStorage.getItem(render.localStorage);
    return stored ? JSON.parse(stored) : [];
  }

  return [];
}
```

**Gotcha: Option format**
- All sources must provide `[{ value, label }, ...]`
- Mismatch causes empty dropdown or errors

## Template String Resolution

### resolveTemplateString(template, data, instance, fallback) [utility.js:271-330]

**Pattern types:**

| Pattern | Example | Resolution |
|---------|---------|------------|
| `${path}` | `${product.name}` | Value from data object |
| `${t:key}` | `${t:labels.name}` | Translation from i18n |
| `${v:key}` | `${v:taxRate}` | Value from constants |
| `${d:func(args)}` | `${d:now(date)}` | Dynamic function result |

**Resolution flow:**
```javascript
export function resolveTemplateString(template, data, instance = {}, fallback = '') {
  if (typeof template !== 'string') return template;

  return template.replace(/\$\{([^}]+)\}/g, (match, expr) => {
    // Dynamic function: d:funcName(arg1, arg2)
    if (expr.startsWith('d:')) {
      const funcMatch = expr.slice(2).match(/^(\w+)(?:\(([^)]*)\))?$/);
      if (funcMatch) {
        const [, funcName, argsStr] = funcMatch;
        const func = instance.dynamicFunctions?.[funcName];
        if (typeof func === 'function') {
          const args = argsStr ? argsStr.split(',').map(a => a.trim()) : [];
          return func(...args);
        }
      }
      return fallback;
    }

    // Translation: t:key.path
    if (expr.startsWith('t:')) {
      return getObjectByPath(instance.i18n, expr.slice(2)) ?? fallback;
    }

    // Constant: v:key.path
    if (expr.startsWith('v:')) {
      return getObjectByPath(instance.constants, expr.slice(2)) ?? fallback;
    }

    // Data path
    return getObjectByPath(data, expr) ?? fallback;
  });
}
```

**Gotcha: Nested templates**
- Templates are NOT recursively resolved
- `${t:${language}.greeting}` does NOT work
- Must use direct paths

**Gotcha: Function arguments**
- Arguments are passed as strings
- Numbers must be parsed in function
- No complex expressions supported

## Dynamic Functions Library

### dynamicFunctions [dynamic.js:1-89]

**Date/Time functions:**
| Function | Example | Result |
|----------|---------|--------|
| `now(format)` | `${d:now(date)}` | `2024-01-15` |
| `today()` | `${d:today()}` | `2024-01-15` |
| `dateDifference(start, end)` | `${d:dateDifference(2024-01-01, 2024-01-15)}` | `14` |

**Format functions:**
| Function | Example | Result |
|----------|---------|--------|
| `formatCurrency(val, code)` | `${d:formatCurrency(1000, USD)}` | `$1,000.00` |
| `formatDate(val, locale)` | `${d:formatDate(2024-01-15, en-US)}` | `January 15, 2024` |
| `formatNumber(val, decimals)` | `${d:formatNumber(3.14159, 2)}` | `3.14` |
| `multiply(val, mult, dec)` | `${d:multiply(10, 1.25, 2)}` | `12.50` |

**String functions:**
| Function | Example | Result |
|----------|---------|--------|
| `capitalizeFirst(str)` | `${d:capitalizeFirst(hello)}` | `Hello` |
| `titleCase(str)` | `${d:titleCase(hello world)}` | `Hello World` |
| `slugify(str)` | `${d:slugify(Hello World)}` | `hello-world` |
| `uppercase(str)` | `${d:uppercase(hello)}` | `HELLO` |
| `lowercase(str)` | `${d:lowercase(HELLO)}` | `hello` |

**Random generators:**
| Function | Example | Result |
|----------|---------|--------|
| `uuid()` | `${d:uuid()}` | `550e8400-e29b-41d4-a716-446655440000` |
| `randomNumber(min, max)` | `${d:randomNumber(1, 100)}` | `42` |

**Extending dynamic functions:**
```javascript
import { extendDynamicFunction } from './modules/dynamic.js';

extendDynamicFunction('customFormat', (value) => {
  return `Custom: ${value}`;
});
```

## External Component Integration

### components.js - Lazy Loading System

**Component registry** [components.js:4-29]:
```javascript
const componentsInfo = {
  AutoSuggest: {
    bindFunction: bindAutoSuggest,
    path: '@browser.style/auto-suggest',
    tagName: 'auto-suggest',
  },
  BarcodeScanner: {
    bindFunction: bindBarcodeScanner,
    path: '@browser.style/barcode-scanner',
    tagName: 'barcode-scanner',
  },
  DataMapper: {
    bindFunction: bindDataMapper,
    path: '@browser.style/data-mapper',
    tagName: 'data-mapper'
  },
  RichText: {
    path: '@browser.style/rich-text',
    tagName: 'rich-text',
  },
  SnackBar: {
    bindFunction: bindSnackBar,
    path: '@browser.style/snack-bar',
    tagName: 'snack-bar',
  }
};
```

### mountComponents(HTML, dataEntry) [components.js:44-63]

**Purpose:** Scan rendered HTML for custom element tags, dynamically import modules.

```javascript
export async function mountComponents(HTML, dataEntry) {
  const importPromises = Object.entries(componentsInfo).map(
    async ([componentName, { bindFunction, path, tagName }]) => {
      if (HTML.includes(`<${tagName}`)) {
        try {
          const module = await import(path);
          const Component = module.default || module[componentName];
          Component.register();
          if (bindFunction) {
            bindFunction(dataEntry);
          }
        } catch (error) {
          console.error(`Failed to load component ${componentName}:`, error);
        }
      }
    }
  );
  await Promise.all(importPromises);
}
```

**Gotcha: Import map required**
- Component paths like `@browser.style/auto-suggest` need import map
- Without import map: `Failed to resolve module specifier`

### Component Binding Functions

**bindAutoSuggest** [components.js:67-73]:
- Listens for `autoSuggestSelect` event
- Maps selected item to data paths via `mapping` config
- Can sync directly to instance.data or just form inputs

**bindBarcodeScanner** [components.js:75-83]:
- Listens for `bs:entry` event
- Fetches product data from API
- Adds scanned item to array via `addArrayEntries()`

**bindDataMapper** [components.js:85-131]:
- Configures column mapping from schema
- Listens for `dm:imported` event
- Updates data array with imported records

**bindSnackBar** [components.js:134-146]:
- Creates `showMsg(message, type, duration)` method on dataEntry
- Falls back to console logging if snackbar not found

## Validation System

### validate.js - JSON Schema Validation

**validateData(schema, data)** [validate.js:47-109]:

```javascript
function validateData(schema, data) {
  function validateObject(schema, data, path = '') {
    let errors = [];

    for (const key of Object.keys(schema.properties)) {
      const propertyPath = path ? `${path}.${key}` : key;

      // Check required
      if (schema.required?.includes(key)) {
        if (data[key] === undefined) {
          errors.push({
            message: 'Missing required property',
            property: propertyPath,
            type: schema.properties[key].type,
            value: undefined
          });
          continue;
        }
      }

      const propertySchema = schema.properties[key];
      const value = data[key];

      // Validate type
      if (!validateType(value, propertySchema.type)) {
        errors.push({
          message: 'Invalid type for property',
          property: propertyPath,
          type: propertySchema.type,
          value
        });
        continue;
      }

      // Recurse into nested objects
      if (propertySchema.type === 'object') {
        const result = validateObject(propertySchema, value, propertyPath);
        errors = errors.concat(result.errors);
      }

      // Validate array items
      if (propertySchema.type === 'array') {
        value.forEach((item, index) => {
          const result = validateObject(propertySchema.items, item, `${propertyPath}[${index}]`);
          errors = errors.concat(result.errors);
        });
      }
    }
    return { valid: errors.length === 0, errors };
  }

  return validateObject(schema, data);
}
```

**validateType(value, type)** [validate.js:8-36]:
- Supports: integer, string, boolean, number, array, object, null
- Supports type arrays: `type: ['string', 'null']`

**Gotcha: Custom validation**
- Set `validatemethod` attribute to URL of custom validator
- Custom validator receives (schema, data) and returns { valid, errors }
- Runs INSTEAD of built-in validation, not in addition

## Schema Auto-Generation

### schema.js - Infer Schema from Data

**generateSchemaFromData(data, options)** [schema.js:25-100]:

```javascript
export function generateSchemaFromData(data, options = {}) {
  const schema = {
    type: 'object',
    properties: {},
    required: []
  };

  for (const [key, value] of Object.entries(data)) {
    const type = detectType(value);
    const property = { type };

    if (type === 'object' && value !== null) {
      Object.assign(property, generateSchemaFromData(value, options));
    }

    if (type === 'array' && value.length > 0) {
      property.items = generateSchemaFromData(value[0], options);
    }

    // Infer render method
    property.render = {
      method: generateRenderMethod(key, value, type)
    };

    schema.properties[key] = property;
  }

  return schema;
}
```

**generateRenderMethod(key, value, type)** [schema.js:102-150]:

```javascript
function generateRenderMethod(key, value, type) {
  if (type === 'array') return 'arrayDetails';
  if (type === 'object') return null; // Recurse into object
  if (type === 'boolean') return 'input';

  // String heuristics
  if (type === 'string') {
    if (isLikelyUrl(value)) return 'link';
    if (isLikelyImageUrl(value)) return 'media';
    if (value.length > 100) return 'textarea';
  }

  return 'input';
}
```

**Type detection heuristics:**
- `isLikelyUrl(value)` - Starts with http:// or https://
- `isLikelyImageUrl(value)` - URL ending in .jpg, .png, .gif, .svg, .webp
- `isLikelySkuOrId(value)` - Short alphanumeric string

## Events System

### Custom Events

| Event | When | Detail |
|-------|------|--------|
| `de:custom` | Any data change | `{ action, data, path?, value? }` |
| `de:entry` | Array entry added | `{ path, item, method }` |
| `de:resetfields` | Fields reset | `{ path }` |
| `de:submit` | Form submitted | `{ data, enctype }` |
| `de:notify` | Notification needed | `{ message, type }` |
| `de:array-control` | Array modified | `{ action, path, index? }` |

### Event Dispatch Pattern

```javascript
// From index.js
dispatchCustomEvent(action, detail = {}) {
  this.dispatchEvent(new CustomEvent('de:custom', {
    bubbles: true,
    composed: true,
    detail: { action, ...detail, data: this.instance.data }
  }));
}
```

**Gotcha: Event timing**
- `de:custom` fires AFTER data sync completes
- Listeners receive fully updated data
- Don't read form inputs directly, use event.detail.data

### Form Submission Handling

**handleDataSubmission()** [index.js:477-540]:

```javascript
async handleDataSubmission() {
  this.syncInstanceData();

  const enctype = this.form.enctype || 'application/json';
  const action = this.form.action;
  const method = this.form.method || 'POST';

  let body;
  switch (enctype) {
    case 'application/json':
      body = JSON.stringify(this.instance.data);
      break;
    case 'multipart/form-data':
      body = new FormData(this.form);
      break;
    case 'application/x-www-form-urlencoded':
      body = new URLSearchParams(new FormData(this.form));
      break;
  }

  if (action) {
    const response = await fetch(action, {
      method,
      headers: enctype === 'application/json'
        ? { 'Content-Type': 'application/json' }
        : {},
      body
    });
    // Handle response
  }

  this.dispatchEvent(new CustomEvent('de:submit', {
    bubbles: true,
    composed: true,
    detail: { data: this.instance.data, enctype }
  }));
}
```

## Utility Functions Deep Dive

### Path-Based Object Access

**getObjectByPath(obj, path)** [utility.js:133-160]:
```javascript
export function getObjectByPath(obj, path) {
  if (!obj || !path) return undefined;

  const parts = path.replace(/\[(\d+)\]/g, '.$1').split('.');

  return parts.reduce((current, part) => {
    if (current === undefined || current === null) return undefined;
    return current[part];
  }, obj);
}
```

**setObjectByPath(obj, path, value)** [utility.js:162-189]:
```javascript
export function setObjectByPath(obj, path, value) {
  if (!obj || !path) return;

  const parts = path.replace(/\[(\d+)\]/g, '.$1').split('.');
  const lastKey = parts.pop();

  const target = parts.reduce((current, part, index) => {
    if (current[part] === undefined) {
      // Create array or object based on next key
      const nextKey = parts[index + 1] || lastKey;
      current[part] = /^\d+$/.test(nextKey) ? [] : {};
    }
    return current[part];
  }, obj);

  target[lastKey] = value;
}
```

**Gotcha: Auto-creation**
- `setObjectByPath` creates intermediate objects/arrays
- `data.items[5].name = 'X'` creates array with 6 elements
- Elements 0-4 will be `undefined`

### Deep Merge

**deepMerge(target, source)** [utility.js:247-269]:
```javascript
export function deepMerge(target, source) {
  for (const key in source) {
    if (source[key] instanceof Object && key in target) {
      deepMerge(target[key], source[key]);
    } else {
      target[key] = source[key];
    }
  }
  return target;
}
```

**Gotcha: Array handling**
- Arrays are REPLACED, not merged
- `deepMerge({ arr: [1,2] }, { arr: [3] })` → `{ arr: [3] }`
- For array append, use `addArrayEntry()` instead

### Attribute Generation

**attrs(obj)** [utility.js:14-24]:
```javascript
export function attrs(obj) {
  return Object.entries(obj)
    .filter(([_, value]) => value !== undefined && value !== null && value !== false)
    .map(([key, value]) => {
      if (value === true) return key;
      return `${key}="${escapeHtml(String(value))}"`;
    })
    .join(' ');
}
```

**Gotcha: Boolean attributes**
- `true` renders as just the attribute name: `disabled`
- `false` is filtered out entirely
- `"false"` (string) renders as `attr="false"`

## CSS Architecture

### index.css Structure (569 lines)

**CSS Layer:** `@layer bs-component`

**CSS Custom Properties:**
```css
:where(data-entry) {
  --_bdc: var(--ButtonBorder);      /* Border color */
  --_bgc: var(--CanvasGray);        /* Background gray */
  --_bdrs: var(--input-bdrs);       /* Border radius */
  --_bdw: var(--input-bdw);         /* Border width */
  --_lblw: 75px;                    /* Label width */
  --_pb: .6ch;                      /* Padding block */
  --_pi: 1.2ch;                     /* Padding inline */
  --_rg: 1lh;                       /* Row gap */
}
```

**Part-based styling:**
- `[part~=row]` - Form row container
- `[part~=label]` - Field label
- `[part~=input]` - Input elements
- `[part~=select]` - Select elements
- `[part~=textarea]` - Textarea elements
- `[part~=nav]` - Navigation container
- `[part~=array-details]` - Array details container
- `[part~=array-unit]` - Array unit container
- `[part~=array-grid]` - Array grid container

**Responsive breakpoints:**
```css
@media (min-width: 600px) {
  --_lblw: 125px;
}
```

**Focus states:**
```css
:is(input, select, summary, textarea):focus-visible {
  background-color: var(--CanvasGray);
  outline: 2px solid var(--AccentColor);
  outline-offset: -2px;
}
```

## Public API Reference

### Attributes

| Attribute | Type | Description |
|-----------|------|-------------|
| `data` | URL/JSON | Data source |
| `schema` | URL/JSON | JSON Schema source |
| `lookup` | URL/JSON | Lookup tables source |
| `i18n` | URL/JSON | Translations source |
| `messages` | URL/JSON | Validation messages source |
| `lang` | string | Language code (default: 'en') |
| `autosave` | number | Auto-save interval in ms |
| `validatemethod` | URL | Custom validation function URL |

### Properties

| Property | Type | Description |
|----------|------|-------------|
| `data` | object | Get/set data object |
| `schema` | object | Get/set JSON Schema |
| `lookup` | array | Get/set lookup tables |
| `i18n` | object | Get/set translations |
| `constants` | object | Get/set constants |
| `instance` | object | Access to full instance (read-only) |

### Methods

| Method | Signature | Description |
|--------|-----------|-------------|
| `addArrayEntry` | `(path, item?, method?)` | Add item to array |
| `addArrayEntries` | `(path, items, method?)` | Add multiple items |
| `syncInstanceData` | `()` | Sync form to data |
| `renderAll` | `()` | Full re-render |
| `processData` | `()` | Trigger data processing |
| `showMsg` | `(msg, type, duration)` | Show notification |

## Usage Examples

### Basic Usage

```html
<data-entry
  data="./product.json"
  schema="./product-schema.json"
  i18n="./i18n.json"
  lang="en"
></data-entry>
```

### With Inline Data

```html
<data-entry
  schema="./schema.json"
  data='{"name": "Widget", "price": 29.99}'
></data-entry>
```

### With Event Handling

```javascript
const dataEntry = document.querySelector('data-entry');

dataEntry.addEventListener('de:custom', (e) => {
  console.log('Data changed:', e.detail.data);
});

dataEntry.addEventListener('de:submit', async (e) => {
  await saveToServer(e.detail.data);
});
```

### Extending Render Methods

```javascript
dataEntry.instance.extendRenderMethod('rating', function(data, config, instance) {
  const stars = '★'.repeat(data) + '☆'.repeat(5 - data);
  return `
    <label part="row">
      <span part="label">${config.render.label}</span>
      <span>${stars}</span>
      <input type="hidden" name="${config.path}" value="${data}">
    </label>
  `;
});
```

### Auto-Save with Server Sync

```html
<data-entry
  data="./data.json"
  schema="./schema.json"
  autosave="30000"
></data-entry>

<script>
const dataEntry = document.querySelector('data-entry');
dataEntry.addEventListener('de:custom', async (e) => {
  if (e.detail.action === 'update') {
    await fetch('/api/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(e.detail.data)
    });
  }
});
</script>
```

## Gotchas & Edge Cases

### 1. Template String Timing
Template strings are resolved at render time. Changing constants after render requires re-render.

### 2. Array Index Gaps
`setObjectByPath` creates gaps: `items[5]` creates array with `undefined` at indices 0-4.

### 3. Form Element Naming
Form elements must be named exactly as schema paths. Mismatch causes data loss.

### 4. Component Import Maps
External components require import map configuration for `@browser.style/*` paths.

### 5. Validation Timing
Validation runs before render. Invalid data may cause render issues.

### 6. Event Bubbling
All custom events bubble and are composed (cross shadow DOM). Listeners on document work.

### 7. Auto-Save Cleanup
Auto-save interval is NOT cleared on disconnect. Must manually clear if removing component.

### 8. Lookup vs Options
`render.options` takes priority over `render.lookup`. Don't set both.

### 9. Type Conversion
Empty strings convert to `0` for numbers, not `null`. Use `null` type in schema for nullable.

### 10. Dynamic Function Arguments
All arguments are strings. Parse in function if needed.

## File Structure

```
data-entry/
├── index.js              962 lines   Main component class
├── index.css             569 lines   Component styles
└── modules/
    ├── render.js         752 lines   Render methods
    ├── utility.js        440 lines   Helper functions
    ├── components.js     227 lines   External component mounting
    ├── schema.js         214 lines   Schema auto-generation
    ├── validate.js       110 lines   JSON Schema validation
    ├── dynamic.js         99 lines   Dynamic functions
    ├── factory.js         69 lines   Instance factory
    └── custom.js           3 lines   Custom method placeholder
```

## Dependencies

| Module | Import | Purpose |
|--------|--------|---------|
| render.js | `import * as renderMethods` | All render functions |
| utility.js | Named imports | Helper functions |
| components.js | `mountComponents` | Lazy component loading |
| schema.js | `generateSchemaFromData` | Schema inference |
| validate.js | `validateData` | Schema validation |
| dynamic.js | `dynamicFunctions, extendDynamicFunction` | Dynamic functions |
| factory.js | `createDataEntryInstance` | Instance creation |

## Related Components

- [@browser.style/auto-suggest](../auto-suggest/) - Autocomplete input
- [@browser.style/barcode-scanner](../barcode-scanner/) - Barcode scanning
- [@browser.style/data-mapper](../data-mapper/) - Data import mapping
- [@browser.style/rich-text](../rich-text/) - WYSIWYG editor
- [@browser.style/snack-bar](../snack-bar/) - Toast notifications
