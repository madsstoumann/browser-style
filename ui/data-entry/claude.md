# Data Entry Component - Internal Architecture

## Overview

`<data-entry>` is a JavaScript web component that generates dynamic forms from JSON Schema with support for nested objects, arrays, validation, auto-save, and external component integration. Unlike static form generators, data-entry handles bidirectional data flow between form inputs and JavaScript objects with real-time synchronization.

**Version:** 1.0.31 (index.js:11)

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
  Create form element (index.js:49-51)
  Create instance via factory (index.js:54-56)
  Set language from attribute
  ↓
connectedCallback()
  ↓
  Attach shadow DOM if 'shadow' attribute (index.js:156)
  Attach internal event listeners (index.js:159-194)
  ↓
  loadResources() (index.js:698-711) [parallel async]:
    - data (URL or inline JSON)
    - schema (URL or inline JSON)
    - lookup (URL or inline JSON)
    - i18n (URL or inline JSON)
    - messages (URL or inline JSON)
  ↓
  Merge schema.translations into i18n (index.js:198-199)
  Merge schema.messages into messages (index.js:204-206)
  ↓
  validateJSON() check (index.js:213)
  validateData() if enabled (index.js:214-218)
  ↓
  renderAll() → Generate form HTML (index.js:221)
  ↓
disconnectedCallback()
  ↓
  Clear autoSaveTimer (index.js:229)
  cleanupBeforeRender() (index.js:232)
```

**Critical timing:** Resources load in parallel via `Promise.all()` (index.js:699). Rendering waits for all to complete. Schema is required; data is optional.

**Shadow DOM consideration:** The component supports optional shadow DOM via the `shadow` attribute (index.js:156). This affects CSS encapsulation but external component mounting still works because `mountComponents()` receives the form's innerHTML.

### Module System

**Why modules?** The component grew beyond maintainability as a single file. Modules separate concerns:

| Module | Lines | Primary Responsibility |
|--------|-------|----------------------|
| **index.js** | 962 | Main DataEntry class, lifecycle, public API |
| **render.js** | 753 | All render methods for field types |
| **utility.js** | 441 | Pure helper functions |
| **components.js** | 227 | External component mounting and binding |
| **schema.js** | 214 | Auto-schema generation from data |
| **validate.js** | 110 | JSON Schema validation |
| **dynamic.js** | 99 | Dynamic function library |
| **factory.js** | 69 | Instance factory with extension API |
| **custom.js** | 3 | Placeholder for custom methods |

**Import strategy:** index.js imports from modules. Modules import from utility.js. No circular dependencies.

**Module interdependencies:**
```
index.js
  ├── factory.js (createDataEntryInstance)
  ├── utility.js (convertValue, deepMerge, isEmpty, getObjectByPath, itemExists, setObjectByPath)
  ├── validate.js (validateData)
  └── components.js (mountComponents)

factory.js
  ├── render.js (all render methods as renderMethods)
  ├── custom.js (all custom methods as customMethods)
  └── dynamic.js (dynamicFunctions, extendDynamicFunction)

render.js
  └── utility.js (attrs, buttonAttrs, fetchOptions, getObjectByPath, ...)

components.js
  └── utility.js (getObjectByPath, isEmpty, mapObject, setObjectByPath)
```

## Data Flow Pipeline

### Complete Data Journey

```
INPUT (4 possible sources)
  ↓
1. data attribute (URL) → fetchResource('data') → JSON (index.js:700)
2. data attribute (inline JSON) → JSON.parse() [not currently supported]
3. JavaScript: dataEntry.data = object → setter (index.js:64-69)
4. Schema only → empty object initialized
  ↓
Assign to this.data → triggers setter (index.js:64-69)
  ↓
this._data = value
this.instance.data = value
  ↓
connectedCallback() continues...
  ↓
renderAll() [index.js:795-812]
  ↓
  cleanupBeforeRender() → clear form innerHTML (index.js:456-467)
  ↓
  instance.methods.all() [render.js:19-203]
    ↓
    Iterate schema.properties
    For each property:
      - Resolve template strings in title/label
      - Get render method from instance.getRenderMethod()
      - Call render method with value, config, instance
    ↓
    Generate nav, main content, footer
    Inject into form.innerHTML
  ↓
mountComponents(form.innerHTML, this) [components.js:44-63]
  ↓
  Scan HTML for custom element tags
  Dynamically import matching modules
  Call bindFunction() for each
  ↓
bindCustomButtons() [index.js:414-426]
bindCustomEvents() [index.js:438-448]
handleNavigation() [index.js:635-679]
  ↓
setupAutoSave() if data-auto-save attribute [index.js:808-811]
  ↓
Ready for user interaction
  ↓
User interacts with form
  ↓
form 'input' event → syncInstanceData() [index.js:864-906]
  ↓
  Extract name (path), value, type from event.target
  Convert value based on data-type attribute
  setObjectByPath(instance.data, path, convertedValue)
  ↓
processData() → dispatch('de:entry') [index.js:773-778]
  ↓
