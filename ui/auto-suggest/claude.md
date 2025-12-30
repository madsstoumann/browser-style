# AutoSuggest Component - Internal Architecture

## Overview

`<auto-suggest>` is a customizable web component providing search input with auto-suggest functionality. It supports multiple search modes including API-based search, local filtering, keyword-based search, and fuzzy matching with typo tolerance.

**Version:** 1.1.0

**Component Type:** Form-associated custom element extending FormElement

**Search Modes:**
1. **API mode** (`search-mode="api"`) - Remote server handles search
2. **Local mode** (`search-mode="local"`) - Client-side substring filtering
3. **Keyword mode** (`search-mode="local-keywords"`) - Multi-term AND/OR matching
4. **Fuzzy mode** (`search-mode="local-fuzzy"`) - Typo-tolerant Levenshtein matching

**Key architectural decisions:**
- **FormElement inheritance**: Provides form association, lifecycle hooks, and utilities
- **Debounced fetching**: Prevents excessive API requests during typing
- **Local data preprocessing**: `_searchText` computed once on load for fast filtering
- **Dual list modes**: Native datalist OR custom popover with keyboard navigation
- **CSS anchor positioning**: Modern alignment for custom popover mode

## Architecture Overview

### Component Lifecycle

```
constructor()
  ↓
  super() → FormElement initialization
  this.data = []                    // Current filtered results
  this.fullDataset = null           // Complete dataset cache (local modes)
  ↓
initializeComponent()               // Called by FormElement
  ↓
  Set defaults for display/value attributes (lines 33-35)
  Parse initial-object attribute for reset (line 37)
  Generate unique list ID (line 38)
  #setupSettings() → Normalize all attributes (line 40)
  Validate API endpoint exists (lines 41-44)
  ↓
  Initialize template and DOM (line 47)
  Store element references: input, list, slots (lines 49-53)
  Setup form integration if needed (lines 55-58)
  Create debounced fetch function (line 60)
  Add event listeners (line 61)
  ↓
  Pre-load data for local modes (lines 63-65)
  ↓
connectedCallback()
  ↓
  Component ready for user interaction
  ↓
attributeChangedCallback(name, oldValue, newValue)
  ↓
  Update settings + re-render as needed
  ↓
disconnectedCallback()
  ↓
  Cleanup: event listeners, pending requests
```

**Critical timing:** For local modes, data is fetched only once on first query ≥ minLength. Subsequent queries filter the cached `fullDataset` without network requests.

### Module System

**Single-file component with inheritance:**

- **index.js** (480 lines) - AutoSuggest class extending FormElement
- **../common/form.element.js** (300+ lines) - Base class with form integration

**Import strategy:**
```javascript
import { FormElement } from '../common/form.element.js';
```

FormElement provides:
- `formAssociated = true` static property
- `debounced(delay, fn)` utility
- `uuid()` for unique IDs
- `escapeJsonForHtml(obj)` for safe attribute values
- Form value management via ElementInternals

## Data Flow Pipeline

### Complete Data Journey

```
INPUT (2 sources based on search-mode)
  ↓
1. API mode: Fetch from server per keystroke
2. Local modes: Fetch once, filter locally
  ↓
fetchData(value)  [index.js:195-201]
  ↓
  Route to fetchApiData() OR fetchLocalData()
  ↓
fetchApiData(value)  [index.js:203-217]
  ↓
  Check cache flag (line 204)
  Dispatch 'autoSuggestFetchStart' event (line 205)
  Fetch from ${api}${encodeURIComponent(value)} (line 207)
  Extract array path if configured (line 211)
  Dispatch 'autoSuggestFetchEnd' event (line 209)
  ↓
fetchLocalData(value)  [index.js:219-255]
  ↓
  First call only:
    Fetch full dataset from API
    Preprocess each item with _searchText (lines 228-235)
    Cache in fullDataset
  ↓
  Filter cached data:
    Check minLength threshold (line 248)
    Transform query text (line 250)
    Call filterLocalData(query) (line 252)
  ↓
filterLocalData(query)  [index.js:276-286]
  ↓
  Route based on searchMode:
    'local' → Simple includes() match
    'local-keywords' → filterByKeywords()
    'local-fuzzy' → filterByFuzzy()
  ↓
render(data)  [index.js:358-369]
  ↓
  Generate HTML for results
  Map each item to <li> or <option> based on listMode
  Extract value, display, text from paths
  Escape object for data-obj attribute
  ↓
  Inject into list innerHTML
  ↓
OUTPUT: Rendered suggestions in DOM
```

