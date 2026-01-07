# Web Config Taxonomy - Internal Architecture

## Overview

Web Config Taxonomy is a **factory function library** that enhances the `<auto-suggest>` component to work with product taxonomy data (Google, Facebook, or custom formats). It includes parsers for standard formats and generates Schema.org previews.

**Package Type:** JavaScript Factory Library (no web component)

**Package Version:** 2.0.0

**Total LOC:** ~214 lines across 3 files

**Key architectural decisions:**
- **Factory pattern**: Enhances existing `<auto-suggest>` elements rather than defining new component
- **Parser functions**: Pluggable parsers for different taxonomy file formats
- **Schema.org generation**: Automatic Microdata and JSON-LD preview rendering
- **Event-driven**: Custom events for lifecycle hooks (load start, end, error)
- **Zero dependencies**: Only requires `<auto-suggest>` as peer dependency

## Architecture Overview

### Factory Enhancement Flow

```
createTaxonomySelector(element, options)
  ↓
Dispatch 'taxonomyLoadStart' event
  ↓
fetchAndParseTaxonomy(dataUrl, parser)
  ↓
Fetch taxonomy file → Parse each line → Filter valid entries
  ↓
Inject parsed data into element.fullDataset
  ↓
Dispatch 'taxonomyLoadEnd' event with count
  ↓
If schema attribute exists → Create preview element
  ↓
Listen for autoSuggestSelect/autoSuggestClear events
  ↓
Update schema preview on selection
```

### Schema Generation Flow

```
User selects taxonomy item
  ↓
autoSuggestSelect event fired
  ↓
updateSchemaPreview(previewEl, item)
  ↓
Generate Microdata HTML (if enabled)
Generate JSON-LD script (if enabled)
  ↓
Display in preview element
```

## File Structure

```
web-config-taxonomy/
├── index.js        9 lines     Re-exports from factory and parsers
├── factory.js      166 lines   Main factory implementation
├── parsers.js      39 lines    Taxonomy file parsers
├── index.html      ---         Demo page
├── readme.md       ---         User documentation
├── package.json    ---         NPM configuration
├── google.txt      ---         Google product taxonomy data
├── facebook.txt    ---         Facebook product taxonomy data
└── AGENTS.md       ---         This file
```

## API Reference

### File: [index.js](index.js)

#### Exports (Lines 1-9)

```javascript
export { createTaxonomySelector } from './factory.js';
export { googleTaxonomyParser, facebookTaxonomyParser } from './parsers.js';
```

### File: [factory.js](factory.js)

#### `createTaxonomySelector(autoSuggestElement, options)` (Lines 121-165)

Main factory function that enhances an `<auto-suggest>` element.

```javascript
/**
 * @param {HTMLElement} autoSuggestElement - The <auto-suggest> element to enhance
 * @param {object} options - Configuration options
 * @param {string} options.dataUrl - URL/path to taxonomy data file
 * @param {Function} options.parser - Parser function for the data format
 * @returns {Promise<void>}
 */
export async function createTaxonomySelector(autoSuggestElement, { dataUrl, parser })
```

**Implementation Details:**

