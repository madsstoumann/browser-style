
# AutoSuggest Web Component

The `AutoSuggest` web component is a custom HTML element that provides a flexible and accessible autosuggest functionality using the built-in `<datalist>` element.

## Features

- Fetch suggestions from an API
- Debounced input handling
- Keyboard navigation support
- Customizable via attributes
- Emits custom events for better control and feedback

## Installation

Include the `AutoSuggest` component script in your project. Ensure you have defined your component in a JavaScript file and included it in your HTML.

```html
<script type="module" src="./path/to/AutoSuggest.js"></script>
```

## Usage

### HTML

```html
<auto-suggest
    id="nationalize"
    api="https://api.nationalize.io/?name="
    key="name"
    label="Nationalize.io"
    minlength="3"
    placeholder="Type a name"
    autocomplete="off"
    spellcheck="false"
    type="search"
    cache="false"
    invalid="Invalid selection"
    limit="true"
    shadow="true">
</auto-suggest>
```

### JavaScript

Add event listeners and set a callback for the `auto-suggest` component.

```javascript
document.addEventListener('DOMContentLoaded', () => {
    const nationalize = document.getElementById('nationalize');

    // Set a custom callback for handling fetched data
    nationalize.setCallback((list, data) => {
        const country = data.country;
        list.innerHTML = country.map(obj => 
            `<option value="\${data.name} — Country: \${obj.country_id}, Probability: \${(obj.probability * 100).toFixed(2)}%" data-obj='\${obj ? JSON.stringify(obj):''}'>`
        ).join('');
    });

    // Add event listeners for custom events
    nationalize.addEventListener('autoSuggestFetchStart', () => {
        console.log('Fetch started');
    });

    nationalize.addEventListener('autoSuggestFetchEnd', () => {
        console.log('Fetch ended');
    });

    nationalize.addEventListener('autoSuggestFetchError', (event) => {
        console.log('Fetch error', event.detail);
    });

    nationalize.addEventListener('autoSuggestNoResults', () => {
        console.log('No results found');
    });

    nationalize.addEventListener('autoSuggestHighlight', (event) => {
        console.log('Highlighted option', event.detail);
    });

    nationalize.addEventListener('autoSuggestSelect', (event) => {
        console.log('Selection made', event.detail);
    });
});
```

## Attributes

- **api**: The URL of the API to fetch suggestions from. Example: `https://api.nationalize.io/?name=`.
- **key**: The key to extract the suggestion value from the fetched data. Supports nested keys using dot notation.
- **label**: The label for the input field.
- **minlength**: The minimum number of characters required to trigger the fetch. Default is `3`.
- **placeholder**: The placeholder text for the input field.
- **autocomplete**: The autocomplete attribute for the input field. Default is `off`.
- **spellcheck**: The spellcheck attribute for the input field. Default is `false`.
- **type**: The type attribute for the input field. Default is `search`.
- **cache**: If `true`, caches the fetched results. Default is `false`.
- **invalid**: The message to display when the input is invalid. Default is `Invalid selection`.
- **limit**: If `true`, the input value must match one of the suggestions. Default is `true`.
- **shadow**: If `true`, renders the component in the shadow DOM. Default is `false`.

## Custom Events

- **autoSuggestFetchStart**: Fired when a fetch request starts.
- **autoSuggestFetchEnd**: Fired when a fetch request ends.
- **autoSuggestFetchError**: Fired when a fetch request encounters an error. The event detail contains the error.
- **autoSuggestNoResults**: Fired when no results are found.
- **autoSuggestHighlight**: Fired when an option is highlighted using the keyboard. The event detail contains the highlighted option.
- **autoSuggestSelect**: Fired when a suggestion is selected. The event detail contains the selected option.

## Methods

### `setCallback(callback)`

Sets a custom callback function to handle the fetched data.

```javascript
function customCallback(list, data) {
    // Custom processing of the fetched data
}
autoSuggestElement.setCallback(customCallback);
```

## Example

Here is a complete example:

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>AutoSuggest Example</title>
    <script type="module" src="./path/to/AutoSuggest.js"></script>
</head>
<body>
    <auto-suggest
        id="nationalize"
        api="https://api.nationalize.io/?name="
        key="name"
        label="Nationalize.io"
        minlength="3"
        placeholder="Type a name"
        autocomplete="off"
        spellcheck="false"
        type="search"
        cache="false"
        invalid="Invalid selection"
        limit="true"
        shadow="true">
    </auto-suggest>

    <script type="module">
        document.addEventListener('DOMContentLoaded', () => {
            const nationalize = document.getElementById('nationalize');

            // Set a custom callback for handling fetched data
            nationalize.setCallback((list, data) => {
                const country = data.country;
                list.innerHTML = country.map(obj => 
                    `<option value="\${data.name} — Country: \${obj.country_id}, Probability: \${(obj.probability * 100).toFixed(2)}%" data-obj='\${obj ? JSON.stringify(obj):''}'>`
                ).join('');
            });

            // Add event listeners for custom events
            nationalize.addEventListener('autoSuggestFetchStart', () => {
                console.log('Fetch started');
            });

            nationalize.addEventListener('autoSuggestFetchEnd', () => {
                console.log('Fetch ended');
            });

            nationalize.addEventListener('autoSuggestFetchError', (event) => {
                console.log('Fetch error', event.detail);
            });

            nationalize.addEventListener('autoSuggestNoResults', () => {
                console.log('No results found');
            });

            nationalize.addEventListener('autoSuggestHighlight', (event) => {
                console.log('Highlighted option', event.detail);
            });

            nationalize.addEventListener('autoSuggestSelect', (event) => {
                console.log('Selection made', event.detail);
            });
        });
    </script>
</body>
</html>
```