### Search Algorithm Details

**Keyword Search** (lines 288-296):
```javascript
filterByKeywords(query) {
  const terms = query.split(/\s+/);
  return this.fullDataset.filter(item => {
    if (this.settings.searchOperator === 'AND') {
      return terms.every(term => item._searchText.includes(term));
    }
    return terms.some(term => item._searchText.includes(term));
  });
}
```

**Fuzzy Search with Levenshtein Distance** (lines 298-352):

1. Calculate edit distance between strings (lines 298-316):
```javascript
levenshteinDistance(a, b) {
  // Dynamic programming approach
  // Swaps for optimization if a shorter than b
  // Returns minimum edit operations needed
}
```

2. Convert to similarity score (lines 318-322):
```javascript
calculateSimilarity(query, target) {
  const distance = this.levenshteinDistance(query, target);
  return 1 - (distance / Math.max(query.length, target.length));
}
```

3. Filter and rank results (lines 324-352):
```javascript
filterByFuzzy(query) {
  const searchTerms = query.split(/\s+/);
  // For each item, find best matching word per search term
  // Direct substring match = score 1.0
  // Otherwise use Levenshtein similarity
  // Filter by minScore, sort by score desc, limit to maxResults
}
```

**Performance characteristics:**
- API mode: O(network) per keystroke after debounce
- Local mode: O(n) with simple includes()
- Keyword mode: O(n * m) where m = number of terms
- Fuzzy mode: O(n * w * t) where w = words per item, t = search terms

### State Management

**Instance Properties:**
```javascript
this.data = [];              // Current filtered results
this.fullDataset = null;     // Complete dataset (local modes only)
this.settings = {};          // Normalized configuration
this.input = null;           // Input element reference
this.list = null;            // List element reference
this.#debouncedFetch = null; // Debounced fetch function
```

**Settings Object** (line 68-115):
```javascript
{
  api: null,                  // API endpoint URL
  apiArrayPath: null,         // Dot-path to results array
  apiDisplayPath: null,       // Dot-path to display text
  apiTextPath: null,          // Dot-path to secondary text
  apiValuePath: null,         // Dot-path to value/ID
  cache: false,               // Enable result caching
  debounce: 300,              // Debounce delay (ms)
  infoTemplate: '{count} items loaded',
  statusTemplate: null,       // Template for status slot
  invalid: 'Please select a valid option.',
  label: null,                // Input label text
  listMode: 'datalist',       // 'datalist' or 'ul'
  searchMode: 'api',          // Search strategy
  searchFields: null,         // Fields to search (array)
  searchOperator: 'AND',      // 'AND' or 'OR' for keywords
  searchTransform: 'lowercase', // Text normalization
  minScore: 0.6,              // Fuzzy match threshold
  maxResults: 50,             // Max fuzzy results
  minLength: 3,               // Min chars to trigger search
  nolimit: false              // Allow free text input
}
```

## Event System

### Custom Events Dispatched

| Event | Trigger | Detail | Line |
|-------|---------|--------|------|
| `autoSuggestSelect` | Item selected | Full object data, isInitial flag | 186, 417 |
| `autoSuggestClear` | Input cleared or form reset | None | 192, 375 |
| `autoSuggestFetchStart` | Fetch begins | None | 205, 224 |
| `autoSuggestFetchEnd` | Fetch completes | None | 209, 237 |
| `autoSuggestFetchError` | Fetch fails | Error object | 214, 239 |
| `autoSuggestNoResults` | Empty results | None | 263 |
| `autoSuggestNoSelection` | Enter with nolimit | None | 138 |