```javascript
/* Lines 122-125 - Element validation */
if (!autoSuggestElement || autoSuggestElement.tagName !== 'AUTO-SUGGEST') {
  console.error('The provided element must be an <auto-suggest> component.');
  return;
}

/* Lines 127-131 - Data loading */
try {
  autoSuggestElement.dispatchEvent(new CustomEvent('taxonomyLoadStart', { bubbles: true }));
  const parsedData = await fetchAndParseTaxonomy(
    new URL(dataUrl, import.meta.url).href,
    parser
  );

/* Lines 133-140 - Inject data and dispatch success */
  autoSuggestElement.fullDataset = parsedData;
  autoSuggestElement.dispatchEvent(new CustomEvent('taxonomyLoadEnd', {
    detail: { count: parsedData.length },
    bubbles: true
  }));

/* Lines 142-156 - Schema preview setup */
  const schemaAttr = autoSuggestElement.getAttribute('schema');
  if (schemaAttr) {
    const schemaTypes = schemaAttr.split(' ').filter(Boolean);
    const schemaPreviewEl = createSchemaPreviewElement(schemaTypes);
    autoSuggestElement.insertAdjacentElement('afterend', schemaPreviewEl);

    autoSuggestElement.addEventListener('autoSuggestSelect', (e) => {
      updateSchemaPreview(schemaPreviewEl, e.detail);
    });

    autoSuggestElement.addEventListener('autoSuggestClear', () => {
      if (schemaPreviewEl) schemaPreviewEl.hidden = true;
    });
  }

/* Lines 158-164 - Error handling */
} catch (error) {
  console.error('Error setting up taxonomy selector:', error);
  autoSuggestElement.dispatchEvent(new CustomEvent('taxonomyLoadError', {
    detail: error,
    bubbles: true
  }));
}
```

#### `fetchAndParseTaxonomy(url, parser)` (Lines 90-109)

Internal function that fetches and parses taxonomy data.

```javascript
/**
 * @param {string} url - The URL of the taxonomy file
 * @param {Function} parser - Parser function to process each line
 * @returns {Promise<Array<object>>} Parsed taxonomy items
 * @throws {Error} If fetch fails or parser is invalid
 */
async function fetchAndParseTaxonomy(url, parser)
```

**Implementation:**

```javascript
/* Lines 91-93 - Parser validation */
if (!parser || typeof parser !== 'function') {
  throw new Error('A valid parser function must be provided.');
}

/* Lines 94-99 - Fetch and split lines */
const response = await fetch(url);
if (!response.ok) {
  throw new Error(`Failed to load taxonomy data from "${url}"`);
}
const text = await response.text();
const lines = text.split('\n').filter(line => line.trim() && !line.startsWith('#'));

/* Lines 101-108 - Parse each line and add search text */
return lines.map(line => {
  const item = parser(line);
  if (item) {
    // Add _searchText for auto-suggest's local search
    item._searchText = item.path.toLowerCase();
  }
  return item;
}).filter(Boolean);
```

### Schema.org Generators

#### `generateMicrodata(item)` (Lines 13-27)

Generates HTML Microdata markup for Schema.org Product category.

```javascript
function generateMicrodata(item) {
  const categories = item.categories;
  const boilerplate = `<span class="schema-boilerplate">
    ${escapeHtml('<div itemscope itemtype="https://schema.org/Product">')}
    ${escapeHtml('<meta itemprop="name" content="Example Product">')}
  </span>\n`;

  let taxonomyHtml = `  ${escapeHtml('<div itemprop="category" itemscope itemtype="https://schema.org/DefinedTerm">')}\n`;
  taxonomyHtml += `    ${escapeHtml(`<meta itemprop="termCode" content="${item.id}">`)}\n`;
  taxonomyHtml += `    ${escapeHtml(`<meta itemprop="name" content="${item.name}">`)}\n`;

  if (categories.length > 1) {
    taxonomyHtml += `    ${escapeHtml('<div itemprop="inDefinedTermSet" itemscope itemtype="https://schema.org/DefinedTermSet">')}\n`;
    taxonomyHtml += `      ${escapeHtml(`<meta itemprop="name" content="${categories.slice(0, -1).join(' > ')}">`)}\n`;
    taxonomyHtml += `    ${escapeHtml('</div>')}\n`;
  }
  taxonomyHtml += `  ${escapeHtml('</div>')}\n`;
  return boilerplate + taxonomyHtml;
}
```

#### `generateJsonLd(item)` (Lines 29-53)

Generates JSON-LD script for Schema.org Product category.

