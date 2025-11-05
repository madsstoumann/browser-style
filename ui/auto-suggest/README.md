# AutoSuggest

A customizable web component that provides search input with auto-suggest functionality. Supports multiple search modes including API-based search, local filtering, keyword search, and fuzzy matching with typo tolerance.

## Installation

```bash
npm install @browser.style/auto-suggest
```

## Usage

```javascript
import '@browser.style/auto-suggest';
```

```html
<!-- Basic usage with datalist (API mode - default) -->
<auto-suggest
  api="https://api.example.com/search?q="
  api-value-path="id"
  api-display-path="name"
  label="Search"
  placeholder="Type to search">
</auto-suggest>

<!-- Using popover list mode -->
<auto-suggest
  api="https://api.example.com/search?q="
  api-value-path="id"
  api-display-path="name"
  label="Search"
  list-mode="ul"
  placeholder="Type to search">
</auto-suggest>

<!-- Local keyword search (like "coffee cups" matching "Kitchen > Coffee > Cups") -->
<auto-suggest
  api="products.json"
  search-mode="local-keywords"
  search-fields="name,category,description"
  api-value-path="id"
  api-display-path="name"
  label="Search Products"
  placeholder="e.g., coffee cups">
</auto-suggest>

<!-- Local search with OR operator (any keyword matches) -->
<auto-suggest
  api="users.json"
  search-mode="local-keywords"
  search-fields="name,email,department"
  search-operator="OR"
  api-value-path="id"
  api-display-path="name"
  label="Search Users">
</auto-suggest>

<!-- Fuzzy search with typo tolerance -->
<auto-suggest
  api="products.json"
  search-mode="local-fuzzy"
  search-fields="name,description"
  min-score="0.5"
  max-results="20"
  api-value-path="id"
  api-display-path="name"
  label="Fuzzy Product Search"
  placeholder="Try with typos: cofee, hphone">
</auto-suggest>

<!-- With automatic status updates -->
<auto-suggest
  api="products.json"
  search-mode="local-keywords"
  search-fields="name,category"
  api-value-path="id"
  api-display-path="name"
  info-template="{count} products available"
  label="Search Products">
  <small slot="info"></small>
  <small slot="status"></small>
</auto-suggest>
```

### Search Mode Comparison

| Mode | Query | Matches | Use Case |
|------|-------|---------|----------|
| `api` | `"phone"` | Server decides | Real-time API search |
| `local` | `"phone"` | Contains "phone" | Simple filtering |
| `local-keywords` | `"smart phone"` | Contains "smart" AND "phone" | Multi-word exact matching |
| `local-fuzzy` | `"smat phne"` | Fuzzy match with typos | Typo-tolerant search |

## Attributes

- `api` (required): API endpoint for fetching suggestions
- `api-value-path`: Path to value in API response
- `api-display-path`: Path to display text in API response
- `api-text-path`: Path to additional text in API response
- `api-array-path`: Path to array in nested API response
- `cache`: Enable result caching (true/false)
- `debounce`: Debounce time in ms (default: 300)
- `display`: Initial display value
- `info-template`: Template for info slot text (use `{count}` placeholder, default: '{count} items loaded')
- `invalid`: Custom validation message
- `label`: Input label
- `list-mode`: Display mode ('datalist' or 'ul')
- `minlength`: Min. characters before search (default: 3)
- `noform`: Exclude from form submission
- `nolimit`: Allow free text input
- `value`: Initial value

### Search Mode Attributes (New)

- `search-mode`: Search strategy (default: 'api')
  - `'api'`: Fetch from API on each query (default)
  - `'local'`: Load data once, filter with simple includes
  - `'local-keywords'`: Load data once, split query into keywords, match all terms
  - `'local-fuzzy'`: Load data once, use fuzzy matching with typo tolerance
- `search-fields`: Comma-separated fields to search (default: api-display-path)
- `search-operator`: Keyword matching logic for `local-keywords` mode
  - `'AND'`: All terms must match (default)
  - `'OR'`: Any term can match
- `search-transform`: Text transformation for searching
  - `'lowercase'`: Convert to lowercase (default)
  - `'uppercase'`: Convert to uppercase
  - `'none'`: No transformation
- `min-score`: Minimum similarity score for fuzzy matching (0-1, default: 0.6)
  - Only applies to `local-fuzzy` mode
  - Lower values = more lenient matching
  - Higher values = stricter matching
- `max-results`: Maximum number of results to return (default: 50)
  - Applies to `local-fuzzy` mode (results sorted by relevance)

## Slots

The component supports two named slots for displaying status information:

### `slot="info"`
Static, persistent information that remains visible. Automatically updated once when data loads using the `info-template` attribute.
- **Use for:** Data counts, helpful hints, keyboard shortcuts
- **Example:** "5,600 categories loaded", "Use arrow keys to navigate"
- **Template:** Use `info-template="{count} items loaded"` to customize the message

### `slot="status"`
Dynamic status updates based on component events. Automatically managed.
- **Updates on:** Loading, searching, results count, errors, selection
- **Example:** "Loading...", "Found 23 results", "No results found"

```html
<auto-suggest api="data.json" search-mode="local">
  <small slot="info"></small>    <!-- Persistent info -->
  <small slot="status"></small>  <!-- Dynamic status -->
</auto-suggest>
```

Both slots are optional. If provided, they will be automatically updated by the component.

## Events

- `autoSuggestSelect`: Option selected
- `autoSuggestClear`: Input cleared
- `autoSuggestFetchStart`: Fetch started
- `autoSuggestFetchEnd`: Fetch completed
- `autoSuggestFetchError`: Fetch failed
- `autoSuggestNoResults`: No results found
- `autoSuggestNoSelection`: Enter pressed (requires nolimit)

## Search Modes

### API Mode (default)
Fetches results from a remote API on each query. Best for large datasets or when server-side filtering is needed.

### Local Mode
Loads data once and filters locally with simple substring matching. Best for small to medium datasets.

### Local Keywords Mode
Loads data once and uses multi-keyword search where all (or any) terms must match. Perfect for hierarchical data like "coffee cups" matching "Kitchen > Coffee > Cups".

### Local Fuzzy Mode
Loads data once and uses Levenshtein distance algorithm for typo-tolerant matching. Great for user-facing search where spelling mistakes are common.

## Form Integration

The component integrates with forms and provides both `value` and `displayValue`:

```html
<form>
  <auto-suggest
    name="search"
    api="https://api.example.com/search?q="
    api-value-path="id"
    api-display-path="name">
  </auto-suggest>
</form>
```

Access form values:
```javascript
const form = document.querySelector('form');
const suggest = form.elements.search;
console.log(suggest.value); // Selected value
console.log(suggest.displayValue); // Display text
```

## Advanced Examples

For more examples including multi-column search and all search modes, see [advanced.html](advanced.html).