### Event Handler Methods

**#handleKeydown(e)** (lines 134-149):
- Enter key: Dispatch selection or no-selection event
- ArrowDown in ul mode: Open popover, focus first item
- Ctrl/Cmd + Z: Reset to defaults

**#handleInput(e)** (lines 151-169):
- Check minLength threshold
- Detect browser auto-fill via inputType
- Auto-select if value matches datalist option
- Otherwise trigger debounced fetch

**#handleSearch(e)** (lines 171-180):
- Handle search input's X button (clear)
- Validate input against available options

**#setupULListeners()** (lines 421-442):
- Click handler for item selection
- Beforetoggle for popover state
- Keyboard navigation (Arrow keys, Enter)

## DOM Structure

### Shadow DOM Template (lines 452-480)

```html
<label part="row">                           <!-- If label attribute -->
  <span part="label">Label Text</span>       <!-- With abbr if required -->
</label>
<input
  autocomplete="off"
  enterkeyhint="search"
  inputmode="search"
  list="{listId}"                            <!-- Only if datalist mode -->
  minlength="{minLength}"
  part="input"
  placeholder="{placeholder}"
  spellcheck="false"
  style="anchor-name:--{listId}"             <!-- CSS anchor for popover -->
  type="search"
  value="{displayValue}">
<ul|datalist                                 <!-- Based on listMode -->
  popover                                    <!-- ul only -->
  id="{listId}"
  part="list"
  role="listbox"                             <!-- ul only -->
  style="position-anchor:--{listId}"         <!-- ul only -->
>
</ul|datalist>
<nav part="slots">
  <slot name="info" part="info"></slot>
  <slot name="status" part="status"></slot>
</nav>
```

### CSS Parts for External Styling

| Part | Element | Purpose |
|------|---------|---------|
| `row` | label | Label wrapper |
| `label` | span | Label text |
| `input` | input | Search input field |
| `list` | ul/datalist | Suggestions container |
| `slots` | nav | Slots container |
| `info` | slot | Info slot |
| `status` | slot | Status slot |

## Public API

### Properties

| Property | Type | Access | Purpose |
|----------|------|--------|---------|
| `displayValue` | String | get/set | Text shown in input |
| `value` | String | get/set | Underlying value (ID) |
| `input` | HTMLInputElement | get | Input element reference |
| `list` | HTMLElement | get | List element reference |
| `data` | Array | get/set | Current filtered results |
| `fullDataset` | Array | get | Complete cached dataset |
| `settings` | Object | get | Normalized configuration |

### Methods

| Method | Parameters | Returns | Purpose |
|--------|------------|---------|---------|
| `fetchData(value)` | String | Promise | Routes to fetch strategy |
| `fetchApiData(value)` | String | Promise | Fetches from API |
| `fetchLocalData(value)` | String | Promise | Filters cached data |
| `filterLocalData(query)` | String | Array | Dispatches to filter method |
| `filterByKeywords(query)` | String | Array | Multi-term filter |
| `filterByFuzzy(query)` | String | Array | Levenshtein filter |
| `render(data)` | Array | String | Generates HTML |
| `reset(fullReset)` | Boolean | void | Clears suggestions |
| `resetToDefault()` | None | void | Restores initial state |
| `selectItem(target)` | HTMLElement | void | Handles selection |
| `getNestedValue(obj, key)` | Object, String | any | Dot-path access |
| `transformSearchText(text)` | String | String | Normalizes text |
| `updateInfo(message)` | String | void | Updates info slot |
| `updateStatus(message)` | String | void | Updates status slot |

## Attributes Reference

### Required

