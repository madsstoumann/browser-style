# AutoSuggest Web Component

A custom input component that provides real-time search suggestions from an API endpoint.

## Installation

```js
import { AutoSuggest } from './index.js';
AutoSuggest.mount();
```

## Basic Usage

```html
<auto-suggest
  api="https://api.example.com/search"
  api-display-path="name"
  api-value-path="id"
  label="Search"
  name="search"
  placeholder="Start typing...">
</auto-suggest>
```

## Attributes

- **

api

** (Required): API endpoint URL for fetching suggestions
- **

api-array-path

**: Path to the array in the API response
- **

api-display-path

**: Path to the display value in each suggestion 
- **

api-value-path

**: Path to the value in each suggestion
- **

api-text-path

**: Optional additional text to show with each suggestion
- **

cache

**: Whether to cache API results (`true`/`false`)
- **

display

**: Initial display text
- **

event-mode

**: Event dispatch mode (

custom

, 

input

, or `both`)
- **

form

**: ID of associated form
- **`initial-object`**: Initial data object as JSON string
- **

invalid

**: Custom validation message
- **

label

**: Label text for the input
- **

limit

**: Whether to limit selections to suggestions (`true`/`false`) 
- **

list-mode

**: List rendering mode (`datalist` or `ul`)
- **

name

**: Input name attribute
- **`placeholder`**: Input placeholder text
- **

value

**: Initial hidden input value

## Events

- **`autoSuggestSelect`**: Fired when a suggestion is selected
- **`autoSuggestFetchStart`**: Fired when API request starts
- **`autoSuggestFetchEnd`**: Fired when API request completes
- **`autoSuggestFetchError`**: Fired if API request fails
- **`autoSuggestNoResults`**: Fired when API returns no results
- **`autoSuggestClear`**: Fired when the input is cleared

## Examples

### With Custom Event Handling

```html
<auto-suggest 
  api="/api/search"
  event-mode="custom"
  label="Search Products"
  list-mode="ul">
</auto-suggest>

<script>
document.querySelector('auto-suggest').addEventListener('autoSuggestSelect', (e) => {
  console.log('Selected:', e.detail);
});
</script>
```

### With Form Integration

```html
<form id="searchForm">
  <auto-suggest
    api="/api/search"
    form="searchForm" 
    name="productId"
    cache="true"
    limit="true">
  </auto-suggest>
</form>
```

The component supports keyboard navigation, form integration, and customizable suggestion rendering. It handles validation and maintains both a display value and hidden value for the selected suggestion.