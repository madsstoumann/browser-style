# Product Taxonomy

## Overview

Product Taxonomy is a **factory for configuring the `<auto-suggest>` component** to search product taxonomies (Google, Facebook, custom). It includes parsers for standard taxonomy formats and can render Schema.org previews for selected categories.

**Note**: This package uses a factory-based approach - it does NOT provide a `<product-taxonomy>` web component.

## Architecture

### Package Structure

```
product-taxonomy/
├── index.js              # Main exports (createTaxonomySelector)
├── index.html            # Demo page
├── factory.js            # Factory implementation
├── parsers.js            # Taxonomy file parsers
├── readme.md             # User documentation
├── package.json          # NPM package configuration
├── google.txt            # Google product taxonomy data
└── facebook.txt          # Facebook product taxonomy data
```

### Factory Pattern

```javascript
import { createTaxonomySelector, googleTaxonomyParser } from '@browser.style/product-taxonomy';
import '@browser.style/auto-suggest';

const autoSuggestEl = document.getElementById('taxonomy');

createTaxonomySelector(autoSuggestEl, {
  dataUrl: 'google.txt',
  parser: googleTaxonomyParser
});
```

## Factory API

### `createTaxonomySelector(autoSuggestElement, options)`

Enhances a standard `<auto-suggest>` element for taxonomy searching.

**Parameters:**
- `autoSuggestElement`: The `<auto-suggest>` DOM element to enhance
- `options.dataUrl` (required): URL/path to taxonomy data file
- `options.parser` (required): Parser function for the data format

**Example:**
```javascript
createTaxonomySelector(element, {
  dataUrl: 'google.txt',
  parser: googleTaxonomyParser
});
```

## Built-in Parsers

### `googleTaxonomyParser`

Parses Google Product Taxonomy format:

```
1 - Animals & Pet Supplies
3237 - Animals & Pet Supplies > Live Animals
499954 - Animals & Pet Supplies > Pet Supplies
```

### `facebookTaxonomyParser`

Parses Facebook Product Taxonomy format.

### Custom Parser

Create a parser function that returns:

```javascript
const myParser = (line) => {
  const [id, path] = line.split(' :: ');
  const categories = path.split(' | ').map(c => c.trim());
  return {
    id,                              // Unique identifier
    name: categories.at(-1),         // Display name (last segment)
    path,                            // Full path string
    categories                       // Array of path segments
  };
};
```

## Usage

### Basic (Google Taxonomy)

```html
<auto-suggest
  id="google-taxonomy"
  label="Google Product Category"
  placeholder="e.g., headphones, coffee, toys"
  noshadow
></auto-suggest>

<script type="module">
  import { createTaxonomySelector, googleTaxonomyParser } from '@browser.style/product-taxonomy';
  import '@browser.style/auto-suggest';

  const el = document.getElementById('google-taxonomy');
  createTaxonomySelector(el, {
    dataUrl: 'google.txt',
    parser: googleTaxonomyParser
  });
</script>
```

### With Schema.org Preview

Add `schema` attribute to show generated markup:

```html
<auto-suggest
  id="taxonomy"
  label="Category"
  schema="microdata jsonld"
></auto-suggest>
```

Options:
- `schema="microdata"`: Shows Microdata preview
- `schema="jsonld"`: Shows JSON-LD preview
- `schema="microdata jsonld"`: Shows both

## Component Attributes

(Applied to `<auto-suggest>` element)

| Attribute | Description | Default |
|-----------|-------------|---------|
| `label` | Input field label | - |
| `placeholder` | Input placeholder text | - |
| `schema` | Schema preview types | - |
| `minlength` | Min chars before search | 2 |
| `max-results` | Max results to show | 50 |
| `list-mode` | "datalist" or "ul" | "datalist" |
| `noshadow` | Render without Shadow DOM | - |
| `required` | Make field required | - |
| `info-template` | Template for info text | "Loaded {count} categories" |

## Slots

### `slot="info"`

Static, persistent information:

```html
<auto-suggest>
  <small slot="info">Use arrow keys to navigate</small>
</auto-suggest>
```

### `slot="status"`

Dynamic status updates (auto-managed):

```html
<auto-suggest>
  <small slot="status"></small>
</auto-suggest>
```

## Events

| Event | Description | Detail |
|-------|-------------|--------|
| `taxonomyLoadStart` | Loading begins | - |
| `taxonomyLoadEnd` | Loading completes | `{ count }` |
| `taxonomyLoadError` | Loading error | - |
| `taxonomySearchStart` | Search begins | - |
| `taxonomySearchEnd` | Search completes | `{ count }` |
| `taxonomySelect` | Category selected | Full taxonomy item |
| `taxonomyClear` | Selection cleared | - |

```javascript
element.addEventListener('taxonomySelect', (e) => {
  console.log('Selected:', e.detail);
  // { id: "3237", name: "Live Animals", path: "...", categories: [...] }
});
```

## API Methods

| Method | Description |
|--------|-------------|
| `selectedItem` | (Read-only) Get selected taxonomy item |
| `setValue(id, display)` | Set value programmatically |
| `search(query)` | Trigger search programmatically |

## Schema Generation

For schema preview to work, parser must return object with:

- `id`: Unique identifier
- `name`: Category name
- `path`: Full category path
- `categories`: Array of path segments

## Dependencies

- **@browser.style/auto-suggest**: Required peer dependency

## Debugging Tips

1. **Autocomplete not working?** Check `dataUrl` points to valid file
2. **Parser errors?** Verify line format matches parser expectations
3. **Schema not showing?** Ensure `schema` attribute is set
4. **No results?** Check `minlength` setting vs. query length