| Attribute | Type | Purpose |
|-----------|------|---------|
| `api` | URL | API endpoint or local data file path |

### Search Configuration

| Attribute | Type | Default | Purpose |
|-----------|------|---------|---------|
| `search-mode` | String | 'api' | Search strategy |
| `search-fields` | CSV | apiDisplayPath | Fields to search |
| `search-operator` | String | 'AND' | Keyword logic |
| `search-transform` | String | 'lowercase' | Text normalization |
| `min-score` | Float | 0.6 | Fuzzy match threshold |
| `max-results` | Integer | 50 | Max fuzzy results |

### API Configuration

| Attribute | Type | Purpose |
|-----------|------|---------|
| `api-value-path` | String | Dot-path to result ID |
| `api-display-path` | String | Dot-path to display text |
| `api-text-path` | String | Dot-path to secondary text |
| `api-array-path` | String | Dot-path to results array |

### Behavior

| Attribute | Type | Default | Purpose |
|-----------|------|---------|---------|
| `cache` | Boolean | false | Enable result caching |
| `debounce` | Integer | 300 | Debounce time (ms) |
| `minlength` | Integer | 3 | Min chars to search |
| `nolimit` | Boolean | false | Allow free text |
| `noform` | Boolean | false | Disable form integration |
| `noshadow` | Boolean | false | Use light DOM |
| `nomount` | Boolean | false | Defer mounting |

### Display

| Attribute | Type | Purpose |
|-----------|------|---------|
| `display` | String | Initial display value |
| `value` | String | Initial underlying value |
| `label` | String | Input label text |
| `placeholder` | String | Input placeholder |
| `invalid` | String | Validation message |

### UI Modes

| Attribute | Type | Default | Purpose |
|-----------|------|---------|---------|
| `list-mode` | String | 'datalist' | 'datalist' or 'ul' |

### Templates

| Attribute | Type | Default | Purpose |
|-----------|------|---------|---------|
| `info-template` | String | '{count} items loaded' | Info slot template |
| `status-template` | String | null | Status slot template |

## Integration Patterns

### Basic API Search

```html
<auto-suggest
  api="https://api.example.com/search?q="
  api-value-path="id"
  api-display-path="name"
  label="Search"
  placeholder="Type to search">
</auto-suggest>
```

### Local Keyword Search (Multi-Column)

```html
<auto-suggest
  api="products.json"
  search-mode="local-keywords"
  search-fields="name,category,description"
  api-value-path="id"
  api-display-path="name"
  label="Search Products"
  placeholder="e.g., coffee cups">
</auto-suggest>
```

### Fuzzy Search with Typo Tolerance

```html
<auto-suggest
  api="products.json"
  search-mode="local-fuzzy"
  search-fields="name,description"
  min-score="0.5"
  max-results="20"
  api-value-path="id"
  api-display-path="name"
  label="Fuzzy Search">
</auto-suggest>
```

### Custom Popover List with Status

```html
<auto-suggest
  api="users.json"
  search-mode="local"
  api-value-path="id"
  api-display-path="name"
  list-mode="ul"
  info-template="{count} users available"
  status-template="Selected: {display}"
  label="Select User"
  noshadow>
  <small slot="info"></small>
  <small slot="status"></small>
</auto-suggest>
```

### Form Integration

```html
<form id="myForm">
  <auto-suggest
    name="product"
    api="products.json"
    search-mode="local"
    api-value-path="id"
    api-display-path="name">
  </auto-suggest>
</form>

<script>
const form = document.getElementById('myForm');
const suggest = form.elements.product;

form.addEventListener('submit', (e) => {
  e.preventDefault();
  console.log(suggest.value);        // ID
  console.log(suggest.displayValue); // Display name
});
</script>
```

### Event Handling