```javascript
function generateJsonLd(item) {
  const jsonld = {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": "Example Product",
    "category": {
      "@type": "DefinedTerm",
      "termCode": item.id,
      "name": item.name,
      "inDefinedTermSet": {
        "@type": "DefinedTermSet",
        "name": "Product Taxonomy"
      },
      "additionalProperty": {
        "@type": "PropertyValue",
        "name": "categoryPath",
        "value": item.path
      }
    }
  };

  if (item.categories.length > 1) {
    jsonld.category.inDefinedTermSet.name = item.categories.slice(0, -1).join(' > ');
  }

  return JSON.stringify(jsonld, null, 2);
}
```

#### `createSchemaPreviewElement(schemaTypes)` (Lines 55-67)

Creates the DOM element for schema preview display.

```javascript
function createSchemaPreviewElement(schemaTypes) {
  const container = document.createElement('div');
  container.className = 'schema-preview';
  container.hidden = true;

  if (schemaTypes.includes('microdata')) {
    container.innerHTML += `<h4>Schema.org Microdata</h4><pre class="schema-microdata"></pre>`;
  }
  if (schemaTypes.includes('jsonld')) {
    container.innerHTML += `<h4>Schema.org JSON-LD</h4><pre class="schema-jsonld"></pre>`;
  }
  return container;
}
```

#### `updateSchemaPreview(previewEl, item)` (Lines 69-80)

Updates schema preview with selected item data.

```javascript
function updateSchemaPreview(previewEl, item) {
  if (!previewEl || !item) {
    if (previewEl) previewEl.hidden = true;
    return;
  }
  previewEl.hidden = false;
  const microdataEl = previewEl.querySelector('.schema-microdata');
  const jsonldEl = previewEl.querySelector('.schema-jsonld');

  if (microdataEl) microdataEl.innerHTML = generateMicrodata(item);
  if (jsonldEl) jsonldEl.textContent = generateJsonLd(item);
}
```

#### `escapeHtml(str)` (Lines 9-11)

HTML entity escaping utility.

```javascript
function escapeHtml(str) {
  return str.replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
```

### File: [parsers.js](parsers.js)

#### `googleTaxonomyParser(line)` (Lines 14-20)

Parses Google Product Taxonomy format.

```javascript
/**
 * Example line: `123 - Electronics > Audio > Headphones`
 * @param {string} line - A single line from the taxonomy file
 * @returns {object|null} Parsed item or null if invalid
 */
export const googleTaxonomyParser = (line) => {
  const match = line.match(/^(\d+)\s*-\s*(.+)$/);
  if (!match) return null;
  const [, id, path] = match;
  const categories = path.split('>').map(c => c.trim());
  return { id, name: categories[categories.length - 1], path, categories };
};
```

**Regex Breakdown:**
- `^(\d+)` - Capture numeric ID at start
- `\s*-\s*` - Match dash with optional whitespace
- `(.+)$` - Capture remaining path

#### `facebookTaxonomyParser(line)` (Lines 28-38)

Parses Facebook Product Taxonomy format.

```javascript
/**
 * Example line: `123,Electronics > Audio > Headphones`
 * @param {string} line - A single line from the taxonomy file
 * @returns {object|null} Parsed item or null if invalid
 */
export const facebookTaxonomyParser = (line) => {
  const firstCommaIndex = line.indexOf(',');
  if (firstCommaIndex === -1) return null;

  const id = line.substring(0, firstCommaIndex).trim();
  const path = line.substring(firstCommaIndex + 1).trim().replace(/"/g, '');
  const categories = path.split('>').map(c => c.trim());
  return { id, name: categories[categories.length - 1], path, categories };
};
```

**Note:** Uses `indexOf` instead of regex to handle paths that might contain commas.

## Parsed Item Structure

Both parsers return objects with this structure:

```javascript
{
  id: string,        // Unique identifier (e.g., "3237")
  name: string,      // Category name (last segment, e.g., "Headphones")
  path: string,      // Full path (e.g., "Electronics > Audio > Headphones")
  categories: string[] // Path segments (e.g., ["Electronics", "Audio", "Headphones"])
}
```

The factory adds:

```javascript
{
  _searchText: string  // Lowercased path for auto-suggest search
}
```

## Events

### Dispatched Events

| Event | When | Detail | Lines |
|-------|------|--------|-------|
| `taxonomyLoadStart` | Loading begins | None | 129 |
| `taxonomyLoadEnd` | Loading completes | `{ count: number }` | 137-140 |
| `taxonomyLoadError` | Loading fails | `Error` object | 160-163 |

### Listened Events

| Event | Source | Action | Lines |
|-------|--------|--------|-------|
| `autoSuggestSelect` | `<auto-suggest>` | Update schema preview | 149-151 |
| `autoSuggestClear` | `<auto-suggest>` | Hide schema preview | 153-155 |

## Usage Examples

### Basic Google Taxonomy

```html
<auto-suggest
  id="taxonomy"
  label="Product Category"
  placeholder="Search categories..."
  noshadow
></auto-suggest>

<script type="module">
  import { createTaxonomySelector, googleTaxonomyParser } from '@browser.style/web-config-taxonomy';
  import '@browser.style/auto-suggest';

  createTaxonomySelector(document.getElementById('taxonomy'), {
    dataUrl: 'google.txt',
    parser: googleTaxonomyParser
  });
</script>
```

### Facebook Taxonomy with Schema Preview

```html
<auto-suggest
  id="fb-taxonomy"
  label="Facebook Category"
  schema="microdata jsonld"
></auto-suggest>

<script type="module">
  import { createTaxonomySelector, facebookTaxonomyParser } from '@browser.style/web-config-taxonomy';

  createTaxonomySelector(document.getElementById('fb-taxonomy'), {
    dataUrl: 'facebook.txt',
    parser: facebookTaxonomyParser
  });
</script>
```

### Custom Parser

```javascript
// Custom format: "ID :: Category | Subcategory | Name"
const myParser = (line) => {
  const [id, pathStr] = line.split(' :: ');
  if (!id || !pathStr) return null;

  const categories = pathStr.split(' | ').map(c => c.trim());
  return {
    id: id.trim(),
    name: categories[categories.length - 1],
    path: pathStr,
    categories
  };
};

createTaxonomySelector(element, {
  dataUrl: 'my-taxonomy.txt',
  parser: myParser
});
```

### Event Handling

```javascript
const el = document.getElementById('taxonomy');

el.addEventListener('taxonomyLoadStart', () => {
  console.log('Loading taxonomy...');
});

el.addEventListener('taxonomyLoadEnd', (e) => {
  console.log(`Loaded ${e.detail.count} categories`);
});

el.addEventListener('taxonomyLoadError', (e) => {
  console.error('Failed to load:', e.detail);
});

createTaxonomySelector(el, { dataUrl, parser });
```

## Dependencies

| Dependency | Type | Purpose |
|------------|------|---------|
| `@browser.style/auto-suggest` | Peer | Base component enhanced by factory |

## Schema.org Output Examples

### Microdata Output

```html
<div itemscope itemtype="https://schema.org/Product">
  <meta itemprop="name" content="Example Product">
  <div itemprop="category" itemscope itemtype="https://schema.org/DefinedTerm">
    <meta itemprop="termCode" content="3237">
    <meta itemprop="name" content="Live Animals">
    <div itemprop="inDefinedTermSet" itemscope itemtype="https://schema.org/DefinedTermSet">
      <meta itemprop="name" content="Animals & Pet Supplies">
    </div>
  </div>
</div>
```

### JSON-LD Output

```json
{
  "@context": "https://schema.org",
  "@type": "Product",
  "name": "Example Product",
  "category": {
    "@type": "DefinedTerm",
    "termCode": "3237",
    "name": "Live Animals",
    "inDefinedTermSet": {
      "@type": "DefinedTermSet",
      "name": "Animals & Pet Supplies"
    },
    "additionalProperty": {
      "@type": "PropertyValue",
      "name": "categoryPath",
      "value": "Animals & Pet Supplies > Live Animals"
    }
  }
}
```

