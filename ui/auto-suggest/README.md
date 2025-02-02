# AutoSuggest

A customizable web component that provides search input with auto-suggest functionality, supporting both datalist and popover list modes.

## Installation

```bash
npm install @browser.style/auto-suggest
```

## Usage

```javascript
import '@browser.style/auto-suggest';
```

```html
<!-- Basic usage with datalist -->
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
```

## Attributes

- `api` (required): API endpoint for fetching suggestions
- `api-value-path`: Path to value in API response
- `api-display-path`: Path to display text in API response
- `api-text-path`: Path to additional text in API response
- `api-array-path`: Path to array in nested API response
- `cache`: Enable result caching (true/false)
- `debounce`: Debounce time in ms (default: 300)
- `display`: Initial display value
- `invalid`: Custom validation message
- `label`: Input label
- `list-mode`: Display mode ('datalist' or 'ul')
- `minlength`: Min. characters before search (default: 3)
- `noform`: Exclude from form submission
- `nolimit`: Allow free text input
- `value`: Initial value

## Events

- `autoSuggestSelect`: Option selected
- `autoSuggestClear`: Input cleared
- `autoSuggestFetchStart`: Fetch started
- `autoSuggestFetchEnd`: Fetch completed
- `autoSuggestFetchError`: Fetch failed
- `autoSuggestNoResults`: No results found
- `autoSuggestNoSelection`: Enter pressed (requires nolimit)

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