```javascript
const suggest = document.querySelector('auto-suggest');

suggest.addEventListener('autoSuggestSelect', (e) => {
  console.log('Selected:', e.detail);
  if (e.detail.isInitial) {
    console.log('This was set from initial/reset value');
  }
});

suggest.addEventListener('autoSuggestClear', () => {
  console.log('Input was cleared');
});

suggest.addEventListener('autoSuggestFetchError', (e) => {
  console.error('Fetch failed:', e.detail);
});
```

## CSS Styling

### Default Styles (index.css)

```css
:host {
  background-color: GrayText;
  border: 2px dotted CanvasText;
  display: block;
  padding: 1ch;
}

:host input {
  border: 0;
  display: block;
  font-size: inherit;
  padding: 1ch 1.5ch;
  width: 100%;
}
```

### Custom Styling via Parts

```css
auto-suggest::part(input) {
  background: white;
  border: 1px solid #ccc;
  border-radius: 4px;
}

auto-suggest::part(list) {
  max-height: 400px;
  overflow-y: auto;
}

auto-suggest::part(label) {
  font-weight: bold;
  color: #333;
}
```

## Deep Dives

### Search Text Preprocessing (lines 228-235)

When using local search modes, each item is preprocessed once on initial load:

```javascript
data.forEach(item => {
  const searchText = searchFields
    .map(field => this.getNestedValue(item, field) || '')
    .join(' ');
  item._searchText = this.transformSearchText(searchText);
});
```

**Why this matters:**
- Search fields are concatenated into single searchable string
- Text transformation applied once, not on every keystroke
- `_searchText` property added to each item for fast filtering
- Memory trade-off: ~20-30% overhead for faster searches

### Auto-Fill Detection (lines 158-165)

```javascript
if (e.inputType === "insertReplacementText" || e.inputType == null) {
  // Browser auto-fill detected
  const matchedOption = [...this.list.options].find(
    option => option.value === value
  );
  if (matchedOption) {
    // Auto-select and dispatch
  }
}
```

**Why this matters:**
- Browser auto-fill sends different inputType than manual typing
- Older browsers may have null inputType
- Component auto-selects if auto-filled value matches an option
- Prevents user from needing to manually select after auto-fill

### Popover Positioning (template, line 464-470)

```javascript
<input ... style="anchor-name:--${listId}">
<ul ... style="position-anchor:--${listId}">
```

**CSS Anchor Positioning:**
- Modern CSS feature for connecting elements
- Input becomes the anchor element
- Popover positions relative to anchor
- Falls back gracefully in older browsers
- Used only in `ul` list mode

### Form Value Synchronization

FormElement base class handles form association:

```javascript
// Getting value
get value() {
  return this.isFormElement ?
    (this.#internals?.elementInternals?.value ?? this.getAttribute('value') ?? '') :
    null;
}

// Setting value
set value(v) {
  if (!this.isFormElement) return;
  const name = this.getAttribute('name');
  this.#internals.setFormValue(v, name || '');
  this.setAttribute('value', v || '');
}
```

**Dual values:**
- `value` - The underlying ID/key sent to server
- `displayValue` - The human-readable text shown in input

## Gotchas and Edge Cases

### 1. Empty API Response (line 211)

**Issue:** When `apiArrayPath` is set but response structure differs.

**Code:**
```javascript
this.getNestedValue(data, this.settings.apiArrayPath) || (Array.isArray(data) ? data : [])
```

**Impact:** Component falls back to treating response as array or empty array.

### 2. Search Text Preprocessing Timing (lines 228-235)

**Issue:** `_searchText` is preprocessed once during initial load.

**Impact:** Changes to data after load won't be re-indexed. For dynamic data, use API mode.

### 3. Fuzzy Matching Edge Cases (line 329)

**Issue:** Single character queries may have inconsistent scoring.

**Code:**
```javascript
targetWords = item._searchText.split(/\s+/)
```

**Impact:** Fuzzy matching splits on whitespace; special characters in words affect matching.

### 4. inputType Browser Compatibility (line 161)

**Issue:** Some browsers don't set `inputType` for auto-fill.