OUTPUT: Updated data object available via dataEntry.data
```

### Critical Transformation Points

**Point 1: Resource loading** (index.js:698-711)
```javascript
async loadResources() {
  const [data, schema, lookup, i18n, messages] = await Promise.all([
    this.fetchResource('data'),
    this.fetchResource('schema'),
    this.fetchResource('lookup'),
    this.fetchResource('i18n'),
    this.fetchResource('messages')
  ]);

  this.data = data;
  this.schema = schema;
  this.lookup = lookup;
  this.i18n = i18n || {};
  this.messages = messages;
}
```

**Gotcha: Null handling**
- `i18n` defaults to `{}` if null (line 710)
- `lookup` becomes `null` if not provided, but setter handles this (index.js:93)
- `messages` can be null

**Point 2: Schema property iteration** (render.js:68-141)
```javascript
Object.entries(schema.properties).forEach(([key, config]) => {
  if (skipItems.has(key)) return;

  const attributes = config?.render?.attributes || [];
  const method = config?.render?.method ? toCamelCase(config.render.method) : '';
  const renderMethod = instance.getRenderMethod(method);
  const label = resolveTemplateString(config.title, data, instance) || 'LABEL';
  const options = method === 'select' ? fetchOptions(config, instance) : [];
  const path = pathPrefix === 'DISABLE_PATH' ? '' : (pathPrefix ? `${pathPrefix}.${key}` : key);
  const value = getValueWithFallback(data, key, config);

  // ... render based on type (array, object, primitive)
});
```

**Gotcha: DISABLE_PATH sentinel**
- When `pathPrefix === 'DISABLE_PATH'`, the path becomes empty string
- Used to render display-only fields that don't map to data
- Edge case: rarely documented but critical for certain layouts

**Gotcha: toCamelCase transformation**
- Schema uses kebab-case: `"method": "array-details"`
- JavaScript uses camelCase: `arrayDetails`
- `toCamelCase()` (utility.js:422-428) handles conversion

**Point 3: Template string resolution** (utility.js:323-377)
```javascript
export function resolveTemplateString(template, data, instance = {}, fallback = '') {
  try {
    const { lang = 'en', i18n = {}, constants = {} } = instance;
    if (!template) return '';
    if (typeof template !== 'string') return template;
    if (!template.includes('${')) return template;  // Fast path

    return template.replace(/\$\{([^}]+)\}/g, (_, key) => {
      const trimmedKey = key.trim();

      // Dynamic function: d:funcName arg1 arg2
      if (trimmedKey.startsWith('d:')) {
        const parts = trimmedKey.slice(2).trim().split(/\s+/);
        const fn = dynamicFunctions[parts[0]];
        if (fn) {
          const params = parts.slice(1).map(param => {
            // Handle [prefix:name] global references
            const globalMatch = param.match(/\[(.*?)\]/);
            if (globalMatch) {
              const [prefix, name] = globalMatch[1].split(':');
              switch(prefix) {
                case 'o': return instance.lookup?.[name] || [];
                case 'v': return constants[name];
                default: return param;
              }
            }
            return param.startsWith('${') && param.endsWith('}')
              ? getObjectByPath(data, param.slice(2, -1))
              : getObjectByPath(data, param) ?? param;
          });
          return fn(...params);
        }
      }

      // Translation: t:key.path
      if (trimmedKey.startsWith('t:')) {
        return t(trimmedKey.slice(2).trim(), lang, i18n) || '';
      }

      // Constant: v:key.path
      if (trimmedKey.startsWith('v:')) {
        const value = constants[trimmedKey.slice(2).trim()];
        return value !== undefined ? value : '';
      }

      // Data path (default)
      return getObjectByPath(data, trimmedKey) || '';
    });
  } catch (error) {
    console.warn('Template resolution failed:', error);
    return fallback || template;
  }
}
```

**Pattern types:**
| Pattern | Example | Resolution |
|---------|---------|------------|
| `${path}` | `${product.name}` | Value from data object |
| `${t:key}` | `${t:labels.name}` | Translation from i18n |
| `${v:key}` | `${v:taxRate}` | Value from constants |
| `${d:func args}` | `${d:now date}` | Dynamic function result |
| `${d:func [o:lookup]}` | `${d:mapOptionLabel ${value} [o:currencies]}` | Function with lookup reference |

**Gotcha: Space-separated arguments**
- Dynamic functions use SPACE separation, not parentheses
- `${d:formatCurrency 1000 USD}` NOT `${d:formatCurrency(1000, USD)}`
- Arguments are always strings, parse in function if needed

**Gotcha: Global reference syntax**
- `[o:name]` references `instance.lookup[name]`
- `[v:name]` references `instance.constants[name]`
- Used for passing arrays/objects to dynamic functions

**Point 4: Path-based data access** (utility.js:157-178)
```javascript
export function getObjectByPath(obj, path) {
  return path.split('.').reduce((acc, key) => {
    if (acc === null || acc === undefined) {
      return undefined;
    }

    const match = key.match(/([^\[]+)\[?(\d*)\]?/);
    const prop = match[1];
    const idx = match[2];

    if (idx === '') {
      return acc[prop];
    }

    if (idx !== undefined) {
      return acc[prop] && Array.isArray(acc[prop]) ? acc[prop][idx] : undefined;
    }

    return acc[prop];
  }, obj);
}
```

**Supported path formats:**
- `name` → `obj.name`
- `items[0]` → `obj.items[0]`
- `items[0].name` → `obj.items[0].name`
- `deeply.nested.path` → `obj.deeply.nested.path`
- `items[0].variants[1].sku` → full nested access

**Gotcha: Regex parsing** (line 164)
- Pattern: `/([^\[]+)\[?(\d*)\]?/`
- Captures: `items[0]` → prop="items", idx="0"
- Captures: `items` → prop="items", idx=""
- Empty idx (`idx === ''`) means no bracket, just property access

**Point 5: Type conversion** (utility.js:58-77)
```javascript
export function convertValue(value, dataType, inputType, checked) {
  switch (dataType) {
    case 'number':
      return Number(value);
    case 'boolean':
      if (inputType === 'checkbox') {
        return checked;  // Use checked state, not value
      }
      return value === 'true' || value === true;
    case 'object':
      try {
        return JSON.parse(value);
      } catch {
        return value;  // Return as-is if not valid JSON
      }
    default:
      return value;  // String or unknown type
  }
}
```

**Gotcha: Checkbox handling**
- Checkboxes use `checked` boolean, not `value` string
- `value` attribute is what gets submitted, not checked state
- `inputType === 'checkbox'` triggers different logic

**Gotcha: Number conversion**
- Empty string becomes `0` via `Number('')`
- Non-numeric strings become `NaN`
- No null handling - null becomes `0`

**Point 6: Array entry management** (index.js:247-320)
```javascript
addArrayEntry(element, path, insertBeforeSelector = `[part="nav"]`) {
  const form = element.form;

  if (element.type === 'submit') {
    if (!form.checkValidity()) {
      return;  // Validate before adding
    }
    event.preventDefault();
  }

  const formElements = Array.from(form.elements)
    .filter(el => el.name.startsWith(`${path}.`));

  const array = getObjectByPath(this.instance.data, path);
  if (!Array.isArray(array)) {
    this.notify(1002, `Path "${path}" does not reference an array in the data.`);
    return;
  }

  const fieldset = this.form.querySelector(`fieldset[name="${path}-entry"]`);
  const schema = getObjectByPath(this.instance.schema, `properties.${path}`);

  if (!fieldset || !schema) {
    this.debugLog(`Fieldset with path "${path}" or schema not found.`);
    return;
  }

  // Build new object from form elements
  const newObject = formElements.reduce((acc, el) => {
    const fieldPath = el.name.slice(path.length + 1);
    const dataType = el.dataset.type || 'string';
    acc[fieldPath] = convertValue(el.value, dataType, el.type, el.checked);
    return acc;
  }, {});

  // Check for duplicates
  const uniqueProps = this.getUniqueProperties(schema);
  if (uniqueProps.length && itemExists(array, newObject, uniqueProps)) {
    this.notify(0, 'Item already exists', 'warning');
    return;
  }

  array.push(newObject);

  // Render new item
  const renderMethod = element.dataset.renderMethod || 'arrayDetail';
  const newDetail = this.instance.methods[renderMethod]({
    value: newObject,
    config: schema,
    path: `${path}[${array.length - 1}]`,
    instance: this.instance,
    attributes: [],
    name: path,
    index: array.length - 1
  });

  // Insert into DOM
  const siblingElm = fieldset.querySelector(insertBeforeSelector);
  if (siblingElm) {
    siblingElm.insertAdjacentHTML('beforebegin', newDetail);
  }

  form.reset();
  const popover = this.form.querySelector(`#${form.dataset.popover}`);
  if (popover) popover.hidePopover();
  this.processData();
}
```

**Gotcha: Form element filtering**
- `el.name.startsWith(\`${path}.\`)` filters to only fields within array item
- The dot is important - prevents matching `items2` when looking for `items`

**Gotcha: Fieldset naming convention**
- Entry fieldsets must be named `${path}-entry`
- E.g., `items` array → `fieldset[name="items-entry"]`
- This is how `addArrayEntry` finds the container

**Gotcha: Duplicate detection**
- Uses `getUniqueProperties()` (index.js:942-957) to find unique fields
- First checks `unique: true` in schema
- Falls back to `id` or `*_id` fields
- Empty uniqueProps means no duplicate checking

## State & Data Synchronization

### The Three Data Layers

**Layer 1: DOM (form inputs)**
```
<input name="product.name" value="Widget">
<input name="items[0].price" value="29.99" data-type="number">
<select name="status" data-type="string">
```
- Actual HTML elements with values
- Source of truth during user interaction
- Named by full path including array indices
- `data-type` attribute guides type conversion

**Layer 2: instance.data (JavaScript object)**
```javascript
{
  product: { name: "Widget" },
  items: [{ price: 29.99 }],
  status: "active"
}
```
- Structured data matching schema
- Updated via `syncInstanceData()` after changes
- Accessible via `dataEntry.data` getter

**Layer 3: instance.schema (configuration)**
```javascript
{
  type: "object",
  properties: {
    product: {
      type: "object",
      properties: {
        name: {
          type: "string",
          title: "Product Name",
          render: { method: "input", attributes: [{ required: "required" }] }
        }
      }
    },
    items: {
      type: "array",
      items: {
        properties: {
          price: { type: "number", render: { method: "input" } }
        }
      }
    }
  }
}
```
- Defines structure, validation, rendering
- Contains render configuration per property
- Accessible via `dataEntry.schema` getter

### Synchronization Flow Deep Dive

**syncInstanceData()** (index.js:864-906) - The Heart of Data Binding

```javascript
syncInstanceData(event) {
  const { form, name, type, checked, dataset } = event.target;

  // Guard: Skip if no name, wrong form, or data-no-sync attribute
  if (!name || form !== this.form || event.target.hasAttribute('data-no-sync')) return;

  // Get value - support for rich-text component detail
  let value = event.detail?.content || event.target.value;
  const isEncoded = event.detail?.isEncoded || false;

  // Decode if marked as encoded (rich-text uses URL encoding)
  if (isEncoded) {
    try {
      value = decodeURIComponent(value);
    } catch (error) {
      console.warn(`Failed to decode value: ${value}`, error);
    }
  }

  const currentData = getObjectByPath(this.instance.data, name);

  // Special handling for array control checkboxes
  if (type === 'checkbox' && dataset.arrayControl) {
    if (checked) {
      // Undo delete: remove _remove flag
      if (currentData && currentData._remove) delete currentData._remove;
      this.debugLog(`Undoing delete: Removed _remove flag at path "${name}".`);
    } else {
      // Mark for removal
      if (currentData) currentData._remove = true;
      this.notify(1003, `Marked object at path "${name}" for removal.`);
    }

    // Dispatch array control event if not mark-remove type
    if (dataset.arrayControl !== "mark-remove") {
      this.dispatchEvent(new CustomEvent('de:array-control', {
        detail: {
          action: dataset.arrayControl,
          checked,
          data: this.instance.data,
          name,
          node: event.target
        }
      }));
    }
  } else {
    // Standard value sync
    const dataType = dataset.type;
    setObjectByPath(this.instance.data, name, convertValue(value, dataType, type, checked));
  }

  this.processData(event.target);
}
```

**Gotcha: data-no-sync attribute**
- Elements with `data-no-sync` are skipped (line 866)
- Used for UI-only inputs (file pickers, search fields)
- Example: DataMapper file input shouldn't sync to data

**Gotcha: Array control checkboxes**
- `data-array-control` attribute triggers special handling
- Values: `"mark-remove"`, or custom action names
- Unchecking sets `_remove: true` on the object
- Actual removal happens in `filterRemovedEntries()` (index.js:512-527)

**Gotcha: Encoded values**
- Rich-text component sends URL-encoded HTML
- `event.detail.isEncoded = true` signals decoding needed
- `decodeURIComponent()` restores original HTML

### processData() - Dispatch Pattern (index.js:773-778)

```javascript
processData(node) {
  const enctype = this.form.getAttribute('enctype') || 'multipart/form-data';
  const data = enctype.includes('json')
    ? this.instance.data
    : this.prepareFormData();
  this.debugLog('Processing data:', this.instance.data);
  this.dispatchEvent(new CustomEvent('de:entry', {
    detail: { data, node: node || null }
  }));
}
```

**Why two data formats?**
- JSON enctype: Pass raw object (for API calls)
- Form enctype: Pass FormData (for file uploads, traditional forms)
- Consumer decides how to handle

**Gotcha: Node reference**
- `node` parameter is the triggering element
- Useful for determining what changed
- Can be `null` for programmatic updates

### Auto-Save Mechanism

**Setup** (index.js:842-851):
```javascript
setupAutoSave(intervalInSeconds) {
  if (this.autoSaveTimer) {
    clearInterval(this.autoSaveTimer);
  }

  this.autoSaveTimer = setInterval(() => {
    this.handleDataSubmission();
    this.debugLog(`Auto-saving data every ${intervalInSeconds} seconds.`);
  }, intervalInSeconds * 1000);
}
```

**Gotcha: Timer in seconds, not milliseconds**
- Config value is SECONDS
- Multiplied by 1000 for setInterval

**Gotcha: handleDataSubmission vs syncInstanceData**
- Auto-save calls `handleDataSubmission()` which submits to server
- Not just syncing to instance.data
- Requires form `action` attribute to work

**Gotcha: Cleanup in disconnectedCallback** (index.js:228-233)
```javascript
disconnectedCallback() {
  if (this.autoSaveTimer) {
    clearInterval(this.autoSaveTimer);
  }
  this.cleanupBeforeRender();
}
```
- Timer IS cleared on disconnect
- But if you cache the element and re-add, timer doesn't restart
- Must manually call `setupAutoSave()` or re-render

## Instance Factory System Deep Dive

### createDataEntryInstance(parent) [factory.js:24-69]

```javascript
export function createDataEntryInstance(parent) {
  return {
    methods: {
      ...renderMethods,  // All exports from render.js
    },
    custom: {
      ...customMethods,  // All exports from custom.js (empty by default)
    },
    extensions: {
      customMethods: {},   // User-added via extendCustomMethod()
      renderMethods: {},   // User-added via extendRenderMethod()
    },

    extendRenderMethod(name, method) {
      this.extensions.renderMethods[name] = method;
    },

    extendCustomMethod(name, method) {
      this.extensions.customMethods[name] = method;
      this.custom[name] = method;  // Also add to custom for direct access
    },

    getRenderMethod(name) {
      return this.extensions.renderMethods[name] || this.methods[name];
    },

    getCustomMethod(name) {
      return this.extensions.customMethods[name] || this.custom[name];
    },

    extendDynamicFunction,  // Re-export from dynamic.js

    getDynamicFunction(name) {
      return dynamicFunctions[name] || null;
    },

    constants: {},
    data: {},
    schema: {},
    parent,  // Reference back to DataEntry element
  };
}
```

**Method Resolution Order:**
1. `extensions.renderMethods[name]` - User extensions first
2. `methods[name]` - Built-in render methods
3. (No fallback - returns undefined)

**Gotcha: No fallback to input**
- Unlike what the code comment suggests, there's no automatic fallback
- Missing method returns `undefined`
- `safeRender()` (utility.js:379-386) catches errors and returns empty string

**Gotcha: extendCustomMethod dual storage**
- Adds to BOTH `extensions.customMethods` AND `custom`
- `custom` allows `instance.custom.methodName()` direct access
- `extensions` keeps separation for `getCustomMethod()` lookup

### Extension Timing

**Window for extensions:**
```
connectedCallback()
  ↓
  loadResources() [async]
  ↓
  validateData() [optional]
  ↓
  renderAll() ← Extensions must be added BEFORE this
  ↓
  ... form interaction ...
```

**Safe extension pattern:**
```javascript
const dataEntry = document.createElement('data-entry');
dataEntry.setAttribute('schema', './schema.json');

// Extend BEFORE adding to DOM
dataEntry.instance.extendRenderMethod('colorPicker', (params) => {
  const { value, path } = params;
  return `<input type="color" name="${path}" value="${value || '#000000'}">`;
});

// Now add to DOM - connectedCallback runs, extensions available
document.body.appendChild(dataEntry);
```

**Gotcha: Post-render extensions**
- Extensions added after `renderAll()` won't appear
- Must call `dataEntry.renderAll()` manually to re-render
- Existing form data may be lost without `syncInstanceData()` first

### Dynamic Functions Library (dynamic.js:1-98)

```javascript
export const dynamicFunctions = {
  /* === Date and Time Functions === */
  dateDifference: (startDate, endDate) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end - start);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)); // Days
  },

  now: (format = 'datetime-local') => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');

    switch (format) {
      case 'date': return `${year}-${month}-${day}`;
      case 'time': return `${hours}:${minutes}:${seconds}`;
      case 'datetime-local': return `${year}-${month}-${day}T${hours}:${minutes}`;
      case 'iso': return now.toISOString();
      default: return `${year}-${month}-${day}T${hours}:${minutes}`;
    }
  },

  today: () => new Date().toISOString().split('T')[0],

  /* === Formatters === */
  formatCurrency: (value, currencyCode = 'USD', locale = dynamicFunctions.getLocale()) => {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currencyCode.toUpperCase()
    }).format(value);
  },

  formatDate: (value, locale = 'en-US', options) => {
    const date = new Date(value);
    return date.toLocaleDateString(locale, options || {});
  },

  formatDateTimeLocal: (value) => {
    return value ? value.substring(0, 16) : '';
  },

  formatNumber: (value, decimals = 2) => {
    const num = parseFloat(value);
    return isNaN(num) ? '0.00' : num.toFixed(decimals);
  },

  multiply: (value, multiplier, decimals = 2) => {
    return (value * multiplier).toFixed(decimals);
  },

  /* === Random Generators === */
  randomNumber: (min = 0, max = 100) => {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  },

  uuid: () => crypto.randomUUID(),

  /* === String Formatters === */
  capitalizeFirst: (value) => {
    return value.charAt(0).toUpperCase() + value.slice(1);
  },

  lowercase: (value) => String(value).toLowerCase(),

  slugify: (value) => {
    return value
      .toString()
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '-')
      .replace(/[^\w\-]+/g, '')
      .replace(/\-\-+/g, '-');
  },

  titleCase: (value) => {
    return value.replace(/\w\S*/g, (txt) => {
      return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
    });
  },

  uppercase: (value) => String(value).toUpperCase(),

  /* === Locale Functions === */
  getLocale: () => {
    return document.documentElement.lang || 'en-US';
  },

  /* === Mapping Functions === */
  mapOptionLabel: (value, options) => {
    const option = options.find(opt => String(opt.value) === String(value));
    return option ? option.label : value;
  }
};
```

**Complete function reference:**

| Function | Signature | Description |
|----------|-----------|-------------|
| `dateDifference` | `(start, end)` | Days between two dates |
| `now` | `(format?)` | Current date/time. Formats: date, time, datetime-local, iso |
| `today` | `()` | Today's date YYYY-MM-DD |
| `formatCurrency` | `(value, code?, locale?)` | Format as currency |
| `formatDate` | `(value, locale?, options?)` | Format date |
| `formatDateTimeLocal` | `(value)` | Truncate to datetime-local format |
| `formatNumber` | `(value, decimals?)` | Fixed decimal formatting |
| `multiply` | `(value, mult, decimals?)` | Multiply with formatting |
| `randomNumber` | `(min?, max?)` | Random integer |
| `uuid` | `()` | Crypto random UUID |
| `capitalizeFirst` | `(value)` | Capitalize first letter |
| `lowercase` | `(value)` | Lowercase string |
| `slugify` | `(value)` | URL-safe slug |
| `titleCase` | `(value)` | Title Case String |
| `uppercase` | `(value)` | UPPERCASE string |
| `getLocale` | `()` | Document language or en-US |
| `mapOptionLabel` | `(value, options)` | Find label for value |

**Extending dynamic functions:**
```javascript
import { extendDynamicFunction } from './modules/dynamic.js';

extendDynamicFunction('customFormat', (value) => {
  return `Custom: ${value}`;
});

// Or via instance
dataEntry.instance.extendDynamicFunction('percentage', (value) => {
  return `${(value * 100).toFixed(1)}%`;
});
```

## Render Methods Deep Dive

### render.js - The Rendering Engine (753 lines)

**Primary responsibilities:**
1. Generate HTML for each schema property
2. Handle nested objects (recursive)
3. Handle arrays (7 different strategies)
4. Resolve template strings in labels/values
5. Apply conditional rendering via attributes
6. Build navigation for root-level items
7. Generate form buttons from schema.form

### all() - Main Entry Point [render.js:19-203]

```javascript
export function all(data, schema, instance, root = false, pathPrefix = '', form = null) {
  const groupMap = new Map();          // Track grouped properties
  const skipItems = new Set();          // Properties to skip (already grouped)
  const groupContent = new Map();       // Pre-rendered group content

  // Phase 1: Identify and pre-render groups (lines 24-56)
  if (root) {
    Object.entries(schema.properties).forEach(([key, config]) => {
      if (config.render?.group) {
        const groupKey = config.render.group;
        if (!groupMap.has(groupKey)) {
          groupMap.set(groupKey, []);
        }
        groupMap.get(groupKey).push({key, config});
        skipItems.add(key);
      }
    });

    groupMap.forEach((items, groupKey) => {
      groupContent.set(groupKey, items.map(({key, config}) => {
        // Render each grouped item...
      }).join(''));
    });
  }

  // Phase 2: Main iteration (lines 68-141)
  const arrayContent = [];
  const fieldsetGroups = [];
  const standardContent = [];
  let navContent = '';
  let schemaIndex = 0;

  Object.entries(schema.properties).forEach(([key, config]) => {
    if (skipItems.has(key)) return;

    const method = config?.render?.method ? toCamelCase(config.render.method) : '';
    const renderMethod = instance.getRenderMethod(method);
    const path = pathPrefix === 'DISABLE_PATH' ? '' : (pathPrefix ? `${pathPrefix}.${key}` : key);
    const value = getValueWithFallback(data, key, config);

    if (config.type === 'array') {
      // Build nav link
      if (renderNav) {
        navContent += `<a href="#section_${path}" part="link">${label}</a>`;
      }
      // Render array content
      arrayContent.push({ index: schemaIndex, content: /* ... */ });
    }
    else if (config.type === 'object') {
      // Recurse or render with method
      standardContent.push({ index: schemaIndex, content: /* ... */ });
    }
    else {
      // Primitive type
      standardContent.push({ index: schemaIndex, content: /* ... */ });
    }
    schemaIndex++;
  });

  // Phase 3: Sort by schema position and combine (lines 143-166)
  const getSchemaPosition = (key) => Object.keys(schema.properties).indexOf(key);
  // ... sorting logic ...

  // Phase 4: Build final HTML with nav, main, footer (lines 168-201)
  if (form || root) {
    // Set form attributes from schema.form
    if (schema.form) {
      if (schema.form.action) form.setAttribute('action', schema.form.action);
      if (schema.form.method) form.setAttribute('method', schema.form.method);
      if (schema.form.enctype) {
        const formEnctype = schema.form.enctype === 'json' ? 'application/json'
          : schema.form.enctype === 'form' ? 'multipart/form-data'
          : schema.form.enctype;
        form.setAttribute('enctype', formEnctype);
      }
      // Generate buttons
      const buttonsHTML = schema.form.buttons?.map(/* ... */).join('');
    }
    // Inject into form.innerHTML
    form.innerHTML = rootContent;
    return;
  }
  return innerContent;
}
```

**Gotcha: Group rendering order**
- Groups are identified in Phase 1 but rendered in Phase 2
- `skipItems.add(key)` prevents double-rendering
- Grouped items appear where the GROUP NAME appears in schema, not first item

**Gotcha: schemaIndex tracking**
- Each property gets an index for sorting
- Ensures rendered order matches schema order
- Groups and arrays maintain relative position

**Gotcha: Form mutation**
- When `form` parameter is provided, `all()` MUTATES `form.innerHTML`
- Returns nothing (void)
- When no form, returns HTML string

### Array Render Methods

**arrayCheckbox** [render.js:207-225]
```javascript
export const arrayCheckbox = (params) =>
  renderArray({
    ...params,
    renderItem: ({ value, config, path }) => {
      const valuePath = config.render?.value || '';
      const checked = valuePath.includes('[') || valuePath.includes('.')
        ? getObjectByPath(value, valuePath)
        : valuePath ? value[valuePath] : false;
      const rowLabel = config.render?.label
        ? value[config.render.label] || config.render.label
        : 'LABEL';
      const fullPath = valuePath ? `${path}.${valuePath}` : path;

      return `
        <label part="row">
          <span part="label" title="${rowLabel}">${rowLabel}</span>
          <input part="input" type="checkbox" value="${checked}"
            name="${fullPath}" data-type="boolean" ${checked ? 'checked' : ''}>
        </label>`;
    },
  });
```

**Use case:** Multi-select from array of objects
**Schema example:**
```json
{
  "permissions": {
    "type": "array",
    "render": {
      "method": "array-checkbox",
      "label": "name",
      "value": "enabled"
    }
  }
}
```

**arrayDetail** [render.js:229-253]
```javascript
export const arrayDetail = ({ value, config, path, instance, attributes = [], name = '', index }) => {
  const cleanName = name?.replace(/\[\d+\]/g, '');
  const rowLabel = config.render?.label
    ? resolveTemplateString(config.render.label, value, instance)
    : 'label';
  const rowValue = config.render?.value
    ? resolveTemplateString(config.render.value, value, instance)
    : 'value';

  const cols = rowValue.split('|').map(col => `<span>${col}</span>`).join('');
  const arrayControl = config.render?.arrayControl || 'mark-remove';

  return `
    <details part="array-details" ${attrs(attributes)}${name ? ` name="${cleanName}"`:''}>
      <summary part="row summary">
        <output part="label" name="label_${name}">${rowLabel}</output>
        <span part="value">
          ${icon('chevron right', 'sm', 'xs')}
          <output name="value_${name}">${cols}</output>
          ${config.render?.delete ? `<label><input part="input delete" checked type="checkbox" name="${path}" data-array-control="${arrayControl}"></label>` : ''}
        </span>
      </summary>
      ${all(value, config.items, instance, false, path)}
    </details>`;
};
```

**Gotcha: Pipe-separated columns**
- `config.render.value` can contain `|` separators
- `"${name}|${price}"` → `<span>Name</span><span>Price</span>`
- Allows multi-column summary display

**Gotcha: arrayControl attribute**
- Controls what happens when delete checkbox unchecked
- `"mark-remove"`: Sets `_remove: true` on object
- Custom values dispatch `de:array-control` event

**arrayDetails** [render.js:257-273]
Wrapper that calls `arrayDetail` for each item plus optional `entry` popover.

**arrayGrid** [render.js:277-282]
```javascript
export const arrayGrid = (params) =>
  renderArray({
    ...params,
    renderItem: ({ value, config, path, instance }) =>
      `<fieldset>${all(value, config.items, instance, false, path)}</fieldset>`,
  });
```

**Use case:** Tabular grid of editable items
**CSS styling:** Relies on `[part~=array-grid]` CSS for grid layout

**arrayLink** [render.js:286-321]
Two modes:
1. Predefined links from `config.render.data.links`
2. Dynamic links from array data

**arrayUnit** [render.js:325-368]
Compact single-line display with hidden fields. Shows one field visibly, hides rest.

**arrayUnits** [render.js:372-380]
Wrapper for `arrayUnit` with optional entry popover.

### Form Element Render Methods

**input()** [render.js:516-545]
```javascript
export const input = (params) => {
  const { attributes = [], config, instance, label, path = '', type = 'string', value } = params;
  const processedConfig = processRenderConfig(config, instance.data, instance);
  const processedAttrs = processAttributes(attributes, instance.data, instance);

  const hidden = processedAttrs.some(attr => attr.type === 'hidden');
  const hiddenLabel = processedAttrs.some(attr => attr['hidden-label']);
  const isRequired = processedAttrs.some(attr => attr.required === 'required');

  let finalValue = value ?? processedAttrs.find(attr => attr.value !== undefined)?.value ?? '';

  // Apply formatter if defined
  if (processedConfig?.render?.formatter) {
    finalValue = resolveTemplateString(
      processedConfig.render.formatter,
      { ...instance.data, value: finalValue },
      instance
    );
  }

  const filteredAttributes = processedAttrs.filter(attr => !('value' in attr));
  const checked = filteredAttributes.some(attr => attr.type === 'checkbox') && finalValue ? ' checked' : '';
  const inputElement = `<input part="input" value="${finalValue}" ${attrs(filteredAttributes, path)} data-type="${type}" ${checked}>`;

  return hidden
    ? inputElement
    : `<label part="row" ${hiddenLabel ? 'hidden' : ''}>
        <span part="label">${isRequired ? `<abbr title="${instance ? t('required', instance.lang, instance.i18n): ''}">*</abbr>` : ''}${label}</span>
        ${inputElement}
      </label>`;
};
```

**Gotcha: Hidden inputs**
- `type: "hidden"` returns just the input, no label wrapper
- `hidden-label` attribute hides label but keeps row structure

**Gotcha: Formatter processing**
- `render.formatter` is a template string
- Receives `{ ...data, value: currentValue }` context
- Can transform display value: `"${d:formatCurrency ${value} USD}"`

**select()** [render.js:623-723]
Most complex form element due to option handling:

```javascript
export const select = (params) => {
  const {
    attributes = [], config, label, options = [], path = '',
    type = 'string', value = -1, instance,
  } = params;
  const processedAttrs = processAttributes(attributes, instance.data, instance);

  const attributeValue = processedAttrs.find((attr) => 'value' in attr)?.value;
  const selectedOption = config?.render?.selectedOption;
  const selectedOptionDisabled = config?.render?.selectedOptionDisabled;
  const action = config?.render?.action;
  const renderLabel = config?.render?.label;
  const valueField = config?.render?.value || 'value';

  // Add selectedOption if object with value/label
  let finalOptions = [...options];
  if (selectedOption && typeof selectedOption === 'object' && 'value' in selectedOption) {
    finalOptions = [selectedOption, ...options];
  }

  // Process options with renderLabel template
  finalOptions = finalOptions.map((option) => {
    const optionLabel = renderLabel
      ? renderLabel.includes('${')
        ? resolveTemplateString(renderLabel, option, instance)
        : option[renderLabel]
      : option.label || option[valueField];

    return {
      value: option[valueField] !== undefined ? option[valueField] : (option.value !== undefined ? option.value : ''),
      label: optionLabel || option.label || '',
    };
  });

  // Determine selected value
  const finalValue = /* ... selection logic ... */;

  // Optional action button
  const buttonHTML = action
    ? `<button type="button" part="button" ${buttonAttrs(action)}>${resolveTemplateString(action.label, instance.data, instance)}</button>`
    : '';

  return `
    <label part="row${action ? ' action' : ''}">
      <span part="label">${isRequired ? '<abbr>*</abbr>' : ''}${label}</span>
      <select part="select" ${attrs(filteredAttributes, path, [], ['type'])} data-type="${type}">
        ${finalOptions.map((option) => {
          const optionValue = String(option.value);
          const isSelected = optionValue === String(finalValue);
          return `<option value="${optionValue}" ${isSelected ? 'selected' : ''}
                   ${isSelected && selectedOptionDisabled ? 'disabled' : ''}>
                   ${option.label}</option>`;
        }).join('')}
      </select>
      ${buttonHTML}
    </label>`;
};
```

**Gotcha: selectedOption types**
- Object `{ value: "", label: "Select..." }`: Added to top of options
- Primitive value: Used as selected value only
- `selectedOptionDisabled: true`: Makes default option unselectable

**Gotcha: Action buttons**
- `render.action` adds button next to select
- Useful for "Add new" flows
- Part becomes `row action` for CSS targeting

**textarea()** [render.js:727-736]
Simple multi-line input. `null` values converted to empty string.

**richtext()** [render.js:609-619]
Wraps `<rich-text>` custom element component.

**autosuggest()** [render.js:384-431]
Generates `<auto-suggest>` with API configuration:
- `api`: Search endpoint URL
- `apiArrayPath`: Path to results in response
- `apiDisplayPath`: Field for display text
- `apiValuePath`: Field for value
- `mapping`: Object mapping for selected items

**barcode()** [render.js:435-437]
Simple wrapper for `<barcode-scanner>` component.

**datamapper()** [render.js:740-753]
File upload interface for `<data-mapper>` component.

**entry()** [render.js:441-494]
Popover form for adding array items:
```javascript
export const entry = (params) => {
  const { config, instance, path = '' } = params;
  const formID = `form${uuid()}`;
  const id = `popover-${uuid()}`;
  const label = config.title || 'Add New Entry';
  const renderAutoSuggest = !!config.render?.autosuggest;
  const renderBarcodeScanner = !!config.render?.barcode;

  // Generate fields from config.items.properties
  const fields = Object.entries(config.items.properties)
    .map(([propKey, propConfig]) => {
      const attributes = [...(propConfig.render?.attributes || []), { form: formID }];
      // Process and render each field...
    }).join('');

  if (!fields) return '';

  // Create external form element
  instance.parent.insertAdjacentHTML('beforeend',
    `<form id="${formID}" data-popover="${id}" hidden></form>`
  );

  return `
    <nav part="nav">
      ${renderBarcodeScanner ? barcode({ path }) : ''}
      <button type="button" part="micro" popovertarget="${id}" style="--_an:--${id};">
        ${icon('plus')}${label}
      </button>
    </nav>
    <div id="${id}" popover="" style="--_pa:--${id};">
      <fieldset part="fieldset" name="${path}-entry">
        <legend part="legend">${label}</legend>
        ${renderAutoSuggest ? autosuggest({ config, path, formID }) : ''}
        ${fields}
        <nav part="nav">
          <button type="button" form="${formID}" part="button close" popovertarget="${id}">Close</button>
          <button type="reset" form="${formID}" part="button reset">Reset</button>
          <button type="submit" form="${formID}" part="button add"
            data-render-method="${config.render?.addMethod || 'arrayDetail'}"
            data-custom="addArrayEntry"
            data-params='{ "path": "${path}" }'>${t('add', instance.lang, instance.i18n)}</button>
        </nav>
      </fieldset>
    </div>`;
};
```

**Gotcha: External form element**
- Popover contains fieldset but form is OUTSIDE
- `form="${formID}"` attribute links inputs to form
- Required for popover to work with native popover API

**Gotcha: CSS custom properties**
- `--_an:--${id}` sets anchor name
- `--_pa:--${id}` sets position anchor
- Enables CSS anchor positioning for popover

## External Component Integration

### components.js - Lazy Loading System (227 lines)

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
    // No bindFunction - no special handling needed
  },
  SnackBar: {
    bindFunction: bindSnackBar,
    path: '@browser.style/snack-bar',
    tagName: 'snack-bar',
  }
};
```

**Why this pattern?**
- Components only loaded when used (lazy)
- Import paths use bare specifiers (require import map)
- Bind functions wire up component-specific event handling

### mountComponents(HTML, dataEntry) [components.js:44-63]

```javascript
export async function mountComponents(HTML, dataEntry) {
  const importPromises = Object.entries(componentsInfo).map(
    async ([componentName, { bindFunction, path, tagName }]) => {
      if (HTML.includes(`<${tagName}`)) {
        try {
          const module = await import(path);
          // Handle both default and named exports
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

**Gotcha: String-based detection**
- Uses `HTML.includes(\`<${tagName}\`)` - simple string match
- Works because HTML is already generated string
- Could false-positive on `<!-- <auto-suggest -->` comments

**Gotcha: Component.register()**
- Assumes all components have static `register()` method
- This is a convention in @browser.style components
- Wraps `customElements.define()` with duplicate check

### bindAutoSuggest(dataEntry) [components.js:67-73]

```javascript
function bindAutoSuggest(dataEntry) {
  dataEntry.form.querySelectorAll('auto-suggest').forEach((autoSuggest) => {
    autoSuggest.addEventListener('autoSuggestSelect', (event) =>
      handleAutoSuggestSelect(event.detail, autoSuggest, dataEntry)
    );
  });
}
```

### handleAutoSuggestSelect() [components.js:151-190]

```javascript
function handleAutoSuggestSelect(detail, autoSuggest, dataEntry) {
  // Handle initial data population (from initial-object attribute)
  if (detail.isInitial) {
    Object.entries(detail)
      .filter(([key]) => key !== 'isInitial')
      .forEach(([key, value]) =>
        setObjectByPath(dataEntry.instance.data, key, value)
      );
    dataEntry.processData();
    return;
  }

  const path = autoSuggest.getAttribute('path');
  if (!path) return;

  const config = getObjectByPath(dataEntry.instance.schema.properties, path);
  if (!config?.render?.autosuggest?.mapping) return;

  // Map selected item values
  const { mapping } = config.render.autosuggest;
  const syncInstance = autoSuggest.getAttribute('sync-instance') === 'true';
  const resultObject = mapObject(detail, mapping, syncInstance ? path : '');
  if (isEmpty(resultObject)) return;

  // Update form inputs
  const form = document.forms[autoSuggest.getAttribute('form')] || dataEntry.form;
  Object.entries(resultObject).forEach(([key, value]) => {
    const input = form.elements[`${path}.${key}`];
    if (input) input.value = value ?? '';
  });

  // Update instance data if sync enabled
  if (syncInstance) {
    Object.entries(resultObject).forEach(([key, value]) =>
      setObjectByPath(dataEntry.instance.data, key, value)
    );
    dataEntry.processData();
  }
}
```

**Gotcha: isInitial flag**
- When `initial-object` attribute set, component fires event with `isInitial: true`
- Populates data without user interaction
- Skips normal mapping flow

**Gotcha: sync-instance attribute**
- `false` (default): Only updates form inputs
- `true`: Also updates `instance.data` directly
- Use true when selected value affects other fields

### bindBarcodeScanner(dataEntry) [components.js:75-83]

```javascript
function bindBarcodeScanner(dataEntry) {
  dataEntry.form.querySelectorAll('barcode-scanner').forEach((barcodeScanner) => {
    barcodeScanner.addEventListener('bs:entry', (event) =>
      handleBarcodeEntry(event, barcodeScanner, dataEntry)
    );
  });
}
```

### handleBarcodeEntry() [components.js:193-226]

```javascript
async function handleBarcodeEntry(event, barcodeScanner, dataEntry) {
  try {
    const path = barcodeScanner.getAttribute('path');
    if (!path) return;

    const config = getObjectByPath(dataEntry.instance.schema.properties, path);
    if (!config?.render?.barcode) return;

    const { api, apiArrayPath, mapping } = config.render.barcode;

    // Fetch product data from API
    const response = await fetch(`${api}${encodeURIComponent(event.detail.value)}`);
    if (!response.ok) throw new Error('Network response was not ok');

    const data = await response.json();
    let obj = apiArrayPath ? getObjectByPath(data, apiArrayPath) : data;

    // Handle array or object response
    obj = Array.isArray(obj) ? obj[0] : typeof obj === 'object' ? obj : null;
    if (!obj) return;

    // Map and add to array
    const mappedObject = mapObject(obj, mapping, '');
    const addMethod = config.render?.addMethod || 'arrayUnit';
    dataEntry.addArrayEntries(path, [mappedObject], addMethod);

  } catch (error) {
    dataEntry.showMsg('Error processing barcode', 'error');
  }
}
```

**Use case flow:**
1. User scans barcode
2. `bs:entry` event contains barcode value
3. Fetch product from API using barcode
4. Map API response to schema structure
5. Add to array using `addArrayEntries()`

### bindDataMapper(dataEntry) [components.js:85-131]

Complex setup for CSV/Excel import:
- Finds datamapper configuration in schema
- Sets custom formatters from schema (evaluated via `new Function()`)
- Sets custom column mapping
- Handles `dm:imported` event to add imported records

**Gotcha: Function evaluation**
```javascript
parsedFormatters[key] = new Function('return ' + formatter.function)();
```
- Schema can define formatter functions as strings
- Evaluated at runtime via `new Function()`
- Security consideration: Only use with trusted schemas

### bindSnackBar(dataEntry) [components.js:134-146]

```javascript
function bindSnackBar(dataEntry) {
  const snackBar = dataEntry.form.querySelector('snack-bar');
  if (snackBar) {
    dataEntry.showMsg = (message, type = 'success', duration = 3000) => {
      snackBar.add(message, type, duration);
    };
  } else {
    // Fallback if snack-bar not available
    dataEntry.showMsg = (message, type = 'info', duration = 3000) => {
      dataEntry.debugLog(`Toast fallback: ${message} (Type: ${type})`);
    };
  }
}
```

**Creates `showMsg()` method on dataEntry:**
- Used throughout for user notifications
- Falls back to `debugLog()` if no snack-bar
- Type: 'success', 'error', 'warning', 'info'

## Validation System

### validate.js - JSON Schema Validation (110 lines)

**validateType(value, type)** [validate.js:8-36]:
```javascript
function validateType(value, type) {
  // Handle array of types: ["string", "null"]
  if (Array.isArray(type)) {
    return type.some(t => validateType(value, t));
  }

  if (type === "integer") {
    return Number.isInteger(value);
  }
  if (type === "string") {
    return typeof value === "string";
  }
  if (type === "boolean") {
    return typeof value === "boolean";
  }
  if (type === "number") {
    return typeof value === "number" && !isNaN(value);
  }
  if (type === "array") {
    return Array.isArray(value);
  }
  if (type === "object") {
    return typeof value === "object" && !Array.isArray(value) && value !== null;
  }
  if (type === "null") {
    return value === null;
  }
  return false;
}
```

**Gotcha: NaN check for numbers**
- `typeof NaN === "number"` is true
- Must explicitly check `!isNaN(value)`

**Gotcha: Object excludes arrays and null**
- JSON Schema "object" means plain object only
- Arrays are type "array" not "object"
- null is type "null" not "object"

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

      // Recurse into objects
      if (propertySchema.type === 'object') {
        const result = validateObject(propertySchema, value, propertyPath);
        errors = errors.concat(result.errors);
      }

      // Recurse into arrays
      if (propertySchema.type === 'array') {
        if (!Array.isArray(value)) {
          errors.push({
            message: 'Invalid type for array property',
            property: propertyPath,
            type: 'array',
            value
          });
        } else {
          value.forEach((item, index) => {
            const result = validateObject(propertySchema.items, item, `${propertyPath}[${index}]`);
            errors = errors.concat(result.errors);
          });
        }
      }
    }
    return { valid: errors.length === 0, errors };
  }

  return validateObject(schema, data);
}
```

**Error object structure:**
```javascript
{
  message: 'Missing required property',
  property: 'items[0].name',
  type: 'string',
  value: undefined
}
```

**Gotcha: Nested validation**
- Objects validate recursively
- Arrays validate each item against `items` schema
- Path includes array indices: `items[0].variants[1].sku`

**Gotcha: Missing vs wrong type**
- `undefined` value with `required` → "Missing required property"
- Wrong type → "Invalid type for property"
- Different error messages for different issues

### Custom Validation (index.js:915-926)

```javascript
async validateData() {
  const validateData = this._customValidateData || defaultValidateData;
  const validationResult = validateData(this.instance.schema, this.instance.data);

  if (!validationResult.valid) {
    validationResult.errors.forEach(error => {
      this.debugLog(`Validation error in ${error.dataPath}: ${error.message}`);
      this.notify(1008, `Validation failed: ${error.message}`);
    });
  }
  return validationResult;
}
```

**Setting custom validator:**
```javascript
dataEntry.validateMethod = (schema, data) => {
  // Custom validation logic
  const errors = [];

  // Example: Custom business rule
  if (data.endDate < data.startDate) {
    errors.push({
      message: 'End date must be after start date',
      property: 'endDate',
      type: 'date',
      value: data.endDate
    });
  }

  return { valid: errors.length === 0, errors };
};
```

## Schema Auto-Generation

### schema.js - Infer Schema from Data (214 lines)

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

    // Recurse for objects
    if (type === 'object' && value !== null) {
      Object.assign(property, generateSchemaFromData(value, options));
    }

    // Handle arrays
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
  if (type === 'object') return null;  // Recurse, don't render directly
  if (type === 'boolean') return 'input';

  if (type === 'string') {
    if (isLikelyUrl(value)) return 'link';
    if (isLikelyImageUrl(value)) return 'media';
    if (value.length > 100) return 'textarea';
  }

  return 'input';
}
```

**Type detection heuristics:**
- `isLikelyUrl(value)`: Starts with `http://` or `https://`
- `isLikelyImageUrl(value)`: URL ending in `.jpg`, `.png`, `.gif`, `.svg`, `.webp`
- Long strings (>100 chars) → textarea

## Events System

### Custom Events Reference

| Event | When Fired | Detail Properties |
|-------|------------|-------------------|
| `de:custom` | Custom button clicked | `{ instance, submitter }` |
| `de:entry` | Data processed | `{ data, node }` |
| `de:resetfields` | Reset requested | `{ fields, resetValue }` |
| `de:submit` | Form submitted | `{ action, enctype, method }` |
| `de:notify` | Notification needed | `{ code, message, type }` |
| `de:array-control` | Array item changed | `{ action, checked, data, name, node }` |
| `de:record-created` | New record created via API | `{ record }` |
| `de:record-upserted` | Record upserted via API | `{ record }` |
| `de:record-deleted` | Record deleted via API | `{ record }` |

### Event Listeners Setup (index.js:159-194)

```javascript
// Notification listener
this.addEventListener('de:notify', (event) => {
  const { code, message, type } = event.detail;
  this.notify(code || 0, message, type);
});

// Field reset listener
this.addEventListener('de:resetfields', ({ detail: { fields, resetValue } }) => {
  this.resetFields(fields, resetValue);
});

// Submit listener
this.addEventListener('de:submit', (event) => {
  const { action, enctype, method } = event.detail;
  this.handleDataSubmission(action, method, enctype);
});

// Form input listener
this.form.addEventListener('input', this.syncInstanceData.bind(this));

// Form reset listener
this.form.addEventListener('reset', (event) => {
  const richTextElements = this.querySelectorAll('rich-text');
  richTextElements.forEach(richTextElement =>
    richTextElement.dispatchEvent(new Event('rt:reset'))
  );
});

// Form submit listener
this.form.addEventListener('submit', (event) => {
  event.preventDefault();
  const submitter = event.submitter;
  if (submitter?.dataset.handler) {
    this.dispatchEvent(new CustomEvent('de:custom', {
      detail: { instance: this.instance, submitter }
    }));
  } else {
    this.handleDataSubmission();
  }
});
```

**Gotcha: Rich-text reset**
- Native form reset doesn't clear contentEditable
- Must dispatch custom `rt:reset` event to rich-text components

**Gotcha: Custom handler detection**
- Buttons with `data-handler` attribute trigger `de:custom` event
- No `data-handler` → normal form submission flow

### handleDataSubmission() [index.js:549-625]

```javascript
handleDataSubmission(action, method, enctype) {
  const formAction = action || this.form.getAttribute('action');
  const formMethod = method || this.form.getAttribute('method') || 'POST';
  const formEnctype = enctype || this.form.getAttribute('enctype');
  const filteredData = this.filterRemovedEntries(this.instance.data);
  const isMultipart = formEnctype.includes('multipart/form-data');
  const headers = isMultipart ? {} : { 'Content-Type': formEnctype };

  let data;
  if (formEnctype.includes('json')) {
    data = JSON.stringify(filteredData);
  } else if (isMultipart) {
    const hasFile = Array.from(this.form.elements).some(el => el.type === 'file');
    if (!hasFile) {
      this.debugLog('Warning: Multipart form but no files detected.');
    }
    data = this.prepareFormData();
  } else {
    data = new URLSearchParams(filteredData).toString();
  }

  // Replace :id placeholder in action URL
  const id = this.instance.primaryKeys.length > 0
    ? filteredData[this.instance.primaryKeys[0]]
    : null;
  const actionUrl = id
    ? formAction.replace(':id', id)
    : formAction.replace('/:id', '');

  if (formAction) {
    fetch(actionUrl, {
      method: formMethod,
      headers,
      body: data
    })
    .then(response => {
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      return response.json();
    })
    .then(result => {
      let record = Array.isArray(result) ? result[0] : result;
      const recordHasPrimaryKeys = this.instance.primaryKeys.every(key => record && record[key]);

      if (formMethod === 'DELETE') {
        this.dispatchEvent(new CustomEvent('de:record-deleted', { detail: record }));
        this.notify(1005, 'Record deleted successfully!');
      } else if (recordHasPrimaryKeys && !id) {
        this.dispatchEvent(new CustomEvent('de:record-created', { detail: record }));
        this.notify(1005, 'New record created successfully!');
      } else if (recordHasPrimaryKeys) {
        this.dispatchEvent(new CustomEvent('de:record-upserted', { detail: record }));
        this.notify(1005, 'Record upserted successfully!');
      }
      // ... more cases
    })
    .catch(error => { /* error handling */ });
  } else {
    this.processData();
  }
}
```

**Gotcha: :id placeholder**
- Action URL can contain `:id` placeholder
- Replaced with primary key value for updates
- Removed (with preceding `/`) for creates

**Gotcha: filterRemovedEntries()**
- Called before submission
- Removes items with `_remove: true` flag
- Recursive: handles nested arrays

## Utility Functions Reference

### Path Functions (utility.js)

| Function | Lines | Purpose |
|----------|-------|---------|
| `getObjectByPath` | 157-178 | Read value at path |
| `setObjectByPath` | 388-414 | Set value at path, create intermediates |
| `getValueWithFallback` | 180-188 | Get value with fallback to config.render.data |

### Object Functions (utility.js)

| Function | Lines | Purpose |
|----------|-------|---------|
| `deepMerge` | 79-106 | Recursive merge with array key support |
| `isEmpty` | 190-197 | Check for null/undefined/empty object |
| `isObject` | 199-201 | Check for plain object (not array) |
| `itemExists` | 204-213 | Check if item exists in array by properties |
| `mapObject` | 215-270 | Transform object via mapping config |

### String Functions (utility.js)

| Function | Lines | Purpose |
|----------|-------|---------|
| `attrs` | 4-45 | Generate HTML attributes string |
| `buttonAttrs` | 47-56 | Generate button data-* attributes |
| `resolveTemplateString` | 323-377 | Process template patterns |
| `t` | 416-419 | Translation lookup |
| `toCamelCase` | 421-428 | kebab-case to camelCase |
| `toPascalCase` | 430-436 | kebab-case to PascalCase |
| `uuid` | 438-441 | Generate unique ID |

### Processing Functions (utility.js)

| Function | Lines | Purpose |
|----------|-------|---------|
| `processAttributes` | 272-286 | Resolve templates in attribute arrays |
| `processRenderConfig` | 307-321 | Resolve templates in render config |
| `fetchOptions` | 108-145 | Get select options from various sources |
| `convertValue` | 58-77 | Convert string value to typed value |
| `safeRender` | 379-386 | Call render method with error handling |

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
  --_lblw: 75px;                    /* Label width (mobile) */
  --_pb: .6ch;                      /* Padding block */
  --_pi: 1.2ch;                     /* Padding inline */
  --_rg: 1lh;                       /* Row gap */
}

@media (min-width: 600px) {
  --_lblw: 125px;  /* Wider labels on desktop */
}
```

**Part-based selectors:**
| Part | Description |
|------|-------------|
| `[part~=row]` | Form row container |
| `[part~=label]` | Field label |
| `[part~=input]` | Input elements |
| `[part~=select]` | Select elements |
| `[part~=textarea]` | Textarea elements |
| `[part~=nav]` | Navigation container |
| `[part~=main-nav]` | Main navigation (sticky) |
| `[part~=main]` | Main content area |
| `[part~=footer]` | Footer area |
| `[part~=fieldset]` | Fieldset container |
| `[part~=legend]` | Fieldset legend |
| `[part~=array-details]` | Array details container |
| `[part~=array-unit]` | Array unit container |
| `[part~=array-grid]` | Array grid container |
| `[part~=array-link]` | Array link container |
| `[part~=autosuggest]` | Auto-suggest container |
| `[part~=datamapper]` | Data mapper container |
| `[part~=richtext]` | Rich text container |
| `[part~=media]` | Media grid container |
| `[part~=delete]` | Delete checkbox |
| `[part~=close]` | Close button |
| `[part~=micro]` | Micro button |
| `[part~=button]` | Standard button |
| `[part~=title]` | Title element |
| `[part~=toolbar]` | Toolbar container |

**Focus states** (lines 537-555):
```css
:is(input:not([type=checkbox], [type=radio]), select, summary, textarea):focus-visible,
input[type=date]:focus-within,
label:has([type=checkbox], [type=radio]):focus-within,
ui-richtext:focus-within {
  background-color: var(--CanvasGray);
  outline: 2px solid var(--AccentColor);
  outline-offset: -2px;
}
```

**Popover styling** (lines 517-531):
```css
div[popover] {
  border: var(--_bdw) solid var(--_bdc);
  border-radius: var(--_bdrs);
  box-shadow: 0px 25px 50px -12px color-mix(in srgb, CanvasText 25%, transparent);
  inset-block: anchor(bottom) auto;
  inset-inline: auto anchor(right);
  min-inline-size: 20rem;
  padding: 2ch;
  position-anchor: var(--_pa);
  position-try-fallbacks: flip-block;
}
```

**Scroll shadow animation** (lines 262-268):
```css
@supports (animation-timeline: scroll()) {
  [part~=main-nav] {
    animation: scroll-shadow linear both;
    animation-timeline: scroll();
    animation-range: 0ex 5ex;
  }
}
```

## Public API Reference

### Attributes

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `data` | URL | - | Data source URL |
| `schema` | URL | - | JSON Schema source URL |
| `lookup` | URL | - | Lookup tables source URL |
| `i18n` | URL | - | Translations source URL |
| `messages` | URL | - | Validation messages source URL |
| `lang` | string | `'en'` | Language code |
| `shadow` | boolean | - | Enable shadow DOM |
| `debug` | boolean | - | Enable debug logging |
| `novalidate` | boolean | - | Disable JSON schema validation |
| `primary-keys` | string | `'id'` | Comma-separated primary key fields |

### Properties

| Property | Type | Description |
|----------|------|-------------|
| `data` | object | Get/set data object |
| `schema` | object | Get/set JSON Schema |
| `lookup` | array | Get/set lookup tables |
| `i18n` | object | Get/set translations |
| `constants` | object | Get/set constants |
| `validateMethod` | function | Get/set custom validation function |
| `instance` | object | Access to full instance (read-only) |

### Methods

| Method | Signature | Description |
|--------|-----------|-------------|
| `addArrayEntry` | `(element, path, insertBeforeSelector?)` | Add item via form element |
| `addArrayEntries` | `(path, entries, renderMethod?)` | Add multiple items |
| `syncInstanceData` | `(event)` | Sync form input to data |
| `renderAll` | `()` | Full re-render |
| `processData` | `(node?)` | Trigger de:entry event |
| `showMsg` | `(message, type, duration)` | Show notification |
| `resetFields` | `(fields, resetValue?)` | Reset specific fields |
| `handleDataSubmission` | `(action?, method?, enctype?)` | Submit form data |
| `notify` | `(code, message?, type?)` | Show notification by code |
| `debugLog` | `(...args)` | Conditional debug logging |

## Gotchas & Edge Cases Summary

### 1. Template String Resolution
- Templates use SPACE separation for function args, not parentheses
- Global references use `[o:name]` and `[v:name]` syntax
- Templates are NOT recursively resolved
- Missing paths return empty string, not error

### 2. Array Index Handling
- `setObjectByPath` creates intermediate arrays with undefined gaps
- Array indices must be integers in bracket notation
- Fieldsets named `${path}-entry` for array containers

### 3. Form Element Naming
- Form elements named with full path: `items[0].name`
- `data-type` attribute determines value conversion
- `data-no-sync` skips synchronization

### 4. Component Loading
- External components require import map configuration
- Components lazily loaded when tag detected in HTML
- `Component.register()` convention for registration

### 5. Validation Behavior
- `novalidate` attribute skips JSON schema validation
- Custom validator replaces (doesn't extend) built-in
- Validation runs BEFORE render

### 6. Event Timing
- `de:entry` fires after `syncInstanceData()` completes
- `de:custom` fires for buttons with `data-handler`
- Events bubble and cross shadow DOM boundary

### 7. Auto-Save Considerations
- Timer value in SECONDS, not milliseconds
- Timer cleared on `disconnectedCallback()`
- Calls `handleDataSubmission()`, not just sync

### 8. Select Options Priority
1. Inline array in `render.options`
2. Key lookup in `instance.lookup[key]`
3. Path in `instance.data`
4. Key in localStorage

### 9. Array Control Checkboxes
- Unchecking sets `_remove: true` on object
- Actual removal via `filterRemovedEntries()` before submission
- `data-array-control` attribute controls behavior

### 10. Popover Forms
- Entry popovers use external form elements
- `form` attribute links inputs to form
- CSS anchor positioning via custom properties

## File Structure

```
data-entry/
├── index.js              962 lines   Main component class
├── index.css             569 lines   Component styles
├── assets/
│   └── svg/
│       └── cross.svg               Delete icon
└── modules/
    ├── render.js         753 lines   Render methods
    ├── utility.js        441 lines   Helper functions
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
- [@browser.style/ui-icon](../icon/) - Icon component
