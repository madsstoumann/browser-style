
# `<auto-suggest>` Web Component

The `<auto-suggest>` is a custom web component that provides an input field with auto-suggest functionality. It dynamically fetches suggestions from an API endpoint as the user types and displays them in a dropdown list.

## How to Use

### Basic Implementation

To use the `<auto-suggest>` component in your HTML, include it in your HTML file like so:

```html
<auto-suggest
  api="https://example.com/api/suggestions"
  api-display-path="data.display"
  api-value-path="data.value"
  display="Initial Display Value"
  value="initialValue"
  label="Search:"
  name="searchField"
  initial-object='{"data": {"display": "Initial Display Value", "value": "initialValue"}}'
  form="myFormID"
  cache="true"
  event-mode="both"
></auto-suggest>
```

### Attributes

The `<auto-suggest>` component accepts the following attributes:

- **`api`**: *(Required)* The URL of the API endpoint that returns suggestion data based on the user's input.

- **`api-display-path`**: *(Required)* The dot-notated path in the API response object where the display value (visible in the suggestion dropdown) is located.

- **`api-value-path`**: *(Required)* The dot-notated path in the API response object where the actual value (to be submitted) is located.

- **`display`**: *(Optional)* The initial display value for the input field. This is what the user sees initially.

- **`value`**: *(Optional)* The initial hidden value for the input field. This is the value that gets submitted with the form.

- **`label`**: *(Optional)* A label for the input field. If provided, a `<label>` element will be rendered alongside the input field.

- **`name`**: *(Optional)* The name attribute for the hidden input field, used in form submissions.

- **`initial-object`**: *(Optional)* A JSON string representing the initial object data. This can be used to set both the initial display and value fields dynamically.

- **`form`**: *(Optional)* The ID of the form the input field is associated with.

- **`cache`**: *(Optional)* A boolean (`true` or `false`) that determines if the fetched data should be cached. Default is `false`.

- **`event-mode`**: *(Optional)* Defines how events are dispatched. Possible values are:
  - `custom`: Dispatches a custom event when a suggestion is selected.
  - `input`: Triggers an `input` event when a suggestion is selected.
  - `both`: Triggers both `custom` and `input` events.

### Examples

#### Example 1: Basic Usage

```html
<auto-suggest
  api="https://example.com/api/suggestions"
  api-display-path="suggestion.name"
  api-value-path="suggestion.id"
  label="Search Suggestions"
  name="suggestions"
></auto-suggest>
```

#### Example 2: With Initial Values and Form Association

```html
<form id="searchForm">
  <auto-suggest
    api="https://example.com/api/suggestions"
    api-display-path="result.displayName"
    api-value-path="result.id"
    display="Start typing..."
    value="123"
    label="Search:"
    name="search"
    form="searchForm"
    initial-object='{"result": {"displayName": "Start typing...", "id": "123"}}'
    cache="true"
    event-mode="both"
  ></auto-suggest>
  <button type="submit">Submit</button>
</form>
```

#### Example 3: Custom Event Handling

You can listen for the `autoSuggestSelect` custom event to handle suggestion selection:

```javascript
document.querySelector('auto-suggest').addEventListener('autoSuggestSelect', (event) => {
  console.log('Selected Suggestion:', event.detail);
});
```

### Custom Events

- **`autoSuggestSelect`**: Dispatched when a suggestion is selected. The event `detail` contains the selected suggestion data.

- **`autoSuggestFetchStart`**: Dispatched when fetching suggestions from the API begins.

- **`autoSuggestFetchEnd`**: Dispatched when fetching suggestions from the API completes successfully.

- **`autoSuggestFetchError`**: Dispatched when there is an error fetching suggestions from the API. The event `detail` contains the error information.

- **`autoSuggestNoResults`**: Dispatched when no results are returned from the API.

- **`autoSuggestClear`**: Dispatched when the input is cleared or reset.

### Conclusion

The `<auto-suggest>` web component provides a powerful, customizable input field with dynamic suggestions, suitable for any web application requiring a rich, user-friendly search experience.

Feel free to customize the component further based on your specific requirements!