## Gotchas & Edge Cases

### 1. URL Resolution (factory.js:131)

```javascript
const parsedData = await fetchAndParseTaxonomy(
  new URL(dataUrl, import.meta.url).href,
  parser
);
```

The `dataUrl` is resolved relative to the factory module, not the calling script. Use absolute URLs or ensure the file is in the expected location.

### 2. Comment Lines Filtered (factory.js:99)

```javascript
const lines = text.split('\n').filter(line => line.trim() && !line.startsWith('#'));
```

Lines starting with `#` are treated as comments and skipped. Empty lines are also filtered.

### 3. Parser Must Return Valid Object

If a parser returns `null` or falsy value, that line is skipped:

```javascript
// factory.js:101-108
return lines.map(line => {
  const item = parser(line);
  // ...
}).filter(Boolean);  // Removes null/undefined entries
```

### 4. Schema Attribute Parsing (factory.js:143-145)

```javascript
const schemaAttr = autoSuggestElement.getAttribute('schema');
const schemaTypes = schemaAttr.split(' ').filter(Boolean);
```

Schema types are space-separated. Valid values: `microdata`, `jsonld`, or both.

### 5. Element Validation (factory.js:122-125)

```javascript
if (!autoSuggestElement || autoSuggestElement.tagName !== 'AUTO-SUGGEST') {
  console.error('The provided element must be an <auto-suggest> component.');
  return;
}
```

Only works with `<auto-suggest>` elements. Custom elements with different tag names will fail.

### 6. fullDataset Property

The factory injects data via the `fullDataset` property (factory.js:134):

```javascript
autoSuggestElement.fullDataset = parsedData;
```

This assumes `<auto-suggest>` exposes this property. The component must support this API.

### 7. Preview Element Placement (factory.js:147)

```javascript
autoSuggestElement.insertAdjacentElement('afterend', schemaPreviewEl);
```

The schema preview is inserted immediately after the `<auto-suggest>` element. Ensure your layout accommodates this.

### 8. Search Text Generation (factory.js:104-105)

```javascript
item._searchText = item.path.toLowerCase();
```

The `_searchText` property enables auto-suggest's local search. It uses the full path, so searches match against parent categories too.

### 9. Facebook Parser Quote Handling (parsers.js:35)

```javascript
const path = line.substring(firstCommaIndex + 1).trim().replace(/"/g, '');
```

Facebook taxonomy may include quotes around paths. These are stripped during parsing.

### 10. Error Bubbling (factory.js:161-163)

```javascript
autoSuggestElement.dispatchEvent(new CustomEvent('taxonomyLoadError', {
  detail: error,
  bubbles: true
}));
```

Errors bubble up the DOM tree. Parent elements can catch and handle them.

## Creating Custom Parsers

A parser function must:

1. Accept a single `line` string parameter
2. Return an object with `{ id, name, path, categories }` or `null`
3. Handle malformed input gracefully (return `null`)

```javascript
// Template for custom parser
const customParser = (line) => {
  // Attempt to parse
  try {
    // Your parsing logic here
    const id = /* extract ID */;
    const path = /* extract full path */;
    const categories = /* split path into array */;

    return {
      id,
      name: categories[categories.length - 1],
      path,
      categories
    };
  } catch {
    return null;  // Skip malformed lines
  }
};
```

## Debugging Tips

1. **Data not loading?** Check `dataUrl` path is correct relative to the module
2. **Parser errors?** Log parsed output to verify line format matches parser regex
3. **Schema not showing?** Ensure `schema` attribute is set on `<auto-suggest>`
4. **No search results?** Verify `_searchText` is being added to items
5. **Events not firing?** Check element is valid `<auto-suggest>` before calling factory
6. **Preview hidden after selection?** Verify `autoSuggestSelect` event detail contains required fields

## Related Components

- [auto-suggest](../auto-suggest/) - Base component enhanced by this factory