**Code:**
```javascript
e.inputType === "insertReplacementText" || e.inputType == null
```

**Impact:** Null check handles older browsers.

### 5. JSON Escaping for Attributes (line 363)

**Issue:** Objects stored in data attributes need proper escaping.

**Code:**
```javascript
const dataObj = this.escapeJsonForHtml(obj);
```

**Impact:** Prevents XSS and parsing errors from special characters.

### 6. Memory in ul Mode (lines 262-266)

**Issue:** List HTML completely replaced on each fetch.

**Impact:** For large result sets (>1000 items), consider pagination.

### 7. minLength Validation (lines 153-155)

**Issue:** If input length < minLength, suggestions are cleared but no validation message.

**Impact:** Users may not understand why results disappeared.

### 8. Form Association (line 80)

**Issue:** Requires ElementInternals for form submission.

**Code:**
```javascript
this.#internals.setFormValue(v, name || '');
```

**Impact:** Older browsers without support won't include value in FormData.

### 9. Nested Path Access (line 355)

**Issue:** Invalid dot-notation paths return undefined.

**Code:**
```javascript
key.split('.').reduce((acc, part) => acc?.[part], obj)
```

**Impact:** Missing paths result in empty display/value.

### 10. Cache Behavior (line 204)

**Issue:** When `cache="true"`, subsequent queries use cached data.

**Code:**
```javascript
if (!this.settings.cache || !this.data.length)
```

**Impact:** Dynamic APIs should disable cache for fresh results.

## Dependencies

### External Package

```json
{
  "dependencies": {
    "@browser.style/common": "^1.0.1"
  }
}
```

### Inherited from FormElement

| Method | Purpose |
|--------|---------|
| `debounced(delay, fn)` | Returns debounced function |
| `escapeJsonForHtml(obj)` | Escapes JSON for attributes |
| `uuid()` | Generates unique ID |
| `mount()` | Manual initialization |
| `register()` | Registers custom element |

### Browser APIs Used

| API | Purpose |
|-----|---------|
| `ElementInternals` | Form association |
| `CustomEvent` | Event dispatching |
| `CSSStyleSheet` | Dynamic style loading |
| `ShadowDOM` | Encapsulation |
| `CSS Anchor Positioning` | Popover alignment |
| `Popover API` | Native popover management |

## Performance Considerations

### API Mode
- **Debounce:** Default 300ms prevents excessive requests
- **Caching:** Optional caching reduces repeat API calls
- **Network:** Each keystroke (after debounce) triggers fetch

### Local Mode
- **Initial Load:** One-time fetch at first query ≥ minLength
- **Memory:** Entire dataset held in fullDataset
- **Preprocessing:** `_searchText` computed once during load
- **Search Speed:** Fastest mode, no network latency

### Local Keywords Mode
- **Algorithmic:** O(n) filter with string.includes() checks
- **Scaling:** Acceptable for datasets < 100k items
- **Memory:** Preprocessed search text adds ~20-30% overhead

### Local Fuzzy Mode
- **Algorithmic:** O(n*m*k) where n=items, m=words, k=terms
- **Levenshtein:** Dynamic programming is expensive
- **Recommendation:** max-results should be low (10-20) for UX
- **Scaling:** Best for < 10k items, slow with > 100k

## Version History

### v1.1.0 (Current)

- Four search modes (api, local, local-keywords, local-fuzzy)
- Fuzzy matching with Levenshtein distance
- Multi-field keyword search with AND/OR logic
- Status and info slots
- Support for both datalist and ul popover modes
- CSS anchor positioning for proper alignment
- Form integration with displayValue property

### v2 (Legacy, in v2/ folder)

- Uses FormControl base class instead of FormElement
- Missing advanced search modes
- Missing status/info slots
- Missing modern CSS features

### Basic Version (basic/uiAutoSuggest.js)

- Simple functional implementation
- Pure function-based initialization
- Uses dataset attributes
- Limited feature set
- No shadow DOM support
